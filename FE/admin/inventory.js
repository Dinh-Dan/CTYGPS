// Trang Kho v2 — 4 tab: Tồn kho / Phiếu nhập / Phiếu xuất / KTV đang giữ

(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  const REASON_LABELS = {
    import_supplier:        'Nhập từ NCC',
    return_supplier:        'Trả NCC',
    adjust_plus:            'Cân kho +',
    adjust_minus:           'Cân kho −',
    order_release:          'Xuất cho đơn',
    order_cancel_return:    'Hủy đơn hoàn kho',
    order_return_done:      'Khách trả (sau done)',
    order_return_done_void: 'Hủy phiếu khách trả',
    technician_take:        'KTV nhận theo task',
    technician_take_direct: 'KTV nhận trực tiếp',
    technician_return:      'KTV trả',
    install_done:           'Đã lắp',
    damaged:                'Hỏng',
    import_supplier_void:   'Hủy nhập NCC',
    return_supplier_void:   'Hủy trả NCC',
    adjust_plus_void:       'Hủy cân kho +',
    adjust_minus_void:      'Hủy cân kho −',
  };

  const ADMIN_REASONS_IN  = ['import_supplier', 'adjust_plus'];
  const ADMIN_REASONS_OUT = ['return_supplier', 'adjust_minus'];

  const state = {
    activeTab: 'stock',
    products: [],   // dropdown cache
    suppliers: [],  // dropdown cache
    stock: { q: '', stock_state: '', cat: '', qty_min: '', qty_max: '', page: 1, limit: 20, total: 0 },
    inR:   { q: '', reason: '', from: '', to: '', page: 1, limit: 20, total: 0 },
    outR:  { q: '', reason: '', from: '', to: '', page: 1, limit: 20, total: 0 },
    hold:  { q: '' },
    takes: { status: '', from: '', to: '', page: 1, limit: 20, total: 0 },
    receiptDraft: { kind: 'in', lines: [] },
    currentReceiptId: null,
    currentTake: null,   // { id, code, status, lines: [{ product_id, product_code, product_name, system_qty, current_qty, counted_qty, note, receipt_id, receipt_code, receipt_kind }] }
  };

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }
  function fmtDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d);
    return dt.toLocaleString('vi-VN', { hour12: false });
  }
  function fmtDateOnly(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d);
    return dt.toLocaleDateString('vi-VN');
  }
  function thumbCell(p) {
    if (p.thumbnail_url || p.image_url) {
      return `<img src="${escape(p.thumbnail_url || p.image_url)}" class="product-thumb" alt="">`;
    }
    const i = (p.code || p.name || '?').trim().charAt(0).toUpperCase();
    return `<div class="product-thumb-fallback">${i}</div>`;
  }
  function stockBadge(q) {
    if (q === 0) return `<span class="pill red">Hết</span>`;
    if (q < 5)   return `<b>${q}</b> <span class="pill amber" style="font-size:10px">Sắp hết</span>`;
    return `<b>${q}</b>`;
  }
  function reasonBadge(code) {
    const label = REASON_LABELS[code] || code;
    let cls = 'gray';
    if (code === 'import_supplier' || code === 'order_cancel_return' || code === 'order_return_done' || code === 'technician_return') cls = 'green';
    else if (code === 'adjust_plus') cls = 'blue';
    else if (code === 'order_release' || code === 'technician_take' || code === 'technician_take_direct') cls = 'amber';
    else if (code === 'install_done') cls = 'blue';
    else if (code === 'damaged' || code === 'return_supplier' || code === 'adjust_minus') cls = 'red';
    return `<span class="pill ${cls}" style="font-size:11px">${escape(label)}</span>`;
  }

  // ==================== STATS ====================
  async function loadStats() {
    const s = await api.get('/admin/inventory/stats', { silent: true }).catch(() => null);
    if (!s) return;
    $('st-products').textContent = fmt.format(s.products_with_stock || 0);
    $('st-units').textContent    = fmt.format(s.total_units || 0);
    $('st-held').textContent     = fmt.format(s.held_units || 0);
    $('st-low').textContent      = fmt.format(s.low_stock || 0);
  }

  // ==================== TAB 1: STOCK ====================
  async function loadStock() {
    const p = new URLSearchParams();
    if (state.stock.q)           p.set('q', state.stock.q);
    if (state.stock.stock_state) p.set('stock_state', state.stock.stock_state);
    if (state.stock.cat)         p.set('category', state.stock.cat);
    if (state.stock.qty_min !== '') p.set('qty_min', state.stock.qty_min);
    if (state.stock.qty_max !== '') p.set('qty_max', state.stock.qty_max);
    p.set('page', state.stock.page);
    p.set('limit', state.stock.limit);
    const res = await api.get('/admin/inventory/stock?' + p.toString()).catch(() => null);
    if (!res) return;
    state.stock.total = res.total;
    renderStock(res.items);
    const totalPage = Math.max(1, Math.ceil(res.total / state.stock.limit));
    $('stockPageInfo').textContent = `Trang ${state.stock.page} / ${totalPage} — ${res.total} SP`;
    $('stockPrev').disabled = state.stock.page <= 1;
    $('stockNext').disabled = state.stock.page >= totalPage;
  }
  function renderStock(items) {
    if (!items.length) {
      $('tbody-stock').innerHTML = `<tr><td colspan="9" class="text-center text-muted" style="padding:30px">Chưa có sản phẩm</td></tr>`;
      return;
    }
    $('tbody-stock').innerHTML = items.map(p => `
      <tr>
        <td>${thumbCell(p)}</td>
        <td><b>${escape(p.code)}</b></td>
        <td>${escape(p.name)}</td>
        <td>${escape(p.category_name || '—')}</td>
        <td>${fmt.format(p.cost_price || 0)}đ</td>
        <td>${stockBadge(Number(p.quantity))}</td>
        <td>${p.held_qty > 0 ? `<span class="pill blue">${p.held_qty}</span>` : '0'}</td>
        <td>${p.sold_30d > 0 ? `<b>${p.sold_30d}</b>` : '<span class="text-muted">0</span>'}</td>
        <td>
          <button class="btn ghost sm" data-act="history" data-id="${p.product_id}" data-name="${escape(p.code + ' — ' + p.name)}" title="Lịch sử">📜</button>
          <button class="btn ghost sm" data-act="adjust" data-id="${p.product_id}" data-name="${escape(p.code + ' — ' + p.name)}" title="Cân kho">➕</button>
        </td>
      </tr>
    `).join('');
  }
  $('tbody-stock').addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-act]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const name = btn.dataset.name;
    if (btn.dataset.act === 'history') openHistory(id, name);
    else if (btn.dataset.act === 'adjust') openAdjust(id, name);
  });

  // ==================== TAB 2/3: RECEIPTS ====================
  async function loadReceipts(kind) {
    const s = kind === 'in' ? state.inR : state.outR;
    const p = new URLSearchParams();
    p.set('kind', kind);
    if (s.q)      p.set('q', s.q);
    if (s.reason) p.set('reason_code', s.reason);
    if (s.from)   p.set('date_from', s.from);
    if (s.to)     p.set('date_to', s.to);
    p.set('page', s.page);
    p.set('limit', s.limit);
    const res = await api.get('/admin/inventory/receipts?' + p.toString()).catch(() => null);
    if (!res) return;
    s.total = res.total;
    renderReceipts(kind, res.items);
    const totalPage = Math.max(1, Math.ceil(res.total / s.limit));
    if (kind === 'in') {
      $('inPageInfo').textContent = `Trang ${s.page} / ${totalPage} — ${res.total}`;
      $('inPrev').disabled = s.page <= 1;
      $('inNext').disabled = s.page >= totalPage;
    } else {
      $('outPageInfo').textContent = `Trang ${s.page} / ${totalPage} — ${res.total}`;
      $('outPrev').disabled = s.page <= 1;
      $('outNext').disabled = s.page >= totalPage;
    }
  }
  function renderReceipts(kind, items) {
    const tbody = kind === 'in' ? $('tbody-in') : $('tbody-out');
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:30px">Chưa có phiếu</td></tr>`;
      return;
    }
    tbody.innerHTML = items.map(r => {
      const isEmpty = !r.line_count;
      const preview = isEmpty
        ? '<span class="text-muted"><i>Phiếu rỗng (đơn không vật tư)</i></span>'
        : escape((r.items_preview || []).map(it => `${it.product_code} ×${it.qty}`).join(', ')
                 + (r.line_count > 3 ? `, +${r.line_count - 3}…` : ''));
      return `
        <tr style="cursor:pointer" data-rid="${r.id}">
          <td><b>${escape(r.code)}</b></td>
          <td>${fmtDate(r.created_at)}</td>
          <td>${reasonBadge(r.reason_code)}</td>
          <td>${preview}</td>
          <td>${escape(r.created_by_name || '—')}</td>
          <td><b>${r.total_qty}</b></td>
          <td>${r.is_voided
            ? '<span class="pill red">Đã hủy</span>'
            : '<span class="pill green">Hợp lệ</span>'}</td>
        </tr>`;
    }).join('');
    tbody.querySelectorAll('tr[data-rid]').forEach(tr => {
      tr.addEventListener('click', () => openReceiptDetail(Number(tr.dataset.rid)));
    });
  }

  // ==================== TAB 4: HOLDINGS ====================
  async function loadHoldings() {
    const p = new URLSearchParams();
    if (state.hold.q) p.set('q', state.hold.q);
    const res = await api.get('/admin/inventory/staff-holdings?' + p.toString()).catch(() => null);
    if (!res) return;
    if (!res.items.length) {
      $('tbody-hold').innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:30px">Không có KTV nào đang giữ thiết bị</td></tr>`;
      return;
    }
    $('tbody-hold').innerHTML = res.items.map(h => {
      const dayCls = h.days_held > 3 ? 'style="color:#dc2626;font-weight:600"' : '';
      return `
        <tr>
          <td><b>${escape(h.staff_name)}</b></td>
          <td>${escape(h.product_code)}</td>
          <td>${escape(h.product_name)}</td>
          <td><b>${h.qty}</b></td>
          <td>${fmtDate(h.first_held_at)}</td>
          <td ${dayCls}>${h.days_held} ngày</td>
        </tr>`;
    }).join('');
  }

  // ==================== TAB SWITCH ====================
  function switchTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll('.inv-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.inv-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === tab));
    if (tab === 'stock')        loadStock();
    else if (tab === 'receipts-in')  loadReceipts('in');
    else if (tab === 'receipts-out') loadReceipts('out');
    else if (tab === 'holdings') loadHoldings();
    else if (tab === 'stocktakes') loadTakes();
  }

  // ==================== MODAL: TẠO PHIẾU ====================
  function openReceiptModal(kind, presetReason) {
    state.receiptDraft = { kind, lines: [] };
    $('r_kind').value = kind;
    $('receiptModalTitle').textContent = kind === 'in' ? 'Tạo phiếu nhập' : 'Tạo phiếu xuất';

    // Reason options
    const reasons = kind === 'in' ? ADMIN_REASONS_IN : ADMIN_REASONS_OUT;
    $('r_reason').innerHTML = reasons.map(r =>
      `<option value="${r}">${escape(REASON_LABELS[r])}</option>`).join('');
    if (presetReason) $('r_reason').value = presetReason;
    toggleSupplierField();

    // Hiện/ẩn cột giá / IMEI
    document.querySelectorAll('#r_lines_table .r-price').forEach(el => el.style.display = kind === 'in' ? '' : 'none');
    document.querySelectorAll('#r_lines_table .r-imei').forEach(el => el.style.display = kind === 'out' ? '' : 'none');

    // NCC dropdown
    $('r_supplier_id').innerHTML = '<option value="">— Không chọn —</option>'
      + state.suppliers.map(s => `<option value="${s.id}">${escape(s.name)}</option>`).join('');

    $('r_reason_text').value = '';
    $('r_lines_body').innerHTML = '';
    addLine();

    $('receiptModal').classList.add('open');
  }
  function toggleSupplierField() {
    const reason = $('r_reason').value;
    const need = ['import_supplier', 'return_supplier'].includes(reason);
    $('r_supplier_field').style.display = need ? '' : 'none';
    $('r_supplier_id').required = need;
  }
  function addLine() {
    const kind = state.receiptDraft.kind;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <select class="select line-product" required>
          <option value="">— Chọn SP —</option>
          ${state.products.map(p => `<option value="${p.id}">${escape(p.code)} — ${escape(p.name)}</option>`).join('')}
        </select>
      </td>
      <td><input type="number" class="input line-qty" min="1" value="1" required></td>
      <td class="r-price" ${kind === 'out' ? 'style="display:none"' : ''}><input type="text" inputmode="numeric" class="input line-price money-input" placeholder="0"></td>
      <td class="r-imei imei-cell" ${kind === 'in' ? 'style="display:none"' : ''}><textarea class="line-imei" placeholder="868001\n868002"></textarea></td>
      <td><input type="text" class="input line-note" placeholder="—"></td>
      <td><button type="button" class="btn-remove-line" title="Xoá dòng">✕</button></td>
    `;
    tr.querySelector('.btn-remove-line').addEventListener('click', () => tr.remove());
    $('r_lines_body').appendChild(tr);
  }
  async function submitReceipt(ev) {
    ev.preventDefault();
    const kind = $('r_kind').value;
    const lines = [];
    const seen = new Set();
    let invalid = false;
    document.querySelectorAll('#r_lines_body tr').forEach(tr => {
      const productId = Number(tr.querySelector('.line-product').value);
      const qty = Number(tr.querySelector('.line-qty').value);
      if (!productId || !qty || qty <= 0) { invalid = true; return; }
      if (seen.has(productId)) { invalid = true; return; }
      seen.add(productId);
      const priceEl = tr.querySelector('.line-price');
      const imeiEl = tr.querySelector('.line-imei');
      const note = tr.querySelector('.line-note').value.trim() || null;
      lines.push({
        product_id: productId,
        qty,
        unit_price: priceEl && priceEl.value ? Money.get(priceEl) : null,
        imei_list: imeiEl && imeiEl.value ? imeiEl.value.trim() : null,
        note,
      });
    });
    if (invalid || !lines.length) {
      ui.toast('Kiểm tra: chọn SP, qty>0, mỗi SP chỉ 1 dòng', 'warning');
      return;
    }
    const body = {
      kind,
      reason_code: $('r_reason').value,
      reason_text: $('r_reason_text').value.trim() || null,
      supplier_id: $('r_supplier_id').value ? Number($('r_supplier_id').value) : null,
      items: lines,
    };
    const res = await api.post('/admin/inventory/receipts', body, {
      successMessage: `Đã lưu phiếu ${body.reason_code === 'import_supplier' ? 'nhập' : ''}`,
    }).catch(() => null);
    if (!res) return;
    $('receiptModal').classList.remove('open');
    loadStats();
    if (state.activeTab === 'stock')             loadStock();
    else if (state.activeTab === 'receipts-in')  loadReceipts('in');
    else if (state.activeTab === 'receipts-out') loadReceipts('out');
  }

  // ==================== MODAL: CHI TIẾT PHIẾU ====================
  async function openReceiptDetail(id) {
    state.currentReceiptId = id;
    const r = await api.get(`/admin/inventory/receipts/${id}`).catch(() => null);
    if (!r) return;
    $('rdTitle').textContent = `Chi tiết phiếu ${r.code}`;
    $('rdMeta').innerHTML = `
      <div><div class="lbl">Mã phiếu</div><div class="val">${escape(r.code)}</div></div>
      <div><div class="lbl">Ngày tạo</div><div class="val">${fmtDate(r.created_at)}</div></div>
      <div><div class="lbl">Loại</div><div class="val">${r.kind === 'in' ? 'Phiếu nhập' : 'Phiếu xuất'}</div></div>
      <div><div class="lbl">Lý do</div><div class="val">${reasonBadge(r.reason_code)}</div></div>
      ${r.supplier_name ? `<div><div class="lbl">NCC</div><div class="val">${escape(r.supplier_name)}</div></div>` : ''}
      ${r.order_code ? `<div><div class="lbl">Đơn liên quan</div><div class="val">${
        r.ref_order_id
          ? `<a href="/admin/orders.html#order-${r.ref_order_id}" target="_blank" style="color:#2563eb;text-decoration:underline">${escape(r.order_code)}</a>`
          : escape(r.order_code)
      }</div></div>` : ''}
      ${r.ref_staff_name ? `<div><div class="lbl">KTV</div><div class="val">${escape(r.ref_staff_name)}</div></div>` : ''}
      ${r.stock_take_code ? `<div><div class="lbl">Phiên kiểm kê</div><div class="val"><b>${escape(r.stock_take_code)}</b></div></div>` : ''}
      <div><div class="lbl">Người tạo</div><div class="val">${escape(r.created_by_name || '—')}</div></div>
      ${r.reason_text ? `<div style="grid-column:1/-1"><div class="lbl">Ghi chú</div><div class="val">${escape(r.reason_text)}</div></div>` : ''}
      ${r.is_voided ? `<div style="grid-column:1/-1"><div class="lbl">Đã hủy</div><div class="val" style="color:#dc2626">${fmtDate(r.voided_at)} — ${escape(r.voided_reason || '')}</div></div>` : ''}
    `;
    $('rdItems').innerHTML = !r.items.length
      ? `<div style="padding:14px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;color:#0369a1">
           <b>Phiếu rỗng — không có vật tư.</b><br>
           <small>Đơn liên quan không có sản phẩm nào, phiếu này được tạo để ghi nhận QTV đã xử lý đơn.</small>
         </div>`
      : `
        <table class="data" style="font-size:13px">
          <thead><tr>
            <th>Mã TB</th><th>Tên SP</th><th style="width:80px">SL</th>
            ${r.kind === 'in' ? '<th style="width:120px">Đơn giá</th>' : ''}
            ${r.kind === 'out' ? '<th>IMEI</th>' : ''}
            <th>Ghi chú</th>
          </tr></thead>
          <tbody>
            ${r.items.map(it => `
              <tr>
                <td><b>${escape(it.product_code)}</b></td>
                <td>${escape(it.product_name)}</td>
                <td><b>${it.qty}</b></td>
                ${r.kind === 'in' ? `<td>${it.unit_price ? fmt.format(it.unit_price) + 'đ' : '—'}</td>` : ''}
                ${r.kind === 'out' ? `<td><pre style="margin:0;font-family:monospace;font-size:11.5px;white-space:pre-wrap">${escape(it.imei_list || '—')}</pre></td>` : ''}
                <td>${escape(it.note || '—')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      `;
    // Cho phep void neu la phieu admin tu tao + chua voided + duoi 24h
    // KHONG cho void neu phieu thuoc phien kiem ke (ref_stock_take_id != null)
    const allowVoid = !r.is_voided
      && !r.ref_stock_take_id
      && [...ADMIN_REASONS_IN, ...ADMIN_REASONS_OUT].includes(r.reason_code)
      && (Date.now() - new Date(r.created_at).getTime() < 24 * 3600 * 1000);
    $('btnVoidReceipt').style.display = allowVoid ? '' : 'none';
    $('receiptDetailModal').classList.add('open');
  }

  async function voidCurrentReceipt() {
    const id = state.currentReceiptId;
    if (!id) return;
    const reason = window.prompt('Lý do hủy phiếu?', '');
    if (!reason || !reason.trim()) return;
    const res = await api.post(`/admin/inventory/receipts/${id}/void`, { reason: reason.trim() }, {
      successMessage: 'Đã hủy phiếu + sinh phiếu đối ứng',
    }).catch(() => null);
    if (!res) return;
    $('receiptDetailModal').classList.remove('open');
    loadStats();
    if (state.activeTab === 'receipts-in')  loadReceipts('in');
    if (state.activeTab === 'receipts-out') loadReceipts('out');
    if (state.activeTab === 'stock')        loadStock();
  }

  // ==================== MODAL: LỊCH SỬ SP ====================
  async function openHistory(productId, name) {
    $('hsTitle').textContent = `Lịch sử nhập/xuất — ${name}`;
    $('hsBody').innerHTML = '<p class="text-muted text-center" style="padding:20px">Đang tải...</p>';
    $('historyModal').classList.add('open');
    const res = await api.get(`/admin/inventory/products/${productId}/history?limit=200`).catch(() => null);
    if (!res) return;
    if (!res.items.length) {
      $('hsBody').innerHTML = '<p class="text-muted text-center" style="padding:20px">Chưa có giao dịch nào</p>';
      return;
    }
    let totIn = 0, totOut = 0;
    res.items.forEach(it => { if (it.kind === 'in') totIn += it.qty; else totOut += it.qty; });
    $('hsBody').innerHTML = `
      <div class="row" style="gap:14px;margin-bottom:8px">
        <div><span class="text-muted">Tổng nhập:</span> <b style="color:#15803d">+${totIn}</b></div>
        <div><span class="text-muted">Tổng xuất:</span> <b style="color:#dc2626">−${totOut}</b></div>
        <div><span class="text-muted">Số dòng:</span> <b>${res.total}</b></div>
      </div>
      <table class="data" style="font-size:13px">
        <thead><tr>
          <th style="width:130px">Phiếu</th>
          <th style="width:140px">Ngày</th>
          <th style="width:160px">Lý do</th>
          <th style="width:80px">SL</th>
          <th>Liên quan</th>
        </tr></thead>
        <tbody>
          ${res.items.map(it => `
            <tr ${it.is_voided ? 'style="opacity:.55"' : ''}>
              <td><b>${escape(it.code)}</b></td>
              <td>${fmtDate(it.created_at)}</td>
              <td>${reasonBadge(it.reason_code)}</td>
              <td>${it.kind === 'in' ? '+' : '−'}<b>${it.qty}</b></td>
              <td>
                ${it.order_code ? `Đơn ${it.ref_order_id
                  ? `<a href="/admin/orders.html#order-${it.ref_order_id}" target="_blank" style="color:#2563eb;text-decoration:underline"><b>${escape(it.order_code)}</b></a>`
                  : `<b>${escape(it.order_code)}</b>`} ` : ''}
                ${it.supplier_name ? `NCC: ${escape(it.supplier_name)} ` : ''}
                ${it.ref_staff_name ? `KTV: ${escape(it.ref_staff_name)}` : ''}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    `;
  }

  function openAdjust(productId, name) {
    // Mo modal tao phieu voi 1 line da preset product
    openReceiptModal('in', 'adjust_plus');
    setTimeout(() => {
      const sel = $('r_lines_body').querySelector('.line-product');
      if (sel) sel.value = String(productId);
    }, 50);
  }

  // ==================== TAB 5: STOCKTAKES ====================
  function stocktakeStatusPill(s) {
    const labels = { draft: 'Đang đếm', finished: 'Đã chốt', cancelled: 'Đã huỷ' };
    return `<span class="pill stocktake-status-${s}" style="font-size:11px">${labels[s] || s}</span>`;
  }
  function varianceCell(variance) {
    if (variance > 0) return `<span class="variance-pos">+${variance}</span>`;
    if (variance < 0) return `<span class="variance-neg">${variance}</span>`;
    return `<span class="variance-zero">0</span>`;
  }
  async function loadTakes() {
    const p = new URLSearchParams();
    if (state.takes.status) p.set('status', state.takes.status);
    if (state.takes.from)   p.set('date_from', state.takes.from);
    if (state.takes.to)     p.set('date_to', state.takes.to);
    p.set('page', state.takes.page);
    p.set('limit', state.takes.limit);
    const res = await api.get('/admin/inventory/stocktakes?' + p.toString()).catch(() => null);
    if (!res) return;
    state.takes.total = res.total;
    renderTakes(res.items);
    const totalPage = Math.max(1, Math.ceil(res.total / state.takes.limit));
    $('stPageInfo').textContent = `Trang ${state.takes.page} / ${totalPage} — ${res.total}`;
    $('stPrev').disabled = state.takes.page <= 1;
    $('stNext').disabled = state.takes.page >= totalPage;
  }
  function renderTakes(items) {
    const tbody = $('tbody-st');
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding:30px">Chưa có phiên kiểm kê nào</td></tr>`;
      return;
    }
    tbody.innerHTML = items.map(t => `
      <tr style="cursor:pointer" data-tid="${t.id}">
        <td><b>${escape(t.code)}</b></td>
        <td>${fmtDate(t.started_at)}</td>
        <td>${t.finished_at ? fmtDate(t.finished_at) : '<span class="text-muted">—</span>'}</td>
        <td>${escape(t.by_staff_name || '—')}</td>
        <td><b>${t.line_count}</b></td>
        <td>${t.status === 'finished' ? `<b>${t.total_variance_abs}</b>` : '<span class="text-muted">—</span>'}</td>
        <td>${stocktakeStatusPill(t.status)}</td>
        <td><small class="text-muted">${escape(t.note || '')}</small></td>
      </tr>
    `).join('');
    tbody.querySelectorAll('tr[data-tid]').forEach(tr => {
      tr.addEventListener('click', () => openTake(Number(tr.dataset.tid)));
    });
  }

  async function openNewStocktake() {
    const r = await api.post('/admin/inventory/stocktakes', { note: '' }, {
      successMessage: 'Đã mở phiên kiểm kê',
    }).catch(() => null);
    if (!r) return;
    await openTake(r.id);
    if (state.activeTab === 'stocktakes') loadTakes();
  }

  async function openTake(id) {
    const t = await api.get(`/admin/inventory/stocktakes/${id}`).catch(() => null);
    if (!t) return;
    state.currentTake = {
      id: t.id, code: t.code, status: t.status,
      note: t.note || '',
      lines: (t.lines || []).map(l => ({
        product_id: l.product_id,
        product_code: l.product_code,
        product_name: l.product_name,
        system_qty: Number(l.system_qty),
        current_qty: Number(l.current_qty),
        counted_qty: Number(l.counted_qty),
        note: l.note || '',
        receipt_id: l.receipt_id,
        receipt_code: l.receipt_code,
        receipt_kind: l.receipt_kind,
      })),
    };
    renderTakeModal(t);
    $('stocktakeModal').classList.add('open');
  }

  function renderTakeModal(t) {
    const isDraft = t.status === 'draft';
    $('stTitle').textContent = `Phiên kiểm kê ${t.code}`;
    $('stMeta').innerHTML = `
      <div><div class="lbl">Mã phiên</div><div class="val">${escape(t.code)}</div></div>
      <div><div class="lbl">Trạng thái</div><div class="val">${stocktakeStatusPill(t.status)}</div></div>
      <div><div class="lbl">Bắt đầu</div><div class="val">${fmtDate(t.started_at)}</div></div>
      <div><div class="lbl">Kết thúc</div><div class="val">${t.finished_at ? fmtDate(t.finished_at) : '—'}</div></div>
      <div><div class="lbl">Người mở</div><div class="val">${escape(t.by_staff_name || '—')}</div></div>
      <div><div class="lbl">Người chốt</div><div class="val">${escape(t.finished_by_staff_name || '—')}</div></div>
      ${t.status === 'finished' ? `
      <div><div class="lbl">Số dòng</div><div class="val">${t.total_lines}</div></div>
      <div><div class="lbl">Tổng |chênh lệch|</div><div class="val">${t.total_variance_abs}</div></div>
      ` : ''}
    `;

    $('st_note').value = t.note || '';
    $('st_note').disabled = !isDraft;
    $('stNoteField').style.display = isDraft || (t.note || '') ? '' : 'none';
    $('stAddRow').style.display = isDraft ? 'flex' : 'none';
    $('btnStSaveDraft').style.display = isDraft ? '' : 'none';
    $('btnStFinish').style.display    = isDraft ? '' : 'none';
    $('btnStCancelTake').style.display = isDraft ? '' : 'none';

    // Cảnh báo nếu có line system_qty != current_qty (tồn HT đã đổi từ lúc snapshot)
    if (isDraft) {
      const driftedNames = state.currentTake.lines
        .filter(l => l.system_qty !== l.current_qty)
        .map(l => `${l.product_code} (${l.system_qty} → ${l.current_qty})`);
      if (driftedNames.length) {
        $('stWarning').style.display = '';
        $('stWarning').innerHTML = `⚠ Tồn hệ thống đã thay đổi từ lúc bắt đầu đếm: <b>${driftedNames.join(', ')}</b>. Khi bấm Hoàn tất, chênh lệch sẽ tính theo tồn HIỆN TẠI.`;
      } else {
        $('stWarning').style.display = 'none';
      }
    } else {
      $('stWarning').style.display = 'none';
    }

    refillStAddProductSelect();
    renderTakeLines();
  }

  function refillStAddProductSelect() {
    const used = new Set((state.currentTake?.lines || []).map(l => l.product_id));
    const opts = ['<option value="">— Chọn SP —</option>']
      .concat(state.products
        .filter(p => !used.has(p.id))
        .map(p => `<option value="${p.id}">${escape(p.code + ' — ' + p.name)}</option>`));
    $('st_add_product').innerHTML = opts.join('');
  }

  function renderTakeLines() {
    const t = state.currentTake;
    const isDraft = t.status === 'draft';
    $('stLineCount').textContent = `${t.lines.length} sản phẩm`;
    if (!t.lines.length) {
      $('stLinesBody').innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding:18px">Chưa có SP nào — bấm "+ Thêm" ở trên để bắt đầu</td></tr>`;
      return;
    }
    $('stLinesBody').innerHTML = t.lines.map((l, idx) => {
      const refQty = isDraft ? l.current_qty : l.system_qty;
      const variance = Number(l.counted_qty) - refQty;
      const receiptLink = l.receipt_code
        ? `<b>${escape(l.receipt_code)}</b>`
        : (isDraft ? '<span class="text-muted">—</span>' : '<span class="text-muted">khớp</span>');
      return `
        <tr data-idx="${idx}">
          <td><b>${escape(l.product_code)}</b></td>
          <td>${escape(l.product_name)}</td>
          <td>${l.system_qty !== l.current_qty && isDraft
            ? `<b>${l.current_qty}</b><br><small style="color:#92400e">(snap ${l.system_qty})</small>`
            : `<b>${refQty}</b>`}</td>
          <td>
            ${isDraft
              ? `<input type="number" class="input st-counted" min="0" step="1" value="${l.counted_qty}" style="width:90px;padding:5px 8px">`
              : `<b>${l.counted_qty}</b>`}
          </td>
          <td>${varianceCell(variance)}</td>
          <td>${receiptLink}</td>
          <td>
            ${isDraft
              ? `<input type="text" class="input st-note" value="${escape(l.note || '')}" style="padding:5px 8px;font-size:12.5px">`
              : `<small>${escape(l.note || '')}</small>`}
          </td>
          <td>${isDraft ? `<button type="button" class="btn-remove-line st-remove" title="Xoá">×</button>` : ''}</td>
        </tr>`;
    }).join('');

    if (isDraft) {
      $('stLinesBody').querySelectorAll('tr[data-idx]').forEach(tr => {
        const idx = Number(tr.dataset.idx);
        const counted = tr.querySelector('.st-counted');
        const noteEl = tr.querySelector('.st-note');
        const remove = tr.querySelector('.st-remove');
        if (counted) counted.addEventListener('input', () => {
          const v = Math.max(0, parseInt(counted.value) || 0);
          state.currentTake.lines[idx].counted_qty = v;
          // Cập nhật cell variance + cell counted_qty không re-render full để giữ focus
          const refQty = state.currentTake.lines[idx].current_qty;
          const variance = v - refQty;
          tr.children[4].innerHTML = (variance > 0
            ? `<span class="variance-pos">+${variance}</span>`
            : variance < 0
              ? `<span class="variance-neg">${variance}</span>`
              : `<span class="variance-zero">0</span>`);
        });
        if (noteEl) noteEl.addEventListener('input', () => {
          state.currentTake.lines[idx].note = noteEl.value;
        });
        if (remove) remove.addEventListener('click', () => {
          state.currentTake.lines.splice(idx, 1);
          refillStAddProductSelect();
          renderTakeLines();
        });
      });
    }
  }

  function addProductToTake() {
    const sel = $('st_add_product');
    const productId = Number(sel.value);
    if (!productId) return;
    const p = state.products.find(x => x.id === productId);
    if (!p) return;
    if (state.currentTake.lines.some(l => l.product_id === productId)) {
      ui.toast('SP đã có trong phiên', 'warning');
      return;
    }
    // Lookup tồn HT hiện tại từ /stock?q=code
    api.get(`/admin/inventory/stock?q=${encodeURIComponent(p.code)}`, { silent: true })
      .then(r => {
        const found = r && r.items ? r.items.find(s => s.product_id === productId) : null;
        const currentQty = found ? Number(found.quantity) : 0;
        state.currentTake.lines.push({
          product_id: productId,
          product_code: p.code,
          product_name: p.name,
          system_qty: currentQty,
          current_qty: currentQty,
          counted_qty: currentQty,
          note: '',
          receipt_id: null,
          receipt_code: null,
        });
        sel.value = '';
        refillStAddProductSelect();
        renderTakeLines();
      })
      .catch(() => {});
  }

  async function saveTakeDraft() {
    const t = state.currentTake;
    if (!t || t.status !== 'draft') return;
    const lines = t.lines.map(l => ({
      product_id: l.product_id,
      counted_qty: Number(l.counted_qty) || 0,
      note: l.note || null,
    }));
    // Lưu note phiên: hiện tại API không hỗ trợ update note ở /lines, để client side giữ.
    const r = await api.put(`/admin/inventory/stocktakes/${t.id}/lines`, { lines }, {
      successMessage: 'Đã lưu nháp',
    }).catch(() => null);
    if (!r) return;
    await openTake(t.id);  // reload để cập nhật current_qty mới nhất
  }

  async function finishTake() {
    const t = state.currentTake;
    if (!t || t.status !== 'draft') return;
    if (!t.lines.length) return ui.toast('Phiên chưa có SP nào', 'warning');

    // Save trước rồi finish (đảm bảo BE có lines mới nhất)
    const lines = t.lines.map(l => ({
      product_id: l.product_id,
      counted_qty: Number(l.counted_qty) || 0,
      note: l.note || null,
    }));
    const saved = await api.put(`/admin/inventory/stocktakes/${t.id}/lines`, { lines }, { silent: true })
      .catch(() => null);
    if (!saved) {
      ui.toast('Không lưu được trước khi chốt', 'error');
      return;
    }

    if (!window.confirm('Hoàn tất phiên kiểm kê? Hệ thống sẽ tự sinh phiếu cân kho cho từng SP chênh lệch và cập nhật tồn kho.')) return;

    const r = await api.post(`/admin/inventory/stocktakes/${t.id}/finish`, {}, {
      successMessage: 'Đã hoàn tất phiên kiểm kê',
    }).catch(() => null);
    if (!r) return;
    await openTake(t.id);
    loadStats();
    if (state.activeTab === 'stock')        loadStock();
    if (state.activeTab === 'stocktakes')   loadTakes();
    if (state.activeTab === 'receipts-in')  loadReceipts('in');
    if (state.activeTab === 'receipts-out') loadReceipts('out');
  }

  async function cancelTake() {
    const t = state.currentTake;
    if (!t || t.status !== 'draft') return;
    if (!window.confirm('Huỷ phiên kiểm kê này? Mọi line đã nhập sẽ không được áp dụng vào kho.')) return;
    const r = await api.post(`/admin/inventory/stocktakes/${t.id}/cancel`, {}, {
      successMessage: 'Đã huỷ phiên',
    }).catch(() => null);
    if (!r) return;
    $('stocktakeModal').classList.remove('open');
    if (state.activeTab === 'stocktakes') loadTakes();
  }

  // ==================== INIT ====================
  async function loadDropdowns() {
    const [pRes, sRes] = await Promise.all([
      api.get('/admin/inventory/products/all', { silent: true }).catch(() => null),
      api.get('/admin/suppliers?limit=200', { silent: true }).catch(() => null),
    ]);
    state.products = pRes ? pRes.items : [];
    state.suppliers = sRes ? (sRes.items || sRes) : [];

    // Populate danh mục filter từ danh sách sản phẩm
    const cats = [...new Set(state.products.map(p => p.category).filter(Boolean))].sort();
    const sel = $('f_stock_cat');
    cats.forEach(c => {
      const o = document.createElement('option');
      o.value = c; o.textContent = c;
      sel.appendChild(o);
    });
  }

  function bindEvents() {
    document.querySelectorAll('.inv-tab').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Tab 1 filters
    $('f_stock_q').addEventListener('input', debounce(() => {
      state.stock.q = $('f_stock_q').value.trim();
      state.stock.page = 1; loadStock();
    }, 300));
    $('f_stock_cat').addEventListener('change', () => {
      state.stock.cat = $('f_stock_cat').value;
      state.stock.page = 1; loadStock();
    });
    $('f_stock_state').addEventListener('change', () => {
      state.stock.stock_state = $('f_stock_state').value;
      state.stock.page = 1; loadStock();
    });
    $('f_stock_qty_min').addEventListener('input', debounce(() => {
      state.stock.qty_min = $('f_stock_qty_min').value;
      state.stock.page = 1; loadStock();
    }, 400));
    $('f_stock_qty_max').addEventListener('input', debounce(() => {
      state.stock.qty_max = $('f_stock_qty_max').value;
      state.stock.page = 1; loadStock();
    }, 400));
    $('stockPrev').addEventListener('click', () => { if (state.stock.page > 1) { state.stock.page--; loadStock(); }});
    $('stockNext').addEventListener('click', () => { state.stock.page++; loadStock(); });

    // Tab 2 (in)
    $('f_in_q').addEventListener('input', debounce(() => {
      state.inR.q = $('f_in_q').value.trim();
      state.inR.page = 1; loadReceipts('in');
    }, 300));
    $('f_in_reason').addEventListener('change', () => {
      state.inR.reason = $('f_in_reason').value;
      state.inR.page = 1; loadReceipts('in');
    });
    $('f_in_from').addEventListener('change', () => { state.inR.from = $('f_in_from').value; state.inR.page = 1; loadReceipts('in'); });
    $('f_in_to').addEventListener('change',   () => { state.inR.to = $('f_in_to').value;     state.inR.page = 1; loadReceipts('in'); });
    $('inPrev').addEventListener('click', () => { if (state.inR.page > 1) { state.inR.page--; loadReceipts('in'); }});
    $('inNext').addEventListener('click', () => { state.inR.page++; loadReceipts('in'); });
    $('btnNewReceiptIn').addEventListener('click', () => openReceiptModal('in'));

    // Tab 3 (out)
    $('f_out_q').addEventListener('input', debounce(() => {
      state.outR.q = $('f_out_q').value.trim();
      state.outR.page = 1; loadReceipts('out');
    }, 300));
    $('f_out_reason').addEventListener('change', () => {
      state.outR.reason = $('f_out_reason').value;
      state.outR.page = 1; loadReceipts('out');
    });
    $('f_out_from').addEventListener('change', () => { state.outR.from = $('f_out_from').value; state.outR.page = 1; loadReceipts('out'); });
    $('f_out_to').addEventListener('change',   () => { state.outR.to = $('f_out_to').value;     state.outR.page = 1; loadReceipts('out'); });
    $('outPrev').addEventListener('click', () => { if (state.outR.page > 1) { state.outR.page--; loadReceipts('out'); }});
    $('outNext').addEventListener('click', () => { state.outR.page++; loadReceipts('out'); });
    $('btnNewReceiptOut').addEventListener('click', () => openReceiptModal('out'));

    // Tab 4
    $('f_hold_q').addEventListener('input', debounce(() => {
      state.hold.q = $('f_hold_q').value.trim();
      loadHoldings();
    }, 300));

    // Receipt modal
    $('receiptModalClose').addEventListener('click', () => $('receiptModal').classList.remove('open'));
    $('receiptCancel').addEventListener('click',     () => $('receiptModal').classList.remove('open'));
    $('btnAddLine').addEventListener('click', addLine);
    $('r_reason').addEventListener('change', toggleSupplierField);
    $('receiptFrm').addEventListener('submit', submitReceipt);

    // Detail modal
    $('rdClose').addEventListener('click',    () => $('receiptDetailModal').classList.remove('open'));
    $('rdCloseBtn').addEventListener('click', () => $('receiptDetailModal').classList.remove('open'));
    $('btnVoidReceipt').addEventListener('click', voidCurrentReceipt);

    // History modal
    $('hsClose').addEventListener('click',    () => $('historyModal').classList.remove('open'));
    $('hsCloseBtn').addEventListener('click', () => $('historyModal').classList.remove('open'));

    // Tab 5: Stocktakes
    $('f_st_status').addEventListener('change', () => {
      state.takes.status = $('f_st_status').value;
      state.takes.page = 1; loadTakes();
    });
    $('f_st_from').addEventListener('change', () => {
      state.takes.from = $('f_st_from').value;
      state.takes.page = 1; loadTakes();
    });
    $('f_st_to').addEventListener('change', () => {
      state.takes.to = $('f_st_to').value;
      state.takes.page = 1; loadTakes();
    });
    $('stPrev').addEventListener('click', () => { if (state.takes.page > 1) { state.takes.page--; loadTakes(); }});
    $('stNext').addEventListener('click', () => { state.takes.page++; loadTakes(); });
    $('btnNewStocktake').addEventListener('click', openNewStocktake);

    // Stocktake modal
    $('stClose').addEventListener('click',     () => $('stocktakeModal').classList.remove('open'));
    $('stCancelBtn').addEventListener('click', () => $('stocktakeModal').classList.remove('open'));
    $('btnStAddProduct').addEventListener('click', addProductToTake);
    $('btnStSaveDraft').addEventListener('click', saveTakeDraft);
    $('btnStFinish').addEventListener('click', finishTake);
    $('btnStCancelTake').addEventListener('click', cancelTake);
  }

  function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  async function init() {
    adminShell.init('inventory');
    bindEvents();
    await loadDropdowns();
    await loadStats();
    await loadStock();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
