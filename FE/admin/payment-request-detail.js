// Trang chi tiet Phieu Yeu Cau Thanh Toan (YC-)
// URL: /admin/payment-request-detail.html?id=<request_id>

(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');
  const fmtVnd = (n) => fmt.format(Number(n) || 0) + 'đ';
  const escape = (s) => String(s == null ? '' : s)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${dt.getFullYear()}`;
  }
  function fmtDateTime(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const hh = String(dt.getHours()).padStart(2, '0');
    const mn = String(dt.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${dt.getFullYear()} ${hh}:${mn}`;
  }

  const STATUS_LABEL = {
    pending: 'Chờ duyệt', confirmed: 'Đã duyệt',
    in_progress: 'Đang làm', done: 'Hoàn tất', cancelled: 'Đã huỷ',
  };
  const PR_STATUS_LABEL = {
    pending: 'Chưa thu tiền', partially_paid: 'Trả một phần',
    paid: 'Đã thanh toán', cancelled: 'Đã huỷ', expired: 'Hết hạn',
    superseded: 'Đã thay thế',
  };

  const ACCOUNT_KEYS = ['account', 'username', 'login', 'user', 'tài khoản', 'tai khoan'];
  const PLATE_KEYS = ['plate', 'license', 'biển số', 'bien so', 'bks', 'biensố'];

  const state = {
    reqId: null,
    data: null,
    viewMode: 'full',
  };

  function getReqId() {
    const p = new URLSearchParams(location.search);
    return Number(p.get('id')) || null;
  }

  // ─── Chuyen doi data tu API sang format render ─────────────────────────────

  function buildRenderData(apiData) {
    const pendingOrders = [];
    let openingBalance = 0;
    const pendingRequests = [];

    for (const item of (apiData.items || [])) {
      if (item.target_type === 'order' && item.order) {
        pendingOrders.push({ ...item.order, remaining: item.amount });
      } else if (item.target_type === 'opening_balance') {
        openingBalance += Number(item.amount);
      } else if (item.target_type === 'payment_request') {
        pendingRequests.push({
          id: item.target_id, code: item.pr_code, remaining: Number(item.amount),
        });
      }
    }

    const orderDebt   = pendingOrders.reduce((s, o) => s + Number(o.remaining), 0);
    const requestDebt = pendingRequests.reduce((s, p) => s + Number(p.remaining), 0);

    return {
      customer:        apiData.customer,
      pending_orders:  pendingOrders,
      opening_balance: openingBalance,
      order_debt:      orderDebt,
      request_debt:    requestDebt,
      total_debt:      openingBalance + orderDebt + requestDebt,
      pending_requests: pendingRequests,
      qr:              apiData.qr   || {},
      bank:            apiData.bank || {},
      request:         apiData.request,
      receipts:        apiData.receipts || [],
    };
  }

  // ─── Helpers meta san pham ──────────────────────────────────────────────────

  function pickPreferredMeta(item, line, order) {
    // Uu tien item.field_values (per-item, migration_071+), fallback sang line/order
    const allFvs = item && item.field_values && item.field_values.length
      ? item.field_values
      : [
          ...(line && line.field_values || []),
          ...(order && order.field_values || []),
        ];
    let accountLabel = '', plateLabel = '';
    const fallbackPairs = [];
    for (const fv of allFvs) {
      if (!fv.value) continue;
      const key = (fv.label || '').toLowerCase();
      if (!accountLabel && ACCOUNT_KEYS.some(k => key.includes(k))) {
        accountLabel = fv.value;
      } else if (!plateLabel && PLATE_KEYS.some(k => key.includes(k))) {
        plateLabel = fv.value;
      } else {
        fallbackPairs.push({ label: fv.label, value: fv.value });
      }
    }
    return { accountLabel, plateLabel, fallbackPairs };
  }

  function renderItemMeta(item, line, order) {
    const { accountLabel, plateLabel, fallbackPairs } = pickPreferredMeta(item, line, order);
    const parts = [];
    if (accountLabel) parts.push(`TK: ${escape(accountLabel)}`);
    if (plateLabel) parts.push(`Biển số: ${escape(plateLabel)}`);
    if (!parts.length && fallbackPairs.length) {
      parts.push(`${escape(fallbackPairs[0].label)}: ${escape(fallbackPairs[0].value)}`);
    }
    if (!parts.length) return '';
    return ` <span style="font-size:11px;color:#64748b;font-weight:400">${parts.join(' · ')}</span>`;
  }

  // ─── Che do Chi tiet ────────────────────────────────────────────────────────

  function renderOrder(o) {
    const itemsHtml = (line) => {
      const itemRows = (line.items || []).map(it => {
        const total = Number(it.qty) * Number(it.unit_price);
        const meta = renderItemMeta(it, line, o);
        return `<tr>
          <td>${escape(it.product_name || '—')}${it.product_code ? ` <small style="color:#94a3b8">(${escape(it.product_code)})</small>` : ''}${meta}</td>
          <td style="text-align:center">${it.qty}</td>
          <td class="num">${fmtVnd(it.unit_price)}</td>
          <td class="num">${fmtVnd(total)}</td>
        </tr>`;
      });
      const chargeRows = (line.charges || []).filter(c => c.kind !== 'installation').map(c => `<tr>
        <td colspan="2" style="color:#64748b;font-style:italic">${escape(c.label || c.kind || '—')}</td>
        <td></td>
        <td class="num">${fmtVnd(c.amount)}</td>
      </tr>`);
      if (!itemRows.length && !chargeRows.length) return '';
      return `<table class="line-table">
        <thead><tr>
          <th>Sản phẩm</th>
          <th style="width:70px;text-align:center" class="num">SL</th>
          <th style="width:120px" class="num">Đơn giá</th>
          <th style="width:120px" class="num">Thành tiền</th>
        </tr></thead>
        <tbody>${itemRows.join('')}${chargeRows.join('')}</tbody>
      </table>`;
    };

    const linesHtml = (o.lines || []).map(line => `
      <div class="line-block">
        <div class="ln-title">▸ ${escape(line.template_name || 'Công việc')}</div>
        ${itemsHtml(line)}
        ${line.note ? `<div style="margin-top:6px;font-size:12.5px;color:#64748b"><b>Ghi chú:</b> ${escape(line.note)}</div>` : ''}
      </div>
    `).join('');

    const orderFieldsHtml = (o.field_values && o.field_values.length) ? `
      <div class="oc-meta oc-full-width">
        ${o.field_values.map(fv => `<span><b>${escape(fv.label)}:</b> ${escape(fv.value || '—')}</span>`).join('')}
      </div>` : '';

    const ktv = o.assigned_staff_name
      ? `<b>${escape(o.assigned_staff_name)}</b>`
      : '<i style="color:#94a3b8">Chưa gán</i>';

    return `<div class="order-card">
      <div class="oc-head">
        <div>
          <a class="oc-code" href="/admin/orders.html#order-${o.id}" target="_blank" data-order-quick="${o.id}">${escape(o.code)}</a>${ui.copyCodeBtn(o.code)}
          <span class="oc-status">(${escape(STATUS_LABEL[o.status] || o.status)})</span>
        </div>
      </div>
      <div class="oc-meta">
        <span><b>Ngày lập:</b> ${fmtDate(o.created_at)}</span>
        ${o.completed_at ? `<span><b>Hoàn thành:</b> ${fmtDate(o.completed_at)}</span>` : `<span></span>`}
        <span><b>Kỹ thuật viên:</b> ${ktv}</span>
        ${o.address ? `<span><b>Địa chỉ:</b> ${escape(o.address)}</span>` : '<span></span>'}
      </div>
      ${orderFieldsHtml}
      ${linesHtml || '<div class="empty" style="padding:14px">Đơn không có dòng công việc</div>'}
      <div class="order-totals">
        <div class="ot-item"><span>Tổng tiền đơn hàng:</span><span>${fmtVnd(o.total_amount)}</span></div>
        <div class="ot-item"><span>Đã thanh toán:</span><span>${fmtVnd(o.paid_amount)}</span></div>
        <div class="ot-item remain"><span>Khách còn nợ:</span><span>${fmtVnd(o.remaining)}</span></div>
      </div>
    </div>`;
  }

  // ─── Che do Tom tat ─────────────────────────────────────────────────────────

  function renderSummaryOrders(orders) {
    if (!orders.length) return '<div class="empty">Không có đơn hàng</div>';
    return orders.map(o => {
      const itemRows = [];
      for (const line of (o.lines || [])) {
        for (const it of (line.items || [])) {
          const meta = pickPreferredMeta(it, line, o);
          const metaParts = [];
          if (meta.accountLabel) metaParts.push(`TK: ${escape(meta.accountLabel)}`);
          if (meta.plateLabel) metaParts.push(`Biển số: ${escape(meta.plateLabel)}`);
          if (!metaParts.length && meta.fallbackPairs.length) {
            metaParts.push(`${escape(meta.fallbackPairs[0].label)}: ${escape(meta.fallbackPairs[0].value)}`);
          }
          const metaSpan = metaParts.length
            ? ` <span style="font-size:11px;color:#64748b;font-weight:400">${metaParts.join(' · ')}</span>` : '';
          const sub = Number(it.qty) * Number(it.unit_price);
          itemRows.push(`<tr>
            <td>${escape(it.product_name || '—')}${it.product_code ? ` <small style="color:#94a3b8">(${escape(it.product_code)})</small>` : ''}${metaSpan}</td>
            <td style="text-align:center;width:50px">${it.qty}</td>
            <td class="num" style="width:110px">${fmtVnd(it.unit_price)}</td>
            <td class="num" style="width:110px">${fmtVnd(sub)}</td>
          </tr>`);
        }
        for (const c of (line.charges || [])) {
          if (c.kind === 'installation') continue;
          if (Number(c.amount)) {
            itemRows.push(`<tr>
              <td colspan="3" style="color:#64748b;font-style:italic">${escape(c.label || c.kind)}</td>
              <td class="num">${fmtVnd(c.amount)}</td>
            </tr>`);
          }
        }
      }
      const tableHtml = itemRows.length
        ? `<table class="line-table" style="margin:8px 0">
            <thead><tr>
              <th>Sản phẩm</th>
              <th style="width:50px;text-align:center">SL</th>
              <th class="num" style="width:110px">Đơn giá</th>
              <th class="num" style="width:110px">Thành tiền</th>
            </tr></thead>
            <tbody>${itemRows.join('')}</tbody>
          </table>`
        : '<div style="font-size:13px;color:#94a3b8;padding:6px 0">Không có sản phẩm</div>';

      return `<div class="order-card">
        <div class="oc-head">
          <div>
            <a class="oc-code" href="/admin/orders.html#order-${o.id}" target="_blank">${escape(o.code)}</a>${ui.copyCodeBtn(o.code)}
            <span class="oc-status">(${escape(STATUS_LABEL[o.status] || o.status)}) — ${fmtDate(o.created_at)}</span>
          </div>
          <div style="font-size:14px;font-weight:700;color:#dc2626">Nợ: ${fmtVnd(o.remaining)}</div>
        </div>
        ${tableHtml}
        <div style="text-align:right;font-size:13px;border-top:1px dashed #e2e8f0;padding-top:6px">
          Tổng đơn: <b>${fmtVnd(o.total_amount)}</b>
          <span style="margin-left:16px;color:#64748b">Đã trả: ${fmtVnd(o.paid_amount)}</span>
        </div>
      </div>`;
    }).join('');
  }

  // ─── Che do Thong ke ─────────────────────────────────────────────────────────

  function renderStatsByTask(orders) {
    const groups = {};
    for (const o of orders) {
      for (const line of (o.lines || [])) {
        const key = line.template_id ? String(line.template_id) : (line.template_name || '__other__');
        const label = line.template_name || ('Nhóm ' + key);
        if (!groups[key]) groups[key] = { label, entries: [] };
        groups[key].entries.push({
          orderId: o.id, orderCode: o.code, status: o.status, createdAt: o.created_at,
          orderTotal: Number(o.total_amount), orderPaid: Number(o.paid_amount),
          orderRemain: Number(o.remaining), items: line.items || [],
          lineFieldValues: line.field_values || [], orderFieldValues: o.field_values || [],
        });
      }
    }
    const groupList = Object.values(groups);
    if (!groupList.length) return '<div class="empty">Không có dữ liệu thống kê</div>';

    const allUniqueRemain = new Map();
    for (const g of groupList) {
      for (const e of g.entries) {
        if (!allUniqueRemain.has(e.orderId)) allUniqueRemain.set(e.orderId, e.orderRemain);
      }
    }
    const grandDebt = Array.from(allUniqueRemain.values()).reduce((s, v) => s + v, 0);

    const groupsHtml = groupList.map(g => {
      const groupDebt = g.entries.reduce((s, e) => s + e.orderRemain, 0);

      const ordersHtml = g.entries.map(e => {
        const itemRows = e.items
          .map(it => {
            const total = Number(it.qty) * Number(it.unit_price);
            const meta = pickPreferredMeta(it, { field_values: e.lineFieldValues }, { field_values: e.orderFieldValues });
            const metaParts = [];
            if (meta.accountLabel) metaParts.push(`TK: ${escape(meta.accountLabel)}`);
            if (meta.plateLabel)   metaParts.push(`Biển số: ${escape(meta.plateLabel)}`);
            const metaSpan = metaParts.length
              ? ` <span style="font-size:11px;color:#94a3b8">${metaParts.join(' · ')}</span>` : '';
            return `<tr>
              <td>${escape(it.product_name || '—')}${it.product_code ? ` <small style="color:#94a3b8">(${escape(it.product_code)})</small>` : ''}${metaSpan}</td>
              <td style="text-align:center;width:44px">${it.qty}</td>
              <td class="num" style="width:110px">${fmtVnd(it.unit_price)}</td>
              <td class="num" style="width:110px">${fmtVnd(total)}</td>
            </tr>`;
          }).join('');

        const st = STATUS_LABEL[e.status] || e.status;
        return `<div style="margin-bottom:10px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0">
            <div style="display:flex;align-items:center;gap:8px">
              <a class="oc-code" href="/admin/orders.html#order-${e.orderId}" target="_blank" data-order-quick="${e.orderId}">${escape(e.orderCode)}</a>${ui.copyCodeBtn(e.orderCode)}
              <span style="font-size:12px;color:#64748b">(${escape(st)}) · ${fmtDate(e.createdAt)}</span>
            </div>
            <span style="font-size:13px;font-weight:700;color:#dc2626">Nợ: ${fmtVnd(e.orderRemain)}</span>
          </div>
          ${itemRows ? `<table class="line-table" style="border:none">
            <thead><tr>
              <th>Sản phẩm</th>
              <th style="width:44px;text-align:center">SL</th>
              <th class="num" style="width:110px">Đơn giá</th>
              <th class="num" style="width:110px">Thành tiền</th>
            </tr></thead>
            <tbody>${itemRows}</tbody>
          </table>` : '<div style="padding:10px 12px;font-size:13px;color:#94a3b8">Không có sản phẩm</div>'}
        </div>`;
      }).join('');

      return `<div style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-size:14px;font-weight:700;color:#334155">▸ ${escape(g.label)}</div>
          <div style="font-size:13px;color:#dc2626;font-weight:600">${g.entries.length} đơn · ${fmtVnd(groupDebt)}</div>
        </div>
        ${ordersHtml}
      </div>`;
    }).join('');

    return `<div style="font-size:13px;color:#475569;margin-bottom:14px">${orders.length} đơn · Tổng nợ: <b style="color:#dc2626">${fmtVnd(grandDebt)}</b></div>
    ${groupsHtml}`;
  }

  // ─── Dispatch theo mode ──────────────────────────────────────────────────────

  function renderByMode(d) {
    const section = $('ordersSection');
    if (!section) return;
    const orders = d.pending_orders || [];
    if (state.viewMode === 'summary') {
      section.innerHTML = renderSummaryOrders(orders);
    } else if (state.viewMode === 'stats') {
      section.innerHTML = renderStatsByTask(orders);
    } else {
      section.innerHTML = orders.length
        ? orders.map(renderOrder).join('')
        : '<div class="empty">Không có đơn hàng trong phiếu này</div>';
    }
  }

  function bindViewTabs() {
    ['full', 'summary', 'stats'].forEach(mode => {
      const btn = $(`btnView_${mode}`);
      if (!btn) return;
      btn.onclick = () => {
        state.viewMode = mode;
        document.querySelectorAll('.view-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (state.data) renderByMode(state.data);
      };
    });
  }

  // ─── Bank block ──────────────────────────────────────────────────────────────

  function renderBankBlock(qr, bank) {
    if (!bank.account_no && !qr.url) {
      return '<div class="empty">Chưa cấu hình thông tin chuyển khoản</div>';
    }
    const qrHtml = qr.url
      ? `<div class="bk-qr"><img src="${escape(qr.url)}" alt="QR"><div class="qr-label">${escape(qr.label)}</div></div>`
      : '<div class="bk-qr"><div class="empty" style="padding:30px 10px">Chưa có QR</div></div>';
    return `<div class="bank-block">
      <div class="bk-info">
        <div class="row"><span>Ngân hàng:</span><b>${escape(bank.bank_name) || '<i style="color:#94a3b8">Chưa cấu hình</i>'}</b></div>
        <div class="row"><span>Số tài khoản:</span><b>${escape(bank.account_no) || '<i style="color:#94a3b8">Chưa cấu hình</i>'}</b></div>
        <div class="row"><span>Chủ tài khoản:</span><b>${escape(bank.account_name) || '<i style="color:#94a3b8">Chưa cấu hình</i>'}</b></div>
        <div style="margin-top:16px;color:#475569;font-size:13px;font-style:italic">Khi chuyển khoản vui lòng ghi rõ mã KH hoặc SĐT để tiện đối soát.</div>
      </div>
      ${qrHtml}
    </div>`;
  }

  // ─── Render lich su thanh toan ────────────────────────────────────────────────

  function renderReceipts(receipts, request) {
    const METHOD_LABEL = { cash: 'Tiền mặt', transfer: 'Chuyển khoản', mixed: 'Hỗn hợp' };
    if (!receipts.length) {
      return '<div class="empty">Chưa có lần thu tiền nào</div>';
    }
    let cumulativePaid = 0;
    const rows = receipts.map(r => {
      cumulativePaid += Number(r.amount);
      const stillOwed = Math.max(0, Number(request.total_amount) - cumulativePaid);
      return `<tr>
        <td><a class="receipt-link" href="/admin/payment-receipt.html?id=${r.id}" target="_blank">${escape(r.code)}</a></td>
        <td>${fmtDateTime(r.created_at)}</td>
        <td>${escape(METHOD_LABEL[r.pay_method] || r.pay_method)}</td>
        <td class="num" style="color:#166534;font-weight:600">${fmtVnd(r.amount)}</td>
        <td class="num" style="color:#dc2626">${fmtVnd(stillOwed)}</td>
        <td style="color:#64748b;font-size:12px">${escape(r.note || '—')}</td>
      </tr>`;
    }).join('');

    return `<table class="receipts-table">
      <thead><tr>
        <th>Mã hóa đơn</th>
        <th>Thời gian</th>
        <th>Hình thức</th>
        <th class="num" style="width:130px">Số tiền thu</th>
        <th class="num" style="width:120px">Còn lại</th>
        <th>Ghi chú</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  // ─── Render toan trang ────────────────────────────────────────────────────────

  function render(d, co) {
    co = co || { name: 'CÔNG TY TNHH VIỄN THÔNG VINAGPS', address: '190 TTH 21, P. Tân Thới Hiệp, Q.12, TP.HCM', phone: '(028) 6682 5658 — DĐ: 0949.155.160', tax: '' };
    const req  = d.request;
    const cust = d.customer || {};

    const statusClass = `status-${req.status}`;
    const statusText  = PR_STATUS_LABEL[req.status] || req.status;

    const requestsHtml = (d.pending_requests && d.pending_requests.length) ? `
      <div style="margin-top:20px">
        <h4 style="font-size:13px;color:#475569;margin-bottom:8px;text-transform:uppercase">Nợ từ phiếu cũ gộp vào</h4>
        <table class="line-table">
          <thead><tr><th>Mã phiếu</th><th class="num">Số tiền</th></tr></thead>
          <tbody>${d.pending_requests.map(pr => `
            <tr>
              <td><b style="color:#2563eb">${escape(pr.code)}</b></td>
              <td class="num" style="color:#dc2626">${fmtVnd(pr.remaining)}</td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>` : '';

    $('quotePaper').innerHTML = `
      <div class="quote-header">
        <div class="quote-brand">
          <img class="logo-img" src="/uploads/LOGO TRANG.jpg" alt="logo">
          <div>
            <div class="brand-name">${escape(co.name)}</div>
            <div class="brand-sub">${co.address ? escape(co.address) + '<br>' : ''}${co.phone ? 'ĐT: ' + escape(co.phone) : ''}${co.tax ? ' — MST: ' + escape(co.tax) : ''}</div>
          </div>
        </div>
        <div class="quote-meta">
          <div style="font-weight:700;font-size:18px;color:#0f172a">${escape(req.code)}</div>
          <div style="margin-top:4px">Ngày lập: <b>${fmtDate(req.created_at)}</b></div>
          ${req.created_by_name ? `<div style="font-size:12px;color:#64748b;margin-top:2px">Người lập: ${escape(req.created_by_name)}</div>` : ''}
        </div>
      </div>

      <div class="doc-title">
        <h1>PHIẾU YÊU CẦU THANH TOÁN</h1>
        <p>Bảng kê chi tiết công nợ tính đến ngày ${fmtDate(req.created_at)}</p>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>

      <div class="quote-section">
        <h3>1. Thông tin khách hàng</h3>
        <div class="cust-info">
          <div><b>Họ tên:</b> ${escape(cust.company_name || cust.full_name || '—')}</div>
          <div><b>Mã KH:</b> ${escape(cust.code || '—')}</div>
          <div><b>Điện thoại:</b> ${escape(cust.phone || '—')}</div>
          <div><b>Địa chỉ:</b> ${escape(cust.address || '—')}</div>
          ${cust.tax_code ? `<div><b>Mã số thuế:</b> ${escape(cust.tax_code)}</div>` : ''}
        </div>
      </div>

      <div class="quote-section">
        <h3>2. Chi tiết công nợ</h3>
        ${d.opening_balance > 0 ? `
          <div style="margin-bottom:12px;padding:10px 16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;font-size:14px">
            <b>Nợ gối đầu (kỳ trước):</b>
            <span style="font-weight:700;color:#dc2626;margin-left:8px">${fmtVnd(d.opening_balance)}</span>
          </div>` : ''}
        <div id="ordersSection"></div>
        ${requestsHtml}
      </div>

      <div class="quote-section">
        <h3>3. Tổng hợp thanh toán</h3>
        <div class="summary-box">
          ${d.opening_balance > 0 ? `<div class="row"><span>Nợ kỳ trước (Gối đầu):</span><span>${fmtVnd(d.opening_balance)}</span></div>` : ''}
          ${d.order_debt > 0 ? `<div class="row"><span>Nợ đơn hàng:</span><span>${fmtVnd(d.order_debt)}</span></div>` : ''}
          ${d.request_debt > 0 ? `<div class="row"><span>Nợ phiếu cũ (rolling):</span><span>${fmtVnd(d.request_debt)}</span></div>` : ''}
          <div class="row total"><span>TỔNG CỘNG PHẢI THU:</span><span>${fmtVnd(req.total_amount)}</span></div>
          ${req.paid_amount > 0 ? `<div class="row paid-row"><span>Đã thu:</span><span>— ${fmtVnd(req.paid_amount)}</span></div>` : ''}
          ${req.remaining > 0 ? `<div class="row remain-row"><span>Còn lại cần thu:</span><span>${fmtVnd(req.remaining)}</span></div>` : ''}
          ${req.status === 'paid' ? `<div class="row" style="color:#166534;font-style:italic"><span>✅ Đã thanh toán đầy đủ</span><span></span></div>` : ''}
        </div>
      </div>

      <div class="quote-section">
        <h3>4. Lịch sử thu tiền</h3>
        <div id="receiptsSection">${renderReceipts(d.receipts, req)}</div>
      </div>

      <div class="quote-section">
        <h3>5. Thông tin chuyển khoản</h3>
        ${renderBankBlock(d.qr, d.bank)}
      </div>

      <div class="signatures">
        <div class="sig-box">
          <h4>Khách hàng</h4>
          <p>(Ký và ghi rõ họ tên)</p>
          <div class="sig-space"></div>
        </div>
        <div class="sig-box">
          <h4>Người lập phiếu</h4>
          <p>(Ký và ghi rõ họ tên)</p>
          <div class="sig-space"></div>
        </div>
      </div>

      <div style="margin-top:24px;text-align:center;font-size:12px;color:#64748b">
        <i>Phiếu được xuất tự động từ hệ thống GPS Việt — Vui lòng đối chiếu kỹ trước khi thanh toán.</i>
      </div>
    `;

    renderByMode(d);

    // Nut hanh dong
    const isAdmin   = window.auth && auth.isAdmin && auth.isAdmin();
    const isOpenReq = req.status === 'pending' || req.status === 'partially_paid';
    const canPay    = isAdmin && isOpenReq;
    const canCancel = isAdmin && isOpenReq && Number(req.paid_amount) === 0;
    const canNewReq = req.status === 'partially_paid' && req.remaining > 0;
    const canStaffReceive = !isAdmin && isOpenReq;
    $('btnPay').style.display           = canPay          ? '' : 'none';
    $('btnCancelRequest').style.display = canCancel        ? '' : 'none';
    $('btnNewRequest').style.display    = canNewReq        ? '' : 'none';
    $('btnStaffReceive').style.display  = canStaffReceive  ? '' : 'none';
    $('btnDownload').disabled           = false;
    $('btnDownloadPdf').disabled        = false;

    // Pre-fill pay modal
    if (canPay) {
      $('pmTotalAmount').textContent = fmtVnd(req.total_amount);
      $('pmPaidAmount').textContent  = fmtVnd(req.paid_amount);
      $('pmRemaining').textContent   = fmtVnd(req.remaining);
      $('pmAmount').value = fmt.format(req.remaining);
    }
  }

  // ─── Load du lieu ─────────────────────────────────────────────────────────────

  async function load() {
    state.reqId = getReqId();
    if (!state.reqId) {
      $('quotePaper').innerHTML = '<div class="empty">Thiếu tham số ?id=...</div>';
      return;
    }

    $('quotePaper').innerHTML = '<div class="empty">Đang tải...</div>';
    $('btnPay').style.display           = 'none';
    $('btnCancelRequest').style.display = 'none';
    $('btnDownload').disabled           = true;
    $('btnDownloadPdf').disabled        = true;

    const [apiData, rawSettings] = await Promise.all([
      api.get(`/admin/payment-requests/${state.reqId}`).catch(() => null),
      api.get('/admin/settings').catch(() => ({})),
    ]);
    if (!apiData) {
      $('quotePaper').innerHTML = '<div class="empty">Không tải được dữ liệu</div>';
      return;
    }

    const s = rawSettings || {};
    const co = {
      name:    s['company.name']     || 'CÔNG TY TNHH VIỄN THÔNG VINAGPS',
      address: s['company.address']  || '190 TTH 21, P. Tân Thới Hiệp, Q.12, TP.HCM',
      phone:   s['company.phone']    || '(028) 6682 5658 — DĐ: 0949.155.160',
      tax:     s['company.tax_code'] || '',
    };

    const d = buildRenderData(apiData);
    state.data = d;
    render(d, co);
  }

  // ─── Modal nhan vien nhan tien ───────────────────────────────────────────────

  let srImageUrl = null;

  function resetSrImageUpload() {
    srImageUrl = null;
    $('srImageInput').value = '';
    $('srImagePreview').style.display = 'none';
    $('srImageThumb').src = '';
    $('srImageStatus').textContent = '';
    $('srImageIcon').textContent = '📎';
    $('srImageText').textContent = 'Chọn ảnh hoặc chụp';
    $('srImageLabel').style.borderColor = '#cbd5e1';
  }

  function openStaffReceiveModal() {
    if (!state.data) return;
    const req = state.data.request;
    $('srTotalAmount').textContent = fmtVnd(req.total_amount);
    $('srPaidAmount').textContent  = fmtVnd(req.paid_amount);
    $('srRemaining').textContent   = fmtVnd(req.remaining);
    $('srAmount').value = fmt.format(req.remaining);
    $('srNote').value = '';
    document.querySelector('input[name="srMethod"][value="cash"]').checked = true;
    resetSrImageUpload();
    $('srModal').classList.add('open');
  }

  async function submitStaffReceive() {
    const raw = Number($('srAmount').value.replace(/\D/g, ''));
    if (!raw || raw <= 0) { ui.toast('Nhập số tiền hợp lệ', 'error'); return; }

    if ($('srImageStatus').textContent.includes('đang tải')) {
      ui.toast('Ảnh đang tải lên, vui lòng chờ', 'error'); return;
    }

    const payMethod = document.querySelector('input[name="srMethod"]:checked')?.value || 'cash';
    const note = $('srNote').value.trim() || null;

    try {
      ui.loading(true);
      $('srSubmit').disabled = true;
      const body = { request_id: state.reqId, amount: raw, pay_method: payMethod };
      if (note) body.note = note;
      if (srImageUrl) body.proof_urls = [srImageUrl];

      const res = await api.post('/admin/staff-receipts', body);
      if (!res) return;

      $('srModal').classList.remove('open');
      ui.toast(`Đã ghi nhận nhận tiền — ${res.code}`, 'success');
      await load();
    } finally {
      ui.loading(false);
      $('srSubmit').disabled = false;
    }
  }

  // ─── Modal thanh toan ─────────────────────────────────────────────────────────

  let pmImageUrl = null;

  function resetImageUpload() {
    pmImageUrl = null;
    $('pmImageInput').value = '';
    $('pmImageThumb').src = '';
    $('pmImagePreview').style.display = 'none';
    $('pmImageText').textContent = 'Chọn ảnh hoặc chụp';
    $('pmImageIcon').textContent = '📎';
    $('pmImageStatus').textContent = '';
    $('pmImageLabel').style.borderColor = '#cbd5e1';
  }

  function openPayModal() {
    if (!state.data) return;
    $('pmTotalAmount').textContent = fmtVnd(state.data.request.total_amount);
    $('pmPaidAmount').textContent  = fmtVnd(state.data.request.paid_amount);
    $('pmRemaining').textContent   = fmtVnd(state.data.request.remaining);
    $('pmAmount').value = fmt.format(state.data.request.remaining);
    $('pmNote').value = '';
    resetImageUpload();
    $('payModal').classList.add('open');
  }

  async function submitPay() {
    const raw = Number($('pmAmount').value.replace(/\D/g, ''));
    if (!raw || raw <= 0) {
      ui.toast('Nhập số tiền thu hợp lệ', 'error');
      return;
    }

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mn = String(now.getMinutes()).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const autoNote = `Ghi nhận thu ${fmtVnd(raw)} lúc ${hh}:${mn} ngày ${dd}/${mm}/${now.getFullYear()}`;
    const note = $('pmNote').value.trim() || autoNote;

    if ($('pmImageStatus').textContent.includes('đang tải')) {
      ui.toast('Ảnh đang tải lên, vui lòng chờ', 'error');
      return;
    }

    try {
      ui.loading(true);
      $('pmSubmit').disabled = true;
      const body = { amount_paid: raw, pay_method: 'cash', note };
      if (pmImageUrl) body.receipt_url = pmImageUrl;
      const res = await api.post(`/admin/payment-requests/${state.reqId}/pay`, body);
      if (!res) return;

      $('payModal').classList.remove('open');

      $('rmReceiptCode').textContent = res.receipt_code;
      $('rmAmountText').textContent  = `Thu ${fmtVnd(raw)} · Còn lại: ${fmtVnd(res.remaining)}`;
      $('rmPrintLink').href = `/admin/payment-receipt.html?id=${res.receipt_id}`;
      $('resultModal').classList.add('open');

      await load();
    } finally {
      ui.loading(false);
      $('pmSubmit').disabled = false;
    }
  }

  // ─── Cancel phieu ─────────────────────────────────────────────────────────────

  async function cancelRequest() {
    if (!confirm('Huỷ phiếu yêu cầu thanh toán này? Hành động không thể hoàn tác.')) return;
    try {
      ui.loading(true);
      const res = await api.post(`/admin/payment-requests/${state.reqId}/cancel`, {});
      if (!res) return;
      ui.toast('Đã huỷ phiếu', 'success');
      await load();
    } finally {
      ui.loading(false);
    }
  }

  // ─── Khoi dong ───────────────────────────────────────────────────────────────

  bindViewTabs();

  $('btnStaffReceive').onclick   = openStaffReceiveModal;
  $('srClose').onclick           = () => $('srModal').classList.remove('open');
  $('srCancel').onclick          = () => $('srModal').classList.remove('open');
  $('srSubmit').onclick          = submitStaffReceive;
  $('srFillFull').onclick        = () => {
    if (state.data) $('srAmount').value = fmt.format(state.data.request.remaining);
  };
  $('srAmount').addEventListener('input', function () {
    const digits = this.value.replace(/\D/g, '');
    const num = Number(digits);
    const pos = this.selectionStart;
    const oldLen = this.value.length;
    this.value = num ? fmt.format(num) : '';
    const diff = this.value.length - oldLen;
    try { this.setSelectionRange(pos + diff, pos + diff); } catch (_) {}
  });
  $('srImageInput').addEventListener('change', async function () {
    const file = this.files[0];
    if (!file) return;
    srImageUrl = null;
    $('srImageStatus').textContent = 'Đang tải ảnh lên...';
    $('srImageStatus').style.color = '#64748b';
    $('srImageIcon').textContent = '⏳';
    $('srImageText').textContent = file.name;
    $('srImageLabel').style.borderColor = '#94a3b8';
    const localUrl = URL.createObjectURL(file);
    $('srImageThumb').src = localUrl;
    $('srImagePreview').style.display = '';
    try {
      srImageUrl = await imgbb.upload(file, { name: 'sr-receipt' });
      $('srImageStatus').textContent = 'Tải lên thành công';
      $('srImageStatus').style.color = '#166534';
      $('srImageIcon').textContent = '✅';
      $('srImageLabel').style.borderColor = '#86efac';
    } catch (err) {
      srImageUrl = null;
      $('srImageStatus').textContent = 'Lỗi tải ảnh: ' + err.message;
      $('srImageStatus').style.color = '#dc2626';
    }
  });
  $('srImageRemove').onclick = resetSrImageUpload;

  $('btnPay').onclick            = openPayModal;
  $('pmClose').onclick           = () => $('payModal').classList.remove('open');
  $('pmCancel').onclick          = () => $('payModal').classList.remove('open');
  $('pmSubmit').onclick          = submitPay;
  $('pmFillFull').onclick        = () => {
    if (state.data) $('pmAmount').value = fmt.format(state.data.request.remaining);
  };

  // Format so tien khi nhap: 1000000 -> 1.000.000
  $('pmAmount').addEventListener('input', function () {
    const digits = this.value.replace(/\D/g, '');
    const num = Number(digits);
    const pos = this.selectionStart;
    const oldLen = this.value.length;
    this.value = num ? fmt.format(num) : '';
    // Giu vi tri con tro tuong doi
    const diff = this.value.length - oldLen;
    try { this.setSelectionRange(pos + diff, pos + diff); } catch (_) {}
  });

  // Upload anh chung tu len imgbb
  $('pmImageInput').addEventListener('change', async function () {
    const file = this.files[0];
    if (!file) return;
    pmImageUrl = null;
    $('pmImageStatus').textContent = 'Đang tải ảnh lên...';
    $('pmImageStatus').style.color = '#64748b';
    $('pmImageIcon').textContent = '⏳';
    $('pmImageText').textContent = file.name;
    $('pmImageLabel').style.borderColor = '#94a3b8';

    // Hien preview ngay
    const localUrl = URL.createObjectURL(file);
    $('pmImageThumb').src = localUrl;
    $('pmImagePreview').style.display = '';

    try {
      pmImageUrl = await imgbb.upload(file, { name: 'receipt' });
      $('pmImageStatus').textContent = 'Tải lên thành công';
      $('pmImageStatus').style.color = '#166534';
      $('pmImageIcon').textContent = '✅';
      $('pmImageLabel').style.borderColor = '#86efac';
    } catch (err) {
      pmImageUrl = null;
      $('pmImageStatus').textContent = 'Lỗi tải ảnh: ' + err.message;
      $('pmImageStatus').style.color = '#dc2626';
      $('pmImageIcon').textContent = '❌';
      $('pmImagePreview').style.display = 'none';
      $('pmImageLabel').style.borderColor = '#fca5a5';
    } finally {
      URL.revokeObjectURL(localUrl);
    }
  });

  $('pmImageRemove').addEventListener('click', resetImageUpload);
  $('rmClose').onclick           = () => $('resultModal').classList.remove('open');
  $('rmClose2').onclick          = () => $('resultModal').classList.remove('open');
  $('btnCancelRequest').onclick  = cancelRequest;
  $('btnReload').onclick         = load;
  $('btnNewRequest').onclick     = () => {
    if (!state.data) return;
    const cid = state.data.customer && state.data.customer.id;
    if (cid) window.open(`/admin/debt-settle-form.html?cid=${cid}`, '_blank', 'noopener');
  };

  $('btnCopy').onclick = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      $('copyOk').style.display = '';
      setTimeout(() => $('copyOk').style.display = 'none', 1500);
    } catch {
      ui.toast('Không copy được link', 'error');
    }
  };

  $('btnDownload').onclick = async () => {
    if (typeof html2canvas !== 'function') return ui.toast('Thư viện chưa tải xong', 'error');
    try {
      ui.loading(true);
      const canvas = await html2canvas($('quotePaper'), { backgroundColor: '#ffffff', scale: 2, useCORS: true });
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const code = state.data && state.data.request && state.data.request.code
        ? state.data.request.code.replace(/-/g, '') : 'yc';
      a.href = url; a.download = `phieu-yeu-cau-${code}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      ui.toast('Lỗi tạo ảnh: ' + err.message, 'error');
    } finally {
      ui.loading(false);
    }
  };

  $('btnDownloadPdf').onclick = async () => {
    if (typeof html2canvas !== 'function' || typeof window.jspdf === 'undefined') {
      return ui.toast('Thư viện chưa tải xong', 'error');
    }
    try {
      ui.loading(true);
      const canvas = await html2canvas($('quotePaper'), { backgroundColor: '#ffffff', scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdfW = 210;
      const pdfH = Math.round((canvas.height / canvas.width) * pdfW);
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      let yOffset = 0;
      while (yOffset < pdfH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfW, pdfH);
        yOffset += 297;
      }
      const code = state.data && state.data.request && state.data.request.code
        ? state.data.request.code.replace(/-/g, '') : 'yc';
      pdf.save(`phieu-yeu-cau-${code}.pdf`);
    } catch (err) {
      ui.toast('Lỗi tạo PDF: ' + err.message, 'error');
    } finally {
      ui.loading(false);
    }
  };

  load();
})();
