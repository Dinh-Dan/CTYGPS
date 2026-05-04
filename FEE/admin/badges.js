// Logic trang admin/badges
(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  const STATUS_LABEL = {
    pending_review: { text: 'Chờ duyệt nội bộ', cls: 'gray' },
    submitted:      { text: 'Đã nộp Sở',        cls: 'blue' },
    approved:       { text: 'Có kết quả',       cls: 'green' },
    rejected:       { text: 'Bị từ chối',       cls: 'red' },
    delivered:      { text: 'Đã giao',          cls: 'purple' },
    cancelled:      { text: 'Huỷ',              cls: 'gray' },
  };
  const VTYPE_LABEL = {
    'truck_under_3.5t': 'Tải dưới 3.5T',
    'truck_over_3.5t':  'Tải trên 3.5T',
    passenger: 'Xe khách', contract: 'Hợp đồng', taxi: 'Taxi', other: 'Khác',
  };

  const state = {
    filters: { q: '', status: '' },
    page: 1, limit: 20, total: 0,
    customers: [],
    detail: null,
  };

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }
  function statusPill(s) {
    const def = STATUS_LABEL[s] || { text: s, cls: 'gray' };
    return `<span class="pill ${def.cls}">${def.text}</span>`;
  }
  function fmtDate(d) {
    if (!d) return '—';
    return String(d).replace('T', ' ').slice(0, 16);
  }

  function rowHtml(b) {
    const customer = b.customer_name
      ? `<b>${escape(b.customer_name)}</b><br><small class="text-muted">${escape(b.customer_phone || '')}</small>`
      : '—';
    return `
      <tr>
        <td><b>${escape(b.code)}</b></td>
        <td>${customer}</td>
        <td>${b.dealer_name ? escape(b.dealer_name) : '<span class="text-muted">—</span>'}</td>
        <td><b>${escape(b.vehicle_plate)}</b></td>
        <td>${VTYPE_LABEL[b.vehicle_type] || b.vehicle_type}</td>
        <td>${fmt.format(b.fee_amount || 0)}đ<br><small class="text-muted">đã thu ${fmt.format(b.paid_amount||0)}đ</small></td>
        <td>${statusPill(b.status)}</td>
        <td><button class="btn ghost sm" data-act="detail" data-id="${b.id}">Chi tiết</button></td>
      </tr>`;
  }

  async function load() {
    const p = new URLSearchParams();
    Object.entries(state.filters).forEach(([k, v]) => { if (v) p.set(k, v); });
    p.set('page', state.page);
    p.set('limit', state.limit);
    const res = await api.get('/admin/badges?' + p.toString()).catch(() => null);
    if (!res) return;
    state.total = res.total;
    if (!res.items.length) {
      $('tbody').innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:24px">Chưa có hồ sơ</td></tr>';
    } else {
      $('tbody').innerHTML = res.items.map(rowHtml).join('');
    }
    const totalPage = Math.max(1, Math.ceil(res.total / state.limit));
    $('pageInfo').textContent = `Trang ${state.page} / ${totalPage} — ${res.total}`;
    $('prevPage').disabled = state.page <= 1;
    $('nextPage').disabled = state.page >= totalPage;
  }

  async function loadCustomers() {
    const r = await api.get('/admin/customers?limit=100', { silent: true }).catch(() => null);
    state.customers = (r && r.items) || [];
  }

  // ---- Modal create -----------------------------------------
  function openModal() {
    $('modal').classList.add('open');
    $('f_plate').value = '';
    $('f_vtype').value = 'truck_under_3.5t';
    $('f_fee').value = 0;
    $('f_status').value = 'pending_review';
    $('f_note').value = '';
    refillCustomers();
  }
  function closeModal() { $('modal').classList.remove('open'); }
  function refillCustomers() {
    const html = ['<option value="">— Chọn khách —</option>'];
    state.customers.forEach(c => {
      html.push(`<option value="${c.id}">${escape(c.code + ' — ' + c.full_name)}</option>`);
    });
    $('f_customer').innerHTML = html.join('');
    const dHtml = ['<option value="">— Không —</option>'];
    state.customers.filter(c => c.type === 'dealer').forEach(c => {
      dHtml.push(`<option value="${c.id}">${escape(c.code + ' — ' + (c.company_name || c.full_name))}</option>`);
    });
    $('f_dealer').innerHTML = dHtml.join('');
  }
  async function handleSubmit(e) {
    e.preventDefault();
    const data = {
      customer_id: Number($('f_customer').value),
      dealer_id: $('f_dealer').value ? Number($('f_dealer').value) : null,
      vehicle_plate: $('f_plate').value.trim(),
      vehicle_type: $('f_vtype').value,
      fee_amount: Number($('f_fee').value) || 0,
      status: $('f_status').value,
      note: $('f_note').value.trim() || null,
    };
    if (!data.customer_id) return ui.toast('Chọn khách', 'warning');
    if (!data.vehicle_plate) return ui.toast('Nhập biển số', 'warning');
    const r = await api.post('/admin/badges', data, {
      successMessage: 'Đã tạo hồ sơ', loading: true,
    }).catch(() => null);
    if (r) { closeModal(); load(); }
  }

  // ---- Modal detail -----------------------------------------
  function renderActionBar(b) {
    const buttons = [];
    if (b.status === 'pending_review') buttons.push(`<button class="btn" data-act="submit">📤 Nộp Sở GTVT</button>`);
    if (b.status === 'submitted') {
      buttons.push(`<button class="btn" data-act="approve">✓ Có kết quả (đã duyệt)</button>`);
      buttons.push(`<button class="btn ghost" data-act="reject" style="color:var(--danger)">✗ Bị từ chối</button>`);
    }
    if (b.status === 'rejected') buttons.push(`<button class="btn" data-act="resubmit">📤 Nộp lại</button>`);
    if (b.status === 'approved') buttons.push(`<button class="btn" data-act="deliver">📦 Đã giao khách</button>`);
    if (Number(b.fee_amount) > Number(b.paid_amount) && !['cancelled'].includes(b.status)) {
      buttons.push(`<button class="btn" data-act="markpaid">💰 Đã nhận đủ tiền</button>`);
    }
    if (!['delivered','cancelled'].includes(b.status)) {
      buttons.push(`<button class="btn ghost" data-act="cancel" style="color:var(--danger)">✗ Huỷ</button>`);
    }
    return buttons.length ? `<div class="action-bar">${buttons.join('')}</div>` : '';
  }
  async function openDetail(id) {
    const b = await api.get('/admin/badges/' + id, { loading: true }).catch(() => null);
    if (!b) return;
    state.detail = b;
    $('detailTitle').textContent = `Hồ sơ ${b.code}`;
    $('detailBody').innerHTML = `
      <div class="grid cols-2" style="font-size:14px">
        <div><b>Khách:</b> ${escape(b.customer_name)} (${escape(b.customer_phone || '')})</div>
        <div><b>Đại lý:</b> ${b.dealer_name ? escape(b.dealer_name) : '—'}</div>
        <div><b>Biển số:</b> <b>${escape(b.vehicle_plate)}</b></div>
        <div><b>Loại xe:</b> ${VTYPE_LABEL[b.vehicle_type] || b.vehicle_type}</div>
        <div><b>Trạng thái:</b> ${statusPill(b.status)}</div>
        <div><b>Phí:</b> ${fmt.format(b.fee_amount)}đ — Đã thu: ${fmt.format(b.paid_amount)}đ</div>
        <div><b>Nộp Sở:</b> ${fmtDate(b.submitted_at)}</div>
        <div><b>Có kết quả:</b> ${fmtDate(b.result_at)}</div>
        <div><b>Đã giao KH:</b> ${fmtDate(b.delivered_at)}</div>
        <div><b>Người tạo:</b> ${escape(b.creator_type)}</div>
      </div>
      ${b.reject_reason ? `<div style="margin-top:8px;background:#fee2e2;padding:8px;border-radius:6px"><b>Lý do từ chối:</b> ${escape(b.reject_reason)}</div>` : ''}
      ${b.note ? `<div style="margin-top:8px"><b>Ghi chú:</b> ${escape(b.note)}</div>` : ''}
      ${renderActionBar(b)}
    `;
    $('detailModal').classList.add('open');
  }
  function closeDetail() { $('detailModal').classList.remove('open'); state.detail = null; }

  async function handleDetailClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn || !state.detail) return;
    const act = btn.dataset.act;
    const id = state.detail.id;
    if (act === 'submit' || act === 'resubmit') {
      const ok = await ui.confirm({ title: 'Nộp Sở GTVT?', message: `Đánh dấu ${state.detail.code} đã nộp Sở?`, okText: 'Nộp' });
      if (!ok) return;
      const r = await api.post(`/admin/badges/${id}/submit`, {}, { successMessage: 'Đã đánh dấu nộp Sở', loading: true }).catch(() => null);
      if (r) { openDetail(id); load(); }
    } else if (act === 'approve') {
      const r = await api.post(`/admin/badges/${id}/result`, { result: 'approved' }, { successMessage: 'Đã ghi nhận có kết quả', loading: true }).catch(() => null);
      if (r) { openDetail(id); load(); }
    } else if (act === 'reject') {
      const reason = prompt('Lý do bị từ chối:');
      if (reason == null) return;
      const r = await api.post(`/admin/badges/${id}/result`, { result: 'rejected', reject_reason: reason }, { successMessage: 'Đã ghi nhận từ chối', loading: true }).catch(() => null);
      if (r) { openDetail(id); load(); }
    } else if (act === 'deliver') {
      const r = await api.post(`/admin/badges/${id}/deliver`, {}, { successMessage: 'Đã giao khách', loading: true }).catch(() => null);
      if (r) { openDetail(id); load(); }
    } else if (act === 'markpaid') {
      const r = await api.post(`/admin/badges/${id}/mark-paid`, {}, { successMessage: 'Đã ghi nhận thanh toán', loading: true }).catch(() => null);
      if (r) { openDetail(id); load(); }
    } else if (act === 'cancel') {
      const reason = prompt('Lý do huỷ:');
      if (reason == null) return;
      const r = await api.post(`/admin/badges/${id}/cancel`, { reason }, { successMessage: 'Đã huỷ', loading: true }).catch(() => null);
      if (r) { openDetail(id); load(); }
    }
  }

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
        if (ev === 'change') apply(); else timer = setTimeout(apply, 300);
      });
    });
  }

  function bindQuickTabs() {
    $('quickTabs').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-status]');
      if (!b) return;
      state.filters.status = b.dataset.status;
      state.page = 1;
      document.querySelectorAll('#quickTabs button').forEach(x => x.classList.toggle('on', x === b));
      load();
    });
  }

  async function init() {
    adminShell.init('badges');
    bindFilters();
    bindQuickTabs();
    await loadCustomers();
    $('btnAdd').addEventListener('click', openModal);
    $('modalClose').addEventListener('click', closeModal);
    $('btnCancel').addEventListener('click', closeModal);
    $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    $('frm').addEventListener('submit', handleSubmit);

    $('detailClose').addEventListener('click', closeDetail);
    $('detailCloseBtn').addEventListener('click', closeDetail);
    $('detailModal').addEventListener('click', (e) => { if (e.target.id === 'detailModal') closeDetail(); });
    $('detailBody').addEventListener('click', handleDetailClick);

    $('prevPage').addEventListener('click', () => { state.page--; load(); });
    $('nextPage').addEventListener('click', () => { state.page++; load(); });
    $('tbody').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act="detail"]');
      if (btn) openDetail(btn.dataset.id);
    });

    load();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
