// /api/admin/categories — danh muc san pham (don gian: list + create + delete)
// Khong co update vi field duy nhat la name, user xoa & tao moi neu can.

const express = require('express');
const db = require('../../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name FROM categories WHERE is_deleted = 0 ORDER BY name`
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Thieu ten danh muc' });

    const [dup] = await db.query(
      `SELECT id FROM categories WHERE name = ? AND is_deleted = 0 LIMIT 1`,
      [name]
    );
    if (dup.length) return res.status(409).json({ error: 'Danh muc da ton tai' });

    const [r] = await db.query(`INSERT INTO categories (name) VALUES (?)`, [name]);
    res.status(201).json({ id: r.insertId, name });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [linked] = await db.query(
      `SELECT COUNT(*) AS c FROM products WHERE category_id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (linked[0].c > 0) {
      return res.status(409).json({
        error: `Khong the xoa: ${linked[0].c} san pham dang dung danh muc nay`,
      });
    }
    const [r] = await db.query(
      `UPDATE categories SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay danh muc' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
