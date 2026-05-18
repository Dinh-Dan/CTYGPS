// /admin/orders.html — list don + modal chi tiet template-driven.

(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const fmtN = new Intl.NumberFormat('vi-VN');
  const fmt = (n) => fmtN.format(Number(n) || 0);
  const IS_ADMIN = (window.auth && auth.isAdmin && auth.isAdmin()) || false;

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

  let state = {
    page: 1, limit: 30, total: 0,
    filters: { bucket: 'all' },
    templates: [],
    items: [],
    currentDetail: null,        // detail loaded in modal
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
            <td data-label="Khách">${esc(o.customer_name || '')}<br><small style="color:#64748b">${esc(o.customer_phone || '')}</small></td>
            <td data-label="Loại đơn">${esc(o.template_names || o.template_name || '—')}</td>
            <td data-label="Thông tin">${renderDeviceInfo(o)}</td>
            <td data-label="Tổng tiền" style="text-align:right">
              <span class="amt-total">${fmt(total)}</span><br>
              <small class="${paidCls}">Đã thu: ${fmt(paid)}</small>
              ${remain > 0 ? `<br><small class="amt-remain">Còn: ${fmt(remain)}</small>` : ''}
            </td>
            <td data-label="Trạng thái"><span class="pill ${sCls.cls}">${esc(sCls.label)}</span></td>
            <td data-label="Thanh toán"><span class="pill ${pCls.cls}">${esc(pCls.label)}</span></td>
            <td data-label="Hành động"><button class="btn ghost sm" data-act="open">Xem</button></td>
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
    $('pageInfo').textContent = `Trang ${state.page} / ${Math.max(1, Math.ceil(state.total / state.limit))} (${state.total} đơn)`;
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
    pending:     'Đang chờ',
    confirmed:   'Lên đơn',
    in_progress: 'Đang xử lý',
    done:        'Đã xong',
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
    const res = await api.get('/admin/orders/' + id).catch(() => null);
    if (!res) { $('odBody').innerHTML = '<p style="color:#dc2626">Không tải được</p>'; return; }
    state.currentDetail = res;
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
    if (location.hash.startsWith('#order-')) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }

  function renderDetail() {
    const o = state.currentDetail;
    const lines = o.lines || [];
    const tplNames = lines.map(l => l.template_name).filter(Boolean).join(' + ');
    $('modalTitle').innerHTML = `${esc(o.code)}${ui.copyCodeBtn(o.code)}<span style="font-weight:400;color:#64748b"> — ${esc(tplNames || '')}</span>`;

    // Tong subtotal cua moi line (items + charges trong line)
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
            <div><b>Loại đơn:</b> ${esc(tplNames || '—')}</div>
            <div><b>Địa chỉ:</b> ${esc(o.address || '—')}</div>
            <div><b>Ghi chú:</b> ${esc(o.note || '—')}</div>
          </div>
          <div style="flex:1;min-width:240px">
            <div>Trạng thái: <span class="pill ${sCls.cls}">${esc(sCls.label)}</span> · <span class="pill ${pCls.cls}">${esc(pCls.label)}</span>${o.collected_for_dealer ? ' · <span class="pill amber" title="Đơn thu hộ đại lí">🏪 Thu hộ ĐL</span>' : ''}</div>
            <div><b>KTV:</b> ${esc(o.staff_name || '—')} ${o.wage_amount ? `(công: ${fmt(o.wage_amount)}đ)` : ''}</div>
            <div><b>Tạo:</b> ${fmtDate(o.created_at)}</div>
            <div><b>Hoàn thành:</b> ${fmtDate(o.completed_at)}</div>
          </div>
        </div>
      </div>

      <div class="od-section">
        <h4>Tiến trình <button class="btn ghost sm" id="btnReloadDetail" style="margin-left:auto">⟳</button></h4>
        <div class="timeline" id="timeline"></div>
        <div style="margin-top:10px">
          <label style="font-size:13px;color:#334155;font-weight:600;display:block;margin-bottom:4px">Thực tế hiện tại</label>
          <textarea id="progressNote" class="input" rows="2" placeholder="Ví dụ: KTV đang trên đường, dự kiến tới 14h">${esc(o.progress_note || '')}</textarea>
          <div style="margin-top:6px;text-align:right">
            <button class="btn ghost sm" id="btnSaveProgressNote">💾 Lưu ghi chú</button>
          </div>
        </div>
      </div>

      <div class="od-section">
        <h4>Dòng công việc
          <button class="btn ghost sm" id="btnEditLines">Sửa nội dung</button>
        </h4>
        <div id="linesList"></div>
      </div>

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

    `;

    renderTimeline();
    renderLinesList();
    renderPhotoList();
    renderKtvRequests();
    renderCommission();
    renderActions();

    $('btnReloadDetail').addEventListener('click', () => openDetail(o.id));
    $('btnEditLines').addEventListener('click', editLines);
    if ($('btnSaveProgressNote')) {
      $('btnSaveProgressNote').addEventListener('click', async () => {
        const v = $('progressNote').value;
        const r = await api.patch(`/admin/orders/${o.id}/progress-note`,
          { progress_note: v }, { onError: 'toast' });
        if (r) { ui.toast('Đã lưu', 'success'); state.currentDetail.progress_note = v; }
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

  function renderLinesList() {
    const lines = state.currentDetail.lines || [];
    const $box = $('linesList');
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
            <input type="number" id="ccStaffAmt" min="0" step="1000" placeholder="Số tiền (VND)">
          </div>
          <input type="text" id="ccStaffNote" maxlength="300" placeholder="Ghi chú (tuỳ chọn)">
          <div class="cc-actions" style="margin-top:4px">
            <button class="btn-cc" id="ccStaffSaveBtn">${saveBtnLabel}</button>
            <button class="btn-cc ghost" id="ccStaffCancelBtn">Huỷ</button>
          </div>
        </div>
      </div>
    `;

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
      const amt     = Math.max(0, Math.round(Number($('ccStaffAmt').value) || 0));
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
    $box.innerHTML = `<div class="photo-group-grid">
      ${ps.map(p => `
        <div class="ph">
          <a href="${esc(p.url)}" target="_blank"><img src="${esc(p.url)}" alt=""></a>
          <div class="meta">${fmtDate(p.uploaded_at)}${p.caption ? ' · ' + esc(p.caption) : ''}</div>
        </div>
      `).join('')}
    </div>`;
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
    btns.push(`<button class="btn" id="btnInvoice" style="background:#1e40af">🧾 Hoá đơn báo giá</button>`);
    btns.push(`<button class="btn ghost" id="btnUploadPhoto">+ Ảnh</button>`);
    if (o.status !== 'cancelled') {
      btns.push(`<button class="btn ghost" id="btnCancel" style="color:#dc2626;margin-left:auto">Huỷ đơn</button>`);
    }
    btns.push(`<button class="btn ghost" id="btnDelete" style="color:#dc2626">Xoá</button>`);

    $box.innerHTML = btns.join('');

    if ($('btnApprove'))      $('btnApprove').addEventListener('click', approveOrder);
    if ($('btnAssignKTV'))    $('btnAssignKTV').addEventListener('click', assignKTV);
    if ($('btnMarkPaid'))     $('btnMarkPaid').addEventListener('click', markPaid);
    if ($('btnInvoice'))      $('btnInvoice').addEventListener('click', openInvoice);
    if ($('btnUploadPhoto'))  $('btnUploadPhoto').addEventListener('click', uploadStepPhoto);
    if ($('btnCancel'))       $('btnCancel').addEventListener('click', cancelOrder);
    if ($('btnDelete'))       $('btnDelete').addEventListener('click', deleteOrder);
  }

  // ---- ACTIONS ------------------------------------------------
  async function approveOrder() {
    const ok = await api.post(`/admin/orders/${state.currentDetail.id}/approve`, {}, { onError: 'toast' });
    if (ok) { ui.toast('Đã duyệt', 'success'); openDetail(state.currentDetail.id); loadList(); }
  }

  async function assignKTV() {
    // Lay ds KTV (tu suggested-staff endpoint)
    const id = state.currentDetail.id;
    const r = await api.get(`/admin/orders/${id}/suggested-staff`).catch(() => null);
    const staff = (r && r.items) || [];
    if (!staff.length) { ui.toast('Chưa có KTV nào', 'warning'); return; }

    const opts = staff.map(s => `<option value="${s.id}" ${s.id === state.currentDetail.assigned_staff_id ? 'selected' : ''}>${esc(s.full_name)} (đang ${s.active_count} đơn)</option>`).join('');
    const html = `
      <div style="padding:14px">
        <div class="field"><label>Chọn KTV</label>
          <select id="aSel" class="select">${opts}</select>
        </div>
        <div class="field"><label>Tiền công (đ)</label>
          <input id="aWage" type="number" class="input" value="${state.currentDetail.wage_amount || 0}" min="0">
        </div>
      </div>
    `;
    const dlg = await openSimpleModal('Gán KTV', html, 'Lưu');
    if (!dlg) return;
    const staffId = Number(document.getElementById('aSel').value);
    const staffName = (staff.find(s => s.id === staffId) || {}).full_name || '';
    const wage = Number(document.getElementById('aWage').value) || 0;
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

  async function deleteOrder() {
    const yes = await ui.confirm({ title: 'Xoá đơn?', message: 'Đơn sẽ bị ẩn (soft delete).', danger: true, okText: 'Xoá' });
    if (!yes) return;
    const ok = await api.delete(`/admin/orders/${state.currentDetail.id}`, { onError: 'toast' });
    if (ok) { ui.toast('Đã xoá', 'success'); closeDetail(); loadList(); }
  }

  // ---- EDIT: lines ---------------------------------------------
  // Sua toan bo lines (PUT /admin/orders/:id/lines).
  const DEFAULT_ITEM_FIELDS = ['Biển số xe', 'IMEI', 'Tên tài khoản', 'Số SIM'];

  async function editLines() {
    const o = state.currentDetail;
    if (!state.products) {
      const r = await api.get('/admin/products?limit=300').catch(() => null);
      state.products = (r && r.items) || [];
    }
    if (!state.templates || !state.templates.length) {
      const r = await api.get('/admin/order-templates').catch(() => null);
      state.templates = (r && r.items) || [];
    }
    const tplCache = state.templateById = state.templateById || {};

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

    const fmtMoney =(n) => Math.round(Number(n) || 0).toLocaleString('vi-VN');
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

    const renderLine = (ln, idx) => {
      const tpl = tplCache[ln.template_id];
      const lineName = ln.custom_name || (tpl ? tpl.name : '');

      const itemsHtml = ln.items.length ? ln.items.map((it, ii) => {
        const sub = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
        return `<div class="item-block" data-ii="${ii}">
          <div class="ic-row el-item items-grid">
            <div class="cell">
              <select class="ic-select prod">
                <option value="">— Sản phẩm —</option>
                ${state.products.map(p => `<option value="${p.id}" ${p.id === it.product_id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
              </select>
            </div>
            <div class="cell"><input type="number" class="ic-input num qty" value="${it.qty || 1}" min="1"></div>
            <div class="cell"><input type="number" class="ic-input num price" value="${it.unit_price || 0}" min="0"></div>
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
      #simpleModal .modal { max-width: 860px !important; }
      #simpleModal .modal-body { background:#f1f5f9; }
      .el-wrap { padding:14px; }

      /* Line card – khớp trang tạo đơn */
      .line-card { background:#fff; border:1px solid #e2e8f0; border-radius:10px; margin-bottom:14px; overflow:hidden; box-shadow:0 1px 4px rgba(15,23,42,.06); }
      .line-head { display:flex; align-items:center; gap:8px; padding:8px 12px; background:linear-gradient(135deg,#f1f5ff,#fafbfd); border-bottom:1px solid #e2e8f0; }
      .line-head .seq { width:24px; height:24px; border-radius:50%; background:#2563eb; color:#fff; font-weight:700; display:grid; place-items:center; font-size:12px; flex-shrink:0; }
      .line-head .tpl-combo { flex:1; position:relative; }
      .line-head .tpl-combo .tpl-input { width:100%; font-size:13px; padding:6px 28px 6px 10px; font-weight:600; border:1px solid #e2e8f0; border-radius:6px; background:#fff; box-sizing:border-box; }
      .line-head .tpl-combo .tpl-caret { position:absolute; right:6px; top:50%; transform:translateY(-50%); width:22px; height:22px; border:none; background:transparent; color:#64748b; cursor:pointer; font-size:11px; display:grid; place-items:center; padding:0; }
      .line-head .tpl-combo .tpl-pop { position:absolute; left:0; right:0; top:calc(100% + 4px); background:#fff; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 8px 24px rgba(15,23,42,.12); max-height:220px; overflow-y:auto; z-index:50; }
      .line-head .tpl-combo .tpl-pop[hidden] { display:none; }
      .line-head .sub-show { font-size:12px; color:#64748b; font-variant-numeric:tabular-nums; }
      .line-head .x-btn { background:transparent; border:1px solid #e2e8f0; border-radius:6px; padding:4px 10px; font-size:12px; color:#dc2626; cursor:pointer; }
      .line-head .x-btn:hover { background:#fee2e2; border-color:#fecaca; }

      .line-body { padding:10px 12px; }
      .line-section { margin-bottom:10px; }
      .line-section .sh { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:.3px; font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:6px; }
      .line-section .sh .add { margin-left:auto; font-size:11.5px; padding:2px 8px; border:1px solid #e2e8f0; border-radius:5px; background:#fff; color:#2563eb; cursor:pointer; }
      .line-section .sh .add:hover { background:#eff6ff; }

      /* Bảng sản phẩm / phụ phí */
      .ic-table { border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; background:#fff; }
      .ic-thead { background:#f8fafc; font-size:10.5px; color:#94a3b8; text-transform:uppercase; letter-spacing:.3px; font-weight:600; border-bottom:1px solid #e2e8f0; }
      .ic-row { border-bottom:1px solid #f1f5f9; }
      .ic-row:last-child { border-bottom:0; }
      .ic-row .cell, .ic-thead .cell { padding:4px 6px; min-width:0; }
      .ic-thead .cell.center, .ic-row .cell.center { text-align:center; }
      .ic-thead .cell.right,  .ic-row .cell.right  { text-align:right; }
      .items-grid   { display:grid; grid-template-columns:2fr 60px 110px 110px 32px; gap:0; align-items:center; }
      .charges-grid { display:grid; grid-template-columns:90px 1fr 120px 30px; gap:0; align-items:center; }
      .ic-input, .ic-select { width:100%; border:1px solid transparent; background:transparent; padding:4px 6px; font-size:12.5px; border-radius:4px; box-sizing:border-box; }
      .ic-input:focus, .ic-select:focus { outline:none; border-color:#2563eb; background:#fff; }
      .ic-input.num { text-align:right; font-variant-numeric:tabular-nums; }
      .el-amt-cell { font-weight:600; color:#0f172a; font-variant-numeric:tabular-nums; font-size:12.5px; }
      .ic-empty { padding:8px; text-align:center; color:#94a3b8; font-size:12px; font-style:italic; }

      /* Item block */
      .item-block { border-bottom:2px solid #e2e8f0; }
      .item-block:last-child { border-bottom:0; }

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
      .el-line-total { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:13px; color:#475569; }
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
            product_id: Number(row.querySelector('.prod').value) || 0,
            qty: Math.max(1, Number(row.querySelector('.qty').value) || 1),
            unit_price: Math.max(0, Number(row.querySelector('.price').value) || 0),
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
            unit_price: Number(r.querySelector('.price').value) || 0,
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
        el.querySelectorAll('.qty, .price, .amt, .kind').forEach(inp => {
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
    adminShell.init('orders');
    await loadTemplates();

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
        // đóng các pop khác
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

    // Multi-select thanh toán
    initMultiSelect({
      btnId: 'psBtn', popId: 'psPop', applyId: 'psApply', clearId: 'psClear',
      filterKey: 'payment_status',
      labels: { unpaid: 'Chưa trả', partial: 'Một phần', paid: 'Đã trả', customer_owes: 'KH nợ', staff_owes: 'KTV giữ', pending_admin_confirm: 'Chờ xác nhận' }
    });

    // Multi-select trạng thái — mặc định tick 4 trạng thái đang hoạt động, ẩn đã huỷ
    initMultiSelect({
      btnId: 'stBtn', popId: 'stPop', applyId: 'stApply', clearId: 'stClear',
      filterKey: 'status',
      labels: { pending: 'Đang chờ', confirmed: 'Lên đơn', in_progress: 'Đang xử lý', done: 'Đã xong', cancelled: 'Đã huỷ' },
      defaults: ['pending', 'confirmed', 'in_progress', 'done']
    });

    // Multi-select loại đơn
    initMultiSelect({
      btnId: 'tplBtn', popId: 'tplPop', applyId: 'tplApply', clearId: 'tplClear',
      filterKey: 'template_id',
      labels: null  // dùng state.templates để tra tên
    });

    // Filters
    document.querySelectorAll('[data-filter]').forEach(el => {
      el.addEventListener('change', () => {
        state.filters[el.dataset.filter] = el.value;
        state.page = 1;
        loadList();
      });
      if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')) {
        let t;
        el.addEventListener('input', () => {
          clearTimeout(t);
          t = setTimeout(() => {
            state.filters[el.dataset.filter] = el.value;
            state.page = 1;
            loadList();
          }, 300);
        });
      }
    });

    // Date range popover
    const $dBtn  = $('dateRangeBtn');
    const $dPop  = $('dateRangePop');
    const $dLbl  = $('dateRangeLabel');
    const $dFrom = document.querySelector('[data-filter=date_from]');
    const $dTo   = document.querySelector('[data-filter=date_to]');
    function fmtDayVi(s) {
      if (!s) return '';
      const [y, m, d] = s.split('-');
      return `${d}/${m}/${y}`;
    }
    function refreshDateLabel() {
      const f = $dFrom.value, t = $dTo.value;
      if (!f && !t) { $dLbl.textContent = 'Chọn khoảng ngày'; $dBtn.classList.remove('active'); return; }
      $dBtn.classList.add('active');
      if (f && t) $dLbl.textContent = `${fmtDayVi(f)} – ${fmtDayVi(t)}`;
      else if (f)  $dLbl.textContent = `Từ ${fmtDayVi(f)}`;
      else         $dLbl.textContent = `Đến ${fmtDayVi(t)}`;
    }
    $dBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      $dPop.style.display = $dPop.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', (e) => {
      if (!$dPop.contains(e.target) && e.target !== $dBtn) $dPop.style.display = 'none';
    });
    $('dateRangeClose').addEventListener('click', () => { $dPop.style.display = 'none'; });
    $('dateRangeClear').addEventListener('click', () => {
      $dFrom.value = ''; $dTo.value = '';
      state.filters.date_from = ''; state.filters.date_to = '';
      refreshDateLabel();
      state.page = 1; loadList();
    });
    [$dFrom, $dTo].forEach(el => {
      el.addEventListener('change', refreshDateLabel);
    });
    refreshDateLabel();

    $('prevPage').addEventListener('click', () => { if (state.page > 1) { state.page--; loadList(); } });
    $('nextPage').addEventListener('click', () => {
      if (state.page * state.limit < state.total) { state.page++; loadList(); }
    });

    $('modalClose').addEventListener('click', closeDetail);
    $('modal').addEventListener('click', (e) => {
      if (e.target.id === 'modal') closeDetail();
    });

    // ---- Xuất bảng kê: lấy thẳng filter hiện tại --------------------
    $('btnOpenStatement').onclick = () => {
      const f = state.filters;
      const qs = new URLSearchParams();
      if (f.customer_q)     qs.set('customer_q',     f.customer_q);
      if (f.q)              qs.set('q',              f.q);
      if (f.date_from)      qs.set('date_from',      f.date_from);
      if (f.date_to)        qs.set('date_to',        f.date_to);
      if (f.template_id)    qs.set('template_id',    f.template_id);
      if (f.status)         qs.set('status',         f.status);
      if (f.payment_status) qs.set('payment_status', f.payment_status);
      window.open('/admin/order-statement.html?' + qs.toString(), '_blank');
    };
    // ------------------------------------------------------------------

    await loadList();

    // ---- BULK SELECT init -----------------------------------------
    // cbAll: chọn/bỏ toàn trang
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
    // ------------------------------------------------------------------
  });
})();
