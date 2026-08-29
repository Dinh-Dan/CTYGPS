// /kithuat/salary.html — KTV xem luong thuong, cong viec chua tinh luong, phieu luong, ung luong

(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');
  const fmtM = n => fmt.format(Math.round(Number(n) || 0));
  function fmtInputDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function getCurrentMonthRange() {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: fmtInputDate(from), to: fmtInputDate(to) };
  }

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
  function fmtDt(d) {
    if (!d) return '—';
    const dt = new Date(d); if (isNaN(dt)) return String(d).slice(0,10);
    const p = n => String(n).padStart(2,'0');
    return `${p(dt.getDate())}/${p(dt.getMonth()+1)} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
  }

  // ================================================================
  // MAIN TABS
  // ================================================================
  document.querySelectorAll('.sal-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sal-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.sal-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.tab;
      $('pane' + key.charAt(0).toUpperCase() + key.slice(1)).classList.add('active');
    });
  });

  document.querySelectorAll('.sub-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.sub-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $('sub' + btn.dataset.sub).classList.add('active');
      if (btn.dataset.sub === 'Slips'    && !slipsLoaded)   loadSlips();
      if (btn.dataset.sub === 'Advances' && !advLoaded)     loadAdvances();
    });
  });

  // ================================================================
  // STATS BAR
  // ================================================================
  async function loadStats() {
    const res = await api.get('/kithuat/salary-stats', { silent: true }).catch(() => null);
    if (!res) return;

    $('sTotal').textContent   = fmtM(res.total_received) + 'đ';

    $('sPendingWage').textContent = Number(res.pending_wage) > 0 ? fmtM(res.pending_wage) + 'đ' : '—';
    $('sPendingComm').textContent = Number(res.pending_commission) > 0 ? fmtM(res.pending_commission) + 'đ' : '—';

    $('sHolding').textContent  = fmtM(res.holding_amount) + 'đ';
    $('sAdvances').textContent = Number(res.pending_advances) > 0
      ? fmtM(res.pending_advances) + 'đ'
      : '—';

    if (res.last_payslip) {
      const lp = res.last_payslip;
      $('sLastSlip').textContent  = fmtM(lp.gross_amount) + 'đ';
      $('sLastSlipSub').textContent = `${fmtDate(lp.from_date)} → ${fmtDate(lp.to_date)}`;
    } else {
      $('sLastSlip').textContent  = '—';
      $('sLastSlipSub').textContent = 'Chưa có phiếu';
    }

    $('sAvg').textContent = res.avg_gross > 0 ? fmtM(res.avg_gross) + 'đ' : '—';
  }

  // ================================================================
  // TAB 1 — BẢN NHÁP LƯƠNG (read-only, giống admin payroll)
  // ================================================================
  const W = { from: '', to: '', filterQ: '', draft: null };

  function mergeForDisplay(rows) {
    const result = [];
    const orderMap = new Map();
    for (const r of rows) {
      if (r.row_type === 'order') {
        const m = { ...r };
        result.push(m);
        orderMap.set(r.order_id, m);
      }
    }
    for (const r of rows) {
      if (r.row_type === 'commission') {
        const existing = orderMap.get(r.order_id);
        if (existing) {
          existing.commission = (existing.commission || 0) + (r.commission || 0);
        } else {
          result.push({ ...r });
        }
      }
    }
    result.sort((a, b) => new Date(a.date) - new Date(b.date));
    return result;
  }

  async function loadWork(overrideFrom, overrideTo) {
    let url = '/kithuat/my-payslip-draft';
    const from = overrideFrom || W.from;
    const to   = overrideTo   || W.to;
    if (from && to) url += `?from=${from}&to=${to}`;

    $('draftTbody').innerHTML = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:30px">Đang tải...</td></tr>';
    $('draftTfoot').innerHTML = '';

    const res = await api.get(url, { silent: true }).catch(() => null);
    if (!res) return;

    W.draft   = res;
    W.from    = res.from_date;
    W.to      = res.to_date;
    $('draftFrom').value = res.from_date;
    $('draftTo').value   = res.to_date;

    $('workBadge').textContent = res.rows?.length || 0;
    renderDraft();
  }

  function renderDraft() {
    const d = W.draft;
    if (!d) return;

    const merged   = mergeForDisplay(d.rows || []);
    const filtered = W.filterQ
      ? merged.filter(r =>
          (r.code    || '').toLowerCase().includes(W.filterQ) ||
          (r.service || '').toLowerCase().includes(W.filterQ) ||
          (r.bien_so || '').toLowerCase().includes(W.filterQ) ||
          (r.imei    || '').toLowerCase().includes(W.filterQ) ||
          (r.tai_khoan || '').toLowerCase().includes(W.filterQ)
        )
      : merged;

    const advances      = d.advances || [];
    const adj           = d.draft_adjustments || [];
    const extras        = adj.filter(a => a.type === 'extra');
    const deductions    = adj.filter(a => a.type === 'deduction');
    const totalWage     = merged.reduce((s, r) => s + (r.wage || 0) + (r.commission || 0), 0);
    const totalAdvances = advances.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const totalExtras   = extras.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalDeducts  = deductions.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const carriedDebt   = Number(d.carried_debt) || 0;
    const gross         = totalWage + totalExtras - totalDeducts - totalAdvances + carriedDebt;

    $('draftCountTag').textContent = filtered.length !== merged.length
      ? `${filtered.length}/${merged.length} đơn`
      : `${merged.length} đơn · ${advances.length} phiếu ứng`;

    // Gộp đơn + ứng theo timeline
    const allRows = [];
    filtered.forEach(r => allRows.push({ _kind: 'order',   _date: r.date        || '', _data: r }));
    advances.forEach(a => allRows.push({ _kind: 'advance', _date: a.created_at  || '', _data: a }));
    allRows.sort((a, b) => a._date.localeCompare(b._date));

    let tbodyHtml = '';
    if (!allRows.length) {
      tbodyHtml = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:30px;font-style:italic">Không có dữ liệu trong kỳ này</td></tr>';
    } else {
      let idx = 0;
      for (const item of allRows) {
        if (item._kind === 'order') {
          idx++;
          const r = item._data;
          const device = [r.bien_so, r.imei].filter(Boolean).join(' / ');
          const infoLines = [];
          if (r.tai_khoan) infoLines.push(`<span style="color:#0369a1">${esc(r.tai_khoan)}</span>`);
          if (device)      infoLines.push(`<span style="color:#475569">${esc(device)}</span>`);
          const infoCell = infoLines.join('<br>') || '—';
          const wageAmt  = r.row_type === 'commission' ? 0 : (r.wage || 0);
          const commAmt  = r.commission || 0;
          tbodyHtml += `<tr>
            <td class="center" style="color:#94a3b8">${idx}</td>
            <td style="white-space:nowrap">${fmtDateS(r.date)}</td>
            <td style="font-weight:700;color:#1e40af">${esc(r.code || '—')}</td>
            <td style="font-size:12.5px">${esc(r.service || '—')}</td>
            <td style="font-size:12px;line-height:1.5">${infoCell}</td>
            <td class="num" style="font-weight:600">${wageAmt > 0 ? fmtM(wageAmt) : '—'}</td>
            <td class="num" style="color:#6d28d9;font-weight:600">${commAmt > 0 ? fmtM(commAmt) : '—'}</td>
          </tr>`;
        } else {
          const a = item._data;
          tbodyHtml += `<tr class="row-adv">
            <td class="center" style="color:#b45309;font-size:12px">↓</td>
            <td style="white-space:nowrap">${fmtDateS(a.created_at)}</td>
            <td><span style="font-size:10px;background:#fef3c7;color:#92400e;padding:2px 7px;border-radius:4px;font-weight:700">ứng</span></td>
            <td style="font-weight:600;color:#92400e">Ứng lương</td>
            <td style="font-size:12px;color:#b45309">${esc(a.note || '') || '<span style="color:#94a3b8">—</span>'}</td>
            <td class="num" style="color:#b45309;font-weight:700" colspan="2">− ${fmtM(a.amount)}</td>
          </tr>`;
        }
      }
    }
    $('draftTbody').innerHTML = tbodyHtml;

    const wageTotal = merged.reduce((s, r) => s + (r.wage || 0), 0);
    const commTotal = merged.reduce((s, r) => s + (r.commission || 0), 0);
    let tfootHtml = `<tr style="background:#f0fdf4;font-weight:700">
      <td colspan="4" style="text-align:right;color:#166534;font-size:12px">Tổng (${merged.length} đơn):</td>
      <td></td>
      <td class="num" style="color:#16a34a;font-size:14px">${fmtM(wageTotal)}</td>
      <td class="num" style="color:#6d28d9;font-size:14px">${fmtM(commTotal)}</td>
    </tr>`;
    if (totalAdvances > 0) {
      tfootHtml += `<tr style="background:#fffbeb;font-weight:700">
        <td colspan="4" style="text-align:right;color:#92400e;font-size:12px">Tổng tiền ứng (${advances.length} phiếu):</td>
        <td></td>
        <td class="num" style="color:#b45309;font-size:14px" colspan="2">− ${fmtM(totalAdvances)}</td>
      </tr>`;
    }
    $('draftTfoot').innerHTML = tfootHtml;

    // Summary box phải
    $('draftSum').style.display = '';
    $('dSumWage').textContent = fmtM(totalWage) + ' đ';
    $('dSumBase').textContent = '0';

    // Khoản cộng/trừ nháp
    const adjBox = $('dSumAdjBox');
    if (adjBox) {
      let adjHtml = '';
      for (const e of extras)     adjHtml += `<div class="row"><div class="lbl">+ ${esc(e.label)||'Khoản cộng'}</div><div class="val" style="color:#16a34a">${fmtM(e.amount)} đ</div></div>`;
      for (const e of deductions) adjHtml += `<div class="row"><div class="lbl">− ${esc(e.label)||'Khoản trừ'}</div><div class="val" style="color:#dc2626">− ${fmtM(e.amount)} đ</div></div>`;
      adjBox.innerHTML = adjHtml;
    }

    if (totalAdvances > 0) {
      $('dSumAdvRow').style.display = '';
      $('dSumAdv').textContent = '− ' + fmtM(totalAdvances) + ' đ';
    } else {
      $('dSumAdvRow').style.display = 'none';
    }
    if (carriedDebt > 0) {
      $('dSumDebtRow').style.display = '';
      $('dSumDebt').textContent = '+ ' + fmtM(carriedDebt) + ' đ';
    } else {
      $('dSumDebtRow').style.display = 'none';
    }
    $('dSumGross').textContent = fmtM(gross) + ' đ';
    $('dPeriodLabel').textContent = `Kỳ: ${fmtDate(d.from_date)} → ${fmtDate(d.to_date)}  ·  Thực nhận: ${fmtM(gross)}đ`;
  }

  // ================================================================
  // TAB 2 — PHIẾU LƯƠNG
  // ================================================================
  let slipCache  = [];
  let slipsLoaded = false;

  async function loadSlips() {
    slipsLoaded = true;
    $('slipTbody').innerHTML = '<tr><td colspan="6" class="empty-msg">Đang tải...</td></tr>';
    const res = await api.get('/kithuat/my-payslips', { silent: true }).catch(() => null);
    slipCache = res?.items || [];

    if (!slipCache.length) {
      $('slipTbody').innerHTML = `<tr><td colspan="6">
        <div class="no-slip-card">
          📋 Chưa có phiếu lương nào được admin chốt.
          <p>Công việc đã làm sẽ được tính khi admin tạo phiếu lương.</p>
        </div>
      </td></tr>`;
      return;
    }

    $('slipTbody').innerHTML = slipCache.map(s => {
      const paid  = Number(s.paid_amount)    || 0;
      const gross = Number(s.gross_amount)   || 0;
      const debt  = Number(s.remaining_debt) || 0;
      let pill;
      if (paid > 0 && debt <= 0)     pill = '<span class="pill-paid">✓ Đã phát</span>';
      else if (paid > 0 && debt > 0) pill = `<span class="pill-debt">⚠ Còn nợ ${fmtM(debt)}đ</span>`;
      else                           pill = '<span class="pill-unpaid">Chưa phát</span>';
      return `<tr class="slip-row" data-id="${s.id}" style="cursor:pointer">
        <td>${fmtDate(s.from_date)} → ${fmtDate(s.to_date)}</td>
        <td class="num">${fmtM(s.total_wage)}đ</td>
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
    const paid  = Number(s.paid_amount)    || 0;
    const gross = Number(s.gross_amount)   || 0;
    const debt  = Number(s.remaining_debt) || 0;

    $('slipModalTitle').textContent = `Phiếu lương ${fmtDate(s.from_date)} → ${fmtDate(s.to_date)}`;

    let rows = [];       try { rows       = s.rows_json       ? JSON.parse(s.rows_json)       : []; } catch {}
    let extras = [];     try { extras     = s.extras_json     ? JSON.parse(s.extras_json)     : []; } catch {}
    let deductions = []; try { deductions = s.deductions_json ? JSON.parse(s.deductions_json) : []; } catch {}
    let advances = [];   try { advances   = s.advances_json   ? JSON.parse(s.advances_json)   : []; } catch {}

    const totalWage     = rows.reduce((a, r) => a + (Number(r.wage) || 0), 0);
    const totalComm     = rows.reduce((a, r) => a + (Number(r.commission) || 0), 0);
    const totalAdvances = advances.reduce((a, a2) => a + (Number(a2.amount) || 0), 0);

    const tbodyHtml = rows.map((r, i) => {
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
        <td class="num" style="color:#0369a1">${wage ? fmtM(wage)+'đ' : '<span style="color:#e2e8f0">—</span>'}</td>
        <td class="num" style="color:#7c3aed">${comm ? fmtM(comm)+'đ' : '<span style="color:#e2e8f0">—</span>'}</td>
        <td class="num" style="font-weight:600">${fmtM(wage+comm)}đ</td>
      </tr>`;
    }).join('');

    let sumRows = '';
    if (Number(s.base_salary) > 0) sumRows += `<tr><td>Lương cứng</td><td>${fmtM(s.base_salary)} đ</td></tr>`;
    sumRows += `<tr><td>Tiền công</td><td style="color:#0369a1">${fmtM(totalWage)} đ</td></tr>`;
    if (totalComm > 0) sumRows += `<tr><td>Hoa hồng</td><td style="color:#7c3aed">${fmtM(totalComm)} đ</td></tr>`;
    for (const e of extras)     sumRows += `<tr><td>+ ${esc(e.label)}</td><td>${fmtM(e.amount)} đ</td></tr>`;
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
          <td class="num" style="color:#0369a1;font-weight:700">${fmtM(totalWage)}đ</td>
          <td class="num" style="color:#7c3aed;font-weight:700">${fmtM(totalComm)}đ</td>
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

    $('slipModal').classList.add('open');
  }

  // ================================================================
  // ỨNG LƯƠNG
  // ================================================================
  let advLoaded     = false;
  let filterStatus  = '';
  let unremittedTotal = 0;

  function advPill(s) {
    const map = { pending:['Chờ duyệt','adv-pending'], approved:['Đã duyệt','adv-approved'], rejected:['Từ chối','adv-rejected'] };
    const [lbl, cls] = map[s] || [s, ''];
    return `<span class="pill ${cls}">${lbl}</span>`;
  }

  async function loadUnremitted() {
    const res = await api.get('/kithuat/collections?remitted=0', { silent: true }).catch(() => null);
    unremittedTotal = Number(res?.summary?.unremitted) || 0;
    const info = $('advUnremitInfo');
    if (unremittedTotal > 0) {
      info.style.display = '';
      info.textContent = `💵 Tiền thu hộ chưa nộp: ${fmtM(unremittedTotal)}đ`;
    } else {
      info.style.display = 'none';
    }
  }

  async function loadAdvances() {
    advLoaded = true;
    const wrap = $('advList');
    wrap.innerHTML = '<div class="empty-msg">Đang tải...</div>';
    const params = filterStatus ? `?status=${filterStatus}` : '';
    const res = await api.get(`/kithuat/advances${params}`, { silent: true }).catch(() => null);
    const items = (res?.items || []).filter(a => !filterStatus || a.status === filterStatus);
    if (!items.length) {
      wrap.innerHTML = '<div class="empty-msg">Chưa có phiếu ứng nào.</div>';
      return;
    }
    wrap.innerHTML = items.map(a => `
      <div class="adv-row ${a.status}">
        <div class="adv-top">
          <span class="adv-amount">${fmtM(a.amount)}đ</span>
          ${advPill(a.status)}
          ${a.deduct_from_collection ? `<span style="background:#fef3c7;color:#92400e;padding:1px 7px;border-radius:4px;font-size:11px;font-weight:600">⬇ Trừ thu hộ</span>` : ''}
          <span style="margin-left:auto;font-size:12px;color:#94a3b8;white-space:nowrap">${fmtDt(a.created_at)}</span>
        </div>
        <div class="adv-meta">
          ${a.note ? `📝 ${esc(a.note)}` : ''}
          ${a.status==='approved' ? `<span style="color:#15803d">✅ Duyệt: ${fmtDt(a.approved_at)}${a.approved_by_name?' bởi '+esc(a.approved_by_name):''}</span>` : ''}
          ${a.status==='rejected' ? `<div style="color:#dc2626;margin-top:4px">❌ Lý do: ${esc(a.reject_reason||'(Không có lý do)')}</div>` : ''}
        </div>
      </div>`).join('');
  }

  async function submitAdvance() {
    const amount               = Money.get($('advAmount'));
    const note                 = $('advNote').value.trim();
    const deductFromCollection = $('advDeductCheck').checked;
    if (!amount || amount <= 0) { ui.toast('Nhập số tiền ứng', 'warning'); return; }
    if (deductFromCollection && amount > unremittedTotal) {
      ui.toast(`Số tiền ứng (${fmtM(amount)}đ) vượt quá tiền thu hộ chưa nộp (${fmtM(unremittedTotal)}đ)`, 'warning');
      return;
    }
    $('btnSubmitAdv').disabled = true;
    const ok = await api.post('/kithuat/advances',
      { amount, note, deduct_from_collection: deductFromCollection },
      { successMessage: deductFromCollection ? 'Đã gửi — admin duyệt sẽ tự trừ vào tiền thu hộ' : 'Đã gửi yêu cầu, chờ admin duyệt' }
    ).catch(() => null);
    $('btnSubmitAdv').disabled = false;
    if (!ok) return;
    closeAdvModal();
    $('advAmount').value = '';
    $('advNote').value   = '';
    $('advDeductCheck').checked = false;
    // Refresh stats + advance list
    loadStats();
    advLoaded = false;
    if ($('subAdvances').classList.contains('active')) loadAdvances();
  }

  // ================================================================
  // ADVANCE MODAL
  // ================================================================
  function openAdvModal() {
    loadUnremitted();
    $('advModal').classList.add('open');
    $('advAmount').focus();
  }
  function closeAdvModal() {
    $('advModal').classList.remove('open');
  }

  // ================================================================
  // INIT
  // ================================================================
  function init() {
    techShell.init('salary');
    const monthRange = getCurrentMonthRange();
    W.from = monthRange.from;
    W.to = monthRange.to;
    $('draftFrom').value = monthRange.from;
    $('draftTo').value = monthRange.to;

    // Slip modal
    [$('btnCloseSlipModal'), $('btnCloseSlipModal2')].forEach(b =>
      b.addEventListener('click', () => { $('slipModal').classList.remove('open'); }));
    $('slipModal').addEventListener('click', e => {
      if (e.target === $('slipModal')) $('slipModal').classList.remove('open');
    });

    // Advance modal
    $('btnOpenAdvModal').addEventListener('click', openAdvModal);
    [$('btnCloseAdvModal'), $('btnCloseAdvModal2')].forEach(b =>
      b.addEventListener('click', closeAdvModal));
    $('advModal').addEventListener('click', e => {
      if (e.target === $('advModal')) closeAdvModal();
    });

    $('btnSubmitAdv').addEventListener('click', submitAdvance);

    // Advance filter
    document.querySelectorAll('.adv-filter-row button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.adv-filter-row button').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        filterStatus = btn.dataset.filter;
        loadAdvances();
      });
    });

    // Date range + filter cho Tab 1
    $('btnDraftReload').addEventListener('click', () => {
      const from = $('draftFrom').value;
      const to   = $('draftTo').value;
      if (from && to) loadWork(from, to);
    });
    let filterTimer = null;
    $('draftFilter').addEventListener('input', () => {
      clearTimeout(filterTimer);
      filterTimer = setTimeout(() => {
        W.filterQ = $('draftFilter').value.trim().toLowerCase();
        renderDraft();
      }, 250);
    });

    // Load initial data
    loadStats();
    loadWork(W.from, W.to);
    loadSlips();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
