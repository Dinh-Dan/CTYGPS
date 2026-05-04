// /api/admin/repair-orders — CRUD + state transitions cho don sua chua
// Tat ca route deu yeu cau role admin (da check o admin.js cha)
//
// Flow: pending -> assigned -> diagnosing -> quoted -> awaiting_customer
//       -> approved -> repairing -> done (BILL KHOA) -> delivering -> completed
//       (rejected co the loop ve awaiting_customer sau khi admin sua bao gia)
//
// Endpoints:
//   GET    /                       -> list (filter status, customer_id, q, date range)
//   GET    /:id                    -> detail (kem items, charges, stock_receipts)
//   POST   /                       -> tao moi (admin tao tay)
//   PUT    /:id                    -> sua metadata (chan khi bill locked)
//   DELETE /:id                    -> soft delete
//   POST   /:id/assign             -> set assigned_staff_id (pending -> assigned khi co KTV)
//   PUT    /:id/items              -> replace items vat tu (chan khi locked)
//   PUT    /:id/charges            -> replace charges (chan khi locked)
//   PATCH  /:id/service-fee        -> sua service_fee + sync sang task wage_amount neu co
//   POST   /:id/send-customer      -> quoted -> awaiting_customer (admin chot va gui khach)
//   POST   /:id/reopen-quote       -> awaiting_customer|rejected -> quoted (sua lai bao gia)
//   POST   /:id/release-stock      -> approved -> repairing + tao stock_receipts
//   POST   /:id/start-deliver      -> done -> delivering
//   POST   /:id/complete           -> delivering -> completed (kem paid_amount, delivered_image_url)
//   POST   /:id/cancel             -> -> cancelled (reason)
//   PATCH  /:id/payment            -> ghi nhan thanh toan (paid_amount)

const express = require('express');
const db = require('../../db');
const {
  REPAIR_STATUSES, TERMINAL_STATUSES, BILL_LOCKED_STATUSES,
  canRepairTransition, isBillLocked, insertRepairWithRetry, recalcRepairTotal,
} = require('../../utils/repairState');

const router = express.Router();

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// Sinh code phieu xuat PX-YYMMDD-NNN.
async function genReceiptCode(conn) {
  const now = new Date();
  const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const like = `PX-${datePart}-%`;
  const [rows] = await conn.query(
    `SELECT code FROM stock_receipts WHERE code LIKE ? ORDER BY code DESC LIMIT 1`,
    [like]
  );
  let next = 1;
  if (rows.length) {
    const tail = rows[0].code.slice(`PX-${datePart}-`.length);
    next = (parseInt(tail) || 0) + 1;
  }
  return `PX-${datePart}-${String(next).padStart(3, '0')}`;
}

async function transitionStatus(conn, id, fromStatus, toStatus, extraSet = {}, extraRaw = {}) {
  if (!canRepairTransition(fromStatus, toStatus)) {
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
    `UPDATE repair_orders SET ${setParts.join(', ')} WHERE id = ?`,
    values
  );
}

// Sync service_fee sang charge "Cong sua" (tuong tu pattern Cong lap).
// Goi sau moi lan service_fee thay doi.
async function syncServiceFeeCharge(conn, repairOrderId, serviceFee) {
  const fee = Math.max(0, Number(serviceFee) || 0);
  const [exist] = await conn.query(
    `SELECT id FROM repair_charges
       WHERE repair_order_id = ? AND kind = 'service' AND label = 'Công sửa' AND is_deleted = 0
       LIMIT 1`,
    [repairOrderId]
  );
  if (fee > 0) {
    if (exist.length) {
      await conn.query(
        `UPDATE repair_charges SET amount = ? WHERE id = ?`,
        [fee, exist[0].id]
      );
    } else {
      await conn.query(
        `INSERT INTO repair_charges (repair_order_id, kind, label, amount)
         VALUES (?, 'service', 'Công sửa', ?)`,
        [repairOrderId, fee]
      );
    }
  } else if (exist.length) {
    await conn.query(`UPDATE repair_charges SET is_deleted = 1 WHERE id = ?`, [exist[0].id]);
  }
}

// ---- GET / ---------------------------------------------------
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

    const where = ['r.is_deleted = 0'];
    const args = [];
    if (status && REPAIR_STATUSES.includes(status)) { where.push('r.status = ?'); args.push(status); }
    if (customerId)                                 { where.push('r.customer_id = ?'); args.push(customerId); }
    if (staffId)                                    { where.push('r.assigned_staff_id = ?'); args.push(staffId); }
    if (from)                                       { where.push('r.request_date >= ?'); args.push(from); }
    if (to)                                         { where.push('r.request_date <= ?'); args.push(to); }
    if (q) {
      where.push('(r.code LIKE ? OR r.license_plate LIKE ? OR r.imei_search LIKE ? OR r.device_name LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ? OR c.code LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like, like, like, like, like, like);
    }

    const whereSql = 'WHERE ' + where.join(' AND ');

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
         FROM repair_orders r
         LEFT JOIN customers c ON c.id = r.customer_id
         ${whereSql}`,
      args
    );

    const [rows] = await db.query(
      `SELECT
         r.id, r.code,
         r.customer_id, r.license_plate, r.device_name, r.imei_search,
         r.reason_text, r.note_text, r.address,
         r.assigned_staff_id, r.recovered_image_url, r.delivered_image_url,
         r.diagnose_text,
         r.service_fee, r.parts_total, r.total_amount, r.paid_amount,
         r.quoted_at, r.customer_sent_at, r.customer_decided_at,
         r.repairing_at, r.done_at, r.delivered_at,
         r.debt_carried_at, r.debt_settlement_id,
         r.status, r.request_date, r.creator_type, r.creator_id,
         c.code AS customer_code, c.full_name AS customer_name, c.phone AS customer_phone, c.type AS customer_type,
         s.full_name AS staff_name
       FROM repair_orders r
       LEFT JOIN customers c ON c.id = r.customer_id
       LEFT JOIN staff     s ON s.id = r.assigned_staff_id
       ${whereSql}
       ORDER BY r.id DESC
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
      `SELECT r.*,
              c.code AS customer_code, c.full_name AS customer_name,
              c.phone AS customer_phone, c.address AS customer_address, c.type AS customer_type,
              s.full_name AS staff_name, s.phone AS staff_phone
         FROM repair_orders r
         LEFT JOIN customers c ON c.id = r.customer_id
         LEFT JOIN staff     s ON s.id = r.assigned_staff_id
        WHERE r.id = ? AND r.is_deleted = 0`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay don sua chua' });
    const ro = rows[0];
    ro.bill_locked = isBillLocked(ro.status);

    const [items] = await db.query(
      `SELECT ri.id, ri.product_id, ri.qty, ri.unit_price, ri.imei, ri.note,
              p.code AS product_code, p.name AS product_name
         FROM repair_items ri
         LEFT JOIN products p ON p.id = ri.product_id
        WHERE ri.repair_order_id = ? AND ri.is_deleted = 0
        ORDER BY ri.id ASC`,
      [ro.id]
    );
    ro.items = items;

    const [charges] = await db.query(
      `SELECT id, kind, label, amount
         FROM repair_charges
        WHERE repair_order_id = ? AND is_deleted = 0
        ORDER BY id ASC`,
      [ro.id]
    );
    ro.charges = charges;

    const [receipts] = await db.query(
      `SELECT r.id, r.code, r.kind, r.reason_code, r.reason_text, r.created_at,
              r.is_voided, r.created_by_staff_id,
              s.full_name AS created_by_name
         FROM stock_receipts r
         LEFT JOIN staff s ON s.id = r.created_by_staff_id
        WHERE r.ref_repair_order_id = ?
        ORDER BY r.id DESC`,
      [ro.id]
    );
    for (const rec of receipts) {
      const [its] = await db.query(
        `SELECT ri.product_id, ri.qty, ri.imei_list, ri.note,
                p.code AS product_code, p.name AS product_name
           FROM stock_receipt_items ri
           LEFT JOIN products p ON p.id = ri.product_id
          WHERE ri.receipt_id = ?`,
        [rec.id]
      );
      rec.items = its;
    }
    ro.receipts = receipts;

    res.json(ro);
  } catch (err) { next(err); }
});

// ---- POST / --------------------------------------------------
// Body: { customer_id, license_plate?, device_name?, imei_search?, reason, note?, address? }
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
    if (!reason) throw httpErr(400, 'Thieu ly do sua chua');

    const licensePlate = req.body.license_plate ? String(req.body.license_plate).trim() : null;
    const deviceName   = req.body.device_name   ? String(req.body.device_name).trim()   : null;
    const imeiSearch   = req.body.imei_search   ? String(req.body.imei_search).trim()   : null;
    const note         = req.body.note          ? String(req.body.note).trim()          : null;
    const address      = req.body.address       ? String(req.body.address).trim()       : null;

    const adminId = req.user && req.user.sub ? req.user.sub : null;

    await conn.beginTransaction();

    const { result } = await insertRepairWithRetry(conn, (code) =>
      conn.query(
        `INSERT INTO repair_orders
           (code, customer_id,
            license_plate, device_name, imei_search,
            reason_text, note_text, address,
            status, request_date,
            creator_type, creator_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURDATE(), 'admin', ?)`,
        [
          code, customerId,
          licensePlate, deviceName, imeiSearch,
          reason, note, address,
          adminId,
        ]
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

// ---- PUT /:id ------------------------------------------------
// Sua metadata. Chan khi bill locked (done/delivering/completed) hoac terminal.
router.put('/:id', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const [exist] = await conn.query(
      `SELECT id, status FROM repair_orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!exist.length) throw httpErr(404, 'Khong tim thay don sua chua');
    if (TERMINAL_STATUSES.includes(exist[0].status)) {
      throw httpErr(409, 'Khong the sua khi don da ket thuc');
    }
    if (isBillLocked(exist[0].status)) {
      throw httpErr(409, 'Bill da khoa, khong sua duoc nua');
    }

    const updates = {};
    if (req.body.customer_id !== undefined) {
      const cid = Number(req.body.customer_id);
      if (!cid) throw httpErr(400, 'customer_id khong hop le');
      const [c] = await conn.query(`SELECT id FROM customers WHERE id = ? AND is_deleted = 0`, [cid]);
      if (!c.length) throw httpErr(404, 'Khach hang khong ton tai');
      updates.customer_id = cid;
    }
    if (req.body.license_plate !== undefined) updates.license_plate = req.body.license_plate ? String(req.body.license_plate).trim() : null;
    if (req.body.device_name   !== undefined) updates.device_name   = req.body.device_name   ? String(req.body.device_name).trim()   : null;
    if (req.body.imei_search   !== undefined) updates.imei_search   = req.body.imei_search   ? String(req.body.imei_search).trim()   : null;
    if (req.body.reason !== undefined) {
      const v = String(req.body.reason || '').trim();
      if (!v) throw httpErr(400, 'reason khong duoc rong');
      updates.reason_text = v;
    }
    if (req.body.note          !== undefined) updates.note_text     = req.body.note          ? String(req.body.note).trim()          : null;
    if (req.body.address       !== undefined) updates.address       = req.body.address       ? String(req.body.address).trim()       : null;
    if (req.body.diagnose_text !== undefined) updates.diagnose_text = req.body.diagnose_text ? String(req.body.diagnose_text).trim() : null;

    const cols = Object.keys(updates);
    if (!cols.length) return res.status(400).json({ error: 'Khong co truong de cap nhat' });

    await conn.beginTransaction();
    const setSql = cols.map(c => `${c} = ?`).join(', ');
    const values = cols.map(c => updates[c]);
    await conn.query(
      `UPDATE repair_orders SET ${setSql} WHERE id = ?`,
      [...values, id]
    );
    await conn.commit();

    const [rows] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
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
      `UPDATE repair_orders SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Khong tim thay don sua chua' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ---- POST /:id/assign ----------------------------------------
// Body: { staff_id }. Neu trang thai = 'pending' va co staff -> chuyen sang 'assigned'.
router.post('/:id/assign', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const staffId = req.body.staff_id ? Number(req.body.staff_id) : null;

    if (staffId) {
      const [s] = await conn.query(
        `SELECT id, role FROM staff WHERE id = ? AND is_deleted = 0`, [staffId]
      );
      if (!s.length || s[0].role !== 'kithuat') {
        throw httpErr(400, 'Nhan vien khong phai KTV hop le');
      }
    }

    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status FROM repair_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don sua chua');
    if (TERMINAL_STATUSES.includes(rows[0].status)) {
      throw httpErr(409, 'Khong the gan KTV cho don da ket thuc');
    }

    await conn.query(
      `UPDATE repair_orders SET assigned_staff_id = ? WHERE id = ?`,
      [staffId, id]
    );
    // Auto-transition pending -> assigned khi co KTV
    if (staffId && rows[0].status === 'pending') {
      await conn.query(`UPDATE repair_orders SET status = 'assigned' WHERE id = ?`, [id]);
    }
    await conn.commit();

    const [after] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- PUT /:id/items ------------------------------------------
// Replace toan bo items. Body: { items: [{product_id, qty, unit_price, imei?, note?}] }
// Chan khi bill locked.
router.put('/:id/items', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status FROM repair_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don sua chua');
    if (isBillLocked(rows[0].status)) throw httpErr(409, 'Bill da khoa, khong sua items');
    if (rows[0].status === 'cancelled') throw httpErr(409, 'Don da huy');

    // Soft delete items hien tai
    await conn.query(
      `UPDATE repair_items SET is_deleted = 1 WHERE repair_order_id = ?`, [id]
    );

    for (const raw of items) {
      const productId = Number(raw.product_id);
      const qty = Math.max(1, Number(raw.qty) || 1);
      const unitPrice = Math.max(0, Number(raw.unit_price) || 0);
      if (!productId) throw httpErr(400, 'Item thieu product_id');
      const imei = raw.imei ? String(raw.imei).trim() : null;
      const note = raw.note ? String(raw.note).trim() : null;
      await conn.query(
        `INSERT INTO repair_items (repair_order_id, product_id, qty, unit_price, imei, note)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, productId, qty, unitPrice, imei, note]
      );
    }

    await recalcRepairTotal(conn, id);
    await conn.commit();

    const [after] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- PUT /:id/charges ----------------------------------------
// Replace charges (TRU charge "Cong sua" — cai do dieu khien qua /service-fee).
// Body: { charges: [{kind, label, amount}] }
router.put('/:id/charges', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const charges = Array.isArray(req.body.charges) ? req.body.charges : [];

    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status FROM repair_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don sua chua');
    if (isBillLocked(rows[0].status)) throw httpErr(409, 'Bill da khoa, khong sua charges');
    if (rows[0].status === 'cancelled') throw httpErr(409, 'Don da huy');

    // Xoa moi charge tru "Cong sua" (giu nguyen sync)
    await conn.query(
      `UPDATE repair_charges SET is_deleted = 1
        WHERE repair_order_id = ?
          AND NOT (kind = 'service' AND label = 'Công sửa')`,
      [id]
    );

    for (const raw of charges) {
      const kind   = ['service', 'fee', 'discount'].includes(raw.kind) ? raw.kind : 'fee';
      const label  = String(raw.label || '').trim();
      const amount = Number(raw.amount) || 0;
      if (!label) throw httpErr(400, 'Charge thieu label');
      // Bo qua "Cong sua" — phai goi /service-fee
      if (kind === 'service' && label === 'Công sửa') continue;
      await conn.query(
        `INSERT INTO repair_charges (repair_order_id, kind, label, amount)
         VALUES (?, ?, ?, ?)`,
        [id, kind, label, amount]
      );
    }

    await recalcRepairTotal(conn, id);
    await conn.commit();

    const [after] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- PATCH /:id/service-fee ----------------------------------
// Body: { service_fee }. Sync sang charges "Cong sua".
router.patch('/:id/service-fee', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const fee = Math.max(0, Number(req.body.service_fee) || 0);

    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status FROM repair_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don sua chua');
    if (isBillLocked(rows[0].status)) throw httpErr(409, 'Bill da khoa, khong sua cong sua');
    if (rows[0].status === 'cancelled') throw httpErr(409, 'Don da huy');

    await conn.query(`UPDATE repair_orders SET service_fee = ? WHERE id = ?`, [fee, id]);
    await syncServiceFeeCharge(conn, id, fee);
    await recalcRepairTotal(conn, id);
    await conn.commit();

    const [after] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- POST /:id/send-customer ---------------------------------
// quoted -> awaiting_customer. Admin chot va gui khach.
router.post('/:id/send-customer', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status, total_amount FROM repair_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don sua chua');
    if (rows[0].total_amount <= 0) {
      throw httpErr(400, 'Bao gia chua co (chua nhap items hoac cong sua)');
    }
    await transitionStatus(conn, id, rows[0].status, 'awaiting_customer',
      {}, { customer_sent_at: 'NOW()' });
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- POST /:id/reopen-quote ----------------------------------
// awaiting_customer|rejected -> quoted (sua lai bao gia).
router.post('/:id/reopen-quote', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status FROM repair_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don sua chua');
    const cur = rows[0].status;
    if (!['awaiting_customer', 'rejected'].includes(cur)) {
      throw httpErr(409, `Chi mo lai bao gia khi don dang awaiting_customer hoac rejected (hien tai: ${cur})`);
    }
    await conn.query(`UPDATE repair_orders SET status = 'quoted' WHERE id = ?`, [id]);
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- POST /:id/release-stock ---------------------------------
// approved -> repairing. Tao stock_receipts xuat kho cho don SC.
// Body: { items: [{product_id, qty, imei_list?}], reason_text? }
// Tru product_stock; neu da gan KTV -> cong vao staff_holdings.
router.post('/:id/release-stock', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    // Cho phep xuat ke ca khi khong co items (don khong thay thiet bi) — tao phieu rong
    // de van co lich su va chuyen status. Chuan hoa items neu co.
    const lines = [];
    const seen = new Set();
    for (const raw of items) {
      const productId = Number(raw.product_id);
      const qty = Number(raw.qty);
      if (!productId) throw httpErr(400, 'Item thieu product_id');
      if (!qty || qty <= 0) throw httpErr(400, 'qty phai > 0');
      if (seen.has(productId)) throw httpErr(400, 'Moi san pham chi 1 dong');
      seen.add(productId);
      lines.push({
        product_id: productId,
        qty,
        imei_list: raw.imei_list ? String(raw.imei_list).trim() : null,
      });
    }

    await conn.beginTransaction();
    const [roRows] = await conn.query(
      `SELECT id, status, assigned_staff_id FROM repair_orders
        WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!roRows.length) throw httpErr(404, 'Khong tim thay don sua chua');
    if (roRows[0].status !== 'approved') {
      throw httpErr(409, `Chi xuat kho khi don dang approved (hien tai: ${roRows[0].status})`);
    }
    const assignedStaff = roRows[0].assigned_staff_id;

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

    const code = await genReceiptCode(conn);
    const adminId = req.user && req.user.sub ? req.user.sub : null;

    const [rIns] = await conn.query(
      `INSERT INTO stock_receipts
         (code, kind, reason_code, reason_text,
          ref_repair_order_id, ref_staff_id, created_by_staff_id)
       VALUES (?, 'out', 'repair_release', ?, ?, ?, ?)`,
      [code, req.body.reason_text || null, id, assignedStaff, adminId]
    );
    const receiptId = rIns.insertId;

    for (const l of lines) {
      await conn.query(
        `INSERT INTO stock_receipt_items (receipt_id, product_id, qty, imei_list)
         VALUES (?, ?, ?, ?)`,
        [receiptId, l.product_id, l.qty, l.imei_list]
      );
      await conn.query(
        `UPDATE product_stock SET quantity = quantity - ? WHERE product_id = ?`,
        [l.qty, l.product_id]
      );
      if (assignedStaff) {
        await conn.query(
          `INSERT INTO staff_holdings (staff_id, product_id, qty, first_held_at)
           VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)`,
          [assignedStaff, l.product_id, l.qty]
        );
      }
    }

    // Chuyen approved -> repairing
    await conn.query(
      `UPDATE repair_orders SET status = 'repairing', repairing_at = NOW() WHERE id = ?`,
      [id]
    );

    await conn.commit();

    res.json({
      receipt: { id: receiptId, code, kind: 'out', reason_code: 'repair_release', items: lines },
      assigned_to_staff: assignedStaff,
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- POST /:id/start-deliver ---------------------------------
// done -> delivering.
router.post('/:id/start-deliver', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status FROM repair_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don sua chua');
    await transitionStatus(conn, id, rows[0].status, 'delivering');
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- POST /:id/complete --------------------------------------
// delivering -> completed.
// Body: { delivered_image_url?, paid_amount? } (paid_amount neu co thi GHI DE)
router.post('/:id/complete', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const deliveredImage = req.body.delivered_image_url
      ? String(req.body.delivered_image_url).trim() : null;

    const updates = {};
    if (deliveredImage) updates.delivered_image_url = deliveredImage;
    if (req.body.paid_amount !== undefined) {
      updates.paid_amount = Math.max(0, Number(req.body.paid_amount) || 0);
    }

    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status FROM repair_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don sua chua');
    await transitionStatus(conn, id, rows[0].status, 'completed',
      updates, { delivered_at: 'NOW()' });
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- POST /:id/cancel ----------------------------------------
// Body: { reason? }. Khong cho cancel khi da done|delivering|completed.
router.post('/:id/cancel', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const reason = String(req.body.reason || '').trim();
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status, note_text FROM repair_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don sua chua');

    const newNote = reason
      ? (rows[0].note_text ? `${rows[0].note_text}\n[CANCEL] ${reason}` : `[CANCEL] ${reason}`)
      : rows[0].note_text;

    await transitionStatus(conn, id, rows[0].status, 'cancelled',
      newNote === rows[0].note_text ? {} : { note_text: newNote });
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- PATCH /:id/payment --------------------------------------
// Cap nhat paid_amount (ghi de). Body: { paid_amount }
router.patch('/:id/payment', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    if (req.body.paid_amount === undefined) {
      throw httpErr(400, 'Thieu paid_amount');
    }
    const paid = Math.max(0, Number(req.body.paid_amount) || 0);

    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, status FROM repair_orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don sua chua');
    if (rows[0].status === 'cancelled') {
      throw httpErr(409, 'Don da huy, khong cap nhat thanh toan');
    }
    await conn.query(`UPDATE repair_orders SET paid_amount = ? WHERE id = ?`, [paid, id]);
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

module.exports = router;
