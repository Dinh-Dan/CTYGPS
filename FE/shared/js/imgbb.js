// Helper upload anh len imgbb.com.
// Cach dung:
//   const url = await imgbb.upload(file, { name: 'task-123' });
//   // -> 'https://i.ibb.co/xxxx/abc.jpg'
//
// Tra ve URL anh truc tiep tren CDN imgbb. Throw Error neu loi.
// File toi da 32MB (theo imgbb free). Anh > 4MB se duoc resize/nen
// xuong canh max 2000px JPEG q=0.85 truoc khi upload de tiet kiem
// bandwidth — anh chup dt thuong 4-12MB nhung resize xong < 1MB.

(function (global) {
  const API_KEY = '29952e4eac15179f4ae35c5cbe3d0e22';
  const ENDPOINT = 'https://api.imgbb.com/1/upload';
  const MAX_BYTES = 32 * 1024 * 1024;
  const COMPRESS_OVER = 4 * 1024 * 1024;
  const MAX_EDGE = 2000;
  const JPEG_Q = 0.85;

  function shrinkImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const w0 = img.naturalWidth, h0 = img.naturalHeight;
        const scale = Math.min(1, MAX_EDGE / Math.max(w0, h0));
        const w = Math.round(w0 * scale), h = Math.round(h0 * scale);
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        cv.toBlob(b => b ? resolve(b) : reject(new Error('Khong nen duoc anh')),
          'image/jpeg', JPEG_Q);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Khong doc duoc anh')); };
      img.src = url;
    });
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload  = () => {
        const s = String(r.result);
        const i = s.indexOf(',');
        resolve(i >= 0 ? s.slice(i + 1) : s);
      };
      r.onerror = () => reject(new Error('Khong doc duoc file'));
      r.readAsDataURL(file);
    });
  }

  async function upload(file, opts) {
    if (!file) throw new Error('Thieu file');
    if (file.size > MAX_BYTES) throw new Error('Anh qua 32MB');
    opts = opts || {};

    let payload = file;
    if (file.size > COMPRESS_OVER && file.type && file.type.startsWith('image/')) {
      try { payload = await shrinkImage(file); } catch (_) { payload = file; }
    }

    const base64 = await fileToBase64(payload);
    const form = new FormData();
    form.append('key', API_KEY);
    form.append('image', base64);
    if (opts.name) form.append('name', opts.name);
    if (opts.expiration) form.append('expiration', String(opts.expiration));

    const res = await fetch(ENDPOINT, { method: 'POST', body: form });
    let data = null;
    try { data = await res.json(); } catch (_) {}

    if (!res.ok || !data || !data.success) {
      const msg = (data && data.error && data.error.message) || ('imgbb HTTP ' + res.status);
      throw new Error(msg);
    }
    return data.data.url;
  }

  global.imgbb = { upload };
})(window);
