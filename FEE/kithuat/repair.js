// Trang KTV: don sua chua duoc gan cho minh.
// Hanh dong: nhan may (chup anh) -> nop bao gia -> bao xong -> bat dau giao
// -> hoan tat (kem thanh toan + anh giao).

(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  const STATUS_LABEL = {
    pending:           { text: 'Chờ tiếp nhận',  cls: 'gray' },
    assigned:          { text: 'Cần nhận máy',   cls: 'blue' },
    diagnosing:        { text: 'Đang chẩn đoán', cls: 'amber' },
    quoted:            { text: 'Đã nộp báo giá', cls: 'indigo' },
    awaiting_customer: { text: 'Chờ khách duyệt', cls: 'purple' },
    approved:          { text: 'Khách đã duyệt', cls: 'cyan' },
    rejected:          { text: 'Khách từ chối',  cls: 'pink' },
    repairing:         { text: 'Đang sửa',       cls: 'orange' },
    done:              { text: 'Đã sửa xong',    cls: 'cyan' },
    delivering:        { text: 'Đang trả khách', cls: 'orange' },
    completed:         { text: 'Hoàn tất',       cls: 'green' },
    cancelled:         { text: 'Huỷ',            cls: 'red' },
  };

  const state = {
    items: [],
    products: [],
    filters: { q: '', status: '' },
    activeId: null,
    receiveImageUrl: null,
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

  function actionButtons(r) {
    const btns = [];
    if (r.status === 'assigned') {
      btns.push(`<button class="btn" data-act="receive" data-id="${r.id}">📷 Nhận máy</button>`);
    }
    if (r.status === 'diagnosing') {
      btns.push(`<button class="btn" data-act="quote" data-id="${r.id}">📝 Nộp báo giá</button>`);
    }
    if (r.status === 'quoted') {
      btns.push(`<button class="btn ghost" data-act="quote" data-id="${r.id}">✏ Sửa báo giá</button>`);
    }
    if (r.status === 'repairing') {
      btns.push(`<button class="btn success" data-act="done" data-id="${r.id}">✓ Báo xong</button>`);
    }
    if (r.status === 'done') {
      btns.push(`<button class="btn" data-act="start-deliver" data-id="${r.id}">🚚 Bắt đầu giao trả</button>`);
    }
    if (r.status === 'delivering') {
      btns.push(`<button class="btn success" data-act="complete" data-id="${r.id}">✓ Hoàn tất</button>`);
    }
    return btns.join('');
  }

  function quoteSummary(r) {
    if (!r.total_amount && !r.service_fee && !r.parts_total) return '';
    return `<div class="quote-summary">
      💰 <b>Báo giá:</b> ${vnd(r.total_amount)}
      <span class="text-muted">(Công ${vnd(r.service_fee)} + Vật tư ${vnd(r.parts_total)})</span>
    </div>`;
  }

  function cardHtml(r) {
    const customer = r.customer_name
      ? `<b>${escape(r.customer_name)}</b>${r.customer_phone ? ` · <a href="tel:${escape(r.customer_phone)}">${escape(r.customer_phone)}</a>` : ''}`
      : '—';
    const total = Number(r.total_amount) || 0;
    const paid = Number(r.paid_amount) || 0;
    const debt = total - paid;
    return `
      <div class="ro-card">
        <div class="head">
          <b>${escape(r.code)}</b>
          ${statusPill(r.status)}
          <span class="text-muted" style="margin-left:auto;font-size:13px">${fmtDate(r.request_date)}</span>
        </div>
        <div class="info-row"><b>Khách:</b> ${customer}</div>
        ${r.license_plate ? `<div class="info-row"><b>Biển số:</b> <span class="mono">${escape(r.license_plate)}</span></div>` : ''}
        ${r.device_name || r.imei_search ? `<div class="info-row"><b>Thiết bị:</b> ${escape(r.device_name || '')}${r.imei_search ? ` <span class="mono">(${escape(r.imei_search)})</span>` : ''}</div>` : ''}
        ${r.customer_address || r.address ? `<div class="info-row"><b>Địa chỉ:</b> ${escape(r.address || r.customer_address)}</div>` : ''}
        <div class="info-row"><b>Lỗi báo:</b> ${escape(r.reason_text || '')}</div>
        ${r.diagnose_text ? `<div class="info-row"><b>Chẩn đoán:</b> ${escape(r.diagnose_text)}</div>` : ''}
        ${quoteSummary(r)}
        ${r.status === 'completed' && total > 0 ? `<div class="info-row" style="margin-top:6px">Đã thu: ${vnd(paid)}${debt > 0 ? ` · <span style="color:#dc2626">Còn nợ ${vnd(debt)}</span>` : ''}</div>` : ''}
        ${r.recovered_image_url ? `<div class="ro-photo" style="margin-top:6px"><a href="${escape(r.recovered_image_url)}" target="_blank"><img src="${escape(r.recovered_image_url)}" alt="Nhận máy"></a></div>` : ''}
        <div class="actions">${actionButtons(r)}</div>
      </div>`;
  }

  function applyFilters() {
    const q = state.filters.q.toLowerCase();
    const status = state.filters.status;
    return state.items.filter(r => {
      if (status && r.status !== status) return false;
      if (!q) return true;
      const haystack = [
        r.code, r.license_plate, r.imei_search, r.device_name,
        r.customer_name, r.customer_phone, r.reason_text,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  function render() {
    const items = applyFilters();
    if (!items.length) {
      $('list').innerHTML = `
        <div class="empty-state">
          <div class="ic">🔧</div>
          <p>${state.items.length ? 'Không có đơn nào khớp lọc.' : 'Bạn chưa có đơn sửa chữa nào.'}</p>
        </div>`;
    } else {
      $('list').innerHTML = items.map(cardHtml).join('');
    }
  }

  async function loadProducts() {
    // KTV khong co quyen /admin/products. Lay danh sach san pham con ton kho
    // qua /kithuat/inventory/available-stock — co ca san pham KTV chua giu.
    // Format tra ve: { items: [{product_id, code, name, quantity}] }
    const res = await api.get('/kithuat/inventory/available-stock', { silent: true }).catch(() => null);
    const raw = (res && res.items) || [];
    state.products = raw.map(r => ({ id: r.product_id, code: r.code, name: r.name }));
  }

  async function load() {
    const res = await api.get('/kithuat/repair-orders').catch(() => null);
    if (!res) return;
    state.items = res.items || [];
    render();
  }

  // ---- Modal: Nhan may (upload anh) ------------------------
  function openReceive(id) {
    state.activeId = id;
    state.receiveImageUrl = null;
    $('receiveFile').value = '';
    $('receiveImg').src = '';
    $('receivePreview').style.display = 'none';
    $('receivePlaceholder').style.display = '';
    $('receiveSave').disabled = true;
    $('receiveModal').classList.add('open');
  }
  function closeReceive() {
    $('receiveModal').classList.remove('open');
    state.activeId = null;
  }
  async function onReceiveFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    $('receiveSave').disabled = true;
    ui.loading(true);
    try {
      const url = await imgbb.upload(file, { name: 'repair-receive' });
      state.receiveImageUrl = url;
      $('receiveImg').src = url;
      $('receivePreview').style.display = '';
      $('receivePlaceholder').style.display = 'none';
      $('receiveSave').disabled = false;
    } catch (err) {
      ui.toast(err.message || 'Upload thất bại', 'error');
    } finally {
      ui.loading(false);
    }
  }
  async function saveReceive() {
    if (!state.activeId || !state.receiveImageUrl) return;
    const r = await api.post(`/kithuat/repair-orders/${state.activeId}/receive`,
      { recovered_image_url: state.receiveImageUrl },
      { successMessage: 'Đã nhận máy', loading: true }).catch(() => null);
    if (r) { closeReceive(); load(); }
  }

  // ---- Modal: Nop bao gia ----------------------------------
  function buildItemRow(it) {
    const opts = ['<option value="">— Chọn sản phẩm —</option>']
      .concat(state.products.map(p =>
        `<option value="${p.id}" ${it && p.id == it.product_id ? 'selected' : ''}>${escape(p.code || '')} — ${escape(p.name || '')}</option>`
      )).join('');
    return `
      <div class="item-row" data-item>
        <select class="select" data-prod>${opts}</select>
        <input type="number" class="input" data-qty min="1" value="${it ? it.qty : 1}">
        <input type="number" class="input" data-price min="0" step="1000" placeholder="Đơn giá" value="${it ? (it.unit_price || 0) : 0}">
        <input type="text" class="input mono" data-imei placeholder="IMEI (tuỳ chọn)" value="${it ? escape(it.imei || '') : ''}">
        <button type="button" class="btn ghost sm" data-remove style="color:var(--danger)">×</button>
      </div>`;
  }
  function openQuote(id) {
    state.activeId = id;
    const r = state.items.find(x => x.id == id);
    $('q_diagnose').value = (r && r.diagnose_text) || '';
    $('q_service_fee').value = (r && r.service_fee) || 0;
    $('qItems').innerHTML = (r && r.items && r.items.length)
      ? r.items.map(it => buildItemRow(it)).join('')
      : '';
    $('quoteModal').classList.add('open');
  }
  function closeQuote() { $('quoteModal').classList.remove('open'); state.activeId = null; }
  async function saveQuote() {
    if (!state.activeId) return;
    const diagnose = $('q_diagnose').value.trim();
    if (!diagnose) return ui.toast('Nhập chẩn đoán', 'warning');
    const fee = Math.max(0, Number($('q_service_fee').value) || 0);
    const items = [];
    document.querySelectorAll('#qItems [data-item]').forEach(div => {
      const productId = Number(div.querySelector('[data-prod]').value);
      const qty = Number(div.querySelector('[data-qty]').value);
      const price = Number(div.querySelector('[data-price]').value);
      const imei = div.querySelector('[data-imei]').value.trim();
      if (productId && qty > 0) items.push({ product_id: productId, qty, unit_price: price, imei: imei || null });
    });
    const r = await api.post(`/kithuat/repair-orders/${state.activeId}/submit-quote`,
      { diagnose_text: diagnose, service_fee: fee, items },
      { successMessage: 'Đã nộp báo giá', loading: true }).catch(() => null);
    if (r) { closeQuote(); load(); }
  }

  // ---- Action: Bao xong ------------------------------------
  async function markDone(id) {
    const ok = await ui.confirm({
      title: 'Báo xong?',
      message: 'Sau khi báo xong, BILL sẽ bị KHOÁ — không sửa được nữa. Tiếp tục?',
      okText: 'Đã sửa xong',
    });
    if (!ok) return;
    const r = await api.post(`/kithuat/repair-orders/${id}/done`, {},
      { successMessage: 'Đã báo xong, đã khoá bill', loading: true }).catch(() => null);
    if (r) load();
  }

  // ---- Action: Start deliver -------------------------------
  async function startDeliver(id) {
    const r = await api.post(`/kithuat/repair-orders/${id}/start-deliver`, {},
      { successMessage: 'Đã chuyển sang đang trả khách', loading: true }).catch(() => null);
    if (r) load();
  }

  // ---- Modal: Hoan tat -------------------------------------
  function openComplete(id) {
    state.activeId = id;
    state.completeImageUrl = null;
    const r = state.items.find(x => x.id == id);
    $('cm_paid').value = (r && r.total_amount) || 0;
    $('completeFile').value = '';
    $('completeImg').src = '';
    $('completePreview').style.display = 'none';
    $('completePlaceholder').style.display = '';
    $('completeModal').classList.add('open');
  }
  function closeComplete() { $('completeModal').classList.remove('open'); state.activeId = null; }
  async function onCompleteFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    ui.loading(true);
    try {
      const url = await imgbb.upload(file, { name: 'repair-deliver' });
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
    if (!state.activeId) return;
    const body = { paid_amount: Math.max(0, Number($('cm_paid').value) || 0) };
    if (state.completeImageUrl) body.delivered_image_url = state.completeImageUrl;
    const r = await api.post(`/kithuat/repair-orders/${state.activeId}/complete`, body,
      { successMessage: 'Đã hoàn tất đơn', loading: true }).catch(() => null);
    if (r) { closeComplete(); load(); }
  }

  function handleListClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const act = btn.dataset.act;
    if      (act === 'receive')        openReceive(id);
    else if (act === 'quote')          openQuote(id);
    else if (act === 'done')           markDone(id);
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

  async function init() {
    techShell.init('repair');
    bindFilters();

    $('list').addEventListener('click', handleListClick);

    $('receiveClose').addEventListener('click', closeReceive);
    $('receiveCancel').addEventListener('click', closeReceive);
    $('receiveModal').addEventListener('click', (e) => { if (e.target.id === 'receiveModal') closeReceive(); });
    $('receiveFile').addEventListener('change', onReceiveFileChange);
    $('receiveSave').addEventListener('click', saveReceive);

    $('quoteClose').addEventListener('click', closeQuote);
    $('quoteCancel').addEventListener('click', closeQuote);
    $('quoteModal').addEventListener('click', (e) => { if (e.target.id === 'quoteModal') closeQuote(); });
    $('qAddItem').addEventListener('click', () => {
      $('qItems').insertAdjacentHTML('beforeend', buildItemRow());
    });
    $('qItems').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove]');
      if (btn) btn.closest('[data-item]').remove();
    });
    $('quoteSave').addEventListener('click', saveQuote);

    $('completeClose').addEventListener('click', closeComplete);
    $('completeCancel').addEventListener('click', closeComplete);
    $('completeModal').addEventListener('click', (e) => { if (e.target.id === 'completeModal') closeComplete(); });
    $('completeFile').addEventListener('change', onCompleteFileChange);
    $('completeSave').addEventListener('click', saveComplete);

    await loadProducts();
    load();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
