import { defineStore } from 'pinia'
import { nextTick, ref } from 'vue'
import type { BookRecord } from '@/types'
import { StorageService } from '@/services/StorageService'

export interface ImportingBook {
  id: string
  title: string
  format: string
  progress: number
  fileName: string
}

export const useLibraryStore = defineStore('library', () => {
  const books = ref<BookRecord[]>([])
  const searchQuery = ref('')
  const isLoading = ref(false)
  const loadProgress = ref(0)

  const filteredBooks = ref<BookRecord[]>([])

  const importingBooks = ref<ImportingBook[]>([])

  const BATCH_SIZE = 4

  function applyFilter() {
    const query = searchQuery.value.toLowerCase()
    if (!query) {
      filteredBooks.value = books.value
    } else {
      filteredBooks.value = books.value.filter(
        (b) => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query)
      )
    }
  }

  async function loadBooks() {
    isLoading.value = true
    loadProgress.value = 0
    const startTime = Date.now()
    try {
      const total = await StorageService.getBooksCount()
      if (total === 0) {
        books.value = []
        applyFilter()
        return
      }

      const loaded: BookRecord[] = []
      const batches = Math.ceil(total / BATCH_SIZE)

      for (let i = 0; i < batches; i++) {
        const batch = await StorageService.getBooksBatch(i * BATCH_SIZE, BATCH_SIZE)
        loaded.push(...batch)
        books.value = [...loaded]
        applyFilter()
        loadProgress.value = Math.round(((i + 1) / batches) * 100)
        await nextTick()
      }
    } finally {
      loadProgress.value = 100
      const elapsed = Date.now() - startTime
      if (elapsed < 500) {
        await new Promise((r) => setTimeout(r, 500 - elapsed))
      }
      isLoading.value = false
    }
  }

  function addImportingBook(fileName: string): string {
    const id = `importing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const format = fileName.split('.').pop()?.toLowerCase() || ''
    importingBooks.value.push({ id, title: fileName, format, progress: 0, fileName })
    return id
  }

  function updateImportProgress(bookId: string, progress: number) {
    const book = importingBooks.value.find((b) => b.id === bookId)
    if (book) book.progress = Math.min(progress, 100)
  }

  function removeImportingBook(bookId: string) {
    importingBooks.value = importingBooks.value.filter((b) => b.id !== bookId)
  }

  function addBook(book: BookRecord) {
    books.value.unshift(book)
    applyFilter()
  }

  async function removeBook(bookId: string) {
    await StorageService.deleteBook(bookId)
    books.value = books.value.filter((b) => b.id !== bookId)
    applyFilter()
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
    applyFilter()
  }

  async function clearAllData() {
    await StorageService.deleteAllData()
    books.value = []
    importingBooks.value = []
    applyFilter()
  }

  function resetBooks() {
    books.value = []
    importingBooks.value = []
    applyFilter()
  }

  return {
    books,
    searchQuery,
    isLoading,
    loadProgress,
    filteredBooks,
    importingBooks,
    loadBooks,
    addImportingBook,
    updateImportProgress,
    removeImportingBook,
    addBook,
    removeBook,
    setSearchQuery,
    clearAllData,
    resetBooks,
  }
})
