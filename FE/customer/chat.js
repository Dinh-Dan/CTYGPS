// Logic chat khach — 1 cuoc tro chuyen duy nhat voi GPS Viet (admin + KTV).
// Co the truyen ?orderId=X tu trang don de tag tin nhan ve don do.
// Tin nhan co order_id se hien badge co the bam de mo chi tiet don.

(function () {
  const $ = (id) => document.getElementById(id);
  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  const me = auth.user();
  let convId = null;
  let messages = [];
  let pendingOrderId = null;     // tag don cho tin sap gui
  let pendingOrderCode = null;

  function fmtTime(ts) {
    return ts ? ts.replace('T', ' ').slice(0, 16) : '';
  }

  function orderBadgeHtml(m) {
    if (!m.order_id) return '';
    const code = m.order_code || ('Đơn #' + m.order_id);
    return `<a class="order-tag" href="/customer/my-orders.html#order-${m.order_id}">📦 ${escape(code)}</a>`;
  }

  function msgHtml(m) {
    const isMe = m.sender_type === 'customer' && m.sender_id === me.id;
    const theme = isMe ? 'on-blue' : 'on-white';
    const body = (window.chatMsg && chatMsg.render)
      ? chatMsg.render(m.content, { theme })
      : escape(m.content);
    return `
      <div class="msg ${isMe ? 'me' : 'them'}">
        ${orderBadgeHtml(m)}
        ${body}
        <span class="time">${fmtTime(m.sent_at)}</span>
      </div>
    `;
  }
  function render() {
    const box = $('msgsBox');
    box.innerHTML = messages.length ? messages.map(msgHtml).join('') :
      '<p class="text-muted text-center" style="padding:24px">Hãy gửi tin nhắn đầu tiên 👋</p>';
    if (window.chatMsg && chatMsg.hydrateThumbs) chatMsg.hydrateThumbs(box);
    box.scrollTop = box.scrollHeight;
  }

  function setBanner(orderId, orderCode) {
    pendingOrderId = orderId || null;
    pendingOrderCode = orderCode || null;
    const banner = $('orderBanner');
    if (orderId) {
      $('bannerOrderCode').textContent = orderCode || ('#' + orderId);
      banner.classList.add('on');
    } else {
      banner.classList.remove('on');
    }
  }

  async function init() {
    if (!me) {
      ui.toast('Cần đăng nhập', 'warning');
      ui.loginDialog();
      return;
    }
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId');

    // Lay conversation duy nhat cua khach (auto-create)
    const cv = await api.get('/customer/conversations/me').catch(() => null);
    if (!cv) return;
    convId = cv.id;

    // Lay messages
    const res = await api.get(`/customer/conversations/${convId}/messages`).catch(() => null);
    if (res) {
      messages = res.items || [];
      render();
    }

    // Neu tu trang don sang (orderId in URL) -> tag mac dinh tin sap gui
    if (orderId) {
      // Thu lay code tu /customer/orders
      const ords = await api.get('/customer/orders', { silent: true }).catch(() => null);
      const ord = (ords?.items || []).find(o => o.id === Number(orderId));
      setBanner(Number(orderId), ord ? ord.code : null);
    }

    // Connect socket + join
    appSocket.connect();
    appSocket.joinConversation(convId);
    appSocket.on('message:new', (m) => {
      if (m.conversation_id === convId && !messages.find(x => x.id === m.id)) {
        messages.push(m);
        render();
      }
    });

    $('msgForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const content = $('msgInput').value.trim();
      if (!content) return;
      $('msgInput').value = '';
      const body = { content };
      if (pendingOrderId) body.order_id = pendingOrderId;
      const msg = await api.post(`/customer/conversations/${convId}/messages`,
        body, { silent: true }).catch(() => null);
      if (msg && !messages.find(x => x.id === msg.id)) {
        messages.push(msg);
        render();
      }
    });
    $('bannerClear').addEventListener('click', () => setBanner(null, null));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
