// Logic trang admin/debts — Cong no (Rolling Balance)
// 2 tab: Khach/Dai ly no | KTV giu tien
// Click khach -> modal chi tiet -> Tat toan -> redirect debt-settle.html

(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');
  const fmtVnd = (n) => fmt.format(Number(n) || 0) + 'đ';
  const escape = (s) => String(s == null ? '' : s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const fmtDate = (d) => d ? String(d).replace('T', ' ').slice(0, 10) : '—';

  const TYPE_PILL = {
    retail: '<span class="pill retail">Khách lẻ</span>',
    dealer: '<span class="pill dealer">Đại lý</span>',
  };

  const state = {
    tab: 'customers',
    type: 'all',
    q: '',
    qStaff: '',
    items: [],
    staffItems: [],
    selectedCustomer: null,
    settings: null, // app_settings (qr.* + bank.*)
    selectedQrSlot: null,
    receiptUrl: '',
    pendingRemits: [],
  };

  // ==== STAT ===================================================
  async function loadSummary() {
    const r = await api.get('/admin/debts/summary', { silent: true }).catch(() => null);
    if (!r) return;
    $('stTotal').textContent   = fmtVnd(r.total_receivable);
    $('stOverdue').textContent = `${r.overdue_customer_count} đối tượng`;
    $('stStaff').textContent   = fmtVnd(r.staff_holding);
    $('stMonth').textContent   = fmtVnd(r.collected_this_month);
  }

  // ==== TAB: KHACH/DAI LY ======================================
  async function loadCustomers() {
    const p = new URLSearchParams();
    if (state.type !== 'all') p.set('type', state.type);
    if (state.q) p.set('q', state.q);
    const r = await api.get('/admin/debts?' + p.toString(), { silent: true }).catch(() => null);
    if (!r) return;
    state.items = r.items;
    renderCustomers();
  }
  function renderCustomers() {
    const tb = $('tbCust');
    if (!state.items.length) {
      tb.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:24px">Chưa có khách nợ</td></tr>';
      return;
    }
    tb.innerHTML = state.items.map(it => {
      const overdue = it.is_overdue && it.days_overdue > 0
        ? `<span class="pill overdue">${it.days_overdue} ngày</span>`
        : (it.days_overdue > 0 ? `${it.days_overdue} ngày` : '—');
      const opening = it.opening_balance > 0
        ? `<span class="opening-balance">${fmtVnd(it.opening_balance)}</span>`
        : '<span class="text-muted">—</span>';
      const name = it.type === 'dealer' && it.company_name
        ? `<b>${escape(it.company_name)}</b><br><small class="text-muted">${escape(it.name)} · ${escape(it.phone || '')}</small>`
        : `<b>${escape(it.name)}</b><br><small class="text-muted">${escape(it.phone || '')}</small>`;
      return `
        <tr data-cid="${it.customer_id}">
          <td>${name}</td>
          <td>${TYPE_PILL[it.type] || it.type}</td>
          <td>${it.order_count} đơn</td>
          <td>${fmtDate(it.oldest_unpaid_at)}</td>
          <td>${overdue}</td>
          <td>${opening}</td>
          <td><b style="color:#dc2626">${fmtVnd(it.total_debt)}</b></td>
          <td>
            <div class="row" style="gap:4px;flex-wrap:wrap">
              <button class="btn ghost sm" data-act="orders" data-cid="${it.customer_id}" title="Xem nhanh các đơn đang nợ">Xem các đơn</button>
              <button class="btn ghost sm" data-act="detail" data-cid="${it.customer_id}">Xem &amp; tất toán</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  // ==== TAB: KTV ===============================================
  async function loadStaff() {
    const p = new URLSearchParams();
    if (state.qStaff) p.set('q', state.qStaff);
    const [r, pend] = await Promise.all([
      api.get('/admin/debts/staff?' + p.toString(), { silent: true }).catch(() => null),
      api.get('/admin/remittances?status=pending&limit=100', { silent: true }).catch(() => null),
    ]);
    if (r) { state.staffItems = r.items; renderStaff(); }
    const pendCount = pend && pend.items ? pend.items.length : 0;
    state.pendingRemits = (pend && pend.items) || [];
    $('pendingRemitCount').textContent = pendCount;
    $('pendingRemitBox').style.display = pendCount > 0 ? 'flex' : 'none';
  }
  function renderStaff() {
    const tb = $('tbStaff');
    if (!state.staffItems.length) {
      tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding:24px">KTV không giữ tiền nào</td></tr>';
      return;
    }
    tb.innerHTML = state.staffItems.map(it => {
      const days = it.days_holding >= 7
        ? `<span class="pill overdue">${it.days_holding} ngày</span>`
        : (it.days_holding > 0 ? `${it.days_holding} ngày` : '—');
      const opening = Number(it.opening_balance) || 0;
      const openingHtml = opening > 0
        ? `<br><small class="opening-balance">Nợ kỳ trước: ${fmtVnd(opening)}</small>`
        : (opening < 0 ? `<br><small style="color:#0a7a1f">Dư kỳ trước: ${fmtVnd(-opening)}</small>` : '');
      return `
        <tr>
          <td><b>${escape(it.name)}</b><br><small class="text-muted">${escape(it.username)} · ${escape(it.phone || '')}</small>${openingHtml}</td>
          <td>${escape(it.area || '—')}</td>
          <td>${it.collection_count}</td>
          <td>${fmtDate(it.oldest_at)}</td>
          <td>${days}</td>
          <td><b>${fmtVnd(it.total_amount)}</b></td>
          <td>
            <button class="btn ghost sm" data-act="settle-staff"
              data-tid="${it.staff_id}" data-name="${escape(it.name)}">Duyệt nộp</button>
            <a class="btn ghost sm" href="/admin/payroll.html?staff=${it.staff_id}" title="Xem bảng lương">💵 Lương</a>
          </td>
        </tr>`;
    }).join('');
  }

  // ==== TAB SWITCH =============================================
  function switchTab(t) {
    state.tab = t;
    document.querySelectorAll('.tabs button').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === t));
    $('tab-customers').style.display = (t === 'customers') ? '' : 'none';
    $('tab-staff').style.display     = (t === 'staff')     ? '' : 'none';
    if (t === 'staff') loadStaff();
    else loadCustomers();
  }

  // ==== HELPER: render don no (chi rows, caller tu wrap .order-list) ====
  function daysBetween(dateStr) {
    if (!dateStr) return 0;
    const d = new Date(String(dateStr).replace(' ', 'T'));
    if (isNaN(d)) return 0;
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
  }
  const STATUS_LABEL = {
    new:         { txt: 'Mới',        cls: 'st-new' },
    pending:     { txt: 'Chờ xác nhận', cls: 'st-new' },
    confirmed:   { txt: 'Đã xác nhận', cls: 'st-cf'  },
    assigned:    { txt: 'Đã giao KTV', cls: 'st-cf'  },
    in_progress: { txt: 'Đang xử lý',  cls: 'st-ip'  },
    done:        { txt: 'Hoàn tất',    cls: 'st-dn'  },
    cancelled:   { txt: 'Đã huỷ',      cls: 'st-cn'  },
  };
  function renderPendingOrderRows(orders) {
    return orders.map(o => {
      const total   = Number(o.total_amount) || 0;
      const paid    = Number(o.paid_amount) || 0;
      const hold    = Number(o.unremitted) || 0;
      const pend    = Number(o.admin_pending) || 0;
      const pctPaid = total ? Math.min(100, paid / total * 100) : 0;
      const pctHold = total ? Math.min(100 - pctPaid, hold / total * 100) : 0;
      const pctPend = total ? Math.min(100 - pctPaid - pctHold, pend / total * 100) : 0;
      const refDate = o.confirmed_at || o.created_at;
      const days    = daysBetween(refDate);
      const dateLbl = o.confirmed_at ? 'XN' : 'Tạo';
      const dateTxt = refDate ? `${dateLbl} ${fmtDate(refDate)}` : '—';
      const ageTxt  = days > 0 ? ` · ${days} ngày` : '';
      const overdue = days >= 7;
      const st      = STATUS_LABEL[o.status] || { txt: o.status || '—', cls: 'st-new' };
      const ktv     = o.assigned_staff_names ? escape(o.assigned_staff_names) : 'Chưa gán';
      const addr    = o.address ? escape(o.address) : '';
      const doneTxt = o.completed_at ? fmtDate(o.completed_at) : '';
      const tags = [
        paid > 0 ? `<span class="o-tag paid">✓ Đã trả ${fmtVnd(paid)}</span>` : '',
        hold > 0 ? `<span class="o-tag hold">KTV giữ ${fmtVnd(hold)}</span>` : '',
        pend > 0 ? `<span class="o-tag pend">Chờ XN ${fmtVnd(pend)}</span>` : '',
      ].filter(Boolean).join('');
      return `
        <a class="order-row" href="/admin/orders.html#order-${o.id}" target="_blank"
           title="Mở chi tiết đơn (tab mới)">
          <div class="o-head">
            <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap">
              <span class="o-code">${escape(o.code)} <span style="opacity:.5;font-weight:400">↗</span></span>
              <span class="o-tag ${st.cls}">${st.txt}</span>
            </div>
            <div class="o-amount">${fmtVnd(o.remaining)}</div>
          </div>
          <div class="o-meta-row">
            <span class="o-meta-item" title="Ngày ${o.confirmed_at ? 'xác nhận' : 'tạo'} đơn">📅 ${dateTxt}${ageTxt}${overdue ? ' <span style="color:#dc2626;font-weight:600">⏰ quá hạn</span>' : ''}</span>
            <span class="o-meta-item" title="KTV phụ trách">🔧 KTV: <b>${ktv}</b></span>
            ${o.item_count ? `<span class="o-meta-item">📦 ${o.item_count} mặt hàng</span>` : ''}
            ${doneTxt ? `<span class="o-meta-item" title="Ngày hoàn tất">✅ Xong ${doneTxt}</span>` : ''}
          </div>
          ${addr ? `<div class="o-meta-item" style="font-size:12.5px;color:#64748b" title="Địa chỉ lắp">📍 ${addr}</div>` : ''}
          <div class="progress-bar" title="Đã trả ${fmtVnd(paid)} / Tổng ${fmtVnd(total)}">
            <div class="pb-paid" style="width:${pctPaid}%"></div>
            <div class="pb-hold" style="left:${pctPaid}%;width:${pctHold}%"></div>
            <div class="pb-pend" style="left:${pctPaid + pctHold}%;width:${pctPend}%"></div>
          </div>
          <div class="o-meta">
            <span>Tổng <b style="color:#0f172a">${fmtVnd(total)}</b></span>
            ${tags}
          </div>
        </a>`;
    }).join('');
  }

  // ==== HELPER: render summary 3 the (orders/order_debt/total_debt) ====
  function renderDebtSummary(r, opts = {}) {
    const op = Number(r.opening_balance) || 0;
    const total = Number(r.total_debt) || 0;
    const totalLabel = total < 0 ? '🔻 Công ty đang nợ ngược' : '💰 Tổng nợ hiện tại';
    const cards = [
      `<div class="ds-card">
        <div class="ds-label">📋 Số đơn đang nợ</div>
        <div class="ds-value">${r.pending_orders.length}<span style="font-size:13px;color:#64748b;font-weight:500"> đơn</span></div>
      </div>`,
      `<div class="ds-card warn">
        <div class="ds-label">📉 Nợ phát sinh từ đơn</div>
        <div class="ds-value">${fmtVnd(r.order_debt)}</div>
      </div>`,
    ];
    if (opts.showOpening || op !== 0) {
      cards.push(`<div class="ds-card warn">
        <div class="ds-label">📅 Nợ kỳ trước (gối đầu)</div>
        <div class="ds-value">${fmtVnd(op)}</div>
      </div>`);
    }
    cards.push(`<div class="ds-card main">
      <div class="ds-label">${totalLabel}</div>
      <div class="ds-value">${fmtVnd(Math.abs(total))}</div>
    </div>`);
    const cls = cards.length === 4 ? 'cols-4' : '';
    return `<div class="debt-summary ${cls}">${cards.join('')}</div>`;
  }

  // ==== MODAL: chi xem danh sach don no =========================
  async function openOrdersListModal(customerId) {
    state.selectedCustomer = null;
    $('olTitle').textContent = 'Đang tải...';
    $('olBody').innerHTML = '<div class="text-center text-muted" style="padding:40px">Đang tải...</div>';
    $('ordersListModal').classList.add('open');

    const r = await api.get('/admin/debts/' + customerId).catch(() => null);
    if (!r) { $('ordersListModal').classList.remove('open'); return; }
    state.selectedCustomer = r;

    const c = r.customer;
    const titleName = c.type === 'dealer' && c.company_name
      ? `${c.company_name} (${c.full_name})` : c.full_name;
    $('olTitle').textContent = `Đơn đang nợ: ${titleName}`;

    let html = renderDebtSummary(r);

    if (r.pending_orders.length) {
      html += `<div class="section-title"><h4>📋 Đơn đang nợ (${r.pending_orders.length})</h4><small class="text-muted">Bấm để mở chi tiết đơn ↗</small></div>`;
      html += `<div class="order-list">${renderPendingOrderRows(r.pending_orders)}</div>`;
    } else {
      html += '<div class="text-center text-muted" style="padding:30px">Không có đơn đang nợ</div>';
    }

    $('olBody').innerHTML = html;
    $('olSettle').disabled = r.total_debt <= 0;
  }

  // ==== MODAL: chi tiet khach ==================================
  async function openCustModal(customerId) {
    state.selectedCustomer = null;
    $('cmTitle').textContent = 'Đang tải...';
    $('cmBody').innerHTML = '<div class="text-center text-muted" style="padding:40px">Đang tải...</div>';
    $('custModal').classList.add('open');

    const r = await api.get('/admin/debts/' + customerId).catch(() => null);
    if (!r) { $('custModal').classList.remove('open'); return; }
    state.selectedCustomer = r;

    const c = r.customer;
    const titleName = c.type === 'dealer' && c.company_name
      ? `${c.company_name} (${c.full_name})` : c.full_name;
    $('cmTitle').textContent = `Công nợ: ${titleName}`;

    let html = `
      <div class="grid cols-2" style="font-size:13.5px;margin-bottom:14px">
        <div><b>Mã:</b> ${escape(c.code)} · ${TYPE_PILL[c.type] || ''}</div>
        <div><b>SĐT:</b> ${escape(c.phone || '—')}</div>
        ${c.address ? `<div style="grid-column:1/-1"><b>Địa chỉ:</b> ${escape(c.address)}</div>` : ''}
        ${c.tax_code ? `<div><b>MST:</b> ${escape(c.tax_code)}</div>` : ''}
        ${c.credit_term_days ? `<div><b>Hạn thanh toán:</b> ${c.credit_term_days} ngày</div>` : ''}
      </div>
      `;
    html += renderDebtSummary(r, { showOpening: true });

    if (r.pending_orders.length) {
      html += `<div class="section-title"><h4>📋 Đơn đang nợ (${r.pending_orders.length})</h4><small class="text-muted">Bấm để mở chi tiết đơn ↗</small></div>`;
      html += `<div class="order-list">${renderPendingOrderRows(r.pending_orders)}</div>`;
    }

    if (r.history.length) {
      html += `<h4 style="margin:14px 0 8px;font-size:14px;color:#475569">Lịch sử tất toán (${r.history.length})</h4>`;
      for (const h of r.history.slice(0, 10)) {
        html += `<div class="history-row">
          <span><b>${escape(h.code)}</b> · ${fmtDate(h.paid_at)}</span>
          <span>Trả <b>${fmtVnd(h.amount_paid)}</b> / Nợ ${fmtVnd(h.total_debt)}${h.remaining > 0 ? ` · còn ${fmtVnd(h.remaining)}` : ''}</span>
        </div>`;
      }
    }

    $('cmBody').innerHTML = html;
    $('cmSettle').disabled = r.total_debt <= 0;
  }

  // ==== MODAL: form tat toan khach =============================
  async function openSettleModal() {
    const r = state.selectedCustomer;
    if (!r) return;
    $('smOpening').textContent   = fmtVnd(r.opening_balance);
    $('smOrderDebt').textContent = fmtVnd(r.order_debt);
    $('smTotalDebt').textContent = fmtVnd(r.total_debt);
    Money.set($('smAmount'), Math.max(0, r.total_debt)); // mac dinh tat toan toan bo
    $('smMethod').value = 'cash';
    $('smNote').value = '';
    $('smReceipt').value = '';
    $('smReceiptPrev').style.display = 'none';
    state.receiptUrl = '';

    // Hien danh sach don dang no de khach thay ro tra cho don nao
    const orders = r.pending_orders || [];
    if (orders.length) {
      $('smOrdersBlock').style.display = '';
      $('smOrdersCount').textContent = `(${orders.length} đơn — trừ từ cũ → mới)`;
      $('smOrdersList').innerHTML = renderPendingOrderRows(orders);
    } else {
      $('smOrdersBlock').style.display = 'none';
    }

    if (!state.settings) {
      state.settings = await api.get('/admin/settings', { silent: true }).catch(() => ({}));
    }
    const defaultSlot = Number(state.settings['bank.default_qr_slot']) || 1;
    state.selectedQrSlot = defaultSlot;
    renderQrGrid();

    $('settleModal').classList.add('open');
  }
  function renderQrGrid() {
    const grid = $('smQrGrid');
    let html = '';
    for (let i = 1; i <= 5; i++) {
      const url = state.settings[`qr.slot${i}.image_url`] || '';
      const label = state.settings[`qr.slot${i}.label`] || ('Slot ' + i);
      const empty = !url;
      const sel = state.selectedQrSlot === i && !empty ? 'selected' : '';
      const klass = empty ? 'qr-pick empty' : `qr-pick ${sel}`;
      html += `<div class="${klass}" data-slot="${i}" ${empty ? 'title="Chưa cấu hình"' : ''}>
        ${empty ? '<div style="aspect-ratio:1;display:grid;place-items:center">trống</div>'
                : `<img src="${escape(url)}" alt="${escape(label)}">`}
        <div class="qr-label">${escape(label)}</div>
      </div>`;
    }
    grid.innerHTML = html;
  }

  async function submitSettle() {
    const amount = Money.get($('smAmount'));
    if (!amount || amount <= 0) return ui.toast('Nhập số tiền > 0', 'warning');
    const r = state.selectedCustomer;
    if (amount > r.total_debt * 1.1) {
      const ok = await ui.confirm({ title: 'Số tiền lớn hơn tổng nợ', type: 'warning',
        message: `Khách trả ${fmtVnd(amount)} nhưng tổng nợ chỉ ${fmtVnd(r.total_debt)}. Vẫn tiếp tục?` });
      if (!ok) return;
    }

    $('smSubmit').disabled = true;
    try {
      const body = {
        amount_paid: amount,
        qr_slot: state.selectedQrSlot,
        pay_method: $('smMethod').value,
        note: $('smNote').value.trim(),
      };
      if (state.receiptUrl) body.receipt_url = state.receiptUrl;
      const res = await api.post(`/admin/debts/${r.customer.id}/settle`, body, {
        loading: true, successMessage: 'Đã tạo phiếu tất toán'
      }).catch(() => null);
      if (!res) return;
      // Redirect sang trang in bill
      location.href = `/admin/debt-settle.html?id=${res.settlement_id}`;
    } finally {
      $('smSubmit').disabled = false;
    }
  }

  // ==== MODAL: duyet nop KTV (Rolling Balance) =================
  async function openStaffSettleModal(btn) {
    const tid = btn.dataset.tid;
    const name = btn.dataset.name;
    $('ssBody').innerHTML = '<div class="text-center text-muted" style="padding:40px">Đang tải...</div>';
    $('staffSettleModal').classList.add('open');

    const r = await api.get(`/admin/debts/staff/${tid}`).catch(() => null);
    if (!r) { $('staffSettleModal').classList.remove('open'); return; }

    const opening = Number(r.opening_balance) || 0;
    const holding = Number(r.holding_amount) || 0;
    const total   = Number(r.total_to_collect) || 0;

    const openingRow = opening !== 0
      ? `<div class="row"><span>${opening > 0 ? 'Nợ kỳ trước:' : 'Dư kỳ trước:'}</span>
           <span class="${opening > 0 ? 'opening-balance' : ''}" ${opening < 0 ? 'style="color:#0a7a1f"' : ''}>${fmtVnd(Math.abs(opening))}</span></div>`
      : '';

    const colsHtml = r.collections.length ? r.collections.map(c => `
      <div class="order-row">
        <div class="o-info">
          <div><b>${escape(c.order_code || '—')}</b> · <span class="text-muted">${fmtDate(c.collected_at)}</span></div>
          <small class="text-muted">${c.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</small>
        </div>
        <div class="o-amount" style="color:#1f6feb">${fmtVnd(c.amount)}</div>
      </div>`).join('') : '<div class="text-center text-muted" style="padding:20px">Không có khoản đang giữ</div>';

    $('ssBody').innerHTML = `
      <p style="margin:0 0 10px">KTV: <b>${escape(name)}</b></p>
      <div class="summary-box">
        ${openingRow}
        <div class="row"><span>Đang giữ (${r.collections.length} khoản):</span><span>${fmtVnd(holding)}</span></div>
        <div class="row total"><span>Tổng phải nộp:</span><span>${fmtVnd(total)}</span></div>
      </div>
      ${r.collections.length ? `
      <div class="pending-orders-block">
        <h4>Khoản đang giữ <small class="text-muted">(sẽ đánh dấu đã nộp khi duyệt)</small></h4>
        <div class="order-list">${colsHtml}</div>
      </div>` : ''}
      <div class="grid cols-2">
        <div class="field">
          <label>Số tiền KTV nộp *</label>
          <input type="number" id="ssAmount" class="input" min="0" step="1000" value="${total}">
          <p class="help">Phần thiếu/dư chuyển sang kỳ sau</p>
        </div>
        <div class="field">
          <label>Hình thức KTV nộp</label>
          <select id="ssMethod" class="select">
            <option value="cash">Tiền mặt</option>
            <option value="transfer">Chuyển khoản</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Ghi chú</label>
        <input id="ssNote" class="input" placeholder="(tuỳ chọn)">
      </div>`;
    $('ssSubmit').dataset.tid = tid;
    $('ssSubmit').dataset.total = String(total);
  }
  async function submitStaffSettle() {
    const tid = $('ssSubmit').dataset.tid;
    const total = Number($('ssSubmit').dataset.total) || 0;
    const amount = Number($('ssAmount').value);
    if (!amount || amount <= 0) return ui.toast('Nhập số tiền > 0', 'warning');
    if (amount > total * 1.1) {
      const ok = await ui.confirm({ title: 'Số tiền lớn hơn tổng phải nộp', type: 'warning',
        message: `KTV nộp ${fmtVnd(amount)} nhưng tổng chỉ ${fmtVnd(total)}. Vẫn tiếp tục?` });
      if (!ok) return;
    }
    const method = $('ssMethod').value;
    const note = $('ssNote').value.trim();
    $('ssSubmit').disabled = true;
    try {
      const res = await api.post(`/admin/debts/staff/${tid}/settle`,
        { amount_paid: amount, method, note },
        { loading: true, successMessage: 'Đã ghi nhận lô nộp' }).catch(() => null);
      if (!res) return;
      $('staffSettleModal').classList.remove('open');
      loadStaff();
      loadSummary();
      adminShell.refreshNotifications();
    } finally {
      $('ssSubmit').disabled = false;
    }
  }

  // ==== MODAL: lo KTV cho duyet ================================
  function openPendingRemitModal() {
    const list = state.pendingRemits || [];
    if (!list.length) {
      $('prBody').innerHTML = '<div class="text-center text-muted" style="padding:30px">Không có lô chờ duyệt</div>';
    } else {
      $('prBody').innerHTML = list.map(r => `
        <div class="history-row" style="flex-direction:column;align-items:stretch;gap:6px;padding:12px">
          <div style="display:flex;justify-content:space-between;gap:8px">
            <div>
              <b>${escape(r.staff_name)}</b> · <small class="text-muted">${escape(r.staff_username || '')}</small><br>
              <small class="text-muted">${fmtDate(r.remitted_at)} · ${r.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'} · ${r.collection_count} khoản</small>
            </div>
            <div style="text-align:right">
              <b style="color:#1f6feb">${fmtVnd(r.amount)}</b>
              ${r.receipt_url ? `<br><a href="${escape(r.receipt_url)}" target="_blank" style="font-size:12px">Xem biên lai</a>` : ''}
            </div>
          </div>
          ${r.note ? `<div style="font-size:13px;color:#475569">📝 ${escape(r.note)}</div>` : ''}
          <div style="display:flex;gap:6px;justify-content:flex-end">
            <button class="btn ghost sm" data-pact="reject" data-rid="${r.id}">Từ chối</button>
            <button class="btn sm" data-pact="approve" data-rid="${r.id}">Duyệt</button>
          </div>
        </div>`).join('');
    }
    $('pendingRemitModal').classList.add('open');
  }
  async function approveRemit(id) {
    const r = await api.patch(`/admin/remittances/${id}/approve`, {},
      { successMessage: 'Đã duyệt lô' }).catch(() => null);
    if (!r) return;
    loadStaff();
    loadSummary();
    adminShell.refreshNotifications();
    // Re-render modal
    state.pendingRemits = (state.pendingRemits || []).filter(x => x.id !== Number(id));
    openPendingRemitModal();
  }
  async function rejectRemit(id) {
    const reason = prompt('Lý do từ chối (tuỳ chọn):', '') || '';
    const r = await api.patch(`/admin/remittances/${id}/reject`, { reason },
      { successMessage: 'Đã từ chối lô' }).catch(() => null);
    if (!r) return;
    loadStaff();
    loadSummary();
    adminShell.refreshNotifications();
    state.pendingRemits = (state.pendingRemits || []).filter(x => x.id !== Number(id));
    openPendingRemitModal();
  }

  // ==== EVENTS =================================================
  document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => switchTab(b.dataset.tab));
  $('fType').onchange = () => { state.type = $('fType').value; loadCustomers(); };
  let qTimer = null;
  $('fQ').oninput = () => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { state.q = $('fQ').value.trim(); loadCustomers(); }, 300);
  };
  let qsTimer = null;
  $('fQStaff').oninput = () => {
    clearTimeout(qsTimer);
    qsTimer = setTimeout(() => { state.qStaff = $('fQStaff').value.trim(); loadStaff(); }, 300);
  };

  document.body.addEventListener('click', (e) => {
    const orders = e.target.closest('button[data-act="orders"]');
    if (orders) return openOrdersListModal(orders.dataset.cid);
    const detail = e.target.closest('button[data-act="detail"]');
    if (detail) return openCustModal(detail.dataset.cid);
    const settleStaff = e.target.closest('button[data-act="settle-staff"]');
    if (settleStaff) return openStaffSettleModal(settleStaff);
    const qrPick = e.target.closest('.qr-pick:not(.empty)');
    if (qrPick) {
      state.selectedQrSlot = Number(qrPick.dataset.slot);
      renderQrGrid();
    }
    const pact = e.target.closest('button[data-pact]');
    if (pact) {
      const id = Number(pact.dataset.rid);
      if (pact.dataset.pact === 'approve') return approveRemit(id);
      if (pact.dataset.pact === 'reject')  return rejectRemit(id);
    }
    // Toggle help-box: tim trong cung modal voi data-help-for=<key>
    const helpBtn = e.target.closest('.modal-help-btn');
    if (helpBtn) {
      const key = helpBtn.dataset.help;
      const modal = helpBtn.closest('.modal');
      const box = modal && modal.querySelector(`.help-box[data-help-for="${key}"]`);
      if (box) {
        const isHidden = box.hasAttribute('hidden');
        if (isHidden) box.removeAttribute('hidden'); else box.setAttribute('hidden', '');
        helpBtn.classList.toggle('active', isHidden);
      }
      return;
    }
  });

  $('cmClose').onclick    = () => $('custModal').classList.remove('open');
  $('cmCloseBtn').onclick = () => $('custModal').classList.remove('open');
  $('cmSettle').onclick   = () => { $('custModal').classList.remove('open'); openSettleModal(); };

  $('olClose').onclick    = () => $('ordersListModal').classList.remove('open');
  $('olCloseBtn').onclick = () => $('ordersListModal').classList.remove('open');
  $('olSettle').onclick   = () => { $('ordersListModal').classList.remove('open'); openSettleModal(); };

  $('smClose').onclick  = () => $('settleModal').classList.remove('open');
  $('smCancel').onclick = () => $('settleModal').classList.remove('open');
  $('smSubmit').onclick = submitSettle;

  $('ssClose').onclick  = () => $('staffSettleModal').classList.remove('open');
  $('ssCancel').onclick = () => $('staffSettleModal').classList.remove('open');
  $('ssSubmit').onclick = submitStaffSettle;

  $('btnViewPending').onclick = openPendingRemitModal;
  $('prClose').onclick    = () => $('pendingRemitModal').classList.remove('open');
  $('prCloseBtn').onclick = () => $('pendingRemitModal').classList.remove('open');

  $('smReceipt').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      ui.loading(true);
      const url = await imgbb.upload(file, { name: 'debt-receipt' });
      state.receiptUrl = url;
      $('smReceiptImg').src = url;
      $('smReceiptPrev').style.display = '';
    } catch (err) {
      ui.toast('Lỗi upload: ' + err.message, 'error');
    } finally {
      ui.loading(false);
    }
  };
  $('smReceiptClear').onclick = () => {
    state.receiptUrl = '';
    $('smReceipt').value = '';
    $('smReceiptPrev').style.display = 'none';
  };

  // ==== INIT ===================================================
  adminShell.init('debts');
  loadSummary();
  loadCustomers();
})();
