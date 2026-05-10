// Gio hang khach hang — luu trong localStorage, mo dialog xem + checkout.
//
// Cach dung:
//   - Trang san pham/chi tiet: dat o dau muon hien icon: <div data-cart-mount></div>
//   - Nut "+ Gio hang": <button data-cart-add data-product-id="..." data-code="..."
//                              data-name="..." data-image="..." data-price="...">
//   - Goi tu code: cart.add(product); cart.openDialog();
//
// Yeu cau: ui.js + api.js + auth.js da load truoc.

(function (global) {
  const KEY = 'gpsviet_cart';

  // ---- Storage ------------------------------------------------
  function getCart() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch (_) { return []; }
  }
  function saveCart(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    updateBadges();
    // Re-render dialog neu dang mo
    const m = document.getElementById('cartModal');
    if (m && m.classList.contains('open')) renderDialogBody();
  }

  function add(product, qty = 1) {
    qty = Math.max(1, Number(qty) || 1);
    const id = Number(product.id);
    if (!id) return;
    const items = getCart();
    const ex = items.find(i => i.product_id === id);
    if (ex) {
      ex.qty += qty;
    } else {
      items.push({
        product_id: id,
        code:        product.code || '',
        name:        product.name || '',
        image_url:   product.image_url || product.thumbnail_url || null,
        retail_price: Number(product.retail_price) || 0,
        qty,
      });
    }
    saveCart(items);
    if (global.ui) ui.toast(`Đã thêm "${product.name}" vào giỏ`, 'success');
  }
  function remove(productId) {
    saveCart(getCart().filter(i => i.product_id !== Number(productId)));
  }
  function updateQty(productId, qty) {
    qty = Math.max(1, Number(qty) || 1);
    const items = getCart();
    const it = items.find(i => i.product_id === Number(productId));
    if (it) { it.qty = qty; saveCart(items); }
  }
  function clearAll() { saveCart([]); }
  function count() { return getCart().reduce((s, i) => s + (i.qty || 0), 0); }
  function total() { return getCart().reduce((s, i) => s + (i.qty * (i.retail_price || 0)), 0); }

  // ---- Badge --------------------------------------------------
  function updateBadges() {
    const c = count();
    document.querySelectorAll('[data-cart-badge]').forEach(el => {
      el.textContent = c > 0 ? c : '';
      el.style.display = c > 0 ? 'inline-flex' : 'none';
    });
  }

  // ---- Auto-mount icon ---------------------------------------
  function mount() {
    document.querySelectorAll('[data-cart-mount]').forEach(el => {
      if (el.dataset.mounted) return;
      el.dataset.mounted = '1';
      el.innerHTML = `
        <button type="button" class="btn ghost sm" data-cart-open
          style="position:relative;display:inline-flex;align-items:center;gap:6px">
          <span>🛒</span><span>Giỏ hàng</span>
          <span data-cart-badge
            style="background:#dc2626;color:#fff;border-radius:999px;
              min-width:18px;height:18px;font-size:11px;display:none;
              align-items:center;justify-content:center;padding:0 5px;font-weight:700"></span>
        </button>`;
    });
    updateBadges();
  }

  // ---- Dialog: xem gio hang ----------------------------------
  function ensureDialog() {
    let m = document.getElementById('cartModal');
    if (m) return m;
    injectCartStyles();
    m = document.createElement('div');
    m.id = 'cartModal';
    m.className = 'modal-bg';
    m.innerHTML = `
      <div class="modal" style="max-width:760px">
        <div class="modal-head">
          <h3>🛒 Giỏ hàng của bạn <span id="cartTypesBadge" class="cart-types-badge"></span></h3>
          <button type="button" class="modal-close" data-cart-close aria-label="Đóng">×</button>
        </div>
        <div class="modal-body" id="cartBody"></div>
        <div class="modal-foot">
          <button class="btn ghost" data-cart-close>Tiếp tục mua</button>
          <button class="btn" id="cartCheckoutBtn" data-cart-checkout>Yêu cầu lắp đặt</button>
        </div>
      </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', (e) => { if (e.target.id === 'cartModal') closeDialog(); });
    return m;
  }

  function injectCartStyles() {
    if (document.getElementById('cartStyles')) return;
    const s = document.createElement('style');
    s.id = 'cartStyles';
    s.textContent = `
      #cartModal .modal-body{background:#f8fafc}
      .cart-list{display:flex;flex-direction:column;gap:8px}
      .cart-item{display:grid;grid-template-columns:56px 1fr auto;gap:14px;align-items:center;
        padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;
        transition:border-color .15s,box-shadow .15s}
      .cart-item:hover{border-color:#cbd5e1;box-shadow:0 1px 3px rgba(15,23,42,.06)}
      .cart-item__img{width:56px;height:56px;border-radius:10px;object-fit:cover;background:#f1f5f9;
        border:1px solid #e2e8f0}
      .cart-item__img--none{display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:22px}
      .cart-item__info{min-width:0}
      .cart-item__name{font-weight:600;font-size:14px;line-height:1.35;color:#0f172a;
        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .cart-item__code{color:#64748b;font-size:12px;margin-top:2px}
      .cart-item__price{font-size:12.5px;color:#64748b;margin-top:4px}
      .cart-item__ctrl{display:flex;flex-direction:column;align-items:flex-end;gap:8px}
      .cart-item__total{font-weight:700;color:#dc2626;font-size:15px;white-space:nowrap;line-height:1}
      .cart-stepper{display:inline-flex;align-items:center;border:1px solid #e2e8f0;border-radius:8px;
        background:#fff;overflow:hidden;height:30px}
      .cart-stepper__btn{width:28px;height:28px;border:0;background:#f8fafc;color:#475569;cursor:pointer;
        font-size:16px;font-weight:600;line-height:1;display:flex;align-items:center;justify-content:center;
        transition:background .12s}
      .cart-stepper__btn:hover{background:#e2e8f0;color:#0f172a}
      .cart-stepper__btn:disabled{opacity:.4;cursor:not-allowed}
      .cart-stepper__qty{width:36px;height:28px;border:0;text-align:center;font-size:13px;font-weight:600;
        background:#fff;outline:none;-moz-appearance:textfield}
      .cart-stepper__qty::-webkit-outer-spin-button,
      .cart-stepper__qty::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
      .cart-item__rm{width:28px;height:28px;border-radius:8px;border:1px solid transparent;
        background:transparent;color:#94a3b8;cursor:pointer;font-size:18px;line-height:1;
        display:inline-flex;align-items:center;justify-content:center;transition:all .12s}
      .cart-item__rm:hover{background:#fee2e2;color:#dc2626;border-color:#fecaca}
      .cart-types-badge{display:none;margin-left:6px;background:#dc2626;color:#fff;
        border-radius:999px;font-size:12px;font-weight:600;padding:2px 9px;vertical-align:middle}
      .cart-types-badge.show{display:inline-block}
      .cart-sum{display:flex;justify-content:space-between;align-items:center;
        padding:14px 16px;margin-top:12px;background:#fff;border:1px solid #e5e7eb;border-radius:12px}
      .cart-sum__label{font-size:14px;color:#475569;font-weight:500}
      .cart-sum__total{color:#dc2626;font-size:20px;font-weight:800;letter-spacing:-.01em}
      .cart-actions{display:flex;justify-content:flex-end;margin-top:10px}
      .cart-clear{background:none;border:0;color:#94a3b8;cursor:pointer;font-size:12.5px;
        padding:4px 8px;border-radius:6px;transition:all .12s}
      .cart-clear:hover{color:#dc2626;background:#fef2f2}
      .cart-empty{padding:48px 16px;text-align:center;color:#64748b}
      .cart-empty__icon{font-size:42px;opacity:.4;margin-bottom:10px}
      .cart-empty__title{font-size:15px;font-weight:600;color:#334155;margin-bottom:4px}
      .cart-empty__hint{font-size:13px;color:#94a3b8}
      @media (max-width:560px){
        .cart-item{grid-template-columns:48px 1fr;gap:10px;padding:10px 12px}
        .cart-item__img{width:48px;height:48px}
        .cart-item__ctrl{grid-column:1 / -1;flex-direction:row;align-items:center;
          width:100%;justify-content:space-between;
          padding-top:10px;margin-top:2px;border-top:1px dashed #e5e7eb}
        .cart-item__total{font-size:15px;order:2}
        .cart-stepper{order:1}
        .cart-item__rm{order:3}
        #cartModal .modal-body{padding:12px}
        #cartModal .modal-foot{padding:10px 12px}
        .cart-sum__total{font-size:18px}
      }`;
    document.head.appendChild(s);
  }
  function openDialog() {
    ensureDialog();
    renderDialogBody();
    const m = document.getElementById('cartModal');
    if (m.classList.contains('open')) return;
    m.classList.add('open');
    if (global.ui && ui.pushDialog) ui.pushDialog();
  }
  function closeDialog() {
    const m = document.getElementById('cartModal');
    if (!m || !m.classList.contains('open')) return;
    m.classList.remove('open');
    if (global.ui && ui.popDialog) ui.popDialog();
  }
  function renderDialogBody() {
    const fmt = new Intl.NumberFormat('vi-VN');
    const items = getCart();
    const body = document.getElementById('cartBody');
    if (!body) return;

    const badge = document.getElementById('cartTypesBadge');
    if (badge) {
      if (items.length > 0) {
        badge.textContent = items.length + ' sản phẩm';
        badge.classList.add('show');
      } else {
        badge.classList.remove('show');
      }
    }

    if (!items.length) {
      body.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty__icon">🛒</div>
          <div class="cart-empty__title">Giỏ hàng đang trống</div>
          <div class="cart-empty__hint">Thêm sản phẩm từ trang Sản phẩm để tiếp tục.</div>
        </div>`;
      const btn = document.getElementById('cartCheckoutBtn');
      if (btn) btn.disabled = true;
      return;
    }
    body.innerHTML = `
      <div class="cart-list">
        ${items.map(i => `
          <div class="cart-item">
            ${i.image_url
              ? `<img class="cart-item__img" src="${i.image_url}" onerror="this.outerHTML='<div class=&quot;cart-item__img cart-item__img--none&quot;>📦</div>'">`
              : `<div class="cart-item__img cart-item__img--none">📦</div>`}
            <div class="cart-item__info">
              <div class="cart-item__name">${escapeHtml(i.name)}</div>
              ${i.code ? `<div class="cart-item__code">Mã ${escapeHtml(i.code)}</div>` : ''}
              <div class="cart-item__price">${i.retail_price ? fmt.format(i.retail_price) + 'đ / sp' : '<span class="text-muted">Liên hệ</span>'}</div>
            </div>
            <div class="cart-item__ctrl">
              <span class="cart-item__total">${fmt.format(i.retail_price * i.qty)}đ</span>
              <div class="cart-stepper">
                <button type="button" class="cart-stepper__btn" data-cart-step="-1" data-cart-id="${i.product_id}" ${i.qty <= 1 ? 'disabled' : ''} aria-label="Giảm">−</button>
                <input type="number" min="1" value="${i.qty}"
                  data-cart-qty="${i.product_id}"
                  class="cart-stepper__qty">
                <button type="button" class="cart-stepper__btn" data-cart-step="1" data-cart-id="${i.product_id}" aria-label="Tăng">+</button>
              </div>
              <button type="button" class="cart-item__rm" data-cart-remove="${i.product_id}" aria-label="Xoá" title="Xoá">×</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="cart-sum">
        <span class="cart-sum__label">Tổng cộng</span>
        <span class="cart-sum__total">${fmt.format(total())}đ</span>
      </div>
      <div class="cart-actions">
        <button type="button" class="cart-clear" data-cart-clear>🗑 Xoá toàn bộ</button>
      </div>`;
    const btn = document.getElementById('cartCheckoutBtn');
    if (btn) btn.disabled = false;
  }

  // ---- Dialog: checkout (nhap dia chi + dat don) -------------
  function ensureCheckout() {
    let m = document.getElementById('checkoutModal');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'checkoutModal';
    m.className = 'modal-bg';
    m.innerHTML = `
      <div class="modal" style="max-width:560px">
        <div class="modal-head">
          <h3>Hoàn tất đơn hàng</h3>
          <button type="button" class="modal-close" data-cart-checkout-close aria-label="Đóng">×</button>
        </div>
        <form id="cartCheckoutForm" style="display:contents">
          <div class="modal-body">
            <div id="coGuestNote" class="hide" style="background:#eff6ff;padding:9px 11px;border-radius:8px;margin-bottom:12px;font-size:12.5px;color:#1e3a8a;line-height:1.5;border:1px solid #bfdbfe">
              💡 Chưa có tài khoản? Hệ thống sẽ <b>tự tạo</b> từ Họ tên + SĐT bạn nhập.
              &nbsp;<a href="javascript:void(0)" id="coLoginLink" style="color:#1d4ed8;font-weight:600">Đã có tài khoản? Đăng nhập</a>
            </div>

            <div id="coDealerNote" class="hide" style="background:#fef3c7;padding:9px 11px;border-radius:8px;margin-bottom:12px;font-size:12.5px;color:#78350f;line-height:1.5;border:1px solid #fde68a">
              🏢 Bạn đang đặt hộ <b>khách cuối</b>. Vui lòng nhập thông tin khách thực tế (tên + SĐT). Nếu SĐT chưa có tài khoản, hệ thống tự tạo khách lẻ.
            </div>

            <div class="field hide" id="coGuestNameField">
              <label id="coNameLabel">Họ tên *</label>
              <input id="co_full_name" class="input" placeholder="Nguyễn Văn A">
            </div>
            <div class="field">
              <label id="coPhoneLabel">Số điện thoại *</label>
              <input id="co_phone" class="input" inputmode="tel" placeholder="09xxxxxxxx">
            </div>
            <div class="field">
              <label>Địa chỉ lắp đặt *</label>
              <input id="co_address" class="input" placeholder="Số nhà, đường, phường/xã, quận/huyện">
            </div>
            <div class="field">
              <label>Ghi chú</label>
              <textarea id="co_note" class="textarea" placeholder="Nhập nội dung bạn muốn về đơn hàng"></textarea>
            </div>

            <div id="checkoutSummary" style="margin-top:6px"></div>
            <div style="background:#fffbeb;border:1px solid #fde68a;color:#92400e;padding:9px 11px;border-radius:8px;margin-top:10px;font-size:12.5px;line-height:1.5">
              ⚠ Số tiền trên chỉ là tiền sản phẩm, <b>chưa tính chi phí lắp đặt</b>. Nhân viên sẽ liên hệ báo giá trọn gói.
            </div>
          </div>
          <div class="modal-foot">
            <button type="button" class="btn ghost" data-cart-checkout-close>Quay lại</button>
            <button type="submit" class="btn" id="coSubmitBtn">Gửi yêu cầu</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', (e) => { if (e.target.id === 'checkoutModal') closeCheckout(); });
    document.getElementById('cartCheckoutForm').addEventListener('submit', submitOrder);
    return m;
  }

  // 2 truong hop:
  //   - Login (customer hoac daily): an o "Ho ten" + banner guest, prefill SDT/dia chi cua minh.
  //   - Guest: hien banner + o "Ho ten" de tu tao tai khoan.
  // Tu 2026-04: dai ly hanh xu nhu khach hang — KHONG con dat ho khach cuoi.
  function applyAuthState() {
    const u = global.auth ? auth.user() : null;
    const isLoggedIn = !!(u && (u.role === 'customer' || u.role === 'daily'));
    const isGuest    = !isLoggedIn;

    document.getElementById('coGuestNote').classList.toggle('hide', !isGuest);
    const dealerNote = document.getElementById('coDealerNote');
    if (dealerNote) dealerNote.classList.add('hide');
    // O ten chi an khi da login (BE lay tu session).
    document.getElementById('coGuestNameField').classList.toggle('hide', isLoggedIn);

    const nameLabel  = document.getElementById('coNameLabel');
    const phoneLabel = document.getElementById('coPhoneLabel');
    const nameInput  = document.getElementById('co_full_name');
    const phoneInput = document.getElementById('co_phone');
    const addrInput  = document.getElementById('co_address');

    nameLabel.textContent  = 'Họ tên *';
    phoneLabel.textContent = 'Số điện thoại *';
    if (nameInput)  nameInput.placeholder  = 'Nguyễn Văn A';
    if (phoneInput) phoneInput.placeholder = '09xxxxxxxx';

    if (isLoggedIn) {
      if (phoneInput && !phoneInput.value && u.phone)   phoneInput.value = u.phone;
      if (addrInput  && !addrInput.value  && u.address) addrInput.value  = u.address;
    }
  }

  function openCheckout() {
    const items = getCart();
    if (!items.length) return;

    ensureCheckout();
    applyAuthState();

    // Login link trong guest note: dong checkout, mo loginDialog.
    // Khach login xong tu mo lai gio hang.
    const link = document.getElementById('coLoginLink');
    if (link) link.onclick = () => {
      closeCheckout();
      if (global.ui) ui.loginDialog();
    };

    const fmt = new Intl.NumberFormat('vi-VN');
    document.getElementById('checkoutSummary').innerHTML = `
      <div style="background:#f1f5f9;padding:10px 12px;border-radius:8px;margin-bottom:14px;font-size:13px">
        <div><b>${items.length}</b> sản phẩm — Tổng: <b style="color:#dc2626">${fmt.format(total())}đ</b></div>
        <small class="text-muted">${items.map(i => `${i.qty}× ${escapeHtml(i.name)}`).join(' · ')}</small>
      </div>`;
    closeDialog();
    const m = document.getElementById('checkoutModal');
    if (m.classList.contains('open')) return;
    m.classList.add('open');
    if (global.ui && ui.pushDialog) ui.pushDialog();
  }
  function closeCheckout() {
    const m = document.getElementById('checkoutModal');
    if (!m || !m.classList.contains('open')) return;
    m.classList.remove('open');
    if (global.ui && ui.popDialog) ui.popDialog();
  }

  async function submitOrder(e) {
    e.preventDefault();
    const items = getCart().map(i => ({ product_id: i.product_id, qty: i.qty }));
    if (!items.length) return;

    const u = global.auth ? auth.user() : null;
    const isLoggedIn = !!(u && (u.role === 'customer' || u.role === 'daily'));

    const phoneVal   = document.getElementById('co_phone').value.trim();
    const addressVal = document.getElementById('co_address').value.trim();
    const noteVal    = document.getElementById('co_note').value.trim();
    const nameVal    = document.getElementById('co_full_name').value.trim();

    // template_id = 1 (Lắp đặt — seed mặc định ở mig 045).
    // FE cart đặt đơn install nhanh, admin có thể đổi template trong chi tiết đơn.
    const common = {
      template_id:  1,
      address:      addressVal || null,
      phone:        phoneVal || null,
      note:         noteVal || null,
      items,
    };

    if (!addressVal) return ui.toast('Vui lòng nhập địa chỉ lắp đặt', 'warning');
    if (phoneVal.replace(/\D/g, '').length < 9) {
      return ui.toast('Số điện thoại không hợp lệ', 'warning');
    }

    const submitBtn = document.getElementById('coSubmitBtn');
    submitBtn.disabled = true;

    // Khach chua login -> tu tao tai khoan tu Ho ten + SDT (+ dia chi sau cung).
    // BE tra 409 neu SDT da co tai khoan -> hoi khach co muon dang nhap khong.
    if (!isLoggedIn) {
      const fullName = nameVal;
      const phoneIn  = phoneVal;
      if (!fullName) {
        submitBtn.disabled = false;
        return ui.toast('Vui lòng nhập họ tên', 'warning');
      }

      let reg;
      try {
        reg = await api.post('/auth/quick-register-customer', {
          full_name: fullName,
          phone:     phoneIn,
          address:   common.address,
          exclusive: true,
        }, { silent: true });
      } catch (err) {
        submitBtn.disabled = false;
        if (err.status === 409) {
          // SDT da co tai khoan -> hoi khach dang nhap
          const yes = global.ui && ui.confirm
            ? await ui.confirm({
                title: 'Số điện thoại đã có tài khoản',
                message: 'Số điện thoại bạn nhập đã được đăng ký. Bạn có muốn đăng nhập để tiếp tục gửi yêu cầu?',
                type: 'warning',
                okText: 'Đăng nhập',
                cancelText: 'Đổi số khác',
              })
            : false;
          if (yes) {
            closeCheckout();
            if (global.ui && ui.loginDialog) ui.loginDialog();
          }
          return;
        }
        ui.toast(err.message || 'Không tạo được tài khoản', 'error');
        return;
      }
      auth.setSession(reg.token, reg.user);
    }

    // Da co session customer (tu hoac vua tao) -> dat don
    const ok = await api.post('/customer/orders', common, {
      successMessage: 'Đã gửi yêu cầu lắp đặt — xem ở "Đơn của tôi"',
      loading: true,
    }).catch(() => null);
    submitBtn.disabled = false;
    if (!ok) return;

    clearAll();
    closeCheckout();
    setTimeout(() => { location.href = '/customer/orders.html'; }, 600);
  }

  // ---- Util ---------------------------------------------------
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  // ---- Global click delegation -------------------------------
  document.addEventListener('click', (e) => {
    // Mo dialog
    if (e.target.closest('[data-cart-open]')) {
      e.preventDefault();
      openDialog();
      return;
    }
    // Dong dialog gio hang
    if (e.target.closest('[data-cart-close]')) {
      closeDialog();
      return;
    }
    // Dong dialog checkout
    if (e.target.closest('[data-cart-checkout-close]')) {
      closeCheckout();
      return;
    }
    // Sang checkout
    if (e.target.closest('[data-cart-checkout]')) {
      openCheckout();
      return;
    }
    // Xoa 1 item
    const removeBtn = e.target.closest('[data-cart-remove]');
    if (removeBtn) {
      remove(removeBtn.dataset.cartRemove);
      return;
    }
    // Stepper +/-
    const stepBtn = e.target.closest('[data-cart-step]');
    if (stepBtn) {
      const id = Number(stepBtn.dataset.cartId);
      const delta = Number(stepBtn.dataset.cartStep);
      const cur = getCart().find(i => i.product_id === id);
      if (cur) updateQty(id, (cur.qty || 1) + delta);
      return;
    }
    // Xoa het
    if (e.target.closest('[data-cart-clear]')) {
      clearAll();
      return;
    }
    // Them vao gio
    const addBtn = e.target.closest('[data-cart-add]');
    if (addBtn) {
      e.preventDefault();
      e.stopPropagation();
      add({
        id:           Number(addBtn.dataset.productId),
        code:         addBtn.dataset.code,
        name:         addBtn.dataset.name,
        image_url:    addBtn.dataset.image || null,
        retail_price: Number(addBtn.dataset.price) || 0,
      }, Number(addBtn.dataset.qty) || 1);
      return;
    }
  });

  // Cap nhat qty (event change tren input)
  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-cart-qty]')) {
      updateQty(e.target.dataset.cartQty, e.target.value);
    }
  });

  // ---- Public API --------------------------------------------
  global.cart = {
    add, remove, updateQty, clear: clearAll,
    count, total,
    openDialog, closeDialog, openCheckout, closeCheckout,
    mount,
  };

  // Auto-mount + badge update on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})(window);
