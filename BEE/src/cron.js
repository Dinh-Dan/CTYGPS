// Background jobs chay theo setInterval (don gian, khong can lib cron).
// Goi cron.start() 1 lan o server.js sau khi listen.

const db = require('./db');

async function cleanupOldNotifications() {
  try {
    const [r] = await db.query(
      `DELETE FROM notifications WHERE created_at < NOW() - INTERVAL 30 DAY`
    );
    if (r.affectedRows > 0) {
      console.log(`[cron] Xoa ${r.affectedRows} thong bao cu (>30 ngay)`);
    }
  } catch (err) {
    console.warn('[cron] cleanupOldNotifications loi:', err.message);
  }
}

function start() {
  // Chay ngay 1 lan luc khoi dong, sau do moi 6 gio mot lan.
  cleanupOldNotifications();
  setInterval(cleanupOldNotifications, 6 * 60 * 60 * 1000);
}

module.exports = { start };
