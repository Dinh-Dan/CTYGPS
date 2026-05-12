// Trang tao phieu tat toan cong no (replace cho modal cu trong /admin/debts.html)
// URL: /admin/debt-settle-form.html?cid=<customer_id>
// Hien thi day du don dang no kem tasks/san pham/field_values/chi phi nhu bao gia.

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
  const STATUS_LABEL = {
    pending: 'Chờ duyệt', confirmed: 'Đã duyệt',
    in_progress: 'Đang làm', done: 'Hoàn tất', cancelled: 'Đã huỷ',
  };

  const state = {
    cid: null,
    data: null,
    selectedQrSlot: 1,
    receiptUrl: '',
  };

  function getCid() {
    const p = new URLSearchParams(location.search);
    return Number(p.get('cid')) || null;
  }

  function renderOrder(o) {
    const itemsHtml = (line) => {
      if (!line.items || !line.items.length) return '';
      return `<table class="line-table">
        <thead><tr>
          <th>Sản phẩm</th><th style="width:70px" class="num">SL</th>
          <th style="width:120px" class="num">Đơn giá</th>
          <th style="width:120px" class="num">Thành tiền</th>
        </tr></thead>
        <tbody>${line.items.map(it => {
          const total = Number(it.qty) * Number(it.unit_price);
          return `<tr>
            <td>${escape(it.product_name || '—')} ${it.product_code ? `<small style="color:#94a3b8">(${escape(it.product_code)})</small>` : ''}</td>
            <td class="num">${it.qty}</td>
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
        ${fieldsHtml(line)}
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

    const stClass = `st-${(o.status || '').slice(0,2)}`;
    const ktv = o.assigned_staff_name
      ? `<b>${escape(o.assigned_staff_name)}</b>${o.assigned_staff_phone ? ` · ${escape(o.assigned_staff_phone)}` : ''}`
      : '<i style="color:#94a3b8">Chưa gán</i>';

    return `<div class="order-card">
      <div class="oc-head">
        <div>
          <a class="oc-code" href="/admin/orders.html?id=${o.id}" target="_blank">${escape(o.code)}</a>
          <span class="oc-tag ${stClass}">${escape(STATUS_LABEL[o.status] || o.status)}</span>
        </div>
        <div class="oc-amount">Còn nợ: ${fmtVnd(o.remaining)}</div>
      </div>
      <div class="oc-meta">
        <span>📅 Tạo: <b>${fmtDate(o.created_at)}</b></span>
        ${o.confirmed_at ? `<span>✓ Duyệt: <b>${fmtDate(o.confirmed_at)}</b></span>` : ''}
        ${o.completed_at ? `<span>🏁 Xong: <b>${fmtDate(o.completed_at)}</b></span>` : ''}
        <span>🔧 KTV: ${ktv}</span>
      </div>
      ${o.address ? `<div class="oc-meta"><span>📍 <b>Địa chỉ:</b> ${escape(o.address)}</span></div>` : ''}
      ${o.note ? `<div class="oc-meta"><span>📝 <b>Ghi chú đơn:</b> ${escape(o.note)}</span></div>` : ''}
      ${linesHtml || '<div class="empty" style="padding:14px">Đơn không có dòng công việc</div>'}
      ${orderChargesHtml}
      <div class="order-totals">
        <div class="ot-item"><span>Tổng đơn:</span><span>${fmtVnd(o.total_amount)}</span></div>
        <div class="ot-item"><span>Đã trả:</span><span>${fmtVnd(o.paid_amount)}</span></div>
        <div class="ot-item remain"><span>Còn nợ:</span><span>${fmtVnd(o.remaining)}</span></div>
      </div>
    </div>`;
  }

  function renderQrGrid() {
    const grid = $('qrGrid');
    let html = '';
    const settings = state.data.settings || {};
    for (let i = 1; i <= 5; i++) {
      const url = settings[`qr.slot${i}.image_url`] || '';
      const label = settings[`qr.slot${i}.label`] || ('Slot ' + i);
      const empty = !url;
      const sel = state.selectedQrSlot === i && !empty ? 'selected' : '';
      const klass = empty ? 'qr-pick empty' : `qr-pick ${sel}`;
      html += `<div class="${klass}" data-slot="${i}" ${empty ? 'title="Chưa cấu hình"' : ''}>
        ${empty ? '<div style="aspect-ratio:1;display:grid;place-items:center">trống</div>'
                : `<img src="${escape(url)}" alt="${escape(label)}">`}
        <div class="qr-label">${escape(label)}</div>
      </div>`;
    }
    grid.innerHTML = html;
  }

  function render(d) {
    const c = d.customer;
    const customerName = c.type === 'dealer' && c.company_name
      ? c.company_name : c.full_name;
    const personLine = c.type === 'dealer' && c.company_name && c.full_name
      ? `<div><b>Người liên hệ:</b> ${escape(c.full_name)}</div>` : '';

    const ordersHtml = d.pending_orders.length
      ? d.pending_orders.map(renderOrder).join('')
      : '<div class="empty">Khách không có đơn đang nợ (chỉ tất toán phần nợ kỳ trước)</div>';

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
          <div class="quote-title">PHIẾU TẤT TOÁN CÔNG NỢ</div>
          <div>Ngày lập: <b>${fmtDate(new Date())}</b></div>
          <div style="color:#dc2626;font-size:12px"><i>(chưa xác nhận)</i></div>
        </div>
      </div>

      <div class="quote-section">
        <h3>Thông tin khách hàng</h3>
        <div class="cust-info">
          <div><b>Tên:</b> ${escape(customerName)}</div>
          <div><b>Mã KH:</b> ${escape(c.code || '—')}</div>
          <div><b>SĐT:</b> ${escape(c.phone || '—')}</div>
          ${c.tax_code ? `<div><b>MST:</b> ${escape(c.tax_code)}</div>` : '<div></div>'}
          ${c.address ? `<div style="grid-column:1/-1"><b>Địa chỉ:</b> ${escape(c.address)}</div>` : ''}
          ${personLine}
        </div>
      </div>

      <div class="quote-section">
        <h3>Đơn đang nợ (${d.pending_orders.length}) — sẽ được tất toán đợt này</h3>
        ${ordersHtml}
      </div>

      <div class="quote-section">
        <h3>Tổng kết công nợ</h3>
        <div class="summary-box">
          <div class="row"><span>Nợ kỳ trước (gối đầu):</span><span>${fmtVnd(d.opening_balance)}</span></div>
          <div class="row"><span>Nợ phát sinh từ ${d.pending_orders.length} đơn trên:</span><span>${fmtVnd(d.order_debt)}</span></div>
          <div class="row total"><span>Tổng phải thu:</span><span>${fmtVnd(d.total_debt)}</span></div>
        </div>
      </div>

      <div class="quote-section">
        <h3>Thông tin chuyển khoản</h3>
        ${renderBankBlock(d)}
      </div>

      <div style="margin-top:18px;padding-top:12px;border-top:1px dashed #cbd5e1;display:flex;justify-content:space-between;font-size:12px;color:#64748b">
        <span>Phiếu lập tự động bởi hệ thống VinaGPS — vui lòng đối chiếu trước khi thanh toán</span>
        <span>${fmtDate(new Date())}</span>
      </div>
    `;

    // Bat nut xac nhan + tai anh + tai pdf
    $('btnOpenConfirm').disabled = false;
    $('btnDownload').disabled = false;
    $('btnDownloadPdf').disabled = false;
  }

  function renderBankBlock(d) {
    const s = d.settings || {};
    const accountNo   = s['bank.account_no']   || '';
    const accountName = s['bank.account_name'] || '';
    const bankName    = s['bank.bank_name']    || '';
    const slot = Number(s['bank.default_qr_slot']) || 1;
    const qrUrl   = s[`qr.slot${slot}.image_url`] || '';
    const qrLabel = s[`qr.slot${slot}.label`]     || '';
    const has = accountNo || accountName || bankName || qrUrl;
    if (!has) return '<div class="empty">Chưa cấu hình thông tin chuyển khoản</div>';
    const qrHtml = qrUrl
      ? `<div class="bk-qr"><img src="${escape(qrUrl)}" alt="QR"><div class="qr-label">${escape(qrLabel || '')}</div></div>`
      : '<div class="bk-qr"><div class="empty" style="padding:30px 10px">Chưa có QR</div></div>';
    return `<div class="bank-block">
      <div class="bk-info">
        <div class="row"><b>Ngân hàng:</b> ${escape(bankName) || '<i style="color:#94a3b8">chưa cấu hình</i>'}</div>
        <div class="row"><b>Số tài khoản:</b> ${escape(accountNo) || '<i style="color:#94a3b8">chưa cấu hình</i>'}</div>
        <div class="row"><b>Chủ tài khoản:</b> ${escape(accountName) || '<i style="color:#94a3b8">chưa cấu hình</i>'}</div>
        <div class="row" style="margin-top:6px;color:#475569;font-size:13px"><i>Khi chuyển khoản, vui lòng ghi rõ mã khách / SĐT để đối soát.</i></div>
      </div>
      ${qrHtml}
    </div>`;
  }

  function openConfirm() {
    const d = state.data;
    if (!d) return;
    $('cfOpening').textContent   = fmtVnd(d.opening_balance);
    $('cfOrderDebt').textContent = fmtVnd(d.order_debt);
    $('cfTotalDebt').textContent = fmtVnd(d.total_debt);

    Money.set($('fmAmount'), Math.max(0, d.total_debt));
    $('fmAmount').readOnly = true;
    $('fmAmountHelp').textContent = 'Tự động bằng tổng phải thu';
    document.querySelector('input[name="payMode"][value="full"]').checked = true;
    $('fmMethod').value = 'cash';
    $('fmNote').value = '';
    state.selectedQrSlot = Number((d.settings || {})['bank.default_qr_slot']) || 1;

    $('confirmModal').classList.add('open');
  }
  function closeConfirm() { $('confirmModal').classList.remove('open'); }

  function bindModal() {
    $('btnOpenConfirm').onclick = openConfirm;
    $('cmClose').onclick = closeConfirm;
    $('btnCancel').onclick = closeConfirm;
    $('btnSubmit').onclick = submit;

    document.querySelectorAll('input[name="payMode"]').forEach(r => {
      r.onchange = () => {
        const isFull = document.querySelector('input[name="payMode"]:checked').value === 'full';
        if (isFull) {
          $('fmAmount').readOnly = true;
          Money.set($('fmAmount'), Math.max(0, Number(state.data.total_debt) || 0));
          $('fmAmountHelp').textContent = 'Tự động bằng tổng phải thu';
        } else {
          $('fmAmount').readOnly = false;
          Money.set($('fmAmount'), 0);
          $('fmAmountHelp').textContent = 'Phần còn lại sẽ chuyển sang nợ kỳ sau';
          $('fmAmount').focus();
        }
      };
    });

  }

  async function submit() {
    const amount = Money.get($('fmAmount'));
    if (!amount || amount <= 0) return ui.toast('Nhập số tiền > 0', 'warning');
    const totalDebt = Number(state.data.total_debt) || 0;
    if (amount > totalDebt * 1.1) {
      const ok = await ui.confirm({ title: 'Số tiền lớn hơn tổng nợ', type: 'warning',
        message: `Khách trả ${fmtVnd(amount)} nhưng tổng nợ chỉ ${fmtVnd(totalDebt)}. Vẫn tiếp tục?` });
      if (!ok) return;
    }
    $('btnSubmit').disabled = true;
    try {
      const body = {
        amount_paid: amount,
        qr_slot: state.selectedQrSlot,
        pay_method: $('fmMethod').value,
        note: $('fmNote').value.trim(),
        date_from: $('filterFrom').value || undefined,
        date_to:   $('filterTo').value   || undefined,
      };
      const res = await api.post(`/admin/debts/${state.cid}/settle`, body, {
        loading: true, successMessage: 'Đã tạo phiếu tất toán'
      }).catch(() => null);
      if (!res) return;
      location.href = `/admin/debt-settle.html?id=${res.settlement_id}`;
    } finally {
      $('btnSubmit').disabled = false;
    }
  }

  async function load() {
    state.cid = getCid();
    if (!state.cid) {
      $('quotePaper').innerHTML = '<div class="empty">Thiếu tham số ?cid=...</div>';
      return;
    }
    // Lay date range tu URL params hoac input (neu da nhap)
    const urlParams = new URLSearchParams(location.search);
    if (!$('filterFrom').value && urlParams.get('date_from')) $('filterFrom').value = urlParams.get('date_from');
    if (!$('filterTo').value   && urlParams.get('date_to'))   $('filterTo').value   = urlParams.get('date_to');

    const qs = new URLSearchParams();
    if ($('filterFrom').value) qs.set('date_from', $('filterFrom').value);
    if ($('filterTo').value)   qs.set('date_to',   $('filterTo').value);
    const url = `/admin/debts/${state.cid}/settle-preview` + (qs.toString() ? '?' + qs : '');

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

  bindModal();
  $('btnDownload').onclick = async () => {
    if (typeof html2canvas !== 'function') {
      return ui.toast('Thư viện html2canvas chưa tải xong', 'error');
    }
    const paper = $('quotePaper');
    try {
      ui.loading(true);
      const canvas = await html2canvas(paper, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const c = state.data && state.data.customer;
      const fname = `phieu-tat-toan-${c && c.code || c && c.id || 'kh'}-${fmtDate(new Date()).replaceAll('/','-')}.png`;
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
      const canvas = await html2canvas(paper, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      // A4 = 210 x 297 mm; chon A4 portrait, fit theo chieu ngang
      const pdfW = 210;
      const pdfH = Math.round((canvas.height / canvas.width) * pdfW);
      const pdf = new jsPDF({ orientation: pdfH > 297 ? 'p' : 'p', unit: 'mm', format: 'a4' });
      // Neu noi dung cao hon 1 trang, chia trang tu dong
      const a4H = 297;
      let yOffset = 0;
      while (yOffset < pdfH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfW, pdfH);
        yOffset += a4H;
      }
      const c = state.data && state.data.customer;
      const fname = `phieu-tat-toan-${c && c.code || c && c.id || 'kh'}-${fmtDate(new Date()).replaceAll('/','-')}.pdf`;
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
