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

    const where = ["p.is_deleted = 0", "p.code != 'REPAIR_SERVICE'"];
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
        WHERE p.id = ? AND p.is_deleted = 0 AND p.code != 'REPAIR_SERVICE'`,
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
      `SELECT o.id, o.code, o.status, o.payment_status,
              o.address, o.note, o.subtotal, o.total_amount, o.paid_amount,
              o.payment_method, o.confirmed_at, o.completed_at,
              (SELECT GROUP_CONCAT(COALESCE(ol.custom_name, t.name) ORDER BY ol.seq SEPARATOR ' + ')
                 FROM order_lines ol
                 LEFT JOIN order_templates t ON t.id = ol.template_id
                WHERE ol.order_id = o.id AND ol.is_deleted = 0) AS template_name,
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

// ---- GET /api/public/invoice/:code ----------------------------
// Tra du lieu hoa don bao gia (cho trang /invoice.html khach mo).
// KHONG leak: cost_price, wage_amount, dealer info.
router.get('/invoice/:code', async (req, res, next) => {
  try {
    const code = String(req.params.code || '').trim();
    if (!code) return res.status(400).json({ error: 'Thieu ma don' });

    const [orderRows] = await db.query(
      `SELECT o.id, o.code, o.status, o.progress_note, o.payment_status,
              o.address, o.note,
              o.subtotal, o.total_amount, o.paid_amount,
              o.created_at, o.confirmed_at, o.completed_at,
              c.full_name AS customer_name, c.phone AS customer_phone,
              s.full_name AS staff_name
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         LEFT JOIN staff     s ON s.id = o.assigned_staff_id
        WHERE o.code = ? AND o.is_deleted = 0`,
      [code]
    );
    if (!orderRows.length) return res.status(404).json({ error: 'Khong tim thay don' });
    const order = orderRows[0];

    const [lines] = await db.query(
      `SELECT ol.id, ol.template_id, ol.seq, ol.subtotal, ol.note,
              COALESCE(ol.custom_name, t.name) AS template_name
         FROM order_lines ol
         LEFT JOIN order_templates t ON t.id = ol.template_id
        WHERE ol.order_id = ? AND ol.is_deleted = 0
        ORDER BY ol.seq, ol.id`,
      [order.id]
    );

    const [items] = await db.query(
      `SELECT oi.line_id, oi.qty, oi.unit_price, oi.vat_percent,
              p.id AS product_id, p.code AS product_code, p.name AS product_name,
              p.image_url AS product_image, p.thumbnail_url AS product_thumb,
              p.description AS product_description, p.warranty_months AS product_warranty_months
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?`,
      [order.id]
    );
    // An "Cong lap" tren bao gia khach
    const [charges] = await db.query(
      `SELECT line_id, kind, label, amount FROM order_charges
        WHERE order_id = ? AND is_deleted = 0 AND label != 'Công lắp'
        ORDER BY id`,
      [order.id]
    );
    const [fieldValues] = await db.query(
      `SELECT line_id, label, value FROM order_field_values
        WHERE order_id = ? AND is_deleted = 0 ORDER BY seq, id`,
      [order.id]
    );

    // Group theo line
    const lineMap = new Map(
      lines.map(l => [l.id, { ...l, items: [], charges: [], field_values: [] }])
    );
    for (const it of items) if (lineMap.has(it.line_id)) lineMap.get(it.line_id).items.push(it);
    for (const fv of fieldValues) if (lineMap.has(fv.line_id)) lineMap.get(fv.line_id).field_values.push(fv);
    const orderCharges = [];
    for (const c of charges) {
      if (c.line_id == null) orderCharges.push(c);
      else if (lineMap.has(c.line_id)) lineMap.get(c.line_id).charges.push(c);
    }

    // Cong ty + bank info tu app_settings
    const [settingRows] = await db.query(
      `SELECT \`key\`, \`value\` FROM app_settings
        WHERE \`key\` LIKE 'company.%' OR \`key\` LIKE 'bank.%'`
    );
    const settings = {};
    for (const r of settingRows) settings[r.key] = r.value || '';

    res.json({
      ...order,
      lines: Array.from(lineMap.values()),
      order_charges: orderCharges,
      settings,
    });
  } catch (err) { next(err); }
});

module.exports = router;
