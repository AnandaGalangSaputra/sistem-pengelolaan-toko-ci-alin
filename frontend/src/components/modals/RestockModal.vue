<script setup>
import { ref, watch } from 'vue'
 
const props = defineProps({
  show: Boolean,
  product: Object,
  isLoading: {
    type: Boolean,
    default: false
  }
})
 
const emit = defineEmits(['close', 'confirm'])
 
const restockAmount = ref(10)
 
watch(() => props.product, (newProd) => {
  if (newProd) {
    restockAmount.value = 10
  }
})
 
const handleConfirm = () => {
  if (restockAmount.value <= 0) return
  emit('confirm', props.product.id, restockAmount.value)
}
</script>
 
<template>
  <transition name="modal">
    <div v-if="show" class="modal-backdrop-custom">
      <div class="modal-card-custom animate-fade-in">
        <div class="modal-header-custom border-bottom">
          <h3 class="modal-title-custom">
            <i class="bi bi-plus-square-fill text-primary me-2"></i>Restok Kuantitas Barang
          </h3>
          <button @click="$emit('close')" :disabled="isLoading" class="btn-close-custom">
            <i class="bi bi-x"></i>
          </button>
        </div>
 
        <div class="modal-body-custom">
          <div class="alert alert-info border-0 rounded-3 py-2 px-3 mb-3 small d-flex align-items-center">
            <i class="bi bi-info-circle-fill me-2 fs-5"></i>
            <span>Barang ini berlokasi di <strong>{{ product?.rack }}</strong>. Pastikan fisik barang sudah diletakkan di rak yang tepat.</span>
          </div>
 
          <div class="mb-3">
            <label class="form-label-style">Nama Barang</label>
            <input type="text" :value="product?.name" class="form-control-style bg-light" readonly />
          </div>
 
          <div class="row g-3 mb-3">
            <div class="col-6">
              <label class="form-label-style">Stok Saat Ini</label>
              <div class="input-display">{{ product?.stock }} unit</div>
            </div>
            <div class="col-6">
              <label class="form-label-style">Batas Minimum Stok</label>
              <div class="input-display">{{ product?.limit }} unit</div>
            </div>
          </div>
 
          <div class="mb-3">
            <label for="restockAmt" class="form-label-style">Jumlah Tambahan Stok</label>
            <input type="number" id="restockAmt" v-model.number="restockAmount" min="1" class="form-control-style" placeholder="Jumlah unit..." :disabled="isLoading" />
          </div>
        </div>
 
        <div class="modal-footer-custom border-top">
          <button @click="$emit('close')" :disabled="isLoading" class="btn-cancel">Batal</button>
          <button @click="handleConfirm" :disabled="isLoading" class="btn-confirm">
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            {{ isLoading ? 'Menyimpan...' : 'Simpan Stok Baru' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>
