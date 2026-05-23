(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');
  const fmtMoney = n => fmt.format(Math.round(Number(n) || 0));

  const fmtDate = d => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d).slice(0, 10);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
  };
  const fmtDateShort = d => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d).slice(0, 10);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`;
  };

  async function init() {
    const qp     = new URLSearchParams(location.search);
    const slipId = Number(qp.get('slip'));
    const staffId= Number(qp.get('staff'));

    if (!slipId || !staffId) {
      document.body.innerHTML = '<div style="padding:60px;text-align:center;color:#94a3b8">Thiếu tham số slip hoặc staff</div>';
      return;
    }

    let slip;
    try {
      slip = await api.get(`/admin/staff/${staffId}/payslip/${slipId}/view`, { silent: true });
    } catch (e) {
      document.body.innerHTML = `<div style="padding:60px;text-align:center;color:#ef4444">Không tìm thấy phiếu lương.<br><small>${e.message || ''}</small></div>`;
      return;
    }

    render(slip, staffId);
  }

  function render(s, staffId) {
    const paid  = Number(s.paid_amount) || 0;
    const gross = Number(s.gross_amount) || 0;
    const debt  = Number(s.remaining_debt) || 0;

    // Status pill
    const pill = $('statusPill');
    if (paid > 0 && debt <= 0) {
      pill.textContent = 'Đã phát lương'; pill.className = 'pv-status-pill paid';
    } else if (paid > 0 && debt > 0) {
      pill.textContent = `Còn nợ ${fmtMoney(debt)} đ`; pill.className = 'pv-status-pill debt';
    } else {
      pill.textContent = 'Chưa phát lương'; pill.className = 'pv-status-pill unpaid';
    }

    // Header
    document.title = `Phiếu lương — ${s.staff_name || s.staff_username}`;
    $('docPeriod').textContent = `Kỳ lương: ${fmtDate(s.from_date)} → ${fmtDate(s.to_date)}`;
    $('docDate').textContent   = `Ngày chốt: ${fmtDate(s.finalized_at)}`;
    $('signName').textContent  = s.staff_name || s.staff_username || '';

    // Meta
    $('pvMeta').innerHTML = `
      <div class="pv-meta-item">
        <div class="lbl">Nhân viên</div>
        <div class="val">${s.staff_name || s.staff_username || '—'}</div>
      </div>
      <div class="pv-meta-item">
        <div class="lbl">Kỳ lương</div>
        <div class="val">${fmtDate(s.from_date)} → ${fmtDate(s.to_date)}</div>
      </div>
      <div class="pv-meta-item">
        <div class="lbl">Ngày chốt</div>
        <div class="val">${fmtDate(s.finalized_at)} · ${s.finalized_by_name || ''}</div>
      </div>
      <div class="pv-meta-item">
        <div class="lbl">Trạng thái</div>
        <div class="val">${paid > 0 ? `Đã phát ${fmtMoney(paid)} đ` + (debt > 0 ? ` (còn nợ ${fmtMoney(debt)} đ)` : '') : 'Chưa phát lương'}</div>
      </div>`;

    // Parse JSON fields
    let rows = [];
    try { rows = s.rows_json ? JSON.parse(s.rows_json) : []; } catch {}
    let extras = [];
    try { extras = s.extras_json ? JSON.parse(s.extras_json) : []; } catch {}
    let deductions = [];
    try { deductions = s.deductions_json ? JSON.parse(s.deductions_json) : []; } catch {}
    let advances = [];
    try { advances = s.advances_json ? JSON.parse(s.advances_json) : []; } catch {}

    const totalWage     = rows.reduce((a, r) => a + (r.wage || 0), 0);
    const totalAdvances = advances.reduce((a, adv) => a + (Number(adv.amount) || 0), 0);

    // Tbody
    let tbodyHtml = '';
    rows.forEach((r, i) => {
      const device = [r.bien_so, r.imei].filter(Boolean).join(' / ');
      const infoLines = [];
      if (r.tai_khoan) infoLines.push(`<span style="color:#0369a1">${r.tai_khoan}</span>`);
      if (device)      infoLines.push(device);
      const infoCell = infoLines.join('<br>') || '—';
      const badge = r.row_type === 'commission' ? '<span class="badge-comm">hoa hồng</span>' : '';
      tbodyHtml += `<tr>
        <td style="color:#94a3b8;text-align:center">${i+1}</td>
        <td style="white-space:nowrap">${fmtDateShort(r.date)}</td>
        <td style="font-weight:600">${r.code || '—'}${badge}</td>
        <td style="font-size:12px">${r.service || '—'}</td>
        <td style="font-size:11.5px;line-height:1.5">${infoCell}</td>
        <td class="num" style="font-weight:600">${fmtMoney(r.wage)}</td>
        <td style="font-size:11px;color:#64748b">${r.pay_note || ''}</td>
      </tr>`;
    });
    $('pvTbody').innerHTML = tbodyHtml;

    $('pvTfoot').innerHTML = `
      <tr>
        <td colspan="5" style="text-align:right;color:#92400e">Tổng tiền công:</td>
        <td class="num" style="color:#92400e">${fmtMoney(totalWage)}</td>
        <td></td>
      </tr>`;

    // Summary
    let leftTable = `<table>`;
    if (Number(s.base_salary) > 0) {
      leftTable += `<tr><td class="lbl">Lương cứng</td><td class="val">${fmtMoney(s.base_salary)} đ</td></tr>`;
    }
    leftTable += `<tr><td class="lbl">Tiền công</td><td class="val">${fmtMoney(totalWage)} đ</td></tr>`;
    for (const e of extras) {
      leftTable += `<tr><td class="lbl">+ ${e.label}</td><td class="val">${fmtMoney(e.amount)} đ</td></tr>`;
    }
    for (const e of deductions) {
      leftTable += `<tr style="color:#dc2626"><td class="lbl">− ${e.label}</td><td class="val">− ${fmtMoney(e.amount)} đ</td></tr>`;
    }
    if (totalAdvances > 0) {
      leftTable += `<tr class="adv-row"><td class="lbl">Tiền đã ứng</td><td class="val">− ${fmtMoney(totalAdvances)} đ</td></tr>`;
    }
    if (Number(s.carried_debt) > 0) {
      leftTable += `<tr class="debt-row"><td class="lbl">Nợ kỳ trước</td><td class="val">+ ${fmtMoney(s.carried_debt)} đ</td></tr>`;
    }
    leftTable += `<tr class="total-row"><td class="lbl">Thực nhận</td><td class="val">${fmtMoney(gross)} đ</td></tr>`;
    leftTable += `</table>`;

    let advDetail = '';
    if (advances.length > 0) {
      advDetail = `
        <div class="pv-sum-table" style="max-width:300px">
          <div style="padding:8px 14px;background:#fffbeb;font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.3px">Chi tiết ứng lương</div>
          <table>
            ${advances.map(a => `<tr><td class="lbl">${fmtDate(a.created_at)}${a.note ? ' — ' + a.note : ''}</td><td class="val" style="color:#b45309">− ${fmtMoney(a.amount)} đ</td></tr>`).join('')}
            <tr style="background:#fef9c3"><td class="lbl" style="font-weight:700">Tổng ứng</td><td class="val" style="color:#b45309">− ${fmtMoney(totalAdvances)} đ</td></tr>
          </table>
        </div>`;
    }

    let payDetail = `
      <div class="pv-sum-table" style="max-width:260px">
        <div style="padding:8px 14px;background:#f0fdf4;font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.3px">Thanh toán</div>
        <table>
          <tr><td class="lbl">Thực nhận</td><td class="val" style="color:#166534;font-size:15px">${fmtMoney(gross)} đ</td></tr>
          <tr><td class="lbl">Đã trả</td><td class="val" style="color:${paid > 0 ? '#16a34a' : '#94a3b8'}">${paid > 0 ? fmtMoney(paid) + ' đ' : '—'}</td></tr>
          ${debt > 0 ? `<tr style="background:#fef3c7"><td class="lbl" style="color:#92400e">Còn nợ</td><td class="val" style="color:#b45309">${fmtMoney(debt)} đ</td></tr>` : ''}
          ${s.paid_at ? `<tr><td class="lbl" style="color:#64748b">Ngày phát</td><td class="val" style="color:#64748b;font-size:12px">${fmtDate(s.paid_at)}</td></tr>` : ''}
          ${s.paid_note ? `<tr><td class="lbl" style="color:#64748b">Ghi chú</td><td class="val" style="color:#64748b;font-size:12px">${s.paid_note}</td></tr>` : ''}
        </table>
      </div>`;

    $('pvSummary').innerHTML = `
      <div class="pv-sum-table" style="flex:1;min-width:220px">${leftTable}</div>
      ${advDetail}
      ${payDetail}`;

    // Copy link
    $('btnCopyLink').onclick = () => {
      const url = location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          $('btnCopyLink').textContent = '✓ Đã copy';
          setTimeout(() => { $('btnCopyLink').textContent = '🔗 Copy link'; }, 2000);
        });
      }
    };

    // Link back to payroll page
    const backBtn = document.querySelector('.pv-actions a[href]');
    if (backBtn) backBtn.href = `/admin/payroll.html?staff=${staffId}`;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
