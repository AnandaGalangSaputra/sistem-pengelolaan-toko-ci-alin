<script setup>
import { state } from '../../store/store.js'

defineProps({
  totalActiveProducts: Number,
  lowStockCount: Number,
  totalTransactionsToday: Number,
  totalRevenueToday: Number
})

const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <div class="row g-4 mb-4">
    <!-- Metrics Card 1: Total Barang (Vibrant Blue Theme) -->
    <div class="col-12 col-sm-6 col-xl-3">
      <div class="metrics-card metrics-blue">
        <div class="card-body">
          <div class="card-icon-container">
            <i class="bi bi-box-seam"></i>
          </div>
          <div class="card-info">
            <span class="card-label">Total Barang</span>
            <span class="card-value">{{ totalActiveProducts }}</span>
          </div>
          <div class="card-bottom">
            <span>Produk terdaftar aktif</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Metrics Card 2: Stok Menipis (Warning/Red Theme) -->
    <div class="col-12 col-sm-6 col-xl-3">
      <div class="metrics-card">
        <div class="card-body">
          <div class="card-icon-container icon-warning">
            <i class="bi bi-exclamation-triangle-fill"></i>
          </div>
          <div class="card-info">
            <span class="card-label">Stok Menipis</span>
            <span class="card-value text-danger">{{ lowStockCount }}</span>
          </div>
          <div class="card-bottom text-danger">
            <i class="bi bi-arrow-down-short"></i>
            <span>Butuh restok segera</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Metrics Card 3: Penjualan Hari Ini -->
    <div class="col-12 col-sm-6 col-xl-3">
      <div class="metrics-card">
        <div class="card-body">
          <div class="card-icon-container icon-success">
            <i class="bi bi-cart-check-fill"></i>
          </div>
          <div class="card-info">
            <span class="card-label">Penjualan Hari Ini</span>
            <span class="card-value">{{ totalTransactionsToday }}</span>
          </div>
          <div class="card-bottom text-success">
            <i class="bi bi-clock"></i>
            <span>Transaksi selesai</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Metrics Card 4: Omset Hari Ini -->
    <div class="col-12 col-sm-6 col-xl-3">
      <div class="metrics-card">
        <div class="card-body">
          <div class="card-icon-container icon-info">
            <i class="bi bi-wallet2"></i>
          </div>
          <div class="card-info">
            <span class="card-label">Omset Hari Ini</span>
            <span class="card-value">{{ formatRupiah(totalRevenueToday) }}</span>
          </div>
          <div class="card-bottom text-muted">
            <span>Target: {{ formatRupiah(state.salesTarget) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
