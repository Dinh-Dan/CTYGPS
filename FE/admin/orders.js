// /admin/orders.html — list don + modal chi tiet template-driven.

(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const fmtN = new Intl.NumberFormat('vi-VN');
  const fmt = (n) => fmtN.format(Number(n) || 0);

  function esc(s) {
    return String(s == null ? '' : s)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }
  function fmtDate(d) { return d ? new Date(d).toLocaleString('vi-VN') : '—'; }

  let state = {
    page: 1, limit: 30, total: 0,
    filters: { bucket: 'all' },
    templates: [],
    items: [],
    currentDetail: null,        // detail loaded in modal
    products: null,             // lazy
    customCacheStaff: null,     // suggested staff cache
  };

  // ---- TEMPLATE DROPDOWN --------------------------------------
  async function loadTemplates() {
    const res = await api.get('/admin/order-templates').catch(() => null);
    state.templates = (res && res.items) || [];
    const $sel = document.querySelector('[data-filter=template_id]');
    state.templates.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id; opt.textContent = t.name;
      $sel.appendChild(opt);
    });
  }

  // ---- LIST ---------------------------------------------------
  function buildQuery() {
    const p = new URLSearchParams();
    p.set('page', state.page);
    p.set('limit', state.limit);
    const f = state.filters;

    // bucket maps to status filter at FE side
    if (f.bucket === 'pending')   p.set('status', 'pending');
    else if (f.bucket === 'cancelled') p.set('status', 'cancelled');

    if (f.q) p.set('q', f.q);
    if (f.customer_q) p.set('customer_q', f.customer_q);
    if (f.date_from) p.set('date_from', f.date_from);
    if (f.date_to)   p.set('date_to', f.date_to);
    if (f.template_id) p.set('template_id', f.template_id);
    if (f.status && f.bucket === 'all') p.set('status', f.status);
    if (f.payment_status) p.set('payment_status', f.payment_status);
    if (f.collected_for_dealer) p.set('collected_for_dealer', f.collected_for_dealer);
    return p.toString();
  }

  async function loadList() {
    const res = await api.get('/admin/orders?' + buildQuery()).catch(() => null);
    if (!res) return;
    let items = res.items || [];
    // For active/done buckets: filter at FE because BE doesn't have buckets
    if (state.filters.bucket === 'active') {
      items = items.filter(x => x.status !== 'pending' && x.status !== 'cancelled' && !x.completed_at);
    } else if (state.filters.bucket === 'done') {
      items = items.filter(x => !!x.completed_at && x.status !== 'cancelled');
    }
    state.items = items;
    state.total = res.total || items.length;
    render();

    // Auto-open modal if URL has #order-{id}
    const m = location.hash.match(/order-(\d+)/);
    if (m) openDetail(Number(m[1]));
  }

  function render() {
    const $tb = $('tbody');
    if (!state.items.length) {
      $tb.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:30px">Không có đơn nào</td></tr>';
    } else {
      $tb.innerHTML = state.items.map(o => {
        const sCls = pillForStatus(o);
        const pCls = pillForPayment(o.payment_status);
        const total = Number(o.total_amount) || 0;
        const paid  = Number(o.paid_amount) || 0;
        const remain = Math.max(0, total - paid);
        const paidCls = paid <= 0 ? 'amt-paid-zero' : 'amt-paid';
        return `
          <tr data-id="${o.id}" style="cursor:pointer">
            <td><b>${esc(o.code)}</b></td>
            <td>${fmtDate(o.created_at)}</td>
            <td>${esc(o.customer_name || '')}<br><small style="color:#64748b">${esc(o.customer_phone || '')}</small></td>
            <td>${esc(o.template_names || o.template_name || '—')}</td>
            <td style="text-align:right">
              <span class="amt-total">${fmt(total)}</span><br>
              <small class="${paidCls}">Đã thu: ${fmt(paid)}</small>
              ${remain > 0 ? `<br><small class="amt-remain">Còn: ${fmt(remain)}</small>` : ''}
            </td>
            <td><span class="pill ${sCls.cls}">${esc(sCls.label)}</span></td>
            <td><span class="pill ${pCls.cls}">${esc(pCls.label)}</span></td>
            <td><button class="btn ghost sm" data-act="open">Xem</button></td>
          </tr>
        `;
      }).join('');
      $tb.querySelectorAll('tr').forEach(tr => {
        tr.addEventListener('click', () => openDetail(Number(tr.dataset.id)));
      });
    }
    $('pageInfo').textContent = `Trang ${state.page} / ${Math.max(1, Math.ceil(state.total / state.limit))} (${state.total} đơn)`;
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
  function pillForPayment(p) {
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
    renderDetail();
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
    $('modalTitle').textContent = `${o.code} — ${tplNames || ''}`;

    // Tong subtotal cua moi line (items + charges trong line)
    const lineSum = lines.reduce((s, l) => s + Number(l.subtotal || 0), 0);
    const orderCharges = o.order_charges || [];
    const orderChargeSum = orderCharges.reduce((s, c) => s + Number(c.amount), 0);
    const remain = Math.max(0, Number(o.total_amount) - Number(o.paid_amount));

    const sCls = pillForStatus(o);
    const pCls = pillForPayment(o.payment_status);

    $('odBody').innerHTML = `
      <div class="od-section">
        <div style="display:flex;gap:14px;flex-wrap:wrap">
          <div style="flex:1;min-width:240px">
            <div><b>Khách:</b> ${esc(o.customer_name || '')} ${o.customer_phone ? `— ${esc(o.customer_phone)}` : ''}</div>
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
        <h4>Chi phí khác
          <button class="btn ghost sm" id="btnEditOrderCharges">Sửa</button>
        </h4>
        <div id="orderChargesList"></div>
      </div>

      <div class="od-section">
        <h4>Ảnh các bước</h4>
        <div class="photo-list" id="photoList"></div>
      </div>

      <div class="od-section">
        <div class="bill">
          <div class="row"><span>Tổng dòng công việc</span><span>${fmt(lineSum)}đ</span></div>
          <div class="row"><span>Chi phí khác</span><span>${fmt(orderChargeSum)}đ</span></div>
          <div class="row total"><span>Tổng đơn</span><span>${fmt(o.total_amount)}đ</span></div>
          <div class="row"><span>Đã thu</span><span>${fmt(o.paid_amount)}đ</span></div>
          ${remain > 0 ? `<div class="row remain"><span>Còn lại</span><span>${fmt(remain)}đ</span></div>` : ''}
        </div>
      </div>

    `;

    renderTimeline();
    renderLinesList();
    renderOrderChargesList();
    renderPhotoList();
    renderActions();

    $('btnReloadDetail').addEventListener('click', () => openDetail(o.id));
    $('btnEditLines').addEventListener('click', editLines);
    $('btnEditOrderCharges').addEventListener('click', editOrderCharges);
    if ($('btnSaveProgressNote')) {
      $('btnSaveProgressNote').addEventListener('click', async () => {
        const v = $('progressNote').value;
        const r = await api.patch(`/admin/orders/${o.id}/progress-note`,
          { progress_note: v }, { onError: 'toast' });
        if (r) { ui.toast('Đã lưu', 'success'); state.currentDetail.progress_note = v; }
      });
    }
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
      const fvs = ln.field_values || [];
      const items = ln.items || [];
      const charges = ln.charges || [];
      const fieldsHtml = fvs.length ? `
        <div class="ln-fields" style="margin-bottom:8px">
          ${fvs.map(f => `<div class="row" style="padding:3px 0">
            <span style="flex:1;color:#64748b;font-size:13px">${esc(f.label)}</span>
            <span style="flex:2;font-size:13px">${esc(f.value || '—')}</span>
          </div>`).join('')}
        </div>` : '';
      const itemsHtml = items.length ? items.map(i => {
        const line = Number(i.qty) * Number(i.unit_price);
        const vat = Number(i.vat_percent) || 0;
        const sub = Math.round(line + line * vat / 100);
        const aii = allItems.indexOf(i);
        return `<div class="row" data-item-idx="${aii}" style="cursor:pointer">
          <span class="name">${esc(i.product_name || ('SP #' + i.product_id))}
            ${i.product_code ? `<small style="color:#94a3b8">(${esc(i.product_code)})</small>` : ''}
          </span>
          <span class="qty">${i.qty}</span>
          <span class="price">${fmt(i.unit_price)}đ</span>
          <span class="vat">${vat ? vat + '%' : '—'}</span>
          <span class="sub">${fmt(sub)}đ</span>
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
        ${fieldsHtml}
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

  function renderOrderChargesList() {
    const cs = state.currentDetail.order_charges || [];
    const $box = $('orderChargesList');
    if (!cs.length) { $box.innerHTML = '<p style="color:#94a3b8">Không có chi phí khác</p>'; return; }
    $box.innerHTML = cs.map(c => {
      const neg = Number(c.amount) < 0;
      return `<div class="row">
        <span style="flex:1">${esc(c.label)} <small style="color:#94a3b8">(${esc(c.kind)})</small></span>
        <span style="color:${neg ? '#16a34a' : '#dc2626'};font-weight:600">${fmt(c.amount)}đ</span>
      </div>`;
    }).join('');
  }

  // ---- DIALOG CHI TIET SAN PHAM (overlay) -----------------------
  function openProductDialog(item) {
    const img = item.product_image || item.product_thumb || '';
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
        </div>
      </div>
    `;
    openSimpleModal('Chi tiết sản phẩm', html, 'Đóng', null, /*hideCancel*/ true).then(() => {});
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

  function renderActions() {
    const o = state.currentDetail;
    const $box = $('odActions');
    const btns = [];

    if (o.status === 'pending') {
      btns.push(`<button class="btn" id="btnApprove">✓ Duyệt đơn</button>`);
    }
    if (o.status !== 'cancelled' && !o.completed_at) {
      btns.push(`<button class="btn ghost" id="btnAssignKTV">Gán KTV / công</button>`);
    }
    if (Number(o.total_amount) > Number(o.paid_amount)) {
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
    const wage = Number(document.getElementById('aWage').value) || 0;
    closeSimpleModal();
    const ok = await api.post(`/admin/orders/${id}/assign-staff`, { staff_id: staffId, wage_amount: wage }, { onError: 'toast' });
    if (ok) { ui.toast('Đã gán', 'success'); openDetail(id); loadList(); }
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

  // ---- EDIT: lines + order charges -----------------------------
  // Sua toan bo lines (PUT /admin/orders/:id/lines).
  // Tat ca line se duoc thay the. UI gon trong 1 modal lon.
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
    // Cache template details (de co fields)
    const tplCache = state.templateById = state.templateById || {};
    for (const ln of (o.lines || [])) {
      if (ln.template_id && !tplCache[ln.template_id]) {
        const r = await api.get('/admin/order-templates/' + ln.template_id).catch(() => null);
        if (r) tplCache[ln.template_id] = r;
      }
    }

    // Working copy
    const wlines = (o.lines || []).map(ln => ({
      template_id: ln.template_id,
      custom_name: ln.custom_name || null,
      items: (ln.items || []).map(i => ({
        product_id: i.product_id, qty: i.qty, unit_price: i.unit_price,
        vat_percent: Number(i.vat_percent) || 0,
      })),
      charges: (ln.charges || []).map(c => ({ kind: c.kind, label: c.label, amount: c.amount })),
      customFields: (ln.field_values || []).map(fv => ({
        label: fv.label || '', value: fv.value || '',
      })),
    }));

    // Neu line chua co customFields nao -> seed tu template
    for (const ln of wlines) {
      if (!ln.customFields.length && ln.template_id && tplCache[ln.template_id]) {
        const fs = tplCache[ln.template_id].fields || [];
        ln.customFields = fs.map(f => ({ label: f.label || '', value: '', _fromTpl: true }));
      } else if (ln.customFields.length && ln.template_id && tplCache[ln.template_id]) {
        // Da co data tu DB — danh dau field nao trung label voi template = _fromTpl
        const tplLabels = new Set(
          (tplCache[ln.template_id].fields || []).map(f => String(f.label || '').trim().toLowerCase())
        );
        ln.customFields = ln.customFields.map(f => ({
          ...f,
          _fromTpl: tplLabels.has(String(f.label || '').trim().toLowerCase()),
        }));
      }
    }

    const VAT_OPTS = [0, 8, 10];
    const fmtMoney = (n) => Math.round(Number(n) || 0).toLocaleString('vi-VN');
    const calcLineTotal = (ln) => {
      const itemSum = (ln.items || []).reduce((s, it) => {
        const sub = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
        const vat = sub * ((Number(it.vat_percent) || 0) / 100);
        return s + sub + vat;
      }, 0);
      const chargeSum = (ln.charges || []).reduce((s, c) => {
        const amt = Number(c.amount) || 0;
        return s + (c.kind === 'discount' ? -amt : amt);
      }, 0);
      return itemSum + chargeSum;
    };

    const renderLine = (ln, idx) => {
      const tpl = tplCache[ln.template_id];
      const lineName = ln.custom_name || (tpl ? tpl.name : '');
      if (!ln.customFields) ln.customFields = [];

      const fieldsHtml = ln.customFields.map((f, fi) => f._fromTpl
        ? `<div class="el-row el-field el-field-fixed" data-fi="${fi}">
             <span class="cf-fixed-label">${esc(f.label || '')}</span>
             <input type="text" class="input cf-value" placeholder="Nhập ${esc(f.label || '')}" value="${esc(f.value || '')}">
           </div>`
        : `<div class="el-row el-field el-field-custom" data-fi="${fi}">
             <input type="text" class="input cf-label" placeholder="Nhãn" value="${esc(f.label || '')}" style="flex:1">
             <input type="text" class="input cf-value" placeholder="Giá trị" value="${esc(f.value || '')}" style="flex:2">
             <button type="button" class="btn-x" data-act="del-field" title="Xoá">×</button>
           </div>`).join('');

      const itemsHeader = ln.items.length ? `
        <div class="el-col-head el-item-cols">
          <span class="c-prod">Sản phẩm</span>
          <span class="c-qty">SL</span>
          <span class="c-price">Đơn giá</span>
          <span class="c-vat">VAT</span>
          <span class="c-line">Thành tiền</span>
          <span class="c-x"></span>
        </div>` : '';
      const itemsHtml = ln.items.map((it, ii) => {
        const sub = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
        const lineAmt = sub * (1 + (Number(it.vat_percent) || 0) / 100);
        return `<div class="el-row el-item el-item-cols" data-ii="${ii}">
          <select class="select prod c-prod">
            <option value="">— SP —</option>
            ${state.products.map(p => `<option value="${p.id}" ${p.id === it.product_id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
          </select>
          <input type="number" class="input qty c-qty" value="${it.qty || 1}" min="1">
          <input type="number" class="input price c-price" value="${it.unit_price || 0}" min="0">
          <select class="select vat c-vat">
            ${VAT_OPTS.map(v => `<option value="${v}" ${v === Number(it.vat_percent || 0) ? 'selected' : ''}>${v ? v + '%' : 'No VAT'}</option>`).join('')}
          </select>
          <span class="c-line el-amt-cell">${fmtMoney(lineAmt)}</span>
          <button type="button" class="btn-x c-x" data-act="del-item" title="Xoá">×</button>
        </div>`;
      }).join('');

      const chargesHeader = ln.charges.length ? `
        <div class="el-col-head el-charge-cols">
          <span class="c-kind">Loại</span>
          <span class="c-lbl">Mô tả</span>
          <span class="c-amt">Số tiền</span>
          <span class="c-x"></span>
        </div>` : '';
      const chargesHtml = ln.charges.map((c, ci) => `
        <div class="el-row el-charge el-charge-cols" data-ci="${ci}">
          <select class="select kind c-kind">
            <option value="fee"      ${c.kind === 'fee'      ? 'selected' : ''}>Phí</option>
            <option value="shipping" ${c.kind === 'shipping' ? 'selected' : ''}>Ship</option>
            <option value="discount" ${c.kind === 'discount' ? 'selected' : ''}>Giảm</option>
          </select>
          <input type="text" class="input lbl c-lbl" value="${esc(c.label || '')}" placeholder="VD: Phí công lắp đặt">
          <input type="number" class="input amt c-amt" value="${c.amount || 0}">
          <button type="button" class="btn-x c-x" data-act="del-charge" title="Xoá">×</button>
        </div>`).join('');

      return `<div class="el-line" data-idx="${idx}">
        <div class="el-line-head">
          <span class="el-line-num">${idx + 1}</span>
          <div class="tpl-combo" style="flex:1;position:relative">
            <input type="text" class="input tpl-input" value="${esc(lineName)}" placeholder="Loại / tên công việc..." autocomplete="off" style="width:100%;padding-right:30px">
            <button type="button" class="tpl-caret" tabindex="-1">▾</button>
            <div class="tpl-pop" hidden></div>
          </div>
          <button type="button" class="btn-x" data-act="del-line" title="Xoá dòng">×</button>
        </div>
        <div class="el-line-body">
          <div class="el-section">
            <div class="el-section-head">
              <span class="sh">Thông tin</span>
              <button type="button" class="btn ghost sm" data-act="add-field">+ Thêm ô</button>
            </div>
            ${fieldsHtml || '<div class="el-empty">Chưa có thông tin</div>'}
          </div>
          <div class="el-section">
            <div class="el-section-head">
              <span class="sh">Sản phẩm</span>
              <button type="button" class="btn ghost sm" data-act="add-item">+ Sản phẩm</button>
            </div>
            ${itemsHeader}
            ${itemsHtml || '<div class="el-empty">Chưa có sản phẩm</div>'}
          </div>
          <div class="el-section">
            <div class="el-section-head">
              <span class="sh">Chi phí khác</span>
              <button type="button" class="btn ghost sm" data-act="add-charge">+ Chi phí</button>
            </div>
            ${chargesHeader}
            ${chargesHtml || '<div class="el-empty">Chưa có chi phí</div>'}
          </div>
        </div>
        <div class="el-line-total">
          <span>Tổng dòng</span>
          <b class="el-line-total-val">${fmtMoney(calcLineTotal(ln))} đ</b>
        </div>
      </div>`;
    };

    const html = `<style>
      #simpleModal .modal { max-width: 760px !important; }
      #simpleModal .modal-body { background:#f1f5f9; }
      .el-wrap { padding:14px; }
      .el-line { border:1px solid #e2e8f0; border-radius:10px; background:#fff; margin-bottom:14px; overflow:hidden; box-shadow:0 1px 2px rgba(15,23,42,.04); }
      .el-line-head { display:flex; gap:8px; align-items:center; padding:10px 12px; background:#f8fafc; border-bottom:1px solid #e2e8f0; }
      .el-line-num { background:#3b82f6; color:#fff; width:26px; height:26px; border-radius:50%; display:grid; place-items:center; font-size:13px; font-weight:700; flex-shrink:0; }
      .el-line-body { padding:14px; }
      .el-section { margin-bottom:14px; }
      .el-section:last-child { margin-bottom:0; }
      .el-section-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
      .el-section-head .sh { font-size:11px; color:#475569; text-transform:uppercase; letter-spacing:.6px; font-weight:700; }
      .el-row { display:flex; gap:8px; margin-bottom:6px; align-items:center; }
      .el-row:last-child { margin-bottom:0; }
      .el-empty { font-size:12px; color:#94a3b8; font-style:italic; padding:6px 4px; }

      /* Grid columns dung chung header + row, dam bao thang hang */
      .el-item-cols { display:grid; grid-template-columns: 1fr 56px 110px 90px 110px 30px; gap:8px; align-items:center; }
      .el-charge-cols { display:grid; grid-template-columns: 110px 1fr 130px 30px; gap:8px; align-items:center; }
      .el-col-head { font-size:10.5px; color:#94a3b8; text-transform:uppercase; letter-spacing:.5px; font-weight:600; padding:0 4px 4px; }
      .el-col-head .c-qty, .el-col-head .c-vat { text-align:center; }
      .el-col-head .c-price, .el-col-head .c-line, .el-col-head .c-amt { text-align:right; }
      .el-amt-cell { text-align:right; font-size:13px; color:#0f172a; font-variant-numeric:tabular-nums; padding:0 4px; }

      /* Thong tin: nhan co dinh + gia tri */
      .el-field-fixed { display:grid; grid-template-columns: 130px 1fr; gap:10px; align-items:center; }
      .el-field-fixed .cf-fixed-label { font-size:13px; color:#334155; font-weight:500; padding:0 4px; }
      .el-field-custom { display:grid; grid-template-columns: 1fr 2fr 30px; gap:8px; align-items:center; }

      /* Combo template */
      .tpl-combo .tpl-caret { position:absolute; right:6px; top:50%; transform:translateY(-50%); width:24px; height:24px; border:none; background:transparent; color:#64748b; cursor:pointer; font-size:14px; }
      .tpl-combo .tpl-pop { position:absolute; left:0; right:0; top:calc(100% + 4px); background:#fff; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 8px 24px rgba(15,23,42,.12); max-height:220px; overflow-y:auto; z-index:50; }

      /* Tong dong */
      .el-line-total { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:13px; color:#475569; }
      .el-line-total b { color:#0f172a; font-size:15px; font-variant-numeric:tabular-nums; }

      /* Nut xoa */
      .btn-x { width:30px; height:30px; border-radius:6px; border:1px solid #e2e8f0; background:#fff; color:#64748b; cursor:pointer; flex-shrink:0; font-size:16px; line-height:1; padding:0; }
      .btn-x:hover { background:#fef2f2; color:#dc2626; border-color:#fecaca; }

      /* Nut +Them dong cuoi */
      #edAddLine { width:100%; padding:12px; border:2px dashed #cbd5e1; background:#fff; color:#3b82f6; font-weight:600; border-radius:10px; cursor:pointer; }
      #edAddLine:hover { background:#eff6ff; border-color:#3b82f6; }
    </style>
    <div class="el-wrap">
      <div id="edLinesBox">${wlines.map(renderLine).join('')}</div>
      <button type="button" class="btn ghost sm" id="edAddLine">+ Thêm dòng công việc</button>
    </div>`;

    function rebuild() {
      document.getElementById('edLinesBox').innerHTML = wlines.map(renderLine).join('');
      bindAll();
    }
    function readDom() {
      // sync UI -> wlines (keep state up-to-date)
      document.querySelectorAll('.el-line').forEach(el => {
        const idx = Number(el.dataset.idx);
        const ln = wlines[idx];
        if (!ln) return;
        ln.items = [];
        el.querySelectorAll('.el-item').forEach(row => {
          ln.items.push({
            product_id: Number(row.querySelector('.prod').value) || 0,
            qty: Math.max(1, Number(row.querySelector('.qty').value) || 1),
            unit_price: Math.max(0, Number(row.querySelector('.price').value) || 0),
            vat_percent: Math.max(0, Number(row.querySelector('.vat').value) || 0),
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
        ln.customFields = [];
        el.querySelectorAll('.el-field').forEach(row => {
          if (row.classList.contains('el-field-fixed')) {
            ln.customFields.push({
              label: row.querySelector('.cf-fixed-label').textContent || '',
              value: row.querySelector('.cf-value').value || '',
              _fromTpl: true,
            });
          } else {
            ln.customFields.push({
              label: row.querySelector('.cf-label').value || '',
              value: row.querySelector('.cf-value').value || '',
              _fromTpl: false,
            });
          }
        });
      });
    }
    function bindAll() {
      document.querySelectorAll('.el-line').forEach(el => {
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
            if (!tplCache[matched.id]) {
              const r = await api.get('/admin/order-templates/' + matched.id).catch(() => null);
              if (r) tplCache[matched.id] = r;
            }
            const fs = (tplCache[matched.id] && tplCache[matched.id].fields) || [];
            wlines[idx].customFields = fs.map(f => ({ label: f.label || '', value: '', _fromTpl: true }));
          } else {
            wlines[idx].template_id = null;
            wlines[idx].custom_name = String(name || '').trim() || null;
            wlines[idx].customFields = wlines[idx].customFields || [];
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
          wlines[idx].items.push({ product_id: 0, qty: 1, unit_price: 0, vat_percent: 0 });
          rebuild();
        });
        el.querySelector('[data-act=add-charge]').addEventListener('click', () => {
          readDom();
          wlines[idx].charges.push({ kind: 'fee', label: '', amount: 0 });
          rebuild();
        });
        el.querySelectorAll('[data-act=del-item]').forEach(b => b.addEventListener('click', () => {
          readDom();
          const ii = Number(b.closest('.el-item').dataset.ii);
          wlines[idx].items.splice(ii, 1);
          rebuild();
        }));
        el.querySelectorAll('[data-act=del-charge]').forEach(b => b.addEventListener('click', () => {
          readDom();
          const ci = Number(b.closest('.el-charge').dataset.ci);
          wlines[idx].charges.splice(ci, 1);
          rebuild();
        }));
        const addFieldBtn = el.querySelector('[data-act=add-field]');
        if (addFieldBtn) addFieldBtn.addEventListener('click', () => {
          readDom();
          if (!wlines[idx].customFields) wlines[idx].customFields = [];
          wlines[idx].customFields.push({ label: '', value: '', _fromTpl: false });
          rebuild();
        });
        el.querySelectorAll('[data-act=del-field]').forEach(b => b.addEventListener('click', () => {
          readDom();
          const fi = Number(b.closest('.el-field').dataset.fi);
          wlines[idx].customFields.splice(fi, 1);
          rebuild();
        }));
      });
      document.getElementById('edAddLine').addEventListener('click', async () => {
        readDom();
        const tid = state.templates[0] && state.templates[0].id;
        if (!tid) { ui.toast('Chưa có loại đơn', 'warning'); return; }
        if (!tplCache[tid]) {
          const r = await api.get('/admin/order-templates/' + tid).catch(() => null);
          if (r) tplCache[tid] = r;
        }
        const fs = (tplCache[tid] && tplCache[tid].fields) || [];
        wlines.push({
          template_id: tid, custom_name: null, items: [], charges: [],
          customFields: fs.map(f => ({ label: f.label || '', value: '', _fromTpl: true })),
        });
        rebuild();
      });

      // Live update tong tien moi dong khi thay doi qty/price/vat/amount/kind
      document.querySelectorAll('.el-line').forEach(el => {
        const updateTotal = () => {
          const idx = Number(el.dataset.idx);
          // doc nhanh tu DOM cua line nay
          const items = [...el.querySelectorAll('.el-item')].map(r => ({
            qty: Number(r.querySelector('.qty').value) || 0,
            unit_price: Number(r.querySelector('.price').value) || 0,
            vat_percent: Number(r.querySelector('.vat').value) || 0,
          }));
          const charges = [...el.querySelectorAll('.el-charge')].map(r => ({
            kind: r.querySelector('.kind').value,
            amount: Number(r.querySelector('.amt').value) || 0,
          }));
          // Cap nhat thanh tien tung dong SP
          el.querySelectorAll('.el-item').forEach((r, i) => {
            const it = items[i];
            const sub = it.qty * it.unit_price;
            const lineAmt = sub * (1 + it.vat_percent / 100);
            const cell = r.querySelector('.el-amt-cell');
            if (cell) cell.textContent = fmtMoney(lineAmt);
          });
          const total = calcLineTotal({ items, charges });
          const totalEl = el.querySelector('.el-line-total-val');
          if (totalEl) totalEl.textContent = fmtMoney(total) + ' đ';
        };
        el.querySelectorAll('.qty, .price, .vat, .amt, .kind').forEach(inp => {
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
    const linesPayload = wlines.map(ln => {
      const fvs = [];
      for (const cf of (ln.customFields || [])) {
        const lbl = (cf.label || '').trim();
        const val = (cf.value || '').trim();
        if (lbl && val) fvs.push({ label: lbl, value: val });
      }
      return {
        template_id: ln.template_id || null,
        custom_name: ln.custom_name || null,
        items: ln.items.filter(it => it.product_id),
        charges: ln.charges.filter(c => (c.label || '').trim()),
        field_values: fvs,
      };
    });
    closeSimpleModal();
    const r = await api.put(`/admin/orders/${o.id}/lines`, { lines: linesPayload }, { onError: 'toast' });
    if (r) { ui.toast('Đã lưu', 'success'); openDetail(o.id); }
  }

  async function editOrderCharges() {
    const o = state.currentDetail;
    const cs = (o.order_charges || []).filter(c => c.label !== 'Công lắp');
    const buildRow = (c) => `
      <div class="ed-charge-row" style="display:flex;gap:6px;margin-bottom:6px">
        <select class="select kind" style="width:120px">
          <option value="shipping" ${c.kind === 'shipping' ? 'selected' : ''}>Ship</option>
          <option value="discount" ${c.kind === 'discount' ? 'selected' : ''}>Giảm</option>
          <option value="fee"      ${c.kind === 'fee'      ? 'selected' : ''}>Phí</option>
        </select>
        <input type="text" class="input lbl" value="${esc(c.label || '')}" style="flex:2" placeholder="Mô tả">
        <input type="number" class="input amt" value="${c.amount || 0}" style="width:120px">
        <button type="button" class="btn-x">×</button>
      </div>`;
    const html = `<div style="padding:14px">
      <p style="color:#94a3b8;font-size:12px">Chi phí khác áp cho cả đơn (vd ship, giảm tổng, phụ phí). Có thể thêm nhiều dòng. "Công lắp" tự sync từ tiền công KTV.</p>
      <div id="edChBox">${cs.map(buildRow).join('')}</div>
      <button type="button" class="btn ghost sm" id="edAddCh">+ Thêm</button>
    </div>`;
    const ok = await openSimpleModal('Sửa chi phí khác', html, 'Lưu', () => {
      document.getElementById('edAddCh').addEventListener('click', () => {
        const div = document.createElement('div');
        div.innerHTML = buildRow({ kind: 'shipping', label: '', amount: 0 });
        document.getElementById('edChBox').appendChild(div.firstElementChild);
      });
      document.getElementById('edChBox').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-x')) e.target.closest('.ed-charge-row').remove();
      });
    });
    if (!ok) return;
    const charges = [];
    document.querySelectorAll('.ed-charge-row').forEach(row => {
      const kind = row.querySelector('.kind').value;
      const label = row.querySelector('.lbl').value.trim();
      const amount = Number(row.querySelector('.amt').value) || 0;
      if (label) charges.push({ kind, label, amount });
    });
    closeSimpleModal();
    const r = await api.patch(`/admin/orders/${o.id}/order-charges`, { charges }, { onError: 'toast' });
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
      const cleanup = (val) => { div.remove(); resolve(val); };
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

    // Quick tabs
    document.querySelectorAll('#quickTabs button').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#quickTabs button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        state.filters.bucket = b.dataset.bucket;
        state.page = 1;
        loadList();
      });
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

    await loadList();
  });
})();
