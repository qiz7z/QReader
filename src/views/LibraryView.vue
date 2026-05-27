<template>
  <div class="library-view" :class="`theme-${readerStore.theme}`">
    <!-- 魔法粒子背景 -->
    <div class="magic-particles">
      <div class="particle" v-for="i in 20" :key="i" :style="particleStyle(i)"></div>
    </div>
    
    <!-- 顶部装饰条 -->
    <div class="library-ornament">
      <span class="ornament-line"></span>
      <span class="ornament-center">
        <svg class="ornament-icon" viewBox="0 0 40 40" fill="none">
          <!-- 平铺的书籍图标 -->
          <path d="M6 8 C6 6, 8 4, 12 4 L20 4 L20 36 L12 36 C8 36, 6 34, 6 32 Z" stroke="#c9a84c" stroke-width="1.5" fill="none"/>
          <path d="M20 4 L34 4 C36 4, 38 6, 38 8 L38 32 C38 34, 36 36, 34 36 L20 36" stroke="#c9a84c" stroke-width="1.5" fill="none"/>
          <path d="M10 10 L16 10" stroke="#c9a84c" stroke-width="1.2" stroke-linecap="round"/>
          <path d="M10 14 L16 14" stroke="#c9a84c" stroke-width="1.2" stroke-linecap="round"/>
          <path d="M10 18 L16 18" stroke="#c9a84c" stroke-width="1.2" stroke-linecap="round"/>
          <path d="M24 10 L34 10" stroke="#c9a84c" stroke-width="1.2" stroke-linecap="round"/>
          <path d="M24 14 L34 14" stroke="#c9a84c" stroke-width="1.2" stroke-linecap="round"/>
          <path d="M24 18 L34 18" stroke="#c9a84c" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </span>
      <h1 class="brand-title">QReader</h1>
      <span class="ornament-line"></span>
    </div>
    
    <header class="library-header">
      <div class="header-left">
        <button class="home-btn" @click="goHome" title="返回首页">
          <svg class="home-icon" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 22V12h6v10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="home-text">首页</span>
        </button>
        <div class="brand">
          <svg class="logo-icon" viewBox="0 0 40 40" fill="none">
            <!-- 魔法书图标 -->
            <path d="M8 8 C8 6, 10 4, 14 4 L32 4 C34 4, 36 6, 36 8 L36 32 C36 34, 34 36, 32 36 L14 36 C10 36, 8 34, 8 32 Z" stroke="#c9a84c" stroke-width="1.5" fill="none"/>
            <path d="M14 4 L14 36" stroke="#c9a84c" stroke-width="1.5"/>
            <path d="M18 10 L28 10" stroke="#c9a84c" stroke-width="1.2" stroke-linecap="round"/>
            <path d="M18 15 L28 15" stroke="#c9a84c" stroke-width="1.2" stroke-linecap="round"/>
            <path d="M18 20 L26 20" stroke="#c9a84c" stroke-width="1.2" stroke-linecap="round"/>
            <path d="M18 25 L26 25" stroke="#c9a84c" stroke-width="1.2" stroke-linecap="round"/>
            <!-- 魔法星芒 -->
            <path d="M30 8 L32 4 L34 8 L38 10 L34 12 L32 16 L30 12 L26 10 Z" fill="#1890ff" opacity="0.6"/>
          </svg>
          <h1 class="brand-name">我的藏书阁</h1>
        </div>
      </div>
      <div class="header-actions">
        <SearchBar v-model="searchQuery" @update:modelValue="handleSearch" />
        <button class="clear-all-btn" @click="handleClearAll" title="清除所有数据">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </header>
    <main class="library-content">
      <UploadButton @book-imported="handleBookImported" />
      <BookGrid
        v-if="hasBooks"
        :books="filteredBooksWithProgress"
        :importing-books="importingBooks"
        @book-click="handleBookClick"
        @book-delete="handleBookDelete"
      />
      <div v-if="!hasBooks && !isLoading" class="empty-library">
        <p>书架是空的，点击上方"导入书籍"开始阅读</p>
      </div>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore } from '@/stores/library'
import { StorageService } from '@/services/StorageService'
import UploadButton from '@/components/UploadButton.vue'
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

const filteredBooksWithProgress = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return booksWithProgress.value
  
  return booksWithProgress.value.filter(book =>
    book.title.toLowerCase().includes(query) ||
    book.author.toLowerCase().includes(query)
  )
})

// 魔法粒子随机样式生成
function particleStyle(_index: number) {
  const delay = Math.random() * 5
  const duration = 3 + Math.random() * 4
  const left = Math.random() * 100
  const size = 2 + Math.random() * 4
  return {
    '--delay': `${delay}s`,
    '--duration': `${duration}s`,
    '--left': `${left}%`,
    '--size': `${size}px`,
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
})

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
</script>

<style scoped>
/* ============================================
   魔法粒子背景
   ============================================ */
@keyframes float {
  0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
}

.library-view {
  min-height: 100vh;
  padding: 32px 24px 48px;
  background: 
    linear-gradient(180deg, rgba(15, 20, 31, 0.85) 0%, rgba(26, 31, 46, 0.85) 50%, rgba(37, 32, 48, 0.85) 100%),
    url('/background.png');
  background-size: cover;
  background-position: center;
  color: #e8e4d0;
  position: relative;
  overflow-x: hidden;
}

.magic-particles {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.particle {
  position: absolute;
  left: var(--left);
  top: var(--top);
  width: var(--size);
  height: var(--size);
  background: radial-gradient(circle, rgba(191, 149, 63, 0.6) 0%, transparent 70%);
  border-radius: 50%;
  animation: float var(--duration) ease-in infinite;
  animation-delay: var(--delay);
  box-shadow: 0 0 10px rgba(191, 149, 63, 0.4);
}

/* ============================================
   装饰分割线
   ============================================ */
.decorative-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
}

.line-segment {
  width: 80px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #c9a84c, transparent);
  box-shadow: 0 0 8px rgba(191, 149, 63, 0.3);
}

.line-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c9a84c;
  position: relative;
  box-shadow: 0 0 10px rgba(191, 149, 63, 0.6);
  animation: dotGlow 3s ease-in-out infinite;
}

@keyframes dotGlow {
  0%, 100% { box-shadow: 0 0 10px rgba(191, 149, 63, 0.6); }
  50% { box-shadow: 0 0 16px rgba(191, 149, 63, 1); }
}

.line-dot::before,
.line-dot::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #c9a84c;
  opacity: 0.5;
}

.line-dot::before {
  top: -6px;
}

.line-dot::after {
  bottom: -6px;
}

/* ============================================
   装饰光晕
   ============================================ */
.bg-glow {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(191, 149, 63, 0.15) 0%, transparent 70%);
  filter: blur(40px);
  animation: glowFloat 20s ease-in-out infinite;
}

.glow-1 {
  top: -150px;
  right: -100px;
  animation-delay: -5s;
}

.glow-2 {
  bottom: -150px;
  left: -100px;
  background: radial-gradient(circle, rgba(184, 134, 11, 0.12) 0%, transparent 70%);
  animation-delay: -10s;
}

@keyframes glowFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -40px) scale(1.1); }
  66% { transform: translate(-30px, 30px) scale(0.9); }
}

/* ============================================
   主要内容区域
   ============================================ */
.content-section {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.section-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  font-family: 'Times New Roman', Times, serif;
  color: #c9a84c;
  letter-spacing: 2px;
}

.section-actions {
  display: flex;
  gap: 12px;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
  background: rgba(45, 53, 72, 0.5);
  border: 1px solid rgba(191, 149, 63, 0.15);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.empty-state-icon {
  width: 64px;
  height: 64px;
  color: #c9a84c;
  opacity: 0.7;
  margin-bottom: 24px;
}

.empty-state-title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 600;
  font-family: 'Times New Roman', Times, serif;
  color: #e8e4d0;
  letter-spacing: 1px;
}

.empty-state-description {
  margin: 0 0 32px;
  font-size: 14px;
  color: #b8a888;
  line-height: 1.6;
}

.empty-state .upload-button {
  padding: 16px 32px;
  border: 1px solid rgba(191, 149, 63, 0.3);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(191, 149, 63, 0.2) 0%, rgba(170, 119, 28, 0.2) 100%);
  color: #c9a84c;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(191, 149, 63, 0.3);
  letter-spacing: 2px;
  font-family: 'Times New Roman', Times, serif;
}

.empty-state .upload-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(191, 149, 63, 0.4);
  background: linear-gradient(135deg, rgba(191, 149, 63, 0.3) 0%, rgba(170, 119, 28, 0.3) 100%);
  border-color: rgba(191, 149, 63, 0.5);
}

.brand-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(191, 149, 63, 0.2) 0%, rgba(170, 119, 28, 0.2) 100%);
  border: 2px solid rgba(191, 149, 63, 0.4);
  box-shadow: 0 0 30px rgba(191, 149, 63, 0.3);
}

.brand-icon {
  width: 56px;
  height: 56px;
  color: #c9a84c;
  filter: drop-shadow(0 0 10px rgba(191, 149, 63, 0.3));
}

.brand-title {
  font-size: 36px;
  font-weight: 700;
  font-family: 'Times New Roman', Times, serif;
  background: linear-gradient(135deg, #c9a84c 0%, #bf953f 50%, #aa771c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 6px;
  filter: drop-shadow(0 2px 8px rgba(191, 149, 63, 0.4));
}

@keyframes float {
  0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
}

@keyframes shimmer {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 6px rgba(191, 149, 63, 0.4); }
  50% { box-shadow: 0 0 14px rgba(191, 149, 63, 0.8); }
}

.library-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.library-view::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  background-image:
    linear-gradient(180deg, rgba(15, 20, 31, 0.85) 0%, rgba(26, 31, 46, 0.85) 50%, rgba(37, 32, 48, 0.85) 100%),
    url('/background.png');
  background-size: cover;
  background-position: center;
  animation: bgDrift 8s ease-in-out infinite;
}

/* 魔法粒子背景 */
.magic-particles {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  left: var(--left);
  bottom: -10px;
  width: var(--size);
  height: var(--size);
  background: radial-gradient(circle, rgba(191, 149, 63, 0.6) 0%, transparent 70%);
  border-radius: 50%;
  animation: float var(--duration) ease-in infinite;
  animation-delay: var(--delay);
}

.library-ornament {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.ornament-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, #c9a84c, #bf953f, #c9a84c, transparent);
  box-shadow: 0 0 8px rgba(191, 149, 63, 0.3);
}

.ornament-center {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, rgba(191, 149, 63, 0.1), rgba(191, 149, 63, 0.05));
  border: 1px solid rgba(191, 149, 63, 0.3);
  border-radius: 50%;
  animation: glow 3s ease-in-out infinite;
  flex-shrink: 0;
}

.ornament-icon {
  width: 56px;
  height: 56px;
  filter: drop-shadow(0 0 4px rgba(191, 149, 63, 0.5));
}

.brand-title {
  margin: 0 16px;
  font-size: 36px;
  font-weight: 700;
  font-family: 'Times New Roman', Times, serif;
  background: linear-gradient(135deg, #c9a84c 0%, #bf953f 50%, #aa771c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 4px;
  text-shadow: none;
  filter: drop-shadow(0 2px 4px rgba(191, 149, 63, 0.4));
  white-space: nowrap;
}

.library-header {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px 24px;
  border-radius: 12px;
  border: 1px solid rgba(191, 149, 63, 0.2);
  background: linear-gradient(135deg, rgba(255, 254, 248, 0.9), rgba(249, 245, 232, 0.7));
  box-shadow: 0 4px 16px rgba(139, 115, 85, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
}

.library-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #c9a84c, #bf953f, #c9a84c, transparent);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.home-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid rgba(139, 90, 43, 0.3);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(255, 250, 240, 0.8), rgba(245, 230, 200, 0.6));
  color: #5a3f2a;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  font-family: KaiTi, STKaiti, '楷体', serif;
  box-shadow: 0 2px 4px rgba(139, 90, 43, 0.1);
  position: relative;
  overflow: hidden;
}

.home-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent, rgba(191, 149, 63, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.25s;
}

.home-btn:hover::before {
  opacity: 1;
}

.home-btn:hover {
  background: linear-gradient(135deg, rgba(255, 255, 250, 0.95), rgba(250, 240, 220, 0.8));
  border-color: rgba(191, 149, 63, 0.4);
  color: #3a2a10;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(191, 149, 63, 0.2);
}

.home-icon {
  width: 18px;
  height: 18px;
  transition: all 0.25s;
  position: relative;
  z-index: 1;
}

.home-btn:hover .home-icon {
  transform: scale(1.05);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.logo-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(191, 149, 63, 0.3));
}

.brand-name {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 2px;
  font-family: 'KaiTi', 'STKaiti', '楷体', serif;
  background: linear-gradient(135deg, #3a2a10 0%, #5a3f2a 50%, #2d1f10 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: flex-end;
}

.clear-all-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(139, 90, 43, 0.3);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(245, 230, 200, 0.5));
  color: #5a3f2a;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(139, 90, 43, 0.1);
}

.clear-all-btn:hover {
  background: linear-gradient(135deg, rgba(255, 255, 250, 0.8), rgba(250, 240, 220, 0.7));
  border-color: rgba(191, 149, 63, 0.4);
  color: #3a2a10;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(191, 149, 63, 0.2);
}

.clear-all-btn:active {
  transform: scale(0.98);
}

.library-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.empty-library {
  text-align: center;
  padding: 60px 20px;
  color: #8b7355;
  font-size: 16px;
  font-style: italic;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(90, 70, 40, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(3px);
}

.modal-box {
  background:
    radial-gradient(ellipse 80% 50% at 20% 20%, rgba(191, 149, 63, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse 60% 60% at 80% 80%, rgba(191, 149, 63, 0.05) 0%, transparent 60%),
    linear-gradient(160deg, #faf6ef 0%, #f5efe4 100%);
  border: 1px solid rgba(191, 149, 63, 0.25);
  border-radius: 12px;
  padding: 28px;
  width: 520px;
  max-width: 90vw;
  box-shadow: 0 12px 40px rgba(139, 115, 85, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  font-family: KaiTi, STKaiti, '楷体', serif;
}

.modal-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: #3a2a10;
  letter-spacing: 1px;
}

.modal-desc {
  margin: 0 0 20px;
  font-size: 15px;
  color: #7a6540;
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
  background: rgba(191, 149, 63, 0.08);
  border-color: rgba(191, 149, 63, 0.15);
}

.modal-option input[type="checkbox"] {
  margin-top: 2px;
  width: 18px;
  height: 18px;
  accent-color: #bf953f;
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
  color: #3a2a10;
  white-space: nowrap;
  flex-shrink: 0;
}

.option-hint {
  font-size: 13px;
  color: #8b7355;
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
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.modal-btn.cancel {
  background: rgba(139, 115, 85, 0.1);
  color: #8b7355;
}

.modal-btn.cancel:hover {
  background: rgba(139, 115, 85, 0.18);
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #bf953f, #aa771c);
  color: #fff;
  box-shadow: 0 2px 6px rgba(191, 149, 63, 0.3);
}

.modal-btn.confirm:hover {
  background: linear-gradient(135deg, #d4a94a, #bf953f);
  box-shadow: 0 3px 10px rgba(191, 149, 63, 0.4);
}

.modal-btn.confirm:disabled {
  background: linear-gradient(135deg, #d4c9a8, #c4b68e);
  box-shadow: none;
  cursor: not-allowed;
  color: rgba(255, 255, 255, 0.6);
}

@media (max-width: 600px) {
  .library-header {
    flex-direction: column;
    align-items: stretch;
  }
  .brand-name {
    font-size: 20px;
  }
  .logo-icon {
    width: 28px;
    height: 28px;
  }
}
</style>
