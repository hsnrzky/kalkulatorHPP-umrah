# kalkulatorHPP-umrah

Kalkulator biaya umroh dengan dukungan mata uang SAR dan IDR per komponen. Total biaya dan penawaran ditampilkan dalam IDR; biaya SAR dikonversi memakai kurs SAR/IDR yang dapat diperbarui atau diatur manual.

Seluruh halaman kalkulator menggunakan React dan komponen Knowns UI, dengan Tailwind CSS untuk tata letak dan tema. Registry Knowns UI dikonfigurasi di `components.json`.

## Penggunaan

Mulai dari **Biaya & pengaturan** untuk mengisi detail paket dan kurs, lalu tambahkan akomodasi dan transportasi. Ringkasan menampilkan checklist data yang perlu ditinjau serta rincian HPP per jamaah. Kurs yang diatur manual tidak diganti otomatis tanpa konfirmasi.

## Penyimpanan dan cadangan

Data disimpan otomatis pada browser dan perangkat yang sedang digunakan. Unduh cadangan JSON secara berkala untuk memindahkan atau memulihkan data; pemulihan mengganti paket aktif dan daftar template setelah konfirmasi. Template menyimpan salinan konfigurasi untuk digunakan kembali tanpa mengubah paket aktif sampai dipilih.
