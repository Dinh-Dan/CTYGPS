// /api/admin/warranty-orders — CRUD + state transitions cho don bao hanh
// Tat ca route deu yeu cau role admin (da check o admin.js cha)
//
// Endpoints:
//   GET    /                       -> list (filter status, customer_id, q, date range)
//   GET    /:id                    -> detail (kem stock_receipts gan voi don nay)
//   POST   /                       -> tao moi (admin tao tay)
//   PUT    /:id                    -> sua metadata (chan khi terminal)
//   DELETE /:id                    -> soft delete
//   POST   /:id/assign             -> set assigned_staff_id (KTV)
//   POST   /:id/receive            -> pending -> received (admin tiep nhan)
//   POST   /:id/recover            -> received -> recovered (kem recovered_image_url)
//   POST   /:id/send-out           -> recovered -> awaiting_warranty (kem warranty_partner)
//   POST   /:id/mark-returned      -> awaiting_warranty -> warranty_done
//   POST   /:id/start-deliver      -> recovered|warranty_done -> delivering
//   POST   /:id/complete           -> delivering -> completed (kem cost_amount, paid_amount, delivered_image_url)
//   POST   /:id/cancel             -> -> cancelled (reason)
//   POST   /:id/release-stock      -> tao phieu xuat kho lay thiet bi tu kho cho don BH
//                                     Body: { items: [{product_id, qty, imei_list?}], reason_text? }
//   PATCH  /:id/payment            -> ghi nhan thanh toan tu khach (cong vao paid_amount)

const express = require('express');
const db = require('../../db');
const {
  WARRANTY_STATUSES, TERMINAL_STATUSES,
  ITEM_KINDS,
  canWarrantyTransition, insertWarrantyWithRetry,
  loadWarrantyItems,
} = require('../../utils/warrantyState');

const router = express.Router();

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// Sinh code phieu xuat PX-YYMMDD-NNN (dung trong release-stock).
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

// Cap nhat status + cac cot bo sung. Dung trong transaction.
async function transitionStatus(conn, id, fromStatus, toStatus, extraSet = {}, extraRaw = {}) {
  if (!canWarrantyTransition(fromStatus, toStatus)) {
    throw httpErr(409, `Khong the chuyen ${fromStatus} -> ${toStatus}`);
  }
  const setParts = ['status = ?'];
  const values = [toStatus];
  for (const [col, val] of Object.entries(extraSet)) {
    setParts.push(`${col} = ?`);
    values.push(val);
  }
  for (const [col, expr] of Object.entries(extraRaw)) {
    setParts.push(`${col} = ${expr}`);
  }
  values.push(id);
  await conn.query(
    `UPDATE warranty_orders SET ${setParts.join(', ')} WHERE id = ?`,
    values
  );
}

// ---- GET / ---------------------------------------------------
// Query: ?status, ?customer_id, ?staff_id, ?q, ?from, ?to, ?page, ?limit
router.get('/', async (req, res, next) => {
  try {
    const status     = req.query.status;
    const customerId = req.query.customer_id ? Number(req.query.customer_id) : null;
    const staffId    = req.query.staff_id ? Number(req.query.staff_id) : null;
    const q          = (req.query.q || '').trim();
    const from       = (req.query.from || '').trim();
    const to         = (req.query.to || '').trim();
    const page       = Math.max(1, parseInt(req.query.page) || 1);
    const limit      = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset     = (page - 1) * limit;

    const where = ['w.is_deleted = 0'];
    const args = [];
    if (status && WARRANTY_STATUSES.includes(status)) { where.push('w.status = ?'); args.push(status); }
    if (customerId)                                   { where.push('w.customer_id = ?'); args.push(customerId); }
    if (staffId)                                      { where.push('w.assigned_staff_id = ?'); args.push(staffId); }
    if (from)                                         { where.push('w.request_date >= ?'); args.push(from); }
    if (to)                                           { where.push('w.request_date <= ?'); args.push(to); }
    if (q) {
      where.push('(w.code LIKE ? OR w.license_plate LIKE ? OR w.imei_search LIKE ? OR w.device_name LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ? OR c.code LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like, like, like, like, like, like);
    }

    const whereSql = 'WHERE ' + where.join(' AND ');

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
         FROM warranty_orders w
         LEFT JOIN customers c ON c.id = w.customer_id
         ${whereSql}`,
      args
    );

    const [rows] = await db.query(
      `SELECT
         w.id, w.code,
         w.customer_id, w.license_plate, w.device_name, w.imei_search,
         w.reason_text, w.note_text, w.address,
         w.assigned_staff_id, w.recovered_image_url, w.delivered_image_url,
         w.warranty_partner, w.sent_at, w.returned_at,
         w.cost_amount, w.paid_amount,
         w.debt_carried_at, w.debt_settlement_id,
         w.status, w.request_date, w.creator_type, w.creator_id,
         c.code AS customer_code, c.full_name AS customer_name, c.phone AS customer_phone, c.type AS customer_type,
         s.full_name AS staff_name
       FROM warranty_orders w
       LEFT JOIN customers c ON c.id = w.customer_id
       LEFT JOIN staff     s ON s.id = w.assigned_staff_id
       ${whereSql}
       ORDER BY w.id DESC
       LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    res.json({ items: rows, total: countRows[0].total, page, limit });
  } catch (err) { next(err); }
});

// ---- GET /:id ------------------------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT w.*,
              c.code AS customer_code, c.full_name AS customer_name,
              c.phone AS customer_phone, c.address AS customer_address, c.type AS customer_type,
              s.full_name AS staff_name, s.phone AS staff_phone
         FROM warranty_orders w
         LEFT JOIN customers c ON c.id = w.customer_id
         LEFT JOIN staff     s ON s.id = w.assigned_staff_id
        WHERE w.id = ? AND w.is_deleted = 0`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay don bao hanh' });
    const wo = rows[0];

    // Phieu xuat kho lien quan
    const [receipts] = await db.query(
      `SELECT r.id, r.code, r.kind, r.reason_code, r.reason_text, r.created_at,
              r.is_voided, r.created_by_staff_id,
              s.full_name AS created_by_name
         FROM stock_receipts r
         LEFT JOIN staff s ON s.id = r.created_by_staff_id
        WHERE r.ref_warranty_order_id = ?
        ORDER BY r.id DESC`,
      [wo.id]
    );
    for (const r of receipts) {
      const [items] = await db.query(
        `SELECT ri.product_id, ri.qty, ri.imei_list, ri.note,
                p.code AS product_code, p.name AS product_name
           FROM stock_receipt_items ri
           LEFT JOIN products p ON p.id = ri.product_id
          WHERE ri.receipt_id = ?`,
        [r.id]
      );
      r.items = items;
    }
    wo.receipts = receipts;

    // Items theo kind (received_from_customer / sent_to_partner / received_back /
    // delivered_to_customer / replacement)
    wo.items = await loadWarrantyItems(db, wo.id);

    res.json(wo);
  } catch (err) { next(err); }
});

// ---- POST / --------------------------------------------------
// Body: { customer_id, license_plate?, device_name?, imei_search?, reason, note?, address?, cost_amount? }
router.post('/', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const customerId = Number(req.body.customer_id);
    if (!customerId) throw httpErr(400, 'Thieu customer_id');

    const [c] = await conn.query(
      `SELECT id FROM customers WHERE id = ? AND is_deleted = 0`, [customerId]
    );
    if (!c.length) throw httpErr(404, 'Khach hang khong ton tai');

    const reason = String(req.body.reason || '').trim();
    if (!reason) throw httpErr(400, 'Thieu ly do bao hanh');

    const licensePlate = req.body.license_plate ? String(req.body.license_plate).trim() : null;
    const deviceName   = req.body.device_name   ? String(req.body.device_name).trim()   : null;
    const imeiSearch   = req.body.imei_search   ? String(req.body.imei_search).trim()   : null;
    const note         = req.body.note          ? String(req.body.note).trim()          : null;
    const address      = req.body.address       ? String(req.body.address).trim()       : null;
    const costAmount   = Math.max(0, Number(req.body.cost_amount) || 0);

    const adminId = req.user && req.user.sub ? req.user.sub : null;

    await conn.beginTransaction();

    const { result } = await insertWarrantyWithRetry(conn, (code) =>
      conn.query(
        `INSERT INTO warranty_orders
           (code, customer_id,
            license_plate, device_name, imei_search,
            reason_text, note_text, address,
            cost_amount,
            status, request_date,
            creator_type, creator_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURDATE(), 'admin', ?)`,
        [
          code, customerId,
          licensePlate, deviceName, imeiSearch,
          reason, note, address,
          costAmount,
          adminId,
        ]
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

// ---- PUT /:id ------------------------------------------------
// Sua metadata. Chan khi status terminal (completed/cancelled).
router.put('/:id', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const [exist] = await conn.query(
      `SELECT id, status FROM warranty_orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!exist.length) throw httpErr(404, 'Khong tim thay don bao hanh');
    if (TERMINAL_STATUSES.includes(exist[0].status)) {
      throw httpErr(409, 'Khong the sua khi don da ket thuc');
    }

    const updates = {};
    if (req.body.customer_id !== undefined) {
      const cid = Number(req.body.customer_id);
      if (!cid) throw httpErr(400, 'customer_id khong hop le');
      const [c] = await conn.query(`SELECT id FROM customers WHERE id = ? AND is_deleted = 0`, [cid]);
      if (!c.length) throw httpErr(404, 'Khach hang khong ton tai');
      updates.customer_id = cid;
    }
    if (req.body.license_plate !== undefined) {
      updates.license_plate = req.body.license_plate ? String(req.body.license_plate).trim() : null;
    }
    if (req.body.device_name !== undefined) {
      updates.device_name = req.body.device_name ? String(req.body.device_name).trim() : null;
    }
    if (req.body.imei_search !== undefined) {
      updates.imei_search = req.body.imei_search ? String(req.body.imei_search).trim() : null;
    }
    if (req.body.reason !== undefined) {
      const v = String(req.body.reason || '').trim();
      if (!v) throw httpErr(400, 'reason khong duoc rong');
      updates.reason_text = v;
    }
    if (req.body.note !== undefined) {
      updates.note_text = req.body.note ? String(req.body.note).trim() : null;
    }
    if (req.body.address !== undefined) {
      updates.address = req.body.address ? String(req.body.address).trim() : null;
    }
    if (req.body.cost_amount !== undefined) {
      updates.cost_amount = Math.max(0, Number(req.body.cost_amount) || 0);
    }
    if (req.body.warranty_partner !== undefined) {
      updates.warranty_partner = req.body.warranty_partner ? String(req.body.warranty_partner).trim() : null;
    }

    const cols = Object.keys(updates);
    if (!cols.length) return res.status(400).json({ error: 'Khong co truong de cap nhat' });

    await conn.beginTransaction();
    const setSql = cols.map(c => `${c} = ?`).join(', ');
    const values = cols.map(c => updates[c]);
    await conn.query(
      `UPDATE warranty_orders SET ${setSql} WHERE id = ?`,
      [...values, id]
    );
    await conn.commit();

    const [rows] = await conn.query(`SELECT * FROM warranty_orders WHERE id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- DELETE /:id ---------------------------------------------
router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.query(
      `UPDATE warranty_orders SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Khong tim thay don bao hanh' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ---- POST /:id/assign ----------------------------------------
// Body: { staff_id }
router.post('/:id/assign', async (req, res, next) => {
  try {
    const id = req.params.id;
    const staffId = req.body.staff_id ? Number(req.body.staff_id) : null;

    if (staffId) {
      const [s] = await db.query(
        `SELECT id, role FROM staff WHERE id = ? AND is_deleted = 0`, [staffId]
      );
      if (!s.length || s[0].role !== 'kithuat') {
        return res.status(400).json({ error: 'Nhan vien khong phai KTV hop le' });
      }
    }

    const [exist] = await db.query(
      `SELECT id, status FROM warranty_orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!exist.length) return res.status(404).json({ error: 'Khong tim thay don bao hanh' });
    if (TERMINAL_STATUSES.includes(exist[0].status)) {
      return res.status(409).json({ error: 'Khong the gan KTV cho don da ket thuc' });
    }

    await db.query(
      `UPDATE warranty_orders SET assigned_staff_id = ? WHERE id = ?`,
      [staffId, id]
    );
    const [rows] = await db.query(`SELECT * FROM warranty_orders WHERE id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ---- POST /:id/receive ---------------------------------------
// pending -> received (admin tiep nhan don).
router.post('/:id/receive', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status FROM warranty_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don bao hanh');
    await transitionStatus(conn, id, rows[0].status, 'received');
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM warranty_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- POST /:id/recover ---------------------------------------
// received -> recovered. BAT BUOC kem recovered_image_url (KTV chup khi thu hoi).
// Body: { recovered_image_url }
router.post('/:id/recover', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const imageUrl = String(req.body.recovered_image_url || '').trim();
    if (!imageUrl) throw httpErr(400, 'Thieu anh thu hoi');

    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status FROM warranty_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don bao hanh');
    await transitionStatus(conn, id, rows[0].status, 'recovered',
      { recovered_image_url: imageUrl });
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM warranty_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- POST /:id/send-out --------------------------------------
// recovered -> awaiting_warranty. Body: { warranty_partner? }
router.post('/:id/send-out', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const partner = req.body.warranty_partner ? String(req.body.warranty_partner).trim() : null;

    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status FROM warranty_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don bao hanh');
    await transitionStatus(conn, id, rows[0].status, 'awaiting_warranty',
      { warranty_partner: partner }, { sent_at: 'CURDATE()' });
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM warranty_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- POST /:id/mark-returned ---------------------------------
// awaiting_warranty -> warranty_done. Set returned_at = CURDATE().
router.post('/:id/mark-returned', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status FROM warranty_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don bao hanh');
    await transitionStatus(conn, id, rows[0].status, 'warranty_done',
      {}, { returned_at: 'CURDATE()' });
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM warranty_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- POST /:id/start-deliver ---------------------------------
// recovered|warranty_done -> delivering.
router.post('/:id/start-deliver', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status FROM warranty_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don bao hanh');
    await transitionStatus(conn, id, rows[0].status, 'delivering');
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM warranty_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- POST /:id/complete --------------------------------------
// delivering -> completed. Chia 3 nhanh tien giong don lap:
//   to_staff_amount  + to_staff_method (cash|transfer)  -> KTV thu, sinh collections
//   to_admin_amount                                      -> admin nhan truc tiep
//   debt_amount                                          -> khach no
//
// Body: {
//   delivered_image_url?,
//   cost_amount?,                  // ghi de truoc khi tinh
//   to_staff_amount?, to_staff_method?,
//   to_admin_amount?, debt_amount?,
//   expected_amount?               // mac dinh = cost - paid (sau ghi de cost)
// }
//
// Backward-compat: van chap nhan { paid_amount } cu — chuyen ngam thanh
// to_admin_amount.
router.post('/:id/complete', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const deliveredImage = req.body.delivered_image_url
      ? String(req.body.delivered_image_url).trim() : null;

    let toStaff       = Math.max(0, Number(req.body.to_staff_amount) || 0);
    let toStaffMethod = req.body.to_staff_method || null;
    let toAdmin       = Math.max(0, Number(req.body.to_admin_amount) || 0);
    let debt          = Math.max(0, Number(req.body.debt_amount) || 0);
    let expected      = req.body.expected_amount != null ? Number(req.body.expected_amount) : null;

    // Legacy: paid_amount cu coi nhu admin nhan truc tiep
    if (!toStaff && !toAdmin && !debt && req.body.paid_amount !== undefined) {
      toAdmin = Math.max(0, Number(req.body.paid_amount) || 0);
    }

    if (toStaff > 0 && !['cash', 'transfer'].includes(toStaffMethod)) {
      throw httpErr(400, "Khi co tien KTV thu, to_staff_method phai la 'cash' hoac 'transfer'");
    }

    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status, assigned_staff_id, cost_amount, paid_amount
         FROM warranty_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don bao hanh');
    const wo = rows[0];

    // 1) Cap nhat cost_amount neu co
    let cost = Number(wo.cost_amount) || 0;
    if (req.body.cost_amount !== undefined) {
      cost = Math.max(0, Number(req.body.cost_amount) || 0);
      await conn.query(
        `UPDATE warranty_orders SET cost_amount = ? WHERE id = ?`, [cost, id]
      );
    }
    const paidBefore = Number(wo.paid_amount) || 0;
    const remaining = Math.max(0, cost - paidBefore);
    if (expected == null) expected = remaining;
    if (expected < 0) throw httpErr(400, 'expected_amount khong duoc am');
    if (expected > remaining) {
      throw httpErr(400, `Don chi con thieu ${remaining}d, khong the chia ${expected}d`);
    }

    const sum = toStaff + toAdmin + debt;
    if (sum !== expected) {
      throw httpErr(400,
        `Tong 3 phan (${sum}d) phai bang phan can thu (${expected}d). ` +
        `KTV: ${toStaff}, Admin: ${toAdmin}, No: ${debt}`);
    }

    // 2) KTV thu -> collections + paid_amount += to_staff
    if (toStaff > 0) {
      const staffId = wo.assigned_staff_id || (req.user && req.user.sub);
      if (!staffId) throw httpErr(400, 'Don chua gan KTV — khong the ghi nhan KTV thu');
      await conn.query(
        `INSERT INTO collections (task_id, ref_warranty_order_id, staff_id, amount, method)
         VALUES (NULL, ?, ?, ?, ?)`,
        [id, staffId, toStaff, toStaffMethod]
      );
      await conn.query(
        `UPDATE warranty_orders SET paid_amount = paid_amount + ? WHERE id = ?`,
        [toStaff, id]
      );
    }

    // 3) Admin thu truc tiep -> paid_amount += to_admin (admin tu xac nhan luon)
    if (toAdmin > 0) {
      await conn.query(
        `UPDATE warranty_orders SET paid_amount = paid_amount + ? WHERE id = ?`,
        [toAdmin, id]
      );
    }

    // 4) debt: khong lam gi, suy ra tu Rolling Balance.

    // 5) Chuyen status + delivered_image_url
    const extraSet = {};
    if (deliveredImage) extraSet.delivered_image_url = deliveredImage;
    await transitionStatus(conn, id, wo.status, 'completed', extraSet);

    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM warranty_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- POST /:id/cancel ----------------------------------------
// Body: { reason? }
router.post('/:id/cancel', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const reason = String(req.body.reason || '').trim();
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status, note_text FROM warranty_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don bao hanh');

    const newNote = reason
      ? (rows[0].note_text ? `${rows[0].note_text}\n[CANCEL] ${reason}` : `[CANCEL] ${reason}`)
      : rows[0].note_text;

    await transitionStatus(conn, id, rows[0].status, 'cancelled',
      newNote === rows[0].note_text ? {} : { note_text: newNote });
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM warranty_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- POST /:id/release-stock ---------------------------------
// Tao phieu xuat kho lay thiet bi cho don bao hanh.
//
// 2 mode:
//   1. Body rong (mode binh thuong): lay tat ca warranty_order_items
//      kind='replacement', released_at IS NULL, product_id IS NOT NULL
//      -> sinh phieu xuat + danh dau released_at + release_receipt_id.
//   2. Body { items: [{product_id, qty, imei_list?}] } (mode shortcut):
//      tao items kind='replacement' moi roi xuat luon.
// Tru product_stock; neu da gan KTV thi cong vao staff_holdings.
router.post('/:id/release-stock', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const shortcutItems = Array.isArray(req.body.items) ? req.body.items : null;

    const [woRows] = await conn.query(
      `SELECT id, status, assigned_staff_id FROM warranty_orders
        WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!woRows.length) throw httpErr(404, 'Khong tim thay don bao hanh');
    if (TERMINAL_STATUSES.includes(woRows[0].status)) {
      throw httpErr(409, 'Khong the xuat kho cho don da ket thuc');
    }
    const assignedStaff = woRows[0].assigned_staff_id;

    await conn.beginTransaction();

    // Mode 2: shortcut — insert items kind=replacement truoc.
    if (shortcutItems && shortcutItems.length) {
      for (const raw of shortcutItems) {
        const productId = Number(raw.product_id);
        const qty = Number(raw.qty);
        if (!productId) throw httpErr(400, 'Item thieu product_id');
        if (!qty || qty <= 0) throw httpErr(400, 'qty phai > 0');
        const [pRows] = await conn.query(
          `SELECT name FROM products WHERE id = ?`, [productId]
        );
        if (!pRows.length) throw httpErr(404, `Khong tim thay san pham id=${productId}`);
        await conn.query(
          `INSERT INTO warranty_order_items
             (warranty_order_id, kind, product_id, name, imei, qty, unit_price, note)
           VALUES (?, 'replacement', ?, ?, ?, ?, 0, ?)`,
          [id, productId, pRows[0].name,
            raw.imei_list ? String(raw.imei_list).trim() : null,
            qty,
            raw.note ? String(raw.note).trim() : null]
        );
      }
    }

    // Lay tat ca items replacement chua released, co product_id (nhap tay khong xuat).
    const [pendingItems] = await conn.query(
      `SELECT id, product_id, qty, imei
         FROM warranty_order_items
        WHERE warranty_order_id = ?
          AND kind = 'replacement'
          AND released_at IS NULL
          AND product_id IS NOT NULL
          AND is_deleted = 0
        ORDER BY id ASC FOR UPDATE`,
      [id]
    );
    if (!pendingItems.length) {
      throw httpErr(400, 'Khong co san pham thay the nao chua xuat (kind=replacement, co product_id)');
    }

    // Gop theo product_id de lock va check ton.
    const grouped = new Map();
    for (const it of pendingItems) {
      const cur = grouped.get(it.product_id) || { qty: 0, imeis: [] };
      cur.qty += Number(it.qty || 0);
      if (it.imei) cur.imeis.push(it.imei);
      grouped.set(it.product_id, cur);
    }
    // Lock + verify ton kho
    const productIds = [...grouped.keys()].sort((a, b) => a - b);
    for (const pid of productIds) {
      const [psRows] = await conn.query(
        `SELECT quantity FROM product_stock WHERE product_id = ? FOR UPDATE`,
        [pid]
      );
      const cur = psRows.length ? psRows[0].quantity : 0;
      const need = grouped.get(pid).qty;
      if (cur < need) {
        throw httpErr(409, `Khong du ton: SP id=${pid} con ${cur}, can ${need}`);
      }
    }

    const code = await genReceiptCode(conn, 'out');
    const adminId = req.user && req.user.sub ? req.user.sub : null;

    const [rIns] = await conn.query(
      `INSERT INTO stock_receipts
         (code, kind, reason_code, reason_text,
          ref_warranty_order_id, ref_staff_id, created_by_staff_id)
       VALUES (?, 'out', 'warranty_release', ?, ?, ?, ?)`,
      [code, req.body.reason_text || null, id, assignedStaff, adminId]
    );
    const receiptId = rIns.insertId;

    for (const pid of productIds) {
      const g = grouped.get(pid);
      await conn.query(
        `INSERT INTO stock_receipt_items
           (receipt_id, product_id, qty, imei_list)
         VALUES (?, ?, ?, ?)`,
        [receiptId, pid, g.qty, g.imeis.length ? g.imeis.join(',') : null]
      );
      await conn.query(
        `UPDATE product_stock SET quantity = quantity - ? WHERE product_id = ?`,
        [g.qty, pid]
      );
      if (assignedStaff) {
        await conn.query(
          `INSERT INTO staff_holdings (staff_id, product_id, qty, first_held_at)
           VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)`,
          [assignedStaff, pid, g.qty]
        );
      }
    }

    // Danh dau item da xuat
    await conn.query(
      `UPDATE warranty_order_items
          SET released_at = NOW(), release_receipt_id = ?
        WHERE warranty_order_id = ?
          AND kind = 'replacement'
          AND released_at IS NULL
          AND product_id IS NOT NULL
          AND is_deleted = 0`,
      [receiptId, id]
    );

    await conn.commit();

    res.json({
      receipt: { id: receiptId, code, kind: 'out', reason_code: 'warranty_release' },
      released_count: pendingItems.length,
      assigned_to_staff: assignedStaff,
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- POST /:id/items -----------------------------------------
// Body: { kind, product_id?, name?, imei?, qty?, unit_price?, note? }
// Admin co the cham 5 kind. Snapshot ten tu products neu co product_id.
router.post('/:id/items', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const kind = String(req.body.kind || '').trim();
    if (!ITEM_KINDS.includes(kind)) throw httpErr(400, 'kind khong hop le');

    const [woRows] = await conn.query(
      `SELECT id, status FROM warranty_orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!woRows.length) throw httpErr(404, 'Khong tim thay don bao hanh');
    if (TERMINAL_STATUSES.includes(woRows[0].status)) {
      throw httpErr(409, 'Khong the them san pham cho don da ket thuc');
    }

    let productId = req.body.product_id ? Number(req.body.product_id) : null;
    let name = req.body.name ? String(req.body.name).trim() : '';
    if (productId) {
      const [pRows] = await conn.query(
        `SELECT name FROM products WHERE id = ?`, [productId]
      );
      if (!pRows.length) throw httpErr(404, 'San pham khong ton tai');
      if (!name) name = pRows[0].name;
    }
    if (!name) throw httpErr(400, 'Thieu ten san pham');

    const qty = Math.max(1, Number(req.body.qty) || 1);
    const unitPrice = Math.max(0, Number(req.body.unit_price) || 0);
    const imei = req.body.imei ? String(req.body.imei).trim() : null;
    const note = req.body.note ? String(req.body.note).trim() : null;

    const [ins] = await conn.query(
      `INSERT INTO warranty_order_items
         (warranty_order_id, kind, product_id, name, imei, qty, unit_price, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, kind, productId, name, imei, qty, unitPrice, note]
    );
    const [rows] = await conn.query(
      `SELECT * FROM warranty_order_items WHERE id = ?`, [ins.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); } finally { conn.release(); }
});

// ---- PUT /items/:itemId --------------------------------------
// Body: { product_id?, name?, imei?, qty?, unit_price?, note? }
// KHONG cho doi kind. Cam sua khi don da terminal hoac item replacement
// da released_at.
router.put('/items/:itemId', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const itemId = Number(req.params.itemId);
    const [iRows] = await conn.query(
      `SELECT i.id, i.warranty_order_id, i.kind, i.released_at,
              w.status AS wo_status
         FROM warranty_order_items i
         LEFT JOIN warranty_orders w ON w.id = i.warranty_order_id
        WHERE i.id = ? AND i.is_deleted = 0`, [itemId]
    );
    if (!iRows.length) throw httpErr(404, 'Khong tim thay item');
    const item = iRows[0];
    if (TERMINAL_STATUSES.includes(item.wo_status)) {
      throw httpErr(409, 'Khong the sua khi don da ket thuc');
    }
    if (item.kind === 'replacement' && item.released_at) {
      throw httpErr(409, 'Item da xuat kho — khong sua duoc');
    }

    const updates = {};
    if (req.body.product_id !== undefined) {
      const pid = req.body.product_id ? Number(req.body.product_id) : null;
      if (pid) {
        const [pRows] = await conn.query(`SELECT id FROM products WHERE id = ?`, [pid]);
        if (!pRows.length) throw httpErr(404, 'San pham khong ton tai');
      }
      updates.product_id = pid;
    }
    if (req.body.name !== undefined) {
      const v = String(req.body.name || '').trim();
      if (!v) throw httpErr(400, 'name khong duoc rong');
      updates.name = v;
    }
    if (req.body.imei !== undefined) updates.imei = req.body.imei ? String(req.body.imei).trim() : null;
    if (req.body.qty !== undefined) updates.qty = Math.max(1, Number(req.body.qty) || 1);
    if (req.body.unit_price !== undefined) updates.unit_price = Math.max(0, Number(req.body.unit_price) || 0);
    if (req.body.note !== undefined) updates.note = req.body.note ? String(req.body.note).trim() : null;

    const cols = Object.keys(updates);
    if (!cols.length) return res.status(400).json({ error: 'Khong co truong de cap nhat' });
    const setSql = cols.map(c => `${c} = ?`).join(', ');
    const values = cols.map(c => updates[c]);
    await conn.query(
      `UPDATE warranty_order_items SET ${setSql} WHERE id = ?`,
      [...values, itemId]
    );
    const [rows] = await conn.query(`SELECT * FROM warranty_order_items WHERE id = ?`, [itemId]);
    res.json(rows[0]);
  } catch (err) { next(err); } finally { conn.release(); }
});

// ---- DELETE /items/:itemId -----------------------------------
// Soft delete. Cam xoa neu replacement da released (yeu cau void phieu xuat truoc).
router.delete('/items/:itemId', async (req, res, next) => {
  try {
    const itemId = Number(req.params.itemId);
    const [iRows] = await db.query(
      `SELECT i.id, i.kind, i.released_at, w.status AS wo_status
         FROM warranty_order_items i
         LEFT JOIN warranty_orders w ON w.id = i.warranty_order_id
        WHERE i.id = ? AND i.is_deleted = 0`, [itemId]
    );
    if (!iRows.length) return res.status(404).json({ error: 'Khong tim thay item' });
    const item = iRows[0];
    if (TERMINAL_STATUSES.includes(item.wo_status)) {
      return res.status(409).json({ error: 'Khong the xoa khi don da ket thuc' });
    }
    if (item.kind === 'replacement' && item.released_at) {
      return res.status(409).json({ error: 'Item da xuat kho — phai void phieu xuat truoc' });
    }
    await db.query(`UPDATE warranty_order_items SET is_deleted = 1 WHERE id = ?`, [itemId]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ---- PATCH /:id/payment --------------------------------------
// Cap nhat paid_amount (ghi de). Body: { paid_amount, cost_amount? }
router.patch('/:id/payment', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const updates = {};
    if (req.body.cost_amount !== undefined) {
      updates.cost_amount = Math.max(0, Number(req.body.cost_amount) || 0);
    }
    if (req.body.paid_amount !== undefined) {
      updates.paid_amount = Math.max(0, Number(req.body.paid_amount) || 0);
    }
    const cols = Object.keys(updates);
    if (!cols.length) return res.status(400).json({ error: 'Thieu so tien' });

    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status FROM warranty_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don bao hanh');
    if (rows[0].status === 'cancelled') {
      throw httpErr(409, 'Don da huy, khong cap nhat thanh toan');
    }
    const setSql = cols.map(c => `${c} = ?`).join(', ');
    const values = cols.map(c => updates[c]);
    await conn.query(
      `UPDATE warranty_orders SET ${setSql} WHERE id = ?`,
      [...values, id]
    );
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM warranty_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

module.exports = router;
