import { ref, reactive, watch } from 'vue'

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'Bearing 6204 NSK',
    rack: 'Rak A-1',
    stock: 3,
    limit: 10,
    price: 35000,
    status: 'Kritis',
    image: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 2,
    name: 'Kunci Pas Set 8-24 mm',
    rack: 'Rak B-2',
    stock: 5,
    limit: 10,
    price: 125000,
    status: 'Menipis',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 3,
    name: 'Mata Gerinda Potong 4 Inch',
    rack: 'Rak C-1',
    stock: 4,
    limit: 8,
    price: 18000,
    status: 'Kritis',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22731d8d8c?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 4,
    name: 'Selang Air PVC 1/2 Inch',
    rack: 'Rak D-3',
    stock: 8,
    limit: 15,
    price: 45000,
    status: 'Menipis',
    image: 'https://images.unsplash.com/photo-1581092919535-7146ff1a590f?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 5,
    name: 'Obeng Plus Minus Set',
    rack: 'Rak A-4',
    stock: 2,
    limit: 10,
    price: 75000,
    status: 'Kritis',
    image: 'https://images.unsplash.com/photo-1581147036324-c1c8b98c4f4b?w=400&auto=format&fit=crop&q=60'
  }
]

// Default mock discounts
const DEFAULT_DISCOUNTS = [
  {
    id: 1,
    item: 'Kunci Pas Set 8-24 mm',
    original: 125000,
    requested: 110000,
    discountAmount: 15000,
    time: '10 menit yang lalu',
    status: 'Aktif'
  },
  {
    id: 2,
    item: 'Bearing 6204 NSK',
    original: 35000,
    requested: 30000,
    discountAmount: 5000,
    time: '1 jam yang lalu',
    status: 'Aktif'
  }
]

// Default mock transactions today
const DEFAULT_TRANSACTIONS = [
  {
    id: 101,
    time: '12:30',
    date: '2026-06-16 12:30:00',
    itemsCount: 3,
    total: 210000,
    discount: 15000,
    cashierName: 'Ananda Galang',
    details: [
      { id: 1, qty: 3, harga: 75000, subtotal: 225000, barang: { id: 1, name: 'Obeng Plus Minus Set', harga_beli: 50000, harga_jual: 75000 } }
    ],
    customer: { name: 'Budi Santoso', phone: '081234567890' }
  },
  {
    id: 102,
    time: '13:15',
    date: '2026-06-16 13:15:00',
    itemsCount: 2,
    total: 145000,
    discount: 5000,
    cashierName: 'Ananda Galang',
    details: [
      { id: 2, qty: 2, harga: 75000, subtotal: 150000, barang: { id: 5, name: 'Obeng Plus Minus Set', harga_beli: 50000, harga_jual: 75000 } }
    ],
    customer: { name: 'Umum', phone: '' }
  }
]

// Default mock customers
const DEFAULT_CUSTOMERS = [
  { id: 1, name: 'Budi Santoso', phone: '081234567890', type: 'VIP' },
  { id: 2, name: 'Siti Rahma', phone: '085678901234', type: 'Reguler' },
  { id: 3, name: 'Dewi Lestari', phone: '089012345678', type: 'VIP' },
  { id: 4, name: 'Ahmad Fauzi', phone: '082134567890', type: 'Reguler' }
]
// WhatsApp templates
export const waTemplates = [
  {
    id: 'toko-buka',
    title: 'Toko Buka',
    text: 'Halo Pelanggan Setia! Toko Parabot & Sparepart Ce Alin sudah buka hari ini dari jam 08:00 - 21:00 WIB. Stok parabot rumah tangga, perkakas, dan berbagai sparepart lengkap dan siap melayani. Yuk mampir berbelanja!'
  },
  {
    id: 'promo-diskon',
    title: 'Promo Diskon Harian',
    text: 'Kabar Gembira! Dapatkan diskon spesial hari ini hingga 15% untuk pilihan parabot rumah tangga dan sparepart tertentu. Belanja lebih hemat hanya di Toko Parabot & Sparepart Ce Alin!'
  },
  {
    id: 'restok-barang',
    title: 'Stok Baru Datang',
    text: 'Info Toko Parabot & Sparepart Ce Alin: Berbagai sparepart, alat pertukangan, dan perlengkapan rumah tangga terbaru baru saja datang dan tersedia lengkap. Segera dapatkan sebelum kehabisan!'
  }
]

// Initialize state from localStorage or defaults
const loadState = (key, defaultVal) => {
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : defaultVal
}

const computeStatus = (stock, limit) => {
  if (stock <= 0) return 'Habis'
  if (stock < limit / 2) return 'Kritis'
  if (stock < limit) return 'Menipis'
  return 'Cukup'
}

const mapProductFromBackend = (item) => {
  const stock = Number(item.stok)
  const limit = Number(item.stok_minimal)
  return {
    id: item.id,
    kode_barang: item.kode_barang,
    name: item.nama_barang,
    rack: item.rak ? item.rak.nama_rak : '',
    rak_id: item.rak_id,
    stock: stock,
    limit: limit,
    price: Number(item.harga_jual),
    harga_beli: Number(item.harga_beli),
    image: item.image,
    status: computeStatus(stock, limit)
  }
}

export const state = reactive({
  products: loadState('toko_alin_products', []),
  racks: [],
  discounts: loadState('toko_alin_discounts', DEFAULT_DISCOUNTS),
  transactions: loadState('toko_alin_transactions', DEFAULT_TRANSACTIONS),
  customers: loadState('toko_alin_customers', DEFAULT_CUSTOMERS),
  waPaired: loadState('toko_alin_wa_paired', false),
  waPairedNumber: loadState('toko_alin_wa_paired_number', ''),
  broadcastHistory: loadState('toko_alin_broadcast_history', [
    { time: 'Kemarin, 08:15', template: 'Toko Buka', target: 'Semua Pelanggan (152 kontak)' }
  ]),
  currentUser: loadState('toko_alin_user', null),
  printerPaired: loadState('toko_alin_printer_paired', false),
  printerPairedName: loadState('toko_alin_printer_paired_name', ''),
  salesTarget: loadState('toko_alin_sales_target', 3000000),
  searchQuery: ''
})

export const fetchProducts = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/barangs', {
      credentials: 'include'
    })
    const resData = await response.json()
    if (resData.success) {
      state.products = resData.data.map(mapProductFromBackend)
    }
  } catch (error) {
    console.error('Error fetching products:', error)
  }
}

export const fetchRacks = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/raks', {
      credentials: 'include'
    })
    const resData = await response.json()
    if (resData.success) {
      state.racks = resData.data
    }
  } catch (error) {
    console.error('Error fetching racks:', error)
  }
}

export const fetchTransactions = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/transaksi', {
      credentials: 'include'
    })
    const resData = await response.json()
    if (resData.success) {
      state.transactions = resData.data.map(item => {
        const dateObj = new Date(item.tanggal)
        const timeStr = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`
        const itemsCount = item.details ? item.details.reduce((sum, d) => sum + d.qty, 0) : 0
        
        const details = item.details ? item.details.map(d => ({
          id: d.id,
          qty: d.qty,
          harga: Number(d.harga),
          subtotal: Number(d.subtotal),
          barang: d.barang ? {
            id: d.barang.id,
            name: d.barang.nama_barang,
            harga_beli: Number(d.barang.harga_beli),
            harga_jual: Number(d.barang.harga_jual)
          } : null
        })) : []

        return {
          id: item.id,
          kode_transaksi: item.kode_transaksi,
          time: timeStr,
          date: item.tanggal,
          itemsCount: itemsCount,
          total: Number(item.grand_total),
          discount: Number(item.total_diskon),
          cashierName: item.user ? item.user.name : 'System',
          details: details,
          customer: {
            name: item.nama_pelanggan || 'Umum',
            phone: item.no_telp_pelanggan || ''
          }
        }
      })
    }
  } catch (error) {
    console.error('Error fetching transactions:', error)
  }
}

// Watchers to persist state changes to localStorage
watch(() => state.products, (newVal) => {
  localStorage.setItem('toko_alin_products', JSON.stringify(newVal))
}, { deep: true })

watch(() => state.customers, (newVal) => {
  localStorage.setItem('toko_alin_customers', JSON.stringify(newVal))
}, { deep: true })

watch(() => state.discounts, (newVal) => {
  localStorage.setItem('toko_alin_discounts', JSON.stringify(newVal))
}, { deep: true })

watch(() => state.transactions, (newVal) => {
  localStorage.setItem('toko_alin_transactions', JSON.stringify(newVal))
}, { deep: true })

watch(() => state.waPaired, (newVal) => {
  localStorage.setItem('toko_alin_wa_paired', JSON.stringify(newVal))
})

watch(() => state.waPairedNumber, (newVal) => {
  localStorage.setItem('toko_alin_wa_paired_number', JSON.stringify(newVal))
})

watch(() => state.broadcastHistory, (newVal) => {
  localStorage.setItem('toko_alin_broadcast_history', JSON.stringify(newVal))
}, { deep: true })

watch(() => state.currentUser, (newVal) => {
  localStorage.setItem('toko_alin_user', JSON.stringify(newVal))
}, { deep: true })

watch(() => state.printerPaired, (newVal) => {
  localStorage.setItem('toko_alin_printer_paired', JSON.stringify(newVal))
})

watch(() => state.printerPairedName, (newVal) => {
  localStorage.setItem('toko_alin_printer_paired_name', JSON.stringify(newVal))
})

watch(() => state.salesTarget, (newVal) => {
  localStorage.setItem('toko_alin_sales_target', JSON.stringify(newVal))
})

// State Mutation helpers (calling Backend REST APIs)
export const restockProduct = async (productId, amount) => {
  try {
    const response = await fetch(`http://localhost:8000/api/barangs/${productId}/restock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ amount: Number(amount) })
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      const idx = state.products.findIndex(p => p.id === productId)
      if (idx !== -1) {
        state.products[idx] = mapProductFromBackend(resData.data)
      }
      return true
    } else {
      alert(resData.message || 'Gagal merestok produk.')
      return false
    }
  } catch (error) {
    console.error('Error restocking product:', error)
    alert('Terjadi kesalahan jaringan saat merestok produk!')
    return false
  }
}

export const addProduct = async (name, rack, stock, limit, price, image = '') => {
  try {
    const response = await fetch('http://localhost:8000/api/barangs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ name, rack, stock: Number(stock), limit: Number(limit), price: Number(price), image })
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      const mapped = mapProductFromBackend(resData.data)
      state.products.push(mapped)
      fetchRacks()
      return true
    } else {
      alert(resData.message || 'Gagal menambahkan produk.')
      return false
    }
  } catch (error) {
    console.error('Error adding product:', error)
    alert('Terjadi kesalahan jaringan saat menambahkan produk!')
    return false
  }
}

export const editProduct = async (id, updatedData) => {
  try {
    const response = await fetch(`http://localhost:8000/api/barangs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        name: updatedData.name,
        rack: updatedData.rack,
        stock: Number(updatedData.stock),
        limit: Number(updatedData.limit),
        price: Number(updatedData.price),
        image: updatedData.image
      })
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      const idx = state.products.findIndex(p => p.id === id)
      if (idx !== -1) {
        state.products[idx] = mapProductFromBackend(resData.data)
      }
      fetchRacks()
      return true
    } else {
      alert(resData.message || 'Gagal mengubah produk.')
      return false
    }
  } catch (error) {
    console.error('Error editing product:', error)
    alert('Terjadi kesalahan jaringan saat mengubah produk!')
    return false
  }
}

export const deleteProduct = async (id) => {
  try {
    const response = await fetch(`http://localhost:8000/api/barangs/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      const idx = state.products.findIndex(p => p.id === id)
      if (idx !== -1) {
        state.products.splice(idx, 1)
      }
      fetchRacks()
      return true
    } else {
      alert(resData.message || 'Gagal menghapus produk.')
      return false
    }
  } catch (error) {
    console.error('Error deleting product:', error)
    alert('Terjadi kesalahan jaringan saat menghapus produk!')
    return false
  }
}

export const addDiscount = (item, original, requested) => {
  const discAmount = original - requested
  state.discounts.unshift({
    id: Date.now(),
    item,
    original: Number(original),
    requested: Number(requested),
    discountAmount: Number(discAmount),
    time: 'Baru saja',
    status: 'Aktif'
  })
}

export const addTransaction = async (items, total, discountVal, customer = null) => {
  try {
    const payload = {
      cart: items.map(item => ({
        product: { id: item.product.id },
        quantity: item.quantity
      })),
      total_harga: Number(total) + Number(discountVal),
      total_diskon: Number(discountVal),
      grand_total: Number(total),
      customer: customer ? {
        name: customer.name || '',
        phone: customer.phone || ''
      } : null
    }

    const response = await fetch('http://localhost:8000/api/transaksi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(payload)
    })

    const resData = await response.json()
    if (response.ok && resData.success) {
      fetchProducts()
      fetchTransactions()

      if (discountVal > 0) {
        const itemNames = items.map(i => `${i.product.name} (x${i.quantity})`).join(', ')
        state.discounts.unshift({
          id: Date.now(),
          item: itemNames.length > 30 ? itemNames.slice(0, 27) + '...' : itemNames,
          original: Number(total) + Number(discountVal),
          requested: Number(total),
          discountAmount: Number(discountVal),
          time: 'Baru saja',
          status: 'Aktif'
        })
      }
      return true
    } else {
      alert(resData.message || 'Gagal menyimpan transaksi.')
      return false
    }
  } catch (error) {
    console.error('Error adding transaction:', error)
    alert('Terjadi kesalahan jaringan saat menyimpan transaksi!')
    return false
  }
}

export const checkWhatsappStatus = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/whatsapp/status', {
      credentials: 'include'
    })
    const resData = await response.json()
    state.waPaired = resData.status === 'CONNECTED'
    state.waPairedNumber = resData.status === 'CONNECTED' ? resData.number : ''
    return resData.status
  } catch (error) {
    console.error('Error checking WhatsApp status:', error)
  }
  return 'DISCONNECTED'
}

export const pairWA = (paired, phoneNumber = '') => {
  state.waPaired = paired
  state.waPairedNumber = paired ? phoneNumber : ''
}

export const disconnectWA = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/whatsapp/disconnect', {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    })
    const resData = await response.json()
    if (resData.success) {
      state.waPaired = false
      state.waPairedNumber = ''
      return true
    }
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error)
  }
  return false
}

export const sendWABroadcast = async (message, numbers) => {
  try {
    const response = await fetch('http://localhost:8000/api/whatsapp/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ message, numbers })
    })
    const resData = await response.json()
    return resData.success
  } catch (error) {
    console.error('Error sending WhatsApp broadcast:', error)
    return false
  }
}

export const pairPrinter = (paired, name = '') => {
  state.printerPaired = paired
  state.printerPairedName = paired ? name : ''
}

export const addBroadcastHistory = (templateTitle, targetLabel) => {
  const now = new Date()
  const timeStr = `Hari ini, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  state.broadcastHistory.unshift({
    time: timeStr,
    template: templateTitle,
    target: targetLabel
  })
}

export const addCustomer = (name, phone, type = 'Reguler') => {
  const newId = state.customers.length ? Math.max(...state.customers.map(c => c.id)) + 1 : 1
  state.customers.push({
    id: newId,
    name,
    phone,
    type
  })
}

export const deleteCustomer = (id) => {
  const idx = state.customers.findIndex(c => c.id === id)
  if (idx !== -1) {
    state.customers.splice(idx, 1)
    return true
  }
  return false
}

export const loginUser = async (username, password) => {
  try {
    const response = await fetch('http://localhost:8000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      state.currentUser = data.user
      localStorage.setItem('toko_alin_user', JSON.stringify(data.user))
      // Load backend products, racks, and transactions upon successful login
      fetchProducts()
      fetchRacks()
      fetchTransactions()
      return { success: true, user: data.user }
    } else {
      return { success: false, message: data.message || 'Username atau password salah!' }
    }
  } catch (error) {
    console.error('Error logging in:', error)
    return { success: false, message: 'Gagal menghubungkan ke server backend Laravel!' }
  }
}

export const logoutUser = async () => {
  try {
    await fetch('http://localhost:8000/api/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include'
    })
  } catch (error) {
    console.error('Error logging out from backend:', error)
  }

  // Clear local session state
  state.currentUser = null
  localStorage.removeItem('toko_alin_user')
  state.products = []
  state.racks = []
  state.transactions = []
}
