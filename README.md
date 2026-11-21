# Panduan SegarKite (Supabase + GitHub Pages)

Backend sudah terpasang di project Supabase "SegarKite" (tabel produk, pesanan, aduan, pengaturan, penyimpanan foto, dan fungsi server `api`). File `index.html` sudah berisi alamat fungsi server tersebut.

## 1. Isi PIN admin (WAJIB, 2 menit, bisa dari HP)
1. Buka supabase.com/dashboard, pilih project **SegarKite**.
2. Menu **Edge Functions → Secrets** (atau Project Settings → Edge Functions → Secrets).
3. **Add new secret**. Name: `ADMIN_PIN`. Value: PIN rahasia Anda, minimal 4 angka (disarankan 6 angka). Save.
Tanpa langkah ini login admin akan menolak dengan pesan "PIN admin belum diatur".
Lima kali salah PIN mengunci login 10 menit. Untuk mengganti PIN, ubah nilai secret yang sama.

## 2. Coba di perangkat sendiri
Buka `index.html` di browser. Toko memuat 16 produk contoh dari Supabase. Admin: tambahkan `#admin` di alamat, masukkan PIN.
Pertama kali, buka tab **Keuangan** dan isi HPP produk yang masih 0.

## 3. Publikasikan lewat GitHub Pages
1. Di github.com buat repositori baru, mis. `segarkite-shop` (Public).
2. **Add file → Upload files**, unggah `index.html`, lalu **Commit changes**.
3. **Settings → Pages**. Source: *Deploy from a branch*. Branch: `main`, folder `/ (root)`. Save.
4. Tunggu 1-2 menit. Toko aktif di `https://NAMA-GITHUB.github.io/segarkite-shop/`. Admin: tambahkan `#admin`.
Mengubah tampilan di kemudian hari: unggah ulang `index.html` (Add file → Upload files, timpa).

Aman untuk repo publik: `index.html` hanya berisi alamat fungsi server. PIN ada di Supabase, dan HPP/margin hanya dikirim ke admin yang sudah login.

## 4. Mengelola toko (alamat toko + `#admin`)
- Pesanan: ubah status, kabari pelanggan via WhatsApp, Rekap belanja subuh. Pembatalan mengembalikan stok.
- Produk: foto (unggah langsung), harga, HPP, biaya kemas, stok, pilihan potongan/kemasan, flash sale.
- Keuangan: omzet, HPP, margin, OPEX, laba bersih estimasi, titik impas, tabel Harga & Margin.
- Promo & Tampilan, Pengaturan (logo, kontak, peta, cara terima, pembayaran, buka/tutup), Aduan.
- Data & Backup: unduh CSV pesanan, serta produk dengan HPP dan margin. Lakukan rutin sebagai cadangan.

## 5. Google Sheet
Belum tersambung. Sementara gunakan unduh CSV lalu buka di Google Sheets. Saat perangkat Anda mendukung, sambungan otomatis dapat ditambahkan tanpa mengubah toko.

## 6. Catatan
- Nomor pesanan dibuat server dan atomik: kunci unik, pengecekan keranjang kembar dalam 3 menit, stok dan kuota sesi dikunci saat memesan.
- Free plan Supabase cukup untuk toko kecil. Project yang tidak aktif lama bisa dijeda otomatis, jadi buka toko atau dashboard secara berkala.
- Gratis ongkir kurir toko default Rp 100.000 (ubah di Pengaturan).
