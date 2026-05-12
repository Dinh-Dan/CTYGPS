// Trang in bill phieu tat toan cong no — load 1 settlement va render bill A4
// URL: /admin/debt-settle.html?id=<settlement_id>

(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');
  const fmtVnd = (n) => fmt.format(Number(n) || 0) + 'đ';
  const escape = (s) => String(s == null ? '' : s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${dt.getFullYear()}`;
  }

  const PAY_METHOD = { cash: 'Tiền mặt', transfer: 'Chuyển khoản', mixed: 'Hỗn hợp' };

  function getId() {
    const p = new URLSearchParams(location.search);
    return Number(p.get('id')) || null;
  }

  function render(d) {
    const s = d.settlement;
    const c = d.customer;
    const customerName = c.type === 'dealer' && c.company_name
      ? c.company_name : c.full_name || c.name;
    const personLine = c.type === 'dealer' && c.company_name && c.full_name
      ? `<div><b>Người liên hệ:</b> ${escape(c.full_name || c.name)}</div>` : '';

    // Tinh "no ky truoc" snapshot:
    //   total_debt = opening_at_settle + sum(don_da_ket_remaining)
    //   sum(don remaining) = sum(o.total - o.paid) tai thoi diem ket
    //   -> opening_at_settle = total_debt - sum(o.total - o.paid)
    let sumOrderRemaining = 0;
    for (const o of d.carried_orders) {
      sumOrderRemaining += Math.max(0, Number(o.total_amount) - Number(o.paid_amount));
    }

    let ordersHtml = '';
    if (d.carried_orders.length) {
      ordersHtml = `
        <table class="bill-table">
          <thead>
            <tr><th style="width:120px">Mã đơn</th><th style="width:90px">Ngày</th><th>Loại</th><th style="width:110px">Biển số</th>
                <th class="num" style="width:120px">Tổng đơn</th><th class="num" style="width:120px">Đã trả</th><th class="num" style="width:120px">Còn lại</th></tr>
          </thead>
          <tbody>
            ${d.carried_orders.map(o => {
              const remain = Math.max(0, Number(o.total_amount) - Number(o.paid_amount));
              return `<tr>
                <td><b>${escape(o.code)}</b></td>
                <td>${fmtDate(o.confirmed_at)}</td>
                <td>${escape(o.template_name || '—')}</td>
                <td>${escape(o.vehicle_plate || '—')}</td>
                <td class="num">${fmtVnd(o.total_amount)}</td>
                <td class="num">${fmtVnd(o.paid_amount)}</td>
                <td class="num"><b>${fmtVnd(remain)}</b></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>`;
    } else {
      ordersHtml = '<div class="empty">Phiếu này chỉ tất toán phần nợ kỳ trước (không có đơn cụ thể)</div>';
    }

    const openingAtSettle = Math.max(0, Number(s.total_debt) - sumOrderRemaining);

    let historyHtml = '';
    if (d.history.length) {
      historyHtml = `
        <table class="bill-table">
          <thead>
            <tr><th style="width:130px">Mã phiếu</th><th style="width:110px">Ngày</th>
                <th>Hình thức</th><th class="num" style="width:140px">Số tiền trả</th><th class="num" style="width:140px">Còn lại sau lần đó</th></tr>
          </thead>
          <tbody>
            ${d.history.slice(0, 10).map(h => `<tr>
              <td><b>${escape(h.code)}</b></td>
              <td>${fmtDate(h.paid_at)}</td>
              <td>${PAY_METHOD[h.pay_method] || h.pay_method || '—'}</td>
              <td class="num">${fmtVnd(h.amount_paid)}</td>
              <td class="num">${fmtVnd(h.remaining)}</td>
            </tr>`).join('')}
          </tbody>
        </table>`;
    }

    const qrBlock = d.qr.url
      ? `<div class="bill-qr">
           <img src="${escape(d.qr.url)}" alt="QR thanh toán">
           <div class="qr-label">${escape(d.qr.label || '')}</div>
         </div>`
      : '<div class="bill-qr"><div class="empty" style="padding:40px 10px">Chưa cấu hình QR</div></div>';

    $('billPaper').innerHTML = `
      <div class="bill-header">
        <div class="bill-brand">
          <div class="logo">VG</div>
          <div>
            <div class="brand-name">CÔNG TY TNHH VIỄN THÔNG VINAGPS</div>
            <div class="brand-sub">190 TTH 21, P. Tân Thới Hiệp, Q.12, TP.HCM<br>ĐT: (028) 6682 5658 — DĐ: 0949.155.160</div>
          </div>
        </div>
        <div class="bill-meta">
          <div class="bill-title">PHIẾU TẤT TOÁN CÔNG NỢ</div>
          <div>Mã: <b>${escape(s.code)}</b></div>
          <div>Ngày lập: <b>${fmtDate(s.paid_at)}</b></div>
          ${s.created_by_name ? `<div>Người lập: ${escape(s.created_by_name)}</div>` : ''}
        </div>
      </div>

      <div class="bill-section">
        <h3>Thông tin khách hàng</h3>
        <div class="bill-info">
          <div><b>Tên:</b> ${escape(customerName)}</div>
          <div><b>Mã KH:</b> ${escape(c.code || '—')}</div>
          <div><b>SĐT:</b> ${escape(c.phone || '—')}</div>
          ${c.tax_code ? `<div><b>MST:</b> ${escape(c.tax_code)}</div>` : '<div></div>'}
          ${c.address ? `<div style="grid-column:1/-1"><b>Địa chỉ:</b> ${escape(c.address)}</div>` : ''}
          ${personLine}
        </div>
      </div>

      <div class="bill-section">
        <h3>Đơn hàng được tất toán đợt này (${d.carried_orders.length})</h3>
        ${ordersHtml}
      </div>

      <div class="bill-section">
        <div class="bill-summary">
          <div class="row"><span>Nợ kỳ trước (gối đầu):</span><span>${fmtVnd(openingAtSettle)}</span></div>
          <div class="row"><span>Cộng nợ phát sinh từ ${d.carried_orders.length} đơn trên:</span><span>${fmtVnd(sumOrderRemaining)}</span></div>
          <div class="row total"><span>Tổng phải thu:</span><span>${fmtVnd(s.total_debt)}</span></div>
          <div class="row"><span>Khách trả đợt này (${PAY_METHOD[s.pay_method] || s.pay_method}):</span><span><b>${fmtVnd(s.amount_paid)}</b></span></div>
          <div class="row remaining"><span>Còn lại (chuyển sang nợ kỳ sau):</span><span>${fmtVnd(s.remaining)}</span></div>
        </div>
      </div>

      ${historyHtml ? `<div class="bill-section"><h3>Lịch sử thanh toán trước đó</h3>${historyHtml}</div>` : ''}

      <div class="bill-section">
        <h3>Thông tin thanh toán</h3>
        <div class="bill-pay">
          <div class="pay-info">
            <div class="row"><b>Ngân hàng:</b> ${escape(d.bank.bank_name) || '<i style="color:#94a3b8">chưa cấu hình</i>'}</div>
            <div class="row"><b>Số TK:</b> ${escape(d.bank.account_no) || '<i style="color:#94a3b8">chưa cấu hình</i>'}</div>
            <div class="row"><b>Chủ TK:</b> ${escape(d.bank.account_name) || '<i style="color:#94a3b8">chưa cấu hình</i>'}</div>
            ${s.note ? `<div class="row" style="margin-top:8px;color:#475569"><b>Ghi chú:</b> ${escape(s.note)}</div>` : ''}
          </div>
          ${qrBlock}
        </div>
      </div>

      <div class="bill-footer">
        <span>Phiếu được lập tự động bởi hệ thống VinaGPS</span>
        <span>${escape(s.code)}</span>
      </div>
    `;
  }

  async function load() {
    const id = getId();
    if (!id) {
      $('billPaper').innerHTML = '<div class="empty">Thiếu tham số ?id=...</div>';
      return;
    }
    const d = await api.get('/admin/debts/settlement/' + id).catch(() => null);
    if (!d) {
      $('billPaper').innerHTML = '<div class="empty">Không tải được phiếu</div>';
      return;
    }
    render(d);
  }

  $('btnPrint').onclick = () => window.print();
  $('btnBack').onclick  = () => location.href = '/admin/debts.html';

  load();
})();
