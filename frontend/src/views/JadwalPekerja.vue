<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { state, fetchSchedules, saveSchedule, deleteSchedule, fetchPresensi, submitPresensi, APP_BASE_URL } from '../store/store.js'

// Active Tab: 'jadwal' or 'presensi'
const activeTab = ref('jadwal')

// State
const isLoading = ref(false)
const actionLoading = ref(false)
const successToastMsg = ref('')
const errorToastMsg = ref('')

// Schedule Modal State
const showModal = ref(false)
const isEditMode = ref(false)
const modalTitle = ref('Tambah Jadwal Pekerja')
const selectedScheduleId = ref(null)

// Form Fields
const formUserId = ref('')
const formHari = ref('Senin')
const formShift = ref('')
const formKeterangan = ref('')

// Webcam State
const videoRef = ref(null)
const videoStream = ref(null)
const cameraError = ref('')
const isCameraLoading = ref(false)
const capturedPhotoUrl = ref('')
const videoDevices = ref([])
const selectedDeviceId = ref('')

// Image Viewer Modal
const showImageModal = ref(false)
const activeImageUrl = ref('')

// Days List
const daysList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

// Filter lists
const scheduleGrid = computed(() => {
  // We want to map each worker (user) to their Monday-Sunday schedules
  const workers = state.users.length > 0 ? state.users : []
  
  // If not owner, worker only sees themselves and others if we want, or everyone.
  // The user prompt says: "jadwal pekerja dan owner bisa edit tambah hapus jadwal semua pekerja, sedangkan untuk petugas bisa melihat jadwal jadwal aja".
  // So they can see everyone's schedule. We can construct a list of unique users from the schedule data if state.users is empty or user is Employee.
  // Let's gather all unique users from schedules if state.users is empty
  let usersToDisplay = workers.filter(u => u.role !== 'owner')
  if (usersToDisplay.length === 0) {
    const uniqueUsersMap = {}
    state.schedules.forEach(s => {
      if (s.user && s.user.role !== 'owner') {
        uniqueUsersMap[s.user.id] = s.user
      }
    })
    usersToDisplay = Object.values(uniqueUsersMap)
  }

  // Map each user to a row containing days
  return usersToDisplay.map(user => {
    const row = { user, days: {} }
    daysList.forEach(day => {
      row.days[day] = state.schedules.find(s => s.user_id === user.id && s.hari === day) || null
    })
    return row
  })
})

const currentUserRole = computed(() => state.currentUser?.role?.toLowerCase() || 'karyawan')
const isOwner = computed(() => currentUserRole.value === 'owner')

// Retrieve all connected camera input devices
const getCameraDevices = async () => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return
    const devices = await navigator.mediaDevices.enumerateDevices()
    videoDevices.value = devices.filter(d => d.kind === 'videoinput')
    
    // Default to first device if not selected
    if (videoDevices.value.length > 0 && !selectedDeviceId.value) {
      selectedDeviceId.value = videoDevices.value[0].deviceId
    }
  } catch (err) {
    console.error('Error listing camera devices:', err)
  }
}

// Watch device ID to restart camera stream automatically
watch(selectedDeviceId, (newId, oldId) => {
  if (newId && oldId && activeTab.value === 'presensi' && !isOwner.value && !state.presenses.today) {
    startCamera()
  }
})

// Trigger webcam streaming
const startCamera = async () => {
  cameraError.value = ''
  isCameraLoading.value = true
  
  // Ensure camera is stopped before restarting
  stopCamera()

  // 1. Secure Context check
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    cameraError.value = 'Browser memblokir kamera karena koneksi tidak aman (HTTPS/localhost). Harap buka aplikasi menggunakan alamat http://localhost:5173 atau menggunakan protokol HTTPS.'
    isCameraLoading.value = false
    return
  }

  // 2. Fetch the devices list first
  await getCameraDevices()

  // 3. Setup constraints based on selected device ID
  let constraints = {
    audio: false
  }

  if (selectedDeviceId.value) {
    constraints.video = {
      deviceId: { exact: selectedDeviceId.value },
      width: { ideal: 640 },
      height: { ideal: 480 }
    }
  } else {
    constraints.video = {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: 'user'
    }
  }

  let stream = null
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints)
  } catch (err) {
    console.warn('Gagal memuat kamera dengan constraints ideal/spesifik, mencoba fallback...', err)
    
    // Fallback: simple video with device ID if available
    try {
      const fallbackConstraints = {
        audio: false,
        video: selectedDeviceId.value ? { deviceId: { exact: selectedDeviceId.value } } : true
      }
      stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints)
    } catch (fallbackErr) {
      console.error('Semua upaya memuat kamera gagal:', fallbackErr)
      
      const errName = fallbackErr.name || ''
      const errMsg = fallbackErr.message || ''
      
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        cameraError.value = 'Akses kamera ditolak. Harap periksa pengaturan izin kamera di sebelah baris alamat browser Anda (ikon gembok/kamera).'
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        cameraError.value = 'Webcam tidak terdeteksi. Pastikan kamera terhubung ke komputer Anda dan coba lagi.'
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        cameraError.value = 'Kamera sedang digunakan oleh aplikasi lain atau tidak siap. Pilih kamera lain dari menu di bawah atau tutup aplikasi video conference Anda.'
      } else if (errName === 'SecurityError') {
        cameraError.value = 'Akses kamera diblokir karena protokol tidak aman (harus HTTPS atau localhost).'
      } else {
        cameraError.value = `Kamera tidak dapat diakses (${errName}: ${errMsg}). Harap periksa koneksi webcam Anda.`
      }
      
      isCameraLoading.value = false
      return
    }
  }

  // 4. Attach stream to video element
  try {
    videoStream.value = stream
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()
    }
    
    // Re-fetch devices now that permission is granted to load labels/names
    await getCameraDevices()
  } catch (playErr) {
    console.error('Gagal memulai playback video:', playErr)
    cameraError.value = 'Gagal menampilkan video dari kamera.'
  } finally {
    isCameraLoading.value = false
  }
}

// Stop webcam streaming
const stopCamera = () => {
  if (videoStream.value) {
    videoStream.value.getTracks().forEach(track => track.stop())
    videoStream.value = null
  }
}

// Watch tab change to start/stop camera
watch(activeTab, (newTab) => {
  if (newTab === 'presensi' && !isOwner.value && !state.presenses.today) {
    // Wait a brief tick for the video element to mount
    setTimeout(() => {
      startCamera()
    }, 300)
  } else {
    stopCamera()
  }
})

// Lifecycle
onMounted(() => {
  fetchSchedules()
  fetchPresensi()
})

onUnmounted(() => {
  stopCamera()
})

// Alerts
const triggerSuccess = (msg) => {
  successToastMsg.value = msg
  setTimeout(() => successToastMsg.value = '', 4000)
}

const triggerError = (msg) => {
  errorToastMsg.value = msg
  setTimeout(() => errorToastMsg.value = '', 4000)
}

// Schedule Actions
const openAddModal = (userId = '', day = '') => {
  isEditMode.value = false
  modalTitle.value = 'Tambah Jadwal Kerja'
  formUserId.value = userId
  formHari.value = day || 'Senin'
  formShift.value = ''
  formKeterangan.value = ''
  showModal.value = true
}

const openEditModal = (schedule) => {
  isEditMode.value = true
  modalTitle.value = 'Ubah Jadwal Kerja'
  selectedScheduleId.value = schedule.id
  formUserId.value = schedule.user_id
  formHari.value = schedule.hari
  formShift.value = schedule.shift || ''
  formKeterangan.value = schedule.keterangan || ''
  showModal.value = true
}

const handleSaveSchedule = async () => {
  if (!formUserId.value || !formHari.value) {
    triggerError('Nama pekerja dan hari harus ditentukan!')
    return
  }

  actionLoading.value = true
  try {
    const res = await saveSchedule(formUserId.value, formHari.value, formShift.value, formKeterangan.value)
    if (res.success) {
      triggerSuccess(isEditMode.value ? 'Jadwal berhasil diperbarui!' : 'Jadwal baru berhasil disimpan!')
      showModal.value = false
    } else {
      triggerError(res.message)
    }
  } catch (e) {
    triggerError('Gagal menyimpan jadwal.')
  } finally {
    actionLoading.value = false
  }
}

const handleDeleteSchedule = async (id) => {
  if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini? Pekerja akan di-set Libur.')) return

  actionLoading.value = true
  try {
    const res = await deleteSchedule(id)
    if (res.success) {
      triggerSuccess('Jadwal berhasil dihapus!')
    } else {
      triggerError(res.message)
    }
  } catch (e) {
    triggerError('Gagal menghapus jadwal.')
  } finally {
    actionLoading.value = false
  }
}

const applyPresetShift = (preset) => {
  if (preset === 'pagi') formShift.value = '08:00 - 15:00'
  else if (preset === 'sore') formShift.value = '15:00 - 22:00'
  else if (preset === 'full') formShift.value = '08:00 - 22:00'
}

// Webcam Capture & Submit
const handleTakeAttendance = async () => {
  if (!videoRef.value || !videoStream.value) {
    triggerError('Kamera belum siap!')
    return
  }

  actionLoading.value = true
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext('2d')
    
    // Draw the current video frame onto the canvas
    ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height)
    
    // Extract base64 URL
    const dataUrl = canvas.toDataURL('image/jpeg')
    
    // Stop camera stream immediately
    stopCamera()

    // Send photo to backend
    const res = await submitPresensi(dataUrl)
    if (res.success) {
      triggerSuccess('Presensi hari ini berhasil dicatat!')
    } else {
      triggerError(res.message)
      // Restart camera if attendance failed
      startCamera()
    }
  } catch (err) {
    console.error(err)
    triggerError('Gagal menangkap foto presensi!')
    startCamera()
  } finally {
    actionLoading.value = false
  }
}

// Helper formatting
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  return timeStr.slice(0, 5) // Return hh:mm from hh:mm:ss
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const getBackendImageUrl = (path) => {
  if (!path) return ''
  return `${APP_BASE_URL}/${path}`
}

const viewFullPhoto = (url) => {
  activeImageUrl.value = url
  showImageModal.value = true
}

const todayPresenceStatusLabel = computed(() => {
  const presence = state.presenses.today
  if (!presence) return 'Belum Presensi'
  return presence.status === 'Hadir' ? 'Hadir (Tepat Waktu)' : 'Hadir (Terlambat)'
})

// Calculate today's date in 'YYYY-MM-DD' format matching Jakarta timezone
const getTodayDateStr = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

const totalKaryawan = computed(() => {
  return state.users.filter(u => u.role !== 'owner').length
})

const todayLogs = computed(() => {
  const today = getTodayDateStr()
  if (!state.presenses.logs) return []
  return state.presenses.logs.filter(log => log.tanggal === today)
})

const hadirToday = computed(() => {
  return todayLogs.value.filter(log => log.status === 'Hadir').length
})

const terlambatToday = computed(() => {
  return todayLogs.value.filter(log => log.status === 'Terlambat').length
})

const belumAbsenToday = computed(() => {
  const total = totalKaryawan.value
  const present = todayLogs.value.length
  return Math.max(0, total - present)
})

// Circular/Doughnut Chart conic-gradient style
const circleChartStyle = computed(() => {
  const total = totalKaryawan.value || 1
  const hadirPct = (hadirToday.value / total) * 100
  const terlambatPct = (terlambatToday.value / total) * 100

  const seg1 = hadirPct
  const seg2 = hadirPct + terlambatPct

  return {
    background: `conic-gradient(
      #10b981 0% ${seg1}%, 
      #f59e0b ${seg1}% ${seg2}%, 
      #cbd5e1 ${seg2}% 100%
    )`
  }
})

const filterMonth = ref('')

// Cumulative employee reports summary
const employeeReports = computed(() => {
  const employees = state.users.filter(u => u.role !== 'owner')
  return employees.map(emp => {
    let empLogs = state.presenses.logs ? state.presenses.logs.filter(log => log.user_id === emp.id) : []
    
    // Apply month filter if selected
    if (filterMonth.value !== '') {
      const monthNum = parseInt(filterMonth.value)
      empLogs = empLogs.filter(log => {
        const parts = log.tanggal.split('-') // YYYY-MM-DD
        return parts.length >= 2 && parseInt(parts[1]) === monthNum
      })
    }

    const totalHadir = empLogs.filter(log => log.status === 'Hadir').length
    const totalTerlambat = empLogs.filter(log => log.status === 'Terlambat').length
    const totalMasuk = totalHadir + totalTerlambat
    const attendancePercentage = totalMasuk > 0 ? Math.round((totalHadir / totalMasuk) * 100) : 0
    
    return {
      user: emp,
      totalHadir,
      totalTerlambat,
      totalMasuk,
      attendancePercentage
    }
  })
})
</script>

<template>
  <div class="jadwal-wrapper">
    <!-- Toasts Alert -->
    <transition name="fade">
      <div v-if="successToastMsg" class="custom-alert alert alert-success d-flex align-items-center shadow" role="alert">
        <i class="bi bi-check-circle-fill me-2 fs-5"></i>
        <div>{{ successToastMsg }}</div>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="errorToastMsg" class="custom-alert alert alert-danger d-flex align-items-center shadow" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
        <div>{{ errorToastMsg }}</div>
      </div>
    </transition>

    <!-- Page Header -->
    <div class="content-header mb-4">
      <h1 class="page-title">Jadwal & Presensi Pekerja</h1>
      <p class="page-subtitle">Kelola jam kerja mingguan karyawan dan pantau presensi kehadiran menggunakan verifikasi selfie webcam.</p>
    </div>

    <!-- Tab Buttons -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="tab-container d-flex p-1 gap-2 rounded-4 shadow-sm">
          <button 
            @click="activeTab = 'jadwal'" 
            class="tab-btn btn flex-grow-1 py-2.5 rounded-3 d-flex align-items-center justify-content-center gap-2"
            :class="activeTab === 'jadwal' ? 'active-tab shadow-sm' : 'inactive-tab'"
          >
            <i class="bi bi-calendar-week fs-5"></i>
            <span class="fw-semibold">Jadwal Kerja Mingguan</span>
          </button>
          <button 
            @click="activeTab = 'presensi'" 
            class="tab-btn btn flex-grow-1 py-2.5 rounded-3 d-flex align-items-center justify-content-center gap-2"
            :class="activeTab === 'presensi' ? 'active-tab shadow-sm' : 'inactive-tab'"
          >
            <i class="bi bi-camera-fill fs-5"></i>
            <span class="fw-semibold">Presensi Harian Selfie</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Active Tab Panel -->
    <div class="tab-content">
      <!-- PANEL 1: JADWAL MINGGUAN -->
      <div v-if="activeTab === 'jadwal'" class="card-content-box shadow-sm animate-fade-in">
        <div class="box-header d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <h2 class="box-title">Jadwal Kerja Karyawan</h2>
            <p class="box-subtitle">Daftar shift operasional harian seluruh staf untuk Senin sampai Minggu.</p>
          </div>
          <button v-if="isOwner" @click="openAddModal('', '')" class="btn btn-primary-custom d-flex align-items-center gap-2 py-2 px-3 rounded-3 shadow-sm hover-scale">
            <i class="bi bi-plus-lg fs-6"></i>
            <span>Atur Jadwal Baru</span>
          </button>
        </div>

        <div class="table-responsive">
          <table class="table custom-table align-middle">
            <thead>
              <tr>
                <th style="min-width: 160px;">Pekerja</th>
                <th v-for="day in daysList" :key="day" class="text-center" style="min-width: 130px;">
                  {{ day }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in scheduleGrid" :key="row.user.id">
                <td>
                  <div class="d-flex align-items-center gap-2.5">
                    <div class="avatar-circle">
                      {{ row.user.name.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <div class="fw-bold text-dark">{{ row.user.name }}</div>
                      <div class="text-muted small text-capitalize">{{ row.user.role }}</div>
                    </div>
                  </div>
                </td>
                <td v-for="day in daysList" :key="day" class="text-center">
                  <!-- Case: Schedule Exists -->
                  <div v-if="row.days[day]" class="schedule-cell-active p-2 rounded-3 shadow-xs">
                    <div class="shift-time fw-bold text-primary mb-1">
                      <i class="bi bi-clock me-1 text-primary-custom"></i>
                      {{ row.days[day].shift }}
                    </div>
                    <div v-if="row.days[day].keterangan" class="shift-desc small text-secondary text-truncate mb-2" :title="row.days[day].keterangan">
                      {{ row.days[day].keterangan }}
                    </div>
                    <div v-if="isOwner" class="d-flex justify-content-center gap-1.5 mt-2 pt-1 border-top">
                      <button @click="openEditModal(row.days[day])" class="btn btn-outline-secondary btn-icon-xs rounded-2" title="Edit Shift">
                        <i class="bi bi-pencil-fill"></i>
                      </button>
                      <button @click="handleDeleteSchedule(row.days[day].id)" class="btn btn-outline-danger btn-icon-xs rounded-2" title="Hapus Shift (Libur)">
                        <i class="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  </div>
                  <!-- Case: No Schedule (Libur) -->
                  <div v-else class="schedule-cell-empty p-2 rounded-3">
                    <div class="text-muted small italic">Libur</div>
                    <button v-if="isOwner" @click="openAddModal(row.user.id, day)" class="btn btn-link-add btn-sm mt-1 py-0 px-2 rounded-2" title="Tambah Shift">
                      <i class="bi bi-plus-circle-fill text-muted"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="scheduleGrid.length === 0">
                <td colspan="8" class="text-center py-5 text-muted">
                  <i class="bi bi-people-fill d-block fs-1 mb-2 text-secondary"></i>
                  <span>Tidak ada data karyawan yang terdaftar untuk ditampilkan.</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- PANEL 2: PRESENSI SELFIE -->
      <div v-if="activeTab === 'presensi'" class="animate-fade-in">
        <!-- 1. KARYAWAN VIEW: TAKE ATTENDANCE & HISTORY -->
        <div v-if="!isOwner" class="row g-4">
          <!-- Column Camera / Status -->
          <div class="col-12 col-lg-6">
            <div class="card-content-box shadow-sm h-100 d-flex flex-column">
              <div class="box-header mb-4">
                <h2 class="box-title">Presensi Kehadiran Hari Ini</h2>
                <p class="box-subtitle">Silakan berpose menghadap kamera untuk mengambil foto presensi harian Anda.</p>
              </div>

              <!-- State A: Already present today -->
              <div v-if="state.presenses.today" class="d-flex flex-column align-items-center justify-content-center text-center py-4 flex-grow-1">
                <div class="presence-success-icon bg-success-light text-success mb-3 shadow-xs">
                  <i class="bi bi-check-lg fs-1"></i>
                </div>
                <h3 class="fw-bold text-success mb-1">Sudah Presensi</h3>
                <p class="text-muted mb-4">Absensi harian Anda telah tercatat dengan aman.</p>

                <div class="presence-info-card p-3 rounded-4 shadow-sm w-100 max-w-400 mb-4 bg-light text-start border">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Tanggal:</span>
                    <span class="fw-semibold">{{ formatDate(state.presenses.today.tanggal) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Jam Masuk:</span>
                    <span class="fw-bold text-dark">{{ formatTime(state.presenses.today.waktu_masuk) }} WIB</span>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span class="text-muted">Status Kehadiran:</span>
                    <span class="badge" :class="state.presenses.today.status === 'Hadir' ? 'bg-success' : 'bg-warning'">
                      {{ state.presenses.today.status }}
                    </span>
                  </div>
                </div>

                <!-- Captured Selfie display -->
                <div class="selfie-thumbnail-preview border rounded-4 overflow-hidden shadow-sm">
                  <img 
                    :src="getBackendImageUrl(state.presenses.today.foto_path)" 
                    alt="Selfie Presensi" 
                    class="img-fluid"
                    @click="viewFullPhoto(getBackendImageUrl(state.presenses.today.foto_path))"
                    style="cursor: zoom-in; max-height: 200px;"
                  />
                  <div class="bg-dark text-white p-2.5 text-center small">
                    <i class="bi bi-zoom-in me-1"></i> Klik untuk memperbesar
                  </div>
                </div>
              </div>

              <!-- State B: Camera active taking presence -->
              <div v-else class="flex-grow-1 d-flex flex-column align-items-center">
                <!-- Video Camera Frame -->
                <div class="webcam-frame border rounded-4 overflow-hidden bg-dark position-relative shadow-sm w-100 max-w-500 mb-4">
                  <video 
                    ref="videoRef" 
                    class="w-100 h-100 object-fit-cover" 
                    autoplay 
                    playsinline
                    style="min-height: 300px; transform: scaleX(-1);"
                  ></video>
                  
                  <!-- Error overlay -->
                  <div v-if="cameraError" class="position-absolute top-0 start-0 w-100 h-100 bg-dark-semi d-flex flex-column align-items-center justify-content-center p-3 text-center text-white">
                    <i class="bi bi-camera-video-off fs-1 text-danger mb-3"></i>
                    <p class="mb-3 fs-6">{{ cameraError }}</p>
                    <button @click="startCamera" class="btn btn-sm btn-primary-custom rounded-3">
                      <i class="bi bi-arrow-clockwise me-1"></i> Coba Lagi
                    </button>
                  </div>

                  <!-- Loading indicator -->
                  <div v-if="isCameraLoading" class="position-absolute top-0 start-0 w-100 h-100 bg-dark-semi d-flex align-items-center justify-content-center text-white">
                    <div class="spinner-border text-primary-custom" role="status">
                      <span class="visually-hidden">Memuat kamera...</span>
                    </div>
                  </div>
                </div>

                <!-- Camera Selector Dropdown -->
                <div v-if="videoDevices.length > 0" class="w-100 max-w-500 mb-4 text-start">
                  <label class="form-label text-muted small d-flex align-items-center gap-1.5 mb-1.5 fw-semibold">
                    <i class="bi bi-camera-video-fill text-primary"></i>
                    <span>Sumber Kamera:</span>
                  </label>
                  <select v-model="selectedDeviceId" class="form-select rounded-3 border" style="font-size: 0.9rem;">
                    <option v-for="device in videoDevices" :key="device.deviceId" :value="device.deviceId">
                      {{ device.label || `Kamera ${videoDevices.indexOf(device) + 1}` }}
                    </option>
                  </select>
                </div>

                <!-- Actions -->
                <div class="w-100 d-flex flex-column align-items-center gap-2 mb-3">
                  <button 
                    @click="handleTakeAttendance" 
                    :disabled="actionLoading || cameraError || isCameraLoading"
                    class="btn btn-primary-custom btn-lg w-100 max-w-400 py-3 rounded-4 shadow-sm hover-scale d-flex align-items-center justify-content-center gap-2"
                  >
                    <span v-if="actionLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <i v-else class="bi bi-camera-fill fs-5"></i>
                    <span class="fw-bold">Ambil Foto & Presensi Masuk</span>
                  </button>
                  <button 
                    v-if="!cameraError && !isCameraLoading"
                    @click="startCamera" 
                    class="btn btn-link text-secondary text-decoration-none btn-sm"
                  >
                    <i class="bi bi-arrow-clockwise me-1"></i> Atur Ulang Kamera
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Column History -->
          <div class="col-12 col-lg-6">
            <div class="card-content-box shadow-sm h-100">
              <div class="box-header mb-4">
                <h2 class="box-title">Riwayat Absensi 30 Hari Terakhir</h2>
                <p class="box-subtitle">Log riwayat kehadiran masuk Anda pada sistem.</p>
              </div>

              <div class="table-responsive" style="max-height: 480px; overflow-y: auto;">
                <table class="table custom-table align-middle">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Jam Masuk</th>
                      <th>Status</th>
                      <th class="text-center">Selfie</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="log in state.presenses.history" :key="log.id">
                      <td class="fw-semibold">{{ formatDate(log.tanggal) }}</td>
                      <td>{{ formatTime(log.waktu_masuk) }} WIB</td>
                      <td>
                        <span class="badge" :class="log.status === 'Hadir' ? 'bg-success' : 'bg-warning'">
                          {{ log.status }}
                        </span>
                      </td>
                      <td class="text-center">
                        <img 
                          :src="getBackendImageUrl(log.foto_path)" 
                          alt="Photo" 
                          class="rounded-3 border cursor-pointer hover-opacity"
                          @click="viewFullPhoto(getBackendImageUrl(log.foto_path))"
                          style="width: 48px; height: 36px; object-fit: cover;"
                        />
                      </td>
                    </tr>
                    <tr v-if="!state.presenses.history || state.presenses.history.length === 0">
                      <td colspan="4" class="text-center py-5 text-muted">
                        <i class="bi bi-clock-history d-block fs-1 mb-2 text-secondary"></i>
                        <span>Belum ada riwayat presensi masuk.</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. OWNER VIEW: ATTENDANCE TRACKER LOGS & REPORTS -->
        <div v-else class="d-flex flex-column gap-4 animate-fade-in">
          
          <!-- Top Section: Today's Summary & Circle Chart -->
          <div class="row g-4">
            <!-- Today's Attendance Statistics & Chart -->
            <div class="col-12 col-md-5">
              <div class="card-content-box shadow-sm h-100 d-flex flex-column align-items-center text-center">
                <div class="box-header mb-4 w-100 text-start">
                  <h2 class="box-title">Kehadiran Hari Ini</h2>
                  <p class="box-subtitle">Grafik persentase masuk kerja staf hari ini.</p>
                </div>
                
                <!-- Conic Gradient Circular Chart -->
                <div class="position-relative d-flex align-items-center justify-content-center mb-4" style="width: 160px; height: 160px;">
                  <div class="rounded-circle" :style="circleChartStyle" style="width: 100%; height: 100%; transition: background 0.3s ease;"></div>
                  <div class="rounded-circle bg-white position-absolute d-flex flex-column align-items-center justify-content-center shadow-sm" style="width: 110px; height: 110px;">
                    <span class="fs-4 fw-bold text-dark">{{ todayLogs.length }} / {{ totalKaryawan }}</span>
                    <span class="text-muted small" style="font-size: 0.75rem;">Hadir</span>
                  </div>
                </div>

                <!-- Legend -->
                <div class="w-100 d-flex justify-content-center gap-3 flex-wrap small">
                  <div class="d-flex align-items-center gap-1.5">
                    <span class="d-inline-block rounded-circle" style="width: 10px; height: 10px; background-color: #10b981;"></span>
                    <span class="text-secondary fw-semibold">Tepat Waktu: {{ hadirToday }}</span>
                  </div>
                  <div class="d-flex align-items-center gap-1.5">
                    <span class="d-inline-block rounded-circle" style="width: 10px; height: 10px; background-color: #f59e0b;"></span>
                    <span class="text-secondary fw-semibold">Terlambat: {{ terlambatToday }}</span>
                  </div>
                  <div class="d-flex align-items-center gap-1.5">
                    <span class="d-inline-block rounded-circle" style="width: 10px; height: 10px; background-color: #cbd5e1;"></span>
                    <span class="text-secondary fw-semibold">Belum Absen: {{ belumAbsenToday }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Cumulative Summary stats of all workers -->
            <div class="col-12 col-md-7">
              <div class="card-content-box shadow-sm h-100">
                <div class="box-header mb-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div>
                    <h2 class="box-title">Laporan Akumulasi Presensi Karyawan</h2>
                    <p class="box-subtitle">Total akumulasi log kehadiran masuk kerja masing-masing karyawan.</p>
                  </div>
                  <div>
                    <select v-model="filterMonth" class="form-select form-select-sm rounded-3 border py-1.5" style="width: auto; min-width: 140px; font-size: 0.8rem;">
                      <option value="">Semua Bulan</option>
                      <option value="1">Januari</option>
                      <option value="2">Februari</option>
                      <option value="3">Maret</option>
                      <option value="4">April</option>
                      <option value="5">Mei</option>
                      <option value="6">Juni</option>
                      <option value="7">Juli</option>
                      <option value="8">Agustus</option>
                      <option value="9">September</option>
                      <option value="10">Oktober</option>
                      <option value="11">November</option>
                      <option value="12">Desember</option>
                    </select>
                  </div>
                </div>
                
                <div class="table-responsive" style="max-height: 220px; overflow-y: auto;">
                  <table class="table custom-table-mini align-middle mb-0" style="font-size: 0.85rem;">
                    <thead>
                      <tr>
                        <th>Karyawan</th>
                        <th class="text-center">Tepat Waktu</th>
                        <th class="text-center">Terlambat</th>
                        <th class="text-center">Total Masuk</th>
                        <th class="text-center">Rasio On-Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="rep in employeeReports" :key="rep.user.id">
                        <td>
                          <div class="fw-bold text-dark text-truncate" style="max-width: 140px;">{{ rep.user.name }}</div>
                        </td>
                        <td class="text-center text-success fw-bold">{{ rep.totalHadir }}</td>
                        <td class="text-center text-warning fw-bold">{{ rep.totalTerlambat }}</td>
                        <td class="text-center fw-bold text-dark">{{ rep.totalMasuk }} kali</td>
                        <td class="text-center">
                          <span class="badge" :class="rep.attendancePercentage >= 80 ? 'bg-success' : (rep.attendancePercentage >= 55 ? 'bg-warning' : 'bg-danger')">
                            {{ rep.attendancePercentage }}%
                          </span>
                        </td>
                      </tr>
                      <tr v-if="employeeReports.length === 0">
                        <td colspan="5" class="text-center text-muted py-3">Tidak ada data karyawan.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Section: Daily Selfie logs -->
          <div class="card-content-box shadow-sm">
            <div class="box-header mb-4">
              <h2 class="box-title">Log Presensi Semua Karyawan</h2>
              <p class="box-subtitle">Pemantauan data kehadiran masuk pekerja harian, lengkap dengan verifikasi foto wajah.</p>
            </div>

            <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
              <table class="table custom-table align-middle">
                <thead>
                  <tr>
                    <th style="width: 60px;">No</th>
                    <th>Karyawan</th>
                    <th>Tanggal Kerja</th>
                    <th>Waktu Masuk</th>
                    <th>Status Kehadiran</th>
                    <th class="text-center">Foto Selfie</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(log, idx) in state.presenses.logs" :key="log.id">
                    <td>{{ idx + 1 }}</td>
                    <td>
                      <div class="d-flex align-items-center gap-2.5">
                        <div class="avatar-circle">
                          {{ log.user ? log.user.name.charAt(0).toUpperCase() : '?' }}
                        </div>
                        <div>
                          <div class="fw-bold text-dark">{{ log.user ? log.user.name : 'Unknown' }}</div>
                          <div class="text-muted small">@{{ log.user ? log.user.username : 'karyawan' }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="fw-semibold">{{ formatDate(log.tanggal) }}</td>
                    <td class="fw-bold text-dark">{{ formatTime(log.waktu_masuk) }} WIB</td>
                    <td>
                      <span class="badge" :class="log.status === 'Hadir' ? 'bg-success' : 'bg-warning'">
                        {{ log.status }}
                      </span>
                    </td>
                    <td class="text-center">
                      <div class="d-inline-block position-relative">
                        <img 
                          :src="getBackendImageUrl(log.foto_path)" 
                          alt="Photo Selfie" 
                          class="rounded-3 border cursor-pointer hover-scale shadow-xs"
                          @click="viewFullPhoto(getBackendImageUrl(log.foto_path))"
                          style="width: 60px; height: 45px; object-fit: cover; transition: all 0.2s;"
                        />
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!state.presenses.logs || state.presenses.logs.length === 0">
                    <td colspan="6" class="text-center py-5 text-muted">
                      <i class="bi bi-camera-video-off-fill d-block fs-1 mb-2 text-secondary"></i>
                      <span>Belum ada data presensi yang masuk hari ini.</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- MODAL 1: ADD/EDIT SCHEDULE -->
    <div v-if="showModal" class="modal-backdrop-custom d-flex align-items-center justify-content-center animate-fade-in">
      <div class="custom-modal-box shadow-lg rounded-4 bg-white w-100 max-w-500 overflow-hidden">
        <!-- Header -->
        <div class="modal-header-custom p-4 d-flex justify-content-between align-items-center border-bottom text-white">
          <h5 class="fw-bold mb-0 text-white">{{ modalTitle }}</h5>
          <button @click="showModal = false" class="btn btn-close btn-close-white" aria-label="Close"></button>
        </div>

        <!-- Body -->
        <div class="p-4">
          <form @submit.prevent="handleSaveSchedule">
            <!-- Pekerja Dropdown -->
            <div class="mb-3">
              <label class="form-label fw-bold text-secondary">Pekerja / Karyawan <span class="text-danger">*</span></label>
              <select v-model="formUserId" class="form-select rounded-3 p-2.5 border" required :disabled="isEditMode">
                <option value="" disabled>-- Pilih Karyawan --</option>
                <option v-for="user in state.users.filter(u => u.role !== 'owner')" :key="user.id" :value="user.id">
                  {{ user.name }} ({{ user.username }})
                </option>
              </select>
            </div>

            <!-- Hari Dropdown -->
            <div class="mb-3">
              <label class="form-label fw-bold text-secondary">Hari Kerja <span class="text-danger">*</span></label>
              <select v-model="formHari" class="form-select rounded-3 p-2.5 border" required :disabled="isEditMode">
                <option v-for="day in daysList" :key="day" :value="day">{{ day }}</option>
              </select>
            </div>

            <!-- Shift Input -->
            <div class="mb-3">
              <label class="form-label fw-bold text-secondary">Jam Shift / Waktu Kerja</label>
              <input 
                v-model="formShift" 
                type="text" 
                placeholder="Contoh: 08:00 - 15:00" 
                class="form-control rounded-3 p-2.5 border"
              />
              <div class="d-flex gap-1.5 mt-2 flex-wrap">
                <button type="button" @click="applyPresetShift('pagi')" class="btn btn-xs btn-outline-secondary rounded-2">Pagi (08-15)</button>
                <button type="button" @click="applyPresetShift('sore')" class="btn btn-xs btn-outline-secondary rounded-2">Sore (15-22)</button>
                <button type="button" @click="applyPresetShift('full')" class="btn btn-xs btn-outline-secondary rounded-2">Full Day (08-22)</button>
              </div>
            </div>

            <!-- Keterangan Input -->
            <div class="mb-4">
              <label class="form-label fw-bold text-secondary">Keterangan Tambahan</label>
              <input 
                v-model="formKeterangan" 
                type="text" 
                placeholder="Contoh: Kasir Shift 1, Istirahat 1 Jam" 
                class="form-control rounded-3 p-2.5 border"
              />
            </div>

            <!-- Form Actions -->
            <div class="d-flex justify-content-end gap-2 pt-2 border-top">
              <button type="button" @click="showModal = false" class="btn btn-light py-2 px-4 rounded-3 fw-semibold">
                Batal
              </button>
              <button type="submit" :disabled="actionLoading" class="btn btn-primary-custom py-2 px-4 rounded-3 fw-semibold d-flex align-items-center gap-2">
                <span v-if="actionLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Simpan Jadwal</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL 2: FULL PHOTO VIEWER -->
    <div v-if="showImageModal" class="modal-backdrop-custom d-flex align-items-center justify-content-center animate-fade-in" @click="showImageModal = false">
      <div class="position-relative bg-dark rounded-4 p-2 overflow-hidden max-w-700 w-100 mx-3 shadow-2xl" @click.stop>
        <img :src="activeImageUrl" alt="Full Selfie Log" class="img-fluid rounded-3 w-100" style="max-height: 80vh; object-fit: contain;" />
        <button @click="showImageModal = false" class="btn btn-close-custom position-absolute top-3 right-3 shadow-md" aria-label="Close">
          <i class="bi bi-x-lg text-white fs-5"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.jadwal-wrapper {
  padding: 30px;
  /* Required Workaround for zoom height scale */
  height: calc((100vh / var(--zoom-scale)) - 70px) !important;
  overflow-y: auto;
}

/* Tab Container Styles */
.tab-container {
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.tab-btn {
  border: none;
  background: transparent;
  transition: all 0.25s ease;
  color: #64748b;
}

.tab-btn:hover {
  color: #334155;
  background-color: rgba(255, 255, 255, 0.4);
}

.active-tab {
  background-color: #ffffff !important;
  color: #3b82f6 !important;
  border-radius: 8px;
}

.inactive-tab {
  color: #64748b;
}

/* Table Card */
.card-content-box {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
}

/* Table Styles */
.custom-table th {
  background-color: #f8fafc;
  color: #475569;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  padding: 14px 16px;
  border-bottom: 2px solid #e2e8f0;
}

.custom-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
}

/* User avatar */
.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: #ffffff;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

/* Active schedule cell */
.schedule-cell-active {
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  transition: all 0.2s ease;
}

.schedule-cell-active:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.shift-time {
  font-size: 0.85rem;
}

.shift-desc {
  font-size: 0.75rem;
  max-width: 120px;
  margin: 0 auto;
}

/* Empty cell */
.schedule-cell-empty {
  background-color: #f8fafc;
  border: 1px dashed #cbd5e1;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.btn-link-add {
  background: none;
  border: none;
  padding: 0;
  color: #94a3b8;
  transition: color 0.2s;
}

.btn-link-add:hover {
  color: #3b82f6;
}

.btn-icon-xs {
  padding: 2px 6px;
  font-size: 0.75rem;
}

/* Presence selfie view */
.presence-success-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-success-light {
  background-color: #d1fae5;
}

.selfie-thumbnail-preview {
  max-width: 280px;
  border-radius: 12px;
}

.selfie-thumbnail-preview img {
  width: 100%;
  transition: opacity 0.2s;
}

.selfie-thumbnail-preview img:hover {
  opacity: 0.9;
}

.webcam-frame {
  aspect-ratio: 4/3;
  background-color: #0f172a;
}

.bg-dark-semi {
  background-color: rgba(15, 23, 42, 0.85);
}

.max-w-400 {
  max-width: 400px;
}

.max-w-500 {
  max-width: 500px;
}

.max-w-700 {
  max-width: 700px;
}

/* Custom Alert toast position */
.custom-alert {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  min-width: 300px;
  border-radius: 12px;
  animation: slide-in 0.3s ease;
}

/* Custom Backdrops */
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(15, 23, 42, 0.6);
  z-index: 1050;
  backdrop-filter: blur(4px);
}

.custom-modal-box {
  border: 1px solid rgba(0, 0, 0, 0.1);
  animation: zoom-in 0.25s ease;
}

.modal-header-custom {
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
}

.btn-close-custom {
  border: none;
  background: rgba(255, 255, 255, 0.2);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.btn-close-custom:hover {
  background: rgba(255, 255, 255, 0.4);
}

/* Helper styles */
.btn-xs {
  font-size: 0.7rem;
  padding: 2px 6px;
}

.hover-scale {
  transition: transform 0.2s;
}

.hover-scale:hover {
  transform: scale(1.03);
}

.hover-opacity:hover {
  opacity: 0.8;
}

.shadow-xs {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

/* Animations */
.animate-fade-in {
  animation: fade-in 0.3s ease;
}

@keyframes slide-in {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes zoom-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 991px) {
  .jadwal-wrapper {
    height: auto !important;
    padding: 20px;
  }
  .webcam-frame {
    max-width: 100%;
  }
}
</style>
