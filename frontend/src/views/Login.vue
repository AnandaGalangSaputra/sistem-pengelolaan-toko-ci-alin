<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const email = ref('IjazahnyaMana@gmail.com')
const password = ref('')
const errorMessage = ref('')
const successMessage = ref('')

const handleLogin = () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Silakan isi email dan password Anda.'
    return
  }

  // Simple authentication simulation
  if (email.value === 'IjazahnyaMana@gmail.com') {
    if (password.value === 'admin123') {
      successMessage.value = 'Login berhasil sebagai Karyawan!'
      setTimeout(() => {
        router.push('/dashboard-karyawan')
      }, 1000)
    } else if (password.value === 'owner123') {
      successMessage.value = 'Login berhasil sebagai Owner!'
      setTimeout(() => {
        router.push('/dashboard-owner')
      }, 1000)
    } else {
      errorMessage.value = 'Password salah! (Petunjuk: gunakan "admin123" atau "owner123")'
    }
  } else {
    errorMessage.value = 'Email atau password salah!'
  }
}
</script>

<template>
  <div class="login-wrapper-outer">
    <!-- Dark grey top header bar from screenshot -->


    <!-- Main Split Layout Container -->
    <main class="login-container">

      <!-- Left Panel: Brand info with deep blue background -->
      <section class="info-panel">
        <div class="info-content">
          <!-- Brand Logo Wrapper -->
          <div class="logo-wrapper">
            <img src="" alt="">
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

            <!-- Email Field -->
            <div class="form-group-custom">
              <!-- Note: placeholder=" " is critical for CSS to detect empty state via :placeholder-shown -->
              <input type="email" id="email" class="form-control-custom" placeholder=" " v-model="email" required />
              <label for="email" class="form-label-custom">Username / Email</label>
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
        </div>
      </section>

    </main>
  </div>
</template>
