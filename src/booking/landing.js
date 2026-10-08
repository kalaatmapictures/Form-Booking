/* =========================================================
   LANDING PAGE — dibangun dari konten (Menu → Konten di web admin)
   dan layanan dari katalog. Tombol [data-start] memulai booking,
   [data-start-svc] memulai booking langsung di layanan tertentu.
   ========================================================= */
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* hanya URL http(s) yang dipakai sebagai gambar */
const safeUrl = u => /^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '';
const pad = n => String(n).padStart(2, '0');

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>';
const STAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';
const LEAF = '<svg class="lp-leaf" viewBox="0 0 120 160" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M60 155C58 110 62 70 88 30M74 70c-18-6-30-20-32-40 18 4 30 18 32 40zM82 48c4-16 16-26 30-28-2 16-14 26-30 28zM68 100c-20 0-36-10-44-28 20-2 36 8 44 28z"/></svg>';

/* gambar dengan bingkai; kosong → bingkai polos bermonogram */
function img(url, cls = '', alt = ''){
  const u = safeUrl(url);
  return u
    ? `<div class="lp-img ${cls}"><img src="${esc(u)}" alt="${esc(alt)}" loading="lazy" decoding="async"></div>`
    : `<div class="lp-img ${cls} empty" aria-hidden="true"><span>K</span></div>`;
}
const head = (num, eyebrow, title, right = '') => `
  <div class="lp-sechead">
    <div class="lp-num"><span>${pad(num)}.</span><i></i><span>${esc(eyebrow)}</span></div>
    ${title || right ? `<div class="lp-sechead-row">${title ? `<h2>${esc(title)}</h2>` : ''}${right}</div>` : ''}
  </div>`;
const stars = n => `<span class="lp-stars" aria-label="${n} dari 5">${STAR.repeat(Math.max(0, Math.min(5, Number(n) || 5)))}</span>`;

export function renderLanding(el, content, services){
  const c = content, b = c.brand, h = c.hero;
  const svcList = Object.entries(services || {});
  const ig = String(c.footer.instagram || '').replace(/^@/, '');

  el.innerHTML = `
  <header class="lp-nav">
    <a class="lp-brand" href="#top" aria-label="${esc(b.name)}">
      <span class="lp-mono">${esc((b.name || 'K').trim()[0] || 'K')}</span>
      <span><b>${esc(b.name)}</b><small>${esc(b.tagline)}</small></span>
    </a>
    <nav class="lp-links">
      <a href="#tentang">Tentang</a><a href="#layanan">Layanan</a><a href="#portfolio">Portfolio</a><a href="#faq">FAQ</a>
    </nav>
    <button class="lp-btn sm" data-start>${esc(h.cta)}</button>
  </header>

  <section class="lp-hero" id="top">
    <div class="lp-hero-l">
      <div class="lp-eyebrow">${esc(h.eyebrow)}</div>
      <h1>${esc(h.title)}</h1>
      <p>${esc(h.subtitle)}</p>
      <button class="lp-btn" id="startBtn" data-start>${esc(h.cta)} <span class="lp-ic">${ARROW}</span></button>
      ${h.rating ? `<div class="lp-trust">${stars(5)}<span><b>${esc(h.rating)}</b> ${esc(h.ratingNote)}</span></div>` : ''}
    </div>
    <div class="lp-hero-c">
      ${img(h.photo, 'arch', b.name)}
      <button class="lp-badge" data-start aria-label="${esc(h.cta)}">
        <svg viewBox="0 0 100 100"><defs><path id="lpCirc" d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1-76 0"/></defs>
          <text><textPath href="#lpCirc">BOOK YOUR MOMENT · BOOK YOUR MOMENT ·</textPath></text></svg>
        <span>${ARROW}</span>
      </button>
    </div>
    <div class="lp-hero-r">
      <div class="lp-small">${esc(h.galleryTitle)}</div>
      <div class="lp-gal">${(h.gallery || []).slice(0, 2).map(u => img(u, 'gal')).join('')}</div>
      <div class="lp-tags">${(h.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
    </div>
  </section>

  <section class="lp-highlight">
    <h3>${esc(c.highlight.title)}</h3>
    <p>${esc(c.highlight.text)}</p>
    <div class="lp-big"><b>${esc(c.highlight.number)}</b><span>${esc(c.highlight.numberLabel)}</span></div>
  </section>

  <section class="lp-about" id="tentang">
    <div class="lp-about-photos">${img(c.about.photos?.[0], 'tall')}${img(c.about.photos?.[1], 'wide')}${LEAF}</div>
    <div class="lp-about-txt">
      <div class="lp-num"><span>01.</span><i></i><span>${esc(c.about.eyebrow)}</span></div>
      <h2>${esc(c.about.title)}</h2>
      <p>${esc(c.about.text)}</p>
      <a class="lp-btn ghost" href="#layanan">Lihat layanan <span class="lp-ic">${ARROW}</span></a>
    </div>
  </section>

  ${svcList.length ? `<section class="lp-services" id="layanan">
    ${head(2, c.services.eyebrow, c.services.title, `<p>${esc(c.services.text)}</p>`)}
    <div class="lp-svc-grid">${svcList.map(([id, s], i) => `
      <button class="lp-svc" data-start-svc="${esc(id)}">
        ${img(c.services.photos?.[id], 'svc', s.title)}
        <span class="lp-svc-n">${pad(i + 1)}.</span>
        <span class="lp-svc-b"><b>${esc(s.label)}</b><small>${esc(s.desc || s.title)}</small></span>
        <span class="lp-svc-go">${ARROW}</span>
      </button>`).join('')}</div>
  </section>` : ''}

  ${(c.stats || []).length ? `<section class="lp-stats">${c.stats.map(s => `
    <div><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</section>` : ''}

  <section class="lp-why">
    ${head(3, c.why.eyebrow, '')}
    <div class="lp-why-grid">
      <div class="lp-why-card">
        <h2>${esc(c.why.title)}</h2>
        <p>${esc(c.why.text)}</p>
        ${LEAF}
      </div>
      ${img(c.why.photo, 'oval')}
      <div class="lp-why-side"><p>${esc(c.why.sideText)}</p>${img(c.why.sidePhoto, 'side')}</div>
    </div>
  </section>

  ${(c.portfolio.items || []).length ? `<section class="lp-port" id="portfolio">
    ${head(4, c.portfolio.eyebrow, c.portfolio.title)}
    <div class="lp-port-list">${c.portfolio.items.map(p => `
      <article class="lp-port-item">
        <div class="lp-port-txt">${stars(5)}<h3>${esc(p.title)}</h3><span>${esc(p.subtitle)}</span>
          <button class="lp-btn sm" data-start>Booking momen Anda</button></div>
        <div class="lp-port-photos">${(p.photos || []).slice(0, 3).map(u => img(u, 'port', p.title)).join('')}</div>
      </article>`).join('')}</div>
  </section>` : ''}

  ${(c.testimonials.items || []).length ? `<section class="lp-testi">
    ${head(5, c.testimonials.eyebrow, c.testimonials.title)}
    <div class="lp-testi-grid">${c.testimonials.items.map(t => `
      <figure>${stars(t.rating)}<blockquote>“${esc(t.text)}”</blockquote>
        <figcaption>${safeUrl(t.photo) ? `<img src="${esc(safeUrl(t.photo))}" alt="" loading="lazy">` : `<span class="lp-av">${esc((t.name || '?')[0])}</span>`}
          <span><b>${esc(t.name)}</b><small>${esc(t.event)}</small></span></figcaption></figure>`).join('')}</div>
  </section>` : ''}

  ${(c.faq.items || []).length ? `<section class="lp-faq" id="faq">
    ${img(c.faq.photo, 'faq')}
    <div>
      <div class="lp-num"><span>06.</span><i></i><span>${esc(c.faq.eyebrow)}</span></div>
      <h2>${esc(c.faq.title)}</h2>
      <div class="lp-acc">${c.faq.items.map((f, i) => `
        <details ${i === 0 ? 'open' : ''}><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>
    </div>
  </section>` : ''}

  <section class="lp-cta ${safeUrl(c.cta.photo) ? 'has-photo' : ''}" ${safeUrl(c.cta.photo) ? `style="--cta-bg:url('${esc(safeUrl(c.cta.photo))}')"` : ''}>
    <div class="lp-cta-card">
      <h2>${esc(c.cta.title)}</h2>
      <p>${esc(c.cta.text)}</p>
      <button class="lp-btn" data-start>${esc(c.cta.button)} <span class="lp-ic">${ARROW}</span></button>
    </div>
  </section>

  <footer class="lp-foot">
    <div class="lp-foot-brand"><span class="lp-mono">${esc((b.name || 'K').trim()[0] || 'K')}</span>
      <div><b>${esc(b.name)}</b><small>${esc(b.tagline)}</small></div></div>
    <p>${esc(c.footer.text)}</p>
    <div class="lp-foot-info">
      ${c.footer.address ? `<span>${esc(c.footer.address)}</span>` : ''}
      ${c.footer.phone ? `<span>${esc(c.footer.phone)}</span>` : ''}
      ${c.footer.email ? `<a href="mailto:${esc(c.footer.email)}">${esc(c.footer.email)}</a>` : ''}
      ${ig ? `<a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">@${esc(ig)}</a>` : ''}
    </div>
    <small class="lp-copy">© ${new Date().getFullYear()} ${esc(b.name)} ${esc(b.tagline)}</small>
  </footer>`;
}
