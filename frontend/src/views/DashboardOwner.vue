<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const handleLogout = () => {
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
              <h1 class="h2 fw-bold text-dark m-0">Dashboard Owner</h1>
            </div>
            <div class="btn-toolbar mb-2 mb-md-0">
              <div class="btn-group me-2">
                <button type="button" class="btn btn-sm btn-outline-secondary">Ekspor Data</button>
                <button type="button" class="btn btn-sm btn-outline-secondary">Laporan Bulanan</button>
              </div>
            </div>
          </div>

          <!-- Alert Welcome -->
          <div class="alert alert-success border-0 shadow-sm d-flex align-items-center p-3 mb-4 rounded-3" role="alert">
            <i class="bi bi-shield-check fs-4 me-3"></i>
            <div>
              <strong>Selamat Datang, Owner!</strong> Anda memiliki hak akses penuh untuk memantau pendapatan, performa toko, dan persetujuan diskon.
            </div>
          </div>

          <!-- Stats Widgets Grid -->
          <div class="row g-4 mb-4">
            <div class="col-md-4">
              <div class="card border-0 shadow-sm rounded-3 p-4 h-100 position-relative overflow-hidden widget-card">
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <span class="text-muted fw-semibold">Total Pendapatan Bulan Ini</span>
                  <div class="icon-shape bg-success-light text-success rounded-3 p-2">
                    <i class="bi bi-cash-stack fs-4"></i>
                  </div>
                </div>
                <h3 class="fw-bold mb-2">Rp 45.230.000</h3>
                <span class="text-success small fw-semibold">
                  <i class="bi bi-arrow-up-right me-1"></i>+18.4% dibanding bulan lalu
                </span>
              </div>
            </div>

            <div class="col-md-4">
              <div class="card border-0 shadow-sm rounded-3 p-4 h-100 position-relative overflow-hidden widget-card">
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <span class="text-muted fw-semibold">Persetujuan Diskon Menunggu</span>
                  <div class="icon-shape bg-danger-light text-danger rounded-3 p-2">
                    <i class="bi bi-percent fs-4"></i>
                  </div>
                </div>
                <h3 class="fw-bold mb-2">3 Pengajuan</h3>
                <span class="text-danger small fw-semibold">
                  <i class="bi bi-clock-history me-1"></i>Butuh persetujuan segera
                </span>
              </div>
            </div>

            <div class="col-md-4">
              <div class="card border-0 shadow-sm rounded-3 p-4 h-100 position-relative overflow-hidden widget-card">
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <span class="text-muted fw-semibold">Karyawan Aktif Shift Ini</span>
                  <div class="icon-shape bg-info-light text-info rounded-3 p-2">
                    <i class="bi bi-people fs-4"></i>
                  </div>
                </div>
                <h3 class="fw-bold mb-2">4 Orang</h3>
                <span class="text-muted small">Toko Buka (Shift Pagi)</span>
              </div>
            </div>
          </div>

          <!-- Approval discount section -->
          <div class="card border-0 shadow-sm rounded-3 p-4 mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h2 class="h5 fw-bold text-dark m-0">Menunggu Persetujuan Diskon</h2>
              <span class="badge bg-danger">3 Baru</span>
            </div>
            <div class="table-responsive">
              <table class="table align-middle table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Karyawan</th>
                    <th>Nama Barang</th>
                    <th>Harga Asli</th>
                    <th>Permintaan Diskon</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Galang (Kasir)</td>
                    <td>Susu Dancow 800g</td>
                    <td>Rp 95.000</td>
                    <td class="text-danger fw-semibold">Rp 85.000 (-10.5%)</td>
                    <td>
                      <button class="btn btn-sm btn-success me-2"><i class="bi bi-check-lg"></i> Setuju</button>
                      <button class="btn btn-sm btn-outline-danger"><i class="bi bi-x-lg"></i> Tolak</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Ulfi (Kasir)</td>
                    <td>Minyak Goreng Sunco 2L</td>
                    <td>Rp 38.500</td>
                    <td class="text-danger fw-semibold">Rp 35.000 (-9.1%)</td>
                    <td>
                      <button class="btn btn-sm btn-success me-2"><i class="bi bi-check-lg"></i> Setuju</button>
                      <button class="btn btn-sm btn-outline-danger"><i class="bi bi-x-lg"></i> Tolak</button>
                    </td>
                  </tr>
                </tbody>
              </table>
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
.bg-success-light {
  background-color: rgba(40, 167, 69, 0.1);
}
.bg-danger-light {
  background-color: rgba(220, 53, 69, 0.1);
}
.bg-info-light {
  background-color: rgba(23, 162, 184, 0.1);
}
.icon-shape {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
