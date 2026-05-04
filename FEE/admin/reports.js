// Logic trang admin/reports — 3 tab: cong no khach / KTV / doanh thu
(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }
  function fmtDate(d) {
    if (!d) return '—';
    return String(d).replace('T', ' ').slice(0, 16);
  }

  async function loadCustomerDebts() {
    const res = await api.get('/admin/reports/customer-debts').catch(() => null);
    if (!res) return;
    $('cd-total').textContent = fmt.format(res.total || 0) + 'đ';
    $('cd-count').textContent = res.items.length;
    if (!res.items.length) {
      $('cd-tbody').innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding:24px">Không có công nợ</td></tr>';
      return;
    }
    $('cd-tbody').innerHTML = res.items.map(c => `
      <tr>
        <td><b>${escape(c.code)}</b></td>
        <td>${escape(c.full_name)}${c.company_name ? '<br><small class="text-muted">' + escape(c.company_name) + '</small>' : ''}</td>
        <td>${c.type === 'dealer' ? '<span class="pill blue">Đại lý</span>' : '<span class="pill gray">Khách lẻ</span>'}</td>
        <td>${escape(c.phone || '—')}</td>
        <td>${c.debt_order_count}</td>
        <td><b style="color:var(--danger)">${fmt.format(c.debt)}đ</b></td>
      </tr>
    `).join('');
  }

  async function loadStaffDebts() {
    const res = await api.get('/admin/reports/staff-debts').catch(() => null);
    if (!res) return;
    $('sd-total').textContent = fmt.format(res.total || 0) + 'đ';
    $('sd-count').textContent = res.items.length;
    if (!res.items.length) {
      $('sd-tbody').innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding:24px">KTV đã nộp đủ</td></tr>';
      return;
    }
    $('sd-tbody').innerHTML = res.items.map(s => `
      <tr>
        <td><b>${escape(s.full_name)}</b><br><small class="text-muted">${escape(s.username)}</small></td>
        <td>${escape(s.phone || '—')}</td>
        <td>${escape(s.area || '—')}</td>
        <td>${s.unremitted_count}</td>
        <td><b style="color:var(--danger)">${fmt.format(s.unremitted_amount)}đ</b></td>
        <td>${fmtDate(s.oldest_collection_at)}</td>
      </tr>
    `).join('');
  }

  async function loadRevenue() {
    const p = new URLSearchParams();
    if ($('rv_from').value) p.set('from', $('rv_from').value);
    if ($('rv_to').value)   p.set('to', $('rv_to').value);
    p.set('group_by', $('rv_group').value);
    const res = await api.get('/admin/reports/revenue?' + p.toString()).catch(() => null);
    if (!res) return;
    const s = res.summary || {};
    $('rv-orders').textContent = s.order_count || 0;
    $('rv-total').textContent  = fmt.format(s.total_amount || 0) + 'đ';
    $('rv-paid').textContent   = fmt.format(s.paid_amount || 0) + 'đ';
    $('rv-debt').textContent   = fmt.format(s.debt_amount || 0) + 'đ';
    if (!res.items.length) {
      $('rv-tbody').innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding:24px">Không có dữ liệu</td></tr>';
      return;
    }
    $('rv-tbody').innerHTML = res.items.map(r => `
      <tr>
        <td><b>${escape(r.period)}</b></td>
        <td>${r.order_count}</td>
        <td>${fmt.format(r.total_amount || 0)}đ</td>
        <td style="color:var(--success)">${fmt.format(r.paid_amount || 0)}đ</td>
        <td style="color:var(--danger)">${fmt.format(r.debt_amount || 0)}đ</td>
      </tr>
    `).join('');
  }

  // ---- Overview charts ----------------------------------------
  const charts = {};

  // Mau co dinh cho status
  const STATUS_COLORS = {
    pending_review: '#a78bfa', new: '#9ca3af', assigned: '#60a5fa',
    warehouse_released: '#22d3ee', in_progress: '#fbbf24',
    done: '#4ade80', cancelled: '#f87171',
  };
  const STATUS_TEXT = {
    pending_review: 'Yêu cầu', new: 'Đã chốt', assigned: 'Đã giao KTV',
    warehouse_released: 'Đã xuất kho', in_progress: 'Đang làm',
    done: 'Hoàn thành', cancelled: 'Huỷ',
  };
  const SK_TEXT = {
    install: 'Lắp mới', maintenance: 'Sửa chữa',
    warranty: 'Bảo hành', renewal: 'Gia hạn',
  };

  function destroyChart(key) {
    if (charts[key]) { charts[key].destroy(); delete charts[key]; }
  }

  async function loadOverview() {
    const from = $('ov_from').value || null;
    const to   = $('ov_to').value   || null;

    // 1. Doanh thu theo ngay (line)
    const p1 = new URLSearchParams();
    if (from) p1.set('from', from);
    if (to)   p1.set('to', to);
    p1.set('group_by', 'day');
    const rev = await api.get('/admin/reports/revenue?' + p1.toString(), { silent: true }).catch(() => null);
    if (rev) {
      const sorted = [...rev.items].sort((a, b) => String(a.period).localeCompare(String(b.period)));
      destroyChart('rev');
      charts.rev = new Chart($('chartRevenue'), {
        type: 'line',
        data: {
          labels: sorted.map(r => r.period),
          datasets: [
            {
              label: 'Đã thu',
              data: sorted.map(r => Number(r.paid_amount || 0)),
              borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,.15)',
              tension: 0.3, fill: true,
            },
            {
              label: 'Còn nợ',
              data: sorted.map(r => Number(r.debt_amount || 0)),
              borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.1)',
              tension: 0.3, fill: true,
            },
          ],
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
      });
    }

    // 2. Top products (bar)
    const p2 = new URLSearchParams();
    if (from) p2.set('from', from);
    if (to)   p2.set('to', to);
    p2.set('limit', 10);
    const tp = await api.get('/admin/reports/top-products?' + p2.toString(), { silent: true }).catch(() => null);
    if (tp) {
      destroyChart('tp');
      charts.tp = new Chart($('chartTopProducts'), {
        type: 'bar',
        data: {
          labels: tp.items.map(p => p.code + ' — ' + p.name),
          datasets: [{
            label: 'Số lượng bán',
            data: tp.items.map(p => Number(p.total_qty || 0)),
            backgroundColor: '#3b82f6',
          }],
        },
        options: {
          indexAxis: 'y', responsive: true,
          plugins: { legend: { display: false } },
        },
      });
    }

    // 3. Status (doughnut)
    const p3 = new URLSearchParams();
    if (from) p3.set('from', from);
    if (to)   p3.set('to', to);
    const st = await api.get('/admin/reports/orders-by-status?' + p3.toString(), { silent: true }).catch(() => null);
    if (st) {
      destroyChart('st');
      charts.st = new Chart($('chartStatus'), {
        type: 'doughnut',
        data: {
          labels: st.items.map(r => STATUS_TEXT[r.status] || r.status),
          datasets: [{
            data: st.items.map(r => Number(r.count)),
            backgroundColor: st.items.map(r => STATUS_COLORS[r.status] || '#94a3b8'),
          }],
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
      });
    }

    // 4. Service kind (pie)
    const sk = await api.get('/admin/reports/orders-by-service-kind?' + p3.toString(), { silent: true }).catch(() => null);
    if (sk) {
      destroyChart('sk');
      charts.sk = new Chart($('chartServiceKind'), {
        type: 'pie',
        data: {
          labels: sk.items.map(r => SK_TEXT[r.service_kind] || r.service_kind),
          datasets: [{
            data: sk.items.map(r => Number(r.count)),
            backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#a855f7'],
          }],
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
      });
    }
  }

  function switchTab(tab) {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    document.querySelectorAll('[id^="tab-"]').forEach(d => d.style.display = 'none');
    $('tab-' + tab).style.display = '';
    if (tab === 'overview')       loadOverview();
    if (tab === 'customer-debts') loadCustomerDebts();
    if (tab === 'staff-debts')    loadStaffDebts();
    if (tab === 'revenue')        loadRevenue();
  }

  function init() {
    adminShell.init('reports');
    document.querySelector('.tabs').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-tab]');
      if (b) switchTab(b.dataset.tab);
    });
    $('rv_apply').addEventListener('click', loadRevenue);
    $('ov_apply').addEventListener('click', loadOverview);
    // Default: overview
    loadOverview();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
