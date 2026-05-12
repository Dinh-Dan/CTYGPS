(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Number(n) || 0);
  const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN', { hour12: false }) : '—';

  const state = { staff: [], products: [], holdings: [], history: [], grantRows: [{ qty: 1 }] };

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
      $box.innerHTML = '<p style="color:#94a3b8;grid-column:1/-1">Chưa có KTV nào đang giữ hàng.</p>';
      return;
    }
    $box.innerHTML = state.holdings.map(s => {
      const totalQty = s.items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
      const initial = (s.full_name || '?').trim().charAt(0).toUpperCase();
      const rows = s.items.length
        ? s.items.map(it => `
            <tr>
              <td class="td-code">${esc(it.product_code || '')}</td>
              <td class="td-name">${esc(it.product_name)}</td>
              <td class="td-qty">${it.qty}</td>
            </tr>`).join('')
        : `<tr><td colspan="3" class="ktv-shelf-empty">Kho trống</td></tr>`;
      return `
        <div class="ktv-shelf">
          <div class="ktv-shelf-head">
            <div class="ktv-shelf-avatar">${initial}</div>
            <div>
              <div class="ktv-shelf-name">${esc(s.full_name)}</div>
              ${s.phone ? `<div class="ktv-shelf-phone">${esc(s.phone)}</div>` : ''}
            </div>
            <div class="ktv-shelf-total">
              ${totalQty > 0
                ? `<span class="pill blue" style="font-size:12px">${totalQty} thiết bị</span>`
                : `<span style="font-size:12px;color:#94a3b8">Kho trống</span>`}
            </div>
          </div>
          <div class="ktv-shelf-body">
            <table class="ktv-shelf-table"><tbody>${rows}</tbody></table>
          </div>
        </div>
      `;
    }).join('');
  }

  function openHistoryDetail(r) {
    const isGrant = r.reason_code === 'staff_grant';
    const totalQty = (r.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0);
    const detailRows = (r.items || []).map(it => {
      const imeiLines = it.imei_list
        ? it.imei_list.trim().split(/\r?\n/).filter(Boolean).map(l => `<div>${esc(l.trim())}</div>`).join('')
        : '<span style="color:#94a3b8">—</span>';
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px">${esc(it.product_name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:center;font-weight:700;width:60px">${it.qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-family:monospace;font-size:12px;color:#334155;line-height:1.8">${imeiLines}</td>
      </tr>`;
    }).join('');

    const dlg = document.createElement('div');
    dlg.className = 'modal-bg open';
    dlg.innerHTML = `
      <div class="modal" style="max-width:640px">
        <div class="modal-head">
          <h3>
            <span class="${isGrant ? 'badge-grant' : 'badge-revoke'}" style="margin-right:8px">${isGrant ? 'PHÁT' : 'THU HỒI'}</span>
            ${esc(r.code)}
          </h3>
          <button type="button" class="modal-close" data-x>×</button>
        </div>
        <div class="modal-body">
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px;font-size:13px;color:#475569">
            <span>KTV: <b style="color:#0f172a">${esc(r.staff_name || '—')}</b></span>
            <span>Tổng SL: <b style="color:#0f172a">${totalQty}</b></span>
            <span>Thời gian: <b style="color:#0f172a">${fmtDate(r.created_at)}</b></span>
            ${r.created_by_name ? `<span>Người phát: <b style="color:#0f172a">${esc(r.created_by_name)}</b></span>` : ''}
          </div>
          ${r.reason_text ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;font-size:13px;color:#475569;margin-bottom:12px">Ghi chú: ${esc(r.reason_text)}</div>` : ''}
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:#f8fafc">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0">Sản phẩm</th>
              <th style="padding:8px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;width:60px">SL</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0">IMEI</th>
            </tr></thead>
            <tbody>${detailRows || '<tr><td colspan="3" style="padding:16px;text-align:center;color:#94a3b8">Không có sản phẩm</td></tr>'}</tbody>
          </table>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn ghost" data-x>Đóng</button>
        </div>
      </div>`;
    document.body.appendChild(dlg);
    dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-x]')) dlg.remove(); });
  }

  function renderHistory() {
    const $box = $('historyList');
    if (!state.history.length) {
      $box.innerHTML = '<p style="color:#94a3b8">Không có lịch sử</p>';
      return;
    }
    $box.innerHTML = state.history.map((r, idx) => {
      const isGrant = r.reason_code === 'staff_grant';
      const totalQty = (r.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0);
      const productSummary = (r.items || []).map(it => `${esc(it.product_name)} ×${it.qty}`).join(', ');
      return `
        <div class="history-card" style="cursor:pointer" data-hc="${idx}">
          <div class="hc-head">
            <span class="${isGrant ? 'badge-grant' : 'badge-revoke'}">${isGrant ? 'PHÁT' : 'THU HỒI'}</span>
            <span class="hc-code">${esc(r.code)}</span>
            <span class="hc-ktv">→ ${esc(r.staff_name || '—')}</span>
            <span style="background:#f1f5f9;color:#475569;padding:1px 8px;border-radius:20px;font-size:11.5px">${totalQty} SP</span>
            <span style="flex:1;font-size:12px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${productSummary}</span>
            <span class="hc-time">${fmtDate(r.created_at)}${r.created_by_name ? ' · ' + esc(r.created_by_name) : ''}</span>
          </div>
          ${r.reason_text ? `<div class="hc-note">${esc(r.reason_text)}</div>` : ''}
        </div>`;
    }).join('');

    $box.querySelectorAll('.history-card').forEach((card, idx) => {
      card.addEventListener('click', () => openHistoryDetail(state.history[idx]));
    });
  }

  function renderGrantStaffOptions() {
    $('grantStaff').innerHTML = '<option value="">— Chọn KTV —</option>' +
      state.staff.map(s => `<option value="${s.id}">${esc(s.full_name)}</option>`).join('');
    $('histStaff').innerHTML = '<option value="">Tất cả</option>' +
      state.staff.map(s => `<option value="${s.id}">${esc(s.full_name)}</option>`).join('');
  }

  function renderGrantRows() {
    const $tb = $('grantItems');
    $tb.innerHTML = state.grantRows.map((r, i) => {
      const qty = r.qty != null ? r.qty : 1;
      return `
      <tr data-idx="${i}">
        <td>
          <select class="select prod">
            <option value="">— SP —</option>
            ${state.products.map(p => `<option value="${p.id}" ${p.id === r.product_id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
          </select>
        </td>
        <td><input type="number" class="input qty" min="1" value="${qty}"></td>
        <td><textarea class="input imei" rows="3" style="resize:vertical;min-height:64px;font-family:monospace;font-size:12px" placeholder="Mỗi dòng 1 IMEI (tuỳ chọn)">${esc(r.imei_list || '')}</textarea></td>
        <td><button class="btn-x" data-act="del">×</button></td>
      </tr>
    `}).join('');
    $tb.querySelectorAll('tr').forEach(tr => {
      const idx = Number(tr.dataset.idx);
      // Khởi tạo qty mặc định ngay khi render để tránh undefined
      if (state.grantRows[idx].qty == null) state.grantRows[idx].qty = 1;
      tr.querySelector('.prod').addEventListener('change', e => state.grantRows[idx].product_id = Number(e.target.value));
      tr.querySelector('.qty').addEventListener('change', e => state.grantRows[idx].qty = Number(e.target.value) || 1);
      tr.querySelector('.qty').addEventListener('input',  e => state.grantRows[idx].qty = Number(e.target.value) || 1);
      tr.querySelector('.imei').addEventListener('input', e => state.grantRows[idx].imei_list = e.target.value.trim());
      tr.querySelector('[data-act=del]').addEventListener('click', () => {
        state.grantRows.splice(idx, 1);
        if (!state.grantRows.length) state.grantRows.push({ qty: 1 });
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
      state.grantRows = [{ qty: 1 }];
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
