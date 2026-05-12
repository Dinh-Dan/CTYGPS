// Logic trang kithuat/advances — KTV gui va xem phieu ung luong

(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  let filterStatus = '';

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  function fmtDt(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d).slice(0, 10);
    const p = n => String(n).padStart(2, '0');
    return `${p(dt.getDate())}/${p(dt.getMonth()+1)}/${dt.getFullYear()} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
  }

  function defaultPeriod() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  }

  function statusPill(s) {
    const map = {
      pending:  ['Chờ duyệt', 'adv-pending'],
      approved: ['Đã duyệt',  'adv-approved'],
      rejected: ['Từ chối',   'adv-rejected'],
    };
    const [lbl, cls] = map[s] || [s, ''];
    return `<span class="pill ${cls}">${lbl}</span>`;
  }

  async function loadList() {
    const wrap = $('advList');
    wrap.innerHTML = '<div class="empty-adv">Đang tải...</div>';
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    const res = await api.get(`/kithuat/advances?${params.toString()}`, { silent: true }).catch(() => null);
    const items = (res && res.items) || [];

    // loc theo filterStatus phia FE (backend tra het, loc o day)
    const filtered = filterStatus ? items.filter(a => a.status === filterStatus) : items;

    if (!filtered.length) {
      wrap.innerHTML = '<div class="empty-adv">Chưa có phiếu ứng nào.</div>';
      return;
    }
    wrap.innerHTML = filtered.map(a => `
      <div class="adv-row ${a.status}">
        <div class="adv-top">
          <span class="adv-amount">${fmt.format(a.amount)}đ</span>
          ${statusPill(a.status)}
          <span class="adv-period">Kỳ ${escape(a.period)}</span>
        </div>
        <div class="adv-meta">
          ${a.note ? `📝 ${escape(a.note)} · ` : ''}
          Gửi lúc: ${escape(fmtDt(a.created_at))}
          ${a.status === 'approved' ? `<br><span style="color:#15803d">✅ Duyệt lúc: ${escape(fmtDt(a.approved_at))}${a.approved_by_name ? ' bởi ' + escape(a.approved_by_name) : ''}</span>` : ''}
          ${a.status === 'rejected' ? `<div class="reject-reason">❌ Lý do từ chối: ${escape(a.reject_reason || '(Không có lý do)')}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  async function submitAdvance() {
    const period = $('advPeriod').value;
    const amount = Number($('advAmount').value);
    const note   = $('advNote').value.trim();
    if (!period) { ui.toast('Chọn kỳ lương', 'warning'); return; }
    if (!amount || amount <= 0) { ui.toast('Nhập số tiền ứng', 'warning'); return; }
    $('btnSubmitAdv').disabled = true;
    const ok = await api.post('/kithuat/advances', { period, amount, note }, {
      successMessage: 'Đã gửi yêu cầu, chờ admin duyệt',
    }).catch(() => null);
    $('btnSubmitAdv').disabled = false;
    if (!ok) return;
    $('advAmount').value = '';
    $('advNote').value = '';
    loadList();
  }

  function init() {
    techShell.init('advances');

    $('advPeriod').value = defaultPeriod();
    $('btnSubmitAdv').addEventListener('click', submitAdvance);

    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        filterStatus = btn.dataset.filter;
        loadList();
      });
    });

    loadList();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
