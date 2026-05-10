// Bang luong KTV theo thang — bo cuc giong Excel khach gui.
// Lay du lieu tu /api/admin/staff/:id/payroll, render bang dong.
// 4 o nhap tay (Co ban, BHXH, Ung) + dong phu cap tay -> tinh "Con lai".
// Tat toan: snapshot + danh debt_carried_at cho cac don trong thang.

(function () {
  'use strict';
  adminShell.init('payroll');

  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  const state = {
    staffId:   null,
    staffName: '',
    period:    '',                // YYYY-MM
    finalized: false,
    rows:      [],                // tu BE
    extras:    [],                // [{note, amount}]
    base:      0, insurance: 0, advance: 0,
    note:      '',
    totals:    { revenue: 0, wage: 0 },
    finalizedAt: null, finalizedByName: '',
  };

  // ---------------- Init ----------------
  async function init() {
    // Chon thang mac dinh = thang hien tai
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    $('selPeriod').value = ym;
    state.period = ym;

    // Load list KTV
    const r = await api.get('/admin/staff?role=kithuat&limit=100', { silent: true }).catch(() => null);
    const sel = $('selStaff');
    if (r && r.items) {
      r.items.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.full_name || s.username} (${s.username})`;
        sel.appendChild(opt);
      });
    }

    // Pre-fill tu URL ?staff=&period=
    const qp = new URLSearchParams(location.search);
    if (qp.get('staff')) sel.value = qp.get('staff');
    if (qp.get('period') && /^\d{4}-\d{2}$/.test(qp.get('period'))) {
      $('selPeriod').value = qp.get('period');
      state.period = qp.get('period');
    }

    sel.addEventListener('change', () => loadIfReady());
    $('selPeriod').addEventListener('change', () => {
      state.period = $('selPeriod').value;
      loadIfReady();
    });
    $('btnPrint').addEventListener('click', () => window.print());
    $('btnExcel').addEventListener('click', exportExcel);
    $('btnFinalize').addEventListener('click', doFinalize);
    $('btnUnfinalize').addEventListener('click', doUnfinalize);

    if (sel.value) loadIfReady();
  }

  function loadIfReady() {
    state.staffId = Number($('selStaff').value) || null;
    state.period  = $('selPeriod').value || '';
    if (!state.staffId || !state.period) {
      $('prContent').innerHTML = `<div class="pr-empty">Chọn KTV và tháng để xem bảng lương.</div>`;
      $('prStatus').style.display = 'none';
      ['btnPrint','btnExcel','btnFinalize'].forEach(id => $(id).disabled = true);
      $('btnUnfinalize').style.display = 'none';
      return;
    }
    state.staffName = $('selStaff').selectedOptions[0]?.textContent || '';
    load();
  }

  async function load() {
    const r = await api.get(`/admin/staff/${state.staffId}/payroll?period=${state.period}`,
      { loading: true, silent: true }).catch(() => null);
    if (!r) {
      $('prContent').innerHTML = `<div class="pr-empty">Không tải được dữ liệu.</div>`;
      return;
    }
    state.finalized       = !!r.finalized;
    state.rows            = r.rows || [];
    state.extras          = r.extras || [];
    state.base            = r.base_salary || 0;
    state.insurance       = r.insurance_amount || 0;
    state.advance         = r.advance_amount || 0;
    state.note            = r.note || '';
    state.totals          = { revenue: r.totals?.revenue || 0, wage: r.totals?.wage || 0 };
    state.finalizedAt     = r.finalized_at || null;
    state.finalizedByName = r.finalized_by_name || '';

    render();
  }

  // ---------------- Render ----------------
  function render() {
    const st = $('prStatus');
    st.style.display = '';
    st.className = 'pr-status ' + (state.finalized ? 'finalized' : 'draft');
    st.textContent = state.finalized
      ? `Đã chốt ${formatDateTime(state.finalizedAt)}${state.finalizedByName ? ' · ' + state.finalizedByName : ''}`
      : 'Chưa chốt';

    $('btnPrint').disabled    = false;
    $('btnExcel').disabled    = false;
    $('btnFinalize').disabled = state.finalized;
    $('btnFinalize').style.display    = state.finalized ? 'none' : '';
    $('btnUnfinalize').style.display  = state.finalized ? '' : 'none';

    $('printSub').textContent =
      `KTV: ${state.staffName}  ·  Tháng ${formatPeriod(state.period)}` +
      (state.finalized ? `  ·  Đã chốt ${formatDateTime(state.finalizedAt)}` : '');

    const ro = state.finalized; // readonly khi da chot

    const html = [];
    html.push(`<table class="pr-table">
      <thead>
        <tr>
          <th style="width:90px">Ngày</th>
          <th>Loại đơn</th>
          <th class="num col-revenue" style="width:130px">Thu khách</th>
          <th class="num col-wage" style="width:130px">Tiền công</th>
          <th class="col-note" style="width:200px">Ghi chú CK</th>
        </tr>
      </thead>
      <tbody>`);

    if (!state.rows.length && !state.extras.length) {
      html.push(`<tr><td colspan="5" class="center" style="padding:24px;color:#94a3b8;font-style:italic">Không có đơn nào trong tháng này.</td></tr>`);
    }

    state.rows.forEach(r => {
      html.push(`<tr>
        <td>${formatDateShort(r.completed_at)}</td>
        <td>${escapeHtml(r.template_name || r.service_label || '')}${r.code ? ` <span style="color:#94a3b8;font-size:11.5px">· ${escapeHtml(r.code)}</span>` : ''}</td>
        <td class="num col-revenue">${fmt.format(r.revenue || 0)}</td>
        <td class="num col-wage">${fmt.format(r.wage || 0)}</td>
        <td class="col-note">${escapeHtml(r.payment_note || '')}</td>
      </tr>`);
    });

    // Phu cap tay
    state.extras.forEach((e, i) => {
      html.push(`<tr class="row-extra" data-extra="${i}">
        <td colspan="2">
          <input class="ce" type="text" data-ek="note" value="${escapeAttr(e.note || '')}" placeholder="Ghi chú phụ cấp (vd: phí di chuyển)" ${ro ? 'readonly' : ''}>
        </td>
        <td class="num"></td>
        <td class="num col-wage">
          <input class="ce num" type="text" data-ek="amount" value="${e.amount ? fmt.format(e.amount) : ''}" placeholder="0" ${ro ? 'readonly' : ''}>
        </td>
        <td>${ro ? '' : `<button type="button" class="rm-extra" data-rm="${i}" title="Xoá">×</button>`}</td>
      </tr>`);
    });

    if (!ro) {
      html.push(`<tr class="row-extra-add"><td colspan="5" class="center">
        <button type="button" class="add-extra-btn" id="btnAddExtra">+ Thêm dòng phụ cấp</button>
      </td></tr>`);
    }

    // Tong cong
    const totalExtras = state.extras.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalWageAll = state.totals.wage + totalExtras;
    html.push(`<tr class="row-total">
      <td colspan="2" class="center">TỔNG CỘNG</td>
      <td class="num col-revenue">${fmt.format(state.totals.revenue)}</td>
      <td class="num col-wage">${fmt.format(totalWageAll)}</td>
      <td class="col-note"></td>
    </tr>`);

    html.push(`</tbody></table>`);

    // Khoi summary cuoi
    const finalAmt = state.base + totalWageAll - state.insurance - state.advance;
    html.push(`<div class="pr-summary">
      <div class="lbl">Cơ bản</div>
      <div class="val"><input type="text" id="inBase" value="${state.base ? fmt.format(state.base) : ''}" placeholder="0" ${ro ? 'readonly' : ''}></div>
      <div class="lbl">BHXH</div>
      <div class="val"><input type="text" id="inIns" value="${state.insurance ? fmt.format(state.insurance) : ''}" placeholder="0" ${ro ? 'readonly' : ''}></div>
      <div class="lbl">Ứng</div>
      <div class="val"><input type="text" id="inAdv" value="${state.advance ? fmt.format(state.advance) : ''}" placeholder="0" ${ro ? 'readonly' : ''}></div>
      <div class="lbl row-final">Còn lại</div>
      <div class="val row-final" id="finalCell">${fmt.format(finalAmt)}</div>
    </div>`);

    if (state.note || ro) {
      html.push(`<div style="margin-top:10px"><label style="font-size:12px;color:#64748b;font-weight:600">Ghi chú phiếu</label>
        <input type="text" id="inPayNote" class="input" value="${escapeAttr(state.note || '')}" ${ro ? 'readonly' : ''}></div>`);
    } else {
      html.push(`<div style="margin-top:10px"><label style="font-size:12px;color:#64748b;font-weight:600">Ghi chú phiếu</label>
        <input type="text" id="inPayNote" class="input" placeholder="Ghi chú khi chốt sổ (tùy chọn)"></div>`);
    }

    $('prContent').innerHTML = html.join('');

    bindEvents(ro);
    recalcFinal();
  }

  function bindEvents(ro) {
    if (ro) return;

    $('btnAddExtra')?.addEventListener('click', () => {
      state.extras.push({ note: '', amount: 0 });
      render();
    });

    document.querySelectorAll('.row-extra').forEach(tr => {
      const i = Number(tr.dataset.extra);
      tr.querySelectorAll('input[data-ek]').forEach(inp => {
        inp.addEventListener('input', () => {
          const k = inp.dataset.ek;
          if (k === 'amount') {
            const v = parseMoney(inp.value);
            state.extras[i].amount = v;
            // re-format khi blur de tranh nhay con tro
            inp.dataset.raw = String(v);
          } else {
            state.extras[i].note = inp.value;
          }
          recalcFinal();
        });
        inp.addEventListener('blur', () => {
          if (inp.dataset.ek === 'amount') {
            const v = Number(state.extras[i].amount) || 0;
            inp.value = v ? fmt.format(v) : '';
          }
        });
      });
      tr.querySelectorAll('.rm-extra').forEach(btn => {
        btn.addEventListener('click', () => {
          state.extras.splice(Number(btn.dataset.rm), 1);
          render();
        });
      });
    });

    [['inBase','base'],['inIns','insurance'],['inAdv','advance']].forEach(([id, key]) => {
      const el = $(id); if (!el) return;
      el.addEventListener('input', () => {
        state[key] = parseMoney(el.value);
        recalcFinal();
      });
      el.addEventListener('blur', () => {
        const v = Number(state[key]) || 0;
        el.value = v ? fmt.format(v) : '';
      });
    });
  }

  function recalcFinal() {
    const totalExtras = state.extras.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalWageAll = state.totals.wage + totalExtras;
    const finalAmt = (state.base || 0) + totalWageAll - (state.insurance || 0) - (state.advance || 0);
    const cell = $('finalCell');
    if (cell) cell.textContent = fmt.format(finalAmt);
    // cap nhat hang TONG CONG
    document.querySelectorAll('.pr-table .row-total .col-wage').forEach(td => {
      td.textContent = fmt.format(totalWageAll);
    });
  }

  // ---------------- Actions ----------------
  async function doFinalize() {
    if (!state.staffId || !state.period) return;
    const totalExtras = state.extras.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalWageAll = state.totals.wage + totalExtras;
    const finalAmt = (state.base || 0) + totalWageAll - (state.insurance || 0) - (state.advance || 0);

    const ok = await ui.confirm({
      title: 'Tất toán tháng?',
      message: `Sẽ chốt ${state.rows.length} đơn của ${state.staffName} trong tháng ${formatPeriod(state.period)}.<br>
        Còn lại phải trả KTV: <b>${fmt.format(finalAmt)}đ</b>.<br>
        Sau khi tất toán, các đơn sẽ được đánh dấu đã kết, không còn nằm trong công nợ.`,
      okText: 'Tất toán',
      type: 'warning',
    });
    if (!ok) return;

    const noteVal = $('inPayNote')?.value || '';
    const r = await api.post(`/admin/staff/${state.staffId}/payroll/finalize`, {
      period: state.period,
      base_salary: state.base,
      insurance_amount: state.insurance,
      advance_amount: state.advance,
      extras: state.extras.filter(e => e.note || e.amount),
      note: noteVal,
    }, { successMessage: 'Đã tất toán tháng' }).catch(() => null);
    if (r) load();
  }

  async function doUnfinalize() {
    const ok = await ui.confirm({
      title: 'Bỏ tất toán?',
      message: 'Phiếu lương sẽ bị xoá và các đơn sẽ được mở lại trong công nợ.',
      okText: 'Bỏ tất toán',
      type: 'danger',
    });
    if (!ok) return;
    const r = await api.post(`/admin/staff/${state.staffId}/payroll/unfinalize`, {
      period: state.period,
    }, { successMessage: 'Đã bỏ tất toán' }).catch(() => null);
    if (r) load();
  }

  // ---------------- Excel export ----------------
  function exportExcel() {
    if (typeof XLSX === 'undefined') return ui.toast('Thư viện Excel chưa tải xong', 'warning');
    const totalExtras = state.extras.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalWageAll = state.totals.wage + totalExtras;
    const finalAmt = (state.base || 0) + totalWageAll - (state.insurance || 0) - (state.advance || 0);

    const aoa = [];
    aoa.push([`BẢNG LƯƠNG ${state.staffName} - THÁNG ${formatPeriod(state.period)}`]);
    aoa.push([]);
    aoa.push(['Ngày', 'Loại đơn', 'Thu khách', 'Tiền công', 'Ghi chú CK']);
    state.rows.forEach(r => {
      aoa.push([
        formatDateShort(r.completed_at),
        (r.template_name || r.service_label || '') + (r.code ? ` · ${r.code}` : ''),
        Number(r.revenue) || 0,
        Number(r.wage) || 0,
        r.payment_note || '',
      ]);
    });
    state.extras.forEach(e => {
      aoa.push(['', e.note || '', '', Number(e.amount) || 0, '']);
    });
    aoa.push(['TỔNG CỘNG', '', state.totals.revenue, totalWageAll, '']);
    aoa.push([]);
    aoa.push(['Cơ bản',   '', '', '', state.base,      '']);
    aoa.push(['BHXH',     '', '', '', state.insurance, '']);
    aoa.push(['Ứng',      '', '', '', state.advance,   '']);
    aoa.push(['CÒN LẠI',  '', '', '', finalAmt,        '']);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{wch:10},{wch:14},{wch:30},{wch:14},{wch:14},{wch:24}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BangLuong');
    XLSX.writeFile(wb, `BangLuong_${state.staffName.replace(/\s+/g,'_')}_${state.period}.xlsx`);
  }

  // ---------------- Helpers ----------------
  function parseMoney(s) {
    if (s == null) return 0;
    const n = String(s).replace(/[^\d-]/g, '');
    return n ? parseInt(n, 10) || 0 : 0;
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function escapeAttr(s) { return escapeHtml(s); }
  function formatDateShort(s) {
    if (!s) return '';
    const d = new Date(String(s).replace(' ', 'T'));
    if (isNaN(d.getTime())) return String(s).slice(0, 10);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }
  function formatDateTime(s) {
    if (!s) return '';
    const d = new Date(String(s).replace(' ', 'T'));
    if (isNaN(d.getTime())) return String(s);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`;
  }
  function formatPeriod(s) {
    if (!s || !/^\d{4}-\d{2}$/.test(s)) return s;
    const [y, m] = s.split('-');
    return `${m}/${y}`;
  }

  init();
})();
