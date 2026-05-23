// Logic trang admin/staff

(function () {
  const $ = (id) => document.getElementById(id);
  const IS_ADMIN = (window.auth && auth.isAdmin && auth.isAdmin()) || false;
  const IS_STAFF = !IS_ADMIN && !!(window.auth && auth.user && auth.user() && auth.user().role === 'staff');
  const CAN_MANAGE = IS_ADMIN || IS_STAFF;
  const fmt = new Intl.NumberFormat('vi-VN');

  const state = {
    q: '',
    role: '',
    sort: 'name',
    view: 'grid',
    items: [],
  };
  let editing = null;
  let assigningKtv = null;

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  const AV_COLORS = {
    kithuat: '#f97316',
    staff: '#22c55e',
    admin: '#6366f1',
  };

  function avatarHtml(s) {
    const color = AV_COLORS[s.role] || '#64748b';
    const letter = (s.full_name || s.username || '?').trim().charAt(0).toUpperCase();
    if (s.avatar_url) {
      return `<img src="${escape(s.avatar_url)}" class="kc-av" alt="" onerror="this.onerror=null;this.insertAdjacentHTML('afterend','<div class=&quot;kc-av&quot; style=&quot;background:${color}&quot;>${letter}</div>');this.remove()">`;
    }
    return `<div class="kc-av" style="background:${color}">${letter}</div>`;
  }

  function rolePill(role) {
    if (role === 'admin') return '<span class="kc-role qt">Quản trị</span>';
    if (role === 'staff') return '<span class="kc-role nv">Nhân viên</span>';
    return '<span class="kc-role ktv">Kỹ thuật</span>';
  }

  function cardHtml(s) {
    const isOnline = s.online_status === 'online';
    const active = s.active_tasks || 0;
    const done   = s.completed_tasks || 0;
    const hold   = s.holding_items || 0;
    const isKtv  = s.role === 'kithuat';

    const actAssign = isKtv
      ? `<button class="abt" data-act="assign" data-id="${s.id}" title="Phân đơn">📋</button>`
      : '';
    const actIssue = isKtv && CAN_MANAGE
      ? `<button class="abt" data-act="issue" data-id="${s.id}" title="Cấp sản phẩm">📦</button>`
      : '';
    const actPayroll = `<a class="abt" href="/admin/payroll.html?staff=${s.id}" title="Bảng lương">💵</a>`;
    const actMore = CAN_MANAGE
      ? `<button class="abt" data-act="more" data-id="${s.id}" title="Thêm">•••</button>` : '';

    const dropdown = CAN_MANAGE ? `
      <div class="more-dd" id="dd-${s.id}">
        <button class="dd-item" data-act="edit" data-id="${s.id}">✏️ Sửa thông tin</button>
        <button class="dd-item" data-act="pw" data-id="${s.id}">🔑 Đổi mật khẩu</button>
        <button class="dd-item red" data-act="del" data-id="${s.id}">🗑️ Xóa nhân viên</button>
      </div>` : '';

    return `
      <div class="ktv-card" data-id="${s.id}">
        <div class="kc-head">
          ${avatarHtml(s)}
          <div class="kc-info">
            <div class="kc-name">${escape(s.full_name)}</div>
            <div class="kc-sub">
              <span class="kc-user">@${escape(s.username)}</span>
              <span class="kc-dot ${isOnline ? 'on' : 'off'}"></span>
              <span class="kc-status">${isOnline ? 'Online' : 'Offline'}</span>
            </div>
            ${rolePill(s.role)}
          </div>
        </div>

        <div class="kc-stats">
          <div>
            <div class="kc-stat-n ${active ? '' : 'dim'}">${active}</div>
            <div class="kc-stat-l">Đang làm</div>
          </div>
          <div>
            <div class="kc-stat-n ${done ? '' : 'dim'}">${done}</div>
            <div class="kc-stat-l">Đã xong</div>
          </div>
          <div>
            <div class="kc-stat-n ${hold ? 'hi' : 'dim'}">${hold}</div>
            <div class="kc-stat-l">Tam giữ</div>
          </div>
        </div>

        <div class="kc-acts">
          ${actAssign}${actIssue}${actPayroll}${actMore}
        </div>
        ${dropdown}
      </div>
    `;
  }

  function sortItems(items) {
    const arr = [...items];
    if (state.sort === 'online') {
      arr.sort((a, b) => (b.online_status === 'online' ? 1 : 0) - (a.online_status === 'online' ? 1 : 0));
    } else if (state.sort === 'active') {
      arr.sort((a, b) => (b.active_tasks || 0) - (a.active_tasks || 0));
    } else if (state.sort === 'hold') {
      arr.sort((a, b) => (b.holding_items || 0) - (a.holding_items || 0));
    } else {
      arr.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'vi'));
    }
    return arr;
  }

  function renderGrid() {
    const grid = $('ktvGrid');
    const sorted = sortItems(state.items);
    if (!sorted.length) {
      grid.innerHTML = '';
      $('emptyMsg').classList.remove('hide');
      return;
    }
    $('emptyMsg').classList.add('hide');
    grid.className = state.view === 'list' ? 'ktv-list' : 'ktv-grid';
    grid.innerHTML = sorted.map(cardHtml).join('');
  }

  // ---- Stats + Donut ----
  function renderStats() {
    const items = state.items;
    const total   = items.length;
    const online  = items.filter(s => s.online_status === 'online').length;
    const active  = items.reduce((s, x) => s + (Number(x.active_tasks) || 0), 0);
    const done    = items.reduce((s, x) => s + (Number(x.completed_tasks) || 0), 0);
    const holding = items.reduce((s, x) => s + (Number(x.holding_items) || 0), 0);
    const pct     = total ? Math.round(online / total * 100) : 0;

    $('statTotal').textContent   = total;
    $('statOnline').textContent  = online;
    $('statOnlinePct').textContent = `${pct}% tổng số`;
    $('statActive').textContent  = active;
    $('statDone').textContent    = done;
    $('statHold').textContent    = holding;

    renderDonut(items);
  }

  function renderDonut(items) {
    const total = items.length || 1;
    const counts = [
      { label: 'Kỹ thuật', count: items.filter(s => s.role === 'kithuat').length, color: '#f97316' },
      { label: 'Nhân viên', count: items.filter(s => s.role === 'staff').length,   color: '#22c55e' },
      { label: 'Quản trị', count: items.filter(s => s.role === 'admin').length,    color: '#a855f7' },
    ];
    const other = total - counts.reduce((s, x) => s + x.count, 0);
    if (other > 0) counts.push({ label: 'Khác', count: other, color: '#94a3b8' });

    let offset = 0;
    const stops = counts.filter(x => x.count > 0).map(x => {
      const start = offset;
      offset += x.count / total * 100;
      return `${x.color} ${start.toFixed(1)}% ${offset.toFixed(1)}%`;
    });
    $('donutRing').style.background = stops.length
      ? `conic-gradient(${stops.join(',')})`
      : '#e2e8f0';

    $('donutLegend').innerHTML = counts.filter(x => x.count > 0).map(x => `
      <div class="leg-item">
        <span class="leg-dot" style="background:${x.color}"></span>
        <span class="leg-lbl">${x.label}</span>
        <span class="leg-cnt">${x.count} (${Math.round(x.count/total*100)}%)</span>
      </div>
    `).join('');
  }

  // ---- Recent activity ----
  function relativeTime(d) {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'vừa xong';
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    return `${Math.floor(h/24)} ngày trước`;
  }

  async function renderActivity() {
    const wrap = $('recentActivity');
    const res = await api.get('/admin/orders?limit=5', { silent: true }).catch(() => null);
    const orders = (res && res.items) || [];
    if (!orders.length) {
      wrap.innerHTML = '<div class="text-muted" style="font-size:13px;padding:8px 0">Chưa có hoạt động.</div>';
      return;
    }
    wrap.innerHTML = orders.map(o => {
      const name = escape(o.assigned_staff_name || o.customer_name || 'Hệ thống');
      const letter = name.charAt(0).toUpperCase();
      const color = o.assigned_staff_name ? '#0ea5e9' : '#6366f1';
      let text = o.assigned_staff_name
        ? `<b>${name}</b> được giao đơn <b>${escape(o.code)}</b>`
        : `Đơn <b>${escape(o.code)}</b> — ${escape(o.customer_name || '')}`;
      return `
        <div class="act-item">
          <div class="act-av" style="background:${color}">${letter}</div>
          <div class="act-body">
            <div class="act-text">${text}</div>
            <div class="act-time">${relativeTime(o.created_at)}</div>
          </div>
          <div class="act-online-dot" style="opacity:.5"></div>
        </div>
      `;
    }).join('');
  }

  async function load() {
    const p = new URLSearchParams();
    if (state.q)    p.set('q', state.q);
    if (state.role) p.set('role', state.role);
    p.set('limit', 100);
    const res = await api.get('/admin/staff?' + p.toString()).catch(() => null);
    if (!res) return;
    state.items = res.items;
    renderGrid();
    renderStats();
  }

  // ---- Dropdown "more" ----
  function closeAllDropdowns(exceptId) {
    document.querySelectorAll('.more-dd.open').forEach(dd => {
      if (!exceptId || dd.id !== `dd-${exceptId}`) dd.classList.remove('open');
    });
  }

  // ---- Modal CRUD ----
  function openModal(s) {
    editing = s || null;
    $('modal').classList.add('open');
    $('modalTitle').textContent = s ? 'Sửa nhân viên' : 'Thêm nhân viên';
    $('f_id').value        = s ? s.id : '';
    $('f_username').value  = s ? s.username  : '';
    $('f_full_name').value = s ? s.full_name : '';
    $('f_role').value      = s ? s.role      : 'kithuat';
    $('f_phone').value     = s ? (s.phone || '') : '';
    $('f_cccd').value      = s ? (s.cccd  || '') : '';
    $('f_email').value     = s ? (s.email || '') : '';
    $('f_area').value      = s ? (s.area  || '') : '';
    $('f_password').value  = '';
    if (s) {
      $('pwLabel').textContent = 'Mật khẩu (để trống nếu không đổi)';
      $('f_password').required = false;
      $('pwHelp').textContent  = 'Bỏ trống nếu không cần đổi. Dùng nút "Đổi MK" để đổi riêng.';
    } else {
      $('pwLabel').textContent = 'Mật khẩu *';
      $('f_password').required = true;
      $('pwHelp').textContent  = 'Tối thiểu 4 ký tự.';
    }
  }
  function closeModal() {
    $('modal').classList.remove('open');
    editing = null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const id = $('f_id').value;
    const data = {
      username:  $('f_username').value.trim(),
      full_name: $('f_full_name').value.trim(),
      role:      $('f_role').value,
      phone:     $('f_phone').value.trim() || null,
      cccd:      $('f_cccd').value.trim() || null,
      email:     $('f_email').value.trim() || null,
      area:      $('f_area').value.trim() || null,
    };
    const password = $('f_password').value;
    $('btnSave').disabled = true;
    let ok;
    if (id) {
      ok = await api.put('/admin/staff/' + id, data, {
        successMessage: 'Đã cập nhật',
        errorMessages: { 409: 'Username đã tồn tại' },
        loading: true,
      }).catch(() => null);
      if (ok && password.length >= 4) {
        await api.post('/admin/staff/' + id + '/password', { password }, {
          successMessage: 'Đã đổi mật khẩu',
        }).catch(() => null);
      }
    } else {
      if (password.length < 4) {
        ui.toast('Mật khẩu tối thiểu 4 ký tự', 'warning');
        $('btnSave').disabled = false;
        return;
      }
      ok = await api.post('/admin/staff', { ...data, password }, {
        successMessage: 'Đã tạo nhân viên',
        errorMessages: { 409: 'Username đã tồn tại' },
        loading: true,
      }).catch(() => null);
    }
    $('btnSave').disabled = false;
    if (!ok) return;
    closeModal();
    load();
  }

  // ---- Modal phan cong ----
  async function openAssignModal(ktv) {
    assigningKtv = ktv;
    $('assignKtvName').textContent = ktv.full_name + (ktv.area ? ` (${ktv.area})` : '');
    $('assignList').innerHTML = '<p class="text-muted">Đang tải...</p>';
    $('assignModal').classList.add('open');

    const res = await api.get('/admin/orders?status=new&unassigned=1&limit=50').catch(() => null);
    if (!res) return;
    const orders = res.items || [];
    if (!orders.length) {
      $('assignList').innerHTML = '<p class="text-muted text-center">Không có đơn nào chờ phân công.</p>';
      return;
    }
    $('assignList').innerHTML = orders.map(t => {
      const matchArea = t.area && ktv.area && t.area === ktv.area;
      return `
        <div class="filter-task-row" data-order="${t.id}">
          <div class="spread">
            <div>
              <b>${escape(t.code)}</b>
              ${matchArea ? '<span class="pill green" style="font-size:10px;margin-left:6px">Cùng khu vực</span>' : ''}
            </div>
          </div>
          <div class="text-muted" style="font-size:13px;margin-top:4px">
            👤 ${escape(t.customer_name || '')}
            ${t.customer_phone ? '· 📞 ' + escape(t.customer_phone) : ''}
            ${t.area ? '· 📍 ' + escape(t.area) : ''}
          </div>
          <div class="text-muted" style="font-size:13px">
            💵 Tổng đơn: <b>${fmt.format(t.total_amount || 0)}đ</b>
          </div>
        </div>
      `;
    }).join('');

    $('assignList').querySelectorAll('.filter-task-row').forEach(row => {
      row.addEventListener('click', () => tryAssign(row.dataset.order, false));
    });

    async function tryAssign(orderId, force) {
      try {
        ui.loading(true);
        const ok = await api.post('/admin/orders/' + orderId + '/assign-staff',
          { staff_id: assigningKtv.id, kind: 'install', wage_amount: 0, force: !!force },
          { silent: true });
        ui.loading(false);
        if (ok) {
          ui.toast('Đã phân công', 'success');
          $('assignModal').classList.remove('open');
          load();
        }
      } catch (e) {
        ui.loading(false);
        if (e.status === 409 && e.data && e.data.code === 'INSUFFICIENT_HOLDINGS') {
          const lacks = (e.data.details && e.data.details.lacks) || [];
          const yes = await ui.insufficientHoldingsDialog({ staffName: assigningKtv.full_name, lacks });
          if (yes) await tryAssign(orderId, true);
          return;
        }
        ui.toast(e.message || 'Lỗi phân công', 'error');
      }
    }
  }

  function closeAssignModal() {
    $('assignModal').classList.remove('open');
    assigningKtv = null;
  }

  // ==================== MODAL CAP SAN PHAM ====================
  let issueKtv = null;
  let issueProducts = [];
  let issueProductMap = {};
  let issueProductLabelMap = {};
  let issueStockMap = {};
  let issueFilterStatus = '';
  const STATUS_LABEL = {
    draft:     { text: 'Chờ duyệt',    cls: 'cap-draft' },
    approved:  { text: 'Đã duyệt',     cls: 'cap-approved' },
    received:  { text: 'KTV đã nhận',  cls: 'cap-received' },
    rejected:  { text: 'Từ chối',      cls: 'cap-rejected' },
    cancelled: { text: 'Đã huỷ',       cls: 'cap-cancelled' },
  };
  function statusPill(s) {
    const def = STATUS_LABEL[s] || { text: s, cls: 'cap-cancelled' };
    return `<span class="pill ${def.cls}">${def.text}</span>`;
  }
  function fmtTime(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d).slice(0, 10);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(dt.getDate())}/${pad(dt.getMonth()+1)} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  }
  function productLabel(p) { return `${p.code} · ${p.name}`; }

  async function openIssueModal(ktv) {
    issueKtv = ktv;
    $('issKtvName').textContent = ktv.full_name;
    $('issueModal').classList.add('open');

    if (!issueProducts.length) {
      const [pr, st] = await Promise.all([
        api.get('/admin/inventory/products/all', { silent: true }).catch(() => null),
        api.get('/admin/inventory/stock?limit=500', { silent: true }).catch(() => null),
      ]);
      issueProducts = (pr && (pr.items || pr)) || [];
      issueProductMap = {};
      issueProductLabelMap = {};
      issueProducts.forEach(p => {
        issueProductMap[p.id] = p;
        issueProductLabelMap[productLabel(p)] = p.id;
      });
      issueStockMap = {};
      ((st && (st.items || st)) || []).forEach(s => { issueStockMap[s.product_id] = Number(s.quantity) || 0; });
      $('issProdList').innerHTML = issueProducts.map(p => `<option value="${escape(productLabel(p))}">`).join('');
    }
    $('issLines').innerHTML = '';
    addIssueLine();
    $('issNote').value = '';
    updateIssueSummary();
    issueFilterStatus = '';
    $('issFilter').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.st === ''));
    loadIssueHistory();
  }
  function closeIssueModal() {
    $('issueModal').classList.remove('open');
    issueKtv = null;
  }

  function addIssueLine() {
    const idx = Date.now() + Math.random();
    const row = document.createElement('div');
    row.className = 'iss-create-row';
    row.dataset.idx = idx;
    row.innerHTML = `
      <button type="button" class="rm" data-rm="${idx}" title="Xoá dòng">×</button>
      <div class="row-head">
        <span class="lbl">Sản phẩm</span>
        <div class="iss-prod-cell">
          <input type="text" class="input cProd" list="issProdList" placeholder="Gõ mã hoặc tên SP để hiển thị gợi ý...">
          <span class="stock-hint" style="display:none"></span>
        </div>
      </div>
      <div class="row-body">
        <div class="qty-wrap">
          <span class="lbl">Số lượng</span>
          <input type="number" class="input qty cQty" min="1" value="1">
        </div>
        <div class="imei-wrap">
          <span class="lbl">IMEI (tuỳ chọn — mỗi IMEI 1 dòng)</span>
          <textarea class="input imei cImei" rows="5" placeholder="868001&#10;868002&#10;868003"></textarea>
        </div>
      </div>
    `;
    $('issLines').appendChild(row);
    setTimeout(() => row.querySelector('.cProd').focus(), 30);
  }

  function updateRowStock(row) {
    const val = row.querySelector('.cProd').value.trim();
    const pid = issueProductLabelMap[val];
    const hint = row.querySelector('.stock-hint');
    const qtyInput = row.querySelector('.cQty');
    if (!pid) { hint.style.display = 'none'; qtyInput.removeAttribute('max'); return; }
    const stock = issueStockMap[pid] || 0;
    hint.textContent = `Tồn: ${stock}`;
    hint.style.display = '';
    hint.classList.toggle('low', (Number(qtyInput.value) || 0) > stock || stock === 0);
  }

  function updateIssueSummary() {
    let sum = 0;
    for (const row of $('issLines').querySelectorAll('.iss-create-row')) {
      const val = row.querySelector('.cProd').value.trim();
      if (issueProductLabelMap[val]) sum += Number(row.querySelector('.cQty').value) || 0;
    }
    $('issSumQty').textContent = sum;
  }

  async function submitIssueCreate() {
    if (!issueKtv) return;
    const items = [];
    const seen = new Set();
    for (const row of $('issLines').querySelectorAll('.iss-create-row')) {
      const val = row.querySelector('.cProd').value.trim();
      if (!val) continue;
      const pid = issueProductLabelMap[val];
      if (!pid) { ui.toast(`Sản phẩm "${val}" không hợp lệ`, 'warning'); return; }
      const qty = Number(row.querySelector('.cQty').value);
      const imei = row.querySelector('.cImei').value.trim();
      if (!qty || qty <= 0) { ui.toast('Số lượng phải > 0', 'warning'); return; }
      if (seen.has(pid)) { ui.toast('Mỗi sản phẩm chỉ 1 dòng', 'warning'); return; }
      seen.add(pid);
      items.push({ product_id: pid, qty_requested: qty, imei_list: imei || null });
    }
    if (!items.length) { ui.toast('Chọn ít nhất 1 sản phẩm', 'warning'); return; }
    const ok = await api.post('/admin/staff-issues', {
      staff_id: issueKtv.id,
      note: $('issNote').value.trim() || null,
      items,
    }, { successMessage: 'Đã tạo phiếu, chờ duyệt' }).catch(() => null);
    if (!ok) return;
    $('issLines').innerHTML = '';
    addIssueLine();
    $('issNote').value = '';
    updateIssueSummary();
    loadIssueHistory();
  }

  async function loadIssueHistory() {
    if (!issueKtv) return;
    const wrap = $('issHistory');
    wrap.innerHTML = '<div class="iss-empty">Đang tải...</div>';
    const params = new URLSearchParams();
    params.set('staff_id', issueKtv.id);
    params.set('limit', 50);
    if (issueFilterStatus) params.set('status', issueFilterStatus);
    const r = await api.get(`/admin/staff-issues?${params.toString()}`, { silent: true }).catch(() => null);
    const items = (r && r.items) || [];

    const rAll = issueFilterStatus
      ? await api.get(`/admin/staff-issues?staff_id=${issueKtv.id}&status=draft&limit=1`, { silent: true }).catch(() => null)
      : { total: items.filter(x => x.status === 'draft').length };
    const draftCount = (rAll && rAll.total) || 0;
    const badge = $('issDraftBadge');
    if (draftCount > 0) { badge.textContent = `${draftCount} chờ duyệt`; badge.style.display = ''; }
    else badge.style.display = 'none';

    if (!items.length) { wrap.innerHTML = '<div class="iss-empty">Chưa có phiếu nào</div>'; return; }
    wrap.innerHTML = items.map(it => `
      <div class="iss-card ${it.status}" data-id="${it.id}">
        <div class="iss-card-head">
          <span class="code">${escape(it.code)}</span>
          ${statusPill(it.status)}
          <span class="meta">
            ${it.line_count} dòng · YC <b>${it.total_requested || 0}</b>${it.status !== 'draft' ? ` · Duyệt <b>${it.total_approved || 0}</b>` : ''}
            <br><small>${escape(fmtTime(it.created_at))}${it.created_by_name ? ' · ' + escape(it.created_by_name) : ''}</small>
          </span>
          <span class="arrow">▾</span>
        </div>
        <div class="iss-items"></div>
      </div>
    `).join('');
  }

  async function expandIssueCard(card) {
    const id = Number(card.dataset.id);
    const slot = card.querySelector('.iss-items');
    if (card.classList.contains('open')) { card.classList.remove('open'); return; }
    card.classList.add('open');
    slot.innerHTML = '<div class="iss-empty">Đang tải...</div>';
    const d = await api.get(`/admin/staff-issues/${id}`, { silent: true }).catch(() => null);
    if (!d) { slot.innerHTML = '<div class="iss-empty">Lỗi tải</div>'; return; }
    const editable = d.status === 'draft';
    const head = editable
      ? `<tr><th>Sản phẩm</th><th style="width:90px">SL YC</th><th style="width:80px">Tồn kho</th><th style="width:90px">SL duyệt</th><th>IMEI</th></tr>`
      : `<tr><th>Sản phẩm</th><th style="width:90px">SL YC</th><th style="width:90px">SL duyệt</th><th>IMEI</th></tr>`;
    const body = d.items.map(it => {
      if (editable) {
        const ok2 = it.stock_qty >= it.qty_requested;
        return `<tr data-item-id="${it.id}" data-req="${it.qty_requested}">
          <td>${escape(it.product_code)} · ${escape(it.product_name)}</td>
          <td>${it.qty_requested}</td>
          <td><span class="${ok2 ? 'iss-ok' : 'iss-low'}">${it.stock_qty}</span></td>
          <td><input type="number" class="input qty" min="0" max="${it.qty_requested}" value="${Math.min(it.qty_requested, it.stock_qty)}"></td>
          <td class="imei">${escape(it.imei_list || '')}</td>
        </tr>`;
      }
      return `<tr>
        <td>${escape(it.product_code)} · ${escape(it.product_name)}</td>
        <td>${it.qty_requested}</td>
        <td>${it.qty_approved == null ? '—' : it.qty_approved}</td>
        <td class="imei">${escape(it.imei_list || '')}</td>
      </tr>`;
    }).join('');

    let extra = '';
    if (d.note) extra += `<div class="extra"><b>Ghi chú:</b> ${escape(d.note)}</div>`;
    if (d.approved_at) {
      extra += `<div class="extra"><b>Duyệt:</b> ${escape(d.approved_by_name || '')} · ${escape(fmtTime(d.approved_at))}${d.receipt_code ? ' · phiếu xuất ' + escape(d.receipt_code) : ''}</div>`;
    }
    if (d.received_at) extra += `<div class="extra"><b>KTV nhận:</b> ${escape(fmtTime(d.received_at))}</div>`;
    if (d.received_photo_url) {
      extra += `<div class="extra"><b>Ảnh nhận:</b><br><a href="${escape(d.received_photo_url)}" target="_blank" class="iss-photo"><img src="${escape(d.received_photo_url)}"></a></div>`;
    }
    if (d.rejected_reason) {
      extra += `<div class="extra" style="color:#dc2626"><b>Lý do từ chối:</b> ${escape(d.rejected_reason)}</div>`;
    }
    const acts = editable ? `
      <div class="acts">
        <button type="button" class="btn ghost sm" data-act="iss-reject">Từ chối</button>
        <button type="button" class="btn primary sm" data-act="iss-approve">Duyệt phiếu</button>
      </div>` : '';
    slot.innerHTML = `<table><thead>${head}</thead><tbody>${body}</tbody></table>${extra}${acts}`;
  }

  async function approveIssue(card) {
    const id = Number(card.dataset.id);
    const approvals = [];
    for (const tr of card.querySelectorAll('tr[data-item-id]')) {
      const qa = Number(tr.querySelector('.qty').value);
      if (!Number.isFinite(qa) || qa < 0) { ui.toast('Số lượng duyệt không hợp lệ', 'warning'); return; }
      approvals.push({ item_id: Number(tr.dataset.itemId), qty_approved: qa });
    }
    const total = approvals.reduce((s, a) => s + a.qty_approved, 0);
    if (total === 0) {
      const ok = await ui.confirm({ title: 'Tất cả dòng = 0', message: 'Phiếu sẽ chuyển sang TỪ CHỐI. Tiếp tục?', type: 'warning' });
      if (!ok) return;
    }
    const ok = await api.post(`/admin/staff-issues/${id}/approve`, { approvals },
      { successMessage: total > 0 ? 'Đã duyệt + xuất kho' : 'Đã chuyển sang từ chối' }).catch(() => null);
    if (ok) loadIssueHistory();
  }

  async function rejectIssue(card) {
    const id = Number(card.dataset.id);
    const reason = prompt('Lý do từ chối:');
    if (!reason || !reason.trim()) return;
    const ok = await api.post(`/admin/staff-issues/${id}/reject`, { reason: reason.trim() },
      { successMessage: 'Đã từ chối phiếu' }).catch(() => null);
    if (ok) loadIssueHistory();
  }

  function bindIssueModal() {
    $('issClose').addEventListener('click', closeIssueModal);
    $('issueModal').addEventListener('click', e => { if (e.target.id === 'issueModal') closeIssueModal(); });
    $('issAddLine').addEventListener('click', addIssueLine);
    $('issLines').addEventListener('click', e => {
      const btn = e.target.closest('button[data-rm]');
      if (!btn) return;
      const row = $('issLines').querySelector(`.iss-create-row[data-idx="${btn.dataset.rm}"]`);
      if (row && $('issLines').children.length > 1) { row.remove(); updateIssueSummary(); }
    });
    $('issLines').addEventListener('input', e => {
      const row = e.target.closest('.iss-create-row');
      if (!row) return;
      if (e.target.classList.contains('cProd') || e.target.classList.contains('cQty')) {
        updateRowStock(row); updateIssueSummary();
      }
    });
    $('issLines').addEventListener('change', e => {
      const row = e.target.closest('.iss-create-row');
      if (row && e.target.classList.contains('cProd')) { updateRowStock(row); updateIssueSummary(); }
    });
    $('issSubmit').addEventListener('click', submitIssueCreate);
    $('issFilter').addEventListener('click', e => {
      const btn = e.target.closest('button[data-st]');
      if (!btn) return;
      $('issFilter').querySelectorAll('button').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      issueFilterStatus = btn.dataset.st;
      loadIssueHistory();
    });
    $('issHistory').addEventListener('click', e => {
      const approveBtn = e.target.closest('button[data-act="iss-approve"]');
      const rejectBtn  = e.target.closest('button[data-act="iss-reject"]');
      if (approveBtn) { approveIssue(approveBtn.closest('.iss-card')); return; }
      if (rejectBtn)  { rejectIssue(rejectBtn.closest('.iss-card'));   return; }
      const card = e.target.closest('.iss-card');
      if (card && !e.target.closest('input, button, a')) expandIssueCard(card);
    });
  }

  // ---- Grid click handler ----
  async function handleGridClick(e) {
    // Close dropdowns when clicking anywhere else
    const moreBtn = e.target.closest('button[data-act="more"]');
    if (moreBtn) {
      const id = moreBtn.dataset.id;
      const dd = $(`dd-${id}`);
      const wasOpen = dd && dd.classList.contains('open');
      closeAllDropdowns();
      if (!wasOpen && dd) dd.classList.add('open');
      e.stopPropagation();
      return;
    }

    const ddItem = e.target.closest('.dd-item');
    if (ddItem) {
      closeAllDropdowns();
      const id = ddItem.dataset.id;
      const act = ddItem.dataset.act;
      const s = state.items.find(x => String(x.id) === String(id));
      if (!s) return;
      if (act === 'edit') openModal(s);
      else if (act === 'pw') {
        const newPw = prompt(`Nhập mật khẩu mới cho @${s.username}:`);
        if (!newPw) return;
        if (newPw.length < 4) return ui.toast('Tối thiểu 4 ký tự', 'warning');
        await api.post('/admin/staff/' + id + '/password', { password: newPw }, {
          successMessage: 'Đã đổi mật khẩu',
        }).catch(() => {});
      } else if (act === 'del') {
        const yes = await ui.confirm({
          title: 'Xác nhận xoá',
          message: `Ẩn nhân viên @${s.username}? Hãy gán lại việc và thu hồi thiết bị trước.`,
          type: 'warning',
          okText: 'Xóa',
        });
        if (!yes) return;
        const ok = await api.delete('/admin/staff/' + id, { successMessage: 'Đã xoá' }).catch(() => null);
        if (ok) load();
      }
      return;
    }

    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    const s = state.items.find(x => String(x.id) === String(id));
    if (!s) return;

    if (act === 'assign') openAssignModal(s);
    else if (act === 'issue') openIssueModal(s);
  }

  // ==================== MODAL UNG LUONG ====================
  const fmtMoney = (n) => new Intl.NumberFormat('vi-VN').format(n || 0);
  function advStatusPill(s) {
    const map = {
      pending:  ['Chờ duyệt', 'adv-status-pending'],
      approved: ['Đã duyệt',  'adv-status-approved'],
      rejected: ['Từ chối',   'adv-status-rejected'],
    };
    const [lbl, cls] = map[s] || [s, ''];
    return `<span class="pill ${cls}">${lbl}</span>`;
  }
  function fmtDt(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d).slice(0, 10);
    const p = n => String(n).padStart(2, '0');
    return `${p(dt.getDate())}/${p(dt.getMonth()+1)} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
  }
  function defaultPeriod() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  }

  async function loadMyAdvances() {
    const wrap = $('myAdvList');
    const res = await api.get('/admin/staff/me/advances', { silent: true }).catch(() => null);
    const items = (res && res.items) || [];
    if (!items.length) {
      wrap.innerHTML = '<p class="text-muted" style="font-size:13px">Chưa có phiếu ứng nào.</p>';
      return;
    }
    wrap.innerHTML = items.map(a => `
      <div class="adv-row ${a.status}">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <b style="font-size:14px">${fmtMoney(a.amount)}đ</b>
          ${advStatusPill(a.status)}
          <span style="font-size:12px;color:#64748b">Kỳ ${escape(a.period)}</span>
        </div>
        <div class="adv-meta">
          ${a.note ? `📝 ${escape(a.note)} · ` : ''}Gửi: ${escape(fmtDt(a.created_at))}
          ${a.status === 'rejected' && a.reject_reason ? `<br><span style="color:#dc2626">Lý do: ${escape(a.reject_reason)}</span>` : ''}
          ${a.status === 'approved' ? `<br><span style="color:#16a34a">Duyệt: ${escape(fmtDt(a.approved_at))}</span>` : ''}
        </div>
      </div>
    `).join('');
  }

  function openMyAdvanceModal() {
    $('adv_period').value = defaultPeriod();
    $('adv_amount').value = '';
    $('adv_note').value = '';
    $('myAdvanceModal').classList.add('open');
    loadMyAdvances();
  }
  function closeMyAdvanceModal() { $('myAdvanceModal').classList.remove('open'); }

  async function submitMyAdvance() {
    const period = $('adv_period').value;
    const amount = Money.get($('adv_amount'));
    const note   = $('adv_note').value.trim();
    if (!period) { ui.toast('Chọn kỳ lương', 'warning'); return; }
    if (!amount || amount <= 0) { ui.toast('Nhập số tiền ứng', 'warning'); return; }
    $('myAdvSubmit').disabled = true;
    const ok = await api.post('/admin/staff/me/advances', { period, amount, note }, {
      successMessage: 'Đã gửi yêu cầu ứng lương, chờ admin duyệt',
    }).catch(() => null);
    $('myAdvSubmit').disabled = false;
    if (!ok) return;
    $('adv_amount').value = '';
    $('adv_note').value = '';
    loadMyAdvances();
  }

  async function loadPendingAdvances() {
    const wrap = $('pendingAdvList');
    wrap.innerHTML = '<p class="text-muted" style="font-size:13px;padding:8px 0">Đang tải...</p>';
    const res = await api.get('/admin/staff/advances/pending', { silent: true }).catch(() => null);
    const items = (res && res.items) || [];
    const badge = $('pendingBadge');
    if (items.length) { badge.textContent = items.length; badge.style.display = ''; }
    else badge.style.display = 'none';

    if (!items.length) {
      wrap.innerHTML = '<p class="text-muted" style="font-size:13px;padding:16px 0;text-align:center">Không có yêu cầu nào đang chờ duyệt.</p>';
      return;
    }
    wrap.innerHTML = items.map(a => {
      const deductBadge = a.deduct_from_collection
        ? `<span style="background:#fef3c7;color:#92400e;padding:1px 8px;border-radius:4px;font-size:11px;font-weight:600">⬇ Trừ tiền thu hộ</span>`
        : '';
      const deductNote = a.deduct_from_collection
        ? `<div style="font-size:12px;color:#92400e;margin-top:4px">⚠ Khi duyệt sẽ tự động trừ vào tiền thu hộ KTV đang giữ.</div>`
        : '';
      return `
      <div class="adv-row pending" data-adv-id="${a.id}" data-staff-id="${a.staff_id}" data-staff-name="${escape(a.staff_name)}" data-amount="${a.amount}">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <b style="font-size:14px">${fmtMoney(a.amount)}đ</b>
          <span style="font-size:12px;color:#64748b">Kỳ ${escape(a.period)}</span>
          <span class="pill" style="background:#dbeafe;color:#1e40af">${escape(a.staff_name)}</span>
          ${deductBadge}
        </div>
        <div class="adv-meta">
          ${a.note ? `📝 ${escape(a.note)} · ` : ''}Gửi: ${escape(fmtDt(a.created_at))}
          ${deductNote}
        </div>
        <div class="adv-acts">
          <button type="button" class="btn ghost sm" data-act="adv-reject" style="color:var(--danger)">Từ chối</button>
          <button type="button" class="btn sm" data-act="adv-approve" style="background:#16a34a;border-color:#16a34a">Duyệt</button>
        </div>
      </div>`;
    }).join('');
  }

  function openPendingAdvModal() { $('pendingAdvModal').classList.add('open'); loadPendingAdvances(); }
  function closePendingAdvModal() { $('pendingAdvModal').classList.remove('open'); }

  async function handlePendingAdvClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const row = btn.closest('.adv-row');
    const advId   = row.dataset.advId;
    const staffId = row.dataset.staffId;

    if (btn.dataset.act === 'adv-approve') {
      const tenNV  = row.dataset.staffName || '';
      const soTien = fmtMoney(Number(row.dataset.amount || 0));
      const isDeduct = row.innerHTML.includes('Trừ tiền thu hộ');
      const msg = isDeduct
        ? `Nhân viên <b>${tenNV}</b> gửi yêu cầu ứng <b>${soTien}đ</b>. Khi xác nhận, hệ thống sẽ <b>tự động trừ vào tiền thu hộ</b>.`
        : `Nhân viên <b>${tenNV}</b> gửi yêu cầu ứng <b>${soTien}đ</b>. Khi xác nhận, hãy chuyển tiền cho KTV.`;
      const yes = await ui.confirm({ title: 'Duyệt phiếu ứng', body: `<p style="margin:0">${msg}</p>`, okText: 'Duyệt' });
      if (!yes) return;
      const ok = await api.patch(`/admin/staff/${staffId}/advances/${advId}/approve`, {}, {
        successMessage: 'Đã duyệt phiếu ứng',
      }).catch(() => null);
      if (ok) loadPendingAdvances();
    } else if (btn.dataset.act === 'adv-reject') {
      const reason = prompt('Lý do từ chối:');
      if (reason === null) return;
      const ok = await api.patch(`/admin/staff/${staffId}/advances/${advId}/reject`, { reason: reason.trim() }, {
        successMessage: 'Đã từ chối phiếu ứng',
      }).catch(() => null);
      if (ok) loadPendingAdvances();
    }
  }

  function bindAdvanceModals() {
    $('myAdvClose').addEventListener('click', closeMyAdvanceModal);
    $('myAdvCancelBtn').addEventListener('click', closeMyAdvanceModal);
    $('myAdvanceModal').addEventListener('click', e => { if (e.target.id === 'myAdvanceModal') closeMyAdvanceModal(); });
    $('myAdvSubmit').addEventListener('click', submitMyAdvance);
    $('btnMyAdvance').addEventListener('click', openMyAdvanceModal);

    $('pendingAdvClose').addEventListener('click', closePendingAdvModal);
    $('pendingAdvCancelBtn').addEventListener('click', closePendingAdvModal);
    $('pendingAdvModal').addEventListener('click', e => { if (e.target.id === 'pendingAdvModal') closePendingAdvModal(); });
    $('btnPendingAdvances').addEventListener('click', openPendingAdvModal);
    $('pendingAdvList').addEventListener('click', handlePendingAdvClick);
  }

  // ---- Init ----
  function init() {
    adminShell.init('staff');

    // Search debounce
    let timer;
    $('searchBox').addEventListener('input', e => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.q = e.target.value.trim(); load(); }, 300);
    });

    // Filter role
    $('filterRole').addEventListener('change', e => { state.role = e.target.value; load(); });

    // Sort
    $('sortSel').addEventListener('change', e => { state.sort = e.target.value; renderGrid(); });

    // View toggle
    $('vGrid').addEventListener('click', () => {
      state.view = 'grid';
      $('vGrid').classList.add('on');
      $('vList').classList.remove('on');
      renderGrid();
    });
    $('vList').addEventListener('click', () => {
      state.view = 'list';
      $('vList').classList.add('on');
      $('vGrid').classList.remove('on');
      renderGrid();
    });

    // Add staff
    if (!CAN_MANAGE && $('btnAdd')) $('btnAdd').style.display = 'none';
    if ($('btnAdd')) $('btnAdd').addEventListener('click', () => openModal(null));

    // Quick action "Thêm nhân sự"
    $('qaAddStaff').addEventListener('click', () => openModal(null));

    // Pending advances badge
    if (IS_ADMIN) {
      $('btnPendingAdvances').style.display = '';
      loadPendingAdvances();
    } else {
      $('btnMyAdvance').style.display = '';
    }

    bindAdvanceModals();

    $('modalClose').addEventListener('click', closeModal);
    $('btnCancel').addEventListener('click', closeModal);
    $('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    $('frm').addEventListener('submit', handleSubmit);

    $('assignClose').addEventListener('click', closeAssignModal);
    $('assignCancelBtn').addEventListener('click', closeAssignModal);
    $('assignModal').addEventListener('click', e => { if (e.target.id === 'assignModal') closeAssignModal(); });

    $('ktvGrid').addEventListener('click', handleGridClick);

    // Close dropdowns on outside click
    document.addEventListener('click', () => closeAllDropdowns());

    bindIssueModal();

    load();
    renderActivity();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
