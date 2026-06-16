<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'
import TopHeader from './TopHeader.vue'
import { state, logoutUser } from '../../store/store.js'

const router = useRouter()
const route = useRoute()

const employeeName = computed(() => state.currentUser.name)
const employeeRole = computed(() => {
  const role = state.currentUser?.role?.toLowerCase()
  return role === 'owner' ? 'Owner / Pemilik Toko' : 'Kasir / Karyawan Toko'
})

// Compute low stock count from store state
const lowStockCount = computed(() => {
  return state.products.filter(p => p.stock < p.limit).length
})

const sidebarMenu = computed(() => {
  const role = state.currentUser?.role?.toLowerCase()
  const menus = [
    { id: 'dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill', active: route.name === 'DashboardKaryawan' },
    { id: 'data-barang', label: 'Data Barang', icon: 'bi-box-seam', active: route.name === 'DataBarang' },
    { id: 'stok-barang', label: 'Stok Barang', icon: 'bi-journal-bookmark', active: route.name === 'StokBarang' },
    { id: 'kasir', label: 'Kasir', icon: 'bi-calculator', active: route.name === 'Kasir' },
    { id: 'broadcast', label: 'Broadcast WA', icon: 'bi-whatsapp', active: route.name === 'BroadcastWA' }
  ]

  if (role === 'owner') {
    menus.push({ id: 'laporan', label: 'Laporan Transaksi', icon: 'bi-bar-chart-line', active: route.name === 'LaporanTransaksi' })
  }

  menus.push({ id: 'pengaturan', label: 'Pengaturan', icon: 'bi-gear', active: route.name === 'PengaturanToko' })
  menus.push({ id: 'akun', label: 'Akun', icon: 'bi-person-circle', active: route.name === 'AkunKaryawan' })

  return menus
})

const changeMenu = (menuId) => {
  if (menuId === 'dashboard') router.push('/dashboard-karyawan')
  else if (menuId === 'data-barang') router.push('/dashboard-karyawan/data-barang')
  else if (menuId === 'stok-barang') router.push('/dashboard-karyawan/stok-barang')
  else if (menuId === 'kasir') router.push('/dashboard-karyawan/kasir')
  else if (menuId === 'broadcast') router.push('/dashboard-karyawan/broadcast')
  else if (menuId === 'laporan') router.push('/dashboard-karyawan/laporan')
  else if (menuId === 'pengaturan') router.push('/dashboard-karyawan/pengaturan')
  else if (menuId === 'akun') router.push('/dashboard-karyawan/akun')
}

const handleLogout = async () => {
  await logoutUser()
  router.push('/login')
}
</script>

<template>
  <div class="dashboard-container">
    <Sidebar 
      :employee-name="employeeName" 
      :employee-role="employeeRole" 
      :sidebar-menu="sidebarMenu"
      @change-menu="changeMenu" 
      @logout="handleLogout" 
    />
    <!-- Main Content Area -->
    <div class="main-layout">
      <TopHeader 
        v-model:searchQuery="state.searchQuery" 
        :low-stock-count="lowStockCount" 
        @logout="handleLogout" 
      />
      <!-- Page Content -->
      <router-view />
    </div>
  </div>
</template>
