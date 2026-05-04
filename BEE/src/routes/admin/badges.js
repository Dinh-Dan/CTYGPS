// /api/admin/badges — quan li lam phu hieu xe
// Yeu cau role admin (check o admin.js cha)

const express = require('express');
const db = require('../../db');
const { recalcOrderTotal, insertOrderWithRetry } = require('../../utils/orderState');

const router = express.Router();

// Sync 1 order_charge "Phi phu hieu xe" cho order shell cua badge.
// Goi sau khi tao/sua fee_amount. Chap nhan transaction conn (caller mo).
async function syncBadgeFeeCharge(conn, orderId, plate, fee) {
  await conn.query(
    `UPDATE order_charges SET is_deleted = 1
      WHERE order_id = ? AND kind = 'fee' AND is_deleted = 0`,
    [orderId]
  );
  if (Number(fee) > 0) {
    await conn.query(
      `INSERT INTO order_charges (order_id, kind, label, amount)
       VALUES (?, 'fee', ?, ?)`,
      [orderId, `Phi phu hieu xe ${plate || ''}`.trim(), Number(fee)]
    );
  }
  await recalcOrderTotal(conn, orderId);
}

const STATUSES = ['pending_review','submitted','approved','rejected','delivered','cancelled'];
const VEHICLE_TYPES = ['truck_under_3.5t','truck_over_3.5t','passenger','contract','taxi','other'];

const TRANSITIONS = {
  pending_review: ['submitted','cancelled'],
  submitted:      ['approved','rejected','cancelled'],
  approved:       ['delivered','cancelled'],
  rejected:       ['submitted','cancelled'],
  delivered:      [],
  cancelled:      [],
};
function canTransition(from, to) { return (TRANSITIONS[from] || []).includes(to); }

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

async function genBadgeCode(conn) {
  const q = conn || db;
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `PH-${dd}${mm}-`;
  const [rows] = await q.query(
    `SELECT code FROM badges WHERE code LIKE ? ORDER BY code DESC LIMIT 1`,
    [`${prefix}%`]
  );
  let next = 1;
  if (rows.length) {
    const last = rows[0].code.slice(prefix.length);
    next = (parseInt(last) || 0) + 1;
  }
  return prefix + String(next).padStart(3, '0');
}

// ---- GET / -----------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const status = req.query.status;
    const q = (req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const where = ['b.is_deleted = 0'];
    const args = [];
    if (status && STATUSES.includes(status)) { where.push('b.status = ?'); args.push(status); }
    if (q) {
      where.push('(b.code LIKE ? OR b.vehicle_plate LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like, like, like);
    }
    const whereSql = 'WHERE ' + where.join(' AND ');

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
         FROM badges b LEFT JOIN customers c ON c.id = b.customer_id
         ${whereSql}`, args
    );
    const [rows] = await db.query(
      `SELECT b.*,
              c.code AS customer_code, c.full_name AS customer_name, c.phone AS customer_phone,
              d.code AS dealer_code, d.full_name AS dealer_name
         FROM badges b
         LEFT JOIN customers c ON c.id = b.customer_id
         LEFT JOIN customers d ON d.id = b.dealer_id
         ${whereSql}
         ORDER BY b.id DESC
         LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );
    res.json({ items: rows, total: countRows[0].total, page, limit });
  } catch (err) { next(err); }
});

// ---- GET /:id --------------------------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query(
      `SELECT b.*,
              c.code AS customer_code, c.full_name AS customer_name, c.phone AS customer_phone,
              d.code AS dealer_code, d.full_name AS dealer_name
         FROM badges b
         LEFT JOIN customers c ON c.id = b.customer_id
         LEFT JOIN customers d ON d.id = b.dealer_id
        WHERE b.id = ? AND b.is_deleted = 0`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay phu hieu' });
    const [att] = await db.query(
      `SELECT id, url, caption, kind, uploaded_at
         FROM badge_attachments WHERE badge_id = ? ORDER BY id`, [id]
    );
    res.json({ ...rows[0], attachments: att });
  } catch (err) { next(err); }
});

// ---- POST / ----------------------------------------------------
// Body: { customer_id, dealer_id?, vehicle_plate, vehicle_type, fee_amount?, note?, status? }
router.post('/', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const customerId = Number(req.body.customer_id);
    if (!customerId) throw httpErr(400, 'Thieu customer_id');
    const plate = String(req.body.vehicle_plate || '').trim();
    if (!plate) throw httpErr(400, 'Thieu bien so xe');
    const vType = req.body.vehicle_type || 'truck_under_3.5t';
    if (!VEHICLE_TYPES.includes(vType)) throw httpErr(400, 'vehicle_type khong hop le');

    const status = req.body.status || 'pending_review';
    if (!['pending_review','submitted'].includes(status)) {
      throw httpErr(400, 'Chi cho phep tao voi status pending_review hoac submitted');
    }

    await conn.beginTransaction();

    // 1. Tao order shell (service_kind='badge', status='new' vi admin chu dong tao)
    const adminId = req.user && req.user.sub ? req.user.sub : null;
    const { result: orderRes } = await insertOrderWithRetry(conn, (oCode) =>
      conn.query(
        `INSERT INTO orders
          (code, customer_id, dealer_id, total_amount, subtotal, paid_amount, payment_method,
           status, service_kind, vehicle_plate, note,
           creator_type, creator_id, confirmed_at, confirmed_by)
         VALUES (?, ?, ?, 0, 0, 0, 'cash',
                 'new', 'badge', ?, ?, 'admin', ?, NOW(), ?)`,
        [oCode, customerId, req.body.dealer_id || null,
         plate, req.body.note || null, adminId, adminId]
      ).then(([r]) => r)
    );
    const orderId = orderRes.insertId;

    // 2. Tao badge gan voi order
    const code = await genBadgeCode(conn);
    const fee = Number(req.body.fee_amount) || 0;
    const [r] = await conn.query(
      `INSERT INTO badges
        (code, customer_id, dealer_id, order_id, vehicle_plate, vehicle_type,
         status, fee_amount, paid_amount, note,
         creator_type, creator_id, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'admin', ?, ?)`,
      [
        code, customerId, req.body.dealer_id || null, orderId, plate, vType,
        status, fee,
        req.body.note || null,
        adminId,
        status === 'submitted' ? new Date() : null,
      ]
    );

    // 3. Day fee_amount vao order_charges + recalc total
    if (fee > 0) await syncBadgeFeeCharge(conn, orderId, plate, fee);

    await conn.commit();
    const [rows] = await conn.query(`SELECT * FROM badges WHERE id = ?`, [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- PUT /:id (metadata) ---------------------------------------
router.put('/:id', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const [exist] = await conn.query(
      `SELECT id, order_id, vehicle_plate, fee_amount FROM badges WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!exist.length) { conn.release(); return res.status(404).json({ error: 'Khong tim thay phu hieu' }); }

    const updates = {};
    if (req.body.vehicle_plate !== undefined) updates.vehicle_plate = String(req.body.vehicle_plate).trim();
    if (req.body.vehicle_type !== undefined) {
      if (!VEHICLE_TYPES.includes(req.body.vehicle_type)) throw httpErr(400, 'vehicle_type khong hop le');
      updates.vehicle_type = req.body.vehicle_type;
    }
    if (req.body.fee_amount !== undefined)  updates.fee_amount = Number(req.body.fee_amount) || 0;
    if (req.body.paid_amount !== undefined) updates.paid_amount = Number(req.body.paid_amount) || 0;
    if (req.body.note !== undefined)        updates.note = req.body.note || null;

    const cols = Object.keys(updates);
    if (!cols.length) { conn.release(); return res.status(400).json({ error: 'Khong co truong de cap nhat' }); }

    await conn.beginTransaction();
    const setSql = cols.map(c => `${c} = ?`).join(', ');
    await conn.query(`UPDATE badges SET ${setSql} WHERE id = ?`, [...cols.map(c => updates[c]), id]);

    // Sync order_charge neu fee/plate thay doi va co order_id
    if (exist[0].order_id && (updates.fee_amount !== undefined || updates.vehicle_plate !== undefined)) {
      const plate = updates.vehicle_plate ?? exist[0].vehicle_plate;
      const fee = updates.fee_amount ?? exist[0].fee_amount;
      await syncBadgeFeeCharge(conn, exist[0].order_id, plate, fee);
    }
    // Sync paid_amount sang orders neu duoc cap nhat thu cong
    if (exist[0].order_id && updates.paid_amount !== undefined) {
      await conn.query(
        `UPDATE orders SET paid_amount = ? WHERE id = ?`,
        [updates.paid_amount, exist[0].order_id]
      );
    }
    await conn.commit();

    const [rows] = await conn.query(`SELECT * FROM badges WHERE id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- POST /:id/submit (chuyen pending_review -> submitted) -----
router.post('/:id/submit', async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query(`SELECT status FROM badges WHERE id = ? AND is_deleted = 0`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay phu hieu' });
    if (!canTransition(rows[0].status, 'submitted')) {
      throw httpErr(409, `Khong the chuyen ${rows[0].status} -> submitted`);
    }
    await db.query(`UPDATE badges SET status='submitted', submitted_at=NOW() WHERE id=?`, [id]);
    const [out] = await db.query(`SELECT * FROM badges WHERE id = ?`, [id]);
    res.json(out[0]);
  } catch (err) { next(err); }
});

// ---- POST /:id/result (so GTVT co ket qua) ---------------------
// Body: { result: 'approved'|'rejected', reject_reason? }
router.post('/:id/result', async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = req.body.result;
    if (!['approved','rejected'].includes(result)) throw httpErr(400, "result phai 'approved' hoac 'rejected'");
    const [rows] = await db.query(`SELECT status FROM badges WHERE id = ? AND is_deleted = 0`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay phu hieu' });
    if (!canTransition(rows[0].status, result)) {
      throw httpErr(409, `Khong the chuyen ${rows[0].status} -> ${result}`);
    }
    await db.query(
      `UPDATE badges SET status=?, result_at=NOW(), reject_reason=? WHERE id=?`,
      [result, result === 'rejected' ? (req.body.reject_reason || null) : null, id]
    );
    const [out] = await db.query(`SELECT * FROM badges WHERE id = ?`, [id]);
    res.json(out[0]);
  } catch (err) { next(err); }
});

// ---- POST /:id/deliver -----------------------------------------
router.post('/:id/deliver', async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query(`SELECT status, order_id FROM badges WHERE id = ? AND is_deleted = 0`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay phu hieu' });
    if (!canTransition(rows[0].status, 'delivered')) {
      throw httpErr(409, `Khong the chuyen ${rows[0].status} -> delivered`);
    }
    await db.query(`UPDATE badges SET status='delivered', delivered_at=NOW() WHERE id=?`, [id]);
    if (rows[0].order_id) {
      await db.query(
        `UPDATE orders SET status='done' WHERE id=? AND status NOT IN ('done','cancelled')`,
        [rows[0].order_id]
      );
    }
    const [out] = await db.query(`SELECT * FROM badges WHERE id = ?`, [id]);
    res.json(out[0]);
  } catch (err) { next(err); }
});

// ---- POST /:id/cancel ------------------------------------------
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const id = req.params.id;
    const reason = String(req.body.reason || '').trim();
    const [rows] = await db.query(`SELECT status, note, order_id FROM badges WHERE id = ? AND is_deleted = 0`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay phu hieu' });
    if (!canTransition(rows[0].status, 'cancelled')) {
      throw httpErr(409, `Khong the huy o trang thai ${rows[0].status}`);
    }
    const newNote = reason
      ? (rows[0].note ? rows[0].note + '\n' : '') + `[CANCEL] ${reason}`
      : rows[0].note;
    await db.query(`UPDATE badges SET status='cancelled', note=? WHERE id=?`, [newNote, id]);
    if (rows[0].order_id) {
      await db.query(
        `UPDATE orders SET status='cancelled' WHERE id=? AND status<>'done'`,
        [rows[0].order_id]
      );
    }
    const [out] = await db.query(`SELECT * FROM badges WHERE id = ?`, [id]);
    res.json(out[0]);
  } catch (err) { next(err); }
});

// ---- POST /:id/mark-paid ---------------------------------------
router.post('/:id/mark-paid', async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query(
      `SELECT fee_amount, paid_amount, order_id FROM badges WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay phu hieu' });
    const o = rows[0];
    const remaining = Number(o.fee_amount) - Number(o.paid_amount);
    if (remaining <= 0) throw httpErr(400, 'Da thanh toan du');
    let amount = req.body.amount !== undefined ? Number(req.body.amount) : remaining;
    if (amount > remaining) amount = remaining;
    await db.query(`UPDATE badges SET paid_amount = paid_amount + ? WHERE id=?`, [amount, id]);
    if (o.order_id) {
      await db.query(
        `UPDATE orders SET paid_amount = LEAST(total_amount, paid_amount + ?) WHERE id=?`,
        [amount, o.order_id]
      );
    }
    const [out] = await db.query(`SELECT * FROM badges WHERE id = ?`, [id]);
    res.json(out[0]);
  } catch (err) { next(err); }
});

// ---- DELETE /:id (soft) ----------------------------------------
router.delete('/:id', async (req, res, next) => {
  try {
    const [b] = await db.query(`SELECT order_id FROM badges WHERE id=? AND is_deleted=0`, [req.params.id]);
    if (!b.length) return res.status(404).json({ error: 'Khong tim thay phu hieu' });
    await db.query(`UPDATE badges SET is_deleted=1 WHERE id=?`, [req.params.id]);
    if (b[0].order_id) {
      await db.query(`UPDATE orders SET is_deleted=1 WHERE id=?`, [b[0].order_id]);
    }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
