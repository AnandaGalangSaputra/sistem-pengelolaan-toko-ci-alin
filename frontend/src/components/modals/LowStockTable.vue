<template>
    <div class="col-12 col-xl-7">
        <div class="card-content-box h-100">
            <div class="box-header d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 class="box-title">Stok Barang Menipis & Lokasi Rak</h2>
                    <p class="box-subtitle">Berikut daftar produk dengan kuantitas di bawah batas aman. Hubungi tim
                        gudang
                        untuk restok di lokasi rak.</p>
                </div>
                <span class="badge bg-danger rounded-pill">{{ lowStockCount }} Barang</span>
            </div>

            <div class="table-responsive">
                <table class="table custom-table table-hover align-middle">
                    <thead>
                        <tr>
                            <th scope="col" style="width: 50px;">No</th>
                            <th scope="col">Nama Barang</th>
                            <th scope="col">Lokasi Rak</th>
                            <th scope="col" class="text-center">Sisa Stok</th>
                            <th scope="col">Status</th>
                            <th scope="col" class="text-end">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(product, idx) in products" :key="product.id">
                            <td>{{ idx + 1 }}</td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="product-avatar me-2"
                                        :class="{ 'bg-light-danger': product.status === 'Kritis', 'bg-light-warning': product.status === 'Menipis' }">
                                        {{ product.name.charAt(0) }}
                                    </div>
                                    <div>
                                        <span class="product-name d-block fw-semibold">{{ product.name }}</span>
                                        <span class="text-muted small">{{ formatRupiah(product.price) }}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="badge bg-light text-dark fw-bold border py-1.5 px-2">
                                    <i class="bi bi-tag-fill text-primary me-1"></i>{{ product.rack }}
                                </span>
                            </td>
                            <td class="text-center fw-bold text-dark">
                                {{ product.stock }} unit
                            </td>
                            <td>
                                <span class="badge-status" :class="product.status.toLowerCase()">
                                    {{ product.status }}
                                </span>
                            </td>
                            <td class="text-end">
                                <button @click="$emit('restock', product)"
                                    class=" btn btn-sm btn-outline-primary-custom rounded-pill">
                                    <i class="bi bi-plus-lg me-1"></i>Restok
                                </button>
                            </td>
                        </tr>
                        <tr v-if="products.length === 0">
                            <td colspan="6" class="text-center py-5">
                                <i class="bi bi-check-circle text-success fs-1 d-block mb-2"></i>
                                <span class="text-muted fw-semibold">Luar biasa! Tidak ada stok barang yang kritis hari
                                    ini.</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    products: Array,
    lowStockCount: Number,
    formatRupiah: Function
})

defineEmits(['restock'])
</script>
