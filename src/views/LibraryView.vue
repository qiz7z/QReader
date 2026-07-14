<template>
  <div class="library-view qr-starfield" :class="`theme-${readerStore.theme}`">
    <header class="library-header">
      <div class="header-left">
        <button class="home-btn" @click="goHome" title="返回首页">
          <svg class="home-icon" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 22V12h6v10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="home-text">首頁</span>
        </button>
        <div class="brand">
          <div class="logo-wrapper">
            <img src="/qreader-icon-transparent.png" alt="QReader" class="logo-image" />
          </div>
          <div class="brand-text">
            <h1 class="brand-title">
              <span class="brand-title-text">QReader</span>
              <span class="brand-title-glow"></span>
            </h1>
            <p class="brand-subtitle">我的书库</p>
          </div>
        </div>
        <SearchBar v-model="searchQuery" @update:modelValue="handleSearch" />
      </div>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-label">总阅读时长</span>
          <span class="stat-value">{{ formatReadingTime(totalReadingTime) }}</span>
        </div>
      </div>
      <div class="header-actions">
        <button class="import-btn" @click="triggerImport" title="导入书籍">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <path d="M12 3v12m0-12 4 4m-4-4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5 14v3a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="clear-all-btn" @click="handleClearAll" title="清除所有数据">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </header>
    <input
      ref="fileInputRef"
      type="file"
      accept=".txt,.md,.epub,.pdf,.mobi,.docx"
      multiple
      hidden
      @change="handleFileSelect"
    />
    <main class="library-content">
      <BookGrid
        v-if="!isLoading"
        :books="filteredBooksWithProgress"
        :importing-books="importingBooks"
        :class="{ 'has-books': hasBooks }"
        @book-click="handleBookClick"
        @book-delete="handleBookDelete"
        @import-click="triggerImport"
        @import-drop="handleImportDrop"
      />
    </main>

    <!-- 清除数据弹窗 -->
    <Teleport to="body">
      <div v-if="showClearModal" class="modal-overlay" @click.self="showClearModal = false">
        <div class="modal-box">
          <h3 class="modal-title">清除数据</h3>
          <p class="modal-desc">选择要清除的数据类型，此操作不可撤销。</p>
          <div class="modal-options">
            <label class="modal-option">
              <input type="checkbox" v-model="clearOptions.books" />
              <div class="option-content">
                <span class="option-label">全部书籍</span>
                <span class="option-hint">书籍文件及关联的书签、笔记和进度</span>
              </div>
            </label>
            <label class="modal-option">
              <input type="checkbox" v-model="clearOptions.bookmarks" />
              <div class="option-content">
                <span class="option-label">书签</span>
                <span class="option-hint">仅删除所有书签</span>
              </div>
            </label>
            <label class="modal-option">
              <input type="checkbox" v-model="clearOptions.notes" />
              <div class="option-content">
                <span class="option-label">笔记</span>
                <span class="option-hint">仅删除所有笔记</span>
              </div>
            </label>
            <label class="modal-option">
              <input type="checkbox" v-model="clearOptions.progress" />
              <div class="option-content">
                <span class="option-label">阅读进度</span>
                <span class="option-hint">仅清除所有阅读进度</span>
              </div>
            </label>
            <label class="modal-option">
              <input type="checkbox" v-model="clearOptions.settings" />
              <div class="option-content">
                <span class="option-label">阅读设置</span>
                <span class="option-hint">重置字体、主题等设置</span>
              </div>
            </label>
          </div>
          <div class="modal-actions">
            <button class="modal-btn cancel" @click="showClearModal = false">取消</button>
            <button class="modal-btn confirm" :disabled="!hasClearSelection" @click="executeClear">确认清除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useReaderStore } from '@/stores/reader'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore } from '@/stores/library'
import { StorageService } from '@/services/StorageService'
import { FormatParserService } from '@/services/FormatParserService'
import BookGrid from '@/components/BookGrid.vue'
import SearchBar from '@/components/SearchBar.vue'
import type { BookRecord, ProgressRecord } from '@/types'

interface BookWithProgress extends BookRecord {
  progress?: ProgressRecord
}

const router = useRouter()
const libraryStore = useLibraryStore()
const readerStore = useReaderStore()

const importingBooks = computed(() => libraryStore.importingBooks)
const hasBooks = computed(() => libraryStore.books.length > 0)
const isLoading = ref(true)
const booksWithProgress = ref<BookWithProgress[]>([])

const goHome = () => {
  router.push('/')
}

const searchQuery = ref('')
const totalReadingTime = ref(0)

async function loadTotalReadingTime() {
  totalReadingTime.value = await StorageService.getTotalReadingTime()
}

const filteredBooksWithProgress = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return booksWithProgress.value

  return booksWithProgress.value.filter(book =>
    book.title.toLowerCase().includes(query) ||
    book.author.toLowerCase().includes(query)
  )
})

const fileInputRef = ref<HTMLInputElement | null>(null)

const triggerImport = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    importFiles(Array.from(target.files))
  }
}

const handleImportDrop = (files: FileList) => {
  importFiles(Array.from(files))
}

async function importFiles(files: File[]) {
  for (const file of files) {
    const format = FormatParserService.getFormat(file.name)

    if (!FormatParserService.supportsFormat(format)) {
      alert(`不支持的文件格式：${file.name}`)
      continue
    }

    const importId = libraryStore.addImportingBook(file.name)
    await nextTick()

    try {
      libraryStore.updateImportProgress(importId, 5)

      const arrayBuffer = await file.arrayBuffer()
      libraryStore.updateImportProgress(importId, 30)
      await nextTick()

      const parsedBook = await FormatParserService.parse(file)
      libraryStore.updateImportProgress(importId, 65)
      await nextTick()

      libraryStore.updateImportProgress(importId, 80)
      await nextTick()

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

      libraryStore.removeImportingBook(importId)
      handleBookImported(bookRecord)
    } catch (error) {
      libraryStore.removeImportingBook(importId)
      console.error('[Upload] Error importing file:', error)
      alert(`解析文件失败：${file.name}\n${(error as Error).message}`)
    }
  }
}

const handleBookImported = async (book: BookRecord) => {
  libraryStore.addBook(book)
  const progress = await StorageService.getProgress(book.id)
  booksWithProgress.value.unshift({ ...book, progress })
}

const handleBookClick = (bookId: string) => {
  router.push({ name: 'reader', params: { id: bookId } })
}

const handleBookDelete = (bookId: string) => {
  libraryStore.removeBook(bookId)
  booksWithProgress.value = booksWithProgress.value.filter(b => b.id !== bookId)
}

const handleSearch = (query: string) => {
  libraryStore.setSearchQuery(query)
}

const handleClearAll = () => {
  showClearModal.value = true
}

const showClearModal = ref(false)
const clearOptions = reactive({
  books: false,
  bookmarks: false,
  notes: false,
  progress: false,
  settings: false,
})

const hasClearSelection = computed(() =>
  clearOptions.books || clearOptions.bookmarks || clearOptions.notes || clearOptions.progress || clearOptions.settings
)

async function executeClear() {
  const selectedBooks = clearOptions.books
  if (selectedBooks) {
    await StorageService.clearBooks()
    libraryStore.resetBooks()
    booksWithProgress.value = []
  }
  if (clearOptions.bookmarks) await StorageService.clearBookmarks()
  if (clearOptions.notes) await StorageService.clearNotes()
  if (clearOptions.progress) await StorageService.clearProgress()
  if (clearOptions.settings) await StorageService.clearSettings()

  showClearModal.value = false
  Object.assign(clearOptions, { books: false, bookmarks: false, notes: false, progress: false, settings: false })

  if (selectedBooks) {
    await loadBooks()
  }
}

onMounted(() => {
  loadBooks()
  // 延迟加载，确保 ReaderView 的异步保存已完成
  setTimeout(() => loadTotalReadingTime(), 50)
  // 监听窗口焦点变化，确保返回书库时阅读时长数据最新
  window.addEventListener('focus', handleWindowFocus)
})

onBeforeUnmount(() => {
  window.removeEventListener('focus', handleWindowFocus)
})

async function handleWindowFocus() {
  await loadTotalReadingTime()
}

async function loadBooks() {
  isLoading.value = true
  await libraryStore.loadBooks()

  const allBooks = libraryStore.books
  const progressPromises = allBooks.map(async (book) => {
    const progress = await StorageService.getProgress(book.id)
    return { ...book, progress } as BookWithProgress
  })

  booksWithProgress.value = await Promise.all(progressPromises)
  isLoading.value = false
}

function formatReadingTime(seconds: number): string {
  if (seconds <= 0) return '0 分钟'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}小时${minutes}分钟`
  return `${minutes}分钟`
}
</script>

<style scoped>
/* ============================================
   月光星空主题 — LibraryView
   ============================================ */
.library-view {
  max-width: none;
  min-height: 100dvh;
  padding: 28px 40px 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #c8d8f0;
  position: relative;
  font-family: 'STKaiti', '华文楷体', 'Kaiti SC', 'KaiTi', serif;
  font-size: 15px;
}

/* ============================================
   顶部 Header
   ============================================ */
.library-header {
  flex-shrink: 0;
  max-width: 1000px;
  margin: 0 auto 28px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  gap: 16px;
  border-radius: 16px;
  border: 1px solid rgba(100, 140, 200, 0.18);
  background: rgba(14, 26, 50, 0.75);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(100, 140, 200, 0.08);
  backdrop-filter: blur(18px) saturate(1.08);
  -webkit-backdrop-filter: blur(18px) saturate(1.08);
  z-index: 2;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.home-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid rgba(100, 140, 200, 0.18);
  border-radius: 999px;
  background: rgba(14, 26, 50, 0.75);
  color: #c8d8f0;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}

.home-btn:hover,
.home-btn:focus-visible {
  background: rgba(14, 26, 50, 0.9);
  border-color: rgba(100, 140, 200, 0.3);
  color: #fff;
  transform: translateY(-1px);
}

.home-icon {
  width: 18px;
  height: 18px;
  transition: all 0.25s;
}

.home-btn:hover .home-icon {
  transform: scale(1.05);
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.logo-wrapper {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-image {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  padding: 4px;
  background: rgba(14, 26, 50, 0.55);
  filter: drop-shadow(0 0 10px rgba(124, 179, 245, 0.35))
    drop-shadow(0 3px 8px rgba(0, 0, 0, 0.25));
}

.brand-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}

.brand-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  font-family: 'STLiti', '华文隶书', 'Playfair Display', 'Georgia', serif;
  letter-spacing: 2px;
  line-height: 1.1;
  position: relative;
  display: inline-block;
}

.brand-title-text {
  background: linear-gradient(
    105deg,
    #90b8e0 0%,
    #d8e8ff 18%,
    #7cb3f5 36%,
    #e8f0ff 50%,
    #7cb3f5 64%,
    #d8e8ff 82%,
    #5e90c8 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 0.5px rgba(124, 179, 245, 0.25);
  filter:
    drop-shadow(0 1px 0 rgba(255, 255, 255, 0.2))
    drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5))
    drop-shadow(0 0 20px rgba(124, 179, 245, 0.45));
  animation: shine 5s ease-in-out infinite;
}

.brand-title::before {
  content: '\2726';
  position: absolute;
  top: -10px;
  left: -18px;
  font-size: 12px;
  color: #7cb3f5;
  text-shadow: 0 0 8px rgba(124, 179, 245, 0.6);
  animation: starFloat 4s ease-in-out infinite;
}

.brand-title::after {
  content: '\2726';
  position: absolute;
  bottom: -10px;
  right: -18px;
  font-size: 12px;
  color: #7cb3f5;
  text-shadow: 0 0 8px rgba(124, 179, 245, 0.6);
  animation: starFloat 4s ease-in-out infinite reverse;
}

.brand-title-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140%;
  height: 140%;
  background: radial-gradient(ellipse at center, rgba(124, 179, 245, 0.2) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
  animation: glowPulse 3s ease-in-out infinite;
}

.brand-subtitle {
  margin: 0;
  font-size: 15px;
  color: #8ea4c4;
  font-weight: 500;
  letter-spacing: 0.1em;
}

/* Stats */
.header-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 52px;
  padding: 8px 16px;
  border: 1px solid rgba(100, 140, 200, 0.18);
  border-radius: var(--qr-radius-md);
  background: rgba(14, 26, 50, 0.75);
}

.stat-label {
  font-size: 13px;
  color: #8ea4c4;
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #c8d8f0;
  font-family: inherit;
  font-variant-numeric: tabular-nums;
}

/* Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 1 auto;
  justify-content: flex-end;
}

.import-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(100, 140, 200, 0.18);
  border-radius: 999px;
  background: rgba(14, 26, 50, 0.75);
  color: #7cb3f5;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}

.import-btn:hover,
.import-btn:focus-visible {
  background: rgba(14, 26, 50, 0.9);
  border-color: rgba(124, 179, 245, 0.42);
  color: #a8d0ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(70, 120, 200, 0.15);
}

.import-btn:active {
  transform: scale(0.96);
}

.clear-all-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(248, 113, 113, 0.2);
  border-radius: 999px;
  background: rgba(14, 26, 50, 0.75);
  color: #f87171;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}

.clear-all-btn:hover,
.clear-all-btn:focus-visible {
  background: rgba(248, 113, 113, 0.15);
  border-color: rgba(248, 113, 113, 0.35);
  color: #fca5a5;
  transform: translateY(-1px);
}

.clear-all-btn:active {
  transform: scale(0.96);
}

/* ============================================
   内容区
   ============================================ */
.library-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 24px;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
}

.empty-library {
  padding: 52px 24px;
  border: 1px dashed rgba(100, 140, 200, 0.2);
  border-radius: var(--qr-radius-xl);
  background: rgba(14, 26, 50, 0.75);
  color: #8ea4c4;
  font-style: normal;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
  text-align: center;
}

.empty-library h2 {
  margin: 0 0 10px;
  color: #c8d8f0;
  font-size: 22px;
}

.empty-library p {
  margin: 0;
  line-height: 1.7;
}

/* ============================================
   清除数据弹窗
   ============================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}

.modal-box {
  background: rgba(14, 26, 50, 0.95);
  border: 1px solid rgba(100, 140, 200, 0.2);
  border-radius: var(--qr-radius-xl);
  padding: 28px;
  width: 520px;
  max-width: 90vw;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
  font-family: inherit;
}

.modal-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: #c8d8f0;
  letter-spacing: 1px;
}

.modal-desc {
  margin: 0 0 20px;
  font-size: 15px;
  color: #8ea4c4;
}

.modal-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.modal-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.15s;
}

.modal-option:hover {
  background: rgba(124, 179, 245, 0.1);
  border-color: rgba(124, 179, 245, 0.25);
}

.modal-option input[type="checkbox"] {
  margin-top: 2px;
  width: 18px;
  height: 18px;
  accent-color: #7cb3f5;
  flex-shrink: 0;
}

.option-content {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: baseline;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.option-label {
  font-size: 16px;
  font-weight: 600;
  color: #c8d8f0;
  white-space: nowrap;
  flex-shrink: 0;
}

.option-hint {
  font-size: 13px;
  color: #8ea4c4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-btn {
  padding: 8px 20px;
  min-height: 40px;
  border-radius: 999px;
  font-size: 15px;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.modal-btn.cancel {
  background: rgba(139, 115, 85, 0.1);
  color: #8ea4c4;
}

.modal-btn.cancel:hover {
  background: rgba(139, 115, 85, 0.18);
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: #fff;
  box-shadow: 0 8px 18px rgba(220, 38, 38, 0.25);
}

.modal-btn.confirm:hover {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.modal-btn.confirm:disabled {
  background: linear-gradient(135deg, #d4c9a8, #c4b68e);
  box-shadow: none;
  cursor: not-allowed;
  color: rgba(255, 255, 255, 0.6);
}

/* ============================================
   动画
   ============================================ */
@keyframes shine {
  0%, 100% { background-position: 0% center; }
  50% { background-position: 100% center; }
}

@keyframes starFloat {
  0%, 100% {
    transform: scale(1) rotate(0deg);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2) rotate(180deg);
    opacity: 0.9;
  }
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* ============================================
   响应式
   ============================================ */
@media (max-width: 860px) {
  .library-header {
    align-items: stretch;
  }

  .header-stats {
    margin-left: 0;
  }

  .header-actions {
    width: 100%;
    justify-content: stretch;
  }

  .header-left :deep(.search-bar) {
    flex: 1;
    width: 100%;
  }
}

@media (max-width: 600px) {
  .library-view {
    padding: 18px 14px 36px;
  }

  .library-header {
    border-radius: var(--qr-radius-lg);
  }

  .header-left,
  .header-actions {
    flex-wrap: wrap;
  }
}
</style>
