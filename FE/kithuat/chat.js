// Logic trang chat KTV - 2 cot list + chat area + Socket.IO realtime

(function () {
  const $ = (id) => document.getElementById(id);
  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  const state = {
    conversations: [],
    activeId: null,
    messages: [],
  };
  const me = auth.user();

  function fmtTime(ts) {
    if (!ts) return '';
    return ts.replace('T', ' ').slice(0, 16);
  }

  // ---- Conversation list -------------------------------------
  function renderConvList() {
    if (!state.conversations.length) {
      $('convList').innerHTML = '<p class="text-muted text-center" style="padding:24px">Chưa có cuộc trò chuyện</p>';
      return;
    }
    $('convList').innerHTML = state.conversations.map(c => {
      const i = (c.customer_name || '?').charAt(0).toUpperCase();
      const avatar = c.avatar_url
        ? `<img src="${c.avatar_url}" class="avatar" style="object-fit:cover">`
        : `<div class="avatar">${i}</div>`;
      return `
        <div class="conv-item ${c.id === state.activeId ? 'active' : ''}" data-id="${c.id}">
          ${avatar}
          <div style="min-width:0">
            <b>${escape(c.customer_name || '')}</b>
            <small class="text-muted" style="display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${escape(c.order_code)}${c.last_msg ? ' · ' + escape((c.last_msg).slice(0, 40)) : ''}
            </small>
          </div>
          ${c.unread > 0 ? `<span class="unread-dot">${c.unread}</span>` : ''}
        </div>
      `;
    }).join('');
  }

  async function loadConvList() {
    const res = await api.get('/kithuat/conversations').catch(() => null);
    if (!res) return;
    state.conversations = res.items || [];
    renderConvList();
    // Auto open via hash #conv-XX (user co y muon xem -> show area tren mobile)
    if (location.hash.startsWith('#conv-')) {
      const id = Number(location.hash.slice(6));
      if (id && state.conversations.find(c => c.id === id)) {
        selectConv(id);
        $('chatShell').classList.add('show-area');
      }
    } else if (state.conversations.length && !state.activeId) {
      // Auto-select cho desktop (mobile van hien list mac dinh)
      selectConv(state.conversations[0].id);
    }
  }

  // ---- Chat area ---------------------------------------------
  function orderBadgeHtml(m) {
    if (!m.order_id) return '';
    const code = m.order_code || ('Đơn #' + m.order_id);
    return `<a class="order-tag" href="/kithuat/tasks.html#order-${m.order_id}"
              style="display:inline-block;background:#fce7f3;color:#9d174d;font-size:11px;
                     font-weight:600;padding:2px 8px;border-radius:999px;margin-bottom:3px;
                     text-decoration:none">📦 ${escape(code)}</a><br>`;
  }
  function msgHtml(m) {
    const isMe = m.sender_type === 'staff' && m.sender_id === me.id;
    const visTag = m.visibility === 'staff_only'
      ? '<span style="display:inline-block;background:#fef3c7;color:#92400e;font-size:10px;font-weight:600;padding:1px 6px;border-radius:999px;margin-bottom:3px">📷 Chỉ admin/KTV</span><br>'
      : '';
    return `
      <div class="msg ${isMe ? 'me' : 'them'}">
        ${orderBadgeHtml(m)}${visTag}${escape(m.content)}
        <span class="time">${fmtTime(m.sent_at)}</span>
      </div>
    `;
  }
  function renderMessages() {
    const conv = state.conversations.find(c => c.id === state.activeId);
    if (!conv) {
      $('chatArea').innerHTML = '<div class="empty-chat">Chọn 1 cuộc trò chuyện bên trái</div>';
      return;
    }
    $('chatArea').innerHTML = `
      <div class="chat-area-head">
        <button type="button" class="btn-back-conv" id="btnBackConv" aria-label="Quay lại">←</button>
        <div class="avatar">${escape((conv.customer_name || '?').charAt(0).toUpperCase())}</div>
        <div style="flex:1;min-width:0">
          <b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${escape(conv.customer_name || '')}</b>
          ${conv.customer_phone ? '<small class="text-muted">📞 <a href="tel:' + escape(conv.customer_phone) + '">' + escape(conv.customer_phone) + '</a></small>' : ''}
        </div>
        <button type="button" id="btnScreenshot"
          title="Yêu cầu khách chụp màn hình hiện tại"
          style="background:#f1f5f9;border:none;border-radius:50%;width:36px;height:36px;
                 cursor:pointer;font-size:16px;flex-shrink:0">📷</button>
        <span class="pill blue">${escape(conv.order_code)}</span>
      </div>
      <div class="chat-area-msgs" id="msgsBox">
        ${state.messages.map(msgHtml).join('') || '<p class="text-muted text-center">Chưa có tin nhắn</p>'}
      </div>
      <form class="chat-area-input" id="msgForm">
        <input type="text" id="msgInput" placeholder="Nhập tin nhắn..." autocomplete="off" required>
        <button type="submit">Gửi</button>
      </form>
    `;
    const box = $('msgsBox');
    if (box) box.scrollTop = box.scrollHeight;
    $('msgForm').addEventListener('submit', handleSend);
    $('btnScreenshot').addEventListener('click', requestScreenshot);
    const back = $('btnBackConv');
    if (back) back.addEventListener('click', () => {
      $('chatShell').classList.remove('show-area');
    });
  }

  function requestScreenshot() {
    if (!state.activeId) return;
    const s = appSocket.connect();
    if (!s) { ui.toast('Mất kết nối, thử lại sau', 'warning'); return; }
    s.emit('screenshot:request', { conversation_id: state.activeId });
    ui.toast('Đã gửi yêu cầu chụp — đợi khách phản hồi', 'info');
  }

  async function selectConv(id) {
    if (state.activeId) appSocket.leaveConversation(state.activeId);
    state.activeId = id;
    state.messages = [];
    renderConvList();
    renderMessages();

    const res = await api.get(`/kithuat/conversations/${id}/messages`).catch(() => null);
    if (!res) return;
    state.messages = res.items || [];
    renderMessages();

    appSocket.joinConversation(id);
    api.patch(`/kithuat/conversations/${id}/read`, null, { silent: true }).catch(() => {});
    // Update unread = 0 trong list
    const conv = state.conversations.find(c => c.id === id);
    if (conv) { conv.unread = 0; renderConvList(); }
  }

  async function handleSend(e) {
    e.preventDefault();
    const input = $('msgInput');
    const content = input.value.trim();
    if (!content) return;
    input.value = '';
    const msg = await api.post(`/kithuat/conversations/${state.activeId}/messages`, { content }, {
      silent: true,
    }).catch(() => null);
    if (!msg) return;
    // Socket emit se phat ra "message:new" -> handler day vao state, nhung
    // de lap tuc thay tin minh gui, push truc tiep + skip neu trung
    if (!state.messages.find(m => m.id === msg.id)) {
      state.messages.push(msg);
      renderMessages();
    }
  }

  // ---- Socket realtime ---------------------------------------
  function setupSocket() {
    appSocket.on('message:new', (msg) => {
      // Neu thuoc conversation dang xem -> push vao messages
      if (state.activeId) {
        // msg khong co conversation_id? Check qua .conversation_id
        if (msg.conversation_id === state.activeId) {
          if (!state.messages.find(m => m.id === msg.id)) {
            state.messages.push(msg);
            renderMessages();
            api.patch(`/kithuat/conversations/${state.activeId}/read`, null, { silent: true }).catch(() => {});
          }
        }
      }
      // Reload conv list de cap nhat last_msg/unread
      loadConvList();
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

  // ---- Click handler -----------------------------------------
  function handleConvClick(e) {
    const item = e.target.closest('.conv-item');
    if (!item) return;
    selectConv(Number(item.dataset.id));
    // Mobile: chuyen sang view chat-area khi user chu dong chon
    $('chatShell').classList.add('show-area');
  }

  function init() {
    techShell.init('chat');
    if (!me) {
      ui.toast('Cần đăng nhập trước', 'warning');
      return;
    }
    appSocket.connect();
    setupSocket();
    $('convList').addEventListener('click', handleConvClick);
    loadConvList();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
