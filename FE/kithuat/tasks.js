// /kithuat/tasks.html — KTV xem cong viec cua minh + thao tac (transition / upload anh / complete).

(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const fmtN = new Intl.NumberFormat('vi-VN');
  const fmt = (n) => fmtN.format(Number(n) || 0);

  function esc(s) {
    return String(s == null ? '' : s)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }
  function fmtDate(d) { return d ? new Date(d).toLocaleString('vi-VN') : '—'; }
  const DEFAULT_ITEM_FIELDS = ['Biển số xe', 'IMEI', 'Tên tài khoản', 'Số SIM'];

  let state = { bucket: 'active', items: [], detail: null, photosExpanded: false };

  const STATUS_LABELS = {
    pending: 'Đang chờ',
    confirmed: 'Lên đơn',
    in_progress: 'Đang xử lý',
    done: 'Đã xong',
    cancelled: 'Đã huỷ',
  };
  const WARRANTY_ROLE_LABELS = {
    faulty: 'Hàng lỗi',
    replacement: 'Hàng thay',
    supplier_return: 'Hàng NCC trả',
  };
  const WARRANTY_HANDLING_LABELS = {
    pending: 'Chưa chọn cách xử lý',
    tech_fix: 'KTV đã khắc phục',
    exchange: 'Đổi thiết bị',
    supplier_return: 'Đổi trả NCC',
  };
  const WARRANTY_CUSTOMER_LABELS = {
    pending: 'Khách chưa xong',
    completed: 'Đã trả bảo hành cho khách',
  };
  const WARRANTY_STATUS_LABELS = {
    intake: 'Chưa đưa vào xử lý',
    technician_holding: 'Đồ lỗi đang ở túi KTV',
    pending_company_receipt: 'KTV đã gửi về kho — chờ xác nhận',
    company_warranty_stock: 'Đồ lỗi đang ở kho bảo hành công ty',
    sent_to_supplier: 'Đồ lỗi đang gửi NCC',
    supplier_returned: 'Đã nhận đồ bảo hành từ NCC',
    delivered: 'Đã đóng item nội bộ',
    cancelled: 'Đã hủy',
  };
  const WARRANTY_LOCATION_LABELS = {
    customer: 'Khách đang giữ',
    technician: 'Kho KTV',
    company_warranty_stock: 'Kho bảo hành công ty',
    supplier: 'Nhà cung cấp',
    customer_returned: 'Khách đã nhận lại',
  };
  const WARRANTY_ACTION_LABELS = {
    mark_fixed: 'KTV đã khắc phục',
    receive_from_customer: 'Đưa sản phẩm vào túi KTV',
    handover_to_company: 'KTV gửi hàng lỗi về kho (chờ xác nhận)',
    move_to_company_stock: 'Xác nhận đã nhận hàng lỗi về kho',
    send_to_supplier: 'Gửi nhà cung cấp',
    receive_from_supplier: 'Nhận hàng từ nhà cung cấp',
    reserve_replacement_from_company: 'Cấp hàng từ kho công ty',
    reserve_replacement_from_technician: 'Đổi ngay từ túi KTV',
    deliver_to_customer: 'Trả bảo hành cho khách',
    cancel_item: 'Hủy item',
    note: 'Ghi chú',
  };
  function pillForStatus(o) {
    const label = STATUS_LABELS[o.status] || o.status;
    if (o.status === 'pending') return { cls: 'amber', label };
    if (o.status === 'cancelled') return { cls: 'gray', label };
    if (o.status === 'done') return { cls: 'green', label };
    if (o.status === 'in_progress') return { cls: 'blue', label };
    return { cls: 'purple', label };
  }
  function warrantyBadge(text, bg, fg) {
    return `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:${bg};color:${fg};font-size:11px;font-weight:700">${esc(text)}</span>`;
  }
  function warrantyStatusBadge(code) {
    const label = WARRANTY_STATUS_LABELS[code] || code || '—';
    const map = {
      intake: ['#fff7ed', '#c2410c'],
      technician_holding: ['#eff6ff', '#1d4ed8'],
      company_warranty_stock: ['#f5f3ff', '#6d28d9'],
      sent_to_supplier: ['#fef3c7', '#92400e'],
      supplier_returned: ['#ecfccb', '#3f6212'],
      delivered: ['#dcfce7', '#166534'],
      cancelled: ['#e5e7eb', '#374151'],
    };
    const style = map[code] || ['#f8fafc', '#334155'];
    return warrantyBadge(label, style[0], style[1]);
  }
  function warrantyMoveOptionsForItem(item) {
    const actionCodes = Array.isArray(item && item.available_actions) && item.available_actions.length
      ? item.available_actions
      : ['note'];
    return actionCodes.map((code) => ({ code, label: WARRANTY_ACTION_LABELS[code] || code }));
  }

  function buildEditableFieldValues(item) {
    const existingFvs = item.field_values || [];
    const usedIds = new Set();
    const defaultRows = DEFAULT_ITEM_FIELDS.map((lbl) => {
      const found = existingFvs.find((f) => f.label === lbl);
      if (found) usedIds.add(found.id);
      return found || { id: 0, label: lbl, value: '' };
    });
    const extraRows = existingFvs.filter((f) => !usedIds.has(f.id));
    return [...defaultRows, ...extraRows];
  }

  function renderFieldValueEditor(orderId, line, item, { compact = false, collapsed = false } = {}) {
    if (!line || !item) return '';
    const effectiveFvs = buildEditableFieldValues(item);
    const fvRows = effectiveFvs.map((f) =>
      `<div style="display:flex;gap:6px;padding:${compact ? '4px 0' : '3px 0'};font-size:13px;align-items:center">
        <label style="flex:0 0 ${compact ? '110px' : '130px'};font-size:12px;color:#475569;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
               title="${esc(f.label)}">${esc(f.label)}</label>
        <input class="fv-input" data-fv-id="${f.id || 0}" data-item-id="${item.id}" data-line-id="${line.id}" value="${esc(f.value || '')}"
          placeholder="Nhập giá trị…"
          style="flex:1;border:1px solid #cbd5e1;border-radius:8px;padding:6px 8px;font-size:13px;background:#fff;min-width:0">
        ${f.id ? `<button class="btn-del-fv" data-fv-id="${f.id}" data-order-id="${orderId}"
          style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:15px;padding:0 4px;line-height:1" title="Xoá">×</button>`
        : `<span style="width:24px;display:inline-block"></span>`}
      </div>`).join('');
    const bodyHtml = `
      <div class="fv-list" data-item-id="${item.id}" data-line-id="${line.id}">
        ${fvRows}
        <div style="display:flex;gap:6px;margin-top:6px;align-items:center;padding-top:6px;border-top:1px dashed #e2e8f0">
          <input class="fv-new-label" data-item-id="${item.id}" placeholder="Tên trường"
            style="flex:0 0 ${compact ? '110px' : '120px'};border:1px solid #94a3b8;border-radius:8px;padding:6px 8px;font-size:12px;min-width:0">
          <input class="fv-new-value" data-item-id="${item.id}" placeholder="Giá trị"
            style="flex:1;border:1px solid #94a3b8;border-radius:8px;padding:6px 8px;font-size:12px;min-width:0">
          <button class="btn ghost sm btn-add-fv" data-item-id="${item.id}" data-line-id="${line.id}" data-order-id="${orderId}"
            style="white-space:nowrap;font-size:11px">+ Thêm</button>
        </div>
        <div style="text-align:right;margin-top:6px">
          <button class="btn ghost sm btn-save-fv" data-item-id="${item.id}" data-line-id="${line.id}" style="font-size:11px">💾 Lưu</button>
        </div>
      </div>`;
    if (!collapsed) return bodyHtml;
    return `
      <details style="margin-top:10px;border:1px solid #dbe7f3;border-radius:10px;background:#f8fbff;padding:0 10px">
        <summary style="cursor:pointer;list-style:none;padding:10px 0;font-size:12.5px;font-weight:700;color:#1e40af">Thông số dòng công việc</summary>
        <div style="padding:0 0 10px">${bodyHtml}</div>
      </details>`;
  }

  function matchWarrantyItemsToLineItems(lines, warrantyItems) {
    const lineEntries = [];
    (lines || []).forEach((line, lineIdx) => {
      (line.items || []).forEach((item, itemIdx) => {
        lineEntries.push({ line, item, lineIdx, itemIdx, used: false });
      });
    });
    const matches = new Map();
    (warrantyItems || []).forEach((wItem, wIdx) => {
      let best = null;
      let bestScore = -1;
      lineEntries.forEach((entry) => {
        if (entry.used) return;
        let score = 0;
        if (Number(entry.item.product_id) && Number(entry.item.product_id) === Number(wItem.product_id)) score += 4;
        const fields = entry.item.field_values || [];
        const normalized = {
          imei: String(wItem.imei || '').trim(),
          plate: String(wItem.license_plate || '').trim(),
          account: String(wItem.account_name || '').trim(),
          sim: String(wItem.sim_number || '').trim(),
        };
        if (normalized.imei && fields.some((f) => f.label === 'IMEI' && String(f.value || '').trim() === normalized.imei)) score += 5;
        if (normalized.plate && fields.some((f) => f.label === 'Biển số xe' && String(f.value || '').trim() === normalized.plate)) score += 3;
        if (normalized.account && fields.some((f) => f.label === 'Tên tài khoản' && String(f.value || '').trim() === normalized.account)) score += 2;
        if (normalized.sim && fields.some((f) => f.label === 'Số SIM' && String(f.value || '').trim() === normalized.sim)) score += 2;
        if (score <= 0 && wIdx === entry.lineIdx + entry.itemIdx) score = 1;
        if (score > bestScore) {
          bestScore = score;
          best = entry;
        }
      });
      if (!best && lineEntries.length) {
        best = lineEntries.find((entry) => !entry.used) || null;
      }
      if (best) {
        best.used = true;
        matches.set(Number(wItem.id), best);
      }
    });
    return matches;
  }

  async function loadList() {
    const res = await api.get('/kithuat/orders?bucket=' + encodeURIComponent(state.bucket)).catch(() => null);
    if (!res) return;
    state.items = res.items || [];
    render();
  }

  function render() {
    const $box = $('tasksList');
    if (!state.items.length) {
      $box.innerHTML = '<p class="text-muted" style="text-align:center;padding:40px">Không có việc nào</p>';
      return;
    }
    $box.innerHTML = state.items.map(o => {
      const s = pillForStatus(o);
      const remain = Math.max(0, Number(o.total_amount) - Number(o.paid_amount));
      return `
        <div class="task-card" data-id="${o.id}">
          <div class="head">
            <div><b>${esc(o.code)}</b> · ${esc(o.template_names || o.template_name || '')}${o.service_kind === 'warranty' ? ` ${warrantyBadge('Bảo hành', '#dbeafe', '#1d4ed8')}` : ''}</div>
            <span class="pill ${s.cls}">${esc(s.label)}</span>
          </div>
          <div class="meta">${esc(o.customer_name || '')} ${o.customer_phone ? `· ${esc(o.customer_phone)}` : ''}</div>
          ${o.address ? `<div class="meta">${esc(o.address)}</div>` : ''}
          ${o.due_at ? `<div class="meta">🕐 Hẹn: ${fmtDate(o.due_at)}</div>` : ''}
          ${o.started_at ? `<div class="meta">▶ Bắt đầu: ${fmtDate(o.started_at)}</div>` : ''}
          ${o.completed_at ? `<div class="meta">✓ Hoàn thành: ${fmtDate(o.completed_at)}</div>` : ''}
          <div class="meta">Tổng: <b>${fmt(o.total_amount)}đ</b> ${remain > 0 ? `· Còn lại: <span style="color:#dc2626">${fmt(remain)}đ</span>` : '· Đã thu đủ'}</div>
        </div>
      `;
    }).join('');
    $box.querySelectorAll('.task-card').forEach(el => {
      el.addEventListener('click', () => openDetail(Number(el.dataset.id)));
    });
  }

  async function openDetail(id) {
    $('modal').classList.add('open');
    $('odBody').innerHTML = '<p class="text-muted">Đang tải…</p>';
    state.photosExpanded = false;
    const res = await api.get('/kithuat/orders/' + id).catch(() => null);
    if (!res) { $('odBody').innerHTML = '<p style="color:#dc2626">Không tải được</p>'; return; }
    state.detail = res;
    renderDetail();
  }

  function closeDetail() {
    $('modal').classList.remove('open');
    state.detail = null;
    state.photosExpanded = false;
  }

  function renderTimeline() {
    const o = state.detail;
    const FLOW = [
      { code: 'pending', label: 'Đang chờ' },
      { code: 'confirmed', label: 'Lên đơn' },
      { code: 'in_progress', label: 'Đang xử lý' },
      { code: 'done', label: 'Đã xong' },
    ];
    const curIdx = FLOW.findIndex(s => s.code === o.status);
    const cancelled = o.status === 'cancelled';

    const stepsHtml = FLOW.map((s, idx) => {
      let cls = '';
      if (cancelled) cls = '';
      else if (curIdx >= 0 && idx < curIdx) cls = 'done';
      else if (idx === curIdx) cls = 'current';
      return `<div class="timeline-step ${cls}">
        <span class="seq">${cls === 'done' ? '✓' : (idx + 1)}</span>
        <span style="flex:1">${esc(s.label)}</span>
      </div>`;
    }).join('');

    const isWarranty = o.service_kind === 'warranty';
    const warrantyItems = isWarranty && o.warranty ? (o.warranty.items || []) : [];
    const activeWarrantyItems = warrantyItems.filter(item => item.current_status !== 'cancelled');
    const warrantyReady = isWarranty
      && activeWarrantyItems.length > 0
      && activeWarrantyItems.every((item) =>
        item.current_status === 'delivered' ||
        item.current_location === 'customer_returned' ||
        item.customer_status === 'completed'
      );
    const targets = [];
    if (!isWarranty) {
      if (o.status === 'confirmed') targets.push({ code: 'in_progress', label: 'Bắt đầu làm' }, { code: 'done', label: 'Hoàn thành', terminal: true });
      else if (o.status === 'in_progress') targets.push({ code: 'done', label: 'Hoàn thành', terminal: true });
    }

    const warrantyTargets = [];
    if (isWarranty && o.status === 'confirmed') {
      warrantyTargets.push({ code: 'in_progress', label: 'Bắt đầu làm' });
    }

    const action = cancelled
      ? `<div style="margin-top:8px;color:#dc2626;text-align:center">Đơn đã huỷ</div>`
      : (o.status === 'done'
        ? `<div style="margin-top:8px;color:#16a34a;text-align:center">Đã hoàn thành</div>`
        : (isWarranty
          ? (warrantyTargets.length
            ? `<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;justify-content:center">
                 ${warrantyTargets.map(t => `<button class="btn sm btn-jump" data-step="${esc(t.code)}" data-terminal="0">${esc(t.label)}</button>`).join('')}
               </div>
               <div style="margin-top:8px;color:#475569;text-align:center">Sau khi bắt đầu làm, tiến độ bảo hành tiếp tục cập nhật tại mục kho bảo hành bên dưới</div>`
            : `<div style="margin-top:8px;color:#475569;text-align:center">Đơn bảo hành cập nhật tiến độ tại mục kho bảo hành bên dưới</div>`)
          : (targets.length
            ? `<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
                  ${targets.map(t => `<button class="btn sm btn-jump" data-step="${esc(t.code)}" data-terminal="${t.terminal ? 1 : 0}" style="${t.terminal ? 'background:#16a34a' : ''}">${esc(t.label)}</button>`).join('')}
                </div>` : '')));
    const warrantyCompleteAction = (!cancelled && o.status !== 'done' && warrantyReady)
      ? `<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;justify-content:center"><button class="btn sm" id="btnWarrantyComplete" style="background:#16a34a">Hoàn thành đơn bảo hành</button></div>`
      : '';
    return stepsHtml + action + warrantyCompleteAction;
  }

  function renderDetail() {
    const o = state.detail;
    const isWarranty = o.service_kind === 'warranty';
    const lines = o.lines || [];
    const tplNames = lines.map(l => l.template_name).filter(Boolean).join(' + ');
    if (isWarranty) {
      $('modalTitle').innerHTML = `
        <style>
          @keyframes warrantyHelpBlink {
            0%, 100% { background-color: #e0f2fe; box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
            50% { background-color: #0284c7; box-shadow: 0 0 0 6px rgba(14, 165, 233, 0); color: #fff; }
          }
          .warranty-help-blink {
            animation: warrantyHelpBlink 1.5s infinite ease-in-out;
            border: none;
            border-radius: 50%;
            width: 22px;
            height: 22px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 700;
            color: #0369a1;
            cursor: pointer;
            margin-left: 6px;
            vertical-align: middle;
            outline: none;
          }
        </style>
        ${esc(o.code)} <button type="button" id="btnHelpWarranty" class="warranty-help-blink" title="Hướng dẫn quy trình bảo hành">?</button> — <span style="font-weight:400;color:#64748b">${esc(tplNames || '')}</span>
      `;
    } else {
      $('modalTitle').textContent = `${o.code} — ${tplNames || ''}`;
    }
    const sCls = pillForStatus(o);
    const remain = Math.max(0, Number(o.total_amount) - Number(o.paid_amount));

    // Render moi line: items co field_values rieng
    const linesHtml = lines.length ? lines.map((ln, idx) => {
      const itemsHtml = (ln.items || []).length ? (ln.items || []).map(i => {
        return `<div class="item-fv-block" style="border:1px solid #e2e8f0;border-radius:7px;padding:8px 10px;margin-bottom:6px;background:#fff">
          <div style="font-size:13px;font-weight:600;margin-bottom:6px">
            📦 ${esc(i.product_name || ('SP #' + i.product_id))}
            <small style="color:#94a3b8;font-weight:400"> x${i.qty}</small>
          </div>
          ${renderFieldValueEditor(o.id, ln, i)}
        </div>`;
      }).join('') : '<p class="text-muted" style="font-size:12.5px">Không có sản phẩm</p>';
      return `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:8px;background:#fafbfd">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-weight:700;color:#1e3a8a">
          <span style="background:#3b82f6;color:#fff;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:11px">${idx + 1}</span>
          <span>${esc(ln.template_name || '(?)')}</span>
        </div>
        ${itemsHtml}
      </div>`;
    }).join('') : '<p class="text-muted">Đơn không có dòng công việc</p>';

    const photoCount = (o.step_photos || []).length;
    const photosHtml = !photoCount
      ? '<p class="text-muted">Chưa có ảnh</p>'
      : !state.photosExpanded
        ? `<div style="padding:10px 12px;border:1px dashed #cbd5e1;border-radius:10px;background:#f8fafc;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
             <div style="font-size:13px;color:#475569">Có <b>${fmt(photoCount)}</b> ảnh bước. Ảnh chưa tải để giảm dữ liệu.</div>
             <button class="btn ghost sm" id="btnLoadPhotos">Xem ảnh</button>
           </div>`
        : `<div class="photos">${o.step_photos.map(p =>
          `<a href="${esc(p.url)}" target="_blank" title="${esc(p.step_code)}"><img src="${esc(p.url)}" loading="lazy"></a>`
        ).join('')}</div>`;

    $('odBody').innerHTML = `
      <div class="od-section">
        <div><b>Khách:</b> ${esc(o.customer_name || '')} ${o.customer_phone ? `— <a href="tel:${esc(o.customer_phone)}">${esc(o.customer_phone)}</a>` : ''}</div>
        <div><b>Địa chỉ:</b> ${esc(o.address || '—')}</div>
        <div><b>Trạng thái:</b> <span class="pill ${sCls.cls}">${esc(sCls.label)}</span></div>
        ${o.due_at ? `<div><b>Hẹn làm:</b> ${fmtDate(o.due_at)}</div>` : ''}
        ${o.started_at ? `<div><b>Bắt đầu:</b> ${fmtDate(o.started_at)}</div>` : ''}
        ${o.completed_at ? `<div><b>Hoàn thành:</b> ${fmtDate(o.completed_at)}</div>` : ''}
        ${o.note ? `<div><b>Ghi chú đơn:</b> ${esc(o.note)}</div>` : ''}
        ${o.ktv_note ? `<div><b>Ghi chú KTV:</b> ${esc(o.ktv_note)}</div>` : ''}
        ${o.wage_amount ? `<div><b>Tiền công:</b> ${fmt(o.wage_amount)}đ</div>` : ''}
        ${o.customer_type === 'dealer' ? `
        <div style="margin-top:10px;padding:10px 12px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px">
          <div style="font-size:11.5px;font-weight:700;color:#0369a1;margin-bottom:4px">👤 Khách đầu cuối của đại lý</div>
          ${o.end_customer_id ? `
            <div style="font-size:13px">
              <b>${esc(o.end_customer_name || '')}</b>
              ${o.end_customer_phone ? ` — <a href="tel:${esc(o.end_customer_phone)}">${esc(o.end_customer_phone)}</a>` : ''}
              <span style="color:#94a3b8;font-size:11px"> (${esc(o.end_customer_code || '')})</span>
            </div>` : `
            <div style="font-size:12.5px;color:#64748b">Chưa gán — bấm "Cập nhật thông tin" để thêm.</div>`}
        </div>` : ''}
        <div style="margin-top:8px">
          <button class="btn ghost sm" id="btnAssetUpdate">📝 Cập nhật thông tin khách${o.customer_type === 'dealer' ? ' / đầu cuối' : ''}</button>
        </div>
      </div>

      <div class="od-section">
        <h4>Tiến trình</h4>
        ${renderTimeline()}
        <div style="margin-top:10px">
          <label style="font-size:13px;color:#334155;font-weight:600;display:block;margin-bottom:4px">Thực tế hiện tại <span style="font-weight:400;color:#94a3b8">(chỉ ghi thêm, không sửa/xoá)</span></label>
          <div id="progressNoteLog" style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;font-size:13px;color:#0f172a;max-height:200px;overflow:auto;${(o.progress_note||'').trim() ? '' : 'color:#94a3b8'}">${esc((o.progress_note||'').trim() || 'Chưa có ghi chú')}</div>
          <textarea id="progressNote" class="textarea" rows="2" placeholder="Nhập nội dung cần ghi thêm..." style="margin-top:8px"></textarea>
          <div style="margin-top:6px;text-align:right">
            <button class="btn ghost sm" id="btnSaveProgressNote">➕ Ghi thêm</button>
          </div>
        </div>
      </div>

      ${renderWarrantySectionV2()}

      ${isWarranty ? '' : `<div class="od-section">
        <h4>Dòng công việc</h4>
        ${linesHtml}
      </div>`}

      <div class="od-section">
        <h4>Ảnh các bước
          <button class="btn ghost sm" id="btnUploadPhoto" style="float:right">📷 Thêm ảnh</button>
        </h4>
        ${photosHtml}
      </div>

      <div class="od-section" style="background:#f8fafc;padding:12px;border-radius:10px">
        <div style="display:flex;justify-content:space-between"><span>Tổng đơn</span><b>${fmt(o.total_amount)}đ</b></div>
        <div style="display:flex;justify-content:space-between"><span>Đã thu</span><span>${fmt(o.paid_amount)}đ</span></div>
        ${remain > 0 ? `<div style="display:flex;justify-content:space-between;color:#dc2626;font-weight:600"><span>Còn lại</span><span>${fmt(remain)}đ</span></div>` : ''}
      </div>

    `;

    // Wire transitions
    document.querySelectorAll('.btn-jump').forEach(b => {
      b.addEventListener('click', () => {
        const target = b.dataset.step;
        const isTerminal = b.dataset.terminal === '1';
        if (isTerminal) openCompleteDialog(target);
        else doTransition(target);
      });
    });
    if ($('btnUploadPhoto')) $('btnUploadPhoto').addEventListener('click', uploadStepPhoto);
    if ($('btnLoadPhotos')) {
      $('btnLoadPhotos').addEventListener('click', () => {
        state.photosExpanded = true;
        renderDetail();
      });
    }
    if ($('btnSaveProgressNote')) {
      $('btnSaveProgressNote').addEventListener('click', async () => {
        const v = $('progressNote').value.trim();
        if (!v) { ui.toast('Nhập nội dung cần ghi thêm', 'warning'); return; }
        const r = await api.patch(`/kithuat/orders/${o.id}/progress-note`,
          { progress_note: v }, { onError: 'toast' });
        if (r) { ui.toast('Đã ghi thêm', 'success'); openDetail(o.id); }
      });
    }
    if ($('btnWarrantyEdit')) $('btnWarrantyEdit').addEventListener('click', openWarrantyEditorV2);
    if ($('btnHelpWarranty')) {
      $('btnHelpWarranty').addEventListener('click', () => {
        ui.confirm({
          title: 'Hướng dẫn quy trình xử lý Bảo hành (Kỹ thuật viên)',
          body: `
            <div style="font-family:system-ui, -apple-system, sans-serif; font-size:13.5px; line-height:1.6; color:#334155; max-height:420px; overflow-y:auto; padding-right:8px">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:14px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:10px 12px; color:#1e40af">
                <span style="font-size:20px">💡</span>
                <span><b>Hướng dẫn quy trình xử lý sản phẩm lỗi & thay thế trong Đơn bảo hành (Dành cho KTV)</b></span>
              </div>
              
              <div style="margin-bottom:14px">
                <h4 style="margin:0 0 6px 0; color:#1e293b; font-size:14px">📌 1. Các bước tiếp nhận và xử lý hàng lỗi</h4>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; font-size:12.5px; color:#475569">
                  • <b>Mới tiếp nhận (Intake):</b> Bạn kiểm tra và tiếp nhận sản phẩm bị lỗi từ khách hàng.<br>
                  • <b>Tự xử lý / Sửa xong tại chỗ:</b> Bạn trực tiếp sửa chữa thành công sản phẩm. Sau khi sửa xong, cập nhật trạng thái để trả thiết bị ngay cho khách hàng.<br>
                  • <b>Thu hồi sản phẩm lỗi:</b> Bạn không mang sẵn sản phẩm thay thế phù hợp, cần thu hồi sản phẩm lỗi về túi đồ của mình, hệ thống sẽ ghi nhận thiết bị nằm trong <b>Túi đồ KTV cá nhân</b> để chuẩn bị mang về kho tổng.
                </div>
              </div>

              <div style="margin-bottom:14px">
                <h4 style="margin:0 0 6px 0; color:#1e293b; font-size:14px">🔄 2. Cấp sản phẩm thay thế (Lắp sản phẩm bảo hành)</h4>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; font-size:12.5px; color:#475569">
                  • Bấm nút <b>🔧 Lắp sản phẩm bảo hành</b> của thiết bị tương ứng.<br>
                  • Chọn sản phẩm cần lắp thay thế từ danh sách gợi ý. Hệ thống hỗ trợ hiển thị hình ảnh và số lượng cụ thể.<br>
                  • <b>Quy tắc lấy hàng:</b> Nếu sản phẩm có sẵn trong <b>túi đồ KTV</b> của bạn, hệ thống sẽ tự động trừ hàng trong túi đồ. Nếu túi không đủ, hệ thống sẽ tự động đề xuất <b>xuất kho cửa hàng</b> (kho tổng công ty) và tạo một phiếu xuất kho tự động đi kèm.
                </div>
              </div>

              <div style="margin-bottom:14px">
                <h4 style="margin:0 0 6px 0; color:#1e293b; font-size:14px">📦 3. Gửi nhà cung cấp (NCC) & Giao khách</h4>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; font-size:12.5px; color:#475569">
                  • Nếu lỗi nghiêm trọng cần gửi đi bảo hành hãng, thiết bị sẽ được cập nhật chuyển trạng thái gửi sang NCC.<br>
                  • Sau khi NCC trả hàng, bạn có thể thực hiện hành động giao lại sản phẩm đã được NCC xử lý cho khách hàng để hoàn tất.
                </div>
              </div>

              <div>
                <h4 style="margin:0 0 6px 0; color:#1e293b; font-size:14px">💰 4. Hoàn thành đơn hàng bảo hành</h4>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; font-size:12.5px; color:#475569">
                  • Khi các sản phẩm bảo hành đã được xử lý xong (Sửa xong hoặc đổi thiết bị mới), bạn bấm hoàn thành đơn hàng. Đơn hàng bảo hành không có chi phí phát sinh (&le; 0đ) sẽ tự động được ghi nhận thanh toán đầy đủ.
                </div>
              </div>
            </div>
          `,
          okText: 'Đã hiểu',
          cancelText: 'Đóng'
        });
      });
    }
    if ($('btnWarrantyComplete')) {
      $('btnWarrantyComplete').addEventListener('click', () => openCompleteDialog('done'));
    }
    document.querySelectorAll('.btnWarrantyItemAction').forEach(btn => {
      btn.addEventListener('click', () => {
        openWarrantyActionModal(Number(btn.dataset.itemId), btn.dataset.action);
      });
    });
    document.querySelectorAll('.btnWarrantyDeliverNew').forEach(btn => {
      btn.addEventListener('click', () => {
        openWarrantyDeliverDeviceModal(Number(btn.dataset.itemId));
      });
    });
    document.querySelectorAll('.btn-save-fv').forEach(btn => {
      btn.addEventListener('click', async () => {
        const itemId = Number(btn.dataset.itemId);
        const lineId = Number(btn.dataset.lineId);
        const fvList = document.querySelector(`.fv-list[data-item-id="${itemId}"]`);
        const valueInputs = fvList ? fvList.querySelectorAll('.fv-input') : [];
        const updates = Array.from(valueInputs).map(inp => ({
          id: Number(inp.dataset.fvId) || 0,
          value: (inp.value || '').trim(),
          label: inp.previousElementSibling ? inp.previousElementSibling.textContent.trim() : '',
          item_id: itemId,
          line_id: lineId,
        }));
        if (!updates.length) { ui.toast('Không có thông số nào', 'error'); return; }
        btn.disabled = true;
        const r = await api.patch(`/kithuat/orders/${o.id}/field-values`, { updates }, { onError: 'toast' });
        btn.disabled = false;
        if (r) { ui.toast('Đã lưu thông số', 'success'); openDetail(o.id); }
      });
    });

    document.querySelectorAll('.btn-add-fv').forEach(btn => {
      btn.addEventListener('click', async () => {
        const itemId = Number(btn.dataset.itemId);
        const lineId = Number(btn.dataset.lineId);
        const orderId = Number(btn.dataset.orderId);
        const lblEl = document.querySelector(`.fv-new-label[data-item-id="${itemId}"]`);
        const valEl = document.querySelector(`.fv-new-value[data-item-id="${itemId}"]`);
        const label = (lblEl?.value || '').trim();
        if (!label) { ui.toast('Nhập tên trường trước', 'error'); lblEl?.focus(); return; }
        btn.disabled = true;
        const r = await api.post(`/kithuat/orders/${orderId}/field-values`,
          { item_id: itemId, line_id: lineId, label, value: valEl?.value || '' }, { onError: 'toast' });
        btn.disabled = false;
        if (r) { ui.toast('Đã thêm', 'success'); openDetail(orderId); }
      });
    });

    document.querySelectorAll('.btn-del-fv').forEach(btn => {
      btn.addEventListener('click', async () => {
        const fvId = Number(btn.dataset.fvId);
        const orderId = Number(btn.dataset.orderId);
        const yes = await ui.confirm({ title: 'Xoá thông số này?', okText: 'Xoá', danger: true });
        if (!yes) return;
        const r = await api.delete(`/kithuat/orders/${orderId}/field-values/${fvId}`, { onError: 'toast' });
        if (r) { ui.toast('Đã xoá', 'success'); openDetail(orderId); }
      });
    });
    if ($('btnAssetUpdate')) {
      $('btnAssetUpdate').addEventListener('click', () => {
        openAssetUpdateDialog(state.detail.customer_id, state.detail.id);
      });
    }
  }

  function renderWarrantySection() {
    const o = state.detail;
    if (!o || o.service_kind !== 'warranty' || !o.warranty) return '';
    const meta = o.warranty.meta || {};
    const items = o.warranty.items || [];
    const moves = o.warranty.moves || [];
    const itemHtml = items.length ? items.map(item => {
      const bits = [
        item.product_name || item.device_name || `Item #${item.id}`,
        item.imei ? `IMEI ${item.imei}` : '',
        item.license_plate ? `Biển số ${item.license_plate}` : '',
        item.account_name ? `TK ${item.account_name}` : '',
        item.sim_number ? `SIM ${item.sim_number}` : '',
      ].filter(Boolean);
      return `
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;background:#fff">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
            <b>${esc(item.product_name || item.device_name || `Item #${item.id}`)}</b>
            ${warrantyBadge(WARRANTY_ROLE_LABELS[item.item_role] || item.item_role, '#f8fafc', '#334155')}
            ${warrantyStatusBadge(item.current_status)}
            ${warrantyBadge(WARRANTY_LOCATION_LABELS[item.current_location] || item.current_location || '—', '#fef3c7', '#92400e')}
          </div>
          <div style="font-size:12.5px;color:#475569">${bits.map(esc).join(' · ') || 'Chưa có thông tin nhận diện'}</div>
          ${item.condition_note ? `<div style="font-size:12.5px;color:#334155;margin-top:6px"><b>Tình trạng:</b> ${esc(item.condition_note)}</div>` : ''}
          ${item.note_text ? `<div style="font-size:12.5px;color:#334155;margin-top:4px"><b>Ghi chú:</b> ${esc(item.note_text)}</div>` : ''}
          <div style="font-size:12px;color:#64748b;margin-top:6px">
            Số lượng: <b>${fmt(item.qty)}</b>
            ${item.supplier_name ? ` · NCC: <b>${esc(item.supplier_name)}</b>` : ''}
            ${item.holder_staff_name ? ` · Giữ bởi: <b>${esc(item.holder_staff_name)}</b>` : ''}
          </div>
        </div>`;
    }).join('') : '<p class="text-muted">Chưa có item bảo hành</p>';

    const moveHtml = moves.length ? moves.map(move => `
      <div style="padding:8px 0;border-bottom:1px dashed #e2e8f0;font-size:12.5px">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          ${warrantyBadge(WARRANTY_ACTION_LABELS[move.action_code] || move.action_code, '#eff6ff', '#1d4ed8')}
          <span style="color:#64748b">${fmtDate(move.occurred_at)}</span>
          ${move.receipt_code ? `<span style="color:#0f766e;font-weight:600">${esc(move.receipt_code)}</span>` : ''}
        </div>
        <div style="margin-top:4px;color:#334155">
          ${move.product_name ? `<b>${esc(move.product_name)}</b>` : 'Không gắn sản phẩm'}
          ${move.supplier_name ? ` · NCC: ${esc(move.supplier_name)}` : ''}
          ${move.holder_staff_name ? ` · KTV: ${esc(move.holder_staff_name)}` : ''}
        </div>
        ${(move.from_location || move.to_location) ? `<div style="margin-top:2px;color:#64748b">${esc(WARRANTY_LOCATION_LABELS[move.from_location] || move.from_location || '—')} → ${esc(WARRANTY_LOCATION_LABELS[move.to_location] || move.to_location || '—')}</div>` : ''}
        ${move.note_text ? `<div style="margin-top:2px;color:#334155">${esc(move.note_text)}</div>` : ''}
      </div>`).join('') : '<p class="text-muted">Chưa có lịch sử kho bảo hành</p>';

    return `
      <div class="od-section">
        <h4 style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span>Bảo hành</span>
          <button class="btn ghost sm" id="btnWarrantyEdit">Sửa bảo hành</button>
          <button class="btn ghost sm" id="btnWarrantyMove">Cập nhật kho</button>
        </h4>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:12px">
          <div style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#fafbfd">
            <div style="font-size:12px;color:#64748b">Loại xử lý</div>
            <div style="font-weight:700">${esc({
      repair: 'Sửa / xử lý nội bộ',
      exchange: 'Đổi thiết bị',
      supplier_swap: 'Đổi trả NCC',
    }[meta.warranty_mode] || meta.warranty_mode || 'repair')}</div>
          </div>
          <div style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#fafbfd">
            <div style="font-size:12px;color:#64748b">Giai đoạn</div>
            <div style="font-weight:700">${esc(meta.current_stage || 'intake')}</div>
          </div>
        </div>
        ${meta.note_text ? `<div style="margin-bottom:12px;padding:10px 12px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;font-size:12.5px;color:#334155">${esc(meta.note_text)}</div>` : ''}
        <div style="display:grid;gap:10px">${itemHtml}</div>
        <div style="margin-top:14px">
          <div style="font-size:13px;font-weight:700;color:#334155;margin-bottom:6px">Lịch sử kho bảo hành</div>
          <div>${moveHtml}</div>
        </div>
      </div>`;
  }

  async function openWarrantyEditor() {
    const o = state.detail;
    const warranty = o.warranty || { meta: {}, items: [] };
    const meta = warranty.meta || {};
    const items = (warranty.items || []).map(item => ({
      id: item.id,
      item_role: item.item_role || 'faulty',
      product_id: item.product_id || 0,
      supplier_id: item.supplier_id || 0,
      qty: Number(item.qty) || 1,
      device_name: item.device_name || '',
      imei: item.imei || '',
      license_plate: item.license_plate || '',
      account_name: item.account_name || '',
      sim_number: item.sim_number || '',
      condition_note: item.condition_note || '',
      note_text: item.note_text || '',
    }));
    if (!items.length) {
      items.push({ id: null, item_role: 'faulty', product_id: 0, supplier_id: 0, qty: 1, device_name: '', imei: '', license_plate: '', account_name: '', sim_number: '', condition_note: '', note_text: '' });
    }

    const lookups = await api.get('/kithuat/warranty/lookups', { onError: 'toast' }).catch(() => null);
    if (!lookups) return;
    const products = lookups.products || [];
    const suppliers = lookups.suppliers || [];
    const productOptions = ['<option value="0">— Chọn sản phẩm —</option>']
      .concat(products.map(p => `<option value="${p.id}">${esc(p.code || '')}${p.code ? ' · ' : ''}${esc(p.name || '')}</option>`))
      .join('');
    const supplierOptions = ['<option value="0">— Chưa chọn NCC —</option>']
      .concat(suppliers.map(s => `<option value="${s.id}">${esc(s.name)}</option>`))
      .join('');

    function renderRows() {
      return items.map((item, idx) => `
        <div class="w-edit-row" data-idx="${idx}" style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:10px">
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
            <div><label style="font-size:12px">Vai trò</label><select class="select w-role">
              <option value="faulty" ${item.item_role === 'faulty' ? 'selected' : ''}>Hàng lỗi</option>
              <option value="replacement" ${item.item_role === 'replacement' ? 'selected' : ''}>Hàng thay thế</option>
              <option value="supplier_return" ${item.item_role === 'supplier_return' ? 'selected' : ''}>Hàng NCC trả</option>
            </select></div>
            <div><label style="font-size:12px">Sản phẩm</label><select class="select w-product">${productOptions}</select></div>
            <div><label style="font-size:12px">Số lượng</label><input class="input w-qty" inputmode="numeric" value="${fmt(item.qty || 1)}"></div>
            <div><label style="font-size:12px">NCC riêng</label><select class="select w-supplier">${supplierOptions}</select></div>
            <div><label style="font-size:12px">Tên thiết bị</label><input class="input w-device" value="${esc(item.device_name || '')}"></div>
            <div><label style="font-size:12px">IMEI / Serial</label><input class="input w-imei" value="${esc(item.imei || '')}"></div>
            <div><label style="font-size:12px">Biển số</label><input class="input w-plate" value="${esc(item.license_plate || '')}"></div>
            <div><label style="font-size:12px">Tài khoản</label><input class="input w-account" value="${esc(item.account_name || '')}"></div>
            <div><label style="font-size:12px">SIM</label><input class="input w-sim" value="${esc(item.sim_number || '')}"></div>
            <div><label style="font-size:12px">Tình trạng</label><input class="input w-condition" value="${esc(item.condition_note || '')}"></div>
            <div style="grid-column:1 / -1"><label style="font-size:12px">Ghi chú item</label><textarea class="input w-note" rows="2">${esc(item.note_text || '')}</textarea></div>
          </div>
          <div style="text-align:right;margin-top:8px"><button type="button" class="btn ghost sm w-del">Xóa item</button></div>
        </div>`).join('');
    }

    const html = `
      <div style="padding:14px">
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:12px">
          <div><label style="font-size:12px">Loại xử lý</label><select id="weMode" class="select">
            <option value="repair" ${meta.warranty_mode === 'repair' ? 'selected' : ''}>Sửa / xử lý nội bộ</option>
            <option value="exchange" ${meta.warranty_mode === 'exchange' ? 'selected' : ''}>Đổi thiết bị</option>
            <option value="supplier_swap" ${meta.warranty_mode === 'supplier_swap' ? 'selected' : ''}>Đổi trả NCC</option>
          </select></div>
          <div><label style="font-size:12px">NCC mặc định</label><select id="weSupplier" class="select">${supplierOptions}</select></div>
          <div style="grid-column:1 / -1"><label style="font-size:12px">Địa chỉ</label><input id="weAddress" class="input" value="${esc(o.address || '')}"></div>
          <div style="grid-column:1 / -1"><label style="font-size:12px">Ghi chú đơn</label><textarea id="weOrderNote" class="input" rows="2">${esc(o.note || '')}</textarea></div>
          <div style="grid-column:1 / -1"><label style="font-size:12px">Ghi chú bảo hành</label><textarea id="weMetaNote" class="input" rows="2">${esc(meta.note_text || '')}</textarea></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <b>Item bảo hành</b>
          <button type="button" class="btn ghost sm" id="btnWeAdd">+ Thêm item</button>
        </div>
        <div id="weItems">${renderRows()}</div>
      </div>`;

    const okPromise = openSimpleModal('Sửa thông tin bảo hành', html, 'Lưu');
    const $supplier = document.getElementById('weSupplier');
    if ($supplier) $supplier.value = String(meta.default_supplier_id || 0);

    const bindRows = () => {
      document.querySelectorAll('#weItems .w-edit-row').forEach(row => {
        const idx = Number(row.dataset.idx);
        const item = items[idx];
        const qp = row.querySelector('.w-product'); if (qp) qp.value = String(item.product_id || 0);
        const sp = row.querySelector('.w-supplier'); if (sp) sp.value = String(item.supplier_id || 0);
        const bind = (selector, key, parser) => {
          const el = row.querySelector(selector);
          if (!el) return;
          const save = () => { item[key] = parser ? parser(el.value) : el.value; };
          el.addEventListener('input', save);
          el.addEventListener('change', save);
        };
        bind('.w-role', 'item_role');
        bind('.w-product', 'product_id', v => Number(v) || 0);
        bind('.w-qty', 'qty', v => Math.max(1, Number(String(v).replace(/[^\d]/g, '')) || 1));
        bind('.w-supplier', 'supplier_id', v => Number(v) || 0);
        bind('.w-device', 'device_name');
        bind('.w-imei', 'imei');
        bind('.w-plate', 'license_plate');
        bind('.w-account', 'account_name');
        bind('.w-sim', 'sim_number');
        bind('.w-condition', 'condition_note');
        bind('.w-note', 'note_text');
        const delBtn = row.querySelector('.w-del');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            if (items.length <= 1) {
              ui.toast('Cần ít nhất 1 item', 'warning');
              return;
            }
            items.splice(idx, 1);
            document.getElementById('weItems').innerHTML = renderRows();
            bindRows();
          });
        }
      });
    };
    bindRows();
    const addBtn = document.getElementById('btnWeAdd');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        items.push({ id: null, item_role: 'faulty', product_id: 0, supplier_id: 0, qty: 1, device_name: '', imei: '', license_plate: '', account_name: '', sim_number: '', condition_note: '', note_text: '' });
        document.getElementById('weItems').innerHTML = renderRows();
        bindRows();
      });
    }

    const ok = await okPromise;
    if (!ok) return;
    const payload = {
      address: document.getElementById('weAddress').value.trim() || null,
      note: document.getElementById('weOrderNote').value.trim() || null,
      meta: {
        warranty_mode: document.getElementById('weMode').value,
        default_supplier_id: Number(document.getElementById('weSupplier').value) || null,
        current_stage: meta.current_stage || 'intake',
        note_text: document.getElementById('weMetaNote').value.trim() || null,
      },
      items: items
        .map(item => ({
          id: item.id || null,
          item_role: item.item_role,
          product_id: Number(item.product_id) || null,
          supplier_id: Number(item.supplier_id) || null,
          qty: Math.max(1, Number(item.qty) || 1),
          device_name: item.device_name?.trim() || null,
          imei: item.imei?.trim() || null,
          license_plate: item.license_plate?.trim() || null,
          account_name: item.account_name?.trim() || null,
          sim_number: item.sim_number?.trim() || null,
          condition_note: item.condition_note?.trim() || null,
          note_text: item.note_text?.trim() || null,
        }))
        .filter(item => item.product_id || item.device_name || item.imei || item.license_plate || item.account_name || item.sim_number || item.condition_note || item.note_text),
    };
    closeSimpleModal();
    const r = await api.put(`/kithuat/orders/${o.id}/warranty`, payload, { onError: 'toast' });
    if (r) {
      ui.toast('Đã lưu bảo hành', 'success');
      openDetail(o.id);
      loadList();
    }
  }

  async function openWarrantyMoveModal() {
    const o = state.detail;
    const items = ((o.warranty && o.warranty.items) || []).filter(item => item.current_status !== 'cancelled');
    if (!items.length) {
      ui.toast('Chưa có item bảo hành để cập nhật kho', 'warning');
      return;
    }
    const lookups = await api.get('/kithuat/warranty/lookups', { onError: 'silent' }).catch(() => ({ suppliers: [] }));
    const suppliers = lookups && lookups.suppliers ? lookups.suppliers : [];
    const itemOptions = items.map(item => `<option value="${item.id}">${esc(item.product_name || item.device_name || ('Item #' + item.id))}</option>`).join('');
    const supplierOptions = ['<option value="0">— Không chọn —</option>']
      .concat(suppliers.map(s => `<option value="${s.id}">${esc(s.name)}</option>`))
      .join('');
    const actionOptions = (item) => warrantyMoveOptionsForItem(item)
      .map(action => `<option value="${action.code}">${esc(action.label)}</option>`)
      .join('');

    const html = `
      <div style="padding:14px">
        <div class="field"><label>Item bảo hành</label><select id="wmItem" class="select">${itemOptions}</select></div>
        <div class="field"><label>Thao tác</label>
          <select id="wmAction" class="select">${actionOptions(items[0])}</select>
        </div>
        <div class="field"><label>Nhà cung cấp</label><select id="wmSupplier" class="select">${supplierOptions}</select></div>
        <div class="field"><label>Thời điểm</label><input id="wmOccurredAt" type="datetime-local" class="input"></div>
        <div class="field"><label>Ghi chú</label><textarea id="wmNote" rows="3" class="input" placeholder="Ghi chú diễn biến, vị trí hàng, người giao nhận..."></textarea></div>
      </div>`;

    const okPromise = openSimpleModal('Cập nhật kho bảo hành', html, 'Lưu');
    const $wmItem = document.getElementById('wmItem');
    const $wmAction = document.getElementById('wmAction');
    const syncWarrantyActions = () => {
      const item = items.find(entry => Number(entry.id) === Number($wmItem.value)) || items[0];
      const prev = $wmAction.value;
      $wmAction.innerHTML = actionOptions(item);
      if ([...$wmAction.options].some(opt => opt.value === prev)) $wmAction.value = prev;
    };
    if ($wmItem && $wmAction) {
      $wmItem.addEventListener('change', syncWarrantyActions);
      syncWarrantyActions();
    }
    const ok = await okPromise;
    if (!ok) return;
    const payload = {
      warranty_item_id: Number(document.getElementById('wmItem').value) || 0,
      action_code: document.getElementById('wmAction').value,
      supplier_id: Number(document.getElementById('wmSupplier').value) || null,
      occurred_at: document.getElementById('wmOccurredAt').value || null,
      note_text: document.getElementById('wmNote').value.trim() || null,
    };
    closeSimpleModal();
    const r = await api.post(`/kithuat/orders/${o.id}/warranty/moves`, payload, { onError: 'toast' });
    if (r) {
      const receiptCode = r.receipt && r.receipt.code ? ` (${r.receipt.code})` : '';
      ui.toast('Đã cập nhật kho bảo hành' + receiptCode, 'success');
      openDetail(o.id);
      loadList();
    }
  }

  function renderWarrantySectionV2() {
    const o = state.detail;
    if (!o || o.service_kind !== 'warranty' || !o.warranty) return '';
    const meta = o.warranty.meta || {};
    const items = o.warranty.items || [];
    const moves = o.warranty.moves || [];
    const lineMatches = matchWarrantyItemsToLineItems(o.lines || [], items);

    // Vị trí hiện tại của đồ — nhãn + màu
    const LOC_LABEL = {
      customer: 'Khách đang giữ',
      technician: 'Túi KTV',
      company_warranty_stock: 'Kho bảo hành',
      supplier: 'Nhà cung cấp',
      customer_returned: 'Đã giao khách',
    };
    const LOC_COLOR = {
      customer: ['#f0fdf4', '#15803d'],
      technician: ['#eff6ff', '#1d4ed8'],
      company_warranty_stock: ['#faf5ff', '#7e22ce'],
      supplier: ['#fffbeb', '#92400e'],
      customer_returned: ['#dcfce7', '#166534'],
    };
    const HANDLING_LABEL = {
      tech_fix: '🔧 Sửa nội bộ',
      exchange: '🔄 Đổi thiết bị',
      supplier_return: '📦 Gửi NCC',
      pending: '❓ Chưa phân loại',
    };

    // Mini-stepper trực quan theo loại xử lý
    function renderMiniStepper(item) {
      const ht = item.handling_type || 'pending';
      const cs = item.current_status || 'intake';

      const FLOWS = {
        tech_fix: [{ label: 'Nhận từ KH' }, { label: 'KTV đang sửa' }, { label: 'Trả KH' }],
        exchange: [{ label: 'Nhận từ KH' }, { label: 'Lấy hàng đổi' }, { label: 'Giao KH' }],
        supplier_return: [{ label: 'Nhận từ KH' }, { label: 'Túi KTV' }, { label: 'Vào kho' }, { label: 'Gửi NCC' }, { label: 'Nhận lại' }, { label: 'Giao KH' }],
        pending: [{ label: 'Chờ phân loại' }, { label: 'Đang xử lý' }, { label: 'Hoàn thành' }],
      };
      const STATUS_STEP = {
        tech_fix: { intake: 0, technician_holding: 1, delivered: 2 },
        exchange: { intake: 0, technician_holding: 1, delivered: 2 },
        supplier_return: { intake: 0, technician_holding: 1, company_warranty_stock: 2, sent_to_supplier: 3, supplier_returned: 4, delivered: 5 },
        pending: { intake: 0, technician_holding: 1, delivered: 2 },
      };

      const flow = FLOWS[ht] || FLOWS.pending;
      const stepMap = STATUS_STEP[ht] || STATUS_STEP.pending;
      const curStep = stepMap[cs] !== undefined ? stepMap[cs] : 0;
      const allDone = cs === 'delivered';

      const stepsHtml = flow.map((step, idx) => {
        const state = allDone || idx < curStep ? 'done' : idx === curStep ? 'active' : 'upcoming';
        const dotStyle = {
          done: 'background:#16a34a;color:#fff;border-color:#16a34a',
          active: 'background:#2563eb;color:#fff;border-color:#2563eb;box-shadow:0 0 0 4px #dbeafe',
          upcoming: 'background:#f1f5f9;color:#94a3b8;border-color:#e2e8f0',
        }[state];
        const lblStyle = {
          done: 'color:#16a34a;font-weight:600',
          active: 'color:#1d4ed8;font-weight:700',
          upcoming: 'color:#94a3b8',
        }[state];
        const connector = idx < flow.length - 1
          ? `<div style="flex:1;height:2px;background:${idx < curStep || allDone ? '#16a34a' : '#e2e8f0'};margin:0 2px;align-self:flex-start;margin-top:14px;min-width:10px"></div>`
          : '';
        return `<div style="display:flex;flex-direction:column;align-items:center;flex:0 0 auto">
          <div style="width:28px;height:28px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;${dotStyle}">${state === 'done' ? '✓' : (idx + 1)}</div>
          <div style="font-size:10px;text-align:center;margin-top:4px;line-height:1.2;max-width:54px;${lblStyle}">${esc(step.label)}</div>
        </div>${connector}`;
      }).join('');

      return `<div style="display:flex;align-items:flex-start;padding:10px 0 6px;overflow-x:auto">${stepsHtml}</div>`;
    }

    const itemHtml = items.length ? items.map((item) => {
      const isDone = item.customer_status === 'completed' || item.current_status === 'delivered' || item.current_location === 'customer_returned';
      const isCancelled = item.current_status === 'cancelled';
      const next = getWarrantyPrimaryActionInfo(item);
      const locLabel = LOC_LABEL[item.current_location] || item.current_location || '—';
      const locColor = LOC_COLOR[item.current_location] || ['#f8fafc', '#334155'];

      const bits = [
        item.imei ? `IMEI: ${item.imei}` : '',
        item.license_plate ? `Biển số: ${item.license_plate}` : '',
        item.account_name ? `Tài khoản: ${item.account_name}` : '',
        item.sim_number ? `SIM: ${item.sim_number}` : '',
      ].filter(Boolean);

      const borderColor = isDone ? '#bbf7d0' : isCancelled ? '#e2e8f0' : '#bfdbfe';
      const bgColor = isDone ? '#f0fdf4' : isCancelled ? '#f8fafc' : '#fff';

      const DS_PILL = {
        pending:    ['#fef3c7', '#92400e', '⏳ Chờ xử lý'],
        processing: ['#dbeafe', '#1e40af', '🔧 Đang xử lý'],
        supplier:   ['#fef9c3', '#854d0e', '📦 Đang gửi NCC'],
        delivered:  ['#dcfce7', '#166534', '✓ Giao KH'],
      };
      const ds = item.display_state || { code: 'processing' };
      const dsPill = DS_PILL[ds.code] || DS_PILL.processing;
      const statusPill = isCancelled
        ? `<span style="padding:3px 10px;border-radius:999px;background:#f1f5f9;color:#475569;font-size:11px;font-weight:700;flex-shrink:0">Đã hủy</span>`
        : `<span style="padding:3px 10px;border-radius:999px;background:${dsPill[0]};color:${dsPill[1]};font-size:11px;font-weight:700;flex-shrink:0">${dsPill[2]}</span>`;

      // "Lap san pham bao hanh": hien khi san pham dang cho xu ly (pending)
      // HOAC da nhan ve tu NCC (supplier_returned) -> lap thang cho khach.
      const canDeliverNew = !isDone && !isCancelled
        && (ds.code === 'pending' || item.current_status === 'supplier_returned');

      const ctaHtml = !isDone && !isCancelled && next.actionable && !canDeliverNew
        ? `<button type="button" class="btnWarrantyItemAction" data-item-id="${item.id}" data-action="status"
              style="width:100%;padding:11px;border-radius:10px;border:none;background:#2563eb;color:#fff;
                     font-size:14px;font-weight:700;cursor:pointer;margin-top:12px;letter-spacing:.2px">
             ${esc(next.button)} →
           </button>`
        : !isDone && !isCancelled && !canDeliverNew && !next.actionable
          ? `<div style="margin-top:12px;padding:10px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;text-align:center">${esc(next.hint)}</div>`
          : '';

      const deliverBtn = canDeliverNew
        ? `<button type="button" class="btnWarrantyDeliverNew" data-item-id="${item.id}"
              style="width:100%;padding:11px;border-radius:10px;border:none;background:#16a34a;color:#fff;
                     font-size:14px;font-weight:700;cursor:pointer;margin-top:8px;letter-spacing:.2px">
             🔧 Lắp sản phẩm bảo hành →
           </button>`
        : '';

      return `
        <div style="border:1.5px solid ${borderColor};border-radius:14px;padding:14px;background:${bgColor}">
          <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px">
            <div style="flex:1;font-size:15px;font-weight:700;color:#0f172a">${esc(item.product_name || item.device_name || `Sản phẩm #${item.id}`)}</div>
            ${statusPill}
          </div>

          ${!isCancelled ? '' : ''}

          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
            ${item.handling_type && item.handling_type !== 'pending'
              ? `<div style="padding:4px 10px;border-radius:8px;background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:700">Đã chọn: ${esc(HANDLING_LABEL[item.handling_type] || item.handling_type)}</div>`
              : `<div style="padding:4px 10px;border-radius:8px;background:#fef3c7;color:#92400e;font-size:12px;font-weight:600">❓ Chưa chọn hướng xử lý</div>`}
            <div style="padding:4px 10px;border-radius:8px;background:${locColor[0]};color:${locColor[1]};font-size:12px;font-weight:600">📍 ${esc(locLabel)}</div>
            ${item.holder_staff_name ? `<div style="padding:4px 10px;border-radius:8px;background:#f8fafc;color:#334155;font-size:12px">👤 ${esc(item.holder_staff_name)}</div>` : ''}
          </div>

          ${bits.length ? `<div style="margin-top:8px;font-size:12.5px;color:#475569">${bits.join(' · ')}</div>` : ''}
          ${item.condition_note ? `<div style="margin-top:4px;font-size:12.5px;color:#334155"><b>Tình trạng:</b> ${esc(item.condition_note)}</div>` : ''}

          ${item.replacement_product_name ? `
            <div style="margin-top:8px;padding:8px 10px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;font-size:12.5px;color:#166534">
              📦 <b>Hàng giao KH:</b> ${esc(item.replacement_product_name)}
              ${item.replacement_source_scope === 'technician_stock' ? ' · từ túi KTV' : item.replacement_source_scope === 'company_stock' ? ' · từ kho công ty' : ''}
            </div>` : ''}

          ${Number(item.additional_cost || 0) > 0 ? `<div style="margin-top:6px;font-size:12.5px;color:#334155"><b>Chi phí thêm:</b> ${fmt(item.additional_cost)}đ</div>` : ''}

          ${!isDone && !isCancelled ? `<div style="margin-top:10px;padding:8px 10px;background:#eff6ff;border-radius:8px;border-left:3px solid #2563eb;font-size:12.5px;color:#1e40af">👉 ${esc(canDeliverNew ? 'Bấm "Lắp sản phẩm bảo hành" để lắp máy cho khách — hệ thống tự lấy từ túi KTV nếu có, không thì xuất kho cửa hàng.' : next.hint)}</div>` : ''}

          ${(() => {
          const matched = lineMatches.get(Number(item.id));
          return matched ? renderFieldValueEditor(o.id, matched.line, matched.item, { compact: true, collapsed: true }) : '';
        })()}

          ${ctaHtml}
          ${deliverBtn}
        </div>`;
    }).join('') : '<p style="color:#94a3b8;text-align:center;padding:20px">Chưa có sản phẩm bảo hành</p>';

    const ACTION_STYLE = {
      mark_fixed:                          { color: '#16a34a', icon: '🔧' },
      receive_from_customer:               { color: '#2563eb', icon: '📥' },
      move_to_company_stock:               { color: '#7c3aed', icon: '🏢' },
      send_to_supplier:                    { color: '#d97706', icon: '📦' },
      receive_from_supplier:               { color: '#0891b2', icon: '📬' },
      reserve_replacement_from_technician: { color: '#2563eb', icon: '🔄' },
      reserve_replacement_from_company:    { color: '#7c3aed', icon: '🔄' },
      deliver_to_customer:                 { color: '#16a34a', icon: '✅' },
      cancel_item:                         { color: '#dc2626', icon: '✖️' },
      note:                                { color: '#64748b', icon: '📝' },
    };
    const moveHtml = moves.length ? `
      <div style="position:relative;padding-left:8px">
        ${moves.map((move, idx) => {
          const st = ACTION_STYLE[move.action_code] || { color: '#64748b', icon: '•' };
          const isLast = idx === moves.length - 1;
          const dt = move.occurred_at ? new Date(move.occurred_at) : null;
          const timeStr = dt ? dt.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '';
          return `
          <div style="position:relative;display:flex;gap:12px;padding-bottom:${isLast ? '0' : '14px'}">
            <div style="position:relative;flex:0 0 28px;display:flex;justify-content:center">
              ${isLast ? '' : `<div style="position:absolute;top:26px;bottom:-14px;width:2px;background:#e2e8f0"></div>`}
              <div style="width:28px;height:28px;border-radius:50%;background:${st.color}1a;border:2px solid ${st.color};display:flex;align-items:center;justify-content:center;font-size:13px;z-index:1">${st.icon}</div>
            </div>
            <div style="flex:1;min-width:0;padding-bottom:2px">
              <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline">
                <span style="font-size:13px;font-weight:700;color:${st.color}">${esc(WARRANTY_ACTION_LABELS[move.action_code] || move.action_code)}</span>
                <span style="font-size:11px;color:#94a3b8;white-space:nowrap">${esc(timeStr)}</span>
              </div>
              <div style="font-size:12px;color:#64748b;margin-top:2px">
                ${esc((LOC_LABEL[move.from_location] || move.from_location || '—') + ' → ' + (LOC_LABEL[move.to_location] || move.to_location || '—'))}
                ${move.holder_staff_name ? ` · 👤 ${esc(move.holder_staff_name)}` : ''}
                ${move.receipt_code ? ` · <b style="color:#0f766e">${esc(move.receipt_code)}</b>` : ''}
              </div>
              ${move.note_text ? `<div style="font-size:12px;color:#334155;margin-top:3px;background:#f8fafc;border-radius:6px;padding:4px 8px">${esc(move.note_text)}</div>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>`
      : '<p style="color:#94a3b8;font-size:12.5px;text-align:center;padding:8px">Chưa có diễn biến</p>';

    return `
      <div class="od-section">
        <h4 style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span>🔧 Bảo hành</span>
          <button class="btn ghost sm" id="btnWarrantyEdit" style="margin-left:auto">+ Thêm / sửa sản phẩm</button>
          <a class="btn ghost sm" href="/kithuat/inventory.html#warrantyBagBlock">Túi KTV</a>
        </h4>
        ${meta.note_text ? `<div style="margin-bottom:12px;padding:10px 12px;border-radius:8px;background:#fffbeb;border:1px solid #fde68a;font-size:12.5px;color:#78350f">📝 ${esc(meta.note_text)}</div>` : ''}
        <div style="display:grid;gap:12px">${itemHtml}</div>
        ${(() => {
          const progressLines = String(o.progress_note || '').split(/\n+/).map((s) => s.trim()).filter(Boolean);
          const latestProgress = progressLines.length ? progressLines[progressLines.length - 1] : '';
          const DS_CHIP = {
            pending:    ['#fef3c7', '#92400e'],
            processing: ['#dbeafe', '#1e40af'],
            supplier:   ['#fef9c3', '#854d0e'],
            delivered:  ['#dcfce7', '#166534'],
          };
          const handlingSummary = items
            .filter((it) => it.current_status !== 'cancelled')
            .map((it) => {
              const name = esc(it.product_name || it.device_name || `#${it.id}`);
              const h = it.handling_type && it.handling_type !== 'pending'
                ? esc(HANDLING_LABEL[it.handling_type] || it.handling_type)
                : '❓ Chưa chọn hướng xử lý';
              const dsCode = (it.display_state && it.display_state.code) || 'processing';
              const dsLabel = (it.display_state && it.display_state.label) || '';
              const chip = DS_CHIP[dsCode] || DS_CHIP.processing;
              return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#fff;border:1px solid #eef2f7;border-radius:8px;margin-top:6px">
                <div style="flex:1;min-width:0">
                  <div style="font-size:12.5px;font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>
                  <div style="font-size:11.5px;color:#64748b;margin-top:1px">${h}</div>
                </div>
                ${dsLabel ? `<span style="flex-shrink:0;padding:3px 10px;border-radius:999px;background:${chip[0]};color:${chip[1]};font-size:11px;font-weight:700">${esc(dsLabel)}</span>` : ''}
              </div>`;
            }).join('');
          return `
        <div style="margin-top:14px;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.06)">
          <div style="display:flex;align-items:center;gap:8px;padding:11px 14px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff">
            <span style="font-size:15px">📋</span>
            <span style="font-size:13.5px;font-weight:700;letter-spacing:.2px">Tiến trình hiện tại</span>
          </div>
          <div style="padding:12px 14px;background:#f8fafc">
            ${latestProgress
              ? `<div style="display:flex;gap:8px;padding:10px 12px;background:#fff;border-left:3px solid #2563eb;border-radius:8px;box-shadow:0 1px 2px rgba(15,23,42,.04)">
                   <span style="font-size:14px">📍</span>
                   <div><div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Thực tế hiện tại</div>
                   <div style="font-size:13px;color:#0f172a;margin-top:1px">${esc(latestProgress)}</div></div>
                 </div>`
              : ''}
            <div style="margin-top:${latestProgress ? '10px' : '0'}">${handlingSummary || '<div style="font-size:12.5px;color:#94a3b8">Chưa có sản phẩm</div>'}</div>
            <details style="margin-top:12px;border-top:1px dashed #e2e8f0;padding-top:10px">
              <summary style="cursor:pointer;font-size:12px;font-weight:700;color:#1e40af;list-style:none;display:flex;align-items:center;gap:6px">🕑 Diễn biến chi tiết <span style="color:#94a3b8;font-weight:500">(${moves.length} mục)</span></summary>
              <div style="margin-top:12px">${moveHtml}</div>
            </details>
          </div>
        </div>`;
        })()}
      </div>`;
  }

  function warrantyActionLabel(actionCode, choice = {}) {
    return {
      mark_fixed: 'Tự khắc phục',
      receive_from_customer: 'Đưa vào túi KTV',
      move_to_company_stock: 'Trả về kho công ty',
      reserve_replacement_from_technician: 'Lấy hàng đổi từ túi KTV',
      reserve_replacement_from_company: choice.sourceMode === 'supplier_returned_item' ? 'Nhận hàng bảo hành để đi giao' : 'Nhận hàng từ kho công ty',
      deliver_to_customer: 'Giao lại cho khách',
    }[actionCode] || 'Cập nhật';
  }

  function warrantyActionDescription(actionCode, item, context = {}, choice = {}) {
    const holdings = Array.isArray(context.technicianHoldings) ? context.technicianHoldings : [];
    const companyStock = Array.isArray(context.companyStock) ? context.companyStock : [];
    switch (actionCode) {
      case 'mark_fixed':
        return 'KTV tự xử lý xong sản phẩm này tại chỗ. Nếu có chi phí phát sinh thì nhập vào bên dưới.';
      case 'receive_from_customer':
        return 'Thu hồi sản phẩm lỗi từ khách và đưa vào túi KTV của bạn.';
      case 'move_to_company_stock':
        return 'Trả sản phẩm lỗi từ túi KTV về kho bảo hành công ty để nhân viên xử lý tiếp.';
      case 'reserve_replacement_from_technician':
        return holdings.length
          ? 'Chọn thiết bị trong túi KTV để đổi ngay cho khách.'
          : 'Hiện tại bạn không có thiết bị đổi trả, lên hệ kho để cấp thêm.';
      case 'reserve_replacement_from_company':
        if (choice.sourceMode === 'supplier_returned_item') return 'Nhận sản phẩm bảo hành vừa trả về từ NCC để mang đi giao lại cho khách.';
        return companyStock.length
          ? 'Nhận thiết bị từ kho công ty để mang đi giao cho khách.'
          : 'Kho công ty hiện không có thiết bị đổi trả để cấp thêm.';
      case 'deliver_to_customer':
        if (item.handling_type === 'tech_fix') return 'Xác nhận đã khắc phục xong và trả lại sản phẩm cho khách.';
        if (item.current_status === 'supplier_returned' && !item.replacement_product_id) return 'Giao lại sản phẩm bảo hành vừa nhận từ NCC cho khách.';
        return 'Sản phẩm giao khách đã sẵn sàng. Xác nhận giao lại cho khách.';
      default:
        return 'Chọn bước xử lý tiếp theo cho sản phẩm này.';
    }
  }

  function getWarrantyPrimaryActionInfo(item) {
    const actions = new Set((item && item.available_actions) || []);
    const hasAssignedReplacement = !!(item && item.replacement_product_id && item.replacement_staff_id);
    if (!item || item.customer_status === 'completed' || item.current_status === 'delivered' || item.current_location === 'customer_returned') {
      return {
        actionable: false,
        button: 'Sản phẩm đã xong',
        hint: 'Sản phẩm này đã xong phía khách. Nếu đồ lỗi còn trong túi KTV thì trả về kho công ty.',
      };
    }

    const options = [];
    if (actions.has('mark_fixed')) options.push({ actionCode: 'mark_fixed' });
    if (actions.has('reserve_replacement_from_technician') && !hasAssignedReplacement) options.push({ actionCode: 'reserve_replacement_from_technician' });
    if (actions.has('receive_from_customer')) options.push({ actionCode: 'receive_from_customer' });
    // 'move_to_company_stock' da tach sang trang kho bao hanh (admin) - khong con o luong don KTV.
    // San pham da nhan ve tu NCC (supplier_returned) duoc lap thang bang nut "Lap san pham bao hanh".
    if (actions.has('reserve_replacement_from_company') && !hasAssignedReplacement && item.current_status !== 'supplier_returned') {
      options.push({ actionCode: 'reserve_replacement_from_company', sourceMode: null });
    }
    if (actions.has('deliver_to_customer') && (item.handling_type === 'tech_fix' || hasAssignedReplacement)) {
      options.push({ actionCode: 'deliver_to_customer' });
    }

    const priorities = {
      tech_fix: ['deliver_to_customer', 'mark_fixed', 'reserve_replacement_from_technician', 'reserve_replacement_from_company', 'receive_from_customer', 'move_to_company_stock'],
      exchange: ['deliver_to_customer', 'reserve_replacement_from_technician', 'reserve_replacement_from_company', 'mark_fixed', 'receive_from_customer', 'move_to_company_stock'],
      supplier_return: ['receive_from_customer', 'move_to_company_stock', 'reserve_replacement_from_company', 'deliver_to_customer', 'reserve_replacement_from_technician', 'mark_fixed'],
      pending: ['mark_fixed', 'reserve_replacement_from_technician', 'receive_from_customer', 'move_to_company_stock', 'reserve_replacement_from_company', 'deliver_to_customer'],
    };
    const order = priorities[item.handling_type] || priorities.pending;
    options.sort((a, b) => order.indexOf(a.actionCode) - order.indexOf(b.actionCode));

    if (!options.length) {
      if (item.current_status === 'company_warranty_stock') {
        return {
          actionable: false,
          button: 'Đang chờ admin / nhân viên xử lý',
          hint: 'Sản phẩm lỗi đã ở kho bảo hành công ty. Bước tiếp theo được xử lý ở danh sách gửi NCC.',
        };
      }
      return {
        actionable: false,
        button: 'Chưa có thao tác',
        hint: 'Sản phẩm này hiện chưa có thao tác phù hợp.',
      };
    }
    if (options.length === 1) {
      return {
        actionable: true,
        button: warrantyActionLabel(options[0].actionCode, options[0]),
        hint: warrantyActionDescription(options[0].actionCode, item, { technicianHoldings: [{}], companyStock: [{}] }, options[0]),
      };
    }
    // Da chot huong xu ly -> khong hoi chung chung nua, goi y buoc tiep theo cu the
    const HANDLING_SHORT = { tech_fix: 'Sửa nội bộ', exchange: 'Đổi thiết bị', supplier_return: 'Gửi NCC' };
    if (item.handling_type && item.handling_type !== 'pending' && HANDLING_SHORT[item.handling_type]) {
      const top = options[0];
      const topLabel = warrantyActionLabel(top.actionCode, top);
      return {
        actionable: true,
        button: topLabel,
        hint: `KTV đã chọn hướng xử lý: ${HANDLING_SHORT[item.handling_type]}. Bước tiếp theo nên làm: ${topLabel.toLowerCase()}.`,
      };
    }
    return {
      actionable: true,
      button: 'Chọn cách xử lý',
      hint: `Sản phẩm này có ${options.length} cách xử lý. Bấm để chọn bước tiếp theo phù hợp.`,
    };
  }

  function buildWarrantyDecisionOptions(item, context = {}) {
    const actions = new Set((item && item.available_actions) || []);
    const holdings = Array.isArray(context.technicianHoldings) ? context.technicianHoldings : [];
    const companyStock = Array.isArray(context.companyStock) ? context.companyStock : [];
    const hasAssignedReplacement = !!(item && item.replacement_product_id && item.replacement_staff_id);
    const choices = [];

    if (item.current_status === 'intake' && item.current_location === 'customer') {
      return [
        { actionCode: 'mark_fixed', label: 'Tự xử lý', description: 'KTV tự xử lý xong sản phẩm này tại chỗ. Khách hàng nhận lại thiết bị đã sửa.', enabled: actions.has('mark_fixed') },
        { actionCode: 'swap_and_deliver', label: 'Đổi trả', description: 'Tôi có mang thiết bị và đổi trả sản phẩm này với sản phẩm lỗi của khách (khi chọn phương án này bạn thiết bị lỗi sẽ về túi ktv trên hệ thống và khách hàng sẽ cập nhật thiêt bị này là đã khắc phục).', enabled: holdings.length > 0 },
        { actionCode: 'receive_from_customer', label: 'Thu hồi sản phẩm lỗi', description: 'Tôi không mang sản phẩm thay thế, tôi sẽ thu hồi sản phẩm lỗi  chờ trả về kho , đơn sẽ ở trạng thái đang xử lí và chờ sản phẩm đổi trả từ nhà cung cấp .', enabled: actions.has('receive_from_customer') },
        { actionCode: 'note', label: 'Chờ xử lý', description: 'Tôi đã kiểm tra và không lấy sản phẩm lỗi về, đơn hàng trên hệ thống vẫn chờ xử lý. ', enabled: true },
      ];
    }

    const pushChoice = (actionCode, extra = {}) => {
      const choice = {
        code: actionCode,
        actionCode,
        nextAction: actionCode,
        sourceMode: extra.sourceMode || null,
        enabled: extra.enabled !== false,
      };
      choice.label = warrantyActionLabel(actionCode, choice);
      choice.description = extra.description || warrantyActionDescription(actionCode, item, context, choice);
      choices.push(choice);
    };

    if (actions.has('mark_fixed') && item.customer_status !== 'completed') {
      pushChoice('mark_fixed');
    }
    if (actions.has('reserve_replacement_from_technician') && !hasAssignedReplacement) {
      pushChoice('reserve_replacement_from_technician', { enabled: holdings.length > 0 });
    }
    if (actions.has('receive_from_customer')) {
      pushChoice('receive_from_customer');
    }
    // 'move_to_company_stock' da tach sang trang kho bao hanh (admin).
    // San pham da nhan ve tu NCC -> lap thang bang nut "Lap san pham bao hanh", khong qua buoc nay.
    if (actions.has('reserve_replacement_from_company') && !hasAssignedReplacement && item.current_status !== 'supplier_returned') {
      pushChoice('reserve_replacement_from_company', { enabled: companyStock.length > 0 });
    }
    if (actions.has('deliver_to_customer') && (item.handling_type === 'tech_fix' || hasAssignedReplacement)) {
      pushChoice('deliver_to_customer');
    }

    const priorities = {
      tech_fix: ['deliver_to_customer', 'mark_fixed', 'reserve_replacement_from_technician', 'reserve_replacement_from_company', 'receive_from_customer', 'move_to_company_stock'],
      exchange: ['deliver_to_customer', 'reserve_replacement_from_technician', 'reserve_replacement_from_company', 'mark_fixed', 'receive_from_customer', 'move_to_company_stock'],
      supplier_return: ['receive_from_customer', 'move_to_company_stock', 'reserve_replacement_from_company', 'deliver_to_customer', 'reserve_replacement_from_technician', 'mark_fixed'],
      pending: ['mark_fixed', 'reserve_replacement_from_technician', 'receive_from_customer', 'move_to_company_stock', 'reserve_replacement_from_company', 'deliver_to_customer'],
    };
    const order = priorities[item.handling_type] || priorities.pending;
    choices.sort((a, b) => order.indexOf(a.actionCode) - order.indexOf(b.actionCode));
    return choices;
  }

  function renderWarrantyDecisionPanel(choice, context = {}) {
    if (!choice) {
      return '<div style="padding:12px;border:1px dashed #cbd5e1;border-radius:10px;color:#64748b">Chọn 1 thao tác cụ thể để tiếp tục.</div>';
    }
    const holdings = Array.isArray(context.technicianHoldings) ? context.technicianHoldings : [];
    const companyStock = Array.isArray(context.companyStock) ? context.companyStock : [];
    const infoBox = `<div style="padding:12px;border:1px solid #dbeafe;border-radius:10px;background:#f8fbff;color:#1e3a8a;font-size:13px;line-height:1.5">${esc(choice.description || '')}</div>`;

    if (choice.actionCode === 'mark_fixed') {
      return `
        ${infoBox}
        <div class="field" style="margin-top:12px">
          <label>Chi phí thêm</label>
          <input id="waCost" class="input" inputmode="numeric" value="0">
        </div>`;
    }

    if (choice.actionCode === 'reserve_replacement_from_technician' || choice.actionCode === 'swap_and_deliver') {
      return `
        ${infoBox}
        <div class="field" style="margin-top:12px">
          <label>Sản phẩm đổi từ túi KTV</label>
          <select id="waReplacementProduct" class="select">
            ${holdings.map((h) => `<option value="${h.product_id}">${esc(h.product_code || '')}${h.product_code ? ' · ' : ''}${esc(h.product_name || '')} · Còn ${fmt(h.qty)}</option>`).join('')}
          </select>
        </div>`;
    }

    if (choice.actionCode === 'reserve_replacement_from_company' && choice.sourceMode !== 'supplier_returned_item') {
      return `
        ${infoBox}
        <div class="field" style="margin-top:12px">
          <label>Sản phẩm cấp từ kho công ty</label>
          <select id="waReplacementProduct" class="select">
            ${companyStock.map((p) => `<option value="${p.product_id}">${esc(p.code || '')}${p.code ? ' · ' : ''}${esc(p.name || '')} · Còn ${fmt(p.quantity)}</option>`).join('')}
          </select>
        </div>`;
    }

    return infoBox;
  }

  function warrantyConfirmLabel(choice) {
    if (!choice || !choice.actionCode) return 'Đóng';
    if (choice.label) return choice.label;
    return warrantyActionLabel(choice.actionCode, choice);
  }

  async function openWarrantyStatusModal(item) {
    const needTechnicianStock = Array.isArray(item.available_actions) && item.available_actions.includes('reserve_replacement_from_technician');
    const needCompanyStock = Array.isArray(item.available_actions)
      && item.available_actions.includes('reserve_replacement_from_company')
      && !item.replacement_product_id
      && item.current_status !== 'supplier_returned';

    const [inventoryRes, companyStockRes] = await Promise.all([
      needTechnicianStock ? api.get('/kithuat/inventory', { onError: 'toast' }).catch(() => null) : Promise.resolve(null),
      needCompanyStock ? api.get('/kithuat/inventory/available-stock', { onError: 'toast' }).catch(() => null) : Promise.resolve(null),
    ]);

    const context = {
      technicianHoldings: (inventoryRes && inventoryRes.items) || [],
      companyStock: (companyStockRes && companyStockRes.items) || [],
    };
    const choices = buildWarrantyDecisionOptions(item, context);
    if (!choices.length) {
      ui.toast('Sản phẩm này hiện chưa có thao tác cập nhật phù hợp', 'warning');
      return;
    }

    const enabledChoices = choices.filter((choice) => choice.enabled && choice.actionCode);
    if (enabledChoices.length === 1) {
      await openWarrantyActionModal(item.id, enabledChoices[0].actionCode, { choice: enabledChoices[0], context });
      return;
    }
    const defaultChoice = enabledChoices[0] || choices[0];
    const modalHtml = `
      <style>
        #simpleModal .modal{max-width:900px;width:min(900px,calc(100vw - 32px))}
        #simpleModal .w-status-grid{display:grid;gap:10px;grid-template-columns:1fr}
        #simpleModal .w-status-card{display:flex;flex-direction:column;gap:8px;align-items:flex-start;padding:12px;border:1px solid #dbe2ea;border-radius:12px;background:#fff;cursor:pointer}
        #simpleModal .w-status-card.disabled{opacity:.6;background:#f8fafc;cursor:not-allowed}
        #simpleModal .w-status-card input{margin-top:2px}
        #simpleModal .w-status-card b{display:block;color:#0f172a;margin-bottom:4px;font-size:14px}
        #simpleModal .w-status-card span{display:block;font-size:12.5px;line-height:1.5;color:#475569}
      </style>
      <div style="padding:14px">
        <div style="margin-bottom:12px">
          <div style="font-size:14px;font-weight:700;color:#0f172a">${esc(item.product_name || item.device_name || ('Item #' + item.id))}</div>
          <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
            ${warrantyBadge(WARRANTY_HANDLING_LABELS[item.handling_type] || item.handling_type || 'Chưa chọn', '#eff6ff', '#1d4ed8')}
            ${warrantyBadge(WARRANTY_CUSTOMER_LABELS[item.customer_status] || item.customer_status || 'pending', item.customer_status === 'completed' ? '#dcfce7' : '#fff7ed', item.customer_status === 'completed' ? '#166534' : '#c2410c')}
            ${warrantyStatusBadge(item.current_status)}
          </div>
        </div>
        <div class="w-status-grid">
          ${choices.map((choice) => `
            <label class="w-status-card ${choice.enabled ? '' : 'disabled'}">
              <div style="display:flex; gap: 8px; width:100%; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                <input type="radio" name="wStatusChoice" value="${esc(choice.actionCode)}"
                  ${defaultChoice && defaultChoice.actionCode === choice.actionCode ? 'checked' : ''}
                  ${choice.enabled ? '' : 'disabled'}>
                <b>${esc(choice.label)}</b>
              </div>
              <div>
                <span>${esc(choice.description || '')}</span>
              </div>
            </label>`).join('')}
        </div>
        <div id="wStatusPanel" style="margin-top:14px"></div>
        <div class="field" style="margin-top:12px">
          <label>Chụp ảnh (nếu có)</label>
          <div style="margin-bottom:8px">
            <button type="button" class="btn outline sm" id="waPhotoBtn">Chụp ảnh / Tải lên</button>
            <input type="file" id="waPhotoInput" accept="image/*" style="display:none" multiple>
          </div>
          <div id="waPhotoPreview" style="display:flex;gap:8px;flex-wrap:wrap"></div>
        </div>
        <div class="field" style="margin-top:12px">
          <label>Ghi chú</label>
          <textarea id="waNote" rows="3" class="input" placeholder="Mô tả thao tác vừa cập nhật"></textarea>
        </div>
      </div>`;

    const okPromise = openSimpleModal('Chọn cách xử lý sản phẩm', modalHtml, enabledChoices.length ? 'Lưu thao tác' : 'Đóng');
    const $panel = document.getElementById('wStatusPanel');
    const renderPanel = () => {
      const selectedCode = (document.querySelector('input[name="wStatusChoice"]:checked') || {}).value;
      const selected = choices.find((choice) => choice.actionCode === selectedCode) || defaultChoice || null;
      $panel.innerHTML = renderWarrantyDecisionPanel(selected, context);
      const $ok = document.getElementById('smOk');
      if ($ok) $ok.textContent = warrantyConfirmLabel(selected);
    };
    document.querySelectorAll('input[name="wStatusChoice"]').forEach((input) => {
      input.addEventListener('change', renderPanel);
    });
    renderPanel();

    let uploadedPhotoUrls = [];
    const $photoBtn = document.getElementById('waPhotoBtn');
    const $photoInput = document.getElementById('waPhotoInput');
    const $photoPreview = document.getElementById('waPhotoPreview');
    if ($photoBtn && $photoInput) {
      $photoBtn.addEventListener('click', () => $photoInput.click());
      $photoInput.addEventListener('change', async () => {
        if (!$photoInput.files.length) return;
        $photoBtn.disabled = true;
        $photoBtn.textContent = 'Đang tải...';
        try {
          for (const file of $photoInput.files) {
            const url = await uploadImage(file);
            if (url) {
              uploadedPhotoUrls.push(url);
              const img = document.createElement('img');
              img.src = url;
              img.style.cssText = 'width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid #cbd5e1';
              $photoPreview.appendChild(img);
            }
          }
        } catch (err) {
          ui.toast(err.message || 'Lỗi tải ảnh', 'error');
        } finally {
          $photoBtn.disabled = false;
          $photoBtn.textContent = 'Chụp ảnh / Tải lên';
          $photoInput.value = '';
        }
      });
    }

    const ok = await okPromise;
    if (!ok) return;
    if (!enabledChoices.length) {
      closeSimpleModal();
      return;
    }

    const selectedCode = (document.querySelector('input[name="wStatusChoice"]:checked') || {}).value;
    const selected = choices.find((choice) => choice.actionCode === selectedCode);
    if (!selected || !selected.enabled || !selected.actionCode) {
      ui.toast('Hãy chọn 1 thao tác hợp lệ', 'warning');
      closeSimpleModal();
      return;
    }

    const payload = {
      warranty_item_id: Number(item.id),
      action_code: selected.actionCode,
      note_text: ((document.getElementById('waNote') || {}).value || '').trim() || null,
      photo_urls: uploadedPhotoUrls,
    };
    if (selected.actionCode === 'mark_fixed') {
      payload.additional_cost = Number(String((document.getElementById('waCost') || {}).value || '0').replace(/[^\d]/g, '')) || 0;
    }
    if (selected.actionCode === 'receive_from_customer') {
      payload.handling_type = 'supplier_return';
    }
    if (selected.actionCode === 'reserve_replacement_from_technician' || selected.actionCode === 'swap_and_deliver') {
      payload.replacement_product_id = Number((document.getElementById('waReplacementProduct') || {}).value) || 0;
    }
    if (selected.actionCode === 'reserve_replacement_from_company') {
      if (selected.sourceMode === 'supplier_returned_item') {
        payload.source_mode = 'supplier_returned_item';
      } else {
        payload.replacement_product_id = Number((document.getElementById('waReplacementProduct') || {}).value) || 0;
      }
    }

    closeSimpleModal();

    if (selected.actionCode === 'swap_and_deliver') {
      payload.action_code = 'reserve_replacement_from_technician';
      const r1 = await api.post(`/kithuat/orders/${state.detail.id}/warranty/moves`, payload, { onError: 'toast' });
      if (r1) {
        const payload2 = {
          warranty_item_id: Number(item.id),
          action_code: 'deliver_to_customer',
          note_text: payload.note_text,
          photo_urls: [],
        };
        await api.post(`/kithuat/orders/${state.detail.id}/warranty/moves`, payload2, { onError: 'toast' });
        ui.toast('Đã cập nhật đổi trả thành công', 'success');
        openDetail(state.detail.id);
        loadList();
      }
    } else {
      const r = await api.post(`/kithuat/orders/${state.detail.id}/warranty/moves`, payload, { onError: 'toast' });
      if (r) {
        const receiptCode = r.receipt && r.receipt.code ? ` (${r.receipt.code})` : '';
        ui.toast('Đã cập nhật bảo hành' + receiptCode, 'success');
        openDetail(state.detail.id);
        loadList();
      }
    }
  }



  async function openWarrantyEditorV2() {
    const o = state.detail;
    const warranty = o.warranty || { meta: {}, items: [] };
    const meta = warranty.meta || {};
    const items = (warranty.items || []).map((item) => ({
      id: item.id,
      item_role: 'faulty',
      handling_type: item.handling_type || 'pending',
      product_id: item.product_id || 0,
      qty: Number(item.qty) || 1,
      imei: item.imei || '',
      license_plate: item.license_plate || '',
      account_name: item.account_name || '',
      sim_number: item.sim_number || '',
      note_text: item.note_text || '',
      additional_cost: Number(item.additional_cost) || 0,
    }));
    if (!items.length) {
      items.push({ id: null, item_role: 'faulty', handling_type: 'pending', product_id: 0, qty: 1, imei: '', license_plate: '', account_name: '', sim_number: '', note_text: '', additional_cost: 0 });
    }

    const lookups = await api.get('/kithuat/warranty/lookups', { onError: 'toast' }).catch(() => null);
    if (!lookups) return;
    const products = lookups.products || [];
    const suppliers = lookups.suppliers || [];
    const productOptions = ['<option value="0">- Chọn sản phẩm -</option>']
      .concat(products.map((p) => `<option value="${p.id}">${esc(p.code || '')}${p.code ? ' · ' : ''}${esc(p.name || '')}</option>`))
      .join('');
    const supplierOptions = ['<option value="0">- Chưa chọn NCC -</option>']
      .concat(suppliers.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`))
      .join('');

    function renderRows() {
      return items.map((item, idx) => `
        <div class="w-edit-row" data-idx="${idx}" style="border:1px solid #dbe7f3;border-radius:16px;padding:16px;background:linear-gradient(180deg,#ffffff 0%,#f8fbff 100%);margin-bottom:12px;box-shadow:0 8px 24px rgba(15,23,42,.05)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
            <div style="width:34px;height:34px;border-radius:10px;background:#dbeafe;color:#1d4ed8;display:grid;place-items:center;font-weight:800">${idx + 1}</div>
            <div style="font-weight:800;color:#0f172a;font-size:14px">Sản phẩm bảo hành</div>
            <div style="margin-left:auto"><button type="button" class="btn ghost sm w-del">Xóa</button></div>
          </div>
          <div class="we-item-grid" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px">

            <div class="field" style="margin:0;grid-column:span 2">
              <label>Sản phẩm</label>
              <select class="select w-product">${productOptions}</select>
            </div>
            <div class="field" style="margin:0">
              <label>Số lượng</label>
              <input class="input w-qty" inputmode="numeric" value="${fmt(item.qty || 1)}">
            </div>
            <div class="field" style="margin:0">
              <label>Chi phí thêm</label>
              <input class="input w-cost" inputmode="numeric" value="${fmt(item.additional_cost || 0)}" placeholder="0">
            </div>
            <div class="field" style="margin:0">
              <label>IMEI</label>
              <input class="input w-imei" value="${esc(item.imei || '')}">
            </div>
            <div class="field" style="margin:0">
              <label>Biển số</label>
              <input class="input w-plate" value="${esc(item.license_plate || '')}">
            </div>
            <div class="field" style="margin:0">
              <label>Tên tài khoản</label>
              <input class="input w-account" value="${esc(item.account_name || '')}">
            </div>
            <div class="field" style="margin:0">
              <label>Số SIM</label>
              <input class="input w-sim" value="${esc(item.sim_number || '')}">
            </div>
            <div class="field" style="margin:0;grid-column:1 / -1">
              <label>Ghi chú</label>
              <textarea class="input w-note" rows="2" placeholder="Ghi chú riêng cho sản phẩm này">${esc(item.note_text || '')}</textarea>
            </div>
          </div>
        </div>`).join('');
    }

    const html = `
      <style>
        #simpleModal .modal{max-width:1180px !important;width:min(1180px,calc(100vw - 32px))}
        #simpleModal .modal-body{background:#f3f7fb}
        #simpleModal .we-wrap{padding:16px;display:grid;gap:16px}
        #simpleModal .we-section{background:#fff;border:1px solid #dbe7f3;border-radius:18px;padding:18px;box-shadow:0 12px 28px rgba(15,23,42,.05)}
        #simpleModal .we-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
        #simpleModal .we-section-title{font-size:13px;font-weight:800;color:#0f172a;letter-spacing:.04em;text-transform:uppercase}
        #simpleModal .we-order-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        @media (max-width: 860px){
          #simpleModal .we-order-grid{grid-template-columns:1fr}
          #simpleModal .we-item-grid{grid-template-columns:1fr !important}
        }
      </style>
      <div class="we-wrap">
        <div class="we-section">
          <div class="we-section-head">
            <div class="we-section-title">Thông Tin Đơn Bảo Hành</div>
          </div>
          <div class="we-order-grid">

            <div class="field" style="margin:0;grid-column:1 / -1"><label>Địa chỉ</label><input id="weAddress" class="input" value="${esc(o.address || '')}"></div>
            <div class="field" style="margin:0"><label>Ghi chú đơn</label><textarea id="weOrderNote" class="input" rows="3">${esc(o.note || '')}</textarea></div>
            <div class="field" style="margin:0"><label>Ghi chú bảo hành</label><textarea id="weMetaNote" class="input" rows="3">${esc(meta.note_text || '')}</textarea></div>
          </div>
        </div>
        <div class="we-section">
          <div class="we-section-head">
            <div class="we-section-title">Danh Sách Sản Phẩm Bảo Hành</div>
            <button type="button" class="btn ghost sm" id="btnWeAdd">+ Thêm sản phẩm</button>
          </div>
          <div id="weItems">${renderRows()}</div>
        </div>
      </div>`;

    const okPromise = openSimpleModal('Sửa thông tin bảo hành', html, 'Lưu');

    const bindRows = () => {
      document.querySelectorAll('#weItems .w-edit-row').forEach((row) => {
        const idx = Number(row.dataset.idx);
        const item = items[idx];
        const qp = row.querySelector('.w-product');
        if (qp) qp.value = String(item.product_id || 0);
        const bind = (selector, key, parser) => {
          const el = row.querySelector(selector);
          if (!el) return;
          const save = () => { item[key] = parser ? parser(el.value) : el.value; };
          el.addEventListener('input', save);
          el.addEventListener('change', save);
        };

        bind('.w-product', 'product_id', (v) => Number(v) || 0);
        bind('.w-qty', 'qty', (v) => Math.max(1, Number(String(v).replace(/[^\d]/g, '')) || 1));
        bind('.w-cost', 'additional_cost', (v) => Math.max(0, Number(String(v).replace(/[^\d]/g, '')) || 0));
        bind('.w-imei', 'imei');
        bind('.w-plate', 'license_plate');
        bind('.w-account', 'account_name');
        bind('.w-sim', 'sim_number');
        bind('.w-note', 'note_text');
        const delBtn = row.querySelector('.w-del');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            if (items.length <= 1) {
              ui.toast('Cần ít nhất 1 item', 'warning');
              return;
            }
            items.splice(idx, 1);
            document.getElementById('weItems').innerHTML = renderRows();
            bindRows();
          });
        }
      });
    };
    bindRows();
    const addBtn = document.getElementById('btnWeAdd');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        items.push({ id: null, item_role: 'faulty', handling_type: 'pending', product_id: 0, qty: 1, imei: '', license_plate: '', account_name: '', sim_number: '', note_text: '', additional_cost: 0 });
        document.getElementById('weItems').innerHTML = renderRows();
        bindRows();
      });
    }

    const ok = await okPromise;
    if (!ok) return;
    const payload = {
      address: document.getElementById('weAddress').value.trim() || null,
      note: document.getElementById('weOrderNote').value.trim() || null,
      meta: {
        warranty_mode: meta.warranty_mode || 'repair',
        default_supplier_id: meta.default_supplier_id || null,
        current_stage: meta.current_stage || 'intake',
        note_text: document.getElementById('weMetaNote').value.trim() || null,
      },
      items: items.map((item) => ({
        id: item.id || null,
        item_role: 'faulty',
        handling_type: item.handling_type,
        product_id: Number(item.product_id) || null,
        qty: Math.max(1, Number(item.qty) || 1),
        imei: item.imei?.trim() || null,
        license_plate: item.license_plate?.trim() || null,
        account_name: item.account_name?.trim() || null,
        sim_number: item.sim_number?.trim() || null,
        note_text: item.note_text?.trim() || null,
        additional_cost: Math.max(0, Number(item.additional_cost) || 0),
      })).filter((item) => item.id || item.product_id || item.imei || item.license_plate || item.account_name || item.sim_number || item.note_text),
    };
    closeSimpleModal();
    const r = await api.put(`/kithuat/orders/${o.id}/warranty`, payload, { onError: 'toast' });
    if (r) {
      ui.toast('Đã lưu bảo hành', 'success');
      openDetail(o.id);
      loadList();
    }
  }

  async function openWarrantyActionModal(itemId, actionCode, opts = {}) {
    const o = state.detail;
    const item = ((o.warranty && o.warranty.items) || []).find((entry) => Number(entry.id) === Number(itemId));
    if (!item) return;
    if (actionCode === 'status') {
      await openWarrantyStatusModal(item);
      return;
    }
    const choice = opts.choice || {};
    const context = opts.context || {};
    let title = choice.label || WARRANTY_ACTION_LABELS[actionCode] || actionCode;
    let extraHtml = '';
    const introHtml = `<div style="font-size:13px;color:#1e3a8a;background:#f8fbff;border:1px solid #dbeafe;border-radius:10px;padding:10px 12px;margin-bottom:12px">${esc(choice.description || warrantyActionDescription(actionCode, item, context, choice))}</div>`;

    if (actionCode === 'reserve_replacement_from_technician') {
      const holdings = Array.isArray(context.technicianHoldings) && context.technicianHoldings.length
        ? context.technicianHoldings
        : (((await api.get('/kithuat/inventory', { onError: 'toast' }).catch(() => null)) || {}).items || []);
      if (!holdings.length) {
        ui.toast('Hiện tại bạn không có thiết bị đổi trả, lên hệ kho để cấp thêm', 'warning');
        return;
      }
      extraHtml = `
        <div class="field"><label>Sản phẩm đổi từ túi KTV</label>
          <select id="waReplacementProduct" class="select">
            ${holdings.map((h) => `<option value="${h.product_id}">${esc(h.product_code || '')}${h.product_code ? ' · ' : ''}${esc(h.product_name || '')} · Còn ${fmt(h.qty)}</option>`).join('')}
          </select>
        </div>`;
    } else if (actionCode === 'reserve_replacement_from_company') {
      if (choice.sourceMode === 'supplier_returned_item' || item.current_status === 'supplier_returned') {
        title = choice.label || 'Phân KTV đi giao';
        extraHtml = `<div style="font-size:13px;color:#334155;padding:8px 0">Sản phẩm đã nhận từ NCC. Hệ thống sẽ gán hàng này cho bạn để đi giao khách.</div>`;
      } else {
        const stock = Array.isArray(context.companyStock) && context.companyStock.length
          ? context.companyStock
          : (((await api.get('/kithuat/inventory/available-stock', { onError: 'toast' }).catch(() => null)) || {}).items || []);
        if (!stock.length) {
          ui.toast('Kho công ty hiện không có sản phẩm để cấp cho KTV', 'warning');
          return;
        }
        extraHtml = `
          <div class="field"><label>Sản phẩm cấp từ kho công ty</label>
            <select id="waReplacementProduct" class="select">
              ${stock.map((p) => `<option value="${p.product_id}">${esc(p.code || '')}${p.code ? ' · ' : ''}${esc(p.name || '')} · Còn ${fmt(p.quantity)}</option>`).join('')}
            </select>
          </div>`;
      }
    } else if (actionCode === 'mark_fixed') {
      extraHtml = `<div class="field"><label>Chi phí thêm</label><input id="waCost" class="input" inputmode="numeric" value="${fmt(item.additional_cost || 0)}"></div>`;
    }

    const html = `
      <div style="padding:14px">
        <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:8px">${esc(item.product_name || item.device_name || ('Item #' + item.id))}</div>
        <div style="font-size:12px;color:#64748b;margin-bottom:10px">${esc(WARRANTY_STATUS_LABELS[item.current_status] || item.current_status || '')}</div>
        ${introHtml}
        ${extraHtml}
        <div class="field"><label>Thời điểm</label><input id="waOccurredAt" type="datetime-local" class="input"></div>
        <div class="field"><label>Ghi chú</label><textarea id="waNote" rows="3" class="input" placeholder="Mô tả thao tác vừa thực hiện"></textarea></div>
      </div>`;
    const ok = await openSimpleModal(title, html, choice.label || warrantyActionLabel(actionCode, choice) || 'Lưu');
    if (!ok) return;
    const payload = {
      warranty_item_id: Number(item.id),
      action_code: actionCode,
      occurred_at: (document.getElementById('waOccurredAt') || {}).value || null,
      note_text: ((document.getElementById('waNote') || {}).value || '').trim() || null,
    };
    if (actionCode === 'mark_fixed') {
      payload.additional_cost = Number(String((document.getElementById('waCost') || {}).value || '0').replace(/[^\d]/g, '')) || 0;
    }
    if (actionCode === 'reserve_replacement_from_technician') {
      payload.replacement_product_id = Number((document.getElementById('waReplacementProduct') || {}).value) || 0;
    }
    if (actionCode === 'reserve_replacement_from_company') {
      if (choice.sourceMode === 'supplier_returned_item' || item.current_status === 'supplier_returned') {
        payload.source_mode = 'supplier_returned_item';
      } else {
        payload.replacement_product_id = Number((document.getElementById('waReplacementProduct') || {}).value) || 0;
      }
    }
    closeSimpleModal();
    const r = await api.post(`/kithuat/orders/${o.id}/warranty/moves`, payload, { onError: 'toast' });
    if (r) {
      const receiptCode = r.receipt && r.receipt.code ? ` (${r.receipt.code})` : '';
      ui.toast('Đã cập nhật bảo hành' + receiptCode, 'success');
      openDetail(o.id);
      loadList();
    }
  }

  // Lap san pham bao hanh cho khach.
  // Mac dinh lap dung san pham cua thiet bi loi; tu dong: con trong tui KTV thi lay tui,
  // khong thi xuat kho cua hang (tao phieu xuat). Lich su + phieu xuat deu duoc luu.
  async function openWarrantyDeliverDeviceModal(itemId) {
    const o = state.detail;
    const item = ((o.warranty && o.warranty.items) || []).find((entry) => Number(entry.id) === Number(itemId));
    if (!item) return;

    const [holdingsRes, stockRes] = await Promise.all([
      api.get('/kithuat/inventory').catch(() => null),
      api.get('/kithuat/inventory/available-stock').catch(() => null),
    ]);
    const holdings = (holdingsRes && holdingsRes.items) || [];
    const stock = (stockRes && stockRes.items) || [];

    // Gop danh sach san pham co the lap: san pham loi (mac dinh) + tui KTV + kho cua hang.
    const byId = new Map();
    const addOpt = (pid, code, name) => {
      pid = Number(pid) || 0;
      if (!pid || byId.has(pid)) return;
      byId.set(pid, { product_id: pid, code: code || '', name: name || ('SP #' + pid) });
    };
    if (item.product_id) addOpt(item.product_id, item.product_code, item.product_name || item.device_name);
    holdings.forEach((h) => addOpt(h.product_id, h.product_code, h.product_name));
    stock.forEach((p) => addOpt(p.product_id, p.code, p.name));
    const productList = Array.from(byId.values());

    const bagQtyOf = (pid) => {
      const h = holdings.find((x) => Number(x.product_id) === Number(pid));
      return h ? Number(h.qty) : 0;
    };
    const stockQtyOf = (pid) => {
      const s = stock.find((x) => Number(x.product_id) === Number(pid));
      return s ? Number(s.quantity) : 0;
    };

    const defaultPid = Number(item.product_id) || (productList[0] && productList[0].product_id) || 0;

    const productOptions = productList.length
      ? productList.map((p) => `<option value="${p.product_id}" ${p.product_id === defaultPid ? 'selected' : ''}>${esc(p.code)}${p.code ? ' · ' : ''}${esc(p.name)}</option>`).join('')
      : '<option value="0">- Chưa có sản phẩm -</option>';

    const html = `
      <div style="padding:14px">
        <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:10px">${esc(item.product_name || item.device_name || ('Item #' + item.id))}</div>
        <div class="field"><label>Sản phẩm cần lắp</label>
          <select id="wdProduct" class="select">${productOptions}</select>
        </div>
        <div class="field"><label>Số lượng</label><input id="wdQty" class="input" inputmode="numeric" value="1"></div>
        <div id="wdSourceInfo" style="margin:4px 0 10px;padding:9px 12px;border-radius:8px;font-size:12.5px"></div>
        <div class="field"><label>Ghi chú</label><textarea id="wdNote" rows="2" class="input" placeholder="Ghi chú khi lắp sản phẩm"></textarea></div>
      </div>`;

    const okPromise = openSimpleModal('Lắp sản phẩm bảo hành', html, 'Xác nhận lắp');

    const $product = document.getElementById('wdProduct');
    const $qty = document.getElementById('wdQty');
    const $info = document.getElementById('wdSourceInfo');
    const syncSourceInfo = () => {
      const pid = Number(($product || {}).value) || 0;
      const qty = Math.max(1, Number(String(($qty || {}).value || '1').replace(/[^\d]/g, '')) || 1);
      const bag = bagQtyOf(pid);
      const wh = stockQtyOf(pid);
      if (bag >= qty) {
        $info.style.background = '#eff6ff'; $info.style.color = '#1e40af';
        $info.innerHTML = `📦 Sẽ lấy từ <b>túi KTV</b> (còn ${fmt(bag)}). Không tạo phiếu xuất.`;
      } else if (wh >= qty) {
        $info.style.background = '#fff7ed'; $info.style.color = '#9a3412';
        $info.innerHTML = `🏬 Túi KTV không đủ — sẽ <b>xuất kho cửa hàng</b> (còn ${fmt(wh)}) và <b>tạo phiếu xuất</b>.`;
      } else {
        $info.style.background = '#fef2f2'; $info.style.color = '#b91c1c';
        $info.innerHTML = `⚠️ Cả túi KTV (${fmt(bag)}) lẫn kho cửa hàng (${fmt(wh)}) đều không đủ ${fmt(qty)}. Liên hệ kho để cấp thêm.`;
      }
    };
    if ($product) $product.addEventListener('change', syncSourceInfo);
    if ($qty) $qty.addEventListener('input', syncSourceInfo);
    syncSourceInfo();

    const ok = await okPromise;
    if (!ok) return;
    const productId = Number((document.getElementById('wdProduct') || {}).value) || 0;
    const qty = Math.max(1, Number(String((document.getElementById('wdQty') || {}).value || '1').replace(/[^\d]/g, '')) || 1);
    if (!productId) {
      ui.toast('Hãy chọn sản phẩm để lắp', 'warning');
      return;
    }
    // KHONG gui from_technician_bag -> backend tu dong chon nguon (tui KTV -> kho cua hang).
    const payload = {
      warranty_item_id: Number(item.id),
      replacement_product_id: productId,
      qty,
      note_text: ((document.getElementById('wdNote') || {}).value || '').trim() || null,
    };
    closeSimpleModal();
    const r = await api.post(`/kithuat/orders/${o.id}/warranty/deliver-device`, payload, { onError: 'toast' });
    if (r) {
      const receiptCode = r.receipt && r.receipt.code ? ` (phiếu xuất ${r.receipt.code})` : '';
      ui.toast('Đã lắp sản phẩm bảo hành cho khách' + receiptCode, 'success');
      openDetail(o.id);
      loadList();
    }
  }

  async function doTransition(stepCode) {
    const yes = await ui.confirm({ title: `Chuyển sang bước "${stepCode}"?`, okText: 'Chuyển' });
    if (!yes) return;
    const ok = await api.post(`/kithuat/orders/${state.detail.id}/transition`,
      { step_code: stepCode }, { onError: 'toast' });
    if (ok) {
      ui.toast('Đã chuyển', 'success');
      openDetail(state.detail.id);
      loadList();
    }
  }

  // (openTargetSelectDialog va openEndCustomerDialog da gop vao openAssetUpdateDialog)


  async function openCompleteDialog(targetStep) {
    const o = state.detail;
    const remain = Math.max(0, Number(o.total_amount) - Number(o.paid_amount));
    const fmtI = v => v === 0 ? '' : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const parseI = s => Number(String(s).replace(/\./g, '')) || 0;

    const html = `
      <div style="padding:16px">
        <div style="background:linear-gradient(135deg,#1e40af 0%,#2563eb 100%);border-radius:10px;padding:14px 16px;margin-bottom:16px;color:#fff">
          <div style="font-size:11px;opacity:.75;text-transform:uppercase;letter-spacing:.6px;margin-bottom:2px">Tổng còn phải thu</div>
          <div style="font-size:26px;font-weight:700;letter-spacing:-.5px">${fmt(remain)}đ</div>
        </div>

        <div class="field" style="margin-bottom:6px">
          <label style="font-weight:600;color:#374151;font-size:13px">KTV thu hộ (đ)</label>
          <input id="cCollected" type="text" inputmode="numeric" autocomplete="off" class="input"
                 placeholder="0"
                 value=""
                 style="font-size:20px;font-weight:700;text-align:right;padding-right:10px;letter-spacing:.3px;color:#0f172a">
        </div>
        <div style="display:flex;gap:6px;margin-bottom:12px">
          <button type="button" id="cBtnFull"
                  style="flex:1;padding:5px 0;border-radius:6px;border:1.5px solid #2563eb;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:600;cursor:pointer">
            Thu đủ
          </button>
          <button type="button" id="cBtnZero"
                  style="flex:1;padding:5px 0;border-radius:6px;border:1.5px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:12px;font-weight:600;cursor:pointer">
            Khách nợ hoặc Thu 1 phần
          </button>
        </div>

        <div id="cToStaffMRow" class="field" style="margin-bottom:12px">
          <label style="font-size:12px;color:#64748b">Hình thức KTV nhận</label>
          <select id="cToStaffM" class="select" style="font-size:13px">
            <option value="cash">Tiền mặt</option>
            <option value="transfer">Chuyển khoản qua KTV</option>
          </select>
        </div>

        <div class="field" style="margin-bottom:6px">
          <label style="font-weight:600;color:#374151;font-size:13px">Nộp cho admin (đ)</label>
          <input id="cToAdmin" type="text" inputmode="numeric" autocomplete="off" class="input"
                 placeholder="0"
                 value=""
                 style="font-size:20px;font-weight:700;text-align:right;padding-right:10px;letter-spacing:.3px;color:#0f172a">
        </div>

        <div id="cDebtRow" style="border-radius:8px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;color:#6b7280;flex:1">Khách còn nợ</span>
          <b id="cDebtVal" style="font-size:17px"></b>
        </div>

        <input id="cExpect" type="hidden" value="${remain}">
        <input id="cDebtHidden" type="hidden" value="${remain}">

        <div class="field" style="margin-top:12px"><label>Ghi chú KTV (không bắt buộc)</label>
          <textarea id="cNote" class="textarea" rows="2"></textarea>
        </div>

        <div class="field" style="margin-top:12px">
          <label style="font-weight:600;color:#374151;font-size:13px">Ảnh hoàn thành (không bắt buộc)</label>
          <label id="cPhotoBtn" style="display:flex;align-items:center;gap:8px;padding:10px 14px;border:1.5px dashed #cbd5e1;border-radius:8px;cursor:pointer;background:#f8fafc;color:#475569;font-size:13px;margin-top:6px">
            <span style="font-size:20px">📷</span>
            <span id="cPhotoBtnTxt">Chụp hoặc chọn ảnh</span>
            <input id="cPhotoInput" type="file" accept="image/*" multiple style="display:none">
          </label>
          <div id="cPhotoPreview" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"></div>
        </div>
      </div>
    `;
    const modalPromise = openSimpleModal('Hoàn thành đơn', html, 'Hoàn thành');

    const $inp = document.getElementById('cCollected');
    const $inpAdmin = document.getElementById('cToAdmin');
    const $toStaffMRow = document.getElementById('cToStaffMRow');
    const $debtRow = document.getElementById('cDebtRow');
    const $debtVal = document.getElementById('cDebtVal');
    const $debtHidden = document.getElementById('cDebtHidden');
    const $btnFull = document.getElementById('cBtnFull');
    const $btnZero = document.getElementById('cBtnZero');

    const photoFiles = [];
    const $photoInput = document.getElementById('cPhotoInput');
    const $photoPreview = document.getElementById('cPhotoPreview');
    const $photoBtnTxt = document.getElementById('cPhotoBtnTxt');

    function renderPhotoPreviews() {
      $photoPreview.innerHTML = '';
      photoFiles.forEach((f, idx) => {
        const url = URL.createObjectURL(f);
        const wrap = document.createElement('div');
        wrap.style.cssText = 'position:relative;width:72px;height:72px';
        wrap.innerHTML = `
          <img src="${url}" style="width:72px;height:72px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0">
          <button type="button" data-idx="${idx}" style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;border:none;background:#ef4444;color:#fff;font-size:11px;line-height:18px;text-align:center;cursor:pointer;padding:0">×</button>
        `;
        wrap.querySelector('button').addEventListener('click', () => {
          URL.revokeObjectURL(url);
          photoFiles.splice(idx, 1);
          renderPhotoPreviews();
          $photoBtnTxt.textContent = photoFiles.length ? `${photoFiles.length} ảnh đã chọn` : 'Chụp hoặc chọn ảnh';
        });
        $photoPreview.appendChild(wrap);
      });
    }

    $photoInput.addEventListener('change', () => {
      Array.from($photoInput.files).forEach(f => photoFiles.push(f));
      $photoInput.value = '';
      $photoBtnTxt.textContent = `${photoFiles.length} ảnh đã chọn`;
      renderPhotoPreviews();
    });

    function applyDebtStyle(debt) {
      if (debt <= 0) {
        $debtRow.style.background = '#f0fdf4';
        $debtVal.style.color = '#16a34a';
        $debtVal.textContent = 'Thanh toán đủ ✓';
      } else {
        $debtRow.style.background = '#fef2f2';
        $debtVal.style.color = '#dc2626';
        $debtVal.textContent = fmt(debt) + 'đ';
      }
      $debtHidden.value = Math.max(0, debt);
    }

    function recalc() {
      const collected = parseI($inp.value);
      const toAdmin = parseI($inpAdmin.value);
      const debt = Math.max(0, remain - collected - toAdmin);
      applyDebtStyle(debt);
      const isFull = (collected + toAdmin) >= remain;
      $btnFull.style.background = isFull ? '#2563eb' : '#eff6ff';
      $btnFull.style.color = isFull ? '#fff' : '#1d4ed8';
      $btnZero.style.background = collected === 0 ? '#64748b' : '#f8fafc';
      $btnZero.style.color = collected === 0 ? '#fff' : '#64748b';
      $toStaffMRow.style.display = collected > 0 ? '' : 'none';
    }

    function bindNumericInput(el) {
      el.addEventListener('input', () => {
        const raw = el.value.replace(/\./g, '').replace(/\D/g, '');
        const num = Number(raw) || 0;
        const pos = el.selectionStart;
        const oldLen = el.value.length;
        el.value = fmtI(num) || '';
        const newLen = el.value.length;
        el.setSelectionRange(pos + newLen - oldLen, pos + newLen - oldLen);
        recalc();
      });
    }

    bindNumericInput($inp);
    bindNumericInput($inpAdmin);

    $btnFull.addEventListener('click', () => { $inp.value = fmtI(remain); $inpAdmin.value = ''; recalc(); });
    $btnZero.addEventListener('click', () => { $inp.value = ''; $inpAdmin.value = ''; recalc(); });

    recalc();

    const ok = await modalPromise;
    if (!ok) return;
    const collected = parseI(document.getElementById('cCollected').value);
    const toAdmin = parseI(document.getElementById('cToAdmin').value);
    const pendingPhotos = [...photoFiles];
    const body = {
      target_step_code: targetStep,
      expected_amount: Number(document.getElementById('cExpect').value) || 0,
      to_staff_amount: collected,
      to_staff_method: collected > 0 ? document.getElementById('cToStaffM').value : 'cash',
      to_admin_amount: toAdmin,
      debt_amount: Number(document.getElementById('cDebtHidden').value) || 0,
      note: document.getElementById('cNote').value.trim() || null,
    };
    closeSimpleModal();
    const r = await api.patch(`/kithuat/orders/${state.detail.id}/complete`, body, { onError: 'toast' });
    if (r) {
      ui.toast('Đã hoàn thành', 'success');
      const snap = { ...state.detail };

      if (pendingPhotos.length) {
        ui.toast(`Đang tải ${pendingPhotos.length} ảnh lên...`, 'info');
        let uploaded = 0;
        for (const file of pendingPhotos) {
          try {
            const url = await imgbb.upload(file, { name: `order-${snap.id}-done` });
            await api.post(`/kithuat/orders/${snap.id}/photos`, { step_code: 'done', url }, { onError: 'silent' });
            uploaded++;
          } catch (_) { }
        }
        if (uploaded) ui.toast(`Đã lưu ${uploaded} ảnh`, 'success');
      }

      openDetail(snap.id);
      loadList();
      // Sau khi xong don -> mo dialog cap nhat thong tin (co section khach dau cuoi neu la dai ly)
      setTimeout(() => openAssetUpdateDialog(snap.customer_id, snap.id), 300);
    }
  }

  // ============================================================
  // CUSTOMER ASSET UPDATE — 1 form gop: cu + moi, gui 1 lan
  // KTV sua truc tiep o tung dong, them dong moi tuy y, bam Gui de xuat
  // -> FE diff voi snapshot ban dau roi gui nhieu /asset-requests song song.
  // ============================================================
  const AU_KINDS = [
    { kind: 'account', label: 'Tài khoản', valCol: 'account_name', listKey: 'accounts', placeholder: 'Tên tài khoản mới', icon: '👤' },
    { kind: 'vehicle', label: 'Biển số xe', valCol: 'plate', listKey: 'vehicles', placeholder: 'VD: 51A-12345', icon: '🚗' },
    { kind: 'sim', label: 'Số SIM', valCol: 'sim_number', listKey: 'sims', placeholder: 'Số SIM thiết bị', icon: '📱' },
  ];

  async function openAssetUpdateDialog(customerId, orderId) {
    if (!customerId) return;
    const r = await api.get(`/kithuat/customers/${customerId}/assets`).catch(() => null);
    if (!r) return;

    // --- Lay goi y tu field_values cua don hien tai -----------
    const normalize = s => (s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    const suggestions = { account: [], vehicle: [], sim: [] };
    if (state.detail && state.detail.lines) {
      const allFV = state.detail.lines.flatMap(l => (l.items || []).flatMap(i => i.field_values || []));
      for (const fv of allFV) {
        const lbl = normalize(fv.label);
        const val = (fv.value || '').trim();
        if (!val) continue;
        if (lbl.includes('bien so') || lbl.includes('bsx')) suggestions.vehicle.push(val);
        else if (lbl.includes('tai khoan') || lbl.includes('ten tk')) suggestions.account.push(val);
        else if (lbl.includes('sim')) suggestions.sim.push(val);
      }
    }
    // Bo cac gia tri da ton tai trong customer assets
    const existingVals = {
      account: (r.accounts || []).map(a => normalize(a.account_name)),
      vehicle: (r.vehicles || []).map(v => normalize(v.plate)),
      sim: (r.sims || []).map(s => normalize(s.sim_number)),
    };
    for (const kind of ['account', 'vehicle', 'sim']) {
      suggestions[kind] = [...new Set(
        suggestions[kind].filter(v => !existingVals[kind].includes(normalize(v)))
      )];
    }

    // --- Snapshot gia tri goc de diff khi submit --------------
    const original = {};
    const sectionsHtml = AU_KINDS.map(cfg => {
      const list = r[cfg.listKey] || [];
      const rowsHtml = list.map(it => {
        const key = `${cfg.kind}:${it.id}`;
        original[key] = it[cfg.valCol];
        const pendingMod = (r.pending_requests || []).find(p =>
          p.asset_kind === cfg.kind && p.target_id === it.id);
        return `<div class="af-row au-row${pendingMod ? ' is-pending' : ''}" data-kind="${cfg.kind}" data-id="${it.id}">
          <input class="input au-val" value="${esc(it[cfg.valCol])}" ${pendingMod ? 'disabled' : ''}>
          ${pendingMod
            ? `<span class="af-pending-tag">⏳ chờ duyệt</span>`
            : `<label class="af-del-toggle"><input type="checkbox" class="au-del"> Xoá</label>`}
        </div>`;
      }).join('') || (suggestions[cfg.kind].length === 0
        ? `<div class="af-empty">Chưa có ${esc(cfg.label.toLowerCase())} nào</div>`
        : '');

      // Pre-fill cac gia tri goi y tu don hang
      const suggRows = suggestions[cfg.kind].map(v =>
        `<div class="af-new-row af-suggested-row">
          <input class="input au-new-val" value="${esc(v)}">
          <span class="af-suggest-badge">từ đơn</span>
          <button type="button" class="af-new-del" title="Bỏ dòng">×</button>
        </div>`
      ).join('');

      return `<div class="af-section af-section--${cfg.kind}">
        <h4>
          <span class="af-icon">${cfg.icon}</span>
          <span>${esc(cfg.label)}</span>
          <span class="af-count">${list.length}</span>
        </h4>
        ${rowsHtml}
        <div class="af-new-wrap" data-au-new="${cfg.kind}">
          ${suggRows}
          <div class="af-new-row">
            <input class="input au-new-val" placeholder="${esc(cfg.placeholder)}">
            <button type="button" class="af-add-row" data-au-add-row="${cfg.kind}">+ Thêm</button>
          </div>
        </div>
      </div>`;
    }).join('');

    const hasSugg = Object.values(suggestions).some(a => a.length > 0);
    const hint = hasSugg
      ? `Sửa trực tiếp ô cũ, tích <b style="color:#dc2626">Xoá</b> để bỏ. Các dòng <span class="af-suggest-badge">từ đơn</span> được điền tự động — kiểm tra rồi bấm <b>Gửi đề xuất</b>.`
      : `Sửa trực tiếp ô cũ, tích <b style="color:#dc2626">Xoá</b> để bỏ, hoặc nhập dòng mới. Bấm <b>Gửi đề xuất</b> để gửi tất cả cho admin duyệt.`;

    // Section khach dau cuoi — chi hien khi don la dealer
    const isDealer = state.detail && state.detail.customer_type === 'dealer';
    const ecSection = isDealer ? `
      <div id="ecWrap" style="margin-top:14px;padding:12px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px">
        <div style="font-size:12px;font-weight:700;color:#0369a1;margin-bottom:8px">👤 Kháchcủa đại lý - nhập để thêm thông tin khách  (tuỳ chọn)</div>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <button class="btn sm" id="ecModeCreate" style="flex:1">✨ Tạo mới</button>
          <button class="btn ghost sm" id="ecModeSearch" style="flex:1">🔍 Chọn có sẵn</button>
          <button class="btn ghost sm" id="ecModeSkip" style="flex:1;color:#64748b">Bỏ qua</button>
        </div>
        <div id="ecCreatePane">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <input id="ecName" class="input" placeholder="Họ tên *" style="font-size:13px">
            <input id="ecPhone" class="input" placeholder="Số điện thoại" style="font-size:13px">
          </div>
          <input id="ecAddr" class="input" placeholder="Địa chỉ (tuỳ chọn)" style="font-size:13px;margin-top:6px">
        </div>
        <div id="ecSearchPane" style="display:none">
          <input id="ecSearchQ" class="input" placeholder="Tìm theo tên / SĐT / mã…" style="font-size:13px">
          <div id="ecSearchRes" style="max-height:150px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:6px;margin-top:6px"></div>
          <div id="ecSearchSel" style="display:none;margin-top:6px;font-size:13px;color:#0369a1"></div>
        </div>
        <div id="ecSkipPane" style="display:none;font-size:13px;color:#64748b;padding:6px 0">Không gán khách đầu cuối cho đơn này.</div>
      </div>` : '';

    const html = `
      <div class="asset-form" data-au-customer="${customerId}" data-au-order="${orderId || ''}">
        <p class="af-hint">${hint}</p>
        ${sectionsHtml}
        ${ecSection}
      </div>
    `;

    const okPromise = openSimpleModal('Cập nhật thông tin khách', html, 'Gửi đề xuất');

    // Wire khach dau cuoi (neu la dealer)
    let ecMode = 'create'; // 'create' | 'search' | 'skip'
    let ecSelectedId = null;
    let ecSearchTimer = null;
    const $ecCreate = document.getElementById('ecCreatePane');
    const $ecSearch = document.getElementById('ecSearchPane');
    const $ecSkip = document.getElementById('ecSkipPane');
    function switchEcMode(m) {
      ecMode = m;
      if ($ecCreate) $ecCreate.style.display = m === 'create' ? '' : 'none';
      if ($ecSearch) $ecSearch.style.display = m === 'search' ? '' : 'none';
      if ($ecSkip) $ecSkip.style.display = m === 'skip' ? '' : 'none';
      ['ecModeCreate', 'ecModeSearch', 'ecModeSkip'].forEach(id => {
        const b = document.getElementById(id);
        if (b) b.className = (id === 'ecMode' + m.charAt(0).toUpperCase() + m.slice(1)) ? 'btn sm' : 'btn ghost sm';
      });
    }
    if (document.getElementById('ecModeCreate')) {
      document.getElementById('ecModeCreate').addEventListener('click', () => switchEcMode('create'));
      document.getElementById('ecModeSearch').addEventListener('click', () => switchEcMode('search'));
      document.getElementById('ecModeSkip').addEventListener('click', () => switchEcMode('skip'));
      const $sq = document.getElementById('ecSearchQ');
      const $sr = document.getElementById('ecSearchRes');
      const $ss = document.getElementById('ecSearchSel');
      $sq && $sq.addEventListener('input', () => {
        clearTimeout(ecSearchTimer);
        ecSearchTimer = setTimeout(async () => {
          const q = $sq.value.trim();
          const res = await api.get('/kithuat/orders/customers/search' + (q ? `?q=${encodeURIComponent(q)}` : '')).catch(() => null);
          if (!res) return;
          $sr.innerHTML = res.items.length
            ? res.items.map(c => `<div class="ec-r" data-id="${c.id}" style="padding:7px 10px;cursor:pointer;font-size:13px;border-bottom:1px solid #f1f5f9"><b>${esc(c.full_name)}</b>${c.phone ? ` · ${esc(c.phone)}` : ''} <span style="color:#94a3b8;font-size:11px">(${esc(c.code)})</span></div>`).join('')
            : '<div style="padding:8px;font-size:13px;color:#94a3b8">Không tìm thấy</div>';
          $sr.querySelectorAll('.ec-r').forEach(el => {
            el.addEventListener('mouseenter', () => el.style.background = '#f0f9ff');
            el.addEventListener('mouseleave', () => el.style.background = '');
            el.addEventListener('click', () => {
              ecSelectedId = Number(el.dataset.id);
              const found = res.items.find(c => c.id === ecSelectedId);
              if ($ss) { $ss.style.display = ''; $ss.innerHTML = `✅ <b>${esc(found.full_name)}</b>${found.phone ? ` · ${esc(found.phone)}` : ''}`; }
              $sr.innerHTML = '';
            });
          });
        }, 300);
      });
    }

    // Wire nut "+ Them dong"
    document.querySelectorAll('#simpleModal [data-au-add-row]').forEach(btn => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.auAddRow;
        const cfg = AU_KINDS.find(k => k.kind === kind);
        const wrap = document.querySelector(`#simpleModal [data-au-new="${kind}"]`);
        if (!wrap || !cfg) return;
        const div = document.createElement('div');
        div.className = 'af-new-row';
        div.innerHTML = `<input class="input au-new-val" placeholder="${esc(cfg.placeholder)}">
          <button type="button" class="af-new-del" title="Bỏ dòng">×</button>`;
        wrap.insertBefore(div, btn.closest('.af-new-row'));
        div.querySelector('.af-new-del').addEventListener('click', () => div.remove());
        div.querySelector('input').focus();
      });
    });
    // Wire nut xoa dong goi y (da render san trong HTML)
    document.querySelectorAll('#simpleModal .af-new-del').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.af-new-row').remove());
    });
    // Toggle strikethrough khi tich Xoa
    document.querySelectorAll('#simpleModal .au-row .au-del').forEach(cb => {
      cb.addEventListener('change', () => {
        cb.closest('.au-row').classList.toggle('is-deleted', cb.checked);
      });
    });

    const ok = await okPromise;
    if (!ok) return false;

    // ---- Xu ly khach dau cuoi (neu la dealer) ----------------
    let endCustomerId = null; // luu lai de mo dialog sau
    if (isDealer && ecMode !== 'skip') {
      let ecBody = null;
      if (ecMode === 'create') {
        const name = (document.getElementById('ecName')?.value || '').trim();
        if (name) {
          ecBody = {
            action: 'create',
            full_name: name,
            phone: document.getElementById('ecPhone')?.value.trim() || null,
            address: document.getElementById('ecAddr')?.value.trim() || null,
          };
        }
      } else if (ecMode === 'search' && ecSelectedId) {
        ecBody = { action: 'link', customer_id: ecSelectedId };
      }
      if (ecBody) {
        const ecRes = await api.patch(`/kithuat/orders/${orderId}/end-customer`, ecBody, { onError: 'toast' });
        if (ecRes && ecRes.end_customer_id) {
          endCustomerId = ecRes.end_customer_id;
          // Cap nhat state.detail de detail view hien dung
          if (state.detail) {
            state.detail.end_customer_id = ecRes.end_customer_id;
            if (ecRes.end_customer) {
              state.detail.end_customer_name = ecRes.end_customer.full_name;
              state.detail.end_customer_phone = ecRes.end_customer.phone;
              state.detail.end_customer_code = ecRes.end_customer.code;
            }
          }
        }
      }
    }

    // ---- Diff & build danh sach thay doi (tai san cua Dai ly) ----
    const reqs = [];
    document.querySelectorAll('#simpleModal .au-row').forEach(row => {
      const kind = row.dataset.kind;
      const id = Number(row.dataset.id);
      const inp = row.querySelector('.au-val');
      const del = row.querySelector('.au-del');
      if (!inp || inp.disabled) return;
      const newVal = (inp.value || '').trim();
      const oldVal = original[`${kind}:${id}`] || '';
      if (del && del.checked) {
        reqs.push({ asset_kind: kind, action: 'delete', target_id: id });
      } else if (newVal && newVal !== oldVal) {
        reqs.push({ asset_kind: kind, action: 'update', target_id: id, value: newVal });
      }
    });
    AU_KINDS.forEach(cfg => {
      document.querySelectorAll(`#simpleModal [data-au-new="${cfg.kind}"] .au-new-val`).forEach(inp => {
        const v = (inp.value || '').trim();
        if (v) reqs.push({ asset_kind: cfg.kind, action: 'add', value: v });
      });
    });

    closeSimpleModal();

    // Gui batch tai san cho Dai ly
    if (reqs.length) {
      const result = await api.post(
        `/kithuat/customers/${customerId}/asset-requests/batch`,
        { changes: reqs, ref_order_id: orderId || null },
        { onError: 'toast' }
      );
      if (result) ui.toast(`Đã gửi ${result.inserted} đề xuất cho đại lý`, 'success');
    }

    // Neu co khach dau cuoi -> mo tiep dialog cap nhat TAI SAN cua khach do
    if (endCustomerId) {
      setTimeout(() => {
        ui.toast('Bây giờ cập nhật thông tin tài sản cho khách đầu cuối…', 'info');
        openAssetUpdateDialog(endCustomerId, orderId);
      }, 400);
    }

    return true;
  }

  function uploadStepPhoto() {
    const o = state.detail;
    if (!o) return;
    // Mo file picker truc tiep, khong can dialog trung gian
    let inp = document.getElementById('_photoFilePicker');
    if (!inp) {
      inp = document.createElement('input');
      inp.type = 'file';
      inp.id = '_photoFilePicker';
      inp.accept = 'image/*';
      inp.style.display = 'none';
      document.body.appendChild(inp);
    }
    inp.value = '';
    inp.onchange = async () => {
      const file = inp.files[0];
      if (!file) return;
      ui.toast('Đang tải ảnh lên…');
      let url;
      try {
        url = await imgbb.upload(file);
      } catch (e) {
        ui.toast('Upload ảnh thất bại', 'error');
        return;
      }
      const stepCode = String(o.status || 'in_progress').trim();
      const r = await api.post(
        `/kithuat/orders/${o.id}/photos`,
        { step_code: stepCode, url },
        { onError: 'toast' }
      );
      if (r) { ui.toast('Đã thêm ảnh', 'success'); openDetail(o.id); }
    };
    inp.click();
  }

  // ---- SIMPLE MODAL OVERLAY -----------------------------------
  function openSimpleModal(title, html, okText) {
    return new Promise(resolve => {
      let div = document.getElementById('simpleModal');
      if (div) div.remove();
      div = document.createElement('div');
      div.id = 'simpleModal';
      div.className = 'modal-bg open';
      div.style.zIndex = '300';
      div.innerHTML = `
        <div class="modal" style="max-width:520px">
          <div class="modal-head">
            <h3>${esc(title)}</h3>
            <button type="button" class="modal-close" id="smClose">×</button>
          </div>
          <div class="modal-body">${html}</div>
          <div class="modal-foot">
            <button type="button" class="btn ghost" id="smCancel">Huỷ</button>
            <button type="button" class="btn" id="smOk">${esc(okText || 'OK')}</button>
          </div>
        </div>`;
      document.body.appendChild(div);
      div.querySelector('#smClose').addEventListener('click', () => { div.remove(); resolve(false); });
      div.querySelector('#smCancel').addEventListener('click', () => { div.remove(); resolve(false); });
      div.querySelector('#smOk').addEventListener('click', () => resolve(true));
    });
  }
  function closeSimpleModal() { const d = document.getElementById('simpleModal'); if (d) d.remove(); }

  function openHashOrderIfAny() {
    const m = location.hash.match(/order-(\d+)/);
    if (m) openDetail(Number(m[1]));
  }

  // ---- BOOT ---------------------------------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    techShell.init('tasks');

    const $btnHelpOrder = document.getElementById('btnHelpOrder');
    if ($btnHelpOrder) {
      $btnHelpOrder.addEventListener('click', () => {
        ui.confirm({
          title: 'Hướng dẫn thao tác đơn hàng & bảo hành',
          body: `
            <div style="font-family:system-ui, -apple-system, sans-serif; font-size:13.5px; line-height:1.6; color:#334155; max-height:420px; overflow-y:auto; padding-right:8px">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:14px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:10px 12px; color:#1e40af">
                <span style="font-size:20px">💡</span>
                <span><b>Hướng dẫn quy trình & phân quyền xử lý Đơn hàng bảo hành VinaGPS</b></span>
              </div>
              
              <div style="margin-bottom:14px">
                <h4 style="margin:0 0 6px 0; color:#1e293b; font-size:14px; display:flex; align-items:center; gap:6px">📌 1. Quy trình trạng thái Đơn hàng</h4>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px">
                  <div style="font-size:12.5px; font-weight:600; color:#475569; margin-bottom:6px">
                    Tiếp nhận ➔ Đang xử lý (Giao KTV) ➔ Hoàn thành / Đã giao khách
                  </div>
                  <p style="margin:0; font-size:12px; color:#64748b">
                    • <b>Đơn bảo hành &le; 0đ:</b> Khi hoàn thành, hệ thống tự động đánh dấu đã trả tiền.<br>
                    • <b>Hoàn thành đơn:</b> Admin/Nhân viên/KTV sử dụng thanh tiến trình (stepper) trên đầu đơn để cập nhật trạng thái chung.
                  </p>
                </div>
              </div>

              <div style="margin-bottom:14px">
                <h4 style="margin:0 0 6px 0; color:#1e293b; font-size:14px; display:flex; align-items:center; gap:6px">⚙ 2. Các hành động xử lý thiết bị bảo hành</h4>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; font-size:12.5px">
                  <table style="width:100%; border-collapse:collapse">
                    <thead>
                      <tr style="border-bottom:1px solid #cbd5e1; text-align:left; color:#475569">
                        <th style="padding:4px 0">Hành động</th>
                        <th style="padding:4px 0">Ý nghĩa & Hướng dẫn thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style="border-bottom:1px dashed #e2e8f0">
                        <td style="padding:6px 0; font-weight:600; color:#2563eb">Mới tiếp nhận</td>
                        <td style="padding:6px 0; color:#475569">Nhận sản phẩm lỗi ban đầu từ khách hàng.</td>
                      </tr>
                      <tr style="border-bottom:1px dashed #e2e8f0">
                        <td style="padding:6px 0; font-weight:600; color:#2563eb">Thu hồi về kho</td>
                        <td style="padding:6px 0; color:#475569">Đối với Admin/Nhân viên: Thu hồi thẳng về kho công ty. Đối với KTV: Thu hồi vào túi đồ kỹ thuật cá nhân.</td>
                      </tr>
                      <tr style="border-bottom:1px dashed #e2e8f0">
                        <td style="padding:6px 0; font-weight:600; color:#16a34a">Cấp hàng đổi mới</td>
                        <td style="padding:6px 0; color:#475569">Lắp/giao sản phẩm thay thế từ kho công ty hoặc túi KTV. Cho phép chọn nhiều sản phẩm, số lượng, yêu cầu tải ảnh & xác nhận qua Dialog.</td>
                      </tr>
                      <tr style="border-bottom:1px dashed #e2e8f0">
                        <td style="padding:6px 0; font-weight:600; color:#b45309">Gửi NCC / Sửa chữa</td>
                        <td style="padding:6px 0; color:#475569">Chuyển đồ bảo hành sang nhà cung cấp hoặc tiến hành khắc phục kỹ thuật trực tiếp.</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0; font-weight:600; color:#0f172a">Giao lại khách</td>
                        <td style="padding:6px 0; color:#475569">Hoàn tất quy trình trả thiết bị bảo hành đã khắc phục hoặc đã đổi mới cho khách hàng.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 style="margin:0 0 6px 0; color:#1e293b; font-size:14px; display:flex; align-items:center; gap:6px">👥 3. Phân quyền và Vai trò (Role)</h4>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; font-size:12.5px; color:#475569">
                  • <b>Admin / Nhân viên:</b> Có đầy đủ tất cả các quyền của KTV. Khi thu hồi sản phẩm lỗi từ khách, sản phẩm lỗi sẽ được chuyển thẳng về kho tổng của công ty để tối ưu hóa quản lý hàng tồn.<br>
                  • <b>Kỹ thuật viên (KTV):</b> Chỉ xử lý các thiết bị được phân công trong đơn hàng, quản lý và cấp hàng thông qua túi đồ KTV cá nhân.
                </div>
              </div>
            </div>
          `,
          okText: 'Đã hiểu',
          cancelText: 'Đóng'
        });
      });
    }

    document.querySelectorAll('#quickTabs button').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#quickTabs button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        state.bucket = b.dataset.bucket;
        loadList();
      });
    });
    $('modalClose').addEventListener('click', closeDetail);
    $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeDetail(); });
    await loadList();
    openHashOrderIfAny();
    window.addEventListener('hashchange', openHashOrderIfAny);
  });
})();
