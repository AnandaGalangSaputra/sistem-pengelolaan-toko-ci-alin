<script setup>
import { ref, computed, watch } from 'vue'
import { state, addBroadcastHistory, pairWA, waTemplates, addCustomer, deleteCustomer, disconnectWA as disconnectWAStore, sendWABroadcast } from '../../store/store.js'
import PairWaModal from '../modals/PairWaModal.vue'

const props = defineProps({
  showPairButton: {
    type: Boolean,
    default: true
  },
  showHistory: {
    type: Boolean,
    default: true
  }
})

const successToastMsg = ref('')
const selectedTemplateId = ref('toko-buka')
const broadcastMessage = ref(waTemplates[0].text)
const broadcastTarget = ref('semua')
const isSendingBroadcast = ref(false)
const broadcastProgress = ref(0)
const showPairModal = ref(false)

const activeTab = ref('broadcast')
const newCustName = ref('')
const newCustPhone = ref('')
const newCustType = ref('Reguler')
const searchCustomerQuery = ref('')

const filteredCustomers = computed(() => {
  const q = searchCustomerQuery.value.toLowerCase().trim()
  if (!q) return state.customers
  return state.customers.filter(c => 
    c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.type.toLowerCase().includes(q)
  )
})

// Pagination for customers list
const currentCustomerPage = ref(1)
const customersPerPage = ref(5)

const totalCustomerPages = computed(() => Math.ceil(filteredCustomers.value.length / customersPerPage.value))

const paginatedCustomers = computed(() => {
  const start = (currentCustomerPage.value - 1) * customersPerPage.value
  const end = start + customersPerPage.value
  return sortedCustomers.value.slice(start, end)
})

// Sorting state for customer list
const sortBy = ref('name-asc')

const sortedCustomers = computed(() => {
  const customers = [...filteredCustomers.value]
  customers.sort((a, b) => {
    if (sortBy.value === 'name-asc') {
      return a.name.localeCompare(b.name)
    } else if (sortBy.value === 'name-desc') {
      return b.name.localeCompare(a.name)
    } else if (sortBy.value === 'type-asc') {
      return a.type.localeCompare(b.type)
    } else if (sortBy.value === 'type-desc') {
      return b.type.localeCompare(a.type)
    }
    return 0
  })
  return customers
})

const toggleSort = (field) => {
  if (field === 'name') {
    sortBy.value = sortBy.value === 'name-asc' ? 'name-desc' : 'name-asc'
  } else if (field === 'type') {
    sortBy.value = sortBy.value === 'type-asc' ? 'type-desc' : 'type-asc'
  }
}

// Reset page when sortBy changes
watch(sortBy, () => {
  currentCustomerPage.value = 1
})

// Visible page list helper (limit to max 5 page links shown)
const visibleCustomerPages = computed(() => {
  const range = []
  const maxVisible = 5
  let start = Math.max(1, currentCustomerPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalCustomerPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    range.push(i)
  }
  return range
})

// Reset page when search or customer database changes
watch(searchCustomerQuery, () => {
  currentCustomerPage.value = 1
})
watch(() => state.customers.length, () => {
  currentCustomerPage.value = 1
})

const handleAddCustomerSubmit = () => {
  if (!newCustName.value.trim() || !newCustPhone.value.trim()) {
    alert('Nama dan Nomor WhatsApp wajib diisi!')
    return
  }
  
  let cleanPhone = newCustPhone.value.trim()
  cleanPhone = cleanPhone.replace(/[^0-9+]/g, '')
  if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.slice(1)
  }
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1)
  }
  if (!cleanPhone.startsWith('62')) {
    cleanPhone = '62' + cleanPhone
  }
  
  addCustomer(newCustName.value.trim(), cleanPhone, newCustType.value)
  
  newCustName.value = ''
  newCustPhone.value = ''
  newCustType.value = 'Reguler'
  
  successToastMsg.value = 'Pelanggan baru berhasil ditambahkan!'
  setTimeout(() => {
    successToastMsg.value = ''
  }, 3000)
}

const handleDeleteCustomer = (id, name) => {
  if (confirm(`Apakah Anda yakin ingin menghapus pelanggan "${name}" dari list broadcast?`)) {
    deleteCustomer(id)
    successToastMsg.value = `Pelanggan "${name}" berhasil dihapus.`
    setTimeout(() => {
      successToastMsg.value = ''
    }, 3000)
  }
}

const newTodayCustomers = computed(() => {
  const todayStr = new Date().toDateString()
  const uniqueContacts = new Map()
  
  if (state.transactions) {
    state.transactions.forEach(t => {
      let isToday = false
      if (t.id && t.id > 1000000000000) {
        isToday = new Date(t.id).toDateString() === todayStr
      } else {
        isToday = true
      }
      
      if (isToday && t.customer && t.customer.phone && t.customer.phone.trim() !== '') {
        const cleanedPhone = t.customer.phone.trim()
        const cleanedName = (t.customer.name && t.customer.name.trim() !== '') ? t.customer.name.trim() : 'Pelanggan'
        if (cleanedName.toLowerCase() !== 'umum') {
          uniqueContacts.set(cleanedPhone, cleanedName)
        }
      }
    })
  }
  
  return Array.from(uniqueContacts.entries()).map(([phone, name]) => ({ phone, name }))
})

const handleTemplateChange = () => {
  const template = waTemplates.find(t => t.id === selectedTemplateId.value)
  if (template) {
    broadcastMessage.value = template.text
  } else {
    broadcastMessage.value = ''
  }
}

const triggerPairing = () => {
  showPairModal.value = true
}

const handlePairConfirm = (num) => {
  pairWA(true, num)
  successToastMsg.value = `Berhasil menautkan nomor WhatsApp ${num}!`
  setTimeout(() => {
    successToastMsg.value = ''
  }, 4000)
}

const disconnectWA = async () => {
  if (confirm('Apakah Anda yakin ingin memutus koneksi WhatsApp?')) {
    const success = await disconnectWAStore()
    if (success) {
      successToastMsg.value = 'Nomor WhatsApp berhasil diputus!'
      setTimeout(() => {
        successToastMsg.value = ''
      }, 4000)
    } else {
      alert('Gagal memutus koneksi WhatsApp. Cek service gateway Anda.')
    }
  }
}

const sendBroadcast = async () => {
  if (!state.waPaired) {
    alert('Silakan hubungkan WhatsApp terlebih dahulu menggunakan tombol Pair WA!')
    return
  }

  if (isSendingBroadcast.value) return

  let targetNumbers = []
  let vipCount = state.customers.filter(c => c.type === 'VIP').length
  let targetLabel = ''

  if (broadcastTarget.value === 'semua') {
    targetNumbers = state.customers.map(c => c.phone)
    targetLabel = `Semua Pelanggan (${state.customers.length} kontak)`
  } else if (broadcastTarget.value === 'vip') {
    targetNumbers = state.customers.filter(c => c.type === 'VIP').map(c => c.phone)
    targetLabel = `Pelanggan VIP (${vipCount} kontak)`
  } else if (broadcastTarget.value === 'pelanggan-baru') {
    targetNumbers = newTodayCustomers.value.map(c => c.phone)
    targetLabel = `Pelanggan Baru Hari Ini (${newTodayCustomers.value.length} kontak)`
  } else if (broadcastTarget.value === 'test') {
    const selfNum = state.waPairedNumber ? state.waPairedNumber.replace(/[^0-9]/g, '') : '6281234567890'
    targetNumbers = [selfNum]
    targetLabel = `Uji Coba (${selfNum})`
  }

  if (targetNumbers.length === 0) {
    alert('Tidak ada kontak penerima untuk target ini!')
    return
  }

  isSendingBroadcast.value = true
  broadcastProgress.value = 0

  // Call the backend API to trigger broadcast sending
  const success = await sendWABroadcast(broadcastMessage.value, targetNumbers)

  if (success) {
    // Simulate progress bar based on 2 seconds delay per number
    const totalDuration = targetNumbers.length * 2000
    const stepTime = Math.max(totalDuration / 20, 100) // 20 steps, minimum 100ms
    let steps = 0

    const interval = setInterval(() => {
      steps++
      broadcastProgress.value = Math.min(steps * 5, 100)
      if (broadcastProgress.value >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          isSendingBroadcast.value = false

          const templateLabel = waTemplates.find(t => t.id === selectedTemplateId.value)?.title || 'Custom Message'
          addBroadcastHistory(templateLabel, targetLabel)

          successToastMsg.value = `Sukses menyebarkan WhatsApp Broadcast ke ${targetLabel}!`
          setTimeout(() => {
            successToastMsg.value = ''
          }, 4000)
        }, 500)
      }
    }, stepTime)
  } else {
    isSendingBroadcast.value = false
  }
}
</script>

<template>
  <div class="card-content-box">
    <!-- Success Toast Alert inside panel -->
    <transition name="fade">
      <div v-if="successToastMsg" class="custom-alert alert alert-success d-flex align-items-center shadow" role="alert">
        <i class="bi bi-check-circle-fill me-2 fs-5"></i>
        <div>{{ successToastMsg }}</div>
      </div>
    </transition>

    <div class="box-header d-flex justify-content-between align-items-start mb-3">
      <div>
        <h2 class="box-title">WhatsApp Broadcast Pelanggan</h2>
        <p class="box-subtitle">Kirim pesan informasi toko buka, diskon, atau pengumuman secara serentak ke pelanggan setia.</p>
      </div>

      <!-- Quick pairing status on the top right -->
      <div class="d-flex align-items-center gap-2">
        <span class="badge" :class="state.waPaired ? 'bg-success' : 'bg-secondary'">
          {{ state.waPaired ? 'WA Aktif' : 'WA Belum Terhubung' }}
        </span>
      </div>
    </div>

    <!-- Pair WhatsApp section -->
    <div v-if="showPairButton" class="border rounded-3 p-3 mb-4 bg-light">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h6 class="fw-bold mb-1 text-dark">
            <i class="bi bi-phone-vibrate me-1 text-primary"></i>
            {{ state.waPaired ? 'WhatsApp Terhubung' : 'WhatsApp Terputus' }}
          </h6>
          <p class="text-muted small mb-0">
            {{ state.waPaired ? `Tersambung ke: ${state.waPairedNumber}` : 'Hubungkan perangkat HP toko untuk mulai mengirim broadcast.' }}
          </p>
        </div>
        <button 
          @click="state.waPaired ? disconnectWA() : triggerPairing()" 
          class="btn-pair-whatsapp btn-sm"
          :class="{ 'connected': state.waPaired }"
        >
          <i class="bi me-2" :class="state.waPaired ? 'bi-link-45deg' : 'bi-qr-code'"></i>
          <span>{{ state.waPaired ? 'Putus Koneksi' : 'Pair WA' }}</span>
        </button>
      </div>
    </div>

    <!-- Tab Navigation -->
    <ul class="nav nav-tabs mb-4 px-1" style="border-bottom: 2px solid #e2e8f0;">
      <li class="nav-item">
        <button 
          class="nav-link fw-bold border-0 px-3 py-2" 
          :class="activeTab === 'broadcast' ? 'text-primary' : 'text-muted'"
          :style="activeTab === 'broadcast' ? 'border-bottom: 3px solid #2563eb !important; color: #2563eb !important; font-weight: 600;' : 'background: transparent; border: none;'"
          @click="activeTab = 'broadcast'"
        >
          <i class="bi bi-send-fill me-1.5"></i>Kirim Broadcast
        </button>
      </li>
      <li class="nav-item">
        <button 
          class="nav-link fw-bold border-0 px-3 py-2" 
          :class="activeTab === 'customers' ? 'text-primary' : 'text-muted'"
          :style="activeTab === 'customers' ? 'border-bottom: 3px solid #2563eb !important; color: #2563eb !important; font-weight: 600;' : 'background: transparent; border: none;'"
          @click="activeTab = 'customers'"
        >
          <i class="bi bi-people-fill me-1.5"></i>Kelola Customer ({{ state.customers.length }})
        </button>
      </li>
    </ul>

    <!-- Tab 1: Kirim Broadcast -->
    <div v-if="activeTab === 'broadcast'" class="broadcast-panel animate-fade-in">
      <!-- Template Selection -->
      <div class="mb-3">
        <label class="form-label-style">Template Pesan</label>
        <select v-model="selectedTemplateId" @change="handleTemplateChange" class="form-select-style">
          <option v-for="temp in waTemplates" :key="temp.id" :value="temp.id">
            {{ temp.title }}
          </option>
          <option value="custom">-- Tulis Pesan Kustom --</option>
        </select>
      </div>

      <!-- Message Text Area -->
      <div class="mb-3">
        <label class="form-label-style">Isi Pesan Broadcast</label>
        <textarea v-model="broadcastMessage" rows="4" class="form-control-style" placeholder="Masukkan pesan broadcast WhatsApp..."></textarea>
      </div>

      <!-- Broadcast Target and Action -->
      <div class="row g-2 mb-3">
        <div class="col-6">
          <label class="form-label-style">Target Pelanggan</label>
          <select v-model="broadcastTarget" class="form-select-style">
            <option value="semua">Semua ({{ state.customers.length }} kontak)</option>
            <option value="vip">Pelanggan VIP ({{ state.customers.filter(c => c.type === 'VIP').length }})</option>
            <option value="pelanggan-baru">Pelanggan Baru Hari Ini ({{ newTodayCustomers.length }} Kontak)</option>
            <option value="test">Uji Nomor Sendiri</option>
          </select>
        </div>
        <div class="col-6 d-flex align-items-end">
          <button 
            @click="sendBroadcast" 
            :disabled="isSendingBroadcast || !broadcastMessage.trim() || (!state.waPaired && showPairButton) || (broadcastTarget === 'pelanggan-baru' && newTodayCustomers.length === 0) || (broadcastTarget === 'semua' && state.customers.length === 0) || (broadcastTarget === 'vip' && state.customers.filter(c => c.type === 'VIP').length === 0)"
            class="btn-send-broadcast w-100"
          >
            <i class="bi bi-whatsapp me-2"></i>
            <span>{{ isSendingBroadcast ? 'Mengirim...' : 'Kirim Broadcast' }}</span>
          </button>
        </div>
      </div>

      <!-- Customer count warnings -->
      <div v-if="broadcastTarget === 'pelanggan-baru' && newTodayCustomers.length === 0" class="alert alert-info border-0 rounded-3 py-1.5 px-3 mb-3 small animate-fade-in">
        <i class="bi bi-info-circle-fill me-2 text-info"></i>
        <span>Belum ada pelanggan baru hari ini yang mencantumkan nomor WhatsApp saat checkout transaksi.</span>
      </div>
      <div v-if="broadcastTarget === 'semua' && state.customers.length === 0" class="alert alert-info border-0 rounded-3 py-1.5 px-3 mb-3 small animate-fade-in">
        <i class="bi bi-info-circle-fill me-2 text-info"></i>
        <span>Daftar customer broadcast Anda kosong. Silakan masuk to tab <strong>Kelola Customer</strong> untuk menambahkan kontak.</span>
      </div>
      <div v-if="broadcastTarget === 'vip' && state.customers.filter(c => c.type === 'VIP').length === 0" class="alert alert-info border-0 rounded-3 py-1.5 px-3 mb-3 small animate-fade-in">
        <i class="bi bi-info-circle-fill me-2 text-info"></i>
        <span>Tidak ada customer dengan tipe VIP tersimpan.</span>
      </div>

      <!-- Pairing warning if not paired yet -->
      <div v-if="!state.waPaired && showPairButton" class="alert alert-warning border-0 rounded-3 py-1.5 px-3 mb-3 small animate-fade-in">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <span>Harap lakukan <strong>Pair WA</strong> terlebih dahulu untuk mengirim broadcast.</span>
      </div>

      <!-- Progress Bar Simulation -->
      <div v-if="isSendingBroadcast" class="broadcast-progress-container mb-3 animate-fade-in">
        <div class="d-flex justify-content-between mb-1 small text-muted">
          <span>Mengirim WhatsApp Broadcast...</span>
          <span>{{ broadcastProgress }}%</span>
        </div>
        <div class="progress" style="height: 6px;">
          <div class="progress-bar progress-bar-striped progress-bar-animated bg-success" role="progressbar"
            :style="{ width: broadcastProgress + '%' }" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>

      <!-- Broadcast History -->
      <div v-if="showHistory" class="broadcast-history mt-4">
        <span class="section-divider-title mb-2 d-block">Riwayat Broadcast Terakhir</span>
        <ul class="history-list">
          <li v-for="(hist, idx) in state.broadcastHistory" :key="idx" class="history-item">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <span class="hist-template fw-semibold text-dark">{{ hist.template }}</span>
                <span class="hist-target text-muted ms-2">{{ hist.target }}</span>
              </div>
              <span class="hist-time text-muted small">{{ hist.time }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Tab 2: Kelola Customer -->
    <div v-else-if="activeTab === 'customers'" class="customers-panel animate-fade-in">
      <div class="row g-4">
        <!-- Form Tambah Customer (Left/Top) -->
        <div class="col-12 col-md-5">
          <div class="border rounded-3 p-3 bg-light">
            <h5 class="fw-bold text-dark mb-3" style="font-size: 0.95rem;">
              <i class="bi bi-person-plus-fill text-primary me-1.5"></i>Tambah Customer Baru
            </h5>
            <form @submit.prevent="handleAddCustomerSubmit">
              <div class="mb-3">
                <label class="form-label-style small mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  v-model="newCustName" 
                  class="form-control-style py-1.5 px-3" 
                  placeholder="Masukkan nama pembeli..."
                  required
                />
              </div>
              <div class="mb-3">
                <label class="form-label-style small mb-1">No. WhatsApp</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0 text-muted px-2.5 small">+62</span>
                  <input 
                    type="text" 
                    v-model="newCustPhone" 
                    class="form-control-style border-start-0 py-1.5 px-3" 
                    placeholder="812xxxxxxxx"
                    required
                  />
                </div>
                <small class="text-muted d-block mt-1" style="font-size: 0.7rem; line-height: 1.2;">Contoh: 81234567890 (tanpa angka 0 di depan atau +62)</small>
              </div>
              <div class="mb-3">
                <label class="form-label-style small mb-1">Kategori Pelanggan</label>
                <select v-model="newCustType" class="form-select-style py-1.5">
                  <option value="Reguler">Reguler</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary-custom w-100 py-2">
                <i class="bi bi-check-circle me-1.5"></i>Simpan Customer
              </button>
            </form>
          </div>
        </div>

        <!-- List/Tabel Customer (Right/Bottom) -->
        <div class="col-12 col-md-7">
          <div class="border rounded-3 p-3 bg-white d-flex flex-column h-100">
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h5 class="fw-bold text-dark mb-0" style="font-size: 0.95rem;">
                <i class="bi bi-journal-text text-primary me-1.5"></i>Kontak Broadcast
              </h5>
              <div class="position-relative" style="width: 170px;">
                <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2.5 text-muted small"></i>
                <input 
                  type="text" 
                  v-model="searchCustomerQuery" 
                  class="form-control-style py-1 ps-5" 
                  placeholder="Cari..."
                  style="height: 30px; font-size: 0.78rem; padding-left: 28px !important;"
                />
              </div>
            </div>

            <div class="table-responsive" style="max-height: 270px; overflow-y: auto;">
              <table class="table custom-table align-middle" style="font-size: 0.82rem;">
                <thead>
                  <tr>
                    <th @click="toggleSort('name')" style="cursor: pointer; user-select: none;">
                      Nama
                      <i class="bi ms-1" :class="sortBy.startsWith('name') ? (sortBy === 'name-asc' ? 'bi-sort-alpha-down text-primary' : 'bi-sort-alpha-up-alt text-primary') : 'bi-arrow-down-up text-muted small'"></i>
                    </th>
                    <th>No. WhatsApp</th>
                    <th @click="toggleSort('type')" style="cursor: pointer; user-select: none;">
                      Tipe
                      <i class="bi ms-1" :class="sortBy.startsWith('type') ? (sortBy === 'type-asc' ? 'bi-sort-alpha-down text-primary' : 'bi-sort-alpha-up-alt text-primary') : 'bi-arrow-down-up text-muted small'"></i>
                    </th>
                    <th class="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="cust in paginatedCustomers" :key="cust.id">
                    <td class="fw-semibold text-dark">{{ cust.name }}</td>
                    <td>
                      <a :href="'https://wa.me/' + cust.phone" target="_blank" class="text-success text-decoration-none fw-semibold">
                        <i class="bi bi-whatsapp me-1 text-success"></i>{{ cust.phone }}
                      </a>
                    </td>
                    <td>
                      <span class="badge" :class="cust.type === 'VIP' ? 'bg-light-primary text-primary border-primary' : 'bg-light text-secondary border'">
                        {{ cust.type }}
                      </span>
                    </td>
                    <td class="text-center">
                      <button @click="handleDeleteCustomer(cust.id, cust.name)" class="btn btn-sm text-danger border-0 p-1">
                        <i class="bi bi-trash-fill"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="filteredCustomers.length === 0">
                    <td colspan="4" class="text-center py-4 text-muted">Customer tidak ditemukan.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination Controls -->
            <div v-if="totalCustomerPages > 1" class="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2 pt-2 border-top">
              <div class="text-muted small" style="font-size: 0.72rem;">
                Menampilkan <strong>{{ (currentCustomerPage - 1) * customersPerPage + 1 }}</strong> - <strong>{{ Math.min(currentCustomerPage * customersPerPage, filteredCustomers.length) }}</strong> dari <strong>{{ filteredCustomers.length }}</strong>
              </div>
              <nav aria-label="Page navigation">
                <ul class="pagination pagination-sm mb-0">
                  <li class="page-item" :class="{ disabled: currentCustomerPage === 1 }">
                    <button class="page-link rounded-start-3 px-1.5 py-0.5" style="font-size: 0.72rem;" @click="currentCustomerPage--" :disabled="currentCustomerPage === 1" aria-label="Previous">
                      <i class="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  <li v-for="page in visibleCustomerPages" :key="page" class="page-item" :class="{ active: currentCustomerPage === page }">
                    <button class="page-link px-2 py-0.5" style="font-size: 0.72rem;" @click="currentCustomerPage = page">{{ page }}</button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentCustomerPage === totalCustomerPages }">
                    <button class="page-link rounded-end-3 px-1.5 py-0.5" style="font-size: 0.72rem;" @click="currentCustomerPage++" :disabled="currentCustomerPage === totalCustomerPages" aria-label="Next">
                      <i class="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pair WhatsApp Modal -->
    <PairWaModal :show="showPairModal" @close="showPairModal = false" @confirm="handlePairConfirm" />
  </div>
</template>
