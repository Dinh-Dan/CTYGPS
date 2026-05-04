// /api/admin/inventory — Kho v2 (gop product+qty + phieu nhap/xuat)
// Tat ca route deu yeu cau role admin (da check o admin.js cha)
//
// Endpoints:
//   GET    /stats                       -> tong SP co ton, tong don vi ton, KTV giu, sap het
//   GET    /stock                       -> list product_stock + product info, filter
//   GET    /products/all                -> dropdown (id, code, name)
//   GET    /products/:id/history        -> lich su nhap/xuat 1 SP (tu receipt items)
//   GET    /receipts                    -> list phieu N/X
//   GET    /receipts/:id                -> chi tiet phieu + lines
//   POST   /receipts                    -> tao phieu N/X (admin scope)
//   POST   /receipts/:id/void           -> huy phieu (sinh phieu doi ung)
//   GET    /staff-holdings              -> KTV dang giu gi
//   GET    /release-pool                -> phieu da release nhung KTV chua nhan
//
// Reason codes admin endpoint cho phep:
//   in:  import_supplier, adjust_plus
//   out: return_supplier, adjust_minus
// Cac reason khac (order_release, technician_take, install_done, ...) la noi bo,
// chi sinh tu route orders.js / kithuat.js.

const express = require('express');
const db = require('../../db');

const router = express.Router();

const LOW_STOCK_THRESHOLD = 5;
const VOID_WINDOW_HOURS = 24;

// reason_code -> { kind, scope: 'product_stock' | 'staff_holdings' }
const REASONS = {
  import_supplier:        { kind: 'in',  scope: 'product_stock' },
  return_supplier:        { kind: 'out', scope: 'product_stock' },
  adjust_plus:            { kind: 'in',  scope: 'product_stock' },
  adjust_minus:           { kind: 'out', scope: 'product_stock' },
  order_release:          { kind: 'out', scope: 'product_stock' }, // them release_pool
  order_cancel_return:    { kind: 'in',  scope: 'product_stock' },
  order_return_done:      { kind: 'in',  scope: 'product_stock' }, // don da done, khach quay dau tra
  technician_take:        { kind: 'out', scope: 'release_pool' },  // -release_pool, +staff_holdings
  technician_take_direct: { kind: 'out', scope: 'product_stock' }, // -product_stock, +staff_holdings
  technician_return:      { kind: 'in',  scope: 'staff_holdings' },// -staff_holdings, +product_stock
  install_done:           { kind: 'out', scope: 'staff_holdings' },// -staff_holdings (khong dung kho)
  damaged:                { kind: 'out', scope: 'staff_holdings' },// -staff_holdings
};

const ADMIN_ALLOWED_REASONS = ['import_supplier', 'adjust_plus', 'return_supplier', 'adjust_minus'];

// Phieu noi bo nhung admin van duoc phep void truc tiep qua /receipts/:id/void.
// order_return_done: case B — void se tru lai product_stock + reset orders.has_return neu la phieu cuoi.
// order_cancel_return KHONG nam o day vi gan voi order.status='cancelled' — phai thao tac qua flow restore don.
const ADMIN_VOIDABLE_INTERNAL_REASONS = ['order_return_done'];

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// Sinh code phieu PN/PX-YYMMDD-NNN. Dung MAX seq de tranh trung khi co phieu xoa cung.
async function genReceiptCode(conn, kind) {
  const prefix = kind === 'in' ? 'PN' : 'PX';
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePart = `${yy}${mm}${dd}`;
  const like = `${prefix}-${datePart}-%`;
  const [rows] = await conn.query(
    `SELECT code FROM stock_receipts WHERE code LIKE ? ORDER BY code DESC LIMIT 1`,
    [like]
  );
  let next = 1;
  if (rows.length) {
    const tail = rows[0].code.slice(`${prefix}-${datePart}-`.length);
    next = (parseInt(tail) || 0) + 1;
  }
  return `${prefix}-${datePart}-${String(next).padStart(3, '0')}`;
}

// ---- GET /stats ----------------------------------------------
router.get('/stats', async (req, res, next) => {
  try {
    const [r1] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM product_stock ps
            JOIN products p ON p.id = ps.product_id
           WHERE p.is_deleted = 0 AND ps.quantity > 0) AS products_with_stock,
        (SELECT COALESCE(SUM(ps.quantity), 0) FROM product_stock ps
            JOIN products p ON p.id = ps.product_id
           WHERE p.is_deleted = 0) AS total_units,
        (SELECT COALESCE(SUM(qty), 0) FROM staff_holdings) AS held_units,
        (SELECT COUNT(*) FROM product_stock ps
            JOIN products p ON p.id = ps.product_id
           WHERE p.is_deleted = 0 AND ps.quantity < ?) AS low_stock
    `, [LOW_STOCK_THRESHOLD]);

    res.json({
      products_with_stock: r1[0].products_with_stock,
      total_units:         r1[0].total_units,
      held_units:          r1[0].held_units,
      low_stock:           r1[0].low_stock,
      low_threshold:       LOW_STOCK_THRESHOLD,
    });
  } catch (err) { next(err); }
});

// ---- GET /products/all ---------------------------------------
router.get('/products/all', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, code, name FROM products WHERE is_deleted = 0 ORDER BY code`
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ---- GET /stock ----------------------------------------------
// Query: ?q, ?category_id, ?stock_state (available|low|out), ?page, ?limit
router.get('/stock', async (req, res, next) => {
  try {
    const q          = (req.query.q || '').trim();
    const categoryId = req.query.category_id ? Number(req.query.category_id) : null;
    const stockState = req.query.stock_state || '';
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
    if (stockState === 'low')            where.push(`COALESCE(ps.quantity,0) > 0 AND COALESCE(ps.quantity,0) < ${LOW_STOCK_THRESHOLD}`);
    else if (stockState === 'out')       where.push('COALESCE(ps.quantity,0) = 0');
    else if (stockState === 'available') where.push('COALESCE(ps.quantity,0) > 0');
    const whereSql = 'WHERE ' + where.join(' AND ');

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
         FROM products p
         LEFT JOIN product_stock ps ON ps.product_id = p.id
         ${whereSql}`,
      args
    );

    const [rows] = await db.query(
      `SELECT
         p.id AS product_id, p.code, p.name, p.image_url, p.thumbnail_url,
         p.warranty_months, p.cost_price, p.category_id,
         c.name AS category_name,
         COALESCE(ps.quantity, 0) AS quantity,
         COALESCE((SELECT SUM(qty) FROM staff_holdings sh WHERE sh.product_id = p.id), 0) AS held_qty,
         COALESCE((
           SELECT SUM(ri.qty)
             FROM stock_receipt_items ri
             JOIN stock_receipts r ON r.id = ri.receipt_id
            WHERE ri.product_id = p.id
              AND r.is_voided = 0
              AND r.reason_code = 'install_done'
              AND r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         ), 0) AS sold_30d
       FROM products p
       LEFT JOIN categories c    ON c.id = p.category_id
       LEFT JOIN product_stock ps ON ps.product_id = p.id
       ${whereSql}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    res.json({ items: rows, total: countRows[0].total, page, limit });
  } catch (err) { next(err); }
});

// ---- GET /products/:id/history -------------------------------
// Lich su nhap/xuat cua 1 san pham
router.get('/products/:id/history', async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    if (!productId) return res.status(400).json({ error: 'productId khong hop le' });

    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
         FROM stock_receipt_items ri
         JOIN stock_receipts r ON r.id = ri.receipt_id
        WHERE ri.product_id = ?`,
      [productId]
    );

    const [rows] = await db.query(
      `SELECT
         ri.id AS line_id, ri.receipt_id, ri.qty, ri.unit_price, ri.imei_list, ri.note,
         r.code, r.kind, r.reason_code, r.reason_text,
         r.ref_order_id, r.ref_staff_id, r.supplier_id,
         r.created_at, r.is_voided,
         creator.full_name AS created_by_name,
         ref_staff.full_name AS ref_staff_name,
         sup.name AS supplier_name,
         o.code AS order_code
         FROM stock_receipt_items ri
         JOIN stock_receipts r ON r.id = ri.receipt_id
         LEFT JOIN staff creator ON creator.id = r.created_by_staff_id
         LEFT JOIN staff ref_staff ON ref_staff.id = r.ref_staff_id
         LEFT JOIN suppliers sup ON sup.id = r.supplier_id
         LEFT JOIN orders o ON o.id = r.ref_order_id
        WHERE ri.product_id = ?
        ORDER BY r.created_at DESC, ri.id DESC
        LIMIT ? OFFSET ?`,
      [productId, limit, offset]
    );

    res.json({ items: rows, total: countRows[0].total, page, limit });
  } catch (err) { next(err); }
});

// ---- GET /receipts -------------------------------------------
// Query: ?kind, ?reason_code, ?date_from, ?date_to, ?q, ?page, ?limit
router.get('/receipts', async (req, res, next) => {
  try {
    const where = ['1=1'];
    const args = [];
    if (req.query.kind === 'in' || req.query.kind === 'out') {
      where.push('r.kind = ?');
      args.push(req.query.kind);
    }
    if (req.query.reason_code && REASONS[req.query.reason_code]) {
      where.push('r.reason_code = ?');
      args.push(req.query.reason_code);
    }
    if (req.query.ref_order_id) {
      where.push('r.ref_order_id = ?');
      args.push(Number(req.query.ref_order_id));
    }
    if (req.query.date_from) {
      where.push('r.created_at >= ?');
      args.push(`${req.query.date_from} 00:00:00`);
    }
    if (req.query.date_to) {
      where.push('r.created_at <= ?');
      args.push(`${req.query.date_to} 23:59:59`);
    }
    const q = (req.query.q || '').trim();
    if (q) {
      where.push('(r.code LIKE ? OR r.reason_text LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like);
    }
    const whereSql = 'WHERE ' + where.join(' AND ');

    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM stock_receipts r ${whereSql}`,
      args
    );

    const [rows] = await db.query(
      `SELECT r.id, r.code, r.kind, r.reason_code, r.reason_text,
              r.ref_order_id, r.ref_staff_id, r.supplier_id,
              r.created_by_staff_id, r.created_at, r.is_voided,
              creator.full_name AS created_by_name,
              sup.name AS supplier_name,
              o.code AS order_code,
              (SELECT COUNT(*) FROM stock_receipt_items ri WHERE ri.receipt_id = r.id) AS line_count,
              (SELECT COALESCE(SUM(qty),0) FROM stock_receipt_items ri WHERE ri.receipt_id = r.id) AS total_qty
         FROM stock_receipts r
         LEFT JOIN staff creator ON creator.id = r.created_by_staff_id
         LEFT JOIN suppliers sup ON sup.id = r.supplier_id
         LEFT JOIN orders o ON o.id = r.ref_order_id
         ${whereSql}
         ORDER BY r.id DESC
         LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    // Preview 3 items / receipt
    if (rows.length) {
      const ids = rows.map(r => r.id);
      const ph = ids.map(() => '?').join(',');
      const [items] = await db.query(
        `SELECT ri.receipt_id, ri.product_id, ri.qty, p.code AS product_code, p.name AS product_name
           FROM stock_receipt_items ri
           JOIN products p ON p.id = ri.product_id
          WHERE ri.receipt_id IN (${ph})
          ORDER BY ri.id`,
        ids
      );
      const byReceipt = new Map();
      for (const it of items) {
        if (!byReceipt.has(it.receipt_id)) byReceipt.set(it.receipt_id, []);
        const list = byReceipt.get(it.receipt_id);
        if (list.length < 3) list.push(it);
      }
      for (const r of rows) r.items_preview = byReceipt.get(r.id) || [];
    }

    res.json({ items: rows, total: countRows[0].total, page, limit });
  } catch (err) { next(err); }
});

// ---- GET /receipts/:id ---------------------------------------
router.get('/receipts/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.query(
      `SELECT r.*,
              creator.full_name AS created_by_name,
              ref_staff.full_name AS ref_staff_name,
              sup.name AS supplier_name,
              o.code AS order_code,
              st.code AS stock_take_code
         FROM stock_receipts r
         LEFT JOIN staff creator ON creator.id = r.created_by_staff_id
         LEFT JOIN staff ref_staff ON ref_staff.id = r.ref_staff_id
         LEFT JOIN suppliers sup ON sup.id = r.supplier_id
         LEFT JOIN orders o ON o.id = r.ref_order_id
         LEFT JOIN stock_takes st ON st.id = r.ref_stock_take_id
        WHERE r.id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay phieu' });

    const [items] = await db.query(
      `SELECT ri.*, p.code AS product_code, p.name AS product_name, p.thumbnail_url
         FROM stock_receipt_items ri
         JOIN products p ON p.id = ri.product_id
        WHERE ri.receipt_id = ?
        ORDER BY ri.id`,
      [id]
    );

    res.json({ ...rows[0], items });
  } catch (err) { next(err); }
});

// ---- POST /receipts ------------------------------------------
// Body: { kind, reason_code, reason_text?, supplier_id?, items: [{product_id, qty, unit_price?, imei_list?, note?}] }
router.post('/receipts', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const reasonCode = req.body.reason_code;
    if (!ADMIN_ALLOWED_REASONS.includes(reasonCode)) {
      throw httpErr(400, 'reason_code khong hop le hoac la phieu noi bo (chi he thong sinh)');
    }
    const cfg = REASONS[reasonCode];
    const kind = cfg.kind;
    if (req.body.kind && req.body.kind !== kind) {
      throw httpErr(400, `reason_code "${reasonCode}" yeu cau kind="${kind}"`);
    }

    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) throw httpErr(400, 'Phieu phai co it nhat 1 dong');

    // Validate va chuan hoa items
    const lines = [];
    const productIds = new Set();
    for (const raw of items) {
      const productId = Number(raw.product_id);
      const qty = Number(raw.qty);
      if (!productId) throw httpErr(400, 'Thieu product_id o 1 dong');
      if (!qty || qty <= 0) throw httpErr(400, 'qty phai > 0');
      if (productIds.has(productId)) throw httpErr(400, 'Moi san pham chi 1 dong / phieu');
      productIds.add(productId);
      lines.push({
        product_id: productId,
        qty,
        unit_price: raw.unit_price !== undefined && raw.unit_price !== null && raw.unit_price !== ''
          ? Number(raw.unit_price) : null,
        imei_list: raw.imei_list ? String(raw.imei_list).trim() : null,
        note: raw.note ? String(raw.note).trim() : null,
      });
    }

    const supplierId = req.body.supplier_id ? Number(req.body.supplier_id) : null;
    if (['import_supplier', 'return_supplier'].includes(reasonCode) && !supplierId) {
      throw httpErr(400, 'Phieu nhap/tra NCC bat buoc co supplier_id');
    }
    if (supplierId) {
      const [sup] = await conn.query(
        `SELECT id FROM suppliers WHERE id = ? AND is_deleted = 0`, [supplierId]
      );
      if (!sup.length) throw httpErr(404, 'NCC khong ton tai');
    }

    // Verify products ton tai
    const ph = lines.map(() => '?').join(',');
    const [prodRows] = await conn.query(
      `SELECT id FROM products WHERE id IN (${ph}) AND is_deleted = 0`,
      lines.map(l => l.product_id)
    );
    if (prodRows.length !== lines.length) throw httpErr(404, 'Co san pham khong ton tai');

    const staffId = req.user && req.user.sub ? req.user.sub : null;

    await conn.beginTransaction();

    // Lock product_stock rows (theo thu tu product_id de tranh deadlock)
    lines.sort((a, b) => a.product_id - b.product_id);
    for (const l of lines) {
      const [psRows] = await conn.query(
        `SELECT quantity FROM product_stock WHERE product_id = ? FOR UPDATE`,
        [l.product_id]
      );
      let currentQty = 0;
      if (psRows.length) {
        currentQty = psRows[0].quantity;
      } else {
        await conn.query(
          `INSERT INTO product_stock (product_id, quantity) VALUES (?, 0)`,
          [l.product_id]
        );
      }
      l._currentQty = currentQty;
      if (kind === 'out' && currentQty < l.qty) {
        throw httpErr(409, `Khong du ton: SP id=${l.product_id} con ${currentQty}, can ${l.qty}`);
      }
    }

    const code = await genReceiptCode(conn, kind);
    const [rIns] = await conn.query(
      `INSERT INTO stock_receipts
         (code, kind, reason_code, reason_text, supplier_id, created_by_staff_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [code, kind, reasonCode, req.body.reason_text || null, supplierId, staffId]
    );
    const receiptId = rIns.insertId;

    for (const l of lines) {
      await conn.query(
        `INSERT INTO stock_receipt_items
           (receipt_id, product_id, qty, unit_price, imei_list, note)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [receiptId, l.product_id, l.qty, l.unit_price, l.imei_list, l.note]
      );
      const delta = kind === 'in' ? l.qty : -l.qty;
      await conn.query(
        `UPDATE product_stock SET quantity = quantity + ? WHERE product_id = ?`,
        [delta, l.product_id]
      );
    }

    await conn.commit();

    const [out] = await db.query(`SELECT * FROM stock_receipts WHERE id = ?`, [receiptId]);
    res.status(201).json({ ...out[0], items: lines });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- POST /receipts/:id/void ---------------------------------
router.post('/receipts/:id/void', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const reason = req.body.reason ? String(req.body.reason).trim() : '';
    if (!reason) throw httpErr(400, 'Phai cung cap ly do huy phieu');

    await conn.beginTransaction();
    const [rRows] = await conn.query(
      `SELECT * FROM stock_receipts WHERE id = ? FOR UPDATE`, [id]
    );
    if (!rRows.length) throw httpErr(404, 'Khong tim thay phieu');
    const r = rRows[0];
    if (r.is_voided) throw httpErr(400, 'Phieu da bi huy');

    // Cho phep void: phieu admin tu tao + mot so phieu noi bo da khai bao tuong minh
    const allowVoid = ADMIN_ALLOWED_REASONS.includes(r.reason_code)
                   || ADMIN_VOIDABLE_INTERNAL_REASONS.includes(r.reason_code);
    if (!allowVoid) {
      throw httpErr(400, 'Phieu noi bo khong huy truc tiep — phai thao tac qua flow tuong ung');
    }

    // Phieu sinh tu phien kiem ke khong duoc void truc tiep
    if (r.ref_stock_take_id) {
      throw httpErr(400, 'Phieu thuoc phien kiem ke — khong huy truc tiep duoc');
    }

    const ageMs = Date.now() - new Date(r.created_at).getTime();
    if (ageMs > VOID_WINDOW_HOURS * 3600 * 1000) {
      throw httpErr(400, `Chi duoc huy phieu trong ${VOID_WINDOW_HOURS}h dau`);
    }

    const [items] = await conn.query(
      `SELECT * FROM stock_receipt_items WHERE receipt_id = ?`, [id]
    );

    // Kind doi ung
    const oppositeKind = r.kind === 'in' ? 'out' : 'in';

    // Validate: neu void phieu nhap (kind='in') -> can du qty de tru nguoc
    if (r.kind === 'in') {
      for (const it of items) {
        const [psRows] = await conn.query(
          `SELECT quantity FROM product_stock WHERE product_id = ? FOR UPDATE`,
          [it.product_id]
        );
        const cur = psRows.length ? psRows[0].quantity : 0;
        if (cur < it.qty) {
          throw httpErr(409, `Khong du ton de huy: SP id=${it.product_id} con ${cur}, can tru ${it.qty}`);
        }
      }
    }

    const staffId = req.user && req.user.sub ? req.user.sub : null;
    const newCode = await genReceiptCode(conn, oppositeKind);
    const [vIns] = await conn.query(
      `INSERT INTO stock_receipts
         (code, kind, reason_code, reason_text, supplier_id, created_by_staff_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        newCode, oppositeKind, `${r.reason_code}_void`,
        `Huy phieu ${r.code}: ${reason}`, r.supplier_id, staffId,
      ]
    );
    const newId = vIns.insertId;

    for (const it of items) {
      await conn.query(
        `INSERT INTO stock_receipt_items
           (receipt_id, product_id, qty, unit_price, imei_list, note)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newId, it.product_id, it.qty, it.unit_price, it.imei_list, it.note]
      );
      const delta = oppositeKind === 'in' ? it.qty : -it.qty;
      await conn.query(
        `INSERT INTO product_stock (product_id, quantity) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
        [it.product_id, delta]
      );
    }

    await conn.query(
      `UPDATE stock_receipts
          SET is_voided = 1, voided_at = NOW(), voided_reason = ?, voided_by_receipt_id = ?
        WHERE id = ?`,
      [reason, newId, id]
    );

    // Neu void phieu order_return_done -> kiem tra con phieu return_done active nao cho don do?
    // Khong con -> reset orders.has_return = 0.
    if (r.reason_code === 'order_return_done' && r.ref_order_id) {
      const [stillActive] = await conn.query(
        `SELECT COUNT(*) AS n FROM stock_receipts
          WHERE ref_order_id = ? AND reason_code = 'order_return_done' AND is_voided = 0`,
        [r.ref_order_id]
      );
      if (Number(stillActive[0].n) === 0) {
        await conn.query(
          `UPDATE orders SET has_return = 0 WHERE id = ?`, [r.ref_order_id]
        );
      }
    }

    await conn.commit();
    res.json({ ok: true, voided_id: id, counter_receipt_id: newId, counter_code: newCode });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- GET /staff-holdings -------------------------------------
router.get('/staff-holdings', async (req, res, next) => {
  try {
    const where = ['1=1'];
    const args = [];
    if (req.query.staff_id) {
      where.push('sh.staff_id = ?');
      args.push(Number(req.query.staff_id));
    }
    if (req.query.product_id) {
      where.push('sh.product_id = ?');
      args.push(Number(req.query.product_id));
    }
    const q = (req.query.q || '').trim();
    if (q) {
      where.push('(s.full_name LIKE ? OR p.code LIKE ? OR p.name LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like, like);
    }
    const whereSql = 'WHERE ' + where.join(' AND ');

    const [rows] = await db.query(
      `SELECT sh.id, sh.staff_id, sh.product_id, sh.qty, sh.first_held_at,
              s.full_name AS staff_name,
              p.code AS product_code, p.name AS product_name, p.thumbnail_url,
              TIMESTAMPDIFF(DAY, sh.first_held_at, NOW()) AS days_held
         FROM staff_holdings sh
         JOIN staff s ON s.id = sh.staff_id
         JOIN products p ON p.id = sh.product_id
         ${whereSql}
         ORDER BY sh.first_held_at ASC`,
      args
    );

    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ---- GET /release-pool ---------------------------------------
router.get('/release-pool', async (req, res, next) => {
  try {
    const where = ['1=1'];
    const args = [];
    if (req.query.staff_id) {
      where.push('rp.staff_id = ?');
      args.push(Number(req.query.staff_id));
    }
    if (req.query.order_id) {
      where.push('rp.order_id = ?');
      args.push(Number(req.query.order_id));
    }
    const whereSql = 'WHERE ' + where.join(' AND ');

    const [rows] = await db.query(
      `SELECT rp.id, rp.order_id, rp.staff_id, rp.product_id, rp.qty, rp.created_at,
              s.full_name AS staff_name,
              p.code AS product_code, p.name AS product_name,
              o.code AS order_code
         FROM release_pool rp
         JOIN orders o ON o.id = rp.order_id
         JOIN staff s ON s.id = rp.staff_id
         JOIN products p ON p.id = rp.product_id
         ${whereSql}
         ORDER BY rp.created_at ASC`,
      args
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ==========================================================
// STOCK TAKES — phien kiem ke kho hang loat
// ==========================================================

// Sinh code phien kiem ke KK-YYMMDD-NNN
async function genStocktakeCode(conn) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePart = `${yy}${mm}${dd}`;
  const like = `KK-${datePart}-%`;
  const [rows] = await conn.query(
    `SELECT code FROM stock_takes WHERE code LIKE ? ORDER BY code DESC LIMIT 1`,
    [like]
  );
  let next = 1;
  if (rows.length) {
    const tail = rows[0].code.slice(`KK-${datePart}-`.length);
    next = (parseInt(tail) || 0) + 1;
  }
  return `KK-${datePart}-${String(next).padStart(3, '0')}`;
}

// ---- POST /stocktakes ----------------------------------------
// Body: { note? }
// Tao phien moi o status='draft'
router.post('/stocktakes', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const staffId = req.user && req.user.sub ? req.user.sub : null;
    if (!staffId) throw httpErr(401, 'Khong xac dinh duoc nguoi tao');
    const note = req.body.note ? String(req.body.note).trim() : null;

    await conn.beginTransaction();
    const code = await genStocktakeCode(conn);
    const [ins] = await conn.query(
      `INSERT INTO stock_takes (code, status, by_staff_id, note)
       VALUES (?, 'draft', ?, ?)`,
      [code, staffId, note]
    );
    await conn.commit();

    res.status(201).json({ id: ins.insertId, code, status: 'draft' });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- GET /stocktakes -----------------------------------------
// Query: ?status, ?date_from, ?date_to, ?page, ?limit
router.get('/stocktakes', async (req, res, next) => {
  try {
    const where = ['st.is_deleted = 0'];
    const args = [];
    if (['draft', 'finished', 'cancelled'].includes(req.query.status)) {
      where.push('st.status = ?');
      args.push(req.query.status);
    }
    if (req.query.date_from) {
      where.push('st.started_at >= ?');
      args.push(`${req.query.date_from} 00:00:00`);
    }
    if (req.query.date_to) {
      where.push('st.started_at <= ?');
      args.push(`${req.query.date_to} 23:59:59`);
    }
    const whereSql = 'WHERE ' + where.join(' AND ');
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM stock_takes st ${whereSql}`, args
    );
    const [rows] = await db.query(
      `SELECT st.id, st.code, st.status, st.started_at, st.finished_at,
              st.by_staff_id, st.finished_by_staff_id, st.note,
              st.total_lines, st.total_variance_abs,
              s1.full_name AS by_staff_name,
              s2.full_name AS finished_by_staff_name,
              (SELECT COUNT(*) FROM stock_take_lines stl WHERE stl.stock_take_id = st.id) AS line_count
         FROM stock_takes st
         LEFT JOIN staff s1 ON s1.id = st.by_staff_id
         LEFT JOIN staff s2 ON s2.id = st.finished_by_staff_id
         ${whereSql}
         ORDER BY st.id DESC
         LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );
    res.json({ items: rows, total: countRows[0].total, page, limit });
  } catch (err) { next(err); }
});

// ---- GET /stocktakes/:id -------------------------------------
router.get('/stocktakes/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.query(
      `SELECT st.*,
              s1.full_name AS by_staff_name,
              s2.full_name AS finished_by_staff_name
         FROM stock_takes st
         LEFT JOIN staff s1 ON s1.id = st.by_staff_id
         LEFT JOIN staff s2 ON s2.id = st.finished_by_staff_id
        WHERE st.id = ? AND st.is_deleted = 0`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay phien kiem ke' });

    // Lines + lookup current_qty (de UI canh bao neu thay doi tu luc snapshot)
    const [lines] = await db.query(
      `SELECT stl.id, stl.product_id, stl.system_qty, stl.counted_qty, stl.note,
              stl.receipt_id,
              p.code AS product_code, p.name AS product_name, p.thumbnail_url,
              COALESCE(ps.quantity, 0) AS current_qty,
              r.code AS receipt_code, r.kind AS receipt_kind,
              r.reason_code AS receipt_reason_code
         FROM stock_take_lines stl
         JOIN products p ON p.id = stl.product_id
         LEFT JOIN product_stock ps ON ps.product_id = stl.product_id
         LEFT JOIN stock_receipts r ON r.id = stl.receipt_id
        WHERE stl.stock_take_id = ?
        ORDER BY stl.id`, [id]
    );

    res.json({ ...rows[0], lines });
  } catch (err) { next(err); }
});

// ---- PUT /stocktakes/:id/lines -------------------------------
// Body: { lines: [{product_id, counted_qty, note?}] }
// Replace toan bo lines (chi cho draft). system_qty snap luc luu.
router.put('/stocktakes/:id/lines', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const lines = Array.isArray(req.body.lines) ? req.body.lines : [];

    // Validate va dedupe
    const cleaned = [];
    const seen = new Set();
    for (const raw of lines) {
      const productId = Number(raw.product_id);
      const counted = Number(raw.counted_qty);
      if (!productId) throw httpErr(400, 'Line thieu product_id');
      if (!Number.isInteger(counted) || counted < 0) {
        throw httpErr(400, 'counted_qty phai la so nguyen >= 0');
      }
      if (seen.has(productId)) throw httpErr(400, `SP id=${productId} bi trung trong phien`);
      seen.add(productId);
      cleaned.push({
        product_id: productId,
        counted_qty: counted,
        note: raw.note ? String(raw.note).trim() : null,
      });
    }

    await conn.beginTransaction();
    const [stRows] = await conn.query(
      `SELECT id, status FROM stock_takes WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!stRows.length) throw httpErr(404, 'Khong tim thay phien');
    if (stRows[0].status !== 'draft') {
      throw httpErr(409, `Phien o trang thai ${stRows[0].status} — khong sua duoc`);
    }

    // Verify products ton tai
    if (cleaned.length) {
      const ph = cleaned.map(() => '?').join(',');
      const [prodRows] = await conn.query(
        `SELECT id FROM products WHERE id IN (${ph}) AND is_deleted = 0`,
        cleaned.map(l => l.product_id)
      );
      if (prodRows.length !== cleaned.length) throw httpErr(404, 'Co san pham khong ton tai');
    }

    await conn.query(`DELETE FROM stock_take_lines WHERE stock_take_id = ?`, [id]);
    for (const l of cleaned) {
      const [psRows] = await conn.query(
        `SELECT COALESCE(quantity, 0) AS q FROM product_stock WHERE product_id = ?`,
        [l.product_id]
      );
      const systemQty = psRows.length ? Number(psRows[0].q) : 0;
      await conn.query(
        `INSERT INTO stock_take_lines (stock_take_id, product_id, system_qty, counted_qty, note)
         VALUES (?, ?, ?, ?, ?)`,
        [id, l.product_id, systemQty, l.counted_qty, l.note]
      );
    }

    await conn.commit();
    res.json({ ok: true, line_count: cleaned.length });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- POST /stocktakes/:id/finish -----------------------------
// Finalize: voi moi line variance != 0, sinh phieu adjust_plus/adjust_minus
// gan ref_stock_take_id, update product_stock.
router.post('/stocktakes/:id/finish', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const staffId = req.user && req.user.sub ? req.user.sub : null;

    await conn.beginTransaction();
    const [stRows] = await conn.query(
      `SELECT * FROM stock_takes WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!stRows.length) throw httpErr(404, 'Khong tim thay phien');
    const st = stRows[0];
    if (st.status !== 'draft') {
      throw httpErr(409, `Phien o trang thai ${st.status} — khong finish duoc`);
    }

    const [lines] = await conn.query(
      `SELECT stl.id, stl.product_id, stl.counted_qty
         FROM stock_take_lines stl
        WHERE stl.stock_take_id = ?
        ORDER BY stl.product_id`, [id]
    );
    if (!lines.length) throw httpErr(400, 'Phien chua co dong nao de finish');

    let totalVarianceAbs = 0;
    const generatedReceipts = [];

    for (const l of lines) {
      // Lock product_stock va lay current
      const [psRows] = await conn.query(
        `SELECT COALESCE(quantity, 0) AS q FROM product_stock WHERE product_id = ? FOR UPDATE`,
        [l.product_id]
      );
      const currentQty = psRows.length ? Number(psRows[0].q) : 0;
      const variance = Number(l.counted_qty) - currentQty;

      if (variance === 0) continue;

      const reasonCode = variance > 0 ? 'adjust_plus' : 'adjust_minus';
      const kind = variance > 0 ? 'in' : 'out';
      const absVar = Math.abs(variance);
      const code = await genReceiptCode(conn, kind);

      const [rIns] = await conn.query(
        `INSERT INTO stock_receipts
           (code, kind, reason_code, reason_text, ref_stock_take_id, created_by_staff_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [code, kind, reasonCode, `Kiem ke ${st.code}`, id, staffId]
      );
      const receiptId = rIns.insertId;

      await conn.query(
        `INSERT INTO stock_receipt_items (receipt_id, product_id, qty)
         VALUES (?, ?, ?)`,
        [receiptId, l.product_id, absVar]
      );

      const delta = variance; // dau cua variance da dung huong
      if (psRows.length) {
        await conn.query(
          `UPDATE product_stock SET quantity = quantity + ? WHERE product_id = ?`,
          [delta, l.product_id]
        );
      } else {
        await conn.query(
          `INSERT INTO product_stock (product_id, quantity) VALUES (?, ?)`,
          [l.product_id, delta]
        );
      }

      await conn.query(
        `UPDATE stock_take_lines SET receipt_id = ? WHERE id = ?`,
        [receiptId, l.id]
      );

      totalVarianceAbs += absVar;
      generatedReceipts.push({ receipt_id: receiptId, code, kind, reason_code: reasonCode, qty: absVar });
    }

    await conn.query(
      `UPDATE stock_takes
          SET status = 'finished',
              finished_at = NOW(),
              finished_by_staff_id = ?,
              total_lines = ?,
              total_variance_abs = ?
        WHERE id = ?`,
      [staffId, lines.length, totalVarianceAbs, id]
    );

    await conn.commit();
    res.json({
      ok: true,
      total_lines: lines.length,
      total_variance_abs: totalVarianceAbs,
      receipts: generatedReceipts,
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- POST /stocktakes/:id/cancel -----------------------------
router.post('/stocktakes/:id/cancel', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    await conn.beginTransaction();
    const [stRows] = await conn.query(
      `SELECT id, status FROM stock_takes WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!stRows.length) throw httpErr(404, 'Khong tim thay phien');
    if (stRows[0].status !== 'draft') {
      throw httpErr(409, `Phien o trang thai ${stRows[0].status} — chi huy duoc khi draft`);
    }
    await conn.query(
      `UPDATE stock_takes SET status = 'cancelled' WHERE id = ?`, [id]
    );
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
