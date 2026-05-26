<template>
  <div class="library-view" :class="`theme-${readerStore.theme}`">
    <div class="library-ornament">
      <span class="ornament-line"></span>
      <span class="ornament-center"></span>
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
            <path d="M14 4 C22 4, 28 10, 28 18 C28 26, 22 30, 14 30 C10 30, 8 28, 8 24" stroke="#1890ff" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="14" y1="15" x2="22" y2="15" stroke="#40a9ff" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="14" y1="19" x2="22" y2="19" stroke="#40a9ff" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="14" y1="23" x2="18" y2="23" stroke="#40a9ff" stroke-width="1.2" stroke-linecap="round"/>
            <path d="M24 26 L32 34" stroke="#1890ff" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <h1 class="brand-name">我的书架</h1>
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

const handleBookImported = (book: BookRecord) => {
  libraryStore.addBook(book)
  StorageService.getProgress(book.id).then(progress => {
    booksWithProgress.value.push({ ...book, progress })
  })
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
@keyframes bgDrift {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.92; }
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
  z-index: -1;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(245, 230, 200, 0.5), rgba(240, 230, 208, 0.65)),
    url('/background.png');
  background-size: auto, cover;
  background-position: center;
  background-repeat: no-repeat;
  animation: bgDrift 8s ease-in-out infinite;
}

.library-ornament {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.ornament-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #c9a84c, transparent);
}

.ornament-center {
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #bf953f, #fcf6ba, #aa771c);
  transform: rotate(45deg);
  border-radius: 1px;
  box-shadow: 0 0 6px rgba(191, 149, 63, 0.5);
}

.library-header {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid;
  border-image: linear-gradient(90deg, transparent, #1890ff, #40a9ff, #1890ff, transparent) 1;
  background: transparent;
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
  padding: 7px 14px;
  border: 1px solid rgba(139, 90, 43, 0.3);
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(245, 230, 200, 0.6) 0%, rgba(230, 215, 185, 0.5) 100%);
  color: #8b5a2b;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 0.3px;
  backdrop-filter: blur(8px);
}

.home-icon {
  width: 18px;
  height: 18px;
  transition: all 0.25s;
}

.home-btn:hover {
  background: linear-gradient(135deg, rgba(255, 250, 240, 0.7) 0%, rgba(245, 230, 200, 0.6) 100%);
  border-color: rgba(139, 90, 43, 0.5);
  color: #6b4423;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 90, 43, 0.12);
}

.home-btn:hover .home-icon {
  transform: scale(1.05);
}

.home-btn:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 2px 6px rgba(139, 90, 43, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.brand-name {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #1890ff;
  text-shadow: 0 1px 2px rgba(24,144,255,0.25), 0 2px 4px rgba(0,0,0,0.06);
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
  width: 38px;
  height: 38px;
  border: 1px solid rgba(139, 90, 43, 0.3);
  border-radius: 8px;
  background: rgba(139, 90, 43, 0.08);
  color: #8b5a2b;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.clear-all-btn:hover {
  background: rgba(139, 90, 43, 0.15);
  border-color: rgba(139, 90, 43, 0.5);
  color: #6b4423;
  transform: scale(1.05);
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
