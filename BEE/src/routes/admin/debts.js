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
const { recalcOrderFinalStatus } = require('../../utils/orderState');
const { DEBT_STATUSES: WO_DEBT_STATUSES } = require('../../utils/warrantyState');

const router = express.Router();

// Status duoc tinh la "co the no" (don da qua giai doan KTV).
// cancelled khong tinh; pending_admin_confirm la admin chua xac nhan CK -> tinh
// (vi tu goc nhin "khach con no cong ty" thi van la no).
const DEBT_STATUSES = ['customer_owes', 'pending_admin_confirm', 'staff_owes', 'in_progress', 'done'];
const DEBT_PH = DEBT_STATUSES.map(() => '?').join(',');

// Don bao hanh: tinh tu khi delivering tro di (KTV dang/da giao thi tien co the
// chua thu du) cho den khi ket no. cancelled khong tinh.
const WO_DEBT_PH = WO_DEBT_STATUSES.map(() => '?').join(',');

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
// con thieu. Bao gom CA orders (lap/gia han/...) lan warranty_orders (bao hanh).
// Tra ve so chi tiet kem hai mang pending_orders / pending_warranty.
async function calcCustomerDebt(conn, customerId) {
  const [custRows] = await conn.query(
    `SELECT opening_balance FROM customers WHERE id = ? AND is_deleted = 0`,
    [customerId]
  );
  if (!custRows.length) return null;
  const opening = Number(custRows[0].opening_balance) || 0;

  const [orders] = await conn.query(
    `SELECT
       o.id, o.code, o.total_amount, o.paid_amount, o.status, o.confirmed_at,
       COALESCE((
         SELECT SUM(col.amount) FROM collections col
          WHERE col.order_id = o.id AND col.remitted = 0 AND col.is_deleted = 0
       ), 0) AS unremitted,
       COALESCE((
         SELECT SUM(p.amount) FROM order_payments p
          WHERE p.order_id = o.id AND p.source = 'admin_pending'
                AND p.confirmed = 0 AND p.is_deleted = 0
       ), 0) AS admin_pending
     FROM orders o
     WHERE o.customer_id = ?
       AND o.is_deleted = 0
       AND o.debt_carried_at IS NULL
       AND o.status IN (${DEBT_PH})`,
    [customerId, ...DEBT_STATUSES]
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
        confirmed_at: o.confirmed_at,
      });
    }
  }

  // Don bao hanh: cost_amount - paid_amount (don gian, khong co
  // collections/admin_pending phuc tap nhu orders).
  const [warranties] = await conn.query(
    `SELECT id, code, cost_amount, paid_amount, status, request_date
       FROM warranty_orders
      WHERE customer_id = ?
        AND is_deleted = 0
        AND debt_carried_at IS NULL
        AND status IN (${WO_DEBT_PH})`,
    [customerId, ...WO_DEBT_STATUSES]
  );

  let warrantyDebt = 0;
  const pendingWarranty = [];
  for (const w of warranties) {
    const remain = Number(w.cost_amount) - Number(w.paid_amount);
    if (remain > 0) {
      warrantyDebt += remain;
      pendingWarranty.push({
        id: w.id,
        code: w.code,
        cost_amount: Number(w.cost_amount),
        paid_amount: Number(w.paid_amount),
        remaining: remain,
        status: w.status,
        request_date: w.request_date,
      });
    }
  }

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
          AND o.status IN (${DEBT_PH})`,
      DEBT_STATUSES
    );
    const [warrantySum] = await db.query(
      `SELECT COALESCE(SUM(GREATEST(cost_amount - paid_amount, 0)), 0) AS total
         FROM warranty_orders
        WHERE is_deleted = 0
          AND debt_carried_at IS NULL
          AND status IN (${WO_DEBT_PH})`,
      WO_DEBT_STATUSES
    );
    const totalReceivable = Number(openSum[0].total)
                          + Number(orderSum[0].total)
                          + Number(warrantySum[0].total);

    // KTV giu tien
    const [staffSum] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
         FROM collections WHERE remitted = 0 AND is_deleted = 0`
    );

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
         SELECT customer_id FROM orders
          WHERE is_deleted = 0
            AND debt_carried_at IS NULL
            AND status IN (${DEBT_PH})
            AND DATEDIFF(NOW(), COALESCE(confirmed_at, NOW())) >= 7
       ) t`,
      DEBT_STATUSES
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

    // Tinh dung 1 query gom: opening_balance + sum don chua ket (orders + warranty_orders)
    const [rows] = await db.query(
      `SELECT
         c.id, c.code, c.full_name, c.phone, c.type, c.company_name,
         c.credit_term_days, c.debt_limit,
         c.opening_balance,
         COALESCE(d.order_debt, 0)        AS order_debt,
         COALESCE(d.order_count, 0)       AS order_count,
         d.oldest_at,
         COALESCE(w.warranty_debt, 0)     AS warranty_debt,
         COALESCE(w.warranty_count, 0)    AS warranty_count,
         w.oldest_warranty_at
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
           AND o.status IN (${DEBT_PH})
         GROUP BY o.customer_id
       ) d ON d.customer_id = c.id
       LEFT JOIN (
         SELECT
           wo.customer_id,
           SUM(GREATEST(wo.cost_amount - wo.paid_amount, 0)) AS warranty_debt,
           COUNT(*) AS warranty_count,
           MIN(wo.request_date) AS oldest_warranty_at
         FROM warranty_orders wo
         WHERE wo.is_deleted = 0
           AND wo.debt_carried_at IS NULL
           AND wo.status IN (${WO_DEBT_PH})
         GROUP BY wo.customer_id
       ) w ON w.customer_id = c.id
       WHERE ${where.join(' AND ')}
         AND (c.opening_balance > 0
              OR COALESCE(d.order_debt, 0) > 0
              OR COALESCE(w.warranty_debt, 0) > 0)
       ORDER BY (c.opening_balance + COALESCE(d.order_debt, 0) + COALESCE(w.warranty_debt, 0)) DESC
       LIMIT 500`,
      [...DEBT_STATUSES, ...WO_DEBT_STATUSES, ...args]
    );

    const items = rows.map(r => {
      const opening = Number(r.opening_balance) || 0;
      const orderDebt = Number(r.order_debt) || 0;
      const warrantyDebt = Number(r.warranty_debt) || 0;
      const total = opening + orderDebt + warrantyDebt;
      // oldest unpaid: lay min cua oldest_at (orders) va oldest_warranty_at
      let oldestAt = r.oldest_at || null;
      if (r.oldest_warranty_at && (!oldestAt || new Date(r.oldest_warranty_at) < new Date(oldestAt))) {
        oldestAt = r.oldest_warranty_at;
      }
      const oldest = oldestAt ? new Date(oldestAt) : null;
      const daysOverdue = oldest ? Math.floor((Date.now() - oldest.getTime()) / 86400000) : 0;
      return {
        customer_id: r.id,
        code: r.code,
        name: r.full_name,
        phone: r.phone,
        type: r.type,                         // 'retail' | 'dealer'
        company_name: r.company_name,
        credit_term_days: Number(r.credit_term_days) || 0,
        debt_limit: Number(r.debt_limit) || 0,
        opening_balance: opening,
        order_debt: orderDebt,
        order_count: Number(r.order_count) || 0,
        warranty_debt: warrantyDebt,
        warranty_count: Number(r.warranty_count) || 0,
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
    const where = ['col.remitted = 0', 'col.is_deleted = 0'];
    const args = [];
    if (q) {
      where.push('(s.full_name LIKE ? OR s.username LIKE ? OR s.phone LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like, like);
    }
    const [rows] = await db.query(
      `SELECT
         s.id, s.username, s.full_name, s.phone, s.area,
         COALESCE(SUM(col.amount), 0) AS total_amount,
         COUNT(col.id) AS collection_count,
         MIN(col.collected_at) AS oldest_at
       FROM staff s
       JOIN collections col ON col.staff_id = s.id
       WHERE s.role = 'kithuat' AND s.is_deleted = 0
         AND ${where.join(' AND ')}
       GROUP BY s.id
       ORDER BY total_amount DESC`,
      args
    );
    const items = rows.map(r => {
      const oldest = r.oldest_at ? new Date(r.oldest_at) : null;
      const days = oldest ? Math.floor((Date.now() - oldest.getTime()) / 86400000) : 0;
      return {
        staff_id: r.id,
        username: r.username,
        name: r.full_name,
        phone: r.phone,
        area: r.area,
        total_amount: Number(r.total_amount),
        collection_count: Number(r.collection_count),
        oldest_at: r.oldest_at,
        days_holding: days,
      };
    });
    res.json({ items, total: items.length });
  } catch (err) { next(err); }
});

// ==============================================================
// POST /api/admin/debts/staff/:tech_id/settle
// Tat toan KTV: tao 1 remittance approved gom toan bo collections chua nop cua KTV.
// Body: { method?: 'cash'|'transfer', note?: string, receipt_url?: string }
// ==============================================================
router.post('/staff/:tech_id/settle', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const techId = Number(req.params.tech_id);
    const method = (req.body.method === 'transfer') ? 'transfer' : 'cash';
    const note = String(req.body.note || '').trim() || null;
    const receiptUrl = String(req.body.receipt_url || '').trim() || null;

    await conn.beginTransaction();
    const [staffRows] = await conn.query(
      `SELECT id, role, full_name FROM staff WHERE id = ? AND is_deleted = 0`,
      [techId]
    );
    if (!staffRows.length || staffRows[0].role !== 'kithuat') {
      await conn.rollback();
      return res.status(404).json({ error: 'Khong tim thay KTV' });
    }

    const [collections] = await conn.query(
      `SELECT id, amount, order_id FROM collections
        WHERE staff_id = ? AND remitted = 0 AND is_deleted = 0`,
      [techId]
    );
    if (!collections.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'KTV khong co khoan thu chua nop' });
    }
    const totalAmount = collections.reduce((s, c) => s + Number(c.amount), 0);

    // Tao remittance approved luon
    const [insRes] = await conn.query(
      `INSERT INTO remittances
         (staff_id, amount, method, receipt_url, note, approved_by, approved_at, status)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), 'approved')`,
      [techId, totalAmount, method, receiptUrl, note, req.user.sub]
    );
    const remittanceId = insRes.insertId;

    // Gan collections vao remittance
    await conn.query(
      `UPDATE collections SET remitted = 1, remittance_id = ?
        WHERE staff_id = ? AND remitted = 0 AND is_deleted = 0`,
      [remittanceId, techId]
    );

    // Recalc status cac don bi anh huong
    const [taskRows] = await conn.query(
      `SELECT DISTINCT order_id
         FROM collections
        WHERE remittance_id = ?`,
      [remittanceId]
    );
    for (const r of taskRows) await recalcOrderFinalStatus(conn, r.order_id);

    await conn.commit();
    res.json({ remittance_id: remittanceId, amount: totalAmount, count: collections.length });
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
      `SELECT id, code, total_amount, paid_amount, status, confirmed_at, service_kind
         FROM orders
        WHERE debt_settlement_id = ? AND is_deleted = 0
        ORDER BY confirmed_at ASC`,
      [id]
    );

    // Don bao hanh da ket
    const [carriedWarranty] = await db.query(
      `SELECT id, code, cost_amount AS total_amount, paid_amount, status, request_date AS confirmed_at,
              license_plate, device_name
         FROM warranty_orders
        WHERE debt_settlement_id = ? AND is_deleted = 0
        ORDER BY request_date ASC`,
      [id]
    );

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
// GET /api/admin/debts/:customer_id — chi tiet 1 khach
// ==============================================================
router.get('/:customer_id', async (req, res, next) => {
  try {
    const customerId = Number(req.params.customer_id);
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
router.post('/:customer_id/settle', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const customerId = Number(req.params.customer_id);
    const amountPaid = Math.max(0, Number(req.body.amount_paid) || 0);
    const qrSlot = req.body.qr_slot ? Math.min(5, Math.max(1, Number(req.body.qr_slot))) : null;
    const payMethod = ['cash', 'transfer', 'mixed'].includes(req.body.pay_method)
      ? req.body.pay_method : 'cash';
    const receiptUrl = String(req.body.receipt_url || '').trim() || null;
    const note = String(req.body.note || '').trim() || null;

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
    if (debt.total_debt <= 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Khach hang khong co cong no' });
    }
    // Cho phep tra thua toi 10% (de fix sai so) — neu tra cao hon thi chan.
    if (amountPaid > debt.total_debt * 1.1) {
      await conn.rollback();
      return res.status(400).json({
        error: `So tien tra (${amountPaid}) vuot tong no (${debt.total_debt}) qua nhieu`,
      });
    }
    const remaining = debt.total_debt - amountPaid; // co the < 0 neu tra thua chut

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
          [code, customerId, debt.total_debt, amountPaid, remaining,
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

    // UPDATE tat ca don no chua ket cua khach: gan debt_carried_at + debt_settlement_id
    const orderIds = debt.pending_orders.map(o => o.id);
    if (orderIds.length) {
      await conn.query(
        `UPDATE orders
            SET debt_carried_at = NOW(), debt_settlement_id = ?
          WHERE id IN (${orderIds.map(() => '?').join(',')})`,
        [settlementId, ...orderIds]
      );
      // Recalc status: don da carried -> done (logic moi trong orderState.js)
      for (const oid of orderIds) await recalcOrderFinalStatus(conn, oid);
    }

    // Tuong tu cho don bao hanh — chi can set debt_carried_at + debt_settlement_id,
    // khong recalc status vi don bao hanh da o trang thai 'completed' (terminal).
    const warrantyIds = debt.pending_warranty.map(w => w.id);
    if (warrantyIds.length) {
      await conn.query(
        `UPDATE warranty_orders
            SET debt_carried_at = NOW(), debt_settlement_id = ?
          WHERE id IN (${warrantyIds.map(() => '?').join(',')})`,
        [settlementId, ...warrantyIds]
      );
    }

    // Cap nhat opening_balance moi = remaining
    await conn.query(
      `UPDATE customers SET opening_balance = ? WHERE id = ?`,
      [remaining, customerId]
    );

    await conn.commit();
    res.json({ settlement_id: settlementId, code, total_debt: debt.total_debt,
               amount_paid: amountPaid, remaining });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

module.exports = router;
