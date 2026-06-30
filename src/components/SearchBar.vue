<template>
  <div class="search-bar" :class="{ 'is-expanded': isExpanded }">
    <button
      class="search-toggle"
      :class="{ 'is-active': isExpanded }"
      :aria-label="isExpanded ? '收起搜索' : '搜索'"
      :title="isExpanded ? '收起搜索' : '搜索书名或作者'"
      @click="isExpanded ? collapse() : expand()"
    >
      <svg v-if="!isExpanded" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </button>
    <div v-if="isExpanded" class="search-input-wrapper" @keydown.escape="collapse">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <input
        ref="inputRef"
        type="text"
        class="search-input"
        placeholder="搜索书名或作者..."
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isExpanded = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const expand = async () => {
  isExpanded.value = true
  await nextTick()
  inputRef.value?.focus()
}

const collapse = () => {
  // 如果输入框有内容，不清空，只收起
  isExpanded.value = false
  emit('update:modelValue', '')
}
</script>

<style scoped>
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
}

.search-toggle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(100, 140, 200, 0.18);
  background: rgba(14, 26, 50, 0.75);
  color: #8ea4c4;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--qr-transition-fast);
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}

.search-toggle svg {
  width: 18px;
  height: 18px;
}

.search-toggle:hover,
.search-toggle:focus-visible {
  border-color: rgba(124, 179, 245, 0.4);
  color: #c8d8f0;
  background: rgba(14, 26, 50, 0.9);
  box-shadow: 0 0 0 3px rgba(124, 179, 245, 0.15);
}

.search-toggle:active {
  transform: scale(0.95);
}

.search-toggle.is-active {
  border-color: rgba(124, 179, 245, 0.4);
  color: #c8d8f0;
  background: rgba(14, 26, 50, 0.9);
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0;
  width: min(280px, 60vw);
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(100, 140, 200, 0.18);
  background: rgba(14, 26, 50, 0.75);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
  position: relative;
  animation: expandIn 0.25s cubic-bezier(0.2, 0, 0, 1);
  overflow: hidden;
}

@keyframes expandIn {
  from {
    opacity: 0;
    width: 44px;
    transform: translateX(0);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.search-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: #5e7294;
  pointer-events: none;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  height: 100%;
  padding: 0 16px 0 42px;
  border: none;
  border-radius: inherit;
  font-size: 14px;
  outline: none;
  background: transparent;
  color: #c8d8f0;
}

.search-input::placeholder {
  color: #5e7294;
}

.search-input-wrapper:focus-within {
  border-color: rgba(124, 179, 245, 0.45);
  background: rgba(14, 26, 50, 0.9);
  box-shadow: 0 0 0 3px rgba(124, 179, 245, 0.28), 0 2px 12px rgba(0, 0, 0, 0.35);
}

</style>
