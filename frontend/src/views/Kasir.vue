<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { state, addTransaction, addNotification, fetchTransactions, fetchProducts } from '../store/store.js'

const parseUtcToLocal = (dateStr) => {
  if (!dateStr) return new Date()
  if (dateStr.includes('Z') || dateStr.includes('+')) {
    return new Date(dateStr)
  }
  const normalized = dateStr.replace(' ', 'T') + 'Z'
  return new Date(normalized)
}

const searchProductQuery = ref('')
const cart = ref([])
const discountInput = ref(0)
const successToastMsg = ref('')

// Filter products based on search query and rack filter in cashier panel
const availableProducts = computed(() => {
  let products = state.products.filter(p => p.stock > 0)

  if (state.selectedRackId !== null) {
    products = products.filter(p => p.rak_id === state.selectedRackId)
  }

  const q = searchProductQuery.value.toLowerCase()
  return products.filter(p =>
    p.name.toLowerCase().includes(q) || p.rack.toLowerCase().includes(q)
  )
})

const activeRackName = computed(() => {
  const rack = state.racks.find(r => r.id === state.selectedRackId)
  return rack ? rack.nama_rak : ''
})

const clearRackFilter = () => {
  state.selectedRackId = null
}

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
const showSuccessModal = ref(false)
const showReceiptModal = ref(false)
const finishedTransaction = ref(null)
const cashReceived = ref('')
const customerName = ref('')
const customerPhone = ref('')
const paymentMethod = ref('Tunai') // 'Tunai' | 'QRIS'
const isCompletingPayment = ref(false)

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
const getShopReceiptFooter = () => {
  const saved = localStorage.getItem('shop_receipt_header')
  return saved ? JSON.parse(saved) : 'Terima Kasih Telah Belanja di Toko Ce Alin!'
}
const getPrinterPaperSize = () => {
  const saved = localStorage.getItem('shop_printer_size')
  return saved ? JSON.parse(saved) : '58mm'
}

const cashChange = computed(() => {
  if (paymentMethod.value === 'QRIS') return 0
  if (!cashReceived.value) return 0
  const change = Number(cashReceived.value) - finalTotal.value
  return Math.max(0, change)
})

// QRIS Midtrans state
const qrisOrderId = ref('')
const qrisQrUrl = ref('')
const qrisExpiryTime = ref('')
const qrisStatus = ref('idle') // idle | loading | pending | settlement | expire | error
const qrisErrorMsg = ref('')
const qrisPollInterval = ref(null)
const qrisSecondsLeft = ref(0)
const qrisCountdownInterval = ref(null)
const copiedOrderId = ref(false)

const isPaymentReady = computed(() => {
  if (paymentMethod.value === 'QRIS') return qrisStatus.value === 'settlement'
  return cashReceived.value && Number(cashReceived.value) >= finalTotal.value
})

// Generate a unique order ID for QRIS
const generateQrisOrderId = () => {
  const ts = Date.now()
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `QRIS-${ts}-${rand}`
}

// Stop polling and countdown
const stopQrisPolling = () => {
  if (qrisPollInterval.value) {
    clearTimeout(qrisPollInterval.value)
    qrisPollInterval.value = null
  }
  if (qrisCountdownInterval.value) {
    clearInterval(qrisCountdownInterval.value)
    qrisCountdownInterval.value = null
  }
}

onUnmounted(() => {
  stopQrisPolling()
})

// Start polling Midtrans status with sequential setTimeout to avoid race conditions
const startQrisPolling = (orderId) => {
  stopQrisPolling()
  
  const poll = async () => {
    // Check if we are still waiting for this QRIS payment
    if (paymentMethod.value !== 'QRIS' || qrisOrderId.value !== orderId || qrisStatus.value !== 'pending') {
      return
    }

    try {
      const res = await fetch(`http://localhost:8000/api/qris/status/${orderId}`, {
        credentials: 'include'
      })
      const data = await res.json()
      
      // Double check state after request returns to ensure it hasn't changed
      if (paymentMethod.value !== 'QRIS' || qrisOrderId.value !== orderId || qrisStatus.value !== 'pending') {
        return
      }

      if (data.success) {
        const txStatus = data.transaction_status
        if (txStatus === 'settlement' || txStatus === 'capture') {
          qrisStatus.value = 'settlement'
          stopQrisPolling()
          // Auto-complete the transaction
          await completePayment()
          return
        } else if (txStatus === 'expire' || txStatus === 'cancel' || txStatus === 'deny') {
          qrisStatus.value = 'expire'
          stopQrisPolling()
          return
        }
      }
    } catch (e) {
      console.warn('QRIS polling error:', e)
    }

    // Schedule next poll only if still pending
    if (paymentMethod.value === 'QRIS' && qrisOrderId.value === orderId && qrisStatus.value === 'pending') {
      qrisPollInterval.value = setTimeout(poll, 3000)
    }
  }

  // Queue first check in 3 seconds
  qrisPollInterval.value = setTimeout(poll, 3000)

  // Countdown timer (QR expires in 15 min = 900 seconds)
  if (qrisExpiryTime.value) {
    const expiryMs = new Date(qrisExpiryTime.value).getTime()
    qrisCountdownInterval.value = setInterval(() => {
      const now = Date.now()
      const diff = Math.max(0, Math.round((expiryMs - now) / 1000))
      qrisSecondsLeft.value = diff
      if (diff <= 0) {
        qrisStatus.value = 'expire'
        stopQrisPolling()
      }
    }, 1000)
  }
}

// Initiate a real QRIS charge from Midtrans
const initiateQrisPayment = async () => {
  if (finalTotal.value <= 0) return
  qrisStatus.value = 'loading'
  qrisErrorMsg.value = ''
  qrisQrUrl.value = ''

  const newOrderId = generateQrisOrderId()
  qrisOrderId.value = newOrderId

  try {
    const res = await fetch('http://localhost:8000/api/qris/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        order_id: newOrderId,
        amount: finalTotal.value
      })
    })
    const data = await res.json()
    if (data.success && data.qr_string) {
      qrisQrUrl.value = data.qr_string
      qrisExpiryTime.value = data.expiry_time || ''
      qrisStatus.value = 'pending'
      // Compute seconds left
      if (data.expiry_time) {
        qrisSecondsLeft.value = Math.max(0, Math.round((new Date(data.expiry_time).getTime() - Date.now()) / 1000))
      } else {
        qrisSecondsLeft.value = 900
      }
      startQrisPolling(newOrderId)
    } else {
      qrisStatus.value = 'error'
      qrisErrorMsg.value = data.message || 'Gagal membuat QR code'
    }
  } catch (e) {
    qrisStatus.value = 'error'
    qrisErrorMsg.value = 'Gagal terhubung ke server'
  }
}

// Format countdown seconds to MM:SS
const formatCountdown = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// Copy Order ID to clipboard
const copyOrderId = async () => {
  try {
    await navigator.clipboard.writeText(qrisOrderId.value)
    copiedOrderId.value = true
    setTimeout(() => { copiedOrderId.value = false }, 2000)
  } catch {
    // fallback for older browsers
    const el = document.createElement('textarea')
    el.value = qrisOrderId.value
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copiedOrderId.value = true
    setTimeout(() => { copiedOrderId.value = false }, 2000)
  }
}

const openCheckout = () => {
  if (cart.value.length === 0) {
    alert('Keranjang belanja kosong! Silakan pilih produk terlebih dahulu.')
    return
  }
  cashReceived.value = ''
  customerName.value = ''
  customerPhone.value = ''
  paymentMethod.value = 'Tunai'
  // Reset QRIS state
  stopQrisPolling()
  qrisStatus.value = 'idle'
  qrisQrUrl.value = ''
  qrisOrderId.value = ''
  qrisErrorMsg.value = ''
  showCheckoutModal.value = true
}

const completePayment = async () => {
  if (isCompletingPayment.value) return

  if (paymentMethod.value === 'Tunai') {
    if (!cashReceived.value || Number(cashReceived.value) < finalTotal.value) {
      alert('Uang pembayaran tidak mencukupi!')
      return
    }
  }
  // For QRIS: ensure settlement confirmed before proceeding
  if (paymentMethod.value === 'QRIS' && qrisStatus.value !== 'settlement') {
    return
  }

  const customerData = {
    name: customerName.value,
    phone: customerPhone.value
  }
  const itemsCopy = [...cart.value]
  const subtotalVal = subtotal.value
  const discountVal = Number(discountInput.value || 0)
  const finalTotalVal = finalTotal.value
  const cashReceivedVal = paymentMethod.value === 'QRIS' ? finalTotalVal : Number(cashReceived.value)
  const cashChangeVal = paymentMethod.value === 'QRIS' ? 0 : cashChange.value
  const metodePembayaran = paymentMethod.value

  isCompletingPayment.value = true
  try {
    const response = await fetch('http://localhost:8000/api/transaksi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        cart: cart.value.map(item => ({
          product: { id: item.product.id },
          quantity: item.quantity
        })),
        total_harga: finalTotal.value + discountVal,
        total_diskon: discountVal,
        grand_total: finalTotal.value,
        customer: customerData,
        metode_pembayaran: metodePembayaran
      })
    })

    const resData = await response.json()
    if (response.ok && resData.success) {
      addNotification('Transaksi Penjualan', `Transaksi #${resData.data.kode_transaksi} senilai ${formatRupiah(finalTotal.value)} sukses diselesaikan.`, 'success')
      const dateObj = parseUtcToLocal(resData.data.tanggal)
      // Set finished transaction for printing
      finishedTransaction.value = {
        kode_transaksi: resData.data.kode_transaksi,
        time: dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        date: dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
        items: itemsCopy,
        subtotal: subtotalVal,
        discount: discountVal,
        total: finalTotalVal,
        cashReceived: cashReceivedVal,
        cashChange: cashChangeVal,
        metode_pembayaran: metodePembayaran,
        cashierName: state.currentUser?.name || 'System',
        customerName: customerData.name || 'Umum',
        customerPhone: customerData.phone || ''
      }

      // Reset cashier states
      cart.value = []
      discountInput.value = 0
      showCheckoutModal.value = false
      showSuccessModal.value = true

      // Reload global transactions and products to keep views automatically updated without manual refresh
      fetchTransactions()
      fetchProducts()

      // Show success modal for 1.8 seconds, then show receipt
      setTimeout(() => {
        showSuccessModal.value = false
        showReceiptModal.value = true

        // Check if auto-print receipt is enabled
        const autoPrint = JSON.parse(localStorage.getItem('shop_auto_print') || 'true')
        if (autoPrint && state.printerPaired) {
          setTimeout(() => {
            printReceipt()
          }, 400)
        }
      }, 1800)
    } else {
      alert(resData.message || 'Gagal menyimpan transaksi!')
    }
  } catch (error) {
    console.error('Error completing payment:', error)
    alert('Terjadi kesalahan jaringan saat memproses transaksi!')
  } finally {
    isCompletingPayment.value = false
  }
}

const printReceipt = () => {
  window.print()
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

// Pagination state for cashier products
const currentPage = ref(1)
const itemsPerPage = ref(10)

const totalPages = computed(() => Math.ceil(availableProducts.value.length / itemsPerPage.value))

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return sortedProducts.value.slice(start, end)
})

// Sorting state for cashier products
const sortBy = ref('name-asc')

const sortedProducts = computed(() => {
  const products = [...availableProducts.value]
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

// Reset page when search changes
watch(searchProductQuery, () => {
  currentPage.value = 1
})

// WhatsApp Struk Send States & Logic
const waNumberInput = ref('')
const isSendingWa = ref(false)

watch(showReceiptModal, (newVal) => {
  if (newVal && finishedTransaction.value) {
    waNumberInput.value = finishedTransaction.value.customerPhone || ''
  } else {
    waNumberInput.value = ''
  }
})

const cleanWaNumber = (num) => {
  let cleaned = num.replace(/\D/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1)
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned
  }
  return cleaned
}

const formatReceiptMessage = (tx) => {
  const shopName = getShopName()
  const shopAddress = getShopAddress()
  const shopWa = getShopWa()
  const footer = getShopReceiptFooter()
  
  let msg = `*${shopName.toUpperCase()}*\n`
  msg += `${shopAddress}\n`
  msg += `Telp/WA: ${shopWa}\n`
  msg += `----------------------------------------\n`
  msg += `No. Nota: ${tx.kode_transaksi}\n`
  msg += `Tanggal : ${tx.date} ${tx.time}\n`
  msg += `Kasir   : ${tx.cashierName}\n`
  msg += `Pelanggan: ${tx.customerName}\n`
  msg += `----------------------------------------\n`
  msg += `*Rincian Belanja:*\n\n`
  
  tx.items.forEach(item => {
    msg += `- ${item.product.name}\n`
    msg += `  ${item.quantity} x ${formatRupiah(item.product.price)} = ${formatRupiah(item.product.price * item.quantity)}\n\n`
  })
  
  msg += `----------------------------------------\n`
  msg += `Subtotal: ${formatRupiah(tx.subtotal)}\n`
  if (tx.discount > 0) {
    msg += `Diskon  : -${formatRupiah(tx.discount)}\n`
  }
  msg += `*TOTAL   : ${formatRupiah(tx.total)}*\n`
  msg += `Bayar   : ${tx.metode_pembayaran === 'QRIS' ? 'QRIS' : formatRupiah(tx.cashReceived)} (${tx.metode_pembayaran})\n`
  if (tx.metode_pembayaran !== 'QRIS') {
    msg += `Kembali : ${formatRupiah(tx.cashChange)}\n`
  }
  msg += `----------------------------------------\n`
  msg += `${footer}`
  
  return msg
}

const sendWaReceipt = async () => {
  if (!waNumberInput.value) return
  if (!finishedTransaction.value) return

  const cleanedNum = cleanWaNumber(waNumberInput.value)
  if (cleanedNum.length < 9) {
    alert('Format nomor WhatsApp tidak valid!')
    return
  }

  isSendingWa.value = true
  try {
    const formattedMsg = formatReceiptMessage(finishedTransaction.value)
    const response = await fetch('http://localhost:8000/api/whatsapp/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        message: formattedMsg,
        numbers: [cleanedNum],
        template: 'Struk Belanja',
        target: finishedTransaction.value.customerName || 'Umum'
      })
    })

    const resData = await response.json()
    if (response.ok && resData.success) {
      successToastMsg.value = 'Struk belanja berhasil dikirim via WhatsApp!'
      setTimeout(() => {
        successToastMsg.value = ''
      }, 3000)
    } else {
      alert(resData.message || 'Gagal mengirim struk via WhatsApp. Pastikan koneksi gateway WhatsApp terhubung.')
    }
  } catch (error) {
    console.error('Error sending WA receipt:', error)
    alert('Terjadi kesalahan jaringan saat mengirim struk ke WhatsApp!')
  } finally {
    isSendingWa.value = false
  }
}
</script>

<template>
  <div class="kasir-wrapper">
    <!-- Success Toast Alert -->
    <transition name="fade">
      <div v-if="successToastMsg" class="custom-alert alert alert-success d-flex align-items-center shadow"
        role="alert">
        <i class="bi bi-check-circle-fill me-2 fs-5"></i>
        <div>{{ successToastMsg }}</div>
      </div>
    </transition>

    <!-- Page Title -->
    <div class="content-header mb-4">
      <h1 class="page-title">Kasir Transaksi</h1>
      <p class="page-subtitle">Pilih produk belanjaan pelanggan, atur diskon potongan harga langsung, dan selesaikan
        pembayaran.</p>
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
              <input type="text" v-model="searchProductQuery" class="form-control-style py-1.5 ps-5"
                placeholder="Cari nama barang..." style="height: 36px; padding-left: 36px !important;" />
            </div>
          </div>

          <!-- Active Rack Filter Badge -->
          <div v-if="state.selectedRackId !== null"
            class="alert alert-info border-0 shadow-sm d-flex align-items-center justify-content-between p-2.5 mb-3 rounded-3"
            style="background-color: #f0f7ff; color: #1e3a8a; font-size: 0.85rem;">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-funnel-fill text-primary"></i>
              <div>
                Rak: <strong>{{ activeRackName }}</strong>
                <span class="text-muted ms-2">({{ availableProducts.length }} barang tersedia)</span>
              </div>
            </div>
            <button @click="clearRackFilter"
              class="btn btn-sm btn-outline-primary-custom rounded-3 py-0.5 px-2 d-flex align-items-center gap-1"
              style="font-size: 0.75rem;">
              <i class="bi bi-x-lg"></i>
              <span>Hapus Filter</span>
            </button>
          </div>

          <div class="table-responsive" style="max-height: 480px; overflow-y: auto;">
            <table class="table custom-table align-middle">
              <thead>
                <tr>
                  <th @click="toggleSort('name')" style="cursor: pointer; user-select: none;">
                    Nama Barang
                    <i class="bi ms-1"
                      :class="sortBy.startsWith('name') ? (sortBy === 'name-asc' ? 'bi-sort-alpha-down text-primary' : 'bi-sort-alpha-up-alt text-primary') : 'bi-arrow-down-up text-muted small'"></i>
                  </th>
                  <th>Rak</th>
                  <th @click="toggleSort('price')" style="cursor: pointer; user-select: none;">
                    Harga
                    <i class="bi ms-1"
                      :class="sortBy.startsWith('price') ? (sortBy === 'price-asc' ? 'bi-sort-numeric-down text-primary' : 'bi-sort-numeric-up-alt text-primary') : 'bi-arrow-down-up text-muted small'"></i>
                  </th>
                  <th @click="toggleSort('stock')" style="cursor: pointer; user-select: none;">
                    Stok
                    <i class="bi ms-1"
                      :class="sortBy.startsWith('stock') ? (sortBy === 'stock-asc' ? 'bi-sort-numeric-down text-primary' : 'bi-sort-numeric-up-alt text-primary') : 'bi-arrow-down-up text-muted small'"></i>
                  </th>
                  <th class="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="prod in paginatedProducts" :key="prod.id">
                  <td class="fw-semibold text-dark">{{ prod.name }}</td>
                  <td>
                    <span class="badge bg-light text-secondary border px-2 py-1">{{ prod.rack }}</span>
                  </td>
                  <td class="fw-semibold">{{ formatRupiah(prod.price) }}</td>
                  <td>
                    <span class="badge"
                      :class="prod.stock < prod.limit ? 'bg-light-danger text-danger' : 'bg-light-warning text-warning'">
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

          <!-- Pagination Controls -->
          <div v-if="totalPages > 1"
            class="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2 pt-2 border-top">
            <div class="text-muted small" style="font-size: 0.75rem;">
              Menampilkan <strong>{{ (currentPage - 1) * itemsPerPage + 1 }}</strong> - <strong>{{ Math.min(currentPage
                * itemsPerPage, availableProducts.length) }}</strong> dari <strong>{{ availableProducts.length
                }}</strong>
            </div>
            <nav aria-label="Page navigation">
              <ul class="pagination pagination-sm mb-0">
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <button class="page-link rounded-start-3 px-2 py-0.5" @click="currentPage--"
                    :disabled="currentPage === 1" aria-label="Previous">
                    <i class="bi bi-chevron-left"></i>
                  </button>
                </li>
                <li v-for="page in visiblePages" :key="page" class="page-item"
                  :class="{ active: currentPage === page }">
                  <button class="page-link px-2.5 py-0.5" style="font-size: 0.75rem;" @click="currentPage = page">{{
                    page }}</button>
                </li>
                <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                  <button class="page-link rounded-end-3 px-2 py-0.5" @click="currentPage++"
                    :disabled="currentPage === totalPages" aria-label="Next">
                    <i class="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
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
              <div v-for="item in cart" :key="item.product.id"
                class="d-flex align-items-center justify-content-between border-bottom py-2.5">
                <div style="flex: 1; max-width: 60%;">
                  <span class="fw-bold text-dark d-block text-truncate">{{ item.product.name }}</span>
                  <span class="text-muted small">{{ formatRupiah(item.product.price) }}</span>
                </div>

                <!-- Quantity adjusters -->
                <div class="d-flex align-items-center gap-2 px-2">
                  <button @click="decrementQty(item)"
                    class="btn btn-sm btn-light border p-1 d-flex align-items-center justify-content-center"
                    style="width: 24px; height: 24px;">
                    <i class="bi bi-dash"></i>
                  </button>
                  <span class="fw-bold text-dark font-monospace small" style="min-width: 20px; text-align: center;">{{
                    item.quantity }}</span>
                  <button @click="incrementQty(item)"
                    class="btn btn-sm btn-light border p-1 d-flex align-items-center justify-content-center"
                    style="width: 24px; height: 24px;">
                    <i class="bi bi-plus"></i>
                  </button>
                </div>

                <div class="text-end" style="width: 90px;">
                  <span class="fw-bold text-primary small d-block">{{ formatRupiah(item.product.price * item.quantity)
                    }}</span>
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
                <input type="number" v-model.number="discountInput" class="form-control-style border-start-0 py-1.5"
                  placeholder="Misal: 5000" min="0" :max="subtotal" />
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
            <button @click="showCheckoutModal = false; stopQrisPolling()" class="btn-close-custom">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="modal-body-custom pb-3">
            <!-- Total header -->
            <div class="mb-3 text-center">
              <span class="text-muted small d-block">TOTAL TAGIHAN</span>
              <span class="display-6 fw-bold text-danger">{{ formatRupiah(finalTotal) }}</span>
            </div>

            <!-- Payment Method Toggle -->
            <div class="payment-method-tabs mb-3">
              <button id="tab-tunai" class="payment-tab-btn" :class="{ active: paymentMethod === 'Tunai' }"
                @click="paymentMethod = 'Tunai'; stopQrisPolling()">
                <i class="bi bi-cash-coin me-1"></i>Tunai
              </button>
              <button id="tab-qris" class="payment-tab-btn" :class="{ active: paymentMethod === 'QRIS' }"
                @click="paymentMethod = 'QRIS'; if (qrisStatus === 'idle') initiateQrisPayment()">
                <i class="bi bi-qr-code me-1"></i>QRIS
              </button>
            </div>

            <!-- Customer Identity Fields -->
            <div class="row g-2 mb-3">
              <div class="col-6">
                <label for="custName" class="form-label-style">Nama Customer (Opsional)</label>
                <input type="text" id="custName" v-model="customerName" class="form-control-style"
                  placeholder="Nama pembeli..." />
              </div>
              <div class="col-6">
                <label for="custPhone" class="form-label-style">No. WhatsApp (Opsional)</label>
                <input type="text" id="custPhone" v-model="customerPhone" class="form-control-style"
                  placeholder="Contoh: 0812xxx" />
              </div>
            </div>

            <!-- Tunai Section -->
            <div v-if="paymentMethod === 'Tunai'">
              <div class="mb-3">
                <label for="cashReceived" class="form-label-style">Uang Diterima (Rp)</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0">Rp</span>
                  <input type="number" id="cashReceived" v-model.number="cashReceived"
                    class="form-control-style border-start-0 py-2 fs-5 fw-bold" placeholder="Masukkan jumlah uang..."
                    required />
                </div>
              </div>
              <!-- Change display panel -->
              <div class="bg-light border rounded-3 p-3 text-center">
                <span class="text-muted small d-block mb-1">UANG KEMBALIAN</span>
                <span class="fs-4 fw-bold"
                  :class="cashChange >= 0 && cashReceived >= finalTotal ? 'text-success' : 'text-muted'">
                  {{ formatRupiah(cashChange) }}
                </span>
              </div>
            </div>

            <!-- QRIS Section -->
            <div v-if="paymentMethod === 'QRIS'" class="qris-section text-center">

              <!-- Loading State -->
              <div v-if="qrisStatus === 'loading'"
                class="qris-card d-flex flex-column align-items-center justify-content-center py-5">
                <div class="spinner-border text-light mb-3" role="status" style="width: 3rem; height: 3rem;"></div>
                <span class="text-light small">Membuat QR Code QRIS...</span>
              </div>

              <!-- Error State -->
              <div v-else-if="qrisStatus === 'error'"
                class="qris-card d-flex flex-column align-items-center justify-content-center py-4 gap-3">
                <i class="bi bi-exclamation-triangle-fill text-warning" style="font-size: 2.5rem;"></i>
                <span class="text-light small">{{ qrisErrorMsg }}</span>
                <button @click="initiateQrisPayment" class="qris-retry-btn">
                  <i class="bi bi-arrow-clockwise me-1"></i>Coba Lagi
                </button>
              </div>

              <!-- Expired State -->
              <div v-else-if="qrisStatus === 'expire'"
                class="qris-card d-flex flex-column align-items-center justify-content-center py-4 gap-3">
                <i class="bi bi-clock-history text-warning" style="font-size: 2.5rem;"></i>
                <span class="text-light small">QR Code sudah kedaluwarsa</span>
                <button @click="initiateQrisPayment" class="qris-retry-btn">
                  <i class="bi bi-qr-code me-1"></i>Buat QR Baru
                </button>
              </div>

              <!-- Idle State (not yet initiated) -->
              <div v-else-if="qrisStatus === 'idle'"
                class="qris-card d-flex flex-column align-items-center justify-content-center py-5">
                <button @click="initiateQrisPayment" class="qris-retry-btn">
                  <i class="bi bi-qr-code me-1"></i>Buat QR Code
                </button>
              </div>

              <!-- Pending / Settlement State — show real QR -->
              <div v-else class="qris-card">
                <div class="qris-header">
                  <span class="qris-badge">QRIS</span>
                  <div class="d-flex align-items-center gap-2">
                    <span v-if="qrisStatus === 'settlement'" class="qris-status-badge settlement">
                      <i class="bi bi-check-circle-fill me-1"></i>Lunas!
                    </span>
                    <span v-else class="qris-subtitle">
                      <i class="bi bi-hourglass-split me-1 text-warning"></i>
                      Berlaku: <strong class="text-warning">{{ formatCountdown(qrisSecondsLeft) }}</strong>
                    </span>
                  </div>
                </div>

                <div class="qris-qr-wrapper" :class="{ 'qris-settled': qrisStatus === 'settlement' }">
                  <!-- Real QR image from Midtrans -->
                  <img :src="qrisQrUrl" alt="QR Code Pembayaran QRIS" class="qris-qr-img" />
                  <!-- Settlement overlay -->
                  <div v-if="qrisStatus === 'settlement'" class="qris-settled-overlay">
                    <i class="bi bi-check-circle-fill"></i>
                  </div>
                  <div class="qris-amount-badge">
                    {{ formatRupiah(finalTotal) }}
                  </div>
                </div>

                <div class="qris-info">
                  <i class="bi bi-shield-check-fill text-success me-1"></i>
                  <span class="text-muted small">Scan dengan GoPay, OVO, Dana, LinkAja, m-Banking</span>
                </div>
                <div class="qris-store-info mt-2">
                  <span class="fw-semibold text-light small">{{ getShopName() }}</span>
                </div>
              </div>

              <!-- Sandbox Test Helper (always visible when pending) -->
              <div v-if="qrisStatus === 'pending'" class="qris-sandbox-box">
                <div class="qris-sandbox-label">
                  <i class="bi bi-bug-fill me-1 text-warning"></i>
                  <span>Mode Sandbox — Gunakan simulator untuk test</span>
                </div>
                <div class="qris-sandbox-orderid">
                  <span class="qris-sandbox-orderlabel">Order ID:</span>
                  <code class="qris-sandbox-code">{{ qrisOrderId }}</code>
                  <button @click="copyOrderId" class="qris-copy-btn"
                    :title="copiedOrderId ? 'Tersalin!' : 'Salin Order ID'">
                    <i class="bi" :class="copiedOrderId ? 'bi-check-lg text-success' : 'bi-clipboard'"></i>
                  </button>
                </div>
                <a href="https://simulator.sandbox.midtrans.com/qris/index" target="_blank" rel="noopener noreferrer"
                  class="qris-simulator-link">
                  <i class="bi bi-box-arrow-up-right me-1"></i>
                  Buka QRIS Simulator Midtrans
                </a>
              </div>

              <!-- Polling status indicator -->
              <div v-if="qrisStatus === 'pending'"
                class="mt-2 text-muted small d-flex align-items-center justify-content-center gap-1">
                <span class="spinner-border spinner-border-sm" role="status" style="width: 10px; height: 10px;"></span>
                <span>Menunggu pembayaran... (otomatis terdeteksi)</span>
              </div>
              <div v-if="qrisStatus === 'settlement'"
                class="mt-2 text-success small fw-semibold d-flex align-items-center justify-content-center gap-1">
                <i class="bi bi-check-circle-fill"></i>
                <span>Pembayaran diterima! Memproses transaksi...</span>
              </div>
            </div>
          </div>

          <div class="modal-footer-custom border-top">
            <button @click="showCheckoutModal = false; stopQrisPolling()" :disabled="isCompletingPayment"
              class="btn-cancel">Kembali</button>
            <!-- Tunai: show confirm button -->
            <button v-if="paymentMethod === 'Tunai'" @click="completePayment"
              :disabled="!isPaymentReady || isCompletingPayment" class="btn-confirm">
              <span v-if="isCompletingPayment" class="spinner-border spinner-border-sm me-2" role="status"
                aria-hidden="true"></span>
              <i v-else class="bi bi-cash-coin me-1"></i>
              {{ isCompletingPayment ? 'Memproses...' : 'Konfirmasi Selesai' }}
            </button>
            <!-- QRIS: show waiting/done indicator instead of manual button -->
            <span v-if="paymentMethod === 'QRIS' && qrisStatus === 'pending'"
              class="text-muted small ms-auto d-flex align-items-center gap-1">
              <span class="spinner-border spinner-border-sm" style="width:12px;height:12px;"></span>
              Menunggu...
            </span>
            <span v-if="paymentMethod === 'QRIS' && qrisStatus === 'settlement'"
              class="text-success small ms-auto fw-semibold">
              <i class="bi bi-check-circle-fill"></i> Memproses...
            </span>
          </div>
        </div>
      </div>
    </transition>

    <!-- Success Transaction Modal -->
    <transition name="modal">
      <div v-if="showSuccessModal" class="modal-backdrop-custom">
        <div class="modal-card-custom text-center py-5 px-4 animate-fade-in"
          style="max-width: 380px; border-radius: 16px;">
          <div class="mb-4">
            <div
              class="success-icon-wrapper mx-auto d-flex align-items-center justify-content-center bg-light-success text-success rounded-circle"
              style="width: 80px; height: 80px;">
              <i class="bi bi-check-circle-fill text-success" style="font-size: 3.5rem; line-height: 1;"></i>
            </div>
          </div>
          <h3 class="fw-bold text-dark mb-2">Pembayaran Berhasil!</h3>
          <p class="text-muted mb-0 small">Transaksi telah dicatat ke sistem secara permanen.</p>
          <div class="mt-4 text-muted small d-flex align-items-center justify-content-center gap-2">
            <span class="spinner-border spinner-border-sm text-secondary" role="status"
              style="width: 14px; height: 14px;"></span>
            <span>Mempersiapkan struk belanja...</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- Receipt Modal -->
    <transition name="modal">
      <div v-if="showReceiptModal" class="modal-backdrop-custom">
        <div class="modal-card-custom animate-fade-in" style="max-width: 460px;">
          <div class="modal-header-custom border-bottom">
            <h3 class="modal-title-custom">
              <i class="bi bi-receipt-cutoff text-primary me-2"></i>Struk Belanja
            </h3>
            <button @click="showReceiptModal = false; finishedTransaction = null" class="btn-close-custom">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="modal-body-custom pb-3" style="max-height: 60vh; overflow-y: auto; background-color: #f8fafc;">
            <!-- Printer status indicator inside the modal -->
            <div
              class="p-3 mb-3 border-bottom bg-white d-flex align-items-center justify-content-between rounded-top-3 text-start">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-printer-fill" :class="state.printerPaired ? 'text-success' : 'text-secondary'"></i>
                <div>
                  <div class="fw-bold text-dark" style="font-size: 0.82rem;">Status Printer:</div>
                  <div class="text-muted font-monospace" style="font-size: 0.72rem;">
                    {{ state.printerPaired ? `${state.printerPairedName} (${getPrinterPaperSize()})` : 'Belum Ditautkan'
                    }}
                  </div>
                </div>
              </div>
              <router-link to="/pengaturan"
                class="btn btn-xs btn-outline-secondary py-0.5 px-2 text-decoration-none small text-dark border-secondary-subtle"
                style="font-size: 0.72rem;">
                <i class="bi bi-gear-fill me-1"></i>Atur
              </router-link>
            </div>

            <!-- Receipt Paper Preview -->
            <div class="receipt-paper shadow-sm mx-auto my-2"
              :class="getPrinterPaperSize() === '80mm' ? 'paper-preview-80' : 'paper-preview-58'">
              <!-- Store Identity -->
              <div class="text-center mb-2">
                <h4 class="receipt-store-name m-0">{{ getShopName() }}</h4>
                <p class="receipt-store-detail m-0 mt-1">{{ getShopAddress() }}</p>
                <p class="receipt-store-detail m-0">Telp/WA: {{ getShopWa() }}</p>
              </div>

              <div class="receipt-divider"></div>

              <!-- Transaction Meta -->
              <div class="receipt-meta small text-start">
                <div class="d-flex justify-content-between">
                  <span>No: {{ finishedTransaction?.kode_transaksi }}</span>
                  <span>{{ finishedTransaction?.time }}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span>Tgl: {{ finishedTransaction?.date }}</span>
                  <span>Kasir: {{ finishedTransaction?.cashierName }}</span>
                </div>
                <div v-if="finishedTransaction?.customerName && finishedTransaction?.customerName !== 'Umum'"
                  class="d-flex justify-content-between">
                  <span>Pelanggan: {{ finishedTransaction?.customerName }}</span>
                  <span v-if="finishedTransaction?.customerPhone" class="text-muted">({{
                    finishedTransaction?.customerPhone }})</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span>Metode:</span>
                  <span class="fw-semibold"
                    :class="finishedTransaction?.metode_pembayaran === 'QRIS' ? 'text-primary' : 'text-success'">
                    {{ finishedTransaction?.metode_pembayaran || 'Tunai' }}
                  </span>
                </div>
              </div>

              <div class="receipt-divider"></div>

              <!-- Items List -->
              <div class="receipt-items small text-start">
                <div v-for="item in finishedTransaction?.items" :key="item.product.id" class="mb-2">
                  <div class="receipt-item-name fw-semibold text-dark">{{ item.product.name }}</div>
                  <div class="d-flex justify-content-between font-monospace text-muted mt-0.5">
                    <span>{{ item.quantity }} x {{ formatRupiah(item.product.price) }}</span>
                    <span>{{ formatRupiah(item.product.price * item.quantity) }}</span>
                  </div>
                </div>
              </div>

              <div class="receipt-divider"></div>

              <!-- Calculations -->
              <div class="receipt-calc small font-monospace text-start">
                <div class="d-flex justify-content-between text-dark">
                  <span>Subtotal:</span>
                  <span>{{ formatRupiah(finishedTransaction?.subtotal) }}</span>
                </div>
                <div v-if="finishedTransaction?.discount > 0" class="d-flex justify-content-between text-success">
                  <span>Diskon:</span>
                  <span>-{{ formatRupiah(finishedTransaction?.discount) }}</span>
                </div>
                <div class="d-flex justify-content-between fw-bold text-dark fs-6 my-1">
                  <span>TOTAL:</span>
                  <span>{{ formatRupiah(finishedTransaction?.total) }}</span>
                </div>
                <div class="d-flex justify-content-between text-muted mt-1">
                  <span>Bayar:</span>
                  <span>{{ finishedTransaction?.metode_pembayaran === 'QRIS' ? 'QRIS' :
                    formatRupiah(finishedTransaction?.cashReceived) }}</span>
                </div>
                <div v-if="finishedTransaction?.metode_pembayaran !== 'QRIS'"
                  class="d-flex justify-content-between text-muted">
                  <span>Kembali:</span>
                  <span>{{ formatRupiah(finishedTransaction?.cashChange) }}</span>
                </div>
              </div>

              <div class="receipt-divider"></div>

              <!-- Footer -->
              <div class="text-center mt-3 small receipt-footer">
                {{ getShopReceiptFooter() }}
              </div>
            </div>

            <!-- WhatsApp Send Option -->
            <div class="bg-white border rounded-3 p-3 mt-3 text-start mx-auto shadow-sm" style="max-width: 380px;">
              <h5 class="fw-bold text-dark mb-1 d-flex align-items-center gap-1.5" style="font-size: 0.85rem;">
                <i class="bi bi-whatsapp text-success fs-5"></i>Kirim Struk via WhatsApp
              </h5>
              <p class="text-muted mb-2.5" style="font-size: 0.72rem;">Kirim rincian nota belanja ini langsung ke nomor WhatsApp pelanggan.</p>
              
              <div class="d-flex gap-2">
                <input 
                  type="text" 
                  v-model="waNumberInput" 
                  class="form-control-style py-1.5 px-3" 
                  placeholder="Contoh: 08123456789" 
                  style="font-size: 0.8rem; height: 36px;"
                  :disabled="isSendingWa"
                />
                <button 
                  @click="sendWaReceipt" 
                  :disabled="isSendingWa || !waNumberInput" 
                  class="btn btn-sm btn-success d-flex align-items-center justify-content-center gap-1 fw-bold border-0 px-3" 
                  style="background-color: #25d366; color: white; font-size: 0.8rem; height: 36px; border-radius: 8px;"
                >
                  <span v-if="isSendingWa" class="spinner-border spinner-border-sm" role="status" aria-hidden="true" style="width: 14px; height: 14px;"></span>
                  <span v-else>Kirim</span>
                </button>
              </div>
            </div>

          </div>

          <div class="modal-footer-custom border-top">
            <button @click="showReceiptModal = false; finishedTransaction = null" class="btn-cancel">Tutup</button>
            <button @click="printReceipt" class="btn-confirm d-flex align-items-center justify-content-center gap-1.5">
              <i class="bi bi-printer-fill"></i> Cetak Struk
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Hidden Thermal Receipt Area (Only Visible During Printing) -->
    <div v-if="finishedTransaction" id="thermal-receipt-area"
      :class="getPrinterPaperSize() === '80mm' ? 'paper-80mm' : 'paper-58mm'">
      <!-- Store Identity -->
      <div class="text-center">
        <h4 class="receipt-store-name">{{ getShopName() }}</h4>
        <p class="receipt-store-detail">{{ getShopAddress() }}</p>
        <p class="receipt-store-detail">Telp/WA: {{ getShopWa() }}</p>
      </div>

      <div class="receipt-divider"></div>

      <!-- Transaction Meta -->
      <div class="receipt-meta small">
        <div class="d-flex justify-content-between">
          <span>No: {{ finishedTransaction?.kode_transaksi }}</span>
          <span>{{ finishedTransaction?.time }}</span>
        </div>
        <div class="d-flex justify-content-between">
          <span>Tgl: {{ finishedTransaction?.date }}</span>
          <span>Kasir: {{ finishedTransaction?.cashierName }}</span>
        </div>
        <div v-if="finishedTransaction?.customerName && finishedTransaction?.customerName !== 'Umum'"
          class="d-flex justify-content-between">
          <span>Pelanggan: {{ finishedTransaction?.customerName }}</span>
          <span v-if="finishedTransaction?.customerPhone">({{ finishedTransaction?.customerPhone }})</span>
        </div>
        <div class="d-flex justify-content-between">
          <span>Metode: {{ finishedTransaction?.metode_pembayaran || 'Tunai' }}</span>
        </div>
      </div>

      <div class="receipt-divider"></div>

      <!-- Items List -->
      <div class="receipt-items small">
        <div v-for="item in finishedTransaction?.items" :key="item.product.id" class="mb-2 text-start">
          <div class="receipt-item-name font-weight-bold">{{ item.product.name }}</div>
          <div class="d-flex justify-content-between font-monospace">
            <span>{{ item.quantity }} x {{ formatRupiah(item.product.price) }}</span>
            <span>{{ formatRupiah(item.product.price * item.quantity) }}</span>
          </div>
        </div>
      </div>

      <div class="receipt-divider"></div>

      <!-- Calculations -->
      <div class="receipt-calc small font-monospace">
        <div class="d-flex justify-content-between">
          <span>Subtotal:</span>
          <span>{{ formatRupiah(finishedTransaction?.subtotal) }}</span>
        </div>
        <div v-if="finishedTransaction?.discount > 0" class="d-flex justify-content-between">
          <span>Diskon:</span>
          <span>-{{ formatRupiah(finishedTransaction?.discount) }}</span>
        </div>
        <div class="d-flex justify-content-between font-weight-bold my-1">
          <span>TOTAL:</span>
          <span>{{ formatRupiah(finishedTransaction?.total) }}</span>
        </div>
        <div class="d-flex justify-content-between">
          <span>Bayar:</span>
          <span>{{ finishedTransaction?.metode_pembayaran === 'QRIS' ? 'QRIS' :
            formatRupiah(finishedTransaction?.cashReceived) }}</span>
        </div>
        <div v-if="finishedTransaction?.metode_pembayaran !== 'QRIS'" class="d-flex justify-content-between">
          <span>Kembali:</span>
          <span>{{ formatRupiah(finishedTransaction?.cashChange) }}</span>
        </div>
      </div>

      <div class="receipt-divider"></div>

      <!-- Footer -->
      <div class="text-center mt-3 small receipt-footer">
        {{ getShopReceiptFooter() }}
      </div>
    </div>
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

/* Receipt styling for modal preview */
.receipt-paper {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  padding: 16px;
  font-family: 'Courier New', Courier, monospace;
  color: #1e293b;
  border-radius: 4px;
}

.paper-preview-58 {
  width: 280px;
}

.paper-preview-80 {
  width: 360px;
}

.receipt-store-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.receipt-store-detail {
  font-size: 0.72rem;
  color: #64748b;
  line-height: 1.3;
}

.receipt-divider {
  border-top: 1px dashed #cbd5e1;
  margin: 12px 0;
  height: 0;
}

.receipt-meta {
  font-size: 0.75rem;
  color: #475569;
  line-height: 1.4;
}

.receipt-items {
  font-size: 0.75rem;
  color: #1e293b;
}

.receipt-item-name {
  white-space: normal;
  word-break: break-word;
}

.receipt-calc {
  font-size: 0.78rem;
  color: #1e293b;
}

.receipt-footer {
  font-size: 0.72rem;
  color: #475569;
  font-style: italic;
  line-height: 1.4;
}

#thermal-receipt-area {
  display: none;
}

/* Success modal custom styles */
.bg-light-success {
  background-color: #f0fdf4;
}

.success-icon-wrapper i {
  animation: pulse-check 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes pulse-check {
  0% {
    transform: scale(0);
    opacity: 0;
  }

  70% {
    transform: scale(1.15);
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Payment method tab toggle */
.payment-method-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.payment-tab-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.payment-tab-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
  background-color: #eef2ff;
}

.payment-tab-btn.active {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #ffffff;
  border-color: #6366f1;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
}

/* QRIS card styles */
.qris-section {
  padding: 4px 0 0;
}

.qris-card {
  background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
  border-radius: 16px;
  padding: 20px 16px 16px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.3);
}

.qris-card::before {
  content: '';
  position: absolute;
  top: -40px;
  right: -40px;
  width: 120px;
  height: 120px;
  background: rgba(99, 102, 241, 0.15);
  border-radius: 50%;
}

.qris-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.qris-badge {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 1px;
}

.qris-subtitle {
  color: #94a3b8;
  font-size: 0.78rem;
}

.qris-qr-wrapper {
  background: #ffffff;
  border-radius: 12px;
  padding: 12px;
  display: inline-block;
  margin: 0 auto 12px;
  position: relative;
}

.qris-qr-img {
  width: 168px;
  height: 168px;
  display: block;
}

.qris-amount-badge {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;
  margin: -6px auto 0;
  display: inline-block;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
}

.qris-info {
  margin-top: 10px;
}

.qris-store-info {
  color: #cbd5e1;
}

/* Retry / action button inside QRIS card */
.qris-retry-btn {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 8px 20px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.qris-retry-btn:hover {
  opacity: 0.85;
}

/* Settlement check overlay on QR */
.qris-settled {
  position: relative;
}

.qris-settled-overlay {
  position: absolute;
  inset: 0;
  background: rgba(16, 185, 129, 0.7);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: #ffffff;
}

/* Status badge for settlement */
.qris-status-badge.settlement {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

/* Sandbox test helper panel */
.qris-sandbox-box {
  margin-top: 10px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px dashed rgba(245, 158, 11, 0.5);
  border-radius: 10px;
  padding: 10px 14px;
  text-align: left;
  font-size: 0.78rem;
  color: #94a3b8;
}

.qris-sandbox-label {
  font-size: 0.75rem;
  color: #f59e0b;
  font-weight: 600;
  margin-bottom: 8px;
}

.qris-sandbox-orderid {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: nowrap;
}

.qris-sandbox-orderlabel {
  font-size: 0.72rem;
  color: #64748b;
  white-space: nowrap;
  flex-shrink: 0;
}

.qris-sandbox-code {
  background: rgba(15, 23, 42, 0.6);
  color: #e2e8f0;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.3px;
  flex: 1;
  min-width: 0;
  word-break: break-all;
}

.qris-copy-btn {
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 4px;
  padding: 2px 7px;
  cursor: pointer;
  color: #94a3b8;
  font-size: 0.75rem;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.qris-copy-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
}

.qris-simulator-link {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  color: #6366f1;
  text-decoration: none;
  font-weight: 600;
  padding: 4px 0;
  transition: color 0.15s ease;
}

.qris-simulator-link:hover {
  color: #818cf8;
  text-decoration: underline;
}
</style>

<style>
/* Hide printable area on screen */
#thermal-receipt-area {
  display: none;
}

/* Printable CSS configuration */
@media print {
  body {
    background-color: #ffffff !important;
    color: #000000 !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  /* Hide app shell */
  .sidebar,
  .sidebar-wrapper,
  aside,
  .top-header-main,
  header,
  .custom-alert {
    display: none !important;
    visibility: hidden !important;
  }

  /* Hide modal and backdrop */
  .modal-backdrop-custom {
    display: none !important;
    visibility: hidden !important;
  }

  /* Hide everything inside kasir-wrapper except the print area */
  .kasir-wrapper>*:not(#thermal-receipt-area) {
    display: none !important;
    visibility: hidden !important;
  }

  /* Reset main wrapper styles to prevent scroll/cutting off */
  .kasir-wrapper {
    height: auto !important;
    padding: 0 !important;
    overflow: visible !important;
    position: static !important;
    margin: 0 !important;
  }

  /* Show and format thermal receipt container */
  #thermal-receipt-area {
    display: block !important;
    visibility: visible !important;
    background-color: #ffffff !important;
    color: #000000 !important;
    font-family: 'Courier New', Courier, monospace;
    padding: 0 !important;
    margin: 0 auto !important;
    box-shadow: none !important;
    border: none !important;
  }

  #thermal-receipt-area .receipt-store-name {
    font-size: 14px !important;
    font-weight: bold !important;
    color: #000000 !important;
  }

  #thermal-receipt-area .receipt-store-detail,
  #thermal-receipt-area .receipt-meta,
  #thermal-receipt-area .receipt-items,
  #thermal-receipt-area .receipt-calc,
  #thermal-receipt-area .receipt-footer {
    font-size: 11px !important;
    color: #000000 !important;
  }

  #thermal-receipt-area .receipt-divider {
    border-top: 1px dashed #000000 !important;
    margin: 8px 0 !important;
  }

  /* Paper sizes */
  .paper-58mm {
    width: 58mm !important;
    max-width: 58mm !important;
  }

  .paper-80mm {
    width: 80mm !important;
    max-width: 80mm !important;
  }

  /* Browser print default override */
  @page {
    margin: 0 !important;
    size: auto;
  }
}
</style>
