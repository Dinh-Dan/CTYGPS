// Logic trang KTV - profile + reviews

(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('vi-VN');

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  function stars(n) {
    n = Math.round(n || 0);
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  let me = null;

  function fillForm(p) {
    const initial = (p.full_name || p.username || '?').charAt(0).toUpperCase();
    if (p.avatar_url) {
      $('bigAvatar').outerHTML = `<img id="bigAvatar" src="${p.avatar_url}" class="big-avatar" alt="">`;
    } else {
      $('bigAvatar').textContent = initial;
    }
    $('p_name').textContent = p.full_name || p.username;
    $('p_meta').textContent = `@${p.username}${p.area ? ' · 📍 ' + p.area : ''}`;
    const r = Number(p.avg_rating || 0);
    $('p_stars').innerHTML = `<span style="color:#f59e0b">${stars(r)}</span> ${r.toFixed(1)} / 5`;
    $('p_review_count').textContent = p.total_reviews ? `${p.total_reviews} đánh giá` : 'Chưa có đánh giá';

    $('s_done').textContent   = p.completed_tasks || 0;
    const positivePct = p.total_reviews ? Math.round((p.positive_count / p.total_reviews) * 100) : 0;
    $('s_positive').textContent = positivePct + '%';
    $('s_wage').textContent = fmt.format(p.wage_this_month || 0) + 'đ';
    $('s_unpaid').textContent = fmt.format(p.unremitted_amount || 0) + 'đ';
    $('s_unpaid_count').textContent = (p.unremitted_count || 0) + ' khoản';

    $('f_name').value  = p.full_name || '';
    $('f_phone').value = p.phone || '';
    $('f_email').value = p.email || '';
    $('f_cccd').value  = p.cccd || '';
    $('f_area').value  = p.area || '';
  }

  async function load() {
    const p = await api.get('/kithuat/me').catch(() => null);
    if (!p) return;
    me = p;
    fillForm(p);

    const rev = await api.get('/kithuat/me/reviews').catch(() => null);
    if (rev && rev.items.length) {
      $('reviewList').innerHTML = rev.items.map(r => `
        <div class="review-row">
          <div>
            <span style="color:#f59e0b">${stars(r.rating)}</span>
            <small class="text-muted">— ${escape(r.customer_name || 'Khách')} · ${escape((r.reviewed_at || '').replace('T',' ').slice(0,16))}</small>
          </div>
          ${r.comment ? `<div style="margin-top:4px">${escape(r.comment)}</div>` : ''}
          <small class="text-muted">${escape(r.order_code)}</small>
        </div>
      `).join('');
    } else {
      $('reviewList').innerHTML = '<p class="text-muted text-center" style="padding:16px">Chưa có đánh giá nào</p>';
    }
  }

  function fileToDataUrl(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result);
      r.onerror = () => rej(new Error('Khong doc duoc file'));
      r.readAsDataURL(file);
    });
  }

  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { ui.toast('Ảnh quá 5MB', 'warning'); e.target.value = ''; return; }
    const dataUrl = await fileToDataUrl(file);
    const up = await api.post('/kithuat/uploads', { dataUrl, folder: 'avatars' }, { loading: true }).catch(() => null);
    e.target.value = '';
    if (!up) return;
    const ok = await api.patch('/kithuat/me', { avatar_url: up.url }, {
      successMessage: 'Đã cập nhật ảnh',
    }).catch(() => null);
    if (ok) {
      // Update auth.user cache
      const cached = auth.user();
      if (cached) {
        cached.avatar_url = up.url;
        localStorage.setItem('gpsviet_user', JSON.stringify(cached));
      }
      load();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const data = {
      full_name: $('f_name').value.trim(),
      phone:     $('f_phone').value.trim() || null,
      email:     $('f_email').value.trim() || null,
      cccd:      $('f_cccd').value.trim() || null,
    };
    const ok = await api.patch('/kithuat/me', data, {
      successMessage: 'Đã cập nhật hồ sơ',
      loading: true,
    }).catch(() => null);
    if (!ok) return;
    const cached = auth.user();
    if (cached) {
      cached.full_name = data.full_name;
      localStorage.setItem('gpsviet_user', JSON.stringify(cached));
    }
    load();
  }

  function init() {
    techShell.init('profile');
    $('btnChangeAvatar').addEventListener('click', () => $('avatarFile').click());
    $('avatarFile').addEventListener('change', handleAvatarChange);
    $('frm').addEventListener('submit', handleSubmit);
    load();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
