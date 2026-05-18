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

  let state = { bucket: 'active', items: [], detail: null };

  const STATUS_LABELS = {
    pending: 'Đang chờ',
    confirmed: 'Lên đơn',
    in_progress: 'Đang xử lý',
    done: 'Đã xong',
    cancelled: 'Đã huỷ',
  };
  function pillForStatus(o) {
    const label = STATUS_LABELS[o.status] || o.status;
    if (o.status === 'pending') return { cls: 'amber', label };
    if (o.status === 'cancelled') return { cls: 'gray', label };
    if (o.status === 'done') return { cls: 'green', label };
    if (o.status === 'in_progress') return { cls: 'blue', label };
    return { cls: 'purple', label };
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
            <div><b>${esc(o.code)}</b> · ${esc(o.template_names || o.template_name || '')}</div>
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
    const res = await api.get('/kithuat/orders/' + id).catch(() => null);
    if (!res) { $('odBody').innerHTML = '<p style="color:#dc2626">Không tải được</p>'; return; }
    state.detail = res;
    renderDetail();
  }

  function closeDetail() {
    $('modal').classList.remove('open');
    state.detail = null;
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

    // KTV duoc chuyen confirmed→in_progress, in_progress→done, confirmed→done
    const targets = [];
    if (o.status === 'confirmed') targets.push({ code: 'in_progress', label: 'Bắt đầu làm' }, { code: 'done', label: 'Hoàn thành', terminal: true });
    else if (o.status === 'in_progress') targets.push({ code: 'done', label: 'Hoàn thành', terminal: true });

    const action = cancelled
      ? `<div style="margin-top:8px;color:#dc2626;text-align:center">Đơn đã huỷ</div>`
      : (o.status === 'done'
        ? `<div style="margin-top:8px;color:#16a34a;text-align:center">Đã hoàn thành</div>`
        : (targets.length
          ? `<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
                  ${targets.map(t => `<button class="btn sm btn-jump" data-step="${esc(t.code)}" data-terminal="${t.terminal ? 1 : 0}" style="${t.terminal ? 'background:#16a34a' : ''}">${esc(t.label)}</button>`).join('')}
                </div>` : ''));
    return stepsHtml + action;
  }

  function renderDetail() {
    const o = state.detail;
    const lines = o.lines || [];
    const tplNames = lines.map(l => l.template_name).filter(Boolean).join(' + ');
    $('modalTitle').textContent = `${o.code} — ${tplNames || ''}`;
    const sCls = pillForStatus(o);
    const remain = Math.max(0, Number(o.total_amount) - Number(o.paid_amount));

    // Render moi line: items co field_values rieng
    const linesHtml = lines.length ? lines.map((ln, idx) => {
      const itemsHtml = (ln.items || []).length ? (ln.items || []).map(i => {
        const existingFvs = i.field_values || [];
        // Luon hien du 4 truong mac dinh, ghep voi gia tri da co trong DB
        const usedIds = new Set();
        const defaultRows = DEFAULT_ITEM_FIELDS.map(lbl => {
          const found = existingFvs.find(f => f.label === lbl);
          if (found) usedIds.add(found.id);
          return found || { id: 0, label: lbl, value: '' };
        });
        const extraRows = existingFvs.filter(f => !usedIds.has(f.id));
        const effectiveFvs = [...defaultRows, ...extraRows];
        const fvRows = effectiveFvs.map(f =>
          `<div style="display:flex;gap:6px;padding:3px 0;font-size:13px;align-items:center">
            <label style="flex:0 0 130px;font-size:12px;color:#475569;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
                   title="${esc(f.label)}">${esc(f.label)}</label>
            <input class="fv-input" data-fv-id="${f.id || 0}" data-item-id="${i.id}" data-line-id="${ln.id}" value="${esc(f.value || '')}"
              placeholder="Nhập giá trị…"
              style="flex:1;border:1px solid #cbd5e1;border-radius:6px;padding:4px 8px;font-size:13px;background:#fff;min-width:0">
            ${f.id ? `<button class="btn-del-fv" data-fv-id="${f.id}" data-order-id="${o.id}"
              style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:15px;padding:0 4px;line-height:1" title="Xoá">×</button>`
            : `<span style="width:24px;display:inline-block"></span>`}
          </div>`).join('');
        return `<div class="item-fv-block" style="border:1px solid #e2e8f0;border-radius:7px;padding:8px 10px;margin-bottom:6px;background:#fff">
          <div style="font-size:13px;font-weight:600;margin-bottom:6px">
            📦 ${esc(i.product_name || ('SP #' + i.product_id))}
            <small style="color:#94a3b8;font-weight:400"> x${i.qty}</small>
          </div>
          <div class="fv-list" data-item-id="${i.id}" data-line-id="${ln.id}">
            ${fvRows}
            <div style="display:flex;gap:6px;margin-top:6px;align-items:center;padding-top:6px;border-top:1px dashed #e2e8f0">
              <input class="fv-new-label" data-item-id="${i.id}" placeholder="Tên trường"
                style="flex:0 0 120px;border:1px solid #94a3b8;border-radius:6px;padding:4px 8px;font-size:12px;min-width:0">
              <input class="fv-new-value" data-item-id="${i.id}" placeholder="Giá trị"
                style="flex:1;border:1px solid #94a3b8;border-radius:6px;padding:4px 8px;font-size:12px;min-width:0">
              <button class="btn ghost sm btn-add-fv" data-item-id="${i.id}" data-line-id="${ln.id}" data-order-id="${o.id}"
                style="white-space:nowrap;font-size:11px">+ Thêm</button>
            </div>
            <div style="text-align:right;margin-top:4px">
              <button class="btn ghost sm btn-save-fv" data-item-id="${i.id}" data-line-id="${ln.id}" style="font-size:11px">💾 Lưu</button>
            </div>
          </div>
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

    const photosHtml = (o.step_photos || []).length
      ? `<div class="photos">${o.step_photos.map(p =>
        `<a href="${esc(p.url)}" target="_blank" title="${esc(p.step_code)}"><img src="${esc(p.url)}"></a>`
      ).join('')}</div>`
      : '<p class="text-muted">Chưa có ảnh</p>';

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
          <label style="font-size:13px;color:#334155;font-weight:600;display:block;margin-bottom:4px">Thực tế hiện tại</label>
          <textarea id="progressNote" class="textarea" rows="2" placeholder="Ví dụ: Đang trên đường đến khách">${esc(o.progress_note || '')}</textarea>
          <div style="margin-top:6px;text-align:right">
            <button class="btn ghost sm" id="btnSaveProgressNote">💾 Lưu</button>
          </div>
        </div>
      </div>

      <div class="od-section">
        <h4>Dòng công việc</h4>
        ${linesHtml}
      </div>

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
    if ($('btnSaveProgressNote')) {
      $('btnSaveProgressNote').addEventListener('click', async () => {
        const v = $('progressNote').value;
        const r = await api.patch(`/kithuat/orders/${o.id}/progress-note`,
          { progress_note: v }, { onError: 'toast' });
        if (r) { ui.toast('Đã lưu', 'success'); state.detail.progress_note = v; }
      });
    }
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
          <label style="font-weight:600;color:#374151;font-size:13px">Số tiền thu hộ (đ)</label>
          <input id="cCollected" type="text" inputmode="numeric" autocomplete="off" class="input"
                 placeholder="0"
                 value="${fmtI(remain)}"
                 style="font-size:20px;font-weight:700;text-align:right;padding-right:10px;letter-spacing:.3px;color:#0f172a">
        </div>
        <div style="display:flex;gap:6px;margin-bottom:14px">
          <button type="button" id="cBtnFull"
                  style="flex:1;padding:5px 0;border-radius:6px;border:1.5px solid #2563eb;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:600;cursor:pointer">
            Thu đủ
          </button>
          <button type="button" id="cBtnZero"
                  style="flex:1;padding:5px 0;border-radius:6px;border:1.5px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:12px;font-weight:600;cursor:pointer">
            Chưa thu
          </button>
        </div>

        <div id="cDebtRow" style="border-radius:8px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;color:#6b7280;flex:1">Khách còn nợ</span>
          <b id="cDebtVal" style="font-size:17px"></b>
        </div>

        <div class="field" style="margin-bottom:0">
          <label style="font-size:12px;color:#64748b">Hình thức nhận</label>
          <select id="cToStaffM" class="select" style="font-size:13px">
            <option value="cash">Tiền mặt</option>
            <option value="transfer">Chuyển khoản qua KTV</option>
          </select>
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
      const debt = remain - collected;
      applyDebtStyle(debt);
      const isFull = collected >= remain;
      $btnFull.style.background = isFull ? '#2563eb' : '#eff6ff';
      $btnFull.style.color = isFull ? '#fff' : '#1d4ed8';
      $btnZero.style.background = collected === 0 ? '#64748b' : '#f8fafc';
      $btnZero.style.color = collected === 0 ? '#fff' : '#64748b';
    }

    $inp.addEventListener('input', () => {
      const raw = $inp.value.replace(/\./g, '').replace(/\D/g, '');
      const num = Number(raw) || 0;
      const pos = $inp.selectionStart;
      const oldLen = $inp.value.length;
      $inp.value = fmtI(num) || '';
      const newLen = $inp.value.length;
      $inp.setSelectionRange(pos + newLen - oldLen, pos + newLen - oldLen);
      recalc();
    });

    $btnFull.addEventListener('click', () => { $inp.value = fmtI(remain); recalc(); });
    $btnZero.addEventListener('click', () => { $inp.value = ''; recalc(); });

    recalc();

    const ok = await modalPromise;
    if (!ok) return;
    const collected = parseI(document.getElementById('cCollected').value);
    const pendingPhotos = [...photoFiles];
    const body = {
      target_step_code: targetStep,
      expected_amount: Number(document.getElementById('cExpect').value) || 0,
      to_staff_amount: collected,
      to_staff_method: document.getElementById('cToStaffM').value,
      to_admin_amount: 0,
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
          } catch (_) {}
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

  // ---- BOOT ---------------------------------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    techShell.init('tasks');
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
  });
})();
