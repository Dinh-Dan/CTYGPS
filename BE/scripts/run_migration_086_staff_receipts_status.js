// Chay migration them cot status cho staff_receipts (migration 086b)
// Dung tren VPS neu chua co cot nay.
// An toan: bo qua neu cot da ton tai.
// Lenh: node scripts/run_migration_086_staff_receipts_status.js

require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'gpsviet',
    multipleStatements: true,
  });

  const steps = [
    {
      desc: 'Them cot status vao staff_receipts',
      sql:  `ALTER TABLE staff_receipts
               ADD COLUMN status ENUM('active','cancelled') NOT NULL DEFAULT 'active' AFTER reviewed`,
    },
    {
      desc: 'Them cot cancel_reason',
      sql:  `ALTER TABLE staff_receipts ADD COLUMN cancel_reason TEXT NULL`,
    },
    {
      desc: 'Them cot cancelled_by',
      sql:  `ALTER TABLE staff_receipts ADD COLUMN cancelled_by INT NULL`,
    },
    {
      desc: 'Them cot cancelled_at',
      sql:  `ALTER TABLE staff_receipts ADD COLUMN cancelled_at DATETIME NULL`,
    },
    {
      desc: 'Them index idx_sr_status',
      sql:  `ALTER TABLE staff_receipts ADD INDEX idx_sr_status (status, created_at)`,
    },
  ];

  let ok = 0, skip = 0;
  for (const step of steps) {
    try {
      await conn.query(step.sql);
      console.log(`[OK]   ${step.desc}`);
      ok++;
    } catch (err) {
      // 1060 = Duplicate column, 1061 = Duplicate key name -> da co, bo qua
      if (err.errno === 1060 || err.errno === 1061) {
        console.log(`[SKIP] ${step.desc} (da ton tai)`);
        skip++;
      } else {
        console.error(`[ERR]  ${step.desc}: ${err.message}`);
        await conn.end();
        process.exit(1);
      }
    }
  }

  await conn.end();
  console.log(`\nHoan tat: ${ok} them moi, ${skip} bo qua.`);
  process.exit(0);
})();
