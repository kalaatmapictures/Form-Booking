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

## Terhubung dengan BMS (web admin)

Landing page dan BMS ([`web-admin-booking`](https://github.com/marselcerebrum-jpg/web-admin-booking)) memakai satu project Supabase:

- Menu (layanan, paket, harga, add-on, S&K, DP %, rekening, WhatsApp) dibaca dari tabel `app_config` setiap kali halaman dibuka, jadi perubahan di BMS langsung tampil.
- Booking dikirim ke tabel `bookings` dan muncul di BMS sebagai booking baru (Joblist kolom Booking).
- Harga booking dihitung ulang oleh database dari menu terbaru; bila paket baru saja dinonaktifkan admin, pelanggan diminta memuat ulang halaman.
- Format menu ditetapkan di `src/shared/catalog.js`, **identik** dengan repo BMS.
- Bila Supabase belum diisi, belum ada menu tersimpan, atau database tidak bisa dihubungi, landing page memakai pricelist bawaan.

Skema database & langkah setup: repo BMS, `supabase/schema.sql` dan README-nya.

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
