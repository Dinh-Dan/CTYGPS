// Helper tao notification cho admin + emit socket.io realtime.
// Cach dung:
//   const notify = require('../utils/notify');
//   await notify.create(conn, {
//     type: 'order_completed',
//     title: 'ORD-2804-003: KTV hoan thanh',
//     message: 'Le Van Hung — 123.000d',
//     link_url: '/admin/orders.html#order-123',
//     ref_order_id: 123,
//     ref_customer_id: 45,
//     ref_staff_id: 12,
//   });
//
// Dung trong transaction: truyen `conn` (mysql2 connection). Neu khong
// trong transaction co the truyen `db` truc tiep.
//
// Socket emit: chi emit khi tao thanh cong (sau insert), goi global.io
// neu co. Khong throw neu socket loi.

function buildPayload(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    link_url: row.link_url,
    ref_order_id: row.ref_order_id,
    ref_customer_id: row.ref_customer_id,
    ref_staff_id: row.ref_staff_id,
    is_read: 0,
    created_at: row.created_at || new Date().toISOString(),
  };
}

async function create(conn, data) {
  const type    = String(data.type || '').slice(0, 50);
  const title   = String(data.title || '').slice(0, 255);
  const message = String(data.message || '').slice(0, 500);
  if (!type || !title || !message) {
    // Khong throw — notification la phu, khong duoc lam fail business
    console.warn('[notify] thieu type/title/message, bo qua:', data);
    return null;
  }
  const link_url        = data.link_url ? String(data.link_url).slice(0, 500) : null;
  const ref_order_id    = data.ref_order_id    || null;
  const ref_customer_id = data.ref_customer_id || null;
  const ref_staff_id    = data.ref_staff_id    || null;

  try {
    const [r] = await conn.query(
      `INSERT INTO notifications
        (type, title, message, link_url, ref_order_id, ref_customer_id, ref_staff_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [type, title, message, link_url, ref_order_id, ref_customer_id, ref_staff_id]
    );
    const id = r.insertId;

    // Emit realtime (best-effort). Khong cho throw lam fail business.
    try {
      if (global.io) {
        global.io.to('admin').emit('admin:notification', buildPayload({
          id, type, title, message, link_url,
          ref_order_id, ref_customer_id, ref_staff_id,
          created_at: new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('[notify] emit socket loi:', err && err.message);
    }

    return id;
  } catch (err) {
    console.warn('[notify] insert loi:', err && err.message);
    return null;
  }
}

module.exports = { create };
