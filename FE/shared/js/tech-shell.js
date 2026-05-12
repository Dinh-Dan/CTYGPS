// Render sidebar + topnav cho cac trang ky thuat (/kithuat/*).
// Cach dung: trong <body class="shell"> chua <aside id="sidebar"> va <main class="main">,
//   trong topnav cua main de <div id="topnav-user"></div>.
// Goi techShell.init('tasks') de highlight muc dang chon.
//
// Mobile: them nut hamburger vao topnav, them bottom-nav 5 muc chinh,
// sidebar tro thanh drawer truot tu trai. Body co class "tech" de scope CSS.

(function (global) {
  const NAV = [
    { type: 'item', href: '/kithuat/',                icon: '📊', label: 'Dashboard',     key: 'dashboard' },
    { type: 'sep',  label: 'Công việc' },
    { type: 'item', href: '/kithuat/tasks.html',      icon: '🛠', label: 'Công việc',     key: 'tasks' },
    { type: 'item', href: '/kithuat/summary.html',    icon: '📈', label: 'Tổng kết đơn',   key: 'summary' },
    { type: 'item', href: '/kithuat/inventory.html',  icon: '📦', label: 'Thiết bị',       key: 'inventory' },
    { type: 'sep',  label: 'Liên hệ' },
    { type: 'item', href: '/kithuat/chat.html',       icon: '💬', label: 'Chat khách',     key: 'chat' },
    { type: 'sep',  label: 'Cá nhân' },
    { type: 'item', href: '/kithuat/advances.html',   icon: '💰', label: 'Ứng lương',       key: 'advances' },
    { type: 'item', href: '/kithuat/profile.html',    icon: '👤', label: 'Hồ sơ',          key: 'profile' },
  ];

  // 5 muc chinh tren bottom nav mobile.
  const BOTTOM_NAV = [
    { href: '/kithuat/',                icon: '📊', label: 'Trang chủ', key: 'dashboard' },
    { href: '/kithuat/tasks.html',      icon: '🛠', label: 'Việc',      key: 'tasks' },
    { href: '/kithuat/inventory.html',  icon: '📦', label: 'Thiết bị',  key: 'inventory' },
    { href: '/kithuat/profile.html',    icon: '👤', label: 'Hồ sơ',     key: 'profile' },
  ];

  function renderSidebar(activeKey) {
    let html = '<div class="brand"><span class="logo-mark">GV</span><span>KỸ THUẬT</span></div>';
    NAV.forEach(n => {
      if (n.type === 'sep') {
        html += `<div class="sep">${n.label}</div>`;
      } else {
        const cls = (n.key === activeKey ? 'active' : '') + (n.disabled ? ' is-disabled' : '');
        const href = n.disabled ? 'javascript:void(0)' : n.href;
        const soonAttr = n.disabled ? `data-soon="${n.label}"` : '';
        html += `<a href="${href}" class="${cls}" ${soonAttr}>
          ${n.icon} ${n.label}${n.disabled ? ' <small style="opacity:.5;font-size:11px">(soon)</small>' : ''}
        </a>`;
      }
    });
    html += `<a href="javascript:void(0)" id="btnLogout" style="margin-top:12px">↩ Đăng xuất</a>`;
    return html;
  }

  function renderTopnavUser(user) {
    const initial = (user.full_name || user.username || '?').trim().charAt(0).toUpperCase();
    const avatar = user.avatar_url
      ? `<img src="${user.avatar_url}" class="avatar" style="object-fit:cover">`
      : `<div class="avatar">${initial}</div>`;
    const roleLabel = 'Kỹ thuật' + (user.area ? ' · ' + user.area : '');
    return `
      ${avatar}
      <div class="topnav-userinfo">
        <b>${user.full_name || user.username}</b><br>
        <span class="text-muted" style="font-size:12px">${roleLabel}</span>
      </div>
      <button class="btn ghost sm" id="btnLogout2">Đăng xuất</button>`;
  }

  function renderTopnavGuest() {
    return `<button class="btn" id="btnLogin">Đăng nhập</button>`;
  }

  function renderBottomNav(activeKey) {
    let html = '';
    BOTTOM_NAV.forEach(n => {
      const cls = n.key === activeKey ? 'active' : '';
      html += `<a href="${n.href}" class="${cls}">
        <span class="ic">${n.icon}</span><span>${n.label}</span>
      </a>`;
    });
    return html;
  }

  function ensureMobileChrome(activeKey) {
    // Hamburger trong topnav (chen truoc title).
    const topnav = document.querySelector('.main .topnav');
    if (topnav && !topnav.querySelector('.tech-hamburger')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tech-hamburger';
      btn.setAttribute('aria-label', 'Mở menu');
      btn.innerHTML = '☰';
      topnav.insertBefore(btn, topnav.firstChild);
    }

    // Bottom nav o cuoi shell.
    const shell = document.querySelector('.shell');
    if (shell && !document.querySelector('.tech-bottom-nav')) {
      const nav = document.createElement('nav');
      nav.className = 'tech-bottom-nav';
      nav.innerHTML = renderBottomNav(activeKey);
      shell.appendChild(nav);
    }

    // Drawer overlay (click de dong sidebar).
    if (shell && !shell.querySelector('.tech-drawer-bg')) {
      const bg = document.createElement('div');
      bg.className = 'tech-drawer-bg';
      shell.appendChild(bg);
    }
  }

  function init(activeKey) {
    document.body.classList.add('tech');

    const u = auth.user();

    const sb = document.getElementById('sidebar');
    if (sb) sb.innerHTML = renderSidebar(activeKey);

    const tn = document.getElementById('topnav-user');
    if (tn) tn.innerHTML = u ? renderTopnavUser(u) : renderTopnavGuest();

    ensureMobileChrome(activeKey);

    document.body.addEventListener('click', (e) => {
      if (e.target.id === 'btnLogout' || e.target.id === 'btnLogout2') auth.logout();
      if (e.target.id === 'btnLogin')  ui.loginDialog();

      // Hamburger toggle drawer.
      if (e.target.closest('.tech-hamburger')) {
        document.querySelector('.shell')?.classList.toggle('menu-open');
        return;
      }
      // Click drawer-bg dong sidebar.
      if (e.target.classList.contains('tech-drawer-bg')) {
        document.querySelector('.shell')?.classList.remove('menu-open');
        return;
      }
      // Click link trong sidebar tren mobile: dong drawer.
      if (e.target.closest('.sidebar a')) {
        document.querySelector('.shell')?.classList.remove('menu-open');
      }

      const soonLink = e.target.closest('a[data-soon]');
      if (soonLink) {
        e.preventDefault();
        ui.toast(`Module "${soonLink.dataset.soon}" sắp ra mắt`, 'info');
      }
    });
    return u;
  }

  global.techShell = { init };
})(window);
