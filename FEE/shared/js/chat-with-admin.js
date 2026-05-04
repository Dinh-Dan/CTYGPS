// Widget "Chat voi CSKH" cho khach le va dai ly.
// Auto-mount: chen 1 floating button + dialog vao body.
// Yeu cau login (customer hoac daily) — bam khi chua login se mo loginDialog.
//
// Su dung: chi can <script src="/shared/js/chat-with-admin.js"> trong page.

(function (global) {
  let convId = null;
  let messages = [];
  let opened = false;
  let socketConnected = false;

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }
  function fmtTime(ts) {
    if (!ts) return '';
    const d = new Date(String(ts).replace(' ', 'T'));
    if (isNaN(d)) return '';
    return d.toLocaleString('vi-VN', { dateStyle:'short', timeStyle:'short' });
  }

  function injectStyle() {
    if (document.getElementById('chat-admin-style')) return;
    const s = document.createElement('style');
    s.id = 'chat-admin-style';
    s.textContent = `
      .chat-fab{
        position:fixed;bottom:20px;right:20px;z-index:9000;
        background:#2563eb;color:#fff;border:none;border-radius:50%;
        width:56px;height:56px;font-size:24px;cursor:pointer;
        box-shadow:0 6px 18px rgba(37,99,235,.45);
        display:flex;align-items:center;justify-content:center;
        transition:transform .12s ease;
      }
      .chat-fab:hover{ transform:scale(1.06); }

      .chat-pop-bg{
        position:fixed;inset:0;background:rgba(15,23,42,.4);z-index:9100;
        display:none;align-items:flex-end;justify-content:flex-end;padding:20px;
      }
      .chat-pop-bg.open{ display:flex; }

      .chat-pop{
        background:#fff;border-radius:14px;width:380px;max-width:100%;
        height:560px;max-height:90vh;display:flex;flex-direction:column;
        box-shadow:0 12px 40px rgba(15,23,42,.25);overflow:hidden;
      }
      .chat-pop .head{
        background:linear-gradient(135deg,#1e40af,#2563eb);color:#fff;
        padding:14px 16px;display:flex;align-items:center;gap:10px;
      }
      .chat-pop .head .title{ font-weight:700;font-size:15px;flex:1; }
      .chat-pop .head .sub{ font-size:11.5px;opacity:.85; }
      .chat-pop .head button{
        background:transparent;color:#fff;border:none;font-size:22px;
        cursor:pointer;line-height:1;padding:0;
      }

      .chat-pop .body{
        flex:1;overflow-y:auto;padding:14px;background:#f8fafc;
        display:flex;flex-direction:column;gap:6px;
      }
      .chat-pop .msg{
        max-width:80%;padding:8px 12px;border-radius:14px;font-size:13.5px;
        word-wrap:break-word;line-height:1.4;
      }
      .chat-pop .msg.me{ background:#2563eb;color:#fff;align-self:flex-end; }
      .chat-pop .msg.them{ background:#fff;border:1px solid #e2e8f0;align-self:flex-start; }
      .chat-pop .msg .sender{ font-size:10.5px;opacity:.75;margin-bottom:2px;font-weight:600; }
      .chat-pop .msg .time{ font-size:10px;opacity:.6;display:block;margin-top:2px; }
      .chat-pop .empty{ color:#94a3b8;font-size:13px;text-align:center;padding:30px 12px; }

      .chat-pop .input-bar{
        background:#fff;border-top:1px solid #e2e8f0;padding:10px;
        display:flex;gap:6px;
      }
      .chat-pop .input-bar input{
        flex:1;padding:9px 12px;border:1px solid #cbd5e1;border-radius:999px;font-size:13.5px;
      }
      .chat-pop .input-bar button{
        background:#2563eb;color:#fff;border:none;padding:9px 16px;
        border-radius:999px;cursor:pointer;font-weight:600;font-size:13px;
      }
    `;
    document.head.appendChild(s);
  }

  // An FAB khi co modal khac mo (cart, login dialog...) — qua ui.bus
  let _busSubscribed = false;
  function subscribeDialogBus() {
    if (_busSubscribed || !global.ui || !ui.bus) return;
    _busSubscribed = true;
    ui.bus.on('dialog:count', (n) => {
      const fab = document.querySelector('.chat-fab');
      if (!fab) return;
      fab.style.display = n > 0 ? 'none' : 'flex';
    });
  }

  function mount() {
    injectStyle();
    subscribeDialogBus();

    // Floating button — bam la mo chat. Neu chua login -> form dang ky nhanh
    // (cung 1 luong voi nut "Chat ve san pham" trong chi tiet).
    if (!document.querySelector('.chat-fab')) {
      const fab = document.createElement('button');
      fab.type = 'button';
      fab.className = 'chat-fab';
      fab.title = 'Chat với CSKH';
      fab.textContent = '💬';
      // Wrap trong arrow fn de KHONG truyen MouseEvent vao open() nhu opts
      fab.addEventListener('click', () => open());
      document.body.appendChild(fab);
    }

    // Dialog
    if (!document.getElementById('chatPopBg')) {
      const bg = document.createElement('div');
      bg.id = 'chatPopBg';
      bg.className = 'chat-pop-bg';
      bg.innerHTML = `
        <div class="chat-pop" id="chatPop">
          <div class="head">
            <div style="flex:1">
              <div class="title">💬 CSKH GPS Việt</div>
              <div class="sub">Chúng tôi sẽ phản hồi nhanh nhất có thể.</div>
            </div>
            <button type="button" id="chatPopClose" aria-label="Đóng">×</button>
          </div>
          <div class="body" id="chatPopBody"></div>
          <form class="input-bar" id="chatPopForm">
            <input type="file" id="chatPopFile" hidden
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar">
            <button type="button" id="chatPopAttach" title="Đính kèm"
              style="background:#f1f5f9;border:none;border-radius:50%;width:38px;height:38px;cursor:pointer;font-size:16px;flex-shrink:0">📎</button>
            <input id="chatPopInput" placeholder="Nhập tin nhắn..." autocomplete="off">
            <button type="submit">Gửi</button>
          </form>
        </div>`;
      document.body.appendChild(bg);
      bg.addEventListener('click', (e) => { if (e.target.id === 'chatPopBg') close(); });
      document.getElementById('chatPopClose').addEventListener('click', close);
      document.getElementById('chatPopForm').addEventListener('submit', send);
      document.getElementById('chatPopAttach').addEventListener('click',
        () => document.getElementById('chatPopFile').click());
      document.getElementById('chatPopFile').addEventListener('change', handleFileUpload);
    }
  }

  function fileToDataUrl(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result);
      r.onerror = () => rej(new Error('Read error'));
      r.readAsDataURL(file);
    });
  }

  async function handleFileUpload(e) {
    const u = global.auth ? auth.user() : null;
    if (!u || !convId) {
      e.target.value = '';
      ui.toast('Chưa sẵn sàng — vui lòng thử lại', 'warning');
      return;
    }
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return ui.toast('File quá 20MB', 'warning');

    const dataUrl = await fileToDataUrl(file).catch(() => null);
    if (!dataUrl) return;

    const apiBase = '/customer';
    const r = await api.post(apiBase + '/uploads/chat',
      { dataUrl, name: file.name },
      { loading: true }).catch(() => null);
    if (!r) return;

    const isImage = /\.(jpe?g|png|gif|webp)$/i.test(r.url);
    const content = isImage
      ? r.url
      : `[FILE]${r.url}|${(r.name || file.name).replace(/[\[\]|]/g, '')}[/FILE]`;

    await sendContent(content);
  }

  async function open(opts) {
    console.log('[chat-with-admin v2] open()', opts);
    const u = global.auth ? auth.user() : null;

    // Guest -> hien form dang ky nhanh truoc khi chat
    if (!u) {
      showRegisterForm(opts);
      return;
    }

    // Login sai role (admin/kithuat) -> tu choi
    if (u.role !== 'customer' && u.role !== 'daily') {
      ui.toast('Chat CSKH chỉ dành cho khách / đại lý', 'info');
      return;
    }

    document.getElementById('chatPopBg').classList.add('open');
    opened = true;

    // Lazy-load renderer (de hien tin "quan tam san pham" thanh card)
    if (!global.chatMsg) {
      try { await loadScript('/shared/js/chat-msg-render.js'); } catch (_) {}
    }

    // Khoi phuc UI chat (truong hop vua chuyen tu form dang ky qua)
    restoreChatUI();
    setTimeout(() => {
      const inp = document.getElementById('chatPopInput');
      if (inp) inp.focus();
    }, 100);

    if (!convId) {
      const apiBase = '/customer';
      let cv;
      try {
        cv = await api.get(apiBase + '/conversations/me', { silent: true });
      } catch (err) {
        // Token het han / khong hop le -> clear session, fallback form dang ky
        if (err.status === 401 || err.status === 403) {
          auth.clearSession();
          showRegisterForm(opts);
          return;
        }
        ui.toast('Không khởi tạo được cuộc trò chuyện (HTTP ' + (err.status || '?') + ')', 'error');
        return;
      }
      convId = cv.id;
    }

    await loadMessages();
    setupSocket();
    startPolling();

    // Tu dong gui tin nhan ve san pham (neu co)
    if (opts && opts.autoSend) {
      await sendContent(opts.autoSend);
    } else if (opts && opts.prefill) {
      const inp = document.getElementById('chatPopInput');
      if (inp) { inp.value = opts.prefill; inp.focus(); }
    }
  }

  // Khoi phuc UI chat sau khi hien form dang ky
  function restoreChatUI() {
    const body = document.getElementById('chatPopBody');
    const bar  = document.getElementById('chatPopForm');
    const title = document.querySelector('#chatPop .head .title');
    const sub   = document.querySelector('#chatPop .head .sub');
    if (body) { body.innerHTML = ''; body.style.padding = ''; body.style.background = ''; }
    if (bar)  bar.style.display = '';
    if (title) title.textContent = '💬 CSKH GPS Việt';
    if (sub)   sub.textContent   = 'Chúng tôi sẽ phản hồi nhanh nhất có thể.';
  }

  function showRegisterForm(opts) {
    document.getElementById('chatPopBg').classList.add('open');
    opened = true;

    const title = document.querySelector('#chatPop .head .title');
    const sub   = document.querySelector('#chatPop .head .sub');
    if (title) title.textContent = '👋 Chào bạn!';
    if (sub)   sub.textContent   = 'Cho chúng mình xin chút thông tin để hỗ trợ nhé.';

    const bar = document.getElementById('chatPopForm');
    if (bar) bar.style.display = 'none';

    const body = document.getElementById('chatPopBody');
    body.style.padding = '16px';
    body.style.background = '#fff';
    body.innerHTML = `
      <form id="chatRegForm" style="display:flex;flex-direction:column;gap:10px">
        <div>
          <label style="font-size:12px;font-weight:600;color:#334155;display:block;margin-bottom:3px">Họ tên *</label>
          <input id="crName" required maxlength="100" placeholder="Nguyễn Văn A"
            style="width:100%;padding:9px 11px;border:1px solid #cbd5e1;border-radius:8px;font-size:13.5px;box-sizing:border-box">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:#334155;display:block;margin-bottom:3px">Số điện thoại *</label>
          <input id="crPhone" required inputmode="tel" maxlength="15" placeholder="09xxxxxxxx"
            style="width:100%;padding:9px 11px;border:1px solid #cbd5e1;border-radius:8px;font-size:13.5px;box-sizing:border-box">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:#334155;display:block;margin-bottom:3px">Địa chỉ</label>
          <input id="crAddress" maxlength="300" placeholder="Số nhà, đường, phường/xã (tuỳ chọn)"
            style="width:100%;padding:9px 11px;border:1px solid #cbd5e1;border-radius:8px;font-size:13.5px;box-sizing:border-box">
        </div>
        <button type="submit" id="crSubmit"
          style="background:#2563eb;color:#fff;border:none;padding:11px;border-radius:8px;
            cursor:pointer;font-weight:600;font-size:14px;margin-top:4px">
          💬 Bắt đầu chat
        </button>
        <p style="font-size:11.5px;color:#64748b;margin:4px 0 0;line-height:1.45">
          Lần sau bạn có thể đăng nhập lại bằng <b>số điện thoại</b> này.
          Bằng việc tiếp tục, bạn đồng ý cho GPS Việt liên hệ tư vấn.
        </p>
      </form>`;

    document.getElementById('chatRegForm').addEventListener('submit', (e) => {
      e.preventDefault();
      submitRegister(opts);
    });
    setTimeout(() => document.getElementById('crName').focus(), 100);
  }

  // Mirror cua validators o BE — chi de UX, BE moi la gate that.
  function validatePhoneClient(s) {
    const raw = String(s || '').trim();
    if (!raw) return 'Vui lòng nhập số điện thoại';
    if (raw.length > 20) return 'Số điện thoại quá dài';
    let d = raw.replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('84'))  d = '0' + d.slice(2);
    if (d.length === 12 && d.startsWith('840')) d = '0' + d.slice(3);
    if (!/^0[35789]\d{8}$/.test(d)) {
      return 'SĐT không hợp lệ (10 chữ số, bắt đầu 03/05/07/08/09)';
    }
    return null; // ok
  }
  function validateNameClient(s) {
    const v = String(s || '').trim();
    if (!v)             return 'Vui lòng nhập họ tên';
    if (v.length < 2)   return 'Họ tên quá ngắn';
    if (v.length > 100) return 'Họ tên quá dài (tối đa 100 ký tự)';
    if (/[<>"'`]/.test(v)) return 'Họ tên có ký tự không hợp lệ';
    return null;
  }
  function validateAddressClient(s) {
    const v = String(s || '').trim();
    if (!v) return null; // optional
    if (v.length > 300) return 'Địa chỉ quá dài (tối đa 300 ký tự)';
    if (/[<>]/.test(v)) return 'Địa chỉ có ký tự không hợp lệ';
    return null;
  }

  async function submitRegister(opts) {
    const name    = document.getElementById('crName').value;
    const phoneIn = document.getElementById('crPhone').value;
    const address = document.getElementById('crAddress').value;

    const errName  = validateNameClient(name);
    if (errName)  return ui.toast(errName, 'warning');
    const errPhone = validatePhoneClient(phoneIn);
    if (errPhone) return ui.toast(errPhone, 'warning');
    const errAddr  = validateAddressClient(address);
    if (errAddr)  return ui.toast(errAddr, 'warning');

    const btn = document.getElementById('crSubmit');
    btn.disabled = true;
    btn.textContent = 'Đang xử lý...';

    const res = await api.post('/auth/quick-register-customer', {
      full_name: name.trim(),
      phone:     phoneIn.trim(),
      address:   address.trim() || null,
    }).catch(() => null);

    btn.disabled = false;
    btn.textContent = '💬 Bắt đầu chat';

    if (!res) return; // api.js da hien loi

    auth.setSession(res.token, res.user);

    // Reset state va re-open voi opts goc (gio da login)
    convId = null;
    messages = [];
    socketConnected = false;
    await open(opts);
  }

  function close() {
    document.getElementById('chatPopBg').classList.remove('open');
    opened = false;
    if (window.__chatPopPoll) {
      clearInterval(window.__chatPopPoll);
      window.__chatPopPoll = null;
    }
  }

  // Polling fallback 3s — chi chay khi popup dang mo + co convId
  function startPolling() {
    if (window.__chatPopPoll) clearInterval(window.__chatPopPoll);
    window.__chatPopPoll = setInterval(async () => {
      if (!opened || !convId) return;
      const u = global.auth ? auth.user() : null;
      if (!u) return;
      const apiBase = '/customer';
      const res = await api.get(`${apiBase}/conversations/${convId}/messages`, { silent: true })
        .catch(() => null);
      if (!res) return;
      const newOnes = res.items.filter(m => !messages.find(x => x.id === m.id));
      if (newOnes.length) {
        messages.push(...newOnes);
        render();
      }
    }, 3000);
  }

  async function loadMessages() {
    const u = global.auth ? auth.user() : null;
    if (!u || !convId) return;
    const apiBase = '/customer';
    const res = await api.get(`${apiBase}/conversations/${convId}/messages`, { silent: true })
      .catch(() => null);
    if (res) {
      messages = res.items || [];
      render();
    }
  }

  function render() {
    const wrap = document.getElementById('chatPopBody');
    if (!wrap) return;
    const u = global.auth ? auth.user() : null;
    if (!messages.length) {
      wrap.innerHTML = '<div class="empty">Hãy gửi tin nhắn đầu tiên 👋</div>';
      return;
    }
    wrap.innerHTML = messages.map(m => {
      const isMe = m.sender_type === 'customer' && u && m.sender_id === u.id;
      const cls = isMe ? 'me' : 'them';
      const senderLabel = isMe
        ? 'Bạn'
        : (m.sender_type === 'staff' ? '🛡 CSKH' : 'Khách');
      const theme = isMe ? 'on-blue' : 'on-white';
      const body = (global.chatMsg && chatMsg.render)
        ? chatMsg.render(m.content, { theme })
        : escape(m.content);
      return `
        <div class="msg ${cls}">
          <div class="sender">${senderLabel}</div>
          ${body}
          <span class="time">${fmtTime(m.sent_at)}</span>
        </div>`;
    }).join('');
    if (global.chatMsg && chatMsg.hydrateThumbs) chatMsg.hydrateThumbs(wrap);
    wrap.scrollTop = wrap.scrollHeight;
  }

  async function sendContent(content) {
    const u = global.auth ? auth.user() : null;
    if (!u || !convId) {
      ui.toast('Chưa sẵn sàng để gửi — vui lòng thử lại', 'warning');
      return;
    }
    content = String(content || '').trim();
    if (!content) return;
    const apiBase = '/customer';
    let msg;
    try {
      msg = await api.post(`${apiBase}/conversations/${convId}/messages`,
        { content }, { silent: true });
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        auth.clearSession();
        convId = null;
        showRegisterForm({ autoSend: content });
        return;
      }
      ui.toast('Không gửi được tin (HTTP ' + (err.status || '?') + ')', 'error');
      return;
    }
    if (msg && !messages.find(x => x.id === msg.id)) {
      messages.push(msg);
      render();
    }
  }

  async function send(e) {
    e.preventDefault();
    const input = document.getElementById('chatPopInput');
    const content = input.value.trim();
    if (!content) return;
    input.value = '';
    await sendContent(content);
  }

  // Socket listen tin moi tu admin
  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  async function setupSocket() {
    if (socketConnected || !convId) return;
    try {
      if (!window.io)        await loadScript('/socket.io/socket.io.js');
      if (!window.appSocket) await loadScript('/shared/js/socket.js');
    } catch (_) { return; }
    if (!window.appSocket) return;

    appSocket.connect();
    appSocket.joinConversation(convId);
    appSocket.on('message:new', (m) => {
      if (m.conversation_id !== convId) return;
      if (messages.find(x => x.id === m.id)) return;
      messages.push(m);
      render();
    });
    socketConnected = true;
  }

  // ----- Screenshot-on-request --------------------------------
  // Admin / KTV bam nut 📷 trong khung chat -> BE relay socket
  // 'screenshot:request' toi room customer-<id> -> chup DOM bang
  // html2canvas -> upload imgbb -> gui lai nhu mot tin nhan anh.
  let screenshotBusy = false;
  let screenshotListenerOn = false;

  async function ensureLib(globalKey, src) {
    if (window[globalKey]) return true;
    try { await loadScript(src); } catch (_) { return false; }
    return !!window[globalKey];
  }

  async function handleScreenshotRequest(payload) {
    const convId = Number(payload && payload.conversation_id);
    if (!convId) return;
    if (screenshotBusy) return;
    screenshotBusy = true;

    const u = global.auth ? auth.user() : null;
    if (!u || (u.role !== 'customer' && u.role !== 'daily')) {
      screenshotBusy = false;
      return;
    }

    // Im lang voi khach — khong toast, khong dialog. Admin/KTV chu dong yeu cau,
    // khach khong can biet.
    try {
      const okH2C = await ensureLib('html2canvas',
        'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
      const okImgbb = await ensureLib('imgbb', '/shared/js/imgbb.js');
      if (!okH2C || !okImgbb) return;

      // Tam an widget chat de no khong lot vao anh
      const fab = document.querySelector('.chat-fab');
      const popBg = document.getElementById('chatPopBg');
      const fabPrev = fab ? fab.style.display : null;
      const popPrev = popBg ? popBg.style.display : null;
      if (fab) fab.style.display = 'none';
      if (popBg) popBg.style.display = 'none';

      // Chi chup phan VIEWPORT khach dang thay (khong chup ca trang dai loang ngoang).
      const vw = window.innerWidth  || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const sx = window.scrollX || window.pageXOffset || 0;
      const sy = window.scrollY || window.pageYOffset || 0;

      let canvas;
      try {
        canvas = await window.html2canvas(document.body, {
          backgroundColor: '#ffffff',
          scale: Math.min(window.devicePixelRatio || 1, 1.5),
          useCORS: true,
          logging: false,
          x: sx, y: sy,
          width: vw, height: vh,
          windowWidth:  document.documentElement.scrollWidth,
          windowHeight: document.documentElement.scrollHeight,
        });
      } finally {
        if (fab) fab.style.display = fabPrev || '';
        if (popBg) popBg.style.display = popPrev || '';
      }

      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
      if (!blob) return;
      const file = new File([blob], `screen-${Date.now()}.jpg`, { type: 'image/jpeg' });

      let url;
      try {
        url = await imgbb.upload(file, { name: `cv${convId}-${Date.now()}` });
      } catch (_) { return; }

      try {
        // Endpoint rieng — BE luu visibility='staff_only', khach khong thay tin nay.
        await api.post(`/customer/conversations/${convId}/messages/screenshot`,
          { content: url }, { silent: true });
      } catch (_) { /* admin se thay ngay khi nhan tu socket */ }
    } finally {
      screenshotBusy = false;
    }
  }

  async function autoListenScreenshot() {
    if (screenshotListenerOn) return;
    const u = global.auth ? auth.user() : null;
    if (!u || (u.role !== 'customer' && u.role !== 'daily')) return;
    try {
      if (!window.io)        await loadScript('/socket.io/socket.io.js');
      if (!window.appSocket) await loadScript('/shared/js/socket.js');
    } catch (_) { return; }
    if (!window.appSocket) return;
    appSocket.connect();
    appSocket.on('screenshot:request', handleScreenshotRequest);
    screenshotListenerOn = true;
  }

  function bootstrap() {
    mount();
    // Hoan 1.5s de khong canh tranh tai nguyen voi page load chinh
    setTimeout(autoListenScreenshot, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  // Public API — cho phep trang khac trigger (vd: nut "Chat ve san pham")
  global.chatWithAdmin = {
    open,
    close,
    // openWithMessage(text): mo chat va tu dong gui mot tin nhan
    openWithMessage: (text) => open({ autoSend: text }),
    // openPrefill(text): mo chat va dien san input (chua gui)
    openPrefill:     (text) => open({ prefill: text }),
  };
})(window);
