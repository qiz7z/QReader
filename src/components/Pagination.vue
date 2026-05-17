<template>
  <div class="pagination">
    <button class="page-btn" :disabled="currentChapter <= 0" @click="$emit('prev')">
      上一章
    </button>
    <span class="page-info">
      {{ book?.toc[currentChapter]?.title || book?.content[currentChapter]?.title || `第 ${currentChapter + 1} 章` }}
    </span>
    <span class="page-num">{{ currentChapter + 1 }} / {{ totalChapters }}</span>
    <button class="page-btn" :disabled="currentChapter >= totalChapters - 1" @click="$emit('next')">
      下一章
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ParsedBook } from '@/types'

defineProps<{
  currentChapter: number
  totalChapters: number
  book?: ParsedBook | null
}>()

defineEmits<{
  (e: 'prev'): void
  (e: 'next'): void
}>()
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  border-top: 1px solid #eee;
  background-color: inherit;
  flex-wrap: wrap;
}

.page-btn {
  padding: 8px 20px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.page-btn:hover:not(:disabled) {
  background-color: #40a9ff;
}

.page-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #333;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-num {
  font-size: 13px;
  color: #999;
  min-width: 60px;
  text-align: center;
}

@media (max-width: 600px) {
  .pagination {
    gap: 8px;
    padding: 10px;
  }

  .page-btn {
    padding: 6px 14px;
    font-size: 13px;
  }

  .page-info {
    max-width: 200px;
    font-size: 13px;
  }
}
</style>
