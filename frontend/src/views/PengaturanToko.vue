<script setup>
import { ref, reactive, watch } from 'vue'
import { state, pairPrinter } from '../store/store.js'

const successToastMsg = ref('')

// Tab states
const activeTab = ref('operational')

// Database tools loading states
const isBackingUp = ref(false)
const isRestoring = ref(false)
const isResetting = ref(false)
const fileInput = ref(null)
const showResetModal = ref(false)
const resetMode = ref('seeded')

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

// Backup database file via fetch download
const backupDatabase = async () => {
  isBackingUp.value = true
  try {
    const response = await fetch('http://localhost:8000/api/database/backup', {
      credentials: 'include'
    })
    if (!response.ok) {
      throw new Error('Gagal mengunduh backup database.')
    }
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, '_')
    a.download = `backup_toko_alin_${timestamp}.sqlite`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
    triggerToast('Database berhasil dicadangkan!')
  } catch (error) {
    console.error('Backup error:', error)
    alert('Gagal mengunduh backup database! Pastikan Anda masuk sebagai Owner.')
  } finally {
    isBackingUp.value = false
  }
}

// Trigger hidden file picker
const triggerRestoreFile = () => {
  fileInput.value.click()
}

// Restore database from uploaded sqlite file
const handleDatabaseRestore = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const confirmMsg = 'Apakah Anda yakin ingin memulihkan database? Seluruh data produk, rak, transaksi, dan customer saat ini akan ditimpa secara permanen oleh data dari file backup.'
  if (!confirm(confirmMsg)) {
    event.target.value = ''
    return
  }

  isRestoring.value = true
  const formData = new FormData()
  formData.append('database', file)

  try {
    const response = await fetch('http://localhost:8000/api/database/restore', {
      method: 'POST',
      credentials: 'include',
      body: formData
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      triggerToast(resData.message)
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } else {
      alert(resData.message || 'Gagal memulihkan database!')
    }
  } catch (error) {
    console.error('Restore error:', error)
    alert('Terjadi kesalahan jaringan saat memulihkan database!')
  } finally {
    isRestoring.value = false
    event.target.value = ''
  }
}

// Reset/Delete SQLite database (opens confirmation modal)
const resetDatabase = () => {
  showResetModal.value = true
}

// Confirm and execute reset database
const confirmDatabaseReset = async () => {
  isResetting.value = true
  try {
    const isClean = resetMode.value === 'clean'
    const response = await fetch('http://localhost:8000/api/database/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        clean: isClean
      })
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      triggerToast(resData.message)
      showResetModal.value = false
      localStorage.clear() // clear local cached store states
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } else {
      alert(resData.message || 'Gagal mereset database!')
    }
  } catch (error) {
    console.error('Reset error:', error)
    alert('Terjadi kesalahan jaringan saat mereset database!')
  } finally {
    isResetting.value = false
  }
}

// Printer Pairing States & Actions
const showPrinterModal = ref(false)
const isScanning = ref(false)
const selectedPrinter = ref('RP-58A Thermal Printer (Bluetooth)')
const printerList = [
  'RP-58A Thermal Printer (Bluetooth)',
  'EPSON TM-T82 Thermal (USB/LAN)',
  'Generic POS-58 Printer (Bluetooth)',
  'Generic 58mm Thermal Printer (USB)'
]

// Auto-save printer configurations when changed
watch(() => shopConfig.printerPaperSize, (newVal) => {
  localStorage.setItem('shop_printer_size', JSON.stringify(newVal))
})

watch(() => shopConfig.autoPrintReceipt, (newVal) => {
  localStorage.setItem('shop_auto_print', JSON.stringify(newVal))
})

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
      <div v-if="successToastMsg" class="custom-alert alert alert-success d-flex align-items-center shadow"
        role="alert">
        <i class="bi bi-check-circle-fill me-2 fs-5"></i>
        <div>{{ successToastMsg }}</div>
      </div>
    </transition>

    <!-- Page Title -->
    <div class="content-header mb-4">
      <h1 class="page-title">Pengaturan Sistem</h1>
      <p class="page-subtitle">Atur detail operasional toko, hubungkan printer, jam kerja, atau pelajari panduan sistem.
      </p>
    </div>

    <!-- Tab Navigation -->
    <ul class="nav nav-tabs mb-4 px-1" style="border-bottom: 2px solid #e2e8f0;">
      <li class="nav-item">
        <button class="nav-link fw-bold border-0 px-3 py-2.5"
          :class="activeTab === 'operational' ? 'text-primary' : 'text-muted'"
          :style="activeTab === 'operational' ? 'border-bottom: 3px solid #2563eb !important; color: #2563eb !important; font-weight: 600;' : 'background: transparent; border: none;'"
          @click="activeTab = 'operational'">
          <i class="bi bi-gear-wide-connected me-2"></i>Operasional Toko
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link fw-bold border-0 px-3 py-2.5"
          :class="activeTab === 'about' ? 'text-primary' : 'text-muted'"
          :style="activeTab === 'about' ? 'border-bottom: 3px solid #2563eb !important; color: #2563eb !important; font-weight: 600;' : 'background: transparent; border: none;'"
          @click="activeTab = 'about'">
          <i class="bi bi-info-circle-fill me-2"></i>Tentang & Cara Pakai
        </button>
      </li>
    </ul>

    <!-- Tab 1: Operasional Toko -->
    <div v-if="activeTab === 'operational'" class="row g-4 animate-fade-in">
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
              <input type="text" id="shopName" v-model="shopConfig.name" class="form-control-style"
                :disabled="state.currentUser.role.toLowerCase() === 'karyawan'" required />
            </div>

            <div class="mb-3">
              <label for="shopAddress" class="form-label-style">Alamat Toko</label>
              <textarea id="shopAddress" v-model="shopConfig.address" rows="3" class="form-control-style"
                :disabled="state.currentUser.role.toLowerCase() === 'karyawan'" required></textarea>
            </div>

            <div class="row g-3 mb-3">
              <div class="col-6">
                <label for="shopWa" class="form-label-style">No. WhatsApp Toko</label>
                <input type="text" id="shopWa" v-model="shopConfig.whatsapp" class="form-control-style"
                  :disabled="state.currentUser.role.toLowerCase() === 'karyawan'" required />
              </div>
              <div class="col-6">
                <label for="shopHours" class="form-label-style">Jam Operasional</label>
                <input type="text" id="shopHours" v-model="shopConfig.openHours" class="form-control-style"
                  :disabled="state.currentUser.role.toLowerCase() === 'karyawan'" required />
              </div>
            </div>

            <div class="mb-4">
              <label for="receiptHeader" class="form-label-style">Catatan Kaki Struk (Footer)</label>
              <input type="text" id="receiptHeader" v-model="shopConfig.receiptHeader" class="form-control-style"
                :disabled="state.currentUser.role.toLowerCase() === 'karyawan'" required />
            </div>

            <button v-if="state.currentUser.role.toLowerCase() === 'owner'" type="submit"
              class="btn btn-primary-custom px-4 py-2.5">
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
                  <input class="form-check-input" type="radio" name="paperSize" id="size58" value="58mm"
                    v-model="shopConfig.printerPaperSize" />
                  <label class="form-check-label text-dark fw-semibold small" for="size58">Thermal 58mm
                    (Standar)</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="paperSize" id="size80" value="80mm"
                    v-model="shopConfig.printerPaperSize" />
                  <label class="form-check-label text-dark fw-semibold small" for="size80">Thermal 80mm (Lebar)</label>
                </div>
              </div>
            </div>

            <div class="mb-4">
              <div class="form-check form-switch p-0 d-flex justify-content-between align-items-center">
                <div>
                  <label class="form-check-label text-dark fw-bold small" for="autoPrint">Cetak Struk Otomatis</label>
                  <span class="text-muted d-block small" style="font-size: 0.75rem;">Nota langsung tercetak setelah
                    pembayaran selesai.</span>
                </div>
                <input class="form-check-input ms-0" type="checkbox" id="autoPrint"
                  v-model="shopConfig.autoPrintReceipt" style="width: 42px; height: 21px; cursor: pointer;" />
              </div>
            </div>

            <!-- Printer Connection Status Panel -->
            <div class="border rounded-3 p-3 bg-light text-center mb-1">
              <div v-if="state.printerPaired">
                <div class="d-flex align-items-center justify-content-center text-success mb-1 small fw-bold">
                  <i class="bi bi-check-circle-fill me-1.5 fs-5"></i>
                  <span>Printer Thermal Terhubung</span>
                </div>
                <span class="text-muted d-block small mb-3" style="font-size: 0.72rem;">Model: {{
                  state.printerPairedName }} (Online)</span>
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

          <!-- Manajemen Database (Only Owner can manage) -->
          <div v-if="state.currentUser.role.toLowerCase() === 'owner'" class="card-content-box shadow-sm">
            <div class="box-header border-bottom pb-2 mb-4">
              <h2 class="box-title text-dark">Manajemen Database</h2>
              <p class="box-subtitle">Cadangkan, pulihkan, atau reset total database sistem kasir Anda.</p>
            </div>

            <div class="d-flex flex-column gap-3">
              <!-- Backup -->
              <div>
                <span class="text-muted small d-block mb-1.5">Cadangkan semua data (barang, rak, transaksi, pelanggan)
                  ke file backup.</span>
                <button @click="backupDatabase" :disabled="isBackingUp || isRestoring || isResetting"
                  class="btn btn-sm btn-primary-custom w-100 py-2">
                  <span v-if="isBackingUp" class="spinner-border spinner-border-sm me-1.5" role="status"></span>
                  <i v-else class="bi bi-download me-1.5"></i>
                  {{ isBackingUp ? 'Mencadangkan...' : 'Cadangkan Database (.sqlite)' }}
                </button>
              </div>

              <!-- Restore -->
              <div>
                <span class="text-muted small d-block mb-1.5">Pulihkan seluruh data dari file backup yang telah
                  tersimpan sebelumnya.</span>
                <input type="file" ref="fileInput" @change="handleDatabaseRestore" accept=".sqlite,.db"
                  style="display: none;" />
                <button @click="triggerRestoreFile" :disabled="isBackingUp || isRestoring || isResetting"
                  class="btn btn-sm btn-outline-primary-custom w-100 py-2">
                  <span v-if="isRestoring" class="spinner-border spinner-border-sm me-1.5" role="status"></span>
                  <i v-else class="bi bi-upload me-1.5"></i>
                  {{ isRestoring ? 'Memulihkan...' : 'Pulihkan Database (Restore)' }}
                </button>
              </div>

              <!-- Reset / Delete -->
              <div class="border-top pt-3 border-danger border-opacity-10">
                <span class="text-danger small d-block mb-1.5 fw-semibold"><i
                    class="bi bi-exclamation-triangle-fill me-1"></i>Zona Bahaya: Menghapus seluruh transaksi, rak, dan
                  barang kustom ke kondisi pabrik.</span>
                <button @click="resetDatabase" :disabled="isBackingUp || isRestoring || isResetting"
                  class="btn btn-sm btn-danger w-100 py-2.5 fw-semibold border-0" style="background-color: #ef4444;">
                  <span v-if="isResetting" class="spinner-border spinner-border-sm me-1.5" role="status"></span>
                  <i v-else class="bi bi-trash3-fill me-1.5"></i>
                  {{ isResetting ? 'Mereset Database...' : 'Hapus & Reset Database' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Tentang & Cara Pakai -->
    <div v-else-if="activeTab === 'about'" class="card-content-box shadow-sm animate-fade-in">
      <div class="border-bottom pb-3 mb-4">
        <h2 class="box-title">Tentang Aplikasi & Panduan</h2>
        <p class="box-subtitle">Pelajari seluk-beluk fitur sistem pengelolaan toko dan langkah-langkah penggunaannya.
        </p>
      </div>

      <div class="row g-4">
        <!-- Left Sub-column: About App (40%) -->
        <div class="col-12 col-md-5 border-end border-light">
          <div class="pe-md-3">
            <h4 class="fw-bold text-dark mb-3" style="font-size: 1.1rem;">Sistem Pengelolaan Toko Ce Alin</h4>
            <div class="badge bg-primary-subtle text-primary border-0 rounded-pill px-3 py-1.5 mb-3 fw-bold"
              style="font-size: 0.75rem;">
              Versi Stabil v1.2.0
            </div>
            <p class="text-secondary small mb-3">
              Aplikasi ini adalah sistem kasir Point of Sale (POS) modern berbasis Single Page Application (SPA).
              Dirancang khusus untuk mempermudah operasional toko retail, pelacakan inventaris gudang secara visual,
              manajemen diskon yang aman, notifikasi aktivitas, WhatsApp gateway otomatis, dan analisis keuangan.
            </p>

            <h5 class="fw-bold text-dark mt-4 mb-2.5" style="font-size: 0.95rem;">Tech Stack Utama</h5>
            <ul class="list-unstyled d-flex flex-column gap-2 text-muted small">
              <li class="d-flex align-items-center">
                <i class="bi bi-check-circle-fill text-primary me-2"></i>
                <strong>Frontend:</strong>&nbsp;Vue 3 (Composition API / Setup) & Vite
              </li>
              <li class="d-flex align-items-center">
                <i class="bi bi-check-circle-fill text-primary me-2"></i>
                <strong>Backend:</strong>&nbsp;Laravel 11 REST API
              </li>
              <li class="d-flex align-items-center">
                <i class="bi bi-check-circle-fill text-primary me-2"></i>
                <strong>Database:</strong>&nbsp;SQLite Database Engine
              </li>
              <li class="d-flex align-items-center">
                <i class="bi bi-check-circle-fill text-primary me-2"></i>
                <strong>Integrasi WA:</strong>&nbsp;NodeJS + Baileys Library
              </li>
              <li class="d-flex align-items-center">
                <i class="bi bi-check-circle-fill text-primary me-2"></i>
                <strong>Asisten Pintar AI:</strong>&nbsp;Google Gemini AI Integration
              </li>
              <li class="d-flex align-items-center">
                <i class="bi bi-check-circle-fill text-primary me-2"></i>
                <strong>Pembayaran:</strong>&nbsp;Simulasi QRIS Midtrans Sandbox
              </li>
            </ul>
          </div>
        </div>

        <!-- Right Sub-column: How to Use Accordion (60%) -->
        <div class="col-12 col-md-7">
          <div class="ps-md-2">
            <h4 class="fw-bold text-dark mb-3.5" style="font-size: 1.1rem;">Panduan Operasional Sistem (Cara Pakai)</h4>

            <div class="d-flex flex-column gap-3">
              <!-- Item 1 -->
              <div class="p-3 border rounded-3 bg-light bg-opacity-50">
                <div class="d-flex gap-2 mb-2">
                  <span class="avatar-circle-sm bg-primary text-white fw-bold">1</span>
                  <div>
                    <h5 class="fw-bold text-dark mb-0.5" style="font-size: 0.95rem;">Kelola Racks & Barang</h5>
                    <span class="text-muted small" style="font-size: 0.72rem;">Menu: Daftar Rak, Data Barang & Stok
                      Barang</span>
                  </div>
                </div>
                <p class="text-secondary small mb-0 ms-4.5">
                  Daftarkan area rak fisik di menu <strong>Daftar Rak</strong> dengan warna custom. Masuk ke
                   <strong>Data Barang</strong> untuk mendaftarkan barang baru. Untuk barang masuk, gunakan tombol restok
                  di menu <strong>Stok Barang</strong> untuk memperbarui jumlah persediaan.
                </p>
              </div>

              <!-- Item 2 -->
              <div class="p-3 border rounded-3 bg-light bg-opacity-50">
                <div class="d-flex gap-2 mb-2">
                  <span class="avatar-circle-sm bg-primary text-white fw-bold">2</span>
                  <div>
                    <h5 class="fw-bold text-dark mb-0.5" style="font-size: 0.95rem;">Transaksi Kasir & QRIS</h5>
                    <span class="text-muted small" style="font-size: 0.72rem;">Menu: Kasir</span>
                  </div>
                </div>
                <p class="text-secondary small mb-0 ms-4.5">
                  Klik item untuk menambahkannya ke keranjang belanja. Pilih pelanggan (vip/reguler) jika terdaftar.
                  Pilih pembayaran <strong>Tunai</strong> atau <strong>QRIS</strong>. QRIS akan memicu kode QR dinamis.
                  Setelah pembayaran selesai, struk belanja akan dicetak secara otomatis.
                </p>
              </div>

              <!-- Item 3 -->
              <div class="p-3 border rounded-3 bg-light bg-opacity-50">
                <div class="d-flex gap-2 mb-2">
                  <span class="avatar-circle-sm bg-primary text-white fw-bold">3</span>
                  <div>
                    <h5 class="fw-bold text-dark mb-0.5" style="font-size: 0.95rem;">Broadcasting WhatsApp</h5>
                    <span class="text-muted small" style="font-size: 0.72rem;">Menu: Broadcast WA</span>
                  </div>
                </div>
                <p class="text-secondary small mb-0 ms-4.5">
                  Masuk ke menu <strong>Broadcast WA</strong>. Scan kode QR untuk menghubungkan nomor WhatsApp toko ke
                  Whatsapp Gateway Server. Pilih template pesan (toko buka, promo diskon, atau info restok), pilih nomor
                  tujuan penerima broadcast, lalu klik kirim.
                </p>
              </div>

              <!-- Item 4 -->
              <div class="p-3 border rounded-3 bg-light bg-opacity-50">
                <div class="d-flex gap-2 mb-2">
                  <span class="avatar-circle-sm bg-primary text-white fw-bold">4</span>
                  <div>
                    <h5 class="fw-bold text-dark mb-0.5" style="font-size: 0.95rem;">Laporan & Manajemen Pengguna</h5>
                    <span class="text-muted small" style="font-size: 0.72rem;">Menu: Laporan Transaksi & Akun (Khusus
                      Owner)</span>
                  </div>
                </div>
                <p class="text-secondary small mb-0 ms-4.5">
                  Akses <strong>Laporan Transaksi</strong> untuk meninjau omset/keuntungan bersih. Gunakan filter **Pilih Bulan** kalender visual untuk menyaring data. Anda juga dapat mencetak PDF **Laporan Bulanan** atau **Laporan Harian** (yang menyaring hari ini secara dinamis). Owner dapat mendaftarkan akun kasir baru di menu **Akun**.
                </p>
              </div>

              <!-- Item 5 -->
              <div class="p-3 border rounded-3 bg-light bg-opacity-50">
                <div class="d-flex gap-2 mb-2">
                  <span class="avatar-circle-sm bg-primary text-white fw-bold">5</span>
                  <div>
                    <h5 class="fw-bold text-dark mb-0.5" style="font-size: 0.95rem;">Jadwal & Presensi Karyawan</h5>
                    <span class="text-muted small" style="font-size: 0.72rem;">Menu: Jadwal & Presensi</span>
                  </div>
                </div>
                <p class="text-secondary small mb-0 ms-4.5">
                  Staf karyawan melakukan **Presensi Harian** dengan verifikasi foto selfie real-time via webcam di tab Presensi. Owner dapat mengelola jadwal shift mingguan staf (Senin-Minggu) dan memantau log masuk foto, on-time rate, dan rincian kehadiran bulanan di menu ini.
                </p>
              </div>

              <!-- Item 6 -->
              <div class="p-3 border rounded-3 bg-light bg-opacity-50">
                <div class="d-flex gap-2 mb-2">
                  <span class="avatar-circle-sm bg-primary text-white fw-bold">6</span>
                  <div>
                    <h5 class="fw-bold text-dark mb-0.5" style="font-size: 0.95rem;">Asisten Pintar AI Gemini</h5>
                    <span class="text-muted small" style="font-size: 0.72rem;">Menu: Header Kanan (Gemini Chat Icon)</span>
                  </div>
                </div>
                <p class="text-secondary small mb-0 ms-4.5">
                  Klik ikon chat di sebelah kanan header atas untuk membuka asisten **Google Gemini AI**. Asisten AI siap membantu Anda menjawab pertanyaan POS, menganalisis stok barang, membuat draf promosi, atau memandu kendala operasional toko secara real-time.
                </p>
              </div>
            </div>
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
                <div v-for="printer in printerList" :key="printer" @click="selectedPrinter = printer"
                  class="d-flex align-items-center justify-content-between p-3 border rounded-3 text-start style-clickable-item"
                  :class="selectedPrinter === printer ? 'border-primary bg-light-primary-mini' : 'bg-white'"
                  style="cursor: pointer;">
                  <div class="d-flex align-items-center">
                    <i class="bi bi-printer-fill fs-5 me-2.5"
                      :class="selectedPrinter === printer ? 'text-primary' : 'text-muted'"></i>
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

    <!-- Reset Database Confirmation Modal -->
    <transition name="modal">
      <div v-if="showResetModal" class="modal-backdrop-custom">
        <div class="modal-card-custom animate-fade-in" style="max-width: 500px;">
          <div class="modal-header-custom border-bottom">
            <h3 class="modal-title-custom text-danger">
              <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>Reset Database
            </h3>
            <button @click="showResetModal = false" class="btn-close-custom">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="modal-body-custom py-4">
            <p class="text-dark small mb-3">
              Silakan pilih metode reset database yang Anda inginkan. Seluruh data transaksi, pelanggan, dan riwayat
              broadcast akan dihapus secara permanen.
            </p>

            <div class="d-flex flex-column gap-3">
              <!-- Option A: Seeded -->
              <div @click="resetMode = 'seeded'"
                class="d-flex align-items-start gap-3 p-3 border rounded-3 text-start style-clickable-item"
                :class="resetMode === 'seeded' ? 'border-primary bg-light-primary-mini' : 'bg-white'"
                style="cursor: pointer;">
                <i class="bi bi-database-fill-gear fs-4 mt-1"
                  :class="resetMode === 'seeded' ? 'text-primary' : 'text-muted'"></i>
                <div class="flex-1">
                  <h6 class="small fw-bold text-dark mb-1">Reset & Pakai Data Contoh (Direkomendasikan)</h6>
                  <p class="text-muted mb-0" style="font-size: 0.75rem;">
                    Mengisi database dengan data produk bawaan dan rak contoh. Anda harus mendaftarkan akun Owner baru
                    saat masuk.
                  </p>
                </div>
                <i v-if="resetMode === 'seeded'" class="bi bi-check-circle-fill text-primary align-self-center"></i>
              </div>

              <!-- Option B: Clean -->
              <div @click="resetMode = 'clean'"
                class="d-flex align-items-start gap-3 p-3 border rounded-3 text-start style-clickable-item"
                :class="resetMode === 'clean' ? 'border-danger bg-light-danger-mini' : 'bg-white'"
                style="cursor: pointer;">
                <i class="bi bi-database-fill-x fs-4 mt-1"
                  :class="resetMode === 'clean' ? 'text-danger' : 'text-muted'"></i>
                <div class="flex-1">
                  <h6 class="small fw-bold text-dark mb-1">Kosongkan Semua (Mulai dari Nol)</h6>
                  <p class="text-muted mb-0" style="font-size: 0.75rem;">
                    Menghapus seluruh isi database (tanpa data contoh). Anda memulai toko dari nol dan mendaftarkan akun
                    Owner baru.
                  </p>
                </div>
                <i v-if="resetMode === 'clean'" class="bi bi-check-circle-fill text-danger align-self-center"></i>
              </div>
            </div>

            <!-- Warning Alert inside modal -->
            <div class="alert alert-warning py-2 px-3 mt-3 rounded-3 small" role="alert"
              style="font-size: 0.75rem; border: none; background-color: #fffbeb; color: #b45309;">
              <i class="bi bi-exclamation-circle-fill me-2"></i>
              Tindakan ini tidak dapat dibatalkan. Pastikan Anda telah mengunduh backup database jika diperlukan.
            </div>
          </div>

          <div class="modal-footer-custom border-top">
            <button @click="showResetModal = false" class="btn-cancel">Batal</button>
            <button @click="confirmDatabaseReset" :disabled="isResetting" class="btn-confirm bg-danger border-0">
              <span v-if="isResetting" class="spinner-border spinner-border-sm me-1.5" role="status"></span>
              {{ isResetting ? 'Mereset...' : 'Ya, Reset Database' }}
            </button>
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

.bg-light-danger-mini {
  background-color: #fff5f5;
}

.avatar-circle-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  flex-shrink: 0;
}

.ms-4\.5 {
  margin-left: 2.25rem !important;
}

.bg-primary-subtle {
  background-color: rgba(37, 99, 235, 0.15) !important;
}

.text-primary {
  color: #2563eb !important;
}

@media (max-width: 991px) {
  .pengaturan-wrapper {
    height: auto;
    padding: 20px;
  }
}
</style>
