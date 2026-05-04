// /api/kithuat — endpoint cho cong KTV
// Tat ca route deu yeu cau token role='kithuat'

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { recalcOrderFinalStatus, recalcOrderTotal } = require('../utils/orderState');
const notify = require('../utils/notify');

const router = express.Router();
router.use(verifyToken, requireRole('kithuat'));

const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', 'uploads');
const ALLOWED_FOLDERS = new Set(['tasks', 'receipts', 'avatars']);
const MIME_EXT = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
  'image/webp': 'webp', 'image/gif': 'gif',
};
const MAX_BYTES = 5 * 1024 * 1024;

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

router.get('/ping', (req, res) => res.json({ ok: true, role: 'kithuat', user: req.user }));

// Helper: nhan dataUrl, ghi xuong dia, tra ve URL
function saveDataUrl(dataUrl, folder) {
  if (!dataUrl) throw httpErr(400, 'Thieu dataUrl');
  if (!ALLOWED_FOLDERS.has(folder)) folder = 'tasks';

  const m = String(dataUrl).match(/^data:([\w/+-]+);base64,(.+)$/);
  if (!m) throw httpErr(400, 'dataUrl khong hop le');
  const ext = MIME_EXT[m[1].toLowerCase()];
  if (!ext) throw httpErr(400, 'Dinh dang khong ho tro');

  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > MAX_BYTES) throw httpErr(413, 'Anh qua 5MB');
  if (buf.length === 0)        throw httpErr(400, 'Anh rong');

  const dir = path.join(UPLOAD_ROOT, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(dir, filename), buf);
  return `/uploads/${folder}/${filename}`;
}

// POST /uploads — upload anh chung cho KTV (avatar / bien lai / etc.)
router.post('/uploads', (req, res, next) => {
  try {
    const url = saveDataUrl(req.body && req.body.dataUrl, req.body && req.body.folder);
    res.json({ url });
  } catch (err) { next(err); }
});

// ==========================================================
// /me — profile + stats tong hop
// ==========================================================
router.get('/me', async (req, res, next) => {
  try {
    const id = req.user.sub;
    const [rows] = await db.query(
      `SELECT id, username, full_name, role, area, phone, cccd, email,
              avatar_url, online_status, rating
         FROM staff WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay' });

    const [stats] = await db.query(
      `SELECT
        SUM(CASE WHEN status IN ('assigned','warehouse_released','in_progress') THEN 1 ELSE 0 END) AS active_tasks,
        SUM(CASE WHEN status IN ('done','customer_owes','staff_owes','pending_admin_confirm') THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN status IN ('done','customer_owes','staff_owes','pending_admin_confirm')
              AND DATE(completed_at)=CURDATE() THEN 1 ELSE 0 END) AS done_today,
        SUM(CASE WHEN status IN ('done','customer_owes','staff_owes','pending_admin_confirm')
              AND YEAR(completed_at)=YEAR(CURDATE()) AND MONTH(completed_at)=MONTH(CURDATE())
              THEN wage_amount ELSE 0 END) AS wage_this_month
       FROM orders WHERE assigned_staff_id = ? AND is_deleted = 0`, [id]
    );

    const [holding] = await db.query(
      `SELECT COALESCE(SUM(qty), 0) AS c FROM staff_holdings WHERE staff_id = ?`, [id]
    );

    const [unremitted] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS amt, COUNT(*) AS c
         FROM collections
        WHERE staff_id = ? AND remitted = 0 AND is_deleted = 0`, [id]
    );

    const [reviewStats] = await db.query(
      `SELECT
         AVG(rating) AS avg_rating,
         SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) AS positive_count,
         COUNT(*) AS total_reviews
        FROM staff_reviews WHERE staff_id = ?`, [id]
    );

    res.json({
      ...rows[0],
      ...stats[0],
      holding_items: holding[0].c,
      unremitted_amount: unremitted[0].amt,
      unremitted_count: unremitted[0].c,
      avg_rating: reviewStats[0].avg_rating || 0,
      positive_count: reviewStats[0].positive_count || 0,
      total_reviews: reviewStats[0].total_reviews || 0,
    });
  } catch (err) { next(err); }
});

router.patch('/me', async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.full_name !== undefined)  updates.full_name = String(req.body.full_name).trim();
    if (req.body.phone !== undefined)      updates.phone = req.body.phone || null;
    if (req.body.email !== undefined)      updates.email = req.body.email || null;
    if (req.body.cccd !== undefined)       updates.cccd = req.body.cccd || null;
    if (req.body.avatar_url !== undefined) updates.avatar_url = req.body.avatar_url || null;
    const cols = Object.keys(updates);
    if (!cols.length) return res.status(400).json({ error: 'Khong co truong de cap nhat' });

    const setSql = cols.map(c => `${c} = ?`).join(', ');
    const values = cols.map(c => updates[c]);
    await db.query(`UPDATE staff SET ${setSql} WHERE id = ?`, [...values, req.user.sub]);

    const [rows] = await db.query(
      `SELECT id, username, full_name, role, area, phone, cccd, email, avatar_url, rating
         FROM staff WHERE id = ?`, [req.user.sub]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.get('/me/reviews', async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const [rows] = await db.query(
      `SELECT r.id, r.rating, r.comment, r.reviewed_at,
              o.code AS order_code,
              c.full_name AS customer_name
         FROM staff_reviews r
         JOIN orders o ON o.id = r.order_id
         LEFT JOIN customers c ON c.id = o.customer_id
        WHERE r.staff_id = ?
        ORDER BY r.id DESC
        LIMIT ?`,
      [req.user.sub, limit]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ==========================================================
// /orders — danh sach don cua KTV (sau refactor merge tasks->orders)
// ==========================================================
//
// Status filter (group theo y nghia voi KTV, map sang orders.status):
//   ?status=new          -> 'assigned','warehouse_released' (chua bat dau)
//   ?status=in_progress  -> 'in_progress'
//   ?status=done         -> done + 3 status no (FINAL_STATUSES)
//   ?status=cancelled    -> 'cancelled'
//
const STATUS_GROUP = {
  new:         ['assigned','warehouse_released'],
  in_progress: ['in_progress'],
  done:        ['done','customer_owes','staff_owes','pending_admin_confirm'],
  cancelled:   ['cancelled'],
};

router.get('/orders', async (req, res, next) => {
  try {
    const status   = req.query.status;
    const today    = req.query.today === '1';
    const kind     = req.query.kind;
    const payment  = req.query.payment;   // unpaid | paid | none
    const dateFrom = req.query.date_from || null;
    const dateTo   = req.query.date_to   || null;
    const q        = (req.query.q || '').trim();

    const where = ['o.assigned_staff_id = ?', 'o.is_deleted = 0'];
    const args = [req.user.sub];
    if (status && STATUS_GROUP[status]) {
      const list = STATUS_GROUP[status];
      where.push(`o.status IN (${list.map(() => '?').join(',')})`);
      args.push(...list);
    }
    if (today) {
      where.push(`(DATE(o.due_at) = CURDATE() OR (o.due_at IS NULL AND o.status IN ('assigned','warehouse_released','in_progress')))`);
    }
    if (kind && ['install','maintenance','renew','uninstall'].includes(kind)) {
      where.push('o.kind = ?'); args.push(kind);
    }
    if (dateFrom) {
      where.push('DATE(COALESCE(o.completed_at, o.due_at, o.started_at)) >= ?');
      args.push(dateFrom);
    }
    if (dateTo) {
      where.push('DATE(COALESCE(o.completed_at, o.due_at, o.started_at)) <= ?');
      args.push(dateTo);
    }
    if (q) {
      where.push('(o.code LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ? OR o.vehicle_plate LIKE ?)');
      const like = '%' + q + '%';
      args.push(like, like, like, like);
    }

    // payment filter dua tren collection cua don
    if (payment === 'unpaid') {
      where.push('col.id IS NOT NULL AND col.remitted = 0');
    } else if (payment === 'paid') {
      where.push('col.id IS NOT NULL AND col.remitted = 1');
    } else if (payment === 'none') {
      where.push('col.id IS NULL');
    }

    const whereSql = 'WHERE ' + where.join(' AND ');

    const [rows] = await db.query(
      `SELECT o.id, o.code, o.kind, o.status, o.due_at, o.started_at, o.completed_at,
              o.wage_amount, o.ktv_note,
              o.area, o.address, o.vehicle_plate,
              o.total_amount, o.paid_amount,
              c.full_name AS customer_name, c.phone AS customer_phone, c.id AS customer_id,
              col.id AS collection_id, col.remitted AS collection_remitted,
              col.amount AS collection_amount,
              CASE
                WHEN col.id IS NULL          THEN 'none'
                WHEN col.remitted = 0        THEN 'unpaid'
                ELSE                              'paid'
              END AS payment_status
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         LEFT JOIN collections col ON col.order_id = o.id AND col.is_deleted = 0
         ${whereSql}
         ORDER BY
           CASE o.status
             WHEN 'in_progress' THEN 1
             WHEN 'warehouse_released' THEN 2
             WHEN 'assigned' THEN 3
             WHEN 'done' THEN 4
             ELSE 5
           END,
           COALESCE(o.due_at, o.completed_at, '9999-12-31') DESC,
           o.id DESC`,
      args
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT o.id, o.code, o.kind, o.status, o.due_at, o.started_at, o.completed_at,
              o.wage_amount, o.ktv_note, o.assigned_staff_id,
              o.area, o.address, o.vehicle_plate,
              o.total_amount, o.subtotal, o.paid_amount, o.payment_method, o.note,
              c.id AS customer_id, c.full_name AS customer_name,
              c.phone AS customer_phone, c.address AS customer_address
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
        WHERE o.id = ? AND o.assigned_staff_id = ? AND o.is_deleted = 0`,
      [req.params.id, req.user.sub]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay don' });

    const [checklist] = await db.query(
      `SELECT id, step, is_done, done_at, sort_order
         FROM order_checklist WHERE order_id = ? ORDER BY sort_order, id`,
      [req.params.id]
    );
    const [attachments] = await db.query(
      `SELECT id, url, caption, stage, uploaded_at
         FROM order_attachments WHERE order_id = ? ORDER BY id`,
      [req.params.id]
    );
    const [items] = await db.query(
      `SELECT oi.*, p.code AS product_code, p.name AS product_name
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?`,
      [req.params.id]
    );
    const [charges] = await db.query(
      `SELECT id, kind, label, amount
         FROM order_charges
        WHERE order_id = ? AND is_deleted = 0
        ORDER BY id`,
      [req.params.id]
    );
    res.json({ ...rows[0], checklist, attachments, items, order_charges: charges });
  } catch (err) { next(err); }
});

// PATCH /orders/:id/start
router.patch('/orders/:id/start', async (req, res, next) => {
  try {
    const [exist] = await db.query(
      `SELECT id, status FROM orders
        WHERE id = ? AND assigned_staff_id = ? AND is_deleted = 0`,
      [req.params.id, req.user.sub]
    );
    if (!exist.length) return res.status(404).json({ error: 'Khong tim thay don' });
    const o = exist[0];
    if (['done','customer_owes','staff_owes','pending_admin_confirm'].includes(o.status)) {
      return res.status(400).json({ error: 'Don da hoan thanh' });
    }
    if (o.status === 'cancelled') return res.status(400).json({ error: 'Don da huy' });
    // BAT BUOC: don phai duoc QTV xuat kho truoc khi KTV bam Nhan don.
    if (o.status !== 'warehouse_released' && o.status !== 'in_progress') {
      return res.status(409).json({
        error: 'Don chua xuat kho — QTV phai bam "Xuat kho" truoc khi ban nhan don',
      });
    }

    await db.query(
      `UPDATE orders SET status = 'in_progress', started_at = COALESCE(started_at, NOW())
        WHERE id = ? AND status = 'warehouse_released'`, [req.params.id]
    );
    const [rows] = await db.query(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// PATCH /orders/:id/checklist/:stepId — toggle done
router.patch('/orders/:id/checklist/:stepId', async (req, res, next) => {
  try {
    // Verify don la cua KTV nay
    const [t] = await db.query(
      `SELECT id FROM orders WHERE id = ? AND assigned_staff_id = ? AND is_deleted = 0`,
      [req.params.id, req.user.sub]
    );
    if (!t.length) return res.status(404).json({ error: 'Khong tim thay don' });

    const isDone = req.body.is_done ? 1 : 0;
    await db.query(
      `UPDATE order_checklist
          SET is_done = ?, done_at = ?
        WHERE id = ? AND order_id = ?`,
      [isDone, isDone ? new Date() : null, req.params.stepId, req.params.id]
    );
    const [rows] = await db.query(`SELECT * FROM order_checklist WHERE id = ?`, [req.params.stepId]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /tasks/:id/upload — luu URL anh proof (anh da upload san len imgbb tu FE)
// Body: { url, caption?, stage? }
// stage: 'receive' | 'deliver' | 'other' (mac dinh 'other')
// url phai la https://i.ibb.co/... hoac https://image.ibb.co/...
router.post('/orders/:id/upload', async (req, res, next) => {
  try {
    const [t] = await db.query(
      `SELECT id, status FROM orders
        WHERE id = ? AND assigned_staff_id = ? AND is_deleted = 0`,
      [req.params.id, req.user.sub]
    );
    if (!t.length) return res.status(404).json({ error: 'Khong tim thay don' });
    if (t[0].status === 'cancelled') {
      return res.status(400).json({ error: 'Don da huy' });
    }

    const { url, caption } = req.body || {};
    const stage = ['receive', 'deliver', 'other'].includes(req.body.stage)
      ? req.body.stage : 'other';

    // Phan quyen theo stage:
    //   - receive: cho upload tu khi don 'assigned' (truoc khi admin xuat kho).
    //              KTV phai chup anh nhan hang TRUOC, admin xem xong moi xuat kho.
    //   - deliver/other: phai sau khi xuat kho (warehouse_released tro di).
    const allowedStatuses = stage === 'receive'
      ? ['assigned', 'warehouse_released', 'in_progress', 'done', 'customer_owes', 'staff_owes', 'pending_admin_confirm']
      : ['warehouse_released', 'in_progress', 'done', 'customer_owes', 'staff_owes', 'pending_admin_confirm'];
    if (!allowedStatuses.includes(t[0].status)) {
      const msg = stage === 'receive'
        ? 'Don chua duoc gan KTV — chua the upload anh nhan hang.'
        : 'Don chua xuat kho — KTV chua duoc upload anh giao. Doi admin bam "Xuat kho" truoc.';
      return res.status(409).json({ error: msg });
    }

    if (typeof url !== 'string' || url.length < 10 || url.length > 500) {
      return res.status(400).json({ error: 'URL anh khong hop le' });
    }
    if (!/^https:\/\/(i\.ibb\.co|image\.ibb\.co)\//i.test(url)) {
      return res.status(400).json({ error: 'URL phai la link imgbb (i.ibb.co)' });
    }

    const [result] = await db.query(
      `INSERT INTO order_attachments (order_id, url, caption, stage) VALUES (?, ?, ?, ?)`,
      [req.params.id, url, caption || null, stage]
    );
    const [rows] = await db.query(`SELECT * FROM order_attachments WHERE id = ?`, [result.insertId]);

    // Notify admin lan dau KTV upload anh receive (tranh spam khi upload nhieu anh)
    if (stage === 'receive') {
      try {
        const [prev] = await db.query(
          `SELECT COUNT(*) AS c FROM order_attachments
            WHERE order_id = ? AND stage = 'receive' AND id < ?`,
          [req.params.id, result.insertId]
        );
        if (Number(prev[0].c) === 0) {
          const [info] = await db.query(
            `SELECT o.code, o.customer_id,
                    c.full_name AS customer_name,
                    s.full_name AS staff_name
               FROM orders o
               LEFT JOIN customers c ON c.id = o.customer_id
               LEFT JOIN staff s     ON s.id = o.assigned_staff_id
              WHERE o.id = ?`,
            [req.params.id]
          );
          const o = info[0] || {};
          await notify.create(db, {
            type: 'order_receive_uploaded',
            title: `${o.code || 'Đơn'}: KTV đã chụp ảnh nhận hàng`,
            message: `${o.staff_name || 'KTV'} — chờ xuất kho cho ${o.customer_name || 'khách'}`,
            link_url: `/admin/orders.html#order-${req.params.id}`,
            ref_order_id: Number(req.params.id),
            ref_customer_id: o.customer_id || null,
            ref_staff_id: req.user.sub,
          });
        }
      } catch (_) {}
    }

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PATCH /tasks/:id/complete — hoan thanh task + chia tien thanh 3 phan (de ke toan khong lech)
//
// Body: {
//   to_staff_amount?: number, to_staff_method?: 'cash'|'transfer',  // tien KTV thu (>0 thi BAT BUOC method)
//   to_admin_amount?: number,                                        // tien khach bao da tra admin
//   debt_amount?:     number,                                        // tien khach con no
//   expected_amount?: number,                                        // mac dinh = remaining cua don;
//                                                                    // tong 3 phan PHAI = expected_amount
//   discount_amount?: number,                                        // giam gia don luc chot (khach khong lay 1 phan/thuong luong)
//                                                                    // > 0 -> sinh order_charges am, total_amount giam, remaining tinh lai
//   note?, vehicle_plate?
// }
//
// Hau qua:
//   - to_staff > 0 -> INSERT collections + order_payments(staff_collection,confirmed=1) + cong paid_amount
//                     -> KTV no cong ty den khi nop (remittance approved)
//   - to_admin > 0 -> INSERT order_payments(admin_pending,confirmed=0) — KHONG cong paid_amount
//                     -> doi admin bam confirm-admin-pending de cong paid
//   - debt > 0     -> khong tao gi, suy ra tu (total - paid - unremitted - admin_pending)
//
// Status don sau do tinh boi recalcOrderFinalStatus() — uu tien:
//   customer_owes > pending_admin_confirm > staff_owes > done.
//
// Backward-compat: van chap nhan body cu { customer_paid_to, collect_amount, collect_method }
// (chuyen ngam thanh body moi voi 1 phan duy nhat).
router.patch('/orders/:id/complete', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);

    // ---- Convert legacy body sang body moi -------------------
    let toStaff      = Number(req.body.to_staff_amount) || 0;
    let toStaffMethod= req.body.to_staff_method || null;
    let toAdmin      = Number(req.body.to_admin_amount) || 0;
    let debt         = Number(req.body.debt_amount) || 0;
    let expected     = req.body.expected_amount != null ? Number(req.body.expected_amount) : null;

    if (req.body.customer_paid_to && !req.body.to_staff_amount && !req.body.to_admin_amount) {
      const legacy = req.body.customer_paid_to;
      if (legacy === 'staff') {
        toStaff       = Number(req.body.collect_amount) || 0;
        toStaffMethod = req.body.collect_method || null;
      } else if (legacy === 'admin') {
        toAdmin = -1; // sentinel: lay theo remaining
      } else if (legacy === 'debt') {
        debt = -1; // sentinel: lay theo remaining
      }
    }

    if (toStaff < 0) throw httpErr(400, 'to_staff_amount khong duoc am');
    if (toAdmin < 0 && toAdmin !== -1) throw httpErr(400, 'to_admin_amount khong duoc am');
    if (debt    < 0 && debt    !== -1) throw httpErr(400, 'debt_amount khong duoc am');
    if (toStaff > 0 && !['cash', 'transfer'].includes(toStaffMethod)) {
      throw httpErr(400, "Khi co tien KTV thu, to_staff_method phai la 'cash' hoac 'transfer'");
    }

    const note = req.body.note != null ? String(req.body.note) : null;

    await conn.beginTransaction();

    const [orderRows] = await conn.query(
      `SELECT id, status, total_amount, paid_amount, ktv_note FROM orders
        WHERE id = ? AND assigned_staff_id = ? AND is_deleted = 0 FOR UPDATE`,
      [id, req.user.sub]
    );
    if (!orderRows.length) throw httpErr(404, 'Khong tim thay don');
    const order = orderRows[0];
    if (['done','customer_owes','staff_owes','pending_admin_confirm'].includes(order.status)) {
      throw httpErr(400, 'Don da hoan thanh');
    }
    if (order.status === 'cancelled') throw httpErr(400, 'Don da huy');
    if (order.status !== 'in_progress') {
      throw httpErr(409, 'Phai bam "Nhan don" truoc khi hoan thanh');
    }

    // ---- Giam gia chot tai cho -----
    const discount = Number(req.body.discount_amount) || 0;
    if (discount < 0) throw httpErr(400, 'discount_amount khong duoc am');
    if (discount > 0) {
      await conn.query(
        `INSERT INTO order_charges (order_id, kind, label, amount)
         VALUES (?, 'fee', 'Giảm — KTV chốt tại chỗ', ?)`,
        [id, -discount]
      );
      await recalcOrderTotal(conn, id);
      const [o2] = await conn.query(
        `SELECT total_amount FROM orders WHERE id = ?`, [id]
      );
      order.total_amount = o2[0].total_amount;
    }

    const remaining = Math.max(0, Number(order.total_amount) - Number(order.paid_amount));
    if (expected == null) expected = remaining;
    if (expected < 0) throw httpErr(400, 'expected_amount khong duoc am');
    if (expected > remaining) {
      throw httpErr(400, `Don chi con no ${remaining}d, khong the chia ${expected}d`);
    }

    if (toAdmin === -1) toAdmin = expected - toStaff - (debt > 0 ? debt : 0);
    if (debt    === -1) debt    = expected - toStaff - (toAdmin > 0 ? toAdmin : 0);
    if (toAdmin < 0) toAdmin = 0;
    if (debt < 0)    debt = 0;

    const sum = toStaff + toAdmin + debt;
    if (sum !== expected) {
      throw httpErr(400,
        `Tong 3 phan (${sum}d) phai bang phan KTV dam nhiem (${expected}d). ` +
        `KTV: ${toStaff}, Admin: ${toAdmin}, No: ${debt}`);
    }

    const finalNote = note != null ? note : order.ktv_note;

    // Set completed_at + ktv_note
    await conn.query(
      `UPDATE orders SET completed_at = NOW(), ktv_note = ? WHERE id = ?`,
      [finalNote, id]
    );

    // 1. KTV thu -> collection + payment confirmed + cong paid_amount
    if (toStaff > 0) {
      const [colIns] = await conn.query(
        `INSERT INTO collections (order_id, staff_id, amount, method)
         VALUES (?, ?, ?, ?)`,
        [id, req.user.sub, toStaff, toStaffMethod]
      );
      await conn.query(
        `INSERT INTO order_payments
           (order_id, amount, source, confirmed, collection_id, staff_id)
         VALUES (?, ?, 'staff_collection', 1, ?, ?)`,
        [id, toStaff, colIns.insertId, req.user.sub]
      );
      await conn.query(
        `UPDATE orders SET paid_amount = paid_amount + ? WHERE id = ?`,
        [toStaff, id]
      );
    }

    // 2. Khach bao tra admin -> admin_pending
    if (toAdmin > 0) {
      await conn.query(
        `INSERT INTO order_payments
           (order_id, amount, source, confirmed, staff_id, note)
         VALUES (?, ?, 'admin_pending', 0, ?, ?)`,
        [id, toAdmin, req.user.sub,
         'KTV bao khach da tra admin truc tiep — doi admin xac nhan']
      );
    }

    // 3. Debt: khong tao gi, suy ra dong tu (total - paid - unremitted - admin_pending)

    if (req.body.vehicle_plate) {
      await conn.query(
        `UPDATE orders SET vehicle_plate = ? WHERE id = ?`,
        [String(req.body.vehicle_plate).trim(), id]
      );
    }

    // Tra do thua ve kho
    const returns = Array.isArray(req.body.returns) ? req.body.returns : [];
    if (returns.length) {
      const seenReturn = new Set();
      const retLines = [];
      for (const raw of returns) {
        const productId = Number(raw.product_id);
        const qty = Number(raw.qty);
        if (!productId) throw httpErr(400, 'returns: thieu product_id');
        if (!qty || qty <= 0) throw httpErr(400, 'returns: qty phai > 0');
        if (seenReturn.has(productId)) throw httpErr(400, 'returns: moi SP chi 1 dong');
        seenReturn.add(productId);
        retLines.push({ product_id: productId, qty });
      }
      const code = await genReceiptCode(conn, 'in');
      const [rIns] = await conn.query(
        `INSERT INTO stock_receipts
           (code, kind, reason_code, ref_order_id, ref_staff_id, created_by_staff_id)
         VALUES (?, 'in', 'technician_return', ?, ?, ?)`,
        [code, id, req.user.sub, req.user.sub]
      );
      const receiptId = rIns.insertId;
      for (const l of retLines) {
        const [shRows] = await conn.query(
          `SELECT id, qty FROM staff_holdings
            WHERE staff_id = ? AND product_id = ? FOR UPDATE`,
          [req.user.sub, l.product_id]
        );
        if (!shRows.length || shRows[0].qty < l.qty) {
          throw httpErr(409, `Khong du de tra SP id=${l.product_id}: dang giu ${shRows[0]?.qty || 0}`);
        }
        if (shRows[0].qty === l.qty) {
          await conn.query(`DELETE FROM staff_holdings WHERE id = ?`, [shRows[0].id]);
        } else {
          await conn.query(
            `UPDATE staff_holdings SET qty = qty - ? WHERE id = ?`,
            [l.qty, shRows[0].id]
          );
        }
        await conn.query(
          `INSERT INTO product_stock (product_id, quantity) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
          [l.product_id, l.qty]
        );
        await conn.query(
          `INSERT INTO stock_receipt_items (receipt_id, product_id, qty)
           VALUES (?, ?, ?)`,
          [receiptId, l.product_id, l.qty]
        );
      }
    }

    // Tinh status cuoi (customer_owes / pending_admin_confirm / staff_owes / done)
    await recalcOrderFinalStatus(conn, id);

    await conn.commit();

    const [rows] = await conn.query(`SELECT * FROM orders WHERE id = ?`, [id]);

    try {
      const [info] = await db.query(
        `SELECT o.customer_id, c.full_name AS customer_name, s.full_name AS staff_name
           FROM orders o
           LEFT JOIN customers c ON c.id = o.customer_id
           LEFT JOIN staff s     ON s.id = o.assigned_staff_id
          WHERE o.id = ?`,
        [id]
      );
      const o = info[0] || {};
      const totalFmt = new Intl.NumberFormat('vi-VN').format(Number(rows[0].total_amount) || 0);
      await notify.create(db, {
        type: 'order_completed',
        title: `${rows[0].code}: KTV hoàn thành`,
        message: `${o.staff_name || 'KTV'} — ${o.customer_name || 'khách'} — ${totalFmt}đ`,
        link_url: `/admin/orders.html#order-${id}`,
        ref_order_id: id,
        ref_customer_id: o.customer_id || null,
        ref_staff_id: req.user.sub,
      });
    } catch (_) {}

    res.json({
      ...rows[0],
      split: { to_staff: toStaff, to_admin: toAdmin, debt },
      order_status: rows[0].status,
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ==========================================================
// /history — lich su don da xong cua KTV
// ==========================================================
const FINAL_DONE = "('done','customer_owes','staff_owes','pending_admin_confirm')";

router.get('/history', async (req, res, next) => {
  try {
    const dateFrom = req.query.date_from || null;
    const dateTo   = req.query.date_to   || null;
    const kind     = req.query.kind;

    const where = ['o.assigned_staff_id = ?', 'o.is_deleted = 0', `o.status IN ${FINAL_DONE}`];
    const args = [req.user.sub];
    if (dateFrom) { where.push('DATE(o.completed_at) >= ?'); args.push(dateFrom); }
    if (dateTo)   { where.push('DATE(o.completed_at) <= ?'); args.push(dateTo); }
    if (kind && ['install','maintenance','renew','uninstall'].includes(kind)) {
      where.push('o.kind = ?'); args.push(kind);
    }
    const whereSql = 'WHERE ' + where.join(' AND ');

    const [rows] = await db.query(
      `SELECT o.id, o.code, o.kind, o.completed_at, o.wage_amount,
              o.vehicle_plate AS order_plate,
              c.full_name AS customer_name, c.phone AS customer_phone,
              COALESCE((SELECT SUM(amount) FROM collections
                          WHERE order_id = o.id AND staff_id = ? AND is_deleted = 0), 0) AS collect_amount,
              GROUP_CONCAT(DISTINCT p.name SEPARATOR ', ') AS products
         FROM orders o
         LEFT JOIN customers c     ON c.id = o.customer_id
         LEFT JOIN order_items oi  ON oi.order_id = o.id
         LEFT JOIN products p      ON p.id = oi.product_id
         ${whereSql}
         GROUP BY o.id
         ORDER BY o.completed_at DESC`,
      [req.user.sub, ...args]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

router.get('/history/export', async (req, res, next) => {
  try {
    const where = ['o.assigned_staff_id = ?', 'o.is_deleted = 0', `o.status IN ${FINAL_DONE}`];
    const args = [req.user.sub];
    if (req.query.date_from) { where.push('DATE(o.completed_at) >= ?'); args.push(req.query.date_from); }
    if (req.query.date_to)   { where.push('DATE(o.completed_at) <= ?'); args.push(req.query.date_to); }
    const [rows] = await db.query(
      `SELECT o.completed_at, o.code AS order_code, o.kind,
              c.full_name AS customer_name, o.vehicle_plate,
              COALESCE((SELECT SUM(amount) FROM collections
                          WHERE order_id = o.id AND staff_id = ? AND is_deleted = 0), 0) AS collect_amount,
              o.wage_amount,
              GROUP_CONCAT(DISTINCT p.name SEPARATOR ', ') AS products
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         LEFT JOIN products p ON p.id = oi.product_id
        WHERE ${where.join(' AND ')}
        GROUP BY o.id
        ORDER BY o.completed_at DESC`,
      [req.user.sub, ...args]
    );
    const head = 'Ngay,Don,Loai,Khach,Bien so,San pham,Thu tien,Cong lap';
    const esc = (v) => `"${String(v == null ? '' : v).replaceAll('"', '""')}"`;
    const lines = rows.map(r => [
      r.completed_at, r.order_code, r.kind, r.customer_name || '',
      r.vehicle_plate || '', r.products || '', r.collect_amount, r.wage_amount,
    ].map(esc).join(','));
    const csv = '﻿' + head + '\n' + lines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="lichsu_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
});

// ==========================================================
// /inventory — KTV nhap/xuat thiet bi (theo qty)
//   - GET  /inventory/available         -> release_pool dang cho KTV nhan
//   - GET  /inventory/available-stock   -> product_stock cho KTV nhan truc tiep
//   - GET  /inventory                   -> staff_holdings cua KTV
//   - POST /inventory/take              -> nhan tu release_pool (theo task)
//   - POST /inventory/take-direct       -> nhan truc tiep tu kho chinh
//   - POST /inventory/return            -> tra ve kho
//   - POST /inventory/install           -> xac nhan da lap (-staff_holdings)
// ==========================================================

// Helper: sinh code phieu PN/PX
async function genReceiptCode(conn, kind) {
  const prefix = kind === 'in' ? 'PN' : 'PX';
  const now = new Date();
  const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const like = `${prefix}-${datePart}-%`;
  const [rows] = await conn.query(
    `SELECT code FROM stock_receipts WHERE code LIKE ? ORDER BY code DESC LIMIT 1`,
    [like]
  );
  let next = 1;
  if (rows.length) {
    const tail = rows[0].code.slice(`${prefix}-${datePart}-`.length);
    next = (parseInt(tail) || 0) + 1;
  }
  return `${prefix}-${datePart}-${String(next).padStart(3, '0')}`;
}

router.get('/inventory/available', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT rp.id, rp.order_id, rp.product_id, rp.qty, rp.created_at,
              p.code AS product_code, p.name AS product_name, p.thumbnail_url,
              o.code AS order_code, o.kind AS order_kind, o.due_at,
              o.address, o.area, o.vehicle_plate,
              c.full_name AS customer_name, c.phone AS customer_phone
         FROM release_pool rp
         JOIN products p ON p.id = rp.product_id
         JOIN orders   o ON o.id = rp.order_id
         LEFT JOIN customers c ON c.id = o.customer_id
        WHERE rp.staff_id = ?
        ORDER BY rp.created_at ASC`,
      [req.user.sub]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

router.get('/inventory/available-stock', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const where = ['ps.quantity > 0', 'p.is_deleted = 0'];
    const args = [];
    if (q) {
      where.push('(p.code LIKE ? OR p.name LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like);
    }
    const [rows] = await db.query(
      `SELECT p.id AS product_id, p.code, p.name, p.thumbnail_url, ps.quantity
         FROM product_stock ps
         JOIN products p ON p.id = ps.product_id
        WHERE ${where.join(' AND ')}
        ORDER BY p.code
        LIMIT 200`,
      args
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

router.get('/inventory', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT sh.id, sh.product_id, sh.qty, sh.first_held_at,
              p.code AS product_code, p.name AS product_name, p.thumbnail_url,
              TIMESTAMPDIFF(DAY, sh.first_held_at, NOW()) AS days_held
         FROM staff_holdings sh
         JOIN products p ON p.id = sh.product_id
        WHERE sh.staff_id = ?
        ORDER BY sh.first_held_at ASC`,
      [req.user.sub]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// Nhan tu release_pool (admin da release cho don nay)
router.post('/inventory/take', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const orderId = Number(req.body.order_id);
    const productId = Number(req.body.product_id);
    const qty = Number(req.body.qty);
    if (!orderId)    throw httpErr(400, 'Thieu order_id');
    if (!productId)  throw httpErr(400, 'Thieu product_id');
    if (!qty || qty <= 0) throw httpErr(400, 'qty phai > 0');

    await conn.beginTransaction();
    const [poolRows] = await conn.query(
      `SELECT id, qty FROM release_pool
        WHERE order_id = ? AND product_id = ? AND staff_id = ? FOR UPDATE`,
      [orderId, productId, req.user.sub]
    );
    if (!poolRows.length) throw httpErr(404, 'Khong co thiet bi nay cho don');
    if (poolRows[0].qty < qty) throw httpErr(409, `Pool con ${poolRows[0].qty}, can ${qty}`);

    if (poolRows[0].qty === qty) {
      await conn.query(`DELETE FROM release_pool WHERE id = ?`, [poolRows[0].id]);
    } else {
      await conn.query(
        `UPDATE release_pool SET qty = qty - ? WHERE id = ?`,
        [qty, poolRows[0].id]
      );
    }

    await conn.query(
      `INSERT INTO staff_holdings (staff_id, product_id, qty, first_held_at)
       VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)`,
      [req.user.sub, productId, qty]
    );

    const code = await genReceiptCode(conn, 'out');
    const [rIns] = await conn.query(
      `INSERT INTO stock_receipts
         (code, kind, reason_code, ref_order_id, ref_staff_id, created_by_staff_id)
       VALUES (?, 'out', 'technician_take', ?, ?, ?)`,
      [code, orderId, req.user.sub, req.user.sub]
    );
    await conn.query(
      `INSERT INTO stock_receipt_items (receipt_id, product_id, qty)
       VALUES (?, ?, ?)`,
      [rIns.insertId, productId, qty]
    );

    await conn.commit();
    res.json({ ok: true, receipt_id: rIns.insertId, code });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// Nhan truc tiep tu kho chinh (khong qua order)
router.post('/inventory/take-direct', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const productId = Number(req.body.product_id);
    const qty = Number(req.body.qty);
    if (!productId)        throw httpErr(400, 'Thieu product_id');
    if (!qty || qty <= 0)  throw httpErr(400, 'qty phai > 0');

    await conn.beginTransaction();
    const [psRows] = await conn.query(
      `SELECT quantity FROM product_stock WHERE product_id = ? FOR UPDATE`,
      [productId]
    );
    const cur = psRows.length ? psRows[0].quantity : 0;
    if (cur < qty) throw httpErr(409, `Khong du ton: con ${cur}, can ${qty}`);

    await conn.query(
      `UPDATE product_stock SET quantity = quantity - ? WHERE product_id = ?`,
      [qty, productId]
    );
    await conn.query(
      `INSERT INTO staff_holdings (staff_id, product_id, qty, first_held_at)
       VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)`,
      [req.user.sub, productId, qty]
    );

    const code = await genReceiptCode(conn, 'out');
    const [rIns] = await conn.query(
      `INSERT INTO stock_receipts
         (code, kind, reason_code, ref_staff_id, created_by_staff_id, reason_text)
       VALUES (?, 'out', 'technician_take_direct', ?, ?, ?)`,
      [code, req.user.sub, req.user.sub, req.body.reason_text || null]
    );
    await conn.query(
      `INSERT INTO stock_receipt_items (receipt_id, product_id, qty)
       VALUES (?, ?, ?)`,
      [rIns.insertId, productId, qty]
    );

    await conn.commit();
    res.json({ ok: true, receipt_id: rIns.insertId, code });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// Tra ve kho
router.post('/inventory/return', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const productId = Number(req.body.product_id);
    const qty = Number(req.body.qty);
    if (!productId)        throw httpErr(400, 'Thieu product_id');
    if (!qty || qty <= 0)  throw httpErr(400, 'qty phai > 0');

    await conn.beginTransaction();
    const [shRows] = await conn.query(
      `SELECT id, qty FROM staff_holdings
        WHERE staff_id = ? AND product_id = ? FOR UPDATE`,
      [req.user.sub, productId]
    );
    if (!shRows.length || shRows[0].qty < qty) {
      throw httpErr(409, `Khong du de tra: dang giu ${shRows[0]?.qty || 0}`);
    }

    if (shRows[0].qty === qty) {
      await conn.query(`DELETE FROM staff_holdings WHERE id = ?`, [shRows[0].id]);
    } else {
      await conn.query(
        `UPDATE staff_holdings SET qty = qty - ? WHERE id = ?`,
        [qty, shRows[0].id]
      );
    }
    await conn.query(
      `INSERT INTO product_stock (product_id, quantity) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [productId, qty]
    );

    const code = await genReceiptCode(conn, 'in');
    const [rIns] = await conn.query(
      `INSERT INTO stock_receipts
         (code, kind, reason_code, ref_staff_id, created_by_staff_id)
       VALUES (?, 'in', 'technician_return', ?, ?)`,
      [code, req.user.sub, req.user.sub]
    );
    await conn.query(
      `INSERT INTO stock_receipt_items (receipt_id, product_id, qty)
       VALUES (?, ?, ?)`,
      [rIns.insertId, productId, qty]
    );

    await conn.commit();
    res.json({ ok: true, receipt_id: rIns.insertId, code });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// Xac nhan da lap (tru staff_holdings, KHONG dung product_stock)
router.post('/inventory/install', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const orderId = Number(req.body.order_id);
    const productId = Number(req.body.product_id);
    const qty = Number(req.body.qty);
    const vehiclePlate = req.body.vehicle_plate ? String(req.body.vehicle_plate).trim() : null;
    const imeiList = req.body.imei_list ? String(req.body.imei_list).trim() : null;
    if (!orderId)          throw httpErr(400, 'Thieu order_id');
    if (!productId)        throw httpErr(400, 'Thieu product_id');
    if (!qty || qty <= 0)  throw httpErr(400, 'qty phai > 0');

    const [tRows] = await conn.query(
      `SELECT id FROM orders
        WHERE id = ? AND assigned_staff_id = ? AND is_deleted = 0`,
      [orderId, req.user.sub]
    );
    if (!tRows.length) throw httpErr(404, 'Don khong thuoc KTV');

    await conn.beginTransaction();
    const [shRows] = await conn.query(
      `SELECT id, qty FROM staff_holdings
        WHERE staff_id = ? AND product_id = ? FOR UPDATE`,
      [req.user.sub, productId]
    );
    if (!shRows.length || shRows[0].qty < qty) {
      throw httpErr(409, `Khong du de lap: dang giu ${shRows[0]?.qty || 0}, can ${qty}`);
    }

    if (shRows[0].qty === qty) {
      await conn.query(`DELETE FROM staff_holdings WHERE id = ?`, [shRows[0].id]);
    } else {
      await conn.query(
        `UPDATE staff_holdings SET qty = qty - ? WHERE id = ?`,
        [qty, shRows[0].id]
      );
    }

    const code = await genReceiptCode(conn, 'out');
    const [rIns] = await conn.query(
      `INSERT INTO stock_receipts
         (code, kind, reason_code, ref_order_id, ref_staff_id, created_by_staff_id)
       VALUES (?, 'out', 'install_done', ?, ?, ?)`,
      [code, orderId, req.user.sub, req.user.sub]
    );
    await conn.query(
      `INSERT INTO stock_receipt_items (receipt_id, product_id, qty, imei_list)
       VALUES (?, ?, ?, ?)`,
      [rIns.insertId, productId, qty, imeiList]
    );

    if (orderId && vehiclePlate) {
      await conn.query(`UPDATE orders SET vehicle_plate = ? WHERE id = ?`, [vehiclePlate, orderId]);
    }

    await conn.commit();
    res.json({ ok: true, receipt_id: rIns.insertId, code });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ==========================================================
// /collections — KTV thu tien
// ==========================================================
router.get('/collections', async (req, res, next) => {
  try {
    const remitted = req.query.remitted; // '0' | '1' | undefined
    const where = ['c.staff_id = ?', 'c.is_deleted = 0'];
    const args = [req.user.sub];
    if (remitted === '0' || remitted === '1') {
      where.push('c.remitted = ?'); args.push(Number(remitted));
    }
    const [rows] = await db.query(
      `SELECT c.id, c.order_id, c.amount, c.method, c.collected_at, c.remitted, c.remittance_id,
              o.code AS order_code,
              cust.full_name AS customer_name, cust.phone AS customer_phone
         FROM collections c
         JOIN orders o ON o.id = c.order_id
         LEFT JOIN customers cust ON cust.id = o.customer_id
        WHERE ${where.join(' AND ')}
        ORDER BY c.collected_at DESC`,
      args
    );

    const [sumRow] = await db.query(
      `SELECT
         SUM(CASE WHEN remitted = 0 THEN amount ELSE 0 END) AS unremitted,
         SUM(CASE WHEN MONTH(collected_at)=MONTH(CURDATE()) AND YEAR(collected_at)=YEAR(CURDATE())
              THEN amount ELSE 0 END) AS this_month_total
         FROM collections WHERE staff_id = ? AND is_deleted = 0`,
      [req.user.sub]
    );
    res.json({ items: rows, summary: sumRow[0] });
  } catch (err) { next(err); }
});

router.get('/wages', async (req, res, next) => {
  // Cong lap (wage_amount) cua KTV theo thang
  try {
    const [rows] = await db.query(
      `SELECT o.id, o.code AS order_code, o.kind, o.completed_at, o.wage_amount,
              c.full_name AS customer_name
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
        WHERE o.assigned_staff_id = ? AND o.status IN ${FINAL_DONE} AND o.is_deleted = 0
        ORDER BY o.completed_at DESC
        LIMIT 200`,
      [req.user.sub]
    );
    const [sumRow] = await db.query(
      `SELECT
         SUM(CASE WHEN MONTH(completed_at)=MONTH(CURDATE()) AND YEAR(completed_at)=YEAR(CURDATE())
              THEN wage_amount ELSE 0 END) AS this_month_total,
         SUM(wage_amount) AS lifetime_total
         FROM orders WHERE assigned_staff_id = ? AND status IN ${FINAL_DONE} AND is_deleted = 0`,
      [req.user.sub]
    );
    res.json({ items: rows, summary: sumRow[0] });
  } catch (err) { next(err); }
});

router.post('/remittances', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const collectionIds = Array.isArray(req.body.collection_ids) ? req.body.collection_ids : [];
    const method = req.body.method;
    const receiptUrl = req.body.receipt_url || null;
    const note = req.body.note || null;

    if (!collectionIds.length) throw httpErr(400, 'Chon it nhat 1 collection');
    if (!['cash','transfer'].includes(method)) throw httpErr(400, 'method khong hop le');

    const ids = collectionIds.map(Number).filter(Boolean);
    const placeholders = ids.map(() => '?').join(',');

    const [collections] = await conn.query(
      `SELECT id, amount FROM collections
        WHERE id IN (${placeholders}) AND staff_id = ? AND remitted = 0 AND is_deleted = 0`,
      [...ids, req.user.sub]
    );
    if (collections.length !== ids.length) {
      throw httpErr(400, 'Co collection khong hop le hoac da nop');
    }
    const total = collections.reduce((s, c) => s + Number(c.amount), 0);

    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO remittances (staff_id, amount, method, receipt_url, note)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.sub, total, method, receiptUrl, note]
    );
    const remittanceId = result.insertId;
    await conn.query(
      `UPDATE collections SET remitted = 1, remittance_id = ?
        WHERE id IN (${placeholders})`,
      [remittanceId, ...ids]
    );

    // Sau khi KTV nop: unremitted cua cac don lien quan giam -> recalc status
    // (staff_owes -> done neu paid du; hoac giu nguyen customer_owes neu van con khach no).
    const [orderIdRows] = await conn.query(
      `SELECT DISTINCT order_id
         FROM collections
        WHERE id IN (${placeholders})`,
      ids
    );
    for (const r of orderIdRows) await recalcOrderFinalStatus(conn, r.order_id);

    await conn.commit();

    try {
      const [si] = await db.query(`SELECT full_name FROM staff WHERE id = ?`, [req.user.sub]);
      const sname = (si[0] && si[0].full_name) || `KTV-${req.user.sub}`;
      const totalFmt = new Intl.NumberFormat('vi-VN').format(Number(total) || 0);
      await notify.create(db, {
        type: 'staff_remit',
        title: `${sname} nộp tiền`,
        message: `${ids.length} khoản — ${totalFmt}đ — chờ admin xác nhận`,
        link_url: `/admin/debts.html?tab=ktv`,
        ref_staff_id: req.user.sub,
      });
    } catch (_) {}

    const [rows] = await conn.query(`SELECT * FROM remittances WHERE id = ?`, [remittanceId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

router.get('/remittances', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, amount, method, receipt_url, note, remitted_at, status, reject_reason,
              approved_at,
              (SELECT COUNT(*) FROM collections c WHERE c.remittance_id = remittances.id) AS collection_count
         FROM remittances
        WHERE staff_id = ? AND is_deleted = 0
        ORDER BY id DESC`,
      [req.user.sub]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ==========================================================
// /conversations — chat KTV <-> khach (qua conversation_members)
// ----------------------------------------------------------
// KTV chi thay conv ma minh la member chua bi remove. Khi bi kick
// (removed_at != NULL) van xem duoc tin <= removed_at, KHONG gui them.
// ==========================================================

// Helper: tra ve { ok, removed_at } neu KTV la member; null neu khong.
async function getMembership(conn, convId, staffId) {
  const [rows] = await conn.query(
    `SELECT cm.removed_at
       FROM conversation_members cm
       JOIN conversations cv ON cv.id = cm.conversation_id
      WHERE cm.conversation_id = ? AND cm.staff_id = ?
        AND cv.is_deleted = 0
      LIMIT 1`,
    [convId, staffId]
  );
  if (!rows.length) return null;
  return { removed_at: rows[0].removed_at };
}

router.get('/conversations', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT cv.id, cv.customer_id, cv.last_message_at,
              c.full_name AS customer_name, c.phone AS customer_phone, c.avatar_url,
              cm.removed_at,
              (SELECT content FROM messages m
                WHERE m.conversation_id = cv.id ORDER BY m.id DESC LIMIT 1) AS last_msg,
              (SELECT COUNT(*) FROM messages m
                WHERE m.conversation_id = cv.id
                  AND m.sender_type='customer' AND m.read_at IS NULL
                  AND (cm.removed_at IS NULL OR m.sent_at <= cm.removed_at)
              ) AS unread
         FROM conversation_members cm
         JOIN conversations cv ON cv.id = cm.conversation_id
         JOIN customers c ON c.id = cv.customer_id
        WHERE cm.staff_id = ? AND cv.is_deleted = 0
        ORDER BY COALESCE(cv.last_message_at, '1970-01-01') DESC`,
      [req.user.sub]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

router.get('/conversations/:id/messages', async (req, res, next) => {
  try {
    const m = await getMembership(db, req.params.id, req.user.sub);
    if (!m) return res.status(404).json({ error: 'Khong tim thay' });

    // Neu da bi remove -> chi tra tin <= removed_at
    const where = ['conversation_id = ?'];
    const args = [req.params.id];
    if (m.removed_at) {
      where.push('sent_at <= ?');
      args.push(m.removed_at);
    }

    const [rows] = await db.query(
      `SELECT m.id, m.conversation_id, m.order_id, m.sender_type, m.sender_id,
              m.content, m.visibility, m.sent_at, m.read_at,
              o.code AS order_code
         FROM messages m
         LEFT JOIN orders o ON o.id = m.order_id
        WHERE ${where.join(' AND ')}
        ORDER BY m.id ASC
        LIMIT 200`,
      args
    );
    res.json({ items: rows, removed_at: m.removed_at });
  } catch (err) { next(err); }
});

router.post('/conversations/:id/messages', async (req, res, next) => {
  try {
    const content = String(req.body.content || '').trim();
    if (!content) return res.status(400).json({ error: 'Tin nhan rong' });

    const m = await getMembership(db, req.params.id, req.user.sub);
    if (!m) return res.status(404).json({ error: 'Khong tim thay' });
    if (m.removed_at) return res.status(403).json({ error: 'Ban da bi xoa khoi cuoc tro chuyen' });

    const [result] = await db.query(
      `INSERT INTO messages (conversation_id, sender_type, sender_id, content)
       VALUES (?, 'staff', ?, ?)`,
      [req.params.id, req.user.sub, content]
    );
    await db.query(
      `UPDATE conversations SET last_message_at = NOW() WHERE id = ?`, [req.params.id]
    );
    const [rows] = await db.query(
      `SELECT m.*, o.code AS order_code
         FROM messages m LEFT JOIN orders o ON o.id = m.order_id
        WHERE m.id = ?`,
      [result.insertId]
    );

    if (global.io) {
      global.io.to(`conv-${req.params.id}`).emit('message:new', rows[0]);
    }
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.patch('/conversations/:id/read', async (req, res, next) => {
  try {
    const m = await getMembership(db, req.params.id, req.user.sub);
    if (!m) return res.status(404).json({ error: 'Khong tim thay' });

    await db.query(
      `UPDATE messages SET read_at = NOW()
        WHERE conversation_id = ? AND sender_type = 'customer' AND read_at IS NULL`,
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ==========================================================
// /warranty-orders — KTV xu ly don bao hanh duoc gan
// Anh upload truc tiep FE -> imgbb, BE chi nhan URL.
// Endpoints:
//   GET    /                       -> list don gan cho KTV nay
//   GET    /:id                    -> detail
//   POST   /:id/recover            -> received -> recovered { recovered_image_url }
//   POST   /:id/start-deliver      -> recovered|warranty_done -> delivering
//   POST   /:id/complete           -> delivering -> completed { delivered_image_url?, paid_amount? }
// ==========================================================
const {
  WARRANTY_STATUSES,
  TERMINAL_STATUSES: WARRANTY_TERMINAL,
  ITEM_KINDS_FOR_TECH,
  canWarrantyTransition,
  loadWarrantyItems,
} = require('../utils/warrantyState');

async function loadAssignedWarranty(connOrDb, id, staffId, forUpdate = false) {
  const lock = forUpdate ? 'FOR UPDATE' : '';
  const [rows] = await connOrDb.query(
    `SELECT * FROM warranty_orders
      WHERE id = ? AND is_deleted = 0 AND assigned_staff_id = ? ${lock}`,
    [id, staffId]
  );
  return rows[0] || null;
}

router.get('/warranty-orders', async (req, res, next) => {
  try {
    const status = req.query.status;
    const where = ['w.assigned_staff_id = ?', 'w.is_deleted = 0'];
    const args = [req.user.sub];
    if (status && WARRANTY_STATUSES.includes(status)) {
      where.push('w.status = ?'); args.push(status);
    }
    const [rows] = await db.query(
      `SELECT w.id, w.code,
              w.license_plate, w.device_name, w.imei_search,
              w.reason_text, w.note_text, w.address,
              w.recovered_image_url, w.delivered_image_url,
              w.warranty_partner, w.sent_at, w.returned_at,
              w.cost_amount, w.paid_amount,
              w.status, w.request_date,
              c.code AS customer_code, c.full_name AS customer_name,
              c.phone AS customer_phone, c.address AS customer_address
         FROM warranty_orders w
         LEFT JOIN customers c ON c.id = w.customer_id
        WHERE ${where.join(' AND ')}
        ORDER BY w.id DESC`,
      args
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

router.get('/warranty-orders/:id', async (req, res, next) => {
  try {
    const wo = await loadAssignedWarranty(db, req.params.id, req.user.sub);
    if (!wo) return res.status(404).json({ error: 'Khong tim thay don bao hanh' });
    const [cust] = await db.query(
      `SELECT id, code, full_name, phone, address FROM customers WHERE id = ?`,
      [wo.customer_id]
    );
    wo.customer = cust[0] || null;
    wo.items = await loadWarrantyItems(db, wo.id);
    res.json(wo);
  } catch (err) { next(err); }
});

// ---- POST /:id/items -----------------------------------------
// KTV chi cham 2 kind: received_from_customer / delivered_to_customer.
// Body: { kind, product_id?, name?, imei?, qty?, unit_price?, note? }
router.post('/warranty-orders/:id/items', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const kind = String(req.body.kind || '').trim();
    if (!ITEM_KINDS_FOR_TECH.includes(kind)) {
      throw httpErr(403, `KTV chi duoc them item kind: ${ITEM_KINDS_FOR_TECH.join(', ')}`);
    }
    const wo = await loadAssignedWarranty(conn, id, req.user.sub);
    if (!wo) throw httpErr(404, 'Khong tim thay don bao hanh');
    if (WARRANTY_TERMINAL.includes(wo.status)) {
      throw httpErr(409, 'Don da ket thuc');
    }

    let productId = req.body.product_id ? Number(req.body.product_id) : null;
    let name = req.body.name ? String(req.body.name).trim() : '';
    if (productId) {
      const [pRows] = await conn.query(`SELECT name FROM products WHERE id = ?`, [productId]);
      if (!pRows.length) throw httpErr(404, 'San pham khong ton tai');
      if (!name) name = pRows[0].name;
    }
    if (!name) throw httpErr(400, 'Thieu ten san pham');

    const qty = Math.max(1, Number(req.body.qty) || 1);
    const unitPrice = Math.max(0, Number(req.body.unit_price) || 0);
    const imei = req.body.imei ? String(req.body.imei).trim() : null;
    const note = req.body.note ? String(req.body.note).trim() : null;

    const [ins] = await conn.query(
      `INSERT INTO warranty_order_items
         (warranty_order_id, kind, product_id, name, imei, qty, unit_price, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, kind, productId, name, imei, qty, unitPrice, note]
    );
    const [rows] = await conn.query(`SELECT * FROM warranty_order_items WHERE id = ?`, [ins.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); } finally { conn.release(); }
});

// ---- PUT /warranty-orders/items/:itemId ----------------------
// KTV chi sua duoc item kind=received_from_customer/delivered_to_customer
// va don phai duoc gan cho minh.
router.put('/warranty-orders/items/:itemId', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const itemId = Number(req.params.itemId);
    const [iRows] = await conn.query(
      `SELECT i.id, i.kind, i.released_at, w.status AS wo_status, w.assigned_staff_id
         FROM warranty_order_items i
         LEFT JOIN warranty_orders w ON w.id = i.warranty_order_id
        WHERE i.id = ? AND i.is_deleted = 0`, [itemId]
    );
    if (!iRows.length) throw httpErr(404, 'Khong tim thay item');
    const item = iRows[0];
    if (item.assigned_staff_id !== req.user.sub) throw httpErr(403, 'Don khong duoc gan cho ban');
    if (!ITEM_KINDS_FOR_TECH.includes(item.kind)) throw httpErr(403, 'Item nay khong thuoc pham vi cua KTV');
    if (WARRANTY_TERMINAL.includes(item.wo_status)) throw httpErr(409, 'Don da ket thuc');

    const updates = {};
    if (req.body.product_id !== undefined) {
      const pid = req.body.product_id ? Number(req.body.product_id) : null;
      if (pid) {
        const [pRows] = await conn.query(`SELECT id FROM products WHERE id = ?`, [pid]);
        if (!pRows.length) throw httpErr(404, 'San pham khong ton tai');
      }
      updates.product_id = pid;
    }
    if (req.body.name !== undefined) {
      const v = String(req.body.name || '').trim();
      if (!v) throw httpErr(400, 'name khong duoc rong');
      updates.name = v;
    }
    if (req.body.imei !== undefined) updates.imei = req.body.imei ? String(req.body.imei).trim() : null;
    if (req.body.qty !== undefined) updates.qty = Math.max(1, Number(req.body.qty) || 1);
    if (req.body.unit_price !== undefined) updates.unit_price = Math.max(0, Number(req.body.unit_price) || 0);
    if (req.body.note !== undefined) updates.note = req.body.note ? String(req.body.note).trim() : null;

    const cols = Object.keys(updates);
    if (!cols.length) return res.status(400).json({ error: 'Khong co truong de cap nhat' });
    const setSql = cols.map(c => `${c} = ?`).join(', ');
    const values = cols.map(c => updates[c]);
    await conn.query(
      `UPDATE warranty_order_items SET ${setSql} WHERE id = ?`,
      [...values, itemId]
    );
    const [rows] = await conn.query(`SELECT * FROM warranty_order_items WHERE id = ?`, [itemId]);
    res.json(rows[0]);
  } catch (err) { next(err); } finally { conn.release(); }
});

// ---- DELETE /warranty-orders/items/:itemId -------------------
router.delete('/warranty-orders/items/:itemId', async (req, res, next) => {
  try {
    const itemId = Number(req.params.itemId);
    const [iRows] = await db.query(
      `SELECT i.id, i.kind, w.status AS wo_status, w.assigned_staff_id
         FROM warranty_order_items i
         LEFT JOIN warranty_orders w ON w.id = i.warranty_order_id
        WHERE i.id = ? AND i.is_deleted = 0`, [itemId]
    );
    if (!iRows.length) return res.status(404).json({ error: 'Khong tim thay item' });
    const item = iRows[0];
    if (item.assigned_staff_id !== req.user.sub) return res.status(403).json({ error: 'Don khong duoc gan cho ban' });
    if (!ITEM_KINDS_FOR_TECH.includes(item.kind)) return res.status(403).json({ error: 'Item nay khong thuoc pham vi cua KTV' });
    if (WARRANTY_TERMINAL.includes(item.wo_status)) return res.status(409).json({ error: 'Don da ket thuc' });
    await db.query(`UPDATE warranty_order_items SET is_deleted = 1 WHERE id = ?`, [itemId]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Body: { recovered_image_url, items?: [{product_id?, name, imei?, qty?, unit_price?, note?}] }
// items[] (neu co) duoc insert kind=received_from_customer truoc khi chuyen status.
router.post('/warranty-orders/:id/recover', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const imageUrl = String(req.body.recovered_image_url || '').trim();
    if (!imageUrl) throw httpErr(400, 'Thieu anh thu hoi');
    const itemsRaw = Array.isArray(req.body.items) ? req.body.items : [];

    await conn.beginTransaction();
    const wo = await loadAssignedWarranty(conn, id, req.user.sub, true);
    if (!wo) throw httpErr(404, 'Khong tim thay don bao hanh');
    if (!canWarrantyTransition(wo.status, 'recovered')) {
      throw httpErr(409, `Khong the thu hoi khi don dang ${wo.status}`);
    }

    // Insert items kind=received_from_customer (neu co)
    for (const raw of itemsRaw) {
      let productId = raw.product_id ? Number(raw.product_id) : null;
      let name = raw.name ? String(raw.name).trim() : '';
      if (productId) {
        const [pRows] = await conn.query(`SELECT name FROM products WHERE id = ?`, [productId]);
        if (!pRows.length) throw httpErr(404, `San pham id=${productId} khong ton tai`);
        if (!name) name = pRows[0].name;
      }
      if (!name) throw httpErr(400, 'Item thieu ten');
      const qty = Math.max(1, Number(raw.qty) || 1);
      const unitPrice = Math.max(0, Number(raw.unit_price) || 0);
      const imei = raw.imei ? String(raw.imei).trim() : null;
      const note = raw.note ? String(raw.note).trim() : null;
      await conn.query(
        `INSERT INTO warranty_order_items
           (warranty_order_id, kind, product_id, name, imei, qty, unit_price, note)
         VALUES (?, 'received_from_customer', ?, ?, ?, ?, ?, ?)`,
        [id, productId, name, imei, qty, unitPrice, note]
      );
    }

    await conn.query(
      `UPDATE warranty_orders SET status = 'recovered', recovered_image_url = ? WHERE id = ?`,
      [imageUrl, id]
    );
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM warranty_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

router.post('/warranty-orders/:id/start-deliver', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    await conn.beginTransaction();
    const wo = await loadAssignedWarranty(conn, id, req.user.sub, true);
    if (!wo) throw httpErr(404, 'Khong tim thay don bao hanh');
    if (!canWarrantyTransition(wo.status, 'delivering')) {
      throw httpErr(409, `Khong the bat dau giao khi don dang ${wo.status}`);
    }
    await conn.query(`UPDATE warranty_orders SET status = 'delivering' WHERE id = ?`, [id]);
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM warranty_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// Body: {
//   delivered_image_url?,
//   to_staff_amount?, to_staff_method?,
//   to_admin_amount?, debt_amount?,
//   expected_amount?,
//   items?: [{...kind delivered_to_customer}]
// }
// Backward-compat: { paid_amount } cu duoc coi nhu to_admin_amount.
router.post('/warranty-orders/:id/complete', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const deliveredImage = req.body.delivered_image_url
      ? String(req.body.delivered_image_url).trim() : null;
    const itemsRaw = Array.isArray(req.body.items) ? req.body.items : [];

    let toStaff       = Math.max(0, Number(req.body.to_staff_amount) || 0);
    let toStaffMethod = req.body.to_staff_method || null;
    let toAdmin       = Math.max(0, Number(req.body.to_admin_amount) || 0);
    let debt          = Math.max(0, Number(req.body.debt_amount) || 0);
    let expected      = req.body.expected_amount != null ? Number(req.body.expected_amount) : null;

    if (!toStaff && !toAdmin && !debt && req.body.paid_amount !== undefined) {
      toAdmin = Math.max(0, Number(req.body.paid_amount) || 0);
    }
    if (toStaff > 0 && !['cash', 'transfer'].includes(toStaffMethod)) {
      throw httpErr(400, "Khi co tien KTV thu, to_staff_method phai la 'cash' hoac 'transfer'");
    }

    await conn.beginTransaction();
    const wo = await loadAssignedWarranty(conn, id, req.user.sub, true);
    if (!wo) throw httpErr(404, 'Khong tim thay don bao hanh');
    if (!canWarrantyTransition(wo.status, 'completed')) {
      throw httpErr(409, `Khong the hoan tat khi don dang ${wo.status}`);
    }

    const cost = Number(wo.cost_amount) || 0;
    const paidBefore = Number(wo.paid_amount) || 0;
    const remaining = Math.max(0, cost - paidBefore);
    if (expected == null) expected = remaining;
    if (expected < 0) throw httpErr(400, 'expected_amount khong duoc am');
    if (expected > remaining) {
      throw httpErr(400, `Don chi con thieu ${remaining}d, khong the chia ${expected}d`);
    }
    const sum = toStaff + toAdmin + debt;
    if (sum !== expected) {
      throw httpErr(400,
        `Tong 3 phan (${sum}d) phai bang phan can thu (${expected}d). KTV: ${toStaff}, Admin: ${toAdmin}, No: ${debt}`);
    }

    // Insert items kind=delivered_to_customer
    for (const raw of itemsRaw) {
      let productId = raw.product_id ? Number(raw.product_id) : null;
      let name = raw.name ? String(raw.name).trim() : '';
      if (productId) {
        const [pRows] = await conn.query(`SELECT name FROM products WHERE id = ?`, [productId]);
        if (!pRows.length) throw httpErr(404, `San pham id=${productId} khong ton tai`);
        if (!name) name = pRows[0].name;
      }
      if (!name) throw httpErr(400, 'Item thieu ten');
      const qty = Math.max(1, Number(raw.qty) || 1);
      const unitPrice = Math.max(0, Number(raw.unit_price) || 0);
      const imei = raw.imei ? String(raw.imei).trim() : null;
      const note = raw.note ? String(raw.note).trim() : null;
      await conn.query(
        `INSERT INTO warranty_order_items
           (warranty_order_id, kind, product_id, name, imei, qty, unit_price, note)
         VALUES (?, 'delivered_to_customer', ?, ?, ?, ?, ?, ?)`,
        [id, productId, name, imei, qty, unitPrice, note]
      );
    }

    if (toStaff > 0) {
      await conn.query(
        `INSERT INTO collections (task_id, ref_warranty_order_id, staff_id, amount, method)
         VALUES (NULL, ?, ?, ?, ?)`,
        [id, req.user.sub, toStaff, toStaffMethod]
      );
      await conn.query(
        `UPDATE warranty_orders SET paid_amount = paid_amount + ? WHERE id = ?`,
        [toStaff, id]
      );
    }
    if (toAdmin > 0) {
      await conn.query(
        `UPDATE warranty_orders SET paid_amount = paid_amount + ? WHERE id = ?`,
        [toAdmin, id]
      );
    }

    const setParts = ['status = ?'];
    const values = ['completed'];
    if (deliveredImage) { setParts.push('delivered_image_url = ?'); values.push(deliveredImage); }
    values.push(id);
    await conn.query(`UPDATE warranty_orders SET ${setParts.join(', ')} WHERE id = ?`, values);

    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM warranty_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});


// ==========================================================
// /repair-orders — KTV xu ly don sua chua duoc gan
// Anh upload truc tiep FE -> imgbb, BE chi nhan URL.
// Endpoints:
//   GET    /                       -> list don gan cho KTV nay
//   GET    /:id                    -> detail (kem items + charges)
//   POST   /:id/receive            -> assigned -> diagnosing { recovered_image_url }
//   POST   /:id/submit-quote       -> diagnosing -> quoted { diagnose_text, items?, service_fee? }
//   POST   /:id/done               -> repairing -> done (KHOA BILL)
//   POST   /:id/start-deliver      -> done -> delivering
//   POST   /:id/complete           -> delivering -> completed { delivered_image_url?, paid_amount? }
// ==========================================================
const {
  REPAIR_STATUSES,
  canRepairTransition,
  recalcRepairTotal,
} = require('../utils/repairState');

async function loadAssignedRepair(connOrDb, id, staffId, forUpdate = false) {
  const lock = forUpdate ? 'FOR UPDATE' : '';
  const [rows] = await connOrDb.query(
    `SELECT * FROM repair_orders
      WHERE id = ? AND is_deleted = 0 AND assigned_staff_id = ? ${lock}`,
    [id, staffId]
  );
  return rows[0] || null;
}

async function syncServiceFeeChargeKT(conn, repairOrderId, serviceFee) {
  const fee = Math.max(0, Number(serviceFee) || 0);
  const [exist] = await conn.query(
    `SELECT id FROM repair_charges
       WHERE repair_order_id = ? AND kind = 'service' AND label = 'Công sửa' AND is_deleted = 0
       LIMIT 1`,
    [repairOrderId]
  );
  if (fee > 0) {
    if (exist.length) {
      await conn.query(`UPDATE repair_charges SET amount = ? WHERE id = ?`, [fee, exist[0].id]);
    } else {
      await conn.query(
        `INSERT INTO repair_charges (repair_order_id, kind, label, amount)
         VALUES (?, 'service', 'Công sửa', ?)`,
        [repairOrderId, fee]
      );
    }
  } else if (exist.length) {
    await conn.query(`UPDATE repair_charges SET is_deleted = 1 WHERE id = ?`, [exist[0].id]);
  }
}

router.get('/repair-orders', async (req, res, next) => {
  try {
    const status = req.query.status;
    const where = ['r.assigned_staff_id = ?', 'r.is_deleted = 0'];
    const args = [req.user.sub];
    if (status && REPAIR_STATUSES.includes(status)) {
      where.push('r.status = ?'); args.push(status);
    }
    const [rows] = await db.query(
      `SELECT r.id, r.code,
              r.license_plate, r.device_name, r.imei_search,
              r.reason_text, r.note_text, r.address,
              r.diagnose_text,
              r.recovered_image_url, r.delivered_image_url,
              r.service_fee, r.parts_total, r.total_amount, r.paid_amount,
              r.status, r.request_date,
              c.code AS customer_code, c.full_name AS customer_name,
              c.phone AS customer_phone, c.address AS customer_address
         FROM repair_orders r
         LEFT JOIN customers c ON c.id = r.customer_id
        WHERE ${where.join(' AND ')}
        ORDER BY r.id DESC`,
      args
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

router.get('/repair-orders/:id', async (req, res, next) => {
  try {
    const ro = await loadAssignedRepair(db, req.params.id, req.user.sub);
    if (!ro) return res.status(404).json({ error: 'Khong tim thay don sua chua' });

    const [cust] = await db.query(
      `SELECT id, code, full_name, phone, address FROM customers WHERE id = ?`,
      [ro.customer_id]
    );
    ro.customer = cust[0] || null;

    const [items] = await db.query(
      `SELECT ri.id, ri.product_id, ri.qty, ri.unit_price, ri.imei, ri.note,
              p.code AS product_code, p.name AS product_name
         FROM repair_items ri
         LEFT JOIN products p ON p.id = ri.product_id
        WHERE ri.repair_order_id = ? AND ri.is_deleted = 0
        ORDER BY ri.id ASC`,
      [ro.id]
    );
    ro.items = items;

    const [charges] = await db.query(
      `SELECT id, kind, label, amount FROM repair_charges
        WHERE repair_order_id = ? AND is_deleted = 0
        ORDER BY id ASC`,
      [ro.id]
    );
    ro.charges = charges;

    res.json(ro);
  } catch (err) { next(err); }
});

// KTV nhan may + chuyen sang chan doan. Bat buoc co anh nhan.
router.post('/repair-orders/:id/receive', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const imageUrl = String(req.body.recovered_image_url || '').trim();
    if (!imageUrl) throw httpErr(400, 'Thieu anh nhan may');

    await conn.beginTransaction();
    const ro = await loadAssignedRepair(conn, id, req.user.sub, true);
    if (!ro) throw httpErr(404, 'Khong tim thay don sua chua');
    if (!canRepairTransition(ro.status, 'diagnosing')) {
      throw httpErr(409, `Khong the nhan may khi don dang ${ro.status}`);
    }
    await conn.query(
      `UPDATE repair_orders
          SET status = 'diagnosing', recovered_image_url = ?
        WHERE id = ?`,
      [imageUrl, id]
    );
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// KTV nop bao gia (chan doan + items + cong sua de xuat).
// Body: { diagnose_text, items?: [{product_id, qty, unit_price, imei?, note?}], service_fee? }
router.post('/repair-orders/:id/submit-quote', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const diagnose = String(req.body.diagnose_text || '').trim();
    if (!diagnose) throw httpErr(400, 'Thieu noi dung chan doan');

    const items = Array.isArray(req.body.items) ? req.body.items : null;
    const serviceFee = req.body.service_fee !== undefined
      ? Math.max(0, Number(req.body.service_fee) || 0) : null;

    await conn.beginTransaction();
    const ro = await loadAssignedRepair(conn, id, req.user.sub, true);
    if (!ro) throw httpErr(404, 'Khong tim thay don sua chua');
    if (!canRepairTransition(ro.status, 'quoted')) {
      throw httpErr(409, `Khong the nop bao gia khi don dang ${ro.status}`);
    }

    if (items) {
      await conn.query(`UPDATE repair_items SET is_deleted = 1 WHERE repair_order_id = ?`, [id]);
      for (const raw of items) {
        const productId = Number(raw.product_id);
        const qty = Math.max(1, Number(raw.qty) || 1);
        const unitPrice = Math.max(0, Number(raw.unit_price) || 0);
        if (!productId) throw httpErr(400, 'Item thieu product_id');
        const imei = raw.imei ? String(raw.imei).trim() : null;
        const note = raw.note ? String(raw.note).trim() : null;
        await conn.query(
          `INSERT INTO repair_items (repair_order_id, product_id, qty, unit_price, imei, note)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, productId, qty, unitPrice, imei, note]
        );
      }
    }

    const updates = ['status = ?', 'diagnose_text = ?', 'quoted_at = NOW()'];
    const values = ['quoted', diagnose];
    if (serviceFee !== null) {
      updates.push('service_fee = ?');
      values.push(serviceFee);
    }
    values.push(id);
    await conn.query(`UPDATE repair_orders SET ${updates.join(', ')} WHERE id = ?`, values);

    if (serviceFee !== null) await syncServiceFeeChargeKT(conn, id, serviceFee);
    await recalcRepairTotal(conn, id);
    await conn.commit();

    const [after] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

router.post('/repair-orders/:id/done', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    await conn.beginTransaction();
    const ro = await loadAssignedRepair(conn, id, req.user.sub, true);
    if (!ro) throw httpErr(404, 'Khong tim thay don sua chua');
    if (!canRepairTransition(ro.status, 'done')) {
      throw httpErr(409, `Khong the bao xong khi don dang ${ro.status}`);
    }
    await conn.query(
      `UPDATE repair_orders SET status = 'done', done_at = NOW() WHERE id = ?`, [id]
    );
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

router.post('/repair-orders/:id/start-deliver', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    await conn.beginTransaction();
    const ro = await loadAssignedRepair(conn, id, req.user.sub, true);
    if (!ro) throw httpErr(404, 'Khong tim thay don sua chua');
    if (!canRepairTransition(ro.status, 'delivering')) {
      throw httpErr(409, `Khong the bat dau giao khi don dang ${ro.status}`);
    }
    await conn.query(`UPDATE repair_orders SET status = 'delivering' WHERE id = ?`, [id]);
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

router.post('/repair-orders/:id/complete', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const deliveredImage = req.body.delivered_image_url
      ? String(req.body.delivered_image_url).trim() : null;

    const updates = ['status = ?', 'delivered_at = NOW()'];
    const values = ['completed'];
    if (deliveredImage) { updates.push('delivered_image_url = ?'); values.push(deliveredImage); }
    if (req.body.paid_amount !== undefined) {
      updates.push('paid_amount = ?');
      values.push(Math.max(0, Number(req.body.paid_amount) || 0));
    }
    values.push(id);

    await conn.beginTransaction();
    const ro = await loadAssignedRepair(conn, id, req.user.sub, true);
    if (!ro) throw httpErr(404, 'Khong tim thay don sua chua');
    if (!canRepairTransition(ro.status, 'completed')) {
      throw httpErr(409, `Khong the hoan tat khi don dang ${ro.status}`);
    }
    await conn.query(`UPDATE repair_orders SET ${updates.join(', ')} WHERE id = ?`, values);
    await conn.commit();
    const [after] = await conn.query(`SELECT * FROM repair_orders WHERE id = ?`, [id]);
    res.json(after[0]);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});


module.exports = router;
