# Kalaatma Pictures — Booking

- **`/`** — landing page booking untuk pelanggan (alur 5 langkah: layanan → paket → detail → konfirmasi → pembayaran DP).
- **`/admin/`** — web admin: dashboard, kelola menu (layanan, grup paket, paket, add-on), syarat & ketentuan, pengaturan pembayaran/kontak, dan log aktivitas admin.

Dibangun dengan Vite (HTML/CSS/JS murni), database Supabase, hosting Vercel.

## Menjalankan lokal

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # hasil di dist/
```

Tanpa `.env`, mode development berjalan sebagai **mode demo**: seluruh alur bisa dicoba sampai Step 05, tetapi booking tidak disimpan.
Di production, booking ditolak dengan pesan error bila Supabase belum dikonfigurasi (supaya pelanggan tidak transfer DP tanpa tercatat).

## Mode lokal (sementara)

Belum tersambung ke Supabase. Perubahan dari admin disimpan di `localStorage` browser dan langsung dipakai landing page **di browser yang sama** (muat ulang halaman booking untuk melihatnya). Gunakan *Pengaturan → Ekspor JSON* untuk mencadangkan menu. Admin belum memakai login — akan memakai Supabase Auth.

## Struktur

| File | Isi |
| --- | --- |
| `index.html` | Markup landing page |
| `src/styles/booking.css` | Tampilan |
| `src/booking/catalog.js` | **Menu bawaan**: layanan, grup paket, paket, add-on, S&K, label paket, pengaturan (DP %, rekening, WhatsApp, lama tahan jadwal) |
| `src/booking/data.js` | `loadCatalog()` — satu-satunya pintu data menu ke landing page |
| `src/booking/config.js` | Konfigurasi dari environment variable |
| `src/booking/main.js` | Logika booking |
| `src/shared/store.js` | Penyimpanan katalog & log aktivitas (localStorage, nanti Supabase) |
| `admin/index.html`, `src/admin/` | Web admin |

## Environment variable

Salin `.env.example` ke `.env`, atau isi di Vercel → Project Settings → Environment Variables:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — penyimpanan booking ke tabel `bookings`
- `VITE_GOOGLE_MAPS_API_KEY` — opsional, preview peta di form lokasi

## Deploy ke Vercel

Import repo ini di Vercel; preset **Vite** terdeteksi otomatis (build `npm run build`, output `dist`).

## Rencana berikutnya

- Tabel Supabase untuk katalog menu, log aktivitas, dan `bookings` (dengan RLS)
- Login admin dengan Supabase Auth
- Data booking masuk di dashboard admin
