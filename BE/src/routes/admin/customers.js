// /api/admin/customers — CRUD khach hang (retail + dealer)
// Tat ca route deu yeu cau role admin (da check o admin.js cha)

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../../db');
const { requireRole } = require('../../middleware/auth');

const router = express.Router();
const adminOnly = requireRole('admin');

// Cac field tac dong toi tien/cong no -> chi admin moi duoc set qua POST/PUT.
// Staff van CRUD khach binh thuong, nhung khong duoc dong vao gia/han no.
const ADMIN_ONLY_FIELDS = [
  'debt_limit', 'credit_term_days', 'discount_rate', 'default_tier_id',
];
function stripAdminFields(body) {
  for (const k of ADMIN_ONLY_FIELDS) delete body[k];
}

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
  if (body.parent_id !== undefined)      set('parent_id', body.parent_id ? Number(body.parent_id) : null);

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
//   ?name con tim theo tai san (account_name/plate/sim) + khach con cua dai ly
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

    const where = ['c.is_deleted = 0'];
    const args = [];

    if (type && TYPES.includes(type)) {
      where.push('c.type = ?');
      args.push(type);
    }
    if (q) {
      where.push('(c.full_name LIKE ? OR c.code LIKE ? OR c.phone LIKE ? OR c.company_name LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like, like, like);
    }
    if (code)  { where.push('c.code LIKE ?'); args.push(`%${code}%`); }
    if (name) {
      const like = `%${name}%`;
      where.push(`(c.full_name LIKE ? OR c.company_name LIKE ?
        OR EXISTS (SELECT 1 FROM customer_accounts ca WHERE ca.customer_id = c.id AND ca.account_name LIKE ? AND ca.is_deleted = 0)
        OR EXISTS (SELECT 1 FROM customer_vehicles cv WHERE cv.customer_id = c.id AND cv.plate LIKE ? AND cv.is_deleted = 0)
        OR EXISTS (SELECT 1 FROM customer_sims cs WHERE cs.customer_id = c.id AND cs.sim_number LIKE ? AND cs.is_deleted = 0)
        OR EXISTS (
          SELECT 1 FROM customers child
          WHERE child.parent_id = c.id AND child.is_deleted = 0 AND (
            child.full_name LIKE ?
            OR EXISTS (SELECT 1 FROM customer_accounts WHERE customer_id = child.id AND account_name LIKE ? AND is_deleted = 0)
            OR EXISTS (SELECT 1 FROM customer_vehicles WHERE customer_id = child.id AND plate LIKE ? AND is_deleted = 0)
            OR EXISTS (SELECT 1 FROM customer_sims WHERE customer_id = child.id AND sim_number LIKE ? AND is_deleted = 0)
          )
        ))`);
      args.push(like, like, like, like, like, like, like, like, like);
    }
    if (phone) { where.push('c.phone LIKE ?'); args.push(`%${phone}%`); }
    if (email) { where.push('c.email LIKE ?'); args.push(`%${email}%`); }

    const whereSql = 'WHERE ' + where.join(' AND ');

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM customers c ${whereSql}`, args
    );
    const total = countRows[0].total;

    const [rows] = await db.query(
      `SELECT c.id, c.code, c.type, c.parent_id, c.full_name, c.phone, c.email, c.address,
              c.avatar_url, c.note, c.company_name, c.tax_code, c.contact_person,
              c.debt_limit, c.credit_term_days, c.discount_rate, c.created_at, c.updated_at,
              COALESCE(os.order_count, 0) AS order_count,
              COALESCE(os.total_revenue, 0) AS total_revenue
         FROM customers c
         LEFT JOIN (
           SELECT customer_id,
                  COUNT(*) AS order_count,
                  SUM(total_amount) AS total_revenue
           FROM orders
           WHERE is_deleted = 0 AND status != 'cancelled'
           GROUP BY customer_id
         ) os ON os.customer_id = c.id
         ${whereSql}
         ORDER BY c.id DESC
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

// Sinh ma KH/DL tuan tu padded (KH0001+, DL0001+)
// BX-04: thong nhat voi quick-register-customer (cung dung KH<NNNN>)
async function generateCustomerCode(type) {
  const prefix = type === 'dealer' ? 'DL' : 'KH';
  for (let attempt = 0; attempt < 10; attempt++) {
    const [maxRow] = await db.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(code, 3) AS UNSIGNED)), 0) AS max_n
         FROM customers WHERE code REGEXP ?`,
      [`^${prefix}[0-9]+$`]
    );
    const n = (Number(maxRow[0].max_n) || 0) + 1 + attempt;
    const code = prefix + String(n).padStart(4, '0');
    const [rows] = await db.query(
      `SELECT id FROM customers WHERE code = ? LIMIT 1`, [code]
    );
    if (!rows.length) return code;
  }
  throw httpErr(500, 'Khong sinh duoc ma khach hang');
}

// Chuan hoa SDT giong auth.js (bo space/.-) de check trung
function normPhone(s) {
  return String(s || '').replace(/\D/g, '');
}

// Check SDT trung (B-009): 1 SDT chi gan voi 1 customer chua bi xoa
async function ensurePhoneUnique(phone, excludeId = null) {
  if (!phone) return;
  const digits = normPhone(phone);
  if (!digits) return;
  const params = [digits];
  let sql = `SELECT id FROM customers
              WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '.', ''), '-', '') = ?
                AND is_deleted = 0`;
  if (excludeId) { sql += ' AND id <> ?'; params.push(excludeId); }
  const [rows] = await db.query(sql + ' LIMIT 1', params);
  if (rows.length) {
    throw httpErr(409, 'So dien thoai da duoc su dung boi khach hang khac');
  }
}

// ---- POST /api/admin/customers --------------------------------
router.post('/', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') stripAdminFields(req.body);
    const data = pickPayload(req.body, { isUpdate: false });

    if (!data.code) {
      data.code = await generateCustomerCode(data.type);
    }

    const [dup] = await db.query(
      `SELECT id FROM customers WHERE code = ? AND is_deleted = 0 LIMIT 1`,
      [data.code]
    );
    if (dup.length) return res.status(409).json({ error: 'Ma khach hang da ton tai' });

    await ensurePhoneUnique(data.phone);

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
    if (req.user.role !== 'admin') stripAdminFields(body);
    if (body.type === undefined) body.type = exist[0].type;

    const data = pickPayload(body, { isUpdate: true });

    if (data.code) {
      const [dup] = await db.query(
        `SELECT id FROM customers WHERE code = ? AND id <> ? AND is_deleted = 0 LIMIT 1`,
        [data.code, id]
      );
      if (dup.length) return res.status(409).json({ error: 'Ma khach hang da ton tai' });
    }
    if (data.phone !== undefined) {
      await ensurePhoneUnique(data.phone, id);
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
router.post('/:id/password', adminOnly, async (req, res, next) => {
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
router.delete('/:id', adminOnly, async (req, res, next) => {
  try {
    const [result] = await db.query(
      `UPDATE customers SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
      [req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Khong tim thay khach hang' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ---- GET /:id/end-customers — danh sach khach dau cuoi cua dai ly -----
// Tra ve cac khach retail da tung duoc gan vao don cua dai ly nay.
router.get('/:id/end-customers', async (req, res, next) => {
  try {
    const dealerId = Number(req.params.id);
    // Kiem tra la dealer
    const [chk] = await db.query(
      `SELECT id, type FROM customers WHERE id = ? AND is_deleted = 0`, [dealerId]
    );
    if (!chk.length) return res.status(404).json({ error: 'Khong tim thay khach hang' });
    if (chk[0].type !== 'dealer') return res.status(400).json({ error: 'Khach nay khong phai dai ly' });

    // Lay distinct khach dau cuoi + thong tin don gan nhat
    // gom khach duoc tao voi parent_id = dealerId HOAC khach co don hang (end_customer_id)
    const [rows] = await db.query(
      `SELECT
         ec.id, ec.code, ec.full_name, ec.phone, ec.address, ec.note,
         COUNT(o.id)             AS order_count,
         MAX(o.created_at)       AS last_order_at,
         MAX(o.completed_at)     AS last_completed_at
       FROM customers ec
       LEFT JOIN orders o ON o.end_customer_id = ec.id AND o.customer_id = ? AND o.is_deleted = 0
       WHERE ec.is_deleted = 0 AND (ec.parent_id = ? OR o.id IS NOT NULL)
       GROUP BY ec.id, ec.code, ec.full_name, ec.phone, ec.address, ec.note
       ORDER BY MAX(o.created_at) DESC, ec.id DESC`,
      [dealerId, dealerId]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

module.exports = router;

