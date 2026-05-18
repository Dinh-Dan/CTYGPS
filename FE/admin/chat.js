// Trang Tin nhan admin — list conversations + chat panel + Socket.IO realtime

(function () {
  const $ = (id) => document.getElementById(id);

  const state = {
    q: '',
    convs: [],
    currentId: null,
    currentCustomerId: null,
    messages: [],
    members: [],         // active + removed (BE tra ca 2)
    allKtv: [],          // cache de chon them
  };

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  function fmtTime(ts) {
    if (!ts) return '';
    const d = new Date(String(ts).replace(' ', 'T'));
    if (isNaN(d)) return '';
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    if (sameDay) return d.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
    return d.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit' });
  }

  function fmtFullTime(ts) {
    if (!ts) return '';
    const d = new Date(String(ts).replace(' ', 'T'));
    if (isNaN(d)) return '';
    return d.toLocaleString('vi-VN', { dateStyle:'short', timeStyle:'short' });
  }

  function avatarHtml(c) {
    if (c.customer_avatar) return `<img class="conv-avatar" src="${escape(c.customer_avatar)}">`;
    const i = (c.customer_name || c.customer_code || '?').trim().charAt(0).toUpperCase();
    return `<div class="conv-avatar">${i}</div>`;
  }

  // ---- List ---------------------------------------------------
  let listLoadedOnce = false;
  async function loadList() {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    p.set('limit', 100);

    // Lan dau: hien "Dang tai..." va non-silent (login dialog neu het han).
    // Lan sau (poll/realtime): silent de tranh spam dialog.
    if (!listLoadedOnce) {
      const wrap = $('convList');
      if (wrap) wrap.innerHTML = '<p class="text-muted text-center" style="padding:30px 12px;font-size:13px">Đang tải danh sách...</p>';
    }

    let res;
    try {
      const opts = listLoadedOnce ? { silent: true } : {};
      res = await api.get('/admin/conversations?' + p.toString(), opts);
    } catch (err) {
      const wrap = $('convList');
      if (wrap && !listLoadedOnce) {
        wrap.innerHTML = `<p class="text-muted text-center" style="padding:30px 12px;font-size:13px;color:#dc2626">
          ⚠ Không tải được danh sách (HTTP ${err.status || '?'}).<br>
          <a href="javascript:void(0)" onclick="location.reload()" style="color:#2563eb">Tải lại trang</a>
        </p>`;
      }
      console.warn('[chat] loadList failed:', err.status, err.message);
      return;
    }
    listLoadedOnce = true;
    state.convs = (res && res.items) || [];
    renderList();
  }

  function renderList() {
    const wrap = $('convList');
    if (!wrap) return;
    if (!state.convs.length) {
      wrap.innerHTML = '<p class="text-muted text-center" style="padding:30px 12px;font-size:13px">Chưa có cuộc trò chuyện</p>';
      return;
    }
    wrap.innerHTML = state.convs.map(c => {
      const isActive = c.id === state.currentId;
      const lastPrefix = c.last_sender === 'staff' ? 'Bạn: ' : '';
      const lastMsg = c.last_message ? lastPrefix + c.last_message : 'Chưa có tin nhắn';
      const tag = c.customer_type === 'dealer'
        ? '<span class="pill daily" style="font-size:10.5px">🏪 Đại lý</span>'
        : '<span class="pill retail" style="font-size:10.5px">👤 Khách</span>';
      const memberTag = c.member_count > 0
        ? `<span class="pill" style="font-size:10.5px;background:#dcfce7;color:#166534">👥 ${c.member_count} KTV</span>`
        : '';
      return `
        <div class="conv-item ${isActive ? 'active' : ''}" data-id="${c.id}">
          ${avatarHtml(c)}
          <div class="conv-info">
            <div class="conv-name">${escape(c.customer_name || c.customer_code || '?')}</div>
            <div class="conv-last">${escape(lastMsg)}</div>
            <div style="margin-top:3px;display:flex;gap:4px;flex-wrap:wrap">${tag}${memberTag}</div>
          </div>
          <div class="conv-meta">
            <span class="conv-time">${fmtTime(c.last_message_at)}</span>
            ${c.unread_count > 0 ? `<span class="conv-unread">${c.unread_count}</span>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  // ---- Chat panel --------------------------------------------
  function renderEmpty() {
    $('chatPanel').innerHTML = `
      <div class="empty-state">
        <div class="icon">💬</div>
        <div>Chọn cuộc trò chuyện ở bên trái để xem tin nhắn</div>
      </div>`;
  }

  function renderPanel(cv) {
    const customerLabel = cv.customer_type === 'dealer'
      ? `🏪 ${escape(cv.customer_company || cv.customer_name)} <span class="text-muted" style="font-weight:400">(${escape(cv.customer_name)})</span>`
      : `👤 ${escape(cv.customer_name || cv.customer_code)}`;
    const phone = cv.customer_phone
      ? `<a href="tel:${escape(cv.customer_phone)}" style="color:#2563eb;font-weight:600">${escape(cv.customer_phone)}</a>`
      : '';

    $('chatPanel').innerHTML = `
      <div class="chat-header">
        <div style="flex:1">
          <div class="name">${customerLabel}</div>
          <div class="meta">${phone}</div>
        </div>
        <button type="button" id="btnEditCustomer"
          title="Cập nhật thông tin khách (tên, SĐT, địa chỉ…)"
          style="background:#f1f5f9;border:none;border-radius:999px;height:38px;padding:0 14px;
                 cursor:pointer;font-size:13px;font-weight:600;color:#334155;flex-shrink:0;margin-right:6px">✏️ Sửa khách</button>
        <button type="button" id="btnMembers"
          title="Quản lý thành viên (KTV)"
          style="background:#f1f5f9;border:none;border-radius:999px;height:38px;padding:0 14px;
                 cursor:pointer;font-size:13px;font-weight:600;color:#334155;flex-shrink:0;margin-right:6px">👥 Thành viên</button>
        <button type="button" id="btnScreenshot"
          title="Yêu cầu khách chụp màn hình hiện tại"
          style="background:#f1f5f9;border:none;border-radius:50%;width:38px;height:38px;
                 cursor:pointer;font-size:17px;flex-shrink:0">📷</button>
      </div>
      <div id="membersPop" class="members-pop">
        <div class="head">👥 Thành viên cuộc chat</div>
        <div class="body" id="membersBody"></div>
        <div class="add-row">
          <select id="memberSelect"><option value="">-- Chọn KTV --</option></select>
          <button type="button" id="btnAddMember">Thêm</button>
        </div>
      </div>
      <div class="chat-msgs" id="chatMsgs"></div>
      <form class="chat-input" id="chatForm">
        <input type="file" id="chatFile" hidden
               accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar">
        <button type="button" id="chatAttachBtn" title="Đính kèm ảnh / tài liệu"
          style="background:#f1f5f9;border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;font-size:18px;flex-shrink:0">📎</button>
        <input id="chatInput" placeholder="Nhập tin nhắn..." autocomplete="off">
        <button type="submit" id="chatSend">Gửi</button>
      </form>`;
    renderMessages();
    $('chatForm').addEventListener('submit', sendMessage);
    $('chatAttachBtn').addEventListener('click', () => $('chatFile').click());
    $('chatFile').addEventListener('change', handleFileUpload);
    $('btnScreenshot').addEventListener('click', requestScreenshot);
    $('btnMembers').addEventListener('click', toggleMembersPanel);
    $('btnAddMember').addEventListener('click', addMember);
    $('btnEditCustomer').addEventListener('click', openCustomerEdit);
    setTimeout(() => $('chatInput').focus(), 50);
  }

  // Upload file + send message
  function fileToDataUrl(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result);
      r.onerror = () => rej(new Error('Read error'));
      r.readAsDataURL(file);
    });
  }

  async function handleFileUpload(e) {
    if (!state.currentId) return;
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return ui.toast('File quá 20MB', 'warning');

    const dataUrl = await fileToDataUrl(file).catch(() => null);
    if (!dataUrl) return;

    const r = await api.post('/admin/uploads',
      { dataUrl, folder: 'chat', name: file.name },
      { loading: true }).catch(() => null);
    if (!r) return;

    const isImage = /\.(jpe?g|png|gif|webp)$/i.test(r.url);
    const content = isImage
      ? r.url
      : `[FILE]${r.url}|${(r.name || file.name).replace(/[\[\]|]/g, '')}[/FILE]`;

    const msg = await api.post(`/admin/conversations/${state.currentId}/messages`,
      { content }, { silent: true }).catch(() => null);
    if (msg && !state.messages.find(x => x.id === msg.id)) {
      state.messages.push(msg);
      renderMessages();
    }
  }

  function orderBadgeHtml(m) {
    if (!m.order_id) return '';
    const code = m.order_code || ('Đơn #' + m.order_id);
    return `<a class="pill order-tag" href="/admin/orders.html#order-${m.order_id}" data-order-quick="${m.order_id}"
              style="margin-bottom:3px">📦 ${escape(code)}</a><br>`;
  }

  function renderMessages() {
    const wrap = $('chatMsgs');
    if (!wrap) return;
    if (!state.messages.length) {
      wrap.innerHTML = '<p class="text-muted text-center" style="padding:30px;font-size:13px">Chưa có tin nhắn</p>';
      return;
    }
    wrap.innerHTML = state.messages.map(m => {
      const cls = m.sender_type === 'staff' ? 'from-staff' : 'from-customer';
      const roleSuffix = m.sender_type === 'staff'
        ? (m.sender_role === 'admin' ? ' · Admin' : (m.sender_role === 'kithuat' ? ' · KTV' : ''))
        : '';
      const senderName = m.sender_type === 'staff'
        ? `${escape(m.sender_name || 'Staff')}${roleSuffix}`
        : escape(m.sender_name || 'Khách');
      const theme = m.sender_type === 'staff' ? 'on-blue' : 'on-white';
      const body = (window.chatMsg && chatMsg.render)
        ? chatMsg.render(m.content, { theme })
        : escape(m.content);
      const staffOnlyTag = m.visibility === 'staff_only'
        ? '<span style="display:inline-block;background:#fef3c7;color:#92400e;font-size:10px;font-weight:600;padding:1px 6px;border-radius:999px;margin-left:6px">📷 Chỉ admin/KTV</span>'
        : '';
      return `
        <div class="msg ${cls}">
          <div class="sender">${senderName}${staffOnlyTag}</div>
          ${orderBadgeHtml(m)}${body}
          <span class="time">${fmtFullTime(m.sent_at)}</span>
        </div>`;
    }).join('');
    if (window.chatMsg && chatMsg.hydrateThumbs) chatMsg.hydrateThumbs(wrap);
    wrap.scrollTop = wrap.scrollHeight;
  }

  async function openConversation(id) {
    if (state.currentId === id) return;
    if (state.currentId) appSocket.leaveConversation(state.currentId);
    state.currentId = id;
    state.currentCustomerId = null;
    state.messages = [];
    state.members = [];

    // Render header tu cv hien co trong list
    const cvShort = state.convs.find(c => c.id === id);
    if (cvShort) {
      cvShort.unread_count = 0;
      renderList();
    }

    // Load full detail + messages + members song song
    const [cv, msgs, mem] = await Promise.all([
      api.get(`/admin/conversations/${id}`, { silent: true }).catch(() => null),
      api.get(`/admin/conversations/${id}/messages`, { silent: true }).catch(() => null),
      api.get(`/admin/conversations/${id}/members`, { silent: true }).catch(() => null),
    ]);
    if (!cv) { renderEmpty(); return; }
    state.currentCustomerId = cv.customer_id;
    if (msgs) state.messages = msgs.items;
    if (mem)  state.members = mem.items || [];

    renderPanel(cv);
    appSocket.joinConversation(id);

    if (window.adminShell?.refreshChatBadge) adminShell.refreshChatBadge();
  }

  // ==== Members panel =========================================
  function toggleMembersPanel() {
    const pop = $('membersPop');
    if (!pop) return;
    const willOpen = !pop.classList.contains('open');
    pop.classList.toggle('open', willOpen);
    if (willOpen) {
      renderMembers();
      ensureKtvList();
    }
  }

  async function ensureKtvList() {
    if (state.allKtv.length) {
      renderKtvSelect();
      return;
    }
    const r = await api.get('/admin/staff?role=kithuat&limit=100', { silent: true })
      .catch(() => null);
    if (r) state.allKtv = r.items || [];
    renderKtvSelect();
  }

  function renderKtvSelect() {
    const sel = $('memberSelect');
    if (!sel) return;
    const activeIds = new Set(state.members.filter(m => !m.removed_at).map(m => m.staff_id));
    const opts = ['<option value="">-- Chọn KTV --</option>']
      .concat(state.allKtv
        .filter(k => !activeIds.has(k.id))
        .map(k => `<option value="${k.id}">${escape(k.full_name)} (@${escape(k.username)})</option>`));
    sel.innerHTML = opts.join('');
  }

  function renderMembers() {
    const body = $('membersBody');
    if (!body) return;
    if (!state.members.length) {
      body.innerHTML = '<div style="padding:14px;color:#94a3b8;font-size:12.5px">Chưa có ai trong cuộc chat</div>';
      return;
    }
    body.innerHTML = state.members.map(m => {
      const removed = !!m.removed_at;
      const roleTag = m.role === 'admin' ? 'Admin' : 'KTV';
      const removeBtn = !removed
        ? `<button data-act="rm-mem" data-staff="${m.staff_id}" title="Xoá khỏi chat">×</button>`
        : '<span class="role-tag" style="color:#dc2626">Đã xoá</span>';
      return `
        <div class="row ${removed ? 'removed' : ''}">
          <div class="name">${escape(m.full_name || m.username)}
            <span class="role-tag">· ${roleTag}</span>
          </div>
          ${removeBtn}
        </div>`;
    }).join('');
  }

  async function addMember() {
    const sel = $('memberSelect');
    const staffId = Number(sel && sel.value);
    if (!staffId) return ui.toast('Chưa chọn KTV', 'warning');
    const r = await api.post(`/admin/conversations/${state.currentId}/members`,
      { staff_id: staffId }).catch(() => null);
    if (!r) return;
    // Reload member list
    const mem = await api.get(`/admin/conversations/${state.currentId}/members`, { silent: true })
      .catch(() => null);
    if (mem) state.members = mem.items || [];
    renderMembers();
    renderKtvSelect();
    ui.toast('Đã thêm KTV vào chat', 'success');
  }

  async function removeMember(staffId) {
    if (!confirm('Xoá KTV này khỏi cuộc chat? Họ sẽ không gửi tin được nữa.')) return;
    const r = await api.delete(`/admin/conversations/${state.currentId}/members/${staffId}`)
      .catch(() => null);
    if (!r) return;
    const mem = await api.get(`/admin/conversations/${state.currentId}/members`, { silent: true })
      .catch(() => null);
    if (mem) state.members = mem.items || [];
    renderMembers();
    renderKtvSelect();
    ui.toast('Đã xoá khỏi chat', 'success');
  }

  // ==== Sua thong tin khach tu trong chat =====================
  async function openCustomerEdit() {
    if (!state.currentCustomerId) return ui.toast('Chưa chọn khách', 'warning');
    const c = await api.get('/admin/customers/' + state.currentCustomerId, { loading: true })
      .catch(() => null);
    if (!c) return;
    fillCustomerForm(c);
    $('custModal').classList.add('open');
    setTimeout(() => $('cf_full_name').focus(), 50);
  }

  function closeCustomerEdit() { $('custModal').classList.remove('open'); }

  function fillCustomerForm(c) {
    $('cf_id').value             = c.id || '';
    $('cf_full_name').value      = c.full_name || '';
    $('cf_phone').value          = c.phone || '';
    $('cf_email').value          = c.email || '';
    $('cf_address').value        = c.address || '';
    $('cf_company_name').value   = c.company_name || '';
    $('cf_tax_code').value       = c.tax_code || '';
    $('cf_contact_person').value = c.contact_person || '';
    $('cf_note').value           = c.note || '';
    $('cf_dealerFields').classList.toggle('hide', c.type !== 'dealer');
    $('custModalTitle').textContent = c.type === 'dealer'
      ? `Cập nhật đại lý — ${c.code || ''}`
      : `Cập nhật khách — ${c.code || ''}`;
  }

  async function handleCustomerSubmit(e) {
    e.preventDefault();
    const id = $('cf_id').value;
    if (!id) return;
    const data = {
      full_name: $('cf_full_name').value.trim(),
      phone:     $('cf_phone').value.trim() || null,
      email:     $('cf_email').value.trim() || null,
      address:   $('cf_address').value.trim() || null,
      note:      $('cf_note').value.trim() || null,
    };
    if (!$('cf_dealerFields').classList.contains('hide')) {
      data.company_name   = $('cf_company_name').value.trim() || null;
      data.tax_code       = $('cf_tax_code').value.trim() || null;
      data.contact_person = $('cf_contact_person').value.trim() || null;
    }
    $('custSave').disabled = true;
    const ok = await api.put('/admin/customers/' + id, data, {
      successMessage: 'Đã cập nhật khách hàng',
      loading: true,
    }).catch(() => null);
    $('custSave').disabled = false;
    if (!ok) return;
    closeCustomerEdit();

    // Refresh header chat (ten / sdt) bang cach reload conv detail
    if (state.currentId) {
      const cv = await api.get(`/admin/conversations/${state.currentId}`, { silent: true })
        .catch(() => null);
      if (cv) {
        renderPanel(cv);
        // Cap nhat lai item trong list de hien ten moi
        const item = state.convs.find(c => c.id === state.currentId);
        if (item) {
          item.customer_name    = cv.customer_name;
          item.customer_phone   = cv.customer_phone;
          item.customer_company = cv.customer_company;
          item.customer_avatar  = cv.customer_avatar;
          renderList();
        }
      }
    }
  }

  // Yeu cau khach (customer/dealer) chup man hinh hien tai cua ho.
  // BE relay socket -> chat-with-admin.js cua khach se html2canvas + upload
  // imgbb + gui lai nhu 1 tin nhan anh thong thuong.
  function requestScreenshot() {
    if (!state.currentId) return;
    const s = appSocket.connect();
    if (!s) { ui.toast('Mất kết nối, thử lại sau', 'warning'); return; }
    s.emit('screenshot:request', { conversation_id: state.currentId });
    ui.toast('Đã gửi yêu cầu chụp — đợi khách phản hồi', 'info');
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!state.currentId) return;
    const content = $('chatInput').value.trim();
    if (!content) return;
    $('chatInput').value = '';
    $('chatSend').disabled = true;
    const msg = await api.post(`/admin/conversations/${state.currentId}/messages`,
      { content }, { silent: true }).catch(() => null);
    $('chatSend').disabled = false;
    if (msg && !state.messages.find(x => x.id === msg.id)) {
      state.messages.push(msg);
      renderMessages();
      // Cap nhat last_message trong list
      const cv = state.convs.find(c => c.id === state.currentId);
      if (cv) {
        cv.last_message = msg.content;
        cv.last_sender = 'staff';
        cv.last_message_at = msg.sent_at;
        renderList();
      }
    }
    $('chatInput').focus();
  }

  // ---- Socket events -----------------------------------------
  function setupSocket() {
    appSocket.connect();

    // Tin moi cho conv dang xem (admin da join `conv-X`)
    appSocket.on('message:new', (m) => {
      if (m.conversation_id === state.currentId) {
        if (!state.messages.find(x => x.id === m.id)) {
          state.messages.push(m);
          renderMessages();
        }
      }
      clearTimeout(window.__chatListReload);
      window.__chatListReload = setTimeout(loadList, 300);
    });

    // Tin moi cho BAT KY conv nao (broadcast vao room 'admin') —
    // can co listener nay vi admin chua join `conv-X` cua nhung
    // conversation chua mo, nen 'message:new' khong toi.
    appSocket.on('message:new-toast', (data) => {
      // Neu trung conv dang xem va da xu ly o tren -> bo qua append
      // (server emit ca 2 event nen co the trung; duplicate-guard trong loadList)
      clearTimeout(window.__chatListReload);
      window.__chatListReload = setTimeout(loadList, 300);
      if (window.adminShell?.refreshChatBadge) adminShell.refreshChatBadge();
    });

    // BE bao loi sau khi bam nut chup (khach offline / khong hop le)
    appSocket.on('screenshot:nack', (data) => {
      const reasons = {
        offline:      'Khách không online — bảo khách mở lại web rồi thử lại',
        forbidden:    'Không có quyền yêu cầu chụp',
        not_found:    'Cuộc trò chuyện không hợp lệ',
        bad_request:  'Yêu cầu không hợp lệ',
        server_error: 'Lỗi server khi gửi yêu cầu',
      };
      ui.toast(reasons[data && data.reason] || 'Không gửi được yêu cầu chụp', 'warning');
    });
  }

  // ---- Click handlers ----------------------------------------
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.conv-item[data-id]');
    if (item) {
      openConversation(Number(item.dataset.id));
      return;
    }
    const rmBtn = e.target.closest('button[data-act="rm-mem"]');
    if (rmBtn) {
      removeMember(Number(rmBtn.dataset.staff));
      return;
    }
    // Click ngoai members popup -> dong
    const pop = document.getElementById('membersPop');
    if (pop && pop.classList.contains('open')) {
      const inside = e.target.closest('#membersPop, #btnMembers');
      if (!inside) pop.classList.remove('open');
    }
  });

  // ---- Init --------------------------------------------------
  function init() {
    adminShell.init('chat');

    let timer;
    $('search').addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.q = e.target.value.trim();
        loadList();
      }, 300);
    });

    // Modal sua khach
    $('custClose').addEventListener('click', closeCustomerEdit);
    $('custCancel').addEventListener('click', closeCustomerEdit);
    $('custModal').addEventListener('click', (e) => {
      if (e.target.id === 'custModal') closeCustomerEdit();
    });
    $('custForm').addEventListener('submit', handleCustomerSubmit);

    setupSocket();
    loadList();

    // Polling backup — phong khi socket fallback / disconnect:
    // 3s/lan refresh list + messages cua conv dang xem.
    if (window.__chatListPoll) clearInterval(window.__chatListPoll);
    window.__chatListPoll = setInterval(async () => {
      loadList();
      if (state.currentId) {
        const r = await api.get(`/admin/conversations/${state.currentId}/messages`, { silent: true })
          .catch(() => null);
        if (!r) return;
        const newOnes = r.items.filter(m => !state.messages.find(x => x.id === m.id));
        if (newOnes.length) {
          state.messages.push(...newOnes);
          renderMessages();
        }
      }
    }, 3000);

    // Refresh ngay khi tab quay lai (truong hop laptop sleep / chuyen tab)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') loadList();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
