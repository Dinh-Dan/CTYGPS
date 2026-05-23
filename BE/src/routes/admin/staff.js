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
const { requireRole } = require('../../middleware/auth');
const notify = require('../../utils/notify');

const router = express.Router();
const ROLES = ['admin', 'kithuat', 'staff'];
const adminOnly = requireRole('admin');
const canManage = requireRole('admin', 'staff');

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
    if (!ROLES.includes(body.role)) throw httpErr(400, 'role phai la admin, kithuat hoac staff');
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
  const prefix = role === 'admin' ? 'ad' : role === 'staff' ? 'nv' : 'ktv';
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
router.post('/', canManage, async (req, res, next) => {
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
router.put('/:id', canManage, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'id khong hop le' });
    }
    const [exist] = await db.query(
      `SELECT id, role FROM staff WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!exist.length) return res.status(404).json({ error: 'Khong tim thay nhan vien' });

    const data = pickPayload(req.body, { isUpdate: true });

    // BX-01: ngan lock-out admin
    if (data.role && data.role !== exist[0].role) {
      // Cam tu doi role chinh minh
      if (Number(req.user && req.user.sub) === id) {
        return res.status(400).json({ error: 'Khong the tu thay doi role cua minh' });
      }
      // Neu dang ha cap admin xuong non-admin: kiem tra so admin con lai
      if (exist[0].role === 'admin' && data.role !== 'admin') {
        const [cnt] = await db.query(
          `SELECT COUNT(*) AS n FROM staff WHERE role = 'admin' AND is_deleted = 0`
        );
        if (Number(cnt[0].n) <= 1) {
          return res.status(400).json({ error: 'Khong the ha cap admin cuoi cung' });
        }
      }
    }

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
router.post('/:id/password', canManage, async (req, res, next) => {
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
// Chan neu KTV/admin con:
//  - active tasks (orders.assigned_staff_id, status in confirmed/in_progress)
//  - holdings (staff_holdings.qty > 0)
//  - release_pool item duoc cap cho rieng staff nay
// Admin cuoi cung cung khong xoa duoc.
router.delete('/:id', canManage, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'id khong hop le' });
    }
    if (id === Number(req.user.sub)) {
      return res.status(400).json({ error: 'Khong the xoa chinh tai khoan dang dang nhap' });
    }

    const [exist] = await db.query(
      `SELECT id, username, role FROM staff WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!exist.length) return res.status(404).json({ error: 'Khong tim thay nhan vien' });

    // Khong cho xoa admin cuoi cung
    if (exist[0].role === 'admin') {
      const [cnt] = await db.query(
        `SELECT COUNT(*) AS n FROM staff WHERE role = 'admin' AND is_deleted = 0`
      );
      if (Number(cnt[0].n) <= 1) {
        return res.status(400).json({ error: 'Khong the xoa admin cuoi cung' });
      }
    }

    const [[blockers]] = await db.query(
      `SELECT
         COALESCE((
           SELECT COUNT(*) FROM orders
            WHERE assigned_staff_id = ?
              AND status IN ('confirmed','in_progress')
              AND is_deleted = 0
         ), 0) AS active_tasks,
         COALESCE((
           SELECT SUM(qty) FROM staff_holdings WHERE staff_id = ?
         ), 0) AS held_qty,
         COALESCE((
           SELECT SUM(qty) FROM release_pool WHERE staff_id = ?
         ), 0) AS pool_qty`,
      [id, id, id]
    );

    const active = Number(blockers.active_tasks) || 0;
    const held   = Number(blockers.held_qty) || 0;
    const pool   = Number(blockers.pool_qty) || 0;

    if (active > 0 || held > 0 || pool > 0) {
      const parts = [];
      if (active) parts.push(`${active} cong viec dang xu ly`);
      if (held)   parts.push(`${held} thiet bi dang giu`);
      if (pool)   parts.push(`${pool} thiet bi cho nhan`);
      return res.status(409).json({
        error: `Khong the xoa: nhan vien con ${parts.join(', ')}. Vui long gan lai cong viec va thu hoi thiet bi truoc.`,
        blockers: { active_tasks: active, held_qty: held, pool_qty: pool },
      });
    }

    const [result] = await db.query(
      `UPDATE staff SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Khong tim thay nhan vien' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ==============================================================
// Quan ly yeu cau ung luong tu KTV/staff (bang staff_advances)
//
// GET  /me/advances              -> staff xem yeu cau cua chinh minh
// POST /me/advances              -> staff gui yeu cau moi
// GET  /advances/pending         -> admin xem tat ca yeu cau dang cho (adminOnly)
// PATCH /:id/advances/:aid/approve -> admin duyet -> tao staff_salary_advances
// PATCH /:id/advances/:aid/reject  -> admin tu choi
// ==============================================================

router.get('/me/advances', async (req, res, next) => {
  try {
    const staffId = Number(req.user && req.user.sub);
    if (!staffId) return res.status(401).json({ error: 'Chua dang nhap' });
    const status = req.query.status || null;
    const where = ['sa.staff_id = ?', 'sa.is_deleted = 0'];
    const args = [staffId];
    if (status) { where.push('sa.status = ?'); args.push(status); }
    const [rows] = await db.query(
      `SELECT sa.id, sa.period, sa.amount, sa.note, sa.status,
              sa.approved_at, sa.reject_reason, sa.created_at
         FROM staff_advances sa
        WHERE ${where.join(' AND ')}
        ORDER BY sa.created_at DESC LIMIT 50`,
      args
    );
    res.json({ items: rows.map(r => ({ ...r, amount: Number(r.amount) })) });
  } catch (err) { next(err); }
});

router.post('/me/advances', async (req, res, next) => {
  try {
    const staffId = Number(req.user && req.user.sub);
    if (!staffId) return res.status(401).json({ error: 'Chua dang nhap' });
    const period = String(req.body.period || '').trim();
    const amount = Number(req.body.amount) || 0;
    const note   = String(req.body.note || '').trim() || '';
    if (!period || !/^\d{4}-\d{2}$/.test(period)) return res.status(400).json({ error: 'Ky luong khong hop le (YYYY-MM)' });
    if (amount <= 0) return res.status(400).json({ error: 'So tien phai > 0' });
    const [ins] = await db.query(
      `INSERT INTO staff_advances (staff_id, period, amount, note, created_by, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      [staffId, period, amount, note, staffId]
    );

    const [[staffRow]] = await db.query('SELECT full_name FROM staff WHERE id = ?', [staffId]);
    const staffName = staffRow?.full_name || `#${staffId}`;
    await notify.create(db, {
      type: 'advance_request',
      title: 'Yêu cầu ứng lương mới',
      message: `${staffName} yêu cầu ứng ${amount.toLocaleString('vi-VN')}đ kỳ ${period}`,
      link_url: '/admin/staff.html',
      ref_staff_id: staffId,
    });

    res.json({ id: ins.insertId, ok: true });
  } catch (err) { next(err); }
});

router.get('/advances/pending', adminOnly, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT sa.id, sa.staff_id, sa.period, sa.amount, sa.note, sa.created_at,
              sa.deduct_from_collection,
              s.full_name AS staff_name, s.username
         FROM staff_advances sa
         JOIN staff s ON s.id = sa.staff_id
        WHERE sa.status = 'pending' AND sa.is_deleted = 0
        ORDER BY sa.created_at ASC`
    );
    res.json({ items: rows.map(r => ({ ...r, amount: Number(r.amount) })) });
  } catch (err) { next(err); }
});

router.patch('/:id/advances/:aid/approve', adminOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const staffId = Number(req.params.id);
    const advId   = Number(req.params.aid);
    if (!staffId || !advId) { conn.release(); return res.status(400).json({ error: 'Tham so khong hop le' }); }

    await conn.beginTransaction();
    const [[adv]] = await conn.query(
      `SELECT id, staff_id, amount, note, period, status, deduct_from_collection
         FROM staff_advances WHERE id = ? AND staff_id = ? AND is_deleted = 0 FOR UPDATE`,
      [advId, staffId]
    );
    if (!adv) { await conn.rollback(); return res.status(404).json({ error: 'Khong tim thay yeu cau' }); }
    if (adv.status !== 'pending') { await conn.rollback(); return res.status(409).json({ error: 'Yeu cau da duoc xu ly' }); }

    // Cap nhat trang thai yeu cau
    await conn.query(
      `UPDATE staff_advances SET status='approved', approved_by=?, approved_at=NOW() WHERE id=?`,
      [req.user.sub, advId]
    );

    // Tao phieu ung luong chinh thuc.
    // deduct_from_collection = 1: phieu nay se hien trong modal Duyet nop KTV
    //   va duoc tru khi KTV nop tien thu ho (KHONG tao remittance ngay tai day).
    // deduct_from_collection = 0: ung binh thuong — admin da dua tien mat,
    //   sau xu ly qua payslip cuoi thang, KHONG hien o settle modal.
    const ssaNote = adv.note || `Ứng lương kỳ ${adv.period}`;
    const deductFlag = adv.deduct_from_collection ? 1 : 0;
    const [ssaIns] = await conn.query(
      `INSERT INTO staff_salary_advances (staff_id, amount, note, deduct_from_collection, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [staffId, adv.amount, ssaNote, deductFlag, req.user.sub]
    );
    const ssaId = ssaIns.insertId;

    await conn.commit();

    // Thong bao realtime cho KTV biet da duoc duyet
    try {
      if (global.io) {
        global.io.to(`staff-${staffId}`).emit('advance:updated', {
          advance_id: advId, status: 'approved',
        });
      }
    } catch (_) {}

    res.json({ ok: true, salary_advance_id: ssaId, deduct_from_collection: deductFlag });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

router.patch('/:id/advances/:aid/reject', adminOnly, async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const advId   = Number(req.params.aid);
    if (!staffId || !advId) return res.status(400).json({ error: 'Tham so khong hop le' });
    const reason = String(req.body.reason || '').trim() || null;
    const [[adv]] = await db.query(
      `SELECT id, status FROM staff_advances WHERE id = ? AND staff_id = ? AND is_deleted = 0`,
      [advId, staffId]
    );
    if (!adv) return res.status(404).json({ error: 'Khong tim thay yeu cau' });
    if (adv.status !== 'pending') return res.status(409).json({ error: 'Yeu cau da duoc xu ly' });
    await db.query(
      `UPDATE staff_advances SET status='rejected', approved_by=?, approved_at=NOW(), reject_reason=? WHERE id=?`,
      [req.user.sub, reason, advId]
    );
    try {
      if (global.io) {
        global.io.to(`staff-${staffId}`).emit('advance:updated', {
          advance_id: advId, status: 'rejected', reason,
        });
      }
    } catch (_) {}
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// GET /:id/advances — tat ca yeu cau ung cua 1 nhan vien (admin xem)
router.get('/:id/advances', adminOnly, async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const [rows] = await db.query(
      `SELECT sa.id, sa.period, sa.amount, sa.note, sa.status,
              sa.deduct_from_collection,
              sa.approved_at, sa.reject_reason, sa.created_at,
              c.full_name AS created_by_name,
              a.full_name AS approved_by_name
         FROM staff_advances sa
         LEFT JOIN staff c ON c.id = sa.created_by
         LEFT JOIN staff a ON a.id = sa.approved_by
        WHERE sa.staff_id = ? AND sa.is_deleted = 0
        ORDER BY sa.created_at DESC`,
      [staffId]
    );
    res.json({ items: rows.map(r => ({ ...r, amount: Number(r.amount) })) });
  } catch (err) { next(err); }
});

// DELETE /me/advances/:aid — staff rut yeu cau khi con pending
router.delete('/me/advances/:aid', async (req, res, next) => {
  try {
    const staffId = Number(req.user?.sub);
    const advId   = Number(req.params.aid);
    const [[adv]] = await db.query(
      `SELECT id, status FROM staff_advances WHERE id=? AND staff_id=? AND is_deleted=0`,
      [advId, staffId]
    );
    if (!adv) return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });
    if (adv.status !== 'pending') return res.status(409).json({ error: 'Chỉ có thể rút khi đang chờ duyệt' });
    await db.query(`UPDATE staff_advances SET is_deleted=1 WHERE id=?`, [advId]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
