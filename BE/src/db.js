const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gpsviet',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,   // bắt đầu keepalive ngay khi kết nối
  connectTimeout: 30000,
  namedPlaceholders: false,
});

// Tránh crash server khi có lỗi unhandled trên các kết nối idle trong pool
pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle client:', err);
});

// Hàm wrapper: thực thi fn(pool) và retry 1 lần nếu kết nối bị đứt giữa chừng
async function withRetry(fn) {
  try {
    return await fn(pool);
  } catch (err) {
    const isConnReset = err.fatal || err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST';
    if (!isConnReset) throw err;
    console.warn('[db] Kết nối bị đứt, thử lại...', err.code);
    return await fn(pool);
  }
}

pool.withRetry = withRetry;

// Bọc pool.query để tự retry khi ECONNRESET — mọi db.query() trong toàn app đều được bảo vệ
const _origQuery = pool.query.bind(pool);
pool.query = async function (...args) {
  try {
    return await _origQuery(...args);
  } catch (err) {
    const isConnReset = err.fatal || err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST';
    if (!isConnReset) throw err;
    console.warn('[db] query ECONNRESET, thử lại...', err.code);
    return await _origQuery(...args);
  }
};

module.exports = pool;
