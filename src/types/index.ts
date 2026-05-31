export interface ParsedBook {
  id: string
  title: string
  author: string
  cover: ArrayBuffer | null
  content: Chapter[]
  toc: TOCEntry[]
  metadata: Record<string, string>
}

export interface Chapter {
  id: string
  title: string
  content: string
}

export interface TOCEntry {
  title: string
  chapterId: string
  position: number // EPUB: 章节索引; PDF: 起始页码
}

export interface BookRecord {
  id: string
  title: string
  author: string
  format: string
  fileSize: number
  cover: ArrayBuffer | null
  rawFile: ArrayBuffer
  createdAt: number
  updatedAt: number
}

export interface BookmarkRecord {
  id: string
  bookId: string
  chapterId: string
  position: number
  title: string
  createdAt: number
}

export interface NoteRecord {
  id: string
  bookId: string
  chapterId: string
  position: number
  selectedText: string
  note: string
  highlightColor: string
  createdAt: number
  updatedAt: number
}

export interface ProgressRecord {
  bookId: string
  chapterId: string
  position: number
  percentage: number
  updatedAt: number
  readingTime?: number // 累计阅读时长（秒）
}

export interface ReaderSettings {
  fontSize: number
  theme: 'light' | 'dark' | 'green' | 'parchment'
  fontFamily: string
  lineHeight: number
  margin: number
  fontWeight: number
}

export interface SettingsRecord extends ReaderSettings {
  key: string
}

export interface PdfAnnotation {
  id: string
  bookId: string
  pageNum: number
  type: 'pen' | 'highlight' | 'text'
  color: string
  opacity: number
  width: number
  points: Array<{ x: number; y: number }>
  rects?: Array<{ x: number; y: number; width: number; height: number }>
  text?: string
  fontSize?: number
  scale: number
  createdAt: number
}
