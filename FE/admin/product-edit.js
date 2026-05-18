// Trang chi tiet 1 san pham — editor timeline + thong so 2 nhom + bang gia.

(function () {
  const $ = (id) => document.getElementById(id);
  const productId = parseInt(new URLSearchParams(location.search).get('id')) || 0;

  if (!productId) {
    location.href = '/admin/products.html';
    return;
  }

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  // ---- Image helper -------------------------------------------
  // Toggle class .is-empty tren khung anh -> CSS quyet dinh hien anh hay placeholder.
  // Khong dung CSS attribute selector vi mot so browser khong cap nhat ngay khi JS doi src.
  function setImage(url) {
    const img   = $('pImagePreview');
    const frame = $('pImageFrame');
    if (url) {
      img.src = url;
      frame.classList.remove('is-empty');
    } else {
      img.removeAttribute('src');
      frame.classList.add('is-empty');
    }
  }

  // ---- File -> data URL --------------------------------------
  function fileToDataUrl(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result);
      r.onerror = () => rej(new Error('Không đọc được file'));
      r.readAsDataURL(file);
    });
  }
  async function uploadAsset(file, folder) {
    const dataUrl = await fileToDataUrl(file);
    const res = await api.post('/admin/uploads', { dataUrl, folder }, {
      loading: true,
      errorMessages: { 413: 'File quá lớn, tối đa 50MB' },
    }).catch(() => null);
    return res ? res.url : null;
  }

  // ============================================================
  // PRICES (theo tier_id dung chung)
  // ============================================================
  let priceTiers = [];   // [{id, code, name, sort_order}]

  function tierOptions(selectedId) {
    return priceTiers.map(t =>
      `<option value="${t.id}" ${Number(t.id) === Number(selectedId) ? 'selected' : ''}>${escape(t.name)}</option>`
    ).join('');
  }

  // Format so 1234567 -> "1.234.567" (vi-VN)
  const priceFmt = new Intl.NumberFormat('vi-VN');
  function formatPrice(n) {
    const v = Number(n) || 0;
    return v ? priceFmt.format(v) : '';
  }
  function parsePrice(s) {
    return Number(String(s || '').replace(/\D/g, '')) || 0;
  }

  function pricesRender(items) {
    $('pricesRows').innerHTML = items.map(it => priceRowHTML(it)).join('');
  }
  function priceRowHTML(it = {}) {
    return `
      <div class="price-row" data-price-row>
        <div class="price-tier">
          <select data-price-tier>
            <option value="">— Chọn —</option>
            ${tierOptions(it.tier_id)}
          </select>
        </div>
        <div class="price-amount">
          <input type="text" inputmode="numeric" data-price-value
                 placeholder="0" value="${formatPrice(it.price)}">
          <span class="price-suffix">₫</span>
        </div>
        <button type="button" class="btn-del" data-price-del title="Xoá mức giá này">×</button>
      </div>`;
  }
  function pricesCollect() {
    return Array.from(document.querySelectorAll('[data-price-row]')).map(r => ({
      tier_id: Number(r.querySelector('[data-price-tier]').value) || 0,
      price:   parsePrice(r.querySelector('[data-price-value]').value),
    })).filter(x => x.tier_id);
  }

  // Refresh option list trong moi <select> sau khi them tier moi.
  function pricesRefreshTierOptions() {
    document.querySelectorAll('[data-price-tier]').forEach(sel => {
      const cur = sel.value;
      sel.innerHTML = `<option value="">— Chọn —</option>` + tierOptions(cur);
    });
  }

  async function loadPriceTiers() {
    const r = await api.get('/admin/price-tiers', { silent: true }).catch(() => null);
    priceTiers = (r && r.items) || [];
  }

  // ---- Modal quan ly tier ------------------------------------
  function openTierManager() {
    renderTierTable();
    $('tierNewName').value  = '';
    $('tierNewOrder').value = 0;
    $('tierModal').classList.add('open');
    setTimeout(() => $('tierNewName').focus(), 50);
  }
  function closeTierManager() {
    $('tierModal').classList.remove('open');
    pricesRefreshTierOptions();
  }

  function renderTierTable() {
    const tb = $('tierTableBody');
    if (!priceTiers.length) {
      tb.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding:16px">Chưa có mức giá nào</td></tr>`;
      return;
    }
    tb.innerHTML = priceTiers.map(t => `
      <tr data-tier-id="${t.id}">
        <td style="padding:8px 6px">
          <input type="text" class="input" data-tier-name value="${escape(t.name)}" style="font-size:13px;padding:6px 8px">
        </td>
        <td style="padding:8px 6px;color:#64748b;font-size:12px;font-family:ui-monospace,monospace">${escape(t.code)}</td>
        <td style="padding:8px 6px;text-align:center">
          ${t.is_default
            ? '<span style="color:#f59e0b;font-size:18px" title="Mặc định">⭐</span>'
            : `<button type="button" class="btn ghost sm" data-tier-default style="font-size:11px;padding:3px 8px" title="Đặt làm mặc định">Đặt mặc định</button>`}
        </td>
        <td style="padding:8px 6px;text-align:right;white-space:nowrap">
          <button type="button" class="btn ghost sm" data-tier-save style="font-size:11px;padding:4px 10px">Lưu</button>
          <button type="button" class="btn ghost sm" data-tier-del style="font-size:11px;padding:4px 8px;color:#dc2626" title="Xoá">×</button>
        </td>
      </tr>`).join('');
  }

  async function tierTableClick(e) {
    const tr = e.target.closest('tr[data-tier-id]');
    if (!tr) return;
    const id = Number(tr.dataset.tierId);

    if (e.target.matches('[data-tier-default]')) {
      const r = await api.put('/admin/price-tiers/' + id + '/set-default', {}, {
        successMessage: 'Đã đặt làm Mặc định',
      }).catch(() => null);
      if (r) await reloadTiersAndRender();
    } else if (e.target.matches('[data-tier-save]')) {
      const name = tr.querySelector('[data-tier-name]').value.trim();
      if (!name) return ui.toast('Tên không được rỗng', 'warning');
      const r = await api.put('/admin/price-tiers/' + id, { name }, {
        successMessage: 'Đã lưu',
        errorMessages: { 409: 'Tên đã tồn tại' },
      }).catch(() => null);
      if (r) await reloadTiersAndRender();
    } else if (e.target.matches('[data-tier-del]')) {
      const yes = await ui.confirm({
        title: 'Xoá mức giá?',
        message: 'Mức giá sẽ bị xoá nếu không còn sản phẩm/đại lý nào dùng.',
        type: 'warning',
        okText: 'Xoá',
      });
      if (!yes) return;
      const r = await api.delete('/admin/price-tiers/' + id, {
        successMessage: 'Đã xoá',
      }).catch(() => null);
      if (r) await reloadTiersAndRender();
    }
  }

  async function tierAddNew() {
    const name = $('tierNewName').value.trim();
    if (!name) return ui.toast('Nhập tên mức giá', 'warning');
    const sort_order = Number($('tierNewOrder').value) || 0;

    const r = await api.post('/admin/price-tiers', { name, sort_order }, {
      successMessage: 'Đã thêm mức giá',
      errorMessages: { 409: 'Mức giá đã tồn tại' },
    }).catch(() => null);
    if (!r) return;

    $('tierNewName').value = '';
    $('tierNewOrder').value = 0;
    await reloadTiersAndRender();
  }

  async function reloadTiersAndRender() {
    await loadPriceTiers();
    renderTierTable();
  }

  // ============================================================
  // CUSTOMER-PRICES (gia rieng theo dai ly cho san pham nay)
  // ============================================================
  let custPrices = [];   // [{customer_id, customer_code, customer_name, customer_phone, company_name, tier_name, price}]

  function custPriceRowHTML(it) {
    const label = it.company_name || it.customer_name || '—';
    const subParts = [];
    if (it.customer_code) subParts.push(it.customer_code);
    if (it.customer_phone) subParts.push(it.customer_phone);
    if (it.tier_name) subParts.push('Cấp: ' + it.tier_name);
    const sub = subParts.join(' · ') || 'Khách lẻ';
    return `
      <div class="cpp-row" data-cpp-row data-customer-id="${it.customer_id}" title="${escape(label)}">
        <div class="cpp-head">
          <div class="cpp-info">
            <div class="cpp-name">${escape(label)}</div>
            <div class="cpp-sub">${escape(sub)}</div>
          </div>
          <button type="button" class="cpp-del" data-cpp-del title="Xoá giá riêng">×</button>
        </div>
        <div class="cpp-body">
          <div class="price-amount">
            <input type="text" inputmode="numeric" data-cpp-value
                   placeholder="0" value="${formatPrice(it.price)}">
            <span class="price-suffix">₫</span>
          </div>
          <span class="cpp-status" data-cpp-status></span>
        </div>
      </div>`;
  }

  function custPricesRender() {
    const wrap = $('custPriceRows');
    if (!custPrices.length) {
      wrap.innerHTML = `<p class="text-muted" style="font-size:12.5px;padding:8px 0;margin:0">Chưa có đại lý nào được gán giá riêng cho sản phẩm này.</p>`;
      return;
    }
    wrap.innerHTML = custPrices.map(custPriceRowHTML).join('');
  }

  async function loadCustomerPrices() {
    const r = await api.get('/admin/products/' + productId + '/customer-prices', { silent: true })
      .catch(() => null);
    custPrices = (r && r.items) || [];
    custPricesRender();
  }

  async function saveCustPrice(customerId, price) {
    const r = await api.put('/admin/products/' + productId + '/customer-prices', {
      customer_id: customerId, price,
    }, { successMessage: 'Đã lưu giá riêng' }).catch(() => null);
    if (r) {
      const it = custPrices.find(x => Number(x.customer_id) === Number(customerId));
      if (it) it.price = price;
    }
    return !!r;
  }

  async function deleteCustPrice(customerId) {
    const yes = await ui.confirm({
      title: 'Xoá giá riêng?',
      message: 'Đại lý này sẽ trở về giá theo cấp / mức mặc định.',
      type: 'warning', okText: 'Xoá',
    });
    if (!yes) return;
    const r = await api.delete('/admin/products/' + productId + '/customer-prices/' + customerId, {
      successMessage: 'Đã xoá',
    }).catch(() => null);
    if (r) {
      custPrices = custPrices.filter(x => Number(x.customer_id) !== Number(customerId));
      custPricesRender();
    }
  }

  // ---- Dealer picker modal ----
  function openDealerPicker() {
    $('dealerSearch').value = '';
    renderDealerResults('');
    $('dealerPickerModal').classList.add('open');
    setTimeout(() => $('dealerSearch').focus(), 50);
  }
  function closeDealerPicker() { $('dealerPickerModal').classList.remove('open'); }

  let dealerSearchTimer;
  async function renderDealerResults(q) {
    const wrap = $('dealerResults');
    wrap.innerHTML = '<p class="text-muted text-center" style="padding:14px">Đang tìm…</p>';
    const params = new URLSearchParams({ type: 'dealer', limit: '20' });
    if (q) params.set('q', q);
    const r = await api.get('/admin/customers?' + params.toString(), { silent: true }).catch(() => null);
    const items = (r && r.items) || [];
    if (!items.length) {
      wrap.innerHTML = '<p class="text-muted text-center" style="padding:14px">Không có đại lý phù hợp</p>';
      return;
    }
    wrap.innerHTML = items.map(c => {
      const already = custPrices.some(x => Number(x.customer_id) === Number(c.id));
      const label = c.company_name || c.full_name || '—';
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--border);border-radius:8px">
          <div style="flex:1;min-width:0">
            <div><b>${escape(label)}</b> <small class="text-muted">${escape(c.code || '')}</small></div>
            <div class="text-muted" style="font-size:12.5px">${escape(c.phone || '')}${c.full_name && c.company_name ? ' · ' + escape(c.full_name) : ''}</div>
          </div>
          ${already
            ? '<span class="text-muted" style="font-size:12px">Đã có</span>'
            : `<button type="button" class="btn sm" data-pick-dealer="${c.id}"
                       data-name="${escape(c.full_name || '')}"
                       data-company="${escape(c.company_name || '')}"
                       data-code="${escape(c.code || '')}"
                       data-phone="${escape(c.phone || '')}">+ Chọn</button>`}
        </div>`;
    }).join('');
  }

  async function pickDealer(btn) {
    const id = Number(btn.dataset.pickDealer);
    if (!id) return;
    // Tao row trong UI voi gia 0 + insert vao DB ngay (de admin chinh sau)
    const ok = await saveCustPrice(id, 0);
    if (!ok) return;
    custPrices.unshift({
      customer_id: id,
      customer_code: btn.dataset.code,
      customer_name: btn.dataset.name,
      customer_phone: btn.dataset.phone,
      company_name: btn.dataset.company,
      tier_name: null,
      price: 0,
    });
    custPricesRender();
    closeDealerPicker();
  }

  // ============================================================
  // ATTRIBUTES (top + bottom)
  // ============================================================
  function attrsRender(rowsEl, items) {
    rowsEl.innerHTML = items.map(it => attrRowHTML(it)).join('');
  }
  function attrRowHTML(it = {}) {
    return `
      <div class="dyn-row" data-attr-row>
        <input class="input" data-attr-label placeholder="Tên (VD: Pin)" value="${escape(it.label || '')}" style="flex:1">
        <input class="input" data-attr-value placeholder="Giá trị (VD: 800mAh)" value="${escape(it.value || '')}" style="flex:1.3">
        <button type="button" class="btn-del" data-attr-del>×</button>
      </div>`;
  }
  function attrsCollect(rowsEl, position) {
    return Array.from(rowsEl.querySelectorAll('[data-attr-row]')).map(r => ({
      label: r.querySelector('[data-attr-label]').value.trim(),
      value: r.querySelector('[data-attr-value]').value.trim(),
      position,
    })).filter(x => x.label);
  }

  // ============================================================
  // BLOCKS (timeline)
  // ============================================================
  let blocks = [];      // [{block_type, content, caption}]

  function blocksRender() {
    const el = $('blocksList');
    if (!blocks.length) {
      el.innerHTML = '<p class="text-muted" style="text-align:center;padding:14px">Chưa có nội dung. Bấm các nút bên dưới để thêm.</p>';
      return;
    }
    el.innerHTML = blocks.map((b, i) => blockHTML(b, i)).join('');
  }

  function blockHTML(b, i) {
    const head = `
      <div class="tl-item-head">
        <span class="tl-num">${i + 1}</span>
        <select data-bk-type data-i="${i}">
          <option value="text"  ${b.block_type === 'text'  ? 'selected' : ''}>📝 Văn bản</option>
          <option value="image" ${b.block_type === 'image' ? 'selected' : ''}>🖼️ Ảnh</option>
          <option value="video" ${b.block_type === 'video' ? 'selected' : ''}>🎬 Video</option>
        </select>
        <span class="spacer"></span>
        <button type="button" class="btn ghost sm" data-bk-up data-i="${i}" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" class="btn ghost sm" data-bk-down data-i="${i}" ${i === blocks.length - 1 ? 'disabled' : ''}>↓</button>
        <button type="button" class="btn-del" data-bk-del data-i="${i}">×</button>
      </div>`;

    let body = '';
    if (b.block_type === 'text') {
      body = `<textarea class="textarea" data-bk-content data-i="${i}" placeholder="Nhập nội dung mô tả...">${escape(b.content || '')}</textarea>`;
    } else if (b.block_type === 'image') {
      body = `
        <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap">
          <input type="file" accept="image/*" data-bk-file data-folder="products" data-i="${i}">
          <input type="text" class="input" data-bk-content data-i="${i}" placeholder="hoặc dán URL ảnh" value="${escape(b.content || '')}" style="flex:1;min-width:240px">
        </div>
        ${b.content ? `<img src="${escape(b.content)}" class="tl-item-preview">` : ''}
        <input type="text" class="input mt-1" data-bk-caption data-i="${i}" placeholder="Chú thích (tuỳ chọn)" value="${escape(b.caption || '')}">`;
    } else if (b.block_type === 'video') {
      body = `
        <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap">
          <input type="file" accept="video/*" data-bk-file data-folder="videos" data-i="${i}">
          <input type="text" class="input" data-bk-content data-i="${i}" placeholder="hoặc dán URL video (mp4)" value="${escape(b.content || '')}" style="flex:1;min-width:240px">
        </div>
        ${b.content ? `<video controls preload="metadata" src="${escape(b.content)}" class="tl-item-preview"></video>` : ''}
        <input type="text" class="input mt-1" data-bk-caption data-i="${i}" placeholder="Chú thích (tuỳ chọn)" value="${escape(b.caption || '')}">`;
    }

    return `<div class="tl-item">${head}<div class="tl-item-body">${body}</div></div>`;
  }

  function blocksBindEvents() {
    const root = $('blocksList');
    // Type change -> tai render block do
    root.addEventListener('change', async (e) => {
      const t = e.target;
      if (t.matches('[data-bk-type]')) {
        const i = +t.dataset.i;
        blocks[i].block_type = t.value;
        blocks[i].content = '';
        blocks[i].caption = '';
        blocksRender();
      } else if (t.matches('[data-bk-content]')) {
        const i = +t.dataset.i;
        blocks[i].content = t.value;
      } else if (t.matches('[data-bk-caption]')) {
        const i = +t.dataset.i;
        blocks[i].caption = t.value;
      } else if (t.matches('[data-bk-file]')) {
        const i = +t.dataset.i;
        const folder = t.dataset.folder;
        const file = t.files[0];
        if (!file) return;
        const url = await uploadAsset(file, folder);
        if (!url) { t.value = ''; return; }
        blocks[i].content = url;
        blocksRender();
        ui.toast('Đã upload', 'success');
      }
    });
    // Input (typing) cho text content
    root.addEventListener('input', (e) => {
      const t = e.target;
      if (t.matches('[data-bk-content]')) {
        blocks[+t.dataset.i].content = t.value;
      } else if (t.matches('[data-bk-caption]')) {
        blocks[+t.dataset.i].caption = t.value;
      }
    });
    // Click: up / down / del
    root.addEventListener('click', (e) => {
      const t = e.target;
      if (t.matches('[data-bk-up]')) {
        const i = +t.dataset.i;
        if (i > 0) {
          [blocks[i - 1], blocks[i]] = [blocks[i], blocks[i - 1]];
          blocksRender();
        }
      } else if (t.matches('[data-bk-down]')) {
        const i = +t.dataset.i;
        if (i < blocks.length - 1) {
          [blocks[i + 1], blocks[i]] = [blocks[i], blocks[i + 1]];
          blocksRender();
        }
      } else if (t.matches('[data-bk-del]')) {
        const i = +t.dataset.i;
        blocks.splice(i, 1);
        blocksRender();
      }
    });
  }

  // ============================================================
  // LOAD product + categories (song song)
  // ============================================================
  async function loadAll() {
    const $title = $('pageTitle');
    if ($title) $title.textContent = 'Đang tải…';

    const [cats, p, tiers] = await Promise.all([
      api.get('/admin/categories',         { silent: true }).catch(() => null),
      api.get('/admin/products/' + productId).catch(() => null),
      api.get('/admin/price-tiers',        { silent: true }).catch(() => null),
    ]);
    priceTiers = (tiers && tiers.items) || [];

    // Render select danh muc TRUOC khi set value (de option ton tai)
    if (cats && cats.items) {
      $('pCategory').innerHTML = `<option value="">— Chưa phân loại —</option>` +
        cats.items.map(c => `<option value="${c.id}">${escape(c.name)}</option>`).join('');
    }

    if (!p) {
      if ($title) $title.textContent = 'Không tải được sản phẩm';
      return;
    }

    if ($title) $title.textContent = `${p.name} (${p.code})`;
    document.title = `${p.name} – Sửa sản phẩm`;

    $('pCode').value         = p.code || '';
    $('pName').value         = p.name || '';
    $('pCategory').value     = p.category_id || '';
    $('pWarranty').value     = p.warranty_months || 0;
    Money.set($('pCost'), p.cost_price || 0);
    $('pDesc').value         = p.description || '';
    $('pImageUrl').value     = p.image_url || '';
    $('pThumbnailUrl').value = p.thumbnail_url || '';

    // Hien anh: uu tien anh chinh, fallback thumbnail neu chi co thumb
    setImage(p.image_url || p.thumbnail_url || '');

    pricesRender(p.prices || []);
    loadCustomerPrices();

    const topAttrs    = (p.attributes || []).filter(a => (a.position || 'top') !== 'bottom');
    const bottomAttrs = (p.attributes || []).filter(a => a.position === 'bottom');
    attrsRender($('topAttrsRows'),    topAttrs);
    attrsRender($('bottomAttrsRows'), bottomAttrs);

    blocks = (p.blocks || []).map(b => ({
      block_type: b.block_type,
      content: b.content || '',
      caption: b.caption || '',
    }));
    blocksRender();
  }

  // ============================================================
  // SAVE
  // ============================================================
  async function save() {
    const data = {
      code: $('pCode').value.trim(),
      name: $('pName').value.trim(),
      category_id: $('pCategory').value || null,
      warranty_months: Number($('pWarranty').value) || 0,
      cost_price: Money.get($('pCost')),
      description: $('pDesc').value.trim(),
      image_url: $('pImageUrl').value || null,
      thumbnail_url: $('pThumbnailUrl').value || null,
    };

    if (!data.code) return ui.toast('Thiếu mã thiết bị', 'warning');
    if (!data.name) return ui.toast('Thiếu tên sản phẩm', 'warning');

    const top    = attrsCollect($('topAttrsRows'),    'top');
    const bottom = attrsCollect($('bottomAttrsRows'), 'bottom');
    const attributes = [...top, ...bottom];

    const cleanBlocks = blocks
      .filter(b => b.content && String(b.content).trim())
      .map(b => ({
        block_type: b.block_type,
        content: b.content.trim(),
        caption: b.caption ? b.caption.trim() : null,
      }));

    const ok = await api.put('/admin/products/' + productId, {
      ...data,
      prices: pricesCollect(),
      attributes,
      blocks: cleanBlocks,
    }, {
      successMessage: 'Đã lưu sản phẩm',
      errorMessages: { 409: 'Mã thiết bị đã tồn tại' },
      loading: true,
    }).catch(() => null);
    if (ok) loadAll();
  }

  // ============================================================
  // BIND
  // ============================================================
  function init() {
    adminShell.init('products');

    loadAll();

    // Image upload
    $('pImageFile').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const url = await uploadAsset(file, 'products');
      if (!url) { e.target.value = ''; return; }
      $('pImageUrl').value     = url;
      $('pThumbnailUrl').value = url;   // dung 1 anh cho ca 2 (auto-resize sau co the lam)
      setImage(url);
    });
    $('pImageClear').addEventListener('click', () => {
      $('pImageUrl').value     = '';
      $('pThumbnailUrl').value = '';
      $('pImageFile').value    = '';
      setImage('');
    });

    // Prices: add + delete + tao tier moi dung chung
    document.getElementById('btnAddPrice').addEventListener('click', () => {
      $('pricesRows').insertAdjacentHTML('beforeend', priceRowHTML());
    });
    document.getElementById('btnManageTiers').addEventListener('click', openTierManager);
    $('tierModalClose').addEventListener('click', closeTierManager);
    $('tierModalDone').addEventListener('click', closeTierManager);
    $('tierModal').addEventListener('click', (e) => { if (e.target.id === 'tierModal') closeTierManager(); });
    $('tierTableBody').addEventListener('click', tierTableClick);
    $('tierNewSave').addEventListener('click', tierAddNew);
    $('tierNewName').addEventListener('keydown', (e) => { if (e.key === 'Enter') tierAddNew(); });
    $('pricesRows').addEventListener('click', (e) => {
      if (e.target.matches('[data-price-del]')) {
        e.target.closest('[data-price-row]').remove();
      }
    });
    // Auto-format so khi go vao o gia (1234567 -> 1.234.567), bao toan caret.
    function bindPriceInputFormat(rootEl, selector) {
      rootEl.addEventListener('input', (e) => {
        const t = e.target;
        if (!t.matches(selector)) return;
        const before = t.value;
        const caret  = t.selectionStart;
        const digitsBeforeCaret = (before.slice(0, caret).match(/\d/g) || []).length;
        const formatted = formatPrice(parsePrice(before));
        t.value = formatted;
        let pos = 0, count = 0;
        while (pos < formatted.length && count < digitsBeforeCaret) {
          if (/\d/.test(formatted[pos])) count++;
          pos++;
        }
        t.setSelectionRange(pos, pos);
      });
    }
    bindPriceInputFormat($('pricesRows'),    '[data-price-value]');
    bindPriceInputFormat($('custPriceRows'), '[data-cpp-value]');

    // Customer-prices: xoa row
    $('custPriceRows').addEventListener('click', async (e) => {
      const row = e.target.closest('[data-cpp-row]');
      if (!row) return;
      const cid = Number(row.dataset.customerId);
      if (e.target.matches('[data-cpp-del]')) {
        await deleteCustPrice(cid);
      }
    });
    // Auto-save khi blur input gia (chi luu khi gia thuc su doi)
    $('custPriceRows').addEventListener('input', (e) => {
      if (!e.target.matches('[data-cpp-value]')) return;
      const row = e.target.closest('[data-cpp-row]');
      const it  = custPrices.find(x => Number(x.customer_id) === Number(row.dataset.customerId));
      const cur = parsePrice(e.target.value);
      const dirty = it && Number(it.price) !== cur;
      row.classList.toggle('is-dirty', dirty);
      row.classList.remove('is-saved');
      const st = row.querySelector('[data-cpp-status]');
      if (st) { st.textContent = dirty ? 'Sửa rồi…' : ''; st.className = 'cpp-status' + (dirty ? ' is-dirty' : ''); }
    });
    $('custPriceRows').addEventListener('focusout', async (e) => {
      if (!e.target.matches('[data-cpp-value]')) return;
      const row = e.target.closest('[data-cpp-row]');
      const cid = Number(row.dataset.customerId);
      const it  = custPrices.find(x => Number(x.customer_id) === cid);
      const price = parsePrice(e.target.value);
      if (!it || Number(it.price) === price) return;
      const ok = await saveCustPrice(cid, price);
      if (!ok) return;
      row.classList.remove('is-dirty');
      row.classList.add('is-saved');
      const st = row.querySelector('[data-cpp-status]');
      if (st) { st.textContent = '✓ Đã lưu'; st.className = 'cpp-status is-saved'; }
      setTimeout(() => {
        row.classList.remove('is-saved');
        if (st && st.classList.contains('is-saved')) { st.textContent = ''; st.className = 'cpp-status'; }
      }, 1800);
    });

    // Mo modal chon dai ly
    $('btnAddCustPrice').addEventListener('click', openDealerPicker);
    $('dealerPickerClose').addEventListener('click', closeDealerPicker);
    $('dealerPickerCancel').addEventListener('click', closeDealerPicker);
    $('dealerPickerModal').addEventListener('click', (e) => {
      if (e.target.id === 'dealerPickerModal') closeDealerPicker();
    });
    $('dealerSearch').addEventListener('input', (e) => {
      clearTimeout(dealerSearchTimer);
      dealerSearchTimer = setTimeout(() => renderDealerResults(e.target.value.trim()), 200);
    });
    $('dealerResults').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-pick-dealer]');
      if (btn) pickDealer(btn);
    });

    // Attrs: add + delete (cho ca top + bottom)
    document.querySelectorAll('[data-add-attr]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.addAttr === 'bottom' ? 'bottomAttrsRows' : 'topAttrsRows';
        document.getElementById(target).insertAdjacentHTML('beforeend', attrRowHTML());
      });
    });
    ['topAttrsRows', 'bottomAttrsRows'].forEach(id => {
      $(id).addEventListener('click', (e) => {
        if (e.target.matches('[data-attr-del]')) {
          e.target.closest('[data-attr-row]').remove();
        }
      });
    });

    // Blocks: add + render
    document.querySelectorAll('[data-add-block]').forEach(btn => {
      btn.addEventListener('click', () => {
        blocks.push({ block_type: btn.dataset.addBlock, content: '', caption: '' });
        blocksRender();
      });
    });
    blocksBindEvents();

    // Save / Discard
    $('btnSave').addEventListener('click', save);
    $('btnDiscard').addEventListener('click', () => {
      ui.confirm({ title: 'Huỷ thay đổi?', message: 'Tải lại từ DB và bỏ các sửa đổi chưa lưu?', okText: 'Tải lại' })
        .then(yes => { if (yes) loadAll(); });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
