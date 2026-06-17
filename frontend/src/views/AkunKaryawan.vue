<script setup>
import { ref } from 'vue'
import { state, updateProfile as updateProfileStore, updatePassword as updatePasswordStore } from '../store/store.js'

const successToastMsg = ref('')

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

const updateProfile = async () => {
  if (!formName.value) {
    alert('Nama tidak boleh kosong!')
    return
  }

  isSavingProfile.value = true
  try {
    const result = await updateProfileStore(formName.value, formRole.value)
    if (result.success) {
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

      triggerToast('Kata sandi berhasil diperbarui secara permanen!')
    } else {
      alert(result.message)
    }
  } finally {
    isChangingPassword.value = false
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
      <h1 class="page-title">Profil Pengguna</h1>
      <p class="page-subtitle">Kelola informasi akun pribadi Anda, ganti peran akses (simulasi role), dan atur kata sandi.</p>
    </div>

    <div class="row g-4">
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
                <input type="email" id="profEmail" v-model="formEmail" class="form-control-style bg-light" readonly />
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
  </div>
</template>

<style scoped>
.akun-wrapper {
  padding: 30px;
  overflow-y: auto;
  height: calc(100vh - 70px);
}
@media (max-width: 991px) {
  .akun-wrapper {
    height: auto;
    padding: 20px;
  }
}
</style>
