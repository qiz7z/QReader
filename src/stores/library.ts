import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BookRecord } from '@/types'
import { StorageService } from '@/services/StorageService'

export const useLibraryStore = defineStore('library', () => {
  const books = ref<BookRecord[]>([])
  const searchQuery = ref('')
  const isLoading = ref(false)

  const filteredBooks = ref<BookRecord[]>([])

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
    try {
      books.value = await StorageService.getAllBooks()
      applyFilter()
    } finally {
      isLoading.value = false
    }
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

  return {
    books,
    searchQuery,
    isLoading,
    filteredBooks,
    loadBooks,
    addBook,
    removeBook,
    setSearchQuery,
  }
})
