// /admin/new-order.html — tao don moi v3 (multi-line, mig 052).
//
// 1 don = N dong cong viec, moi dong:
//   - 1 template (loai cong viec) tu order_templates
//   - items + charges + custom field values rieng
// Status + KTV + thanh toan o cap don.

(function () {
  'use strict';

  const PAGE_QS = new URLSearchParams(location.search);
  const IS_WARRANTY = PAGE_QS.get('service_kind') === 'warranty';
  if (IS_WARRANTY) {
    location.replace('/admin/inventory.html');
    return;
  }

  let _lineSeq = 0;
  function newLineId() { return 'L' + (++_lineSeq); }

  // Parse "1,234,567" / "1.234.567" / "1234567" -> 1234567
  function parseNum(s) {
    if (s == null) return 0;
    const cleaned = String(s).replace(/[^\d-]/g, '');
    return Number(cleaned) || 0;
  }
  // Format 1234567 -> "1,234,567" (cho input price)
  function fmtNum(n) {
    const v = Number(n) || 0;
    return new Intl.NumberFormat('vi-VN').format(v);
  }

  // Truong mac dinh trong hop thong tin moi san pham
  const DEFAULT_ITEM_FIELDS = ['Biển số xe', 'IMEI', 'Tên tài khoản', 'Số SIM'];

  const state = {
    templates: [],         // [{id, name}]
    templateById: {},      // {id: tplFullDetail}
    customer: null,
    custResults: [],
    custFilter: { q: '', name: '', phone: '', type: '' },
    custPanelOpen: false,
    products: [],
    suppliers: [],
    staffList: [],         // All employees
    lines: [],             // [{lid, template_id, custom_name, items:[{product_id,qty,unit_price,field_values:[{label,value}]}], charges:[{kind,label,amount}]}]
    photos: [],            // [{url, caption}]
    staffCommissions: [],  // [{staff_id, amount, note}]
    serviceKind: IS_WARRANTY ? 'warranty' : '',
    warranty: {
      warranty_mode: 'repair',
      default_supplier_id: 0,
      note_text: '',
      items: [],
    },
  };

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function fmt(n) { return new Intl.NumberFormat('vi-VN').format(Number(n) || 0); }
  function fmtVnd(n) { return fmt(n) + 'đ'; }
  function normalizeLooseText(input) {
    return String(input || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
  function looksLikeWarrantyText(input) {
    const value = normalizeLooseText(input);
    return value === 'bao hanh' || value.includes('bao hanh');
  }
  function lineLooksWarranty(ln) {
    const tpl = state.templateById[ln.template_id] || state.templates.find(t => t.id === ln.template_id);
    const lineName = ln.custom_name || (tpl ? tpl.name : '');
    return looksLikeWarrantyText(lineName);
  }
  function initial(s) {
    const t = String(s || '').trim();
    if (!t) return '?';
    const parts = t.split(/\s+/);
    return (parts[parts.length - 1][0] || t[0] || '?').toUpperCase();
  }
  function todayVN() {
    const d = new Date();
    return d.toLocaleDateString('vi-VN');
  }

  function initPageMode() {}

  function newWarrantyItem() {
    return {
      id: null,
      item_role: 'faulty',
      handling_type: 'pending',
      product_id: 0,
      supplier_id: 0,
      qty: 1,
      device_name: '',
      imei: '',
      license_plate: '',
      account_name: '',
      sim_number: '',
      condition_note: '',
      note_text: '',
      additional_cost: 0,
    };
  }

  function renderModeExtra() {
    const $box = document.getElementById('modeExtraBox');
    if (!$box) return;
    if (!IS_WARRANTY) {
      $box.innerHTML = '';
      return;
    }

    const supplierOpts = ['<option value="0">— Chưa chọn NCC —</option>']
      .concat(state.suppliers.map(s => (
        `<option value="${s.id}" ${Number(state.warranty.default_supplier_id) === Number(s.id) ? 'selected' : ''}>${esc(s.name)}</option>`
      )))
      .join('');
    const curAddress = (document.getElementById('w_address') || document.getElementById('f_address') || {}).value || '';
    const curProgress = (document.getElementById('w_progress') || {}).value || '';
    const curNote = (document.getElementById('w_note') || document.getElementById('f_note') || {}).value || '';
    const curMetaNote = (document.getElementById('w_meta_note') || {}).value || state.warranty.note_text || '';

    $box.innerHTML = `
      <div class="no-card" style="padding:12px">
        <div class="row-act">
          <span class="lbl">🛠 Thông tin bảo hành</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">
          <div class="field" style="margin:0">
            <label>Loại xử lý</label>
            <select id="w_mode" class="select">
              <option value="repair" ${state.warranty.warranty_mode === 'repair' ? 'selected' : ''}>Sửa / xử lý nội bộ</option>
              <option value="exchange" ${state.warranty.warranty_mode === 'exchange' ? 'selected' : ''}>Đổi thiết bị</option>
              <option value="supplier_swap" ${state.warranty.warranty_mode === 'supplier_swap' ? 'selected' : ''}>Đổi trả NCC</option>
            </select>
          </div>
          <div class="field" style="margin:0">
            <label>Nhà cung cấp đổi trả</label>
            <select id="w_supplier" class="select">${supplierOpts}</select>
          </div>
          <div class="field" style="margin:0;grid-column:1 / -1">
            <label>Địa chỉ</label>
            <input id="w_address" type="text" class="input" value="${esc(curAddress)}" placeholder="Địa chỉ nhận / giao hàng">
          </div>
          <div class="field" style="margin:0;grid-column:1 / -1">
            <label>Thực tế hiện tại</label>
            <input id="w_progress" type="text" class="input" value="${esc(curProgress)}" placeholder="Ví dụ: KTV đã nhận máy, đang chờ gửi NCC">
          </div>
          <div class="field" style="margin:0;grid-column:1 / -1">
            <label>Ghi chú đơn</label>
            <textarea id="w_note" class="input" rows="2" placeholder="Ghi chú chung cho đơn bảo hành">${esc(curNote)}</textarea>
          </div>
          <div class="field" style="margin:0;grid-column:1 / -1">
            <label>Ghi chú bảo hành</label>
            <textarea id="w_meta_note" class="input" rows="2" placeholder="Ghi chú riêng cho xử lý bảo hành">${esc(curMetaNote)}</textarea>
          </div>
        </div>
      </div>

      <div class="no-card" style="padding:12px">
        <div class="row-act">
          <span class="lbl">📦 Thiết bị bảo hành</span>
          <div class="spacer"></div>
          <button type="button" class="btn ghost sm" id="btnAddWarrantyItem">+ Thêm thiết bị</button>
        </div>
        <div id="warrantyItemsBox"></div>
      </div>
    `;

    if (!state.warranty.items.length) state.warranty.items.push(newWarrantyItem());
    bindModeExtra();
    renderWarrantyItems();
  }

  function bindModeExtra() {
    if (!IS_WARRANTY) return;
    const $mode = document.getElementById('w_mode');
    const $supplier = document.getElementById('w_supplier');
    const $metaNote = document.getElementById('w_meta_note');
    const $btnAdd = document.getElementById('btnAddWarrantyItem');
    if ($mode) {
      $mode.addEventListener('change', () => { state.warranty.warranty_mode = $mode.value; });
    }
    if ($supplier) {
      $supplier.addEventListener('change', () => { state.warranty.default_supplier_id = Number($supplier.value) || 0; });
    }
    if ($metaNote) {
      $metaNote.addEventListener('input', () => { state.warranty.note_text = $metaNote.value; });
    }
    if ($btnAdd) {
      $btnAdd.addEventListener('click', () => {
        state.warranty.items.push(newWarrantyItem());
        renderWarrantyItems();
      });
    }
  }

  function renderWarrantyItemsLegacy() {
    const $box = document.getElementById('warrantyItemsBox');
    if (!$box || !IS_WARRANTY) return;
    const productOpts = ['<option value="0">— Chọn sản phẩm —</option>']
      .concat(state.products.map(p => (
        `<option value="${p.id}">${esc(p.code || '')}${p.code ? ' · ' : ''}${esc(p.name || '')}</option>`
      )))
      .join('');
    const supplierOpts = ['<option value="0">— Theo NCC mặc định —</option>']
      .concat(state.suppliers.map(s => `<option value="${s.id}">${esc(s.name)}</option>`))
      .join('');

    $box.innerHTML = state.warranty.items.map((item, idx) => `
      <div class="line-card" data-widx="${idx}" style="margin-bottom:10px">
        <div class="line-head">
          <div class="seq">${idx + 1}</div>
          <div style="font-weight:700;color:#0f172a">Thiết bị / vật tư bảo hành</div>
          <div class="spacer"></div>
          <button type="button" class="x-btn" data-act="del-warranty-item">Xóa</button>
        </div>
        <div class="line-body" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">
          <div class="field" style="margin:0">
            <label>Vai trò</label>
            <select class="select w-role">
              <option value="faulty" ${item.item_role === 'faulty' ? 'selected' : ''}>Hàng lỗi từ khách</option>
              <option value="replacement" ${item.item_role === 'replacement' ? 'selected' : ''}>Hàng thay thế</option>
              <option value="supplier_return" ${item.item_role === 'supplier_return' ? 'selected' : ''}>Hàng trả về từ NCC</option>
            </select>
          </div>
          <div class="field" style="margin:0">
            <label>Sản phẩm</label>
            <select class="select w-product">${productOpts}</select>
          </div>
          <div class="field" style="margin:0">
            <label>Số lượng</label>
            <input type="text" inputmode="numeric" class="input w-qty" value="${fmtNum(item.qty || 1)}">
          </div>
          <div class="field" style="margin:0">
            <label>NCC riêng</label>
            <select class="select w-supplier">${supplierOpts}</select>
          </div>
          <div class="field" style="margin:0">
            <label>Tên thiết bị</label>
            <input type="text" class="input w-device-name" value="${esc(item.device_name || '')}" placeholder="Ví dụ: Bộ định vị xe tải">
          </div>
          <div class="field" style="margin:0">
            <label>IMEI / Serial</label>
            <input type="text" class="input w-imei" value="${esc(item.imei || '')}" placeholder="IMEI hoặc serial">
          </div>
          <div class="field" style="margin:0">
            <label>Biển số</label>
            <input type="text" class="input w-plate" value="${esc(item.license_plate || '')}" placeholder="Biển số xe">
          </div>
          <div class="field" style="margin:0">
            <label>Tài khoản</label>
            <input type="text" class="input w-account" value="${esc(item.account_name || '')}" placeholder="Tên tài khoản">
          </div>
          <div class="field" style="margin:0">
            <label>SIM</label>
            <input type="text" class="input w-sim" value="${esc(item.sim_number || '')}" placeholder="Số SIM">
          </div>
          <div class="field" style="margin:0">
            <label>Tình trạng</label>
            <input type="text" class="input w-condition" value="${esc(item.condition_note || '')}" placeholder="Mô tả lỗi / tình trạng">
          </div>
          <div class="field" style="margin:0;grid-column:1 / -1">
            <label>Ghi chú item</label>
            <textarea class="input w-note" rows="2" placeholder="Ghi chú riêng cho item này">${esc(item.note_text || '')}</textarea>
          </div>
        </div>
      </div>
    `).join('');

    $box.querySelectorAll('.line-card').forEach(card => {
      const idx = Number(card.dataset.widx);
      const item = state.warranty.items[idx];
      const bindInput = (selector, key, parser) => {
        const el = card.querySelector(selector);
        if (!el) return;
        if (selector === '.w-product') el.value = String(item.product_id || 0);
        if (selector === '.w-supplier') el.value = String(item.supplier_id || 0);
        el.addEventListener('input', () => { item[key] = parser ? parser(el.value) : el.value; });
        el.addEventListener('change', () => { item[key] = parser ? parser(el.value) : el.value; });
      };
      bindInput('.w-role', 'item_role');
      bindInput('.w-product', 'product_id', (v) => Number(v) || 0);
      bindInput('.w-qty', 'qty', (v) => Math.max(1, parseNum(v) || 1));
      bindInput('.w-supplier', 'supplier_id', (v) => Number(v) || 0);
      bindInput('.w-device-name', 'device_name');
      bindInput('.w-imei', 'imei');
      bindInput('.w-plate', 'license_plate');
      bindInput('.w-account', 'account_name');
      bindInput('.w-sim', 'sim_number');
      bindInput('.w-condition', 'condition_note');
      bindInput('.w-note', 'note_text');

      const qtyEl = card.querySelector('.w-qty');
      if (qtyEl) {
        qtyEl.addEventListener('blur', () => { qtyEl.value = fmtNum(item.qty || 1); });
      }
      const delBtn = card.querySelector('[data-act="del-warranty-item"]');
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          if (state.warranty.items.length <= 1) {
            ui.toast('Cần ít nhất 1 item bảo hành', 'warning');
            return;
          }
          state.warranty.items.splice(idx, 1);
          renderWarrantyItems();
        });
      }
    });
  }

  function renderWarrantyItems() {
    const $box = document.getElementById('warrantyItemsBox');
    if (!$box || !IS_WARRANTY) return;
    const productOpts = ['<option value="0">— Chọn sản phẩm —</option>']
      .concat(state.products.map((p) => (
        `<option value="${p.id}">${esc(p.code || '')}${p.code ? ' · ' : ''}${esc(p.name || '')}</option>`
      )))
      .join('');
    const supplierOpts = ['<option value="0">— Theo NCC mặc định —</option>']
      .concat(state.suppliers.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`))
      .join('');

    $box.innerHTML = state.warranty.items.map((item, idx) => `
      <div class="line-card" data-widx="${idx}" style="margin-bottom:10px">
        <div class="line-head">
          <div class="seq">${idx + 1}</div>
          <div style="font-weight:700;color:#0f172a">Sản phẩm bảo hành</div>
          <div class="spacer"></div>
          <button type="button" class="x-btn" data-act="del-warranty-item">Xoá</button>
        </div>
        <div class="line-body" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">
          <div class="field" style="margin:0">
            <label>Xử lý dự kiến</label>
            <select class="select w-handling">
              <option value="pending" ${item.handling_type === 'pending' ? 'selected' : ''}>Chưa chốt</option>
              <option value="tech_fix" ${item.handling_type === 'tech_fix' ? 'selected' : ''}>KTV đã khắc phục</option>
              <option value="exchange" ${item.handling_type === 'exchange' ? 'selected' : ''}>Đổi thiết bị</option>
              <option value="supplier_return" ${item.handling_type === 'supplier_return' ? 'selected' : ''}>Đổi trả NCC</option>
            </select>
          </div>
          <div class="field" style="margin:0">
            <label>Sản phẩm</label>
            <select class="select w-product">${productOpts}</select>
          </div>
          <div class="field" style="margin:0">
            <label>Số lượng</label>
            <input type="text" inputmode="numeric" class="input w-qty" value="${fmtNum(item.qty || 1)}">
          </div>
          <div class="field" style="margin:0">
            <label>NCC riêng</label>
            <select class="select w-supplier">${supplierOpts}</select>
          </div>
          <div class="field" style="margin:0">
            <label>Chi phí thêm</label>
            <input type="text" inputmode="numeric" class="input w-cost" value="${fmtNum(item.additional_cost || 0)}" placeholder="0">
          </div>
          <div></div>
          <div class="field" style="margin:0">
            <label>Tên thiết bị</label>
            <input type="text" class="input w-device-name" value="${esc(item.device_name || '')}" placeholder="Ví dụ: Bộ định vị xe tải">
          </div>
          <div class="field" style="margin:0">
            <label>IMEI / Serial</label>
            <input type="text" class="input w-imei" value="${esc(item.imei || '')}" placeholder="IMEI hoặc serial">
          </div>
          <div class="field" style="margin:0">
            <label>Biển số</label>
            <input type="text" class="input w-plate" value="${esc(item.license_plate || '')}" placeholder="Biển số xe">
          </div>
          <div class="field" style="margin:0">
            <label>Tài khoản</label>
            <input type="text" class="input w-account" value="${esc(item.account_name || '')}" placeholder="Tên tài khoản">
          </div>
          <div class="field" style="margin:0">
            <label>SIM</label>
            <input type="text" class="input w-sim" value="${esc(item.sim_number || '')}" placeholder="Số SIM">
          </div>
          <div class="field" style="margin:0">
            <label>Tình trạng</label>
            <input type="text" class="input w-condition" value="${esc(item.condition_note || '')}" placeholder="Mô tả lỗi / tình trạng">
          </div>
          <div class="field" style="margin:0;grid-column:1 / -1">
            <label>Ghi chú item</label>
            <textarea class="input w-note" rows="2" placeholder="Ghi chú riêng cho item này">${esc(item.note_text || '')}</textarea>
          </div>
        </div>
      </div>
    `).join('');

    $box.querySelectorAll('.line-card').forEach((card) => {
      const idx = Number(card.dataset.widx);
      const item = state.warranty.items[idx];
      const bindInput = (selector, key, parser) => {
        const el = card.querySelector(selector);
        if (!el) return;
        if (selector === '.w-product') el.value = String(item.product_id || 0);
        if (selector === '.w-supplier') el.value = String(item.supplier_id || 0);
        el.addEventListener('input', () => { item[key] = parser ? parser(el.value) : el.value; });
        el.addEventListener('change', () => { item[key] = parser ? parser(el.value) : el.value; });
      };
      bindInput('.w-handling', 'handling_type');
      bindInput('.w-product', 'product_id', (v) => Number(v) || 0);
      bindInput('.w-qty', 'qty', (v) => Math.max(1, parseNum(v) || 1));
      bindInput('.w-supplier', 'supplier_id', (v) => Number(v) || 0);
      bindInput('.w-cost', 'additional_cost', (v) => Math.max(0, parseNum(v) || 0));
      bindInput('.w-device-name', 'device_name');
      bindInput('.w-imei', 'imei');
      bindInput('.w-plate', 'license_plate');
      bindInput('.w-account', 'account_name');
      bindInput('.w-sim', 'sim_number');
      bindInput('.w-condition', 'condition_note');
      bindInput('.w-note', 'note_text');

      const qtyEl = card.querySelector('.w-qty');
      if (qtyEl) qtyEl.addEventListener('blur', () => { qtyEl.value = fmtNum(item.qty || 1); });
      const costEl = card.querySelector('.w-cost');
      if (costEl) costEl.addEventListener('blur', () => { costEl.value = fmtNum(item.additional_cost || 0); });
      const delBtn = card.querySelector('[data-act="del-warranty-item"]');
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          if (state.warranty.items.length <= 1) {
            ui.toast('Cần ít nhất 1 item bảo hành', 'warning');
            return;
          }
          state.warranty.items.splice(idx, 1);
          renderWarrantyItems();
        });
      }
    });
  }

  async function loadSuppliers() {
    if (!IS_WARRANTY) return;
    const res = await api.get('/admin/suppliers/all').catch(() => null);
    state.suppliers = (res && res.items) || [];
    renderModeExtra();
  }

  // ---- TEMPLATES ----------------------------------------------
  async function loadTemplates() {
    const res = await api.get('/admin/order-templates').catch(() => null);
    state.templates = (res && res.items) || [];
  }

  // Lay chi tiet template (kem fields). Cache.
  async function loadTemplateDetail(id) {
    if (state.templateById[id]) return state.templateById[id];
    const res = await api.get('/admin/order-templates/' + id).catch(() => null);
    if (!res) return null;
    state.templateById[id] = res;
    return res;
  }

  // ---- CUSTOMER PICKER ----------------------------------------
  function renderCustomer() {
    const $box = document.getElementById('custBox');
    if (state.customer) {
      const c = state.customer;
      const isDealer = c.type === 'dealer';
      $box.innerHTML = `
        <div class="cust-card">
          <div class="av">${initial(c.full_name)}</div>
          <div class="nm">
            <b>${esc(c.full_name)}
              <span class="badge ${isDealer ? 'dealer' : ''}">${isDealer ? 'Đại lý' : 'Khách lẻ'}</span>
            </b>
            <span>${esc(c.phone || '(không SĐT)')}${c.code ? ' · ' + esc(c.code) : ''}${c.address ? ' · ' + esc(c.address) : ''}</span>
          </div>
          <button type="button" class="x-btn" id="btnChangeCust">Đổi khách</button>
        </div>`;
      document.getElementById('btnChangeCust').addEventListener('click', () => {
        state.customer = null;
        document.getElementById('f_customer_id').value = '';
        state.custPanelOpen = true;
        renderCustomer();
        updateBill();
        setTimeout(() => {
          const s = document.getElementById('custSearch');
          if (s) s.focus();
        }, 50);
      });
    } else {
      $box.innerHTML = `
        <div class="cust-empty" id="custEmpty">
          <div class="ic">🔍</div>
          <div class="tx">
            <b>Chọn khách hàng</b>
            <span>(tên / SĐT)</span>
          </div>
        </div>
        ${state.custPanelOpen ? renderCustPanel() : ''}`;
      const empty = document.getElementById('custEmpty');
      if (empty) {
        empty.addEventListener('click', () => {
          state.custPanelOpen = true;
          renderCustomer();
          setTimeout(() => {
            const s = document.getElementById('custSearch');
            if (s) s.focus();
          }, 50);
        });
      }
      bindCustPanel();
      if (state.custPanelOpen && !state.custResults.length) doCustSearch();
      else if (state.custPanelOpen) renderCustList();
    }
  }

  function renderCustPanel() {
    const f = state.custFilter;
    return `
      <div class="cust-panel" id="custPanel">
        <div class="cust-panel-head">
          <input type="text" class="input" id="custSearch"
                 placeholder="🔍 Tên / SĐT / mã KH..." value="${esc(f.q)}" autocomplete="off">
          <input type="text" class="input" id="custFilterName"
                 placeholder="Lọc tên..." value="${esc(f.name)}">
          <input type="text" class="input" id="custFilterPhone"
                 placeholder="Lọc SĐT..." value="${esc(f.phone)}">
          <select class="select" id="custFilterType">
            <option value="">Tất cả loại</option>
            <option value="retail" ${f.type === 'retail' ? 'selected' : ''}>Khách lẻ</option>
            <option value="dealer" ${f.type === 'dealer' ? 'selected' : ''}>Đại lý</option>
          </select>
          <button type="button" class="btn ghost sm" id="btnQuickCreate">+ Tạo mới</button>
        </div>
        <div class="cust-list" id="custList">
          <div class="cust-empty-list">Đang tải...</div>
        </div>
        <div id="quickCreateBox" style="display:none"></div>
      </div>`;
  }

  let custTimer = null;
  function bindCustPanel() {
    const $search = document.getElementById('custSearch');
    if (!$search) return;
    const reload = () => { clearTimeout(custTimer); custTimer = setTimeout(doCustSearch, 250); };
    $search.addEventListener('input', (e) => { state.custFilter.q = e.target.value.trim(); reload(); });
    document.getElementById('custFilterName').addEventListener('input', (e) => { state.custFilter.name = e.target.value.trim(); reload(); });
    document.getElementById('custFilterPhone').addEventListener('input', (e) => { state.custFilter.phone = e.target.value.trim(); reload(); });
    document.getElementById('custFilterType').addEventListener('change', (e) => { state.custFilter.type = e.target.value; doCustSearch(); });
    document.getElementById('btnQuickCreate').addEventListener('click', () => toggleQuickCreate());
  }

  async function doCustSearch() {
    const f = state.custFilter;
    const params = new URLSearchParams();
    params.set('limit', '20');
    if (f.q)     params.set('q', f.q);
    if (f.name)  params.set('name', f.name);
    if (f.phone) params.set('phone', f.phone);
    if (f.type)  params.set('type', f.type);
    const res = await api.get('/admin/customers?' + params.toString()).catch(() => null);
    state.custResults = (res && res.items) || [];
    renderCustList();
  }

  function renderCustList() {
    const $list = document.getElementById('custList');
    if (!$list) return;
    if (!state.custResults.length) {
      $list.innerHTML = `<div class="cust-empty-list">
        Không tìm thấy khách. <a href="javascript:void(0)" id="lkQuick">Tạo khách mới?</a>
      </div>`;
      const lk = document.getElementById('lkQuick');
      if (lk) lk.addEventListener('click', () => toggleQuickCreate(true));
      return;
    }
    $list.innerHTML = state.custResults.map(c => {
      const isDealer = c.type === 'dealer';
      const phone = c.phone ? `<span class="ph">📞 ${esc(c.phone)}</span>` : '';
      const addr  = c.address ? `<span>📍 ${esc(c.address)}</span>` : '';
      const code  = c.code ? `<span class="code">${esc(c.code)}</span>` : '';
      return `
        <div class="cust-item" data-id="${c.id}">
          <div class="av">${esc(initial(c.full_name))}</div>
          <div class="nm">
            <div class="l1">${esc(c.full_name)} ${code}</div>
            <div class="l2">${phone}${addr}</div>
          </div>
          <span class="tag ${isDealer ? 'dealer' : ''}">${isDealer ? 'Đại lý' : 'Khách lẻ'}</span>
        </div>`;
    }).join('');
    $list.querySelectorAll('.cust-item').forEach(it => {
      it.addEventListener('click', () => {
        const c = state.custResults.find(x => x.id === Number(it.dataset.id));
        if (c) pickCustomer(c);
      });
    });
  }

  function toggleQuickCreate(forceOpen) {
    const $box = document.getElementById('quickCreateBox');
    if (!$box) return;
    const isOpen = $box.style.display === 'block';
    if (isOpen && forceOpen !== true) { $box.style.display = 'none'; $box.innerHTML = ''; return; }
    $box.style.display = 'block';
    const seed = state.custFilter.q || '';
    const isPhone = /^[\d\s+\-]+$/.test(seed.trim());
    $box.innerHTML = `
      <div class="quick-create">
        <div class="qc-grid">
          <div><label>Họ tên *</label>
            <input type="text" id="qc_name" class="input" value="${isPhone ? '' : esc(seed)}"></div>
          <div><label>SĐT</label>
            <input type="text" id="qc_phone" class="input" value="${isPhone ? esc(seed.trim()) : ''}"></div>
          <div><label>Loại</label>
            <select id="qc_type" class="select">
              <option value="retail">Khách lẻ</option>
              <option value="dealer">Đại lý</option>
            </select></div>
        </div>
        <div class="row-btn">
          <button type="button" class="btn ghost sm" id="qcCancel">Huỷ</button>
          <button type="button" class="btn sm" id="qcSave">Tạo khách</button>
        </div>
      </div>`;
    document.getElementById('qcCancel').addEventListener('click', () => toggleQuickCreate());
    document.getElementById('qcSave').addEventListener('click', quickCreateSubmit);
    setTimeout(() => document.getElementById('qc_name').focus(), 50);
  }

  async function quickCreateSubmit() {
    const name  = document.getElementById('qc_name').value.trim();
    const phone = document.getElementById('qc_phone').value.trim();
    const type  = document.getElementById('qc_type').value;
    if (!name) { ui.toast('Nhập họ tên khách', 'warning'); return; }
    const btn = document.getElementById('qcSave');
    btn.disabled = true; btn.textContent = 'Đang tạo…';
    const res = await api.post('/admin/customers', { full_name: name, phone: phone || null, type },
      { onError: 'toast' });
    btn.disabled = false; btn.textContent = 'Tạo khách';
    if (res && res.id) {
      ui.toast('Đã tạo khách ' + (res.code || res.full_name), 'success');
      pickCustomer(res);
    }
  }

  async function pickCustomer(c) {
    state.customer = c;
    state.custPanelOpen = false;
    document.getElementById('f_customer_id').value = c.id;
    if (c.address && !document.getElementById('f_address').value) {
      document.getElementById('f_address').value = c.address;
    }
    renderCustomer();
    // Reload bang gia theo khach + apply lai cho cac dong da co
    await loadProducts();
    state.lines.forEach(ln => {
      ln.items.forEach(it => {
        if (it.product_id) {
          const p = state.products.find(x => x.id === it.product_id);
          if (p) it.unit_price = Number(p.sale_price ?? p.price) || 0;
        }
      });
    });
    renderLines();
  }

  function newItem() {
    return {
      product_id: 0, qty: 1, unit_price: 0,
      _infoOpen: false,
      field_values: DEFAULT_ITEM_FIELDS.map(l => ({ label: l, value: '' })),
    };
  }

  // ---- LINES --------------------------------------------------
  async function addLine(templateId) {
    const tplId = templateId || null;
    const line = {
      lid: newLineId(),
      template_id: tplId || null,
      custom_name: tplId ? null : ((IS_WARRANTY && !state.lines.length) ? 'Bảo hành' : ''),
      items: [newItem()],
      charges: [],
    };
    state.lines.push(line);
    if (tplId) await loadTemplateDetail(tplId);
    renderLines();
  }

  function removeLine(lid) {
    if (state.lines.length <= 1) { ui.toast('Phải có ít nhất 1 dòng công việc', 'warning'); return; }
    if (!confirm('Xoá dòng công việc này?')) return;
    state.lines = state.lines.filter(l => l.lid !== lid);
    renderLines();
  }

  async function changeLineTemplate(lid, newTplId) {
    const ln = state.lines.find(l => l.lid === lid);
    if (!ln) return;
    ln.template_id = newTplId;
    ln.custom_name = null;
    if (newTplId) await loadTemplateDetail(newTplId);
    renderLines();
  }

  // Combobox: nhan ten do user go vao o ten dong.
  // - Trung ten template -> set template_id, fields hien ra.
  // - Khac het -> custom_name (line tu do, khong co fields).
  async function changeLineNameFreeform(lid, rawName) {
    const ln = state.lines.find(l => l.lid === lid);
    if (!ln) return;
    const name = String(rawName || '').trim();
    const norm = name.toLowerCase();
    const matched = state.templates.find(t => String(t.name).trim().toLowerCase() === norm);
    if (matched) {
      ln.template_id = matched.id;
      ln.custom_name = null;
      await loadTemplateDetail(matched.id);
    } else {
      ln.template_id = null;
      ln.custom_name = name || null;
    }
    renderLines();
  }

  function getLineProductOptions(ln) {
    const opts = [];
    for (const it of ln.items) {
      if (it.product_id) {
        const p = state.products.find(x => x.id === it.product_id);
        if (p) opts.push({ id: p.id, name: p.name });
      }
    }
    return opts;
  }

  function calcVatAmountByRef(ln, productId, pct) {
    const it = ln.items.find(x => x.product_id === productId);
    if (!it) return 0;
    return Math.round((Number(it.qty) || 0) * (Number(it.unit_price) || 0) * (Number(pct) || 0) / 100);
  }

  function lineSubtotal(ln) {
    const itemSub = ln.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_price) || 0), 0);
    const chSub = ln.charges.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    return itemSub + chSub;
  }

  function getCompanyStockLacks(lines) {
    const needMap = new Map();
    (lines || []).forEach((ln) => {
      (ln.items || []).forEach((it) => {
        const pid = Number(it.product_id) || 0;
        const qty = Number(it.qty) || 0;
        if (!pid || qty <= 0) return;
        needMap.set(pid, (needMap.get(pid) || 0) + qty);
      });
    });
    return Array.from(needMap.entries()).map(([productId, need]) => {
      const product = state.products.find((p) => Number(p.id) === Number(productId)) || {};
      const have = Number(product.stock_qty) || 0;
      return {
        product_id: Number(productId),
        product_name: product.name || ('SP#' + productId),
        need,
        have,
      };
    }).filter((row) => row.have < row.need);
  }

  function renderLines() {
    const $box = document.getElementById('linesBox');
    if (!state.lines.length) {
      $box.innerHTML = '<div class="hint" style="text-align:center;padding:14px">Bấm "+ Thêm dòng công việc" để bắt đầu.</div>';
      updateBill();
      return;
    }
    $box.innerHTML = state.lines.map((ln, idx) => renderLineCard(ln, idx + 1)).join('');
    bindLineCards();
    updateBill();
  }

  function renderItemInfoBox(it, ii, lid) {
    const fvs = it.field_values || [];
    const isOpen = it._infoOpen === true;
    const filled = fvs.filter(f => (f.value || '').trim());
    const summary = filled.length ? filled.map(f => `${f.label}: ${f.value}`).join(' · ') : 'Chưa nhập';
    return `
      <div class="item-info-box ${isOpen ? 'open' : ''}" data-lid="${lid}" data-ii="${ii}">
        <div class="info-toggle" data-act="toggle-info">
          <span class="chev">${isOpen ? '▼' : '▶'}</span>
          <span>Hộp thông tin</span>
          <span class="info-summary">${esc(summary)}</span>
        </div>
        <div class="info-body" style="${isOpen ? '' : 'display:none'}">
          ${fvs.map((f, fi) => `
            <div class="fv-row" data-fi="${fi}" style="display:flex;gap:6px;align-items:center;margin-bottom:4px">
              <input type="text" class="input fv-label" placeholder="Tên trường" value="${esc(f.label||'')}"
                     style="flex:1;font-size:12px" ${DEFAULT_ITEM_FIELDS.includes(f.label) ? 'readonly' : ''}>
              <input type="text" class="input fv-value" placeholder="Giá trị" value="${esc(f.value||'')}"
                     style="flex:2;font-size:12px">
              <button type="button" class="btn-x" data-act="del-fv" title="Xoá">×</button>
            </div>`).join('')}
          <div style="display:flex;gap:6px;margin-top:4px">
            <input type="text" class="input fv-new-label" placeholder="Tên trường mới" style="flex:1;font-size:12px">
            <input type="text" class="input fv-new-value" placeholder="Giá trị" style="flex:2;font-size:12px">
            <button type="button" class="add" data-act="add-fv" style="white-space:nowrap">+ Thêm</button>
          </div>
        </div>
      </div>`;
  }

  function renderLineCard(ln, seq) {
    const tpl = state.templateById[ln.template_id];
    const lineName = ln.custom_name || (tpl ? tpl.name : '');

    const itemsHtml = ln.items.length ? ln.items.map((it, ii) => {
      const lineTotal = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
      const pCur = state.products.find(p => p.id === it.product_id);
      const pName = pCur ? pCur.name : '';
      return `
        <div class="item-block" data-lid="${ln.lid}" data-ii="${ii}">
          <div class="ic-row items-grid">
            <div class="cell">
              <div class="prod-combo ${pName ? 'has-val' : ''}">
                <input type="text" class="ic-input product-pick"
                       placeholder="Tìm sản phẩm..." value="${esc(pName)}" autocomplete="off">
                <button type="button" class="clear" tabindex="-1" title="Xoá">×</button>
                <div class="prod-dd"></div>
              </div>
            </div>
            <div class="cell"><input type="text" inputmode="numeric" class="ic-input num qty" value="${fmtNum(it.qty || 1)}"></div>
            <div class="cell"><input type="text" inputmode="numeric" class="ic-input num price" value="${it.unit_price ? fmtNum(it.unit_price) : ''}" placeholder="Nhập giá..."></div>
            <div class="cell line-total">${fmtVnd(lineTotal)}</div>
            <div class="cell"><button type="button" class="btn-x" data-act="del-item">×</button></div>
          </div>
          ${renderItemInfoBox(it, ii, ln.lid)}
        </div>`;
    }).join('') : '<div class="ic-empty">Chưa có sản phẩm</div>';

    const chargesHtml = ln.charges.length ? ln.charges.map((c, ci) => {
      if (c.kind === 'vat') {
        const vatPct = c.vat_percent != null ? c.vat_percent : 10;
        const pOpts = getLineProductOptions(ln);
        const lblVal = c.label || '';
        return `
      <div class="ic-row charges-grid vat-row" data-lid="${ln.lid}" data-ci="${ci}">
        <div class="cell">
          <select class="ic-select kind">
            <option value="fee">Phí</option>
            <option value="shipping">Ship</option>
            <option value="discount">Giảm</option>
            <option value="vat" selected>VAT</option>
          </select>
        </div>
        <div class="cell" style="display:flex; gap:6px; align-items:center;">
          <div class="vat-lbl-combo" style="flex:1; position:relative;">
            <input type="text" class="ic-input lbl vat-lbl-inp" autocomplete="off"
                   placeholder="Mô tả / chọn sản phẩm..."
                   value="${esc(lblVal)}"
                   data-pid="${c.vat_product_id || ''}"
                   style="width:100%">
            <div class="vat-lbl-dd"></div>
          </div>
          <div style="position:relative; width:70px;" title="Nhập hoặc chọn % VAT">
            <input type="text" list="dl-vat-${ln.lid}-${ci}" inputmode="numeric" class="ic-input num vat-percent-custom" style="width:100%; padding-right:18px; text-align:right" value="${vatPct}">
            <datalist id="dl-vat-${ln.lid}-${ci}">
              <option value="8">8%</option>
              <option value="10">10%</option>
            </datalist>
            <span style="position:absolute; right:6px; top:50%; transform:translateY(-50%); color:#888; font-size:12px; pointer-events:none;">%</span>
          </div>
        </div>
        <div class="cell"><input type="text" inputmode="numeric" class="ic-input num amt" value="${fmtNum(c.amount)}" placeholder="0"></div>
        <div class="cell"><button type="button" class="btn-x" data-act="del-charge">×</button></div>
      </div>`;
      }
      return `
      <div class="ic-row charges-grid" data-lid="${ln.lid}" data-ci="${ci}">
        <div class="cell">
          <select class="ic-select kind">
            <option value="fee"      ${c.kind === 'fee'      ? 'selected' : ''}>Phí</option>
            <option value="shipping" ${c.kind === 'shipping' ? 'selected' : ''}>Ship</option>
            <option value="discount" ${c.kind === 'discount' ? 'selected' : ''}>Giảm</option>
            <option value="vat"      ${c.kind === 'vat'      ? 'selected' : ''}>VAT</option>
          </select>
        </div>
        <div class="cell"><input type="text" class="ic-input lbl" value="${esc(c.label)}" placeholder="Mô tả..."></div>
        <div class="cell"><input type="text" inputmode="numeric" class="ic-input num amt" value="${fmtNum(c.amount)}" placeholder="0"></div>
        <div class="cell"><button type="button" class="btn-x" data-act="del-charge">×</button></div>
      </div>
    `}).join('') : '<div class="ic-empty">Chưa có chi phí</div>';

    return `
      <div class="line-card" data-lid="${ln.lid}">
        <div class="line-head">
          <div class="seq">${seq}</div>
          <div class="tpl-combo">
            <input type="text" class="tpl-input" value="${esc(lineName)}"
                   placeholder="Loại nhiệm vụ..." autocomplete="off">
            <button type="button" class="tpl-caret" tabindex="-1">▾</button>
            <div class="tpl-pop" hidden></div>
          </div>
          <span class="sub-show">${fmtVnd(lineSubtotal(ln))}</span>
          <button type="button" class="x-btn" data-act="del-line">Xoá dòng</button>
        </div>
        <div class="line-body">
          <div class="line-section">
            <div class="sh">Sản phẩm</div>
            <div class="ic-table">
              <div class="ic-thead items-grid">
                <div class="cell">Sản phẩm</div>
                <div class="cell">SL</div>
                <div class="cell">Đơn giá</div>
                <div class="cell right">Thành tiền</div>
                <div class="cell"></div>
              </div>
              <div class="line-items">${itemsHtml}</div>
            </div>
            <button type="button" class="add-item-cta" data-act="add-item">＋ Thêm sản phẩm</button>
          </div>

          <div class="line-section">
            <div class="sh">Phụ phí / Giảm giá <button type="button" class="add" data-act="add-charge">+ Thêm phí</button></div>
            <div class="ic-table">
              <div class="ic-thead charges-grid">
                <div class="cell">Loại</div>
                <div class="cell">Mô tả</div>
                <div class="cell right">Số tiền</div>
                <div class="cell"></div>
              </div>
              <div class="line-charges">${chargesHtml}</div>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ---- PRODUCT COMBOBOX --------------------------------------
  function bindProductCombo(row, ln, ii) {
    const combo = row.querySelector('.prod-combo');
    if (!combo) return;
    const inp = combo.querySelector('.product-pick');
    const dd = combo.querySelector('.prod-dd');
    const clearBtn = combo.querySelector('.clear');
    let activeIdx = -1;
    let lastQuery = inp.value;

    function filterProducts(q) {
      const s = (q || '').trim().toLowerCase();
      if (!s) return state.products.slice(0, 50);
      return state.products.filter(p => {
        const name = (p.name || '').toLowerCase();
        const code = (p.code || '').toLowerCase();
        return name.includes(s) || code.includes(s);
      }).slice(0, 50);
    }

    function renderDd(items) {
      if (!items.length) {
        dd.innerHTML = '<div class="empty">Không tìm thấy sản phẩm</div>';
        return;
      }
      dd.innerHTML = items.map((p, i) => {
        const price = Number(p.price) || 0;
        const stock = Number(p.stock_qty) || 0;
        const img = p.thumbnail_url || p.image_url;
        const imgHtml = img
          ? `<img src="${esc(img)}" class="prod-dd-img" onerror="this.style.display='none'">`
          : `<span class="prod-dd-no-img">📦</span>`;
        const code = p.code ? `<span class="prod-dd-code"> · ${esc(p.code)}</span>` : '';
        // Đơn bảo hành: không kiểm tra tồn kho, không hiển thị giá
        const stockHtml = IS_WARRANTY
          ? ''
          : `<span class="${stock === 0 ? 'prod-dd-stock out' : 'prod-dd-stock'}">${stock === 0 ? 'Hết hàng' : `Tồn: ${stock}`}</span>`;
        const priceHtml = IS_WARRANTY ? '' : `<span class="px">${fmtVnd(price)}</span>`;
        return `<div class="opt ${i === activeIdx ? 'active' : ''}" data-pid="${p.id}">
          ${imgHtml}
          <div class="prod-dd-info">
            <div class="nm">${esc(p.name)}${code}</div>
            <div class="prod-dd-bottom">
              ${priceHtml}
              ${stockHtml}
            </div>
          </div>
        </div>`;
      }).join('');
      dd.querySelectorAll('.opt').forEach(opt => {
        opt.addEventListener('mousedown', (e) => {
          e.preventDefault();
          pickProd(Number(opt.dataset.pid));
        });
      });
    }

    function positionDd() {
      const r = inp.getBoundingClientRect();
      dd.style.left = r.left + 'px';
      dd.style.top = (r.bottom + 2) + 'px';
      dd.style.width = Math.max(r.width, 300) + 'px';
    }
    let scrollHandler = null;
    function openDd() {
      const items = filterProducts(inp.value);
      activeIdx = items.length ? 0 : -1;
      renderDd(items);
      positionDd();
      dd.classList.add('on');
      if (!scrollHandler) {
        scrollHandler = () => positionDd();
        window.addEventListener('scroll', scrollHandler, true);
        window.addEventListener('resize', scrollHandler);
      }
    }
    function closeDd() {
      dd.classList.remove('on');
      activeIdx = -1;
      if (scrollHandler) {
        window.removeEventListener('scroll', scrollHandler, true);
        window.removeEventListener('resize', scrollHandler);
        scrollHandler = null;
      }
    }

    function pickProd(pid) {
      const p = state.products.find(x => x.id === pid);
      ln.items[ii].product_id = pid;
      // Đơn bảo hành: không gán giá tự động (mục đích chỉ lấy đầu mục sản phẩm)
      if (p && !IS_WARRANTY) ln.items[ii].unit_price = Number(p.sale_price ?? p.price) || 0;
      inp.value = p ? p.name : '';
      lastQuery = inp.value;
      combo.classList.add('has-val');
      closeDd();
      renderLines();
    }

    inp.addEventListener('focus', openDd);
    inp.addEventListener('input', () => {
      lastQuery = inp.value;
      const items = filterProducts(inp.value);
      activeIdx = items.length ? 0 : -1;
      renderDd(items);
      if (!dd.classList.contains('on')) { positionDd(); dd.classList.add('on'); }
      // Nếu xoá hết text -> coi như bỏ chọn
      if (!inp.value.trim()) {
        ln.items[ii].product_id = 0;
        combo.classList.remove('has-val');
        updateBill();
      }
    });
    inp.addEventListener('blur', () => {
      // Nếu user gõ tay nhưng không khớp SP nào -> khôi phục tên SP đã chọn
      setTimeout(() => {
        const cur = state.products.find(p => p.id === ln.items[ii].product_id);
        inp.value = cur ? cur.name : '';
        combo.classList.toggle('has-val', !!cur);
        closeDd();
      }, 120);
    });
    inp.addEventListener('keydown', (e) => {
      const items = filterProducts(inp.value);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIdx = Math.min(items.length - 1, activeIdx + 1);
        renderDd(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIdx = Math.max(0, activeIdx - 1);
        renderDd(items);
      } else if (e.key === 'Enter') {
        if (activeIdx >= 0 && items[activeIdx]) {
          e.preventDefault();
          pickProd(items[activeIdx].id);
        }
      } else if (e.key === 'Escape') {
        closeDd();
        inp.blur();
      }
    });

    clearBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      ln.items[ii].product_id = 0;
      ln.items[ii].unit_price = 0;
      inp.value = '';
      combo.classList.remove('has-val');
      closeDd();
      renderLines();
    });
  }

  function bindLineCards() {
    document.querySelectorAll('.line-card').forEach(card => {
      const lid = card.dataset.lid;
      const ln = state.lines.find(l => l.lid === lid);
      if (!ln) return;

      // Ten dong: combobox custom (chon template hoac go ten tu do)
      const combo  = card.querySelector('.tpl-combo');
      const tplInp = combo.querySelector('.tpl-input');
      const caret  = combo.querySelector('.tpl-caret');
      const pop    = combo.querySelector('.tpl-pop');

      const renderPop = (q) => {
        const norm = (q || '').trim().toLowerCase();
        const items = state.templates.filter(t =>
          !norm || String(t.name).toLowerCase().includes(norm)
        );
        if (!items.length) {
          pop.innerHTML = '<div class="tpl-empty">— Không có loại trùng. Enter để dùng tên tự do —</div>';
        } else if (false) {
          const lacks = (e.data.details && e.data.details.lacks) || [];
          const detail = lacks.map((item) =>
            `${item.product_name}: cần ${fmt(item.need)}, tồn ${fmt(item.have)}`
          ).join('\n');
          ui.toast(detail ? ('Kho tổng không đủ hàng:\n' + detail) : 'Kho tổng không đủ hàng', 'warning');
          return;
        } else if (false) {
          const lacks = (e.data.details && e.data.details.lacks) || [];
          const detail = lacks.map((item) =>
            `${item.product_name}: cần ${fmt(item.need)}, tồn ${fmt(item.have)}`
          ).join('\n');
          ui.toast(detail ? ('Kho tổng không đủ hàng:\n' + detail) : 'Kho tổng không đủ hàng', 'warning');
          return;
        } else if (false) {
          const lacks = (e.data.details && e.data.details.lacks) || [];
          const detail = lacks.map((item) =>
            `${item.product_name}: cần ${fmt(item.need)}, tồn ${fmt(item.have)}`
          ).join('\n');
          ui.toast(detail ? ('Kho tổng không đủ hàng:\n' + detail) : 'Kho tổng không đủ hàng', 'warning');
          return;
        } else {
          pop.innerHTML = items.map(t =>
            `<div class="tpl-item" data-name="${esc(t.name)}">${esc(t.name)}</div>`
          ).join('');
        }
      };
      const showPop = () => { renderPop(tplInp.value); pop.hidden = false; };
      const hidePop = () => { pop.hidden = true; };

      tplInp.addEventListener('focus', showPop);
      caret.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (pop.hidden) { tplInp.focus(); showPop(); } else { hidePop(); }
      });
      tplInp.addEventListener('input', () => renderPop(tplInp.value));
      tplInp.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { hidePop(); tplInp.blur(); }
        else if (e.key === 'Enter') { e.preventDefault(); hidePop(); changeLineNameFreeform(lid, tplInp.value); }
      });
      pop.addEventListener('mousedown', (e) => {
        const it = e.target.closest('.tpl-item');
        if (!it) return;
        e.preventDefault();
        tplInp.value = it.dataset.name;
        hidePop();
        changeLineNameFreeform(lid, it.dataset.name);
      });
      tplInp.addEventListener('blur', () => {
        // delay de click trong pop kip xu ly
        setTimeout(() => {
          if (!combo.contains(document.activeElement)) {
            hidePop();
            const ln2 = state.lines.find(l => l.lid === lid);
            if (!ln2) return;
            const cur = ln2.custom_name || (state.templateById[ln2.template_id]?.name || '');
            if (tplInp.value !== cur) changeLineNameFreeform(lid, tplInp.value);
          }
        }, 120);
      });
      card.querySelector('[data-act=del-line]').addEventListener('click', () => removeLine(lid));
      card.querySelector('[data-act=add-item]').addEventListener('click', () => {
        ln.items.push(newItem());
        renderLines();
      });
      card.querySelector('[data-act=add-charge]').addEventListener('click', () => {
        ln.charges.push({ kind: 'fee', label: '', amount: 0, vat_percent: 10, vat_product_id: null });
        renderLines();
      });

      // item-block: hop thong tin + product combo
      card.querySelectorAll('.item-block').forEach(block => {
        const ii = Number(block.dataset.ii);
        const it = ln.items[ii];
        if (!it) return;

        // Toggle hop thong tin
        const infoToggle = block.querySelector('[data-act=toggle-info]');
        if (infoToggle) {
          infoToggle.addEventListener('click', () => {
            it._infoOpen = !it._infoOpen;
            const body = block.querySelector('.info-body');
            const chev = block.querySelector('.chev');
            if (body) body.style.display = it._infoOpen ? '' : 'none';
            if (chev) chev.textContent = it._infoOpen ? '▼' : '▶';
          });
        }

        // Field value rows (chi update state, khong re-render)
        block.querySelectorAll('.fv-row').forEach(row => {
          const fi = Number(row.dataset.fi);
          const fv = it.field_values && it.field_values[fi];
          if (!fv) return;
          row.querySelector('.fv-label').addEventListener('input', (e) => { fv.label = e.target.value; });
          row.querySelector('.fv-value').addEventListener('input', (e) => { fv.value = e.target.value; });
          row.querySelector('[data-act=del-fv]').addEventListener('click', () => {
            it.field_values.splice(fi, 1);
            renderLines();
          });
        });

        // Them field moi
        const addFvBtn = block.querySelector('[data-act=add-fv]');
        if (addFvBtn) {
          addFvBtn.addEventListener('click', () => {
            const lblEl = block.querySelector('.fv-new-label');
            const valEl = block.querySelector('.fv-new-value');
            const lbl = (lblEl?.value || '').trim();
            if (!lbl) { ui.toast('Nhập tên trường trước', 'warning'); return; }
            if (!it.field_values) it.field_values = [];
            it.field_values.push({ label: lbl, value: (valEl?.value || '').trim() });
            it._infoOpen = true;
            renderLines();
          });
        }

        // Product combo — dùng row items-grid bên trong block
        const itemRow = block.querySelector('.ic-row.items-grid');
        if (itemRow) bindProductCombo(itemRow, ln, ii);
        // qty / price
        const qtyEl = block.querySelector('.qty');
        qtyEl.addEventListener('input', (e) => {
          it.qty = Math.max(1, parseNum(e.target.value) || 1);
          updateLineTotals(card, ln);
        });
        qtyEl.addEventListener('blur', (e) => { e.target.value = fmtNum(it.qty); });
        qtyEl.addEventListener('focus', (e) => { e.target.value = String(it.qty); e.target.select(); });

        const priceEl = block.querySelector('.price');
        priceEl.addEventListener('input', (e) => {
          it.unit_price = Math.max(0, parseNum(e.target.value));
          updateLineTotals(card, ln);
        });
        priceEl.addEventListener('blur', (e) => { e.target.value = it.unit_price ? fmtNum(it.unit_price) : ''; });
        priceEl.addEventListener('focus', (e) => { e.target.value = it.unit_price ? String(it.unit_price) : ''; e.target.select(); });

        block.querySelector('[data-act=del-item]').addEventListener('click', () => {
          ln.items.splice(ii, 1);
          renderLines();
        });
      });

      // charges
      card.querySelectorAll('.line-charges .ic-row').forEach(row => {
        const ci = Number(row.dataset.ci);
        row.querySelector('.kind').addEventListener('change', (e) => {
          const newKind = e.target.value;
          ln.charges[ci].kind = newKind;
          if (newKind === 'vat') {
            if (ln.charges[ci].vat_percent == null) ln.charges[ci].vat_percent = 10;
            const pOpts = getLineProductOptions(ln);
            if (pOpts.length > 0 && !ln.charges[ci].vat_product_id) {
              ln.charges[ci].vat_product_id = pOpts[0].id;
              if (!ln.charges[ci].label) ln.charges[ci].label = `VAT cho sản phẩm ${pOpts[0].name}`;
            }
            if (ln.charges[ci].vat_product_id) {
               ln.charges[ci].amount = calcVatAmountByRef(ln, ln.charges[ci].vat_product_id, ln.charges[ci].vat_percent);
            }
          }
          renderLines();
        });

        if (ln.charges[ci].kind === 'vat') {
           // ---- VAT label combobox (gộp dropdown + input) ----
           const vatCombo = row.querySelector('.vat-lbl-combo');
           if (vatCombo) {
             const vatInp = vatCombo.querySelector('.vat-lbl-inp');
             const vatDd  = vatCombo.querySelector('.vat-lbl-dd');
             const pOpts  = getLineProductOptions(ln);
             let vatScrollH = null;

             function positionVatDd() {
               const r = vatInp.getBoundingClientRect();
               vatDd.style.left  = r.left + 'px';
               vatDd.style.top   = (r.bottom + 2) + 'px';
               vatDd.style.width = Math.max(r.width, 220) + 'px';
             }
             function openVatDd(items) {
               if (!items.length) { closeVatDd(); return; }
               vatDd.innerHTML = items.map(p =>
                 `<div class="vat-dd-opt" data-pid="${p.id}">VAT cho sản phẩm <b>${esc(p.name)}</b></div>`
               ).join('');
               vatDd.querySelectorAll('.vat-dd-opt').forEach(opt => {
                 opt.addEventListener('mousedown', e => {
                   e.preventDefault();
                   const pid = Number(opt.dataset.pid);
                   const p   = pOpts.find(x => x.id === pid);
                   if (p) {
                     ln.charges[ci].vat_product_id = pid;
                     ln.charges[ci].label = `VAT cho sản phẩm ${p.name}`;
                     vatInp.value = ln.charges[ci].label;
                     vatInp.dataset.pid = pid;
                     ln.charges[ci].amount = calcVatAmountByRef(ln, pid, ln.charges[ci].vat_percent);
                     const amtEl = row.querySelector('.amt');
                     if (amtEl) { amtEl.value = fmtNum(ln.charges[ci].amount); updateLineTotals(card, ln); }
                   }
                   closeVatDd();
                 });
               });
               positionVatDd();
               vatDd.classList.add('on');
               if (!vatScrollH) {
                 vatScrollH = () => positionVatDd();
                 window.addEventListener('scroll', vatScrollH, true);
                 window.addEventListener('resize', vatScrollH);
               }
             }
             function closeVatDd() {
               vatDd.classList.remove('on');
               if (vatScrollH) {
                 window.removeEventListener('scroll', vatScrollH, true);
                 window.removeEventListener('resize', vatScrollH);
                 vatScrollH = null;
               }
             }
             function filterVatOpts(q) {
               const s = (q || '').trim().toLowerCase();
               if (!s) return pOpts;
               return pOpts.filter(p => p.name.toLowerCase().includes(s) || `vat cho sản phẩm ${p.name}`.toLowerCase().includes(s));
             }
             vatInp.addEventListener('focus', () => openVatDd(filterVatOpts('')));
             vatInp.addEventListener('input', e => {
               ln.charges[ci].label = e.target.value;
               if (!e.target.value.trim()) {
                 ln.charges[ci].vat_product_id = null;
                 vatInp.dataset.pid = '';
               }
               openVatDd(filterVatOpts(e.target.value));
               updateBill();
             });
             vatInp.addEventListener('blur', () => setTimeout(() => closeVatDd(), 150));
           }

           const pctCustom = row.querySelector('.vat-percent-custom');
           if (pctCustom) pctCustom.addEventListener('input', (e) => {
              ln.charges[ci].vat_percent = parseNum(e.target.value);
              if (ln.charges[ci].vat_product_id) {
                 ln.charges[ci].amount = calcVatAmountByRef(ln, ln.charges[ci].vat_product_id, ln.charges[ci].vat_percent);
                 const amtEl = row.querySelector('.amt');
                 if (amtEl) { amtEl.value = fmtNum(ln.charges[ci].amount); updateLineTotals(card, ln); }
              }
           });
        } else {
        row.querySelector('.lbl').addEventListener('input', (e) => {
          ln.charges[ci].label = e.target.value; updateBill();
        });
        }
        const amtEl = row.querySelector('.amt');
        amtEl.addEventListener('input', (e) => {
          ln.charges[ci].amount = parseNum(e.target.value);
          updateLineTotals(card, ln);
        });
        amtEl.addEventListener('blur', (e) => { e.target.value = fmtNum(ln.charges[ci].amount); });
        amtEl.addEventListener('focus', (e) => { e.target.value = String(ln.charges[ci].amount); e.target.select(); });

        row.querySelector('[data-act=del-charge]').addEventListener('click', () => {
          ln.charges.splice(ci, 1); renderLines();
        });
      });
    });
  }

  function updateLineTotals(card, ln) {
    card.querySelectorAll('.item-block').forEach(block => {
      const ii = Number(block.dataset.ii);
      const it = ln.items[ii];
      if (!it) return;
      const lineTotal = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
      const cell = block.querySelector('.line-total');
      if (cell) cell.textContent = fmtVnd(lineTotal);
    });
    
    let vatChanged = false;
    ln.charges.forEach((c, ci) => {
       if (c.kind === 'vat' && c.vat_product_id) {
          const oldAmt = c.amount;
          c.amount = calcVatAmountByRef(ln, c.vat_product_id, c.vat_percent);
          if (c.amount !== oldAmt) vatChanged = true;
       }
    });
    if (vatChanged) {
       card.querySelectorAll('.line-charges .ic-row').forEach(row => {
          const ci = Number(row.dataset.ci);
          if (ln.charges[ci].kind === 'vat') {
             const amtEl = row.querySelector('.amt');
             if (amtEl) amtEl.value = fmtNum(ln.charges[ci].amount);
          }
       });
    }

    const subEl = card.querySelector('.sub-show');
    if (subEl) subEl.textContent = fmtVnd(lineSubtotal(ln));
    updateBill();
  }


  // ---- PRODUCTS / STAFF ---------------------------------------
  async function loadProducts() {
    const cid = state.customer ? state.customer.id : 0;
    const url = '/admin/products?limit=500' + (cid ? '&customer_id=' + cid : '');
    const res = await api.get(url).catch(() => null);
    state.products = (res && res.items) || [];
    if (IS_WARRANTY) renderWarrantyItems();
  }
  async function loadStaff() {
    const res = await api.get('/admin/staff?limit=500').catch(() => null);
    state.staffList = (res && res.items) || [];
    // Giu select an de submit code doc .value va selectedOptions[0].text
    const $sel = document.getElementById('f_staff');
    $sel.innerHTML = '<option value="">— Chưa gán —</option>' +
      state.staffList.map(s => `<option value="${s.id}">${esc(s.full_name)} (${esc(s.role)})</option>`).join('');

    renderKtvPicker();

    // Cap nhat dropdown cho staff commission inline
    const $scSel = document.getElementById('f_sc_staff');
    if ($scSel) {
      $scSel.innerHTML = '<option value="">— Chọn nhân viên —</option>' +
        state.staffList.map(s => `<option value="${s.id}">${esc(s.full_name)} (${esc(s.role)})</option>`).join('');
    }

    // Cap nhat dropdown cho staff commission neu dang co form mo
    renderStaffCommissions();
  }

  // ---- BILL ---------------------------------------------------
  const PAY_LABEL = { cash: '💵 Tiền mặt', transfer: '🏦 Chuyển khoản', debt: '📒 Ghi nợ' };
  const KIND_LABEL = { fee: 'Phí', shipping: 'Ship', discount: 'Giảm giá', vat: 'VAT' };

  function updateBill() {
    document.getElementById('billDate').textContent = todayVN();
    document.getElementById('billTpl').textContent = state.lines.map(ln => {
      const t = state.templates.find(x => x.id === ln.template_id);
      return ln.custom_name || (t ? t.name : '');
    }).filter(Boolean).join(' + ') || '—';

    // customer
    const $cust = document.getElementById('billCust');
    if (state.customer) {
      const c = state.customer;
      const isDealer = c.type === 'dealer';
      $cust.innerHTML = `
        <div class="nm">${esc(c.full_name)} ${c.code ? '<span style="font-size:11px;color:var(--muted)">· ' + esc(c.code) + '</span>' : ''}</div>
        <div class="ph">${esc(c.phone || '(không SĐT)')} · ${isDealer ? 'Đại lý' : 'Khách lẻ'}</div>
        ${c.address ? `<div class="ph">📍 ${esc(c.address)}</div>` : ''}`;
    } else {
      $cust.innerHTML = '<div class="bill-empty">Chưa chọn khách</div>';
    }

    // lines
    const $billLines = document.getElementById('billLines');
    if (!state.lines.length) {
      $billLines.innerHTML = '<div class="bill-empty">Chưa có dòng công việc</div>';
    } else {
      $billLines.innerHTML = state.lines.map((ln, idx) => {
        const t = state.templates.find(x => x.id === ln.template_id);
        const tName = ln.custom_name || (t ? t.name : '(?)');
        const itemRows = ln.items.filter(it => it.product_id).map(it => {
          const p = state.products.find(x => x.id === it.product_id);
          const name = p ? p.name : '(SP đã xoá)';
          const qty = Number(it.qty) || 0;
          const price = Number(it.unit_price) || 0;
          return `<div class="bill-line">
            <div class="nm">${esc(name)}<span class="qp">${qty} × ${fmtVnd(price)}</span></div>
            <div class="amt">${fmtVnd(qty * price)}</div>
          </div>`;
        }).join('');
        const chRows = ln.charges.filter(c => (c.label || '').trim() || c.amount).map(c => {
          const amt = Number(c.amount) || 0;
          const cls = amt < 0 ? 'amt neg' : 'amt';
          return `<div class="bill-line">
            <div class="nm">${esc(c.label || KIND_LABEL[c.kind] || 'Khác')}<span class="qp">${KIND_LABEL[c.kind] || c.kind}</span></div>
            <div class="${cls}">${fmtVnd(amt)}</div>
          </div>`;
        }).join('');
        const body = (itemRows + chRows) || '<div class="bill-empty">— chưa nhập SP / phí —</div>';
        return `<div class="bill-line-group">
          <div class="gh">${idx + 1}. ${esc(tName)} — ${fmtVnd(lineSubtotal(ln))}</div>
          ${body}
        </div>`;
      }).join('');
    }

    // totals
    const lineSum = state.lines.reduce((s, ln) => s + lineSubtotal(ln), 0);
    const grand = lineSum;
    document.getElementById('billLineSum').textContent  = fmtVnd(lineSum);
    const $tot = document.getElementById('billTotal');
    $tot.textContent = fmtVnd(Math.max(0, grand));
    if (grand < 0) {
      $tot.style.color = '#dc2626';
      $tot.title = 'Giảm giá vượt tổng — đơn sẽ chốt về 0đ';
    } else {
      $tot.style.color = '';
      $tot.title = '';
    }
    document.getElementById('billPay').textContent =
      PAY_LABEL[document.getElementById('f_pay').value] || '—';
  }

  // ---- PHOTOS -------------------------------------------------
  function renderPhotos() {
    const $box = document.getElementById('photosPreview');
    if (!state.photos.length) {
      $box.innerHTML = '<div style="color:#94a3b8; font-size:12px; font-style:italic">Chưa có ảnh nào</div>';
      return;
    }
    $box.innerHTML = state.photos.map((p, idx) => `
      <div style="position:relative; width:80px; height:80px; border:1px solid var(--border); border-radius:6px; overflow:hidden">
        <img src="${esc(p.url)}" style="width:100%; height:100%; object-fit:cover">
        <button type="button" data-idx="${idx}" class="btn-del-photo" style="position:absolute; top:2px; right:2px; background:rgba(220,38,38,0.8); color:#fff; border:none; border-radius:4px; width:20px; height:20px; cursor:pointer; font-size:12px; display:grid; place-items:center">×</button>
      </div>
    `).join('');
    $box.querySelectorAll('.btn-del-photo').forEach(btn => {
      btn.addEventListener('click', () => {
        state.photos.splice(Number(btn.dataset.idx), 1);
        renderPhotos();
      });
    });
  }

  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    for (const file of files) {
      ui.toast('Đang upload: ' + file.name, 'info');
      try {
        const url = await imgbb.upload(file);
        state.photos.push({ url, caption: '' });
      } catch (err) {
        ui.toast('Lỗi upload: ' + file.name, 'error');
      }
    }
    renderPhotos();
    e.target.value = ''; // reset
  }

  // ---- KTV PICKER ---------------------------------------------
  let _ktvDdBound = false;

  function renderKtvPicker() {
    const $trigger = document.getElementById('ktvTrigger');
    if (!$trigger) return;
    const staffId = Number(document.getElementById('f_staff').value) || 0;
    const s = staffId ? state.staffList.find(x => x.id === staffId) : null;
    if (!s) {
      $trigger.innerHTML = `<span class="ktv-placeholder">— Chưa gán kỹ thuật viên —</span><span class="ktv-caret">▾</span>`;
      return;
    }
    const avInner = s.avatar_url
      ? `<img src="${esc(s.avatar_url)}" onerror="this.style.display='none'">${esc(initial(s.full_name))}`
      : esc(initial(s.full_name));
    const isOnline = s.online_status === 'online';
    const roleLabel = s.role === 'kithuat' ? 'KTV' : s.role === 'admin' ? 'Admin' : (s.role || 'NV').toUpperCase();
    const active = Number(s.active_tasks) || 0;
    const badgeCls = active >= 3 ? 'busy' : active > 0 ? '' : 'free';
    const badgeTxt = active > 0 ? `${active} đơn đang làm` : 'Rảnh';
    $trigger.innerHTML = `
      <div class="ktv-av">${avInner}<span class="ktv-online-dot ${isOnline ? 'online' : ''}"></span></div>
      <div style="flex:1;min-width:0">
        <div class="ktv-sel-name">${esc(s.full_name)}</div>
        <div class="ktv-sel-meta">
          <span class="ktv-role-tag">${roleLabel}</span>
          <span class="ktv-orders-badge ${badgeCls}">${badgeTxt}</span>
        </div>
      </div>
      <button type="button" class="ktv-x-btn" id="ktvClearBtn">Đổi</button>
      <span class="ktv-caret">▾</span>`;
    document.getElementById('ktvClearBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('f_staff').value = '';
      renderKtvPicker();
    });
  }

  function renderKtvDdList(q) {
    const $list = document.getElementById('ktvDdList');
    if (!$list) return;
    const norm = (q || '').trim().toLowerCase();
    const items = state.staffList.filter(s =>
      s.role === 'kithuat' &&
      (!norm || s.full_name.toLowerCase().includes(norm) || (s.username || '').toLowerCase().includes(norm))
    );
    if (!items.length) {
      $list.innerHTML = '<div class="ktv-dd-none">Không tìm thấy</div>';
      return;
    }
    const curId = Number(document.getElementById('f_staff').value) || 0;
    $list.innerHTML = items.map(s => {
      const avInner = s.avatar_url
        ? `<img src="${esc(s.avatar_url)}" onerror="this.style.display='none'">${esc(initial(s.full_name))}`
        : esc(initial(s.full_name));
      const isOnline = s.online_status === 'online';
      const roleLabel = s.role === 'kithuat' ? 'KTV' : s.role === 'admin' ? 'Admin' : (s.role || 'NV').toUpperCase();
      const active = Number(s.active_tasks) || 0;
      const badgeCls = active >= 3 ? 'busy' : active > 0 ? '' : 'free';
      const badgeTxt = active > 0 ? `${active} đơn đang làm` : 'Rảnh';
      return `
        <div class="ktv-dd-item ${s.id === curId ? 'active' : ''}" data-sid="${s.id}">
          <div class="ktv-av" style="width:32px;height:32px;font-size:13px">
            ${avInner}
            <span class="ktv-online-dot ${isOnline ? 'online' : ''}"></span>
          </div>
          <div style="flex:1;min-width:0">
            <div class="ktv-dd-name">${esc(s.full_name)}</div>
            <div class="ktv-dd-sub">
              <span class="ktv-role-tag">${roleLabel}</span>
              <span class="ktv-orders-badge ${badgeCls}">${badgeTxt}</span>
            </div>
          </div>
        </div>`;
    }).join('');
    $list.querySelectorAll('.ktv-dd-item').forEach(item => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        document.getElementById('f_staff').value = Number(item.dataset.sid);
        closeKtvDd();
        renderKtvPicker();
      });
    });
  }

  function openKtvDd() {
    const $dd = document.getElementById('ktvDd');
    if (!$dd) return;
    $dd.hidden = false;
    renderKtvDdList('');
    const $s = document.getElementById('ktvSearch');
    if ($s) { $s.value = ''; setTimeout(() => $s.focus(), 30); }
  }

  function closeKtvDd() {
    const $dd = document.getElementById('ktvDd');
    if ($dd) $dd.hidden = true;
  }

  function bindKtvPicker() {
    if (_ktvDdBound) return;
    _ktvDdBound = true;
    const $trigger = document.getElementById('ktvTrigger');
    const $search  = document.getElementById('ktvSearch');
    if (!$trigger) return;
    $trigger.addEventListener('click', () => {
      const $dd = document.getElementById('ktvDd');
      if ($dd && !$dd.hidden) closeKtvDd(); else openKtvDd();
    });
    if ($search) {
      $search.addEventListener('input', (e) => renderKtvDdList(e.target.value));
    }
    document.addEventListener('click', (e) => {
      const picker = document.getElementById('ktvPicker');
      if (picker && !picker.contains(e.target)) closeKtvDd();
    }, true);
  }

  // ---- COMMISSIONS --------------------------------------------
  function renderStaffCommissions() {
    const $box = document.getElementById('staffCommBox');
    if (!$box) return;

    const scCountEl = document.getElementById('scCount');
    if (scCountEl) {
      const n = state.staffCommissions.length;
      scCountEl.textContent = n + ' người';
      scCountEl.hidden = n === 0;
    }

    if (!state.staffCommissions.length) {
      $box.innerHTML = '<div class="sc-empty">Chưa có hoa hồng nào — thêm nhân viên bên dưới</div>';
      return;
    }

    const itemsHtml = state.staffCommissions.map((sc, idx) => {
      const s = state.staffList.find(x => x.id === sc.staff_id);
      const sName = s ? s.full_name : ('ID: ' + sc.staff_id);
      const sRole = s ? (s.role || '') : '';
      const initial = sName.trim().split(/\s+/).slice(-1)[0][0].toUpperCase();
      const roleLabel = sRole === 'ktv' ? 'KTV' : sRole === 'admin' ? 'Admin' : (sRole ? sRole.toUpperCase() : 'NV');
      return `
        <div class="sc-card" data-idx="${idx}">
          <div class="sc-card-top">
            <div class="sc-avatar">${initial}</div>
            <div class="sc-info">
              <div class="sc-name">${esc(sName)}</div>
              <span class="sc-role-tag">${roleLabel}</span>
            </div>
            <input type="text" inputmode="numeric" class="sc-amt-inp" data-idx="${idx}" value="${fmtNum(sc.amount)}" placeholder="0">
            <button type="button" class="sc-del" data-act="del-sc" data-idx="${idx}" title="Xoá">×</button>
          </div>
          <input type="text" class="sc-note-inp" data-idx="${idx}" placeholder="Ghi chú riêng cho nhân viên này..." value="${esc(sc.note || '')}">
        </div>
      `;
    }).join('');

    $box.innerHTML = itemsHtml;

    $box.querySelectorAll('.sc-amt-inp').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = Number(inp.dataset.idx);
        state.staffCommissions[idx].amount = parseNum(e.target.value);
      });
      inp.addEventListener('blur', (e) => {
        const idx = Number(inp.dataset.idx);
        e.target.value = fmtNum(state.staffCommissions[idx].amount);
      });
      inp.addEventListener('focus', (e) => {
        const idx = Number(inp.dataset.idx);
        e.target.value = String(state.staffCommissions[idx].amount);
        e.target.select();
      });
    });
    $box.querySelectorAll('.sc-note-inp').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = Number(inp.dataset.idx);
        state.staffCommissions[idx].note = e.target.value;
      });
    });
    $box.querySelectorAll('[data-act=del-sc]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.staffCommissions.splice(Number(btn.dataset.idx), 1);
        renderStaffCommissions();
      });
    });
  }

  function addStaffCommissionRow() {
    try {
      const staffId = Number(document.getElementById('f_sc_staff').value);
      const amount  = Money.get(document.getElementById('f_sc_amt'));
      const note    = document.getElementById('f_sc_note').value.trim();

      if (!staffId) { ui.toast('Vui lòng chọn nhân viên', 'warning'); return; }
      if (amount <= 0) { ui.toast('Vui lòng nhập số tiền hoa hồng > 0', 'warning'); return; }

      state.staffCommissions.push({ staff_id: staffId, amount, note });
      renderStaffCommissions();

      document.getElementById('f_sc_staff').value = '';
      Money.set(document.getElementById('f_sc_amt'), 0);
      document.getElementById('f_sc_note').value = '';

      document.getElementById('staffCommBox').lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      ui.toast('Đã thêm hoa hồng nhân viên', 'success');
    } catch (err) {
      console.error('addStaffCommissionRow:', err);
      ui.toast('Lỗi: ' + (err.message || err), 'error');
    }
  }

  // ---- BOOT + SUBMIT ------------------------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    initPageMode();
    adminShell.init('orders');
    renderCustomer();
    renderModeExtra();
    bindKtvPicker();

    document.getElementById('btnAddLine').addEventListener('click', () => addLine());
    document.getElementById('f_pay').addEventListener('change', updateBill);

    // Photos
    document.getElementById('btnUploadPhoto').addEventListener('click', () => document.getElementById('filePhoto').click());
    document.getElementById('filePhoto').addEventListener('change', handlePhotoUpload);
    renderPhotos();

    // Commissions
    document.getElementById('btnAddStaffComm').addEventListener('click', addStaffCommissionRow);
    renderStaffCommissions();

    document.getElementById('frm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const customerId = Number(document.getElementById('f_customer_id').value);
      const hasWarrantyItems = IS_WARRANTY && state.warranty.items.some(item =>
        item.product_id || item.device_name || item.imei || item.license_plate || item.account_name || item.sim_number || item.condition_note || item.note_text
      );
      if (!state.lines.length && hasWarrantyItems) {
        const warrantyTemplate = state.templates.find((tpl) => looksLikeWarrantyText(tpl && tpl.name));
        state.lines.push({
          lid: newLineId(),
          template_id: warrantyTemplate ? warrantyTemplate.id : null,
          custom_name: warrantyTemplate ? null : 'Bảo hành',
          items: state.warranty.items
            .filter(item => item.product_id || item.device_name || item.imei || item.license_plate || item.account_name || item.sim_number || item.condition_note || item.note_text)
            .map(item => ({
              product_id: Number(item.product_id) || null,
              qty: Math.max(1, Number(item.qty) || 1),
              unit_price: 0,
              field_values: [
                { label: 'Biển số xe', value: item.license_plate || '' },
                { label: 'IMEI', value: item.imei || '' },
                { label: 'Tên tài khoản', value: item.account_name || '' },
                { label: 'Số SIM', value: item.sim_number || '' },
              ],
            })),
          charges: [],
        });
      }
      if (!customerId) { ui.toast('Hãy chọn khách hàng', 'warning'); return; }
      if (!state.lines.length) { ui.toast('Đơn phải có ít nhất 1 dòng công việc', 'warning'); return; }

      // Build lines payload
      const linesPayload = [];
      for (const ln of state.lines) {
        const items = ln.items.filter(it => it.product_id && it.qty > 0).map(it => ({
          product_id: it.product_id, qty: it.qty, unit_price: it.unit_price,
          field_values: (it.field_values || [])
            .filter(fv => (fv.label || '').trim() && (fv.value || '').trim())
            .map(fv => ({ label: fv.label.trim(), value: fv.value.trim() })),
        }));
        const charges = ln.charges.filter(c => (c.label || '').trim() || c.kind === 'vat').map(c => {
          const out = { kind: c.kind, label: (c.label || '').trim(), amount: c.amount };
          if (c.kind === 'vat') {
            out.vat_percent = c.vat_percent;
            out.vat_product_id = c.vat_product_id;
          }
          return out;
        });
        if (!items.length && !charges.length) {
          if (IS_WARRANTY) continue;
          ui.toast('Mỗi dòng công việc cần ít nhất 1 sản phẩm hoặc 1 chi phí', 'warning');
          return;
        }
        linesPayload.push({
          template_id: ln.template_id || null,
          custom_name: ln.custom_name || null,
          items, charges,
        });
      }

      const staffId = Number(document.getElementById('f_staff').value) || null;
      const wage    = Math.max(0, Money.get(document.getElementById('f_wage')));
      // Tính serviceKind để gửi lên server
      const createServiceKind = state.serviceKind || (state.lines.some(lineLooksWarranty) ? 'warranty' : '');
      // Kiểm tra kho chỉ với đơn KHÔNG phải bảo hành và KHÔNG có KTV
      // (server sẽ kiểm tra lại lần nữa, đây chỉ là cảnh báo sớm phía client)
      if (!staffId && createServiceKind !== 'warranty') {
        const stockLacks = getCompanyStockLacks(linesPayload);
        if (stockLacks.length) {
          const detail = stockLacks.map((item) =>
            `${item.product_name}: cần ${fmt(item.need)}, tồn ${fmt(item.have)}`
          ).join('\n');
          ui.toast('Kho tổng không đủ hàng:\n' + detail, 'warning');
          return;
        }
      }

      // Cảnh báo nếu chưa gán kĩ thuật viên hoặc chưa nhập tiền công
      if (!staffId || wage === 0) {
        const missing = [];
        if (!staffId) missing.push('chưa chọn kĩ thuật viên');
        if (wage === 0) missing.push('tiền công đang để 0đ');
        const ok = await ui.confirm({
          title: '⚠️ Thiếu thông tin',
          body: `<ul style="margin:8px 0 0 16px;padding:0">${missing.map(m => `<li>${m}</li>`).join('')}</ul><p style="margin:12px 0 0">Vẫn tiếp tục tạo đơn?</p>`,
          okText: 'Tạo đơn',
          cancelText: 'Quay lại điền',
          type: 'warning',
        });
        if (!ok) return;
      }

      const body = {
        customer_id: customerId,
        payment_method: document.getElementById('f_pay').value,
        address: (IS_WARRANTY
          ? ((document.getElementById('w_address') || {}).value || '')
          : document.getElementById('f_address').value).trim() || null,
        note:    (IS_WARRANTY
          ? ((document.getElementById('w_note') || {}).value || '')
          : document.getElementById('f_note').value).trim() || null,
        progress_note: IS_WARRANTY
          ? (((document.getElementById('w_progress') || {}).value || '').trim() || null)
          : null,
        assigned_staff_id: staffId,
        wage_amount: wage,
        lines: linesPayload,
        approve: document.getElementById('f_approve').checked,
      };
      if (createServiceKind) body.service_kind = createServiceKind;
      if (IS_WARRANTY) {
        const warrantyItems = state.warranty.items
          .map(item => ({
            item_role: item.item_role || 'faulty',
            handling_type: item.handling_type || 'pending',
            product_id: Number(item.product_id) || null,
            supplier_id: Number(item.supplier_id) || null,
            qty: Math.max(1, Number(item.qty) || 1),
            device_name: (item.device_name || '').trim() || null,
            imei: (item.imei || '').trim() || null,
            license_plate: (item.license_plate || '').trim() || null,
            account_name: (item.account_name || '').trim() || null,
            sim_number: (item.sim_number || '').trim() || null,
            condition_note: (item.condition_note || '').trim() || null,
            note_text: (item.note_text || '').trim() || null,
            additional_cost: Math.max(0, Number(item.additional_cost) || 0),
          }))
          .filter(item =>
            item.product_id || item.device_name || item.imei || item.license_plate || item.account_name || item.sim_number || item.condition_note || item.note_text
          );
        body.warranty = {
          warranty_mode: document.getElementById('w_mode').value,
          default_supplier_id: Number(document.getElementById('w_supplier').value) || null,
          note_text: document.getElementById('w_meta_note').value.trim() || null,
          items: warrantyItems,
        };
      }

      const btn = document.getElementById('btnSubmit');
      btn.disabled = true; btn.textContent = 'Đang tạo…';
      const staffName = staffId
        ? (document.getElementById('f_staff').selectedOptions[0] || {}).text || ''
        : '';
      try {
        await submitCreate(body, staffName);
      } finally {
        btn.disabled = false; btn.textContent = '✅ Tạo đơn';
      }
    });

    async function submitCreate(body, staffName) {
      ui.loading(true);
      try {
        const res = await api.post('/admin/orders', body, { silent: true });
        if (res && res.id) {
          const orderId = res.id;
          
          // ---- Follow-up actions ----
          // 1. Photos
          for (const p of state.photos) {
            try {
              await api.post(`/admin/orders/${orderId}/photos`, { url: p.url, caption: p.caption }, { silent: true });
            } catch (err) {
              console.error('Lỗi lưu ảnh', err);
              ui.toast('Lỗi lưu 1 số ảnh đính kèm', 'warning');
            }
          }

          // 2. Staff Commissions
          const _myRole = auth.user()?.role;
          for (const sc of state.staffCommissions) {
            if (sc.amount > 0) {
              try {
                if (_myRole === 'staff') {
                  await api.post(`/admin/orders/${orderId}/my-staff-commission-request`, { staff_id: sc.staff_id, amount: sc.amount, note: sc.note }, { silent: true });
                } else {
                  await api.post(`/admin/orders/${orderId}/staff-commissions`, { staff_id: sc.staff_id, amount: sc.amount, note: sc.note }, { silent: true });
                }
              } catch (err) {
                console.error('Lỗi lưu hoa hồng nhân viên', err);
                ui.toast('Lỗi gán hoa hồng 1 số nhân viên', 'warning');
              }
            }
          }

          ui.toast('Đã tạo đơn ' + res.code, 'success');
          const nextList = '/admin/orders.html#order-' + res.id;
          setTimeout(() => { location.href = nextList; }, 800);
        }
      } catch (e) {
        if (e.status === 409 && e.data && e.data.code === 'INSUFFICIENT_HOLDINGS') {
          const lacks = (e.data.details && e.data.details.lacks) || [];
          ui.loading(false);
          const yes = await ui.insufficientHoldingsDialog({ staffName, lacks });
          if (yes) {
            await submitCreate({ ...body, force: true }, staffName);
            return;
          }
        } else {
          ui.toast(e.message || 'Lỗi tạo đơn', 'error');
        }
      } finally {
        ui.loading(false);
      }
    }

    await loadTemplates();
    await loadProducts();
    await loadSuppliers();
    await loadStaff();
    // Tu dong them 1 line dau tien
    if (state.templates.length && !IS_WARRANTY) {
      await addLine();
    } else if (!state.templates.length) {
      const $box = document.getElementById('linesBox');
      $box.innerHTML = '<div class="hint" style="color:#dc2626;text-align:center;padding:14px">Chưa có loại công việc. Liên hệ kỹ thuật để chạy migration 053.</div>';
    }
    updateBill();
  });
})();
