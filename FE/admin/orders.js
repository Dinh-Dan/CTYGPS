// /admin/orders.html — list don + modal chi tiet template-driven.

(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const fmtN = new Intl.NumberFormat('vi-VN');
  const fmt = (n) => fmtN.format(Number(n) || 0);
  const IS_ADMIN = (window.auth && auth.isAdmin && auth.isAdmin()) || false;
  const PAGE_QS = new URLSearchParams(location.search);
  const IS_WARRANTY_VIEW = PAGE_QS.get('service_kind') === 'warranty';
  if (IS_WARRANTY_VIEW) {
    location.replace('/admin/inventory.html');
    return;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }
  function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    const hm = dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const day = dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${hm}<br><small style="color:#94a3b8">${day}</small>`;
  }

  function initPageMode() {}

  const WARRANTY_ROLE_LABELS = {
    faulty: 'Hàng lỗi',
    replacement: 'Hàng thay thế',
    supplier_return: 'Hàng NCC trả',
  };
  const WARRANTY_STATUS_LABELS = {
    intake: 'Mới tiếp nhận',
    technician_holding: 'KTV đang giữ',
    company_warranty_stock: 'Kho bảo hành công ty',
    sent_to_supplier: 'Đã gửi NCC',
    supplier_returned: 'NCC trả về',
    delivered: 'Đã giao khách',
    cancelled: 'Đã hủy',
  };
  const WARRANTY_LOCATION_LABELS = {
    customer: 'Khách hàng',
    technician: 'Kho KTV',
    technician_stock: 'Kho KTV',
    company_warranty_stock: 'Kho bảo hành',
    company_stock: 'Kho công ty',
    supplier: 'Nhà cung cấp',
    customer_returned: 'Đã giao khách',
  };
  const WARRANTY_ACTION_LABELS = {
    receive_from_customer: 'KTV nhận từ khách',
    move_to_company_stock: 'Nhập kho bảo hành',
    send_to_supplier: 'Gửi NCC',
    receive_from_supplier: 'Nhận từ NCC',
    reserve_replacement_from_company: 'Xuất đổi từ kho công ty',
    reserve_replacement_from_technician: 'Xuất đổi từ kho KTV',
    deliver_to_customer: 'Giao lại khách',
    cancel_item: 'Hủy item',
    note: 'Ghi chú',
  };
  const WARRANTY_STATUS_TEXT = {
    intake: 'Chưa đưa vào xử lý',
    technician_holding: 'Đồ lỗi đang ở túi KTV',
    company_warranty_stock: 'Đồ lỗi đang ở kho bảo hành công ty',
    sent_to_supplier: 'Đồ lỗi đang gửi NCC',
    supplier_returned: 'Đã nhận đồ bảo hành từ NCC',
    delivered: 'Đã đóng item nội bộ',
    cancelled: 'Đã huỷ',
  };
  const WARRANTY_LOCATION_TEXT = {
    customer: 'Khách đang giữ',
    technician: 'Kho KTV',
    technician_stock: 'Kho KTV',
    company_warranty_stock: 'Kho bảo hành công ty',
    company_stock: 'Kho công ty',
    supplier: 'Nhà cung cấp',
    customer_returned: 'Khách đã nhận lại',
  };
  const WARRANTY_ACTION_TEXT = {
    mark_fixed: 'KTV đã khắc phục',
    receive_from_customer: 'Đưa sản phẩm vào túi KTV',
    move_to_company_stock: 'Trả sản phẩm lỗi về kho công ty',
    send_to_supplier: 'Gửi nhà cung cấp',
    receive_from_supplier: 'Nhận hàng từ nhà cung cấp',
    reserve_replacement_from_company: 'Cấp hàng từ kho công ty',
    reserve_replacement_from_technician: 'Đổi ngay từ túi KTV',
    deliver_to_customer: 'Trả bảo hành cho khách',
    cancel_item: 'Huỷ item',
    note: 'Ghi chú',
  };
  Object.assign(WARRANTY_STATUS_LABELS, WARRANTY_STATUS_TEXT);
  Object.assign(WARRANTY_LOCATION_LABELS, WARRANTY_LOCATION_TEXT);
  Object.assign(WARRANTY_ACTION_LABELS, WARRANTY_ACTION_TEXT);
  const WARRANTY_HANDLING_LABELS = {
    pending: 'Chưa chốt cách xử lý',
    tech_fix: 'KTV đã khắc phục',
    exchange: 'Đổi thiết bị',
    supplier_return: 'Đổi trả NCC',
  };
  const WARRANTY_CUSTOMER_LABELS = {
    pending: 'Khách chưa xong',
    completed: 'Đã trả bảo hành cho khách',
  };
  function warrantyBadge(text, cls) {
    return `<span class="pill ${cls || 'gray'}">${esc(text)}</span>`;
  }
  function warrantyStatusBadge(code) {
    const label = WARRANTY_STATUS_LABELS[code] || code || '—';
    const cls = {
      intake: 'gray',
      technician_holding: 'blue',
      company_warranty_stock: 'purple',
      sent_to_supplier: 'amber',
      supplier_returned: 'blue',
      delivered: 'green',
      cancelled: 'red',
    }[code] || 'gray';
    return warrantyBadge(label, cls);
  }
  function warrantyMoveOptionsForItem(item) {
    const actionCodes = Array.isArray(item && item.available_actions) && item.available_actions.length
      ? item.available_actions
      : ['note'];
    return actionCodes.map((code) => ({ code, label: WARRANTY_ACTION_LABELS[code] || code }));
  }

  let state = {
    page: 1, limit: 10, total: 0,
    filters: { bucket: 'all' },
    serviceKind: IS_WARRANTY_VIEW ? 'warranty' : '',
    templates: [],
    items: [],
    currentDetail: null,        // detail loaded in modal
    photosExpanded: false,
    products: null,             // lazy
    customCacheStaff: null,     // suggested staff cache
    selectedIds: new Set(),     // bulk-select order IDs
  };

  // ---- TEMPLATE DROPDOWN --------------------------------------
  async function loadTemplates() {
    const res = await api.get('/admin/order-templates').catch(() => null);
    state.templates = (res && res.items) || [];
    const pop = document.getElementById('tplPop');
    const footer = pop.querySelector('div');
    state.templates.forEach(t => {
      const lbl = document.createElement('label');
      lbl.className = 'ps-opt';
      lbl.innerHTML = `<input type="checkbox" value="${t.id}"><span class="ps-box"></span> ${t.name}`;
      pop.insertBefore(lbl, footer);
    });
  }

  // ---- LIST ---------------------------------------------------
  function buildQuery() {
    const p = new URLSearchParams();
    p.set('page', state.page);
    p.set('limit', state.limit);
    const f = state.filters;
    if (state.serviceKind) p.set('service_kind', state.serviceKind);

    if (f.q) p.set('q', f.q);
    if (f.customer_q) p.set('customer_q', f.customer_q);
    if (f.date_from) p.set('date_from', f.date_from);
    if (f.date_to)   p.set('date_to', f.date_to);
    if (f.template_id) p.set('template_id', f.template_id);
    if (f.status) p.set('status', f.status);
    if (f.payment_status) p.set('payment_status', f.payment_status);
    if (f.collected_for_dealer) p.set('collected_for_dealer', f.collected_for_dealer);
    if (f.device_q) p.set('device_q', f.device_q);
    return p.toString();
  }

  async function loadStats() {
    const suffix = state.serviceKind ? ('?service_kind=' + encodeURIComponent(state.serviceKind)) : '';
    const res = await api.get('/admin/orders/stats' + suffix).catch(() => null);
    if (!res) return;
    $('sCntAll').textContent      = res.total;
    $('sCntPending').textContent  = res.pending;
    $('sCntConfirmed').textContent = res.confirmed;
    $('sCntProgress').textContent = res.in_progress;
    $('sCntDone').textContent     = res.done;
    $('sCntCancelled').textContent = res.cancelled;
  }

  async function loadList() {
    const res = await api.get('/admin/orders?' + buildQuery()).catch(() => null);
    if (!res) return;
    let items = res.items || [];
    state.items = items;
    state.total = res.total || items.length;
    render();

    // Auto-open modal if URL has #order-{id}
    const m = location.hash.match(/order-(\d+)/);
    if (m) openDetail(Number(m[1]));
  }

  function renderDeviceInfo(o) {
    const rows = [];
    if (o.bien_so_list) o.bien_so_list.split(', ').forEach(v => rows.push({ label: 'Biển số', val: v, bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }));
    if (o.ten_tk_list) o.ten_tk_list.split(', ').forEach(v => rows.push({ label: 'Tài khoản', val: v, bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' }));
    if (o.imei_list) o.imei_list.split(', ').forEach(v => rows.push({ label: 'IMEI', val: v, bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' }));
    if (o.so_sim_list) o.so_sim_list.split(', ').forEach(v => rows.push({ label: 'SIM', val: v, bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' }));
    if (!rows.length) return '<span style="color:#94a3b8">—</span>';

    const SHOW = 4;
    const visible = rows.slice(0, SHOW);
    const hidden  = rows.slice(SHOW);

    const gridRows = visible.map(r => `
      <div style="display:flex;align-items:center;gap:4px;line-height:1.3">
        <span style="flex:0 0 58px;font-size:10px;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.label)}</span>
        <span style="flex:1;min-width:0;font-size:11px;font-weight:700;color:${r.color};background:${r.bg};border:1px solid ${r.border};border-radius:3px;padding:0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.val)}</span>
      </div>`).join('');

    const moreRow = hidden.length ? `<div style="font-size:10px;color:#94a3b8;text-align:center;letter-spacing:2px;line-height:1">···</div>` : '';

    const tooltipRows = rows.map(r => `
      <div style="display:flex;align-items:center;gap:8px;padding:3px 0;border-bottom:1px solid #f1f5f9">
        <span style="min-width:68px;font-size:11px;color:#64748b">${esc(r.label)}</span>
        <span style="background:${r.bg};color:${r.color};border:1px solid ${r.border};border-radius:4px;padding:1px 8px;font-size:12px;font-weight:700">${esc(r.val)}</span>
      </div>`).join('');

    return `<div class="dev-info-cell" style="position:relative;width:100%">
      <div class="dev-tags" style="display:flex;flex-direction:column;gap:2px;width:100%">${gridRows}${moreRow}</div>
      <div class="dev-tooltip" style="display:none;position:absolute;top:calc(100% + 5px);left:0;z-index:999;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;min-width:220px;box-shadow:0 6px 20px rgba(0,0,0,.15);pointer-events:none">
        ${tooltipRows}
      </div>
    </div>`;
  }
  function renderOrderKind(o) {
    const tpl = esc(o.template_names || o.template_name || '—');
    if (o.service_kind === 'warranty') {
      return `<div style="display:flex;flex-direction:column;gap:4px">
        ${warrantyBadge('Bảo hành', 'blue')}
        <small style="color:#64748b">${tpl}</small>
      </div>`;
    }
    return tpl;
  }

  function render() {
    const $tb = $('tbody');
    if (!state.items.length) {
      $tb.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#94a3b8;padding:30px">Không có đơn nào</td></tr>';
    } else {
      $tb.innerHTML = state.items.map(o => {
        const sCls = pillForStatus(o);
        const pCls = pillForPayment(o.payment_status, o);
        const total = Number(o.total_amount) || 0;
        const paid  = Number(o.paid_amount) || 0;
        const remain = Math.max(0, total - paid);
        const paidCls = paid <= 0 ? 'amt-paid-zero' : 'amt-paid';
        const checked = state.selectedIds.has(o.id) ? 'checked' : '';
        return `
          <tr data-id="${o.id}" style="cursor:pointer">
            <td class="cb-col" data-no-open>
              <input type="checkbox" class="row-cb order-cb" data-id="${o.id}"
                     data-cid="${o.customer_id}" data-cname="${esc(o.customer_name || '')}"
                     data-remain="${remain}" ${checked}>
            </td>
            <td data-label="Mã đơn"><b>${esc(o.code)}</b>${ui.copyCodeBtn(o.code)}</td>
            <td data-label="Ngày tạo">${fmtDate(o.created_at)}</td>
            <td data-label="Khách">
              <div style="display:flex;align-items:center;gap:8px">
                ${o.customer_avatar_url
                  ? `<img src="${esc(o.customer_avatar_url)}" alt="" class="avatar-cell" style="width:30px;height:30px;flex-shrink:0">`
                  : `<div class="avatar-placeholder" style="width:30px;height:30px;font-size:11px;flex-shrink:0">${esc((o.customer_name||'?').trim().charAt(0).toUpperCase())}</div>`}
                <div>
                  ${esc(o.customer_name || '')}<br>
                  <small style="color:#64748b">${esc(o.customer_phone || '')}</small>
                </div>
              </div>
            </td>
            <td data-label="Loại đơn">${renderOrderKind(o)}</td>
            <td data-label="Thông tin">${renderDeviceInfo(o)}</td>
            <td data-label="Tổng tiền" style="text-align:right">
              <span class="amt-total">${fmt(total)}</span><br>
              <small class="${paidCls}">Đã thu: ${fmt(paid)}</small>
              ${remain > 0 ? `<br><small class="amt-remain">Còn: ${fmt(remain)}</small>` : ''}
            </td>
            <td data-label="Trạng thái"><span class="pill ${sCls.cls}">${esc(sCls.label)}</span></td>
            <td data-label="Thanh toán"><span class="pill ${pCls.cls}">${esc(pCls.label)}</span></td>
            <td data-label="Hành động">
              <div class="actions-wrap">
                <button class="btn ghost sm" data-act="open">Xem</button>
                <button class="btn-more" data-act="more" title="Thêm tác vụ">···</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
      $tb.querySelectorAll('tr').forEach(tr => {
        tr.addEventListener('click', (e) => {
          // Không mở modal nếu click vào ô checkbox
          if (e.target.closest('[data-no-open]')) return;
          openDetail(Number(tr.dataset.id));
        });
      });
      // Checkbox events
      $tb.querySelectorAll('.order-cb').forEach(cb => {
        cb.addEventListener('change', () => {
          const id = Number(cb.dataset.id);
          if (cb.checked) state.selectedIds.add(id);
          else state.selectedIds.delete(id);
          syncCbAll();
          updateBulkBar();
        });
      });
      $tb.querySelectorAll('.dev-info-cell').forEach(el => {
        const tip = el.querySelector('.dev-tooltip');
        el.addEventListener('mouseenter', () => { tip.style.display = 'block'; });
        el.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
      });
    }
    syncCbAll();
    const totalPages = Math.max(1, Math.ceil(state.total / state.limit));
    const startRow = state.total === 0 ? 0 : (state.page - 1) * state.limit + 1;
    const endRow = Math.min(state.page * state.limit, state.total);
    $('pagerInfo').textContent = `${startRow} – ${endRow} trong ${state.total} đơn`;
    renderPager(totalPages);
  }

  function renderPager(totalPages) {
    const box = $('pagerPages');
    if (!box) return;
    const cur = state.page;
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (cur > 3) pages.push('…');
      const lo = Math.max(2, cur - 1), hi = Math.min(totalPages - 1, cur + 1);
      for (let i = lo; i <= hi; i++) pages.push(i);
      if (cur < totalPages - 2) pages.push('…');
      pages.push(totalPages);
    }

    const prevDis = cur <= 1 ? 'disabled' : '';
    const nextDis = cur >= totalPages ? 'disabled' : '';
    box.innerHTML = `
      <button ${prevDis} id="pgPrev">«</button>
      <button ${prevDis} id="pgPrevStep">‹</button>
      ${pages.map(p => p === '…'
        ? `<span class="pager-ellipsis">···</span>`
        : `<button class="${p === cur ? 'active' : ''}" data-pg="${p}">${p}</button>`
      ).join('')}
      <button ${nextDis} id="pgNextStep">›</button>
      <button ${nextDis} id="pgNext">»</button>
    `;
    box.querySelector('#pgPrev').addEventListener('click', () => goPage(1));
    box.querySelector('#pgPrevStep').addEventListener('click', () => goPage(cur - 1));
    box.querySelector('#pgNextStep').addEventListener('click', () => goPage(cur + 1));
    box.querySelector('#pgNext').addEventListener('click', () => goPage(totalPages));
    box.querySelectorAll('[data-pg]').forEach(b => {
      b.addEventListener('click', () => goPage(Number(b.dataset.pg)));
    });
  }

  function goPage(p) {
    const totalPages = Math.max(1, Math.ceil(state.total / state.limit));
    p = Math.max(1, Math.min(totalPages, p));
    if (p === state.page) return;
    state.page = p;
    loadList();
  }

  function syncCbAll() {
    const cbAll = $('cbAll');
    if (!cbAll) return;
    const cbs = document.querySelectorAll('.order-cb');
    if (!cbs.length) { cbAll.checked = false; cbAll.indeterminate = false; return; }
    const checkedCount = Array.from(cbs).filter(c => c.checked).length;
    cbAll.checked = checkedCount === cbs.length;
    cbAll.indeterminate = checkedCount > 0 && checkedCount < cbs.length;
  }

  // ---- BULK BAR ------------------------------------------------
  function updateBulkBar() {
    const bar = $('bulkBar');
    const sel = state.selectedIds;
    if (!sel.size) {
      bar.classList.remove('visible');
      return;
    }
    bar.classList.add('visible');

    // Lấy thông tin các đơn đã chọn từ state.items
    const selItems = state.items.filter(o => sel.has(o.id));
    const custIds  = [...new Set(selItems.map(o => o.customer_id))];
    const total    = selItems.reduce((s, o) => s + Math.max(0, (Number(o.total_amount)||0) - (Number(o.paid_amount)||0)), 0);
    const eligibleCount = selItems.filter(o => (Number(o.total_amount)||0) > (Number(o.paid_amount)||0)).length;

    $('bbCount').textContent = sel.size;
    $('bbTotal').textContent = fmt(total) + 'đ';

    if (custIds.length === 1) {
      const cust = selItems[0];
      $('bbCustomer').textContent = cust.customer_name || `ID ${cust.customer_id}`;
      $('btnCreatePR').disabled = eligibleCount <= 0;
    } else if (custIds.length > 1) {
      $('bbCustomer').textContent = `⚠️ ${custIds.length} khách khác nhau`;
      $('btnCreatePR').disabled = true;
    }
  }

  // ---- TẠO PHIẾU YÊU CẦU THANH TOÁN --------------------------------
  async function openCreatePRModal() {
    const sel = state.selectedIds;
    if (!sel.size) { ui.toast('Chưa chọn đơn nào', 'warning'); return; }

    const selItems = state.items.filter(o => sel.has(o.id));
    const custIds  = [...new Set(selItems.map(o => o.customer_id))];

    // Rang buoc: 1 khach hang
    if (custIds.length > 1) {
      ui.toast('⚠️ Chỉ chọn đơn cùng 1 khách hàng để tạo phiếu', 'error');
      return;
    }

    const customerId   = custIds[0];
    const customerName = selItems[0].customer_name || `ID ${customerId}`;
    const orderTotal   = selItems.reduce((s, o) => s + Math.max(0, (Number(o.total_amount)||0) - (Number(o.paid_amount)||0)), 0);
    const eligibleItems = selItems.filter(o => (Number(o.total_amount)||0) > (Number(o.paid_amount)||0));
    if (!eligibleItems.length) {
      ui.toast('Các đơn đã chọn đã thu đủ tiền, không cần tạo phiếu', 'warning');
      return;
    }

    // Lấy opening_balance + phiếu cũ còn nợ + kiểm tra đơn trùng phiếu cùng lúc
    const eligibleIds = eligibleItems.map(o => o.id);
    let openingBalance = 0;
    let overlaps = [];
    let oldPendingPRs = [];
    const [custRes, overlapRes, oldPRsRes] = await Promise.all([
      api.get(`/admin/customers/${customerId}`).catch(() => null),
      api.get(`/admin/payment-requests/check-overlap?order_ids=${eligibleIds.join(',')}`, { silent: true }).catch(() => null),
      api.get(`/admin/payment-requests?customer_id=${customerId}&status=active&has_remaining=1`, { silent: true }).catch(() => null),
    ]);
    if (custRes) openingBalance = Math.max(0, Number(custRes.opening_balance) || 0);
    if (overlapRes) overlaps = overlapRes.overlaps || [];
    if (oldPRsRes) oldPendingPRs = (oldPRsRes.items || []).filter(p => Number(p.remaining) > 0);
    const overlapMap = new Map(overlaps.map(o => [o.order_id, o.existing_request_code]));

    const orderListHtml = selItems.map(o => {
      const remain = Math.max(0, (Number(o.total_amount)||0) - (Number(o.paid_amount)||0));
      const dupCode = overlapMap.get(o.id);
      const dupBadge = dupCode
        ? `<span style="color:#dc2626;font-size:11px;margin-left:6px">⚠ đã có trong ${esc(dupCode)}</span>`
        : '';
      return `<div class="orow" style="${dupCode ? 'opacity:.55' : ''}">
        <div>
          <span class="ocode">${esc(o.code)}</span>${ui.copyCodeBtn(o.code)}
          <small style="color:#64748b;margin-left:6px">${esc(o.template_names || o.template_name || '')}</small>
          ${dupBadge}
        </div>
        <span class="oamt">${fmt(remain)}đ</span>
      </div>`;
    }).join('');

    const dupWarnHtml = overlaps.length
      ? `<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;font-size:13px;color:#92400e;margin-bottom:8px">
           ⚠ <b>${overlaps.length} đơn</b> đã nằm trong phiếu khác — sẽ bị <b>bỏ qua</b> khi tạo phiếu mới:<br>
           ${overlaps.map(w => `• Đơn trùng phiếu <b>${esc(w.existing_request_code)}</b>`).join('<br>')}
         </div>`
      : '';

    const obHtml = openingBalance > 0
      ? `<div class="pyc-ob-row">
           <input type="checkbox" id="pycIncludeOB" style="width:18px;height:18px;accent-color:#2563eb">
           <label for="pycIncludeOB">
             Bao gồm nợ kỳ trước: <b style="color:#dc2626">${fmt(openingBalance)}đ</b>
           </label>
         </div>`
      : '';

    const oldPRHtml = oldPendingPRs.length
      ? `<div style="border-top:1px solid #e2e8f0;padding-top:10px;margin-top:4px">
           <div style="font-size:12.5px;font-weight:600;color:#475569;margin-bottom:6px">Phiếu yêu cầu cũ chưa thanh toán hết:</div>
           ${oldPendingPRs.map(p => `
             <div class="pyc-ob-row">
               <input type="checkbox" id="pycOldPR_${p.id}" data-pr-id="${p.id}" class="pyc-old-pr-cb" style="width:18px;height:18px;accent-color:#2563eb">
               <label for="pycOldPR_${p.id}" style="display:flex;justify-content:space-between;flex:1">
                 <span>${esc(p.code)}</span>
                 <b style="color:#dc2626">${fmt(Number(p.remaining))}đ</b>
               </label>
             </div>`).join('')}
         </div>`
      : '';

    const html = `
      <div class="pyc-modal">
        ${dupWarnHtml}
        <div id="pycErr" class="pyc-err"></div>
        <div class="pyc-summary">
          <div class="row"><span>Khách hàng</span><b>${esc(customerName)}</b></div>
          <div class="row"><span>Số đơn</span><b>${selItems.length} đơn</b></div>
          <div class="row total"><span>Tổng nợ (ước tính)</span><span>${fmt(orderTotal)}đ</span></div>
        </div>
        <div class="pyc-order-list">${orderListHtml}</div>
        ${obHtml}
        ${oldPRHtml}
        <p style="font-size:12.5px;color:#64748b;margin:0">
          ⚠️ Số tiền chính xác sẽ do server tính lại (trừ phần KTV đang giữ).
          Phiếu có hiệu lực 3 ngày.
        </p>
      </div>`;

    const ok = await openSimpleModal('💳 Tạo yêu cầu thanh toán', html, 'Tạo phiếu');
    if (!ok) return;

    const includeOB = !!(document.getElementById('pycIncludeOB') && document.getElementById('pycIncludeOB').checked);
    const oldRequestIds = Array.from(document.querySelectorAll('.pyc-old-pr-cb:checked'))
      .map(el => Number(el.dataset.prId)).filter(n => n > 0);
    closeSimpleModal();

    const body = {
      customer_id: customerId,
      order_ids: eligibleItems.map(o => o.id),
      include_opening_balance: includeOB,
      old_request_ids: oldRequestIds,
    };

    const r = await api.post('/admin/payment-requests', body, { silent: true }).catch(e => {
      // Xử lý lỗi BE trả về
      const msg = (e && e.data && e.data.error) || (e && e.message) || 'Lỗi không xác định';
      ui.toast(msg, 'error');
      return null;
    });

    if (!r) return;

    const skipped = r.skipped_orders || [];
    if (skipped.length) {
      ui.toast(`✅ Phiếu ${r.code} tạo, bỏ qua ${skipped.length} đơn đã trùng`, 'success', 4000);
    } else {
      ui.toast(`✅ Đã tạo phiếu ${r.code}!`, 'success');
    }
    state.selectedIds.clear();
    updateBulkBar();
    setTimeout(() => {
      window.location.href = `/admin/payment-request-detail.html?id=${r.request_id}`;
    }, 900);
  }

  const STATUS_LABELS = {
    pending:     'Chờ xác nhận',
    confirmed:   'Đang xử lý',
    in_progress: 'Đang giao',
    done:        'Hoàn thành',
    cancelled:   'Đã huỷ',
  };
  function pillForStatus(o) {
    const label = STATUS_LABELS[o.status] || o.status;
    if (o.status === 'pending')     return { cls: 'amber', label };
    if (o.status === 'cancelled')   return { cls: 'gray',  label };
    if (o.status === 'done')        return { cls: 'green', label };
    if (o.status === 'in_progress') return { cls: 'blue',  label };
    return { cls: 'purple', label };
  }
  function pillForPayment(p, o) {
    const map = {
      unpaid:                 { cls: 'gray',   label: 'Chưa trả' },
      partial:                { cls: 'amber',  label: 'Một phần' },
      paid:                   { cls: 'green',  label: 'Đã trả' },
      customer_owes:          { cls: 'red',    label: 'KH nợ' },
      staff_owes:             { cls: 'amber',  label: 'KTV giữ' },
      pending_admin_confirm:  { cls: 'purple', label: 'Chờ xác nhận' },
      refunded:               { cls: 'gray',   label: 'Đã hoàn' },
    };
    return map[p] || { cls: 'gray', label: p || '' };
  }

  // ---- MODAL DETAIL --------------------------------------------
  async function openDetail(id) {
    $('modal').classList.add('open');
    $('odBody').innerHTML = '<p style="text-align:center;color:#94a3b8">Đang tải…</p>';
    state.photosExpanded = false;
    const [res, pendingRes, payHistRes] = await Promise.all([
      api.get('/admin/orders/' + id).catch(() => null),
      api.get('/admin/orders/' + id + '/admin-pending').catch(() => null),
      api.get('/admin/orders/' + id + '/payment-history').catch(() => null),
    ]);
    if (!res) { $('odBody').innerHTML = '<p style="color:#dc2626">Không tải được</p>'; return; }
    state.currentDetail = res;
    state.currentDetail._adminPending = (pendingRes && pendingRes.items) || [];
    state.currentDetail._payHistory = payHistRes || null;
    location.hash = 'order-' + id;
    try {
      renderDetail();
    } catch (err) {
      console.error('[openDetail] renderDetail lỗi:', err);
      $('odBody').innerHTML = `<p style="color:#dc2626;padding:20px">Lỗi hiển thị: ${err.message}</p>`;
    }
  }

  function closeDetail() {
    $('modal').classList.remove('open');
    state.currentDetail = null;
    state.photosExpanded = false;
    state.products = null;
    if (location.hash.startsWith('#order-')) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }

  function renderDetail() {
    const o = state.currentDetail;
    const lines = o.lines || [];
    const tplNames = lines.map(l => l.template_name).filter(Boolean).join(' + ');

    const isWarranty = o.service_kind === 'warranty';
    if (isWarranty) {
      $('modalTitle').innerHTML = `
        <style>
          @keyframes warrantyHelpBlink {
            0%, 100% { background-color: #e0f2fe; box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
            50% { background-color: #0284c7; box-shadow: 0 0 0 6px rgba(14, 165, 233, 0); color: #fff; }
          }
          .warranty-help-blink {
            animation: warrantyHelpBlink 1.5s infinite ease-in-out;
            border: none;
            border-radius: 50%;
            width: 22px;
            height: 22px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 700;
            color: #0369a1;
            cursor: pointer;
            margin-left: 6px;
            vertical-align: middle;
            outline: none;
          }
        </style>
        ${esc(o.code)}${ui.copyCodeBtn(o.code)} <button type="button" id="btnHelpWarranty" class="warranty-help-blink" title="Hướng dẫn quy trình bảo hành">?</button><span style="font-weight:400;color:#64748b"> — ${esc(tplNames || '')}</span>
      `;
    } else {
      $('modalTitle').innerHTML = `${esc(o.code)}${ui.copyCodeBtn(o.code)}<span style="font-weight:400;color:#64748b"> — ${esc(tplNames || '')}</span>`;
    }

    const lineSum = lines.reduce((s, l) => s + Number(l.subtotal || 0), 0);
    const remain = Math.max(0, Number(o.total_amount) - Number(o.paid_amount));

    const sCls = pillForStatus(o);
    const pCls = pillForPayment(o.payment_status, o);

    $('odBody').innerHTML = `
      <div class="od-section">
        <div style="display:flex;gap:14px;flex-wrap:wrap">
          <div style="flex:1;min-width:240px">
            <div><b>Khách:</b> ${esc(o.customer_name || '')} ${o.customer_phone ? `— ${esc(o.customer_phone)}` : ''}
              <span style="font-size:11px;color:#64748b;margin-left:4px">(${o.customer_type === 'dealer' ? 'Đại lý' : 'Khách lẻ'})</span>
            </div>
            ${o.customer_type === 'dealer' ? `
            <div style="margin:6px 0;padding:8px 10px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px">
              <div style="font-size:11.5px;font-weight:700;color:#0369a1;margin-bottom:4px">👤 Khách đầu cuối của đại lý</div>
              ${o.end_customer_id ? `
                <div style="font-size:13px">
                  <b>${esc(o.end_customer_name || '')}</b>
                  ${o.end_customer_phone ? ` — ${esc(o.end_customer_phone)}` : ''}
                  <span style="color:#94a3b8;font-size:11px"> (${esc(o.end_customer_code || '')})</span>
                </div>
                <div style="margin-top:4px;display:flex;gap:6px">
                  <button class="btn ghost sm" id="btnAdminChangeEC">✏️ Đổi khách</button>
                  <button class="btn ghost sm" id="btnAdminUnlinkEC" style="color:#dc2626">✕ Gỡ</button>
                </div>
              ` : `
                <div style="font-size:12.5px;color:#64748b;margin-bottom:4px">Chưa có khách đầu cuối</div>
                <button class="btn sm" id="btnAdminLinkEC">+ Gán / Tạo khách</button>
              `}
            </div>` : ''}
            <div><b>Loại đơn:</b> ${o.service_kind === 'warranty' ? 'Bảo hành' : esc(tplNames || '—')}${o.service_kind === 'warranty' && tplNames ? ` <small style="color:#64748b">· ${esc(tplNames)}</small>` : ''}</div>
            <div><b>Địa chỉ:</b> ${esc(o.address || '—')}</div>
            <div style="margin-top:4px">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <b>Ghi chú:</b>
              </div>
              <textarea id="orderNote" class="input" rows="2" style="width:100%;resize:vertical"
                placeholder="Ghi chú đơn hàng…">${esc(o.note || '')}</textarea>
              <div style="text-align:right;margin-top:4px">
                <button class="btn ghost sm" id="btnSaveOrderNote">💾 Lưu ghi chú</button>
              </div>
            </div>
          </div>
          <div style="flex:1;min-width:240px">
            <div>Trạng thái: <span class="pill ${sCls.cls}">${esc(sCls.label)}</span> · <span class="pill ${pCls.cls}">${esc(pCls.label)}</span>${o.collected_for_dealer ? ' · <span class="pill amber" title="Đơn thu hộ đại lí">🏪 Thu hộ ĐL</span>' : ''}</div>
            <div><b>KTV:</b> ${esc(o.staff_name || '_ không có kỹ thuật viên ở đơn này')} ${o.wage_amount ? `(công: ${fmt(o.wage_amount)}đ)` : ''}</div>
            <div><b>Tạo:</b> ${fmtDate(o.created_at)}</div>
            <div><b>Hoàn thành:</b> ${fmtDate(o.completed_at)}</div>
          </div>
        </div>
        ${!o.staff_name ? `
        <div style="
          display:flex;align-items:center;gap:10px;
          margin-top:14px;padding:12px 16px;
          background:linear-gradient(135deg,#fffbeb,#fef3c7);
          border:1.5px solid #fbbf24;border-radius:10px;
          box-shadow:0 2px 8px rgba(251,191,36,.2);
          animation:ktvWarn .4s ease;
        ">
          <span style="font-size:22px;flex-shrink:0">⚠️</span>
          <div>
            <div style="font-weight:700;color:#92400e;font-size:13.5px">Chưa gán kỹ thuật viên!</div>
            <div style="font-size:12.5px;color:#b45309;margin-top:2px">Đơn này chưa có KTV phụ trách — nhớ gán KTV và cập nhật <b>tiền lương</b> trước khi hoàn tất.</div>
          </div>
        </div>` : ''}
      </div>

      <div class="od-section">
        <h4>Tiến trình <button class="btn ghost sm" id="btnReloadDetail" style="margin-left:auto">⟳</button></h4>
        <div class="timeline" id="timeline"></div>
        <div style="margin-top:10px">
          <label style="font-size:13px;color:#334155;font-weight:600;display:block;margin-bottom:4px">Thực tế hiện tại <span style="font-weight:400;color:#94a3b8">(chỉ ghi thêm, không sửa/xoá)</span></label>
          <div id="progressNoteLog" style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;font-size:13px;color:#0f172a;max-height:220px;overflow:auto;${(o.progress_note||'').trim() ? '' : 'color:#94a3b8'}">${esc((o.progress_note||'').trim() || 'Chưa có ghi chú')}</div>
          <textarea id="progressNote" class="input" rows="2" placeholder="Nhập nội dung cần ghi thêm..." style="margin-top:8px"></textarea>
          <div style="margin-top:6px;text-align:right">
            <button class="btn ghost sm" id="btnSaveProgressNote">➕ Ghi thêm</button>
          </div>
        </div>
      </div>

      ${renderWarrantySectionV2()}

      ${o.service_kind === 'warranty' ? '' : `
      <div class="od-section">
        <h4>Dòng công việc
          <button class="btn ghost sm" id="btnEditLines">Sửa nội dung</button>
        </h4>
        <div id="linesList"></div>
      </div>`}

      <div class="od-section">
        <h4>Ảnh các bước</h4>
        <div class="photo-list" id="photoList"></div>
      </div>

      <div class="od-section" id="commissionSection"></div>

      <div class="od-section" id="ktvReqSection">
        <h4>Đề xuất cập nhật khách từ KTV</h4>
        <div id="ktvReqList"></div>
      </div>

      <div class="od-section">
        <div class="bill">
          <div class="row"><span>Tổng dòng công việc</span><span>${fmt(lineSum)}đ</span></div>
          <div class="row total"><span>Tổng đơn</span><span>${fmt(o.total_amount)}đ</span></div>
          <div class="row"><span>Đã thu</span><span>${fmt(o.paid_amount)}đ</span></div>
          ${remain > 0 ? `<div class="row remain"><span>Còn lại</span><span>${fmt(remain)}đ</span></div>` : ''}
        </div>
      </div>

      <div class="od-section" id="payHistSection"></div>

    `;

    renderTimeline();
    renderLinesList();
    renderPhotoList();
    renderKtvRequests();
    renderCommission();
    renderActions();
    renderAdminPending();
    renderPaymentHistory();
    $('btnReloadDetail').addEventListener('click', () => openDetail(o.id));
    if ($('btnEditLines')) $('btnEditLines').addEventListener('click', editLines);
    if ($('btnEditWarrantyV2')) $('btnEditWarrantyV2').addEventListener('click', openWarrantyEditorV2);
    if ($('btnSaveProgressNote')) {
      $('btnSaveProgressNote').addEventListener('click', async () => {
        const v = $('progressNote').value.trim();
        if (!v) { ui.toast('Nhập nội dung cần ghi thêm', 'warning'); return; }
        const r = await api.patch(`/admin/orders/${o.id}/progress-note`,
          { progress_note: v }, { onError: 'toast' });
        if (r) { ui.toast('Đã ghi thêm', 'success'); openDetail(o.id); }
      });
    }
    if ($('btnSaveOrderNote')) {
      $('btnSaveOrderNote').addEventListener('click', async () => {
        const v = $('orderNote').value.trim();
        const r = await api.put(`/admin/orders/${o.id}`, { note: v || null }, { onError: 'toast' });
        if (r) { ui.toast('Đã lưu ghi chú', 'success'); state.currentDetail.note = v || null; }
      });
    }
    // Nut gan / go khach dau cuoi (admin)
    if ($('btnAdminLinkEC') || $('btnAdminChangeEC')) {
      const btnLink = $('btnAdminLinkEC') || $('btnAdminChangeEC');
      if (btnLink) btnLink.addEventListener('click', () => openAdminEndCustomerDialog());
    }
    if ($('btnAdminUnlinkEC')) {
      $('btnAdminUnlinkEC').addEventListener('click', async () => {
        const yes = await ui.confirm({ title: 'Gỡ khách đầu cuối?', okText: 'Gỡ', danger: true });
        if (!yes) return;
        const r = await api.patch(`/admin/orders/${o.id}/end-customer`,
          { action: 'unlink' }, { onError: 'toast' });
        if (r) { ui.toast('Đã gỡ', 'success'); openDetail(o.id); }
      });
    }

    // Delegate: nut hanh dong admin tren tung item bao hanh
    $('odBody').querySelectorAll('.btnAdminWarrantyItemAction, .btnAdminWarrantyDeliverNew').forEach(btn => {
      btn.addEventListener('click', async () => {
        const itemId = Number(btn.dataset.itemId);
        const o = state.currentDetail;
        if (!itemId || !o || !o.warranty) return;
        const item = (o.warranty.items || []).find(it => it.id === itemId);
        if (!item) return;
        await openAdminWarrantyStatusModal(item);
      });
    });

    const $btnHelpWarranty = $('btnHelpWarranty');
    if ($btnHelpWarranty) {
      $btnHelpWarranty.addEventListener('click', () => {
        ui.confirm({
          title: 'Hướng dẫn quy trình xử lý Bảo hành (Admin / Nhân viên)',
          body: `
            <div style="font-family:system-ui, -apple-system, sans-serif; font-size:13.5px; line-height:1.6; color:#334155; max-height:420px; overflow-y:auto; padding-right:8px">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:14px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:10px 12px; color:#1e40af">
                <span style="font-size:20px">💡</span>
                <span><b>Hướng dẫn quy trình xử lý sản phẩm lỗi & thay thế trong Đơn bảo hành</b></span>
              </div>
              
              <div style="margin-bottom:14px">
                <h4 style="margin:0 0 6px 0; color:#1e293b; font-size:14px">📌 1. Các hành động xử lý sản phẩm lỗi của khách</h4>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; font-size:12.5px; color:#475569">
                  • <b>Mới tiếp nhận (Intake):</b> Nhận máy lỗi ban đầu từ khách hàng.<br>
                  • <b>Sửa nội bộ / Khắc phục xong tại chỗ:</b> Kỹ thuật tự xử lý lỗi và bàn giao lại trực tiếp cho khách hàng.<br>
                  • <b>Thu hồi về kho:</b> Đối với Admin/Nhân viên, khi nhấn thu hồi thì sản phẩm lỗi sẽ <b>chuyển thẳng về kho công ty</b> (không vào túi KTV).
                </div>
              </div>

              <div style="margin-bottom:14px">
                <h4 style="margin:0 0 6px 0; color:#1e293b; font-size:14px">🔄 2. Cấp hàng đổi mới (Đổi thiết bị)</h4>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; font-size:12.5px; color:#475569">
                  • <b>Chọn nguồn cấp:</b> Admin/Nhân viên có thể cấp hàng thay thế từ <b>kho công ty</b> hoặc từ <b>túi của KTV</b> được phân công.<br>
                  • <b>Thao tác chọn:</b> Hệ thống cho phép chọn cùng lúc nhiều sản phẩm, điều chỉnh số lượng và xem trước ảnh sản phẩm trực quan.<br>
                  • <b>Xác nhận cấp:</b> Sau khi chọn, một dialog tóm tắt danh sách sản phẩm và số lượng sẽ hiện ra để xác nhận đầy đủ trước khi thực hiện.
                </div>
              </div>

              <div style="margin-bottom:14px">
                <h4 style="margin:0 0 6px 0; color:#1e293b; font-size:14px">📦 3. Gửi bảo hành nhà cung cấp (NCC)</h4>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; font-size:12.5px; color:#475569">
                  • Chuyển tiếp sản phẩm lỗi sang NCC bảo hành.<br>
                  • Khi NCC bảo hành xong và trả lại hàng, admin cập nhật nhận hàng từ NCC về kho, sau đó tiến hành bàn giao lại cho khách hàng.
                </div>
              </div>

              <div>
                <h4 style="margin:0 0 6px 0; color:#1e293b; font-size:14px">💰 4. Hoàn thành đơn hàng bảo hành</h4>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; font-size:12.5px; color:#475569">
                  • Với đơn bảo hành có tổng chi phí phát sinh &le; 0đ, khi bấm Hoàn thành, hệ thống sẽ tự động cập nhật trạng thái thanh toán thành <b>Đã trả (Paid)</b> thay vì để trống hoặc ghi nhận nợ.
                </div>
              </div>
            </div>
          `,
          okText: 'Đã hiểu',
          cancelText: 'Đóng'
        });
      });
    }
  }

  // ---- ADMIN: Gan / Tao khach dau cuoi cho don dai ly -------
  async function openAdminEndCustomerDialog() {
    const o = state.currentDetail;
    let selectedCustomer = null;
    let searchTimer = null;

    const html = `
      <div style="padding:14px">
        <div style="display:flex;gap:8px;margin-bottom:14px">
          <button class="btn" id="ecAdminTabCreate" style="flex:1">✨ Tạo khách mới</button>
          <button class="btn ghost" id="ecAdminTabSearch" style="flex:1">🔍 Chọn có sẵn</button>
        </div>
        <div id="ecAdminPaneCreate">
          <div class="field"><label>Họ tên <span style="color:#dc2626">*</span></label>
            <input id="ecAdminName" type="text" class="input" placeholder="Tên khách hàng"></div>
          <div class="field"><label>Số điện thoại</label>
            <input id="ecAdminPhone" type="text" class="input" placeholder="0xxxxxxxxx"></div>
          <div class="field"><label>Địa chỉ</label>
            <input id="ecAdminAddr" type="text" class="input" placeholder="Địa chỉ (tuỳ chọn)"></div>
          <div class="field"><label>Ghi chú</label>
            <input id="ecAdminNote" type="text" class="input" placeholder="Ghi chú (tuỳ chọn)"></div>
        </div>
        <div id="ecAdminPaneSearch" style="display:none">
          <div class="field"><label>Tìm theo tên / SĐT / mã</label>
            <input id="ecAdminSearchQ" type="text" class="input" placeholder="Nhập để tìm…"></div>
          <div id="ecAdminResults" style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;margin-top:6px"></div>
          <div id="ecAdminSel" style="display:none;margin-top:8px;padding:8px 10px;background:#f0f9ff;border-radius:8px;font-size:13px"></div>
        </div>
      </div>`;

    const okPromise = openSimpleModal('Gán khách đầu cuối', html, 'Lưu');
    let activeTab = 'create';

    function switchTab(tab) {
      activeTab = tab;
      document.getElementById('ecAdminPaneCreate').style.display = tab === 'create' ? '' : 'none';
      document.getElementById('ecAdminPaneSearch').style.display = tab === 'search' ? '' : 'none';
      document.getElementById('ecAdminTabCreate').className = tab === 'create' ? 'btn' : 'btn ghost';
      document.getElementById('ecAdminTabSearch').className = tab === 'search' ? 'btn' : 'btn ghost';
    }
    document.getElementById('ecAdminTabCreate').addEventListener('click', () => switchTab('create'));
    document.getElementById('ecAdminTabSearch').addEventListener('click', () => switchTab('search'));

    const $sq = document.getElementById('ecAdminSearchQ');
    const $sr = document.getElementById('ecAdminResults');
    const $sel = document.getElementById('ecAdminSel');
    async function doSearch() {
      const q = $sq.value.trim();
      const r = await api.get('/admin/orders/customers/search' + (q ? `?q=${encodeURIComponent(q)}` : '')).catch(() => null);
      if (!r) return;
      if (!r.items.length) { $sr.innerHTML = '<div style="padding:10px;font-size:13px;color:#64748b">Không tìm thấy</div>'; return; }
      $sr.innerHTML = r.items.map(c => `
        <div class="ec-item" data-id="${c.id}" style="padding:9px 12px;cursor:pointer;border-bottom:1px solid #f1f5f9;font-size:13px">
          <b>${c.full_name}</b>${c.phone ? ` · ${c.phone}` : ''} <span style="color:#94a3b8;font-size:11px">(${c.code})</span>
        </div>`).join('');
      $sr.querySelectorAll('.ec-item').forEach(el => {
        el.addEventListener('mouseenter', () => el.style.background = '#f0f9ff');
        el.addEventListener('mouseleave', () => el.style.background = '');
        el.addEventListener('click', () => {
          selectedCustomer = r.items.find(c => c.id === Number(el.dataset.id));
          $sel.style.display = '';
          $sel.innerHTML = `✅ Đã chọn: <b>${selectedCustomer.full_name}</b>${selectedCustomer.phone ? ` · ${selectedCustomer.phone}` : ''}`;
          $sr.innerHTML = '';
        });
      });
    }
    $sq.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(doSearch, 300); });

    const ok = await okPromise;
    if (!ok) return;

    let body;
    if (activeTab === 'create') {
      const name = (document.getElementById('ecAdminName').value || '').trim();
      if (!name) { ui.toast('Nhập họ tên khách', 'error'); closeSimpleModal(); return; }
      body = { action: 'create', full_name: name,
        phone: document.getElementById('ecAdminPhone').value.trim() || null,
        address: document.getElementById('ecAdminAddr').value.trim() || null,
        note: document.getElementById('ecAdminNote').value.trim() || null };
    } else {
      if (!selectedCustomer) { ui.toast('Chưa chọn khách nào', 'error'); closeSimpleModal(); return; }
      body = { action: 'link', customer_id: selectedCustomer.id };
    }
    closeSimpleModal();
    const r = await api.patch(`/admin/orders/${o.id}/end-customer`, body, { onError: 'toast' });
    if (r) { ui.toast('Đã gán khách đầu cuối', 'success'); openDetail(o.id); }
  }

  function renderTimeline() {
    const o = state.currentDetail;
    const $box = $('timeline');
    // 4 trang thai cung + cancelled
    const FLOW = [
      { code: 'pending',     label: 'Đang chờ' },
      { code: 'confirmed',   label: 'Lên đơn' },
      { code: 'in_progress', label: 'Đang xử lý' },
      { code: 'done',        label: 'Đã xong' },
    ];
    const curIdx = FLOW.findIndex(s => s.code === o.status);
    const cancelled = o.status === 'cancelled';

    const stepperHtml = FLOW.map((s, idx) => {
      let cls = '';
      if (cancelled) cls = '';
      else if (curIdx >= 0 && idx < curIdx) cls = 'done';
      else if (idx === curIdx) cls = 'current';
      return `
        <div class="stepper-step ${cls}" data-code="${s.code}">
          <div class="stepper-dot">${cls === 'done' ? '✓' : (idx + 1)}</div>
          <div class="stepper-label">${esc(s.label)}</div>
        </div>`;
    }).join('');

    // Cac trang thai user co the chuyen toi
    const targets = [];
    if (o.status === 'pending')         targets.push({ code: 'confirmed', label: 'Lên đơn' });
    else if (o.status === 'confirmed')  targets.push({ code: 'in_progress', label: 'Đang xử lý' }, { code: 'done', label: 'Đã xong' });
    else if (o.status === 'in_progress') targets.push({ code: 'done', label: 'Đã xong' }, { code: 'confirmed', label: '← Quay lại lên đơn' });

    const actionHtml = cancelled
      ? `<div class="stepper-action"><div class="next-label" style="color:#dc2626">Đơn đã huỷ</div></div>`
      : (o.status === 'done'
          ? `<div class="stepper-action"><div class="next-label" style="color:#16a34a">Đã hoàn thành</div></div>`
          : `<div class="stepper-action" style="display:flex;gap:6px;flex-wrap:wrap">
               ${targets.map(t => `<button class="btn sm btn-jump" data-step="${esc(t.code)}">${esc(t.label)}</button>`).join('')}
             </div>`);

    $box.innerHTML = `<div class="stepper">${stepperHtml}</div>${actionHtml}`;
    $box.querySelectorAll('.btn-jump').forEach(b => {
      b.addEventListener('click', () => transitionTo(b.dataset.step));
    });
  }

  async function transitionTo(stepCode) {
    const yes = await ui.confirm({ title: `Chuyển sang bước "${stepCode}"?`, okText: 'Chuyển' });
    if (!yes) return;
    const ok = await api.post(`/admin/orders/${state.currentDetail.id}/transition`,
      { step_code: stepCode }, { onError: 'toast' });
    if (ok) {
      ui.toast('Đã chuyển', 'success');
      openDetail(state.currentDetail.id);
      loadList();
    }
  }

  // ============================================================
  // ADMIN: PANEL BAO HANH DAY DU (port tu KTV, co dieu chinh)
  // ============================================================
  const ADMIN_WARRANTY_HANDLING_LABEL = {
    tech_fix: '🔧 Sửa nội bộ',
    exchange: '🔄 Đổi thiết bị',
    supplier_return: '📦 Gửi NCC',
    pending: '❓ Chưa phân loại',
  };

  // CTA chinh cho tung item (nhu KTV nhung co them move_to_company_stock)
  function adminGetWarrantyPrimaryActionInfo(item) {
    const actions = new Set((item && item.available_actions) || []);
    const hasAssignedReplacement = !!(item && item.replacement_product_id && item.replacement_staff_id);
    if (!item || item.customer_status === 'completed' || item.current_status === 'delivered' || item.current_location === 'customer_returned') {
      return { actionable: false, button: 'Sản phẩm đã xong', hint: 'Sản phẩm này đã hoàn tất.' };
    }
    const options = [];
    if (actions.has('mark_fixed')) options.push({ actionCode: 'mark_fixed' });
    if (actions.has('receive_from_customer')) options.push({ actionCode: 'receive_from_customer' });
    if (actions.has('move_to_company_stock')) options.push({ actionCode: 'move_to_company_stock' });
    if (actions.has('reserve_replacement_from_technician') && !hasAssignedReplacement) options.push({ actionCode: 'reserve_replacement_from_technician' });
    if (actions.has('reserve_replacement_from_company') && !hasAssignedReplacement && item.current_status !== 'supplier_returned') options.push({ actionCode: 'reserve_replacement_from_company', sourceMode: null });
    if (actions.has('deliver_to_customer') && (item.handling_type === 'tech_fix' || hasAssignedReplacement)) options.push({ actionCode: 'deliver_to_customer' });
    const canDeliverDirect = actions.has('deliver_to_customer') && item.current_status === 'supplier_returned' && !item.replacement_product_id;
    if (canDeliverDirect && !options.some(o => o.actionCode === 'deliver_to_customer')) options.push({ actionCode: 'deliver_to_customer' });

    if (!options.length) {
      return { actionable: false, button: 'Đang chờ xử lý', hint: 'Sản phẩm hiện chưa có thao tác phù hợp.' };
    }
    const top = options[0];
    const LABELS = {
      mark_fixed: 'Sửa xong – trả khách', receive_from_customer: 'Tiếp nhận từ khách',
      move_to_company_stock: 'Thu hồi về kho', reserve_replacement_from_technician: 'Cấp hàng đổi (túi KTV)',
      reserve_replacement_from_company: 'Cấp hàng đổi (kho)', deliver_to_customer: 'Giao cho khách',
    };
    return { actionable: true, button: LABELS[top.actionCode] || top.actionCode, hint: '', _options: options };
  }

  // Build danh sach lua chon (tuong tu KTV nhung admin co them move_to_company_stock)
  function adminBuildWarrantyDecisionOptions(item, context) {
    const actions = new Set((item && item.available_actions) || []);
    const holdings = (context && context.technicianHoldings) || [];
    const companyStock = (context && context.companyStock) || [];
    const hasAssignedReplacement = !!(item && item.replacement_product_id && item.replacement_staff_id);

    // Khach mang thang den: phase 1 (intake / chua nhan)
    if (item.current_status === 'intake' && item.current_location === 'customer') {
      return [
        { actionCode: 'receive_to_stock', label: '📥 Tiếp nhận – vào kho ngay', description: 'Khách mang máy đến công ty trực tiếp. Tiếp nhận và đưa thẳng vào kho bảo hành — bỏ qua bước túi KTV.', enabled: true },
        { actionCode: 'mark_fixed', label: '🔧 Tự xử lý xong tại chỗ', description: 'Sửa xong tại chỗ, khách nhận lại máy luôn.', enabled: actions.has('mark_fixed') },
        { actionCode: 'note', label: '📝 Chờ xử lý – chỉ ghi chú', description: 'Chưa làm gì, chỉ ghi nhận tình trạng.', enabled: true },
      ];
    }

    const choices = [];
    const push = (actionCode, extra = {}) => {
      const LABELS = {
        mark_fixed: '🔧 Sửa xong – trả khách', move_to_company_stock: '🏢 Thu hồi về kho',
        reserve_replacement_from_technician: '🔄 Cấp hàng đổi từ túi KTV',
        reserve_replacement_from_company: '🏪 Cấp hàng đổi từ kho công ty',
        deliver_to_customer: '✅ Giao hàng cho khách',
        note: '📝 Ghi chú thêm',
      };
      choices.push({
        actionCode, label: extra.label || LABELS[actionCode] || actionCode,
        description: extra.description || '',
        enabled: extra.enabled !== false,
        sourceMode: extra.sourceMode || null,
      });
    };

    if (actions.has('mark_fixed')) push('mark_fixed', { description: 'Sửa xong, khách nhận lại thiết bị đã sửa.' });
    if (actions.has('move_to_company_stock')) push('move_to_company_stock', { description: 'Thu hồi sản phẩm từ KTV về kho bảo hành để xử lý tiếp.' });
    if (actions.has('reserve_replacement_from_technician') && !hasAssignedReplacement) {
      push('reserve_replacement_from_technician', { enabled: holdings.length > 0, description: holdings.length ? 'Phân hàng đổi từ túi KTV cho khách.' : 'Không có hàng trong túi KTV.' });
    }
    if (actions.has('reserve_replacement_from_company') && !hasAssignedReplacement && item.current_status !== 'supplier_returned') {
      push('reserve_replacement_from_company', { enabled: companyStock.length > 0, description: companyStock.length ? 'Xuất hàng từ kho công ty để đổi cho khách.' : 'Kho công ty không có hàng phù hợp.' });
    }
    if (actions.has('deliver_to_customer') && (item.handling_type === 'tech_fix' || hasAssignedReplacement || item.current_status === 'supplier_returned')) {
      push('deliver_to_customer', { description: 'Xác nhận giao hàng lại cho khách.' });
    }
    push('note', { description: 'Ghi nhận tiến độ hoặc thêm thông tin mà không thay đổi trạng thái.' });
    return choices;
  }

  function adminRenderDecisionPanel(choice, context) {
    if (!choice) return '<div style="padding:12px;border:1px dashed #cbd5e1;border-radius:10px;color:#64748b">Chọn 1 thao tác để tiếp tục.</div>';
    const holdings = (context && context.technicianHoldings) || [];
    const companyStock = (context && context.companyStock) || [];
    const prefillSelectedProducts = (context && context.prefillSelectedProducts) || [];
    const infoBox = `<div style="padding:12px;border:1px solid #dbeafe;border-radius:10px;background:#f8fbff;color:#1e3a8a;font-size:13px;line-height:1.5">${esc(choice.description || '')}</div>`;
    if (choice.actionCode === 'mark_fixed') {
      return `${infoBox}<div class="field" style="margin-top:12px"><label>Chi phí thêm (nếu có)</label><input id="waCost" class="input" inputmode="numeric" value="0"></div>`;
    }
    if (choice.actionCode === 'reserve_replacement_from_technician') {
      let productRows = '';
      if (!holdings.length) {
        productRows = '<div style="padding:12px;color:#ef4444;font-size:13px;font-weight:600">Không có sản phẩm nào trong túi KTV.</div>';
      } else {
        productRows = holdings.map(h => {
          const imgUrl = h.image_url || '';
          const isPrefilled = prefillSelectedProducts.find(x => x.product_id === h.product_id);
          const qtyVal = isPrefilled ? isPrefilled.qty : 1;
          return `
            <div class="product-selection-item" data-id="${h.product_id}" data-name="${esc(h.product_name || '')}" data-max="${h.qty}"
                 style="display:flex;align-items:center;gap:12px;padding:10px;border:1.5px solid ${isPrefilled ? '#3b82f6' : '#e2e8f0'};border-radius:10px;background:${isPrefilled ? '#f0f7ff' : '#fff'};transition:all 0.15s;margin-bottom:8px;cursor:pointer">
              <input type="checkbox" class="product-select-checkbox" data-id="${h.product_id}" ${isPrefilled ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer">
              <img src="${imgUrl}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;background:#f1f5f9" 
                onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%222%22><rect x=%223%22 y=%223%22 width=%2218%22 height=%2218%22 rx=%222%22/><circle cx=%228.5%22 cy=%228.5%22 r=%221.5%22/><path d=%22M21 15l-5-5L5 21%22/></svg>'">
              <div style="flex:1;min-width:0">
                <div style="font-size:13.5px;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h.product_code ? `[${esc(h.product_code)}] ` : ''}${esc(h.product_name || '')}</div>
                <div style="font-size:12px;color:#64748b;margin-top:2px">Còn lại trong túi: <span style="font-weight:700;color:#2563eb">${fmt(h.qty)}</span> ${h.staff_name ? `(${esc(h.staff_name)})` : ''}</div>
              </div>
              <div class="qty-selector" style="display:${isPrefilled ? 'flex' : 'none'};align-items:center;gap:6px">
                <button type="button" class="btn-qty-minus" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:1.5px solid #cbd5e1;border-radius:6px;background:#f8fafc;cursor:pointer;font-weight:700;font-size:14px;color:#475569">-</button>
                <input type="number" class="product-qty-input" value="${qtyVal}" min="1" max="${h.qty}" style="width:48px;height:26px;text-align:center;border:1.5px solid #cbd5e1;border-radius:6px;font-size:13px;font-weight:700;color:#0f172a">
                <button type="button" class="btn-qty-plus" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:1.5px solid #cbd5e1;border-radius:6px;background:#f8fafc;cursor:pointer;font-weight:700;font-size:14px;color:#475569">+</button>
              </div>
            </div>
          `;
        }).join('');
      }
      return `
        ${infoBox}
        <div class="field" style="margin-top:12px">
          <label style="font-weight:700;font-size:13.5px;color:#334155;margin-bottom:8px;display:block">Chọn sản phẩm đổi từ túi KTV</label>
          <div class="product-selection-list" style="max-height:280px;overflow-y:auto;padding-right:4px">${productRows}</div>
        </div>
      `;
    }
    if (choice.actionCode === 'reserve_replacement_from_company' && choice.sourceMode !== 'supplier_returned_item') {
      let productRows = '';
      if (!companyStock.length) {
        productRows = '<div style="padding:12px;color:#ef4444;font-size:13px;font-weight:600">Không có sản phẩm nào trong kho công ty.</div>';
      } else {
        productRows = companyStock.map(p => {
          const imgUrl = p.image_url || '';
          const isPrefilled = prefillSelectedProducts.find(x => x.product_id === p.product_id);
          const qtyVal = isPrefilled ? isPrefilled.qty : 1;
          return `
            <div class="product-selection-item" data-id="${p.product_id}" data-name="${esc(p.name || '')}" data-max="${p.quantity}"
                 style="display:flex;align-items:center;gap:12px;padding:10px;border:1.5px solid ${isPrefilled ? '#3b82f6' : '#e2e8f0'};border-radius:10px;background:${isPrefilled ? '#f0f7ff' : '#fff'};transition:all 0.15s;margin-bottom:8px;cursor:pointer">
              <input type="checkbox" class="product-select-checkbox" data-id="${p.product_id}" ${isPrefilled ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer">
              <img src="${imgUrl}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;background:#f1f5f9" 
                onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%222%22><rect x=%223%22 y=%223%22 width=%2218%22 height=%2218%22 rx=%222%22/><circle cx=%228.5%22 cy=%228.5%22 r=%221.5%22/><path d=%22M21 15l-5-5L5 21%22/></svg>'">
              <div style="flex:1;min-width:0">
                <div style="font-size:13.5px;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.code ? `[${esc(p.code)}] ` : ''}${esc(p.name || '')}</div>
                <div style="font-size:12px;color:#64748b;margin-top:2px">Còn lại trong kho: <span style="font-weight:700;color:#0f766e">${fmt(p.quantity)}</span></div>
              </div>
              <div class="qty-selector" style="display:${isPrefilled ? 'flex' : 'none'};align-items:center;gap:6px">
                <button type="button" class="btn-qty-minus" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:1.5px solid #cbd5e1;border-radius:6px;background:#f8fafc;cursor:pointer;font-weight:700;font-size:14px;color:#475569">-</button>
                <input type="number" class="product-qty-input" value="${qtyVal}" min="1" max="${p.quantity}" style="width:48px;height:26px;text-align:center;border:1.5px solid #cbd5e1;border-radius:6px;font-size:13px;font-weight:700;color:#0f172a">
                <button type="button" class="btn-qty-plus" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:1.5px solid #cbd5e1;border-radius:6px;background:#f8fafc;cursor:pointer;font-weight:700;font-size:14px;color:#475569">+</button>
              </div>
            </div>
          `;
        }).join('');
      }
      return `
        ${infoBox}
        <div class="field" style="margin-top:12px">
          <label style="font-weight:700;font-size:13.5px;color:#334155;margin-bottom:8px;display:block">Sản phẩm cấp từ kho công ty</label>
          <div class="product-selection-list" style="max-height:280px;overflow-y:auto;padding-right:4px">${productRows}</div>
        </div>
      `;
    }
    return infoBox;
  }

  // Nut CTA chinh cho moi item tren card (nhu KTV)
  function renderAdminWarrantyItemActions(item) {
    const isDone = item.customer_status === 'completed' || item.current_status === 'delivered' || item.current_location === 'customer_returned';
    const isCancelled = item.current_status === 'cancelled';
    if (isDone || isCancelled) return '';
    const info = adminGetWarrantyPrimaryActionInfo(item);
    const canDeliverNew = !isDone && !isCancelled && (item.display_state && item.display_state.code === 'pending' || item.current_status === 'supplier_returned');
    const ctaHtml = info.actionable && !canDeliverNew
      ? `<button class="btnAdminWarrantyItemAction" data-item-id="${item.id}"
          style="width:100%;padding:10px;border-radius:10px;border:none;background:#2563eb;color:#fff;
                 font-size:13.5px;font-weight:700;cursor:pointer;margin-top:10px">
          ${esc(info.button)} →
        </button>`
      : !info.actionable && !canDeliverNew
      ? `<div style="margin-top:10px;padding:9px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;font-size:12.5px;color:#64748b;text-align:center">${esc(info.hint)}</div>`
      : '';
    const deliverBtn = canDeliverNew
      ? `<button class="btnAdminWarrantyDeliverNew" data-item-id="${item.id}"
          style="width:100%;padding:10px;border-radius:10px;border:none;background:#16a34a;color:#fff;
                 font-size:13.5px;font-weight:700;cursor:pointer;margin-top:8px">
          🔧 Lắp / giao sản phẩm bảo hành →
        </button>`
      : '';
    return ctaHtml + deliverBtn;
  }

  // Modal chon trang thai (tuong tu KTV)
  async function openAdminWarrantyStatusModal(item, prefill = {}) {
    const o = state.currentDetail;
    const needTechStock = Array.isArray(item.available_actions) && item.available_actions.includes('reserve_replacement_from_technician');
    const needCompanyStock = Array.isArray(item.available_actions) && item.available_actions.includes('reserve_replacement_from_company') && !item.replacement_product_id && item.current_status !== 'supplier_returned';

    const [invRes, csRes] = await Promise.all([
      needTechStock ? api.get('/admin/staff-stock', { onError: 'toast' }).catch(() => null) : Promise.resolve(null),
      needCompanyStock ? api.get('/admin/inventory/stock?stock_state=available&limit=200', { onError: 'toast' }).catch(() => null) : Promise.resolve(null),
    ]);
    // /admin/staff-stock tra ve [{staff_id, full_name, items:[{product_id,product_code,product_name,qty}]}]
    // Gom tat ca items thanh flat list
    const allTechHoldings = [];
    if (invRes && Array.isArray(invRes.items)) {
      for (const staff of invRes.items) {
        for (const h of (staff.items || [])) {
          allTechHoldings.push({ ...h, staff_name: staff.full_name, staff_id: staff.staff_id });
        }
      }
    }
    // /admin/inventory/stock tra ve product_id, code, name, quantity
    const companyStockItems = (csRes && csRes.items) || [];
    const context = {
      technicianHoldings: allTechHoldings,
      companyStock: companyStockItems,
      prefillSelectedProducts: prefill.selectedProducts || [],
    };

    const choices = adminBuildWarrantyDecisionOptions(item, context);
    if (!choices.length) { ui.toast('Không có thao tác phù hợp', 'warning'); return; }

    const enabledChoices = choices.filter(c => c.enabled && c.actionCode);
    const defaultChoice = (prefill.actionCode && enabledChoices.find(c => c.actionCode === prefill.actionCode)) || enabledChoices[0] || choices[0];

    const modalHtml = `
      <style>
        #simpleModal .modal{max-width:820px;width:min(820px,calc(100vw - 32px))}
        #simpleModal .wac-card{display:flex;flex-direction:column;gap:6px;align-items:flex-start;padding:11px 13px;border:1.5px solid #dbe2ea;border-radius:12px;background:#fff;cursor:pointer;transition:border-color .15s}
        #simpleModal .wac-card:hover{border-color:#93c5fd}
        #simpleModal .wac-card.disabled{opacity:.55;cursor:not-allowed}
        #simpleModal .wac-card input[type=radio]{margin-top:2px}
      </style>
      <div style="padding:14px">
        <div style="margin-bottom:12px">
          <div style="font-size:14px;font-weight:700;color:#0f172a">${esc(item.product_name || item.device_name || ('Item #' + item.id))}</div>
          <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;font-size:12px;color:#64748b">
            <span>Trạng thái: <b>${esc(item.current_status || '')}</b></span>
            <span>Vị trí: <b>${esc(item.current_location || '')}</b></span>
          </div>
        </div>
        <div style="display:grid;gap:8px">
          ${choices.map(ch => `
            <label class="wac-card ${ch.enabled ? '' : 'disabled'}">
              <div style="display:flex;gap:8px;width:100%;align-items:center;border-bottom:1px solid #f1f5f9;padding-bottom:6px">
                <input type="radio" name="wacChoice" value="${esc(ch.actionCode)}"
                  ${defaultChoice && defaultChoice.actionCode === ch.actionCode ? 'checked' : ''}
                  ${ch.enabled ? '' : 'disabled'}>
                <b style="font-size:13.5px;color:#0f172a">${esc(ch.label)}</b>
              </div>
              <span style="font-size:12.5px;color:#475569;line-height:1.5">${esc(ch.description || '')}</span>
            </label>`).join('')}
        </div>
        <div id="wacPanel" style="margin-top:14px"></div>
        <div class="field" style="margin-top:12px">
          <label>Chụp ảnh (nếu có)</label>
          <div style="margin-bottom:8px">
            <button type="button" class="btn outline sm" id="waPhotoBtn">Chụp ảnh / Tải lên</button>
            <input type="file" id="waPhotoInput" accept="image/*" style="display:none" multiple>
          </div>
          <div id="waPhotoPreview" style="display:flex;gap:8px;flex-wrap:wrap"></div>
        </div>
        <div class="field" style="margin-top:12px">
          <label>Ghi chú</label>
          <textarea id="waNote" rows="3" class="input" placeholder="Mô tả thao tác cập nhật">${esc(prefill.noteText || '')}</textarea>
        </div>
      </div>`;

    const okPromise = openSimpleModal('Cập nhật sản phẩm bảo hành', modalHtml, enabledChoices.length ? 'Lưu thao tác' : 'Đóng');
    const $panel = document.getElementById('wacPanel');

    let uploadedPhotoUrls = prefill.photoUrls || [];
    const $photoPreview = document.getElementById('waPhotoPreview');
    if ($photoPreview && uploadedPhotoUrls.length > 0) {
      uploadedPhotoUrls.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.style.cssText = 'width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid #cbd5e1';
        $photoPreview.appendChild(img);
      });
    }

    function initProductSelector() {
      const items = $panel.querySelectorAll('.product-selection-item');
      items.forEach(itemEl => {
        const checkbox = itemEl.querySelector('.product-select-checkbox');
        const qtySelector = itemEl.querySelector('.qty-selector');
        const qtyInput = itemEl.querySelector('.product-qty-input');
        const btnMinus = itemEl.querySelector('.btn-qty-minus');
        const btnPlus = itemEl.querySelector('.btn-qty-plus');
        const maxVal = Number(itemEl.dataset.max) || 0;

        if (!checkbox) return;

        itemEl.addEventListener('click', (e) => {
          if (e.target === checkbox || e.target.closest('.qty-selector')) return;
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event('change'));
        });

        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            itemEl.style.borderColor = '#3b82f6';
            itemEl.style.background = '#f0f7ff';
            if (qtySelector) qtySelector.style.display = 'flex';
          } else {
            itemEl.style.borderColor = '#e2e8f0';
            itemEl.style.background = '#fff';
            if (qtySelector) qtySelector.style.display = 'none';
          }
        });

        if (btnMinus && btnPlus && qtyInput) {
          btnMinus.addEventListener('click', (e) => {
            e.stopPropagation();
            let val = Number(qtyInput.value) || 1;
            if (val > 1) {
              qtyInput.value = val - 1;
              qtyInput.dispatchEvent(new Event('change'));
            }
          });
          btnPlus.addEventListener('click', (e) => {
            e.stopPropagation();
            let val = Number(qtyInput.value) || 1;
            if (val < maxVal) {
              qtyInput.value = val + 1;
              qtyInput.dispatchEvent(new Event('change'));
            }
          });
          qtyInput.addEventListener('change', (e) => {
            let val = Math.floor(Number(qtyInput.value)) || 1;
            if (val < 1) val = 1;
            if (val > maxVal) val = maxVal;
            qtyInput.value = val;
          });
          qtyInput.addEventListener('click', e => e.stopPropagation());
        }
      });
    }

    const renderPanel = () => {
      const code = (document.querySelector('input[name="wacChoice"]:checked') || {}).value;
      const sel = choices.find(c => c.actionCode === code) || defaultChoice;
      $panel.innerHTML = adminRenderDecisionPanel(sel, context);
      const $ok = document.getElementById('smOk');
      if ($ok && sel) $ok.textContent = sel.label;
      initProductSelector();
    };
    document.querySelectorAll('input[name="wacChoice"]').forEach(inp => inp.addEventListener('change', renderPanel));
    renderPanel();

    const $photoBtn = document.getElementById('waPhotoBtn');
    const $photoInput = document.getElementById('waPhotoInput');
    if ($photoBtn && $photoInput) {
      $photoBtn.addEventListener('click', () => $photoInput.click());
      $photoInput.addEventListener('change', async () => {
        if (!$photoInput.files.length) return;
        $photoBtn.disabled = true; $photoBtn.textContent = 'Đang tải...';
        try {
          for (const file of $photoInput.files) {
            const url = await uploadImage(file);
            if (url) {
              uploadedPhotoUrls.push(url);
              const img = document.createElement('img');
              img.src = url;
              img.style.cssText = 'width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid #cbd5e1';
              $photoPreview.appendChild(img);
            }
          }
        } catch (err) { ui.toast(err.message || 'Lỗi tải ảnh', 'error'); }
        finally { $photoBtn.disabled = false; $photoBtn.textContent = 'Chụp ảnh / Tải lên'; $photoInput.value = ''; }
      });
    }

    const ok = await okPromise;
    if (!ok) { closeSimpleModal(); return; }
    if (!enabledChoices.length) { closeSimpleModal(); return; }

    const selCode = (document.querySelector('input[name="wacChoice"]:checked') || {}).value;
    const selected = choices.find(c => c.actionCode === selCode);
    if (!selected || !selected.enabled) { ui.toast('Hãy chọn thao tác hợp lệ', 'warning'); closeSimpleModal(); return; }

    const noteText = ((document.getElementById('waNote') || {}).value || '').trim() || null;

    const isReplacementAction = ['reserve_replacement_from_technician', 'reserve_replacement_from_company'].includes(selected.actionCode);
    let selectedProducts = [];
    if (isReplacementAction) {
      $panel.querySelectorAll('.product-selection-item').forEach(itemEl => {
        const checkbox = itemEl.querySelector('.product-select-checkbox');
        const qtyInput = itemEl.querySelector('.product-qty-input');
        if (checkbox && checkbox.checked) {
          selectedProducts.push({
            product_id: Number(itemEl.dataset.id),
            name: itemEl.dataset.name,
            qty: Number(qtyInput.value) || 1
          });
        }
      });

      if (selectedProducts.length === 0) {
        ui.toast('Vui lòng chọn ít nhất 1 sản phẩm thay thế', 'warning');
        setTimeout(() => {
          openAdminWarrantyStatusModal(item, {
            actionCode: selected.actionCode,
            noteText,
            photoUrls: uploadedPhotoUrls,
            selectedProducts
          });
        }, 100);
        return;
      }

      // Dialog xac nhan
      const confirmMsg = `
        <div style="font-size:14.5px;color:#334155;margin-bottom:12px;line-height:1.5">Bạn có chắc chắn muốn thực hiện hành động này với danh sách sản phẩm sau?</div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:12px">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="border-bottom:1px solid #cbd5e1;text-align:left;color:#475569">
                <th style="padding:6px 0">Sản phẩm</th>
                <th style="padding:6px 0;text-align:right">Số lượng</th>
              </tr>
            </thead>
            <tbody>
              ${selectedProducts.map(rep => `
                <tr style="border-bottom:1px dashed #e2e8f0">
                  <td style="padding:8px 0;font-weight:600;color:#1e293b">${esc(rep.name)}</td>
                  <td style="padding:8px 0;text-align:right;font-weight:700;color:#2563eb">x${rep.qty}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div style="font-size:12.5px;color:#64748b;line-height:1.5">
          <div><b>Nguồn cấp:</b> ${esc(selected.label)}</div>
          ${noteText ? `<div style="margin-top:4px"><b>Ghi chú:</b> "${esc(noteText)}"</div>` : ''}
        </div>
      `;

      const confirmed = await ui.confirm({
        title: 'Xác nhận cấp hàng bảo hành',
        body: confirmMsg,
        okText: 'Xác nhận cấp',
        cancelText: 'Quay lại'
      });
      if (!confirmed) {
        setTimeout(() => {
          openAdminWarrantyStatusModal(item, {
            actionCode: selected.actionCode,
            noteText,
            photoUrls: uploadedPhotoUrls,
            selectedProducts
          });
        }, 100);
        return;
      }
    }

    closeSimpleModal();

    // Gọi API
    async function postMove(actionCode, extra = {}) {
      return api.post(`/admin/orders/${o.id}/warranty-items/${item.id}/move`,
        { action_code: actionCode, note_text: noteText, photo_urls: uploadedPhotoUrls, ...extra },
        { onError: 'toast' });
    }

    let r = null;
    if (selected.actionCode === 'receive_to_stock') {
      // Khach mang thang den cty: nhan + vao kho ngay (2 buoc)
      const r1 = await postMove('receive_from_customer', { handling_type: 'supplier_return' });
      if (r1 && r1.ok) r = await postMove('move_to_company_stock');
    } else if (selected.actionCode === 'mark_fixed') {
      const cost = Number(String((document.getElementById('waCost') || {}).value || '0').replace(/[^\d]/g, '')) || 0;
      r = await postMove('mark_fixed', { additional_cost: cost });
    } else if (isReplacementAction) {
      r = await postMove(selected.actionCode, { replacements: selectedProducts, source_mode: selected.sourceMode || null });
    } else {
      r = await postMove(selected.actionCode);
    }

    if (r && r.ok) {
      ui.toast('✅ Đã cập nhật bảo hành', 'success');
      openDetail(o.id);
    }
  }

  function renderWarrantySectionV2() {
    const o = state.currentDetail;
    if (!o || o.service_kind !== 'warranty' || !o.warranty) return '';
    const meta = o.warranty.meta || {};
    const items = o.warranty.items || [];

    // 1 trang thai duy nhat (stage) -> nhan + mau + cau mo ta "dang o dau"
    const STAGE_INFO = {
      intake:                 { label: 'Mới tiếp nhận',  cls: 'gray',   accent: '#64748b', tint: '#f1f5f9', where: 'Khách đang giữ hàng lỗi' },
      technician_holding:     { label: 'KTV đang giữ',   cls: 'blue',   accent: '#2563eb', tint: '#eff6ff', where: 'Hàng lỗi trong túi đồ của KTV' },
      company_warranty_stock: { label: 'Ở kho bảo hành', cls: 'purple', accent: '#7c3aed', tint: '#f5f3ff', where: 'Hàng lỗi tại kho bảo hành công ty' },
      sent_to_supplier:       { label: 'Đã gửi NCC',     cls: 'amber',  accent: '#d97706', tint: '#fffbeb', where: 'Hàng lỗi đang ở nhà cung cấp' },
      supplier_returned:      { label: 'NCC đã trả về',  cls: 'blue',   accent: '#0891b2', tint: '#ecfeff', where: 'Hàng đã về kho, chờ giao khách' },
      delivered:              { label: 'Hoàn tất',       cls: 'green',  accent: '#16a34a', tint: '#f0fdf4', where: 'Đã giao lại cho khách' },
      cancelled:              { label: 'Đã huỷ',         cls: 'red',    accent: '#dc2626', tint: '#fef2f2', where: '' },
    };
    const HANDLING_INFO = {
      pending:         'Chưa chốt hướng xử lý',
      tech_fix:        'KTV sửa tại chỗ',
      exchange:        'Đổi thiết bị mới cho khách',
      supplier_return: 'Gửi nhà cung cấp bảo hành',
    };
    const SOURCE_LABEL = {
      technician_stock: 'lấy từ túi KTV',
      company_stock: 'lấy từ kho công ty',
      supplier_returned_item: 'là hàng NCC trả về',
    };

    function infoRow(label, value, color) {
      if (!value) return '';
      return `<div style="display:flex;gap:6px;font-size:12px;line-height:1.5;margin-top:3px">
        <span style="color:#94a3b8;min-width:78px;flex:0 0 78px">${label}</span>
        <span style="color:${color || '#0f172a'};font-weight:500">${value}</span>
      </div>`;
    }

    const itemHtml = items.length ? items.map((item) => {
      const stage = STAGE_INFO[item.current_status] || { label: item.current_status || '—', cls: 'gray', accent: '#64748b', tint: '#f8fafc', where: '' };

      const idBits = [
        item.imei ? `IMEI ${esc(item.imei)}` : '',
        item.license_plate ? `Biển số ${esc(item.license_plate)}` : '',
        item.account_name ? `TK ${esc(item.account_name)}` : '',
        item.sim_number ? `SIM ${esc(item.sim_number)}` : '',
      ].filter(Boolean).join(' · ');

      let whereText = stage.where || '';
      if (item.current_status === 'technician_holding' && item.holder_staff_name) {
        whereText += ` (KTV: <b>${esc(item.holder_staff_name)}</b>)`;
      }
      if (item.current_status === 'sent_to_supplier' && item.supplier_name) {
        whereText += ` (<b>${esc(item.supplier_name)}</b>)`;
      }

      let replacementText = '';
      if (item.replacement_product_name) {
        const src = SOURCE_LABEL[item.replacement_source_scope] || '';
        replacementText = `${esc(item.replacement_product_name)}${src ? ` · ${src}` : ''}`;
      }

      const img = item.thumbnail_url
        ? `<img src="${esc(item.thumbnail_url)}" alt="" style="width:48px;height:48px;border-radius:8px;object-fit:cover;flex:0 0 48px;border:1px solid #e2e8f0" onerror="this.style.display='none'">`
        : `<div style="width:48px;height:48px;border-radius:8px;flex:0 0 48px;background:${stage.tint};display:flex;align-items:center;justify-content:center;font-size:20px">📦</div>`;

      return `
        <div style="border:1px solid #e2e8f0;border-top:3px solid ${stage.accent};border-radius:10px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.04)">
          <div style="display:flex;gap:10px;align-items:center;padding:10px 12px;background:${stage.tint}">
            ${img}
            <div style="min-width:0;flex:1">
              <div style="font-weight:700;font-size:13.5px;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(item.product_name || item.device_name || `Item #${item.id}`)}</div>
              <div style="margin-top:3px">${(() => {
                const DS_BADGE = { pending: ['Chờ xử lý', 'amber'], processing: ['Đang xử lý', 'blue'], supplier: ['Đang gửi NCC', 'amber'], delivered: ['Giao KH', 'green'] };
                const ds = item.current_status === 'cancelled' ? ['Đã huỷ', 'red'] : (item.display_state && DS_BADGE[item.display_state.code]) || [stage.label, stage.cls];
                return warrantyBadge(ds[0], ds[1]);
              })()}</div>
            </div>
          </div>
          <div style="padding:8px 12px 11px">
            ${item.customer_status === 'completed' && item.current_status !== 'delivered' && item.current_status !== 'cancelled'
              ? `<div style="margin:0 0 6px;padding:5px 9px;border-radius:6px;background:#f0fdf4;color:#15803d;font-size:12px;font-weight:600">✓ Khách đã nhận hàng đổi · đang thu máy lỗi về kho</div>`
              : ''}
            ${infoRow('Tình trạng', item.condition_note ? esc(item.condition_note) : '<span style="color:#94a3b8">Chưa ghi nhận</span>', '#b45309')}
            ${item.handling_type && item.handling_type !== 'pending'
              ? infoRow('Hướng xử lý', `<b>${HANDLING_INFO[item.handling_type]}</b>`, '#1d4ed8')
              : infoRow('Hướng xử lý', '<span style="color:#b45309">Chưa chốt hướng xử lý</span>')}
            ${infoRow('Hiện ở', whereText || '—')}
            ${infoRow('Giao khách', replacementText, '#0369a1')}
            ${Number(item.additional_cost || 0) > 0 ? infoRow('Thu thêm', `${fmt(item.additional_cost)}đ`, '#dc2626') : ''}
            ${idBits ? infoRow('Thiết bị', `<span style="color:#64748b">${idBits}</span>`) : ''}
            ${renderAdminWarrantyItemActions(item)}
          </div>
        </div>`;
    }).join('') : '<div style="color:#94a3b8">Chưa có item bảo hành</div>';

    const moves = (o.warranty && o.warranty.moves) || [];
    const ACTION_STYLE = {
      mark_fixed:                          { color: '#16a34a', icon: '🔧' },
      receive_from_customer:               { color: '#2563eb', icon: '📥' },
      move_to_company_stock:               { color: '#7c3aed', icon: '🏢' },
      send_to_supplier:                    { color: '#d97706', icon: '📦' },
      receive_from_supplier:               { color: '#0891b2', icon: '📬' },
      reserve_replacement_from_technician: { color: '#2563eb', icon: '🔄' },
      reserve_replacement_from_company:    { color: '#7c3aed', icon: '🔄' },
      deliver_to_customer:                 { color: '#16a34a', icon: '✅' },
      cancel_item:                         { color: '#dc2626', icon: '✖️' },
      note:                                { color: '#64748b', icon: '📝' },
    };
    const moveHtml = moves.length ? `
      <div style="position:relative">
        ${moves.map((move, idx) => {
          const st = ACTION_STYLE[move.action_code] || { color: '#64748b', icon: '•' };
          const isLast = idx === moves.length - 1;
          const dt = move.occurred_at ? new Date(move.occurred_at) : null;
          const timeStr = dt ? dt.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '';
          return `
          <div style="position:relative;display:flex;gap:12px;padding-bottom:${isLast ? '0' : '14px'}">
            <div style="position:relative;flex:0 0 28px;display:flex;justify-content:center">
              ${isLast ? '' : `<div style="position:absolute;top:26px;bottom:-14px;width:2px;background:#e2e8f0"></div>`}
              <div style="width:28px;height:28px;border-radius:50%;background:${st.color}1a;border:2px solid ${st.color};display:flex;align-items:center;justify-content:center;font-size:13px;z-index:1">${st.icon}</div>
            </div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline">
                <span style="font-size:13px;font-weight:700;color:${st.color}">${esc(WARRANTY_ACTION_LABELS[move.action_code] || move.action_code)}</span>
                <span style="font-size:11px;color:#94a3b8;white-space:nowrap">${esc(timeStr)}</span>
              </div>
              <div style="font-size:12px;color:#64748b;margin-top:2px">
                ${esc((WARRANTY_LOCATION_LABELS[move.from_location] || move.from_location || '—') + ' → ' + (WARRANTY_LOCATION_LABELS[move.to_location] || move.to_location || '—'))}
                ${move.created_by_name ? ` · 👤 ${esc(move.created_by_name)}` : ''}
                ${move.receipt_code ? ` · <b style="color:#0f766e">${esc(move.receipt_code)}</b>` : ''}
              </div>
              ${move.note_text ? `<div style="font-size:12px;color:#334155;margin-top:3px;background:#f8fafc;border-radius:6px;padding:4px 8px">${esc(move.note_text)}</div>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>`
      : '<p style="color:#94a3b8;font-size:12.5px;text-align:center;padding:8px">Chưa có diễn biến</p>';

    return `
      <div class="od-section">
        <h4>Bảo hành
          <button class="btn ghost sm" id="btnEditWarrantyV2" style="margin-left:auto">Sửa Thông Tin Đơn</button>
        </h4>
        ${meta.note_text ? `<div style="margin-bottom:12px;padding:10px 12px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;font-size:12.5px;color:#334155">${esc(meta.note_text)}</div>` : ''}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">${itemHtml}</div>
        ${(() => {
          const progressLines = String(o.progress_note || '').split(/\n+/).map((s) => s.trim()).filter(Boolean);
          const latestProgress = progressLines.length ? progressLines[progressLines.length - 1] : '';
          const DS_CHIP = { pending: ['#fef3c7', '#92400e'], processing: ['#dbeafe', '#1e40af'], supplier: ['#fef9c3', '#854d0e'], delivered: ['#dcfce7', '#166534'] };
          const handlingSummary = items.filter((it) => it.current_status !== 'cancelled').map((it) => {
            const name = esc(it.product_name || it.device_name || ('#' + it.id));
            const h = it.handling_type && it.handling_type !== 'pending' ? esc(HANDLING_INFO[it.handling_type] || it.handling_type) : 'Chưa chốt hướng xử lý';
            const dsCode = (it.display_state && it.display_state.code) || 'processing';
            const dsLabel = (it.display_state && it.display_state.label) || '';
            const chip = DS_CHIP[dsCode] || DS_CHIP.processing;
            return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#fff;border:1px solid #eef2f7;border-radius:8px;margin-top:6px">
              <div style="flex:1;min-width:0"><div style="font-size:12.5px;font-weight:700;color:#0f172a">${name}</div><div style="font-size:11.5px;color:#64748b;margin-top:1px">${h}</div></div>
              ${dsLabel ? `<span style="flex-shrink:0;padding:3px 10px;border-radius:999px;background:${chip[0]};color:${chip[1]};font-size:11px;font-weight:700">${esc(dsLabel)}</span>` : ''}
            </div>`;
          }).join('');
          return `
        <div style="margin-top:14px;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.06)">
          <div style="display:flex;align-items:center;gap:8px;padding:11px 14px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff">
            <span style="font-size:15px">📋</span><span style="font-size:13.5px;font-weight:700;letter-spacing:.2px">Tiến trình hiện tại</span>
          </div>
          <div style="padding:12px 14px;background:#f8fafc">
            ${latestProgress
              ? `<div style="display:flex;gap:8px;padding:10px 12px;background:#fff;border-left:3px solid #2563eb;border-radius:8px;box-shadow:0 1px 2px rgba(15,23,42,.04)">
                   <span style="font-size:14px">📍</span>
                   <div><div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Thực tế hiện tại</div>
                   <div style="font-size:13px;color:#0f172a;margin-top:1px">${esc(latestProgress)}</div></div>
                 </div>`
              : ''}
            <div style="margin-top:${latestProgress ? '10px' : '0'}">${handlingSummary}</div>
            <details style="margin-top:12px;border-top:1px dashed #e2e8f0;padding-top:10px">
              <summary style="cursor:pointer;font-size:12px;font-weight:700;color:#1e40af;list-style:none;display:flex;align-items:center;gap:6px">🕑 Diễn biến chi tiết <span style="color:#94a3b8;font-weight:500">(${moves.length} mục)</span></summary>
              <div style="margin-top:12px">${moveHtml}</div>
            </details>
          </div>
        </div>`;
        })()}
      </div>`;
  }

  async function openWarrantyEditorV2() {
    const o = state.currentDetail;
    const warranty = o.warranty || { meta: {}, items: [] };
    const meta = warranty.meta || {};
    const items = (warranty.items || []).map((item) => ({
      id: item.id,
      item_role: 'faulty',
      handling_type: item.handling_type || 'pending',
      product_id: item.product_id || 0,
      qty: Number(item.qty) || 1,
      imei: item.imei || '',
      license_plate: item.license_plate || '',
      account_name: item.account_name || '',
      sim_number: item.sim_number || '',
      note_text: item.note_text || '',
      additional_cost: Number(item.additional_cost) || 0,
    }));
    if (!items.length) {
      items.push({ id: null, item_role: 'faulty', handling_type: 'pending', product_id: 0, qty: 1, imei: '', license_plate: '', account_name: '', sim_number: '', note_text: '', additional_cost: 0 });
    }

    const [productsRes, suppliersRes] = await Promise.all([
      api.get('/admin/products?limit=500').catch(() => null),
      api.get('/admin/suppliers/all').catch(() => null),
    ]);
    const products = (productsRes && productsRes.items) || [];
    const suppliers = (suppliersRes && suppliersRes.items) || [];
    const productOptions = ['<option value="0">- Chọn sản phẩm -</option>']
      .concat(products.map((p) => `<option value="${p.id}">${esc(p.code || '')}${p.code ? ' · ' : ''}${esc(p.name || '')}</option>`))
      .join('');
    const supplierOptions = ['<option value="0">- Chưa chọn NCC -</option>']
      .concat(suppliers.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`))
      .join('');

    function renderRows() {
      return items.map((item, idx) => `
        <div class="w-edit-row" data-idx="${idx}" style="border:1px solid var(--border);border-radius:12px;background:#fff;margin-bottom:10px;overflow:hidden;box-shadow:0 1px 4px rgba(15,23,42,.06)">
          <!-- Row header -->
          <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(90deg,#eff6ff,#f8fafc);border-bottom:1px solid #e2e8f0">
            <div style="width:26px;height:26px;border-radius:8px;background:var(--primary);color:#fff;display:grid;place-items:center;font-size:12px;font-weight:800;flex-shrink:0">${idx + 1}</div>
            <span style="font-weight:700;font-size:13px;color:#1e3a8a">📦 Sản phẩm bảo hành</span>
            <button type="button" class="btn ghost sm w-del" style="margin-left:auto;color:#dc2626;border-color:#fecaca;font-size:12px">🗑 Xoá</button>
          </div>
          <!-- Row body -->
          <div style="padding:14px">
            <!-- Hàng 1: SP + SL + Chi phí -->
            <div class="we-item-grid" style="display:grid;grid-template-columns:1fr 100px 130px;gap:10px;margin-bottom:10px">
              <div class="field" style="margin:0">
                <label style="display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#475569;margin-bottom:5px">🔧 Sản phẩm <span style="color:#dc2626">*</span></label>
                <select class="select w-product" style="font-size:13px">${productOptions}</select>
              </div>
              <div class="field" style="margin:0">
                <label style="font-size:12px;font-weight:600;color:#475569;margin-bottom:5px;display:block">Số lượng</label>
                <input class="input w-qty" inputmode="numeric" value="${item.qty || 1}" style="font-size:13px;text-align:center">
              </div>
              <div class="field" style="margin:0">
                <label style="font-size:12px;font-weight:600;color:#475569;margin-bottom:5px;display:block">💰 Chi phí thêm</label>
                <input class="input w-cost" inputmode="numeric" value="${item.additional_cost || 0}" placeholder="0đ" style="font-size:13px">
              </div>
            </div>
            <!-- Hàng 2: Thông tin định danh thiết bị -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;margin-bottom:10px">
              <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">📋 Thông tin thiết bị (tuỳ chọn)</div>
              <div class="we-id-grid" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px">
                <div class="field" style="margin:0">
                  <label style="font-size:11.5px;font-weight:600;color:#64748b;margin-bottom:4px;display:block">IMEI</label>
                  <input class="input w-imei" value="${esc(item.imei || '')}" placeholder="Nhập IMEI" style="font-size:13px;padding:7px 10px">
                </div>
                <div class="field" style="margin:0">
                  <label style="font-size:11.5px;font-weight:600;color:#64748b;margin-bottom:4px;display:block">Biển số xe</label>
                  <input class="input w-plate" value="${esc(item.license_plate || '')}" placeholder="VD: 51A-123.45" style="font-size:13px;padding:7px 10px">
                </div>
                <div class="field" style="margin:0">
                  <label style="font-size:11.5px;font-weight:600;color:#64748b;margin-bottom:4px;display:block">Tên tài khoản</label>
                  <input class="input w-account" value="${esc(item.account_name || '')}" placeholder="Tên TK thiết bị" style="font-size:13px;padding:7px 10px">
                </div>
                <div class="field" style="margin:0">
                  <label style="font-size:11.5px;font-weight:600;color:#64748b;margin-bottom:4px;display:block">Số SIM</label>
                  <input class="input w-sim" value="${esc(item.sim_number || '')}" placeholder="Số SIM" style="font-size:13px;padding:7px 10px">
                </div>
              </div>
            </div>
            <!-- Hàng 3: Ghi chú -->
            <div class="field" style="margin:0">
              <label style="font-size:12px;font-weight:600;color:#475569;margin-bottom:5px;display:flex;align-items:center;gap:5px">📝 Ghi chú riêng cho sản phẩm này</label>
              <textarea class="input w-note" rows="2" placeholder="Mô tả tình trạng lỗi, yêu cầu xử lý…" style="font-size:13px;resize:none">${esc(item.note_text || '')}</textarea>
            </div>
          </div>
        </div>`).join('');
    }

    const html = `
      <style>
        #simpleModal .modal { max-width: 860px !important; width: min(860px, calc(100vw - 32px)) }
        #simpleModal .modal-body { background: #f1f5f9; padding: 0 }
        #simpleModal .we-wrap { padding: 16px; display: grid; gap: 14px }
        #simpleModal .we-card { background: #fff; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(15,23,42,.06) }
        #simpleModal .we-card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 16px; background: linear-gradient(90deg,#1e40af,#2563eb); color: #fff }
        #simpleModal .we-card-title { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 7px }
        #simpleModal .we-card-body { padding: 16px }
        #simpleModal .we-info-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px }
        #simpleModal .field label { font-size: 12.5px; font-weight: 600; color: #475569; margin-bottom: 5px; display: block }
        @media (max-width: 620px) {
          #simpleModal .we-info-grid { grid-template-columns: 1fr }
          #simpleModal .we-item-grid { grid-template-columns: 1fr !important }
          #simpleModal .we-id-grid { grid-template-columns: repeat(2,1fr) !important }
        }
      </style>
      <div class="we-wrap">

        <!-- ── Section 1: Thông tin đơn ── -->
        <div class="we-card">
          <div class="we-card-head">
            <div class="we-card-title">📄 Thông tin đơn bảo hành</div>
          </div>
          <div class="we-card-body">
            <div class="field" style="margin:0 0 12px">
              <label>📍 Địa chỉ lắp đặt / địa chỉ khách</label>
              <input id="weAddress" class="input" value="${esc(o.address || '')}" placeholder="Nhập địa chỉ…" style="font-size:13px">
            </div>
            <div class="we-info-grid">
              <div class="field" style="margin:0">
                <label>📝 Ghi chú đơn</label>
                <textarea id="weOrderNote" class="input" rows="3" placeholder="Ghi chú nội bộ cho đơn này…" style="font-size:13px;resize:none">${esc(o.note || '')}</textarea>
              </div>
              <div class="field" style="margin:0">
                <label>🛡 Ghi chú bảo hành</label>
                <textarea id="weMetaNote" class="input" rows="3" placeholder="Thông tin liên quan bảo hành, điều kiện…" style="font-size:13px;resize:none">${esc(meta.note_text || '')}</textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Section 2: Sản phẩm bảo hành ── -->
        <div class="we-card">
          <div class="we-card-head">
            <div class="we-card-title">📦 Sản phẩm bảo hành</div>
            <button type="button" class="btn sm" id="btnWeAdd" style="background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.35);color:#fff;font-size:12px">+ Thêm sản phẩm</button>
          </div>
          <div class="we-card-body" style="padding-bottom:6px">
            <div id="weItems">${renderRows()}</div>
          </div>
        </div>

      </div>`;

    const bindRows = () => {
      document.querySelectorAll('#weItems .w-edit-row').forEach((row) => {
        const idx = Number(row.dataset.idx);
        const item = items[idx];
        const qp = row.querySelector('.w-product');
        if (qp) qp.value = String(item.product_id || 0);
        const bind = (selector, key, parser) => {
          const el = row.querySelector(selector);
          if (!el) return;
          const save = () => { item[key] = parser ? parser(el.value) : el.value; };
          el.addEventListener('input', save);
          el.addEventListener('change', save);
        };

        bind('.w-product', 'product_id', (v) => Number(v) || 0);
        bind('.w-qty', 'qty', (v) => Math.max(1, Number(String(v).replace(/[^\d]/g, '')) || 1));
        bind('.w-cost', 'additional_cost', (v) => Math.max(0, Number(String(v).replace(/[^\d]/g, '')) || 0));
        bind('.w-imei', 'imei');
        bind('.w-plate', 'license_plate');
        bind('.w-account', 'account_name');
        bind('.w-sim', 'sim_number');
        bind('.w-note', 'note_text');
        const delBtn = row.querySelector('.w-del');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            if (items.length <= 1) {
              ui.toast('Cần ít nhất 1 item', 'warning');
              return;
            }
            items.splice(idx, 1);
            document.getElementById('weItems').innerHTML = renderRows();
            bindRows();
          });
        }
      });
      const addBtn = document.getElementById('btnWeAdd');
      if (addBtn) {
        // xóa listener cũ bằng cách clone
        const fresh = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(fresh, addBtn);
        fresh.addEventListener('click', () => {
          items.push({ id: null, item_role: 'faulty', handling_type: 'pending', product_id: 0, qty: 1, imei: '', license_plate: '', account_name: '', sim_number: '', note_text: '', additional_cost: 0 });
          document.getElementById('weItems').innerHTML = renderRows();
          bindRows();
        });
      }
    };

    const ok = await openSimpleModal('Sửa thông tin bảo hành', html, 'Lưu', bindRows);
    if (!ok) return;
    const payload = {
      address: document.getElementById('weAddress').value.trim() || null,
      note: document.getElementById('weOrderNote').value.trim() || null,
      meta: {
        warranty_mode: meta.warranty_mode || 'repair',
        default_supplier_id: meta.default_supplier_id || null,
        note_text: document.getElementById('weMetaNote').value.trim() || null,
      },
      items: items
        .map((item) => ({
          id: item.id || null,
          item_role: item.item_role || 'faulty',
          product_id: Number(item.product_id) || null,
          supplier_id: Number(item.supplier_id) || null,
          qty: Math.max(1, Number(item.qty) || 1),
          imei: item.imei?.trim() || null,
          license_plate: item.license_plate?.trim() || null,
          account_name: item.account_name?.trim() || null,
          sim_number: item.sim_number?.trim() || null,
          note_text: item.note_text?.trim() || null,
          additional_cost: Number(item.additional_cost) || 0,
        }))
        .filter((item) => item.product_id || item.imei || item.license_plate || item.account_name || item.sim_number),
    };
    closeSimpleModal();
    const r = await api.put(`/admin/orders/${o.id}/warranty`, payload, { onError: 'toast' });
    if (r) {
      ui.toast('Đã lưu bảo hành', 'success');
      openDetail(o.id);
      loadList();
    }
  }

  async function openWarrantyActionModal(itemId, actionCode) {
    const o = state.currentDetail;
    const item = ((o.warranty && o.warranty.items) || []).find((entry) => Number(entry.id) === Number(itemId));
    if (!item) return;
    let title = WARRANTY_ACTION_LABELS[actionCode] || actionCode;
    let extraHtml = '';
    if (!o.assigned_staff_id && ['reserve_replacement_from_technician', 'reserve_replacement_from_company', 'deliver_to_customer'].includes(actionCode)) {
      ui.toast('Cần gán KTV cho đơn trước khi thao tác sản phẩm bảo hành', 'warning');
      return;
    }
    if (actionCode === 'reserve_replacement_from_technician') {
      const holdingsRes = await api.get(`/admin/staff-stock/${o.assigned_staff_id}`).catch(() => null);
      const holdings = (holdingsRes && holdingsRes.items) || [];
      if (!holdings.length) {
        ui.toast('KTV hiện không có thiết bị đổi trả, hãy cấp thêm từ kho', 'warning');
        return;
      }
      extraHtml = `<div class="field"><label>Sản phẩm đổi từ túi KTV</label><select id="waReplacementProduct" class="select">${holdings.map((h) => `<option value="${h.product_id}">${esc(h.code || h.product_code || '')}${(h.code || h.product_code) ? ' · ' : ''}${esc(h.name || h.product_name || '')} · Còn ${fmt(h.qty)}</option>`).join('')}</select></div>`;
    } else if (actionCode === 'reserve_replacement_from_company') {
      if (item.current_status === 'supplier_returned') {
        title = 'Phân KTV đi giao';
        extraHtml = `<div style="font-size:13px;color:#334155;padding:8px 0">Sản phẩm đã nhận từ NCC. Hệ thống sẽ gán cho KTV đang được chỉ định để đi giao khách.</div>`;
      } else {
        const stockRes = await api.get('/admin/inventory/stock?stock_state=available&limit=200').catch(() => null);
        const stock = (stockRes && stockRes.items) || [];
        if (!stock.length) {
          ui.toast('Kho công ty hiện không có sản phẩm để cấp cho KTV', 'warning');
          return;
        }
        extraHtml = `<div class="field"><label>Sản phẩm cấp từ kho công ty</label><select id="waReplacementProduct" class="select">${stock.map((p) => `<option value="${p.product_id}">${esc(p.code || '')}${p.code ? ' · ' : ''}${esc(p.name || '')} · Còn ${fmt(p.quantity)}</option>`).join('')}</select></div>`;
      }
    } else if (actionCode === 'mark_fixed') {
      extraHtml = `<div class="field"><label>Chi phí thêm</label><input id="waCost" class="input" inputmode="numeric" value="${fmt(item.additional_cost || 0)}"></div>`;
    }
    const html = `
      <div style="padding:14px">
        <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:8px">${esc(item.product_name || item.device_name || ('Item #' + item.id))}</div>
        <div style="font-size:12px;color:#64748b;margin-bottom:10px">${esc(WARRANTY_STATUS_LABELS[item.current_status] || item.current_status || '')}</div>
        ${extraHtml}
        <div class="field"><label>Thời điểm</label><input id="waOccurredAt" type="datetime-local" class="input"></div>
        <div class="field"><label>Ghi chú</label><textarea id="waNote" rows="3" class="input" placeholder="Mô tả thao tác vừa thực hiện"></textarea></div>
      </div>`;
    const ok = await openSimpleModal(title, html, 'Lưu');
    if (!ok) return;
    const payload = {
      warranty_item_id: Number(item.id),
      action_code: actionCode,
      occurred_at: (document.getElementById('waOccurredAt') || {}).value || null,
      note_text: ((document.getElementById('waNote') || {}).value || '').trim() || null,
      replacement_staff_id: Number(o.assigned_staff_id) || null,
    };
    if (actionCode === 'mark_fixed') {
      payload.additional_cost = Number(String((document.getElementById('waCost') || {}).value || '0').replace(/[^\d]/g, '')) || 0;
    }
    if (actionCode === 'reserve_replacement_from_technician') {
      payload.replacement_product_id = Number((document.getElementById('waReplacementProduct') || {}).value) || 0;
    }
    if (actionCode === 'reserve_replacement_from_company') {
      if (item.current_status === 'supplier_returned') payload.source_mode = 'supplier_returned_item';
      else payload.replacement_product_id = Number((document.getElementById('waReplacementProduct') || {}).value) || 0;
    }
    closeSimpleModal();
    const r = await api.post(`/admin/orders/${o.id}/warranty/moves`, payload, { onError: 'toast' });
    if (r) {
      const receiptCode = r.receipt && r.receipt.code ? ` (${r.receipt.code})` : '';
      ui.toast('Đã cập nhật bảo hành' + receiptCode, 'success');
      openDetail(o.id);
      loadList();
    }
  }

  function renderWarrantySection() {
    const o = state.currentDetail;
    if (!o || o.service_kind !== 'warranty' || !o.warranty) return '';
    const meta = o.warranty.meta || {};
    const items = o.warranty.items || [];
    const itemHtml = items.length ? items.map(item => {
      const bits = [
        item.device_name,
        item.imei ? `IMEI ${item.imei}` : '',
        item.license_plate ? `Biển số ${item.license_plate}` : '',
        item.account_name ? `TK ${item.account_name}` : '',
        item.sim_number ? `SIM ${item.sim_number}` : '',
      ].filter(Boolean);
      return `
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;background:#fafbfd">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <b>${esc(item.product_name || item.device_name || `Item #${item.id}`)}</b>
            ${warrantyBadge(WARRANTY_ROLE_LABELS[item.item_role] || item.item_role, 'gray')}
            ${warrantyStatusBadge(item.current_status)}
            ${warrantyBadge(WARRANTY_LOCATION_LABELS[item.current_location] || item.current_location || '—', 'amber')}
            <span style="margin-left:auto;font-weight:700">${fmt(item.qty || 0)}</span>
          </div>
          ${bits.length ? `<div style="margin-top:6px;font-size:12px;color:#475569">${esc(bits.join(' · '))}</div>` : ''}
          <div style="margin-top:6px;font-size:12px;color:#64748b">
            ${item.holder_staff_name ? `KTV giữ: <b>${esc(item.holder_staff_name)}</b>` : 'Không gắn KTV giữ riêng'}
            ${item.supplier_name ? ` · NCC: <b>${esc(item.supplier_name)}</b>` : ''}
            ${item.condition_note ? ` · ${esc(item.condition_note)}` : ''}
          </div>
        </div>`;
    }).join('') : '<div style="color:#94a3b8">Chưa có item bảo hành</div>';
    const moveHtml = moves.length ? moves.slice(0, 12).map(mv => `
      <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px dashed #e2e8f0">
        <div style="min-width:130px;font-size:11px;color:#94a3b8">${fmtDate(mv.occurred_at)}</div>
        <div style="flex:1">
          <div style="font-size:12.5px;font-weight:600;color:#0f172a">${esc(WARRANTY_ACTION_LABELS[mv.action_code] || mv.action_code)}</div>
          <div style="font-size:12px;color:#64748b">
            ${esc((WARRANTY_LOCATION_LABELS[mv.from_location] || mv.from_location || '—') + ' → ' + (WARRANTY_LOCATION_LABELS[mv.to_location] || mv.to_location || '—'))}
            ${mv.product_name ? ` · ${esc(mv.product_name)}` : ''}
            ${mv.supplier_name ? ` · NCC ${esc(mv.supplier_name)}` : ''}
            ${mv.holder_staff_name ? ` · ${esc(mv.holder_staff_name)}` : ''}
            ${mv.receipt_code ? ` · PX/PN ${esc(mv.receipt_code)}` : ''}
          </div>
          ${mv.note_text ? `<div style="font-size:12px;color:#334155;margin-top:4px">${esc(mv.note_text)}</div>` : ''}
        </div>
      </div>`).join('') : '<div style="color:#94a3b8">Chưa có lịch sử kho bảo hành</div>';

    return `
      <div class="od-section">
        <h4>
          Bảo hành
          <span style="margin-left:auto;display:flex;gap:6px">
            <button class="btn ghost sm" id="btnEditWarranty">Sửa thông tin</button>
            <button class="btn ghost sm" id="btnWarrantyMove">Cập nhật kho</button>
          </span>
        </h4>

        ${meta.note_text ? `<div style="margin-bottom:12px;padding:10px 12px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;font-size:12.5px;color:#334155">${esc(meta.note_text)}</div>` : ''}
        <div style="display:grid;gap:10px">${itemHtml}</div>
        <div style="margin-top:14px">
          <div style="font-size:13px;font-weight:700;color:#334155;margin-bottom:6px">Lịch sử kho bảo hành</div>
          <div>${moveHtml}</div>
        </div>
      </div>`;
  }

  async function openWarrantyEditor() {
    const o = state.currentDetail;
    const warranty = o.warranty || { meta: {}, items: [] };
    const meta = warranty.meta || {};
    const items = (warranty.items || []).map(item => ({
      id: item.id,
      item_role: item.item_role || 'faulty',
      product_id: item.product_id || 0,
      supplier_id: item.supplier_id || 0,
      qty: Number(item.qty) || 1,
      device_name: item.device_name || '',
      imei: item.imei || '',
      license_plate: item.license_plate || '',
      account_name: item.account_name || '',
      sim_number: item.sim_number || '',
      condition_note: item.condition_note || '',
      note_text: item.note_text || '',
    }));
    if (!items.length) {
      items.push({ id: null, item_role: 'faulty', product_id: 0, supplier_id: 0, qty: 1, device_name: '', imei: '', license_plate: '', account_name: '', sim_number: '', condition_note: '', note_text: '' });
    }

    const [productsRes, suppliersRes] = await Promise.all([
      api.get('/admin/products?limit=500').catch(() => null),
      api.get('/admin/suppliers/all').catch(() => null),
    ]);
    const products = (productsRes && productsRes.items) || [];
    const suppliers = (suppliersRes && suppliersRes.items) || [];
    const productOptions = ['<option value="0">— Chọn sản phẩm —</option>']
      .concat(products.map(p => `<option value="${p.id}">${esc(p.code || '')}${p.code ? ' · ' : ''}${esc(p.name || '')}</option>`))
      .join('');
    const supplierOptions = ['<option value="0">— Chưa chọn NCC —</option>']
      .concat(suppliers.map(s => `<option value="${s.id}">${esc(s.name)}</option>`))
      .join('');

    function renderRows() {
      return items.map((item, idx) => `
        <div class="w-edit-row" data-idx="${idx}" style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:10px">
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
            <div><label style="font-size:12px">Vai trò</label><select class="select w-role">
              <option value="faulty" ${item.item_role === 'faulty' ? 'selected' : ''}>Hàng lỗi</option>
              <option value="replacement" ${item.item_role === 'replacement' ? 'selected' : ''}>Hàng thay thế</option>
              <option value="supplier_return" ${item.item_role === 'supplier_return' ? 'selected' : ''}>Hàng NCC trả</option>
            </select></div>
            <div><label style="font-size:12px">Sản phẩm</label><select class="select w-product">${productOptions}</select></div>
            <div><label style="font-size:12px">Số lượng</label><input class="input w-qty" inputmode="numeric" value="${fmt(item.qty || 1)}"></div>
            <div><label style="font-size:12px">NCC riêng</label><select class="select w-supplier">${supplierOptions}</select></div>
            <div><label style="font-size:12px">Tên thiết bị</label><input class="input w-device" value="${esc(item.device_name || '')}"></div>
            <div><label style="font-size:12px">IMEI / Serial</label><input class="input w-imei" value="${esc(item.imei || '')}"></div>
            <div><label style="font-size:12px">Biển số</label><input class="input w-plate" value="${esc(item.license_plate || '')}"></div>
            <div><label style="font-size:12px">Tài khoản</label><input class="input w-account" value="${esc(item.account_name || '')}"></div>
            <div><label style="font-size:12px">SIM</label><input class="input w-sim" value="${esc(item.sim_number || '')}"></div>
            <div><label style="font-size:12px">Tình trạng</label><input class="input w-condition" value="${esc(item.condition_note || '')}"></div>
            <div style="grid-column:1 / -1"><label style="font-size:12px">Ghi chú item</label><textarea class="input w-note" rows="2">${esc(item.note_text || '')}</textarea></div>
          </div>
          <div style="text-align:right;margin-top:8px"><button type="button" class="btn ghost sm w-del">Xóa item</button></div>
        </div>
      `).join('');
    }

    const html = `
      <div style="padding:14px">
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:12px">
          <div><label style="font-size:12px">Loại xử lý</label><select id="weMode" class="select">
            <option value="repair" ${meta.warranty_mode === 'repair' ? 'selected' : ''}>Sửa / xử lý nội bộ</option>
            <option value="exchange" ${meta.warranty_mode === 'exchange' ? 'selected' : ''}>Đổi thiết bị</option>
            <option value="supplier_swap" ${meta.warranty_mode === 'supplier_swap' ? 'selected' : ''}>Đổi trả NCC</option>
          </select></div>
          <div><label style="font-size:12px">NCC mặc định</label><select id="weSupplier" class="select">${supplierOptions}</select></div>
          <div style="grid-column:1 / -1"><label style="font-size:12px">Địa chỉ</label><input id="weAddress" class="input" value="${esc(o.address || '')}"></div>
          <div style="grid-column:1 / -1"><label style="font-size:12px">Ghi chú đơn</label><textarea id="weOrderNote" class="input" rows="2">${esc(o.note || '')}</textarea></div>
          <div style="grid-column:1 / -1"><label style="font-size:12px">Ghi chú bảo hành</label><textarea id="weMetaNote" class="input" rows="2">${esc(meta.note_text || '')}</textarea></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <b>Item bảo hành</b>
          <button type="button" class="btn ghost sm" id="btnWeAdd">+ Thêm item</button>
        </div>
        <div id="weItems">${renderRows()}</div>
      </div>`;

    const ok = await openSimpleModal('Sửa thông tin bảo hành', html, 'Lưu', () => {
      const $supplier = document.getElementById('weSupplier');
      if ($supplier) $supplier.value = String(meta.default_supplier_id || 0);
      const bindRows = () => {
        document.querySelectorAll('#weItems .w-edit-row').forEach(row => {
          const idx = Number(row.dataset.idx);
          const item = items[idx];
          const qp = row.querySelector('.w-product'); if (qp) qp.value = String(item.product_id || 0);
          const sp = row.querySelector('.w-supplier'); if (sp) sp.value = String(item.supplier_id || 0);
          const read = (selector, key, parser) => {
            const el = row.querySelector(selector);
            if (!el) return;
            const save = () => { item[key] = parser ? parser(el.value) : el.value; };
            el.addEventListener('input', save);
            el.addEventListener('change', save);
          };
          read('.w-role', 'item_role');
          read('.w-product', 'product_id', v => Number(v) || 0);
          read('.w-qty', 'qty', v => Math.max(1, Number(String(v).replace(/[^\d]/g, '')) || 1));
          read('.w-supplier', 'supplier_id', v => Number(v) || 0);
          read('.w-device', 'device_name');
          read('.w-imei', 'imei');
          read('.w-plate', 'license_plate');
          read('.w-account', 'account_name');
          read('.w-sim', 'sim_number');
          read('.w-condition', 'condition_note');
          read('.w-note', 'note_text');
          const delBtn = row.querySelector('.w-del');
          if (delBtn) {
            delBtn.addEventListener('click', () => {
              if (items.length <= 1) return ui.toast('Cần ít nhất 1 item', 'warning');
              items.splice(idx, 1);
              document.getElementById('weItems').innerHTML = renderRows();
              bindRows();
            });
          }
        });
      };
      bindRows();
      const addBtn = document.getElementById('btnWeAdd');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          items.push({ id: null, item_role: 'faulty', product_id: 0, supplier_id: 0, qty: 1, device_name: '', imei: '', license_plate: '', account_name: '', sim_number: '', condition_note: '', note_text: '' });
          document.getElementById('weItems').innerHTML = renderRows();
          bindRows();
        });
      }
    });
    if (!ok) return;

    const payload = {
      address: document.getElementById('weAddress').value.trim() || null,
      note: document.getElementById('weOrderNote').value.trim() || null,
      meta: {
        warranty_mode: document.getElementById('weMode').value,
        default_supplier_id: Number(document.getElementById('weSupplier').value) || null,
        current_stage: meta.current_stage || 'intake',
        note_text: document.getElementById('weMetaNote').value.trim() || null,
      },
      items: items
        .map(item => ({
          id: item.id || null,
          item_role: item.item_role,
          product_id: Number(item.product_id) || null,
          supplier_id: Number(item.supplier_id) || null,
          qty: Math.max(1, Number(item.qty) || 1),
          device_name: item.device_name?.trim() || null,
          imei: item.imei?.trim() || null,
          license_plate: item.license_plate?.trim() || null,
          account_name: item.account_name?.trim() || null,
          sim_number: item.sim_number?.trim() || null,
          condition_note: item.condition_note?.trim() || null,
          note_text: item.note_text?.trim() || null,
        }))
        .filter(item => item.product_id || item.device_name || item.imei || item.license_plate || item.account_name || item.sim_number || item.condition_note || item.note_text),
    };
    closeSimpleModal();
    const r = await api.put(`/admin/orders/${o.id}/warranty`, payload, { onError: 'toast' });
    if (r) {
      ui.toast('Đã lưu bảo hành', 'success');
      openDetail(o.id);
      loadList();
    }
  }

  async function openWarrantyMoveModal() {
    const o = state.currentDetail;
    const items = ((o.warranty && o.warranty.items) || []).filter(item => item.current_status !== 'cancelled');
    if (!items.length) {
      ui.toast('Chưa có item bảo hành để cập nhật kho', 'warning');
      return;
    }
    const suppliers = await api.get('/admin/suppliers/all').catch(() => ({ items: [] }));
    const itemOptions = items.map(item => `<option value="${item.id}">${esc(item.product_name || item.device_name || ('Item #' + item.id))}</option>`).join('');
    const supplierOptions = ['<option value="0">— Không chọn —</option>']
      .concat((suppliers.items || []).map(s => `<option value="${s.id}">${esc(s.name)}</option>`))
      .join('');
    const actionOptions = (item) => warrantyMoveOptionsForItem(item)
      .map(action => `<option value="${action.code}">${esc(action.label)}</option>`)
      .join('');

    const html = `
      <div style="padding:14px">
        <div class="field"><label>Item bảo hành</label><select id="wmItem" class="select">${itemOptions}</select></div>
        <div class="field"><label>Thao tác</label>
          <select id="wmAction" class="select">${actionOptions(items[0])}</select>
        </div>
        <div class="field"><label>Nhà cung cấp</label><select id="wmSupplier" class="select">${supplierOptions}</select></div>
        <div class="field"><label>Thời điểm</label><input id="wmOccurredAt" type="datetime-local" class="input"></div>
        <div class="field"><label>Ghi chú</label><textarea id="wmNote" rows="3" class="input" placeholder="Ghi chú diễn biến, vị trí hàng, người giao nhận..."></textarea></div>
      </div>`;

    const okPromise = openSimpleModal('Cập nhật kho bảo hành', html, 'Lưu');
    const $wmItem = document.getElementById('wmItem');
    const $wmAction = document.getElementById('wmAction');
    const syncWarrantyActions = () => {
      const item = items.find(entry => Number(entry.id) === Number($wmItem.value)) || items[0];
      const prev = $wmAction.value;
      $wmAction.innerHTML = actionOptions(item);
      if ([...$wmAction.options].some(opt => opt.value === prev)) $wmAction.value = prev;
    };
    if ($wmItem && $wmAction) {
      $wmItem.addEventListener('change', syncWarrantyActions);
      syncWarrantyActions();
    }
    const ok = await okPromise;
    if (!ok) return;
    const payload = {
      warranty_item_id: Number(document.getElementById('wmItem').value) || 0,
      action_code: document.getElementById('wmAction').value,
      supplier_id: Number(document.getElementById('wmSupplier').value) || null,
      occurred_at: document.getElementById('wmOccurredAt').value || null,
      note_text: document.getElementById('wmNote').value.trim() || null,
    };
    closeSimpleModal();
    const r = await api.post(`/admin/orders/${o.id}/warranty/moves`, payload, { onError: 'toast' });
    if (r) {
      const receiptCode = r.receipt && r.receipt.code ? ` (${r.receipt.code})` : '';
      ui.toast('Đã cập nhật kho bảo hành' + receiptCode, 'success');
      openDetail(o.id);
      loadList();
    }
  }

  function renderLinesList() {
    const lines = state.currentDetail.lines || [];
    const $box = $('linesList');
    if (!$box) return;
    if (!lines.length) { $box.innerHTML = '<p style="color:#94a3b8">Đơn không có dòng công việc</p>'; return; }

    // Flat list of all items (cross-line) for product-dialog clicking
    const allItems = [];
    lines.forEach(l => (l.items || []).forEach(it => allItems.push(it)));

    $box.innerHTML = lines.map((ln, idx) => {
      const items = ln.items || [];
      const charges = ln.charges || [];

      const itemsHtml = items.length ? items.map(i => {
        const line = Number(i.qty) * Number(i.unit_price);
        const vat = Number(i.vat_percent) || 0;
        const sub = Math.round(line + line * vat / 100);
        const aii = allItems.indexOf(i);
        const fvs = i.field_values || [];
        const shownFvs = fvs.filter(f => f.value);
        const infoHtml = shownFvs.length
          ? `<div style="font-size:11.5px;color:#475569;margin-top:3px;padding-left:4px">
               ${shownFvs.map(f => `<span style="background:#f1f5f9;border-radius:4px;padding:1px 6px;margin-right:4px;display:inline-block"><b>${esc(f.label)}:</b> ${esc(f.value||'—')}</span>`).join('')}
               ${fvs.length > shownFvs.length ? `<span style="color:#94a3b8;font-size:10.5px">+${fvs.length - shownFvs.length} trường khác</span>` : ''}
             </div>` : '';
        return `<div class="row" data-item-idx="${aii}" style="cursor:pointer;flex-direction:column;align-items:flex-start;padding:5px 0">
          <div style="display:flex;width:100%;gap:8px;align-items:center">
            <span class="name" style="flex:2">${esc(i.product_name || ('SP #' + i.product_id))}
              ${i.product_code ? `<small style="color:#94a3b8">(${esc(i.product_code)})</small>` : ''}
            </span>
            <span class="qty" style="flex:0 0 28px">${i.qty}</span>
            <span class="price" style="flex:0 0 80px;text-align:right">${fmt(i.unit_price)}đ</span>
            <span class="vat" style="flex:0 0 30px;text-align:right;color:#94a3b8">${vat ? vat + '%' : ''}</span>
            <span class="sub" style="flex:0 0 80px;text-align:right;font-weight:600">${fmt(sub)}đ</span>
          </div>
          ${infoHtml}
        </div>`;
      }).join('') : '<p style="color:#94a3b8;font-size:12.5px;font-style:italic">Không có sản phẩm</p>';

      const chargesHtml = charges.length ? charges.map(c => {
        const neg = Number(c.amount) < 0;
        return `<div class="row" style="padding:3px 0">
          <span style="flex:1;font-size:13px">${esc(c.label)} <small style="color:#94a3b8">(${esc(c.kind)})</small></span>
          <span style="color:${neg ? '#16a34a' : '#dc2626'};font-weight:600;font-size:13px">${fmt(c.amount)}đ</span>
        </div>`;
      }).join('') : '';

      return `<div class="line-block" style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:10px;background:#fafbfd">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-weight:700;color:#1e3a8a">
          <span style="background:#3b82f6;color:#fff;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:12px">${idx + 1}</span>
          <span>${esc(ln.template_name || '(?)')}</span>
          <span style="margin-left:auto;color:#64748b;font-weight:600;font-size:13px">${fmt(ln.subtotal)}đ</span>
        </div>
        <div class="item-list">${itemsHtml}</div>
        ${chargesHtml ? `<div style="margin-top:8px;padding-top:8px;border-top:1px dashed #e2e8f0">${chargesHtml}</div>` : ''}
      </div>`;
    }).join('');

    $box.querySelectorAll('[data-item-idx]').forEach(row => {
      row.addEventListener('click', () => {
        const i = allItems[Number(row.dataset.itemIdx)];
        if (i) openProductDialog(i);
      });
    });
  }

  // ---- HOA HONG NHAN VIEN — staff tu gui yeu cau, admin duyet rieng ----
  function renderCommission() {
    const o = state.currentDetail;
    const $box = $('commissionSection');
    if (!$box) return;

    const me      = auth && auth.user ? auth.user() : null;
    const isAdmin = me && me.role === 'admin';
    const isStaff = me && me.role === 'staff';
    const isKTV   = me && me.role === 'kithuat';
    const canRequest = isStaff || isKTV;  // co the gui yeu cau (can admin duyet)

    const staffComms = o.staff_commissions || [];

    // Tao HTML tung dong hoa hong nhan vien
    const staffRowsHtml = staffComms.length
      ? staffComms.map(sc => {
          const approved = !!sc.approved_at;
          const pill = approved
            ? `<span class="cc-pill approved">✓ Đã duyệt</span>`
            : `<span class="cc-pill pending">⏳ Chờ duyệt</span>`;

          // Nut hanh dong theo role
          let actionsHtml = '';
          if (isAdmin) {
            const approveBtn = !approved
              ? `<button class="approve-sc btn-cc" data-cid="${sc.id}" style="font-size:11px;padding:2px 8px">✓ Duyệt</button>`
              : '';
            actionsHtml = `<div class="row-actions">
              ${approveBtn}
              <button class="edit-sc btn-cc ghost" data-cid="${sc.id}" title="Sửa">✎ Sửa</button>
              <button class="del-sc btn-cc danger" data-cid="${sc.id}" title="Xoá">🗑 Xoá</button>
            </div>`;
          } else if (canRequest && !approved && sc.requested_by === me.id) {
            actionsHtml = `<div class="row-actions">
              <button class="my-sc-withdraw btn-cc danger" data-cid="${sc.id}" style="font-size:11px;padding:2px 8px">✗ Rút</button>
            </div>`;
          }

          return `
            <div class="cc-staff-row" data-cid="${sc.id}">
              <span class="name">👤 ${esc(sc.staff_name || '—')}</span>
              <span class="amt">+ ${fmt(sc.amount)}đ</span>
              ${pill}
              ${actionsHtml}
              <div class="meta">
                ${approved
                  ? `Duyệt ${fmtDate(sc.approved_at)} · bởi ${esc(sc.approved_by_name || '—')}`
                  : `Yêu cầu ${fmtDate(sc.requested_at)}`}
                ${sc.note ? ` · ${esc(sc.note)}` : ''}
              </div>
            </div>`;
        }).join('')
      : `<div style="color:#b45309;font-size:13px;font-style:italic">Chưa có hoa hồng nhân viên cho đơn này.</div>`;

    // Form them: label va API khac nhau theo role
    const addBtnLabel  = isAdmin ? '+ Thêm' : '+ Gửi yêu cầu';
    const saveBtnLabel = isAdmin ? '✓ Thêm & Duyệt' : 'Gửi yêu cầu';

    $box.innerHTML = `
      <div class="commission-card">
        <div class="cc-head"><span class="star">⭐</span><span>Hoa hồng nhân viên</span></div>

        <div class="cc-staff-head">
          <span>👥 Nhân viên</span>
          ${(isAdmin || canRequest) ? `<button class="btn-cc" id="ccAddStaffBtn"
                  style="font-size:12px;padding:4px 10px;margin-left:auto">${addBtnLabel}</button>` : ''}
        </div>
        <div class="cc-staff-list" id="ccStaffList">${staffRowsHtml}</div>
        <div class="cc-add-staff-form" id="ccAddStaffForm">
          <div class="form-row">
            <div class="cc-staff-picker" id="ccStaffPicker">
              <button type="button" class="cc-staff-picker-btn" id="ccStaffPickerBtn">
                <span class="sp-placeholder">-- Chọn nhân viên / KTV --</span>
                <span class="sp-caret">▼</span>
              </button>
              <div class="cc-staff-picker-panel" id="ccStaffPickerPanel"></div>
              <input type="hidden" id="ccStaffSelect" value="">
            </div>
            <input type="text" inputmode="numeric" id="ccStaffAmt" placeholder="Số tiền (VND)" autocomplete="off">
          </div>
          <input type="text" id="ccStaffNote" maxlength="300" placeholder="Ghi chú (tuỳ chọn)">
          <div class="cc-actions" style="margin-top:4px">
            <button class="btn-cc" id="ccStaffSaveBtn">${saveBtnLabel}</button>
            <button class="btn-cc ghost" id="ccStaffCancelBtn">Huỷ</button>
          </div>
        </div>
      </div>
    `;

    // Dinh dang so tien khi go (500000 -> 500.000)
    const $amtInput = $('ccStaffAmt');
    if ($amtInput) {
      $amtInput.addEventListener('input', () => {
        const raw = $amtInput.value.replace(/\D/g, '');
        const cursor = $amtInput.selectionStart;
        const oldLen = $amtInput.value.length;
        $amtInput.value = raw ? Number(raw).toLocaleString('vi-VN') : '';
        const diff = $amtInput.value.length - oldLen;
        $amtInput.setSelectionRange(cursor + diff, cursor + diff);
      });
    }

    // Bind form them moi
    const $addForm     = $('ccAddStaffForm');
    const $addBtn      = $('ccAddStaffBtn');
    const $staffHidden = $('ccStaffSelect');       // hidden input luu id
    const $pickerBtn   = $('ccStaffPickerBtn');
    const $pickerPanel = $('ccStaffPickerPanel');

    // Helper: lay mau avatar theo role
    function spColor(role) { return role === 'staff' ? '#3b82f6' : '#16a34a'; }
    function spInitials(name) {
      const parts = name.trim().split(/\s+/);
      return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                               : name.slice(0, 2).toUpperCase();
    }
    function spRoleLabel(role) { return role === 'staff' ? 'Nhân viên' : 'KTV'; }

    let staffPickerList = [];

    function renderPickerBtn(s) {
      if (!s) {
        $pickerBtn.innerHTML = `<span class="sp-placeholder">-- Chọn nhân viên / KTV --</span><span class="sp-caret">▼</span>`;
        return;
      }
      $pickerBtn.innerHTML = `
        <span class="sp-avatar" style="background:${spColor(s.role)}">${spInitials(s.full_name)}</span>
        <span class="sp-name">${esc(s.full_name)}</span>
        <span class="sp-role-pill ${s.role}">${spRoleLabel(s.role)}</span>
        <span class="sp-caret">▼</span>`;
    }

    function buildPickerPanel(list) {
      const groups = [
        { key: 'staff',    label: 'Nhân viên', items: list.filter(x => x.role === 'staff') },
        { key: 'kithuat',  label: 'Kỹ thuật viên', items: list.filter(x => x.role === 'kithuat') },
      ];
      $pickerPanel.innerHTML = groups.filter(g => g.items.length).map(g => `
        <div class="sp-group-label">${g.label}</div>
        ${g.items.map(s => `
          <div class="sp-item" data-sid="${s.id}" data-role="${s.role}">
            <span class="sp-avatar" style="background:${spColor(s.role)}">${spInitials(s.full_name)}</span>
            <div class="sp-info">
              <div class="sp-iname">${esc(s.full_name)}</div>
              ${s.phone ? `<div class="sp-iphone">📞 ${esc(s.phone)}</div>` : ''}
            </div>
            <span class="sp-role-pill ${s.role}">${spRoleLabel(s.role)}</span>
          </div>`).join('')}
      `).join('');

      $pickerPanel.querySelectorAll('.sp-item').forEach($item => {
        $item.addEventListener('click', () => {
          const sid  = Number($item.dataset.sid);
          const found = staffPickerList.find(x => x.id === sid);
          $staffHidden.value = sid;
          renderPickerBtn(found);
          $pickerPanel.classList.remove('open');
          $pickerPanel.querySelectorAll('.sp-item').forEach(el => el.classList.toggle('selected', el === $item));
        });
      });
    }

    if ($pickerBtn) {
      $pickerBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const isOpen = $pickerPanel.classList.contains('open');
        $pickerPanel.classList.toggle('open', !isOpen);
        if (!isOpen && staffPickerList.length === 0) {
          const list = await api.get('/admin/orders/staff-list-for-commission', { onError: 'toast' });
          if (list && list.length) {
            staffPickerList = list;
            buildPickerPanel(list);
          } else if (list) {
            ui.toast('Chưa có nhân viên / KTV nào trong hệ thống', 'error');
            $pickerPanel.classList.remove('open');
          }
        }
      });
      document.addEventListener('click', (e) => {
        if (!$('ccStaffPicker')?.contains(e.target)) $pickerPanel?.classList.remove('open');
      });
    }

    if ($addBtn) {
      $addBtn.addEventListener('click', () => {
        $addForm.style.display = 'flex';
        $addForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        $pickerBtn && $pickerBtn.focus();
      });
    }

    if ($('ccStaffCancelBtn')) $('ccStaffCancelBtn').addEventListener('click', () => {
      $addForm.style.display = 'none';
      $pickerPanel.classList.remove('open');
    });

    if ($('ccStaffSaveBtn')) $('ccStaffSaveBtn').addEventListener('click', async () => {
      const staffId = Number($staffHidden.value);
      const amt     = Math.max(0, Math.round(Number($('ccStaffAmt').value.replace(/\./g, '').replace(/,/g, '.')) || 0));
      if (!staffId) { ui.toast('Chọn nhân viên', 'error'); return; }
      if (!amt)     { ui.toast('Nhập số tiền', 'error'); return; }
      const note = ($('ccStaffNote').value || '').trim();
      if (isAdmin) {
        const r = await api.post(`/admin/orders/${o.id}/staff-commissions`,
          { staff_id: staffId, amount: amt, note: note || null }, { onError: 'toast' });
        if (r) { ui.toast('Đã thêm hoa hồng', 'success'); openDetail(o.id); }
      } else {
        const r = await api.post(`/admin/orders/${o.id}/my-staff-commission-request`,
          { staff_id: staffId, amount: amt, note: note || null }, { onError: 'toast' });
        if (r) { ui.toast('Đã gửi yêu cầu. Admin sẽ xét duyệt sớm.', 'success'); openDetail(o.id); }
      }
    });

    // Bind tung dong: Duyet / Sua / Xoa (admin) + Rut (staff)
    $('ccStaffList').querySelectorAll('.cc-staff-row').forEach($row => {
      const cid = Number($row.dataset.cid);
      const sc  = staffComms.find(x => x.id === cid);
      if (!sc) return;

      // Duyet (admin, pending)
      const $approveBtn = $row.querySelector('.approve-sc');
      if ($approveBtn) {
        $approveBtn.addEventListener('click', async () => {
          const r = await api.patch(`/admin/orders/${o.id}/staff-commissions/${cid}`, {}, { onError: 'toast' });
          if (r) { ui.toast('Đã duyệt hoa hồng', 'success'); openDetail(o.id); }
        });
      }

      // Sua (admin)
      const $editBtn = $row.querySelector('.edit-sc');
      if ($editBtn) {
        $editBtn.addEventListener('click', async () => {
          const newAmt = await promptNumberModal(`Sửa hoa hồng — ${sc.staff_name}`, sc.amount);
          if (newAmt === null) return;
          const v = Math.max(0, Math.round(Number(newAmt) || 0));
          if (!v) { ui.toast('Số tiền phải lớn hơn 0', 'error'); return; }
          const r = await api.patch(`/admin/orders/${o.id}/staff-commissions/${cid}`,
            { amount: v, note: sc.note }, { onError: 'toast' });
          if (r) { ui.toast('Đã cập nhật', 'success'); openDetail(o.id); }
        });
      }

      // Xoa (admin)
      const $delBtn = $row.querySelector('.del-sc');
      if ($delBtn) {
        $delBtn.addEventListener('click', async () => {
          const yes = await ui.confirm({ title: `Xoá hoa hồng của ${sc.staff_name}?`, okText: 'Xoá' });
          if (!yes) return;
          const r = await api.delete(`/admin/orders/${o.id}/staff-commissions/${cid}`, { onError: 'toast' });
          if (r) { ui.toast('Đã xoá', 'success'); openDetail(o.id); }
        });
      }

      // Rut (staff, pending, requested_by === me)
      const $withdrawBtn = $row.querySelector('.my-sc-withdraw');
      if ($withdrawBtn) {
        $withdrawBtn.addEventListener('click', async () => {
          const yes = await ui.confirm({ title: 'Rút yêu cầu hoa hồng?', okText: 'Rút', okClass: 'danger' });
          if (!yes) return;
          const r = await api.delete(`/admin/orders/${o.id}/my-staff-commission-request/${cid}`, { onError: 'toast' });
          if (r) { ui.toast('Đã rút yêu cầu', 'success'); openDetail(o.id); }
        });
      }
    });
  }

  // Popup nhap so don gian (dung cho sua so tien)
  function promptNumberModal(title, defaultVal) {
    return new Promise(resolve => {
      openSimpleModal(title,
        `<div style="padding:16px">
           <input type="number" id="promptNumInput" class="input" min="0" step="1000"
                  value="${Number(defaultVal) || ''}" style="width:100%;box-sizing:border-box">
         </div>`,
        'Lưu',
        () => { const el = document.getElementById('promptNumInput'); if (el) el.focus(); }
      ).then(confirmed => {
        const el = document.getElementById('promptNumInput');
        const val = confirmed && el ? el.value : null;
        closeSimpleModal();
        resolve(val);
      });
    });
  }

  // ---- DIALOG CHI TIET SAN PHAM (overlay) -----------------------
  function openProductDialog(item) {
    const img = item.product_image || item.product_thumb || '';
    const fields = (item.field_values || []).slice().sort((a, b) => a.seq - b.seq);
    const fieldHtml = fields.length
      ? `<div style="margin-top:12px;border-top:1px dashed #e2e8f0;padding-top:10px">
          <div style="font-weight:600;color:#475569;margin-bottom:6px;font-size:13px">Thông tin gắn theo</div>
          ${fields.map(f => `
            <div style="display:flex;justify-content:space-between;gap:8px;padding:4px 0;font-size:14px;border-bottom:1px solid #f1f5f9">
              <span style="color:#64748b">${esc(f.label)}</span>
              <span style="font-weight:600;color:#1e293b;text-align:right">${esc(f.value || '—')}</span>
            </div>`).join('')}
         </div>`
      : '';
    const html = `
      <div style="padding:16px;display:flex;gap:14px;flex-wrap:wrap">
        <div style="flex:0 0 180px">
          ${img
            ? `<img src="${esc(img)}" style="width:180px;height:180px;object-fit:cover;border-radius:10px;border:1px solid #e2e8f0">`
            : `<div style="width:180px;height:180px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8">Không có ảnh</div>`}
        </div>
        <div style="flex:1;min-width:220px">
          <h3 style="margin:0 0 6px">${esc(item.product_name || ('SP #' + item.product_id))}</h3>
          <div style="color:#64748b;margin-bottom:10px">Mã: <b>${esc(item.product_code || '—')}</b></div>
          <div class="bill" style="margin-bottom:10px">
            <div class="row"><span>Đơn giá</span><span><b>${fmt(item.unit_price)}đ</b></span></div>
            <div class="row"><span>Số lượng</span><span>${item.qty}</span></div>
            <div class="row"><span>VAT</span><span>${Number(item.vat_percent) || 0}%</span></div>
            <div class="row total"><span>Thành tiền</span>
              <span>${fmt(Math.round(Number(item.qty) * Number(item.unit_price) * (1 + (Number(item.vat_percent) || 0) / 100)))}đ</span>
            </div>
          </div>
          ${item.product_warranty_months ? `<div style="color:#64748b">Bảo hành: <b>${item.product_warranty_months} tháng</b></div>` : ''}
          ${item.product_description ? `<div style="margin-top:8px;color:#334155;white-space:pre-wrap">${esc(item.product_description)}</div>` : ''}
          ${fieldHtml}
        </div>
      </div>
    `;
    openSimpleModal('Chi tiết sản phẩm', html, 'Đóng', null, /*hideCancel*/ true).then(() => closeSimpleModal());
  }

  function renderPhotoList() {
    const o = state.currentDetail;
    const ps = (o.step_photos || []).slice().sort((a, b) =>
      new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    );
    const $box = $('photoList');
    if (!ps.length) { $box.innerHTML = '<p style="color:#94a3b8">Chưa có ảnh</p>'; return; }
    if (!state.photosExpanded) {
      $box.innerHTML = `<div style="padding:10px 12px;border:1px dashed #cbd5e1;border-radius:10px;background:#f8fafc;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="font-size:13px;color:#475569">Có <b>${fmt(ps.length)}</b> ảnh các bước. Ảnh chưa tải để giảm dữ liệu.</div>
        <button class="btn ghost sm" id="btnLoadOrderPhotos">Xem ảnh</button>
      </div>`;
      const $btn = $('btnLoadOrderPhotos');
      if ($btn) {
        $btn.addEventListener('click', () => {
          state.photosExpanded = true;
          renderPhotoList();
        });
      }
      return;
    }
    $box.innerHTML = `<div class="photo-group-grid">
      ${ps.map((p, idx) => `
        <div class="ph">
          <button type="button" class="btnPhotoPreview" data-photo-idx="${idx}" style="padding:0;border:none;background:none;display:block;width:100%;cursor:zoom-in">
            <img src="${esc(p.url)}" alt="" loading="lazy">
          </button>
          <div class="meta">${fmtDate(p.uploaded_at)}${p.caption ? ' · ' + esc(p.caption) : ''}</div>
        </div>
      `).join('')}
    </div>`;
    $box.querySelectorAll('.btnPhotoPreview').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.photoIdx);
        const photo = ps[idx];
        if (photo) openOrderPhotoPreview(ps, idx);
      });
    });
  }

  function openOrderPhotoPreview(photos, initialIndex = 0) {
    const items = Array.isArray(photos) ? photos.filter(p => p && p.url) : [];
    if (!items.length) return;
    let currentIndex = Math.max(0, Math.min(items.length - 1, Number(initialIndex) || 0));
    const old = document.getElementById('orderPhotoLightbox');
    if (old) old.remove();
    const div = document.createElement('div');
    div.id = 'orderPhotoLightbox';
    div.style.cssText = 'position:fixed;inset:0;z-index:320;background:radial-gradient(circle at top, rgba(30,41,59,.32), rgba(2,6,23,.96) 46%);backdrop-filter:blur(14px);display:flex;flex-direction:column';
    div.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 24px 10px">
        <div style="min-width:0;display:flex;align-items:center;gap:14px">
          <div style="width:44px;height:44px;border-radius:14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;font-weight:700">IMG</div>
          <div style="min-width:0">
            <div style="font-size:14px;font-weight:700;color:#f8fafc">Ảnh các bước</div>
            <div id="orderPhotoMeta" style="font-size:12.5px;color:rgba(226,232,240,.82);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:52vw"></div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end">
          <div id="orderPhotoCount" style="padding:0 12px;height:40px;border-radius:999px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:#e2e8f0;font-size:13px;display:flex;align-items:center"></div>
          <button type="button" id="btnPhotoZoomOut" style="width:40px;height:40px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08);color:#fff;font-size:20px;cursor:pointer">−</button>
          <button type="button" id="btnPhotoZoomIn" style="width:40px;height:40px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08);color:#fff;font-size:20px;cursor:pointer">+</button>
          <button type="button" id="btnPhotoOpenBrowser" style="padding:10px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08);color:#fff;font-size:13px;font-weight:600;cursor:pointer">Mở với trình duyệt</button>
          <button type="button" id="btnPhotoClose" style="width:40px;height:40px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:#fff;color:#0f172a;font-size:20px;cursor:pointer">×</button>
        </div>
      </div>
      <div style="flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr);padding:8px 18px 18px">
        <div style="position:relative;min-height:0;border-radius:28px;background:linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.08);box-shadow:0 24px 80px rgba(0,0,0,.28);overflow:hidden">
          <button type="button" id="btnPhotoPrev" style="position:absolute;left:18px;top:50%;transform:translateY(-50%);z-index:2;width:52px;height:52px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(15,23,42,.52);color:#fff;font-size:28px;cursor:pointer">‹</button>
          <button type="button" id="btnPhotoNext" style="position:absolute;right:18px;top:50%;transform:translateY(-50%);z-index:2;width:52px;height:52px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(15,23,42,.52);color:#fff;font-size:28px;cursor:pointer">›</button>
          <div id="orderPhotoLightboxStage" style="height:100%;display:flex;align-items:center;justify-content:center;padding:28px 88px 126px;overflow:auto;cursor:zoom-in">
            <img id="orderPhotoPreviewImg" src="" alt="" style="max-width:min(88vw,1580px);max-height:calc(100vh - 240px);object-fit:contain;border-radius:22px;box-shadow:0 30px 90px rgba(0,0,0,.34);transform:scale(1);transform-origin:center center;transition:transform .18s ease">
          </div>
          <div style="position:absolute;left:0;right:0;bottom:0;padding:14px 18px 18px;background:linear-gradient(180deg, rgba(2,6,23,0), rgba(2,6,23,.78) 38%, rgba(2,6,23,.95))">
            <div id="orderPhotoCaption" style="color:#f8fafc;font-size:14px;font-weight:600;min-height:21px;margin-bottom:12px"></div>
            <div id="orderPhotoThumbs" style="display:flex;gap:10px;overflow:auto;padding-bottom:2px"></div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(div);

    const img = document.getElementById('orderPhotoPreviewImg');
    const stage = document.getElementById('orderPhotoLightboxStage');
    const $meta = document.getElementById('orderPhotoMeta');
    const $count = document.getElementById('orderPhotoCount');
    const $caption = document.getElementById('orderPhotoCaption');
    const $thumbs = document.getElementById('orderPhotoThumbs');
    const $prev = document.getElementById('btnPhotoPrev');
    const $next = document.getElementById('btnPhotoNext');
    const $in = document.getElementById('btnPhotoZoomIn');
    const $out = document.getElementById('btnPhotoZoomOut');
    const $browser = document.getElementById('btnPhotoOpenBrowser');
    const $close = document.getElementById('btnPhotoClose');
    let zoom = 1;

    const applyZoom = () => {
      if (!img || !stage) return;
      zoom = Math.max(0.75, Math.min(5, zoom));
      img.style.transform = `scale(${zoom})`;
      stage.style.cursor = zoom > 1 ? 'zoom-out' : 'zoom-in';
    };
    const renderThumbs = () => {
      if (!$thumbs) return;
      $thumbs.innerHTML = items.map((p, idx) => `
        <button type="button" data-thumb-idx="${idx}" style="flex:0 0 auto;width:72px;height:72px;padding:0;border-radius:16px;border:${idx === currentIndex ? '2px solid #fff' : '1px solid rgba(255,255,255,.14)'};background:${idx === currentIndex ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.06)'};overflow:hidden;cursor:pointer;opacity:${idx === currentIndex ? '1' : '.72'}">
          <img src="${esc(p.url)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block">
        </button>
      `).join('');
      $thumbs.querySelectorAll('[data-thumb-idx]').forEach((btn) => {
        btn.addEventListener('click', () => {
          currentIndex = Number(btn.dataset.thumbIdx) || 0;
          zoom = 1;
          renderCurrent();
        });
      });
    };
    const renderCurrent = () => {
      const photo = items[currentIndex];
      if (!photo || !img) return;
      const meta = [fmtDate(photo.uploaded_at), photo.step_code].filter(Boolean).join(' · ');
      img.src = photo.url;
      img.alt = photo.caption || photo.step_code || `Ảnh bước ${currentIndex + 1}`;
      if ($meta) $meta.textContent = meta;
      if ($count) $count.textContent = `${currentIndex + 1} / ${items.length}`;
      if ($caption) $caption.textContent = photo.caption || photo.step_code || '';
      if ($prev) $prev.style.display = items.length > 1 ? '' : 'none';
      if ($next) $next.style.display = items.length > 1 ? '' : 'none';
      applyZoom();
      renderThumbs();
    };
    const move = (delta) => {
      if (items.length < 2) return;
      currentIndex = (currentIndex + delta + items.length) % items.length;
      zoom = 1;
      renderCurrent();
    };
    const close = () => {
      document.removeEventListener('keydown', onKeydown);
      div.remove();
    };
    const onKeydown = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === '+' || e.key === '=') { zoom += 0.25; applyZoom(); }
      else if (e.key === '-') { zoom -= 0.25; applyZoom(); }
      else if (e.key === 'ArrowLeft') move(-1);
      else if (e.key === 'ArrowRight') move(1);
    };

    document.addEventListener('keydown', onKeydown);
    if ($prev) $prev.addEventListener('click', () => move(-1));
    if ($next) $next.addEventListener('click', () => move(1));
    if ($in) $in.addEventListener('click', () => { zoom += 0.25; applyZoom(); });
    if ($out) $out.addEventListener('click', () => { zoom -= 0.25; applyZoom(); });
    if ($browser) $browser.addEventListener('click', () => {
      const photo = items[currentIndex];
      if (photo && photo.url) window.open(photo.url, '_blank', 'noopener,noreferrer');
    });
    if ($close) $close.addEventListener('click', close);
    if (stage) {
      stage.addEventListener('click', (e) => {
        if (e.target === stage) {
          close();
          return;
        }
        zoom = zoom > 1 ? 1 : 1.75;
        applyZoom();
      });
      stage.addEventListener('wheel', (e) => {
        e.preventDefault();
        zoom += e.deltaY < 0 ? 0.2 : -0.2;
        applyZoom();
      }, { passive: false });
    }
    renderCurrent();
  }

  const KIND_LABEL = { account: 'Tài khoản', vehicle: 'Biển số xe', sim: 'Số SIM' };
  const ACTION_LABEL = { add: 'Thêm mới', update: 'Sửa', delete: 'Xoá' };
  const ACTION_CLS = { add: 'green', update: 'amber', delete: 'red' };
  const STATUS_LABEL = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };

  function renderKtvRequests() {
    const o = state.currentDetail;
    const reqs = o.customer_update_requests || [];
    const $sec = $('ktvReqSection');
    const $box = $('ktvReqList');
    if (!reqs.length) {
      if ($sec) $sec.style.display = 'none';
      return;
    }
    if ($sec) $sec.style.display = '';

    $box.innerHTML = reqs.map(r => {
      const kindLbl = KIND_LABEL[r.asset_kind] || r.asset_kind;
      const actLbl  = ACTION_LABEL[r.action] || r.action;
      const actCls  = ACTION_CLS[r.action] || '';
      const statusLbl = STATUS_LABEL[r.status] || r.status;
      const statusCls = r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : 'amber';

      let detailHtml = '';
      if (r.action === 'add') {
        detailHtml = `<div><b>Giá trị mới:</b> ${esc(r.value || '')}</div>`;
      } else if (r.action === 'update') {
        detailHtml = `<div><b>Cũ:</b> ${esc(r.target_current_value || '—')} → <b>Mới:</b> ${esc(r.value || '')}</div>`;
      } else if (r.action === 'delete') {
        detailHtml = `<div><b>Xoá:</b> ${esc(r.target_current_value || ('#' + (r.target_id || '?')))}</div>`;
      }

      const meta = `KTV ${esc(r.requested_by_name || '—')}`
        + (r.reviewed_by_name ? ` · ${statusLbl} bởi ${esc(r.reviewed_by_name)}${r.reviewed_at ? ' lúc ' + fmtDate(r.reviewed_at) : ''}` : '');

      const actions = r.status === 'pending'
        ? `<div style="margin-top:8px;display:flex;gap:6px">
             <button class="btn sm" data-cur-approve="${r.id}" style="background:#16a34a">✓ Duyệt</button>
             <button class="btn ghost sm" data-cur-reject="${r.id}" style="color:#dc2626">✗ Từ chối</button>
           </div>`
        : (r.review_note ? `<div style="color:#64748b;margin-top:4px"><b>Ghi chú duyệt:</b> ${esc(r.review_note)}</div>` : '');

      return `<div class="cur-item" style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:8px">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px">
          <span class="pill ${actCls}">${esc(actLbl)} ${esc(kindLbl)}</span>
          <span class="pill ${statusCls}">${esc(statusLbl)}</span>
          <span style="color:#64748b;font-size:13px;margin-left:auto">${esc(meta)}</span>
        </div>
        ${detailHtml}
        ${r.note ? `<div style="color:#475569;margin-top:4px">Ghi chú KTV: ${esc(r.note)}</div>` : ''}
        ${actions}
      </div>`;
    }).join('');

    $box.querySelectorAll('[data-cur-approve]').forEach(b => {
      b.addEventListener('click', () => reviewKtvRequest(Number(b.dataset.curApprove), 'approve'));
    });
    $box.querySelectorAll('[data-cur-reject]').forEach(b => {
      b.addEventListener('click', () => reviewKtvRequest(Number(b.dataset.curReject), 'reject'));
    });
  }

  async function reviewKtvRequest(id, action) {
    const isReject = action === 'reject';
    const html = `
      <div style="padding:14px">
        <p>${isReject ? 'Từ chối' : 'Duyệt'} đề xuất này?</p>
        <div class="field"><label>Ghi chú (tuỳ chọn)</label>
          <input id="curNote" class="input" maxlength="500">
        </div>
      </div>`;
    const ok = await openSimpleModal(isReject ? 'Từ chối đề xuất' : 'Duyệt đề xuất', html, isReject ? 'Từ chối' : 'Duyệt');
    if (!ok) return;
    const review_note = ($('curNote') && $('curNote').value.trim()) || null;
    closeSimpleModal();
    const r = await api.post(`/admin/customer-assets/requests/${id}/${action}`,
      { review_note }, { onError: 'toast' });
    if (r) {
      ui.toast(isReject ? 'Đã từ chối' : 'Đã duyệt', 'success');
      openDetail(state.currentDetail.id);
    }
  }

  function renderAdminPending() {
    const o = state.currentDetail;
    const pending = (o._adminPending || []).filter(p => !p.confirmed);
    if (!pending.length) return;

    const $box = $('odActions');
    pending.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.id = `btnConfirmPending_${p.id}`;
      btn.style.cssText = 'background:#7c3aed;white-space:nowrap';
      btn.textContent = `✓ Xác nhận thu từ khách ${fmt(p.amount)}đ`;
      $box.prepend(btn);
      btn.addEventListener('click', async () => {
        const yes = await ui.confirm({ title: `Xác nhận đã nhận ${fmt(p.amount)}đ từ khách?`, okText: 'Xác nhận' });
        if (!yes) return;
        const r = await api.post(`/admin/orders/${o.id}/confirm-admin-pending/${p.id}`, {}, { onError: 'toast' });
        if (r) { ui.toast('Đã xác nhận', 'success'); openDetail(o.id); loadList(); }
      });
    });
  }

  function renderPaymentHistory() {
    const o = state.currentDetail;
    const hist = o._payHistory;
    const el = $('payHistSection');
    if (!el) return;

    const direct = (hist && hist.direct) || [];
    const viaReq = (hist && hist.via_request) || [];
    if (!direct.length && !viaReq.length) { el.innerHTML = ''; return; }

    const sourceLabel = {
      admin_mark_paid:   'Ghi nhận TT',
      admin_pending:     'KH chuyển (đã XN)',
      staff_collection:  'KTV thu',
      customer_self_pay: 'KH tự trả',
    };
    const prStatusLabel = {
      pending:         'Chờ thu',
      partially_paid:  'Thu một phần',
      paid:            'Đã thu đủ',
      expired:         'Hết hạn',
      cancelled:       'Đã huỷ',
    };
    const prStatusCls = {
      pending:        '#f59e0b',
      partially_paid: '#f59e0b',
      paid:           '#16a34a',
      expired:        '#94a3b8',
      cancelled:      '#94a3b8',
    };

    function rowDate(d) {
      if (!d) return '—';
      const dt = new Date(d);
      return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }

    const rows = [];

    for (const p of direct) {
      const lbl = sourceLabel[p.source] || p.source;
      rows.push(`
        <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
          <span style="flex:0 0 130px;font-size:11.5px;color:#475569">${esc(lbl)}</span>
          <span style="flex:0 0 110px;font-weight:700;color:#0f172a">${fmt(p.amount)}đ</span>
          <span style="flex:1;font-size:11.5px;color:#64748b">${rowDate(p.paid_at)}</span>
          ${p.staff_name ? `<span style="font-size:11.5px;color:#64748b">${esc(p.staff_name)}</span>` : ''}
          ${p.note ? `<span style="font-size:11px;color:#94a3b8;font-style:italic">${esc(p.note)}</span>` : ''}
        </div>`);
    }

    for (const pr of viaReq) {
      const stCls = prStatusCls[pr.request_status] || '#94a3b8';
      const stLbl = prStatusLabel[pr.request_status] || pr.request_status;
      rows.push(`
        <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
          <span style="flex:0 0 150px;font-size:11.5px;color:#475569;display:flex;align-items:center;gap:4px">
            <a href="/admin/payment-request-detail.html?id=${pr.id}" target="_blank"
               style="color:#2563eb;font-weight:700;text-decoration:none" title="Xem phiếu">
              ${esc(pr.request_code)} ↗
            </a>
            <button onclick="navigator.clipboard.writeText('${esc(pr.request_code)}');event.target.textContent='✓';setTimeout(()=>event.target.textContent='⎘',1200)"
              style="border:none;background:none;cursor:pointer;color:#94a3b8;font-size:12px;padding:0" title="Copy mã phiếu">⎘</button>
          </span>
          <span style="flex:0 0 110px;font-weight:700;color:#0f172a">${fmt(pr.amount)}đ</span>
          <span style="flex:1;font-size:11.5px;color:#64748b">${rowDate(pr.paid_at || pr.created_at)}</span>
          <span style="font-size:11px;font-weight:700;color:${stCls}">${stLbl}</span>
        </div>`);
    }

    el.innerHTML = `
      <div style="font-size:13px;font-weight:700;color:#334155;margin-bottom:8px">Lịch sử thanh toán</div>
      <div style="font-size:12.5px">${rows.join('')}</div>`;
  }

  function renderActions() {
    const o = state.currentDetail;
    const $box = $('odActions');
    const btns = [];

    if (o.status === 'pending') {
      btns.push(`<button class="btn" id="btnApprove">✓ Duyệt đơn</button>`);
    }
    if (o.status !== 'cancelled' && !o.completed_at) {
      btns.push(`<button class="btn ghost" id="btnAssignKTV">Gán sửa KTV / công</button>`);
    }
    if (IS_ADMIN && Number(o.total_amount) > Number(o.paid_amount)) {
      btns.push(`<button class="btn ghost" id="btnMarkPaid">Ghi nhận thanh toán</button>`);
    }
    if (!IS_ADMIN && Number(o.total_amount) > Number(o.paid_amount) && o.status !== 'cancelled') {
      btns.push(`<button class="btn" id="btnStaffReceiveOrder" style="background:#2563eb;color:#fff">💵 Nhận tiền</button>`);
    }
    btns.push(`<button class="btn" id="btnInvoice" style="background:#1e40af">🧾 Hoá đơn báo giá</button>`);
    btns.push(`<button class="btn ghost" id="btnUploadPhoto">+ Ảnh</button>`);
    if (o.status !== 'cancelled') {
      btns.push(`<button class="btn ghost" id="btnCancel" style="color:#dc2626;margin-left:auto">Huỷ đơn</button>`);
    }

    $box.innerHTML = btns.join('');

    if ($('btnApprove'))      $('btnApprove').addEventListener('click', approveOrder);
    if ($('btnAssignKTV'))    $('btnAssignKTV').addEventListener('click', assignKTV);
    if ($('btnMarkPaid'))           $('btnMarkPaid').addEventListener('click', markPaid);
    if ($('btnStaffReceiveOrder'))  $('btnStaffReceiveOrder').addEventListener('click', openStaffReceiveOrderModal);
    if ($('btnInvoice'))            $('btnInvoice').addEventListener('click', openInvoice);
    if ($('btnUploadPhoto'))  $('btnUploadPhoto').addEventListener('click', uploadStepPhoto);
    if ($('btnCancel'))       $('btnCancel').addEventListener('click', cancelOrder);
  }

  // ---- ACTIONS ------------------------------------------------
  async function approveOrder() {
    const ok = await api.post(`/admin/orders/${state.currentDetail.id}/approve`, {}, { onError: 'toast' });
    if (ok) { ui.toast('Đã duyệt', 'success'); openDetail(state.currentDetail.id); loadList(); }
  }

  async function assignKTV() {
    const id = state.currentDetail.id;
    const r = await api.get(`/admin/orders/${id}/suggested-staff`).catch(() => null);
    const staff = (r && r.items) || [];
    if (!staff.length) { ui.toast('Chưa có KTV nào', 'warning'); return; }

    const currentStaffId = state.currentDetail.assigned_staff_id;
    const defaultSel = currentStaffId || (staff[0] && staff[0].id) || 0;

    function initials(name) {
      const p = (name || '').trim().split(/\s+/);
      return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : (name || '??').slice(0, 2).toUpperCase();
    }

    const wageInit = state.currentDetail.wage_amount
      ? Number(state.currentDetail.wage_amount).toLocaleString('vi-VN') : '';

    const cardsHtml = staff.map(s => {
      const isSel = s.id === defaultSel;
      const avatar = s.avatar_url
        ? `<img src="${esc(s.avatar_url)}" class="ktv-card-avatar" alt="">`
        : `<div class="ktv-card-avatar ktv-card-initials">${initials(s.full_name)}</div>`;
      const badge = s.active_count > 0
        ? `<span class="ktv-card-badge">${s.active_count} đơn</span>`
        : `<span class="ktv-card-badge free">Rảnh</span>`;
      return `
        <label class="ktv-card${isSel ? ' selected' : ''}">
          <input type="radio" name="ktvSel" value="${s.id}" ${isSel ? 'checked' : ''} style="display:none">
          ${avatar}
          <div class="ktv-card-info">
            <div class="ktv-card-name">${esc(s.full_name)}</div>
            ${badge}
          </div>
        </label>`;
    }).join('');

    const html = `
      <style>
        .ktv-grid { display:flex; flex-direction:column; gap:6px; max-height:280px; overflow-y:auto; padding:2px 0 8px; }
        .ktv-card { display:flex; align-items:center; gap:10px; padding:10px 12px; border:2px solid #e2e8f0; border-radius:10px; cursor:pointer; transition:border-color .15s,background .15s; }
        .ktv-card:hover { border-color:#93c5fd; background:#f0f9ff; }
        .ktv-card.selected { border-color:#3b82f6; background:#eff6ff; }
        .ktv-card-avatar { width:40px; height:40px; border-radius:50%; object-fit:cover; flex-shrink:0; }
        .ktv-card-initials { background:#3b82f6; color:#fff; font-weight:700; font-size:15px; display:flex; align-items:center; justify-content:center; }
        .ktv-card-info { flex:1; min-width:0; }
        .ktv-card-name { font-weight:600; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ktv-card-badge { font-size:11px; padding:1px 7px; border-radius:20px; background:#fef3c7; color:#92400e; margin-top:2px; display:inline-block; }
        .ktv-card-badge.free { background:#d1fae5; color:#065f46; }
        .aWage-wrap label { display:block; font-size:13px; font-weight:600; color:#374151; margin-bottom:4px; }
      </style>
      <div style="padding:14px 14px 0">
        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px">Chọn KTV</div>
        <div class="ktv-grid">${cardsHtml}</div>
      </div>
      <div class="aWage-wrap" style="padding:12px 14px 14px">
        <label for="aWage">Tiền công (đ)</label>
        <input id="aWage" type="text" inputmode="numeric" class="input" value="${wageInit}" placeholder="0" autocomplete="off" style="width:100%;box-sizing:border-box">
      </div>
    `;

    const dlg = await openSimpleModal('Gán KTV', html, 'Lưu', () => {
      // Highlight card khi chon
      document.querySelectorAll('.ktv-card').forEach(card => {
        const radio = card.querySelector('input[type=radio]');
        card.addEventListener('click', () => {
          document.querySelectorAll('.ktv-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          radio.checked = true;
        });
      });
      // Format tien cong
      const $w = document.getElementById('aWage');
      if ($w) {
        $w.addEventListener('input', () => {
          const raw = $w.value.replace(/\D/g, '');
          const cur = $w.selectionStart;
          const oldLen = $w.value.length;
          $w.value = raw ? Number(raw).toLocaleString('vi-VN') : '';
          const diff = $w.value.length - oldLen;
          $w.setSelectionRange(cur + diff, cur + diff);
        });
      }
    });
    if (!dlg) return;

    const checkedRadio = document.querySelector('input[name="ktvSel"]:checked');
    const staffId = checkedRadio ? Number(checkedRadio.value) : defaultSel;
    const staffName = (staff.find(s => s.id === staffId) || {}).full_name || '';
    const wage = Number((document.getElementById('aWage').value || '').replace(/\./g, '').replace(/,/g, '.')) || 0;
    closeSimpleModal();
    await doAssignKTV(id, staffId, staffName, wage, false);
  }

  async function doAssignKTV(orderId, staffId, staffName, wage, force) {
    try {
      const ok = await api.post(`/admin/orders/${orderId}/assign-staff`,
        { staff_id: staffId, wage_amount: wage, force: !!force },
        { silent: true });
      if (ok) { ui.toast('Đã gán', 'success'); openDetail(orderId); loadList(); }
    } catch (e) {
      if (e.status === 409 && e.data && e.data.code === 'INSUFFICIENT_HOLDINGS') {
        const lacks = (e.data.details && e.data.details.lacks) || [];
        const yes = await ui.insufficientHoldingsDialog({ staffName, lacks });
        if (yes) await doAssignKTV(orderId, staffId, staffName, wage, true);
        return;
      }
      ui.toast(e.message || 'Lỗi gán KTV', 'error');
    }
  }

  async function markPaid() {
    const o = state.currentDetail;
    const remain = Math.max(0, Number(o.total_amount) - Number(o.paid_amount));
    const total = Number(o.total_amount) || 0;
    const paid = Number(o.paid_amount) || 0;
    const alreadyDealer = !!o.collected_for_dealer;
    const html = `
      <div class="mp-modal">
        <div class="mp-summary">
          <div class="mp-sum-row"><span>Tổng đơn</span><b>${fmt(total)}đ</b></div>
          <div class="mp-sum-row"><span>Đã thu</span><b>${fmt(paid)}đ</b></div>
          <div class="mp-sum-row mp-remain"><span>Còn lại</span><b>${fmt(remain)}đ</b></div>
        </div>

        <div class="mp-field">
          <label>Số tiền thu</label>
          <div class="mp-amt-wrap">
            <input id="mpAmt" type="text" inputmode="numeric" autocomplete="off"
                   class="input mp-amt" value="${fmt(remain)}" placeholder="0">
            <span class="mp-amt-unit">đ</span>
          </div>
          <div class="mp-quick">
            <button type="button" data-mp-q="full">Toàn bộ (${fmt(remain)})</button>
            <button type="button" data-mp-q="half">½ còn lại</button>
            <button type="button" data-mp-q="0">Xoá</button>
          </div>
        </div>

        <div class="mp-row2">
          <div class="mp-field">
            <label>Phương thức</label>
            <select id="mpMethod" class="select">
              <option value="cash">Tiền mặt</option>
              <option value="transfer">Chuyển khoản</option>
            </select>
          </div>
          <div class="mp-field">
            <label>Ghi chú</label>
            <input id="mpNote" type="text" class="input" placeholder="VD: chuyển khoản qua Vietcombank">
          </div>
        </div>

        <div class="mp-field">
          <label>Ảnh chứng từ <small style="color:#94a3b8">(có thể thêm nhiều ảnh)</small></label>
          <div id="mpProofs" class="mp-proofs"></div>
          <div class="mp-upload">
            <label class="mp-upload-btn" for="mpFile">+ Thêm ảnh</label>
            <input id="mpFile" type="file" accept="image/*" multiple style="display:none">
            <span id="mpUpStatus" class="mp-upload-status"></span>
          </div>
        </div>

        <label class="mp-check">
          <input type="checkbox" id="mpForDealer" ${alreadyDealer ? 'checked disabled' : ''}>
          <span>Đơn thu hộ đại lí ${alreadyDealer ? '<small style="color:#16a34a">(đã đánh dấu trước đó)</small>' : '<small style="color:#94a3b8">(tick để lọc trong báo cáo sau này)</small>'}</span>
        </label>
      </div>
    `;
    const ok = await openSimpleModal('Ghi nhận thanh toán', html, 'Lưu', () => {
      injectMarkPaidStyle();
      const $amt = document.getElementById('mpAmt');
      const $proofs = document.getElementById('mpProofs');
      const $file = document.getElementById('mpFile');
      const $upStatus = document.getElementById('mpUpStatus');
      const proofUrls = [];

      const reformatAmt = () => {
        const raw = ($amt.value || '').replace(/[^\d]/g, '');
        $amt.value = raw ? new Intl.NumberFormat('vi-VN').format(Number(raw)) : '';
      };
      $amt.addEventListener('input', reformatAmt);
      $amt.addEventListener('focus', () => $amt.select());
      reformatAmt();

      document.querySelectorAll('[data-mp-q]').forEach(btn => {
        btn.addEventListener('click', () => {
          const m = btn.dataset.mpQ;
          if (m === 'full')      $amt.value = fmt(remain);
          else if (m === 'half') $amt.value = fmt(Math.round(remain / 2));
          else                   $amt.value = '';
        });
      });

      const renderProofs = () => {
        if (!proofUrls.length) {
          $proofs.innerHTML = '<div class="mp-proofs-empty">Chưa có ảnh</div>';
          return;
        }
        $proofs.innerHTML = proofUrls.map((url, i) => `
          <div class="mp-proof-thumb">
            <img src="${esc(url)}" alt="">
            <button type="button" class="mp-proof-x" data-mp-rm="${i}" title="Xoá">×</button>
          </div>
        `).join('');
        $proofs.querySelectorAll('[data-mp-rm]').forEach(b => {
          b.addEventListener('click', () => {
            proofUrls.splice(Number(b.dataset.mpRm), 1);
            renderProofs();
          });
        });
      };
      renderProofs();

      $file.addEventListener('change', async () => {
        const files = Array.from($file.files || []);
        $file.value = '';
        if (!files.length) return;
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          $upStatus.textContent = `Đang tải ${i + 1}/${files.length}…`;
          try {
            const url = await imgbb.upload(f, { name: `pay-${o.id}-${Date.now()}` });
            proofUrls.push(url);
            renderProofs();
          } catch (e) {
            ui.toast('Lỗi tải ảnh: ' + (e.message || ''), 'error');
          }
        }
        $upStatus.textContent = '';
      });

      state._mpProofs = proofUrls;
    });
    if (!ok) { state._mpProofs = null; return; }
    const amtRaw = (document.getElementById('mpAmt').value || '').replace(/[^\d]/g, '');
    const body = {
      amount: Number(amtRaw) || 0,
      method: document.getElementById('mpMethod').value,
      note: document.getElementById('mpNote').value.trim() || null,
      proof_urls: state._mpProofs || [],
      collected_for_dealer: document.getElementById('mpForDealer').checked ? 1 : 0,
    };
    state._mpProofs = null;
    closeSimpleModal();
    const r = await api.post(`/admin/orders/${o.id}/mark-paid`, body, { onError: 'toast' });
    if (r) { ui.toast('Đã ghi nhận', 'success'); openDetail(o.id); loadList(); }
  }

  async function openStaffReceiveOrderModal() {
    const o = state.currentDetail;
    const remain = Math.max(0, Number(o.total_amount) - Number(o.paid_amount));
    const total = Number(o.total_amount) || 0;
    const paid  = Number(o.paid_amount)  || 0;

    const html = `
      <div class="mp-modal">
        <div class="mp-summary">
          <div class="mp-sum-row"><span>Tổng đơn</span><b>${fmt(total)}đ</b></div>
          <div class="mp-sum-row"><span>Đã thu</span><b>${fmt(paid)}đ</b></div>
          <div class="mp-sum-row mp-remain"><span>Còn lại</span><b>${fmt(remain)}đ</b></div>
        </div>
        <div class="mp-field">
          <label>Số tiền nhận</label>
          <div class="mp-amt-wrap">
            <input id="srOrdAmt" type="text" inputmode="numeric" autocomplete="off"
                   class="input mp-amt" value="${fmt(remain)}" placeholder="0">
            <span class="mp-amt-unit">đ</span>
          </div>
          <div class="mp-quick">
            <button type="button" data-sro-q="full">Toàn bộ (${fmt(remain)})</button>
            <button type="button" data-sro-q="0">Xoá</button>
          </div>
        </div>
        <div class="mp-row2">
          <div class="mp-field">
            <label>Hình thức</label>
            <select id="srOrdMethod" class="select">
              <option value="cash">Tiền mặt</option>
              <option value="transfer">Chuyển khoản</option>
              <option value="mixed">Hỗn hợp</option>
            </select>
          </div>
          <div class="mp-field">
            <label>Ghi chú</label>
            <input id="srOrdNote" type="text" class="input" placeholder="Ghi chú nếu cần">
          </div>
        </div>
        <div class="mp-field">
          <label>Ảnh chứng từ <small style="color:#94a3b8">(tuỳ chọn)</small></label>
          <div id="srOrdProofs" class="mp-proofs"></div>
          <div class="mp-upload">
            <label class="mp-upload-btn" for="srOrdFile">+ Thêm ảnh</label>
            <input id="srOrdFile" type="file" accept="image/*" multiple style="display:none">
            <span id="srOrdUpStatus" class="mp-upload-status"></span>
          </div>
        </div>
      </div>
    `;

    const proofUrls = [];
    const ok = await openSimpleModal('Nhận Tiền Từ Khách', html, 'Xác nhận Nhận Tiền', () => {
      injectMarkPaidStyle();
      const $amt = document.getElementById('srOrdAmt');
      const $proofs = document.getElementById('srOrdProofs');
      const $file   = document.getElementById('srOrdFile');
      const $upStatus = document.getElementById('srOrdUpStatus');

      const reformatAmt = () => {
        const raw = ($amt.value || '').replace(/[^\d]/g, '');
        $amt.value = raw ? new Intl.NumberFormat('vi-VN').format(Number(raw)) : '';
      };
      $amt.addEventListener('input', reformatAmt);
      $amt.addEventListener('focus', () => $amt.select());
      reformatAmt();

      document.querySelectorAll('[data-sro-q]').forEach(btn => {
        btn.addEventListener('click', () => {
          const m = btn.dataset.sroQ;
          if (m === 'full') $amt.value = fmt(remain);
          else              $amt.value = '';
        });
      });

      const renderProofs = () => {
        if (!proofUrls.length) {
          $proofs.innerHTML = '<div class="mp-proofs-empty">Chưa có ảnh</div>';
          return;
        }
        $proofs.innerHTML = proofUrls.map((url, i) => `
          <div class="mp-proof-thumb">
            <img src="${esc(url)}" alt="">
            <button type="button" class="mp-proof-x" data-sro-rm="${i}" title="Xoá">×</button>
          </div>
        `).join('');
        $proofs.querySelectorAll('[data-sro-rm]').forEach(b => {
          b.addEventListener('click', () => { proofUrls.splice(Number(b.dataset.sroRm), 1); renderProofs(); });
        });
      };
      renderProofs();

      $file.addEventListener('change', async () => {
        const files = Array.from($file.files || []);
        $file.value = '';
        if (!files.length) return;
        for (let i = 0; i < files.length; i++) {
          $upStatus.textContent = `Đang tải ${i + 1}/${files.length}…`;
          try {
            const url = await imgbb.upload(files[i], { name: `sr-ord-${o.id}-${Date.now()}` });
            proofUrls.push(url);
            renderProofs();
          } catch (e) { ui.toast('Lỗi tải ảnh: ' + (e.message || ''), 'error'); }
        }
        $upStatus.textContent = '';
      });
    });

    if (!ok) return;
    const amtRaw = (document.getElementById('srOrdAmt').value || '').replace(/[^\d]/g, '');
    const body = {
      order_id:   o.id,
      amount:     Number(amtRaw) || 0,
      pay_method: document.getElementById('srOrdMethod').value,
      note:       document.getElementById('srOrdNote').value.trim() || null,
      proof_urls: proofUrls,
    };
    closeSimpleModal();
    const r = await api.post('/admin/staff-receipts', body, { onError: 'toast' });
    if (r) { ui.toast(`Đã ghi nhận nhận tiền — ${r.code}`, 'success'); openDetail(o.id); loadList(); }
  }

  function injectMarkPaidStyle() {
    if (document.getElementById('mpStyle')) return;
    const css = document.createElement('style');
    css.id = 'mpStyle';
    css.textContent = `
      .mp-modal { padding:18px 20px; display:flex; flex-direction:column; gap:14px; }
      .mp-summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 14px; }
      .mp-sum-row { display:flex; justify-content:space-between; padding:3px 0; font-size:13px; color:#475569; }
      .mp-sum-row b { color:#0f172a; }
      .mp-sum-row.mp-remain { border-top:1px dashed #cbd5e1; margin-top:4px; padding-top:6px; }
      .mp-sum-row.mp-remain b { color:#dc2626; font-size:15px; }
      .mp-field { display:flex; flex-direction:column; gap:6px; }
      .mp-field > label { font-weight:600; font-size:13px; color:#334155; }
      .mp-row2 { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
      @media (max-width:520px){ .mp-row2 { grid-template-columns: 1fr; } }
      .mp-amt-wrap { position:relative; }
      .mp-amt { font-size:20px; font-weight:600; padding-right:30px; text-align:right; letter-spacing:.5px; }
      .mp-amt-unit { position:absolute; right:12px; top:50%; transform:translateY(-50%); color:#64748b; font-weight:600; }
      .mp-quick { display:flex; gap:6px; flex-wrap:wrap; }
      .mp-quick button { background:#f1f5f9; border:1px solid #e2e8f0; border-radius:6px; padding:4px 10px; font-size:12px; color:#334155; cursor:pointer; }
      .mp-quick button:hover { background:#e2e8f0; }
      .mp-proofs { display:flex; gap:8px; flex-wrap:wrap; min-height:48px; padding:8px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; }
      .mp-proofs-empty { color:#94a3b8; font-size:12px; align-self:center; }
      .mp-proof-thumb { position:relative; width:72px; height:72px; }
      .mp-proof-thumb img { width:100%; height:100%; object-fit:cover; border-radius:6px; border:1px solid #e2e8f0; }
      .mp-proof-x { position:absolute; top:-6px; right:-6px; width:22px; height:22px; border-radius:50%; border:none; background:#dc2626; color:#fff; font-weight:700; cursor:pointer; line-height:1; }
      .mp-upload { display:flex; align-items:center; gap:10px; }
      .mp-upload-btn { background:#3b82f6; color:#fff; padding:6px 14px; border-radius:6px; cursor:pointer; font-size:13px; font-weight:600; }
      .mp-upload-btn:hover { background:#2563eb; }
      .mp-upload-status { color:#64748b; font-size:12px; }
      .mp-check { display:flex; align-items:flex-start; gap:8px; padding:10px 12px; background:#fef3c7; border:1px solid #fde68a; border-radius:8px; cursor:pointer; }
      .mp-check input { margin-top:2px; }
      .mp-check span { font-size:13px; color:#78350f; }
      .mp-check span small { display:block; font-size:11px; }
    `;
    document.head.appendChild(css);
  }

  async function uploadStepPhoto() {
    const o = state.currentDetail;
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.multiple = true;
    inp.style.display = 'none';
    document.body.appendChild(inp);
    inp.addEventListener('change', async () => {
      const files = Array.from(inp.files || []);
      inp.remove();
      if (!files.length) return;
      ui.toast(`Đang tải ${files.length} ảnh…`, 'info');
      let okCount = 0;
      for (const f of files) {
        try {
          const url = await imgbb.upload(f, { name: `order-${o.id}-${Date.now()}` });
          const r = await api.post(`/admin/orders/${o.id}/photos`,
            { url, caption: null }, { onError: 'toast' });
          if (r) okCount++;
        } catch (e) {
          ui.toast(`Lỗi ảnh ${f.name}: ${e.message}`, 'error');
        }
      }
      if (okCount) { ui.toast(`Đã thêm ${okCount} ảnh`, 'success'); openDetail(o.id); }
    });
    inp.click();
  }

  async function cancelOrder() {
    const yes = await ui.confirm({ title: 'Huỷ đơn?', danger: true, okText: 'Huỷ đơn' });
    if (!yes) return;
    const ok = await api.post(`/admin/orders/${state.currentDetail.id}/cancel`, {}, { onError: 'toast' });
    if (ok) { ui.toast('Đã huỷ', 'success'); openDetail(state.currentDetail.id); loadList(); }
  }


  // ---- EDIT: lines ---------------------------------------------
  // Sua toan bo lines (PUT /admin/orders/:id/lines).
  const DEFAULT_ITEM_FIELDS = ['Biển số xe', 'IMEI', 'Tên tài khoản', 'Số SIM'];

  async function editLines() {
    const o = state.currentDetail;
    if (!state.products) {
      const cid = o && o.customer_id ? '&customer_id=' + o.customer_id : '';
      const r = await api.get('/admin/products?limit=300' + cid).catch(() => null);
      state.products = (r && r.items) || [];
    }
    if (!state.templates || !state.templates.length) {
      const r = await api.get('/admin/order-templates').catch(() => null);
      state.templates = (r && r.items) || [];
    }
    const tplCache = state.templateById = state.templateById || {};
    const prodMap = Object.fromEntries((state.products || []).map(p => [p.id, p]));

    // Working copy — items mang field_values riêng
    const wlines = (o.lines || []).map(ln => ({
      template_id: ln.template_id,
      custom_name: ln.custom_name || null,
      items: (ln.items || []).map(i => ({
        product_id: i.product_id, qty: i.qty, unit_price: i.unit_price,
        vat_percent: Number(i.vat_percent) || 0,
        field_values: (i.field_values && i.field_values.length)
          ? i.field_values.map(fv => ({ label: fv.label || '', value: fv.value || '' }))
          : DEFAULT_ITEM_FIELDS.map(l => ({ label: l, value: '' })),
      })),
      charges: (ln.charges || []).map(c => ({ kind: c.kind, label: c.label, amount: c.amount })),
    }));

    const fmtMoney = (n) => Math.round(Number(n) || 0).toLocaleString('vi-VN');
    const parseMoney = (s) => parseInt(String(s || '').replace(/[^\d]/g, ''), 10) || 0;
    const calcLineTotal = (ln) => {
      const itemSum = (ln.items || []).reduce((s, it) => {
        return s + (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
      }, 0);
      const chargeSum = (ln.charges || []).reduce((s, c) => {
        const amt = Number(c.amount) || 0;
        return s + (c.kind === 'discount' ? -amt : amt);
      }, 0);
      return itemSum + chargeSum;
    };

    const renderItemInfoBox = (fvs, ii) => {
      const filled = fvs.filter(f => (f.value || '').trim());
      const summary = filled.length ? filled.map(f => `${f.label}: ${f.value}`).join(' · ') : 'Chưa nhập';
      return `
        <div class="item-info-box" data-ii="${ii}">
          <div class="info-toggle" data-act="toggle-info">
            <span class="chev">▶</span>
            <span>Hộp thông tin</span>
            <span class="info-summary">${esc(summary)}</span>
          </div>
          <div class="info-body" style="display:none">
            ${fvs.map((fv, fi) => `
              <div class="fv-row" data-ii="${ii}" data-fi="${fi}">
                <input type="text" class="input fv-label" value="${esc(fv.label)}" placeholder="Nhãn" style="flex:1;font-size:12px">
                <input type="text" class="input fv-value" value="${esc(fv.value)}" placeholder="Giá trị" style="flex:2;font-size:12px">
                <button type="button" class="btn-x" data-act="del-fv" title="Xoá">×</button>
              </div>`).join('')}
            <button type="button" class="btn ghost sm" data-act="add-fv" data-ii="${ii}" style="margin-top:4px;font-size:11px">+ Thêm ô</button>
          </div>
        </div>`;
    };

    const renderProdPicker = (it) => {
      const p = prodMap[it.product_id];
      const thumbSrc = p ? (p.thumbnail_url || p.image_url || '') : '';
      const pName = p ? p.name : '— Chọn sản phẩm —';
      const stockQty = p ? Number(p.stock_qty) : null;
      const stkCls = stockQty === null ? '' : stockQty <= 0 ? 'out' : stockQty <= 3 ? 'low' : 'ok';
      // Đơn bảo hành: ẩn badge tồn kho
      const stkBadge = (stockQty !== null && o.service_kind !== 'warranty')
        ? `<span class="prod-stk-badge ${stkCls}">Kho: ${stockQty}</span>`
        : '';
      return `<div class="prod-picker" data-pid="${it.product_id || 0}">
        <div class="prod-trigger" data-act="open-prod" tabindex="0">
          <div class="prod-thumb-wrap">
            ${thumbSrc ? `<img class="prod-thumb-img" src="${esc(thumbSrc)}" loading="lazy">` : `<div class="prod-thumb-ph"></div>`}
          </div>
          <div class="prod-trigger-info">
            <span class="prod-trigger-name">${esc(pName)}</span>
            ${stkBadge}
          </div>
          <span class="prod-caret-icon">▾</span>
        </div>
        <div class="prod-drop" hidden></div>
      </div>`;
    };

    const renderLine = (ln, idx) => {
      const tpl = tplCache[ln.template_id];
      const lineName = ln.custom_name || (tpl ? tpl.name : '');

      const itemsHtml = ln.items.length ? ln.items.map((it, ii) => {
        const sub = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
        return `<div class="item-block" data-ii="${ii}">
          <div class="ic-row el-item items-grid">
            <div class="cell">${renderProdPicker(it)}</div>
            <div class="cell"><input type="number" class="ic-input num qty" value="${it.qty || 1}" min="1"></div>
            <div class="cell"><input type="text" class="ic-input price-fmt" value="${fmtMoney(it.unit_price || 0)}" placeholder="0" inputmode="numeric"></div>
            <div class="cell right el-amt-cell">${fmtMoney(sub)}</div>
            <div class="cell"><button type="button" class="btn-x" data-act="del-item">×</button></div>
          </div>
          ${renderItemInfoBox(it.field_values || [], ii)}
        </div>`;
      }).join('') : '<div class="ic-empty">Chưa có sản phẩm</div>';

      const chargesHtml = ln.charges.length ? ln.charges.map((c, ci) => `
        <div class="ic-row el-charge charges-grid" data-ci="${ci}">
          <div class="cell">
            <select class="ic-select kind">
              <option value="fee"      ${c.kind === 'fee'      ? 'selected' : ''}>Phí</option>
              <option value="shipping" ${c.kind === 'shipping' ? 'selected' : ''}>Ship</option>
              <option value="discount" ${c.kind === 'discount' ? 'selected' : ''}>Giảm</option>
            </select>
          </div>
          <div class="cell"><input type="text" class="ic-input lbl" value="${esc(c.label || '')}" placeholder="Mô tả..."></div>
          <div class="cell"><input type="number" class="ic-input num amt" value="${c.amount || 0}"></div>
          <div class="cell"><button type="button" class="btn-x" data-act="del-charge">×</button></div>
        </div>`).join('') : '<div class="ic-empty">Chưa có chi phí</div>';

      return `<div class="line-card" data-idx="${idx}">
        <div class="line-head">
          <div class="seq">${idx + 1}</div>
          <div class="tpl-combo">
            <input type="text" class="tpl-input" value="${esc(lineName)}" placeholder="Loại / tên công việc..." autocomplete="off">
            <button type="button" class="tpl-caret" tabindex="-1">▾</button>
            <div class="tpl-pop" hidden></div>
          </div>
          <span class="sub-show">${fmtMoney(calcLineTotal(ln))}đ</span>
          <button type="button" class="x-btn" data-act="del-line">Xoá dòng</button>
        </div>
        <div class="line-body">
          <div class="line-section">
            <div class="sh">Sản phẩm <button type="button" class="add" data-act="add-item">+ Thêm SP</button></div>
            <div class="ic-table">
              <div class="ic-thead items-grid">
                <div class="cell">Sản phẩm</div>
                <div class="cell">SL</div>
                <div class="cell">Đơn giá</div>
                <div class="cell right">Thành tiền</div>
                <div class="cell"></div>
              </div>
              ${itemsHtml}
            </div>
          </div>
          <div class="line-section">
            <div class="sh">Phụ phí trong dòng <button type="button" class="add" data-act="add-charge">+ Thêm phí</button></div>
            <div class="ic-table">
              <div class="ic-thead charges-grid">
                <div class="cell">Loại</div>
                <div class="cell">Mô tả</div>
                <div class="cell right">Số tiền</div>
                <div class="cell"></div>
              </div>
              ${chargesHtml}
            </div>
          </div>
        </div>
        <div class="el-line-total">
          <span>Tổng dòng</span>
          <b class="el-line-total-val">${fmtMoney(calcLineTotal(ln))} đ</b>
        </div>
      </div>`;
    };

    const html = `<style>
      #simpleModal .modal { max-width: 900px !important; }
      #simpleModal .modal-body { background:#f1f5f9; }
      .el-wrap { padding:14px; }

      /* Line card */
      .line-card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; margin-bottom:14px; overflow:visible; box-shadow:0 2px 8px rgba(15,23,42,.07); }
      .line-head { display:flex; align-items:center; gap:8px; padding:8px 12px; background:linear-gradient(135deg,#f1f5ff,#fafbfd); border-bottom:1px solid #e2e8f0; border-radius:12px 12px 0 0; }
      .line-head .seq { width:26px; height:26px; border-radius:50%; background:#2563eb; color:#fff; font-weight:700; display:grid; place-items:center; font-size:12px; flex-shrink:0; }
      .line-head .tpl-combo { flex:1; position:relative; }
      .line-head .tpl-combo .tpl-input { width:100%; font-size:13px; padding:6px 28px 6px 10px; font-weight:600; border:1px solid #e2e8f0; border-radius:6px; background:#fff; box-sizing:border-box; }
      .line-head .tpl-combo .tpl-caret { position:absolute; right:6px; top:50%; transform:translateY(-50%); width:22px; height:22px; border:none; background:transparent; color:#64748b; cursor:pointer; font-size:11px; display:grid; place-items:center; padding:0; }
      .line-head .tpl-combo .tpl-pop { position:absolute; left:0; right:0; top:calc(100% + 4px); background:#fff; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 8px 24px rgba(15,23,42,.12); max-height:220px; overflow-y:auto; z-index:50; }
      .line-head .tpl-combo .tpl-pop[hidden] { display:none; }
      .line-head .sub-show { font-size:12px; color:#64748b; font-variant-numeric:tabular-nums; white-space:nowrap; }
      .line-head .x-btn { background:transparent; border:1px solid #e2e8f0; border-radius:6px; padding:4px 10px; font-size:12px; color:#dc2626; cursor:pointer; white-space:nowrap; }
      .line-head .x-btn:hover { background:#fee2e2; border-color:#fecaca; }

      .line-body { padding:10px 12px; overflow:visible; }
      .line-section { margin-bottom:10px; }
      .line-section .sh { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:.3px; font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:6px; }
      .line-section .sh .add { margin-left:auto; font-size:11.5px; padding:2px 8px; border:1px solid #e2e8f0; border-radius:5px; background:#fff; color:#2563eb; cursor:pointer; }
      .line-section .sh .add:hover { background:#eff6ff; }

      /* Bảng sản phẩm / phụ phí */
      .ic-table { border:1px solid #e2e8f0; border-radius:8px; overflow:visible; background:#fff; }
      .ic-thead { background:#f8fafc; font-size:10.5px; color:#94a3b8; text-transform:uppercase; letter-spacing:.3px; font-weight:600; border-bottom:1px solid #e2e8f0; border-radius:8px 8px 0 0; overflow:hidden; }
      .ic-row { border-bottom:1px solid #f1f5f9; position:relative; }
      .ic-row:last-child { border-bottom:0; }
      .ic-row .cell, .ic-thead .cell { padding:4px 6px; min-width:0; }
      .ic-thead .cell.right, .ic-row .cell.right { text-align:right; }
      .items-grid   { display:grid; grid-template-columns:minmax(0,2fr) 64px 130px 110px 32px; gap:0; align-items:center; }
      .charges-grid { display:grid; grid-template-columns:90px 1fr 130px 30px; gap:0; align-items:center; }
      .ic-input, .ic-select { width:100%; border:1px solid transparent; background:transparent; padding:4px 6px; font-size:12.5px; border-radius:4px; box-sizing:border-box; }
      .ic-input:focus, .ic-select:focus { outline:none; border-color:#2563eb; background:#fff; box-shadow:0 0 0 2px #dbeafe; }
      .ic-input.num { text-align:right; font-variant-numeric:tabular-nums; }
      .price-fmt { text-align:right; font-variant-numeric:tabular-nums; }
      .el-amt-cell { font-weight:600; color:#0f172a; font-variant-numeric:tabular-nums; font-size:13px; padding-right:8px !important; }
      .ic-empty { padding:10px; text-align:center; color:#94a3b8; font-size:12px; font-style:italic; }

      /* Item block */
      .item-block { border-bottom:1px solid #e2e8f0; overflow:visible; }
      .item-block:last-child { border-bottom:0; }

      /* --- Product Picker --- */
      .prod-picker { position:relative; }
      .prod-trigger { display:flex; align-items:center; gap:6px; padding:4px 6px; border-radius:6px; cursor:pointer; user-select:none; transition:background .12s; min-height:38px; }
      .prod-trigger:hover { background:#f1f5f9; }
      .prod-trigger:focus { outline:2px solid #2563eb; outline-offset:1px; border-radius:6px; }
      .prod-thumb-wrap { flex-shrink:0; width:32px; height:32px; border-radius:6px; overflow:hidden; background:#f1f5f9; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; }
      .prod-thumb-img { width:32px; height:32px; object-fit:cover; }
      .prod-thumb-ph { width:20px; height:20px; background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23cbd5e1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'/%3E%3C/svg%3E") center/contain no-repeat; }
      .prod-trigger-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:1px; }
      .prod-trigger-name { font-size:12.5px; color:#0f172a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:1.3; }
      .prod-trigger-name.placeholder { color:#94a3b8; }
      .prod-stk-badge { font-size:10px; font-weight:600; padding:1px 5px; border-radius:10px; width:fit-content; }
      .prod-stk-badge.ok  { background:#dcfce7; color:#16a34a; }
      .prod-stk-badge.low { background:#fef9c3; color:#a16207; }
      .prod-stk-badge.out { background:#fee2e2; color:#dc2626; }
      .prod-caret-icon { font-size:10px; color:#94a3b8; flex-shrink:0; }

      /* Dropdown của product picker */
      .prod-drop { position:absolute; left:0; right:0; top:calc(100% + 2px); background:#fff; border:1px solid #e2e8f0; border-radius:10px; box-shadow:0 12px 32px rgba(15,23,42,.15); z-index:200; min-width:280px; overflow:hidden; }
      .prod-drop[hidden] { display:none; }
      .prod-drop-search { padding:8px 10px; border-bottom:1px solid #f1f5f9; }
      .prod-search-inp { width:100%; border:1px solid #e2e8f0; border-radius:6px; padding:6px 10px; font-size:13px; box-sizing:border-box; }
      .prod-search-inp:focus { outline:none; border-color:#2563eb; box-shadow:0 0 0 2px #dbeafe; }
      .prod-drop-list { max-height:230px; overflow-y:auto; }
      .prod-opt { display:flex; align-items:center; gap:8px; padding:7px 10px; cursor:pointer; transition:background .1s; }
      .prod-opt:hover { background:#eff6ff; }
      .po-thumb { width:28px; height:28px; border-radius:4px; object-fit:cover; flex-shrink:0; border:1px solid #e2e8f0; }
      .po-thumb-ph { width:28px; height:28px; border-radius:4px; background:#f1f5f9; flex-shrink:0; border:1px solid #e2e8f0; }
      .po-name { flex:1; font-size:12.5px; color:#0f172a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .po-stk { font-size:10.5px; font-weight:600; padding:1px 6px; border-radius:10px; flex-shrink:0; }
      .po-stk.ok  { background:#dcfce7; color:#16a34a; }
      .po-stk.low { background:#fef9c3; color:#a16207; }
      .po-stk.out { background:#fee2e2; color:#dc2626; }
      .prod-empty { padding:10px; text-align:center; font-size:12px; color:#94a3b8; font-style:italic; }

      /* Hộp thông tin (collapsible) */
      .item-info-box { background:#f8fafc; border-top:1px solid #e9eef4; }
      .info-toggle { display:flex; align-items:center; gap:6px; padding:5px 10px; cursor:pointer; font-size:11.5px; color:#64748b; user-select:none; }
      .info-toggle:hover { background:#eef2f7; }
      .info-toggle .chev { font-size:9px; color:#2563eb; }
      .info-toggle > span:nth-child(2) { font-weight:600; color:#475569; }
      .info-summary { margin-left:4px; color:#94a3b8; font-style:italic; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; min-width:0; }
      .info-body { padding:8px 10px 6px; border-top:1px dashed #dde3ec; }
      .fv-row { display:flex; gap:6px; align-items:center; margin-bottom:4px; }

      /* Tổng dòng */
      .el-line-total { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:13px; color:#475569; border-radius:0 0 12px 12px; }
      .el-line-total b { color:#0f172a; font-size:15px; font-variant-numeric:tabular-nums; }

      /* Nút xoá */
      .btn-x { width:28px; height:28px; border-radius:6px; border:1px solid #e2e8f0; background:#fff; color:#64748b; cursor:pointer; flex-shrink:0; font-size:15px; line-height:1; padding:0; display:grid; place-items:center; }
      .btn-x:hover { background:#fef2f2; color:#dc2626; border-color:#fecaca; }

      /* Nút thêm dòng */
      #edAddLine { width:100%; padding:10px; background:#fff; border:2px dashed #cbd5e1; border-radius:10px; color:#2563eb; font-weight:600; font-size:13px; cursor:pointer; }
      #edAddLine:hover { background:#eff6ff; border-color:#2563eb; }
    </style>
    <div class="el-wrap">
      <div id="edLinesBox">${wlines.map(renderLine).join('')}</div>
      <button type="button" id="edAddLine">+ Thêm dòng công việc</button>
    </div>`;

    function rebuild() {
      document.getElementById('edLinesBox').innerHTML = wlines.map(renderLine).join('');
      bindAll();
    }
    function readDom() {
      document.querySelectorAll('.line-card').forEach(el => {
        const idx = Number(el.dataset.idx);
        const ln = wlines[idx];
        if (!ln) return;
        ln.items = [];
        el.querySelectorAll('.item-block').forEach(block => {
          const ii = Number(block.dataset.ii);
          const row = block.querySelector('.el-item');
          const fvs = [];
          block.querySelectorAll('.fv-row').forEach(fvRow => {
            fvs.push({
              label: fvRow.querySelector('.fv-label').value.trim(),
              value: fvRow.querySelector('.fv-value').value.trim(),
            });
          });
          ln.items.push({
            product_id: Number(block.querySelector('.prod-picker').dataset.pid) || 0,
            qty: Math.max(1, Number(row.querySelector('.qty').value) || 1),
            unit_price: Math.max(0, parseMoney(row.querySelector('.price-fmt').value)),
            field_values: fvs,
          });
        });
        ln.charges = [];
        el.querySelectorAll('.el-charge').forEach(row => {
          ln.charges.push({
            kind: row.querySelector('.kind').value,
            label: row.querySelector('.lbl').value.trim(),
            amount: Number(row.querySelector('.amt').value) || 0,
          });
        });
      });
    }
    function bindAll() {
      document.querySelectorAll('.line-card').forEach(el => {
        const idx = Number(el.dataset.idx);
        const combo  = el.querySelector('.tpl-combo');
        const tplInp = combo.querySelector('.tpl-input');
        const caret  = combo.querySelector('.tpl-caret');
        const pop    = combo.querySelector('.tpl-pop');
        const renderPop = (q) => {
          const norm = (q || '').trim().toLowerCase();
          const items = state.templates.filter(t => !norm || String(t.name).toLowerCase().includes(norm));
          pop.innerHTML = items.length
            ? items.map(t => `<div class="tpl-item" data-name="${esc(t.name)}" style="padding:7px 12px;font-size:13px;cursor:pointer">${esc(t.name)}</div>`).join('')
            : '<div style="padding:8px 12px;font-size:12px;color:#94a3b8;font-style:italic">— Enter để dùng tên tự do —</div>';
          pop.querySelectorAll('.tpl-item').forEach(it => {
            it.addEventListener('mouseenter', () => it.style.background = '#eef2ff');
            it.addEventListener('mouseleave', () => it.style.background = '');
          });
        };
        const showPop = () => { renderPop(tplInp.value); pop.hidden = false; };
        const hidePop = () => { pop.hidden = true; };

        const commitName = async (name) => {
          readDom();
          const norm = String(name || '').trim().toLowerCase();
          const matched = state.templates.find(t => String(t.name).trim().toLowerCase() === norm);
          if (matched) {
            wlines[idx].template_id = matched.id;
            wlines[idx].custom_name = null;
          } else {
            wlines[idx].template_id = null;
            wlines[idx].custom_name = String(name || '').trim() || null;
          }
          rebuild();
        };

        tplInp.addEventListener('focus', showPop);
        caret.addEventListener('mousedown', (e) => {
          e.preventDefault();
          if (pop.hidden) { tplInp.focus(); showPop(); } else { hidePop(); }
        });
        tplInp.addEventListener('input', () => renderPop(tplInp.value));
        tplInp.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') { hidePop(); tplInp.blur(); }
          else if (e.key === 'Enter') { e.preventDefault(); hidePop(); commitName(tplInp.value); }
        });
        pop.addEventListener('mousedown', (e) => {
          const it = e.target.closest('.tpl-item');
          if (!it) return;
          e.preventDefault();
          tplInp.value = it.dataset.name;
          hidePop();
          commitName(it.dataset.name);
        });
        tplInp.addEventListener('blur', () => {
          setTimeout(() => {
            if (!combo.contains(document.activeElement)) {
              hidePop();
              const cur = wlines[idx].custom_name || (tplCache[wlines[idx].template_id]?.name || '');
              if (tplInp.value !== cur) commitName(tplInp.value);
            }
          }, 120);
        });
        el.querySelector('[data-act=del-line]').addEventListener('click', () => {
          if (wlines.length <= 1) { ui.toast('Phải có ít nhất 1 dòng', 'warning'); return; }
          if (!confirm('Xoá dòng này?')) return;
          readDom();
          wlines.splice(idx, 1);
          rebuild();
        });
        el.querySelector('[data-act=add-item]').addEventListener('click', () => {
          readDom();
          wlines[idx].items.push({
            product_id: 0, qty: 1, unit_price: 0, vat_percent: 0,
            field_values: DEFAULT_ITEM_FIELDS.map(l => ({ label: l, value: '' })),
          });
          rebuild();
        });
        el.querySelector('[data-act=add-charge]').addEventListener('click', () => {
          readDom();
          wlines[idx].charges.push({ kind: 'fee', label: '', amount: 0 });
          rebuild();
        });
        el.querySelectorAll('[data-act=toggle-info]').forEach(btn => {
          btn.addEventListener('click', () => {
            const box = btn.closest('.item-info-box');
            const body = box.querySelector('.info-body');
            const chev = btn.querySelector('.chev');
            const isOpen = body.style.display !== 'none';
            body.style.display = isOpen ? 'none' : '';
            chev.textContent = isOpen ? '▶' : '▼';
          });
        });

        // Product picker
        el.querySelectorAll('.prod-picker').forEach(picker => {
          const trigger = picker.querySelector('.prod-trigger');
          const drop = picker.querySelector('.prod-drop');
          const openDrop = () => {
            drop.hidden = false;
            const q = '';
            const renderDropList = (search) => {
              const norm = search.toLowerCase();
              const filtered = (state.products || []).filter(p => !norm || p.name.toLowerCase().includes(norm));
              drop.innerHTML = `<div class="prod-drop-search"><input class="prod-search-inp" type="text" placeholder="Tìm sản phẩm..." value="${esc(search)}" autocomplete="off"></div>
                <div class="prod-drop-list">${filtered.slice(0, 50).map(p => {
                  const thumb = p.thumbnail_url || p.image_url || '';
                  const stk = Number(p.stock_qty);
                  // Đơn bảo hành: không hiển thị tồn kho
                  const stkHtml = o.service_kind === 'warranty'
                    ? ''
                    : `<span class="po-stk ${stk <= 0 ? 'out' : stk <= 3 ? 'low' : 'ok'}">Kho: ${stk}</span>`;
                  return `<div class="prod-opt" data-pid="${p.id}">
                    ${thumb ? `<img class="po-thumb" src="${esc(thumb)}" loading="lazy">` : '<div class="po-thumb-ph"></div>'}
                    <span class="po-name">${esc(p.name)}</span>
                    ${stkHtml}
                  </div>`;
                }).join('')}${filtered.length === 0 ? '<div class="prod-empty">Không tìm thấy</div>' : ''}</div>`;
              drop.querySelector('.prod-search-inp').addEventListener('input', e => renderDropList(e.target.value));
              drop.querySelectorAll('.prod-opt').forEach(opt => {
                opt.addEventListener('mousedown', e => {
                  e.preventDefault();
                  const pid = Number(opt.dataset.pid);
                  readDom();
                  const block = picker.closest('.item-block');
                  const ii = Number(block.dataset.ii);
                  const lnIdx = Number(picker.closest('.line-card').dataset.idx);
                  wlines[lnIdx].items[ii].product_id = pid;
                  const pp = prodMap[pid];
                  // Đơn bảo hành: không gán giá tự động
                  if (pp && !wlines[lnIdx].items[ii].unit_price && o.service_kind !== 'warranty') {
                    wlines[lnIdx].items[ii].unit_price = Number(pp.sale_price ?? pp.price) || 0;
                  }
                  drop.hidden = true;
                  rebuild();
                });
              });
            };
            renderDropList(q);
            setTimeout(() => drop.querySelector('.prod-search-inp')?.focus(), 30);
            const onOutside = (e) => { if (!picker.contains(e.target)) { drop.hidden = true; document.removeEventListener('click', onOutside, true); } };
            setTimeout(() => document.addEventListener('click', onOutside, true), 0);
          };
          trigger.addEventListener('click', () => { if (drop.hidden) openDrop(); else drop.hidden = true; });
          trigger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrop(); } });
        });

        // Price formatting
        el.querySelectorAll('.price-fmt').forEach(inp => {
          inp.addEventListener('input', () => {
            const raw = inp.value.replace(/[^\d]/g, '');
            const num = parseInt(raw, 10) || 0;
            const formatted = num ? num.toLocaleString('vi-VN') : '';
            inp.value = formatted;
          });
          inp.addEventListener('blur', () => {
            const num = parseMoney(inp.value);
            inp.value = num ? fmtMoney(num) : '0';
          });
          inp.addEventListener('focus', () => {
            const num = parseMoney(inp.value);
            inp.value = num || '';
            inp.select();
          });
        });
        el.querySelectorAll('[data-act=del-item]').forEach(b => b.addEventListener('click', () => {
          readDom();
          const ii = Number(b.closest('.item-block').dataset.ii);
          wlines[idx].items.splice(ii, 1);
          rebuild();
        }));
        el.querySelectorAll('[data-act=del-charge]').forEach(b => b.addEventListener('click', () => {
          readDom();
          const ci = Number(b.closest('.el-charge').dataset.ci);
          wlines[idx].charges.splice(ci, 1);
          rebuild();
        }));
        el.querySelectorAll('[data-act=add-fv]').forEach(b => b.addEventListener('click', () => {
          readDom();
          const ii = Number(b.dataset.ii);
          if (!wlines[idx].items[ii]) return;
          wlines[idx].items[ii].field_values.push({ label: '', value: '' });
          rebuild();
        }));
        el.querySelectorAll('[data-act=del-fv]').forEach(b => b.addEventListener('click', () => {
          readDom();
          const fvRow = b.closest('.fv-row');
          const ii = Number(fvRow.dataset.ii);
          const fi = Number(fvRow.dataset.fi);
          if (!wlines[idx].items[ii]) return;
          wlines[idx].items[ii].field_values.splice(fi, 1);
          rebuild();
        }));
      });
      document.getElementById('edAddLine').addEventListener('click', async () => {
        readDom();
        const tid = state.templates[0] && state.templates[0].id;
        if (!tid) { ui.toast('Chưa có loại đơn', 'warning'); return; }
        wlines.push({
          template_id: tid, custom_name: null,
          items: [{
            product_id: 0, qty: 1, unit_price: 0, vat_percent: 0,
            field_values: DEFAULT_ITEM_FIELDS.map(l => ({ label: l, value: '' })),
          }],
          charges: [],
        });
        rebuild();
      });

      // Live update tong tien moi dong khi thay doi qty/price/vat/amount/kind
      document.querySelectorAll('.line-card').forEach(el => {
        const updateTotal = () => {
          const idx = Number(el.dataset.idx);
          // doc nhanh tu DOM cua line nay
          const items = [...el.querySelectorAll('.el-item')].map(r => ({
            qty: Number(r.querySelector('.qty').value) || 0,
            unit_price: parseMoney(r.querySelector('.price-fmt').value),
          }));
          const charges = [...el.querySelectorAll('.el-charge')].map(r => ({
            kind: r.querySelector('.kind').value,
            amount: Number(r.querySelector('.amt').value) || 0,
          }));
          el.querySelectorAll('.el-item').forEach((r, i) => {
            const it = items[i];
            const sub = it.qty * it.unit_price;
            const cell = r.querySelector('.el-amt-cell');
            if (cell) cell.textContent = fmtMoney(sub);
          });
          const total = calcLineTotal({ items, charges });
          const totalEl = el.querySelector('.el-line-total-val');
          if (totalEl) totalEl.textContent = fmtMoney(total) + ' đ';
        };
        el.querySelectorAll('.qty, .price-fmt, .amt, .kind').forEach(inp => {
          inp.addEventListener('input', updateTotal);
          inp.addEventListener('change', updateTotal);
        });
      });
    }

    const ok = await openSimpleModal('Sửa các dòng công việc', html, 'Lưu', bindAll);
    if (!ok) return;
    readDom();
    // Validate
    if (!wlines.length) { ui.toast('Phải có ít nhất 1 dòng', 'warning'); return; }
    for (const ln of wlines) {
      const items = ln.items.filter(it => it.product_id);
      const charges = ln.charges.filter(c => (c.label || '').trim());
      if (!items.length && !charges.length) {
        ui.toast('Mỗi dòng cần ít nhất 1 sản phẩm hoặc chi phí', 'warning');
        return;
      }
    }
    // Build payload
    const linesPayload = wlines.map(ln => ({
      template_id: ln.template_id || null,
      custom_name: ln.custom_name || null,
      items: ln.items.filter(it => it.product_id).map(it => ({
        product_id: it.product_id, qty: it.qty,
        unit_price: it.unit_price, vat_percent: it.vat_percent,
        field_values: (it.field_values || []).filter(fv => (fv.label || '').trim()),
      })),
      charges: ln.charges.filter(c => (c.label || '').trim()),
    }));
    closeSimpleModal();
    const r = await api.put(`/admin/orders/${o.id}/lines`, { lines: linesPayload }, { onError: 'toast' });
    if (r) { ui.toast('Đã lưu', 'success'); openDetail(o.id); }
  }

  // ---- SIMPLE MODAL (overlay tren modal chinh) -----------------
  function openSimpleModal(title, html, okText, afterMount, hideCancel) {
    return new Promise(resolve => {
      let div = document.getElementById('simpleModal');
      if (div) div.remove();
      div = document.createElement('div');
      div.id = 'simpleModal';
      div.className = 'modal-bg open';
      div.style.zIndex = '250';
      div.innerHTML = `
        <div class="modal" style="max-width:560px">
          <div class="modal-head">
            <h3>${esc(title)}</h3>
            <button type="button" class="modal-close" id="smClose">×</button>
          </div>
          <div class="modal-body" id="smBody">${html}</div>
          <div class="modal-foot">
            ${hideCancel ? '' : `<button type="button" class="btn ghost" id="smCancel">Huỷ</button>`}
            <button type="button" class="btn" id="smOk">${esc(okText || 'OK')}</button>
          </div>
        </div>
      `;
      document.body.appendChild(div);
      const cleanup = (val) => {
        if (!val) div.remove();
        else div.style.display = 'none';
        resolve(val);
      };
      div.querySelector('#smClose').addEventListener('click', () => cleanup(false));
      const cancelBtn = div.querySelector('#smCancel');
      if (cancelBtn) cancelBtn.addEventListener('click', () => cleanup(false));
      div.querySelector('#smOk').addEventListener('click', () => cleanup(true));
      if (afterMount) afterMount();
    });
  }
  function closeSimpleModal() {
    const div = document.getElementById('simpleModal');
    if (div) div.remove();
  }

  // ---- HOA DON BAO GIA -----------------------------------------
  // Mo trang /invoice.html?code=XXX o tab moi (link share duoc cho khach).
  function openInvoice() {
    const o = state.currentDetail;
    if (!o) return;
    const url = `${location.origin}/invoice.html?code=${encodeURIComponent(o.code)}`;
    window.open(url, '_blank');
  }



  // ---- BOOT ---------------------------------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    initPageMode();
    adminShell.init(IS_WARRANTY_VIEW ? 'warranties' : 'orders');
    await loadTemplates();

    const $btnHelpOrder = document.getElementById('btnHelpOrder');
    if ($btnHelpOrder) {
      $btnHelpOrder.addEventListener('click', () => {
        ui.confirm({
          title: 'Hướng dẫn thao tác đơn hàng & bảo hành',
          body: `
            <div style="font-family:system-ui, -apple-system, sans-serif; font-size:13.5px; line-height:1.6; color:#334155; max-height:420px; overflow-y:auto; padding-right:8px">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:14px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:10px 12px; color:#1e40af">
                <span style="font-size:20px">💡</span>
                <span><b>Hướng dẫn quy trình & phân quyền xử lý Đơn hàng bảo hành VinaGPS</b></span>
              </div>
              
              <div style="margin-bottom:14px">
                <h4 style="margin:0 0 6px 0; color:#1e293b; font-size:14px; display:flex; align-items:center; gap:6px">📌 1. Quy trình trạng thái Đơn hàng</h4>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px">
                  <div style="font-size:12.5px; font-weight:600; color:#475569; margin-bottom:6px">
                    Tiếp nhận ➔ Đang xử lý (Giao KTV) ➔ Hoàn thành / Đã giao khách
                  </div>
                  <p style="margin:0; font-size:12px; color:#64748b">
                    • <b>Đơn bảo hành &le; 0đ:</b> Khi hoàn thành, hệ thống tự động đánh dấu đã trả tiền.<br>
                    • <b>Hoàn thành đơn:</b> Admin/Nhân viên/KTV sử dụng thanh tiến trình (stepper) trên đầu đơn để cập nhật trạng thái chung.
                  </p>
                </div>
              </div>

              <div style="margin-bottom:14px">
                <h4 style="margin:0 0 6px 0; color:#1e293b; font-size:14px; display:flex; align-items:center; gap:6px">⚙ 2. Các hành động xử lý thiết bị bảo hành</h4>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; font-size:12.5px">
                  <table style="width:100%; border-collapse:collapse">
                    <thead>
                      <tr style="border-bottom:1px solid #cbd5e1; text-align:left; color:#475569">
                        <th style="padding:4px 0">Hành động</th>
                        <th style="padding:4px 0">Ý nghĩa & Hướng dẫn thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style="border-bottom:1px dashed #e2e8f0">
                        <td style="padding:6px 0; font-weight:600; color:#2563eb">Mới tiếp nhận</td>
                        <td style="padding:6px 0; color:#475569">Nhận sản phẩm lỗi ban đầu từ khách hàng.</td>
                      </tr>
                      <tr style="border-bottom:1px dashed #e2e8f0">
                        <td style="padding:6px 0; font-weight:600; color:#2563eb">Thu hồi về kho</td>
                        <td style="padding:6px 0; color:#475569">Đối với Admin/Nhân viên: Thu hồi thẳng về kho công ty. Đối với KTV: Thu hồi vào túi đồ kỹ thuật cá nhân.</td>
                      </tr>
                      <tr style="border-bottom:1px dashed #e2e8f0">
                        <td style="padding:6px 0; font-weight:600; color:#16a34a">Cấp hàng đổi mới</td>
                        <td style="padding:6px 0; color:#475569">Lắp/giao sản phẩm thay thế từ kho công ty hoặc túi KTV. Cho phép chọn nhiều sản phẩm, số lượng, yêu cầu tải ảnh & xác nhận qua Dialog.</td>
                      </tr>
                      <tr style="border-bottom:1px dashed #e2e8f0">
                        <td style="padding:6px 0; font-weight:600; color:#b45309">Gửi NCC / Sửa chữa</td>
                        <td style="padding:6px 0; color:#475569">Chuyển đồ bảo hành sang nhà cung cấp hoặc tiến hành khắc phục kỹ thuật trực tiếp.</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0; font-weight:600; color:#0f172a">Giao lại khách</td>
                        <td style="padding:6px 0; color:#475569">Hoàn tất quy trình trả thiết bị bảo hành đã khắc phục hoặc đã đổi mới cho khách hàng.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 style="margin:0 0 6px 0; color:#1e293b; font-size:14px; display:flex; align-items:center; gap:6px">👥 3. Phân quyền và Vai trò (Role)</h4>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; font-size:12.5px; color:#475569">
                  • <b>Admin / Nhân viên:</b> Có đầy đủ tất cả các quyền của KTV. Khi thu hồi sản phẩm lỗi từ khách, sản phẩm lỗi sẽ được chuyển thẳng về kho tổng của công ty để tối ưu hóa quản lý hàng tồn.<br>
                  • <b>Kỹ thuật viên (KTV):</b> Chỉ xử lý các thiết bị được phân công trong đơn hàng, quản lý và cấp hàng thông qua túi đồ KTV cá nhân.
                </div>
              </div>
            </div>
          `,
          okText: 'Đã hiểu',
          cancelText: 'Đóng'
        });
      });
    }

    // helper tạo multi-select dropdown
    function initMultiSelect({ btnId, popId, applyId, clearId, filterKey, labels, defaults }) {
      const btn = document.getElementById(btnId);
      const pop = document.getElementById(popId);

      function getCbs() { return pop.querySelectorAll('input[type=checkbox]'); }

      function applyQuiet() {
        const cbs = getCbs();
        const sel = Array.from(cbs).filter(c => c.checked).map(c => c.value);
        function selLabel(v) {
          if (labels) return labels[v] || v;
          const tplMap = Object.fromEntries(state.templates.map(t => [String(t.id), t.name]));
          return tplMap[v] || v;
        }
        if (!sel.length) {
          btn.textContent = 'Tất cả';
        } else if (sel.length === 1) {
          btn.textContent = selLabel(sel[0]);
        } else {
          btn.textContent = selLabel(sel[0]) + ' +' + (sel.length - 1);
        }
        state.filters[filterKey] = sel.join(',');
        pop.style.display = 'none';
      }

      function apply() {
        const prev = state.filters[filterKey];
        applyQuiet();
        if (state.filters[filterKey] !== prev) { state.page = 1; loadList(); }
      }

      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.ms-pop').forEach(p => { if (p !== pop) p.style.display = 'none'; });
        e.stopPropagation();
        pop.style.display = pop.style.display === 'none' ? 'block' : 'none';
      });
      document.addEventListener('click', (e) => {
        if (pop.style.display !== 'none' && !pop.contains(e.target) && e.target !== btn) apply();
      });
      document.getElementById(applyId).addEventListener('click', apply);
      document.getElementById(clearId).addEventListener('click', () => {
        getCbs().forEach(c => c.checked = false);
        apply();
      });

      if (defaults && defaults.length) {
        getCbs().forEach(c => { c.checked = defaults.includes(c.value); });
        applyQuiet();
      }
    }

    initMultiSelect({
      btnId: 'psBtn', popId: 'psPop', applyId: 'psApply', clearId: 'psClear',
      filterKey: 'payment_status',
      labels: { unpaid: 'Chưa trả', partial: 'Một phần', paid: 'Đã trả', customer_owes: 'KH nợ', staff_owes: 'KTV giữ', pending_admin_confirm: 'Chờ xác nhận' }
    });

    initMultiSelect({
      btnId: 'stBtn', popId: 'stPop', applyId: 'stApply', clearId: 'stClear',
      filterKey: 'status',
      labels: { pending: 'Chờ xác nhận', confirmed: 'Đang xử lý', in_progress: 'Đang giao', done: 'Hoàn thành', cancelled: 'Đã huỷ' },
      defaults: ['pending', 'confirmed', 'in_progress', 'done']
    });

    initMultiSelect({
      btnId: 'tplBtn', popId: 'tplPop', applyId: 'tplApply', clearId: 'tplClear',
      filterKey: 'template_id',
      labels: null
    });

    // ---- Filter bar: search input ---
    const $fbSearch = $('fbSearch');
    let searchTimer;
    $fbSearch.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.filters.q = $fbSearch.value.trim();
        state.page = 1;
        loadList();
      }, 350);
    });

    const $fbDeviceQ = $('fbDeviceQ');
    let deviceTimer;
    $fbDeviceQ.addEventListener('input', () => {
      clearTimeout(deviceTimer);
      deviceTimer = setTimeout(() => {
        state.filters.device_q = $fbDeviceQ.value.trim();
        state.page = 1;
        loadList();
      }, 350);
    });

    // ---- Filter bar: date range ---
    const $fbDateBtn  = $('fbDateBtn');
    const $fbDatePop  = $('fbDatePop');
    const $fbDateLbl  = $('fbDateLabel');
    const $fbDateFrom = $('fbDateFrom');
    const $fbDateTo   = $('fbDateTo');

    function fmtDayVi(s) {
      if (!s) return '';
      const [y, m, d] = s.split('-');
      return `${d}/${m}/${y}`;
    }
    function refreshDateLabel() {
      const f = $fbDateFrom.value, t = $fbDateTo.value;
      if (!f && !t) { $fbDateLbl.textContent = 'Chọn khoảng ngày'; $fbDateBtn.classList.remove('active'); return; }
      $fbDateBtn.classList.add('active');
      if (f && t)  $fbDateLbl.textContent = `${fmtDayVi(f)} – ${fmtDayVi(t)}`;
      else if (f)  $fbDateLbl.textContent = `Từ ${fmtDayVi(f)}`;
      else         $fbDateLbl.textContent = `Đến ${fmtDayVi(t)}`;
    }
    $fbDateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      $fbDatePop.style.display = $fbDatePop.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', (e) => {
      if (!$fbDatePop.contains(e.target) && e.target !== $fbDateBtn) $fbDatePop.style.display = 'none';
    });
    $('fbDateClose').addEventListener('click', () => { $fbDatePop.style.display = 'none'; });
    $('fbDateClear').addEventListener('click', () => {
      $fbDateFrom.value = ''; $fbDateTo.value = '';
      state.filters.date_from = ''; state.filters.date_to = '';
      refreshDateLabel();
      $fbDatePop.style.display = 'none';
      state.page = 1; loadList();
    });
    [$fbDateFrom, $fbDateTo].forEach(el => el.addEventListener('change', refreshDateLabel));
    refreshDateLabel();

    // ---- Bộ lọc & Đặt lại ---
    $('btnApplyFilter').addEventListener('click', () => {
      state.filters.date_from = $fbDateFrom.value;
      state.filters.date_to   = $fbDateTo.value;
      $fbDatePop.style.display = 'none';
      state.page = 1; loadList();
    });
    $('btnResetFilter').addEventListener('click', () => {
      $fbSearch.value = ''; $fbDateFrom.value = ''; $fbDateTo.value = '';
      $fbDeviceQ.value = '';
      state.filters = { bucket: 'all' };
      // reset multi-selects
      ['psPop','stPop','tplPop'].forEach(id => {
        document.getElementById(id).querySelectorAll('input[type=checkbox]').forEach(c => c.checked = false);
      });
      ['psBtn','stBtn','tplBtn'].forEach(id => { document.getElementById(id).textContent = 'Tất cả'; });
      refreshDateLabel();
      state.page = 1; loadList(); loadStats();
    });

    // ---- Stats cards: click để lọc theo status ---
    document.getElementById('statsRow').querySelectorAll('.stat-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const s = card.dataset.stat;
        // reset status multi-select
        const stPop = $('stPop');
        stPop.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = false);
        if (s !== 'all') {
          const cb = stPop.querySelector(`input[value="${s}"]`);
          if (cb) cb.checked = true;
          $('stBtn').textContent = card.querySelector('.stat-label').textContent;
          state.filters.status = s;
        } else {
          $('stBtn').textContent = 'Tất cả';
          state.filters.status = '';
        }
        state.page = 1; loadList();
      });
    });

    // ---- Limit select ---
    $('limitSel').addEventListener('change', () => {
      state.limit = Number($('limitSel').value) || 10;
      state.page = 1; loadList();
    });

    $('modalClose').addEventListener('click', closeDetail);
    $('modal').addEventListener('click', (e) => {
      if (e.target.id === 'modal') closeDetail();
    });

    // ---- Xuất bảng kê ---
    $('btnOpenStatement').onclick = () => {
      if (IS_WARRANTY_VIEW) {
        location.href = '/admin/warranty-batches.html';
        return;
      }
      const f = state.filters;
      const qs = new URLSearchParams();
      if (f.customer_q)     qs.set('customer_q',     f.customer_q);
      if (f.q)              qs.set('q',              f.q);
      if (f.date_from)      qs.set('date_from',      f.date_from);
      if (f.date_to)        qs.set('date_to',        f.date_to);
      if (f.template_id)    qs.set('template_id',    f.template_id);
      if (f.status)         qs.set('status',         f.status);
      if (f.payment_status) qs.set('payment_status', f.payment_status);
      if (state.serviceKind) qs.set('service_kind', state.serviceKind);
      window.open('/admin/order-statement.html?' + qs.toString(), '_blank');
    };

    // Deep-link: ?status=pending|confirmed|in_progress|done|cancelled
    const _initStatus = new URLSearchParams(location.search).get('status');
    if (_initStatus) {
      const _card = document.querySelector(`#statsRow .stat-card[data-stat="${_initStatus}"]`);
      if (_card) { _card.click(); loadStats(); }
      else await Promise.all([loadList(), loadStats()]);
    } else {
      await Promise.all([loadList(), loadStats()]);
    }

    // ---- BULK SELECT ---
    document.addEventListener('change', (e) => {
      if (e.target.id === 'cbAll') {
        const checked = e.target.checked;
        document.querySelectorAll('.order-cb').forEach(cb => {
          cb.checked = checked;
          const id = Number(cb.dataset.id);
          if (checked) state.selectedIds.add(id);
          else state.selectedIds.delete(id);
        });
        updateBulkBar();
      }
    });

    $('btnClearSel').addEventListener('click', () => {
      state.selectedIds.clear();
      document.querySelectorAll('.order-cb').forEach(cb => cb.checked = false);
      syncCbAll();
      updateBulkBar();
    });

    $('btnCreatePR').addEventListener('click', openCreatePRModal);
  });
})();
