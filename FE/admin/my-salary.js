// /admin/my-salary.html — Nhân viên tự xem đơn, hoa hồng, ứng lương, phiếu lương của mình

(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');
  function fmtM(n) { return fmt.format(Math.round(Number(n) || 0)); }
  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d); if (isNaN(dt)) return String(d).slice(0,10);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
  }
  function fmtDateS(d) {
    if (!d) return '—';
    const dt = new Date(d); if (isNaN(dt)) return String(d).slice(0,10);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`;
  }
  function fmtDateTime(v) {
    if (!v) return '—';
    const d = new Date(v);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  const STATUS_LABEL = {
    pending: 'Chờ duyệt', confirmed: 'Đã duyệt',
    in_progress: 'Đang làm', done: 'Hoàn thành', cancelled: 'Đã huỷ',
  };

  let debounceTimer = null;
  let lastItems = [];
  let slipCache = [];

  // ================================================================
  // TABS
  // ================================================================
  function bindTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        $('panel' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');

        // filter bar an khi o tab adv / slips
        const hideFilter = (tab === 'adv' || tab === 'slips');
        $('filterBar').style.display = hideFilter ? 'none' : '';
        // filter hoa hong chi hien o tab 1
        $('wrapFComm').style.display = tab === 'assigned' ? '' : 'none';
      });
    });
  }

  // ================================================================
  // FILTER BAR
  // ================================================================
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

  function bindFilters() {
    $('fQ').addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadSummary, 350);
    });
    ['fStatus', 'fFrom', 'fTo'].forEach(id => {
      $(id).addEventListener('change', loadSummary);
    });
    $('fComm').addEventListener('change', () => renderRows(lastItems));
    $('btnReset').addEventListener('click', () => {
      $('fQ').value = ''; $('fStatus').value = '';
      $('fFrom').value = ''; $('fTo').value = ''; $('fComm').value = '';
      loadSummary();
    });
  }

  // ================================================================
  // TAB 1 + 2: SUMMARY (đơn + hoa hồng)
  // ================================================================
  function commPill(o) {
    const amt = Number(o.commission_amount) || 0;
    if (o.comm_payslip_id) return `<span class="pill comm-payslip">Đã tính lương: ${fmtM(amt)}</span>`;
    if (o.comm_approved_at) return `<span class="pill comm-approved">Đã duyệt: ${fmtM(amt)}</span>`;
    if (o.comm_requested_at) return `<span class="pill comm-pending">Chờ duyệt: ${fmtM(amt)}</span>`;
    if (amt) return `<span style="color:#94a3b8">${fmtM(amt)}</span>`;
    return '<span style="color:#94a3b8">—</span>';
  }

  function filterByComm(items) {
    const v = $('fComm').value;
    if (!v) return items;
    return items.filter(o => {
      if (v === 'approved') return !!o.comm_approved_at;
      if (v === 'requested') return !!o.comm_requested_at && !o.comm_approved_at;
      if (v === 'none') return !o.comm_requested_at;
      return true;
    });
  }

  function renderTotals(t) {
    $('badgeAssigned').textContent = Number(t.order_count) || 0;
    $('kOrders').textContent    = fmtM(t.order_count);
    $('kTotal').textContent     = fmtM(t.total_amount);
    $('kPaid').textContent      = fmtM(t.total_paid);
    $('kDebt').textContent      = fmtM(t.total_debt);
    $('kWage').textContent      = fmtM(t.total_wage);
    $('kCommission').textContent = fmtM(t.total_commission);
  }

  function renderRows(items) {
    const filtered = filterByComm(items);
    const tb = $('tbody');
    if (!filtered.length) {
      tb.innerHTML = '<tr><td colspan="9" class="empty">Không có đơn nào khớp lọc</td></tr>';
      return;
    }
    tb.innerHTML = filtered.map(o => {
      const date = fmtDateS(o.order_date);
      const cust = esc([o.customer_name, o.customer_phone].filter(Boolean).join(' · '));
      const stLbl = STATUS_LABEL[o.status] || o.status || '—';
      return `<tr>
        <td><b style="color:#1e40af">${esc(o.code)}</b></td>
        <td>${date}</td>
        <td>${cust}</td>
        <td><span class="pill ${o.status||''}">${esc(stLbl)}</span></td>
        <td class="num">${fmtM(o.total_amount)}</td>
        <td class="num" style="color:#16a34a">${fmtM(o.paid_amount)}</td>
        <td class="num" style="color:${Number(o.debt_amount)>0?'#dc2626':'#94a3b8'}">${fmtM(o.debt_amount)}</td>
        <td class="num" style="color:${o.status==='done'?'#0369a1':'#94a3b8'}">${fmtM(o.wage_amount)}</td>
        <td class="num">${commPill(o)}</td>
      </tr>`;
    }).join('');
  }

  function renderCommItems(items) {
    $('badgeOther').textContent  = items.length;
    $('kCommOrders').textContent = items.length;
    $('kCommTotal').textContent  = fmtM(items.reduce((s,o) => s + (Number(o.staff_commission_amount)||0), 0));
    $('tbodyComm').innerHTML = items.length ? items.map(o => {
      const cust = esc([o.customer_name, o.customer_phone].filter(Boolean).join(' · '));
      const stLbl = STATUS_LABEL[o.status] || o.status || '—';
      return `<tr>
        <td><b style="color:#1e40af">${esc(o.code)}</b></td>
        <td>${fmtDateS(o.order_date)}</td>
        <td>${cust}</td>
        <td><span class="pill ${o.status||''}">${esc(stLbl)}</span></td>
        <td>${esc(o.assigned_name||'—')}</td>
        <td class="num">${fmtM(o.total_amount)}</td>
        <td class="num" style="color:#7c3aed;font-weight:700">${fmtM(o.staff_commission_amount)}</td>
      </tr>`;
    }).join('') : '<tr><td colspan="7" class="empty">Không có hoa hồng đơn khác</td></tr>';
  }

  async function loadSummary() {
    const qs = buildQuery();
    $('tbody').innerHTML = '<tr><td colspan="9" class="empty">Đang tải…</td></tr>';
    const r = await api.get('/admin/staff/my-summary' + (qs ? '?' + qs : ''), { silent: true }).catch(() => null);
    if (!r) return;
    lastItems = r.items || [];
    renderTotals(r.totals || {});
    renderRows(lastItems);
    renderCommItems(r.commission_items || []);
  }

  // ================================================================
  // TAB 3: ỨNG LƯƠNG — dung bang staff_advances (co flow duyet)
  // ================================================================
  function defaultPeriod() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  }

  async function loadAdvances() {
    const wrap = $('advList');
    wrap.innerHTML = '<div class="empty-adv">Đang tải…</div>';
    const res = await api.get('/admin/staff/me/advances', { silent: true }).catch(() => null);
    const items = res?.items || [];
    if (!items.length) {
      wrap.innerHTML = '<div class="empty-adv">Chưa có phiếu ứng lương nào.</div>';
      return;
    }
    wrap.innerHTML = items.map(a => {
      const status = a.status || 'pending';
      let statusPill, rowCls = '', rowStyle = '';
      if (status === 'pending') {
        statusPill = '<span class="pill" style="background:#fef3c7;color:#92400e">⏳ Chờ duyệt</span>';
        rowCls = 'pending';
      } else if (status === 'approved') {
        statusPill = '<span class="pill" style="background:#dcfce7;color:#166534">✓ Đã duyệt</span>';
      } else {
        statusPill = '<span class="pill" style="background:#fee2e2;color:#991b1b">✗ Từ chối</span>';
        rowStyle = 'opacity:.8;border-left:4px solid #ef4444;background:#fff5f5';
      }

      return `<div class="adv-row ${rowCls}" style="${rowStyle}">
        <div class="adv-top">
          <span class="adv-amount">${fmtM(a.amount)}đ</span>
          ${statusPill}
          ${a.period ? `<span class="adv-period">Kỳ ${esc(a.period)}</span>` : ''}
          ${status === 'pending' ? `<button class="btn ghost sm btn-withdraw-adv" data-id="${a.id}"
            style="margin-left:auto;font-size:11px;color:#dc2626;border-color:#fecaca;padding:2px 8px">Rút yêu cầu</button>` : ''}
        </div>
        <div class="adv-meta">
          ${a.note ? `📝 ${esc(a.note)} · ` : ''}
          Gửi lúc: ${fmtDateTime(a.created_at)}
          ${status === 'approved' && a.approved_at ? `<br><span style="color:#15803d">✅ Duyệt lúc: ${fmtDateTime(a.approved_at)}</span>` : ''}
          ${status === 'rejected' && a.reject_reason ? `<br><span style="color:#dc2626">❌ Lý do từ chối: ${esc(a.reject_reason)}</span>` : ''}
          ${status === 'rejected' && !a.reject_reason ? `<br><span style="color:#dc2626">❌ Đã bị từ chối</span>` : ''}
        </div>
      </div>`;
    }).join('');

    wrap.querySelectorAll('.btn-withdraw-adv').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!await ui.confirm('Rút yêu cầu ứng lương này?')) return;
        const ok = await api.delete(`/admin/staff/me/advances/${btn.dataset.id}`, { onError: 'toast' });
        if (ok) { ui.toast('Đã rút yêu cầu', 'success'); loadAdvances(); }
      });
    });
  }

  async function submitAdvance() {
    const period = $('advPeriod').value;
    const amount = Money ? Money.get($('advAmount')) : Number(($('advAmount').value || '').replace(/\./g,'').replace(/,/g,''));
    const note   = $('advNote').value.trim();
    if (!period) { ui.toast('Chọn kỳ lương', 'warning'); return; }
    if (!amount || amount <= 0) { ui.toast('Nhập số tiền ứng', 'warning'); return; }

    $('btnSubmitAdv').disabled = true;
    const ok = await api.post('/admin/staff/me/advances', { period, amount, note: note || '' }, {
      successMessage: 'Đã gửi yêu cầu ứng lương, chờ admin duyệt',
    }).catch(() => null);
    $('btnSubmitAdv').disabled = false;
    if (!ok) return;
    $('advAmount').value = '';
    $('advNote').value = '';
    loadAdvances();
  }

  // ================================================================
  // TAB 4: PHIẾU LƯƠNG ĐÃ CHỐT
  // ================================================================
  async function loadSlips() {
    $('slipTbody').innerHTML = '<tr><td colspan="7" class="empty">Đang tải…</td></tr>';
    const res = await api.get('/admin/staff/my-payslip/list', { silent: true }).catch(() => null);
    slipCache = res?.items || [];
    if (!slipCache.length) {
      $('slipTbody').innerHTML = '<tr><td colspan="7" class="empty">Chưa có phiếu lương nào được chốt.</td></tr>';
      return;
    }
    $('slipTbody').innerHTML = slipCache.map(s => {
      const paid  = Number(s.paid_amount) || 0;
      const gross = Number(s.gross_amount) || 0;
      const debt  = Number(s.remaining_debt) || 0;
      let pill;
      if (paid > 0 && debt <= 0)     pill = '<span class="pill-paid">✓ Đã phát</span>';
      else if (paid > 0 && debt > 0) pill = `<span class="pill-debt">⚠ Còn nợ ${fmtM(debt)}đ</span>`;
      else                           pill = '<span class="pill-unpaid">Chưa phát</span>';
      return `<tr class="slip-row" data-id="${s.id}" style="cursor:pointer">
        <td>${fmtDate(s.from_date)} → ${fmtDate(s.to_date)}</td>
        <td class="num" style="color:#0369a1">${fmtM(s.total_wage)}đ</td>
        <td class="num" style="color:#7c3aed">${fmtM(s.total_extras)}đ</td>
        <td class="num" style="font-weight:700">${fmtM(gross)}đ</td>
        <td class="num" style="color:${paid>0?'#16a34a':'#94a3b8'}">${paid>0?fmtM(paid)+'đ':'—'}</td>
        <td>${pill}</td>
        <td style="font-size:12px;color:#64748b">${fmtDate(s.finalized_at)}</td>
      </tr>`;
    }).join('');
    $('slipTbody').querySelectorAll('.slip-row').forEach(row => {
      row.addEventListener('click', () => openSlipModal(Number(row.dataset.id)));
    });
  }

  function openSlipModal(id) {
    const s = slipCache.find(x => x.id === id);
    if (!s) return;
    const paid  = Number(s.paid_amount) || 0;
    const gross = Number(s.gross_amount) || 0;
    const debt  = Number(s.remaining_debt) || 0;

    $('slipModalTitle').textContent = `Phiếu lương ${fmtDate(s.from_date)} → ${fmtDate(s.to_date)}`;

    let rows = []; try { rows = s.rows_json ? JSON.parse(s.rows_json) : []; } catch {}
    let extras = []; try { extras = s.extras_json ? JSON.parse(s.extras_json) : []; } catch {}
    let deductions = []; try { deductions = s.deductions_json ? JSON.parse(s.deductions_json) : []; } catch {}
    let advances = []; try { advances = s.advances_json ? JSON.parse(s.advances_json) : []; } catch {}

    const totalWage     = rows.reduce((a,r) => a + (Number(r.wage)||0), 0);
    const totalComm     = rows.reduce((a,r) => a + (Number(r.commission)||0), 0);
    const totalAdvances = advances.reduce((a,a2) => a + (Number(a2.amount)||0), 0);

    const tbodyHtml = rows.map((r,i) => {
      const wage = Number(r.wage) || 0;
      const comm = Number(r.commission) || 0;
      const device = [r.bien_so, r.imei].filter(Boolean).join(' / ');
      const info = [r.tai_khoan ? `<span style="color:#0369a1">${esc(r.tai_khoan)}</span>` : null, device ? esc(device) : null].filter(Boolean).join('<br>') || '—';
      const badge = r.row_type === 'commission' ? '<span class="badge-comm">HH</span>' : '';
      return `<tr>
        <td style="color:#94a3b8;text-align:center">${i+1}</td>
        <td style="white-space:nowrap">${fmtDateS(r.date)}</td>
        <td style="font-weight:600">${esc(r.code)||'—'}${badge}</td>
        <td style="font-size:12px">${esc(r.service)||'—'}</td>
        <td style="font-size:11px;line-height:1.4">${info}</td>
        <td class="num" style="color:#0369a1">${wage?fmtM(wage)+'đ':'<span style="color:#e2e8f0">—</span>'}</td>
        <td class="num" style="color:#7c3aed">${comm?fmtM(comm)+'đ':'<span style="color:#e2e8f0">—</span>'}</td>
        <td class="num" style="font-weight:600">${fmtM(wage+comm)}đ</td>
      </tr>`;
    }).join('');

    let sumRows = '';
    if (Number(s.base_salary) > 0) sumRows += `<tr><td>Lương cứng</td><td>${fmtM(s.base_salary)} đ</td></tr>`;
    if (totalWage > 0) sumRows += `<tr><td>Tiền công</td><td style="color:#0369a1">${fmtM(totalWage)} đ</td></tr>`;
    if (totalComm > 0) sumRows += `<tr><td>Hoa hồng</td><td style="color:#7c3aed">${fmtM(totalComm)} đ</td></tr>`;
    for (const e of extras) sumRows += `<tr><td>+ ${esc(e.label)}</td><td>${fmtM(e.amount)} đ</td></tr>`;
    for (const e of deductions) sumRows += `<tr style="color:#dc2626"><td>− ${esc(e.label)}</td><td>− ${fmtM(e.amount)} đ</td></tr>`;
    if (totalAdvances > 0) sumRows += `<tr class="adv-row"><td>Tiền đã ứng</td><td>− ${fmtM(totalAdvances)} đ</td></tr>`;
    if (Number(s.carried_debt) > 0) sumRows += `<tr class="debt-row"><td>Nợ kỳ trước</td><td>+ ${fmtM(s.carried_debt)} đ</td></tr>`;
    sumRows += `<tr class="total-row"><td>Thực nhận</td><td>${fmtM(gross)} đ</td></tr>`;

    $('slipModalBody').innerHTML = `
      <div class="pv-meta-grid">
        <div class="pv-meta-item"><div class="lbl">Kỳ lương</div><div class="val">${fmtDate(s.from_date)} → ${fmtDate(s.to_date)}</div></div>
        <div class="pv-meta-item"><div class="lbl">Ngày chốt</div><div class="val">${fmtDate(s.finalized_at)}${s.finalized_by_name?' · '+esc(s.finalized_by_name):''}</div></div>
        <div class="pv-meta-item"><div class="lbl">Thực nhận</div><div class="val" style="color:#166534">${fmtM(gross)} đ</div></div>
        <div class="pv-meta-item"><div class="lbl">Thanh toán</div><div class="val">${paid>0?fmtM(paid)+'đ đã phát'+(debt>0?' · còn nợ '+fmtM(debt)+'đ':''):'Chưa phát'}</div></div>
        ${s.note?`<div class="pv-meta-item"><div class="lbl">Ghi chú</div><div class="val">${esc(s.note)}</div></div>`:''}
      </div>
      ${rows.length ? `
      <div style="overflow-x:auto">
      <table class="pv-tbl">
        <thead><tr>
          <th>#</th><th>Ngày</th><th>Mã đơn</th><th>Dịch vụ</th><th>Thông tin</th>
          <th class="num" style="color:#0369a1">Tiền công</th>
          <th class="num" style="color:#7c3aed">Hoa hồng</th>
          <th class="num">Tổng</th>
        </tr></thead>
        <tbody>${tbodyHtml}</tbody>
        <tfoot><tr>
          <td colspan="5" style="text-align:right;color:#475569;font-weight:600;font-size:12px">Tổng:</td>
          <td class="num" style="color:#0369a1;font-weight:700">${totalWage?fmtM(totalWage)+'đ':'—'}</td>
          <td class="num" style="color:#7c3aed;font-weight:700">${totalComm?fmtM(totalComm)+'đ':'—'}</td>
          <td class="num" style="font-weight:700">${fmtM(totalWage+totalComm)}đ</td>
        </tr></tfoot>
      </table></div>` : '<p style="color:#94a3b8;font-size:13px;padding:10px 0">Không có đơn hàng trong kỳ này.</p>'}
      <div class="sum-wrap">
        <div class="sum-box" style="flex:1;min-width:200px">
          <div class="sum-hd" style="background:#f8fafc;color:#475569">Tổng kết</div>
          <table>${sumRows}</table>
        </div>
        ${advances.length ? `
        <div class="sum-box" style="max-width:260px">
          <div class="sum-hd" style="background:#fffbeb;color:#92400e">Chi tiết ứng lương</div>
          <table>
            ${advances.map(a=>`<tr><td style="font-size:12px">${fmtDate(a.created_at)}${a.note?' — '+esc(a.note):''}</td><td style="color:#b45309">− ${fmtM(a.amount)} đ</td></tr>`).join('')}
            <tr class="adv-row"><td style="font-weight:700">Tổng ứng</td><td>− ${fmtM(totalAdvances)} đ</td></tr>
          </table>
        </div>` : ''}
        <div class="sum-box" style="max-width:230px">
          <div class="sum-hd" style="background:#f0fdf4;color:#166534">Thanh toán</div>
          <table>
            <tr><td>Thực nhận</td><td style="color:#166534;font-size:15px;font-weight:700">${fmtM(gross)} đ</td></tr>
            <tr><td>Đã phát</td><td style="color:${paid>0?'#16a34a':'#94a3b8'}">${paid>0?fmtM(paid)+' đ':'—'}</td></tr>
            ${debt>0?`<tr style="background:#fef3c7"><td style="color:#92400e">Còn nợ</td><td style="color:#b45309">${fmtM(debt)} đ</td></tr>`:''}
            ${s.paid_at?`<tr><td style="color:#64748b;font-size:12px">Ngày phát</td><td style="color:#64748b;font-size:12px">${fmtDate(s.paid_at)}</td></tr>`:''}
            ${s.paid_note?`<tr><td style="color:#64748b;font-size:12px">Ghi chú</td><td style="color:#64748b;font-size:12px">${esc(s.paid_note)}</td></tr>`:''}
          </table>
        </div>
      </div>`;

    $('slipModal').style.display = 'flex';
  }

  // ================================================================
  // INIT
  // ================================================================
  function init() {
    adminShell.init('my-salary');
    bindTabs();
    bindFilters();

    [$('btnCloseSlipModal'), $('btnCloseSlipModal2')].forEach(b => {
      b.addEventListener('click', () => { $('slipModal').style.display = 'none'; });
    });
    $('slipModal').addEventListener('click', e => {
      if (e.target === $('slipModal')) $('slipModal').style.display = 'none';
    });

    $('advPeriod').value = defaultPeriod();
    $('btnSubmitAdv').addEventListener('click', submitAdvance);

    loadSummary();
    loadAdvances();
    loadSlips();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
