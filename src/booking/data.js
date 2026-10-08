/* =========================================================
   SUMBER DATA MENU
   Menu diatur dari web admin (repo web-admin-booking) dan
   disimpan di Supabase (tabel app_config, key 'catalog').
   Bila Supabase belum dikonfigurasi atau tidak bisa dihubungi,
   landing page memakai pricelist bawaan supaya tetap berfungsi.
   ========================================================= */
import { SUPABASE, supabaseReady } from './config.js';
import { CATALOG_KEY, defaultCatalog, publicCatalog, isCatalog } from '../shared/catalog.js';
import { CONTENT_KEY, defaultContent, mergeContent } from '../shared/content.js';

async function fetchCatalog(){
  const base = SUPABASE.url.replace(/\/+$/, '');
  const res = await fetch(`${base}/rest/v1/app_config?key=eq.${CATALOG_KEY}&select=value`, {
    headers:{ apikey:SUPABASE.anonKey, Authorization:'Bearer ' + SUPABASE.anonKey }
  });
  if(!res.ok) throw new Error(`${res.status} — ${await res.text()}`);
  const rows = await res.json();
  return rows[0] && isCatalog(rows[0].value) ? rows[0].value : null;
}

/* Konten landing page (teks & foto), diatur di web admin → Menu → Konten. */
export async function loadContent(){
  if(!supabaseReady()) return defaultContent();
  try{
    const base = SUPABASE.url.replace(/\/+$/, '');
    const res = await fetch(`${base}/rest/v1/app_config?key=eq.${CONTENT_KEY}&select=value`, {
      headers:{ apikey:SUPABASE.anonKey, Authorization:'Bearer ' + SUPABASE.anonKey }
    });
    if(!res.ok) throw new Error(`${res.status} — ${await res.text()}`);
    const rows = await res.json();
    return mergeContent(rows[0]?.value);
  }catch(err){
    console.warn('[Kalaatma] Gagal memuat konten, memakai konten bawaan:', err.message);
    return defaultContent();
  }
}

export async function loadCatalog(){
  if(supabaseReady()){
    try{
      const catalog = await fetchCatalog();
      if(catalog) return publicCatalog(catalog);
      console.info('[Kalaatma] Menu belum diatur dari admin — memakai pricelist bawaan.');
    }catch(err){
      console.warn('[Kalaatma] Gagal memuat menu dari Supabase, memakai pricelist bawaan:', err.message);
    }
  }
  return publicCatalog(defaultCatalog());
}
