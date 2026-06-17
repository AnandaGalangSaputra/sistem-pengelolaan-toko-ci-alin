<script setup>
import { ref, computed, watch } from 'vue'
import { state } from '../store/store.js'

const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

// Compute statistics from store transactions
const transactionsList = computed(() => state.transactions)

const totalRevenue = computed(() => {
  return state.transactions.reduce((acc, tx) => acc + tx.total, 0)
})

const totalDiscounts = computed(() => {
  return state.transactions.reduce((acc, tx) => acc + tx.discount, 0)
})

const totalTransactionsCount = computed(() => {
  return state.transactions.length
})

const totalItemsSold = computed(() => {
  return state.transactions.reduce((acc, tx) => acc + tx.itemsCount, 0)
})

const avgTransactionValue = computed(() => {
  if (totalTransactionsCount.value === 0) return 0
  return totalRevenue.value / totalTransactionsCount.value
})

// Calculate total cost of goods sold (HPP)
const totalCogs = computed(() => {
  return state.transactions.reduce((acc, tx) => {
    const txCogs = tx.details ? tx.details.reduce((sum, d) => sum + (d.barang ? d.barang.harga_beli * d.qty : 0), 0) : 0
    return acc + txCogs
  }, 0)
})

// Calculate net profit or loss
const netProfit = computed(() => {
  return totalRevenue.value - totalCogs.value
})

// Helper to calculate HPP per transaction
const getTransactionCogs = (tx) => {
  return tx.details ? tx.details.reduce((sum, d) => sum + (d.barang ? d.barang.harga_beli * d.qty : 0), 0) : 0
}

// Target achievement percentage and editing state
const isEditingTarget = ref(false)
const tempTarget = ref(state.salesTarget)

const saveTarget = () => {
  if (!tempTarget.value || tempTarget.value <= 0) {
    alert('Target harian harus bernilai positif!')
    return
  }
  state.salesTarget = tempTarget.value
  isEditingTarget.value = false
}

// Watch global target changes (e.g. from localStorage)
watch(() => state.salesTarget, (newVal) => {
  tempTarget.value = newVal
})

const targetPercent = computed(() => {
  return Math.min(100, Math.round((totalRevenue.value / state.salesTarget) * 100))
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

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(10)

const totalPages = computed(() => Math.ceil(transactionsList.value.length / itemsPerPage.value))

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return sortedTransactions.value.slice(start, end)
})

// Sorting state
const sortBy = ref('date-desc') // default newest first

const sortedTransactions = computed(() => {
  const list = [...transactionsList.value]
  list.sort((a, b) => {
    if (sortBy.value === 'id-asc') {
      return a.id - b.id
    } else if (sortBy.value === 'id-desc') {
      return b.id - a.id
    } else if (sortBy.value === 'date-asc') {
      return a.id - b.id
    } else if (sortBy.value === 'date-desc') {
      return b.id - a.id
    } else if (sortBy.value === 'total-asc') {
      return a.total - b.total
    } else if (sortBy.value === 'total-desc') {
      return b.total - a.total
    }
    return 0
  })
  return list
})

const toggleSort = (field) => {
  if (field === 'id') {
    sortBy.value = sortBy.value === 'id-asc' ? 'id-desc' : 'id-asc'
  } else if (field === 'date') {
    sortBy.value = sortBy.value === 'date-asc' ? 'date-desc' : 'date-asc'
  } else if (field === 'total') {
    sortBy.value = sortBy.value === 'total-asc' ? 'total-desc' : 'total-asc'
  }
}

// Reset page when sortBy changes
watch(sortBy, () => {
  currentPage.value = 1
})

// Visible pages helper (limit to max 5 page links shown)
const visiblePages = computed(() => {
  const range = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    range.push(i)
  }
  return range
})

// Reset page when transaction list length changes
watch(() => state.transactions.length, () => {
  currentPage.value = 1
})
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
      <!-- Card 1: Total Omset -->
      <div class="col-12 col-md-6 col-lg-4 col-xl">
        <div class="metrics-card">
          <div class="card-body">
            <div class="card-icon-container icon-success">
              <i class="bi bi-wallet-fill text-success"></i>
            </div>
            <div class="card-info">
              <span class="card-label">Total Omset</span>
              <span class="card-value text-success">{{ formatRupiah(totalRevenue) }}</span>
            </div>
            <div class="card-bottom text-muted">
              <span>Target harian: {{ formatRupiah(state.salesTarget) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 2: Total HPP -->
      <div class="col-12 col-md-6 col-lg-4 col-xl">
        <div class="metrics-card">
          <div class="card-body">
            <div class="card-icon-container text-secondary" style="background-color: #f1f5f9; color: #475569;">
              <i class="bi bi-tags-fill"></i>
            </div>
            <div class="card-info">
              <span class="card-label">Total HPP (Harga Pokok)</span>
              <span class="card-value text-secondary">{{ formatRupiah(totalCogs) }}</span>
            </div>
            <div class="card-bottom text-muted">
              <span>Biaya modal barang terjual</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 3: Keuntungan / Kerugian Bersih -->
      <div class="col-12 col-md-6 col-lg-4 col-xl">
        <div class="metrics-card">
          <div class="card-body">
            <div class="card-icon-container" :class="netProfit >= 0 ? 'icon-success' : 'icon-warning'" :style="netProfit >= 0 ? '' : 'background-color: #fef2f2; color: #dc2626;'">
              <i class="bi" :class="netProfit >= 0 ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'"></i>
            </div>
            <div class="card-info">
              <span class="card-label">{{ netProfit >= 0 ? 'Keuntungan Bersih' : 'Kerugian Bersih' }}</span>
              <span class="card-value" :class="netProfit >= 0 ? 'text-success' : 'text-danger'">{{ formatRupiah(Math.abs(netProfit)) }}</span>
            </div>
            <div class="card-bottom" :class="netProfit >= 0 ? 'text-success' : 'text-danger'">
              <span>{{ netProfit >= 0 ? 'Status surplus keuntungan' : 'Status defisit kerugian' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 4: Jumlah Transaksi -->
      <div class="col-12 col-md-6 col-lg-4 col-xl">
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

      <!-- Card 5: Diskon Transaksi -->
      <div class="col-12 col-md-6 col-lg-4 col-xl">
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
              <span>Total potongan diskon</span>
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
          
          <div class="d-flex align-items-center justify-content-end gap-1 mt-0.5" style="min-height: 25px;">
            <span class="text-muted small">{{ formatRupiah(totalRevenue) }} / </span>
            
            <span v-if="!isEditingTarget" class="fw-bold text-dark small d-inline-flex align-items-center">
              {{ formatRupiah(state.salesTarget) }}
              <button 
                v-if="state.currentUser?.role === 'owner'"
                @click="isEditingTarget = true" 
                class="btn btn-sm border-0 p-0 text-primary ms-1 d-flex align-items-center" 
                title="Ubah Target"
              >
                <i class="bi bi-pencil-fill" style="font-size: 0.72rem;"></i>
              </button>
            </span>
            
            <div v-else class="d-inline-flex align-items-center gap-1">
              <input 
                type="number" 
                v-model.number="tempTarget" 
                class="form-control form-control-sm text-end px-1 fw-bold" 
                style="font-size: 0.75rem; height: 22px; width: 95px; padding: 1px 4px;"
                min="10000"
              />
              <button @click="saveTarget" class="btn btn-sm btn-success py-0 px-1 d-flex align-items-center justify-content-center" style="font-size: 0.7rem; height: 22px; width: 22px;">
                <i class="bi bi-check"></i>
              </button>
              <button @click="isEditingTarget = false" class="btn btn-sm btn-light border py-0 px-1 d-flex align-items-center justify-content-center" style="font-size: 0.7rem; height: 22px; width: 22px;">
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>
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
              <th @click="toggleSort('id')" style="cursor: pointer; user-select: none;">
                ID Transaksi
                <i class="bi ms-1" :class="sortBy.startsWith('id') ? (sortBy === 'id-asc' ? 'bi-sort-numeric-down text-primary' : 'bi-sort-numeric-up-alt text-primary') : 'bi-arrow-down-up text-muted small'"></i>
              </th>
              <th @click="toggleSort('date')" style="cursor: pointer; user-select: none;">
                Waktu
                <i class="bi ms-1" :class="sortBy.startsWith('date') ? (sortBy === 'date-asc' ? 'bi-sort-numeric-down text-primary' : 'bi-sort-numeric-up-alt text-primary') : 'bi-arrow-down-up text-muted small'"></i>
              </th>
              <th>Petugas</th>
              <th>Nama Pembeli</th>
              <th>Jumlah Item</th>
              <th>Potongan Diskon</th>
              <th>Keuntungan / Kerugian</th>
              <th @click="toggleSort('total')" style="cursor: pointer; user-select: none;">
                Total Pembayaran
                <i class="bi ms-1" :class="sortBy.startsWith('total') ? (sortBy === 'total-asc' ? 'bi-sort-numeric-down text-primary' : 'bi-sort-numeric-up-alt text-primary') : 'bi-arrow-down-up text-muted small'"></i>
              </th>
              <th>Metode Bayar</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in paginatedTransactions" :key="tx.id">
              <td class="font-monospace text-muted" style="font-size: 0.82rem;">#TX-{{ tx.id }}</td>
              <td class="fw-semibold text-dark">{{ tx.time }} WIB</td>
              <td>
                <span class="badge bg-light text-dark border py-1.5 px-2.5 rounded-3 fw-semibold">
                  <i class="bi bi-person-badge-fill text-primary me-1"></i>{{ tx.cashierName || 'System' }}
                </span>
              </td>
              <td>
                <span class="fw-bold text-dark">{{ tx.customer?.name || 'Umum' }}</span>
                <span v-if="tx.customer?.phone" class="text-muted d-block small" style="font-size: 0.75rem;">
                  <i class="bi bi-whatsapp text-success me-1"></i>{{ tx.customer?.phone }}
                </span>
              </td>
              <td>{{ tx.itemsCount }} unit barang</td>
              <td class="text-danger fw-semibold">{{ tx.discount > 0 ? formatRupiah(tx.discount) : '-' }}</td>
              <td>
                <span v-if="tx.total - getTransactionCogs(tx) >= 0" class="text-success fw-semibold small">
                  <i class="bi bi-arrow-up-right-circle-fill me-1 text-success"></i>
                  {{ formatRupiah(tx.total - getTransactionCogs(tx)) }}
                </span>
                <span v-else class="text-danger fw-semibold small">
                  <i class="bi bi-arrow-down-right-circle-fill me-1 text-danger"></i>
                  {{ formatRupiah(Math.abs(tx.total - getTransactionCogs(tx))) }}
                </span>
              </td>
              <td class="fw-bold text-success">{{ formatRupiah(tx.total) }}</td>
              <td class="text-center">
                <span
                  class="badge py-1 px-2 rounded-4 fw-semibold"
                  :class="tx.metode_pembayaran === 'QRIS'
                    ? 'bg-primary bg-opacity-10 text-primary border border-primary'
                    : 'bg-success bg-opacity-10 text-success border border-success'"
                  style="font-size: 0.72rem;"
                >
                  <i class="bi me-1" :class="tx.metode_pembayaran === 'QRIS' ? 'bi-qr-code' : 'bi-cash-coin'"></i>
                  {{ tx.metode_pembayaran || 'Tunai' }}
                </span>
              </td>
              <td class="text-center">
                <span class="badge bg-success bg-opacity-10 text-success border border-success py-1.5 px-3 rounded-5" style="font-size: 0.72rem; font-weight: 600;">
                  <i class="bi bi-check-circle-fill me-1"></i>Selesai
                </span>
              </td>
            </tr>
            <tr v-if="transactionsList.length === 0">
              <td colspan="9" class="text-center py-4 text-muted">Belum ada transaksi terekam di sistem.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2 pt-3 border-top">
        <div class="text-muted small">
          Menampilkan <strong>{{ (currentPage - 1) * itemsPerPage + 1 }}</strong> - <strong>{{ Math.min(currentPage * itemsPerPage, transactionsList.length) }}</strong> dari <strong>{{ transactionsList.length }}</strong> transaksi
        </div>
        <nav aria-label="Page navigation">
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link rounded-start-3" @click="currentPage--" :disabled="currentPage === 1" aria-label="Previous">
                <i class="bi bi-chevron-left"></i>
              </button>
            </li>
            <li v-for="page in visiblePages" :key="page" class="page-item" :class="{ active: currentPage === page }">
              <button class="page-link" @click="currentPage = page">{{ page }}</button>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button class="page-link rounded-end-3" @click="currentPage++" :disabled="currentPage === totalPages" aria-label="Next">
                <i class="bi bi-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
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
                  <div class="small text-muted mb-0.5">Total HPP (Harga Pokok)</div>
                  <div class="fw-bold text-dark" style="font-size: 1.15rem;">{{ formatRupiah(totalCogs) }}</div>
                </div>
                <div class="col-6 mt-3">
                  <div class="small text-muted mb-0.5">Keuntungan / Kerugian Bersih</div>
                  <div class="fw-bold" :style="{ fontSize: '1.15rem', color: netProfit >= 0 ? '#16a34a' : '#dc2626' }">
                    {{ netProfit >= 0 ? 'Surplus: ' : 'Defisit: ' }}{{ formatRupiah(Math.abs(netProfit)) }}
                  </div>
                </div>
                <div class="col-6 mt-3">
                  <div class="small text-muted mb-0.5">Total Transaksi Selesai</div>
                  <div class="fw-bold text-dark" style="font-size: 1.15rem;">{{ totalTransactionsCount }} Transaksi</div>
                </div>
              </div>

              <!-- Transactions Table inside PDF -->
              <div class="mt-4">
                <h6 class="fw-bold mb-2.5 text-dark" style="font-size: 0.85rem;">Rincian Log Transaksi Penjualan</h6>
                <table class="w-100" style="font-size: 0.72rem; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 2px solid #cbd5e1; border-top: 1px solid #e2e8f0; background-color: #f8fafc;">
                      <th class="py-2 text-start px-2" style="width: 80px;">ID Transaksi</th>
                      <th class="py-2 text-start px-2" style="width: 55px;">Waktu</th>
                      <th class="py-2 text-start px-2" style="width: 80px;">Petugas</th>
                      <th class="py-2 text-start px-2">Pelanggan</th>
                      <th class="py-2 text-center px-2" style="width: 50px;">Item</th>
                      <th class="py-2 text-end px-2" style="width: 85px;">Untung/Rugi</th>
                      <th class="py-2 text-end px-2" style="width: 95px;">Total Bayar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="tx in transactionsList" :key="tx.id" style="border-bottom: 1px solid #f1f5f9;">
                      <td class="py-2 px-2 font-monospace text-secondary">#TX-{{ tx.id }}</td>
                      <td class="py-2 px-2">{{ tx.time }}</td>
                      <td class="py-2 px-2 text-dark">{{ tx.cashierName || 'System' }}</td>
                      <td class="py-2 px-2 text-dark">{{ tx.customer?.name || 'Umum' }}</td>
                      <td class="py-2 px-2 text-center">{{ tx.itemsCount }} unit</td>
                      <td class="py-2 px-2 text-end" :style="{ color: tx.total - getTransactionCogs(tx) >= 0 ? '#16a34a' : '#dc2626', fontWeight: '500' }">
                        {{ formatRupiah(tx.total - getTransactionCogs(tx)) }}
                      </td>
                      <td class="py-2 px-2 text-end fw-semibold text-dark">{{ formatRupiah(tx.total) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Signatures Row inside PDF -->
              <div class="row mt-5 pt-5 text-center" style="font-size: 0.8rem;">
                <div class="col-6">
                  <div class="text-secondary small mb-5">Petugas Laporan</div>
                  <div class="fw-bold text-dark" style="text-decoration: underline;">{{ state.currentUser?.name || 'Ananda Galang' }}</div>
                  <div class="text-muted small" style="font-size: 0.72rem;">{{ state.currentUser?.role === 'owner' ? 'Owner Toko' : 'Staff Operasional' }}</div>
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
