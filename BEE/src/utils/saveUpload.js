// Helper upload file: nhan dataUrl base64 -> ghi xuong dia -> tra ve URL.
// Dung chung cho cac route admin / customer / daily upload anh + tai lieu.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', 'uploads');

const MIME_EXT = {
  // images
  'image/jpeg': 'jpg', 'image/jpg':  'jpg', 'image/png':  'png',
  'image/webp': 'webp', 'image/gif':  'gif',
  // videos
  'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
  // documents
  'application/pdf': 'pdf',
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

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// Throw HTTP error neu sai input. Tra ve filepath URL khi thanh cong.
function saveDataUrl(dataUrl, folder, { maxBytes = 50 * 1024 * 1024 } = {}) {
  if (!dataUrl || typeof dataUrl !== 'string') throw httpErr(400, 'Thieu dataUrl');
  const m = dataUrl.match(/^data:([\w/+-]+);base64,(.+)$/);
  if (!m) throw httpErr(400, 'dataUrl khong dung dinh dang base64');

  const mime = m[1].toLowerCase();
  const ext = MIME_EXT[mime];
  if (!ext) throw httpErr(400, 'Dinh dang file khong ho tro');

  const buf = Buffer.from(m[2], 'base64');
  if (buf.length === 0)       throw httpErr(400, 'File rong');
  if (buf.length > maxBytes)  throw httpErr(413, `File qua ${Math.round(maxBytes / 1024 / 1024)}MB`);

  const dir = path.join(UPLOAD_ROOT, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(dir, filename), buf);

  return `/uploads/${folder}/${filename}`;
}

module.exports = { saveDataUrl, MIME_EXT };
