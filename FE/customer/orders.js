// /customer/orders.html — list don cua khach + modal chi tiet template-driven.

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

  let state = { items: [], detail: null };

  function pillForStatus(o) {
    if (o.status === 'pending') return { cls: 'amber', label: 'Chờ duyệt' };
    if (o.status === 'cancelled') return { cls: 'gray', label: 'Đã huỷ' };
    if (o.completed_at) return { cls: 'green', label: 'Hoàn thành' };
    return { cls: 'blue', label: o.status };
  }

  async function loadList() {
    const res = await api.get('/customer/orders').catch(() => null);
    if (!res) return;
    state.items = res.items || [];
    render();
    const m = location.hash.match(/order-(\d+)/);
    if (m) openDetail(Number(m[1]));
  }

  function render() {
    const $box = $('ordersList');
    if (!state.items.length) {
      $box.innerHTML = `<div class="text-muted" style="text-align:center;padding:40px">
        Bạn chưa có đơn nào. <a href="order.html">Tạo đơn đầu tiên</a>.
      </div>`;
      return;
    }
    $box.innerHTML = state.items.map(o => {
      const s = pillForStatus(o);
      return `
        <div class="order-card" data-id="${o.id}">
          <div class="head">
            <div><b>${esc(o.code)}</b> · ${esc(o.template_names || o.template_name || '')}</div>
            <span class="pill ${s.cls}">${esc(s.label)}</span>
          </div>
          <div class="meta">${fmtDate(o.created_at)}</div>
          <div class="meta">${o.item_count || 0} SP · Tổng: <b>${fmt(o.total_amount)}đ</b></div>
        </div>
      `;
    }).join('');
    $box.querySelectorAll('.order-card').forEach(el => {
      el.addEventListener('click', () => openDetail(Number(el.dataset.id)));
    });
  }

  async function openDetail(id) {
    $('modal').classList.add('open');
    $('odBody').innerHTML = '<p class="text-muted">Đang tải…</p>';
    const res = await api.get('/customer/orders/' + id).catch(() => null);
    if (!res) { $('odBody').innerHTML = '<p style="color:#dc2626">Không tải được</p>'; return; }
    state.detail = res;
    location.hash = 'order-' + id;
    renderDetail();
  }

  function closeDetail() {
    $('modal').classList.remove('open');
    state.detail = null;
    if (location.hash.startsWith('#order-')) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }

  function renderTimeline(o) {
    const steps = o.workflow_steps || o.template_steps || [];
    const curIdx = steps.findIndex(s => s.code === o.status);
    return steps.map((s, idx) => {
      let cls = '';
      if (curIdx >= 0 && idx < curIdx) cls = 'done';
      else if (idx === curIdx) cls = 'current';
      return `<div class="timeline-step ${cls}">
        <span class="seq">${idx + 1}</span>
        <span>${esc(s.label)}</span>
      </div>`;
    }).join('');
  }

  function renderDetail() {
    const o = state.detail;
    const lines = o.lines || [];
    const tplNames = lines.map(l => l.template_name).filter(Boolean).join(' + ');
    $('modalTitle').textContent = `${o.code} — ${tplNames || ''}`;
    const sCls = pillForStatus(o);
    const remain = Math.max(0, Number(o.total_amount) - Number(o.paid_amount));

    const stepsHtml = (o.workflow_steps || o.template_steps || []).length
      ? renderTimeline(o) : '<p class="text-muted">—</p>';

    // Render moi line
    const linesHtml = lines.length ? lines.map((ln, idx) => {
      const fvs = (ln.field_values || []).length
        ? ln.field_values.map(f => `<div class="field-row" style="padding:3px 0">
              <span style="flex:1;color:#64748b">${esc(f.label)}</span>
              <span style="flex:2">${esc(f.value || '—')}</span>
            </div>`).join('') : '';
      const items = (ln.items || []).length
        ? ln.items.map(i => `<div class="item-row" style="padding:3px 0">
              <span style="flex:2">${esc(i.product_name || ('SP #' + i.product_id))}</span>
              <span>x${i.qty}</span>
              <span style="width:120px;text-align:right">${fmt(i.unit_price)}đ</span>
              <span style="width:140px;text-align:right;font-weight:600">${fmt(Number(i.qty) * Number(i.unit_price))}đ</span>
            </div>`).join('') : '<p class="text-muted" style="font-size:12.5px">Không có sản phẩm</p>';
      const ch = (ln.charges || []).length
        ? '<div style="margin-top:6px;padding-top:6px;border-top:1px dashed #e2e8f0">' + ln.charges.map(c => `
            <div class="charge-row" style="padding:2px 0">
              <span style="flex:1">${esc(c.label)}</span>
              <span style="width:140px;text-align:right;${Number(c.amount) < 0 ? 'color:#16a34a' : ''}">${fmt(c.amount)}đ</span>
            </div>`).join('') + '</div>' : '';
      return `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:8px;background:#fafbfd">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-weight:700;color:#1e3a8a">
          <span style="background:#3b82f6;color:#fff;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:11px">${idx + 1}</span>
          <span>${esc(ln.template_name || '(?)')}</span>
          <span style="margin-left:auto;color:#64748b;font-size:12.5px">${fmt(ln.subtotal)}đ</span>
        </div>
        ${fvs}
        ${items}
        ${ch}
      </div>`;
    }).join('') : '<p class="text-muted">Đơn không có dòng công việc</p>';

    const orderChHtml = (o.order_charges || []).length
      ? o.order_charges.map(c => `<div class="charge-row">
            <span style="flex:1">${esc(c.label)}</span>
            <span style="width:140px;text-align:right;${Number(c.amount) < 0 ? 'color:#16a34a' : ''}">${fmt(c.amount)}đ</span>
          </div>`).join('')
      : '<p class="text-muted">—</p>';
    const photosHtml = (o.step_photos || []).length
      ? `<div class="photos">${o.step_photos.map(p =>
          `<a href="${esc(p.url)}" target="_blank" title="${esc(p.step_code)}"><img src="${esc(p.url)}"></a>`
        ).join('')}</div>`
      : '<p class="text-muted">Chưa có ảnh</p>';

    const cancelBtn = o.status === 'pending'
      ? `<button class="btn ghost" id="btnCancel" style="color:#dc2626">Huỷ đơn</button>` : '';

    $('odBody').innerHTML = `
      <div class="od-section">
        <div><b>Trạng thái:</b> <span class="pill ${sCls.cls}">${esc(sCls.label)}</span></div>
        ${o.staff_name ? `<div><b>KTV phụ trách:</b> ${esc(o.staff_name)}</div>` : ''}
        <div><b>Tạo:</b> ${fmtDate(o.created_at)}${o.completed_at ? ` · Hoàn thành: ${fmtDate(o.completed_at)}` : ''}</div>
      </div>
      <div class="od-section"><h4>Tiến trình</h4>${stepsHtml}</div>
      <div class="od-section"><h4>Dòng công việc</h4>${linesHtml}</div>
      <div class="od-section"><h4>Chi phí khác</h4>${orderChHtml}</div>
      <div class="od-section"><h4>Ảnh các bước</h4>${photosHtml}</div>
      <div class="od-section" style="background:#f8fafc;padding:12px;border-radius:10px">
        <div style="display:flex;justify-content:space-between"><span>Tổng đơn</span><b>${fmt(o.total_amount)}đ</b></div>
        <div style="display:flex;justify-content:space-between"><span>Đã thu</span><span>${fmt(o.paid_amount)}đ</span></div>
        ${remain > 0 ? `<div style="display:flex;justify-content:space-between;color:#dc2626;font-weight:600"><span>Còn lại</span><span>${fmt(remain)}đ</span></div>` : ''}
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">${cancelBtn}</div>
    `;
    if (document.getElementById('btnCancel')) {
      document.getElementById('btnCancel').addEventListener('click', cancelOrder);
    }
  }

  async function cancelOrder() {
    const yes = await ui.confirm({ title: 'Huỷ đơn?', danger: true, okText: 'Huỷ' });
    if (!yes) return;
    const ok = await api.post(`/customer/orders/${state.detail.id}/cancel`, {}, { onError: 'toast' });
    if (ok) { ui.toast('Đã huỷ', 'success'); openDetail(state.detail.id); loadList(); }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    $('modalClose').addEventListener('click', closeDetail);
    $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeDetail(); });
    const me = await api.get('/customer/me').catch(() => null);
    if (me && me.user) $('userInfo').textContent = `${me.user.full_name || ''} — ${me.user.phone || ''}`;
    await loadList();
  });
})();
