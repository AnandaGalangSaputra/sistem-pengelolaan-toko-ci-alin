<template>
    <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="whatsapp-button">
        <i class="bi bi-whatsapp me-2"></i>Hubungi Admin
    </a>
</template>

<script setup>
import { computed } from 'vue'
import 'bootstrap-icons/font/bootstrap-icons.css'

const props = defineProps({
    phoneNumber: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        default: 'Halo Admin, saya ingin bertanya.',
    },
})

const whatsappUrl = computed(() => {
    return `https://wa.me/${props.phoneNumber}?text=${encodeURIComponent(
        props.message
    )}`
})
</script>

<style scoped>
.whatsapp-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #25d366;
    color: white;
    text-decoration: none;
    padding: 12px 20px;
    border-radius: 50px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
    z-index: 9999;
}

.whatsapp-button:hover {
    background: #1faa52;
    transform: translateY(-2px);
}
</style>