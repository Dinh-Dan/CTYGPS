// Logic trang admin/customers — dung api.* voi UI tu dong (ui.js).

(function () {
  const $   = (id) => document.getElementById(id);
  const IS_ADMIN = (window.auth && auth.isAdmin && auth.isAdmin()) || false;
  const fmt = new Intl.NumberFormat('vi-VN');

  function lockAdminFields() {
    if (IS_ADMIN) return;
    ['f_discount_rate', 'f_default_tier_id'].forEach(id => {
      const el = $(id);
      if (!el) return;
      el.disabled = true;
      el.title = 'Chi admin moi sua duoc';
    });
  }

  const state = {
    filters: { q: '', type: '' },
    page: 1, limit: 20, total: 0, totalPages: 1,
  };
  let lastItems = [];

  // ---- SVG icons cho action buttons ----
  const SVG_ASSETS = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`;
  const SVG_EDIT   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  const SVG_DEL    = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

  // ---- Util ----
  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  // ---- Render ----
  function avatarCell(c) {
    if (c.avatar_url) return `<img src="${c.avatar_url}" alt="" class="avatar-cell">`;
    const i = (c.full_name || '?').trim().charAt(0).toUpperCase();
    return `<div class="avatar-placeholder">${i}</div>`;
  }

  function typeBadge(t) {
    return t === 'dealer'
      ? '<span class="pill-dealer">Đại lý</span>'
      : '<span class="pill-retail">Khách lẻ</span>';
  }

  function pwBadge(c) {
    if (c.type !== 'dealer') return '';
    return c.has_password
      ? ' <span class="pill green" title="Đã có mật khẩu" style="font-size:10px">🔒</span>'
      : ' <span class="pill red" title="Chưa có mật khẩu" style="font-size:10px">🔓</span>';
  }

  function nameCell(c) {
    if (c.type === 'dealer' && c.company_name) {
      return `<strong>${escape(c.company_name)}</strong><br><small class="text-muted">${escape(c.full_name)}</small>`;
    }
    return escape(c.full_name);
  }

  function actionsCell(c) {
    return `
      <button class="act-btn" data-act="assets" data-id="${c.id}" title="Tài sản">${SVG_ASSETS}</button>
      <button class="act-btn" data-act="edit"   data-id="${c.id}" title="Sửa">${SVG_EDIT}</button>
      <button class="act-btn danger" data-act="del" data-id="${c.id}" title="Xóa">${SVG_DEL}</button>
    `;
  }

  function renderRows(items) {
    const tb = $('tbody');
    if (!items.length) {
      tb.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:32px">Không có khách hàng phù hợp</td></tr>`;
      return;
    }
    tb.innerHTML = items.map(c => `
      <tr data-id="${c.id}" style="cursor:pointer">
        <td class="col-kh" data-label="Khách hàng">
          <div style="display:flex;align-items:center;gap:10px">
            ${avatarCell(c)}
            <div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <b>${escape(c.code)}</b>${pwBadge(c)}
                ${typeBadge(c.type)}
              </div>
              <div style="margin-top:2px;color:var(--text)">${nameCell(c)}</div>
            </div>
          </div>
        </td>
        <td data-label="SĐT" style="color:#334155">${escape(c.phone || '—')}</td>
        <td data-label="Tổng đơn" style="text-align:center">${fmt.format(c.order_count || 0)}</td>
        <td data-label="Tổng tiền" style="text-align:right;font-weight:500">${fmt.format(c.total_revenue || 0)}đ</td>
        <td data-label="Hành động" class="col-actions">${actionsCell(c)}</td>
      </tr>
    `).join('');
  }

  // ---- Load danh sách ----
  async function load() {
    const p = new URLSearchParams();
    if (state.filters.q)    p.set('q', state.filters.q);
    if (state.filters.type) p.set('type', state.filters.type);
    p.set('page', state.page);
    p.set('limit', state.limit);

    const res = await api.get('/admin/customers?' + p.toString()).catch(() => null);
    if (!res) return;
    state.total = res.total;
    state.totalPages = Math.max(1, Math.ceil(res.total / state.limit));
    lastItems = res.items;
    renderRows(res.items);
    updatePager();
  }

  function updatePager() {
    const from = state.total ? (state.page - 1) * state.limit + 1 : 0;
    const to   = Math.min(state.page * state.limit, state.total);
    $('pageInfo').textContent = `Hiển thị ${from} - ${to} trong ${state.total} khách hàng`;
    $('curPageBtn').textContent = state.page;
    $('firstPage').disabled = state.page <= 1;
    $('prevPage').disabled  = state.page <= 1;
    $('nextPage').disabled  = state.page >= state.totalPages;
    $('lastPage').disabled  = state.page >= state.totalPages;
  }

  // ---- Load stats thẻ tổng hợp ----
  async function loadStats() {
    const r = await api.get('/admin/customers/stats', { silent: true }).catch(() => null);
    if (!r) return;
    $('s_total').textContent   = fmt.format(r.total || 0);
    $('s_orders').textContent  = fmt.format(r.total_orders || 0);
    $('s_revenue').textContent = fmt.format(r.total_revenue || 0) + 'đ';
    $('s_new').textContent     = fmt.format(r.new_this_month || 0);
    $('s_loyal').textContent   = fmt.format(r.loyal || 0);

    $('tc_all').textContent    = r.total || 0;
    $('tc_retail').textContent = r.retail || 0;
    $('tc_dealer').textContent = r.dealer || 0;
  }

  // ---- Xuất CSV ----
  async function exportCSV() {
    const p = new URLSearchParams();
    if (state.filters.q)    p.set('q', state.filters.q);
    if (state.filters.type) p.set('type', state.filters.type);
    p.set('limit', 5000);
    const res = await api.get('/admin/customers?' + p.toString(), { loading: true }).catch(() => null);
    if (!res || !res.items.length) { ui.toast('Không có dữ liệu', 'info'); return; }

    const header = ['Mã', 'Loại', 'Họ tên', 'Công ty', 'SĐT', 'Email', 'Địa chỉ', 'Tổng đơn', 'Tổng tiền'];
    const rows = res.items.map(c => [
      c.code, c.type === 'dealer' ? 'Đại lý' : 'Khách lẻ',
      c.full_name, c.company_name || '',
      c.phone || '', c.email || '', c.address || '',
      c.order_count || 0, c.total_revenue || 0,
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `khach-hang-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  // ---- Modal them/sua ----
  let editing = null;

  function openModal(c) {
    editing = c || null;
    $('modal').style.zIndex = '1050';
    $('modal').classList.add('open');
    $('modalTitle').textContent = c ? 'Sửa khách hàng' : 'Thêm khách hàng';
    fillForm(c || { type: state.filters.type || 'retail' });
    toggleDealerBlock();
  }
  function closeModal() {
    $('modal').classList.remove('open');
    setTimeout(() => { $('modal').style.zIndex = ''; }, 200);
    editing = null;
  }

  function openPwModal(id, name, code) {
    $('pw_id').value = id;
    $('pw_name').textContent = name;
    $('pw_code').textContent = code;
    $('pw_new').value = '';
    $('pwModal').style.zIndex = '1100';
    $('pwModal').classList.add('open');
    setTimeout(() => $('pw_new').focus(), 50);
  }
  function closePwModal() {
    $('pwModal').classList.remove('open');
    setTimeout(() => { $('pwModal').style.zIndex = ''; }, 200);
  }

  function fillForm(c) {
    $('f_id').value             = c.id || '';
    $('f_parent_id').value      = c.parent_id || '';
    $('f_type').value           = c.type || 'retail';
    $('f_code').value           = c.code || '';
    $('f_full_name').value      = c.full_name || '';
    $('f_phone').value          = c.phone || '';
    $('f_email').value          = c.email || '';
    $('f_address').value        = c.address || '';
    $('f_avatar_url').value     = c.avatar_url || '';
    $('f_avatar_preview').src   = c.avatar_url || '';
    $('f_company_name').value   = c.company_name || '';
    $('f_tax_code').value       = c.tax_code || '';
    $('f_contact_person').value = c.contact_person || '';
    $('f_discount_rate').value  = c.discount_rate || 0;
    if (c.default_tier_id) {
      $('f_default_tier_id').value = c.default_tier_id;
    } else if (!c.id) {
      const banLe = tiersCache.find(t => t.name && t.name.toLowerCase().includes('bán lẻ'));
      $('f_default_tier_id').value = banLe ? banLe.id : '';
    } else {
      $('f_default_tier_id').value = '';
    }
    $('f_note').value = c.note || '';
    lockAdminFields();
  }

  function toggleDealerBlock() {
    const isDealer = $('f_type').value === 'dealer';
    $('dealerFields').classList.toggle('hide', !isDealer);
    const showPwBlock = isDealer && editing && editing.id;
    $('pwBlock').classList.toggle('hide', !showPwBlock);
    if (showPwBlock) {
      $('pwStatus').innerHTML = editing.has_password
        ? '<span class="pill green" style="font-size:11px">🔒 Đã đặt mật khẩu</span>'
        : '<span class="pill red" style="font-size:11px">🔓 Chưa có mật khẩu — đại lý không thể đăng nhập</span>';
    }
  }

  function readForm() {
    return {
      type:       $('f_type').value,
      code:       $('f_code').value.trim(),
      full_name:  $('f_full_name').value.trim(),
      phone:      $('f_phone').value.trim() || null,
      email:      $('f_email').value.trim() || null,
      address:    $('f_address').value.trim() || null,
      avatar_url: $('f_avatar_url').value.trim() || null,
      default_tier_id: $('f_default_tier_id').value ? Number($('f_default_tier_id').value) : null,
      parent_id:  $('f_parent_id').value ? Number($('f_parent_id').value) : null,
      company_name:   $('f_company_name').value.trim() || null,
      tax_code:       $('f_tax_code').value.trim() || null,
      contact_person: $('f_contact_person').value.trim() || null,
      discount_rate:  Number($('f_discount_rate').value) || 0,
      note:       $('f_note').value.trim() || null,
    };
  }

  // ---- Avatar upload ----
  function fileToDataUrl(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result);
      r.onerror = () => rej(new Error('Không đọc được file'));
      r.readAsDataURL(file);
    });
  }
  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    ui.loading(true);
    const url = await imgbb.upload(file).catch(err => { ui.toast('Lỗi upload: ' + err.message, 'error'); return null; });
    ui.loading(false);
    if (!url) { e.target.value = ''; return; }
    $('f_avatar_url').value   = url;
    $('f_avatar_preview').src = url;
  }

  // ---- Submit ----
  async function handleSubmit(e) {
    e.preventDefault();
    const id = $('f_id').value;
    const data = readForm();
    $('btnSave').disabled = true;
    const ok = await (id
      ? api.put('/admin/customers/' + id, data, { successMessage: 'Đã cập nhật khách hàng', errorMessages: { 409: 'Mã khách hàng đã tồn tại' }, loading: true })
      : api.post('/admin/customers', data, { successMessage: 'Đã tạo khách hàng', errorMessages: { 409: 'Mã khách hàng đã tồn tại' }, loading: true })
    ).catch(() => null);
    $('btnSave').disabled = false;
    if (!ok) return;
    closeModal();
    load();
    loadStats();
    if ($('assetsModal').classList.contains('open') && assetsState.customer) reloadAssets();
  }

  async function handlePwSubmit(e) {
    e.preventDefault();
    const id = $('pw_id').value;
    const password = $('pw_new').value;
    if (password.length < 4) return ui.toast('Tối thiểu 4 ký tự', 'warning');
    const ok = await api.post('/admin/customers/' + id + '/password', { password }, { successMessage: 'Đã đổi mật khẩu' }).catch(() => null);
    if (!ok) return;
    closePwModal();
    if (editing && String(editing.id) === String(id)) { editing.has_password = true; toggleDealerBlock(); }
    load();
  }

  function handleChangePwClick() {
    if (!editing || !editing.id) return;
    openPwModal(editing.id, editing.full_name, editing.code);
  }

  // ---- Table click ----
  async function handleTableClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id  = btn.dataset.id;
    const act = btn.dataset.act;

    if (act === 'assets') {
      const c = await api.get('/admin/customers/' + id).catch(() => null);
      if (c) openAssetsModal(c);
      return;
    }
    if (act === 'edit') {
      const c = await api.get('/admin/customers/' + id).catch(() => null);
      if (c) openModal(c);
    } else if (act === 'del') {
      const yes = await ui.confirm({ title: 'Xác nhận xoá', message: 'Bạn có chắc muốn xoá khách hàng này?', type: 'warning', okText: 'Xoá' });
      if (!yes) return;
      const ok = await api.delete('/admin/customers/' + id, { successMessage: 'Đã xoá khách hàng' }).catch(() => null);
      if (ok) { load(); loadStats(); }
    }
  }

  // ---- Init ----
  function init() {
    adminShell.init('customers');

    // Search debounce
    let searchTimer;
    $('searchQ').addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.filters.q = $('searchQ').value.trim();
        state.page = 1;
        load();
      }, 300);
    });

    // Tabs
    document.querySelectorAll('.kh-tab[data-tab]').forEach(btn => {
      if (btn.disabled) return;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.kh-tab').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        state.filters.type = btn.dataset.tab;
        state.page = 1;
        load();
      });
    });

    // Phân trang
    $('firstPage').addEventListener('click', () => { state.page = 1; load(); });
    $('prevPage').addEventListener('click',  () => { state.page--; load(); });
    $('nextPage').addEventListener('click',  () => { state.page++; load(); });
    $('lastPage').addEventListener('click',  () => { state.page = state.totalPages; load(); });

    // Buttons
    $('btnAdd').addEventListener('click', () => openModal(null));
    $('btnExport').addEventListener('click', exportCSV);
    $('modalClose').addEventListener('click', closeModal);
    $('btnCancel').addEventListener('click', closeModal);
    $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    $('pwClose').addEventListener('click', closePwModal);
    $('pwCancel').addEventListener('click', closePwModal);
    $('pwModal').addEventListener('click', (e) => { if (e.target.id === 'pwModal') closePwModal(); });
    $('pwForm').addEventListener('submit', handlePwSubmit);
    $('f_type').addEventListener('change', toggleDealerBlock);
    $('frm').addEventListener('submit', handleSubmit);
    $('btnChangePw').addEventListener('click', handleChangePwClick);
    $('f_avatar_file').addEventListener('change', handleAvatarChange);
    $('f_avatar_clear').addEventListener('click', () => {
      $('f_avatar_url').value   = '';
      $('f_avatar_preview').src = '';
      $('f_avatar_file').value  = '';
    });

    $('tbody').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (btn) { handleTableClick(e); return; }
      const row = e.target.closest('tr[data-id]');
      if (row) openDetailModal(Number(row.dataset.id));
    });

    $('dt_close').addEventListener('click', closeDetailModal);
    $('dt_close2').addEventListener('click', closeDetailModal);
    $('detailModal').addEventListener('click', (e) => { if (e.target.id === 'detailModal') closeDetailModal(); });
    $('dt_edit').addEventListener('click', async () => {
      const id = $('dt_edit').dataset.id;
      closeDetailModal();
      const c = await api.get('/admin/customers/' + id).catch(() => null);
      if (c) openModal(c);
    });

    loadTiers();
    loadStats();
    load();
  }

  // ---- Price tiers ----
  let tiersCache = [];
  async function loadTiers() {
    const r = await api.get('/admin/price-tiers', { silent: true }).catch(() => null);
    if (!r || !r.items) return;
    tiersCache = r.items;
    const opts = `<option value="">— Theo mức Mặc định chung —</option>` +
      r.items.map(t => {
        const label = t.is_default ? `${escape(t.name)} ⭐ (mặc định chung)` : escape(t.name);
        return `<option value="${t.id}">${label}</option>`;
      }).join('');
    $('f_default_tier_id').innerHTML = opts;
  }

  // ============================================================
  // ASSETS MODAL
  // ============================================================
  const AX_KINDS = [
    { kind: 'account', label: 'Tài khoản',  valCol: 'account_name', listKey: 'accounts', placeholder: 'Tên tài khoản mới', icon: '👤' },
    { kind: 'vehicle', label: 'Biển số xe', valCol: 'plate',        listKey: 'vehicles', placeholder: 'VD: 51A-12345',     icon: '🚗' },
    { kind: 'sim',     label: 'Số SIM',     valCol: 'sim_number',   listKey: 'sims',     placeholder: 'Số SIM thiết bị',   icon: '📱' },
  ];
  const assetsState = { customer: null, original: {}, data: null };

  async function openAssetsModal(c) {
    assetsState.customer = c;
    $('ax_name').textContent = `${c.full_name} (${c.code})`;
    $('assetsModal').classList.add('open');
    $('ax_body').innerHTML = '<p class="text-muted" style="padding:14px">Đang tải…</p>';
    await reloadAssets();
  }
  function closeAssetsModal() {
    $('assetsModal').classList.remove('open');
    assetsState.customer = null;
    assetsState.data = null;
    assetsState.original = {};
  }

  async function reloadAssets() {
    const cid = assetsState.customer.id;
    const r = await api.get(`/admin/customer-assets/${cid}`).catch(() => null);
    if (!r) return;
    assetsState.data = r;
    renderAssetForm();
    if (assetsState.customer.type === 'dealer') renderEndCustomers();
  }

  function renderAssetForm() {
    const original = {};
    const sectionsHtml = AX_KINDS.map(cfg => {
      const list = assetsState.data[cfg.listKey] || [];
      const chipsHtml = list.map(it => {
        original[`${cfg.kind}:${it.id}`] = it[cfg.valCol];
        const v = escape(it[cfg.valCol]);
        return `<div class="chip ax-chip" data-kind="${cfg.kind}" data-id="${it.id}" data-orig="${v}" data-cur="${v}">
          <span class="chip-val">${v}</span>
          <button type="button" class="chip-del" title="Xoá">×</button>
        </div>`;
      }).join('');
      return `<div class="afs afs--${cfg.kind}">
        <div class="afs-hd">
          <span class="afs-dot"></span>
          <span class="afs-lbl">${escape(cfg.label)}</span>
          <span class="afs-ct" data-kind="${cfg.kind}">${list.length}</span>
        </div>
        <div class="afs-chips" data-kind="${cfg.kind}">
          ${chipsHtml}
          <button type="button" class="chip-add" data-kind="${cfg.kind}" data-placeholder="${escape(cfg.placeholder)}">+ Thêm</button>
        </div>
      </div>`;
    }).join('');

    assetsState.original = original;
    $('ax_body').innerHTML = `<div class="asset-form">${sectionsHtml}</div>
    ${assetsState.customer.type === 'dealer' ? '<div id="ax_ec_section" style="margin-top:16px;padding-top:14px;border-top:2px dashed #bae6fd"><p style="color:#94a3b8;font-size:13px;padding:0 4px">Đang tải khách đầu cuối…</p></div>' : ''}`;
  }

  function enterChipEdit(chip) {
    if (chip.classList.contains('chip--editing') || chip.classList.contains('chip--deleted')) return;
    chip.classList.add('chip--editing');
    const val = chip.dataset.cur || '';
    chip.innerHTML = `<input class="chip-input" value="${val}">
      <button type="button" class="chip-ok" title="Xác nhận">✓</button>
      <button type="button" class="chip-cancel" title="Huỷ">×</button>`;
    const inp = chip.querySelector('.chip-input');
    inp.focus(); inp.select();
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); confirmChipEdit(chip); }
      if (e.key === 'Escape') { e.preventDefault(); cancelChipEdit(chip); }
    });
  }
  function confirmChipEdit(chip) {
    const newVal = (chip.querySelector('.chip-input').value || '').trim();
    chip.classList.remove('chip--editing');
    if (newVal) chip.dataset.cur = newVal;
    const v = chip.dataset.cur || chip.dataset.orig || '';
    chip.innerHTML = `<span class="chip-val">${escape(v)}</span>
      <button type="button" class="chip-del" title="Xoá">×</button>`;
  }
  function cancelChipEdit(chip) {
    chip.classList.remove('chip--editing');
    const v = chip.dataset.cur || chip.dataset.orig || '';
    chip.innerHTML = `<span class="chip-val">${escape(v)}</span>
      <button type="button" class="chip-del" title="Xoá">×</button>`;
  }
  function spawnNewChipInput(addBtn) {
    const kind = addBtn.dataset.kind;
    const placeholder = addBtn.dataset.placeholder || '';
    const wrap = document.createElement('div');
    wrap.className = 'chip chip--new-input';
    wrap.dataset.kind = kind;
    wrap.innerHTML = `<input class="chip-input" placeholder="${escape(placeholder)}">
      <button type="button" class="chip-ok chip-ok-new" title="Thêm">+</button>
      <button type="button" class="chip-cancel chip-cancel-new" title="Bỏ">×</button>`;
    addBtn.before(wrap);
    const inp = wrap.querySelector('.chip-input');
    inp.focus();
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); confirmNewChip(wrap); }
      if (e.key === 'Escape') { e.preventDefault(); wrap.remove(); }
    });
  }
  function confirmNewChip(wrap) {
    const val = (wrap.querySelector('.chip-input').value || '').trim();
    if (!val) { wrap.remove(); return; }
    const kind = wrap.dataset.kind;
    const chip = document.createElement('div');
    chip.className = 'chip chip--new';
    chip.dataset.kind = kind;
    chip.dataset.cur = val;
    chip.innerHTML = `<span class="chip-val">${escape(val)}</span>
      <button type="button" class="chip-del" title="Xoá">×</button>`;
    wrap.replaceWith(chip);
    const ct = document.querySelector(`.afs-ct[data-kind="${kind}"]`);
    if (ct) ct.textContent = document.querySelectorAll(`#ax_body .afs-chips[data-kind="${kind}"] .chip:not(.chip--new-input)`).length;
  }

  async function renderEndCustomers() {
    const $sec = document.getElementById('ax_ec_section');
    if (!$sec) return;
    const cid = assetsState.customer.id;
    const res = await api.get(`/admin/customers/${cid}/end-customers`).catch(() => null);
    if (!res) { $sec.innerHTML = '<p style="color:#dc2626;font-size:13px">Lỗi tải danh sách</p>'; return; }
    const items = res.items || [];
    $sec.innerHTML = `
      <div style="font-size:12px;font-weight:700;color:#0369a1;margin-bottom:8px;letter-spacing:.3px;text-transform:uppercase;display:flex;justify-content:space-between;align-items:center">
        <span>👤 Khách đầu cuối / Khách con (${items.length})</span>
        <button class="btn sm ghost" id="ax_add_ec" style="padding:4px 8px;font-size:11px">+ Thêm mới</button>
      </div>
      ${!items.length
        ? '<p style="color:#94a3b8;font-size:13px">Chưa có khách con nào.</p>'
        : `<div style="display:flex;flex-direction:column;gap:6px">
            ${items.map(ec => `
              <div style="padding:9px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;font-size:13px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <div style="flex:1;min-width:0">
                  <span style="font-weight:700">${escape(ec.full_name)}</span>
                  ${ec.phone ? `<a href="tel:${escape(ec.phone)}" style="color:#0369a1;margin-left:6px">${escape(ec.phone)}</a>` : ''}
                  <span style="color:#94a3b8;font-size:11px;margin-left:4px">(${escape(ec.code)})</span>
                  ${ec.address ? `<div style="font-size:12px;color:#64748b;margin-top:2px">📍 ${escape(ec.address)}</div>` : ''}
                </div>
                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                  <span style="font-size:11px;color:#64748b">${ec.order_count} đơn</span>
                  <button class="btn ghost sm" data-ec-edit="${ec.id}" style="font-size:12px;padding:4px 10px;color:#1f6feb">Sửa</button>
                  <button class="btn sm" data-ec-assets="${ec.id}" data-ec-name="${escape(ec.full_name)}" data-ec-code="${escape(ec.code)}" data-ec-type="retail"
                    style="font-size:12px;padding:4px 10px">Tài sản</button>
                </div>
              </div>`).join('')}
           </div>`}
    `;
    const addBtn = document.getElementById('ax_add_ec');
    if (addBtn) addBtn.addEventListener('click', () => { openModal({ type: 'retail', parent_id: assetsState.customer.id }); });
    $sec.querySelectorAll('button[data-ec-edit]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const c = await api.get('/admin/customers/' + btn.dataset.ecEdit).catch(() => null);
        if (c) openModal(c);
      });
    });
    $sec.querySelectorAll('button[data-ec-assets]').forEach(btn => {
      btn.addEventListener('click', () => {
        openAssetsModal({ id: Number(btn.dataset.ecAssets), full_name: btn.dataset.ecName, code: btn.dataset.ecCode, type: btn.dataset.ecType || 'retail' });
      });
    });
  }

  async function saveAssets() {
    if (!assetsState.customer) return;
    const cid = assetsState.customer.id;
    const calls = [];
    document.querySelectorAll('#ax_body .ax-chip[data-id]').forEach(chip => {
      const kind = chip.dataset.kind, id = chip.dataset.id;
      const orig = assetsState.original[`${kind}:${id}`] || '';
      if (chip.classList.contains('chip--deleted')) {
        calls.push({ method: 'delete', url: `/admin/customer-assets/${cid}/${kind}/${id}` });
      } else if ((chip.dataset.cur || '').trim() !== orig) {
        calls.push({ method: 'put', url: `/admin/customer-assets/${cid}/${kind}/${id}`, body: { value: chip.dataset.cur } });
      }
    });
    document.querySelectorAll('#ax_body .chip--new').forEach(chip => {
      const val = (chip.dataset.cur || '').trim();
      if (val) calls.push({ method: 'post', url: `/admin/customer-assets/${cid}/${chip.dataset.kind}`, body: { value: val } });
    });
    if (!calls.length) { ui.toast('Không có thay đổi', 'info'); return; }
    const results = await Promise.all(calls.map(c =>
      (c.method === 'delete' ? api.delete(c.url, { onError: 'silent' })
        : c.method === 'put' ? api.put(c.url, c.body, { onError: 'silent' })
        : api.post(c.url, c.body, { onError: 'silent' })
      ).catch(() => null)
    ));
    const okCount = results.filter(Boolean).length, failCount = results.length - okCount;
    if (okCount)   ui.toast(`Đã cập nhật ${okCount} mục`, 'success');
    if (failCount) ui.toast(`${failCount} mục lưu lỗi`, 'error');
    await reloadAssets();
  }

  // ============================================================
  // REQUESTS MODAL
  // ============================================================
  const reqState = { status: 'pending', autoApprove: false };

  function renderAutoApproveToggle() {
    const on = reqState.autoApprove;
    $('rqToggleTrack').classList.toggle('on', on);
    $('rqToggleLabel').innerHTML = `Tự động duyệt: <b>${on ? 'Bật' : 'Tắt'}</b>`;
  }

  async function openReqModal() {
    reqState.status = 'pending';
    document.querySelectorAll('#reqModal .tab').forEach(b => { b.classList.toggle('on', b.dataset.status === 'pending'); });
    $('reqModal').classList.add('open');
    const s = await api.get('/admin/settings', { silent: true }).catch(() => null);
    reqState.autoApprove = s && s['assets.auto_approve'] === '1';
    renderAutoApproveToggle();
    await reloadRequests();
  }
  function closeReqModal() { $('reqModal').classList.remove('open'); }

  async function reloadRequests() {
    const r = await api.get(`/admin/customer-assets/requests/list?status=${reqState.status}&limit=100`).catch(() => null);
    if (!r) return;
    if (!r.items.length) {
      $('rq_list').innerHTML = `<div class="text-muted" style="padding:24px;text-align:center">Không có đề xuất ${reqState.status === 'pending' ? 'chờ duyệt' : reqState.status === 'approved' ? 'đã duyệt' : 'từ chối'}</div>`;
      return;
    }
    const KIND = { account: 'Tài khoản', vehicle: 'Biển số', sim: 'SIM' };
    const ACT  = { add: 'Thêm', update: 'Sửa', delete: 'Xoá' };
    $('rq_list').innerHTML = r.items.map(it => {
      const actionsHtml = it.status === 'pending' ? `
        <button class="btn sm" data-rq-act="approve" data-id="${it.id}">Duyệt</button>
        <button class="btn ghost sm" data-rq-act="reject" data-id="${it.id}" style="color:#dc2626">Từ chối</button>
      ` : `<small class="text-muted">${it.review_note ? escape(it.review_note) : ''}</small>`;
      return `
        <div style="padding:10px;border-bottom:1px solid var(--border)">
          <div class="row" style="gap:8px;align-items:flex-start">
            <div style="flex:1">
              <div><b>${ACT[it.action]} ${KIND[it.asset_kind]}</b>
                ${it.value ? ` → <code>${escape(it.value)}</code>` : ''}
              </div>
              <div style="font-size:12.5px;color:#475569;margin-top:3px">
                Khách: <b>${escape(it.customer_name)}</b> (${escape(it.customer_code)})
                ${it.ref_order_code ? ` · Đơn: ${escape(it.ref_order_code)}` : ''}
              </div>
              <div style="font-size:12px;color:#64748b">
                KTV: ${escape(it.requested_by_name || '?')}
                ${it.note ? ` · "${escape(it.note)}"` : ''}
              </div>
            </div>
            <div style="display:flex;gap:6px">${actionsHtml}</div>
          </div>
        </div>`;
    }).join('');
  }

  async function approveReq(id) {
    const ok = await api.post(`/admin/customer-assets/requests/${id}/approve`, {}, { successMessage: 'Đã duyệt' }).catch(() => null);
    if (ok) { reloadRequests(); refreshReqBadge(); }
  }
  async function rejectReq(id) {
    const note = window.prompt('Lý do từ chối (tuỳ chọn):', '');
    if (note === null) return;
    const ok = await api.post(`/admin/customer-assets/requests/${id}/reject`, { review_note: note || null }, { successMessage: 'Đã từ chối' }).catch(() => null);
    if (ok) { reloadRequests(); refreshReqBadge(); }
  }
  async function refreshReqBadge() {
    const r = await api.get('/admin/customer-assets/requests/list?status=pending&limit=1', { silent: true }).catch(() => null);
    if (!r) return;
    const badge = $('reqBadge');
    if (r.total > 0) { badge.textContent = r.total; badge.style.display = ''; }
    else badge.style.display = 'none';
  }

  function bindAssetsAndRequests() {
    $('ax_close').addEventListener('click', closeAssetsModal);
    $('ax_done').addEventListener('click', closeAssetsModal);
    $('ax_save').addEventListener('click', saveAssets);
    $('assetsModal').addEventListener('click', (e) => { if (e.target.id === 'assetsModal') closeAssetsModal(); });
    $('ax_body').addEventListener('click', (e) => {
      const delBtn = e.target.closest('.chip-del');
      if (delBtn) {
        const chip = delBtn.closest('.chip');
        if (chip.classList.contains('chip--new')) { chip.remove(); return; }
        const deleted = chip.classList.toggle('chip--deleted');
        delBtn.textContent = deleted ? '↩' : '×';
        delBtn.title = deleted ? 'Huỷ xoá' : 'Xoá';
        return;
      }
      const chipVal = e.target.closest('.chip-val');
      if (chipVal) { enterChipEdit(chipVal.closest('.ax-chip')); return; }
      const okBtn = e.target.closest('.chip-ok:not(.chip-ok-new)');
      if (okBtn) { confirmChipEdit(okBtn.closest('.ax-chip')); return; }
      const cancelBtn = e.target.closest('.chip-cancel:not(.chip-cancel-new)');
      if (cancelBtn) { cancelChipEdit(cancelBtn.closest('.ax-chip')); return; }
      const okNew = e.target.closest('.chip-ok-new');
      if (okNew) { confirmNewChip(okNew.closest('.chip--new-input')); return; }
      const cancelNew = e.target.closest('.chip-cancel-new');
      if (cancelNew) { cancelNew.closest('.chip--new-input').remove(); return; }
      const addBtn = e.target.closest('.chip-add');
      if (addBtn) { spawnNewChipInput(addBtn); return; }
    });

    document.querySelectorAll('#reqModal .tab').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#reqModal .tab').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        reqState.status = b.dataset.status;
        reloadRequests();
      });
    });
    $('rqToggleTrack').addEventListener('click', async () => {
      const newVal = reqState.autoApprove ? '0' : '1';
      const ok = await api.put('/admin/settings', { key: 'assets.auto_approve', value: newVal }, { silent: true }).catch(() => null);
      if (ok) {
        reqState.autoApprove = newVal === '1';
        renderAutoApproveToggle();
        ui.toast(reqState.autoApprove ? 'Đã bật tự động duyệt' : 'Đã tắt tự động duyệt', 'success');
      }
    });
    $('rq_close').addEventListener('click', closeReqModal);
    $('rq_done').addEventListener('click', closeReqModal);
    $('reqModal').addEventListener('click', (e) => { if (e.target.id === 'reqModal') closeReqModal(); });
    $('rq_list').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-rq-act]');
      if (!b) return;
      if (b.dataset.rqAct === 'approve') approveReq(b.dataset.id);
      else if (b.dataset.rqAct === 'reject') rejectReq(b.dataset.id);
    });
    $('btnRequests').addEventListener('click', openReqModal);
    refreshReqBadge();
  }

  // ============================================================
  // DETAIL MODAL
  // ============================================================
  function openDetailModal(id) {
    const c = lastItems.find(x => x.id === id);
    if (!c) return;
    $('detailModal').classList.add('open');
    $('dt_title').textContent = c.type === 'dealer' && c.company_name
      ? `${c.company_name} — ${c.full_name} (${c.code})`
      : `${c.full_name} (${c.code})`;
    $('dt_edit').dataset.id = c.id;
    $('dt_body').innerHTML = renderDetailStatic(c);
    loadDetailAsync(c);
  }
  function closeDetailModal() { $('detailModal').classList.remove('open'); }

  function renderDetailStatic(c) {
    const detailIni = escape((c.full_name||'?').trim().charAt(0).toUpperCase());
    const detailFbStyle = 'width:64px;height:64px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#64748b;flex-shrink:0';
    const av = c.avatar_url
      ? `<img src="${escape(c.avatar_url)}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;flex-shrink:0" onerror="this.onerror=null;this.insertAdjacentHTML('afterend','<div style=&quot;${detailFbStyle}&quot;>${detailIni}</div>');this.remove()">`
      : `<div style="${detailFbStyle}">${detailIni}</div>`;
    return `
      <div style="display:flex;gap:16px;align-items:flex-start;padding-bottom:16px;border-bottom:1px solid #e2e8f0;margin-bottom:16px">
        ${av}
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            ${c.type === 'dealer' ? '<span class="pill-dealer">Đại lý</span>' : '<span class="pill-retail">Khách lẻ</span>'}
            <code style="font-size:12px;color:#64748b">${escape(c.code)}</code>
            ${c.has_password ? '<span class="pill green" style="font-size:10px">🔒 Có mật khẩu</span>' : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;font-size:13px;color:#334155">
            ${c.phone ? `<div>📞 <a href="tel:${escape(c.phone)}" style="color:#0369a1">${escape(c.phone)}</a></div>` : ''}
            ${c.email ? `<div>✉️ ${escape(c.email)}</div>` : ''}
            ${c.address ? `<div>📍 ${escape(c.address)}</div>` : ''}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:16px">
        <div style="flex:1;text-align:center;background:#f0f9ff;border-radius:8px;padding:10px 8px">
          <div style="font-size:26px;font-weight:700;color:#0369a1">${fmt.format(c.order_count || 0)}</div>
          <div style="font-size:12px;color:#64748b">Đơn hàng</div>
        </div>
        <div style="flex:2;text-align:center;background:#f0fdf4;border-radius:8px;padding:10px 8px">
          <div style="font-size:20px;font-weight:700;color:#15803d">${fmt.format(c.total_revenue || 0)}đ</div>
          <div style="font-size:12px;color:#64748b">Tổng tiền đã giao dịch</div>
        </div>
      </div>
      ${(c.company_name || c.tax_code || c.contact_person || c.discount_rate) ? `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:16px">
        <div style="font-weight:600;color:#92400e;margin-bottom:8px">📋 Thông tin bổ sung</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px">
          ${c.company_name ? `<div><span style="color:#64748b">Công ty:</span> <b>${escape(c.company_name)}</b></div>` : ''}
          ${c.tax_code ? `<div><span style="color:#64748b">MST:</span> ${escape(c.tax_code)}</div>` : ''}
          ${c.contact_person ? `<div><span style="color:#64748b">Người LH:</span> ${escape(c.contact_person)}</div>` : ''}
          ${c.discount_rate ? `<div><span style="color:#64748b">Chiết khấu:</span> ${c.discount_rate}%</div>` : ''}
        </div>
      </div>` : ''}
      ${c.note ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;font-size:13px;margin-bottom:16px;color:#475569">📝 ${escape(c.note)}</div>` : ''}
      <div id="dt_assets"><div style="font-size:13px;color:#94a3b8;padding:4px 0">Đang tải tài sản…</div></div>
      ${c.type === 'dealer' ? '<div id="dt_ec"><div style="font-size:13px;color:#94a3b8;padding:4px 0;margin-top:8px">Đang tải khách con…</div></div>' : ''}
    `;
  }

  async function loadDetailAsync(c) {
    const AX = [
      { key: 'accounts', col: 'account_name', label: 'Tài khoản',  icon: '👤', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
      { key: 'vehicles', col: 'plate',        label: 'Biển số xe', icon: '🚗', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
      { key: 'sims',     col: 'sim_number',   label: 'Số SIM',     icon: '📱', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    ];
    const assetsSec = document.getElementById('dt_assets');
    const assets = await api.get('/admin/customer-assets/' + c.id, { silent: true }).catch(() => null);
    if (assetsSec) {
      if (!assets) {
        assetsSec.innerHTML = '<div style="font-size:13px;color:#dc2626">Lỗi tải tài sản</div>';
      } else {
        const total = AX.reduce((s, a) => s + (assets[a.key] || []).length, 0);
        if (!total) {
          assetsSec.innerHTML = '<div style="font-size:13px;color:#94a3b8">Chưa có tài sản đăng ký</div>';
        } else {
          const colsHtml = AX.map(a => {
            const list = assets[a.key] || [];
            if (!list.length) return '';
            const rowsHtml = list.map((it, i) =>
              `<div class="axd-item" data-val="${escape(it[a.col]).toLowerCase()}"
                style="padding:6px 10px;border-bottom:1px solid ${a.border};font-size:12.5px;color:#1e293b;
                       word-break:break-all;line-height:1.4;background:${i % 2 ? '#fafafa' : '#fff'}">${escape(it[a.col])}</div>`
            ).join('');
            return `
              <div class="axd-col" style="flex:1;min-width:160px">
                <div style="font-size:12px;font-weight:700;color:${a.color};margin-bottom:6px;display:flex;align-items:center;gap:5px">
                  <span>${a.icon} ${a.label}</span>
                  <span class="axd-cnt" style="background:${a.bg};border:1px solid ${a.border};color:${a.color};border-radius:999px;padding:1px 8px;font-size:11px;font-weight:600">${list.length}</span>
                  <span class="axd-of" style="display:none;font-size:11px;color:#94a3b8">/ ${list.length}</span>
                </div>
                <div style="max-height:220px;overflow-y:auto;border:1px solid ${a.border};border-radius:6px;background:#fff;box-shadow:inset 0 2px 4px rgba(0,0,0,.03)">${rowsHtml}</div>
              </div>`;
          }).filter(Boolean).join('');
          assetsSec.innerHTML = `
            <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;background:#fafafa">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap">
                <span style="font-weight:700;font-size:13px;color:#334155">
                  🗂 Tài sản đăng ký
                  <span id="axd_badge" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:999px;padding:2px 9px;font-size:12px;color:#64748b;margin-left:4px">${total}</span>
                </span>
                <input id="axd_search" type="text" placeholder="🔍 Tìm trong tài sản…"
                  style="border:1px solid #e2e8f0;border-radius:6px;padding:5px 10px;font-size:12.5px;width:210px;outline:none;transition:border .15s"
                  onfocus="this.style.borderColor='#818cf8'" onblur="this.style.borderColor='#e2e8f0'">
              </div>
              <div id="axd_cols" style="display:flex;gap:14px;flex-wrap:wrap">${colsHtml}</div>
              <div id="axd_empty" style="display:none;text-align:center;font-size:13px;color:#94a3b8;padding:12px 0">Không tìm thấy tài sản phù hợp</div>
            </div>`;
          document.getElementById('axd_search').addEventListener('input', function () {
            const term = this.value.toLowerCase().trim();
            let vis = 0;
            assetsSec.querySelectorAll('.axd-col').forEach(col => {
              let colVis = 0;
              col.querySelectorAll('.axd-item').forEach(item => {
                const show = !term || item.dataset.val.includes(term);
                item.style.display = show ? '' : 'none';
                if (show) colVis++;
              });
              col.querySelector('.axd-cnt').textContent = colVis;
              col.querySelector('.axd-of').style.display = term ? '' : 'none';
              col.style.display = colVis ? '' : 'none';
              vis += colVis;
            });
            const badge = document.getElementById('axd_badge');
            if (badge) badge.textContent = term ? `${vis} / ${total}` : total;
            const empty = document.getElementById('axd_empty');
            if (empty) empty.style.display = vis ? 'none' : '';
          });
        }
      }
    }

    if (c.type !== 'dealer') return;
    const ecSec = document.getElementById('dt_ec');
    if (!ecSec) return;
    const res = await api.get(`/admin/customers/${c.id}/end-customers`, { silent: true }).catch(() => null);
    if (!res) { ecSec.innerHTML = ''; return; }
    const items = res.items || [];
    if (!items.length) { ecSec.innerHTML = '<div style="font-size:13px;color:#94a3b8;margin-top:10px">Chưa có khách con</div>'; return; }
    const ecRows = items.map((ec, i) =>
      `<div class="ec-item" data-val="${escape((ec.full_name + ' ' + (ec.phone || '') + ' ' + ec.code).toLowerCase())}"
        style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:7px 12px;border-bottom:1px solid #e0f2fe;flex-wrap:wrap;background:${i % 2 ? '#f7fbff' : '#fff'}">
        <div style="min-width:0;flex:1">
          <span style="font-weight:600;font-size:13px">${escape(ec.full_name)}</span>
          ${ec.phone ? `<a href="tel:${escape(ec.phone)}" style="color:#0369a1;font-size:13px;margin-left:8px">${escape(ec.phone)}</a>` : ''}
          <span style="color:#94a3b8;font-size:11px;margin-left:6px">(${escape(ec.code)})</span>
          ${ec.address ? `<div style="font-size:11.5px;color:#64748b;margin-top:2px">📍 ${escape(ec.address)}</div>` : ''}
        </div>
        <span style="font-size:12px;color:#0369a1;flex-shrink:0;background:#e0f2fe;border-radius:999px;padding:2px 9px;white-space:nowrap;margin-top:2px">${ec.order_count} đơn</span>
      </div>`
    ).join('');
    ecSec.innerHTML = `
      <div style="border:1px solid #bae6fd;border-radius:10px;padding:14px 16px;background:#f7fbff;margin-top:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;flex-wrap:wrap">
          <span style="font-weight:700;font-size:13px;color:#0369a1">
            👥 Khách con / Đầu cuối
            <span id="ec_badge" style="background:#e0f2fe;border:1px solid #bae6fd;border-radius:999px;padding:2px 9px;font-size:12px;color:#0369a1;margin-left:4px">${items.length}</span>
          </span>
          <input id="ec_search" type="text" placeholder="🔍 Tìm khách con…"
            style="border:1px solid #bae6fd;border-radius:6px;padding:5px 10px;font-size:12.5px;width:180px;outline:none;transition:border .15s"
            onfocus="this.style.borderColor='#38bdf8'" onblur="this.style.borderColor='#bae6fd'">
        </div>
        <div style="max-height:260px;overflow-y:auto;border:1px solid #bae6fd;border-radius:6px;background:#fff;box-shadow:inset 0 2px 4px rgba(0,0,0,.03)" id="ec_list">${ecRows}</div>
        <div id="ec_empty" style="display:none;text-align:center;font-size:13px;color:#94a3b8;padding:10px 0">Không tìm thấy</div>
      </div>`;
    document.getElementById('ec_search').addEventListener('input', function () {
      const term = this.value.toLowerCase().trim();
      let vis = 0;
      ecSec.querySelectorAll('.ec-item').forEach(item => {
        const show = !term || item.dataset.val.includes(term);
        item.style.display = show ? '' : 'none';
        if (show) vis++;
      });
      const badge = document.getElementById('ec_badge');
      if (badge) badge.textContent = term ? `${vis} / ${items.length}` : items.length;
      const list  = document.getElementById('ec_list');
      const empty = document.getElementById('ec_empty');
      if (list)  list.style.display  = vis ? '' : 'none';
      if (empty) empty.style.display = vis ? 'none' : '';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    init();
    bindAssetsAndRequests();
  });
})();
