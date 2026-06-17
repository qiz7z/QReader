import type { BookRecord, BookmarkRecord, NoteRecord, PdfAnnotation, ProgressRecord, ReaderSettings, ParsedBook } from '@/types'

export class OPFSStorage {
  private root: FileSystemDirectoryHandle | null = null
  private isAvailable = false
  private initialized = false

  async initialize(): Promise<boolean> {
    if (this.initialized) return this.isAvailable

    try {
      if (!('getDirectory' in navigator.storage)) {
        this.isAvailable = false
        this.initialized = true
        console.warn('[OPFS] File System Access API not supported')
        return false
      }

      this.root = await navigator.storage.getDirectory()
      this.isAvailable = true
      this.initialized = true
      console.log('[OPFS] Storage initialized successfully')
      return true
    } catch (error) {
      console.error('[OPFS] Failed to initialize:', error)
      this.isAvailable = false
      this.initialized = true
      return false
    }
  }

  private async getDirectory(handle: FileSystemDirectoryHandle, path: string[], create = true): Promise<FileSystemDirectoryHandle> {
    let current = handle
    for (const dir of path) {
      current = await current.getDirectoryHandle(dir, { create })
    }
    return current
  }

  private async getFile(handle: FileSystemDirectoryHandle, filename: string): Promise<FileSystemFileHandle> {
    return await handle.getFileHandle(filename, { create: true })
  }

  async writeJSON<T>(path: string[], filename: string, data: T): Promise<void> {
    await this.ensureInitialized()
    if (!this.root || !this.isAvailable) throw new Error('[OPFS] Not available')

    const dir = await this.getDirectory(this.root, path)
    const file = await this.getFile(dir, filename)
    const writable = await file.createWritable()
    await writable.write(JSON.stringify(data))
    await writable.close()
  }

  async readJSON<T>(path: string[], filename: string): Promise<T | null> {
    await this.ensureInitialized()
    if (!this.root || !this.isAvailable) return null

    try {
      const dir = await this.getDirectory(this.root, path, false)
      const file = await dir.getFileHandle(filename, { create: false })
      const fileContent = await file.getFile()
      const text = await fileContent.text()
      return JSON.parse(text) as T
    } catch (error) {
      if ((error as any).name === 'NotFoundError') return null
      throw error
    }
  }

  async writeBinary(path: string[], filename: string, data: ArrayBuffer | Blob): Promise<void> {
    await this.ensureInitialized()
    if (!this.root || !this.isAvailable) throw new Error('[OPFS] Not available')

    const dir = await this.getDirectory(this.root, path)
    const file = await this.getFile(dir, filename)
    const writable = await file.createWritable()
    await writable.write(data)
    await writable.close()
  }

  async readBinary(path: string[], filename: string): Promise<ArrayBuffer | null> {
    await this.ensureInitialized()
    if (!this.root || !this.isAvailable) return null

    try {
      const dir = await this.getDirectory(this.root, path, false)
      const file = await dir.getFileHandle(filename, { create: false })
      const fileContent = await file.getFile()
      return await fileContent.arrayBuffer()
    } catch (error) {
      if ((error as any).name === 'NotFoundError') return null
      throw error
    }
  }

  async deleteFile(path: string[], filename: string): Promise<void> {
    await this.ensureInitialized()
    if (!this.root || !this.isAvailable) return

    try {
      const dir = await this.getDirectory(this.root, path, false)
      await dir.removeEntry(filename, { recursive: true })
    } catch (error) {
      if ((error as any).name !== 'NotFoundError') throw error
    }
  }

  async deleteDirectory(path: string[]): Promise<void> {
    await this.ensureInitialized()
    if (!this.root || !this.isAvailable) return

    try {
      if (path.length === 0) {
        const entries = await this.listDirectory([])
        for (const entry of entries) {
          await this.root!.removeEntry(entry, { recursive: true })
        }
      } else {
        const parentPath = path.slice(0, -1)
        const dirName = path[path.length - 1]
        const parent = await this.getDirectory(this.root, parentPath, false)
        await parent.removeEntry(dirName, { recursive: true })
      }
    } catch (error) {
      if ((error as any).name !== 'NotFoundError') throw error
    }
  }

  async listDirectory(path: string[]): Promise<string[]> {
    await this.ensureInitialized()
    if (!this.root || !this.isAvailable) return []

    try {
      const dir = await this.getDirectory(this.root, path, false)
      const entries: string[] = []
      for await (const [name] of dir) {
        entries.push(name)
      }
      return entries
    } catch (error) {
      if ((error as any).name === 'NotFoundError') return []
      throw error
    }
  }

  async fileExists(path: string[], filename: string): Promise<boolean> {
    await this.ensureInitialized()
    if (!this.root || !this.isAvailable) return false

    try {
      const dir = await this.getDirectory(this.root, path, false)
      await dir.getFileHandle(filename, { create: false })
      return true
    } catch (error) {
      if ((error as any).name === 'NotFoundError') return false
      throw error
    }
  }

  async exportAllData(): Promise<Blob> {
    await this.ensureInitialized()
    if (!this.root || !this.isAvailable) throw new Error('[OPFS] Not available')

    const exportData: Record<string, any> = {
      version: 1,
      exportDate: new Date().toISOString(),
      books: {},
      parsedBooks: {},
      bookmarks: {},
      notes: {},
      progress: {},
      settings: null,
      pdfAnnotations: {},
    }

    const books = await this.listDirectory(['books'])
    for (const bookId of books) {
      if (bookId.endsWith('.json')) {
        const id = bookId.replace('.json', '')
        const metadata = await this.readJSON<BookRecord>(['books'], bookId)
        if (metadata) exportData.books[id] = metadata

        const parsed = await this.readJSON<ParsedBook>(['books'], `${id}_parsed.json`)
        if (parsed) exportData.parsedBooks[id] = parsed

        const rawFile = await this.readBinary(['books'], `${id}_raw`)
        if (rawFile) exportData.books[id].rawFile = Array.from(new Uint8Array(rawFile))

        const cover = await this.readBinary(['books'], `${id}_cover`)
        if (cover) exportData.books[id].cover = Array.from(new Uint8Array(cover))

        const bookmarks = await this.readJSON<BookmarkRecord[]>(['bookmarks'], `${id}.json`)
        if (bookmarks) exportData.bookmarks[id] = bookmarks

        const notes = await this.readJSON<NoteRecord[]>(['notes'], `${id}.json`)
        if (notes) exportData.notes[id] = notes

        const progress = await this.readJSON<ProgressRecord>(['progress'], `${id}.json`)
        if (progress) exportData.progress[id] = progress

        const annotations = await this.readJSON<PdfAnnotation[]>(['pdf-annotations'], `${id}.json`)
        if (annotations) exportData.pdfAnnotations[id] = annotations
      }
    }

    const settings = await this.readJSON<ReaderSettings>([], 'settings.json')
    if (settings) exportData.settings = settings

    return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  }

  async importAllData(data: string): Promise<void> {
    await this.ensureInitialized()
    if (!this.root || !this.isAvailable) throw new Error('[OPFS] Not available')

    const importData = JSON.parse(data)

    if (importData.settings) await this.writeJSON([], 'settings.json', importData.settings)

    for (const [bookId, bookData] of Object.entries<any>(importData.books || {})) {
      const metadata = { ...bookData }
      if (metadata.rawFile) {
        await this.writeBinary(['books'], `${bookId}_raw`, new Blob([new Uint8Array(metadata.rawFile)]))
        delete metadata.rawFile
      }
      if (metadata.cover) {
        await this.writeBinary(['books'], `${bookId}_cover`, new Blob([new Uint8Array(metadata.cover)]))
        delete metadata.cover
      }
      await this.writeJSON(['books'], `${bookId}.json`, metadata)
    }

    for (const [bookId, parsedData] of Object.entries<any>(importData.parsedBooks || {})) {
      await this.writeJSON(['books'], `${bookId}_parsed.json`, parsedData)
    }

    for (const [bookId, bookmarks] of Object.entries<any>(importData.bookmarks || {})) {
      await this.writeJSON(['bookmarks'], `${bookId}.json`, bookmarks)
    }

    for (const [bookId, notes] of Object.entries<any>(importData.notes || {})) {
      await this.writeJSON(['notes'], `${bookId}.json`, notes)
    }

    for (const [bookId, progress] of Object.entries<any>(importData.progress || {})) {
      await this.writeJSON(['progress'], `${bookId}.json`, progress)
    }

    for (const [bookId, annotations] of Object.entries<any>(importData.pdfAnnotations || {})) {
      await this.writeJSON(['pdf-annotations'], `${bookId}.json`, annotations)
    }
  }

  async clearAll(): Promise<void> {
    await this.deleteDirectory([])
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) await this.initialize()
  }
}

export const opfs = new OPFSStorage()
export default opfs
