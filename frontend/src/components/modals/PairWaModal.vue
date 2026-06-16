<script setup>
import { ref } from 'vue'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close', 'confirm'])

const activeTab = ref('qr') // 'qr' or 'code'
const phoneNumber = ref('+62 ')
const pairingCode = ref('')
const step = ref('input') // 'input', 'display', 'pairing'
const isScanning = ref(false)

const handleClose = () => {
  emit('close')
  // Reset state
  activeTab.value = 'qr'
  phoneNumber.value = '+62 '
  pairingCode.value = ''
  step.value = 'input'
  isScanning.value = false
}

// Generate random mock pairing code
const generateCode = () => {
  if (!phoneNumber.value.trim() || phoneNumber.value.trim() === '+62') return
  step.value = 'pairing'
  
  setTimeout(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code1 = ''
    let code2 = ''
    for (let i = 0; i < 4; i++) {
      code1 += chars.charAt(Math.floor(Math.random() * chars.length))
      code2 += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    pairingCode.value = `${code1}-${code2}`
    step.value = 'display'
  }, 1000)
}

const simulateQrConnect = () => {
  isScanning.value = true
  setTimeout(() => {
    emit('confirm', '+62 812-9988-7766')
    handleClose()
  }, 2000)
}

const simulateCodeConnect = () => {
  step.value = 'pairing'
  setTimeout(() => {
    emit('confirm', phoneNumber.value)
    handleClose()
  }, 2000)
}
</script>

<template>
  <transition name="modal">
    <div v-if="show" class="modal-backdrop-custom">
      <div class="modal-card-custom animate-fade-in" style="max-width: 500px;">
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
          <div v-if="isScanning || step === 'pairing'" class="text-center py-5">
            <div class="spinner-border text-success mb-3" style="width: 3rem; height: 3rem;" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <h5 class="fw-bold text-dark">Menghubungkan Perangkat...</h5>
            <p class="text-muted small">Sedang mensinkronisasi kontak dan pesan Anda.</p>
          </div>

          <!-- Normal Form State -->
          <div v-else>
            <!-- Custom Tabs -->
            <div class="d-flex border-bottom mb-4">
              <button 
                @click="activeTab = 'qr'" 
                class="flex-fill py-2 fw-semibold text-center border-0 bg-transparent text-decoration-none"
                :class="activeTab === 'qr' ? 'text-primary border-bottom border-primary border-2 fw-bold' : 'text-muted'"
                style="border-bottom: 2px solid transparent !important;"
              >
                Scan Kode QR
              </button>
              <button 
                @click="activeTab = 'code'" 
                class="flex-fill py-2 fw-semibold text-center border-0 bg-transparent text-decoration-none"
                :class="activeTab === 'code' ? 'text-primary border-bottom border-primary border-2 fw-bold' : 'text-muted'"
                style="border-bottom: 2px solid transparent !important;"
              >
                Hubungkan dengan Nomor HP
              </button>
            </div>

            <!-- Tab 1: QR Code Scanner -->
            <div v-if="activeTab === 'qr'" class="text-center">
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
                <button @click="simulateQrConnect" class="btn btn-primary-custom px-4">
                  <i class="bi bi-qr-code-scan me-2"></i>Simulasikan Scan Berhasil
                </button>
              </div>
            </div>

            <!-- Tab 2: Pairing Code -->
            <div v-else-if="activeTab === 'code'">
              <div v-if="step === 'input'">
                <p class="text-muted small mb-4">Masukkan nomor HP toko Anda untuk mendapatkan kode pairing 8 digit yang harus dimasukkan ke HP Anda.</p>
                <div class="mb-4">
                  <label class="form-label-style">Nomor Handphone</label>
                  <input 
                    type="text" 
                    v-model="phoneNumber" 
                    class="form-control-style" 
                    placeholder="Contoh: +62 8123456789"
                  />
                </div>
                <button 
                  @click="generateCode" 
                  :disabled="phoneNumber.length < 8" 
                  class="btn btn-primary-custom w-100 py-2.5"
                >
                  Dapatkan Kode Pairing
                </button>
              </div>

              <div v-else-if="step === 'display'" class="text-center">
                <p class="text-muted small mb-3">Tautan kode untuk menghubungkan WhatsApp:</p>
                
                <!-- Pairing code layout -->
                <div class="bg-light border rounded-3 p-3 mb-4 d-inline-block w-100">
                  <div class="display-6 fw-bold tracking-widest text-primary font-monospace">{{ pairingCode }}</div>
                </div>

                <div class="alert alert-warning border-0 rounded-3 py-2 px-3 mb-4 small text-start">
                  <i class="bi bi-info-circle-fill me-2 text-warning fs-6"></i>
                  <span>Buka menu **Perangkat Tertaut** > **Tautkan Perangkat** > **Tautkan dengan nomor telepon saja** di HP Anda, kemudian masukkan 8 digit kode di atas.</span>
                </div>

                <button @click="simulateCodeConnect" class="btn btn-success w-100 py-2.5">
                  <i class="bi bi-check-circle me-2"></i>Simulasikan Kode Berhasil Dimasukkan
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer-custom border-top">
          <button @click="handleClose" class="btn-cancel">Batal</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.tracking-widest {
  letter-spacing: 0.15em;
}
</style>
