// /api/admin/debts — Cong no (Rolling Balance)
// Tat ca route deu yeu cau role admin (da check o admin.js cha)
//
// Mo hinh: Khi admin bam "Tat toan" cho 1 khach, ALL don no hien tai cua khach do
// duoc "ket" vao 1 phieu tat toan (snapshot). So tien con thieu cong vao
// customers.opening_balance (so du goi dau ky moi).
// Don da ket co debt_carried_at IS NOT NULL -> bi loai khoi tinh no o lan sau.
//
// Endpoints:
//   GET  /                              -> list nguoi no (retail/dealer/tech, filter ?type, ?q)
//   GET  /summary                       -> stat cards (tong phai thu, qua han, KTV giu, da thu thang)
//   GET  /staff                         -> tab KTV giu tien (collections.remitted = 0)
//   POST /staff/:tech_id/settle         -> tao + auto-approve remittance batch
//   GET  /settlement/:id                -> doc 1 phieu tat toan (cho trang in bill)
//   GET  /:customer_id                  -> chi tiet 1 khach + don no + lich su tat toan
//   POST /:customer_id/settle           -> tao phieu tat toan (Rolling Balance)

const express = require('express');
const db = require('../../db');
const { recalcPaymentStatus } = require('../../utils/orderState');
const { requireRole } = require('../../middleware/auth');

const router = express.Router();
const adminOnly = requireRole('admin');

// Sau mig 046, no = orders.status NOT IN ('pending','cancelled')
//                AND orders.payment_status != 'paid'.
// Khong con bang warranty_orders rieng — tat ca don di vao orders.
// Chi don da hoan thanh (done) moi tinh vao cong no & dua vao phieu tat toan.
// Don confirmed/in_progress dang lam dang dau tu chi phi, chua chot — khong tinh no.
const DEBT_WHERE = `o.status = 'done' AND o.payment_status != 'paid'`;

// Sinh ma phieu tat toan TT-DDMM-NNN (retry khi gap race UNIQUE).
async function genSettlementCode(conn, attempt = 0) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `TT-${dd}${mm}-`;
  const [rows] = await conn.query(
    `SELECT code FROM debt_settlements WHERE code LIKE ? ORDER BY code DESC LIMIT 1`,
    [`${prefix}%`]
  );
  let next = 1;
  if (rows.length) {
    const last = rows[0].code.slice(prefix.length);
    next = (parseInt(last) || 0) + 1;
  }
  return prefix + String(next + attempt).padStart(3, '0');
}

// Tinh tong no cua 1 khach: opening_balance + tong don chua ket (debt_carried_at IS NULL)
// con thieu. Sau mig 045 chi con 1 bang orders, khong tach warranty.
async function calcCustomerDebt(conn, customerId) {
  const [custRows] = await conn.query(
    `SELECT opening_balance FROM customers WHERE id = ? AND is_deleted = 0`,
    [customerId]
  );
  if (!custRows.length) return null;
  const opening = Number(custRows[0].opening_balance) || 0;

  const [orders] = await conn.query(
    `SELECT
       o.id, o.code, o.total_amount, o.paid_amount, o.status, o.payment_status,
       o.confirmed_at, o.created_at, o.address, o.due_at, o.completed_at,
       COALESCE((
         SELECT SUM(col.amount) FROM collections col
          WHERE col.order_id = o.id AND col.remitted = 0 AND col.is_deleted = 0
       ), 0) AS unremitted,
       COALESCE((
         SELECT SUM(p.amount) FROM order_payments p
          WHERE p.order_id = o.id AND p.source = 'admin_pending'
                AND p.confirmed = 0 AND p.is_deleted = 0
       ), 0) AS admin_pending,
       (SELECT s.full_name FROM staff s WHERE s.id = o.assigned_staff_id) AS assigned_staff_names,
       (SELECT COUNT(*) FROM order_lines ol WHERE ol.order_id = o.id) AS item_count
     FROM orders o
     WHERE o.customer_id = ?
       AND o.is_deleted = 0
       AND o.debt_carried_at IS NULL
       AND ${DEBT_WHERE}`,
    [customerId]
  );

  let orderDebt = 0;
  const pendingOrders = [];
  for (const o of orders) {
    const remain = Number(o.total_amount) - Number(o.paid_amount)
                 - Number(o.unremitted) - Number(o.admin_pending);
    if (remain > 0) {
      orderDebt += remain;
      pendingOrders.push({
        id: o.id,
        code: o.code,
        total_amount: Number(o.total_amount),
        paid_amount: Number(o.paid_amount),
        unremitted: Number(o.unremitted),
        admin_pending: Number(o.admin_pending),
        remaining: remain,
        status: o.status,
        payment_status: o.payment_status,
        confirmed_at: o.confirmed_at,
        created_at: o.created_at,
        due_at: o.due_at,
        completed_at: o.completed_at,
        address: o.address,
        assigned_staff_names: o.assigned_staff_names || '',
        item_count: Number(o.item_count) || 0,
      });
    }
  }

  // Bao hanh khong con bang rieng (mig 045) — khong tinh warrantyDebt nua.
  const warrantyDebt = 0;
  const pendingWarranty = [];

  return {
    opening_balance: opening,
    order_debt: orderDebt,
    warranty_debt: warrantyDebt,
    total_debt: opening + orderDebt + warrantyDebt,
    pending_orders: pendingOrders,
    pending_warranty: pendingWarranty,
  };
}

// ==============================================================
// GET /api/admin/debts/summary  — stat cards cho dashboard cong no
// ==============================================================
router.get('/summary', async (req, res, next) => {
  try {
    // Tong phai thu = sum opening_balance + sum (don chua ket con no)
    const [openSum] = await db.query(
      `SELECT COALESCE(SUM(opening_balance), 0) AS total
         FROM customers WHERE is_deleted = 0 AND opening_balance > 0`
    );
    const [orderSum] = await db.query(
      `SELECT COALESCE(SUM(GREATEST(
         o.total_amount - o.paid_amount
         - COALESCE((SELECT SUM(col.amount) FROM collections col
                      WHERE col.order_id = o.id AND col.remitted = 0 AND col.is_deleted = 0), 0)
         - COALESCE((SELECT SUM(p.amount) FROM order_payments p
                      WHERE p.order_id = o.id AND p.source = 'admin_pending'
                            AND p.confirmed = 0 AND p.is_deleted = 0), 0)
         , 0)), 0) AS total
         FROM orders o
        WHERE o.is_deleted = 0
          AND o.debt_carried_at IS NULL
          AND ${DEBT_WHERE}`
    );
    const warrantySum = [{ total: 0 }];   // module bao hanh cu da xoa
    const totalReceivable = Number(openSum[0].total)
                          + Number(orderSum[0].total)
                          + Number(warrantySum[0].total);

    // KTV giu tien = opening_balance KTV + collections chua nop
    const [staffOpenSum] = await db.query(
      `SELECT COALESCE(SUM(opening_balance), 0) AS total
         FROM staff WHERE is_deleted = 0 AND role = 'kithuat' AND opening_balance > 0`
    );
    const [staffColSum] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
         FROM collections WHERE remitted = 0 AND is_deleted = 0`
    );
    const staffSum = [{ total: Number(staffOpenSum[0].total) + Number(staffColSum[0].total) }];

    // Da thu trong thang nay
    const [monthSum] = await db.query(
      `SELECT COALESCE(SUM(amount_paid), 0) AS total
         FROM debt_settlements
        WHERE is_deleted = 0
          AND YEAR(paid_at) = YEAR(NOW())
          AND MONTH(paid_at) = MONTH(NOW())`
    );

    // Qua han: dem khach/dai ly co don cu nhat > credit_term_days (mac dinh 0 -> ngay khi co no la qua han)
    // De don gian: dem so doi tuong co (opening_balance > 0 hoac don chua ket > 0) AND ngay no >= 7 ngay
    const [overdueRows] = await db.query(
      `SELECT COUNT(DISTINCT customer_id) AS cnt FROM (
         SELECT id AS customer_id FROM customers
          WHERE is_deleted = 0 AND opening_balance > 0
         UNION
         SELECT o.customer_id FROM orders o
          WHERE o.is_deleted = 0
            AND o.debt_carried_at IS NULL
            AND ${DEBT_WHERE}
            AND DATEDIFF(NOW(), COALESCE(o.confirmed_at, NOW())) >= 7
       ) t`
    );

    res.json({
      total_receivable: totalReceivable,
      staff_holding:    Number(staffSum[0].total),
      collected_this_month: Number(monthSum[0].total),
      overdue_customer_count: Number(overdueRows[0].cnt),
    });
  } catch (err) { next(err); }
});

// ==============================================================
// GET /api/admin/debts  — list nguoi no
// Query: ?type=retail|dealer|all (default all)
//        ?q= (ten/sdt)
// ==============================================================
router.get('/', async (req, res, next) => {
  try {
    const type = req.query.type;
    const q    = (req.query.q || '').trim();

    const where = ['c.is_deleted = 0'];
    const args = [];
    if (type === 'retail' || type === 'dealer') {
      where.push('c.type = ?'); args.push(type);
    }
    if (q) {
      where.push('(c.full_name LIKE ? OR c.phone LIKE ? OR c.code LIKE ? OR c.company_name LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like, like, like);
    }

    // 1 query gom: opening_balance + sum don chua ket
    const [rows] = await db.query(
      `SELECT
         c.id, c.code, c.full_name, c.phone, c.type, c.company_name,
         c.credit_term_days, c.debt_limit,
         c.opening_balance,
         COALESCE(d.order_debt, 0)        AS order_debt,
         COALESCE(d.order_count, 0)       AS order_count,
         d.oldest_at
       FROM customers c
       LEFT JOIN (
         SELECT
           o.customer_id,
           SUM(GREATEST(
             o.total_amount - o.paid_amount
             - COALESCE((SELECT SUM(col.amount) FROM collections col
                          WHERE col.order_id = o.id AND col.remitted = 0 AND col.is_deleted = 0), 0)
             - COALESCE((SELECT SUM(p.amount) FROM order_payments p
                          WHERE p.order_id = o.id AND p.source = 'admin_pending'
                                AND p.confirmed = 0 AND p.is_deleted = 0), 0)
           , 0)) AS order_debt,
           COUNT(*) AS order_count,
           MIN(o.confirmed_at) AS oldest_at
         FROM orders o
         WHERE o.is_deleted = 0
           AND o.debt_carried_at IS NULL
           AND ${DEBT_WHERE}
         GROUP BY o.customer_id
       ) d ON d.customer_id = c.id
       WHERE ${where.join(' AND ')}
         AND (c.opening_balance > 0
              OR COALESCE(d.order_debt, 0) > 0)
       ORDER BY (c.opening_balance + COALESCE(d.order_debt, 0)) DESC
       LIMIT 500`,
      args
    );

    const items = rows.map(r => {
      const opening = Number(r.opening_balance) || 0;
      const orderDebt = Number(r.order_debt) || 0;
      const total = opening + orderDebt;
      const oldestAt = r.oldest_at || null;
      const oldest = oldestAt ? new Date(oldestAt) : null;
      const daysOverdue = oldest ? Math.floor((Date.now() - oldest.getTime()) / 86400000) : 0;
      return {
        customer_id: r.id,
        code: r.code,
        name: r.full_name,
        phone: r.phone,
        type: r.type,
        company_name: r.company_name,
        credit_term_days: Number(r.credit_term_days) || 0,
        debt_limit: Number(r.debt_limit) || 0,
        opening_balance: opening,
        order_debt: orderDebt,
        order_count: Number(r.order_count) || 0,
        warranty_debt: 0,
        warranty_count: 0,
        total_debt: total,
        oldest_unpaid_at: oldestAt,
        days_overdue: daysOverdue,
        is_overdue: daysOverdue >= (Number(r.credit_term_days) || 0),
      };
    });

    res.json({ items, total: items.length });
  } catch (err) { next(err); }
});

// ==============================================================
// GET /api/admin/debts/staff — tab KTV giu tien
// ==============================================================
router.get('/staff', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const where = ['s.role = \'kithuat\'', 's.is_deleted = 0'];
    const args = [];
    if (q) {
      where.push('(s.full_name LIKE ? OR s.username LIKE ? OR s.phone LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like, like);
    }
    // LEFT JOIN de KTV co opening_balance > 0 nhung khong giu collection van hien.
    const [rows] = await db.query(
      `SELECT
         s.id, s.username, s.full_name, s.phone, s.area,
         s.opening_balance,
         COALESCE(c.holding_amount, 0)    AS holding_amount,
         COALESCE(c.collection_count, 0)  AS collection_count,
         c.oldest_at
       FROM staff s
       LEFT JOIN (
         SELECT staff_id,
                SUM(amount) AS holding_amount,
                COUNT(*)    AS collection_count,
                MIN(collected_at) AS oldest_at
           FROM collections
          WHERE remitted = 0 AND is_deleted = 0
          GROUP BY staff_id
       ) c ON c.staff_id = s.id
       WHERE ${where.join(' AND ')}
         AND (COALESCE(c.holding_amount, 0) > 0 OR s.opening_balance > 0)
       ORDER BY (s.opening_balance + COALESCE(c.holding_amount, 0)) DESC`,
      args
    );
    const items = rows.map(r => {
      const opening = Number(r.opening_balance) || 0;
      const holding = Number(r.holding_amount) || 0;
      const oldest = r.oldest_at ? new Date(r.oldest_at) : null;
      const days = oldest ? Math.floor((Date.now() - oldest.getTime()) / 86400000) : 0;
      return {
        staff_id: r.id,
        username: r.username,
        name: r.full_name,
        phone: r.phone,
        area: r.area,
        opening_balance: opening,
        holding_amount: holding,
        total_amount: opening + holding,        // tong phai nop = ky truoc + dang giu
        collection_count: Number(r.collection_count),
        oldest_at: r.oldest_at,
        days_holding: days,
      };
    });
    res.json({ items, total: items.length });
  } catch (err) { next(err); }
});

// ==============================================================
// GET /api/admin/debts/staff/:tech_id — chi tiet KTV + danh sach khoan dang giu
// ==============================================================
router.get('/staff/:tech_id', async (req, res, next) => {
  try {
    const techId = Number(req.params.tech_id);
    const [staffRows] = await db.query(
      `SELECT id, username, full_name, phone, area, opening_balance
         FROM staff WHERE id = ? AND role = 'kithuat' AND is_deleted = 0`,
      [techId]
    );
    if (!staffRows.length) return res.status(404).json({ error: 'Khong tim thay KTV' });
    const s = staffRows[0];

    const [cols] = await db.query(
      `SELECT col.id, col.amount, col.collected_at, col.method,
              o.id AS order_id, o.code AS order_code, o.confirmed_at
         FROM collections col
         LEFT JOIN orders o ON o.id = col.order_id
        WHERE col.staff_id = ? AND col.remitted = 0 AND col.is_deleted = 0
        ORDER BY col.collected_at ASC`,
      [techId]
    );
    const holdingAmount = cols.reduce((sum, c) => sum + Number(c.amount), 0);
    const opening = Number(s.opening_balance) || 0;

    const [history] = await db.query(
      `SELECT id, amount, total_holding, remaining, method, remitted_at, approved_at, status, note
         FROM remittances
        WHERE staff_id = ? AND is_deleted = 0
        ORDER BY remitted_at DESC LIMIT 30`,
      [techId]
    );

    res.json({
      staff: {
        id: s.id, username: s.username, name: s.full_name,
        phone: s.phone, area: s.area,
      },
      opening_balance: opening,
      holding_amount: holdingAmount,
      total_to_collect: opening + holdingAmount,
      collections: cols.map(c => ({
        id: c.id,
        amount: Number(c.amount),
        method: c.method,
        collected_at: c.collected_at,
        order_id: c.order_id,
        order_code: c.order_code,
        confirmed_at: c.confirmed_at,
      })),
      history: history.map(h => ({
        ...h,
        amount: Number(h.amount),
        total_holding: Number(h.total_holding),
        remaining: Number(h.remaining),
      })),
    });
  } catch (err) { next(err); }
});

// ==============================================================
// POST /api/admin/debts/staff/:tech_id/settle
// Tat toan KTV: tao 1 remittance approved gom toan bo collections chua nop cua KTV.
// Body: { method?: 'cash'|'transfer', note?: string, receipt_url?: string }
// ==============================================================
router.post('/staff/:tech_id/settle', adminOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const techId = Number(req.params.tech_id);
    const method = (req.body.method === 'transfer') ? 'transfer' : 'cash';
    const note = String(req.body.note || '').trim() || null;
    const receiptUrl = String(req.body.receipt_url || '').trim() || null;
    // amount_paid = so KTV thuc nop. Mac dinh = total_to_collect (nop du).
    const amountPaidRaw = req.body.amount_paid;
    const hasAmount = amountPaidRaw !== undefined && amountPaidRaw !== null && amountPaidRaw !== '';

    await conn.beginTransaction();
    const [staffRows] = await conn.query(
      `SELECT id, role, full_name, opening_balance
         FROM staff WHERE id = ? AND is_deleted = 0 FOR UPDATE`,
      [techId]
    );
    if (!staffRows.length || staffRows[0].role !== 'kithuat') {
      await conn.rollback();
      return res.status(404).json({ error: 'Khong tim thay KTV' });
    }
    const opening = Number(staffRows[0].opening_balance) || 0;

    const [collections] = await conn.query(
      `SELECT id, amount, order_id FROM collections
        WHERE staff_id = ? AND remitted = 0 AND is_deleted = 0`,
      [techId]
    );
    const holding = collections.reduce((s, c) => s + Number(c.amount), 0);
    const totalToCollect = opening + holding;

    if (totalToCollect <= 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'KTV khong co khoan can nop' });
    }

    const amountPaid = hasAmount ? Math.max(0, Number(amountPaidRaw) || 0) : totalToCollect;
    if (amountPaid <= 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'So tien nop phai > 0' });
    }
    if (amountPaid > totalToCollect * 1.1) {
      await conn.rollback();
      return res.status(400).json({
        error: `So tien nop (${amountPaid}) vuot tong phai nop (${totalToCollect}) qua nhieu`,
      });
    }
    const remaining = totalToCollect - amountPaid; // co the < 0 neu nop du

    // Tao remittance approved
    const [insRes] = await conn.query(
      `INSERT INTO remittances
         (staff_id, amount, total_holding, remaining, method, receipt_url, note,
          approved_by, approved_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'approved')`,
      [techId, amountPaid, totalToCollect, remaining, method, receiptUrl, note, req.user.sub]
    );
    const remittanceId = insRes.insertId;

    // Gan TAT CA collections dang giu vao remittance (mark remitted)
    let affectedOrderIds = [];
    if (collections.length) {
      await conn.query(
        `UPDATE collections SET remitted = 1, remittance_id = ?
          WHERE staff_id = ? AND remitted = 0 AND is_deleted = 0`,
        [remittanceId, techId]
      );
      affectedOrderIds = [...new Set(collections.map(c => c.order_id))];
    }

    // Cap nhat opening_balance moi cua KTV = remaining
    await conn.query(
      `UPDATE staff SET opening_balance = ? WHERE id = ?`,
      [remaining, techId]
    );

    // Recalc status don bi anh huong
    for (const oid of affectedOrderIds) await recalcPaymentStatus(conn, oid);

    await conn.commit();
    res.json({
      remittance_id: remittanceId,
      total_holding: totalToCollect,
      amount_paid: amountPaid,
      remaining,
      count: collections.length,
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ==============================================================
// GET /api/admin/debts/settlement/:id — doc 1 phieu tat toan (cho trang in bill)
// Tra ve: thong tin phieu + customer + danh sach don da ket trong phieu nay
//         + lich su cac phieu truoc do cua khach + thong tin QR + TK
// ==============================================================
router.get('/settlement/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.query(
      `SELECT s.*, c.code AS customer_code, c.full_name AS customer_name,
              c.phone AS customer_phone, c.address AS customer_address,
              c.type AS customer_type, c.company_name, c.tax_code,
              s2.full_name AS created_by_name
         FROM debt_settlements s
         JOIN customers c ON c.id = s.customer_id
         LEFT JOIN staff s2 ON s2.id = s.created_by
        WHERE s.id = ? AND s.is_deleted = 0`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay phieu' });
    const settlement = rows[0];

    // Don da ket vao phieu nay (snapshot)
    const [carriedOrders] = await db.query(
      `SELECT o.id, o.code, o.total_amount, o.paid_amount, o.status, o.confirmed_at,
              (SELECT GROUP_CONCAT(COALESCE(ol.custom_name, t.name) ORDER BY ol.seq SEPARATOR ' + ')
                 FROM order_lines ol
                 LEFT JOIN order_templates t ON t.id = ol.template_id
                WHERE ol.order_id = o.id AND ol.is_deleted = 0) AS template_name,
              (SELECT GROUP_CONCAT(DISTINCT NULLIF(TRIM(oi.vehicle_plate), '') SEPARATOR ', ')
                 FROM order_items oi
                WHERE oi.order_id = o.id AND oi.vehicle_plate IS NOT NULL AND TRIM(oi.vehicle_plate) <> '') AS vehicle_plate
         FROM orders o
        WHERE o.debt_settlement_id = ? AND o.is_deleted = 0
        ORDER BY o.confirmed_at ASC`,
      [id]
    );
    // Bao hanh khong con bang rieng
    const carriedWarranty = [];

    // Lich su tat toan truoc do (cua cung khach, paid_at < paid_at cua phieu nay)
    const [history] = await db.query(
      `SELECT id, code, total_debt, amount_paid, remaining, paid_at, pay_method
         FROM debt_settlements
        WHERE customer_id = ? AND is_deleted = 0 AND id != ?
        ORDER BY paid_at DESC LIMIT 20`,
      [settlement.customer_id, id]
    );

    // Thong tin QR + TK lay tu app_settings
    const [settingRows] = await db.query(
      `SELECT \`key\`, \`value\` FROM app_settings
        WHERE \`key\` LIKE 'qr.%' OR \`key\` LIKE 'bank.%'`
    );
    const settings = {};
    for (const r of settingRows) settings[r.key] = r.value;

    let qrUrl = '';
    let qrLabel = '';
    if (settlement.qr_slot) {
      qrUrl = settings[`qr.slot${settlement.qr_slot}.image_url`] || '';
      qrLabel = settings[`qr.slot${settlement.qr_slot}.label`] || '';
    }

    res.json({
      settlement: {
        id: settlement.id,
        code: settlement.code,
        total_debt: Number(settlement.total_debt),
        amount_paid: Number(settlement.amount_paid),
        remaining: Number(settlement.remaining),
        qr_slot: settlement.qr_slot,
        pay_method: settlement.pay_method,
        receipt_url: settlement.receipt_url,
        note: settlement.note,
        paid_at: settlement.paid_at,
        created_by_name: settlement.created_by_name,
      },
      customer: {
        id: settlement.customer_id,
        code: settlement.customer_code,
        name: settlement.customer_name,
        phone: settlement.customer_phone,
        address: settlement.customer_address,
        type: settlement.customer_type,
        company_name: settlement.company_name,
        tax_code: settlement.tax_code,
      },
      carried_orders: carriedOrders.map(o => ({
        ...o,
        total_amount: Number(o.total_amount),
        paid_amount: Number(o.paid_amount),
      })),
      carried_warranty: carriedWarranty.map(w => ({
        ...w,
        total_amount: Number(w.total_amount),
        paid_amount: Number(w.paid_amount),
      })),
      history,
      qr: { url: qrUrl, label: qrLabel, slot: settlement.qr_slot },
      bank: {
        account_no:   settings['bank.account_no']   || '',
        account_name: settings['bank.account_name'] || '',
        bank_name:    settings['bank.bank_name']    || '',
      },
      // Tinh "no ky truoc" = tong_no - tong_don_da_ket (= phan opening_balance luc tat toan)
      // Snapshot: opening_at_settle_time = total_debt - sum(carried orders' remaining at that time).
      // Vi khong snapshot rieng, tinh nhanh: opening = total_debt - sum(o.total - o.paid)
      // Khong chinh xac 100% neu admin sua paid_amount sau, nhung du dung trong bill in.
    });
  } catch (err) { next(err); }
});

// ==============================================================
// GET /api/admin/debts/:customer_id/settle-preview
// Du lieu day du de render trang /admin/debt-settle-form.html (truoc khi tao phieu)
// Tra customer + opening + pending_orders kem chi tiet: tasks(lines),
// items(san pham), order_charges, field_values (bien so, sim, tai khoan...), KTV.
// ==============================================================
router.get('/:customer_id/settle-preview', async (req, res, next) => {
  try {
    const customerId = Number(req.params.customer_id);
    if (!Number.isFinite(customerId) || customerId <= 0) {
      return res.status(400).json({ error: 'customer_id khong hop le' });
    }

    const [custRows] = await db.query(
      `SELECT id, code, full_name, phone, address, type, company_name, tax_code,
              credit_term_days, debt_limit, opening_balance
         FROM customers WHERE id = ? AND is_deleted = 0`,
      [customerId]
    );
    if (!custRows.length) return res.status(404).json({ error: 'Khong tim thay khach hang' });

    const dateFrom = req.query.date_from || null; // 'YYYY-MM-DD'
    const dateTo   = req.query.date_to   || null;

    const debt = await calcCustomerDebt(db, customerId);

    // Loc don theo completed_at neu co date range
    let filteredOrders = debt.pending_orders;
    if (dateFrom || dateTo) {
      filteredOrders = filteredOrders.filter(o => {
        const d = o.completed_at ? String(o.completed_at).slice(0, 10) : null;
        if (!d) return false;
        if (dateFrom && d < dateFrom) return false;
        if (dateTo   && d > dateTo)   return false;
        return true;
      });
    }
    const filteredOrderDebt = filteredOrders.reduce((s, o) => s + Number(o.remaining), 0);
    const filteredTotalDebt = Number(debt.opening_balance) + filteredOrderDebt;

    const pendingIds = filteredOrders.map(o => o.id);

    let ordersDetail = [];
    if (pendingIds.length) {
      const placeholders = pendingIds.map(() => '?').join(',');

      // Don + KTV
      const [orders] = await db.query(
        `SELECT o.id, o.code, o.total_amount, o.paid_amount, o.status, o.payment_status,
                o.confirmed_at, o.created_at, o.completed_at, o.due_at,
                o.address, o.note, o.assigned_staff_id,
                s.full_name AS assigned_staff_name,
                s.phone     AS assigned_staff_phone,
                s.username  AS assigned_staff_username
           FROM orders o
           LEFT JOIN staff s ON s.id = o.assigned_staff_id
          WHERE o.id IN (${placeholders})`,
        pendingIds
      );

      // Lines (cong viec)
      const [lines] = await db.query(
        `SELECT ol.id, ol.order_id, ol.template_id, ol.custom_name, ol.seq,
                ol.subtotal, ol.note,
                COALESCE(ol.custom_name, t.name) AS template_name
           FROM order_lines ol
           LEFT JOIN order_templates t ON t.id = ol.template_id
          WHERE ol.order_id IN (${placeholders}) AND ol.is_deleted = 0
          ORDER BY ol.order_id, ol.seq, ol.id`,
        pendingIds
      );

      // Items (san pham)
      const [items] = await db.query(
        `SELECT oi.id, oi.order_id, oi.line_id, oi.product_id, oi.qty,
                oi.unit_price, oi.vat_percent,
                p.name AS product_name, p.code AS product_code
           FROM order_items oi
           LEFT JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id IN (${placeholders})`,
        pendingIds
      );

      // Charges (chi phi line va chi phi cap don)
      const [charges] = await db.query(
        `SELECT id, order_id, line_id, kind, label, amount
           FROM order_charges
          WHERE order_id IN (${placeholders}) AND is_deleted = 0
          ORDER BY id`,
        pendingIds
      );

      // Field values (bien so xe, sim, tai khoan...)
      const [fieldValues] = await db.query(
        `SELECT id, order_id, line_id, template_field_id, label, value, seq
           FROM order_field_values
          WHERE order_id IN (${placeholders}) AND is_deleted = 0
          ORDER BY seq, id`,
        pendingIds
      );

      // Group theo order
      const orderMap = new Map();
      for (const o of orders) {
        orderMap.set(o.id, { ...o, lines: [], order_charges: [] });
      }
      const lineMap = new Map();
      for (const ln of lines) {
        const node = { ...ln, items: [], charges: [], field_values: [] };
        lineMap.set(ln.id, node);
        const od = orderMap.get(ln.order_id);
        if (od) od.lines.push(node);
      }
      for (const it of items) {
        if (it.line_id && lineMap.has(it.line_id)) lineMap.get(it.line_id).items.push(it);
      }
      for (const c of charges) {
        if (c.label === 'Công lắp') continue;  // an phi cong KTV
        if (c.line_id == null) {
          const od = orderMap.get(c.order_id);
          if (od) od.order_charges.push(c);
        } else if (lineMap.has(c.line_id)) {
          lineMap.get(c.line_id).charges.push(c);
        }
      }
      for (const fv of fieldValues) {
        if (fv.line_id && lineMap.has(fv.line_id)) lineMap.get(fv.line_id).field_values.push(fv);
      }

      // Merge voi pending_orders cua calcCustomerDebt de giu remaining chinh xac
      const pendingMap = new Map(filteredOrders.map(p => [p.id, p]));
      ordersDetail = pendingIds.map(id => {
        const o = orderMap.get(id);
        const p = pendingMap.get(id);
        return o ? { ...o, remaining: p.remaining } : null;
      }).filter(Boolean);
    }

    // Settings (qr + bank) cho FE render QR + thong tin chuyen khoan
    const [settingsRows] = await db.query(
      `SELECT \`key\`, \`value\` FROM app_settings`
    );
    const settings = {};
    for (const s of settingsRows) settings[s.key] = s.value;

    res.json({
      customer: custRows[0],
      opening_balance: debt.opening_balance,
      order_debt: filteredOrderDebt,
      total_debt: filteredTotalDebt,
      pending_orders: ordersDetail,
      date_from: dateFrom,
      date_to: dateTo,
      settings,
    });
  } catch (err) { next(err); }
});

// ==============================================================
// GET /api/admin/debts/:customer_id — chi tiet 1 khach
// ==============================================================
router.get('/:customer_id', async (req, res, next) => {
  try {
    const customerId = Number(req.params.customer_id);
    if (!Number.isFinite(customerId) || customerId <= 0) {
      return res.status(400).json({ error: 'customer_id khong hop le' });
    }
    const [custRows] = await db.query(
      `SELECT id, code, full_name, phone, address, type, company_name, tax_code,
              credit_term_days, debt_limit, opening_balance
         FROM customers WHERE id = ? AND is_deleted = 0`,
      [customerId]
    );
    if (!custRows.length) return res.status(404).json({ error: 'Khong tim thay khach hang' });

    const debt = await calcCustomerDebt(db, customerId);

    const [history] = await db.query(
      `SELECT id, code, total_debt, amount_paid, remaining, paid_at, pay_method, qr_slot, note
         FROM debt_settlements
        WHERE customer_id = ? AND is_deleted = 0
        ORDER BY paid_at DESC LIMIT 50`,
      [customerId]
    );

    res.json({
      customer: custRows[0],
      opening_balance: debt.opening_balance,
      order_debt: debt.order_debt,
      warranty_debt: debt.warranty_debt,
      total_debt: debt.total_debt,
      pending_orders: debt.pending_orders,
      pending_warranty: debt.pending_warranty,
      history,
    });
  } catch (err) { next(err); }
});

// ==============================================================
// POST /api/admin/debts/:customer_id/settle — tao phieu tat toan
// Body: { amount_paid, qr_slot?, pay_method?, receipt_url?, note? }
// ==============================================================
router.post('/:customer_id/settle', adminOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const customerId = Number(req.params.customer_id);
    if (!Number.isFinite(customerId) || customerId <= 0) {
      conn.release();
      return res.status(400).json({ error: 'customer_id khong hop le' });
    }
    const amountPaid = Math.max(0, Number(req.body.amount_paid) || 0);
    const qrSlot = req.body.qr_slot ? Math.min(5, Math.max(1, Number(req.body.qr_slot))) : null;
    const payMethod = ['cash', 'transfer', 'mixed'].includes(req.body.pay_method)
      ? req.body.pay_method : 'cash';
    const receiptUrl = String(req.body.receipt_url || '').trim() || null;
    const note = String(req.body.note || '').trim() || null;
    const dateFrom = req.body.date_from || null; // 'YYYY-MM-DD'
    const dateTo   = req.body.date_to   || null;

    if (amountPaid <= 0) {
      return res.status(400).json({ error: 'So tien tra phai > 0' });
    }

    await conn.beginTransaction();

    // Lock customer row
    const [custRows] = await conn.query(
      `SELECT id, opening_balance FROM customers
        WHERE id = ? AND is_deleted = 0 FOR UPDATE`,
      [customerId]
    );
    if (!custRows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Khong tim thay khach hang' });
    }

    const debt = await calcCustomerDebt(conn, customerId);

    // Loc don theo khoang ngay neu co date range
    let ordersToSettle = debt.pending_orders;
    if (dateFrom || dateTo) {
      ordersToSettle = ordersToSettle.filter(o => {
        const d = o.completed_at ? String(o.completed_at).slice(0, 10) : null;
        if (!d) return false;
        if (dateFrom && d < dateFrom) return false;
        if (dateTo   && d > dateTo)   return false;
        return true;
      });
    }
    const periodOrderDebt = ordersToSettle.reduce((s, o) => s + Number(o.remaining), 0);
    const periodTotalDebt = Number(debt.opening_balance) + periodOrderDebt;

    if (periodTotalDebt <= 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Khong co cong no trong khoang thoi gian nay' });
    }
    if (amountPaid > periodTotalDebt * 1.1) {
      await conn.rollback();
      return res.status(400).json({
        error: `So tien tra (${amountPaid}) vuot tong no (${periodTotalDebt}) qua nhieu`,
      });
    }
    const remaining = periodTotalDebt - amountPaid;

    // Sinh code (retry voi UNIQUE)
    let code = null;
    let inserted = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        code = await genSettlementCode(conn, attempt);
        const [r] = await conn.query(
          `INSERT INTO debt_settlements
             (code, customer_id, total_debt, amount_paid, remaining,
              qr_slot, pay_method, receipt_url, note, created_by, paid_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [code, customerId, periodTotalDebt, amountPaid, remaining,
           qrSlot, payMethod, receiptUrl, note, req.user.sub]
        );
        inserted = r;
        break;
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') throw e;
      }
    }
    if (!inserted) throw new Error('Khong sinh duoc ma phieu sau nhieu lan thu');
    const settlementId = inserted.insertId;

    // Gan debt_carried_at cho don trong khoang ngay (hoac tat ca neu khong co date range)
    const orderIds = ordersToSettle.map(o => o.id);
    if (orderIds.length) {
      await conn.query(
        `UPDATE orders
            SET debt_carried_at = NOW(), debt_settlement_id = ?
          WHERE id IN (${orderIds.map(() => '?').join(',')})`,
        [settlementId, ...orderIds]
      );
      // Recalc status: don da carried -> done (logic moi trong orderState.js)
      for (const oid of orderIds) await recalcPaymentStatus(conn, oid);
    }

    // (Module bao hanh cu da xoa — khong con warranty_orders)

    // Cap nhat opening_balance moi = remaining
    await conn.query(
      `UPDATE customers SET opening_balance = ? WHERE id = ?`,
      [remaining, customerId]
    );

    await conn.commit();
    res.json({ settlement_id: settlementId, code, total_debt: periodTotalDebt,
               amount_paid: amountPaid, remaining });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

module.exports = router;
