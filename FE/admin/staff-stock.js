(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Number(n) || 0);
  const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN', { hour12: false }) : '—';

  const state = { staff: [], products: [], holdings: [], history: [], grantRows: [{}] };

  // ---- TABS ----
  document.querySelectorAll('.ss-tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.ss-tab').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.ss-pane').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      document.querySelector(`[data-pane="${t.dataset.tab}"]`).classList.add('active');
      if (t.dataset.tab === 'history') loadHistory();
    });
  });

  // ---- LOAD ----
  async function loadStaff() {
    const r = await api.get('/admin/staff?role=kithuat&limit=200').catch(() => null);
    state.staff = (r && r.items) || [];
  }
  async function loadProducts() {
    const r = await api.get('/admin/products?limit=500').catch(() => null);
    state.products = (r && r.items) || [];
  }
  async function loadHoldings() {
    const r = await api.get('/admin/staff-stock').catch(() => null);
    state.holdings = (r && r.items) || [];
    renderHoldings();
  }
  async function loadHistory() {
    const params = new URLSearchParams();
    const sid = Number($('histStaff').value) || 0;
    if (sid) params.set('staff_id', sid);
    const reason = $('histReason').value;
    if (reason) params.set('reason', reason);
    const from = $('histFrom').value;
    if (from) params.set('date_from', from);
    const to = $('histTo').value;
    if (to) params.set('date_to', to);
    const q = $('histQ').value.trim();
    if (q) params.set('q', q);
    const qs = params.toString();
    const url = qs ? `/admin/staff-stock/history?${qs}` : '/admin/staff-stock/history';
    const r = await api.get(url).catch(() => null);
    state.history = (r && r.items) || [];
    renderHistory();
  }

  // ---- RENDER ----
  function renderHoldings() {
    const $box = $('holdingsList');
    if (!state.holdings.length) {
      $box.innerHTML = '<p style="color:#94a3b8">Chưa có KTV nào</p>';
      return;
    }
    $box.innerHTML = state.holdings.map(s => `
      <div class="holding-card">
        <div class="head">
          <div class="name">${esc(s.full_name)}</div>
          <div class="phone">${esc(s.phone || '')}</div>
        </div>
        ${s.items.length
          ? `<div class="items">${s.items.map(it => `
              <div class="item">${esc(it.product_name)} <span class="qty">${it.qty}</span></div>
            `).join('')}</div>`
          : '<div class="empty">Chưa có sản phẩm</div>'}
      </div>
    `).join('');
  }

  function renderHistory() {
    const $box = $('historyList');
    if (!state.history.length) {
      $box.innerHTML = '<p style="color:#94a3b8">Không có lịch sử</p>';
      return;
    }
    $box.innerHTML = state.history.map(r => {
      const isGrant = r.reason_code === 'staff_grant';
      const items = (r.items || []).map(it => `${esc(it.product_name)} ×${it.qty}`).join(', ');
      const totalQty = (r.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0);
      return `
        <div class="history-row">
          <span class="${isGrant ? 'badge-out' : 'badge-in'}">${isGrant ? 'PHÁT' : 'THU HỒI'}</span>
          <b>${esc(r.code)}</b> · KTV: ${esc(r.staff_name || '—')} · Tổng ${totalQty} SP
          <div class="meta">
            ${fmtDate(r.created_at)}
            ${r.created_by_name ? ' · Người tạo: ' + esc(r.created_by_name) : ''}
            ${r.reason_text ? ' · ' + esc(r.reason_text) : ''}
          </div>
          <div style="margin-top:4px;font-size:12.5px;color:#334155">${esc(items) || '<span style=\"color:#94a3b8\">(không có SP)</span>'}</div>
        </div>
      `;
    }).join('');
  }

  function renderGrantStaffOptions() {
    $('grantStaff').innerHTML = '<option value="">— Chọn KTV —</option>' +
      state.staff.map(s => `<option value="${s.id}">${esc(s.full_name)}</option>`).join('');
    $('histStaff').innerHTML = '<option value="">Tất cả</option>' +
      state.staff.map(s => `<option value="${s.id}">${esc(s.full_name)}</option>`).join('');
  }

  function renderGrantRows() {
    const $tb = $('grantItems');
    $tb.innerHTML = state.grantRows.map((r, i) => `
      <tr data-idx="${i}">
        <td>
          <select class="select prod">
            <option value="">— SP —</option>
            ${state.products.map(p => `<option value="${p.id}" ${p.id === r.product_id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
          </select>
        </td>
        <td><input type="number" class="input qty" min="1" value="${r.qty || 1}"></td>
        <td><textarea class="input imei" rows="1" placeholder="IMEI (tuỳ chọn)">${esc(r.imei_list || '')}</textarea></td>
        <td><button class="btn-x" data-act="del">×</button></td>
      </tr>
    `).join('');
    $tb.querySelectorAll('tr').forEach(tr => {
      const idx = Number(tr.dataset.idx);
      tr.querySelector('.prod').addEventListener('change', e => state.grantRows[idx].product_id = Number(e.target.value));
      tr.querySelector('.qty').addEventListener('input', e => state.grantRows[idx].qty = Number(e.target.value));
      tr.querySelector('.imei').addEventListener('input', e => state.grantRows[idx].imei_list = e.target.value);
      tr.querySelector('[data-act=del]').addEventListener('click', () => {
        state.grantRows.splice(idx, 1);
        if (!state.grantRows.length) state.grantRows.push({});
        renderGrantRows();
      });
    });
  }

  // ---- ACTIONS ----
  async function submitGrant() {
    const staffId = Number($('grantStaff').value);
    if (!staffId) { ui.toast('Chọn KTV', 'warning'); return; }
    const items = state.grantRows
      .filter(r => r.product_id && r.qty > 0)
      .map(r => ({ product_id: r.product_id, qty: r.qty, imei_list: r.imei_list || null }));
    if (!items.length) { ui.toast('Cần ít nhất 1 SP', 'warning'); return; }
    const note = $('grantNote').value.trim() || null;
    const r = await api.post('/admin/staff-stock/grant',
      { staff_id: staffId, items, note }, { onError: 'toast' });
    if (r) {
      ui.toast('Đã phát', 'success');
      state.grantRows = [{}];
      $('grantNote').value = '';
      $('grantStaff').value = '';
      renderGrantRows();
      loadHoldings();
    }
  }

  // ---- INIT ----
  (async () => {
    adminShell.init('staff-stock');
    await Promise.all([loadStaff(), loadProducts()]);
    renderGrantStaffOptions();
    renderGrantRows();
    loadHoldings();

    $('btnAddGrantRow').addEventListener('click', () => {
      state.grantRows.push({});
      renderGrantRows();
    });
    $('btnGrantSubmit').addEventListener('click', submitGrant);
    $('btnHistReload').addEventListener('click', loadHistory);
    $('btnHistClear').addEventListener('click', () => {
      $('histStaff').value = '';
      $('histReason').value = '';
      $('histFrom').value = '';
      $('histTo').value = '';
      $('histQ').value = '';
      loadHistory();
    });
    $('histStaff').addEventListener('change', loadHistory);
    $('histReason').addEventListener('change', loadHistory);
    $('histQ').addEventListener('keydown', (e) => { if (e.key === 'Enter') loadHistory(); });
  })();
})();
