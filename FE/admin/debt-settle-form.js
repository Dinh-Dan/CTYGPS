// Trang tao phieu yeu cau thanh toan
// URL: /admin/debt-settle-form.html?cid=<customer_id>

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
  const STATUS_LABEL = {
    pending: 'Chờ duyệt', confirmed: 'Đã duyệt',
    in_progress: 'Đang làm', done: 'Hoàn tất', cancelled: 'Đã huỷ',
  };

  // Từ khoá nhận diện trường tài khoản và biển số
  const ACCOUNT_KEYS = ['account', 'username', 'login', 'user', 'tài khoản', 'tai khoan'];
  const PLATE_KEYS = ['plate', 'license', 'biển số', 'bien so', 'bks', 'biensố'];

  const state = {
    cid: null,
    data: null,
    selectedQrSlot: 1,
    receiptUrl: '',
    viewMode: 'full',
  };

  function getCid() {
    const p = new URLSearchParams(location.search);
    return Number(p.get('cid')) || null;
  }

  // ─── Helpers meta sản phẩm ──────────────────────────────────────────────────

  function pickPreferredMeta(item, line, order) {
    const allFvs = [
      ...(line && line.field_values || []),
      ...(order && order.field_values || []),
    ];
    let accountLabel = '';
    let plateLabel = '';
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

  // ─── Chế độ Chi tiết (Full) ─────────────────────────────────────────────────

  function renderOrder(o) {
    const itemsHtml = (line) => {
      if (!line.items || !line.items.length) return '';
      return `<table class="line-table">
        <thead><tr>
          <th>Sản phẩm</th>
          <th style="width:70px;text-align:center" class="num">SL</th>
          <th style="width:120px" class="num">Đơn giá</th>
          <th style="width:120px" class="num">Thành tiền</th>
        </tr></thead>
        <tbody>${line.items.map(it => {
          const total = Number(it.qty) * Number(it.unit_price);
          const meta = renderItemMeta(it, line, o);
          return `<tr>
            <td>
              ${escape(it.product_name || '—')}${it.product_code ? ` <small style="color:#94a3b8">(${escape(it.product_code)})</small>` : ''}${meta}
            </td>
            <td style="text-align:center">${it.qty}</td>
            <td class="num">${fmtVnd(it.unit_price)}</td>
            <td class="num">${fmtVnd(total)}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>`;
    };

    const fieldsHtml = (line) => {
      if (!line.field_values || !line.field_values.length) return '';
      return `<div class="ln-fields">${line.field_values.map(fv =>
        `<span class="lf-item"><b>${escape(fv.label)}:</b> ${escape(fv.value || '—')}</span>`
      ).join('')}</div>`;
    };

    const lineChargesHtml = (line) => {
      if (!line.charges || !line.charges.length) return '';
      return `<table class="line-table" style="margin-top:6px">
        <thead><tr><th>Chi phí khác (dòng)</th><th style="width:120px" class="num">Số tiền</th></tr></thead>
        <tbody>${line.charges.map(c => `<tr>
          <td>${escape(c.label || c.kind || '—')}</td>
          <td class="num">${fmtVnd(c.amount)}</td>
        </tr>`).join('')}</tbody>
      </table>`;
    };

    const linesHtml = (o.lines || []).map(line => `
      <div class="line-block">
        <div class="ln-title">▸ ${escape(line.template_name || 'Công việc')}</div>
        ${itemsHtml(line)}
        ${lineChargesHtml(line)}
        ${line.note ? `<div style="margin-top:6px;font-size:12.5px;color:#64748b"><b>Ghi chú:</b> ${escape(line.note)}</div>` : ''}
        <div style="text-align:right;margin-top:6px;font-size:13px"><b>Cộng dòng:</b> ${fmtVnd(line.subtotal)}</div>
      </div>
    `).join('');

    const orderChargesHtml = (o.order_charges && o.order_charges.length) ? `
      <table class="line-table" style="margin-top:8px">
        <thead><tr><th>Chi phí cấp đơn</th><th style="width:120px" class="num">Số tiền</th></tr></thead>
        <tbody>${o.order_charges.map(c => `<tr>
          <td>${escape(c.label || c.kind || '—')}</td>
          <td class="num">${fmtVnd(c.amount)}</td>
        </tr>`).join('')}</tbody>
      </table>` : '';

    const ktv = o.assigned_staff_name
      ? `<b>${escape(o.assigned_staff_name)}</b>${o.assigned_staff_phone ? ` · ${escape(o.assigned_staff_phone)}` : ''}`
      : '<i style="color:#94a3b8">Chưa gán</i>';

    const orderFieldsHtml = (o.field_values && o.field_values.length) ? `
      <div class="oc-meta oc-full-width">
        ${o.field_values.map(fv => `<span><b>${escape(fv.label)}:</b> ${escape(fv.value || '—')}</span>`).join('')}
      </div>` : '';

    return `<div class="order-card">
      <div class="oc-head">
        <div>
          <a class="oc-code" href="/admin/orders.html#order-${o.id}" target="_blank" data-order-quick="${o.id}">${escape(o.code)}</a>${ui.copyCodeBtn(o.code)}
          <span class="oc-status">(${escape(STATUS_LABEL[o.status] || o.status)})</span>
        </div>
      </div>
      <div class="oc-meta">
        <span><b>Ngày lập:</b> ${fmtDate(o.created_at)}</span>
        ${o.completed_at ? `<span><b>Hoàn thành:</b> ${fmtDate(o.completed_at)}</span>` : o.confirmed_at ? `<span><b>Duyệt lúc:</b> ${fmtDate(o.confirmed_at)}</span>` : '<span></span>'}
        <span><b>Kỹ thuật viên:</b> ${ktv}</span>
        ${o.address ? `<span><b>Địa chỉ thi công:</b> ${escape(o.address)}</span>` : '<span></span>'}
      </div>
      ${o.note ? `<div class="oc-meta oc-full-width"><span><b>Ghi chú đơn:</b> ${escape(o.note)}</span></div>` : ''}
      ${orderFieldsHtml}
      ${linesHtml || '<div class="empty" style="padding:14px">Đơn không có dòng công việc</div>'}
      ${orderChargesHtml}
      <div class="order-totals">
        <div class="ot-item"><span>Tổng tiền đơn hàng:</span><span>${fmtVnd(o.total_amount)}</span></div>
        <div class="ot-item"><span>Đã thanh toán:</span><span>${fmtVnd(o.paid_amount)}</span></div>
        <div class="ot-item remain"><span>Khách còn nợ:</span><span>${fmtVnd(o.remaining)}</span></div>
      </div>
    </div>`;
  }

  // ─── Chế độ Tóm tắt (Summary) ───────────────────────────────────────────────

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
          if (Number(c.amount)) {
            itemRows.push(`<tr>
              <td colspan="3" style="color:#64748b;font-style:italic">${escape(c.label || c.kind)}</td>
              <td class="num">${fmtVnd(c.amount)}</td>
            </tr>`);
          }
        }
      }
      for (const c of (o.order_charges || [])) {
        if (Number(c.amount)) {
          itemRows.push(`<tr>
            <td colspan="3" style="color:#64748b;font-style:italic">${escape(c.label || c.kind)}</td>
            <td class="num">${fmtVnd(c.amount)}</td>
          </tr>`);
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

  // ─── Chế độ Thống kê (Stats by task/template) ───────────────────────────────

  function renderStatsByTask(orders) {
    // Gom line theo template, lưu cả chi tiết từng đơn + sản phẩm
    const groups = {};
    for (const o of orders) {
      for (const line of (o.lines || [])) {
        const key = line.template_id ? String(line.template_id) : (line.template_name || '__other__');
        const label = line.template_name || ('Nhóm ' + key);
        if (!groups[key]) groups[key] = { label, entries: [] };
        groups[key].entries.push({
          orderId:          o.id,
          orderCode:        o.code,
          status:           o.status,
          createdAt:        o.created_at,
          lineSubtotal:     Number(line.subtotal) || 0,
          orderTotal:       Number(o.total_amount) || 0,
          orderPaid:        Number(o.paid_amount)  || 0,
          orderRemain:      Number(o.remaining)    || 0,
          items:            line.items || [],
          lineFieldValues:  line.field_values || [],
          orderFieldValues: o.field_values || [],
        });
      }
    }
    const groupList = Object.values(groups);
    if (!groupList.length) return '<div class="empty">Không có dữ liệu thống kê (đơn chưa có dòng công việc)</div>';

    const dateRange = `<div style="font-size:13px;color:#475569;margin-bottom:12px">Tất cả thời gian &nbsp;·&nbsp; ${orders.length} đơn hàng</div>`;

    // Bảng tổng hợp — tổng mỗi nhóm = sum còn nợ của các đơn duy nhất trong nhóm
    const summaryRows = groupList.map(g => {
      const uniqueMap = new Map();
      for (const e of g.entries) {
        if (!uniqueMap.has(e.orderId)) uniqueMap.set(e.orderId, e.orderRemain);
      }
      const groupDebt = Array.from(uniqueMap.values()).reduce((s, v) => s + v, 0);
      return `<tr>
        <td><b>${escape(g.label)}</b></td>
        <td class="num">${uniqueMap.size}</td>
        <td class="num">${g.entries.length}</td>
        <td class="num" style="color:#dc2626;font-weight:600">${fmtVnd(groupDebt)}</td>
      </tr>`;
    }).join('');

    // Grand total = sum còn nợ của tất cả đơn DISTINCT (tránh đếm 2 lần đơn có nhiều loại task)
    const allUniqueRemain = new Map();
    for (const g of groupList) {
      for (const e of g.entries) {
        if (!allUniqueRemain.has(e.orderId)) allUniqueRemain.set(e.orderId, e.orderRemain);
      }
    }
    const grandDebt = Array.from(allUniqueRemain.values()).reduce((s, v) => s + v, 0);

    const summaryTable = `<table class="line-table" style="margin-bottom:24px">
      <thead><tr>
        <th>Nhóm nhiệm vụ</th>
        <th class="num" style="width:80px">Số đơn</th>
        <th class="num" style="width:80px">Số dòng</th>
        <th class="num" style="width:150px">Còn nợ (nhóm)</th>
      </tr></thead>
      <tbody>${summaryRows}</tbody>
      <tfoot><tr style="font-weight:700;background:#f1f5f9">
        <td>Tổng (${allUniqueRemain.size} đơn distinct)</td>
        <td class="num">${allUniqueRemain.size}</td>
        <td class="num">${groupList.reduce((s, g) => s + g.entries.length, 0)}</td>
        <td class="num" style="color:#dc2626">${fmtVnd(grandDebt)}</td>
      </tr></tfoot>
    </table>`;

    // Chi tiết từng nhóm — bảng lồng: nhóm → đơn → sản phẩm
    const detailSections = groupList.map(g => {
      const uniqueDebtMap = new Map();
      for (const e of g.entries) {
        if (!uniqueDebtMap.has(e.orderId)) uniqueDebtMap.set(e.orderId, e.orderRemain);
      }
      const groupDebt = Array.from(uniqueDebtMap.values()).reduce((s, v) => s + v, 0);

      const bodyRows = g.entries.map(e => {
        // Hàng đơn hàng
        const orderRow = `<tr style="background:#f1f5f9;font-size:13px">
          <td style="font-weight:700">
            <a class="oc-code" style="font-size:13px" href="/admin/orders.html#order-${e.orderId}" target="_blank" data-order-quick="${e.orderId}">${escape(e.orderCode)}</a>${ui.copyCodeBtn(e.orderCode)}
          </td>
          <td>${fmtDate(e.createdAt)}</td>
          <td>${escape(STATUS_LABEL[e.status] || e.status)}</td>
          <td class="num">${fmtVnd(e.orderTotal)}</td>
          <td class="num">${fmtVnd(e.orderPaid)}</td>
          <td class="num" style="color:#dc2626;font-weight:700">${fmtVnd(e.orderRemain)}</td>
          <td class="num" style="color:#94a3b8">—</td>
        </tr>`;

        // Hàng từng sản phẩm trong dòng task này
        const itemRows = e.items.map(it => {
          const meta = pickPreferredMeta(it,
            { field_values: e.lineFieldValues },
            { field_values: e.orderFieldValues }
          );
          const metaParts = [];
          if (meta.accountLabel) metaParts.push(`TK: ${escape(meta.accountLabel)}`);
          if (meta.plateLabel) metaParts.push(`Biển số: ${escape(meta.plateLabel)}`);
          if (!metaParts.length && meta.fallbackPairs.length) {
            metaParts.push(`${escape(meta.fallbackPairs[0].label)}: ${escape(meta.fallbackPairs[0].value)}`);
          }
          const metaSpan = metaParts.length
            ? ` <span style="font-size:11px;color:#64748b">${metaParts.join(' · ')}</span>` : '';
          const sub = Number(it.qty) * Number(it.unit_price);
          const parts = [
            `<b>${escape(it.product_name || '—')}</b>`,
            `× ${it.qty}`,
          ];
          if (metaParts.length) parts.push(`<span style="color:#64748b">${metaParts.join(' · ')}</span>`);
          parts.push(`<b style="color:#0f172a">${fmtVnd(sub)}</b>`);
          const priceHtml = parts.pop();
          return `<tr style="background:#fff;font-size:12.5px;color:#475569">
            <td colspan="7" style="padding-left:28px;border-top:none">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span>└ ${parts.join(' &nbsp; ')}</span>
                <span style="font-variant-numeric:tabular-nums;white-space:nowrap">${priceHtml}</span>
              </div>
            </td>
          </tr>`;
        }).join('');

        return orderRow + itemRows;
      }).join('');

      return `<div style="margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;background:#0f172a;color:#fff;padding:8px 12px;border-radius:4px 4px 0 0">
          <span style="font-weight:700;font-size:14px">${escape(g.label)}</span>
          <span style="font-size:13px">${uniqueDebtMap.size} đơn &nbsp;·&nbsp; Còn nợ: <b style="color:#fbbf24">${fmtVnd(groupDebt)}</b></span>
        </div>
        <table class="line-table" style="margin-bottom:0;border-top:none">
          <thead><tr>
            <th>Mã đơn / Sản phẩm</th>
            <th style="width:90px">Ngày lập</th>
            <th style="width:90px">Trạng thái</th>
            <th class="num" style="width:110px">Tổng đơn</th>
            <th class="num" style="width:100px">Đã trả</th>
            <th class="num" style="width:100px">Còn nợ</th>
            <th class="num" style="width:100px">Giá SP</th>
          </tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>`;
    }).join('');

    return dateRange + summaryTable
      + `<div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;border-top:1px solid #cbd5e1;padding-top:14px">Xem dạng chi tiết</div>`
      + detailSections;
  }

  // ─── Dispatcher theo mode ────────────────────────────────────────────────────

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
        : '<div class="empty">Không có đơn hàng mới đang nợ</div>';
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

  function renderBankBlock(d) {
    const s = d.settings || {};
    const slot = Number(s['bank.default_qr_slot']) || 1;
    const accountNo   = s[`qr.slot${slot}.account_no`]   || s['bank.account_no']   || '';
    const accountName = s[`qr.slot${slot}.account_name`] || s['bank.account_name'] || '';
    const bankName    = s[`qr.slot${slot}.bank_name`]    || s['bank.bank_name']    || '';
    const qrUrl   = s[`qr.slot${slot}.image_url`] || '';
    const qrLabel = s[`qr.slot${slot}.label`]     || '';
    const has = accountNo || accountName || bankName || qrUrl;
    if (!has) return '<div class="empty">Chưa cấu hình thông tin chuyển khoản</div>';
    const qrHtml = qrUrl
      ? `<div class="bk-qr"><img src="${escape(qrUrl)}" alt="QR"><div class="qr-label">${escape(qrLabel)}</div></div>`
      : '<div class="bk-qr"><div class="empty" style="padding:30px 10px">Chưa có QR</div></div>';
    return `<div class="bank-block">
      <div class="bk-info">
        <div class="row"><span>Ngân hàng:</span><b>${escape(bankName) || '<i style="color:#94a3b8">Chưa cấu hình</i>'}</b></div>
        <div class="row"><span>Số tài khoản:</span><b>${escape(accountNo) || '<i style="color:#94a3b8">Chưa cấu hình</i>'}</b></div>
        <div class="row"><span>Chủ tài khoản:</span><b>${escape(accountName) || '<i style="color:#94a3b8">Chưa cấu hình</i>'}</b></div>
        <div style="margin-top:16px;color:#475569;font-size:13px;font-style:italic">Khi chuyển khoản vui lòng ghi rõ mã khách hàng hoặc số điện thoại để tiện đối soát.</div>
      </div>
      ${qrHtml}
    </div>`;
  }

  // ─── Render toàn trang ───────────────────────────────────────────────────────

  function render(d) {
    const cust = d.customer || {};
    state.totalDebt = d.total_debt;
    state.cid = cust.id;

    const requestsHtml = (d.pending_requests && d.pending_requests.length) ? `
      <div style="margin-top:20px">
        <h4 style="font-size:13px;color:#475569;margin-bottom:8px;text-transform:uppercase">Phiếu yêu cầu cũ chưa thanh toán hết</h4>
        <table class="line-table">
          <thead><tr><th>Mã phiếu</th><th>Ngày lập</th><th class="num">Còn nợ</th></tr></thead>
          <tbody>${d.pending_requests.map(pr => `
            <tr>
              <td><b style="color:#2563eb">${escape(pr.code)}</b></td>
              <td>${fmtDate(pr.created_at)}</td>
              <td class="num" style="color:#dc2626">${fmtVnd(pr.remaining)}</td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>` : '';

    $('quotePaper').innerHTML = `
      <div class="quote-header">
        <div class="quote-brand">
          <div class="logo">VG</div>
          <div>
            <div class="brand-name">CÔNG TY TNHH VIỄN THÔNG VINAGPS</div>
            <div class="brand-sub">190 TTH 21, P. Tân Thới Hiệp, Q.12, TP.HCM<br>ĐT: (028) 6682 5658 — DĐ: 0949.155.160</div>
          </div>
        </div>
        <div class="quote-meta">
          <div>Ngày lập: <b>${fmtDate(new Date())}</b></div>
          <div style="font-size:12px;color:#64748b;margin-top:4px">BẢNG KÊ ĐỐI CHIẾU CÔNG NỢ</div>
        </div>
      </div>

      <div class="doc-title">
        <h1>PHIẾU YÊU CẦU THANH TOÁN</h1>
        <p>Bảng kê chi tiết các đơn hàng và dư nợ tính đến ngày ${fmtDate(new Date())}</p>
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
        <div id="ordersSection"></div>
        ${requestsHtml}
      </div>

      <div class="quote-section">
        <h3>3. Tổng hợp thanh toán</h3>
        <div class="summary-box">
          ${d.opening_balance > 0 ? `<div class="row"><span>Nợ kỳ trước (Gối đầu):</span><span>${fmtVnd(d.opening_balance)}</span></div>` : ''}
          ${d.order_debt > 0 ? `<div class="row"><span>Nợ đơn hàng mới:</span><span>${fmtVnd(d.order_debt)}</span></div>` : ''}
          ${d.request_debt > 0 ? `<div class="row"><span>Nợ từ phiếu cũ (rolling):</span><span>${fmtVnd(d.request_debt)}</span></div>` : ''}
          <div class="row total"><span>TỔNG CỘNG CẦN THANH TOÁN:</span><span>${fmtVnd(d.total_debt)}</span></div>
        </div>
      </div>

      <div class="quote-section">
        <h3>4. Thông tin chuyển khoản</h3>
        ${renderBankBlock(d)}
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
    $('btnOpenConfirm').disabled = false;
    $('btnDownload').disabled = false;
    $('btnDownloadPdf').disabled = false;
  }

  // ─── Modal xác nhận tạo phiếu ────────────────────────────────────────────────

  function openConfirm() {
    const d = state.data;
    if (!d) return;
    $('cfOrderCount').textContent = d.pending_orders.length;
    $('cfTotalDebt').textContent = fmtVnd(d.total_debt);
    $('cmIncludeOB').checked = d.opening_balance > 0;
    $('cmIncludePR').checked = d.request_debt > 0;
    $('cmIncludeOB').parentElement.style.display = d.opening_balance > 0 ? '' : 'none';
    $('cmIncludePR').parentElement.style.display = d.request_debt > 0 ? '' : 'none';
    $('confirmModal').classList.add('open');
  }
  function closeConfirm() { $('confirmModal').classList.remove('open'); }

  function bindModal() {
    $('btnOpenConfirm').onclick = openConfirm;
    $('cmClose').onclick = closeConfirm;
    $('btnCancel').onclick = closeConfirm;
    $('btnSubmit').onclick = submit;
  }

  async function submit() {
    const d = state.data;
    if (!d) return;
    const body = {
      customer_id: state.cid,
      order_ids: d.pending_orders.map(o => o.id),
      include_opening_balance: $('cmIncludeOB').checked,
      include_request_debt: $('cmIncludePR').checked,
    };
    try {
      ui.loading(true);
      $('btnSubmit').disabled = true;
      const res = await api.post('/admin/payment-requests', body);
      if (!res) return;
      $('confirmModal').classList.remove('open');

      // Hien canh bao neu co don da nam trong phieu khac
      if (res.warnings && res.warnings.length) {
        const warnLines = res.warnings.map(w =>
          `• Đơn #${w.order_id} đang nằm trong phiếu <b>${escape(w.existing_request_code)}</b>`
        ).join('<br>');
        await ui.alert({
          title: '⚠ Cảnh báo trùng phiếu',
          message: `${warnLines}<br><br>Phiếu <b>${res.code}</b> đã được tạo. Lưu ý kiểm tra và huỷ phiếu cũ nếu cần.`,
          type: 'warning',
        });
      } else {
        ui.toast(`Tạo phiếu thành công: ${res.code}`, 'success');
      }

      setTimeout(() => {
        location.href = `/admin/payment-request-detail.html?id=${res.request_id}`;
      }, 600);
    } finally {
      ui.loading(false);
      $('btnSubmit').disabled = false;
    }
  }

  // ─── Load dữ liệu ────────────────────────────────────────────────────────────

  async function load() {
    state.cid = getCid();
    if (!state.cid) {
      $('quotePaper').innerHTML = '<div class="empty">Thiếu tham số ?cid=...</div>';
      return;
    }
    const url = `/public/debts/${state.cid}/settle-preview`;

    $('quotePaper').innerHTML = '<div class="empty">Đang tải...</div>';
    $('btnOpenConfirm').disabled = true;
    const d = await api.get(url).catch(() => null);
    if (!d) {
      $('quotePaper').innerHTML = '<div class="empty">Không tải được dữ liệu</div>';
      return;
    }
    if (Number(d.total_debt) <= 0) {
      $('quotePaper').innerHTML = '<div class="empty">Không có công nợ trong khoảng thời gian này</div>';
      return;
    }
    state.data = d;
    render(d);
  }

  // ─── Khởi động ───────────────────────────────────────────────────────────────

  bindModal();
  bindViewTabs();

  $('btnDownload').onclick = async () => {
    if (typeof html2canvas !== 'function') return ui.toast('Thư viện html2canvas chưa tải xong', 'error');
    const paper = $('quotePaper');
    try {
      ui.loading(true);
      const canvas = await html2canvas(paper, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const c = state.data && state.data.customer;
      const fname = `phieu-yeu-cau-${(c && c.code) || (c && c.id) || 'kh'}-${fmtDate(new Date()).replaceAll('/', '-')}.png`;
      a.href = url; a.download = fname;
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
      return ui.toast('Thư viện chưa tải xong, thử lại sau giây lát', 'error');
    }
    const paper = $('quotePaper');
    try {
      ui.loading(true);
      const canvas = await html2canvas(paper, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdfW = 210;
      const pdfH = Math.round((canvas.height / canvas.width) * pdfW);
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const a4H = 297;
      let yOffset = 0;
      while (yOffset < pdfH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfW, pdfH);
        yOffset += a4H;
      }
      const c = state.data && state.data.customer;
      const fname = `phieu-yeu-cau-${(c && c.code) || (c && c.id) || 'kh'}-${fmtDate(new Date()).replaceAll('/', '-')}.pdf`;
      pdf.save(fname);
    } catch (err) {
      ui.toast('Lỗi tạo PDF: ' + err.message, 'error');
    } finally {
      ui.loading(false);
    }
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

  $('btnReload').onclick = load;

  load();
})();
