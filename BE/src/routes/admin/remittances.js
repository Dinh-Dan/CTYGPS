// Admin: quan ly lo nop tien KTV (remittances) -- duyet / tu choi
const express = require('express');
const db      = require('../../db');
const { requireRole } = require('../../middleware/auth');

const router   = express.Router();
const adminOnly = requireRole('admin');

// GET /api/admin/remittances?status=pending&limit=100
router.get('/', async (req, res, next) => {
  try {
    const status    = req.query.status;          // pending | approved | rejected
    const limit     = Math.min(Number(req.query.limit) || 50, 500);
    const VALID_STS = ['pending', 'approved', 'rejected'];
    const whereSts  = VALID_STS.includes(status) ? 'AND r.status = ?' : '';
    const args      = VALID_STS.includes(status) ? [status, limit] : [limit];

    const [rows] = await db.query(
      `SELECT r.id, r.staff_id, r.amount, r.method, r.receipt_url, r.note,
              r.remitted_at, r.status, r.reject_reason, r.approved_at,
              r.advances_deducted_json,
              s.full_name  AS staff_name,
              s.username   AS staff_username,
              (SELECT COUNT(*) FROM collections c WHERE c.remittance_id = r.id) AS collection_count
         FROM remittances r
         JOIN staff s ON s.id = r.staff_id
        WHERE r.is_deleted = 0 ${whereSts}
        ORDER BY r.remitted_at DESC
        LIMIT ?`,
      args
    );

    res.json({
      items: rows.map(r => ({ ...r, amount: Number(r.amount) })),
    });
  } catch (err) { next(err); }
});

// PATCH /api/admin/remittances/:id/approve
// Admin xac nhan da nhan tien tu KTV -- cap nhat status, KHONG sua opening_balance
// (collections da remitted=1 tu luc KTV nop; opening_balance xu ly rieng khi admin settle)
router.patch('/:id/approve', adminOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    if (!id) { conn.release(); return res.status(400).json({ error: 'id khong hop le' }); }

    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT id, status FROM remittances WHERE id = ? AND is_deleted = 0 FOR UPDATE`,
      [id]
    );
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Khong tim thay lo nop' });
    }
    if (rows[0].status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ error: `Lo da o trang thai "${rows[0].status}", khong the duyet lai` });
    }

    await conn.query(
      `UPDATE remittances SET status = 'approved', approved_by = ?, approved_at = NOW() WHERE id = ?`,
      [req.user.sub, id]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// PATCH /api/admin/remittances/:id/reject
// Admin tu choi -- hoan lai collections ve chua nop de tiep tuc theo doi
router.patch('/:id/reject', adminOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id     = Number(req.params.id);
    const reason = String(req.body.reason || '').trim() || null;
    if (!id) { conn.release(); return res.status(400).json({ error: 'id khong hop le' }); }

    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT id, status FROM remittances WHERE id = ? AND is_deleted = 0 FOR UPDATE`,
      [id]
    );
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Khong tim thay lo nop' });
    }
    if (rows[0].status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ error: `Lo da o trang thai "${rows[0].status}", khong the tu choi` });
    }

    // Hoan lai collections -> hien thi lai trong tab KTV giu tien
    await conn.query(
      `UPDATE collections SET remitted = 0, remittance_id = NULL WHERE remittance_id = ?`,
      [id]
    );
    await conn.query(
      `UPDATE remittances SET status = 'rejected', reject_reason = ? WHERE id = ?`,
      [reason, id]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

module.exports = router;
