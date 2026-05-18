// /api/admin/reports — bao cao tong hop
// Tat ca route deu yeu cau role admin (da check o admin.js cha)
//
// Endpoints:
//   GET /overview-kpis         -> KPI tong hop cho dashboard (1 call thay nhieu call)
//   GET /customer-debts        -> khach con no    (orders co total > paid + unremitted + admin_pending)
//   GET /staff-debts           -> KTV con giu     (collections.remitted = 0)
//   GET /admin-pending-debts   -> admin can xac nhan (order_payments source='admin_pending', confirmed=0)
//   GET /revenue               -> doanh thu theo ngay/thang
//   GET /top-products          -> top san pham
//   GET /orders-by-status      -> phan bo status
//   GET /orders-by-service-kind-> phan bo loai dich vu

const express = require('express');
const db = require('../../db');

const router = express.Router();

const COMPLETED_COND = 'o.completed_at IS NOT NULL';

// ---- GET /api/admin/reports/overview-kpis ---------------------
// Tong hop KPI cho dashboard: 1 call thay vi nhieu call FE rieng le.
// Query 1: doanh thu thuc (filter by paid_at)
// Query 2: so don + no tam tinh (filter by confirmed_at)
// Query 3: tong cong no khach hien tai (no date filter)
// Query 4: tong tien KTV chua nop hien tai (no date filter)
// Query 5: so khoans thu admin_pending chua confirm
// INDEX goi y: orders(confirmed_at, is_deleted), order_payments(paid_at, confirmed, is_deleted)
router.get('/overview-kpis', async (req, res, next) => {
  try {
    const from = req.query.from || null;
    const to   = req.query.to   || null;

    // -- Revenue query (filter by paid_at) --
    const payArgs = [];
    const payWhere = ['p.is_deleted = 0', 'p.confirmed = 1'];
    if (from) { payWhere.push('DATE(p.paid_at) >= ?'); payArgs.push(from); }
    if (to)   { payWhere.push('DATE(p.paid_at) <= ?'); payArgs.push(to); }

    // -- Orders query (filter by confirmed_at) --
    const ordArgs = [];
    const ordWhere = ['o.is_deleted = 0'];
    if (from) { ordWhere.push('DATE(o.confirmed_at) >= ?'); ordArgs.push(from); }
    if (to)   { ordWhere.push('DATE(o.confirmed_at) <= ?'); ordArgs.push(to); }

    const [
      [revRows],
      [ordRows],
      [custDebtRows],
      [staffRows],
      [pendRows],
    ] = await Promise.all([
      // 1. Tong tien da thu / hoan trong ky
      db.query(
        `SELECT
           COALESCE(SUM(CASE WHEN p.source != 'refund' THEN p.amount ELSE 0 END), 0) AS paid_amount,
           COALESCE(SUM(CASE WHEN p.source = 'refund'  THEN p.amount ELSE 0 END), 0) AS refund_amount
         FROM order_payments p
         WHERE ${payWhere.join(' AND ')}`,
        payArgs
      ),
      // 2. So don + con no (tinh gop, khong tru unremitted/admin_pending de don gian KPI)
      db.query(
        `SELECT
           COUNT(*) AS total_orders,
           SUM(CASE WHEN o.status IN ('pending','confirmed') THEN 1 ELSE 0 END)  AS new_orders,
           SUM(CASE WHEN o.status = 'in_progress' THEN 1 ELSE 0 END)             AS in_progress_orders,
           COALESCE(SUM(GREATEST(o.total_amount - o.paid_amount, 0)), 0)          AS period_remaining
         FROM orders o
         WHERE ${ordWhere.join(' AND ')}`,
        ordArgs
      ),
      // 3. Tong cong no khach (hien tai, khong loc ngay)
      db.query(
        `SELECT
           COALESCE(SUM(c.opening_balance), 0) AS opening_total,
           COUNT(CASE WHEN c.opening_balance > 0 THEN 1 END) AS opening_count
         FROM customers c WHERE c.is_deleted = 0`
      ),
      // 4. Tong tien KTV chua nop (hien tai)
      db.query(
        `SELECT COALESCE(SUM(col.amount), 0) AS staff_unremitted,
                COUNT(DISTINCT col.staff_id) AS staff_count
         FROM collections col
         WHERE col.remitted = 0 AND col.is_deleted = 0`
      ),
      // 5. So khoans admin_pending chua confirm
      db.query(
        `SELECT COUNT(*) AS pending_count,
                COALESCE(SUM(p.amount), 0) AS pending_amount
         FROM order_payments p
         WHERE p.source = 'admin_pending' AND p.confirmed = 0 AND p.is_deleted = 0`
      ),
    ]);

    // Tong cong no don hien tai (query rieng vi correlated subquery nang hon)
    const [[orderDebtRow]] = await db.query(
      `SELECT COALESCE(SUM(GREATEST(
         o.total_amount - o.paid_amount
         - COALESCE((SELECT SUM(c2.amount) FROM collections c2
                      WHERE c2.order_id = o.id AND c2.remitted = 0 AND c2.is_deleted = 0), 0)
         - COALESCE((SELECT SUM(p2.amount) FROM order_payments p2
                      WHERE p2.order_id = o.id AND p2.source = 'admin_pending'
                            AND p2.confirmed = 0 AND p2.is_deleted = 0), 0)
       , 0)), 0) AS order_debt
       FROM orders o
       WHERE o.is_deleted = 0 AND o.debt_carried_at IS NULL
         AND o.status NOT IN ('pending','cancelled')
         AND o.payment_status != 'paid'`
    );

    const rev  = revRows[0]      || {};
    const ord  = ordRows[0]      || {};
    const cust = custDebtRows[0] || {};
    const staf = staffRows[0]    || {};
    const pend = pendRows[0]     || {};

    const paid_amount   = Number(rev.paid_amount   || 0);
    const refund_amount = Number(rev.refund_amount || 0);
    const net_amount    = paid_amount - refund_amount;
    const total_customer_debt = Number(cust.opening_total || 0) + Number(orderDebtRow.order_debt || 0);

    res.json({
      // Doanh thu ky nay (theo paid_at)
      net_amount,
      paid_amount,
      refund_amount,
      // Cong no hien tai (current state)
      total_customer_debt,
      staff_unremitted: Number(staf.staff_unremitted || 0),
      staff_count:      Number(staf.staff_count      || 0),
      // So don trong ky (theo confirmed_at)
      total_orders:        Number(ord.total_orders        || 0),
      new_orders:          Number(ord.new_orders          || 0),
      in_progress_orders:  Number(ord.in_progress_orders  || 0),
      period_remaining:    Number(ord.period_remaining    || 0),
      // Admin pending
      admin_pending_count:  Number(pend.pending_count  || 0),
      admin_pending_amount: Number(pend.pending_amount || 0),
      from, to,
    });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/reports/customer-debts --------------------
// Tinh dong: customers.opening_balance + SUM don chua ket (debt_carried_at IS NULL)
//            (total - paid - unremitted - admin_pending). HAVING > 0 GROUP BY customer.
// Don da ket vao phieu tat toan (debt_carried_at IS NOT NULL) -> KHONG tinh, phan no
// con thieu da chuyen vao opening_balance roi.
// Filter ?from=&to= theo o.confirmed_at (don duoc chot trong khoang thoi gian).
router.get('/customer-debts', async (req, res, next) => {
  try {
    const from = req.query.from || null;
    const to   = req.query.to   || null;

    const where = [
      'o.is_deleted = 0',
      'o.debt_carried_at IS NULL',
      `o.status NOT IN ('pending','cancelled')`,
      `o.payment_status != 'paid'`,
    ];
    const args = [];
    if (from) { where.push('DATE(o.confirmed_at) >= ?'); args.push(from); }
    if (to)   { where.push('DATE(o.confirmed_at) <= ?'); args.push(to); }

    const [rows] = await db.query(
      `SELECT
         c.id, c.code, c.full_name, c.phone, c.type, c.company_name,
         c.opening_balance,
         COALESCE(d.debt_order_count, 0) AS debt_order_count,
         COALESCE(d.order_debt, 0)       AS order_debt,
         (c.opening_balance + COALESCE(d.order_debt, 0)) AS debt
       FROM customers c
       LEFT JOIN (
         SELECT
           o.customer_id,
           COUNT(DISTINCT o.id) AS debt_order_count,
           SUM(GREATEST(
             o.total_amount - o.paid_amount
             - COALESCE((
                 SELECT SUM(col.amount) FROM collections col
                  WHERE col.order_id = o.id AND col.remitted = 0 AND col.is_deleted = 0
               ), 0)
             - COALESCE((
                 SELECT SUM(p.amount) FROM order_payments p
                  WHERE p.order_id = o.id AND p.source = 'admin_pending'
                        AND p.confirmed = 0 AND p.is_deleted = 0
               ), 0)
           , 0)) AS order_debt
         FROM orders o
         WHERE ${where.join(' AND ')}
         GROUP BY o.customer_id
       ) d ON d.customer_id = c.id
       WHERE c.is_deleted = 0
         AND (c.opening_balance > 0 OR COALESCE(d.order_debt, 0) > 0)
       ORDER BY debt DESC
       LIMIT 200`,
      args
    );
    const total = rows.reduce((s, r) => s + Number(r.debt || 0), 0);
    res.json({ items: rows, total, from, to });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/reports/staff-debts -----------------------
// Cong no KTV = SUM(collections.amount WHERE remitted=0)
// Filter ?from=&to= theo col.collected_at (KTV thu trong khoang thoi gian).
router.get('/staff-debts', async (req, res, next) => {
  try {
    const from = req.query.from || null;
    const to   = req.query.to   || null;

    const colCond = ['col.remitted = 0', 'col.is_deleted = 0'];
    const args = [];
    if (from) { colCond.push('DATE(col.collected_at) >= ?'); args.push(from); }
    if (to)   { colCond.push('DATE(col.collected_at) <= ?'); args.push(to); }

    const [rows] = await db.query(
      `SELECT
         s.id, s.username, s.full_name, s.phone, s.area,
         COALESCE(SUM(col.amount), 0) AS unremitted_amount,
         COUNT(col.id) AS unremitted_count,
         MIN(col.collected_at) AS oldest_collection_at
       FROM staff s
       LEFT JOIN collections col
         ON col.staff_id = s.id
        AND ${colCond.join(' AND ')}
       WHERE s.role = 'kithuat' AND s.is_deleted = 0
       GROUP BY s.id
       HAVING unremitted_count > 0
       ORDER BY unremitted_amount DESC`,
      args
    );
    const total = rows.reduce((s, r) => s + Number(r.unremitted_amount || 0), 0);
    res.json({ items: rows, total, from, to });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/reports/admin-pending-debts ---------------
// Admin can xac nhan: SUM(order_payments WHERE source='admin_pending' AND confirmed=0)
// Group by don de admin biet don nao can bam confirm.
// Filter ?from=&to= theo p.paid_at (luc KTV ghi nhan khach tra admin).
router.get('/admin-pending-debts', async (req, res, next) => {
  try {
    const from = req.query.from || null;
    const to   = req.query.to   || null;

    const where = [
      'p.source = \'admin_pending\'',
      'p.confirmed = 0',
      'p.is_deleted = 0',
    ];
    const args = [];
    if (from) { where.push('DATE(p.paid_at) >= ?'); args.push(from); }
    if (to)   { where.push('DATE(p.paid_at) <= ?'); args.push(to); }

    const [rows] = await db.query(
      `SELECT
         o.id AS order_id, o.code AS order_code, o.status,
         cust.id AS customer_id, cust.full_name AS customer_name, cust.phone AS customer_phone,
         SUM(p.amount) AS pending_amount,
         COUNT(p.id)   AS pending_count,
         MIN(p.paid_at) AS oldest_at
       FROM order_payments p
       JOIN orders o ON o.id = p.order_id
       LEFT JOIN customers cust ON cust.id = o.customer_id
      WHERE ${where.join(' AND ')}
       GROUP BY o.id
       ORDER BY oldest_at ASC
       LIMIT 200`,
      args
    );
    const total = rows.reduce((s, r) => s + Number(r.pending_amount || 0), 0);
    res.json({ items: rows, total, from, to });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/reports/revenue ---------------------------
// Query: ?from (YYYY-MM-DD), ?to, ?group_by=day|month
// Doanh thu thuc = SUM(payment confirmed=1, source != 'refund') GROUP BY ngay THU TIEN.
// Refund duoc count rieng (so duong) -> net_amount = paid_amount - refund_amount.
// Tach theo source: staff (staff_collection) + admin (admin_mark_paid).
router.get('/revenue', async (req, res, next) => {
  try {
    const from = req.query.from || null;
    const to   = req.query.to   || null;
    const groupBy = req.query.group_by === 'month' ? 'month' : 'day';

    const where = ['p.is_deleted = 0', 'p.confirmed = 1'];
    const args = [];
    if (from) { where.push('DATE(p.paid_at) >= ?'); args.push(from); }
    if (to)   { where.push('DATE(p.paid_at) <= ?'); args.push(to); }

    const dateExpr = groupBy === 'month'
      ? "DATE_FORMAT(p.paid_at, '%Y-%m')"
      : 'DATE(p.paid_at)';

    const [rows] = await db.query(
      `SELECT ${dateExpr} AS period,
              COUNT(DISTINCT p.order_id) AS order_count,
              SUM(CASE WHEN p.source != 'refund' THEN p.amount ELSE 0 END) AS paid_amount,
              SUM(CASE WHEN p.source = 'refund'  THEN p.amount ELSE 0 END) AS refund_amount,
              SUM(CASE WHEN p.source = 'staff_collection' THEN p.amount ELSE 0 END) AS staff_amount,
              SUM(CASE WHEN p.source = 'admin_mark_paid'  THEN p.amount ELSE 0 END) AS admin_amount
         FROM order_payments p
        WHERE ${where.join(' AND ')}
        GROUP BY period
        ORDER BY period DESC
        LIMIT 365`,
      args
    );
    for (const r of rows) {
      r.net_amount   = (Number(r.paid_amount) || 0) - (Number(r.refund_amount) || 0);
      r.debt_amount  = r.net_amount; // alias de khong break FE cu
    }

    const summary = rows.reduce((s, r) => ({
      order_count:   s.order_count   + Number(r.order_count || 0),
      paid_amount:   s.paid_amount   + Number(r.paid_amount || 0),
      refund_amount: s.refund_amount + Number(r.refund_amount || 0),
      staff_amount:  s.staff_amount  + Number(r.staff_amount || 0),
      admin_amount:  s.admin_amount  + Number(r.admin_amount || 0),
      net_amount:    s.net_amount    + Number(r.net_amount || 0),
    }), { order_count: 0, paid_amount: 0, refund_amount: 0, staff_amount: 0, admin_amount: 0, net_amount: 0 });

    res.json({ items: rows, summary, group_by: groupBy, from, to });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/reports/top-products ----------------------
// Top san pham theo so luong ban (qty) trong khoang thoi gian.
// Tinh tren cac don da qua giai doan KTV (final statuses) + dang in_progress + warehouse_released.
router.get('/top-products', async (req, res, next) => {
  try {
    const from = req.query.from || null;
    const to   = req.query.to   || null;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    // Tinh tren cac don da duoc duyet (khong pending/cancelled)
    const where = ['o.is_deleted = 0', `o.status NOT IN ('pending','cancelled')`];
    const args = [];
    if (from) { where.push('DATE(o.confirmed_at) >= ?'); args.push(from); }
    if (to)   { where.push('DATE(o.confirmed_at) <= ?'); args.push(to); }

    const [rows] = await db.query(
      `SELECT p.id, p.code, p.name,
              SUM(oi.qty) AS total_qty,
              SUM(oi.qty * oi.unit_price) AS total_revenue,
              COUNT(DISTINCT o.id) AS order_count
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         JOIN products p ON p.id = oi.product_id
        WHERE ${where.join(' AND ')}
        GROUP BY p.id
        ORDER BY total_qty DESC
        LIMIT ?`,
      [...args, limit]
    );
    res.json({ items: rows, from, to });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/reports/orders-by-status ------------------
// Phan bo so don theo status (cho pie chart)
router.get('/orders-by-status', async (req, res, next) => {
  try {
    const from = req.query.from || null;
    const to   = req.query.to   || null;
    const where = ['is_deleted = 0'];
    const args = [];
    if (from) { where.push('DATE(confirmed_at) >= ?'); args.push(from); }
    if (to)   { where.push('DATE(confirmed_at) <= ?'); args.push(to); }

    const [rows] = await db.query(
      `SELECT status, COUNT(*) AS count, SUM(total_amount) AS total
         FROM orders
        WHERE ${where.join(' AND ')}
        GROUP BY status`,
      args
    );
    res.json({ items: rows, from, to });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/reports/orders-by-template ----------------
// Phan bo theo loai don (template)
router.get('/orders-by-template', async (req, res, next) => {
  try {
    const from = req.query.from || null;
    const to   = req.query.to   || null;
    const where = ['o.is_deleted = 0'];
    const args = [];
    if (from) { where.push('DATE(o.confirmed_at) >= ?'); args.push(from); }
    if (to)   { where.push('DATE(o.confirmed_at) <= ?'); args.push(to); }

    // Group theo template tu order_lines (1 don co the co nhieu line — 1 don tinh moi line 1 lan).
    const [rows] = await db.query(
      `SELECT ol.template_id, t.name AS template_name,
              COUNT(DISTINCT o.id) AS count,
              SUM(ol.subtotal) AS total
         FROM orders o
         JOIN order_lines ol ON ol.order_id = o.id AND ol.is_deleted = 0
         LEFT JOIN order_templates t ON t.id = ol.template_id
        WHERE ${where.join(' AND ')}
        GROUP BY ol.template_id, t.name`,
      args
    );
    res.json({ items: rows, from, to });
  } catch (err) { next(err); }
});

module.exports = router;
