<script setup>
import { ref, reactive } from 'vue'
import { state, pairPrinter } from '../store/store.js'

const successToastMsg = ref('')

// Load basic configuration from localStorage
const loadConfig = (key, defaultVal) => {
  const saved = localStorage.getItem(key)
  return saved ? JSON.parse(saved) : defaultVal
}

const shopConfig = reactive({
  name: loadConfig('shop_name', 'Toko Ce Alin'),
  address: loadConfig('shop_address', 'Jalan Raya Sembako No. 7, Jakarta Barat'),
  whatsapp: loadConfig('shop_whatsapp', '+62 812-3456-7890'),
  openHours: loadConfig('shop_hours', '08:00 - 21:00 WIB'),
  receiptHeader: loadConfig('shop_receipt_header', 'Terima Kasih Telah Belanja di Toko Ce Alin!'),
  printerPaperSize: loadConfig('shop_printer_size', '58mm'),
  autoPrintReceipt: loadConfig('shop_auto_print', true)
})

const saveConfig = () => {
  localStorage.setItem('shop_name', JSON.stringify(shopConfig.name))
  localStorage.setItem('shop_address', JSON.stringify(shopConfig.address))
  localStorage.setItem('shop_whatsapp', JSON.stringify(shopConfig.whatsapp))
  localStorage.setItem('shop_hours', JSON.stringify(shopConfig.openHours))
  localStorage.setItem('shop_receipt_header', JSON.stringify(shopConfig.receiptHeader))
  localStorage.setItem('shop_printer_size', JSON.stringify(shopConfig.printerPaperSize))
  localStorage.setItem('shop_auto_print', JSON.stringify(shopConfig.autoPrintReceipt))

  triggerToast('Pengaturan operasional toko berhasil disimpan!')
}

const resetSimulationData = () => {
  if (confirm('Apakah Anda yakin ingin mereset seluruh data simulasi? Seluruh produk, transaksi, diskon, dan status pairing WA akan dikembalikan ke setelan awal pabrik.')) {
    localStorage.clear()
    triggerToast('Seluruh data berhasil direset! Memuat ulang halaman...')
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }
}

// Printer Pairing States & Actions
const showPrinterModal = ref(false)
const isScanning = ref(false)
const selectedPrinter = ref('RP-58A Thermal Printer')
const printerList = ['RP-58A Thermal Printer (Bluetooth)', 'EPSON TM-T82 Thermal (USB/LAN)', 'Generic POS-58 Printer (Bluetooth)']

const triggerPairPrinter = () => {
  isScanning.value = true
  showPrinterModal.value = true
  setTimeout(() => {
    isScanning.value = false
  }, 2000)
}

const confirmPrinterPair = () => {
  pairPrinter(true, selectedPrinter.value)
  showPrinterModal.value = false
  triggerToast(`Berhasil menautkan printer thermal: ${selectedPrinter.value}!`)
}

const disconnectPrinter = () => {
  if (confirm('Apakah Anda yakin ingin memutus koneksi printer thermal?')) {
    pairPrinter(false)
    triggerToast('Koneksi printer thermal diputus.')
  }
}

const triggerToast = (msg) => {
  successToastMsg.value = msg
  setTimeout(() => {
    successToastMsg.value = ''
  }, 4000)
}
</script>

<template>
  <div class="pengaturan-wrapper">
    <!-- Success Toast Alert -->
    <transition name="fade">
      <div v-if="successToastMsg" class="custom-alert alert alert-success d-flex align-items-center shadow" role="alert">
        <i class="bi bi-check-circle-fill me-2 fs-5"></i>
        <div>{{ successToastMsg }}</div>
      </div>
    </transition>

    <!-- Page Title -->
    <div class="content-header mb-4">
      <h1 class="page-title">Pengaturan Sistem</h1>
      <p class="page-subtitle">Atur detail operasional toko, cetak struk kasir, jam kerja, dan reset database simulasi.</p>
    </div>

    <div class="row g-4">
      <!-- Left Column: Shop Identity (60%) -->
      <div class="col-12 col-lg-7">
        <div class="card-content-box shadow-sm mb-4">
          <div class="box-header border-bottom pb-2 mb-4">
            <h2 class="box-title">Identitas & Informasi Toko</h2>
            <p class="box-subtitle">Informasi ini akan tercetak di bagian atas (header) nota belanja pelanggan.</p>
          </div>

          <form @submit.prevent="saveConfig">
            <div class="mb-3">
              <label for="shopName" class="form-label-style">Nama Toko</label>
              <input type="text" id="shopName" v-model="shopConfig.name" class="form-control-style" :disabled="state.currentUser.role.toLowerCase() === 'karyawan'" required />
            </div>

            <div class="mb-3">
              <label for="shopAddress" class="form-label-style">Alamat Toko</label>
              <textarea id="shopAddress" v-model="shopConfig.address" rows="3" class="form-control-style" :disabled="state.currentUser.role.toLowerCase() === 'karyawan'" required></textarea>
            </div>

            <div class="row g-3 mb-3">
              <div class="col-6">
                <label for="shopWa" class="form-label-style">No. WhatsApp Toko</label>
                <input type="text" id="shopWa" v-model="shopConfig.whatsapp" class="form-control-style" :disabled="state.currentUser.role.toLowerCase() === 'karyawan'" required />
              </div>
              <div class="col-6">
                <label for="shopHours" class="form-label-style">Jam Operasional</label>
                <input type="text" id="shopHours" v-model="shopConfig.openHours" class="form-control-style" :disabled="state.currentUser.role.toLowerCase() === 'karyawan'" required />
              </div>
            </div>

            <div class="mb-4">
              <label for="receiptHeader" class="form-label-style">Catatan Kaki Struk (Footer)</label>
              <input type="text" id="receiptHeader" v-model="shopConfig.receiptHeader" class="form-control-style" :disabled="state.currentUser.role.toLowerCase() === 'karyawan'" required />
            </div>

            <button v-if="state.currentUser.role.toLowerCase() === 'owner'" type="submit" class="btn btn-primary-custom px-4 py-2.5">
              <i class="bi bi-save-fill me-2"></i>Simpan Perubahan
            </button>
          </form>
        </div>
      </div>

      <!-- Right Column: Hardware / Print Setup & System actions (40%) -->
      <div class="col-12 col-lg-5">
        <div class="d-flex flex-column gap-4">
          <!-- Printer settings -->
          <div class="card-content-box shadow-sm">
            <div class="box-header border-bottom pb-2 mb-4">
              <h2 class="box-title">Pengaturan Printer Kasir</h2>
              <p class="box-subtitle">Hubungkan printer thermal nota struk belanja via Bluetooth/USB.</p>
            </div>

            <div class="mb-3.5">
              <label class="form-label-style">Ukuran Kertas Printer</label>
              <div class="d-flex gap-3">
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="paperSize" id="size58" value="58mm" v-model="shopConfig.printerPaperSize" />
                  <label class="form-check-label text-dark fw-semibold small" for="size58">Thermal 58mm (Standar)</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="paperSize" id="size80" value="80mm" v-model="shopConfig.printerPaperSize" />
                  <label class="form-check-label text-dark fw-semibold small" for="size80">Thermal 80mm (Lebar)</label>
                </div>
              </div>
            </div>

            <div class="mb-4">
              <div class="form-check form-switch p-0 d-flex justify-content-between align-items-center">
                <div>
                  <label class="form-check-label text-dark fw-bold small" for="autoPrint">Cetak Struk Otomatis</label>
                  <span class="text-muted d-block small" style="font-size: 0.75rem;">Nota langsung tercetak setelah pembayaran selesai.</span>
                </div>
                <input class="form-check-input ms-0" type="checkbox" id="autoPrint" v-model="shopConfig.autoPrintReceipt" style="width: 42px; height: 21px; cursor: pointer;" />
              </div>
            </div>

            <!-- Printer Connection Status Panel -->
            <div class="border rounded-3 p-3 bg-light text-center mb-1">
              <div v-if="state.printerPaired">
                <div class="d-flex align-items-center justify-content-center text-success mb-1 small fw-bold">
                  <i class="bi bi-check-circle-fill me-1.5 fs-5"></i>
                  <span>Printer Thermal Terhubung</span>
                </div>
                <span class="text-muted d-block small mb-3" style="font-size: 0.72rem;">Model: {{ state.printerPairedName }} (Online)</span>
                <button @click="disconnectPrinter" class="btn btn-sm btn-outline-danger w-100 py-1.5 fw-semibold">
                  Putus Koneksi Printer
                </button>
              </div>
              <div v-else>
                <div class="d-flex align-items-center justify-content-center text-secondary mb-2 small fw-bold">
                  <i class="bi bi-printer-fill me-1.5 fs-5 text-secondary"></i>
                  <span>Printer Belum Ditautkan</span>
                </div>
                <button @click="triggerPairPrinter" class="btn btn-sm btn-primary-custom w-100 py-2">
                  <i class="bi bi-link-45deg me-1"></i>Tautkan Printer thermal
                </button>
              </div>
            </div>
          </div>

          <!-- Simulation database tools (Only Owner can reset database) -->
          <div v-if="state.currentUser.role.toLowerCase() === 'owner'" class="card-content-box shadow-sm border border-danger border-opacity-25" style="background-color: #fff8f8;">
            <div class="box-header mb-3">
              <h2 class="box-title text-danger">Pusat Bahaya / Reset Sistem</h2>
              <p class="box-subtitle">Aksi pembersihan cache penyimpanan lokal browser Anda.</p>
            </div>
            
            <p class="text-muted small mb-4">Mereset data akan menghapus seluruh data barang kustom yang Anda tambahkan, riwayat diskon, transaksi hari ini, dan mengembalikannya ke pengaturan demonstrasi awal.</p>
            
            <button @click="resetSimulationData" class="btn btn-danger w-100 py-2.5 fw-semibold border-0" style="background-color: #ef4444;">
              <i class="bi bi-trash3-fill me-2"></i>Reset Seluruh Data
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Printer Pairing Simulation Modal -->
    <transition name="modal">
      <div v-if="showPrinterModal" class="modal-backdrop-custom">
        <div class="modal-card-custom animate-fade-in" style="max-width: 440px;">
          <div class="modal-header-custom border-bottom">
            <h3 class="modal-title-custom">
              <i class="bi bi-printer text-primary me-2"></i>Tautkan Printer Thermal Struk
            </h3>
            <button @click="showPrinterModal = false" class="btn-close-custom">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="modal-body-custom py-4">
            <div v-if="isScanning" class="text-center py-4">
              <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Scanning...</span>
              </div>
              <h6 class="fw-bold text-dark">Memindai Perangkat Terdekat...</h6>
              <p class="text-muted small mb-0">Pastikan Bluetooth printer thermal Anda aktif.</p>
            </div>
            <div v-else>
              <p class="text-muted small mb-3">Pilih printer thermal Bluetooth/USB yang terdeteksi di sekitar Anda:</p>
              
              <div class="d-flex flex-column gap-2 mb-3">
                <div 
                  v-for="printer in printerList" 
                  :key="printer" 
                  @click="selectedPrinter = printer" 
                  class="d-flex align-items-center justify-content-between p-3 border rounded-3 text-start style-clickable-item"
                  :class="selectedPrinter === printer ? 'border-primary bg-light-primary-mini' : 'bg-white'"
                  style="cursor: pointer;"
                >
                  <div class="d-flex align-items-center">
                    <i class="bi bi-printer-fill fs-5 me-2.5" :class="selectedPrinter === printer ? 'text-primary' : 'text-muted'"></i>
                    <span class="small fw-semibold text-dark">{{ printer }}</span>
                  </div>
                  <i v-if="selectedPrinter === printer" class="bi bi-check-circle-fill text-primary"></i>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer-custom border-top">
            <button @click="showPrinterModal = false" class="btn-cancel">Batal</button>
            <button @click="confirmPrinterPair" :disabled="isScanning" class="btn-confirm">Tautkan Perangkat</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.pengaturan-wrapper {
  padding: 30px;
  overflow-y: auto;
  height: calc(100vh - 70px);
}
.bg-light-primary-mini {
  background-color: #f0f6ff;
}
@media (max-width: 991px) {
  .pengaturan-wrapper {
    height: auto;
    padding: 20px;
  }
}
</style>
