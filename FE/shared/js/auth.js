// Helper auth dung chung cho moi trang.
// Phu thuoc: /shared/js/api.js (window.api).
// Su dung:
//   auth.guard(['admin'])           // chan vao trang admin neu chua login
//   auth.user()                     // lay user object hien tai
//   auth.setSession(token, user)
//   auth.logout()
//   auth.toast('msg', 'ok'|'err')

(function (global) {
  const USER_KEY = 'gpsviet_user';

  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch (_) { return null; }
  }
  function setSession(token, user) {
    api.setToken(token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    try { sessionStorage.setItem('gpsviet_just_logged_in', '1'); } catch (_) {}
  }
  function clearSession() {
    api.clearToken();
    localStorage.removeItem(USER_KEY);
  }
  function isLoggedIn() { return !!api.getToken() && !!getUser(); }

  // Trang nao mo tieu thi role nao se vao? Dung de redirect sau login.
  // Dai ly va khach le dung chung cong /customer/ — phan biet bang role trong UI.
  function homeForRole(role) {
    switch (role) {
      case 'admin':    return '/admin/';
      case 'staff':    return '/admin/';   // nhan vien dung chung portal admin
      case 'kithuat':  return '/kithuat/';
      case 'daily':
      case 'customer':
      default:         return '/customer/';
    }
  }

  // Tien ich: kiem tra co phai admin chinh thuc khong (de an/disable nut admin-only).
  function isAdmin() {
    const u = getUser();
    return !!u && u.role === 'admin';
  }

  // Tra ve user neu da login va dung role; null neu chua login.
  // KHONG redirect — page cu render UI suon, API tu trigger ui.loginDialog
  // khi gap 401. Pattern toan he thong (xem MEMORY.md).
  function guard(allowedRoles) {
    if (!isLoggedIn()) return null;
    const u = getUser();
    if (allowedRoles && !allowedRoles.includes(u.role)) {
      // Login dung nhung sai role -> dua ve home cua role
      location.href = homeForRole(u.role);
      return null;
    }
    return u;
  }

  function logout() {
    clearSession();
    location.href = '/';
  }

  // Backward-compat: auth.toast(msg, 'ok'|'err') -> map sang ui.toast.
  // Code cu xai 'ok'/'err'; ui.toast xai 'success'/'error'.
  function toast(msg, kind) {
    const map = { ok: 'success', err: 'error' };
    if (global.ui && ui.toast) return ui.toast(msg, map[kind] || kind);
  }

  global.auth = {
    user: getUser,
    isLoggedIn,
    isAdmin,
    setSession,
    clearSession,
    homeForRole,
    guard,
    logout,
    toast,
  };
})(window);
