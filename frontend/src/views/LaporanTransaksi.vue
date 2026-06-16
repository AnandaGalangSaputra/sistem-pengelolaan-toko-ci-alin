<script setup>
import { computed } from 'vue'
import { state } from '../store/store.js'

const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

// Compute statistics from store transactions
const transactionsList = computed(() => state.transactions)

const totalRevenue = computed(() => {
  const simRevenue = state.transactions.reduce((acc, tx) => acc + tx.total, 0)
  return 2450000 + simRevenue // Baseline 2.45M + new sales
})

const totalDiscounts = computed(() => {
  return state.transactions.reduce((acc, tx) => acc + tx.discount, 0) + 15000 // Baseline 15k + new discounts
})

const totalTransactionsCount = computed(() => state.transactions.length + 42) // Baseline 42 + new sales

const totalItemsSold = computed(() => {
  return state.transactions.reduce((acc, tx) => acc + tx.itemsCount, 0) + 112 // Baseline 112 + new sales
})

const avgTransactionValue = computed(() => {
  if (totalTransactionsCount.value === 0) return 0
  return totalRevenue.value / totalTransactionsCount.value
})

// Target achievement percentage
const salesTarget = 3000000
const targetPercent = computed(() => {
  return Math.min(100, Math.round((totalRevenue.value / salesTarget) * 100))
})
</script>

<template>
  <div class="laporan-wrapper">
    <!-- Page Title -->
    <div class="content-header mb-4">
      <h1 class="page-title">Laporan Transaksi</h1>
      <p class="page-subtitle">Analisis hasil penjualan, omset omzet harian, potongan diskon, dan capaian target Toko Ce Alin.</p>
    </div>

    <!-- Stats Cards -->
    <div class="row g-4 mb-4">
      <div class="col-12 col-md-3">
        <div class="metrics-card">
          <div class="card-body">
            <div class="card-icon-container icon-success">
              <i class="bi bi-wallet-fill text-success"></i>
            </div>
            <div class="card-info">
              <span class="card-label">Total Omset Hari Ini</span>
              <span class="card-value text-success">{{ formatRupiah(totalRevenue) }}</span>
            </div>
            <div class="card-bottom text-muted">
              <span>Target harian: {{ formatRupiah(salesTarget) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-3">
        <div class="metrics-card">
          <div class="card-body">
            <div class="card-icon-container text-primary" style="background-color: #e0f2fe; color: #0284c7;">
              <i class="bi bi-calculator-fill"></i>
            </div>
            <div class="card-info">
              <span class="card-label">Jumlah Transaksi</span>
              <span class="card-value text-dark">{{ totalTransactionsCount }}</span>
            </div>
            <div class="card-bottom text-muted">
              <span>Rata-rata: {{ formatRupiah(avgTransactionValue) }} / tx</span>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-3">
        <div class="metrics-card">
          <div class="card-body">
            <div class="card-icon-container" style="background-color: #fef3c7; color: #d97706;">
              <i class="bi bi-cart-check-fill"></i>
            </div>
            <div class="card-info">
              <span class="card-label">Barang Terjual</span>
              <span class="card-value text-dark">{{ totalItemsSold }} unit</span>
            </div>
            <div class="card-bottom text-muted">
              <span>Produk fisik dipotong stok</span>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-3">
        <div class="metrics-card">
          <div class="card-body">
            <div class="card-icon-container icon-warning">
              <i class="bi bi-tags-fill"></i>
            </div>
            <div class="card-info">
              <span class="card-label">Diskon Transaksi</span>
              <span class="card-value text-danger">{{ formatRupiah(totalDiscounts) }}</span>
            </div>
            <div class="card-bottom text-danger">
              <span>Total potongan harga langsung</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Target Progress Card -->
    <div class="card-content-box shadow-sm mb-4">
      <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap">
        <div>
          <h5 class="fw-bold text-dark mb-1">Pencapaian Target Penjualan Harian</h5>
          <p class="text-muted small mb-0">Presentase omset terkumpul dibanding target harian toko.</p>
        </div>
        <div class="text-end">
          <span class="fs-4 fw-bold text-primary">{{ targetPercent }}%</span>
          <span class="text-muted small d-block">{{ formatRupiah(totalRevenue) }} / {{ formatRupiah(salesTarget) }}</span>
        </div>
      </div>
      <div class="progress" style="height: 12px; background-color: #f1f5f9; border-radius: 6px;">
        <div 
          class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
          role="progressbar" 
          :style="{ width: targetPercent + '%' }"
          aria-valuemin="0" 
          aria-valuemax="100"
        ></div>
      </div>
    </div>

    <!-- Transactions List Table -->
    <div class="card-content-box shadow-sm">
      <div class="box-header mb-3">
        <h2 class="box-title">Daftar Log Transaksi Penjualan</h2>
        <p class="box-subtitle">Berikut adalah rincian transaksi kasir terbaru.</p>
      </div>

      <div class="table-responsive">
        <table class="table custom-table align-middle">
          <thead>
            <tr>
              <th>ID Transaksi</th>
              <th>Waktu</th>
              <th>Jumlah Item</th>
              <th>Potongan Diskon</th>
              <th>Total Pembayaran</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in transactionsList" :key="tx.id">
              <td class="font-monospace text-muted" style="font-size: 0.82rem;">#TX-{{ tx.id }}</td>
              <td class="fw-semibold text-dark">{{ tx.time }} WIB</td>
              <td>{{ tx.itemsCount }} unit barang</td>
              <td class="text-danger fw-semibold">{{ tx.discount > 0 ? formatRupiah(tx.discount) : '-' }}</td>
              <td class="fw-bold text-success">{{ formatRupiah(tx.total) }}</td>
              <td class="text-center">
                <span class="badge bg-success bg-opacity-10 text-success border border-success py-1.5 px-3 rounded-5" style="font-size: 0.72rem; font-weight: 600;">
                  <i class="bi bi-check-circle-fill me-1"></i>Selesai
                </span>
              </td>
            </tr>
            <tr v-if="transactionsList.length === 0">
              <td colspan="6" class="text-center py-4 text-muted">Belum ada transaksi terekam di sistem.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.laporan-wrapper {
  padding: 30px;
  overflow-y: auto;
  height: calc(100vh - 70px);
}
@media (max-width: 991px) {
  .laporan-wrapper {
    height: auto;
    padding: 20px;
  }
}
</style>
