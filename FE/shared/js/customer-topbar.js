// Topbar tai khoan dung chung cho moi trang khach.
// Auto-mount vao phan tu co id="topbarRight" (hoac data-customer-topbar).
// Khi login: hien avatar + ten -> click ra dropdown menu (Tai khoan, Don, Logout).
// Khi guest:  link "Đăng nhập".
// Phu thuoc: ui.js, api.js, auth.js da load truoc.

(function (global) {
  function injectStyle() {
    if (document.getElementById('cust-topbar-style')) return;
    const s = document.createElement('style');
    s.id = 'cust-topbar-style';
    s.textContent = `
      .ct-wrap{ position:relative;display:inline-flex;align-items:center;gap:6px;font-size:13px; }
      .ct-user-btn{
        display:inline-flex;align-items:center;gap:7px;background:transparent;
        border:1px solid rgba(255,255,255,.25);color:inherit;padding:3px 9px 3px 4px;
        border-radius:999px;cursor:pointer;font-size:13px;line-height:1.2;
        transition:.15s;
      }
      .ct-user-btn:hover{ background:rgba(255,255,255,.12); }
      .ct-avatar{
        width:24px;height:24px;border-radius:50%;background:#fff;color:#1e40af;
        display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;
        flex-shrink:0;overflow:hidden;
      }
      .ct-avatar img{ width:100%;height:100%;object-fit:cover; }
      .ct-name{ max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
      .ct-caret{ font-size:10px;opacity:.7; }

      .ct-menu{
        position:absolute;top:calc(100% + 8px);right:0;
        background:#fff;color:#1f2937;border:1px solid #e2e8f0;border-radius:10px;
        box-shadow:0 10px 32px rgba(15,23,42,.15);
        min-width:240px;padding:6px;z-index:5000;display:none;
      }
      .ct-menu.open{ display:block; }
      .ct-menu .head{
        padding:10px 12px;border-bottom:1px solid #f1f5f9;margin-bottom:4px;
      }
      .ct-menu .head .n{ font-weight:700;font-size:13.5px;color:#0f172a; }
      .ct-menu .head .p{ font-size:11.5px;color:#64748b;margin-top:2px; }
      .ct-menu a, .ct-menu button{
        display:flex;align-items:center;gap:9px;width:100%;
        padding:8px 12px;border:none;background:transparent;cursor:pointer;
        font-size:13px;color:#1f2937;border-radius:7px;text-align:left;
        text-decoration:none;
      }
      .ct-menu a:hover, .ct-menu button:hover{ background:#f1f5f9; }
      .ct-menu .divider{ height:1px;background:#f1f5f9;margin:4px 0; }
      .ct-menu .icon{ width:18px;text-align:center;font-size:14px; }
      .ct-menu .danger{ color:#dc2626; }

      /* Mobile nav drawer close button */
      .nav-close-btn{
        display:none;margin:8px 4px 6px;padding:11px;background:#fef2f2;
        color:#dc2626;border:1px solid #fecaca;border-radius:8px;
        font-weight:600;font-size:14px;cursor:pointer;text-align:center;
      }
      .nav-close-btn:hover{ background:#fee2e2; }
      @media (max-width:900px){
        nav.main.open .nav-close-btn{ display:block; }
      }
    `;
    document.head.appendChild(s);
  }

  // Them nut "Dong menu" duoi cuoi nav mobile + tu dong dong khi bam link
  function mountNavClose() {
    document.querySelectorAll('header.site nav.main').forEach(nav => {
      if (nav.dataset.navCloseMounted) return;
      nav.dataset.navCloseMounted = '1';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-close-btn';
      btn.textContent = '✕ Đóng menu';
      btn.addEventListener('click', () => nav.classList.remove('open'));
      nav.appendChild(btn);

      // Bam link cung tu dong dong (thuong khi cung trang voi anchor)
      nav.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => nav.classList.remove('open'));
      });
    });
  }

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  function initialOf(name, code) {
    return String(name || code || '?').trim().charAt(0).toUpperCase();
  }

  function renderUser(target, u) {
    const avatar = u.avatar_url
      ? `<img src="${escape(u.avatar_url)}" alt="">`
      : initialOf(u.full_name, u.code);
    const displayName = escape(u.full_name || u.code || 'Khách');

    target.innerHTML = `
      <div class="ct-wrap" data-ct>
        <button type="button" class="ct-user-btn" data-ct-toggle aria-haspopup="true" aria-expanded="false">
          <span class="ct-avatar">${avatar}</span>
          <span class="ct-name">${displayName}</span>
          <span class="ct-caret">▾</span>
        </button>
        <div class="ct-menu" data-ct-menu role="menu">
          <div class="head">
            <div class="n">${displayName}</div>
            <div class="p">${escape(u.phone || u.code || '')}</div>
          </div>
          <a href="/customer/account.html" role="menuitem">
            <span class="icon">👤</span><span>Tài khoản của tôi</span>
          </a>
          <a href="/customer/orders.html" role="menuitem">
            <span class="icon">📦</span><span>Đơn của tôi</span>
          </a>
          <div class="divider"></div>
          <button type="button" data-ct-logout role="menuitem" class="danger">
            <span class="icon">🚪</span><span>Đăng xuất</span>
          </button>
        </div>
      </div>`;
  }

  function renderGuest(target) {
    target.innerHTML =
      `<a href="/" style="opacity:.85">Cổng nội bộ</a>
       &nbsp;|&nbsp;
       <a href="javascript:void(0)" data-ct-login>Đăng nhập</a>`;
  }

  function findTarget() {
    return document.getElementById('topbarRight')
        || document.querySelector('[data-customer-topbar]');
  }

  function paint(u) {
    const t = findTarget();
    if (!t) return;
    if (u && (u.role === 'customer' || u.role === 'daily')) renderUser(t, u);
    else renderGuest(t);
  }

  // Click ngoai -> dong dropdown
  document.addEventListener('click', (e) => {
    const wrap = e.target.closest('[data-ct]');
    if (e.target.closest('[data-ct-toggle]')) {
      const menu = wrap.querySelector('[data-ct-menu]');
      const btn  = wrap.querySelector('[data-ct-toggle]');
      const isOpen = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
      return;
    }
    if (e.target.closest('[data-ct-logout]')) {
      auth.logout();
      return;
    }
    if (e.target.closest('[data-ct-login]')) {
      ui.loginDialog();
      return;
    }
    // Click ngoai: dong moi menu dang mo
    if (!wrap) {
      document.querySelectorAll('[data-ct-menu].open').forEach(m => {
        m.classList.remove('open');
        m.parentElement.querySelector('[data-ct-toggle]')?.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // ESC -> dong
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('[data-ct-menu].open').forEach(m => {
      m.classList.remove('open');
      m.parentElement.querySelector('[data-ct-toggle]')?.setAttribute('aria-expanded', 'false');
    });
  });

  function init() {
    injectStyle();
    mountNavClose();
    const cached = (global.auth && auth.user()) || null;
    paint(cached);
    // Refresh tu BE de chac chan token con valid
    api.get('/auth/me', { silent: true })
      .then(({ user }) => {
        // Goi paint voi user moi nhat (co the da update profile o tab khac)
        paint(user);
        // Cap nhat luon localStorage de cac trang khac dung gia tri moi
        if (global.auth?.setSession) auth.setSession(api.getToken(), user);
      })
      .catch(err => {
        if (err.status === 401) {
          if (global.auth?.clearSession) auth.clearSession();
          paint(null);
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public: cho phep trang re-render sau khi update profile
  global.customerTopbar = { refresh: init, paint };
})(window);
