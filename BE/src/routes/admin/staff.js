// /api/admin/staff — CRUD nhan vien noi bo (admin + ky thuat)
// Tat ca route deu yeu cau role admin (da check o admin.js cha)
//
// Endpoints:
//   GET    /                 -> list (filter role, area, q, online_status)
//   GET    /:id              -> detail + stats (active_tasks, completed_tasks)
//   POST   /                 -> tao moi (kem password)
//   PUT    /:id              -> sua
//   POST   /:id/password     -> reset password
//   DELETE /:id              -> soft delete

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../../db');

const router = express.Router();
const ROLES = ['admin', 'kithuat'];

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function strip(row) {
  if (!row) return row;
  const { password_hash, ...rest } = row;
  return rest;
}

function pickPayload(body, { isUpdate = false } = {}) {
  const out = {};
  if (body.username !== undefined && String(body.username).trim() !== '') {
    out.username = String(body.username).trim();
  }
  if (body.full_name !== undefined)  out.full_name = String(body.full_name).trim();
  if (body.role !== undefined) {
    if (!ROLES.includes(body.role)) throw httpErr(400, 'role phai la admin hoac kithuat');
    out.role = body.role;
  }
  if (body.area !== undefined)       out.area = body.area || null;
  if (body.phone !== undefined)      out.phone = body.phone || null;
  if (body.cccd !== undefined)       out.cccd = body.cccd || null;
  if (body.email !== undefined)      out.email = body.email || null;
  if (body.avatar_url !== undefined) out.avatar_url = body.avatar_url || null;

  if (!isUpdate) {
    if (!out.full_name) throw httpErr(400, 'Thieu ho ten');
    if (!out.role)      out.role = 'kithuat';
  }
  return out;
}

// ---- GET /api/admin/staff -------------------------------------
// Query: ?role, ?area, ?online_status, ?q, ?page, ?limit
router.get('/', async (req, res, next) => {
  try {
    const role          = req.query.role;
    const area          = (req.query.area || '').trim();
    const onlineStatus  = req.query.online_status;
    const q             = (req.query.q || '').trim();
    const page          = Math.max(1, parseInt(req.query.page) || 1);
    const limit         = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset        = (page - 1) * limit;

    const where = ['s.is_deleted = 0'];
    const args = [];
    if (role && ROLES.includes(role))   { where.push('s.role = ?'); args.push(role); }
    if (area)                            { where.push('s.area LIKE ?'); args.push(`%${area}%`); }
    if (onlineStatus === 'online' || onlineStatus === 'offline') {
      where.push('s.online_status = ?'); args.push(onlineStatus);
    }
    if (q) {
      where.push('(s.username LIKE ? OR s.full_name LIKE ? OR s.phone LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like, like);
    }
    const whereSql = 'WHERE ' + where.join(' AND ');

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM staff s ${whereSql}`, args
    );

    const [rows] = await db.query(
      `SELECT
         s.id, s.username, s.full_name, s.role, s.area, s.phone, s.cccd, s.email,
         s.avatar_url, s.online_status, s.rating,
         COALESCE(t1.active_count, 0)   AS active_tasks,
         COALESCE(t2.done_count, 0)     AS completed_tasks,
         COALESCE(c1.held_count, 0)     AS holding_items
       FROM staff s
       LEFT JOIN (
         SELECT assigned_staff_id, COUNT(*) AS active_count
           FROM orders
          WHERE assigned_staff_id IS NOT NULL
            AND status IN ('confirmed','in_progress')
            AND is_deleted = 0
          GROUP BY assigned_staff_id
       ) t1 ON t1.assigned_staff_id = s.id
       LEFT JOIN (
         SELECT assigned_staff_id, COUNT(*) AS done_count
           FROM orders
          WHERE assigned_staff_id IS NOT NULL
            AND status IN ('done','customer_owes','staff_owes','pending_admin_confirm')
            AND is_deleted = 0
          GROUP BY assigned_staff_id
       ) t2 ON t2.assigned_staff_id = s.id
       LEFT JOIN (
         SELECT staff_id, SUM(qty) AS held_count
           FROM staff_holdings
          GROUP BY staff_id
       ) c1 ON c1.staff_id = s.id
       ${whereSql}
       ORDER BY s.id DESC
       LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    res.json({ items: rows, total: countRows[0].total, page, limit });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/staff/:id ---------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, username, full_name, role, area, phone, cccd, email,
              avatar_url, online_status, rating, created_at, updated_at
         FROM staff WHERE id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay nhan vien' });

    const [stats] = await db.query(
      `SELECT
        SUM(CASE WHEN status IN ('confirmed','in_progress') THEN 1 ELSE 0 END) AS active_tasks,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN status = 'done' AND DATE(completed_at) = CURDATE() THEN 1 ELSE 0 END) AS done_today
       FROM orders WHERE assigned_staff_id = ? AND is_deleted = 0`,
      [req.params.id]
    );

    res.json({ ...rows[0], ...stats[0] });
  } catch (err) { next(err); }
});

// Sinh username ngau nhien khong trung
async function generateStaffUsername(role) {
  const prefix = role === 'admin' ? 'ad' : 'ktv';
  for (let i = 0; i < 20; i++) {
    const u = prefix + String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    const [rows] = await db.query(
      `SELECT id FROM staff WHERE username = ? LIMIT 1`, [u]
    );
    if (!rows.length) return u;
  }
  throw httpErr(500, 'Khong sinh duoc username');
}

// ---- POST /api/admin/staff ------------------------------------
// Body: { username, password, full_name, role, area, phone, cccd, email, avatar_url }
router.post('/', async (req, res, next) => {
  try {
    const password = String(req.body.password || '');
    if (password.length < 4) throw httpErr(400, 'Mat khau toi thieu 4 ky tu');

    const data = pickPayload(req.body, { isUpdate: false });

    if (!data.username) {
      data.username = await generateStaffUsername(data.role);
    }

    const [dup] = await db.query(
      `SELECT id FROM staff WHERE username = ? AND is_deleted = 0 LIMIT 1`,
      [data.username]
    );
    if (dup.length) return res.status(409).json({ error: 'Username da ton tai' });

    const password_hash = await bcrypt.hash(password, 10);
    const cols = [...Object.keys(data), 'password_hash'];
    const placeholders = cols.map(() => '?').join(', ');
    const values = [...cols.slice(0, -1).map(c => data[c]), password_hash];

    const [result] = await db.query(
      `INSERT INTO staff (${cols.join(', ')}) VALUES (${placeholders})`,
      values
    );

    const [rows] = await db.query(`SELECT * FROM staff WHERE id = ?`, [result.insertId]);
    res.status(201).json(strip(rows[0]));
  } catch (err) { next(err); }
});

// ---- PUT /api/admin/staff/:id ---------------------------------
router.put('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const [exist] = await db.query(
      `SELECT id FROM staff WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!exist.length) return res.status(404).json({ error: 'Khong tim thay nhan vien' });

    const data = pickPayload(req.body, { isUpdate: true });

    if (data.username) {
      const [dup] = await db.query(
        `SELECT id FROM staff WHERE username = ? AND id <> ? AND is_deleted = 0 LIMIT 1`,
        [data.username, id]
      );
      if (dup.length) return res.status(409).json({ error: 'Username da ton tai' });
    }

    const cols = Object.keys(data);
    if (!cols.length) return res.status(400).json({ error: 'Khong co truong nao de cap nhat' });

    const setSql = cols.map(c => `${c} = ?`).join(', ');
    const values = cols.map(c => data[c]);
    await db.query(`UPDATE staff SET ${setSql} WHERE id = ?`, [...values, id]);

    const [rows] = await db.query(`SELECT * FROM staff WHERE id = ?`, [id]);
    res.json(strip(rows[0]));
  } catch (err) { next(err); }
});

// ---- POST /api/admin/staff/:id/password -----------------------
router.post('/:id/password', async (req, res, next) => {
  try {
    const password = String(req.body.password || '');
    if (password.length < 4) return res.status(400).json({ error: 'Mat khau toi thieu 4 ky tu' });

    const [exist] = await db.query(
      `SELECT id FROM staff WHERE id = ? AND is_deleted = 0`, [req.params.id]
    );
    if (!exist.length) return res.status(404).json({ error: 'Khong tim thay nhan vien' });

    const hash = await bcrypt.hash(password, 10);
    await db.query(`UPDATE staff SET password_hash = ? WHERE id = ?`, [hash, req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ---- DELETE /api/admin/staff/:id (soft delete) ----------------
router.delete('/:id', async (req, res, next) => {
  try {
    // Khong cho xoa chinh minh
    if (Number(req.params.id) === Number(req.user.sub)) {
      return res.status(400).json({ error: 'Khong the xoa chinh tai khoan dang dang nhap' });
    }
    const [result] = await db.query(
      `UPDATE staff SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Khong tim thay nhan vien' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
