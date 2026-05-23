const mysql = require('mysql2');
const fs    = require('fs');
const path  = require('path');

const conn = mysql.createConnection({
  host: '103.69.96.101',
  user: 'root',
  password: '',
  database: 'gpsviet',
  multipleStatements: true,
});

const sql = fs.readFileSync(
  path.join(__dirname, '../src/db/migration_084_payroll_draft_adjustments.sql'),
  'utf8'
);

conn.query(sql, (err) => {
  if (err) { console.error('LỖI:', err.message); process.exit(1); }
  console.log('OK — tạo bảng staff_payroll_adjustments');
  conn.end();
});
