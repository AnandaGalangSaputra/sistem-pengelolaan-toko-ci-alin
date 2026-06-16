<script setup>
import { ref, computed, watch } from 'vue'
import { state, addProduct, editProduct, deleteProduct } from '../store/store.js'

const successToastMsg = ref('')
const viewMode = ref('grid') // 'grid' or 'table'

// Filtered products based on search bar query
const filteredProducts = computed(() => {
  if (!state.searchQuery) return state.products
  const q = state.searchQuery.toLowerCase()
  return state.products.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.rack.toLowerCase().includes(q)
  )
})

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(12)

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage.value))

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return sortedProducts.value.slice(start, end)
})

// Sorting state
const sortBy = ref('name-asc')

const sortedProducts = computed(() => {
  const products = [...filteredProducts.value]
  products.sort((a, b) => {
    if (sortBy.value === 'name-asc') {
      return a.name.localeCompare(b.name)
    } else if (sortBy.value === 'name-desc') {
      return b.name.localeCompare(a.name)
    } else if (sortBy.value === 'price-asc') {
      return a.price - b.price
    } else if (sortBy.value === 'price-desc') {
      return b.price - a.price
    } else if (sortBy.value === 'stock-asc') {
      return a.stock - b.stock
    } else if (sortBy.value === 'stock-desc') {
      return b.stock - a.stock
    }
    return 0
  })
  return products
})

const toggleSort = (field) => {
  if (field === 'name') {
    sortBy.value = sortBy.value === 'name-asc' ? 'name-desc' : 'name-asc'
  } else if (field === 'price') {
    sortBy.value = sortBy.value === 'price-asc' ? 'price-desc' : 'price-asc'
  } else if (field === 'stock') {
    sortBy.value = sortBy.value === 'stock-asc' ? 'stock-desc' : 'stock-asc'
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

// Reset page when search or viewMode changes
watch(() => state.searchQuery, () => {
  currentPage.value = 1
})
watch(viewMode, () => {
  currentPage.value = 1
})

// Modal states
const showAddModal = ref(false)
const showEditModal = ref(false)
const selectedProd = ref(null)

// Forms input refs
const formName = ref('')
const formRack = ref('')
const formStock = ref(0)
const formLimit = ref(5)
const formPrice = ref(0)
const formCost = ref(0)
const formImage = ref('')

const openAddModal = () => {
  formName.value = ''
  formRack.value = ''
  formStock.value = 0
  formLimit.value = 5
  formPrice.value = 0
  formCost.value = 0
  formImage.value = ''
  showAddModal.value = true
}

const submitAdd = async () => {
  if (!formName.value || !formRack.value || formPrice.value <= 0 || formCost.value < 0) {
    alert('Harap isi nama, lokasi rak, harga jual, dan harga beli barang dengan benar!')
    return
  }
  const success = await addProduct(
    formName.value,
    formRack.value,
    formStock.value,
    formLimit.value,
    formPrice.value,
    formCost.value,
    formImage.value
  )
  if (success) {
    showAddModal.value = false
    triggerToast(`Produk "${formName.value}" berhasil ditambahkan!`)
  }
}

const openEditModal = (product) => {
  selectedProd.value = product
  formName.value = product.name
  formRack.value = product.rack
  formStock.value = product.stock
  formLimit.value = product.limit
  formPrice.value = product.price
  formCost.value = product.harga_beli || 0
  formImage.value = product.image || ''
  showEditModal.value = true
}

const submitEdit = async () => {
  if (!selectedProd.value) return
  if (!formName.value || !formRack.value || formPrice.value <= 0 || formCost.value < 0) {
    alert('Harap isi nama, lokasi rak, harga jual, dan harga beli barang dengan benar!')
    return
  }

  const updated = {
    name: formName.value,
    rack: formRack.value,
    stock: Number(formStock.value),
    limit: Number(formLimit.value),
    price: Number(formPrice.value),
    harga_beli: Number(formCost.value),
    image: formImage.value
  }

  const success = await editProduct(selectedProd.value.id, updated)
  if (success) {
    showEditModal.value = false
    triggerToast(`Produk "${formName.value}" berhasil diperbarui!`)
  }
}

const confirmDelete = async (product) => {
  if (confirm(`Apakah Anda yakin ingin menghapus produk "${product.name}"?`)) {
    const success = await deleteProduct(product.id)
    if (success) {
      triggerToast(`Produk "${product.name}" telah dihapus!`)
    }
  }
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

// Compute progress bar color for stock
const getStockBarClass = (prod) => {
  if (prod.stock <= 0) return 'bg-danger'
  if (prod.stock < prod.limit / 2) return 'bg-danger'
  if (prod.stock < prod.limit) return 'bg-warning'
  return 'bg-success'
}

const getStockPercent = (prod) => {
  const limitMax = Math.max(prod.limit * 1.5, 15)
  return Math.min(100, (prod.stock / limitMax) * 100)
}

const onImageUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  if (file.size > 2 * 1024 * 1024) {
    alert('Ukuran gambar terlalu besar! Harap unggah gambar di bawah 2MB untuk efisiensi penyimpanan.')
    event.target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    formImage.value = e.target.result // Base64 data URL
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <div class="data-barang-wrapper">
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
        <h1 class="page-title">Data Barang</h1>
        <p class="page-subtitle">Kelola nama produk, lokasi rak penyimpanan, dan harga jual produk Toko Ce Alin.</p>
      </div>

      <div class="d-flex gap-2 align-items-center">
        <!-- Sort Dropdown -->
        <select v-model="sortBy" class="form-select border rounded-3 py-1 px-2.5 bg-white text-muted small" style="width: auto; height: 38px; font-size: 0.82rem; border-color: #dee2e6;">
          <option value="name-asc">Nama: A-Z</option>
          <option value="name-desc">Nama: Z-A</option>
          <option value="price-asc">Harga: Terendah</option>
          <option value="price-desc">Harga: Tertinggi</option>
          <option value="stock-asc">Stok: Terendah</option>
          <option value="stock-desc">Stok: Tertinggi</option>
        </select>

        <!-- View toggle buttons -->
        <div class="btn-group border rounded-3 p-1 bg-white">
          <button 
            @click="viewMode = 'grid'" 
            class="btn btn-sm py-1.5 px-3 border-0 d-flex align-items-center"
            :class="viewMode === 'grid' ? 'btn-primary-custom' : 'btn-light text-muted'"
          >
            <i class="bi bi-grid-3x3-gap-fill me-1.5"></i>Grid
          </button>
          <button 
            @click="viewMode = 'table'" 
            class="btn btn-sm py-1.5 px-3 border-0 d-flex align-items-center"
            :class="viewMode === 'table' ? 'btn-primary-custom' : 'btn-light text-muted'"
          >
            <i class="bi bi-table me-1.5"></i>Tabel
          </button>
        </div>

        <button @click="openAddModal" class="btn btn-primary-custom" v-if="state.currentUser?.role === 'owner'">
          <i class="bi bi-plus-lg me-2"></i>
          <span>Tambah Produk</span>
        </button>
      </div>
    </div>

    <!-- Tampilan 1: Grid Card Bergambar (Default) -->
    <div v-if="viewMode === 'grid'">
      <div class="row g-4">
        <div v-for="prod in paginatedProducts" :key="prod.id" class="col-12 col-sm-6 col-md-4 col-xl-3">
          <div class="card h-100 border-0 shadow-sm overflow-hidden product-card-hover rounded-4 bg-white border">
            <!-- Product Card Header (Image + Location/Status Badges) -->
            <div class="position-relative overflow-hidden bg-light" style="height: 190px;">
              <img 
                :src="prod.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=60'" 
                class="w-100 h-100 object-fit-cover transition-img" 
                :alt="prod.name"
              />
              <!-- Location Badge -->
              <span class="position-absolute top-3 start-3 badge bg-dark bg-opacity-75 py-1.5 px-2.5 rounded-3 text-white small">
                <i class="bi bi-geo-alt-fill text-primary me-1"></i>{{ prod.rack }}
              </span>
              <!-- Status Badge -->
              <span class="position-absolute top-3 end-3 badge-status" :class="prod.status.toLowerCase()">
                {{ prod.status }}
              </span>
            </div>

            <!-- Product Card Body -->
            <div class="card-body p-3.5 d-flex flex-column justify-content-between">
              <div>
                <h5 class="fw-bold text-dark mb-1 text-truncate-2" style="font-size: 0.95rem; line-height: 1.4; min-height: 2.8rem;">
                  {{ prod.name }}
                </h5>
                <div class="d-flex align-items-baseline gap-2 mb-3.5">
                  <h4 class="fw-bold text-primary mb-0" style="font-size: 1.25rem;">
                    {{ formatRupiah(prod.price) }}
                  </h4>
                  <span class="text-muted small" style="font-size: 0.75rem;">
                    Beli: {{ formatRupiah(prod.harga_beli) }}
                  </span>
                </div>
              </div>

              <div>
                <!-- Stock Level Progress Bar -->
                <div class="d-flex justify-content-between align-items-center mb-1 small text-muted">
                  <span>Stok: <strong>{{ prod.stock }} unit</strong></span>
                  <span>Limit: {{ prod.limit }}</span>
                </div>
                <div class="progress mb-3.5" style="height: 6px; background-color: #f1f5f9;">
                  <div 
                    class="progress-bar" 
                    :class="getStockBarClass(prod)" 
                    role="progressbar" 
                    :style="{ width: getStockPercent(prod) + '%' }"
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>

                <!-- Card Actions Row -->
                <div class="d-flex gap-2 border-top pt-3" v-if="state.currentUser?.role === 'owner'">
                  <button @click="openEditModal(prod)" class="btn btn-outline-primary-custom flex-fill btn-sm py-1.5 px-2">
                    <i class="bi bi-pencil-square me-1"></i>Edit
                  </button>
                  <button @click="confirmDelete(prod)" class="btn btn-sm btn-outline-danger flex-fill py-1.5 px-2 rounded-3 border-danger" style="font-size: 0.8rem; font-weight: 600;">
                    <i class="bi bi-trash-fill me-1"></i>Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredProducts.length === 0" class="col-12 text-center py-5 text-muted bg-white border rounded-4 shadow-sm">
          <i class="bi bi-search d-block fs-1 mb-2 text-secondary"></i>
          <span>Tidak menemukan produk yang cocok dengan pencarian Anda.</span>
        </div>
      </div>
    </div>

    <!-- Tampilan 2: Tabel Klasik -->
    <div v-else-if="viewMode === 'table'" class="card-content-box shadow-sm">
      <div class="table-responsive">
        <table class="table custom-table align-middle">
          <thead>
            <tr>
              <th style="width: 60px;">No</th>
              <th @click="toggleSort('name')" style="cursor: pointer; user-select: none;">
                Nama Produk
                <i class="bi ms-1" :class="sortBy.startsWith('name') ? (sortBy === 'name-asc' ? 'bi-sort-alpha-down text-primary' : 'bi-sort-alpha-up-alt text-primary') : 'bi-arrow-down-up text-muted small'"></i>
              </th>
              <th>Lokasi Rak</th>
              <th>Harga Beli</th>
              <th @click="toggleSort('price')" style="cursor: pointer; user-select: none;">
                Harga Jual
                <i class="bi ms-1" :class="sortBy.startsWith('price') ? (sortBy === 'price-asc' ? 'bi-sort-numeric-down text-primary' : 'bi-sort-numeric-up-alt text-primary') : 'bi-arrow-down-up text-muted small'"></i>
              </th>
              <th @click="toggleSort('stock')" style="cursor: pointer; user-select: none;">
                Stok Tersedia
                <i class="bi ms-1" :class="sortBy.startsWith('stock') ? (sortBy === 'stock-asc' ? 'bi-sort-numeric-down text-primary' : 'bi-sort-numeric-up-alt text-primary') : 'bi-arrow-down-up text-muted small'"></i>
              </th>
              <th>Status</th>
              <th style="width: 150px;" class="text-center" v-if="state.currentUser?.role === 'owner'">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(prod, idx) in paginatedProducts" :key="prod.id">
              <td>{{ (currentPage - 1) * itemsPerPage + idx + 1 }}</td>
              <td class="fw-semibold text-dark">
                <div class="d-flex align-items-center">
                  <img :src="prod.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=50&auto=format&fit=crop&q=60'" class="rounded me-2.5 object-fit-cover" style="width: 36px; height: 36px;" />
                  <span>{{ prod.name }}</span>
                </div>
              </td>
              <td>
                <span class="badge bg-light text-secondary border py-1.5 px-2.5">
                  <i class="bi bi-geo-alt-fill text-primary me-1"></i>{{ prod.rack }}
                </span>
              </td>
              <td class="text-secondary small">{{ formatRupiah(prod.harga_beli) }}</td>
              <td class="fw-bold text-dark">{{ formatRupiah(prod.price) }}</td>
              <td>{{ prod.stock }} unit</td>
              <td>
                <span class="badge-status" :class="prod.status.toLowerCase()">
                  {{ prod.status }}
                </span>
              </td>
              <td v-if="state.currentUser?.role === 'owner'">
                <div class="d-flex justify-content-center gap-2">
                  <button @click="openEditModal(prod)" class="btn btn-outline-primary-custom btn-sm py-1 px-2.5">
                    <i class="bi bi-pencil-square me-1"></i>Edit
                  </button>
                  <button @click="confirmDelete(prod)" class="btn btn-sm btn-outline-danger py-1 px-2.5 rounded-3 border-danger" style="font-size: 0.8rem; font-weight: 600;">
                    <i class="bi bi-trash-fill me-1"></i>Hapus
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredProducts.length === 0">
              <td :colspan="state.currentUser?.role === 'owner' ? 8 : 7" class="text-center py-5 text-muted">
                <i class="bi bi-search d-block fs-2 mb-2 text-secondary"></i>
                <span>Tidak menemukan produk yang cocok dengan pencarian Anda.</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination Controls -->
    <div v-if="totalPages > 1" class="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2 bg-white p-3 rounded-4 border shadow-sm">
      <div class="text-muted small">
        Menampilkan <strong>{{ (currentPage - 1) * itemsPerPage + 1 }}</strong> - <strong>{{ Math.min(currentPage * itemsPerPage, filteredProducts.length) }}</strong> dari <strong>{{ filteredProducts.length }}</strong> produk
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

    <!-- Modal: Add Product -->
    <transition name="modal">
      <div v-if="showAddModal" class="modal-backdrop-custom">
        <div class="modal-card-custom animate-fade-in">
          <div class="modal-header-custom border-bottom">
            <h3 class="modal-title-custom">
              <i class="bi bi-plus-circle-fill text-primary me-2"></i>Tambah Produk Baru
            </h3>
            <button @click="showAddModal = false" class="btn-close-custom">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="modal-body-custom">
            <div class="mb-3">
              <label for="addName" class="form-label-style">Nama Barang</label>
              <input type="text" id="addName" v-model="formName" class="form-control-style" placeholder="Contoh: Susu Indomilk 1L" />
            </div>

            <div class="mb-3">
              <label class="form-label-style">Gambar Produk (Unggah dari Lokal)</label>
              <div class="d-flex align-items-center gap-3">
                <div class="flex-fill">
                  <input type="file" @change="onImageUpload" accept="image/*" class="form-control-style" />
                </div>
                <div v-if="formImage" class="border rounded bg-light" style="width: 50px; height: 50px; overflow: hidden; flex-shrink: 0;">
                  <img :src="formImage" class="w-100 h-100 object-fit-cover" />
                </div>
              </div>
            </div>

            <div class="row g-3 mb-3">
              <div class="col-4">
                <label for="addRack" class="form-label-style">Lokasi Rak</label>
                <input type="text" id="addRack" v-model="formRack" list="rackList" class="form-control-style" placeholder="Contoh: Rak B-3" />
              </div>
              <div class="col-4">
                <label for="addCost" class="form-label-style">Harga Beli (Rp)</label>
                <input type="number" id="addCost" v-model.number="formCost" class="form-control-style" placeholder="Contoh: 14000" />
              </div>
              <div class="col-4">
                <label for="addPrice" class="form-label-style">Harga Jual (Rp)</label>
                <input type="number" id="addPrice" v-model.number="formPrice" class="form-control-style" placeholder="Contoh: 18000" />
              </div>
            </div>

            <div class="row g-3 mb-3">
              <div class="col-6">
                <label for="addStock" class="form-label-style">Stok Awal</label>
                <input type="number" id="addStock" v-model.number="formStock" class="form-control-style" />
              </div>
              <div class="col-6">
                <label for="addLimit" class="form-label-style">Batas Minimum Stok</label>
                <input type="number" id="addLimit" v-model.number="formLimit" class="form-control-style" />
              </div>
            </div>
          </div>

          <div class="modal-footer-custom border-top">
            <button @click="showAddModal = false" class="btn-cancel">Batal</button>
            <button @click="submitAdd" class="btn-confirm">Tambah Produk</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal: Edit Product -->
    <transition name="modal">
      <div v-if="showEditModal" class="modal-backdrop-custom">
        <div class="modal-card-custom animate-fade-in">
          <div class="modal-header-custom border-bottom">
            <h3 class="modal-title-custom">
              <i class="bi bi-pencil-square text-primary me-2"></i>Edit Informasi Produk
            </h3>
            <button @click="showEditModal = false" class="btn-close-custom">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="modal-body-custom">
            <div class="mb-3">
              <label for="editName" class="form-label-style">Nama Barang</label>
              <input type="text" id="editName" v-model="formName" class="form-control-style" />
            </div>

            <div class="mb-3">
              <label class="form-label-style">Gambar Produk (Ganti dari Lokal)</label>
              <div class="d-flex align-items-center gap-3">
                <div class="flex-fill">
                  <input type="file" @change="onImageUpload" accept="image/*" class="form-control-style" />
                </div>
                <div v-if="formImage" class="border rounded bg-light" style="width: 50px; height: 50px; overflow: hidden; flex-shrink: 0;">
                  <img :src="formImage" class="w-100 h-100 object-fit-cover" />
                </div>
              </div>
            </div>

            <div class="row g-3 mb-3">
              <div class="col-4">
                <label for="editRack" class="form-label-style">Lokasi Rak</label>
                <input type="text" id="editRack" v-model="formRack" list="rackList" class="form-control-style" />
              </div>
              <div class="col-4">
                <label for="editCost" class="form-label-style">Harga Beli (Rp)</label>
                <input type="number" id="editCost" v-model.number="formCost" class="form-control-style" />
              </div>
              <div class="col-4">
                <label for="editPrice" class="form-label-style">Harga Jual (Rp)</label>
                <input type="number" id="editPrice" v-model.number="formPrice" class="form-control-style" />
              </div>
            </div>

            <div class="row g-3 mb-3">
              <div class="col-6">
                <label for="editStock" class="form-label-style">Stok Fisik</label>
                <input type="number" id="editStock" v-model.number="formStock" class="form-control-style" />
              </div>
              <div class="col-6">
                <label for="editLimit" class="form-label-style">Batas Minimum Stok</label>
                <input type="number" id="editLimit" v-model.number="formLimit" class="form-control-style" />
              </div>
            </div>
          </div>

          <div class="modal-footer-custom border-top">
            <button @click="showEditModal = false" class="btn-cancel">Batal</button>
            <button @click="submitEdit" class="btn-confirm">Simpan Perubahan</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Datalist for rack suggestions -->
    <datalist id="rackList">
      <option v-for="r in state.racks" :key="r.id" :value="r.nama_rak" />
    </datalist>
  </div>
</template>

<style scoped>
.data-barang-wrapper {
  padding: 30px;
  overflow-y: auto;
  height: calc(100vh - 70px);
}
.top-3 {
  top: 1rem;
}
.start-3 {
  left: 1rem;
}
.end-3 {
  right: 1rem;
}
.transition-img {
  transition: transform 0.35s ease;
}
.product-card-hover:hover .transition-img {
  transform: scale(1.05);
}
.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
@media (max-width: 991px) {
  .data-barang-wrapper {
    height: auto;
    padding: 20px;
  }
}
</style>
