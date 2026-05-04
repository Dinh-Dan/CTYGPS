// Trang KTV: don bao hanh duoc gan cho minh.
// Hanh dong: thu hoi (chup anh + items nhan) / bat dau giao /
// hoan tat (3 nhanh tien + items giao + anh).

(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  const STATUS_LABEL = {
    pending:           { text: 'Mới lên đơn',     cls: 'gray' },
    received:          { text: 'Cần thu hồi',     cls: 'blue' },
    recovered:         { text: 'Đã thu hồi',     cls: 'amber' },
    awaiting_warranty: { text: 'Đang chờ BH',    cls: 'purple' },
    warranty_done:     { text: 'Đã BH xong',     cls: 'cyan' },
    delivering:        { text: 'Đang trả khách', cls: 'orange' },
    completed:         { text: 'Hoàn tất',        cls: 'green' },
    cancelled:         { text: 'Huỷ',             cls: 'red' },
  };

  const ITEM_GROUPS = [
    { kind: 'received_from_customer', label: '📥 Khách giao' },
    { kind: 'replacement',            label: '🔄 Thay từ kho' },
    { kind: 'sent_to_partner',        label: '📤 Gửi NCC' },
    { kind: 'received_back',          label: '📩 Nhận về' },
    { kind: 'delivered_to_customer',  label: '🚚 Giao khách' },
  ];

  const state = {
    items: [],
    filters: { q: '', status: '' },
    activeId: null,
    activeWO: null,            // detail cua don dang xu ly
    recoverImageUrl: null,
    completeImageUrl: null,
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
    const s = String(d);
    return s.length >= 10 ? s.slice(0, 10) : s;
  }
  function vnd(n) { return fmt.format(Number(n) || 0) + 'đ'; }

  function actionButtons(w) {
    const btns = [];
    if (w.status === 'received') {
      btns.push(`<button class="btn" data-act="recover" data-id="${w.id}">📷 Chụp ảnh thu hồi</button>`);
    }
    if (w.status === 'recovered' || w.status === 'warranty_done') {
      btns.push(`<button class="btn" data-act="start-deliver" data-id="${w.id}">🚚 Bắt đầu giao trả</button>`);
    }
    if (w.status === 'delivering') {
      btns.push(`<button class="btn success" data-act="complete" data-id="${w.id}">✓ Hoàn tất</button>`);
    }
    return btns.join('');
  }

  function renderItemsView(items) {
    if (!items || !items.length) return '';
    const byKind = {};
    for (const it of items) (byKind[it.kind] = byKind[it.kind] || []).push(it);
    const groups = ITEM_GROUPS.map(g => {
      const list = byKind[g.kind] || [];
      if (!list.length) return '';
      const rows = list.map(it =>
        `<div class="it">• <b>${escape(it.name)}</b>${it.imei ? ` <span class="imei">(${escape(it.imei)})</span>` : ''} × ${it.qty}${it.unit_price ? ` — ${vnd(it.unit_price)}` : ''}</div>`
      ).join('');
      return `<div class="ig"><div class="lbl">${g.label}</div>${rows}</div>`;
    }).filter(Boolean).join('');
    return groups ? `<div class="wr-items-view">${groups}</div>` : '';
  }

  function cardHtml(w) {
    const customer = w.customer_name
      ? `<b>${escape(w.customer_name)}</b>${w.customer_phone ? ` · <a href="tel:${escape(w.customer_phone)}">${escape(w.customer_phone)}</a>` : ''}`
      : '—';
    const cost = Number(w.cost_amount) || 0;
    const paid = Number(w.paid_amount) || 0;
    const debt = cost - paid;
    return `
      <div class="wr-card">
        <div class="head">
          <b>${escape(w.code)}</b>
          ${statusPill(w.status)}
          <span class="text-muted" style="margin-left:auto;font-size:13px">${fmtDate(w.request_date)}</span>
        </div>
        <div class="info-row"><b>Khách:</b> ${customer}</div>
        ${w.license_plate ? `<div class="info-row"><b>Biển số:</b> <span class="mono">${escape(w.license_plate)}</span></div>` : ''}
        ${w.device_name || w.imei_search ? `<div class="info-row"><b>Thiết bị:</b> ${escape(w.device_name || '')}${w.imei_search ? ` <span class="mono">(${escape(w.imei_search)})</span>` : ''}</div>` : ''}
        ${w.customer_address || w.address ? `<div class="info-row"><b>Địa chỉ:</b> ${escape(w.address || w.customer_address)}</div>` : ''}
        <div class="info-row"><b>Lý do:</b> ${escape(w.reason_text || '')}</div>
        ${w.warranty_partner ? `<div class="info-row"><b>Đã gửi tới:</b> ${escape(w.warranty_partner)}</div>` : ''}
        ${cost > 0 ? `<div class="info-row"><b>Phí:</b> ${vnd(cost)} · Đã thu: ${vnd(paid)}${debt > 0 ? ` · <span style="color:#dc2626">Còn nợ ${vnd(debt)}</span>` : ''}</div>` : ''}
        ${renderItemsView(w.items)}
        ${w.recovered_image_url ? `<div class="wr-photo" style="margin-top:6px"><a href="${escape(w.recovered_image_url)}" target="_blank"><img src="${escape(w.recovered_image_url)}" alt="Thu hồi"></a></div>` : ''}
        <div class="actions">${actionButtons(w)}</div>
      </div>`;
  }

  function applyFilters() {
    const q = state.filters.q.toLowerCase();
    const status = state.filters.status;
    return state.items.filter(w => {
      if (status && w.status !== status) return false;
      if (!q) return true;
      const haystack = [
        w.code, w.license_plate, w.imei_search, w.device_name,
        w.customer_name, w.customer_phone, w.reason_text,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  function render() {
    const items = applyFilters();
    if (!items.length) {
      $('list').innerHTML = `
        <div class="empty-state">
          <div class="ic">🛡</div>
          <p>${state.items.length ? 'Không có đơn nào khớp lọc.' : 'Bạn chưa có đơn bảo hành nào.'}</p>
        </div>`;
    } else {
      $('list').innerHTML = items.map(cardHtml).join('');
    }
  }

  async function load() {
    const res = await api.get('/kithuat/warranty-orders').catch(() => null);
    if (!res) return;
    state.items = res.items || [];
    render();
  }

  // ---- Item lines (recover + complete) ----------------------
  function buildItemLine(it = {}) {
    const div = document.createElement('div');
    div.className = 'item-line';
    div.innerHTML = `
      <input type="text" class="input" data-fld="name" placeholder="Tên thiết bị" value="${escape(it.name || '')}">
      <input type="text" class="input mono" data-fld="imei" placeholder="IMEI" value="${escape(it.imei || '')}">
      <input type="number" class="input" data-fld="qty" min="1" value="${it.qty || 1}">
      <input type="number" class="input" data-fld="unit_price" min="0" step="1000" placeholder="Đơn giá" value="${it.unit_price || 0}">
      <button type="button" class="btn ghost" data-remove style="color:var(--danger)">×</button>`;
    return div;
  }
  function readItemLines(containerId) {
    const out = [];
    document.querySelectorAll(`#${containerId} .item-line`).forEach(div => {
      const name = div.querySelector('[data-fld="name"]').value.trim();
      if (!name) return;
      const imei = div.querySelector('[data-fld="imei"]').value.trim() || null;
      const qty = Math.max(1, Number(div.querySelector('[data-fld="qty"]').value) || 1);
      const unit_price = Math.max(0, Number(div.querySelector('[data-fld="unit_price"]').value) || 0);
      out.push({ name, imei, qty, unit_price });
    });
    return out;
  }

  // ---- Modal: Recover (upload anh thu hoi + items) ---------
  function openRecover(id) {
    state.activeId = id;
    state.activeWO = state.items.find(x => x.id == id) || null;
    state.recoverImageUrl = null;
    $('recoverFile').value = '';
    $('recoverImg').src = '';
    $('recoverPreview').style.display = 'none';
    $('recoverPlaceholder').style.display = '';
    $('recoverSave').disabled = true;
    $('recoverItems').innerHTML = '';
    $('recoverModal').classList.add('open');
  }
  function closeRecover() {
    $('recoverModal').classList.remove('open');
    state.activeId = null;
    state.activeWO = null;
  }

  async function onRecoverFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    $('recoverSave').disabled = true;
    ui.loading(true);
    try {
      const url = await imgbb.upload(file, { name: 'warranty-recover' });
      state.recoverImageUrl = url;
      $('recoverImg').src = url;
      $('recoverPreview').style.display = '';
      $('recoverPlaceholder').style.display = 'none';
      $('recoverSave').disabled = false;
    } catch (err) {
      ui.toast(err.message || 'Upload thất bại', 'error');
    } finally {
      ui.loading(false);
    }
  }

  async function saveRecover() {
    if (!state.activeId || !state.recoverImageUrl) return;
    const items = readItemLines('recoverItems');
    const r = await api.post(`/kithuat/warranty-orders/${state.activeId}/recover`,
      { recovered_image_url: state.recoverImageUrl, items },
      { successMessage: 'Đã ghi nhận thu hồi', loading: true }).catch(() => null);
    if (r) { closeRecover(); load(); }
  }

  // ---- Action: Start deliver --------------------------------
  async function startDeliver(id) {
    const r = await api.post(`/kithuat/warranty-orders/${id}/start-deliver`, {},
      { successMessage: 'Đã chuyển sang đang trả khách', loading: true }).catch(() => null);
    if (r) load();
  }

  // ---- Modal: Complete (3 nhanh + items giao + anh) --------
  function syncCompleteSplit() {
    if (!state.activeWO) return;
    const cost = Number(state.activeWO.cost_amount) || 0;
    const paid = Number(state.activeWO.paid_amount) || 0;
    const remaining = Math.max(0, cost - paid);
    const toStaff = Math.max(0, Number($('cm_to_staff').value) || 0);
    const toAdmin = Math.max(0, Number($('cm_to_admin').value) || 0);
    const debt = remaining - toStaff - toAdmin;
    $('cm_debt').value = debt;
    const warn = $('cm_warn');
    if (toStaff + toAdmin > remaining) {
      warn.style.display = 'block';
      warn.textContent = `⚠ Tổng KTV + Admin (${vnd(toStaff + toAdmin)}) vượt quá còn lại (${vnd(remaining)})`;
    } else if (debt > 0) {
      warn.style.display = 'block';
      warn.textContent = `→ Khách còn nợ ${vnd(debt)} sau khi hoàn tất`;
    } else {
      warn.style.display = 'none';
    }
  }
  function openComplete(id) {
    state.activeId = id;
    state.activeWO = state.items.find(x => x.id == id) || null;
    state.completeImageUrl = null;
    if (!state.activeWO) return;
    const cost = Number(state.activeWO.cost_amount) || 0;
    const paid = Number(state.activeWO.paid_amount) || 0;
    const remaining = Math.max(0, cost - paid);
    $('cm_cost_view').textContent = vnd(cost);
    $('cm_paid_before').textContent = vnd(paid);
    $('cm_remaining').textContent = vnd(remaining);
    $('cm_to_staff').value = 0;
    $('cm_to_staff_method').value = 'cash';
    $('cm_to_admin').value = remaining;
    syncCompleteSplit();
    $('completeFile').value = '';
    $('completeImg').src = '';
    $('completePreview').style.display = 'none';
    $('completePlaceholder').style.display = '';
    $('completeItems').innerHTML = '';
    $('completeModal').classList.add('open');
  }
  function closeComplete() {
    $('completeModal').classList.remove('open');
    state.activeId = null;
    state.activeWO = null;
  }

  async function onCompleteFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    ui.loading(true);
    try {
      const url = await imgbb.upload(file, { name: 'warranty-deliver' });
      state.completeImageUrl = url;
      $('completeImg').src = url;
      $('completePreview').style.display = '';
      $('completePlaceholder').style.display = 'none';
    } catch (err) {
      ui.toast(err.message || 'Upload thất bại', 'error');
    } finally {
      ui.loading(false);
    }
  }

  async function saveComplete() {
    if (!state.activeId || !state.activeWO) return;
    const cost = Number(state.activeWO.cost_amount) || 0;
    const paid = Number(state.activeWO.paid_amount) || 0;
    const remaining = Math.max(0, cost - paid);
    const toStaff = Math.max(0, Number($('cm_to_staff').value) || 0);
    const toAdmin = Math.max(0, Number($('cm_to_admin').value) || 0);
    const debt = Math.max(0, Number($('cm_debt').value) || 0);
    if (toStaff + toAdmin + debt !== remaining) {
      return ui.toast('Tổng 3 phần phải bằng phần còn lại', 'error');
    }
    const items = readItemLines('completeItems');
    const body = {
      to_staff_amount: toStaff,
      to_staff_method: $('cm_to_staff_method').value,
      to_admin_amount: toAdmin,
      debt_amount: debt,
      expected_amount: remaining,
      items,
    };
    if (state.completeImageUrl) body.delivered_image_url = state.completeImageUrl;
    const r = await api.post(`/kithuat/warranty-orders/${state.activeId}/complete`, body,
      { successMessage: 'Đã hoàn tất đơn', loading: true }).catch(() => null);
    if (r) { closeComplete(); load(); }
  }

  function handleListClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const act = btn.dataset.act;
    if (act === 'recover')             openRecover(id);
    else if (act === 'start-deliver')  startDeliver(id);
    else if (act === 'complete')       openComplete(id);
  }

  function bindFilters() {
    let timer;
    $('fSearch').addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.filters.q = e.target.value.trim(); render(); }, 200);
    });
    $('fStatus').addEventListener('change', (e) => { state.filters.status = e.target.value; render(); });
    $('btnRefresh').addEventListener('click', load);
  }

  function init() {
    techShell.init('warranty');
    bindFilters();

    $('list').addEventListener('click', handleListClick);

    // ----- Recover modal -----
    $('recoverClose').addEventListener('click', closeRecover);
    $('recoverCancel').addEventListener('click', closeRecover);
    $('recoverModal').addEventListener('click', (e) => { if (e.target.id === 'recoverModal') closeRecover(); });
    $('recoverFile').addEventListener('change', onRecoverFileChange);
    $('recoverSave').addEventListener('click', saveRecover);
    $('addRecoverItem').addEventListener('click', () => {
      $('recoverItems').appendChild(buildItemLine());
    });
    $('recoverItems').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove]');
      if (btn) btn.closest('.item-line').remove();
    });

    // ----- Complete modal -----
    $('completeClose').addEventListener('click', closeComplete);
    $('completeCancel').addEventListener('click', closeComplete);
    $('completeModal').addEventListener('click', (e) => { if (e.target.id === 'completeModal') closeComplete(); });
    $('completeFile').addEventListener('change', onCompleteFileChange);
    $('completeSave').addEventListener('click', saveComplete);
    ['cm_to_staff', 'cm_to_admin'].forEach(id => {
      $(id).addEventListener('input', syncCompleteSplit);
    });
    $('addCompleteItem').addEventListener('click', () => {
      $('completeItems').appendChild(buildItemLine());
    });
    $('completeItems').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove]');
      if (btn) btn.closest('.item-line').remove();
    });

    load();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
