const db = require('../db');

const DEBT_WHERE = `o.status = 'done' AND o.payment_status != 'paid'`;

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
    const remaining = Number(o.total_amount) - Number(o.paid_amount);
    if (remaining > 0) {
      orderDebt += remaining;
      pendingOrders.push({
        id: o.id, code: o.code, total_amount: Number(o.total_amount),
        paid_amount: Number(o.paid_amount), unremitted: Number(o.unremitted),
        admin_pending: Number(o.admin_pending), remaining,
        status: o.status, payment_status: o.payment_status,
        confirmed_at: o.confirmed_at, created_at: o.created_at,
        due_at: o.due_at, completed_at: o.completed_at, address: o.address,
        assigned_staff_names: o.assigned_staff_names || '',
        item_count: Number(o.item_count) || 0,
      });
    }
  }

  const [prRows] = await conn.query(
    `SELECT id, code, total_amount, remaining, status, created_at
       FROM payment_requests
      WHERE customer_id = ? AND status IN ('pending','partially_paid') AND is_deleted = 0`,
    [customerId]
  );
  let prDebt = 0;
  const pendingRequests = [];
  for (const pr of prRows) {
    // Phieu pending: remaining = total_amount (chua nhan tien); partially_paid: remaining thuc te
    const eff = pr.status === 'pending' ? Number(pr.total_amount) : Number(pr.remaining);
    if (eff <= 0) continue;
    prDebt += eff;
    pendingRequests.push({
      id: pr.id, code: pr.code, remaining: eff, status: pr.status,
      created_at: pr.created_at, type: 'payment_request'
    });
  }

  return {
    opening_balance: opening,
    order_debt: orderDebt,
    request_debt: prDebt,
    total_debt: opening + orderDebt + prDebt,
    pending_orders: pendingOrders,
    pending_requests: pendingRequests,
    pending_warranty: [],
  };
}

module.exports = {
  DEBT_WHERE,
  calcCustomerDebt
};
