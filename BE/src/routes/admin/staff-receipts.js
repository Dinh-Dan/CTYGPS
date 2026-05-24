// /api/admin/staff-receipts — Nhan vien khai bao da nhan tien tu khach
//
// Muc dich: Nhan vien nhan tien mat/chuyen khoan tu khach hang, ghi nhan ngay
// vao he thong (paid_amount cap nhat tuc thi). Admin vao trang doi soat cuoi ngay
// de kiem tra tung dong va tick "Da kiem tra".
//
// Endpoints:
//   POST /             — NV khai bao nhan tien (order_id HOAC request_id)
//   GET  /             — Danh sach (admin doi soat)
//   POST /:id/review   — Admin tick da kiem tra

const express = require('express');
const db = require('../../db');
const { requireRole } = require('../../middleware/auth');
const { recalcPaymentStatus } = require('../../utils/orderState');

const router = express.Router();
const staffAllowed = requireRole('admin', 'staff');
const adminOnly    = requireRole('admin');

const PAY_METHODS = ['cash', 'transfer', 'mixed'];
const fmtVnd = n => new Intl.NumberFormat('vi-VN').format(Number(n) || 0);

// Sinh ma NNT-DDMM-NNN
async function genNntCode(conn, attempt = 0) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `NNT-${dd}${mm}-`;
  const [rows] = await conn.query(
    `SELECT code FROM staff_receipts WHERE code LIKE ? ORDER BY code DESC LIMIT 1`,
    [`${prefix}%`]
  );
  let next = 1;
  if (rows.length) {
    const last = rows[0].code.slice(prefix.length);
    next = (parseInt(last) || 0) + 1;
  }
  return prefix + String(next + attempt).padStart(3, '0');
}

async function appendOrderNote(conn, orderId, note, username) {
  const actor = username || 'hệ thống';
  const d = new Date();
  const ts = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  try {
    await conn.query(
      `UPDATE orders SET progress_note = CONCAT(COALESCE(progress_note,''), ?, '\n') WHERE id = ?`,
      [`[${ts} - ${actor}] ${note}`, orderId]
    );
  } catch (_) {}
}

// ==============================================================
// POST /api/admin/staff-receipts
// Body: { order_id? | request_id?, amount, pay_method, note?, proof_urls? }
// ==============================================================
router.post('/', staffAllowed, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const orderId   = req.body.order_id   ? Number(req.body.order_id)   : null;
    const requestId = req.body.request_id ? Number(req.body.request_id) : null;
    const amount    = Math.max(0, Number(req.body.amount) || 0);
    const payMethod = PAY_METHODS.includes(req.body.pay_method) ? req.body.pay_method : 'cash';
    const note      = String(req.body.note || '').trim() || null;
    const staffId   = req.user.sub;
    const username  = req.user.username || req.user.full_name || 'nhân viên';

    if (!orderId && !requestId) {
      conn.release();
      return res.status(400).json({ error: 'Phai truyen order_id hoac request_id' });
    }
    if (orderId && requestId) {
      conn.release();
      return res.status(400).json({ error: 'Chi truyen mot trong hai: order_id hoac request_id' });
    }
    if (amount <= 0) {
      conn.release();
      return res.status(400).json({ error: 'So tien phai lon hon 0' });
    }

    // Xu ly proof_urls
    let proofUrlsJson = null;
    if (Array.isArray(req.body.proof_urls)) {
      const cleaned = req.body.proof_urls
        .map(u => String(u || '').trim())
        .filter(u => /^https?:\/\//i.test(u));
      if (cleaned.length) proofUrlsJson = JSON.stringify(cleaned);
    } else if (typeof req.body.proof_urls === 'string' && /^https?:\/\//i.test(req.body.proof_urls.trim())) {
      proofUrlsJson = JSON.stringify([req.body.proof_urls.trim()]);
    }

    await conn.beginTransaction();

    let customerId;
    const methodLabel = { cash: 'Tiền mặt', transfer: 'Chuyển khoản', mixed: 'Hỗn hợp' }[payMethod];

    // -------------------------------------------------------
    // Case 1: Nhan tien tren don hang truc tiep
    // -------------------------------------------------------
    if (orderId) {
      const [orderRows] = await conn.query(
        `SELECT id, customer_id, total_amount, paid_amount FROM orders
          WHERE id = ? AND is_deleted = 0 FOR UPDATE`,
        [orderId]
      );
      if (!orderRows.length) {
        await conn.rollback(); conn.release();
        return res.status(404).json({ error: 'Khong tim thay don hang' });
      }
      const order = orderRows[0];
      customerId = order.customer_id;

      const remain = Math.max(0, Number(order.total_amount) - Number(order.paid_amount));
      const actualAmount = Math.min(amount, remain > 0 ? remain : amount);

      // Cong ngay vao paid_amount
      await conn.query(
        `UPDATE orders SET paid_amount = paid_amount + ? WHERE id = ?`,
        [actualAmount, orderId]
      );

      // Ghi log order_payments
      await conn.query(
        `INSERT INTO order_payments
           (order_id, amount, source, confirmed, confirmed_at, confirmed_by, staff_id, note, proof_urls, paid_at)
         VALUES (?, ?, 'staff_received', 1, NOW(), NULL, ?, ?, ?, NOW())`,
        [orderId, actualAmount, staffId,
         note ? `[${methodLabel}] ${note}` : `[${methodLabel}]`,
         proofUrlsJson]
      );

      await recalcPaymentStatus(conn, orderId);

      // Tao ban ghi doi soat
      let nntCode = null;
      for (let i = 0; i < 5; i++) {
        try {
          nntCode = await genNntCode(conn, i);
          await conn.query(
            `INSERT INTO staff_receipts
               (code, order_id, customer_id, amount, pay_method, proof_urls, note, staff_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nntCode, orderId, customerId, actualAmount, payMethod, proofUrlsJson, note, staffId]
          );
          break;
        } catch (e) {
          if (e.code !== 'ER_DUP_ENTRY') throw e;
        }
      }
      if (!nntCode) throw new Error('Khong sinh duoc ma NNT');

      await conn.commit();

      const noteMsg = `NV nhận ${fmtVnd(actualAmount)}đ (${methodLabel}) — ${nntCode}`;
      await appendOrderNote(conn, orderId, noteMsg, username);

      return res.status(201).json({ ok: true, code: nntCode, amount: actualAmount });
    }

    // -------------------------------------------------------
    // Case 2: Nhan tien qua phieu yeu cau thanh toan (YC-)
    // -------------------------------------------------------
    const [prRows] = await conn.query(
      `SELECT * FROM payment_requests WHERE id = ? AND is_deleted = 0 FOR UPDATE`,
      [requestId]
    );
    if (!prRows.length) {
      await conn.rollback(); conn.release();
      return res.status(404).json({ error: 'Khong tim thay phieu yeu cau' });
    }
    const pr = prRows[0];
    if (pr.status === 'paid' || pr.status === 'cancelled') {
      await conn.rollback(); conn.release();
      return res.status(400).json({ error: 'Phieu nay da dong, khong the thu them' });
    }
    customerId = pr.customer_id;

    const newPaid      = Number(pr.paid_amount) + amount;
    const newRemaining = Math.max(0, Number(pr.total_amount) - newPaid);
    const newStatus    = newRemaining <= 0 ? 'paid' : 'partially_paid';

    await conn.query(
      `UPDATE payment_requests
          SET paid_amount = ?, remaining = ?, status = ?, pay_method = ?,
              paid_at = COALESCE(paid_at, NOW())
        WHERE id = ?`,
      [newPaid, newRemaining, newStatus, payMethod, requestId]
    );

    // Lay items
    const [items] = await conn.query(
      `SELECT target_type, target_id, amount FROM payment_request_items WHERE request_id = ?`,
      [requestId]
    );

    // Tru opening_balance lan dau
    let openingBalAmount = 0;
    for (const it of items) {
      if (it.target_type === 'opening_balance') openingBalAmount += Number(it.amount);
    }
    if (openingBalAmount > 0 && pr.status === 'pending') {
      await conn.query(
        `UPDATE customers SET opening_balance = GREATEST(0, opening_balance - ?) WHERE id = ?`,
        [openingBalAmount, pr.customer_id]
      );
    }

    // Khi phieu thanh toan du: phan bo vao tung don
    const orderIds = [];
    if (newStatus === 'paid') {
      for (const it of items) {
        if (it.target_type === 'order') {
          orderIds.push(it.target_id);
          await conn.query(
            `UPDATE orders SET paid_amount = paid_amount + ? WHERE id = ?`,
            [Number(it.amount), it.target_id]
          );
        }
      }
      for (const oid of orderIds) {
        await recalcPaymentStatus(conn, oid);
      }
    }

    // Tao ban ghi doi soat
    let nntCode = null;
    for (let i = 0; i < 5; i++) {
      try {
        nntCode = await genNntCode(conn, i);
        await conn.query(
          `INSERT INTO staff_receipts
             (code, request_id, customer_id, amount, pay_method, proof_urls, note, staff_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [nntCode, requestId, customerId, amount, payMethod, proofUrlsJson, note, staffId]
        );
        break;
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') throw e;
      }
    }
    if (!nntCode) throw new Error('Khong sinh duoc ma NNT');

    await conn.commit();

    // Ghi log vao don
    const noteMsg = `NV nhận ${fmtVnd(amount)}đ (${methodLabel}) qua phiếu ${pr.code} — ${nntCode}`;
    for (const it of items) {
      if (it.target_type === 'order') {
        await appendOrderNote(conn, it.target_id, noteMsg, username);
      }
    }

    return res.status(201).json({
      ok: true, code: nntCode, amount,
      request_status: newStatus, remaining: newRemaining,
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ==============================================================
// GET /api/admin/staff-receipts
// Query: reviewed=0|1|all, staff_id, date_from, date_to, page, limit
// ==============================================================
router.get('/', adminOnly, async (req, res, next) => {
  try {
    const reviewed = req.query.reviewed;   // '0', '1', hoac bo trong = all
    const staffId  = req.query.staff_id ? Number(req.query.staff_id) : null;
    const dateFrom = req.query.date_from || null;
    const dateTo   = req.query.date_to   || null;
    const page     = Math.max(1, Number(req.query.page)  || 1);
    const limit    = Math.min(100, Math.max(10, Number(req.query.limit) || 50));
    const offset   = (page - 1) * limit;

    const where = ['sr.is_deleted = 0'];
    const params = [];

    if (reviewed === '0') { where.push('sr.reviewed = 0'); }
    else if (reviewed === '1') { where.push('sr.reviewed = 1'); }

    if (staffId) { where.push('sr.staff_id = ?'); params.push(staffId); }
    if (dateFrom) { where.push('DATE(sr.created_at) >= ?'); params.push(dateFrom); }
    if (dateTo)   { where.push('DATE(sr.created_at) <= ?'); params.push(dateTo); }

    const whereStr = 'WHERE ' + where.join(' AND ');

    const [rows] = await db.query(
      `SELECT
         sr.id, sr.code, sr.order_id, sr.request_id, sr.customer_id,
         sr.amount, sr.pay_method, sr.note, sr.proof_urls,
         sr.reviewed, sr.reviewed_at,
         sr.created_at, sr.staff_id,
         s.full_name   AS staff_name,
         rv.full_name  AS reviewed_by_name,
         c.full_name   AS customer_name, c.phone AS customer_phone,
         o.code        AS order_code,
         pr.code       AS request_code
       FROM staff_receipts sr
       LEFT JOIN staff s   ON s.id = sr.staff_id
       LEFT JOIN staff rv  ON rv.id = sr.reviewed_by
       LEFT JOIN customers c ON c.id = sr.customer_id
       LEFT JOIN orders o    ON o.id = sr.order_id
       LEFT JOIN payment_requests pr ON pr.id = sr.request_id
       ${whereStr}
       ORDER BY sr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM staff_receipts sr ${whereStr}`,
      params
    );

    const [[{ pending_count }]] = await db.query(
      `SELECT COUNT(*) AS pending_count FROM staff_receipts WHERE reviewed = 0 AND is_deleted = 0`
    );

    res.json({
      rows: rows.map(r => ({
        ...r,
        amount: Number(r.amount),
        proof_urls: r.proof_urls ? JSON.parse(r.proof_urls) : [],
      })),
      total, pending_count, page, limit,
    });
  } catch (err) { next(err); }
});

// ==============================================================
// POST /api/admin/staff-receipts/:id/review — Admin tick da kiem tra
// ==============================================================
router.post('/:id/review', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [r] = await db.query(
      `UPDATE staff_receipts
          SET reviewed = 1, reviewed_by = ?, reviewed_at = NOW()
        WHERE id = ? AND is_deleted = 0`,
      [req.user.sub, id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay ban ghi' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ==============================================================
// POST /api/admin/staff-receipts/:id/unreviewed — Go tick (sua sai)
// ==============================================================
router.post('/:id/unreviewed', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [r] = await db.query(
      `UPDATE staff_receipts SET reviewed = 0, reviewed_by = NULL, reviewed_at = NULL
        WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay ban ghi' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ==============================================================
// DELETE /api/admin/staff-receipts/:id — Admin xoa mem ban ghi
// ==============================================================
router.delete('/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [r] = await db.query(
      `UPDATE staff_receipts SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay ban ghi' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
