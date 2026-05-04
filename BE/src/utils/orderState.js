// Helper state machine + tinh tong cho orders
// Dung trong admin/orders.js, customer.js, daily.js, kithuat.js

// Moi don (install/maintenance/warranty/renewal) deu BAT BUOC qua warehouse_released
// truoc khi KTV co the bat dau. Don khong co vat tu van phai bam xuat kho (phieu rong)
// de luu lich su QTV da xuat cai gi cho ai vao luc nao.
// 3 status no (customer_owes / pending_admin_confirm / staff_owes) la "trang thai cuoi"
// nhung co the flip lan nhau khi dong tien thay doi (KTV nop, admin xac nhan, khach tra them).
// done la chot cuoi cung khi paid >= total va khong con unremitted/admin_pending.
const TRANSITIONS = {
  pending_review:        ['new', 'quoted', 'cancelled'],
  new:                   ['assigned', 'cancelled'],
  assigned:              ['warehouse_released', 'cancelled'],
  warehouse_released:    ['in_progress', 'cancelled'],
  in_progress:           ['done', 'customer_owes', 'pending_admin_confirm', 'staff_owes', 'cancelled'],
  customer_owes:         ['pending_admin_confirm', 'staff_owes', 'done', 'cancelled'],
  pending_admin_confirm: ['customer_owes', 'staff_owes', 'done', 'cancelled'],
  staff_owes:            ['customer_owes', 'pending_admin_confirm', 'done', 'cancelled'],
  // Renewal flow: pending_review -> quoted -> awaiting_payment -> payment_reported -> done
  // Nhanh ghi no: quoted -> awaiting_payment (payment_method='debt') -> done (skip payment_reported).
  quoted:                ['awaiting_payment', 'cancelled'],
  awaiting_payment:      ['payment_reported', 'done', 'cancelled'],
  payment_reported:      ['done', 'cancelled'],
  done:                  [],
  cancelled:             [],
};

// Cac status duoc coi la "da hoan thien tac vu KTV" — dung de filter doanh thu, debts, ...
const FINAL_STATUSES = ['done', 'customer_owes', 'pending_admin_confirm', 'staff_owes'];

function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

// Tinh status cuoi cua don dua tren tinh hinh dong tien.
// Goi sau khi: KTV complete task cuoi, admin mark-paid, admin confirm admin-pending,
// admin approve/reject remittance, admin tao/sua/xoa thanh toan thu cong.
//
// Quy uoc:
//   paid          = orders.paid_amount (tien DA vao quy chinh thuc)
//   unremitted    = SUM(collections.amount WHERE remitted=0)        — KTV dang giu
//   admin_pending = SUM(order_payments.amount WHERE source='admin_pending' AND confirmed=0)
//                                                                    — admin chua bam xac nhan
//   total         = orders.total_amount
//
// Uu tien: customer_owes > pending_admin_confirm > staff_owes > done
async function recalcOrderFinalStatus(conn, orderId) {
  const [orderRows] = await conn.query(
    `SELECT id, status, total_amount, paid_amount, debt_carried_at FROM orders
      WHERE id = ? AND is_deleted = 0`,
    [orderId]
  );
  if (!orderRows.length) return null;
  const o = orderRows[0];

  // Don da duoc "ket" vao 1 phieu tat toan cong no (Rolling Balance) -> coi nhu da dong no.
  // Phan no chua tra cua khach da chuyen vao customers.opening_balance, khong tinh tren don nay nua.
  if (o.debt_carried_at) {
    if (o.status !== 'done') {
      await conn.query(`UPDATE orders SET status = 'done' WHERE id = ?`, [orderId]);
    }
    return 'done';
  }

  // Chi tinh khi don da qua giai doan KTV (warehouse_released tro di) va co task done.
  // Giai doan truoc do giu nguyen status — khong tu chuyen sang done/owes.
  if (!['warehouse_released', 'in_progress', 'done', 'customer_owes',
        'pending_admin_confirm', 'staff_owes'].includes(o.status)) {
    return o.status;
  }

  // KTV phai bam "Hoan thanh" (orders.completed_at duoc set) thi moi tinh status cuoi.
  const [oRow] = await conn.query(
    `SELECT completed_at FROM orders WHERE id = ?`, [orderId]
  );
  if (!oRow.length || !oRow[0].completed_at) return o.status;

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

  let next;
  if (effective < total)        next = 'customer_owes';
  else if (adminPending > 0)    next = 'pending_admin_confirm';
  else if (unremitted > 0)      next = 'staff_owes';
  else                          next = 'done';

  if (next !== o.status) {
    await conn.query(`UPDATE orders SET status = ? WHERE id = ?`, [next, orderId]);
  }
  return next;
}

// Tinh lai subtotal (tu order_items) + total (cong order_charges) cho 1 don
// Discount luu amount AM nen chi can SUM het.
// total >= 0 (clamp neu discount qua tay).
async function recalcOrderTotal(conn, orderId) {
  const [items] = await conn.query(
    `SELECT qty, unit_price FROM order_items WHERE order_id = ?`,
    [orderId]
  );
  const [charges] = await conn.query(
    `SELECT amount FROM order_charges WHERE order_id = ? AND is_deleted = 0`,
    [orderId]
  );
  const subtotal = items.reduce((s, it) => s + Number(it.qty) * Number(it.unit_price), 0);
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
// Soft-delete cong lap cu (de giu lich su), chen 1 dong moi neu wage > 0.
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

// Helper retry tren orders.code UNIQUE constraint: caller cung cap fn(code) -> Promise<insertResult>.
// Goi trong transaction; bat ER_DUP_ENTRY de retry voi attempt+1.
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
  canTransition,
  recalcOrderTotal,
  recalcOrderFinalStatus,
  syncLaborCharge,
  TRANSITIONS,
  FINAL_STATUSES,
  genOrderCode,
  insertOrderWithRetry,
};
