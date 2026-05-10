// /api/admin/staff/:id/payroll — Bang luong KTV theo thang
//
// Endpoints (mount tai admin.js: router.use('/staff', payroll) — ben duoi staff route)
//   GET    /:id/payroll?period=YYYY-MM   -> dung bang. Neu da chot, tra snapshot.
//   POST   /:id/payroll/finalize         -> chot ky (snapshot + danh debt_carried_at)
//   POST   /:id/payroll/unfinalize       -> bo chot (xoa mem snapshot + go debt_carried_at)
//
// Don tinh vao bang luong: orders cua KTV co status IN ('done','customer_owes',
// 'staff_owes','pending_admin_confirm') VA completed_at thuoc thang ky VA chua
// bi ket cong no boi ky luong khac.
//
// Khi finalize: danh debt_carried_at = now() cho cac don do (su dung lai co che
// "tat toan" cua module no — don da ket khong xuat hien o lan tat toan ke tiep
// hay ky luong sau).

const express = require('express');
const db = require('../../db');

const router = express.Router({ mergeParams: true });

// Sau mig 045/046: don da hoan thanh = completed_at IS NOT NULL.

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function parsePeriod(period) {
  const s = String(period || '').trim();
  if (!/^\d{4}-\d{2}$/.test(s)) throw httpErr(400, 'period sai dinh dang YYYY-MM');
  const [y, m] = s.split('-').map(Number);
  if (m < 1 || m > 12) throw httpErr(400, 'period: thang khong hop le');
  // Khoang [start, end) theo gio local server
  const start = `${s}-01 00:00:00`;
  const next = new Date(y, m, 1); // m la index 0-based cua thang ke tiep do JS
  const ny = next.getFullYear();
  const nm = String(next.getMonth() + 1).padStart(2, '0');
  const end = `${ny}-${nm}-01 00:00:00`;
  return { start, end };
}

function shortPaymentNote(p) {
  // VD: "21/4 ck 2tr1"
  const d = new Date(p.paid_at);
  if (isNaN(d.getTime())) return null;
  const dd = d.getDate();
  const mm = d.getMonth() + 1;
  const amt = Number(p.amount) || 0;
  let amtTxt;
  if (amt >= 1_000_000) {
    const tr = Math.floor(amt / 1_000_000);
    const rem = Math.round((amt - tr * 1_000_000) / 100_000);
    amtTxt = rem ? `${tr}tr${rem}` : `${tr}tr`;
  } else if (amt >= 1000) {
    amtTxt = `${Math.round(amt / 1000)}k`;
  } else {
    amtTxt = String(amt);
  }
  const kindTxt = (p.source === 'staff_collection' || p.source === 'admin_pending') ? 'ck' : 'tt';
  return `${dd}/${mm} ${kindTxt} ${amtTxt}`;
}

// ----------------------------------------------------------
// GET /:id/payroll?period=YYYY-MM
// Tra:
//   { staff, period, finalized: bool, finalized_at, finalized_by_name,
//     base_salary, insurance_amount, advance_amount,
//     extras: [], rows: [], totals: {revenue, wage, extras, final}, note }
// ----------------------------------------------------------
router.get('/:id/payroll', async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const period  = String(req.query.period || '').trim();
    const { start, end } = parsePeriod(period);

    const [staffRows] = await db.query(
      `SELECT id, username, full_name, role, area, phone
         FROM staff WHERE id = ? AND is_deleted = 0`,
      [staffId]
    );
    if (!staffRows.length) return res.status(404).json({ error: 'Khong tim thay nhan vien' });
    const staff = staffRows[0];

    // Co snapshot da chot chua?
    const [snapRows] = await db.query(
      `SELECT spp.*, s.full_name AS finalized_by_name
         FROM staff_payroll_periods spp
         LEFT JOIN staff s ON s.id = spp.finalized_by
        WHERE spp.staff_id = ? AND spp.period = ? AND spp.is_deleted = 0
        ORDER BY spp.id DESC LIMIT 1`,
      [staffId, period]
    );

    if (snapRows.length) {
      const r = snapRows[0];
      let rows = [];
      let extras = [];
      try { rows   = r.rows_json   ? (typeof r.rows_json   === 'string' ? JSON.parse(r.rows_json)   : r.rows_json)   : []; } catch { rows = []; }
      try { extras = r.extras_json ? (typeof r.extras_json === 'string' ? JSON.parse(r.extras_json) : r.extras_json) : []; } catch { extras = []; }

      return res.json({
        staff,
        period,
        finalized: true,
        finalized_at:      r.finalized_at,
        finalized_by:      r.finalized_by,
        finalized_by_name: r.finalized_by_name,
        base_salary:       Number(r.base_salary) || 0,
        insurance_amount:  Number(r.insurance_amount) || 0,
        advance_amount:    Number(r.advance_amount) || 0,
        extras,
        rows,
        totals: {
          revenue: Number(r.total_revenue) || 0,
          wage:    Number(r.total_wage)    || 0,
          extras:  Number(r.total_extras)  || 0,
          final:   Number(r.final_amount)  || 0,
        },
        note: r.note || '',
      });
    }

    // Chua chot — tinh dong tu orders
    const [orderRows] = await db.query(
      `SELECT o.id, o.code, o.completed_at,
              o.total_amount, o.wage_amount, o.status, o.payment_status,
              (SELECT GROUP_CONCAT(COALESCE(ol.custom_name, t.name) ORDER BY ol.seq SEPARATOR ' + ')
                 FROM order_lines ol
                 LEFT JOIN order_templates t ON t.id = ol.template_id
                WHERE ol.order_id = o.id AND ol.is_deleted = 0) AS template_name
         FROM orders o
        WHERE o.assigned_staff_id = ?
          AND o.is_deleted = 0
          AND o.debt_carried_at IS NULL
          AND o.completed_at >= ? AND o.completed_at < ?
          AND o.completed_at IS NOT NULL
          AND o.status != 'cancelled'
        ORDER BY o.completed_at ASC, o.id ASC`,
      [staffId, start, end]
    );

    let payments = [];
    if (orderRows.length) {
      const ids = orderRows.map(o => o.id);
      const ph = ids.map(() => '?').join(',');
      const [pays] = await db.query(
        `SELECT order_id, amount, source, paid_at
           FROM order_payments
          WHERE order_id IN (${ph})
            AND is_deleted = 0
            AND source <> 'refund'
            AND confirmed = 1
          ORDER BY paid_at ASC, id ASC`,
        ids
      );
      payments = pays;
    }
    const payByOrder = new Map();
    for (const p of payments) {
      const arr = payByOrder.get(p.order_id) || [];
      arr.push(p);
      payByOrder.set(p.order_id, arr);
    }

    const rows = orderRows.map(o => {
      const ps = payByOrder.get(o.id) || [];
      const noteTxt = ps.map(shortPaymentNote).filter(Boolean).join(', ');
      return {
        order_id:       o.id,
        code:           o.code,
        completed_at:   o.completed_at,
        template_id:    null,
        template_name:  o.template_name || '',
        service_label:  o.template_name || '',
        revenue:        Number(o.total_amount) || 0,
        wage:           Number(o.wage_amount) || 0,
        payment_note:   noteTxt,
        status:         o.status,
        payment_status: o.payment_status,
      };
    });

    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    const totalWage    = rows.reduce((s, r) => s + r.wage, 0);

    res.json({
      staff,
      period,
      finalized: false,
      base_salary:      0,
      insurance_amount: 0,
      advance_amount:   0,
      extras: [],
      rows,
      totals: { revenue: totalRevenue, wage: totalWage, extras: 0, final: 0 },
      note: '',
    });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /:id/payroll/finalize
// Body: { period, base_salary, insurance_amount, advance_amount, extras: [{note, amount}], note }
// ----------------------------------------------------------
router.post('/:id/payroll/finalize', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const staffId = Number(req.params.id);
    const period  = String(req.body.period || '').trim();
    const { start, end } = parsePeriod(period);

    const baseSalary  = Math.max(0, Math.round(Number(req.body.base_salary)      || 0));
    const insurance   = Math.max(0, Math.round(Number(req.body.insurance_amount) || 0));
    const advance     = Math.max(0, Math.round(Number(req.body.advance_amount)   || 0));
    const noteTxt     = String(req.body.note || '').slice(0, 500);

    let extras = Array.isArray(req.body.extras) ? req.body.extras : [];
    extras = extras
      .map(e => ({
        note:   String(e?.note || '').slice(0, 200),
        amount: Math.round(Number(e?.amount) || 0),
      }))
      .filter(e => e.note || e.amount);
    const totalExtras = extras.reduce((s, e) => s + e.amount, 0);

    await conn.beginTransaction();

    // Khoa: kiem tra ky chua chot
    const [exist] = await conn.query(
      `SELECT id FROM staff_payroll_periods
        WHERE staff_id = ? AND period = ? AND is_deleted = 0
        FOR UPDATE`,
      [staffId, period]
    );
    if (exist.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'Ky luong nay da duoc chot' });
    }

    const [staffRows] = await conn.query(
      `SELECT id FROM staff WHERE id = ? AND is_deleted = 0`, [staffId]
    );
    if (!staffRows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Khong tim thay nhan vien' });
    }

    // Lay snapshot don
    const [orderRows] = await conn.query(
      `SELECT o.id, o.code, o.completed_at,
              o.total_amount, o.wage_amount, o.status, o.payment_status,
              (SELECT GROUP_CONCAT(COALESCE(ol.custom_name, t.name) ORDER BY ol.seq SEPARATOR ' + ')
                 FROM order_lines ol
                 LEFT JOIN order_templates t ON t.id = ol.template_id
                WHERE ol.order_id = o.id AND ol.is_deleted = 0) AS template_name
         FROM orders o
        WHERE o.assigned_staff_id = ?
          AND o.is_deleted = 0
          AND o.debt_carried_at IS NULL
          AND o.completed_at >= ? AND o.completed_at < ?
          AND o.completed_at IS NOT NULL
          AND o.status != 'cancelled'
        ORDER BY o.completed_at ASC, o.id ASC
        FOR UPDATE`,
      [staffId, start, end]
    );

    let payments = [];
    if (orderRows.length) {
      const ids = orderRows.map(o => o.id);
      const ph = ids.map(() => '?').join(',');
      const [pays] = await conn.query(
        `SELECT order_id, amount, source, paid_at
           FROM order_payments
          WHERE order_id IN (${ph}) AND is_deleted = 0
            AND source <> 'refund' AND confirmed = 1
          ORDER BY paid_at ASC, id ASC`,
        ids
      );
      payments = pays;
    }
    const payByOrder = new Map();
    for (const p of payments) {
      const arr = payByOrder.get(p.order_id) || [];
      arr.push(p);
      payByOrder.set(p.order_id, arr);
    }

    const rowsSnap = orderRows.map(o => {
      const ps = payByOrder.get(o.id) || [];
      return {
        order_id:      o.id,
        code:          o.code,
        completed_at:  o.completed_at,
        template_id:   null,
        template_name: o.template_name || '',
        service_label: o.template_name || '',
        revenue:       Number(o.total_amount) || 0,
        wage:          Number(o.wage_amount) || 0,
        payment_note:  ps.map(shortPaymentNote).filter(Boolean).join(', '),
        status:        o.status,
        payment_status: o.payment_status,
      };
    });

    const totalRevenue = rowsSnap.reduce((s, r) => s + r.revenue, 0);
    const totalWage    = rowsSnap.reduce((s, r) => s + r.wage, 0);
    const finalAmount  = baseSalary + totalWage + totalExtras - insurance - advance;

    const [ins] = await conn.query(
      `INSERT INTO staff_payroll_periods
        (staff_id, period, base_salary, insurance_amount, advance_amount,
         extras_json, rows_json, total_revenue, total_wage, total_extras,
         final_amount, note, finalized_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        staffId, period, baseSalary, insurance, advance,
        JSON.stringify(extras), JSON.stringify(rowsSnap),
        totalRevenue, totalWage, totalExtras,
        finalAmount, noteTxt, req.user?.sub || null,
      ]
    );

    // Danh debt_carried_at cho cac don
    if (orderRows.length) {
      const ids = orderRows.map(o => o.id);
      const ph = ids.map(() => '?').join(',');
      await conn.query(
        `UPDATE orders SET debt_carried_at = NOW()
          WHERE id IN (${ph}) AND debt_carried_at IS NULL`,
        ids
      );
    }

    await conn.commit();

    res.status(201).json({
      ok: true,
      id: ins.insertId,
      orders_count: orderRows.length,
      totals: { revenue: totalRevenue, wage: totalWage, extras: totalExtras, final: finalAmount },
    });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    next(err);
  } finally {
    conn.release();
  }
});

// ----------------------------------------------------------
// POST /:id/payroll/unfinalize
// Body: { period }
// Xoa mem snapshot + go debt_carried_at cho cac don thuoc snapshot.
// ----------------------------------------------------------
router.post('/:id/payroll/unfinalize', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const staffId = Number(req.params.id);
    const period  = String(req.body.period || '').trim();
    parsePeriod(period); // validate

    await conn.beginTransaction();

    const [snapRows] = await conn.query(
      `SELECT id, rows_json FROM staff_payroll_periods
        WHERE staff_id = ? AND period = ? AND is_deleted = 0
        FOR UPDATE`,
      [staffId, period]
    );
    if (!snapRows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Chua co phieu luong cho ky nay' });
    }
    const snap = snapRows[0];

    let rows = [];
    try { rows = snap.rows_json ? (typeof snap.rows_json === 'string' ? JSON.parse(snap.rows_json) : snap.rows_json) : []; } catch {}
    const orderIds = rows.map(r => Number(r.order_id)).filter(Boolean);

    if (orderIds.length) {
      const ph = orderIds.map(() => '?').join(',');
      // Chi go debt_carried_at neu don con thuoc dung KTV nay (an toan)
      await conn.query(
        `UPDATE orders SET debt_carried_at = NULL
          WHERE id IN (${ph}) AND assigned_staff_id = ?`,
        [...orderIds, staffId]
      );
    }

    await conn.query(
      `UPDATE staff_payroll_periods SET is_deleted = 1 WHERE id = ?`,
      [snap.id]
    );

    await conn.commit();
    res.json({ ok: true, orders_released: orderIds.length });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
