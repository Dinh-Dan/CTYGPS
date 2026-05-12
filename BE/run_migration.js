require('dotenv').config();
const db = require('./src/db.js');

async function run() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS customer_old_debts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      amount BIGINT NOT NULL,
      note TEXT,
      debt_date DATE NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by INT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('Done');
  process.exit(0);
}
run();
