(function () {
  'use strict';
  location.replace('/admin/inventory.html');
  return;
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Number(n) || 0);
  const state = {
    suppliers: [],
    eligible: [],
    selected: new Set(),
    batches: [],
    returned: [],
    waitingDelivery: [],
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function pill(status) {
    const cls = { draft: 'gray', sent: 'amber', partial_received: 'blue', received: 'green', cancelled: 'red' }[status] || 'blue';
    const label = { draft: 'Nháp', sent: 'Đã gửi', partial_received: 'Nhận một phần', received: 'Đã nhận', cancelled: 'Đã hủy' }[status] || status;
    return `<span class="pill ${cls}">${esc(label)}</span>`;
  }

  function openSimpleModal(title, html, okText) {
    return new Promise((resolve) => {
      let div = document.getElementById('simpleModal');
      if (div) div.remove();
      div = document.createElement('div');
      div.id = 'simpleModal';
      div.className = 'modal-bg open';
      div.style.zIndex = '300';
      div.innerHTML = `
        <div class="modal" style="max-width:720px">
          <div class="modal-head">
            <h3>${esc(title)}</h3>
            <button type="button" class="modal-close" id="smClose">×</button>
          </div>
          <div class="modal-body">${html}</div>
          <div class="modal-foot">
            <button type="button" class="btn" id="smOk">${esc(okText || 'Đóng')}</button>
          </div>
        </div>`;
      document.body.appendChild(div);
      div.querySelector('#smClose').addEventListener('click', () => { div.remove(); resolve(false); });
      div.querySelector('#smOk').addEventListener('click', () => resolve(true));
    });
  }

  function closeSimpleModal() {
    const d = document.getElementById('simpleModal');
    if (d) d.remove();
  }

  async function loadSuppliers() {
    const r = await api.get('/admin/suppliers/all').catch(() => null);
    state.suppliers = (r && r.items) || [];
    $('supplierSel').innerHTML = ['<option value="0">- Chọn nhà cung cấp -</option>']
      .concat(state.suppliers.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`))
      .join('');
  }

  async function loadEligible() {
    const q = encodeURIComponent(($('eligibleQ').value || '').trim());
    const r = await api.get(`/admin/warranty-batches/eligible-items?q=${q}`).catch(() => null);
    if (!r) return;
    state.eligible = r.items || [];
    renderEligible();
  }

  function renderEligible() {
    $('eligibleCount').textContent = `${state.selected.size} sản phẩm được chọn`;
    const body = $('eligibleBody');
    if (!state.eligible.length) {
      body.innerHTML = '<tr><td colspan="4" class="muted" style="text-align:center;padding:20px">Không có sản phẩm phù hợp</td></tr>';
      return;
    }
    body.innerHTML = state.eligible.map((item) => `
      <tr>
        <td><input type="checkbox" class="cbEligible" data-id="${item.id}" ${state.selected.has(item.id) ? 'checked' : ''}></td>
        <td>
          <b>${esc(item.product_name || item.device_name || ('Item #' + item.id))}</b>
          <div class="mini">${esc(item.product_code || '')} ${item.imei ? `· IMEI ${esc(item.imei)}` : ''} ${item.license_plate ? `· BS ${esc(item.license_plate)}` : ''}</div>
        </td>
        <td>
          <div><b>${esc(item.order_code || '')}</b> · ${esc(item.customer_name || '')}</div>
          <div class="mini">${esc(item.customer_phone || '')}</div>
        </td>
        <td>
          <div>${item.assigned_staff_name ? `KTV: <b>${esc(item.assigned_staff_name)}</b>` : '<span class="muted">Chưa gán KTV</span>'}</div>
          <div class="mini">${item.condition_note ? esc(item.condition_note) : ''}</div>
        </td>
      </tr>
    `).join('');
    body.querySelectorAll('.cbEligible').forEach((cb) => {
      cb.addEventListener('change', () => {
        const id = Number(cb.dataset.id);
        if (cb.checked) state.selected.add(id);
        else state.selected.delete(id);
        $('eligibleCount').textContent = `${state.selected.size} sản phẩm được chọn`;
      });
    });
  }

  async function loadBatches() {
    const r = await api.get('/admin/warranty-batches').catch(() => null);
    if (!r) return;
    state.batches = r.items || [];
    renderBatches();
  }

  async function loadQueues() {
    const r = await api.get('/admin/warranty-batches/queues').catch(() => null);
    if (!r) return;
    state.returned = r.returned_from_supplier || [];
    state.waitingDelivery = r.waiting_delivery || [];
    renderQueues();
  }

  function renderBatches() {
    const box = $('batchList');
    if (!state.batches.length) {
      box.innerHTML = '<div class="muted">Chưa có đơn gửi NCC nào</div>';
      return;
    }
    box.innerHTML = state.batches.map((b) => `
      <div class="card" style="padding:12px">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:start">
          <div>
            <div><b>${esc(b.code)}</b> ${pill(b.status)}</div>
            <div class="mini">${esc(b.supplier_name || '')} · ${fmt(b.item_count)} sản phẩm</div>
            ${b.note_text ? `<div class="mini">${esc(b.note_text)}</div>` : ''}
          </div>
          <div class="actions">
            <button class="btn ghost sm btnBatchView" data-id="${b.id}">Xem</button>
            ${b.status === 'draft' ? `<button class="btn sm btnBatchSend" data-id="${b.id}">Gửi NCC</button>` : ''}
            ${b.status === 'sent' ? `<button class="btn sm btnBatchReceive" data-id="${b.id}">Nhận về</button>` : ''}
          </div>
        </div>
      </div>
    `).join('');
    box.querySelectorAll('.btnBatchView').forEach((btn) => btn.addEventListener('click', () => openBatchDetail(Number(btn.dataset.id))));
    box.querySelectorAll('.btnBatchSend').forEach((btn) => btn.addEventListener('click', () => postBatchAction(Number(btn.dataset.id), 'send')));
    box.querySelectorAll('.btnBatchReceive').forEach((btn) => btn.addEventListener('click', () => postBatchAction(Number(btn.dataset.id), 'receive')));
  }

  function renderQueueCards(targetId, rows, emptyText, badgeText, badgeStyle) {
    const box = $(targetId);
    if (!box) return;
    if (!rows.length) {
      box.innerHTML = `<div class="muted">${esc(emptyText)}</div>`;
      return;
    }
    box.innerHTML = rows.map((item) => `
      <div class="card" style="padding:12px;border-radius:12px">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
          <div>
            <div><b>${esc(item.product_name || item.device_name || ('Item #' + item.id))}</b></div>
            <div class="mini">${esc(item.product_code || '')}${item.product_code ? ' · ' : ''}${esc(item.order_code || '')}${item.customer_name ? ` · ${esc(item.customer_name)}` : ''}${item.customer_phone ? ` · ${esc(item.customer_phone)}` : ''}</div>
            <div class="mini" style="margin-top:4px">
              ${item.supplier_name ? `NCC: <b>${esc(item.supplier_name)}</b>` : ''}
              ${item.replacement_product_name ? `${item.supplier_name ? ' · ' : ''}Hàng giao khách: <b>${esc(item.replacement_product_name)}</b>` : ''}
            </div>
            <div class="mini" style="margin-top:4px">
              ${item.replacement_staff_name ? `KTV giao: <b>${esc(item.replacement_staff_name)}</b>` : (item.assigned_staff_name ? `KTV đơn: <b>${esc(item.assigned_staff_name)}</b>` : 'Chưa gán KTV')}
            </div>
          </div>
          <span class="pill" style="background:${badgeStyle.bg};color:${badgeStyle.fg};border-color:${badgeStyle.border}">${esc(badgeText)}</span>
        </div>
      </div>
    `).join('');
  }

  function renderQueues() {
    renderQueueCards(
      'returnedQueue',
      state.returned,
      'Chưa có sản phẩm nào NCC trả về',
      'Đã trả về',
      { bg: '#f0fdf4', fg: '#15803d', border: '#bbf7d0' }
    );
    renderQueueCards(
      'deliveryQueue',
      state.waitingDelivery,
      'Chưa có sản phẩm nào chờ phân KTV đi giao',
      'Chờ giao',
      { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' }
    );
  }

  async function createBatch() {
    const supplierId = Number($('supplierSel').value) || 0;
    const itemIds = Array.from(state.selected);
    if (!supplierId) return ui.toast('Chọn nhà cung cấp trước', 'warning');
    if (!itemIds.length) return ui.toast('Chọn ít nhất 1 sản phẩm', 'warning');
    const r = await api.post('/admin/warranty-batches', {
      supplier_id: supplierId,
      item_ids: itemIds,
      note_text: ($('batchNote').value || '').trim() || null,
    }, { onError: 'toast' });
    if (!r) return;
    ui.toast(`Đã tạo ${r.code}`, 'success');
    state.selected.clear();
    $('batchNote').value = '';
    $('supplierSel').value = '0';
    await Promise.all([loadEligible(), loadBatches(), loadQueues()]);
  }

  async function openBatchDetail(id) {
    const d = await api.get(`/admin/warranty-batches/${id}`).catch(() => null);
    if (!d) return;
    const html = `
      <div style="padding:14px">
        <div style="margin-bottom:10px"><b>${esc(d.code)}</b> · ${esc(d.supplier_name || '')}</div>
        <div class="mini" style="margin-bottom:10px">${d.note_text ? esc(d.note_text) : ''}</div>
        <div class="stack">
          ${(d.items || []).map((item) => `
            <div style="border:1px solid #e2e8f0;border-radius:10px;padding:10px">
              <div><b>${esc(item.product_name || item.device_name || ('Item #' + item.warranty_item_id))}</b> · ${esc(item.order_code || '')}</div>
              <div class="mini">${esc(item.customer_name || '')} ${item.customer_phone ? `· ${esc(item.customer_phone)}` : ''}</div>
              <div class="mini">${item.imei ? `IMEI ${esc(item.imei)}` : ''} ${item.license_plate ? `· BS ${esc(item.license_plate)}` : ''}</div>
            </div>
          `).join('')}
        </div>
      </div>`;
    await openSimpleModal('Chi tiết đơn gửi NCC', html, 'Đóng', null, true);
    closeSimpleModal();
  }

  async function postBatchAction(id, action) {
    const title = action === 'send' ? 'Gửi đơn này sang NCC?' : 'Đánh dấu NCC đã trả đơn này?';
    const yes = await ui.confirm({ title, okText: action === 'send' ? 'Gửi' : 'Nhận' });
    if (!yes) return;
    const r = await api.post(`/admin/warranty-batches/${id}/${action}`, {}, { onError: 'toast' });
    if (!r) return;
    ui.toast(action === 'send' ? 'Đã gửi NCC' : 'Đã nhận về', 'success');
    await Promise.all([loadEligible(), loadBatches(), loadQueues()]);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    adminShell.init('warranties');
    $('cbEligibleAll').addEventListener('change', () => {
      if ($('cbEligibleAll').checked) state.eligible.forEach((item) => state.selected.add(item.id));
      else state.selected.clear();
      renderEligible();
    });
    $('btnRefreshEligible').addEventListener('click', loadEligible);
    $('btnRefreshBatches').addEventListener('click', async () => {
      await Promise.all([loadBatches(), loadQueues()]);
    });
    $('btnCreateBatch').addEventListener('click', createBatch);
    $('eligibleQ').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loadEligible();
    });
    await Promise.all([loadSuppliers(), loadEligible(), loadBatches(), loadQueues()]);
  });
})();
