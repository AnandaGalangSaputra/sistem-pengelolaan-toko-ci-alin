<template>
    <div>
        <!-- Overlay backdrop -->
        <transition name="fade">
            <div v-if="show" class="ai-drawer-overlay" @click="$emit('close')"></div>
        </transition>

        <!-- Slide-out Drawer -->
        <transition name="slide">
            <div v-if="show" class="ai-drawer shadow-lg border-start bg-white d-flex flex-column">
                
                <!-- Drawer Header -->
                <div class="drawer-header p-3 border-bottom d-flex justify-content-between align-items-center bg-gradient-ai text-white">
                    <div class="d-flex align-items-center gap-2">
                        <div class="ai-icon-pulse">
                            <i class="bi bi-stars fs-5"></i>
                        </div>
                        <div>
                            <h6 class="fw-bold mb-0 text-white">AI Asisten Toko</h6>
                            <span class="badge bg-light text-primary border-0 small-badge">Gemini AI</span>
                        </div>
                    </div>
                    
                    <div class="d-flex align-items-center gap-1">
                        <!-- Settings Toggle Button -->
                        <button @click="toggleSettings" class="btn btn-icon text-white" :title="showSettings ? 'Kembali ke Chat' : 'Pengaturan AI'">
                            <i class="bi" :class="showSettings ? 'bi-chat-dots-fill' : 'bi-gear-fill'"></i>
                        </button>
                        <!-- Close Button -->
                        <button @click="$emit('close')" class="btn btn-icon text-white" title="Tutup">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>

                <!-- Main Content Body -->
                <div class="drawer-body flex-fill d-flex flex-column position-relative overflow-hidden bg-light-gray">
                    
                    <!-- Settings Panel View -->
                    <div v-if="showSettings" class="settings-panel p-4 flex-fill scrollable-container bg-white">
                        <h6 class="fw-bold mb-3 text-dark d-flex align-items-center gap-2 border-bottom pb-2">
                            <i class="bi bi-sliders text-primary"></i> Pengaturan AI Assistant
                        </h6>
                        
                        <div class="mb-3">
                            <label class="form-label small fw-bold text-secondary">Google AI Studio API Key</label>
                            <div class="input-group input-group-sm">
                                <span class="input-group-text bg-light border-end-0">
                                    <i class="bi bi-key-fill text-muted"></i>
                                </span>
                                <input 
                                    :type="showApiKey ? 'text' : 'password'" 
                                    v-model="apiKey" 
                                    class="form-control form-control-sm border-start-0 ps-1" 
                                    placeholder="Masukkan API Key Anda..." 
                                />
                                <button class="btn btn-outline-secondary border" @click="showApiKey = !showApiKey" type="button">
                                    <i class="bi" :class="showApiKey ? 'bi-eye-slash' : 'bi-eye'"></i>
                                </button>
                            </div>
                            <div class="form-text small mt-1.5 text-muted" style="font-size: 0.72rem; line-height: 1.3;">
                                API Key disimpan secara lokal di browser Anda. Dapatkan API Key gratis di 
                                <a href="https://aistudio.google.com/" target="_blank" class="text-primary text-decoration-underline fw-medium">Google AI Studio</a>.
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label small fw-bold text-secondary">Pilih Model Gemini</label>
                            <select v-model="selectedModel" class="form-select form-select-sm">
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Sangat Cepat - Direkomendasikan)</option>
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ringan & Cepat)</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Kemampuan Analisis Tinggi)</option>
                            </select>
                        </div>

                        <hr class="my-4 text-muted opacity-25" />

                        <div class="d-flex flex-column gap-2">
                            <button @click="clearChat" class="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center gap-2">
                                <i class="bi bi-trash3-fill"></i> Bersihkan Riwayat Chat
                            </button>
                            <button @click="saveSettings" class="btn btn-sm btn-primary mt-2">
                                Simpan & Terapkan
                            </button>
                        </div>
                    </div>

                    <!-- Chat View -->
                    <div v-else class="chat-panel d-flex flex-column flex-fill overflow-hidden">
                        
                        <!-- Scrollable Message List -->
                        <div ref="messageContainer" class="messages-list flex-fill p-3 scrollable-container" @click="handleChatClick">
                            
                            <!-- Initial Welcome State -->
                            <div v-if="messages.length === 0" class="welcome-container text-center py-4 px-3 my-auto d-flex flex-column align-items-center">
                                <div class="welcome-logo-circle mb-3">
                                    <i class="bi bi-stars text-primary fs-2"></i>
                                </div>
                                <h6 class="fw-bold text-dark mb-1">Halo! Saya Asisten POS Anda</h6>
                                <p class="text-secondary small text-center mb-4 px-2" style="font-size: 0.76rem; line-height: 1.5;">
                                    Saya terhubung langsung ke data kasir Anda. Tanyakan saya tentang stok barang, lokasi rak, ringkasan transaksi, atau buat draf promosi WhatsApp.
                                </p>
                                
                                <!-- Suggestions grid -->
                                <div class="suggestions-label text-start w-100 mb-2 small text-secondary fw-semibold">
                                    <i class="bi bi-lightbulb-fill text-warning me-1"></i> Rekomendasi Pertanyaan:
                                </div>
                                <div class="w-100 d-flex flex-column gap-2">
                                    <button 
                                        v-for="(sug, index) in suggestions" 
                                        :key="index"
                                        @click="applySuggestion(sug.prompt)" 
                                        class="btn btn-sm btn-suggestion text-start d-flex align-items-center justify-content-between p-2.5 rounded-3 border bg-white"
                                    >
                                        <span class="small text-dark font-weight-500 text-truncate me-2">{{ sug.title }}</span>
                                        <i class="bi bi-arrow-right-short text-primary"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Render Chat Messages -->
                            <div v-else class="d-flex flex-column gap-3">
                                <div 
                                    v-for="(msg, index) in messages" 
                                    :key="index"
                                    class="d-flex flex-column"
                                    :class="msg.role === 'user' ? 'align-items-end' : 'align-items-start'"
                                >
                                    <div class="d-flex align-items-center gap-1.5 mb-1 text-muted" style="font-size: 0.65rem;">
                                        <i v-if="msg.role === 'model'" class="bi bi-stars text-primary"></i>
                                        <span>{{ msg.role === 'user' ? 'Anda' : 'AI Asisten' }}</span>
                                    </div>
                                    
                                    <div 
                                        class="chat-bubble shadow-sm p-3 rounded-4"
                                        :class="msg.role === 'user' ? 'bg-primary text-white border-primary rounded-tr-0' : 'bg-white text-dark border rounded-tl-0'"
                                    >
                                        <div class="chat-bubble-content" v-html="renderMarkdown(msg.text)"></div>
                                        
                                        <!-- Actions (Copy) for AI messages -->
                                        <div v-if="msg.role === 'model'" class="d-flex justify-content-end border-top mt-2 pt-2 border-light opacity-75">
                                            <button @click="copyText(msg.text, index)" class="btn btn-xs btn-link text-primary p-0 d-flex align-items-center gap-1 small-action-btn">
                                                <i class="bi" :class="copiedIndex === index ? 'bi-check2 text-success' : 'bi-copy'"></i>
                                                <span>{{ copiedIndex === index ? 'Tersalin' : 'Salin' }}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Generating Loading Indicator -->
                                <div v-if="isLoading" class="d-flex flex-column align-items-start">
                                    <div class="d-flex align-items-center gap-1.5 mb-1 text-muted" style="font-size: 0.65rem;">
                                        <i class="bi bi-stars text-primary"></i>
                                        <span>AI Sedang memikirkan jawaban...</span>
                                    </div>
                                    <div class="chat-bubble bg-white text-dark border rounded-tl-0 shadow-sm p-3 rounded-4 d-flex align-items-center gap-2">
                                        <div class="ai-loading-dots">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Chat Input Box -->
                        <div class="chat-input-area p-3 border-top bg-white">
                            <div v-if="!apiKey" class="alert alert-warning py-2 px-3 mb-2 small d-flex justify-content-between align-items-center border-0 rounded-3">
                                <span style="font-size: 0.72rem;"><i class="bi bi-exclamation-triangle-fill me-1"></i> API Key belum diatur!</span>
                                <button @click="showSettings = true" class="btn btn-xs btn-warning border-0 px-2 py-0.5" style="font-size: 0.7rem;">Set Sekarang</button>
                            </div>

                            <form @submit.prevent="sendMessage" class="d-flex gap-2 align-items-end">
                                <textarea 
                                    v-model="inputMessage" 
                                    @keydown.enter.prevent="handleEnterKey"
                                    class="form-control form-control-sm border-2-focus rounded-3 px-3 py-2 scrollable-container" 
                                    rows="1" 
                                    placeholder="Tulis pesan..." 
                                    style="resize: none; max-height: 80px;"
                                    :disabled="isLoading || !apiKey"
                                ></textarea>
                                <button 
                                    type="submit" 
                                    class="btn btn-primary btn-send d-flex align-items-center justify-content-center rounded-3 shadow-sm"
                                    :disabled="isLoading || !apiKey || !inputMessage.trim()"
                                >
                                    <i class="bi bi-send-fill text-white"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { state, restockProduct } from '../../store/store.js'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
    show: Boolean
})

const emit = defineEmits(['close'])

const showSettings = ref(false)
const showApiKey = ref(false)
const apiKey = ref('')
const selectedModel = ref('gemini-2.5-flash')
const inputMessage = ref('')
const isLoading = ref(false)
const messageContainer = ref(null)
const copiedIndex = ref(null)

// Load chat history from session storage if it exists
const messages = ref([])

const suggestions = [
    { title: '📦 List stok kritis / menipis', prompt: 'Tolong beri tahu barang apa saja yang stoknya di bawah batas minimal (kritis/menipis)? Cantumkan nama barang, stok saat ini, batas limit, status, dan raknya.' },
    { title: '🔍 Cari lokasi rak barang', prompt: 'Saya mau cari barang. Tolong sebutkan daftar barang beserta lokasi rak-nya agar mudah ditemukan!' },
    { title: '💰 Keuntungan & Laporan Bulan Ini', prompt: 'Berapa total omset (penjualan) dan keuntungan bersih/laba toko kita untuk bulan ini?' },
    { title: '💬 Draf promo WhatsApp', prompt: 'Tolong buatkan draf pesan broadcast promosi WhatsApp yang menarik untuk salah satu produk di toko yang stoknya cukup. Buat agar pembeli tertarik membeli!' }
]

// Fetch saved settings on mount
onMounted(() => {
    // 1. Get API Key from localStorage
    const savedKey = localStorage.getItem('toko_alin_gemini_api_key')
    if (savedKey) {
        apiKey.value = savedKey
    } else if (import.meta.env.VITE_GEMINI_API_KEY) {
        apiKey.value = import.meta.env.VITE_GEMINI_API_KEY
    }

    // 2. Get Model from localStorage
    const savedModel = localStorage.getItem('toko_alin_gemini_model')
    if (savedModel) {
        selectedModel.value = savedModel
    }

    // 3. Load chat history from sessionStorage
    const savedChat = sessionStorage.getItem('toko_alin_gemini_chat')
    if (savedChat) {
        messages.value = JSON.parse(savedChat)
        scrollToBottom()
    }
})

// Toggle settings view
const toggleSettings = () => {
    showSettings.value = !showSettings.value
}

// Save settings to localStorage
const saveSettings = () => {
    localStorage.setItem('toko_alin_gemini_api_key', apiKey.value)
    localStorage.setItem('toko_alin_gemini_model', selectedModel.value)
    showSettings.value = false
}

// Clear Chat History
const clearChat = () => {
    messages.value = []
    sessionStorage.removeItem('toko_alin_gemini_chat')
    showSettings.value = false
}

// Apply suggestion
const applySuggestion = (prompt) => {
    inputMessage.value = prompt
    sendMessage()
}

// Handle enter key in textarea (submit on Enter, new line on Shift+Enter)
const handleEnterKey = (e) => {
    if (e.shiftKey) {
        // Allow default behavior (new line)
    } else {
        sendMessage()
    }
}

const handleRestockAction = async (productId, name) => {
    const qty = prompt(`Masukkan jumlah barang masuk untuk "${name}" (ID: ${productId}):`)
    if (qty === null) return
    const amount = Number(qty)
    if (isNaN(amount) || amount <= 0) {
        alert('Jumlah restok harus berupa angka positif!')
        return
    }
    
    isLoading.value = true
    try {
        const success = await restockProduct(productId, amount)
        if (success) {
            messages.value.push({
                role: 'model',
                text: `✅ **Sistem**: Berhasil melakukan restok untuk barang **${name}** (ID: ${productId}) sebanyak **${amount}** unit. Stok baru telah diperbarui.`
            })
        }
    } catch (e) {
        console.error(e)
        alert('Gagal melakukan restok barang!')
    } finally {
        isLoading.value = false
        scrollToBottom()
    }
}

const handleChatClick = (e) => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return

    const action = btn.getAttribute('data-action')
    const target = btn.getAttribute('data-target')
    const id = btn.getAttribute('data-id')
    const extra = btn.getAttribute('data-extra')

    if (action === 'nav') {
        router.push(target)
        emit('close')
    } else if (action === 'restock') {
        handleRestockAction(Number(id), extra)
    } else if (action === 'wadraft') {
        state.broadcastDraft = extra
        router.push('/dashboard-karyawan/broadcast')
        emit('close')
    }
}

// Scroll chat to bottom
const scrollToBottom = () => {
    nextTick(() => {
        if (messageContainer.value) {
            messageContainer.value.scrollTop = messageContainer.value.scrollHeight
        }
    })
}

// Watch for show to trigger scroll to bottom when opened
watch(() => props.show, (newVal) => {
    if (newVal) {
        scrollToBottom()
    }
})

// Save chat history to sessionStorage whenever it changes
watch(messages, (newVal) => {
    sessionStorage.setItem('toko_alin_gemini_chat', JSON.stringify(newVal))
}, { deep: true })

// Helper to calculate total financial statistics from all transactions
const financialStats = computed(() => {
    const now = new Date()
    const todayStr = now.toDateString()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let salesToday = 0
    let profitToday = 0
    let cogsToday = 0
    let salesThisMonth = 0
    let profitThisMonth = 0
    let cogsThisMonth = 0
    let salesThisYear = 0
    let profitThisYear = 0
    let cogsThisYear = 0

    // Monthly breakdown for current year
    const monthlyStats = {}

    state.transactions.forEach(t => {
        const tDate = new Date(t.date)
        const tYear = tDate.getFullYear()
        const tMonth = tDate.getMonth()
        
        let totalCOGS = 0
        if (t.details) {
            t.details.forEach(d => {
                const hargaBeli = d.barang ? Number(d.barang.harga_beli) : 0
                totalCOGS += hargaBeli * d.qty
            })
        }
        
        // Profit = revenue (t.total is grand_total) - HPP (totalCOGS)
        const tProfit = t.total - totalCOGS

        // Today
        if (tDate.toDateString() === todayStr) {
            salesToday += t.total
            cogsToday += totalCOGS
            profitToday += tProfit
        }

        // This Month
        if (tYear === currentYear && tMonth === currentMonth) {
            salesThisMonth += t.total
            cogsThisMonth += totalCOGS
            profitThisMonth += tProfit
        }

        // This Year
        if (tYear === currentYear) {
            salesThisYear += t.total
            cogsThisYear += totalCOGS
            profitThisYear += tProfit

            // Monthly breakdown
            const monthKey = tDate.toLocaleDateString('id-ID', { month: 'long' })
            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = { sales: 0, cogs: 0, profit: 0 }
            }
            monthlyStats[monthKey].sales += t.total
            monthlyStats[monthKey].cogs += totalCOGS
            monthlyStats[monthKey].profit += tProfit
        }
    })

    return {
        today: { sales: salesToday, cogs: cogsToday, profit: profitToday },
        thisMonth: { sales: salesThisMonth, cogs: cogsThisMonth, profit: profitThisMonth },
        thisYear: { sales: salesThisYear, cogs: cogsThisYear, profit: profitThisYear },
        monthlyBreakdown: monthlyStats
    }
})

// Helper to construct POS Context for Gemini systemInstruction
const systemContext = computed(() => {
    // 1. Products Context
    const productsList = state.products.map(p => 
        `- ID: ${p.id} | ${p.name} | Stok: ${p.stock}/${p.limit} (Status: ${p.status}) | Harga: Rp${p.price.toLocaleString('id-ID')} | Rak: ${p.rack || 'Belum Diatur'}`
    ).join('\n')

    // 2. Racks Context
    const racksList = state.racks.map(r => 
        `- Rak: ${r.nama_rak} | Keterangan: ${r.keterangan || '-'}`
    ).join('\n')

    // 3. Customers Context
    const customersList = state.customers.map(c => 
        `- ${c.name} (${c.type}) | No.Telp: ${c.phone || '-'}`
    ).join('\n')

    // 4. Transactions Context (Last 10 transactions)
    const transactionsList = state.transactions.slice(0, 10).map(t => 
        `- Trx #${t.kode_transaksi || t.id} | Total: Rp${t.total.toLocaleString('id-ID')} (Diskon: Rp${t.discount.toLocaleString('id-ID')}) | Kasir: ${t.cashierName} | Pelanggan: ${t.customer?.name || 'Umum'} | Item: ${t.details ? t.details.map(d => `${d.barang?.name || 'Barang'} (x${d.qty})`).join(', ') : '-'}`
    ).join('\n')

    // 5. Financial Stats Context
    const stats = financialStats.value
    const currentMonthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    
    let monthlyBreakdownStr = ''
    Object.keys(stats.monthlyBreakdown).forEach(m => {
        const item = stats.monthlyBreakdown[m]
        monthlyBreakdownStr += `- ${m}: Omset Rp${item.sales.toLocaleString('id-ID')} | HPP Rp${item.cogs.toLocaleString('id-ID')} | Laba/Keuntungan Rp${item.profit.toLocaleString('id-ID')}\n`
    })

    const financialContext = `
- HARI INI: Omset Penjualan Rp${stats.today.sales.toLocaleString('id-ID')} | Modal/HPP Rp${stats.today.cogs.toLocaleString('id-ID')} | Keuntungan Bersih Rp${stats.today.profit.toLocaleString('id-ID')}
- BULAN INI (${currentMonthName}): Omset Penjualan Rp${stats.thisMonth.sales.toLocaleString('id-ID')} | Modal/HPP Rp${stats.thisMonth.cogs.toLocaleString('id-ID')} | Keuntungan Bersih/Laba Rp${stats.thisMonth.profit.toLocaleString('id-ID')}
- TAHUN INI (${new Date().getFullYear()}): Omset Penjualan Rp${stats.thisYear.sales.toLocaleString('id-ID')} | Modal/HPP Rp${stats.thisYear.cogs.toLocaleString('id-ID')} | Keuntungan Bersih/Laba Rp${stats.thisYear.profit.toLocaleString('id-ID')}
- RINCIAN BULANAN TAHUN INI:
${monthlyBreakdownStr || '- Belum ada data bulanan untuk tahun ini.'}
`

    return `Anda adalah 'Asisten AI Toko Ce Alin', asisten pintar terintegrasi dengan sistem Point of Sale (POS) Toko Parabot & Sparepart Ce Alin.
Tugas utama Anda adalah membantu kasir dan pemilik toko dalam menjawab pertanyaan, menganalisis stok atau penjualan, dan membuat draf pesan promosi.

INFORMASI DATA TOKO AKTUAL SAAT INI (Gunakan data ini untuk menjawab pertanyaan):
[PRODUK TOKO]
${productsList || 'Tidak ada data produk saat ini.'}

[DAFTAR RAK TOKO]
${racksList || 'Tidak ada data rak saat ini.'}

[PELANGGAN TERDAFTAR]
${customersList || 'Tidak ada data pelanggan saat ini.'}

[RINGKASAN LAPORAN KEUANGAN & LABA-RUGI TOKO]
${financialContext}

[TRANSAKSI TERBARU (Maksimal 10 Trx Terakhir)]
${transactionsList || 'Tidak ada riwayat transaksi hari ini.'}

FORMAT TOMBOL INTERAKTIF:
Anda dapat menyisipkan tombol tindakan interaktif yang dapat diklik oleh pengguna menggunakan format teks khusus berikut (sisipkan di bagian bawah jawaban Anda jika relevan):
1. Tombol Navigasi Menu: [NAV:Nama Tombol:Rute]
   Contoh:
   - Ke menu Kasir: [NAV:Buka Menu Kasir:/dashboard-karyawan/kasir]
   - Ke Data Barang: [NAV:Buka Data Barang:/dashboard-karyawan/data-barang]
   - Ke Daftar Rak: [NAV:Buka Daftar Rak:/dashboard-karyawan/daftar-rak]
   - Ke Laporan Transaksi: [NAV:Buka Laporan Transaksi:/dashboard-karyawan/laporan]
2. Tombol Restok Cepat: [RESTOCK:Nama Tombol:ID_Barang:Nama_Barang]
   Contoh: Jika stok Bearing 6204 NSK (ID: 1) menipis/kritis, tawarkan tombol: [RESTOCK:Restok Bearing 6204 NSK:1:Bearing 6204 NSK]
3. Tombol Terapkan Promo WA: [WADRAFT:Nama Tombol:Isi_Teks_Draft_Promosi]
   Contoh: Jika Anda membuat draf promosi, selalu tawarkan tombol untuk menyalinnya ke menu broadcast: [WADRAFT:Gunakan Draft WA:Halo Pelanggan Setia! Toko Ce Alin menyediakan...]

PANDUAN MENJAWAB:
1. Jika pengguna bertanya tentang barang kritis/menipis, sebutkan produk yang memiliki status "Kritis" atau "Menipis" secara terperinci (Nama, stok saat ini, rak, dan harga). Serta berikan tombol [RESTOCK:Restok Nama_Barang:ID_Barang:Nama_Barang] di sampingnya.
2. Jika pengguna mencari lokasi barang, sebutkan di Rak mana barang tersebut disimpan berdasarkan data [PRODUK TOKO] di atas. Tawarkan tombol navigasi ke [NAV:Buka Daftar Rak:/dashboard-karyawan/daftar-rak] jika relevan.
3. Jika ditanya mengenai analisis transaksi terbaru, buatkan ringkasan yang menarik berdasarkan data [TRANSAKSI TERBARU], dan tawarkan tombol [NAV:Buka Laporan Transaksi:/dashboard-karyawan/laporan].
4. Jika diminta draf pesan promosi WhatsApp, gunakan detail produk dari data toko (nama, harga) dan sesuaikan dengan format template WhatsApp yang ramah, sopan, persuasif, dan mencantumkan nama toko "Toko Parabot & Sparepart Ce Alin". Selalu sertakan tombol [WADRAFT:Kirim via WA Broadcast:Isi_Pesan_Draft_Di_Sini] agar pengguna bisa langsung menyalin dan menggunakannya.
5. Jika pengguna bertanya tentang laporan keuangan toko, total omset/penjualan, HPP (beban modal pokok penjualan), atau keuntungan bersih (laba bersih/profit), gunakan data pada bagian [RINGKASAN LAPORAN KEUANGAN & LABA-RUGI TOKO] di atas untuk menjawab. Jelaskan secara rinci dan tampilkan data omset, HPP, serta keuntungan dengan format mata uang Rupiah secara tepat.
6. Gunakan bahasa Indonesia yang santun, profesional, ringkas, dan langsung menjawab inti pertanyaan. Jangan mengarang data di luar data toko yang disediakan di atas!`
})

// Send Message logic
const sendMessage = async () => {
    const textToSend = inputMessage.value.trim()
    if (!textToSend || isLoading.value || !apiKey.value) return

    // 1. Add user message
    messages.value.push({
        role: 'user',
        text: textToSend
    })
    inputMessage.value = ''
    isLoading.value = true
    scrollToBottom()

    try {
        // 2. Format history for Google Gemini contents structure
        // Convert 'text' key to 'parts: [{ text: ... }]' expected by Gemini API
        const contents = messages.value.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }))

        // 3. API URL for selected model
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel.value}:generateContent?key=${apiKey.value}`

        // 4. Request Payload
        const payload = {
            contents: contents,
            systemInstruction: {
                parts: [{ text: systemContext.value }]
            }
        }

        // 5. Fetch call
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            throw new Error(errData.error?.message || `Gagal menghubungi API Gemini (HTTP ${response.status})`)
        }

        const data = await response.json()
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, saya tidak menerima jawaban dari model AI.'

        // 6. Push AI response
        messages.value.push({
            role: 'model',
            text: aiText
        })

    } catch (error) {
        console.error('Error calling Gemini API:', error)
        messages.value.push({
            role: 'model',
            text: `❌ **Error**: ${error.message || 'Terjadi kesalahan saat menghubungi server Google AI Studio. Pastikan API Key Anda valid dan koneksi internet stabil.'}`
        })
    } finally {
        isLoading.value = false
        scrollToBottom()
    }
}

// Copy Chat Text
const copyText = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
        copiedIndex.value = index
        setTimeout(() => {
            if (copiedIndex.value === index) {
                copiedIndex.value = null
            }
        }, 2000)
    }).catch(err => {
        console.error('Failed to copy text: ', err)
    })
}

// Custom simple markdown to HTML parser
const renderMarkdown = (text) => {
    if (!text) return ''
    
    // First, escape HTML characters to prevent rendering unexpected HTML tags
    let escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    // Parse Interactive Buttons before parsing paragraphs/lines, so they don't get wrapped in other selectors unexpectedly
    // 1. NAV Button: [NAV:ButtonName:Route]
    escaped = escaped.replace(/\[NAV:(.*?):(.*?)\]/g, (match, name, route) => {
        return `<button class="btn btn-sm btn-action-trigger-outline d-inline-flex align-items-center gap-1" data-action="nav" data-target="${route}"><i class="bi bi-box-arrow-in-right"></i> ${name}</button>`
    })

    // 2. RESTOCK Button: [RESTOCK:ButtonName:Id:ProductName]
    escaped = escaped.replace(/\[RESTOCK:(.*?):(.*?):(.*?)\]/g, (match, name, id, prodName) => {
        return `<button class="btn btn-sm btn-action-trigger d-inline-flex align-items-center gap-1" data-action="restock" data-id="${id}" data-extra="${prodName}"><i class="bi bi-plus-circle-fill"></i> ${name}</button>`
    })

    // 3. WADRAFT Button: [WADRAFT:ButtonName:Message]
    escaped = escaped.replace(/\[WADRAFT:(.*?):([\s\S]*?)\]/g, (match, name, msg) => {
        const cleanMsg = msg.replace(/"/g, '&quot;')
        return `<button class="btn btn-sm btn-action-trigger d-inline-flex align-items-center gap-1" data-action="wadraft" data-extra="${cleanMsg}"><i class="bi bi-whatsapp"></i> ${name}</button>`
    })

    const lines = escaped.split('\n')
    let inList = false
    let parsedLines = []
    
    for (let line of lines) {
        let trimmed = line.trim()
        
        // Headers (### atau ## atau #)
        if (trimmed.startsWith('### ')) {
            if (inList) { parsedLines.push('</ul>'); inList = false; }
            parsedLines.push(`<h6 class="fw-bold mt-3 mb-1 text-dark" style="font-size: 0.88rem; letter-spacing: -0.01em;">${trimmed.substring(4)}</h6>`)
        } else if (trimmed.startsWith('## ')) {
            if (inList) { parsedLines.push('</ul>'); inList = false; }
            parsedLines.push(`<h5 class="fw-bold mt-3 mb-2 text-dark" style="font-size: 0.98rem; letter-spacing: -0.01em;">${trimmed.substring(3)}</h5>`)
        } else if (trimmed.startsWith('# ')) {
            if (inList) { parsedLines.push('</ul>'); inList = false; }
            parsedLines.push(`<h4 class="fw-bold mt-3 mb-2 text-dark" style="font-size: 1.08rem; letter-spacing: -0.01em;">${trimmed.substring(2)}</h4>`)
        }
        // Bullet points (- atau *)
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (!inList) {
                parsedLines.push('<ul class="ps-3 mb-2" style="padding-left: 1.2rem !important; list-style-type: disc;">')
                inList = true
            }
            const content = trimmed.substring(2)
            parsedLines.push(`<li class="mb-1" style="font-size: 0.82rem; line-height: 1.45;">${content}</li>`)
        }
        // Empty lines
        else if (trimmed === '') {
            if (inList) {
                parsedLines.push('</ul>')
                inList = false
            }
            parsedLines.push('<div class="py-1"></div>')
        }
        // Standard text lines
        else {
            if (inList) {
                parsedLines.push('</ul>')
                inList = false
            }
            
            // If the line contains a raw button (not text), let's render it directly without wrapping in <p>
            if (trimmed.startsWith('<button')) {
                parsedLines.push(line)
            } else {
                parsedLines.push(`<p class="mb-2" style="font-size: 0.82rem; line-height: 1.5; margin-bottom: 0.5rem;">${line}</p>`)
            }
        }
    }
    
    if (inList) {
        parsedLines.push('</ul>')
    }
    
    let result = parsedLines.join('\n')
    
    // Parse formatting elements (bold, italic, code)
    result = result.replace(/\*\*(.*?)\*\*/g, '<strong class="fw-bold text-dark">$1</strong>')
    result = result.replace(/\*(.*?)\*/g, '<em class="fst-italic">$1</em>')
    result = result.replace(/`(.*?)`/g, '<code class="font-monospace bg-light border text-danger px-1 py-0.5 rounded" style="font-size: 0.76rem; font-weight: 600;">$1</code>')
    
    return result
}
</script>

<style scoped>
.bg-gradient-ai {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%);
}

.ai-drawer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(4px);
    z-index: 1045;
}

.ai-drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 440px;
    max-width: 100vw;
    z-index: 1050;
    box-shadow: -10px 0 30px rgba(15, 23, 42, 0.15) !important;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-header {
    height: 64px;
    flex-shrink: 0;
}

.small-badge {
    font-size: 0.62rem;
    padding: 2px 6px;
    font-weight: 600;
    border-radius: 4px;
}

.ai-icon-pulse {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 2s infinite;
}

.btn-icon {
    background: transparent;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s ease;
}

.btn-icon:hover {
    background-color: rgba(255, 255, 255, 0.15);
}

.bg-light-gray {
    background-color: #f8fafc;
}

.scrollable-container {
    overflow-y: auto;
}

/* Scrollbar styling */
.scrollable-container::-webkit-scrollbar {
    width: 5px;
}
.scrollable-container::-webkit-scrollbar-track {
    background: transparent;
}
.scrollable-container::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}
.scrollable-container::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Chat buble designs */
.chat-bubble {
    max-width: 88%;
    word-break: break-word;
    border: 1px solid transparent;
}

.rounded-tr-0 {
    border-top-right-radius: 0 !important;
}

.rounded-tl-0 {
    border-top-left-radius: 0 !important;
}

.chat-bubble-content :deep(p:last-child) {
    margin-bottom: 0 !important;
}

.small-action-btn {
    font-size: 0.68rem;
    text-decoration: none;
    font-weight: 500;
}

.small-action-btn:hover {
    opacity: 0.8;
}

.btn-suggestion {
    width: 100%;
    transition: all 0.2s ease;
    border-color: #e2e8f0 !important;
}

.btn-suggestion:hover {
    background-color: #f1f5f9 !important;
    border-color: #cbd5e1 !important;
    transform: translateY(-1px);
}

.welcome-logo-circle {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(79, 70, 229, 0.1);
}

.btn-send {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
    border: none !important;
    transition: all 0.2s ease;
}

.btn-send:hover:not(:disabled) {
    transform: scale(1.05);
    opacity: 0.95;
}

.border-2-focus:focus {
    border-color: #7c3aed !important;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15) !important;
}

.btn-xs {
    padding: 2px 6px;
    font-size: 0.72rem;
    border-radius: 4px;
}

/* Loading Dots Animation */
.ai-loading-dots {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
}

.ai-loading-dots span {
    width: 6px;
    height: 6px;
    background-color: #7c3aed;
    border-radius: 50%;
    display: inline-block;
    animation: loading-pulse 1.4s infinite ease-in-out both;
}

.ai-loading-dots span:nth-child(1) {
    animation-delay: -0.32s;
}

.ai-loading-dots span:nth-child(2) {
    animation-delay: -0.16s;
}

/* Transitions */
.slide-enter-from,
.slide-leave-to {
    transform: translateX(100%);
}

.slide-enter-to,
.slide-leave-from {
    transform: translateX(0);
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
    opacity: 1;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
    }
    70% {
        box-shadow: 0 0 0 8px rgba(255, 255, 255, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
}

@keyframes loading-pulse {
    0%, 80%, 100% { 
        transform: scale(0);
        opacity: 0.3;
    }
    40% { 
        transform: scale(1.0);
        opacity: 1;
    }
}

/* AI Interactive Action Buttons styles */
.btn-action-trigger {
    margin: 4px 6px 4px 0;
    padding: 6px 12px;
    font-size: 0.76rem;
    font-weight: 600;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: white !important;
    transition: all 0.2s ease;
    box-shadow: 0 2px 6px rgba(124, 58, 237, 0.18);
    cursor: pointer;
}

.btn-action-trigger:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(124, 58, 237, 0.28);
    opacity: 0.95;
}

.btn-action-trigger-outline {
    margin: 4px 6px 4px 0;
    padding: 6px 12px;
    font-size: 0.76rem;
    font-weight: 600;
    border-radius: 8px;
    border: 1.5px solid #7c3aed;
    background: white;
    color: #7c3aed !important;
    transition: all 0.2s ease;
    cursor: pointer;
}

.btn-action-trigger-outline:hover {
    background-color: #f5f3ff;
    transform: translateY(-1px);
}
</style>
