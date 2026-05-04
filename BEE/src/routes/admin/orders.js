// /api/admin/orders — CRUD don hang + flow duyet/gan KTV/xuat kho/thanh toan
// Tat ca route deu yeu cau role admin (da check o admin.js cha)
//
// Endpoints:
//   GET    /                       -> list (filter status, customer_id, area, q, date range)
//   GET    /:id                    -> detail (kem items + charges + tasks + attachments)
//   POST   /                       -> tao (auto sinh code, kem items + charges)
//   PUT    /:id                    -> sua metadata (status qua endpoint rieng)
//   DELETE /:id                    -> soft delete (cascade tasks)
//   PUT    /:id/items              -> replace toan bo items (chan khi da xuat kho)
//   PATCH  /:id/charges            -> replace toan bo charges (chan khi da done/cancelled)
//   POST   /:id/confirm            -> pending_review -> new (kem chinh items + charges)
//   POST   /:id/assign-staff       -> new -> assigned (tao task + gan KTV)
//   POST   /:id/release-stock      -> assigned -> warehouse_released (-product_stock + auto +staff_holdings)
//   POST   /:id/mark-paid          -> admin xac nhan da nhan tien
//   POST   /:id/cancel             -> any -> cancelled (revert stock neu da reserved)
//   GET    /:id/suggested-staff    -> goi y KTV theo area

const crypto = require('crypto');
const express = require('express');
const db = require('../../db');
const { canTransition, recalcOrderTotal, recalcOrderFinalStatus, syncLaborCharge, insertOrderWithRetry, FINAL_STATUSES } = require('../../utils/orderState');
const { KINDS, seedChecklistForOrder } = require('../../utils/orderChecklist');

const router = express.Router();

const STATUSES = ['pending_review', 'new', 'assigned', 'warehouse_released', 'in_progress', 'done', 'cancelled', 'customer_owes', 'pending_admin_confirm', 'staff_owes', 'quoted', 'awaiting_payment', 'payment_reported'];
const PAYMENT_METHODS = ['cash', 'transfer', 'debt'];
const CHARGE_KINDS = ['shipping', 'discount', 'fee'];

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// Sinh code phieu PX/PN-YYMMDD-NNN dung MAX seq de tranh trung khi co phieu bi xoa.
async function genReceiptCode(conn, kind) {
  const prefix = kind === 'in' ? 'PN' : 'PX';
  const now = new Date();
  const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
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

// Replace toan bo charges cua 1 don (caller chiu trach nhiem transaction)
async function replaceCharges(conn, orderId, charges) {
  await conn.query(`DELETE FROM order_charges WHERE order_id = ?`, [orderId]);
  if (!Array.isArray(charges) || !charges.length) return;
  for (const c of charges) {
    const kind = CHARGE_KINDS.includes(c.kind) ? c.kind : 'fee';
    const label = String(c.label || '').trim();
    const amount = Number(c.amount) || 0;
    if (!label) continue;
    await conn.query(
      `INSERT INTO order_charges (order_id, kind, label, amount) VALUES (?, ?, ?, ?)`,
      [orderId, kind, label, amount]
    );
  }
}

// Replace toan bo items cua 1 don (caller chiu trach nhiem transaction).
// Cac field vehicle_plate/imei/subscription_account/years/phone danh cho don gia han —
// item don thuong gui null/undefined la duoc.
async function replaceItems(conn, orderId, items) {
  await conn.query(`DELETE FROM order_items WHERE order_id = ?`, [orderId]);
  for (const it of items) {
    const pid = Number(it.product_id);
    if (!pid) continue;
    const qty = Math.max(1, Number(it.qty) || 1);
    const price = Number(it.unit_price) || 0;
    const plate = it.vehicle_plate ? String(it.vehicle_plate).trim().slice(0, 200) : null;
    const imei  = it.imei          ? String(it.imei).trim().slice(0, 100) : null;
    const subAcc = it.subscription_account ? String(it.subscription_account).trim().slice(0, 64) : null;
    const phone = it.phone ? String(it.phone).trim().slice(0, 20) : null;
    let years = null;
    if (it.years !== undefined && it.years !== null && it.years !== '') {
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
}

// Tim san pham mac dinh cho don gia han (code='RENEW' do migration 031 seed).
// Cache 1 lan trong runtime de tranh query lap. Throw 500 neu chua chay migration.
let _renewProductId = null;
async function getRenewProductId(conn) {
  if (_renewProductId) return _renewProductId;
  const [rows] = await conn.query(
    `SELECT id FROM products WHERE code = 'RENEW' AND is_deleted = 0 LIMIT 1`
  );
  if (!rows.length) throw httpErr(500, 'Chua co san pham mac dinh "RENEW" — chay migration 031');
  _renewProductId = rows[0].id;
  return _renewProductId;
}

// ---- GET /api/admin/orders ------------------------------------
// Query: ?status, ?service_kind, ?customer_id, ?area, ?q, ?date_from, ?date_to, ?page, ?limit
router.get('/', async (req, res, next) => {
  try {
    const status      = req.query.status;
    const serviceKind = req.query.service_kind;
    const customerId  = req.query.customer_id ? Number(req.query.customer_id) : null;
    const area        = (req.query.area || '').trim();
    const q           = (req.query.q || '').trim();
    const dateFrom    = (req.query.date_from || '').trim();
    const dateTo      = (req.query.date_to   || '').trim();
    const page        = Math.max(1, parseInt(req.query.page) || 1);
    const limit       = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset      = (page - 1) * limit;

    const SERVICE_KINDS = ['install', 'maintenance', 'warranty', 'renewal', 'badge'];
    const where = ['o.is_deleted = 0'];
    const args = [];
    if (status && STATUSES.includes(status))     { where.push('o.status = ?'); args.push(status); }
    if (serviceKind && SERVICE_KINDS.includes(serviceKind)) { where.push('o.service_kind = ?'); args.push(serviceKind); }
    if (customerId)                              { where.push('o.customer_id = ?'); args.push(customerId); }
    if (area)                                    { where.push('o.area LIKE ?'); args.push(`%${area}%`); }
    if (req.query.has_return === '1')            { where.push('o.has_return = 1'); }
    if (req.query.unassigned === '1')            { where.push('o.assigned_staff_id IS NULL'); }
    if (req.query.staff_id)                      { where.push('o.assigned_staff_id = ?'); args.push(Number(req.query.staff_id)); }
    // Date range theo created_at (ngay tao don)
    if (dateFrom) { where.push('o.created_at >= ?'); args.push(dateFrom + ' 00:00:00'); }
    if (dateTo)   { where.push('o.created_at <= ?'); args.push(dateTo   + ' 23:59:59'); }
    if (q) {
      where.push('(o.code LIKE ? OR o.vehicle_plate LIKE ? OR o.address LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like, like, like, like);
    }

    const whereSql = 'WHERE ' + where.join(' AND ');

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         ${whereSql}`,
      args
    );

    const [rows] = await db.query(
      `SELECT
         o.id, o.code, o.customer_id, o.dealer_id,
         o.subtotal, o.total_amount, o.paid_amount,
         o.payment_method, o.status, o.has_return, o.service_kind,
         o.area, o.address, o.vehicle_plate, o.note,
         o.assigned_staff_id, o.kind, o.due_at, o.started_at, o.completed_at, o.wage_amount,
         o.creator_type, o.creator_id, o.confirmed_at, o.confirmed_by, o.created_at,
         c.code AS customer_code, c.full_name AS customer_name, c.phone AS customer_phone,
         c.type AS customer_type,
         d.code AS dealer_code, d.full_name AS dealer_name,
         s.full_name AS staff_name, s.area AS staff_area,
         b.id AS badge_id, b.code AS badge_code, b.status AS badge_status, b.vehicle_type AS badge_vehicle_type,
         (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       LEFT JOIN customers d ON d.id = o.dealer_id
       LEFT JOIN staff     s ON s.id = o.assigned_staff_id
       LEFT JOIN badges    b ON b.order_id = o.id AND b.is_deleted = 0
       ${whereSql}
       ORDER BY o.id DESC
       LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    res.json({ items: rows, total: countRows[0].total, page, limit });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/orders/:id --------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query(
      `SELECT o.*,
              c.code AS customer_code, c.full_name AS customer_name, c.phone AS customer_phone,
              d.code AS dealer_code, d.full_name AS dealer_name,
              s.full_name AS staff_name, s.area AS staff_area, s.phone AS staff_phone
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         LEFT JOIN customers d ON d.id = o.dealer_id
         LEFT JOIN staff     s ON s.id = o.assigned_staff_id
        WHERE o.id = ? AND o.is_deleted = 0`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay don' });

    // Auto mark seen
    if (rows[0].seen_at == null) {
      db.query(`UPDATE orders SET seen_at = NOW() WHERE id = ? AND seen_at IS NULL`,
        [id]).catch(() => {});
    }

    const [items] = await db.query(
      `SELECT oi.*, p.code AS product_code, p.name AS product_name
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?`,
      [id]
    );

    const [charges] = await db.query(
      `SELECT id, kind, label, amount
         FROM order_charges
        WHERE order_id = ? AND is_deleted = 0
        ORDER BY id ASC`,
      [id]
    );

    const [attachments] = await db.query(
      `SELECT id, url, caption, stage, uploaded_at
         FROM order_attachments
        WHERE order_id = ?
        ORDER BY id ASC`,
      [id]
    );

    const [checklist] = await db.query(
      `SELECT id, step, is_done, done_at, sort_order
         FROM order_checklist
        WHERE order_id = ?
        ORDER BY sort_order, id`,
      [id]
    );

    // Lay cac phieu kho lien quan don nay (release / cancel-return / install)
    const [releaseReceipts] = await db.query(
      `SELECT r.id, r.code, r.kind, r.reason_code, r.reason_text,
              r.ref_staff_id, r.created_at, r.is_voided,
              s.full_name AS ref_staff_name
         FROM stock_receipts r
         LEFT JOIN staff s ON s.id = r.ref_staff_id
        WHERE r.ref_order_id = ?
        ORDER BY r.id ASC`,
      [id]
    );
    if (releaseReceipts.length) {
      const ph = releaseReceipts.map(() => '?').join(',');
      const [lines] = await db.query(
        `SELECT ri.receipt_id, ri.product_id, ri.qty, ri.imei_list, ri.note,
                p.code AS product_code, p.name AS product_name
           FROM stock_receipt_items ri
           JOIN products p ON p.id = ri.product_id
          WHERE ri.receipt_id IN (${ph})
          ORDER BY ri.id`,
        releaseReceipts.map(r => r.id)
      );
      const byReceipt = new Map();
      for (const l of lines) {
        if (!byReceipt.has(l.receipt_id)) byReceipt.set(l.receipt_id, []);
        byReceipt.get(l.receipt_id).push(l);
      }
      for (const r of releaseReceipts) r.items = byReceipt.get(r.id) || [];
    }

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

    // Tong refund da ghi nhan cho don
    const [refRow] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM order_payments
        WHERE order_id = ? AND source = 'refund' AND is_deleted = 0`, [id]
    );
    const refunded_amount = Number(refRow[0].total) || 0;

    res.json({
      ...rows[0],
      refunded_amount,
      items, charges, attachments, checklist,
      release_receipts: releaseReceipts, badge,
    });
  } catch (err) { next(err); }
});

// ---- POST /api/admin/orders -----------------------------------
// Body: { customer_id, dealer_id?, payment_method, area?, address?, vehicle_plate?, note?,
//         status?, items: [{ product_id, qty, unit_price }], charges?: [{kind, label, amount}] }
router.post('/', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const customerId = Number(req.body.customer_id);
    if (!customerId) throw httpErr(400, 'Thieu customer_id');
    const [c] = await conn.query(
      `SELECT id, type FROM customers WHERE id = ? AND is_deleted = 0`, [customerId]
    );
    if (!c.length) throw httpErr(404, 'Khach hang khong ton tai');

    const dealerId = req.body.dealer_id ? Number(req.body.dealer_id) : null;
    const paymentMethod = req.body.payment_method || 'cash';
    if (!PAYMENT_METHODS.includes(paymentMethod)) throw httpErr(400, 'payment_method khong hop le');

    // Admin co the chu dong tao don pending_review (vi du khach goi dien nho)
    let status = req.body.status || 'new';
    if (!['pending_review', 'new'].includes(status)) {
      throw httpErr(400, 'Chi cho phep tao don voi status pending_review hoac new');
    }

    const SERVICE_KINDS = ['install', 'maintenance', 'warranty', 'renewal'];
    const serviceKind = req.body.service_kind || 'install';
    if (!SERVICE_KINDS.includes(serviceKind)) throw httpErr(400, 'service_kind khong hop le');

    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (serviceKind === 'install' && !items.length) {
      throw httpErr(400, 'Don phai co it nhat 1 san pham');
    }
    for (const it of items) {
      if (!Number(it.product_id)) throw httpErr(400, 'Item thieu product_id');
    }

    // paid_amount khi tao: chap nhan >= 0; se clamp <= total_amount sau khi recalc.
    const initialPaid = Math.max(0, Number(req.body.paid_amount) || 0);
    const adminId = req.user && req.user.sub ? req.user.sub : null;

    await conn.beginTransaction();

    const { result } = await insertOrderWithRetry(conn, (code) =>
      conn.query(
        `INSERT INTO orders
          (code, customer_id, dealer_id, total_amount, subtotal, paid_amount, payment_method,
           status, area, address, vehicle_plate, service_kind, note,
           creator_type, creator_id, confirmed_at, confirmed_by)
         VALUES (?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', ?, ?, ?)`,
        [
          code, customerId, dealerId,
          initialPaid, paymentMethod, status,
          req.body.area || null, req.body.address || null,
          req.body.vehicle_plate || null, serviceKind, req.body.note || null,
          adminId,
          status === 'new' ? new Date() : null,
          status === 'new' ? adminId : null,
        ]
      ).then(([r]) => r)
    );
    const orderId = result.insertId;

    await replaceItems(conn, orderId, items);
    if (Array.isArray(req.body.charges) && req.body.charges.length) {
      await replaceCharges(conn, orderId, req.body.charges);
    }
    const { total } = await recalcOrderTotal(conn, orderId);

    // status='new' phai co tong > 0; status='pending_review' thi cho phep 0.
    if (status === 'new' && total <= 0) {
      throw httpErr(400, 'Tong don phai > 0 khi tao truc tiep voi status=new');
    }
    // Clamp paid_amount <= total_amount sau khi recalc
    if (initialPaid > total) {
      await conn.query(
        `UPDATE orders SET paid_amount = ? WHERE id = ?`, [total, orderId]
      );
    }

    await conn.commit();

    const [rows] = await conn.query(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- PUT /api/admin/orders/:id (chi metadata, KHONG status) ---
router.put('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const [exist] = await db.query(
      `SELECT id, status FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!exist.length) return res.status(404).json({ error: 'Khong tim thay don' });

    const updates = {};
    if (req.body.payment_method !== undefined) {
      if (!PAYMENT_METHODS.includes(req.body.payment_method)) throw httpErr(400, 'payment_method khong hop le');
      updates.payment_method = req.body.payment_method;
    }
    if (req.body.area !== undefined)          updates.area = req.body.area || null;
    if (req.body.address !== undefined)       updates.address = req.body.address || null;
    if (req.body.vehicle_plate !== undefined) updates.vehicle_plate = req.body.vehicle_plate || null;
    if (req.body.note !== undefined)          updates.note = req.body.note || null;

    const cols = Object.keys(updates);
    if (!cols.length) return res.status(400).json({ error: 'Khong co truong de cap nhat' });

    const setSql = cols.map(c => `${c} = ?`).join(', ');
    const values = cols.map(c => updates[c]);
    await db.query(`UPDATE orders SET ${setSql} WHERE id = ?`, [...values, id]);

    const [rows] = await db.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ---- PUT /api/admin/orders/:id/items (replace items) ----------
// Chan khi don da xuat kho/dang lap/done
router.put('/:id/items', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const [exist] = await conn.query(
      `SELECT id, status FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!exist.length) throw httpErr(404, 'Khong tim thay don');
    if (['warehouse_released', 'in_progress', 'done', 'cancelled',
         'customer_owes', 'pending_admin_confirm', 'staff_owes',
         'awaiting_payment', 'payment_reported'].includes(exist[0].status)) {
      throw httpErr(409, 'Khong the sua items khi don da xuat kho/khach da chap nhan/hoan thanh/huy');
    }

    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) throw httpErr(400, 'Don phai co it nhat 1 san pham');

    await conn.beginTransaction();
    await replaceItems(conn, id, items);
    await recalcOrderTotal(conn, id);
    await conn.commit();

    const [rows] = await conn.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- PATCH /api/admin/orders/:id/charges (replace charges) ----
// Body: { charges: [{kind, label, amount}, ...] }
router.patch('/:id/charges', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const [exist] = await conn.query(
      `SELECT id, status FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!exist.length) throw httpErr(404, 'Khong tim thay don');
    if (['done', 'cancelled', 'customer_owes', 'pending_admin_confirm', 'staff_owes',
         'awaiting_payment', 'payment_reported'].includes(exist[0].status)) {
      throw httpErr(409, 'Khong the sua phi khi khach da chap nhan/hoan thanh/huy');
    }

    await conn.beginTransaction();
    await replaceCharges(conn, id, req.body.charges || []);
    await recalcOrderTotal(conn, id);
    await conn.commit();

    const [order] = await conn.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    const [charges] = await conn.query(
      `SELECT id, kind, label, amount FROM order_charges
        WHERE order_id = ? AND is_deleted = 0 ORDER BY id ASC`, [id]
    );
    res.json({ ...order[0], charges });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- POST /api/admin/orders/:id/confirm -----------------------
// Chuyen pending_review -> new. Co the kem chinh items + charges trong cung 1 call.
// Body: { items?, charges? }
router.post('/:id/confirm', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const [exist] = await conn.query(
      `SELECT id, status FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!exist.length) throw httpErr(404, 'Khong tim thay don');
    if (!canTransition(exist[0].status, 'new')) {
      throw httpErr(409, `Khong the chuyen ${exist[0].status} -> new`);
    }

    await conn.beginTransaction();

    if (Array.isArray(req.body.items) && req.body.items.length) {
      await replaceItems(conn, id, req.body.items);
    }
    if (Array.isArray(req.body.charges)) {
      await replaceCharges(conn, id, req.body.charges);
    }
    const { total: confirmTotal } = await recalcOrderTotal(conn, id);

    // Validate: tong don sau discount phai > 0 (chan discount > subtotal)
    if (confirmTotal <= 0) {
      throw httpErr(400, 'Tong don sau giam gia phai > 0 truoc khi duyet');
    }

    await conn.query(
      `UPDATE orders SET status = 'new', confirmed_at = NOW(), confirmed_by = ?
        WHERE id = ?`,
      [req.user && req.user.sub ? req.user.sub : null, id]
    );

    await conn.commit();

    const [rows] = await conn.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- POST /api/admin/orders/:id/assign-staff ------------------
// Body: { staff_id, kind?, due_at?, wage_amount?, note?, checklist? }
// Gan KTV vao don + chuyen sang 'assigned' + seed checklist + auto-add vao chat.
router.post('/:id/assign-staff', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const staffId = Number(req.body.staff_id);
    if (!staffId) throw httpErr(400, 'Thieu staff_id');

    const kind = req.body.kind || 'install';
    if (!KINDS.includes(kind)) throw httpErr(400, 'kind khong hop le');

    const [orderRows] = await conn.query(
      `SELECT id, status, service_kind, customer_id FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!orderRows.length) throw httpErr(404, 'Khong tim thay don');
    if (!canTransition(orderRows[0].status, 'assigned')) {
      throw httpErr(409, `Khong the chuyen ${orderRows[0].status} -> assigned`);
    }

    const [s] = await conn.query(
      `SELECT id, role FROM staff WHERE id = ? AND is_deleted = 0`, [staffId]
    );
    if (!s.length || s[0].role !== 'kithuat') {
      throw httpErr(400, 'Nhan vien khong phai KTV hop le');
    }

    await conn.beginTransaction();

    const wage = Number(req.body.wage_amount) || 0;
    await conn.query(
      `UPDATE orders
          SET assigned_staff_id = ?, kind = ?, due_at = ?, wage_amount = ?,
              ktv_note = ?, status = 'assigned'
        WHERE id = ?`,
      [staffId, kind, req.body.due_at || null, wage, req.body.note || null, id]
    );

    await seedChecklistForOrder(conn, id, kind, req.body.checklist);

    // Tien cong KTV -> charge "Cong lap" trong bill -> recalc total
    await syncLaborCharge(conn, id, wage);
    await recalcOrderTotal(conn, id);

    // Auto: them KTV vao conversation cua khach (find-or-create).
    // Mo rong cuoc chat hien co thay vi tao chat rieng cho tung don.
    const customerId = orderRows[0].customer_id;
    let [cv] = await conn.query(
      `SELECT id FROM conversations WHERE customer_id = ? AND is_deleted = 0 LIMIT 1`,
      [customerId]
    );
    let convId;
    if (cv.length) {
      convId = cv[0].id;
    } else {
      const [r] = await conn.query(
        `INSERT INTO conversations (customer_id) VALUES (?)`, [customerId]
      );
      convId = r.insertId;
    }
    await conn.query(
      `INSERT INTO conversation_members (conversation_id, staff_id, added_by)
       VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           removed_at = NULL,
           added_by   = VALUES(added_by),
           joined_at  = CURRENT_TIMESTAMP`,
      [convId, staffId, req.user && req.user.sub ? req.user.sub : null]
    );

    await conn.commit();

    const [orderRowsAfter] = await conn.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    res.status(201).json({ order: orderRowsAfter[0] });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    if (!err.status) err.status = 400;
    next(err);
  } finally {
    conn.release();
  }
});

// ---- PATCH /api/admin/orders/:id/reassign-staff ---------------
// Doi KTV / tien cong / kind / hen / ghi chu cua don.
// Cho phep doi moi luc TRU khi don da o final-status hoac cancelled.
// Body: { staff_id, wage_amount?, kind?, due_at?, note? }
router.patch('/:id/reassign-staff', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const staffId = Number(req.body.staff_id);
    if (!staffId) throw httpErr(400, 'Thieu staff_id');

    const [orderRows] = await conn.query(
      `SELECT id, status, customer_id, assigned_staff_id FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!orderRows.length) throw httpErr(404, 'Khong tim thay don');
    if (FINAL_STATUSES.includes(orderRows[0].status) || orderRows[0].status === 'cancelled') {
      throw httpErr(409, 'Don da hoan thanh hoac huy — khong the doi KTV');
    }

    const [s] = await conn.query(
      `SELECT id, role FROM staff WHERE id = ? AND is_deleted = 0`, [staffId]
    );
    if (!s.length || s[0].role !== 'kithuat') {
      throw httpErr(400, 'Nhan vien khong phai KTV hop le');
    }

    const fields = ['assigned_staff_id = ?'];
    const args = [staffId];
    if (req.body.wage_amount != null) { fields.push('wage_amount = ?'); args.push(Number(req.body.wage_amount) || 0); }
    if (req.body.kind)                {
      if (!KINDS.includes(req.body.kind)) throw httpErr(400, 'kind khong hop le');
      fields.push('kind = ?');         args.push(req.body.kind);
    }
    if (req.body.due_at !== undefined){ fields.push('due_at = ?');       args.push(req.body.due_at || null); }
    if (req.body.note !== undefined)  { fields.push('ktv_note = ?');     args.push(req.body.note || null); }
    args.push(id);

    await conn.beginTransaction();
    await conn.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, args);

    // Tien cong moi -> sync charge "Cong lap" + recalc total cua don
    if (req.body.wage_amount != null) {
      await syncLaborCharge(conn, id, req.body.wage_amount);
      await recalcOrderTotal(conn, id);
    }

    // Doi KTV: them KTV moi vao conversation (KTV cu giu trong chat de xem lich su).
    const customerId = orderRows[0].customer_id;
    let [cv] = await conn.query(
      `SELECT id FROM conversations WHERE customer_id = ? AND is_deleted = 0 LIMIT 1`,
      [customerId]
    );
    if (cv.length) {
      await conn.query(
        `INSERT INTO conversation_members (conversation_id, staff_id, added_by)
         VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE
             removed_at = NULL,
             added_by   = VALUES(added_by),
             joined_at  = CURRENT_TIMESTAMP`,
        [cv[0].id, staffId, req.user && req.user.sub ? req.user.sub : null]
      );
    }

    await conn.commit();

    const [updated] = await conn.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    res.json({ order: updated[0] });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    if (!err.status) err.status = 400;
    next(err);
  } finally {
    conn.release();
  }
});

// ---- POST /api/admin/orders/:id/release-stock -----------------
// Body: { items: [{product_id, qty, imei_list?}] }
// Tru product_stock + day THANG vao staff_holdings (gop luon buoc KTV "Nhan thiet bi")
//   + sinh phieu xuat reason='order_release' + chuyen order sang 'warehouse_released'.
// (Truoc day phai qua release_pool roi KTV bam nhan rieng — nay gop 1 buoc cho gon.)
router.post('/:id/release-stock', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;

    // items co the rong: don khong co vat tu (vd: gia han thuan dich vu) van
    // phai bam xuat kho de tao phieu rong, ghi lai QTV da xu ly don nay khi nao.
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    // Chuan hoa items
    const lines = [];
    const seenProducts = new Set();
    for (const raw of items) {
      const productId = Number(raw.product_id);
      const qty = Number(raw.qty);
      if (!productId) throw httpErr(400, 'Item thieu product_id');
      if (!qty || qty <= 0) throw httpErr(400, 'qty phai > 0');
      if (seenProducts.has(productId)) throw httpErr(400, 'Moi san pham chi 1 dong');
      seenProducts.add(productId);
      lines.push({
        product_id: productId,
        qty,
        imei_list: raw.imei_list ? String(raw.imei_list).trim() : null,
      });
    }

    const [orderRows] = await conn.query(
      `SELECT id, status, assigned_staff_id FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!orderRows.length) throw httpErr(404, 'Khong tim thay don');
    // Cho phep release o 'assigned' (lan dau) hoac 'warehouse_released' (release them).
    // Cam khi da 'in_progress' tro di — vat tu co the da len xe khach.
    if (!['assigned', 'warehouse_released'].includes(orderRows[0].status)) {
      throw httpErr(409, `Khong the xuat kho khi don dang ${orderRows[0].status}`);
    }

    const assignedStaff = orderRows[0].assigned_staff_id;
    if (!assignedStaff) throw httpErr(400, 'Don chua gan KTV');

    // Validate items: product_id phai thuoc order_items, qty <= qty trong don.
    // Tinh con bao nhieu chua release: order_items.qty - SUM(release ri.qty cho cung product, cung order)
    // Don khong co order_items van duoc release (phieu rong) -> chi validate khi co lines.
    const [orderItems] = await conn.query(
      `SELECT product_id, qty FROM order_items WHERE order_id = ?`, [id]
    );
    if (lines.length && !orderItems.length) {
      throw httpErr(400, 'Don khong co san pham nhung items != []');
    }
    const orderQtyByProd = new Map(orderItems.map(o => [o.product_id, Number(o.qty)]));

    const [alreadyReleased] = await conn.query(
      `SELECT ri.product_id, COALESCE(SUM(ri.qty), 0) AS qty
         FROM stock_receipt_items ri
         JOIN stock_receipts r ON r.id = ri.receipt_id
        WHERE r.ref_order_id = ? AND r.reason_code = 'order_release' AND r.is_voided = 0
        GROUP BY ri.product_id`,
      [id]
    );
    const releasedByProd = new Map(alreadyReleased.map(r => [r.product_id, Number(r.qty)]));

    for (const l of lines) {
      if (!orderQtyByProd.has(l.product_id)) {
        throw httpErr(400, `SP id=${l.product_id} khong co trong don`);
      }
      const allowed = orderQtyByProd.get(l.product_id) - (releasedByProd.get(l.product_id) || 0);
      if (l.qty > allowed) {
        throw httpErr(409, `SP id=${l.product_id} chi con ${allowed} chua release, yeu cau ${l.qty}`);
      }
    }

    await conn.beginTransaction();

    // Lock + verify ton kho (theo thu tu product_id de tranh deadlock)
    lines.sort((a, b) => a.product_id - b.product_id);
    for (const l of lines) {
      const [psRows] = await conn.query(
        `SELECT quantity FROM product_stock WHERE product_id = ? FOR UPDATE`,
        [l.product_id]
      );
      const cur = psRows.length ? psRows[0].quantity : 0;
      if (cur < l.qty) {
        throw httpErr(409, `Khong du ton: SP id=${l.product_id} con ${cur}, can ${l.qty}`);
      }
    }

    const code = await genReceiptCode(conn, 'out');
    const adminId = req.user && req.user.sub ? req.user.sub : null;

    const [rIns] = await conn.query(
      `INSERT INTO stock_receipts
         (code, kind, reason_code, reason_text, ref_order_id, ref_staff_id, created_by_staff_id)
       VALUES (?, 'out', 'order_release', ?, ?, ?, ?)`,
      [code, req.body.reason_text || null, id, assignedStaff, adminId]
    );
    const receiptId = rIns.insertId;

    for (const l of lines) {
      await conn.query(
        `INSERT INTO stock_receipt_items
           (receipt_id, product_id, qty, imei_list)
         VALUES (?, ?, ?, ?)`,
        [receiptId, l.product_id, l.qty, l.imei_list]
      );
      await conn.query(
        `UPDATE product_stock SET quantity = quantity - ? WHERE product_id = ?`,
        [l.qty, l.product_id]
      );
      // Day thang vao staff_holdings cua KTV duoc giao task (auto-take).
      await conn.query(
        `INSERT INTO staff_holdings (staff_id, product_id, qty, first_held_at)
         VALUES (?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)`,
        [assignedStaff, l.product_id, l.qty]
      );
    }

    // Chi update status khi dang 'assigned' — release them lan 2 (status da
    // = 'warehouse_released') giu nguyen.
    await conn.query(
      `UPDATE orders SET status = 'warehouse_released'
        WHERE id = ? AND status = 'assigned'`, [id]
    );

    await conn.commit();

    const [orderAfter] = await conn.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    res.json({
      order: orderAfter[0],
      receipt: { id: receiptId, code, kind: 'out', reason_code: 'order_release', items: lines },
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- POST /api/admin/orders/:id/mark-paid ---------------------
// Admin xac nhan da nhan tien tu khach (truc tiep tay/CK ngoai he thong KTV thu).
// Body: { amount? } — mac dinh = total - paid - admin_pending_chua_confirm (clamp).
// Dung khi khach tra thang admin va KHONG co admin_pending entry san. Neu co
// admin_pending thi admin phai dung POST /:id/confirm-admin-pending/:payment_id
// — mark-paid chu dong tru phan admin_pending khoi remaining de tranh double-count.
router.post('/:id/mark-paid', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    await conn.beginTransaction();

    const [orderRows] = await conn.query(
      `SELECT id, status, total_amount, paid_amount FROM orders
        WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!orderRows.length) throw httpErr(404, 'Khong tim thay don');
    const o = orderRows[0];
    if (!['warehouse_released', 'in_progress',
          'done', 'customer_owes', 'pending_admin_confirm', 'staff_owes'].includes(o.status)) {
      throw httpErr(409, 'Don chua san sang de xac nhan thanh toan');
    }

    // Tru phan admin_pending dang cho admin xac nhan: KHONG cho mark-paid de len phan nay,
    // tranh paid + admin_pending > total. Admin phai dung confirm-admin-pending.
    const [pendRow] = await conn.query(
      `SELECT COALESCE(SUM(amount), 0) AS pending FROM order_payments
        WHERE order_id = ? AND source = 'admin_pending'
              AND confirmed = 0 AND is_deleted = 0`,
      [id]
    );
    const adminPending = Number(pendRow[0].pending) || 0;
    const remaining = Math.max(0, Number(o.total_amount) - Number(o.paid_amount) - adminPending);
    if (remaining <= 0) {
      throw httpErr(400,
        adminPending > 0
          ? `Con ${adminPending}d cho admin xac nhan — dung "Xac nhan da nhan" thay vi mark-paid`
          : 'Don da thanh toan du');
    }
    let amount = req.body.amount !== undefined ? Number(req.body.amount) : remaining;
    if (!amount || amount <= 0) throw httpErr(400, 'amount phai > 0');
    if (amount > remaining) amount = remaining;

    await conn.query(
      `UPDATE orders SET paid_amount = paid_amount + ? WHERE id = ?`,
      [amount, id]
    );
    await conn.query(
      `INSERT INTO order_payments (order_id, amount, source, confirmed, confirmed_at, confirmed_by, staff_id, note)
       VALUES (?, ?, 'admin_mark_paid', 1, NOW(), ?, ?, ?)`,
      [id, amount, req.user && req.user.sub ? req.user.sub : null,
       req.user && req.user.sub ? req.user.sub : null, req.body.note || null]
    );

    await recalcOrderFinalStatus(conn, id);

    await conn.commit();
    const [rows] = await conn.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- POST /api/admin/orders/:id/confirm-admin-pending/:payment_id ------
// Admin xac nhan 1 khoan admin_pending (do KTV bao "khach da tra admin").
// Body: { amount? } — mac dinh = amount cua payment. Cho phep ghi nhan it hon
// (vd KTV bao 5tr nhung admin chi nhan duoc 4tr). Phan thieu se thanh khach no.
router.post('/:id/confirm-admin-pending/:payment_id', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const orderId   = Number(req.params.id);
    const paymentId = Number(req.params.payment_id);
    await conn.beginTransaction();

    const [payRows] = await conn.query(
      `SELECT * FROM order_payments
        WHERE id = ? AND order_id = ? AND source = 'admin_pending' AND is_deleted = 0
        FOR UPDATE`,
      [paymentId, orderId]
    );
    if (!payRows.length) throw httpErr(404, 'Khong tim thay khoan admin_pending');
    const pay = payRows[0];
    if (pay.confirmed) throw httpErr(400, 'Khoan nay da duoc xac nhan');

    const declared = Number(pay.amount);
    let actual = req.body.amount !== undefined ? Number(req.body.amount) : declared;
    if (!actual || actual < 0) throw httpErr(400, 'amount phai >= 0');
    if (actual > declared) {
      throw httpErr(400, `KTV chi bao ${declared}d, khong the xac nhan ${actual}d`);
    }

    // Lock order de cap nhat paid_amount + status. Chan khi don da cancel —
    // confirm tren don cancelled se day paid_amount len ma khong recalc duoc
    // (status 'cancelled' khong nam trong recalcOrderFinalStatus -> tien lo lung).
    const [oRows] = await conn.query(
      `SELECT status FROM orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`,
      [orderId]
    );
    if (!oRows.length) throw httpErr(404, 'Khong tim thay don');
    if (oRows[0].status === 'cancelled') {
      throw httpErr(409, 'Don da huy — khong the xac nhan thanh toan. Dung "Hoan tien" neu can.');
    }

    if (actual > 0) {
      // Cap nhat dung amount thuc te admin nhan duoc
      await conn.query(
        `UPDATE order_payments
            SET amount = ?, confirmed = 1, confirmed_at = NOW(), confirmed_by = ?,
                source = 'admin_mark_paid', paid_at = NOW(),
                note = CONCAT(COALESCE(note,''), ' | Admin xac nhan thuc te ', ?, 'd')
          WHERE id = ?`,
        [actual, req.user.sub, actual, paymentId]
      );
      await conn.query(
        `UPDATE orders SET paid_amount = paid_amount + ? WHERE id = ?`,
        [actual, orderId]
      );
    } else {
      // amount = 0: admin khong nhan duoc dong nao -> soft delete khoan pending,
      // phan thieu thanh khach no.
      await conn.query(
        `UPDATE order_payments
            SET is_deleted = 1, note = CONCAT(COALESCE(note,''), ' | Admin tu choi: khong nhan duoc tien')
          WHERE id = ?`,
        [paymentId]
      );
    }

    await recalcOrderFinalStatus(conn, orderId);

    await conn.commit();
    const [rows] = await conn.query(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    res.json(rows[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- GET /api/admin/orders/:id/admin-pending --------------------------
// List cac khoan admin_pending chua confirm cua 1 don (cho UI admin bam xac nhan)
router.get('/:id/admin-pending', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.amount, p.note, p.paid_at, p.staff_id,
              s.full_name AS staff_name
         FROM order_payments p
         LEFT JOIN staff s ON s.id = p.staff_id
        WHERE p.order_id = ? AND p.source = 'admin_pending'
              AND p.confirmed = 0 AND p.is_deleted = 0
        ORDER BY p.paid_at DESC`,
      [req.params.id]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/orders/:id/staff-collections ----------------------
// List collections KTV da thu cua don nay nhung CHUA nop ve cong ty (remitted=0).
// Dung de admin xac nhan da nhan tien truc tiep tu order detail (shortcut, khong
// can KTV tu tao lo nop).
router.get('/:id/staff-collections', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.amount, c.method, c.collected_at, c.staff_id,
              s.full_name AS staff_name
         FROM collections c
         LEFT JOIN staff s ON s.id = c.staff_id
        WHERE c.order_id = ?
              AND c.remitted = 0
              AND c.is_deleted = 0
        ORDER BY c.collected_at DESC`,
      [req.params.id]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ---- POST /api/admin/orders/:id/confirm-staff-collection/:collection_id ----
// Admin xac nhan da nhan tien KTV nop cho 1 collection (shortcut tu order detail).
// Tao remittance ngam status='approved' chua collection do, set collections.remitted=1,
// recalc trang thai don. Tuong duong viec KTV nop lo + admin approve goi 1 nut.
router.post('/:id/confirm-staff-collection/:collection_id', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const orderId      = Number(req.params.id);
    const collectionId = Number(req.params.collection_id);
    await conn.beginTransaction();

    const [colRows] = await conn.query(
      `SELECT id, order_id, staff_id, amount, method, remitted, is_deleted
         FROM collections
        WHERE id = ? FOR UPDATE`,
      [collectionId]
    );
    if (!colRows.length) throw httpErr(404, 'Khong tim thay khoan thu');
    const col = colRows[0];
    if (col.is_deleted)        throw httpErr(400, 'Khoan thu da xoa');
    if (col.order_id !== orderId) throw httpErr(400, 'Khoan thu khong thuoc don nay');
    if (col.remitted)          throw httpErr(400, 'Khoan thu da duoc xac nhan');

    // Tao remittance approved single-collection
    const [remIns] = await conn.query(
      `INSERT INTO remittances (staff_id, amount, method, note,
                                remitted_at, approved_by, approved_at, status)
       VALUES (?, ?, ?, ?, NOW(), ?, NOW(), 'approved')`,
      [col.staff_id, col.amount, col.method,
       `Admin xac nhan truc tiep tu don #${orderId}`, req.user.sub]
    );
    await conn.query(
      `UPDATE collections SET remitted = 1, remittance_id = ? WHERE id = ?`,
      [remIns.insertId, collectionId]
    );

    await recalcOrderFinalStatus(conn, orderId);
    await conn.commit();

    const [rows] = await conn.query(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    res.json(rows[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- POST /api/admin/orders/:id/cancel ------------------------
// Body: {
//   reason?,
//   return_lines?: [{ product_id, qty, condition?: 'good'|'damaged', note? }]
// }
// - Khong co return_lines  -> AUTO mode (legacy): hoan tat ca pool + KTV chua install
// - Co return_lines        -> USER mode: chi hoan dung qty/SP admin chon, tach phieu theo condition
// Revert stock da reserved + soft-cancel task + cancel order
router.post('/:id/cancel', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const reason = String(req.body.reason || req.body.reason_text || '').trim();
    const userLines = Array.isArray(req.body.return_lines) ? req.body.return_lines : null;
    const [orderRows] = await conn.query(
      `SELECT id, status, note FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!orderRows.length) throw httpErr(404, 'Khong tim thay don');
    if (!canTransition(orderRows[0].status, 'cancelled')) {
      throw httpErr(409, `Khong the huy don o trang thai ${orderRows[0].status}`);
    }

    await conn.beginTransaction();

    const adminId = req.user && req.user.sub ? req.user.sub : null;
    let revertedQty = 0;
    const warnings = [];

    {
      // Lock pool con lai (chua nhan), giu nguyen tung row de tru dan
      const [poolRows] = await conn.query(
        `SELECT id, order_id, staff_id, product_id, qty FROM release_pool
          WHERE order_id = ? FOR UPDATE`,
        [id]
      );

      // Da release tong (theo product, ref_order_id=id)
      const [releasedRows] = await conn.query(
        `SELECT ri.product_id, COALESCE(SUM(ri.qty),0) AS qty
           FROM stock_receipt_items ri
           JOIN stock_receipts r ON r.id = ri.receipt_id
          WHERE r.ref_order_id = ? AND r.reason_code = 'order_release' AND r.is_voided = 0
          GROUP BY ri.product_id`,
        [id]
      );

      // Da install (theo product)
      const [installedRows] = await conn.query(
        `SELECT ri.product_id, COALESCE(SUM(ri.qty),0) AS qty
           FROM stock_receipt_items ri
           JOIN stock_receipts r ON r.id = ri.receipt_id
          WHERE r.ref_order_id = ? AND r.reason_code = 'install_done' AND r.is_voided = 0
          GROUP BY ri.product_id`,
        [id]
      );

      // Da hoan tu lan cancel truoc (truong hop hi huu cancel 2 lan)
      const [returnedRows] = await conn.query(
        `SELECT ri.product_id, COALESCE(SUM(ri.qty),0) AS qty
           FROM stock_receipt_items ri
           JOIN stock_receipts r ON r.id = ri.receipt_id
          WHERE r.ref_order_id = ? AND r.reason_code = 'order_cancel_return' AND r.is_voided = 0
          GROUP BY ri.product_id`,
        [id]
      );

      const releasedByProd = new Map(releasedRows.map(r => [r.product_id, Number(r.qty)]));
      const installedByProd = new Map(installedRows.map(r => [r.product_id, Number(r.qty)]));
      const returnedByProd = new Map(returnedRows.map(r => [r.product_id, Number(r.qty)]));

      // Build pool entries map (in-memory, se update DB tuong ung khi tru)
      const poolByProdList = new Map();
      for (const p of poolRows) {
        if (!poolByProdList.has(p.product_id)) poolByProdList.set(p.product_id, []);
        poolByProdList.get(p.product_id).push({ id: p.id, staff_id: p.staff_id, qty: Number(p.qty) });
      }

      // Plan revert: tach theo condition de tao toi da 2 phieu
      const revertPlan = { good: [], damaged: [] };

      if (userLines) {
        // === USER MODE ===
        // Tong qty user chon / SP de validate khong vuot maxReturnable
        const userTotalByProd = new Map();
        for (const raw of userLines) {
          const pid = Number(raw.product_id);
          const q = Math.max(0, Number(raw.qty) || 0);
          if (!pid || !q) continue;
          userTotalByProd.set(pid, (userTotalByProd.get(pid) || 0) + q);
        }
        for (const [pid, qSum] of userTotalByProd) {
          const totalReleased = releasedByProd.get(pid) || 0;
          const installed = installedByProd.get(pid) || 0;
          const alreadyReturned = returnedByProd.get(pid) || 0;
          const maxReturnable = Math.max(0, totalReleased - installed - alreadyReturned);
          if (qSum > maxReturnable) {
            throw httpErr(400, `SP id=${pid}: chi hoan duoc toi da ${maxReturnable}, yeu cau ${qSum}`);
          }
        }
        for (const raw of userLines) {
          const pid = Number(raw.product_id);
          const q = Math.max(0, Number(raw.qty) || 0);
          if (!pid || !q) continue;
          const condition = raw.condition === 'damaged' ? 'damaged' : 'good';
          const note = raw.note ? String(raw.note).trim().slice(0, 500) : null;
          revertPlan[condition].push({ product_id: pid, qty: q, note });
        }
        // Canh bao neu sau khi hoan van con qty dang o pool/KTV (chua tra het)
        for (const [productId, totalReleased] of releasedByProd) {
          const installed = installedByProd.get(productId) || 0;
          const alreadyReturned = returnedByProd.get(productId) || 0;
          const userReturnedSum = userTotalByProd.get(productId) || 0;
          const remaining = totalReleased - installed - alreadyReturned - userReturnedSum;
          if (remaining > 0) {
            warnings.push(`SP id=${productId}: con ${remaining} chua hoan — admin can xu ly bang technician_return`);
          }
        }
      } else {
        // === AUTO MODE (legacy): hoan tat ca pool + KTV da nhan nhung chua install ===
        for (const [productId, totalReleased] of releasedByProd) {
          const poolEntries = poolByProdList.get(productId) || [];
          const poolQty = poolEntries.reduce((s, e) => s + e.qty, 0);
          const installed = installedByProd.get(productId) || 0;
          const alreadyReturned = returnedByProd.get(productId) || 0;
          const takenNotInstalled = Math.max(0, totalReleased - poolQty - installed - alreadyReturned);
          const revertQty = poolQty + takenNotInstalled;
          if (revertQty > 0) {
            revertPlan.good.push({ product_id: productId, qty: revertQty, note: null });
          }
        }
      }

      // Tao 1-2 phieu order_cancel_return (good + damaged), cong product_stock,
      // tru pool truoc, khong du tru staff_holdings.
      for (const cond of ['good', 'damaged']) {
        const lines = revertPlan[cond];
        if (!lines.length) continue;
        const reasonText = (`${reason || 'Huy don'} [${cond}]`).slice(0, 500);
        const code = await genReceiptCode(conn, 'in');
        const [rIns] = await conn.query(
          `INSERT INTO stock_receipts
             (code, kind, reason_code, reason_text, ref_order_id, created_by_staff_id)
           VALUES (?, 'in', 'order_cancel_return', ?, ?, ?)`,
          [code, reasonText, id, adminId]
        );
        const receiptId = rIns.insertId;
        for (const l of lines) {
          await conn.query(
            `INSERT INTO stock_receipt_items (receipt_id, product_id, qty, note)
             VALUES (?, ?, ?, ?)`,
            [receiptId, l.product_id, l.qty, l.note]
          );
          await conn.query(
            `UPDATE product_stock SET quantity = quantity + ? WHERE product_id = ?`,
            [l.qty, l.product_id]
          );
          revertedQty += l.qty;

          // Tru pool truoc
          let remain = l.qty;
          const poolEntries = poolByProdList.get(l.product_id) || [];
          for (const pe of poolEntries) {
            if (remain <= 0) break;
            const take = Math.min(remain, pe.qty);
            if (take > 0) {
              if (take >= pe.qty) {
                await conn.query(
                  `DELETE FROM release_pool WHERE id = ?`,
                  [pe.id]
                );
              } else {
                await conn.query(
                  `UPDATE release_pool SET qty = qty - ? WHERE id = ?`,
                  [take, pe.id]
                );
              }
              pe.qty -= take;
              remain -= take;
            }
          }
          // Khong du -> tru staff_holdings (theo first_held_at, bat ky staff nao)
          if (remain > 0) {
            const [holdRows] = await conn.query(
              `SELECT id, staff_id, qty FROM staff_holdings
                WHERE product_id = ? AND qty > 0
                ORDER BY first_held_at FOR UPDATE`,
              [l.product_id]
            );
            for (const h of holdRows) {
              if (remain <= 0) break;
              const take = Math.min(remain, Number(h.qty));
              if (take > 0) {
                await conn.query(
                  `UPDATE staff_holdings SET qty = qty - ? WHERE id = ?`,
                  [take, h.id]
                );
                remain -= take;
              }
            }
            await conn.query(
              `DELETE FROM staff_holdings WHERE product_id = ? AND qty <= 0`,
              [l.product_id]
            );
          }
        }
      }

      // Don release_pool: rows da qty=0 sau khi tru
      await conn.query(
        `DELETE FROM release_pool WHERE qty <= 0 AND order_id = ?`,
        [id]
      );
      // AUTO mode: xoa sach pool con lai (giu behavior cu, phong row thua)
      if (!userLines) {
        await conn.query(
          `DELETE FROM release_pool WHERE order_id = ?`,
          [id]
        );
      }
    }

    // Refund: collections chua nop -> soft delete + tru paid_amount
    let refundedFromCollections = 0;
    let manualRefundRequired = 0;
    let cancelledAdminPending = 0;
    {
      const [unremittedCols] = await conn.query(
        `SELECT id, amount FROM collections
          WHERE order_id = ? AND remitted = 0 AND is_deleted = 0
          FOR UPDATE`,
        [id]
      );
      if (unremittedCols.length) {
        refundedFromCollections = unremittedCols.reduce((s, c) => s + Number(c.amount), 0);
        const colIds = unremittedCols.map(c => c.id);
        const cph = colIds.map(() => '?').join(',');
        await conn.query(
          `UPDATE collections SET is_deleted = 1 WHERE id IN (${cph})`,
          colIds
        );
        // Soft delete order_payments lien quan -> doanh thu se khong tinh nua
        await conn.query(
          `UPDATE order_payments SET is_deleted = 1 WHERE collection_id IN (${cph})`,
          colIds
        );
        await conn.query(
          `UPDATE orders SET paid_amount = GREATEST(0, paid_amount - ?) WHERE id = ?`,
          [refundedFromCollections, id]
        );
      }
      // Soft delete admin_pending chua confirm: khach noi tra admin nhung admin
      // chua nhan thuc su, ma don bi cancel -> khoan nay khong con y nghia.
      // Khong dong vao paid_amount (vi confirmed=0 chua tang paid).
      const [pendRows] = await conn.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM order_payments
          WHERE order_id = ? AND source = 'admin_pending'
                AND confirmed = 0 AND is_deleted = 0`,
        [id]
      );
      cancelledAdminPending = Number(pendRows[0].total) || 0;
      if (cancelledAdminPending > 0) {
        await conn.query(
          `UPDATE order_payments
              SET is_deleted = 1,
                  note = CONCAT(COALESCE(note, ''), ' | Don cancel — pending tu dong xoa')
            WHERE order_id = ? AND source = 'admin_pending'
                  AND confirmed = 0 AND is_deleted = 0`,
          [id]
        );
      }
      // Phan paid_amount con lai = collections da remit (cong ty da co tien) + mark-paid -> can hoan thu cong
      const [paidNow] = await conn.query(
        `SELECT paid_amount FROM orders WHERE id = ?`, [id]
      );
      manualRefundRequired = Number(paidNow[0].paid_amount) || 0;
    }

    // Cancel order + ghi reason + canh bao refund vao note
    let noteParts = [];
    if (orderRows[0].note) noteParts.push(orderRows[0].note);
    if (reason) noteParts.push(`[CANCEL] ${reason}`);
    if (refundedFromCollections > 0) {
      noteParts.push(`[REFUND] Da huy ${refundedFromCollections}d collections KTV chua nop.`);
    }
    if (manualRefundRequired > 0) {
      noteParts.push(`[REFUND_REQUIRED] Con ${manualRefundRequired}d (collections da nop hoac admin mark-paid), hoan thu cong.`);
    }
    const newNote = noteParts.length ? noteParts.join('\n') : orderRows[0].note;
    await conn.query(
      `UPDATE orders SET status = 'cancelled', note = ? WHERE id = ?`,
      [newNote, id]
    );

    await conn.commit();
    const [rows] = await conn.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    res.json({
      ...rows[0],
      reverted_qty: revertedQty,
      refunded_from_collections: refundedFromCollections,
      cancelled_admin_pending: cancelledAdminPending,
      manual_refund_required: manualRefundRequired,
      warnings,
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- POST /api/admin/orders/:id/record-refund -----------------
// Body: { amount, method?: 'cash'|'transfer', note? }
// Ghi nhan da hoan tien cho khach (don cancelled hoac don done bi tra hang).
//   - INSERT order_payments(source='refund', amount duong, confirmed=1)
//   - KHONG dong vao orders.paid_amount/total_amount
//     Ly do: paid + total deu tinh tu lich su nguyen ban; refund la khoan
//     "hoan ngoai" — reports tu tru qua source='refund'. Neu giam paid thi
//     customer-debts se sai (xem khach 'no' phan da hoan).
//   - Reports/revenue tu dong tru phan refund (xem reports.js).
router.post('/:id/record-refund', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const amount = Math.max(0, Number(req.body.amount) || 0);
    if (!amount) throw httpErr(400, 'amount phai > 0');
    const method = ['cash', 'transfer'].includes(req.body.method) ? req.body.method : 'cash';
    const noteIn = req.body.note ? String(req.body.note).trim().slice(0, 500) : null;

    await conn.beginTransaction();

    const [orderRows] = await conn.query(
      `SELECT id, paid_amount FROM orders
        WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!orderRows.length) throw httpErr(404, 'Khong tim thay don');
    const paid = Number(orderRows[0].paid_amount) || 0;

    // Tong refund da ghi nhan (truoc khoan nay)
    const [refRow] = await conn.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM order_payments
        WHERE order_id = ? AND source = 'refund' AND is_deleted = 0`, [id]
    );
    const refunded = Number(refRow[0].total) || 0;

    if (paid <= 0) {
      throw httpErr(400, 'Don chua co tien da nhan — khong co gi de hoan');
    }
    if (refunded + amount > paid) {
      const remain = Math.max(0, paid - refunded);
      throw httpErr(400, `Chi co the hoan toi da ${remain}d (paid=${paid}, da hoan ${refunded})`);
    }

    const adminId = req.user && req.user.sub ? req.user.sub : null;
    const noteFinal = `[${method}] ${noteIn || 'Hoan tien khach'}`;
    await conn.query(
      `INSERT INTO order_payments
         (order_id, amount, source, confirmed, confirmed_at, confirmed_by, staff_id, note)
       VALUES (?, ?, 'refund', 1, NOW(), ?, ?, ?)`,
      [id, amount, adminId, adminId, noteFinal]
    );

    await conn.commit();
    const [rows] = await conn.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    res.json({ ...rows[0], refunded_amount: amount, total_refunded: refunded + amount });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- GET /api/admin/orders/:id/refunds ------------------------
// List cac khoan hoan tien da ghi nhan cho don
router.get('/:id/refunds', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.amount, p.note, p.paid_at, p.confirmed_at,
              s.full_name AS confirmed_by_name
         FROM order_payments p
         LEFT JOIN staff s ON s.id = p.confirmed_by
        WHERE p.order_id = ? AND p.source = 'refund' AND p.is_deleted = 0
        ORDER BY p.paid_at DESC`,
      [req.params.id]
    );
    const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
    res.json({ items: rows, total });
  } catch (err) { next(err); }
});

// ---- DELETE /api/admin/orders/:id (soft delete) ---------------
// Collections KHONG xoa.
router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.query(
      `UPDATE orders SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Khong tim thay don' });
    }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/orders/:id/suggested-staff ----------------
router.get('/:id/suggested-staff', async (req, res, next) => {
  try {
    const id = req.params.id;
    const [orderRows] = await db.query(
      `SELECT id, area FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!orderRows.length) return res.status(404).json({ error: 'Khong tim thay don' });

    const area = orderRows[0].area;
    const [rows] = await db.query(
      `SELECT
         s.id, s.username, s.full_name, s.area, s.phone, s.avatar_url,
         s.online_status, s.rating,
         COALESCE(t.active_count, 0) AS active_tasks,
         CASE WHEN s.area = ? THEN 1 ELSE 0 END AS area_match
       FROM staff s
       LEFT JOIN (
         SELECT assigned_staff_id, COUNT(*) AS active_count
           FROM orders
          WHERE assigned_staff_id IS NOT NULL
            AND status IN ('assigned','warehouse_released','in_progress')
            AND is_deleted = 0
          GROUP BY assigned_staff_id
       ) t ON t.assigned_staff_id = s.id
       WHERE s.role = 'kithuat' AND s.is_deleted = 0
       ORDER BY area_match DESC, active_tasks ASC, s.rating DESC
       LIMIT 20`,
      [area]
    );
    res.json({ items: rows, order_area: area });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/orders/:id/returnable --------------------
// Tra ve danh sach SP co the hoan kho cho don nay, kem max qty.
// mode = 'cancel' khi don con o flow trung gian (chua done)
// mode = 'return-done' khi don da done (FINAL_STATUSES) -> tra hang sau khi giao
router.get('/:id/returnable', async (req, res, next) => {
  try {
    const id = req.params.id;
    const [orderRows] = await db.query(
      `SELECT id, code, status FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!orderRows.length) return res.status(404).json({ error: 'Khong tim thay don' });
    const order = orderRows[0];
    const isFinal = FINAL_STATUSES.includes(order.status);
    const mode = isFinal ? 'return-done' : 'cancel';

    // Tong release/install/cancel-return/return-done theo product
    const [aggRows] = await db.query(
      `SELECT ri.product_id,
              p.code AS product_code, p.name AS product_name,
              SUM(CASE WHEN r.reason_code = 'order_release'       AND r.is_voided = 0 THEN ri.qty ELSE 0 END) AS released_qty,
              SUM(CASE WHEN r.reason_code = 'install_done'        AND r.is_voided = 0 THEN ri.qty ELSE 0 END) AS installed_qty,
              SUM(CASE WHEN r.reason_code = 'order_cancel_return' AND r.is_voided = 0 THEN ri.qty ELSE 0 END) AS returned_cancel_qty,
              SUM(CASE WHEN r.reason_code = 'order_return_done'   AND r.is_voided = 0 THEN ri.qty ELSE 0 END) AS returned_done_qty
         FROM stock_receipt_items ri
         JOIN stock_receipts r ON r.id = ri.receipt_id
         JOIN products p ON p.id = ri.product_id
        WHERE r.ref_order_id = ?
          AND r.reason_code IN ('order_release','install_done','order_cancel_return','order_return_done')
        GROUP BY ri.product_id, p.code, p.name
        ORDER BY p.code`,
      [id]
    );

    const lines = aggRows.map(r => {
      const released = Number(r.released_qty) || 0;
      const installed = Number(r.installed_qty) || 0;
      const retCancel = Number(r.returned_cancel_qty) || 0;
      const retDone = Number(r.returned_done_qty) || 0;
      const maxReturnable = mode === 'return-done'
        ? Math.max(0, installed - retDone)
        : Math.max(0, released - installed - retCancel);
      return {
        product_id: r.product_id,
        product_code: r.product_code,
        product_name: r.product_name,
        released_qty: released,
        installed_qty: installed,
        returned_cancel_qty: retCancel,
        returned_done_qty: retDone,
        max_returnable: maxReturnable,
      };
    });

    res.json({
      order_id: order.id,
      order_code: order.code,
      status: order.status,
      mode,
      lines,
    });
  } catch (err) { next(err); }
});

// ---- POST /api/admin/orders/:id/return-done -------------------
// Body: {
//   reason_text: string (bat buoc),
//   return_lines: [{ product_id, qty, condition?: 'good'|'damaged', note? }]  (>=1 dong)
// }
// Don DA DONE/customer_owes/pending_admin_confirm/staff_owes -> khach quay dau tra hang.
// Cong product_stock + ghi phieu order_return_done + set orders.has_return = 1.
// KHONG doi order.status (tien da xu ly xong, chi la dong tac kho).
router.post('/:id/return-done', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const reason = String(req.body.reason_text || req.body.reason || '').trim();
    if (!reason) throw httpErr(400, 'Phai cung cap ly do tra hang (reason_text)');

    const userLines = Array.isArray(req.body.return_lines) ? req.body.return_lines : [];
    if (!userLines.length) throw httpErr(400, 'Phai chon it nhat 1 SP de tra');

    const [orderRows] = await conn.query(
      `SELECT id, status FROM orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!orderRows.length) throw httpErr(404, 'Khong tim thay don');
    if (!FINAL_STATUSES.includes(orderRows[0].status)) {
      throw httpErr(409, `Don o trang thai ${orderRows[0].status} chua hoan tat — dung route /cancel`);
    }

    await conn.beginTransaction();

    const adminId = req.user && req.user.sub ? req.user.sub : null;

    // Tong installed va returned_done theo product
    const [aggRows] = await conn.query(
      `SELECT ri.product_id,
              SUM(CASE WHEN r.reason_code = 'install_done'      AND r.is_voided = 0 THEN ri.qty ELSE 0 END) AS installed_qty,
              SUM(CASE WHEN r.reason_code = 'order_return_done' AND r.is_voided = 0 THEN ri.qty ELSE 0 END) AS returned_done_qty
         FROM stock_receipt_items ri
         JOIN stock_receipts r ON r.id = ri.receipt_id
        WHERE r.ref_order_id = ?
        GROUP BY ri.product_id`,
      [id]
    );
    const installedByProd = new Map(aggRows.map(r => [r.product_id, Number(r.installed_qty) || 0]));
    const returnedByProd = new Map(aggRows.map(r => [r.product_id, Number(r.returned_done_qty) || 0]));

    // Tong qty user / SP
    const userTotalByProd = new Map();
    for (const raw of userLines) {
      const pid = Number(raw.product_id);
      const q = Math.max(0, Number(raw.qty) || 0);
      if (!pid || !q) continue;
      userTotalByProd.set(pid, (userTotalByProd.get(pid) || 0) + q);
    }
    if (!userTotalByProd.size) throw httpErr(400, 'Khong co dong nao co qty hop le');

    for (const [pid, qSum] of userTotalByProd) {
      const installed = installedByProd.get(pid) || 0;
      const alreadyReturned = returnedByProd.get(pid) || 0;
      const maxReturnable = Math.max(0, installed - alreadyReturned);
      if (qSum > maxReturnable) {
        throw httpErr(400, `SP id=${pid}: chi tra duoc toi da ${maxReturnable}, yeu cau ${qSum}`);
      }
    }

    // Tach theo condition (mac dinh good)
    const plan = { good: [], damaged: [] };
    for (const raw of userLines) {
      const pid = Number(raw.product_id);
      const q = Math.max(0, Number(raw.qty) || 0);
      if (!pid || !q) continue;
      const condition = raw.condition === 'damaged' ? 'damaged' : 'good';
      const note = raw.note ? String(raw.note).trim().slice(0, 500) : null;
      plan[condition].push({ product_id: pid, qty: q, note });
    }

    let returnedQty = 0;
    const generatedReceipts = [];
    for (const cond of ['good', 'damaged']) {
      const lines = plan[cond];
      if (!lines.length) continue;
      const reasonText = (`${reason} [${cond}]`).slice(0, 500);
      const code = await genReceiptCode(conn, 'in');
      const [rIns] = await conn.query(
        `INSERT INTO stock_receipts
           (code, kind, reason_code, reason_text, ref_order_id, created_by_staff_id)
         VALUES (?, 'in', 'order_return_done', ?, ?, ?)`,
        [code, reasonText, id, adminId]
      );
      const receiptId = rIns.insertId;
      for (const l of lines) {
        await conn.query(
          `INSERT INTO stock_receipt_items (receipt_id, product_id, qty, note)
           VALUES (?, ?, ?, ?)`,
          [receiptId, l.product_id, l.qty, l.note]
        );
        // Lock + cong product_stock (UPSERT phong don cu khong co row)
        await conn.query(
          `INSERT INTO product_stock (product_id, quantity) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
          [l.product_id, l.qty]
        );
        returnedQty += l.qty;
      }
      generatedReceipts.push({ receipt_id: receiptId, code, condition: cond, line_count: lines.length });
    }

    await conn.query(
      `UPDATE orders SET has_return = 1 WHERE id = ?`, [id]
    );

    await conn.commit();
    res.json({
      ok: true,
      order_id: Number(id),
      returned_qty: returnedQty,
      receipts: generatedReceipts,
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ==========================================================
// Renewal flow (don gia han GPS)
// ----------------------------------------------------------
// pending_review (khach tao)
//   -> /quote   (admin bao gia, sinh public_token)        -> quoted
//   -> /accept  qua public api (khach chap nhan + chon CK) -> awaiting_payment (transfer)
//   -> /mark-debt qua public api (khach chon ghi no)       -> awaiting_payment (debt)
//   -> /report-payment qua public api (khach bao da CK)    -> payment_reported
//   -> /complete-renewal (admin gia han xong tay tren 5g)  -> done
// Don no: complete-renewal cho phep paid_amount = 0, vao rolling balance binh thuong.
// ==========================================================

// ---- POST /api/admin/orders/:id/quote ------------------------
// Admin bao gia don gia han (replace items + charges, sinh public_token).
// Body: { items: [{ qty, unit_price, vehicle_plate, imei, subscription_account, years, phone }],
//         charges?: [{ kind, label, amount }],
//         note? }
// product_id KHONG can FE gui — BE tu fill = ID cua san pham mac dinh 'RENEW'
// (seed boi migration 031). FE chi nhap thong tin xe + don gia.
router.post('/:id/quote', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    await conn.beginTransaction();

    const [orderRows] = await conn.query(
      `SELECT id, status, service_kind, public_token FROM orders
        WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!orderRows.length) throw httpErr(404, 'Khong tim thay don');
    const o = orderRows[0];
    if (o.service_kind !== 'renewal') throw httpErr(400, 'Chi don gia han moi dung /quote');
    if (!['pending_review', 'quoted'].includes(o.status)) {
      throw httpErr(409, `Khong the bao gia khi don dang ${o.status}`);
    }

    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) throw httpErr(400, 'Phai co it nhat 1 dong xe');
    for (const it of items) {
      if (Number(it.unit_price) < 0) throw httpErr(400, 'unit_price khong hop le');
    }

    // Auto-fill product_id = RENEW cho moi dong (admin khong can chon)
    const renewPid = await getRenewProductId(conn);
    items.forEach(it => { if (!Number(it.product_id)) it.product_id = renewPid; });

    await replaceItems(conn, id, items);
    if (req.body.charges !== undefined) {
      await replaceCharges(conn, id, Array.isArray(req.body.charges) ? req.body.charges : []);
    }

    const { total } = await recalcOrderTotal(conn, id);
    if (total <= 0) throw httpErr(400, 'Tong don phai > 0 sau khi bao gia');

    // Sinh token neu chua co (giu nguyen token cu khi admin bao gia lai
    // de link da gui khach truoc do van mo duoc).
    let token = o.public_token;
    if (!token) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = crypto.randomBytes(24).toString('hex');
        try {
          await conn.query(
            `UPDATE orders SET public_token = ? WHERE id = ?`, [candidate, id]
          );
          token = candidate;
          break;
        } catch (e) {
          if (e.code !== 'ER_DUP_ENTRY') throw e;
        }
      }
      if (!token) throw httpErr(500, 'Khong sinh duoc public_token');
    }

    const adminId = req.user && req.user.sub ? req.user.sub : null;
    await conn.query(
      `UPDATE orders
          SET status = 'quoted',
              note = COALESCE(?, note),
              confirmed_at = COALESCE(confirmed_at, NOW()),
              confirmed_by = COALESCE(confirmed_by, ?)
        WHERE id = ?`,
      [req.body.note !== undefined ? (req.body.note || null) : null, adminId, id]
    );

    await conn.commit();
    const [rows] = await conn.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    res.json({ ...rows[0], public_token: token });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- POST /api/admin/orders/:id/complete-renewal --------------
// Admin xac nhan da gia han thu cong tren GoTrack (web 5g) -> chot don.
// Body: { mark_paid?: boolean, paid_amount? }
//   - mark_paid=true (mac dinh) + payment_method='transfer' + status='payment_reported'
//     -> ghi nhan da nhan tien (paid_amount = total) qua order_payments(source='admin_mark_paid').
//   - payment_method='debt' -> chuyen thang done, paid_amount = 0 (vao rolling balance).
router.post('/:id/complete-renewal', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    await conn.beginTransaction();

    const [orderRows] = await conn.query(
      `SELECT id, status, service_kind, total_amount, paid_amount, payment_method
         FROM orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!orderRows.length) throw httpErr(404, 'Khong tim thay don');
    const o = orderRows[0];
    if (o.service_kind !== 'renewal') throw httpErr(400, 'Chi don gia han moi dung /complete-renewal');
    if (!['awaiting_payment', 'payment_reported'].includes(o.status)) {
      throw httpErr(409, `Khong the hoan tat khi don dang ${o.status}`);
    }

    const adminId = req.user && req.user.sub ? req.user.sub : null;
    const total = Number(o.total_amount);
    const currentPaid = Number(o.paid_amount);
    const remaining = Math.max(0, total - currentPaid);

    // Mac dinh: ghi nhan thanh toan neu khach da bao CK (payment_reported).
    // Don no (payment_method='debt') khong tu mark-paid; admin co the goi mark-paid sau.
    const wantsMarkPaid = req.body.mark_paid !== undefined
      ? !!req.body.mark_paid
      : (o.status === 'payment_reported' && o.payment_method === 'transfer');

    if (wantsMarkPaid && remaining > 0) {
      let amount = req.body.paid_amount !== undefined ? Number(req.body.paid_amount) : remaining;
      if (!amount || amount <= 0) throw httpErr(400, 'paid_amount phai > 0');
      if (amount > remaining) amount = remaining;
      await conn.query(
        `UPDATE orders SET paid_amount = paid_amount + ? WHERE id = ?`,
        [amount, id]
      );
      await conn.query(
        `INSERT INTO order_payments (order_id, amount, source, confirmed, confirmed_at, confirmed_by, staff_id, note)
         VALUES (?, ?, 'admin_mark_paid', 1, NOW(), ?, ?, 'Hoan tat gia han')`,
        [id, amount, adminId, adminId]
      );
    }

    await conn.query(
      `UPDATE orders SET status = 'done', completed_at = COALESCE(completed_at, NOW()) WHERE id = ?`, [id]
    );

    await conn.commit();
    const [rows] = await conn.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- POST /api/admin/orders/:id/checklist ---------------------
// Body: { step }
router.post('/:id/checklist', async (req, res, next) => {
  try {
    const id = req.params.id;
    const step = String(req.body.step || '').trim();
    if (!step) throw httpErr(400, 'Thieu step');

    const [exist] = await db.query(
      `SELECT id FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!exist.length) return res.status(404).json({ error: 'Khong tim thay don' });

    const [maxRow] = await db.query(
      `SELECT MAX(sort_order) AS m FROM order_checklist WHERE order_id = ?`, [id]
    );
    const sortOrder = (maxRow[0].m || 0) + 1;

    const [result] = await db.query(
      `INSERT INTO order_checklist (order_id, step, sort_order) VALUES (?, ?, ?)`,
      [id, step, sortOrder]
    );
    const [rows] = await db.query(`SELECT * FROM order_checklist WHERE id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ---- PUT /api/admin/orders/:id/checklist/:stepId --------------
router.put('/:id/checklist/:stepId', async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.step !== undefined)    updates.step = String(req.body.step || '').trim();
    if (req.body.is_done !== undefined) {
      updates.is_done = req.body.is_done ? 1 : 0;
      updates.done_at = req.body.is_done ? new Date() : null;
    }
    const cols = Object.keys(updates);
    if (!cols.length) return res.status(400).json({ error: 'Khong co truong de cap nhat' });

    const setSql = cols.map(c => `${c} = ?`).join(', ');
    const values = cols.map(c => updates[c]);
    const [result] = await db.query(
      `UPDATE order_checklist SET ${setSql} WHERE id = ? AND order_id = ?`,
      [...values, req.params.stepId, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Khong tim thay step' });
    const [rows] = await db.query(`SELECT * FROM order_checklist WHERE id = ?`, [req.params.stepId]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ---- DELETE /api/admin/orders/:id/checklist/:stepId -----------
router.delete('/:id/checklist/:stepId', async (req, res, next) => {
  try {
    const [result] = await db.query(
      `DELETE FROM order_checklist WHERE id = ? AND order_id = ?`,
      [req.params.stepId, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Khong tim thay step' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
