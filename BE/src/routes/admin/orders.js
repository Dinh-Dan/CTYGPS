// /api/admin/orders — CRUD don hang v3 (multi-line, mig 052).
// 1 don = N "dong cong viec" (order_lines). Moi line co template (loai cong viec)
// + items + charges + field_values rieng. Status + KTV + thanh toan o cap don.
//
// Endpoints chinh:
//   GET    /                        list (filter)
//   GET    /:id                     detail
//   POST   /                        tao moi
//   PUT    /:id                     sua metadata
//   DELETE /:id                     soft delete
//   PUT    /:id/lines               replace lines
//   PATCH  /:id/order-charges       replace charges cap don
//   POST   /:id/approve             pending -> confirmed
//   POST   /:id/transition          chuyen status (4 trang thai cung)
//   PATCH  /:id/progress-note       cap nhat ghi chu thuc te
//   POST   /:id/assign-staff        gan KTV (check holdings du)
//   PATCH  /:id/reassign-staff      gan lai KTV
//   POST   /:id/cancel              cancelled
//   POST   /:id/mark-paid           ghi nhan thu tien
//   POST   /:id/photos              upload anh tu do (khong gan step)
//   DELETE /:id/photos/:photoId
//   GET    /:id/admin-pending
//   POST   /:id/confirm-admin-pending/:paymentId
//   GET    /:id/staff-collections
//   POST   /:id/confirm-staff-collection/:collectionId

const express = require('express');
const db = require('../../db');
const {
  loadWorkflowSteps, validateTransition,
  recalcOrderTotal, recalcPaymentStatus, syncLaborCharge, insertOrderWithRetry,
} = require('../../utils/orderState');

const router = express.Router();

const PAYMENT_METHODS = ['cash', 'transfer', 'debt'];
const CHARGE_KINDS = ['shipping', 'discount', 'fee'];

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// Sinh code phieu PX/PN-YYMMDD-NNN
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

// Replace charges CAP DON (line_id = NULL). Khong dung cho charges cap line.
async function replaceOrderCharges(conn, orderId, charges) {
  await conn.query(
    `DELETE FROM order_charges WHERE order_id = ? AND line_id IS NULL`, [orderId]
  );
  if (!Array.isArray(charges) || !charges.length) return;
  for (const c of charges) {
    const kind = CHARGE_KINDS.includes(c.kind) ? c.kind : 'fee';
    const label = String(c.label || '').trim();
    const amount = Number(c.amount) || 0;
    if (!label) continue;
    await conn.query(
      `INSERT INTO order_charges (order_id, line_id, kind, label, amount)
       VALUES (?, NULL, ?, ?, ?)`,
      [orderId, kind, label, amount]
    );
  }
}

// Replace TOAN BO lines cua 1 don.
// lines: [{
//   template_id?,                 // null = line ten tu do
//   custom_name?,                 // ten tu nhap (override hien thi); bat buoc neu khong co template_id
//   note?,
//   items?: [{product_id, qty, unit_price, vat_percent?}],
//   charges?: [{kind, label, amount}],
//   field_values?: [{template_field_id?, label, value}]
// }]
async function replaceLines(conn, orderId, lines) {
  // Xoa hoan toan lines cu (CASCADE keo theo items + charges line + field_values)
  await conn.query(`DELETE FROM order_lines WHERE order_id = ?`, [orderId]);
  if (!Array.isArray(lines) || !lines.length) return;

  let lineSeq = 0;
  for (const ln of lines) {
    const tplId = Number(ln.template_id) || null;
    const customName = ln.custom_name ? String(ln.custom_name).trim().slice(0, 120) : null;
    if (!tplId && !customName) throw httpErr(400, 'Line thieu template_id hoac custom_name');
    lineSeq++;

    const [r] = await conn.query(
      `INSERT INTO order_lines (order_id, template_id, custom_name, seq, note)
       VALUES (?, ?, ?, ?, ?)`,
      [orderId, tplId, customName, lineSeq, ln.note ? String(ln.note) : null]
    );
    const lineId = r.insertId;

    // Items
    if (Array.isArray(ln.items)) {
      for (const it of ln.items) {
        const pid = Number(it.product_id);
        if (!pid) continue;
        const qty = Math.max(1, Number(it.qty) || 1);
        const price = Number(it.unit_price) || 0;
        const vat = Math.max(0, Math.min(100, Number(it.vat_percent) || 0));
        await conn.query(
          `INSERT INTO order_items (order_id, line_id, product_id, qty, unit_price, vat_percent)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, lineId, pid, qty, price, vat]
        );
      }
    }

    // Charges cap line
    if (Array.isArray(ln.charges)) {
      for (const c of ln.charges) {
        const kind = CHARGE_KINDS.includes(c.kind) ? c.kind : 'fee';
        const label = String(c.label || '').trim();
        const amount = Number(c.amount) || 0;
        if (!label) continue;
        await conn.query(
          `INSERT INTO order_charges (order_id, line_id, kind, label, amount)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, lineId, kind, label, amount]
        );
      }
    }

    // Field values
    if (Array.isArray(ln.field_values)) {
      let seq = 0;
      for (const fv of ln.field_values) {
        const label = String(fv.label || '').trim();
        if (!label) continue;
        const value = fv.value == null ? null : String(fv.value);
        const tfId = fv.template_field_id ? Number(fv.template_field_id) : null;
        seq++;
        await conn.query(
          `INSERT INTO order_field_values (order_id, line_id, template_field_id, label, value, seq)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, lineId, tfId, label, value, seq]
        );
      }
    }

    // Recompute subtotal cho line (qty*price + VAT + charges)
    const [itemSum] = await conn.query(
      `SELECT COALESCE(SUM(qty * unit_price * (1 + vat_percent/100)), 0) AS s
         FROM order_items WHERE line_id = ?`, [lineId]
    );
    const [chgSum] = await conn.query(
      `SELECT COALESCE(SUM(amount), 0) AS s
         FROM order_charges WHERE line_id = ? AND is_deleted = 0`, [lineId]
    );
    const sub = Math.round(Number(itemSum[0].s) + Number(chgSum[0].s));
    await conn.query(`UPDATE order_lines SET subtotal = ? WHERE id = ?`, [sub, lineId]);
  }
}

async function loadOrderDetail(conn, id) {
  const [rows] = await conn.query(
    `SELECT o.*, c.full_name AS customer_name, c.phone AS customer_phone,
            s.full_name AS staff_name
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       LEFT JOIN staff     s ON s.id = o.assigned_staff_id
      WHERE o.id = ? AND o.is_deleted = 0`,
    [id]
  );
  if (!rows.length) return null;
  const o = rows[0];

  // Lines + lich su lai theo line
  const [lines] = await conn.query(
    `SELECT ol.id, ol.template_id, ol.custom_name, ol.seq, ol.subtotal, ol.note,
            COALESCE(ol.custom_name, t.name) AS template_name
       FROM order_lines ol
       LEFT JOIN order_templates t ON t.id = ol.template_id
      WHERE ol.order_id = ? AND ol.is_deleted = 0
      ORDER BY ol.seq, ol.id`, [id]
  );
  const [items] = await conn.query(
    `SELECT oi.id, oi.line_id, oi.product_id, oi.qty, oi.unit_price, oi.vat_percent,
            p.name AS product_name, p.code AS product_code,
            p.image_url AS product_image, p.thumbnail_url AS product_thumb,
            p.description AS product_description, p.warranty_months AS product_warranty_months
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?`, [id]
  );
  const [charges] = await conn.query(
    `SELECT id, line_id, kind, label, amount
       FROM order_charges WHERE order_id = ? AND is_deleted = 0
      ORDER BY id`, [id]
  );
  const [fieldValues] = await conn.query(
    `SELECT id, line_id, template_field_id, label, value, seq
       FROM order_field_values WHERE order_id = ? AND is_deleted = 0
      ORDER BY seq, id`, [id]
  );

  // Group items/charges/fields theo line
  const lineMap = new Map(lines.map(l => [l.id, { ...l, items: [], charges: [], field_values: [] }]));
  for (const it of items) if (lineMap.has(it.line_id)) lineMap.get(it.line_id).items.push(it);
  for (const fv of fieldValues) if (lineMap.has(fv.line_id)) lineMap.get(fv.line_id).field_values.push(fv);
  // line_id NULL = phi cap don. Loc "Công lắp" — luu de tinh cong KTV, khong hien thi.
  const orderCharges = [];
  for (const c of charges) {
    if (c.label === 'Công lắp') continue;
    if (c.line_id == null) orderCharges.push(c);
    else if (lineMap.has(c.line_id)) lineMap.get(c.line_id).charges.push(c);
  }
  const linesOut = Array.from(lineMap.values());

  const [photos] = await conn.query(
    `SELECT id, step_code, url, caption, uploaded_by, uploaded_at
       FROM order_step_photos WHERE order_id = ? AND is_deleted = 0
      ORDER BY uploaded_at, id`, [id]
  );
  const steps = await loadWorkflowSteps(conn);

  return {
    ...o,
    lines: linesOut,
    order_charges: orderCharges,    // phi cap don (line_id NULL)
    step_photos: photos,
    workflow_steps: steps,
  };
}

// ============================================================
// LIST
// ============================================================
router.get('/', async (req, res, next) => {
  try {
    const where = ['o.is_deleted = 0'];
    const args = [];

    const status = req.query.status ? String(req.query.status) : '';
    if (status) { where.push('o.status = ?'); args.push(status); }

    const paymentStatus = req.query.payment_status ? String(req.query.payment_status) : '';
    if (paymentStatus) { where.push('o.payment_status = ?'); args.push(paymentStatus); }

    const templateId = Number(req.query.template_id);
    // Loc theo template: don nao co it nhat 1 line dung template nay
    if (templateId) {
      where.push('EXISTS (SELECT 1 FROM order_lines ol WHERE ol.order_id = o.id AND ol.template_id = ? AND ol.is_deleted = 0)');
      args.push(templateId);
    }

    const customerId = Number(req.query.customer_id);
    if (customerId) { where.push('o.customer_id = ?'); args.push(customerId); }

    const staffId = Number(req.query.staff_id);
    if (staffId) { where.push('o.assigned_staff_id = ?'); args.push(staffId); }

    // Loc don thu ho dai li (1 = chi don da tick, 0 = chi don chua tick)
    if (req.query.collected_for_dealer === '1') where.push('o.collected_for_dealer = 1');
    else if (req.query.collected_for_dealer === '0') where.push('o.collected_for_dealer = 0');

    const q = req.query.q ? String(req.query.q).trim() : '';
    if (q) {
      where.push(`(o.code LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?)`);
      args.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const customerQ = req.query.customer_q ? String(req.query.customer_q).trim() : '';
    if (customerQ) {
      where.push(`(c.full_name LIKE ? OR c.phone LIKE ?)`);
      args.push(`%${customerQ}%`, `%${customerQ}%`);
    }

    const dateFrom = req.query.date_from ? String(req.query.date_from) : '';
    if (dateFrom) { where.push('o.created_at >= ?'); args.push(dateFrom); }

    const dateTo = req.query.date_to ? String(req.query.date_to) : '';
    if (dateTo) { where.push('o.created_at < DATE_ADD(?, INTERVAL 1 DAY)'); args.push(dateTo); }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      `SELECT o.id, o.code, o.status, o.payment_status, o.customer_id,
              o.assigned_staff_id, o.address, o.note,
              o.subtotal, o.total_amount, o.paid_amount, o.wage_amount,
              o.due_at, o.completed_at, o.created_at,
              c.full_name AS customer_name, c.phone AS customer_phone,
              s.full_name AS staff_name,
              (SELECT GROUP_CONCAT(COALESCE(ol.custom_name, t.name) ORDER BY ol.seq SEPARATOR ' + ')
                 FROM order_lines ol
                 LEFT JOIN order_templates t ON t.id = ol.template_id
                WHERE ol.order_id = o.id AND ol.is_deleted = 0) AS template_names
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         LEFT JOIN staff     s ON s.id = o.assigned_staff_id
        WHERE ${where.join(' AND ')}
        ORDER BY o.id DESC
        LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    const [cnt] = await db.query(
      `SELECT COUNT(*) AS total
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
        WHERE ${where.join(' AND ')}`,
      args
    );

    res.json({ items: rows, total: cnt[0].total, page, limit });
  } catch (err) { next(err); }
});

// ============================================================
// DETAIL
// ============================================================
router.get('/:id', async (req, res, next) => {
  try {
    const detail = await loadOrderDetail(db, Number(req.params.id));
    if (!detail) return res.status(404).json({ error: 'Khong tim thay don' });
    res.json(detail);
  } catch (err) { next(err); }
});

// ============================================================
// CREATE
// ============================================================
// Body: {
//   customer_id,
//   lines: [{ template_id, items?, charges?, field_values?, note? }, ...],
//   order_charges?: [{kind, label, amount}],   // phi cap don (ship/discount tong)
//   address?, note?, due_at?, wage_amount?, payment_method?,
//   assigned_staff_id?,
//   approve?: boolean   // true = bo qua pending, vao thang first step
// }
router.post('/', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const customerId = Number(req.body.customer_id);
    if (!customerId) throw httpErr(400, 'Thieu customer_id');

    const lines = Array.isArray(req.body.lines) ? req.body.lines : [];
    if (!lines.length) throw httpErr(400, 'Don phai co it nhat 1 dong cong viec');

    // Validate moi line: phai co template_id HOAC custom_name
    for (const ln of lines) {
      const hasTpl = Number(ln.template_id) > 0;
      const hasName = ln.custom_name && String(ln.custom_name).trim();
      if (!hasTpl && !hasName) {
        throw httpErr(400, 'Moi dong cong viec phai co loai hoac ten');
      }
    }
    const tplIds = [...new Set(lines.map(l => Number(l.template_id)).filter(Boolean))];
    if (tplIds.length) {
      const [tRows] = await conn.query(
        `SELECT id FROM order_templates WHERE id IN (?) AND is_deleted = 0`, [tplIds]
      );
      if (tRows.length !== tplIds.length) throw httpErr(400, 'Co template_id khong hop le');
    }

    const approve = req.body.approve === true || req.body.approve === 'true' || req.body.approve === 1;
    const status = approve ? 'confirmed' : 'pending';

    const paymentMethod = PAYMENT_METHODS.includes(req.body.payment_method) ? req.body.payment_method : 'cash';
    const wage = req.body.wage_amount === undefined
      ? null
      : Math.max(0, Number(req.body.wage_amount) || 0);
    const adminId = req.user && req.user.sub ? req.user.sub : null;

    let assignedStaffId = null;
    if (req.body.assigned_staff_id) {
      assignedStaffId = Number(req.body.assigned_staff_id);
      const [sRows] = await conn.query(
        `SELECT id FROM staff WHERE id = ? AND is_deleted = 0 AND role = 'kithuat'`,
        [assignedStaffId]
      );
      if (!sRows.length) throw httpErr(400, 'KTV khong hop le');
    }

    await conn.beginTransaction();

    const { code, result } = await insertOrderWithRetry(conn, async (code) => {
      return conn.query(
        `INSERT INTO orders
           (code, customer_id, status, payment_status,
            payment_method, address, note, due_at, wage_amount,
            assigned_staff_id, creator_type, creator_id)
         VALUES (?, ?, ?, 'unpaid',
                 ?, ?, ?, ?, ?,
                 ?, 'admin', ?)`,
        [code, customerId, status, paymentMethod,
         req.body.address || null, req.body.note || null,
         req.body.due_at || null, wage, assignedStaffId, adminId]
      );
    });
    const orderId = result[0].insertId;

    await replaceLines(conn, orderId, lines);
    if (Array.isArray(req.body.order_charges)) {
      await replaceOrderCharges(conn, orderId, req.body.order_charges);
    }

    if (wage > 0) await syncLaborCharge(conn, orderId, wage);

    await recalcOrderTotal(conn, orderId);
    await recalcPaymentStatus(conn, orderId);

    await conn.commit();

    res.status(201).json({ id: orderId, code });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ============================================================
// UPDATE METADATA
// ============================================================
router.put('/:id', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const [rows] = await conn.query(
      `SELECT id, status, wage_amount FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don');

    const sets = [], args = [];
    const b = req.body;
    if (b.note !== undefined)      { sets.push('note = ?');      args.push(b.note ? String(b.note) : null); }
    if (b.address !== undefined)   { sets.push('address = ?');   args.push(b.address ? String(b.address) : null); }
    if (b.due_at !== undefined)    { sets.push('due_at = ?');    args.push(b.due_at || null); }
    if (b.payment_method !== undefined && PAYMENT_METHODS.includes(b.payment_method)) {
      sets.push('payment_method = ?'); args.push(b.payment_method);
    }
    let wageChanged = false;
    let newWage = rows[0].wage_amount;
    if (b.wage_amount !== undefined) {
      newWage = Math.max(0, Number(b.wage_amount) || 0);
      sets.push('wage_amount = ?'); args.push(newWage);
      wageChanged = true;
    }

    if (!sets.length) return res.json({ ok: true });

    await conn.beginTransaction();
    args.push(id);
    await conn.query(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, args);
    if (wageChanged) {
      await syncLaborCharge(conn, id, newWage);
      await recalcOrderTotal(conn, id);
      await recalcPaymentStatus(conn, id);
    }
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ============================================================
// REPLACE LINES (toan bo) — chan sau khi da xuat kho
// ============================================================
// Body: { lines: [{template_id, items, charges, field_values, note}] }
router.put('/:id/lines', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const lines = Array.isArray(req.body.lines) ? req.body.lines : [];
    if (!lines.length) throw httpErr(400, 'Don phai co it nhat 1 dong cong viec');

    const [oRows] = await conn.query(
      `SELECT wage_amount, status FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!oRows.length) throw httpErr(404, 'Khong tim thay don');
    if (oRows[0].status === 'done' || oRows[0].status === 'cancelled') {
      throw httpErr(409, 'Don da hoan thanh / huy — khong sua duoc');
    }

    await conn.beginTransaction();
    await replaceLines(conn, id, lines);
    if (oRows[0].wage_amount > 0) await syncLaborCharge(conn, id, oRows[0].wage_amount);
    await recalcOrderTotal(conn, id);
    await recalcPaymentStatus(conn, id);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ============================================================
// REPLACE CHARGES CAP DON (line_id NULL) — phi ship/discount tong
// ============================================================
// Body: { charges: [{kind, label, amount}] }
router.patch('/:id/order-charges', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const [oRows] = await conn.query(
      `SELECT wage_amount, status FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!oRows.length) throw httpErr(404, 'Khong tim thay don');
    if (oRows[0].status === 'done' || oRows[0].status === 'cancelled') {
      throw httpErr(409, 'Don da hoan thanh / huy — khong sua duoc');
    }

    await conn.beginTransaction();
    const charges = Array.isArray(req.body.charges) ? req.body.charges : [];
    // Filter "Cong lap" — duoc sync rieng tu wage_amount
    const cleaned = charges.filter(c => String(c.label || '').trim() !== 'Công lắp');
    await replaceOrderCharges(conn, id, cleaned);
    if (oRows[0].wage_amount > 0) await syncLaborCharge(conn, id, oRows[0].wage_amount);
    await recalcOrderTotal(conn, id);
    await recalcPaymentStatus(conn, id);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ============================================================
// APPROVE (pending -> first step)
// ============================================================
// ============================================================
// APPROVE: pending -> confirmed
// ============================================================
router.post('/:id/approve', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const [rows] = await conn.query(
      `SELECT id, status FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don');
    if (rows[0].status !== 'pending') throw httpErr(409, 'Don khong o trang thai pending');

    await conn.query(`UPDATE orders SET status = 'confirmed' WHERE id = ?`, [id]);
    res.json({ ok: true, status: 'confirmed' });
  } catch (err) { next(err); } finally { conn.release(); }
});

// ============================================================
// TRANSITION: chuyen sang 1 trang thai (4 buoc cung)
// ============================================================
// Body: { step_code }
// Khong yeu cau anh — anh upload tu do qua /photos.
router.post('/:id/transition', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const target = String(req.body.step_code || '').trim();
    if (!target) throw httpErr(400, 'Thieu step_code');

    const [rows] = await conn.query(
      `SELECT id, status FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don');

    const steps = await loadWorkflowSteps(conn);
    const v = validateTransition(steps, rows[0].status, target, 'admin');
    if (!v.ok) throw httpErr(400, v.error);

    await conn.beginTransaction();
    const sets = ['status = ?'];
    const args = [target];
    if (target === 'done') sets.push('completed_at = COALESCE(completed_at, NOW())');
    args.push(id);
    await conn.query(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, args);
    await conn.commit();
    res.json({ ok: true, status: target });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ============================================================
// PROGRESS NOTE: cap nhat ghi chu thuc te (admin/ktv deu update duoc)
// ============================================================
// Body: { progress_note }
router.patch('/:id/progress-note', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const note = req.body.progress_note != null ? String(req.body.progress_note) : null;
    const [r] = await db.query(
      `UPDATE orders SET progress_note = ? WHERE id = ? AND is_deleted = 0`, [note, id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay don' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ============================================================
// ASSIGN STAFF — check staff_holdings du san pham trong don
// ============================================================
// Neu don dang pending -> auto chuyen confirmed luc gan.
// wage = null nghia la KHONG gui field -> giu nguyen wage_amount cu (B-010).
async function _assignStaff(conn, orderId, staffId, wage) {
  const [staffRow] = await conn.query(
    `SELECT id, role FROM staff WHERE id = ? AND is_deleted = 0`, [staffId]
  );
  if (!staffRow.length) throw httpErr(400, 'KTV khong hop le');
  if (staffRow[0].role !== 'kithuat') throw httpErr(400, 'Chi co the gan nhan vien co role kithuat');

  const [orderRow] = await conn.query(
    `SELECT id, status, wage_amount FROM orders WHERE id = ? AND is_deleted = 0`, [orderId]
  );
  if (!orderRow.length) throw httpErr(404, 'Khong tim thay don');

  // Tong san pham yeu cau theo product_id
  const [needs] = await conn.query(
    `SELECT product_id, SUM(qty) AS need
       FROM order_items WHERE order_id = ? GROUP BY product_id`, [orderId]
  );
  if (needs.length) {
    const productIds = needs.map(n => n.product_id);
    const [holds] = await conn.query(
      `SELECT product_id, qty FROM staff_holdings
        WHERE staff_id = ? AND product_id IN (?)`,
      [staffId, productIds]
    );
    const heldMap = new Map(holds.map(h => [h.product_id, Number(h.qty)]));
    const lacks = [];
    for (const n of needs) {
      const have = heldMap.get(n.product_id) || 0;
      if (have < Number(n.need)) {
        lacks.push({ product_id: n.product_id, need: Number(n.need), have });
      }
    }
    if (lacks.length) {
      const [pRows] = await conn.query(
        `SELECT id, name FROM products WHERE id IN (?)`,
        [lacks.map(l => l.product_id)]
      );
      const nameMap = new Map(pRows.map(p => [p.id, p.name]));
      const msg = lacks
        .map(l => `${nameMap.get(l.product_id) || ('SP#' + l.product_id)} (can ${l.need}, KTV co ${l.have})`)
        .join('; ');
      throw httpErr(409, `KTV khong du hang trong kho ca nhan: ${msg}`);
    }
  }

  // OK -> set assigned + wage (chi update wage neu duoc gui — B-010)
  const finalWage = wage === null ? Number(orderRow[0].wage_amount || 0) : wage;
  const sets = ['assigned_staff_id = ?'];
  const args = [staffId];
  if (wage !== null) { sets.push('wage_amount = ?'); args.push(wage); }
  // Pending -> confirmed (gan KTV = duyet luon)
  if (orderRow[0].status === 'pending') {
    sets.push("status = 'confirmed'");
  }
  args.push(orderId);
  await conn.query(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, args);
  await syncLaborCharge(conn, orderId, finalWage);
  await recalcOrderTotal(conn, orderId);
  await recalcPaymentStatus(conn, orderId);
}

// GET /:id/suggested-staff — danh sach KTV de gan vao don
router.get('/:id/suggested-staff', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.full_name, s.area, s.online_status,
              COALESCE(t.active_count, 0) AS active_count
         FROM staff s
         LEFT JOIN (
           SELECT assigned_staff_id, COUNT(*) AS active_count
             FROM orders
            WHERE assigned_staff_id IS NOT NULL
              AND status IN ('confirmed','in_progress')
              AND is_deleted = 0
            GROUP BY assigned_staff_id
         ) t ON t.assigned_staff_id = s.id
        WHERE s.is_deleted = 0 AND s.role = 'kithuat'
        ORDER BY active_count ASC, s.full_name ASC`
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

router.post('/:id/assign-staff', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const staffId = Number(req.body.staff_id);
    if (!staffId) throw httpErr(400, 'Thieu staff_id');
    const wage = req.body.wage_amount === undefined
      ? null
      : Math.max(0, Number(req.body.wage_amount) || 0);

    await conn.beginTransaction();
    await _assignStaff(conn, id, staffId, wage);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

router.patch('/:id/reassign-staff', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const staffId = Number(req.body.staff_id);
    if (!staffId) throw httpErr(400, 'Thieu staff_id');
    const wage = req.body.wage_amount === undefined
      ? null
      : Math.max(0, Number(req.body.wage_amount) || 0);
    await conn.beginTransaction();
    await _assignStaff(conn, id, staffId, wage);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ============================================================
// CANCEL
// ============================================================
router.post('/:id/cancel', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) throw httpErr(400, 'id khong hop le');
    const [rows] = await conn.query(
      `SELECT id, status FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don');
    if (rows[0].status === 'cancelled') return res.json({ ok: true });
    // BX-02: chi cancel duoc khi don con o pending/confirmed; in_progress/done
    // phai dung luong refund + return-stock chinh thuc.
    if (!['pending', 'confirmed'].includes(rows[0].status)) {
      throw httpErr(409, 'Don da bat dau thi cong, vui long dung luong hoan tien + tra hang');
    }

    await conn.beginTransaction();
    await conn.query(`UPDATE orders SET status = 'cancelled' WHERE id = ?`, [id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ============================================================
// SOFT DELETE
// ============================================================
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'id khong hop le' });

    // BX-03: cam xoa don da co payment confirmed (paid_amount > 0)
    // tru khi force=1 (admin xac nhan da hoan tien thu cong).
    const [ords] = await db.query(
      `SELECT id, paid_amount FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!ords.length) return res.status(404).json({ error: 'Khong tim thay don' });
    if (Number(ords[0].paid_amount) > 0 && req.query.force !== '1') {
      return res.status(409).json({
        error: 'Don da co thu tien, vui long hoan tien truoc khi xoa (hoac them ?force=1 neu da xu ly thu cong)',
      });
    }

    const [r] = await db.query(
      `UPDATE orders SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay don' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ============================================================
// PAYMENTS
// ============================================================
// Body: { amount?, method?, note? }
// amount mac dinh = total - paid (clamp >= 0). Tao 1 row order_payments source='admin_direct'.
router.post('/:id/mark-paid', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const [rows] = await conn.query(
      `SELECT id, total_amount, paid_amount FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay don');

    const remain = Math.max(0, Number(rows[0].total_amount) - Number(rows[0].paid_amount));
    let amount = req.body.amount === undefined ? remain : Math.max(0, Number(req.body.amount) || 0);
    if (amount > remain) amount = remain;
    if (amount <= 0) return res.json({ ok: true, paid: rows[0].paid_amount });

    const method = PAYMENT_METHODS.includes(req.body.method) ? req.body.method : 'cash';
    const adminId = req.user && req.user.sub ? req.user.sub : null;

    // Anh chung tu (mang URL imgbb)
    let proofUrls = null;
    if (Array.isArray(req.body.proof_urls)) {
      const cleaned = req.body.proof_urls
        .map(u => String(u || '').trim())
        .filter(u => /^https?:\/\//i.test(u));
      if (cleaned.length) proofUrls = JSON.stringify(cleaned);
    }

    // Co thu ho dai li (tick 1 lan, khong un-tick qua endpoint nay)
    const collectForDealer = req.body.collected_for_dealer ? 1 : 0;

    await conn.beginTransaction();
    const noteText = req.body.note ? String(req.body.note) : null;
    const methodTag = method ? `[method=${method}]` : '';
    const fullNote = [methodTag, noteText].filter(Boolean).join(' ').trim() || null;
    await conn.query(
      `INSERT INTO order_payments
         (order_id, amount, source, confirmed, confirmed_at, confirmed_by, note, proof_urls, paid_at)
       VALUES (?, ?, 'admin_mark_paid', 1, NOW(), ?, ?, ?, NOW())`,
      [id, amount, adminId, fullNote, proofUrls]
    );
    await conn.query(
      `UPDATE orders SET paid_amount = paid_amount + ? WHERE id = ?`, [amount, id]
    );
    if (collectForDealer) {
      await conn.query(
        `UPDATE orders SET collected_for_dealer = 1 WHERE id = ?`, [id]
      );
    }
    await recalcPaymentStatus(conn, id);
    await conn.commit();
    res.json({ ok: true, paid_added: amount });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

router.get('/:id/admin-pending', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, amount, method, note, confirmed, confirmed_at, created_at
         FROM order_payments
        WHERE order_id = ? AND source = 'admin_pending' AND is_deleted = 0
        ORDER BY id DESC`, [Number(req.params.id)]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

router.post('/:id/confirm-admin-pending/:paymentId', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const pid = Number(req.params.paymentId);
    const [rows] = await conn.query(
      `SELECT id, amount, confirmed FROM order_payments
        WHERE id = ? AND order_id = ? AND source = 'admin_pending' AND is_deleted = 0`,
      [pid, id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay payment');
    if (rows[0].confirmed) return res.json({ ok: true });

    const adminId = req.user && req.user.sub ? req.user.sub : null;
    await conn.beginTransaction();
    await conn.query(
      `UPDATE order_payments SET confirmed = 1, confirmed_at = NOW(), confirmed_by = ?
        WHERE id = ?`, [adminId, pid]
    );
    await conn.query(
      `UPDATE orders SET paid_amount = paid_amount + ? WHERE id = ?`, [rows[0].amount, id]
    );
    await recalcPaymentStatus(conn, id);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

router.get('/:id/staff-collections', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.amount, c.method, c.note, c.remitted, c.remitted_at, c.created_at,
              s.full_name AS staff_name
         FROM collections c
         LEFT JOIN staff s ON s.id = c.staff_id
        WHERE c.order_id = ? AND c.is_deleted = 0
        ORDER BY c.id DESC`, [Number(req.params.id)]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

router.post('/:id/confirm-staff-collection/:collectionId', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const cid = Number(req.params.collectionId);
    const [rows] = await conn.query(
      `SELECT id, amount, remitted FROM collections
        WHERE id = ? AND order_id = ? AND is_deleted = 0`, [cid, id]
    );
    if (!rows.length) throw httpErr(404, 'Khong tim thay collection');
    if (rows[0].remitted) return res.json({ ok: true });

    const adminId = req.user && req.user.sub ? req.user.sub : null;
    await conn.beginTransaction();
    await conn.query(
      `UPDATE collections SET remitted = 1, remitted_at = NOW(), remitted_to_admin_id = ?
        WHERE id = ?`, [adminId, cid]
    );
    await conn.query(
      `UPDATE orders SET paid_amount = paid_amount + ? WHERE id = ?`, [rows[0].amount, id]
    );
    await recalcPaymentStatus(conn, id);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ============================================================
// PHOTOS — anh tu do gan vao don (khong gan step)
// ============================================================
// Body: { url, caption? }
router.post('/:id/photos', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const url = String(req.body.url || '').trim();
    if (!url) return res.status(400).json({ error: 'Thieu url' });
    const adminId = req.user && req.user.sub ? req.user.sub : null;
    const [r] = await db.query(
      `INSERT INTO order_step_photos (order_id, step_code, url, caption, uploaded_by)
       VALUES (?, '', ?, ?, ?)`,
      [id, url, req.body.caption ? String(req.body.caption) : null, adminId]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) { next(err); }
});

router.delete('/:id/photos/:photoId', async (req, res, next) => {
  try {
    const [r] = await db.query(
      `UPDATE order_step_photos SET is_deleted = 1
        WHERE id = ? AND order_id = ? AND is_deleted = 0`,
      [Number(req.params.photoId), Number(req.params.id)]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay anh' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});


module.exports = router;
