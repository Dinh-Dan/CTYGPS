// Render noi dung tin nhan: neu la tin "quan tam san pham" tu product-detail
// thi parse ra va hien thi nhu mot product card thay vi link tho.
//
// Format goc (xem FE/customer/product-detail.html):
//   Xin chao, minh quan tam san pham:
//   - <name> (Ma <code>)
//   - Gia: <priceTxt>
//   - <url product-detail.html?id=ID>
//   Minh can duoc tu van them.
//
// API: chatMsg.render(content, { theme: 'on-blue' | 'on-white' })

(function (global) {
  const thumbCache = new Map(); // product_id -> { src, name, code, price }
  const pendingFetches = new Map(); // product_id -> Promise

  function escape(s) {
    if (s == null) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  function autoLink(escapedText) {
    return escapedText.replace(/(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">$1</a>');
  }

  // Tra ve null neu khong phai tin san pham, hoac { name, code, price, url, productId, intro, tail }
  function parseProductMessage(text) {
    if (!text) return null;
    const linkRe = /(https?:\/\/\S+\/customer\/product-detail\.html\?id=(\d+))/i;
    const linkM = text.match(linkRe);
    if (!linkM) return null;
    const url = linkM[1];
    const productId = Number(linkM[2]);

    // Tach name + code: "<name> (Ma <code>)" — Ma co the kem dau . hoac in hoa
    // Cho phep "Ma", "MA", "Mã"
    const nameM = text.match(/[•\-*]\s*([^\n•]+?)\s*\(\s*M[ãa]\s+([^)]+?)\s*\)/i);
    if (!nameM) return null;
    const name = nameM[1].trim();
    const code = nameM[2].trim();

    // Gia: lay phan sau "Gia:" cho den dau bullet/newline ke tiep
    const priceM = text.match(/Gi[áa]\s*:\s*([^\n•]+?)(?=\s*[•\n]|\s+https?:|$)/i);
    const price = priceM ? priceM[1].trim() : '';

    // Phan loi mo dau (truoc bullet dau tien)
    const introM = text.match(/^([\s\S]*?)(?=[•\-*]\s)/);
    const intro = introM ? introM[1].trim() : '';

    // Phan loi cuoi (sau URL)
    const tail = text.split(url).slice(1).join(url).trim();

    return { name, code, price, url, productId, intro, tail };
  }

  // Fetch thumbnail neu chua co. Tra ve Promise resolve sau khi cache duoc cap nhat.
  function ensureThumb(productId) {
    if (thumbCache.has(productId)) return Promise.resolve(thumbCache.get(productId));
    if (pendingFetches.has(productId)) return pendingFetches.get(productId);
    const p = (async () => {
      try {
        const r = await fetch('/api/public/products/' + productId);
        if (!r.ok) throw new Error('http ' + r.status);
        const data = await r.json();
        const info = {
          src: data.thumbnail_url || data.image_url || '',
          name: data.name || '',
          code: data.code || '',
        };
        thumbCache.set(productId, info);
        return info;
      } catch (_) {
        thumbCache.set(productId, { src: '', name: '', code: '' });
        return thumbCache.get(productId);
      } finally {
        pendingFetches.delete(productId);
      }
    })();
    pendingFetches.set(productId, p);
    return p;
  }

  // Render product card. theme: 'on-blue' (bubble nen xanh) hoac 'on-white' (bubble trang)
  function renderProductCard(p, theme) {
    const onBlue = theme === 'on-blue';
    const cardBg     = onBlue ? 'rgba(255,255,255,.14)' : '#ffffff';
    const cardBorder = onBlue ? 'rgba(255,255,255,.35)' : '#e2e8f0';
    const titleColor = onBlue ? '#ffffff' : '#0f172a';
    const metaColor  = onBlue ? '#dbeafe' : '#64748b';
    const priceColor = onBlue ? '#fde68a' : '#dc2626';
    const ctaBg      = onBlue ? 'rgba(255,255,255,.22)' : '#eff6ff';
    const ctaColor   = onBlue ? '#ffffff' : '#1d4ed8';
    const thumbBg    = onBlue ? 'rgba(255,255,255,.18)' : '#f1f5f9';

    const thumbId = 'pcThumb_' + p.productId + '_' + Math.random().toString(36).slice(2, 7);

    return `
      <a href="${escape(p.url)}" target="_blank" rel="noopener"
         class="chat-prod-card"
         style="display:flex;gap:10px;align-items:center;
                border:1px solid ${cardBorder};background:${cardBg};
                border-radius:10px;padding:8px;margin:4px 0;
                text-decoration:none;color:inherit;min-width:240px;max-width:320px;">
        <div id="${thumbId}"
             style="width:54px;height:54px;border-radius:8px;background:${thumbBg};
                    display:flex;align-items:center;justify-content:center;
                    font-size:24px;flex-shrink:0;overflow:hidden">📦</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:13.5px;color:${titleColor};
                      line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;
                      -webkit-box-orient:vertical;overflow:hidden">${escape(p.name)}</div>
          <div style="font-size:11.5px;color:${metaColor};margin-top:3px">
            Mã <b>${escape(p.code)}</b>${p.price ? ` · <b style="color:${priceColor}">${escape(p.price)}</b>` : ''}
          </div>
          <div style="display:inline-block;margin-top:5px;padding:2px 8px;
                      background:${ctaBg};color:${ctaColor};
                      border-radius:999px;font-size:11px;font-weight:600">
            Xem sản phẩm ›
          </div>
        </div>
      </a>`;
  }

  // Sau khi DOM da insert card, async load thumbnail va thay icon
  function hydrateThumbs(rootEl) {
    if (!rootEl) return;
    const cards = rootEl.querySelectorAll('.chat-prod-card[data-product-id]');
    cards.forEach(card => {
      const pid = Number(card.dataset.productId);
      const thumbBox = card.querySelector('[data-thumb-box]');
      if (!pid || !thumbBox) return;
      ensureThumb(pid).then(info => {
        if (!info || !info.src) return;
        thumbBox.innerHTML = `<img src="${escape(info.src)}" alt=""
          style="width:100%;height:100%;object-fit:cover;display:block">`;
      });
    });
  }

  // ---- Attachment (anh / file tai lieu) ----------------------
  // Format: anh = URL tron, file = [FILE]url|name[/FILE]
  function parseAttachment(text) {
    if (!text) return null;
    const t = String(text).trim();
    const fm = t.match(/^\[FILE\]([^|]+)\|([^\[]+)\[\/FILE\]$/);
    if (fm) return { type: 'file', url: fm[1].trim(), name: fm[2].trim() };
    if (/^\/uploads\/[^\s]+\.(jpe?g|png|gif|webp)$/i.test(t)) {
      return { type: 'image', url: t };
    }
    return null;
  }

  function renderImage(url) {
    return `<img src="${escape(url)}" class="chat-img" data-zoom-url="${escape(url)}"
      style="max-width:240px;max-height:240px;border-radius:10px;cursor:zoom-in;display:block">`;
  }

  function fileIcon(name) {
    const ext = (String(name).split('.').pop() || '').toLowerCase();
    return ({
      pdf:'📕', doc:'📘', docx:'📘',
      xls:'📗', xlsx:'📗', csv:'📊',
      ppt:'📙', pptx:'📙',
      zip:'📦', rar:'📦', txt:'📄',
    })[ext] || '📎';
  }

  function renderFile(url, name, theme) {
    const onBlue = theme === 'on-blue';
    const bg = onBlue ? 'rgba(255,255,255,.18)' : '#f1f5f9';
    const color = onBlue ? '#fff' : '#1e40af';
    const sub = onBlue ? 'rgba(255,255,255,.75)' : '#64748b';
    return `<a href="${escape(url)}" download="${escape(name)}" target="_blank" rel="noopener"
      style="display:flex;align-items:center;gap:10px;padding:9px 12px;
             background:${bg};border-radius:10px;text-decoration:none;
             color:${color};max-width:280px">
      <span style="font-size:24px;flex-shrink:0">${fileIcon(name)}</span>
      <span style="min-width:0;flex:1;overflow:hidden">
        <b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px">${escape(name)}</b>
        <small style="color:${sub};font-size:11px">⬇ Bấm để tải</small>
      </span>
    </a>`;
  }

  // ---- Lightbox cho anh --------------------------------------
  function openLightbox(url) {
    const bg = document.createElement('div');
    bg.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:20px';
    bg.innerHTML = `
      <button type="button" aria-label="Đóng"
        style="position:absolute;top:14px;right:18px;background:transparent;border:none;color:#fff;font-size:34px;cursor:pointer;line-height:1">×</button>
      <img src="${escape(url)}" style="max-width:96vw;max-height:92vh;border-radius:6px;box-shadow:0 10px 40px rgba(0,0,0,.6)">`;
    const close = () => { bg.remove(); document.removeEventListener('keydown', onEsc); };
    bg.addEventListener('click', close);
    const onEsc = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onEsc);
    document.body.appendChild(bg);
  }

  // Click vao .chat-img bat ky -> mo lightbox (event delegation toan trang)
  document.addEventListener('click', (e) => {
    const img = e.target.closest('img.chat-img');
    if (img && img.dataset.zoomUrl) openLightbox(img.dataset.zoomUrl);
  });

  function render(text, opts) {
    const theme = (opts && opts.theme) || 'on-white';

    // 1. Attachment (anh / file)
    const att = parseAttachment(text);
    if (att) {
      if (att.type === 'image') return renderImage(att.url);
      if (att.type === 'file')  return renderFile(att.url, att.name, theme);
    }

    // 2. Product card
    const p = parseProductMessage(text);
    if (!p) {
      // 3. Tin thuong: escape + auto-link + giu xuong dong
      return autoLink(escape(text)).replaceAll('\n', '<br>');
    }
    const card = renderProductCardTagged(p, theme);
    const intro = p.intro ? `<div style="font-size:13px;margin-bottom:4px">${escape(p.intro)}</div>` : '';
    const tail  = p.tail  ? `<div style="font-size:13px;margin-top:4px">${escape(p.tail)}</div>`  : '';
    return intro + card + tail;
  }

  // Variant cua renderProductCard: them data-attr de hydrateThumbs tim duoc
  function renderProductCardTagged(p, theme) {
    const html = renderProductCard(p, theme);
    return html
      .replace('class="chat-prod-card"', `class="chat-prod-card" data-product-id="${p.productId}"`)
      .replace(/id="pcThumb_[^"]+"/, m => m + ' data-thumb-box="1"');
  }

  global.chatMsg = {
    parseProductMessage,
    parseAttachment,
    render,
    hydrateThumbs,
    openLightbox,
  };
})(window);
