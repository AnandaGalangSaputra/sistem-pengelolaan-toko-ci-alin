<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { state, addRack, editRack, deleteRack } from '../store/store.js'

const isLoading = ref(false)

const router = useRouter()

const successToastMsg = ref('')
const selectedRackId = ref(null)

const isOwner = computed(() => {
  return state.currentUser?.role?.toLowerCase() === 'owner'
})

// Form state
const showAddModal = ref(false)
const showEditModal = ref(false)

const formNamaRak = ref('')
const formKeterangan = ref('')
const formColor = ref('#3b82f6')
const formBaris = ref('1')
const formLebar = ref(1)
const formTinggi = ref(1)

const presetColors = [
  { name: 'Biru', hex: '#3b82f6' },
  { name: 'Hijau', hex: '#22c55e' },
  { name: 'Ungu', hex: '#a855f7' },
  { name: 'Jingga', hex: '#f97316' },
  { name: 'Merah Muda', hex: '#f43f5e' },
  { name: 'Toska', hex: '#14b8a6' },
  { name: 'Kuning', hex: '#eab308' },
]

const hexToHsl = (hex) => {
  hex = hex.replace(/^#/, '')
  let r = parseInt(hex.substring(0, 2), 16) / 255
  let g = parseInt(hex.substring(2, 4), 16) / 255
  let b = parseInt(hex.substring(4, 6), 16) / 255

  let max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    let d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

const generateThemeFromHex = (hex) => {
  if (!hex) return null
  try {
    const { h, s } = hexToHsl(hex)
    return {
      bg: `hsl(${h}, ${Math.min(s, 70)}%, 97%)`,
      border: `hsl(${h}, ${Math.min(s, 60)}%, 88%)`,
      text: `hsl(${h}, ${Math.min(s, 90)}%, 22%)`,
      dot: hex,
      activeBorder: hex
    }
  } catch (e) {
    return null
  }
}

// Premium Color Palettes for Rack Sektors
const colors = [
  { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', dot: '#3b82f6', activeBorder: '#2563eb' }, // Blue (Blok A)
  { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', dot: '#22c55e', activeBorder: '#16a34a' }, // Green (Blok B)
  { bg: '#faf5ff', border: '#e9d5ff', text: '#581c87', dot: '#a855f7', activeBorder: '#9333ea' }, // Purple (Blok C)
  { bg: '#fff7ed', border: '#ffedd5', text: '#9a3412', dot: '#f97316', activeBorder: '#ea580c' }, // Orange (Blok D)
  { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239', dot: '#f43f5e', activeBorder: '#e11d48' }, // Rose (Blok E)
  { bg: '#f0fdfa', border: '#99f6e4', text: '#115e59', dot: '#14b8a6', activeBorder: '#0d9488' }, // Teal (Blok F)
  { bg: '#fefce8', border: '#fef08a', text: '#854d0e', dot: '#eab308', activeBorder: '#ca8a04' }, // Yellow (Blok G)
]

const getRackColor = (rak) => {
  if (rak.color) {
    const customTheme = generateThemeFromHex(rak.color)
    if (customTheme) return customTheme
  }
  const match = rak.nama_rak.match(/([A-Za-z])/);
  const letter = match ? match[1].toUpperCase() : 'Z';
  const charCode = letter.charCodeAt(0);
  return colors[charCode % colors.length];
}

const getAbbreviation = (name) => {
  // e.g. "Rak A-1" -> "A-1", "Rak Besi" -> "Besi"
  return name.replace(/rak/gi, '').trim() || name
}

const getProductCount = (rakId) => {
  return state.products.filter(p => p.rak_id === rakId).length
}

const selectedRack = computed(() => {
  return state.racks.find(r => r.id === selectedRackId.value) || null
})

const triggerToast = (msg) => {
  successToastMsg.value = msg
  setTimeout(() => {
    successToastMsg.value = ''
  }, 4000)
}

// GRID LAYOUT SETTING
const gridColumns = ref(Number(localStorage.getItem('toko_alin_grid_columns') || 6))

const gridClass = computed(() => 'denah-grid-container')

// Group racks by row name (baris) for physical layout mapping
const groupedRacks = computed(() => {
  const groups = {}
  state.racks.forEach(rak => {
    const r = rak.baris || '1'
    if (!groups[r]) {
      groups[r] = []
    }
    groups[r].push(rak)
  })
  
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const numA = Number(a)
    const numB = Number(b)
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB
    }
    return a.localeCompare(b)
  })
  
  return sortedKeys.map(key => ({
    rowName: key,
    racks: groups[key] // Preserve order from state.racks
  }))
})

const changeGridColumns = (cols) => {
  gridColumns.value = cols
  localStorage.setItem('toko_alin_grid_columns', cols)
}

const onGridColumnsChange = () => {
  if (typeof gridColumns.value !== 'number' || isNaN(gridColumns.value) || gridColumns.value < 1) {
    gridColumns.value = 1
  } else if (gridColumns.value > 16) {
    gridColumns.value = 16
  }
  localStorage.setItem('toko_alin_grid_columns', gridColumns.value)
}

// DRAG AND DROP HANDLERS (HTML5 API)
const draggedIndex = ref(null)

const onDragStart = (event, rak) => {
  if (!isOwner.value) return
  const idx = state.racks.findIndex(r => r.id === rak.id)
  if (idx === -1) return
  draggedIndex.value = idx
  event.dataTransfer.effectAllowed = 'move'
}

const onDragOver = (event) => {
  if (!isOwner.value) return
  event.preventDefault()
}

const onDrop = (event, targetRak) => {
  event.preventDefault()
  if (!isOwner.value) return
  if (draggedIndex.value === null) return
  const toIndex = state.racks.findIndex(r => r.id === targetRak.id)
  if (toIndex === -1 || draggedIndex.value === toIndex) return
  
  // Reorder racks array
  const temp = [...state.racks]
  const [removed] = temp.splice(draggedIndex.value, 1)
  temp.splice(toIndex, 0, removed)
  
  state.racks = temp
  
  // Save order to localStorage
  const orderIds = state.racks.map(r => r.id)
  localStorage.setItem('toko_alin_rack_order', JSON.stringify(orderIds))
}

const onDragEnd = (event) => {
  draggedIndex.value = null
}

const resetRackOrder = () => {
  if (!isOwner.value) return
  if (confirm('Apakah Anda yakin ingin mengatur ulang urutan rak secara alfabetis?')) {
    // Sort by name
    state.racks.sort((a, b) => a.nama_rak.localeCompare(b.nama_rak))
    localStorage.removeItem('toko_alin_rack_order')
    triggerToast('Urutan rak berhasil dikembalikan ke default alfabetis!')
  }
}

// CRUD Actions
const openAddModal = () => {
  formNamaRak.value = ''
  formKeterangan.value = ''
  formColor.value = '#3b82f6'
  formBaris.value = '1'
  formLebar.value = 1
  formTinggi.value = 1
  showAddModal.value = true
}

const submitAdd = async () => {
  if (!formNamaRak.value.trim()) {
    alert('Nama rak harus diisi!')
    return
  }
  
  isLoading.value = true
  try {
    const result = await addRack(
      formNamaRak.value, 
      formKeterangan.value, 
      formColor.value,
      formBaris.value,
      formLebar.value,
      formTinggi.value
    )
    if (result.success) {
      showAddModal.value = false
      triggerToast(`Rak "${formNamaRak.value}" berhasil ditambahkan!`)
      
      // Auto select new rack
      const newRak = state.racks[state.racks.length - 1]
      if (newRak) {
        selectedRackId.value = newRak.id
      }
    } else {
      alert(result.message)
    }
  } finally {
    isLoading.value = false
  }
}

const openEditModal = () => {
  if (!selectedRack.value) return
  formNamaRak.value = selectedRack.value.nama_rak
  formKeterangan.value = selectedRack.value.keterangan || ''
  formColor.value = selectedRack.value.color || '#3b82f6'
  formBaris.value = selectedRack.value.baris || '1'
  formLebar.value = selectedRack.value.lebar || 1
  formTinggi.value = selectedRack.value.tinggi || 1
  showEditModal.value = true
}

const submitEdit = async () => {
  if (!selectedRack.value) return
  if (!formNamaRak.value.trim()) {
    alert('Nama rak harus diisi!')
    return
  }
  
  isLoading.value = true
  try {
    const result = await editRack(
      selectedRack.value.id, 
      formNamaRak.value, 
      formKeterangan.value, 
      formColor.value,
      formBaris.value,
      formLebar.value,
      formTinggi.value
    )
    if (result.success) {
      showEditModal.value = false
      triggerToast(`Rak "${formNamaRak.value}" berhasil diperbarui!`)
    } else {
      alert(result.message)
    }
  } finally {
    isLoading.value = false
  }
}

const confirmDelete = async () => {
  if (!selectedRack.value) return
  
  const count = getProductCount(selectedRack.value.id)
  if (count > 0) {
    alert(`Rak "${selectedRack.value.nama_rak}" tidak dapat dihapus karena masih berisi ${count} barang! Silakan pindahkan semua barang ke rak lain terlebih dahulu.`)
    return
  }
  
  if (confirm(`Apakah Anda yakin ingin menghapus "${selectedRack.value.nama_rak}"?`)) {
    const deletedName = selectedRack.value.nama_rak
    isLoading.value = true
    try {
      const result = await deleteRack(selectedRack.value.id)
      if (result.success) {
        selectedRackId.value = null
        triggerToast(`Rak "${deletedName}" telah dihapus.`)
      } else {
        alert(result.message)
      }
    } finally {
      isLoading.value = false
    }
  }
}

const viewProducts = () => {
  if (!selectedRackId.value) return
  state.selectedRackId = selectedRackId.value
  router.push('/dashboard-karyawan/data-barang')
}
</script>

<template>
  <div class="daftar-rak-wrapper">
    <!-- Success Toast Alert -->
    <transition name="fade">
      <div v-if="successToastMsg" class="custom-alert alert alert-success d-flex align-items-center shadow animate-fade-in" role="alert">
        <i class="bi bi-check-circle-fill me-2 fs-5"></i>
        <div>{{ successToastMsg }}</div>
      </div>
    </transition>

    <!-- Page Title & Wireframe-like Action Header -->
    <div class="content-header d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h1 class="page-title">Denah & Tata Letak Rak</h1>
        <p class="page-subtitle">Tata letak fisik toko Ce Alin. Seret (drag) kotak untuk menyesuaikan koordinat rak secara dinamis.</p>
      </div>

      <!-- Action Buttons matching User Wireframe layout -->
      <div class="d-flex gap-2 align-items-center flex-wrap">
        <button v-if="isOwner" :disabled="isLoading" @click="openAddModal" class="btn btn-primary-custom py-2 px-3 d-flex align-items-center gap-2 shadow-sm">
          <i class="bi bi-plus-lg"></i>
          <span>Tambah Rak +</span>
        </button>

        <button 
          v-if="isOwner"
          @click="openEditModal" 
          :disabled="!selectedRackId || isLoading" 
          class="btn py-2 px-3 d-flex align-items-center gap-2"
          :class="selectedRackId && !isLoading ? 'btn-outline-primary-custom shadow-sm' : 'btn-light border text-muted cursor-not-allowed'"
        >
          <i class="bi bi-pencil-square"></i>
          <span>Edit Rak</span>
        </button>

        <button 
          v-if="isOwner"
          @click="confirmDelete" 
          :disabled="!selectedRackId || getProductCount(selectedRackId) > 0 || isLoading" 
          class="btn py-2 px-3 d-flex align-items-center gap-2"
          :class="selectedRackId && getProductCount(selectedRackId) === 0 && !isLoading ? 'btn-outline-danger shadow-sm' : 'btn-light border text-muted cursor-not-allowed'"
          :title="selectedRackId && getProductCount(selectedRackId) > 0 ? 'Kosongkan barang di rak sebelum menghapus' : ''"
        >
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
          <i v-else class="bi bi-trash"></i>
          <span>{{ isLoading ? 'Menghapus...' : 'Hapus Rak' }}</span>
        </button>

        <button 
          @click="viewProducts" 
          :disabled="!selectedRackId" 
          class="btn btn-dark py-2 px-3 d-flex align-items-center gap-2 shadow-sm"
          :class="selectedRackId ? '' : 'opacity-50 cursor-not-allowed'"
        >
          <i class="bi bi-box-seam"></i>
          <span>Lihat Barang</span>
        </button>

        <!-- Layout Grid Direction Button Group (Presets + Custom Stepper) -->
        <div class="d-flex align-items-center gap-2 border bg-white rounded-3 p-1 px-2.5 shadow-sm flex-wrap" style="height: auto; min-height: 38px;">
          <span class="text-muted small fw-semibold text-nowrap" style="font-size: 0.72rem;">Bentuk Denah:</span>
          
          <div class="btn-group btn-group-sm rounded-2 border" role="group">
            <button 
              type="button"
              @click="changeGridColumns(2)" 
              class="btn py-1 px-2 border-0"
              :class="gridColumns === 2 ? 'btn-primary-custom shadow-sm' : 'btn-light text-muted'"
              style="font-size: 0.7rem; font-weight: 600;"
              title="Vertikal 2 Kolom"
            >
              Vertikal (2)
            </button>
            <button 
              type="button"
              @click="changeGridColumns(4)" 
              class="btn py-1 px-2 border-0"
              :class="gridColumns === 4 ? 'btn-primary-custom shadow-sm' : 'btn-light text-muted'"
              style="font-size: 0.7rem; font-weight: 600;"
              title="Kotak 4 Kolom"
            >
              Kotak (4)
            </button>
            <button 
              type="button"
              @click="changeGridColumns(6)" 
              class="btn py-1 px-2 border-0"
              :class="gridColumns === 6 ? 'btn-primary-custom shadow-sm' : 'btn-light text-muted'"
              style="font-size: 0.7rem; font-weight: 600;"
              title="Horizontal 6 Kolom"
            >
              Horizontal (6)
            </button>
          </div>

          <div class="vr mx-1" style="height: 18px; align-self: center;"></div>

          <div class="d-flex align-items-center gap-1.5">
            <span class="text-muted text-nowrap" style="font-size: 0.68rem; font-weight: 500;">Kustom Kolom:</span>
            <button 
              type="button" 
              @click="changeGridColumns(Math.max(1, gridColumns - 1))" 
              class="btn btn-sm btn-light border d-flex align-items-center justify-content-center p-0 rounded-2" 
              style="width: 22px; height: 22px;"
              :disabled="gridColumns <= 1"
            >
              <i class="bi bi-dash" style="font-size: 0.75rem;"></i>
            </button>
            <input 
              type="number" 
              v-model.number="gridColumns" 
              @input="onGridColumnsChange"
              min="1" 
              max="16" 
              class="form-control form-control-sm text-center fw-bold p-0 border" 
              style="width: 38px; height: 22px; font-size: 0.78rem; border-radius: 4px;"
            />
            <button 
              type="button" 
              @click="changeGridColumns(Math.min(16, gridColumns + 1))" 
              class="btn btn-sm btn-light border d-flex align-items-center justify-content-center p-0 rounded-2" 
              style="width: 22px; height: 22px;"
              :disabled="gridColumns >= 16"
            >
              <i class="bi bi-plus" style="font-size: 0.75rem;"></i>
            </button>
          </div>
        </div>

        <button v-if="isOwner" @click="resetRackOrder" class="btn btn-light border py-2 px-3" title="Kembalikan urutan alfabetis" style="height: 38px;">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
    </div>

    <!-- Active Selection Summary -->
    <div v-if="selectedRack" class="alert alert-secondary border shadow-sm rounded-4 p-3 mb-4 d-flex justify-content-between align-items-center bg-white" style="border-left: 4px solid #3b82f6 !important;">
      <div>
        <span class="badge bg-primary-light text-primary font-monospace small mb-2 d-inline-block">{{ selectedRack.kode_rak }}</span>
        <h4 class="fw-bold mb-1 text-dark fs-6">Terpilih: {{ selectedRack.nama_rak }}</h4>
        <p class="text-muted small mb-0">{{ selectedRack.keterangan || 'Tidak ada keterangan lokasi.' }}</p>
      </div>
      <div class="text-end">
        <span class="text-muted small d-block">Barang terdaftar</span>
        <span class="fs-4 fw-bold text-dark font-monospace">{{ getProductCount(selectedRack.id) }}</span>
      </div>
    </div>

    <!-- Layout Grid: Floor Denah Map -->
    <div class="denah-container card border shadow-sm p-4 rounded-4 bg-white" style="overflow-x: auto;">
      <div class="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-map text-primary fs-5"></i>
          <span class="fw-bold text-dark">Peta Lokasi Fisik Rak</span>
        </div>
        <div class="d-flex gap-3 text-muted small">
          <div class="d-flex align-items-center gap-1"><span class="legend-dot bg-primary"></span><span>Blok A-G</span></div>
          <div class="d-flex align-items-center gap-1"><i class="bi bi-grip-vertical"></i><span>Grip drag & drop</span></div>
        </div>
      </div>

      <!-- Render each row/lane separately -->
      <div v-for="row in groupedRacks" :key="row.rowName" class="baris-wrapper mb-4 pb-3">
        <div class="d-flex align-items-center gap-2 mb-2">
          <span class="badge bg-dark text-white px-2.5 py-1.5 rounded-3 fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">
            <i class="bi bi-justify"></i> BARIS / BLOK {{ row.rowName }}
          </span>
          <span class="text-muted small">({{ row.racks.length }} Rak)</span>
        </div>

        <!-- Compact custom grid layout denah wrapper -->
        <div :class="gridClass" :style="{ '--grid-cols': gridColumns }">
          <!-- Render Rack Grid Box -->
          <div 
            v-for="rak in row.racks" 
            :key="rak.id" 
            class="rak-box-wrapper"
            :style="{ '--lebar': rak.lebar || 1, '--tinggi': rak.tinggi || 1 }"
            :class="{ 'dragging': draggedIndex === state.racks.findIndex(r => r.id === rak.id) }"
            :draggable="isOwner"
            @dragstart="onDragStart($event, rak)"
            @dragover="onDragOver($event)"
            @drop="onDrop($event, rak)"
            @dragend="onDragEnd($event)"
          >
            <!-- Visual Rack Box with Dynamic Theme Color -->
            <div 
              @click="selectedRackId = (selectedRackId === rak.id ? null : rak.id)"
              class="rak-denah-cell rounded-3 p-2 d-flex flex-column justify-content-between position-relative cursor-pointer"
              :style="{ 
                backgroundColor: getRackColor(rak).bg, 
                borderColor: selectedRackId === rak.id ? getRackColor(rak).activeBorder : getRackColor(rak).border,
                borderWidth: selectedRackId === rak.id ? '2px' : '1px',
                color: getRackColor(rak).text,
                boxShadow: selectedRackId === rak.id ? `0 0 0 3px ${getRackColor(rak).dot}28` : ''
              }"
              :class="{ 'active': selectedRackId === rak.id }"
            >
              <!-- Top cell info row -->
              <div class="d-flex justify-content-between align-items-center w-100" style="font-size: 0.65rem;">
                <span v-if="isOwner" class="drag-handle text-muted" style="cursor: move;" @click.stop><i class="bi bi-grip-vertical"></i></span>
                <span v-else style="width: 8px;"></span>
                <span class="font-monospace fw-bold opacity-75">{{ getProductCount(rak.id) }} Unit</span>
              </div>

              <!-- Abbreviation Display (Letters and Numbers) -->
              <div class="text-center">
                <span class="abbreviation-code block">
                  {{ getAbbreviation(rak.nama_rak) }}
                </span>
              </div>

              <!-- Bottom cell name row -->
              <div class="text-center w-100 border-top pt-1 text-truncate fw-semibold" style="opacity: 0.8; font-size: 0.62rem;">
                {{ rak.nama_rak }}
              </div>
              
              <!-- Selection Dot -->
              <span 
                v-if="selectedRackId === rak.id" 
                class="position-absolute shadow-sm" 
                style="width: 10px; height: 10px; border-radius: 50%; top: -3px; right: -3px; background-color: #2563eb; border: 1.5px solid #ffffff;"
              ></span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- No rack layout state -->
      <div v-if="state.racks.length === 0" class="text-center py-5 text-muted">
        <i class="bi bi-grid-3x3 d-block fs-1 mb-2 text-secondary"></i>
        <span>Belum ada rak terdaftar. Klik "+ Tambah Rak" untuk memulai.</span>
      </div>
    </div>

    <!-- Modal: Add Rack -->
    <transition name="modal">
      <div v-if="showAddModal" class="modal-backdrop-custom">
        <div class="modal-card-custom animate-fade-in" style="max-width: 440px;">
          <div class="modal-header-custom border-bottom">
            <h3 class="modal-title-custom">
              <i class="bi bi-plus-circle-fill text-primary me-2"></i>Tambah Rak Baru
            </h3>
            <button @click="showAddModal = false" class="btn-close-custom">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="modal-body-custom">
            <div class="mb-3">
              <label for="addNamaRak" class="form-label-style">Nama/Kode Rak <span class="text-danger">*</span></label>
              <input type="text" id="addNamaRak" v-model="formNamaRak" class="form-control-style" placeholder="Contoh: Rak A-1 atau B-2" required />
              <small class="text-muted mt-1 d-block" style="font-size: 0.72rem;">Disarankan menggunakan huruf awal untuk pengelompokan warna (misal: A-1, B-2).</small>
            </div>

            <div class="mb-3">
              <label for="addKeterangan" class="form-label-style">Keterangan Lokasi</label>
              <textarea id="addKeterangan" v-model="formKeterangan" class="form-control-style" rows="3" placeholder="Contoh: Koridor samping kasir."></textarea>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-6">
                <label for="addBaris" class="form-label-style">Baris / Blok <span class="text-danger">*</span></label>
                <input type="text" id="addBaris" v-model="formBaris" class="form-control-style" placeholder="Contoh: A, B, C, atau 1, 2" required />
              </div>
              <div class="col-3">
                <label for="addLebar" class="form-label-style">Panjang</label>
                <select id="addLebar" v-model.number="formLebar" class="form-control-style">
                  <option :value="1">1x</option>
                  <option :value="2">2x</option>
                  <option :value="3">3x</option>
                  <option :value="4">4x</option>
                </select>
              </div>
              <div class="col-3">
                <label for="addTinggi" class="form-label-style">Tinggi</label>
                <select id="addTinggi" v-model.number="formTinggi" class="form-control-style">
                  <option :value="1">1x</option>
                  <option :value="2">2x</option>
                  <option :value="3">3x</option>
                </select>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label-style d-block">Warna Rak</label>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <button 
                  v-for="preset in presetColors" 
                  :key="preset.hex"
                  type="button"
                  @click="formColor = preset.hex"
                  class="color-preset-btn"
                  :style="{ backgroundColor: preset.hex }"
                  :class="{ 'active': formColor === preset.hex }"
                  :title="preset.name"
                ></button>
                <div class="d-flex align-items-center gap-2 border rounded-3 p-1 px-2 bg-light ms-1" style="height: 34px;">
                  <span class="text-muted small font-sans-serif" style="font-size: 0.68rem; font-weight: 600;">Kustom:</span>
                  <input 
                    type="color" 
                    v-model="formColor" 
                    class="form-control-color border-0 cursor-pointer p-0" 
                    style="width: 24px; height: 24px; background: none; border-radius: 50%;"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer-custom border-top">
            <button @click="showAddModal = false" :disabled="isLoading" class="btn-cancel">Batal</button>
            <button @click="submitAdd" :disabled="isLoading" class="btn-confirm">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ isLoading ? 'Menyimpan...' : 'Tambah Rak' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal: Edit Rack -->
    <transition name="modal">
      <div v-if="showEditModal" class="modal-backdrop-custom">
        <div class="modal-card-custom animate-fade-in" style="max-width: 440px;">
          <div class="modal-header-custom border-bottom">
            <h3 class="modal-title-custom">
              <i class="bi bi-pencil-square text-primary me-2"></i>Edit Informasi Rak
            </h3>
            <button @click="showEditModal = false" class="btn-close-custom">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="modal-body-custom">
            <div class="mb-3">
              <label for="editNamaRak" class="form-label-style">Nama/Kode Rak <span class="text-danger">*</span></label>
              <input type="text" id="editNamaRak" v-model="formNamaRak" class="form-control-style" required />
            </div>

            <div class="mb-3">
              <label for="editKeterangan" class="form-label-style">Keterangan Lokasi</label>
              <textarea id="editKeterangan" v-model="formKeterangan" class="form-control-style" rows="3"></textarea>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-6">
                <label for="editBaris" class="form-label-style">Baris / Blok <span class="text-danger">*</span></label>
                <input type="text" id="editBaris" v-model="formBaris" class="form-control-style" placeholder="Contoh: A, B, C, atau 1, 2" required />
              </div>
              <div class="col-3">
                <label for="editLebar" class="form-label-style">Panjang</label>
                <select id="editLebar" v-model.number="formLebar" class="form-control-style">
                  <option :value="1">1x</option>
                  <option :value="2">2x</option>
                  <option :value="3">3x</option>
                  <option :value="4">4x</option>
                </select>
              </div>
              <div class="col-3">
                <label for="editTinggi" class="form-label-style">Tinggi</label>
                <select id="editTinggi" v-model.number="formTinggi" class="form-control-style">
                  <option :value="1">1x</option>
                  <option :value="2">2x</option>
                  <option :value="3">3x</option>
                </select>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label-style d-block">Warna Rak</label>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <button 
                  v-for="preset in presetColors" 
                  :key="preset.hex"
                  type="button"
                  @click="formColor = preset.hex"
                  class="color-preset-btn"
                  :style="{ backgroundColor: preset.hex }"
                  :class="{ 'active': formColor === preset.hex }"
                  :title="preset.name"
                ></button>
                <div class="d-flex align-items-center gap-2 border rounded-3 p-1 px-2 bg-light ms-1" style="height: 34px;">
                  <span class="text-muted small font-sans-serif" style="font-size: 0.68rem; font-weight: 600;">Kustom:</span>
                  <input 
                    type="color" 
                    v-model="formColor" 
                    class="form-control-color border-0 cursor-pointer p-0" 
                    style="width: 24px; height: 24px; background: none; border-radius: 50%;"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer-custom border-top">
            <button @click="showEditModal = false" :disabled="isLoading" class="btn-cancel">Batal</button>
            <button @click="submitEdit" :disabled="isLoading" class="btn-confirm">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ isLoading ? 'Menyimpan...' : 'Simpan Perubahan' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.daftar-rak-wrapper {
  padding: 30px;
  overflow-y: auto;
  height: calc(100vh - 70px);
  background-color: #f8fafc;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-not-allowed {
  cursor: not-allowed;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.baris-wrapper {
  border-bottom: 2px dashed #e2e8f0;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.baris-wrapper:last-child {
  border-bottom: none;
  margin-bottom: 0 !important;
}

.denah-grid-container {
  display: grid;
  grid-template-columns: repeat(var(--grid-cols, 6), 90px);
  grid-auto-rows: 80px;
  gap: 12px;
  justify-content: flex-start;
  transition: all 0.3s ease;
  width: max-content;
  min-width: 100%;
}

.rak-box-wrapper {
  grid-column: span var(--lebar, 1);
  grid-row: span var(--tinggi, 1);
  transition: all 0.2s;
}

.rak-box-wrapper.dragging {
  opacity: 0.4;
  transform: scale(0.95);
}

.rak-denah-cell {
  width: 100%;
  height: 100%;
  min-height: 80px;
  border-style: solid;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.rak-denah-cell:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.rak-denah-cell.active {
  transform: scale(1.02);
}

.abbreviation-code {
  font-family: 'Outfit', sans-serif;
  font-size: 1.2rem;
  font-weight: 800;
  display: block;
}

.color-preset-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.15);
}

.color-preset-btn:hover {
  transform: scale(1.1);
}

.color-preset-btn.active {
  border-color: #2563eb;
  transform: scale(1.2);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
}

.font-sans-serif {
  font-family: system-ui, -apple-system, sans-serif;
}

@media (max-width: 991px) {
  .daftar-rak-wrapper {
    height: auto;
    padding: 20px;
  }
}
</style>
