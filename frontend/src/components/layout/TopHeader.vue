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
                    <i class="bi bi-clock me-2 text-primary"></i>
                    <span class="font-monospace small">{{ timeString }}</span>
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
import { ref, onMounted, onUnmounted } from 'vue'

defineProps({
    searchQuery: String,
    lowStockCount: Number
})

defineEmits([
    'update:searchQuery',
    'logout'
])

const timeString = ref('')

const updateTime = () => {
  const now = new Date()
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  
  const dayName = days[now.getDay()]
  const dateNum = now.getDate()
  const monthName = months[now.getMonth()]
  const yearNum = now.getFullYear()
  
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  
  timeString.value = `${dayName}, ${dateNum} ${monthName} ${yearNum} ${hours}:${minutes}:${seconds} WIB`
}

let timer = null
onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>