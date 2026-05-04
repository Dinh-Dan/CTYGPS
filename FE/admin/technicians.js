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
    return `
      <div class="ktv-card" data-id="${s.id}">
        <div class="ktv-head">
          ${avatarHtml(s)}
          <div style="flex:1;min-width:0">
            <div class="ktv-name">${escape(s.full_name)}</div>
            <div class="ktv-username">@${escape(s.username)} ${roleBadge}</div>
          </div>
        </div>
        <div class="ktv-meta">
          <span><span class="online-dot ${onlineCls}"></span>${onlineLabel}</span>
          ${s.area ? `<span>📍 <b>${escape(s.area)}</b></span>` : '<span class="text-muted">Chưa gán khu vực</span>'}
          ${s.phone ? `<span>📞 ${escape(s.phone)}</span>` : ''}
        </div>
        <div class="ktv-stats">
          <div style="flex:1"><span class="stat-num">${s.active_tasks || 0}</span><span class="text-muted">Đang làm</span></div>
          <div style="flex:1"><span class="stat-num">${s.completed_tasks || 0}</span><span class="text-muted">Đã xong</span></div>
          <div style="flex:1"><span class="stat-num">${s.holding_items || 0}</span><span class="text-muted">Đang giữ TB</span></div>
        </div>
        <div class="ktv-stats" style="border:none;padding:0">
          <div style="flex:1">⭐ <b>${(s.rating || 0).toFixed ? (s.rating).toFixed(1) : Number(s.rating || 0).toFixed(1)}</b></div>
        </div>
        <div class="ktv-actions">
          ${s.role === 'kithuat' ? `<button class="btn sm" data-act="assign" data-id="${s.id}">Phân đơn</button>` : ''}
          <button class="btn ghost sm" data-act="edit" data-id="${s.id}">Sửa</button>
          <button class="btn ghost sm" data-act="pw" data-id="${s.id}">Đổi MK</button>
          <button class="btn ghost sm" data-act="del" data-id="${s.id}" style="color:var(--danger)">Xóa</button>
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
            ${t.vehicle_plate ? '· 🚗 ' + escape(t.vehicle_plate) : ''}
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

    load();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
