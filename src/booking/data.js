/* =========================================================
   SUMBER DATA MENU
   Satu-satunya pintu masuk data katalog ke landing page.
   Saat web admin + tabel Supabase siap, cukup ganti isi
   loadCatalog() untuk mengambil data dari database — bagian
   tampilan tidak perlu diubah.
   ========================================================= */
import { SERVICES, TERMS, PACKAGE_HIGHLIGHTS, SETTINGS } from './catalog.js';

export async function loadCatalog(){
  return {
    services:   SERVICES,
    terms:      TERMS,
    highlights: PACKAGE_HIGHLIGHTS,
    settings:   SETTINGS
  };
}
