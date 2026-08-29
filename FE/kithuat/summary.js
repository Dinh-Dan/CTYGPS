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
  let lastItems = [];

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
    $('badgeAssigned').textContent = Number(t.order_count) || 0;
    $('kOrders').textContent  = fmt(t.order_count);
    $('kTotal').textContent   = fmt(t.total_amount);
    $('kPaid').textContent    = fmt(t.total_paid);
    $('kDebt').textContent    = fmt(t.total_debt);
    $('kUnremit').textContent = fmt(t.total_unremitted);
    $('kRemit').textContent   = fmt(t.total_remitted);
    $('kWage').textContent       = fmt(t.total_wage);
    $('kCommission').textContent = fmt(t.total_commission);
  }

  function commPill(o) {
    const techAmt = Number(o.tech_commission_amount) || 0;
    const staffAmt = Number(o.assigned_staff_commission_amount) || 0;
    const totalAmt = techAmt + staffAmt;

    const hasPayslip = !!o.payslip_id || !!o.assigned_staff_commission_payslip_id;
    const hasApproved = !!o.tech_commission_approved_at || !!o.assigned_staff_commission_approved_at;
    const hasRequested = !!o.tech_commission_requested_at || !!o.assigned_staff_commission_requested_at;

    if (!totalAmt && !hasRequested) return '<span style="color:#94a3b8">—</span>';
    if (hasPayslip) {
      return `<span style="display:inline-flex;align-items:center;gap:6px;color:#166534;font-weight:700" title="Đã tính lương">
        <span>${fmt(totalAmt)}</span>
        <span class="pill comm-payslip" aria-label="Đã tính lương" style="padding:1px 6px;line-height:1">✓</span>
      </span>`;
    }
    if (hasApproved) {
      return `<span style="display:inline-flex;align-items:center;gap:6px;color:#7c3aed;font-weight:700" title="Đã duyệt">
        <span>${fmt(totalAmt)}</span>
        <span class="pill comm-approved" aria-label="Đã duyệt" style="padding:1px 6px;line-height:1">✓</span>
      </span>`;
    }
    if (hasRequested) return `<span style="color:#7c3aed;font-weight:700" title="Chờ duyệt">${fmt(totalAmt)}</span>`;
    return `<span style="color:#7c3aed;font-weight:700">${fmt(totalAmt)}</span>`;
  }

  function filterByComm(items) {
    const v = $('fComm').value;
    if (!v) return items;
    return items.filter(o => {
      const hasApproved = !!o.tech_commission_approved_at || !!o.assigned_staff_commission_approved_at;
      const hasRequested = !!o.tech_commission_requested_at || !!o.assigned_staff_commission_requested_at;
      if (v === 'approved') return hasApproved;
      if (v === 'requested') return hasRequested && !hasApproved;
      if (v === 'none') return !hasRequested;
      return true;
    });
  }

  function renderRows(items) {
    const filtered = filterByComm(items);
    const tb = $('tbody');
    if (!filtered.length) {
      tb.innerHTML = '<tr><td colspan="11" class="empty">Không có đơn nào khớp lọc</td></tr>';
      return;
    }
    tb.innerHTML = filtered.map(o => {
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
        <td class="num">${commPill(o)}</td>
      </tr>`;
    }).join('');
  }

  function commPillStaff(o) {
    const amt = Number(o.staff_commission_amount) || 0;
    if (o.comm_payslip_id) return `<span class="pill comm-payslip">Đã tính lương: ${fmt(amt)}</span>`;
    if (o.comm_approved_at) return `<span class="pill comm-approved">Đã duyệt: ${fmt(amt)}</span>`;
    if (o.comm_requested_at) return `<span class="pill comm-pending">Chờ duyệt: ${fmt(amt)}</span>`;
    return `<span style="color:#94a3b8">${fmt(amt)}</span>`;
  }

  function renderCommItems(items) {
    $('badgeOther').textContent  = items.length;
    $('kCommOrders').textContent = fmt(items.length);
    $('kCommTotal').textContent  = fmt(items.reduce((s, o) => s + (Number(o.staff_commission_amount) || 0), 0));
    $('tbodyComm').innerHTML = items.map(o => {
      const date = fmtDate(o.completed_at || o.due_at || o.created_at);
      const cust = [o.customer_name, o.customer_phone].filter(Boolean).join(' · ');
      return `<tr data-id="${o.id}">
        <td><b>${esc(o.code)}</b></td>
        <td>${esc(date)}</td>
        <td>${esc(cust)}</td>
        <td><span class="pill ${o.status || ''}">${esc(STATUS_LABEL[o.status] || o.status || '—')}</span></td>
        <td>${esc(o.assigned_name || '—')}</td>
        <td class="num">${fmt(o.total_amount)}</td>
        <td class="num">${commPillStaff(o)}</td>
      </tr>`;
    }).join('');
  }

  async function load() {
    const qs = buildQuery();
    $('tbody').innerHTML = '<tr><td colspan="10" class="empty">Đang tải…</td></tr>';
    const r = await api.get('/kithuat/summary' + (qs ? '?' + qs : ''));
    if (!r) return;
    lastItems = r.items || [];
    renderTotals(r.totals || {});
    renderRows(lastItems);
    renderCommItems(r.commission_items || []);
  }

  function applyCommFilter() {
    renderRows(lastItems);
  }

  function bindFilters() {
    $('fQ').addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(load, 350);
    });
    ['fStatus', 'fFrom', 'fTo'].forEach(id => {
      $(id).addEventListener('change', load);
    });
    $('fComm').addEventListener('change', applyCommFilter);
    $('btnReset').addEventListener('click', () => {
      $('fQ').value = '';
      $('fStatus').value = '';
      $('fFrom').value = '';
      $('fTo').value = '';
      $('fComm').value = '';
      load();
    });

    function openOrder(e) {
      const tr = e.target.closest('tr[data-id]');
      if (!tr) return;
      const code = tr.querySelector('td b')?.textContent || '';
      if (code) window.location.href = '/kithuat/tasks.html?q=' + encodeURIComponent(code);
    }
    $('tbody').addEventListener('click', openOrder);
    $('tbodyComm').addEventListener('click', openOrder);
  }

  function bindTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        $('panel' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
        // an filter hoa hong khi sang tab 2
        $('wrapFComm').style.display = tab === 'assigned' ? '' : 'none';
      });
    });
  }

  function init() {
    techShell.init('summary');
    bindTabs();
    bindFilters();
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
