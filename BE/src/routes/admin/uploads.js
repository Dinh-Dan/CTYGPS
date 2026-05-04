// /api/admin/uploads — nhan anh dang base64 dataURL, ghi xuong dia, tra ve URL
// Dung cho avatar khach hang, anh san pham...
//
// FE goi: POST /api/admin/uploads { dataUrl, folder?: 'avatars' }
// BE tra: { url: '/uploads/avatars/<filename>' }

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', '..', 'uploads');
const ALLOWED_FOLDERS = new Set(['avatars', 'products', 'tasks', 'receipts', 'videos', 'chat']);
const MIME_EXT = {
  // images
  'image/jpeg': 'jpg', 'image/jpg':  'jpg', 'image/png':  'png',
  'image/webp': 'webp', 'image/gif':  'gif',
  // videos
  'video/mp4':       'mp4', 'video/webm':      'webm', 'video/quicktime': 'mov',
  // documents
  'application/pdf':  'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'application/x-rar-compressed': 'rar',
  'application/vnd.rar': 'rar',
};
const MAX_BYTES = 50 * 1024 * 1024; // 50MB de cho phep video ngan

router.post('/', (req, res, next) => {
  try {
    const { dataUrl } = req.body || {};
    const folder = ALLOWED_FOLDERS.has(req.body.folder) ? req.body.folder : 'avatars';

    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'Thieu dataUrl' });
    }

    const m = dataUrl.match(/^data:([\w/+-]+);base64,(.+)$/);
    if (!m) return res.status(400).json({ error: 'dataUrl khong dung dinh dang base64' });

    const mime = m[1].toLowerCase();
    const ext = MIME_EXT[mime];
    if (!ext) return res.status(400).json({ error: 'Dinh dang khong ho tro (anh: jpg/png/webp/gif; video: mp4/webm/mov)' });

    const buf = Buffer.from(m[2], 'base64');
    if (buf.length === 0)        return res.status(400).json({ error: 'File rong' });
    if (buf.length > MAX_BYTES)  return res.status(413).json({ error: 'File qua 50MB' });

    const dir = path.join(UPLOAD_ROOT, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(dir, filename), buf);

    res.json({
      url: `/uploads/${folder}/${filename}`,
      name: req.body.name || null,
    });
  } catch (err) { next(err); }
});

module.exports = router;
