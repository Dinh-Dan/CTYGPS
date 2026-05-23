// /admin/commissions.html — Admin duyệt yêu cầu hoa hồng (KTV + Nhân viên gộp chung).
(function () {
  adminShell.init('commissions');

  const $ = id => document.getElementById(id);
  const fmt  = n  => Number(n || 0).toLocaleString('vi-VN');
  const esc  = s  => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  function fmtDate(v) {
    if (!v) return '—';
    const d = new Date(v);
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  }

  const STATUS_LABEL = { pending:'Chờ xác nhận', confirmed:'Đã xác nhận', in_progress:'Đang thực hiện', done:'Hoàn tất', cancelled:'Đã huỷ' };
  const PAY_LABEL    = { unpaid:'Chưa thu', partial:'Thu một phần', paid:'Đã thu đủ' };

  // ---- State ----
  const PAGE_LIMIT = 50;
  let allItems  = [];   // merged + sorted từ cả 2 API
  let curPage   = 1;
  let showAll   = false;

  // ============================================================
  // Load dữ liệu từ 2 API rồi gộp
  // ============================================================
  async function loadAll() {
    const tbody = $('cmTbody');
    tbody.innerHTML = `<tr><td colspan="9" class="cm-empty">Đang tải...</td></tr>`;
    $('cmCount').textContent = '';

    const allParam = showAll ? '&all=1' : '';
    const [ktvData, staffData] = await Promise.all([
      api.get(`/admin/orders/commission-requests?limit=200${allParam}`,       { onError: 'toast' }),
      api.get(`/admin/orders/staff-commission-requests?limit=200${allParam}`, { onError: 'toast' }),
    ]);

    // Chuẩn hoá về cùng shape
    const ktvItems = (ktvData?.items || []).map(r => ({
      _type:       'ktv',
      _orderId:    r.id,
      _cid:        null,
      code:        r.code,
      staffName:   r.staff_name || '—',
      staffRole:   'kithuat',
      customerName:  r.customer_name || '—',
      customerPhone: r.customer_phone || '',
      amount:      Number(r.tech_commission_amount) || 0,
      note:        r.tech_commission_note || '',
      requestedAt: r.tech_commission_requested_at,
      approvedAt:  r.tech_commission_approved_at || null,
    }));

    const staffItems = (staffData?.items || []).map(r => ({
      _type:       'staff',
      _orderId:    r.order_id,
      _cid:        r.id,
      code:        r.order_code,
      staffName:   r.staff_name || '—',
      staffRole:   r.staff_role || 'staff',
      customerName:  r.customer_name || '—',
      customerPhone: r.customer_phone || '',
      amount:      Number(r.amount) || 0,
      note:        r.note || '',
      requestedAt: r.requested_at,
      approvedAt:  r.approved_at || null,
    }));

    // Gộp và sắp xếp theo requestedAt tăng dần
    allItems = [...ktvItems, ...staffItems].sort((a, b) => {
      const ta = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
      const tb = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
      return ta - tb;
    });

    curPage = 1;
    render();
  }

  // ============================================================
  // Render bảng (client-side paging)
  // ============================================================
  function render() {
    const tbody    = $('cmTbody');
    const thStatus = $('thStatus');
    const colSpan  = showAll ? 9 : 8;

    thStatus.style.display = showAll ? '' : 'none';

    if (!allItems.length) {
      tbody.innerHTML = `<tr><td colspan="${colSpan}" class="cm-empty">✅ Không có yêu cầu hoa hồng nào.</td></tr>`;
      $('cmCount').textContent = '';
      $('cmPager').innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(allItems.length / PAGE_LIMIT) || 1;
    if (curPage > totalPages) curPage = totalPages;
    const start = (curPage - 1) * PAGE_LIMIT;
    const page  = allItems.slice(start, start + PAGE_LIMIT);

    const pendingCount = allItems.filter(i => !i.approvedAt).length;
    $('cmCount').textContent = showAll
      ? `${allItems.length} yêu cầu (${pendingCount} chưa duyệt)`
      : `${allItems.length} chưa duyệt`;

    tbody.innerHTML = page.map(r => {
      const isPending = !r.approvedAt;
      const typePill  = r._type === 'ktv'
        ? `<span class="type-pill ktv">🔧 KTV</span>`
        : `<span class="type-pill staff">👤 NV</span>`;

      const statusCell = showAll
        ? `<td>${isPending
            ? `<span class="status-pill pending">Chờ duyệt</span>`
            : `<span class="status-pill approved">Đã duyệt</span>`}</td>`
        : '';

      const actionCell = isPending
        ? `<td><div class="action-btns">
            <button class="btn primary sm btn-review"
              data-type="${r._type}"
              data-oid="${r._orderId}"
              data-cid="${r._cid || ''}"
              data-amt="${r.amount}"
              data-name="${esc(r.staffName)}"
              data-role="${esc(r.staffRole)}"
              data-note="${esc(r.note)}"
              data-date="${esc(r.requestedAt || '')}">
              🔍 Xem & Duyệt
            </button>
          </div></td>`
        : `<td><span class="cm-meta">—</span></td>`;

      return `
        <tr class="${isPending ? '' : 'is-approved'}">
          <td>${typePill}</td>
          <td><span style="font-weight:700;color:#1e40af">#${esc(r.code)}</span></td>
          <td>
            <div>${esc(r.staffName)}</div>
            <div class="cm-meta">${r.staffRole === 'kithuat' ? '🔧 KTV' : '👤 Nhân viên'}</div>
          </td>
          <td>
            <div>${esc(r.customerName)}</div>
            ${r.customerPhone ? `<div class="cm-meta">📞 ${esc(r.customerPhone)}</div>` : ''}
          </td>
          <td class="cm-amount">+ ${fmt(r.amount)}đ</td>
          <td class="cm-note">${r.note ? esc(r.note) : '<span style="color:#cbd5e1">—</span>'}</td>
          <td class="cm-meta">${fmtDate(r.requestedAt)}</td>
          ${statusCell}
          ${actionCell}
        </tr>`;
    }).join('');

    // Bind nút duyệt
    tbody.querySelectorAll('.btn-review').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        openReviewDialog({
          meta: {
            orderId:     Number(btn.dataset.oid),
            cid:         btn.dataset.cid ? Number(btn.dataset.cid) : null,
            staffName:   btn.dataset.name,
            staffRole:   btn.dataset.role,
            amount:      Number(btn.dataset.amt),
            note:        btn.dataset.note,
            requestedAt: btn.dataset.date,
          },
          onApprove: async (overrideAmt) => {
            const body = overrideAmt != null ? { amount: overrideAmt } : {};
            let r;
            if (type === 'ktv') {
              r = await api.patch(`/admin/orders/${btn.dataset.oid}/tech-commission`, body, { onError: 'toast' });
            } else {
              r = await api.patch(`/admin/orders/${btn.dataset.oid}/staff-commissions/${btn.dataset.cid}`, body, { onError: 'toast' });
            }
            if (r) { ui.toast('Đã duyệt hoa hồng', 'success'); loadAll(); }
          },
          onReject: async () => {
            const roleName = btn.dataset.role === 'kithuat' ? 'KTV' : 'Nhân viên';
            const yes = await ui.confirm({
              title:   `Từ chối hoa hồng ${roleName} — ${btn.dataset.name}?`,
              message: 'Yêu cầu sẽ bị xoá. Người dùng có thể gửi lại.',
              okText:  'Từ chối', okClass: 'danger',
            });
            if (!yes) return;
            let r;
            if (type === 'ktv') {
              r = await api.delete(`/admin/orders/${btn.dataset.oid}/tech-commission`, { onError: 'toast' });
            } else {
              r = await api.delete(`/admin/orders/${btn.dataset.oid}/staff-commissions/${btn.dataset.cid}`, { onError: 'toast' });
            }
            if (r) { ui.toast('Đã từ chối', 'success'); loadAll(); }
          },
        });
      });
    });

    renderPager(totalPages);
  }

  function renderPager(totalPages) {
    const pager = $('cmPager');
    if (totalPages <= 1) { pager.innerHTML = ''; return; }
    pager.innerHTML = `
      <span style="font-size:13px;color:#64748b">Trang ${curPage}/${totalPages}</span>
      <button class="btn ghost sm" id="pgPrev" ${curPage<=1?'disabled':''}>‹ Trước</button>
      <button class="btn ghost sm" id="pgNext" ${curPage>=totalPages?'disabled':''}>Tiếp ›</button>`;
    const prev = $('pgPrev'), next = $('pgNext');
    if (prev) prev.addEventListener('click', () => { curPage--; render(); });
    if (next) next.addEventListener('click', () => { curPage++; render(); });
  }

  // ============================================================
  // DIALOG XÉT DUYỆT
  // ============================================================
  async function openReviewDialog({ meta, onApprove, onReject }) {
    const dlg  = $('cmDlg');
    const body = $('cmDlgBody');
    dlg.classList.add('open');

    const roleLabel = meta.staffRole === 'kithuat' ? 'KTV' : 'Nhân viên';
    $('cmDlgMainTitle').textContent = `Xét duyệt hoa hồng ${roleLabel}`;
    $('cmDlgSubTitle').textContent  = meta.staffName || '—';

    body.innerHTML = `<div class="cm-dlg-loading">⏳ Đang tải thông tin đơn hàng...</div>`;

    const order = await api.get(`/admin/orders/${meta.orderId}`, { onError: 'toast' });
    if (!order) { dlg.classList.remove('open'); return; }

    const statusClass = `status-${order.status || 'pending'}`;
    const payClass    = `pay-${order.payment_status || 'unpaid'}`;
    const remaining   = (Number(order.total_amount) || 0) - (Number(order.paid_amount) || 0);

    const linesHtml = (order.lines || []).map(ln => {
      const itemsHtml = (ln.items || []).map(it => {
        const price = Number(it.unit_price) * Number(it.qty || 1);
        return `<div>• ${esc(it.product_name || 'SP#'+it.product_id)} × ${it.qty} — <b>${fmt(price)}đ</b></div>`;
      }).join('');
      const chargesHtml = (ln.charges || []).map(c => {
        const sign = c.amount < 0 ? '' : (c.kind === 'discount' ? '−' : '+');
        return `<div>· ${esc(c.label)}: <b>${sign}${fmt(Math.abs(c.amount))}đ</b></div>`;
      }).join('');
      return `
        <div class="cm-od-line">
          <div class="cm-od-line-name">${esc(ln.template_name || ln.custom_name || 'Công việc')}</div>
          ${itemsHtml || chargesHtml ? `<div class="cm-od-line-items">${itemsHtml}${chargesHtml}</div>` : ''}
          ${ln.subtotal ? `<div class="cm-od-line-total">Thành tiền: ${fmt(ln.subtotal)}đ</div>` : ''}
        </div>`;
    }).join('') || `<div style="color:#94a3b8;font-style:italic;font-size:13px">Không có công việc chi tiết.</div>`;

    const orderNoteHtml = order.note
      ? `<div class="cm-od-sec-title" style="margin-top:12px">Ghi chú đơn</div>
         <div style="font-size:13px;color:#475569;background:#f8fafc;padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0">${esc(order.note)}</div>`
      : '';

    const rolePillClass = meta.staffRole === 'kithuat' ? 'kithuat' : 'staff';

    body.innerHTML = `
      <div class="cm-od-header">
        <a class="cm-od-code" href="/admin/orders.html#order-${order.id}" target="_blank">#${esc(order.code)}</a>${ui.copyCodeBtn(order.code)}
        <span class="cm-od-pill ${statusClass}">${STATUS_LABEL[order.status] || order.status}</span>
        <span class="cm-od-pill ${payClass}">${PAY_LABEL[order.payment_status] || order.payment_status}</span>
      </div>

      <div class="cm-od-grid">
        <div class="cm-od-block">
          <div class="blk-label">Khách hàng</div>
          <div class="blk-val">${esc(order.customer_name || '(Khách lẻ)')}</div>
          ${order.customer_phone ? `<div class="blk-sub">📞 ${esc(order.customer_phone)}</div>` : ''}
          ${order.end_customer_name && order.end_customer_name !== order.customer_name
            ? `<div class="blk-sub" style="margin-top:3px">Người dùng: ${esc(order.end_customer_name)}</div>` : ''}
        </div>
        <div class="cm-od-block">
          <div class="blk-label">KTV phụ trách</div>
          <div class="blk-val">${esc(order.staff_name || '— Chưa gán —')}</div>
          ${order.address ? `<div class="blk-sub">📍 ${esc(order.address)}</div>` : ''}
        </div>
        <div class="cm-od-block">
          <div class="blk-label">Tổng đơn</div>
          <div class="blk-val amount">${fmt(order.total_amount)}đ</div>
          <div class="blk-sub">Đã thu: <b>${fmt(order.paid_amount)}đ</b></div>
          ${remaining > 0
            ? `<div class="blk-sub debt">Còn lại: ${fmt(remaining)}đ</div>`
            : `<div class="blk-sub" style="color:#15803d;font-weight:600">✓ Đã thanh toán đủ</div>`}
        </div>
      </div>

      <div>
        <div class="cm-od-sec-title">Công việc trong đơn</div>
        <div class="cm-od-lines">${linesHtml}</div>
        ${orderNoteHtml}
      </div>

      <div class="cm-req-box">
        <div class="req-label">⭐ Yêu cầu hoa hồng</div>
        <div class="cm-req-row">
          <span class="cm-req-who">👤 ${esc(meta.staffName)}</span>
          <span class="cm-req-role-pill ${rolePillClass}">${roleLabel}</span>
          <span class="cm-req-amount">+ ${fmt(meta.amount)}đ</span>
        </div>
        ${meta.note ? `<div class="cm-req-note">"${esc(meta.note)}"</div>` : ''}
        <div class="cm-req-when">Gửi lúc ${fmtDate(meta.requestedAt)}</div>

        <div class="cm-override-wrap">
          <label>Duyệt với số tiền khác <span style="font-weight:400;color:#b45309">(để trống = giữ nguyên ${fmt(meta.amount)}đ)</span>:</label>
          <input type="number" id="cmDlgOverrideAmt" min="0" step="1000"
            placeholder="Nhập số tiền override (tuỳ chọn)">
        </div>
      </div>
    `;

    $('cmDlgRejectBtn').onclick = async () => {
      dlg.classList.remove('open');
      await onReject();
    };
    $('cmDlgApproveBtn').onclick = async () => {
      const raw = ($('cmDlgOverrideAmt')?.value || '').trim();
      let overrideAmt = null;
      if (raw !== '') {
        const v = Math.round(Number(raw.replace(/[^\d]/g, '')) || 0);
        if (!v) { ui.toast('Số tiền override không hợp lệ', 'error'); return; }
        overrideAmt = v;
      }
      dlg.classList.remove('open');
      await onApprove(overrideAmt);
    };
  }

  function closeDialog() { $('cmDlg').classList.remove('open'); }

  // ---- Init ----
  $('chkShowAll').addEventListener('change', () => {
    showAll = $('chkShowAll').checked;
    loadAll();
  });
  $('btnRefresh').addEventListener('click', loadAll);
  $('cmDlgCloseBtn').addEventListener('click', closeDialog);
  $('cmDlg').addEventListener('click', e => { if (e.target === $('cmDlg')) closeDialog(); });

  loadAll();
})();
