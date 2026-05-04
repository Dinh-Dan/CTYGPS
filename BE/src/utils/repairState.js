// State machine + helper sinh code cho repair_orders.
// Dung trong admin/repair.js, customer.js (khach tao + duyet bao gia)
// va kithuat.js (KTV nhan may, chan doan, nop bao gia, bao xong, giao tra).
//
// Flow chuan:
//   pending           -> assigned | cancelled
//   assigned          -> diagnosing | cancelled
//   diagnosing        -> quoted | cancelled
//   quoted            -> awaiting_customer | cancelled
//   awaiting_customer -> approved | rejected | cancelled
//   approved          -> repairing | cancelled
//   rejected          -> awaiting_customer | cancelled  (admin sua bao gia gui lai, hoac huy)
//   repairing         -> done | cancelled
//   done              -> delivering   (KHONG cancelled — bill da khoa, da sua xong)
//   delivering        -> completed
//   completed/cancelled la terminal.
//
// Quy tac khoa bill:
//   Khi status = done | delivering | completed -> CHAN moi cap nhat
//   items / charges / service_fee. Admin chi co the cap nhat thanh toan.

const REPAIR_STATUSES = [
  'pending', 'assigned', 'diagnosing', 'quoted', 'awaiting_customer',
  'approved', 'rejected', 'repairing', 'done', 'delivering',
  'completed', 'cancelled',
];

const TERMINAL_STATUSES = ['completed', 'cancelled'];

// Cac status khoa bill (KTV da bao xong, khong cho admin sua items/charges/wage nua).
const BILL_LOCKED_STATUSES = ['done', 'delivering', 'completed'];

// "Co the no" — duoc tinh vao Rolling Balance khi debt_carried_at IS NULL.
// Chi don 'completed' moi tinh.
const DEBT_STATUSES = ['completed'];

const TRANSITIONS = {
  pending:           ['assigned', 'cancelled'],
  assigned:          ['diagnosing', 'cancelled'],
  diagnosing:        ['quoted', 'cancelled'],
  quoted:            ['awaiting_customer', 'cancelled'],
  awaiting_customer: ['approved', 'rejected', 'cancelled'],
  approved:          ['repairing', 'cancelled'],
  rejected:          ['awaiting_customer', 'cancelled'],
  repairing:         ['done', 'cancelled'],
  done:              ['delivering'],
  delivering:        ['completed'],
  completed:         [],
  cancelled:         [],
};

function canRepairTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

function isBillLocked(status) {
  return BILL_LOCKED_STATUSES.includes(status);
}

// Sinh code SC-DDMM-NNN. attempt offset cho retry khi gap race.
async function genRepairCode(conn, attempt = 0) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `SC-${dd}${mm}-`;
  const [rows] = await conn.query(
    `SELECT code FROM repair_orders WHERE code LIKE ? ORDER BY code DESC LIMIT 1`,
    [`${prefix}%`]
  );
  let next = 1;
  if (rows.length) {
    const last = rows[0].code.slice(prefix.length);
    next = (parseInt(last) || 0) + 1;
  }
  return prefix + String(next + attempt).padStart(3, '0');
}

async function insertRepairWithRetry(conn, fn) {
  const MAX_RETRY = 5;
  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    const code = await genRepairCode(conn, attempt);
    try {
      const result = await fn(code);
      return { code, result };
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') continue;
      throw e;
    }
  }
  throw new Error('Khong sinh duoc ma SC sau nhieu lan thu');
}

// Tinh lai parts_total + total_amount tu repair_items + repair_charges.
// LUU Y: service_fee KHONG cong rieng — no da xuat hien trong repair_charges
// duoi dang charge ('service', 'Công sửa', amount = service_fee) qua syncServiceFeeCharge.
// Goi ham nay sau moi lan thay doi items / charges / service_fee.
async function recalcRepairTotal(conn, repairOrderId) {
  const [itemRows] = await conn.query(
    `SELECT COALESCE(SUM(qty * unit_price), 0) AS s
       FROM repair_items
      WHERE repair_order_id = ? AND is_deleted = 0`,
    [repairOrderId]
  );
  const partsTotal = Number(itemRows[0].s) || 0;

  const [chargeRows] = await conn.query(
    `SELECT COALESCE(SUM(amount), 0) AS s
       FROM repair_charges
      WHERE repair_order_id = ? AND is_deleted = 0`,
    [repairOrderId]
  );
  const chargesTotal = Number(chargeRows[0].s) || 0;

  const total = partsTotal + chargesTotal;
  await conn.query(
    `UPDATE repair_orders
        SET parts_total = ?, total_amount = ?
      WHERE id = ?`,
    [partsTotal, total, repairOrderId]
  );
  return { partsTotal, chargesTotal, total };
}

module.exports = {
  REPAIR_STATUSES,
  TERMINAL_STATUSES,
  BILL_LOCKED_STATUSES,
  DEBT_STATUSES,
  TRANSITIONS,
  canRepairTransition,
  isBillLocked,
  genRepairCode,
  insertRepairWithRetry,
  recalcRepairTotal,
};
