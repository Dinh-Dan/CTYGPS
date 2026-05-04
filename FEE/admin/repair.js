// Logic trang admin/repair — quan ly don sua chua.

(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  const STATUS_LABEL = {
    pending:           { text: 'Chờ tiếp nhận',  cls: 'gray' },
    assigned:          { text: 'Đã gán KTV',     cls: 'blue' },
    diagnosing:        { text: 'Đang chẩn đoán', cls: 'amber' },
    quoted:            { text: 'Có báo giá',     cls: 'indigo' },
    awaiting_customer: { text: 'Chờ khách duyệt', cls: 'purple' },
    approved:          { text: 'Khách đã duyệt', cls: 'cyan' },
    rejected:          { text: 'Khách từ chối',  cls: 'pink' },
    repairing:         { text: 'Đang sửa',       cls: 'orange' },
    done:              { text: 'Đã sửa xong',    cls: 'cyan' },
    delivering:        { text: 'Đang trả khách', cls: 'orange' },
    completed:         { text: 'Hoàn tất',       cls: 'green' },
    cancelled:         { text: 'Huỷ',            cls: 'red' },
  };

  const BILL_LOCKED = ['done', 'delivering', 'completed'];
  const TERMINAL = ['completed', 'cancelled'];

  const state = {
    filters: { q: '', status: '' },
    page: 1, limit: 20, total: 0,
    customers: [],
    technicians: [],
    products: [],
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
    if (!d) return '<span class="text-muted">—</span>';
    const s = String(d);
    return s.length >= 10 ? s.slice(0, 10) : s;
  }
  function vnd(n) { return fmt.format(Number(n) || 0) + 'đ'; }

  // ---- Render bang -------------------------------------------
  function rowHtml(r) {
    const customer = r.customer_name
      ? `<b>${escape(r.customer_name)}</b><br><small class="text-muted">${escape(r.customer_phone || '')}${r.customer_type === 'dealer' ? ' · 🏪 Đại lý' : ''}</small>`
      : '<span class="text-muted">—</span>';
    const total = Number(r.total_amount) || 0;
    const paid = Number(r.paid_amount) || 0;
    const debt = total - paid;
    const moneyCol = total > 0
      ? `<b>${vnd(total)}</b><br><small class="${debt > 0 ? 'text-danger' : 'text-muted'}">Đã thu: ${vnd(paid)}</small>`
      : '<span class="text-muted">—</span>';
    const device = [r.device_name, r.imei_search].filter(Boolean).map(escape).join('<br>');
    return `
      <tr>
        <td><b>${escape(r.code)}</b><br><small class="text-muted">${escape(r.creator_type || '')}</small></td>
        <td>${customer}</td>
        <td class="mono">${escape(r.license_plate || '—')}</td>
        <td class="imei-mono">${device || '<span class="text-muted">—</span>'}</td>
        <td title="${escape(r.reason_text || '')}" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escape(r.reason_text || '')}</td>
        <td>${fmtDate(r.request_date)}</td>
        <td>${escape(r.staff_name || '')}</td>
        <td>${moneyCol}</td>
        <td>${statusPill(r.status)}</td>
        <td><button class="btn ghost sm" data-act="detail" data-id="${r.id}">Chi tiết</button></td>
      </tr>`;
  }

  async function load() {
    const p = new URLSearchParams();
    Object.entries(state.filters).forEach(([k, v]) => { if (v) p.set(k, v); });
    p.set('page', state.page);
    p.set('limit', state.limit);
    const res = await api.get('/admin/repair-orders?' + p.toString()).catch(() => null);
    if (!res) return;
    state.total = res.total;
    if (!res.items.length) {
      $('tbody').innerHTML = '<tr><td colspan="10" class="text-center text-muted" style="padding:24px">Chưa có đơn sửa chữa nào</td></tr>';
    } else {
      $('tbody').innerHTML = res.items.map(rowHtml).join('');
    }
    const totalPage = Math.max(1, Math.ceil(res.total / state.limit));
    $('pageInfo').textContent = `Trang ${state.page} / ${totalPage} — ${res.total} đơn`;
    $('prevPage').disabled = state.page <= 1;
    $('nextPage').disabled = state.page >= totalPage;
  }

  async function loadCustomers() {
    const res = await api.get('/admin/customers?limit=200', { silent: true }).catch(() => null);
    state.customers = (res && res.items) || [];
  }
  async function loadTechnicians() {
    const res = await api.get('/admin/staff?role=kithuat&limit=100', { silent: true }).catch(() => null);
    state.technicians = (res && res.items) || [];
  }
  async function loadProducts() {
    const res = await api.get('/admin/products?limit=200', { silent: true }).catch(() => null);
    state.products = (res && res.items) || [];
  }

  function refillCustomers(selectedId) {
    const html = ['<option value="">— Chọn khách / đại lý —</option>'];
    state.customers.forEach(c => {
      const tag = c.type === 'dealer' ? '🏪' : '👤';
      const label = `${tag} ${c.code} — ${c.full_name}${c.phone ? ' (' + c.phone + ')' : ''}`;
      html.push(`<option value="${c.id}" ${c.id == selectedId ? 'selected' : ''}>${escape(label)}</option>`);
    });
    $('f_customer').innerHTML = html.join('');
  }

  // ---- Modal tao/sua metadata ------------------------------
  function openCreateModal() {
    $('modal').classList.add('open');
    $('modalTitle').textContent = 'Tạo đơn sửa chữa';
    ['f_id','f_plate','f_device','f_imei','f_reason','f_address','f_note']
      .forEach(k => $(k).value = '');
    refillCustomers();
  }
  function openEditModal(r) {
    $('modal').classList.add('open');
    $('modalTitle').textContent = `Sửa ${r.code}`;
    $('f_id').value = r.id;
    $('f_plate').value = r.license_plate || '';
    $('f_device').value = r.device_name || '';
    $('f_imei').value = r.imei_search || '';
    $('f_reason').value = r.reason_text || '';
    $('f_address').value = r.address || '';
    $('f_note').value = r.note_text || '';
    refillCustomers(r.customer_id);
  }
  function closeModal() { $('modal').classList.remove('open'); }

  function readForm() {
    return {
      customer_id:   Number($('f_customer').value) || null,
      license_plate: $('f_plate').value.trim() || null,
      device_name:   $('f_device').value.trim() || null,
      imei_search:   $('f_imei').value.trim() || null,
      reason:        $('f_reason').value.trim(),
      address:       $('f_address').value.trim() || null,
      note:          $('f_note').value.trim() || null,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const data = readForm();
    if (!data.customer_id) return ui.toast('Chọn khách hàng / đại lý', 'warning');
    if (!data.reason)      return ui.toast('Nhập mô tả lỗi', 'warning');

    const id = $('f_id').value;
    $('btnSave').disabled = true;
    let r;
    if (id) {
      r = await api.put(`/admin/repair-orders/${id}`, data, {
        successMessage: 'Đã cập nhật đơn', loading: true,
      }).catch(() => null);
    } else {
      r = await api.post('/admin/repair-orders', data, {
        successMessage: 'Đã tạo đơn sửa chữa', loading: true,
      }).catch(() => null);
    }
    $('btnSave').disabled = false;
    if (!r) return;
    closeModal();
    load();
  }

  // ---- Modal detail -----------------------------------------
  let currentDetail = null;

  function renderActionBar(r) {
    const buttons = [];
    const locked = BILL_LOCKED.includes(r.status);
    const term = TERMINAL.includes(r.status);

    if (r.status === 'pending') {
      buttons.push(`<button class="btn" data-act="assign">👷 Gán KTV</button>`);
    }
    if (r.status === 'assigned') {
      buttons.push(`<small class="text-muted" style="align-self:center">Chờ KTV chụp ảnh nhận máy + chẩn đoán</small>`);
    }
    if (r.status === 'diagnosing') {
      buttons.push(`<small class="text-muted" style="align-self:center">Chờ KTV nộp báo giá</small>`);
    }
    if (r.status === 'quoted') {
      buttons.push(`<button class="btn ghost" data-act="quote">✏ Sửa báo giá</button>`);
      buttons.push(`<button class="btn" data-act="send-customer">📨 Gửi báo giá cho khách</button>`);
    }
    if (r.status === 'awaiting_customer') {
      buttons.push(`<button class="btn ghost" data-act="reopen-quote">↩ Sửa lại báo giá</button>`);
      buttons.push(`<small class="text-muted" style="align-self:center">Chờ khách duyệt báo giá</small>`);
    }
    if (r.status === 'rejected') {
      buttons.push(`<button class="btn ghost" data-act="reopen-quote">↩ Sửa lại báo giá</button>`);
    }
    if (r.status === 'approved') {
      buttons.push(`<button class="btn" data-act="release-stock">📦 Xuất kho + Bắt đầu sửa</button>`);
    }
    if (r.status === 'repairing') {
      buttons.push(`<small class="text-muted" style="align-self:center">Chờ KTV báo xong</small>`);
    }
    if (r.status === 'done') {
      buttons.push(`<button class="btn" data-act="start-deliver">🚚 Bắt đầu giao trả</button>`);
    }
    if (r.status === 'delivering') {
      buttons.push(`<button class="btn" data-act="complete">✓ Hoàn tất + Thu tiền</button>`);
    }

    if (!term && !locked) {
      buttons.push(`<button class="btn ghost" data-act="assign">👷 ${r.assigned_staff_id ? 'Đổi' : 'Gán'} KTV</button>`);
      buttons.push(`<button class="btn ghost" data-act="cancel" style="color:var(--danger)">✗ Huỷ đơn</button>`);
    }
    if (!term) {
      buttons.push(`<button class="btn ghost sm" data-act="payment">💰 Cập nhật thanh toán</button>`);
    }
    return buttons.length ? `<div class="action-bar">${buttons.join('')}</div>` : '';
  }

  function renderItems(items) {
    if (!items || !items.length) return '<div class="text-muted">Chưa có vật tư</div>';
    let total = 0;
    const rows = items.map(it => {
      const sub = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
      total += sub;
      return `<tr>
        <td>${escape(it.product_name || ('#' + it.product_id))}<br><small class="imei-mono text-muted">${escape(it.imei || '')}</small></td>
        <td class="text-right">${it.qty}</td>
        <td class="text-right">${vnd(it.unit_price)}</td>
        <td class="text-right"><b>${vnd(sub)}</b></td>
      </tr>`;
    }).join('');
    return `<table class="data" style="font-size:13px">
      <thead><tr><th>Sản phẩm / IMEI</th><th class="text-right">SL</th><th class="text-right">Đơn giá</th><th class="text-right">Tổng</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><th colspan="3" class="text-right">Tạm tính vật tư</th><th class="text-right"><b>${vnd(total)}</b></th></tr></tfoot>
    </table>`;
  }

  function renderCharges(charges) {
    if (!charges || !charges.length) return '<div class="text-muted">Chưa có phí phát sinh</div>';
    const rows = charges.map(c => `<tr>
      <td>${escape(c.kind)}</td>
      <td>${escape(c.label)}</td>
      <td class="text-right ${(Number(c.amount) || 0) < 0 ? 'text-danger' : ''}">${vnd(c.amount)}</td>
    </tr>`).join('');
    return `<table class="data" style="font-size:13px">
      <thead><tr><th style="width:90px">Loại</th><th>Mô tả</th><th class="text-right" style="width:130px">Số tiền</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  function renderReceipts(receipts) {
    if (!receipts || !receipts.length) return '';
    const rows = receipts.map(r => {
      const items = (r.items || []).map(it =>
        `<div>${escape(it.product_name || '#'+it.product_id)} × ${it.qty}${it.imei_list ? ` <small class="imei-mono">(${escape(it.imei_list)})</small>` : ''}</div>`
      ).join('');
      return `<tr>
        <td><b>${escape(r.code)}</b></td>
        <td>${items || '<span class="text-muted">—</span>'}</td>
        <td>${escape(r.created_by_name || '')}</td>
        <td>${fmtDate(r.created_at)}</td>
      </tr>`;
    }).join('');
    return `
      <div class="ro-detail-section">
        <h4>📦 Phiếu xuất kho liên quan</h4>
        <table class="data" style="font-size:13px">
          <thead><tr><th>Mã</th><th>Sản phẩm</th><th>Người tạo</th><th>Ngày</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  async function openDetail(id) {
    const res = await api.get(`/admin/repair-orders/${id}`, { loading: true }).catch(() => null);
    if (!res) return;
    currentDetail = res;
    $('detailTitle').textContent = `${res.code} — ${STATUS_LABEL[res.status] ? STATUS_LABEL[res.status].text : res.status}`;

    const total = Number(res.total_amount) || 0;
    const paid = Number(res.paid_amount) || 0;
    const debt = total - paid;

    const photos = [];
    if (res.recovered_image_url) photos.push(`
      <div class="ro-photo"><a href="${escape(res.recovered_image_url)}" target="_blank"><img src="${escape(res.recovered_image_url)}" alt="Ảnh nhận máy"></a><div class="text-muted" style="padding:4px 6px;font-size:12px">Ảnh nhận máy</div></div>`);
    if (res.delivered_image_url) photos.push(`
      <div class="ro-photo"><a href="${escape(res.delivered_image_url)}" target="_blank"><img src="${escape(res.delivered_image_url)}" alt="Ảnh giao máy"></a><div class="text-muted" style="padding:4px 6px;font-size:12px">Ảnh giao máy</div></div>`);

    const lockBanner = BILL_LOCKED.includes(res.status)
      ? `<div class="lock-banner">🔒 Bill đã khoá (đơn đang ở trạng thái "${STATUS_LABEL[res.status].text}"). Không thể sửa items / công sửa / phí.</div>`
      : '';

    $('detailBody').innerHTML = `
      ${lockBanner}
      <div class="grid cols-2" style="font-size:14px">
        <div><b>Khách:</b> ${escape(res.customer_name || '—')} ${res.customer_type === 'dealer' ? '<span class="pill orange" style="font-size:11px">Đại lý</span>' : ''}</div>
        <div><b>SĐT:</b> ${escape(res.customer_phone || '—')}</div>
        <div><b>Biển số:</b> <span class="mono">${escape(res.license_plate || '—')}</span></div>
        <div><b>Thiết bị:</b> ${escape(res.device_name || '—')}</div>
        <div><b>IMEI:</b> <span class="imei-mono">${escape(res.imei_search || '—')}</span></div>
        <div><b>Trạng thái:</b> ${statusPill(res.status)}</div>
        <div><b>Ngày tạo:</b> ${fmtDate(res.request_date)}</div>
        <div><b>KTV:</b> ${escape(res.staff_name || '—')}${res.staff_phone ? ` <small class="text-muted">(${escape(res.staff_phone)})</small>` : ''}</div>
        <div><b>Đã gửi khách:</b> ${res.customer_sent_at ? fmtDate(res.customer_sent_at) : '<span class="text-muted">—</span>'}</div>
        <div><b>Khách quyết định:</b> ${res.customer_decided_at ? fmtDate(res.customer_decided_at) : '<span class="text-muted">—</span>'}</div>
      </div>
      <div class="ro-detail-section">
        <h4>📋 Lỗi khách báo</h4>
        <div style="white-space:pre-wrap">${escape(res.reason_text || '')}</div>
      </div>
      ${res.diagnose_text ? `
        <div class="ro-detail-section">
          <h4>🔍 Chẩn đoán của KTV</h4>
          <div style="white-space:pre-wrap">${escape(res.diagnose_text)}</div>
        </div>` : ''}
      ${res.address ? `
        <div class="ro-detail-section">
          <h4>📍 Địa chỉ thu hồi</h4>
          <div style="white-space:pre-wrap">${escape(res.address)}</div>
        </div>` : ''}
      ${res.note_text ? `
        <div class="ro-detail-section">
          <h4>📝 Ghi chú</h4>
          <div style="white-space:pre-wrap">${escape(res.note_text)}</div>
        </div>` : ''}
      <div class="ro-detail-section">
        <h4>📦 Vật tư thay</h4>
        ${renderItems(res.items)}
      </div>
      <div class="ro-detail-section">
        <h4>💼 Phí dịch vụ + giảm giá</h4>
        <p class="help">Bao gồm "Công sửa" (sync với cột <code>service_fee</code>: ${vnd(res.service_fee)}).</p>
        ${renderCharges(res.charges)}
      </div>
      <div class="ro-detail-section">
        <h4>💰 Tổng kết</h4>
        <div class="row" style="gap:24px;align-items:center;flex-wrap:wrap">
          <div>Tổng phí: <span class="ro-money">${vnd(total)}</span></div>
          <div>Đã thu: <span class="ro-money">${vnd(paid)}</span></div>
          <div>Còn nợ: <span class="ro-money ${debt > 0 ? 'debt' : ''}">${vnd(debt)}</span></div>
        </div>
        ${res.debt_carried_at ? `<p class="help" style="color:#16a34a;margin-top:6px">✓ Đã kết vào phiếu tất toán ngày ${fmtDate(res.debt_carried_at)}</p>` : ''}
      </div>
      ${photos.length ? `
        <div class="ro-detail-section">
          <h4>📸 Ảnh</h4>
          <div class="row" style="gap:10px">${photos.join('')}</div>
        </div>` : ''}
      ${renderReceipts(res.receipts)}
      ${renderActionBar(res)}
    `;
    $('detailModal').classList.add('open');
  }
  function closeDetail() { $('detailModal').classList.remove('open'); currentDetail = null; }

  // ---- Action handlers --------------------------------------
  async function callAction(action, body, successMsg, method = 'post') {
    if (!currentDetail) return;
    const fn = method === 'patch' ? api.patch : api.post;
    const r = await fn(`/admin/repair-orders/${currentDetail.id}/${action}`, body || {}, {
      successMessage: successMsg, loading: true,
    }).catch(() => null);
    if (r) { openDetail(currentDetail.id); load(); }
  }

  function handleCancel() {
    if (!currentDetail) return;
    ui.confirm({
      title: 'Huỷ đơn?',
      message: `Huỷ đơn sửa chữa ${currentDetail.code}?`,
      okText: 'Huỷ đơn',
    }).then(ok => {
      if (!ok) return;
      const reason = prompt('Lý do huỷ?');
      if (reason == null) return;
      callAction('cancel', { reason: reason.trim() }, 'Đã huỷ đơn');
    });
  }

  async function handleDelete() {
    if (!currentDetail) return;
    const ok = await ui.confirm({
      title: 'Xoá đơn?',
      message: `Xoá vĩnh viễn ${currentDetail.code}? (soft delete)`,
      okText: 'Xoá',
    });
    if (!ok) return;
    const r = await api.delete(`/admin/repair-orders/${currentDetail.id}`, {
      successMessage: 'Đã xoá', loading: true,
    }).catch(() => null);
    if (r) { closeDetail(); load(); }
  }

  // ---- Modal: Gan KTV ---------------------------------------
  function openAssignModal() {
    if (!currentDetail) return;
    const html = ['<option value="">— Bỏ gán —</option>'];
    state.technicians.forEach(s => {
      html.push(`<option value="${s.id}" ${s.id == currentDetail.assigned_staff_id ? 'selected' : ''}>${escape(s.full_name || s.username)}${s.area ? ' · ' + escape(s.area) : ''}</option>`);
    });
    $('assign_staff').innerHTML = html.join('');
    $('assignModal').classList.add('open');
  }
  function closeAssignModal() { $('assignModal').classList.remove('open'); }
  async function saveAssign() {
    if (!currentDetail) return;
    const staffId = $('assign_staff').value || null;
    const r = await api.post(`/admin/repair-orders/${currentDetail.id}/assign`, { staff_id: staffId }, {
      successMessage: staffId ? 'Đã gán KTV' : 'Đã bỏ gán', loading: true,
    }).catch(() => null);
    if (r) { closeAssignModal(); openDetail(currentDetail.id); load(); }
  }

  // ---- Modal: Sua bao gia (items + charges + service_fee) ---
  function buildItemRow(it) {
    const opts = ['<option value="">— Chọn sản phẩm —</option>']
      .concat(state.products.map(p =>
        `<option value="${p.id}" ${it && p.id == it.product_id ? 'selected' : ''}>${escape(p.code)} — ${escape(p.name)}</option>`
      )).join('');
    return `
      <div class="item-row" data-item>
        <select class="select" data-prod>${opts}</select>
        <input type="number" class="input" data-qty min="1" value="${it ? it.qty : 1}">
        <input type="number" class="input" data-price min="0" step="1000" placeholder="Đơn giá" value="${it ? (it.unit_price || 0) : 0}">
        <input type="text" class="input imei-mono" data-imei placeholder="IMEI (tuỳ chọn)" value="${it ? escape(it.imei || '') : ''}">
        <button type="button" class="btn ghost sm" data-remove style="color:var(--danger)">×</button>
      </div>`;
  }
  function buildChargeRow(c) {
    const kindOpts = ['fee', 'discount'].map(k =>
      `<option value="${k}" ${c && c.kind === k ? 'selected' : ''}>${k === 'fee' ? 'Phí khác' : 'Giảm giá'}</option>`
    ).join('');
    return `
      <div class="charge-row" data-charge>
        <select class="select" data-kind>${kindOpts}</select>
        <input type="text" class="input" data-label placeholder="VD: Phí khám" value="${c ? escape(c.label || '') : ''}">
        <input type="number" class="input" data-amount step="1000" value="${c ? (c.amount || 0) : 0}">
        <button type="button" class="btn ghost sm" data-remove style="color:var(--danger)">×</button>
      </div>`;
  }

  function openQuoteModal() {
    if (!currentDetail) return;
    if (BILL_LOCKED.includes(currentDetail.status)) {
      return ui.toast('Bill đã khoá, không sửa được', 'warning');
    }
    $('q_service_fee').value = currentDetail.service_fee || 0;
    $('qItems').innerHTML = (currentDetail.items || []).map(it => buildItemRow(it)).join('') || buildItemRow();
    $('qCharges').innerHTML = (currentDetail.charges || [])
      .filter(c => !(c.kind === 'service' && c.label === 'Công sửa'))
      .map(c => buildChargeRow(c)).join('');
    $('quoteModal').classList.add('open');
  }
  function closeQuoteModal() { $('quoteModal').classList.remove('open'); }
  async function saveQuote() {
    if (!currentDetail) return;
    const id = currentDetail.id;
    const fee = Math.max(0, Number($('q_service_fee').value) || 0);

    const items = [];
    document.querySelectorAll('#qItems [data-item]').forEach(div => {
      const productId = Number(div.querySelector('[data-prod]').value);
      const qty = Number(div.querySelector('[data-qty]').value);
      const price = Number(div.querySelector('[data-price]').value);
      const imei = div.querySelector('[data-imei]').value.trim();
      if (productId && qty > 0) items.push({ product_id: productId, qty, unit_price: price, imei: imei || null });
    });
    const charges = [];
    document.querySelectorAll('#qCharges [data-charge]').forEach(div => {
      const kind = div.querySelector('[data-kind]').value;
      const label = div.querySelector('[data-label]').value.trim();
      const amount = Number(div.querySelector('[data-amount]').value) || 0;
      if (label) charges.push({ kind, label, amount });
    });

    $('quoteSave').disabled = true;
    const r1 = await api.put(`/admin/repair-orders/${id}/items`, { items }, { silent: true, loading: true }).catch(() => null);
    if (!r1) { $('quoteSave').disabled = false; return; }
    const r2 = await api.put(`/admin/repair-orders/${id}/charges`, { charges }, { silent: true, loading: true }).catch(() => null);
    if (!r2) { $('quoteSave').disabled = false; return; }
    const r3 = await api.patch(`/admin/repair-orders/${id}/service-fee`, { service_fee: fee }, {
      successMessage: 'Đã lưu báo giá', loading: true,
    }).catch(() => null);
    $('quoteSave').disabled = false;
    if (!r3) return;
    closeQuoteModal();
    openDetail(id);
    load();
  }

  // ---- Modal: Xuat kho --------------------------------------
  function buildStockLine() {
    const opts = ['<option value="">— Chọn sản phẩm —</option>']
      .concat(state.products.map(p =>
        `<option value="${p.id}">${escape(p.code)} — ${escape(p.name)}</option>`
      )).join('');
    return `
      <div class="stock-row" data-line>
        <select class="select" data-prod>${opts}</select>
        <input type="number" class="input" data-qty min="1" value="1">
        <input type="text" class="input imei-mono" data-imei placeholder="IMEI (tuỳ chọn)">
        <button type="button" class="btn ghost sm" data-remove style="color:var(--danger)">×</button>
      </div>`;
  }
  function openReleaseModal() {
    if (!currentDetail) return;
    // Pre-fill tu items da bao gia
    const items = currentDetail.items || [];
    if (items.length) {
      $('stockLines').innerHTML = items.map(it => {
        const opts = ['<option value="">— Chọn sản phẩm —</option>']
          .concat(state.products.map(p =>
            `<option value="${p.id}" ${p.id == it.product_id ? 'selected' : ''}>${escape(p.code)} — ${escape(p.name)}</option>`
          )).join('');
        return `<div class="stock-row" data-line>
          <select class="select" data-prod>${opts}</select>
          <input type="number" class="input" data-qty min="1" value="${it.qty}">
          <input type="text" class="input imei-mono" data-imei placeholder="IMEI" value="${escape(it.imei || '')}">
          <button type="button" class="btn ghost sm" data-remove style="color:var(--danger)">×</button>
        </div>`;
      }).join('');
    } else {
      $('stockLines').innerHTML = buildStockLine();
    }
    $('release_note').value = '';
    $('releaseModal').classList.add('open');
  }
  function closeReleaseModal() { $('releaseModal').classList.remove('open'); }
  async function saveRelease() {
    if (!currentDetail) return;
    const lines = [];
    document.querySelectorAll('#stockLines [data-line]').forEach(div => {
      const productId = Number(div.querySelector('[data-prod]').value);
      const qty = Number(div.querySelector('[data-qty]').value);
      const imei = div.querySelector('[data-imei]').value.trim();
      if (productId && qty > 0) lines.push({ product_id: productId, qty, imei_list: imei || null });
    });
    const r = await api.post(`/admin/repair-orders/${currentDetail.id}/release-stock`,
      { items: lines, reason_text: $('release_note').value.trim() || null },
      { successMessage: 'Đã xuất kho và chuyển sang đang sửa', loading: true }).catch(() => null);
    if (r) { closeReleaseModal(); openDetail(currentDetail.id); load(); }
  }

  // ---- Modal: Hoan tat -------------------------------------
  function openCompleteModal() {
    if (!currentDetail) return;
    $('cm_paid').value = currentDetail.paid_amount || currentDetail.total_amount || 0;
    $('completeModal').classList.add('open');
  }
  function closeCompleteModal() { $('completeModal').classList.remove('open'); }
  async function saveComplete() {
    if (!currentDetail) return;
    const paid = Math.max(0, Number($('cm_paid').value) || 0);
    const r = await api.post(`/admin/repair-orders/${currentDetail.id}/complete`,
      { paid_amount: paid },
      { successMessage: 'Đã hoàn tất đơn', loading: true }).catch(() => null);
    if (r) { closeCompleteModal(); openDetail(currentDetail.id); load(); }
  }

  // ---- Payment quick update --------------------------------
  async function handlePayment() {
    if (!currentDetail) return;
    const paid = prompt('Đã thu (VND):', currentDetail.paid_amount || 0);
    if (paid == null) return;
    callAction('payment', { paid_amount: Math.max(0, Number(paid) || 0) }, 'Đã cập nhật thanh toán', 'patch');
  }

  function handleDetailClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    if      (act === 'assign')         openAssignModal();
    else if (act === 'quote')          openQuoteModal();
    else if (act === 'send-customer')  callAction('send-customer', {}, 'Đã gửi báo giá cho khách');
    else if (act === 'reopen-quote')   callAction('reopen-quote', {}, 'Đã mở lại để sửa báo giá');
    else if (act === 'release-stock')  openReleaseModal();
    else if (act === 'start-deliver')  callAction('start-deliver', {}, 'Đã chuyển sang đang trả khách');
    else if (act === 'complete')       openCompleteModal();
    else if (act === 'cancel')         handleCancel();
    else if (act === 'payment')        handlePayment();
  }

  function handleTableClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    if (btn.dataset.act === 'detail') openDetail(btn.dataset.id);
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
          if (input.dataset.filter === 'status') syncQuickTabs(input.value.trim());
          load();
        };
        if (ev === 'change') apply(); else timer = setTimeout(apply, 300);
      });
    });
  }
  function syncQuickTabs(status) {
    document.querySelectorAll('#quickTabs button').forEach(b => {
      b.classList.toggle('on', b.dataset.status === status);
    });
  }
  function bindQuickTabs() {
    $('quickTabs').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-status]');
      if (!b) return;
      const status = b.dataset.status;
      state.filters.status = status;
      state.page = 1;
      const sel = document.querySelector('select[data-filter="status"]');
      if (sel) sel.value = status;
      syncQuickTabs(status);
      load();
    });
  }

  function syncStickyOffset() {
    const row1 = document.querySelector('.flex-page table.data thead tr:first-child');
    if (!row1) return;
    document.documentElement.style.setProperty('--th-row1-h', row1.getBoundingClientRect().height + 'px');
  }

  async function init() {
    adminShell.init('repair');
    bindFilters();
    bindQuickTabs();
    await Promise.all([loadCustomers(), loadTechnicians(), loadProducts()]);

    $('btnAdd').addEventListener('click', openCreateModal);
    $('modalClose').addEventListener('click', closeModal);
    $('btnCancel').addEventListener('click', closeModal);
    $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    $('frm').addEventListener('submit', handleSubmit);

    $('detailClose').addEventListener('click', closeDetail);
    $('detailCloseBtn').addEventListener('click', closeDetail);
    $('detailModal').addEventListener('click', (e) => { if (e.target.id === 'detailModal') closeDetail(); });
    $('detailBody').addEventListener('click', handleDetailClick);
    $('btnEdit').addEventListener('click', () => {
      if (!currentDetail) return;
      closeDetail();
      openEditModal(currentDetail);
    });
    $('btnDelete').addEventListener('click', handleDelete);

    $('assignClose').addEventListener('click', closeAssignModal);
    $('assignCancel').addEventListener('click', closeAssignModal);
    $('assignSave').addEventListener('click', saveAssign);

    $('quoteClose').addEventListener('click', closeQuoteModal);
    $('quoteCancel').addEventListener('click', closeQuoteModal);
    $('quoteSave').addEventListener('click', saveQuote);
    $('qAddItem').addEventListener('click', () => {
      $('qItems').insertAdjacentHTML('beforeend', buildItemRow());
    });
    $('qAddCharge').addEventListener('click', () => {
      $('qCharges').insertAdjacentHTML('beforeend', buildChargeRow());
    });
    $('qItems').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove]');
      if (btn) btn.closest('[data-item]').remove();
    });
    $('qCharges').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove]');
      if (btn) btn.closest('[data-charge]').remove();
    });

    $('completeClose').addEventListener('click', closeCompleteModal);
    $('completeCancel').addEventListener('click', closeCompleteModal);
    $('completeSave').addEventListener('click', saveComplete);

    $('releaseClose').addEventListener('click', closeReleaseModal);
    $('releaseCancel').addEventListener('click', closeReleaseModal);
    $('releaseSave').addEventListener('click', saveRelease);
    $('addStockLine').addEventListener('click', () => {
      $('stockLines').insertAdjacentHTML('beforeend', buildStockLine());
    });
    $('stockLines').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove]');
      if (btn) btn.closest('[data-line]').remove();
    });

    $('prevPage').addEventListener('click', () => { state.page--; load(); });
    $('nextPage').addEventListener('click', () => { state.page++; load(); });
    $('tbody').addEventListener('click', handleTableClick);

    syncStickyOffset();
    window.addEventListener('resize', syncStickyOffset);
    load();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
