/* =========================================================
   PENYIMPANAN KATALOG & LOG AKTIVITAS
   Dipakai bersama oleh landing page dan web admin.
   Sementara disimpan di localStorage browser; nanti diganti
   ke Supabase tanpa mengubah tampilan.
   ========================================================= */
import { SERVICES, TERMS, PACKAGE_HIGHLIGHTS, SETTINGS } from '../booking/catalog.js';

const CATALOG_KEY  = 'kalaatma.catalog.v1';
const ACTIVITY_KEY = 'kalaatma.activity.v1';
const ACTIVITY_MAX = 500;

const clone = v => JSON.parse(JSON.stringify(v));

function read(key){
  try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch(_){ return null; }
}
function write(key, value){
  try{ localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch(_){ return false; }
}

/* Katalog bawaan dalam bentuk yang bisa diedit:
   layanan berupa array (urutan bisa diatur), label paket
   (recommended / best seller) melekat di tiap paket. */
export function defaultCatalog(){
  const rec = new Set(PACKAGE_HIGHLIGHTS.recommendedIds);
  const best = new Set(PACKAGE_HIGHLIGHTS.bestSellerIds);
  return {
    services: Object.entries(clone(SERVICES)).map(([id, s]) => ({
      id, ...s, hidden:false,
      groups: s.groups.map(g => ({
        ...g,
        packages: g.packages.map(p => ({
          ...p, hidden:false,
          recommended: rec.has(p.id) || !!p.recommended,
          bestSeller:  best.has(p.id) || !!p.bestSeller
        }))
      })),
      addons: s.addons.map(a => ({...a, hidden:false}))
    })),
    terms: clone(TERMS),
    settings: clone(SETTINGS)
  };
}

export function getCatalog(){
  const stored = read(CATALOG_KEY);
  if(stored && Array.isArray(stored.services)) return stored;
  return defaultCatalog();
}
export function saveCatalog(catalog){ return write(CATALOG_KEY, catalog); }
export function resetCatalog(){
  try{ localStorage.removeItem(CATALOG_KEY); }catch(_){}
  return defaultCatalog();
}
export const hasCustomCatalog = () => !!read(CATALOG_KEY);

/* Versi untuk pelanggan: item yang disembunyikan dibuang. */
export function publicCatalog(catalog = getCatalog()){
  const services = {};
  for(const s of catalog.services){
    if(s.hidden) continue;
    const groups = s.groups
      .map(g => ({...g, packages: g.packages.filter(p => !p.hidden)}))
      .filter(g => g.packages.length);
    if(!groups.length) continue;
    services[s.id] = {...s, groups, addons: s.addons.filter(a => !a.hidden)};
  }
  return { services, terms: catalog.terms, settings: catalog.settings };
}

/* ---------- log aktivitas admin ---------- */
export function getActivity(){ return read(ACTIVITY_KEY) || []; }
export function logActivity(entry){
  const list = getActivity();
  list.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    at: new Date().toISOString(),
    actor: 'Admin',
    ...entry
  });
  write(ACTIVITY_KEY, list.slice(0, ACTIVITY_MAX));
  return list[0];
}
export function clearActivity(){ try{ localStorage.removeItem(ACTIVITY_KEY); }catch(_){} }
