// /api/admin/products — CRUD san pham (master) + bang phu prices + attributes
// Tat ca route deu yeu cau role admin (da check o admin.js cha)

const express = require('express');
const db = require('../../db');

const router = express.Router();

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function pickPayload(body, { isUpdate = false } = {}) {
  const out = {};
  if (body.code !== undefined)            out.code = String(body.code).trim();
  if (body.name !== undefined)            out.name = String(body.name).trim();
  if (body.category_id !== undefined)     out.category_id = body.category_id ? Number(body.category_id) : null;
  if (body.image_url !== undefined)       out.image_url = body.image_url || null;
  if (body.thumbnail_url !== undefined)   out.thumbnail_url = body.thumbnail_url || null;
  if (body.warranty_months !== undefined) out.warranty_months = Number(body.warranty_months) || 0;
  if (body.cost_price !== undefined)      out.cost_price = Number(body.cost_price) || 0;
  if (body.description !== undefined)     out.description = body.description ? String(body.description) : null;

  if (!isUpdate) {
    if (!out.code) throw httpErr(400, 'Thieu ma thiet bi');
    if (!out.name) throw httpErr(400, 'Thieu ten san pham');
  }
  return out;
}

function normalizePrices(arr) {
  if (!Array.isArray(arr)) return [];
  // Moi item: { tier_id, price }. Bo qua item thieu tier_id.
  // Loc trung tier_id (chi giu cai cuoi cung) — UNIQUE (product_id, tier_id) o DB.
  const seen = new Map();
  arr.forEach((t, i) => {
    if (!t) return;
    const tid = Number(t.tier_id);
    if (!tid) return;
    seen.set(tid, {
      tier_id: tid,
      price: Number(t.price) || 0,
      sort_order: i + 1,
    });
  });
  return Array.from(seen.values());
}

function normalizeAttrs(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(t => t && String(t.label || '').trim() !== '')
    .map((t, i) => ({
      label: String(t.label).trim(),
      value: t.value !== undefined && t.value !== null ? String(t.value) : null,
      position: t.position === 'bottom' ? 'bottom' : 'top',
      sort_order: i + 1,
    }));
}

function normalizeBlocks(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  arr.forEach((b, i) => {
    if (!b) return;
    const t = b.block_type;
    if (!['text', 'image', 'video'].includes(t)) return;
    const content = String(b.content || '').trim();
    if (!content) return;
    out.push({
      block_type: t,
      content,
      caption: b.caption ? String(b.caption) : null,
      sort_order: i + 1,
    });
  });
  return out;
}

// ---- GET /api/admin/products ----------------------------------
// Query: ?q, ?category_id, ?page, ?limit
router.get('/', async (req, res, next) => {
  try {
    const q          = (req.query.q || '').trim();
    const categoryId = req.query.category_id ? Number(req.query.category_id) : null;
    const page       = Math.max(1, parseInt(req.query.page) || 1);
    const limit      = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset     = (page - 1) * limit;

    const where = ['p.is_deleted = 0'];
    const args = [];
    if (q) {
      where.push('(p.code LIKE ? OR p.name LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like);
    }
    if (categoryId) {
      where.push('p.category_id = ?');
      args.push(categoryId);
    }
    const whereSql = 'WHERE ' + where.join(' AND ');

    const [count] = await db.query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, args);
    const [rows] = await db.query(
      `SELECT p.id, p.code, p.name, p.category_id, p.image_url, p.thumbnail_url,
              p.warranty_months, p.cost_price, p.description,
              c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         ${whereSql}
         ORDER BY p.id DESC
         LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    res.json({ items: rows, total: count[0].total, page, limit });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/products/:id (kem prices + attributes) ---
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = ? AND p.is_deleted = 0`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay san pham' });

    const [prices] = await db.query(
      `SELECT pp.id, pp.tier_id, pt.code AS tier_code, pt.name AS tier_name,
              pp.price, pp.sort_order
         FROM product_prices pp
         JOIN price_tiers pt ON pt.id = pp.tier_id
        WHERE pp.product_id = ?
        ORDER BY pt.sort_order, pp.id`,
      [req.params.id]
    );
    const [attrs] = await db.query(
      `SELECT id, label, value, position, sort_order FROM product_attributes
        WHERE product_id = ? ORDER BY sort_order, id`,
      [req.params.id]
    );
    const [blocks] = await db.query(
      `SELECT id, block_type, content, caption, sort_order FROM product_blocks
        WHERE product_id = ? ORDER BY sort_order, id`,
      [req.params.id]
    );
    res.json({ ...rows[0], prices, attributes: attrs, blocks });
  } catch (err) { next(err); }
});

// ---- POST /api/admin/products (transaction) ------------------
router.post('/', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const data   = pickPayload(req.body, { isUpdate: false });
    const prices = normalizePrices(req.body.prices);
    const attrs  = normalizeAttrs(req.body.attributes);
    const blocks = normalizeBlocks(req.body.blocks);

    await conn.beginTransaction();

    const [dup] = await conn.query(
      `SELECT id FROM products WHERE code = ? AND is_deleted = 0 LIMIT 1`, [data.code]
    );
    if (dup.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'Ma thiet bi da ton tai' });
    }

    const cols = Object.keys(data);
    const placeholders = cols.map(() => '?').join(', ');
    const values = cols.map(c => data[c]);
    const [r] = await conn.query(
      `INSERT INTO products (${cols.join(', ')}) VALUES (${placeholders})`,
      values
    );
    const id = r.insertId;

    if (prices.length) {
      const pVals = prices.map(p => [id, p.tier_id, p.price, p.sort_order]);
      await conn.query(
        `INSERT INTO product_prices (product_id, tier_id, price, sort_order) VALUES ?`,
        [pVals]
      );
    }
    if (attrs.length) {
      const aVals = attrs.map(a => [id, a.label, a.value, a.position, a.sort_order]);
      await conn.query(
        `INSERT INTO product_attributes (product_id, label, value, position, sort_order) VALUES ?`,
        [aVals]
      );
    }
    if (blocks.length) {
      const bVals = blocks.map(b => [id, b.block_type, b.content, b.caption, b.sort_order]);
      await conn.query(
        `INSERT INTO product_blocks (product_id, block_type, content, caption, sort_order) VALUES ?`,
        [bVals]
      );
    }

    await conn.commit();
    res.status(201).json({ id });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- PUT /api/admin/products/:id (transaction) ---------------
// Neu body co prices / attributes -> ghi de toan bo (delete all + insert lai)
router.put('/:id', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id     = req.params.id;
    const data   = pickPayload(req.body, { isUpdate: true });
    const prices = normalizePrices(req.body.prices);
    const attrs  = normalizeAttrs(req.body.attributes);
    const blocks = normalizeBlocks(req.body.blocks);

    await conn.beginTransaction();

    const [exist] = await conn.query(
      `SELECT id FROM products WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!exist.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Khong tim thay san pham' });
    }

    if (data.code) {
      const [dup] = await conn.query(
        `SELECT id FROM products WHERE code = ? AND id <> ? AND is_deleted = 0 LIMIT 1`,
        [data.code, id]
      );
      if (dup.length) {
        await conn.rollback();
        return res.status(409).json({ error: 'Ma thiet bi da ton tai' });
      }
    }

    const cols = Object.keys(data);
    if (cols.length) {
      const setSql = cols.map(c => `${c} = ?`).join(', ');
      const values = cols.map(c => data[c]);
      await conn.query(`UPDATE products SET ${setSql} WHERE id = ?`, [...values, id]);
    }

    if (req.body.prices !== undefined) {
      await conn.query(`DELETE FROM product_prices WHERE product_id = ?`, [id]);
      if (prices.length) {
        const pVals = prices.map(p => [id, p.tier_id, p.price, p.sort_order]);
        await conn.query(
          `INSERT INTO product_prices (product_id, tier_id, price, sort_order) VALUES ?`,
          [pVals]
        );
      }
    }
    if (req.body.attributes !== undefined) {
      await conn.query(`DELETE FROM product_attributes WHERE product_id = ?`, [id]);
      if (attrs.length) {
        const aVals = attrs.map(a => [id, a.label, a.value, a.position, a.sort_order]);
        await conn.query(
          `INSERT INTO product_attributes (product_id, label, value, position, sort_order) VALUES ?`,
          [aVals]
        );
      }
    }
    if (req.body.blocks !== undefined) {
      await conn.query(`DELETE FROM product_blocks WHERE product_id = ?`, [id]);
      if (blocks.length) {
        const bVals = blocks.map(b => [id, b.block_type, b.content, b.caption, b.sort_order]);
        await conn.query(
          `INSERT INTO product_blocks (product_id, block_type, content, caption, sort_order) VALUES ?`,
          [bVals]
        );
      }
    }

    await conn.commit();
    res.json({ id });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ==============================================================
// CUSTOMER-PRICES: gia rieng cho 1 dai ly + 1 san pham (override).
// Priority resolve: customer_product_prices > product_prices(default_tier_id)
//                   > product_prices(is_default).
// Chi cho phep gan cho dai ly (customers.type='dealer') — khach le khong co cap.
// ==============================================================

// ---- GET /api/admin/products/:id/customer-prices ------------
// Tra ve list cac dai ly da co gia rieng cho san pham nay.
router.get('/:id/customer-prices', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT cpp.id, cpp.customer_id, cpp.price,
              c.code AS customer_code, c.full_name AS customer_name,
              c.phone AS customer_phone, c.company_name,
              c.default_tier_id, pt.name AS tier_name
         FROM customer_product_prices cpp
         JOIN customers c ON c.id = cpp.customer_id
         LEFT JOIN price_tiers pt ON pt.id = c.default_tier_id
        WHERE cpp.product_id = ? AND c.is_deleted = 0
        ORDER BY c.full_name, c.id`,
      [req.params.id]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ---- PUT /api/admin/products/:id/customer-prices ------------
// Body: { customer_id, price }
// Upsert gia override. Validate customer ton tai + la dai ly.
router.put('/:id/customer-prices', async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    const customerId = Number(req.body.customer_id);
    const price = Number(req.body.price);

    if (!customerId) return res.status(400).json({ error: 'Thieu customer_id' });
    if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: 'Gia khong hop le' });

    const [c] = await db.query(
      `SELECT id, type FROM customers WHERE id = ? AND is_deleted = 0`, [customerId]
    );
    if (!c.length) return res.status(404).json({ error: 'Khach hang khong ton tai' });
    if (c[0].type !== 'dealer') {
      return res.status(400).json({ error: 'Chi gan gia rieng cho dai ly' });
    }

    const [p] = await db.query(
      `SELECT id FROM products WHERE id = ? AND is_deleted = 0`, [productId]
    );
    if (!p.length) return res.status(404).json({ error: 'San pham khong ton tai' });

    await db.query(
      `INSERT INTO customer_product_prices (customer_id, product_id, price)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE price = VALUES(price)`,
      [customerId, productId, price]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ---- DELETE /api/admin/products/:id/customer-prices/:customerId ----
// Hard delete override (chi la config, khong audit).
router.delete('/:id/customer-prices/:customerId', async (req, res, next) => {
  try {
    const [r] = await db.query(
      `DELETE FROM customer_product_prices WHERE product_id = ? AND customer_id = ?`,
      [req.params.id, req.params.customerId]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay gia rieng' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ---- DELETE /api/admin/products/:id (soft delete) -----------
router.delete('/:id', async (req, res, next) => {
  try {
    const [linked] = await db.query(
      `SELECT
         COALESCE((SELECT quantity FROM product_stock WHERE product_id = ?), 0) AS stock_qty,
         COALESCE((SELECT SUM(qty) FROM staff_holdings WHERE product_id = ?), 0) AS held_qty,
         COALESCE((SELECT SUM(qty) FROM release_pool WHERE product_id = ?), 0) AS pool_qty`,
      [req.params.id, req.params.id, req.params.id]
    );
    const total = Number(linked[0].stock_qty) + Number(linked[0].held_qty) + Number(linked[0].pool_qty);
    if (total > 0) {
      return res.status(409).json({
        error: `Khong the xoa: con ${total} don vi (kho ${linked[0].stock_qty}, KTV giu ${linked[0].held_qty}, cho nhan ${linked[0].pool_qty})`,
      });
    }

    const [r] = await db.query(
      `UPDATE products SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay san pham' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
