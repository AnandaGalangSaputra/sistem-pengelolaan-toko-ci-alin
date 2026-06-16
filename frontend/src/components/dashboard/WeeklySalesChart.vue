<script setup>
import { ref } from 'vue'

defineProps({
  weeklySalesData: Array
})

const hoveredPoint = ref(null)

const handlePointHover = (point, index) => {
  hoveredPoint.value = { ...point, index }
}

const clearPointHover = () => {
  hoveredPoint.value = null
}

const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <div class="card-content-box">
    <div class="box-header mb-3">
      <h2 class="box-title">Tren Penjualan Mingguan</h2>
      <p class="box-subtitle">Nilai transaksi harian Toko Ce Alin minggu ini.</p>
    </div>

    <div class="chart-container position-relative">
      <!-- Custom SVG Chart -->
      <svg viewBox="0 0 500 180" class="w-100 h-auto">
        <defs>
          <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2563EB" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#2563EB" stop-opacity="0" />
          </linearGradient>
        </defs>
        <!-- Grid Lines -->
        <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f3f5" stroke-width="1" />
        <line x1="40" y1="60" x2="480" y2="60" stroke="#f1f3f5" stroke-width="1" />
        <line x1="40" y1="100" x2="480" y2="100" stroke="#f1f3f5" stroke-width="1" />
        <line x1="40" y1="140" x2="480" y2="140" stroke="#f1f3f5" stroke-width="1" />

        <!-- Chart Line Area -->
        <path d="M 40 140 L 40 120 L 113 90 L 186 105 L 260 75 L 333 60 L 406 25 L 480 35 L 480 140 Z"
          fill="url(#chart-grad)" />

        <!-- Chart Line -->
        <path d="M 40 120 L 113 90 L 186 105 L 260 75 L 333 60 L 406 25 L 480 35" fill="none"
          stroke="#2563EB" stroke-width="3" stroke-linecap="round" />

        <!-- Dots & Interaction Areas -->
        <g v-for="(pt, idx) in weeklySalesData" :key="idx">
          <!-- Active hovered glow -->
          <circle v-if="hoveredPoint && hoveredPoint.index === idx" :cx="40 + idx * 73.3"
            :cy="140 - (pt.sales / 3500000) * 120" r="9" fill="#2563EB" fill-opacity="0.3" />
          <!-- Line dot -->
          <circle :cx="40 + idx * 73.3" :cy="140 - (pt.sales / 3500000) * 120" r="5" fill="#2563EB"
            stroke="#ffffff" stroke-width="1.5" class="chart-dot" @mouseover="handlePointHover(pt, idx)"
            @mouseleave="clearPointHover" />
          <!-- Invisible wider area for easier hover -->
          <circle :cx="40 + idx * 73.3" :cy="140 - (pt.sales / 3500000) * 120" r="18" fill="transparent"
            style="cursor: pointer;" @mouseover="handlePointHover(pt, idx)" @mouseleave="clearPointHover" />
        </g>
      </svg>

      <!-- Y-Axis Mini helper labels inside chart -->
      <div class="chart-y-helper small text-muted">
        <span style="top: 15px;">Rp 3.0M</span>
        <span style="top: 55px;">Rp 2.0M</span>
        <span style="top: 95px;">Rp 1.0M</span>
      </div>

      <!-- X-Axis Labels -->
      <div class="d-flex justify-content-between px-4 mt-2 text-muted small fw-semibold">
        <span v-for="pt in weeklySalesData" :key="pt.day">{{ pt.day.slice(0, 3) }}</span>
      </div>

      <!-- Inline Tooltip on Hover -->
      <div v-if="hoveredPoint" class="chart-tooltip shadow-sm rounded-3 py-1.5 px-3"
        :style="{ left: (40 + hoveredPoint.index * 73.3) - 60 + 'px', bottom: '100px' }">
        <div class="small text-secondary">{{ hoveredPoint.day }}</div>
        <div class="fw-bold text-dark">{{ formatRupiah(hoveredPoint.sales) }}</div>
      </div>
    </div>
  </div>
</template>
