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

async function ensureStaffReceiptSchema() {
  const addCol = async (ddl) => {
    try { await db.query(`ALTER TABLE staff_receipts ADD COLUMN ${ddl}`); }
    catch (err) { if (err.code !== 'ER_DUP_FIELDNAME') throw err; }
  };
  await addCol(`status ENUM('active','cancelled') NOT NULL DEFAULT 'active' AFTER staff_id`);
  await addCol(`cancel_reason TEXT NULL`);
  await addCol(`cancelled_by INT NULL`);
  await addCol(`cancelled_at DATETIME NULL`);
  try {
    await db.query(
      `ALTER TABLE staff_receipts ADD INDEX idx_sr_status (status, created_at)`
    );
  } catch (err) {
    if (err.code !== 'ER_DUP_KEYNAME') throw err;
  }
}

// Lý do huỷ phải đủ dài để có thể tra cứu sau này (không cho gõ qua loa vài ký tự)
const MIN_CANCEL_REASON = 10;

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
      return res.status(400).json({ error: 'Phải truyền order_id hoặc request_id' });
    }
    if (orderId && requestId) {
      conn.release();
      return res.status(400).json({ error: 'Chỉ truyền một trong hai: order_id hoặc request_id' });
    }
    if (amount <= 0) {
      conn.release();
      return res.status(400).json({ error: 'Số tiền phải lớn hơn 0' });
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
        return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
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
      if (!nntCode) throw new Error('Không sinh được mã NNT');

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
      return res.status(404).json({ error: 'Không tìm thấy phiếu yêu cầu' });
    }
    const pr = prRows[0];
    if (pr.status === 'paid' || pr.status === 'cancelled') {
      await conn.rollback(); conn.release();
      return res.status(400).json({ error: 'Phiếu này đã đóng, không thể thu thêm' });
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
    if (!nntCode) throw new Error('Không sinh được mã NNT');

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
// Query:
//   reviewed = 0|1|'' (all)
//   status   = active|cancelled|all   (mac dinh: active)
//   search   = tu khoa (ma NNT / ten KH / SDT / ma don / ma phieu / ghi chu)
//   staff_id, date_from, date_to, page, limit
// ==============================================================
router.get('/', adminOnly, async (req, res, next) => {
  try {
    await ensureStaffReceiptSchema();
    const reviewed = req.query.reviewed;   // '0', '1', hoac bo trong = all
    const status   = (req.query.status || 'active').toLowerCase(); // active | cancelled | all
    const search   = String(req.query.search || '').trim();
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

    // Loc theo trang thai phieu (active / cancelled). 'all' = khong loc.
    if (status === 'active')         { where.push("sr.status = 'active'"); }
    else if (status === 'cancelled') { where.push("sr.status = 'cancelled'"); }

    if (staffId) { where.push('sr.staff_id = ?'); params.push(staffId); }
    if (dateFrom) { where.push('DATE(sr.created_at) >= ?'); params.push(dateFrom); }
    if (dateTo)   { where.push('DATE(sr.created_at) <= ?'); params.push(dateTo); }

    if (search) {
      where.push(`(sr.code LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?
                   OR o.code LIKE ? OR pr.code LIKE ? OR sr.note LIKE ?)`);
      const like = `%${search}%`;
      params.push(like, like, like, like, like, like);
    }

    const whereStr = 'WHERE ' + where.join(' AND ');

    // Cac JOIN dung chung cho ca query lay du lieu va dem tong
    // (can cho LIKE tren customers/orders/payment_requests trong search)
    const joins = `
       LEFT JOIN customers c ON c.id = sr.customer_id
       LEFT JOIN orders o    ON o.id = sr.order_id
       LEFT JOIN payment_requests pr ON pr.id = sr.request_id`;

    const [rows] = await db.query(
      `SELECT
         sr.id, sr.code, sr.order_id, sr.request_id, sr.customer_id,
         sr.amount, sr.pay_method, sr.note, sr.proof_urls,
         sr.reviewed, sr.reviewed_at, sr.status,
         sr.cancel_reason, sr.cancelled_at,
         sr.created_at, sr.staff_id,
         s.full_name   AS staff_name,
         rv.full_name  AS reviewed_by_name,
         cb.full_name  AS cancelled_by_name,
         c.full_name   AS customer_name, c.phone AS customer_phone,
         o.code        AS order_code,
         pr.code       AS request_code
       FROM staff_receipts sr
       LEFT JOIN staff s   ON s.id = sr.staff_id
       LEFT JOIN staff rv  ON rv.id = sr.reviewed_by
       LEFT JOIN staff cb  ON cb.id = sr.cancelled_by
       ${joins}
       ${whereStr}
       ORDER BY sr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total
         FROM staff_receipts sr
         ${joins}
       ${whereStr}`,
      params
    );

    // Chi dem cac phieu CON HIEU LUC chua doi soat (khong tinh phieu da huy)
    const [[{ pending_count }]] = await db.query(
      `SELECT COUNT(*) AS pending_count FROM staff_receipts
        WHERE reviewed = 0 AND is_deleted = 0 AND status = 'active'`
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
    await ensureStaffReceiptSchema();
    const id = Number(req.params.id);
    const [r] = await db.query(
      `UPDATE staff_receipts
          SET reviewed = 1, reviewed_by = ?, reviewed_at = NOW()
        WHERE id = ? AND is_deleted = 0 AND status = 'active'`,
      [req.user.sub, id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Không tìm thấy bản ghi' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ==============================================================
// POST /api/admin/staff-receipts/:id/unreviewed — Go tick (sua sai)
// ==============================================================
router.post('/:id/unreviewed', adminOnly, async (req, res, next) => {
  try {
    await ensureStaffReceiptSchema();
    const id = Number(req.params.id);
    const [r] = await db.query(
      `UPDATE staff_receipts SET reviewed = 0, reviewed_by = NULL, reviewed_at = NULL
        WHERE id = ? AND is_deleted = 0 AND status = 'active'`,
      [id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Không tìm thấy bản ghi' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ==============================================================
// POST /api/admin/staff-receipts/:id/cancel — Admin huy phieu thu
// Body: { reason }  (bat buoc, toi thieu MIN_CANCEL_REASON ky tu)
//
// Khi huy: DAO LAI hieu ung tien da ghi nhan, theo dung chuan ke toan
//   - Phieu thu tren don   -> tru lai orders.paid_amount + ghi order_payments source='refund'
//   - Phieu thu qua YC-     -> dao payment_requests; neu da phan bo vao don thi dao luon;
//                              hoan lai opening_balance neu phieu ve 0
//   - Phieu goc KHONG bi xoa, chi danh dau status='cancelled' + luu ly do / nguoi / thoi diem
// ==============================================================
router.post('/:id/cancel', adminOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await ensureStaffReceiptSchema();
    const id     = Number(req.params.id);
    const reason = String(req.body.reason || '').trim();

    if (reason.length < MIN_CANCEL_REASON) {
      conn.release();
      return res.status(400).json({
        error: `Lý do huỷ phải có ít nhất ${MIN_CANCEL_REASON} ký tự — mô tả rõ vì sao huỷ để còn tra cứu sau này.`
      });
    }

    const username = req.user.username || req.user.full_name || 'admin';

    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT * FROM staff_receipts WHERE id = ? AND is_deleted = 0 FOR UPDATE`,
      [id]
    );
    if (!rows.length) {
      await conn.rollback(); conn.release();
      return res.status(404).json({ error: 'Không tìm thấy bản ghi' });
    }
    const sr = rows[0];
    if (sr.status === 'cancelled') {
      await conn.rollback(); conn.release();
      return res.status(409).json({ error: 'Phiếu này đã huỷ trước đó' });
    }

    const amount = Number(sr.amount) || 0;

    // ---------- DAO TIEN ----------
    if (sr.order_id) {
      // Phieu thu gan truc tiep vao 1 don
      const [oRows] = await conn.query(
        `SELECT id FROM orders WHERE id = ? AND is_deleted = 0 FOR UPDATE`,
        [sr.order_id]
      );
      if (oRows.length) {
        await conn.query(
          `UPDATE orders SET paid_amount = GREATEST(0, paid_amount - ?) WHERE id = ?`,
          [amount, sr.order_id]
        );
        await conn.query(
          `INSERT INTO order_payments
             (order_id, amount, source, confirmed, confirmed_at, confirmed_by, staff_id, note, paid_at)
           VALUES (?, ?, 'refund', 1, NOW(), ?, ?, ?, NOW())`,
          [sr.order_id, amount, req.user.sub, sr.staff_id, `Huỷ phiếu thu ${sr.code}: ${reason}`]
        );
        await recalcPaymentStatus(conn, sr.order_id);
        await appendOrderNote(conn, sr.order_id,
          `Huỷ phiếu thu ${sr.code} (${fmtVnd(amount)}đ) — ${reason}`, username);
      }
    } else if (sr.request_id) {
      // Phieu thu qua phieu yeu cau thanh toan (YC-)
      const [prRows] = await conn.query(
        `SELECT * FROM payment_requests WHERE id = ? AND is_deleted = 0 FOR UPDATE`,
        [sr.request_id]
      );
      if (prRows.length) {
        const pr = prRows[0];
        const wasPaid     = pr.status === 'paid';
        const newPaid     = Math.max(0, Number(pr.paid_amount) - amount);
        const newRemaining = Math.max(0, Number(pr.total_amount) - newPaid);
        const newStatus   = newPaid <= 0 ? 'pending'
                          : (newRemaining <= 0 ? 'paid' : 'partially_paid');

        await conn.query(
          `UPDATE payment_requests SET paid_amount = ?, remaining = ?, status = ? WHERE id = ?`,
          [newPaid, newRemaining, newStatus, sr.request_id]
        );

        const [items] = await conn.query(
          `SELECT target_type, target_id, amount FROM payment_request_items WHERE request_id = ?`,
          [sr.request_id]
        );

        // Neu truoc do phieu da thanh toan du va phan bo vao cac don -> dao lai
        // Luu y: luc POST (request) KHONG tao order_payments rieng (chi cong thang
        // paid_amount), nen o day chi tru lai paid_amount, KHONG ghi refund order_payments
        // de tranh lam lech bao cao doanh thu.
        if (wasPaid) {
          for (const it of items) {
            if (it.target_type === 'order') {
              await conn.query(
                `UPDATE orders SET paid_amount = GREATEST(0, paid_amount - ?) WHERE id = ?`,
                [Number(it.amount), it.target_id]
              );
              await recalcPaymentStatus(conn, it.target_id);
              await appendOrderNote(conn, it.target_id,
                `Huỷ phiếu thu ${sr.code} qua phiếu ${pr.code} — ${reason}`, username);
            }
          }
        }

        // Neu dao het tien -> hoan lai opening_balance da tru luc thu lan dau
        if (newPaid <= 0) {
          let openingBalAmount = 0;
          for (const it of items) {
            if (it.target_type === 'opening_balance') openingBalAmount += Number(it.amount);
          }
          if (openingBalAmount > 0) {
            await conn.query(
              `UPDATE customers SET opening_balance = opening_balance + ? WHERE id = ?`,
              [openingBalAmount, pr.customer_id]
            );
          }
        }
      }
    }

    // ---------- Danh dau phieu da huy (giu nguyen ban ghi) ----------
    await conn.query(
      `UPDATE staff_receipts
          SET status = 'cancelled', reviewed = 0, reviewed_by = NULL, reviewed_at = NULL,
              cancel_reason = ?, cancelled_by = ?, cancelled_at = NOW()
        WHERE id = ?`,
      [reason, req.user.sub, id]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
