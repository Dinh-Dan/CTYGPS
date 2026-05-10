// Logic dashboard ky thuat — stats + cong viec hom nay + tin nhan chua doc

(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  function statusPill(t) {
    if (t.status === 'cancelled') return '<span class="pill red">Huỷ</span>';
    if (t.completed_at) return '<span class="pill green">Đã xong</span>';
    return `<span class="pill blue">${escape(t.status)}</span>`;
  }

  async function loadStats() {
    const me = await api.get('/kithuat/me', { silent: true }).catch(() => null);
    if (!me) return;
    $('s_today').textContent      = (me.active_tasks || 0);
    $('s_done').textContent       = (me.completed_tasks || 0);
    $('s_holding').textContent    = (me.holding_items || 0);
    $('s_unremitted').textContent = fmt.format(me.unremitted_amount || 0) + 'đ';
  }

  async function loadToday() {
    const res = await api.get('/kithuat/orders?today=1&bucket=active', { silent: true }).catch(() => null);
    if (!res) return;
    const tasks = res.items || [];
    if (!tasks.length) {
      $('todayList').innerHTML = '<div class="empty">Hôm nay chưa có công việc nào 🎉</div>';
      return;
    }
    $('todayList').innerHTML = tasks.map(t => {
      const due = Math.max(0, Number(t.total_amount || 0) - Number(t.paid_amount || 0));
      return `
      <div class="task-mini">
        <div class="info">
          <b>${escape(t.code)}</b> — ${escape(t.template_names || t.template_name || '')} ${statusPill(t)}<br>
          <span class="text-muted">
            👤 ${escape(t.customer_name || '')}
            ${t.customer_phone ? ' · 📞 ' + escape(t.customer_phone) : ''}
          </span><br>
          <span class="text-muted">💰 Còn thu: ${fmt.format(due)}đ</span>
        </div>
        <div>
          <a href="/kithuat/tasks.html" class="btn sm">Mở</a>
        </div>
      </div>
    `;
    }).join('');
  }

  async function loadConversations() {
    const res = await api.get('/kithuat/conversations', { silent: true }).catch(() => null);
    if (!res) return;
    const unread = (res.items || []).filter(c => c.unread > 0);
    if (!unread.length) {
      $('msgList').innerHTML = '<div class="empty">Không có tin nhắn chưa đọc 💤</div>';
      return;
    }
    $('msgList').innerHTML = unread.slice(0, 5).map(c => `
      <div class="task-mini">
        <div class="info">
          <b>${escape(c.customer_name || '')}</b> <span class="pill blue">${escape(c.order_code)}</span><br>
          <span class="text-muted">${escape((c.last_msg || '').slice(0, 80))}</span>
        </div>
        <div>
          <span class="pill red">${c.unread}</span>
          <a href="/kithuat/chat.html#conv-${c.id}" class="btn sm">Trả lời</a>
        </div>
      </div>
    `).join('');
  }

  function init() {
    techShell.init('dashboard');
    loadStats();
    loadToday();
    loadConversations();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
