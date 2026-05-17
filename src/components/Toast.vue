<template>
  <div v-if="visible" class="toast-container" :class="type">
    <span class="toast-icon">{{ icon }}</span>
    <span class="toast-message">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const visible = ref(false)
const message = ref('')
const type = ref<'success' | 'error' | 'info'>('info')

const icons = {
  success: '✓',
  error: '✗',
  info: 'ℹ',
}

const icon = computed(() => icons[type.value])

function show(msg: string, t: 'success' | 'error' | 'info' = 'info') {
  message.value = msg
  type.value = t
  visible.value = true
  setTimeout(() => {
    visible.value = false
  }, 3000)
}

defineExpose({ show })
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.3s;
}

.toast-container.success {
  background-color: #52c41a;
}

.toast-container.error {
  background-color: #ff4d4f;
}

.toast-container.info {
  background-color: #1890ff;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    top: 10px;
  }
  to {
    opacity: 1;
    top: 20px;
  }
}
</style>
