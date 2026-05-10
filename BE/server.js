require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server: SocketIOServer } = require('socket.io');

const db = require('./src/db');

const authRoutes = require('./src/routes/auth');
const publicRoutes = require('./src/routes/public');
const adminRoutes = require('./src/routes/admin');
const customerRoutes = require('./src/routes/customer');
const kithuatRoutes = require('./src/routes/kithuat');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '80mb' })); // 80MB cho phep video base64 ~50MB raw
app.use(express.urlencoded({ extended: true }));

// Serve toan bo FE static (admin, customer, kithuat, shared)
const FE_DIR = path.resolve(__dirname, '..', 'FE');
app.use(express.static(FE_DIR));

// Serve file da upload (avatar, anh san pham...)
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, db: 'up', time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ ok: false, db: 'down', error: err.message });
  }
});

// API routes theo role
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);     // PUBLIC — khong can token (san pham, NCC...)
app.use('/api/admin', adminRoutes);
// /api/customer dung chung cho khach le (role=customer) va dai ly (role=daily).
app.use('/api/customer', customerRoutes);
app.use('/api/kithuat', kithuatRoutes);

// 404 cho API
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handler chung — an SQL detail khi loi 500 de chong leak schema
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  const status = err.status || 500;
  let message = err.message || 'Internal error';
  // Loi MySQL/SQL leak ten bang/cot ra ngoai -> tra message chung khi 5xx
  if (status >= 500 && (err.code || '').toString().startsWith('ER_')) {
    message = 'Loi he thong, vui long thu lai';
  }
  res.status(status).json({ error: message });
});

// Socket.IO (chat realtime) — auth + handler trong src/socket.js
const io = new SocketIOServer(server, { cors: { origin: '*' } });
global.io = io;
require('./src/socket').attach(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  require('./src/cron').start();
});
