<template>
  <div class="search-bar" :class="{ 'is-collapsed': isCollapsed }">
    <button class="search-toggle" @click="toggleSearch" :title="isCollapsed ? '展开搜索' : '收起搜索'">
      <svg v-if="isCollapsed" class="search-icon-search" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg v-else class="search-icon-collapse" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </button>
    <div v-if="!isCollapsed" class="search-input-wrapper">
      <input
        ref="inputRef"
        type="text"
        class="search-input"
        placeholder="搜索书名或作者..."
        :value="modelValue"
        @input="handleInput"
        @keydown.enter="handleEnter"
      />
      <button v-if="modelValue" class="search-clear" @click="clearSearch" title="清除搜索">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search'): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isCollapsed = ref(true)

const handleInput = (e: Event) => {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

const handleEnter = () => {
  emit('search')
}

const clearSearch = () => {
  emit('update:modelValue', '')
  inputRef.value?.focus()
}

const toggleSearch = () => {
  if (isCollapsed.value) {
    isCollapsed.value = false
  } else {
    isCollapsed.value = true
    emit('update:modelValue', '')
  }
}

// Auto focus when expanded
watch(isCollapsed, (collapsed) => {
  if (!collapsed && inputRef.value) {
    setTimeout(() => inputRef.value?.focus(), 50)
  }
})

defineExpose({ focus: () => inputRef.value?.focus() })
</script>

<style scoped>
.search-bar {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-bar.is-collapsed {
  flex: 0 0 auto;
  min-width: 0;
  max-width: none;
}

.search-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: 50%;
  border: 1px solid rgba(100, 140, 200, 0.18);
  background: rgba(14, 26, 50, 0.65);
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
}

.search-toggle:hover {
  background: rgba(14, 26, 50, 0.85);
  border-color: rgba(100, 140, 200, 0.35);
  transform: scale(1.05);
}

.search-toggle:active {
  transform: scale(0.95);
}

.search-icon-search {
  width: 20px;
  height: 20px;
  color: #8ea4c4;
}

.search-icon-collapse {
  width: 18px;
  height: 18px;
  color: #c8d8f0;
}

.search-bar:not(.is-collapsed) .search-toggle {
  border-radius: 50% 0 0 50%;
  margin-right: -1px;
}

.search-bar:not(.is-collapsed) .search-toggle .search-icon-collapse {
  color: #8ea4c4;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  height: 48px;
  border-radius: 0 999px 999px 0;
  border: 1px solid rgba(100, 140, 200, 0.18);
  background: rgba(14, 26, 50, 0.65);
  position: relative;
  padding-left: 14px;
}

.search-input {
  width: 100%;
  height: 100%;
  padding: 0 40px 0 8px;
  border: none;
  border-radius: inherit;
  font-size: 15px;
  outline: none;
  background: transparent;
  color: #c8d8f0;
}

.search-input::placeholder {
  color: #5e7294;
}

.search-clear {
  position: absolute;
  right: 14px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(100, 140, 200, 0.2);
  color: #8ea4c4;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.search-clear:hover {
  background: rgba(100, 140, 200, 0.35);
  color: #c8d8f0;
}

.search-clear svg {
  width: 12px;
  height: 12px;
}
</style>
