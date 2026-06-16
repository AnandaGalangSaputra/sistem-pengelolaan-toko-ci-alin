<script setup>
import { ref, computed } from 'vue'
import { state, addBroadcastHistory, pairWA, waTemplates } from '../../store/store.js'
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

const disconnectWA = () => {
  if (confirm('Apakah Anda yakin ingin memutus koneksi WhatsApp?')) {
    pairWA(false)
    successToastMsg.value = 'Nomor WhatsApp berhasil diputus!'
    setTimeout(() => {
      successToastMsg.value = ''
    }, 4000)
  }
}

const sendBroadcast = () => {
  if (!state.waPaired) {
    alert('Silakan hubungkan WhatsApp terlebih dahulu menggunakan tombol Pair WA!')
    return
  }

  if (isSendingBroadcast.value) return
  isSendingBroadcast.value = true
  broadcastProgress.value = 0

  const interval = setInterval(() => {
    broadcastProgress.value += 10
    if (broadcastProgress.value >= 100) {
      clearInterval(interval)
      setTimeout(() => {
        isSendingBroadcast.value = false
        
        const targetLabel = broadcastTarget.value === 'semua' ? 'Semua Pelanggan (152 kontak)' :
          broadcastTarget.value === 'vip' ? 'Pelanggan VIP (42 kontak)' :
          broadcastTarget.value === 'pelanggan-baru' ? `Pelanggan Baru Hari Ini (${newTodayCustomers.value.length} kontak)` :
          'Uji Coba (Nomor Sendiri)'

        const templateLabel = waTemplates.find(t => t.id === selectedTemplateId.value)?.title || 'Custom Message'

        addBroadcastHistory(templateLabel, targetLabel)

        if (broadcastTarget.value === 'test') {
          const testUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(broadcastMessage.value)}`
          window.open(testUrl, '_blank')
        } else if (broadcastTarget.value === 'pelanggan-baru') {
          if (newTodayCustomers.value.length > 0) {
            const firstCust = newTodayCustomers.value[0]
            const testUrl = `https://wa.me/${firstCust.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(broadcastMessage.value)}`
            window.open(testUrl, '_blank')
          }
        }

        successToastMsg.value = `Sukses menyebarkan WhatsApp Broadcast ke ${targetLabel}!`
        setTimeout(() => {
          successToastMsg.value = ''
        }, 4000)
      }, 500)
    }
  }, 150)
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

    <div class="broadcast-panel">
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
            <option value="semua">Semua (152 kontak)</option>
            <option value="vip">Pelanggan VIP (42)</option>
            <option value="pelanggan-baru">Pelanggan Baru Hari Ini ({{ newTodayCustomers.length }} Kontak)</option>
            <option value="test">Uji Nomor Sendiri</option>
          </select>
        </div>
        <div class="col-6 d-flex align-items-end">
          <button 
            @click="sendBroadcast" 
            :disabled="isSendingBroadcast || !broadcastMessage.trim() || (!state.waPaired && showPairButton) || (broadcastTarget === 'pelanggan-baru' && newTodayCustomers.length === 0)"
            class="btn-send-broadcast w-100"
          >
            <i class="bi bi-whatsapp me-2"></i>
            <span>{{ isSendingBroadcast ? 'Mengirim...' : 'Kirim Broadcast' }}</span>
          </button>
        </div>
      </div>

      <!-- Customer count warning or helper -->
      <div v-if="broadcastTarget === 'pelanggan-baru' && newTodayCustomers.length === 0" class="alert alert-info border-0 rounded-3 py-1.5 px-3 mb-3 small animate-fade-in">
        <i class="bi bi-info-circle-fill me-2 text-info"></i>
        <span>Belum ada pelanggan baru hari ini yang mencantumkan nomor WhatsApp saat checkout transaksi.</span>
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

    <!-- Pair WhatsApp Modal -->
    <PairWaModal :show="showPairModal" @close="showPairModal = false" @confirm="handlePairConfirm" />
  </div>
</template>
