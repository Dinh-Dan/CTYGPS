const mysql = require('mysql2');

const conn = mysql.createConnection({
  host: '103.69.96.101',
  user: 'root',
  password: '',
  database: 'gpsviet',
  multipleStatements: true,
});

const sql = `
DROP TABLE IF EXISTS order_logs;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS progress_note TEXT NULL;
`;

conn.query(sql, (err) => {
  if (err) { console.error('LỖI:', err.message); process.exit(1); }
  console.log('OK — xoá order_logs, thêm progress_note vào orders');
  conn.end();
});
