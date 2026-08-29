// Chay backup ngay lap tuc (de test hoac backup thu cong).
//   node scripts/backup-now.js
require('dotenv').config();
const backup = require('../src/backup');

backup.runBackup()
  .then((file) => {
    console.log('OK:', file);
    process.exit(0);
  })
  .catch((err) => {
    console.error('That bai:', err.message);
    process.exit(1);
  });
