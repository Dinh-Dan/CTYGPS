const express = require('express');
const db = require('../../db');
const { requireRole } = require('../../middleware/auth');
const { recalcPaymentStatus } = require('../../utils/orderState');

const router = express.Router();
const adminOnly    = requireRole('admin');
const staffAllowed = requireRole('admin', 'staff');

// Sinh ma hoa don HD-DDMM-NNN (retry khi gap race UNIQUE)
async function genReceiptCode(conn, attempt = 0) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `HD-${dd}${mm}-`;
  const [rows] = await conn.query(
    `SELECT code FROM payment_receipts WHERE code LIKE ? ORDER BY code DESC LIMIT 1`,
    [`${prefix}%`]
  );
  let next = 1;
  if (rows.length) {
    const last = rows[0].code.slice(prefix.length);
    next = (parseInt(last) || 0) + 1;
  }
  return prefix + String(next + attempt).padStart(3, '0');
}

// Sinh ma phieu yeu cau YC-DDMM-NNN
async function genRequestCode(conn, attempt = 0) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `YC-${dd}${mm}-`;
  const [rows] = await conn.query(
    `SELECT code FROM payment_requests WHERE code LIKE ? ORDER BY code DESC LIMIT 1`,
    [`${prefix}%`]
  );
  let next = 1;
  if (rows.length) {
    const last = rows[0].code.slice(prefix.length);
    next = (parseInt(last) || 0) + 1;
  }
  return prefix + String(next + attempt).padStart(3, '0');
}

async function appendOrderNoteForReceipt(conn, orderId, note, username) {
  const actor = username || 'hệ thống';
  const d = new Date();
  const ts = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  const line = `[${ts} - ${actor}] ${note}`;
  try {
    await conn.query(
      `UPDATE orders
          SET progress_note = CONCAT(
            COALESCE(progress_note, ''),
            CASE
              WHEN progress_note IS NULL OR progress_note = '' OR RIGHT(progress_note, 1) = '\n'
                THEN ''
              ELSE '\n'
            END,
            ?,
            '\n'
          )
        WHERE id = ?`,
      [line, orderId]
    );
  } catch (_) {}
}

const fmtVnd = n => new Intl.NumberFormat('vi-VN').format(Number(n) || 0);

// Lay settings QR + bank
async function getQrBankSettings(conn) {
  const [rows] = await conn.query(`SELECT \`key\`, \`value\` FROM app_settings`);
  const s = {};
  for (const r of rows) s[r.key] = r.value;
  const slot = Number(s['bank.default_qr_slot'] || 1);
  return {
    qr: {
      url:   s[`qr.slot${slot}.image_url`] || '',
      label: s[`qr.slot${slot}.label`]     || '',
      slot,
    },
    bank: {
      account_no:   s[`qr.slot${slot}.account_no`]   || s['bank.account_no']   || '',
      account_name: s[`qr.slot${slot}.account_name`] || s['bank.account_name'] || '',
      bank_name:    s[`qr.slot${slot}.bank_name`]    || s['bank.bank_name']    || '',
    },
    settings: s,
  };
}

// ==============================================================
// GET /api/admin/payment-requests/receipts/:id — chi tiet 1 hoa don thanh toan (in bill)
// ==============================================================
router.get('/receipts/:id', staffAllowed, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.query(
      `SELECT r.*, pr.code AS request_code, pr.total_amount, pr.paid_amount, pr.remaining, pr.qr_slot,
              s.full_name AS created_by_name,
              c.id AS customer_id, c.code AS customer_code, c.full_name AS customer_name,
              c.phone AS customer_phone, c.address AS customer_address,
              c.company_name, c.tax_code
         FROM payment_receipts r
         JOIN payment_requests pr ON pr.id = r.request_id
         JOIN customers c ON c.id = pr.customer_id
         LEFT JOIN staff s ON s.id = r.created_by
        WHERE r.id = ? AND r.is_deleted = 0`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });

    const row = rows[0];
    const qrSlot = row.qr_slot || 1;
    const { qr, bank, settings } = await getQrBankSettings(db);
    // Override QR slot neu PR co chi dinh slot rieng
    if (row.qr_slot) {
      qr.url   = settings[`qr.slot${row.qr_slot}.image_url`] || '';
      qr.label = settings[`qr.slot${row.qr_slot}.label`]     || '';
      qr.slot  = row.qr_slot;
    }

    res.json({
      receipt: {
        id: row.id, code: row.code, amount: Number(row.amount),
        pay_method: row.pay_method, receipt_url: row.receipt_url,
        note: row.note, created_at: row.created_at,
        created_by_name: row.created_by_name,
      },
      request: {
        id: row.request_id, code: row.request_code,
        total_amount: Number(row.total_amount),
        paid_amount:  Number(row.paid_amount),
        remaining:    Number(row.remaining),
        qr_slot:      row.qr_slot,
      },
      customer: {
        id: row.customer_id, code: row.customer_code,
        full_name: row.customer_name, phone: row.customer_phone,
        address: row.customer_address, company_name: row.company_name,
        tax_code: row.tax_code,
      },
      qr, bank,
    });
  } catch (err) { next(err); }
});

// ==============================================================
// POST /api/admin/payment-requests — Tao phieu yeu cau thanh toan
// Body: { customer_id, order_ids, include_opening_balance, old_request_ids?, qr_slot?, note? }
// ==============================================================
router.post('/', staffAllowed, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const {
      customer_id, order_ids,
      include_opening_balance, old_request_ids,
      qr_slot, note,
    } = req.body;

    if (!customer_id || !Array.isArray(order_ids)) {
      conn.release();
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    }

    const parsedQrSlot = qr_slot ? Math.min(5, Math.max(1, Number(qr_slot))) : null;
    const parsedNote = String(note || '').trim() || null;

    await conn.beginTransaction();

    // Kiem tra don co trong phieu khac dang active — tra warnings, khong chan
    const warnings = [];
    if (order_ids.length > 0) {
      const placeholders = order_ids.map(() => '?').join(',');
      const [overlap] = await conn.query(
        `SELECT pri.target_id AS order_id, pr.code AS request_code
           FROM payment_request_items pri
           JOIN payment_requests pr ON pr.id = pri.request_id
          WHERE pr.status IN ('pending','partially_paid') AND pr.is_deleted = 0
            AND pri.target_type = 'order'
            AND pri.target_id IN (${placeholders})`,
        [...order_ids]
      );
      for (const row of overlap) {
        warnings.push({ order_id: row.order_id, existing_request_code: row.request_code });
      }
    }

    // Lay opening_balance khach
    const [custRows] = await conn.query(
      `SELECT opening_balance FROM customers WHERE id = ? AND is_deleted = 0 FOR UPDATE`,
      [customer_id]
    );
    if (!custRows.length) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }
    const openingBalValue = Number(custRows[0].opening_balance) || 0;

    const itemsToInsert = [];
    let totalAmount = 0;

    // Don hang — bo qua don da nam trong phieu active khac
    const skipOrderIds = new Set(warnings.map(w => w.order_id));
    if (order_ids.length > 0) {
      const placeholders = order_ids.map(() => '?').join(',');
      const [orders] = await conn.query(
        `SELECT id, total_amount, paid_amount, debt_carried_at
           FROM orders WHERE id IN (${placeholders}) AND is_deleted = 0`,
        order_ids
      );
      for (const o of orders) {
        if (o.debt_carried_at) continue;
        if (skipOrderIds.has(o.id)) continue;
        const remaining = Math.max(0, Number(o.total_amount) - Number(o.paid_amount));
        if (remaining > 0) {
          totalAmount += remaining;
          itemsToInsert.push({ type: 'order', id: o.id, amount: remaining });
        }
      }
    }

    // No ky truoc
    if (include_opening_balance && openingBalValue > 0) {
      totalAmount += openingBalValue;
      itemsToInsert.push({ type: 'opening_balance', id: customer_id, amount: openingBalValue });
    }

    // No phieu cu — chi gop cac phieu duoc chon (old_request_ids)
    const parsedOldIds = Array.isArray(old_request_ids)
      ? old_request_ids.map(Number).filter(n => n > 0)
      : [];
    if (parsedOldIds.length) {
      const ph2 = parsedOldIds.map(() => '?').join(',');
      const [oldPrs] = await conn.query(
        `SELECT id, remaining
           FROM payment_requests
          WHERE id IN (${ph2}) AND customer_id = ? AND status IN ('pending','partially_paid') AND remaining > 0 AND is_deleted = 0`,
        [...parsedOldIds, customer_id]
      );
      for (const pr of oldPrs) {
        totalAmount += Number(pr.remaining);
        itemsToInsert.push({ type: 'payment_request', id: pr.id, amount: Number(pr.remaining) });
        // Dat remaining = 0 de khong bi double-count
        await conn.query(`UPDATE payment_requests SET remaining = 0 WHERE id = ?`, [pr.id]);
      }
    }

    if (totalAmount <= 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Tổng tiền yêu cầu thanh toán phải > 0' });
    }

    // Sinh code YC-DDMM-NNN
    let code = null;
    let insRes = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        code = await genRequestCode(conn, attempt);
        const [r] = await conn.query(
          `INSERT INTO payment_requests
             (customer_id, code, total_amount, remaining, status, qr_slot, note, created_by)
           VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
          [customer_id, code, totalAmount, totalAmount, parsedQrSlot, parsedNote, req.user.sub]
        );
        insRes = r;
        break;
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') throw e;
      }
    }
    if (!insRes) throw new Error('Không sinh được mã phiếu sau nhiều lần thử');
    const requestId = insRes.insertId;

    // Insert items
    const itemValues = itemsToInsert.map(it => [requestId, it.type, it.id, it.amount]);
    await conn.query(
      `INSERT INTO payment_request_items (request_id, target_type, target_id, amount) VALUES ?`,
      [itemValues]
    );

    // Danh dau don ngay khi phieu duoc tao (khong cho cho payment dau tien)
    const orderIdsToMark = itemsToInsert.filter(it => it.type === 'order').map(it => it.id);
    if (orderIdsToMark.length > 0) {
      const phMark = orderIdsToMark.map(() => '?').join(',');
      await conn.query(
        `UPDATE orders SET debt_carried_at = NOW() WHERE id IN (${phMark}) AND debt_carried_at IS NULL`,
        orderIdsToMark
      );
    }

    // Auto-supersede tat ca phieu pending/partially_paid con lai cua khach (khong phai phieu vua tao)
    // Dong thoi reset debt_carried_at cho don hang trong cac phieu bi supersede nhung KHONG duoc carry vao phieu moi
    const [supersededRows] = await conn.query(
      `SELECT id FROM payment_requests
        WHERE customer_id = ? AND status IN ('pending','partially_paid') AND id != ? AND is_deleted = 0`,
      [customer_id, requestId]
    );
    if (supersededRows.length > 0) {
      const supersededIds = supersededRows.map(r => r.id);
      // Don hang trong phieu bi supersede nhung khong duoc carry vao phieu moi -> reset debt_carried_at
      const carriedOrderIds = new Set(orderIdsToMark);
      const phSup = supersededIds.map(() => '?').join(',');
      const [ordersInOld] = await conn.query(
        `SELECT pri.target_id AS order_id
           FROM payment_request_items pri
          WHERE pri.request_id IN (${phSup}) AND pri.target_type = 'order'`,
        supersededIds
      );
      const toReset = ordersInOld.map(r => r.order_id).filter(id => !carriedOrderIds.has(id));
      if (toReset.length > 0) {
        const phReset = toReset.map(() => '?').join(',');
        await conn.query(
          `UPDATE orders SET debt_carried_at = NULL WHERE id IN (${phReset})`,
          toReset
        );
      }
      // Chuyen phieu cu sang trang thai superseded
      await conn.query(
        `UPDATE payment_requests SET status = 'superseded' WHERE id IN (${phSup})`,
        supersededIds
      );
    }

    await conn.commit();
    res.json({ success: true, request_id: requestId, code, skipped_orders: warnings });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ==============================================================
// GET /api/admin/payment-requests — Danh sach phieu
// Query: ?status=active|paid|cancelled|all  ?q=  ?customer_id=  ?date_from=  ?date_to=  ?has_remaining=1
// ==============================================================
// GET /api/admin/payment-requests/check-overlap?order_ids=1,2,3
// Kiem tra don nao dang nam trong phieu pending/partially_paid khac
// ==============================================================
router.get('/check-overlap', staffAllowed, async (req, res, next) => {
  try {
    const ids = String(req.query.order_ids || '').split(',').map(Number).filter(n => n > 0);
    if (!ids.length) return res.json({ overlaps: [] });
    const ph = ids.map(() => '?').join(',');
    const [rows] = await db.query(
      `SELECT pri.target_id AS order_id, pr.code AS existing_request_code
         FROM payment_request_items pri
         JOIN payment_requests pr ON pr.id = pri.request_id
        WHERE pr.status IN ('pending','partially_paid') AND pr.is_deleted = 0
          AND pri.target_type = 'order'
          AND pri.target_id IN (${ph})`,
      ids
    );
    res.json({ overlaps: rows });
  } catch (err) { next(err); }
});

// ==============================================================
router.get('/', async (req, res, next) => {
  try {
    const status    = req.query.status || 'active';
    const q         = (req.query.q || '').trim();
    const custId    = Number(req.query.customer_id) || null;
    const dateFrom  = req.query.date_from || null;
    const dateTo    = req.query.date_to   || null;
    const hasRemain = req.query.has_remaining === '1';
    const orderCode = (req.query.order_code || '').trim();

    const conds = ['pr.is_deleted = 0'];
    const params = [];

    if (status === 'all') {
      conds.push(`pr.status != 'cancelled'`);
    } else if (status === 'active') {
      conds.push(`pr.status IN ('pending','partially_paid')`);
    } else {
      conds.push(`pr.status = ?`); params.push(status);
    }

    if (q) {
      conds.push(`(c.full_name LIKE ? OR c.company_name LIKE ? OR c.code LIKE ? OR c.phone LIKE ? OR pr.code LIKE ?)`);
      const like = `%${q}%`;
      params.push(like, like, like, like, like);
    }
    if (custId) { conds.push(`pr.customer_id = ?`); params.push(custId); }
    if (dateFrom) { conds.push(`DATE(pr.created_at) >= ?`); params.push(dateFrom); }
    if (dateTo)   { conds.push(`DATE(pr.created_at) <= ?`); params.push(dateTo); }
    if (hasRemain){ conds.push(`pr.remaining > 0`); }
    if (orderCode) {
      conds.push(`EXISTS (SELECT 1 FROM payment_request_items pri2 JOIN orders o2 ON o2.id = pri2.target_id WHERE pri2.request_id = pr.id AND pri2.target_type = 'order' AND o2.code LIKE ?)`);
      params.push(`%${orderCode}%`);
    }

    const [rows] = await db.query(
      `SELECT pr.id, pr.code, pr.total_amount, pr.paid_amount, pr.remaining,
              pr.status, pr.created_at, pr.paid_at, pr.qr_slot, pr.pay_method,
              c.full_name AS customer_name, c.company_name, c.code AS customer_code,
              c.phone AS customer_phone, c.avatar_url AS customer_avatar_url,
              (SELECT COUNT(*) FROM payment_request_items pri
               WHERE pri.request_id = pr.id AND pri.target_type = 'order') AS order_count
         FROM payment_requests pr
         JOIN customers c ON c.id = pr.customer_id
        WHERE ${conds.join(' AND ')}
        ORDER BY pr.created_at DESC LIMIT 500`,
      params
    );

    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ==============================================================
// GET /api/admin/payment-requests/:id — Chi tiet 1 phieu (full data de in va xem)
// ==============================================================
router.get('/:id', staffAllowed, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [prRows] = await db.query(
      `SELECT pr.*,
              s.full_name AS created_by_name,
              c.id AS cust_id, c.code AS cust_code, c.full_name AS cust_name,
              c.phone AS cust_phone, c.address AS cust_address,
              c.company_name, c.tax_code
         FROM payment_requests pr
         JOIN customers c ON c.id = pr.customer_id
         LEFT JOIN staff s ON s.id = pr.created_by
        WHERE pr.id = ? AND pr.is_deleted = 0`,
      [id]
    );
    if (!prRows.length) return res.status(404).json({ error: 'Không tìm thấy phiếu yêu cầu' });

    const pr = prRows[0];

    // Items
    const [rawItems] = await db.query(
      `SELECT pri.*,
              o.code AS order_code, o.total_amount AS order_total, o.paid_amount AS order_paid,
              o.confirmed_at, o.completed_at, o.address AS order_address,
              old_pr.code AS old_pr_code
         FROM payment_request_items pri
         LEFT JOIN orders o ON o.id = pri.target_id AND pri.target_type = 'order'
         LEFT JOIN payment_requests old_pr ON old_pr.id = pri.target_id AND pri.target_type = 'payment_request'
        WHERE pri.request_id = ?`,
      [id]
    );

    // Lay chi tiet don hang (lines, items, charges, field_values)
    const orderIds = rawItems.filter(i => i.target_type === 'order').map(i => i.target_id);
    let orderDetailMap = new Map();

    if (orderIds.length) {
      const ph = orderIds.map(() => '?').join(',');

      const [orders] = await db.query(
        `SELECT o.id, o.code, o.total_amount, o.paid_amount, o.status, o.confirmed_at, o.completed_at,
                o.address, o.note, o.assigned_staff_id,
                s.full_name AS assigned_staff_name
           FROM orders o
           LEFT JOIN staff s ON s.id = o.assigned_staff_id
          WHERE o.id IN (${ph})`,
        orderIds
      );
      const [lines] = await db.query(
        `SELECT ol.id, ol.order_id, ol.template_id, ol.custom_name, ol.seq, ol.subtotal, ol.note,
                COALESCE(ol.custom_name, t.name) AS template_name
           FROM order_lines ol
           LEFT JOIN order_templates t ON t.id = ol.template_id
          WHERE ol.order_id IN (${ph}) AND ol.is_deleted = 0
          ORDER BY ol.order_id, ol.seq, ol.id`,
        orderIds
      );
      const [oItems] = await db.query(
        `SELECT oi.id, oi.order_id, oi.line_id, oi.product_id, oi.qty, oi.unit_price, oi.vat_percent,
                p.name AS product_name, p.code AS product_code
           FROM order_items oi
           LEFT JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id IN (${ph})`,
        orderIds
      );
      const [charges] = await db.query(
        `SELECT id, order_id, line_id, kind, label, amount
           FROM order_charges
          WHERE order_id IN (${ph}) AND is_deleted = 0
          ORDER BY id`,
        orderIds
      );
      const [fieldValues] = await db.query(
        `SELECT id, order_id, line_id, item_id, template_field_id, label, value, seq
           FROM order_field_values
          WHERE order_id IN (${ph}) AND is_deleted = 0
          ORDER BY seq, id`,
        orderIds
      );

      const lineMap = new Map();
      const itemMap = new Map();
      for (const o of orders) orderDetailMap.set(o.id, { ...o, lines: [], order_charges: [] });
      for (const ln of lines) {
        const node = { ...ln, items: [], charges: [], field_values: [] };
        lineMap.set(ln.id, node);
        const od = orderDetailMap.get(ln.order_id);
        if (od) od.lines.push(node);
      }
      for (const it of oItems) {
        const itNode = { ...it, field_values: [] };
        itemMap.set(it.id, itNode);
        if (it.line_id && lineMap.has(it.line_id)) lineMap.get(it.line_id).items.push(itNode);
      }
      for (const c of charges) {
        if (c.kind === 'installation' || c.label === 'Cong lap' || c.label === 'Công lắp') continue;
        if (c.line_id == null) {
          const od = orderDetailMap.get(c.order_id);
          if (od) od.order_charges.push(c);
        } else if (lineMap.has(c.line_id)) {
          lineMap.get(c.line_id).charges.push(c);
        }
      }
      for (const fv of fieldValues) {
        if (fv.item_id && itemMap.has(fv.item_id)) {
          // Per-item (migration_071+)
          itemMap.get(fv.item_id).field_values.push(fv);
        } else if (fv.line_id && lineMap.has(fv.line_id)) {
          lineMap.get(fv.line_id).field_values.push(fv);
        } else if (!fv.line_id && !fv.item_id) {
          const od = orderDetailMap.get(fv.order_id);
          if (od) { od.field_values = od.field_values || []; od.field_values.push(fv); }
        }
      }
    }

    // Ghep items voi chi tiet
    const items = rawItems.map(it => {
      const base = {
        id: it.id, target_type: it.target_type,
        target_id: it.target_id, amount: Number(it.amount),
      };
      if (it.target_type === 'order') {
        base.order = orderDetailMap.get(it.target_id) || null;
      } else if (it.target_type === 'payment_request') {
        base.pr_code = it.old_pr_code;
      }
      return base;
    });

    // Lich su thanh toan (HD-)
    const [receipts] = await db.query(
      `SELECT r.id, r.code, r.amount, r.pay_method, r.receipt_url, r.note, r.created_at,
              s.full_name AS created_by_name
         FROM payment_receipts r
         LEFT JOIN staff s ON s.id = r.created_by
        WHERE r.request_id = ? AND r.is_deleted = 0
        ORDER BY r.created_at ASC`,
      [id]
    );

    // QR + bank
    const { qr, bank, settings } = await getQrBankSettings(db);
    if (pr.qr_slot) {
      qr.url   = settings[`qr.slot${pr.qr_slot}.image_url`] || '';
      qr.label = settings[`qr.slot${pr.qr_slot}.label`]     || '';
      qr.slot  = pr.qr_slot;
    }

    res.json({
      request: {
        id: pr.id, code: pr.code,
        total_amount:  Number(pr.total_amount),
        paid_amount:   Number(pr.paid_amount),
        remaining:     Number(pr.remaining),
        status:        pr.status,
        qr_slot:       pr.qr_slot,
        pay_method:    pr.pay_method,
        note:          pr.note,
        receipt_url:   pr.receipt_url,
        created_at:    pr.created_at,
        paid_at:       pr.paid_at,
        created_by_name: pr.created_by_name,
      },
      customer: {
        id:           pr.cust_id,
        code:         pr.cust_code,
        full_name:    pr.cust_name,
        phone:        pr.cust_phone,
        address:      pr.cust_address,
        company_name: pr.company_name,
        tax_code:     pr.tax_code,
      },
      items,
      receipts: receipts.map(r => ({ ...r, amount: Number(r.amount) })),
      qr,
      bank,
    });
  } catch (err) { next(err); }
});

// ==============================================================
// POST /api/admin/payment-requests/:id/pay — Ghi nhan thanh toan, tao HD-
// Body: { amount_paid, pay_method?, receipt_url?, note? }
// ==============================================================
router.post('/:id/pay', adminOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const reqId = Number(req.params.id);
    const amountPaid = Math.max(0, Number(req.body.amount_paid) || 0);
    const payMethod = ['cash', 'transfer', 'mixed'].includes(req.body.pay_method)
      ? req.body.pay_method : 'cash';
    const receiptUrl = String(req.body.receipt_url || '').trim() || null;
    const note = String(req.body.note || '').trim() || null;

    if (amountPaid <= 0) {
      conn.release();
      return res.status(400).json({ error: 'Số tiền thanh toán phải > 0' });
    }

    await conn.beginTransaction();

    const [prRows] = await conn.query(
      `SELECT * FROM payment_requests WHERE id = ? AND is_deleted = 0 FOR UPDATE`,
      [reqId]
    );
    if (!prRows.length) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Không tìm thấy phiếu yêu cầu' });
    }

    const pr = prRows[0];
    if (pr.status === 'paid' || pr.status === 'cancelled') {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Phiếu này đã đóng, không thể thêm thanh toán' });
    }

    // Sinh code HD-
    let receiptCode = null;
    let insReceipt = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        receiptCode = await genReceiptCode(conn, attempt);
        const [r] = await conn.query(
          `INSERT INTO payment_receipts (code, request_id, amount, pay_method, receipt_url, note, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [receiptCode, reqId, amountPaid, payMethod, receiptUrl, note, req.user.sub]
        );
        insReceipt = r;
        break;
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') throw e;
      }
    }
    if (!insReceipt) throw new Error('Không sinh được mã hóa đơn sau nhiều lần thử');
    const receiptId = insReceipt.insertId;

    // Cap nhat paid_amount, remaining, status tren phieu
    const newPaidAmount = Number(pr.paid_amount) + amountPaid;
    const newRemaining = Math.max(0, Number(pr.total_amount) - newPaidAmount);
    const newStatus = newRemaining <= 0 ? 'paid' : 'partially_paid';

    await conn.query(
      `UPDATE payment_requests
          SET paid_amount = ?, remaining = ?, status = ?, pay_method = ?,
              paid_at = COALESCE(paid_at, NOW())
        WHERE id = ?`,
      [newPaidAmount, newRemaining, newStatus, payMethod, reqId]
    );

    // Lay items de xu ly orders va opening_balance
    const [items] = await conn.query(
      `SELECT target_type, target_id, amount FROM payment_request_items WHERE request_id = ?`,
      [reqId]
    );

    const orderIds = [];
    let openingBalAmount = 0;

    for (const it of items) {
      if (it.target_type === 'order') {
        orderIds.push(it.target_id);
      } else if (it.target_type === 'opening_balance') {
        openingBalAmount += Number(it.amount);
      }
    }

    // Tru opening_balance: chi tru khi day la lan thanh toan dau tien (status dang pending)
    if (openingBalAmount > 0 && pr.status === 'pending') {
      await conn.query(
        `UPDATE customers SET opening_balance = GREATEST(0, opening_balance - ?) WHERE id = ?`,
        [openingBalAmount, pr.customer_id]
      );
    }

    // Khi phieu da thanh toan du: cap nhat paid_amount tung don va tinh lai payment_status
    if (newStatus === 'paid' && orderIds.length > 0) {
      for (const it of items) {
        if (it.target_type === 'order') {
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

    await conn.commit();

    // Ghi log vao progress_note cua tung don trong phieu
    const username = req.user?.username || 'hệ thống';
    const methodLabel = { cash: 'Tiền mặt', transfer: 'Chuyển khoản', mixed: 'Hỗn hợp' }[payMethod] || payMethod;
    const noteMsg = `Thu qua phiếu ${pr.code} (${receiptCode}) ${fmtVnd(amountPaid)}đ [${methodLabel}]`;
    for (const it of items) {
      if (it.target_type === 'order') {
        await appendOrderNoteForReceipt(conn, it.target_id, noteMsg, username);
      }
    }

    res.json({
      success: true,
      receipt_id: receiptId,
      receipt_code: receiptCode,
      paid_amount: newPaidAmount,
      remaining: newRemaining,
      status: newStatus,
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ==============================================================
// POST /api/admin/payment-requests/:id/cancel — Huy phieu
// ==============================================================
router.post('/:id/cancel', staffAllowed, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const reqId = Number(req.params.id);
    await conn.beginTransaction();

    const [prRows] = await conn.query(
      `SELECT * FROM payment_requests WHERE id = ? AND is_deleted = 0 FOR UPDATE`,
      [reqId]
    );

    if (!prRows.length) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Không tìm thấy phiếu yêu cầu' });
    }

    const pr = prRows[0];
    if (pr.status === 'paid') {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Không thể huỷ phiếu đã thanh toán đầy đủ' });
    }
    if (pr.status === 'superseded') {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Phiếu này đã bị thay thế bởi phiếu mới, không thể huỷ' });
    }
    if (Number(pr.paid_amount) > 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Không thể huỷ phiếu đã nhận tiền một phần. Liên hệ admin để xử lý.' });
    }

    // Phieu chua nhan tien (paid_amount = 0): hoan nguyen toan bo state
    const [cancelItems] = await conn.query(
      `SELECT target_type, target_id, amount FROM payment_request_items WHERE request_id = ?`,
      [reqId]
    );

    // Go debt_carried_at tren cac don trong phieu
    const cancelOrderIds = cancelItems.filter(it => it.target_type === 'order').map(it => it.target_id);
    if (cancelOrderIds.length > 0) {
      const phc = cancelOrderIds.map(() => '?').join(',');
      await conn.query(
        `UPDATE orders SET debt_carried_at = NULL WHERE id IN (${phc})`,
        cancelOrderIds
      );
    }

    // Khoi phuc remaining cua cac phieu YC cu da bi set ve 0 khi tao phieu nay
    const oldPrIds = cancelItems.filter(it => it.target_type === 'payment_request').map(it => it.target_id);
    for (const oldPrId of oldPrIds) {
      const matchItem = cancelItems.find(it => it.target_type === 'payment_request' && it.target_id === oldPrId);
      if (matchItem) {
        await conn.query(
          `UPDATE payment_requests SET remaining = remaining + ? WHERE id = ?`,
          [Number(matchItem.amount), oldPrId]
        );
      }
    }

    await conn.query(
      `UPDATE payment_requests SET status = 'cancelled', is_deleted = 1 WHERE id = ?`,
      [reqId]
    );

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
