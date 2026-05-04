// /api/admin/price-tiers — quan ly cac muc gia dung chung (Ban le, Ban si, Dai ly...)
// Moi san pham se co 1 row product_prices cho moi tier ma admin nhap gia.
// Khach hang co default_tier_id de chon gia hien thi mac dinh.

const express = require('express');
const db = require('../../db');

const router = express.Router();

// Code: chu thuong, so, dau gach. Tu sinh tu name neu khong truyen.
function slugifyCode(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

// Chuan hoa name de so sanh trung lap (loai dau, lowercase, gop khoang trang).
function normalizeName(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---- GET /api/admin/price-tiers --------------------------------
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, code, name, sort_order, is_default
         FROM price_tiers
        WHERE is_deleted = 0
        ORDER BY sort_order, id`
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ---- POST /api/admin/price-tiers -------------------------------
// Body: { name, code?, sort_order? }
router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Thieu ten muc gia' });

    let code = String(req.body.code || '').trim() || slugifyCode(name);
    if (!code) code = 'tier-' + Date.now();
    const sort_order = Number(req.body.sort_order) || 0;

    // Check trung KE CA tier da soft-delete (de tranh user tao "Ban le" moi
    // khi tier 'retail' co san bi xoa nham). Match theo code HOAC normalized name.
    const normName = normalizeName(name);
    const [existing] = await db.query(
      `SELECT id, code, name, is_deleted FROM price_tiers
        WHERE code = ?
           OR LOWER(REPLACE(name, ' ', '')) = LOWER(REPLACE(?, ' ', ''))`,
      [code, name]
    );
    // Loc them theo normalized name (loai dau)
    const dup = existing.find(t =>
      t.code === code || normalizeName(t.name) === normName
    );
    if (dup) {
      // Neu tier deleted -> hoi suc lai thay vi tao moi
      if (dup.is_deleted) {
        await db.query(
          `UPDATE price_tiers SET is_deleted = 0, sort_order = ? WHERE id = ?`,
          [sort_order || dup.sort_order || 0, dup.id]
        );
        return res.status(200).json({ id: dup.id, code: dup.code, name: dup.name, restored: true });
      }
      return res.status(409).json({ error: `Mức giá "${dup.name}" đã tồn tại` });
    }

    const [r] = await db.query(
      `INSERT INTO price_tiers (code, name, sort_order) VALUES (?, ?, ?)`,
      [code, name, sort_order]
    );
    res.status(201).json({ id: r.insertId, code, name, sort_order });
  } catch (err) { next(err); }
});

// ---- PUT /api/admin/price-tiers/:id ----------------------------
// Body: { name?, code?, sort_order? }
router.put('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const sets = [];
    const args = [];

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ error: 'Ten muc gia khong duoc rong' });
      sets.push('name = ?'); args.push(name);
    }
    if (req.body.code !== undefined) {
      const code = String(req.body.code).trim() || slugifyCode(req.body.name || '');
      if (!code) return res.status(400).json({ error: 'Code khong hop le' });
      sets.push('code = ?'); args.push(code);
    }
    if (req.body.sort_order !== undefined) {
      sets.push('sort_order = ?'); args.push(Number(req.body.sort_order) || 0);
    }
    if (!sets.length) return res.json({ ok: true });

    args.push(id);
    const [r] = await db.query(
      `UPDATE price_tiers SET ${sets.join(', ')} WHERE id = ? AND is_deleted = 0`,
      args
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay muc gia' });
    res.json({ ok: true });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Code hoac ten da ton tai' });
    }
    next(err);
  }
});

// ---- PUT /api/admin/price-tiers/:id/set-default ----------------
// Dat tier nay lam mac dinh (cho khach public + fallback khi customer/dealer
// chua duoc gan tier rieng). Chi 1 tier mac dinh tai 1 thoi diem.
router.put('/:id/set-default', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT id, name FROM price_tiers WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Khong tim thay muc gia' });
    }

    await conn.query(`UPDATE price_tiers SET is_default = 0 WHERE is_default = 1`);
    await conn.query(`UPDATE price_tiers SET is_default = 1 WHERE id = ?`, [id]);
    await conn.commit();
    res.json({ ok: true, default_tier_id: Number(id), name: rows[0].name });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- DELETE /api/admin/price-tiers/:id (soft) ------------------
// Chan khi: (a) tier nay dang la mac dinh, hoac
//           (b) con san pham dung tier nay (product_prices), hoac
//           (c) con khach hang/dai ly duoc gan tier nay (customers.default_tier_id).
router.delete('/:id', async (req, res, next) => {
  try {
    const [tierRow] = await db.query(
      `SELECT id, name, is_default FROM price_tiers WHERE id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (!tierRow.length) return res.status(404).json({ error: 'Khong tim thay muc gia' });
    if (tierRow[0].is_default) {
      return res.status(409).json({
        error: `Không thể xoá mức "${tierRow[0].name}" — đây là mức giá Mặc định. Hãy đặt mức khác làm Mặc định trước.`,
      });
    }

    const [linkedProducts] = await db.query(
      `SELECT COUNT(*) AS c FROM product_prices WHERE tier_id = ?`,
      [req.params.id]
    );
    if (linkedProducts[0].c > 0) {
      return res.status(409).json({
        error: `Không thể xoá: còn ${linkedProducts[0].c} sản phẩm đang dùng mức giá này`,
      });
    }

    const [linkedCustomers] = await db.query(
      `SELECT COUNT(*) AS c FROM customers WHERE default_tier_id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (linkedCustomers[0].c > 0) {
      return res.status(409).json({
        error: `Không thể xoá: còn ${linkedCustomers[0].c} khách hàng/đại lý đang được gán mức này`,
      });
    }

    const [r] = await db.query(
      `UPDATE price_tiers SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Khong tim thay muc gia' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
