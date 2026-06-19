<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { checkWhatsappStatus, API_URL } from '../../store/store.js'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close', 'confirm'])

const status = ref('DISCONNECTED') // DISCONNECTED, CONNECTING, QR_CODE, CONNECTED
const qrImage = ref(null)
let pollInterval = null

const handleClose = () => {
  stopPolling()
  emit('close')
}

const startPolling = () => {
  stopPolling()
  
  const tick = async () => {
    // Check connection status
    const currentStatus = await checkWhatsappStatus()
    status.value = currentStatus

    if (currentStatus === 'CONNECTED') {
      const response = await fetch(`${API_URL}/whatsapp/status`, { credentials: 'include' })
      const resData = await response.json()
      emit('confirm', resData.number || '+62 8xx')
      handleClose()
      return
    }

    if (currentStatus === 'QR_CODE') {
      // Fetch QR image
      try {
        const response = await fetch(`${API_URL}/whatsapp/qr`, { credentials: 'include' })
        const resData = await response.json()
        if (resData.success && resData.qr) {
          qrImage.value = resData.qr
        }
      } catch (e) {
        console.error("Failed to load QR code image:", e)
      }
    } else {
      qrImage.value = null
    }
  }

  // Execute immediately
  tick()

  // Poll every 2 seconds
  pollInterval = setInterval(tick, 2000)
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    status.value = 'CONNECTING'
    qrImage.value = null
    startPolling()
  } else {
    stopPolling()
  }
})

onUnmounted(() => {
  stopPolling()
})
</script>

<template>
  <transition name="modal">
    <div v-if="show" class="modal-backdrop-custom">
      <div class="modal-card-custom animate-fade-in" style="max-width: 460px;">
        <div class="modal-header-custom border-bottom">
          <h3 class="modal-title-custom">
            <i class="bi bi-whatsapp text-success me-2"></i>Hubungkan WhatsApp Toko
          </h3>
          <button @click="handleClose" class="btn-close-custom">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-custom py-4">
          <!-- Connecting or Disconnected status (Spinner) -->
          <div v-if="status === 'CONNECTING' || status === 'DISCONNECTED'" class="text-center py-5">
            <div class="spinner-border text-success mb-3" style="width: 3rem; height: 3rem;" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <h5 class="fw-bold text-dark">Menyiapkan Perangkat...</h5>
            <p class="text-muted small">Harap tunggu, sedang menginisialisasi WhatsApp service.</p>
          </div>

          <!-- QR Code Scan View -->
          <div v-else-if="status === 'QR_CODE'" class="text-center">
            <p class="text-muted small mb-4">Buka WhatsApp di HP Anda, masuk ke Perangkat Tertaut, lalu pindai kode QR di bawah ini.</p>
            
            <!-- Real QR Code Image -->
            <div class="d-inline-block p-3 border rounded-3 bg-white shadow-sm mb-4 position-relative">
              <img v-if="qrImage" :src="qrImage" alt="WhatsApp QR Code" style="width: 200px; height: 200px; display: block;" />
              <div v-else class="d-flex align-items-center justify-content-center" style="width: 200px; height: 200px;">
                <div class="spinner-border text-secondary" role="status"></div>
              </div>
            </div>

            <div class="text-muted small">
              <i class="bi bi-info-circle me-1"></i>
              Kode QR akan diperbarui secara berkala.
            </div>
          </div>

          <!-- Connected status (Success) -->
          <div v-else-if="status === 'CONNECTED'" class="text-center py-5">
            <i class="bi bi-check-circle-fill text-success fs-1 mb-3"></i>
            <h5 class="fw-bold text-dark">Berhasil Terhubung!</h5>
            <p class="text-muted small">WhatsApp Anda telah aktif untuk pengiriman broadcast.</p>
          </div>
        </div>

        <div class="modal-header-custom border-top py-3 justify-content-center bg-light">
          <button @click="handleClose" class="btn-cancel px-4">Batal</button>
        </div>
      </div>
    </div>
  </transition>
</template>
