/* =========================================================
   KALAATMA PICTURES — BOOKING
   Data menu (layanan, paket, add-on, S&K, rekening) berasal
   dari loadCatalog() — lihat data.js & catalog.js.
   ========================================================= */
import { SUPABASE, GOOGLE_MAPS_API_KEY, supabaseReady, DEMO_MODE } from './config.js';
import { loadCatalog, loadContent } from './data.js';
import { renderLanding } from './landing.js';

let DATA = {}, TERMS = {}, SETTINGS = {};

/* =========================================================
   3. STATE
   ========================================================= */
const state = {
  step:0, service:null, group:null, pkg:null,
  addons:{},        // id -> qty
  people:1, agreed:false, submitting:false, booking:null,
  map:{link:null, lat:null, lng:null}
};

const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const rp = n => 'Rp' + Math.round(n||0).toLocaleString('id-ID');
// semua isian client di-escape sebelum masuk ke innerHTML
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const svc = () => state.service ? DATA[state.service] : null;
const grp = () => { const s=svc(); return s ? s.groups.find(g=>g.id===state.group) : null; };
const pkg = () => { const g=grp(); return g ? g.packages.find(p=>p.id===state.pkg) : null; };

/* =========================================================
   4. PRICING
   ========================================================= */
function packagePrice(){
  const p = pkg(); if(!p) return 0;
  return p.perPerson ? p.price * state.people : p.price;
}
function activeAddons(){
  const s = svc(); if(!s) return [];
  return s.addons
    .filter(a => !a.group || a.group === state.group)
    .filter(a => state.addons[a.id])
    .map(a => ({...a, qty: state.addons[a.id], total: a.price * state.addons[a.id]}));
}
function addOnPrice(){ return activeAddons().reduce((n,a)=>n+a.total,0); }
function totalPrice(){ return packagePrice() + addOnPrice(); }   // transport tidak dihitung
function dpPrice(){ return Math.round(totalPrice() * SETTINGS.dpPercent / 100); }
function remainingPrice(){ return totalPrice() - dpPrice(); }

/* =========================================================
   5. RENDER — STEP 1
   ========================================================= */
function renderServices(){
  $('#svcGrid').innerHTML = Object.entries(DATA).map(([id,s]) => `
    <button type="button" class="card svc ${state.service===id?'sel':''}" data-svc="${id}">
      <span class="tick">✓</span>
      <span class="eyebrow">${esc(s.label)}</span>
      <span class="name">${esc(s.title)}</span>
      <span class="d">${esc(s.desc)}</span>
    </button>`).join('');
  $$('[data-svc]').forEach(b => b.onclick = () => {
    const id = b.dataset.svc;
    if(state.service !== id){
      state.service = id;
      state.group = DATA[id].groups[0].id;
      state.pkg = null; state.addons = {};
    }
    renderServices(); syncNav();
  });
}

/* =========================================================
   6. RENDER — STEP 2
   ========================================================= */
/* Rekomendasi berdasarkan jumlah orang: paket di grup ber-"people"
   yang rentang min–max-nya mencakup jumlah orang (diatur di admin). */
function recommendation(){
  const s = svc(), n = state.people;
  const peopleGroups = s.groups.filter(g => g.people);
  const fits = p => p.min != null && p.max != null && n >= p.min && n <= p.max;
  const matches = peopleGroups.flatMap(g => g.packages.filter(fits).map(p => ({g, p})));
  const who = `Untuk <b>${n} orang</b>`;

  if(!matches.length){
    const mins = peopleGroups.flatMap(g => g.packages.map(p => p.min)).filter(v => v != null);
    const others = s.groups.filter(g => !g.people);
    if(mins.length && n < Math.min(...mins) && others.length)
      return {pkgIds:[], text:`${who}, paket ${others.map(g => `<b>${esc(g.label)}</b>`).join(' atau ')} biasanya lebih sesuai.`};
    return {pkgIds:[], text:'Untuk jumlah orang tersebut, kami akan membantu memberikan rekomendasi paket terbaik.'};
  }
  const pkgIds = matches.map(m => m.p.id);
  const groups = [...new Set(matches.map(m => m.g))];
  if(groups.length === 1 && groups[0].packages.every(fits))
    return {pkgIds, text:`${who}, <b>${esc(groups[0].label)}</b> adalah pilihan yang paling pas.`};
  const names = matches.map(m => (m.g.id !== state.group ? esc(m.g.label) + ' — ' : '') + esc(m.p.name));
  return {pkgIds, text:`${who}, kami sarankan <b>${names.join('</b> atau <b>')}</b>.`};
}

function renderStep2(){
  const s = svc(); if(!s) return;
  $('#s2Eyebrow').textContent = `Step 02 — ${s.label} Package`;
  $('#s2Title').textContent   = 'Pilih paket Anda';
  $('#s2Sub').textContent     = `Paket ${s.label.toLowerCase()} Kalaatma Pictures 2026.`;

  // group tabs
  const tabs = $('#grpTabs');
  if(s.groups.length > 1){
    tabs.hidden = false;
    tabs.innerHTML = s.groups.map(g =>
      `<button type="button" class="tab ${state.group===g.id?'on':''}" data-grp="${g.id}">${esc(g.label)}</button>`).join('');
    $$('[data-grp]').forEach(b => b.onclick = () => {
      state.group = b.dataset.grp; state.pkg = null; state.addons = {};
      renderStep2(); syncNav();
    });
  } else { tabs.hidden = true; tabs.innerHTML = ''; }

  // people counter (family & graduation group)
  const g = grp();
  const early = $('#peopleEarly');
  early.hidden = !(g && g.people);
  const reco = (g && g.people) ? recommendation() : null;
  $('#recoBox').innerHTML = reco ? `<div class="reco"><span class="dot"></span><span>${reco.text}</span></div>` : '';

  // packages
  const list = g ? g.packages : [];
  $('#pkgGrid').className = 'grid ' + (list.length >= 3 ? 'two' : 'two');
  $('#pkgGrid').innerHTML = list.map(p => {
    // di grup berbasis jumlah orang, label mengikuti rekomendasi; selain itu dari admin
    const isRecommended = reco ? reco.pkgIds.includes(p.id) : p.recommended === true;
    const isBestSeller = p.bestSeller === true;
    const total  = p.perPerson ? p.price * state.people : null;
    return `
    <button type="button" class="card pkg ${isBestSeller?'is-bestseller':''} ${isRecommended?'is-recommended':''} ${state.pkg===p.id?'sel':''}" data-pkg="${p.id}" aria-pressed="${state.pkg===p.id}">
      <span class="tick">✓</span>
      ${isBestSeller || isRecommended ? `<div class="package-highlights">${isBestSeller ? '<span class="package-badge bestseller">BEST SELLER</span>' : ''}${isRecommended ? '<span class="package-badge recommended">RECOMMENDED</span>' : ''}</div>` : ''}
      <div class="top">
        <div>
          <div class="pname">${esc(p.name)}</div>
          <div class="price">${rp(p.price)}${p.perPerson?' <small>/ orang</small>':''}</div>
          ${p.perPerson ? `<div style="font-size:12px;color:var(--muted);margin-top:4px">${state.people} orang × ${rp(p.price)} = <b style="color:var(--primary);font-weight:600">${rp(total)}</b></div>` : ''}
        </div>
      </div>
      <ul>${p.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>
    </button>`;
  }).join('');
  $$('[data-pkg]').forEach(b => b.onclick = () => { state.pkg = b.dataset.pkg; renderStep2(); syncNav(); });

  renderAddons();
  syncPeople();
}

function renderAddons(){
  const s = svc();
  const list = s.addons.filter(a => !a.group || a.group === state.group);
  const box = $('#addonBlock');
  if(!list.length || !state.pkg){ box.hidden = true; return; }
  box.hidden = false;
  $('#addonGrid').innerHTML = list.map(a => {
    const on = !!state.addons[a.id];
    const q  = state.addons[a.id] || 1;
    return `
    <div class="addon ${on?'sel':''}" data-addon-wrap="${a.id}">
      <button type="button" style="display:flex;gap:13px;align-items:flex-start;width:100%;text-align:left" data-addon="${a.id}">
        <span class="box">✓</span>
        <span>
          <span class="an">${esc(a.name)}</span>
          ${a.unit?`<span class="ad">per ${esc(a.unit)}</span>`:''}
        </span>
        <span class="ap">+${rp(a.price)}</span>
      </button>
      ${on && a.qty ? `
      <div class="qty-row" style="width:100%">
        <span class="ql">Jumlah (${esc(a.unit)})</span>
        <span class="stepper" data-aq="${a.id}">
          <button type="button" data-d="-1" ${q<=1?'disabled':''}>−</button>
          <span class="v">${q}</span>
          <button type="button" data-d="1">+</button>
        </span>
        <span style="margin-left:auto;font-weight:700;color:var(--primary)">${rp(a.price*q)}</span>
      </div>`:''}
    </div>`;
  }).join('');

  $$('[data-addon]').forEach(b => b.onclick = () => {
    const id = b.dataset.addon;
    if(state.addons[id]) delete state.addons[id]; else state.addons[id] = 1;
    renderAddons(); syncNav();
  });
  $$('[data-aq] button').forEach(b => b.onclick = () => {
    const id = b.closest('[data-aq]').dataset.aq;
    state.addons[id] = Math.max(1, (state.addons[id]||1) + Number(b.dataset.d));
    renderAddons(); syncNav();
  });
}

/* people steppers (step 2 + step 3 share one value) */
function syncPeople(){
  $$('[data-role="peopleVal"]').forEach(el => el.textContent = state.people);
  $$('.stepper[data-role="people"] button[data-d="-1"]').forEach(b => b.disabled = state.people <= 1);
  const p = pkg();
  const help = $('#peopleHelp');
  if(!help) return;
  if(p && p.perPerson) help.innerHTML = `${state.people} orang × ${rp(p.price)} = <b style="color:var(--primary);font-weight:600">${rp(p.price*state.people)}</b>`;
  else help.textContent = 'Digunakan untuk menyesuaikan rekomendasi paket.';
}
$$('.stepper[data-role="people"] button').forEach(b => b.onclick = () => {
  state.people = Math.max(1, state.people + Number(b.dataset.d));
  syncPeople();
  if(state.step === 2) renderStep2();
  syncNav();
});

/* =========================================================
   7. RENDER — STEP 3 (identity fields)
   ========================================================= */
function renderIdentity(){
  const s = svc(); if(!s) return;
  $('#identity').innerHTML = s.couple ? `
    <fieldset class="fs">
      <legend>Couple Information</legend>
      <div class="fgrid two">
        <div class="f" id="f-bride"><label for="bride">Nama Calon Pengantin Wanita <span class="req">*</span></label>
          <input id="bride" type="text" placeholder="Nama lengkap"><div class="err">Nama wajib diisi.</div></div>
        <div class="f"><label for="brideIg">Instagram Calon Pengantin Wanita</label>
          <input id="brideIg" type="text" placeholder="@username"></div>
        <div class="f" id="f-groom"><label for="groom">Nama Calon Pengantin Pria <span class="req">*</span></label>
          <input id="groom" type="text" placeholder="Nama lengkap"><div class="err">Nama wajib diisi.</div></div>
        <div class="f"><label for="groomIg">Instagram Calon Pengantin Pria</label>
          <input id="groomIg" type="text" placeholder="@username"></div>
      </div>
    </fieldset>` : `
    <fieldset class="fs">
      <legend>Client Information</legend>
      <div class="fgrid two">
        <div class="f" id="f-client"><label for="client">Nama Lengkap / PIC <span class="req">*</span></label>
          <input id="client" type="text" placeholder="Nama lengkap"><div class="err">Nama wajib diisi.</div></div>
        <div class="f"><label for="clientIg">Instagram</label>
          <input id="clientIg" type="text" placeholder="@username"></div>
      </div>
    </fieldset>`;
  $$('#form input').forEach(i => i.addEventListener('input', () => {
    i.closest('.f')?.classList.remove('bad'); syncNav();
  }));
}

/* =========================================================
   7b. GOOGLE MAPS — pilih titik lokasi
   Tanpa API key pun berfungsi: koordinat dari GPS browser
   atau dari link Google Maps yang ditempel client.
   ========================================================= */
function parseCoords(text){
  const t = (text||'').trim();
  if(!t) return null;
  const pats = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,          // .../@-6.9024,107.6186,17z
    /[?&]q=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,  // ...?q=-6.9024,107.6186
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,      // ...!3d-6.9!4d107.6
    /^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/    // -6.9024, 107.6186
  ];
  for(const p of pats){
    const m = t.match(p);
    if(m) return {lat:+m[1], lng:+m[2]};
  }
  return null;
}
function renderMap(){
  const box = $('#mapPreview'); if(!box) return;
  const {link, lat, lng} = state.map;
  if(lat != null){
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    box.innerHTML = `
      <div class="mapok">
        <span class="pin">📍</span>
        <span><span class="co">${lat.toFixed(6)}, ${lng.toFixed(6)}</span>
          <span class="cc">Titik lokasi tersimpan</span></span>
        <a href="${url}" target="_blank" rel="noopener">Lihat di Maps</a>
      </div>
      ${GOOGLE_MAPS_API_KEY ? `<iframe class="mapframe" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
        src="https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${lat},${lng}&zoom=16"></iframe>` : ''}`;
  } else if(link){
    box.innerHTML = `
      <div class="mapok">
        <span class="pin">🔗</span>
        <span><span class="co">Link tersimpan</span>
          <span class="cc">Koordinat tidak terbaca dari link pendek, tapi link tetap dikirim ke tim.</span></span>
        ${/^https?:\/\//i.test(link) ? `<a href="${esc(link)}" target="_blank" rel="noopener">Buka</a>` : ''}
      </div>`;
  } else box.innerHTML = '';
}
function initMapControls(){
  const linkEl = $('#mapLink'), locEl = $('#loc'), openEl = $('#openMaps');
  if(!linkEl) return;
  linkEl.value = state.map.link || '';

  const syncSearch = () => {
    const q = (locEl.value || '').trim();
    openEl.href = q
      ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q)
      : 'https://www.google.com/maps';
  };
  syncSearch();
  locEl.addEventListener('input', syncSearch);

  linkEl.addEventListener('input', () => {
    const v = linkEl.value.trim();
    const c = parseCoords(v);
    // koordinat mentah dinormalkan jadi URL supaya tim bisa langsung klik
    const link = c && !/^https?:/i.test(v) ? `https://www.google.com/maps?q=${c.lat},${c.lng}` : (v || null);
    state.map = {link, lat: c?.lat ?? null, lng: c?.lng ?? null};
    renderMap();
  });

  $('#geoBtn').onclick = () => {
    const btn = $('#geoBtn');
    if(!navigator.geolocation){ btn.textContent = 'Perangkat tidak mendukung GPS'; return; }
    btn.disabled = true; btn.textContent = 'Mengambil lokasi…';
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = +pos.coords.latitude.toFixed(6), lng = +pos.coords.longitude.toFixed(6);
        state.map = {link:`https://www.google.com/maps?q=${lat},${lng}`, lat, lng};
        linkEl.value = state.map.link;
        renderMap();
        btn.disabled = false; btn.textContent = 'Perbarui lokasi saat ini';
      },
      () => { btn.disabled = false; btn.textContent = 'Izin lokasi ditolak — tempel link saja'; },
      {enableHighAccuracy:true, timeout:10000}
    );
  };
  renderMap();
}


/* =========================================================
   7c. CLOCK PICKER — dial melingkar 12 jam
   Nilai 24 jam disimpan di input hidden ber-id sama,
   jadi validasi dan payload tidak berubah.
   ========================================================= */
const TP = {};
const CK = { key:null, h:9, m:0, mer:'AM', mode:'h' };

const CK_R   = 100;   // radius angka, dalam satuan viewBox 260
const CK_C   = 130;   // titik pusat
const CK_STEP = 30;   // 360° / 12 posisi

const pad2 = n => String(n).padStart(2,'0');
const to24 = (h, mer) => mer === 'AM' ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
const hhmm = (h, m, mer) => `${pad2(to24(h, mer))}:${pad2(m)}`;
function from24(v){
  const [H, M] = v.split(':').map(Number);
  return { h: H % 12 === 0 ? 12 : H % 12, m: M, mer: H < 12 ? 'AM' : 'PM' };
}
/* sudut → koordinat. index 0 di posisi jam 12, searah jarum jam. */
function ckPoint(idx, r = CK_R){
  const rad = (idx * CK_STEP - 90) * Math.PI / 180;
  return { x: CK_C + r * Math.cos(rad), y: CK_C + r * Math.sin(rad) };
}
const ckIndex = () => CK.mode === 'h' ? (CK.h % 12) : (CK.m / 5);

function ckRender(){
  const idx = ckIndex();
  const p = ckPoint(idx);
  const hand = $('#ckHand'), knob = $('#ckKnob');
  hand.setAttribute('x2', p.x.toFixed(2)); hand.setAttribute('y2', p.y.toFixed(2));
  knob.setAttribute('cx', p.x.toFixed(2)); knob.setAttribute('cy', p.y.toFixed(2));

  const labels = CK.mode === 'h'
    ? Array.from({length:12}, (_,i) => i === 0 ? '12' : String(i))
    : Array.from({length:12}, (_,i) => pad2(i * 5));
  $('#ckNums').innerHTML = labels.map((t,i) => {
    const q = ckPoint(i);
    return `<span class="${i===idx?'on':''}" style="left:${(q.x/260*100).toFixed(3)}%;top:${(q.y/260*100).toFixed(3)}%">${t}</span>`;
  }).join('');

  $$('.ck-box').forEach(b => b.classList.toggle('on', b.dataset.ckmode === CK.mode));
  $$('[data-ckmer]').forEach(b => b.classList.toggle('on', b.dataset.ckmer === CK.mer));
  $$('.ck-box')[0].textContent = pad2(CK.h);
  $$('.ck-box')[1].textContent = pad2(CK.m);
  $('#ckFace').setAttribute('aria-valuetext', `${pad2(CK.h)}:${pad2(CK.m)} ${CK.mer}`);
}

/* posisi pointer → indeks terdekat pada lingkaran */
function ckFromPointer(e){
  const r = $('#ckFace').getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2);
  const dy = e.clientY - (r.top + r.height / 2);
  if(dx === 0 && dy === 0) return;
  let deg = Math.atan2(dy, dx) * 180 / Math.PI + 90;   // 0° = jam 12
  deg = (deg % 360 + 360) % 360;
  const idx = Math.round(deg / CK_STEP) % 12;
  if(CK.mode === 'h') CK.h = idx === 0 ? 12 : idx;
  else                CK.m = idx * 5;
  ckRender();
}

function openClock(key){
  CK.key = key;
  const cur = $('#' + key).value;
  let base;
  if(cur) base = from24(cur);
  else if(key === 'endtime' && $('#time').value){
    // default jam selesai: dua jam setelah jam mulai
    const st = $('#time').value.split(':').map(Number);
    base = from24(`${pad2((st[0] + 2) % 24)}:${pad2(st[1])}`);
  } else base = { h: key === 'endtime' ? 5 : 9, m: 0, mer: key === 'endtime' ? 'PM' : 'AM' };
  Object.assign(CK, base, { mode:'h' });
  $('#ckLabel').textContent = key === 'time' ? 'Jam Mulai' : 'Jam Selesai';
  ckRender();
  $('#clockModal').classList.add('open');
  $('#ckFace').focus();
}
function closeClock(){ $('#clockModal').classList.remove('open'); }

function syncTrigger(key){
  const v = $('#' + key).value;
  const el = document.querySelector(`[data-tv="${key}"]`);
  if(!el) return;
  el.textContent = v ? fmtTime12(v) : '--:--';
  el.classList.toggle('ph', !v);
}
function setTime(key, v){
  const inp = $('#' + key);
  inp.value = v || '';
  syncTrigger(key);
  inp.dispatchEvent(new Event('input', {bubbles:true}));
}

/* wiring */
$$('[data-clock]').forEach(b => b.onclick = () => openClock(b.dataset.clock));
$$('[data-ck-close]').forEach(b => b.onclick = closeClock);
$$('.ck-box').forEach(b => b.onclick = () => { CK.mode = b.dataset.ckmode; ckRender(); });
$$('[data-ckmer]').forEach(b => b.onclick = () => { CK.mer = b.dataset.ckmer; ckRender(); });
$('#ckOk').onclick = () => { setTime(CK.key, hhmm(CK.h, CK.m, CK.mer)); closeClock(); };

(function dialDrag(){
  const face = $('#ckFace');
  let down = false;
  face.addEventListener('pointerdown', e => {
    down = true; face.setPointerCapture?.(e.pointerId); ckFromPointer(e); e.preventDefault();
  });
  face.addEventListener('pointermove', e => { if(down) ckFromPointer(e); });
  const up = () => {
    if(!down) return;
    down = false;
    // selesai memilih jam → otomatis lanjut ke menit, seperti picker Material
    if(CK.mode === 'h'){ CK.mode = 'm'; ckRender(); }
  };
  face.addEventListener('pointerup', up);
  face.addEventListener('pointercancel', up);
  face.addEventListener('keydown', e => {
    const d = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1
            : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1 : 0;
    if(d){
      e.preventDefault();
      if(CK.mode === 'h') CK.h = ((CK.h - 1 + d + 12) % 12) + 1;
      else                CK.m = (CK.m + d * 5 + 60) % 60;
      ckRender();
    }
    if(e.key === 'Tab'){ e.preventDefault(); CK.mode = CK.mode === 'h' ? 'm' : 'h'; ckRender(); }
  });
})();

/* API yang dipakai reset form dan pengisian dari luar */
['time','endtime'].forEach(k => {
  TP[k] = { set: v => setTime(k, v), clear: () => setTime(k, '') };
  syncTrigger(k);
});

/* =========================================================
   8. VALIDATION
   ========================================================= */
const waRe = /^(?:\+62|62|0)8[1-9][0-9]{6,11}$/;
const usesPeople = () => !!svc()?.usesPeople;
function readForm(){
  const v = id => ($('#'+id)?.value || '').trim();
  const ig = id => { const x = v(id).replace(/^@+/,''); return x ? '@'+x : null; };
  return {
    bride:v('bride'), brideIg:ig('brideIg'), groom:v('groom'), groomIg:ig('groomIg'),
    client:v('client'), clientIg:ig('clientIg'),
    wa:v('wa').replace(/[\s\-().]/g,''), date:v('date'),
    time:v('time'), endtime:v('endtime'),
    loc:v('loc'), notes:v('notes')
  };
}
function validate(mark){
  const f = readForm(); const bad = [];
  const need = (id, ok) => { if(!ok) bad.push(id); if(mark) $('#f-'+id)?.classList.toggle('bad', !ok); };
  if(svc().couple){ need('bride', !!f.bride); need('groom', !!f.groom); }
  else need('client', !!f.client);
  need('wa', waRe.test(f.wa));
  need('date', !!f.date);
  need('time', !!f.time);
  need('endtime', !!f.endtime && !!f.time && f.endtime > f.time);
  need('loc', !!f.loc);
  return bad.length === 0;
}

/* =========================================================
   9. SUMMARY
   ========================================================= */
function fmtTime12(v){
  if(!v) return '';
  const [H,M] = v.split(':').map(Number);
  return `${String(H%12===0?12:H%12).padStart(2,'0')}:${String(M).padStart(2,'0')} ${H<12?'AM':'PM'}`;
}
function fmtDate(d){
  if(!d) return '—';
  return new Date(d+'T00:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
}
function summaryRows(){
  const s = svc(), g = grp(), p = pkg(), f = readForm();
  const row = (k,v,ig) => `<div class="row"><span class="k">${k}</span><span class="v">${esc(v)||'—'}${ig?`<span class="ig">${esc(ig)}</span>`:''}</span></div>`;
  let out = '';
  if(s.couple){
    out += row('Bride', f.bride, f.brideIg);
    out += row('Groom', f.groom, f.groomIg);
  } else {
    out += row('Client / PIC', f.client, f.clientIg);
  }
  out += row('Service', s.label);
  const pname = (s.groups.length>1 ? g.label + ' — ' : '') + (p ? p.name : '');
  out += row('Package', pname);
  const ad = activeAddons();
  if(ad.length) out += row('Add-ons', ad.map(a => a.name + (a.qty>1?` ×${a.qty}`:'')).join(', '));
  out += row('Date', fmtDate(f.date));
  out += row('Time', f.time && f.endtime ? `${fmtTime12(f.time)} – ${fmtTime12(f.endtime)} WIB` : '—');
  const mapNote = state.map.lat != null
    ? `📍 ${state.map.lat.toFixed(5)}, ${state.map.lng.toFixed(5)}`
    : (state.map.link ? 'Link Maps terlampir' : '');
  out += row('Location', f.loc, mapNote);
  if(usesPeople()) out += row('People', state.people + ' orang');
  out += row('WhatsApp', f.wa);
  if(f.notes) out += row('Request', f.notes);
  return out;
}
function renderStep4(){
  const p = pkg();
  $('#sumRows').innerHTML = summaryRows();

  const ad = activeAddons();
  let pr = `<div class="row"><span class="k">Package${p&&p.perPerson?` (${state.people} × ${rp(p.price)})`:''}</span><span class="v">${rp(packagePrice())}</span></div>`;
  if(ad.length){
    ad.forEach(a => pr += `<div class="row"><span class="k">${esc(a.name)}${a.qty>1?` ×${a.qty}`:''}</span><span class="v">${rp(a.total)}</span></div>`);
  } else {
    pr += `<div class="row"><span class="k">Add-ons</span><span class="v">${rp(0)}</span></div>`;
  }
  pr += `<div class="row"><span class="k">Transport</span><span class="v" style="color:var(--muted)">Menyesuaikan lokasi</span></div>`;
  $('#priceRows').innerHTML = pr;
  $('#totalOut').textContent = rp(totalPrice());

  $('#dpRows').innerHTML =
    `<div class="row"><span class="k">Estimated Total</span><span class="v">${rp(totalPrice())}</span></div>` +
    `<div class="row"><span class="k">Sisa pelunasan</span><span class="v">${rp(remainingPrice())}</span></div>`;
  $('#dpOut').textContent = rp(dpPrice());

  const t = TERMS[svc().terms] || {label:'', title:'Syarat & Ketentuan', list:[]};
  $('#termsFor').textContent = t.label;
}

/* =========================================================
   10. NAVIGATION
   ========================================================= */
function canProceed(){
  if(state.step === 1) return !!state.service;
  if(state.step === 2) return !!state.pkg;
  if(state.step === 3) return validate(false);
  if(state.step === 4) return state.agreed && !state.submitting;
  return false;
}
function syncNav(){
  const n = $('#nextBtn');
  n.disabled = !canProceed();
  n.textContent = state.step === 4 ? 'Konfirmasi booking' : 'Lanjut';
  const showEst = state.step >= 2 && state.step <= 4 && state.pkg;
  $('#estBox').hidden = !showEst;
  if(showEst) $('#estOut').textContent = rp(totalPrice());
  $$('#steps .stp').forEach(el => {
    const i = Number(el.dataset.s);
    el.classList.toggle('on', i === state.step);
    el.classList.toggle('done', i < state.step);
  });
  if(state.step === 2) syncPeople();
}
function goto(step){
  state.step = step;
  $('#landing').style.display = step === 0 ? '' : 'none';
  $('#progress').hidden = step === 0;
  $('#nav').hidden = step === 0 || step > 4;   // step 5 tidak butuh tombol Lanjut
  $$('.screen').forEach(s => s.classList.remove('active'));
  if(step >= 1 && step <= 5) $('#s'+step).classList.add('active');
  if(step === 2) renderStep2();
  if(step === 3){
    renderIdentity();
    $('#peopleFs').hidden = !usesPeople();
    initMapControls();
    syncPeople();
  }
  if(step === 4) renderStep4();
  syncNav();
  window.scrollTo({top:0, behavior: step===0 ? 'auto' : 'smooth'});
}

// menu dimuat asinkron (Supabase); tunggu sampai siap sebelum masuk ke step 1.
// [data-start] = mulai dari pilih layanan; [data-start-svc] = langsung ke paket layanan itu.
document.addEventListener('click', async e => {
  const btn = e.target.closest?.('[data-start], [data-start-svc]');
  if(!btn || !btn.closest('#landing')) return;
  e.preventDefault();
  btn.disabled = true;
  await catalogReady;
  btn.disabled = false;
  const id = btn.dataset.startSvc;
  if(id && DATA[id]){
    if(state.service !== id){ state.service = id; state.group = DATA[id].groups[0].id; state.pkg = null; state.addons = {}; }
    renderServices(); goto(2);
  } else { renderServices(); goto(1); }
});
$('#backBtn').onclick  = () => goto(Math.max(0, state.step - 1));
$('#nextBtn').onclick  = () => {
  if(state.step === 3 && !validate(true)){
    const first = $('.f.bad');
    if(first && first.scrollIntoView) first.scrollIntoView({behavior:'smooth', block:'center'});
    return;
  }
  if(state.step === 4){ submit(); return; }
  goto(state.step + 1);
};

/* terms */
$('#termsOpen').onclick = () => {
  const t = TERMS[svc().terms] || {label:'', title:'Syarat & Ketentuan', list:[]};
  $('#mTitle').textContent = t.title;
  $('#mList').innerHTML = t.list.map(i=>`<li>${esc(i)}</li>`).join('');
  $('#modal').classList.add('open');
};
$$('#modal [data-close]').forEach(b => b.onclick = () => $('#modal').classList.remove('open'));
document.addEventListener('keydown', e => { if(e.key === 'Escape'){ $('#modal').classList.remove('open'); closeClock(); } });
$('#agreeBtn').onclick = () => {
  state.agreed = !state.agreed;
  $('#agreeBtn').classList.toggle('sel', state.agreed);
  $('#agreeBtn').setAttribute('aria-pressed', state.agreed);
  syncNav();
};

/* =========================================================
   11. SUBMIT → SUPABASE
   ========================================================= */
function newBookingId(){
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let x = ''; for(let i=0;i<4;i++) x += c[Math.floor(Math.random()*c.length)];
  return `KLA-${new Date().getFullYear()}-${x}`;
}
function buildPayload(){
  const s = svc(), g = grp(), p = pkg(), f = readForm();
  return {
    booking_id: newBookingId(),
    service: s.label,
    service_id: state.service,     // id dipakai server untuk menghitung ulang harga dari menu
    package_id: p.id,
    sub_category: s.groups.length > 1 ? g.label : null,
    package_name: p.name,
    package_price: packagePrice(),
    add_ons: activeAddons().map(a => ({id:a.id, name:a.name, qty:a.qty, unit_price:a.price, total:a.total})),
    add_on_price: addOnPrice(),
    number_of_people: usesPeople() ? state.people : null,
    session_date: f.date,
    session_time: f.time,
    session_end_time: f.endtime,
    location: f.loc,
    map_link: state.map.link,
    latitude: state.map.lat,
    longitude: state.map.lng,
    whatsapp: f.wa,
    notes: f.notes || null,
    estimated_total: totalPrice(),
    estimated_dp: dpPrice(),
    estimated_remaining: remainingPrice(),
    status: 'NEW',
    bride_name: s.couple ? f.bride : null,
    bride_instagram: s.couple ? f.brideIg : null,
    groom_name: s.couple ? f.groom : null,
    groom_instagram: s.couple ? f.groomIg : null,
    client_name: s.couple ? null : f.client,
    client_instagram: s.couple ? null : f.clientIg
  };
}
/* Server menghitung ulang harga dari menu terbaru (lihat skema Supabase).
   { ok } | { ok:false, unavailable:true } bila paket/add-on baru saja dinonaktifkan admin */
async function saveToSupabase(payload){
  if(DEMO_MODE) return {ok:true, demo:true};
  if(!supabaseReady()) return {ok:false, reason:'Supabase belum dikonfigurasi'};
  for(let attempt = 0; attempt < 3; attempt++){
    try{
      const res = await fetch(`${SUPABASE.url.replace(/\/+$/,'')}/rest/v1/${SUPABASE.table}`, {
        method:'POST',
        headers:{
          'apikey': SUPABASE.anonKey,
          'Authorization': 'Bearer ' + SUPABASE.anonKey,
          'Content-Type': 'application/json',
          // minimal: anon boleh menulis tanpa perlu izin membaca tabel
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });
      if(res.ok) return {ok:true};
      const text = await res.text();
      // Booking ID kebetulan sudah dipakai → buat ID baru lalu coba lagi
      if(res.status === 409 && /booking_id/.test(text)){ payload.booking_id = newBookingId(); continue; }
      if(/tidak tersedia/.test(text)) return {ok:false, unavailable:true, reason:text};
      return {ok:false, reason:`${res.status} — ${text}`};
    }catch(err){ return {ok:false, reason:err.message}; }
  }
  return {ok:false, reason:'Booking ID bentrok berulang kali'};
}


/* ---------- Hitung mundur 1 jam untuk transfer DP ---------- */
let cdTimer = null;
const CD_MARKUP = document.getElementById('cdBox').innerHTML;
const CD_NOTE = document.getElementById('cdNote').innerHTML;
function startCountdown(minutes = 60){
  const end = Date.now() + minutes * 60000;
  clearInterval(cdTimer);
  // pulihkan tampilan timer bila booking sebelumnya sempat kedaluwarsa
  $('#cdBox').innerHTML = CD_MARKUP;
  $('#cdNote').innerHTML = CD_NOTE;
  $('#holdLabel').textContent = holdLabel(minutes);
  const pad = n => String(n).padStart(2,'0');
  const tick = () => {
    const left = end - Date.now();
    if(left <= 0){
      clearInterval(cdTimer);
      $('#cdBox').innerHTML = '<div class="expired">Waktu tahan jadwal sudah habis.</div>';
      $('#cdNote').textContent = 'Tenang, tanggal Anda mungkin masih tersedia. Hubungi kami lewat WhatsApp untuk memastikan.';
      return;
    }
    $('#cdM').textContent = pad(Math.floor(left / 60000));
    $('#cdS').textContent = pad(Math.floor(left % 60000 / 1000));
    $('#cdTimer')?.classList.toggle('out', left < 10 * 60000);
  };
  tick();
  cdTimer = setInterval(tick, 1000);
}

async function submit(){
  state.submitting = true;
  const btn = $('#nextBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spin"></span>Mengirim';

  const payload = buildPayload();
  const result = await saveToSupabase(payload);
  if(!result.ok){
    let error = document.getElementById('bookingError');
    if(!error){error = document.createElement('div');error.id='bookingError';error.setAttribute('role','alert');document.getElementById('s4').prepend(error);}
    error.textContent = result.unavailable
      ? 'Paket atau add-on yang Anda pilih baru saja diperbarui oleh tim Kalaatma. Muat ulang halaman untuk melihat pilihan terbaru; jangan transfer DP sebelum booking berhasil diterima.'
      : 'Booking belum berhasil dikirim. Detail Anda tetap tersedia. Silakan coba lagi; jangan transfer DP sebelum booking berhasil diterima.';
    if(!result.unavailable) console.warn('[Kalaatma] Simpan gagal:', result.reason);
    state.submitting = false;
    syncNav();
    error.scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  document.getElementById('bookingError')?.remove();
  state.booking = payload;

  $('#bidOut').textContent = payload.booking_id;
  $('#payDp').textContent    = rp(payload.estimated_dp);
  $('#payDp2').textContent   = rp(payload.estimated_dp);
  $('#payTotal').textContent = rp(payload.estimated_total);
  $('#payRest').textContent  = rp(payload.estimated_remaining);
  $('#okRows').innerHTML = summaryRows() +
    `<div class="row"><span class="k">Estimated Total</span><span class="v">${rp(payload.estimated_total)}</span></div>` +
    `<div class="row"><span class="k">Estimated DP (${SETTINGS.dpPercent}%)</span><span class="v">${rp(payload.estimated_dp)}</span></div>` +
    `<div class="row"><span class="k">Sisa pelunasan</span><span class="v">${rp(payload.estimated_remaining)}</span></div>`;

  $('#savedNote').innerHTML = result.demo
    ? '<b class="warn">Mode demo</b> — Supabase belum dikonfigurasi, booking ini tidak disimpan.'
    : 'Data booking <b>tersimpan</b> di database Kalaatma.';

  const msg = encodeURIComponent(
    `Halo Kalaatma Pictures, saya mau konfirmasi pembayaran DP.\n\n` +
    `Booking ID: ${payload.booking_id}\n` +
    `Nama: ${payload.bride_name ? payload.bride_name + ' & ' + payload.groom_name : payload.client_name}\n` +
    `Service: ${payload.service}${payload.sub_category ? ' — ' + payload.sub_category : ''}\n` +
    `Package: ${payload.package_name}\n` +
    `Tanggal: ${fmtDate(payload.session_date)}\n` +
    `Jam: ${fmtTime12(payload.session_time)} – ${fmtTime12(payload.session_end_time)} WIB\n` +
    `Lokasi: ${payload.location}\n` +
    (payload.map_link ? `Titik lokasi: ${payload.map_link}\n` : '') +
    `\nTotal: ${rp(payload.estimated_total)}\n` +
    `DP ${SETTINGS.dpPercent}%: ${rp(payload.estimated_dp)}\n\n` +
    `Bukti transfer saya lampirkan di chat ini.`
  );
  $('#waBtn').href = `https://wa.me/${SETTINGS.whatsapp.paymentConfirm}?text=${msg}`;

  btn.innerHTML = 'Konfirmasi booking';
  state.submitting = false;
  goto(5);
  startCountdown(SETTINGS.holdMinutes);
}

$('#copyAcct').onclick = async () => {
  const btn = $('#copyAcct'), no = $('#acctNo').textContent.trim();
  try{ await navigator.clipboard.writeText(no); }
  catch(e){
    const ta = document.createElement('textarea');
    ta.value = no; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); }catch(_){}
    ta.remove();
  }
  btn.textContent = 'Tersalin';
  setTimeout(() => btn.textContent = 'Salin', 1800);
};

$('#homeBtn').onclick = () => {
  Object.assign(state, {step:0, service:null, group:null, pkg:null, addons:{}, people:1, agreed:false, booking:null, map:{link:null,lat:null,lng:null}});
  clearInterval(cdTimer);
  $('#form').reset();
  TP.time?.clear(); TP.endtime?.clear();
  $('#agreeBtn').classList.remove('sel');
  $$('.f').forEach(f => f.classList.remove('bad'));
  goto(0);
};

/* =========================================================
   12. INIT
   ========================================================= */
function holdLabel(min){
  if(min % 60 === 0) return min === 60 ? 'satu jam' : `${min/60} jam`;
  return `${min} menit`;
}
function applySettings(){
  $$('[data-dp-pct]').forEach(el => el.textContent = SETTINGS.dpPercent);
  $('#acctBank').textContent = SETTINGS.bank.name;
  $('#acctNo').textContent   = SETTINGS.bank.accountNo;
  $('#acctName').textContent = 'a.n. ' + SETTINGS.bank.accountName;
  $('#holdLabel').textContent = holdLabel(SETTINGS.holdMinutes);
}

async function init(){
  const [catalog, content] = await Promise.all([loadCatalog(), loadContent()]);
  renderLanding($('#landing'), content, catalog.services);
  document.title = `${content.brand.name} — Book Your Moment`;
  DATA = catalog.services;
  TERMS = catalog.terms;
  SETTINGS = catalog.settings;
  applySettings();

  const localToday = new Date();
  $('#date').min = `${localToday.getFullYear()}-${String(localToday.getMonth()+1).padStart(2,'0')}-${String(localToday.getDate()).padStart(2,'0')}`;
  goto(0);
}
const catalogReady = init();
