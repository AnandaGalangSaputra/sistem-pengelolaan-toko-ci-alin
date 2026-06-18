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
            <!-- AI Chat Assistant Trigger -->
            <button @click="toggleAIChat" class="ai-chat-trigger-btn me-2 position-relative" :class="{ 'active': showAIChat }" title="AI Asisten Toko">
                <i class="bi bi-stars"></i>
            </button>

            <!-- Notification Container Wrapper -->
            <div class="notification-container-wrapper position-relative me-3">
                <button @click="toggleDropdown" class="notification-bell-btn position-relative" :class="{ 'active': showDropdown }">
                    <i class="bi bi-bell-fill"></i>
                    <span class="badge-count" v-if="unreadCount > 0">{{ unreadCount }}</span>
                    <span class="badge-dot" v-else-if="lowStockCount > 0"></span>
                </button>

                <!-- Dropdown Panel -->
                <transition name="fade-slide">
                    <div v-if="showDropdown" class="notification-dropdown shadow border rounded-4 bg-white">
                        <div class="dropdown-header-custom d-flex justify-content-between align-items-center p-3 border-bottom">
                            <h6 class="fw-bold text-dark mb-0" style="font-size: 0.9rem;">Notifikasi Aktifitas</h6>
                            <div class="d-flex gap-2">
                                <button v-if="unreadCount > 0" @click="handleMarkAllRead" class="btn-action-text text-primary small" style="font-size: 0.7rem;">Tandai Dibaca</button>
                                <button v-if="state.notifications.length > 0" @click="handleClear" class="btn-action-text text-danger small" style="font-size: 0.7rem;">Bersihkan</button>
                            </div>
                        </div>

                        <div class="dropdown-body-custom scrollable-list" style="max-height: 290px; overflow-y: auto;">
                            <div 
                                v-for="notif in state.notifications" 
                                :key="notif.id" 
                                class="notification-item d-flex align-items-start p-3 border-bottom cursor-pointer"
                                :class="{ 'unread': !notif.read }"
                                @click="notif.read = true"
                            >
                                <!-- Type Icon -->
                                <div class="notif-icon-circle me-3" :class="notif.type">
                                    <i class="bi" :class="getIconClass(notif.type)"></i>
                                </div>

                                <!-- Notif Text -->
                                <div class="flex-fill text-start">
                                    <div class="d-flex justify-content-between align-items-baseline mb-0.5">
                                        <span class="fw-bold text-dark small" style="font-size: 0.78rem;">{{ notif.title }}</span>
                                        <span class="text-muted text-nowrap ms-2" style="font-size: 0.65rem;">{{ getRelativeTime(notif.rawTime) }}</span>
                                    </div>
                                    <p class="text-secondary small mb-0 lh-base" style="font-size: 0.74rem;">{{ notif.message }}</p>
                                </div>

                                <!-- Unread dot indicator -->
                                <span v-if="!notif.read" class="unread-dot-indicator ms-2"></span>
                            </div>

                            <!-- Empty State -->
                            <div v-if="state.notifications.length === 0" class="text-center py-5 text-muted">
                                <i class="bi bi-bell-slash fs-2 mb-2 text-secondary opacity-50 d-block"></i>
                                <span class="small" style="font-size: 0.76rem;">Tidak ada notifikasi baru</span>
                            </div>
                        </div>
                    </div>
                </transition>
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

    <!-- AI Chat Assistant Drawer -->
    <AIChatAssistant :show="showAIChat" @close="showAIChat = false" />
</template>
 
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { state, markAllNotificationsAsRead, clearNotifications } from '../../store/store.js'
import AIChatAssistant from './AIChatAssistant.vue'

defineProps({
    searchQuery: String,
    lowStockCount: Number
})

defineEmits([
    'update:searchQuery',
    'logout'
])

const timeString = ref('')
const showDropdown = ref(false)
const showAIChat = ref(false)

const toggleAIChat = () => {
    showAIChat.value = !showAIChat.value
    if (showAIChat.value) {
        showDropdown.value = false
    }
}

const unreadCount = computed(() => {
  return state.notifications.filter(n => !n.read).length
})

const getRelativeTime = (isoString) => {
  if (!isoString) return 'Baru saja'
  const diff = Date.now() - new Date(isoString).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return 'Baru saja'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins} mnt lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  return new Date(isoString).toLocaleDateString('id-ID')
}

const getIconClass = (type) => {
  if (type === 'success') return 'bi-check-circle-fill'
  if (type === 'warning') return 'bi-exclamation-triangle-fill'
  if (type === 'danger') return 'bi-x-circle-fill'
  return 'bi-info-circle-fill'
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    showAIChat.value = false
  }
}

const handleMarkAllRead = () => {
  markAllNotificationsAsRead()
}

const handleClear = () => {
  clearNotifications()
}

const handleClickOutside = (e) => {
  const bell = document.querySelector('.notification-container-wrapper')
  if (bell && !bell.contains(e.target)) {
    showDropdown.value = false
  }
}

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
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.ai-chat-trigger-btn {
    background: transparent;
    border: none;
    padding: 8px;
    font-size: 1.25rem;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    width: 40px;
}

.ai-chat-trigger-btn i {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: inline-block;
}

.ai-chat-trigger-btn:hover,
.ai-chat-trigger-btn.active {
    background-color: #ede9fe;
    box-shadow: 0 0 10px rgba(124, 58, 237, 0.15);
}

.notification-container-wrapper {
    z-index: 1050;
}

.notification-bell-btn {
    background: transparent;
    border: none;
    padding: 8px;
    font-size: 1.25rem;
    color: #64748b;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    width: 40px;
}

.notification-bell-btn:hover,
.notification-bell-btn.active {
    background-color: #f1f5f9;
    color: #2563eb;
}

.badge-count {
    position: absolute;
    top: 2px;
    right: 2px;
    background-color: #ef4444;
    color: #ffffff;
    font-size: 0.65rem;
    font-weight: 700;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    border: 1.5px solid #ffffff;
}

.badge-dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    background-color: #f59e0b;
    border-radius: 50%;
    border: 1.5px solid #ffffff;
}

.notification-dropdown {
    position: absolute;
    top: 50px;
    right: 0;
    width: 320px;
    max-height: 380px;
    display: flex;
    flex-direction: column;
    z-index: 9999;
}

.dropdown-header-custom {
    background-color: #ffffff;
}

.btn-action-text {
    background: none;
    border: none;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    transition: opacity 0.15s ease;
}

.btn-action-text:hover {
    opacity: 0.8;
}

.notification-item {
    transition: background-color 0.15s ease;
}

.notification-item:hover {
    background-color: #f8fafc;
}

.notification-item.unread {
    background-color: #f0f7ff;
}

.notification-item.unread:hover {
    background-color: #e0f2fe;
}

.notif-icon-circle {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 0.85rem;
}

.notif-icon-circle.success {
    background-color: #dcfce7;
    color: #16a34a;
}

.notif-icon-circle.info {
    background-color: #dbeafe;
    color: #2563eb;
}

.notif-icon-circle.warning {
    background-color: #fef3c7;
    color: #d97706;
}

.notif-icon-circle.danger {
    background-color: #fee2e2;
    color: #dc2626;
}

.unread-dot-indicator {
    width: 6px;
    height: 6px;
    background-color: #3b82f6;
    border-radius: 50%;
    align-self: center;
    flex-shrink: 0;
}

/* Scrollbar styling */
.scrollable-list::-webkit-scrollbar {
    width: 6px;
}

.scrollable-list::-webkit-scrollbar-track {
    background: transparent;
}

.scrollable-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.scrollable-list::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>