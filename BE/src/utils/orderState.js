// Helper cho don hang v3 — mig 056 (status don gian).
//
// Trang thai don (5 gia tri):
//   pending     — khach moi tao, cho admin duyet
//   confirmed   — admin da duyet, gan KTV
//   in_progress — KTV dang lam
//   done        — hoan thanh
//   cancelled   — huy
//
// KTV va admin deu chuyen duoc confirmed/in_progress/done/cancelled.
// Admin duy nhat duoc duyet pending -> confirmed.
// Khong con buoc trung gian (assigned/received/released).
//
// payment_status (cot rieng tu mig 046) khong lien quan status quy trinh.

const PAYMENT_STATUSES = [
  'unpaid', 'partial', 'paid',
  'customer_owes', 'pending_admin_confirm', 'staff_owes',
  'refunded',
];

const SYSTEM_STATUSES = ['pending', 'cancelled'];

// Bo trang thai cung — khop voi mig 056 + bang order_workflow_steps.
const ORDER_STATUSES = ['pending', 'confirmed', 'in_progress', 'done', 'cancelled'];

// Quyen chuyen sang trang thai (theo role)
const STATUS_ROLES = {
  pending:     ['admin', 'customer'],
  confirmed:   ['admin'],
  in_progress: ['admin', 'ktv'],
  done:        ['admin', 'ktv'],
  cancelled:   ['admin'],
};

// Cap chuyen hop le (trong forward direction).
// Cho phep:
//   pending -> confirmed
//   confirmed -> in_progress | cancelled
//   in_progress -> done | cancelled
//   done -> (chot, khong chuyen tiep)
//   * -> cancelled (admin)
const ALLOWED_TRANSITIONS = {
  pending:     ['confirmed', 'cancelled'],
  confirmed:   ['in_progress', 'done', 'cancelled'],
  in_progress: ['done', 'confirmed', 'cancelled'],
  done:        [],
  cancelled:   [],
};

// ----------------------------------------------------------
// Workflow steps (global, doc tu DB de FE hien label)
// ----------------------------------------------------------

let _workflowCache = null;

async function loadWorkflowSteps(conn) {
  if (_workflowCache) return _workflowCache;
  const [rows] = await conn.query(
    `SELECT id, seq, code, label, requires_photo, photo_min_count,
            update_roles, is_terminal, is_system
       FROM order_workflow_steps
      WHERE is_deleted = 0
      ORDER BY seq, id`
  );
  _workflowCache = rows.map(r => ({
    ...r,
    update_roles:   parseRoles(r.update_roles),
    requires_photo: !!r.requires_photo,
    is_terminal:    !!r.is_terminal,
    is_system:      !!r.is_system,
  }));
  return _workflowCache;
}

function clearWorkflowCache() { _workflowCache = null; }

// Alias backward-compat
async function loadTemplateSteps(conn) { return loadWorkflowSteps(conn); }

function parseRoles(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; }
  catch (_) { return []; }
}

function firstStepCode() { return 'confirmed'; }

function isTerminalStatus(_steps, status) {
  return status === 'done' || status === 'cancelled';
}

// Validate chuyen trang thai. Tra ve { ok, error?, step? }
function validateTransition(steps, currentStatus, targetStatus, role) {
  if (!ORDER_STATUSES.includes(targetStatus)) {
    return { ok: false, error: `Trang thai "${targetStatus}" khong hop le` };
  }
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    return { ok: false, error: `Khong the chuyen tu "${currentStatus}" sang "${targetStatus}"` };
  }
  // Role check (admin bypass)
  if (role !== 'admin') {
    const roles = STATUS_ROLES[targetStatus] || [];
    if (!roles.includes(role)) {
      return { ok: false, error: `Vai tro "${role}" khong duoc chuyen sang "${targetStatus}"` };
    }
  }
  const step = steps ? steps.find(s => s.code === targetStatus) : null;
  return { ok: true, step };
}

// ----------------------------------------------------------
// Tinh tien
// ----------------------------------------------------------

// Tinh lai subtotal (tu order_items) + total (cong order_charges).
// Discount luu amount AM nen chi can SUM het.
async function recalcOrderTotal(conn, orderId) {
  const [items] = await conn.query(
    `SELECT qty, unit_price, vat_percent FROM order_items WHERE order_id = ?`,
    [orderId]
  );
  // Công lắp lưu lại de tinh luong KTV, KHONG cong vao total don
  const [charges] = await conn.query(
    `SELECT amount FROM order_charges
      WHERE order_id = ? AND is_deleted = 0 AND label != 'Công lắp'`,
    [orderId]
  );
  // subtotal da bao gom VAT cua tung item — cot "Thanh tien" tren hoa don.
  const subtotal = items.reduce((s, it) => {
    const line = Number(it.qty) * Number(it.unit_price);
    const vat = line * (Number(it.vat_percent) || 0) / 100;
    return s + Math.round(line + vat);
  }, 0);
  const chargeSum = charges.reduce((s, c) => s + Number(c.amount), 0);
  const total = Math.max(0, subtotal + chargeSum);
  await conn.query(
    `UPDATE orders SET subtotal = ?, total_amount = ? WHERE id = ?`,
    [subtotal, total, orderId]
  );
  return { subtotal, total };
}

// Dong bo charge "Cong lap" cua don voi tien cong KTV.
// Goi sau khi admin gan/sua KTV de bill khach thay = wage_amount.
async function syncLaborCharge(conn, orderId, wageAmount) {
  const amount = Number(wageAmount) || 0;
  await conn.query(
    `UPDATE order_charges SET is_deleted = 1
       WHERE order_id = ? AND label = 'Công lắp' AND is_deleted = 0`,
    [orderId]
  );
  if (amount > 0) {
    await conn.query(
      `INSERT INTO order_charges (order_id, kind, label, amount)
       VALUES (?, 'fee', 'Công lắp', ?)`,
      [orderId, amount]
    );
  }
}

// Tinh payment_status dua tren paid_amount + collections + admin_pending vs total_amount.
// Goi sau khi: ghi nhan thanh toan, KTV nop, admin xac nhan admin_pending, refund...
//
// Quy tac:
//   debt_carried_at -> 'paid' (don da duoc ket vao phieu rolling balance)
//   total <= 0 va paid <= 0 -> 'unpaid'
//   effective < total -> 'customer_owes'
//   admin_pending > 0 -> 'pending_admin_confirm'
//   unremitted   > 0 -> 'staff_owes'
//   else paid >= total -> 'paid'; paid > 0 -> 'partial'; else 'unpaid'
async function recalcPaymentStatus(conn, orderId) {
  const [orderRows] = await conn.query(
    `SELECT total_amount, paid_amount, debt_carried_at, payment_status, status
       FROM orders WHERE id = ? AND is_deleted = 0`,
    [orderId]
  );
  if (!orderRows.length) return null;
  const o = orderRows[0];

  const [colSum] = await conn.query(
    `SELECT COALESCE(SUM(amount), 0) AS unremitted
       FROM collections
      WHERE order_id = ? AND remitted = 0 AND is_deleted = 0`,
    [orderId]
  );
  const [pendSum] = await conn.query(
    `SELECT COALESCE(SUM(amount), 0) AS admin_pending
       FROM order_payments
      WHERE order_id = ? AND source = 'admin_pending' AND confirmed = 0 AND is_deleted = 0`,
    [orderId]
  );

  const total        = Number(o.total_amount);
  const paid         = Number(o.paid_amount);
  const unremitted   = Number(colSum[0].unremitted);
  const adminPending = Number(pendSum[0].admin_pending);
  const effective    = paid + unremitted + adminPending;

  // Don da ket vao phieu rolling balance (debt_carried_at IS NOT NULL):
  // No chuyen sang customers.opening_balance roi. Don khong con trong bang cong no
  // (vi DEBT_WHERE loc debt_carried_at IS NULL), nhung payment_status van the hien dung.
  if (o.debt_carried_at) {
    const next = (total <= 0 || paid >= total) ? 'paid' : 'customer_owes';
    if (next !== o.payment_status) {
      await conn.query(`UPDATE orders SET payment_status = ? WHERE id = ?`, [next, orderId]);
    }
    return next;
  }

  // Chi don da hoan thanh (status='done') moi duoc tag 'customer_owes'.
  // Don confirmed/in_progress chua chot don, khach tra thieu chi la 'partial'/'unpaid'.
  let next;
  if (total <= 0 && paid <= 0)  next = 'unpaid';
  else if (effective < total && o.status === 'done') next = 'customer_owes';
  else if (adminPending > 0)    next = 'pending_admin_confirm';
  else if (unremitted > 0)      next = 'staff_owes';
  else if (paid >= total)       next = 'paid';
  else if (paid > 0)            next = 'partial';
  else                          next = 'unpaid';

  if (next !== o.payment_status) {
    await conn.query(`UPDATE orders SET payment_status = ? WHERE id = ?`, [next, orderId]);
  }
  return next;
}

// ----------------------------------------------------------
// Sinh ma don
// ----------------------------------------------------------

// Sinh code don ORD-DDMM-NNN. attempt offset cho retry khi gap race.
async function genOrderCode(conn, attempt = 0) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `ORD-${dd}${mm}-`;
  const [rows] = await conn.query(
    `SELECT code FROM orders WHERE code LIKE ? ORDER BY code DESC LIMIT 1`,
    [`${prefix}%`]
  );
  let next = 1;
  if (rows.length) {
    const last = rows[0].code.slice(prefix.length);
    next = (parseInt(last) || 0) + 1;
  }
  return prefix + String(next + attempt).padStart(3, '0');
}

// Helper retry tren orders.code UNIQUE constraint.
async function insertOrderWithRetry(conn, fn) {
  const MAX_RETRY = 5;
  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    const code = await genOrderCode(conn, attempt);
    try {
      const result = await fn(code);
      return { code, result };
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') continue;
      throw e;
    }
  }
  throw new Error('Khong sinh duoc ma don sau nhieu lan thu');
}

module.exports = {
  // workflow
  loadWorkflowSteps,
  clearWorkflowCache,
  loadTemplateSteps, // alias
  firstStepCode,
  isTerminalStatus,
  validateTransition,
  // money
  recalcOrderTotal,
  syncLaborCharge,
  recalcPaymentStatus,
  // code
  genOrderCode,
  insertOrderWithRetry,
  // const
  PAYMENT_STATUSES,
  SYSTEM_STATUSES,
  ORDER_STATUSES,
  STATUS_ROLES,
  ALLOWED_TRANSITIONS,
};
