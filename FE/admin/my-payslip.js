// Nhan vien / admin tu xem phieu luong cua minh

(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');
  const fmtMoney = n => fmt.format(Math.round(Number(n) || 0));

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d).slice(0, 10);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
  }

  function fmtDateShort(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d).slice(0, 10);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`;
  }

  let slipCache = [];

  async function loadSlips() {
    const wrap = $('slipList');
    wrap.innerHTML = '<div class="slip-empty">Đang tải...</div>';
    const res = await api.get('/admin/staff/my-payslip/list', { silent: true }).catch(() => null);
    const items = res?.items || [];
    slipCache = items;
    if (!items.length) {
      wrap.innerHTML = '<div class="slip-empty">Chưa có phiếu lương nào được chốt.</div>';
      return;
    }
    wrap.innerHTML = `
      <table class="slip-table">
        <thead>
          <tr>
            <th>Kỳ lương</th>
            <th class="num">Tiền công</th>
            <th class="num">Thực nhận</th>
            <th class="num">Đã phát</th>
            <th>Trạng thái</th>
            <th>Ngày chốt</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(s => {
            const paid  = Number(s.paid_amount) || 0;
            const gross = Number(s.gross_amount) || 0;
            const debt  = Number(s.remaining_debt) || 0;
            let pill;
            if (paid > 0 && debt <= 0) {
              pill = '<span class="pill-paid">✓ Đã phát</span>';
            } else if (paid > 0 && debt > 0) {
              pill = `<span class="pill-debt">⚠ Còn nợ ${fmtMoney(debt)}đ</span>`;
            } else {
              pill = '<span class="pill-unpaid">Chưa phát</span>';
            }
            return `<tr data-id="${s.id}" class="slip-row">
              <td>${fmtDate(s.from_date)} → ${fmtDate(s.to_date)}</td>
              <td class="num">${fmtMoney(s.total_wage)}đ</td>
              <td class="num" style="font-weight:700;color:#0f172a">${fmtMoney(gross)}đ</td>
              <td class="num" style="color:${paid>0?'#16a34a':'#94a3b8'}">${paid>0?fmtMoney(paid)+'đ':'—'}</td>
              <td>${pill}</td>
              <td style="font-size:12.5px;color:#64748b">${fmtDate(s.finalized_at)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;

    wrap.querySelectorAll('.slip-row').forEach(row => {
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

    let rows = [];
    try { rows = s.rows_json ? JSON.parse(s.rows_json) : []; } catch {}
    let extras = [];
    try { extras = s.extras_json ? JSON.parse(s.extras_json) : []; } catch {}
    let deductions = [];
    try { deductions = s.deductions_json ? JSON.parse(s.deductions_json) : []; } catch {}
    let advances = [];
    try { advances = s.advances_json ? JSON.parse(s.advances_json) : []; } catch {}

    const totalWage     = rows.reduce((a, r) => a + (r.wage || 0) + (r.commission || 0), 0);
    const totalAdvances = advances.reduce((a, a2) => a + (Number(a2.amount) || 0), 0);

    const tbodyHtml = rows.map((r, i) => {
      const device = [r.bien_so, r.imei].filter(Boolean).join(' / ');
      const infoLines = [];
      if (r.tai_khoan) infoLines.push(`<span style="color:#0369a1">${escape(r.tai_khoan)}</span>`);
      if (device) infoLines.push(escape(device));
      const badge = r.row_type === 'commission' ? '<span class="badge-comm">hoa hồng</span>' : '';
      return `<tr>
        <td style="color:#94a3b8;text-align:center">${i+1}</td>
        <td style="white-space:nowrap;font-size:12px">${fmtDateShort(r.date)}</td>
        <td style="font-weight:600">${escape(r.code)||'—'}${badge}</td>
        <td style="font-size:12px">${escape(r.service)||'—'}</td>
        <td style="font-size:11.5px;line-height:1.5">${infoLines.join('<br>')||'—'}</td>
        <td class="num" style="font-weight:600">${fmtMoney((r.wage||0)+(r.commission||0))}đ</td>
      </tr>`;
    }).join('');

    let sumRows = '';
    if (Number(s.base_salary) > 0) sumRows += `<tr><td>Lương cứng</td><td>${fmtMoney(s.base_salary)} đ</td></tr>`;
    sumRows += `<tr><td>Tiền công</td><td>${fmtMoney(totalWage)} đ</td></tr>`;
    for (const e of extras) sumRows += `<tr><td>+ ${escape(e.label)}</td><td>${fmtMoney(e.amount)} đ</td></tr>`;
    for (const e of deductions) sumRows += `<tr style="color:#dc2626"><td>− ${escape(e.label)}</td><td>− ${fmtMoney(e.amount)} đ</td></tr>`;
    if (totalAdvances > 0) sumRows += `<tr class="adv-row"><td>Tiền đã ứng</td><td>− ${fmtMoney(totalAdvances)} đ</td></tr>`;
    if (Number(s.carried_debt) > 0) sumRows += `<tr class="debt-row"><td>Nợ kỳ trước</td><td>+ ${fmtMoney(s.carried_debt)} đ</td></tr>`;
    sumRows += `<tr class="total-row"><td>Thực nhận</td><td>${fmtMoney(gross)} đ</td></tr>`;

    $('slipModalBody').innerHTML = `
      <div class="pv-meta-grid">
        <div class="pv-meta-item"><div class="lbl">Kỳ lương</div><div class="val">${fmtDate(s.from_date)} → ${fmtDate(s.to_date)}</div></div>
        <div class="pv-meta-item"><div class="lbl">Ngày chốt</div><div class="val">${fmtDate(s.finalized_at)}${s.finalized_by_name ? ' · ' + escape(s.finalized_by_name) : ''}</div></div>
        <div class="pv-meta-item"><div class="lbl">Trạng thái thanh toán</div><div class="val">${paid>0 ? 'Đã phát ' + fmtMoney(paid) + 'đ' + (debt>0?' (còn nợ '+fmtMoney(debt)+'đ)':'') : 'Chưa phát'}</div></div>
        ${s.note ? `<div class="pv-meta-item"><div class="lbl">Ghi chú</div><div class="val">${escape(s.note)}</div></div>` : ''}
      </div>

      ${rows.length ? `
      <table class="pv-tbl">
        <thead>
          <tr>
            <th style="width:36px">#</th>
            <th>Ngày</th>
            <th>Mã đơn</th>
            <th>Dịch vụ</th>
            <th>Thông tin</th>
            <th class="num">Tiền công</th>
          </tr>
        </thead>
        <tbody>${tbodyHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="5" style="text-align:right;color:#92400e;font-weight:600;font-size:12.5px">Tổng tiền công:</td>
            <td class="num" style="color:#92400e;font-weight:700">${fmtMoney(totalWage)}đ</td>
          </tr>
        </tfoot>
      </table>` : '<p style="color:#94a3b8;font-size:13px">Không có đơn hàng trong kỳ này.</p>'}

      <div class="pv-sum-wrap">
        <div class="pv-sum-box" style="flex:1;min-width:220px">
          <div class="hd" style="background:#f8fafc;color:#475569">Tổng kết</div>
          <table>${sumRows}</table>
        </div>
        ${advances.length ? `
        <div class="pv-sum-box" style="max-width:280px">
          <div class="hd" style="background:#fffbeb;color:#92400e">Chi tiết ứng lương</div>
          <table>
            ${advances.map(a => `<tr><td style="font-size:12px">${fmtDate(a.created_at)}${a.note?' — '+escape(a.note):''}</td><td style="color:#b45309">− ${fmtMoney(a.amount)} đ</td></tr>`).join('')}
            <tr class="adv-row"><td style="font-weight:700">Tổng ứng</td><td>− ${fmtMoney(totalAdvances)} đ</td></tr>
          </table>
        </div>` : ''}
        <div class="pv-sum-box" style="max-width:240px">
          <div class="hd" style="background:#f0fdf4;color:#166534">Thanh toán</div>
          <table>
            <tr><td>Thực nhận</td><td style="color:#166534;font-size:15px;font-weight:700">${fmtMoney(gross)} đ</td></tr>
            <tr><td>Đã phát</td><td style="color:${paid>0?'#16a34a':'#94a3b8'}">${paid>0?fmtMoney(paid)+' đ':'—'}</td></tr>
            ${debt>0?`<tr style="background:#fef3c7"><td style="color:#92400e">Còn nợ</td><td style="color:#b45309">${fmtMoney(debt)} đ</td></tr>`:''}
            ${s.paid_at?`<tr><td style="color:#64748b;font-size:12px">Ngày phát</td><td style="color:#64748b;font-size:12px">${fmtDate(s.paid_at)}</td></tr>`:''}
            ${s.paid_note?`<tr><td style="color:#64748b;font-size:12px">Ghi chú</td><td style="color:#64748b;font-size:12px">${escape(s.paid_note)}</td></tr>`:''}
          </table>
        </div>
      </div>`;

    $('slipModal').style.display = 'flex';
  }

  function init() {
    adminShell.init('my-payslip');

    $('btnCloseSlipModal').addEventListener('click',  () => { $('slipModal').style.display = 'none'; });
    $('btnCloseSlipModal2').addEventListener('click', () => { $('slipModal').style.display = 'none'; });
    $('slipModal').addEventListener('click', e => { if (e.target === $('slipModal')) $('slipModal').style.display = 'none'; });

    loadSlips();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
