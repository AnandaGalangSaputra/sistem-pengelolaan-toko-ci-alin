<script setup>
import { ref } from 'vue'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close', 'confirm'])

const isScanning = ref(false)

const handleClose = () => {
  emit('close')
  isScanning.value = false
}

const simulateQrConnect = () => {
  isScanning.value = true
  setTimeout(() => {
    emit('confirm', '+62 812-9988-7766')
    handleClose()
  }, 2000)
}
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
          <!-- Connection State Animation -->
          <div v-if="isScanning" class="text-center py-5">
            <div class="spinner-border text-success mb-3" style="width: 3rem; height: 3rem;" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <h5 class="fw-bold text-dark">Menghubungkan Perangkat...</h5>
            <p class="text-muted small">Sedang mensinkronisasi kontak dan pesan Anda.</p>
          </div>

          <!-- QR Code Scan View Only -->
          <div v-else class="text-center">
            <p class="text-muted small mb-4">Buka WhatsApp di HP Anda, masuk ke Perangkat Tertaut, lalu pindai kode QR di bawah ini.</p>
            
            <!-- QR Code Mock SVG -->
            <div class="d-inline-block p-3 border rounded-3 bg-white shadow-sm mb-4 position-relative">
              <svg width="180" height="180" viewBox="0 0 100 100" class="d-block mx-auto">
                <!-- QR Corner Detection Patterns -->
                <rect x="5" y="5" width="25" height="25" fill="#1e293b" />
                <rect x="9" y="9" width="17" height="17" fill="#ffffff" />
                <rect x="12" y="12" width="11" height="11" fill="#1e293b" />

                <rect x="70" y="5" width="25" height="25" fill="#1e293b" />
                <rect x="74" y="9" width="17" height="17" fill="#ffffff" />
                <rect x="77" y="12" width="11" height="11" fill="#1e293b" />

                <rect x="5" y="70" width="25" height="25" fill="#1e293b" />
                <rect x="9" y="74" width="17" height="17" fill="#ffffff" />
                <rect x="12" y="77" width="11" height="11" fill="#1e293b" />
                
                <!-- Center logo block -->
                <rect x="42" y="42" width="16" height="16" fill="#128c7e" rx="3" />
                <path d="M47 50 L53 50 M50 47 L50 53" stroke="#ffffff" stroke-width="2" />

                <!-- Random QR noise dots -->
                <rect x="35" y="10" width="8" height="4" fill="#334155" />
                <rect x="45" y="5" width="4" height="8" fill="#334155" />
                <rect x="55" y="15" width="10" height="6" fill="#334155" />
                <rect x="35" y="25" width="6" height="6" fill="#334155" />
                
                <rect x="10" y="35" width="4" height="10" fill="#334155" />
                <rect x="20" y="40" width="8" height="4" fill="#334155" />
                <rect x="5" y="50" width="15" height="5" fill="#334155" />
                <rect x="15" y="60" width="6" height="6" fill="#334155" />

                <rect x="80" y="35" width="10" height="5" fill="#334155" />
                <rect x="75" y="45" width="6" height="8" fill="#334155" />
                <rect x="85" y="60" width="8" height="4" fill="#334155" />
                <rect x="70" y="55" width="4" height="10" fill="#334155" />

                <rect x="35" y="70" width="10" height="8" fill="#334155" />
                <rect x="50" y="80" width="6" height="10" fill="#334155" />
                <rect x="40" y="85" width="8" height="4" fill="#334155" />
                <rect x="60" y="75" width="10" height="5" fill="#334155" />
                
                <rect x="75" y="75" width="10" height="10" fill="#334155" />
                <rect x="80" y="88" width="12" height="6" fill="#334155" />
              </svg>
            </div>

            <div>
              <button @click="simulateQrConnect" class="btn btn-primary-custom px-5 py-2.5">
                <i class="bi bi-qr-code-scan me-2"></i>Simulasikan Scan Berhasil
              </button>
            </div>
          </div>
        </div>

        <div class="modal-header-custom border-top py-3 justify-content-center bg-light">
          <button @click="handleClose" class="btn-cancel px-4">Batal</button>
        </div>
      </div>
    </div>
  </transition>
</template>
