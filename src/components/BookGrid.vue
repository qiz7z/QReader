<template>
  <div class="book-grid">
    <div
      v-for="book in importingBooks"
      :key="book.id"
      class="book-card importing-card"
    >
      <div class="book-cover importing-cover">
        <div class="import-overlay">
          <svg class="import-icon" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 2v6h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="import-progress-track">
          <div class="import-progress-fill" :style="{ width: (animatedProgress[book.id] ?? 0) + '%' }">
            <div class="import-progress-shimmer"></div>
          </div>
        </div>
      </div>
      <div class="book-info">
        <h3 class="book-title" :title="book.fileName">{{ book.fileName }}</h3>
        <p class="book-meta">{{ book.format.toUpperCase() }}</p>
        <p class="book-time">导入中 {{ Math.round(animatedProgress[book.id] ?? 0) }}%</p>
      </div>
    </div>
    <div
      v-for="book in books"
      :key="book.id"
      class="book-card"
      role="button"
      tabindex="0"
      :aria-label="`打开 ${book.title}`"
      @click="$emit('bookClick', book.id)"
      @keydown.enter.prevent="$emit('bookClick', book.id)"
      @keydown.space.prevent="$emit('bookClick', book.id)"
    >
      <div class="book-cover">
        <img :src="getCoverUrl(book)" alt="封面" />
        <div v-if="book.progress && book.progress.percentage > 0" class="progress-overlay">
          <div class="progress-bar-track">
            <div class="progress-bar-fill" :style="{ width: book.progress.percentage + '%' }"></div>
          </div>
          <span class="progress-text">{{ Math.round(book.progress.percentage) }}%</span>
        </div>
      </div>
      <div class="book-info">
        <h3 class="book-title" :title="book.title">{{ book.title }}</h3>
        <p class="book-author" v-if="book.author">{{ book.author }}</p>
        <p class="book-meta">{{ book.format.toUpperCase() }} · {{ formatFileSize(book.fileSize) }}</p>
        <p class="book-time" v-if="book.progress?.readingTime">{{ formatReadingTime(book.progress.readingTime) }}</p>
        <p class="book-time" v-else-if="book.updatedAt">{{ formatTime(book.updatedAt) }}</p>
      </div>
      <button class="delete-btn" aria-label="删除书籍" title="删除书籍" @click.stop="confirmDelete(book.id)">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <div
      class="book-card import-card"
      :class="{ 'is-dragging': isDragging }"
      role="button"
      tabindex="0"
      aria-label="导入新书"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="$emit('importClick')"
      @keydown.enter.prevent="$emit('importClick')"
      @keydown.space.prevent="$emit('importClick')"
    >
      <div class="book-cover import-cover">
        <div class="import-icon-wrap">
          <svg class="import-icon" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
      <div class="book-info import-info">
        <h3 class="book-title">导入书籍</h3>
        <p class="book-meta">点击或拖拽添加</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import type { BookRecord, ProgressRecord } from '@/types'
import type { ImportingBook } from '@/stores/library'

interface BookWithProgress extends BookRecord {
  progress?: ProgressRecord
}

const props = defineProps<{
  books: BookWithProgress[]
  importingBooks?: ImportingBook[]
}>()

const emit = defineEmits<{
  (e: 'bookClick', bookId: string): void
  (e: 'bookDelete', bookId: string): void
  (e: 'importClick'): void
  (e: 'importDrop', files: FileList): void
}>()

const isDragging = ref(false)

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files.length) {
    emit('importDrop', event.dataTransfer.files)
  }
}

// 平滑进度动画
const animatedProgress = reactive<Record<string, number>>({})
const rafIds = new Map<string, number>()

function animateToTarget(bookId: string, target: number) {
  if (rafIds.has(bookId)) {
    cancelAnimationFrame(rafIds.get(bookId)!)
  }
  const current = animatedProgress[bookId] ?? 0
  if (current === target) return

  const startTime = performance.now()
  const duration = Math.min(Math.abs(target - current) * 12, 600)

  function step(now: number) {
    const elapsed = now - startTime
    const t = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - t, 3)
    animatedProgress[bookId] = current + (target - current) * eased
    if (t < 1) {
      rafIds.set(bookId, requestAnimationFrame(step))
    } else {
      animatedProgress[bookId] = target
      rafIds.delete(bookId)
    }
  }
  rafIds.set(bookId, requestAnimationFrame(step))
}

watch(
  () => props.importingBooks?.map(b => ({ id: b.id, progress: b.progress })),
  (books) => {
    books?.forEach(b => animateToTarget(b.id, b.progress))
  },
  { deep: true }
)

onBeforeUnmount(() => {
  rafIds.forEach(id => cancelAnimationFrame(id))
  // 释放封面 blob URL，防止内存泄漏
  for (const url of coverUrls.values()) URL.revokeObjectURL(url)
  coverUrls.clear()
})

const coverUrls = new Map<string, string>()

function getCoverUrl(book: BookRecord): string {
  let url = coverUrls.get(book.id)
  if (!url) {
    let blob: Blob
    if (book.cover) {
      const mime = detectImageMime(book.cover)
      blob = new Blob([book.cover], { type: mime })
    } else {
      const canvas = document.createElement('canvas')
      const w = 300, h = 420
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!

      let hash = 0
      for (let i = 0; i < book.title.length; i++) {
        hash = book.title.charCodeAt(i) + ((hash << 5) - hash)
      }
      const h1 = Math.abs(hash) % 360
      const h2 = (h1 + 40) % 360

      const gradient = ctx.createLinearGradient(0, 0, w, h)
      gradient.addColorStop(0, `hsl(${h1}, 60%, 45%)`)
      gradient.addColorStop(1, `hsl(${h2}, 50%, 35%)`)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)

      ctx.globalAlpha = 0.08
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(w * 0.8, h * 0.2, 120, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(w * 0.15, h * 0.85, 80, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1

      ctx.fillStyle = '#fff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const maxChars = 12
      const displayTitle = book.title.length > maxChars ? book.title.slice(0, maxChars) + '...' : book.title

      let fontSize = 28
      ctx.font = `bold ${fontSize}px sans-serif`
      while (ctx.measureText(displayTitle).width > w - 40 && fontSize > 16) {
        fontSize -= 2
        ctx.font = `bold ${fontSize}px sans-serif`
      }

      const chars = displayTitle.split('')
      const lines: string[] = []
      let line = ''
      for (const ch of chars) {
        const test = line + ch
        if (ctx.measureText(test).width > w - 40) {
          lines.push(line)
          line = ch
        } else {
          line = test
        }
      }
      if (line) lines.push(line)

      const lineHeight = fontSize * 1.4
      const startY = h / 2 - (lines.length - 1) * lineHeight / 2

      ctx.shadowColor = 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = 6
      ctx.shadowOffsetY = 2

      lines.forEach((l, i) => {
        ctx.fillText(l, w / 2, startY + i * lineHeight)
      })

      blob = canvasToBlob(canvas)
    }
    url = URL.createObjectURL(blob)
    coverUrls.set(book.id, url)
  }
  return url
}

// 通过文件魔数检测图片 MIME 类型
function detectImageMime(buffer: ArrayBuffer): string {
  const arr = new Uint8Array(buffer, 0, 4)
  if (arr[0] === 0xFF && arr[1] === 0xD8) return 'image/jpeg'
  if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) return 'image/png'
  if (arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46) return 'image/gif'
  if (arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46) return 'image/webp'
  if (arr[0] === 0x3C) return 'image/svg+xml'
  return 'image/jpeg' // 默认
}

function canvasToBlob(canvas: HTMLCanvasElement): Blob {
  const dataUrl = canvas.toDataURL('image/png')
  const base64 = dataUrl.split(',')[1]
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new Blob([bytes], { type: 'image/png' })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return Math.floor(diff / (60 * 1000)) + ' 分钟前'
  if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / (60 * 60 * 1000)) + ' 小时前'
  return date.toLocaleDateString()
}

function formatReadingTime(seconds: number): string {
  if (seconds <= 0) return '0 分钟'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}小时${minutes}分钟`
  return `${minutes}分钟`
}

function confirmDelete(bookId: string) {
  if (confirm('确定要删除这本书吗？相关的书签和笔记也会被删除。')) {
    emit('bookDelete', bookId)
  }
}
</script>

<style scoped>
.book-grid {
  display: grid;
  grid-template-columns: repeat(5, 176px);
  gap: 28px 30px;
  justify-content: center;
}

@media (max-width: 768px) {
  .book-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .book-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

.book-card {
  position: relative;
  background: rgba(14, 26, 50, 0.75);
  border-radius: var(--qr-radius-lg);
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(100, 140, 200, 0.08);
  cursor: pointer;
  transition: transform var(--qr-transition), box-shadow var(--qr-transition), border-color var(--qr-transition), background var(--qr-transition);
  border: 1px solid rgba(100, 140, 200, 0.18);
  outline: none;
}

.book-card:hover,
.book-card:focus-visible {
  transform: translateY(-4px);
  box-shadow: 0 6px 24px rgba(70, 120, 200, 0.15), 0 0 0 1px rgba(100, 140, 200, 0.15);
  border-color: rgba(124, 179, 245, 0.25);
  background: rgba(14, 26, 50, 0.9);
}

.book-card:focus-visible {
  box-shadow: 0 0 0 3px rgba(124, 179, 245, 0.28), 0 6px 24px rgba(70, 120, 200, 0.15);
}

.import-card {
  position: relative;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: var(--qr-radius-lg);
  background: linear-gradient(160deg, rgba(30, 27, 75, 0.5) 0%, rgba(45, 40, 90, 0.4) 50%, rgba(30, 27, 75, 0.5) 100%);
  box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.06), inset 0 0 30px rgba(139, 92, 246, 0.03);
  overflow: hidden;
}

.import-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: 
    radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.05), transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(124, 58, 237, 0.04), transparent 50%);
  pointer-events: none;
}

.import-card:hover,
.import-card:focus-visible {
  border-color: rgba(139, 92, 246, 0.4);
  background: linear-gradient(160deg, rgba(30, 27, 75, 0.65) 0%, rgba(45, 40, 90, 0.55) 50%, rgba(30, 27, 75, 0.65) 100%);
  box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.12), 0 0 20px rgba(139, 92, 246, 0.06), inset 0 0 30px rgba(139, 92, 246, 0.05);
  transform: translateY(-2px);
}

.import-card.is-dragging {
  border-color: #a78bfa;
  background: linear-gradient(160deg, rgba(30, 27, 75, 0.75) 0%, rgba(45, 40, 90, 0.65) 50%, rgba(30, 27, 75, 0.75) 100%);
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2), 0 0 24px rgba(139, 92, 246, 0.1);
  transform: translateY(-2px);
}

.import-cover {
  background: linear-gradient(135deg, rgba(30, 27, 75, 0.4), rgba(45, 40, 90, 0.3));
  display: flex;
  align-items: center;
  justify-content: center;
}

.import-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(124, 58, 237, 0.08));
  border: 1.5px solid rgba(139, 92, 246, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--qr-transition);
  box-shadow: 0 0 16px rgba(139, 92, 246, 0.06);
}

.import-card:hover .import-icon-wrap,
.import-card:focus-visible .import-icon-wrap {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.22), rgba(124, 58, 237, 0.18));
  border-color: rgba(139, 92, 246, 0.45);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.12);
  transform: scale(1.05);
}

.import-card.is-dragging .import-icon-wrap {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.28), rgba(124, 58, 237, 0.22));
  border-color: #a78bfa;
  box-shadow: 0 0 24px rgba(139, 92, 246, 0.18);
  transform: scale(1.08);
}

.import-icon {
  width: 24px;
  height: 24px;
  color: #a78bfa;
  opacity: 0.9;
}

.import-info {
  background: linear-gradient(180deg, rgba(30, 27, 75, 0.3), rgba(45, 40, 90, 0.2));
}

.import-info .book-title {
  color: #d4d0f0;
  font-weight: 600;
}

.import-info .book-meta {
  color: #a5a0d4;
  font-style: normal;
}

.book-cover {
  width: 100%;
  height: 242px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a2540, #0f1a30);
  overflow: hidden;
  position: relative;
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  box-shadow: inset 0 0 0 1px rgba(191, 149, 63, 0.1);
}

.progress-overlay {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-bar-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  overflow: hidden;
  backdrop-filter: blur(2px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #7cb3f5, #5a9cf4);
  transition: width 0.3s ease;
  border-radius: 999px;
  box-shadow: 0 0 8px rgba(124, 179, 245, 0.42);
}

.progress-text {
  font-size: 11px;
  color: #c8d8f0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  text-align: left;
  font-weight: 600;
  font-family: Georgia, serif;
  letter-spacing: 0.5px;
}

.book-info {
  padding: 14px 14px 16px;
  background: linear-gradient(180deg, rgba(14, 26, 50, 0.85), rgba(14, 26, 50, 0.75));
}

.import-info {
  background: linear-gradient(180deg, rgba(30, 27, 75, 0.7), rgba(45, 40, 90, 0.6));
}

.import-info .book-title {
  color: #c8d8f0;
  font-weight: 600;
}

.import-info .book-meta {
  color: #8ea4c4;
  font-style: normal;
}

.book-title {
  margin: 0 0 5px;
  font-size: 14px;
  color: #c8d8f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
}

.book-author {
  margin: 0 0 6px;
  font-size: 12px;
  color: #8ea4c4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-style: normal;
}

.book-meta {
  margin: 0 0 3px;
  font-size: 12px;
  color: #5e7294;
}

.book-time {
  margin: 0;
  font-size: 11px;
  color: #5e7294;
}

.delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 34px;
  height: 34px;
  padding: 0;
  background: rgba(14, 26, 50, 0.85);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.18);
  border-radius: 999px;
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--qr-transition-fast), background var(--qr-transition-fast), transform var(--qr-transition-fast);
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.delete-btn svg {
  width: 17px;
  height: 17px;
}

.book-card:hover .delete-btn,
.book-card:focus-within .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(248, 113, 113, 0.2);
  transform: scale(1.04);
}

.importing-card {
  cursor: default;
}

.importing-card:hover {
  transform: none;
  box-shadow: var(--qr-shadow-sm);
}

.importing-cover {
  position: relative;
  background: linear-gradient(135deg, #f8efe2 0%, #e9dcc9 100%);
  flex-direction: column;
  gap: 8px;
}

.import-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #8b7355;
}

.import-icon {
  width: 36px;
  height: 36px;
  opacity: 0.5;
}

.import-progress-track {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(139, 115, 85, 0.12);
}

.import-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--qr-primary), #60a5fa);
  border-radius: 0 999px 999px 0;
  position: relative;
  overflow: hidden;
}

.import-progress-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.importing-card .book-time {
  color: #bf953f;
}
</style>
