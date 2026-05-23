const mysql = require('mysql2');

const conn = mysql.createConnection({
  host: '103.69.96.101',
  user: 'root',
  password: '',
  database: 'gpsviet',
  multipleStatements: true,
});

const sql = `
ALTER TABLE staff_salary_advances
  ADD COLUMN IF NOT EXISTS status        ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approved_at   DATETIME NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS approved_by   INT      NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reject_reason VARCHAR(500) NULL DEFAULT NULL;
`;

conn.query(sql, (err) => {
  if (err) { console.error('LỖI:', err.message); process.exit(1); }
  console.log('OK — thêm status/approved_at/approved_by/reject_reason vào staff_salary_advances');
  conn.end();
});
