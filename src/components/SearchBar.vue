<template>
  <div class="search-bar">
    <input
      type="text"
      class="search-input"
      placeholder="搜索书名或作者..."
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
}

.search-input {
  padding: 8px 16px;
  border: 1px solid #1890ff;
  border-radius: 6px;
  font-size: 14px;
  width: 240px;
  outline: none;
  transition: all 0.2s;
  background: rgba(245, 230, 200, 0.35);
  color: #3d2a00;
}

.search-input::placeholder {
  color: rgba(139, 115, 85, 0.6);
}

.search-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.15);
}
</style>
