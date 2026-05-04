// Logic trang admin/warranty — quan ly don bao hanh.

(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  const STATUS_LABEL = {
    pending:           { text: 'Mới lên đơn',    cls: 'gray' },
    received:          { text: 'Đã tiếp nhận',  cls: 'blue' },
    recovered:         { text: 'Đã thu hồi',    cls: 'amber' },
    awaiting_warranty: { text: 'Đang chờ BH',   cls: 'purple' },
    warranty_done:     { text: 'Đã BH xong',    cls: 'cyan' },
    delivering:        { text: 'Đang trả khách', cls: 'orange' },
    completed:         { text: 'Hoàn tất',       cls: 'green' },
    cancelled:         { text: 'Huỷ',            cls: 'red' },
  };

  // 5 nhom item theo kind. Thu tu hien thi.
  const ITEM_GROUPS = [
    { kind: 'received_from_customer', label: '📥 Khách giao' },
    { kind: 'replacement',            label: '🔄 Thay từ kho' },
    { kind: 'sent_to_partner',        label: '📤 Gửi NCC' },
    { kind: 'received_back',          label: '📩 Nhận về NCC' },
    { kind: 'delivered_to_customer',  label: '🚚 Giao khách' },
  ];

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
    if (s.length >= 10) return s.slice(0, 10);
    return s;
  }
  function vnd(n) { return fmt.format(Number(n) || 0) + 'đ'; }

  // ---- Render bang -------------------------------------------
  function rowHtml(w) {
    const customer = w.customer_name
      ? `<b>${escape(w.customer_name)}</b><br><small class="text-muted">${escape(w.customer_phone || '')}${w.customer_type === 'dealer' ? ' · 🏪 Đại lý' : ''}</small>`
      : '<span class="text-muted">—</span>';
    const total = Number(w.cost_amount) || 0;
    const paid = Number(w.paid_amount) || 0;
    const debt = total - paid;
    const moneyCol = total > 0
      ? `<b>${vnd(total)}</b><br><small class="${debt > 0 ? 'text-danger' : 'text-muted'}">Đã thu: ${vnd(paid)}</small>`
      : '<span class="text-muted">—</span>';
    const device = [w.device_name, w.imei_search].filter(Boolean).map(escape).join('<br>');
    return `
      <tr>
        <td><b>${escape(w.code)}</b><br><small class="text-muted">${escape(w.creator_type || '')}</small></td>
        <td>${customer}</td>
        <td class="mono">${escape(w.license_plate || '—')}</td>
        <td class="imei-mono">${device || '<span class="text-muted">—</span>'}</td>
        <td title="${escape(w.reason_text || '')}" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escape(w.reason_text || '')}</td>
        <td>${fmtDate(w.request_date)}</td>
        <td>${escape(w.staff_name || '')}</td>
        <td>${moneyCol}</td>
        <td>${statusPill(w.status)}</td>
        <td><button class="btn ghost sm" data-act="detail" data-id="${w.id}">Chi tiết</button></td>
      </tr>`;
  }

  async function load() {
    const p = new URLSearchParams();
    Object.entries(state.filters).forEach(([k, v]) => { if (v) p.set(k, v); });
    p.set('page', state.page);
    p.set('limit', state.limit);
    const res = await api.get('/admin/warranty-orders?' + p.toString()).catch(() => null);
    if (!res) return;
    state.total = res.total;
    if (!res.items.length) {
      $('tbody').innerHTML = '<tr><td colspan="10" class="text-center text-muted" style="padding:24px">Chưa có đơn bảo hành nào</td></tr>';
    } else {
      $('tbody').innerHTML = res.items.map(rowHtml).join('');
    }
    const totalPage = Math.max(1, Math.ceil(res.total / state.limit));
    $('pageInfo').textContent = `Trang ${state.page} / ${totalPage} — ${res.total} đơn`;
    $('prevPage').disabled = state.page <= 1;
    $('nextPage').disabled = state.page >= totalPage;
  }

  // ---- Cache customers/technicians/products -----------------
  async function loadCustomers() {
    const p = new URLSearchParams(); p.set('limit', 200);
    const res = await api.get('/admin/customers?' + p.toString(), { silent: true }).catch(() => null);
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

  // ---- Modal tao/sua ---------------------------------------
  function openCreateModal() {
    $('modal').classList.add('open');
    $('modalTitle').textContent = 'Tạo đơn bảo hành';
    $('f_id').value = '';
    $('f_plate').value = '';
    $('f_device').value = '';
    $('f_imei').value = '';
    $('f_reason').value = '';
    $('f_address').value = '';
    $('f_cost').value = 0;
    $('f_note').value = '';
    refillCustomers();
  }
  function openEditModal(w) {
    $('modal').classList.add('open');
    $('modalTitle').textContent = `Sửa ${w.code}`;
    $('f_id').value = w.id;
    $('f_plate').value = w.license_plate || '';
    $('f_device').value = w.device_name || '';
    $('f_imei').value = w.imei_search || '';
    $('f_reason').value = w.reason_text || '';
    $('f_address').value = w.address || '';
    $('f_cost').value = w.cost_amount || 0;
    $('f_note').value = w.note_text || '';
    refillCustomers(w.customer_id);
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
      cost_amount:   Number($('f_cost').value) || 0,
      note:          $('f_note').value.trim() || null,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const data = readForm();
    if (!data.customer_id) return ui.toast('Chọn khách hàng / đại lý', 'warning');
    if (!data.reason)      return ui.toast('Nhập lý do bảo hành', 'warning');

    const id = $('f_id').value;
    $('btnSave').disabled = true;
    let r;
    if (id) {
      r = await api.put(`/admin/warranty-orders/${id}`, data, {
        successMessage: 'Đã cập nhật đơn', loading: true,
      }).catch(() => null);
    } else {
      r = await api.post('/admin/warranty-orders', data, {
        successMessage: 'Đã tạo đơn bảo hành', loading: true,
      }).catch(() => null);
    }
    $('btnSave').disabled = false;
    if (!r) return;
    closeModal();
    load();
  }

  // ---- Modal detail -----------------------------------------
  let currentDetail = null;

  function renderActionBar(w) {
    const buttons = [];
    const nonTerminal = !['completed', 'cancelled'].includes(w.status);

    if (w.status === 'pending') {
      buttons.push(`<button class="btn" data-act="receive">📥 Tiếp nhận đơn</button>`);
    }
    if (w.status === 'received') {
      buttons.push(`<small class="text-muted" style="align-self:center">KTV chụp ảnh thu hồi qua app KTV</small>`);
    }
    if (w.status === 'recovered') {
      buttons.push(`<button class="btn" data-act="send-out">📦 Gửi đi NCC</button>`);
      buttons.push(`<button class="btn ghost" data-act="start-deliver">🚚 Trả khách luôn</button>`);
    }
    if (w.status === 'awaiting_warranty') {
      buttons.push(`<button class="btn" data-act="mark-returned">✅ Đã nhận về</button>`);
    }
    if (w.status === 'warranty_done') {
      buttons.push(`<button class="btn" data-act="start-deliver">🚚 Bắt đầu giao trả</button>`);
    }
    if (w.status === 'delivering') {
      buttons.push(`<button class="btn" data-act="complete">✓ Hoàn tất + Thu tiền</button>`);
    }
    if (nonTerminal) {
      buttons.push(`<button class="btn ghost" data-act="assign">👷 ${w.assigned_staff_id ? 'Đổi' : 'Gán'} KTV</button>`);
      buttons.push(`<button class="btn ghost" data-act="cancel" style="color:var(--danger)">✗ Huỷ đơn</button>`);
    }
    return buttons.length ? `<div class="action-bar">${buttons.join('')}</div>` : '';
  }

  // ---- Render items theo group ------------------------------
  function renderItemsSection(w) {
    const byKind = {};
    for (const it of (w.items || [])) {
      (byKind[it.kind] = byKind[it.kind] || []).push(it);
    }
    const editable = !['completed', 'cancelled'].includes(w.status);
    const hasUnreleased = (byKind.replacement || []).some(it => !it.released_at && it.product_id);

    const groups = ITEM_GROUPS.map(g => {
      const items = byKind[g.kind] || [];
      const rows = items.map(it => {
        const releasePill = it.kind === 'replacement'
          ? (it.released_at
              ? '<span class="pill success" style="font-size:11px">đã xuất kho</span>'
              : (it.product_id
                  ? '<span class="pill warning" style="font-size:11px">chưa xuất kho</span>'
                  : '<span class="pill gray" style="font-size:11px">nhập tay</span>'))
          : '';
        const acts = editable
          ? `<div class="it-acts">
               <button class="btn ghost" data-act="item-edit" data-item="${it.id}">Sửa</button>
               <button class="btn ghost" data-act="item-del" data-item="${it.id}" style="color:var(--danger)">Xoá</button>
             </div>`
          : '';
        const total = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
        return `
          <div class="item-row">
            <div class="nm"><b>${escape(it.name || '')}</b>${it.imei ? ` <span class="it-imei">· ${escape(it.imei)}</span>` : ''}</div>
            <div class="it-meta">SL: <b>${it.qty}</b></div>
            <div class="it-meta">Đơn giá: <b>${vnd(it.unit_price)}</b></div>
            <div class="it-meta">Thành tiền: <b>${vnd(total)}</b></div>
            ${releasePill ? `<div>${releasePill}</div>` : ''}
            ${acts}
          </div>
        `;
      }).join('');

      const addBtn = editable
        ? `<button class="btn ghost sm" data-act="item-add" data-kind="${g.kind}">+ Thêm</button>`
        : '';
      const releaseBtn = (g.kind === 'replacement' && hasUnreleased && editable)
        ? `<button class="btn sm" data-act="release-stock" style="margin-left:6px">📦 Xuất kho cho đơn</button>`
        : '';
      return `
        <div class="item-group">
          <h5>${g.label} <span>${addBtn}${releaseBtn}</span></h5>
          ${rows || '<div class="ig-empty">— Chưa có —</div>'}
        </div>`;
    }).join('');

    return `
      <div class="wr-detail-section">
        <h4>📦 Danh sách sản phẩm</h4>
        ${groups}
      </div>`;
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
      <div class="wr-detail-section">
        <h4>📑 Phiếu xuất kho liên quan</h4>
        <table class="data" style="font-size:13px">
          <thead><tr><th>Mã</th><th>Sản phẩm</th><th>Người tạo</th><th>Ngày</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  async function openDetail(id) {
    const res = await api.get(`/admin/warranty-orders/${id}`, { loading: true }).catch(() => null);
    if (!res) return;
    currentDetail = res;
    $('detailTitle').textContent = `${res.code} — ${STATUS_LABEL[res.status] ? STATUS_LABEL[res.status].text : res.status}`;

    const cost = Number(res.cost_amount) || 0;
    const paid = Number(res.paid_amount) || 0;
    const debt = cost - paid;

    const photos = [];
    if (res.recovered_image_url) photos.push(`
      <div class="wr-photo"><a href="${escape(res.recovered_image_url)}" target="_blank"><img src="${escape(res.recovered_image_url)}" alt="Thu hồi"></a><div class="text-muted" style="padding:4px 6px;font-size:12px">Ảnh thu hồi</div></div>`);
    if (res.delivered_image_url) photos.push(`
      <div class="wr-photo"><a href="${escape(res.delivered_image_url)}" target="_blank"><img src="${escape(res.delivered_image_url)}" alt="Giao lại"></a><div class="text-muted" style="padding:4px 6px;font-size:12px">Ảnh giao lại</div></div>`);

    $('detailBody').innerHTML = `
      <div class="grid cols-2" style="font-size:14px">
        <div><b>Khách:</b> ${escape(res.customer_name || '—')} ${res.customer_type === 'dealer' ? '<span class="pill orange" style="font-size:11px">Đại lý</span>' : ''}</div>
        <div><b>SĐT:</b> ${escape(res.customer_phone || '—')}</div>
        <div><b>Biển số:</b> <span class="mono">${escape(res.license_plate || '—')}</span></div>
        <div><b>Thiết bị:</b> ${escape(res.device_name || '—')}</div>
        <div><b>IMEI tham khảo:</b> <span class="imei-mono">${escape(res.imei_search || '—')}</span></div>
        <div><b>Trạng thái:</b> ${statusPill(res.status)}</div>
        <div><b>Ngày tạo:</b> ${fmtDate(res.request_date)}</div>
        <div><b>KTV:</b> ${escape(res.staff_name || '—')}${res.staff_phone ? ` <small class="text-muted">(${escape(res.staff_phone)})</small>` : ''}</div>
        <div><b>Gửi NCC:</b> ${escape(res.warranty_partner || '—')}</div>
        <div><b>Ngày gửi → về:</b> ${fmtDate(res.sent_at)} → ${fmtDate(res.returned_at)}</div>
      </div>
      <div class="wr-detail-section">
        <h4>📋 Lý do bảo hành</h4>
        <div style="white-space:pre-wrap">${escape(res.reason_text || '')}</div>
      </div>
      ${res.address ? `
        <div class="wr-detail-section">
          <h4>📍 Địa chỉ thu hồi</h4>
          <div style="white-space:pre-wrap">${escape(res.address)}</div>
        </div>` : ''}
      ${res.note_text ? `
        <div class="wr-detail-section">
          <h4>📝 Ghi chú</h4>
          <div style="white-space:pre-wrap">${escape(res.note_text)}</div>
        </div>` : ''}
      ${renderItemsSection(res)}
      <div class="wr-detail-section">
        <h4>💰 Chi phí</h4>
        <div class="row" style="gap:24px;align-items:center">
          <div>Tổng phí: <span class="wr-money">${vnd(cost)}</span></div>
          <div>Đã thu: <span class="wr-money">${vnd(paid)}</span></div>
          <div>Còn nợ: <span class="wr-money ${debt > 0 ? 'debt' : ''}">${vnd(debt)}</span></div>
          <button type="button" class="btn ghost sm" data-act="payment">Cập nhật</button>
        </div>
        ${res.debt_carried_at ? `<p class="help" style="color:#16a34a;margin-top:6px">✓ Đã kết vào phiếu tất toán ngày ${fmtDate(res.debt_carried_at)}</p>` : ''}
      </div>
      ${photos.length ? `
        <div class="wr-detail-section">
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
    const r = await fn(`/admin/warranty-orders/${currentDetail.id}/${action}`, body || {}, {
      successMessage: successMsg, loading: true,
    }).catch(() => null);
    if (r) { openDetail(currentDetail.id); load(); }
  }

  function handleCancel() {
    if (!currentDetail) return;
    ui.confirm({
      title: 'Huỷ đơn?',
      message: `Huỷ đơn bảo hành ${currentDetail.code}?`,
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
    const r = await api.delete(`/admin/warranty-orders/${currentDetail.id}`, {
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
    const r = await api.post(`/admin/warranty-orders/${currentDetail.id}/assign`, { staff_id: staffId }, {
      successMessage: staffId ? 'Đã gán KTV' : 'Đã bỏ gán', loading: true,
    }).catch(() => null);
    if (r) { closeAssignModal(); openDetail(currentDetail.id); load(); }
  }

  // ---- Modal: Gui di NCC ------------------------------------
  function openSendModal() {
    if (!currentDetail) return;
    $('sm_partner').value = currentDetail.warranty_partner || '';
    $('sendModal').classList.add('open');
  }
  function closeSendModal() { $('sendModal').classList.remove('open'); }
  async function saveSend() {
    if (!currentDetail) return;
    const partner = $('sm_partner').value.trim() || null;
    const r = await api.post(`/admin/warranty-orders/${currentDetail.id}/send-out`,
      { warranty_partner: partner },
      { successMessage: 'Đã chuyển sang chờ bảo hành', loading: true }).catch(() => null);
    if (r) { closeSendModal(); openDetail(currentDetail.id); load(); }
  }

  // ---- Modal: Hoan tat 3 nhanh ------------------------------
  function syncCompleteSplit() {
    const cost = Math.max(0, Number($('cm_cost').value) || 0);
    const paidBefore = Number($('cm_paid_before').dataset.value || 0);
    const remaining = Math.max(0, cost - paidBefore);
    $('cm_remaining').textContent = vnd(remaining);
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
  function openCompleteModal() {
    if (!currentDetail) return;
    const cost = Number(currentDetail.cost_amount) || 0;
    const paid = Number(currentDetail.paid_amount) || 0;
    $('cm_cost').value = cost;
    $('cm_paid_before').textContent = vnd(paid);
    $('cm_paid_before').dataset.value = paid;
    $('cm_to_staff').value = 0;
    $('cm_to_staff_method').value = 'cash';
    $('cm_to_admin').value = Math.max(0, cost - paid);
    $('cm_image').value = '';
    syncCompleteSplit();
    $('completeModal').classList.add('open');
  }
  function closeCompleteModal() { $('completeModal').classList.remove('open'); }
  async function saveComplete() {
    if (!currentDetail) return;
    const cost = Math.max(0, Number($('cm_cost').value) || 0);
    const toStaff = Math.max(0, Number($('cm_to_staff').value) || 0);
    const toStaffMethod = $('cm_to_staff_method').value;
    const toAdmin = Math.max(0, Number($('cm_to_admin').value) || 0);
    const debt = Math.max(0, Number($('cm_debt').value) || 0);
    const paidBefore = Number($('cm_paid_before').dataset.value || 0);
    const remaining = Math.max(0, cost - paidBefore);
    if (toStaff + toAdmin + debt !== remaining) {
      return ui.toast('Tổng 3 phần phải bằng phần còn lại', 'error');
    }
    if (toStaff > 0 && !currentDetail.assigned_staff_id) {
      return ui.toast('Đơn chưa gán KTV — không ghi nhận KTV thu được', 'error');
    }
    const body = {
      cost_amount: cost,
      to_staff_amount: toStaff,
      to_staff_method: toStaffMethod,
      to_admin_amount: toAdmin,
      debt_amount: debt,
      expected_amount: remaining,
    };
    const img = $('cm_image').value.trim();
    if (img) body.delivered_image_url = img;
    const r = await api.post(`/admin/warranty-orders/${currentDetail.id}/complete`, body,
      { successMessage: 'Đã hoàn tất đơn', loading: true }).catch(() => null);
    if (r) { closeCompleteModal(); openDetail(currentDetail.id); load(); }
  }

  // ---- Modal: Them/Sua item ---------------------------------
  function refillProductSelect(selectedId) {
    const html = ['<option value="">— Chọn sản phẩm —</option>'];
    state.products.forEach(p => {
      html.push(`<option value="${p.id}" data-name="${escape(p.name)}" ${p.id == selectedId ? 'selected' : ''}>${escape(p.code)} — ${escape(p.name)}</option>`);
    });
    $('it_product').innerHTML = html.join('');
  }

  function openItemModal(kind, item) {
    if (!currentDetail) return;
    $('itemModal').dataset.editId = item ? item.id : '';
    $('itemModalTitle').textContent = item
      ? `Sửa sản phẩm — ${ITEM_GROUPS.find(g => g.kind === kind)?.label || kind}`
      : `Thêm sản phẩm — ${ITEM_GROUPS.find(g => g.kind === kind)?.label || kind}`;
    $('it_id').value = item ? item.id : '';
    $('it_kind').value = kind;
    refillProductSelect(item && item.product_id);
    const isManual = item ? !item.product_id : false;
    document.querySelectorAll('input[name="it_src"]').forEach(r => {
      r.checked = (r.value === (isManual ? 'manual' : 'stock'));
    });
    $('it_product_field').style.display = isManual ? 'none' : '';
    $('it_name').value = item ? (item.name || '') : '';
    $('it_imei').value = item ? (item.imei || '') : '';
    $('it_qty').value = item ? (item.qty || 1) : 1;
    $('it_price').value = item ? (item.unit_price || 0) : 0;
    $('it_note').value = item ? (item.note || '') : '';
    $('itemModal').classList.add('open');
  }
  function closeItemModal() { $('itemModal').classList.remove('open'); }

  function onItemSrcChange(e) {
    if (e.target.name !== 'it_src') return;
    const isManual = e.target.value === 'manual';
    $('it_product_field').style.display = isManual ? 'none' : '';
    if (isManual) $('it_product').value = '';
  }
  function onItemProductChange() {
    const opt = $('it_product').selectedOptions[0];
    if (opt && opt.dataset.name && !$('it_name').value) {
      $('it_name').value = opt.dataset.name;
    }
  }
  async function saveItem() {
    if (!currentDetail) return;
    const editId = $('itemModal').dataset.editId;
    const isManual = document.querySelector('input[name="it_src"]:checked').value === 'manual';
    const body = {
      kind: $('it_kind').value,
      product_id: isManual ? null : (Number($('it_product').value) || null),
      name: $('it_name').value.trim(),
      imei: $('it_imei').value.trim() || null,
      qty: Number($('it_qty').value) || 1,
      unit_price: Number($('it_price').value) || 0,
      note: $('it_note').value.trim() || null,
    };
    if (!body.name) return ui.toast('Nhập tên sản phẩm', 'warning');
    if (!isManual && !body.product_id) return ui.toast('Chọn sản phẩm trong kho', 'warning');
    let r;
    if (editId) {
      const { kind, ...patch } = body;
      r = await api.put(`/admin/warranty-orders/items/${editId}`, patch,
        { successMessage: 'Đã cập nhật', loading: true }).catch(() => null);
    } else {
      r = await api.post(`/admin/warranty-orders/${currentDetail.id}/items`, body,
        { successMessage: 'Đã thêm sản phẩm', loading: true }).catch(() => null);
    }
    if (r) { closeItemModal(); openDetail(currentDetail.id); load(); }
  }
  async function deleteItem(itemId) {
    const ok = await ui.confirm({ title: 'Xoá sản phẩm?', message: 'Xác nhận xoá dòng này?', okText: 'Xoá' });
    if (!ok) return;
    const r = await api.delete(`/admin/warranty-orders/items/${itemId}`,
      { successMessage: 'Đã xoá', loading: true }).catch(() => null);
    if (r) { openDetail(currentDetail.id); load(); }
  }

  // ---- Action: Xuat kho cho don (auto theo items) -----------
  async function releaseStock() {
    if (!currentDetail) return;
    const ok = await ui.confirm({
      title: 'Xuất kho cho đơn?',
      message: 'Sẽ tạo phiếu xuất kho cho TẤT CẢ sản phẩm "Thay từ kho" chưa xuất, có gắn product_id.',
      okText: 'Xuất kho',
    });
    if (!ok) return;
    const r = await api.post(`/admin/warranty-orders/${currentDetail.id}/release-stock`, {},
      { successMessage: 'Đã xuất kho', loading: true }).catch(() => null);
    if (r) { openDetail(currentDetail.id); load(); }
  }

  // ---- Modal: Cap nhat thanh toan ---------------------------
  async function handlePayment() {
    if (!currentDetail) return;
    const cost = prompt('Tổng phí bảo hành (VND):', currentDetail.cost_amount || 0);
    if (cost == null) return;
    const paid = prompt('Đã thu (VND):', currentDetail.paid_amount || 0);
    if (paid == null) return;
    callAction('payment', {
      cost_amount: Math.max(0, Number(cost) || 0),
      paid_amount: Math.max(0, Number(paid) || 0),
    }, 'Đã cập nhật thanh toán', 'patch');
  }

  function handleDetailClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'receive')         callAction('receive', {}, 'Đã tiếp nhận đơn');
    else if (act === 'assign')     openAssignModal();
    else if (act === 'send-out')   openSendModal();
    else if (act === 'mark-returned') callAction('mark-returned', {}, 'Đã ghi nhận sản phẩm về');
    else if (act === 'start-deliver') callAction('start-deliver', {}, 'Đã chuyển sang đang trả khách');
    else if (act === 'complete')   openCompleteModal();
    else if (act === 'cancel')     handleCancel();
    else if (act === 'release-stock') releaseStock();
    else if (act === 'payment')    handlePayment();
    else if (act === 'item-add')   openItemModal(btn.dataset.kind, null);
    else if (act === 'item-edit')  {
      const id = Number(btn.dataset.item);
      const it = (currentDetail.items || []).find(x => x.id === id);
      if (it) openItemModal(it.kind, it);
    }
    else if (act === 'item-del')   deleteItem(Number(btn.dataset.item));
  }

  // ---- Click handlers --------------------------------------
  function handleTableClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    if (btn.dataset.act === 'detail') openDetail(btn.dataset.id);
  }

  // ---- Filters / pager / quick tabs -------------------------
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

  // ---- Init ------------------------------------------------
  async function init() {
    adminShell.init('warranty');
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

    $('sendClose').addEventListener('click', closeSendModal);
    $('sendCancel').addEventListener('click', closeSendModal);
    $('sendSave').addEventListener('click', saveSend);

    $('completeClose').addEventListener('click', closeCompleteModal);
    $('completeCancel').addEventListener('click', closeCompleteModal);
    $('completeSave').addEventListener('click', saveComplete);
    ['cm_cost', 'cm_to_staff', 'cm_to_admin'].forEach(id => {
      $(id).addEventListener('input', syncCompleteSplit);
    });

    $('itemClose').addEventListener('click', closeItemModal);
    $('itemCancel').addEventListener('click', closeItemModal);
    $('itemModal').addEventListener('click', (e) => { if (e.target.id === 'itemModal') closeItemModal(); });
    $('itemSave').addEventListener('click', saveItem);
    $('itemModal').addEventListener('change', onItemSrcChange);
    $('it_product').addEventListener('change', onItemProductChange);

    $('prevPage').addEventListener('click', () => { state.page--; load(); });
    $('nextPage').addEventListener('click', () => { state.page++; load(); });
    $('tbody').addEventListener('click', handleTableClick);

    syncStickyOffset();
    window.addEventListener('resize', syncStickyOffset);
    load();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
