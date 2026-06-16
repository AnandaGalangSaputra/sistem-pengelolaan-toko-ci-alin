<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginUser } from '../store/store.js'
import WhatsappButton from '../components/WhatsappButton.vue'

const router = useRouter()

const username = ref('owner')
const password = ref('')
const errorMessage = ref('')
const successMessage = ref('')

const handleLogin = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!username.value || !password.value) {
    errorMessage.value = 'Silakan isi username dan password Anda.'
    return
  }

  const result = await loginUser(username.value, password.value)

  if (result.success) {
    successMessage.value = `Login berhasil sebagai ${result.user.role === 'owner' ? 'Owner' : 'Karyawan'}!`
    setTimeout(() => {
      router.push('/dashboard-karyawan')
    }, 1000)
  } else {
    errorMessage.value = result.message
    // errorMessage.value = `Username atau password salah!`
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

          <!-- Welcome Messages -->
          <h2 class="welcome-title">Selamat Datang!</h2>
          <p class="welcome-subtitle">
            Masuk ke <span class="highlight">dashboard</span> dan tingkatkan produktivitas bisnis Anda setiap hari.
          </p>

          <!-- Notification alerts -->
          <div v-if="errorMessage" class="alert alert-danger py-2 px-3 mb-4 rounded-3 small animate-fade-in"
            role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ errorMessage }}
          </div>
          <div v-if="successMessage" class="alert alert-success py-2 px-3 mb-4 rounded-3 small animate-fade-in"
            role="alert">
            <i class="bi bi-check-circle-fill me-2"></i>{{ successMessage }}
          </div>

          <!-- Login Form -->
          <form @submit.prevent="handleLogin" novalidate autocomplete="off">

            <!-- Username Field -->
            <div class="form-group-custom">
              <!-- Note: placeholder=" " is critical for CSS to detect empty state via :placeholder-shown -->
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
            <button type="submit" class="btn-submit" id="btn-login-submit">
              Masuk
            </button>

            <!-- Footer/Help Link -->
            <div class="form-footer">
              <span>Lupa Password? </span>
              <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">Hubungi admin</a>
            </div>

          </form>
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
</style>
