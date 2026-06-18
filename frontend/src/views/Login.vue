<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { loginUser } from '../store/store.js'
import WhatsappButton from '../components/WhatsappButton.vue'

const router = useRouter()

// Login form states
const username = ref('owner')
const password = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoggingIn = ref(false)

// Database empty check states
const isDbEmpty = ref(false)

// Registration form states
const regName = ref('')
const regUsername = ref('')
const regPassword = ref('')
const isRegistering = ref(false)

// Check if users table is empty on mount
const checkDbState = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/check-empty-db')
    const resData = await response.json()
    if (resData.success) {
      isDbEmpty.value = resData.empty
    }
  } catch (error) {
    console.error('Error checking DB state:', error)
  }
}

onMounted(() => {
  checkDbState()
})

const handleLogin = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!username.value || !password.value) {
    errorMessage.value = 'Silakan isi username dan password Anda.'
    return
  }

  isLoggingIn.value = true
  try {
    const result = await loginUser(username.value, password.value)

    if (result.success) {
      successMessage.value = `Login berhasil sebagai ${result.user.role === 'owner' ? 'Owner' : 'Karyawan'}!`
      setTimeout(() => {
        router.push('/dashboard-karyawan')
      }, 1000)
    } else {
      errorMessage.value = result.message
    }
  } catch (err) {
    console.error('Login error:', err)
    errorMessage.value = 'Terjadi kesalahan jaringan saat mencoba masuk.'
  } finally {
    isLoggingIn.value = false
  }
}

const handleRegisterOwner = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!regName.value || !regUsername.value || !regPassword.value) {
    errorMessage.value = 'Harap isi semua kolom pendaftaran!'
    return
  }

  isRegistering.value = true
  try {
    const response = await fetch('http://localhost:8000/api/register-first-owner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: regName.value,
        username: regUsername.value,
        password: regPassword.value
      })
    })
    const resData = await response.json()
    if (response.ok && resData.success) {
      successMessage.value = 'Akun Owner berhasil didaftarkan! Mencoba login otomatis...'
      
      // Auto-login registered user
      const loginRes = await loginUser(regUsername.value, regPassword.value)
      if (loginRes.success) {
        setTimeout(() => {
          router.push('/dashboard-karyawan')
        }, 1500)
      } else {
        isDbEmpty.value = false
        username.value = regUsername.value
        password.value = ''
        successMessage.value = 'Pendaftaran berhasil! Silakan masukkan password untuk masuk.'
      }
    } else {
      errorMessage.value = resData.message || 'Pendaftaran gagal!'
    }
  } catch (error) {
    console.error('Registration error:', error)
    errorMessage.value = 'Kesalahan jaringan saat mendaftarkan Owner!'
  } finally {
    isRegistering.value = false
  }
}
</script>

<template>
  <div class="login-wrapper-outer vh-100">
    <!-- Main Split Layout Container -->
    <main class="login-container h-100">

      <!-- Left Panel: Brand info with deep blue background -->
      <section class="info-panel d-none d-md-flex">
        <div class="info-content">
          <!-- Brand Logo Wrapper -->
          <div class="logo-wrapper">
            <img src="../assets/Asset 7.svg" class="img-left" alt="Toko Ce ALin" id="logo-left">
          </div>

          <!-- Headline & Copywriting -->
          <h1 class="info-title">Kelola Toko Lebih Mudah</h1>
          <p class="info-text">
            Pantau penjualan, atur produk, dan kelola pesanan dalam satu platform yang <span class="highlight">praktis
              dan efisien.</span>
          </p>
        </div>
      </section>

      <!-- Right Panel: Login form with clean white background -->
      <section class="form-panel">
        <div class="form-content">
          <!-- Subtitle/Brand name -->
          <div class="brand-title">Toko Ce ALin</div>

          <!-- Notification alerts -->
          <div v-if="errorMessage" class="alert alert-danger py-2 px-3 mb-4 rounded-3 small animate-fade-in"
            role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ errorMessage }}
          </div>
          <div v-if="successMessage" class="alert alert-success py-2 px-3 mb-4 rounded-3 small animate-fade-in"
            role="alert">
            <i class="bi bi-check-circle-fill me-2"></i>{{ successMessage }}
          </div>

          <!-- Conditional Render: Registration Gate when database is empty -->
          <div v-if="isDbEmpty">
            <h2 class="welcome-title text-danger">Database Kosong!</h2>
            <p class="welcome-subtitle">
              Tidak ada pengguna terdaftar. Silakan buat akun <span class="highlight">Owner Utama</span> untuk mengaktifkan kembali sistem kasir.
            </p>

            <form @submit.prevent="handleRegisterOwner" novalidate autocomplete="off">
              <!-- Full Name Field -->
              <div class="form-group-custom">
                <input type="text" id="regName" class="form-control-custom" placeholder=" " v-model="regName" required />
                <label for="regName" class="form-label-custom">Nama Lengkap Owner</label>
              </div>

              <!-- Username Field -->
              <div class="form-group-custom">
                <input type="text" id="regUsername" class="form-control-custom" placeholder=" " v-model="regUsername" required />
                <label for="regUsername" class="form-label-custom">Username Baru</label>
              </div>

              <!-- Password Field -->
              <div class="form-group-custom">
                <input type="password" id="regPassword" class="form-control-custom" placeholder=" " v-model="regPassword" required />
                <label for="regPassword" class="form-label-custom">Password Baru</label>
              </div>

              <!-- Submit Button -->
              <button type="submit" :disabled="isRegistering" class="btn-submit bg-danger border-0">
                <span v-if="isRegistering" class="spinner-border spinner-border-sm me-1.5" role="status" aria-hidden="true"></span>
                Daftar & Masuk
              </button>
            </form>
          </div>

          <!-- Standard Login Form -->
          <div v-else>
            <h2 class="welcome-title">Selamat Datang!</h2>
            <p class="welcome-subtitle">
              Masuk ke <span class="highlight">dashboard</span> dan tingkatkan produktivitas bisnis Anda setiap hari.
            </p>

            <form @submit.prevent="handleLogin" novalidate autocomplete="off">
              <!-- Username Field -->
              <div class="form-group-custom">
                <input type="text" id="username" class="form-control-custom" placeholder=" " v-model="username"
                  required />
                <label for="username" class="form-label-custom">Username</label>
              </div>

              <!-- Password Field -->
              <div class="form-group-custom">
                <input type="password" id="password" class="form-control-custom" placeholder=" " v-model="password"
                  required />
                <label for="password" class="form-label-custom">Password</label>
              </div>

              <!-- Submit Button -->
              <button type="submit" :disabled="isLoggingIn" class="btn-submit" id="btn-login-submit">
                <span v-if="isLoggingIn" class="spinner-border spinner-border-sm me-1.5" role="status" aria-hidden="true"></span>
                Masuk
              </button>

              <!-- Footer/Help Link -->
              <div class="form-footer">
                <span>Lupa Password? </span>
                <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">Hubungi admin</a>
              </div>
            </form>
          </div>

          <WhatsappButton phone-number="6281234567890" message="Halo Admin ..." />
        </div>
      </section>

    </main>
  </div>
</template>

<style scoped>
.img-left {
  max-width: 40%;
  height: auto;
  display: block;
}
.bg-danger {
  background: linear-gradient(135deg, #ef4444, #b91c1c) !important;
}
</style>
