// Logic trang admin/customers — dung api.* voi UI tu dong (ui.js).

(function () {
  const $   = (id) => document.getElementById(id);
  const IS_ADMIN = (window.auth && auth.isAdmin && auth.isAdmin()) || false;
  const fmt = new Intl.NumberFormat('vi-VN');

  // Vo hieu hoa cac field tien-bac doi voi staff (debt_limit, credit_term_days,
  // discount_rate, default_tier_id). BE da chan, FE chi cho dep mat.
  function lockAdminFields() {
    if (IS_ADMIN) return;
    ['f_debt_limit', 'f_credit_term_days', 'f_discount_rate', 'f_default_tier_id'].forEach(id => {
      const el = $(id);
      if (!el) return;
      el.disabled = true;
      el.title = 'Chi admin moi sua duoc';
    });
  }

  const state = {
    filters: { code: '', type: '', name: '', phone: '' },
    page: 1, limit: 20, total: 0,
  };

  let lastItems = [];

  // ---- Util ---------------------------------------------------
  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  // ---- Render -------------------------------------------------
  function avatarCell(c) {
    if (c.avatar_url) return `<img src="${c.avatar_url}" alt="" class="avatar-cell">`;
    const i = (c.full_name || '?').trim().charAt(0).toUpperCase();
    return `<div class="avatar-placeholder">${i}</div>`;
  }
  function nameCell(c) {
    if (c.type === 'dealer' && c.company_name) {
      return `<strong>${escape(c.company_name)}</strong><br><small class="text-muted">${escape(c.full_name)}</small>`;
    }
    return escape(c.full_name);
  }
  function typeBadge(t) {
    return t === 'dealer'
      ? '<span class="pill amber">🏪 Đại lý</span>'
      : '<span class="pill blue">👤 Khách lẻ</span>';
  }
  function pwBadge(c) {
    if (c.type !== 'dealer') return '';
    return c.has_password
      ? '<span class="pill green" title="Đã có mật khẩu" style="font-size:10px">🔒</span>'
      : '<span class="pill red" title="Chưa có mật khẩu" style="font-size:10px">🔓</span>';
  }
  function actionsCell(c) {
    return `
      <button class="btn" data-act="assets" data-id="${c.id}">Tài sản</button>
      <button class="btn" data-act="edit" data-id="${c.id}">Sửa</button>
      <button class="btn danger" data-act="del" data-id="${c.id}">Xóa</button>
    `;
  }
  function renderRows(items) {
    const tb = $('tbody');
    if (!items.length) {
      tb.innerHTML = `<tr><td colspan="9" class="text-center text-muted" style="padding:24px">Không có khách hàng phù hợp</td></tr>`;
      return;
    }
    tb.innerHTML = items.map(c => `
      <tr data-id="${c.id}" style="cursor:pointer">
        <td>${avatarCell(c)}</td>
        <td data-label="Mã"><b>${escape(c.code)}</b> ${pwBadge(c)}</td>
        <td data-label="Loại">${typeBadge(c.type)}</td>
        <td data-label="Họ tên">${nameCell(c)}</td>
        <td data-label="SĐT">${escape(c.phone || '')}</td>
        <td data-label="Tổng đơn" style="text-align:right">${fmt.format(c.order_count || 0)}</td>
        <td data-label="Tổng tiền" style="text-align:right">${fmt.format(c.total_revenue || 0)}đ</td>
        ${c.type === 'dealer'
          ? `<td data-label="Hạn mức nợ">${fmt.format(c.debt_limit || 0)}</td>`
          : `<td data-label="Hạn mức nợ" class="muted-dash">—</td>`}
        <td data-label="Hành động" class="col-actions">${actionsCell(c)}</td>
      </tr>
    `).join('');
  }

  // ---- Load ---------------------------------------------------
  async function load() {
    const p = new URLSearchParams();
    Object.entries(state.filters).forEach(([k, v]) => { if (v) p.set(k, v); });
    p.set('page', state.page);
    p.set('limit', state.limit);

    const res = await api.get('/admin/customers?' + p.toString()).catch(() => null);
    if (!res) return;
    state.total = res.total;
    lastItems = res.items;
    renderRows(res.items);

    const totalPage = Math.max(1, Math.ceil(res.total / state.limit));
    $('pageInfo').textContent = `Trang ${state.page} / ${totalPage} — ${res.total} khách hàng`;
    $('prevPage').disabled = state.page <= 1;
    $('nextPage').disabled = state.page >= totalPage;
  }

  // ---- Modal them/sua ----------------------------------------
  // Hien tai dang sua khach hang nao (de modal con xu ly nut "Doi MK")
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
    Money.set($('f_debt_limit'), c.debt_limit || 0);
    $('f_credit_term_days').value  = c.credit_term_days || 0;
    $('f_discount_rate').value     = c.discount_rate || 0;
    $('f_default_tier_id').value   = c.default_tier_id || '';
    $('f_note').value           = c.note || '';
    lockAdminFields();
  }

  function toggleDealerBlock() {
    const isDealer = $('f_type').value === 'dealer';
    $('dealerFields').classList.toggle('hide', !isDealer);

    // Khoi password chi hien khi edit dealer (co san trong DB)
    const showPwBlock = isDealer && editing && editing.id;
    $('pwBlock').classList.toggle('hide', !showPwBlock);
    if (showPwBlock) {
      $('pwStatus').innerHTML = editing.has_password
        ? '<span class="pill green" style="font-size:11px">🔒 Đã đặt mật khẩu</span>'
        : '<span class="pill red" style="font-size:11px">🔓 Chưa có mật khẩu — đại lý không thể đăng nhập</span>';
    }
  }

  function readForm() {
    const data = {
      type:       $('f_type').value,
      code:       $('f_code').value.trim(),
      full_name:  $('f_full_name').value.trim(),
      phone:      $('f_phone').value.trim() || null,
      email:      $('f_email').value.trim() || null,
      address:    $('f_address').value.trim() || null,
      avatar_url: $('f_avatar_url').value.trim() || null,
      default_tier_id: $('f_default_tier_id').value ? Number($('f_default_tier_id').value) : null,
      parent_id:  $('f_parent_id').value ? Number($('f_parent_id').value) : null,
      note:       $('f_note').value.trim() || null,
    };
    if (data.type === 'dealer') {
      data.company_name     = $('f_company_name').value.trim() || null;
      data.tax_code         = $('f_tax_code').value.trim() || null;
      data.contact_person   = $('f_contact_person').value.trim() || null;
      data.debt_limit       = Money.get($('f_debt_limit'));
      data.credit_term_days = Number($('f_credit_term_days').value) || 0;
      data.discount_rate    = Number($('f_discount_rate').value) || 0;
    }
    return data;
  }

  // ---- Avatar upload ----------------------------------------
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
    if (file.size > 5 * 1024 * 1024) {
      ui.toast('Ảnh quá 5MB', 'warning');
      e.target.value = '';
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    const res = await api.post('/admin/uploads', { dataUrl, folder: 'avatars' }, {
      loading: true,
    }).catch(() => null);
    if (!res) return;
    $('f_avatar_url').value   = res.url;
    $('f_avatar_preview').src = res.url;
  }

  // ---- Submit ------------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault();
    const id = $('f_id').value;
    const data = readForm();
    $('btnSave').disabled = true;

    const ok = await (id
      ? api.put('/admin/customers/' + id, data, {
          successMessage: 'Đã cập nhật khách hàng',
          errorMessages: { 409: 'Mã khách hàng đã tồn tại' },
          loading: true,
        })
      : api.post('/admin/customers', data, {
          successMessage: 'Đã tạo khách hàng',
          errorMessages: { 409: 'Mã khách hàng đã tồn tại' },
          loading: true,
        })
    ).catch(() => null);

    $('btnSave').disabled = false;
    if (!ok) return;
    closeModal();
    load();
    if ($('assetsModal').classList.contains('open') && assetsState.customer) {
      reloadAssets();
    }
  }

  async function handlePwSubmit(e) {
    e.preventDefault();
    const id = $('pw_id').value;
    const password = $('pw_new').value;
    if (password.length < 4) return ui.toast('Tối thiểu 4 ký tự', 'warning');

    const ok = await api.post('/admin/customers/' + id + '/password', { password }, {
      successMessage: 'Đã đổi mật khẩu',
    }).catch(() => null);
    if (!ok) return;
    closePwModal();

    // Cap nhat trang thai password trong form sua dang mo (neu trung id)
    if (editing && String(editing.id) === String(id)) {
      editing.has_password = true;
      toggleDealerBlock();
    }
    load();
  }

  // ---- Click "Đổi mật khẩu" trong form sửa ------------------
  function handleChangePwClick() {
    if (!editing || !editing.id) return;
    openPwModal(editing.id, editing.full_name, editing.code);
  }

  // ---- Table actions ----------------------------------------
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
      const yes = await ui.confirm({
        title: 'Xác nhận xoá',
        message: 'Bạn có chắc muốn xoá khách hàng này?',
        type: 'warning',
        okText: 'Xoá',
      });
      if (!yes) return;
      const ok = await api.delete('/admin/customers/' + id, {
        successMessage: 'Đã xoá khách hàng',
      }).catch(() => null);
      if (ok) load();
    }
  }

  // ---- Filter handlers --------------------------------------
  function bindFilters() {
    let timer;
    document.querySelectorAll('[data-filter]').forEach(input => {
      const ev = input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(ev, () => {
        clearTimeout(timer);
        const apply = () => {
          state.filters[input.dataset.filter] = input.value.trim();
          state.page = 1;
          load();
        };
        // Select: apply ngay; input: debounce
        if (ev === 'change') apply();
        else                 timer = setTimeout(apply, 300);
      });
    });
  }

  // ---- Sticky filter row sync ------------------------------
  // Do chieu cao row 1 (ten cot) -> set CSS var de filter row sticky
  // dinh ngay duoi mep duoi cua row 1, khong bi che hoac ho.
  function syncStickyOffset() {
    const row1 = document.querySelector('.flex-page table.data thead tr:first-child');
    if (!row1) return;
    const h = row1.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--th-row1-h', h + 'px');
  }

  // ---- Init ---------------------------------------------------
  function init() {
    adminShell.init('customers');
    bindFilters();

    $('prevPage').addEventListener('click', () => { state.page--; load(); });
    $('nextPage').addEventListener('click', () => { state.page++; load(); });

    $('btnAdd').addEventListener('click', () => openModal(null));
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

    // Dong bo top cua filter row khi load + resize
    syncStickyOffset();
    window.addEventListener('resize', syncStickyOffset);

    loadTiers();
    load();
  }

  // ---- Load price_tiers vao dropdown "Muc gia ap dung" -----
  async function loadTiers() {
    const r = await api.get('/admin/price-tiers', { silent: true }).catch(() => null);
    if (!r || !r.items) return;
    const opts = `<option value="">— Theo mức Mặc định chung —</option>` +
      r.items.map(t => {
        const label = t.is_default ? `${escape(t.name)} ⭐ (mặc định chung)` : escape(t.name);
        return `<option value="${t.id}">${label}</option>`;
      }).join('');
    $('f_default_tier_id').innerHTML = opts;
  }

  // ============================================================
  // ASSETS MODAL — 1 form gop: 3 nhom (account/vehicle/sim) tren cung
  // form, sua inline + checkbox xoa + them dong moi, bam Luu = batch.
  // Admin sua truc tiep, khong qua duyet.
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
    // Neu la dealer -> load them khach dau cuoi
    if (assetsState.customer.type === 'dealer') renderEndCustomers();
  }

  function renderAssetForm() {
    const original = {};
    const sectionsHtml = AX_KINDS.map(cfg => {
      const list = assetsState.data[cfg.listKey] || [];
      const rowsHtml = list.map(it => {
        original[`${cfg.kind}:${it.id}`] = it[cfg.valCol];
        return `<div class="af-row ax-row" data-kind="${cfg.kind}" data-id="${it.id}">
          <input class="input ax-val" value="${escape(it[cfg.valCol])}">
          <label class="af-del-toggle"><input type="checkbox" class="ax-del"> Xoá</label>
        </div>`;
      }).join('') || `<div class="af-empty">Chưa có ${escape(cfg.label.toLowerCase())} nào</div>`;

      return `<div class="af-section af-section--${cfg.kind}">
        <h4>
          <span class="af-icon">${cfg.icon}</span>
          <span>${escape(cfg.label)}</span>
          <span class="af-count">${list.length}</span>
        </h4>
        ${rowsHtml}
        <div class="af-new-wrap" data-ax-new="${cfg.kind}">
          <div class="af-new-row">
            <input class="input ax-new-val" placeholder="${escape(cfg.placeholder)}">
            <button type="button" class="af-add-row" data-ax-add-row="${cfg.kind}">+ Thêm</button>
          </div>
        </div>
      </div>`;
    }).join('');

    assetsState.original = original;
    $('ax_body').innerHTML = `<div class="asset-form">
      <p class="af-hint">Sửa trực tiếp ô cũ, tích <b style="color:#dc2626">Xoá</b> để bỏ, hoặc nhập dòng mới. Bấm <b>Lưu thay đổi</b> để áp dụng tất cả.</p>
      ${sectionsHtml}
    </div>
    ${assetsState.customer.type === 'dealer' ? '<div id="ax_ec_section" style="margin-top:16px;padding-top:14px;border-top:2px dashed #bae6fd"><p style="color:#94a3b8;font-size:13px;padding:0 4px">Đang tải khách đầu cuối…</p></div>' : ''}`;
  }

  // Hien thi danh sach khach dau cuoi cua dai ly
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
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        openModal({ type: 'retail', parent_id: assetsState.customer.id });
      });
    }

    $sec.querySelectorAll('button[data-ec-edit]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.ecEdit;
        const c = await api.get('/admin/customers/' + id).catch(() => null);
        if (c) openModal(c);
      });
    });

    // Wire nut "Tai san" cho tung khach dau cuoi
    $sec.querySelectorAll('button[data-ec-assets]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ec = {
          id:        Number(btn.dataset.ecAssets),
          full_name: btn.dataset.ecName,
          code:      btn.dataset.ecCode,
          type:      btn.dataset.ecType || 'retail',
        };
        openAssetsModal(ec);
      });
    });
  }


  async function saveAssets() {
    if (!assetsState.customer) return;
    const cid = assetsState.customer.id;
    const calls = [];

    document.querySelectorAll('#ax_body .ax-row').forEach(row => {
      const kind = row.dataset.kind;
      const id   = Number(row.dataset.id);
      const inp  = row.querySelector('.ax-val');
      const del  = row.querySelector('.ax-del');
      if (!inp) return;
      const newVal = (inp.value || '').trim();
      const oldVal = assetsState.original[`${kind}:${id}`] || '';
      if (del && del.checked) {
        calls.push({ method: 'delete', url: `/admin/customer-assets/${cid}/${kind}/${id}`, body: null });
      } else if (newVal && newVal !== oldVal) {
        calls.push({ method: 'put', url: `/admin/customer-assets/${cid}/${kind}/${id}`, body: { value: newVal } });
      }
    });
    AX_KINDS.forEach(cfg => {
      document.querySelectorAll(`#ax_body [data-ax-new="${cfg.kind}"] .ax-new-val`).forEach(inp => {
        const v = (inp.value || '').trim();
        if (v) calls.push({ method: 'post', url: `/admin/customer-assets/${cid}/${cfg.kind}`, body: { value: v } });
      });
    });

    if (!calls.length) { ui.toast('Không có thay đổi', 'info'); return; }

    const results = await Promise.all(calls.map(c =>
      (c.method === 'delete'
        ? api.delete(c.url, { onError: 'silent' })
        : c.method === 'put'
          ? api.put(c.url, c.body, { onError: 'silent' })
          : api.post(c.url, c.body, { onError: 'silent' })
      ).catch(() => null)
    ));
    const okCount   = results.filter(Boolean).length;
    const failCount = results.length - okCount;
    if (okCount)   ui.toast(`Đã cập nhật ${okCount} mục`, 'success');
    if (failCount) ui.toast(`${failCount} mục lưu lỗi`, 'error');
    await reloadAssets();
  }

  // ============================================================
  // REQUESTS MODAL — duyet de xuat KTV
  // ============================================================
  const reqState = { status: 'pending', autoApprove: false };

  function renderAutoApproveToggle() {
    const on = reqState.autoApprove;
    $('rqToggleTrack').classList.toggle('on', on);
    $('rqToggleLabel').innerHTML = `Tự động duyệt: <b>${on ? 'Bật' : 'Tắt'}</b>`;
  }

  async function openReqModal() {
    reqState.status = 'pending';
    document.querySelectorAll('#reqModal .tab').forEach(b => {
      b.classList.toggle('on', b.dataset.status === 'pending');
    });
    $('reqModal').classList.add('open');
    // Load trang thai tu dong duyet
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
    const ok = await api.post(`/admin/customer-assets/requests/${id}/approve`, {}, {
      successMessage: 'Đã duyệt',
    }).catch(() => null);
    if (ok) { reloadRequests(); refreshReqBadge(); }
  }
  async function rejectReq(id) {
    const note = window.prompt('Lý do từ chối (tuỳ chọn):', '');
    if (note === null) return;
    const ok = await api.post(`/admin/customer-assets/requests/${id}/reject`, { review_note: note || null }, {
      successMessage: 'Đã từ chối',
    }).catch(() => null);
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
    // Delegation cho body modal: nut "+ Them dong", nut xoa dong moi, checkbox Xoa
    $('ax_body').addEventListener('click', (e) => {
      const addBtn = e.target.closest('button[data-ax-add-row]');
      if (addBtn) {
        const kind = addBtn.dataset.axAddRow;
        const cfg = AX_KINDS.find(k => k.kind === kind);
        const wrap = document.querySelector(`#ax_body [data-ax-new="${kind}"]`);
        if (!wrap || !cfg) return;
        const div = document.createElement('div');
        div.className = 'af-new-row';
        div.innerHTML = `<input class="input ax-new-val" placeholder="${escape(cfg.placeholder)}">
          <button type="button" class="af-new-del" title="Bỏ dòng">×</button>`;
        wrap.appendChild(div);
        div.querySelector('.af-new-del').addEventListener('click', () => div.remove());
        div.querySelector('input').focus();
        return;
      }
    });
    $('ax_body').addEventListener('change', (e) => {
      const cb = e.target.closest('.ax-del');
      if (cb) cb.closest('.ax-row').classList.toggle('is-deleted', cb.checked);
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
      const ok = await api.put('/admin/settings', { key: 'assets.auto_approve', value: newVal },
        { silent: true }).catch(() => null);
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
  // DETAIL MODAL — xem chi tiet khach hang khi click row
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

  function closeDetailModal() {
    $('detailModal').classList.remove('open');
  }

  function renderDetailStatic(c) {
    const av = c.avatar_url
      ? `<img src="${escape(c.avatar_url)}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;flex-shrink:0">`
      : `<div style="width:64px;height:64px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#64748b;flex-shrink:0">${escape((c.full_name||'?').trim().charAt(0).toUpperCase())}</div>`;

    return `
      <div style="display:flex;gap:16px;align-items:flex-start;padding-bottom:16px;border-bottom:1px solid #e2e8f0;margin-bottom:16px">
        ${av}
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            ${typeBadge(c.type)}
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

      ${c.type === 'dealer' ? `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:16px">
        <div style="font-weight:600;color:#92400e;margin-bottom:8px">🏪 Thông tin đại lý</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px">
          ${c.company_name ? `<div><span style="color:#64748b">Công ty:</span> <b>${escape(c.company_name)}</b></div>` : ''}
          ${c.tax_code ? `<div><span style="color:#64748b">MST:</span> ${escape(c.tax_code)}</div>` : ''}
          ${c.contact_person ? `<div><span style="color:#64748b">Người LH:</span> ${escape(c.contact_person)}</div>` : ''}
          <div><span style="color:#64748b">Hạn mức nợ:</span> ${fmt.format(c.debt_limit || 0)}đ</div>
          <div><span style="color:#64748b">Số ngày nợ:</span> ${c.credit_term_days || 0} ngày</div>
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

    // ---- Tải tài sản ----
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
                <div style="font-size:12px;font-weight:700;color:${a.color};margin-bottom:6px;
                            display:flex;align-items:center;gap:5px">
                  <span>${a.icon} ${a.label}</span>
                  <span class="axd-cnt" style="background:${a.bg};border:1px solid ${a.border};
                    color:${a.color};border-radius:999px;padding:1px 8px;font-size:11px;font-weight:600">${list.length}</span>
                  <span class="axd-of" style="display:none;font-size:11px;color:#94a3b8">/ ${list.length}</span>
                </div>
                <div style="max-height:220px;overflow-y:auto;border:1px solid ${a.border};
                            border-radius:6px;background:#fff;box-shadow:inset 0 2px 4px rgba(0,0,0,.03)">${rowsHtml}</div>
              </div>`;
          }).filter(Boolean).join('');

          assetsSec.innerHTML = `
            <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;background:#fafafa">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap">
                <span style="font-weight:700;font-size:13px;color:#334155">
                  🗂 Tài sản đăng ký
                  <span id="axd_badge" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:999px;
                    padding:2px 9px;font-size:12px;color:#64748b;margin-left:4px">${total}</span>
                </span>
                <input id="axd_search" type="text" placeholder="🔍 Tìm trong tài sản…"
                  style="border:1px solid #e2e8f0;border-radius:6px;padding:5px 10px;font-size:12.5px;
                         width:210px;outline:none;transition:border .15s"
                  onfocus="this.style.borderColor='#818cf8'" onblur="this.style.borderColor='#e2e8f0'">
              </div>
              <div id="axd_cols" style="display:flex;gap:14px;flex-wrap:wrap">${colsHtml}</div>
              <div id="axd_empty" style="display:none;text-align:center;font-size:13px;
                color:#94a3b8;padding:12px 0">Không tìm thấy tài sản phù hợp</div>
            </div>`;

          document.getElementById('axd_search').addEventListener('input', function () {
            const term = this.value.toLowerCase().trim();
            let vis = 0;
            assetsSec.querySelectorAll('.axd-col').forEach(col => {
              let colVis = 0;
              const allItems = col.querySelectorAll('.axd-item');
              allItems.forEach(item => {
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

    // ---- Tải khách con ----
    const ecSec = document.getElementById('dt_ec');
    if (!ecSec) return;
    const res = await api.get(`/admin/customers/${c.id}/end-customers`, { silent: true }).catch(() => null);
    if (!res) { ecSec.innerHTML = ''; return; }
    const items = res.items || [];

    if (!items.length) {
      ecSec.innerHTML = '<div style="font-size:13px;color:#94a3b8;margin-top:10px">Chưa có khách con</div>';
      return;
    }

    const ecRows = items.map((ec, i) =>
      `<div class="ec-item" data-val="${escape((ec.full_name + ' ' + (ec.phone || '') + ' ' + ec.code).toLowerCase())}"
        style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;
               padding:7px 12px;border-bottom:1px solid #e0f2fe;flex-wrap:wrap;
               background:${i % 2 ? '#f7fbff' : '#fff'}">
        <div style="min-width:0;flex:1">
          <span style="font-weight:600;font-size:13px">${escape(ec.full_name)}</span>
          ${ec.phone ? `<a href="tel:${escape(ec.phone)}" style="color:#0369a1;font-size:13px;margin-left:8px">${escape(ec.phone)}</a>` : ''}
          <span style="color:#94a3b8;font-size:11px;margin-left:6px">(${escape(ec.code)})</span>
          ${ec.address ? `<div style="font-size:11.5px;color:#64748b;margin-top:2px">📍 ${escape(ec.address)}</div>` : ''}
        </div>
        <span style="font-size:12px;color:#0369a1;flex-shrink:0;background:#e0f2fe;
          border-radius:999px;padding:2px 9px;white-space:nowrap;margin-top:2px">${ec.order_count} đơn</span>
      </div>`
    ).join('');

    ecSec.innerHTML = `
      <div style="border:1px solid #bae6fd;border-radius:10px;padding:14px 16px;background:#f7fbff;margin-top:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;flex-wrap:wrap">
          <span style="font-weight:700;font-size:13px;color:#0369a1">
            👥 Khách con / Đầu cuối
            <span id="ec_badge" style="background:#e0f2fe;border:1px solid #bae6fd;border-radius:999px;
              padding:2px 9px;font-size:12px;color:#0369a1;margin-left:4px">${items.length}</span>
          </span>
          <input id="ec_search" type="text" placeholder="🔍 Tìm khách con…"
            style="border:1px solid #bae6fd;border-radius:6px;padding:5px 10px;font-size:12.5px;
                   width:180px;outline:none;transition:border .15s"
            onfocus="this.style.borderColor='#38bdf8'" onblur="this.style.borderColor='#bae6fd'">
        </div>
        <div style="max-height:260px;overflow-y:auto;border:1px solid #bae6fd;border-radius:6px;
                    background:#fff;box-shadow:inset 0 2px 4px rgba(0,0,0,.03)" id="ec_list">${ecRows}</div>
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
