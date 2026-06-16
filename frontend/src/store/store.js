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
    itemsCount: 3,
    total: 210000,
    discount: 15000
  },
  {
    id: 102,
    time: '13:15',
    itemsCount: 2,
    total: 145000,
    discount: 5000
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

export const state = reactive({
  products: loadState('toko_alin_products', DEFAULT_PRODUCTS),
  discounts: loadState('toko_alin_discounts', DEFAULT_DISCOUNTS),
  transactions: loadState('toko_alin_transactions', DEFAULT_TRANSACTIONS),
  customers: loadState('toko_alin_customers', DEFAULT_CUSTOMERS),
  waPaired: loadState('toko_alin_wa_paired', false),
  waPairedNumber: loadState('toko_alin_wa_paired_number', ''),
  broadcastHistory: loadState('toko_alin_broadcast_history', [
    { time: 'Kemarin, 08:15', template: 'Toko Buka', target: 'Semua Pelanggan (152 kontak)' }
  ]),
  currentUser: loadState('toko_alin_user', { name: 'Ananda Galang', role: 'Owner' }), // Role Owner default so they can access everything!
  printerPaired: loadState('toko_alin_printer_paired', false),
  printerPairedName: loadState('toko_alin_printer_paired_name', ''),
  searchQuery: ''
})

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

// Helper to determine status based on stock and limit
const computeStatus = (stock, limit) => {
  if (stock <= 0) return 'Habis'
  if (stock < limit / 2) return 'Kritis'
  if (stock < limit) return 'Menipis'
  return 'Cukup'
}

// State Mutation helpers
export const restockProduct = (productId, amount) => {
  const prod = state.products.find(p => p.id === productId)
  if (prod) {
    prod.stock += amount
    prod.status = computeStatus(prod.stock, prod.limit)
    return true
  }
  return false
}

export const addProduct = (name, rack, stock, limit, price, image = '') => {
  const newId = state.products.length ? Math.max(...state.products.map(p => p.id)) + 1 : 1
  const status = computeStatus(stock, limit)
  state.products.push({
    id: newId,
    name,
    rack,
    stock: Number(stock),
    limit: Number(limit),
    price: Number(price),
    status,
    image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=60'
  })
}

export const editProduct = (id, updatedData) => {
  const idx = state.products.findIndex(p => p.id === id)
  if (idx !== -1) {
    const stock = Number(updatedData.stock)
    const limit = Number(updatedData.limit)
    state.products[idx] = {
      ...state.products[idx],
      ...updatedData,
      stock,
      limit,
      price: Number(updatedData.price),
      status: computeStatus(stock, limit),
      image: updatedData.image || state.products[idx].image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=60'
    }
    return true
  }
  return false
}

export const deleteProduct = (id) => {
  const idx = state.products.findIndex(p => p.id === id)
  if (idx !== -1) {
    state.products.splice(idx, 1)
    return true
  }
  return false
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

export const addTransaction = (items, total, discountVal, customer = null) => {
  // Add to transaction history
  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  
  state.transactions.unshift({
    id: Date.now(),
    time: timeStr,
    itemsCount: items.reduce((acc, curr) => acc + curr.quantity, 0),
    total: Number(total),
    discount: Number(discountVal),
    customer: customer ? {
      name: customer.name || 'Umum',
      phone: customer.phone || ''
    } : { name: 'Umum', phone: '' }
  })

  // Deduct actual stock for products sold
  items.forEach(item => {
    const prod = state.products.find(p => p.id === item.product.id)
    if (prod) {
      prod.stock = Math.max(0, prod.stock - item.quantity)
      prod.status = computeStatus(prod.stock, prod.limit)
    }
  })

  // If there was a discount applied, let's record it in discounts history too for visual feed
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
}

export const pairWA = (paired, phoneNumber = '') => {
  state.waPaired = paired
  state.waPairedNumber = paired ? phoneNumber : ''
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
