// Render sidebar cho cac trang admin + bell notification + load badges.
// Cach dung: trong <body class="shell"> chua <aside id="sidebar"> va <main class="main">.
// Goi adminShell.init('customers') de highlight muc dang chon.
//
// Tinh nang:
//   - Sidebar badges (qua /api/admin/notifications) - giu nhu cu
//   - Bell icon o topnav + dropdown 50 thong bao gan nhat
//   - Realtime socket 'admin:notification' -> toast + am thanh ding
//   - Mute toggle luu localStorage 'notif.mute'

(function (global) {
  // badgeKey = key trong response cua /api/admin/notifications
  const NAV = [
    { type: 'item', href: '/admin/',              icon: '📊', label: 'Dashboard',    key: 'dashboard' },
    { type: 'sep',  label: 'Khách & Đại lý' },
    { type: 'item', href: '/admin/customers.html', icon: '👥', label: 'Khách hàng', key: 'customers', badgeKey: 'customers' },
    { type: 'sep',  label: 'Bán hàng' },
    { type: 'item', href: '/admin/chat.html',      icon: '💬', label: 'Tin nhắn',   key: 'chat',      badgeKey: 'chat' },
    { type: 'item', href: '/admin/orders.html',    icon: '🛒', label: 'Đơn hàng',   key: 'orders',    badgeKey: 'orders' },
    { type: 'item', href: '/admin/debts.html',     icon: '💳', label: 'Công nợ',    key: 'debts',     badgeKey: 'debts' },
    { type: 'sep',  label: 'Vận hành' },
    { type: 'item', href: '/admin/products.html',    icon: '🏷', label: 'Sản phẩm',     key: 'products' },
    { type: 'item', href: '/admin/inventory.html',   icon: '📦', label: 'Kho thiết bị', key: 'inventory' },
    { type: 'item', href: '/admin/staff-stock.html', icon: '🎒', label: 'Kho cá nhân KTV', key: 'staff-stock' },
    { type: 'item', href: '/admin/suppliers.html',   icon: '🏭', label: 'Nhà cung cấp', key: 'suppliers' },
    { type: 'item', href: '/admin/technicians.html', icon: '🛠', label: 'Kỹ thuật',     key: 'technicians' },
    { type: 'item', href: '/admin/payroll.html',     icon: '💵', label: 'Bảng lương KTV', key: 'payroll' },
    { type: 'item', href: '/admin/reports.html',     icon: '📈', label: 'Báo cáo',      key: 'reports' },
    { type: 'sep',  label: 'Hệ thống' },
    { type: 'item', href: '/admin/settings.html',  icon: '⚙', label: 'Cài đặt',    key: 'settings' },
  ];

  const NOTIF_ICON = {
    order_new:              '🆕',
    badge_new:              '🪪',
    order_receive_uploaded: '📷',
    order_completed:        '✅',
    staff_remit:            '💰',
  };

  function injectStyle() {
    if (document.getElementById('admin-shell-style')) return;
    const s = document.createElement('style');
    s.id = 'admin-shell-style';
    s.textContent = `
      .sidebar a { position:relative; }
      .nav-badge {
        background:#dc2626;color:#fff;border-radius:999px;
        min-width:18px;height:18px;font-size:10.5px;font-weight:700;
        padding:0 6px;display:none;align-items:center;justify-content:center;
        margin-left:auto;line-height:1;
      }
      .nav-badge.active { display:inline-flex; }

      /* ---- Bell + dropdown ---- */
      #notif-bell-wrap{margin-left:auto;position:relative}
      #notif-bell-btn{position:relative;background:transparent;border:1px solid transparent;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:18px;line-height:1;transition:background .12s}
      #notif-bell-btn:hover{background:#f1f5f9}
      #notif-bell-btn.has-unread{animation:bell-shake 1.2s ease-in-out 1}
      @keyframes bell-shake{
        0%,100%{transform:rotate(0)}
        20%{transform:rotate(-12deg)}
        40%{transform:rotate(10deg)}
        60%{transform:rotate(-6deg)}
        80%{transform:rotate(4deg)}
      }
      #notif-bell-badge{
        position:absolute;top:0;right:0;
        background:#dc2626;color:#fff;border-radius:999px;
        min-width:18px;height:18px;padding:0 5px;
        font-size:10.5px;font-weight:700;line-height:18px;
        display:none;border:2px solid #fff;box-sizing:content-box;
      }
      #notif-bell-badge.active{display:inline-block}

      .notif-dropdown{
        position:absolute;top:calc(100% + 6px);right:0;
        width:380px;max-width:calc(100vw - 24px);
        background:#fff;border:1px solid #e2e8f0;border-radius:10px;
        box-shadow:0 12px 32px rgba(0,0,0,.15);
        display:none;z-index:1000;
      }
      .notif-dropdown.open{display:block}
      .notif-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #e2e8f0}
      .notif-head b{font-size:14px}
      .notif-head .btn.sm{padding:3px 8px;font-size:12px}
      .notif-list{max-height:420px;overflow-y:auto}
      .notif-item{
        display:flex;gap:10px;padding:10px 14px;cursor:pointer;
        border-bottom:1px solid #f1f5f9;transition:background .1s;
      }
      .notif-item:hover{background:#f8fafc}
      .notif-item.unread{background:#eff6ff}
      .notif-item.unread:hover{background:#dbeafe}
      .notif-item .ico{font-size:20px;flex-shrink:0;width:28px;text-align:center}
      .notif-item .body{flex:1;min-width:0}
      .notif-item .ttl{font-size:13px;font-weight:600;color:#0f172a;line-height:1.3;margin-bottom:2px}
      .notif-item .msg{font-size:12px;color:#475569;line-height:1.3;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
      .notif-item .time{font-size:11px;color:#94a3b8;margin-top:4px}
      .notif-empty{padding:30px 14px;text-align:center;color:#94a3b8;font-size:13px}
    `;
    document.head.appendChild(s);
  }

  function renderSidebar(activeKey) {
    let html = '<div class="brand"><span class="logo-mark">GV</span><span>QUẢN LÝ</span></div>';
    NAV.forEach(n => {
      if (n.type === 'sep') {
        html += `<div class="sep">${n.label}</div>`;
      } else {
        const cls = (n.key === activeKey ? 'active' : '') + (n.disabled ? ' is-disabled' : '');
        const href = n.disabled ? 'javascript:void(0)' : n.href;
        const soonAttr = n.disabled ? `data-soon="${n.label}"` : '';
        const soonTag  = n.disabled ? ' <small style="opacity:.5;font-size:11px">(soon)</small>' : '';
        const badgeSpan = n.badgeKey
          ? `<span class="nav-badge" data-nav-badge="${n.badgeKey}"></span>`
          : '';
        html += `<a href="${href}" class="${cls}" ${soonAttr}
          ${n.disabled ? 'title="Sắp ra mắt"' : ''}>
          ${n.icon} ${n.label}${soonTag}${badgeSpan}
        </a>`;
      }
    });
    html += `<a href="javascript:void(0)" id="btnLogout" style="margin-top:12px">↩ Đăng xuất</a>`;
    return html;
  }

  // Don topnav: bo tieu de + nut user (yeu cau tu user)
  function cleanupTopnav() {
    document.querySelectorAll('.topnav-title, #topnav-user').forEach(el => el.remove());
  }

  // ---- Bell + Dropdown ---------------------------------------
  function injectBell() {
    const topnav = document.querySelector('.main .topnav');
    if (!topnav || document.getElementById('notif-bell-wrap')) return;

    const wrap = document.createElement('div');
    wrap.id = 'notif-bell-wrap';
    wrap.innerHTML = `
      <button id="notif-bell-btn" type="button" aria-label="Thông báo">
        🔔
        <span id="notif-bell-badge"></span>
      </button>
      <div id="notif-dropdown" class="notif-dropdown" role="menu">
        <div class="notif-head">
          <b>Thông báo</b>
          <div style="display:flex;gap:6px;align-items:center">
            <button id="notif-mute" type="button" class="btn ghost sm" title="Bật/Tắt âm thanh">🔊</button>
            <button id="notif-read-all" type="button" class="btn ghost sm">Đã đọc tất cả</button>
          </div>
        </div>
        <div id="notif-list" class="notif-list"></div>
        <div class="notif-empty" id="notif-empty" style="display:none">Chưa có thông báo</div>
      </div>
    `;
    topnav.appendChild(wrap);
    bindBellEvents();
    syncMuteIcon();
  }

  function bindBellEvents() {
    const btn = document.getElementById('notif-bell-btn');
    const dd  = document.getElementById('notif-dropdown');
    if (!btn || !dd) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = dd.classList.toggle('open');
      if (open) loadFeed();
    });
    document.addEventListener('click', (e) => {
      if (!dd.contains(e.target) && e.target !== btn) {
        dd.classList.remove('open');
      }
    });
    document.getElementById('notif-mute').addEventListener('click', (e) => {
      e.stopPropagation();
      const muted = localStorage.getItem('notif.mute') === '1';
      localStorage.setItem('notif.mute', muted ? '0' : '1');
      syncMuteIcon();
    });
    document.getElementById('notif-read-all').addEventListener('click', async (e) => {
      e.stopPropagation();
      await api.post('/admin/notifications/feed/read-all', {}, { silent: true }).catch(() => null);
      // Cap nhat UI ngay khong cho roundtrip
      document.querySelectorAll('#notif-list .notif-item.unread').forEach(el => el.classList.remove('unread'));
      setBellBadge(0);
    });
    document.getElementById('notif-list').addEventListener('click', async (e) => {
      const item = e.target.closest('.notif-item');
      if (!item) return;
      const id = Number(item.dataset.id);
      const link = item.dataset.link;
      // Mark read (best-effort)
      if (item.classList.contains('unread')) {
        item.classList.remove('unread');
        api.post(`/admin/notifications/feed/${id}/read`, {}, { silent: true }).catch(() => null);
        const cur = Number(document.getElementById('notif-bell-badge').textContent) || 0;
        setBellBadge(Math.max(0, cur - 1));
      }
      if (link) location.href = link;
    });
  }

  function syncMuteIcon() {
    const btn = document.getElementById('notif-mute');
    if (!btn) return;
    const muted = localStorage.getItem('notif.mute') === '1';
    btn.textContent = muted ? '🔇' : '🔊';
    btn.title = muted ? 'Tắt âm thanh (đang tắt)' : 'Tắt âm thanh';
  }

  function setBellBadge(n) {
    const el = document.getElementById('notif-bell-badge');
    if (!el) return;
    if (n > 0) {
      el.textContent = n > 99 ? '99+' : String(n);
      el.classList.add('active');
      const btn = document.getElementById('notif-bell-btn');
      if (btn) btn.classList.add('has-unread');
    } else {
      el.classList.remove('active');
      el.textContent = '';
      const btn = document.getElementById('notif-bell-btn');
      if (btn) btn.classList.remove('has-unread');
    }
  }

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }
  function relativeTime(iso) {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (isNaN(t)) return '';
    const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (s < 60)     return 'vừa xong';
    if (s < 3600)   return Math.floor(s / 60) + ' phút trước';
    if (s < 86400)  return Math.floor(s / 3600) + ' giờ trước';
    if (s < 604800) return Math.floor(s / 86400) + ' ngày trước';
    return new Date(iso).toLocaleDateString('vi-VN');
  }

  function itemHtml(n) {
    return `
      <div class="notif-item ${n.is_read ? '' : 'unread'}"
           data-id="${n.id}" data-link="${escape(n.link_url || '')}">
        <div class="ico">${NOTIF_ICON[n.type] || '🔔'}</div>
        <div class="body">
          <div class="ttl">${escape(n.title)}</div>
          <div class="msg">${escape(n.message)}</div>
          <div class="time">${escape(relativeTime(n.created_at))}</div>
        </div>
      </div>`;
  }

  async function loadFeed() {
    const r = await api.get('/admin/notifications/feed?limit=50', { silent: true }).catch(() => null);
    if (!r) return;
    const list = document.getElementById('notif-list');
    const empty = document.getElementById('notif-empty');
    if (!list) return;
    if (!r.items.length) {
      list.innerHTML = '';
      if (empty) empty.style.display = '';
    } else {
      list.innerHTML = r.items.map(itemHtml).join('');
      if (empty) empty.style.display = 'none';
    }
    setBellBadge(Number(r.unread) || 0);
  }

  async function refreshUnreadCount() {
    const r = await api.get('/admin/notifications/feed/unread-count', { silent: true }).catch(() => null);
    if (r) setBellBadge(Number(r.unread) || 0);
  }

  // ---- Sidebar badges (cu) -----------------------------------
  function setBadge(key, n) {
    document.querySelectorAll(`[data-nav-badge="${key}"]`).forEach(el => {
      if (n > 0) {
        el.textContent = n > 99 ? '99+' : String(n);
        el.classList.add('active');
      } else {
        el.classList.remove('active');
        el.textContent = '';
      }
    });
  }

  let notifTimer = null;
  async function loadNotifications() {
    const [r, c] = await Promise.all([
      api.get('/admin/notifications',                { silent: true }).catch(() => null),
      api.get('/admin/conversations/unread-count',   { silent: true }).catch(() => null),
    ]);
    if (r) Object.entries(r).forEach(([k, v]) => setBadge(k, Number(v) || 0));
    if (c) setBadge('chat', Number(c.unread) || 0);
    refreshUnreadCount();
  }

  async function refreshChatBadge() {
    const c = await api.get('/admin/conversations/unread-count', { silent: true }).catch(() => null);
    if (c) setBadge('chat', Number(c.unread) || 0);
  }

  // ---- Audio (Web Audio API ding) -----------------------------
  let audioCtx = null;
  let audioUnlocked = false;
  function unlockAudio() {
    if (audioUnlocked) return;
    try {
      const Ctx = global.AudioContext || global.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = audioCtx || new Ctx();
      // Browser block autoplay den khi co user gesture; tao 1 buffer rong
      // de 'unlock' context.
      const buf = audioCtx.createBuffer(1, 1, 22050);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(audioCtx.destination);
      src.start(0);
      audioUnlocked = true;
    } catch (_) { /* noop */ }
  }
  function playDing() {
    if (localStorage.getItem('notif.mute') === '1') return;
    try {
      const Ctx = global.AudioContext || global.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = audioCtx || new Ctx();
      const t0 = audioCtx.currentTime;
      // 2 not nhe (ding-dong): 880Hz roi 1320Hz
      [{ f: 880, t: 0 }, { f: 1320, t: 0.12 }].forEach(({ f, t }) => {
        const osc = audioCtx.createOscillator();
        const g   = audioCtx.createGain();
        osc.connect(g); g.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.value = f;
        const start = t0 + t;
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(0.18, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch (_) {}
  }

  // ---- Realtime socket ---------------------------------------
  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  function showNotifToast(data) {
    if (!global.ui || !ui.toast) return;
    // Toast clickable: ui.toast khong support nhung minh tu show 1 div thay the?
    // De don gian dung ui.toast text + neu co link luu vao localStorage de click
    // bell se mo... Phuc tap. Tam thoi: hien toast info, am thanh kem; chi
    // tiet xem trong dropdown.
    const ico = NOTIF_ICON[data.type] || '🔔';
    ui.toast(`${ico} ${data.title}`, 'info');
  }

  async function setupSockets() {
    try {
      if (!global.io)         await loadScript('/socket.io/socket.io.js');
      if (!global.appSocket)  await loadScript('/shared/js/socket.js');
    } catch (_) { return; }
    if (!global.appSocket) return;

    appSocket.connect();

    // Chat toast (giu nguyen behavior cu)
    appSocket.on('message:new-toast', (data) => {
      if (location.pathname.endsWith('/admin/chat.html')) return;
      const preview = (data.content || '').slice(0, 80);
      ui.toast(`💬 Tin nhắn mới: ${preview}`, 'info');
      playDing();
      refreshChatBadge();
    });

    // Notification realtime: KTV thao tac don, khach tao don/badge, KTV nop tien
    appSocket.on('admin:notification', (data) => {
      showNotifToast(data);
      playDing();

      // Tang badge bell
      const cur = Number((document.getElementById('notif-bell-badge') || {}).textContent) || 0;
      setBellBadge(cur + 1);

      // Neu dropdown dang mo, prepend item moi vao dau list
      const dd = document.getElementById('notif-dropdown');
      const list = document.getElementById('notif-list');
      const empty = document.getElementById('notif-empty');
      if (dd && dd.classList.contains('open') && list) {
        const tmp = document.createElement('div');
        tmp.innerHTML = itemHtml({ ...data, is_read: 0 });
        list.insertBefore(tmp.firstElementChild, list.firstChild);
        if (empty) empty.style.display = 'none';
      }
    });
  }

  function init(activeKey) {
    const u = auth.user();   // co the null

    injectStyle();

    const sb = document.getElementById('sidebar');
    if (sb) sb.innerHTML = renderSidebar(activeKey);

    cleanupTopnav();
    injectBell();

    document.body.addEventListener('click', (e) => {
      if (e.target.id === 'btnLogout') auth.logout();

      // Click vao module "soon" -> bao toast
      const soonLink = e.target.closest('a[data-soon]');
      if (soonLink) {
        e.preventDefault();
        ui.toast(`Module "${soonLink.dataset.soon}" sắp ra mắt`, 'info');
      }
    });

    // Unlock audio context o user gesture dau tien (browser security)
    document.addEventListener('click', unlockAudio, { once: true, capture: true });

    // Load notifications + auto-refresh
    if (u) {
      loadNotifications();
      if (notifTimer) clearInterval(notifTimer);
      notifTimer = setInterval(loadNotifications, 5000); // 5s
      setupSockets();
    }

    return u;
  }

  global.adminShell = {
    init,
    refreshNotifications: loadNotifications,
    refreshChatBadge,
    refreshFeed: loadFeed,
  };
})(window);
