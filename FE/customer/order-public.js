// Trang public xem don gia han qua link admin gui (?t=<public_token>).
// KHONG can login. Dung fetch tay (khong qua api.js) de tranh 401 trigger login dialog.
(function () {
  const root = document.getElementById('root');
  const fmt = new Intl.NumberFormat('vi-VN');

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }
  function fmtMoney(v) { return fmt.format(Number(v) || 0) + 'đ'; }

  // Lay token tu URL ?t=...
  const params = new URLSearchParams(location.search);
  const token = params.get('t') || '';

  async function apiCall(method, path, body) {
    const res = await fetch('/api/public' + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      const e = new Error((data && data.error) || ('HTTP ' + res.status));
      e.status = res.status;
      throw e;
    }
    return data;
  }

  function renderEmpty(msg) {
    root.innerHTML = `<div class="panel empty-state">${escape(msg)}</div>`;
  }

  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const old = btn.textContent;
      btn.textContent = 'Đã chép';
      setTimeout(() => { btn.textContent = old; }, 1500);
    }).catch(() => ui.toast('Không sao chép được, bạn copy tay nhé', 'warning'));
  }

  function renderItems(items) {
    if (!items || !items.length) return '<p class="text-muted">—</p>';
    return `
      <table class="table-vehicles">
        <thead>
          <tr>
            <th>SĐT</th>
            <th>Biển số</th>
            <th>TK app</th>
            <th>IMEI</th>
            <th style="text-align:center">Số năm</th>
            <th style="text-align:right">Đơn giá</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(it => `
            <tr>
              <td>${escape(it.phone || '—')}</td>
              <td><b>${escape(it.vehicle_plate || '—')}</b></td>
              <td>${escape(it.subscription_account || '—')}</td>
              <td style="font-family:monospace;font-size:12px">${escape(it.imei || '—')}</td>
              <td style="text-align:center">${it.years || '—'}</td>
              <td style="text-align:right"><b>${fmtMoney(it.unit_price)}</b></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function renderBankBox(bank, total) {
    const accNo = bank['bank.account_no'] || '';
    const accName = bank['bank.account_name'] || '';
    const bankName = bank['bank.bank_name'] || '';
    const slot = bank['bank.default_qr_slot'] || '1';
    const qrUrl = bank[`qr.slot${slot}.image_url`] || '';

    return `
      <div class="qr-box">
        ${qrUrl
          ? `<img src="${escape(qrUrl)}" alt="QR thanh toán">`
          : '<p class="text-muted">Chưa có QR — vui lòng chuyển khoản theo thông tin bên dưới</p>'}
      </div>
      <div class="bank-info">
        <div class="row"><span>Ngân hàng:</span><b>${escape(bankName || '—')}</b></div>
        <div class="row">
          <span>Số tài khoản:</span>
          <span><b>${escape(accNo || '—')}</b>
            ${accNo ? `<button class="copy-btn" data-copy="${escape(accNo)}">Chép</button>` : ''}
          </span>
        </div>
        <div class="row"><span>Chủ tài khoản:</span><b>${escape(accName || '—')}</b></div>
        <div class="row" style="margin-top:6px;border-top:1px dashed #fcd34d;padding-top:8px">
          <span>Số tiền cần chuyển:</span>
          <b style="color:#dc2626">${fmtMoney(total)}</b>
        </div>
      </div>
    `;
  }

  // ---- Action handlers --------------------------------------
  async function onAccept() {
    const ok = await ui.confirm({
      title: 'Chấp nhận báo giá',
      message: 'Sau khi chấp nhận, hệ thống sẽ hiển thị số tài khoản và QR để bạn chuyển khoản. Tiếp tục?',
    });
    if (!ok) return;
    try {
      ui.loading(true);
      await apiCall('POST', `/renewal/${token}/accept`);
      await load();
    } catch (e) {
      ui.toast(e.message || 'Không gửi được yêu cầu', 'error');
    } finally { ui.loading(false); }
  }

  async function onMarkDebt(customerType) {
    // Khach le (retail) ghi no la khong dung quy trinh — canh bao nhung van cho phep.
    // Dai ly (dealer) ghi no binh thuong.
    const isRetail = customerType !== 'dealer';
    const message = isRetail
      ? '⚠️ Bạn phải là đại lý mới được ghi nợ. Khách thường sẽ phải thanh toán trước khi công ty gia hạn dịch vụ.\n\nNếu vẫn muốn ghi nợ, đơn sẽ được ghi vào công nợ và admin sẽ tiến hành gia hạn. Tiếp tục?'
      : 'Đơn sẽ được ghi nợ vào công nợ đại lý. Admin sẽ tiến hành gia hạn ngay. Tiếp tục?';
    const ok = await ui.confirm({
      title: isRetail ? '⚠️ Ghi nợ — Cảnh báo' : 'Ghi nợ đơn này',
      message,
      type: 'warning',
    });
    if (!ok) return;
    try {
      ui.loading(true);
      await apiCall('POST', `/renewal/${token}/mark-debt`);
      await load();
    } catch (e) {
      ui.toast(e.message || 'Không gửi được yêu cầu', 'error');
    } finally { ui.loading(false); }
  }

  async function onReportPayment() {
    const ok = await ui.confirm({
      title: 'Xác nhận đã chuyển khoản',
      message: 'Bạn xác nhận đã chuyển khoản đủ số tiền? Admin sẽ kiểm tra và gia hạn cho bạn.',
    });
    if (!ok) return;
    try {
      ui.loading(true);
      await apiCall('POST', `/renewal/${token}/report-payment`);
      await load();
    } catch (e) {
      ui.toast(e.message || 'Không gửi được yêu cầu', 'error');
    } finally { ui.loading(false); }
  }

  // ---- Render theo status -----------------------------------
  function render(o) {
    const subtotal = Number(o.subtotal) || 0;
    const total = Number(o.total_amount) || 0;
    const charges = (o.charges || []).map(c =>
      `<div class="total-line"><span>${escape(c.label)}</span><span>${fmtMoney(c.amount)}</span></div>`
    ).join('');

    let actionsHtml = '';
    let statusBox = '';

    if (o.status === 'quoted') {
      actionsHtml = `
        <div class="actions">
          <button class="btn" id="btnAccept">✓ Chấp nhận và chuyển khoản</button>
          <button class="btn ghost" id="btnDebt">Ghi nợ</button>
        </div>
        <p class="text-muted" style="font-size:13px;margin-top:8px;text-align:center">
          Bấm <b>"Chấp nhận"</b> để hiện QR chuyển khoản, hoặc <b>"Ghi nợ"</b> để công ty ghi nợ và gia hạn ngay.
        </p>
      `;
    } else if (o.status === 'awaiting_payment' && o.payment_method === 'transfer') {
      statusBox = `
        <h3>💳 Thông tin chuyển khoản</h3>
        ${renderBankBox(o.bank || {}, total)}
        <div class="actions">
          <button class="btn" id="btnReportPaid">✓ Tôi đã chuyển khoản</button>
        </div>
        <p class="text-muted" style="font-size:13px;margin-top:8px;text-align:center">
          Sau khi chuyển khoản, bấm nút trên để báo cho admin. Admin sẽ kiểm tra và tiến hành gia hạn cho bạn.
        </p>
      `;
    } else if (o.status === 'awaiting_payment' && o.payment_method === 'debt') {
      statusBox = `<div class="status-msg warning">📋 Đơn đã được ghi nợ. Admin đang tiến hành gia hạn cho bạn.</div>`;
    } else if (o.status === 'payment_reported') {
      statusBox = `<div class="status-msg info">⏳ Đã ghi nhận chuyển khoản. Admin đang kiểm tra và gia hạn — vui lòng chờ ít phút.</div>`;
    } else if (o.status === 'done') {
      statusBox = `<div class="status-msg success">✅ Đã gia hạn xong. Hệ thống GoTrack sẽ tự cập nhật hạn mới (+365 ngày). Cảm ơn bạn đã sử dụng dịch vụ!</div>`;
    } else if (o.status === 'cancelled') {
      statusBox = `<div class="status-msg warning">Đơn đã bị huỷ.</div>`;
    } else {
      // pending_review hoac trang thai khac
      statusBox = `<div class="status-msg info">Đơn đang được admin xử lý. Vui lòng chờ báo giá.</div>`;
    }

    root.innerHTML = `
      <div class="panel">
        <div class="order-head">
          <div>
            <div class="code">Đơn ${escape(o.code)}</div>
            <p class="text-muted" style="margin:4px 0 0 0;font-size:13px">
              Khách: <b>${escape(o.customer_name || '—')}</b>${o.customer_phone ? ' · ' + escape(o.customer_phone) : ''}
            </p>
          </div>
          <span class="pill blue">🔄 Gia hạn dịch vụ</span>
        </div>

        <h3>📋 Chi tiết các xe</h3>
        ${renderItems(o.items)}

        <div style="margin-top:12px">
          <div class="total-line"><span>Tạm tính</span><span>${fmtMoney(subtotal)}</span></div>
          ${charges}
          <div class="total-line grand"><span>Tổng cộng</span><span>${fmtMoney(total)}</span></div>
        </div>

        ${o.note ? `<div style="margin-top:10px;padding:8px;background:#f8fafc;border-radius:6px;font-size:14px"><b>Ghi chú:</b> ${escape(o.note)}</div>` : ''}

        ${statusBox}
        ${actionsHtml}
      </div>
    `;

    // Bind actions
    const a = document.getElementById('btnAccept');     if (a) a.onclick = onAccept;
    const d = document.getElementById('btnDebt');       if (d) d.onclick = () => onMarkDebt(o.customer_type);
    const r = document.getElementById('btnReportPaid'); if (r) r.onclick = onReportPayment;

    // Bind copy buttons
    document.querySelectorAll('.copy-btn[data-copy]').forEach(btn => {
      btn.onclick = () => copyText(btn.dataset.copy, btn);
    });
  }

  async function load() {
    if (!token) {
      renderEmpty('Link không hợp lệ — thiếu mã đơn.');
      return;
    }
    try {
      ui.loading(true);
      const o = await apiCall('GET', `/renewal/${token}`);
      render(o);
    } catch (e) {
      if (e.status === 404) renderEmpty('Không tìm thấy đơn. Link có thể đã hết hạn hoặc bị thu hồi.');
      else renderEmpty(e.message || 'Không tải được đơn');
    } finally { ui.loading(false); }
  }

  load();
})();
