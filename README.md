# Sistem Informasi Pengelolaan Stok dan Operasional Toko CE ALIN Berbasis Digital

Sistem Informasi Pengelolaan Stok dan Operasional Toko CE ALIN merupakan platform **Digital POS (Point of Sale)** dan **Manajemen Inventaris** terintegrasi. Sistem ini dikembangkan untuk mendigitalisasi proses pencatatan stok, visualisasi tata letak rak fisik, transaksi penjualan kasir, hingga pelaporan otomatis guna meningkatkan efisiensi operasional toko.

---

## 🌟 Fitur Utama

- **Autentikasi Multi-Role**:
  - **Owner**: Kontrol penuh data produk/rak, manajemen target penjualan, laporan keuntungan bersih (profit/loss), serta analisis performa finansial.
  - **Karyawan**: Akses modul kasir, restok barang, pemantauan tata letak rak, serta melihat riwayat transaksi pribadinya selama shift bekerja (tanpa akses ke HPP/keuntungan bersih toko).
- **Interactive Floor Plan (Denah Rak)**: Visualisasi rak fisik toko dengan fitur **Drag & Drop** untuk penyesuaian posisi rak secara dinamis, serta skema warna HSL otomatis berdasarkan inisial blok sektor rak.
- **Manajemen Inventaris & Stok**: Pemantauan stok aktif, visualisasi indikator stok kritis/habis, serta sistem restok barang yang cepat.
- **Point of Sale (POS) Kasir**:
  - Keranjang belanja interaktif.
  - Pengurangan stok barang otomatis setelah checkout.
  - Penerapan potongan harga/diskon langsung secara fleksibel.
- **Integrasi Pembayaran QRIS**: Terintegrasi dengan **Midtrans Sandbox API** untuk pembuatan QR Code QRIS secara real-time dan pemantauan status transaksi otomatis.
- **Cetak Nota Belanja (Thermal Printer)**: Pratinjau struk thermal dengan opsi ukuran kertas **58mm** dan **80mm** (dilengkapi fitur auto-print).
- **WhatsApp API Gateway**: Sistem gateway pengiriman pesan broadcast pemberitahuan toko/promo ke pelanggan menggunakan WhatsApp (berbasis library Baileys).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Vue.js 3 (SFC)
- **Build Tool**: Vite
- **Routing**: Vue Router 4
- **State Management**: Vue 3 Reactive Store
- **Styling**: Vanilla CSS (Premium & Modern Theme) + Bootstrap Icons

### Backend (Laravel API)
- **Framework**: Laravel 11.x
- **Database**: SQLite (Ringan dan portabel tanpa instalasi server DB eksternal)

### WhatsApp Gateway
- **Runtime**: Node.js
- **WhatsApp Web API**: `@whiskeysockets/baileys`
- **HTTP Server**: Express.js & CORS

---

## 📂 Struktur Repositori

```bash
Sistem-Toko-Ce-Alin/
├── frontend/             # Sumber kode Vue.js 3 (Vite)
├── backend/              # Sumber kode Laravel 11 & Node.js WA Gateway
│   ├── app/              # Model, Controller & API Laravel
│   ├── database/         # Migrasi, Seeder, dan database.sqlite
│   ├── config/           # Konfigurasi Laravel & Midtrans
│   └── whatsapp-gateway.cjs  # Layanan Node.js WhatsApp Gateway
├── docs/                 # Dokumentasi blueprint & diagram proyek
└── README.md             # File informasi proyek ini
```

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 📋 Prasyarat
Pastikan Anda sudah menginstal alat-alat berikut di komputer:
1.  **PHP >= 8.2** (dengan ekstensi SQLite aktif)
2.  **Composer** (Manajer dependensi PHP)
3.  **Node.js >= 18** (dengan NPM)

---

### Langkah 1: Persiapan Backend & Database (Laravel)

1. Masuk ke direktori backend:
   ```bash
   cd backend
   ```
2. Instal dependensi PHP dan Node.js:
   ```bash
   composer install
   npm install
   ```
3. Buat file `.env` dengan menyalin `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Jalankan perintah generate application key:
   ```bash
   php artisan key:generate
   ```
5. Buat file database SQLite kosong jika belum ada:
   *   **Windows (PowerShell)**:
       ```powershell
       New-Item -ItemType File -Path database/database.sqlite -Force
       ```
   *   **macOS / Linux / Git Bash**:
       ```bash
       touch database/database.sqlite
       ```
6. Jalankan migrasi tabel beserta pengisian data awal (Seeder):
   ```bash
   php artisan migrate --seed
   ```
7. Jalankan server Laravel lokal:
   ```bash
   php artisan serve
   ```
   *Server Laravel akan berjalan di http://localhost:8000.*

---

### Langkah 2: Menjalankan WhatsApp API Gateway

Layanan ini dibutuhkan untuk menghubungkan WhatsApp toko dengan fitur kirim broadcast.

1. Tetap berada di folder `backend`, buka terminal baru.
2. Jalankan script gateway Node.js:
   ```bash
   node .\whatsapp-gateway.cjs
   ```
   *Layanan Node.js Gateway akan berjalan di port 8082.*

---

### Langkah 3: Persiapan & Menjalankan Frontend (Vue.js 3)

1. Buka terminal baru dan masuk ke direktori frontend:
   ```bash
   cd frontend
   ```
2. Instal dependensi modul Node.js:
   ```bash
   npm install
   ```
3. Jalankan server development Vite:
   ```bash
   npm run dev
   ```
   *Frontend akan berjalan di http://localhost:5173 (atau port default lainnya yang ditunjukkan di terminal).*

---

## 🔑 Akun Uji Coba (Credentials)

Gunakan akun berikut untuk menguji perbedaan hak akses pada sistem setelah database di-seed:

| Peran (Role) | Username | Password | Fitur & Akses Utama |
|---|---|---|---|
| **Owner (Pemilik)** | `owner` | `owner123` | Akses penuh, melihat keuntungan bersih (profit/loss), mengedit target omset harian. |
| **Karyawan (Kasir)** | `karyawan` | `admin123` | Melayani checkout kasir, melihat log transaksi pribadi saja, melihat denah rak. |

---

## 💳 Cara Uji Coba Transaksi QRIS (Midtrans Sandbox)

1. Masuk ke halaman **Kasir**, masukkan barang ke keranjang, lalu klik **Bayar Sekarang**.
2. Pilih metode pembayaran **QRIS** dan klik **Buat QR Code**.
3. Salin **Order ID** sandbox yang ditampilkan (misalnya: `QRIS-1781680688748-190`).
4. Buka tautan [Midtrans QRIS Simulator](https://simulator.sandbox.midtrans.com/qris/index).
5. Tempelkan *Order ID* tersebut ke simulator dan lakukan simulasi bayar (*Pay*).
6. Halaman Kasir toko Anda akan otomatis mendeteksi transaksi lunas dan mencetak struk thermal belanja!

---

## 📄 Lisensi
Proyek ini dibuat untuk kebutuhan akademis dan pembelajaran pada Mata Kuliah Proyek Pemrograman Universitas AMIKOM Yogyakarta.