// Logic trang KTV - tasks (cong viec cua toi)
// Tab nay gop CA cong viec dang lam + da xong (timeline). Co filter rich +
// canh bao vang cho don chua nop. Multi-select + flow nop tien batch tai cho.

(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  const KIND_LABEL = { install: 'Lắp đặt', maintenance: 'Bảo trì', renew: 'Gia hạn', uninstall: 'Tháo gỡ' };
  const STATUS_PILL = {
    assigned:              '<span class="pill gray">Mới giao</span>',
    warehouse_released:    '<span class="pill blue">Đã xuất kho</span>',
    in_progress:           '<span class="pill amber">Đang làm</span>',
    done:                  '<span class="pill green">Hoàn thành</span>',
    customer_owes:         '<span class="pill amber">Khách còn nợ</span>',
    pending_admin_confirm: '<span class="pill amber">Chờ admin xác nhận</span>',
    staff_owes:            '<span class="pill amber">Bạn còn giữ tiền</span>',
    cancelled:             '<span class="pill red">Huỷ</span>',
  };
  const PAYMENT_PILL = {
    unpaid: '<span class="pill amber">⚠ Chưa nộp</span>',
    paid:   '<span class="pill green">✓ Đã nộp</span>',
  };

  const state = {
    items: [],
    detail: null,
    pendingPhotos: [],     // anh stage=deliver cho complete modal
    receivePhotos: [],     // anh stage=receive cho receive modal
    selected: new Set(),   // collection_id da tick de nop
  };

  function readFiltersFromUrl() {
    const p = new URLSearchParams(location.search);
    if (p.has('status')   && $('fStatus'))   $('fStatus').value   = p.get('status');
    if (p.has('kind')     && $('fKind'))     $('fKind').value     = p.get('kind');
    if (p.has('payment')  && $('fPayment'))  $('fPayment').value  = p.get('payment');
    if (p.has('date_from')&& $('fDateFrom')) $('fDateFrom').value = p.get('date_from');
    if (p.has('date_to')  && $('fDateTo'))   $('fDateTo').value   = p.get('date_to');
    if (p.has('q')        && $('fSearch'))   $('fSearch').value   = p.get('q');
    // Shortcut: ?today=1 -> set date_from = date_to = hom nay
    if (p.get('today') === '1') {
      const today = new Date().toISOString().slice(0, 10);
      $('fDateFrom').value = today;
      $('fDateTo').value   = today;
    }
  }

  function buildQuery() {
    const p = new URLSearchParams();
    if ($('fStatus').value)   p.set('status',   $('fStatus').value);
    if ($('fKind').value)     p.set('kind',     $('fKind').value);
    if ($('fPayment').value)  p.set('payment',  $('fPayment').value);
    if ($('fDateFrom').value) p.set('date_from',$('fDateFrom').value);
    if ($('fDateTo').value)   p.set('date_to',  $('fDateTo').value);
    const q = $('fSearch').value.trim();
    if (q) p.set('q', q);
    return p;
  }

  function cardHtml(t) {
    const isUnpaid = t.payment_status === 'unpaid';
    // Flow: assigned -> KTV chup anh nhan hang; warehouse_released -> KTV thuc hien.
    let startBtn = '';
    if (t.status === 'assigned') {
      startBtn = `<button class="btn sm" data-act="detail" data-id="${t.id}">📷 Chụp ảnh nhận</button>`;
    } else if (t.status === 'warehouse_released') {
      startBtn = `<button class="btn sm" data-act="detail" data-id="${t.id}">▶ Thực hiện</button>`;
    } else if (t.status === 'in_progress') {
      startBtn = `<button class="btn sm" data-act="detail" data-id="${t.id}">✓ Hoàn thành</button>`;
    }
    const detailBtn   = `<button class="btn ghost sm" data-act="detail" data-id="${t.id}">Chi tiết</button>`;

    const checkbox = isUnpaid
      ? `<input type="checkbox" class="pick" data-collection="${t.collection_id}" data-amount="${t.collection_amount}" ${state.selected.has(t.collection_id) ? 'checked' : ''}>`
      : `<span style="width:16px;display:inline-block"></span>`;

    const dateLine = t.completed_at
      ? `🏁 Xong: ${escape(t.completed_at.replace('T',' ').slice(0,16))}`
      : (t.due_at ? `⏰ Hạn: ${escape(t.due_at.replace('T',' ').slice(0,16))}` : '');

    return `
      <div class="task-card ${isUnpaid ? 'unpaid' : ''}" id="order-${t.id}">
        ${checkbox}
        <div>
          <div class="header">
            <b>${escape(t.code)}</b>
            <span class="text-muted">${KIND_LABEL[t.kind] || t.kind}</span>
            ${STATUS_PILL[t.status] || ''}
            ${PAYMENT_PILL[t.payment_status] || ''}
          </div>
          <div class="info-row">👤 <b>${escape(t.customer_name || '')}</b>
            ${t.customer_phone ? '· 📞 <a href="tel:' + escape(t.customer_phone) + '">' + escape(t.customer_phone) + '</a>' : ''}
          </div>
          ${t.address ? `<div class="info-row">📍 ${escape(t.address)}${t.area ? ' (' + escape(t.area) + ')' : ''}</div>` : ''}
          ${t.vehicle_plate ? `<div class="info-row">🚗 Biển số: <b>${escape(t.vehicle_plate)}</b></div>` : ''}
          <div class="info-row">
            💵 Tổng đơn: <b>${fmt.format(Number(t.total_amount) || 0)}đ</b>
            · Công lắp: <b>${fmt.format(Number(t.wage_amount) || 0)}đ</b>
          </div>
          ${dateLine ? `<div class="info-row">${dateLine}</div>` : ''}
          ${isUnpaid ? `<div class="info-row warn">⚠ Đơn chưa nộp ${fmt.format(t.collection_amount)}đ — tick để nộp về công ty</div>` : ''}
          ${t.ktv_note ? `<div class="info-row" style="background:#fef3c7;padding:6px 10px;border-radius:6px;margin-top:6px">📝 ${escape(t.ktv_note)}</div>` : ''}
        </div>
        <div class="actions">
          ${startBtn || detailBtn}
          ${t.customer_phone ? `<a href="tel:${escape(t.customer_phone)}" class="btn ghost sm">📞 Gọi</a>` : ''}
        </div>
      </div>
    `;
  }

  async function load(opts) {
    const apiOpts = (opts && opts.silent) ? { silent: true } : undefined;
    const res = await api.get('/kithuat/orders?' + buildQuery().toString(), apiOpts).catch(() => null);
    if (!res) return;
    state.items = res.items || [];
    // Don dep selected: bo nhung collection_id khong con trong list
    const validIds = new Set(state.items.filter(t => t.collection_id).map(t => t.collection_id));
    for (const id of Array.from(state.selected)) {
      if (!validIds.has(id)) state.selected.delete(id);
    }
    if (!state.items.length) {
      $('taskList').innerHTML = '';
      $('emptyMsg').classList.remove('hide');
    } else {
      $('emptyMsg').classList.add('hide');
      $('taskList').innerHTML = state.items.map(cardHtml).join('');
    }
    renderBatchBar();
    // Auto open detail neu hash #order-XX (hoac #task-XX cu)
    if (location.hash.startsWith('#order-')) {
      openDetail(location.hash.slice(7));
    } else if (location.hash.startsWith('#task-')) {
      openDetail(location.hash.slice(6));
    }
  }

  function renderBatchBar() {
    const items = state.items.filter(t => state.selected.has(t.collection_id));
    if (!items.length) {
      $('batchBar').classList.add('hide');
      return;
    }
    const total = items.reduce((s, t) => s + Number(t.collection_amount || 0), 0);
    $('batchCount').textContent = items.length;
    $('batchTotal').textContent = fmt.format(total) + 'đ';
    $('batchBar').classList.remove('hide');
  }

  // ---- Detail modal ------------------------------------------
  async function openDetail(id) {
    const res = await api.get('/kithuat/orders/' + id, { loading: true }).catch(() => null);
    if (!res) return;
    state.detail = res;
    const _ts = {
      assigned:              { text: 'Mới giao',           cls: 'gray'  },
      warehouse_released:    { text: 'Đã xuất kho',        cls: 'blue'  },
      in_progress:           { text: 'Đang làm',           cls: 'amber' },
      done:                  { text: 'Hoàn thành',         cls: 'green' },
      customer_owes:         { text: 'Khách còn nợ',       cls: 'amber' },
      pending_admin_confirm: { text: 'Chờ admin xác nhận', cls: 'amber' },
      staff_owes:            { text: 'Bạn còn giữ tiền',   cls: 'amber' },
      cancelled:             { text: 'Huỷ',                cls: 'red'   },
    }[res.status] || { text: res.status, cls: 'gray' };
    $('detailTitle').innerHTML =
      `${escape(res.code)} — ${escape(KIND_LABEL[res.kind] || res.kind)} `
      + `<span class="pill ${_ts.cls}" style="font-size:14px;padding:4px 12px;vertical-align:middle;margin-left:6px">${escape(_ts.text)}</span>`;

    const itemsHtml = res.items.length ? `
      <ul style="margin:0;padding-left:20px">
        ${res.items.map(it => `<li>${escape(it.product_name)} × ${it.qty}</li>`).join('')}
      </ul>
    ` : '<p class="text-muted">Không có sản phẩm</p>';

    // Khoi tien: Tong tien can thu + breakdown (san pham, cong lap, phi khac, giam gia)
    const orderTotal = Number(res.total_amount || 0);
    const orderPaid = Number(res.paid_amount || 0);
    const orderDue = Math.max(0, orderTotal - orderPaid);
    const wageAmt = Number(res.wage_amount || 0);
    // Tinh tu items de chinh xac (BE order_subtotal co the bi backfill cu)
    const itemsSubtotal = (res.items || []).reduce(
      (s, it) => s + (Number(it.unit_price) || 0) * (Number(it.qty) || 0), 0);
    // Tien cong da sync vao order_charges duoi label "Cong lap" (theo quy uoc syncLaborCharge),
    // -> loc ra de khong hien lai trung dong "Cong lap"
    const oCharges = (Array.isArray(res.order_charges) ? res.order_charges : [])
      .filter(c => (c.label || '').trim().toLowerCase() !== 'công lắp');

    const row = (label, value, opts = {}) => {
      const color = opts.color || '#0f172a';
      const sign = opts.sign || '';
      return `<div style="display:flex;justify-content:space-between;padding:4px 0">
        <span style="color:#475569">${escape(label)}</span>
        <b style="color:${color}">${sign}${fmt.format(Math.abs(value))}đ</b>
      </div>`;
    };

    const moneyHtml = `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin:10px 0;font-size:13.5px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;padding-bottom:8px;border-bottom:2px solid #cbd5e1;margin-bottom:6px">
          <span style="color:#475569;font-weight:600">🧾 Tổng tiền cần thu</span>
          <b style="color:#1d4ed8;font-size:18px">${fmt.format(orderTotal)}đ</b>
        </div>
        ${row('Tiền sản phẩm', itemsSubtotal)}
        ${wageAmt > 0 ? row('Công lắp', wageAmt) : ''}
        ${oCharges.map(c => {
          const amt = Number(c.amount) || 0;
          const isMinus = amt < 0;
          return row(c.label || '', amt, {
            color: isMinus ? '#16a34a' : '#0f172a',
            sign:  isMinus ? '−' : '+',
          });
        }).join('')}
        <div style="border-top:1px dashed #cbd5e1;margin-top:6px;padding-top:6px">
          ${row('Đã thanh toán', orderPaid, { color: '#16a34a' })}
          ${row('Còn lại', orderDue, { color: orderDue > 0 ? '#dc2626' : '#16a34a' })}
        </div>
      </div>
    `;

    const photosHtml = res.attachments.length ? `
      <div class="photo-grid">
        ${res.attachments.map(a => `<img src="${a.url}" alt="" onclick="window.open('${a.url}', '_blank')">`).join('')}
      </div>
    ` : '<p class="text-muted">Chưa có ảnh</p>';

    // Tim payment status tu list (load() da fetch tu BE)
    const summary = state.items.find(t => t.id === res.id);
    const isUnpaid = summary && summary.payment_status === 'unpaid';
    const unpaidWarn = isUnpaid
      ? `<div style="background:#fef3c7;border:1px solid #f59e0b;color:#92400e;padding:10px;border-radius:8px;margin:10px 0;font-weight:600">
           ⚠ Đơn này có ${fmt.format(summary.collection_amount)}đ <b>chưa nộp</b> về công ty.
         </div>`
      : '';

    // Flow theo status:
    //   assigned          -> bao KTV chup anh nhan hang TRUOC, sau do admin moi xuat kho.
    //   warehouse_released -> admin da xuat kho, KTV bam "Thuc hien" de bat dau.
    let releaseWarn = '';
    if (res.status === 'assigned') {
      releaseWarn = `<div style="background:#dbeafe;border:1px solid #3b82f6;color:#1e3a8a;padding:12px;border-radius:8px;margin:10px 0;line-height:1.5">
         <b>📷 Bước 1: Chụp ảnh nhận hàng</b><br>
         <small>Bấm <b>Chụp ảnh nhận hàng</b> để tải ảnh thiết bị / hồ sơ. Sau khi bạn upload xong, admin sẽ kiểm tra và bấm <b>Xuất kho</b>. Khi đó bạn mới có nút <b>▶ Thực hiện</b>.</small>
       </div>`;
    } else if (res.status === 'warehouse_released') {
      releaseWarn = `<div style="background:#ecfdf5;border:1px solid #6ee7b7;color:#065f46;padding:12px;border-radius:8px;margin:10px 0;line-height:1.5">
         <b>✅ Đã nhận đủ thiết bị</b><br>
         <small>Admin đã xuất kho, thiết bị đã có trong kho cá nhân của bạn. Bấm <b>▶ Thực hiện</b> để tiến hành đi giao.</small>
       </div>`;
    }

    $('detailBody').innerHTML = `
      ${unpaidWarn}
      ${releaseWarn}
      <div style="font-size:14px">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
          ${summary ? (PAYMENT_PILL[summary.payment_status] || '') : ''}
        </div>
        <p>👤 <b>${escape(res.customer_name)}</b>
          ${res.customer_phone ? '· 📞 <a href="tel:' + escape(res.customer_phone) + '">' + escape(res.customer_phone) + '</a>' : ''}
        </p>
        <p>📍 ${escape(res.address || res.customer_address || '—')}${res.area ? ' (' + escape(res.area) + ')' : ''}</p>
        ${res.vehicle_plate ? `<p>🚗 Biển số: <b>${escape(res.vehicle_plate)}</b></p>` : ''}
        ${moneyHtml}
        ${res.due_at ? `<p>⏰ Hạn: <b>${escape(res.due_at.replace('T',' ').slice(0,16))}</b></p>` : ''}
        ${res.started_at ? `<p>▶ Bắt đầu: ${escape(res.started_at.replace('T',' ').slice(0,16))}</p>` : ''}
        ${res.completed_at ? `<p>🏁 Hoàn thành: <b>${escape(res.completed_at.replace('T',' ').slice(0,16))}</b></p>` : ''}
        ${res.note ? `<div style="background:#fffbeb;border:1px solid #fcd34d;padding:10px 12px;border-radius:8px;margin:8px 0;line-height:1.5;white-space:pre-wrap"><b style="color:#92400e">📌 Ghi chú đơn từ khách:</b>
${escape(res.note)}</div>` : ''}
        ${res.ktv_note ? `<div style="background:#fef3c7;padding:8px;border-radius:6px;margin:8px 0"><b>📝 Ghi chú KTV:</b> ${escape(res.ktv_note)}</div>` : ''}
      </div>
      <div class="order-detail-section" style="margin-top:14px;padding-top:14px;border-top:1px dashed #e2e8f0">
        <h4 style="margin-bottom:8px;color:#475569">📦 Sản phẩm</h4>
        ${itemsHtml}
      </div>
      <div class="order-detail-section" style="margin-top:14px;padding-top:14px;border-top:1px dashed #e2e8f0">
        <h4 style="margin-bottom:8px;color:#475569">📸 Ảnh đã upload</h4>
        ${photosHtml}
      </div>
    `;

    // Bước 1 — Chụp ảnh nhận hàng: khi đơn ở 'assigned' (chưa xuất kho).
    if ($('btnUploadReceive')) {
      $('btnUploadReceive').style.display = (res.status === 'assigned') ? '' : 'none';
    }
    // Bước 2 — Thực hiện: chỉ khi đơn đã xuất kho.
    $('btnStart').style.display = (res.status === 'warehouse_released') ? '' : 'none';
    // Bước 3 — Hoàn thành: chỉ khi đơn đã bắt đầu (in_progress).
    $('btnCompleteOpen').style.display = (res.status === 'in_progress') ? '' : 'none';
    // Nut "Nop khoan nay" hien khi task co collection chua nop
    let btnRemitOne = $('btnRemitOne');
    if (!btnRemitOne) {
      btnRemitOne = document.createElement('button');
      btnRemitOne.id = 'btnRemitOne';
      btnRemitOne.type = 'button';
      btnRemitOne.className = 'btn';
      btnRemitOne.style.background = '#f59e0b';
      btnRemitOne.textContent = '💰 Nộp khoản này';
      $('btnCompleteOpen').parentNode.insertBefore(btnRemitOne, $('btnCompleteOpen').nextSibling);
    }
    // Re-bind onclick moi lan (de capture summary moi nhat, khong dinh closure cu)
    btnRemitOne.onclick = () => {
      if (!state.detail) return;
      const sum = state.items.find(t => t.id === state.detail.id);
      if (!sum || !sum.collection_id) return;
      state.selected.clear();
      state.selected.add(sum.collection_id);
      closeDetail();
      openRemit();
    };
    btnRemitOne.style.display = isUnpaid ? '' : 'none';

    $('detailModal').classList.add('open');
  }
  function closeDetail() {
    $('detailModal').classList.remove('open');
    state.detail = null;
    history.replaceState(null, '', location.pathname + location.search);
  }

  // ---- Start task: mo modal yeu cau upload anh stage=receive ---
  function openReceive() {
    if (!state.detail) return;
    state.receivePhotos = (state.detail.attachments || [])
      .filter(a => a.stage === 'receive')
      .map(a => ({ url: a.url, id: a.id }));
    renderReceiveGrid();
    $('receiveModal').classList.add('open');
  }
  function closeReceive() {
    $('receiveModal').classList.remove('open');
    state.receivePhotos = [];
  }
  function renderReceiveGrid() {
    const html = state.receivePhotos.map((p, i) =>
      `<img src="${p.url}" alt="" data-idx="${i}">`
    ).join('');
    $('receivePhotoGrid').innerHTML = html + `<div class="photo-add" id="receivePhotoAddBtn">+</div>`;
  }
  async function handleReceivePhotoAdd(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    await uploadPhotos(files, 'receive', state.receivePhotos, renderReceiveGrid);
  }

  // Upload nhieu anh tuan tu (1-by-1 de tranh rate-limit imgbb)
  async function uploadPhotos(files, stage, bucket, renderFn) {
    let okCount = 0, failCount = 0;
    ui.loading(true);
    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          failCount++;
          continue;
        }
        let url;
        try {
          url = await imgbb.upload(file, { name: `order-${state.detail.id}-${stage}` });
        } catch (err) {
          failCount++;
          continue;
        }
        const res = await api.post(`/kithuat/orders/${state.detail.id}/upload`,
          { url, stage }, { silent: true }
        ).catch(() => null);
        if (!res) { failCount++; continue; }
        bucket.push({ url: res.url, id: res.id });
        okCount++;
        renderFn();
      }
    } finally {
      ui.loading(false);
    }
    if (okCount) ui.toast(`Đã tải ${okCount} ảnh${failCount ? ` (${failCount} ảnh lỗi)` : ''}`, 'success');
    else if (failCount) ui.toast(`Không tải được ảnh (${failCount} ảnh lỗi)`, 'error');
  }

  // Đóng modal "Chụp ảnh nhận hàng". Ảnh đã upload tuần tự lên server, ở đây chỉ đóng UI.
  // KHÔNG gọi /start — đó là bước riêng (sau khi admin xuất kho).
  async function handleReceiveConfirm() {
    const hadPhotos = state.receivePhotos.length > 0;
    closeReceive();
    ui.toast(
      hadPhotos
        ? 'Đã update hình ảnh, chờ quản trị viên duyệt xuất kho'
        : 'Đã ghi nhận, chờ quản trị viên duyệt xuất kho',
      'success'
    );
    // Refresh lại detail + list để admin thấy ảnh ngay
    if (state.detail) await openDetail(state.detail.id);
    load();
  }

  // Bấm "Thực hiện" — đơn đã warehouse_released, KTV bắt đầu. Không cần modal.
  async function handleStartTask() {
    if (!state.detail) return;
    if (state.detail.status !== 'warehouse_released') {
      return ui.toast('Đơn chưa được xuất kho — chưa thể thực hiện', 'warning');
    }
    const ok = await api.patch(`/kithuat/orders/${state.detail.id}/start`, null, {
      successMessage: 'Đã bắt đầu — đi giao thôi!',
    }).catch(() => null);
    if (ok) {
      closeDetail();
      load();
    }
  }

  // ---- Complete modal ----------------------------------------
  // Tien khach phai thanh toan (con lai cua don) duoc chia 3 phan:
  //   - to_staff:  KTV thu (cash/transfer) -> KTV no cong ty
  //   - to_admin:  khach bao da/sap tra thang admin -> doi admin xac nhan
  //   - debt:      khach con no -> auto = remaining - to_staff - to_admin
  async function openComplete() {
    if (!state.detail) return;
    $('c_order_id').value = state.detail.id;
    state.completeTotalOrig = Number(state.detail.total_amount || 0);
    state.completePaid = Number(state.detail.paid_amount || 0);
    $('c_staff_method').value = 'cash';
    $('c_plate').value = state.detail.vehicle_plate || '';
    $('c_note').value = state.detail.ktv_note || '';
    recomputeRemaining(); // set remaining + reset 3 o tien
    state.pendingPhotos = (state.detail.attachments || [])
      .filter(a => a.stage !== 'receive')
      .map(a => ({ url: a.url, id: a.id }));
    renderPhotoGrid();
    await loadHoldingsForReturn();
    $('completeModal').classList.add('open');
  }

  // Tinh remaining = total - paid, reset 3 o tien
  function recomputeRemaining() {
    const total     = Number(state.completeTotalOrig || 0);
    const paid      = Number(state.completePaid || 0);
    const remaining = Math.max(0, total - paid);
    state.completeRemaining = remaining;
    $('c_remaining').textContent = fmt.format(remaining) + 'đ';
    $('c_to_staff').value = remaining;
    $('c_to_admin').value = 0;
    $('c_debt').value = 0;
    syncSplit();
  }

  // Load staff_holdings de hien danh sach co the tra kho.
  async function loadHoldingsForReturn() {
    const res = await api.get('/kithuat/inventory', { silent: true }).catch(() => null);
    const items = res ? (res.items || []) : [];
    const block = $('c_returns_block');
    const list = $('c_returns_list');
    if (!items.length) {
      block.style.display = 'none';
      list.innerHTML = '';
      return;
    }
    block.style.display = '';
    list.innerHTML = items.map(h => `
      <label style="display:flex;align-items:center;gap:8px;padding:6px;border-bottom:1px solid #f1f5f9;cursor:pointer">
        <input type="checkbox" class="ret-pick" data-product="${h.product_id}" data-max="${h.qty}">
        <div style="flex:1;font-size:13px">
          <b>${escape(h.product_code)}</b> — ${escape(h.product_name)}
          <span class="text-muted" style="font-size:12px">(đang giữ ${h.qty})</span>
        </div>
        <input type="number" class="input ret-qty" data-product="${h.product_id}" min="1" max="${h.qty}" value="${h.qty}" disabled style="width:70px;padding:4px 6px">
      </label>
    `).join('');
    // Enable input qty khi tick
    list.querySelectorAll('.ret-pick').forEach(cb => {
      cb.addEventListener('change', () => {
        const qtyInput = list.querySelector(`.ret-qty[data-product="${cb.dataset.product}"]`);
        if (qtyInput) qtyInput.disabled = !cb.checked;
      });
    });
  }

  function collectReturns() {
    const list = $('c_returns_list');
    if (!list) return [];
    const out = [];
    list.querySelectorAll('.ret-pick:checked').forEach(cb => {
      const productId = Number(cb.dataset.product);
      const max = Number(cb.dataset.max);
      const qtyInput = list.querySelector(`.ret-qty[data-product="${productId}"]`);
      const qty = Math.max(0, Math.min(max, Number(qtyInput?.value) || 0));
      if (qty > 0) out.push({ product_id: productId, qty });
    });
    return out;
  }
  function closeComplete() {
    $('completeModal').classList.remove('open');
    state.pendingPhotos = [];
  }

  function syncSplit() {
    const remaining = Number(state.completeRemaining || 0);
    const toStaff = Math.max(0, Number($('c_to_staff').value) || 0);
    const toAdmin = Math.max(0, Number($('c_to_admin').value) || 0);
    const debt = remaining - toStaff - toAdmin;
    $('c_debt').value = debt;
    const warn = $('c_split_warn');
    if (debt > 0) {
      warn.style.display = 'block';
      warn.style.background = '#fef3c7';
      warn.style.color = '#92400e';
      warn.textContent = `→ Khách còn nợ ${fmt.format(debt)}đ sau khi xong việc.`;
    } else {
      warn.style.display = 'none';
    }
  }

  function renderPhotoGrid() {
    const html = state.pendingPhotos.map((p, i) =>
      `<img src="${p.url}" alt="" data-idx="${i}" title="Click để xoá">`
    ).join('');
    $('photoGrid').innerHTML = html + `<div class="photo-add" id="photoAddBtn">+</div>`;
  }

  async function handlePhotoAdd(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    await uploadPhotos(files, 'deliver', state.pendingPhotos, renderPhotoGrid);
  }

  async function handleComplete(e) {
    e.preventDefault();
    if (!state.pendingPhotos.length) {
      return ui.toast('Bắt buộc chụp ít nhất 1 ảnh bàn giao', 'warning');
    }
    const remaining = Number(state.completeRemaining || 0);
    const toStaff = Math.max(0, Number($('c_to_staff').value) || 0);
    const toAdmin = Math.max(0, Number($('c_to_admin').value) || 0);
    const debt    = remaining - toStaff - toAdmin;
    const returns = collectReturns();
    const body = {
      to_staff_amount: toStaff,
      to_staff_method: $('c_staff_method').value,
      to_admin_amount: toAdmin,
      debt_amount: debt,
      expected_amount: remaining,
      discount_amount: 0,
      vehicle_plate: $('c_plate').value.trim() || null,
      note: $('c_note').value.trim() || null,
      returns,
    };
    const parts = [];
    if (returns.length)  parts.push(`trả ${returns.length} loại về kho`);
    const successMsg = parts.length
      ? `Đã hoàn thành — ${parts.join(' · ')}`
      : 'Đã hoàn thành công việc';
    const ok = await api.patch(`/kithuat/orders/${state.detail.id}/complete`, body, {
      successMessage: successMsg,
      loading: true,
    }).catch(() => null);
    if (!ok) return;
    closeComplete();
    closeDetail();
    load();
  }

  // ---- Remit modal -------------------------------------------
  function openRemit() {
    if (!state.selected.size) return;
    const items = state.items.filter(t => state.selected.has(t.collection_id));
    const total = items.reduce((s, t) => s + Number(t.collection_amount || 0), 0);
    $('r_total').textContent = fmt.format(total) + 'đ';
    $('r_count').textContent = items.length;
    $('r_method').value = 'cash';
    $('r_note').value = '';
    $('r_receipt_url').value = '';
    $('r_receipt_preview').style.display = 'none';
    $('r_receipt_preview').src = '';
    $('r_receipt_file').value = '';
    $('remitModal').classList.add('open');
  }
  function closeRemit() { $('remitModal').classList.remove('open'); }

  function fileToDataUrl(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result);
      r.onerror = () => rej(new Error('Không đọc được file'));
      r.readAsDataURL(file);
    });
  }

  async function handleReceiptUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { ui.toast('Ảnh quá 5MB', 'warning'); e.target.value = ''; return; }
    const dataUrl = await fileToDataUrl(file);
    const res = await api.post('/kithuat/uploads', { dataUrl, folder: 'receipts' }, {
      loading: true,
    }).catch(() => null);
    e.target.value = '';
    if (!res) return;
    $('r_receipt_url').value = res.url;
    $('r_receipt_preview').src = res.url;
    $('r_receipt_preview').style.display = 'block';
  }

  async function handleRemitSubmit(e) {
    e.preventDefault();
    const data = {
      collection_ids: Array.from(state.selected),
      method: $('r_method').value,
      receipt_url: $('r_receipt_url').value || null,
      note: $('r_note').value.trim() || null,
    };
    const ok = await api.post('/kithuat/remittances', data, {
      successMessage: 'Đã nộp, chờ admin duyệt',
      loading: true,
    }).catch(() => null);
    if (!ok) return;
    state.selected.clear();
    closeRemit();
    load();
  }

  // ---- List click --------------------------------------------
  function handleListClick(e) {
    // Tick chon collection
    if (e.target.classList.contains('pick')) {
      const id = Number(e.target.dataset.collection);
      if (e.target.checked) state.selected.add(id);
      else state.selected.delete(id);
      renderBatchBar();
      return;
    }
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    if (btn.dataset.act === 'detail') openDetail(btn.dataset.id);
  }

  // ---- Filter handlers ---------------------------------------
  function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  function init() {
    techShell.init('tasks');
    readFiltersFromUrl();

    ['fStatus','fKind','fPayment','fDateFrom','fDateTo'].forEach(id => {
      $(id).addEventListener('change', load);
    });
    $('fSearch').addEventListener('input', debounce(load, 300));

    $('taskList').addEventListener('click', handleListClick);

    $('batchClear').addEventListener('click', () => {
      state.selected.clear();
      load();
    });
    $('batchRemit').addEventListener('click', openRemit);

    $('detailClose').addEventListener('click', closeDetail);
    $('detailCloseBtn').addEventListener('click', closeDetail);
    $('detailModal').addEventListener('click', (e) => { if (e.target.id === 'detailModal') closeDetail(); });

    $('btnUploadReceive').addEventListener('click', openReceive);
    $('btnStart').addEventListener('click', handleStartTask);
    $('btnCompleteOpen').addEventListener('click', openComplete);

    // Receive modal
    $('receiveClose').addEventListener('click', closeReceive);
    $('receiveModal').addEventListener('click', (e) => { if (e.target.id === 'receiveModal') closeReceive(); });
    $('receiveConfirm').addEventListener('click', handleReceiveConfirm);
    $('receivePhotoFile').addEventListener('change', handleReceivePhotoAdd);
    $('receivePhotoGrid').addEventListener('click', (e) => {
      if (e.target.id === 'receivePhotoAddBtn' || e.target.closest('#receivePhotoAddBtn')) {
        $('receivePhotoFile').click();
      }
    });

    // Complete modal
    $('completeClose').addEventListener('click', closeComplete);
    $('completeCancel').addEventListener('click', closeComplete);
    $('completeModal').addEventListener('click', (e) => { if (e.target.id === 'completeModal') closeComplete(); });
    $('completeFrm').addEventListener('submit', handleComplete);

    // 2 input split: thay doi -> tinh lai debt
    $('c_to_staff').addEventListener('input', syncSplit);
    $('c_to_admin').addEventListener('input', syncSplit);

    $('photoFile').addEventListener('change', handlePhotoAdd);
    $('photoGrid').addEventListener('click', (e) => {
      if (e.target.id === 'photoAddBtn' || e.target.closest('#photoAddBtn')) {
        $('photoFile').click();
      }
    });

    // Remit modal
    $('remitClose').addEventListener('click', closeRemit);
    $('remitCancel').addEventListener('click', closeRemit);
    $('remitModal').addEventListener('click', (e) => { if (e.target.id === 'remitModal') closeRemit(); });
    $('remitFrm').addEventListener('submit', handleRemitSubmit);
    $('r_receipt_file').addEventListener('change', handleReceiptUpload);

    load();

    setInterval(() => {
      if (document.hidden) return;
      if (document.querySelector('.modal-bg.open')) return;
      load({ silent: true });
    }, 3000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
