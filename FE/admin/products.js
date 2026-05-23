// Trang Sản phẩm — CRUD products + categories + image upload

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

  // ---- Danh sách sản phẩm -------------------------------------
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

  function priceCell(val) {
    if (val == null || val === '' || val === 0) return '<span class="text-muted">—</span>';
    return fmt.format(val);
  }

  function renderRows(items) {
    const tb = $('tbody');
    if (!items.length) {
      tb.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding:32px">Chưa có sản phẩm. Bấm <b>+ Thêm sản phẩm</b> để bắt đầu.</td></tr>`;
      return;
    }
    tb.innerHTML = items.map(p => {
      const desc = (p.description || '').trim();
      const shortDesc = desc.length > 90 ? desc.slice(0, 90) + '…' : desc;
      const nameCell = `
        <div style="font-weight:600;font-size:14px;color:#1e293b">${escape(p.name)}</div>
        <div style="font-size:11.5px;color:#94a3b8;margin-top:1px">${escape(p.code)}</div>
        ${shortDesc ? `<div style="font-size:12px;color:#64748b;margin-top:2px" title="${escape(desc)}">${escape(shortDesc)}</div>` : ''}`;
      return `
      <tr>
        <td data-label="Ảnh">${thumbCell(p)}</td>
        <td data-label="Sản phẩm">${nameCell}</td>
        <td data-label="Danh mục">${p.category_name ? `<span class="pill gray">${escape(p.category_name)}</span>` : '<span class="text-muted">—</span>'}</td>
        <td data-label="Bảo hành">${p.warranty_months ? p.warranty_months + ' tháng' : '<span class="text-muted">—</span>'}</td>
        <td data-label="Giá bán lẻ">${priceCell(p.price)}</td>
        <td data-label="Đại lý">${priceCell(p.price_dealer)}</td>
        <td data-label="Bán sỉ">${priceCell(p.price_wholesale)}</td>
        <td data-label="Hành động">
          <a class="btn sm" href="/admin/product-edit.html?id=${p.id}">📝 Sửa</a>
          <button class="btn ghost sm" data-act="del" data-id="${p.id}" style="color:#dc2626">Xoá</button>
        </td>
      </tr>`;
    }).join('');
  }

  // ---- Categories (dropdown) ----------------------------------
  async function loadCategories() {
    const r = await api.get('/admin/categories', { silent: true }).catch(() => null);
    if (!r) return;
    state.categories = r.items;
    // Filter trên toolbar
    $('f_category').innerHTML = `<option value="">Tất cả danh mục</option>` +
      r.items.map(c => `<option value="${c.id}">${escape(c.name)}</option>`).join('');
    // Dropdown trong modal thêm SP
    const cur = $('f_category_id').value;
    $('f_category_id').innerHTML = `<option value="">— Chưa phân loại —</option>` +
      r.items.map(c => `<option value="${c.id}">${escape(c.name)}</option>`).join('');
    if (cur) $('f_category_id').value = cur;
  }

  // ---- Modal quản lý danh mục (CRUD đầy đủ) -------------------
  let catManageOpen = false;

  async function openCatManage() {
    catManageOpen = true;
    $('catManageModal').classList.add('open');
    await renderCatList();
    setTimeout(() => $('cat_name_new').focus(), 60);
  }

  function closeCatManage() {
    catManageOpen = false;
    $('catManageModal').classList.remove('open');
    loadCategories();
  }

  async function renderCatList() {
    const r = await api.get('/admin/categories', { silent: true }).catch(() => null);
    const list = $('catList');
    if (!r || !r.items.length) {
      list.innerHTML = `<div class="cat-empty">Chưa có danh mục nào. Thêm danh mục đầu tiên bên trên.</div>`;
      return;
    }
    list.innerHTML = r.items.map(c => catItemHtml(c)).join('');
  }

  function catItemHtml(c) {
    const count = c.product_count || 0;
    return `
      <div class="cat-item" data-cat-id="${c.id}">
        <span class="cat-item-name">${escape(c.name)}</span>
        <span class="cat-item-count">${count} sản phẩm</span>
        <div class="cat-item-actions">
          <button class="btn ghost sm" data-cat-act="rename" data-id="${c.id}" data-name="${escape(c.name)}">Sửa</button>
          <button class="btn ghost sm" data-cat-act="delete" data-id="${c.id}" style="color:#dc2626" ${count > 0 ? 'disabled title="Có sản phẩm đang dùng danh mục này"' : ''}>Xoá</button>
        </div>
      </div>`;
  }

  function startRenameInline(id, currentName) {
    const row = $('catList').querySelector(`[data-cat-id="${id}"]`);
    if (!row) return;
    row.classList.add('editing');
    row.innerHTML = `
      <input type="text" class="cat-edit-input" value="${escape(currentName)}" style="flex:1">
      <div class="cat-item-actions">
        <button class="btn sm" data-cat-act="save-rename" data-id="${id}">Lưu</button>
        <button class="btn ghost sm" data-cat-act="cancel-rename" data-id="${id}">Hủy</button>
      </div>`;
    row.querySelector('.cat-edit-input').focus();
  }

  async function saveRename(id) {
    const row = $('catList').querySelector(`[data-cat-id="${id}"]`);
    if (!row) return;
    const name = row.querySelector('.cat-edit-input').value.trim();
    if (!name) return ui.toast('Tên danh mục không được để trống', 'warning');

    const ok = await api.put(`/admin/categories/${id}`, { name }, {
      successMessage: 'Đã đổi tên danh mục',
      errorMessages: { 409: 'Tên danh mục đã tồn tại' },
    }).catch(() => null);
    if (!ok) return;
    await renderCatList();
  }

  async function deleteCat(id) {
    const yes = await ui.confirm({
      title: 'Xoá danh mục',
      message: 'Xoá danh mục này? Hành động không thể hoàn tác.',
      type: 'warning', okText: 'Xoá',
    });
    if (!yes) return;
    const ok = await api.delete(`/admin/categories/${id}`, {
      successMessage: 'Đã xoá danh mục',
      errorMessages: { 409: 'Danh mục đang có sản phẩm, không thể xoá' },
    }).catch(() => null);
    if (ok) await renderCatList();
  }

  async function handleCatAddSubmit(e) {
    e.preventDefault();
    const name = $('cat_name_new').value.trim();
    if (!name) return ui.toast('Nhập tên danh mục', 'warning');

    const r = await api.post('/admin/categories', { name }, {
      successMessage: 'Đã thêm danh mục',
      errorMessages: { 409: 'Danh mục đã tồn tại' },
    }).catch(() => null);
    if (!r) return;
    $('cat_name_new').value = '';
    await renderCatList();
    // Chọn luôn danh mục vừa tạo trong modal SP nếu đang mở
    await loadCategories();
    if ($('modal').classList.contains('open')) {
      $('f_category_id').value = r.id;
    }
  }

  function handleCatListClick(e) {
    const btn = e.target.closest('button[data-cat-act]');
    if (!btn) return;
    const act = btn.dataset.catAct;
    const id  = btn.dataset.id;
    if (act === 'rename')       startRenameInline(id, btn.dataset.name);
    if (act === 'save-rename')  saveRename(id);
    if (act === 'cancel-rename') renderCatList();
    if (act === 'delete')       deleteCat(id);
  }

  // ---- Upload ảnh ---------------------------------------------
  function fileToDataUrl(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(new Error('Không đọc được file'));
      r.readAsDataURL(file);
    });
  }

  function resizeDataUrl(dataUrl, maxSize, mime = 'image/jpeg', quality = 0.85) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const r = Math.min(1, maxSize / Math.max(width, height));
        width = Math.round(width * r);
        height = Math.round(height * r);
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
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
      const orig      = await fileToDataUrl(file);
      const fullData  = await resizeDataUrl(orig, 1200, 'image/jpeg', 0.88);
      const thumbData = await resizeDataUrl(orig, 300,  'image/jpeg', 0.82);

      const [full, thumb] = await Promise.all([
        api.post('/admin/uploads', { dataUrl: fullData,  folder: 'products' }, { loading: true }),
        api.post('/admin/uploads', { dataUrl: thumbData, folder: 'products' }, { silent: true }),
      ]);

      $('f_image_url').value     = full.url;
      $('f_thumbnail_url').value = thumb.url;
      setImagePreview(thumb.url);
    } catch (_) {}
  }

  function setImagePreview(url) {
    const zone = $('uploadZone');
    if (url) {
      $('f_image_preview').src = url;
      $('f_image_preview').style.display = '';
      $('f_image_placeholder').style.display = 'none';
      zone.classList.add('has-image');
    } else {
      $('f_image_preview').src = '';
      $('f_image_preview').style.display = 'none';
      $('f_image_placeholder').style.display = '';
      zone.classList.remove('has-image');
    }
  }

  function clearImage() {
    $('f_image_url').value     = '';
    $('f_thumbnail_url').value = '';
    $('f_image_file').value    = '';
    setImagePreview('');
  }

  function setImage(imageUrl, thumbnailUrl) {
    $('f_image_url').value     = imageUrl || '';
    $('f_thumbnail_url').value = thumbnailUrl || '';
    setImagePreview(thumbnailUrl || imageUrl || '');
  }

  // ---- Dynamic rows: attributes --------------------------------
  function attrRowHtml(t) {
    const label = t ? escape(t.label) : '';
    const value = t ? escape(t.value || '') : '';
    return `
      <div class="dyn-row">
        <div class="field dyn-label">
          <label style="font-size:12px">Nhãn</label>
          <input type="text" class="input dyn-key" value="${label}" placeholder="VD: Nguồn">
        </div>
        <div class="field dyn-value">
          <label style="font-size:12px">Giá trị</label>
          <input type="text" class="input dyn-val" value="${value}" placeholder="VD: DC 9-36V">
        </div>
        <button type="button" class="btn-del" title="Xoá">✕</button>
      </div>`;
  }

  function renderAttrs(attrs) {
    const wrap = $('attrs_rows');
    if (!attrs || !attrs.length) { wrap.innerHTML = ''; return; }
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

  // ---- Modal thêm sản phẩm ------------------------------------
  function openModal(p) {
    $('modalTitle').textContent = p ? `Sửa sản phẩm ${p.code}` : 'Thêm sản phẩm';
    $('f_id').value          = p ? p.id : '';
    $('f_code').value        = p ? p.code : '';
    $('f_name').value        = p ? p.name : '';
    $('f_category_id').value = p && p.category_id ? p.category_id : '';
    $('f_warranty').value    = p ? (p.warranty_months || 0) : 12;
    $('f_cost_price').value  = p ? (p.cost_price || '') : '';
    $('f_description').value = p ? (p.description || '') : '';
    $('f_code').readOnly     = !!p;
    setImage(p ? p.image_url : '', p ? p.thumbnail_url : '');
    renderAttrs(p ? p.attributes : null);
    $('modal').classList.add('open');
  }

  function closeModal() { $('modal').classList.remove('open'); }

  async function handleSubmit(e) {
    e.preventDefault();
    const data = {
      code:            $('f_code').value.trim(),
      name:            $('f_name').value.trim(),
      category_id:     $('f_category_id').value ? Number($('f_category_id').value) : null,
      image_url:       $('f_image_url').value || null,
      thumbnail_url:   $('f_thumbnail_url').value || null,
      warranty_months: Number($('f_warranty').value) || 0,
      cost_price:      Money.get($('f_cost_price')) || null,
      description:     $('f_description').value.trim() || null,
      attributes:      collectAttrs(),
    };

    if (!data.code || !data.name) return ui.toast('Thiếu mã hoặc tên sản phẩm', 'warning');

    $('btnSave').disabled = true;
    const ok = await api.post('/admin/products', data, {
      successMessage: 'Đã tạo sản phẩm — chuyển sang trang sửa chi tiết',
      errorMessages: { 409: 'Mã thiết bị đã tồn tại' },
      loading: true,
    }).catch(() => null);
    $('btnSave').disabled = false;
    if (!ok || !ok.id) return;
    closeModal();
    setTimeout(() => { location.href = '/admin/product-edit.html?id=' + ok.id; }, 300);
  }

  // ---- Xoá sản phẩm -------------------------------------------
  async function handleTableClick(e) {
    const btn = e.target.closest('button[data-act="del"]');
    if (!btn) return;
    const yes = await ui.confirm({
      title: 'Xác nhận xoá',
      message: 'Ẩn sản phẩm khỏi danh sách? Lịch sử đơn/kho vẫn được giữ nguyên.',
      type: 'warning', okText: 'Xoá',
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

  // ---- Init ---------------------------------------------------
  function init() {
    adminShell.init('products');

    // Tìm kiếm
    let searchTimer;
    $('search').addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { state.q = e.target.value.trim(); state.page = 1; load(); }, 300);
    });
    $('f_category').addEventListener('change', (e) => { state.category_id = e.target.value; state.page = 1; load(); });
    $('prevPage').addEventListener('click', () => { state.page--; load(); });
    $('nextPage').addEventListener('click', () => { state.page++; load(); });

    // Modal sản phẩm
    $('btnAdd').addEventListener('click', () => openModal(null));
    $('modalClose').addEventListener('click', closeModal);
    $('btnCancel').addEventListener('click', closeModal);
    $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    $('frm').addEventListener('submit', handleSubmit);

    // Upload ảnh — click trên zone (trừ nút xóa) mở file dialog
    $('f_image_file').addEventListener('change', handleImageChange);
    $('f_image_clear').addEventListener('click', (e) => { e.stopPropagation(); clearImage(); });

    // Attrs
    $('btnAddAttr').addEventListener('click', () => {
      $('attrs_rows').insertAdjacentHTML('beforeend', attrRowHtml());
    });
    $('attrs_rows').addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-del');
      if (btn) btn.closest('.dyn-row').remove();
    });

    // Nút mở quản lý danh mục (từ toolbar và từ trong modal SP)
    $('btnManageCat').addEventListener('click', openCatManage);
    $('btnAddCat').addEventListener('click', openCatManage);

    // Modal quản lý danh mục
    $('catManageClose').addEventListener('click', closeCatManage);
    $('catManageDone').addEventListener('click', closeCatManage);
    $('catManageModal').addEventListener('click', (e) => { if (e.target.id === 'catManageModal') closeCatManage(); });
    $('catAddForm').addEventListener('submit', handleCatAddSubmit);
    $('catList').addEventListener('click', handleCatListClick);

    $('tbody').addEventListener('click', handleTableClick);

    loadCategories().then(load);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
