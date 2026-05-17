<template>
  <div class="library-view" :class="`theme-${readerStore.theme}`">
    <div class="library-ornament">
      <span class="ornament-line"></span>
      <span class="ornament-center"></span>
      <span class="ornament-line"></span>
    </div>
    <header class="library-header">
      <div class="brand">
        <svg class="logo-icon" viewBox="0 0 40 40" fill="none">
          <path d="M14 4 C22 4, 28 10, 28 18 C28 26, 22 30, 14 30 C10 30, 8 28, 8 24" stroke="#1890ff" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="14" y1="15" x2="22" y2="15" stroke="#40a9ff" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="14" y1="19" x2="22" y2="19" stroke="#40a9ff" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="14" y1="23" x2="18" y2="23" stroke="#40a9ff" stroke-width="1.2" stroke-linecap="round"/>
          <path d="M24 26 L32 34" stroke="#1890ff" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        <h1 class="brand-name">QReader</h1>
      </div>
      <SearchBar v-model="searchQuery" @update:modelValue="handleSearch" />
    </header>
    <main class="library-content">
      <UploadButton @book-imported="handleBookImported" />
      <p v-if="isLoading" class="loading-text">加载中...</p>
      <div v-else-if="filteredBooks.length === 0 && !isLoading" class="empty-library">
        <p>书架是空的，点击上方"导入书籍"开始阅读</p>
      </div>
      <BookGrid
        v-else
        :books="filteredBooks"
        @book-click="handleBookClick"
        @book-delete="handleBookDelete"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useReaderStore } from '@/stores/reader'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore } from '@/stores/library'
import UploadButton from '@/components/UploadButton.vue'
import BookGrid from '@/components/BookGrid.vue'
import SearchBar from '@/components/SearchBar.vue'
import type { BookRecord } from '@/types'

const router = useRouter()
const libraryStore = useLibraryStore()
const readerStore = useReaderStore()

const filteredBooks = computed(() => libraryStore.filteredBooks)
const isLoading = computed(() => libraryStore.isLoading)
const searchQuery = computed({
  get: () => libraryStore.searchQuery,
  set: (val: string) => libraryStore.setSearchQuery(val),
})

const handleBookImported = (book: BookRecord) => {
  libraryStore.addBook(book)
}

const handleBookClick = (bookId: string) => {
  router.push({ name: 'reader', params: { id: bookId } })
}

const handleBookDelete = (bookId: string) => {
  libraryStore.removeBook(bookId)
}

const handleSearch = (query: string) => {
  libraryStore.setSearchQuery(query)
}

onMounted(() => {
  libraryStore.loadBooks()
})
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

.library-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.loading-text {
  text-align: center;
  color: #8b7355;
  padding: 40px;
  font-style: italic;
}

.empty-library {
  text-align: center;
  padding: 60px 20px;
  color: #8b7355;
  font-size: 16px;
  font-style: italic;
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
