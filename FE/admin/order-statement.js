// Trang bang ke don hang theo khoang ngay cua 1 khach
// URL: /admin/order-statement.html?cid=<customer_id>&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD

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
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
  }

  const STATUS_LABEL = {
    pending: 'Chờ duyệt', confirmed: 'Đã duyệt',
    in_progress: 'Đang làm', done: 'Hoàn tất', cancelled: 'Đã huỷ',
  };
  const STATUS_CLASS = {
    pending: 'pe', confirmed: 'co', in_progress: 'in', done: 'do', cancelled: 'ca',
  };

  const state = { data: null };

  function getParams() {
    const p = new URLSearchParams(location.search);
    return {
      customer_id:    p.get('customer_id')    || '',
      customer_q:     p.get('customer_q')     || '',
      q:              p.get('q')              || '',
      date_from:      p.get('date_from')      || '',
      date_to:        p.get('date_to')        || '',
      status:         p.get('status')         || '',
      payment_status: p.get('payment_status') || '',
      template_id:    p.get('template_id')    || '',
    };
  }

  // ---- Render 1 don ----------------------------------------------------
  function renderOrder(o) {
    const stClass = STATUS_CLASS[o.status] || 'pe';
    const stLabel = STATUS_LABEL[o.status] || o.status;

    // Field values noi bat (bien so, IMEI, SIM, tai khoan...) gom tu tat ca items
    const allFields = [];
    const seen = new Set();
    for (const ln of (o.lines || [])) {
      for (const it of (ln.items || [])) {
        for (const fv of (it.field_values || [])) {
          const key = fv.label + '::' + fv.value;
          if (fv.value && !seen.has(key)) { seen.add(key); allFields.push(fv); }
        }
      }
    }

    const fieldsHtml = allFields.length
      ? `<div class="oc-meta" style="margin-top:4px">${allFields.map(fv =>
          `<span><b>${escape(fv.label)}:</b> ${escape(fv.value)}</span>`
        ).join('')}</div>`
      : '';

    const linesHtml = (o.lines || []).map(ln => {
      const itemsHtml = (ln.items && ln.items.length)
        ? `<table class="line-table"><thead><tr>
            <th>Sản phẩm</th>
            <th style="width:60px" class="num">SL</th>
            <th style="width:110px" class="num">Đơn giá</th>
            <th style="width:110px" class="num">Thành tiền</th>
           </tr></thead><tbody>${ln.items.map(it => {
             const tot = Number(it.qty) * Number(it.unit_price);
             return `<tr>
               <td>${escape(it.product_name||'—')}${it.product_code ? ` <small style="color:#94a3b8">(${escape(it.product_code)})</small>` : ''}</td>
               <td class="num">${it.qty}</td>
               <td class="num">${fmtVnd(it.unit_price)}</td>
               <td class="num">${fmtVnd(tot)}</td>
             </tr>`;
           }).join('')}</tbody></table>`
        : '';

      return `<div class="line-block">
        <div class="ln-title">▸ ${escape(ln.template_name||'Công việc')}</div>
        ${itemsHtml}
        ${ln.note ? `<div style="margin-top:6px;font-size:12.5px;color:#64748b"><b>Ghi chú:</b> ${escape(ln.note)}</div>` : ''}
        <div style="text-align:right;margin-top:6px;font-size:13px"><b>Cộng dòng:</b> ${fmtVnd(ln.subtotal)}</div>
      </div>`;
    }).join('');

    const oid = Number(o.id) || 0;
    const codeHtml = oid
      ? `<a class="oc-code" href="/admin/orders.html#order-${oid}" target="_blank" data-order-quick="${oid}">${escape(o.code)}</a>${ui.copyCodeBtn(o.code)}`
      : `<span class="oc-code">${escape(o.code)}</span>${ui.copyCodeBtn(o.code)}`;
    return `<div class="order-card">
      <div class="oc-head">
        <div>
          ${codeHtml}
          <span class="oc-tag st-${stClass}" style="margin-left:6px">${escape(stLabel)}</span>
        </div>
        <div class="oc-amount">Còn nợ: ${fmtVnd(o.remaining)}</div>
      </div>
      <div class="oc-meta">
        <span>📅 Tạo: <b>${fmtDate(o.created_at)}</b></span>
        ${o.confirmed_at ? `<span>✓ Duyệt: <b>${fmtDate(o.confirmed_at)}</b></span>` : ''}
        ${o.completed_at ? `<span>🏁 Xong: <b>${fmtDate(o.completed_at)}</b></span>` : ''}
        ${o.staff_name   ? `<span>🔧 KTV: <b>${escape(o.staff_name)}</b>${o.staff_phone ? ' · '+escape(o.staff_phone) : ''}</span>` : ''}
        ${o.debt_carried_at ? `<span style="color:#16a34a">✔ Đã tất toán: <b>${fmtDate(o.debt_carried_at)}</b></span>` : ''}
      </div>
      ${fieldsHtml}
      ${o.address ? `<div class="oc-meta"><span>📍 <b>Địa chỉ:</b> ${escape(o.address)}</span></div>` : ''}
      ${o.note    ? `<div class="oc-meta"><span>📝 <b>Ghi chú:</b> ${escape(o.note)}</span></div>` : ''}
      ${linesHtml || '<div class="empty" style="padding:12px">Đơn không có dòng công việc</div>'}
      <div class="order-totals">
        <div class="ot-item"><span>Tổng đơn:</span><span>${fmtVnd(o.total_amount)}</span></div>
        <div class="ot-item"><span>Đã trả:</span><span>${fmtVnd(o.paid_amount)}</span></div>
        <div class="ot-item remain"><span>Còn nợ:</span><span>${fmtVnd(o.remaining)}</span></div>
      </div>
    </div>`;
  }

  // ---- Render bank block -----------------------------------------------
  function renderBankBlock(s) {
    const slot = Number(s['bank.default_qr_slot']) || 1;
    const accountNo   = s[`qr.slot${slot}.account_no`]   || s['bank.account_no']   || '';
    const accountName = s[`qr.slot${slot}.account_name`] || s['bank.account_name'] || '';
    const bankName    = s[`qr.slot${slot}.bank_name`]    || s['bank.bank_name']    || '';
    const qrUrl   = s[`qr.slot${slot}.image_url`] || '';
    const qrLabel = s[`qr.slot${slot}.label`]     || '';
    if (!accountNo && !accountName && !bankName && !qrUrl) {
      return '<div class="empty">Chưa cấu hình thông tin chuyển khoản</div>';
    }
    const qrHtml = qrUrl
      ? `<div class="bk-qr"><img src="${escape(qrUrl)}" alt="QR"><div class="qr-label">${escape(qrLabel)}</div></div>`
      : '';
    return `<div class="bank-block">
      <div class="bk-info">
        <div class="row"><b>Ngân hàng:</b> ${escape(bankName)||'<i style="color:#94a3b8">chưa cấu hình</i>'}</div>
        <div class="row"><b>Số tài khoản:</b> ${escape(accountNo)||'<i style="color:#94a3b8">chưa cấu hình</i>'}</div>
        <div class="row"><b>Chủ tài khoản:</b> ${escape(accountName)||'<i style="color:#94a3b8">chưa cấu hình</i>'}</div>
        <div class="row" style="margin-top:6px;color:#475569;font-size:13px"><i>Khi chuyển khoản vui lòng ghi rõ mã KH / SĐT để đối soát.</i></div>
      </div>
      ${qrHtml}
    </div>`;
  }

  // ---- Render toàn trang paper ----------------------------------------
  function render(d) {
    const c = d.customer;
    const customerName = (c.type === 'dealer' && c.company_name) ? c.company_name : c.full_name;
    const personLine   = (c.type === 'dealer' && c.company_name && c.full_name)
      ? `<div><b>Người liên hệ:</b> ${escape(c.full_name)}</div>` : '';

    const kyCover = d.date_from || d.date_to
      ? `${d.date_from ? fmtDate(d.date_from+'T00:00:00') : '?'} – ${d.date_to ? fmtDate(d.date_to+'T00:00:00') : '?'}`
      : 'Tất cả thời gian';

    const ordersHtml = d.orders.length
      ? d.orders.map(renderOrder).join('')
      : '<div class="empty">Không có đơn nào trong khoảng thời gian này</div>';

    const s = d.summary;

    $('stmtPaper').innerHTML = `
      <div class="stmt-header">
        <div class="stmt-brand">
          <div class="logo">VG</div>
          <div>
            <div class="brand-name">CÔNG TY TNHH VIỄN THÔNG VINAGPS</div>
            <div class="brand-sub">190 TTH 21, P. Tân Thới Hiệp, Q.12, TP.HCM<br>ĐT: (028) 6682 5658 — DĐ: 0949.155.160</div>
          </div>
        </div>
        <div class="stmt-meta">
          <div class="stmt-title">BẢNG KÊ ĐƠN HÀNG</div>
          <div>Kỳ: <b>${escape(kyCover)}</b></div>
          <div>Ngày lập: <b>${fmtDate(new Date())}</b></div>
        </div>
      </div>

      <div class="stmt-section">
        <h3>Thông tin khách hàng</h3>
        <div class="cust-info">
          <div><b>Tên:</b> ${escape(customerName)}</div>
          <div><b>Mã KH:</b> ${escape(c.code||'—')}</div>
          <div><b>SĐT:</b> ${escape(c.phone||'—')}</div>
          ${c.tax_code ? `<div><b>MST:</b> ${escape(c.tax_code)}</div>` : '<div></div>'}
          ${c.address ? `<div style="grid-column:1/-1"><b>Địa chỉ:</b> ${escape(c.address)}</div>` : ''}
          ${personLine}
        </div>
      </div>

      <div class="stmt-section">
        <h3>Danh sách đơn hàng (${d.orders.length})</h3>
        ${ordersHtml}
      </div>

      <div class="stmt-section">
        <h3>Tổng kết</h3>
        <div class="summary-box">
          <div class="row"><span>Tổng giá trị ${d.orders.length} đơn:</span><span>${fmtVnd(s.total_amount)}</span></div>
          <div class="row"><span>Đã thu:</span><span>${fmtVnd(s.paid_amount)}</span></div>
          <div class="row total"><span>Còn lại phải thu:</span><span>${fmtVnd(s.remaining)}</span></div>
        </div>
      </div>

      <div class="stmt-section">
        <h3>Thông tin chuyển khoản</h3>
        ${renderBankBlock(d.settings || {})}
      </div>

      <div style="margin-top:18px;padding-top:12px;border-top:1px dashed #cbd5e1;display:flex;justify-content:space-between;font-size:12px;color:#64748b">
        <span>Bảng kê lập tự động bởi hệ thống VinaGPS — vui lòng đối chiếu trước khi thanh toán</span>
        <span>${fmtDate(new Date())}</span>
      </div>
    `;

    $('btnDownload').disabled = false;
    $('btnDownloadPdf').disabled = false;
  }

  // ---- Load data -------------------------------------------------------
  async function load() {
    const params = getParams();
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });

    const d = await api.get('/admin/orders/statement?' + qs.toString()).catch(() => null);
    if (!d) {
      $('stmtPaper').innerHTML = '<div class="empty">Không tải được dữ liệu</div>';
      return;
    }
    state.data = d;
    render(d);
  }

  // ---- Actions ---------------------------------------------------------
  $('btnBack').onclick = () => history.length > 1 ? history.back() : (location.href = '/admin/orders.html');

  $('btnPrint').onclick = () => window.print();

  $('btnCopy').onclick = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      $('copyOk').style.display = '';
      setTimeout(() => $('copyOk').style.display = 'none', 1500);
    } catch { ui.toast('Không copy được link', 'error'); }
  };

  $('btnDownload').onclick = async () => {
    if (typeof html2canvas !== 'function') return ui.toast('Thư viện chưa tải xong', 'error');
    try {
      ui.loading(true);
      const canvas = await html2canvas($('stmtPaper'), { backgroundColor: '#ffffff', scale: 2, useCORS: true });
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const d = state.data;
      const cCode = d && d.customer && (d.customer.code || d.customer.id) || 'kh';
      const p = getParams();
      const suffix = (p.date_from || p.date_to) ? `-${(p.date_from||'').replaceAll('-','')}-${(p.date_to||'').replaceAll('-','')}` : '';
      a.href = url; a.download = `bang-ke-${cCode}${suffix}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { ui.toast('Lỗi tạo ảnh: ' + err.message, 'error'); }
    finally { ui.loading(false); }
  };

  $('btnDownloadPdf').onclick = async () => {
    if (typeof html2canvas !== 'function' || typeof window.jspdf === 'undefined') {
      return ui.toast('Thư viện chưa tải xong, thử lại sau', 'error');
    }
    try {
      ui.loading(true);
      const canvas = await html2canvas($('stmtPaper'), { backgroundColor: '#ffffff', scale: 2, useCORS: true });
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
      const d = state.data;
      const cCode = d && d.customer && (d.customer.code || d.customer.id) || 'kh';
      const p = getParams();
      const suffix = (p.date_from || p.date_to) ? `-${(p.date_from||'').replaceAll('-','')}-${(p.date_to||'').replaceAll('-','')}` : '';
      pdf.save(`bang-ke-${cCode}${suffix}.pdf`);
    } catch (err) { ui.toast('Lỗi tạo PDF: ' + err.message, 'error'); }
    finally { ui.loading(false); }
  };

  load();
})();
