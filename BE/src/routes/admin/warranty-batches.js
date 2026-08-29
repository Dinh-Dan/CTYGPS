const express = require('express');
const db = require('../../db');
const { ensureWarrantySchema, syncWarrantyOrderState } = require('../../utils/orderWarranty');

const router = express.Router();

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

async function genBatchCode(conn) {
  const now = new Date();
  const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const like = `BHNCC-${datePart}-%`;
  const [rows] = await conn.query(
    `SELECT code FROM supplier_warranty_batches WHERE code LIKE ? ORDER BY code DESC LIMIT 1`,
    [like]
  );
  let next = 1;
  if (rows.length) {
    const tail = rows[0].code.slice(`BHNCC-${datePart}-`.length);
    next = (parseInt(tail, 10) || 0) + 1;
  }
  return `BHNCC-${datePart}-${String(next).padStart(3, '0')}`;
}

async function loadBatchDetail(conn, id) {
  const [batchRows] = await conn.query(
    `SELECT b.id, b.code, b.supplier_id, b.status AS db_status, b.note_text, b.sent_at, b.received_at,
            b.created_at, b.updated_at, s.name AS supplier_name,
            cb.full_name AS created_by_name
       FROM supplier_warranty_batches b
       LEFT JOIN suppliers s ON s.id = b.supplier_id
       LEFT JOIN staff cb ON cb.id = b.created_by_staff_id
      WHERE b.id = ?`,
    [id]
  );
  if (!batchRows.length) throw httpErr(404, 'Không tìm thấy đơn gửi NCC');
  const [itemRows] = await conn.query(
    `SELECT bi.id, bi.batch_id, bi.warranty_item_id, bi.order_id, bi.product_id, bi.qty, bi.note_text,
            o.code AS order_code, o.customer_id, c.full_name AS customer_name, c.phone AS customer_phone,
            wi.device_name, wi.imei, wi.license_plate, wi.account_name, wi.sim_number,
            wi.condition_note, wi.customer_status, wi.current_status, wi.current_location,
            p.code AS product_code, p.name AS product_name
       FROM supplier_warranty_batch_items bi
       JOIN orders o ON o.id = bi.order_id
       LEFT JOIN customers c ON c.id = o.customer_id
       LEFT JOIN order_warranty_items wi ON wi.id = bi.warranty_item_id
       LEFT JOIN products p ON p.id = bi.product_id
      WHERE bi.batch_id = ?
      ORDER BY bi.id`,
    [id]
  );
  const sentCount = itemRows.filter((item) => item.current_status === 'sent_to_supplier' && item.current_location === 'supplier').length;
  const receivedCount = itemRows.filter((item) => item.current_status === 'supplier_returned' && item.current_location === 'company_warranty_stock').length;
  let status = batchRows[0].db_status;
  if (batchRows[0].db_status === 'sent' && sentCount > 0 && receivedCount > 0) status = 'partial_received';
  else if (batchRows[0].db_status === 'sent' && sentCount === 0 && receivedCount > 0) status = 'received';
  return { ...batchRows[0], status, items: itemRows };
}

router.get('/eligible-items', async (req, res, next) => {
  try {
    await ensureWarrantySchema(db);
    const q = String(req.query.q || '').trim();
    const where = [
      `wi.is_deleted = 0`,
      `wi.current_status = 'company_warranty_stock'`,
      `wi.current_location = 'company_warranty_stock'`,
      `(wi.handling_type = 'supplier_return' OR wm.warranty_mode = 'supplier_swap')`,
      `NOT EXISTS (
        SELECT 1
          FROM supplier_warranty_batch_items bi
          JOIN supplier_warranty_batches b ON b.id = bi.batch_id
         WHERE bi.warranty_item_id = wi.id
           AND b.status IN ('draft','sent')
      )`,
    ];
    const args = [];
    if (q) {
      const like = `%${q}%`;
      where.push(`(o.code LIKE ? OR c.full_name LIKE ? OR p.code LIKE ? OR p.name LIKE ? OR wi.imei LIKE ? OR wi.license_plate LIKE ?)`);
      args.push(like, like, like, like, like, like);
    }
    const [rows] = await db.query(
      `SELECT wi.id, wi.order_id, wi.product_id, wi.qty, wi.device_name, wi.imei, wi.license_plate,
              wi.account_name, wi.sim_number, wi.condition_note, wi.customer_status,
              o.code AS order_code, c.full_name AS customer_name, c.phone AS customer_phone,
              p.code AS product_code, p.name AS product_name, s.full_name AS assigned_staff_name
         FROM order_warranty_items wi
         JOIN orders o ON o.id = wi.order_id AND o.is_deleted = 0 AND o.service_kind = 'warranty'
         LEFT JOIN order_warranty_meta wm ON wm.order_id = wi.order_id
         LEFT JOIN customers c ON c.id = o.customer_id
         LEFT JOIN products p ON p.id = wi.product_id
         LEFT JOIN staff s ON s.id = o.assigned_staff_id
        WHERE ${where.join(' AND ')}
        ORDER BY wi.updated_at DESC, wi.id DESC
        LIMIT 300`,
      args
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

router.get('/queues', async (req, res, next) => {
  try {
    await ensureWarrantySchema(db);
    const baseSelect = `
      SELECT wi.id, wi.order_id, wi.product_id, wi.qty, wi.device_name, wi.imei, wi.license_plate,
             wi.account_name, wi.sim_number, wi.condition_note, wi.note_text,
             wi.handling_type, wi.customer_status, wi.current_status, wi.current_location,
             wi.replacement_product_id, wi.replacement_source_scope, wi.replacement_staff_id,
             wi.last_supplier_id,
             o.code AS order_code,
             c.full_name AS customer_name, c.phone AS customer_phone,
             p.code AS product_code, p.name AS product_name,
             rp.code AS replacement_product_code, rp.name AS replacement_product_name,
             s.full_name AS assigned_staff_name,
             rs.full_name AS replacement_staff_name,
             sp.name AS supplier_name
        FROM order_warranty_items wi
        JOIN orders o ON o.id = wi.order_id AND o.is_deleted = 0 AND o.service_kind = 'warranty'
        LEFT JOIN customers c ON c.id = o.customer_id
        LEFT JOIN products p ON p.id = wi.product_id
        LEFT JOIN products rp ON rp.id = wi.replacement_product_id
        LEFT JOIN staff s ON s.id = o.assigned_staff_id
        LEFT JOIN staff rs ON rs.id = wi.replacement_staff_id
        LEFT JOIN suppliers sp ON sp.id = COALESCE(wi.last_supplier_id, wi.supplier_id)
       WHERE wi.is_deleted = 0
    `;
    const [returnedRows, deliveryRows] = await Promise.all([
      db.query(
        `${baseSelect}
          AND wi.customer_status <> 'completed'
          AND wi.current_status = 'supplier_returned'
          AND wi.current_location = 'company_warranty_stock'
        ORDER BY wi.updated_at DESC, wi.id DESC
        LIMIT 200`
      ),
      db.query(
        `${baseSelect}
          AND wi.customer_status <> 'completed'
          AND wi.replacement_product_id IS NOT NULL
          AND wi.replacement_source_scope IN ('company_stock','technician_stock','supplier_returned_item')
        ORDER BY wi.updated_at DESC, wi.id DESC
        LIMIT 200`
      ),
    ]);
    res.json({
      returned_from_supplier: returnedRows[0] || [],
      waiting_delivery: deliveryRows[0] || [],
    });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    await ensureWarrantySchema(db);
    const [rows] = await db.query(
      `SELECT b.id, b.code, b.status AS db_status, b.note_text, b.sent_at, b.received_at, b.created_at,
              s.name AS supplier_name,
              COUNT(bi.id) AS item_count,
              SUM(CASE WHEN wi.current_status = 'sent_to_supplier' AND wi.current_location = 'supplier' THEN 1 ELSE 0 END) AS sent_count,
              SUM(CASE WHEN wi.current_status = 'supplier_returned' AND wi.current_location = 'company_warranty_stock' THEN 1 ELSE 0 END) AS received_count
         FROM supplier_warranty_batches b
         LEFT JOIN suppliers s ON s.id = b.supplier_id
         LEFT JOIN supplier_warranty_batch_items bi ON bi.batch_id = b.id
         LEFT JOIN order_warranty_items wi ON wi.id = bi.warranty_item_id
        GROUP BY b.id
        ORDER BY b.id DESC
        LIMIT 200`
    );
    res.json({
      items: rows.map((row) => {
        let status = row.db_status;
        if (row.db_status === 'sent' && Number(row.sent_count || 0) > 0 && Number(row.received_count || 0) > 0) status = 'partial_received';
        else if (row.db_status === 'sent' && Number(row.sent_count || 0) === 0 && Number(row.received_count || 0) > 0) status = 'received';
        return { ...row, status };
      }),
    });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await ensureWarrantySchema(conn);
    const supplierId = Number(req.body.supplier_id);
    const itemIds = Array.isArray(req.body.item_ids) ? req.body.item_ids.map(Number).filter(Boolean) : [];
    if (!supplierId) throw httpErr(400, 'Thiếu supplier_id');
    if (!itemIds.length) throw httpErr(400, 'Phải chọn ít nhất 1 sản phẩm');

    await conn.beginTransaction();
    const code = await genBatchCode(conn);
    const [itemRows] = await conn.query(
      `SELECT wi.id, wi.order_id, wi.product_id, wi.qty
         FROM order_warranty_items wi
         JOIN orders o ON o.id = wi.order_id AND o.service_kind = 'warranty' AND o.is_deleted = 0
         LEFT JOIN order_warranty_meta wm ON wm.order_id = wi.order_id
        WHERE wi.id IN (?) AND wi.is_deleted = 0
          AND wi.current_status = 'company_warranty_stock'
          AND wi.current_location = 'company_warranty_stock'
          AND (wi.handling_type = 'supplier_return' OR wm.warranty_mode = 'supplier_swap')
          AND NOT EXISTS (
            SELECT 1
              FROM supplier_warranty_batch_items bi
              JOIN supplier_warranty_batches b ON b.id = bi.batch_id
             WHERE bi.warranty_item_id = wi.id AND b.status IN ('draft','sent')
          )
        FOR UPDATE`,
      [itemIds]
    );
    if (itemRows.length !== itemIds.length) throw httpErr(409, 'Có sản phẩm không còn hợp lệ để gom đơn NCC');

    const [ins] = await conn.query(
      `INSERT INTO supplier_warranty_batches
         (code, supplier_id, note_text, created_by_staff_id)
       VALUES (?, ?, ?, ?)`,
      [code, supplierId, req.body.note_text ? String(req.body.note_text).trim().slice(0, 1000) : null, req.user?.sub || null]
    );
    const batchId = ins.insertId;

    for (const row of itemRows) {
      await conn.query(
        `INSERT INTO supplier_warranty_batch_items
           (batch_id, warranty_item_id, order_id, product_id, qty, note_text)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [batchId, row.id, row.order_id, row.product_id, row.qty, null]
      );
    }
    await conn.commit();
    res.status(201).json({ ok: true, id: batchId, code });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    await ensureWarrantySchema(db);
    const detail = await loadBatchDetail(db, Number(req.params.id));
    res.json(detail);
  } catch (err) { next(err); }
});

router.post('/:id/send', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await ensureWarrantySchema(conn);
    const id = Number(req.params.id);
    await conn.beginTransaction();
    const detail = await loadBatchDetail(conn, id);
    if (detail.status !== 'draft') throw httpErr(409, 'Chỉ đơn nháp mới có thể gửi NCC');
    const supplierId = Number(detail.supplier_id);
    const now = new Date();
    const orderIds = new Set();

    for (const item of detail.items) {
      await conn.query(
        `UPDATE order_warranty_items
            SET current_status = 'sent_to_supplier',
                current_location = 'supplier',
                supplier_id = ?,
                last_supplier_id = ?,
                last_move_at = NOW()
          WHERE id = ?`,
        [supplierId, supplierId, item.warranty_item_id]
      );
      await conn.query(
        `INSERT INTO order_warranty_moves
           (order_id, warranty_item_id, action_code, from_location, to_location, qty,
            product_id, supplier_id, note_text, occurred_at, created_by_staff_id)
         VALUES (?, ?, 'send_to_supplier', 'company_warranty_stock', 'supplier', ?, ?, ?, ?, ?, ?)`,
        [
          item.order_id,
          item.warranty_item_id,
          item.qty,
          item.product_id,
          supplierId,
          req.body.note_text ? String(req.body.note_text).trim().slice(0, 1000) : null,
          now,
          req.user?.sub || null,
        ]
      );
      orderIds.add(Number(item.order_id));
    }
    await conn.query(
      `UPDATE supplier_warranty_batches
          SET status = 'sent',
              sent_at = NOW(),
              updated_at = NOW()
        WHERE id = ?`,
      [id]
    );
    for (const orderId of orderIds) await syncWarrantyOrderState(conn, orderId);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

router.post('/:id/receive', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await ensureWarrantySchema(conn);
    const id = Number(req.params.id);
    await conn.beginTransaction();
    const detail = await loadBatchDetail(conn, id);
    if (!['sent', 'partial_received'].includes(detail.status)) throw httpErr(409, 'Chỉ đơn đã gửi mới có thể nhận về');
    const supplierId = Number(detail.supplier_id);
    const now = new Date();
    const orderIds = new Set();
    const pickedIds = Array.isArray(req.body.item_ids) ? req.body.item_ids.map(Number).filter(Boolean) : [];
    const targetItems = pickedIds.length
      ? detail.items.filter((item) => pickedIds.includes(Number(item.warranty_item_id)))
      : detail.items.filter((item) => item.current_status === 'sent_to_supplier' && item.current_location === 'supplier');

    if (!targetItems.length) throw httpErr(400, 'Không có sản phẩm hợp lệ để nhận về');

    for (const item of targetItems) {
      if (!(item.current_status === 'sent_to_supplier' && item.current_location === 'supplier')) {
        throw httpErr(409, 'Có sản phẩm không còn ở trạng thái đang gửi nhà cung cấp');
      }
      await conn.query(
        `UPDATE order_warranty_items
            SET current_status = 'supplier_returned',
                current_location = 'company_warranty_stock',
                supplier_id = ?,
                last_supplier_id = ?,
                last_move_at = NOW()
          WHERE id = ?`,
        [supplierId, supplierId, item.warranty_item_id]
      );
      await conn.query(
        `INSERT INTO order_warranty_moves
           (order_id, warranty_item_id, action_code, from_location, to_location, qty,
            product_id, supplier_id, note_text, occurred_at, created_by_staff_id)
         VALUES (?, ?, 'receive_from_supplier', 'supplier', 'company_warranty_stock', ?, ?, ?, ?, ?, ?)`,
        [
          item.order_id,
          item.warranty_item_id,
          item.qty,
          item.product_id,
          supplierId,
          req.body.note_text ? String(req.body.note_text).trim().slice(0, 1000) : null,
          now,
          req.user?.sub || null,
        ]
      );
      orderIds.add(Number(item.order_id));
    }
    const [[agg]] = await conn.query(
      `SELECT
          SUM(CASE WHEN wi.current_status = 'sent_to_supplier' AND wi.current_location = 'supplier' THEN 1 ELSE 0 END) AS sent_count,
          SUM(CASE WHEN wi.current_status = 'supplier_returned' AND wi.current_location = 'company_warranty_stock' THEN 1 ELSE 0 END) AS received_count
         FROM supplier_warranty_batch_items bi
         JOIN order_warranty_items wi ON wi.id = bi.warranty_item_id
        WHERE bi.batch_id = ?`,
      [id]
    );
    if (Number(agg.sent_count || 0) === 0 && Number(agg.received_count || 0) > 0) {
      await conn.query(
        `UPDATE supplier_warranty_batches
            SET status = 'received',
                received_at = COALESCE(received_at, NOW()),
                updated_at = NOW()
          WHERE id = ?`,
        [id]
      );
    } else {
      await conn.query(
        `UPDATE supplier_warranty_batches
            SET status = 'sent',
                updated_at = NOW()
          WHERE id = ?`,
        [id]
      );
    }
    for (const orderId of orderIds) await syncWarrantyOrderState(conn, orderId);
    await conn.commit();
    res.json({ ok: true, received_count: targetItems.length });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
