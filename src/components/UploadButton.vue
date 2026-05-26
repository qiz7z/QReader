<template>
  <div
    class="upload-button"
    :class="{ 'is-dragging': isDragging }"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    @click="triggerFileInput"
  >
    <span class="upload-icon">+</span>
    <span class="upload-text">导入书籍</span>
    <p class="upload-hint">支持 TXT、EPUB、PDF、MOBI、DOCX、MD</p>
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
.upload-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 200px;
  padding: 32px 24px;
  border: 2px solid rgba(191, 149, 63, 0.3);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  background: linear-gradient(135deg, rgba(255, 250, 240, 0.8), rgba(245, 230, 200, 0.6));
  color: #3a2a10;
  box-shadow: 0 4px 16px rgba(191, 149, 63, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  position: relative;
  overflow: hidden;
}

.upload-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  margin: -60px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(191, 149, 63, 0.4) 0%, rgba(191, 149, 63, 0.12) 30%, transparent 70%);
  transform: scale(0);
  opacity: 0;
  transition: transform 0.6s cubic-bezier(0.08, 0.82, 0.17, 1), opacity 0.4s;
  pointer-events: none;
}

.upload-button:hover::before {
  transform: scale(3);
  opacity: 1;
  box-shadow:
    50px -35px 0 -8px rgba(191, 149, 63, 0.08),
    -40px 30px 0 -6px rgba(191, 149, 63, 0.05),
    60px 40px 0 -14px rgba(191, 149, 63, 0.04),
    -55px -40px 0 -10px rgba(191, 149, 63, 0.06),
    0 -50px 0 -4px rgba(191, 149, 63, 0.03);
}

.upload-button:hover {
  background: linear-gradient(135deg, rgba(255, 255, 250, 0.9), rgba(250, 240, 220, 0.8));
  border-color: rgba(191, 149, 63, 0.5);
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(191, 149, 63, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}

.is-dragging {
  transform: scale(1.03);
  background: linear-gradient(135deg, rgba(255, 255, 250, 0.95), rgba(245, 240, 230, 0.9));
  border-color: rgba(191, 149, 63, 0.6);
  box-shadow: 0 8px 32px rgba(191, 149, 63, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.7);
}

.upload-icon {
  font-size: 48px;
  line-height: 1;
  opacity: 0.7;
  position: relative;
  z-index: 1;
  color: #5a3f2a;
  font-weight: 300;
}

.upload-text {
  margin-top: 10px;
  font-size: 24px;
  font-weight: 700;
  font-family: KaiTi, STKaiti, '楷体', serif;
  letter-spacing: 3px;
  position: relative;
  z-index: 1;
  color: #3a2a10;
  text-shadow: 0 1px 2px rgba(191, 149, 63, 0.2);
}

.upload-hint {
  margin: 6px 0 0;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Times New Roman', Times, KaiTi, STKaiti, '楷体', serif;
  color: rgba(58, 42, 16, 0.5);
  position: relative;
  z-index: 1;
  font-style: italic;
}
</style>
