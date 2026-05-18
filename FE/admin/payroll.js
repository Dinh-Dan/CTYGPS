(function () {
  'use strict';
  adminShell.init('staff');

  const $ = id => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');
  const fmtMoney = n => fmt.format(Math.round(Number(n) || 0));
  const fmtDate  = d => {
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

  // ===== State =====
  const S = {
    staffId:    null,
    draft:      null,   // { staff, from_date, to_date, rows, total_wage, carried_debt, advances, total_advances }
    base:       0,
    extras:     [],     // [{label, amount}]
    deductions: [],     // [{label, amount}]
    filterQ:    '',
    slips:      [],
    paySlipId:  null,
    detailSlip: null,
    activeTab:  'tinh',
  };

  // ===== Init =====
  async function init() {
    const r = await api.get('/admin/staff?limit=200', { silent: true }).catch(() => null);
    if (r?.items) {
      for (const s of r.items) {
        const o = document.createElement('option');
        o.value = s.id;
        o.textContent = `${s.full_name || s.username} (${s.role === 'technician' ? 'KTV' : 'NV'})`;
        $('selStaff').appendChild(o);
      }
    }

    const qp = new URLSearchParams(location.search);
    if (qp.get('staff')) { $('selStaff').value = qp.get('staff'); }

    $('selStaff').addEventListener('change', () => {
      S.staffId = Number($('selStaff').value) || null;
      if (S.staffId) { $('plTabs').style.display = ''; loadAll(); }
      else { $('plTabs').style.display = 'none'; resetUI(); }
    });

    // Tabs
    document.querySelectorAll('.pl-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        S.activeTab = btn.dataset.tab;
        document.querySelectorAll('.pl-tab').forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.pl-panel').forEach(p => p.classList.toggle('active', p.id === `panel${capitalize(btn.dataset.tab)}`));
      });
    });

    // Modal advance
    [$('modalAdvClose'), $('modalAdvCancel')].forEach(b => b.onclick = () => $('modalAdvance').classList.remove('open'));
    $('advAmt').addEventListener('input', () => {
      const raw = $('advAmt').value.replace(/\D/g, '');
      $('advAmt').value = raw ? Number(raw).toLocaleString('vi-VN') : '';
    });
    $('modalAdvSave').onclick = doCreateAdvance;

    // Modal pay
    [$('modalPayClose'), $('modalPayCancel')].forEach(b => b.onclick = () => $('modalPay').classList.remove('open'));
    $('payAmt').addEventListener('input', () => { $('payAmt').value = $('payAmt').value.replace(/[^\d]/g,''); updatePayDebtNote(); });
    $('modalPaySave').onclick = doPay;

    // Modal slip detail
    [$('modalSlipClose'), $('modalSlipClose2')].forEach(b => b.onclick = () => $('modalSlip').classList.remove('open'));

    if ($('selStaff').value) {
      S.staffId = Number($('selStaff').value);
      $('plTabs').style.display = '';
      loadAll();
    }
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function resetUI() {
    $('draftArea').innerHTML = '<div class="pl-empty">Chọn nhân viên để bắt đầu tính lương.</div>';
    $('slipListArea').innerHTML = '<div class="pl-empty">Chọn nhân viên để xem phiếu lương.</div>';
    S.draft = null; S.slips = [];
  }

  async function loadAll() {
    if (!S.staffId) return;
    loadDraft();
    loadSlips();
  }

  // ===== DRAFT =====
  async function loadDraft(overrideFrom, overrideTo) {
    $('draftArea').innerHTML = '<div class="pl-empty">Đang tải...</div>';
    let url = `/admin/staff/${S.staffId}/payslip/draft`;
    if (overrideFrom && overrideTo) url += `?from=${overrideFrom}&to=${overrideTo}`;
    const r = await api.get(url, { silent: true }).catch(e => { ui.toast(e.message || 'Lỗi tải dữ liệu', 'error'); return null; });
    if (!r) return;
    S.draft = r;
    S.base = 0;
    S.extras = [];
    S.deductions = [];
    const $title = $('pageTitle');
    if ($title) $title.textContent = `Bảng lương — ${r.staff.full_name || r.staff.username}`;
    renderDraft();
  }

  function renderDraft() {
    const d = S.draft;
    if (!d) return;

    const filtered = S.filterQ
      ? d.rows.filter(r =>
          (r.code || '').toLowerCase().includes(S.filterQ) ||
          (r.service || '').toLowerCase().includes(S.filterQ) ||
          (r.bien_so || '').toLowerCase().includes(S.filterQ) ||
          (r.imei || '').toLowerCase().includes(S.filterQ) ||
          (r.tai_khoan || '').toLowerCase().includes(S.filterQ)
        )
      : d.rows;

    const totalWage       = d.rows.reduce((s, r) => s + (r.wage || 0), 0);
    const totalExtras     = S.extras.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalDeductions = S.deductions.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const advances        = d.advances || [];
    const totalAdvances   = advances.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const gross = S.base + totalWage + totalExtras - totalDeductions - totalAdvances + (d.carried_debt || 0);

    // Gộp đơn + phiếu ứng vào 1 timeline
    const allRows = [];
    filtered.forEach(r  => allRows.push({ _kind: 'order',   _date: r.date           || '', _data: r }));
    advances.forEach(a  => allRows.push({ _kind: 'advance', _date: a.created_at     || '', _data: a }));
    allRows.sort((a, b) => a._date.localeCompare(b._date));

    const filterTag = filtered.length !== d.rows.length
      ? `<span style="color:#64748b;font-size:12px">${filtered.length}/${d.rows.length} đơn</span>`
      : `<span style="color:#64748b;font-size:12px">${d.rows.length} đơn · ${advances.length} phiếu ứng</span>`;

    let html = `
      <!-- Hàng điều khiển: kỳ + filter + ứng lương -->
      <div class="draft-ctrl-row">
        <div class="pr-date-edit">
          <label>Từ ngày</label>
          <input type="date" id="editFrom" value="${d.from_date}"/>
          <span style="color:#94a3b8;margin:0 4px">→</span>
          <label>Đến ngày</label>
          <input type="date" id="editTo" value="${d.to_date}"/>
          <button class="btn ghost" id="btnReloadRange" style="font-size:12px;padding:5px 12px;margin-left:6px">Cập nhật</button>
        </div>
        <input type="text" id="filterInput" class="filter-in-main"
               placeholder="Lọc theo mã đơn, dịch vụ, tài khoản…" value="${S.filterQ}"/>
        ${filterTag}
        <button id="btnAddAdvance" class="btn-advance-main">💰 Ứng lương</button>
      </div>

      <!-- Grid 7-3 -->
      <div class="draft-grid">

        <!-- 7/10: Bảng giao dịch gộp -->
        <div>
          <div class="pl-table-wrap">
            <table class="pl-table">
              <thead>
                <tr>
                  <th style="width:36px" class="center">#</th>
                  <th style="width:72px">Ngày</th>
                  <th style="width:90px">Mã đơn</th>
                  <th>Dịch vụ</th>
                  <th>Tài khoản / Biển số</th>
                  <th class="num" style="width:110px">Tiền công</th>
                  <th style="width:150px">Ghi chú CK</th>
                </tr>
              </thead>
              <tbody>`;

    if (!allRows.length) {
      html += `<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:30px;font-style:italic">Không có dữ liệu trong kỳ này</td></tr>`;
    } else {
      let orderIdx = 0;
      allRows.forEach(item => {
        if (item._kind === 'order') {
          orderIdx++;
          const r = item._data;
          const device = [r.bien_so, r.imei].filter(Boolean).join(' / ');
          const badge  = r.row_type === 'commission'
            ? '<span style="font-size:10px;background:#ede9fe;color:#6d28d9;padding:1px 5px;border-radius:4px;margin-left:4px">hoa hồng</span>'
            : '';
          const infoLines = [];
          if (r.tai_khoan) infoLines.push(`<span style="color:#0369a1">${r.tai_khoan}</span>`);
          if (device)      infoLines.push(`<span style="color:#475569">${device}</span>`);
          const infoCell = infoLines.join('<br>') || '—';
          html += `
            <tr>
              <td class="center" style="color:#94a3b8">${orderIdx}</td>
              <td style="white-space:nowrap">${fmtDateShort(r.date)}</td>
              <td><a class="link order-link" data-id="${r.order_id}" href="/admin/order-detail.html?id=${r.order_id}">${r.code || '—'}${badge}</a>${r.code ? ui.copyCodeBtn(r.code) : ''}</td>
              <td style="font-size:12.5px">${r.service || '—'}</td>
              <td style="font-size:12px;line-height:1.5">${infoCell}</td>
              <td class="num" style="color:#0f172a;font-weight:600">${fmtMoney(r.wage)}</td>
              <td style="font-size:11.5px;color:#64748b">${r.pay_note || ''}</td>
            </tr>`;
        } else {
          const a = item._data;
          html += `
            <tr class="row-adv">
              <td class="center" style="color:#b45309;font-size:12px">↓</td>
              <td style="white-space:nowrap">${fmtDateShort(a.created_at)}</td>
              <td><span style="font-size:10px;background:#fef3c7;color:#92400e;padding:2px 7px;border-radius:4px;font-weight:700">ứng</span></td>
              <td style="font-weight:600;color:#92400e">Ứng lương</td>
              <td style="font-size:12px;color:#b45309">${a.note || '<span style="color:#94a3b8">—</span>'}</td>
              <td class="num" style="color:#b45309;font-weight:700">− ${fmtMoney(a.amount)}</td>
              <td style="text-align:right">
                <button class="btn ghost btn-del-advance" data-id="${a.id}"
                  style="font-size:11px;padding:2px 8px;color:#dc2626;border-color:#fecaca">Xóa</button>
              </td>
            </tr>`;
        }
      });
    }

    html += `
              </tbody>
              <tfoot>
                <tr style="background:#f0fdf4;font-weight:700">
                  <td colspan="4" style="text-align:right;color:#166534;font-size:12px">Tổng tiền công (${d.rows.length} đơn):</td>
                  <td></td>
                  <td class="num" style="color:#16a34a;font-size:14px">${fmtMoney(totalWage)}</td>
                  <td></td>
                </tr>
                ${totalAdvances > 0 ? `
                <tr style="background:#fffbeb;font-weight:700">
                  <td colspan="4" style="text-align:right;color:#92400e;font-size:12px">Tổng tiền ứng (${advances.length} phiếu):</td>
                  <td></td>
                  <td class="num" style="color:#b45309;font-size:14px">− ${fmtMoney(totalAdvances)}</td>
                  <td></td>
                </tr>` : ''}
              </tfoot>
            </table>
          </div>
        </div>

        <!-- 3/10: khoản cộng/trừ → tổng kết → quyết toán ghim đáy -->
        <div>

          <!-- Khoản cộng/trừ (trên cùng, compact) -->
          <div class="extras-compact">
            <div class="ec-section">
              <div class="ec-head">
                <span>Khoản cộng thêm</span>
                <button id="btnAddExtra">+ Thêm</button>
              </div>
              <div id="extrasRows">${renderExtraRows(S.extras, 'extra')}</div>
            </div>
            <div class="ec-section">
              <div class="ec-head">
                <span>Khoản trừ</span>
                <button id="btnAddDeduct">+ Thêm</button>
              </div>
              <div id="deductRows">${renderExtraRows(S.deductions, 'deduct')}</div>
            </div>
            ${(d.carried_debt || 0) > 0 ? `
            <div style="padding:8px 10px;background:#fef2f2;border:1px solid #fecaca;
              border-radius:8px;font-size:12px;color:#991b1b">
              ⚠ Nợ kỳ trước: <strong>${fmtMoney(d.carried_debt)} đ</strong>
            </div>` : ''}
          </div>

          <!-- Tổng kết (compact) -->
          <div class="pl-sum sm">
            <div class="sum-col-title">Tổng kết kỳ lương</div>
            <div class="row">
              <div class="lbl">Tiền công</div>
              <div class="val">${fmtMoney(totalWage)} đ</div>
            </div>
            <div class="row">
              <div class="lbl">Lương cứng</div>
              <div class="val"><input type="text" id="inputBase" value="${fmtMoney(S.base)}"
                style="font-variant-numeric:tabular-nums" autocomplete="off"/></div>
            </div>
            <div class="row">
              <div class="lbl">Khoản cộng</div>
              <div class="val" id="sumExtrasVal">${fmtMoney(totalExtras)} đ</div>
            </div>
            <div class="row">
              <div class="lbl">Khoản trừ</div>
              <div class="val" id="sumDeductVal" style="color:#dc2626">− ${fmtMoney(totalDeductions)} đ</div>
            </div>
            ${totalAdvances > 0 ? `
            <div class="row" style="background:#fffbeb">
              <div class="lbl" style="background:#fef3c7;color:#92400e;border-right-color:#fde68a">Tiền đã ứng</div>
              <div class="val" style="color:#b45309;font-weight:700" id="sumAdvVal">− ${fmtMoney(totalAdvances)} đ</div>
            </div>` : `<div id="sumAdvVal" style="display:none"></div>`}
            ${(d.carried_debt || 0) > 0 ? `
            <div class="row debt">
              <div class="lbl">Nợ kỳ trước</div>
              <div class="val">+ ${fmtMoney(d.carried_debt)} đ</div>
            </div>` : ''}
            <div class="row total">
              <div class="lbl">Thực nhận</div>
              <div class="val" id="sumGross">${fmtMoney(gross)} đ</div>
            </div>
          </div>

          <!-- Quyết toán ghim đáy -->
          <div class="finalize-bar">
            <div style="font-size:11.5px;color:#64748b;margin-bottom:8px">
              Kỳ: <strong>${fmtDate(d.from_date)}</strong> → <strong>${fmtDate(d.to_date)}</strong>
              &nbsp;·&nbsp; Thực nhận: <strong id="grossPreview" style="color:#16a34a">${fmtMoney(gross)} đ</strong>
            </div>
            <button class="btn primary" id="btnFinalize" style="width:100%;font-size:14px;padding:10px">
              ✓ Quyết toán
            </button>
          </div>

        </div>

      </div>`;

    $('draftArea').innerHTML = html;

    // Wire events
    $('btnReloadRange').onclick = () => {
      const f = $('editFrom').value, t = $('editTo').value;
      if (!f || !t) return ui.toast('Chọn đủ ngày', 'warning');
      if (f > t) return ui.toast('Ngày bắt đầu phải trước ngày kết thúc', 'warning');
      loadDraft(f, t);
    };

    $('filterInput').addEventListener('input', e => {
      S.filterQ = e.target.value.toLowerCase();
      renderDraft();
    });

    $('inputBase').addEventListener('change', e => {
      S.base = Math.round(Number(e.target.value.replace(/\D/g, '')) || 0);
      e.target.value = fmtMoney(S.base);
      recalc();
    });

    $('btnAddExtra').onclick = () => { S.extras.push({ label: '', amount: 0 }); reRenderExtras(); recalc(); };
    $('btnAddDeduct').onclick = () => { S.deductions.push({ label: '', amount: 0 }); reRenderDeductions(); recalc(); };

    $('btnAddAdvance').onclick = () => {
      $('advAmt').value = '';
      $('advNote').value = '';
      $('modalAdvance').classList.add('open');
      setTimeout(() => $('advAmt').focus(), 50);
    };

    document.querySelectorAll('.btn-del-advance').forEach(btn => {
      btn.onclick = () => deleteAdvance(Number(btn.dataset.id));
    });

    wireExtraEvents();
    $('btnFinalize').onclick = doFinalize;
    attachOrderLinks();
  }

  function renderExtraRows(arr, type) {
    if (!arr.length) return '';
    return arr.map((e, i) => `
      <div class="pl-extra-row" data-type="${type}" data-idx="${i}">
        <input class="lbl-in" type="text" placeholder="${type === 'extra' ? 'Tên khoản' : 'Thuế / phí...'}" value="${e.label || ''}"/>
        <input class="amt-in" type="text" placeholder="0" value="${e.amount || 0}"/>
        <button title="Xóa">×</button>
      </div>`).join('');
  }

  function reRenderExtras() {
    $('extrasRows').innerHTML = renderExtraRows(S.extras, 'extra');
    wireExtraEvents();
  }
  function reRenderDeductions() {
    $('deductRows').innerHTML = renderExtraRows(S.deductions, 'deduct');
    wireExtraEvents();
  }

  function wireExtraEvents() {
    document.querySelectorAll('.pl-extra-row').forEach(row => {
      const type = row.dataset.type;
      const idx  = Number(row.dataset.idx);
      const arr  = type === 'extra' ? S.extras : S.deductions;
      const [lIn, aIn] = row.querySelectorAll('input');
      const btn = row.querySelector('button');

      lIn.addEventListener('change', () => { arr[idx].label = lIn.value.trim(); });
      aIn.addEventListener('change', () => {
        arr[idx].amount = Math.round(Number(aIn.value.replace(/\D/g,'')) || 0);
        aIn.value = arr[idx].amount;
        recalc();
      });
      aIn.addEventListener('focus', () => aIn.select());
      btn.onclick = () => {
        arr.splice(idx, 1);
        if (type === 'extra') reRenderExtras(); else reRenderDeductions();
        recalc();
      };
    });
  }

  function recalc() {
    const d = S.draft; if (!d) return;
    const tw  = d.rows.reduce((s, r) => s + (r.wage || 0), 0);
    const te  = S.extras.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const td  = S.deductions.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const ta  = (d.advances || []).reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const gross = S.base + tw + te - td - ta + (d.carried_debt || 0);
    const sumE = $('sumExtrasVal');  if (sumE) sumE.textContent = fmtMoney(te) + ' đ';
    const sumD = $('sumDeductVal');  if (sumD) sumD.textContent = '− ' + fmtMoney(td) + ' đ';
    const sumG = $('sumGross');      if (sumG) sumG.textContent = fmtMoney(gross) + ' đ';
    const prev = $('grossPreview');  if (prev) prev.textContent = fmtMoney(gross) + ' đ';
  }

  async function doFinalize() {
    const d = S.draft; if (!d) return;
    const ta    = (d.advances || []).reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const gross = S.base
      + d.rows.reduce((s,r) => s + r.wage, 0)
      + S.extras.reduce((s,e) => s + (Number(e.amount)||0), 0)
      - S.deductions.reduce((s,e) => s + (Number(e.amount)||0), 0)
      - ta
      + (d.carried_debt || 0);

    const advTxt = ta > 0 ? `\nTrừ ứng lương: ${fmtMoney(ta)} đ` : '';
    if (!await ui.confirm(`Quyết toán kỳ lương ${fmtDate(d.from_date)} → ${fmtDate(d.to_date)}?\n\n${d.rows.length} đơn hàng sẽ được kết sổ.${advTxt}\n\nThực nhận: ${fmtMoney(gross)} đ`)) return;

    const btn = $('btnFinalize');
    btn.disabled = true; btn.textContent = 'Đang xử lý...';
    try {
      const r = await api.post(`/admin/staff/${S.staffId}/payslip/finalize`, {
        from_date:   d.from_date,
        to_date:     d.to_date,
        base_salary: S.base,
        extras:      S.extras.filter(e => e.label || e.amount),
        deductions:  S.deductions.filter(e => e.label || e.amount),
        note:        '',
      });
      ui.toast(`Đã quyết toán! Thực nhận: ${fmtMoney(r.gross_amount)} đ`, 'success');
      S.activeTab = 'phieu';
      document.querySelectorAll('.pl-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === 'phieu'));
      document.querySelectorAll('.pl-panel').forEach(p => p.classList.toggle('active', p.id === 'panelPhieu'));
      loadDraft(); loadSlips();
    } catch (e) {
      ui.toast(e.message || 'Lỗi quyết toán', 'error');
      btn.disabled = false; btn.textContent = '✓ Quyết toán';
    }
  }

  function attachOrderLinks() {
    document.querySelectorAll('.order-link').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const id = a.dataset.id;
        if (window.orderQuickView) orderQuickView.open(id);
        else location.href = a.href;
      });
    });
  }

  // ===== ỨNG LƯƠNG =====
  async function doCreateAdvance() {
    const amount = Math.round(Number($('advAmt').value.replace(/\D/g,'')) || 0);
    const note   = $('advNote').value.trim();
    if (!amount) return ui.toast('Nhập số tiền', 'warning');

    $('modalAdvSave').disabled = true;
    try {
      await api.post(`/admin/staff/${S.staffId}/advance`, { amount, note });
      ui.toast('Đã tạo phiếu ứng lương', 'success');
      $('modalAdvance').classList.remove('open');
      // Reload lai draft de cap nhat danh sach advance
      const from = $('editFrom')?.value || S.draft?.from_date;
      const to   = $('editTo')?.value   || S.draft?.to_date;
      loadDraft(from, to);
    } catch (e) {
      ui.toast(e.message || 'Lỗi', 'error');
    } finally {
      $('modalAdvSave').disabled = false;
    }
  }

  async function deleteAdvance(advId) {
    if (!await ui.confirm('Xóa phiếu ứng lương này?')) return;
    try {
      await api.delete(`/admin/staff/${S.staffId}/advance/${advId}`);
      ui.toast('Đã xóa', 'success');
      const from = $('editFrom')?.value || S.draft?.from_date;
      const to   = $('editTo')?.value   || S.draft?.to_date;
      loadDraft(from, to);
    } catch (e) {
      ui.toast(e.message || 'Lỗi xóa', 'error');
    }
  }

  // ===== DANH SÁCH PHIẾU =====
  async function loadSlips() {
    $('slipListArea').innerHTML = '<div class="pl-empty">Đang tải...</div>';
    const r = await api.get(`/admin/staff/${S.staffId}/payslip/list`, { silent: true }).catch(e => {
      ui.toast(e.message || 'Lỗi tải phiếu', 'error'); return null;
    });
    if (!r) return;
    S.slips = r.items || [];
    renderSlips();
  }

  function renderSlips() {
    const list = S.slips;
    if (!list.length) {
      $('slipListArea').innerHTML = '<div class="pl-empty">Chưa có phiếu lương nào.</div>';
      return;
    }

    let html = `
      <div class="slip-list">
        <div class="slip-row head">
          <div>Kỳ lương</div>
          <div>Ghi chú</div>
          <div class="num">Tiền công</div>
          <div class="num">Thực nhận</div>
          <div class="num">Đã trả</div>
          <div>Trạng thái</div>
          <div></div>
        </div>`;

    for (const s of list) {
      const paid    = Number(s.paid_amount) || 0;
      const gross   = Number(s.gross_amount) || 0;
      const debt    = Number(s.remaining_debt) || 0;
      const pillCls = paid > 0 ? (debt > 0 ? 'debt' : 'paid') : 'unpaid';
      const pillTxt = paid > 0 ? (debt > 0 ? `Còn nợ ${fmtMoney(debt)}đ` : 'Đã trả đủ') : 'Chưa phát';

      html += `
        <div class="slip-row" data-id="${s.id}" style="cursor:pointer">
          <div>
            <div class="period">${fmtDate(s.from_date)} → ${fmtDate(s.to_date)}</div>
            <div class="meta">Chốt ${fmtDate(s.finalized_at)} · ${s.finalized_by_name || ''}</div>
          </div>
          <div style="font-size:12.5px;color:#64748b">${s.note || ''}</div>
          <div class="num" style="font-weight:600">${fmtMoney(s.total_wage)} đ</div>
          <div class="num" style="font-weight:700;color:#0f172a">${fmtMoney(gross)} đ</div>
          <div class="num" style="color:${paid > 0 ? '#16a34a' : '#94a3b8'}">${paid > 0 ? fmtMoney(paid) + ' đ' : '—'}</div>
          <div><span class="slip-pill ${pillCls}">${pillTxt}</span></div>
          <div style="text-align:right">
            <button class="btn ghost btn-view-slip" data-id="${s.id}"
              style="font-size:12px;padding:4px 10px">Xem</button>
          </div>
        </div>`;
    }

    html += '</div>';
    $('slipListArea').innerHTML = html;

    document.querySelectorAll('.btn-view-slip').forEach(btn => {
      btn.onclick = e => { e.stopPropagation(); openSlipDetail(Number(btn.dataset.id)); };
    });
    document.querySelectorAll('.slip-row[data-id]').forEach(row => {
      row.onclick = () => openSlipDetail(Number(row.dataset.id));
    });
  }

  function openSlipDetail(slipId) {
    const s = S.slips.find(x => x.id === slipId);
    if (!s) return;
    S.detailSlip = s;

    const paid  = Number(s.paid_amount) || 0;
    const gross = Number(s.gross_amount) || 0;
    const debt  = Number(s.remaining_debt) || 0;

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

    $('slipDetailTitle').textContent = `Phiếu lương ${fmtDate(s.from_date)} → ${fmtDate(s.to_date)}`;

    let body = `
      <table class="slip-detail-table" style="margin-bottom:14px">
        <thead><tr>
          <th>#</th><th>Ngày</th><th>Mã đơn</th><th>Dịch vụ</th><th>Tài khoản / Biển số</th>
          <th class="num">Tiền công</th><th>Ghi chú CK</th>
        </tr></thead>
        <tbody>`;

    rows.forEach((r, i) => {
      const infoLines2 = [];
      if (r.tai_khoan) infoLines2.push(`<span style="color:#0369a1">TK: ${r.tai_khoan}</span>`);
      if (r.bien_so)   infoLines2.push(`BSX: ${r.bien_so}`);
      if (r.imei)      infoLines2.push(`IMEI: ${r.imei}`);
      const infoCell2 = infoLines2.join('<br>') || '—';
      const badge = r.row_type === 'commission' ? '<span style="font-size:10px;background:#ede9fe;color:#6d28d9;padding:1px 4px;border-radius:3px;margin-left:3px">hoa hồng</span>' : '';
      body += `<tr>
        <td style="color:#94a3b8">${i+1}</td>
        <td style="white-space:nowrap">${fmtDateShort(r.date)}</td>
        <td><a class="link" href="/admin/order-detail.html?id=${r.order_id}" target="_blank">${r.code||'—'}${badge}</a>${r.code ? ui.copyCodeBtn(r.code) : ''}</td>
        <td style="font-size:12px">${r.service||'—'}</td>
        <td style="font-size:11.5px;line-height:1.5">${infoCell2}</td>
        <td class="num" style="font-weight:600">${fmtMoney(r.wage)}</td>
        <td style="font-size:11px;color:#64748b">${r.pay_note||''}</td>
      </tr>`;
    });

    body += `
      <tr style="background:#fef3c7;font-weight:700">
        <td colspan="5" style="text-align:right;color:#92400e">Tổng tiền công:</td>
        <td class="num" style="color:#92400e">${fmtMoney(totalWage)}</td><td></td>
      </tr>
      </tbody></table>

      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px">
        <div style="flex:1;min-width:200px">`;

    if (extras.length || deductions.length || s.base_salary || s.carried_debt || totalAdvances > 0) {
      body += `<table class="slip-detail-table"><tbody>`;
      if (s.base_salary) body += `<tr><td>Lương cứng</td><td class="num">${fmtMoney(s.base_salary)} đ</td></tr>`;
      for (const e of extras) body += `<tr><td>+ ${e.label}</td><td class="num">${fmtMoney(e.amount)} đ</td></tr>`;
      for (const e of deductions) body += `<tr style="color:#dc2626"><td>− ${e.label}</td><td class="num">− ${fmtMoney(e.amount)} đ</td></tr>`;
      if (totalAdvances > 0) {
        body += `<tr style="background:#fffbeb"><td style="color:#92400e;font-weight:600">Tiền đã ứng (${advances.length} phiếu)</td><td class="num" style="color:#b45309;font-weight:700">− ${fmtMoney(totalAdvances)} đ</td></tr>`;
        for (const a of advances) {
          body += `<tr><td style="padding-left:20px;font-size:11.5px;color:#64748b">${fmtDate(a.created_at)} ${a.note ? '— ' + a.note : ''}</td><td class="num" style="font-size:11.5px;color:#92400e">− ${fmtMoney(a.amount)} đ</td></tr>`;
        }
      }
      if (s.carried_debt) body += `<tr style="background:#fef2f2"><td style="color:#991b1b">Nợ kỳ trước</td><td class="num" style="color:#dc2626">+ ${fmtMoney(s.carried_debt)} đ</td></tr>`;
      body += `</tbody></table>`;
    }

    body += `</div>
        <div style="min-width:200px">
          <table class="slip-detail-table" style="background:#fff">
            <tbody>
              <tr style="background:#dcfce7">
                <td style="font-weight:700;color:#166534">Thực nhận</td>
                <td class="num" style="font-weight:700;font-size:16px;color:#166534">${fmtMoney(gross)} đ</td>
              </tr>
              <tr>
                <td>Đã trả</td>
                <td class="num" style="color:${paid > 0 ? '#16a34a' : '#94a3b8'}">${paid > 0 ? fmtMoney(paid) + ' đ' : '—'}</td>
              </tr>
              ${debt > 0 ? `<tr style="background:#fef3c7"><td style="color:#92400e">Còn nợ</td><td class="num" style="color:#b45309;font-weight:700">${fmtMoney(debt)} đ</td></tr>` : ''}
              ${s.paid_at ? `<tr><td style="color:#64748b">Phát lương lúc</td><td style="color:#64748b;font-size:12px">${fmtDate(s.paid_at)}</td></tr>` : ''}
              ${s.paid_note ? `<tr><td style="color:#64748b">Ghi chú</td><td style="color:#64748b;font-size:12px">${s.paid_note}</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>`;

    $('slipDetailBody').innerHTML = body;

    const canPay    = paid === 0;
    const canDelete = paid === 0;
    $('btnPaySlip').style.display    = canPay    ? '' : 'none';
    $('btnDeleteSlip').style.display = canDelete ? '' : 'none';
    $('btnShareSlip').style.display  = '';

    $('btnShareSlip').onclick = () => {
      const url = `${location.origin}/admin/payslip-view.html?slip=${s.id}&staff=${S.staffId}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => ui.toast('Đã copy link phiếu lương', 'success'));
      }
      window.open(url, '_blank');
    };

    $('btnPaySlip').onclick = () => {
      $('modalSlip').classList.remove('open');
      openPayModal(s);
    };
    $('btnDeleteSlip').onclick = () => deleteSlip(s.id);

    $('modalSlip').classList.add('open');
  }

  // ===== PHÁT LƯƠNG =====
  function openPayModal(slip) {
    S.paySlipId = slip.id;
    const gross = Number(slip.gross_amount) || 0;
    $('paySubtitle').textContent = `Phiếu ${fmtDate(slip.from_date)} → ${fmtDate(slip.to_date)} · Thực nhận: ${fmtMoney(gross)} đ`;
    $('payAmt').value = gross;
    $('payNote').value = '';
    $('payDebtNote').style.display = 'none';
    updatePayDebtNote();
    $('modalPay').classList.add('open');
    setTimeout(() => $('payAmt').select(), 50);
  }

  function updatePayDebtNote() {
    const slip = S.slips.find(s => s.id === S.paySlipId);
    if (!slip) return;
    const gross = Number(slip.gross_amount) || 0;
    const paid  = Math.round(Number($('payAmt').value.replace(/\D/g,'')) || 0);
    const debt  = gross - paid;
    if (paid > 0 && debt > 0) {
      $('payDebtNote').style.display = '';
      $('payDebtNote').style.background = '#fef3c7';
      $('payDebtNote').style.borderColor = '#fde68a';
      $('payDebtNote').style.color = '#92400e';
      $('payDebtNote').textContent = `Còn thiếu ${fmtMoney(debt)} đ — phiếu sẽ ở trạng thái nợ và được cộng vào kỳ sau.`;
    } else if (paid > gross && gross > 0) {
      $('payDebtNote').style.display = '';
      $('payDebtNote').style.background = '#dcfce7';
      $('payDebtNote').style.borderColor = '#86efac';
      $('payDebtNote').style.color = '#166534';
      $('payDebtNote').textContent = `Trả dư ${fmtMoney(paid - gross)} đ.`;
    } else {
      $('payDebtNote').style.display = 'none';
    }
  }

  async function doPay() {
    const slip = S.slips.find(s => s.id === S.paySlipId); if (!slip) return;
    const amount = Math.round(Number($('payAmt').value.replace(/\D/g,'')) || 0);
    const note   = $('payNote').value.trim();
    if (!amount) return ui.toast('Nhập số tiền', 'warning');

    $('modalPaySave').disabled = true;
    try {
      await api.post(`/admin/staff/${S.staffId}/payslip/${S.paySlipId}/pay`, { amount, note });
      ui.toast('Đã phát lương!', 'success');
      $('modalPay').classList.remove('open');
      loadSlips();
    } catch (e) {
      ui.toast(e.message || 'Lỗi', 'error');
    } finally {
      $('modalPaySave').disabled = false;
    }
  }

  async function deleteSlip(slipId) {
    if (!await ui.confirm('Xóa phiếu lương này? Các đơn hàng và ứng lương sẽ được giải phóng ra kỳ mới.')) return;
    try {
      await api.delete(`/admin/staff/${S.staffId}/payslip/${slipId}`);
      ui.toast('Đã xóa phiếu', 'success');
      $('modalSlip').classList.remove('open');
      loadAll();
    } catch (e) {
      ui.toast(e.message || 'Lỗi xóa', 'error');
    }
  }

  // ===== Boot =====
  document.addEventListener('DOMContentLoaded', init);
})();
