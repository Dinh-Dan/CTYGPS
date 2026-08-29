// /api/admin/orders — CRUD don hang v3 (multi-line, mig 052).
// 1 don = N "dong cong viec" (order_lines). Moi line co template (loai cong viec)
// + items + charges + field_values rieng. Status + KTV + thanh toan o cap don.
//
// Endpoints chinh:
//   GET    /                        list (filter)
//   GET    /:id                     detail
//   POST   /                        tao moi
//   PUT    /:id                     sua metadata
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
const {
  WARRANTY_SERVICE_KIND,
  SERVICE_KINDS,
  ensureWarrantySchema,
  normalizeServiceKind,
  upsertWarrantyMeta,
  replaceWarrantyItems,
  loadWarrantyDetail,
  createWarrantyMove,
  syncWarrantyOrderState,
} = require('../../utils/orderWarranty');

const { requireRole } = require('../../middleware/auth');

const router = express.Router();
const adminOnly = requireRole('admin');

const PAYMENT_METHODS = ['cash', 'transfer', 'debt'];
const CHARGE_KINDS = ['shipping', 'discount', 'fee'];

function parseServiceKindFilter(raw) {
  const value = raw ? String(raw).trim() : '';
  return SERVICE_KINDS.includes(value) ? value : '';
}

function normalizeLooseText(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function looksLikeWarrantyText(input) {
  const value = normalizeLooseText(input);
  return value === 'bao hanh' || value.includes('bao hanh');
}

function httpErr(status, message, opts) {
  const e = new Error(message);
  e.status = status;
  if (opts && opts.code) e.code = opts.code;
  if (opts && opts.details) e.details = opts.details;
  return e;
}

const fmtVnd = n => new Intl.NumberFormat('vi-VN').format(Number(n) || 0);

async function appendOrderNote(dbOrConn, orderId, note, req) {
  const actor = req?.user?.username || 'hệ thống';
  const d = new Date();
  const ts = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  const line = `[${ts} - ${actor}] ${note}`;
  try {
    await dbOrConn.query(
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

// Tra ve danh sach SP thieu giua nhu cau cua don va kho ca nhan KTV.
// Tra ve [] neu du; tra ve [{product_id, product_name, need, have}] neu thieu.
async function getStaffHoldingsLack(conn, orderId, staffId) {
  const [needs] = await conn.query(
    `SELECT product_id, SUM(qty) AS need
       FROM order_items WHERE order_id = ? GROUP BY product_id`, [orderId]
  );
  if (!needs.length) return [];
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
    if (have < Number(n.need)) lacks.push({ product_id: n.product_id, need: Number(n.need), have });
  }
  if (!lacks.length) return [];
  const [pRows] = await conn.query(
    `SELECT id, name FROM products WHERE id IN (?)`,
    [lacks.map(l => l.product_id)]
  );
  const nameMap = new Map(pRows.map(p => [p.id, p.name]));
  return lacks.map(l => ({ ...l, product_name: nameMap.get(l.product_id) || ('SP#' + l.product_id) }));
}

async function loadOrderProductNeeds(conn, orderId) {
  const [needs] = await conn.query(
    `SELECT product_id, SUM(qty) AS need
       FROM order_items
      WHERE order_id = ?
      GROUP BY product_id`,
    [orderId]
  );
  return needs.map((row) => ({
    product_id: Number(row.product_id),
    need: Number(row.need) || 0,
  })).filter((row) => row.product_id && row.need > 0);
}

async function getCompanyStockLack(conn, needs, { forUpdate = false } = {}) {
  if (!Array.isArray(needs) || !needs.length) return [];
  const productIds = [...new Set(needs.map((n) => Number(n.product_id)).filter(Boolean))].sort((a, b) => a - b);
  const stockMap = new Map();
  for (const productId of productIds) {
    const [stockRows] = await conn.query(
      `SELECT quantity FROM product_stock WHERE product_id = ?${forUpdate ? ' FOR UPDATE' : ''}`,
      [productId]
    );
    stockMap.set(productId, Number(stockRows[0]?.quantity || 0));
  }
  const [pRows] = await conn.query(
    `SELECT id, name FROM products WHERE id IN (?)`,
    [productIds]
  );
  const nameMap = new Map(pRows.map((p) => [Number(p.id), p.name]));
  return needs
    .map((n) => {
      const have = stockMap.get(Number(n.product_id)) || 0;
      return {
        product_id: Number(n.product_id),
        product_name: nameMap.get(Number(n.product_id)) || ('SP#' + n.product_id),
        need: Number(n.need) || 0,
        have,
      };
    })
    .filter((row) => row.have < row.need);
}

async function ensureCompanyStockAvailable(conn, orderId, opts = {}) {
  const needs = await loadOrderProductNeeds(conn, orderId);
  const lacks = await getCompanyStockLack(conn, needs, opts);
  if (lacks.length) {
    throw httpErr(409, 'Kho tổng không đủ hàng để tạo / hoàn thành đơn', {
      code: 'INSUFFICIENT_STOCK',
      details: { lacks },
    });
  }
  return needs;
}

async function consumeCompanyStockForOrder(conn, orderId, actorStaffId) {
  const needs = await ensureCompanyStockAvailable(conn, orderId, { forUpdate: true });
  if (!needs.length) return null;

  const code = await genReceiptCode(conn, 'out');
  const [rIns] = await conn.query(
    `INSERT INTO stock_receipts
       (code, kind, reason_code, ref_order_id, created_by_staff_id)
     VALUES (?, 'out', 'order_consume', ?, ?)`,
    [code, orderId, actorStaffId || null]
  );
  const receiptId = rIns.insertId;

  for (const n of needs) {
    await conn.query(
      `UPDATE product_stock SET quantity = quantity - ? WHERE product_id = ?`,
      [n.need, n.product_id]
    );
    await conn.query(
      `INSERT INTO stock_receipt_items (receipt_id, product_id, qty)
       VALUES (?, ?, ?)`,
      [receiptId, n.product_id, n.need]
    );
  }
  return receiptId;
}

// Sanitize text tu do (note, address) chong stored XSS — cap dai + cam < >
function sanitizeFreeText(input, { max, label }) {
  if (input == null || input === '') return null;
  const v = String(input);
  if (v.length > max) throw httpErr(400, `${label} quá dài (tối đa ${max})`);
  if (/[<>]/.test(v)) throw httpErr(400, `${label} chứa ký tự không hợp lệ`);
  return v.trim() || null;
}

function deriveWarrantyItemsFromLines(lines = []) {
  const items = [];
  for (const ln of Array.isArray(lines) ? lines : []) {
    for (const rawItem of Array.isArray(ln.items) ? ln.items : []) {
      const productId = Number(rawItem.product_id) || null;
      const qty = Math.max(1, Number(rawItem.qty) || 1);
      const out = {
        item_role: 'faulty',
        product_id: productId,
        qty,
        device_name: null,
        imei: null,
        license_plate: null,
        account_name: null,
        sim_number: null,
        condition_note: null,
        note_text: null,
      };
      for (const fv of Array.isArray(rawItem.field_values) ? rawItem.field_values : []) {
        const label = normalizeLooseText(fv && fv.label);
        const value = String((fv && fv.value) || '').trim() || null;
        if (!value) continue;
        if (label.includes('imei')) out.imei = out.imei || value;
        else if (label.includes('bien so') || label.includes('bsx')) out.license_plate = out.license_plate || value;
        else if (label.includes('tai khoan') || label.includes('ten tk')) out.account_name = out.account_name || value;
        else if (label.includes('sim')) out.sim_number = out.sim_number || value;
      }
      if (out.product_id || out.device_name || out.imei || out.license_plate || out.account_name || out.sim_number) {
        items.push(out);
      }
    }
  }
  return items;
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
  // Xoa sach du lieu cu (xu ly ca truong hop khong co CASCADE)
  await conn.query(`DELETE FROM order_field_values WHERE order_id = ?`, [orderId]);
  await conn.query(`DELETE FROM order_items WHERE order_id = ?`, [orderId]);
  await conn.query(`DELETE FROM order_charges WHERE order_id = ? AND line_id IS NOT NULL`, [orderId]);
  await conn.query(`DELETE FROM order_lines WHERE order_id = ?`, [orderId]);
  if (!Array.isArray(lines) || !lines.length) return;

  let lineSeq = 0;
  for (const ln of lines) {
    const tplId = Number(ln.template_id) || null;
    const customName = ln.custom_name ? String(ln.custom_name).trim().slice(0, 120) : null;
    if (!tplId && !customName) throw httpErr(400, 'Line thiếu template_id hoặc custom_name');
    lineSeq++;

    const [r] = await conn.query(
      `INSERT INTO order_lines (order_id, template_id, custom_name, seq, note)
       VALUES (?, ?, ?, ?, ?)`,
      [orderId, tplId, customName, lineSeq, sanitizeFreeText(ln.note, { max: 500, label: 'Ghi chú dòng' })]
    );
    const lineId = r.insertId;

    // Items + field_values gan vao tung item
    if (Array.isArray(ln.items)) {
      for (const it of ln.items) {
        const pid = Number(it.product_id);
        if (!pid) continue;
        const qty = Math.max(1, Number(it.qty) || 1);
        const price = Number(it.unit_price) || 0;
        const vat = Math.max(0, Math.min(100, Number(it.vat_percent) || 0));
        const [iRes] = await conn.query(
          `INSERT INTO order_items (order_id, line_id, product_id, qty, unit_price, vat_percent)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, lineId, pid, qty, price, vat]
        );
        const itemId = iRes.insertId;

        // Field values (hop thong tin) gan truc tiep vao item nay
        if (Array.isArray(it.field_values)) {
          let fvSeq = 0;
          for (const fv of it.field_values) {
            const label = String(fv.label || '').trim();
            if (!label) continue;
            if (label.length > 100 || /[<>"'`]/.test(label)) {
              throw httpErr(400, 'Nhãn thông tin (label) không hợp lệ');
            }
            let value = fv.value == null ? null : String(fv.value);
            if (value != null) {
              if (value.length > 500) throw httpErr(400, 'Giá trị thông tin quá dài (tối đa 500)');
              if (/[<>]/.test(value)) throw httpErr(400, 'Giá trị thông tin chứa ký tự không hợp lệ');
            }
            fvSeq++;
            await conn.query(
              `INSERT INTO order_field_values (order_id, line_id, item_id, label, value, seq, is_deleted)
               VALUES (?, ?, ?, ?, ?, ?, 0)`,
              [orderId, lineId, itemId, label, value, fvSeq]
            );
          }
        }
      }
    }

    // Charges cap line (phi/giam gia trong nhiem vu)
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
            c.type AS customer_type,
            s.full_name AS staff_name,
            ap.full_name  AS tech_commission_approved_by_name,
            req.full_name AS tech_commission_requested_by_name,
            ec.id AS end_customer_id,
            ec.full_name AS end_customer_name,
            ec.phone AS end_customer_phone,
            ec.code AS end_customer_code
       FROM orders o
       LEFT JOIN customers c   ON c.id   = o.customer_id
       LEFT JOIN customers ec  ON ec.id  = o.end_customer_id
       LEFT JOIN staff     s   ON s.id   = o.assigned_staff_id
       LEFT JOIN staff     ap  ON ap.id  = o.tech_commission_approved_by
       LEFT JOIN staff     req ON req.id = o.tech_commission_requested_by
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
    `SELECT id, line_id, item_id, label, value, seq
       FROM order_field_values WHERE order_id = ? AND is_deleted = 0 AND item_id IS NOT NULL
      ORDER BY seq, id`, [id]
  );

  // Group: item map (field_values gan vao tung item)
  const itemMap = new Map(items.map(it => [it.id, { ...it, field_values: [] }]));
  for (const fv of fieldValues) {
    if (itemMap.has(fv.item_id)) itemMap.get(fv.item_id).field_values.push(fv);
  }

  // Group: line map (items + charges gan vao tung line)
  const lineMap = new Map(lines.map(l => [l.id, { ...l, items: [], charges: [] }]));
  for (const it of itemMap.values()) if (lineMap.has(it.line_id)) lineMap.get(it.line_id).items.push(it);
  // Loc "Công lắp" — luu de tinh cong KTV, khong hien thi ra ngoai
  for (const c of charges) {
    if (c.label === 'Công lắp') continue;
    if (c.line_id != null && lineMap.has(c.line_id)) lineMap.get(c.line_id).charges.push(c);
  }
  const linesOut = Array.from(lineMap.values());

  const [photos] = await conn.query(
    `SELECT id, step_code, url, caption, uploaded_by, uploaded_at
       FROM order_step_photos WHERE order_id = ? AND is_deleted = 0
      ORDER BY uploaded_at, id`, [id]
  );
  const steps = await loadWorkflowSteps(conn);

  // Cac de xuat cap nhat thong tin khach do KTV gui kem don nay
  const [ktvRequests] = await conn.query(
    `SELECT r.id, r.asset_kind, r.action, r.target_id, r.value, r.note,
            r.requested_by_role, r.requested_by_id, r.status,
            r.reviewed_by, r.reviewed_at, r.review_note,
            s.full_name AS requested_by_name,
            rs.full_name AS reviewed_by_name,
            CASE r.asset_kind
              WHEN 'account' THEN (SELECT account_name FROM customer_accounts WHERE id = r.target_id)
              WHEN 'vehicle' THEN (SELECT plate        FROM customer_vehicles WHERE id = r.target_id)
              WHEN 'sim'     THEN (SELECT sim_number   FROM customer_sims     WHERE id = r.target_id)
            END AS target_current_value
       FROM customer_update_requests r
       LEFT JOIN staff s  ON s.id  = r.requested_by_id
       LEFT JOIN staff rs ON rs.id = r.reviewed_by
      WHERE r.ref_order_id = ? AND r.is_deleted = 0
      ORDER BY r.id DESC`, [id]
  );

  // Hoa hong nhan vien (role=staff) — nhieu dong/don
  const [staffCommissions] = await conn.query(
    `SELECT sc.id, sc.staff_id, sc.amount, sc.note,
            sc.approved_at, sc.approved_by,
            sc.requested_at, sc.requested_by,
            s.full_name AS staff_name, s.role AS staff_role,
            ap.full_name AS approved_by_name
       FROM order_staff_commissions sc
       LEFT JOIN staff s  ON s.id  = sc.staff_id
       LEFT JOIN staff ap ON ap.id = sc.approved_by
      WHERE sc.order_id = ? AND sc.is_deleted = 0
      ORDER BY sc.id ASC`, [id]
  );

  const detail = {
    ...o,
    lines: linesOut,
    step_photos: photos,
    workflow_steps: steps,
    customer_update_requests: ktvRequests,
    staff_commissions: staffCommissions,
  };
  if (o.service_kind === WARRANTY_SERVICE_KIND) {
    detail.warranty = await loadWarrantyDetail(conn, id);
  }
  return detail;
}

async function loadWarrantyOrderRow(conn, id) {
  const [rows] = await conn.query(
    `SELECT id, code, service_kind, assigned_staff_id, status
       FROM orders
      WHERE id = ? AND is_deleted = 0`,
    [id]
  );
  if (!rows.length) throw httpErr(404, 'Không tìm thấy đơn');
  if (rows[0].service_kind !== WARRANTY_SERVICE_KIND) {
    throw httpErr(409, 'Đơn này không phải đơn bảo hành');
  }
  return rows[0];
}

// ============================================================
// STATEMENT — bang ke nhieu don theo filter hien tai (khong phan trang)
// GET /api/admin/orders/statement?customer_id=&customer_q=&date_from=&date_to=&status=&payment_status=&template_id=
// ============================================================
router.get('/statement', async (req, res, next) => {
  try {
    const dateFrom = req.query.date_from ? String(req.query.date_from) : '';
    const dateTo   = req.query.date_to   ? String(req.query.date_to)   : '';
    const serviceKind = parseServiceKindFilter(req.query.service_kind);
    if (serviceKind) await ensureWarrantySchema(db);

    const where = ['o.is_deleted = 0'];
    const args  = [];
    if (serviceKind) { where.push('o.service_kind = ?'); args.push(serviceKind); }

    const customerId = Number(req.query.customer_id);
    if (customerId) { where.push('o.customer_id = ?'); args.push(customerId); }

    const customerQ = req.query.customer_q ? String(req.query.customer_q).trim() : '';
    if (customerQ) {
      where.push('(c.full_name LIKE ? OR c.phone LIKE ?)');
      args.push(`%${customerQ}%`, `%${customerQ}%`);
    }

    const q = req.query.q ? String(req.query.q).trim() : '';
    if (q) {
      where.push('(o.code LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?)');
      args.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const statusRaw = req.query.status ? String(req.query.status) : '';
    if (statusRaw) {
      const stVals = statusRaw.split(',').map(s => s.trim()).filter(Boolean);
      if (stVals.length === 1) { where.push('o.status = ?'); args.push(stVals[0]); }
      else if (stVals.length > 1) { where.push(`o.status IN (${stVals.map(() => '?').join(',')})`); args.push(...stVals); }
    }

    const paymentStatusRaw = req.query.payment_status ? String(req.query.payment_status) : '';
    if (paymentStatusRaw) {
      const psVals = paymentStatusRaw.split(',').map(s => s.trim()).filter(Boolean);
      if (psVals.length === 1) { where.push('o.payment_status = ?'); args.push(psVals[0]); }
      else if (psVals.length > 1) { where.push(`o.payment_status IN (${psVals.map(() => '?').join(',')})`); args.push(...psVals); }
    }

    const templateRaw = req.query.template_id ? String(req.query.template_id) : '';
    if (templateRaw) {
      const tVals = templateRaw.split(',').map(s => Number(s.trim())).filter(Boolean);
      if (tVals.length === 1) {
        where.push('EXISTS (SELECT 1 FROM order_lines ol WHERE ol.order_id = o.id AND ol.template_id = ? AND ol.is_deleted = 0)');
        args.push(tVals[0]);
      } else if (tVals.length > 1) {
        where.push(`EXISTS (SELECT 1 FROM order_lines ol WHERE ol.order_id = o.id AND ol.template_id IN (${tVals.map(() => '?').join(',')}) AND ol.is_deleted = 0)`);
        args.push(...tVals);
      }
    }

    if (dateFrom) { where.push('o.created_at >= ?'); args.push(dateFrom); }
    if (dateTo)   { where.push('o.created_at < DATE_ADD(?, INTERVAL 1 DAY)'); args.push(dateTo); }

    const [orders] = await db.query(
      `SELECT o.id, o.code, o.status, o.payment_status,
              o.service_kind, o.total_amount, o.paid_amount, o.debt_carried_at, o.customer_id,
              o.address, o.note, o.created_at, o.confirmed_at, o.completed_at,
              c.full_name AS customer_name, c.phone AS customer_phone,
              c.code AS customer_code, c.company_name AS customer_company,
              c.type AS customer_type, c.address AS customer_address,
              s.full_name AS staff_name, s.phone AS staff_phone
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         LEFT JOIN staff s ON s.id = o.assigned_staff_id
        WHERE ${where.join(' AND ')}
        ORDER BY o.created_at, o.id
        LIMIT 500`, args
    );

    // Lay customer info: uu tien customer_id filter, neu khong thi lay tu don dau tien
    let customer = null;
    if (customerId) {
      const [custRows] = await db.query(
        `SELECT id, code, full_name, phone, address, company_name, tax_code, type
           FROM customers WHERE id = ? AND is_deleted = 0`, [customerId]
      );
      customer = custRows[0] || null;
    } else if (orders.length) {
      const first = orders[0];
      customer = {
        id: first.customer_id,
        code: first.customer_code,
        full_name: first.customer_name,
        phone: first.customer_phone,
        address: first.customer_address,
        company_name: first.customer_company,
        type: first.customer_type,
      };
    }

    if (!orders.length) {
      const [settingsRows] = await db.query('SELECT `key`, `value` FROM app_settings');
      const settings = {};
      for (const r of settingsRows) settings[r.key] = r.value;
      return res.json({ customer, orders: [], summary: { total_amount: 0, paid_amount: 0, remaining: 0 }, settings, date_from: dateFrom, date_to: dateTo });
    }

    const orderIds = orders.map(o => o.id);

    const [lines] = await db.query(
      `SELECT ol.id, ol.order_id, ol.seq, ol.subtotal, ol.note,
              COALESCE(ol.custom_name, t.name) AS template_name
         FROM order_lines ol
         LEFT JOIN order_templates t ON t.id = ol.template_id
        WHERE ol.order_id IN (?) AND ol.is_deleted = 0
        ORDER BY ol.order_id, ol.seq, ol.id`, [orderIds]
    );

    const [items] = await db.query(
      `SELECT oi.id, oi.order_id, oi.line_id, oi.qty, oi.unit_price,
              p.name AS product_name, p.code AS product_code
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id IN (?)`, [orderIds]
    );

    const [fieldValues] = await db.query(
      `SELECT order_id, line_id, item_id, label, value
         FROM order_field_values
        WHERE order_id IN (?) AND is_deleted = 0 AND item_id IS NOT NULL
        ORDER BY seq, id`, [orderIds]
    );

    const [charges] = await db.query(
      `SELECT order_id, line_id, kind, label, amount
         FROM order_charges
        WHERE order_id IN (?) AND is_deleted = 0 AND label != 'Công lắp' AND line_id IS NOT NULL
        ORDER BY id`, [orderIds]
    );

    // Group: item map + field_values per item
    const itemMap = new Map();
    for (const it of items) itemMap.set(it.id, { ...it, field_values: [] });
    for (const fv of fieldValues) {
      if (itemMap.has(fv.item_id)) itemMap.get(fv.item_id).field_values.push(fv);
    }

    // Group: line map + items + charges per line
    const lineMap = new Map();
    for (const ln of lines) lineMap.set(ln.id, { ...ln, items: [], charges: [] });
    for (const it of itemMap.values()) if (lineMap.has(it.line_id)) lineMap.get(it.line_id).items.push(it);
    for (const c of charges) if (lineMap.has(c.line_id)) lineMap.get(c.line_id).charges.push(c);

    const orderLineMap = new Map();
    for (const ln of lineMap.values()) {
      if (!orderLineMap.has(ln.order_id)) orderLineMap.set(ln.order_id, []);
      orderLineMap.get(ln.order_id).push(ln);
    }

    const enriched = orders.map(o => ({
      ...o,
      remaining: Math.max(0, Number(o.total_amount) - Number(o.paid_amount)),
      lines: orderLineMap.get(o.id) || [],
    }));

    const summary = {
      total_amount: enriched.reduce((s, o) => s + Number(o.total_amount), 0),
      paid_amount:  enriched.reduce((s, o) => s + Number(o.paid_amount),  0),
      remaining:    enriched.reduce((s, o) => s + o.remaining, 0),
    };

    const [settingsRows] = await db.query('SELECT `key`, `value` FROM app_settings');
    const settings = {};
    for (const r of settingsRows) settings[r.key] = r.value;

    res.json({ customer, orders: enriched, summary, settings, date_from: dateFrom, date_to: dateTo });
  } catch (err) { next(err); }
});

// ============================================================
// LIST
// ============================================================
router.get('/', async (req, res, next) => {
  try {
    const where = ['o.is_deleted = 0'];
    const args = [];
    const serviceKind = parseServiceKindFilter(req.query.service_kind);
    if (serviceKind) await ensureWarrantySchema(db);
    if (serviceKind) { where.push('o.service_kind = ?'); args.push(serviceKind); }

    const statusRaw = req.query.status ? String(req.query.status) : '';
    if (statusRaw) {
      const stVals = statusRaw.split(',').map(s => s.trim()).filter(Boolean);
      if (stVals.length === 1) { where.push('o.status = ?'); args.push(stVals[0]); }
      else if (stVals.length > 1) { where.push(`o.status IN (${stVals.map(() => '?').join(',')})`); args.push(...stVals); }
    }

    const paymentStatusRaw = req.query.payment_status ? String(req.query.payment_status) : '';
    if (paymentStatusRaw) {
      const psVals = paymentStatusRaw.split(',').map(s => s.trim()).filter(Boolean);
      if (psVals.length === 1) { where.push('o.payment_status = ?'); args.push(psVals[0]); }
      else if (psVals.length > 1) { where.push(`o.payment_status IN (${psVals.map(() => '?').join(',')})`); args.push(...psVals); }
    }

    const templateRaw = req.query.template_id ? String(req.query.template_id) : '';
    if (templateRaw) {
      const tVals = templateRaw.split(',').map(s => Number(s.trim())).filter(Boolean);
      if (tVals.length === 1) {
        where.push('EXISTS (SELECT 1 FROM order_lines ol WHERE ol.order_id = o.id AND ol.template_id = ? AND ol.is_deleted = 0)');
        args.push(tVals[0]);
      } else if (tVals.length > 1) {
        where.push(`EXISTS (SELECT 1 FROM order_lines ol WHERE ol.order_id = o.id AND ol.template_id IN (${tVals.map(() => '?').join(',')}) AND ol.is_deleted = 0)`);
        args.push(...tVals);
      }
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

    const deviceQ = req.query.device_q ? String(req.query.device_q).trim() : '';
    if (deviceQ) {
      where.push(`EXISTS (
        SELECT 1 FROM order_field_values fv
         WHERE fv.order_id = o.id AND fv.is_deleted = 0
           AND fv.label IN ('Bien so xe','Biển số xe','Ten tai khoan','Tên tài khoản','tai khoan','tài khoản','So sim moi','Số sim mới')
           AND fv.value LIKE ?
      )`);
      args.push(`%${deviceQ}%`);
    }

    const dateFrom = req.query.date_from ? String(req.query.date_from) : '';
    if (dateFrom) { where.push('o.created_at >= ?'); args.push(dateFrom); }

    const dateTo = req.query.date_to ? String(req.query.date_to) : '';
    if (dateTo) { where.push('o.created_at < DATE_ADD(?, INTERVAL 1 DAY)'); args.push(dateTo); }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      `SELECT o.id, o.code, o.status, o.payment_status, o.customer_id, o.service_kind,
              o.assigned_staff_id, o.address, o.note,
              o.subtotal, o.total_amount, o.paid_amount, o.wage_amount,
              o.due_at, o.completed_at, o.created_at, o.debt_carried_at,
              c.full_name AS customer_name, c.phone AS customer_phone,
              c.avatar_url AS customer_avatar_url,
              s.full_name AS staff_name,
              (SELECT GROUP_CONCAT(COALESCE(ol.custom_name, t.name) ORDER BY ol.seq SEPARATOR ' + ')
                 FROM order_lines ol
                 LEFT JOIN order_templates t ON t.id = ol.template_id
                WHERE ol.order_id = o.id AND ol.is_deleted = 0) AS template_names,
              (SELECT GROUP_CONCAT(DISTINCT fv.value ORDER BY fv.id SEPARATOR ', ')
                 FROM order_field_values fv
                WHERE fv.order_id = o.id AND fv.is_deleted = 0
                  AND fv.label IN ('Bien so xe','Biển số xe')) AS bien_so_list,
              (SELECT GROUP_CONCAT(DISTINCT fv.value ORDER BY fv.id SEPARATOR ', ')
                 FROM order_field_values fv
                WHERE fv.order_id = o.id AND fv.is_deleted = 0
                  AND fv.label IN ('Ten tai khoan','Tên tài khoản','tai khoan','tài khoản')) AS ten_tk_list,
              (SELECT GROUP_CONCAT(DISTINCT fv.value ORDER BY fv.id SEPARATOR ', ')
                 FROM order_field_values fv
                WHERE fv.order_id = o.id AND fv.is_deleted = 0
                  AND fv.label IN ('So sim moi','Số sim mới','So SIM','Số SIM')) AS so_sim_list,
              (SELECT GROUP_CONCAT(DISTINCT fv.value ORDER BY fv.id SEPARATOR ', ')
                 FROM order_field_values fv
                WHERE fv.order_id = o.id AND fv.is_deleted = 0
                  AND fv.label IN ('IMEI','Imei','imei')) AS imei_list
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         LEFT JOIN staff     s ON s.id = o.assigned_staff_id
        WHERE ${where.join(' AND ')}
        ORDER BY o.created_at DESC, o.id DESC
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

// Lay danh sach nhan vien + KTV de FE build dropdown chon hoa hong.
// Staff truoc, KTV sau; them phone va role de FE hien thi card.
// Phai dat TRUOC /:id de Express khong nham path nay la id.
router.get('/staff-list-for-commission', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, role, phone
       FROM staff
       WHERE role IN ('staff','kithuat') AND is_deleted = 0
       ORDER BY FIELD(role,'staff','kithuat'), full_name`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /my-staff-commission-requests — nhan vien (role=staff) xem yeu cau cua chinh minh.
// Phai dat TRUOC /:id.
router.get('/my-staff-commission-requests', async (req, res, next) => {
  try {
    const meId  = req.user?.sub;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      `SELECT sc.id, sc.order_id, sc.amount, sc.note,
              sc.approved_at, sc.requested_at,
              o.code AS order_code,
              ap.full_name AS approved_by_name,
              c.full_name  AS customer_name
         FROM order_staff_commissions sc
         JOIN orders o ON o.id = sc.order_id AND o.is_deleted = 0
         LEFT JOIN customers c ON c.id = o.customer_id
         LEFT JOIN staff ap ON ap.id = sc.approved_by
        WHERE sc.staff_id = ? AND sc.is_deleted = 0
        ORDER BY sc.requested_at DESC, sc.id DESC
        LIMIT ? OFFSET ?`,
      [meId, limit, offset]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM order_staff_commissions sc
         JOIN orders o ON o.id = sc.order_id AND o.is_deleted = 0
        WHERE sc.staff_id = ? AND sc.is_deleted = 0`,
      [meId]
    );
    res.json({ items: rows, total, page, limit });
  } catch (err) { next(err); }
});

// GET /staff-commission-requests — admin xem yeu cau hoa hong nhan vien dang cho duyet.
// Phai dat TRUOC /:id.
router.get('/staff-commission-requests', adminOnly, async (req, res, next) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page)  || 1);
    const limit   = Math.min(200, parseInt(req.query.limit) || 50);
    const offset  = (page - 1) * limit;
    const showAll = req.query.all === '1';
    const approvedFilter = showAll ? '' : 'AND sc.approved_at IS NULL';

    const [rows] = await db.query(
      `SELECT sc.id, sc.order_id, sc.amount, sc.note,
              sc.requested_at, sc.approved_at,
              o.code       AS order_code,
              s.full_name  AS staff_name,
              s.role       AS staff_role,
              c.full_name  AS customer_name,
              c.phone      AS customer_phone
         FROM order_staff_commissions sc
         JOIN orders o ON o.id = sc.order_id AND o.is_deleted = 0
         LEFT JOIN staff     s ON s.id = sc.staff_id
         LEFT JOIN customers c ON c.id = o.customer_id
        WHERE sc.is_deleted = 0
          AND sc.requested_at IS NOT NULL
          ${approvedFilter}
        ORDER BY sc.requested_at ASC
        LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM order_staff_commissions sc
         JOIN orders o ON o.id = sc.order_id AND o.is_deleted = 0
        WHERE sc.is_deleted = 0
          AND sc.requested_at IS NOT NULL
          ${approvedFilter}`
    );
    res.json({ items: rows, total, page, limit });
  } catch (err) { next(err); }
});

// GET /commission-requests — danh sach yeu cau hoa hong KTV dang cho duyet.
// Phai dat TRUOC /:id de Express khong nham 'commission-requests' la id.
router.get('/commission-requests', adminOnly, async (req, res, next) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page)  || 1);
    const limit   = Math.min(200, parseInt(req.query.limit) || 50);
    const offset  = (page - 1) * limit;
    const showAll = req.query.all === '1';
    const approvedFilter = showAll ? '' : 'AND o.tech_commission_approved_at IS NULL';

    const [rows] = await db.query(
      `SELECT o.id, o.code, o.created_at, o.completed_at,
              o.tech_commission_amount,
              o.tech_commission_note,
              o.tech_commission_requested_at,
              o.tech_commission_approved_at,
              s.full_name  AS staff_name,
              c.full_name  AS customer_name,
              c.phone      AS customer_phone
         FROM orders o
         LEFT JOIN staff     s ON s.id = o.assigned_staff_id
         LEFT JOIN customers c ON c.id = o.customer_id
        WHERE o.tech_commission_requested_at IS NOT NULL
          ${approvedFilter}
          AND o.is_deleted = 0
        ORDER BY o.tech_commission_requested_at ASC
        LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM orders o
        WHERE o.tech_commission_requested_at IS NOT NULL
          ${approvedFilter}
          AND o.is_deleted = 0`
    );
    res.json({ items: rows, total, page, limit });
  } catch (err) { next(err); }
});

// ============================================================
// STATS — counts by status
// ============================================================
router.get('/stats', async (req, res, next) => {
  try {
    const serviceKind = parseServiceKindFilter(req.query.service_kind);
    if (serviceKind) await ensureWarrantySchema(db);
    const where = ['is_deleted = 0'];
    const args = [];
    if (serviceKind) { where.push('service_kind = ?'); args.push(serviceKind); }
    const [rows] = await db.query(
      `SELECT status, COUNT(*) AS cnt
         FROM orders
        WHERE ${where.join(' AND ')}
        GROUP BY status`,
      args
    );
    const map = {};
    let total = 0;
    for (const r of rows) { map[r.status] = Number(r.cnt); total += Number(r.cnt); }
    res.json({
      total,
      pending:     map.pending     || 0,
      confirmed:   map.confirmed   || 0,
      in_progress: map.in_progress || 0,
      done:        map.done        || 0,
      cancelled:   map.cancelled   || 0,
    });
  } catch (err) { next(err); }
});

// ============================================================
// WARRANTY SUB-ROUTES
// ============================================================
router.get('/:id/warranty', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await ensureWarrantySchema(db);
    await loadWarrantyOrderRow(db, id);
    const warranty = await loadWarrantyDetail(db, id);
    res.json(warranty);
  } catch (err) { next(err); }
});

router.put('/:id/warranty', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    await loadWarrantyOrderRow(conn, id);
    const b = req.body || {};
    const sets = [];
    const args = [];

    if (b.address !== undefined) {
      sets.push('address = ?');
      args.push(sanitizeFreeText(b.address, { max: 300, label: 'Địa chỉ' }));
    }
    if (b.note !== undefined) {
      sets.push('note = ?');
      args.push(sanitizeFreeText(b.note, { max: 1000, label: 'Ghi chú' }));
    }
    // KHONG cho ghi de "Thuc te hien tai" (progress_note) — chi duoc ghi them
    // qua endpoint PATCH /:id/progress-note. Bo qua neu client gui len.

    const metaPayload = b.meta || {
      warranty_mode: b.warranty_mode,
      default_supplier_id: b.default_supplier_id,
      note_text: b.note_text,
    };
    // R3: admin/CSKH chi sua metadata, KHONG duoc dat current_stage (khong day buoc).
    if (metaPayload && metaPayload.current_stage !== undefined) delete metaPayload.current_stage;

    await ensureWarrantySchema(db);
    await conn.beginTransaction();
    if (sets.length) {
      args.push(id);
      await conn.query(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, args);
    }
    if (metaPayload && Object.values(metaPayload).some((v) => v !== undefined)) {
      await upsertWarrantyMeta(conn, id, metaPayload);
    }
    // Admin được phép thêm/sửa items bảo hành trực tiếp
    if (Array.isArray(b.items)) {
      await replaceWarrantyItems(conn, id, b.items);
    }
    await syncWarrantyOrderState(conn, id);
    await recalcOrderTotal(conn, id);
    await recalcPaymentStatus(conn, id);
    await conn.commit();

    // Ghi log chi tiết
    const logParts = [];
    if (b.address !== undefined) logParts.push('địa chỉ');
    if (b.note !== undefined)    logParts.push('ghi chú đơn');
    if (b.meta) {
      if (b.meta.note_text !== undefined)        logParts.push('ghi chú bảo hành');
      if (b.meta.warranty_mode !== undefined)    logParts.push('loại xử lý');
      if (b.meta.default_supplier_id !== undefined) logParts.push('NCC mặc định');
    }
    if (Array.isArray(b.items)) {
      logParts.push(`sản phẩm bảo hành (${b.items.length} item)`);
    }
    const logMsg = logParts.length
      ? `Cập nhật đơn bảo hành (${logParts.join(', ')})`
      : 'Cập nhật đơn bảo hành';
    await appendOrderNote(conn, id, logMsg, req);
    const warranty = await loadWarrantyDetail(conn, id);
    res.json({ ok: true, warranty });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

router.post('/:id/warranty/moves', async (req, res, next) => {
  // R3.2, R3.3: admin/CSKH chi xem; moi thao tac day stage do KTV (cong /api/kithuat)
  // hoac trang kho bao hanh thuc hien. Tu choi, khong thay doi gi.
  next(httpErr(403, 'Trang quản trị không được thực hiện thao tác bảo hành; vui lòng dùng cổng KTV hoặc trang kho bảo hành'));
});

// ============================================================
// DETAIL
// ============================================================
router.get('/:id', async (req, res, next) => {
  try {
    const detail = await loadOrderDetail(db, Number(req.params.id));
    if (!detail) return res.status(404).json({ error: 'Không tìm thấy đơn' });
    res.json(detail);
  } catch (err) { next(err); }
});

// ============================================================
// CREATE
// ============================================================
// Body: {
//   customer_id,
//   end_customer_id?,  // khach le dau cuoi cua dai ly (optional, chi dung khi customer la dealer)
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
    if (!customerId) throw httpErr(400, 'Thiếu customer_id');
    const requestedServiceKind = req.body.service_kind ? normalizeServiceKind(req.body.service_kind) : '';
    const progressNote = sanitizeFreeText(req.body.progress_note, { max: 2000, label: 'Tiến độ hiện tại' });

    // Validate end_customer_id (khach le dau cuoi cua dai ly)
    let endCustomerId = req.body.end_customer_id ? Number(req.body.end_customer_id) : null;
    if (endCustomerId) {
      const [ecRows] = await conn.query(
        `SELECT id, type FROM customers WHERE id = ? AND is_deleted = 0`, [endCustomerId]
      );
      if (!ecRows.length) throw httpErr(400, 'Khách đầu cuối không tồn tại');
      if (ecRows[0].type !== 'retail') throw httpErr(400, 'Khách đầu cuối phải là khách lẻ (retail)');
    }

    const lines = Array.isArray(req.body.lines) ? req.body.lines : [];
    if (!lines.length) throw httpErr(400, 'Đơn phải có ít nhất 1 dòng công việc');

    // Validate moi line: phai co template_id HOAC custom_name
    for (const ln of lines) {
      const hasTpl = Number(ln.template_id) > 0;
      const hasName = ln.custom_name && String(ln.custom_name).trim();
      if (!hasTpl && !hasName) {
        throw httpErr(400, 'Mỗi dòng công việc phải có loại hoặc tên');
      }
    }
    const tplIds = [...new Set(lines.map(l => Number(l.template_id)).filter(Boolean))];
    let tplNameById = new Map();
    if (tplIds.length) {
      const [tRows] = await conn.query(
        `SELECT id, name FROM order_templates WHERE id IN (?) AND is_deleted = 0`, [tplIds]
      );
      if (tRows.length !== tplIds.length) throw httpErr(400, 'Có template_id không hợp lệ');
      tplNameById = new Map(tRows.map((row) => [Number(row.id), row.name]));
    }
    const inferredWarranty = lines.some((ln) => {
      const tplName = tplNameById.get(Number(ln.template_id)) || '';
      return looksLikeWarrantyText(ln.custom_name) || looksLikeWarrantyText(tplName);
    });
    const serviceKind = requestedServiceKind || (inferredWarranty ? WARRANTY_SERVICE_KIND : 'install');

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
        `SELECT id FROM staff WHERE id = ? AND is_deleted = 0`,
        [assignedStaffId]
      );
      if (!sRows.length) throw httpErr(400, 'Nhân viên không hợp lệ');
    }

    if (serviceKind === WARRANTY_SERVICE_KIND) {
      await ensureWarrantySchema(db);
    }
    await conn.beginTransaction();

    const { code, result } = await insertOrderWithRetry(conn, async (code) => {
      return conn.query(
        `INSERT INTO orders
           (code, customer_id, end_customer_id, status, payment_status,
            service_kind, payment_method, address, note, progress_note, due_at, wage_amount,
            assigned_staff_id, creator_type, creator_id)
         VALUES (?, ?, ?, ?, 'unpaid',
                 ?, ?, ?, ?, ?, ?, ?,
                 ?, 'admin', ?)`,
        [code, customerId, endCustomerId, status, serviceKind, paymentMethod,
         sanitizeFreeText(req.body.address, { max: 300, label: 'Địa chỉ' }),
         sanitizeFreeText(req.body.note, { max: 1000, label: 'Ghi chú' }),
         progressNote, req.body.due_at || null, wage, assignedStaffId, adminId]
      );
    });
    const orderId = result[0].insertId;

    await replaceLines(conn, orderId, lines);
    if (serviceKind === WARRANTY_SERVICE_KIND) {
      const rawWarrantyItems = Array.isArray(req.body.warranty?.items) && req.body.warranty.items.length
        ? req.body.warranty.items
        : deriveWarrantyItemsFromLines(lines);
      await upsertWarrantyMeta(conn, orderId, req.body.warranty || {});
      await replaceWarrantyItems(conn, orderId, rawWarrantyItems);
    }

    // Đơn bảo hành không kiểm tra tồn kho khi tạo đơn
    if (!assignedStaffId && serviceKind !== WARRANTY_SERVICE_KIND) {
      await ensureCompanyStockAvailable(conn, orderId);
    }

    // Check kho ca nhan KTV neu gan san luc tao don. force=true -> bo qua.
    if (assignedStaffId && req.body.force !== true) {
      const lacks = await getStaffHoldingsLack(conn, orderId, assignedStaffId);
      if (lacks.length) {
        throw httpErr(409, 'KTV không đủ hàng trong kho cá nhân', {
          code: 'INSUFFICIENT_HOLDINGS',
          details: { lacks },
        });
      }
    }

    if (wage > 0) await syncLaborCharge(conn, orderId, wage);

    await recalcOrderTotal(conn, orderId);
    await recalcPaymentStatus(conn, orderId);

    await conn.commit();
    await appendOrderNote(conn, orderId, 'Tạo đơn', req);

    res.status(201).json({ id: orderId, code, service_kind: serviceKind });
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
    if (!rows.length) throw httpErr(404, 'Không tìm thấy đơn');

    const sets = [], args = [];
    const b = req.body;
    if (b.note !== undefined)      { sets.push('note = ?');      args.push(sanitizeFreeText(b.note, { max: 1000, label: 'Ghi chú' })); }
    if (b.address !== undefined)   { sets.push('address = ?');   args.push(sanitizeFreeText(b.address, { max: 300, label: 'Địa chỉ' })); }
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
    // end_customer_id: co the set null de go gan
    if ('end_customer_id' in b) {
      const ecId = b.end_customer_id ? Number(b.end_customer_id) : null;
      if (ecId) {
        const [ecRows] = await conn.query(
          `SELECT id, type FROM customers WHERE id = ? AND is_deleted = 0`, [ecId]
        );
        if (!ecRows.length) throw httpErr(400, 'Khách đầu cuối không tồn tại');
        if (ecRows[0].type !== 'retail') throw httpErr(400, 'Khách đầu cuối phải là khách lẻ (retail)');
      }
      sets.push('end_customer_id = ?'); args.push(ecId);
    }

    if (!sets.length) return res.json({ ok: true });

    // Thu thập các trường thay đổi để ghi log
    const changedFields = [];
    if (b.note !== undefined)           changedFields.push('ghi chú');
    if (b.address !== undefined)        changedFields.push('địa chỉ');
    if (b.due_at !== undefined)         changedFields.push('hạn hoàn thành');
    if (b.payment_method !== undefined) changedFields.push('hình thức thanh toán');
    if (b.wage_amount !== undefined)    changedFields.push(`công thợ → ${Number(b.wage_amount).toLocaleString('vi-VN')}đ`);
    if ('end_customer_id' in b)         changedFields.push(b.end_customer_id ? 'gán khách đầu cuối' : 'gỡ khách đầu cuối');

    await conn.beginTransaction();
    args.push(id);
    await conn.query(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, args);
    if (wageChanged) {
      await syncLaborCharge(conn, id, newWage);
      await recalcOrderTotal(conn, id);
      await recalcPaymentStatus(conn, id);
    }
    await conn.commit();
    const logMsg = changedFields.length
      ? `Cập nhật thông tin đơn (${changedFields.join(', ')})`
      : 'Cập nhật thông tin đơn';
    await appendOrderNote(conn, id, logMsg, req);
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ============================================================
// PATCH /:id/end-customer — Admin/KTV gán hoặc tạo mới khách đầu cuối
// Body option 1 (chọn có sẵn): { action: 'link', customer_id: <retail_id> }
// Body option 2 (tạo mới):     { action: 'create', full_name, phone?, address?, note? }
// Body option 3 (gỡ):          { action: 'unlink' }
// ============================================================
router.patch('/:id/end-customer', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const orderId = Number(req.params.id);
    const [orderRows] = await conn.query(
      `SELECT id, customer_id, end_customer_id FROM orders WHERE id = ? AND is_deleted = 0`, [orderId]
    );
    if (!orderRows.length) throw httpErr(404, 'Không tìm thấy đơn');

    const action = String(req.body.action || '').trim();
    let endCustomerId = null;
    let newCustomer = null;

    if (action === 'link') {
      endCustomerId = Number(req.body.customer_id);
      if (!endCustomerId) throw httpErr(400, 'Thiếu customer_id');
      const [ecRows] = await conn.query(
        `SELECT id, type FROM customers WHERE id = ? AND is_deleted = 0`, [endCustomerId]
      );
      if (!ecRows.length) throw httpErr(404, 'Không tìm thấy khách hàng');
      if (ecRows[0].type !== 'retail') throw httpErr(400, 'Khách đầu cuối phải là khách lẻ (retail)');

    } else if (action === 'create') {
      const fullName = String(req.body.full_name || '').trim();
      if (!fullName) throw httpErr(400, 'Thiếu full_name');
      const phone = req.body.phone ? String(req.body.phone).trim() : null;
      const address = req.body.address ? String(req.body.address).trim() : null;
      const note = req.body.note ? String(req.body.note).trim() : null;

      // Sinh ma KH tu dong
      const [maxRow] = await conn.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(code, 3) AS UNSIGNED)), 0) AS max_n
           FROM customers WHERE code REGEXP '^KH[0-9]+$'`
      );
      const n = (Number(maxRow[0].max_n) || 0) + 1;
      const code = 'KH' + String(n).padStart(4, '0');

      await conn.beginTransaction();
      const [ins] = await conn.query(
        `INSERT INTO customers (code, type, full_name, phone, address, note)
         VALUES (?, 'retail', ?, ?, ?, ?)`,
        [code, fullName, phone, address, note]
      );
      endCustomerId = ins.insertId;
      const [newRows] = await conn.query(
        `SELECT id, code, full_name, phone, address FROM customers WHERE id = ?`, [endCustomerId]
      );
      newCustomer = newRows[0];

    } else if (action === 'unlink') {
      endCustomerId = null;
    } else {
      throw httpErr(400, 'action phải là: link | create | unlink');
    }

    if (!conn._inTransaction) await conn.beginTransaction();
    await conn.query(
      `UPDATE orders SET end_customer_id = ? WHERE id = ?`, [endCustomerId, orderId]
    );
    await conn.commit();

    res.json({ ok: true, end_customer_id: endCustomerId, new_customer: newCustomer });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ============================================================
// GET /customers/search — Tim khach le de gan end_customer_id
// Query: ?q=, ?type=retail (mac dinh retail)
// ============================================================
router.get('/customers/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const type = req.query.type || 'retail';
    const where = ['is_deleted = 0', 'type = ?'];
    const args = [type];
    if (q) {
      where.push('(full_name LIKE ? OR phone LIKE ? OR code LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like, like);
    }
    const [rows] = await db.query(
      `SELECT id, code, full_name, phone, address, type
         FROM customers WHERE ${where.join(' AND ')}
         ORDER BY full_name
         LIMIT 30`,
      args
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
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
    if (!lines.length) throw httpErr(400, 'Đơn phải có ít nhất 1 dòng công việc');

    const [oRows] = await conn.query(
      `SELECT wage_amount, status, assigned_staff_id, service_kind FROM orders WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    if (!oRows.length) throw httpErr(404, 'Không tìm thấy đơn');
    if (oRows[0].status === 'done' || oRows[0].status === 'cancelled') {
      throw httpErr(409, 'Đơn đã hoàn thành / huỷ — không sửa được');
    }

    // Lấy danh sách sản phẩm cũ để ghi log diff
    const [oldItems] = await conn.query(
      `SELECT p.name AS product_name, oi.qty
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?`,
      [id]
    );

    await conn.beginTransaction();
    await replaceLines(conn, id, lines);

    // Đơn bảo hành: đồng bộ order_warranty_items theo lines mới
    if (oRows[0].service_kind === WARRANTY_SERVICE_KIND) {
      await ensureWarrantySchema(conn);
      // Chỉ derive items chưa có lịch sử kho (current_status = 'intake', không có moves)
      // để không xóa mất items đang trong luồng xử lý KTV
      const [existingWarranty] = await conn.query(
        `SELECT wi.id
           FROM order_warranty_items wi
          WHERE wi.order_id = ? AND wi.is_deleted = 0
            AND EXISTS (
              SELECT 1 FROM order_warranty_moves wm WHERE wm.warranty_item_id = wi.id
            )`,
        [id]
      );
      // Nếu không có item nào đã có lịch sử kho → an toàn để đồng bộ toàn bộ từ lines
      if (!existingWarranty.length) {
        const derivedItems = deriveWarrantyItemsFromLines(lines);
        if (derivedItems.length) {
          await replaceWarrantyItems(conn, id, derivedItems);
        }
      }
    } else {
      if (!oRows[0].assigned_staff_id) {
        await ensureCompanyStockAvailable(conn, id);
      }
    }

    if (oRows[0].wage_amount > 0) await syncLaborCharge(conn, id, oRows[0].wage_amount);
    await recalcOrderTotal(conn, id);
    await recalcPaymentStatus(conn, id);
    await conn.commit();

    // Ghi log diff sản phẩm
    const newProducts = lines.flatMap(ln =>
      (ln.items || []).filter(it => it.product_id).map(it => ({ product_id: it.product_id, qty: it.qty }))
    );
    const [newProductNames] = newProducts.length
      ? await conn.query(
          `SELECT id, name FROM products WHERE id IN (${newProducts.map(() => '?').join(',')})`,
          newProducts.map(it => it.product_id)
        )
      : [[]];
    const nameMap = new Map(newProductNames.map(p => [p.id, p.name]));
    const newList = newProducts.map(it => `${nameMap.get(it.product_id) || `#${it.product_id}`} x${it.qty}`);
    const oldList = oldItems.map(it => `${it.product_name || '?'} x${it.qty}`);

    let logDetail = 'Cập nhật dòng công việc';
    const added = newList.filter(x => !oldList.includes(x));
    const removed = oldList.filter(x => !newList.includes(x));
    const parts = [];
    if (added.length) parts.push(`thêm: ${added.join(', ')}`);
    if (removed.length) parts.push(`bỏ: ${removed.join(', ')}`);
    if (parts.length) logDetail += ` (${parts.join('; ')})`;

    await appendOrderNote(conn, id, logDetail, req);
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
    if (!Number.isFinite(id) || id <= 0) throw httpErr(400, 'id không hợp lệ');
    const [rows] = await conn.query(
      `SELECT o.id, o.status, o.total_amount, o.paid_amount, o.customer_id, o.dealer_id,
              c.type AS customer_type, c.debt_limit
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
        WHERE o.id = ? AND o.is_deleted = 0`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Không tìm thấy đơn');
    if (rows[0].status !== 'pending') throw httpErr(409, 'Đơn không ở trạng thái pending');

    // B-DLR-1: enforce debt_limit cho dealer khi confirm
    if (rows[0].customer_type === 'dealer' && Number(rows[0].debt_limit) > 0) {
      const dealerId = rows[0].customer_id;
      const [debtRow] = await conn.query(
        `SELECT COALESCE(SUM(total_amount - paid_amount), 0) AS debt
           FROM orders
          WHERE (customer_id = ? OR dealer_id = ?)
            AND status NOT IN ('pending','cancelled')
            AND payment_status != 'paid'
            AND is_deleted = 0
            AND total_amount > paid_amount
            AND id <> ?`,
        [dealerId, dealerId, id]
      );
      const currentDebt = Number(debtRow[0].debt) || 0;
      const orderRemain = Math.max(0, Number(rows[0].total_amount) - Number(rows[0].paid_amount));
      const limit = Number(rows[0].debt_limit);
      const force = req.body && (req.body.force === true || req.body.force === 'true' || req.body.force === 1);
      if (currentDebt + orderRemain > limit && !force) {
        throw httpErr(409, `Vượt hạn mức công nợ đại lý (nợ hiện tại ${currentDebt}, đơn ${orderRemain}, hạn mức ${limit}). Gửi force=true để bỏ qua.`);
      }
    }

    await conn.query(`UPDATE orders SET status = 'confirmed' WHERE id = ?`, [id]);
    await appendOrderNote(conn, id, 'Duyệt đơn (pending → confirmed)', req);
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
    if (!target) throw httpErr(400, 'Thiếu step_code');

    const [rows] = await conn.query(
      `SELECT id, status, service_kind, assigned_staff_id FROM orders WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    if (!rows.length) throw httpErr(404, 'Không tìm thấy đơn');
    if (false) {
      throw httpErr(409, 'Đơn bảo hành không dùng transition chung; hãy cập nhật bằng luồng bảo hành');
    }

    const steps = await loadWorkflowSteps(conn);
    const v = validateTransition(steps, rows[0].status, target, 'admin');
    if (!v.ok) throw httpErr(400, v.error);

    await conn.beginTransaction();

    if (target === 'done' && !rows[0].assigned_staff_id) {
      await consumeCompanyStockForOrder(conn, id, req.user?.sub || null);
    }

    const sets = ['status = ?'];
    const args = [target];
    if (target === 'done') sets.push('completed_at = COALESCE(completed_at, NOW())');
    args.push(id);
    await conn.query(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, args);
    // status doi -> recalc payment_status (vd: done + thieu tien -> 'customer_owes')
    await recalcPaymentStatus(conn, id);
    await conn.commit();
    await appendOrderNote(conn, id, `Chuyển trạng thái → ${target}`, req);
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
// Body: { progress_note }  — CHI GHI THEM (append-only), khong sua/xoa noi dung cu.
// Moi dong duoc gan dau thoi gian + nguoi ghi va noi them vao cuoi progress_note.
router.patch('/:id/progress-note', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const note = sanitizeFreeText(req.body.progress_note, { max: 1000, label: 'Ghi chú thực tế' });
    if (!note) return res.status(400).json({ error: 'Nội dung ghi chú trống' });
    const [chk] = await db.query(
      `SELECT id FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!chk.length) return res.status(404).json({ error: 'Không tìm thấy đơn' });
    await appendOrderNote(db, id, note, req);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ============================================================
// TECH COMMISSION (hoa hong KTV) — admin duyet yeu cau tu KTV
// ============================================================
// Luong moi:
//   KTV tu nhap yeu cau qua /kithuat/orders/:id/commission-request
//   Admin duyet tai day hoac tai trang /admin/commissions.html
//   Admin cung co the tu nhap thu cong (nhap amount) neu KTV chua gui yeu cau.
//
// PATCH /:id/tech-commission
// Body: { amount? (neu admin muon override), note? }
// Neu khong truyen amount => giu nguyen so tien KTV da nhap.
router.patch('/:id/tech-commission', adminOnly, async (req, res, next) => {
  try {
    const id       = Number(req.params.id);
    const approver = req.user && req.user.sub ? req.user.sub : null;

    const [[order]] = await db.query(
      `SELECT id, tech_commission_amount, tech_commission_note FROM orders
        WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn' });

    const rawAmt = req.body.amount != null ? req.body.amount : null;
    const amount = rawAmt !== null
      ? Math.max(0, Math.round(Number(rawAmt) || 0))
      : Math.max(0, Number(order.tech_commission_amount) || 0);

    const note = req.body.note != null
      ? String(req.body.note).slice(0, 300)
      : order.tech_commission_note;

    if (!amount) return res.status(400).json({ error: 'Số tiền hoa hồng phải lớn hơn 0' });

    const [r] = await db.query(
      `UPDATE orders
          SET tech_commission_amount       = ?,
              tech_commission_note         = ?,
              tech_commission_approved_at  = NOW(),
              tech_commission_approved_by  = ?
        WHERE id = ? AND is_deleted = 0`,
      [amount, note, approver, id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Không tìm thấy đơn' });
    await appendOrderNote(db, id, `Duyệt hoa hồng KTV ${fmtVnd(amount)}đ`, req);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// DELETE /:id/tech-commission — tu choi yeu cau hoac huy duyet, reset toan bo ve 0
router.delete('/:id/tech-commission', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [r] = await db.query(
      `UPDATE orders
          SET tech_commission_amount       = 0,
              tech_commission_approved_at  = NULL,
              tech_commission_approved_by  = NULL,
              tech_commission_note         = NULL,
              tech_commission_requested_by = NULL,
              tech_commission_requested_at = NULL
        WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Không tìm thấy đơn' });
    await appendOrderNote(db, id, 'Từ chối / huỷ hoa hồng KTV', req);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ============================================================
// STAFF COMMISSION (hoa hong nhan vien role=staff) — admin quan ly
// ============================================================
// POST   /:id/staff-commissions          — them dong hoa hong moi
// PATCH  /:id/staff-commissions/:cid     — sua so tien / ghi chu
// DELETE /:id/staff-commissions/:cid     — xoa dong

router.post('/:id/staff-commissions', adminOnly, async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const staffId = Number(req.body.staff_id);
    const amount  = Math.max(0, Math.round(Number(req.body.amount) || 0));
    const note    = req.body.note != null ? String(req.body.note).slice(0, 300) : null;

    if (!staffId) throw httpErr(400, 'Thiếu staff_id');
    if (!amount)  throw httpErr(400, 'Số tiền phải lớn hơn 0');

    // Kiem tra order ton tai
    const [oRows] = await db.query(
      `SELECT id FROM orders WHERE id = ? AND is_deleted = 0`, [orderId]
    );
    if (!oRows.length) throw httpErr(404, 'Không tìm thấy đơn');

    // Kiem tra nhan vien ton tai (ca staff lan KTV deu co the nhan hoa hong)
    const [sRows] = await db.query(
      `SELECT id FROM staff WHERE id = ? AND is_deleted = 0 AND role IN ('staff','kithuat')`, [staffId]
    );
    if (!sRows.length) throw httpErr(400, 'Nhân viên không hợp lệ');

    const approver = req.user && req.user.sub ? req.user.sub : null;
    const [ins] = await db.query(
      `INSERT INTO order_staff_commissions
         (order_id, staff_id, amount, note, approved_at, approved_by)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [orderId, staffId, amount, note, approver]
    );
    const [[sn]] = await db.query(`SELECT full_name FROM staff WHERE id = ?`, [staffId]);
    await appendOrderNote(db, orderId, `Thêm hoa hồng nhân viên ${sn?.full_name || staffId}: ${fmtVnd(amount)}đ`, req);
    res.status(201).json({ id: ins.insertId });
  } catch (err) { next(err); }
});

router.patch('/:id/staff-commissions/:cid', adminOnly, async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const cid     = Number(req.params.cid);

    // Neu body.amount khong truyen hoac = 0 => giu nguyen so tien cu (approve khong override)
    const rawAmt = req.body.amount != null ? req.body.amount : null;
    let amount;
    if (rawAmt !== null && rawAmt !== '') {
      amount = Math.max(0, Math.round(Number(rawAmt) || 0));
      if (!amount) throw httpErr(400, 'Số tiền phải lớn hơn 0');
    } else {
      const [[cur]] = await db.query(
        `SELECT amount FROM order_staff_commissions WHERE id = ? AND order_id = ? AND is_deleted = 0`,
        [cid, orderId]
      );
      if (!cur) throw httpErr(404, 'Không tìm thấy dòng hoa hồng');
      amount = Number(cur.amount) || 0;
      if (!amount) throw httpErr(400, 'Số tiền hoa hồng là 0, cần nhập số tiền mới');
    }
    const note = req.body.note != null ? String(req.body.note).slice(0, 300) : undefined;

    const setNote = note !== undefined ? ', note = ?' : '';
    const params  = note !== undefined
      ? [amount, req.user?.sub || null, note, cid, orderId]
      : [amount, req.user?.sub || null, cid, orderId];

    const [r] = await db.query(
      `UPDATE order_staff_commissions
          SET amount = ?, approved_at = NOW(), approved_by = ?${setNote}
        WHERE id = ? AND order_id = ? AND is_deleted = 0`,
      params
    );
    if (!r.affectedRows) throw httpErr(404, 'Không tìm thấy dòng hoa hồng');
    await appendOrderNote(db, orderId, `Duyệt hoa hồng nhân viên: ${fmtVnd(amount)}đ`, req);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/:id/staff-commissions/:cid', adminOnly, async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const cid     = Number(req.params.cid);
    const [r] = await db.query(
      `UPDATE order_staff_commissions SET is_deleted = 1
        WHERE id = ? AND order_id = ? AND is_deleted = 0`,
      [cid, orderId]
    );
    if (!r.affectedRows) throw httpErr(404, 'Không tìm thấy dòng hoa hồng');
    await appendOrderNote(db, orderId, 'Xoá hoa hồng nhân viên', req);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /:id/my-staff-commission-request — nhan vien gui yeu cau hoa hong (cho minh hoac nhan vien khac)
router.post('/:id/my-staff-commission-request', async (req, res, next) => {
  try {
    const orderId  = Number(req.params.id);
    const meId     = req.user?.sub;
    const staffId  = req.body.staff_id ? Number(req.body.staff_id) : meId;
    const amount   = Math.max(0, Math.round(Number(req.body.amount) || 0));
    const note     = req.body.note != null ? String(req.body.note).slice(0, 300) : null;

    if (!amount) throw httpErr(400, 'Số tiền phải lớn hơn 0');

    // Validate requester phai la staff hoac KTV (khong phai admin)
    const [[me]] = await db.query(
      `SELECT id, role FROM staff WHERE id = ? AND is_deleted = 0`, [meId]
    );
    if (!me || !['staff','kithuat'].includes(me.role)) throw httpErr(403, 'Chỉ nhân viên / KTV mới sử dụng API này');

    // Validate nguoi nhan cung phai la staff hoac KTV
    if (staffId !== meId) {
      const [[target]] = await db.query(
        `SELECT id, role FROM staff WHERE id = ? AND is_deleted = 0`, [staffId]
      );
      if (!target || !['staff','kithuat'].includes(target.role)) throw httpErr(400, 'Người nhận hoa hồng phải là nhân viên hoặc KTV');
    }

    const [[order]] = await db.query(
      `SELECT id FROM orders WHERE id = ? AND is_deleted = 0`, [orderId]
    );
    if (!order) throw httpErr(404, 'Không tìm thấy đơn');

    const [ins] = await db.query(
      `INSERT INTO order_staff_commissions
         (order_id, staff_id, amount, note, requested_by, requested_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [orderId, staffId, amount, note, meId]
    );
    res.status(201).json({ id: ins.insertId });
  } catch (err) { next(err); }
});

// DELETE /:id/my-staff-commission-request/:cid — nhan vien rut yeu cau cua chinh minh
router.delete('/:id/my-staff-commission-request/:cid', async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const cid     = Number(req.params.cid);
    const meId    = req.user?.sub;
    const [r] = await db.query(
      `UPDATE order_staff_commissions SET is_deleted = 1
        WHERE id = ? AND order_id = ? AND staff_id = ?
          AND approved_at IS NULL AND is_deleted = 0`,
      [cid, orderId, meId]
    );
    if (!r.affectedRows) throw httpErr(404, 'Không tìm thấy yêu cầu hoặc yêu cầu đã duyệt');
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Lay danh sach nhan vien role=staff de FE build dropdown
// ============================================================
// ASSIGN STAFF — check staff_holdings du san pham trong don
// ============================================================
// Neu don dang pending -> auto chuyen confirmed luc gan.
// wage = null nghia la KHONG gui field -> giu nguyen wage_amount cu (B-010).
// force = true -> bo qua check holdings (admin chon "Van gan" du KTV thieu hang).
async function _assignStaff(conn, orderId, staffId, wage, force) {
  const [staffRow] = await conn.query(
    `SELECT id, role FROM staff WHERE id = ? AND is_deleted = 0`, [staffId]
  );
  if (!staffRow.length) throw httpErr(400, 'Nhân viên không hợp lệ');

  const [orderRow] = await conn.query(
    `SELECT id, status, wage_amount FROM orders WHERE id = ? AND is_deleted = 0`, [orderId]
  );
  if (!orderRow.length) throw httpErr(404, 'Không tìm thấy đơn');

  if (!force) {
    const lacks = await getStaffHoldingsLack(conn, orderId, staffId);
    if (lacks.length) {
      throw httpErr(409, 'KTV không đủ hàng trong kho cá nhân', {
        code: 'INSUFFICIENT_HOLDINGS',
        details: { lacks },
      });
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
      `SELECT s.id, s.full_name, s.area, s.online_status, s.avatar_url,
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
    if (!staffId) throw httpErr(400, 'Thiếu staff_id');
    const wage = req.body.wage_amount === undefined
      ? null
      : Math.max(0, Number(req.body.wage_amount) || 0);
    const force = req.body.force === true;

    await conn.beginTransaction();
    await _assignStaff(conn, id, staffId, wage, force);
    await conn.commit();
    const [[sn]] = await conn.query(`SELECT full_name FROM staff WHERE id = ?`, [staffId]);
    await appendOrderNote(conn, id, `Gán KTV: ${sn?.full_name || staffId}`, req);
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
    if (!staffId) throw httpErr(400, 'Thiếu staff_id');
    const wage = req.body.wage_amount === undefined
      ? null
      : Math.max(0, Number(req.body.wage_amount) || 0);
    const force = req.body.force === true;
    await conn.beginTransaction();
    await _assignStaff(conn, id, staffId, wage, force);
    await conn.commit();
    const [[sn]] = await conn.query(`SELECT full_name FROM staff WHERE id = ?`, [staffId]);
    await appendOrderNote(conn, id, `Gán lại KTV: ${sn?.full_name || staffId}`, req);
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
    if (!Number.isFinite(id) || id <= 0) throw httpErr(400, 'id không hợp lệ');
    const [rows] = await conn.query(
      `SELECT id, status FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Không tìm thấy đơn');
    if (rows[0].status === 'cancelled') return res.json({ ok: true });
    // BX-02: chi cancel duoc khi don con o pending/confirmed; in_progress/done
    // phai dung luong refund + return-stock chinh thuc.
    if (!['pending', 'confirmed'].includes(rows[0].status)) {
      throw httpErr(409, 'Đơn đã bắt đầu thi công, vui lòng dùng luồng hoàn tiền + trả hàng');
    }

    await conn.beginTransaction();
    await conn.query(`UPDATE orders SET status = 'cancelled' WHERE id = ?`, [id]);
    await conn.commit();
    await appendOrderNote(conn, id, 'Huỷ đơn', req);
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ============================================================
// PAYMENTS
// ============================================================
// Body: { amount?, method?, note? }
// amount mac dinh = total - paid (clamp >= 0). Tao 1 row order_payments source='admin_direct'.
router.post('/:id/mark-paid', adminOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const [rows] = await conn.query(
      `SELECT id, total_amount, paid_amount FROM orders WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!rows.length) throw httpErr(404, 'Không tìm thấy đơn');

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
    const methodLabel = { cash: 'Tiền mặt', transfer: 'Chuyển khoản', debt: 'Công nợ' }[method] || method;
    await appendOrderNote(conn, id, `Ghi nhận thu ${fmtVnd(amount)}đ (${methodLabel})`, req);
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
      `SELECT id, amount, note, confirmed, confirmed_at, paid_at AS created_at
         FROM order_payments
        WHERE order_id = ? AND source = 'admin_pending' AND is_deleted = 0
        ORDER BY id DESC`, [Number(req.params.id)]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

router.post('/:id/confirm-admin-pending/:paymentId', adminOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const pid = Number(req.params.paymentId);
    const [rows] = await conn.query(
      `SELECT id, amount, confirmed FROM order_payments
        WHERE id = ? AND order_id = ? AND source = 'admin_pending' AND is_deleted = 0`,
      [pid, id]
    );
    if (!rows.length) throw httpErr(404, 'Không tìm thấy payment');
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
    await appendOrderNote(conn, id, `Xác nhận nhận ${fmtVnd(rows[0].amount)}đ từ khách`, req);
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

router.post('/:id/confirm-staff-collection/:collectionId', adminOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    const cid = Number(req.params.collectionId);
    const [rows] = await conn.query(
      `SELECT id, amount, remitted FROM collections
        WHERE id = ? AND order_id = ? AND is_deleted = 0`, [cid, id]
    );
    if (!rows.length) throw httpErr(404, 'Không tìm thấy collection');
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
// PAYMENT HISTORY — lich su thanh toan tong hop
// ============================================================
router.get('/:id/payment-history', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    // Thanh toan truc tiep (da xac nhan)
    const [direct] = await db.query(
      `SELECT op.id, op.source, op.amount, op.note, op.paid_at,
              s.full_name AS staff_name
         FROM order_payments op
         LEFT JOIN staff s ON s.id = op.staff_id
        WHERE op.order_id = ? AND op.is_deleted = 0 AND op.confirmed = 1
        ORDER BY op.paid_at ASC`,
      [id]
    );

    // Thanh toan qua phieu yeu cau (1 row moi phieu YC-)
    const [viaPR] = await db.query(
      `SELECT pr.id, pr.code AS request_code, pr.status AS request_status,
              pr.paid_at, pr.created_at, pri.amount,
              s.full_name AS created_by_name
         FROM payment_request_items pri
         JOIN payment_requests pr ON pr.id = pri.request_id
         LEFT JOIN staff s ON s.id = pr.created_by
        WHERE pri.target_type = 'order' AND pri.target_id = ?
          AND pr.is_deleted = 0
        ORDER BY pr.created_at ASC`,
      [id]
    );

    res.json({
      direct: direct.map(r => ({ ...r, amount: Number(r.amount) })),
      via_request: viaPR.map(r => ({ ...r, amount: Number(r.amount) })),
    });
  } catch (err) { next(err); }
});

// ============================================================
// PHOTOS — anh tu do gan vao don (khong gan step)
// ============================================================
// Body: { url, caption? }
router.post('/:id/photos', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const url = String(req.body.url || '').trim();
    if (!url) return res.status(400).json({ error: 'Thiếu url' });
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
    if (!r.affectedRows) return res.status(404).json({ error: 'Không tìm thấy ảnh' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});


// ============================================================
// ADMIN: THAY DOI TRANG THAI SAN PHAM BAO HANH
// POST /api/admin/orders/:id/warranty-items/:itemId/move
// Body: { action_code, note_text?, supplier_id?, ... }
// Admin co quyen thuc hien tat ca action (ke ca thu hoi ve kho vi khach mang thang den cty)
// ============================================================
router.post('/:id/warranty-items/:itemId/move', adminOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await ensureWarrantySchema(conn);
    const orderId  = Number(req.params.id);
    const itemId   = Number(req.params.itemId);
    if (!orderId || !itemId) throw httpErr(400, 'ID khong hop le');

    await conn.beginTransaction();
    const orderRow = await loadWarrantyOrderRow(conn, orderId);
    const actorId = req.user && req.user.sub ? req.user.sub : null;

    const replacements = req.body.replacements;
    const actionCode = String(req.body.action_code || '').trim();
    const isReplacementAction = ['reserve_replacement_from_technician', 'reserve_replacement_from_company'].includes(actionCode);

    if (isReplacementAction && Array.isArray(replacements) && replacements.length > 0) {
      const [origItems] = await conn.query(
        `SELECT * FROM order_warranty_items WHERE id = ? AND order_id = ? AND is_deleted = 0`,
        [itemId, orderId]
      );
      if (!origItems.length) throw httpErr(404, 'Không tìm thấy item bảo hành gốc');
      const origItem = origItems[0];

      for (let i = 0; i < replacements.length; i++) {
        const rep = replacements[i];
        let targetItemId = itemId;

        if (i > 0) {
          const [insRes] = await conn.query(
            `INSERT INTO order_warranty_items (
              order_id, item_role, handling_type, customer_status, product_id, supplier_id,
              qty, device_name, serial_no, imei, license_plate, account_name, sim_number,
              condition_note, note_text, additional_cost, current_status, current_location, holder_staff_id,
              last_supplier_id
            ) VALUES (?, 'replacement', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'intake', 'customer', ?, ?)` ,
            [
              orderId,
              origItem.handling_type,
              origItem.customer_status,
              origItem.product_id,
              origItem.supplier_id,
              rep.qty,
              origItem.device_name,
              origItem.serial_no,
              origItem.imei,
              origItem.license_plate,
              origItem.account_name,
              origItem.sim_number,
              origItem.condition_note,
              origItem.note_text,
              origItem.holder_staff_id,
              origItem.last_supplier_id
            ]
          );
          targetItemId = insRes.insertId;
        }

        const payload = Object.assign({}, req.body, {
          warranty_item_id: targetItemId,
          replacement_product_id: rep.product_id,
          qty: rep.qty
        });
        delete payload.replacements;

        await createWarrantyMove(conn, orderRow, payload, actorId);
      }
    } else {
      const payload = Object.assign({}, req.body, { warranty_item_id: itemId });
      await createWarrantyMove(conn, orderRow, payload, actorId);
    }

    await syncWarrantyOrderState(conn, orderId);
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

