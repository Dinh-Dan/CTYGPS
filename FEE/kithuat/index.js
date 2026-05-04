// Logic dashboard ky thuat — stats + cong viec hom nay + tin nhan chua doc

(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  const KIND_LABEL = { install: 'Lắp đặt', maintenance: 'Bảo trì', renew: 'Gia hạn', uninstall: 'Tháo gỡ' };
  const STATUS_PILL = {
    assigned:              '<span class="pill gray">Mới giao</span>',
    warehouse_released:    '<span class="pill blue">Đã xuất kho</span>',
    in_progress:           '<span class="pill amber">Đang làm</span>',
    done:                  '<span class="pill green">Xong</span>',
    customer_owes:         '<span class="pill amber">Khách còn nợ</span>',
    pending_admin_confirm: '<span class="pill amber">Chờ admin xác nhận</span>',
    staff_owes:            '<span class="pill amber">Bạn còn giữ tiền</span>',
    cancelled:             '<span class="pill red">Huỷ</span>',
  };
  const FINAL = ['done','customer_owes','staff_owes','pending_admin_confirm'];

  async function loadStats() {
    const me = await api.get('/kithuat/me', { silent: true }).catch(() => null);
    if (!me) return;
    $('s_today').textContent      = (me.active_tasks || 0);
    $('s_done').textContent       = (me.completed_tasks || 0);
    $('s_holding').textContent    = (me.holding_items || 0);
    $('s_unremitted').textContent = fmt.format(me.unremitted_amount || 0) + 'đ';
  }

  async function loadToday() {
    const res = await api.get('/kithuat/orders?today=1', { silent: true }).catch(() => null);
    if (!res) return;
    const tasks = (res.items || []).filter(t => !FINAL.includes(t.status) && t.status !== 'cancelled');
    if (!tasks.length) {
      $('todayList').innerHTML = '<div class="empty">Hôm nay chưa có công việc nào 🎉</div>';
      return;
    }
    $('todayList').innerHTML = tasks.map(t => {
      const due = Math.max(0, Number(t.total_amount || 0) - Number(t.paid_amount || 0));
      return `
      <div class="task-mini">
        <div class="info">
          <b>${escape(t.code)}</b> — ${KIND_LABEL[t.kind] || t.kind} ${STATUS_PILL[t.status] || ''}<br>
          <span class="text-muted">
            👤 ${escape(t.customer_name || '')}
            ${t.customer_phone ? ' · 📞 ' + escape(t.customer_phone) : ''}
            ${t.vehicle_plate ? ' · 🚗 ' + escape(t.vehicle_plate) : ''}
          </span><br>
          <span class="text-muted">💰 Còn thu: ${fmt.format(due)}đ</span>
        </div>
        <div>
          <a href="/kithuat/tasks.html#order-${t.id}" class="btn sm">Mở</a>
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
