// /api/admin/suppliers — CRUD nha cung cap
// Tat ca route deu yeu cau role admin (da check o admin.js cha)

const express = require('express');
const db = require('../../db');

const router = express.Router();

// ---- GET /api/admin/suppliers/all -----------------------------
// List rut gon cho dropdown (id + name)
router.get('/all', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name FROM suppliers WHERE is_deleted = 0 ORDER BY name`
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/suppliers ---------------------------------
// Query: ?q, ?page, ?limit
router.get('/', async (req, res, next) => {
  try {
    const q     = (req.query.q || '').trim();
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const where = ['is_deleted = 0'];
    const args = [];
    if (q) {
      where.push('(name LIKE ? OR phone LIKE ? OR address LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like, like);
    }
    const whereSql = 'WHERE ' + where.join(' AND ');

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM suppliers ${whereSql}`, args
    );
    const [rows] = await db.query(
      `SELECT id, name, phone, address, note
         FROM suppliers ${whereSql}
         ORDER BY id DESC
         LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );
    res.json({ items: rows, total: countRows[0].total, page, limit });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/suppliers/:id -----------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM suppliers WHERE id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay NCC' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ---- POST /api/admin/suppliers --------------------------------
router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Thieu ten NCC' });

    const phone   = (req.body.phone   || '').trim() || null;
    const address = (req.body.address || '').trim() || null;
    const note    = (req.body.note    || '').trim() || null;

    const [result] = await db.query(
      `INSERT INTO suppliers (name, phone, address, note) VALUES (?, ?, ?, ?)`,
      [name, phone, address, note]
    );
    const [rows] = await db.query(`SELECT * FROM suppliers WHERE id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ---- PUT /api/admin/suppliers/:id -----------------------------
router.put('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const [exist] = await db.query(
      `SELECT id FROM suppliers WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!exist.length) return res.status(404).json({ error: 'Khong tim thay NCC' });

    const updates = {};
    if (req.body.name !== undefined) {
      const n = String(req.body.name || '').trim();
      if (!n) return res.status(400).json({ error: 'Thieu ten NCC' });
      updates.name = n;
    }
    if (req.body.phone !== undefined)   updates.phone   = (req.body.phone   || '').trim() || null;
    if (req.body.address !== undefined) updates.address = (req.body.address || '').trim() || null;
    if (req.body.note !== undefined)    updates.note    = (req.body.note    || '').trim() || null;

    const cols = Object.keys(updates);
    if (!cols.length) return res.status(400).json({ error: 'Khong co truong nao de cap nhat' });

    const setSql = cols.map(c => `${c} = ?`).join(', ');
    const values = cols.map(c => updates[c]);
    await db.query(`UPDATE suppliers SET ${setSql} WHERE id = ?`, [...values, id]);

    const [rows] = await db.query(`SELECT * FROM suppliers WHERE id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ---- DELETE /api/admin/suppliers/:id (soft delete) ------------
router.delete('/:id', async (req, res, next) => {
  try {
    // Check con phieu nhap chua voided lien ket?
    const [linked] = await db.query(
      `SELECT COUNT(*) AS c FROM stock_receipts
        WHERE supplier_id = ? AND is_voided = 0`,
      [req.params.id]
    );
    if (linked[0].c > 0) {
      return res.status(409).json({
        error: `Khong the xoa: con ${linked[0].c} phieu nhap/xuat gan voi NCC nay`,
      });
    }

    const [result] = await db.query(
      `UPDATE suppliers SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Khong tim thay NCC' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
