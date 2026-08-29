// Trang doi soat nhan tien cua nhan vien
// Admin xem danh sach cac lan NV khai bao nhan tien va tick "Da doi soat"

(function () {
  const $ = id => document.getElementById(id);
  const fmtN = new Intl.NumberFormat('vi-VN');
  const fmt = n => fmtN.format(Number(n) || 0);
  function toInputDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function getDefaultDateRange() {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 7);
    return { from: toInputDate(from), to: toInputDate(to) };
  }

  function fmtDateTime(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d);
    const dd = String(dt.getDate()).padStart(2,'0');
    const mm = String(dt.getMonth()+1).padStart(2,'0');
    const hh = String(dt.getHours()).padStart(2,'0');
    const mn = String(dt.getMinutes()).padStart(2,'0');
    return `${dd}/${mm}/${dt.getFullYear()} ${hh}:${mn}`;
  }

  const METHOD_LABEL = { cash: 'Tiền mặt', transfer: 'Chuyển khoản', mixed: 'Hỗn hợp' };

  const currentUser = auth.user();
  const canDelete   = currentUser && currentUser.role === 'admin';

  const state = { page: 1, total: 0, limit: 50, rows: [] };

  function getFilters() {
    return {
      search:    $('filterSearch').value.trim(),
      reviewed:  $('filterReviewed').value,
      status:    $('filterStatus').value,
      staff_id:  $('filterStaff').value,
      date_from: $('filterFrom').value,
      date_to:   $('filterTo').value,
    };
  }

  async function load() {
    const f = getFilters();
    const params = new URLSearchParams({ page: state.page, limit: state.limit });
    if (f.search)           params.set('search',    f.search);
    // Phieu da huy luon co reviewed=0 -> bo qua loc "da soat/chua soat" cho de xem
    if (f.reviewed !== '' && f.status !== 'cancelled') params.set('reviewed', f.reviewed);
    if (f.status)           params.set('status',    f.status);
    if (f.staff_id)         params.set('staff_id',  f.staff_id);
    if (f.date_from)        params.set('date_from', f.date_from);
    if (f.date_to)          params.set('date_to',   f.date_to);

    const data = await api.get(`/admin/staff-receipts?${params}`, { onError: 'toast' });
    if (!data) return;

    state.rows  = data.rows;
    state.total = data.total;

    renderSummary(data);
    renderTableV2(data.rows);
    renderPagination(data.total, data.page, data.limit);

    // Hien nut "Doi soat tat ca" neu co ban ghi chua kiem tra
    $('btnReviewAll').style.display = (f.reviewed === '0' && data.rows.some(r => r.status !== 'cancelled')) ? '' : 'none';
  }

  function renderSummary(data) {
    const pending = data.pending_count || 0;
    const totalAmt = data.rows.reduce((s, r) => s + r.amount, 0);
    $('summaryBar').innerHTML = `
      <div class="sb-item">
        <span>Chưa đối soát:</span>
        <span class="sb-val ${pending > 0 ? 'red' : 'green'}">${pending} khoản</span>
      </div>
      <div class="sb-item">
        <span>Tổng tiền (trang này):</span>
        <span class="sb-val">${fmt(totalAmt)}đ</span>
      </div>
      <div class="sb-item">
        <span>Tổng bản ghi:</span>
        <span class="sb-val">${data.total}</span>
      </div>
    `;
  }

  function ensureCompactLayout() {
    const table = document.querySelector('.sr-table');
    const headRow = table && table.querySelector('thead tr');
    if (headRow && !headRow.dataset.compactDone) {
      const heads = headRow.querySelectorAll('th');
      if (heads[0]) heads[0].textContent = 'Mã NNT';
      if (heads[1]) heads[1].remove();
      if (heads[5]) heads[5].textContent = 'Số tiền / HT';
      if (heads[6]) heads[6].remove();
      headRow.dataset.compactDone = '1';
    }

    const modalBox = $('imgModal')?.firstElementChild;
    const oldImg = $('imgModalSrc');
    if (modalBox && oldImg) {
      modalBox.style.maxWidth = '90vw';
      modalBox.style.maxHeight = '90vh';
      modalBox.style.background = '#000';
      modalBox.style.borderRadius = '10px';
      modalBox.style.overflow = 'hidden';
      oldImg.style.maxWidth = '90vw';
      oldImg.style.maxHeight = '85vh';
      oldImg.style.display = 'block';
    }

    const body = $('imgModalBody');
    if (body) {
      body.remove();
    }
  }

  function renderTable(rows) {
    if (!rows.length) {
      $('srTbody').innerHTML = `<tr><td colspan="11" style="text-align:center;padding:40px;color:#94a3b8">Không có dữ liệu</td></tr>`;
      return;
    }

    $('srTbody').innerHTML = rows.map(r => {
      const refHtml = r.request_id
        ? `<a class="ref-link" href="/admin/payment-request-detail.html?id=${r.request_id}" target="_blank">${esc(r.request_code || 'YC-...')}</a>`
        : r.order_id
          ? `<button class="ref-link" style="background:none;border:none;padding:0;cursor:pointer;font-size:inherit" data-order-id="${r.order_id}">${esc(r.order_code || 'ORD-...')}</button>`
          : '—';

      const proofCount = (r.proof_urls || []).length;
      const proofHtml = proofCount
        ? `<button type="button" class="proof-btn" data-proof="${r.id}">🖼 ${proofCount} ảnh</button>`
        : '—';

      const statusHtml = r.reviewed
        ? `<span class="pill green">✓ Đã soát</span><div style="font-size:11px;color:#64748b;margin-top:2px">${fmtDateTime(r.reviewed_at)}</div>`
        : `<span class="pill amber">Chờ soát</span>`;

      const reviewBtn = r.reviewed
        ? `<button class="btn ghost sm" data-undo="${r.id}" title="Gỡ soát">↩</button>`
        : `<button class="btn sm" data-review="${r.id}" style="background:#16a34a;color:#fff">✓ Đã soát</button>`;
      const deleteBtn = canDelete
        ? `<button class="btn ghost sm" data-delete="${r.id}" style="color:#dc2626" title="Xoá">✕</button>`
        : `<button class="btn ghost sm" data-del-guard="${r.id}" data-owner="${r.staff_id}" style="color:#94a3b8;opacity:.4" title="Chỉ admin mới xoá được">✕</button>`;
      const actionHtml = reviewBtn + ' ' + deleteBtn;

      return `
        <tr>
          <td class="code-cell"><b>${esc(r.code)}</b><div class="code-sub">${fmtDateTime(r.created_at)}</div></td>
          <td>${esc(r.staff_name || '—')}</td>
          <td class="cust-cell">
            <div class="cust-name">${esc(r.customer_name || '—')}</div>
            <div class="cust-phone">${esc(r.customer_phone || '')}</div>
          </td>
          <td>${refHtml}</td>
          <td class="num money-cell"><div class="money-amt">${fmt(r.amount)}đ</div><div class="money-method">${esc(METHOD_LABEL[r.pay_method] || r.pay_method)}</div></td>
          <td style="max-width:200px;word-break:break-word">${esc(r.note || '—')}</td>
          <td>${proofHtml}</td>
          <td>${statusHtml}</td>
          <td>${actionHtml}</td>
        </tr>
      `;
    }).join('');

    // Click vao ma don -> mo quick view dialog
    $('srTbody').querySelectorAll('[data-order-id]').forEach(btn => {
      btn.addEventListener('click', () => orderQuickView.open(Number(btn.dataset.orderId)));
    });
    // Wire up buttons
    $('srTbody').querySelectorAll('[data-review]').forEach(btn => {
      btn.addEventListener('click', () => reviewOne(Number(btn.dataset.review)));
    });
    $('srTbody').querySelectorAll('[data-undo]').forEach(btn => {
      btn.addEventListener('click', () => undoReview(Number(btn.dataset.undo)));
    });
    $('srTbody').querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => deleteOne(Number(btn.dataset.delete)));
    });
    // Nut xoa ghost cho staff/KTV: canh bao khi bam, chan khi xac nhan
    $('srTbody').querySelectorAll('[data-del-guard]').forEach(btn => {
      btn.addEventListener('click', () => guardDelete(Number(btn.dataset.delGuard), Number(btn.dataset.owner)));
    });
    $('srTbody').querySelectorAll('[data-proof]').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = state.rows.find(r => r.id === Number(btn.dataset.proof));
        openImgModal(row?.proof_urls || []);
      });
    });
  }

  function renderTableV2(rows) {
    if (!rows.length) {
      $('srTbody').innerHTML = `<tr><td colspan="11" style="text-align:center;padding:40px;color:#94a3b8">Không có dữ liệu</td></tr>`;
      return;
    }

    $('srTbody').innerHTML = rows.map(r => {
      const refHtml = r.request_id
        ? `<a class="ref-link" href="/admin/payment-request-detail.html?id=${r.request_id}" target="_blank">${esc(r.request_code || 'YC-...')}</a>`
        : r.order_id
          ? `<button class="ref-link" style="background:none;border:none;padding:0;cursor:pointer;font-size:inherit" data-order-id="${r.order_id}">${esc(r.order_code || 'ORD-...')}</button>`
          : '—';

      const proofCount = (r.proof_urls || []).length;
      const proofHtml = proofCount
        ? `<button type="button" class="proof-btn" data-proof="${r.id}">🖼 ${proofCount} ảnh</button>`
        : '—';

      const statusHtml = r.status === 'cancelled'
        ? `<span class="pill gray">Đã huỷ</span>` +
          (r.cancel_reason
            ? `<div style="font-size:11px;color:#64748b;margin-top:3px;max-width:220px;white-space:normal" title="${esc(r.cancel_reason)}">📝 ${esc(r.cancel_reason)}</div>`
            : '') +
          (r.cancelled_at
            ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px">${esc(r.cancelled_by_name || '')} · ${fmtDateTime(r.cancelled_at)}</div>`
            : '')
        : r.reviewed
          ? `<span class="pill green">Đã soát</span><div style="font-size:11px;color:#64748b;margin-top:2px">${fmtDateTime(r.reviewed_at)}</div>`
          : `<span class="pill amber">Chờ soát</span>`;

      const reviewBtn = r.status === 'cancelled'
        ? ''
        : r.reviewed
          ? `<button class="btn ghost sm" data-undo="${r.id}" title="Gỡ soát">↩</button>`
          : `<button class="btn sm" data-review="${r.id}" style="background:#16a34a;color:#fff">Đã soát</button>`;
      const cancelBtn = canDelete && r.status !== 'cancelled'
        ? `<button class="btn ghost sm" data-cancel="${r.id}" style="color:#dc2626" title="Huỷ">Huỷ</button>`
        : '';
      const actionHtml = reviewBtn + ' ' + cancelBtn;

      return `
        <tr>
          <td class="code-cell"><b>${esc(r.code)}</b><div class="code-sub">${fmtDateTime(r.created_at)}</div></td>
          <td>${esc(r.staff_name || '—')}</td>
          <td class="cust-cell">
            <div class="cust-name">${esc(r.customer_name || '—')}</div>
            <div class="cust-phone">${esc(r.customer_phone || '')}</div>
          </td>
          <td>${refHtml}</td>
          <td class="num money-cell"><div class="money-amt">${fmt(r.amount)}đ</div><div class="money-method">${esc(METHOD_LABEL[r.pay_method] || r.pay_method)}</div></td>
          <td style="max-width:200px;word-break:break-word">${esc(r.note || '—')}</td>
          <td>${proofHtml}</td>
          <td>${statusHtml}</td>
          <td>${actionHtml}</td>
        </tr>
      `;
    }).join('');

    $('srTbody').querySelectorAll('[data-order-id]').forEach(btn => {
      btn.addEventListener('click', () => orderQuickView.open(Number(btn.dataset.orderId)));
    });
    $('srTbody').querySelectorAll('[data-review]').forEach(btn => {
      btn.addEventListener('click', () => reviewOne(Number(btn.dataset.review)));
    });
    $('srTbody').querySelectorAll('[data-undo]').forEach(btn => {
      btn.addEventListener('click', () => undoReview(Number(btn.dataset.undo)));
    });
    $('srTbody').querySelectorAll('[data-cancel]').forEach(btn => {
      btn.addEventListener('click', () => cancelOne(Number(btn.dataset.cancel)));
    });
    $('srTbody').querySelectorAll('[data-proof]').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = state.rows.find(r => r.id === Number(btn.dataset.proof));
        openImgModal(row?.proof_urls || []);
      });
    });
  }

  function renderPagination(total, page, limit) {
    const pages = Math.ceil(total / limit) || 1;
    if (pages <= 1) { $('pagination').innerHTML = ''; return; }
    const items = [];
    if (page > 1) items.push(`<button class="btn ghost sm" data-pg="${page-1}">‹ Trước</button>`);
    items.push(`<span style="color:#64748b">Trang ${page} / ${pages} · ${total} bản ghi</span>`);
    if (page < pages) items.push(`<button class="btn ghost sm" data-pg="${page+1}">Sau ›</button>`);
    $('pagination').innerHTML = items.join('');
    $('pagination').querySelectorAll('[data-pg]').forEach(btn => {
      btn.addEventListener('click', () => { state.page = Number(btn.dataset.pg); load(); });
    });
  }

  async function reviewOne(id) {
    const r = await api.post(`/admin/staff-receipts/${id}/review`, {}, { onError: 'toast' });
    if (r) load();
  }

  async function undoReview(id) {
    const r = await api.post(`/admin/staff-receipts/${id}/unreviewed`, {}, { onError: 'toast' });
    if (r) load();
  }

  const MIN_CANCEL_REASON = 10;
  let cancelTargetId = null;

  function openCancelModal(id) {
    cancelTargetId = id;
    $('cancelReason').value = '';
    updateCancelHint();
    $('cancelModal').style.display = 'flex';
    setTimeout(() => $('cancelReason').focus(), 50);
  }

  function closeCancelModal() {
    $('cancelModal').style.display = 'none';
    cancelTargetId = null;
  }

  function updateCancelHint() {
    const len = $('cancelReason').value.trim().length;
    const remain = MIN_CANCEL_REASON - len;
    const hint = $('cancelReasonHint');
    const btn = $('cancelModalConfirm');
    if (remain > 0) {
      hint.style.color = '#dc2626';
      hint.textContent = `Cần thêm ${remain} ký tự nữa (tối thiểu ${MIN_CANCEL_REASON}).`;
      btn.disabled = true;
      btn.style.opacity = '.5';
      btn.style.cursor = 'not-allowed';
    } else {
      hint.style.color = '#16a34a';
      hint.textContent = `Đã đủ (${len} ký tự).`;
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    }
  }

  async function cancelOne(id) {
    openCancelModal(id);
  }

  async function submitCancel() {
    if (cancelTargetId == null) return;
    const reason = $('cancelReason').value.trim();
    if (reason.length < MIN_CANCEL_REASON) { updateCancelHint(); return; }
    const id = cancelTargetId;
    ui.loading(true);
    try {
      const r = await api.post(`/admin/staff-receipts/${id}/cancel`, { reason }, { onError: 'toast' });
      if (r) {
        ui.toast('Đã huỷ phiếu và hoàn lại tiền trên đơn', 'success');
        closeCancelModal();
        load();
      }
    } finally {
      ui.loading(false);
    }
  }

  async function reviewAll() {
    const ids = state.rows.filter(r => !r.reviewed && r.status !== 'cancelled').map(r => r.id);
    if (!ids.length) return;
    if (!confirm(`Đánh dấu đã đối soát ${ids.length} khoản này?`)) return;
    ui.loading(true);
    try {
      await Promise.all(ids.map(id => api.post(`/admin/staff-receipts/${id}/review`, {})));
      ui.toast('Đã đối soát tất cả', 'success');
      load();
    } finally {
      ui.loading(false);
    }
  }

  async function deleteOne(id) {
    if (!confirm('Xoá khoản nhận tiền này?\nHành động không thể hoàn tác.')) return;
    const r = await api.delete(`/admin/staff-receipts/${id}`, { onError: 'toast' });
    if (r) { ui.toast('Đã xoá', 'success'); load(); }
  }

  // Canh bao khi staff/KTV co xoa: hien thong bao, chan luu
  function guardDelete(_id, ownerStaffId) {
    const isOwn = currentUser && currentUser.id === ownerStaffId;
    const msg = isOwn
      ? 'Lịch sử nhận tiền không thể xoá.\nNếu có sai sót, liên hệ admin để xử lý.'
      : 'Bạn không thể xoá khoản này vì không phải của bạn.\nChỉ admin mới được xoá.';
    // Hien thi canh bao (FE only) — khong goi API
    alert(msg);
  }

  function openImgModal(urls) {
    const img = $('imgModalSrc');
    if (!img) return;
    const list = Array.isArray(urls) ? urls.filter(Boolean) : (urls ? [urls] : []);
    img.src = list[0] || '';
    img.alt = list[0] ? 'ảnh đối soát' : '';
    $('imgModal').style.display = 'flex';
    $('imgModal').style.alignItems = 'center';
    $('imgModal').style.justifyContent = 'center';
  }

  // Escaping cho security
  function esc(s) {
    return String(s == null ? '' : s)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  }

  async function loadStaffList() {
    const data = await api.get('/admin/staff?limit=200', { onError: null });
    if (!data) return;
    const list = data.items || data.rows || data.staff || [];
    const sel = $('filterStaff');
    list.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.full_name || s.name || `NV #${s.id}`;
      sel.appendChild(opt);
    });
  }

  // ─── Khoi dong ───────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', () => {
    adminShell.init('staff-receipts');
    ensureCompactLayout();
  });

  $('filterReviewed').addEventListener('change', () => { state.page = 1; load(); });
  $('filterStatus').addEventListener('change',   () => { state.page = 1; load(); });
  $('filterStaff').addEventListener('change',    () => { state.page = 1; load(); });
  $('filterFrom').addEventListener('change',     () => { state.page = 1; load(); });
  $('filterTo').addEventListener('change',       () => { state.page = 1; load(); });
  // Search: debounce go phim + submit
  let searchTimer = null;
  $('filterSearch').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.page = 1; load(); }, 350);
  });
  $('filterSearch').addEventListener('keydown', e => {
    if (e.key === 'Enter') { clearTimeout(searchTimer); state.page = 1; load(); }
  });
  $('btnReload').addEventListener('click', load);
  $('btnReviewAll').addEventListener('click', reviewAll);
  $('btnClearFilter').addEventListener('click', () => {
    const range = getDefaultDateRange();
    $('filterSearch').value = '';
    $('filterReviewed').value = '0';
    $('filterStatus').value = 'active';
    $('filterStaff').value = '';
    $('filterFrom').value = range.from;
    $('filterTo').value = range.to;
    state.page = 1;
    load();
  });

  $('imgModalClose').addEventListener('click', () => { $('imgModal').style.display = 'none'; });
  $('imgModal').addEventListener('click', e => {
    if (e.target === $('imgModal')) $('imgModal').style.display = 'none';
  });

  // Cancel modal events
  $('cancelReason').addEventListener('input', updateCancelHint);
  $('cancelModalConfirm').addEventListener('click', submitCancel);
  $('cancelModalAbort').addEventListener('click', closeCancelModal);
  $('cancelModal').addEventListener('click', e => {
    if (e.target === $('cancelModal')) closeCancelModal();
  });

  // Set ngay mac dinh = 7 ngay truoc -> hom nay
  const defaultRange = getDefaultDateRange();
  $('filterFrom').value = defaultRange.from;
  $('filterTo').value   = defaultRange.to;

  loadStaffList();
  load();
})();
