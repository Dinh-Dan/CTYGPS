// /api/admin/staff-issues — Phieu cap san pham cho KTV
// Flow: draft -> approved (sinh stock_receipt out + cong staff_holdings) -> received (KTV xac nhan)
// Hoac: draft -> rejected | cancelled

const express = require('express');
const db = require('../../db');

const router = express.Router();

const ALLOWED_STATUSES = ['draft', 'approved', 'received', 'rejected', 'cancelled'];

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

async function genIssueCode(conn) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const datePart = `${dd}${mm}`;
  const like = `CAP-${datePart}-%`;
  const [rows] = await conn.query(
    `SELECT code FROM staff_stock_issues WHERE code LIKE ? ORDER BY id DESC LIMIT 1`,
    [like]
  );
  let next = 1;
  if (rows.length) {
    const tail = rows[0].code.slice(`CAP-${datePart}-`.length);
    next = (parseInt(tail) || 0) + 1;
  }
  return `CAP-${datePart}-${String(next).padStart(3, '0')}`;
}

async function genReceiptCode(conn, kind) {
  const prefix = kind === 'in' ? 'PN' : 'PX';
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePart = `${yy}${mm}${dd}`;
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

async function loadIssueDetail(idOrCode, byCode = false) {
  const where = byCode ? 'i.code = ?' : 'i.id = ?';
  const [rows] = await db.query(
    `SELECT i.*,
            s.full_name AS staff_name,
            s.phone AS staff_phone,
            creator.full_name AS created_by_name,
            approver.full_name AS approved_by_name,
            r.code AS receipt_code
       FROM staff_stock_issues i
       JOIN staff s ON s.id = i.staff_id
       LEFT JOIN staff creator  ON creator.id  = i.created_by_staff_id
       LEFT JOIN staff approver ON approver.id = i.approved_by_staff_id
       LEFT JOIN stock_receipts r ON r.id = i.ref_receipt_id
      WHERE ${where} AND i.is_deleted = 0
      LIMIT 1`,
    [idOrCode]
  );
  if (!rows.length) return null;
  const head = rows[0];
  const [items] = await db.query(
    `SELECT it.*, p.code AS product_code, p.name AS product_name, p.thumbnail_url,
            COALESCE(ps.quantity, 0) AS stock_qty
       FROM staff_stock_issue_items it
       JOIN products p ON p.id = it.product_id
       LEFT JOIN product_stock ps ON ps.product_id = it.product_id
      WHERE it.issue_id = ?
      ORDER BY it.id`,
    [head.id]
  );
  return { ...head, items };
}

// ---- GET / -----------------------------------------------------
// Query: ?status, ?staff_id, ?q, ?page, ?limit
router.get('/', async (req, res, next) => {
  try {
    const where = ['i.is_deleted = 0'];
    const args = [];
    if (req.query.status && ALLOWED_STATUSES.includes(req.query.status)) {
      where.push('i.status = ?');
      args.push(req.query.status);
    }
    if (req.query.staff_id) {
      where.push('i.staff_id = ?');
      args.push(Number(req.query.staff_id));
    }
    const q = (req.query.q || '').trim();
    if (q) {
      where.push('(i.code LIKE ? OR s.full_name LIKE ? OR s.phone LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like, like);
    }
    const whereSql = 'WHERE ' + where.join(' AND ');

    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
         FROM staff_stock_issues i
         JOIN staff s ON s.id = i.staff_id
         ${whereSql}`,
      args
    );

    const [rows] = await db.query(
      `SELECT i.id, i.code, i.staff_id, i.status, i.note,
              i.created_at, i.approved_at, i.received_at,
              s.full_name AS staff_name, s.phone AS staff_phone,
              creator.full_name AS created_by_name,
              (SELECT COUNT(*) FROM staff_stock_issue_items it WHERE it.issue_id = i.id) AS line_count,
              (SELECT COALESCE(SUM(qty_requested),0) FROM staff_stock_issue_items it WHERE it.issue_id = i.id) AS total_requested,
              (SELECT COALESCE(SUM(qty_approved),0)  FROM staff_stock_issue_items it WHERE it.issue_id = i.id) AS total_approved
         FROM staff_stock_issues i
         JOIN staff s ON s.id = i.staff_id
         LEFT JOIN staff creator ON creator.id = i.created_by_staff_id
         ${whereSql}
         ORDER BY i.id DESC
         LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    res.json({ items: rows, total: countRows[0].total, page, limit });
  } catch (err) { next(err); }
});

// ---- GET /:id --------------------------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const detail = await loadIssueDetail(Number(req.params.id));
    if (!detail) return res.status(404).json({ error: 'Khong tim thay phieu cap' });
    res.json(detail);
  } catch (err) { next(err); }
});

// ---- POST / ----------------------------------------------------
// Body: { staff_id, note?, items:[{product_id, qty_requested, imei_list?, note?}] }
// Tao phieu o trang thai 'draft', chua dong vao kho.
router.post('/', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const staffId = Number(req.body.staff_id);
    if (!staffId) throw httpErr(400, 'Thieu staff_id');
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) throw httpErr(400, 'Phieu phai co it nhat 1 dong');

    const lines = [];
    const productIds = new Set();
    for (const raw of items) {
      const productId = Number(raw.product_id);
      const qty = Number(raw.qty_requested || raw.qty);
      if (!productId) throw httpErr(400, 'Thieu product_id');
      if (!qty || qty <= 0) throw httpErr(400, 'qty_requested phai > 0');
      if (productIds.has(productId)) throw httpErr(400, 'Moi san pham chi 1 dong / phieu');
      productIds.add(productId);
      lines.push({
        product_id: productId,
        qty_requested: qty,
        imei_list: raw.imei_list ? String(raw.imei_list).trim() : null,
        note: raw.note ? String(raw.note).trim() : null,
      });
    }

    await conn.beginTransaction();

    const [stf] = await conn.query(
      `SELECT id, role FROM staff WHERE id = ? AND is_deleted = 0`, [staffId]
    );
    if (!stf.length) throw httpErr(404, 'KTV khong ton tai');
    if (stf[0].role !== 'kithuat') throw httpErr(400, 'Chi cap cho KTV');

    const ph = lines.map(() => '?').join(',');
    const [prods] = await conn.query(
      `SELECT id FROM products WHERE id IN (${ph}) AND is_deleted = 0`,
      lines.map(l => l.product_id)
    );
    if (prods.length !== lines.length) throw httpErr(404, 'Co san pham khong ton tai');

    const code = await genIssueCode(conn);
    const adminId = req.user && req.user.sub ? req.user.sub : null;
    const note = req.body.note ? String(req.body.note).trim() : null;

    const [ins] = await conn.query(
      `INSERT INTO staff_stock_issues
         (code, staff_id, status, note, created_by_staff_id)
       VALUES (?, ?, 'draft', ?, ?)`,
      [code, staffId, note, adminId]
    );
    const issueId = ins.insertId;

    for (const l of lines) {
      await conn.query(
        `INSERT INTO staff_stock_issue_items
           (issue_id, product_id, qty_requested, imei_list, note)
         VALUES (?, ?, ?, ?, ?)`,
        [issueId, l.product_id, l.qty_requested, l.imei_list, l.note]
      );
    }

    await conn.commit();
    const detail = await loadIssueDetail(issueId);
    res.status(201).json(detail);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- PATCH /:id ------------------------------------------------
// Sua phieu khi van con o trang thai draft.
// Body co the gom: { note?, items?:[{product_id, qty_requested, imei_list?, note?}] }
// Neu items truyen len -> replace toan bo line.
router.patch('/:id', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    await conn.beginTransaction();

    const [hRows] = await conn.query(
      `SELECT * FROM staff_stock_issues WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!hRows.length) throw httpErr(404, 'Khong tim thay phieu cap');
    if (hRows[0].status !== 'draft') throw httpErr(400, 'Chi sua duoc phieu o trang thai draft');

    if (req.body.note !== undefined) {
      const note = req.body.note ? String(req.body.note).trim() : null;
      await conn.query(`UPDATE staff_stock_issues SET note = ? WHERE id = ?`, [note, id]);
    }

    if (Array.isArray(req.body.items)) {
      const items = req.body.items;
      if (!items.length) throw httpErr(400, 'Phieu phai co it nhat 1 dong');
      const lines = [];
      const productIds = new Set();
      for (const raw of items) {
        const productId = Number(raw.product_id);
        const qty = Number(raw.qty_requested || raw.qty);
        if (!productId) throw httpErr(400, 'Thieu product_id');
        if (!qty || qty <= 0) throw httpErr(400, 'qty_requested phai > 0');
        if (productIds.has(productId)) throw httpErr(400, 'Moi san pham chi 1 dong / phieu');
        productIds.add(productId);
        lines.push({
          product_id: productId,
          qty_requested: qty,
          imei_list: raw.imei_list ? String(raw.imei_list).trim() : null,
          note: raw.note ? String(raw.note).trim() : null,
        });
      }
      const ph = lines.map(() => '?').join(',');
      const [prods] = await conn.query(
        `SELECT id FROM products WHERE id IN (${ph}) AND is_deleted = 0`,
        lines.map(l => l.product_id)
      );
      if (prods.length !== lines.length) throw httpErr(404, 'Co san pham khong ton tai');

      await conn.query(`DELETE FROM staff_stock_issue_items WHERE issue_id = ?`, [id]);
      for (const l of lines) {
        await conn.query(
          `INSERT INTO staff_stock_issue_items
             (issue_id, product_id, qty_requested, imei_list, note)
           VALUES (?, ?, ?, ?, ?)`,
          [id, l.product_id, l.qty_requested, l.imei_list, l.note]
        );
      }
    }

    await conn.commit();
    const detail = await loadIssueDetail(id);
    res.json(detail);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- DELETE /:id (cancel) -------------------------------------
// Chi cancel duoc khi draft.
router.delete('/:id', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    await conn.beginTransaction();
    const [hRows] = await conn.query(
      `SELECT status FROM staff_stock_issues WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!hRows.length) throw httpErr(404, 'Khong tim thay phieu cap');
    if (hRows[0].status !== 'draft') throw httpErr(400, 'Chi huy duoc phieu o trang thai draft');
    await conn.query(
      `UPDATE staff_stock_issues SET status = 'cancelled', is_deleted = 1 WHERE id = ?`, [id]
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

// ---- POST /:id/approve ----------------------------------------
// Body: { approvals: [{ item_id, qty_approved }], note? }
// Voi moi line: qty_approved <= qty_requested va <= ton kho hien tai.
// Sinh stock_receipt (kind='out', reason='staff_issue') + tru product_stock + cong staff_holdings.
// Neu tat ca qty_approved = 0 -> tu dong chuyen sang reject thay vi approve.
router.post('/:id/approve', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const approvals = Array.isArray(req.body.approvals) ? req.body.approvals : [];
    const approvalsMap = new Map();
    for (const a of approvals) {
      const itemId = Number(a.item_id);
      const qa = Number(a.qty_approved);
      if (!itemId) throw httpErr(400, 'Thieu item_id');
      if (!Number.isFinite(qa) || qa < 0) throw httpErr(400, 'qty_approved khong hop le');
      approvalsMap.set(itemId, qa);
    }

    await conn.beginTransaction();

    const [hRows] = await conn.query(
      `SELECT * FROM staff_stock_issues WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!hRows.length) throw httpErr(404, 'Khong tim thay phieu cap');
    const head = hRows[0];
    if (head.status !== 'draft') throw httpErr(400, 'Chi duyet duoc phieu draft');

    const [items] = await conn.query(
      `SELECT * FROM staff_stock_issue_items WHERE issue_id = ? ORDER BY id`, [id]
    );
    if (!items.length) throw httpErr(400, 'Phieu khong co dong nao');

    // Quyet dinh qty_approved cho moi dong: neu admin co truyen -> dung, khong thi default = qty_requested.
    const decided = items.map(it => {
      const qa = approvalsMap.has(it.id) ? approvalsMap.get(it.id) : it.qty_requested;
      if (qa > it.qty_requested) {
        throw httpErr(400, `Dong ${it.id}: qty_approved (${qa}) > qty_requested (${it.qty_requested})`);
      }
      return { ...it, qty_approved: qa };
    });

    const totalApproved = decided.reduce((s, x) => s + x.qty_approved, 0);

    // Update qty_approved cho moi dong (luu ca khi reject de co audit)
    for (const it of decided) {
      await conn.query(
        `UPDATE staff_stock_issue_items SET qty_approved = ? WHERE id = ?`,
        [it.qty_approved, it.id]
      );
    }

    if (totalApproved === 0) {
      // Khong duoc gi -> chuyen reject
      const reason = req.body.reason ? String(req.body.reason).trim() : 'Khong du ton kho';
      await conn.query(
        `UPDATE staff_stock_issues
            SET status = 'rejected',
                rejected_reason = ?,
                approved_by_staff_id = ?,
                approved_at = NOW()
          WHERE id = ?`,
        [reason, req.user?.sub || null, id]
      );
      await conn.commit();
      return res.json(await loadIssueDetail(id));
    }

    // Lock product_stock theo thu tu product_id va kiem tra du
    const positiveLines = decided.filter(l => l.qty_approved > 0);
    positiveLines.sort((a, b) => a.product_id - b.product_id);
    for (const l of positiveLines) {
      const [psRows] = await conn.query(
        `SELECT quantity FROM product_stock WHERE product_id = ? FOR UPDATE`,
        [l.product_id]
      );
      const cur = psRows.length ? psRows[0].quantity : 0;
      if (cur < l.qty_approved) {
        throw httpErr(409, `Khong du ton: SP id=${l.product_id} con ${cur}, can ${l.qty_approved}`);
      }
    }

    // Sinh stock_receipt (kind='out', reason='staff_issue')
    const adminId = req.user && req.user.sub ? req.user.sub : null;
    const receiptCode = await genReceiptCode(conn, 'out');
    const [rIns] = await conn.query(
      `INSERT INTO stock_receipts
         (code, kind, reason_code, reason_text, ref_staff_id, created_by_staff_id)
       VALUES (?, 'out', 'staff_issue', ?, ?, ?)`,
      [receiptCode, `Cap SP cho KTV qua phieu ${head.code}`, head.staff_id, adminId]
    );
    const receiptId = rIns.insertId;

    for (const l of positiveLines) {
      await conn.query(
        `INSERT INTO stock_receipt_items
           (receipt_id, product_id, qty, imei_list, note)
         VALUES (?, ?, ?, ?, ?)`,
        [receiptId, l.product_id, l.qty_approved, l.imei_list, l.note]
      );
      await conn.query(
        `UPDATE product_stock SET quantity = quantity - ? WHERE product_id = ?`,
        [l.qty_approved, l.product_id]
      );
      // Cong staff_holdings (UNIQUE staff_id+product_id)
      await conn.query(
        `INSERT INTO staff_holdings (staff_id, product_id, qty)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)`,
        [head.staff_id, l.product_id, l.qty_approved]
      );
    }

    await conn.query(
      `UPDATE staff_stock_issues
          SET status = 'approved',
              approved_by_staff_id = ?,
              approved_at = NOW(),
              ref_receipt_id = ?
        WHERE id = ?`,
      [adminId, receiptId, id]
    );

    await conn.commit();
    res.json(await loadIssueDetail(id));
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- POST /:id/reject -----------------------------------------
// Body: { reason }
router.post('/:id/reject', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const reason = req.body.reason ? String(req.body.reason).trim() : '';
    if (!reason) throw httpErr(400, 'Phai cung cap ly do');
    await conn.beginTransaction();
    const [hRows] = await conn.query(
      `SELECT status FROM staff_stock_issues WHERE id = ? AND is_deleted = 0 FOR UPDATE`, [id]
    );
    if (!hRows.length) throw httpErr(404, 'Khong tim thay phieu cap');
    if (hRows[0].status !== 'draft') throw httpErr(400, 'Chi tu choi duoc phieu draft');
    await conn.query(
      `UPDATE staff_stock_issues
          SET status = 'rejected',
              rejected_reason = ?,
              approved_by_staff_id = ?,
              approved_at = NOW()
        WHERE id = ?`,
      [reason, req.user?.sub || null, id]
    );
    await conn.commit();
    res.json(await loadIssueDetail(id));
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
