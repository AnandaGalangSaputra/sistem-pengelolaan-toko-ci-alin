<script setup>
import { ref, computed } from 'vue'
import { state, addTransaction } from '../store/store.js'

const searchProductQuery = ref('')
const cart = ref([])
const discountInput = ref(0)
const successToastMsg = ref('')

// Filter products based on search query in cashier panel
const availableProducts = computed(() => {
  const q = searchProductQuery.value.toLowerCase()
  return state.products.filter(p => 
    p.stock > 0 && (p.name.toLowerCase().includes(q) || p.rack.toLowerCase().includes(q))
  )
})

// Add product to cart
const addToCart = (product) => {
  const existing = cart.value.find(item => item.product.id === product.id)
  if (existing) {
    if (existing.quantity >= product.stock) {
      alert(`Stok tidak mencukupi! Maksimal stok tersedia adalah ${product.stock} unit.`)
      return
    }
    existing.quantity++
  } else {
    cart.value.push({
      product,
      quantity: 1
    })
  }
}

// Adjust quantity inside cart
const incrementQty = (item) => {
  if (item.quantity >= item.product.stock) {
    alert(`Stok tidak mencukupi! Maksimal stok tersedia adalah ${item.product.stock} unit.`)
    return
  }
  item.quantity++
}

const decrementQty = (item) => {
  if (item.quantity > 1) {
    item.quantity--
  } else {
    removeFromCart(item)
  }
}

const removeFromCart = (item) => {
  const idx = cart.value.findIndex(i => i.product.id === item.product.id)
  if (idx !== -1) {
    cart.value.splice(idx, 1)
  }
}

// Calculation computed values
const subtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
})

const finalTotal = computed(() => {
  const val = subtotal.value - Number(discountInput.value || 0)
  return Math.max(0, val)
})

// Checkout Modal states
const showCheckoutModal = ref(false)
const cashReceived = ref('')
const cashChange = computed(() => {
  if (!cashReceived.value) return 0
  const change = Number(cashReceived.value) - finalTotal.value
  return Math.max(0, change)
})

const openCheckout = () => {
  if (cart.value.length === 0) {
    alert('Keranjang belanja kosong! Silakan pilih produk terlebih dahulu.')
    return
  }
  cashReceived.value = ''
  showCheckoutModal.value = true
}

const completePayment = () => {
  if (!cashReceived.value || Number(cashReceived.value) < finalTotal.value) {
    alert('Uang pembayaran tidak mencukupi!')
    return
  }

  // Call store method to commit transaction
  addTransaction(cart.value, finalTotal.value, Number(discountInput.value || 0))
  
  // Clear local states
  cart.value = []
  discountInput.value = 0
  showCheckoutModal.value = false

  successToastMsg.value = 'Transaksi berhasil diselesaikan! Stok barang telah diperbarui secara otomatis.'
  setTimeout(() => {
    successToastMsg.value = ''
  }, 4000)
}

const clearCart = () => {
  if (confirm('Apakah Anda yakin ingin membatalkan transaksi ini?')) {
    cart.value = []
    discountInput.value = 0
  }
}

const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <div class="kasir-wrapper">
    <!-- Success Toast Alert -->
    <transition name="fade">
      <div v-if="successToastMsg" class="custom-alert alert alert-success d-flex align-items-center shadow" role="alert">
        <i class="bi bi-check-circle-fill me-2 fs-5"></i>
        <div>{{ successToastMsg }}</div>
      </div>
    </transition>

    <!-- Page Title -->
    <div class="content-header mb-4">
      <h1 class="page-title">Kasir Transaksi</h1>
      <p class="page-subtitle">Pilih produk belanjaan pelanggan, atur diskon potongan harga langsung, dan selesaikan pembayaran.</p>
    </div>

    <div class="row g-4">
      <!-- Left Column: Products Selector (60%) -->
      <div class="col-12 col-lg-7">
        <div class="card-content-box shadow-sm h-100">
          <div class="box-header d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div>
              <h2 class="box-title">Pilih Barang</h2>
              <p class="box-subtitle">Klik tambah untuk memasukkan barang ke keranjang.</p>
            </div>
            <!-- Search bar specifically for items in cashier -->
            <div class="position-relative" style="width: 260px;">
              <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2.5 text-muted small"></i>
              <input 
                type="text" 
                v-model="searchProductQuery" 
                class="form-control-style py-1.5 ps-5" 
                placeholder="Cari nama barang..."
                style="height: 36px; padding-left: 36px !important;"
              />
            </div>
          </div>

          <div class="table-responsive" style="max-height: 480px; overflow-y: auto;">
            <table class="table custom-table align-middle">
              <thead>
                <tr>
                  <th>Nama Barang</th>
                  <th>Rak</th>
                  <th>Harga</th>
                  <th>Stok</th>
                  <th class="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="prod in availableProducts" :key="prod.id">
                  <td class="fw-semibold text-dark">{{ prod.name }}</td>
                  <td>
                    <span class="badge bg-light text-secondary border px-2 py-1">{{ prod.rack }}</span>
                  </td>
                  <td class="fw-semibold">{{ formatRupiah(prod.price) }}</td>
                  <td>
                    <span class="badge" :class="prod.stock < prod.limit ? 'bg-light-danger text-danger' : 'bg-light-warning text-warning'">
                      {{ prod.stock }} unit
                    </span>
                  </td>
                  <td>
                    <div class="d-flex justify-content-center">
                      <button @click="addToCart(prod)" class="btn btn-outline-primary-custom btn-sm py-1 px-3">
                        <i class="bi bi-cart-plus me-1"></i>Tambah
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="availableProducts.length === 0">
                  <td colspan="5" class="text-center py-4 text-muted">Barang habis atau tidak ditemukan.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Column: Cart & Summary (40%) -->
      <div class="col-12 col-lg-5">
        <div class="card-content-box shadow-sm d-flex flex-column justify-content-between h-100">
          <div>
            <div class="box-header border-bottom pb-2 mb-3">
              <h2 class="box-title">Keranjang Belanja</h2>
              <p class="box-subtitle">Daftar barang transaksi saat ini.</p>
            </div>

            <!-- Cart Items List -->
            <div class="cart-items-wrapper mb-4" style="max-height: 320px; overflow-y: auto;">
              <div v-for="item in cart" :key="item.product.id" class="d-flex align-items-center justify-content-between border-bottom py-2.5">
                <div style="flex: 1; max-width: 60%;">
                  <span class="fw-bold text-dark d-block text-truncate">{{ item.product.name }}</span>
                  <span class="text-muted small">{{ formatRupiah(item.product.price) }}</span>
                </div>
                
                <!-- Quantity adjusters -->
                <div class="d-flex align-items-center gap-2 px-2">
                  <button @click="decrementQty(item)" class="btn btn-sm btn-light border p-1 d-flex align-items-center justify-content-center" style="width: 24px; height: 24px;">
                    <i class="bi bi-dash"></i>
                  </button>
                  <span class="fw-bold text-dark font-monospace small" style="min-width: 20px; text-align: center;">{{ item.quantity }}</span>
                  <button @click="incrementQty(item)" class="btn btn-sm btn-light border p-1 d-flex align-items-center justify-content-center" style="width: 24px; height: 24px;">
                    <i class="bi bi-plus"></i>
                  </button>
                </div>

                <div class="text-end" style="width: 90px;">
                  <span class="fw-bold text-primary small d-block">{{ formatRupiah(item.product.price * item.quantity) }}</span>
                </div>

                <button @click="removeFromCart(item)" class="btn btn-sm text-danger border-0 p-1 ms-2">
                  <i class="bi bi-trash-fill"></i>
                </button>
              </div>
              <div v-if="cart.length === 0" class="text-center py-5 text-muted">
                <i class="bi bi-cart d-block fs-3 mb-2 text-secondary"></i>
                <span>Keranjang kosong</span>
              </div>
            </div>
          </div>

          <!-- Totals calculations and flexible discount -->
          <div class="border-top pt-3">
            <div class="d-flex justify-content-between mb-2 small text-muted">
              <span>Subtotal:</span>
              <span class="fw-semibold">{{ formatRupiah(subtotal) }}</span>
            </div>

            <!-- Discount direct input (Custom amount in thousands/rupiah) -->
            <div class="mb-3">
              <label class="form-label-style mb-1 text-success">
                <i class="bi bi-tag-fill me-1"></i>Potongan Diskon Langsung (Rp)
              </label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0 small" style="font-size: 0.8rem;">Rp</span>
                <input 
                  type="number" 
                  v-model.number="discountInput" 
                  class="form-control-style border-start-0 py-1.5" 
                  placeholder="Misal: 5000"
                  min="0"
                  :max="subtotal"
                />
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center border-top border-2 pt-2 mb-4">
              <span class="fw-bold text-dark fs-6">Total Pembayaran:</span>
              <span class="fw-bold text-danger fs-5">{{ formatRupiah(finalTotal) }}</span>
            </div>

            <!-- Actions buttons -->
            <div class="row g-2">
              <div class="col-4">
                <button @click="clearCart" :disabled="cart.length === 0" class="btn btn-cancel w-100 py-2.5">
                  Batal
                </button>
              </div>
              <div class="col-8">
                <button @click="openCheckout" :disabled="cart.length === 0" class="btn btn-confirm w-100 py-2.5">
                  <i class="bi bi-cash me-2"></i>Bayar Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Checkout Modal -->
    <transition name="modal">
      <div v-if="showCheckoutModal" class="modal-backdrop-custom">
        <div class="modal-card-custom animate-fade-in" style="max-width: 440px;">
          <div class="modal-header-custom border-bottom">
            <h3 class="modal-title-custom">
              <i class="bi bi-cash-coin text-primary me-2"></i>Pembayaran Transaksi
            </h3>
            <button @click="showCheckoutModal = false" class="btn-close-custom">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="modal-body-custom pb-3">
            <div class="mb-4 text-center">
              <span class="text-muted small d-block">TOTAL TAGIHAN</span>
              <span class="display-6 fw-bold text-danger">{{ formatRupiah(finalTotal) }}</span>
            </div>

            <div class="mb-3">
              <label for="cashReceived" class="form-label-style">Uang Diterima (Rp)</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0">Rp</span>
                <input 
                  type="number" 
                  id="cashReceived" 
                  v-model.number="cashReceived" 
                  class="form-control-style border-start-0 py-2 fs-5 fw-bold" 
                  placeholder="Masukkan jumlah uang..."
                  required
                />
              </div>
            </div>

            <!-- Change display panel -->
            <div class="bg-light border rounded-3 p-3 text-center mb-3">
              <span class="text-muted small d-block mb-1">UANG KEMBALIAN</span>
              <span class="fs-4 fw-bold" :class="cashChange >= 0 && cashReceived >= finalTotal ? 'text-success' : 'text-muted'">
                {{ formatRupiah(cashChange) }}
              </span>
            </div>
          </div>

          <div class="modal-footer-custom border-top">
            <button @click="showCheckoutModal = false" class="btn-cancel">Kembali</button>
            <button 
              @click="completePayment" 
              :disabled="!cashReceived || Number(cashReceived) < finalTotal" 
              class="btn-confirm"
            >
              Konfirmasi Selesai
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.kasir-wrapper {
  padding: 30px;
  overflow-y: auto;
  height: calc(100vh - 70px);
}
.cart-items-wrapper::-webkit-scrollbar {
  width: 6px;
}
.cart-items-wrapper::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}
@media (max-width: 991px) {
  .kasir-wrapper {
    height: auto;
    padding: 20px;
  }
}
</style>
