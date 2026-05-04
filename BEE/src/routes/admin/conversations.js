// /api/admin/conversations — Inbox chat cho admin
// 1 customer = 1 conversation (sau migration 017). Admin/KTV tham gia qua
// bang conversation_members. Admin thay het, co the them/bot KTV vao chat.

const express = require('express');
const db = require('../../db');

const router = express.Router();

// ---- GET /api/admin/conversations -----------------------------
// Query: ?q (search ten/SDT/code), ?page, ?limit
router.get('/', async (req, res, next) => {
  try {
    const q     = (req.query.q || '').trim();
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const where = ['cv.is_deleted = 0'];
    const args = [];
    if (q) {
      where.push('(c.full_name LIKE ? OR c.phone LIKE ? OR c.code LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like, like);
    }
    const whereSql = 'WHERE ' + where.join(' AND ');

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM conversations cv
         LEFT JOIN customers c ON c.id = cv.customer_id
         ${whereSql}`, args
    );

    const [rows] = await db.query(
      `SELECT cv.id, cv.customer_id, cv.last_message_at,
              c.code AS customer_code, c.full_name AS customer_name,
              c.phone AS customer_phone, c.type AS customer_type,
              c.avatar_url AS customer_avatar,
              (SELECT content FROM messages
                 WHERE conversation_id = cv.id ORDER BY id DESC LIMIT 1) AS last_message,
              (SELECT sender_type FROM messages
                 WHERE conversation_id = cv.id ORDER BY id DESC LIMIT 1) AS last_sender,
              (SELECT COUNT(*) FROM messages
                 WHERE conversation_id = cv.id
                   AND sender_type = 'customer' AND read_at IS NULL) AS unread_count,
              (SELECT COUNT(*) FROM conversation_members
                 WHERE conversation_id = cv.id AND removed_at IS NULL) AS member_count
         FROM conversations cv
         LEFT JOIN customers c ON c.id = cv.customer_id
         ${whereSql}
         ORDER BY COALESCE(cv.last_message_at, '1970-01-01') DESC, cv.id DESC
         LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    res.json({ items: rows, total: countRows[0].total, page, limit });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/conversations/unread-count ----------------
router.get('/unread-count', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(DISTINCT m.conversation_id) AS n
         FROM messages m
         JOIN conversations cv ON cv.id = m.conversation_id
        WHERE m.sender_type = 'customer'
          AND m.read_at IS NULL
          AND cv.is_deleted = 0`
    );
    res.json({ unread: rows[0].n || 0 });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/conversations/:id -------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT cv.*,
              c.code AS customer_code, c.full_name AS customer_name,
              c.type AS customer_type, c.phone AS customer_phone,
              c.email AS customer_email, c.avatar_url AS customer_avatar,
              c.company_name AS customer_company
         FROM conversations cv
         LEFT JOIN customers c ON c.id = cv.customer_id
        WHERE cv.id = ? AND cv.is_deleted = 0`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ---- GET /api/admin/conversations/:id/messages ---------------
router.get('/:id/messages', async (req, res, next) => {
  try {
    const [cv] = await db.query(
      `SELECT id FROM conversations WHERE id = ? AND is_deleted = 0`, [req.params.id]
    );
    if (!cv.length) return res.status(404).json({ error: 'Khong tim thay' });

    const [rows] = await db.query(
      `SELECT m.id, m.conversation_id, m.order_id, m.sender_type, m.sender_id,
              m.content, m.visibility, m.sent_at, m.read_at,
              o.code AS order_code,
              CASE WHEN m.sender_type = 'staff'
                   THEN s.full_name ELSE c.full_name END AS sender_name,
              CASE WHEN m.sender_type = 'staff'
                   THEN s.role ELSE NULL END AS sender_role,
              CASE WHEN m.sender_type = 'staff'
                   THEN s.avatar_url ELSE c.avatar_url END AS sender_avatar
         FROM messages m
         LEFT JOIN staff s     ON m.sender_type = 'staff'    AND s.id = m.sender_id
         LEFT JOIN customers c ON m.sender_type = 'customer' AND c.id = m.sender_id
         LEFT JOIN orders o    ON o.id = m.order_id
        WHERE m.conversation_id = ?
        ORDER BY m.id ASC
        LIMIT 200`,
      [req.params.id]
    );

    db.query(
      `UPDATE messages SET read_at = NOW()
        WHERE conversation_id = ?
          AND sender_type = 'customer'
          AND read_at IS NULL`,
      [req.params.id]
    ).catch(() => {});

    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ---- POST /api/admin/conversations/:id/messages ---------------
// Body: { content, order_id? }
router.post('/:id/messages', async (req, res, next) => {
  try {
    const content = String(req.body.content || '').trim();
    if (!content) return res.status(400).json({ error: 'Tin nhan rong' });

    const [cv] = await db.query(
      `SELECT id, customer_id FROM conversations WHERE id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (!cv.length) return res.status(404).json({ error: 'Khong tim thay' });

    let orderId = null;
    if (req.body.order_id) {
      orderId = Number(req.body.order_id);
      const [o] = await db.query(
        `SELECT id FROM orders WHERE id = ? AND customer_id = ? AND is_deleted = 0`,
        [orderId, cv[0].customer_id]
      );
      if (!o.length) return res.status(400).json({ error: 'Don khong thuoc khach nay' });
    }

    const [result] = await db.query(
      `INSERT INTO messages (conversation_id, order_id, sender_type, sender_id, content)
       VALUES (?, ?, 'staff', ?, ?)`,
      [req.params.id, orderId, req.user.sub, content]
    );
    await db.query(
      `UPDATE conversations SET last_message_at = NOW() WHERE id = ?`, [req.params.id]
    );

    const [rows] = await db.query(
      `SELECT m.*, s.full_name AS sender_name, s.role AS sender_role,
              s.avatar_url AS sender_avatar, o.code AS order_code
         FROM messages m
         JOIN staff s ON s.id = m.sender_id
         LEFT JOIN orders o ON o.id = m.order_id
        WHERE m.id = ?`,
      [result.insertId]
    );

    if (global.io) {
      global.io.to(`conv-${req.params.id}`).emit('message:new', rows[0]);
    }
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ==========================================================
// /:id/members — quan ly thanh vien (admin/KTV) cua conversation
// ==========================================================

// GET /:id/members — list active + removed (de UI hien lich su)
router.get('/:id/members', async (req, res, next) => {
  try {
    const [cv] = await db.query(
      `SELECT id FROM conversations WHERE id = ? AND is_deleted = 0`, [req.params.id]
    );
    if (!cv.length) return res.status(404).json({ error: 'Khong tim thay' });

    const [rows] = await db.query(
      `SELECT cm.id, cm.staff_id, cm.joined_at, cm.removed_at, cm.added_by,
              s.username, s.full_name, s.role, s.avatar_url, s.online_status
         FROM conversation_members cm
         JOIN staff s ON s.id = cm.staff_id
        WHERE cm.conversation_id = ?
        ORDER BY cm.removed_at IS NULL DESC, cm.joined_at DESC`,
      [req.params.id]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// POST /:id/members — them KTV vao chat. Body: { staff_id }
// Neu da co row (re-add) -> reset removed_at = NULL.
router.post('/:id/members', async (req, res, next) => {
  try {
    const staffId = Number(req.body.staff_id);
    if (!staffId) return res.status(400).json({ error: 'Thieu staff_id' });

    const [cv] = await db.query(
      `SELECT id FROM conversations WHERE id = ? AND is_deleted = 0`, [req.params.id]
    );
    if (!cv.length) return res.status(404).json({ error: 'Khong tim thay' });

    const [s] = await db.query(
      `SELECT id, role FROM staff WHERE id = ? AND is_deleted = 0`, [staffId]
    );
    if (!s.length) return res.status(400).json({ error: 'Khong tim thay nhan vien' });
    if (s[0].role !== 'kithuat' && s[0].role !== 'admin') {
      return res.status(400).json({ error: 'Chi them admin / KTV' });
    }

    // Upsert: neu da co row thi reset removed_at; chua co thi insert.
    await db.query(
      `INSERT INTO conversation_members (conversation_id, staff_id, added_by)
       VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           removed_at = NULL,
           added_by   = VALUES(added_by),
           joined_at  = CURRENT_TIMESTAMP`,
      [req.params.id, staffId, req.user.sub]
    );

    const [rows] = await db.query(
      `SELECT cm.id, cm.staff_id, cm.joined_at, cm.removed_at, cm.added_by,
              s.username, s.full_name, s.role, s.avatar_url, s.online_status
         FROM conversation_members cm
         JOIN staff s ON s.id = cm.staff_id
        WHERE cm.conversation_id = ? AND cm.staff_id = ?`,
      [req.params.id, staffId]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /:id/members/:staffId — soft-remove (set removed_at = NOW)
router.delete('/:id/members/:staffId', async (req, res, next) => {
  try {
    const [r] = await db.query(
      `UPDATE conversation_members
          SET removed_at = NOW()
        WHERE conversation_id = ? AND staff_id = ? AND removed_at IS NULL`,
      [req.params.id, req.params.staffId]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay thanh vien' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
