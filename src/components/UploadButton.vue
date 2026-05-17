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
import { ref } from 'vue'
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

async function importFiles(files: File[]) {
  console.log('[Upload] Importing files:', files.map(f => f.name))
  
  for (const file of files) {
    const format = FormatParserService.getFormat(file.name)
    console.log('[Upload] File format:', format)

    if (!FormatParserService.supportsFormat(format)) {
      alert(`不支持的文件格式：${file.name}`)
      continue
    }

    try {
      console.log('[Upload] Starting to parse:', file.name)
      const parsedBook = await FormatParserService.parse(file)
      console.log('[Upload] Parsed book:', parsedBook.title, parsedBook.content?.length, 'chapters')

      const arrayBuffer = await file.arrayBuffer()
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

      console.log('[Upload] Saving book to storage...')
      await StorageService.saveBook(bookRecord)
      await StorageService.saveParsedBook(parsedBook.id, parsedBook)
      console.log('[Upload] Book saved successfully!')

      emit('book-imported', bookRecord)
    } catch (error) {
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
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  background: #9a9a9a;
  color: #1a1a1a;
  box-shadow: 0 4px 16px rgba(154, 154, 154, 0.3);
  position: relative;
  overflow: hidden;
}

/* Ink drop bloom */
.upload-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  margin: -60px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.12) 30%, transparent 70%);
  transform: scale(0);
  opacity: 0;
  transition: transform 0.6s cubic-bezier(0.08, 0.82, 0.17, 1), opacity 0.4s;
  pointer-events: none;
}

.upload-button:hover::before {
  transform: scale(3);
  opacity: 1;
  box-shadow:
    50px -35px 0 -8px rgba(0,0,0,0.08),
    -40px 30px 0 -6px rgba(0,0,0,0.05),
    60px 40px 0 -14px rgba(0,0,0,0.04),
    -55px -40px 0 -10px rgba(0,0,0,0.06),
    0 -50px 0 -4px rgba(0,0,0,0.03);
}

.upload-button:hover {
  background: #7a7a7a;
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
}

.is-dragging {
  transform: scale(1.03);
  background: #666;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
}

.upload-icon {
  font-size: 48px;
  line-height: 1;
  opacity: 0.7;
  position: relative;
  z-index: 1;
  color: #1a1a1a;
}

.upload-text {
  margin-top: 10px;
  font-size: 24px;
  font-weight: 700;
  font-family: KaiTi, STKaiti, '楷体', serif;
  letter-spacing: 3px;
  position: relative;
  z-index: 1;
  color: #1a1a1a;
}

.upload-hint {
  margin: 6px 0 0;
  font-size: 14px;
  font-weight: 700;
  font-family: 'Times New Roman', Times, KaiTi, STKaiti, '楷体', serif;
  color: rgba(26, 26, 26, 0.5);
  position: relative;
  z-index: 1;
}
</style>
