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

const parseUtcToLocal = (dateStr) => {
  if (!dateStr) return new Date()
  if (dateStr.includes('Z') || dateStr.includes('+')) {
    return new Date(dateStr)
  }
  const normalized = dateStr.replace(' ', 'T') + 'Z'
  return new Date(normalized)
}

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
  products: [],
  racks: [],
  selectedRackId: null,
  discounts: [],
  transactions: [],
  customers: [],
  waPaired: loadState('toko_alin_wa_paired', false),
  waPairedNumber: loadState('toko_alin_wa_paired_number', ''),
  broadcastHistory: [],
  currentUser: loadState('toko_alin_user', null),
  users: [],
  printerPaired: loadState('toko_alin_printer_paired', false),
  printerPairedName: loadState('toko_alin_printer_paired_name', ''),
  salesTarget: loadState('toko_alin_sales_target', 3000000),
  searchQuery: '',
  broadcastDraft: '',
  notifications: loadState('toko_alin_notifications', []),
  schedules: [],
  presenses: { today: null, history: [], logs: [] }
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
      const savedOrder = localStorage.getItem('toko_alin_rack_order')
      if (savedOrder) {
        const orderIds = JSON.parse(savedOrder)
        resData.data.sort((a, b) => {
          const idxA = orderIds.indexOf(a.id)
          const idxB = orderIds.indexOf(b.id)
          if (idxA === -1 && idxB === -1) return 0
          if (idxA === -1) return 1
          if (idxB === -1) return -1
          return idxA - idxB
        })
      }
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
      const parsedTransactions = resData.data.map(item => {
        const dateObj = parseUtcToLocal(item.tanggal)
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
          date: dateObj.toISOString(),
          itemsCount: itemsCount,
          total: Number(item.grand_total),
          discount: Number(item.total_diskon),
          cashierName: item.user ? item.user.name : 'System',
          details: details,
          metode_pembayaran: item.metode_pembayaran || 'Tunai',
          customer: {
            name: item.nama_pelanggan || 'Umum',
            phone: item.no_telp_pelanggan || ''
          }
        }
      })

      state.transactions = parsedTransactions

      // Dynamically populate state.discounts from transactions where discount > 0
      const transactionsWithDiscounts = parsedTransactions.filter(tx => tx.discount > 0)
      state.discounts = transactionsWithDiscounts.map(tx => {
        const itemNames = tx.details.map(d => d.barang ? `${d.barang.name} (x${d.qty})` : 'Barang').join(', ')
        const truncatedItemNames = itemNames.length > 30 ? itemNames.substring(0, 27) + '...' : itemNames
        
        return {
          id: tx.id,
          item: truncatedItemNames || 'Transaksi Kasir',
          original: tx.total + tx.discount,
          requested: tx.total,
          discountAmount: tx.discount,
          time: tx.time,
          status: 'Aktif'
        }
      })
    }
  } catch (error) {
    console.error('Error fetching transactions:', error)
  }
}

export const addRack = async (nama_rak, keterangan = '', color = null) => {
  try {
    const response = await fetch('http://localhost:8000/api/raks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ nama_rak, keterangan, color })
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      state.racks.push(resData.data)
      state.racks.sort((a, b) => a.nama_rak.localeCompare(b.nama_rak))
      addNotification('Rak Ditambahkan', `Rak "${nama_rak}" berhasil dibuat.`, 'success')
      return { success: true }
    } else {
      return { success: false, message: resData.message || 'Gagal menambahkan rak.' }
    }
  } catch (error) {
    console.error('Error adding rack:', error)
    return { success: false, message: 'Terjadi kesalahan jaringan saat menambahkan rak!' }
  }
}

export const editRack = async (id, nama_rak, keterangan = '', color = null) => {
  try {
    const response = await fetch(`http://localhost:8000/api/raks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ nama_rak, keterangan, color })
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      const idx = state.racks.findIndex(r => r.id === id)
      if (idx !== -1) {
        state.racks[idx] = resData.data
      }
      state.racks.sort((a, b) => a.nama_rak.localeCompare(b.nama_rak))
      
      // Update local products cache to reflect new rack name
      state.products.forEach(p => {
        if (p.rak_id === id) {
          p.rack = resData.data.nama_rak
        }
      })
      addNotification('Rak Diperbarui', `Informasi Rak "${nama_rak}" berhasil diperbarui.`, 'info')
      return { success: true }
    } else {
      return { success: false, message: resData.message || 'Gagal mengubah nama rak.' }
    }
  } catch (error) {
    console.error('Error editing rack:', error)
    return { success: false, message: 'Terjadi kesalahan jaringan saat mengubah nama rak!' }
  }
}

export const deleteRack = async (id) => {
  try {
    const response = await fetch(`http://localhost:8000/api/raks/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      const idx = state.racks.findIndex(r => r.id === id)
      if (idx !== -1) {
        state.racks.splice(idx, 1)
      }
      if (state.selectedRackId === id) {
        state.selectedRackId = null
      }
      addNotification('Rak Dihapus', `Rak berhasil dihapus dari sistem.`, 'warning')
      return { success: true }
    } else {
      return { success: false, message: resData.message || 'Gagal menghapus rak.' }
    }
  } catch (error) {
    console.error('Error deleting rack:', error)
    return { success: false, message: 'Terjadi kesalahan jaringan saat menghapus rak!' }
  }
}

// Watchers to persist state changes to localStorage
watch(() => state.waPaired, (newVal) => {
  localStorage.setItem('toko_alin_wa_paired', JSON.stringify(newVal))
})

watch(() => state.waPairedNumber, (newVal) => {
  localStorage.setItem('toko_alin_wa_paired_number', JSON.stringify(newVal))
})

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

watch(() => state.notifications, (newVal) => {
  localStorage.setItem('toko_alin_notifications', JSON.stringify(newVal))
}, { deep: true })

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
      const prodName = resData.data ? resData.data.nama_barang : 'Barang'
      addNotification('Restok Produk', `Stok "${prodName}" ditambah sebanyak ${amount} unit.`, 'success')
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

export const addProduct = async (name, rack, stock, limit, price, hargaBeli, image = '') => {
  try {
    const response = await fetch('http://localhost:8000/api/barangs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ name, rack, stock: Number(stock), limit: Number(limit), price: Number(price), harga_beli: Number(hargaBeli), image })
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      const mapped = mapProductFromBackend(resData.data)
      state.products.push(mapped)
      fetchRacks()
      addNotification('Produk Ditambahkan', `Produk "${name}" berhasil didaftarkan.`, 'success')
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
        harga_beli: Number(updatedData.harga_beli),
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
      addNotification('Produk Diperbarui', `Informasi produk "${updatedData.name}" berhasil diubah.`, 'info')
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
      addNotification('Produk Dihapus', `Produk berhasil dihapus dari sistem.`, 'warning')
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

export const addNotification = (title, message, type = 'info') => {
  const now = new Date()
  state.notifications.unshift({
    id: Date.now(),
    title,
    message,
    type, // 'info', 'success', 'warning', 'danger'
    rawTime: now.toISOString(),
    read: false
  })
  if (state.notifications.length > 25) {
    state.notifications.pop()
  }
}

export const markAllNotificationsAsRead = () => {
  state.notifications.forEach(n => n.read = true)
}

export const clearNotifications = () => {
  state.notifications = []
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

export const sendWABroadcast = async (message, numbers, template = '', target = '') => {
  try {
    const response = await fetch('http://localhost:8000/api/whatsapp/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ message, numbers, template, target })
    })
    const resData = await response.json()
    if (resData.success) {
      fetchBroadcastHistory()
    }
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

export const fetchCustomers = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/customers', {
      credentials: 'include'
    })
    const resData = await response.json()
    if (resData.success) {
      state.customers = resData.data.map(c => ({
        id: c.id,
        name: c.nama,
        phone: c.no_telp,
        type: c.tipe
      }))
    }
  } catch (error) {
    console.error('Error fetching customers:', error)
  }
}

export const fetchBroadcastHistory = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/whatsapp/history', {
      credentials: 'include'
    })
    const resData = await response.json()
    if (resData.success) {
      state.broadcastHistory = resData.data
    }
  } catch (error) {
    console.error('Error fetching broadcast history:', error)
  }
}

export const addCustomer = async (name, phone, type = 'Reguler') => {
  try {
    const response = await fetch('http://localhost:8000/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ nama: name, no_telp: phone, tipe: type })
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      await fetchCustomers()
      return true
    } else {
      alert(resData.message || 'Gagal menambahkan customer.')
      return false
    }
  } catch (error) {
    console.error('Error adding customer:', error)
    return false
  }
}

export const deleteCustomer = async (id) => {
  try {
    const response = await fetch(`http://localhost:8000/api/customers/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      const idx = state.customers.findIndex(c => c.id === id)
      if (idx !== -1) {
        state.customers.splice(idx, 1)
      }
      return true
    } else {
      alert(resData.message || 'Gagal menghapus customer.')
      return false
    }
  } catch (error) {
    console.error('Error deleting customer:', error)
    return false
  }
}

export const fetchUsers = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/users', {
      credentials: 'include'
    })
    const resData = await response.json()
    if (resData.success) {
      state.users = resData.data
    }
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

export const addUser = async (name, username, password, role) => {
  try {
    const response = await fetch('http://localhost:8000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ name, username, password, role })
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      state.users.push(resData.data)
      state.users.sort((a, b) => a.name.localeCompare(b.name))
      addNotification('Pengguna Ditambahkan', `Akun untuk "${name}" berhasil dibuat.`, 'success')
      return { success: true }
    } else {
      return { success: false, message: resData.message || 'Gagal menambahkan pengguna.' }
    }
  } catch (error) {
    console.error('Error adding user:', error)
    return { success: false, message: 'Terjadi kesalahan jaringan saat menambahkan pengguna!' }
  }
}

export const editUser = async (id, updatedData) => {
  try {
    const response = await fetch(`http://localhost:8000/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(updatedData)
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      const idx = state.users.findIndex(u => u.id === id)
      if (idx !== -1) {
        state.users[idx] = resData.data
      }
      state.users.sort((a, b) => a.name.localeCompare(b.name))

      // If edited user is currently logged-in owner, update current local session
      if (state.currentUser && state.currentUser.id === id) {
        state.currentUser.name = resData.data.name
        state.currentUser.username = resData.data.username
        state.currentUser.role = resData.data.role
        localStorage.setItem('toko_alin_user', JSON.stringify(state.currentUser))
      }

      addNotification('Pengguna Diperbarui', `Informasi akun "${resData.data.name}" berhasil diubah.`, 'info')
      return { success: true }
    } else {
      return { success: false, message: resData.message || 'Gagal memperbarui pengguna.' }
    }
  } catch (error) {
    console.error('Error editing user:', error)
    return { success: false, message: 'Terjadi kesalahan jaringan saat memperbarui pengguna!' }
  }
}

export const deleteUser = async (id) => {
  try {
    const response = await fetch(`http://localhost:8000/api/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      const idx = state.users.findIndex(u => u.id === id)
      if (idx !== -1) {
        state.users.splice(idx, 1)
      }
      addNotification('Pengguna Dihapus', `Akun pengguna berhasil dihapus dari sistem.`, 'warning')
      return { success: true }
    } else {
      return { success: false, message: resData.message || 'Gagal menghapus pengguna.' }
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { success: false, message: 'Terjadi kesalahan jaringan saat menghapus pengguna!' }
  }
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
      // Load backend products, racks, transactions, customers, and broadcast history upon successful login
      fetchProducts()
      fetchRacks()
      fetchTransactions()
      fetchCustomers()
      fetchBroadcastHistory()
      fetchSchedules()
      fetchPresensi()
      if (data.user.role === 'owner') {
        fetchUsers()
      }
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
  state.selectedRackId = null
  state.transactions = []
  state.customers = []
  state.broadcastHistory = []
  state.schedules = []
  state.presenses = { today: null, history: [], logs: [] }
}

export const updateProfile = async (name, role) => {
  try {
    const response = await fetch('http://localhost:8000/api/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ name, role })
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      state.currentUser = resData.user
      localStorage.setItem('toko_alin_user', JSON.stringify(resData.user))
      return { success: true }
    } else {
      return { success: false, message: resData.message || 'Gagal memperbarui profil.' }
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { success: false, message: 'Terjadi kesalahan jaringan saat memperbarui profil!' }
  }
}

export const updatePassword = async (currentPassword, newPassword) => {
  try {
    const response = await fetch('http://localhost:8000/api/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      return { success: true }
    } else {
      return { success: false, message: resData.message || 'Gagal memperbarui kata sandi.' }
    }
  } catch (error) {
    console.error('Error updating password:', error)
    return { success: false, message: 'Terjadi kesalahan jaringan saat memperbarui kata sandi!' }
  }
}

export const fetchSchedules = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/schedules', {
      credentials: 'include'
    })
    const resData = await response.json()
    if (resData.success) {
      state.schedules = resData.data.schedules
    }
  } catch (error) {
    console.error('Error fetching schedules:', error)
  }
}

export const saveSchedule = async (user_id, hari, shift = '', keterangan = '') => {
  try {
    const response = await fetch('http://localhost:8000/api/schedules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ user_id: Number(user_id), hari, shift, keterangan })
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      const idx = state.schedules.findIndex(s => s.user_id === user_id && s.hari === hari)
      if (idx !== -1) {
        state.schedules[idx] = resData.data
      } else {
        state.schedules.push(resData.data)
      }
      addNotification('Jadwal Disimpan', `Jadwal hari ${hari} untuk pekerja berhasil disimpan.`, 'success')
      return { success: true }
    } else {
      return { success: false, message: resData.message || 'Gagal menyimpan jadwal.' }
    }
  } catch (error) {
    console.error('Error saving schedule:', error)
    return { success: false, message: 'Terjadi kesalahan jaringan!' }
  }
}

export const deleteSchedule = async (id) => {
  try {
    const response = await fetch(`http://localhost:8000/api/schedules/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      const idx = state.schedules.findIndex(s => s.id === id)
      if (idx !== -1) {
        state.schedules.splice(idx, 1)
      }
      addNotification('Jadwal Dihapus', `Jadwal kerja berhasil dihapus.`, 'warning')
      return { success: true }
    } else {
      return { success: false, message: resData.message || 'Gagal menghapus jadwal.' }
    }
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return { success: false, message: 'Terjadi kesalahan jaringan!' }
  }
}

export const fetchPresensi = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/presensi', {
      credentials: 'include'
    })
    const resData = await response.json()
    if (resData.success) {
      if (resData.data.role === 'owner') {
        state.presenses.logs = resData.data.logs
      } else {
        state.presenses.today = resData.data.today
        state.presenses.history = resData.data.history
      }
    }
  } catch (error) {
    console.error('Error fetching presensi:', error)
  }
}

export const submitPresensi = async (foto) => {
  try {
    const response = await fetch('http://localhost:8000/api/presensi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ foto })
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      state.presenses.today = resData.data
      fetchPresensi()
      addNotification('Presensi Berhasil', `Absensi masuk berhasil dicatat. Status: ${resData.data.status}`, 'success')
      return { success: true, data: resData.data }
    } else {
      return { success: false, message: resData.message || 'Gagal mengirim presensi.' }
    }
  } catch (error) {
    console.error('Error submitting presensi:', error)
    return { success: false, message: 'Terjadi kesalahan jaringan saat mengirim presensi!' }
  }
}
