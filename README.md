# Kalaatma Pictures — Booking

Landing page booking untuk pelanggan Kalaatma Pictures (alur 5 langkah: layanan → paket → detail → konfirmasi → pembayaran DP).
Dibangun dengan Vite (HTML/CSS/JS murni), database Supabase, hosting Vercel.

## Menjalankan lokal

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # hasil di dist/
```

Tanpa `.env`, mode development berjalan sebagai **mode demo**: seluruh alur bisa dicoba sampai Step 05, tetapi booking tidak disimpan.
Di production, booking ditolak dengan pesan error bila Supabase belum dikonfigurasi (supaya pelanggan tidak transfer DP tanpa tercatat).

## Struktur

| File | Isi |
| --- | --- |
| `index.html` | Markup landing page |
| `src/styles/booking.css` | Tampilan |
| `src/booking/catalog.js` | **Menu**: layanan, grup paket, paket, add-on, S&K, label paket, pengaturan (DP %, rekening, WhatsApp, lama tahan jadwal) |
| `src/booking/data.js` | `loadCatalog()` — satu-satunya pintu data menu; nanti diganti ambil dari Supabase |
| `src/booking/config.js` | Konfigurasi dari environment variable |
| `src/booking/main.js` | Logika booking |

## Environment variable

Salin `.env.example` ke `.env`, atau isi di Vercel → Project Settings → Environment Variables:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — penyimpanan booking ke tabel `bookings`
- `VITE_GOOGLE_MAPS_API_KEY` — opsional, preview peta di form lokasi

## Deploy ke Vercel

Import repo ini di Vercel; preset **Vite** terdeteksi otomatis (build `npm run build`, output `dist`).

## Rencana berikutnya

- Tabel Supabase untuk katalog menu + `bookings` (dengan RLS)
- Web admin (`/admin`): kelola menu landing page & dashboard aktivitas admin
