// ===== API client tap trung =====
// Moi call API trong he thong di qua `api.request()`. Hau het loi se duoc
// xu ly UI tu dong (toast / dialog / login-required), code goi chi can
// quan tam ket qua. Khi can hanh vi dac biet thi truyen options.
//
// Cach dung pho bien:
//   await api.post('/admin/customers', data, {
//     successMessage: 'Da tao khach hang',         // toast xanh khi 2xx
//     errorMessages:  { 409: 'Ma da ton tai' },    // override message theo status
//   });
//
//   const stats = await api.get('/admin/stats', { silent: true });   // ko show UI tu dong
//   const list  = await api.get('/admin/customers', { loading: true }); // hien overlay khi cho
//
// Yeu cau: ui.js phai duoc load truoc.

(function (global) {
  const BASE = '/api';
  const TOKEN_KEY = 'gpsviet_token';

  // Path bat dau bang chuoi nay -> KHONG tu dong xu ly 401 (login form xu ly tay)
  const AUTH_LOGIN_PREFIX = '/auth/login';

  function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
  function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); }

  // ---- Default error mapping ---------------------------------
  // Tra ve mo ta hanh vi UI cho 1 status code.
  function defaultUiFor(status, fallbackMsg) {
    if (status === 0) {
      return { kind: 'dialog', type: 'error',
        title: 'Mất kết nối', message: 'Không thể kết nối tới máy chủ. Kiểm tra mạng và thử lại.' };
    }
    if (status === 400 || status === 422) {
      return { kind: 'toast', type: 'warning', message: fallbackMsg || 'Dữ liệu không hợp lệ' };
    }
    if (status === 401) {
      return { kind: 'login' };
    }
    if (status === 403) {
      return { kind: 'dialog', type: 'error',
        title: 'Không có quyền', message: fallbackMsg || 'Bạn không có quyền thực hiện thao tác này.' };
    }
    if (status === 404) {
      return { kind: 'toast', type: 'info', message: fallbackMsg || 'Không tìm thấy dữ liệu' };
    }
    if (status === 409) {
      return { kind: 'toast', type: 'warning', message: fallbackMsg || 'Dữ liệu đã tồn tại / xung đột' };
    }
    if (status === 413) {
      return { kind: 'toast', type: 'warning', message: fallbackMsg || 'Tệp tải lên quá lớn' };
    }
    if (status >= 500) {
      return { kind: 'dialog', type: 'error',
        title: 'Lỗi hệ thống', message: fallbackMsg || 'Máy chủ gặp sự cố. Vui lòng thử lại sau.' };
    }
    // Default: toast loi
    return { kind: 'toast', type: 'error', message: fallbackMsg || ('Lỗi ' + status) };
  }

  function applyOverride(opts, status) {
    if (!opts || !opts.errorMessages) return null;
    return opts.errorMessages[status] || null;
  }

  // ---- request() ---------------------------------------------
  async function request(method, path, body, opts) {
    opts = opts || {};
    const isLoginCall = path.startsWith(AUTH_LOGIN_PREFIX);

    if (opts.loading) ui.loading(true);

    let res, data = null, networkErr = null;
    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = getToken();
      if (token) headers['Authorization'] = 'Bearer ' + token;

      res = await fetch(BASE + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      try { data = await res.json(); } catch (_) {}
    } catch (err) {
      networkErr = err;
    } finally {
      if (opts.loading) ui.loading(false);
    }

    // ---- Network error ---------------------------------------
    if (networkErr) {
      if (!opts.silent) {
        const m = applyOverride(opts, 0);
        const ui_ = defaultUiFor(0, m);
        showUi(ui_);
      }
      const e = new Error(networkErr.message || 'Network error');
      e.status = 0;
      throw e;
    }

    // ---- HTTP error ------------------------------------------
    if (!res.ok) {
      const status = res.status;
      const serverMsg = (data && data.error) || null;
      const overrideMsg = applyOverride(opts, status);
      const finalMsg = overrideMsg || serverMsg;

      if (!opts.silent) {
        // 401 trong login form -> de form tu hien toast (no chua co session)
        if (status === 401 && isLoginCall) {
          ui.toast(finalMsg || 'Sai thông tin đăng nhập', 'error');
        } else {
          const ui_ = defaultUiFor(status, finalMsg);
          showUi(ui_);
        }
      }

      const e = new Error(finalMsg || ('HTTP ' + status));
      e.status = status;
      e.data = data;
      throw e;
    }

    // ---- Success ---------------------------------------------
    if (opts.successMessage && !opts.silent) {
      ui.toast(opts.successMessage, 'success');
    }
    return data;
  }

  function showUi(spec) {
    if (!spec || !global.ui) return;
    if (spec.kind === 'toast')   return ui.toast(spec.message, spec.type);
    if (spec.kind === 'dialog')  return ui.alert({ title: spec.title, message: spec.message, type: spec.type });
    if (spec.kind === 'login')   return ui.loginDialog();
  }

  // ---- Shortcut methods --------------------------------------
  // Cu phap:
  //   api.get(path, opts?)
  //   api.post(path, body?, opts?)
  //   api.put(path, body?, opts?)
  //   api.patch(path, body?, opts?)
  //   api.delete(path, opts?)
  global.api = {
    request,
    get:    (path, opts)        => request('GET',    path, null, opts),
    post:   (path, body, opts)  => request('POST',   path, body, opts),
    put:    (path, body, opts)  => request('PUT',    path, body, opts),
    patch:  (path, body, opts)  => request('PATCH',  path, body, opts),
    delete: (path, opts)        => request('DELETE', path, null, opts),
    getToken, setToken, clearToken,
  };
})(window);
