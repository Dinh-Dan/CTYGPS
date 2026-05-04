// Trang Nha Cung Cap — CRUD don gian

(function () {
  const $ = (id) => document.getElementById(id);

  const state = {
    q: '',
    page: 1, limit: 20, total: 0,
  };

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  async function load() {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    p.set('page',  state.page);
    p.set('limit', state.limit);

    const res = await api.get('/admin/suppliers?' + p.toString()).catch(() => null);
    if (!res) return;
    state.total = res.total;
    renderRows(res.items);

    const totalPage = Math.max(1, Math.ceil(res.total / state.limit));
    $('pageInfo').textContent = `Trang ${state.page} / ${totalPage} — ${res.total} NCC`;
    $('prevPage').disabled = state.page <= 1;
    $('nextPage').disabled = state.page >= totalPage;
  }

  function renderRows(items) {
    const tb = $('tbody');
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
          <button class="btn ghost sm" data-act="edit" data-id="${s.id}">Sửa</button>
          <button class="btn ghost sm" data-act="del" data-id="${s.id}" style="color:#dc2626">Xóa</button>
        </td>
      </tr>
    `).join('');
  }

  function openModal(s) {
    $('modalTitle').textContent = s ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp';
    $('f_id').value      = s ? s.id : '';
    $('f_name').value    = s ? (s.name || '')    : '';
    $('f_phone').value   = s ? (s.phone || '')   : '';
    $('f_address').value = s ? (s.address || '') : '';
    $('f_note').value    = s ? (s.note || '')    : '';
    $('modal').classList.add('open');
    setTimeout(() => $('f_name').focus(), 50);
  }
  function closeModal() { $('modal').classList.remove('open'); }

  async function handleSubmit(e) {
    e.preventDefault();
    const id = $('f_id').value;
    const data = {
      name:    $('f_name').value.trim(),
      phone:   $('f_phone').value.trim() || null,
      address: $('f_address').value.trim() || null,
      note:    $('f_note').value.trim() || null,
    };
    if (!data.name) return ui.toast('Thiếu tên NCC', 'warning');

    $('btnSave').disabled = true;
    const ok = await (id
      ? api.put('/admin/suppliers/' + id, data, { successMessage: 'Đã cập nhật NCC', loading: true })
      : api.post('/admin/suppliers',     data, { successMessage: 'Đã tạo NCC',     loading: true })
    ).catch(() => null);
    $('btnSave').disabled = false;
    if (!ok) return;
    closeModal();
    load();
  }

  async function handleTableClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;

    if (act === 'edit') {
      const s = await api.get('/admin/suppliers/' + id).catch(() => null);
      if (s) openModal(s);
    } else if (act === 'del') {
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
      if (ok) load();
    }
  }

  function init() {
    adminShell.init('suppliers');

    let searchTimer;
    $('search').addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.q = e.target.value.trim();
        state.page = 1;
        load();
      }, 300);
    });

    $('prevPage').addEventListener('click', () => { state.page--; load(); });
    $('nextPage').addEventListener('click', () => { state.page++; load(); });

    $('btnAdd').addEventListener('click', () => openModal(null));
    $('modalClose').addEventListener('click', closeModal);
    $('btnCancel').addEventListener('click', closeModal);
    $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    $('frm').addEventListener('submit', handleSubmit);

    $('tbody').addEventListener('click', handleTableClick);

    load();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
