<script setup>
import { ref, computed } from 'vue'
import { 
  state, 
  updateProfile as updateProfileStore, 
  updatePassword as updatePasswordStore, 
  addNotification,
  addUser as addUserStore,
  editUser as editUserStore,
  deleteUser as deleteUserStore
} from '../store/store.js'

const successToastMsg = ref('')

// Tabs
const activeTab = ref('profile')

// Profile forms state
const formName = ref(state.currentUser.name)
const formRole = ref(state.currentUser.role ? state.currentUser.role.toLowerCase() : 'karyawan')
const formEmail = ref(state.currentUser.username || 'karyawan')

// Password forms state
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const isSavingProfile = ref(false)
const isChangingPassword = ref(false)

// User management forms & state
const searchQuery = ref('')
const showAddUserModal = ref(false)
const showEditUserModal = ref(false)
const isSavingUser = ref(false)
const isDeletingUser = ref(false)
const selectedUserId = ref(null)

const addUserFormName = ref('')
const addUserFormUsername = ref('')
const addUserFormPassword = ref('')
const addUserFormRole = ref('karyawan')

const editUserFormName = ref('')
const editUserFormUsername = ref('')
const editUserFormPassword = ref('')
const editUserFormRole = ref('karyawan')

const filteredUsers = computed(() => {
  if (!state.users) return []
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return state.users
  return state.users.filter(u => 
    u.name.toLowerCase().includes(query) || 
    u.username.toLowerCase().includes(query)
  )
})

const updateProfile = async () => {
  if (!formName.value) {
    alert('Nama tidak boleh kosong!')
    return
  }

  isSavingProfile.value = true
  try {
    const result = await updateProfileStore(formName.value, formRole.value)
    if (result.success) {
      addNotification('Profil Diperbarui', 'Informasi akun profil berhasil disimpan.', 'info')
      triggerToast('Informasi profil berhasil diperbarui! Sidebar akan memuat ulang peran baru Anda.')
    } else {
      alert(result.message)
    }
  } finally {
    isSavingProfile.value = false
  }
}

const changePassword = async () => {
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    alert('Harap isi semua kolom kata sandi!')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    alert('Konfirmasi kata sandi baru tidak cocok!')
    return
  }

  isChangingPassword.value = true
  try {
    const result = await updatePasswordStore(currentPassword.value, newPassword.value)
    if (result.success) {
      // Clear inputs
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''

      addNotification('Keamanan Akun', 'Kata sandi berhasil diperbarui secara permanen.', 'warning')
      triggerToast('Kata sandi berhasil diperbarui secara permanen!')
    } else {
      alert(result.message)
    }
  } finally {
    isChangingPassword.value = false
  }
}

const openAddUserModal = () => {
  addUserFormName.value = ''
  addUserFormUsername.value = ''
  addUserFormPassword.value = ''
  addUserFormRole.value = 'karyawan'
  showAddUserModal.value = true
}

const submitAddUser = async () => {
  if (!addUserFormName.value.trim() || !addUserFormUsername.value.trim() || !addUserFormPassword.value.trim()) {
    alert('Harap isi semua kolom wajib!')
    return
  }
  isSavingUser.value = true
  try {
    const res = await addUserStore(
      addUserFormName.value,
      addUserFormUsername.value,
      addUserFormPassword.value,
      addUserFormRole.value
    )
    if (res.success) {
      showAddUserModal.value = false
      triggerToast('Pengguna baru berhasil ditambahkan!')
    } else {
      alert(res.message)
    }
  } finally {
    isSavingUser.value = false
  }
}

const openEditUserModal = (user) => {
  selectedUserId.value = user.id
  editUserFormName.value = user.name
  editUserFormUsername.value = user.username
  editUserFormPassword.value = ''
  editUserFormRole.value = user.role
  showEditUserModal.value = true
}

const submitEditUser = async () => {
  if (!editUserFormName.value.trim() || !editUserFormUsername.value.trim()) {
    alert('Nama dan Username tidak boleh kosong!')
    return
  }
  isSavingUser.value = true
  try {
    const payload = {
      name: editUserFormName.value,
      username: editUserFormUsername.value,
      role: editUserFormRole.value
    }
    if (editUserFormPassword.value) {
      payload.password = editUserFormPassword.value
    }
    const res = await editUserStore(selectedUserId.value, payload)
    if (res.success) {
      showEditUserModal.value = false
      triggerToast('Informasi pengguna berhasil diperbarui!')
    } else {
      alert(res.message)
    }
  } finally {
    isSavingUser.value = false
  }
}

const confirmDeleteUser = async (user) => {
  if (user.id === state.currentUser.id) {
    alert('Anda tidak dapat menghapus akun Anda sendiri!')
    return
  }
  if (confirm(`Apakah Anda yakin ingin menghapus akun "${user.name}"?`)) {
    isDeletingUser.value = true
    try {
      const res = await deleteUserStore(user.id)
      if (res.success) {
        triggerToast('Pengguna berhasil dihapus!')
      } else {
        alert(res.message)
      }
    } finally {
      isDeletingUser.value = false
    }
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
  <div class="akun-wrapper">
    <!-- Success Toast Alert -->
    <transition name="fade">
      <div v-if="successToastMsg" class="custom-alert alert alert-success d-flex align-items-center shadow" role="alert">
        <i class="bi bi-check-circle-fill me-2 fs-5"></i>
        <div>{{ successToastMsg }}</div>
      </div>
    </transition>

    <!-- Page Title -->
    <div class="content-header mb-4">
      <h1 class="page-title">Pengaturan Akun</h1>
      <p class="page-subtitle">Kelola informasi akun pribadi Anda, ganti peran akses, atau kelola kredensial pengguna sistem.</p>
    </div>

    <!-- Tab Navigation (Only visible for Owner) -->
    <ul v-if="state.currentUser.role.toLowerCase() === 'owner'" class="nav nav-tabs mb-4 px-1" style="border-bottom: 2px solid #e2e8f0;">
      <li class="nav-item">
        <button 
          class="nav-link fw-bold border-0 px-3 py-2.5" 
          :class="activeTab === 'profile' ? 'text-primary' : 'text-muted'"
          :style="activeTab === 'profile' ? 'border-bottom: 3px solid #2563eb !important; color: #2563eb !important; font-weight: 600;' : 'background: transparent; border: none;'"
          @click="activeTab = 'profile'"
        >
          <i class="bi bi-person-fill me-2"></i>Profil Saya
        </button>
      </li>
      <li class="nav-item">
        <button 
          class="nav-link fw-bold border-0 px-3 py-2.5" 
          :class="activeTab === 'users' ? 'text-primary' : 'text-muted'"
          :style="activeTab === 'users' ? 'border-bottom: 3px solid #2563eb !important; color: #2563eb !important; font-weight: 600;' : 'background: transparent; border: none;'"
          @click="activeTab = 'users'"
        >
          <i class="bi bi-people-fill me-2"></i>Kelola Pengguna ({{ state.users ? state.users.length : 0 }})
        </button>
      </li>
    </ul>

    <!-- Tab Content: Profil Saya -->
    <div v-if="activeTab === 'profile'" class="row g-4 animate-fade-in">
      <!-- Left Column: User details editing (60%) -->
      <div class="col-12 col-lg-7">
        <div class="card-content-box shadow-sm mb-4">
          <div class="box-header border-bottom pb-2 mb-4">
            <h2 class="box-title">Detail Akun Profil</h2>
            <p class="box-subtitle">Perbarui data profil karyawan toko aktif di sistem.</p>
          </div>

          <form @submit.prevent="updateProfile">
            <div class="mb-3">
              <label for="profName" class="form-label-style">Nama Lengkap</label>
              <input type="text" id="profName" v-model="formName" class="form-control-style" required />
            </div>

            <div class="row g-3 mb-3">
              <div class="col-6">
                <label for="profEmail" class="form-label-style">Alamat Email / Username</label>
                <input type="text" id="profEmail" v-model="formEmail" class="form-control-style bg-light" readonly />
              </div>
              <div class="col-6">
                <label for="profRole" class="form-label-style">Peran Akses (Role)</label>
                <select id="profRole" v-model="formRole" class="form-select-style" :disabled="state.currentUser.role.toLowerCase() === 'karyawan'" required>
                  <option value="owner">Owner (Pemilik Toko)</option>
                  <option value="karyawan">Karyawan (Kasir / Staff Rak)</option>
                </select>
              </div>
            </div>

            <div v-if="state.currentUser.role.toLowerCase() === 'owner'" class="alert alert-info border-0 rounded-3 py-2 px-3 mb-4 small">
              <i class="bi bi-info-circle-fill me-2 fs-6"></i>
              <span>Anda dapat mengubah peran akses antara **Owner** dan **Karyawan** secara langsung untuk mensimulasikan hak akses menu sidebar.</span>
            </div>

            <button type="submit" :disabled="isSavingProfile" class="btn btn-primary-custom px-4 py-2.5">
              <span v-if="isSavingProfile" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              <i v-else class="bi bi-person-check-fill me-2"></i>
              {{ isSavingProfile ? 'Menyimpan...' : 'Simpan Profil' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Right Column: Change Password (40%) -->
      <div class="col-12 col-lg-5">
        <div class="card-content-box shadow-sm">
          <div class="box-header border-bottom pb-2 mb-4">
            <h2 class="box-title">Ganti Kata Sandi</h2>
            <p class="box-subtitle">Perbarui kata sandi akun kasir Anda secara berkala demi keamanan.</p>
          </div>

          <form @submit.prevent="changePassword">
            <div class="mb-3">
              <label for="oldPass" class="form-label-style">Kata Sandi Sekarang</label>
              <input type="password" id="oldPass" v-model="currentPassword" class="form-control-style" placeholder="Password saat ini..." required />
            </div>

            <div class="mb-3">
              <label for="newPass" class="form-label-style">Kata Sandi Baru</label>
              <input type="password" id="newPass" v-model="newPassword" class="form-control-style" placeholder="Password baru..." required />
            </div>

            <div class="mb-4">
              <label for="confirmPass" class="form-label-style">Konfirmasi Kata Sandi Baru</label>
              <input type="password" id="confirmPass" v-model="confirmPassword" class="form-control-style" placeholder="Ulangi password baru..." required />
            </div>

            <button type="submit" :disabled="isChangingPassword" class="btn btn-outline-primary-custom w-100 py-2.5">
              <span v-if="isChangingPassword" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              <i v-else class="bi bi-shield-lock-fill me-2"></i>
              {{ isChangingPassword ? 'Memperbarui...' : 'Perbarui Sandi' }}
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Tab Content: Kelola Pengguna -->
    <div v-else-if="activeTab === 'users' && state.currentUser.role.toLowerCase() === 'owner'" class="card-content-box shadow-sm animate-fade-in">
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center border-bottom pb-3 mb-4 gap-3">
        <div>
          <h2 class="box-title">Daftar Pengguna Sistem</h2>
          <p class="box-subtitle">Tambah, edit, dan hapus akun kasir, karyawan, atau sesama pemilik toko.</p>
        </div>
        <div>
          <button @click="openAddUserModal" class="btn btn-primary-custom px-4 py-2">
            <i class="bi bi-person-plus-fill me-2"></i>Tambah Pengguna
          </button>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="mb-4">
        <div class="input-group-style d-flex align-items-center">
          <i class="bi bi-search me-2 text-muted"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            class="bg-transparent border-0 w-100 text-dark" 
            placeholder="Cari pengguna berdasarkan nama atau username..." 
            style="outline: none; font-size: 0.95rem;"
          />
        </div>
      </div>

      <!-- Users Table -->
      <div class="table-responsive">
        <table class="table table-hover align-middle border-0 mb-0">
          <thead>
            <tr class="table-header-style text-uppercase text-secondary font-sans-serif fw-bold" style="font-size: 0.75rem;">
              <th scope="col" class="border-0 pb-3" style="width: 50px;">#</th>
              <th scope="col" class="border-0 pb-3">Nama Pengguna</th>
              <th scope="col" class="border-0 pb-3">Username / Login ID</th>
              <th scope="col" class="border-0 pb-3">Peran Akses</th>
              <th scope="col" class="border-0 pb-3 text-end" style="width: 150px;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in filteredUsers" :key="user.id" class="border-bottom border-light">
              <td class="text-muted fw-bold">{{ index + 1 }}</td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="avatar-circle-sm" :class="user.role === 'owner' ? 'bg-primary-subtle text-primary' : 'bg-success-subtle text-success'">
                    {{ user.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="fw-semibold text-dark">{{ user.name }}</div>
                    <div v-if="user.id === state.currentUser.id" class="badge bg-primary-subtle text-primary border-0 rounded-pill px-2 py-0.5" style="font-size: 0.65rem;">Anda</div>
                  </div>
                </div>
              </td>
              <td>
                <code class="text-primary-emphasis bg-light px-2 py-1 rounded small">{{ user.username }}</code>
              </td>
              <td>
                <span class="badge rounded-pill px-3 py-1.5 fw-bold text-capitalize" 
                  :class="user.role === 'owner' ? 'bg-danger-subtle text-danger' : 'bg-info-subtle text-info'"
                  style="font-size: 0.75rem;"
                >
                  <i class="bi me-1" :class="user.role === 'owner' ? 'bi-shield-fill' : 'bi-person-fill'"></i>
                  {{ user.role }}
                </span>
              </td>
              <td class="text-end">
                <div class="d-flex gap-2 justify-content-end">
                  <button @click="openEditUserModal(user)" class="btn btn-sm btn-outline-secondary rounded-3 border-0 py-1.5 px-2" title="Edit Pengguna">
                    <i class="bi bi-pencil-square text-secondary fs-6"></i>
                  </button>
                  <button 
                    @click="confirmDeleteUser(user)" 
                    :disabled="user.id === state.currentUser.id || isDeletingUser" 
                    class="btn btn-sm btn-outline-danger rounded-3 border-0 py-1.5 px-2" 
                    :class="{ 'opacity-50 cursor-not-allowed': user.id === state.currentUser.id }"
                    title="Hapus Pengguna"
                  >
                    <i class="bi bi-trash3-fill text-danger fs-6"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="5" class="text-center py-5 text-muted">
                <i class="bi bi-people-fill display-5 d-block mb-3 text-secondary-50"></i>
                Tidak ada data pengguna ditemukan.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Tambah Pengguna -->
    <transition name="modal">
      <div v-if="showAddUserModal" class="modal-backdrop-custom">
        <div class="modal-card-custom animate-fade-in" style="max-width: 450px;">
          <div class="modal-header-custom border-bottom">
            <h3 class="modal-title-custom">
              <i class="bi bi-person-plus text-primary me-2"></i>Tambah Pengguna Baru
            </h3>
            <button @click="showAddUserModal = false" class="btn-close-custom">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <form @submit.prevent="submitAddUser">
            <div class="modal-body-custom">
              <div class="mb-3">
                <label for="addUserName" class="form-label-style">Nama Lengkap <span class="text-danger">*</span></label>
                <input type="text" id="addUserName" v-model="addUserFormName" class="form-control-style" placeholder="Contoh: Budi Santoso" required />
              </div>

              <div class="mb-3">
                <label for="addUserUsername" class="form-label-style">Username <span class="text-danger">*</span></label>
                <input type="text" id="addUserUsername" v-model="addUserFormUsername" class="form-control-style" placeholder="Contoh: budi_kasir" required />
              </div>

              <div class="mb-3">
                <label for="addUserPassword" class="form-label-style">Kata Sandi <span class="text-danger">*</span></label>
                <input type="password" id="addUserPassword" v-model="addUserFormPassword" class="form-control-style" placeholder="Min. 4 karakter..." required />
              </div>

              <div class="mb-3">
                <label for="addUserRole" class="form-label-style">Peran Akses <span class="text-danger">*</span></label>
                <select id="addUserRole" v-model="addUserFormRole" class="form-select-style" required>
                  <option value="owner">Owner (Akses Penuh + Kelola Pengguna)</option>
                  <option value="karyawan">Karyawan (Kasir / Hak Terbatas)</option>
                </select>
              </div>
            </div>

            <div class="modal-footer-custom border-top">
              <button type="button" @click="showAddUserModal = false" :disabled="isSavingUser" class="btn-cancel">Batal</button>
              <button type="submit" :disabled="isSavingUser" class="btn-confirm">
                <span v-if="isSavingUser" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {{ isSavingUser ? 'Menyimpan...' : 'Tambah Pengguna' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Modal: Edit Pengguna -->
    <transition name="modal">
      <div v-if="showEditUserModal" class="modal-backdrop-custom">
        <div class="modal-card-custom animate-fade-in" style="max-width: 450px;">
          <div class="modal-header-custom border-bottom">
            <h3 class="modal-title-custom">
              <i class="bi bi-pencil-square text-primary me-2"></i>Edit Informasi Pengguna
            </h3>
            <button @click="showEditUserModal = false" class="btn-close-custom">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <form @submit.prevent="submitEditUser">
            <div class="modal-body-custom">
              <div class="mb-3">
                <label for="editUserName" class="form-label-style">Nama Lengkap <span class="text-danger">*</span></label>
                <input type="text" id="editUserName" v-model="editUserFormName" class="form-control-style" required />
              </div>

              <div class="mb-3">
                <label for="editUserUsername" class="form-label-style">Username <span class="text-danger">*</span></label>
                <input type="text" id="editUserUsername" v-model="editUserFormUsername" class="form-control-style" required />
              </div>

              <div class="mb-3">
                <label for="editUserPassword" class="form-label-style">Kata Sandi Baru <span class="text-muted">(Kosongkan jika tidak diubah)</span></label>
                <input type="password" id="editUserPassword" v-model="editUserFormPassword" class="form-control-style" placeholder="Isi password baru..." />
              </div>

              <div class="mb-3">
                <label for="editUserRole" class="form-label-style">Peran Akses <span class="text-danger">*</span></label>
                <select 
                  id="editUserRole" 
                  v-model="editUserFormRole" 
                  class="form-select-style" 
                  :disabled="selectedUserId === state.currentUser.id"
                  required
                >
                  <option value="owner">Owner (Akses Penuh + Kelola Pengguna)</option>
                  <option value="karyawan">Karyawan (Kasir / Hak Terbatas)</option>
                </select>
                <small v-if="selectedUserId === state.currentUser.id" class="text-muted block mt-1">Anda tidak dapat mendowngrade peran Anda sendiri dari menu ini.</small>
              </div>
            </div>

            <div class="modal-footer-custom border-top">
              <button type="button" @click="showEditUserModal = false" :disabled="isSavingUser" class="btn-cancel">Batal</button>
              <button type="submit" :disabled="isSavingUser" class="btn-confirm">
                <span v-if="isSavingUser" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {{ isSavingUser ? 'Menyimpan...' : 'Simpan Perubahan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.akun-wrapper {
  padding: 30px;
  overflow-y: auto;
  height: calc(100vh - 70px);
}
.avatar-circle-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}
.table-header-style {
  background-color: #f8fafc;
}
.bg-primary-subtle {
  background-color: rgba(37, 99, 235, 0.15) !important;
}
.text-primary {
  color: #2563eb !important;
}
.bg-success-subtle {
  background-color: rgba(34, 197, 94, 0.15) !important;
}
.text-success {
  color: #16a34a !important;
}
.bg-danger-subtle {
  background-color: rgba(239, 68, 68, 0.15) !important;
}
.text-danger {
  color: #dc2626 !important;
}
.bg-info-subtle {
  background-color: rgba(14, 165, 233, 0.15) !important;
}
.text-info {
  color: #0284c7 !important;
}
.cursor-not-allowed {
  cursor: not-allowed;
}
@media (max-width: 991px) {
  .akun-wrapper {
    height: auto;
    padding: 20px;
  }
}
</style>
