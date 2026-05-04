// /api/auth — dang nhap 3 kieu:
//   - login-customer: khach le, chi can phone
//   - login-dealer:   dai ly, can code + password
//   - login-staff:    nhan vien noi bo (admin / kithuat), username + password
// Tat ca tra ve { token, user } voi JWT chua role.

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const TOKEN_TTL = process.env.JWT_ACCESS_EXPIRES || '1d';

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// Chuan hoa SDT: bo dau cach, dau cham, dau gach...
function normPhone(s) {
  return String(s || '').replace(/\D/g, '');
}

// ===== Validators =====
// Tat ca cac validator tra ve { ok: true, value } hoac { ok: false, error }.
// Goi truoc khi ghi DB; HTTP 400 neu fail.

// SDT Viet Nam: 10 chu so, bat dau 03/05/07/08/09 (di dong sau cai cach 2018).
// Nhan ca dinh dang +84 / 84 va tu chuyen sang prefix 0.
function validatePhone(input) {
  const raw = String(input == null ? '' : input).trim();
  if (!raw) return { ok: false, error: 'Vui long nhap so dien thoai' };
  if (raw.length > 20) return { ok: false, error: 'So dien thoai qua dai' };
  let digits = raw.replace(/\D/g, '');
  // +84xxxxxxxxx (11 digits sau khi bo +) -> 0xxxxxxxxx
  if (digits.length === 11 && digits.startsWith('84')) digits = '0' + digits.slice(2);
  // 840xxxxxxxxx (du 84 va 0) -> 0xxxxxxxxx
  if (digits.length === 12 && digits.startsWith('840')) digits = '0' + digits.slice(3);
  if (!/^0[35789]\d{8}$/.test(digits)) {
    return { ok: false, error: 'So dien thoai khong hop le (10 chu so, bat dau 03/05/07/08/09)' };
  }
  return { ok: true, value: digits };
}

// Ho ten: 2-100 ky tu, khong chua < > " ' ` (chong XSS / inject).
function validateName(input) {
  const v = String(input == null ? '' : input).trim();
  if (!v) return { ok: false, error: 'Vui long nhap ho ten' };
  if (v.length < 2)  return { ok: false, error: 'Ho ten qua ngan (toi thieu 2 ky tu)' };
  if (v.length > 100) return { ok: false, error: 'Ho ten qua dai (toi da 100 ky tu)' };
  if (/[<>"'`]/.test(v)) return { ok: false, error: 'Ho ten chua ky tu khong hop le' };
  return { ok: true, value: v };
}

// Dia chi (optional): toi da 300 ky tu, khong chua < > (chong XSS).
function validateAddress(input) {
  if (input == null || input === '') return { ok: true, value: null };
  const v = String(input).trim();
  if (!v) return { ok: true, value: null };
  if (v.length > 300) return { ok: false, error: 'Dia chi qua dai (toi da 300 ky tu)' };
  if (/[<>]/.test(v))  return { ok: false, error: 'Dia chi chua ky tu khong hop le' };
  return { ok: true, value: v };
}

// ---- POST /api/auth/login-customer ----------------------------
// Body: { phone }
router.post('/login-customer', async (req, res, next) => {
  try {
    const body = req.body || {};
    const v = validatePhone(body.phone);
    if (!v.ok) return res.status(400).json({ error: v.error });
    const phone = v.value;

    const [rows] = await db.query(
      `SELECT id, code, type, full_name, phone, avatar_url
         FROM customers
        WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '.', ''), '-', '') = ?
          AND type = 'retail'
          AND is_deleted = 0
        LIMIT 1`,
      [phone]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'So dien thoai chua duoc dang ky' });
    }

    const c = rows[0];
    const token = signToken({ sub: c.id, role: 'customer', code: c.code });
    res.json({
      token,
      user: {
        id: c.id, code: c.code, role: 'customer',
        full_name: c.full_name, phone: c.phone, avatar_url: c.avatar_url,
      },
    });
  } catch (err) { next(err); }
});

// ---- POST /api/auth/quick-register-customer -------------------
// Body: { full_name, phone, address?, exclusive? }
// Tao khach le moi va tra ve token.
//   - exclusive=true  -> neu SDT da co tai khoan, tra 409 (yeu cau dang nhap).
//                        Dung cho luong "Dat don" o trang khach.
//   - exclusive=false -> neu SDT da co tai khoan, dang nhap lai luon.
//                        Dung cho widget chat khach guest.
router.post('/quick-register-customer', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const body = req.body || {};

    const vPhone = validatePhone(body.phone);
    if (!vPhone.ok) { conn.release(); return res.status(400).json({ error: vPhone.error }); }
    const phone = vPhone.value;

    const vName = validateName(body.full_name);
    if (!vName.ok) { conn.release(); return res.status(400).json({ error: vName.error }); }
    const fullName = vName.value;

    const vAddr = validateAddress(body.address);
    if (!vAddr.ok) { conn.release(); return res.status(400).json({ error: vAddr.error }); }
    const address = vAddr.value;

    const exclusive = body.exclusive === true || body.exclusive === 'true';

    await conn.beginTransaction();

    // Lock cac row retail trung SDT trong transaction de tranh race 2 request
    // dong thoi tao 2 customer trung SDT.
    const [exist] = await conn.query(
      `SELECT id, code, full_name, phone, avatar_url
         FROM customers
        WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '.', ''), '-', '') = ?
          AND type = 'retail'
          AND is_deleted = 0
        LIMIT 1
        FOR UPDATE`,
      [phone]
    );

    let c;
    if (exist.length) {
      if (exclusive) {
        await conn.rollback();
        return res.status(409).json({
          error: 'So dien thoai nay da co tai khoan. Vui long dang nhap.',
          code: 'PHONE_EXISTS',
        });
      }
      // Da co tai khoan -> dang nhap lai (KHONG ghi de full_name/address de tranh
      // khach guest moi vao co the doi thong tin cua nguoi truoc trung SDT).
      c = exist[0];
      await conn.commit();
    } else {
      // Tao moi: gen code KH<NNNN>. Retry voi attempt offset cho race ER_DUP_ENTRY tren code.
      let c2;
      let lastErr;
      for (let attempt = 0; attempt < 5; attempt++) {
        const [maxRow] = await conn.query(
          `SELECT COALESCE(MAX(CAST(SUBSTRING(code, 3) AS UNSIGNED)), 0) AS max_n
             FROM customers WHERE code REGEXP '^KH[0-9]+$'`
        );
        const n = (Number(maxRow[0].max_n) || 0) + 1 + attempt;
        const code = 'KH' + String(n).padStart(4, '0');
        try {
          const [r] = await conn.query(
            `INSERT INTO customers (code, type, full_name, phone, address)
             VALUES (?, 'retail', ?, ?, ?)`,
            [code, fullName, phone, address]
          );
          c2 = { id: r.insertId, code, full_name: fullName, phone, avatar_url: null };
          break;
        } catch (e) {
          if (e.code === 'ER_DUP_ENTRY') { lastErr = e; continue; }
          throw e;
        }
      }
      if (!c2) {
        await conn.rollback();
        throw lastErr || new Error('Khong sinh duoc ma khach');
      }
      await conn.commit();
      c = c2;
    }

    const token = signToken({ sub: c.id, role: 'customer', code: c.code });
    res.json({
      token,
      user: {
        id: c.id, code: c.code, role: 'customer',
        full_name: c.full_name, phone: c.phone, avatar_url: c.avatar_url,
      },
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// ---- POST /api/auth/login-dealer ------------------------------
// Body: { code, password }
router.post('/login-dealer', async (req, res, next) => {
  try {
    const code = String(req.body.code || '').trim();
    const password = String(req.body.password || '');
    if (!code || !password) {
      return res.status(400).json({ error: 'Thieu ma dai ly hoac mat khau' });
    }

    const [rows] = await db.query(
      `SELECT id, code, type, full_name, password_hash, avatar_url, company_name
         FROM customers
        WHERE code = ? AND type = 'dealer' AND is_deleted = 0
        LIMIT 1`,
      [code]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Sai ma dai ly hoac mat khau' });
    }
    const d = rows[0];

    if (!d.password_hash) {
      return res.status(401).json({ error: 'Tai khoan chua co mat khau, lien he admin' });
    }

    const ok = await bcrypt.compare(password, d.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Sai ma dai ly hoac mat khau' });
    }

    const token = signToken({ sub: d.id, role: 'daily', code: d.code });
    res.json({
      token,
      user: {
        id: d.id, code: d.code, role: 'daily',
        full_name: d.full_name, company_name: d.company_name, avatar_url: d.avatar_url,
      },
    });
  } catch (err) { next(err); }
});

// ---- POST /api/auth/login-staff -------------------------------
// Body: { username, password } -> role = 'admin' | 'kithuat'
router.post('/login-staff', async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    if (!username || !password) {
      return res.status(400).json({ error: 'Thieu tai khoan hoac mat khau' });
    }

    const [rows] = await db.query(
      `SELECT id, username, password_hash, full_name, role, avatar_url
         FROM staff
        WHERE username = ? AND is_deleted = 0
        LIMIT 1`,
      [username]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Sai tai khoan hoac mat khau' });
    }
    const s = rows[0];

    const ok = await bcrypt.compare(password, s.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Sai tai khoan hoac mat khau' });
    }

    const token = signToken({ sub: s.id, role: s.role, username: s.username });
    res.json({
      token,
      user: {
        id: s.id, username: s.username, role: s.role,
        full_name: s.full_name, avatar_url: s.avatar_url,
      },
    });
  } catch (err) { next(err); }
});

// ---- GET /api/auth/me -----------------------------------------
// Tra lai thong tin tu db dua tren token (de FE rehydrate sau reload)
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const { sub, role } = req.user;
    if (role === 'admin' || role === 'kithuat') {
      const [rows] = await db.query(
        `SELECT id, username, full_name, role, avatar_url, phone, email
           FROM staff WHERE id = ? AND is_deleted = 0`, [sub]
      );
      if (!rows.length) return res.status(401).json({ error: 'Tai khoan khong ton tai' });
      return res.json({ user: rows[0] });
    }
    // customer hoac daily
    const [rows] = await db.query(
      `SELECT id, code, type, full_name, phone, email, address, avatar_url,
              company_name, tax_code, contact_person,
              debt_limit, credit_term_days, discount_rate
         FROM customers WHERE id = ? AND is_deleted = 0`, [sub]
    );
    if (!rows.length) return res.status(401).json({ error: 'Tai khoan khong ton tai' });
    res.json({ user: { ...rows[0], role } });
  } catch (err) { next(err); }
});

// ---- POST /api/auth/logout ------------------------------------
// JWT stateless — FE chi can xoa token. Endpoint tra 200 cho dep.
router.post('/logout', (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
