// Trang tong ket don cua KTV: filter + bang chi tiet + cac the tong.

(function () {
  const $ = (id) => document.getElementById(id);

  function esc(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }
  function fmt(n) {
    return (Number(n) || 0).toLocaleString('vi-VN');
  }
  function fmtDate(d) {
    if (!d) return '';
    return String(d).replace('T', ' ').slice(0, 10);
  }
  const STATUS_LABEL = {
    pending: 'Chờ duyệt', confirmed: 'Đã duyệt',
    in_progress: 'Đang làm', done: 'Hoàn thành', cancelled: 'Đã huỷ',
  };

  let debounceTimer = null;

  function buildQuery() {
    const p = new URLSearchParams();
    const q = $('fQ').value.trim();
    const s = $('fStatus').value;
    const f = $('fFrom').value;
    const t = $('fTo').value;
    if (q) p.set('q', q);
    if (s) p.set('status', s);
    if (f) p.set('date_from', f);
    if (t) p.set('date_to', t);
    return p.toString();
  }

  function renderTotals(t) {
    $('kOrders').textContent  = fmt(t.order_count);
    $('kTotal').textContent   = fmt(t.total_amount);
    $('kPaid').textContent    = fmt(t.total_paid);
    $('kDebt').textContent    = fmt(t.total_debt);
    $('kUnremit').textContent = fmt(t.total_unremitted);
    $('kRemit').textContent   = fmt(t.total_remitted);
    $('kWage').textContent       = fmt(t.total_wage);
    $('kCommission').textContent = fmt(t.total_commission);
  }

  function renderRows(items) {
    const tb = $('tbody');
    if (!items.length) {
      tb.innerHTML = '<tr><td colspan="11" class="empty">Không có đơn nào khớp lọc</td></tr>';
      return;
    }
    tb.innerHTML = items.map(o => {
      const date = fmtDate(o.completed_at || o.due_at || o.created_at);
      const cust = [o.customer_name, o.customer_phone].filter(Boolean).join(' · ');
      const stCls = o.status || '';
      const stLbl = STATUS_LABEL[o.status] || o.status || '—';
      return `<tr data-id="${o.id}">
        <td><b>${esc(o.code)}</b></td>
        <td>${esc(date)}</td>
        <td>${esc(cust)}</td>
        <td><span class="pill ${stCls}">${esc(stLbl)}</span></td>
        <td class="num">${fmt(o.total_amount)}</td>
        <td class="num">${fmt(o.paid_amount)}</td>
        <td class="num" style="color:${Number(o.debt_amount) > 0 ? '#dc2626' : '#94a3b8'}">${fmt(o.debt_amount)}</td>
        <td class="num" style="color:${Number(o.unremitted_amount) > 0 ? '#b45309' : '#94a3b8'}">${fmt(o.unremitted_amount)}</td>
        <td class="num">${fmt(o.remitted_amount)}</td>
        <td class="num" style="color:${o.status === 'done' ? '#16a34a' : '#94a3b8'}">${fmt(o.wage_amount)}</td>
        <td class="num" style="color:${Number(o.commission_amount) > 0 ? '#7c3aed' : '#94a3b8'}">${fmt(o.commission_amount)}</td>
      </tr>`;
    }).join('');
  }

  async function load() {
    const qs = buildQuery();
    $('tbody').innerHTML = '<tr><td colspan="10" class="empty">Đang tải…</td></tr>';
    const r = await api.get('/kithuat/summary' + (qs ? '?' + qs : ''));
    if (!r) return;
    renderTotals(r.totals || {});
    renderRows(r.items || []);
  }

  function bindFilters() {
    $('fQ').addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(load, 350);
    });
    ['fStatus', 'fFrom', 'fTo'].forEach(id => {
      $(id).addEventListener('change', load);
    });
    $('btnReset').addEventListener('click', () => {
      $('fQ').value = '';
      $('fStatus').value = '';
      $('fFrom').value = '';
      $('fTo').value = '';
      load();
    });

    // Click row -> mo tab cong viec voi tim kiem ma don
    $('tbody').addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-id]');
      if (!tr) return;
      const code = tr.querySelector('td b')?.textContent || '';
      if (code) window.location.href = '/kithuat/tasks.html?q=' + encodeURIComponent(code);
    });
  }

  function init() {
    techShell.init('summary');
    bindFilters();
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
