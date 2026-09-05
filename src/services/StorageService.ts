import { db } from './db'
import { opfs } from './opfs'
import type {
  BookRecord,
  BookmarkRecord,
  NoteRecord,
  PdfAnnotation,
  ProgressRecord,
  ReaderSettings,
  ParsedBook,
} from '@/types'

export class StorageService {
  private static useOPFS = false
  private static initialized = false

  static async initialize(): Promise<boolean> {
    if (this.initialized) return this.useOPFS

    const opfsAvailable = await opfs.initialize()
    this.useOPFS = opfsAvailable
    this.initialized = true

    if (opfsAvailable) {
      await this.migrateFromIndexedDB()
    }

    return this.useOPFS
  }

  private static async migrateFromIndexedDB(): Promise<void> {
    try {
      const books = await db.books.toArray()
      if (books.length > 0) {
        for (const book of books) {
          const bookId = book.id
          const exists = await opfs.fileExists(['books'], `${bookId}.json`)
          if (exists) continue

          await this.saveBook(book)
          const parsedBook = await db.parsedBooks.get(bookId)
          if (parsedBook) {
            await this.saveParsedBook(bookId, {
              id: parsedBook.bookId,
              title: parsedBook.title,
              author: parsedBook.author,
              cover: parsedBook.cover,
              content: parsedBook.content,
              toc: parsedBook.toc,
              metadata: parsedBook.metadata,
            })
          }

          const bookmarks = await db.bookmarks.where('bookId').equals(bookId).toArray()
          for (const bm of bookmarks) await this.addBookmark(bm)

          const notes = await db.notes.where('bookId').equals(bookId).toArray()
          for (const note of notes) await this.addNote(note)

          const progress = await db.progress.get(bookId)
          if (progress) await this.saveProgress(progress)

          if (db.pdfAnnotations) {
            const annotations = await db.pdfAnnotations.where('bookId').equals(bookId).toArray()
            for (const ann of annotations) await this.addAnnotation(ann)
          }
        }

        const settings = await db.settings.get('reader')
        if (settings) await this.saveSettings(settings as any)

        // 迁移完成后清理 IndexedDB，避免每次启动重复读取全量数据
        await db.transaction('rw', [db.books, db.parsedBooks, db.bookmarks, db.notes, db.progress, db.settings], async () => {
          await Promise.all([
            db.books.clear(),
            db.parsedBooks.clear(),
            db.bookmarks.clear(),
            db.notes.clear(),
            db.progress.clear(),
            db.settings.clear(),
          ])
        })
        if (db.pdfAnnotations) await db.pdfAnnotations.clear()
        console.log('[StorageService] IndexedDB 迁移完成，旧数据已清理')
      }
    } catch (error) {
      console.error('[StorageService] Migration failed:', error)
    }
  }

  static isOPFS(): boolean {
    return this.useOPFS
  }

  static async getAllDataExport(): Promise<Blob> {
    await this.initialize()
    if (this.useOPFS) return await opfs.exportAllData()

    const exportData: Record<string, any> = { version: 1, exportDate: new Date().toISOString() }
    exportData.books = await db.books.toArray()
    exportData.parsedBooks = await db.parsedBooks.toArray()
    exportData.bookmarks = await db.bookmarks.toArray()
    exportData.notes = await db.notes.toArray()
    exportData.progress = await db.progress.toArray()
    exportData.settings = await db.settings.get('reader')
    exportData.pdfAnnotations = await db.pdfAnnotations?.toArray() || []
    return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  }

  static async importAllData(data: string): Promise<void> {
    await this.initialize()
    if (this.useOPFS) return await opfs.importAllData(data)

    const importData = JSON.parse(data)
    await db.transaction('rw', db.tables, async () => {
      for (const book of Object.values<any>(importData.books || {})) await db.books.put(book)
      for (const parsed of Object.values<any>(importData.parsedBooks || {})) await db.parsedBooks.put(parsed)
      for (const bookmark of importData.bookmarks || []) await db.bookmarks.put(bookmark)
      for (const note of importData.notes || []) await db.notes.put(note)
      for (const progress of importData.progress || []) await db.progress.put(progress)
      if (importData.settings) await db.settings.put(importData.settings)
      for (const annotation of importData.pdfAnnotations || []) await db.pdfAnnotations?.put(annotation)
    })
  }

  static async clearAllData(): Promise<void> {
    await this.initialize()
    if (this.useOPFS) await opfs.clearAll()
    else await db.deleteAllData()
  }

  static async saveBook(book: BookRecord): Promise<void> {
    await this.initialize()
    if (this.useOPFS) {
      const metadata: any = { ...book }
      if (metadata.rawFile) {
        await opfs.writeBinary(['books'], `${book.id}_raw`, new Blob([metadata.rawFile]))
        delete metadata.rawFile
      }
      if (metadata.cover) {
        await opfs.writeBinary(['books'], `${book.id}_cover`, new Blob([metadata.cover]))
        delete metadata.cover
      }
      await opfs.writeJSON(['books'], `${book.id}.json`, metadata)
    } else {
      await db.books.put(book)
    }
  }

  static async getBook(id: string): Promise<BookRecord | undefined> {
    await this.initialize()
    if (this.useOPFS) {
      const metadata: any = await opfs.readJSON(['books'], `${id}.json`)
      if (!metadata) return undefined
      metadata.rawFile = await opfs.readBinary(['books'], `${id}_raw`) || undefined
      metadata.cover = await opfs.readBinary(['books'], `${id}_cover`) || undefined
      return metadata as BookRecord
    }
    return await db.books.get(id)
  }

  /**
   * 轻量元数据读取：跳过原始文件（几十 MB/本），仅用于书架/列表渲染。
   * 封面保留（体积小，列表需要展示）。
   */
  static async getBookMeta(id: string): Promise<BookRecord | undefined> {
    await this.initialize()
    if (this.useOPFS) {
      const metadata: any = await opfs.readJSON(['books'], `${id}.json`)
      if (!metadata) return undefined
      metadata.cover = await opfs.readBinary(['books'], `${id}_cover`) || undefined
      return metadata as BookRecord
    }
    return await db.books.get(id)
  }

  static async getAllBooks(): Promise<BookRecord[]> {
    await this.initialize()
    if (this.useOPFS) {
      const files = await opfs.listDirectory(['books'])
      const books: BookRecord[] = []
      for (const file of files.filter(f => f.endsWith('.json') && !f.endsWith('_parsed.json'))) {
        // 书架列表只需要元数据 + 封面，绝不能把每本的原始文件读进内存
        const book = await this.getBookMeta(file.replace('.json', ''))
        if (book) books.push(book)
      }
      return books.sort((a, b) => b.updatedAt - a.updatedAt)
    }
    return await db.books.orderBy('updatedAt').reverse().toArray()
  }

  static async getBooksCount(): Promise<number> {
    await this.initialize()
    if (this.useOPFS) {
      const files = await opfs.listDirectory(['books'])
      return files.filter(f => f.endsWith('.json') && !f.endsWith('_parsed.json')).length
    }
    return await db.books.count()
  }

  static async getBooksBatch(offset: number, limit: number): Promise<BookRecord[]> {
    const allBooks = await this.getAllBooks()
    return allBooks.slice(offset, offset + limit)
  }

  static async deleteBook(id: string): Promise<void> {
    await this.initialize()
    if (this.useOPFS) {
      await opfs.deleteFile(['books'], `${id}.json`)
      await opfs.deleteFile(['books'], `${id}_raw`)
      await opfs.deleteFile(['books'], `${id}_cover`)
      await opfs.deleteFile(['books'], `${id}_parsed.json`)
      await opfs.deleteFile(['bookmarks'], `${id}.json`)
      await opfs.deleteFile(['notes'], `${id}.json`)
      await opfs.deleteFile(['progress'], `${id}.json`)
      await opfs.deleteFile(['pdf-annotations'], `${id}.json`)
    } else {
      await db.transaction('rw', [db.books, db.parsedBooks, db.bookmarks, db.notes, db.progress], async () => {
        await db.books.delete(id)
        await db.parsedBooks.where('bookId').equals(id).delete()
        await db.bookmarks.where('bookId').equals(id).delete()
        await db.notes.where('bookId').equals(id).delete()
        await db.progress.where('bookId').equals(id).delete()
      })
    }
  }

  static async saveParsedBook(bookId: string, parsed: ParsedBook): Promise<void> {
    await this.initialize()
    if (this.useOPFS) {
      await opfs.writeJSON(['books'], `${bookId}_parsed.json`, {
        id: parsed.id,
        title: parsed.title,
        author: parsed.author,
        cover: parsed.cover,
        content: parsed.content,
        toc: parsed.toc,
        metadata: parsed.metadata,
      })
    } else {
      await db.parsedBooks.put({
        bookId: parsed.id,
        title: parsed.title,
        author: parsed.author,
        cover: parsed.cover,
        content: parsed.content,
        toc: parsed.toc,
        metadata: parsed.metadata,
      })
    }
  }

  static async getParsedBook(bookId: string): Promise<ParsedBook | undefined> {
    await this.initialize()
    if (this.useOPFS) {
      const data: any = await opfs.readJSON(['books'], `${bookId}_parsed.json`)
      if (!data) return undefined
      return data as ParsedBook
    }
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

  static async addBookmark(bookmark: Omit<BookmarkRecord, 'id'>): Promise<BookmarkRecord> {
    await this.initialize()
    const newBookmark: BookmarkRecord = { ...bookmark, id: String(Date.now()) }
    if (this.useOPFS) {
      const bookmarks = await opfs.readJSON<BookmarkRecord[]>(['bookmarks'], `${bookmark.bookId}.json`) || []
      bookmarks.push(newBookmark)
      await opfs.writeJSON(['bookmarks'], `${bookmark.bookId}.json`, bookmarks)
      return newBookmark
    }
    const id = await db.bookmarks.add(newBookmark)
    return { ...newBookmark, id: String(id) }
  }

  static async getBookmarks(bookId: string): Promise<BookmarkRecord[]> {
    await this.initialize()
    if (this.useOPFS) {
      return await opfs.readJSON<BookmarkRecord[]>(['bookmarks'], `${bookId}.json`) || []
    }
    return await db.bookmarks.where('bookId').equals(bookId).sortBy('createdAt')
  }

  static async deleteBookmark(id: string): Promise<void> {
    await this.initialize()
    if (this.useOPFS) {
      const allFiles = await opfs.listDirectory(['bookmarks'])
      for (const file of allFiles) {
        const bookmarks = await opfs.readJSON<BookmarkRecord[]>(['bookmarks'], file) || []
        const filtered = bookmarks.filter(b => b.id !== id)
        if (filtered.length !== bookmarks.length) {
          await opfs.writeJSON(['bookmarks'], file, filtered)
        }
      }
    } else {
      await db.bookmarks.delete(id)
    }
  }

  static async addNote(note: Omit<NoteRecord, 'id'>): Promise<NoteRecord> {
    await this.initialize()
    const newNote: NoteRecord = { ...note, id: String(Date.now()) }
    if (this.useOPFS) {
      const notes = await opfs.readJSON<NoteRecord[]>(['notes'], `${note.bookId}.json`) || []
      notes.push(newNote)
      await opfs.writeJSON(['notes'], `${note.bookId}.json`, notes)
      return newNote
    }
    const id = await db.notes.add(newNote)
    return { ...newNote, id: String(id) }
  }

  static async getNotes(bookId: string): Promise<NoteRecord[]> {
    await this.initialize()
    if (this.useOPFS) {
      return await opfs.readJSON<NoteRecord[]>(['notes'], `${bookId}.json`) || []
    }
    return await db.notes.where('bookId').equals(bookId).sortBy('createdAt')
  }

  static async updateNote(id: string, updates: Partial<NoteRecord>): Promise<void> {
    await this.initialize()
    if (this.useOPFS) {
      const allFiles = await opfs.listDirectory(['notes'])
      for (const file of allFiles) {
        const notes = await opfs.readJSON<NoteRecord[]>(['notes'], file) || []
        const idx = notes.findIndex(n => n.id === id)
        if (idx !== -1) {
          notes[idx] = { ...notes[idx], ...updates, updatedAt: Date.now() }
          await opfs.writeJSON(['notes'], file, notes)
          break
        }
      }
    } else {
      await db.notes.update(id, updates)
    }
  }

  static async deleteNote(id: string): Promise<void> {
    await this.initialize()
    if (this.useOPFS) {
      const allFiles = await opfs.listDirectory(['notes'])
      for (const file of allFiles) {
        const notes = await opfs.readJSON<NoteRecord[]>(['notes'], file) || []
        const filtered = notes.filter(n => n.id !== id)
        if (filtered.length !== notes.length) {
          await opfs.writeJSON(['notes'], file, filtered)
        }
      }
    } else {
      await db.notes.delete(id)
    }
  }

  static async saveProgress(progress: ProgressRecord): Promise<void> {
    await this.initialize()
    if (this.useOPFS) {
      await opfs.writeJSON(['progress'], `${progress.bookId}.json`, progress)
    } else {
      await db.progress.put(progress)
    }
  }

  static async getProgress(bookId: string): Promise<ProgressRecord | undefined> {
    await this.initialize()
    if (this.useOPFS) {
      return await opfs.readJSON<ProgressRecord>(['progress'], `${bookId}.json`) || undefined
    }
    return await db.progress.get(bookId)
  }

  static async getTotalReadingTime(): Promise<number> {
    await this.initialize()
    let total = 0
    if (this.useOPFS) {
      const allProgress = await opfs.listDirectory(['progress'])
      for (const file of allProgress) {
        if (file.endsWith('.json')) {
          const progress = await opfs.readJSON<ProgressRecord>(['progress'], file)
          if (progress?.readingTime) total += progress.readingTime
        }
      }
    } else {
      const allProgress = await db.progress.toArray()
      for (const p of allProgress) {
        if (p.readingTime) total += p.readingTime
      }
    }
    return total
  }

  static async saveSettings(settings: ReaderSettings): Promise<void> {
    await this.initialize()
    if (this.useOPFS) {
      await opfs.writeJSON([], 'settings.json', settings)
    } else {
      await db.settings.put({ ...settings, key: 'reader' })
    }
  }

  static async getSettings(): Promise<ReaderSettings | undefined> {
    await this.initialize()
    if (this.useOPFS) {
      return await opfs.readJSON<ReaderSettings>([], 'settings.json') || undefined
    }
    const record = await db.settings.get('reader')
    if (!record) return undefined
    const { key, ...settings } = record
    return settings
  }

  static async deleteAllData(): Promise<void> {
    await this.clearAllData()
  }

  static async clearBooks(): Promise<void> {
    const books = await this.getAllBooks()
    for (const book of books) await this.deleteBook(book.id)
  }

  static async clearBookmarks(): Promise<void> {
    await this.initialize()
    if (this.useOPFS) {
      const files = await opfs.listDirectory(['bookmarks'])
      for (const file of files) await opfs.deleteFile(['bookmarks'], file)
    } else {
      await db.bookmarks.clear()
    }
  }

  static async clearNotes(): Promise<void> {
    await this.initialize()
    if (this.useOPFS) {
      const files = await opfs.listDirectory(['notes'])
      for (const file of files) await opfs.deleteFile(['notes'], file)
    } else {
      await db.notes.clear()
    }
  }

  static async clearProgress(): Promise<void> {
    await this.initialize()
    if (this.useOPFS) {
      const files = await opfs.listDirectory(['progress'])
      for (const file of files) await opfs.deleteFile(['progress'], file)
    } else {
      await db.progress.clear()
    }
  }

  static async clearSettings(): Promise<void> {
    await this.initialize()
    if (this.useOPFS) {
      await opfs.deleteFile([], 'settings.json')
    } else {
      await db.settings.clear()
    }
  }

  static async getAllAnnotations(bookId: string): Promise<PdfAnnotation[]> {
    await this.initialize()
    if (this.useOPFS) {
      return await opfs.readJSON<PdfAnnotation[]>(['pdf-annotations'], `${bookId}.json`) || []
    }
    if (!db.pdfAnnotations) throw new Error('pdfAnnotations table not available')
    return await db.pdfAnnotations.where('bookId').equals(bookId).sortBy('createdAt')
  }

  static async getPageAnnotations(bookId: string, pageNum: number): Promise<PdfAnnotation[]> {
    await this.initialize()
    if (this.useOPFS) {
      const all = await this.getAllAnnotations(bookId)
      return all.filter(a => a.pageNum === pageNum)
    }
    if (!db.pdfAnnotations) throw new Error('pdfAnnotations table not available')
    return await db.pdfAnnotations.where({ bookId, pageNum }).sortBy('createdAt')
  }

  static async addAnnotation(a: Omit<PdfAnnotation, 'id'>): Promise<PdfAnnotation> {
    await this.initialize()
    const annotation: PdfAnnotation = { ...a, id: String(Date.now()) }
    if (this.useOPFS) {
      const annotations = await this.getAllAnnotations(a.bookId)
      annotations.push(annotation)
      await opfs.writeJSON(['pdf-annotations'], `${a.bookId}.json`, annotations)
      return annotation
    }
    if (!db.pdfAnnotations) throw new Error('pdfAnnotations table not available')
    const id = await db.pdfAnnotations.add(annotation)
    return { ...annotation, id: String(id) }
  }

  static async deleteAnnotation(id: string): Promise<void> {
    await this.initialize()
    if (this.useOPFS) {
      const allFiles = await opfs.listDirectory(['pdf-annotations'])
      for (const file of allFiles) {
        const annotations = await opfs.readJSON<PdfAnnotation[]>(['pdf-annotations'], file) || []
        const filtered = annotations.filter(a => a.id !== id)
        if (filtered.length !== annotations.length) {
          await opfs.writeJSON(['pdf-annotations'], file, filtered)
        }
      }
    } else {
      if (!db.pdfAnnotations) throw new Error('pdfAnnotations table not available')
      await db.pdfAnnotations.delete(id)
    }
  }

  static async updateAnnotation(a: PdfAnnotation): Promise<void> {
    await this.initialize()
    if (this.useOPFS) {
      const annotations = await this.getAllAnnotations(a.bookId)
      const idx = annotations.findIndex(ann => ann.id === a.id)
      if (idx !== -1) {
        annotations[idx] = a
        await opfs.writeJSON(['pdf-annotations'], `${a.bookId}.json`, annotations)
      }
    } else {
      if (!db.pdfAnnotations) throw new Error('pdfAnnotations table not available')
      await db.pdfAnnotations.put(a)
    }
  }
}
