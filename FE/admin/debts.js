// Logic trang admin/debts — Cong no (Rolling Balance)
// 3 tab: Khach/Dai ly no | Phieu YC- | KTV giu tien

(function () {
  const $ = (id) => document.getElementById(id);
  const IS_ADMIN = (window.auth && auth.isAdmin && auth.isAdmin()) || false;
  const fmt = new Intl.NumberFormat('vi-VN');
  const fmtVnd = (n) => fmt.format(Number(n) || 0) + 'đ';
  const escape = (s) => String(s == null ? '' : s)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
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
    pendingRemits: [],
    custPage: 1,
    custPerPage: 10,
    reqPage: 1,
    reqPerPage: 10,
    staffPage: 1,
    staffPerPage: 10,
  };

  // ── Avatar helper ───────────────────────────────────────────────
  const AV_COLORS = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#f97316'];
  function avatarHtml(name, type, avatarUrl) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
    const bg = AV_COLORS[h % AV_COLORS.length];
    let ini;
    if (type === 'dealer') {
      ini = name.replace(/^(công ty|cty|tnhh|cổ phần)\s*/i, '').slice(0, 2).toUpperCase();
    } else {
      const parts = name.trim().split(/\s+/);
      ini = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
    }
    if (avatarUrl) {
      return `<img src="${avatarUrl}" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;display:block" onerror="this.onerror=null;this.insertAdjacentHTML('afterend','<div class=&quot;cust-av&quot; style=&quot;background:${bg}&quot;>${escape(ini)}</div>');this.remove()">`;
    }
    return `<div class="cust-av" style="background:${bg}">${escape(ini)}</div>`;
  }

  // ==== STAT ===================================================
  async function loadSummary() {
    const r = await api.get('/admin/debts/summary', { silent: true }).catch(() => null);
    if (!r) return;
    $('stTotal').textContent   = fmtVnd(r.total_receivable);
    $('stDebtors').textContent = `${r.debtor_count} đối tượng`;
    $('stStaff').textContent   = fmtVnd(r.staff_holding);
    $('stUnpaid').textContent  = `${r.unpaid_order_count} đơn`;
  }

  // ==== TAB: KHACH/DAI LY ======================================
  async function loadCustomers() {
    const p = new URLSearchParams();
    if (state.type !== 'all') p.set('type', state.type);
    if (state.q) p.set('q', state.q);
    const r = await api.get('/admin/debts?' + p.toString(), { silent: true }).catch(() => null);
    if (!r) return;
    state.items = r.items;
    state.custPage = 1;
    renderCustomers();
  }
  function renderCustomers() {
    const debtFilter = $('fDebtType') ? $('fDebtType').value : 'all';
    let items = state.items;
    if (debtFilter === 'order')   items = items.filter(it => Number(it.order_debt) > 0);
    if (debtFilter === 'pr')      items = items.filter(it => Number(it.pr_debt) > 0);
    if (debtFilter === 'overdue') items = items.filter(it => it.is_overdue);

    const total = items.length;
    const perPage = state.custPerPage;
    const page = state.custPage;
    const startIdx = (page - 1) * perPage;
    const pageItems = items.slice(startIdx, startIdx + perPage);

    const tb = $('tbCust');
    if (!total) {
      tb.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding:24px">Chưa có khách nợ</td></tr>';
      renderPager('custPager', 0, 1, state.custPerPage, () => {}, () => {});
      return;
    }
    tb.innerHTML = pageItems.map(it => {
      const displayName = it.type === 'dealer' && it.company_name ? it.company_name : it.name;
      const av = avatarHtml(displayName, it.type, it.avatar_url);
      const nameHtml = it.type === 'dealer' && it.company_name
        ? `<b>${escape(it.company_name)}</b><br><small class="text-muted">${escape(it.name)} · ${escape(it.phone || '')}</small>`
        : `<b>${escape(it.name)}</b><br><small class="text-muted">${escape(it.phone || '')}</small>`;
      const orderDebtAmt = Number(it.order_debt) || 0;
      const orderDebt = orderDebtAmt > 0
        ? `<b style="color:#dc2626">${fmtVnd(orderDebtAmt)}</b>`
        : '<span class="text-muted">—</span>';
      return `
        <tr data-cid="${it.customer_id}">
          <td data-label="Khách"><div class="cust-av-wrap">${av}<div>${nameHtml}</div></div></td>
          <td data-label="Loại">${TYPE_PILL[it.type] || it.type}</td>
          <td data-label="Số đơn">${it.order_count} đơn</td>
          <td data-label="Nợ từ đơn">${orderDebt}</td>
          <td data-label="Tổng nợ"><b style="color:#dc2626">${fmtVnd(it.total_debt)}</b></td>
          <td data-label="Hành động">
            <div class="row" style="gap:6px;flex-wrap:wrap">
              <button class="btn ghost sm" data-act="orders" data-cid="${it.customer_id}" title="Xem nhanh các đơn đang nợ">👁 Xem đơn</button>
              <button class="btn sm" data-act="detail" data-cid="${it.customer_id}">👁 Xem &amp; tất toán</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    renderPager('custPager', total, page, perPage,
      pg => { state.custPage = pg; renderCustomers(); },
      pp => { state.custPerPage = pp; state.custPage = 1; renderCustomers(); }
    );
  }

  // ── Pager dùng chung ─────────────────────────────────────────────
  function renderPager(elId, total, page, perPage, onPageChange, onPerChange) {
    const el = $(elId);
    if (!el) return;
    const totalPages = Math.ceil(total / perPage);
    const selId = elId + 'PerSel';

    const perSel = `<select class="pager-per" id="${selId}">
      ${[10, 25, 50].map(n => `<option value="${n}"${n === perPage ? ' selected' : ''}>${n}</option>`).join('')}
    </select>`;

    if (!total) { el.innerHTML = `<span class="pager-info">Không có kết quả</span>`; return; }

    const W = 2;
    let pages = '';
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - W && i <= page + W)) {
        pages += `<button class="pager-btn${i === page ? ' active' : ''}" data-pg="${i}">${i}</button>`;
      } else if (i === page - W - 1 || i === page + W + 1) {
        pages += `<span style="padding:0 4px;color:#94a3b8">…</span>`;
      }
    }

    el.innerHTML = `
      <span class="pager-info">Hiển thị ${perSel} · Tổng ${total} kết quả</span>
      <button class="pager-btn" data-pg="${page - 1}" ${page <= 1 ? 'disabled' : ''}>‹</button>
      ${pages}
      <button class="pager-btn" data-pg="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>›</button>`;

    el.querySelector('#' + selId).onchange = e => onPerChange(Number(e.target.value));
    el.querySelectorAll('button[data-pg]').forEach(btn => {
      btn.onclick = () => {
        const pg = Number(btn.dataset.pg);
        if (pg >= 1 && pg <= totalPages) onPageChange(pg);
      };
    });
  }

  // ==== TAB: KTV ===============================================
  async function loadStaff() {
    const p = new URLSearchParams();
    if (state.qStaff) p.set('q', state.qStaff);
    const area = ($('fStaffArea') ? $('fStaffArea').value : '').trim();
    if (area) p.set('area', area);
    const [r, pend] = await Promise.all([
      api.get('/admin/debts/staff?' + p.toString(), { silent: true }).catch(() => null),
      api.get('/admin/remittances?status=pending&limit=100', { silent: true }).catch(() => null),
    ]);
    if (r) { state.staffItems = r.items; state.staffPage = 1; renderStaff(); }
    const pendCount = pend && pend.items ? pend.items.length : 0;
    state.pendingRemits = (pend && pend.items) || [];
    $('pendingRemitCount').textContent = pendCount;
    $('pendingRemitBox').style.display = pendCount > 0 ? 'flex' : 'none';
  }
  function renderStaff() {
    const minDays = $('fStaffDays') ? Number($('fStaffDays').value) || 0 : 0;
    const filtered = minDays > 0 ? state.staffItems.filter(it => it.days_holding >= minDays) : state.staffItems;
    const total = filtered.length;
    const tb = $('tbStaff');
    if (!total) {
      tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding:24px">KTV không giữ tiền nào</td></tr>';
      renderPager('staffPager', 0, 1, state.staffPerPage, () => {}, () => {});
      return;
    }
    const page = state.staffPage;
    const perPage = state.staffPerPage;
    const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

    tb.innerHTML = pageItems.map(it => {
      const av = avatarHtml(it.name, 'staff', it.avatar_url);
      const days = it.days_holding >= 7
        ? `<span class="pill overdue">${it.days_holding} ngày</span>`
        : (it.days_holding > 0 ? `${it.days_holding} ngày` : '—');
      const opening = Number(it.opening_balance) || 0;
      const openingHtml = opening > 0
        ? `<br><small class="opening-balance">Nợ kỳ trước: ${fmtVnd(opening)}</small>`
        : (opening < 0 ? `<br><small style="color:#0a7a1f">Dư kỳ trước: ${fmtVnd(-opening)}</small>` : '');
      return `
        <tr>
          <td data-label="KTV">
            <div class="cust-av-wrap">
              ${av}
              <div><b>${escape(it.name)}</b><br><small class="text-muted">${escape(it.username)} · ${escape(it.phone || '')}</small>${openingHtml}</div>
            </div>
          </td>
          <td data-label="Khu vực">${escape(it.area || '—')}</td>
          <td data-label="Số khoản">${it.collection_count}</td>
          <td data-label="Sớm nhất">${fmtDate(it.oldest_at)}</td>
          <td data-label="Số ngày giữ">${days}</td>
          <td data-label="Tổng tiền"><b>${fmtVnd(it.total_amount)}</b></td>
          <td data-label="Hành động">
            <div class="row" style="gap:5px;flex-wrap:wrap">
              ${IS_ADMIN ? `<button class="btn sm" data-act="settle-staff" data-tid="${it.staff_id}" data-name="${escape(it.name)}">✅ Duyệt nộp</button>` : ''}
              <a class="btn ghost sm" href="/admin/payroll.html?staff=${it.staff_id}" title="Xem bảng lương">💵 Lương</a>
            </div>
          </td>
        </tr>`;
    }).join('');

    renderPager('staffPager', total, page, perPage,
      pg => { state.staffPage = pg; renderStaff(); },
      pp => { state.staffPerPage = pp; state.staffPage = 1; renderStaff(); }
    );
  }

  // ==== TAB SWITCH =============================================
  function switchTab(t) {
    state.tab = t;
    document.querySelectorAll('.tabs button').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === t));
    $('tab-customers').style.display = (t === 'customers') ? '' : 'none';
    $('tab-requests').style.display  = (t === 'requests')  ? '' : 'none';
    $('tab-staff').style.display     = (t === 'staff')     ? '' : 'none';
    
    if (t === 'staff') loadStaff();
    else if (t === 'requests') loadRequests();
    else loadCustomers();
  }

  // ==== TAB: PHIEU YEU CAU =====================================
  async function loadRequests() {
    const status = $('fReqStatus').value;
    const q = ($('fReqQ') ? $('fReqQ').value.trim() : '');
    const from = $('fReqFrom') ? $('fReqFrom').value : '';
    const to   = $('fReqTo')   ? $('fReqTo').value   : '';
    const hasRemain = $('fReqHasRemain') && $('fReqHasRemain').checked;
    const p = new URLSearchParams({ status });
    if (q)         p.set('q', q);
    if (from)      p.set('date_from', from);
    if (to)        p.set('date_to', to);
    if (hasRemain) p.set('has_remaining', '1');
    const r = await api.get('/admin/payment-requests?' + p.toString(), { silent: true }).catch(() => null);
    if (!r) return;
    state.requests = r.items || [];
    state.reqPage = 1;
    renderRequests();
  }
  
  function renderRequests() {
    const tb = $('tbRequests');
    const total = (state.requests || []).length;
    if (!total) {
      tb.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:24px">Không có phiếu yêu cầu nào</td></tr>';
      renderPager('reqPager', 0, 1, state.reqPerPage, () => {}, () => {});
      return;
    }
    const page = state.reqPage;
    const perPage = state.reqPerPage;
    const pageItems = state.requests.slice((page - 1) * perPage, page * perPage);

    tb.innerHTML = pageItems.map(it => {
      const custName = it.customer_name || '—';
      const av = it.customer_name ? avatarHtml(custName, it.customer_type || 'retail', it.customer_avatar_url) : '';
      const phone = it.customer_phone ? `<br><small class="text-muted">${escape(it.customer_phone)}</small>` : '';
      const nameHtml = it.customer_name
        ? `<b>${escape(it.customer_name)}</b><br><small class="text-muted">${escape(it.customer_code || '')}</small>${phone}`
        : '—';
      const name = it.customer_name
        ? `<div class="cust-av-wrap">${av}<div>${nameHtml}</div></div>`
        : '—';

      const stPill = it.status === 'pending'
        ? '<span class="pill overdue">Chờ thanh toán</span>'
        : it.status === 'partially_paid'
        ? '<span class="pill" style="background:#fed7aa;color:#c2410c">Đang thu</span>'
        : it.status === 'paid'
        ? '<span class="pill tech" style="background:#dcfce7;color:#166534">Đã thanh toán</span>'
        : '<span class="pill" style="background:#e2e8f0;color:#475569">Đã huỷ</span>';

      const isActive = it.status === 'pending' || it.status === 'partially_paid';
      const canCancel = isActive && Number(it.paid_amount) === 0;
      let actionHtml = `<button class="btn ghost sm" onclick="copyPayLink(${it.id})" title="Copy link thanh toán">📋 Copy</button>`;
      if (isActive && IS_ADMIN) {
        actionHtml += `<button class="btn sm" data-act="pay-request" data-rid="${it.id}">💰 Nhận tiền</button>`;
      }
      if (canCancel) {
        actionHtml += `<button class="btn ghost sm" style="color:#dc2626;border-color:#fecaca" data-act="cancel-request" data-rid="${it.id}" title="Huỷ phiếu (chưa thu tiền)">Huỷ</button>`;
      }

      return `
        <tr style="cursor:pointer" onclick="if(!event.target.closest('button')&&!event.target.closest('a'))window.open('/admin/payment-request-detail.html?id=${it.id}','_blank')">
          <td data-label="Mã phiếu"><a href="/admin/payment-request-detail.html?id=${it.id}" target="_blank" style="color:#2563eb;font-weight:700;text-decoration:none">${escape(it.code)}</a><br><small class="text-muted">${it.order_count || 0} đơn</small></td>
          <td data-label="Khách hàng">${name}</td>
          <td data-label="Ngày lập">${fmtDate(it.created_at)}</td>
          <td data-label="Tổng tiền"><b>${fmtVnd(it.total_amount)}</b></td>
          <td data-label="Đã thu" style="color:#166534">${fmtVnd(it.paid_amount)}</td>
          <td data-label="Còn nợ" style="color:#dc2626;font-weight:700">${fmtVnd(it.remaining)}</td>
          <td data-label="Trạng thái">${stPill}</td>
          <td data-label="Hành động"><div style="display:flex;flex-wrap:wrap;gap:5px">${actionHtml}</div></td>
        </tr>`;
    }).join('');

    renderPager('reqPager', total, page, perPage,
      pg => { state.reqPage = pg; renderRequests(); },
      pp => { state.reqPerPage = pp; state.reqPage = 1; renderRequests(); }
    );
  }
  
  if ($('fReqStatus')) $('fReqStatus').onchange = () => { state.reqPage = 1; loadRequests(); };

  // ==== THU TIEN PHIEU YEU CAU =================================
  function openPayRequestModal(btn) {
    const rid = Number(btn.dataset.rid);
    const pr = state.requests.find(x => x.id === rid);
    if (!pr) return;
    state.selectedRequest = pr;
    
    $('prqmCode').textContent = pr.code;
    $('prqmTotal').textContent = fmtVnd(pr.total_amount);

    const paidAmt = Number(pr.paid_amount) || 0;
    const remainAmt = Number(pr.remaining) ?? (pr.total_amount - paidAmt);
    if (paidAmt > 0) {
      $('prqmPaid').textContent = fmtVnd(paidAmt);
      $('prqmRemain').textContent = fmtVnd(remainAmt);
      $('prqmPaidRow').style.display = '';
      $('prqmRemainRow').style.display = '';
    } else {
      $('prqmPaidRow').style.display = 'none';
      $('prqmRemainRow').style.display = 'none';
    }

    Money.set($('prqmAmount'), remainAmt);
    $('prqmAmount').readOnly = true;
    $('prqmAmountHelp').textContent = 'Tự động bằng số tiền còn lại';
    document.querySelector('input[name="prqPayMode"][value="full"]').checked = true;
    $('prqmMethod').value = 'cash';
    $('prqmNote').value = '';
    
    $('payRequestModal').classList.add('open');
  }
  
  if ($('prqmClose')) {
    $('prqmClose').onclick = () => $('payRequestModal').classList.remove('open');
    $('prqmCancel').onclick = () => $('payRequestModal').classList.remove('open');
    
    document.querySelectorAll('input[name="prqPayMode"]').forEach(r => {
      r.onchange = () => {
        const isFull = document.querySelector('input[name="prqPayMode"]:checked').value === 'full';
        const pr = state.selectedRequest;
        const remain = pr ? (Number(pr.remaining) || Number(pr.total_amount) || 0) : 0;
        if (isFull) {
          $('prqmAmount').readOnly = true;
          Money.set($('prqmAmount'), remain);
          $('prqmAmountHelp').textContent = 'Tự động bằng số tiền còn lại';
        } else {
          $('prqmAmount').readOnly = false;
          Money.set($('prqmAmount'), 0);
          $('prqmAmountHelp').textContent = 'Phần thiếu sẽ lưu thành nợ của phiếu này';
          $('prqmAmount').focus();
        }
      };
    });
    
    $('prqmSubmit').onclick = async () => {
      const pr = state.selectedRequest;
      if (!pr) return;
      const amount = Money.get($('prqmAmount'));
      if (!amount || amount <= 0) return ui.toast('Nhập số tiền > 0', 'warning');
      const remain = Number(pr.remaining) || Number(pr.total_amount) || 0;
      if (amount > remain * 1.1) {
        const ok = await ui.confirm({ title: 'Xác nhận số tiền', type: 'warning', message: `Khách trả ${fmtVnd(amount)} nhưng còn lại chỉ ${fmtVnd(remain)}. Bạn có chắc?` });
        if (!ok) return;
      }

      $('prqmSubmit').disabled = true;
      try {
        const body = {
          amount_paid: amount,
          pay_method: $('prqmMethod').value,
          note: $('prqmNote').value.trim()
        };
        const res = await api.post(`/admin/payment-requests/${pr.id}/pay`, body, {
          loading: true
        }).catch(() => null);
        if (!res) return;

        $('payRequestModal').classList.remove('open');
        loadRequests();
        loadSummary();
        loadCustomers();

        // Hiện link xem & in Hóa Đơn
        if (res.receipt_id) {
          const receiptUrl = `/admin/payment-receipt.html?id=${res.receipt_id}`;
          ui.toast(
            `Thu tiền thành công! Mã hóa đơn: <b>${escape(res.receipt_code || '')}</b> — <a href="${receiptUrl}" target="_blank" style="color:#1d4ed8;font-weight:600">Xem & In HD →</a>`,
            'success',
            8000
          );
        } else {
          ui.toast('Thu tiền thành công!', 'success');
        }
      } finally {
        $('prqmSubmit').disabled = false;
      }
    };
  }

  async function cancelPaymentRequest(id) {
    const ok = await ui.confirm({
      title: 'Xác nhận huỷ phiếu',
      type: 'danger',
      message: 'Bạn có chắc chắn muốn huỷ phiếu yêu cầu thanh toán này không? Phiếu đã huỷ sẽ biến mất khỏi danh sách mặc định.'
    });
    if (!ok) return;

    const res = await api.post(`/admin/payment-requests/${id}/cancel`, {}, {
      loading: true, successMessage: 'Đã huỷ phiếu thành công!'
    }).catch(() => null);
    
    if (res) {
      loadRequests();
    }
  }

  // ==== HELPER: COPY LINK =====================================
  window.copyPayLink = (id) => {
    const url = window.location.origin + '/admin/payment-request-detail.html?id=' + id;
    navigator.clipboard.writeText(url).then(() => {
      ui.toast('Đã copy link thanh toán', 'success');
    }).catch(() => {
      ui.toast('Không copy được link', 'error');
    });
  };

  // ==== HELPER: render don no (chi rows, caller tu wrap .order-list) ====
  function daysBetween(dateStr) {
    if (!dateStr) return 0;
    const d = new Date(String(dateStr).replace(' ', 'T'));
    if (isNaN(d)) return 0;
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
  }
  const STATUS_LABEL = {
    new: { txt: 'Mới', cls: 'st-new' },
    pending: { txt: 'Chờ xác nhận', cls: 'st-new' },
    confirmed: { txt: 'Đã xác nhận', cls: 'st-cf' },
    assigned: { txt: 'Đã giao KTV', cls: 'st-cf' },
    in_progress: { txt: 'Đang xử lý', cls: 'st-ip' },
    done: { txt: 'Hoàn tất', cls: 'st-dn' },
    cancelled: { txt: 'Đã huỷ', cls: 'st-cn' },
  };
  function renderPendingOrderRows(orders) {
    return orders.map(o => {
      const total  = Number(o.total_amount) || 0;
      const paid   = Number(o.paid_amount)  || 0;
      const hold   = Number(o.unremitted)   || 0;
      const pend   = Number(o.admin_pending)|| 0;
      const remaining = Number(o.remaining) || (total - paid);
      const pctPaid = total ? Math.min(100, paid / total * 100) : 0;
      const pctHold = total ? Math.min(100 - pctPaid, hold / total * 100) : 0;
      const pctPend = total ? Math.min(100 - pctPaid - pctHold, pend / total * 100) : 0;
      const refDate = o.confirmed_at || o.created_at;
      const days    = daysBetween(refDate);
      const dateLbl = o.confirmed_at ? 'XN' : 'Tạo';
      const dateTxt = refDate ? `${dateLbl} ${fmtDate(refDate)}` : '—';
      const overdue = days >= 7;
      const st  = STATUS_LABEL[o.status] || { txt: o.status || '—', cls: 'st-new' };
      const ktv = o.assigned_staff_names ? escape(o.assigned_staff_names) : 'Chưa gán';
      const addr    = o.address     ? escape(o.address)              : '';
      const doneTxt = o.completed_at? fmtDate(o.completed_at)        : '';
      const accentCls = overdue ? 'accent-overdue' : paid > 0 ? 'accent-partial' : 'accent-new';

      const pills = [
        paid > 0 ? `<span class="o-pill pill-paid">✓ Đã trả ${fmtVnd(paid)}</span>` : '',
        hold > 0 ? `<span class="o-pill pill-hold">🔧 KTV giữ ${fmtVnd(hold)}</span>` : '',
        pend > 0 ? `<span class="o-pill pill-pend">⏳ Chờ XN ${fmtVnd(pend)}</span>` : '',
      ].filter(Boolean).join('');

      return `
        <a class="order-card ${accentCls}" href="/admin/orders.html#order-${o.id}" target="_blank"
           data-order-quick="${o.id}" title="Xem nhanh — Ctrl+click mở tab mới">
          <div class="oc-top">
            <div class="oc-left">
              <span class="oc-code">${escape(o.code)}</span>
              <span class="o-tag ${st.cls}">${st.txt}</span>
              ${overdue ? '<span class="o-tag st-cn">⏰ Quá hạn</span>' : ''}
            </div>
            <div class="oc-remaining">${fmtVnd(remaining)}</div>
          </div>
          <div class="oc-meta">
            <span>📅 ${dateTxt}${days > 0 ? ` · <b>${days} ngày</b>` : ''}</span>
            <span>🔧 KTV: <b>${ktv}</b></span>
            ${o.item_count ? `<span>📦 ${o.item_count} mặt hàng</span>` : ''}
            ${doneTxt ? `<span>✅ Xong ${doneTxt}</span>` : ''}
            ${addr ? `<span>📍 ${addr}</span>` : ''}
          </div>
          <div class="oc-progress-wrap" title="Đã trả ${fmtVnd(paid)} / Tổng ${fmtVnd(total)}">
            <div class="oc-progress">
              <div class="ocp-paid"  style="width:${pctPaid}%"></div>
              <div class="ocp-hold"  style="left:${pctPaid}%;width:${pctHold}%"></div>
              <div class="ocp-pend"  style="left:${pctPaid + pctHold}%;width:${pctPend}%"></div>
            </div>
            <span class="oc-total-lbl">Tổng <b>${fmtVnd(total)}</b></span>
          </div>
          ${pills ? `<div class="oc-pills">${pills}</div>` : ''}
        </a>`;
    }).join('');
  }

  // ==== HELPER: panel tong quan cong no (breakdown + hero total) ====
  function renderDebtSummary(r, opts = {}) {
    const op         = Number(r.opening_balance) || 0;
    const orderDebt  = Number(r.order_debt)      || 0;
    const reqDebt    = Number(r.request_debt)    || 0;
    const total      = Number(r.total_debt)      || 0;
    const pendingReqs = r.pending_requests || [];
    const orderCount  = (r.pending_orders || []).length;

    const ktvHolding  = (r.pending_orders || []).reduce((s, o) => s + (Number(o.unremitted)    || 0), 0);
    const adminPending= (r.pending_orders || []).reduce((s, o) => s + (Number(o.admin_pending) || 0), 0);

    // ---- breakdown rows ----
    let rows = '';

    // dòng đếm đơn
    rows += `<div class="dsb-row dsb-count-row">
      <span class="dsb-label">Đơn đang nợ</span>
      <span class="dsb-badge">${orderCount} đơn</span>
    </div>`;

    // nợ từ đơn
    const ktvBadges = [
      ktvHolding  > 0 ? `<span class="dsb-tag tag-hold">🔧 KTV giữ ${fmtVnd(ktvHolding)}</span>`   : '',
      adminPending> 0 ? `<span class="dsb-tag tag-pend">⏳ Chờ XN ${fmtVnd(adminPending)}</span>` : '',
    ].filter(Boolean).join('');
    rows += `<div class="dsb-row">
      <span class="dsb-label">📉 Nợ từ đơn hàng${ktvBadges ? `<span class="dsb-inline-tags">${ktvBadges}</span>` : ''}</span>
      <span class="dsb-amount${orderDebt > 0 ? ' red' : ' muted'}">${fmtVnd(orderDebt)}</span>
    </div>`;

    // nợ phiếu YC / gối đầu (gộp 2 khái niệm: phiếu YC chưa thu + nợ kỳ trước)
    if (reqDebt > 0 || op !== 0 || opts.showOpening) {
      const prLinks = pendingReqs.map(pr =>
        `<span class="pr-sub-link" onclick="event.stopPropagation();window.open('/admin/payment-request-detail.html?id=${pr.id}','_blank')" title="Xem phiếu">${escape(pr.code)}&nbsp;${fmtVnd(pr.remaining)}&nbsp;↗</span>`
      ).join(' · ');
      const displayAmt = reqDebt > 0 ? reqDebt : op;
      const amtClass   = displayAmt > 0 ? ' amber' : displayAmt < 0 ? ' green' : ' muted';
      rows += `<div class="dsb-row">
        <span class="dsb-label">🧾 Phiếu YC chưa thu · gối đầu${prLinks ? `<span class="dsb-inline-tags">${prLinks}</span>` : ''}</span>
        <span class="dsb-amount${amtClass}">${displayAmt !== 0 ? fmtVnd(Math.abs(displayAmt)) + (displayAmt < 0 ? ' (dư)' : '') : '—'}</span>
      </div>`;
    }

    // ---- hero total ----
    const isNeg = total < 0;
    const totalHtml = `<div class="dsb-total ${isNeg ? 'neg' : ''}">
      <div class="dsb-total-icon">${isNeg ? '🔻' : '💰'}</div>
      <div class="dsb-total-val">${fmtVnd(Math.abs(total))}</div>
      <div class="dsb-total-label">${isNeg ? 'Công ty đang nợ ngược' : 'Tổng nợ hiện tại'}</div>
    </div>`;

    return `<div class="dsb-panel">
      <div class="dsb-left">${rows}</div>
      <div class="dsb-right">${totalHtml}</div>
    </div>`;
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
      html += `<div class="section-title"><h4>📋 Đơn đang nợ (${r.pending_orders.length})</h4><small>Bấm để mở chi tiết đơn ↗</small></div>`;
      html += `<div class="order-list">${renderPendingOrderRows(r.pending_orders)}</div>`;
    } else {
      html += '<div class="text-center text-muted" style="padding:30px">Không có đơn đang nợ</div>';
    }

    const pendReqsOl = r.pending_requests || [];
    if (pendReqsOl.length) {
      html += `<div class="section-title" style="margin-top:16px"><h4>🧾 Phiếu YC- chưa thu (${pendReqsOl.length})</h4><small>Bấm để xem phiếu ↗</small></div>`;
      html += pendReqsOl.map(pr => `
        <div class="history-row" onclick="window.open('/admin/payment-request-detail.html?id=${pr.id}','_blank')">
          <div><b>${escape(pr.code)}</b> <span class="text-muted" style="font-size:12px;margin-left:6px">${fmtDate(pr.created_at)}</span></div>
          <span style="color:#dc2626;font-weight:700">Còn thiếu ${fmtVnd(pr.remaining)}</span>
        </div>`).join('');
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

    const pendReqs = r.pending_requests || [];
    if (pendReqs.length) {
      html += `<div class="section-title" style="margin-top:14px"><h4>🧾 Phiếu YC- còn nợ (${pendReqs.length})</h4><small class="text-muted">Bấm để xem chi tiết phiếu ↗</small></div>`;
      html += pendReqs.map(pr => `
        <div class="history-row" style="cursor:pointer" onclick="window.open('/admin/payment-request-detail.html?id=${pr.id}','_blank')" title="Bấm để xem phiếu">
          <span><b>${escape(pr.code)}</b>  ·  ${fmtDate(pr.created_at)}</span>
          <span style="color:#dc2626;font-weight:600">Còn thiếu ${fmtVnd(pr.remaining)}</span>
        </div>`).join('');
    }

    if (r.history.length) {
      const PREVIEW = 5;
      html += `<div class="section-title" style="margin-top:16px">
        <h4>📜 Lịch sử tất toán (${r.history.length})</h4>
        ${r.history.length > PREVIEW ? `<button type="button" class="btn sm ghost" data-act="settle-history" data-cid="${c.id}">Xem tất cả →</button>` : ''}
      </div>`;
      for (const h of r.history.slice(0, PREVIEW)) {
        const paid = Number(h.amount_paid) || 0;
        const rem  = Number(h.remaining)   || 0;
        html += `<div class="history-row" onclick="window.open('/admin/payment-request-detail.html?id=${h.id}', '_blank')" title="Bấm để xem chi tiết phiếu">
          <div>
            <b>${escape(h.code)}</b>
            <span class="text-muted" style="font-size:12px;margin-left:6px">${fmtDate(h.paid_at)}</span>
          </div>
          <div style="text-align:right;font-size:13px">
            <span>Trả <b style="color:#16a34a">${fmtVnd(paid)}</b></span>
            ${rem > 0 ? `<span style="margin-left:8px;color:#dc2626;font-weight:600">còn ${fmtVnd(rem)}</span>` : '<span style="margin-left:8px;color:#16a34a;font-size:12px">✓ Đủ</span>'}
          </div>
        </div>`;
      }
    }

    $('cmBody').innerHTML = html;
    if (!IS_ADMIN) $('cmSettle').style.display = 'none';
    else $('cmSettle').disabled = r.total_debt <= 0;
  }

  // ==== MODAL: danh sach lich su tat toan (day du) ===============
  function openSettlementList(customerId, history) {
    state._slHistory = history; // cache de loc phia FE
    state._slCid = customerId;
    renderSettlementList(history);
    const cust = state.selectedCustomer && state.selectedCustomer.customer;
    const name = cust ? (cust.company_name || cust.full_name) : '';
    $('slTitle').textContent = `Lịch sử tất toán${name ? ': ' + name : ''} (${history.length})`;
    $('settlementListModal').classList.add('open');
  }

  function renderSettlementList(list) {
    if (!list.length) {
      $('slBody').innerHTML = '<p class="text-muted text-center" style="padding:24px">Chưa có phiếu tất toán nào.</p>';
      return;
    }
    let html = '';
    for (const h of list) {
      const methodLabel = { cash: 'Tiền mặt', transfer: 'Chuyển khoản', mixed: 'Hỗn hợp' }[h.pay_method] || h.pay_method || '';
      html += `<div class="history-row" onclick="window.open('/admin/payment-request-detail.html?id=${h.id}', '_blank')" title="Bấm để xem chi tiết phiếu YC-">
        <div style="display:flex;flex-direction:column;gap:2px">
          <b>${escape(h.code)}</b>
          <span class="text-muted" style="font-size:12px">${fmtDate(h.paid_at)}${methodLabel ? ' · ' + methodLabel : ''}</span>
        </div>
        <div style="text-align:right">
          <div>Trả <b>${fmtVnd(h.amount_paid)}</b> / <span class="text-muted">${fmtVnd(h.total_debt)}</span></div>
          ${h.remaining > 0 ? `<div style="color:#dc2626;font-size:12px">Còn thiếu ${fmtVnd(h.remaining)}</div>` : '<div style="color:#16a34a;font-size:12px">Đã đủ</div>'}
        </div>
      </div>`;
    }
    $('slBody').innerHTML = html;
  }

  // Tat toan: mo tab moi sang trang form chi tiet (replace cho modal cu).
  function openSettleModal() {
    const r = state.selectedCustomer;
    if (!r) return;
    const cid = r.customer && r.customer.id;
    if (!cid) return;
    window.open(`/admin/debt-settle-form.html?cid=${cid}`, '_blank', 'noopener');
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
    const advances = r.pending_advances || [];
    const initAdvTotal  = advances.reduce((s, a) => s + a.amount, 0);
    const initEffective = Math.max(0, total - initAdvTotal);

    // ── Summary box trên ──
    const openingRow = opening !== 0
      ? `<div class="row">
           <span>${opening > 0 ? 'Nợ kỳ trước:' : 'Dư kỳ trước:'}</span>
           <span class="${opening > 0 ? 'opening-balance' : ''}" ${opening < 0 ? 'style="color:#0a7a1f"' : ''}>${fmtVnd(Math.abs(opening))}</span>
         </div>`
      : '';

    // ── Danh sách khoản đang giữ ──
    // Gom tất cả device tags từ các items của 1 collection thành 1 hàng tags nhỏ
    function buildDeviceTags(items) {
      const tags = [];
      for (const it of (items || [])) {
        if (it.vehicle_plate)        tags.push(`<span class="device-tag"><span class="device-label">Biển số</span> ${escape(it.vehicle_plate)}</span>`);
        if (it.subscription_account) tags.push(`<span class="device-tag"><span class="device-label">TK GoTrack</span> ${escape(it.subscription_account)}</span>`);
        if (it.imei)                 tags.push(`<span class="device-tag"><span class="device-label">IMEI</span> ${escape(it.imei)}</span>`);
      }
      return tags.length ? `<div class="col-item-device-box" style="margin-top:6px">${tags.join('')}</div>` : '';
    }

    let colsInner = '';
    if (r.collections.length) {
      colsInner = r.collections.map(c => {
        const deviceTags = buildDeviceTags(c.items);
        return `
        <div class="order-row" style="margin-bottom:6px">
          <div class="o-header" style="align-items:flex-start">
            <div class="o-meta" style="flex:1;min-width:0">
              <b>${escape(c.order_code || '—')}</b>${c.order_code ? ui.copyCodeBtn(c.order_code) : ''}
              ${c.customer_name ? `<span class="o-customer-name">${escape(c.customer_name)}</span>` : ''}
              <span class="text-muted">${fmtDate(c.collected_at)}</span>
              <span class="o-method-badge">${c.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</span>
            </div>
            <div style="text-align:right;flex-shrink:0;min-width:130px;padding-left:10px">
              ${c.order_total ? `<div style="font-size:12px;color:#64748b">Giá trị đơn: <b>${fmtVnd(c.order_total)}</b></div>` : ''}
              <div style="font-weight:700;color:#1f6feb;font-size:14px">Thu giữ: ${fmtVnd(c.amount)}</div>
            </div>
          </div>
          ${deviceTags}
        </div>`;
      }).join('');
      // Dòng cộng dồn
      colsInner += `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#eff6ff;border:2px solid #bfdbfe;border-radius:8px;margin-top:4px">
        <span style="font-weight:600;color:#1e3a8a">Tổng đang giữ — ${r.collections.length} khoản</span>
        <b style="color:#1d4ed8;font-size:15px">${fmtVnd(holding)}</b>
      </div>`;
    } else {
      colsInner = '<div class="text-center text-muted" style="padding:20px">Không có khoản đang giữ</div>';
    }

    // ── Phiếu ứng ──
    let advancesHtml = '';
    if (advances.length) {
      advancesHtml = `
      <div class="pending-orders-block" style="margin-top:14px">
        <h4>Phiếu ứng lương chưa kết <small class="text-muted">(chọn để trừ vào lần nộp này)</small></h4>
        <div style="background:#fff;border:1px solid var(--border);border-radius:8px;overflow:hidden">
          ${advances.map(a => `
          <label style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid #f5f5f5;transition:background .1s">
            <input type="checkbox" class="ss-adv-cb" data-id="${a.id}" data-amount="${a.amount}" checked style="width:16px;height:16px;flex-shrink:0;accent-color:var(--primary)">
            <span style="flex:1;font-size:13px">${escape(a.note || 'Ứng lương')} <span class="text-muted">${fmtDate(a.created_at)}</span></span>
            <span style="font-weight:600;color:#d97706">${fmtVnd(a.amount)}</span>
          </label>`).join('')}
        </div>
        <div class="summary-box" style="margin-top:8px">
          <div class="row">
            <span>Tổng trừ phiếu ứng:</span>
            <span id="ssAdvTotal" style="color:#d97706;font-weight:600">${fmtVnd(initAdvTotal)}</span>
          </div>
          <div class="row total">
            <span>Cần nộp thực tế:</span>
            <span id="ssEffective">${fmtVnd(initEffective)}</span>
          </div>
        </div>
      </div>`;
    }

    $('ssBody').innerHTML = `
      <p style="margin:0 0 12px;font-size:14px">KTV: <b>${escape(name)}</b></p>
      <div class="summary-box">
        ${openingRow}
        <div class="row"><span>Đang giữ (${r.collections.length} khoản):</span><span>${fmtVnd(holding)}</span></div>
        <div class="row total"><span>Tổng phải nộp:</span><span>${fmtVnd(total)}</span></div>
      </div>

      <div class="pending-orders-block" style="margin-top:14px">
        <h4>Khoản đang giữ <small class="text-muted">(sẽ đánh dấu đã nộp khi duyệt)</small></h4>
        ${colsInner}
      </div>

      ${advancesHtml}

      <div class="grid cols-2" style="margin-top:14px">
        <div class="field">
          <label>Số tiền KTV thực nộp *</label>
          <input type="text" id="ssAmount" class="input money-input" inputmode="numeric" placeholder="VD: 1.000.000">
          <p class="help" id="ssAmountHelp">Phần thiếu/dư chuyển sang kỳ sau</p>
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

    // Khởi tạo money-input sau khi đã gắn vào DOM
    const amtEl = $('ssAmount');
    if (amtEl) Money.set(amtEl, initEffective);

    // Khi tick/bỏ phiếu ứng → cập nhật tổng trừ, cần nộp thực tế, và gợi ý input
    $('ssBody').addEventListener('change', e => {
      if (!e.target.classList.contains('ss-adv-cb')) return;
      const checkedTotal = [...document.querySelectorAll('.ss-adv-cb:checked')]
        .reduce((s, cb) => s + Number(cb.dataset.amount), 0);
      const effective = Math.max(0, total - checkedTotal);
      const elAdv = document.getElementById('ssAdvTotal');
      if (elAdv) elAdv.textContent = fmtVnd(checkedTotal);
      const elEff = document.getElementById('ssEffective');
      if (elEff) elEff.textContent = fmtVnd(effective);
      const inp = $('ssAmount');
      if (inp) Money.set(inp, effective);
    });

    $('ssSubmit').dataset.tid = tid;
    $('ssSubmit').dataset.total = String(total);
  }

  async function submitStaffSettle() {
    const tid   = $('ssSubmit').dataset.tid;
    const total = Number($('ssSubmit').dataset.total) || 0;
    const amount = Money.get($('ssAmount'));
    const advanceIds = [...document.querySelectorAll('.ss-adv-cb:checked')].map(cb => Number(cb.dataset.id));
    const advancesTotal = [...document.querySelectorAll('.ss-adv-cb:checked')]
      .reduce((s, cb) => s + Number(cb.dataset.amount), 0);
    const effectiveTotal = total - advancesTotal;

    if (amount <= 0 && effectiveTotal > 0) return ui.toast('Nhập số tiền > 0', 'warning');
    if (amount > effectiveTotal && effectiveTotal > 0) {
      const ok = await ui.confirm({
        title: 'Số tiền lớn hơn cần nộp', type: 'warning',
        message: `KTV nộp ${fmtVnd(amount)} nhưng sau trừ phiếu ứng chỉ cần ${fmtVnd(effectiveTotal)}. Vẫn tiếp tục?`
      });
      if (!ok) return;
    }
    const method = $('ssMethod').value;
    const note   = $('ssNote').value.trim();
    $('ssSubmit').disabled = true;
    try {
      const res = await api.post(`/admin/debts/staff/${tid}/settle`,
        { amount_paid: amount, method, note, advance_ids: advanceIds },
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
      $('prBody').innerHTML = list.map(r => {
        let advs = [];
        try { advs = r.advances_deducted_json ? JSON.parse(r.advances_deducted_json) : []; } catch {}
        const advTotal = advs.reduce((s, a) => s + (Number(a.amount) || 0), 0);
        const net = Number(r.amount) - advTotal;
        const advBlock = advs.length ? `
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:8px 10px;font-size:12.5px">
            <div style="font-weight:600;color:#92400e;margin-bottom:4px">➖ Khấu trừ tiền ứng lương (${advs.length} phiếu)</div>
            ${advs.map(a => `<div style="display:flex;justify-content:space-between;color:#64748b"><span>${a.note||'Ứng lương'}</span><span style="color:#b45309;font-weight:600">− ${fmtVnd(a.amount)}</span></div>`).join('')}
            <div style="display:flex;justify-content:space-between;margin-top:4px;padding-top:4px;border-top:1px solid #fde68a;font-weight:700">
              <span style="color:#15803d">Thực nhận từ KTV</span>
              <span style="color:#15803d">${fmtVnd(net)}</span>
            </div>
          </div>` : '';
        return `
        <div class="history-row" style="flex-direction:column;align-items:stretch;gap:6px;padding:12px">
          <div style="display:flex;justify-content:space-between;gap:8px">
            <div>
              <b>${escape(r.staff_name)}</b> · <small class="text-muted">${escape(r.staff_username || '')}</small><br>
              <small class="text-muted">${fmtDate(r.remitted_at)} · ${r.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'} · ${r.collection_count} khoản</small>
            </div>
            <div style="text-align:right">
              <div><b style="color:#1f6feb">${fmtVnd(r.amount)}</b> <span style="font-size:11px;color:#64748b">thu hộ</span></div>
              ${advTotal > 0 ? `<div style="color:#15803d;font-weight:700;font-size:13px">= ${fmtVnd(net)} thực nhận</div>` : ''}
              ${r.receipt_url ? `<a href="${escape(r.receipt_url)}" target="_blank" style="font-size:12px">Xem biên lai</a>` : ''}
            </div>
          </div>
          ${advBlock}
          ${r.note ? `<div style="font-size:13px;color:#475569">📝 ${escape(r.note)}</div>` : ''}
          <div style="display:flex;gap:6px;justify-content:flex-end">
            <button class="btn ghost sm" data-pact="reject" data-rid="${r.id}">Từ chối</button>
            <button class="btn sm" data-pact="approve" data-rid="${r.id}">Duyệt</button>
          </div>
        </div>`;
      }).join('');
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
  $('fType').onchange = () => { state.type = $('fType').value; state.custPage = 1; loadCustomers(); };
  let qTimer = null;
  $('fQ').oninput = () => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { state.q = $('fQ').value.trim(); state.custPage = 1; loadCustomers(); }, 300);
  };
  let qsTimer = null;
  $('fQStaff').oninput = () => {
    clearTimeout(qsTimer);
    qsTimer = setTimeout(() => { state.qStaff = $('fQStaff').value.trim(); loadStaff(); }, 300);
  };

  if ($('fDebtType')) $('fDebtType').onchange = () => { state.custPage = 1; renderCustomers(); };

  // Nút Bộ lọc: toggle hiển thị fDebtType
  if ($('btnFilterToggle') && $('fDebtType')) {
    $('btnFilterToggle').onclick = () => {
      const el = $('fDebtType');
      const hidden = el.style.display === 'none';
      el.style.display = hidden ? '' : 'none';
      $('btnFilterToggle').classList.toggle('active', hidden);
    };
  }

  let reqQTimer = null;
  if ($('fReqQ')) $('fReqQ').oninput = () => { clearTimeout(reqQTimer); reqQTimer = setTimeout(loadRequests, 300); };
  if ($('fReqFrom')) $('fReqFrom').onchange = loadRequests;
  if ($('fReqTo'))   $('fReqTo').onchange   = loadRequests;
  if ($('fReqHasRemain')) $('fReqHasRemain').onchange = loadRequests;
  if ($('btnReqReset')) $('btnReqReset').onclick = () => {
    if ($('fReqQ'))         $('fReqQ').value = '';
    if ($('fReqFrom'))      $('fReqFrom').value = '';
    if ($('fReqTo'))        $('fReqTo').value = '';
    if ($('fReqHasRemain')) $('fReqHasRemain').checked = false;
    if ($('fReqStatus'))    $('fReqStatus').value = 'active';
    state.reqPage = 1;
    loadRequests();
  };

  let staffAreaTimer = null;
  if ($('fStaffArea')) $('fStaffArea').oninput = () => {
    clearTimeout(staffAreaTimer);
    staffAreaTimer = setTimeout(loadStaff, 300);
  };
  if ($('fStaffDays')) $('fStaffDays').onchange = () => { state.staffPage = 1; renderStaff(); };
  if ($('btnStaffReset')) $('btnStaffReset').onclick = () => {
    if ($('fQStaff'))    { $('fQStaff').value = ''; state.qStaff = ''; }
    if ($('fStaffArea')) $('fStaffArea').value = '';
    if ($('fStaffDays')) $('fStaffDays').value = '';
    state.staffPage = 1;
    loadStaff();
  };

  document.body.addEventListener('click', (e) => {
    const orders = e.target.closest('button[data-act="orders"]');
    if (orders) return openOrdersListModal(orders.dataset.cid);
    const detail = e.target.closest('button[data-act="detail"]');
    if (detail) return openCustModal(detail.dataset.cid);
    const settleHistory = e.target.closest('[data-act="settle-history"]');
    if (settleHistory) {
      const hist = state.selectedCustomer && state.selectedCustomer.history || [];
      return openSettlementList(settleHistory.dataset.cid, hist);
    }
    const payReqBtn = e.target.closest('button[data-act="pay-request"]');
    if (payReqBtn) return openPayRequestModal(payReqBtn);
    const cancelReqBtn = e.target.closest('button[data-act="cancel-request"]');
    if (cancelReqBtn) return cancelPaymentRequest(Number(cancelReqBtn.dataset.rid));
    const settleStaff = e.target.closest('button[data-act="settle-staff"]');
    if (settleStaff) return openStaffSettleModal(settleStaff);
    const pact = e.target.closest('button[data-pact]');
    if (pact) {
      const id = Number(pact.dataset.rid);
      if (pact.dataset.pact === 'approve') return approveRemit(id);
      if (pact.dataset.pact === 'reject') return rejectRemit(id);
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

  $('cmClose').onclick = () => $('custModal').classList.remove('open');
  $('cmCloseBtn').onclick = () => $('custModal').classList.remove('open');
  $('cmSettle').onclick = () => { $('custModal').classList.remove('open'); openSettleModal(); };

  $('olClose').onclick = () => $('ordersListModal').classList.remove('open');
  $('olCloseBtn').onclick = () => $('ordersListModal').classList.remove('open');
  $('olSettle').onclick = () => { $('ordersListModal').classList.remove('open'); openSettleModal(); };

  $('ssClose').onclick = () => $('staffSettleModal').classList.remove('open');
  $('ssCancel').onclick = () => $('staffSettleModal').classList.remove('open');
  $('ssSubmit').onclick = submitStaffSettle;

  $('btnViewPending').onclick = openPendingRemitModal;
  $('prClose').onclick = () => $('pendingRemitModal').classList.remove('open');
  $('prCloseBtn').onclick = () => $('pendingRemitModal').classList.remove('open');

  $('slClose').onclick = () => $('settlementListModal').classList.remove('open');
  $('slCloseBtn').onclick = () => $('settlementListModal').classList.remove('open');
  $('slFilter').onclick = () => {
    const from = $('slFrom').value;
    const to = $('slTo').value;
    const list = (state._slHistory || []).filter(h => {
      const d = h.paid_at ? h.paid_at.slice(0, 10) : '';
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
    renderSettlementList(list);
  };
  $('slClear').onclick = () => {
    $('slFrom').value = '';
    $('slTo').value = '';
    renderSettlementList(state._slHistory || []);
  };

  // ==== MODAL: GHI NO CU =======================================
  function renderOldDebtCustomerOptions(filterStr = '') {
    const term = filterStr.toLowerCase();
    const list = (state.allCustomersForDebt || []).filter(c => {
      if (!term) return true;
      const name = c.full_name || '';
      const code = c.code || '';
      const phone = c.phone || '';
      const comp = c.company_name || '';
      return name.toLowerCase().includes(term) ||
        code.toLowerCase().includes(term) ||
        phone.toLowerCase().includes(term) ||
        comp.toLowerCase().includes(term);
    });

    if (!list.length) {
      $('od_customer_list').innerHTML = '<div style="padding:8px 12px; color:#64748b;">Không tìm thấy khách hàng</div>';
      return;
    }

    $('od_customer_list').innerHTML = list.map(c => {
      const name = c.type === 'dealer' && c.company_name ? `${c.company_name} (${c.full_name})` : c.full_name;
      return `<div class="od-cust-item" data-id="${c.id}" data-name="${escape(name)}" style="padding:8px 12px; cursor:pointer; border-bottom:1px solid #f1f5f9;">
        <b>${escape(c.code)}</b> - ${escape(name)}
      </div>`;
    }).join('');
  }

  async function openOldDebtModal() {
    $('od_customer_id').value = '';
    $('od_customer_search').value = '';
    $('od_amount').value = '';
    $('od_date').value = new Date().toISOString().slice(0, 10);
    $('od_note').value = '';
    $('od_customer_list').style.display = 'none';
    $('od_customer_list').innerHTML = '<div style="padding:8px 12px; color:#64748b;">Đang tải danh sách...</div>';
    $('oldDebtModal').classList.add('open');

    const r = await api.get('/admin/customers?limit=1000', { silent: true }).catch(() => null);
    if (!r || !r.items) {
      $('od_customer_list').innerHTML = '<div style="padding:8px 12px; color:#dc2626;">Lỗi tải danh sách</div>';
      return;
    }
    state.allCustomersForDebt = r.items;
    renderOldDebtCustomerOptions('');
  }

  async function submitOldDebt(e) {
    e.preventDefault();
    const cid = $('od_customer_id').value;
    if (!cid) return ui.toast('Vui lòng chọn khách hàng', 'warning');
    const amount = Money.get($('od_amount'));
    if (!amount) return ui.toast('Vui lòng nhập số tiền hợp lệ', 'warning');
    const data = {
      amount,
      debt_date: $('od_date').value,
      note: $('od_note').value.trim()
    };

    const btn = $('oldDebtModal').querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const ok = await api.post(`/admin/debts/${cid}/old-debts`, data, {
        loading: true, successMessage: 'Đã tạo phiếu nợ cũ thành công'
      }).catch(() => null);
      if (ok) {
        $('oldDebtModal').classList.remove('open');
        loadSummary();
        loadCustomers();
      }
    } finally {
      btn.disabled = false;
    }
  }

  $('btnCreateOldDebt') && ($('btnCreateOldDebt').onclick = openOldDebtModal);
  $('odClose') && ($('odClose').onclick = () => $('oldDebtModal').classList.remove('open'));
  $('odCancel') && ($('odCancel').onclick = () => $('oldDebtModal').classList.remove('open'));
  $('odForm') && ($('odForm').onsubmit = submitOldDebt);

  if ($('od_customer_search')) {
    $('od_customer_search').onfocus = () => {
      $('od_customer_list').style.display = 'block';
      renderOldDebtCustomerOptions($('od_customer_search').value);
    };
    $('od_customer_search').oninput = (e) => {
      $('od_customer_id').value = '';
      $('od_customer_list').style.display = 'block';
      renderOldDebtCustomerOptions(e.target.value);
    };
  }

  if ($('od_customer_list')) {
    $('od_customer_list').onclick = (e) => {
      const item = e.target.closest('.od-cust-item');
      if (!item) return;
      $('od_customer_id').value = item.dataset.id;
      $('od_customer_search').value = item.dataset.name;
      $('od_customer_list').style.display = 'none';
    };
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#od_customer_wrap') && $('od_customer_list')) {
      $('od_customer_list').style.display = 'none';
    }
  });

  // ==== INIT ===================================================
  adminShell.init('debts');
  loadSummary();
  loadCustomers();
})();

// Removed duplicate init
