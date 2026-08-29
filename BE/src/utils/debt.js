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
       (SELECT COUNT(*) FROM order_lines ol WHERE ol.order_id = o.id) AS item_count,
       (SELECT GROUP_CONCAT(DISTINCT COALESCE(ol.custom_name, t.name)
                            ORDER BY COALESCE(ol.custom_name, t.name) SEPARATOR ' · ')
          FROM order_lines ol
          LEFT JOIN order_templates t ON t.id = ol.template_id
         WHERE ol.order_id = o.id AND ol.is_deleted = 0) AS service_summary,
       (SELECT GROUP_CONCAT(DISTINCT oi.vehicle_plate SEPARATOR ', ')
          FROM order_items oi
         WHERE oi.order_id = o.id
           AND oi.vehicle_plate IS NOT NULL AND oi.vehicle_plate <> '') AS item_vehicle_plates,
       (SELECT GROUP_CONCAT(DISTINCT oi.subscription_account SEPARATOR ', ')
          FROM order_items oi
         WHERE oi.order_id = o.id
           AND oi.subscription_account IS NOT NULL AND oi.subscription_account <> '') AS item_subscription_accounts
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
      // Gom bien so / tai khoan tu order_items + cot tren orders (loai trung)
      const plateSet = new Set();
      if (o.order_vehicle_plate) plateSet.add(String(o.order_vehicle_plate).trim());
      if (o.item_vehicle_plates) String(o.item_vehicle_plates).split(',').forEach(s => { const v = s.trim(); if (v) plateSet.add(v); });
      const accSet = new Set();
      if (o.order_subscription_account) accSet.add(String(o.order_subscription_account).trim());
      if (o.item_subscription_accounts) String(o.item_subscription_accounts).split(',').forEach(s => { const v = s.trim(); if (v) accSet.add(v); });
      pendingOrders.push({
        id: o.id, code: o.code, total_amount: Number(o.total_amount),
        paid_amount: Number(o.paid_amount), unremitted: Number(o.unremitted),
        admin_pending: Number(o.admin_pending), remaining,
        status: o.status, payment_status: o.payment_status,
        confirmed_at: o.confirmed_at, created_at: o.created_at,
        due_at: o.due_at, completed_at: o.completed_at, address: o.address,
        assigned_staff_names: o.assigned_staff_names || '',
        item_count: Number(o.item_count) || 0,
        service_summary: o.service_summary || '',
        vehicle_plates: [...plateSet],
        subscription_accounts: [...accSet],
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

  // Tru phan don da duoc phieu YC dang cho thu bao phu, tranh dem 2 lan
  const [coveredRows] = await conn.query(
    `SELECT pri.target_id AS order_id, SUM(pri.amount) AS covered
       FROM payment_request_items pri
       JOIN payment_requests pr ON pr.id = pri.request_id
      WHERE pri.target_type = 'order'
        AND pr.customer_id = ?
        AND pr.status IN ('pending','partially_paid')
        AND pr.is_deleted = 0
      GROUP BY pri.target_id`,
    [customerId]
  );
  const coveredMap = new Map(coveredRows.map(r => [r.order_id, Number(r.covered)]));

  let adjustedOrderDebt = 0;
  const adjustedPendingOrders = [];
  for (const o of pendingOrders) {
    const covered = coveredMap.get(o.id) || 0;
    const effective = Math.max(0, o.remaining - covered);
    if (effective > 0) {
      adjustedOrderDebt += effective;
      adjustedPendingOrders.push({ ...o, remaining: effective });
    }
  }

  return {
    opening_balance: opening,
    order_debt: adjustedOrderDebt,
    request_debt: prDebt,
    total_debt: opening + adjustedOrderDebt + prDebt,
    pending_orders: adjustedPendingOrders,
    pending_requests: pendingRequests,
    pending_warranty: [],
  };
}

module.exports = {
  DEBT_WHERE,
  calcCustomerDebt
};
