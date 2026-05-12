// Bang luong nhan vien — layout tab (Bang luong / Ung truoc / Lich su ky)
(function () {
  'use strict';
  adminShell.init('staff');

  const $ = (id) => document.getElementById(id);
  const IS_ADMIN = () => !!(window.auth && auth.isAdmin && auth.isAdmin());
  const fmt = new Intl.NumberFormat('vi-VN');

  const state = {
    staffId: null, staffName: '', period: '',
    finalized: false,
    rows: [], extras: [], advances: [],
    base: 0, insurance: 0, advance: 0,
    note: '',
    totals: { revenue: 0, wage: 0 },
    finalizedAt: null, finalizedByName: '',
    history: [],
    activeTab: 'bangluong',
  };

  // =========================================================
  // Init
  // =========================================================
  async function init() {
    const now = new Date();
    $('selPeriod').value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    state.period = $('selPeriod').value;

    const r = await api.get('/admin/staff?limit=200', { silent: true }).catch(() => null);
    if (r?.items) {
      r.items.forEach(s => {
        const o = document.createElement('option');
        o.value = s.id;
        o.textContent = `${s.full_name || s.username} (${s.username})`;
        $('selStaff').appendChild(o);
      });
    }

    const qp = new URLSearchParams(location.search);
    if (qp.get('staff')) $('selStaff').value = qp.get('staff');
    if (qp.get('period') && /^\d{4}-\d{2}$/.test(qp.get('period'))) {
      $('selPeriod').value = qp.get('period');
      state.period = qp.get('period');
    }

    $('selStaff').addEventListener('change', loadAll);
    $('selPeriod').addEventListener('change', () => { state.period = $('selPeriod').value; loadAll(); });
    $('btnPrint').addEventListener('click', () => window.print());
    $('btnExcel').addEventListener('click', exportExcel);
    $('btnFinalize').addEventListener('click', doFinalize);
    $('btnUnfinalize').addEventListener('click', doUnfinalize);

    // Tabs
    document.querySelectorAll('.pr-tab').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Modal ung truoc
    $('modalAdvClose').addEventListener('click', () => $('modalAdv').classList.remove('open'));
    $('modalAdvCancel').addEventListener('click', () => $('modalAdv').classList.remove('open'));
    $('modalAdvSave').addEventListener('click', saveAdvance);
    $('advAmt').addEventListener('focus', () => { const v = parseMoney($('advAmt').value); $('advAmt').value = v || ''; });
    $('advAmt').addEventListener('blur',  () => { const v = parseMoney($('advAmt').value); $('advAmt').value = v ? fmt.format(v) : ''; });

    if ($('selStaff').value) loadAll();
  }

  function switchTab(name) {
    state.activeTab = name;
    document.querySelectorAll('.pr-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.pr-panel').forEach(p => p.classList.remove('active'));
    const panelMap = { bangluong: 'panelBangLuong', ungtuoc: 'panelUngTruoc', lichsu: 'panelLichSu' };
    $(panelMap[name])?.classList.add('active');
  }

  async function loadAll() {
    state.staffId   = Number($('selStaff').value) || null;
    state.period    = $('selPeriod').value || '';
    state.staffName = $('selStaff').selectedOptions[0]?.textContent || '';

    if (!state.staffId || !state.period) {
      resetUI();
      return;
    }
    await Promise.all([loadPayroll(), loadHistory()]);
  }

  function resetUI() {
    $('prStatus').style.display = 'none';
    $('prTabs').style.display   = 'none';
    ['btnPrint','btnExcel','btnFinalize'].forEach(id => $(id).disabled = true);
    $('btnFinalize').style.display   = '';
    $('btnUnfinalize').style.display = 'none';
    $('prTableWrap').innerHTML  = `<div class="pr-empty">Chọn nhân viên và tháng để xem bảng lương.</div>`;
    $('prAdvContent').innerHTML = `<div class="pr-empty">Chọn nhân viên và tháng để xem phiếu ứng trước.</div>`;
    $('prHistContent').innerHTML= `<div class="pr-empty">Chọn nhân viên để xem lịch sử tất toán.</div>`;
  }

  async function loadPayroll() {
    const r = await api.get(`/admin/staff/${state.staffId}/payroll?period=${state.period}`,
      { loading: true, silent: true }).catch(() => null);
    if (!r) { $('prTableWrap').innerHTML = `<div class="pr-empty">Không tải được dữ liệu.</div>`; return; }

    state.finalized       = !!r.finalized;
    state.rows            = r.rows || [];
    state.extras          = r.extras || [];
    state.advances        = r.advances || [];
    state.base            = r.base_salary || 0;
    state.insurance       = r.insurance_amount || 0;
    state.advance         = r.advance_amount || 0;
    state.note            = r.note || '';
    state.totals          = { revenue: r.totals?.revenue || 0, wage: r.totals?.wage || 0 };
    state.finalizedAt     = r.finalized_at || null;
    state.finalizedByName = r.finalized_by_name || '';

    renderStatus();
    renderBangLuong();
    renderUngTruoc();
  }

  async function loadHistory() {
    const r = await api.get(`/admin/staff/${state.staffId}/payroll/history`, { silent: true }).catch(() => null);
    state.history = r?.items || [];
    renderLichSu();
  }

  // =========================================================
  // Render status + toolbar
  // =========================================================
  function renderStatus() {
    $('prTabs').style.display = '';

    const st = $('prStatus');
    st.style.display = '';
    st.className = 'pr-status ' + (state.finalized ? 'finalized' : 'draft');
    st.textContent = state.finalized
      ? `Đã chốt ${formatDateTime(state.finalizedAt)}${state.finalizedByName ? ' · ' + state.finalizedByName : ''}`
      : 'Chưa chốt';

    $('btnPrint').disabled = false;
    $('btnExcel').disabled = false;

    if (!IS_ADMIN()) {
      $('btnFinalize').style.display   = 'none';
      $('btnUnfinalize').style.display = 'none';
    } else {
      $('btnFinalize').disabled        = state.finalized;
      $('btnFinalize').style.display   = state.finalized ? 'none' : '';
      $('btnUnfinalize').style.display = state.finalized ? '' : 'none';
    }

    // Badge tab ung truoc
    const badge = $('tabBadgeAdv');
    if (state.advances.length) {
      badge.style.display = '';
      badge.textContent   = state.advances.length;
    } else {
      badge.style.display = 'none';
    }

    $('printSub').textContent =
      `NV: ${state.staffName}  ·  Tháng ${formatPeriod(state.period)}` +
      (state.finalized ? `  ·  Đã chốt ${formatDateTime(state.finalizedAt)}` : '');
  }

  // =========================================================
  // Tab 1: Bang luong
  // =========================================================
  function renderBangLuong() {
    const ro  = state.finalized;
    const html = [];

    html.push(`<table class="pr-table">
      <thead><tr>
        <th style="width:68px">Ngày</th>
        <th>Loại đơn / Mã</th>
        <th style="width:180px">Thông tin thiết bị</th>
        <th class="num col-revenue" style="width:120px">Doanh thu</th>
        <th class="num col-wage"    style="width:120px">Tiền công</th>
        <th class="col-note"        style="width:170px">Ghi chú CK</th>
      </tr></thead>
      <tbody>`);

    if (!state.rows.length && !state.extras.length) {
      html.push(`<tr><td colspan="5" class="center" style="padding:26px;color:#94a3b8;font-style:italic">Không có đơn nào trong tháng này.</td></tr>`);
    }

    state.rows.forEach(r => {
      const lbl  = escapeHtml(r.template_name || r.service_label || '');
      const orderLink = r.order_id
        ? `<a href="/admin/orders.html#order-${r.order_id}" target="_blank" class="pr-order-link">${lbl || '(Đơn #' + r.order_id + ')'}</a>`
        : (lbl || '');
      const code = r.code
        ? ` <a href="/admin/orders.html#order-${r.order_id}" target="_blank" class="pr-code-link">· ${escapeHtml(r.code)}</a>`
        : '';
      const rowBadge = r.row_type === 'staff_commission'
        ? ` <span class="pr-badge-commission">Hoa hồng</span>`
        : '';
      const payBadge = payStatusBadge(r.payment_status);
      const deviceHtml = renderPayrollDeviceInfo(r);
      html.push(`<tr style="vertical-align:top">
        <td style="color:#64748b;font-size:12px;padding-top:10px">${formatDateShort(r.completed_at)}</td>
        <td style="padding-top:10px">${orderLink}${code}${rowBadge}${payBadge}</td>
        <td style="padding:6px 8px">${deviceHtml}</td>
        <td class="num col-revenue" style="padding-top:10px">${fmt.format(r.revenue || 0)}</td>
        <td class="num col-wage" style="padding-top:10px">${fmt.format(r.wage || 0)}</td>
        <td class="col-note" style="font-size:12px;color:#64748b;padding-top:10px">${escapeHtml(r.payment_note || '')}</td>
      </tr>`);
    });

    state.extras.forEach((e, i) => {
      html.push(`<tr class="row-extra" data-extra="${i}">
        <td colspan="3">
          <input class="ce" type="text" data-ek="note" value="${escapeAttr(e.note||'')}" placeholder="Ghi chú phụ cấp" ${ro?'readonly':''}>
        </td>
        <td class="num"></td>
        <td class="num col-wage">
          <input class="ce num" type="text" data-ek="amount" value="${e.amount ? fmt.format(e.amount) : ''}" placeholder="0" ${ro?'readonly':''}>
        </td>
        <td>${ro ? '' : `<button class="rm-extra" data-rm="${i}" title="Xoá">×</button>`}</td>
      </tr>`);
    });

    if (!ro) {
      html.push(`<tr class="row-extra-add"><td colspan="6" class="center">
        <button class="add-extra-btn" id="btnAddExtra">+ Thêm dòng phụ cấp</button>
      </td></tr>`);
    }

    const totalExtras  = state.extras.reduce((s, e) => s + (Number(e.amount)||0), 0);
    const totalWageAll = state.totals.wage + totalExtras;
    html.push(`<tr class="row-total">
      <td colspan="3" class="center">TỔNG CỘNG</td>
      <td class="num col-revenue">${fmt.format(state.totals.revenue)}</td>
      <td class="num col-wage" id="totalWageCell">${fmt.format(totalWageAll)}</td>
      <td class="col-note"></td>
    </tr></tbody></table>`);

    // Summary
    const finalAmt = (state.base||0) + totalWageAll - (state.insurance||0) - (state.advance||0);
    html.push(`<div class="pr-summary-row">
      <div class="pr-summary">
        <div class="s-row">
          <div class="lbl">Cơ bản</div>
          <div class="val"><input type="text" id="inBase" value="${state.base ? fmt.format(state.base) : ''}" placeholder="0" ${ro?'readonly':''}></div>
        </div>
        <div class="s-row">
          <div class="lbl">BHXH</div>
          <div class="val"><input type="text" id="inIns" value="${state.insurance ? fmt.format(state.insurance) : ''}" placeholder="0" ${ro?'readonly':''}></div>
        </div>
        <div class="s-row">
          <div class="lbl">Ứng trước</div>
          <div class="val"><input type="text" id="inAdv" value="${state.advance ? fmt.format(state.advance) : ''}" placeholder="0" ${ro?'readonly':''}></div>
        </div>
        <div class="s-row final">
          <div class="lbl">Còn lại</div>
          <div class="val" id="finalCell">${fmt.format(finalAmt)}</div>
        </div>
      </div>
      <div class="pr-note-block">
        <label>Ghi chú phiếu</label>
        <input type="text" id="inPayNote" class="input" value="${escapeAttr(state.note||'')}" placeholder="Ghi chú khi chốt sổ (tùy chọn)" ${ro?'readonly':''}>
      </div>
    </div>`);

    $('prTableWrap').innerHTML = html.join('');
    bindBangLuongEvents(ro);
    recalcFinal();
  }

  function bindBangLuongEvents(ro) {
    if (ro) return;

    $('btnAddExtra')?.addEventListener('click', () => {
      state.extras.push({ note: '', amount: 0 });
      renderBangLuong();
    });

    document.querySelectorAll('.row-extra').forEach(tr => {
      const i = Number(tr.dataset.extra);
      tr.querySelectorAll('input[data-ek]').forEach(inp => {
        inp.addEventListener('input', () => {
          if (inp.dataset.ek === 'amount') state.extras[i].amount = parseMoney(inp.value);
          else state.extras[i].note = inp.value;
          recalcFinal();
        });
        if (inp.dataset.ek === 'amount') {
          inp.addEventListener('focus', () => { inp.value = state.extras[i].amount ? String(state.extras[i].amount) : ''; });
          inp.addEventListener('blur',  () => { const v = state.extras[i].amount||0; inp.value = v ? fmt.format(v) : ''; });
        }
      });
      tr.querySelectorAll('.rm-extra').forEach(btn => {
        btn.addEventListener('click', () => { state.extras.splice(Number(btn.dataset.rm), 1); renderBangLuong(); });
      });
    });

    [['inBase','base'],['inIns','insurance'],['inAdv','advance']].forEach(([id, key]) => {
      const el = $(id); if (!el) return;
      el.addEventListener('focus', () => { const v = parseMoney(el.value); el.value = v || ''; });
      el.addEventListener('input', () => { state[key] = parseMoney(el.value); recalcFinal(); });
      el.addEventListener('blur',  () => { const v = state[key]||0; el.value = v ? fmt.format(v) : ''; });
    });
  }

  function recalcFinal() {
    const totalExtras  = state.extras.reduce((s, e) => s + (Number(e.amount)||0), 0);
    const totalWageAll = state.totals.wage + totalExtras;
    const finalAmt     = (state.base||0) + totalWageAll - (state.insurance||0) - (state.advance||0);
    const c1 = $('finalCell');    if (c1) c1.textContent = fmt.format(finalAmt);
    const c2 = $('totalWageCell'); if (c2) c2.textContent = fmt.format(totalWageAll);
  }

  // =========================================================
  // Tab 2: Ung truoc
  // =========================================================
  function renderUngTruoc() {
    const ro  = state.finalized;
    const html = [];
    const total = state.advances.reduce((s, a) => s + (Number(a.amount)||0), 0);

    html.push(`<div class="adv-topbar">
      <h3>Phiếu ứng trước — ${formatPeriod(state.period)}</h3>
      ${!ro && IS_ADMIN() ? `<button class="btn primary" id="btnOpenAdvModal">+ Thêm phiếu ứng</button>` : ''}
    </div>`);

    if (!state.advances.length) {
      html.push(`<div class="adv-empty">Chưa có phiếu ứng trước nào trong tháng này.</div>`);
    } else {
      html.push(`<table class="adv-table">
        <thead><tr>
          <th style="width:110px">Ngày tạo</th>
          <th>Ghi chú</th>
          <th style="text-align:right;width:140px">Số tiền</th>
          <th style="width:140px">Người tạo</th>
          ${!ro ? '<th style="width:40px"></th>' : ''}
        </tr></thead>
        <tbody>`);
      state.advances.forEach(a => {
        html.push(`<tr>
          <td style="font-size:12px;color:#64748b">${formatDateShort2(a.created_at)}</td>
          <td>${escapeHtml(a.note||'')}</td>
          <td class="num">${fmt.format(a.amount||0)}</td>
          <td style="font-size:12px;color:#64748b">${escapeHtml(a.created_by_name||'')}</td>
          ${!ro ? `<td><button class="rm-adv" data-aid="${a.id}" title="Xoá">×</button></td>` : ''}
        </tr>`);
      });
      html.push(`</tbody></table>
        <div class="adv-total-row">Tổng ứng: ${fmt.format(total)} đ</div>`);
    }

    if (ro) {
      html.push(`<p style="margin-top:12px;font-size:12.5px;color:#64748b">Kỳ đã chốt — phiếu ứng không thể thay đổi.</p>`);
    }

    $('prAdvContent').innerHTML = html.join('');

    // Bind events
    $('btnOpenAdvModal')?.addEventListener('click', openAdvModal);
    document.querySelectorAll('.rm-adv').forEach(btn => {
      btn.addEventListener('click', async () => {
        const aid = Number(btn.dataset.aid);
        const ok  = await ui.confirm({ title: 'Xoá phiếu ứng?', okText: 'Xoá', type: 'danger' });
        if (!ok) return;
        const r = await api.delete(`/admin/staff/${state.staffId}/advances/${aid}`,
          { successMessage: 'Đã xoá phiếu ứng' }).catch(() => null);
        if (r) loadPayroll();
      });
    });
  }

  function openAdvModal() {
    $('modalAdvSub').textContent = `${state.staffName} — Tháng ${formatPeriod(state.period)}`;
    $('advAmt').value  = '';
    $('advNote').value = '';
    $('modalAdv').classList.add('open');
    setTimeout(() => $('advAmt').focus(), 80);
  }

  async function saveAdvance() {
    const amount = parseMoney($('advAmt').value);
    if (!amount) return ui.toast('Nhập số tiền ứng trước', 'warning');
    const note = $('advNote').value.trim();
    const r = await api.post(`/admin/staff/${state.staffId}/advances`, {
      period: state.period, amount, note,
    }, { successMessage: 'Đã thêm phiếu ứng' }).catch(() => null);
    if (r) {
      $('modalAdv').classList.remove('open');
      loadPayroll();
    }
  }

  // =========================================================
  // Tab 3: Lich su ky
  // =========================================================
  function renderLichSu() {
    if (!state.staffId) return;
    if (!state.history.length) {
      $('prHistContent').innerHTML = `<div class="hist-empty">Chưa có kỳ nào được tất toán.</div>`;
      return;
    }

    const rows = state.history.map(h => {
      const voided = h.is_deleted ? 'voided' : '';
      const amt    = Number(h.final_amount) || 0;
      const statusPill = h.is_deleted
        ? `<span class="pill hist-void">Đã huỷ</span>`
        : `<span class="pill hist-ok">Đã chốt</span>`;
      const meta = h.is_deleted
        ? `Chốt ${formatDateTime(h.finalized_at)}${h.finalized_by_name ? ' · '+escapeHtml(h.finalized_by_name) : ''}<br>
           Huỷ ${formatDateTime(h.unfinalized_at)}${h.unfinalized_by_name ? ' · '+escapeHtml(h.unfinalized_by_name) : ''}`
        : `Chốt ${formatDateTime(h.finalized_at)}${h.finalized_by_name ? ' · '+escapeHtml(h.finalized_by_name) : ''}`;
      const loadLink = !h.is_deleted
        ? `<button class="btn ghost sm hist-load" data-period="${h.period}" style="margin-top:4px">Xem</button>`
        : '';
      return `<div class="hist-row ${voided}">
        <span class="period">${formatPeriod(h.period)}</span>
        <span class="meta">${meta}</span>
        <span class="amt${amt < 0 ? ' neg' : ''}">${fmt.format(amt)} đ</span>
        <span class="status">${statusPill}${loadLink}</span>
      </div>`;
    });

    $('prHistContent').innerHTML = `<div class="hist-list">${rows.join('')}</div>`;

    document.querySelectorAll('.hist-load').forEach(btn => {
      btn.addEventListener('click', () => {
        $('selPeriod').value = btn.dataset.period;
        state.period = btn.dataset.period;
        switchTab('bangluong');
        loadAll();
      });
    });
  }

  // =========================================================
  // Finalize / Unfinalize
  // =========================================================
  async function doFinalize() {
    if (!state.staffId || !state.period) return;
    const totalExtras  = state.extras.reduce((s, e) => s + (Number(e.amount)||0), 0);
    const totalWageAll = state.totals.wage + totalExtras;
    const finalAmt     = (state.base||0) + totalWageAll - (state.insurance||0) - (state.advance||0);

    const ok = await ui.confirm({
      title: 'Tất toán tháng?',
      message: `Chốt <b>${state.rows.length} đơn</b> của <b>${state.staffName}</b> tháng <b>${formatPeriod(state.period)}</b>.<br>
        Còn lại phải trả: <b style="color:#166534">${fmt.format(finalAmt)} đ</b>.<br>
        Các đơn và phiếu ứng sẽ được đánh dấu đã kết.`,
      okText: 'Tất toán', type: 'warning',
    });
    if (!ok) return;

    const r = await api.post(`/admin/staff/${state.staffId}/payroll/finalize`, {
      period:           state.period,
      base_salary:      state.base,
      insurance_amount: state.insurance,
      advance_amount:   state.advance,
      extras:           state.extras.filter(e => e.note || e.amount),
      note:             $('inPayNote')?.value || '',
    }, { successMessage: 'Đã tất toán tháng' }).catch(() => null);
    if (r) loadAll();
  }

  async function doUnfinalize() {
    const ok = await ui.confirm({
      title: 'Bỏ tất toán?',
      message: 'Phiếu lương sẽ bị huỷ, các đơn và phiếu ứng sẽ được mở lại.',
      okText: 'Bỏ tất toán', type: 'danger',
    });
    if (!ok) return;
    const r = await api.post(`/admin/staff/${state.staffId}/payroll/unfinalize`, {
      period: state.period,
    }, { successMessage: 'Đã bỏ tất toán' }).catch(() => null);
    if (r) loadAll();
  }

  // =========================================================
  // Excel
  // =========================================================
  function exportExcel() {
    if (typeof XLSX === 'undefined') return ui.toast('Thư viện Excel chưa tải xong', 'warning');
    const totalExtras  = state.extras.reduce((s, e) => s + (Number(e.amount)||0), 0);
    const totalWageAll = state.totals.wage + totalExtras;
    const totalAdv     = state.advances.reduce((s, a) => s + (Number(a.amount)||0), 0);
    const finalAmt     = (state.base||0) + totalWageAll - (state.insurance||0) - (state.advance||0);

    const aoa = [];
    aoa.push([`BẢNG LƯƠNG ${state.staffName} - THÁNG ${formatPeriod(state.period)}`]);
    aoa.push([]);
    aoa.push(['Ngày','Loại đơn','Doanh thu','Tiền công','Ghi chú CK']);
    state.rows.forEach(r => {
      aoa.push([
        formatDateShort(r.completed_at),
        (r.template_name||r.service_label||'') + (r.code ? ` · ${r.code}` : ''),
        Number(r.revenue)||0, Number(r.wage)||0, r.payment_note||'',
      ]);
    });
    state.extras.forEach(e => { aoa.push(['', e.note||'', '', Number(e.amount)||0, '']); });
    aoa.push(['TỔNG CỘNG','',state.totals.revenue,totalWageAll,'']);
    aoa.push([]);
    aoa.push(['PHIẾU ỨNG TRƯỚC','','','','']);
    state.advances.forEach(a => { aoa.push([formatDateShort2(a.created_at), a.note||'', '', Number(a.amount)||0, '']); });
    aoa.push(['Tổng ứng','','',totalAdv,'']);
    aoa.push([]);
    aoa.push(['Cơ bản','','','',state.base]);
    aoa.push(['BHXH','','','',state.insurance]);
    aoa.push(['Ứng','','','',state.advance]);
    aoa.push(['CÒN LẠI','','','',finalAmt]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{wch:12},{wch:36},{wch:14},{wch:14},{wch:24}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BangLuong');
    XLSX.writeFile(wb, `BangLuong_${state.staffName.replace(/\s+/g,'_')}_${state.period}.xlsx`);
  }

  // =========================================================
  // Helpers
  // =========================================================
  function payStatusBadge(status) {
    if (!status) return '';
    const map = {
      paid:    ['✓ Đã TT', '#166534', '#dcfce7'],
      partial: ['½ Còn nợ', '#92400e', '#fef3c7'],
      unpaid:  ['✗ Chưa TT', '#991b1b', '#fee2e2'],
    };
    const [label, color, bg] = map[status] || ['', '', ''];
    if (!label) return '';
    return ` <span style="font-size:10px;font-weight:600;padding:1px 5px;border-radius:4px;background:${bg};color:${color};vertical-align:middle">${label}</span>`;
  }

  function parseMoney(s) {
    const n = String(s??'').replace(/[^\d-]/g,'');
    return n ? (parseInt(n,10)||0) : 0;
  }
  function renderPayrollDeviceInfo(r) {
    const rows = [];
    if (r.bien_so_list) r.bien_so_list.split(', ').forEach(v => rows.push({ label: 'Biển số', val: v, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' }));
    if (r.ten_tk_list)  r.ten_tk_list.split(', ').forEach(v => rows.push({ label: 'Tài khoản', val: v, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' }));
    if (r.imei_list)    r.imei_list.split(', ').forEach(v => rows.push({ label: 'IMEI', val: v, color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' }));
    if (r.so_sim_list)  r.so_sim_list.split(', ').forEach(v => rows.push({ label: 'SIM', val: v, color: '#7e22ce', bg: '#faf5ff', border: '#e9d5ff' }));
    if (!rows.length) return '<span style="color:#cbd5e1;font-size:12px">—</span>';
    return rows.map(row => `
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px">
        <span style="flex:0 0 54px;font-size:10px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(row.label)}</span>
        <span style="font-size:11.5px;font-weight:600;color:${row.color};background:${row.bg};border:1px solid ${row.border};border-radius:4px;padding:1px 6px;white-space:nowrap;max-width:110px;overflow:hidden;text-overflow:ellipsis">${escapeHtml(row.val)}</span>
      </div>`).join('');
  }

  function escapeHtml(s) {
    return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function escapeAttr(s) { return escapeHtml(s); }
  function formatDateShort(s) {
    if (!s) return '';
    const d = new Date(String(s).replace(' ','T'));
    return isNaN(d.getTime()) ? String(s).slice(0,10) : `${d.getDate()}/${d.getMonth()+1}`;
  }
  function formatDateShort2(s) {
    if (!s) return '';
    const d = new Date(String(s).replace(' ','T'));
    if (isNaN(d.getTime())) return String(s).slice(0,10);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }
  function formatDateTime(s) {
    if (!s) return '';
    const d = new Date(String(s).replace(' ','T'));
    if (isNaN(d.getTime())) return String(s);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} `+
           `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
  function formatPeriod(s) {
    if (!s||!/^\d{4}-\d{2}$/.test(s)) return s;
    const [y,m] = s.split('-');
    return `${m}/${y}`;
  }

  init();
})();
