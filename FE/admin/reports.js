// Admin dashboard — reports.js
// Bo cuc: Dashboard tab (KPI + charts + action tables) + 3 tab chi tiet
(function () {
  'use strict';

  // ── Helpers ──────────────────────────────────────────────────────────────
  const $  = id => document.getElementById(id);
  const fmtNum = new Intl.NumberFormat('vi-VN');
  const fmtMoney = v => fmtNum.format(Number(v) || 0) + 'đ';

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function fmtDate(d) {
    if (!d) return '—';
    return String(d).replace('T',' ').slice(0,16);
  }

  function defaultDates() {
    const to   = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 29);
    const fmt = d => d.toISOString().slice(0,10);
    return { from: fmt(from), to: fmt(to) };
  }

  // ── Debounce ──────────────────────────────────────────────────────────────
  function debounce(fn, ms) {
    let t;
    return function () {
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(null, args); }, ms);
    };
  }

  // ── Cache (url → {data, expires}) ─────────────────────────────────────
  var _cache = {};
  var CACHE_TTL = 45000;

  async function cachedGet(url) {
    var now = Date.now();
    var hit = _cache[url];
    if (hit && hit.expires > now) return hit.data;
    var data = await api.get(url, { silent: true });
    _cache[url] = { data: data, expires: now + CACHE_TTL };
    return data;
  }

  function clearCache() { _cache = {}; }

  // ── Chart registry ──────────────────────────────────────────────────────
  var charts = {};

  function destroyChart(key) {
    if (charts[key]) { charts[key].destroy(); delete charts[key]; }
  }

  function showChart(canvasId, show) {
    var canvas = $(canvasId);
    var empty  = $('empty-' + canvasId);
    var wrap   = $('wrap-' + canvasId);
    if (!canvas) return;
    if (show) {
      if (wrap)  wrap.style.display = '';
      if (empty) empty.style.display = 'none';
      canvas.style.display = '';
    } else {
      if (wrap)  wrap.style.display = 'none';
      if (empty) empty.style.display = '';
      canvas.style.display = 'none';
    }
  }

  // ── Filter helpers ─────────────────────────────────────────────────────
  function dbFilter() {
    return {
      from:    $('db_from').value || '',
      to:      $('db_to').value   || '',
      groupBy: $('db_group').value || 'day',
    };
  }

  function buildQS(extra) {
    var f = dbFilter();
    var p = new URLSearchParams();
    if (f.from) p.set('from', f.from);
    if (f.to)   p.set('to',   f.to);
    if (extra) {
      Object.keys(extra).forEach(function (k) { p.set(k, extra[k]); });
    }
    return p.toString();
  }

  // ── Status config ───────────────────────────────────────────────────────
  var STATUS_COLOR = {
    pending:     '#9ca3af',
    confirmed:   '#60a5fa',
    in_progress: '#fbbf24',
    done:        '#4ade80',
    cancelled:   '#f87171',
  };
  var STATUS_TEXT = {
    pending:     'Chờ xử lý',
    confirmed:   'Đã xác nhận',
    in_progress: 'Đang làm',
    done:        'Hoàn thành',
    cancelled:   'Huỷ',
  };
  var PALETTE = ['#3b82f6','#f59e0b','#10b981','#a855f7','#ec4899','#ef4444','#14b8a6','#f97316'];

  // ══════════════════════════════════════════════════════════════════════
  //   DASHBOARD
  // ══════════════════════════════════════════════════════════════════════

  function setLoading(on) {
    $('db_loading').style.display = on ? '' : 'none';
    $('db_apply').disabled = on;
  }

  // KPI
  function renderKpis(kpi) {
    var fromLabel = $('db_from').value || '?';
    var toLabel   = $('db_to').value   || '?';
    var cards = [
      { label:'Doanh thu thuần', value:fmtMoney(kpi.net_amount),          cls:'success', accent:'accent-green',  icon:'💹', sub:'Kỳ '+fromLabel+' → '+toLabel },
      { label:'Đã thu',          value:fmtMoney(kpi.paid_amount),          cls:'info',    accent:'accent-blue',   icon:'💰', sub:'Tiền thực nhận' },
      { label:'Hoàn tiền',       value:fmtMoney(kpi.refund_amount),        cls:'danger',  accent:'accent-red',    icon:'↩', sub:'Tổng trả lại' },
      { label:'Còn nợ (kỳ này)', value:fmtMoney(kpi.period_remaining),     cls:'warn',    accent:'accent-yellow', icon:'⚠',  sub:(kpi.total_orders||0)+' đơn trong kỳ' },
      { label:'Tổng công nợ khách', value:fmtMoney(kpi.total_customer_debt), cls:'danger', accent:'accent-red',   icon:'👥', sub:'Toàn thời gian' },
      { label:'KTV chưa nộp',    value:fmtMoney(kpi.staff_unremitted),     cls:'warn',    accent:'accent-yellow', icon:'👷', sub:(kpi.staff_count||0)+' KTV' },
      { label:'Đơn mới / chờ',   value:String(kpi.new_orders||0),          cls:'info',    accent:'accent-blue',   icon:'🆕', sub:'Pending + Confirmed' },
      { label:'Đơn đang làm',    value:String(kpi.in_progress_orders||0),  cls:'',        accent:'accent-purple', icon:'🔧', sub:'Chờ confirm: '+(kpi.admin_pending_count||0) },
    ];
    $('kpi-grid').innerHTML = cards.map(function (c) {
      return '<div class="kpi '+esc(c.accent)+'">'
        + '<div class="kpi-icon">'+c.icon+'</div>'
        + '<div class="kpi-label">'+esc(c.label)+'</div>'
        + '<div class="kpi-value '+esc(c.cls)+'">'+esc(c.value)+'</div>'
        + '<div class="kpi-sub">'+esc(c.sub)+'</div>'
        + '</div>';
    }).join('');
  }

  function renderKpiError() {
    $('kpi-grid').innerHTML = '<div class="kpi" style="grid-column:1/-1;color:var(--danger);font-size:13px">⚠️ Không tải được KPI. Kiểm tra kết nối.</div>';
  }

  // Charts
  function renderRevenueChart(rev) {
    destroyChart('rev');
    var items = (rev.items||[]).slice().sort(function (a,b) { return String(a.period).localeCompare(String(b.period)); });
    if (!items.length) { showChart('chartRevenue', false); return; }
    showChart('chartRevenue', true);
    var sparse = items.length > 60;
    charts.rev = new Chart($('chartRevenue'), {
      type: 'line',
      data: {
        labels: items.map(function (r) { return r.period; }),
        datasets: [
          { label:'Thu thực',   data:items.map(function(r){return Number(r.net_amount||0);}),    borderColor:'#22c55e', backgroundColor:'rgba(34,197,94,.12)', tension:.35, fill:true,  pointRadius: sparse?0:3 },
          { label:'Đã thu',     data:items.map(function(r){return Number(r.paid_amount||0);}),   borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,.06)', tension:.35, fill:false, pointRadius: sparse?0:3, borderDash:[4,3] },
          { label:'Hoàn tiền',  data:items.map(function(r){return Number(r.refund_amount||0);}), borderColor:'#ef4444', backgroundColor:'rgba(239,68,68,.06)',   tension:.35, fill:false, pointRadius: sparse?0:3 },
        ],
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ position:'bottom' } },
        scales:{ y:{ ticks:{ callback:function(v){ return fmtNum.format(v); } } } },
      },
    });
  }

  function renderTopProductsChart(tp) {
    destroyChart('tp');
    var items = (tp.items||[]).slice(0,10);
    if (!items.length) { showChart('chartTopProducts', false); return; }
    showChart('chartTopProducts', true);
    charts.tp = new Chart($('chartTopProducts'), {
      type: 'bar',
      data: {
        labels: items.map(function(p){ return (p.code?p.code+' — ':'')+esc(p.name||''); }),
        datasets:[{ label:'Số lượng bán', data:items.map(function(p){return Number(p.total_qty||0);}), backgroundColor:'#3b82f6' }],
      },
      options: { indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{ticks:{precision:0}}} },
    });
  }

  function renderStatusChart(st) {
    destroyChart('st');
    var items = (st.items||[]).filter(function(r){ return Number(r.count)>0; });
    if (!items.length) { showChart('chartStatus', false); return; }
    showChart('chartStatus', true);
    charts.st = new Chart($('chartStatus'), {
      type: 'doughnut',
      data: {
        labels: items.map(function(r){ return STATUS_TEXT[r.status]||r.status; }),
        datasets:[{ data:items.map(function(r){return Number(r.count);}), backgroundColor:items.map(function(r){ return STATUS_COLOR[r.status]||'#94a3b8'; }) }],
      },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}} },
    });
  }

  function renderTemplateChart(sk) {
    destroyChart('sk');
    var items = (sk.items||[]).filter(function(r){ return Number(r.count)>0; });
    if (!items.length) { showChart('chartServiceKind', false); return; }
    showChart('chartServiceKind', true);
    charts.sk = new Chart($('chartServiceKind'), {
      type: 'pie',
      data: {
        labels: items.map(function(r){ return r.template_name||('Template #'+(r.template_id||'?')); }),
        datasets:[{ data:items.map(function(r){return Number(r.count);}), backgroundColor:PALETTE }],
      },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}} },
    });
  }

  // Action tables
  function renderTopDebtors(res) {
    var items = (res.items||[]).slice(0,20);
    $('cd-count').textContent = items.length;
    if (!items.length) {
      $('cd-tbody').innerHTML = '<tr class="action-tbl-empty"><td colspan="2">Không có công nợ 🎉</td></tr>';
      return;
    }
    $('cd-tbody').innerHTML = items.map(function(c) {
      return '<tr><td><b>'+esc(c.full_name)+'</b>'
        +'<div style="font-size:11px;color:#94a3b8">'+esc(c.code)+(c.phone?' · '+esc(c.phone):'')+'</div></td>'
        +'<td style="text-align:right;font-weight:600;color:var(--danger)">'+fmtMoney(c.debt)+'</td></tr>';
    }).join('');
  }

  function renderPendingPayments(res) {
    var items = (res.items||[]).slice(0,20);
    $('pend-count').textContent = items.length;
    if (!items.length) {
      $('pend-tbody').innerHTML = '<tr class="action-tbl-empty"><td colspan="2">Không có khoản chờ xác nhận 🎉</td></tr>';
      return;
    }
    $('pend-tbody').innerHTML = items.map(function(p) {
      var oid = Number(p.order_id) || 0;
      var rowStart = oid
        ? '<tr data-order-quick="' + oid + '" style="cursor:pointer" title="Click xem nhanh đơn">'
        : '<tr>';
      return rowStart
        +'<td><b>'+esc(p.order_code)+'</b>'+ui.copyCodeBtn(p.order_code)
        +'<div style="font-size:11px;color:#94a3b8">'+esc(p.customer_name||'—')+'</div></td>'
        +'<td style="text-align:right;font-weight:600;color:#f59e0b">'+fmtMoney(p.pending_amount)+'</td></tr>';
    }).join('');
  }

  function renderStaffHolding(res) {
    var items = (res.items||[]).slice(0,20);
    $('sd-count').textContent = items.length;
    if (!items.length) {
      $('sd-tbody').innerHTML = '<tr class="action-tbl-empty"><td colspan="2">KTV đã nộp đủ 🎉</td></tr>';
      return;
    }
    $('sd-tbody').innerHTML = items.map(function(s) {
      return '<tr><td><b>'+esc(s.full_name)+'</b>'
        +'<div style="font-size:11px;color:#94a3b8">'+esc(s.username)+(s.area?' · '+esc(s.area):'')+'</div></td>'
        +'<td style="text-align:right;font-weight:600;color:var(--danger)">'+fmtMoney(s.unremitted_amount)+'</td></tr>';
    }).join('');
  }

  // Phase 1: KPIs + charts
  async function loadDashboard() {
    setLoading(true);
    var f       = dbFilter();
    var p       = buildQS();
    var pGroup  = buildQS({ group_by: f.groupBy });
    var pLimit  = buildQS({ limit: 10 });

    try {
      var results = await Promise.all([
        cachedGet('/admin/reports/overview-kpis?' + p).catch(function(){ return null; }),
        cachedGet('/admin/reports/revenue?' + pGroup).catch(function(){ return null; }),
        cachedGet('/admin/reports/top-products?' + pLimit).catch(function(){ return null; }),
        cachedGet('/admin/reports/orders-by-status?' + p).catch(function(){ return null; }),
        cachedGet('/admin/reports/orders-by-template?' + p).catch(function(){ return null; }),
      ]);
      var kpi = results[0], rev = results[1], tp = results[2], st = results[3], sk = results[4];

      if (kpi) renderKpis(kpi); else renderKpiError();
      if (rev) renderRevenueChart(rev);
      if (tp)  renderTopProductsChart(tp);
      if (st)  renderStatusChart(st);
      if (sk)  renderTemplateChart(sk);
    } catch (e) {
      renderKpiError();
    } finally {
      setLoading(false);
    }

    // Phase 2: action tables (non-blocking, no cache bypass)
    setTimeout(loadActionTables, 0);
  }

  // Phase 2: action tables
  async function loadActionTables() {
    var results = await Promise.all([
      api.get('/admin/reports/customer-debts', { silent: true }).catch(function(){ return null; }),
      api.get('/admin/reports/admin-pending-debts', { silent: true }).catch(function(){ return null; }),
      api.get('/admin/reports/staff-debts', { silent: true }).catch(function(){ return null; }),
    ]);
    var cdRes = results[0], pendRes = results[1], sdRes = results[2];

    if (cdRes)   renderTopDebtors(cdRes);
    else         $('cd-tbody').innerHTML = '<tr class="action-tbl-empty"><td colspan="2">Lỗi tải dữ liệu</td></tr>';
    if (pendRes) renderPendingPayments(pendRes);
    else         $('pend-tbody').innerHTML = '<tr class="action-tbl-empty"><td colspan="2">Lỗi tải dữ liệu</td></tr>';
    if (sdRes)   renderStaffHolding(sdRes);
    else         $('sd-tbody').innerHTML = '<tr class="action-tbl-empty"><td colspan="2">Lỗi tải dữ liệu</td></tr>';
  }

  var debouncedLoad = debounce(function() {
    loadedTabs.delete('dashboard');
    clearCache();
    loadDashboard();
  }, 500);

  // ══════════════════════════════════════════════════════════════════════
  //   TAB CHI TIET
  // ══════════════════════════════════════════════════════════════════════

  async function loadCustomerDebts() {
    var res = await api.get('/admin/reports/customer-debts').catch(function(){ return null; });
    if (!res) {
      $('cd2-tbody').innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--danger);padding:24px">Lỗi tải dữ liệu</td></tr>';
      return;
    }
    $('cd2-total').textContent = fmtMoney(res.total);
    $('cd2-count').textContent = res.items.length;
    if (!res.items.length) {
      $('cd2-tbody').innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:24px">Không có công nợ 🎉</td></tr>';
      return;
    }
    $('cd2-tbody').innerHTML = res.items.slice(0,50).map(function(c){
      return '<tr>'
        +'<td><b>'+esc(c.code)+'</b></td>'
        +'<td>'+esc(c.full_name)+(c.company_name?'<br><small class="text-muted">'+esc(c.company_name)+'</small>':'')+'</td>'
        +'<td>'+(c.type==='dealer'?'<span class="pill blue">Đại lý</span>':'<span class="pill gray">Khách lẻ</span>')+'</td>'
        +'<td>'+esc(c.phone||'—')+'</td>'
        +'<td>'+c.debt_order_count+'</td>'
        +'<td><b style="color:var(--danger)">'+fmtMoney(c.debt)+'</b></td>'
        +'</tr>';
    }).join('');
  }

  async function loadStaffDebts() {
    var res = await api.get('/admin/reports/staff-debts').catch(function(){ return null; });
    if (!res) {
      $('sd2-tbody').innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--danger);padding:24px">Lỗi tải dữ liệu</td></tr>';
      return;
    }
    $('sd2-total').textContent = fmtMoney(res.total);
    $('sd2-count').textContent = res.items.length;
    if (!res.items.length) {
      $('sd2-tbody').innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:24px">KTV đã nộp đủ 🎉</td></tr>';
      return;
    }
    $('sd2-tbody').innerHTML = res.items.slice(0,50).map(function(s){
      return '<tr>'
        +'<td><b>'+esc(s.full_name)+'</b><br><small class="text-muted">'+esc(s.username)+'</small></td>'
        +'<td>'+esc(s.phone||'—')+'</td>'
        +'<td>'+esc(s.area||'—')+'</td>'
        +'<td>'+s.unremitted_count+'</td>'
        +'<td><b style="color:var(--danger)">'+fmtMoney(s.unremitted_amount)+'</b></td>'
        +'<td>'+fmtDate(s.oldest_collection_at)+'</td>'
        +'</tr>';
    }).join('');
  }

  async function loadRevenue() {
    var p = new URLSearchParams();
    if ($('rv_from').value) p.set('from', $('rv_from').value);
    if ($('rv_to').value)   p.set('to',   $('rv_to').value);
    p.set('group_by', $('rv_group').value);
    var res = await api.get('/admin/reports/revenue?' + p.toString()).catch(function(){ return null; });
    if (!res) {
      $('rv-tbody').innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--danger);padding:24px">Lỗi tải dữ liệu</td></tr>';
      return;
    }
    var s = res.summary || {};
    $('rv-orders').textContent = s.order_count || 0;
    $('rv-paid').textContent   = fmtMoney(s.paid_amount);
    $('rv-refund').textContent = fmtMoney(s.refund_amount);
    $('rv-net').textContent    = fmtMoney(s.net_amount);
    if (!res.items.length) {
      $('rv-tbody').innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:24px">Không có dữ liệu</td></tr>';
      return;
    }
    $('rv-tbody').innerHTML = res.items.slice(0,365).map(function(r){
      return '<tr>'
        +'<td><b>'+esc(r.period)+'</b></td>'
        +'<td>'+r.order_count+'</td>'
        +'<td style="color:var(--success)">'+fmtMoney(r.paid_amount)+'</td>'
        +'<td style="color:var(--danger)">'+fmtMoney(r.refund_amount)+'</td>'
        +'<td><b>'+fmtMoney(r.net_amount)+'</b></td>'
        +'</tr>';
    }).join('');
  }

  // ══════════════════════════════════════════════════════════════════════
  //   TABS
  // ══════════════════════════════════════════════════════════════════════

  var loadedTabs = new Set();

  function switchTab(tab) {
    document.querySelectorAll('.tabs button').forEach(function(b){ b.classList.toggle('on', b.dataset.tab === tab); });
    document.querySelectorAll('[id^="tab-"]').forEach(function(d){ d.style.display = 'none'; });
    $('tab-' + tab).style.display = '';

    if (!loadedTabs.has(tab)) {
      loadedTabs.add(tab);
      if (tab === 'dashboard')      loadDashboard();
      if (tab === 'customer-debts') loadCustomerDebts();
      if (tab === 'staff-debts')    loadStaffDebts();
      if (tab === 'revenue')        loadRevenue();
    }
  }

  function init() {
    adminShell.init('reports');

    var d = defaultDates();
    $('db_from').value = d.from;
    $('db_to').value   = d.to;
    $('rv_from').value = d.from;
    $('rv_to').value   = d.to;

    document.querySelector('.tabs').addEventListener('click', function(e) {
      var b = e.target.closest('button[data-tab]');
      if (b) switchTab(b.dataset.tab);
    });

    $('db_apply').addEventListener('click', function() {
      loadedTabs.delete('dashboard');
      clearCache();
      loadDashboard();
    });

    $('db_reset').addEventListener('click', function() {
      var d2 = defaultDates();
      $('db_from').value = d2.from;
      $('db_to').value   = d2.to;
      loadedTabs.delete('dashboard');
      clearCache();
      loadDashboard();
    });

    ['db_from','db_to','db_group'].forEach(function(id) {
      $(id).addEventListener('change', debouncedLoad);
    });

    $('rv_apply').addEventListener('click', function() {
      loadedTabs.delete('revenue');
      loadRevenue();
    });

    switchTab('dashboard');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
