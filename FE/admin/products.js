// Trang Sản phẩm — CRUD products + categories + image upload (auto thumbnail)

(function () {
  const $   = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  const state = {
    q: '',
    category_id: '',
    page: 1, limit: 20, total: 0,
    categories: [],
  };

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  // ---- List ---------------------------------------------------
  async function load() {
    const p = new URLSearchParams();
    if (state.q)           p.set('q', state.q);
    if (state.category_id) p.set('category_id', state.category_id);
    p.set('page',  state.page);
    p.set('limit', state.limit);

    const res = await api.get('/admin/products?' + p.toString()).catch(() => null);
    if (!res) return;
    state.total = res.total;
    renderRows(res.items);

    const totalPage = Math.max(1, Math.ceil(res.total / state.limit));
    $('pageInfo').textContent = `Trang ${state.page} / ${totalPage} — ${res.total} sản phẩm`;
    $('prevPage').disabled = state.page <= 1;
    $('nextPage').disabled = state.page >= totalPage;
  }

  function thumbCell(p) {
    const url = p.thumbnail_url || p.image_url;
    if (url) return `<img src="${escape(url)}" class="product-thumb" alt="">`;
    const i = (p.code || p.name || '?').trim().charAt(0).toUpperCase();
    return `<div class="product-thumb-fallback">${i}</div>`;
  }

  function renderRows(items) {
    const tb = $('tbody');
    if (!items.length) {
      tb.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:24px">Chưa có sản phẩm. Bấm <b>+ Thêm sản phẩm</b> để bắt đầu.</td></tr>`;
      return;
    }
    tb.innerHTML = items.map(p => {
      const desc = (p.description || '').trim();
      const shortDesc = desc.length > 80 ? desc.slice(0, 80) + '…' : desc;
      return `
      <tr>
        <td>${thumbCell(p)}</td>
        <td>${escape(p.name)}</td>
        <td class="text-muted" style="font-size:13px" title="${escape(desc)}">${shortDesc ? escape(shortDesc) : '—'}</td>
        <td>${p.category_name ? `<span class="pill gray">${escape(p.category_name)}</span>` : '<span class="text-muted">—</span>'}</td>
        <td>${p.warranty_months ? p.warranty_months + ' tháng' : '<span class="text-muted">—</span>'}</td>
        <td class="text-muted">${fmt.format(p.cost_price || 0)}</td>
        <td>
          <a class="btn sm" href="/admin/product-edit.html?id=${p.id}" title="Mở trang sửa sản phẩm">📝 Sửa sản phẩm</a>
          <button class="btn ghost sm" data-act="del" data-id="${p.id}" style="color:#dc2626">Xoá</button>
        </td>
      </tr>`;
    }).join('');
  }

  // ---- Categories ---------------------------------------------
  async function loadCategories() {
    const r = await api.get('/admin/categories', { silent: true }).catch(() => null);
    if (!r) return;
    state.categories = r.items;
    // Filter top
    $('f_category').innerHTML = `<option value="">Tất cả</option>` +
      r.items.map(c => `<option value="${c.id}">${escape(c.name)}</option>`).join('');
    // Modal select
    $('f_category_id').innerHTML = `<option value="">— Chưa phân loại —</option>` +
      r.items.map(c => `<option value="${c.id}">${escape(c.name)}</option>`).join('');
  }

  function openCatModal() {
    $('cat_name').value = '';
    $('catModal').classList.add('open');
    setTimeout(() => $('cat_name').focus(), 50);
  }
  function closeCatModal() { $('catModal').classList.remove('open'); }

  async function handleCatSubmit(e) {
    e.preventDefault();
    const name = $('cat_name').value.trim();
    if (!name) return ui.toast('Thiếu tên danh mục', 'warning');

    const r = await api.post('/admin/categories', { name }, {
      successMessage: 'Đã tạo danh mục',
      errorMessages: { 409: 'Danh mục đã tồn tại' },
    }).catch(() => null);
    if (!r) return;
    closeCatModal();
    await loadCategories();
    $('f_category_id').value = r.id;
  }

  // ---- Image upload (auto-resize thumbnail) -------------------
  function fileToDataUrl(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(new Error('Không đọc được file'));
      r.readAsDataURL(file);
    });
  }

  // Resize anh ve max size (giu ti le) -> dataUrl
  function resizeDataUrl(dataUrl, maxSize, mime = 'image/jpeg', quality = 0.85) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const r = Math.min(1, maxSize / Math.max(width, height));
        width = Math.round(width * r);
        height = Math.round(height * r);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        res(canvas.toDataURL(mime, quality));
      };
      img.onerror = () => rej(new Error('Không decode được ảnh'));
      img.src = dataUrl;
    });
  }

  async function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      ui.toast('Ảnh quá 5MB', 'warning');
      e.target.value = '';
      return;
    }

    try {
      const orig = await fileToDataUrl(file);

      // Anh chinh: resize ve toi da 1200px (tiet kiem dung luong)
      const fullData = await resizeDataUrl(orig, 1200, 'image/jpeg', 0.88);
      // Thumbnail: 300px
      const thumbData = await resizeDataUrl(orig, 300, 'image/jpeg', 0.82);

      // Upload song song
      const [full, thumb] = await Promise.all([
        api.post('/admin/uploads', { dataUrl: fullData,  folder: 'products' }, { loading: true }),
        api.post('/admin/uploads', { dataUrl: thumbData, folder: 'products' }, { silent: true }),
      ]);

      $('f_image_url').value     = full.url;
      $('f_thumbnail_url').value = thumb.url;
      $('f_image_preview').src   = thumb.url;
      $('f_image_preview').classList.remove('hide');
      $('f_image_placeholder').classList.add('hide');
    } catch (err) {
      // api da hien toast roi
    }
  }

  function clearImage() {
    $('f_image_url').value     = '';
    $('f_thumbnail_url').value = '';
    $('f_image_file').value    = '';
    $('f_image_preview').src   = '';
    $('f_image_preview').classList.add('hide');
    $('f_image_placeholder').classList.remove('hide');
  }

  function setImage(imageUrl, thumbnailUrl) {
    $('f_image_url').value     = imageUrl || '';
    $('f_thumbnail_url').value = thumbnailUrl || '';
    const display = thumbnailUrl || imageUrl;
    if (display) {
      $('f_image_preview').src = display;
      $('f_image_preview').classList.remove('hide');
      $('f_image_placeholder').classList.add('hide');
    } else {
      clearImage();
    }
  }

  // ---- Dynamic rows: prices ----------------------------------
  function priceRowHtml(t) {
    const label = t ? escape(t.label) : '';
    const price = t ? (t.price || '') : '';
    return `
      <div class="dyn-row">
        <div class="field dyn-label">
          <label>Nhãn mức giá</label>
          <input type="text" class="input dyn-key" value="${label}" placeholder="VD: Bán lẻ">
        </div>
        <div class="field dyn-value">
          <label>Giá (VND)</label>
          <input type="number" class="input dyn-num" value="${price}" min="0" step="1000" placeholder="0">
        </div>
        <button type="button" class="btn-del" title="Xoá">✕</button>
      </div>`;
  }
  function renderPrices(prices) {
    const wrap = $('prices_rows');
    const list = (prices && prices.length) ? prices : [{ label: 'Bán lẻ', price: '' }];
    wrap.innerHTML = list.map(priceRowHtml).join('');
  }
  function collectPrices() {
    const rows = $('prices_rows').querySelectorAll('.dyn-row');
    const out = [];
    rows.forEach(r => {
      const label = r.querySelector('.dyn-key').value.trim();
      const price = r.querySelector('.dyn-num').value;
      if (label) out.push({ label, price: Number(price) || 0 });
    });
    return out;
  }

  // ---- Dynamic rows: attributes ------------------------------
  function attrRowHtml(t) {
    const label = t ? escape(t.label) : '';
    const value = t ? escape(t.value || '') : '';
    return `
      <div class="dyn-row">
        <div class="field dyn-label">
          <label>Nhãn</label>
          <input type="text" class="input dyn-key" value="${label}" placeholder="VD: Nguồn">
        </div>
        <div class="field dyn-value">
          <label>Giá trị</label>
          <input type="text" class="input dyn-val" value="${value}" placeholder="VD: DC 9-36V">
        </div>
        <button type="button" class="btn-del" title="Xoá">✕</button>
      </div>`;
  }
  function renderAttrs(attrs) {
    const wrap = $('attrs_rows');
    if (!attrs || !attrs.length) {
      wrap.innerHTML = '';
      return;
    }
    wrap.innerHTML = attrs.map(attrRowHtml).join('');
  }
  function collectAttrs() {
    const rows = $('attrs_rows').querySelectorAll('.dyn-row');
    const out = [];
    rows.forEach(r => {
      const label = r.querySelector('.dyn-key').value.trim();
      const value = r.querySelector('.dyn-val').value;
      if (label) out.push({ label, value: value || null });
    });
    return out;
  }

  // ---- Modal --------------------------------------------------
  function openModal(p) {
    $('modalTitle').textContent = p ? `Sửa sản phẩm ${p.code}` : 'Thêm sản phẩm';
    $('f_id').value          = p ? p.id : '';
    $('f_code').value        = p ? p.code : '';
    $('f_name').value        = p ? p.name : '';
    $('f_category_id').value = p && p.category_id ? p.category_id : '';
    $('f_warranty').value    = p ? (p.warranty_months || 0) : 12;
    $('f_cost_price').value  = p ? (p.cost_price || 0) : '';
    $('f_description').value = p ? (p.description || '') : '';

    setImage(p ? p.image_url : '', p ? p.thumbnail_url : '');
    renderPrices(p ? p.prices : null);
    renderAttrs(p ? p.attributes : null);

    // Khi sua, khoa code
    $('f_code').readOnly = !!p;

    $('modal').classList.add('open');
  }
  function closeModal() { $('modal').classList.remove('open'); }

  function readForm() {
    return {
      code:            $('f_code').value.trim(),
      name:            $('f_name').value.trim(),
      category_id:     $('f_category_id').value ? Number($('f_category_id').value) : null,
      image_url:       $('f_image_url').value || null,
      thumbnail_url:   $('f_thumbnail_url').value || null,
      warranty_months: Number($('f_warranty').value) || 0,
      cost_price:      Number($('f_cost_price').value) || 0,
      description:     $('f_description').value.trim() || null,
      prices:          collectPrices(),
      attributes:      collectAttrs(),
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const id = $('f_id').value;
    const data = readForm();

    if (!data.code || !data.name) return ui.toast('Thiếu mã hoặc tên', 'warning');
    // Gia + thuoc tinh + timeline co the bo sung sau o trang sua chi tiet

    $('btnSave').disabled = true;
    // Modal nay gio chi de TAO san pham. Sua chi tiet -> trang product-edit.
    const ok = await api.post('/admin/products', data, {
      successMessage: 'Đã tạo sản phẩm — chuyển sang trang sửa chi tiết',
      errorMessages: { 409: 'Mã thiết bị đã tồn tại' },
      loading: true,
    }).catch(() => null);
    $('btnSave').disabled = false;
    if (!ok || !ok.id) return;
    closeModal();
    // Mo trang sua de admin tiep tuc them timeline / thong so 2 nhom
    setTimeout(() => { location.href = '/admin/product-edit.html?id=' + ok.id; }, 300);
  }

  // ---- Click handlers ----------------------------------------
  // List chi co 2 hanh dong: link "Sua san pham" (a tag, browser tu xu ly)
  // va nut "Xoa" (data-act="del").
  async function handleTableClick(e) {
    const btn = e.target.closest('button[data-act="del"]');
    if (!btn) return;

    const yes = await ui.confirm({
      title: 'Xác nhận xoá',
      message: 'Ẩn sản phẩm khỏi danh sách? Lịch sử đơn/kho vẫn được giữ nguyên. Nếu còn cá thể tồn, bạn sẽ phải dọn dẹp ở trang Kho sau.',
      type: 'warning',
      okText: 'Xoá',
    });
    if (!yes) return;
    const ok = await api.delete('/admin/products/' + btn.dataset.id, {
      successMessage: 'Đã xoá sản phẩm',
    }).catch(() => null);
    if (ok) {
      if (ok.warning) ui.toast(ok.warning, 'warning');
      load();
    }
  }

  function handleDynRowsClick(e) {
    const btn = e.target.closest('.btn-del');
    if (!btn) return;
    btn.closest('.dyn-row').remove();
  }

  // ---- Init --------------------------------------------------
  function init() {
    adminShell.init('products');

    let searchTimer;
    $('search').addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.q = e.target.value.trim();
        state.page = 1;
        load();
      }, 300);
    });

    $('f_category').addEventListener('change', (e) => {
      state.category_id = e.target.value;
      state.page = 1;
      load();
    });

    $('prevPage').addEventListener('click', () => { state.page--; load(); });
    $('nextPage').addEventListener('click', () => { state.page++; load(); });

    $('btnAdd').addEventListener('click', () => openModal(null));
    $('modalClose').addEventListener('click', closeModal);
    $('btnCancel').addEventListener('click', closeModal);
    $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    $('frm').addEventListener('submit', handleSubmit);

    // Image
    $('f_image_file').addEventListener('change', handleImageChange);
    $('f_image_clear').addEventListener('click', clearImage);

    // Dynamic rows
    $('btnAddPrice').addEventListener('click', () => {
      $('prices_rows').insertAdjacentHTML('beforeend', priceRowHtml());
    });
    $('btnAddAttr').addEventListener('click', () => {
      $('attrs_rows').insertAdjacentHTML('beforeend', attrRowHtml());
    });
    $('prices_rows').addEventListener('click', handleDynRowsClick);
    $('attrs_rows').addEventListener('click', handleDynRowsClick);

    // Category modal
    $('btnAddCat').addEventListener('click', openCatModal);
    $('catClose').addEventListener('click', closeCatModal);
    $('catCancel').addEventListener('click', closeCatModal);
    $('catModal').addEventListener('click', (e) => { if (e.target.id === 'catModal') closeCatModal(); });
    $('catForm').addEventListener('submit', handleCatSubmit);

    $('tbody').addEventListener('click', handleTableClick);

    loadCategories().then(load);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
