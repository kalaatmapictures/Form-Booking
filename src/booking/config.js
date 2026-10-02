/* =========================================================
   KONFIGURASI LINGKUNGAN
   Diisi lewat environment variable (file .env lokal atau
   Project Settings → Environment Variables di Vercel).
   ========================================================= */
export const SUPABASE = {
  url:     import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  table:   'bookings'
};

// Opsional. Kalau diisi, preview peta tampil langsung di form.
// Kalau dikosongkan, form tetap berfungsi penuh (link + koordinat saja).
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const supabaseReady = () => !!(SUPABASE.url && SUPABASE.anonKey);

// Saat development tanpa Supabase, booking disimulasikan supaya
// seluruh alur tampilan (sampai Step 05) tetap bisa dicoba.
export const DEMO_MODE = import.meta.env.DEV && !supabaseReady();
