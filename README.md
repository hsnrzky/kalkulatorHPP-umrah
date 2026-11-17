# kalkulatorHPP-umrah

Kalkulator biaya umroh dengan dukungan mata uang SAR dan IDR per komponen. Total biaya dan penawaran ditampilkan dalam IDR; biaya SAR dikonversi memakai kurs SAR/IDR yang dapat diperbarui atau diatur manual.

Seluruh halaman kalkulator menggunakan React dan komponen Knowns UI, dengan Tailwind CSS untuk tata letak dan tema. Registry Knowns UI dikonfigurasi di `components.json`.

## Penggunaan

Mulai dari **Biaya & pengaturan** untuk mengisi detail paket dan kurs, lalu tambahkan akomodasi dan transportasi. Input angka memakai format Indonesia dengan titik pemisah ribuan dan koma desimal. Ringkasan menampilkan checklist data, rincian HPP, harga jual, dan gross profit.

## Penyimpanan dan cadangan

Perubahan disimpan otomatis di browser dan perangkat yang sedang digunakan, termasuk saat halaman ditutup atau dimuat ulang. Data tidak tersinkron otomatis ke browser/perangkat lain. Unduh cadangan JSON secara berkala untuk memindahkan atau memulihkan data; pemulihan mengganti paket aktif dan daftar template setelah konfirmasi.

## Instalasi dan penggunaan offline

Setelah aplikasi dibuka melalui HTTPS, gunakan pilihan **Install app / Tambahkan ke layar utama** dari browser. Setelah aset aplikasi selesai dimuat dan tersimpan, kalkulasi dapat digunakan offline; pembaruan kurs otomatis tetap memerlukan internet.
