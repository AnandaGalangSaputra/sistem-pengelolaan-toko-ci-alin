import { createRouter, createWebHistory } from 'vue-router'

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
    name: 'DashboardKaryawan',
    component: () => import('../views/DashboardKaryawan.vue')
  },
  {
    path: '/dashboard-owner',
    name: 'DashboardOwner',
    component: () => import('../views/DashboardOwner.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
