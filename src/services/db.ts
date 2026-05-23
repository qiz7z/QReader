import Dexie, { type Table } from 'dexie'
import type { BookRecord, BookmarkRecord, NoteRecord, ProgressRecord, SettingsRecord, PdfAnnotation } from '@/types'

interface ParsedBookRecord {
  bookId: string
  title: string
  author: string
  cover: ArrayBuffer | null
  content: Array<{ id: string; title: string; content: string }>
  toc: Array<{ title: string; chapterId: string; position: number }>
  metadata: Record<string, string>
}

class EbookReaderDB extends Dexie {
  books!: Table<BookRecord>
  parsedBooks!: Table<ParsedBookRecord>
  bookmarks!: Table<BookmarkRecord>
  notes!: Table<NoteRecord>
  progress!: Table<ProgressRecord>
  settings!: Table<SettingsRecord, string>
  pdfAnnotations!: Table<PdfAnnotation>

  constructor() {
    super('EbookReaderDB')
    this.version(1).stores({
      books: 'id, title, format, updatedAt',
      parsedBooks: 'bookId',
      bookmarks: '++id, bookId, chapterId, createdAt',
      notes: '++id, bookId, chapterId, selectedText, createdAt',
      progress: 'bookId',
      settings: 'key',
    })
    this.version(2).stores({
      books: 'id, title, format, updatedAt',
      parsedBooks: 'bookId',
      bookmarks: '++id, bookId, chapterId, createdAt',
      notes: '++id, bookId, chapterId, selectedText, createdAt',
      progress: 'bookId',
      settings: 'key',
      pdfAnnotations: '++id, bookId, pageNum, createdAt',
    })
  }

  async deleteAllData(): Promise<void> {
    await Promise.all(this.tables.map((table) => table.clear()))
  }
}

export const db = new EbookReaderDB()
export type { ParsedBookRecord }
