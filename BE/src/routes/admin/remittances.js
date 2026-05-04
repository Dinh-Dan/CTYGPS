// /api/admin/remittances — admin verify lo nop tien cua KTV
// Tat ca route deu yeu cau role admin (da check o admin.js cha)
//
// Endpoints:
//   GET    /              -> list (filter status, staff_id, q)
//   GET    /:id           -> detail + danh sach collection thuoc lo
//   PATCH  /:id/approve   -> duyet
//   PATCH  /:id/reject    -> tu choi (kem reason)

const express = require('express');
const db = require('../../db');
const { recalcOrderFinalStatus } = require('../../utils/orderState');

const router = express.Router();

// Lay tat ca order_id co collection thuoc lo nop nay -> dung de recalc status sau approve/reject.
async function getOrderIdsOfRemittance(conn, remittanceId) {
  const [rows] = await conn.query(
    `SELECT DISTINCT order_id
       FROM collections
      WHERE remittance_id = ?`,
    [remittanceId]
  );
  return rows.map(r => r.order_id);
}

const STATUSES = ['pending', 'approved', 'rejected'];

// ---- GET /api/admin/remittances -------------------------------
router.get('/', async (req, res, next) => {
  try {
    const status   = req.query.status;
    const staffId  = req.query.staff_id ? Number(req.query.staff_id) : null;
    const q        = (req.query.q || '').trim();
    const page     = Math.max(1, parseInt(req.query.page) || 1);
    const limit    = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset   = (page - 1) * limit;

    const where = ['r.is_deleted = 0'];
    const args = [];
    if (status && STATUSES.includes(status)) { where.push('r.status = ?'); args.push(status); }
    if (staffId)                              { where.push('r.staff_id = ?'); args.push(staffId); }
    if (q) {
      where.push('(s.full_name LIKE ? OR s.username LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like);
    }
    const whereSql = 'WHERE ' + where.join(' AND ');

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
         FROM remittances r
         JOIN staff s ON s.id = r.staff_id
         ${whereSql}`,
      args
    );

    const [rows] = await db.query(
      `SELECT
         r.id, r.staff_id, r.amount, r.method, r.receipt_url, r.note,
         r.remitted_at, r.approved_by, r.approved_at, r.reject_reason, r.status,
         s.full_name AS staff_name, s.username AS staff_username, s.area AS staff_area,
         a.full_name AS approver_name,
         (SELECT COUNT(*) FROM collections c WHERE c.remittance_id = r.id) AS collection_count
       FROM remittances r
       JOIN staff s ON s.id = r.staff_id
       LEFT JOIN staff a ON a.id = r.approved_by
       ${whereSql}
       ORDER BY r.id DESC
       LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    res.json({ items: rows, total: countRows[0].total, page, limit });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/remittances/:id ---------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query(
      `SELECT r.*,
              s.full_name AS staff_name, s.username AS staff_username, s.area AS staff_area,
              a.full_name AS approver_name
         FROM remittances r
         JOIN staff s ON s.id = r.staff_id
         LEFT JOIN staff a ON a.id = r.approved_by
        WHERE r.id = ? AND r.is_deleted = 0`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay lo nop' });

    const [collections] = await db.query(
      `SELECT c.id, c.order_id, c.amount, c.method, c.collected_at,
              o.code AS order_code,
              cust.full_name AS customer_name
         FROM collections c
         JOIN orders o ON o.id = c.order_id
         LEFT JOIN customers cust ON cust.id = o.customer_id
        WHERE c.remittance_id = ?`,
      [id]
    );
    res.json({ ...rows[0], collections });
  } catch (err) { next(err); }
});

// ---- PATCH /api/admin/remittances/:id/approve -----------------
// Approve: tien KTV nop chinh thuc vao quy. unremitted cua cac don lien quan giam ve 0
// -> recalc status (staff_owes -> done, hoac customer_owes neu paid van < total).
router.patch('/:id/approve', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    await conn.beginTransaction();
    const [exist] = await conn.query(
      `SELECT id, status FROM remittances WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!exist.length) { await conn.rollback(); return res.status(404).json({ error: 'Khong tim thay lo nop' }); }
    if (exist[0].status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ error: 'Lo nop khong o trang thai pending' });
    }

    const orderIds = await getOrderIdsOfRemittance(conn, id);

    await conn.query(
      `UPDATE remittances
         SET status = 'approved', approved_by = ?, approved_at = NOW(), reject_reason = NULL
       WHERE id = ?`,
      [req.user.sub, id]
    );

    for (const oid of orderIds) await recalcOrderFinalStatus(conn, oid);

    await conn.commit();
    const [rows] = await conn.query(`SELECT * FROM remittances WHERE id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ---- PATCH /api/admin/remittances/:id/reject ------------------
// Body: { reason }
router.patch('/:id/reject', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const reason = String(req.body.reason || '').trim() || null;

    const [exist] = await conn.query(
      `SELECT id, status FROM remittances WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!exist.length) return res.status(404).json({ error: 'Khong tim thay lo nop' });
    if (exist[0].status !== 'pending') {
      return res.status(400).json({ error: 'Lo nop khong o trang thai pending' });
    }

    await conn.beginTransaction();

    // Lay danh sach order_id TRUOC khi reset remittance_id (sau khi reset thi join se mat)
    const orderIds = await getOrderIdsOfRemittance(conn, id);

    await conn.query(
      `UPDATE remittances
         SET status = 'rejected', approved_by = ?, approved_at = NOW(), reject_reason = ?
       WHERE id = ?`,
      [req.user.sub, reason, id]
    );
    // Tha cac collection trong lo bi reject ve trang thai chua nop
    await conn.query(
      `UPDATE collections SET remitted = 0, remittance_id = NULL
        WHERE remittance_id = ?`,
      [id]
    );

    // unremitted cua cac don tang lai -> recalc (done -> staff_owes)
    for (const oid of orderIds) await recalcOrderFinalStatus(conn, oid);

    await conn.commit();

    const [rows] = await conn.query(`SELECT * FROM remittances WHERE id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
