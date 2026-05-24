// Trang doi soat nhan tien cua nhan vien
// Admin xem danh sach cac lan NV khai bao nhan tien va tick "Da doi soat"

(function () {
  const $ = id => document.getElementById(id);
  const fmtN = new Intl.NumberFormat('vi-VN');
  const fmt = n => fmtN.format(Number(n) || 0);

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
      reviewed:  $('filterReviewed').value,
      staff_id:  $('filterStaff').value,
      date_from: $('filterFrom').value,
      date_to:   $('filterTo').value,
    };
  }

  async function load() {
    const f = getFilters();
    const params = new URLSearchParams({ page: state.page, limit: state.limit });
    if (f.reviewed !== '')  params.set('reviewed',  f.reviewed);
    if (f.staff_id)         params.set('staff_id',  f.staff_id);
    if (f.date_from)        params.set('date_from', f.date_from);
    if (f.date_to)          params.set('date_to',   f.date_to);

    const data = await api.get(`/admin/staff-receipts?${params}`, { onError: 'toast' });
    if (!data) return;

    state.rows  = data.rows;
    state.total = data.total;

    renderSummary(data);
    renderTable(data.rows);
    renderPagination(data.total, data.page, data.limit);

    // Hien nut "Doi soat tat ca" neu co ban ghi chua kiem tra
    $('btnReviewAll').style.display = (f.reviewed === '0' && data.rows.length > 0) ? '' : 'none';
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

      const proofHtml = (r.proof_urls || []).length
        ? r.proof_urls.map(u => `<img class="proof-thumb" src="${esc(u)}" data-full="${esc(u)}" />`).join('')
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
          <td><b>${esc(r.code)}</b></td>
          <td style="white-space:nowrap">${fmtDateTime(r.created_at)}</td>
          <td>${esc(r.staff_name || '—')}</td>
          <td>
            <div style="font-weight:600">${esc(r.customer_name || '—')}</div>
            <div style="font-size:12px;color:#64748b">${esc(r.customer_phone || '')}</div>
          </td>
          <td>${refHtml}</td>
          <td class="num">${fmt(r.amount)}đ</td>
          <td>${esc(METHOD_LABEL[r.pay_method] || r.pay_method)}</td>
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
    // Xem anh phong to
    $('srTbody').querySelectorAll('.proof-thumb').forEach(img => {
      img.addEventListener('click', () => openImgModal(img.dataset.full));
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

  async function reviewAll() {
    const ids = state.rows.filter(r => !r.reviewed).map(r => r.id);
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
  function guardDelete(id, ownerStaffId) {
    const isOwn = currentUser && currentUser.id === ownerStaffId;
    const msg = isOwn
      ? 'Lịch sử nhận tiền không thể xoá.\nNếu có sai sót, liên hệ admin để xử lý.'
      : 'Bạn không thể xoá khoản này vì không phải của bạn.\nChỉ admin mới được xoá.';
    // Hien thi canh bao (FE only) — khong goi API
    alert(msg);
  }

  function openImgModal(url) {
    $('imgModalSrc').src = url;
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
    const list = data.rows || data.staff || data || [];
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
  });

  $('filterReviewed').addEventListener('change', () => { state.page = 1; load(); });
  $('filterStaff').addEventListener('change',    () => { state.page = 1; load(); });
  $('filterFrom').addEventListener('change',     () => { state.page = 1; load(); });
  $('filterTo').addEventListener('change',       () => { state.page = 1; load(); });
  $('btnReload').addEventListener('click', load);
  $('btnReviewAll').addEventListener('click', reviewAll);
  $('btnClearFilter').addEventListener('click', () => {
    $('filterReviewed').value = '0';
    $('filterStaff').value = '';
    $('filterFrom').value = '';
    $('filterTo').value = '';
    state.page = 1;
    load();
  });

  $('imgModalClose').addEventListener('click', () => { $('imgModal').style.display = 'none'; });
  $('imgModal').addEventListener('click', e => {
    if (e.target === $('imgModal')) $('imgModal').style.display = 'none';
  });

  // Set ngay mac dinh = hom nay
  const today = new Date().toISOString().slice(0, 10);
  $('filterFrom').value = today;
  $('filterTo').value   = today;

  loadStaffList();
  load();
})();
