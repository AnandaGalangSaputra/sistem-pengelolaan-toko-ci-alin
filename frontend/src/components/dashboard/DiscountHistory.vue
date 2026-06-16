<script setup>
import { useRouter } from 'vue-router'

defineProps({
  discounts: Array
})

defineEmits(['open-add-discount'])

const router = useRouter()

const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

const goToKasir = () => {
  router.push('/dashboard-karyawan/kasir')
}
</script>

<template>
  <div class="card-content-box">
    <div class="box-header d-flex justify-content-between align-items-center mb-3">
      <div>
        <h2 class="box-title">Riwayat Diskon Transaksi</h2>
        <p class="box-subtitle">Daftar potongan harga yang langsung diterapkan pada transaksi kasir.</p>
      </div>
      <div class="d-flex gap-2">
        <button @click="goToKasir" class="btn btn-xs-custom" title="Buka Kasir">
          <i class="bi bi-calculator"></i>
        </button>
        <button @click="$emit('open-add-discount')" class="btn btn-xs-custom" title="Tambah Diskon Cepat">
          <i class="bi bi-plus-lg"></i>
        </button>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table custom-table-mini align-middle mb-0">
        <thead>
          <tr>
            <th>Nama Barang</th>
            <th>Potongan Harga</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="req in discounts" :key="req.id">
            <td class="fw-semibold text-dark">{{ req.item }}</td>
            <td>
              <div class="small">
                <span class="text-decoration-line-through text-muted">{{ formatRupiah(req.original) }}</span>
                <i class="bi bi-arrow-right mx-1 text-primary"></i>
                <span class="text-danger fw-semibold">{{ formatRupiah(req.requested) }}</span>
              </div>
              <div class="text-success small fw-semibold" style="font-size: 0.72rem;">
                Hemat: {{ formatRupiah(req.discountAmount) }}
              </div>
            </td>
            <td>
              <span class="badge-status aktif">
                <i class="bi bi-check-circle-fill text-success me-1"></i>Berhasil
              </span>
            </td>
          </tr>
          <tr v-if="discounts.length === 0">
            <td colspan="3" class="text-center text-muted py-3">Belum ada riwayat diskon transaksi.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
