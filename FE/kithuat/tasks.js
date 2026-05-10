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

  let state = { bucket: 'active', items: [], detail: null };

  const STATUS_LABELS = {
    pending:     'Đang chờ',
    confirmed:   'Lên đơn',
    in_progress: 'Đang xử lý',
    done:        'Đã xong',
    cancelled:   'Đã huỷ',
  };
  function pillForStatus(o) {
    const label = STATUS_LABELS[o.status] || o.status;
    if (o.status === 'pending')     return { cls: 'amber', label };
    if (o.status === 'cancelled')   return { cls: 'gray',  label };
    if (o.status === 'done')        return { cls: 'green', label };
    if (o.status === 'in_progress') return { cls: 'blue',  label };
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
      { code: 'pending',     label: 'Đang chờ' },
      { code: 'confirmed',   label: 'Lên đơn' },
      { code: 'in_progress', label: 'Đang xử lý' },
      { code: 'done',        label: 'Đã xong' },
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
    if (o.status === 'confirmed')       targets.push({ code: 'in_progress', label: 'Bắt đầu làm' }, { code: 'done', label: 'Hoàn thành', terminal: true });
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

    // Render moi line: fields + items
    const linesHtml = lines.length ? lines.map((ln, idx) => {
      const fvs = (ln.field_values || []).length
        ? ln.field_values.map(f => `<div style="display:flex;gap:8px;padding:3px 0;font-size:13px">
            <span style="flex:1;color:#64748b">${esc(f.label)}</span>
            <span style="flex:2">${esc(f.value || '—')}</span>
          </div>`).join('') : '';
      const its = (ln.items || []).length
        ? ln.items.map(i => `<div style="display:flex;gap:8px;padding:3px 0;font-size:13px">
            <span style="flex:2">${esc(i.product_name || ('SP #' + i.product_id))}</span>
            <span>x${i.qty}</span>
          </div>`).join('') : '<p class="text-muted" style="font-size:12.5px">Không có SP</p>';
      return `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:8px;background:#fafbfd">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-weight:700;color:#1e3a8a">
          <span style="background:#3b82f6;color:#fff;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:11px">${idx + 1}</span>
          <span>${esc(ln.template_name || '(?)')}</span>
        </div>
        ${fvs}
        ${its}
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
        ${o.wage_amount ? `<div><b>Tiền công:</b> ${fmt(o.wage_amount)}đ</div>` : ''}
        <div style="margin-top:6px">
          <button class="btn ghost sm" id="btnAssetUpdate">📝 Cập nhật thông tin khách</button>
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

  async function openCompleteDialog(targetStep) {
    const o = state.detail;
    const remain = Math.max(0, Number(o.total_amount) - Number(o.paid_amount));
    const html = `
      <div style="padding:14px">
        <p>Tổng cần thu cho đơn này: <b>${fmt(remain)}đ</b></p>
        <p class="text-muted" style="font-size:12px">Nhập KTV thu / CK admin, phần còn lại tự động ghi nợ. Có thể chỉnh tay ô nợ nếu muốn.</p>
        <div class="field"><label>Số dự kiến (mặc định = còn lại)</label>
          <input id="cExpect" type="number" class="input" value="${remain}" min="0">
        </div>
        <div class="field"><label>KTV thu (đ)</label>
          <input id="cToStaff" type="number" class="input" value="0" min="0">
        </div>
        <div class="field"><label>Phương thức KTV thu</label>
          <select id="cToStaffM" class="select">
            <option value="cash">Tiền mặt</option>
            <option value="transfer">Chuyển khoản</option>
          </select>
        </div>
        <div class="field"><label>Khách CK admin trực tiếp (đ)</label>
          <input id="cToAdmin" type="number" class="input" value="0" min="0">
        </div>
        <div class="field"><label>Ghi nợ (đ) — tự tính, có thể sửa</label>
          <input id="cDebt" type="number" class="input" value="${remain}" min="0">
        </div>
        <div id="cSumHint" class="text-muted" style="font-size:12px;margin:-4px 0 8px">
          Tổng 3 phần: <b id="cSumVal">${fmt(remain)}</b>đ / Dự kiến: <b id="cExpVal">${fmt(remain)}</b>đ
        </div>
        <div class="field"><label>Ghi chú KTV</label>
          <textarea id="cNote" class="textarea" rows="2"></textarea>
        </div>
      </div>
    `;
    const modalPromise = openSimpleModal('Hoàn thành đơn', html, 'Hoàn thành');

    // Tu dong gan no = expected - toStaff - toAdmin khi nguoi dung nhap
    const $E = document.getElementById('cExpect');
    const $S = document.getElementById('cToStaff');
    const $A = document.getElementById('cToAdmin');
    const $D = document.getElementById('cDebt');
    const $sum = document.getElementById('cSumVal');
    const $exp = document.getElementById('cExpVal');
    let debtTouched = false;
    function refreshSum() {
      const e = Number($E.value) || 0;
      const s = Number($S.value) || 0;
      const a = Number($A.value) || 0;
      const d = Number($D.value) || 0;
      $sum.textContent = fmt(s + a + d);
      $exp.textContent = fmt(e);
      $sum.style.color = (s + a + d === e) ? '#16a34a' : '#dc2626';
    }
    function recalcDebt() {
      if (debtTouched) { refreshSum(); return; }
      const e = Number($E.value) || 0;
      const s = Number($S.value) || 0;
      const a = Number($A.value) || 0;
      $D.value = Math.max(0, e - s - a);
      refreshSum();
    }
    [$E, $S, $A].forEach(el => el.addEventListener('input', recalcDebt));
    $D.addEventListener('input', () => { debtTouched = true; refreshSum(); });

    const ok = await modalPromise;
    if (!ok) return;
    const body = {
      target_step_code: targetStep,
      expected_amount:    Number(document.getElementById('cExpect').value) || 0,
      to_staff_amount:    Number(document.getElementById('cToStaff').value) || 0,
      to_staff_method:    document.getElementById('cToStaffM').value,
      to_admin_amount:    Number(document.getElementById('cToAdmin').value) || 0,
      debt_amount:        Number(document.getElementById('cDebt').value) || 0,
      note:               document.getElementById('cNote').value.trim() || null,
    };
    closeSimpleModal();
    const r = await api.patch(`/kithuat/orders/${state.detail.id}/complete`, body, { onError: 'toast' });
    if (r) {
      ui.toast('Đã hoàn thành', 'success');
      const customerId = state.detail.customer_id;
      const orderId    = state.detail.id;
      openDetail(state.detail.id);
      loadList();
      // Hoi KTV co muon de xuat cap nhat thong tin khach khong
      setTimeout(() => openAssetUpdateDialog(customerId, orderId), 300);
    }
  }

  // ============================================================
  // CUSTOMER ASSET UPDATE — 1 form gop: cu + moi, gui 1 lan
  // KTV sua truc tiep o tung dong, them dong moi tuy y, bam Gui de xuat
  // -> FE diff voi snapshot ban dau roi gui nhieu /asset-requests song song.
  // ============================================================
  const AU_KINDS = [
    { kind: 'account', label: 'Tài khoản',  valCol: 'account_name', listKey: 'accounts', placeholder: 'Tên tài khoản mới', icon: '👤' },
    { kind: 'vehicle', label: 'Biển số xe', valCol: 'plate',        listKey: 'vehicles', placeholder: 'VD: 51A-12345',     icon: '🚗' },
    { kind: 'sim',     label: 'Số SIM',     valCol: 'sim_number',   listKey: 'sims',     placeholder: 'Số SIM thiết bị',   icon: '📱' },
  ];

  async function openAssetUpdateDialog(customerId, orderId) {
    if (!customerId) return;
    const r = await api.get(`/kithuat/customers/${customerId}/assets`).catch(() => null);
    if (!r) return;

    // Snapshot gia tri goc (theo id) de diff khi submit
    const original = {}; // { 'account:12': 'tenA', ... }
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
      }).join('') || `<div class="af-empty">Chưa có ${esc(cfg.label.toLowerCase())} nào</div>`;

      return `<div class="af-section af-section--${cfg.kind}">
        <h4>
          <span class="af-icon">${cfg.icon}</span>
          <span>${esc(cfg.label)}</span>
          <span class="af-count">${list.length}</span>
        </h4>
        ${rowsHtml}
        <div class="af-new-wrap" data-au-new="${cfg.kind}">
          <div class="af-new-row">
            <input class="input au-new-val" placeholder="${esc(cfg.placeholder)}">
          </div>
        </div>
        <button type="button" class="af-add-row" data-au-add-row="${cfg.kind}">+ Thêm dòng</button>
      </div>`;
    }).join('');

    const html = `
      <div class="asset-form" data-au-customer="${customerId}" data-au-order="${orderId || ''}">
        <p class="af-hint">Sửa trực tiếp ô cũ, tích <b style="color:#dc2626">Xoá</b> để bỏ, hoặc nhập dòng mới. Bấm <b>Gửi đề xuất</b> để gửi tất cả cho admin duyệt.</p>
        ${sectionsHtml}
      </div>
    `;

    // Mo modal nhung KHONG await ngay — can wire nut "Them dong" truoc
    const okPromise = openSimpleModal('Cập nhật thông tin khách', html, 'Gửi đề xuất');

    // Wire nut "+ Them dong" (chi them o trong client, khong goi API)
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
        wrap.appendChild(div);
        div.querySelector('.af-new-del').addEventListener('click', () => div.remove());
        div.querySelector('input').focus();
      });
    });
    // Toggle hieu ung strikethrough khi tich Xoa
    document.querySelectorAll('#simpleModal .au-row .au-del').forEach(cb => {
      cb.addEventListener('change', () => {
        cb.closest('.au-row').classList.toggle('is-deleted', cb.checked);
      });
    });

    const ok = await okPromise;
    if (!ok) return false;

    // ---- Diff & build danh sach request ---------------------
    const reqs = [];
    document.querySelectorAll('#simpleModal .au-row').forEach(row => {
      const kind = row.dataset.kind;
      const id   = Number(row.dataset.id);
      const inp  = row.querySelector('.au-val');
      const del  = row.querySelector('.au-del');
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
    if (!reqs.length) { ui.toast('Không có thay đổi', 'info'); return true; }

    // Gui song song, dem so thanh cong
    const results = await Promise.all(reqs.map(body =>
      api.post(`/kithuat/customers/${customerId}/asset-requests`,
        { ...body, ref_order_id: orderId || null },
        { onError: 'silent' }
      ).catch(() => null)
    ));
    const okCount  = results.filter(Boolean).length;
    const failCount = results.length - okCount;
    if (okCount) ui.toast(`Đã gửi ${okCount} đề xuất, chờ admin duyệt`, 'success');
    if (failCount) ui.toast(`${failCount} đề xuất gửi lỗi`, 'error');
    return true;
  }

  async function uploadStepPhoto() {
    const o = state.detail;
    const html = `
      <div style="padding:14px">
        <div class="field"><label>Chọn ảnh từ máy</label>
          <input type="file" id="upFile" accept="image/*">
        </div>
        <div class="field"><label>Mô tả (tuỳ chọn)</label>
          <input id="upCap" type="text" class="input">
        </div>
      </div>
    `;
    const ok = await openSimpleModal('Thêm ảnh', html, 'Lưu');
    if (!ok) return;
    const file = document.getElementById('upFile').files[0];
    const caption = document.getElementById('upCap').value.trim() || null;
    if (!file) { ui.toast('Hãy chọn ảnh', 'warning'); closeSimpleModal(); return; }
    closeSimpleModal();
    ui.toast('Đang tải ảnh lên imgbb…');
    let url;
    try {
      url = await imgbb.upload(file);
    } catch (e) {
      ui.toast('Upload ảnh thất bại', 'error');
      return;
    }
    const r = await api.post(`/kithuat/orders/${o.id}/photos`, { url, caption }, { onError: 'toast' });
    if (r) { ui.toast('Đã thêm ảnh', 'success'); openDetail(o.id); }
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
