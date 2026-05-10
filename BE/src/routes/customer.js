// /api/customer — endpoint chung cho khach le (role='customer') va dai ly (role='daily').
// Dai ly va khach le deu la 1 record trong table `customers` (phan biet bang cot `type`).
// Don tao boi khach default = status='pending', cho admin duyet.
// Cau hinh loai don do admin tao trong order_templates (xem mig 045).
const express = require('express');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  loadTemplateSteps, validateTransition, recalcOrderTotal, insertOrderWithRetry,
} = require('../utils/orderState');
const { resolvePriceMap } = require('../utils/priceResolver');
const { saveDataUrl } = require('../utils/saveUpload');
const notify = require('../utils/notify');

const router = express.Router();

router.use(verifyToken, requireRole('customer', 'daily'));

router.get('/ping', (req, res) => {
  res.json({ ok: true, role: req.user.role, user: req.user });
});

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// ============================================================
// PROFILE
// ============================================================
function vName(input) {
  const v = String(input == null ? '' : input).trim();
  if (!v)              return { ok: false, error: 'Vui long nhap ho ten' };
  if (v.length < 2)    return { ok: false, error: 'Ho ten qua ngan' };
  if (v.length > 100)  return { ok: false, error: 'Ho ten qua dai (toi da 100)' };
  if (/[<>"'`]/.test(v)) return { ok: false, error: 'Ho ten chua ky tu khong hop le' };
  return { ok: true, value: v };
}
function vEmail(input) {
  if (input == null || input === '') return { ok: true, value: null };
  const v = String(input).trim();
  if (!v) return { ok: true, value: null };
  if (v.length > 150) return { ok: false, error: 'Email qua dai' };
  if (!/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/.test(v)) {
    return { ok: false, error: 'Email khong hop le' };
  }
  return { ok: true, value: v };
}
function vAddress(input) {
  if (input == null || input === '') return { ok: true, value: null };
  const v = String(input).trim();
  if (!v) return { ok: true, value: null };
  if (v.length > 300) return { ok: false, error: 'Dia chi qua dai (toi da 300)' };
  if (/[<>]/.test(v))  return { ok: false, error: 'Dia chi chua ky tu khong hop le' };
  return { ok: true, value: v };
}

router.patch('/profile', async (req, res, next) => {
  try {
    const body = req.body || {};
    const sets = [];
    const args = [];

    if ('full_name' in body) {
      const vN = vName(body.full_name);
      if (!vN.ok) return res.status(400).json({ error: vN.error });
      sets.push('full_name = ?'); args.push(vN.value);
    }
    if ('email' in body) {
      const vE = vEmail(body.email);
      if (!vE.ok) return res.status(400).json({ error: vE.error });
      sets.push('email = ?'); args.push(vE.value);
    }
    if ('address' in body) {
      const vA = vAddress(body.address);
      if (!vA.ok) return res.status(400).json({ error: vA.error });
      sets.push('address = ?'); args.push(vA.value);
    }

    const expectedType = req.user.role === 'daily' ? 'dealer' : 'retail';
    if (sets.length) {
      args.push(req.user.sub, expectedType);
      await db.query(
        `UPDATE customers SET ${sets.join(', ')}
          WHERE id = ? AND type = ? AND is_deleted = 0`,
        args
      );
    }
    const [rows] = await db.query(
      `SELECT id, code, type, full_name, phone, email, address, avatar_url,
              company_name, contact_person, debt_limit, credit_term_days, discount_rate
         FROM customers WHERE id = ? AND is_deleted = 0`,
      [req.user.sub]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay tai khoan' });
    res.json({ user: { ...rows[0], role: req.user.role } });
  } catch (err) { next(err); }
});

router.get('/me', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, code, type, full_name, phone, email, address, avatar_url,
              company_name, contact_person, default_tier_id,
              debt_limit, credit_term_days, discount_rate
         FROM customers WHERE id = ? AND is_deleted = 0`,
      [req.user.sub]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay tai khoan' });
    const me = { ...rows[0], role: req.user.role };

    if (req.user.role === 'daily') {
      const [debtRow] = await db.query(
        `SELECT COALESCE(SUM(total_amount - paid_amount), 0) AS debt
           FROM orders
          WHERE (customer_id = ? OR dealer_id = ?)
            AND status NOT IN ('pending','cancelled')
            AND payment_status != 'paid'
            AND is_deleted = 0
            AND total_amount > paid_amount`,
        [req.user.sub, req.user.sub]
      );
      me.debt = Number(debtRow[0].debt) || 0;
    }
    res.json({ user: me });
  } catch (err) { next(err); }
});

// ============================================================
// PRODUCTS
// ============================================================
router.get('/products', async (req, res, next) => {
  try {
    const q          = (req.query.q || '').trim();
    const categoryId = parseInt(req.query.category_id) || 0;
    const sort       = req.query.sort || 'name';
    const page       = Math.max(1, parseInt(req.query.page) || 1);
    const limit      = Math.min(48, Math.max(1, parseInt(req.query.limit) || 12));
    const offset     = (page - 1) * limit;

    const where = ["p.is_deleted = 0", "p.code != 'REPAIR_SERVICE'"];
    const args  = [];
    if (q) { where.push('(p.name LIKE ? OR p.code LIKE ?)'); args.push(`%${q}%`, `%${q}%`); }
    if (categoryId) { where.push('p.category_id = ?'); args.push(categoryId); }

    let orderBy = 'p.name ASC';
    if (sort === 'newest') orderBy = 'p.id DESC';

    const whereSql = 'WHERE ' + where.join(' AND ');
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM products p ${whereSql}`, args
    );
    const [rows] = await db.query(
      `SELECT p.id, p.code, p.name, p.image_url, p.thumbnail_url,
              p.warranty_months, p.description,
              p.category_id, c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         ${whereSql}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    if (rows.length) {
      const priceMap = await resolvePriceMap(db, rows.map(r => r.id), req.user.sub);
      rows.forEach(r => { r.retail_price = priceMap.get(r.id) || null; });
      if (sort === 'price_asc' || sort === 'price_desc') {
        rows.sort((a, b) => {
          const av = a.retail_price || 0, bv = b.retail_price || 0;
          return sort === 'price_asc' ? av - bv : bv - av;
        });
      }
    }
    res.json({ items: rows, total: countRows[0].total, page, limit });
  } catch (err) { next(err); }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const [rows] = await db.query(
      `SELECT p.id, p.code, p.name, p.image_url, p.thumbnail_url,
              p.warranty_months, p.description,
              p.category_id, c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = ? AND p.is_deleted = 0 AND p.code != 'REPAIR_SERVICE'`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay san pham' });

    const priceMap = await resolvePriceMap(db, [id], req.user.sub);
    const retail_price = priceMap.get(id) || null;

    const [attrs] = await db.query(
      `SELECT label, value, position FROM product_attributes
        WHERE product_id = ? ORDER BY sort_order ASC`, [id]
    );
    const [blocks] = await db.query(
      `SELECT id, block_type, content, caption, sort_order
         FROM product_blocks
        WHERE product_id = ? ORDER BY sort_order ASC`, [id]
    );
    const attributes_top    = attrs.filter(a => (a.position || 'top') !== 'bottom').map(({position, ...r}) => r);
    const attributes_bottom = attrs.filter(a => a.position === 'bottom').map(({position, ...r}) => r);

    res.json({
      ...rows[0],
      retail_price,
      attributes_top,
      attributes_bottom,
      blocks,
      attributes: attributes_top.concat(attributes_bottom),
    });
  } catch (err) { next(err); }
});

// ============================================================
// ORDER TEMPLATES (public)
// ============================================================
// Khach thay duoc cac loai don is_public = 1.
router.get('/order-templates', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, description, sort_order
         FROM order_templates
        WHERE is_public = 1 AND is_deleted = 0
        ORDER BY sort_order, id`
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// Chi tiet template + fields (dung khi ve form tao don)
router.get('/order-templates/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [tRows] = await db.query(
      `SELECT id, name, description
         FROM order_templates
        WHERE id = ? AND is_public = 1 AND is_deleted = 0`, [id]
    );
    if (!tRows.length) return res.status(404).json({ error: 'Khong tim thay loai don' });
    const [fields] = await db.query(
      `SELECT id, seq, label, field_type, is_required, placeholder
         FROM order_template_fields
        WHERE template_id = ? AND is_deleted = 0
        ORDER BY seq, id`, [id]
    );
    const [steps] = await db.query(
      `SELECT id, seq, code, label, requires_photo, photo_min_count, update_roles, is_terminal
         FROM order_workflow_steps
        WHERE is_deleted = 0 AND is_system = 0
        ORDER BY seq, id`
    );
    res.json({ ...tRows[0], fields, steps });
  } catch (err) { next(err); }
});

// ============================================================
// ORDERS (template-driven)
// ============================================================
function ownerArgs(user) {
  const isDealer = user.role === 'daily';
  return {
    clause: isDealer ? '(o.customer_id = ? OR o.dealer_id = ?)' : 'o.customer_id = ?',
    args:   isDealer ? [user.sub, user.sub] : [user.sub],
  };
}

router.get('/orders', async (req, res, next) => {
  try {
    const status = req.query.status;
    const tplId = Number(req.query.template_id) || 0;
    const { clause, args } = ownerArgs(req.user);
    const where = [clause, 'o.is_deleted = 0'];
    if (status) { where.push('o.status = ?'); args.push(status); }
    if (tplId)  {
      where.push('EXISTS (SELECT 1 FROM order_lines ol WHERE ol.order_id = o.id AND ol.template_id = ? AND ol.is_deleted = 0)');
      args.push(tplId);
    }

    const [rows] = await db.query(
      `SELECT o.id, o.code, o.subtotal, o.total_amount, o.paid_amount, o.payment_method,
              o.status, o.payment_status, o.address,
              o.note, o.confirmed_at, o.due_at, o.completed_at,
              (SELECT GROUP_CONCAT(COALESCE(ol.custom_name, t.name) ORDER BY ol.seq SEPARATOR ' + ')
                 FROM order_lines ol
                 LEFT JOIN order_templates t ON t.id = ol.template_id
                WHERE ol.order_id = o.id AND ol.is_deleted = 0) AS template_names,
              (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
         FROM orders o
        WHERE ${where.join(' AND ')}
        ORDER BY o.id DESC`,
      args
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// POST /api/customer/orders — tao don pending v3 (multi-line, mig 052)
// Body: {
//   lines: [{ template_id, items?:[{product_id,qty}], field_values?:[{label,value,template_field_id?}], note? }],
//   address?, note?
// }
router.post('/orders', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const lines = Array.isArray(req.body.lines) ? req.body.lines : [];
    if (!lines.length) throw httpErr(400, 'Don phai co it nhat 1 dong cong viec');

    const tplIds = [...new Set(lines.map(l => Number(l.template_id)).filter(Boolean))];
    if (!tplIds.length || tplIds.length !== new Set(lines.map(l => Number(l.template_id))).size) {
      throw httpErr(400, 'Line thieu template_id');
    }
    const [tRows] = await conn.query(
      `SELECT id FROM order_templates WHERE id IN (?) AND is_public = 1 AND is_deleted = 0`, [tplIds]
    );
    if (tRows.length !== tplIds.length) throw httpErr(400, 'Co loai don khong hop le');

    // Gop product_ids cua tat ca line de resolve gia
    const allProductIds = [];
    for (const ln of lines) {
      if (Array.isArray(ln.items)) {
        for (const it of ln.items) {
          const pid = Number(it.product_id);
          if (pid) allProductIds.push(pid);
        }
      }
    }
    let priceMap = new Map();
    if (allProductIds.length) {
      const uniq = [...new Set(allProductIds)];
      const ph = uniq.map(() => '?').join(',');
      const [products] = await conn.query(
        `SELECT id FROM products WHERE id IN (${ph}) AND is_deleted = 0 AND code != 'REPAIR_SERVICE'`, uniq
      );
      if (products.length !== uniq.length) throw httpErr(404, 'San pham khong ton tai');
      priceMap = await resolvePriceMap(conn, uniq, req.user.sub);
    }

    await conn.beginTransaction();
    const customerId = req.user.sub;
    const creatorType = req.user.role === 'daily' ? 'dealer' : 'customer';

    const { code, result } = await insertOrderWithRetry(conn, (code) =>
      conn.query(
        `INSERT INTO orders
          (code, customer_id, total_amount, subtotal, paid_amount,
           payment_method, status, payment_status, address, note,
           creator_type, creator_id)
         VALUES (?, ?, 0, 0, 0,
                 'cash', 'pending', 'unpaid', ?, ?,
                 ?, ?)`,
        [
          code, customerId,
          req.body.address || null,
          req.body.note || null,
          creatorType, customerId,
        ]
      ).then(([r]) => r)
    );
    const orderId = result.insertId;

    let lineSeq = 0;
    for (const ln of lines) {
      lineSeq++;
      const [r] = await conn.query(
        `INSERT INTO order_lines (order_id, template_id, seq, note)
         VALUES (?, ?, ?, ?)`,
        [orderId, Number(ln.template_id), lineSeq, ln.note ? String(ln.note) : null]
      );
      const lineId = r.insertId;

      if (Array.isArray(ln.items)) {
        for (const it of ln.items) {
          const pid = Number(it.product_id);
          if (!pid) continue;
          const qty = Number(it.qty);
          if (!Number.isInteger(qty) || qty < 1 || qty > 9999) {
            throw httpErr(400, 'qty phai la so nguyen 1..9999');
          }
          const price = priceMap.get(pid) || 0;
          await conn.query(
            `INSERT INTO order_items (order_id, line_id, product_id, qty, unit_price)
             VALUES (?, ?, ?, ?, ?)`,
            [orderId, lineId, pid, qty, price]
          );
        }
      }

      if (Array.isArray(ln.field_values)) {
        let seq = 0;
        for (const fv of ln.field_values) {
          const label = String(fv.label || '').trim();
          if (!label) continue;
          seq++;
          await conn.query(
            `INSERT INTO order_field_values (order_id, line_id, template_field_id, label, value, seq)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [orderId, lineId, fv.template_field_id ? Number(fv.template_field_id) : null,
             label, fv.value == null ? null : String(fv.value), seq]
          );
        }
      }
    }

    await recalcOrderTotal(conn, orderId);
    await conn.commit();

    try {
      const [cu] = await db.query(
        `SELECT full_name, phone FROM customers WHERE id = ?`, [customerId]
      );
      const name = (cu[0] && (cu[0].full_name || cu[0].phone)) || `KH-${customerId}`;
      const [tn] = await db.query(`SELECT GROUP_CONCAT(name SEPARATOR ' + ') AS names FROM order_templates WHERE id IN (?)`, [tplIds]);
      await notify.create(db, {
        type: 'order_new',
        title: `Don moi ${code}`,
        message: `${name} vua tao don ${tn[0] && tn[0].names || ''}`.trim(),
        link_url: `/admin/orders.html#order-${orderId}`,
        ref_order_id: orderId,
        ref_customer_id: customerId,
      });
    } catch (_) {}

    res.status(201).json({ id: orderId, code });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { clause, args } = ownerArgs(req.user);
    const [rows] = await db.query(
      `SELECT o.*,
              c.code AS customer_code, c.full_name AS customer_name, c.phone AS customer_phone
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
        WHERE o.id = ? AND ${clause} AND o.is_deleted = 0`,
      [id, ...args]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay don' });

    const [lines] = await db.query(
      `SELECT ol.id, ol.template_id, ol.custom_name, ol.seq, ol.subtotal, ol.note,
              COALESCE(ol.custom_name, t.name) AS template_name
         FROM order_lines ol
         LEFT JOIN order_templates t ON t.id = ol.template_id
        WHERE ol.order_id = ? AND ol.is_deleted = 0
        ORDER BY ol.seq, ol.id`, [id]
    );
    const [items] = await db.query(
      `SELECT oi.*, p.code AS product_code, p.name AS product_name
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?`, [id]
    );
    // Loc charge "Cong lap" — khach KHONG can biet tien cong KTV
    const [charges] = await db.query(
      `SELECT id, line_id, kind, label, amount FROM order_charges
        WHERE order_id = ? AND is_deleted = 0 AND label != 'Công lắp'
        ORDER BY id ASC`, [id]
    );
    const [fieldValues] = await db.query(
      `SELECT id, line_id, label, value, seq FROM order_field_values
        WHERE order_id = ? AND is_deleted = 0
        ORDER BY seq, id`, [id]
    );

    // Group theo line
    const lineMap = new Map(lines.map(l => [l.id, { ...l, items: [], charges: [], field_values: [] }]));
    for (const it of items) if (lineMap.has(it.line_id)) lineMap.get(it.line_id).items.push(it);
    for (const fv of fieldValues) if (lineMap.has(fv.line_id)) lineMap.get(fv.line_id).field_values.push(fv);
    const orderCharges = [];
    for (const c of charges) {
      if (c.line_id == null) orderCharges.push(c);
      else if (lineMap.has(c.line_id)) lineMap.get(c.line_id).charges.push(c);
    }

    const [photos] = await db.query(
      `SELECT id, step_code, url, caption, uploaded_at
         FROM order_step_photos
        WHERE order_id = ? AND is_deleted = 0
        ORDER BY uploaded_at, id`, [id]
    );
    const [staffRow] = await db.query(
      `SELECT s.full_name AS staff_name, s.phone AS staff_phone, s.avatar_url AS staff_avatar
         FROM orders o LEFT JOIN staff s ON s.id = o.assigned_staff_id
        WHERE o.id = ?`, [id]
    );
    const staffInfo = staffRow.length ? staffRow[0] : { staff_name: null, staff_phone: null, staff_avatar: null };
    const steps = await loadTemplateSteps(db);

    const o = { ...rows[0] };
    delete o.wage_amount;

    res.json({
      ...o,
      lines: Array.from(lineMap.values()),
      order_charges: orderCharges,
      step_photos: photos,
      workflow_steps: steps,
      ...staffInfo,
    });
  } catch (err) { next(err); }
});

// Khach huy don pending (chua duoc duyet)
router.post('/orders/:id/cancel', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { clause, args } = ownerArgs(req.user);
    const [rows] = await db.query(
      `SELECT o.id, o.status FROM orders o WHERE o.id = ? AND ${clause} AND o.is_deleted = 0`,
      [id, ...args]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay don' });
    if (rows[0].status !== 'pending') {
      return res.status(409).json({ error: 'Don da duoc duyet, khong the tu huy. Vui long lien he admin.' });
    }
    await db.query(`UPDATE orders SET status = 'cancelled' WHERE id = ?`, [id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Khach upload anh kem 1 buoc (neu role 'customer' co trong update_roles cua step)
router.post('/orders/:id/step-photos', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const stepCode = String(req.body.step_code || '').trim();
    const url = String(req.body.url || '').trim();
    if (!stepCode || !url) return res.status(400).json({ error: 'Thieu step_code / url' });

    const { clause, args } = ownerArgs(req.user);
    const [rows] = await db.query(
      `SELECT o.id FROM orders o WHERE o.id = ? AND ${clause} AND o.is_deleted = 0`,
      [id, ...args]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay don' });

    const steps = await loadTemplateSteps(db);
    const step = steps.find(s => s.code === stepCode);
    if (!step) return res.status(400).json({ error: 'Buoc khong hop le' });
    if (!step.update_roles.includes('customer')) {
      return res.status(403).json({ error: 'Khach khong duoc thao tac buoc nay' });
    }

    const [r] = await db.query(
      `INSERT INTO order_step_photos (order_id, step_code, url, caption, uploaded_by)
       VALUES (?, ?, ?, ?, ?)`,
      [id, stepCode, url, req.body.caption ? String(req.body.caption) : null, req.user.sub]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) { next(err); }
});

// Khach chuyen step (vd: duyet bao gia trong don sua chua) neu role='customer' co quyen.
router.post('/orders/:id/transition', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const target = String(req.body.step_code || '').trim();
    if (!target) return res.status(400).json({ error: 'Thieu step_code' });

    const { clause, args } = ownerArgs(req.user);
    const [rows] = await db.query(
      `SELECT o.id, o.status FROM orders o WHERE o.id = ? AND ${clause} AND o.is_deleted = 0`,
      [id, ...args]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay don' });

    const steps = await loadTemplateSteps(db);
    const v = validateTransition(steps, rows[0].status, target, 'customer');
    if (!v.ok) return res.status(403).json({ error: v.error });

    await db.query(`UPDATE orders SET status = ? WHERE id = ?`, [target, id]);
    res.json({ ok: true, status: target });
  } catch (err) { next(err); }
});

// Danh gia KTV sau khi don ket thuc
router.post('/orders/:id/review', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const rating = Number(req.body.rating);
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'rating 1..5' });
    const comment = req.body.comment ? String(req.body.comment).trim() : null;

    await conn.beginTransaction();
    const [t] = await conn.query(
      `SELECT id, assigned_staff_id, customer_id, completed_at
         FROM orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`,
      [req.params.id]
    );
    if (!t.length) { await conn.rollback(); return res.status(404).json({ error: 'Khong tim thay' }); }
    if (t[0].customer_id !== req.user.sub) { await conn.rollback(); return res.status(403).json({ error: 'Khong phai don cua ban' }); }
    if (!t[0].assigned_staff_id) { await conn.rollback(); return res.status(400).json({ error: 'Don chua co KTV' }); }
    if (!t[0].completed_at) { await conn.rollback(); return res.status(400).json({ error: 'Don chua hoan thanh' }); }

    const [exist] = await conn.query(
      `SELECT id FROM staff_reviews WHERE order_id = ? AND staff_id = ?`,
      [req.params.id, t[0].assigned_staff_id]
    );
    if (exist.length) { await conn.rollback(); return res.status(409).json({ error: 'Da danh gia roi' }); }

    await conn.query(
      `INSERT INTO staff_reviews (staff_id, order_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
      [t[0].assigned_staff_id, req.params.id, rating, comment]
    );
    await conn.query(
      `UPDATE staff SET rating = (SELECT AVG(rating) FROM staff_reviews WHERE staff_id = ?)
        WHERE id = ?`, [t[0].assigned_staff_id, t[0].assigned_staff_id]
    );
    await conn.commit();
    res.status(201).json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ============================================================
// CHAT
// ============================================================
router.post('/uploads/chat', (req, res, next) => {
  try {
    const url = saveDataUrl(req.body && req.body.dataUrl, 'chat', { maxBytes: 20 * 1024 * 1024 });
    res.json({ url, name: req.body && req.body.name ? String(req.body.name) : null });
  } catch (err) { next(err); }
});

router.get('/conversations/me', async (req, res, next) => {
  try {
    let [cv] = await db.query(
      `SELECT * FROM conversations WHERE customer_id = ? AND is_deleted = 0 LIMIT 1`,
      [req.user.sub]
    );
    if (!cv.length) {
      const [r] = await db.query(
        `INSERT INTO conversations (customer_id) VALUES (?)`, [req.user.sub]
      );
      cv = [{ id: r.insertId, customer_id: req.user.sub, last_message_at: null }];
    }
    res.json(cv[0]);
  } catch (err) { next(err); }
});

router.get('/conversations/:id/messages', async (req, res, next) => {
  try {
    const [cv] = await db.query(
      `SELECT id FROM conversations
        WHERE id = ? AND customer_id = ? AND is_deleted = 0`,
      [req.params.id, req.user.sub]
    );
    if (!cv.length) return res.status(404).json({ error: 'Khong tim thay' });
    const [rows] = await db.query(
      `SELECT m.id, m.conversation_id, m.order_id, m.sender_type, m.sender_id,
              m.content, m.sent_at, m.read_at,
              o.code AS order_code
         FROM messages m
         LEFT JOIN orders o ON o.id = m.order_id
        WHERE m.conversation_id = ? AND m.visibility = 'all'
        ORDER BY m.id ASC LIMIT 200`,
      [req.params.id]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

router.post('/conversations/:id/messages/screenshot', async (req, res, next) => {
  try {
    const url = String(req.body.content || '').trim();
    if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'URL khong hop le' });
    const [cv] = await db.query(
      `SELECT id FROM conversations
        WHERE id = ? AND customer_id = ? AND is_deleted = 0`,
      [req.params.id, req.user.sub]
    );
    if (!cv.length) return res.status(404).json({ error: 'Khong tim thay' });
    const [result] = await db.query(
      `INSERT INTO messages (conversation_id, sender_type, sender_id, content, visibility)
       VALUES (?, 'customer', ?, ?, 'staff_only')`,
      [req.params.id, req.user.sub, url]
    );
    await db.query(`UPDATE conversations SET last_message_at = NOW() WHERE id = ?`, [req.params.id]);
    const [rows] = await db.query(`SELECT * FROM messages WHERE id = ?`, [result.insertId]);
    if (global.io) {
      global.io.to('admin').emit('message:new', rows[0]);
      global.io.to('admin').emit('message:new-toast', {
        conversation_id: Number(req.params.id),
        content: rows[0].content,
        from: req.user.code || req.user.sub,
        screenshot: true,
      });
      const [members] = await db.query(
        `SELECT staff_id FROM conversation_members
          WHERE conversation_id = ? AND removed_at IS NULL`,
        [req.params.id]
      );
      members.forEach(m => global.io.to(`staff-${m.staff_id}`).emit('message:new', rows[0]));
    }
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/conversations/:id/messages', async (req, res, next) => {
  try {
    const content = String(req.body.content || '').trim();
    if (!content) return res.status(400).json({ error: 'Tin nhan rong' });
    const [cv] = await db.query(
      `SELECT id FROM conversations
        WHERE id = ? AND customer_id = ? AND is_deleted = 0`,
      [req.params.id, req.user.sub]
    );
    if (!cv.length) return res.status(404).json({ error: 'Khong tim thay' });

    let orderId = null;
    if (req.body.order_id) {
      orderId = Number(req.body.order_id);
      const [o] = await db.query(
        `SELECT id FROM orders WHERE id = ? AND customer_id = ? AND is_deleted = 0`,
        [orderId, req.user.sub]
      );
      if (!o.length) return res.status(400).json({ error: 'Don khong hop le' });
    }

    const [result] = await db.query(
      `INSERT INTO messages (conversation_id, order_id, sender_type, sender_id, content)
       VALUES (?, ?, 'customer', ?, ?)`,
      [req.params.id, orderId, req.user.sub, content]
    );
    await db.query(`UPDATE conversations SET last_message_at = NOW() WHERE id = ?`, [req.params.id]);
    const [rows] = await db.query(
      `SELECT m.*, o.code AS order_code
         FROM messages m LEFT JOIN orders o ON o.id = m.order_id
        WHERE m.id = ?`, [result.insertId]
    );
    if (global.io) {
      global.io.to(`conv-${req.params.id}`).emit('message:new', rows[0]);
      global.io.to('admin').emit('message:new-toast', {
        conversation_id: Number(req.params.id),
        content: rows[0].content,
        from: req.user.code || req.user.sub,
      });
    }
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ============================================================
// CUSTOMER ASSETS — chu so huu tu them/sua/xoa, khong qua duyet
// ============================================================
const ASSET_KIND_CFG = {
  account: { table: 'customer_accounts', valueCol: 'account_name' },
  vehicle: { table: 'customer_vehicles', valueCol: 'plate' },
  sim:     { table: 'customer_sims',     valueCol: 'sim_number' },
};
function vAssetValue(input) {
  const v = String(input == null ? '' : input).trim();
  if (!v) return { ok: false, error: 'Thieu gia tri' };
  if (v.length > 255) return { ok: false, error: 'Gia tri qua dai' };
  if (/[<>]/.test(v)) return { ok: false, error: 'Gia tri chua ky tu khong hop le' };
  return { ok: true, value: v };
}

// GET /api/customer/assets
router.get('/assets', async (req, res, next) => {
  try {
    const cid = req.user.sub;
    const [accounts] = await db.query(
      `SELECT id, account_name, note FROM customer_accounts
        WHERE customer_id = ? AND is_deleted = 0 ORDER BY id DESC`, [cid]
    );
    const [vehicles] = await db.query(
      `SELECT id, plate, note FROM customer_vehicles
        WHERE customer_id = ? AND is_deleted = 0 ORDER BY id DESC`, [cid]
    );
    const [sims] = await db.query(
      `SELECT id, sim_number, note FROM customer_sims
        WHERE customer_id = ? AND is_deleted = 0 ORDER BY id DESC`, [cid]
    );
    res.json({ accounts, vehicles, sims });
  } catch (err) { next(err); }
});

// POST /api/customer/assets/:kind { value, note }
router.post('/assets/:kind', async (req, res, next) => {
  try {
    const cfg = ASSET_KIND_CFG[req.params.kind];
    if (!cfg) return res.status(400).json({ error: 'asset_kind khong hop le' });
    const v = vAssetValue(req.body && req.body.value);
    if (!v.ok) return res.status(400).json({ error: v.error });
    const note = req.body && req.body.note ? String(req.body.note).slice(0, 500) : null;
    const [r] = await db.query(
      `INSERT INTO ${cfg.table} (customer_id, ${cfg.valueCol}, note) VALUES (?, ?, ?)`,
      [req.user.sub, v.value, note]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) { next(err); }
});

// PUT /api/customer/assets/:kind/:id
router.put('/assets/:kind/:id', async (req, res, next) => {
  try {
    const cfg = ASSET_KIND_CFG[req.params.kind];
    if (!cfg) return res.status(400).json({ error: 'asset_kind khong hop le' });
    const v = vAssetValue(req.body && req.body.value);
    if (!v.ok) return res.status(400).json({ error: v.error });
    const note = req.body && req.body.note !== undefined
      ? (req.body.note ? String(req.body.note).slice(0, 500) : null) : undefined;
    const sets = [`${cfg.valueCol} = ?`];
    const args = [v.value];
    if (note !== undefined) { sets.push('note = ?'); args.push(note); }
    args.push(Number(req.params.id), req.user.sub);

    const [r] = await db.query(
      `UPDATE ${cfg.table} SET ${sets.join(', ')}
        WHERE id = ? AND customer_id = ? AND is_deleted = 0`, args
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// DELETE /api/customer/assets/:kind/:id
router.delete('/assets/:kind/:id', async (req, res, next) => {
  try {
    const cfg = ASSET_KIND_CFG[req.params.kind];
    if (!cfg) return res.status(400).json({ error: 'asset_kind khong hop le' });
    const [r] = await db.query(
      `UPDATE ${cfg.table} SET is_deleted = 1
        WHERE id = ? AND customer_id = ? AND is_deleted = 0`,
      [Number(req.params.id), req.user.sub]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
