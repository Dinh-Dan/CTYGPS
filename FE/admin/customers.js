// Logic trang admin/customers — dung api.* voi UI tu dong (ui.js).

(function () {
  const $   = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  const state = {
    filters: { code: '', type: '', name: '', phone: '', email: '' },
    page: 1, limit: 20, total: 0,
  };

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
      <button class="btn ghost sm" data-act="edit" data-id="${c.id}">Sửa</button>
      <button class="btn ghost sm" data-act="del" data-id="${c.id}" style="color:#dc2626">Xóa</button>
    `;
  }
  function renderRows(items) {
    const tb = $('tbody');
    if (!items.length) {
      tb.innerHTML = `<tr><td colspan="9" class="text-center text-muted" style="padding:24px">Không có khách hàng phù hợp</td></tr>`;
      return;
    }
    tb.innerHTML = items.map(c => `
      <tr>
        <td>${avatarCell(c)}</td>
        <td><b>${escape(c.code)}</b> ${pwBadge(c)}</td>
        <td>${typeBadge(c.type)}</td>
        <td>${nameCell(c)}</td>
        <td>${escape(c.phone || '')}</td>
        <td>${escape(c.email || '')}</td>
        <td>${c.type === 'dealer' ? fmt.format(c.debt_limit || 0) : '<span class="text-muted">—</span>'}</td>
        <td>${c.type === 'dealer' ? (c.credit_term_days || 0) + ' ngày' : '<span class="text-muted">—</span>'}</td>
        <td>${actionsCell(c)}</td>
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
    $('modal').classList.add('open');
    $('modalTitle').textContent = c ? 'Sửa khách hàng' : 'Thêm khách hàng';
    fillForm(c || { type: state.filters.type || 'retail' });
    toggleDealerBlock();
  }
  function closeModal() {
    $('modal').classList.remove('open');
    editing = null;
  }

  function openPwModal(id, name, code) {
    $('pw_id').value = id;
    $('pw_name').textContent = name;
    $('pw_code').textContent = code;
    $('pw_new').value = '';
    $('pwModal').classList.add('open');
    setTimeout(() => $('pw_new').focus(), 50);
  }
  function closePwModal() { $('pwModal').classList.remove('open'); }

  function fillForm(c) {
    $('f_id').value             = c.id || '';
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
    $('f_debt_limit').value        = c.debt_limit || 0;
    $('f_credit_term_days').value  = c.credit_term_days || 0;
    $('f_discount_rate').value     = c.discount_rate || 0;
    $('f_default_tier_id').value   = c.default_tier_id || '';
    $('f_note').value           = c.note || '';
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
      note:       $('f_note').value.trim() || null,
    };
    if (data.type === 'dealer') {
      data.company_name     = $('f_company_name').value.trim() || null;
      data.tax_code         = $('f_tax_code').value.trim() || null;
      data.contact_person   = $('f_contact_person').value.trim() || null;
      data.debt_limit       = Number($('f_debt_limit').value) || 0;
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

    $('tbody').addEventListener('click', handleTableClick);

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

  document.addEventListener('DOMContentLoaded', init);
})();
