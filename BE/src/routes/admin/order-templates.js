// /api/admin/order-templates — quan ly loai don (template) va cau hinh:
//   - Danh sach buoc trang thai (order_template_steps)
//   - Danh sach custom field (order_template_fields)
//
// Quy uoc:
//   - is_deleted = soft delete.
//   - Trang thai cung he thong 'pending' va 'cancelled' KHONG dinh nghia trong steps.
//     Khi admin duyet don pending -> chuyen sang code cua step seq nho nhat.
//   - update_roles luu JSON array vd: ["admin","ktv","customer"].

const express = require('express');
const db = require('../../db');

const router = express.Router();

const ALLOWED_ROLES = ['admin', 'ktv', 'customer'];
const ALLOWED_FIELD_TYPES = ['text', 'number', 'date', 'textarea'];
const RESERVED_STEP_CODES = ['pending', 'cancelled']; // cung he thong, khong duoc trung

function slugifyCode(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function normalizeRoles(input) {
  let arr = input;
  if (typeof arr === 'string') {
    try { arr = JSON.parse(arr); } catch (_) { arr = arr.split(','); }
  }
  if (!Array.isArray(arr)) arr = [];
  const cleaned = [...new Set(arr.map(r => String(r || '').trim().toLowerCase()))]
    .filter(r => ALLOWED_ROLES.includes(r));
  return cleaned;
}

// ============================================================
// TEMPLATES
// ============================================================

// ---- GET /api/admin/order-templates -------------------------
router.get('/', async (req, res, next) => {
  try {
    // Note: steps gio global (order_workflow_steps), khong gan template nua.
    const [rows] = await db.query(
      `SELECT t.id, t.name, t.description, t.is_public, t.sort_order,
              (SELECT COUNT(*) FROM order_template_fields f
                 WHERE f.template_id = t.id AND f.is_deleted = 0) AS field_count,
              (SELECT COUNT(*) FROM order_lines ol
                 WHERE ol.template_id = t.id AND ol.is_deleted = 0) AS line_count
         FROM order_templates t
        WHERE t.is_deleted = 0
        ORDER BY t.sort_order, t.id`
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// ---- GET /api/admin/order-templates/:id ---------------------
// Tra ve template + steps + fields (sort theo seq)
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [tRows] = await db.query(
      `SELECT id, name, description, is_public, sort_order
         FROM order_templates
        WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    if (!tRows.length) return res.status(404).json({ error: 'Khong tim thay loai don' });

    // Steps gio global — tra ve toan bo workflow steps non-system.
    const [steps] = await db.query(
      `SELECT id, seq, code, label, requires_photo, photo_min_count,
              update_roles, is_terminal
         FROM order_workflow_steps
        WHERE is_deleted = 0 AND is_system = 0
        ORDER BY seq, id`
    );
    const [fields] = await db.query(
      `SELECT id, seq, label, field_type, is_required, placeholder
         FROM order_template_fields
        WHERE template_id = ? AND is_deleted = 0
        ORDER BY seq, id`,
      [id]
    );

    res.json({ ...tRows[0], steps, fields });
  } catch (err) { next(err); }
});

// ---- Tu mig 053: 5 loai cong viec co dinh, khong cho admin tao/sua/xoa.
// Cac route POST/PUT/DELETE deu tra 410 Gone.
const _tplGone = (req, res) => res.status(410).json({
  error: 'Loai cong viec co dinh tu mig 053. Khong duoc tao/sua/xoa.'
});
router.post  ('/',     _tplGone);
router.put   ('/:id',  _tplGone);
router.delete('/:id',  _tplGone);

// ============================================================
// STEPS — GLOBAL tu mig 052, KHONG con gan template.
// 4 route duoi tra 410 Gone — FE nen dung /api/admin/workflow-steps.
// ============================================================
const _stepsGone = (req, res) => res.status(410).json({
  error: 'Workflow steps gio chung cho moi don, khong gan template. Dung /api/admin/workflow-steps.'
});
router.post  ('/:id/steps',           _stepsGone);
router.put   ('/:id/steps/:stepId',   _stepsGone);
router.delete('/:id/steps/:stepId',   _stepsGone);
router.put   ('/:id/steps/reorder',   _stepsGone);

async function ensureTemplateExists(id) {
  const [rows] = await db.query(
    `SELECT id FROM order_templates WHERE id = ? AND is_deleted = 0`,
    [id]
  );
  return rows.length > 0;
}

// ---- POST /api/admin/order-templates/:id/steps --------------
// (Bo handler steps cu — duoc thay bang _stepsGone phia tren.)

// ============================================================
// FIELDS
// ============================================================

// ---- Tu mig 053: fields cung — khong cho admin tao/sua/xoa.
const _fieldGone = (req, res) => res.status(410).json({
  error: 'Fields cua loai cong viec co dinh tu mig 053. Khong duoc tao/sua/xoa.'
});
router.post  ('/:id/fields',                 _fieldGone);
router.put   ('/:id/fields/:fieldId',        _fieldGone);
router.delete('/:id/fields/:fieldId',        _fieldGone);
router.put   ('/:id/fields/reorder',         _fieldGone);

module.exports = router;
