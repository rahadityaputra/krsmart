# KRSmart

KRSmart adalah aplikasi web untuk membantu mahasiswa merencanakan Kartu Rencana Studi (KRS). Pengguna dapat mengimpor jadwal dari kampus, memilih mata kuliah dan kelas paralel, memeriksa bentrok, serta melihat total SKS dalam satu rencana. Rencana bisa diduplikasi untuk menyiapkan jadwal cadangan.

## Fitur

- **Data jadwal dosen.** Unggah file `.txt` atau tempel teks jadwal dari web kampus. Tinjau hasil impor dalam tabel sebelum menyimpannya sebagai sumber data.
- **Rencana KRS.** Buat, cari, buka, duplikasi, atau hapus rencana dari Beranda. Setiap rencana menggunakan sumber jadwal yang dipilih saat dibuat.
- **Pemilihan kelas.** Pilih mata kuliah, lalu bandingkan opsi kelas berdasarkan hari, jam, ruang, dan dosen. Kelas yang waktunya bertabrakan dengan pilihan saat ini tampil di tab **Kelas bentrok** beserta alasannya.
- **Kalender dan SKS.** Tinjau kelas terpilih dalam kalender mingguan, lihat jeda antarkelas, dan atur batas SKS opsional untuk mendapat peringatan saat totalnya terlampaui.

## Cara menjalankan

Siapkan Node.js dan npm. Jalankan perintah berikut dari folder `krsmart`.

```bash
npm ci
npm run dev
```

Buka alamat lokal yang ditampilkan Vite di terminal. Untuk menjalankan tes yang tersedia, gunakan `npm test`.

## Cara menggunakan

1. Buka **Data Jadwal** dan pilih **Tambah sumber data**. Beri nama sumber, unggah atau tempel teks jadwal, lalu pilih **Tinjau jadwal** dan simpan.
2. Kembali ke **Beranda**, pilih **Tambah rencana**, lalu masukkan nama rencana dan pilih sumber data.
3. Centang mata kuliah yang ingin diambil, lalu klik **Lanjut pilih kelas**.
4. Gunakan tab **Pilih kelas**, **Kelas terpilih**, dan **Kelas bentrok** di bawah kalender untuk meninjau dan menyesuaikan jadwal.

## Penyimpanan dan status fitur

Sumber jadwal dan kelas yang sudah dipilih tersimpan otomatis di browser melalui `localStorage`. Aplikasi dapat digunakan tanpa akun. Centang mata kuliah yang belum memiliki kelas masih tersimpan sementara di halaman perencana.

Impor dan ekspor file `.krs`, pengeditan sumber jadwal, serta asisten penjadwalan melalui Supabase Edge Function masih dalam pengembangan.

## Struktur proyek

| Folder | Isi |
| --- | --- |
| `src/presentation/` | Halaman, komponen React, dan custom hook untuk menghubungkan UI ke use case. |
| `src/business/` | Use case perencana, parser jadwal, dan aturan deteksi bentrok. |
| `src/data/` | Repository dan penyimpanan lokal di browser. |
| `supabase/functions/` | Edge Function untuk integrasi model bahasa. |

Antarmuka menggunakan React, TypeScript, Vite, dan Radix UI untuk dialog. Alur inti perencanaan berjalan di browser.
