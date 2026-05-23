// Trang Kho v3 — Tổng quan kho với sidebar lọc

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

  // Bảng màu cho category pill
  const CAT_COLORS = [
    { bg: '#dbeafe', text: '#1e40af' },
    { bg: '#dcfce7', text: '#166534' },
    { bg: '#ede9fe', text: '#5b21b6' },
    { bg: '#fce7f3', text: '#9d174d' },
    { bg: '#fef3c7', text: '#92400e' },
    { bg: '#cffafe', text: '#155e75' },
    { bg: '#fef9c3', text: '#713f12' },
    { bg: '#f3f4f6', text: '#374151' },
  ];
  function catColor(name) {
    let h = 0;
    if (name) for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
    return CAT_COLORS[h % CAT_COLORS.length];
  }

  const state = {
    activeTab: 'stock',
    products: [],
    suppliers: [],
    stock: { q: '', stock_state: '', cat_id: '', qty_min: '', qty_max: '', page: 1, limit: 20, total: 0 },
    inR:   { q: '', reason: '', from: '', to: '', page: 1, limit: 20, total: 0 },
    outR:  { q: '', reason: '', from: '', to: '', page: 1, limit: 20, total: 0 },
    hold:  { q: '' },
    takes: { status: '', from: '', to: '', page: 1, limit: 20, total: 0 },
    receiptDraft: { kind: 'in', lines: [] },
    currentReceiptId: null,
    currentTake: null,
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
      return `<img src="${escape(p.thumbnail_url || p.image_url)}" class="prod-thumb" alt="">`;
    }
    const i = (p.code || p.name || '?').trim().charAt(0).toUpperCase();
    return `<div class="prod-thumb-fb">${i}</div>`;
  }

  function stockBadge(q) {
    const n = Number(q);
    if (n === 0) return `<div class="stock-val"><span class="stock-dot out"></span><span class="pill red" style="font-size:10px">Hết</span></div>`;
    if (n < 5)   return `<div class="stock-val"><b>${n}</b><span class="stock-dot low"></span><br><span class="pill amber" style="font-size:10px;margin-top:2px">Sắp hết</span></div>`;
    return `<div class="stock-val"><b>${n}</b><span class="stock-dot ok"></span></div>`;
  }

  function catPill(name) {
    if (!name) return '<span style="color:#94a3b8;font-size:12px">—</span>';
    const c = catColor(name);
    return `<span class="cat-pill" style="background:${c.bg};color:${c.text}">${escape(name)}</span>`;
  }

  function reasonBadge(code) {
    const label = REASON_LABELS[code] || code;
    let cls = 'gray';
    if (['import_supplier','order_cancel_return','order_return_done','technician_return'].includes(code)) cls = 'green';
    else if (code === 'adjust_plus') cls = 'blue';
    else if (['order_release','technician_take','technician_take_direct'].includes(code)) cls = 'amber';
    else if (code === 'install_done') cls = 'blue';
    else if (['damaged','return_supplier','adjust_minus'].includes(code)) cls = 'red';
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
    if (s.total_value != null) {
      $('st-value').textContent = fmt.format(s.total_value) + 'đ';
    }
  }

  // ==================== CATEGORY SIDEBAR ====================
  function buildCatList() {
    const catMap = new Map(); // id → { name, count }
    state.products.forEach(p => {
      if (!p.category_id) return;
      if (!catMap.has(p.category_id)) catMap.set(p.category_id, { name: p.category_name || '', count: 0 });
      catMap.get(p.category_id).count++;
    });

    // Điền select dropdown
    const sel = $('f_stock_cat');
    sel.innerHTML = '<option value="">Tất cả</option>';
    catMap.forEach((v, id) => {
      const o = document.createElement('option');
      o.value = id; o.textContent = v.name || `Danh mục #${id}`;
      sel.appendChild(o);
    });

    // Category quick-list trong sidebar
    const total = state.products.length;
    const listEl = $('inv-cat-list');
    const allActive = !state.stock.cat_id;
    let html = `<div class="inv-cat-item ${allActive ? 'active' : ''}" data-cat-id="">
      <span>🗂 Tất cả</span><span class="cnt">${total}</span>
    </div>`;
    catMap.forEach((v, id) => {
      const active = String(state.stock.cat_id) === String(id);
      const c = catColor(v.name);
      html += `<div class="inv-cat-item ${active ? 'active' : ''}" data-cat-id="${id}">
        <span><span class="cat-pill" style="background:${c.bg};color:${c.text};padding:1px 7px;font-size:11px">${escape(v.name)}</span></span>
        <span class="cnt">${v.count}</span>
      </div>`;
    });
    listEl.innerHTML = html;

    listEl.querySelectorAll('.inv-cat-item').forEach(el => {
      el.addEventListener('click', () => {
        const catId = el.dataset.catId;
        state.stock.cat_id = catId;
        state.stock.page = 1;
        // Sync select
        $('f_stock_cat').value = catId;
        // Re-render sidebar
        buildCatList();
        loadStock();
      });
    });
  }

  // ==================== TAB 1: STOCK ====================
  async function loadStock() {
    const p = new URLSearchParams();
    if (state.stock.q)           p.set('q', state.stock.q);
    if (state.stock.stock_state) p.set('stock_state', state.stock.stock_state);
    if (state.stock.cat_id)      p.set('category_id', state.stock.cat_id);
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
      $('tbody-stock').innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:30px">Chưa có sản phẩm nào</td></tr>`;
      return;
    }
    $('tbody-stock').innerHTML = items.map(p => `
      <tr>
        <td>
          <div class="prod-cell">
            ${thumbCell(p)}
            <div class="prod-info">
              <div class="prod-name">${escape(p.name)}</div>
              ${p.description ? `<div class="prod-desc">${escape(p.description)}</div>` : `<div class="prod-desc" style="color:#cbd5e1">${escape(p.code)}</div>`}
            </div>
          </div>
        </td>
        <td data-label="Danh mục">${catPill(p.category_name)}</td>
        <td data-label="Giá gốc" style="font-size:13px">${fmt.format(p.cost_price || 0)}đ</td>
        <td data-label="Tồn">${stockBadge(Number(p.quantity))}</td>
        <td data-label="KTV giữ">${p.held_qty > 0 ? `<span class="pill blue" style="font-size:11px">${p.held_qty}</span>` : '<span style="color:#94a3b8">0</span>'}</td>
        <td data-label="Bán 30d">${p.sold_30d > 0 ? `<b>${p.sold_30d}</b>` : '<span style="color:#94a3b8">0</span>'}</td>
        <td data-label="Hành động" style="white-space:nowrap">
          <button class="icon-btn" data-act="history" data-id="${p.product_id}" data-name="${escape(p.code + ' — ' + p.name)}" title="Lịch sử nhập/xuất">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </button>
          <button class="icon-btn" data-act="adjust" data-id="${p.product_id}" data-name="${escape(p.code + ' — ' + p.name)}" data-qty="${p.quantity}" title="Cân kho" style="margin-left:4px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 1 0 0 14.14"/><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 2 22 9"/></svg>
          </button>
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
    else if (btn.dataset.act === 'adjust') openAdjust(id, name, Number(btn.dataset.qty));
  });

  // Export CSV
  async function exportCsv() {
    const p = new URLSearchParams();
    if (state.stock.q)           p.set('q', state.stock.q);
    if (state.stock.stock_state) p.set('stock_state', state.stock.stock_state);
    if (state.stock.cat_id)      p.set('category_id', state.stock.cat_id);
    if (state.stock.qty_min !== '') p.set('qty_min', state.stock.qty_min);
    if (state.stock.qty_max !== '') p.set('qty_max', state.stock.qty_max);
    p.set('page', 1);
    p.set('limit', 500);
    const res = await api.get('/admin/inventory/stock?' + p.toString(), { silent: true }).catch(() => null);
    if (!res || !res.items.length) { ui.toast('Không có dữ liệu', 'warning'); return; }
    const rows = [['Mã TB', 'Tên sản phẩm', 'Danh mục', 'Giá gốc', 'Tồn kho', 'KTV giữ', 'Bán 30d']];
    res.items.forEach(p => rows.push([
      p.code, p.name, p.category_name || '',
      p.cost_price || 0, p.quantity, p.held_qty, p.sold_30d,
    ]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ton-kho.csv'; a.click();
    URL.revokeObjectURL(url);
  }

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
          <td data-label="Mã phiếu"><b>${escape(r.code)}</b></td>
          <td data-label="Ngày">${fmtDate(r.created_at)}</td>
          <td data-label="Lý do">${reasonBadge(r.reason_code)}</td>
          <td data-label="Items">${preview}</td>
          <td data-label="Người tạo">${escape(r.created_by_name || '—')}</td>
          <td data-label="SL"><b>${r.total_qty}</b></td>
          <td data-label="Trạng thái">${r.is_voided
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
      $('tbody-hold').innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:30px">Không có KTV nào đang giữ thiết bị</td></tr>`;
      return;
    }
    $('tbody-hold').innerHTML = res.items.map(h => `
        <tr>
          <td data-label="KTV"><b>${escape(h.staff_name)}</b></td>
          <td data-label="Mã TB"><code style="font-size:12px">${escape(h.product_code)}</code></td>
          <td data-label="Sản phẩm">${escape(h.product_name)}</td>
          <td data-label="SL"><b>${h.qty}</b></td>
          <td data-label="Ngày nhận">${fmtDate(h.first_held_at)}</td>
        </tr>`).join('');
  }

  // ==================== TAB SWITCH ====================
  function switchTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll('.inv-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.inv-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === tab));
    const statsRow = document.getElementById('inv-stats-row');
    if (statsRow) statsRow.style.display = tab === 'stock' ? '' : 'none';
    if (tab === 'stock')              loadStock();
    else if (tab === 'receipts-in')  loadReceipts('in');
    else if (tab === 'receipts-out') loadReceipts('out');
    else if (tab === 'holdings')     loadHoldings();
    else if (tab === 'stocktakes')   loadTakes();
  }

  // ==================== MODAL: TẠO PHIẾU ====================
  function openReceiptModal(kind, presetReason) {
    state.receiptDraft = { kind, lines: [] };
    $('r_kind').value = kind;
    $('receiptModalTitle').textContent = kind === 'in' ? 'Tạo phiếu nhập' : 'Tạo phiếu xuất';
    const reasons = kind === 'in' ? ADMIN_REASONS_IN : ADMIN_REASONS_OUT;
    $('r_reason').innerHTML = reasons.map(r =>
      `<option value="${r}">${escape(REASON_LABELS[r])}</option>`).join('');
    if (presetReason) $('r_reason').value = presetReason;
    toggleSupplierField();
    document.querySelectorAll('#r_lines_table .r-price').forEach(el => el.style.display = kind === 'in' ? '' : 'none');
    document.querySelectorAll('#r_lines_table .r-imei').forEach(el => el.style.display = kind === 'out' ? '' : 'none');
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
      successMessage: `Đã lưu phiếu`,
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
          ? `<a href="/admin/orders.html#order-${r.ref_order_id}" target="_blank" data-order-quick="${r.ref_order_id}" style="color:#2563eb;text-decoration:underline">${escape(r.order_code)}</a>${ui.copyCodeBtn(r.order_code)}`
          : escape(r.order_code) + ui.copyCodeBtn(r.order_code)
      }</div></div>` : ''}
      ${r.ref_staff_name ? `<div><div class="lbl">KTV</div><div class="val">${escape(r.ref_staff_name)}</div></div>` : ''}
      ${r.stock_take_code ? `<div><div class="lbl">Phiên kiểm kê</div><div class="val"><b>${escape(r.stock_take_code)}</b></div></div>` : ''}
      <div><div class="lbl">Người tạo</div><div class="val">${escape(r.created_by_name || '—')}</div></div>
      ${r.reason_text ? `<div style="grid-column:1/-1"><div class="lbl">Ghi chú</div><div class="val">${escape(r.reason_text)}</div></div>` : ''}
      ${r.is_voided ? `<div style="grid-column:1/-1"><div class="lbl">Đã hủy</div><div class="val" style="color:#dc2626">${fmtDate(r.voided_at)} — ${escape(r.voided_reason || '')}</div></div>` : ''}
    `;
    $('rdItems').innerHTML = !r.items.length
      ? `<div style="padding:14px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;color:#0369a1">
           <b>Phiếu rỗng — không có vật tư.</b>
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
                  ? `<a href="/admin/orders.html#order-${it.ref_order_id}" target="_blank" data-order-quick="${it.ref_order_id}" style="color:#2563eb;text-decoration:underline"><b>${escape(it.order_code)}</b></a>`
                  : `<b>${escape(it.order_code)}</b>`}${ui.copyCodeBtn(it.order_code)} ` : ''}
                ${it.supplier_name ? `NCC: ${escape(it.supplier_name)} ` : ''}
                ${it.ref_staff_name ? `KTV: ${escape(it.ref_staff_name)}` : ''}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    `;
  }

  // ==================== MODAL: CÂN KHO ====================
  function openAdjust(productId, name, currentQty) {
    $('adj_product_id').value = productId;
    $('adjTitle').textContent = `Cân kho — ${name}`;
    $('adj_qty').value = 1;
    $('adj_note').value = '';
    $('adjCurrentQty').textContent = currentQty ?? '…';
    state._adjCurrentQty = currentQty ?? 0;
    state._adjDir = 'plus';
    syncAdjDirUI();
    updateAdjPreview();
    $('adjustModal').classList.add('open');
    setTimeout(() => $('adj_qty').focus(), 50);
  }

  function syncAdjDirUI() {
    const isPlus = state._adjDir === 'plus';
    $('adjBtnPlus').classList.toggle('active', isPlus);
    $('adjBtnMinus').classList.toggle('active', !isPlus);
    $('adjSubmit').className = `btn adj-submit-btn ${isPlus ? 'plus-mode' : 'minus-mode'}`;
  }

  function updateAdjPreview() {
    const dir    = state._adjDir;
    const qty    = Math.max(1, parseInt($('adj_qty').value) || 1);
    const cur    = state._adjCurrentQty ?? 0;
    const result = dir === 'plus' ? cur + qty : cur - qty;
    const isNeg  = result < 0;
    const cls    = isNeg ? 'neg' : (dir === 'plus' ? 'plus' : 'minus');
    $('adjResultCard').className  = `adj-flow-card adj-flow-result-card ${cls}`;
    $('adjResultQty').textContent = result;
    $('adjPreview').className     = `adj-preview-badge ${cls}`;
    $('adjPreviewLabel').textContent = dir === 'plus' ? `Thêm +${qty} vào kho` : `Trừ −${qty} khỏi kho`;
  }

  async function submitAdjust(ev) {
    ev.preventDefault();
    const productId = Number($('adj_product_id').value);
    const dir  = state._adjDir;
    const qty  = Math.max(1, parseInt($('adj_qty').value) || 1);
    const note = $('adj_note').value.trim() || null;
    if (!productId) return;
    const cur = state._adjCurrentQty ?? 0;
    if (dir === 'minus' && qty > cur) {
      ui.toast(`Không thể trừ ${qty} khi tồn chỉ còn ${cur}`, 'warning');
      return;
    }
    const res = await api.post('/admin/inventory/receipts', {
      kind: dir === 'plus' ? 'in' : 'out',
      reason_code: dir === 'plus' ? 'adjust_plus' : 'adjust_minus',
      reason_text: note,
      items: [{ product_id: productId, qty, note }],
    }, {
      successMessage: `Đã cân kho ${dir === 'plus' ? '+' : '−'}${qty}`,
    }).catch(() => null);
    if (!res) return;
    $('adjustModal').classList.remove('open');
    loadStats();
    if (state.activeTab === 'stock')             loadStock();
    else if (state.activeTab === 'receipts-in')  loadReceipts('in');
    else if (state.activeTab === 'receipts-out') loadReceipts('out');
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
        <td data-label="Mã phiên"><b>${escape(t.code)}</b></td>
        <td data-label="Bắt đầu">${fmtDate(t.started_at)}</td>
        <td data-label="Kết thúc">${t.finished_at ? fmtDate(t.finished_at) : '<span class="text-muted">—</span>'}</td>
        <td data-label="Người mở">${escape(t.by_staff_name || '—')}</td>
        <td data-label="Số dòng"><b>${t.line_count}</b></td>
        <td data-label="Chênh lệch">${t.status === 'finished' ? `<b>${t.total_variance_abs}</b>` : '<span class="text-muted">—</span>'}</td>
        <td data-label="Trạng thái">${stocktakeStatusPill(t.status)}</td>
        <td data-label="Ghi chú"><small class="text-muted">${escape(t.note || '')}</small></td>
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
    const r = await api.put(`/admin/inventory/stocktakes/${t.id}/lines`, { lines }, {
      successMessage: 'Đã lưu nháp',
    }).catch(() => null);
    if (!r) return;
    await openTake(t.id);
  }

  async function finishTake() {
    const t = state.currentTake;
    if (!t || t.status !== 'draft') return;
    if (!t.lines.length) return ui.toast('Phiên chưa có SP nào', 'warning');
    const lines = t.lines.map(l => ({
      product_id: l.product_id,
      counted_qty: Number(l.counted_qty) || 0,
      note: l.note || null,
    }));
    const saved = await api.put(`/admin/inventory/stocktakes/${t.id}/lines`, { lines }, { silent: true })
      .catch(() => null);
    if (!saved) { ui.toast('Không lưu được trước khi chốt', 'error'); return; }
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
    buildCatList();
  }

  function bindEvents() {
    document.querySelectorAll('.inv-tab').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Topnav search → live filter
    $('f_stock_q').addEventListener('input', debounce(() => {
      state.stock.q = $('f_stock_q').value.trim();
      state.stock.page = 1;
      if (state.activeTab === 'stock') loadStock();
    }, 300));

    // Sidebar apply button
    $('btnApplyFilter').addEventListener('click', () => {
      state.stock.cat_id      = $('f_stock_cat').value;
      state.stock.stock_state = $('f_stock_state').value;
      state.stock.qty_min     = $('f_stock_qty_min').value;
      state.stock.qty_max     = $('f_stock_qty_max').value;
      state.stock.page = 1;
      buildCatList();
      loadStock();
    });

    // Đặt lại
    $('btnResetFilter').addEventListener('click', () => {
      $('f_stock_q').value       = '';
      $('f_stock_cat').value     = '';
      $('f_stock_state').value   = '';
      $('f_stock_qty_min').value = '';
      $('f_stock_qty_max').value = '';
      state.stock = { ...state.stock, q: '', stock_state: '', cat_id: '', qty_min: '', qty_max: '', page: 1 };
      buildCatList();
      loadStock();
    });

    // Per-page
    $('stockPerPage').addEventListener('change', () => {
      state.stock.limit = Number($('stockPerPage').value);
      state.stock.page = 1;
      loadStock();
    });

    $('stockPrev').addEventListener('click', () => { if (state.stock.page > 1) { state.stock.page--; loadStock(); }});
    $('stockNext').addEventListener('click', () => { state.stock.page++; loadStock(); });

    // Export
    $('btnExportCsv').addEventListener('click', exportCsv);

    // Tab 2 (in)
    $('f_in_q').addEventListener('input', debounce(() => {
      state.inR.q = $('f_in_q').value.trim();
      state.inR.page = 1; loadReceipts('in');
    }, 300));
    $('f_in_reason').addEventListener('change', () => { state.inR.reason = $('f_in_reason').value; state.inR.page = 1; loadReceipts('in'); });
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
    $('f_out_reason').addEventListener('change', () => { state.outR.reason = $('f_out_reason').value; state.outR.page = 1; loadReceipts('out'); });
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
    $('f_st_status').addEventListener('change', () => { state.takes.status = $('f_st_status').value; state.takes.page = 1; loadTakes(); });
    $('f_st_from').addEventListener('change', () => { state.takes.from = $('f_st_from').value; state.takes.page = 1; loadTakes(); });
    $('f_st_to').addEventListener('change', () => { state.takes.to = $('f_st_to').value; state.takes.page = 1; loadTakes(); });
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

    // Adjust modal
    $('adjClose').addEventListener('click',  () => $('adjustModal').classList.remove('open'));
    $('adjCancel').addEventListener('click', () => $('adjustModal').classList.remove('open'));
    $('adjFrm').addEventListener('submit', submitAdjust);
    $('adj_qty').addEventListener('input', updateAdjPreview);
    $('adjBtnPlus').addEventListener('click',  () => { state._adjDir = 'plus';  syncAdjDirUI(); updateAdjPreview(); });
    $('adjBtnMinus').addEventListener('click', () => { state._adjDir = 'minus'; syncAdjDirUI(); updateAdjPreview(); });
    $('adjStepDown').addEventListener('click', () => {
      $('adj_qty').value = Math.max(1, (parseInt($('adj_qty').value) || 1) - 1);
      updateAdjPreview();
    });
    $('adjStepUp').addEventListener('click', () => {
      $('adj_qty').value = (parseInt($('adj_qty').value) || 1) + 1;
      updateAdjPreview();
    });

    // Supplier dialog
    $('btnManageSuppliers').addEventListener('click', openSupplierDialog);
    $('supplierModalClose').addEventListener('click', closeSupplierDialog);
    $('supplierModalCloseBtn').addEventListener('click', closeSupplierDialog);
    $('supplierModal').addEventListener('click', (e) => { if (e.target.id === 'supplierModal') closeSupplierDialog(); });
    let supSearchTimer;
    $('sup_search').addEventListener('input', () => {
      clearTimeout(supSearchTimer);
      supSearchTimer = setTimeout(() => loadSuppliersDialog(), 300);
    });
    $('btnAddSupplier').addEventListener('click', () => openSupplierForm(null));
    $('supFormClose').addEventListener('click', closeSupplierForm);
    $('supFormCancel').addEventListener('click', closeSupplierForm);
    $('supplierFormModal').addEventListener('click', (e) => { if (e.target.id === 'supplierFormModal') closeSupplierForm(); });
    $('supFrm').addEventListener('submit', handleSupplierSubmit);
    $('tbody-suppliers').addEventListener('click', handleSupplierTableClick);
  }

  function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  // ==================== SUPPLIER DIALOG ====================
  async function loadSuppliersDialog() {
    const q = $('sup_search') ? $('sup_search').value.trim() : '';
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    p.set('limit', 200);
    const res = await api.get('/admin/suppliers?' + p.toString(), { silent: true }).catch(() => null);
    if (!res) return;
    const items = res.items || res || [];
    const tb = $('tbody-suppliers');
    if (!items.length) {
      tb.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:24px">Chưa có nhà cung cấp nào</td></tr>`;
      return;
    }
    tb.innerHTML = items.map(s => `
      <tr>
        <td><span class="text-muted">#${s.id}</span></td>
        <td><b>${escape(s.name)}</b></td>
        <td>${escape(s.phone || '')}</td>
        <td>${escape(s.address || '')}</td>
        <td style="font-size:12.5px;color:#64748b">${escape(s.note || '')}</td>
        <td>
          <button class="btn ghost sm" data-act="sup-edit" data-id="${s.id}">Sửa</button>
          <button class="btn ghost sm" data-act="sup-del" data-id="${s.id}" style="color:#dc2626">Xóa</button>
        </td>
      </tr>
    `).join('');
    state.suppliers = items;
  }

  function openSupplierDialog() {
    $('sup_search').value = '';
    $('supplierModal').classList.add('open');
    loadSuppliersDialog();
  }
  function closeSupplierDialog() { $('supplierModal').classList.remove('open'); }

  function openSupplierForm(s) {
    $('supFormTitle').textContent = s ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp';
    $('sup_f_id').value      = s ? s.id : '';
    $('sup_f_name').value    = s ? (s.name || '')    : '';
    $('sup_f_phone').value   = s ? (s.phone || '')   : '';
    $('sup_f_address').value = s ? (s.address || '') : '';
    $('sup_f_note').value    = s ? (s.note || '')    : '';
    $('supplierFormModal').classList.add('open');
    setTimeout(() => $('sup_f_name').focus(), 50);
  }
  function closeSupplierForm() { $('supplierFormModal').classList.remove('open'); }

  async function handleSupplierSubmit(e) {
    e.preventDefault();
    const id = $('sup_f_id').value;
    const data = {
      name:    $('sup_f_name').value.trim(),
      phone:   $('sup_f_phone').value.trim() || null,
      address: $('sup_f_address').value.trim() || null,
      note:    $('sup_f_note').value.trim() || null,
    };
    if (!data.name) return ui.toast('Thiếu tên NCC', 'warning');
    $('btnSaveSupplier').disabled = true;
    const ok = await (id
      ? api.put('/admin/suppliers/' + id, data, { successMessage: 'Đã cập nhật NCC', loading: true })
      : api.post('/admin/suppliers',     data, { successMessage: 'Đã tạo NCC',     loading: true })
    ).catch(() => null);
    $('btnSaveSupplier').disabled = false;
    if (!ok) return;
    closeSupplierForm();
    loadSuppliersDialog();
  }

  async function handleSupplierTableClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === 'sup-edit') {
      const s = await api.get('/admin/suppliers/' + id).catch(() => null);
      if (s) openSupplierForm(s);
    } else if (act === 'sup-del') {
      const yes = await ui.confirm({
        title: 'Xác nhận xoá',
        message: 'Xoá nhà cung cấp này?',
        type: 'warning',
        okText: 'Xoá',
      });
      if (!yes) return;
      const ok = await api.delete('/admin/suppliers/' + id, {
        successMessage: 'Đã xoá NCC',
      }).catch(() => null);
      if (ok) loadSuppliersDialog();
    }
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
