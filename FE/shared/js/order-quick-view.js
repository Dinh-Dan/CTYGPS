// Dialog xem nhanh don hang (read-only), dung chung nhieu trang admin.
// Load sau api.js + ui.js. Gan data-order-quick="<order_id>" len link/card don.
// Click thuong -> mo dialog; Ctrl/Cmd/Shift + click -> hanh vi mac dinh (tab moi / link).

(function (global) {
  'use strict';

  const MODAL_ID = 'orderQuickViewModal';
  const fmtN = new Intl.NumberFormat('vi-VN');
  const fmtMoney = (n) => fmtN.format(Number(n) || 0) + 'đ';

  function esc(s) {
    return String(s == null ? '' : s)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function stripAccents(s) {
    return String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function isPlateLabel(lab) {
    const n = stripAccents(lab);
    if (!n) return false;
    if (n.includes('bien so')) return true;
    if (n === 'bsx' || n.includes('license plate')) return true;
    return false;
  }

  function isAccountLabel(lab) {
    const n = stripAccents(lab);
    if (!n) return false;
    if (n.includes('tai khoan')) return true;
    if (n.includes('ten tk')) return true;
    if (n.includes('account')) return true;
    return false;
  }

  function isDriverLabel(lab) {
    const n = stripAccents(lab);
    if (!n) return false;
    if (n.includes('tai xe')) return true;
    if (n.includes('lai xe') || n.includes('laixe')) return true;
    if (n.includes('phu xe')) return true;
    if (n.includes('driver')) return true;
    if (n.includes('ho ten lai')) return true;
    return false;
  }

  /** Gom field_values tu tat ca lines; tach bien so / tai khoan / tai xe / khac. */
  function extractAggregatedFields(order) {
    const plates = [];
    const accounts = [];
    const drivers = [];
    const other = [];
    const seenP = new Set();
    const seenA = new Set();
    const seenD = new Set();
    const seenO = new Set();

    for (const ln of (order.lines || [])) {
      const allFvs = (ln.field_values || []).concat(
        (ln.items || []).flatMap(it => it.field_values || [])
      );
      for (const fv of allFvs) {
        const lab = String(fv.label || '').trim();
        const v = String(fv.value || '').trim();
        if (isPlateLabel(lab)) {
          if (v && !seenP.has(v)) { seenP.add(v); plates.push(v); }
        } else if (isAccountLabel(lab)) {
          if (v && !seenA.has(v)) { seenA.add(v); accounts.push(v); }
        } else if (isDriverLabel(lab)) {
          const dk = stripAccents(lab) + '::' + v;
          if (v && !seenD.has(dk)) { seenD.add(dk); drivers.push({ label: lab, value: v }); }
        } else if (lab || v) {
          const key = stripAccents(lab) + '::' + v;
          if (!seenO.has(key)) {
            seenO.add(key);
            other.push({ label: lab || '—', value: v || '—' });
          }
        }
      }
    }

    return {
      plateText: plates.join(', '),
      accountText: accounts.join(', '),
      drivers,
      other,
    };
  }

  const STATUS_LABELS = {
    pending: 'Đang chờ',
    confirmed: 'Lên đơn',
    in_progress: 'Đang xử lý',
    done: 'Đã xong',
    cancelled: 'Đã huỷ',
  };

  function paymentLabel(p, o) {
    if (p === 'customer_owes' && o && o.debt_carried_at) return 'Đã kết nợ';
    const map = {
      unpaid: 'Chưa trả',
      partial: 'Một phần',
      paid: 'Đã trả',
      customer_owes: 'KH nợ',
      staff_owes: 'KTV giữ',
      pending_admin_confirm: 'Chờ xác nhận',
      refunded: 'Đã hoàn',
    };
    return map[p] || (p || '—');
  }

  function pillStatusClass(status) {
    if (status === 'pending') return 'oqv-pill oqv-pill-amber';
    if (status === 'cancelled') return 'oqv-pill oqv-pill-gray';
    if (status === 'done') return 'oqv-pill oqv-pill-green';
    if (status === 'in_progress') return 'oqv-pill oqv-pill-blue';
    return 'oqv-pill oqv-pill-purple';
  }

  function pillPaymentClass(p, o) {
    if (p === 'customer_owes' && o && o.debt_carried_at) return 'oqv-pill oqv-pill-gray';
    if (p === 'unpaid') return 'oqv-pill oqv-pill-gray';
    if (p === 'partial') return 'oqv-pill oqv-pill-amber';
    if (p === 'paid') return 'oqv-pill oqv-pill-green';
    if (p === 'customer_owes') return 'oqv-pill oqv-pill-red';
    if (p === 'staff_owes') return 'oqv-pill oqv-pill-amber';
    if (p === 'pending_admin_confirm') return 'oqv-pill oqv-pill-purple';
    if (p === 'refunded') return 'oqv-pill oqv-pill-gray';
    return 'oqv-pill oqv-pill-gray';
  }

  function fmtDateTime(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    const day = dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hm = dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${hm} · ${day}`;
  }

  const PAYMENT_METHOD_VI = {
    cash: 'Tiền mặt',
    transfer: 'Chuyển khoản',
    debt: 'Ghi nợ',
  };

  function paymentMethodVi(m) {
    return PAYMENT_METHOD_VI[m] || (m ? String(m) : '—');
  }

  function renderLineBlock(ln, idx) {
    const fvs = ln.field_values || [];
    const items = ln.items || [];
    const charges = ln.charges || [];

    const fieldsHtml = fvs.length
      ? fvs.map((f) => `
          <div class="oqv-fv">
            <span class="oqv-fv-l">${esc(f.label || '—')}</span>
            <span class="oqv-fv-v">${esc(f.value != null && f.value !== '' ? f.value : '—')}</span>
          </div>`).join('')
      : '<div class="oqv-muted">Chưa có ô thông tin thêm cho dòng này.</div>';

    const itemsHtml = items.length
      ? items.map((i) => {
        const line = Number(i.qty) * Number(i.unit_price);
        const vat = Number(i.vat_percent) || 0;
        const sub = Math.round(line + line * vat / 100);
        return `
          <div class="oqv-item">
            <span class="oqv-item-name">${esc(i.product_name || ('SP #' + i.product_id))}${i.product_code ? ` <small class="oqv-muted">(${esc(i.product_code)})</small>` : ''}</span>
            <span class="oqv-item-qty">×${esc(String(i.qty || 0))}</span>
            <span class="oqv-item-price">${esc(fmtN.format(Number(i.unit_price) || 0))}đ</span>
            <span class="oqv-item-sub">${esc(fmtN.format(sub))}đ${vat ? ` <small class="oqv-muted">VAT ${vat}%</small>` : ''}</span>
          </div>`;
      }).join('')
      : '<div class="oqv-muted">Không có sản phẩm trên dòng.</div>';

    const chargesHtml = charges.length
      ? charges.map((c) => {
        const neg = Number(c.amount) < 0;
        return `
          <div class="oqv-charge">
            <span>${esc(c.label || c.kind || '—')} <small class="oqv-muted">(${esc(c.kind || '')})</small></span>
            <span class="${neg ? 'oqv-money-neg' : 'oqv-money-pos'}">${esc(fmtN.format(Number(c.amount) || 0))}đ</span>
          </div>`;
      }).join('')
      : '';

    return `
      <div class="oqv-line">
        <div class="oqv-line-head">
          <span class="oqv-line-num">${idx + 1}</span>
          <span class="oqv-line-title">${esc(ln.template_name || ln.custom_name || 'Công việc')}</span>
          <span class="oqv-line-sub">${esc(fmtN.format(Number(ln.subtotal) || 0))}đ</span>
        </div>
        <div class="oqv-line-inner">
          <div class="oqv-line-col">
            <div class="oqv-line-subsec">Thông tin thêm</div>
            <div class="oqv-fv-wrap oqv-fv-cols">${fieldsHtml}</div>
          </div>
          <div class="oqv-line-col">
            <div class="oqv-line-subsec">Sản phẩm</div>
            <div class="oqv-item-list">${itemsHtml}</div>
            ${chargesHtml ? `<div class="oqv-line-subsec">Chi phí dòng</div><div>${chargesHtml}</div>` : ''}
            ${ln.note ? `<div class="oqv-line-note"><b>Ghi chú dòng:</b> ${esc(ln.note)}</div>` : ''}
          </div>
        </div>
      </div>`;
  }

  function renderOrderCharges(order) {
    const cs = order.order_charges || [];
    if (!cs.length) return '';
    const rows = cs.map((c) => {
      const neg = Number(c.amount) < 0;
      return `
        <div class="oqv-charge">
          <span>${esc(c.label || c.kind || '—')} <small class="oqv-muted">(${esc(c.kind || '')})</small></span>
          <span class="${neg ? 'oqv-money-neg' : 'oqv-money-pos'}">${esc(fmtN.format(Number(c.amount) || 0))}đ</span>
        </div>`;
    }).join('');
    return `
      <div class="oqv-sec">Chi phí cấp đơn</div>
      <div class="oqv-line" style="padding-top:10px">${rows}</div>`;
  }

  function close() {
    const el = document.getElementById(MODAL_ID);
    if (el) {
      el.remove();
      if (global.ui && typeof global.ui.popDialog === 'function') global.ui.popDialog();
    }
    document.removeEventListener('keydown', onKeyDoc);
  }

  function onKeyDoc(e) {
    if (e.key === 'Escape') close();
  }

  function open(orderId) {
    const id = Number(orderId);
    if (!id) return Promise.resolve();
    close();
    return doOpen(id);
  }

  async function doOpen(id) {
    if (!global.api || typeof global.api.get !== 'function') {
      if (global.ui && global.ui.toast) global.ui.toast('Thiếu API client', 'error');
      return;
    }
    if (global.ui && typeof global.ui.loading === 'function') global.ui.loading(true);
    const o = await global.api.get('/admin/orders/' + id, { silent: true }).catch(() => null);
    if (global.ui && typeof global.ui.loading === 'function') global.ui.loading(false);
    if (!o) {
      if (global.ui && global.ui.toast) global.ui.toast('Không tải được đơn', 'error');
      return;
    }

    const agg = extractAggregatedFields(o);
    const plateShow = agg.plateText || '—';
    const accountShow = agg.accountText || '—';

    const total = Number(o.total_amount) || 0;
    const paid = Number(o.paid_amount) || 0;
    const remain = Math.max(0, total - paid);
    const stLabel = STATUS_LABELS[o.status] || o.status || '—';
    const payLabel = paymentLabel(o.payment_status, o);
    const stCls = pillStatusClass(o.status);
    const payCls = pillPaymentClass(o.payment_status, o);

    const lines = o.lines || [];
    const lineSum = lines.reduce((s, l) => s + Number(l.subtotal || 0), 0);
    const orderCharges = o.order_charges || [];
    const orderChargeSum = orderCharges.reduce((s, c) => s + Number(c.amount), 0);

    const customerTypeLabel = o.customer_type === 'dealer' ? 'Đại lý' : 'Khách lẻ';
    const dealerPill = o.customer_type === 'dealer'
      ? '<span class="oqv-pill oqv-pill-dealer">Đại lý</span>'
      : '<span class="oqv-pill oqv-pill-retail">Khách lẻ</span>';

    const endCustomerBlock = o.customer_type === 'dealer'
      ? (o.end_customer_id
        ? `<div class="oqv-ec">
            <div class="oqv-ec-title">Khách đầu cuối (của đại lý)</div>
            <div><b>${esc(o.end_customer_name || '—')}</b>
              ${o.end_customer_phone ? ` · ${esc(o.end_customer_phone)}` : ''}
              <span class="oqv-muted"> ${o.end_customer_code ? '(' + esc(o.end_customer_code) + ')' : ''}</span>
            </div>
          </div>`
        : `<div class="oqv-ec oqv-ec-empty">Chưa gán khách đầu cuối cho đại lý.</div>`)
      : '';

    const driverBlock = agg.drivers.length
      ? `<div class="oqv-sec">Tài xế / liên hệ (theo ô nhập trên đơn)</div>
         <div class="oqv-fv-wrap">
           ${agg.drivers.map((d) => `
             <div class="oqv-fv">
               <span class="oqv-fv-l">${esc(d.label)}</span>
               <span class="oqv-fv-v">${esc(d.value)}</span>
             </div>`).join('')}
         </div>`
      : '';

    const otherGlobal = agg.other.length
      ? agg.other.map((r) => `
          <div class="oqv-fv">
            <span class="oqv-fv-l">${esc(r.label)}</span>
            <span class="oqv-fv-v">${esc(r.value)}</span>
          </div>`).join('')
      : '';

    const collectedPill = Number(o.collected_for_dealer) === 1
      ? '<span class="oqv-pill oqv-pill-amber" title="Thu hộ đại lý">Thu hộ ĐL</span>'
      : '';

    const linesHtml = lines.length
      ? lines.map((ln, i) => renderLineBlock(ln, i)).join('')
      : '<div class="oqv-muted">Đơn không có dòng công việc.</div>';

    const orderChargesSection = renderOrderCharges(o);

    const fullUrl = '/admin/orders.html#order-' + id;

    if (global.ui && typeof global.ui.pushDialog === 'function') global.ui.pushDialog();

    const bg = document.createElement('div');
    bg.id = MODAL_ID;
    bg.className = 'modal-bg open';
    bg.style.zIndex = '230';
    bg.innerHTML = `
<style>
#${MODAL_ID} .modal{max-width:min(96vw, 980px);width:100%}
#${MODAL_ID} .modal-body{padding:12px 18px 18px;max-height:min(80vh,900px);overflow-y:auto}
#${MODAL_ID} .oqv-top{font-size:12px;color:#64748b;line-height:1.45;margin-bottom:8px}
#${MODAL_ID} .oqv-pills{display:flex;flex-wrap:wrap;gap:6px 8px;margin-bottom:14px;align-items:center}
#${MODAL_ID} .oqv-pill{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11.5px;font-weight:700;line-height:1.35}
#${MODAL_ID} .oqv-pill-green{background:#dcfce7;color:#166534}
#${MODAL_ID} .oqv-pill-blue{background:#dbeafe;color:#1e40af}
#${MODAL_ID} .oqv-pill-amber{background:#fef3c7;color:#92400e}
#${MODAL_ID} .oqv-pill-red{background:#fee2e2;color:#991b1b}
#${MODAL_ID} .oqv-pill-gray{background:#f1f5f9;color:#475569}
#${MODAL_ID} .oqv-pill-purple{background:#ede9fe;color:#6d28d9}
#${MODAL_ID} .oqv-pill-dealer{background:#fef3c7;color:#92400e}
#${MODAL_ID} .oqv-pill-retail{background:#e0e7ff;color:#3730a3}
#${MODAL_ID} .oqv-sec{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.45px;margin:16px 0 10px}
#${MODAL_ID} .oqv-sec:first-of-type{margin-top:2px}
#${MODAL_ID} .oqv-cols2{display:grid;grid-template-columns:1fr 1fr;gap:12px 18px;align-items:start}
#${MODAL_ID} .oqv-panel{border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;background:#fff;min-width:0}
#${MODAL_ID} .oqv-panel-h{font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.4px;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #f1f5f9}
#${MODAL_ID} .oqv-grid{display:grid;grid-template-columns:minmax(72px,100px) 1fr;gap:5px 12px;font-size:13px;margin-bottom:2px}
#${MODAL_ID} .oqv-grid dt{color:#64748b;font-weight:500;margin:0;align-self:start;padding-top:1px}
#${MODAL_ID} .oqv-grid dd{margin:0;font-weight:600;color:#0f172a;word-break:break-word}
#${MODAL_ID} .oqv-muted{color:#94a3b8;font-size:12px;font-weight:500}
#${MODAL_ID} .oqv-ec{margin-top:10px;padding:10px 12px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;font-size:13px;line-height:1.45}
#${MODAL_ID} .oqv-ec-title{font-size:11px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:.3px;margin-bottom:4px}
#${MODAL_ID} .oqv-ec-empty{background:#f8fafc;border-color:#e2e8f0;color:#64748b;font-size:12.5px}
#${MODAL_ID} .oqv-dev-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;margin-bottom:8px}
#${MODAL_ID} .oqv-dev-cell{border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;background:#fafafa;min-width:0}
#${MODAL_ID} .oqv-dev-l{font-size:11px;font-weight:700;color:#334155;text-transform:uppercase;letter-spacing:.25px;margin-bottom:4px}
#${MODAL_ID} .oqv-dev-v{font-size:13.5px;font-weight:700;color:#0f172a;word-break:break-word;line-height:1.35}
#${MODAL_ID} .oqv-fv-wrap-other{margin-top:8px;padding-top:8px;border-top:1px dashed #e2e8f0}
#${MODAL_ID} .oqv-fv-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 14px}
#${MODAL_ID} .oqv-fv{display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:12.5px;min-width:0}
#${MODAL_ID} .oqv-fv:last-child{border-bottom:none}
#${MODAL_ID} .oqv-fv-l{color:#64748b;flex:0 0 40%;font-weight:500;min-width:0}
#${MODAL_ID} .oqv-fv-v{color:#0f172a;font-weight:600;text-align:right;word-break:break-word;flex:1;min-width:0}
#${MODAL_ID} .oqv-line{border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;margin-bottom:10px;background:#fafbfd}
#${MODAL_ID} .oqv-line-head{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-weight:700;color:#1e3a8a}
#${MODAL_ID} .oqv-line-num{flex-shrink:0;background:#3b82f6;color:#fff;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:12px}
#${MODAL_ID} .oqv-line-title{flex:1;min-width:0;font-size:14px}
#${MODAL_ID} .oqv-line-sub{margin-left:auto;color:#0f172a;font-weight:700;font-size:13.5px;white-space:nowrap;font-variant-numeric:tabular-nums}
#${MODAL_ID} .oqv-line-inner{display:grid;grid-template-columns:1fr 1.15fr;gap:12px 18px;align-items:start}
#${MODAL_ID} .oqv-line-col{min-width:0}
#${MODAL_ID} .oqv-line-subsec{font-size:10.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin:0 0 4px}
#${MODAL_ID} .oqv-item-list{display:flex;flex-direction:column;gap:4px}
#${MODAL_ID} .oqv-item{display:grid;grid-template-columns:minmax(0,1fr) auto auto minmax(72px,auto);gap:6px 10px;font-size:12.5px;padding:5px 0;border-bottom:1px dashed #e2e8f0;align-items:baseline}
#${MODAL_ID} .oqv-item:last-child{border-bottom:none}
#${MODAL_ID} .oqv-item-name{min-width:0}
#${MODAL_ID} .oqv-item-qty{color:#64748b;font-variant-numeric:tabular-nums}
#${MODAL_ID} .oqv-item-price,#${MODAL_ID} .oqv-item-sub{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
#${MODAL_ID} .oqv-charge{display:flex;justify-content:space-between;font-size:12.5px;padding:3px 0;gap:10px}
#${MODAL_ID} .oqv-money-pos{color:#dc2626;font-weight:700}
#${MODAL_ID} .oqv-money-neg{color:#16a34a;font-weight:700}
#${MODAL_ID} .oqv-line-note{margin-top:8px;padding-top:8px;border-top:1px dashed #e2e8f0;font-size:12.5px;color:#475569}
#${MODAL_ID} .oqv-bill{border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;background:#fafafa;font-size:13px}
#${MODAL_ID} .oqv-bill-row{display:flex;justify-content:space-between;padding:3px 0;gap:12px}
#${MODAL_ID} .oqv-bill-row.total{font-weight:800;font-size:14px;padding-top:6px;margin-top:4px;border-top:1px dashed #cbd5e1}
#${MODAL_ID} .oqv-bill-row.remain span:last-child{color:#dc2626;font-weight:800}
@media (max-width:720px){
  #${MODAL_ID} .oqv-cols2{grid-template-columns:1fr}
  #${MODAL_ID} .oqv-dev-grid{grid-template-columns:1fr}
  #${MODAL_ID} .oqv-line-inner{grid-template-columns:1fr}
  #${MODAL_ID} .oqv-fv-cols{grid-template-columns:1fr}
}
</style>
<div class="modal" role="dialog" aria-modal="true" aria-labelledby="oqvTitle">
  <div class="modal-head">
    <h3 id="oqvTitle">${esc(o.code || ('Đơn #' + id))}</h3>
    <button type="button" class="modal-close" data-oqv-close aria-label="Đóng">×</button>
  </div>
  <div class="modal-body">
    <div class="oqv-top">Xem nhanh — chỉ đọc. Sửa đơn ở trang <b>Đơn hàng</b>.</div>
    <div class="oqv-pills">
      <span class="${stCls}">${esc(stLabel)}</span>
      <span class="${payCls}">${esc(payLabel)}</span>
      ${dealerPill}
      ${collectedPill}
    </div>

    <div class="oqv-sec">Khách &amp; thời gian</div>
    <div class="oqv-cols2">
      <div class="oqv-panel">
        <div class="oqv-panel-h">Khách hàng</div>
        <dl class="oqv-grid">
          <dt>Người mua</dt><dd>${esc(o.customer_name || '—')} ${o.customer_phone ? `<span class="oqv-muted"> · ${esc(o.customer_phone)}</span>` : ''}</dd>
          <dt>Loại</dt><dd>${esc(customerTypeLabel)}</dd>
          <dt>Địa chỉ</dt><dd>${esc(o.address || '—')}</dd>
          <dt>Ghi chú</dt><dd>${esc(o.note || '—')}</dd>
        </dl>
        ${endCustomerBlock}
      </div>
      <div class="oqv-panel">
        <div class="oqv-panel-h">Thời gian &amp; vận hành</div>
        <dl class="oqv-grid">
          <dt>Tạo đơn</dt><dd>${esc(fmtDateTime(o.created_at))}</dd>
          <dt>Xác nhận</dt><dd>${esc(fmtDateTime(o.confirmed_at))}</dd>
          <dt>Hoàn thành</dt><dd>${esc(fmtDateTime(o.completed_at))}</dd>
          <dt>Hẹn</dt><dd>${esc(fmtDateTime(o.due_at))}</dd>
          <dt>KTV</dt><dd>${esc(o.staff_name || '—')}${o.wage_amount ? ` <span class="oqv-muted">(công ${esc(fmtN.format(Number(o.wage_amount) || 0))}đ)</span>` : ''}</dd>
          <dt>TT toán</dt><dd>${esc(paymentMethodVi(o.payment_method))}</dd>
        </dl>
      </div>
    </div>

    ${driverBlock}

    <div class="oqv-sec">Thiết bị &amp; tổng tiền</div>
    <div class="oqv-cols2">
      <div class="oqv-panel">
        <div class="oqv-panel-h">Biển số &amp; tài khoản (toàn đơn)</div>
        <div class="oqv-dev-grid">
          <div class="oqv-dev-cell">
            <div class="oqv-dev-l">Biển số xe</div>
            <div class="oqv-dev-v">${esc(plateShow)}</div>
          </div>
          <div class="oqv-dev-cell">
            <div class="oqv-dev-l">Tên tài khoản</div>
            <div class="oqv-dev-v">${esc(accountShow)}</div>
          </div>
        </div>
        ${otherGlobal ? `<div class="oqv-fv-wrap-other"><div class="oqv-line-subsec" style="margin-top:0;margin-bottom:6px">Ô thông tin khác (gộp)</div><div class="oqv-fv-wrap oqv-fv-cols">${otherGlobal}</div></div>` : ''}
      </div>
      <div class="oqv-panel">
        <div class="oqv-panel-h">Tổng tiền</div>
        <div class="oqv-bill">
          <div class="oqv-bill-row"><span>Tổng dòng CV</span><span>${esc(fmtN.format(lineSum))}đ</span></div>
          <div class="oqv-bill-row"><span>Chi phí cấp đơn</span><span>${esc(fmtN.format(orderChargeSum))}đ</span></div>
          <div class="oqv-bill-row total"><span>Tổng đơn</span><span>${esc(fmtN.format(total))}đ</span></div>
          <div class="oqv-bill-row"><span>Đã thu</span><span>${esc(fmtN.format(paid))}đ</span></div>
          ${remain > 0 ? `<div class="oqv-bill-row remain"><span>Còn lại</span><span>${esc(fmtN.format(remain))}đ</span></div>` : ''}
        </div>
      </div>
    </div>

    <div class="oqv-sec">Chi tiết từng dòng công việc</div>
    ${linesHtml}
    ${orderChargesSection}
  </div>
  <div class="modal-foot" style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
    <a class="btn ghost sm" href="${fullUrl}" target="_blank" rel="noopener">Mở đầy đủ ↗</a>
    <button type="button" class="btn sm" data-oqv-close>Đóng</button>
  </div>
</div>`;

    document.body.appendChild(bg);

    function onBgClick(e) {
      if (e.target === bg) close();
      if (e.target.closest('[data-oqv-close]')) close();
    }
    bg.addEventListener('click', onBgClick);
    document.addEventListener('keydown', onKeyDoc);
  }

  function bindDelegatedClicks() {
    document.addEventListener('click', function (e) {
      const el = e.target && e.target.closest ? e.target.closest('[data-order-quick]') : null;
      if (!el) return;
      const raw = el.getAttribute('data-order-quick');
      const id = Number(raw);
      if (!id) return;
      if (e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      if (typeof e.button === 'number' && e.button !== 0) return;
      e.preventDefault();
      open(id);
    }, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindDelegatedClicks);
  } else {
    bindDelegatedClicks();
  }

  global.orderQuickView = { open, close };
})(window);
