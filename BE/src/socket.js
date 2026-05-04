// Socket.IO handler — auth bang JWT, room theo conversation, track online_status KTV.

const jwt = require('jsonwebtoken');
const db = require('./db');

function attach(io) {
  // Authenticate socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const u = socket.user;
    console.log('[socket] connected:', socket.id, u.role, u.sub);

    // Update online_status cho KTV
    if (u.role === 'kithuat') {
      try {
        await db.query(`UPDATE staff SET online_status = 'online' WHERE id = ?`, [u.sub]);
        io.emit('staff:online', { staff_id: u.sub });
      } catch (_) {}
    }

    // Tu dong join room theo role: ktv-<id> de gui notification rieng
    if (u.role === 'kithuat')  socket.join(`staff-${u.sub}`);
    if (u.role === 'customer') socket.join(`customer-${u.sub}`);
    if (u.role === 'daily')    socket.join(`customer-${u.sub}`);   // dealer cung la customer record
    if (u.role === 'admin')    socket.join('admin');               // room chung cho moi admin

    socket.on('conversation:join', async (conversationId) => {
      const id = Number(conversationId);
      if (!id) return;
      try {
        const [rows] = await db.query(
          `SELECT id, customer_id FROM conversations WHERE id = ? AND is_deleted = 0`, [id]
        );
        if (!rows.length) return;
        const cv = rows[0];
        // Admin: join bat ky conversation
        if (u.role === 'admin') { socket.join(`conv-${id}`); return; }
        // Khach (le va dealer): chi conversation cua minh
        if ((u.role === 'customer' || u.role === 'daily') && cv.customer_id === u.sub) {
          socket.join(`conv-${id}`); return;
        }
        // KTV: phai la member chua bi remove
        if (u.role === 'kithuat') {
          const [m] = await db.query(
            `SELECT id FROM conversation_members
              WHERE conversation_id = ? AND staff_id = ? AND removed_at IS NULL`,
            [id, u.sub]
          );
          if (m.length) socket.join(`conv-${id}`);
        }
      } catch (_) {}
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conv-${Number(conversationId)}`);
    });

    // Admin / KTV (assigned) yeu cau chup man hinh cua khach.
    // BE relay sang room customer-<id> de khach bat dau chup. Neu khach
    // khong online / khong hop le -> emit screenshot:nack ve nguoi yeu cau
    // de FE bao toast cho admin biet ly do (thay vi im lang).
    socket.on('screenshot:request', async (data) => {
      const convId = Number(data && data.conversation_id);
      const nack = (reason) => socket.emit('screenshot:nack',
        { conversation_id: convId || null, reason });

      if (u.role !== 'admin' && u.role !== 'kithuat') return nack('forbidden');
      if (!convId) return nack('bad_request');
      try {
        const [rows] = await db.query(
          `SELECT id, customer_id FROM conversations WHERE id = ? AND is_deleted = 0`,
          [convId]
        );
        if (!rows.length) return nack('not_found');
        const cv = rows[0];
        if (u.role === 'kithuat') {
          const [m] = await db.query(
            `SELECT id FROM conversation_members
              WHERE conversation_id = ? AND staff_id = ? AND removed_at IS NULL`,
            [convId, u.sub]
          );
          if (!m.length) return nack('forbidden');
        }

        // Khach co tab nao dang ket noi khong?
        const sockets = await io.in(`customer-${cv.customer_id}`).fetchSockets();
        if (!sockets.length) return nack('offline');

        io.to(`customer-${cv.customer_id}`).emit('screenshot:request', {
          conversation_id: convId,
          requested_by: u.role,
        });
      } catch (_) {
        nack('server_error');
      }
    });

    socket.on('disconnect', async () => {
      console.log('[socket] disconnected:', socket.id);
      if (u.role === 'kithuat') {
        try {
          // Chi set offline neu khong con socket khac connect
          const sockets = await io.in(`staff-${u.sub}`).fetchSockets();
          if (sockets.length === 0) {
            await db.query(`UPDATE staff SET online_status = 'offline' WHERE id = ?`, [u.sub]);
            io.emit('staff:offline', { staff_id: u.sub });
          }
        } catch (_) {}
      }
    });
  });
}

module.exports = { attach };
