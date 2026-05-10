// /api/admin/staff-stock — Phat hang tu kho cong ty cho KTV.
// KTV om mot luong san pham truoc, di lam nhieu don. Khong gan don nao
// tai thoi diem phat — chi check holdings du khi gan KTV vao don.
//
// Endpoints:
//   GET  /                       danh sach holdings cua moi KTV
//   GET  /:staffId               holdings cua 1 KTV
//   POST /grant                  phat hang cho 1 KTV (tru product_stock + cong staff_holdings)
//   POST /revoke                 KTV tra hang lai kho cong ty
//   GET  /history                lich su phat hang (stock_receipts reason='staff_grant')

const express = require('express');
const db = require('../../db');

const router = express.Router();

function httpErr(status, message) {
  const e = new Error(message); e.status = status; return e;
}

async function genReceiptCode(conn, kind) {
  const prefix = kind === 'in' ? 'PN' : 'PX';
  const now = new Date();
  const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const like = `${prefix}-${datePart}-%`;
  const [rows] = await conn.query(
    `SELECT code FROM stock_receipts WHERE code LIKE ? ORDER BY code DESC LIMIT 1`, [like]
  );
  let next = 1;
  if (rows.length) {
    const tail = rows[0].code.slice(`${prefix}-${datePart}-`.length);
    next = (parseInt(tail) || 0) + 1;
  }
  return `${prefix}-${datePart}-${String(next).padStart(3, '0')}`;
}

// GET / — tat ca KTV + tong san pham dang om
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT s.id AS staff_id, s.full_name, s.phone,
              h.product_id, h.qty, h.first_held_at,
              p.code AS product_code, p.name AS product_name, p.thumbnail_url
         FROM staff s
         LEFT JOIN staff_holdings h ON h.staff_id = s.id
         LEFT JOIN products p ON p.id = h.product_id
        WHERE s.is_deleted = 0 AND s.role = 'kithuat'
        ORDER BY s.full_name, p.code`
    );
    // Group theo staff
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.staff_id)) {
        map.set(r.staff_id, {
          staff_id: r.staff_id, full_name: r.full_name, phone: r.phone, items: [],
        });
      }
      if (r.product_id) {
        map.get(r.staff_id).items.push({
          product_id: r.product_id, product_code: r.product_code,
          product_name: r.product_name, thumbnail_url: r.thumbnail_url,
          qty: r.qty, first_held_at: r.first_held_at,
        });
      }
    }
    res.json({ items: Array.from(map.values()) });
  } catch (err) { next(err); }
});

// GET /:staffId
router.get('/:staffId(\\d+)', async (req, res, next) => {
  try {
    const sid = Number(req.params.staffId);
    const [rows] = await db.query(
      `SELECT h.product_id, h.qty, h.first_held_at,
              p.code, p.name, p.thumbnail_url
         FROM staff_holdings h
         JOIN products p ON p.id = h.product_id
        WHERE h.staff_id = ?
        ORDER BY p.code`, [sid]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// POST /grant — admin phat hang cho KTV
// Body: { staff_id, items: [{product_id, qty, imei_list?}], note? }
router.post('/grant', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const staffId = Number(req.body.staff_id);
    if (!staffId) throw httpErr(400, 'Thieu staff_id');
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) throw httpErr(400, 'Phai co it nhat 1 san pham');

    const lines = [];
    const seen = new Set();
    for (const raw of items) {
      const productId = Number(raw.product_id);
      const qty = Number(raw.qty);
      if (!productId) throw httpErr(400, 'Thieu product_id');
      if (!qty || qty <= 0) throw httpErr(400, 'qty phai > 0');
      if (seen.has(productId)) throw httpErr(400, 'Moi SP chi 1 dong');
      seen.add(productId);
      lines.push({
        product_id: productId, qty,
        imei_list: raw.imei_list ? String(raw.imei_list).trim() : null,
      });
    }

    const [staffRow] = await conn.query(
      `SELECT id FROM staff WHERE id = ? AND is_deleted = 0 AND role = 'kithuat'`,
      [staffId]
    );
    if (!staffRow.length) throw httpErr(400, 'KTV khong hop le');

    await conn.beginTransaction();
    lines.sort((a, b) => a.product_id - b.product_id);
    for (const l of lines) {
      const [psRows] = await conn.query(
        `SELECT quantity FROM product_stock WHERE product_id = ? FOR UPDATE`, [l.product_id]
      );
      const cur = psRows.length ? Number(psRows[0].quantity) : 0;
      if (cur < l.qty) throw httpErr(409, `Kho khong du SP id=${l.product_id} (con ${cur}, can ${l.qty})`);
    }

    const code = await genReceiptCode(conn, 'out');
    const adminId = req.user && req.user.sub ? req.user.sub : null;
    const [rIns] = await conn.query(
      `INSERT INTO stock_receipts
         (code, kind, reason_code, reason_text, ref_staff_id, created_by_staff_id)
       VALUES (?, 'out', 'staff_grant', ?, ?, ?)`,
      [code, req.body.note || null, staffId, adminId]
    );
    const receiptId = rIns.insertId;

    for (const l of lines) {
      await conn.query(
        `INSERT INTO stock_receipt_items (receipt_id, product_id, qty, imei_list)
         VALUES (?, ?, ?, ?)`,
        [receiptId, l.product_id, l.qty, l.imei_list]
      );
      await conn.query(
        `UPDATE product_stock SET quantity = quantity - ? WHERE product_id = ?`,
        [l.qty, l.product_id]
      );
      await conn.query(
        `INSERT INTO staff_holdings (staff_id, product_id, qty, first_held_at)
         VALUES (?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)`,
        [staffId, l.product_id, l.qty]
      );
    }
    await conn.commit();
    res.status(201).json({ receipt: { id: receiptId, code } });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// POST /revoke — KTV tra hang lai kho cong ty (chua tieu thu)
// Body: { staff_id, items: [{product_id, qty}], note? }
router.post('/revoke', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const staffId = Number(req.body.staff_id);
    if (!staffId) throw httpErr(400, 'Thieu staff_id');
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) throw httpErr(400, 'Phai co it nhat 1 san pham');

    const lines = [];
    for (const raw of items) {
      const pid = Number(raw.product_id);
      const qty = Number(raw.qty);
      if (!pid || !qty || qty <= 0) throw httpErr(400, 'Item khong hop le');
      lines.push({ product_id: pid, qty });
    }

    await conn.beginTransaction();
    const code = await genReceiptCode(conn, 'in');
    const adminId = req.user && req.user.sub ? req.user.sub : null;
    const [rIns] = await conn.query(
      `INSERT INTO stock_receipts
         (code, kind, reason_code, reason_text, ref_staff_id, created_by_staff_id)
       VALUES (?, 'in', 'staff_revoke', ?, ?, ?)`,
      [code, req.body.note || null, staffId, adminId]
    );
    const receiptId = rIns.insertId;

    for (const l of lines) {
      const [shRows] = await conn.query(
        `SELECT id, qty FROM staff_holdings
          WHERE staff_id = ? AND product_id = ? FOR UPDATE`,
        [staffId, l.product_id]
      );
      if (!shRows.length || Number(shRows[0].qty) < l.qty) {
        throw httpErr(409, `KTV khong du SP id=${l.product_id} de tra (dang co ${shRows[0]?.qty || 0})`);
      }
      if (Number(shRows[0].qty) === l.qty) {
        await conn.query(`DELETE FROM staff_holdings WHERE id = ?`, [shRows[0].id]);
      } else {
        await conn.query(`UPDATE staff_holdings SET qty = qty - ? WHERE id = ?`, [l.qty, shRows[0].id]);
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
    await conn.commit();
    res.status(201).json({ receipt: { id: receiptId, code } });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

// GET /history — lich su phat/thu hoi
router.get('/history', async (req, res, next) => {
  try {
    const sid = Number(req.query.staff_id) || 0;
    const reason = String(req.query.reason || '').trim();
    const dateFrom = String(req.query.date_from || '').trim();
    const dateTo = String(req.query.date_to || '').trim();
    const q = String(req.query.q || '').trim();
    const where = [`r.reason_code IN ('staff_grant', 'staff_revoke')`, 'r.is_voided = 0'];
    const args = [];
    if (sid) { where.push('r.ref_staff_id = ?'); args.push(sid); }
    if (reason === 'staff_grant' || reason === 'staff_revoke') {
      where.push('r.reason_code = ?'); args.push(reason);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
      where.push('r.created_at >= ?'); args.push(dateFrom + ' 00:00:00');
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
      where.push('r.created_at <= ?'); args.push(dateTo + ' 23:59:59');
    }
    if (q) {
      where.push('r.code LIKE ?'); args.push(`%${q}%`);
    }
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const [rows] = await db.query(
      `SELECT r.id, r.code, r.kind, r.reason_code, r.reason_text, r.created_at,
              r.ref_staff_id, s.full_name AS staff_name,
              cb.full_name AS created_by_name
         FROM stock_receipts r
         LEFT JOIN staff s  ON s.id = r.ref_staff_id
         LEFT JOIN staff cb ON cb.id = r.created_by_staff_id
        WHERE ${where.join(' AND ')}
        ORDER BY r.id DESC
        LIMIT ?`, [...args, limit]
    );
    if (!rows.length) return res.json({ items: [] });

    const ids = rows.map(r => r.id);
    const [items] = await db.query(
      `SELECT ri.receipt_id, ri.product_id, ri.qty, ri.imei_list,
              p.code AS product_code, p.name AS product_name
         FROM stock_receipt_items ri
         JOIN products p ON p.id = ri.product_id
        WHERE ri.receipt_id IN (?)`,
      [ids]
    );
    const itemMap = new Map();
    for (const it of items) {
      if (!itemMap.has(it.receipt_id)) itemMap.set(it.receipt_id, []);
      itemMap.get(it.receipt_id).push(it);
    }
    res.json({
      items: rows.map(r => ({ ...r, items: itemMap.get(r.id) || [] })),
    });
  } catch (err) { next(err); }
});

module.exports = router;
