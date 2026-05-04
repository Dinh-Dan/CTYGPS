// UI primitives dung chung cho toan he thong:
//   ui.toast(msg, type)                        -> toast goc tren-phai
//   ui.alert({ title, message, type })         -> Promise (1 nut OK)
//   ui.confirm({ title, message, type })       -> Promise<boolean> (OK/Cancel)
//   ui.loading(true/false)                     -> bat/tat loading overlay
//   ui.loginRequired(reason)                   -> dialog yeu cau dang nhap
//
// type: 'success' | 'error' | 'warning' | 'info'
//
// Yeu cau: style trong /shared/css/style.css co cac class .toast, .ui-dialog,
// .ui-loading da duoc them.

(function (global) {
  // ---- Toast ------------------------------------------------
  function toast(msg, type) {
    if (!msg) return;
    const el = document.createElement('div');
    const cls = type === 'success' ? 'ok'
              : type === 'error'   ? 'err'
              : type === 'warning' ? 'warn'
              : '';
    el.className = 'toast' + (cls ? ' ' + cls : '');
    el.textContent = String(msg);
    ensureContainer().appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 250); }, 2800);
  }
  function ensureContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      c.className = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  // ---- Event bus + dialog stack -----------------------------
  // Cac component (chat FAB, sticky banner...) subscribe 'dialog:count'
  // de tu an khi co modal mo, tranh che button.
  const _listeners = {};
  const bus = {
    on(ev, fn)  { (_listeners[ev] = _listeners[ev] || []).push(fn); return () => bus.off(ev, fn); },
    off(ev, fn) { _listeners[ev] = (_listeners[ev] || []).filter(f => f !== fn); },
    emit(ev, data) { (_listeners[ev] || []).slice().forEach(fn => { try { fn(data); } catch (_) {} }); },
  };

  let _dialogCount = 0;
  function pushDialog() {
    _dialogCount++;
    bus.emit('dialog:open', _dialogCount);
    bus.emit('dialog:count', _dialogCount);
  }
  function popDialog() {
    _dialogCount = Math.max(0, _dialogCount - 1);
    bus.emit('dialog:close', _dialogCount);
    bus.emit('dialog:count', _dialogCount);
  }
  function dialogCount() { return _dialogCount; }

  // ---- Generic dialog (alert / confirm) ---------------------
  // Layout: head (title + close) dinh, body cuon, footer (actions) dinh.
  function showDialog({ title, message, type, okText, cancelText, allowCancel }) {
    return new Promise((resolve) => {
      const bg = document.createElement('div');
      bg.className = 'ui-dialog-bg';
      bg.innerHTML = `
        <div class="ui-dialog ui-dialog-${type || 'info'}">
          <div class="ui-dialog-head">
            <h3 class="ui-dialog-title">${escapeHtml(title || 'Thông báo')}</h3>
            <button class="modal-close" data-act="${allowCancel ? 'cancel' : 'ok'}" aria-label="Đóng">×</button>
          </div>
          <div class="ui-dialog-body">
            <div class="ui-dialog-msg">${escapeHtml(message || '')}</div>
          </div>
          <div class="ui-dialog-actions">
            ${allowCancel ? `<button class="btn ghost" data-act="cancel">${escapeHtml(cancelText || 'Huỷ')}</button>` : ''}
            <button class="btn ${type === 'error' ? 'danger' : ''}" data-act="ok">${escapeHtml(okText || 'OK')}</button>
          </div>
        </div>`;
      document.body.appendChild(bg);
      pushDialog();
      setTimeout(() => {
        const okBtn = bg.querySelector('button[data-act="ok"]');
        if (okBtn) okBtn.focus();
      }, 0);

      function close(result) {
        bg.remove();
        popDialog();
        document.removeEventListener('keydown', onKey);
        resolve(result);
      }
      function onKey(e) {
        if (e.key === 'Escape' && allowCancel) close(false);
        if (e.key === 'Enter')  close(true);
      }

      bg.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-act]');
        if (!btn) {
          if (e.target === bg && allowCancel) close(false);
          return;
        }
        close(btn.dataset.act === 'ok');
      });
      document.addEventListener('keydown', onKey);
    });
  }

  function alertDialog({ title, message, type, okText } = {}) {
    return showDialog({ title, message, type, okText, allowCancel: false });
  }
  function confirmDialog({ title, message, type, okText, cancelText } = {}) {
    return showDialog({ title, message, type, okText, cancelText, allowCancel: true });
  }

  // ---- Loading overlay --------------------------------------
  let loadingCount = 0;
  function loading(on) {
    if (on) {
      loadingCount++;
      let el = document.getElementById('ui-loading');
      if (!el) {
        el = document.createElement('div');
        el.id = 'ui-loading';
        el.className = 'ui-loading';
        el.innerHTML = '<div class="ui-spinner"></div>';
        document.body.appendChild(el);
      }
    } else {
      loadingCount = Math.max(0, loadingCount - 1);
      if (loadingCount === 0) {
        const el = document.getElementById('ui-loading');
        if (el) el.remove();
      }
    }
  }

  // ---- Login dialog (inline) --------------------------------
  // Goi tu api.js khi gap 401 (KHONG phai call /auth/login-*).
  // Form login SCOPED THEO CONG hien tai — moi cong chi cho doi tuong cua minh:
  //   /admin/*    -> 1 form: staff (Quan tri)
  //   /kithuat/*  -> 1 form: kithuat (Ky thuat)
  //   con lai     -> 2 tab:  retail (Khach le) + dealer (Dai ly)
  // Login xong redirect ve home cua role neu khac portal.
  let loginDialogShown = false;
  function loginDialog() {
    if (loginDialogShown) return;        // tranh chong dialog khi nhieu API cung 401
    loginDialogShown = true;

    // Xoa session cu (token het han) de tranh loop
    try {
      localStorage.removeItem('gpsviet_token');
      localStorage.removeItem('gpsviet_user');
    } catch (_) {}

    // Xac dinh cac kind cho phep theo cong (path) hien tai
    const path = location.pathname;
    let allowedKinds, dialogTitle;
    if (path.startsWith('/admin')) {
      allowedKinds = ['staff'];
      dialogTitle = 'Đăng nhập quản trị';
    } else if (path.startsWith('/kithuat')) {
      allowedKinds = ['kithuat'];
      dialogTitle = 'Đăng nhập kỹ thuật';
    } else {
      // /customer/*, /, /login.html — cong khach hang dung chung cho khach le va dai ly
      allowedKinds = ['retail', 'dealer'];
      dialogTitle = 'Đăng nhập';
    }
    const initial = allowedKinds[0];

    function closeDialog() {
      bg.remove();
      loginDialogShown = false;
      popDialog();
      document.removeEventListener('keydown', onKeyDown);
    }
    function onKeyDown(e) { if (e.key === 'Escape') closeDialog(); }

    const bg = document.createElement('div');
    bg.className = 'ui-dialog-bg';
    bg.innerHTML = `
      <div class="ui-dialog" style="max-width:440px">
        <div class="ui-dialog-head">
          <h3 class="ui-dialog-title">${dialogTitle}</h3>
          <button type="button" class="modal-close" id="lgClose" aria-label="Đóng">×</button>
        </div>
        <div class="ui-dialog-body">
          <p class="text-muted mb-2" style="font-size:13px">
            Phiên đăng nhập đã hết hoặc bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.
          </p>
          <div class="tabs" id="lgTabs">
            <button data-kind="retail">👤 Khách lẻ</button>
            <button data-kind="dealer">🏪 Đại lý</button>
            <button data-kind="staff">📊 Quản trị</button>
            <button data-kind="kithuat">🔧 Kỹ thuật</button>
          </div>
          <div id="lg-retail" class="lg-form">
            <div class="field"><label>Số điện thoại</label>
              <input id="lg-r-phone" class="input" placeholder="09xx xxx xxx" autocomplete="tel"></div>
          </div>
          <div id="lg-dealer" class="lg-form hide">
            <div class="field"><label>Mã đại lý</label>
              <input id="lg-d-code" class="input" placeholder="VD: DL001" autocomplete="username"></div>
            <div class="field"><label>Mật khẩu</label>
              <input id="lg-d-pw" type="password" class="input" autocomplete="current-password"></div>
          </div>
          <div id="lg-staff" class="lg-form hide">
            <div class="field"><label>Tên đăng nhập</label>
              <input id="lg-s-user" class="input" autocomplete="username"></div>
            <div class="field"><label>Mật khẩu</label>
              <input id="lg-s-pw" type="password" class="input" autocomplete="current-password"></div>
          </div>
          <div id="lg-kithuat" class="lg-form hide">
            <div class="field"><label>Tên đăng nhập</label>
              <input id="lg-k-user" class="input" autocomplete="username"></div>
            <div class="field"><label>Mật khẩu</label>
              <input id="lg-k-pw" type="password" class="input" autocomplete="current-password"></div>
          </div>
        </div>
        <div class="ui-dialog-actions">
          <button type="button" class="btn ghost" id="lgSkip">Bỏ qua</button>
          <button class="btn" id="lgSubmit">Đăng nhập</button>
        </div>
      </div>`;
    document.body.appendChild(bg);
    pushDialog();

    // An cac tab + form khong thuoc cong nay (vd cong admin chi co tab staff)
    bg.querySelectorAll('#lgTabs button').forEach(b => {
      if (!allowedKinds.includes(b.dataset.kind)) b.style.display = 'none';
    });
    ['retail', 'dealer', 'staff', 'kithuat'].forEach(k => {
      if (!allowedKinds.includes(k)) bg.querySelector('#lg-' + k).style.display = 'none';
    });
    // Neu chi 1 doi tuong cho cong nay -> an luon thanh tab
    if (allowedKinds.length === 1) {
      bg.querySelector('#lgTabs').style.display = 'none';
    }

    // Dong dialog: nut X, nut Bo qua, Esc, click ra ngoai backdrop
    bg.querySelector('#lgClose').onclick = closeDialog;
    bg.querySelector('#lgSkip').onclick  = closeDialog;
    bg.addEventListener('click', (e) => { if (e.target === bg) closeDialog(); });
    document.addEventListener('keydown', onKeyDown);

    let kind = initial;
    function selectTab(k) {
      kind = k;
      bg.querySelectorAll('#lgTabs button').forEach(b =>
        b.classList.toggle('active', b.dataset.kind === k));
      bg.querySelectorAll('.lg-form').forEach(f => f.classList.add('hide'));
      bg.querySelector('#lg-' + k).classList.remove('hide');
      // Auto focus
      setTimeout(() => {
        const first = bg.querySelector('#lg-' + k + ' input');
        if (first) first.focus();
      }, 0);
    }
    selectTab(initial);

    bg.querySelectorAll('#lgTabs button').forEach(b => {
      b.onclick = () => selectTab(b.dataset.kind);
    });

    async function submit() {
      const submitBtn = bg.querySelector('#lgSubmit');
      submitBtn.disabled = true;
      try {
        let path, body;
        if (kind === 'retail') {
          const phone = bg.querySelector('#lg-r-phone').value.trim();
          if (!phone) return toast('Vui lòng nhập số điện thoại', 'warning');
          path = '/auth/login-customer'; body = { phone };
        } else if (kind === 'dealer') {
          const code = bg.querySelector('#lg-d-code').value.trim();
          const password = bg.querySelector('#lg-d-pw').value;
          if (!code || !password) return toast('Nhập đủ mã và mật khẩu', 'warning');
          path = '/auth/login-dealer'; body = { code, password };
        } else if (kind === 'kithuat') {
          // KTV va admin cung dung /auth/login-staff (BE phan biet bang cot 'role').
          const username = bg.querySelector('#lg-k-user').value.trim();
          const password = bg.querySelector('#lg-k-pw').value;
          if (!username || !password) return toast('Nhập đủ tài khoản và mật khẩu', 'warning');
          path = '/auth/login-staff'; body = { username, password };
        } else {
          const username = bg.querySelector('#lg-s-user').value.trim();
          const password = bg.querySelector('#lg-s-pw').value;
          if (!username || !password) return toast('Nhập đủ tài khoản và mật khẩu', 'warning');
          path = '/auth/login-staff'; body = { username, password };
        }

        // api.post se tu hien toast neu sai mat khau (path /auth/login-*)
        const res = await api.post(path, body, { loading: true }).catch(() => null);
        if (!res) return;

        // Luu session. Neu role khong khop cong hien tai -> redirect ve home;
        // ngoai ra reload de fresh state.
        api.setToken(res.token);
        localStorage.setItem('gpsviet_user', JSON.stringify(res.user));
        toast('Đăng nhập thành công', 'success');

        const home = (global.auth && auth.homeForRole)
          ? auth.homeForRole(res.user.role) : '/';
        const onCorrectPortal = location.pathname.startsWith(home);
        setTimeout(() => {
          if (onCorrectPortal) location.reload();
          else location.href = home;
        }, 400);
      } finally {
        submitBtn.disabled = false;
      }
    }
    bg.querySelector('#lgSubmit').onclick = submit;
    bg.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  }

  // ---- Util -------------------------------------------------
  function escapeHtml(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  }

  global.ui = {
    toast,
    alert:   alertDialog,
    confirm: confirmDialog,
    loading,
    loginDialog,
    bus,
    pushDialog, popDialog, dialogCount,
  };
})(window);
