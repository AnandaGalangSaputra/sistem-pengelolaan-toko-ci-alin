<script setup>
defineProps({
    employeeName: String,
    employeeRole: String,
    sidebarMenu: Array
})

defineEmits(['change-menu', 'logout'])
</script>

<template>
    <!-- Sidebar -->
    <aside class="sidebar d-none d-lg-flex">
        <div class="sidebar-brand">
            <img src="../../assets/Asset 7.svg" alt="Toko Ce Alin" class="brand-logo" />
            <div class="brand-text">
                <span class="app-name">Toko Ce Alin</span>
                <span class="app-tagline">Kelola Toko Lebih Mudah</span>
            </div>
        </div>

        <!-- User profile in sidebar -->
        <div class="sidebar-user">
            <div class="avatar-wrapper">
                <i class="bi bi-person-fill"></i>
            </div>
            <div class="user-details">
                <span class="user-name">{{ employeeName }}</span>
                <span class="user-role">{{ employeeRole }}</span>
            </div>
        </div>

        <nav class="sidebar-nav">
            <ul class="nav-list">
                <li v-for="menu in sidebarMenu" :key="menu.id" class="nav-item">
                    <button @click="$emit('change-menu', menu.id)" class="nav-link" :class="{ 'active': menu.active }">
                        <i class="bi me-3" :class="menu.icon"></i>
                        <span>{{ menu.label }}</span>
                    </button>
                </li>
            </ul>
        </nav>

        <div class="sidebar-footer">
            <button @click="$emit('logout')" class="btn-logout">
                <i class="bi bi-box-arrow-left me-3"></i>
                <span>Keluar</span>
            </button>
        </div>
    </aside>

</template>