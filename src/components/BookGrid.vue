<template>
  <div v-if="books.length === 0" class="empty-library">
    <p>书架是空的，点击上方"导入书籍"开始阅读</p>
  </div>
  <div v-else class="book-grid">
    <div
      v-for="book in books"
      :key="book.id"
      class="book-card"
      @click="$emit('bookClick', book.id)"
    >
      <div class="book-cover">
        <img :src="getCoverUrl(book)" alt="封面" />
      </div>
      <div class="book-info">
        <h3 class="book-title" :title="book.title">{{ book.title }}</h3>
        <p class="book-author" v-if="book.author">{{ book.author }}</p>
        <p class="book-meta">{{ book.format.toUpperCase() }} · {{ formatFileSize(book.fileSize) }}</p>
        <p class="book-time" v-if="book.updatedAt">{{ formatTime(book.updatedAt) }}</p>
      </div>
      <button class="delete-btn" @click.stop="confirmDelete(book.id)">
        删除
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BookRecord } from '@/types'

const props = defineProps<{
  books: BookRecord[]
}>()

const emit = defineEmits<{
  (e: 'bookClick', bookId: string): void
  (e: 'bookDelete', bookId: string): void
}>()

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

function confirmDelete(bookId: string) {
  if (confirm('确定要删除这本书吗？相关的书签和笔记也会被删除。')) {
    emit('bookDelete', bookId)
  }
}
</script>

<style scoped>
.empty-library {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
}

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
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.book-cover {
  width: 100%;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  overflow: hidden;
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-info {
  padding: 12px;
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
}

.book-card:hover .delete-btn {
  opacity: 1;
}
</style>
