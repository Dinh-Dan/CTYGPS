require('dotenv').config();
const mysql = require('mysql2');
const fs    = require('fs');
const path  = require('path');

const conn = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gpsviet',
  multipleStatements: true,
});

const sql = fs.readFileSync(
  path.join(__dirname, '../src/db/migration_086_warranty_display_state.sql'),
  'utf8'
);

conn.query(sql, (err) => {
  if (err) { console.error('LOI:', err.message); process.exit(1); }
  console.log('OK - lop hien thi don bao hanh + co needs_review (migration 086)');
  conn.end();
});
