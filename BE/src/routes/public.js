// /api/public — endpoint cho trang khach le, KHONG can token.
// Mount tai server.js: app.use('/api/public', publicRoutes) (KHONG verifyToken).
//
// Chi tra du lieu khach hang duoc xem (khong leak cost_price, gia dai ly...).

const express = require('express');
const db = require('../db');

const router = express.Router();

// ---- GET /api/public/categories -------------------------------
router.get('/categories', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name FROM categories WHERE is_deleted = 0 ORDER BY name ASC`
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ---- GET /api/public/products ---------------------------------
// Query:
//   q              tim theo ten/ma
//   category_id    loc theo loai
//   price_min      >= price_min (theo gia retail = sort_order=1)
//   price_max      <= price_max
//   sort           name | price_asc | price_desc | newest
//   page, limit
router.get('/products', async (req, res, next) => {
  try {
    const q          = (req.query.q || '').trim();
    const categoryId = parseInt(req.query.category_id) || 0;
    const priceMin   = parseInt(req.query.price_min)   || 0;
    const priceMax   = parseInt(req.query.price_max)   || 0;
    const sort       = req.query.sort || 'name';
    const page       = Math.max(1, parseInt(req.query.page)  || 1);
    const limit      = Math.min(48, Math.max(1, parseInt(req.query.limit) || 12));
    const offset     = (page - 1) * limit;

    const where = ['p.is_deleted = 0'];
    const args  = [];

    if (q) {
      where.push('(p.name LIKE ? OR p.code LIKE ?)');
      args.push(`%${q}%`, `%${q}%`);
    }
    if (categoryId) {
      where.push('p.category_id = ?');
      args.push(categoryId);
    }
    if (priceMin) { where.push('pp.price >= ?'); args.push(priceMin); }
    if (priceMax) { where.push('pp.price <= ?'); args.push(priceMax); }

    let orderBy = 'p.name ASC';
    if (sort === 'price_asc')  orderBy = 'pp.price ASC, p.name ASC';
    if (sort === 'price_desc') orderBy = 'pp.price DESC, p.name ASC';
    if (sort === 'newest')     orderBy = 'p.id DESC';

    const whereSql = 'WHERE ' + where.join(' AND ');
    // Trang public hien thi gia tier duoc admin danh dau is_default=1.
    const fromJoin = `
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_prices pp ON pp.product_id = p.id
        AND pp.tier_id = (SELECT id FROM price_tiers WHERE is_default = 1 AND is_deleted = 0 LIMIT 1)
    `;

    const [countRows] = await db.query(`SELECT COUNT(*) AS total ${fromJoin} ${whereSql}`, args);
    const total = countRows[0].total;

    const [rows] = await db.query(
      `SELECT p.id, p.code, p.name, p.image_url, p.thumbnail_url,
              p.warranty_months, p.description,
              p.category_id, c.name AS category_name,
              pp.price AS retail_price
       ${fromJoin}
       ${whereSql}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    res.json({ items: rows, total, page, limit });
  } catch (err) { next(err); }
});

// ---- GET /api/public/products/:id -----------------------------
router.get('/products/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const [rows] = await db.query(
      `SELECT p.id, p.code, p.name, p.image_url, p.thumbnail_url,
              p.warranty_months, p.description,
              p.category_id, c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ? AND p.is_deleted = 0`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

    const [priceRows] = await db.query(
      `SELECT pp.price
         FROM product_prices pp
         JOIN price_tiers pt ON pt.id = pp.tier_id
        WHERE pp.product_id = ? AND pt.is_default = 1 AND pt.is_deleted = 0
        LIMIT 1`,
      [id]
    );
    const [attrs] = await db.query(
      `SELECT label, value, position FROM product_attributes
        WHERE product_id = ? ORDER BY sort_order ASC`,
      [id]
    );
    const [blocks] = await db.query(
      `SELECT id, block_type, content, caption, sort_order
         FROM product_blocks
        WHERE product_id = ? ORDER BY sort_order ASC`,
      [id]
    );

    // Backward-compat: column 'position' co the chua ton tai (truoc khi chay
    // migration_007). Coi tat ca la 'top'.
    const attributes_top    = attrs.filter(a => (a.position || 'top') !== 'bottom').map(({position, ...r}) => r);
    const attributes_bottom = attrs.filter(a => a.position === 'bottom').map(({position, ...r}) => r);

    res.json({
      ...rows[0],
      retail_price: priceRows[0]?.price || null,
      attributes_top,
      attributes_bottom,
      blocks,
      // Giu key cu cho code chua migrate
      attributes: attributes_top.concat(attributes_bottom),
    });
  } catch (err) { next(err); }
});

// ---- GET /api/public/orders/:code -----------------------------
// Trang track-order cho khach (KHONG auth, chi can biet code).
// Tra thong tin co ban + tien do task. KHONG leak: cost_price, dealer info,
// IMEI day du (chi 4 so cuoi), cong KTV.
router.get('/orders/:code', async (req, res, next) => {
  try {
    const code = String(req.params.code || '').trim();
    if (!code) return res.status(400).json({ error: 'Thieu ma don' });

    const [orderRows] = await db.query(
      `SELECT o.id, o.code, o.status, o.service_kind, o.area, o.address,
              o.vehicle_plate, o.note, o.subtotal, o.total_amount, o.paid_amount,
              o.payment_method, o.confirmed_at,
              c.full_name AS customer_name, c.phone AS customer_phone
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
        WHERE o.code = ? AND o.is_deleted = 0`,
      [code]
    );
    if (!orderRows.length) return res.status(404).json({ error: 'Khong tim thay don' });
    const order = orderRows[0];

    const [items] = await db.query(
      `SELECT oi.qty, oi.unit_price,
              p.code AS product_code, p.name AS product_name, p.thumbnail_url
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?`,
      [order.id]
    );

    const [charges] = await db.query(
      `SELECT kind, label, amount FROM order_charges
        WHERE order_id = ? AND is_deleted = 0 ORDER BY id`,
      [order.id]
    );

    // KTV info — chi info don gian, KHONG kem cong KTV / collect
    const [staffRow] = await db.query(
      `SELECT s.full_name AS staff_name
         FROM orders o LEFT JOIN staff s ON s.id = o.assigned_staff_id
        WHERE o.id = ?`,
      [order.id]
    );
    const staffName = staffRow.length ? staffRow[0].staff_name : null;

    // Mask SDT khach: "0xxx xxx 234"
    const phoneMasked = order.customer_phone
      ? order.customer_phone.replace(/^(\d{2})\d{4,5}(\d{2,3})$/, '$1*****$2')
      : null;

    res.json({
      ...order,
      customer_phone: phoneMasked,
      items,
      charges,
      staff_name: staffName,
    });
  } catch (err) { next(err); }
});

// ==========================================================
// Renewal public flow — mo bang link gui khach (khong can login)
// URL FE: /customer/order-public.html?t=<public_token>
// ----------------------------------------------------------
//   GET    /renewal/:token              -> chi tiet don (mask SDT)
//   POST   /renewal/:token/accept       -> quoted -> awaiting_payment (transfer)
//   POST   /renewal/:token/mark-debt    -> quoted -> awaiting_payment (debt)
//   POST   /renewal/:token/report-payment -> awaiting_payment(transfer) -> payment_reported
// ==========================================================

async function loadRenewalByToken(token) {
  if (!token || token.length < 16) return null;
  const [rows] = await db.query(
    `SELECT o.id, o.code, o.status, o.service_kind, o.total_amount, o.paid_amount,
            o.payment_method, o.subtotal, o.note, o.public_token,
            c.full_name AS customer_name, c.phone AS customer_phone, c.type AS customer_type
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
      WHERE o.public_token = ? AND o.is_deleted = 0
      LIMIT 1`,
    [token]
  );
  if (!rows.length) return null;
  if (rows[0].service_kind !== 'renewal') return null;
  return rows[0];
}

// ---- GET /api/public/renewal/:token --------------------------
router.get('/renewal/:token', async (req, res, next) => {
  try {
    const order = await loadRenewalByToken(String(req.params.token || ''));
    if (!order) return res.status(404).json({ error: 'Khong tim thay don' });

    const [items] = await db.query(
      `SELECT oi.id, oi.qty, oi.unit_price,
              oi.vehicle_plate, oi.imei, oi.subscription_account, oi.years, oi.phone,
              p.code AS product_code, p.name AS product_name
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?
        ORDER BY oi.id ASC`,
      [order.id]
    );
    const [charges] = await db.query(
      `SELECT kind, label, amount FROM order_charges
        WHERE order_id = ? AND is_deleted = 0 ORDER BY id ASC`,
      [order.id]
    );

    // Lay app_settings ngan hang de FE hien QR + STK khi khach bam Chap nhan
    const [bankRows] = await db.query(
      `SELECT \`key\`, \`value\` FROM app_settings
        WHERE \`key\` LIKE 'bank.%' OR \`key\` LIKE 'qr.%'`
    );
    const bankInfo = {};
    bankRows.forEach(r => { bankInfo[r.key] = r.value; });

    const phone = order.customer_phone || '';
    const phoneMasked = phone
      ? phone.replace(/^(\d{2})\d{4,5}(\d{2,3})$/, '$1*****$2')
      : null;

    res.json({
      id: order.id,
      code: order.code,
      status: order.status,
      service_kind: order.service_kind,
      total_amount: order.total_amount,
      paid_amount: order.paid_amount,
      subtotal: order.subtotal,
      payment_method: order.payment_method,
      note: order.note,
      customer_name: order.customer_name,
      customer_phone: phoneMasked,
      customer_type: order.customer_type, // 'retail' | 'dealer' — FE dung de canh bao mark-debt
      items,
      charges,
      bank: bankInfo,
    });
  } catch (err) { next(err); }
});

// ---- POST /api/public/renewal/:token/accept ------------------
// Khach bam "Chap nhan va chuyen khoan" -> awaiting_payment, payment_method='transfer'.
router.post('/renewal/:token/accept', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const token = String(req.params.token || '');
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status, service_kind FROM orders
        WHERE public_token = ? AND is_deleted = 0 FOR UPDATE`,
      [token]
    );
    if (!rows.length || rows[0].service_kind !== 'renewal') {
      await conn.rollback();
      return res.status(404).json({ error: 'Khong tim thay don' });
    }
    if (rows[0].status !== 'quoted') {
      await conn.rollback();
      return res.status(409).json({ error: `Don dang trang thai ${rows[0].status}, khong the chap nhan` });
    }
    await conn.query(
      `UPDATE orders SET status = 'awaiting_payment', payment_method = 'transfer'
        WHERE id = ?`,
      [rows[0].id]
    );
    await conn.commit();
    res.json({ ok: true, status: 'awaiting_payment' });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- POST /api/public/renewal/:token/mark-debt ---------------
// Khach bam "Ghi no" -> awaiting_payment, payment_method='debt'.
// Khong bat buoc dieu kien debt_limit — moi khach deu ghi no duoc (theo flow user xac nhan).
router.post('/renewal/:token/mark-debt', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const token = String(req.params.token || '');
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status, service_kind FROM orders
        WHERE public_token = ? AND is_deleted = 0 FOR UPDATE`,
      [token]
    );
    if (!rows.length || rows[0].service_kind !== 'renewal') {
      await conn.rollback();
      return res.status(404).json({ error: 'Khong tim thay don' });
    }
    if (rows[0].status !== 'quoted') {
      await conn.rollback();
      return res.status(409).json({ error: `Don dang trang thai ${rows[0].status}, khong the chuyen ghi no` });
    }
    await conn.query(
      `UPDATE orders SET status = 'awaiting_payment', payment_method = 'debt'
        WHERE id = ?`,
      [rows[0].id]
    );
    await conn.commit();
    res.json({ ok: true, status: 'awaiting_payment', payment_method: 'debt' });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- POST /api/public/renewal/:token/report-payment ----------
// Khach bam "Toi da chuyen khoan" -> payment_reported, cho admin xac nhan + gia han.
router.post('/renewal/:token/report-payment', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const token = String(req.params.token || '');
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status, service_kind, payment_method FROM orders
        WHERE public_token = ? AND is_deleted = 0 FOR UPDATE`,
      [token]
    );
    if (!rows.length || rows[0].service_kind !== 'renewal') {
      await conn.rollback();
      return res.status(404).json({ error: 'Khong tim thay don' });
    }
    if (rows[0].status !== 'awaiting_payment' || rows[0].payment_method !== 'transfer') {
      await conn.rollback();
      return res.status(409).json({ error: 'Don chua o trang thai cho thanh toan chuyen khoan' });
    }
    await conn.query(
      `UPDATE orders SET status = 'payment_reported' WHERE id = ?`,
      [rows[0].id]
    );
    await conn.commit();
    res.json({ ok: true, status: 'payment_reported' });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

module.exports = router;
