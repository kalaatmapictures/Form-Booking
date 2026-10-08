/* =========================================================
   HALAMAN PERTAMA — satu layar: foto penuh, teks & 3 testimoni
   di atas foto. Isi dari konten
   (web admin → Menu → Konten). Tombol [data-start] memulai booking.
   ========================================================= */
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* hanya URL http(s) yang dipakai sebagai gambar */
const safeUrl = u => /^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '';
const cssUrl = u => `url("${encodeURI(u).replace(/"/g, '%22')}")`;

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const STAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';
const IG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg>';
const WA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M4 20l1.2-4A8 8 0 1 1 8 18.8z"/><path d="M9 9.5c.3 2.3 2.2 4.2 4.5 4.5l1-1.2 2 .8-.4 1.8c-3.8.3-7.3-3.2-7-7l1.8-.4.8 2z" stroke-width="1.2"/></svg>';

const stars = n => `<span class="cv-stars" aria-label="${n} dari 5">${STAR.repeat(Math.max(1, Math.min(5, Number(n) || 5)))}</span>`;
const waLink = p => { let d = String(p || '').replace(/\D/g, ''); if(d.startsWith('0')) d = '62' + d.slice(1); return d ? `https://wa.me/${d}` : ''; };

export function renderLanding(el, content, _services){
  const c = content, b = c.brand, h = c.hero;
  const photo = safeUrl(h.photo), photoM = safeUrl(h.photoMobile) || photo;
  const ig = String(c.footer.instagram || '').replace(/^@/, '').trim();
  const wa = waLink(c.footer.phone);
  const testi = (c.testimonials.items || []).filter(t => t && t.text).slice(0, 3);
  const bg = [photo && `--cv-bg:${cssUrl(photo)}`, photoM && `--cv-bg-m:${cssUrl(photoM)}`].filter(Boolean).join(';');

  el.innerHTML = `
  <section class="cv ${photo || photoM ? 'has-photo' : ''}" ${bg ? `style='${esc(bg)}'` : ''}>
    <div class="cv-photo" aria-hidden="true"></div>
    <header class="cv-nav">
      <div class="cv-brand"><img class="cv-logo" src="/logo.png" alt="${esc(`${b.name} ${b.tagline}`)}" width="785" height="207"></div>
      <button class="cv-btn line sm" data-start>${esc(h.cta)}</button>
    </header>

    <div class="cv-body">
      <div class="cv-eyebrow"><i></i>${esc(h.eyebrow)}</div>
      <h1>${esc(h.title)}</h1>
      <p>${esc(h.subtitle)}</p>
      <button class="cv-btn" id="startBtn" data-start>${esc(h.cta)} ${ARROW}</button>
    </div>

    ${testi.length ? `<div class="cv-testi" id="testimoni">
      <div class="cv-testi-h"><span class="cv-eyebrow"><i></i>${esc(c.testimonials.eyebrow)}</span><h2>${esc(c.testimonials.title)}</h2></div>
      <div class="cv-testi-grid">${testi.map(t => `
        <figure>
          ${stars(t.rating)}
          <blockquote>“${esc(t.text)}”</blockquote>
          <figcaption>
            ${safeUrl(t.photo) ? `<img src="${esc(safeUrl(t.photo))}" alt="" loading="lazy" decoding="async">` : `<span class="cv-av">${esc((t.name || '?').trim()[0] || '?')}</span>`}
            <span><b>${esc(t.name)}</b><small>${esc(t.event)}</small></span>
          </figcaption>
        </figure>`).join('')}</div>
    </div>` : ''}

    <footer class="cv-foot">
      <span>© ${new Date().getFullYear()} ${esc(b.name)} ${esc(b.tagline)}</span>
      <span class="cv-social">
        ${ig ? `<a href="https://instagram.com/${encodeURIComponent(ig)}" target="_blank" rel="noopener">${IG}@${esc(ig)}</a>` : ''}
        ${wa ? `<a href="${wa}" target="_blank" rel="noopener">${WA}WhatsApp</a>` : ''}
      </span>
    </footer>
  </section>`;
}
