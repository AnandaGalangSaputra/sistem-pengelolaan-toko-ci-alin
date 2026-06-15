<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const handleLogout = () => {
  // Clear any state if needed, then redirect to login
  router.push('/login')
}
</script>

<template>
  <div class="dashboard-wrapper">
    <!-- Header -->
    <header class="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-3 shadow-sm">
      <a class="navbar-brand col-md-3 col-lg-2 me-0 px-3 fs-5 fw-bold" href="#">
        <i class="bi bi-shop me-2 text-primary"></i>Toko Ce ALin
      </a>
      <div class="navbar-nav">
        <div class="nav-item text-nowrap px-3">
          <button @click="handleLogout" class="btn btn-outline-light btn-sm border-0 fw-semibold">
            <i class="bi bi-box-arrow-right me-2"></i>Keluar
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="container-fluid py-4">
      <div class="row justify-content-center">
        <main class="col-md-9 col-lg-10 px-md-4">
          <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-4 border-bottom">
            <div>
              <span class="text-muted small fw-semibold text-uppercase tracking-wider">Aplikasi Pengelolaan Toko</span>
              <h1 class="h2 fw-bold text-dark m-0">Dashboard Karyawan</h1>
            </div>
            <div class="btn-toolbar mb-2 mb-md-0">
              <div class="btn-group me-2">
                <button type="button" class="btn btn-sm btn-outline-secondary">
                  <i class="bi bi-calendar-event me-2"></i>Hari Ini
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary">Laporan</button>
              </div>
            </div>
          </div>

          <!-- Alert Welcome -->
          <div class="alert alert-primary border-0 shadow-sm d-flex align-items-center p-3 mb-4 rounded-3" role="alert">
            <i class="bi bi-info-circle-fill fs-4 me-3"></i>
            <div>
              <strong>Selamat Bekerja!</strong> Anda masuk sebagai <strong>Karyawan</strong>. Silakan kelola stok dan kasir dengan teliti.
            </div>
          </div>

          <!-- Stats Widgets Grid -->
          <div class="row g-4 mb-4">
            <div class="col-md-4">
              <div class="card border-0 shadow-sm rounded-3 p-4 h-100 position-relative overflow-hidden widget-card">
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <span class="text-muted fw-semibold">Transaksi Hari Ini</span>
                  <div class="icon-shape bg-primary-light text-primary rounded-3 p-2">
                    <i class="bi bi-cart-check fs-4"></i>
                  </div>
                </div>
                <h3 class="fw-bold mb-2">24 Transaksi</h3>
                <span class="text-success small fw-semibold">
                  <i class="bi bi-arrow-up-right me-1"></i>+12% dibanding kemarin
                </span>
              </div>
            </div>

            <div class="col-md-4">
              <div class="card border-0 shadow-sm rounded-3 p-4 h-100 position-relative overflow-hidden widget-card">
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <span class="text-muted fw-semibold">Stok Barang Menipis</span>
                  <div class="icon-shape bg-warning-light text-warning rounded-3 p-2">
                    <i class="bi bi-box-seam fs-4"></i>
                  </div>
                </div>
                <h3 class="fw-bold mb-2">8 Barang</h3>
                <span class="text-danger small fw-semibold">
                  <i class="bi bi-exclamation-triangle me-1"></i>Perlu restock segera
                </span>
              </div>
            </div>

            <div class="col-md-4">
              <div class="card border-0 shadow-sm rounded-3 p-4 h-100 position-relative overflow-hidden widget-card">
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <span class="text-muted fw-semibold">Pencarian Rak Terbanyak</span>
                  <div class="icon-shape bg-info-light text-info rounded-3 p-2">
                    <i class="bi bi-search fs-4"></i>
                  </div>
                </div>
                <h3 class="fw-bold mb-2">Rak B (Susu Anak)</h3>
                <span class="text-muted small">Diakses oleh 15 karyawan</span>
              </div>
            </div>
          </div>

          <!-- Feature Quick Actions -->
          <h2 class="h5 fw-bold text-dark mb-3">Akses Cepat Fitur</h2>
          <div class="row g-4">
            <div class="col-md-6 col-lg-4">
              <div class="card border-0 shadow-sm rounded-3 h-100 p-3 card-hover">
                <div class="card-body d-flex align-items-center">
                  <div class="feature-icon bg-primary text-white rounded-3 p-3 me-3">
                    <i class="bi bi-printer fs-4"></i>
                  </div>
                  <div>
                    <h5 class="fw-bold mb-1 fs-6">Kasir & Transaksi</h5>
                    <p class="text-muted small m-0">Input belanjaan dan cetak nota kasir.</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-6 col-lg-4">
              <div class="card border-0 shadow-sm rounded-3 h-100 p-3 card-hover">
                <div class="card-body d-flex align-items-center">
                  <div class="feature-icon bg-success text-white rounded-3 p-3 me-3">
                    <i class="bi bi-journal-check fs-4"></i>
                  </div>
                  <div>
                    <h5 class="fw-bold mb-1 fs-6">Manajemen Stok</h5>
                    <p class="text-muted small m-0">Perbarui jumlah dan lokasi rak barang.</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-6 col-lg-4">
              <div class="card border-0 shadow-sm rounded-3 h-100 p-3 card-hover">
                <div class="card-body d-flex align-items-center">
                  <div class="feature-icon bg-info text-white rounded-3 p-3 me-3">
                    <i class="bi bi-upc-scan fs-4"></i>
                  </div>
                  <div>
                    <h5 class="fw-bold mb-1 fs-6">Scan Barcode</h5>
                    <p class="text-muted small m-0">Cek info produk langsung via scan.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-wrapper {
  background-color: #f8f9fa;
  min-height: 100vh;
}
.tracking-wider {
  letter-spacing: 0.05em;
}
.bg-primary-light {
  background-color: rgba(22, 96, 207, 0.1);
}
.bg-warning-light {
  background-color: rgba(255, 193, 7, 0.15);
}
.bg-info-light {
  background-color: rgba(13, 202, 240, 0.15);
}
.card-hover {
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.card-hover:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08) !important;
}
.icon-shape {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
