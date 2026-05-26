<template>
  <div
    class="reader-core"
    :style="readerStyle"
    @mouseup="handleTextSelection"
    @touchend="handleTextSelection"
  >
    <div v-if="book" class="reader-content" :class="{ 'fullscreen-active': isFullscreen }" v-html="currentContent"></div>
    <div v-else class="loading">加载中...</div>
    <div class="progress-bar" v-if="book">
      <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ParsedBook } from '@/types'

const props = defineProps<{
  book: ParsedBook | null
  fontSize: number
  theme: 'light' | 'dark' | 'green'
  fontWeight: number
  currentChapter: number
  currentPage: number
  isFullscreen: boolean
}>()

const emit = defineEmits<{
  (e: 'page-change', page: number): void
  (e: 'text-select', selection: { text: string; chapterId: string; position: number }): void
  (e: 'progress-update', progress: { chapterId: string; position: number; percentage: number }): void
  (e: 'update:totalPages', pages: number): void
}>()

const progressPercentage = ref(0)

const fontSizeMap: Record<number, string> = {
  1: '12px',
  2: '14px',
  3: '16px',
  4: '18px',
  5: '20px',
}

function getFontWeightStyle(fw: number) {
  // Windows 优化：用多层阴影堆叠模拟真实加粗效果
  if (fw === 1) return { 
    fontWeight: 300,
    textShadow: 'none',
    fontSynthesis: 'none'
  }
  if (fw === 2) return { 
    fontWeight: 400,
    textShadow: `
      -0.3px -0.3px 0 currentColor,
      0.3px -0.3px 0 currentColor,
      -0.3px 0.3px 0 currentColor,
      0.3px 0.3px 0 currentColor
    `,
    fontSynthesis: 'weight'
  }
  if (fw === 3) return { 
    fontWeight: 400,
    textShadow: `
      -0.5px -0.5px 0 currentColor,
      0.5px -0.5px 0 currentColor,
      -0.5px 0.5px 0 currentColor,
      0.5px 0.5px 0 currentColor,
      0 -0.5px 0 currentColor,
      0 0.5px 0 currentColor
    `,
    fontSynthesis: 'weight'
  }
  if (fw === 4) return { 
    fontWeight: 500,
    textShadow: `
      -0.8px -0.8px 0 currentColor,
      0.8px -0.8px 0 currentColor,
      -0.8px 0.8px 0 currentColor,
      0.8px 0.8px 0 currentColor,
      -0.8px 0 0 currentColor,
      0.8px 0 0 currentColor,
      0 -0.8px 0 currentColor,
      0 0.8px 0 currentColor
    `,
    fontSynthesis: 'weight'
  }
  return { 
    fontWeight: 700,
    textShadow: `
      -1px -1px 0 currentColor,
      1px -1px 0 currentColor,
      -1px 1px 0 currentColor,
      1px 1px 0 currentColor,
      -1px 0 0 currentColor,
      1px 0 0 currentColor,
      0 -1px 0 currentColor,
      0 1px 0 currentColor,
      -0.5px -0.5px 0 currentColor,
      0.5px -0.5px 0 currentColor,
      -0.5px 0.5px 0 currentColor,
      0.5px 0.5px 0 currentColor
    `,
    fontSynthesis: 'weight'
  }
}

const themeStyles: Record<string, { bg: string; color: string }> = {
  light: { bg: '#ffffff', color: '#333333' },
  dark: { bg: '#1a1a1a', color: '#e0e0e0' },
  green: { bg: '#e8f5e9', color: '#2e4a2e' },
}

const currentContent = computed(() => {
  if (!props.book || !props.book.content[props.currentChapter]) return ''
  return props.book.content[props.currentChapter].content
})

const readerStyle = computed(() => ({
  fontSize: fontSizeMap[props.fontSize] || '16px',
  backgroundColor: themeStyles[props.theme]?.bg || '#ffffff',
  color: themeStyles[props.theme]?.color || '#333333',
  ...getFontWeightStyle(props.fontWeight),
}))

function handleTextSelection() {
  const selection = window.getSelection()
  if (selection && selection.toString().trim()) {
    emit('text-select', {
      text: selection.toString().trim(),
      chapterId: props.book?.content[props.currentChapter]?.id || '',
      position: props.currentPage,
    })
  }
}

function updateProgress() {
  if (!props.book) return
  const totalChapters = props.book.content.length
  const overallProgress = ((props.currentChapter + 1) / totalChapters) * 100
  progressPercentage.value = Math.min(100, Math.max(0, overallProgress))

  emit('progress-update', {
    chapterId: props.book.content[props.currentChapter]?.id || '',
    position: props.currentPage,
    percentage: progressPercentage.value,
  })
}

watch(() => [props.currentChapter, props.currentPage], () => {
  updateProgress()
})

watch(() => [props.fontSize, props.theme, props.fontWeight], () => {
  updateProgress()
})
</script>

<style scoped>
.reader-core {
  position: relative;
  min-height: 100%;
  padding: 30px 40px;
  line-height: 1.8;
  transition: background-color 0.3s, color 0.3s;
}

  .reader-content {
    max-width: 800px;
    margin: 0 auto;
  }

  .reader-content.fullscreen-active {
    padding: 8px 0;
  }

  .reader-content :deep(p) {
    margin: 0 0 1em;
    text-align: justify;
  }

  .reader-content :deep(h1),
  .reader-content :deep(h2),
  .reader-content :deep(h3) {
    margin: 1.5em 0 0.5em;
    line-height: 1.3;
  }

.reader-content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}

.progress-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background-color: #1890ff;
  transition: width 0.3s;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
