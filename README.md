# Kalaatma Pictures — Booking

Landing page booking untuk pelanggan (alur 5 langkah: layanan → paket → detail → konfirmasi → pembayaran DP).
Menunya diatur dari web admin di repo terpisah: [`web-admin-booking`](https://github.com/marselcerebrum-jpg/web-admin-booking).

Dibangun dengan Vite (HTML/CSS/JS murni), database Supabase, hosting Vercel.

## Menjalankan lokal

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # hasil di dist/
```

Tanpa `.env`, mode development berjalan sebagai **mode demo**: seluruh alur bisa dicoba sampai Step 05, tetapi booking tidak disimpan.
Di production, booking ditolak dengan pesan error bila Supabase belum dikonfigurasi (supaya pelanggan tidak transfer DP tanpa tercatat).

## Terhubung dengan web admin

Admin dan landing page memakai project Supabase yang sama:

- Landing page membaca menu dari tabel `app_config` (key `catalog`) setiap kali dibuka, lalu mengirim booking ke tabel `bookings`.
- Format menu ditetapkan di `src/shared/catalog.js`. File ini **identik** dengan yang ada di repo admin.
- Bila Supabase belum diisi, belum ada menu tersimpan, atau database tidak bisa dihubungi, landing page memakai pricelist bawaan (`src/shared/catalog-default.js`).

Skema tabel dan langkah setup ada di repo admin (`supabase/schema.sql`).

## Struktur

| File | Isi |
| --- | --- |
| `index.html` | Markup landing page |
| `src/styles/booking.css` | Tampilan |
| `src/shared/catalog.js` | Kontrak format menu (sama dengan repo admin) |
| `src/shared/catalog-default.js` | Pricelist bawaan Kalaatma 2026 |
| `src/booking/data.js` | `loadCatalog()`: ambil menu dari Supabase, atau pricelist bawaan |
| `src/booking/config.js` | Konfigurasi dari environment variable |
| `src/booking/main.js` | Logika booking |

## Environment variable

Salin `.env.example` ke `.env`, atau isi di Vercel → Project Settings → Environment Variables:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — membaca menu & menyimpan booking (project yang sama dengan admin)
- `VITE_GOOGLE_MAPS_API_KEY` — opsional, preview peta di form lokasi

## Deploy ke Vercel

Import repo ini di Vercel; preset **Vite** terdeteksi otomatis (build `npm run build`, output `dist`).

## Rencana berikutnya

- Setup project Supabase (lihat README repo admin)
- Daftar booking masuk di dashboard admin
