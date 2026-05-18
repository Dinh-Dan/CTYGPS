// Logic trang admin/settings — cau hinh 5 QR, moi QR co tai khoan ngan hang rieng
// Lưu vao app_settings qua /api/admin/settings/bulk

(function () {
  const $ = (id) => document.getElementById(id);
  const escape = (s) => String(s == null ? '' : s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

  const SLOTS = [1, 2, 3, 4, 5];

  const state = {
    settings: {},
    edits: {},
    defaultSlot: 1,
  };

  function get(key) {
    return state.edits[key] != null ? state.edits[key] : (state.settings[key] || '');
  }
  function set(key, val) {
    state.edits[key] = val == null ? '' : String(val);
  }

  function renderQr() {
    const row = $('qrRow');
    const def = state.defaultSlot;
    row.innerHTML = SLOTS.map(i => {
      const url       = get(`qr.slot${i}.image_url`);
      const label     = get(`qr.slot${i}.label`);
      const bankName  = get(`qr.slot${i}.bank_name`);
      const accountNo = get(`qr.slot${i}.account_no`);
      const accOwner  = get(`qr.slot${i}.account_name`);
      const isDefault = def === i;
      return `<div class="qr-slot ${isDefault ? 'is-default' : ''}" data-slot="${i}">
        <div class="qr-img-wrap">
          ${url ? `<img src="${escape(url)}" alt="">` : '<span class="empty-text">Chưa có ảnh</span>'}
        </div>
        <div class="qr-field">
          <label>Nhãn</label>
          <input data-key="qr.slot${i}.label" value="${escape(label)}" placeholder="VD: Vietcombank cá nhân">
        </div>
        <div class="qr-field">
          <label>Tên ngân hàng</label>
          <input data-key="qr.slot${i}.bank_name" value="${escape(bankName)}" placeholder="VD: Vietcombank">
        </div>
        <div class="qr-field">
          <label>Số tài khoản</label>
          <input data-key="qr.slot${i}.account_no" value="${escape(accountNo)}" placeholder="VD: 0123456789">
        </div>
        <div class="qr-field">
          <label>Chủ tài khoản</label>
          <input data-key="qr.slot${i}.account_name" value="${escape(accOwner)}" placeholder="VD: NGUYEN VAN A">
        </div>
        <div class="qr-actions">
          <label class="btn ghost sm" style="cursor:pointer;text-align:center">
            📤 Tải lên
            <input type="file" accept="image/*" data-upload="${i}" style="display:none">
          </label>
          ${url ? `<button type="button" class="btn ghost sm" data-clear="${i}">🗑</button>` : ''}
        </div>
        <label class="qr-default-label">
          <input type="radio" name="defaultSlot" data-default="${i}" ${isDefault ? 'checked' : ''}>
          Mặc định
        </label>
      </div>`;
    }).join('');
  }

  async function loadSettings() {
    const r = await api.get('/admin/settings', { silent: true }).catch(() => null);
    if (!r) return;
    state.settings = r;
    state.edits = {};
    state.defaultSlot = Math.max(1, Math.min(5, Number(r['bank.default_qr_slot']) || 1));
    renderQr();
  }

  // ==== EVENTS =================================================
  document.body.addEventListener('change', async (e) => {
    // Upload file -> imgbb
    const upBtn = e.target.matches('input[type="file"][data-upload]') ? e.target : null;
    if (upBtn) {
      const slot = Number(upBtn.dataset.upload);
      const file = upBtn.files[0];
      if (!file) return;
      try {
        ui.loading(true);
        const url = await imgbb.upload(file, { name: `qr-slot-${slot}` });
        set(`qr.slot${slot}.image_url`, url);
        renderQr();
      } catch (err) {
        ui.toast('Lỗi upload: ' + err.message, 'error');
      } finally {
        ui.loading(false);
      }
      upBtn.value = '';
      return;
    }
    // Default slot radio
    const radio = e.target.matches('input[type="radio"][data-default]') ? e.target : null;
    if (radio) {
      state.defaultSlot = Number(radio.dataset.default);
      set('bank.default_qr_slot', String(state.defaultSlot));
      renderQr();
      return;
    }
  });

  document.body.addEventListener('input', (e) => {
    const inp = e.target.matches('input[data-key]') ? e.target : null;
    if (inp) set(inp.dataset.key, inp.value);
  });

  document.body.addEventListener('click', (e) => {
    const clearBtn = e.target.closest('button[data-clear]');
    if (clearBtn) {
      const slot = Number(clearBtn.dataset.clear);
      set(`qr.slot${slot}.image_url`, '');
      renderQr();
    }
  });

  $('btnReset').onclick = () => loadSettings();

  $('btnSave').onclick = async () => {
    if (!('bank.default_qr_slot' in state.edits)) {
      state.edits['bank.default_qr_slot'] = String(state.defaultSlot);
    }
    const items = Object.entries(state.edits).map(([key, value]) => ({ key, value }));
    if (!items.length) return ui.toast('Không có thay đổi', 'info');
    $('btnSave').disabled = true;
    try {
      const r = await api.put('/admin/settings/bulk', { items },
        { loading: true, successMessage: 'Đã lưu cài đặt' }).catch(() => null);
      if (r) await loadSettings();
    } finally {
      $('btnSave').disabled = false;
    }
  };

  // ==== INIT ===================================================
  const _u = (window.auth && auth.user && auth.user()) || null;
  if (_u && _u.role && _u.role !== 'admin') {
    if (window.ui && ui.toast) ui.toast('Chi admin moi truy cap duoc Cai dat', 'error');
    location.href = '/admin/';
    return;
  }
  adminShell.init('settings');
  loadSettings();
})();
