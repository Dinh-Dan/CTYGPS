// /api/admin/customer-assets — quan ly tai khoan / bien so / sim cua khach
// + duyet de xuat thay doi tu KTV.
// Admin sua truc tiep, khong qua duyet.

const express = require('express');
const db = require('../../db');

const router = express.Router();

// ---- Cau hinh 3 loai asset --------------------------------
// kind  -> { table, valueCol }
const KIND_TABLE = {
  account: { table: 'customer_accounts', valueCol: 'account_name' },
  vehicle: { table: 'customer_vehicles', valueCol: 'plate' },
  sim:     { table: 'customer_sims',     valueCol: 'sim_number' },
};

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function vKind(kind) {
  if (!KIND_TABLE[kind]) throw httpErr(400, 'asset_kind khong hop le');
  return KIND_TABLE[kind];
}

function vValue(value) {
  const v = String(value == null ? '' : value).trim();
  if (!v) throw httpErr(400, 'Thieu gia tri');
  if (v.length > 255) throw httpErr(400, 'Gia tri qua dai (toi da 255)');
  if (/[<>]/.test(v)) throw httpErr(400, 'Gia tri chua ky tu khong hop le');
  return v;
}

// ============================================================
// LIST tat ca assets cua 1 khach
// GET /api/admin/customer-assets/:customerId
// ============================================================
router.get('/:customerId', async (req, res, next) => {
  try {
    const cid = Number(req.params.customerId);
    if (!cid) return res.status(400).json({ error: 'customerId khong hop le' });

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

    res.json({ accounts, vehicles, sims });
  } catch (err) { next(err); }
});

// ============================================================
// CRUD asset (admin truc tiep)
// POST   /:customerId/:kind          { value, note }
// PUT    /:customerId/:kind/:id      { value, note }
// DELETE /:customerId/:kind/:id
// ============================================================
router.post('/:customerId/:kind', async (req, res, next) => {
  try {
    const cid = Number(req.params.customerId);
    const cfg = vKind(req.params.kind);
    const value = vValue(req.body && req.body.value);
    const note  = req.body && req.body.note ? String(req.body.note).slice(0, 500) : null;

    const [r] = await db.query(
      `INSERT INTO ${cfg.table} (customer_id, ${cfg.valueCol}, note) VALUES (?, ?, ?)`,
      [cid, value, note]
    );
    res.status(201).json({ id: r.insertId, [cfg.valueCol]: value, note });
  } catch (err) { next(err); }
});

router.put('/:customerId/:kind/:id', async (req, res, next) => {
  try {
    const cid = Number(req.params.customerId);
    const cfg = vKind(req.params.kind);
    const id  = Number(req.params.id);
    const value = vValue(req.body && req.body.value);
    const note  = req.body && req.body.note !== undefined
      ? (req.body.note ? String(req.body.note).slice(0, 500) : null) : undefined;

    const sets = [`${cfg.valueCol} = ?`];
    const args = [value];
    if (note !== undefined) { sets.push('note = ?'); args.push(note); }
    args.push(id, cid);

    const [r] = await db.query(
      `UPDATE ${cfg.table} SET ${sets.join(', ')}
        WHERE id = ? AND customer_id = ? AND is_deleted = 0`, args
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/:customerId/:kind/:id', async (req, res, next) => {
  try {
    const cid = Number(req.params.customerId);
    const cfg = vKind(req.params.kind);
    const id  = Number(req.params.id);
    const [r] = await db.query(
      `UPDATE ${cfg.table} SET is_deleted = 1
        WHERE id = ? AND customer_id = ? AND is_deleted = 0`, [id, cid]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ============================================================
// REQUESTS — duyet de xuat tu KTV
// GET    /requests?status=pending&customer_id=&page=&limit=
// POST   /requests/:id/approve    { review_note? }
// POST   /requests/:id/reject     { review_note? }
// ============================================================
router.get('/requests/list', async (req, res, next) => {
  try {
    const status = req.query.status || 'pending';
    const cid    = req.query.customer_id ? Number(req.query.customer_id) : null;
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));
    const offset = (page - 1) * limit;

    const where = ['r.is_deleted = 0'];
    const args  = [];
    if (status && ['pending','approved','rejected'].includes(status)) {
      where.push('r.status = ?'); args.push(status);
    }
    if (cid) { where.push('r.customer_id = ?'); args.push(cid); }

    const whereSql = 'WHERE ' + where.join(' AND ');

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM customer_update_requests r ${whereSql}`, args
    );
    const total = countRows[0].total;

    const [rows] = await db.query(
      `SELECT r.*,
              c.code AS customer_code, c.full_name AS customer_name,
              s.full_name AS requested_by_name,
              o.code AS ref_order_code
         FROM customer_update_requests r
         JOIN customers c ON c.id = r.customer_id
         LEFT JOIN staff s ON s.id = r.requested_by_id AND r.requested_by_role = 'kithuat'
         LEFT JOIN orders o ON o.id = r.ref_order_id
         ${whereSql}
         ORDER BY r.id DESC
         LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    res.json({ items: rows, total, page, limit });
  } catch (err) { next(err); }
});

async function applyRequest(req) {
  const cfg = KIND_TABLE[req.asset_kind];
  if (!cfg) throw httpErr(500, 'asset_kind sai');
  if (req.action === 'add') {
    if (!req.value) throw httpErr(400, 'value rong, khong the apply');
    await db.query(
      `INSERT INTO ${cfg.table} (customer_id, ${cfg.valueCol}, note) VALUES (?, ?, ?)`,
      [req.customer_id, req.value, req.note || null]
    );
  } else if (req.action === 'update') {
    if (!req.target_id || !req.value) throw httpErr(400, 'thieu target_id/value');
    await db.query(
      `UPDATE ${cfg.table} SET ${cfg.valueCol} = ?
        WHERE id = ? AND customer_id = ? AND is_deleted = 0`,
      [req.value, req.target_id, req.customer_id]
    );
  } else if (req.action === 'delete') {
    if (!req.target_id) throw httpErr(400, 'thieu target_id');
    await db.query(
      `UPDATE ${cfg.table} SET is_deleted = 1
        WHERE id = ? AND customer_id = ? AND is_deleted = 0`,
      [req.target_id, req.customer_id]
    );
  }
}

router.post('/requests/:id/approve', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.query(
      `SELECT * FROM customer_update_requests WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay de xuat' });
    if (rows[0].status !== 'pending') {
      return res.status(409).json({ error: 'De xuat da duoc xu ly' });
    }

    await applyRequest(rows[0]);

    const note = req.body && req.body.review_note ? String(req.body.review_note).slice(0, 500) : null;
    await db.query(
      `UPDATE customer_update_requests
          SET status='approved', reviewed_by=?, reviewed_at=NOW(), review_note=?
        WHERE id=?`,
      [req.user.sub, note, id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/requests/:id/reject', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const note = req.body && req.body.review_note ? String(req.body.review_note).slice(0, 500) : null;
    const [r] = await db.query(
      `UPDATE customer_update_requests
          SET status='rejected', reviewed_by=?, reviewed_at=NOW(), review_note=?
        WHERE id=? AND status='pending' AND is_deleted=0`,
      [req.user.sub, note, id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay de xuat pending' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
