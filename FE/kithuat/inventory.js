// Logic trang KTV - inventory v2 (theo qty + release_pool)

(function () {
  const $ = (id) => document.getElementById(id);

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  const state = {
    holdings: [],        // staff_holdings của KTV này
    pool: [],            // release_pool đang chờ KTV nhận
    orders: [],          // đơn assigned/warehouse_released/in_progress để chọn install
    products: [],        // product_stock có hàng (cho take-direct)
    returnRequests: [],  // yêu cầu trả kho đang pending
    warrantyBag: [],
    warrantyDelivery: [],
    warrantyCompany: [],
  };

  function isStale(d) {
    if (!d) return false;
    const dt = new Date(String(d).replace(' ', 'T'));
    return (Date.now() - dt.getTime()) > 3 * 24 * 60 * 60 * 1000;
  }
  function fmtDate(d) {
    if (!d) return '';
    return String(d).replace('T', ' ').slice(0, 16);
  }

  // ==================== LOAD ====================
  async function loadHoldings() {
    const res = await api.get('/kithuat/inventory').catch(() => null);
    if (!res) return;
    state.holdings = res.items || [];
    renderHoldings();
    renderStats();
  }
  async function loadPool() {
    const res = await api.get('/kithuat/inventory/available').catch(() => null);
    if (!res) return;
    state.pool = res.items || [];
    renderPool();
    renderStats();
  }
  async function loadTasks() {
    const res = await api.get('/kithuat/orders?status=new', { silent: true }).catch(() => null);
    const r2  = await api.get('/kithuat/orders?status=in_progress', { silent: true }).catch(() => null);
    state.orders = [...(res?.items || []), ...(r2?.items || [])];
  }
  async function loadReturnRequests() {
    const res = await api.get('/kithuat/inventory/return-requests?status=pending', { silent: true }).catch(() => null);
    state.returnRequests = (res && res.items) || [];
    renderReturnRequests();
  }

  async function loadProducts(q) {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    const res = await api.get('/kithuat/inventory/available-stock?' + p.toString(), { silent: true }).catch(() => null);
    state.products = res ? res.items || [] : [];
    renderProductSelect();
  }
  async function loadWarrantyWorklist() {
    const res = await api.get('/kithuat/warranty/worklist', { silent: true }).catch(() => null);
    if (!res) return;
    state.warrantyBag = res.technician_bag || [];
    state.warrantyDelivery = res.waiting_delivery || [];
    state.warrantyCompany = res.company_flow || [];
    renderWarrantyWorklist();
  }

  // ==================== RENDER ====================
  function renderStats() {
    const total = state.holdings.reduce((s, h) => s + Number(h.qty), 0);
    const stale = state.holdings.filter(h => isStale(h.first_held_at))
                                .reduce((s, h) => s + Number(h.qty), 0);
    $('s_total').textContent = total;
    $('s_stale').textContent = stale;
  }

  function renderPool() {
    // Sau khi gop /release-stock voi auto-take, pool gan nhu luon rong.
    // Chi hien block khi co data legacy con dư.
    const block = $('poolBlock');
    if (!state.pool.length) {
      if (block) block.style.display = 'none';
      $('poolList').innerHTML = '';
      return;
    }
    if (block) block.style.display = '';
    $('poolList').innerHTML = state.pool.map(p => `
      <div class="pool-card">
        <div class="qty-big">${p.qty}</div>
        <div class="meta">
          <div><b>${escape(p.product_code)}</b> — ${escape(p.product_name)}</div>
          <div class="text-muted" style="font-size:13px;margin-top:3px">
            Đơn <b>${escape(p.order_code || '')}</b>
            ${p.customer_name ? ' · ' + escape(p.customer_name) : ''}
          </div>
          ${p.address ? `<div class="text-muted" style="font-size:12.5px">📍 ${escape(p.address)}</div>` : ''}
        </div>
        <button class="btn" data-act="take-pool" data-order="${p.order_id}" data-product="${p.product_id}" data-name="${escape(p.product_code + ' — ' + p.product_name)}" data-order-code="${escape(p.order_code || '')}" data-max="${p.qty}">Nhận</button>
      </div>
    `).join('');
  }

  function renderHoldings() {
    if (!state.holdings.length) {
      $('tbody').innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding:24px">Chưa giữ thiết bị nào</td></tr>';
      return;
    }
    $('tbody').innerHTML = state.holdings.map(h => {
      const stale = isStale(h.first_held_at);
      return `
        <tr class="${stale ? 'stale' : ''}">
          <td data-label="SKU"><b>${escape(h.product_code)}</b></td>
          <td data-label="Tên thiết bị">${escape(h.product_name)}</td>
          <td data-label="Số lượng"><b>${h.qty}</b></td>
          <td data-label="Ngày nhận đầu">${escape(fmtDate(h.first_held_at))}</td>
          <td data-label="Số ngày" ${stale ? 'style="color:#dc2626;font-weight:600"' : ''}>${h.days_held} ngày</td>
          <td data-label="Hành động">
            <button class="btn sm success" data-act="install" data-product="${h.product_id}" data-name="${escape(h.product_code + ' — ' + h.product_name)}" data-max="${h.qty}">Đã lắp</button>
            <button class="btn ghost sm" data-act="return" data-product="${h.product_id}" data-name="${escape(h.product_code + ' — ' + h.product_name)}" data-max="${h.qty}">Trả kho</button>
          </td>
        </tr>`;
    }).join('');
  }

  function renderReturnRequests() {
    const block = $('returnReqBlock');
    const list  = $('returnReqList');
    if (!block || !list) return;
    if (!state.returnRequests.length) {
      block.style.display = 'none';
      list.innerHTML = '';
      return;
    }
    block.style.display = '';
    list.innerHTML = state.returnRequests.map(r => `
      <div class="pool-card" style="border-left:3px solid #6366f1">
        <div class="meta">
          <div><b>${escape(r.product_code)}</b> — ${escape(r.product_name)} &nbsp;·&nbsp; SL: <b>${r.qty}</b></div>
          <small class="text-muted">Gửi lúc ${fmtDate(r.created_at)}${r.note ? ' · ' + escape(r.note) : ''}</small>
        </div>
        <span class="pill" style="background:#ede9fe;color:#5b21b6;flex-shrink:0">Chờ duyệt</span>
      </div>
    `).join('');
  }

  function renderProductSelect() {
    $('tdProduct').innerHTML = '<option value="">— Chọn —</option>'
      + state.products.map(p => `<option value="${p.product_id}" data-stock="${p.quantity}">${escape(p.code)} — ${escape(p.name)} (còn ${p.quantity})</option>`).join('');
  }

  function renderWarrantyCards(blockId, listId, rows, emptyText, badgeText, badgeStyle) {
    const block = $(blockId);
    const list = $(listId);
    if (!block || !list) return;
    if (!rows.length) {
      block.style.display = 'none';
      list.innerHTML = '';
      return;
    }
    block.style.display = '';
    list.innerHTML = rows.map((row) => `
      <div class="pool-card" style="border-left:3px solid ${badgeStyle.border}">
        <div class="meta">
          <div><b>${escape(row.product_code || '')}</b>${row.product_code ? ' - ' : ''}${escape(row.product_name || row.device_name || ('Item #' + row.id))}</div>
          <div class="text-muted" style="font-size:13px;margin-top:3px">
            Đơn <b>${escape(row.order_code || '')}</b>
            ${row.customer_name ? ' - ' + escape(row.customer_name) : ''}
            ${row.customer_phone ? ' - ' + escape(row.customer_phone) : ''}
          </div>
          <div class="text-muted" style="font-size:12.5px;margin-top:2px">
            ${row.imei ? `IMEI ${escape(row.imei)}` : ''}
            ${row.license_plate ? `${row.imei ? ' - ' : ''}BS ${escape(row.license_plate)}` : ''}
          </div>
          ${(() => {
            const HL = { tech_fix: 'KTV sửa nội bộ', exchange: 'Đổi thiết bị', supplier_return: 'Gửi NCC' };
            return row.handling_type && HL[row.handling_type]
              ? `<div style="font-size:12.5px;margin-top:3px;color:#1d4ed8;font-weight:600">Hướng xử lý: ${escape(HL[row.handling_type])}</div>`
              : `<div style="font-size:12.5px;margin-top:3px;color:#92400e">Chưa chọn hướng xử lý</div>`;
          })()}
          <div class="text-muted" style="font-size:12.5px;margin-top:2px">
            ${row.replacement_product_name ? `Hàng giao khách: <b>${escape(row.replacement_product_name)}</b>` : emptyText}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
          <span class="pill" style="background:${badgeStyle.bg};color:${badgeStyle.fg};flex-shrink:0">${escape(badgeText)}</span>
          <a class="btn ghost sm" href="/kithuat/tasks.html#order-${row.order_id}">Mở đơn</a>
          ${row.current_status === 'technician_holding' ? `<button class="btn sm btnWReturn" data-order="${row.order_id}" data-item="${row.id}" style="background:#7c3aed">Trả về kho</button>` : ''}
          ${row.current_status === 'pending_company_receipt' ? `<span class="pill" style="background:#fef9c3;color:#854d0e;flex-shrink:0">Đã gửi · chờ kho xác nhận</span>` : ''}
        </div>
      </div>
    `).join('');
    list.querySelectorAll('.btnWReturn').forEach((btn) => {
      btn.addEventListener('click', () => returnWarrantyToStock(Number(btn.dataset.order), Number(btn.dataset.item)));
    });
  }

  async function returnWarrantyToStock(orderId, itemId) {
    if (!orderId || !itemId) return;
    const ok = await ui.confirm({ title: 'Gửi hàng lỗi về kho', message: 'Xác nhận đã giao sản phẩm lỗi này về kho bảo hành công ty? Kho/admin sẽ xác nhận đã nhận.' });
    if (!ok) return;
    const r = await api.post(`/kithuat/orders/${orderId}/warranty/moves`, {
      warranty_item_id: itemId,
      action_code: 'handover_to_company',
    }, { onError: 'toast' });
    if (r) {
      ui.toast('Đã gửi về kho — chờ kho/admin xác nhận nhận hàng', 'success');
      loadWarrantyWorklist();
    }
  }

  function renderWarrantyWorklist() {
    renderWarrantyCards('warrantyBagBlock', 'warrantyBagList', state.warrantyBag, 'Đồ lỗi đang ở túi KTV', 'Đang giữ', { bg: '#dbeafe', fg: '#1d4ed8', border: '#3b82f6' });
    renderWarrantyCards('warrantyDeliveryBlock', 'warrantyDeliveryList', state.warrantyDelivery, 'Đang chờ bạn mang đi giao khách', 'Cần giao', { bg: '#dcfce7', fg: '#166534', border: '#22c55e' });
    renderWarrantyCards('warrantyCompanyBlock', 'warrantyCompanyList', state.warrantyCompany, 'Đang ở kho công ty hoặc đang chờ NCC', 'Chờ xử lý', { bg: '#fef3c7', fg: '#92400e', border: '#f59e0b' });
  }

  // ==================== ACTIONS ====================
  // Nhận từ pool
  function openTakePool(orderId, productId, productName, orderCode, maxQty) {
    $('tp_order_id').value = orderId;
    $('tp_product_id').value = productId;
    $('tp_task_label').textContent = orderCode;
    $('tp_product_label').textContent = productName;
    $('tp_qty').value = maxQty;
    $('tp_qty').max = maxQty;
    $('tp_help').textContent = `Tối đa: ${maxQty}`;
    $('takePoolModal').classList.add('open');
  }
  async function submitTakePool(e) {
    e.preventDefault();
    const orderId = Number($('tp_order_id').value);
    const productId = Number($('tp_product_id').value);
    const qty = Number($('tp_qty').value);
    const ok = await api.post('/kithuat/inventory/take',
      { order_id: orderId, product_id: productId, qty },
      { successMessage: 'Đã nhận thiết bị', loading: true }
    ).catch(() => null);
    if (!ok) return;
    $('takePoolModal').classList.remove('open');
    await loadPool();
    await loadHoldings();
  }

  // Nhận trực tiếp
  function openTakeDirect() {
    $('tdSearch').value = '';
    $('tdQty').value = 1;
    $('tdNote').value = '';
    loadProducts('');
    $('takeDirectModal').classList.add('open');
  }
  async function submitTakeDirect(e) {
    e.preventDefault();
    const productId = Number($('tdProduct').value);
    const qty = Number($('tdQty').value);
    if (!productId) return ui.toast('Chọn sản phẩm', 'warning');
    const ok = await api.post('/kithuat/inventory/take-direct',
      { product_id: productId, qty, reason_text: $('tdNote').value.trim() || null },
      { successMessage: 'Đã nhận', loading: true }
    ).catch(() => null);
    if (!ok) return;
    $('takeDirectModal').classList.remove('open');
    await loadHoldings();
  }

  // Gửi yêu cầu trả kho
  function openReturn(productId, name, maxQty) {
    $('rt_product_id').value = productId;
    $('rt_label').textContent = name;
    $('rt_qty').value = maxQty;
    $('rt_qty').max = maxQty;
    $('rt_holding').textContent = maxQty;
    $('rt_note').value = '';
    $('returnModal').classList.add('open');
  }
  async function submitReturn(e) {
    e.preventDefault();
    const productId = Number($('rt_product_id').value);
    const qty = Number($('rt_qty').value);
    const note = $('rt_note').value.trim() || null;
    const ok = await api.post('/kithuat/inventory/return',
      { product_id: productId, qty, note },
      { successMessage: 'Đã gửi yêu cầu trả kho, chờ admin duyệt', loading: true }
    ).catch(() => null);
    if (!ok) return;
    $('returnModal').classList.remove('open');
    await loadReturnRequests();
  }

  // Đã lắp
  function openInstall(productId, name, maxQty) {
    $('i_product_id').value = productId;
    $('i_label').textContent = name;
    $('i_qty').value = maxQty;
    $('i_qty').max = maxQty;
    $('i_holding').textContent = maxQty;
    $('i_imei').value = '';
    $('i_plate').value = '';
    $('i_task').innerHTML = '<option value="">— Chọn đơn —</option>'
      + state.orders.map(t => `<option value="${t.id}">${escape(t.code + ' — ' + (t.customer_name || ''))}</option>`).join('');
    $('installModal').classList.add('open');
  }
  async function submitInstall(e) {
    e.preventDefault();
    const orderId = Number($('i_task').value);
    if (!orderId) return ui.toast('Chọn đơn', 'warning');
    const productId = Number($('i_product_id').value);
    const qty = Number($('i_qty').value);
    const ok = await api.post('/kithuat/inventory/install', {
      order_id: orderId,
      product_id: productId,
      qty,
      imei_list: $('i_imei').value.trim() || null,
    }, { successMessage: 'Đã đánh dấu đã lắp', loading: true }).catch(() => null);
    if (!ok) return;
    $('installModal').classList.remove('open');
    await loadHoldings();
  }

  // ==================== EVENT BINDINGS ====================
  function handlePoolClick(e) {
    const btn = e.target.closest('button[data-act="take-pool"]');
    if (!btn) return;
    openTakePool(
      Number(btn.dataset.order),
      Number(btn.dataset.product),
      btn.dataset.name,
      btn.dataset.orderCode,
      Number(btn.dataset.max)
    );
  }
  function handleTableClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    const productId = Number(btn.dataset.product);
    const name = btn.dataset.name;
    const max = Number(btn.dataset.max);
    if (act === 'return')       openReturn(productId, name, max);
    else if (act === 'install') openInstall(productId, name, max);
  }

  function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  // ==================== STAFF STOCK ISSUES ====================
  async function loadIssues() {
    const r = await api.get('/kithuat/staff-issues?status=approved&limit=50', { silent: true })
      .catch(() => null);
    const items = (r && r.items) || [];
    renderIssues(items);
  }
  function renderIssues(items) {
    const block = $('issuesBlock');
    const list  = $('issuesList');
    if (!block || !list) return;
    if (!items.length) { block.style.display = 'none'; list.innerHTML = ''; return; }
    block.style.display = '';
    list.innerHTML = items.map(it => `
      <div class="pool-card">
        <div class="meta">
          <div><b>${escape(it.code)}</b> · ${it.line_count} dòng · SL ${it.total_approved}</div>
          <small class="text-muted">Duyệt lúc ${fmtDate(it.approved_at)}${it.note ? ' · ' + escape(it.note) : ''}</small>
        </div>
        <button class="btn primary" data-issue-id="${it.id}" data-act="open-issue">Xem & xác nhận</button>
      </div>
    `).join('');
  }

  async function openIssue(id) {
    const d = await api.get(`/kithuat/staff-issues/${id}`).catch(() => null);
    if (!d) return;
    const lines = d.items.map(it => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0">${escape(it.product_code)} · ${escape(it.product_name)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;width:80px"><b>${it.qty_approved}</b></td>
        <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:12px">${escape(it.imei_list || '')}</td>
      </tr>
    `).join('');
    const wrap = document.createElement('div');
    wrap.className = 'modal-bg open';
    wrap.innerHTML = `
      <div class="modal" style="max-width:640px">
        <div class="modal-head">
          <h3>Phiếu cấp ${escape(d.code)}</h3>
          <button type="button" class="modal-close" data-x>×</button>
        </div>
        <div class="modal-body">
          <p>Người cấp: <b>${escape(d.staff_name)}</b></p>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="background:#f1f5f9">
              <th style="padding:6px 8px;text-align:left">Sản phẩm</th>
              <th style="padding:6px 8px;text-align:right">SL</th>
              <th style="padding:6px 8px;text-align:left">IMEI</th>
            </tr></thead>
            <tbody>${lines}</tbody>
          </table>
          <div class="field" style="margin-top:14px">
            <label>Ảnh xác nhận đã nhận hàng (tuỳ chọn)</label>
            <input type="file" id="iss_photo" accept="image/*" capture="environment">
            <p class="help">Ảnh sẽ upload lên imgbb. Không bắt buộc.</p>
            <img id="iss_preview" style="max-height:160px;margin-top:8px;border-radius:6px;display:none">
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn ghost" data-x>Đóng</button>
          <button type="button" class="btn success" id="iss_submit">Xác nhận đã nhận</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap || e.target.closest('[data-x]')) wrap.remove();
    });

    let uploadedUrl = null;
    let uploading = false;
    wrap.querySelector('#iss_photo').addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        uploading = true;
        ui.toast('Đang upload ảnh...', 'info');
        const url = await imgbb.upload(file, { name: `issue-${d.code}` });
        uploadedUrl = url;
        const img = wrap.querySelector('#iss_preview');
        img.src = url;
        img.style.display = '';
        ui.toast('Đã upload ảnh', 'success');
      } catch (err) {
        ui.toast('Upload ảnh lỗi: ' + (err.message || ''), 'error');
      } finally { uploading = false; }
    });
    wrap.querySelector('#iss_submit').addEventListener('click', async () => {
      if (uploading) { ui.toast('Đợi upload xong', 'warning'); return; }
      await api.post(`/kithuat/staff-issues/${id}/receive`, { photo_url: uploadedUrl || null },
        { successMessage: 'Đã xác nhận nhận hàng' });
      wrap.remove();
      await Promise.all([loadIssues(), loadHoldings()]);
    });
  }

  async function init() {
    techShell.init('inventory');
    await loadTasks();
    await Promise.all([loadHoldings(), loadPool(), loadIssues(), loadReturnRequests(), loadWarrantyWorklist()]);

    // Toolbar
    $('btnTakeDirect').addEventListener('click', openTakeDirect);

    // Pool list
    $('poolList').addEventListener('click', handlePoolClick);
    $('tbody').addEventListener('click', handleTableClick);

    // Phieu cap
    const issuesList = $('issuesList');
    if (issuesList) issuesList.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act="open-issue"]');
      if (btn) openIssue(Number(btn.dataset.issueId));
    });

    // Take-pool modal
    $('tpClose').addEventListener('click',  () => $('takePoolModal').classList.remove('open'));
    $('tpCancel').addEventListener('click', () => $('takePoolModal').classList.remove('open'));
    $('tpFrm').addEventListener('submit', submitTakePool);

    // Take-direct modal
    $('tdClose').addEventListener('click',  () => $('takeDirectModal').classList.remove('open'));
    $('tdCancel').addEventListener('click', () => $('takeDirectModal').classList.remove('open'));
    $('tdFrm').addEventListener('submit', submitTakeDirect);
    $('tdSearch').addEventListener('input', debounce((e) => loadProducts(e.target.value.trim()), 300));

    // Return modal
    $('rtClose').addEventListener('click',  () => $('returnModal').classList.remove('open'));
    $('rtCancel').addEventListener('click', () => $('returnModal').classList.remove('open'));
    $('rtFrm').addEventListener('submit', submitReturn);

    // Install modal
    $('installClose').addEventListener('click',  () => $('installModal').classList.remove('open'));
    $('installCancel').addEventListener('click', () => $('installModal').classList.remove('open'));
    $('installFrm').addEventListener('submit', submitInstall);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
