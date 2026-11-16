# KRSmart

KRSmart adalah aplikasi React untuk menyusun rencana Kartu Rencana Studi (KRS), memeriksa bentrok jadwal, membandingkan beberapa rencana, serta mengimpor dan mengekspor rencana dalam file `.krs`.

## Prasyarat

- Node.js versi 20 atau lebih baru
- npm
- Akun dan project Supabase
- Supabase CLI hanya diperlukan jika ingin menjalankan Edge Function secara lokal

## Instalasi

Clone repository, lalu masuk ke folder proyek:

```bash
git clone <url-repository>
cd krsmart
npm ci
```

Buat file `.env.local` di root proyek. Nilainya dapat ditemukan pada **Supabase Dashboard > Project Settings > API**:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
```

Kedua variabel tersebut wajib diisi karena aplikasi membuat client Supabase saat startup. Jangan masukkan service role key ke file frontend atau commit file `.env.local`.

## Menjalankan mode development

```bash
npm run dev
```

Buka URL yang ditampilkan Vite, biasanya `http://localhost:5173`.

Fitur inti menggunakan `localStorage`, sehingga data rencana tersimpan di browser yang digunakan. Menghapus data site dari browser akan menghapus data lokal tersebut.

## Menjalankan fitur AI

Fitur Asisten AI memanggil Supabase Edge Function `generate-schedule`. Untuk deployment Supabase, atur secret API model pada project:

```bash
supabase secrets set GEMINI_API_KEY=<gemini-api-key>
```

Opsional, tentukan model yang digunakan:

```bash
supabase secrets set GEMINI_MODEL=<model-name>
```

Deploy function dari root proyek:

```bash
supabase functions deploy generate-schedule
```

Untuk menjalankan Supabase secara lokal, pastikan Docker dan Supabase CLI tersedia, kemudian gunakan:

```bash
supabase start
supabase functions serve generate-schedule --env-file .env.local
```

Fitur selain AI tetap dapat dikembangkan di frontend, tetapi konfigurasi client Supabase pada `.env.local` tetap harus tersedia saat aplikasi dijalankan.

## Perintah proyek

```bash
npm run dev
npm run build
npm run preview
npm test
npm run test:watch
npm run lint
```

Build production:

```bash
npm run build
npm run preview
```

## Alur penggunaan

1. Jalankan aplikasi dan buka menu **Data Jadwal**.
2. Tambahkan file `.txt` atau tempel data jadwal kampus, lalu tinjau dan simpan.
3. Buka **Beranda**, buat rencana, dan pilih mata kuliah.
4. Pilih kelas yang diinginkan. Aplikasi akan menandai bentrok waktu, ruang, dan dosen.
5. Gunakan kalender, perbandingan rencana, atau Asisten AI sesuai kebutuhan.
6. Gunakan menu impor/ekspor untuk memindahkan rencana melalui file `.krs`.

## Struktur utama

| Folder | Peran |
| --- | --- |
| `src/presentation/` | Halaman, komponen React, dan hook UI. |
| `src/business/` | Use case, parser, tipe domain, dan aturan bentrok. |
| `src/data/` | Repository, `localStorage`, dan integrasi Supabase. |
| `supabase/functions/` | Edge Function untuk pembuatan jadwal dengan AI. |

## Troubleshooting

### Aplikasi gagal dimuat karena environment variable

Pastikan `.env.local` berada di root proyek dan berisi `VITE_SUPABASE_URL` serta `VITE_SUPABASE_ANON_KEY`. Setelah mengubah file tersebut, hentikan dan jalankan ulang `npm run dev`.

### `npm ci` gagal

Gunakan Node.js 20 atau lebih baru, lalu jalankan kembali `npm ci`. Jangan menghapus `package-lock.json` karena file tersebut digunakan untuk instalasi yang konsisten.

### Asisten AI gagal membuat jadwal

Periksa apakah `GEMINI_API_KEY` sudah disimpan sebagai secret Supabase dan Edge Function sudah dideploy. Periksa juga log function melalui Supabase Dashboard atau `supabase functions logs generate-schedule`.
