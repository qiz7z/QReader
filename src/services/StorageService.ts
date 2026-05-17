import { db, type ParsedBookRecord } from './db'
import type {
  BookRecord,
  BookmarkRecord,
  NoteRecord,
  PdfAnnotation,
  ProgressRecord,
  ReaderSettings,
  SettingsRecord,
  ParsedBook,
} from '@/types'

export class StorageService {
  // 书籍操作

  static async saveBook(book: BookRecord): Promise<void> {
    await db.books.put(book)
  }

  static async getBook(id: string): Promise<BookRecord | undefined> {
    return await db.books.get(id)
  }

  static async getAllBooks(): Promise<BookRecord[]> {
    return await db.books.orderBy('updatedAt').reverse().toArray()
  }

  static async deleteBook(id: string): Promise<void> {
    await db.transaction('rw', [db.books, db.parsedBooks, db.bookmarks, db.notes, db.progress], async () => {
      await db.books.delete(id)
      await db.parsedBooks.where('bookId').equals(id).delete()
      await db.bookmarks.where('bookId').equals(id).delete()
      await db.notes.where('bookId').equals(id).delete()
      await db.progress.where('bookId').equals(id).delete()
    })
  }

  // 解析内容操作

  static async saveParsedBook(bookId: string, parsed: ParsedBook): Promise<void> {
    const record: ParsedBookRecord = {
      bookId,
      title: parsed.title,
      author: parsed.author,
      cover: parsed.cover,
      content: parsed.content,
      toc: parsed.toc,
      metadata: parsed.metadata,
    }
    await db.parsedBooks.put(record)
  }

  static async getParsedBook(bookId: string): Promise<ParsedBook | undefined> {
    const record = await db.parsedBooks.get(bookId)
    if (!record) return undefined
    return {
      id: record.bookId,
      title: record.title,
      author: record.author,
      cover: record.cover,
      content: record.content,
      toc: record.toc,
      metadata: record.metadata,
    }
  }

  // 书签操作

  static async addBookmark(bookmark: Omit<BookmarkRecord, 'id'>): Promise<BookmarkRecord> {
    const id = await db.bookmarks.add(bookmark as BookmarkRecord)
    return { ...bookmark, id: id as string }
  }

  static async getBookmarks(bookId: string): Promise<BookmarkRecord[]> {
    return await db.bookmarks.where('bookId').equals(bookId).sortBy('createdAt')
  }

  static async deleteBookmark(id: string): Promise<void> {
    await db.bookmarks.delete(id)
  }

  // 笔记操作

  static async addNote(note: Omit<NoteRecord, 'id'>): Promise<NoteRecord> {
    const id = await db.notes.add(note as NoteRecord)
    return { ...note, id: id as string }
  }

  static async getNotes(bookId: string): Promise<NoteRecord[]> {
    return await db.notes.where('bookId').equals(bookId).sortBy('createdAt')
  }

  static async updateNote(id: string, updates: Partial<NoteRecord>): Promise<void> {
    await db.notes.update(id, updates)
  }

  static async deleteNote(id: string): Promise<void> {
    await db.notes.delete(id)
  }

  // 进度操作

  static async saveProgress(progress: ProgressRecord): Promise<void> {
    await db.progress.put(progress)
  }

  static async getProgress(bookId: string): Promise<ProgressRecord | undefined> {
    return await db.progress.get(bookId)
  }

  // 设置操作

  static async saveSettings(settings: ReaderSettings): Promise<void> {
    const record: SettingsRecord = { ...settings, key: 'reader' }
    await db.settings.put(record)
  }

  static async getSettings(): Promise<ReaderSettings | undefined> {
    const record = await db.settings.get('reader')
    if (!record) return undefined
    const { key, ...settings } = record
    return settings
  }

  // 数据管理

  static async deleteAllData(): Promise<void> {
    await db.tables.forEach((table) => table.clear())
  }

  // PDF 标注

  static async getAllAnnotations(bookId: string): Promise<PdfAnnotation[]> {
    if (!db.pdfAnnotations) throw new Error('pdfAnnotations table not available')
    return await db.pdfAnnotations.where('bookId').equals(bookId).sortBy('createdAt')
  }

  static async getPageAnnotations(bookId: string, pageNum: number): Promise<PdfAnnotation[]> {
    if (!db.pdfAnnotations) throw new Error('pdfAnnotations table not available')
    return await db.pdfAnnotations.where({ bookId, pageNum }).sortBy('createdAt')
  }

  static async addAnnotation(a: Omit<PdfAnnotation, 'id'>): Promise<PdfAnnotation> {
    if (!db.pdfAnnotations) throw new Error('pdfAnnotations table not available')
    const id = await db.pdfAnnotations.add(a as any)
    return { ...a, id: String(id) }
  }

  static async deleteAnnotation(id: string): Promise<void> {
    if (!db.pdfAnnotations) throw new Error('pdfAnnotations table not available')
    await db.pdfAnnotations.delete(id)
  }

  static async updateAnnotation(a: PdfAnnotation): Promise<void> {
    if (!db.pdfAnnotations) throw new Error('pdfAnnotations table not available')
    await db.pdfAnnotations.put(a)
  }
}
