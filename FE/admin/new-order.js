// /admin/new-order.html — tao don moi v3 (multi-line, mig 052).
//
// 1 don = N dong cong viec, moi dong:
//   - 1 template (loai cong viec) tu order_templates
//   - items + charges + custom field values rieng
// Status + KTV + thanh toan o cap don.

(function () {
  'use strict';

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

  const state = {
    templates: [],         // [{id, name, fields: [...]}]
    templateById: {},      // {id: tplFullDetail}
    customer: null,
    custResults: [],
    custFilter: { q: '', name: '', phone: '', type: '' },
    custPanelOpen: false,
    products: [],
    lines: [],             // [{lid, template_id, customFields:[{label,value}], items:[{product_id,qty,unit_price}], charges:[{kind,label,amount}]}]
    orderCharges: [],      // [{kind, label, amount}] — phi cap don (line_id NULL)
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }
  function fmt(n) { return new Intl.NumberFormat('vi-VN').format(Number(n) || 0); }
  function fmtVnd(n) { return fmt(n) + 'đ'; }
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
          if (p) it.unit_price = Number(p.price) || 0;
        }
      });
    });
    renderLines();
  }

  // ---- LINES --------------------------------------------------
  async function addLine(templateId) {
    const tplId = templateId || (state.templates[0] && state.templates[0].id);
    if (!tplId) { ui.toast('Chưa có loại đơn nào', 'warning'); return; }
    const line = {
      lid: newLineId(),
      template_id: tplId,
      customFields: [],
      items: [],
      charges: [],
    };
    state.lines.push(line);
    await loadTemplateDetail(tplId);
    seedFieldsFromTemplate(line);
    renderLines();
  }

  // Prefill customFields tu template fields (chi label, value rong).
  // Khong ghi de neu line da co customFields (truong hop user da chinh tay).
  function seedFieldsFromTemplate(ln) {
    if (ln.customFields && ln.customFields.length) return;
    const tpl = state.templateById[ln.template_id];
    const fs = (tpl && tpl.fields) || [];
    ln.customFields = fs.map(f => ({ label: f.label || '', value: '' }));
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
    ln.customFields = [];
    await loadTemplateDetail(newTplId);
    seedFieldsFromTemplate(ln);
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
      ln.customFields = [];
      await loadTemplateDetail(matched.id);
      seedFieldsFromTemplate(ln);
    } else {
      ln.template_id = null;
      ln.custom_name = name || null;
      ln.customFields = ln.customFields || [];
    }
    renderLines();
  }

  function lineSubtotal(ln) {
    const itemSub = ln.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_price) || 0), 0);
    const chSub = ln.charges.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    return itemSub + chSub;
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

  function renderLineCard(ln, seq) {
    const tpl = state.templateById[ln.template_id];
    const lineName = ln.custom_name || (tpl ? tpl.name : '');
    if (!ln.customFields) ln.customFields = [];

    // Tom tat fields da nhap (de hien khi collapse)
    const filled = ln.customFields.filter(f => (f.label || '').trim() && (f.value || '').trim());
    const summary = filled.length
      ? filled.map(f => `${f.label}: ${f.value}`).join(' · ')
      : 'Chưa nhập';
    const isOpen = ln._fieldsOpen === true;
    const fieldsHtml = `
      <div class="line-section">
        <div class="fields-toggle ${isOpen ? 'on' : ''}" data-act="toggle-fields">
          <span class="chev">▶</span>
          <span>Thông tin</span>
          <span class="summary">${esc(summary)}</span>
        </div>
        <div class="fields-body ${isOpen ? 'on' : ''}">
          ${ln.customFields.map((f, fi) => renderCustomField(ln, f, fi)).join('')}
          <div style="margin-top:6px"><button type="button" class="add" data-act="add-field">+ Thêm thông tin</button></div>
        </div>
      </div>`;

    const itemsHtml = ln.items.length ? ln.items.map((it, ii) => {
      const lineTotal = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
      const pCur = state.products.find(p => p.id === it.product_id);
      const pName = pCur ? pCur.name : '';
      return `
        <div class="ic-row items-grid" data-lid="${ln.lid}" data-ii="${ii}">
          <div class="cell">
            <div class="prod-combo ${pName ? 'has-val' : ''}">
              <input type="text" class="ic-input product-pick"
                     placeholder="Tìm sản phẩm..." value="${esc(pName)}" autocomplete="off">
              <button type="button" class="clear" tabindex="-1" title="Xoá">×</button>
              <div class="prod-dd"></div>
            </div>
          </div>
          <div class="cell"><input type="text" inputmode="numeric" class="ic-input num qty" value="${fmtNum(it.qty || 1)}"></div>
          <div class="cell"><input type="text" inputmode="numeric" class="ic-input num price" value="${fmtNum(it.unit_price || 0)}"></div>
          <div class="cell line-total">${fmtVnd(lineTotal)}</div>
          <div class="cell"><button type="button" class="btn-x" data-act="del-item">×</button></div>
        </div>`;
    }).join('') : '<div class="ic-empty">Chưa có sản phẩm</div>';

    const chargesHtml = ln.charges.length ? ln.charges.map((c, ci) => `
      <div class="ic-row charges-grid" data-lid="${ln.lid}" data-ci="${ci}">
        <div class="cell">
          <select class="ic-select kind">
            <option value="fee"      ${c.kind === 'fee'      ? 'selected' : ''}>Phí</option>
            <option value="shipping" ${c.kind === 'shipping' ? 'selected' : ''}>Ship</option>
            <option value="discount" ${c.kind === 'discount' ? 'selected' : ''}>Giảm</option>
          </select>
        </div>
        <div class="cell"><input type="text" class="ic-input lbl" value="${esc(c.label)}" placeholder="Mô tả..."></div>
        <div class="cell"><input type="text" inputmode="numeric" class="ic-input num amt" value="${fmtNum(c.amount)}" placeholder="0"></div>
        <div class="cell"><button type="button" class="btn-x" data-act="del-charge">×</button></div>
      </div>
    `).join('') : '<div class="ic-empty">Chưa có chi phí</div>';

    return `
      <div class="line-card" data-lid="${ln.lid}">
        <div class="line-head">
          <div class="seq">${seq}</div>
          <div class="tpl-combo">
            <input type="text" class="tpl-input" value="${esc(lineName)}"
                   placeholder="Loại / tên công việc..." autocomplete="off">
            <button type="button" class="tpl-caret" tabindex="-1">▾</button>
            <div class="tpl-pop" hidden></div>
          </div>
          <span class="sub-show">${fmtVnd(lineSubtotal(ln))}</span>
          <button type="button" class="x-btn" data-act="del-line">Xoá dòng</button>
        </div>
        <div class="line-body">
          ${fieldsHtml}

          <div class="line-section">
            <div class="sh">Sản phẩm <button type="button" class="add" data-act="add-item">+ Thêm SP</button></div>
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
          </div>

          <div class="line-section">
            <div class="sh">Chi phí của dòng <button type="button" class="add" data-act="add-charge">+ Thêm phí</button></div>
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

  function renderCustomField(ln, f, fi) {
    return `
      <div class="cf-row" data-fi="${fi}" style="display:flex;gap:6px;align-items:center;margin-bottom:4px">
        <input type="text" class="input cf-label" placeholder="Nhãn (vd: Biển số)" value="${esc(f.label || '')}" style="flex:1">
        <input type="text" class="input cf-value" placeholder="Giá trị" value="${esc(f.value || '')}" style="flex:2">
        <button type="button" class="btn-x" data-act="del-field" title="Xoá">×</button>
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
        const code = p.code ? `<span style="color:var(--muted);font-size:10.5px"> · ${esc(p.code)}</span>` : '';
        return `<div class="opt ${i === activeIdx ? 'active' : ''}" data-pid="${p.id}">
          <div class="nm">${esc(p.name)}${code}</div>
          <div class="px">${fmtVnd(price)}</div>
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
      dd.style.width = Math.max(r.width, 240) + 'px';
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
      if (p) ln.items[ii].unit_price = Number(p.price) || 0;
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
        ln.items.push({ product_id: 0, qty: 1, unit_price: 0 });
        renderLines();
      });
      card.querySelector('[data-act=add-charge]').addEventListener('click', () => {
        ln.charges.push({ kind: 'fee', label: '', amount: 0 });
        renderLines();
      });

      // Toggle "Thong tin"
      const toggle = card.querySelector('[data-act=toggle-fields]');
      if (toggle) {
        toggle.addEventListener('click', () => {
          ln._fieldsOpen = !ln._fieldsOpen;
          renderLines();
        });
      }

      // custom field rows: chi update state, khong re-render (giu focus)
      card.querySelectorAll('.cf-row').forEach(row => {
        const fi = Number(row.dataset.fi);
        row.querySelector('.cf-label').addEventListener('input', (e) => {
          if (ln.customFields[fi]) ln.customFields[fi].label = e.target.value;
        });
        row.querySelector('.cf-value').addEventListener('input', (e) => {
          if (ln.customFields[fi]) ln.customFields[fi].value = e.target.value;
        });
        row.querySelector('[data-act=del-field]').addEventListener('click', () => {
          ln.customFields.splice(fi, 1);
          renderLines();
        });
      });
      const addFieldBtn = card.querySelector('[data-act=add-field]');
      if (addFieldBtn) {
        addFieldBtn.addEventListener('click', () => {
          ln.customFields.push({ label: '', value: '' });
          ln._fieldsOpen = true;
          renderLines();
        });
      }

      // items
      card.querySelectorAll('.line-items .ic-row').forEach(row => {
        const ii = Number(row.dataset.ii);
        bindProductCombo(row, ln, ii);
        // qty: parse + format on blur (giu focus khong re-render)
        const qtyEl = row.querySelector('.qty');
        qtyEl.addEventListener('input', (e) => {
          ln.items[ii].qty = Math.max(1, parseNum(e.target.value) || 1);
          updateLineTotals(card, ln);
        });
        qtyEl.addEventListener('blur', (e) => { e.target.value = fmtNum(ln.items[ii].qty); });
        qtyEl.addEventListener('focus', (e) => { e.target.value = String(ln.items[ii].qty); e.target.select(); });

        const priceEl = row.querySelector('.price');
        priceEl.addEventListener('input', (e) => {
          ln.items[ii].unit_price = Math.max(0, parseNum(e.target.value));
          updateLineTotals(card, ln);
        });
        priceEl.addEventListener('blur', (e) => { e.target.value = fmtNum(ln.items[ii].unit_price); });
        priceEl.addEventListener('focus', (e) => { e.target.value = String(ln.items[ii].unit_price); e.target.select(); });

        row.querySelector('[data-act=del-item]').addEventListener('click', () => {
          ln.items.splice(ii, 1);
          renderLines();
        });
      });

      // charges
      card.querySelectorAll('.line-charges .ic-row').forEach(row => {
        const ci = Number(row.dataset.ci);
        row.querySelector('.kind').addEventListener('change', (e) => {
          ln.charges[ci].kind = e.target.value; renderLines();
        });
        row.querySelector('.lbl').addEventListener('input', (e) => {
          ln.charges[ci].label = e.target.value; updateBill();
        });
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

  // Cap nhat thanh tien tung row + sub-show + bill (giu focus, khong re-render line card)
  function updateLineTotals(card, ln) {
    card.querySelectorAll('.line-items .ic-row').forEach(row => {
      const ii = Number(row.dataset.ii);
      const it = ln.items[ii];
      if (!it) return;
      const lineTotal = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
      const cell = row.querySelector('.line-total');
      if (cell) cell.textContent = fmtVnd(lineTotal);
    });
    const subEl = card.querySelector('.sub-show');
    if (subEl) subEl.textContent = fmtVnd(lineSubtotal(ln));
    updateBill();
  }

  // ---- ORDER CHARGES (cap don) --------------------------------
  function renderOrderCharges() {
    const $box = document.getElementById('orderChargesBox');
    if (!state.orderCharges.length) {
      $box.innerHTML = '<div class="ic-empty">Chưa có chi phí khác.</div>';
      updateBill();
      return;
    }
    $box.innerHTML = state.orderCharges.map((c, idx) => `
      <div class="ic-row charges-grid" data-idx="${idx}">
        <div class="cell">
          <select class="ic-select kind">
            <option value="shipping" ${c.kind === 'shipping' ? 'selected' : ''}>Ship</option>
            <option value="discount" ${c.kind === 'discount' ? 'selected' : ''}>Giảm</option>
            <option value="fee"      ${c.kind === 'fee'      ? 'selected' : ''}>Phí</option>
          </select>
        </div>
        <div class="cell"><input type="text" class="ic-input lbl" value="${esc(c.label)}" placeholder="Mô tả..."></div>
        <div class="cell"><input type="text" inputmode="numeric" class="ic-input num amt" value="${fmtNum(c.amount)}" placeholder="0"></div>
        <div class="cell"><button type="button" class="btn-x" data-act="del-och">×</button></div>
      </div>
    `).join('');
    $box.querySelectorAll('.ic-row').forEach(row => {
      const idx = Number(row.dataset.idx);
      row.querySelector('.kind').addEventListener('change', (e) => { state.orderCharges[idx].kind = e.target.value; updateBill(); });
      row.querySelector('.lbl').addEventListener('input', (e) => { state.orderCharges[idx].label = e.target.value; updateBill(); });
      const amtEl = row.querySelector('.amt');
      amtEl.addEventListener('input', (e) => { state.orderCharges[idx].amount = parseNum(e.target.value); updateBill(); });
      amtEl.addEventListener('blur', (e) => { e.target.value = fmtNum(state.orderCharges[idx].amount); });
      amtEl.addEventListener('focus', (e) => { e.target.value = String(state.orderCharges[idx].amount); e.target.select(); });
      row.querySelector('[data-act=del-och]').addEventListener('click', () => {
        state.orderCharges.splice(idx, 1); renderOrderCharges();
      });
    });
    updateBill();
  }

  // ---- PRODUCTS / STAFF ---------------------------------------
  async function loadProducts() {
    const cid = state.customer ? state.customer.id : 0;
    const url = '/admin/products?limit=500' + (cid ? '&customer_id=' + cid : '');
    const res = await api.get(url).catch(() => null);
    state.products = (res && res.items) || [];
  }
  async function loadStaff() {
    const res = await api.get('/admin/staff?role=kithuat&limit=200').catch(() => null);
    const items = (res && res.items) || [];
    const $sel = document.getElementById('f_staff');
    $sel.innerHTML = '<option value="">— Chưa gán —</option>' +
      items.map(s => `<option value="${s.id}">${esc(s.full_name)}</option>`).join('');
  }

  // ---- BILL ---------------------------------------------------
  const PAY_LABEL = { cash: '💵 Tiền mặt', transfer: '🏦 Chuyển khoản', debt: '📒 Ghi nợ' };
  const KIND_LABEL = { fee: 'Phí', shipping: 'Ship', discount: 'Giảm giá' };

  function updateBill() {
    document.getElementById('billDate').textContent = todayVN();
    document.getElementById('billTpl').textContent = state.lines.map(ln => {
      const t = state.templates.find(x => x.id === ln.template_id);
      return t ? t.name : '';
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
        const tName = t ? t.name : '(?)';
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

    // order charges
    const validOC = state.orderCharges.filter(c => (c.label || '').trim() || c.amount);
    const $ocWrap = document.getElementById('billOrderChargesWrap');
    const $oc = document.getElementById('billOrderCharges');
    if (!validOC.length) {
      $ocWrap.style.display = 'none';
    } else {
      $ocWrap.style.display = '';
      $oc.innerHTML = validOC.map(c => {
        const amt = Number(c.amount) || 0;
        const cls = amt < 0 ? 'amt neg' : 'amt';
        return `<div class="bill-line">
          <div class="nm">${esc(c.label || KIND_LABEL[c.kind] || 'Khác')}<span class="qp">${KIND_LABEL[c.kind] || c.kind}</span></div>
          <div class="${cls}">${fmtVnd(amt)}</div>
        </div>`;
      }).join('');
    }

    // totals
    const lineSum = state.lines.reduce((s, ln) => s + lineSubtotal(ln), 0);
    const ocSum = state.orderCharges.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const grand = lineSum + ocSum;
    document.getElementById('billLineSum').textContent  = fmtVnd(lineSum);
    document.getElementById('billOrderChSum').textContent = fmtVnd(ocSum);
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

  // ---- BOOT + SUBMIT ------------------------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    adminShell.init('new-order');
    renderCustomer();

    document.getElementById('btnAddLine').addEventListener('click', () => addLine());
    document.getElementById('btnAddOrderCharge').addEventListener('click', () => {
      state.orderCharges.push({ kind: 'shipping', label: '', amount: 0 });
      renderOrderCharges();
    });
    document.getElementById('f_pay').addEventListener('change', updateBill);

    // Format tien cong KTV
    const wageEl = document.getElementById('f_wage');
    wageEl.addEventListener('blur',  (e) => { e.target.value = fmtNum(parseNum(e.target.value)); });
    wageEl.addEventListener('focus', (e) => { e.target.value = String(parseNum(e.target.value)); e.target.select(); });

    document.getElementById('frm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const customerId = Number(document.getElementById('f_customer_id').value);
      if (!customerId) { ui.toast('Hãy chọn khách hàng', 'warning'); return; }
      if (!state.lines.length) { ui.toast('Đơn phải có ít nhất 1 dòng công việc', 'warning'); return; }

      // Build lines payload
      const linesPayload = [];
      for (const ln of state.lines) {
        const fvs = [];
        for (const cf of (ln.customFields || [])) {
          const lbl = (cf.label || '').trim();
          const val = (cf.value || '').trim();
          if (lbl && val) fvs.push({ label: lbl, value: val });
        }
        const items = ln.items.filter(it => it.product_id && it.qty > 0).map(it => ({
          product_id: it.product_id, qty: it.qty, unit_price: it.unit_price,
        }));
        const charges = ln.charges.filter(c => (c.label || '').trim()).map(c => ({
          kind: c.kind, label: c.label.trim(), amount: c.amount,
        }));
        if (!items.length && !charges.length) {
          ui.toast('Mỗi dòng công việc cần ít nhất 1 sản phẩm hoặc 1 chi phí', 'warning');
          return;
        }
        linesPayload.push({
          template_id: ln.template_id || null,
          custom_name: ln.custom_name || null,
          items, charges, field_values: fvs,
        });
      }
      const orderChargesPayload = state.orderCharges.filter(c => (c.label || '').trim()).map(c => ({
        kind: c.kind, label: c.label.trim(), amount: c.amount,
      }));

      const staffId = Number(document.getElementById('f_staff').value) || null;
      const wage    = Math.max(0, parseNum(document.getElementById('f_wage').value));

      const body = {
        customer_id: customerId,
        payment_method: document.getElementById('f_pay').value,
        address: document.getElementById('f_address').value.trim() || null,
        note:    document.getElementById('f_note').value.trim() || null,
        assigned_staff_id: staffId,
        wage_amount: wage,
        lines: linesPayload,
        order_charges: orderChargesPayload,
        approve: document.getElementById('f_approve').checked,
      };

      const btn = document.getElementById('btnSubmit');
      btn.disabled = true; btn.textContent = 'Đang tạo…';
      const res = await api.post('/admin/orders', body, { onError: 'toast' });
      btn.disabled = false; btn.textContent = '✅ Tạo đơn';
      if (res && res.id) {
        ui.toast('Đã tạo đơn ' + res.code, 'success');
        setTimeout(() => { location.href = '/admin/orders.html#order-' + res.id; }, 600);
      }
    });

    await loadTemplates();
    await loadProducts();
    await loadStaff();
    // Tu dong them 1 line dau tien
    if (state.templates.length) {
      await addLine(state.templates[0].id);
    } else {
      const $box = document.getElementById('linesBox');
      $box.innerHTML = '<div class="hint" style="color:#dc2626;text-align:center;padding:14px">Chưa có loại công việc. Liên hệ kỹ thuật để chạy migration 053.</div>';
    }
    updateBill();
  });
})();
