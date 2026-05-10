// Logic trang admin/technicians — quan ly KTV + phan cong don

(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  const state = {
    q: '',
    role: '',
    items: [],
  };
  let editing = null;
  let assigningKtv = null;

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  function avatarHtml(s) {
    if (s.avatar_url) return `<img src="${s.avatar_url}" class="ktv-avatar" alt="">`;
    const i = (s.full_name || s.username || '?').trim().charAt(0).toUpperCase();
    return `<div class="ktv-avatar">${i}</div>`;
  }

  function cardHtml(s) {
    const onlineCls = s.online_status === 'online' ? '' : 'off';
    const onlineLabel = s.online_status === 'online' ? 'Online' : 'Offline';
    const roleBadge = s.role === 'admin'
      ? '<span class="pill blue">Quản trị</span>'
      : '<span class="pill amber">Kỹ thuật</span>';
    const active = s.active_tasks || 0;
    const done   = s.completed_tasks || 0;
    const hold   = s.holding_items || 0;
    const isKtv  = s.role === 'kithuat';
    return `
      <div class="ktv-card" data-id="${s.id}">
        <span class="role-tag">${roleBadge}</span>
        <div class="ktv-head">
          ${avatarHtml(s)}
          <div style="flex:1;min-width:0">
            <div class="ktv-name">${escape(s.full_name)}</div>
            <div class="ktv-username">@${escape(s.username)}</div>
          </div>
        </div>
        <div class="ktv-meta">
          <span><span class="online-dot ${onlineCls}"></span>${onlineLabel}</span>
          ${s.area ? `<span>📍 <b>${escape(s.area)}</b></span>` : '<span class="text-muted">📍 Chưa gán</span>'}
          ${s.phone ? `<span>📞 ${escape(s.phone)}</span>` : ''}
        </div>
        <div class="ktv-stats">
          <div class="stat ${active ? '' : 'zero'}"><span class="stat-num">${active}</span><span class="stat-lbl">Đang làm</span></div>
          <div class="stat ${done ? '' : 'zero'}"><span class="stat-num">${done}</span><span class="stat-lbl">Đã xong</span></div>
          <div class="stat ${hold ? 'warn' : 'zero'}"><span class="stat-num">${hold}</span><span class="stat-lbl">Đang giữ TB</span></div>
        </div>
        <div class="ktv-actions">
          ${isKtv ? `<button class="btn sm full" data-act="assign" data-id="${s.id}">📋 Phân đơn</button>` : ''}
          ${isKtv ? `<button class="btn sm full" data-act="issue" data-id="${s.id}" style="background:#0ea5e9">📤 Cấp sản phẩm</button>` : ''}
          ${isKtv ? `<a class="btn ghost sm full" href="/admin/payroll.html?staff=${s.id}" style="background:#16a34a;color:#fff;border-color:#16a34a">💵 Bảng lương</a>` : ''}
          <button class="btn ghost sm" data-act="edit" data-id="${s.id}">✏️ Sửa</button>
          <button class="btn ghost sm" data-act="pw" data-id="${s.id}">🔑 Đổi MK</button>
          <button class="btn ghost sm full" data-act="del" data-id="${s.id}" style="color:var(--danger)">🗑️ Xóa</button>
        </div>
      </div>
    `;
  }

  async function load() {
    const p = new URLSearchParams();
    if (state.q)    p.set('q', state.q);
    if (state.role) p.set('role', state.role);
    p.set('limit', 100);
    const res = await api.get('/admin/staff?' + p.toString()).catch(() => null);
    if (!res) return;
    state.items = res.items;
    if (!res.items.length) {
      $('ktvGrid').innerHTML = '';
      $('emptyMsg').classList.remove('hide');
    } else {
      $('emptyMsg').classList.add('hide');
      $('ktvGrid').innerHTML = res.items.map(cardHtml).join('');
    }
  }

  // ---- Modal CRUD --------------------------------------------
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
      $('pwHelp').textContent = 'Bỏ trống nếu không cần đổi mật khẩu. Đổi MK riêng dùng nút "Đổi MK".';
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

  // ---- Modal phan cong ---------------------------------------
  async function openAssignModal(ktv) {
    assigningKtv = ktv;
    $('assignKtvName').textContent = ktv.full_name + (ktv.area ? ` (${ktv.area})` : '');
    $('assignList').innerHTML = '<p class="text-muted">Đang tải...</p>';
    $('assignModal').classList.add('open');

    // Lay don chua co KTV (status='new' = "đã chốt", chưa assigned)
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
      row.addEventListener('click', async () => {
        const orderId = row.dataset.order;
        const ok = await api.post('/admin/orders/' + orderId + '/assign-staff',
          { staff_id: assigningKtv.id, kind: 'install', wage_amount: 0 },
          { successMessage: 'Đã phân công', loading: true }
        ).catch(() => null);
        if (ok) {
          $('assignModal').classList.remove('open');
          load();
        }
      });
    });
  }

  function closeAssignModal() {
    $('assignModal').classList.remove('open');
    assigningKtv = null;
  }

  // ==================== MODAL CAP SAN PHAM ====================
  let issueKtv = null;
  let issueProducts = [];   // [{id, code, name}]
  let issueProductMap = {}; // by id
  let issueProductLabelMap = {}; // by "CODE · NAME" -> id
  let issueStockMap = {};   // product_id -> qty
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
        api.get('/admin/inventory/stock?limit=500',     { silent: true }).catch(() => null),
      ]);
      issueProducts = (pr && (pr.items || pr)) || [];
      issueProductMap = {};
      issueProductLabelMap = {};
      issueProducts.forEach(p => {
        issueProductMap[p.id] = p;
        issueProductLabelMap[productLabel(p)] = p.id;
      });
      issueStockMap = {};
      const stockItems = (st && (st.items || st)) || [];
      stockItems.forEach(s => { issueStockMap[s.product_id] = Number(s.quantity) || 0; });

      // Render datalist 1 lan
      $('issProdList').innerHTML = issueProducts.map(p =>
        `<option value="${escape(productLabel(p))}">`).join('');
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
    const row = document.createElement('tr');
    row.className = 'iss-create-row';
    row.dataset.idx = idx;
    row.innerHTML = `
      <td class="iss-prod-cell">
        <input type="text" class="input cProd" list="issProdList" placeholder="Gõ mã hoặc tên SP...">
        <span class="stock-hint" style="display:none"></span>
      </td>
      <td><input type="number" class="input qty cQty" min="1" value="1"></td>
      <td><textarea class="input imei cImei" rows="1" placeholder="868001&#10;868002 (mỗi IMEI 1 dòng)"></textarea></td>
      <td><button type="button" class="rm" data-rm="${idx}" title="Xoá dòng">×</button></td>
    `;
    $('issLines').appendChild(row);
    // Auto focus o SP cua dong moi
    setTimeout(() => row.querySelector('.cProd').focus(), 30);
  }

  function updateRowStock(row) {
    const val = row.querySelector('.cProd').value.trim();
    const pid = issueProductLabelMap[val];
    const hint = row.querySelector('.stock-hint');
    const qtyInput = row.querySelector('.cQty');
    if (!pid) {
      hint.style.display = 'none';
      qtyInput.removeAttribute('max');
      return;
    }
    const stock = issueStockMap[pid] || 0;
    hint.textContent = `Tồn: ${stock}`;
    hint.style.display = '';
    const qty = Number(qtyInput.value) || 0;
    hint.classList.toggle('low', qty > stock || stock === 0);
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
    const r = await api.get(`/admin/staff-issues?${params.toString()}`, { silent: true })
      .catch(() => null);
    const items = (r && r.items) || [];

    // Lay so phieu draft tong (khong theo filter) cho badge
    const rAll = issueFilterStatus
      ? await api.get(`/admin/staff-issues?staff_id=${issueKtv.id}&status=draft&limit=1`, { silent: true }).catch(() => null)
      : { total: items.filter(x => x.status === 'draft').length };
    const draftCount = (rAll && rAll.total) || 0;
    const badge = $('issDraftBadge');
    if (draftCount > 0) {
      badge.textContent = `${draftCount} chờ duyệt`;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }

    if (!items.length) {
      wrap.innerHTML = '<div class="iss-empty">Chưa có phiếu nào</div>';
      return;
    }
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
    if (card.classList.contains('open')) {
      card.classList.remove('open');
      return;
    }
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
        const ok = it.stock_qty >= it.qty_requested;
        return `<tr data-item-id="${it.id}" data-req="${it.qty_requested}">
          <td>${escape(it.product_code)} · ${escape(it.product_name)}</td>
          <td>${it.qty_requested}</td>
          <td><span class="${ok ? 'iss-ok' : 'iss-low'}">${it.stock_qty}</span></td>
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
    if (d.note) {
      extra += `<div class="extra"><b>Ghi chú:</b> ${escape(d.note)}</div>`;
    }
    if (d.approved_at) {
      extra += `<div class="extra"><b>Duyệt:</b> ${escape(d.approved_by_name || '')} · ${escape(fmtTime(d.approved_at))}${d.receipt_code ? ' · phiếu xuất ' + escape(d.receipt_code) : ''}</div>`;
    }
    if (d.received_at) {
      extra += `<div class="extra"><b>KTV nhận:</b> ${escape(fmtTime(d.received_at))}</div>`;
    }
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
      </div>
    ` : '';

    slot.innerHTML = `
      <table><thead>${head}</thead><tbody>${body}</tbody></table>
      ${extra}
      ${acts}
    `;
  }

  async function approveIssue(card) {
    const id = Number(card.dataset.id);
    const approvals = [];
    for (const tr of card.querySelectorAll('tr[data-item-id]')) {
      const itemId = Number(tr.dataset.itemId);
      const qa = Number(tr.querySelector('.qty').value);
      if (!Number.isFinite(qa) || qa < 0) {
        ui.toast('Số lượng duyệt không hợp lệ', 'warning'); return;
      }
      approvals.push({ item_id: itemId, qty_approved: qa });
    }
    const total = approvals.reduce((s, a) => s + a.qty_approved, 0);
    if (total === 0) {
      const ok = await ui.confirm({
        title: 'Tất cả dòng = 0',
        message: 'Phiếu sẽ chuyển sang TỪ CHỐI. Tiếp tục?',
        type: 'warning',
      });
      if (!ok) return;
    }
    const ok = await api.post(`/admin/staff-issues/${id}/approve`, { approvals },
      { successMessage: total > 0 ? 'Đã duyệt + xuất kho' : 'Đã chuyển sang từ chối' })
      .catch(() => null);
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
    $('issueModal').addEventListener('click', (e) => {
      if (e.target.id === 'issueModal') closeIssueModal();
    });
    $('issAddLine').addEventListener('click', addIssueLine);

    // Form events: xoa dong, update stock hint + summary realtime
    $('issLines').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-rm]');
      if (!btn) return;
      const row = $('issLines').querySelector(`.iss-create-row[data-idx="${btn.dataset.rm}"]`);
      if (row && $('issLines').children.length > 1) {
        row.remove();
        updateIssueSummary();
      }
    });
    $('issLines').addEventListener('input', (e) => {
      const row = e.target.closest('.iss-create-row');
      if (!row) return;
      if (e.target.classList.contains('cProd') || e.target.classList.contains('cQty')) {
        updateRowStock(row);
        updateIssueSummary();
      }
    });
    $('issLines').addEventListener('change', (e) => {
      const row = e.target.closest('.iss-create-row');
      if (!row) return;
      if (e.target.classList.contains('cProd')) {
        // Khi user chon datalist option, qty input van giu nguyen — chi update hint
        updateRowStock(row);
        updateIssueSummary();
      }
    });

    $('issSubmit').addEventListener('click', submitIssueCreate);

    // Filter
    $('issFilter').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-st]');
      if (!btn) return;
      $('issFilter').querySelectorAll('button').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      issueFilterStatus = btn.dataset.st;
      loadIssueHistory();
    });

    // History click
    $('issHistory').addEventListener('click', (e) => {
      const approveBtn = e.target.closest('button[data-act="iss-approve"]');
      const rejectBtn  = e.target.closest('button[data-act="iss-reject"]');
      if (approveBtn) { approveIssue(approveBtn.closest('.iss-card')); return; }
      if (rejectBtn)  { rejectIssue(rejectBtn.closest('.iss-card'));  return; }
      const card = e.target.closest('.iss-card');
      if (card && !e.target.closest('input, button, a')) expandIssueCard(card);
    });
  }

  // ---- Click handler -----------------------------------------
  async function handleGridClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    const s = state.items.find(x => String(x.id) === String(id));
    if (!s) return;

    if (act === 'edit') {
      openModal(s);
    } else if (act === 'assign') {
      openAssignModal(s);
    } else if (act === 'issue') {
      openIssueModal(s);
    } else if (act === 'pw') {
      const newPw = prompt(`Nhập mật khẩu mới cho @${s.username}:`);
      if (!newPw) return;
      if (newPw.length < 4) return ui.toast('Tối thiểu 4 ký tự', 'warning');
      await api.post('/admin/staff/' + id + '/password', { password: newPw }, {
        successMessage: 'Đã đổi mật khẩu',
      }).catch(() => {});
    } else if (act === 'del') {
      const yes = await ui.confirm({
        title: 'Xác nhận xoá',
        message: `Xoá nhân viên @${s.username}? Action này không thể hoàn tác.`,
        type: 'warning',
        okText: 'Xoá',
      });
      if (!yes) return;
      const ok = await api.delete('/admin/staff/' + id, {
        successMessage: 'Đã xoá',
      }).catch(() => null);
      if (ok) load();
    }
  }

  // ---- Init --------------------------------------------------
  function init() {
    adminShell.init('technicians');

    let timer;
    $('searchBox').addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.q = e.target.value.trim(); load(); }, 300);
    });
    $('filterRole').addEventListener('change', (e) => {
      state.role = e.target.value;
      load();
    });

    $('btnAdd').addEventListener('click', () => openModal(null));
    $('modalClose').addEventListener('click', closeModal);
    $('btnCancel').addEventListener('click', closeModal);
    $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    $('frm').addEventListener('submit', handleSubmit);

    $('assignClose').addEventListener('click', closeAssignModal);
    $('assignCancelBtn').addEventListener('click', closeAssignModal);
    $('assignModal').addEventListener('click', (e) => { if (e.target.id === 'assignModal') closeAssignModal(); });

    $('ktvGrid').addEventListener('click', handleGridClick);

    bindIssueModal();

    load();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
