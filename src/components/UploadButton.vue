<template>
  <div
    class="upload-card"
    :class="{ 'is-dragging': isDragging }"
    role="button"
    tabindex="0"
    aria-label="导入电子书文件"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    @click="triggerFileInput"
    @keydown.enter.prevent="triggerFileInput"
    @keydown.space.prevent="triggerFileInput"
  >
    <div class="upload-card-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="upload-card-text">导入书籍</div>
    <div class="upload-card-hint">拖拽或点击添加</div>
    <input
      ref="fileInput"
      type="file"
      accept=".txt,.md,.epub,.pdf,.mobi,.docx"
      multiple
      hidden
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useLibraryStore } from '@/stores/library'
import { FormatParserService } from '@/services/FormatParserService'
import { StorageService } from '@/services/StorageService'
import type { BookRecord } from '@/types'

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const emit = defineEmits<{
  (e: 'book-imported', book: BookRecord): void
}>()

const triggerFileInput = () => {
  fileInput.value?.click()
}

defineExpose({
  triggerFileInput
})

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    importFiles(Array.from(target.files))
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    importFiles(Array.from(event.dataTransfer.files))
  }
}

const libraryStore = useLibraryStore()

async function importFiles(files: File[]) {
  for (const file of files) {
    const format = FormatParserService.getFormat(file.name)

    if (!FormatParserService.supportsFormat(format)) {
      alert(`不支持的文件格式：${file.name}`)
      continue
    }

    // 立即创建占位书卡
    const importId = libraryStore.addImportingBook(file.name)
    await nextTick()

    try {
      libraryStore.updateImportProgress(importId, 5)

      // 读取文件（模拟渐进进度）
      const arrayBuffer = await file.arrayBuffer()
      libraryStore.updateImportProgress(importId, 30)
      await nextTick()

      // 解析文件
      const parsedBook = await FormatParserService.parse(file)
      libraryStore.updateImportProgress(importId, 65)
      await nextTick()

      // 模拟解析完成后的过渡
      libraryStore.updateImportProgress(importId, 80)
      await nextTick()

      // 保存数据
      const bookRecord: BookRecord = {
        id: parsedBook.id,
        title: parsedBook.title,
        author: parsedBook.author,
        format,
        fileSize: file.size,
        cover: parsedBook.cover,
        rawFile: arrayBuffer,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await StorageService.saveBook(bookRecord)
      await StorageService.saveParsedBook(parsedBook.id, parsedBook)
      libraryStore.updateImportProgress(importId, 95)
      await nextTick()

      // 完成：移除导入中卡片，emit 事件让父组件添加正式卡片
      libraryStore.removeImportingBook(importId)
      emit('book-imported', bookRecord)
    } catch (error) {
      libraryStore.removeImportingBook(importId)
      console.error('[Upload] Error importing file:', error)
      alert(`解析文件失败：${file.name}\n${(error as Error).message}`)
    }
  }
}
</script>

<style scoped>
.upload-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(14, 26, 50, 0.75);
  border-radius: var(--qr-radius-lg);
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(100, 140, 200, 0.08);
  cursor: pointer;
  transition: transform var(--qr-transition), box-shadow var(--qr-transition), border-color var(--qr-transition), background var(--qr-transition);
  border: 1px dashed rgba(100, 140, 200, 0.25);
  outline: none;
  aspect-ratio: 3 / 4.2;
  padding: 16px;
}

.upload-card:hover,
.upload-card:focus-visible {
  transform: translateY(-4px);
  box-shadow: 0 6px 24px rgba(70, 120, 200, 0.15), 0 0 0 1px rgba(124, 179, 245, 0.25);
  border-color: rgba(124, 179, 245, 0.42);
  background: rgba(14, 26, 50, 0.9);
}

.upload-card:focus-visible {
  box-shadow: 0 0 0 3px rgba(124, 179, 245, 0.28), 0 6px 24px rgba(70, 120, 200, 0.15);
}

.is-dragging {
  transform: translateY(-2px) scale(1.01);
  background: rgba(14, 26, 50, 0.9);
  border-color: #7cb3f5;
  box-shadow: 0 0 0 3px rgba(124, 179, 245, 0.28), 0 6px 24px rgba(70, 120, 200, 0.15);
}

.upload-card-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #7cb3f5;
  background: rgba(124, 179, 245, 0.1);
  border: 1px dashed rgba(124, 179, 245, 0.3);
}

.upload-card-icon svg {
  width: 28px;
  height: 28px;
}

.upload-card-text {
  font-size: 14px;
  font-weight: 700;
  color: #c8d8f0;
  text-align: center;
}

.upload-card-hint {
  font-size: 12px;
  color: #5e7294;
  text-align: center;
}
</style>
