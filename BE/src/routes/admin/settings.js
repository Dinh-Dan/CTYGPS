// /api/admin/settings — quan ly app_settings (key-value)
// Tat ca route deu yeu cau role admin (da check o admin.js cha)
//
// Hien tai dung cho:
//   qr.slot{1..5}.image_url   — URL anh QR (imgbb)
//   qr.slot{1..5}.label        — nhan slot
//   bank.account_no            — so tai khoan
//   bank.account_name          — chu tai khoan
//   bank.bank_name             — ten ngan hang
//   bank.default_qr_slot       — '1'..'5' (slot mac dinh dung khi tao bill)
//
// Endpoints:
//   GET  /          -> doc tat ca settings (group theo prefix)
//   PUT  /          -> upsert 1 row { key, value }
//   PUT  /bulk      -> upsert nhieu { items: [{key, value}, ...] }

const express = require('express');
const db = require('../../db');
const { requireRole } = require('../../middleware/auth');

const router = express.Router();
const adminOnly = requireRole('admin');

// Cac prefix duoc phep ghi (chong client gui key bay)
const ALLOWED_PREFIXES = ['qr.', 'bank.', 'assets.'];

function isAllowedKey(k) {
  if (!k || typeof k !== 'string' || k.length > 60) return false;
  return ALLOWED_PREFIXES.some(p => k.startsWith(p));
}

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT \`key\`, \`value\` FROM app_settings`);
    const flat = {};
    for (const r of rows) flat[r.key] = r.value || '';
    res.json(flat);
  } catch (err) { next(err); }
});

router.put('/', adminOnly, async (req, res, next) => {
  try {
    const key = String(req.body.key || '').trim();
    const value = req.body.value == null ? '' : String(req.body.value);
    if (!isAllowedKey(key)) {
      return res.status(400).json({ error: `Key khong hop le hoac khong duoc phep: ${key}` });
    }
    await db.query(
      `INSERT INTO app_settings (\`key\`, \`value\`, changed_by)
            VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), changed_by = VALUES(changed_by)`,
      [key, value, req.user.sub]
    );
    res.json({ key, value });
  } catch (err) { next(err); }
});

router.put('/bulk', adminOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ error: 'items rong' });
    for (const it of items) {
      if (!isAllowedKey(it.key)) {
        return res.status(400).json({ error: `Key khong hop le: ${it.key}` });
      }
    }
    await conn.beginTransaction();
    for (const it of items) {
      const v = it.value == null ? '' : String(it.value);
      await conn.query(
        `INSERT INTO app_settings (\`key\`, \`value\`, changed_by)
              VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), changed_by = VALUES(changed_by)`,
        [String(it.key), v, req.user.sub]
      );
    }
    await conn.commit();
    res.json({ ok: true, count: items.length });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally { conn.release(); }
});

module.exports = router;
