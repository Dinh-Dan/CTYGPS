// Bootstrap tai khoan admin mac dinh + set mat khau cho dealer mau.
// Chay 1 lan: `node scripts/init-admin.js`
// Co the chay lai nhieu lan; chi them khi chua co.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/db');

const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin123';
const DEFAULT_DEALER_PASSWORD = process.env.SEED_DEALER_PASSWORD || 'dealer123';

(async () => {
  try {
    // 1) Tao admin mac dinh neu chua co
    const [existing] = await db.query(
      `SELECT id FROM staff WHERE username = ? AND is_deleted = 0 LIMIT 1`,
      [ADMIN_USERNAME]
    );
    if (existing.length) {
      console.log(`[skip] Admin "${ADMIN_USERNAME}" da ton tai (id=${existing[0].id}).`);
    } else {
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      const [r] = await db.query(
        `INSERT INTO staff (username, password_hash, full_name, role)
         VALUES (?, ?, ?, 'admin')`,
        [ADMIN_USERNAME, hash, 'Quan tri vien']
      );
      console.log(`[ok] Da tao admin: username="${ADMIN_USERNAME}", password="${ADMIN_PASSWORD}" (id=${r.insertId})`);
    }

    // 2) Set mat khau mac dinh cho cac dealer chua co password
    const [dealers] = await db.query(
      `SELECT id, code, full_name FROM customers
        WHERE type = 'dealer' AND is_deleted = 0
          AND (password_hash IS NULL OR password_hash = '')`
    );
    if (!dealers.length) {
      console.log('[skip] Khong co dealer nao thieu mat khau.');
    } else {
      for (const d of dealers) {
        const hash = await bcrypt.hash(DEFAULT_DEALER_PASSWORD, 10);
        await db.query(`UPDATE customers SET password_hash = ? WHERE id = ?`, [hash, d.id]);
        console.log(`[ok] Set mat khau cho dealer ${d.code} (${d.full_name}) = "${DEFAULT_DEALER_PASSWORD}"`);
      }
    }

    console.log('\nDone.');
  } catch (err) {
    console.error('[err]', err);
  } finally {
    process.exit(0);
  }
})();
