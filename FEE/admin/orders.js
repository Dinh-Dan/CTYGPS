// Logic trang admin/orders — CRUD don hang + duyet/gan KTV/xuat kho/thanh toan/huy

(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  const STATUS_LABEL = {
    pending_review:        { text: 'Yêu cầu',           cls: 'purple' },
    new:                   { text: 'Đã chốt',           cls: 'gray'   },
    assigned:              { text: 'Đã giao KTV',       cls: 'blue'   },
    warehouse_released:    { text: 'Đã xuất kho',       cls: 'cyan'   },
    in_progress:           { text: 'Đang làm',          cls: 'amber'  },
    customer_owes:         { text: 'Khách nợ',          cls: 'red'    },
    pending_admin_confirm: { text: 'Chờ admin xác nhận', cls: 'amber' },
    staff_owes:            { text: 'KTV đang giữ tiền', cls: 'amber'  },
    done:                  { text: 'Hoàn thành',        cls: 'green'  },
    cancelled:             { text: 'Huỷ',               cls: 'red'    },
    quoted:                { text: 'Đã báo giá',        cls: 'cyan'   },
    awaiting_payment:      { text: 'Chờ thanh toán',    cls: 'amber'  },
    payment_reported:      { text: 'Khách báo CK',      cls: 'blue'   },
  };
  const BADGE_STATUS_LABEL = {
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
  const SERVICE_KIND_LABEL = {
    install: 'Lắp đặt', maintenance: 'Bảo trì',
    warranty: 'Bảo hành', renewal: 'Gia hạn', badge: 'Phù hiệu xe',
  };
  const KIND_LABEL = {
    install: 'Lắp đặt', maintenance: 'Bảo trì',
    renew: 'Gia hạn', uninstall: 'Tháo gỡ',
  };
  const PAYMENT_LABEL = {
    cash: 'Tiền mặt', transfer: 'Chuyển khoản', debt: 'Công nợ',
  };
  const STAGE_LABEL = { receive: 'Lúc nhận', deliver: 'Lúc giao', other: 'Khác' };

  const state = {
    filters: { q: '', status: '', service_kind: '', has_return: '', date_from: '', date_to: '' },
    page: 1, limit: 20, total: 0,
    products: [],
    customers: [],
  };

  const FINAL_STATUSES_FE = ['done', 'customer_owes', 'pending_admin_confirm', 'staff_owes'];
  let rrMode = null; // 'cancel' | 'return-done'

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }
  function statusPill(s) {
    const def = STATUS_LABEL[s] || { text: s, cls: 'gray' };
    return `<span class="pill ${def.cls}">${def.text}</span>`;
  }
  function badgeStatusPill(s) {
    const def = BADGE_STATUS_LABEL[s] || { text: s, cls: 'gray' };
    return `<span class="pill ${def.cls}">${def.text}</span>`;
  }
  function fmtDate(d) {
    if (!d) return '—';
    return String(d).replace('T', ' ').slice(0, 16);
  }

  // ---- Render bang -------------------------------------------
  function fmtDateOnly(d) {
    if (!d) return '—';
    const s = String(d);
    // YYYY-MM-DD HH:mm:ss -> DD/MM/YYYY + HH:mm
    const date = s.slice(0, 10).split('-');
    const time = s.slice(11, 16);
    if (date.length !== 3) return s;
    return `${date[2]}/${date[1]}/${date[0]}<br><small class="text-muted">${time}</small>`;
  }

  function accountCell(o) {
    if (!o.customer_name) return '<span class="text-muted">—</span>';
    const isDealer = o.customer_type === 'dealer';
    const tag = isDealer
      ? `<span class="pill" style="background:#ffedd5;color:#9a3412;font-size:11px;margin-left:6px">🏪 Đại lý</span>`
      : `<span class="pill gray" style="font-size:11px;margin-left:6px">👤 Khách</span>`;
    let html = `<b>${escape(o.customer_name)}</b>${tag}<br>`
             + `<small class="text-muted">${escape(o.customer_phone || '')}</small>`;
    // Don cu dat ho qua dai ly khac (dealer_id != customer_id) — hien dong "qua DL"
    if (o.dealer_id && o.dealer_name && o.dealer_id !== o.customer_id) {
      html += `<br><small class="text-muted">qua đại lý: ${escape(o.dealer_name)}</small>`;
    }
    return html;
  }

  function rowHtml(o) {
    const isBadge = o.service_kind === 'badge';
    const returnBadge = Number(o.has_return) === 1
      ? ` <span class="pill" style="background:#fef3c7;color:#92400e" title="Có sản phẩm khách trả lại">↩ Trả</span>` : '';
    const statusCell = isBadge && o.badge_status
      ? badgeStatusPill(o.badge_status)
      : statusPill(o.status) + returnBadge;
    const tail = isBadge
      ? `<small class="text-muted">🪪 Phù hiệu</small>`
      : `${o.task_count || 0} / ${o.item_count || 0} SP`;
    const kindLabel = SERVICE_KIND_LABEL[o.service_kind] || o.service_kind || '—';
    const plateLine = o.vehicle_plate
      ? `<br><small class="text-muted">🚗 ${escape(o.vehicle_plate)}</small>`
      : '';
    return `
      <tr>
        <td><b>${escape(o.code)}</b><br><small class="text-muted">${escape(o.creator_type || '')}</small>${plateLine}</td>
        <td>${fmtDateOnly(o.created_at)}</td>
        <td>${accountCell(o)}</td>
        <td><span class="pill blue" style="font-size:12px">${escape(kindLabel)}</span><br><small class="text-muted">${tail}</small></td>
        <td>${fmt.format(o.total_amount || 0)}đ<br><small class="text-muted">đã trả ${fmt.format(o.paid_amount||0)}đ</small></td>
        <td>${statusCell}</td>
        <td>
          <button class="btn ghost sm" data-act="detail" data-id="${o.id}">Chi tiết</button>
        </td>
      </tr>`;
  }

  async function load() {
    const p = new URLSearchParams();
    Object.entries(state.filters).forEach(([k, v]) => { if (v) p.set(k, v); });
    p.set('page', state.page);
    p.set('limit', state.limit);
    const res = await api.get('/admin/orders?' + p.toString()).catch(() => null);
    if (!res) return;
    state.total = res.total;
    if (!res.items.length) {
      $('tbody').innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding:24px">Chưa có đơn nào</td></tr>';
    } else {
      $('tbody').innerHTML = res.items.map(rowHtml).join('');
    }
    const totalPage = Math.max(1, Math.ceil(res.total / state.limit));
    $('pageInfo').textContent = `Trang ${state.page} / ${totalPage} — ${res.total} đơn`;
    $('prevPage').disabled = state.page <= 1;
    $('nextPage').disabled = state.page >= totalPage;
  }

  // ---- Cache ---------------------------------------------------
  async function loadProducts() {
    if (state.products.length) return;
    const res = await api.get('/admin/inventory/products/all', { silent: true }).catch(() => null);
    state.products = (res && res.items) || [];
  }
  async function loadCustomers() {
    const p = new URLSearchParams(); p.set('limit', 100);
    const res = await api.get('/admin/customers?' + p.toString(), { silent: true }).catch(() => null);
    state.customers = (res && res.items) || [];
  }

  // ---- Modal tao don -----------------------------------------
  function openModal() {
    $('modal').classList.add('open');
    $('modalTitle').textContent = 'Tạo đơn hàng';
    $('f_id').value = '';
    $('f_area').value = '';
    $('f_plate').value = '';
    $('f_address').value = '';
    $('f_payment').value = 'cash';
    $('f_paid').value = 0;
    $('f_note').value = '';
    if ($('f_draft')) $('f_draft').checked = false;
    $('itemsList').innerHTML = '';
    addItemRow();
    refillCustomers();
    refillDealers();
    recalcTotal();
  }
  function closeModal() { $('modal').classList.remove('open'); }

  function refillCustomers() {
    const html = ['<option value="">— Chọn khách —</option>'];
    state.customers.forEach(c => {
      const label = `${c.code} — ${c.full_name}${c.phone ? ' (' + c.phone + ')' : ''}`;
      html.push(`<option value="${c.id}">${escape(label)}</option>`);
    });
    $('f_customer').innerHTML = html.join('');
  }
  function refillDealers() {
    const html = ['<option value="">— Không —</option>'];
    state.customers.filter(c => c.type === 'dealer').forEach(c => {
      const label = `${c.code} — ${c.company_name || c.full_name}`;
      html.push(`<option value="${c.id}">${escape(label)}</option>`);
    });
    $('f_dealer').innerHTML = html.join('');
  }

  function itemRowHtml(idx, item = {}) {
    const productOptions = ['<option value="">— Sản phẩm —</option>']
      .concat(state.products.map(p => `<option value="${p.id}" ${item.product_id == p.id ? 'selected' : ''}>${escape(p.code + ' — ' + p.name)}</option>`))
      .join('');
    return `
      <div class="item-row" data-idx="${idx}">
        <select class="select item-product">${productOptions}</select>
        <input type="number" class="input item-qty" min="1" value="${item.qty || 1}" placeholder="SL">
        <input type="number" class="input item-price" min="0" step="1000" value="${item.unit_price || 0}" placeholder="Đơn giá">
        <span class="item-sub text-right" style="align-self:center;font-weight:600">0đ</span>
        <button type="button" class="btn ghost item-del" title="Xoá">×</button>
      </div>`;
  }
  function addItemRow(item) {
    const idx = $('itemsList').children.length;
    $('itemsList').insertAdjacentHTML('beforeend', itemRowHtml(idx, item || {}));
    recalcTotal();
  }
  function recalcTotal() {
    let total = 0;
    $('itemsList').querySelectorAll('.item-row').forEach(row => {
      const qty = Number(row.querySelector('.item-qty').value) || 0;
      const price = Number(row.querySelector('.item-price').value) || 0;
      const sub = qty * price;
      row.querySelector('.item-sub').textContent = fmt.format(sub) + 'đ';
      total += sub;
    });
    $('totalSum').textContent = fmt.format(total);
    return total;
  }

  function readForm() {
    const items = [];
    $('itemsList').querySelectorAll('.item-row').forEach(row => {
      const product_id = Number(row.querySelector('.item-product').value);
      const qty = Math.max(1, Number(row.querySelector('.item-qty').value) || 1);
      const unit_price = Number(row.querySelector('.item-price').value) || 0;
      if (product_id) items.push({ product_id, qty, unit_price });
    });
    const isDraft = $('f_draft') && $('f_draft').checked;
    return {
      customer_id: Number($('f_customer').value),
      dealer_id: $('f_dealer').value ? Number($('f_dealer').value) : null,
      area: $('f_area').value.trim() || null,
      address: $('f_address').value.trim() || null,
      vehicle_plate: $('f_plate').value.trim() || null,
      payment_method: $('f_payment').value,
      paid_amount: Number($('f_paid').value) || 0,
      note: $('f_note').value.trim() || null,
      status: isDraft ? 'pending_review' : 'new',
      items,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const data = readForm();
    if (!data.customer_id) return ui.toast('Chọn khách hàng', 'warning');
    if (!data.items.length) return ui.toast('Đơn phải có ít nhất 1 sản phẩm', 'warning');

    $('btnSave').disabled = true;
    const ok = await api.post('/admin/orders', data, {
      successMessage: data.status === 'pending_review' ? 'Đã lưu yêu cầu' : 'Đã tạo đơn hàng',
      loading: true,
    }).catch(() => null);
    $('btnSave').disabled = false;
    if (!ok) return;
    closeModal();
    load();
  }

  // ---- Modal chi tiet ----------------------------------------
  let currentDetail = null;

  function renderChargesSection(charges) {
    const list = (charges || []).map(c => {
      const isDiscount = Number(c.amount) < 0;
      return `
        <div class="charge-list-row">
          <span class="cg-sign-tag ${isDiscount ? 'minus' : 'plus'}">${isDiscount ? '−' : '+'}</span>
          <span class="cg-label-show">${escape(c.label || '—')}</span>
          <span class="cg-amount-show ${isDiscount ? 'green' : 'red'}">${fmt.format(Math.abs(Number(c.amount) || 0))}đ</span>
          <button type="button" class="btn ghost sm cg-del" data-charge-id="${c.id}" title="Xoá">×</button>
        </div>`;
    }).join('');
    return `
      <div class="charges-list">${list || '<p class="text-muted" style="margin:0;font-size:13px">Chưa có chi phí nào.</p>'}</div>
      <div class="charge-add-form">
        <select class="select" id="cg_label_preset" style="flex:0 0 150px">
          <option value="Lắp đặt">Lắp đặt</option>
          <option value="Vận chuyển">Vận chuyển</option>
          <option value="Giảm giá">Giảm giá</option>
          <option value="__other__">Khác (tự nhập)…</option>
        </select>
        <input class="input" id="cg_label_custom" placeholder="Nhập nhãn..." style="display:none;flex:1">
        <button type="button" class="btn ghost sm cg-sign-btn" id="cg_sign" data-sign="+" title="Cộng / Trừ">+</button>
        <input class="input" type="number" id="cg_value" min="0" step="1000" placeholder="Số tiền" style="flex:0 0 130px">
        <button type="button" class="btn sm" id="cg_add">+ Thêm</button>
      </div>
    `;
  }


  // ---- Don phu hieu xe — render UI rieng + giu nguyen flow badge ----
  function renderBadgeDetail(o) {
    const b = o.badge || {};
    const buttons = [];
    if (b.status === 'pending_review') buttons.push(`<button class="btn" data-bact="submit">📤 Nộp Sở GTVT</button>`);
    if (b.status === 'submitted') {
      buttons.push(`<button class="btn" data-bact="approve">✓ Có kết quả (đã duyệt)</button>`);
      buttons.push(`<button class="btn ghost" data-bact="reject" style="color:var(--danger)">✗ Bị từ chối</button>`);
    }
    if (b.status === 'rejected') buttons.push(`<button class="btn" data-bact="resubmit">📤 Nộp lại</button>`);
    if (b.status === 'approved')  buttons.push(`<button class="btn" data-bact="deliver">📦 Đã giao khách</button>`);
    const fee = Number(b.fee_amount || 0);
    const paid = Number(b.paid_amount || 0);
    if (fee > paid && !['cancelled'].includes(b.status)) {
      buttons.push(`<button class="btn" data-bact="markpaid">💰 Đã nhận đủ tiền</button>`);
    }
    if (!['delivered','cancelled'].includes(b.status)) {
      buttons.push(`<button class="btn ghost" data-bact="cancel" style="color:var(--danger)">✗ Huỷ</button>`);
    }
    buttons.push(`<button class="btn ghost" data-bact="editfee">✎ Sửa phí</button>`);

    return `
      <div class="order-detail-section">
        <div class="grid cols-2" style="font-size:14px">
          <div><b>Đơn:</b> ${escape(o.code)} · <span class="text-muted">🪪 Phù hiệu xe</span></div>
          <div><b>Khách:</b> ${escape(o.customer_name || '')} (${escape(o.customer_phone || '')})</div>
          <div><b>Đại lý:</b> ${o.dealer_name ? escape(o.dealer_name) : '—'}</div>
          <div><b>Mã hồ sơ:</b> ${escape(b.code || '—')}</div>
          <div><b>Biển số:</b> <b>${escape(b.vehicle_plate || o.vehicle_plate || '')}</b></div>
          <div><b>Loại xe:</b> ${VTYPE_LABEL[b.vehicle_type] || b.vehicle_type || '—'}</div>
          <div><b>Phí / Đã thu:</b> ${fmt.format(fee)}đ / ${fmt.format(paid)}đ</div>
          <div><b>Nộp Sở:</b> ${fmtDate(b.submitted_at)}</div>
          <div><b>Có kết quả:</b> ${fmtDate(b.result_at)}</div>
          <div><b>Đã giao KH:</b> ${fmtDate(b.delivered_at)}</div>
          <div><b>Người tạo:</b> ${escape(b.creator_type || o.creator_type || '')}</div>
        </div>
        ${b.reject_reason ? `<div style="margin-top:8px;background:#fee2e2;padding:8px;border-radius:6px"><b>Lý do từ chối:</b> ${escape(b.reject_reason)}</div>` : ''}
        ${b.note ? `<div style="margin-top:8px"><b>Ghi chú:</b> ${escape(b.note)}</div>` : ''}
      </div>
      ${buttons.length ? `<div class="action-bar">${buttons.join('')}</div>` : ''}
    `;
  }

  // ==========================================================
  // Don gia han: render rieng (form bao gia + link public + hoan tat)
  // ==========================================================
  // Khong co cot san pham — BE tu fill product_id = ID cua RENEW (migration 031).
  function renderRenewalRow(it, idx, editable) {
    if (editable) {
      return `
        <tr class="rn-row" data-idx="${idx}">
          <td><input class="input rn-phone" placeholder="0901234567" value="${escape(it && it.phone || '')}" style="width:120px"></td>
          <td><input class="input rn-plate" placeholder="51A-123, 51B-456" value="${escape(it && it.vehicle_plate || '')}" style="width:170px" title="Nhiều biển cách nhau dấu phẩy"></td>
          <td><input class="input rn-sub" placeholder="demoxetai" value="${escape(it && it.subscription_account || '')}" style="width:120px"></td>
          <td><input class="input rn-imei" placeholder="IMEI" value="${escape(it && it.imei || '')}" style="width:140px;font-family:monospace;font-size:12px"></td>
          <td><input class="input rn-years" type="number" min="1" max="10" value="${it && it.years || 1}" style="width:60px;text-align:center"></td>
          <td><input class="input rn-price" type="number" min="0" step="1000" value="${it && it.unit_price || 0}" style="width:120px;text-align:right"></td>
          <td><button type="button" class="btn ghost sm" data-rn-act="del-row">×</button></td>
        </tr>
      `;
    }
    return `
      <tr>
        <td>${escape(it && it.phone || '—')}</td>
        <td><b>${escape(it && it.vehicle_plate || '—')}</b></td>
        <td>${escape(it && it.subscription_account || '—')}</td>
        <td style="font-family:monospace;font-size:12px">${escape(it && it.imei || '—')}</td>
        <td style="text-align:center">${(it && it.years) || '—'}</td>
        <td style="text-align:right"><b>${fmt.format((it && it.unit_price) || 0)}đ</b></td>
      </tr>
    `;
  }

  function renderRenewalChargeEditor(charges) {
    const list = (charges || []).map((c, i) => `
      <div class="rn-charge-row" data-rn-cidx="${i}" style="display:flex;gap:6px;align-items:center;padding:6px 8px;background:#f8fafc;border-radius:6px;margin-bottom:4px">
        <input class="input rn-c-label" placeholder="Mô tả phí" value="${escape(c.label || '')}" style="flex:1">
        <input class="input rn-c-amount" type="number" step="1000" placeholder="Số tiền (âm = giảm giá)" value="${Number(c.amount) || 0}" style="width:160px;text-align:right">
        <button type="button" class="btn ghost sm" data-rn-act="del-charge">×</button>
      </div>
    `).join('');
    return `
      <div id="rnChargesList">${list}</div>
      <button type="button" class="btn ghost sm" id="rnAddCharge" style="margin-top:6px">+ Thêm phí / giảm giá</button>
      <p class="text-muted" style="font-size:12px;margin:6px 0 0 0">VD: "Phí dịch vụ" = +50000 · "Giảm giá khách quen" = -100000 (nhập số âm)</p>
    `;
  }

  function renderRenewalDetail(o) {
    const editable = ['pending_review', 'quoted'].includes(o.status);
    const items = (o.items || []);
    const total = Number(o.total_amount) || 0;
    const subtotal = Number(o.subtotal) || 0;
    const paid = Number(o.paid_amount) || 0;

    const tableHead = editable
      ? `<tr><th>SĐT</th><th>Biển số</th><th>TK app</th><th>IMEI</th><th>Năm</th><th>Đơn giá</th><th></th></tr>`
      : `<tr><th>SĐT</th><th>Biển số</th><th>TK app</th><th>IMEI</th><th>Năm</th><th>Đơn giá</th></tr>`;

    const rowsHtml = items.length
      ? items.map((it, i) => renderRenewalRow(it, i, editable)).join('')
      : (editable ? '' : '<tr><td colspan="6" class="text-muted text-center" style="padding:16px">— Chưa có dòng xe nào —</td></tr>');

    const editableActions = editable ? `
      <div class="row" style="gap:8px;margin-top:8px">
        <button type="button" class="btn ghost sm" id="rnAddRow">+ Thêm xe</button>
        <span style="flex:1"></span>
        <button type="button" class="btn" id="rnSubmitQuote">💾 ${o.status === 'quoted' ? 'Cập nhật báo giá' : 'Báo giá'}</button>
      </div>
    ` : '';

    // Section phi khac: editable o pending_review/quoted, readonly otherwise
    const chargesEditorHtml = editable
      ? renderRenewalChargeEditor(o.charges)
      : (o.charges || []).map(c =>
          `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px"><span>${escape(c.label)}</span><span>${fmt.format(c.amount)}đ</span></div>`
        ).join('') || '<p class="text-muted" style="margin:0">—</p>';

    // Link public — chi hien khi co public_token va dang o trang thai khach can mo
    const showLink = o.public_token && ['quoted','awaiting_payment','payment_reported'].includes(o.status);
    const publicUrl = showLink
      ? `${location.origin}/customer/order-public.html?t=${o.public_token}`
      : '';
    const linkHtml = showLink ? `
      <div class="order-detail-section">
        <h4>🔗 Link gửi khách</h4>
        <div class="row" style="gap:8px;align-items:center">
          <input class="input" id="rnPublicLink" readonly value="${escape(publicUrl)}" style="flex:1;font-size:13px;font-family:monospace">
          <button class="btn sm" id="rnCopyLink">Sao chép</button>
        </div>
        <p class="text-muted" style="font-size:13px;margin:6px 0 0 0">Gửi link này cho khách qua Zalo/SMS. Khách mở không cần đăng nhập.</p>
      </div>
    ` : '';

    // Status box + nut hoan tat
    let statusBox = '';
    let actionBtns = '';
    if (o.status === 'pending_review') {
      statusBox = `<div class="status-msg info" style="background:#dbeafe;color:#1e40af;padding:10px;border-radius:8px">📥 Khách vừa gửi yêu cầu. Hãy tra GoTrack rồi báo giá.</div>`;
    } else if (o.status === 'quoted') {
      statusBox = `<div class="status-msg info" style="background:#cffafe;color:#155e75;padding:10px;border-radius:8px">⏳ Đã báo giá — đang chờ khách mở link và chấp nhận / ghi nợ.</div>`;
    } else if (o.status === 'awaiting_payment') {
      const m = o.payment_method === 'debt'
        ? `<div class="status-msg" style="background:#fef3c7;color:#92400e;padding:10px;border-radius:8px">📋 Khách chọn <b>Ghi nợ</b>. Tiến hành gia hạn trên GoTrack rồi bấm Hoàn tất.</div>`
        : `<div class="status-msg" style="background:#fef3c7;color:#92400e;padding:10px;border-radius:8px">💳 Khách đã chấp nhận, đang chờ chuyển khoản.</div>`;
      statusBox = m;
      actionBtns = `<button class="btn" id="rnComplete">✓ Hoàn tất gia hạn</button>`;
    } else if (o.status === 'payment_reported') {
      statusBox = `<div class="status-msg" style="background:#dbeafe;color:#1e40af;padding:10px;border-radius:8px">💰 Khách báo đã CK — kiểm tra tài khoản, gia hạn xong rồi bấm Hoàn tất (hệ thống tự ghi nhận thanh toán).</div>`;
      actionBtns = `<button class="btn" id="rnComplete">✓ Hoàn tất + Xác nhận đã nhận tiền</button>`;
    } else if (o.status === 'done') {
      const remaining = total - paid;
      statusBox = remaining > 0
        ? `<div class="status-msg" style="background:#d1fae5;color:#065f46;padding:10px;border-radius:8px">✅ Đã hoàn tất gia hạn. Còn nợ <b>${fmt.format(remaining)}đ</b> — vào công nợ khách.</div>`
        : `<div class="status-msg" style="background:#d1fae5;color:#065f46;padding:10px;border-radius:8px">✅ Đã hoàn tất + thu đủ tiền.</div>`;
    } else if (o.status === 'cancelled') {
      statusBox = `<div class="status-msg" style="background:#fee2e2;color:#991b1b;padding:10px;border-radius:8px">Đã huỷ.</div>`;
    }

    return `
      <div class="order-detail-section">
        <div class="grid cols-2" style="font-size:14px">
          <div><b>Đơn:</b> ${escape(o.code)} · <span class="text-muted">🔄 Gia hạn</span></div>
          <div><b>Khách:</b> ${escape(o.customer_name || '')}${o.customer_phone ? ' (' + escape(o.customer_phone) + ')' : ''}</div>
          <div><b>Đại lý:</b> ${o.dealer_name ? escape(o.dealer_name) : '—'}</div>
          <div><b>Tổng / Đã thu:</b> <b>${fmt.format(total)}đ</b> / ${fmt.format(paid)}đ</div>
          <div><b>Phương thức:</b> ${PAYMENT_LABEL[o.payment_method] || o.payment_method}</div>
          <div><b>Người tạo:</b> ${escape(o.creator_type || '')}</div>
        </div>
        ${o.note ? `<div style="margin-top:8px;padding:8px;background:#f8fafc;border-radius:6px;font-size:14px"><b>Ghi chú khách:</b> ${escape(o.note)}</div>` : ''}
      </div>

      <div class="order-detail-section">
        <h4>🚗 Chi tiết các xe gia hạn</h4>
        <table class="data" id="rnTable" style="width:100%;font-size:13px">
          <thead>${tableHead}</thead>
          <tbody id="rnTbody">${rowsHtml}</tbody>
        </table>
        ${editableActions}
      </div>

      <div class="order-detail-section">
        <h4>💵 Phí khác / Giảm giá</h4>
        ${chargesEditorHtml}
        <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:6px;margin-top:8px;font-size:14px"><span>Tạm tính</span><span>${fmt.format(subtotal)}đ</span></div>
        <div style="display:flex;justify-content:space-between;font-weight:700;color:var(--primary);font-size:16px"><span>Tổng cộng</span><span>${fmt.format(total)}đ</span></div>
      </div>

      ${linkHtml}

      ${statusBox ? `<div class="order-detail-section">${statusBox}</div>` : ''}
      ${actionBtns ? `<div class="action-bar">${actionBtns}</div>` : ''}
    `;
  }

  function collectRenewalRows() {
    const rows = document.querySelectorAll('#rnTbody tr.rn-row');
    const items = [];
    rows.forEach(r => {
      // BE auto-fill product_id = RENEW (migration 031), FE khong gui product_id.
      items.push({
        qty: 1,
        unit_price: Math.max(0, Number(r.querySelector('.rn-price').value) || 0),
        phone: r.querySelector('.rn-phone').value.trim() || null,
        vehicle_plate: r.querySelector('.rn-plate').value.trim() || null,
        subscription_account: r.querySelector('.rn-sub').value.trim() || null,
        imei: r.querySelector('.rn-imei').value.trim() || null,
        years: Math.max(1, Math.min(10, Number(r.querySelector('.rn-years').value) || 1)),
      });
    });
    return items;
  }

  function collectRenewalCharges() {
    const rows = document.querySelectorAll('#rnChargesList .rn-charge-row');
    const charges = [];
    rows.forEach(r => {
      const label = r.querySelector('.rn-c-label').value.trim();
      const amount = Number(r.querySelector('.rn-c-amount').value) || 0;
      if (!label) return;
      charges.push({
        kind: amount < 0 ? 'discount' : 'fee',
        label,
        amount,
      });
    });
    return charges;
  }

  function bindRenewalActions(o) {
    const addBtn = $('rnAddRow');
    if (addBtn) {
      addBtn.onclick = () => {
        const tbody = $('rnTbody');
        const idx = tbody.querySelectorAll('tr.rn-row').length;
        // Neu ban dau bang rong (placeholder row), xoa di
        const placeholder = tbody.querySelector('tr td[colspan]');
        if (placeholder) tbody.innerHTML = '';
        tbody.insertAdjacentHTML('beforeend', renderRenewalRow(null, idx, true));
      };
    }
    document.querySelectorAll('[data-rn-act="del-row"]').forEach(b => {
      b.onclick = () => b.closest('tr.rn-row').remove();
    });

    // Charges: + them / xoa
    const addChargeBtn = $('rnAddCharge');
    if (addChargeBtn) {
      addChargeBtn.onclick = () => {
        const list = $('rnChargesList');
        const idx = list.querySelectorAll('.rn-charge-row').length;
        list.insertAdjacentHTML('beforeend', `
          <div class="rn-charge-row" data-rn-cidx="${idx}" style="display:flex;gap:6px;align-items:center;padding:6px 8px;background:#f8fafc;border-radius:6px;margin-bottom:4px">
            <input class="input rn-c-label" placeholder="Mô tả phí" value="" style="flex:1">
            <input class="input rn-c-amount" type="number" step="1000" placeholder="Số tiền (âm = giảm giá)" value="0" style="width:160px;text-align:right">
            <button type="button" class="btn ghost sm" data-rn-act="del-charge">×</button>
          </div>
        `);
        // Bind del nut moi
        const newRow = list.lastElementChild;
        newRow.querySelector('[data-rn-act="del-charge"]').onclick = () => newRow.remove();
      };
    }
    document.querySelectorAll('[data-rn-act="del-charge"]').forEach(b => {
      b.onclick = () => b.closest('.rn-charge-row').remove();
    });

    const submitBtn = $('rnSubmitQuote');
    if (submitBtn) submitBtn.onclick = async () => {
      const items = collectRenewalRows();
      if (!items.length) return ui.toast('Phải có ít nhất 1 dòng xe', 'warning');
      if (items.some(it => !it.vehicle_plate)) {
        const ok = await ui.confirm({
          title: 'Có dòng chưa nhập biển số',
          message: 'Vẫn báo giá? (Có thể bổ sung biển số sau khi khách xác nhận)',
        });
        if (!ok) return;
      }
      const charges = collectRenewalCharges();
      const r = await api.post(`/admin/orders/${o.id}/quote`, { items, charges }, {
        successMessage: 'Đã báo giá. Sao chép link gửi khách.',
        loading: true,
      }).catch(() => null);
      if (!r) return;
      await openDetail(o.id);
      load();
    };

    const copyBtn = $('rnCopyLink');
    if (copyBtn) copyBtn.onclick = () => {
      const link = $('rnPublicLink');
      if (!link) return;
      navigator.clipboard.writeText(link.value).then(() => {
        const old = copyBtn.textContent;
        copyBtn.textContent = '✓ Đã chép';
        setTimeout(() => { copyBtn.textContent = old; }, 1500);
      }).catch(() => ui.toast('Không sao chép được, bạn copy tay nhé', 'warning'));
    };

    const completeBtn = $('rnComplete');
    if (completeBtn) completeBtn.onclick = async () => {
      const ok = await ui.confirm({
        title: 'Hoàn tất gia hạn',
        message: o.status === 'payment_reported'
          ? 'Bạn đã kiểm tra TK và đã gia hạn cho khách trên GoTrack? Hệ thống sẽ ghi nhận đã thu đủ tiền.'
          : (o.payment_method === 'debt'
            ? 'Bạn đã gia hạn cho khách trên GoTrack? Đơn này sẽ vào công nợ khách.'
            : 'Bạn đã gia hạn cho khách trên GoTrack?'),
      });
      if (!ok) return;
      const r = await api.post(`/admin/orders/${o.id}/complete-renewal`, {}, {
        successMessage: 'Đã hoàn tất gia hạn.',
        loading: true,
      }).catch(() => null);
      if (!r) return;
      await openDetail(o.id);
      load();
    };
  }

  function openBadgeModal() {
    $('badgeModal').classList.add('open');
    $('bf_plate').value = '';
    $('bf_vtype').value = 'truck_under_3.5t';
    $('bf_fee').value = 0;
    $('bf_status').value = 'pending_review';
    $('bf_note').value = '';
    // Refill customer + dealer dropdown — dung danh sach state.customers da load
    const html = ['<option value="">— Chọn khách —</option>'];
    state.customers.forEach(c => {
      const label = `${c.code} — ${c.full_name}${c.phone ? ' (' + c.phone + ')' : ''}`;
      html.push(`<option value="${c.id}">${escape(label)}</option>`);
    });
    $('bf_customer').innerHTML = html.join('');
    const dHtml = ['<option value="">— Không —</option>'];
    state.customers.filter(c => c.type === 'dealer').forEach(c => {
      dHtml.push(`<option value="${c.id}">${escape(c.code + ' — ' + (c.company_name || c.full_name))}</option>`);
    });
    $('bf_dealer').innerHTML = dHtml.join('');
  }
  function closeBadgeModal() { $('badgeModal').classList.remove('open'); }
  async function handleBadgeSubmit(e) {
    e.preventDefault();
    const data = {
      customer_id: Number($('bf_customer').value),
      dealer_id: $('bf_dealer').value ? Number($('bf_dealer').value) : null,
      vehicle_plate: $('bf_plate').value.trim(),
      vehicle_type: $('bf_vtype').value,
      fee_amount: Number($('bf_fee').value) || 0,
      status: $('bf_status').value,
      note: $('bf_note').value.trim() || null,
    };
    if (!data.customer_id) return ui.toast('Chọn khách', 'warning');
    if (!data.vehicle_plate) return ui.toast('Nhập biển số', 'warning');
    const r = await api.post('/admin/badges', data, {
      successMessage: 'Đã tạo hồ sơ phù hiệu', loading: true,
    }).catch(() => null);
    if (r) { closeBadgeModal(); load(); }
  }

  async function handleBadgeAction(e) {
    const btn = e.target.closest('button[data-bact]');
    if (!btn || !currentDetail || !currentDetail.badge) return;
    const act = btn.dataset.bact;
    const bid = currentDetail.badge.id;
    const oid = currentDetail.id;
    if (act === 'submit' || act === 'resubmit') {
      const ok = await ui.confirm({ title: 'Nộp Sở GTVT?', message: `Đánh dấu ${currentDetail.badge.code} đã nộp Sở?`, okText: 'Nộp' });
      if (!ok) return;
      const r = await api.post(`/admin/badges/${bid}/submit`, {}, { successMessage: 'Đã đánh dấu nộp Sở', loading: true }).catch(() => null);
      if (r) { openDetail(oid); load(); }
    } else if (act === 'approve') {
      const r = await api.post(`/admin/badges/${bid}/result`, { result: 'approved' }, { successMessage: 'Đã ghi nhận có kết quả', loading: true }).catch(() => null);
      if (r) { openDetail(oid); load(); }
    } else if (act === 'reject') {
      const reason = prompt('Lý do bị từ chối:');
      if (reason == null) return;
      const r = await api.post(`/admin/badges/${bid}/result`, { result: 'rejected', reject_reason: reason }, { successMessage: 'Đã ghi nhận từ chối', loading: true }).catch(() => null);
      if (r) { openDetail(oid); load(); }
    } else if (act === 'deliver') {
      const r = await api.post(`/admin/badges/${bid}/deliver`, {}, { successMessage: 'Đã giao khách', loading: true }).catch(() => null);
      if (r) { openDetail(oid); load(); }
    } else if (act === 'markpaid') {
      const r = await api.post(`/admin/badges/${bid}/mark-paid`, {}, { successMessage: 'Đã ghi nhận thanh toán', loading: true }).catch(() => null);
      if (r) { openDetail(oid); load(); }
    } else if (act === 'cancel') {
      const reason = prompt('Lý do huỷ:');
      if (reason == null) return;
      const r = await api.post(`/admin/badges/${bid}/cancel`, { reason }, { successMessage: 'Đã huỷ', loading: true }).catch(() => null);
      if (r) { openDetail(oid); load(); }
    } else if (act === 'editfee') {
      const cur = Number(currentDetail.badge.fee_amount || 0);
      const v = prompt('Phí phù hiệu (VND):', String(cur));
      if (v == null) return;
      const fee = Number(v);
      if (Number.isNaN(fee) || fee < 0) return ui.toast('Phí không hợp lệ', 'warning');
      const r = await api.put(`/admin/badges/${bid}`, { fee_amount: fee }, { successMessage: 'Đã cập nhật phí', loading: true }).catch(() => null);
      if (r) { openDetail(oid); load(); }
    }
  }

  // ---- Section: Thong tin khach -----------------------------
  function renderCustomerSection(o) {
    return `
      <div class="order-detail-section">
        <div class="grid cols-2" style="font-size:14px">
          <div><b>Khách:</b> ${escape(o.customer_name)} (${escape(o.customer_phone || '')})</div>
          <div><b>Đại lý:</b> ${o.dealer_name ? escape(o.dealer_name) : '—'}</div>
          <div><b>Thanh toán:</b> ${PAYMENT_LABEL[o.payment_method] || '—'} (${fmt.format(o.paid_amount || 0)}đ / ${fmt.format(o.total_amount || 0)}đ)</div>
          <div><b>Khu vực:</b> ${escape(o.area || '—')}</div>
          <div><b>Biển số:</b> ${escape(o.vehicle_plate || '—')}</div>
        </div>
        <div style="margin-top:8px"><b>Địa chỉ:</b> ${escape(o.address || '—')}</div>
        ${o.note ? `<div style="margin-top:6px"><b>Ghi chú:</b> ${escape(o.note)}</div>` : ''}
      </div>`;
  }

  // ---- Section: Gan KTV + tien cong --------------------------
  // Cho phep edit ngay tu pending_review de QTV chon KTV truoc khi "Len don".
  // Sau refactor: cho doi KTV moi luc tru khi don da o final-status hoac cancelled.
  function renderAssignSection(o) {
    // O trang thai "Yeu cau" (pending_review) chua hien form gan KTV.
    // Bam "Len don" se duyet -> chuyen sang trang thai sau, luc do moi hien form.
    if (o.status === 'pending_review') return '';

    const FINAL_OR_CANCELLED = ['done','cancelled','customer_owes','pending_admin_confirm','staff_owes'];
    const hasStaff = !!o.assigned_staff_id;
    const canEdit = !FINAL_OR_CANCELLED.includes(o.status);

    if (canEdit) {
      const isReassign = hasStaff;
      const wage = o.wage_amount || 0;
      const kind = o.kind || 'install';
      const due  = o.due_at ? String(o.due_at).replace(' ', 'T').slice(0, 16) : '';
      const note = o.ktv_note || '';
      const heading = isReassign
        ? '👨‍🔧 Đổi kỹ thuật viên <small class="text-muted" style="font-weight:400">(có thể đổi mọi lúc trước khi đơn hoàn thành)</small>'
        : '👨‍🔧 Gán kỹ thuật viên';
      const help = isReassign
        ? 'Đổi người phụ trách hoặc cập nhật tiền công, rồi bấm <b>💾 Cập nhật KTV</b> để áp dụng và tính lại bill.'
        : (o.status === 'pending_review'
            ? 'Chọn KTV + tiền công, rồi bấm <b>📤 Lên đơn</b> ở dưới để duyệt và giao việc luôn.'
            : 'Chọn KTV + tiền công, rồi bấm <b>📤 Lên đơn</b> ở dưới.');
      const inlineBtn = isReassign
        ? `<div class="field"><label>&nbsp;</label><button type="button" class="btn primary w-100" data-act="reassign-staff">💾 Cập nhật KTV</button></div>`
        : '';
      return `
        <div class="order-detail-section assign-inline">
          <h4>${heading}</h4>
          <p class="help" style="margin:0 0 8px">${help}</p>
          <div class="grid ${isReassign ? 'cols-3' : 'cols-2'}">
            <div class="field">
              <label>Kỹ thuật viên *</label>
              <select id="ai_staff" class="select" data-current-staff="${o.assigned_staff_id || ''}"><option value="">Đang tải...</option></select>
            </div>
            <div class="field">
              <label>Tiền công KTV (VND)</label>
              <input type="number" id="ai_wage" class="input" min="0" step="1000" value="${wage}">
            </div>
            ${inlineBtn}
            <div class="field">
              <label>Loại công việc</label>
              <select id="ai_kind" class="select">
                <option value="install" ${kind==='install'?'selected':''}>Lắp đặt</option>
                <option value="maintenance" ${kind==='maintenance'?'selected':''}>Bảo trì</option>
                <option value="renew" ${kind==='renew'?'selected':''}>Gia hạn</option>
                <option value="uninstall" ${kind==='uninstall'?'selected':''}>Tháo gỡ</option>
              </select>
            </div>
            <div class="field">
              <label>Hạn hoàn thành</label>
              <input type="datetime-local" id="ai_due" class="input" value="${due}">
            </div>
          </div>
          <div class="field">
            <label>Ghi chú KTV</label>
            <textarea id="ai_note" class="textarea" placeholder="VD: gọi trước 30p...">${escape(note)}</textarea>
          </div>
        </div>`;
    }

    // Don da hoan thanh / huy: info-only
    if (!hasStaff) return '';
    return `
      <div class="order-detail-section">
        <h4>👨‍🔧 KTV phụ trách</h4>
        <div class="task-row">
          <div class="spread">
            <div><b>${escape(o.staff_name || '?')}</b> — ${KIND_LABEL[o.kind] || o.kind || ''}</div>
            <div class="text-muted" style="font-size:13px">Công: <b>${fmt.format(o.wage_amount || 0)}đ</b></div>
          </div>
          ${o.started_at ? `<div class="text-muted" style="font-size:12.5px;margin-top:4px">⏱ Bắt đầu: ${escape(String(o.started_at).replace('T',' ').slice(0,16))}</div>` : ''}
          ${o.completed_at ? `<div class="text-muted" style="font-size:12.5px">🏁 Hoàn thành: ${escape(String(o.completed_at).replace('T',' ').slice(0,16))}</div>` : ''}
        </div>
      </div>`;
  }

  // ---- Section: San pham trong don (co + Them SP) -----------
  function renderItemsSection(o) {
    const editable = !['warehouse_released','in_progress','done','cancelled',
                       'customer_owes','pending_admin_confirm','staff_owes'].includes(o.status);
    const rows = (o.items || []).map(it => `
      <tr data-item-id="${it.id}">
        <td><b>${escape(it.product_code)}</b></td>
        <td>${escape(it.product_name)}</td>
        <td>${it.qty}</td>
        <td>${fmt.format(it.unit_price)}đ</td>
        <td>${fmt.format(it.qty * it.unit_price)}đ</td>
        ${editable ? `<td><button type="button" class="btn ghost sm item-del" data-product-id="${it.product_id}" title="Xoá">×</button></td>` : ''}
      </tr>
    `).join('');
    return `
      <div class="order-detail-section">
        <div class="spread" style="align-items:center;margin-bottom:8px">
          <h4 style="margin:0">📦 Sản phẩm trong đơn (${(o.items || []).length})</h4>
          ${editable ? '<button type="button" class="btn sm" data-act="add-product">+ Thêm sản phẩm</button>' : ''}
        </div>
        ${(o.items || []).length ? `
          <table class="data" style="width:100%">
            <thead><tr><th>Mã</th><th>Sản phẩm</th><th style="width:60px">SL</th><th style="width:120px">Đơn giá</th><th style="width:120px">Thành tiền</th>${editable ? '<th style="width:40px"></th>' : ''}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        ` : '<p class="text-muted">Chưa có sản phẩm — bấm "+ Thêm sản phẩm" để chọn.</p>'}
      </div>`;
  }

  // ---- Section: Bill tong ket (cuoi cung) -------------------
  function renderBillSection(o) {
    const subtotal = Number(o.subtotal || 0);
    const total = Number(o.total_amount || 0);
    const chargeRows = (o.charges || []).map(c => {
      const amt = Number(c.amount || 0);
      const isMinus = amt < 0;
      return `<div class="bill-row"><span>${isMinus ? '−' : '+'} ${escape(c.label || '—')}:</span><span style="color:${isMinus ? '#16a34a' : '#dc2626'}">${isMinus ? '−' : '+'}${fmt.format(Math.abs(amt))}đ</span></div>`;
    }).join('');
    return `
      <div class="order-detail-section bill">
        <div class="bill-row"><span>Tạm tính (sản phẩm):</span><span>${fmt.format(subtotal)}đ</span></div>
        ${chargeRows}
        <div class="bill-row total"><span>TỔNG ĐƠN:</span><span>${fmt.format(total)}đ</span></div>
      </div>`;
  }

  // ---- Footer action buttons (cung hang voi nut "Dong") -----
  // Render vao #detailFootActions sau khi openDetail xong.
  function renderFootActions(o) {
    const buttons = [];

    const hasStaff = !!o.assigned_staff_id;
    // KTV da chup it nhat 1 anh nhan hang chua? (stage='receive')
    const hasReceivePhotos = (o.attachments || []).some(a => a.stage === 'receive');

    if (['pending_review','new'].includes(o.status)) {
      // Gop "duyet" + "gan KTV" thanh 1 nut. Bam roi BE goi tuan tu.
      buttons.push(`<button class="btn primary" data-act="advance-and-assign">📤 Lên đơn</button>`);
    } else if (o.status === 'assigned' && hasStaff) {
      // Quy trinh chuan: KTV chup anh nhan hang TRUOC, admin xem xong moi xuat kho.
      // Tuy nhien admin van duoc override (xuat kho khi chua co anh) — chi doi text de canh bao.
      if (hasReceivePhotos) {
        buttons.push(`<button class="btn primary" data-act="release">📦 Xuất kho</button>`);
      } else {
        buttons.push(`<button class="btn" data-act="release" title="KTV chưa chụp ảnh nhận hàng — admin vẫn có thể xuất kho">📦 Xuất kho (chờ ảnh KTV)</button>`);
      }
    } else if (['done','customer_owes','pending_admin_confirm','staff_owes'].includes(o.status)
        && Number(o.paid_amount) < Number(o.total_amount)) {
      // Chi hien sau khi KTV da hoan thanh task. Truoc do (warehouse_released /
      // in_progress) chua co tien gi de "nhan" — neu khach prepay thi bao
      // KTV ghi nhan luc complete task.
      buttons.push(`<button class="btn" data-act="markpaid">💰 Admin nhận tiền</button>`);
    }

    // Copy link luon co
    buttons.push(`<button class="btn ghost" data-act="copy-link">🔗 Copy link</button>`);
    if (!['done','cancelled'].includes(o.status)) {
      buttons.push(`<button class="btn ghost" data-act="cancel" style="color:var(--danger)">✗ Huỷ đơn</button>`);
    }
    // Don da hoan tat (final statuses): cho phep ghi nhan khach tra hang sau khi giao
    if (FINAL_STATUSES_FE.includes(o.status)) {
      buttons.push(`<button class="btn ghost" data-act="return-done" style="color:#0891b2">↩ Trả hàng (sau done)</button>`);
    }
    // Hoan tien: chi cho khi don da co van de (cancelled hoac da return-done)
    // va con paid chua hoan het. Don done binh thuong khong show — tranh admin
    // bam nham lam giam doanh thu.
    const paidNum = Number(o.paid_amount) || 0;
    const refundedNum = Number(o.refunded_amount) || 0;
    const canRefund = paidNum > refundedNum
      && (o.status === 'cancelled' || o.has_return || refundedNum > 0);
    if (canRefund) {
      const remain = paidNum - refundedNum;
      buttons.push(`<button class="btn ghost" data-act="record-refund" data-remain="${remain}" style="color:#0891b2">💸 Hoàn tiền</button>`);
    }
    return buttons.join('');
  }

  // Load options vao select KTV (sau khi inject HTML)
  async function loadStaffOptions(orderId) {
    const sel = $('ai_staff');
    if (!sel) return;
    const currentStaffId = Number(sel.dataset.currentStaff) || 0;
    const res = await api.get(`/admin/orders/${orderId}/suggested-staff`, { silent: true }).catch(() => null);
    if (!res || !res.items.length) {
      sel.innerHTML = '<option value="">Chưa có KTV phù hợp</option>';
      return;
    }
    sel.innerHTML = res.items.map((s, i) => {
      const tag = s.area_match ? ' [Cùng khu vực]' : '';
      const status = s.online_status === 'online' ? '🟢' : '⚪';
      // Neu co currentStaffId, chon staff do; neu khong chon item dau
      const selected = currentStaffId ? (s.id === currentStaffId) : (i === 0);
      return `<option value="${s.id}" ${selected ? 'selected' : ''}>${status} ${escape(s.full_name)}${tag} · ⭐${Number(s.rating).toFixed(1)} · ${s.active_tasks} đơn</option>`;
    }).join('');
  }

  function renderAttachments(attachments) {
    const all = attachments || [];
    if (!all.length) return '<p class="text-muted">Chưa có ảnh KTV chụp</p>';
    const groups = { receive: [], deliver: [], other: [] };
    all.forEach(a => (groups[a.stage] || groups.other).push(a));
    let html = '';
    ['receive', 'deliver', 'other'].forEach(stage => {
      if (!groups[stage].length) return;
      html += `<div style="margin-top:8px"><b style="font-size:13px">${STAGE_LABEL[stage]}</b><div class="att-grid">`;
      groups[stage].forEach(a => {
        html += `<div><img src="${escape(a.url)}" data-img="${escape(a.url)}" alt="${escape(a.caption || '')}">${a.caption ? `<div class="att-label">${escape(a.caption)}</div>` : ''}</div>`;
      });
      html += `</div></div>`;
    });
    return html;
  }

  async function openDetail(id) {
    const res = await api.get('/admin/orders/' + id, { loading: true }).catch(() => null);
    if (!res) return;
    currentDetail = res;
    const _titleStatus = res.service_kind === 'badge'
      ? (BADGE_STATUS_LABEL[(res.badge && res.badge.status) || 'pending_review'] || { text: '?', cls: 'gray' })
      : (STATUS_LABEL[res.status] || { text: res.status, cls: 'gray' });
    $('detailTitleText').innerHTML =
      `Đơn ${escape(res.code)} `
      + `<span class="pill ${_titleStatus.cls}" style="font-size:14px;padding:4px 12px;vertical-align:middle;margin-left:6px">${escape(_titleStatus.text)}</span>`;

    // ---- Don phu hieu xe: render UI rieng (giu y nguyen flow badge) ----
    if (res.service_kind === 'badge') {
      $('detailBody').innerHTML = renderBadgeDetail(res);
      $('detailFootActions').innerHTML = '';
      $('detailModal').classList.add('open');
      return;
    }

    // ---- Don gia han: render UI rieng (bao gia + link public + hoan tat) ----
    if (res.service_kind === 'renewal') {
      $('detailBody').innerHTML = renderRenewalDetail(res);
      $('detailFootActions').innerHTML = '';
      $('detailModal').classList.add('open');
      bindRenewalActions(res);
      return;
    }

    $('detailBody').innerHTML = `
      ${renderCustomerSection(res)}
      ${renderAssignSection(res)}
      ${renderItemsSection(res)}
      <div class="order-detail-section">
        <h4>💵 Phí khác / Giảm giá <small class="text-muted" style="font-weight:400">(âm = giảm giá)</small></h4>
        ${renderChargesSection(res.charges)}
      </div>
      ${renderBillSection(res)}
      <div id="adminPendingSlot"></div>
      <div id="staffCollectionsSlot"></div>
      <div id="refundsSlot"></div>
      ${(res.attachments || []).length ? `<div class="order-detail-section"><h4>📷 Ảnh KTV</h4>${renderAttachments(res.attachments)}</div>` : ''}
    `;
    // Render action buttons xuong footer (cung hang nut Dong)
    $('detailFootActions').innerHTML = renderFootActions(res);
    $('detailModal').classList.add('open');
    // Goi load staff options khi co select #ai_staff (pending_review/new/assigned chua started)
    if ($('ai_staff')) loadStaffOptions(res.id);
    // Load cac khoan thanh toan can xac nhan neu don da qua giai doan KTV
    if (['warehouse_released','in_progress','done',
         'customer_owes','pending_admin_confirm','staff_owes'].includes(res.status)) {
      loadAdminPending(res.id);
      loadStaffCollections(res.id);
    }
    // Load list refund neu don da co tien thu (paid_amount > 0) va co the can hoan:
    // - cancelled con paid_amount > 0
    // - don done/owes co has_return = 1 (khach tra hang sau)
    // - hoac da co refund truoc do
    const showRefund = Number(res.paid_amount) > 0 && (
      res.status === 'cancelled' || res.has_return || Number(res.refunded_amount) > 0
    );
    if (showRefund) loadRefunds(res.id);
  }

  // ---- Admin-pending: KTV bao khach da tra admin, doi admin xac nhan ----
  async function loadAdminPending(orderId) {
    const slot = $('adminPendingSlot');
    if (!slot) return;
    const res = await api.get(`/admin/orders/${orderId}/admin-pending`, { silent: true }).catch(() => null);
    if (!res || !res.items.length) { slot.innerHTML = ''; return; }
    const rows = res.items.map(p => `
      <div class="task-row" style="border-left:3px solid #f59e0b;padding-left:8px">
        <div class="spread">
          <div>
            <b>${fmt.format(p.amount)}đ</b> — ${escape(p.staff_name || 'KTV')}
            <br><small class="text-muted">${escape(p.note || '')}</small>
            <br><small class="text-muted">${fmtDate(p.paid_at)}</small>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn success sm" data-act="confirm-pending"
                    data-payment-id="${p.id}" data-amount="${p.amount}">
              ✓ Xác nhận đã thu
            </button>
            <button class="btn ghost sm" data-act="reject-pending"
                    data-payment-id="${p.id}" style="color:var(--danger)">
              ✗ Không thu được
            </button>
          </div>
        </div>
      </div>
    `).join('');
    slot.innerHTML = `
      <div class="order-detail-section" style="background:#fef3c7;border-radius:6px;padding:10px">
        <h4 style="margin-top:0">⏳ Khoản KTV báo khách đã trả admin (chờ xác nhận)</h4>
        <p class="help" style="margin:0 0 8px">Bấm "Xác nhận đã thu" sau khi anh đã nhận tiền — số tiền sẽ cộng vào doanh thu.</p>
        ${rows}
      </div>
    `;
  }

  async function handleConfirmPending(paymentId, declaredAmount) {
    if (!currentDetail) return;
    const ok = await ui.confirm({
      title: 'Xác nhận đã nhận tiền?',
      message: `Đã nhận đủ ${fmt.format(declaredAmount)}đ từ khách qua admin?`,
      okText: 'Đã nhận đủ',
    });
    if (!ok) return;
    const r = await api.post(
      `/admin/orders/${currentDetail.id}/confirm-admin-pending/${paymentId}`,
      {},
      { successMessage: 'Đã ghi nhận thanh toán', loading: true },
    ).catch(() => null);
    if (r) { openDetail(currentDetail.id); load(); }
  }

  async function handleRejectPending(paymentId) {
    if (!currentDetail) return;
    const ok = await ui.confirm({
      title: 'Không thu được khoản này?',
      message: 'Khoản này sẽ chuyển thành khách nợ. Tiếp tục?',
      okText: 'Không thu được',
    });
    if (!ok) return;
    const r = await api.post(
      `/admin/orders/${currentDetail.id}/confirm-admin-pending/${paymentId}`,
      { amount: 0 },
      { successMessage: 'Đã chuyển thành khách nợ', loading: true },
    ).catch(() => null);
    if (r) { openDetail(currentDetail.id); load(); }
  }

  // ---- Staff-collections: KTV da thu nhung chua nop, admin xac nhan truc tiep ----
  async function loadStaffCollections(orderId) {
    const slot = $('staffCollectionsSlot');
    if (!slot) return;
    const res = await api.get(`/admin/orders/${orderId}/staff-collections`, { silent: true }).catch(() => null);
    if (!res || !res.items.length) { slot.innerHTML = ''; return; }
    const METHOD_LABEL = { cash: 'Tiền mặt', transfer: 'Chuyển khoản' };
    const rows = res.items.map(c => `
      <div class="task-row" style="border-left:3px solid #3b82f6;padding-left:8px">
        <div class="spread">
          <div>
            <b>${fmt.format(c.amount)}đ</b> — ${escape(c.staff_name || 'KTV')} thu
            <br><small class="text-muted">${escape(METHOD_LABEL[c.method] || c.method)} · ${fmtDate(c.collected_at)}</small>
          </div>
          <div>
            <button class="btn success sm" data-act="confirm-staff-collection"
                    data-collection-id="${c.id}" data-amount="${c.amount}"
                    data-staff="${escape(c.staff_name || 'KTV')}">
              ✓ Đã nhận tiền KTV
            </button>
          </div>
        </div>
      </div>
    `).join('');
    slot.innerHTML = `
      <div class="order-detail-section" style="background:#eff6ff;border-radius:6px;padding:10px">
        <h4 style="margin-top:0">💼 KTV đang giữ tiền (chờ admin nhận)</h4>
        <p class="help" style="margin:0 0 8px">Bấm "Đã nhận tiền KTV" sau khi anh đã nhận tiền từ KTV — đơn sẽ chuyển sang Hoàn thành.</p>
        ${rows}
      </div>
    `;
  }

  async function handleConfirmStaffCollection(collectionId, amount, staffName) {
    if (!currentDetail) return;
    const ok = await ui.confirm({
      title: 'Đã nhận tiền KTV?',
      message: `Xác nhận đã nhận đủ ${fmt.format(amount)}đ từ ${staffName}?`,
      okText: 'Đã nhận',
    });
    if (!ok) return;
    const r = await api.post(
      `/admin/orders/${currentDetail.id}/confirm-staff-collection/${collectionId}`,
      {},
      { successMessage: 'Đã ghi nhận tiền KTV nộp', loading: true },
    ).catch(() => null);
    if (r) { openDetail(currentDetail.id); load(); }
  }

  function closeDetail() {
    $('detailModal').classList.remove('open');
    currentDetail = null;
  }

  // ---- Refunds: list khoan da hoan + nut tao moi ----
  async function loadRefunds(orderId) {
    const slot = $('refundsSlot');
    if (!slot) return;
    const res = await api.get(`/admin/orders/${orderId}/refunds`, { silent: true }).catch(() => null);
    if (!res) { slot.innerHTML = ''; return; }

    const paid = Number(currentDetail.paid_amount) || 0;
    const refunded = Number(res.total) || 0;
    const remain = Math.max(0, paid - refunded);

    const rows = res.items.length ? res.items.map(p => `
      <div class="task-row" style="border-left:3px solid #0891b2;padding-left:8px">
        <div class="spread">
          <div>
            <b>−${fmt.format(p.amount)}đ</b>
            ${p.confirmed_by_name ? ` · ${escape(p.confirmed_by_name)}` : ''}
            <br><small class="text-muted">${escape(p.note || '')}</small>
            <br><small class="text-muted">${fmtDate(p.paid_at)}</small>
          </div>
        </div>
      </div>
    `).join('') : '<p class="text-muted" style="margin:4px 0">Chưa hoàn khoản nào</p>';

    const canRefund = remain > 0;
    slot.innerHTML = `
      <div class="order-detail-section" style="background:#ecfeff;border-radius:6px;padding:10px">
        <h4 style="margin-top:0">💸 Hoàn tiền cho khách</h4>
        <div class="bill" style="margin-bottom:8px">
          <div class="bill-row"><span>Đã thu (paid):</span><span>${fmt.format(paid)}đ</span></div>
          <div class="bill-row"><span>Đã hoàn:</span><span>−${fmt.format(refunded)}đ</span></div>
          <div class="bill-row total"><span>CÒN PHẢI HOÀN:</span><span style="color:${remain > 0 ? '#dc2626' : '#16a34a'}">${fmt.format(remain)}đ</span></div>
        </div>
        ${rows}
        ${canRefund ? `
          <div style="margin-top:8px">
            <button class="btn primary sm" data-act="record-refund" data-remain="${remain}">
              + Ghi nhận hoàn ${fmt.format(remain)}đ
            </button>
          </div>` : ''}
      </div>
    `;
  }

  function openRefundModal(remain) {
    if (!currentDetail) return;
    $('rfTitle').textContent = `Hoàn tiền · ${currentDetail.code}`;
    $('rfAmount').value = remain || '';
    $('rfAmount').max = remain || '';
    $('rfRemain').textContent = `Tối đa: ${fmt.format(remain)}đ`;
    $('rfMethod').value = 'cash';
    $('rfNote').value = '';
    $('refundModal').classList.add('open');
    setTimeout(() => $('rfAmount').focus(), 100);
  }

  function closeRefundModal() {
    $('refundModal').classList.remove('open');
  }

  async function submitRefund() {
    if (!currentDetail) return;
    const amount = Number($('rfAmount').value) || 0;
    if (amount <= 0) return ui.toast('Số tiền phải > 0', 'warning');
    const max = Number($('rfAmount').max) || 0;
    if (max && amount > max) return ui.toast(`Không vượt quá ${fmt.format(max)}đ`, 'warning');
    const method = $('rfMethod').value;
    const note = $('rfNote').value.trim();

    const r = await api.post(
      `/admin/orders/${currentDetail.id}/record-refund`,
      { amount, method, note: note || null },
      { successMessage: 'Đã ghi nhận hoàn tiền', loading: true },
    ).catch(() => null);
    if (!r) return;
    closeRefundModal();
    openDetail(currentDetail.id);
    load();
  }

  // ---- Action handlers --------------------------------------
  // Gop "Len don (duyet)" + "Len don (gan KTV)" thanh 1 thao tac.
  // - pending_review + co KTV: confirm -> assign-staff -> copy link
  // - pending_review + khong KTV: confirm
  // - new + co KTV: assign-staff -> copy link
  // - new + khong KTV: bao loi (phai chon KTV moi xong dc don)
  async function handleAdvanceAndAssign() {
    if (!currentDetail) return;
    if (!currentDetail.items.length || (currentDetail.subtotal || 0) <= 0) {
      return ui.toast('Cần ít nhất 1 sản phẩm với đơn giá > 0', 'warning');
    }
    const staffSel = $('ai_staff');
    const staffId = staffSel ? Number(staffSel.value) : 0;

    if (currentDetail.status === 'new' && !staffId) {
      return ui.toast('Chọn KTV để giao việc', 'warning');
    }

    // User co the nhap "Van chuyen 200000" vao form ma quen bam "+ Them"
    if (!(await flushPendingChargeDraft())) return;

    const ok = await ui.confirm({
      title: 'Lên đơn?',
      message: staffId
        ? `Duyệt đơn ${currentDetail.code} và giao việc cho KTV đã chọn?`
        : `Duyệt đơn ${currentDetail.code} (chưa gán KTV)?`,
      okText: 'Lên đơn',
    });
    if (!ok) return;

    // Buoc 1: duyet (chi khi pending_review)
    if (currentDetail.status === 'pending_review') {
      const r1 = await api.post(`/admin/orders/${currentDetail.id}/confirm`, {}, {
        loading: true, silent: true,
      }).catch(() => null);
      if (!r1) return;
    }

    // Buoc 2: gan KTV (neu co)
    if (staffId) {
      const data = {
        staff_id: staffId,
        kind: ($('ai_kind') && $('ai_kind').value) || 'install',
        due_at: ($('ai_due') && $('ai_due').value) || null,
        wage_amount: Number(($('ai_wage') && $('ai_wage').value) || 0),
        note: ($('ai_note') && $('ai_note').value.trim()) || null,
      };
      const r2 = await api.post(`/admin/orders/${currentDetail.id}/assign-staff`, data, {
        loading: true, silent: true,
      }).catch(() => null);
      if (!r2) {
        ui.toast('Đã duyệt đơn nhưng gán KTV thất bại', 'warning');
        openDetail(currentDetail.id); load();
        return;
      }
      ui.toast('Đã lên đơn — đã giao việc cho KTV', 'success');
      await copyShareLink(currentDetail.code);
    } else {
      ui.toast('Đã lên đơn — chưa gán KTV', 'success');
    }

    openDetail(currentDetail.id);
    load();
  }

  // Copy link xem don ra clipboard. URL public = /track-order.html?code=ORD-...
  async function copyShareLink(code) {
    const url = `${location.origin}/track-order.html?code=${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(url);
      ui.toast('Đã copy link xem đơn — gửi cho khách', 'success');
    } catch (_) {
      // Fallback: hien dialog cho copy thu cong
      ui.alert({ title: 'Link xem đơn', message: url });
    }
  }
  async function handleCopyLink() {
    if (!currentDetail) return;
    await copyShareLink(currentDetail.code);
  }

  // ---- Huong dan xu ly don ----------------------------------
  function injectGuideStyles() {
    if (document.getElementById('orderGuideStyles')) return;
    const s = document.createElement('style');
    s.id = 'orderGuideStyles';
    s.textContent = `
      .guide-btn{width:24px;height:24px;border-radius:999px;border:1.5px solid #cbd5e1;
        background:#fff;color:#475569;cursor:pointer;font-weight:700;font-size:13px;line-height:1;
        display:inline-flex;align-items:center;justify-content:center;padding:0;
        transition:all .15s}
      .guide-btn:hover{background:#1d4ed8;border-color:#1d4ed8;color:#fff;transform:scale(1.08)}
      .guide-step{display:flex;gap:14px;padding:14px;border:1px solid #e5e7eb;border-radius:10px;
        background:#fff;margin-bottom:10px;align-items:flex-start}
      .guide-step__num{flex-shrink:0;width:32px;height:32px;border-radius:999px;background:#1d4ed8;
        color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:14px}
      .guide-step__body{flex:1;min-width:0}
      .guide-step__title{font-weight:600;font-size:14px;color:#0f172a;margin-bottom:4px}
      .guide-step__title .pill{margin-left:6px;font-weight:500}
      .guide-step__desc{font-size:13px;color:#475569;line-height:1.55}
      .guide-step__desc b{color:#0f172a}
      .guide-step__desc code{background:#f1f5f9;color:#334155;padding:1px 6px;border-radius:4px;
        font-size:12px;font-family:ui-monospace,monospace}
      .guide-tip{margin-top:14px;padding:12px 14px;background:#eff6ff;border:1px solid #bfdbfe;
        border-radius:10px;font-size:13px;color:#1e3a8a;line-height:1.55}
      .guide-tip b{color:#1e40af}`;
    document.head.appendChild(s);
  }

  function openOrderGuide() {
    $('orderGuideBody').innerHTML = `
      <p style="margin:0 0 14px;color:#475569;font-size:13.5px;line-height:1.6">
        Đơn lắp đặt đi qua các giai đoạn dưới đây. Mỗi bước có 1 nút chính ở góc dưới phải để chuyển tiếp.
      </p>

      <div class="guide-step">
        <div class="guide-step__num">1</div>
        <div class="guide-step__body">
          <div class="guide-step__title">Khách đặt đơn <span class="pill amber">Chờ duyệt</span></div>
          <div class="guide-step__desc">
            Đơn vừa khách gửi từ web. QTV mở đơn → kiểm tra sản phẩm + giá +
            <b>thêm phí lắp đặt / giảm giá</b> nếu cần (mục "💵 Phí khác / Giảm giá") →
            <b>chọn KTV</b> + <b>tiền công</b> ngay tại form 👨‍🔧 Gán kỹ thuật viên → bấm <b>📤 Lên đơn</b>.
          </div>
        </div>
      </div>

      <div class="guide-step">
        <div class="guide-step__num">2</div>
        <div class="guide-step__body">
          <div class="guide-step__title">Đã gán KTV <span class="pill blue">Đã giao</span></div>
          <div class="guide-step__desc">
            Hệ thống tự copy link xem đơn cho bạn — gửi cho khách. KTV sẽ thấy đơn trên app
            và <b>chụp ảnh nhận hàng</b> trước. Trong khi KTV chưa nhận, vẫn có thể đổi KTV /
            sửa tiền công bằng nút <b>💾 Cập nhật KTV</b>. Khi KTV đã có ảnh nhận hàng →
            admin bấm <b>📦 Xuất kho</b> để giao IMEI/vật tư.
          </div>
        </div>
      </div>

      <div class="guide-step">
        <div class="guide-step__num">3</div>
        <div class="guide-step__body">
          <div class="guide-step__title">Đã xuất kho — KTV đi làm <span class="pill blue">Đang xử lý</span></div>
          <div class="guide-step__desc">
            Sau khi xuất kho, KTV bấm <b>▶ Thực hiện</b> trên app → đi tới khách → chụp ảnh giao.
            Bạn theo dõi ảnh ở mục <b>📷 Ảnh KTV</b>. Đơn không có vật tư (gia hạn dịch vụ) vẫn
            cần xuất kho phiếu rỗng để có lịch sử.
          </div>
        </div>
      </div>

      <div class="guide-step">
        <div class="guide-step__num">4</div>
        <div class="guide-step__body">
          <div class="guide-step__title">KTV thu tiền <span class="pill green">Hoàn thành</span></div>
          <div class="guide-step__desc">
            KTV xong việc, thu tiền khách bằng 1 trong 3 cách:
            <b>tiền mặt</b> (KTV cầm về nộp), <b>chuyển khoản admin</b> (đợi xác nhận), hoặc <b>khách trả admin trực tiếp</b>.
            Nếu khách báo đã chuyển admin → đơn sang "Chờ admin xác nhận" — bạn vào mục cảnh báo vàng để bấm
            <b>✓ Xác nhận đã thu</b>.
          </div>
        </div>
      </div>

      <div class="guide-step">
        <div class="guide-step__num">5</div>
        <div class="guide-step__body">
          <div class="guide-step__title">Chưa thu đủ? <span class="pill red">Còn nợ</span></div>
          <div class="guide-step__desc">
            Khách chưa trả hết → đơn ở <b>Khách nợ</b>. Bạn có thể bấm <b>💰 Admin nhận tiền</b>
            khi khách trả ngoài hệ thống (chuyển khoản trực tiếp/đến công ty).
          </div>
        </div>
      </div>

      <div class="guide-tip">
        <b>💡 Mẹo:</b> Nút <b>🔗 Copy link</b> luôn có ở góc dưới phải — gửi cho khách để khách tự xem trạng thái đơn của mình mà không cần đăng nhập.
        Cần huỷ đơn ở bất kỳ giai đoạn nào (trừ Hoàn thành) → bấm <b>✗ Huỷ đơn</b>.
      </div>
    `;
    $('orderGuideModal').classList.add('open');
    if (window.ui && ui.pushDialog) ui.pushDialog();
  }

  function closeOrderGuide() {
    if (!$('orderGuideModal').classList.contains('open')) return;
    $('orderGuideModal').classList.remove('open');
    if (window.ui && ui.popDialog) ui.popDialog();
  }

  // ---- Product picker dialog --------------------------------
  let ppCatsLoaded = false;
  let ppSearchTimer = null;

  async function openProductPicker() {
    if (!currentDetail) return;
    $('productPickerModal').classList.add('open');
    if (!ppCatsLoaded) {
      const cats = await api.get('/admin/categories', { silent: true }).catch(() => null);
      if (cats && cats.items) {
        $('pp_category').innerHTML = '<option value="">Tất cả</option>'
          + cats.items.map(c => `<option value="${c.id}">${escape(c.name)}</option>`).join('');
      }
      ppCatsLoaded = true;
    }
    $('pp_search').value = '';
    loadPickerResults();
    $('pp_search').focus();
  }
  function closeProductPicker() { $('productPickerModal').classList.remove('open'); }

  async function loadPickerResults() {
    const q = $('pp_search').value.trim();
    const catId = $('pp_category').value;
    const params = new URLSearchParams({ limit: '30' });
    if (q) params.set('q', q);
    if (catId) params.set('category_id', catId);
    $('pp_results').innerHTML = '<div class="text-center text-muted" style="padding:20px">Đang tải...</div>';
    const res = await api.get('/public/products?' + params.toString(), { silent: true }).catch(() => null);
    if (!res || !res.items) {
      $('pp_results').innerHTML = '<div class="text-center text-muted" style="padding:20px">Không tải được</div>';
      return;
    }
    if (!res.items.length) {
      $('pp_results').innerHTML = '<div class="text-center text-muted" style="padding:20px">Không có kết quả</div>';
      return;
    }
    $('pp_results').innerHTML = res.items.map(p => {
      const inOrder = (currentDetail.items || []).some(it => it.product_id === p.id);
      return `
      <div class="pp-row" data-product-id="${p.id}" data-price="${p.retail_price || 0}">
        ${p.thumbnail_url ? `<img src="${escape(p.thumbnail_url)}" alt="">` : '<div class="pp-noimg">📦</div>'}
        <div style="flex:1;min-width:0">
          <div><b>${escape(p.name)}</b> <small class="text-muted">${escape(p.code)}</small></div>
          <div class="text-muted" style="font-size:12.5px">${escape(p.category_name || '—')} · ${p.retail_price ? fmt.format(p.retail_price) + 'đ' : 'Chưa có giá'}</div>
        </div>
        ${inOrder
          ? '<span class="pill green" style="font-size:11px">Đã có</span>'
          : '<button type="button" class="btn sm pp-add" data-product-id="' + p.id + '" data-price="' + (p.retail_price || 0) + '" data-name="' + escape(p.name) + '">+ Thêm</button>'}
      </div>`;
    }).join('');
  }

  async function pickProduct(productId, unitPrice, name) {
    if (!currentDetail) return;
    if ((currentDetail.items || []).some(it => it.product_id === productId)) {
      return ui.toast('Sản phẩm đã có trong đơn', 'info');
    }
    const items = (currentDetail.items || []).map(it => ({
      product_id: it.product_id, qty: it.qty, unit_price: it.unit_price,
    }));
    items.push({ product_id: productId, qty: 1, unit_price: unitPrice });
    const r = await api.put(`/admin/orders/${currentDetail.id}/items`, { items }, {
      successMessage: `Đã thêm "${name}"`, loading: true,
    }).catch(() => null);
    if (r) {
      // Re-render order detail body + picker (giu picker mo de them tiep)
      await openDetail(currentDetail.id);
      loadPickerResults();
      load();
    }
  }

  // Xoa 1 san pham khoi don (PUT /items voi list moi)
  async function handleRemoveItem(productId) {
    if (!currentDetail) return;
    const items = (currentDetail.items || []).filter(it => it.product_id !== productId);
    if (!items.length) return ui.toast('Đơn phải có ít nhất 1 sản phẩm', 'warning');
    const ok = await ui.confirm({ title: 'Xoá sản phẩm?', message: 'Xoá sản phẩm này khỏi đơn?', okText: 'Xoá' });
    if (!ok) return;
    const payload = { items: items.map(it => ({ product_id: it.product_id, qty: it.qty, unit_price: it.unit_price })) };
    const r = await api.put(`/admin/orders/${currentDetail.id}/items`, payload, {
      successMessage: 'Đã cập nhật sản phẩm', loading: true,
    }).catch(() => null);
    if (r) { openDetail(currentDetail.id); load(); }
  }

  async function handleMarkPaid() {
    if (!currentDetail) return;
    const remaining = Number(currentDetail.total_amount) - Number(currentDetail.paid_amount);
    const ok = await ui.confirm({
      title: 'Xác nhận thanh toán', message: `Đánh dấu đã nhận đủ ${fmt.format(remaining)}đ?`, okText: 'Đã nhận đủ',
    });
    if (!ok) return;
    const r = await api.post(`/admin/orders/${currentDetail.id}/mark-paid`, {}, {
      successMessage: 'Đã ghi nhận thanh toán', loading: true,
    }).catch(() => null);
    if (r) { openDetail(currentDetail.id); load(); }
  }

  async function handleCancel() {
    if (!currentDetail) return;
    await openReturnReceiptModal('cancel');
  }

  async function handleReturnDone() {
    if (!currentDetail) return;
    await openReturnReceiptModal('return-done');
  }

  // Modal phieu tra hang dung chung cho 2 case:
  //   - 'cancel'      : huy don (any status truoc done)
  //   - 'return-done' : khach tra hang sau khi don da hoan tat
  async function openReturnReceiptModal(mode) {
    rrMode = mode;
    const data = await api.get(`/admin/orders/${currentDetail.id}/returnable`,
      { silent: true }).catch(() => null);
    if (!data) return;
    rrMode = data.mode || mode; // BE tu suy mode theo status

    $('rrTitle').textContent = (rrMode === 'cancel'
      ? 'Hủy đơn — phiếu nhập hoàn kho'
      : 'Khách trả hàng (sau khi giao) — phiếu nhập kho')
      + ` · ${data.order_code}`;
    $('rrHelp').textContent = rrMode === 'cancel'
      ? 'Chọn SP cần hoàn về kho khi hủy đơn. Có thể trả 1 phần — phần KTV còn giữ admin xử lý sau bằng "KTV trả".'
      : 'Đơn đã hoàn tất, khách quay đầu trả hàng. Hàng tốt và hỏng đều được cộng vào kho, tách 2 phiếu để truy vết.';

    const tbody = document.querySelector('#rrLines tbody');
    if (!data.lines.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:20px">Không có sản phẩm nào có thể hoàn cho đơn này</td></tr>';
    } else {
      tbody.innerHTML = data.lines.map(l => {
        const max = Number(l.max_returnable) || 0;
        const returnedCol = rrMode === 'return-done' ? l.returned_done_qty : l.returned_cancel_qty;
        const disabled = max <= 0 ? 'disabled' : '';
        return `<tr data-product-id="${l.product_id}" data-max="${max}" ${max <= 0 ? 'style="opacity:.5"' : ''}>
          <td><b>${escape(l.product_code)}</b><br><span style="font-size:12px;color:#64748b">${escape(l.product_name)}</span></td>
          <td style="text-align:center">${l.released_qty}</td>
          <td style="text-align:center">${returnedCol}</td>
          <td><div class="row" style="gap:4px;align-items:center"><input type="number" class="input rr-qty" min="0" max="${max}" value="0" ${disabled} style="width:70px;padding:4px 6px"><span style="color:#94a3b8;font-size:12px">/${max}</span></div></td>
          <td><select class="select rr-cond" ${disabled} style="padding:4px 6px"><option value="good">Tốt</option><option value="damaged">Hỏng</option></select></td>
          <td><input type="text" class="input rr-note" placeholder="Tùy chọn" ${disabled} style="padding:4px 6px"></td>
        </tr>`;
      }).join('');
    }

    $('rrReason').value = '';
    $('rrWarnings').style.display = 'none';
    $('rrWarnings').textContent = '';
    $('returnReceiptModal').classList.add('open');
  }

  function closeReturnReceiptModal() {
    $('returnReceiptModal').classList.remove('open');
    rrMode = null;
  }

  async function submitReturnReceipt() {
    if (!currentDetail || !rrMode) return;
    const reason = $('rrReason').value.trim();
    if (!reason) return ui.toast('Nhập lý do trả hàng', 'warning');

    const lines = [];
    document.querySelectorAll('#rrLines tbody tr[data-product-id]').forEach(tr => {
      const pid = Number(tr.dataset.productId);
      const max = Number(tr.dataset.max) || 0;
      const qtyEl = tr.querySelector('.rr-qty');
      if (!qtyEl) return;
      const qty = Number(qtyEl.value) || 0;
      if (qty <= 0) return;
      if (qty > max) {
        ui.toast(`SP id=${pid}: vượt quá tối đa ${max}`, 'warning');
        throw new Error('over-max');
      }
      const cond = tr.querySelector('.rr-cond').value;
      const note = tr.querySelector('.rr-note').value.trim();
      lines.push({ product_id: pid, qty, condition: cond, note: note || null });
    });

    // cancel mode cho phep gui rong (BE auto-revert) neu user khong nhap dong nao
    // return-done mode bat buoc co it nhat 1 dong
    if (!lines.length && rrMode === 'return-done') {
      return ui.toast('Chọn ít nhất 1 SP với số lượng > 0', 'warning');
    }

    const url = rrMode === 'cancel'
      ? `/admin/orders/${currentDetail.id}/cancel`
      : `/admin/orders/${currentDetail.id}/return-done`;
    const body = { reason_text: reason };
    if (lines.length) body.return_lines = lines;
    // Backward-compat: route /cancel cu doc field 'reason'
    if (rrMode === 'cancel') body.reason = reason;

    const r = await api.post(url, body, {
      successMessage: rrMode === 'cancel' ? 'Đã hủy đơn + tạo phiếu nhập' : 'Đã ghi nhận trả hàng',
      loading: true,
    }).catch(() => null);
    if (!r) return;

    if (Array.isArray(r.warnings) && r.warnings.length) {
      $('rrWarnings').textContent = '⚠ ' + r.warnings.join('\n⚠ ');
      $('rrWarnings').style.display = '';
      // Giu modal mo de admin doc warnings, dong sau 3s
      setTimeout(closeReturnReceiptModal, 3500);
    } else {
      closeReturnReceiptModal();
    }
    openDetail(currentDetail.id);
    load();
  }

  // Toggle dau +/- cua nut sign
  function toggleChargeSign() {
    const btn = $('cg_sign');
    if (!btn) return;
    const cur = btn.dataset.sign === '+' ? '-' : '+';
    btn.dataset.sign = cur;
    btn.textContent = cur === '+' ? '+' : '−';
    btn.classList.toggle('minus', cur === '-');
  }

  // Toggle preset → custom label input
  function onPresetChange() {
    const preset = $('cg_label_preset').value;
    const custom = $('cg_label_custom');
    if (preset === '__other__') {
      custom.style.display = '';
      custom.focus();
    } else {
      custom.style.display = 'none';
      custom.value = '';
    }
    // Tu dong gan sign theo preset Giam gia
    const btn = $('cg_sign');
    if (btn) {
      if (preset === 'Giảm giá' && btn.dataset.sign === '+') toggleChargeSign();
      if (preset !== 'Giảm giá' && btn.dataset.sign === '-') toggleChargeSign();
    }
  }

  // Them charge moi -> PATCH ngay
  async function handleAddChargeNew() {
    if (!currentDetail) return;
    const preset = $('cg_label_preset').value;
    const custom = $('cg_label_custom').value.trim();
    const label = preset === '__other__' ? custom : preset;
    if (!label) return ui.toast('Nhập nhãn cho khoản phí', 'warning');

    const sign = $('cg_sign').dataset.sign;
    const value = Number($('cg_value').value) || 0;
    if (value <= 0) return ui.toast('Nhập số tiền lớn hơn 0', 'warning');
    const amount = sign === '-' ? -value : value;

    // Map kind cho BE: discount neu am, shipping cho "Vận chuyển", con lai 'fee'
    let kind = 'fee';
    if (amount < 0) kind = 'discount';
    else if (label === 'Vận chuyển') kind = 'shipping';

    // Gop voi charges hien co + PATCH
    const next = (currentDetail.charges || [])
      .map(c => ({ kind: c.kind, label: c.label, amount: Number(c.amount) }))
      .concat([{ kind, label, amount }]);
    const r = await api.patch(`/admin/orders/${currentDetail.id}/charges`, { charges: next }, {
      successMessage: `Đã thêm "${label}"`, loading: true,
    }).catch(() => null);
    if (r) {
      $('cg_value').value = '';
      $('cg_label_custom').value = '';
      $('cg_label_preset').value = 'Lắp đặt';
      onPresetChange();
      openDetail(currentDetail.id);
    }
  }

  // Neu user nhap so tien vao form charge-add ma quen bam "+ Them",
  // hoi flush truoc khi Len don / Cap nhat KTV de khong mat thong tin.
  // Return: true = co the tiep tuc, false = dung lai (huy hoac loi).
  async function flushPendingChargeDraft() {
    const cgValEl = $('cg_value');
    if (!cgValEl) return true; // form khong ton tai (don gia han, badge...)
    const draftValue = Number(cgValEl.value) || 0;
    if (draftValue <= 0) return true;

    const preset = ($('cg_label_preset') && $('cg_label_preset').value) || '';
    const custom = ($('cg_label_custom') && $('cg_label_custom').value.trim()) || '';
    const label = preset === '__other__' ? custom : preset;
    if (!label) {
      ui.toast('Bạn còn ô số tiền chưa có nhãn — bấm "+ Thêm" hoặc xoá ô số tiền rồi thử lại', 'warning');
      return false;
    }
    const sign = ($('cg_sign') && $('cg_sign').dataset.sign) || '+';
    const amount = sign === '-' ? -draftValue : draftValue;

    const ok = await ui.confirm({
      title: 'Còn dòng phí chưa thêm',
      message: `Bạn nhập <b>"${escape(label)}" ${sign}${fmt.format(draftValue)}đ</b> nhưng chưa bấm <b>+ Thêm</b>.<br>Thêm vào đơn rồi tiếp tục?`,
      okText: 'Thêm rồi tiếp tục',
    });
    if (!ok) return false;

    let kind = 'fee';
    if (amount < 0) kind = 'discount';
    else if (label === 'Vận chuyển') kind = 'shipping';

    const next = (currentDetail.charges || [])
      .map(c => ({ kind: c.kind, label: c.label, amount: Number(c.amount) }))
      .concat([{ kind, label, amount }]);
    const r = await api.patch(`/admin/orders/${currentDetail.id}/charges`, { charges: next }, {
      loading: true, silent: true,
    }).catch(() => null);
    if (!r) return false;

    // Cap nhat in-memory + clear input de tiep tuc flow ma khong reload modal
    currentDetail.charges = r.charges || next;
    cgValEl.value = '';
    if ($('cg_label_custom')) $('cg_label_custom').value = '';
    return true;
  }

  // Xoa 1 charge -> PATCH list moi
  async function handleDeleteCharge(chargeId) {
    if (!currentDetail) return;
    const idNum = Number(chargeId);
    const next = (currentDetail.charges || [])
      .filter(c => c.id !== idNum)
      .map(c => ({ kind: c.kind, label: c.label, amount: Number(c.amount) }));
    const r = await api.patch(`/admin/orders/${currentDetail.id}/charges`, { charges: next }, {
      successMessage: 'Đã xoá', loading: true,
    }).catch(() => null);
    if (r) openDetail(currentDetail.id);
  }

  async function handleReassignStaff() {
    if (!currentDetail) return;
    const staffId = Number($('ai_staff').value);
    if (!staffId) return ui.toast('Chọn 1 KTV', 'warning');

    // User co the nhap "Van chuyen 200000" vao form ma quen bam "+ Them"
    if (!(await flushPendingChargeDraft())) return;

    const data = {
      staff_id: staffId,
      kind: ($('ai_kind') && $('ai_kind').value) || 'install',
      due_at: ($('ai_due') && $('ai_due').value) || null,
      wage_amount: Number(($('ai_wage') && $('ai_wage').value) || 0),
      note: ($('ai_note') && $('ai_note').value.trim()) || null,
    };
    const r = await api.patch(`/admin/orders/${currentDetail.id}/reassign-staff`, data, {
      successMessage: 'Đã cập nhật KTV', loading: true,
    }).catch(() => null);
    if (r) { openDetail(currentDetail.id); load(); }
  }

  // ---- Modal xuat kho (theo qty) ----------------------------
  async function openReleaseModal() {
    if (!currentDetail) return;
    if (!currentDetail.assigned_staff_id) return ui.toast('Đơn chưa có KTV', 'warning');
    $('r_order_id').value = currentDetail.id;
    $('r_help').textContent = `Xuất kho cho đơn ${currentDetail.code} — KTV ${currentDetail.staff_name || '?'}`;

    const productList = $('releaseProductList');
    productList.innerHTML = '<div class="text-center text-muted" style="padding:16px">Đang tải kho...</div>';

    // Don khong co vat tu (vd: gia han thuan dich vu): van phai xuat kho phieu
    // rong de QTV ghi nhan da xu ly don.
    if (!currentDetail.items || !currentDetail.items.length) {
      productList.innerHTML = `
        <div style="padding:14px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px">
          <b>Đơn không có vật tư.</b><br>
          <small class="text-muted">Bấm "Xác nhận xuất kho" để tạo phiếu rỗng và chuyển đơn sang giai đoạn KTV nhận đi làm.</small>
        </div>
      `;
      $('btnSaveRelease').disabled = false;
      $('releaseModal').classList.add('open');
      return;
    }

    // Goi /admin/inventory/stock cho tat ca product trong don
    const stockMap = new Map();
    await Promise.all(currentDetail.items.map(async (it) => {
      const r = await api.get(`/admin/inventory/stock?q=${encodeURIComponent(it.product_code)}`, { silent: true }).catch(() => null);
      if (r && r.items) {
        const found = r.items.find(s => s.product_id === it.product_id);
        if (found) stockMap.set(it.product_id, found.quantity);
      }
    }));

    let anyShort = false;
    productList.innerHTML = `
      <table class="data" style="width:100%;font-size:13px">
        <thead>
          <tr>
            <th style="width:40%">Sản phẩm</th>
            <th style="width:80px">Cần</th>
            <th style="width:90px">Tồn kho</th>
            <th>IMEI (tùy chọn, mỗi dòng 1 mã)</th>
          </tr>
        </thead>
        <tbody>
          ${currentDetail.items.map(it => {
            const stock = stockMap.has(it.product_id) ? Number(stockMap.get(it.product_id)) : 0;
            const short = stock < it.qty;
            if (short) anyShort = true;
            return `
              <tr ${short ? 'style="background:#fef2f2"' : ''} data-pid="${it.product_id}">
                <td><b>${escape(it.product_code)}</b><br><small class="text-muted">${escape(it.product_name)}</small></td>
                <td><b>${it.qty}</b></td>
                <td>${short
                  ? `<b style="color:#dc2626">${stock}</b> <small style="color:#dc2626">(thiếu)</small>`
                  : `<b>${stock}</b>`}</td>
                <td><textarea class="rel-imei" rows="2" style="width:100%;font-family:monospace;font-size:11.5px" placeholder="868001\n868002"></textarea></td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
      ${anyShort ? '<p style="color:#dc2626;font-weight:600;margin-top:8px">⚠ Một số sản phẩm không đủ tồn — không thể xuất kho.</p>' : ''}
    `;
    $('btnSaveRelease').disabled = anyShort;
    $('releaseModal').classList.add('open');
  }
  function closeReleaseModal() { $('releaseModal').classList.remove('open'); }

  async function handleReleaseSubmit(e) {
    e.preventDefault();
    const items = [];
    document.querySelectorAll('#releaseProductList tbody tr[data-pid]').forEach(tr => {
      const productId = Number(tr.dataset.pid);
      const orderItem = (currentDetail.items || []).find(i => i.product_id === productId);
      if (!orderItem) return;
      const imeiText = (tr.querySelector('.rel-imei') || {}).value || '';
      items.push({
        product_id: productId,
        qty: orderItem.qty,
        imei_list: imeiText.trim() || null,
      });
    });
    // items rong = phieu xuat kho rong cho don khong co vat tu (van bat buoc bam).
    const data = { items };
    const r = await api.post(`/admin/orders/${$('r_order_id').value}/release-stock`, data, {
      successMessage: 'Đã xuất kho — KTV đã có đủ thiết bị, sẵn sàng đi giao',
      loading: true,
    }).catch(() => null);
    if (r) {
      closeReleaseModal();
      openDetail(currentDetail.id);
      load();
    }
  }

  // ---- Click handlers --------------------------------------
  async function handleTableClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.act === 'detail') openDetail(id);
  }

  function handleDetailClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (btn) {
      const act = btn.dataset.act;
      if (act === 'advance-and-assign') handleAdvanceAndAssign();
      else if (act === 'reassign-staff') handleReassignStaff();
      else if (act === 'add-product')  openProductPicker();
      else if (act === 'copy-link')    handleCopyLink();
      else if (act === 'release')      openReleaseModal();
      else if (act === 'markpaid')     handleMarkPaid();
      else if (act === 'cancel')       handleCancel();
      else if (act === 'return-done')  handleReturnDone();
      else if (act === 'confirm-pending') handleConfirmPending(Number(btn.dataset.paymentId), Number(btn.dataset.amount));
      else if (act === 'reject-pending')  handleRejectPending(Number(btn.dataset.paymentId));
      else if (act === 'confirm-staff-collection') handleConfirmStaffCollection(Number(btn.dataset.collectionId), Number(btn.dataset.amount), btn.dataset.staff || 'KTV');
      else if (act === 'record-refund') openRefundModal(Number(btn.dataset.remain) || 0);
      return;
    }
    const itemDel = e.target.closest('.item-del');
    if (itemDel) { handleRemoveItem(Number(itemDel.dataset.productId)); return; }
    if (e.target.id === 'cg_add')   { handleAddChargeNew(); return; }
    if (e.target.id === 'cg_sign')  { toggleChargeSign();   return; }
    const cgDel = e.target.closest('.cg-del');
    if (cgDel) { handleDeleteCharge(cgDel.dataset.chargeId); return; }
    const img = e.target.closest('img[data-img]');
    if (img) {
      $('imgEl').src = img.dataset.img;
      $('imgModal').classList.add('open');
    }
  }

  // ---- Filter / pager / quick tabs --------------------------
  function bindFilters() {
    let timer;
    document.querySelectorAll('[data-filter]').forEach(input => {
      const ev = input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(ev, () => {
        clearTimeout(timer);
        const apply = () => {
          state.filters[input.dataset.filter] = input.value.trim();
          state.page = 1;
          if (input.dataset.filter === 'status') {
            state.filters.has_return = '';
            syncQuickTabs(input.value.trim(), state.filters.service_kind, '');
          } else if (input.dataset.filter === 'service_kind') {
            syncQuickTabs(state.filters.status, state.filters.service_kind, state.filters.has_return);
          }
          load();
        };
        if (ev === 'change') apply(); else timer = setTimeout(apply, 300);
      });
    });
  }
  function syncQuickTabs(status, serviceKind, hasReturn) {
    document.querySelectorAll('#quickTabs button').forEach(b => {
      const f = b.dataset.filter;
      let on = false;
      if (f === 'badge')           on = serviceKind === 'badge';
      else if (f === 'renewal')    on = serviceKind === 'renewal';
      else if (f === 'has_return') on = hasReturn === '1';
      else if (f === 'all')        on = !status && !serviceKind && !hasReturn;
      else                         on = !serviceKind && !hasReturn && f === status;
      b.classList.toggle('on', on);
    });
  }
  function bindQuickTabs() {
    const qt = $('quickTabs');
    if (!qt) return;
    qt.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-filter]');
      if (!b) return;
      const f = b.dataset.filter;
      if (f === 'badge' || f === 'renewal') {
        state.filters.status = '';
        state.filters.service_kind = f;
        state.filters.has_return = '';
      } else if (f === 'has_return') {
        state.filters.status = '';
        state.filters.service_kind = '';
        state.filters.has_return = '1';
      } else if (f === 'all') {
        state.filters.status = '';
        state.filters.service_kind = '';
        state.filters.has_return = '';
      } else {
        state.filters.status = f;
        state.filters.service_kind = '';
        state.filters.has_return = '';
      }
      state.page = 1;
      const sel = document.querySelector('select[data-filter="status"]');
      if (sel) sel.value = state.filters.status;
      syncQuickTabs(state.filters.status, state.filters.service_kind, state.filters.has_return);
      load();
    });
  }

  function syncStickyOffset() {
    const row1 = document.querySelector('.flex-page table.data thead tr:first-child');
    if (!row1) return;
    document.documentElement.style.setProperty('--th-row1-h', row1.getBoundingClientRect().height + 'px');
  }

  // ---- Init -----------------------------------------------
  async function init() {
    adminShell.init('orders');
    bindFilters();
    bindQuickTabs();
    await Promise.all([loadProducts(), loadCustomers()]);

    $('btnAdd').addEventListener('click', openModal);
    if ($('btnAddBadge')) $('btnAddBadge').addEventListener('click', openBadgeModal);
    if ($('badgeClose')) $('badgeClose').addEventListener('click', closeBadgeModal);
    if ($('badgeCancel')) $('badgeCancel').addEventListener('click', closeBadgeModal);
    if ($('badgeModal')) $('badgeModal').addEventListener('click', (e) => { if (e.target.id === 'badgeModal') closeBadgeModal(); });
    if ($('badgeFrm')) $('badgeFrm').addEventListener('submit', handleBadgeSubmit);
    $('modalClose').addEventListener('click', closeModal);
    $('btnCancel').addEventListener('click', closeModal);
    $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    $('frm').addEventListener('submit', handleSubmit);
    $('btnAddItem').addEventListener('click', () => addItemRow());

    $('itemsList').addEventListener('input', recalcTotal);
    $('itemsList').addEventListener('change', recalcTotal);
    $('itemsList').addEventListener('click', (e) => {
      const del = e.target.closest('.item-del');
      if (del) { del.closest('.item-row').remove(); recalcTotal(); }
    });

    $('detailClose').addEventListener('click', closeDetail);
    $('detailCloseBtn').addEventListener('click', closeDetail);
    $('detailModal').addEventListener('click', (e) => { if (e.target.id === 'detailModal') closeDetail(); });

    // Huong dan xu ly don
    injectGuideStyles();
    $('btnOrderGuide').addEventListener('click', openOrderGuide);
    $('orderGuideClose').addEventListener('click', closeOrderGuide);
    $('orderGuideOk').addEventListener('click', closeOrderGuide);
    $('orderGuideModal').addEventListener('click', (e) => { if (e.target.id === 'orderGuideModal') closeOrderGuide(); });
    $('detailBody').addEventListener('click', handleDetailClick);
    $('detailBody').addEventListener('click', handleBadgeAction);
    // Footer (Len don / Copy / Huy / Xuat kho / Markpaid / Cap nhat KTV) cung di qua handleDetailClick
    $('detailFoot').addEventListener('click', handleDetailClick);
    $('detailBody').addEventListener('change', (e) => {
      if (e.target.id === 'cg_label_preset') onPresetChange();
    });
    $('detailBody').addEventListener('keydown', (e) => {
      if (e.target.id === 'cg_value' && e.key === 'Enter') {
        e.preventDefault();
        handleAddChargeNew();
      }
    });
    $('releaseClose').addEventListener('click', closeReleaseModal);
    $('releaseCancel').addEventListener('click', closeReleaseModal);
    $('releaseModal').addEventListener('click', (e) => { if (e.target.id === 'releaseModal') closeReleaseModal(); });
    $('releaseFrm').addEventListener('submit', handleReleaseSubmit);

    // Modal phieu tra hang / huy don
    $('rrClose').addEventListener('click', closeReturnReceiptModal);
    $('rrCancel').addEventListener('click', closeReturnReceiptModal);
    $('rrSubmit').addEventListener('click', () => { submitReturnReceipt().catch(() => {}); });
    $('returnReceiptModal').addEventListener('click', (e) => {
      if (e.target.id === 'returnReceiptModal') closeReturnReceiptModal();
    });

    // Modal hoan tien
    $('rfClose').addEventListener('click', closeRefundModal);
    $('rfCancel').addEventListener('click', closeRefundModal);
    $('rfSubmit').addEventListener('click', () => { submitRefund().catch(() => {}); });
    $('refundModal').addEventListener('click', (e) => {
      if (e.target.id === 'refundModal') closeRefundModal();
    });

    // Product picker
    $('ppClose').addEventListener('click', closeProductPicker);
    $('ppCancel').addEventListener('click', closeProductPicker);
    $('productPickerModal').addEventListener('click', (e) => { if (e.target.id === 'productPickerModal') closeProductPicker(); });
    $('pp_search').addEventListener('input', () => {
      clearTimeout(ppSearchTimer);
      ppSearchTimer = setTimeout(loadPickerResults, 250);
    });
    $('pp_category').addEventListener('change', loadPickerResults);
    $('pp_results').addEventListener('click', (e) => {
      const btn = e.target.closest('.pp-add');
      if (!btn) return;
      pickProduct(Number(btn.dataset.productId), Number(btn.dataset.price), btn.dataset.name);
    });

    $('imgClose').addEventListener('click', () => $('imgModal').classList.remove('open'));
    $('imgModal').addEventListener('click', (e) => { if (e.target.id === 'imgModal') $('imgModal').classList.remove('open'); });

    $('prevPage').addEventListener('click', () => { state.page--; load(); });
    $('nextPage').addEventListener('click', () => { state.page++; load(); });
    $('tbody').addEventListener('click', handleTableClick);

    syncStickyOffset();
    window.addEventListener('resize', syncStickyOffset);
    load().then(() => {
      const m = /^#order-(\d+)$/.exec(location.hash || '');
      if (m) openDetail(Number(m[1]));
    });
    window.addEventListener('hashchange', () => {
      const m = /^#order-(\d+)$/.exec(location.hash || '');
      if (m) openDetail(Number(m[1]));
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
