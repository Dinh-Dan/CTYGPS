// Helper upload anh len imgbb.com.
// Cach dung:
//   const url = await imgbb.upload(file, { name: 'task-123' });
//   // -> 'https://i.ibb.co/xxxx/abc.jpg'
//
// Tra ve URL anh truc tiep tren CDN imgbb. Throw Error neu loi.
// File toi da 5MB (gioi han FE; imgbb free cho 32MB).

(function (global) {
  const API_KEY = '29952e4eac15179f4ae35c5cbe3d0e22';
  const ENDPOINT = 'https://api.imgbb.com/1/upload';
  const MAX_BYTES = 5 * 1024 * 1024;

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
    if (file.size > MAX_BYTES) throw new Error('Anh qua 5MB');
    opts = opts || {};

    const base64 = await fileToBase64(file);
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
