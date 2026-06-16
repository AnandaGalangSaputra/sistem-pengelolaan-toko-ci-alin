import { createRouter, createWebHistory } from 'vue-router'
import { state } from '../store/store.js'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/dashboard-karyawan',
    component: () => import('../components/layout/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'DashboardKaryawan',
        component: () => import('../views/DashboardKaryawan.vue')
      },
      {
        path: 'data-barang',
        name: 'DataBarang',
        component: () => import('../views/DataBarang.vue')
      },
      {
        path: 'stok-barang',
        name: 'StokBarang',
        component: () => import('../views/StokBarang.vue')
      },
      {
        path: 'kasir',
        name: 'Kasir',
        component: () => import('../views/Kasir.vue')
      },
      {
        path: 'broadcast',
        name: 'BroadcastWA',
        component: () => import('../views/BroadcastWA.vue')
      },
      {
        path: 'laporan',
        name: 'LaporanTransaksi',
        component: () => import('../views/LaporanTransaksi.vue')
      },
      {
        path: 'pengaturan',
        name: 'PengaturanToko',
        component: () => import('../views/PengaturanToko.vue')
      },
      {
        path: 'akun',
        name: 'AkunKaryawan',
        component: () => import('../views/AkunKaryawan.vue')
      }
    ]
  },
  {
    path: '/dashboard-owner',
    redirect: '/dashboard-karyawan'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isLoggedIn = state.currentUser && state.currentUser.username
  
  if (to.name !== 'Login' && !isLoggedIn) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && isLoggedIn) {
    next('/dashboard-karyawan')
  } else {
    const role = state.currentUser?.role?.toLowerCase()
    if (to.name === 'LaporanTransaksi' && role !== 'owner') {
      next('/dashboard-karyawan')
    } else {
      next()
    }
  }
})

export default router
