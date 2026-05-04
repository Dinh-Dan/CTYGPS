// State machine + helper sinh code cho warranty_orders.
// Dung trong admin/warranty.js, kithuat warranty endpoint va customer.js.
//
// Flow chuan:
//   pending      -> received | cancelled
//   received     -> recovered | cancelled
//   recovered    -> awaiting_warranty | delivering | cancelled  (cho phep skip gui di)
//   awaiting_warranty -> warranty_done | cancelled
//   warranty_done     -> delivering | cancelled
//   delivering   -> completed | cancelled
//   completed/cancelled la terminal.

const WARRANTY_STATUSES = [
  'pending', 'received', 'recovered', 'awaiting_warranty',
  'warranty_done', 'delivering', 'completed', 'cancelled',
];

const TERMINAL_STATUSES = ['completed', 'cancelled'];

// "Co the no" — duoc tinh vao Rolling Balance khi debt_carried_at IS NULL.
// Chi don da 'completed' moi tinh: don 'delivering' van con dang giao,
// chua chot tien thi chua tinh la no (de admin tat toan khong khoa nham don
// dang trong qua trinh giao).
const DEBT_STATUSES = ['completed'];

const TRANSITIONS = {
  pending:           ['received', 'cancelled'],
  received:          ['recovered', 'cancelled'],
  recovered:         ['awaiting_warranty', 'delivering', 'cancelled'],
  awaiting_warranty: ['warranty_done', 'cancelled'],
  warranty_done:     ['delivering', 'cancelled'],
  delivering:        ['completed', 'cancelled'],
  completed:         [],
  cancelled:         [],
};

function canWarrantyTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

// Sinh code BH-DDMM-NNN. attempt offset cho retry khi gap race.
async function genWarrantyCode(conn, attempt = 0) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `BH-${dd}${mm}-`;
  const [rows] = await conn.query(
    `SELECT code FROM warranty_orders WHERE code LIKE ? ORDER BY code DESC LIMIT 1`,
    [`${prefix}%`]
  );
  let next = 1;
  if (rows.length) {
    const last = rows[0].code.slice(prefix.length);
    next = (parseInt(last) || 0) + 1;
  }
  return prefix + String(next + attempt).padStart(3, '0');
}

// Helper retry tren UNIQUE constraint warranty_orders.code.
async function insertWarrantyWithRetry(conn, fn) {
  const MAX_RETRY = 5;
  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    const code = await genWarrantyCode(conn, attempt);
    try {
      const result = await fn(code);
      return { code, result };
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') continue;
      throw e;
    }
  }
  throw new Error('Khong sinh duoc ma BH sau nhieu lan thu');
}

// Cac loai item hop le trong warranty_order_items.
const ITEM_KINDS = [
  'received_from_customer',  // KTV nhan tu khach
  'sent_to_partner',         // gui di NCC
  'received_back',           // NCC tra ve
  'delivered_to_customer',   // giao tra khach
  'replacement',             // thay the lay tu kho
];

// KTV chi duoc cham 2 loai (luc thu hoi + giao tra). Cac loai khac admin xu ly.
const ITEM_KINDS_FOR_TECH = ['received_from_customer', 'delivered_to_customer'];

// Load items (chua xoa) cua mot don, group theo kind.
async function loadWarrantyItems(connOrDb, warrantyOrderId) {
  const [rows] = await connOrDb.query(
    `SELECT i.id, i.warranty_order_id, i.kind, i.product_id, i.name, i.imei,
            i.qty, i.unit_price, i.note, i.released_at, i.release_receipt_id,
            p.code AS product_code
       FROM warranty_order_items i
       LEFT JOIN products p ON p.id = i.product_id
      WHERE i.warranty_order_id = ? AND i.is_deleted = 0
      ORDER BY i.id ASC`,
    [warrantyOrderId]
  );
  return rows;
}

// Tinh tong gia tri tung kind (chi de hien thi/goi y tren UI;
// KHONG ghi de cost_amount — admin van nhap tay theo lua chon nguoi dung).
function summarizeWarrantyItems(items) {
  const sum = {};
  for (const k of ITEM_KINDS) sum[k] = 0;
  for (const it of items) {
    if (!sum[it.kind]) sum[it.kind] = 0;
    sum[it.kind] += Number(it.qty || 0) * Number(it.unit_price || 0);
  }
  return sum;
}

module.exports = {
  WARRANTY_STATUSES,
  TERMINAL_STATUSES,
  DEBT_STATUSES,
  TRANSITIONS,
  ITEM_KINDS,
  ITEM_KINDS_FOR_TECH,
  canWarrantyTransition,
  genWarrantyCode,
  insertWarrantyWithRetry,
  loadWarrantyItems,
  summarizeWarrantyItems,
};
