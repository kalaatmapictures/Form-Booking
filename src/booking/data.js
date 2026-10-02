/* =========================================================
   SUMBER DATA MENU
   Satu-satunya pintu masuk data katalog ke landing page.
   Isi katalog diatur dari web admin (/admin). Saat Supabase
   siap, cukup ganti isi loadCatalog() — tampilan tidak berubah.
   ========================================================= */
import { publicCatalog } from '../shared/store.js';

export async function loadCatalog(){
  return publicCatalog();
}
