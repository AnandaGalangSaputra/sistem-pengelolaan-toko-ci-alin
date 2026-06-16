<script setup>
import { ref, computed } from 'vue'
import { state, restockProduct, addDiscount } from '../store/store.js'
import MetricsGrid from '../components/dashboard/MetricsGrid.vue'
import WeeklySalesChart from '../components/dashboard/WeeklySalesChart.vue'
import DiscountHistory from '../components/dashboard/DiscountHistory.vue'
import WhatsappBroadcast from '../components/dashboard/WhatsappBroadcast.vue'
import LowStockTable from '../components/modals/LowStockTable.vue'
import RestockModal from '../components/modals/RestockModal.vue'

// Search filter for low-stock products based on global state searchQuery
const filteredLowStockProducts = computed(() => {
  return state.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      p.rack.toLowerCase().includes(state.searchQuery.toLowerCase())
    return matchesSearch && p.stock < p.limit
  })
})

const getTodayDateString = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const getStartOfWeek = (d) => {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(date.setDate(diff))
  start.setHours(0, 0, 0, 0)
  return start
}

// Metrics values computed dynamically based on state
const totalActiveProducts = computed(() => state.products.length)
const lowStockCount = computed(() => state.products.filter(p => p.stock < p.limit).length)

const totalTransactionsToday = computed(() => {
  const todayStr = getTodayDateString()
  return state.transactions.filter(tx => tx.date.startsWith(todayStr)).length
})

const totalRevenueToday = computed(() => {
  const todayStr = getTodayDateString()
  return state.transactions
    .filter(tx => tx.date.startsWith(todayStr))
    .reduce((acc, tx) => acc + tx.total, 0)
})

// Restock Modal state
const showRestockModal = ref(false)
const selectedProduct = ref(null)
const successToastMsg = ref('')

// Trigger restock modal
const openRestockModal = (product) => {
  selectedProduct.value = product
  showRestockModal.value = true
}

// Perform restock action
const submitRestock = async (productId, amount) => {
  const success = await restockProduct(productId, amount)
  if (success) {
    const prod = state.products.find(p => p.id === productId)
    successToastMsg.value = `Berhasil merestok ${prod.name} sebanyak ${amount} unit di ${prod.rack}!`
    setTimeout(() => {
      successToastMsg.value = ''
    }, 4000)
  }
  showRestockModal.value = false
  selectedProduct.value = null
}

// Quick Discount Modal state
const showDiscountModal = ref(false)
const newDiscountItem = ref('')
const newDiscountPrice = ref('')
const newDiscountRequestPrice = ref('')

const openDiscountModal = () => {
  newDiscountItem.value = ''
  newDiscountPrice.value = ''
  newDiscountRequestPrice.value = ''
  showDiscountModal.value = true
}

const submitDiscountRequest = () => {
  if (!newDiscountItem.value || !newDiscountPrice.value || !newDiscountRequestPrice.value) return

  addDiscount(newDiscountItem.value, Number(newDiscountPrice.value), Number(newDiscountRequestPrice.value))

  showDiscountModal.value = false
  successToastMsg.value = `Diskon langsung untuk ${newDiscountItem.value} berhasil diterapkan di kasir!`
  setTimeout(() => {
    successToastMsg.value = ''
  }, 4000)
}

// Chart Interactive Data
const weeklySalesData = computed(() => {
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  const dailySales = [0, 0, 0, 0, 0, 0, 0]
  
  const now = new Date()
  const startOfWeek = getStartOfWeek(now)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  state.transactions.forEach(tx => {
    const txDate = new Date(tx.date)
    if (txDate >= startOfWeek && txDate <= endOfWeek) {
      const dayIndex = txDate.getDay()
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1
      dailySales[adjustedIndex] += tx.total
    }
  })

  return days.map((day, idx) => {
    const sales = dailySales[idx]
    return {
      day,
      sales,
      label: formatRupiah(sales)
    }
  })
})

const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <div class="dashboard-content-wrapper w-100">
    <!-- Toast Alerts -->
    <transition name="fade">
      <div v-if="successToastMsg" class="custom-alert alert alert-success d-flex align-items-center shadow"
        role="alert">
        <i class="bi bi-check-circle-fill me-2 fs-5"></i>
        <div>{{ successToastMsg }}</div>
      </div>
    </transition>

    <!-- Dashboard Page Title -->
    <div class="content-header d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h1 class="page-title">Dashboard Karyawan</h1>
        <p class="page-subtitle">Pantau stok barang, kelola operasional rak, dan layani pelanggan hari ini.</p>
      </div>

      <div class="d-flex gap-2">
        <router-link to="/dashboard-karyawan/kasir" class="btn btn-primary-custom">
          <i class="bi bi-calculator me-2"></i>
          <span>Buka Kasir Penjualan</span>
        </router-link>
      </div>
    </div>

    <!-- Metrics Grid Component -->
    <MetricsGrid :total-active-products="totalActiveProducts" :low-stock-count="lowStockCount"
      :total-transactions-today="totalTransactionsToday" :total-revenue-today="totalRevenueToday" />

    <!-- Dashboard layout split -->
    <div class="row g-4">
      <!-- Left Panel: Low Stock Table -->
      <LowStockTable :products="filteredLowStockProducts" :low-stock-count="lowStockCount" :format-rupiah="formatRupiah"
        @restock="openRestockModal" />

      <!-- Right Panel: Line Chart & WhatsApp & Discount panels -->
      <div class="col-12 col-xl-5">
        <div class="d-flex flex-column gap-4">
          <!-- SVG Line Chart Component -->
          <WeeklySalesChart :weekly-sales-data="weeklySalesData" />

          <!-- Reusable WhatsApp Broadcast Widget -->
          <WhatsappBroadcast :show-pair-button="true" :show-history="true" />

          <!-- Discount History List Component -->
          <DiscountHistory :discounts="state.discounts" @open-add-discount="openDiscountModal" />

          <!-- Transaction Summary widget -->
          <div class="card-content-box shadow-sm">
            <div class="box-header d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 class="box-title">Transaksi Kasir Hari Ini</h2>
                <p class="box-subtitle">Daftar penjualan terbaru yang diselesaikan oleh kasir.</p>
              </div>
              <router-link to="/dashboard-karyawan/laporan" class="btn btn-xs-custom" title="Detail Laporan">
                <i class="bi bi-arrow-right"></i>
              </router-link>
            </div>
            <div class="table-responsive">
              <table class="table custom-table-mini align-middle mb-0">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Jumlah Item</th>
                    <th>Potongan</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="tx in state.transactions.slice(0, 4)" :key="tx.id">
                    <td class="text-muted small">{{ tx.time }}</td>
                    <td class="fw-semibold text-dark">{{ tx.itemsCount }} item</td>
                    <td class="text-danger small">{{ tx.discount > 0 ? formatRupiah(tx.discount) : '-' }}</td>
                    <td class="fw-bold text-success">{{ formatRupiah(tx.total) }}</td>
                  </tr>
                  <tr v-if="state.transactions.length === 0">
                    <td colspan="4" class="text-center text-muted py-3">Belum ada transaksi hari ini.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Systems Status Panel -->
          <div class="card-content-box shadow-sm">
            <div class="box-header mb-3">
              <h2 class="box-title">Konektivitas & Sistem</h2>
              <p class="box-subtitle">Status perangkat penunjang operasional kasir Ce Alin.</p>
            </div>
            <div class="d-flex flex-column gap-2">
              <div class="d-flex align-items-center justify-content-between p-2.5 bg-light rounded-3 border-start border-3" :class="state.waPaired ? 'border-success' : 'border-secondary'" style="border-left-width: 4px !important;">
                <div class="d-flex align-items-center">
                  <i class="bi bi-whatsapp fs-5 me-2.5" :class="state.waPaired ? 'text-success' : 'text-secondary'"></i>
                  <span class="small fw-semibold text-dark">WhatsApp Broadcast Gateway</span>
                </div>
                <span class="badge" :class="state.waPaired ? 'bg-success' : 'bg-secondary'">
                  {{ state.waPaired ? 'Online' : 'Offline' }}
                </span>
              </div>
              
              <div class="d-flex align-items-center justify-content-between p-2.5 bg-light rounded-3 border-start border-3 border-success" style="border-left-width: 4px !important;">
                <div class="d-flex align-items-center">
                  <i class="bi bi-printer fs-5 me-2.5 text-success"></i>
                  <span class="small fw-semibold text-dark">Printer Thermal Nota</span>
                </div>
                <span class="badge bg-success">Siap</span>
              </div>

              <div class="d-flex align-items-center justify-content-between p-2.5 bg-light rounded-3 border-start border-3 border-primary" style="border-left-width: 4px !important;">
                <div class="d-flex align-items-center">
                  <i class="bi bi-database fs-5 me-2.5 text-primary"></i>
                  <span class="small fw-semibold text-dark">Penyimpanan Lokal (Offline Cache)</span>
                </div>
                <span class="badge bg-primary">Aktif</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Restock Item Modal -->
    <RestockModal :show="showRestockModal" :product="selectedProduct" @close="showRestockModal = false"
      @confirm="submitRestock" />

    <!-- Request Discount Modal (Direct Application Simulation) -->
    <transition name="modal">
      <div v-if="showDiscountModal" class="modal-backdrop-custom">
        <div class="modal-card-custom animate-fade-in">
          <div class="modal-header-custom border-bottom">
            <h3 class="modal-title-custom">
              <i class="bi bi-tag-fill text-primary me-2"></i>Tambah Diskon Langsung Cepat
            </h3>
            <button @click="showDiscountModal = false" class="btn-close-custom">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="modal-body-custom">
            <p class="text-muted small mb-4">Simulasikan penambahan diskon harga barang langsung yang akan langsung
              aktif di kasir.</p>

            <div class="mb-3">
              <label for="discountItem" class="form-label-style">Nama Barang / Produk</label>
              <input type="text" id="discountItem" v-model="newDiscountItem" class="form-control-style"
                placeholder="Misal: Susu SGM 400g" required />
            </div>

            <div class="row g-3 mb-3">
              <div class="col-6">
                <label for="originalPrice" class="form-label-style">Harga Asli (Rp)</label>
                <input type="number" id="originalPrice" v-model.number="newDiscountPrice" class="form-control-style"
                  placeholder="Misal: 45000" required />
              </div>
              <div class="col-6">
                <label for="reqPrice" class="form-label-style">Harga Setelah Diskon (Rp)</label>
                <input type="number" id="reqPrice" v-model.number="newDiscountRequestPrice" class="form-control-style"
                  placeholder="Misal: 40000" required />
              </div>
            </div>
          </div>

          <div class="modal-footer-custom border-top">
            <button @click="showDiscountModal = false" class="btn-cancel">Batal</button>
            <button @click="submitDiscountRequest" class="btn-confirm">Terapkan Diskon</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dashboard-content-wrapper {
  padding: 30px;
  overflow-y: auto;
  height: calc(100vh - 70px);
}

@media (max-width: 991px) {
  .dashboard-content-wrapper {
    height: auto;
    padding: 20px;
  }
}
</style>
