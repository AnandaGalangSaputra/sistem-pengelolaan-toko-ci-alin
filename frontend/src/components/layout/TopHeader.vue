     <template>
        <!-- Top Header -->
        <header class="top-header-main">
            <div class="header-search">
                <i class="bi bi-search search-icon"></i>
                <input type="text" placeholder="Cari nama barang atau lokasi rak..." class="search-input"
                    :value="searchQuery" @input="$emit('update:searchQuery', $event.target.value)" />
                <button class="btn-search">Cari</button>
            </div>

            <div class="header-right">
                <!-- Notification Bell -->
                <div class="notification-bell position-relative me-3">
                    <i class="bi bi-bell-fill"></i>
                    <span class="badge-dot" v-if="lowStockCount > 0"></span>
                </div>

                <!-- Date & Time badge -->
                <div class="date-badge d-none d-md-flex align-items-center">
                    <i class="bi bi-calendar3 me-2"></i>
                    <span>Senin, 15 Juni 2026</span>
                </div>

                <!-- Simple profile trigger for responsive/mobile -->
                <div class="mobile-profile d-flex d-lg-none align-items-center ms-3">
                    <div class="avatar-small">
                        <i class="bi bi-person-fill"></i>
                    </div>
                    <button @click="$emit('logout')" class="btn btn-sm btn-outline-danger border-0 p-1 ms-2">
                        <i class="bi bi-box-arrow-left"></i>
                    </button>
                </div>
            </div>
        </header>
    </template>
 
<script setup>
defineProps({
    searchQuery: String,
    lowStockCount: Number
})

defineEmits([
    'update:searchQuery',
    'logout'
])
</script>