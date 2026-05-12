// /api/admin/staff/:id/payroll — Bang luong + Ung truoc luong
//
// Endpoints:
//   GET    /:id/payroll?period=YYYY-MM     -> bang luong (draft hoac snapshot)
//   GET    /:id/payroll/history            -> list cac ky da chot (ca da bo)
//   POST   /:id/payroll/finalize           -> chot ky
//   POST   /:id/payroll/unfinalize         -> bo chot ky
//
//   GET    /:id/advances?period=YYYY-MM    -> list phieu ung truoc trong ky
//   POST   /:id/advances                   -> tao phieu ung
//   DELETE /:id/advances/:aid              -> xoa mem phieu ung (chua ket)

const express = require('express');
const db = require('../../db');
const { requireRole } = require('../../middleware/auth');

const router = express.Router({ mergeParams: true });
const adminOnly = requireRole('admin');

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
  const start = `${s}-01 00:00:00`;
  const next = new Date(y, m, 1);
  const ny = next.getFullYear();
  const nm = String(next.getMonth() + 1).padStart(2, '0');
  const end = `${ny}-${nm}-01 00:00:00`;
  return { start, end };
}

function shortPaymentNote(p) {
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

async function fetchOrderRows(conn, staffId, start, end, forUpdate = false) {
  const lock = forUpdate ? 'FOR UPDATE' : '';
  const [orderRows] = await conn.query(
    `SELECT o.id, o.code, o.completed_at,
            o.total_amount, o.wage_amount, o.status, o.payment_status,
            CASE WHEN o.tech_commission_approved_at IS NOT NULL
                 THEN o.tech_commission_amount ELSE 0 END AS commission_amount,
            (SELECT GROUP_CONCAT(COALESCE(ol.custom_name, t.name) ORDER BY ol.seq SEPARATOR ' + ')
               FROM order_lines ol
               LEFT JOIN order_templates t ON t.id = ol.template_id
              WHERE ol.order_id = o.id AND ol.is_deleted = 0) AS template_name,
            (SELECT GROUP_CONCAT(DISTINCT fv.value ORDER BY fv.id SEPARATOR ', ')
               FROM order_field_values fv
              WHERE fv.order_id = o.id AND fv.is_deleted = 0
                AND fv.label IN ('Bien so xe','Biển số xe')) AS bien_so_list,
            (SELECT GROUP_CONCAT(DISTINCT fv.value ORDER BY fv.id SEPARATOR ', ')
               FROM order_field_values fv
              WHERE fv.order_id = o.id AND fv.is_deleted = 0
                AND fv.label IN ('Ten tai khoan','Tên tài khoản','tai khoan','tài khoản')) AS ten_tk_list,
            (SELECT GROUP_CONCAT(DISTINCT fv.value ORDER BY fv.id SEPARATOR ', ')
               FROM order_field_values fv
              WHERE fv.order_id = o.id AND fv.is_deleted = 0
                AND fv.label IN ('IMEI','Imei','imei')) AS imei_list,
            (SELECT GROUP_CONCAT(DISTINCT fv.value ORDER BY fv.id SEPARATOR ', ')
               FROM order_field_values fv
              WHERE fv.order_id = o.id AND fv.is_deleted = 0
                AND fv.label IN ('So sim moi','Số sim mới','So SIM','Số SIM')) AS so_sim_list
       FROM orders o
      WHERE o.assigned_staff_id = ?
        AND o.is_deleted = 0
        AND o.debt_carried_at IS NULL
        AND o.completed_at >= ? AND o.completed_at < ?
        AND o.completed_at IS NOT NULL
        AND o.status != 'cancelled'
      ORDER BY o.completed_at ASC, o.id ASC ${lock}`,
    [staffId, start, end]
  );
  return orderRows;
}

async function fetchPaymentNotes(conn, orderIds) {
  if (!orderIds.length) return new Map();
  const ph = orderIds.map(() => '?').join(',');
  const [pays] = await conn.query(
    `SELECT order_id, amount, source, paid_at
       FROM order_payments
      WHERE order_id IN (${ph}) AND is_deleted = 0
        AND source <> 'refund' AND confirmed = 1
      ORDER BY paid_at ASC, id ASC`,
    orderIds
  );
  const map = new Map();
  for (const p of pays) {
    const arr = map.get(p.order_id) || [];
    arr.push(p);
    map.set(p.order_id, arr);
  }
  return map;
}

function buildRows(orderRows, payByOrder) {
  return orderRows.map(o => {
    const ps = payByOrder.get(o.id) || [];
    return {
      order_id:       o.id,
      code:           o.code,
      completed_at:   o.completed_at,
      template_name:  o.template_name || '',
      service_label:  o.template_name || '',
      revenue:        Number(o.total_amount) || 0,
      wage:           (Number(o.wage_amount) || 0) + (Number(o.commission_amount) || 0),
      wage_base:      Number(o.wage_amount) || 0,
      commission:     Number(o.commission_amount) || 0,
      row_type:       'order',
      payment_note:   ps.map(shortPaymentNote).filter(Boolean).join(', '),
      status:         o.status,
      payment_status: o.payment_status,
    };
  });
}

async function fetchStaffCommissions(conn, staffId, start, end, forUpdate = false) {
  const lock = forUpdate ? 'FOR UPDATE' : '';
  const [scRows] = await conn.query(
    `SELECT sc.id, sc.order_id, sc.amount, sc.note, sc.approved_at,
            o.code, o.completed_at, o.total_amount, o.status, o.payment_status,
            (SELECT GROUP_CONCAT(COALESCE(ol.custom_name, t.name) ORDER BY ol.seq SEPARATOR ' + ')
               FROM order_lines ol
               LEFT JOIN order_templates t ON t.id = ol.template_id
              WHERE ol.order_id = o.id AND ol.is_deleted = 0) AS template_name
       FROM order_staff_commissions sc
       JOIN orders o ON o.id = sc.order_id
      WHERE sc.staff_id = ? AND sc.is_deleted = 0
        AND sc.carried_at IS NULL
        AND sc.approved_at >= ? AND sc.approved_at < ?
      ORDER BY sc.approved_at ASC, sc.id ASC ${lock}`,
    [staffId, start, end]
  );
  return scRows;
}

// ----------------------------------------------------------
// GET /:id/payroll/history
// ----------------------------------------------------------
router.get('/:id/payroll/history', async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const [rows] = await db.query(
      `SELECT spp.id, spp.period, spp.base_salary, spp.total_revenue,
              spp.total_wage, spp.total_extras, spp.final_amount,
              spp.note, spp.finalized_at, spp.is_deleted,
              spp.unfinalized_at, spp.unfinalized_by,
              f.full_name AS finalized_by_name,
              u.full_name AS unfinalized_by_name
         FROM staff_payroll_periods spp
         LEFT JOIN staff f ON f.id = spp.finalized_by
         LEFT JOIN staff u ON u.id = spp.unfinalized_by
        WHERE spp.staff_id = ?
        ORDER BY spp.period DESC, spp.id DESC`,
      [staffId]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// GET /:id/payroll?period=YYYY-MM
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

    const [snapRows] = await db.query(
      `SELECT spp.*, s.full_name AS finalized_by_name
         FROM staff_payroll_periods spp
         LEFT JOIN staff s ON s.id = spp.finalized_by
        WHERE spp.staff_id = ? AND spp.period = ? AND spp.is_deleted = 0
        ORDER BY spp.id DESC LIMIT 1`,
      [staffId, period]
    );

    // Lay danh sach phieu ung truoc trong ky
    const [advRows] = await db.query(
      `SELECT sa.*, s.full_name AS created_by_name
         FROM staff_advances sa
         LEFT JOIN staff s ON s.id = sa.created_by
        WHERE sa.staff_id = ? AND sa.period = ? AND sa.is_deleted = 0
        ORDER BY sa.created_at ASC`,
      [staffId, period]
    );

    if (snapRows.length) {
      const r = snapRows[0];
      let rows = [], extras = [];
      try { rows   = r.rows_json   ? (typeof r.rows_json   === 'string' ? JSON.parse(r.rows_json)   : r.rows_json)   : []; } catch { rows = []; }
      try { extras = r.extras_json ? (typeof r.extras_json === 'string' ? JSON.parse(r.extras_json) : r.extras_json) : []; } catch { extras = []; }

      return res.json({
        staff, period,
        finalized: true,
        finalized_at:      r.finalized_at,
        finalized_by:      r.finalized_by,
        finalized_by_name: r.finalized_by_name,
        base_salary:       Number(r.base_salary) || 0,
        insurance_amount:  Number(r.insurance_amount) || 0,
        advance_amount:    Number(r.advance_amount) || 0,
        extras, rows,
        advances: advRows,
        totals: {
          revenue: Number(r.total_revenue) || 0,
          wage:    Number(r.total_wage)    || 0,
          extras:  Number(r.total_extras)  || 0,
          final:   Number(r.final_amount)  || 0,
        },
        note: r.note || '',
      });
    }

    // Chua chot
    const orderRows = await fetchOrderRows(db, staffId, start, end);
    const payByOrder = await fetchPaymentNotes(db, orderRows.map(o => o.id));
    const rows = buildRows(orderRows, payByOrder);

    if (staff.role === 'staff') {
      const scRows = await fetchStaffCommissions(db, staffId, start, end);
      for (const sc of scRows) {
        rows.push({
          order_id:       sc.order_id,
          commission_id:  sc.id,
          code:           sc.code,
          completed_at:   sc.approved_at,
          template_name:  sc.template_name || '',
          service_label:  sc.template_name || '',
          revenue:        Number(sc.total_amount) || 0,
          wage:           Number(sc.amount) || 0,
          wage_base:      0,
          commission:     Number(sc.amount) || 0,
          row_type:       'staff_commission',
          note:           sc.note || '',
          payment_note:   '',
          status:         sc.status,
          payment_status: sc.payment_status,
        });
      }
    }

    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    const totalWage    = rows.reduce((s, r) => s + r.wage, 0);
    const totalAdvance = advRows.filter(a => a.status === 'approved').reduce((s, a) => s + (Number(a.amount) || 0), 0);

    res.json({
      staff, period,
      finalized: false,
      base_salary:      0,
      insurance_amount: 0,
      advance_amount:   totalAdvance, // tu dong dien tu phieu ung
      extras: [],
      rows,
      advances: advRows,
      totals: { revenue: totalRevenue, wage: totalWage, extras: 0, final: 0 },
      note: '',
    });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// GET /me/advances?period=YYYY-MM   — NV xem phieu ung cua chinh minh
// ----------------------------------------------------------
router.get('/me/advances', async (req, res, next) => {
  try {
    const staffId = Number(req.user?.sub);
    const period = (req.query.period || '').trim();
    const where = ['sa.staff_id = ?', 'sa.is_deleted = 0'];
    const args = [staffId];
    if (period) { where.push('sa.period = ?'); args.push(period); }
    const [rows] = await db.query(
      `SELECT sa.*, s.full_name AS approved_by_name
         FROM staff_advances sa
         LEFT JOIN staff s ON s.id = sa.approved_by
        WHERE ${where.join(' AND ')}
        ORDER BY sa.period DESC, sa.created_at ASC`,
      args
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /me/advances   — NV tu gui yeu cau ung luong (status=pending)
// ----------------------------------------------------------
router.post('/me/advances', async (req, res, next) => {
  try {
    const staffId = Number(req.user?.sub);
    const period = String(req.body.period || '').trim();
    parsePeriod(period);
    const amount = Math.max(0, Math.round(Number(req.body.amount) || 0));
    const note   = String(req.body.note || '').trim().slice(0, 300);
    if (!amount) return res.status(400).json({ error: 'So tien ung phai lon hon 0' });

    const [snap] = await db.query(
      `SELECT id FROM staff_payroll_periods WHERE staff_id = ? AND period = ? AND is_deleted = 0 LIMIT 1`,
      [staffId, period]
    );
    if (snap.length) return res.status(409).json({ error: 'Ky luong da duoc chot, khong the gui yeu cau ung' });

    const [ins] = await db.query(
      `INSERT INTO staff_advances (staff_id, period, amount, note, created_by, status) VALUES (?,?,?,?,?,'pending')`,
      [staffId, period, amount, note, staffId]
    );
    res.status(201).json({ ok: true, id: ins.insertId });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// GET /advances/pending   — Admin xem tat ca phieu ung dang cho duyet
// ----------------------------------------------------------
router.get('/advances/pending', adminOnly, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT sa.id, sa.staff_id, sa.period, sa.amount, sa.note, sa.created_at, sa.status,
              s.full_name AS staff_name, s.role AS staff_role
         FROM staff_advances sa
         JOIN staff s ON s.id = sa.staff_id
        WHERE sa.status = 'pending' AND sa.is_deleted = 0
        ORDER BY sa.created_at ASC`
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// PATCH /:id/advances/:aid/approve   — Admin duyet phieu ung
// ----------------------------------------------------------
router.patch('/:id/advances/:aid/approve', adminOnly, async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const advId   = Number(req.params.aid);
    const [rows] = await db.query(
      `SELECT id, status, carried_at FROM staff_advances WHERE id = ? AND staff_id = ? AND is_deleted = 0`,
      [advId, staffId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay phieu ung' });
    if (rows[0].status !== 'pending') return res.status(409).json({ error: 'Phieu ung khong o trang thai cho duyet' });
    await db.query(
      `UPDATE staff_advances SET status='approved', approved_by=?, approved_at=NOW() WHERE id=?`,
      [req.user?.sub || null, advId]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// PATCH /:id/advances/:aid/reject   — Admin tu choi phieu ung
// ----------------------------------------------------------
router.patch('/:id/advances/:aid/reject', adminOnly, async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const advId   = Number(req.params.aid);
    const reason  = String(req.body.reason || '').trim().slice(0, 300);
    const [rows] = await db.query(
      `SELECT id, status FROM staff_advances WHERE id = ? AND staff_id = ? AND is_deleted = 0`,
      [advId, staffId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay phieu ung' });
    if (rows[0].status !== 'pending') return res.status(409).json({ error: 'Phieu ung khong o trang thai cho duyet' });
    await db.query(
      `UPDATE staff_advances SET status='rejected', approved_by=?, approved_at=NOW(), reject_reason=? WHERE id=?`,
      [req.user?.sub || null, reason || null, advId]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// GET /:id/advances?period=YYYY-MM
// ----------------------------------------------------------
router.get('/:id/advances', async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const period = (req.query.period || '').trim();
    const where = ['sa.staff_id = ?', 'sa.is_deleted = 0'];
    const args = [staffId];
    if (period) { where.push('sa.period = ?'); args.push(period); }
    const [rows] = await db.query(
      `SELECT sa.*, s.full_name AS created_by_name
         FROM staff_advances sa
         LEFT JOIN staff s ON s.id = sa.created_by
        WHERE ${where.join(' AND ')}
        ORDER BY sa.period DESC, sa.created_at ASC`,
      args
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /:id/advances
// Body: { period, amount, note }
// ----------------------------------------------------------
router.post('/:id/advances', adminOnly, async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const period = String(req.body.period || '').trim();
    parsePeriod(period);
    const amount = Math.max(0, Math.round(Number(req.body.amount) || 0));
    const note   = String(req.body.note || '').trim().slice(0, 300);
    if (!amount) return res.status(400).json({ error: 'So tien ung phai lon hon 0' });

    // Ky da chot thi khong them phieu ung moi
    const [snap] = await db.query(
      `SELECT id FROM staff_payroll_periods WHERE staff_id = ? AND period = ? AND is_deleted = 0 LIMIT 1`,
      [staffId, period]
    );
    if (snap.length) return res.status(409).json({ error: 'Ky luong da duoc chot, khong the them phieu ung' });

    const [ins] = await db.query(
      `INSERT INTO staff_advances (staff_id, period, amount, note, created_by, status, approved_by, approved_at)
       VALUES (?,?,?,?,?,'approved',?,NOW())`,
      [staffId, period, amount, note, req.user?.sub || null, req.user?.sub || null]
    );
    res.status(201).json({ ok: true, id: ins.insertId });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// DELETE /:id/advances/:aid
// ----------------------------------------------------------
router.delete('/:id/advances/:aid', adminOnly, async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const advId   = Number(req.params.aid);
    const [rows] = await db.query(
      `SELECT id, carried_at FROM staff_advances WHERE id = ? AND staff_id = ? AND is_deleted = 0`,
      [advId, staffId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay phieu ung' });
    if (rows[0].carried_at) return res.status(409).json({ error: 'Phieu ung da ket so, khong the xoa' });
    await db.query(`UPDATE staff_advances SET is_deleted = 1 WHERE id = ?`, [advId]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /:id/payroll/finalize
// ----------------------------------------------------------
router.post('/:id/payroll/finalize', adminOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const staffId = Number(req.params.id);
    const period  = String(req.body.period || '').trim();
    const { start, end } = parsePeriod(period);

    const baseSalary = Math.max(0, Math.round(Number(req.body.base_salary)      || 0));
    const insurance  = Math.max(0, Math.round(Number(req.body.insurance_amount) || 0));
    const noteTxt    = String(req.body.note || '').slice(0, 500);

    let extras = Array.isArray(req.body.extras) ? req.body.extras : [];
    extras = extras
      .map(e => ({ note: String(e?.note || '').slice(0, 200), amount: Math.round(Number(e?.amount) || 0) }))
      .filter(e => e.note || e.amount);
    const totalExtras = extras.reduce((s, e) => s + e.amount, 0);

    await conn.beginTransaction();

    const [exist] = await conn.query(
      `SELECT id FROM staff_payroll_periods WHERE staff_id = ? AND period = ? AND is_deleted = 0 FOR UPDATE`,
      [staffId, period]
    );
    if (exist.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'Ky luong nay da duoc chot' });
    }

    const [staffRows] = await conn.query(
      `SELECT id, role FROM staff WHERE id = ? AND is_deleted = 0`, [staffId]
    );
    if (!staffRows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Khong tim thay nhan vien' });
    }

    // Lay phieu ung da duyet chua ket trong ky
    const [advRows] = await conn.query(
      `SELECT id, amount FROM staff_advances WHERE staff_id = ? AND period = ? AND is_deleted = 0 AND carried_at IS NULL AND status = 'approved' FOR UPDATE`,
      [staffId, period]
    );
    // advance_amount = tong phieu ung approved (override tu request neu co, de auto fill)
    const advanceFromRecords = advRows.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const advance = Math.max(0, Math.round(Number(req.body.advance_amount) || advanceFromRecords));

    const orderRows = await fetchOrderRows(conn, staffId, start, end, true);
    const payByOrder = await fetchPaymentNotes(conn, orderRows.map(o => o.id));
    const rowsSnap = buildRows(orderRows, payByOrder);

    if (staffRows[0].role === 'staff') {
      const scRows = await fetchStaffCommissions(conn, staffId, start, end, true);
      for (const sc of scRows) {
        rowsSnap.push({
          order_id:      sc.order_id,
          commission_id: sc.id,
          code:          sc.code,
          completed_at:  sc.approved_at,
          template_name: sc.template_name || '',
          service_label: sc.template_name || '',
          revenue:       Number(sc.total_amount) || 0,
          wage:          Number(sc.amount) || 0,
          wage_base:     0,
          commission:    Number(sc.amount) || 0,
          row_type:      'staff_commission',
          note:          sc.note || '',
          payment_note:  '',
          status:        sc.status,
          payment_status: sc.payment_status,
        });
      }
      const commissionIds = rowsSnap
        .filter(r => r.row_type === 'staff_commission' && r.commission_id)
        .map(r => r.commission_id);
      if (commissionIds.length) {
        const ph2 = commissionIds.map(() => '?').join(',');
        await conn.query(`UPDATE order_staff_commissions SET carried_at = NOW() WHERE id IN (${ph2}) AND carried_at IS NULL`, commissionIds);
      }
    }

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

    if (orderRows.length) {
      const ids = orderRows.map(o => o.id);
      const ph = ids.map(() => '?').join(',');
      await conn.query(`UPDATE orders SET debt_carried_at = NOW() WHERE id IN (${ph}) AND debt_carried_at IS NULL`, ids);
    }

    // Ket phieu ung
    if (advRows.length) {
      const aPh = advRows.map(() => '?').join(',');
      await conn.query(`UPDATE staff_advances SET carried_at = NOW() WHERE id IN (${aPh}) AND carried_at IS NULL`, advRows.map(a => a.id));
    }

    await conn.commit();
    res.status(201).json({
      ok: true, id: ins.insertId,
      orders_count: orderRows.length,
      totals: { revenue: totalRevenue, wage: totalWage, extras: totalExtras, final: finalAmount },
    });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    next(err);
  } finally { conn.release(); }
});

// ----------------------------------------------------------
// POST /:id/payroll/unfinalize
// ----------------------------------------------------------
router.post('/:id/payroll/unfinalize', adminOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const staffId = Number(req.params.id);
    const period  = String(req.body.period || '').trim();
    parsePeriod(period);

    await conn.beginTransaction();

    const [snapRows] = await conn.query(
      `SELECT id, rows_json FROM staff_payroll_periods WHERE staff_id = ? AND period = ? AND is_deleted = 0 FOR UPDATE`,
      [staffId, period]
    );
    if (!snapRows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Chua co phieu luong cho ky nay' });
    }
    const snap = snapRows[0];

    let rows = [];
    try { rows = snap.rows_json ? (typeof snap.rows_json === 'string' ? JSON.parse(snap.rows_json) : snap.rows_json) : []; } catch {}
    const orderIds = rows.filter(r => r.row_type !== 'staff_commission').map(r => Number(r.order_id)).filter(Boolean);
    const commissionIds = rows.filter(r => r.row_type === 'staff_commission' && r.commission_id).map(r => Number(r.commission_id)).filter(Boolean);

    if (orderIds.length) {
      const ph = orderIds.map(() => '?').join(',');
      await conn.query(`UPDATE orders SET debt_carried_at = NULL WHERE id IN (${ph}) AND assigned_staff_id = ?`, [...orderIds, staffId]);
    }
    if (commissionIds.length) {
      const ph2 = commissionIds.map(() => '?').join(',');
      await conn.query(`UPDATE order_staff_commissions SET carried_at = NULL WHERE id IN (${ph2}) AND staff_id = ?`, [...commissionIds, staffId]);
    }

    // Go ket phieu ung trong ky nay
    await conn.query(
      `UPDATE staff_advances SET carried_at = NULL WHERE staff_id = ? AND period = ? AND is_deleted = 0`,
      [staffId, period]
    );

    // Ghi audit trail
    await conn.query(
      `UPDATE staff_payroll_periods SET is_deleted = 1, unfinalized_at = NOW(), unfinalized_by = ? WHERE id = ?`,
      [req.user?.sub || null, snap.id]
    );

    await conn.commit();
    res.json({ ok: true, orders_released: orderIds.length });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    next(err);
  } finally { conn.release(); }
});

module.exports = router;
