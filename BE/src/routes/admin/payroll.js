// /api/admin/staff/:id — Phieu luong (payslips) + Ung luong (advances)
//
// GET    /:id/payslip/draft          -> du lieu draft ky moi
// POST   /:id/payslip/finalize       -> chot phieu luong
// POST   /:id/payslip/:sid/pay       -> phat luong
// GET    /:id/payslip/:sid/view      -> data public cho trang xem/in (khong can auth)
// DELETE /:id/payslip/:sid           -> xoa phieu (neu chua phat)
// GET    /:id/payslip/list           -> danh sach phieu
//
// GET    /:id/advance/list           -> danh sach ung luong chua ket
// POST   /:id/advance                -> tao phieu ung luong
// DELETE /:id/advance/:aid           -> xoa phieu ung luong (neu chua ket)

const express = require('express');
const db      = require('../../db');
const { requireRole } = require('../../middleware/auth');

const router   = express.Router({ mergeParams: true });
const adminOnly = requireRole('admin');

function httpErr(status, msg) { const e = new Error(msg); e.status = status; return e; }

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function dateRange(from, to) {
  const fromStart = `${from} 00:00:00`;
  const next = new Date(to); next.setDate(next.getDate() + 1);
  return { fromStart, toEnd: `${fmtDate(next)} 00:00:00` };
}

function shortPay(p) {
  const d = new Date(p.paid_at);
  if (isNaN(d)) return null;
  const amt = Number(p.amount) || 0;
  const amtFmt = new Intl.NumberFormat('vi-VN').format(amt) + 'đ';
  const kind = (p.source === 'staff_collection' || p.source === 'admin_pending') ? 'CK' : 'TM';
  return `${d.getDate()}/${d.getMonth()+1} ${kind} ${amtFmt}`;
}

async function fetchOrders(conn, staffId, fromStart, toEnd, lock = false) {
  const [rows] = await conn.query(
    `SELECT o.id, o.code, o.completed_at,
            o.total_amount, o.wage_amount,
            CASE WHEN o.tech_commission_approved_at IS NOT NULL
                 THEN o.tech_commission_amount ELSE 0 END AS commission_amount,
            (SELECT GROUP_CONCAT(COALESCE(ol.custom_name, t.name) ORDER BY ol.seq SEPARATOR ' + ')
               FROM order_lines ol LEFT JOIN order_templates t ON t.id=ol.template_id
              WHERE ol.order_id=o.id AND ol.is_deleted=0) AS service_name,
            (SELECT GROUP_CONCAT(DISTINCT fv.value ORDER BY fv.id SEPARATOR ', ')
               FROM order_field_values fv
              WHERE fv.order_id=o.id AND fv.is_deleted=0
                AND fv.label IN ('Bien so xe','Biển số xe')) AS bien_so,
            (SELECT GROUP_CONCAT(DISTINCT fv.value ORDER BY fv.id SEPARATOR ', ')
               FROM order_field_values fv
              WHERE fv.order_id=o.id AND fv.is_deleted=0
                AND fv.label IN ('IMEI','Imei','imei')) AS imei,
            (SELECT GROUP_CONCAT(DISTINCT fv.value ORDER BY fv.id SEPARATOR ', ')
               FROM order_field_values fv
              WHERE fv.order_id=o.id AND fv.is_deleted=0
                AND fv.label IN ('Ten tai khoan','Tên tài khoản','tai khoan','tài khoản','Tai khoan')) AS tai_khoan
       FROM orders o
      WHERE o.assigned_staff_id=? AND o.is_deleted=0
        AND o.debt_carried_at IS NULL
        AND o.completed_at >= ? AND o.completed_at < ?
        AND o.status='done'
      ORDER BY o.completed_at ASC, o.id ASC${lock ? ' FOR UPDATE' : ''}`,
    [staffId, fromStart, toEnd]
  );
  return rows;
}

async function fetchPayNotes(conn, orderIds) {
  if (!orderIds.length) return new Map();
  const ph = orderIds.map(() => '?').join(',');
  const [pays] = await conn.query(
    `SELECT order_id, amount, source, paid_at FROM order_payments
      WHERE order_id IN (${ph}) AND is_deleted=0 AND source<>'refund' AND confirmed=1
      ORDER BY paid_at ASC`, orderIds
  );
  const m = new Map();
  for (const p of pays) { const a = m.get(p.order_id) || []; a.push(p); m.set(p.order_id, a); }
  return m;
}

async function fetchCommissions(conn, staffId, fromStart, toEnd, lock = false) {
  const [rows] = await conn.query(
    `SELECT sc.id, sc.order_id, sc.amount, sc.note, sc.approved_at,
            o.code, o.total_amount,
            (SELECT GROUP_CONCAT(COALESCE(ol.custom_name,t.name) ORDER BY ol.seq SEPARATOR ' + ')
               FROM order_lines ol LEFT JOIN order_templates t ON t.id=ol.template_id
              WHERE ol.order_id=o.id AND ol.is_deleted=0) AS service_name
       FROM order_staff_commissions sc
       JOIN orders o ON o.id=sc.order_id
      WHERE sc.staff_id=? AND sc.is_deleted=0 AND sc.carried_at IS NULL
        AND sc.approved_at >= ? AND sc.approved_at < ?
      ORDER BY sc.approved_at ASC, sc.id ASC${lock ? ' FOR UPDATE' : ''}`,
    [staffId, fromStart, toEnd]
  );
  return rows;
}

// Lay tong ung luong chua ket cua nhan vien
async function fetchPendingAdvances(conn, staffId) {
  const [rows] = await conn.query(
    `SELECT id, amount, note, created_at
       FROM staff_salary_advances
      WHERE staff_id=? AND is_deleted=0 AND carried_at IS NULL
      ORDER BY created_at ASC`,
    [staffId]
  );
  return rows;
}

function buildRows(orders, payMap) {
  return orders.map(o => {
    const notes = (payMap.get(o.id) || []).map(shortPay).filter(Boolean).join(', ');
    return {
      order_id:    o.id,
      code:        o.code,
      date:        o.completed_at,
      service:     o.service_name || '',
      bien_so:     o.bien_so || '',
      imei:        o.imei || '',
      tai_khoan:   o.tai_khoan || '',
      revenue:     Number(o.total_amount) || 0,
      wage:        (Number(o.wage_amount) || 0) + (Number(o.commission_amount) || 0),
      pay_note:    notes,
      row_type:    'order',
    };
  });
}

// ----------------------------------------------------------
// GET /:id/payslip/draft
// ?from=YYYY-MM-DD&to=YYYY-MM-DD  (optional override)
// ----------------------------------------------------------
router.get('/:id/payslip/draft', adminOnly, async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const [[staff]] = await db.query(
      `SELECT id, username, full_name, role FROM staff WHERE id=? AND is_deleted=0`, [staffId]
    );
    if (!staff) return res.status(404).json({ error: 'Không tìm thấy nhân viên' });

    let fromDate, toDate;
    toDate = fmtDate(new Date());

    if (req.query.from && req.query.to) {
      fromDate = req.query.from;
      toDate   = req.query.to;
    } else {
      const [[lastSlip]] = await db.query(
        `SELECT to_date FROM staff_payslips
          WHERE staff_id=? AND is_deleted=0 AND finalized_at IS NOT NULL
          ORDER BY to_date DESC, id DESC LIMIT 1`, [staffId]
      );
      if (lastSlip) {
        const d = new Date(lastSlip.to_date);
        d.setDate(d.getDate() + 1);
        fromDate = fmtDate(d);
      } else {
        const [[firstOrder]] = await db.query(
          `SELECT DATE(completed_at) AS d FROM orders
            WHERE assigned_staff_id=? AND is_deleted=0 AND debt_carried_at IS NULL AND status='done'
            ORDER BY completed_at ASC LIMIT 1`, [staffId]
        );
        if (firstOrder?.d) {
          fromDate = firstOrder.d;
        } else {
          const [[firstSC]] = await db.query(
            `SELECT DATE(sc.approved_at) AS d
               FROM order_staff_commissions sc
              WHERE sc.staff_id=? AND sc.is_deleted=0 AND sc.carried_at IS NULL
                AND sc.approved_at IS NOT NULL
              ORDER BY sc.approved_at ASC LIMIT 1`, [staffId]
          );
          if (firstSC?.d) {
            fromDate = firstSC.d;
          } else {
            const d = new Date(); d.setDate(d.getDate() - 30);
            fromDate = fmtDate(d);
          }
        }
      }
    }

    const { fromStart, toEnd } = dateRange(fromDate, toDate);

    // No ky truoc chua hap thu
    const [[debtRow]] = await db.query(
      `SELECT COALESCE(SUM(remaining_debt),0) AS total FROM staff_payslips
        WHERE staff_id=? AND is_deleted=0 AND remaining_debt>0 AND debt_absorbed=0`, [staffId]
    );
    const carriedDebt = Number(debtRow.total) || 0;

    const orders  = await fetchOrders(db, staffId, fromStart, toEnd);
    const payMap  = await fetchPayNotes(db, orders.map(o => o.id));
    const rows    = buildRows(orders, payMap);

    const scRows = await fetchCommissions(db, staffId, fromStart, toEnd);
    for (const sc of scRows) {
      rows.push({
        order_id:  sc.order_id,
        sc_id:     sc.id,
        code:      sc.code,
        date:      sc.approved_at,
        service:   sc.service_name || '',
        bien_so:   '',
        imei:      '',
        tai_khoan: '',
        revenue:   Number(sc.total_amount) || 0,
        wage:      Number(sc.amount) || 0,
        pay_note:  sc.note || '',
        row_type:  'commission',
      });
    }
    if (scRows.length) rows.sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalWage = rows.reduce((s, r) => s + r.wage, 0);

    // Ung luong chua ket
    const advances = await fetchPendingAdvances(db, staffId);
    const totalAdvances = advances.reduce((s, a) => s + (Number(a.amount) || 0), 0);

    res.json({
      staff,
      from_date:      fromDate,
      to_date:        toDate,
      rows,
      total_wage:     totalWage,
      carried_debt:   carriedDebt,
      advances,
      total_advances: totalAdvances,
    });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// GET /:id/payslip/list
// ----------------------------------------------------------
router.get('/:id/payslip/list', adminOnly, async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const [rows] = await db.query(
      `SELECT sp.id, sp.from_date, sp.to_date, sp.base_salary,
              sp.carried_debt, sp.total_wage, sp.total_extras, sp.total_deductions,
              sp.total_advances, sp.advances_json,
              sp.gross_amount, sp.note, sp.finalized_at, sp.paid_amount,
              sp.paid_at, sp.paid_note, sp.remaining_debt, sp.debt_absorbed,
              sp.extras_json, sp.deductions_json, sp.rows_json,
              f.full_name AS finalized_by_name, p.full_name AS paid_by_name
         FROM staff_payslips sp
         LEFT JOIN staff f ON f.id=sp.finalized_by
         LEFT JOIN staff p ON p.id=sp.paid_by
        WHERE sp.staff_id=? AND sp.is_deleted=0
        ORDER BY sp.to_date DESC, sp.id DESC`,
      [staffId]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// GET /:id/payslip/:sid/view  — public, khong can auth admin
// Dung cho trang payslip-view.html chia se qua link
// ----------------------------------------------------------
router.get('/:id/payslip/:sid/view', async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const slipId  = Number(req.params.sid);

    const [[slip]] = await db.query(
      `SELECT sp.*, s.full_name AS staff_name, s.username AS staff_username,
              f.full_name AS finalized_by_name, p.full_name AS paid_by_name
         FROM staff_payslips sp
         JOIN staff s ON s.id=sp.staff_id
         LEFT JOIN staff f ON f.id=sp.finalized_by
         LEFT JOIN staff p ON p.id=sp.paid_by
        WHERE sp.id=? AND sp.staff_id=? AND sp.is_deleted=0`,
      [slipId, staffId]
    );
    if (!slip) return res.status(404).json({ error: 'Không tìm thấy phiếu lương' });

    res.json(slip);
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /:id/payslip/finalize
// Body: { from_date, to_date, base_salary, extras[], deductions[], note }
// ----------------------------------------------------------
router.post('/:id/payslip/finalize', adminOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const staffId  = Number(req.params.id);
    const fromDate = String(req.body.from_date || '').trim();
    const toDate   = String(req.body.to_date   || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate))
      return res.status(400).json({ error: 'from_date / to_date sai định dạng YYYY-MM-DD' });
    if (fromDate > toDate)
      return res.status(400).json({ error: 'from_date phải nhỏ hơn to_date' });

    const baseSalary = Math.max(0, Math.round(Number(req.body.base_salary) || 0));
    const noteTxt    = String(req.body.note || '').slice(0, 500);

    let extras = (Array.isArray(req.body.extras) ? req.body.extras : [])
      .map(e => ({ label: String(e?.label||'').slice(0,100), amount: Math.round(Number(e?.amount)||0) }))
      .filter(e => e.label || e.amount);

    let deductions = (Array.isArray(req.body.deductions) ? req.body.deductions : [])
      .map(e => ({ label: String(e?.label||'').slice(0,100), amount: Math.round(Number(e?.amount)||0) }))
      .filter(e => e.label || e.amount);

    const totalExtras     = extras.reduce((s, e) => s + e.amount, 0);
    const totalDeductions = deductions.reduce((s, e) => s + e.amount, 0);

    const { fromStart, toEnd } = dateRange(fromDate, toDate);

    await conn.beginTransaction();

    const [[staffRow]] = await conn.query(
      `SELECT id, role FROM staff WHERE id=? AND is_deleted=0`, [staffId]
    );
    if (!staffRow) { await conn.rollback(); return res.status(404).json({ error: 'Không tìm thấy nhân viên' }); }

    // Kiem tra trung ky
    const [[overlap]] = await conn.query(
      `SELECT id, from_date, to_date FROM staff_payslips
        WHERE staff_id=? AND is_deleted=0
          AND from_date <= ? AND to_date >= ?
        LIMIT 1`, [staffId, toDate, fromDate]
    );
    if (overlap) {
      await conn.rollback();
      return res.status(409).json({
        error: `Khoảng ngày bị trùng với phiếu lương đã tạo (${overlap.from_date} → ${overlap.to_date})`,
      });
    }

    // No ky truoc
    const [[debtRow]] = await conn.query(
      `SELECT COALESCE(SUM(remaining_debt),0) AS total, GROUP_CONCAT(id) AS ids
         FROM staff_payslips
        WHERE staff_id=? AND is_deleted=0 AND remaining_debt>0 AND debt_absorbed=0`, [staffId]
    );
    const carriedDebt = Number(debtRow.total) || 0;
    const debtIds = debtRow.ids ? debtRow.ids.split(',').map(Number) : [];

    // Don hang
    const orders  = await fetchOrders(conn, staffId, fromStart, toEnd, true);
    const payMap  = await fetchPayNotes(conn, orders.map(o => o.id));
    const rows    = buildRows(orders, payMap);

    const scIds = [];
    const scRows2 = await fetchCommissions(conn, staffId, fromStart, toEnd, true);
    for (const sc of scRows2) {
      scIds.push(sc.id);
      rows.push({
        order_id: sc.order_id, sc_id: sc.id, code: sc.code,
        date: sc.approved_at, service: sc.service_name || '',
        bien_so: '', imei: '', tai_khoan: '',
        revenue: Number(sc.total_amount) || 0, wage: Number(sc.amount) || 0,
        pay_note: sc.note || '', row_type: 'commission',
      });
    }
    if (scRows2.length) rows.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Ung luong chua ket
    const advances = await fetchPendingAdvances(conn, staffId);
    const advanceIds    = advances.map(a => a.id);
    const totalAdvances = advances.reduce((s, a) => s + (Number(a.amount) || 0), 0);

    const totalWage   = rows.reduce((s, r) => s + r.wage, 0);
    const grossAmount = baseSalary + totalWage + totalExtras - totalDeductions - totalAdvances + carriedDebt;

    const [ins] = await conn.query(
      `INSERT INTO staff_payslips
        (staff_id, from_date, to_date, base_salary,
         extras_json, deductions_json, carried_debt,
         rows_json, total_wage, total_extras, total_deductions,
         total_advances, advances_json,
         gross_amount, note, finalized_by, finalized_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
      [
        staffId, fromDate, toDate, baseSalary,
        JSON.stringify(extras), JSON.stringify(deductions), carriedDebt,
        JSON.stringify(rows), totalWage, totalExtras, totalDeductions,
        totalAdvances, JSON.stringify(advances),
        grossAmount, noteTxt, req.user?.sub || null,
      ]
    );
    const newId = ins.insertId;

    // Danh dau don da ket so + gan payslip_id
    if (orders.length) {
      const ph = orders.map(() => '?').join(',');
      await conn.query(
        `UPDATE orders SET debt_carried_at=NOW(), payslip_id=? WHERE id IN (${ph}) AND debt_carried_at IS NULL`,
        [newId, ...orders.map(o => o.id)]
      );
    }
    // Danh dau commission da ket so + gan payslip_id
    if (scIds.length) {
      const ph = scIds.map(() => '?').join(',');
      await conn.query(
        `UPDATE order_staff_commissions SET carried_at=NOW(), payslip_id=? WHERE id IN (${ph}) AND carried_at IS NULL`,
        [newId, ...scIds]
      );
    }
    // Danh dau advance da ket + gan payslip_id
    if (advanceIds.length) {
      const ph = advanceIds.map(() => '?').join(',');
      await conn.query(
        `UPDATE staff_salary_advances SET carried_at=NOW(), payslip_id=? WHERE id IN (${ph}) AND carried_at IS NULL`,
        [newId, ...advanceIds]
      );
    }
    // Danh dau no cu da duoc hap thu
    if (debtIds.length) {
      const ph = debtIds.map(() => '?').join(',');
      await conn.query(`UPDATE staff_payslips SET debt_absorbed=1 WHERE id IN (${ph})`, debtIds);
    }

    await conn.commit();
    res.status(201).json({
      ok: true, id: newId,
      orders_count: orders.length,
      gross_amount: grossAmount,
    });
  } catch (err) { try { await conn.rollback(); } catch {} next(err); }
  finally { conn.release(); }
});

// ----------------------------------------------------------
// POST /:id/payslip/:sid/pay
// Body: { amount, note }
// ----------------------------------------------------------
router.post('/:id/payslip/:sid/pay', adminOnly, async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const slipId  = Number(req.params.sid);
    const amount  = Math.max(0, Math.round(Number(req.body.amount) || 0));
    const note    = String(req.body.note || '').slice(0, 300);

    const [[slip]] = await db.query(
      `SELECT id, gross_amount, paid_amount FROM staff_payslips
        WHERE id=? AND staff_id=? AND is_deleted=0 AND finalized_at IS NOT NULL`,
      [slipId, staffId]
    );
    if (!slip) return res.status(404).json({ error: 'Không tìm thấy phiếu lương' });
    if (slip.paid_amount > 0) return res.status(409).json({ error: 'Phiếu này đã phát lương rồi' });
    if (!amount) return res.status(400).json({ error: 'Số tiền phải lớn hơn 0' });

    const remaining = Math.max(0, Number(slip.gross_amount) - amount);
    await db.query(
      `UPDATE staff_payslips
          SET paid_amount=?, paid_note=?, paid_by=?, paid_at=NOW(), remaining_debt=?
        WHERE id=?`,
      [amount, note || null, req.user?.sub || null, remaining, slipId]
    );
    res.json({ ok: true, paid_amount: amount, remaining_debt: remaining });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// DELETE /:id/payslip/:sid
// ----------------------------------------------------------
router.delete('/:id/payslip/:sid', adminOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const staffId = Number(req.params.id);
    const slipId  = Number(req.params.sid);

    await conn.beginTransaction();
    const [[slip]] = await conn.query(
      `SELECT id, rows_json, advances_json, from_date, to_date, paid_amount FROM staff_payslips
        WHERE id=? AND staff_id=? AND is_deleted=0 FOR UPDATE`,
      [slipId, staffId]
    );
    if (!slip) { await conn.rollback(); return res.status(404).json({ error: 'Không tìm thấy phiếu lương' }); }
    if (slip.paid_amount > 0) { await conn.rollback(); return res.status(409).json({ error: 'Phiếu đã phát lương, không thể xóa' }); }

    // Giai phong don hang
    let rows = [];
    try { rows = slip.rows_json ? JSON.parse(slip.rows_json) : []; } catch {}
    const orderIds = rows.filter(r => r.row_type === 'order').map(r => r.order_id).filter(Boolean);
    const scIds    = rows.filter(r => r.row_type === 'commission').map(r => r.sc_id).filter(Boolean);

    if (orderIds.length) {
      const ph = orderIds.map(() => '?').join(',');
      await conn.query(
        `UPDATE orders SET debt_carried_at=NULL, payslip_id=NULL WHERE id IN (${ph})`,
        orderIds
      );
    }
    if (scIds.length) {
      const ph = scIds.map(() => '?').join(',');
      await conn.query(
        `UPDATE order_staff_commissions SET carried_at=NULL, payslip_id=NULL WHERE id IN (${ph})`,
        scIds
      );
    }

    // Giai phong advance
    let advances = [];
    try { advances = slip.advances_json ? JSON.parse(slip.advances_json) : []; } catch {}
    const advanceIds = advances.map(a => a.id).filter(Boolean);
    if (advanceIds.length) {
      const ph = advanceIds.map(() => '?').join(',');
      await conn.query(
        `UPDATE staff_salary_advances SET carried_at=NULL, payslip_id=NULL WHERE id IN (${ph})`,
        advanceIds
      );
    }

    // Khoi phuc no ky truoc
    await conn.query(
      `UPDATE staff_payslips SET debt_absorbed=0
        WHERE staff_id=? AND debt_absorbed=1 AND is_deleted=0
          AND to_date < ?`, [staffId, slip.from_date]
    );

    await conn.query(`UPDATE staff_payslips SET is_deleted=1 WHERE id=?`, [slipId]);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) { try { await conn.rollback(); } catch {} next(err); }
  finally { conn.release(); }
});

// ----------------------------------------------------------
// GET /:id/advance/list
// ----------------------------------------------------------
router.get('/:id/advance/list', adminOnly, async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const [rows] = await db.query(
      `SELECT a.id, a.amount, a.note, a.payslip_id, a.carried_at,
              a.created_at, c.full_name AS created_by_name
         FROM staff_salary_advances a
         LEFT JOIN staff c ON c.id=a.created_by
        WHERE a.staff_id=? AND a.is_deleted=0
        ORDER BY a.created_at DESC`,
      [staffId]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /:id/advance
// Body: { amount, note }
// ----------------------------------------------------------
router.post('/:id/advance', adminOnly, async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const amount  = Math.max(1, Math.round(Number(req.body.amount) || 0));
    const note    = String(req.body.note || '').slice(0, 300);

    if (!amount) return res.status(400).json({ error: 'Số tiền phải lớn hơn 0' });

    const [[staff]] = await db.query(
      `SELECT id FROM staff WHERE id=? AND is_deleted=0`, [staffId]
    );
    if (!staff) return res.status(404).json({ error: 'Không tìm thấy nhân viên' });

    const [ins] = await db.query(
      `INSERT INTO staff_salary_advances (staff_id, amount, note, created_by, created_at)
       VALUES (?,?,?,?,NOW())`,
      [staffId, amount, note || null, req.user?.sub || null]
    );
    res.status(201).json({ ok: true, id: ins.insertId, amount, note });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// DELETE /:id/advance/:aid
// ----------------------------------------------------------
router.delete('/:id/advance/:aid', adminOnly, async (req, res, next) => {
  try {
    const staffId   = Number(req.params.id);
    const advanceId = Number(req.params.aid);

    const [[adv]] = await db.query(
      `SELECT id, carried_at FROM staff_salary_advances
        WHERE id=? AND staff_id=? AND is_deleted=0`,
      [advanceId, staffId]
    );
    if (!adv) return res.status(404).json({ error: 'Không tìm thấy phiếu ứng lương' });
    if (adv.carried_at) return res.status(409).json({ error: 'Phiếu này đã được kết vào phiếu lương, không thể xóa' });

    await db.query(`UPDATE staff_salary_advances SET is_deleted=1 WHERE id=?`, [advanceId]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
