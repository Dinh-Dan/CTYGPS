// /api/customer — endpoint chung cho khach le (role='customer') va dai ly (role='daily')
// Dai ly va khach le deu la 1 record trong table `customers` (phan biet bang cot `type`).
// Tu 2026-04: dai ly hanh xu nhu khach hang — KHONG dat ho cho khach cuoi nua.
// Don/badge cua dai ly: customer_id = sub, dealer_id = NULL (giong khach le).
// Don cu (dealer dat ho) van hien thi cho dai ly qua filter (customer_id=sub OR dealer_id=sub)
// de khong mat lich su. Admin van co the gan dealer_id thu cong khi tao don tay.
const express = require('express');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { recalcOrderTotal, insertOrderWithRetry } = require('../utils/orderState');
const { resolvePriceMap } = require('../utils/priceResolver');
const VEHICLE_TYPE_LABEL_VI = {
  'truck_under_3.5t': 'Tải dưới 3.5T',
  'truck_over_3.5t':  'Tải trên 3.5T',
  passenger: 'Xe khách',
  contract:  'Xe hợp đồng',
  taxi:      'Taxi',
  other:     'Khác',
};
const { insertWarrantyWithRetry, loadWarrantyItems } = require('../utils/warrantyState');
const { insertRepairWithRetry } = require('../utils/repairState');
const { saveDataUrl } = require('../utils/saveUpload');
const notify = require('../utils/notify');

const router = express.Router();

router.use(verifyToken, requireRole('customer', 'daily'));

router.get('/ping', (req, res) => {
  res.json({ ok: true, role: req.user.role, user: req.user });
});


// ==========================================================
// /profile — sua thong tin ca nhan cua khach
// KHONG cho phep sua phone (la login key — neu doi se chiem tai khoan
// nguoi khac neu trung SDT). Doi phone phai co flow OTP rieng.
// ==========================================================

// Validators noi bo (lap lai cung rule voi auth.js de tranh import vong)
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

    const vN = vName(body.full_name);
    if (!vN.ok) return res.status(400).json({ error: vN.error });
    const vE = vEmail(body.email);
    if (!vE.ok) return res.status(400).json({ error: vE.error });
    const vA = vAddress(body.address);
    if (!vA.ok) return res.status(400).json({ error: vA.error });

    // Khach le -> type='retail'; dai ly -> type='dealer'. Chi cho phep update
    // record dung type cua minh, tranh truong hop token role 'daily' lai sua dc retail.
    const expectedType = req.user.role === 'daily' ? 'dealer' : 'retail';
    await db.query(
      `UPDATE customers SET full_name = ?, email = ?, address = ?
        WHERE id = ? AND type = ? AND is_deleted = 0`,
      [vN.value, vE.value, vA.value, req.user.sub, expectedType]
    );

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

// ==========================================================
// /me — info tong hop ca khach le va dai ly (kem cong no cho dai ly)
// FE goi /auth/me se duoc info co ban; goi /api/customer/me se kem
// debt cho dai ly va so don dang xu ly cho khach le.
// ==========================================================
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
      // Cong no dai ly = SUM(total - paid) cua cac don chua tra du.
      // Bao gom: don dai ly tu mua (customer_id=sub) + don cu dat ho (dealer_id=sub, back-compat).
      const [debtRow] = await db.query(
        `SELECT COALESCE(SUM(total_amount - paid_amount), 0) AS debt
           FROM orders
          WHERE (customer_id = ? OR dealer_id = ?)
            AND status IN ('done','customer_owes','pending_admin_confirm','staff_owes')
            AND is_deleted = 0
            AND total_amount > paid_amount`,
        [req.user.sub, req.user.sub]
      );
      me.debt = Number(debtRow[0].debt) || 0;
    }

    res.json({ user: me });
  } catch (err) { next(err); }
});

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// ==========================================================
// /products — list/detail san pham, gia ap dung priority resolver:
//   override (customer_product_prices) > tier theo default_tier_id > is_default.
// Khach login (customer hoac dai ly) goi endpoint nay de thay gia rieng cua minh;
// trang public (chua login) goi /api/public/products thi chi thay gia is_default.
// ==========================================================
router.get('/products', async (req, res, next) => {
  try {
    const q          = (req.query.q || '').trim();
    const categoryId = parseInt(req.query.category_id) || 0;
    const sort       = req.query.sort || 'name';
    const page       = Math.max(1, parseInt(req.query.page) || 1);
    const limit      = Math.min(48, Math.max(1, parseInt(req.query.limit) || 12));
    const offset     = (page - 1) * limit;

    const where = ['p.is_deleted = 0'];
    const args  = [];
    if (q) {
      where.push('(p.name LIKE ? OR p.code LIKE ?)');
      args.push(`%${q}%`, `%${q}%`);
    }
    if (categoryId) { where.push('p.category_id = ?'); args.push(categoryId); }

    let orderBy = 'p.name ASC';
    if (sort === 'newest') orderBy = 'p.id DESC';
    // sort theo gia: lam o JS sau khi resolve (vi gia thay doi theo customer)

    const whereSql = 'WHERE ' + where.join(' AND ');

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM products p ${whereSql}`, args
    );
    const total = countRows[0].total;

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

      // Sort theo gia o JS sau khi resolve (chi neu user yeu cau)
      if (sort === 'price_asc' || sort === 'price_desc') {
        rows.sort((a, b) => {
          const av = a.retail_price || 0, bv = b.retail_price || 0;
          return sort === 'price_asc' ? av - bv : bv - av;
        });
      }
    }

    res.json({ items: rows, total, page, limit });
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
        WHERE p.id = ? AND p.is_deleted = 0`,
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

// ==========================================================
// /orders — danh sach don
//   - khach le va dai ly deu thay don cua chinh minh (customer_id = sub).
//   - Don cu dai ly dat ho khach cuoi (dealer_id = sub) van hien de khong mat
//     lich su, qua filter OR.
// ==========================================================
router.get('/orders', async (req, res, next) => {
  try {
    const status = req.query.status;
    const isDealer = req.user.role === 'daily';
    const ownerClause = isDealer
      ? '(o.customer_id = ? OR o.dealer_id = ?)'
      : 'o.customer_id = ?';
    const where = [ownerClause, 'o.is_deleted = 0'];
    const args = isDealer ? [req.user.sub, req.user.sub] : [req.user.sub];
    if (status) { where.push('o.status = ?'); args.push(status); }

    const [rows] = await db.query(
      `SELECT o.id, o.code, o.subtotal, o.total_amount, o.paid_amount, o.payment_method,
              o.status, o.service_kind, o.area, o.address, o.vehicle_plate, o.subscription_account,
              o.note, o.confirmed_at, o.debt_carried_at,
              o.assigned_staff_id, o.kind, o.due_at, o.completed_at,
              c.id AS customer_id, c.full_name AS customer_name, c.phone AS customer_phone,
              b.id AS badge_id, b.code AS badge_code, b.status AS badge_status, b.vehicle_type AS badge_vehicle_type,
              (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         LEFT JOIN badges    b ON b.order_id = o.id AND b.is_deleted = 0
        WHERE ${where.join(' AND ')}
        ORDER BY o.id DESC`,
      args
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ---- POST /api/customer/orders --------------------------------
// Body: { items, address?, vehicle_plate?, area?, note?, service_kind? }
// Khach le va dai ly deu len don cho chinh minh: customer_id = sub, dealer_id = NULL.
// Don luon co status='pending_review' va lay gia theo default_tier_id cua nguoi tao.
router.post('/orders', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const SERVICE_KINDS = ['install', 'maintenance', 'warranty', 'renewal'];
    const serviceKind = req.body.service_kind || 'install';
    if (!SERVICE_KINDS.includes(serviceKind)) throw httpErr(400, 'service_kind khong hop le');

    const items = Array.isArray(req.body.items) ? req.body.items : [];
    // Maintenance/warranty/renewal co the khong can items (chi can bien so xe)
    if (serviceKind === 'install' && !items.length) {
      throw httpErr(400, 'Don phai co it nhat 1 san pham');
    }

    // Validate products va lay gia theo priority resolver:
    //   override (customer_product_prices) > tier theo default_tier_id > tier is_default.
    let priceMap = new Map();
    if (items.length) {
      const productIds = items.map(it => Number(it.product_id)).filter(Boolean);
      if (!productIds.length) throw httpErr(400, 'Items thieu product_id');
      const ph = productIds.map(() => '?').join(',');
      const [products] = await conn.query(
        `SELECT id FROM products WHERE id IN (${ph}) AND is_deleted = 0`,
        productIds
      );
      if (products.length !== new Set(productIds).size) {
        throw httpErr(404, 'San pham khong ton tai');
      }
      priceMap = await resolvePriceMap(conn, productIds, req.user.sub);
    }

    await conn.beginTransaction();

    const customerId = req.user.sub;
    const creatorType = req.user.role === 'daily' ? 'dealer' : 'customer';

    const { result } = await insertOrderWithRetry(conn, (code) =>
      conn.query(
        `INSERT INTO orders
          (code, customer_id, dealer_id, total_amount, subtotal, paid_amount, payment_method,
           status, area, address, vehicle_plate, subscription_account, service_kind, note,
           creator_type, creator_id)
         VALUES (?, ?, NULL, 0, 0, 0, 'debt', 'pending_review',
                 ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code, customerId,
          req.body.area || null,
          req.body.address || null,
          req.body.vehicle_plate || null,
          req.body.subscription_account || null,
          serviceKind,
          req.body.note || null,
          creatorType,
          req.user.sub,
        ]
      ).then(([r]) => r)
    );
    const orderId = result.insertId;

    const isRenewal = serviceKind === 'renewal';
    for (const it of items) {
      const pid = Number(it.product_id);
      const qty = Math.max(1, Number(it.qty) || 1);
      // Don gia han: cho phep khach gui unit_price (gia tu FE tinh theo so nam),
      // admin se duyet/sua o buoc Bao gia. Don install: gia luon resolve tu BE.
      const price = isRenewal && it.unit_price !== undefined
        ? Math.max(0, Number(it.unit_price) || 0)
        : (priceMap.get(pid) || 0);

      const plate = isRenewal && it.vehicle_plate ? String(it.vehicle_plate).trim().slice(0, 200) : null;
      const imei  = isRenewal && it.imei          ? String(it.imei).trim().slice(0, 100) : null;
      const subAcc = isRenewal && it.subscription_account
        ? String(it.subscription_account).trim().slice(0, 64) : null;
      const phone = isRenewal && it.phone ? String(it.phone).trim().slice(0, 20) : null;
      let years = null;
      if (isRenewal && it.years !== undefined && it.years !== null && it.years !== '') {
        const y = parseInt(it.years);
        if (y >= 1 && y <= 10) years = y;
      }

      await conn.query(
        `INSERT INTO order_items
           (order_id, product_id, qty, unit_price, vehicle_plate, imei, subscription_account, years, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, pid, qty, price, plate, imei, subAcc, years, phone]
      );
    }

    // Khach dat don chi co tien thiet bi. Cong lap admin se "Lên đơn" sau —
    // luc do tien cong KTV se duoc dong bo thanh charge "Công lắp" trong bill.
    await recalcOrderTotal(conn, orderId);

    await conn.commit();

    const [rows] = await conn.query(`SELECT * FROM orders WHERE id = ?`, [orderId]);

    try {
      const [cu] = await db.query(
        `SELECT full_name, phone FROM customers WHERE id = ?`, [customerId]
      );
      const name = (cu[0] && (cu[0].full_name || cu[0].phone)) || `KH-${customerId}`;
      const kindLabel = ({
        install: 'Lắp đặt', maintenance: 'Sửa chữa',
        warranty: 'Bảo hành', renewal: 'Gia hạn',
      })[serviceKind] || serviceKind;
      await notify.create(db, {
        type: 'order_new',
        title: `Đơn mới ${rows[0].code}`,
        message: `${name} vừa tạo đơn ${kindLabel}`,
        link_url: `/admin/orders.html#order-${orderId}`,
        ref_order_id: orderId,
        ref_customer_id: customerId,
      });
    } catch (_) {}

    res.status(201).json(rows[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- GET /api/customer/orders/:id ------------------------------
// Khach le va dai ly xem don cua minh (customer_id = sub).
// Dai ly cung thay don cu da dat ho (dealer_id = sub) — back-compat.
router.get('/orders/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const isDealer = req.user.role === 'daily';
    const ownerClause = isDealer
      ? '(o.customer_id = ? OR o.dealer_id = ?)'
      : 'o.customer_id = ?';
    const args = isDealer ? [id, req.user.sub, req.user.sub] : [id, req.user.sub];

    const [rows] = await db.query(
      `SELECT o.*,
              c.code AS customer_code, c.full_name AS customer_name, c.phone AS customer_phone
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
        WHERE o.id = ? AND ${ownerClause} AND o.is_deleted = 0`,
      args
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay don' });

    const [items] = await db.query(
      `SELECT oi.*, p.code AS product_code, p.name AS product_name
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?`, [id]
    );
    const [charges] = await db.query(
      `SELECT id, kind, label, amount FROM order_charges
        WHERE order_id = ? AND is_deleted = 0 ORDER BY id ASC`, [id]
    );
    // Khach/dai ly KHONG can biet wage_amount KTV
    const [staffRow] = await db.query(
      `SELECT s.full_name AS staff_name, s.phone AS staff_phone, s.avatar_url AS staff_avatar
         FROM orders o LEFT JOIN staff s ON s.id = o.assigned_staff_id
        WHERE o.id = ?`, [id]
    );
    const staffInfo = staffRow.length ? staffRow[0] : { staff_name: null, staff_phone: null, staff_avatar: null };

    const [attachments] = await db.query(
      `SELECT id, url, caption, stage, uploaded_at
         FROM order_attachments
        WHERE order_id = ?
        ORDER BY id ASC`, [id]
    );

    // Neu la don phu hieu, kem theo du lieu badge + attachments
    let badge = null;
    if (rows[0].service_kind === 'badge') {
      const [bRows] = await db.query(
        `SELECT * FROM badges WHERE order_id = ? AND is_deleted = 0 LIMIT 1`, [id]
      );
      if (bRows.length) {
        const [bAtt] = await db.query(
          `SELECT id, url, caption, kind, uploaded_at
             FROM badge_attachments WHERE badge_id = ? ORDER BY id`, [bRows[0].id]
        );
        badge = { ...bRows[0], attachments: bAtt };
      }
    }

    res.json({ ...rows[0], items, charges, attachments, ...staffInfo, badge });
  } catch (err) { next(err); }
});

// ==========================================================
// /uploads/chat — upload anh / tai lieu trong chat (max 20MB)
// ==========================================================
router.post('/uploads/chat', (req, res, next) => {
  try {
    const url = saveDataUrl(req.body && req.body.dataUrl, 'chat', {
      maxBytes: 20 * 1024 * 1024,
    });
    res.json({ url, name: req.body && req.body.name ? String(req.body.name) : null });
  } catch (err) { next(err); }
});

// ==========================================================
// /conversations/me — find-or-create cuoc chat duy nhat cua khach
// ----------------------------------------------------------
// 1 customer = 1 conversation. Auto-assign KTV duoc gan don cua khach
// la viec admin lam khi assign task (xem admin/tasks.js -> conversation_members).
// ==========================================================
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

// Tin nhan tra ve kem order_code de FE render badge link sang chi tiet don.
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

// Endpoint rieng cho FE chat-with-admin.js gui anh chup man hinh khi admin/KTV
// bam nut 📷. Insert voi visibility='staff_only' — GET messages /customer
// loc bo, khach khong nhin thay tin nay. Emit toi room admin va tat ca staff
// dang la member cua conv (chua bi remove), KHONG emit toi conv-{id} de tab
// khac cua khach cung khong nhan duoc.
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
    await db.query(
      `UPDATE conversations SET last_message_at = NOW() WHERE id = ?`, [req.params.id]
    );
    const [rows] = await db.query(`SELECT * FROM messages WHERE id = ?`, [result.insertId]);

    if (global.io) {
      global.io.to('admin').emit('message:new', rows[0]);
      global.io.to('admin').emit('message:new-toast', {
        conversation_id: Number(req.params.id),
        content: rows[0].content,
        from: req.user.code || req.user.sub,
        screenshot: true,
      });
      // Emit toi tat ca KTV active member
      const [members] = await db.query(
        `SELECT staff_id FROM conversation_members
          WHERE conversation_id = ? AND removed_at IS NULL`,
        [req.params.id]
      );
      members.forEach(m => {
        global.io.to(`staff-${m.staff_id}`).emit('message:new', rows[0]);
      });
    }
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// POST tin nhan — body: { content, order_id? }
// order_id (optional): tag tin nhan ve don cu the. Verify don thuoc khach.
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
    await db.query(
      `UPDATE conversations SET last_message_at = NOW() WHERE id = ?`, [req.params.id]
    );
    const [rows] = await db.query(
      `SELECT m.*, o.code AS order_code
         FROM messages m LEFT JOIN orders o ON o.id = m.order_id
        WHERE m.id = ?`,
      [result.insertId]
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

// ==========================================================
// Khach danh gia KTV sau khi task hoan thanh.
// Cho ca khach le va dai ly — chi review duoc don customer_id = chinh minh
// (kiem tra trong query phia duoi, nen middleware customerOnly khong can nua).
// ==========================================================
router.post('/orders/:id/review', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const rating = Number(req.body.rating);
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'rating 1..5' });
    const comment = req.body.comment ? String(req.body.comment).trim() : null;

    await conn.beginTransaction();

    const [t] = await conn.query(
      `SELECT id, assigned_staff_id, status, customer_id
         FROM orders
        WHERE id = ? AND is_deleted = 0
        FOR UPDATE`, [req.params.id]
    );
    if (!t.length) { await conn.rollback(); return res.status(404).json({ error: 'Khong tim thay don' }); }
    if (t[0].customer_id !== req.user.sub) { await conn.rollback(); return res.status(403).json({ error: 'Khong phai don cua ban' }); }
    if (!t[0].assigned_staff_id) { await conn.rollback(); return res.status(400).json({ error: 'Don chua co KTV' }); }
    if (!['done','customer_owes','staff_owes','pending_admin_confirm'].includes(t[0].status)) {
      await conn.rollback();
      return res.status(400).json({ error: 'Don chua hoan thanh' });
    }

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
      `UPDATE staff SET rating = (
         SELECT AVG(rating) FROM staff_reviews WHERE staff_id = ?
       ) WHERE id = ?`,
      [t[0].assigned_staff_id, t[0].assigned_staff_id]
    );

    await conn.commit();
    res.status(201).json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ==========================================================
// /warranty-orders — don bao hanh cua khach
// Khach submit -> status='pending', cho admin "Tiep nhan" moi sang 'received'.
// Khach le va dai ly deu dung duoc — moi nguoi cho don bao hanh cua chinh minh.
// ==========================================================
router.get('/warranty-orders', async (req, res, next) => {
  try {
    const status = req.query.status;
    const where = ['w.customer_id = ?', 'w.is_deleted = 0'];
    const args = [req.user.sub];
    if (status) { where.push('w.status = ?'); args.push(status); }

    const [rows] = await db.query(
      `SELECT w.id, w.code,
              w.license_plate, w.device_name, w.imei_search,
              w.reason_text, w.note_text, w.address,
              w.recovered_image_url, w.delivered_image_url,
              w.warranty_partner, w.sent_at, w.returned_at,
              w.cost_amount, w.paid_amount,
              w.status, w.request_date,
              s.full_name AS staff_name
         FROM warranty_orders w
         LEFT JOIN staff s ON s.id = w.assigned_staff_id
        WHERE ${where.join(' AND ')}
        ORDER BY w.id DESC`,
      args
    );
    // Kem items (read-only voi khach)
    for (const w of rows) {
      w.items = await loadWarrantyItems(db, w.id);
    }
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// Body: { license_plate?, device_name?, imei_search?, reason, note?, address? }
router.post('/warranty-orders', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const reason = String(req.body.reason || '').trim();
    if (!reason) throw httpErr(400, 'Vui long mo ta ly do bao hanh');

    const licensePlate = req.body.license_plate ? String(req.body.license_plate).trim() : null;
    const deviceName   = req.body.device_name   ? String(req.body.device_name).trim()   : null;
    const imeiSearch   = req.body.imei_search   ? String(req.body.imei_search).trim()   : null;
    const note         = req.body.note          ? String(req.body.note).trim()          : null;
    const address      = req.body.address       ? String(req.body.address).trim()       : null;

    await conn.beginTransaction();

    const { result } = await insertWarrantyWithRetry(conn, (code) =>
      conn.query(
        `INSERT INTO warranty_orders
           (code, customer_id,
            license_plate, device_name, imei_search,
            reason_text, note_text, address,
            status, request_date, creator_type, creator_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURDATE(), 'customer', ?)`,
        [code, req.user.sub,
         licensePlate, deviceName, imeiSearch,
         reason, note, address,
         req.user.sub]
      ).then(([r]) => r)
    );
    const id = result.insertId;

    await conn.commit();

    const [rows] = await conn.query(`SELECT * FROM warranty_orders WHERE id = ?`, [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ==========================================================
// /repair-orders — don sua chua cua khach
// Khach gui yeu cau -> status='pending', cho admin gan KTV.
// Khach xem duoc: items + charges + service_fee + total_amount + status.
// Khach co the duyet/tu choi bao gia khi status='awaiting_customer'.
// ==========================================================
router.get('/repair-orders', async (req, res, next) => {
  try {
    const status = req.query.status;
    const where = ['r.customer_id = ?', 'r.is_deleted = 0'];
    const args = [req.user.sub];
    if (status) { where.push('r.status = ?'); args.push(status); }

    const [rows] = await db.query(
      `SELECT r.id, r.code,
              r.license_plate, r.device_name, r.imei_search,
              r.reason_text, r.note_text, r.address,
              r.diagnose_text,
              r.recovered_image_url, r.delivered_image_url,
              r.service_fee, r.parts_total, r.total_amount, r.paid_amount,
              r.quoted_at, r.customer_sent_at, r.customer_decided_at,
              r.status, r.request_date,
              s.full_name AS staff_name, s.phone AS staff_phone
         FROM repair_orders r
         LEFT JOIN staff s ON s.id = r.assigned_staff_id
        WHERE ${where.join(' AND ')}
        ORDER BY r.id DESC`,
      args
    );

    // Kem items + charges cho moi don (de khach xem chi tiet bao gia)
    for (const r of rows) {
      const [items] = await db.query(
        `SELECT ri.id, ri.product_id, ri.qty, ri.unit_price, ri.note,
                p.code AS product_code, p.name AS product_name
           FROM repair_items ri
           LEFT JOIN products p ON p.id = ri.product_id
          WHERE ri.repair_order_id = ? AND ri.is_deleted = 0
          ORDER BY ri.id ASC`,
        [r.id]
      );
      r.items = items;
      const [charges] = await db.query(
        `SELECT id, kind, label, amount FROM repair_charges
          WHERE repair_order_id = ? AND is_deleted = 0
          ORDER BY id ASC`,
        [r.id]
      );
      r.charges = charges;
    }

    res.json({ items: rows });
  } catch (err) { next(err); }
});

// Body: { license_plate?, device_name?, imei_search?, reason, note?, address? }
router.post('/repair-orders', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const reason = String(req.body.reason || '').trim();
    if (!reason) throw httpErr(400, 'Vui long mo ta van de can sua');

    const licensePlate = req.body.license_plate ? String(req.body.license_plate).trim() : null;
    const deviceName   = req.body.device_name   ? String(req.body.device_name).trim()   : null;
    const imeiSearch   = req.body.imei_search   ? String(req.body.imei_search).trim()   : null;
    const note         = req.body.note          ? String(req.body.note).trim()          : null;
    const address      = req.body.address       ? String(req.body.address).trim()       : null;

    await conn.beginTransaction();

    const { result } = await insertRepairWithRetry(conn, (code) =>
      conn.query(
        `INSERT INTO repair_orders
           (code, customer_id,
            license_plate, device_name, imei_search,
            reason_text, note_text, address,
            status, request_date, creator_type, creator_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURDATE(), 'customer', ?)`,
        [code, req.user.sub,
         licensePlate, deviceName, imeiSearch,
         reason, note, address,
         req.user.sub]
      ).then(([r]) => r)
    );
    const id = result.insertId;

    await conn.commit();

    const [rows] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// Khach duyet bao gia.
router.post('/repair-orders/:id/approve-quote', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status FROM repair_orders
        WHERE id = ? AND customer_id = ? AND is_deleted = 0 FOR UPDATE`,
      [id, req.user.sub]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don');
    if (rows[0].status !== 'awaiting_customer') {
      throw httpErr(409, 'Don khong dang cho duyet bao gia');
    }
    await conn.query(
      `UPDATE repair_orders
          SET status = 'approved', customer_decided_at = NOW()
        WHERE id = ?`,
      [id]
    );
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// Khach tu choi bao gia. Body: { reason? }
router.post('/repair-orders/:id/reject-quote', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const reason = req.body.reason ? String(req.body.reason).trim() : null;
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status, note_text FROM repair_orders
        WHERE id = ? AND customer_id = ? AND is_deleted = 0 FOR UPDATE`,
      [id, req.user.sub]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don');
    if (rows[0].status !== 'awaiting_customer') {
      throw httpErr(409, 'Don khong dang cho duyet bao gia');
    }
    const newNote = reason
      ? (rows[0].note_text ? `${rows[0].note_text}\n[KH-REJECT] ${reason}` : `[KH-REJECT] ${reason}`)
      : rows[0].note_text;
    await conn.query(
      `UPDATE repair_orders
          SET status = 'rejected', customer_decided_at = NOW(), note_text = ?
        WHERE id = ?`,
      [newNote, id]
    );
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});


// ==========================================================
// /badges — phu hieu xe khach yeu cau
// ==========================================================
async function genBadgeCode(conn, attempt = 0) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `PH-${dd}${mm}-`;
  const [rows] = await conn.query(
    `SELECT code FROM badges WHERE code LIKE ? ORDER BY code DESC LIMIT 1`,
    [`${prefix}%`]
  );
  let next = 1;
  if (rows.length) {
    const last = rows[0].code.slice(prefix.length);
    next = (parseInt(last) || 0) + 1;
  }
  return prefix + String(next + attempt).padStart(3, '0');
}

// /badges GET: phu hieu cua chinh minh (customer_id = sub).
// Dai ly cung thay phu hieu cu da dat ho khach (dealer_id = sub) — back-compat.
router.get('/badges', async (req, res, next) => {
  try {
    const isDealer = req.user.role === 'daily';
    const ownerClause = isDealer
      ? '(b.customer_id = ? OR b.dealer_id = ?)'
      : 'b.customer_id = ?';
    const args = isDealer ? [req.user.sub, req.user.sub] : [req.user.sub];
    const [rows] = await db.query(
      `SELECT b.id, b.code, b.vehicle_plate, b.vehicle_type, b.status,
              b.fee_amount, b.paid_amount,
              b.submitted_at, b.result_at, b.delivered_at, b.reject_reason, b.created_at,
              c.full_name AS customer_name, c.phone AS customer_phone
         FROM badges b
         LEFT JOIN customers c ON c.id = b.customer_id
        WHERE ${ownerClause} AND b.is_deleted = 0
        ORDER BY b.id DESC`, args
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// /badges POST: dang ky phu hieu cho chinh minh.
// Body: { vehicle_plate, vehicle_type?, note? }
router.post('/badges', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const plate = String(req.body.vehicle_plate || '').trim();
    if (!plate) throw httpErr(400, 'Thieu bien so xe');
    // vehicle_type da bo o FE — admin se nhap sau neu can. Default 'truck_under_3.5t'.
    const VEHICLE_TYPES = ['truck_under_3.5t','truck_over_3.5t','passenger','contract','taxi','other'];
    const vType = VEHICLE_TYPES.includes(req.body.vehicle_type)
      ? req.body.vehicle_type : 'truck_under_3.5t';

    const ATT_KINDS = ['vehicle_reg','cccd','license','other'];
    const rawAtts = Array.isArray(req.body.attachments) ? req.body.attachments : [];
    const atts = rawAtts
      .map(a => ({
        url: String((a && a.url) || '').trim(),
        caption: a && a.caption ? String(a.caption).slice(0, 255) : null,
        kind: a && ATT_KINDS.includes(a.kind) ? a.kind : 'other',
      }))
      .filter(a => a.url);

    await conn.beginTransaction();

    const customerId = req.user.sub;
    const creatorType = req.user.role === 'daily' ? 'dealer' : 'customer';

    // Tao order shell truoc (service_kind='badge', status='pending_review',
    // chua co fee — admin se cap nhat sau qua PUT /admin/badges/:id)
    const { result: orderRes } = await insertOrderWithRetry(conn, (code) =>
      conn.query(
        `INSERT INTO orders
          (code, customer_id, dealer_id, total_amount, subtotal, paid_amount, payment_method,
           status, service_kind, vehicle_plate, note,
           creator_type, creator_id)
         VALUES (?, ?, NULL, 0, 0, 0, 'cash',
                 'pending_review', 'badge', ?, ?, ?, ?)`,
        [code, customerId, plate, req.body.note || null, creatorType, req.user.sub]
      ).then(([r]) => r)
    );
    const orderId = orderRes.insertId;

    let badgeId;
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = await genBadgeCode(conn, attempt);
      try {
        const [r] = await conn.query(
          `INSERT INTO badges
            (code, customer_id, dealer_id, order_id, vehicle_plate, vehicle_type, status, note,
             creator_type, creator_id)
           VALUES (?, ?, NULL, ?, ?, ?, 'pending_review', ?, ?, ?)`,
          [code, customerId, orderId, plate, vType,
           req.body.note || null, creatorType, req.user.sub]
        );
        badgeId = r.insertId;
        break;
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') throw e;
      }
    }
    if (!badgeId) throw httpErr(500, 'Khong sinh duoc ma phu hieu');

    if (atts.length) {
      for (const a of atts) {
        await conn.query(
          `INSERT INTO badge_attachments (badge_id, url, caption, kind)
           VALUES (?, ?, ?, ?)`,
          [badgeId, a.url, a.caption, a.kind]
        );
      }
    }

    await conn.commit();
    const [rows] = await conn.query(`SELECT * FROM badges WHERE id = ?`, [badgeId]);

    try {
      const [cu] = await db.query(
        `SELECT full_name, phone FROM customers WHERE id = ?`, [customerId]
      );
      const name = (cu[0] && (cu[0].full_name || cu[0].phone)) || `KH-${customerId}`;
      await notify.create(db, {
        type: 'badge_new',
        title: `Phù hiệu mới: ${plate}`,
        message: `${name} đăng ký phù hiệu xe`,
        link_url: `/admin/orders.html#order-${orderId}`,
        ref_order_id: orderId,
        ref_customer_id: customerId,
      });
    } catch (_) {}

    res.status(201).json(rows[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

module.exports = router;
