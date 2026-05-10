// /api/kithuat — endpoint cho cong KTV
// Tat ca route deu yeu cau token role='kithuat'

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  recalcPaymentStatus, recalcOrderTotal,
  loadTemplateSteps, validateTransition,
} = require('../utils/orderState');
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
        SUM(CASE WHEN status IN ('confirmed','in_progress') THEN 1 ELSE 0 END) AS active_tasks,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN status = 'done'
              AND DATE(completed_at) = CURDATE() THEN 1 ELSE 0 END) AS done_today,
        SUM(CASE WHEN status = 'done'
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
// Filter ?bucket: active = chua done (completed_at IS NULL), done = da done, cancelled = huy.
// Hoac truyen ?status=<step.code> de loc dung 1 buoc cu the cua template.
router.get('/orders', async (req, res, next) => {
  try {
    const bucket   = req.query.bucket;
    const status   = req.query.status;     // step.code cu the
    const today    = req.query.today === '1';
    const tplId    = Number(req.query.template_id) || 0;
    const payment  = req.query.payment;
    const dateFrom = req.query.date_from || null;
    const dateTo   = req.query.date_to   || null;
    const q        = (req.query.q || '').trim();

    const where = ['o.assigned_staff_id = ?', 'o.is_deleted = 0'];
    const args = [req.user.sub];

    if (status) {
      where.push('o.status = ?'); args.push(status);
    } else if (bucket === 'active') {
      where.push(`o.status NOT IN ('pending','cancelled') AND o.completed_at IS NULL`);
    } else if (bucket === 'done') {
      where.push('o.completed_at IS NOT NULL AND o.status != ' + "'cancelled'");
    } else if (bucket === 'cancelled') {
      where.push("o.status = 'cancelled'");
    }

    if (tplId)   {
      where.push('EXISTS (SELECT 1 FROM order_lines ol WHERE ol.order_id = o.id AND ol.template_id = ? AND ol.is_deleted = 0)');
      args.push(tplId);
    }
    if (today)   { where.push(`(DATE(o.due_at) = CURDATE() OR (o.due_at IS NULL AND o.completed_at IS NULL AND o.status NOT IN ('pending','cancelled')))`); }
    if (dateFrom){ where.push('DATE(COALESCE(o.completed_at, o.due_at, o.started_at)) >= ?'); args.push(dateFrom); }
    if (dateTo)  { where.push('DATE(COALESCE(o.completed_at, o.due_at, o.started_at)) <= ?'); args.push(dateTo); }
    if (q) {
      where.push('(o.code LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?)');
      const like = '%' + q + '%';
      args.push(like, like, like);
    }
    if (payment === 'unpaid')      where.push('col.id IS NOT NULL AND col.remitted = 0');
    else if (payment === 'paid')   where.push('col.id IS NOT NULL AND col.remitted = 1');
    else if (payment === 'none')   where.push('col.id IS NULL');

    const whereSql = 'WHERE ' + where.join(' AND ');

    const [rows] = await db.query(
      `SELECT o.id, o.code, o.status, o.payment_status,
              o.due_at, o.started_at, o.completed_at,
              o.wage_amount, o.ktv_note,
              o.address,
              o.total_amount, o.paid_amount,
              (SELECT GROUP_CONCAT(COALESCE(ol.custom_name, t.name) ORDER BY ol.seq SEPARATOR ' + ')
                 FROM order_lines ol
                 LEFT JOIN order_templates t ON t.id = ol.template_id
                WHERE ol.order_id = o.id AND ol.is_deleted = 0) AS template_names,
              c.full_name AS customer_name, c.phone AS customer_phone, c.id AS customer_id,
              col.id AS collection_id, col.remitted AS collection_remitted,
              col.amount AS collection_amount,
              CASE
                WHEN col.id IS NULL          THEN 'none'
                WHEN col.remitted = 0        THEN 'unpaid'
                ELSE                              'paid'
              END AS collect_state
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         LEFT JOIN collections col ON col.order_id = o.id AND col.is_deleted = 0
         ${whereSql}
         ORDER BY
           CASE WHEN o.completed_at IS NULL THEN 0 ELSE 1 END,
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
      `SELECT o.id, o.code, o.status, o.payment_status,
              o.due_at, o.started_at, o.completed_at,
              o.wage_amount, o.ktv_note, o.assigned_staff_id,
              o.address,
              o.total_amount, o.subtotal, o.paid_amount, o.payment_method, o.note,
              c.id AS customer_id, c.full_name AS customer_name,
              c.phone AS customer_phone, c.address AS customer_address
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
        WHERE o.id = ? AND o.assigned_staff_id = ? AND o.is_deleted = 0`,
      [req.params.id, req.user.sub]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay don' });

    const [lines] = await db.query(
      `SELECT ol.id, ol.template_id, ol.custom_name, ol.seq, ol.subtotal, ol.note,
              COALESCE(ol.custom_name, t.name) AS template_name
         FROM order_lines ol
         LEFT JOIN order_templates t ON t.id = ol.template_id
        WHERE ol.order_id = ? AND ol.is_deleted = 0
        ORDER BY ol.seq, ol.id`, [req.params.id]
    );
    const [items] = await db.query(
      `SELECT oi.*, p.code AS product_code, p.name AS product_name
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?`, [req.params.id]
    );
    const [charges] = await db.query(
      `SELECT id, line_id, kind, label, amount FROM order_charges
        WHERE order_id = ? AND is_deleted = 0 AND label != 'Công lắp'
        ORDER BY id`, [req.params.id]
    );
    const [fieldValues] = await db.query(
      `SELECT id, line_id, label, value, seq FROM order_field_values
        WHERE order_id = ? AND is_deleted = 0 ORDER BY seq, id`, [req.params.id]
    );
    const [photos] = await db.query(
      `SELECT id, step_code, url, caption, uploaded_at
         FROM order_step_photos WHERE order_id = ? AND is_deleted = 0
        ORDER BY uploaded_at, id`, [req.params.id]
    );

    const lineMap = new Map(lines.map(l => [l.id, { ...l, items: [], charges: [], field_values: [] }]));
    for (const it of items) if (lineMap.has(it.line_id)) lineMap.get(it.line_id).items.push(it);
    for (const fv of fieldValues) if (lineMap.has(fv.line_id)) lineMap.get(fv.line_id).field_values.push(fv);
    const orderCharges = [];
    for (const c of charges) {
      if (c.line_id == null) orderCharges.push(c);
      else if (lineMap.has(c.line_id)) lineMap.get(c.line_id).charges.push(c);
    }

    const steps = await loadTemplateSteps(db);
    res.json({
      ...rows[0],
      lines: Array.from(lineMap.values()),
      order_charges: orderCharges,
      step_photos: photos,
      workflow_steps: steps,
    });
  } catch (err) { next(err); }
});

// POST /orders/:id/transition — KTV chuyen status (4 trang thai cung).
// Body: { step_code, progress_note? }
// done -> auto tru staff_holdings + tao stock_receipt(out, reason='order_consume').
router.post('/orders/:id/transition', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const target = String(req.body.step_code || '').trim();
    if (!target) throw httpErr(400, 'Thieu step_code');

    const [rows] = await conn.query(
      `SELECT id, status, completed_at FROM orders
        WHERE id = ? AND assigned_staff_id = ? AND is_deleted = 0`,
      [id, req.user.sub]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don');

    const steps = await loadTemplateSteps(conn);
    const v = validateTransition(steps, rows[0].status, target, 'ktv');
    if (!v.ok) throw httpErr(403, v.error);

    await conn.beginTransaction();

    // Khi chuyen sang done: tru holdings cho moi product trong don.
    if (target === 'done') {
      const [needs] = await conn.query(
        `SELECT product_id, SUM(qty) AS need
           FROM order_items WHERE order_id = ? GROUP BY product_id`, [id]
      );
      if (needs.length) {
        const code = await genReceiptCode(conn, 'out');
        const [rIns] = await conn.query(
          `INSERT INTO stock_receipts
             (code, kind, reason_code, ref_order_id, ref_staff_id, created_by_staff_id)
           VALUES (?, 'out', 'order_consume', ?, ?, ?)`,
          [code, id, req.user.sub, req.user.sub]
        );
        const receiptId = rIns.insertId;
        for (const n of needs) {
          const need = Number(n.need);
          const [shRows] = await conn.query(
            `SELECT id, qty FROM staff_holdings
              WHERE staff_id = ? AND product_id = ? FOR UPDATE`,
            [req.user.sub, n.product_id]
          );
          if (!shRows.length || Number(shRows[0].qty) < need) {
            throw httpErr(409, `Khong du SP id=${n.product_id} de hoan thanh (can ${need}, co ${shRows[0]?.qty || 0})`);
          }
          if (Number(shRows[0].qty) === need) {
            await conn.query(`DELETE FROM staff_holdings WHERE id = ?`, [shRows[0].id]);
          } else {
            await conn.query(`UPDATE staff_holdings SET qty = qty - ? WHERE id = ?`, [need, shRows[0].id]);
          }
          await conn.query(
            `INSERT INTO stock_receipt_items (receipt_id, product_id, qty)
             VALUES (?, ?, ?)`, [receiptId, n.product_id, need]
          );
        }
      }
    }

    const sets = ['status = ?'];
    const args = [target];
    if (req.body.progress_note != null) { sets.push('progress_note = ?'); args.push(String(req.body.progress_note)); }
    if (target === 'done')          sets.push('completed_at = COALESCE(completed_at, NOW())');
    if (target === 'in_progress')   sets.push('started_at = COALESCE(started_at, NOW())');
    args.push(id);
    await conn.query(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, args);
    await conn.commit();
    res.json({ ok: true, status: target });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// PATCH /orders/:id/progress-note
router.patch('/orders/:id/progress-note', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const note = req.body.progress_note != null ? String(req.body.progress_note) : null;
    const [r] = await db.query(
      `UPDATE orders SET progress_note = ?
        WHERE id = ? AND assigned_staff_id = ? AND is_deleted = 0`,
      [note, id, req.user.sub]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay don' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /orders/:id/photos — KTV upload anh tu do gan vao don.
// Body: { url, caption? }
router.post('/orders/:id/photos', async (req, res, next) => {
  try {
    const [t] = await db.query(
      `SELECT id, status FROM orders
        WHERE id = ? AND assigned_staff_id = ? AND is_deleted = 0`,
      [req.params.id, req.user.sub]
    );
    if (!t.length) return res.status(404).json({ error: 'Khong tim thay don' });
    if (t[0].status === 'cancelled') return res.status(400).json({ error: 'Don da huy' });

    const url     = String(req.body.url || '').trim();
    const caption = req.body.caption ? String(req.body.caption) : null;
    if (url.length < 10 || url.length > 500) return res.status(400).json({ error: 'URL anh khong hop le' });
    if (!/^https:\/\/(i\.ibb\.co|image\.ibb\.co)\//i.test(url)) {
      return res.status(400).json({ error: 'URL phai la link imgbb (i.ibb.co)' });
    }

    const [result] = await db.query(
      `INSERT INTO order_step_photos (order_id, step_code, url, caption, uploaded_by)
       VALUES (?, '', ?, ?, ?)`,
      [req.params.id, url, caption, req.user.sub]
    );
    const [rows] = await db.query(`SELECT * FROM order_step_photos WHERE id = ?`, [result.insertId]);

    // Notify admin lan dau KTV upload (chong spam neu upload nhieu lan)
    try {
      const [prev] = await db.query(
        `SELECT COUNT(*) AS c FROM order_step_photos
          WHERE order_id = ? AND id < ?`,
        [req.params.id, result.insertId]
      );
      if (Number(prev[0].c) === 0) {
        const [info] = await db.query(
          `SELECT o.code, o.customer_id,
                  c.full_name AS customer_name, s.full_name AS staff_name
             FROM orders o
             LEFT JOIN customers c ON c.id = o.customer_id
             LEFT JOIN staff s     ON s.id = o.assigned_staff_id
            WHERE o.id = ?`, [req.params.id]
        );
        const o = info[0] || {};
        await notify.create(db, {
          type: 'order_receive_uploaded',
          title: `${o.code || 'Don'}: KTV upload anh`,
          message: `${o.staff_name || 'KTV'} — ${o.customer_name || 'khach'}`,
          link_url: `/admin/orders.html#order-${req.params.id}`,
          ref_order_id: Number(req.params.id),
          ref_customer_id: o.customer_id || null,
          ref_staff_id: req.user.sub,
        });
      }
    } catch (_) {}

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
//   note?, target_step_code?  // KTV chon buoc terminal (mac dinh: buoc terminal dau tien co role 'ktv')
// }
//
// Hau qua:
//   - to_staff > 0 -> INSERT collections + order_payments(staff_collection,confirmed=1) + cong paid_amount
//                     -> KTV no cong ty den khi nop (remittance approved)
//   - to_admin > 0 -> INSERT order_payments(admin_pending,confirmed=0) — KHONG cong paid_amount
//                     -> doi admin bam confirm-admin-pending de cong paid
//   - debt > 0     -> khong tao gi, suy ra tu (total - paid - unremitted - admin_pending)
//
// payment_status sau do tinh boi recalcPaymentStatus() — uu tien:
//   customer_owes > pending_admin_confirm > staff_owes > paid/partial/unpaid.
router.patch('/orders/:id/complete', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);

    let toStaff      = Number(req.body.to_staff_amount) || 0;
    let toStaffMethod= req.body.to_staff_method || null;
    let toAdmin      = Number(req.body.to_admin_amount) || 0;
    let debt         = Number(req.body.debt_amount) || 0;
    let expected     = req.body.expected_amount != null ? Number(req.body.expected_amount) : null;
    const targetStepCode = String(req.body.target_step_code || '').trim();

    if (req.body.customer_paid_to && !req.body.to_staff_amount && !req.body.to_admin_amount) {
      const legacy = req.body.customer_paid_to;
      if (legacy === 'staff') { toStaff = Number(req.body.collect_amount) || 0; toStaffMethod = req.body.collect_method || null; }
      else if (legacy === 'admin') toAdmin = -1;
      else if (legacy === 'debt')  debt = -1;
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
      `SELECT id, status, total_amount, paid_amount, ktv_note,
              completed_at FROM orders
        WHERE id = ? AND assigned_staff_id = ? AND is_deleted = 0 FOR UPDATE`,
      [id, req.user.sub]
    );
    if (!orderRows.length) throw httpErr(404, 'Khong tim thay don');
    const order = orderRows[0];
    if (order.completed_at) throw httpErr(400, 'Don da hoan thanh');
    if (order.status === 'cancelled') throw httpErr(400, 'Don da huy');

    // Trang thai ket thuc duy nhat = 'done'
    const terminalStep = { code: 'done' };

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

    // Tru staff_holdings (auto) cho moi product trong don
    const [needs] = await conn.query(
      `SELECT product_id, SUM(qty) AS need
         FROM order_items WHERE order_id = ? GROUP BY product_id`, [id]
    );
    if (needs.length) {
      const consumeCode = await genReceiptCode(conn, 'out');
      const [rIns] = await conn.query(
        `INSERT INTO stock_receipts
           (code, kind, reason_code, ref_order_id, ref_staff_id, created_by_staff_id)
         VALUES (?, 'out', 'order_consume', ?, ?, ?)`,
        [consumeCode, id, req.user.sub, req.user.sub]
      );
      const consumeRid = rIns.insertId;
      for (const n of needs) {
        const need = Number(n.need);
        const [shRows] = await conn.query(
          `SELECT id, qty FROM staff_holdings
            WHERE staff_id = ? AND product_id = ? FOR UPDATE`,
          [req.user.sub, n.product_id]
        );
        if (!shRows.length || Number(shRows[0].qty) < need) {
          throw httpErr(409, `Khong du SP id=${n.product_id} de hoan thanh (can ${need}, co ${shRows[0]?.qty || 0})`);
        }
        if (Number(shRows[0].qty) === need) {
          await conn.query(`DELETE FROM staff_holdings WHERE id = ?`, [shRows[0].id]);
        } else {
          await conn.query(`UPDATE staff_holdings SET qty = qty - ? WHERE id = ?`, [need, shRows[0].id]);
        }
        await conn.query(
          `INSERT INTO stock_receipt_items (receipt_id, product_id, qty)
           VALUES (?, ?, ?)`, [consumeRid, n.product_id, need]
        );
      }
    }

    // Set completed_at + ktv_note + status='done'
    await conn.query(
      `UPDATE orders SET completed_at = NOW(), ktv_note = ?, status = ? WHERE id = ?`,
      [finalNote, terminalStep.code, id]
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

    await recalcPaymentStatus(conn, id);

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
// (FINAL_DONE da thay = `completed_at IS NOT NULL` sau mig 045)

router.get('/history', async (req, res, next) => {
  try {
    const dateFrom = req.query.date_from || null;
    const dateTo   = req.query.date_to   || null;
    const tplId    = Number(req.query.template_id) || 0;

    const where = ['o.assigned_staff_id = ?', 'o.is_deleted = 0', `o.completed_at IS NOT NULL`];
    const args = [req.user.sub];
    if (dateFrom) { where.push('DATE(o.completed_at) >= ?'); args.push(dateFrom); }
    if (dateTo)   { where.push('DATE(o.completed_at) <= ?'); args.push(dateTo); }
    if (tplId)    {
      where.push('EXISTS (SELECT 1 FROM order_lines ol WHERE ol.order_id = o.id AND ol.template_id = ? AND ol.is_deleted = 0)');
      args.push(tplId);
    }
    const whereSql = 'WHERE ' + where.join(' AND ');

    const [rows] = await db.query(
      `SELECT o.id, o.code, o.completed_at, o.wage_amount,
              (SELECT GROUP_CONCAT(COALESCE(ol.custom_name, t.name) ORDER BY ol.seq SEPARATOR ' + ')
                 FROM order_lines ol
                 LEFT JOIN order_templates t ON t.id = ol.template_id
                WHERE ol.order_id = o.id AND ol.is_deleted = 0) AS template_names,
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
    const where = ['o.assigned_staff_id = ?', 'o.is_deleted = 0', `o.completed_at IS NOT NULL`];
    const args = [req.user.sub];
    if (req.query.date_from) { where.push('DATE(o.completed_at) >= ?'); args.push(req.query.date_from); }
    if (req.query.date_to)   { where.push('DATE(o.completed_at) <= ?'); args.push(req.query.date_to); }
    const [rows] = await db.query(
      `SELECT o.completed_at, o.code AS order_code,
              (SELECT GROUP_CONCAT(COALESCE(ol.custom_name, t.name) ORDER BY ol.seq SEPARATOR ' + ')
                 FROM order_lines ol
                 LEFT JOIN order_templates t ON t.id = ol.template_id
                WHERE ol.order_id = o.id AND ol.is_deleted = 0) AS template_name,
              c.full_name AS customer_name,
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
    const head = 'Ngay,Don,Loai,Khach,San pham,Thu tien,Cong lap';
    const esc = (v) => `"${String(v == null ? '' : v).replaceAll('"', '""')}"`;
    const lines = rows.map(r => [
      r.completed_at, r.order_code, r.template_name || '', r.customer_name || '',
      r.products || '', r.collect_amount, r.wage_amount,
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
              o.code AS order_code, o.due_at,
              o.address,
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
      `SELECT o.id, o.code AS order_code, o.completed_at, o.wage_amount,
              c.full_name AS customer_name
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
        WHERE o.assigned_staff_id = ? AND o.completed_at IS NOT NULL AND o.is_deleted = 0
        ORDER BY o.completed_at DESC
        LIMIT 200`,
      [req.user.sub]
    );
    const [sumRow] = await db.query(
      `SELECT
         SUM(CASE WHEN MONTH(completed_at)=MONTH(CURDATE()) AND YEAR(completed_at)=YEAR(CURDATE())
              THEN wage_amount ELSE 0 END) AS this_month_total,
         SUM(wage_amount) AS lifetime_total
         FROM orders WHERE assigned_staff_id = ? AND completed_at IS NOT NULL AND is_deleted = 0`,
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
    for (const r of orderIdRows) await recalcPaymentStatus(conn, r.order_id);

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

// ===============================================================
// PHIEU CAP SAN PHAM (staff_stock_issues) — KTV
// ===============================================================
// KTV chi xem duoc phieu cua minh.
// approved -> KTV xac nhan da nhan -> received (kem anh imgbb)

async function loadKtvIssueDetail(id, staffId) {
  const [rows] = await db.query(
    `SELECT i.*,
            s.full_name AS staff_name,
            r.code AS receipt_code
       FROM staff_stock_issues i
       JOIN staff s ON s.id = i.staff_id
       LEFT JOIN stock_receipts r ON r.id = i.ref_receipt_id
      WHERE i.id = ? AND i.staff_id = ? AND i.is_deleted = 0
      LIMIT 1`,
    [id, staffId]
  );
  if (!rows.length) return null;
  const head = rows[0];
  const [items] = await db.query(
    `SELECT it.*, p.code AS product_code, p.name AS product_name, p.thumbnail_url
       FROM staff_stock_issue_items it
       JOIN products p ON p.id = it.product_id
      WHERE it.issue_id = ?
      ORDER BY it.id`,
    [head.id]
  );
  return { ...head, items };
}

// GET /staff-issues — list phieu cap cua KTV hien tai
router.get('/staff-issues', async (req, res, next) => {
  try {
    const staffId = req.user.sub;
    const where = ['i.staff_id = ?', 'i.is_deleted = 0'];
    const args = [staffId];
    if (req.query.status) {
      where.push('i.status = ?');
      args.push(req.query.status);
    }
    const whereSql = 'WHERE ' + where.join(' AND ');
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));
    const offset = (page - 1) * limit;

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM staff_stock_issues i ${whereSql}`, args
    );
    const [rows] = await db.query(
      `SELECT i.id, i.code, i.status, i.note,
              i.created_at, i.approved_at, i.received_at,
              creator.full_name AS created_by_name,
              (SELECT COUNT(*) FROM staff_stock_issue_items it WHERE it.issue_id = i.id) AS line_count,
              (SELECT COALESCE(SUM(qty_approved),0) FROM staff_stock_issue_items it WHERE it.issue_id = i.id) AS total_approved
         FROM staff_stock_issues i
         LEFT JOIN staff creator ON creator.id = i.created_by_staff_id
         ${whereSql}
         ORDER BY i.id DESC
         LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );
    res.json({ items: rows, total: countRows[0].total, page, limit });
  } catch (err) { next(err); }
});

// GET /staff-issues/:id
router.get('/staff-issues/:id', async (req, res, next) => {
  try {
    const detail = await loadKtvIssueDetail(Number(req.params.id), req.user.sub);
    if (!detail) return res.status(404).json({ error: 'Khong tim thay phieu cap' });
    res.json(detail);
  } catch (err) { next(err); }
});

// POST /staff-issues/:id/receive — KTV xac nhan da nhan hang
// Body: { photo_url? }  (URL imgbb hoac /uploads/...)
// Yeu cau status = 'approved' va phieu cua chinh KTV.
router.post('/staff-issues/:id/receive', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const staffId = req.user.sub;
    const photoUrl = req.body && req.body.photo_url ? String(req.body.photo_url).trim() : null;
    if (!photoUrl) throw httpErr(400, 'Phai upload anh xac nhan');

    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, staff_id, status FROM staff_stock_issues
        WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay phieu cap');
    const head = rows[0];
    if (head.staff_id !== staffId) throw httpErr(403, 'Khong phai phieu cua ban');
    if (head.status !== 'approved') throw httpErr(400, 'Chi xac nhan duoc phieu da duyet');

    await conn.query(
      `UPDATE staff_stock_issues
          SET status = 'received',
              received_at = NOW(),
              received_photo_url = ?
        WHERE id = ?`,
      [photoUrl, id]
    );
    await conn.commit();
    res.json(await loadKtvIssueDetail(id, staffId));
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// ============================================================
// CUSTOMER ASSETS — KTV xem + de xuat thay doi (qua duyet admin)
// ============================================================

const ASSET_KIND_CFG = {
  account: { table: 'customer_accounts', valueCol: 'account_name' },
  vehicle: { table: 'customer_vehicles', valueCol: 'plate' },
  sim:     { table: 'customer_sims',     valueCol: 'sim_number' },
};

// GET /api/kithuat/customers/:id/assets
router.get('/customers/:id/assets', async (req, res, next) => {
  try {
    const cid = Number(req.params.id);
    if (!cid) return res.status(400).json({ error: 'id khong hop le' });
    const [accounts] = await db.query(
      `SELECT id, account_name, note FROM customer_accounts
        WHERE customer_id = ? AND is_deleted = 0 ORDER BY id DESC`, [cid]
    );
    const [vehicles] = await db.query(
      `SELECT id, plate, note FROM customer_vehicles
        WHERE customer_id = ? AND is_deleted = 0 ORDER BY id DESC`, [cid]
    );
    const [sims] = await db.query(
      `SELECT id, sim_number, note FROM customer_sims
        WHERE customer_id = ? AND is_deleted = 0 ORDER BY id DESC`, [cid]
    );

    // pending requests cua KTV nay (de FE biet da gui chua)
    const [pending] = await db.query(
      `SELECT id, asset_kind, action, target_id, value, note, ref_order_id, status
         FROM customer_update_requests
        WHERE customer_id = ? AND requested_by_role = 'kithuat'
          AND requested_by_id = ? AND status = 'pending' AND is_deleted = 0`,
      [cid, req.user.sub]
    );
    res.json({ accounts, vehicles, sims, pending_requests: pending });
  } catch (err) { next(err); }
});

// POST /api/kithuat/customers/:id/asset-requests
// Body: { asset_kind, action, target_id?, value?, note?, ref_order_id? }
router.post('/customers/:id/asset-requests', async (req, res, next) => {
  try {
    const cid = Number(req.params.id);
    if (!cid) return res.status(400).json({ error: 'id khong hop le' });

    const kind = req.body && req.body.asset_kind;
    const action = req.body && req.body.action;
    if (!ASSET_KIND_CFG[kind]) return res.status(400).json({ error: 'asset_kind khong hop le' });
    if (!['add','update','delete'].includes(action)) {
      return res.status(400).json({ error: 'action khong hop le' });
    }

    let value = null;
    if (action === 'add' || action === 'update') {
      const v = String(req.body.value == null ? '' : req.body.value).trim();
      if (!v) return res.status(400).json({ error: 'Thieu gia tri' });
      if (v.length > 255) return res.status(400).json({ error: 'Gia tri qua dai' });
      if (/[<>]/.test(v)) return res.status(400).json({ error: 'Gia tri co ky tu khong hop le' });
      value = v;
    }
    let target_id = null;
    if (action === 'update' || action === 'delete') {
      target_id = Number(req.body.target_id) || null;
      if (!target_id) return res.status(400).json({ error: 'Thieu target_id' });
    }
    const note = req.body.note ? String(req.body.note).slice(0, 500) : null;
    const ref_order_id = req.body.ref_order_id ? Number(req.body.ref_order_id) : null;

    // verify khach ton tai
    const [cust] = await db.query(
      `SELECT id, full_name FROM customers WHERE id = ? AND is_deleted = 0`, [cid]
    );
    if (!cust.length) return res.status(404).json({ error: 'Khong tim thay khach' });

    const [r] = await db.query(
      `INSERT INTO customer_update_requests
        (customer_id, asset_kind, action, target_id, value, note,
         requested_by_role, requested_by_id, ref_order_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'kithuat', ?, ?, 'pending')`,
      [cid, kind, action, target_id, value, note, req.user.sub, ref_order_id]
    );

    // Notify admin
    try {
      const labels = { account: 'tai khoan', vehicle: 'bien so', sim: 'so SIM' };
      const actLabels = { add: 'them', update: 'sua', delete: 'xoa' };
      await notify.create(db, {
        type: 'customer_asset_request',
        title: `KTV de xuat ${actLabels[action]} ${labels[kind]}`,
        message: `${cust[0].full_name}: ${value || '(xoa muc)'}${note ? ' — ' + note : ''}`,
        link_url: `/admin/customers.html?customer_id=${cid}&tab=requests`,
        ref_customer_id: cid,
        ref_staff_id: req.user.sub,
        ref_order_id,
      });
    } catch (_) {}

    res.status(201).json({ id: r.insertId, ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
