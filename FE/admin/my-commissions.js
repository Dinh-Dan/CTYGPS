// /admin/my-commissions.html — Nhân viên (role=staff) tự gửi/quản lý yêu cầu hoa hồng.
(function () {
  adminShell.init('my-commissions');

  const $ = id => document.getElementById(id);

  function fmt(n) { return Number(n || 0).toLocaleString('vi-VN'); }
  function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function fmtDate(v) {
    if (!v) return '—';
    const d = new Date(v);
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  }

  const state = { page: 1, total: 0, limit: 50 };

  // ---- Tra cứu đơn theo mã ----
  let lookupTimer = null;
  let lookedOrderId = null;

  $('fOrderCode').addEventListener('input', () => {
    clearTimeout(lookupTimer);
    const code = $('fOrderCode').value.trim();
    if (!code) { $('orderLookup').textContent = ''; lookedOrderId = null; return; }
    lookupTimer = setTimeout(() => lookupOrder(code), 500);
  });

  async function lookupOrder(code) {
    $('orderLookup').textContent = 'Đang tìm...';
    lookedOrderId = null;
    const data = await api.get(`/admin/orders?q=${encodeURIComponent(code)}&limit=5`, { onError: 'toast' });
    if (!data || !data.items || !data.items.length) {
      $('orderLookup').innerHTML = '<span style="color:#dc2626">Không tìm thấy đơn.</span>';
      return;
    }
    const match = data.items.find(o => o.code === code) || data.items[0];
    lookedOrderId = match.id;
    $('orderLookup').innerHTML = `Tìm thấy: <b>${esc(match.code)}</b> — ${esc(match.customer_name || '—')} · ${esc(match.status || '')}`;
  }

  // ---- Gửi yêu cầu ----
  $('btnSubmit').addEventListener('click', async () => {
    const code   = $('fOrderCode').value.trim();
    const amount = Math.max(0, Math.round(Number($('fAmount').value) || 0));
    const note   = $('fNote').value.trim();

    if (!code)   { ui.toast('Nhập mã đơn hàng', 'error'); return; }
    if (!amount) { ui.toast('Nhập số tiền hoa hồng', 'error'); return; }
    if (!lookedOrderId) {
      ui.toast('Chưa tìm thấy đơn. Nhập mã đúng và đợi hệ thống tra cứu.', 'error');
      return;
    }

    const r = await api.post(
      `/admin/orders/${lookedOrderId}/my-staff-commission-request`,
      { amount, note: note || null },
      { onError: 'toast' }
    );
    if (r) {
      ui.toast('Đã gửi yêu cầu hoa hồng. Admin sẽ xét duyệt sớm.', 'success');
      $('fOrderCode').value = '';
      $('fAmount').value = '';
      $('fNote').value = '';
      $('orderLookup').textContent = '';
      lookedOrderId = null;
      state.page = 1;
      load();
    }
  });

  // ---- Load danh sách ----
  async function load() {
    const tbody = $('mcTbody');
    tbody.innerHTML = `<tr><td colspan="7" class="mc-empty">Đang tải...</td></tr>`;

    const data = await api.get(
      `/admin/orders/my-staff-commission-requests?page=${state.page}&limit=${state.limit}`,
      { onError: 'toast' }
    );
    if (!data) return;
    state.total = data.total || 0;
    renderPager();

    if (!data.items || !data.items.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="mc-empty">Chưa có yêu cầu nào. Dùng form trên để gửi yêu cầu.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.items.map(r => {
      const approved = !!r.approved_at;
      const pill = approved
        ? `<span class="pill-approved">✓ Đã duyệt</span>`
        : `<span class="pill-pending">⏳ Chờ duyệt</span>`;
      const withdrawBtn = !approved
        ? `<button class="btn danger sm btn-withdraw" data-oid="${r.order_id}" data-cid="${r.id}">✗ Rút</button>`
        : '';
      return `
        <tr>
          <td><a href="/admin/orders.html#order-${r.order_id}" style="font-weight:700;color:#1e40af">${esc(r.order_code)}</a>${ui.copyCodeBtn(r.order_code)}</td>
          <td>${esc(r.customer_name || '—')}</td>
          <td class="mc-amount">+ ${fmt(r.amount)}đ</td>
          <td class="mc-note">${r.note ? esc(r.note) : '<span style="color:#cbd5e1">—</span>'}</td>
          <td class="mc-meta">${fmtDate(r.requested_at)}</td>
          <td>${pill}${approved ? `<div class="mc-meta">Duyệt: ${fmtDate(r.approved_at)}<br>bởi ${esc(r.approved_by_name || '—')}</div>` : ''}</td>
          <td>${withdrawBtn}</td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('.btn-withdraw').forEach(btn => {
      btn.addEventListener('click', () => withdrawRequest(
        Number(btn.dataset.oid), Number(btn.dataset.cid)
      ));
    });
  }

  async function withdrawRequest(orderId, cid) {
    const yes = await ui.confirm({
      title: 'Rút yêu cầu hoa hồng?',
      message: 'Yêu cầu sẽ bị xoá. Bạn có thể gửi lại sau.',
      okText: 'Rút yêu cầu', okClass: 'danger',
    });
    if (!yes) return;
    const r = await api.delete(`/admin/orders/${orderId}/my-staff-commission-request/${cid}`, { onError: 'toast' });
    if (r) { ui.toast('Đã rút yêu cầu', 'success'); load(); }
  }

  function renderPager() {
    const pager = $('mcPager');
    const totalPages = Math.ceil(state.total / state.limit) || 1;
    if (totalPages <= 1) { pager.innerHTML = ''; return; }
    pager.innerHTML = `
      <span style="font-size:13px;color:#64748b">Trang ${state.page}/${totalPages} (${state.total})</span>
      <button class="btn ghost sm" id="btnPrev" ${state.page<=1?'disabled':''}>‹ Trước</button>
      <button class="btn ghost sm" id="btnNext" ${state.page>=totalPages?'disabled':''}>Tiếp ›</button>`;
    const prev = $('btnPrev'), next = $('btnNext');
    if (prev) prev.addEventListener('click', () => { state.page--; load(); });
    if (next) next.addEventListener('click', () => { state.page++; load(); });
  }

  $('btnRefresh').addEventListener('click', () => { state.page = 1; load(); });

  load();
})();
