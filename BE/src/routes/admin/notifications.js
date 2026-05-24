// /api/admin/notifications
// 2 he thong song song:
//   1. Badge sidebar (cu): GET / + POST /mark-all-seen
//      Dem so muc "chua xem" theo seen_at NULL tren orders/customers/debts.
//   2. Feed thong bao realtime (moi): GET /feed + ...
//      Lay tu bang notifications (text + link_url, click vao mo dung don).

const express = require('express');
const db = require('../../db');

const router = express.Router();

// ==========================================================
// Badge sidebar (cu)
// ==========================================================

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM orders
           WHERE seen_at IS NULL AND is_deleted = 0
             AND status IN ('pending','confirmed','in_progress')) AS orders,
        (SELECT COUNT(*) FROM customers
           WHERE seen_at IS NULL AND is_deleted = 0) AS customers,
        (SELECT COUNT(DISTINCT customer_id) FROM (
           SELECT id AS customer_id FROM customers
            WHERE is_deleted = 0 AND opening_balance > 0
           UNION
           SELECT customer_id FROM orders
            WHERE is_deleted = 0
              AND debt_carried_at IS NULL
              AND status IN ('customer_owes','pending_admin_confirm','staff_owes','in_progress','done')
              AND DATEDIFF(NOW(), COALESCE(confirmed_at, NOW())) >= 7
         ) t) AS debts,
        (SELECT COUNT(*) FROM orders
           WHERE tech_commission_requested_at IS NOT NULL
             AND tech_commission_approved_at  IS NULL
             AND is_deleted = 0) +
        (SELECT COUNT(*) FROM order_staff_commissions sc
           JOIN orders o ON o.id = sc.order_id AND o.is_deleted = 0
          WHERE sc.approved_at IS NULL AND sc.is_deleted = 0
            AND sc.requested_at IS NOT NULL) AS commissions,
        (SELECT COUNT(*) FROM staff_receipts
           WHERE reviewed = 0 AND is_deleted = 0) AS staff_receipts
    `);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /api/admin/notifications/mark-all-seen
// Body: { module: 'orders' | 'customers' }
router.post('/mark-all-seen', async (req, res, next) => {
  try {
    const moduleMap = {
      orders:    'orders',
      customers: 'customers',
    };
    const table = moduleMap[req.body.module];
    if (!table) return res.status(400).json({ error: 'module khong hop le' });
    await db.query(
      `UPDATE ${table} SET seen_at = NOW() WHERE seen_at IS NULL AND is_deleted = 0`
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ==========================================================
// Feed thong bao realtime (moi)
// ==========================================================

// GET /feed?limit=50 — danh sach thong bao gan nhat (chua doc + da doc)
router.get('/feed', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const [rows] = await db.query(
      `SELECT id, type, title, message, link_url,
              ref_order_id, ref_customer_id, ref_staff_id,
              is_read, read_at, created_at
         FROM notifications
        WHERE is_deleted = 0
        ORDER BY id DESC
        LIMIT ?`,
      [limit]
    );
    const [cnt] = await db.query(
      `SELECT COUNT(*) AS unread FROM notifications
        WHERE is_deleted = 0 AND is_read = 0`
    );
    res.json({ items: rows, unread: Number(cnt[0].unread) || 0 });
  } catch (err) { next(err); }
});

// GET /daily-summary — thong ke tong quan trong ngay
router.get('/daily-summary', async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM orders
           WHERE DATE(created_at) = CURDATE() AND is_deleted = 0) AS orders_today,
        (SELECT COUNT(*) FROM orders
           WHERE DATE(created_at) = CURDATE() AND status = 'pending' AND is_deleted = 0) AS orders_pending,
        (SELECT COUNT(*) FROM orders
           WHERE DATE(created_at) = CURDATE() AND status = 'confirmed' AND is_deleted = 0) AS orders_confirmed,
        (SELECT COUNT(*) FROM orders
           WHERE DATE(created_at) = CURDATE() AND status = 'in_progress' AND is_deleted = 0) AS orders_in_progress,
        (SELECT COUNT(*) FROM orders
           WHERE DATE(created_at) = CURDATE() AND status = 'done' AND is_deleted = 0) AS orders_done,
        (SELECT COUNT(*) FROM orders
           WHERE DATE(created_at) = CURDATE() AND status = 'cancelled' AND is_deleted = 0) AS orders_cancelled,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders
           WHERE DATE(created_at) = CURDATE() AND status != 'cancelled' AND is_deleted = 0) AS orders_total_amount,
        (SELECT COALESCE(SUM(paid_amount), 0) FROM orders
           WHERE DATE(created_at) = CURDATE() AND status != 'cancelled' AND is_deleted = 0) AS orders_paid_amount,
        (SELECT COUNT(*) FROM stock_receipts
           WHERE DATE(created_at) = CURDATE() AND kind = 'in'  AND is_voided = 0) AS stock_in_today,
        (SELECT COUNT(*) FROM stock_receipts
           WHERE DATE(created_at) = CURDATE() AND kind = 'out' AND is_voided = 0) AS stock_out_today,
        (SELECT COUNT(*) FROM payment_requests
           WHERE status = 'pending' AND is_deleted = 0) AS payment_requests_pending,
        (SELECT COUNT(*) FROM staff_receipts
           WHERE reviewed = 0 AND is_deleted = 0) AS receipts_unreviewed,
        (SELECT COALESCE(SUM(amount), 0) FROM staff_receipts
           WHERE reviewed = 0 AND is_deleted = 0) AS receipts_amount
    `);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// GET /feed/unread-count
router.get('/feed/unread-count', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS unread FROM notifications
        WHERE is_deleted = 0 AND is_read = 0`
    );
    res.json({ unread: Number(rows[0].unread) || 0 });
  } catch (err) { next(err); }
});

// POST /feed/:id/read — danh dau 1 thong bao da doc
router.post('/feed/:id/read', async (req, res, next) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = 1, read_at = NOW()
        WHERE id = ? AND is_read = 0 AND is_deleted = 0`,
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /feed/read-all — danh dau toan bo da doc
router.post('/feed/read-all', async (req, res, next) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = 1, read_at = NOW()
        WHERE is_deleted = 0 AND is_read = 0`
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
