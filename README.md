# Rihlah — Kalkulator HPP Umrah

Aplikasi untuk menyusun biaya paket umrah, menghitung harga pokok penjualan (HPP), dan menyiapkan penawaran harga secara terstruktur.

## Fitur

- Mencatat biaya dalam SAR dan IDR, dengan konversi SAR/IDR menggunakan kurs otomatis atau manual.
- Mengelola akomodasi, transportasi, biaya langsung, biaya bersama, dan biaya tambahan.
- Menghitung HPP, harga jual, margin, serta proyeksi keuangan grup.
- Menampilkan ringkasan audit dan checklist kelengkapan data.
- Mencetak ringkasan audit dan penawaran paket ke PDF.
- Menggunakan aplikasi secara offline setelah aset tersimpan di perangkat.

## Teknologi

Dibangun menggunakan React, Vite, Tailwind CSS, dan komponen Knowns UI.

## Menjalankan aplikasi

Persyaratan: Node.js dan npm.

```bash
npm install
npm run dev
```

Vite akan menampilkan alamat lokal aplikasi di terminal.

### Build dan pratinjau

```bash
npm run build
npm run preview
```

Build produksi disimpan di direktori `dist/`.

### Deploy ke GitHub Pages

```bash
npm run deploy
```

Perintah deploy akan membangun aplikasi dan menerbitkan hasil build ke branch `pages`.

## Data dan cadangan

Data paket, template, dan preferensi disimpan di browser pada perangkat yang sedang digunakan. Data tidak disinkronkan otomatis ke perangkat lain. Gunakan fitur ekspor dan impor cadangan JSON untuk memindahkan atau memulihkan data. Proses pemulihan mengganti paket aktif dan daftar template setelah konfirmasi.

## Penggunaan offline

Buka aplikasi melalui HTTPS, lalu pilih **Install app / Tambahkan ke layar utama** dari browser jika tersedia. Setelah versi terbaru dimuat dan asetnya tersimpan, kalkulator dapat digunakan tanpa koneksi internet. Untuk menerima pembaruan aplikasi, buka kembali aplikasi saat online. Pembaruan kurs otomatis tetap memerlukan internet.

## Penggunaan dasar

1. Isi detail paket dan kurs pada halaman **Pengaturan**.
2. Masukkan akomodasi, transportasi, dan biaya lainnya.
3. Tinjau HPP, harga jual, margin, alokasi, dan checklist pada halaman **Ringkasan**.
4. Pilih **Cetak ke PDF** untuk membuat ringkasan audit atau buka **Penawaran paket** untuk mencetak penawaran.

Input angka mengikuti format Indonesia, dengan titik sebagai pemisah ribuan dan koma sebagai pemisah desimal.
