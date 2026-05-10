// /api/admin/customers — CRUD khach hang (retail + dealer)
// Tat ca route deu yeu cau role admin (da check o admin.js cha)

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../../db');

const router = express.Router();

// ---- Helpers ---------------------------------------------------

const TYPES = ['retail', 'dealer'];

// Map body -> object cot db, chi nhan field hop le
function pickPayload(body, { isUpdate = false } = {}) {
  const out = {};
  const set = (key, val) => { out[key] = val === undefined ? null : val; };

  if (body.type !== undefined) {
    if (!TYPES.includes(body.type)) {
      throw httpErr(400, 'type phai la "retail" hoac "dealer"');
    }
    out.type = body.type;
  }
  if (body.code !== undefined && String(body.code).trim() !== '') {
    set('code', String(body.code).trim());
  }
  if (body.full_name !== undefined)      set('full_name', String(body.full_name).trim());
  if (body.phone !== undefined)          set('phone', body.phone || null);
  if (body.email !== undefined)          set('email', body.email || null);
  if (body.address !== undefined)        set('address', body.address || null);
  if (body.avatar_url !== undefined)     set('avatar_url', body.avatar_url || null);
  if (body.note !== undefined)           set('note', body.note || null);

  if (body.company_name !== undefined)   set('company_name', body.company_name || null);
  if (body.tax_code !== undefined)       set('tax_code', body.tax_code || null);
  if (body.contact_person !== undefined) set('contact_person', body.contact_person || null);

  if (body.debt_limit !== undefined)        out.debt_limit = Number(body.debt_limit) || 0;
  if (body.credit_term_days !== undefined)  out.credit_term_days = Number(body.credit_term_days) || 0;
  if (body.discount_rate !== undefined)     out.discount_rate = Number(body.discount_rate) || 0;

  if (body.default_tier_id !== undefined) {
    out.default_tier_id = body.default_tier_id ? Number(body.default_tier_id) : null;
  }

  if (!isUpdate) {
    if (!out.full_name) throw httpErr(400, 'Thieu full_name');
    if (!out.type)      out.type = 'retail';
  }

  // Voi retail thi reset truong dealer ve mac dinh
  if (out.type === 'retail') {
    out.company_name = null;
    out.tax_code = null;
    out.contact_person = null;
    out.debt_limit = 0;
    out.credit_term_days = 0;
    out.discount_rate = 0;
  }

  return out;
}

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// Loai password_hash khoi object tra ve cho FE
function strip(row) {
  if (!row) return row;
  const { password_hash, ...rest } = row;
  return { ...rest, has_password: !!password_hash };
}

// ---- GET /api/admin/customers ---------------------------------
// Query:
//   ?type=retail|dealer       loc theo loai
//   ?q=keyword                tim chung (search box top)
//   ?code, ?name, ?phone, ?email   loc rieng theo tung cot (filter row)
//   ?page=1, ?limit=20
router.get('/', async (req, res, next) => {
  try {
    const type  = req.query.type;
    const q     = (req.query.q || '').trim();
    const code  = (req.query.code  || '').trim();
    const name  = (req.query.name  || '').trim();
    const phone = (req.query.phone || '').trim();
    const email = (req.query.email || '').trim();
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const where = ['is_deleted = 0'];
    const args = [];

    if (type && TYPES.includes(type)) {
      where.push('type = ?');
      args.push(type);
    }
    if (q) {
      where.push('(full_name LIKE ? OR code LIKE ? OR phone LIKE ? OR company_name LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like, like, like);
    }
    if (code)  { where.push('code  LIKE ?'); args.push(`%${code}%`); }
    if (name)  { where.push('(full_name LIKE ? OR company_name LIKE ?)'); args.push(`%${name}%`, `%${name}%`); }
    if (phone) { where.push('phone LIKE ?'); args.push(`%${phone}%`); }
    if (email) { where.push('email LIKE ?'); args.push(`%${email}%`); }

    const whereSql = 'WHERE ' + where.join(' AND ');

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM customers ${whereSql}`, args
    );
    const total = countRows[0].total;

    const [rows] = await db.query(
      `SELECT id, code, type, full_name, phone, email, address, avatar_url, note,
              company_name, tax_code, contact_person, debt_limit, credit_term_days, discount_rate,
              created_at, updated_at
         FROM customers
         ${whereSql}
         ORDER BY id DESC
         LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    res.json({ items: rows, total, page, limit });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/customers/:id -----------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM customers WHERE id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay khach hang' });

    // Auto mark seen
    if (rows[0].seen_at == null) {
      db.query(`UPDATE customers SET seen_at = NOW() WHERE id = ? AND seen_at IS NULL`,
        [req.params.id]).catch(() => {});
    }

    res.json(strip(rows[0]));
  } catch (err) { next(err); }
});

// Sinh ma KH/DL ngau nhien khong trung
async function generateCustomerCode(type) {
  const prefix = type === 'dealer' ? 'DL' : 'KH';
  for (let i = 0; i < 20; i++) {
    const code = prefix + String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    const [rows] = await db.query(
      `SELECT id FROM customers WHERE code = ? LIMIT 1`, [code]
    );
    if (!rows.length) return code;
  }
  throw httpErr(500, 'Khong sinh duoc ma khach hang');
}

// ---- POST /api/admin/customers --------------------------------
router.post('/', async (req, res, next) => {
  try {
    const data = pickPayload(req.body, { isUpdate: false });

    if (!data.code) {
      data.code = await generateCustomerCode(data.type);
    }

    const [dup] = await db.query(
      `SELECT id FROM customers WHERE code = ? AND is_deleted = 0 LIMIT 1`,
      [data.code]
    );
    if (dup.length) return res.status(409).json({ error: 'Ma khach hang da ton tai' });

    const cols = Object.keys(data);
    const placeholders = cols.map(() => '?').join(', ');
    const values = cols.map(c => data[c]);

    const [result] = await db.query(
      `INSERT INTO customers (${cols.join(', ')}) VALUES (${placeholders})`,
      values
    );

    const [rows] = await db.query(`SELECT * FROM customers WHERE id = ?`, [result.insertId]);
    res.status(201).json(strip(rows[0]));
  } catch (err) { next(err); }
});

// ---- PUT /api/admin/customers/:id -----------------------------
router.put('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const [exist] = await db.query(
      `SELECT id, type FROM customers WHERE id = ? AND is_deleted = 0`, [id]
    );
    if (!exist.length) return res.status(404).json({ error: 'Khong tim thay khach hang' });

    // Neu khong gui type thi giu nguyen type cu (de pickPayload xu ly dung nhanh retail-reset)
    const body = { ...req.body };
    if (body.type === undefined) body.type = exist[0].type;

    const data = pickPayload(body, { isUpdate: true });

    if (data.code) {
      const [dup] = await db.query(
        `SELECT id FROM customers WHERE code = ? AND id <> ? AND is_deleted = 0 LIMIT 1`,
        [data.code, id]
      );
      if (dup.length) return res.status(409).json({ error: 'Ma khach hang da ton tai' });
    }

    const cols = Object.keys(data);
    if (!cols.length) return res.status(400).json({ error: 'Khong co truong nao de cap nhat' });

    const setSql = cols.map(c => `${c} = ?`).join(', ');
    const values = cols.map(c => data[c]);

    await db.query(`UPDATE customers SET ${setSql} WHERE id = ?`, [...values, id]);

    const [rows] = await db.query(`SELECT * FROM customers WHERE id = ?`, [id]);
    res.json(strip(rows[0]));
  } catch (err) { next(err); }
});

// ---- POST /api/admin/customers/:id/password -------------------
// Admin set / doi mat khau cho dealer.
// Body: { password }
router.post('/:id/password', async (req, res, next) => {
  try {
    const password = String(req.body.password || '');
    if (password.length < 4) {
      return res.status(400).json({ error: 'Mat khau phai it nhat 4 ky tu' });
    }

    const [rows] = await db.query(
      `SELECT id, type FROM customers WHERE id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Khong tim thay khach hang' });
    if (rows[0].type !== 'dealer') {
      return res.status(400).json({ error: 'Chi dai ly moi co mat khau' });
    }

    const hash = await bcrypt.hash(password, 10);
    await db.query(`UPDATE customers SET password_hash = ? WHERE id = ?`, [hash, req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ---- DELETE /api/admin/customers/:id (soft delete) ------------
router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.query(
      `UPDATE customers SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Khong tim thay khach hang' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
