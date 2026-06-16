<script setup>
import { ref, computed, watch } from 'vue'
import { state, restockProduct } from '../store/store.js'
import RestockModal from '../components/modals/RestockModal.vue'

const successToastMsg = ref('')

// Filtered products based on search bar query
const filteredProducts = computed(() => {
  if (!state.searchQuery) return state.products
  const q = state.searchQuery.toLowerCase()
  return state.products.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.rack.toLowerCase().includes(q)
  )
})

// Metrics for stock
const totalProducts = computed(() => state.products.length)
const lowStockCount = computed(() => state.products.filter(p => p.stock < p.limit && p.stock > 0).length)
const criticalStockCount = computed(() => state.products.filter(p => p.stock <= 0).length)

// Restock modal handling
const showRestockModal = ref(false)
const selectedProd = ref(null)

const openRestock = (product) => {
  selectedProd.value = product
  showRestockModal.value = true
}

const handleRestockConfirm = async (productId, amount) => {
  const success = await restockProduct(productId, amount)
  if (success) {
    const prod = state.products.find(p => p.id === productId)
    triggerToast(`Berhasil menambahkan ${amount} unit ke stok "${prod.name}"!`)
  }
  showRestockModal.value = false
  selectedProd.value = null
}

const triggerToast = (msg) => {
  successToastMsg.value = msg
  setTimeout(() => {
    successToastMsg.value = ''
  }, 4000)
}

const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(10)

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage.value))

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredProducts.value.slice(start, end)
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

// Reset page when search changes
watch(() => state.searchQuery, () => {
  currentPage.value = 1
})
</script>

<template>
  <div class="stok-barang-wrapper">
    <!-- Success Toast Alert -->
    <transition name="fade">
      <div v-if="successToastMsg" class="custom-alert alert alert-success d-flex align-items-center shadow" role="alert">
        <i class="bi bi-check-circle-fill me-2 fs-5"></i>
        <div>{{ successToastMsg }}</div>
      </div>
    </transition>

    <!-- Page Title -->
    <div class="content-header mb-4">
      <h1 class="page-title">Stok Barang & Lokasi Rak</h1>
      <p class="page-subtitle">Pantau jumlah persediaan barang, batas minimum limit, dan koordinat rak fisik toko.</p>
    </div>

    <!-- Stock Metrics Grid -->
    <div class="row g-4 mb-4">
      <div class="col-12 col-md-4">
        <div class="metrics-card">
          <div class="card-body">
            <div class="card-icon-container">
              <i class="bi bi-box-seam text-primary"></i>
            </div>
            <div class="card-info">
              <span class="card-label">Total Jenis Barang</span>
              <span class="card-value">{{ totalProducts }}</span>
            </div>
            <div class="card-bottom text-muted">
              <span>Item terdaftar aktif</span>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="metrics-card">
          <div class="card-body">
            <div class="card-icon-container icon-warning">
              <i class="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div class="card-info">
              <span class="card-label">Stok Menipis</span>
              <span class="card-value text-warning">{{ lowStockCount }}</span>
            </div>
            <div class="card-bottom text-warning">
              <span>Mendekati batas limit</span>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="metrics-card">
          <div class="card-body">
            <div class="card-icon-container icon-danger">
              <i class="bi bi-x-circle-fill text-danger"></i>
            </div>
            <div class="card-info">
              <span class="card-label">Stok Habis / Kritis</span>
              <span class="card-value text-danger">{{ criticalStockCount }}</span>
            </div>
            <div class="card-bottom text-danger">
              <span>Stok kosong (0 unit)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stock Levels Table -->
    <div class="card-content-box shadow-sm">
      <div class="box-header mb-3">
        <h2 class="box-title">Pemantauan Level Stok Rak</h2>
        <p class="box-subtitle">Daftar barang beserta status kecukupan stok di rak fisik.</p>
      </div>

      <div class="table-responsive">
        <table class="table custom-table align-middle">
          <thead>
            <tr>
              <th style="width: 60px;">No</th>
              <th>Nama Barang</th>
              <th>Lokasi Rak</th>
              <th>Stok Saat Ini</th>
              <th>Batas Limit</th>
              <th>Status</th>
              <th style="width: 150px;" class="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(prod, idx) in paginatedProducts" :key="prod.id">
              <td>{{ (currentPage - 1) * itemsPerPage + idx + 1 }}</td>
              <td class="fw-semibold text-dark">{{ prod.name }}</td>
              <td>
                <span class="badge bg-light text-secondary border py-1.5 px-2.5">
                  <i class="bi bi-geo-alt-fill text-primary me-1"></i>{{ prod.rack }}
                </span>
              </td>
              <td class="fw-bold" :class="prod.stock < prod.limit ? 'text-danger' : 'text-dark'">
                {{ prod.stock }} unit
              </td>
              <td class="text-muted">{{ prod.limit }} unit</td>
              <td>
                <!-- Status Badge Map -->
                <span class="badge-status" :class="prod.status.toLowerCase()">
                  {{ prod.status }}
                </span>
              </td>
              <td>
                <div class="d-flex justify-content-center">
                  <button @click="openRestock(prod)" class="btn btn-outline-primary-custom btn-sm py-1 px-3">
                    <i class="bi bi-plus-square-fill me-1"></i>Restok
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredProducts.length === 0">
              <td colspan="7" class="text-center py-5 text-muted">
                <i class="bi bi-search d-block fs-2 mb-2 text-secondary"></i>
                <span>Tidak menemukan barang yang cocok dengan pencarian Anda.</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2 pt-3 border-top">
        <div class="text-muted small">
          Menampilkan <strong>{{ (currentPage - 1) * itemsPerPage + 1 }}</strong> - <strong>{{ Math.min(currentPage * itemsPerPage, filteredProducts.length) }}</strong> dari <strong>{{ filteredProducts.length }}</strong> barang
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

    <!-- Restock Modal Component -->
    <RestockModal 
      :show="showRestockModal" 
      :product="selectedProd" 
      @close="showRestockModal = false" 
      @confirm="handleRestockConfirm" 
    />
  </div>
</template>

<style scoped>
.stok-barang-wrapper {
  padding: 30px;
  overflow-y: auto;
  height: calc(100vh - 70px);
}
.icon-danger {
  background-color: #fef2f2;
  color: #ef4444;
}
@media (max-width: 991px) {
  .stok-barang-wrapper {
    height: auto;
    padding: 20px;
  }
}
</style>
