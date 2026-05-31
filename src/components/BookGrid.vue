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
      @click="$emit('bookClick', book.id)"
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
      <button class="delete-btn" @click.stop="confirmDelete(book.id)">
        删除
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, reactive, watch } from 'vue'
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
}>()

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
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}小时${minutes}分钟`
  if (minutes > 0) return `${minutes}分钟`
  return `${Math.floor(seconds)}秒`
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
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
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
  background: linear-gradient(135deg, #fffef8, #fffdf0);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(139, 115, 85, 0.12), inset 0 0 0 1px rgba(191, 149, 63, 0.08);
  cursor: pointer;
  transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
  border: 1px solid rgba(191, 149, 63, 0.1);
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(191, 149, 63, 0.2), inset 0 0 0 1px rgba(191, 149, 63, 0.15);
  border-color: rgba(191, 149, 63, 0.25);
}

.book-cover {
  width: 100%;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #d4c8b0, #c4b498);
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
  height: 3px;
  background: rgba(58, 42, 16, 0.3);
  border-radius: 2px;
  overflow: hidden;
  backdrop-filter: blur(2px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #c9a84c, #fcf6ba, #bf953f);
  transition: width 0.3s ease;
  border-radius: 2px;
  box-shadow: 0 0 6px rgba(191, 149, 63, 0.4);
}

.progress-text {
  font-size: 11px;
  color: #fff;
  text-shadow: 0 1px 3px rgba(58, 42, 16, 0.8), 0 0 8px rgba(191, 149, 63, 0.5);
  text-align: left;
  font-weight: 600;
  font-family: Georgia, serif;
  letter-spacing: 0.5px;
}

.book-info {
  padding: 12px;
  background: linear-gradient(135deg, rgba(255, 254, 248, 0.9), rgba(249, 245, 232, 0.7));
}

.book-title {
  margin: 0 0 4px;
  font-size: 14px;
  color: #3a2a10;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'KaiTi', 'STKaiti', '楷体', serif;
  font-weight: 600;
}

.book-author {
  margin: 0 0 4px;
  font-size: 12px;
  color: #6b5340;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-style: italic;
}

.book-meta {
  margin: 0 0 2px;
  font-size: 12px;
  color: #8b7355;
  font-family: 'Times New Roman', Times, serif;
}

.book-time {
  margin: 0;
  font-size: 11px;
  color: #a89578;
  font-style: italic;
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  background-color: rgba(139, 90, 43, 0.9);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s, background-color 0.2s;
  z-index: 1;
  font-family: KaiTi, STKaiti, '楷体', serif;
}

.book-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background-color: rgba(91, 59, 28, 0.95);
  box-shadow: 0 2px 8px rgba(139, 90, 43, 0.3);
}

.book-title {
  margin: 0 0 4px;
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  margin: 0 0 4px;
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-meta {
  margin: 0 0 2px;
  font-size: 12px;
  color: #999;
}

.book-time {
  margin: 0;
  font-size: 11px;
  color: #bbb;
}

.book-title {
  margin: 0 0 4px;
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  margin: 0 0 4px;
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-meta {
  margin: 0 0 2px;
  font-size: 12px;
  color: #999;
}

.book-time {
  margin: 0;
  font-size: 11px;
  color: #bbb;
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  background-color: rgba(255, 77, 79, 0.9);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 1;
}

.book-card:hover .delete-btn {
  opacity: 1;
}

.importing-card {
  cursor: default;
}

.importing-card:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.importing-cover {
  position: relative;
  background: linear-gradient(135deg, #f5f0eb 0%, #e8e0d0 100%);
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
  background: linear-gradient(90deg, #bf953f, #fcf6ba, #aa771c);
  border-radius: 0 2px 2px 0;
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
