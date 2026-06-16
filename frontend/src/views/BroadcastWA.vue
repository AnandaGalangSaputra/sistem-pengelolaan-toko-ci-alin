<script setup>
import WhatsappBroadcast from '../components/dashboard/WhatsappBroadcast.vue'
</script>

<template>
  <div class="broadcast-page-wrapper">
    <!-- Page Title -->
    <div class="content-header mb-4">
      <h1 class="page-title">Broadcast WhatsApp</h1>
      <p class="page-subtitle">Kirim pesan informasi toko buka, diskon harian, atau restok produk secara massal ke pelanggan setia Toko Ce Alin.</p>
    </div>

    <!-- Reusable Whatsapp Broadcast Component -->
    <div class="shadow-sm">
      <WhatsappBroadcast :show-pair-button="true" :show-history="true" />
    </div>
  </div>
</template>

<style scoped>
.broadcast-page-wrapper {
  padding: 30px;
  overflow-y: auto;
  height: calc(100vh - 70px);
}
@media (max-width: 991px) {
  .broadcast-page-wrapper {
    height: auto;
    padding: 20px;
  }
}
</style>
