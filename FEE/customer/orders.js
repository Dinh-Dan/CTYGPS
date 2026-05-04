// Logic trang /customer/orders.html — dung cho ca khach le va dai ly.
// Tu 2026-04: dai ly len don nhu khach hang (customer_id = chinh minh).
// FE chi giu khac biet o stat-cards de dai ly thay tong tong/no nhanh.
(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  const STATUS_LABEL = {
    pending_review:        { text: 'Chờ duyệt',                cls: 'purple' },
    new:                   { text: 'Đã chốt — chờ xếp KTV',    cls: 'gray'   },
    assigned:              { text: 'Đã phân KTV',              cls: 'blue'   },
    warehouse_released:    { text: 'Đã xuất kho',              cls: 'cyan'   },
    in_progress:           { text: 'KTV đang làm',             cls: 'amber'  },
    customer_owes:         { text: 'Chưa thanh toán đủ',       cls: 'amber'  },
    pending_admin_confirm: { text: 'Đang đối chiếu thanh toán',cls: 'amber'  },
    staff_owes:            { text: 'Hoàn thành',               cls: 'green'  },
    done:                  { text: 'Hoàn thành',               cls: 'green'  },
    cancelled:             { text: 'Đã huỷ',                   cls: 'red'    },
    quoted:                { text: 'Đã báo giá — chờ khách',   cls: 'cyan'   },
    awaiting_payment:      { text: 'Chờ thanh toán',           cls: 'amber'  },
    payment_reported:      { text: 'Khách báo đã CK',          cls: 'blue'   },
  };
  const BADGE_STATUS_LABEL = {
    pending_review: { text: 'Chờ duyệt nội bộ', cls: 'gray' },
    submitted:      { text: 'Đã nộp Sở GTVT',   cls: 'blue' },
    approved:       { text: 'Có kết quả',       cls: 'green' },
    rejected:       { text: 'Bị từ chối',       cls: 'red' },
    delivered:      { text: 'Đã giao',          cls: 'purple' },
    cancelled:      { text: 'Đã huỷ',           cls: 'red' },
  };
  const VTYPE_LABEL = {
    'truck_under_3.5t': 'Tải dưới 3.5T',
    'truck_over_3.5t':  'Tải trên 3.5T',
    passenger: 'Xe khách', contract: 'Hợp đồng', taxi: 'Taxi', other: 'Khác',
  };
  const STAGE_LABEL = { receive: 'Lúc nhận hàng', deliver: 'Lúc bàn giao', other: 'Khác' };

  const state = { products: [], orders: [], isDealer: false };

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }
  function statusPill(s) {
    const def = STATUS_LABEL[s] || { text: s, cls: 'gray' };
    return `<span class="pill ${def.cls}">${def.text}</span>`;
  }
  function badgeStatusPill(s) {
    const def = BADGE_STATUS_LABEL[s] || { text: s, cls: 'gray' };
    return `<span class="pill ${def.cls}">${def.text}</span>`;
  }
  function fmtDate(d) {
    if (!d) return '—';
    return String(d).replace('T', ' ').slice(0, 16);
  }

  // ---- Render danh sach don ----------------------------------
  function renderDealerStats(orders) {
    const total = orders.length;
    const done = orders.filter(o => o.status === 'done').length;
    const debt = orders
      .filter(o => o.status === 'done' && Number(o.total_amount) > Number(o.paid_amount))
      .reduce((s, o) => s + (Number(o.total_amount) - Number(o.paid_amount)), 0);
    $('stat-total').textContent = total;
    $('stat-done').textContent = done;
    $('stat-debt').textContent = fmt.format(debt) + 'đ';
  }

  function renderOrders(orders) {
    if (state.isDealer) renderDealerStats(orders);

    if (!orders.length) {
      $('ordersList').innerHTML = `<div class="text-center text-muted" style="padding:40px">Bạn chưa có đơn nào. Bấm "Tạo đơn mới" để bắt đầu.</div>`;
      return;
    }
    $('ordersList').innerHTML = orders.map(o => {
      const isBadge = o.service_kind === 'badge';
      const statusCell = isBadge && o.badge_status ? badgeStatusPill(o.badge_status) : statusPill(o.status);
      const meta = isBadge
        ? `🪪 Phù hiệu xe${o.vehicle_plate ? ' · biển ' + escape(o.vehicle_plate) : ''}${o.badge_vehicle_type ? ' · ' + (VTYPE_LABEL[o.badge_vehicle_type] || o.badge_vehicle_type) : ''}`
        : `${o.item_count} sản phẩm · ${o.task_count} task${o.area ? ' · ' + escape(o.area) : ''}${o.vehicle_plate ? ' · ' + escape(o.vehicle_plate) : ''}`;
      return `
      <div class="order-card" data-id="${o.id}">
        <div class="head">
          <div>
            <b>${escape(o.code)}</b>
            ${o.service_kind ? `<span class="pill blue">${escape(SERVICE_KIND_LABEL[o.service_kind] || o.service_kind)}</span>` : ''}
            ${statusCell}
          </div>
          <button class="btn ghost sm" data-act="detail" data-id="${o.id}">Chi tiết</button>
        </div>
        <div class="meta">${meta}</div>
        <div>
          Tổng tiền: <b>${fmt.format(o.total_amount || 0)}đ</b>
          ${Number(o.paid_amount) > 0 ? ` · Đã thanh toán: ${fmt.format(o.paid_amount)}đ` : ''}
          ${Number(o.total_amount) > Number(o.paid_amount || 0) && o.status === 'done' && !o.debt_carried_at
            ? ` · <span style="color:var(--danger)">Còn nợ: ${fmt.format(o.total_amount - o.paid_amount)}đ</span>`
            : ''}
          ${o.debt_carried_at && Number(o.total_amount) > Number(o.paid_amount || 0)
            ? ` · <span style="color:#16a34a">Đã tất toán</span>`
            : ''}
        </div>
      </div>
    `;}).join('');
  }

  async function loadOrders(silent) {
    const opts = silent ? { silent: true } : undefined;
    const res = await api.get('/customer/orders', opts).catch(() => null);
    if (!res) return;
    state.orders = res.items || [];
    renderOrders(state.orders);
  }

  async function loadProducts() {
    const res = await api.get('/public/products', { silent: true }).catch(() => null);
    state.products = (res && res.items) || (res && Array.isArray(res) ? res : []);
  }

  // ---- Modal tao don ------------------------------------------
  const SERVICE_KIND_LABEL = {
    install: 'Lắp mới', renewal: 'Gia hạn',
    maintenance: 'Sửa chữa', warranty: 'Bảo hành',
    badge: 'Phù hiệu xe',
  };

  function syncServiceKind() {
    const v = (document.querySelector('input[name="service_kind"]:checked') || {}).value || 'install';
    // Items field chi can voi 'install'. Cac loai khac dua tren bien so xe.
    const showItems = v === 'install';
    $('itemsField').style.display = showItems ? '' : 'none';
    // Plate bat buoc voi cac loai con lai
    $('f_plate').required = !showItems;

    // Don gia han: hien field TK app theo doi (subscription_account)
    // de admin tra cuu trên 5g khi bao gia.
    const renewalEl = $('renewalFields');
    if (renewalEl) renewalEl.style.display = v === 'renewal' ? '' : 'none';
    // Renewal: dia chi khong bat buoc (khong co viec lap dat tan noi).
    const addrEl = $('f_address');
    if (addrEl) addrEl.required = v !== 'renewal';
    // Tinh chinh placeholder note theo loai
    const noteEl = $('f_note');
    if (noteEl) {
      noteEl.placeholder = v === 'renewal'
        ? 'Số xe muốn gia hạn, biển số nếu nhớ, số năm muốn gia hạn...'
        : 'VD: Lắp giùm sáng mai...';
    }
  }

  function openModal() {
    $('modal').classList.add('open');
    $('f_area').value = '';
    $('f_plate').value = '';
    $('f_address').value = '';
    $('f_note').value = '';
    const subEl = $('f_sub_account');
    if (subEl) subEl.value = '';
    document.querySelectorAll('input[name="service_kind"]').forEach((r, i) => { r.checked = i === 0; });
    syncServiceKind();
    $('itemsList').innerHTML = '';
    addItemRow();
  }
  function closeModal() { $('modal').classList.remove('open'); }

  function itemRowHtml(idx) {
    const opts = ['<option value="">— Chọn sản phẩm —</option>']
      .concat(state.products.map(p => `<option value="${p.id}">${escape(p.code + ' — ' + p.name)}</option>`))
      .join('');
    return `
      <div class="item-row">
        <select class="select item-product">${opts}</select>
        <input type="number" class="input item-qty" min="1" value="1" placeholder="SL">
        <button type="button" class="btn ghost item-del" title="Xoá">×</button>
      </div>
    `;
  }
  function addItemRow() {
    const idx = $('itemsList').children.length;
    $('itemsList').insertAdjacentHTML('beforeend', itemRowHtml(idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const serviceKind = (document.querySelector('input[name="service_kind"]:checked') || {}).value || 'install';
    const items = [];
    $('itemsList').querySelectorAll('.item-row').forEach(row => {
      const product_id = Number(row.querySelector('.item-product').value);
      const qty = Math.max(1, Number(row.querySelector('.item-qty').value) || 1);
      if (product_id) items.push({ product_id, qty });
    });
    if (serviceKind === 'install' && !items.length) return ui.toast('Chọn ít nhất 1 sản phẩm', 'warning');
    // Renewal: bien so co the nhieu xe -> ghi vao note, khong bat buoc f_plate.
    // Maintenance/warranty: 1 xe -> bat buoc bien so.
    if (['maintenance', 'warranty'].includes(serviceKind) && !$('f_plate').value.trim())
      return ui.toast('Nhập biển số xe', 'warning');
    if (serviceKind === 'renewal' && !$('f_note').value.trim() && !$('f_plate').value.trim())
      return ui.toast('Ghi rõ số xe / biển số muốn gia hạn vào ô ghi chú', 'warning');
    if (serviceKind !== 'renewal' && !$('f_address').value.trim())
      return ui.toast('Nhập địa chỉ', 'warning');

    const data = {
      service_kind: serviceKind,
      items: serviceKind === 'install' ? items : [],
      area: $('f_area').value.trim() || null,
      address: $('f_address').value.trim() || null,
      vehicle_plate: $('f_plate').value.trim() || null,
      subscription_account: ($('f_sub_account') && $('f_sub_account').value.trim()) || null,
      note: $('f_note').value.trim() || null,
    };
    $('btnSave').disabled = true;
    const r = await api.post('/customer/orders', data, {
      successMessage: 'Đã gửi yêu cầu. Admin sẽ liên hệ chốt giá.',
      loading: true,
    }).catch(() => null);
    $('btnSave').disabled = false;
    if (!r) return;
    closeModal();
    loadOrders();
  }

  // ---- Modal chi tiet ----------------------------------------
  async function openDetail(id) {
    const res = await api.get('/customer/orders/' + id, { loading: true }).catch(() => null);
    if (!res) return;
    const _titleStatus = res.service_kind === 'badge'
      ? (BADGE_STATUS_LABEL[(res.badge && res.badge.status) || 'pending_review'] || { text: '?', cls: 'gray' })
      : (STATUS_LABEL[res.status] || { text: res.status, cls: 'gray' });
    $('detailTitle').innerHTML =
      `Đơn ${escape(res.code)} `
      + `<span class="pill ${_titleStatus.cls}" style="font-size:14px;padding:4px 12px;vertical-align:middle;margin-left:6px">${escape(_titleStatus.text)}</span>`;

    // Don phu hieu xe — render readonly view, khach khong tu duyet/nop
    if (res.service_kind === 'badge') {
      const b = res.badge || {};
      $('detailBody').innerHTML = `
        <div class="grid cols-2" style="font-size:14px">
          <div><b>Loại đơn:</b> 🪪 Phù hiệu xe</div>
          <div><b>Mã hồ sơ:</b> ${escape(b.code || '—')}</div>
          <div><b>Biển số:</b> <b>${escape(b.vehicle_plate || res.vehicle_plate || '')}</b></div>
          <div><b>Loại xe:</b> ${VTYPE_LABEL[b.vehicle_type] || b.vehicle_type || '—'}</div>
          <div><b>Phí:</b> ${fmt.format(b.fee_amount || res.total_amount || 0)}đ</div>
          <div><b>Đã thanh toán:</b> ${fmt.format(b.paid_amount || res.paid_amount || 0)}đ</div>
          <div><b>Nộp Sở:</b> ${fmtDate(b.submitted_at)}</div>
          <div><b>Có kết quả:</b> ${fmtDate(b.result_at)}</div>
          <div><b>Đã giao:</b> ${fmtDate(b.delivered_at)}</div>
        </div>
        ${b.reject_reason ? `<div style="margin-top:8px;background:#fee2e2;padding:8px;border-radius:6px"><b>Lý do từ chối:</b> ${escape(b.reject_reason)}</div>` : ''}
        ${res.note ? `<div style="margin-top:8px"><b>Ghi chú:</b> ${escape(res.note)}</div>` : ''}
      `;
      $('detailModal').classList.add('open');
      return;
    }

    const itemsHtml = res.items.length ? `
      <table class="data" style="width:100%">
        <thead><tr><th>SP</th><th style="width:60px">SL</th><th style="width:120px">Đơn giá</th></tr></thead>
        <tbody>${res.items.map(it => `
          <tr><td>${escape(it.product_name)}</td><td>${it.qty}</td><td>${fmt.format(it.unit_price)}đ</td></tr>
        `).join('')}</tbody>
      </table>
    ` : '<p class="text-muted">—</p>';

    const chargesHtml = res.charges && res.charges.length ? `
      <ul style="margin:6px 0;padding-left:20px">
        ${res.charges.map(c => `<li>${escape(c.label)}: <b>${fmt.format(c.amount)}đ</b></li>`).join('')}
      </ul>
    ` : '<p class="text-muted">—</p>';

    const att = res.attachments || [];
    const attHtml = att.length
      ? `<div class="att-grid">${att.map(a => `<img src="${escape(a.url)}" data-img="${escape(a.url)}" title="${STAGE_LABEL[a.stage] || ''}">`).join('')}</div>`
      : '';
    const tasksHtml = res.assigned_staff_id ? `
      <div style="padding:10px;background:#f8fafc;border-radius:8px;margin-bottom:8px;border-left:3px solid var(--primary)">
        <div><b>${escape(res.code)}</b> ${statusPill(res.status)}</div>
        ${res.staff_name ? `<div style="font-size:13px;margin-top:4px">👨‍🔧 KTV: <b>${escape(res.staff_name)}</b>${res.staff_phone ? ' — ' + escape(res.staff_phone) : ''}</div>` : ''}
        ${res.due_at ? `<div class="text-muted" style="font-size:13px">Hạn: ${escape(String(res.due_at).replace('T',' ').slice(0,16))}</div>` : ''}
        ${attHtml}
      </div>
    ` : '<p class="text-muted">Đơn chưa được phân công</p>';

    // Don gia han khong qua KTV/kho -> khong hien khu vuc/dia chi/tien trinh.
    const isRenewal = res.service_kind === 'renewal';
    const remaining = Number(res.total_amount) - Number(res.paid_amount);
    const debtNote = res.debt_carried_at
      ? `<span style="color:#16a34a;font-weight:600">Đã tất toán công nợ</span>`
      : (remaining > 0 && res.status === 'done'
          ? `<span style="color:var(--danger);font-weight:600">Còn nợ ${fmt.format(remaining)}đ</span>`
          : '');

    $('detailBody').innerHTML = `
      <div class="grid cols-2" style="font-size:14px">
        <div><b>Tổng:</b> <b>${fmt.format(res.total_amount)}đ</b></div>
        <div><b>Đã thanh toán:</b> ${fmt.format(res.paid_amount)}đ${debtNote ? ' · ' + debtNote : ''}</div>
        ${isRenewal ? '' : `<div><b>Khu vực:</b> ${escape(res.area || '—')}</div>`}
        <div><b>Biển số:</b> ${escape(res.vehicle_plate || '—')}</div>
        <div><b>Ngày chốt:</b> ${res.confirmed_at ? escape(String(res.confirmed_at).replace('T',' ').slice(0,16)) : '—'}</div>
      </div>
      ${isRenewal ? '' : `<div style="margin-top:8px"><b>Địa chỉ:</b> ${escape(res.address || '—')}</div>`}
      ${res.note ? `<div style="margin-top:8px"><b>Ghi chú:</b> ${escape(res.note)}</div>` : ''}
      <hr style="margin:12px 0">
      <h4>📦 Sản phẩm</h4>
      ${itemsHtml}
      <h4 style="margin-top:12px">💵 Phí khác / Giảm giá</h4>
      ${chargesHtml}
      ${isRenewal ? '' : `<h4 style="margin-top:12px">🛠 Tiến trình</h4>${tasksHtml}`}
    `;
    $('detailModal').classList.add('open');
  }
  function closeDetail() { $('detailModal').classList.remove('open'); }

  // ---- Init ---------------------------------------------------
  // Dai ly hanh xu nhu khach hang — chi giu khac biet o stat-cards
  // (de dai ly thay tong don / cong no nhanh).
  function applyRole(u) {
    state.isDealer = u && u.role === 'daily';
    document.body.classList.toggle('role-daily', state.isDealer);
  }

  function showUser() {
    const u = auth.user();
    if (!u) return;
    applyRole(u);
    const display = u.company_name || u.full_name || '';
    $('userInfo').textContent = display + (u.phone ? ' • ' + u.phone : '');
  }

  // ---- Badge modal -------------------------------------------
  let bgUploads = [];

  function openBadgeModal() {
    $('badgeModal').classList.add('open');
    $('bg_plate').value = '';
    $('bg_note').value = '';
    bgUploads = [];
    renderBgUploads();
  }
  function closeBadgeModal() { $('badgeModal').classList.remove('open'); }

  function renderBgUploads() {
    const wrap = $('bg_uploads');
    if (!wrap) return;
    if (!bgUploads.length) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = bgUploads.map(u => `
      <div class="row" style="gap:6px;align-items:center;padding:5px;border:1px solid var(--border);border-radius:6px;background:#fff">
        ${u.uploading
          ? '<div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:#f1f5f9;border-radius:4px;font-size:11px;color:#64748b">…</div>'
          : `<a href="${u.url}" target="_blank" rel="noopener"><img src="${u.url}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;display:block"></a>`}
        <input type="text" class="input bg-cap" data-id="${u._id}" value="${(u.caption||'').replace(/"/g,'&quot;')}" placeholder="Mô tả" style="flex:1;font-size:13px">
        <button type="button" class="btn ghost sm bg-rm" data-id="${u._id}">×</button>
      </div>
    `).join('');
  }

  async function handleBgFiles(files) {
    for (const f of files) {
      if (!/^image\//.test(f.type)) {
        ui.toast(`${f.name}: chỉ hỗ trợ ảnh`, 'warning');
        continue;
      }
      const item = { url:'', caption:f.name, uploading:true, _id: Math.random().toString(36).slice(2) };
      bgUploads.push(item);
      renderBgUploads();
      try {
        item.url = await imgbb.upload(f, { name: 'badge-' + Date.now() });
        item.uploading = false;
      } catch (err) {
        ui.toast(`${f.name}: ${err.message || 'lỗi tải lên'}`, 'error');
        bgUploads = bgUploads.filter(x => x !== item);
      }
      renderBgUploads();
    }
  }

  async function handleBadgeSubmit(e) {
    e.preventDefault();
    if (!$('bg_plate').value.trim()) return ui.toast('Nhập biển số', 'warning');
    if (bgUploads.some(u => u.uploading)) return ui.toast('Đợi tệp tải xong', 'warning');

    const data = {
      vehicle_plate: $('bg_plate').value.trim(),
      note: $('bg_note').value.trim() || null,
      attachments: bgUploads
        .filter(u => u.url)
        .map(u => ({ url: u.url, caption: u.caption || null, kind: 'other' })),
    };
    const r = await api.post('/customer/badges', data, {
      successMessage: 'Đã gửi yêu cầu phù hiệu',
      loading: true,
    }).catch(() => null);
    if (r) { closeBadgeModal(); loadOrders(); }
  }

  // Mo modal don tu hash #order-<id> (vd: tu chat khach bam vao tag don).
  function maybeOpenFromHash() {
    const m = /^#order-(\d+)$/.exec(location.hash || '');
    if (m) openDetail(Number(m[1]));
  }

  function init() {
    showUser();
    Promise.all([loadProducts(), loadOrders()]).then(maybeOpenFromHash);
    window.addEventListener('hashchange', maybeOpenFromHash);

    $('btnNewOrder').addEventListener('click', openModal);
    $('btnNewBadge').addEventListener('click', openBadgeModal);
    document.querySelectorAll('input[name="service_kind"]').forEach(r => {
      r.addEventListener('change', syncServiceKind);
    });
    $('badgeClose').addEventListener('click', closeBadgeModal);
    $('badgeCancel').addEventListener('click', closeBadgeModal);
    $('badgeModal').addEventListener('click', (e) => { if (e.target.id === 'badgeModal') closeBadgeModal(); });
    $('badgeFrm').addEventListener('submit', handleBadgeSubmit);

    $('btnBgAddFile').addEventListener('click', () => $('bg_file_input').click());
    $('bg_file_input').addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      await handleBgFiles(files);
    });
    $('bg_uploads').addEventListener('click', (e) => {
      const rm = e.target.closest('.bg-rm');
      if (!rm) return;
      bgUploads = bgUploads.filter(x => x._id !== rm.dataset.id);
      renderBgUploads();
    });
    $('bg_uploads').addEventListener('input', (e) => {
      if (!e.target.classList.contains('bg-cap')) return;
      const it = bgUploads.find(x => x._id === e.target.dataset.id);
      if (it) it.caption = e.target.value;
    });
    $('btnAddItem').addEventListener('click', addItemRow);
    $('modalClose').addEventListener('click', closeModal);
    $('btnCancel').addEventListener('click', closeModal);
    $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    $('frm').addEventListener('submit', handleSubmit);
    $('itemsList').addEventListener('click', (e) => {
      const del = e.target.closest('.item-del');
      if (del) del.closest('.item-row').remove();
    });

    $('detailClose').addEventListener('click', closeDetail);
    $('detailCloseBtn').addEventListener('click', closeDetail);
    $('detailModal').addEventListener('click', (e) => { if (e.target.id === 'detailModal') closeDetail(); });
    $('detailBody').addEventListener('click', (e) => {
      const img = e.target.closest('img[data-img]');
      if (img) {
        $('imgEl').src = img.dataset.img;
        $('imgModal').classList.add('open');
      }
    });

    $('ordersList').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act="detail"]');
      if (btn) openDetail(btn.dataset.id);
    });

    $('imgClose').addEventListener('click', () => $('imgModal').classList.remove('open'));
    $('imgModal').addEventListener('click', (e) => { if (e.target.id === 'imgModal') $('imgModal').classList.remove('open'); });

    setInterval(() => {
      if (document.hidden) return;
      if (document.querySelector('.modal-bg.open')) return;
      loadOrders(true);
    }, 3000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
