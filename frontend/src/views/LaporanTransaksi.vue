<script setup>
import { ref, computed } from 'vue'
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

// Printing States
const showPrintModal = ref(false)
const printType = ref('harian') // 'harian' or 'bulanan'

const triggerPrint = (type) => {
  printType.value = type
  showPrintModal.value = true
}

const executePrint = () => {
  window.print()
}

// Load configurations from localStorage
const getShopName = () => {
  const saved = localStorage.getItem('shop_name')
  return saved ? JSON.parse(saved) : 'Toko Ce Alin'
}
const getShopAddress = () => {
  const saved = localStorage.getItem('shop_address')
  return saved ? JSON.parse(saved) : 'Jalan Raya Sembako No. 7, Jakarta Barat'
}
const getShopWa = () => {
  const saved = localStorage.getItem('shop_whatsapp')
  return saved ? JSON.parse(saved) : '+62 812-3456-7890'
}
</script>

<template>
  <div class="laporan-wrapper">
    <!-- Success Toast Alert -->
    <transition name="fade">
      <div v-if="successToastMsg" class="custom-alert alert alert-success d-flex align-items-center shadow" role="alert">
        <i class="bi bi-check-circle-fill me-2 fs-5"></i>
        <div>{{ successToastMsg }}</div>
      </div>
    </transition>

    <!-- Page Title & Actions -->
    <div class="content-header d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h1 class="page-title">Laporan Transaksi</h1>
        <p class="page-subtitle">Analisis hasil penjualan, omset harian, potongan diskon, dan capaian target Toko Ce Alin.</p>
      </div>

      <div class="d-flex gap-2">
        <button @click="triggerPrint('harian')" class="btn btn-outline-primary-custom d-flex align-items-center py-2 px-3">
          <i class="bi bi-printer-fill me-1.5"></i>Cetak Harian
        </button>
        <button @click="triggerPrint('bulanan')" class="btn btn-primary-custom d-flex align-items-center py-2 px-3">
          <i class="bi bi-file-earmark-bar-graph-fill me-1.5"></i>Cetak Bulanan
        </button>
      </div>
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
              <th>Nama Pembeli</th>
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
              <td>
                <span class="fw-bold text-dark">{{ tx.customer?.name || 'Umum' }}</span>
                <span v-if="tx.customer?.phone" class="text-muted d-block small" style="font-size: 0.75rem;">
                  <i class="bi bi-whatsapp text-success me-1"></i>{{ tx.customer?.phone }}
                </span>
              </td>
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
              <td colspan="7" class="text-center py-4 text-muted">Belum ada transaksi terekam di sistem.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Print Report Preview Modal -->
    <transition name="modal">
      <div v-if="showPrintModal" class="modal-backdrop-custom">
        <div class="modal-card-custom animate-fade-in" style="max-width: 680px; height: 90vh;">
          <div class="modal-header-custom border-bottom">
            <h3 class="modal-title-custom">
              <i class="bi bi-file-earmark-pdf-fill text-danger me-2"></i>Pratinjau Cetak Laporan
            </h3>
            <button @click="showPrintModal = false" class="btn-close-custom">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="modal-body-custom overflow-y-auto bg-light p-4" style="flex: 1;">
            <!-- Printable Sheet Paper wrapper -->
            <div class="printable-report-area bg-white shadow-sm p-5 border rounded-2 mx-auto" style="width: 100%; max-width: 580px; min-height: 700px; color: #000000; font-family: 'Poppins', sans-serif;">
              <!-- Document Shop Header -->
              <div class="text-center border-bottom pb-4 mb-4">
                <h3 class="fw-bold mb-1" style="color: #1e293b; font-size: 1.4rem;">{{ getShopName() }}</h3>
                <p class="text-secondary small mb-1" style="font-size: 0.8rem;">{{ getShopAddress() }}</p>
                <p class="text-secondary small mb-0" style="font-size: 0.8rem;">
                  <i class="bi bi-whatsapp text-success me-1"></i>WhatsApp: {{ getShopWa() }}
                </p>
              </div>

              <!-- Report Title Section -->
              <div class="text-center mb-4">
                <h5 class="fw-bold mb-1" style="text-transform: uppercase; letter-spacing: 0.05em; font-size: 1rem; color: #0f172a;">
                  LAPORAN PENJUALAN {{ printType === 'harian' ? 'HARIAN' : 'BULANAN' }}
                </h5>
                <p class="text-muted small" style="font-size: 0.78rem;">
                  Periode: {{ printType === 'harian' ? '16 Juni 2026' : 'Juni 2026' }}
                </p>
              </div>

              <!-- Key Metrics Grid inside PDF -->
              <div class="row g-3 mb-4.5 border-bottom pb-4">
                <div class="col-6">
                  <div class="small text-muted mb-0.5">Total Omset Pendapatan</div>
                  <div class="fw-bold" style="font-size: 1.15rem; color: #16a34a;">{{ formatRupiah(totalRevenue) }}</div>
                </div>
                <div class="col-6">
                  <div class="small text-muted mb-0.5">Rata-rata Penjualan</div>
                  <div class="fw-bold text-dark" style="font-size: 1.15rem;">{{ formatRupiah(avgTransactionValue) }}</div>
                </div>
                <div class="col-6 mt-3">
                  <div class="small text-muted mb-0.5">Total Transaksi Selesai</div>
                  <div class="fw-bold text-dark" style="font-size: 1.15rem;">{{ totalTransactionsCount }} Transaksi</div>
                </div>
                <div class="col-6 mt-3">
                  <div class="small text-muted mb-0.5">Total Potongan Diskon</div>
                  <div class="fw-bold text-danger" style="font-size: 1.15rem;">{{ formatRupiah(totalDiscounts) }}</div>
                </div>
              </div>

              <!-- Transactions Table inside PDF -->
              <div class="mt-4">
                <h6 class="fw-bold mb-2.5 text-dark" style="font-size: 0.85rem;">Rincian Log Transaksi Penjualan</h6>
                <table class="w-100" style="font-size: 0.78rem; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 2px solid #cbd5e1; border-top: 1px solid #e2e8f0; background-color: #f8fafc;">
                      <th class="py-2 text-start px-2" style="width: 100px;">ID Transaksi</th>
                      <th class="py-2 text-start px-2" style="width: 70px;">Waktu</th>
                      <th class="py-2 text-start px-2">Nama Pelanggan</th>
                      <th class="py-2 class text-center px-2" style="width: 80px;">Item</th>
                      <th class="py-2 text-end px-2" style="width: 110px;">Total Bayar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="tx in transactionsList.slice(0, 8)" :key="tx.id" style="border-bottom: 1px solid #f1f5f9;">
                      <td class="py-2 px-2 font-monospace text-secondary">#TX-{{ tx.id.toString().slice(-4) }}</td>
                      <td class="py-2 px-2">{{ tx.time }}</td>
                      <td class="py-2 px-2 text-dark">{{ tx.customer?.name || 'Umum' }}</td>
                      <td class="py-2 px-2 text-center">{{ tx.itemsCount }} unit</td>
                      <td class="py-2 px-2 text-end fw-semibold text-dark">{{ formatRupiah(tx.total) }}</td>
                    </tr>
                    <!-- Mock transaction fillers for realistic visual report height -->
                    <tr v-if="printType === 'bulanan'" style="border-bottom: 1px solid #f1f5f9;">
                      <td class="py-2 px-2 font-monospace text-secondary">#TX-4402</td>
                      <td class="py-2 px-2">Kemarin</td>
                      <td class="py-2 px-2 text-dark">Rudi Hermawan</td>
                      <td class="py-2 px-2 text-center">3 unit</td>
                      <td class="py-2 px-2 text-end fw-semibold text-dark">{{ formatRupiah(185000) }}</td>
                    </tr>
                    <tr v-if="printType === 'bulanan'" style="border-bottom: 1px solid #f1f5f9;">
                      <td class="py-2 px-2 font-monospace text-secondary">#TX-4399</td>
                      <td class="py-2 px-2">Kemarin</td>
                      <td class="py-2 px-2 text-dark">Siti Aminah</td>
                      <td class="py-2 px-2 text-center">1 unit</td>
                      <td class="py-2 px-2 text-end fw-semibold text-dark">{{ formatRupiah(75000) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Signatures Row inside PDF -->
              <div class="row mt-5 pt-5 text-center" style="font-size: 0.8rem;">
                <div class="col-6">
                  <div class="text-secondary small mb-5">Kasir Toko</div>
                  <div class="fw-bold text-dark" style="text-decoration: underline;">Ananda Galang</div>
                  <div class="text-muted small" style="font-size: 0.72rem;">Staff Operasional</div>
                </div>
                <div class="col-6">
                  <div class="text-secondary small mb-5">Pemilik Toko</div>
                  <div class="fw-bold text-dark" style="text-decoration: underline;">Ce Alin</div>
                  <div class="text-muted small" style="font-size: 0.72rem;">Owner Toko</div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer-custom border-top bg-light">
            <button @click="showPrintModal = false" class="btn-cancel">Batal</button>
            <button @click="executePrint" class="btn-confirm d-flex align-items-center">
              <i class="bi bi-printer me-1.5"></i>Cetak Laporan (PDF)
            </button>
          </div>
        </div>
      </div>
    </transition>
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

<style>
/* Global Printable CSS overrides to hide application shell and isolate report sheet */
@media print {
  body {
    background-color: #ffffff !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  /* Hide the sidebar */
  .sidebar, .sidebar-wrapper, aside {
    display: none !important;
    visibility: hidden !important;
  }
  
  /* Hide the top header */
  .top-header-main, header {
    display: none !important;
    visibility: hidden !important;
  }
  
  /* Hide everything inside laporan-wrapper except the print modal */
  .laporan-wrapper > *:not(.modal-backdrop-custom) {
    display: none !important;
    visibility: hidden !important;
  }
  
  /* Hide modal header and footer in the print modal */
  .modal-backdrop-custom .modal-header-custom,
  .modal-backdrop-custom .modal-footer-custom {
    display: none !important;
    visibility: hidden !important;
  }
  
  /* Ensure the backdrop itself is transparent and has no centering/padding during print */
  .modal-backdrop-custom {
    background: transparent !important;
    padding: 0 !important;
    display: block !important;
    position: static !important;
    height: auto !important;
    width: auto !important;
    z-index: auto !important;
  }
  
  .modal-card-custom {
    max-width: 100% !important;
    height: auto !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .modal-body-custom {
    padding: 0 !important;
    background: transparent !important;
    overflow: visible !important;
  }
  
  /* Ensure the printable report area is fully visible and spans the page */
  .printable-report-area {
    display: block !important;
    visibility: visible !important;
    width: 100% !important;
    max-width: 100% !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    min-height: auto !important;
  }
}
</style>
