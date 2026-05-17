# 接口文档

## 类型定义

### 核心数据类型

#### ParsedBook

解析后的电子书统一结构。

```typescript
interface ParsedBook {
  id: string;           // 唯一标识 (UUID)
  title: string;        // 书名
  author: string;       // 作者
  cover: ArrayBuffer | null;  // 封面图片
  content: Chapter[];   // 章节内容
  toc: TOCEntry[];      // 目录
  metadata: Record<string, string>;  // 元数据
}
```

#### Chapter

```typescript
interface Chapter {
  id: string;           // 章节 ID
  title: string;        // 章节标题
  content: string;      // HTML 内容
}
```

#### TOCEntry

```typescript
interface TOCEntry {
  title: string;        // 目录项标题
  chapterId: string;    // 对应章节 ID
  position: number;     // 位置索引
}
```

### 数据库记录类型

#### BookRecord

```typescript
interface BookRecord {
  id: string;           // 唯一标识
  title: string;        // 书名
  author: string;       // 作者
  format: string;       // 文件格式 (txt, epub, pdf 等)
  fileSize: number;     // 文件大小 (字节)
  cover: ArrayBuffer | null;  // 封面
  rawFile: ArrayBuffer; // 原始文件
  createdAt: number;    // 创建时间戳
  updatedAt: number;    // 更新时间戳
}
```

#### BookmarkRecord

```typescript
interface BookmarkRecord {
  id: string;           // 唯一标识
  bookId: string;       // 所属书籍 ID
  chapterId: string;    // 章节 ID
  position: number;     // 位置
  title: string;        // 书签标题
  createdAt: number;    // 创建时间
}
```

#### NoteRecord

```typescript
interface NoteRecord {
  id: string;           // 唯一标识
  bookId: string;       // 所属书籍 ID
  chapterId: string;    // 章节 ID
  position: number;     // 位置
  selectedText: string; // 选中的文本
  note: string;         // 笔记内容
  highlightColor: string; // 高亮颜色
  createdAt: number;    // 创建时间
  updatedAt: number;    // 更新时间
}
```

#### ProgressRecord

```typescript
interface ProgressRecord {
  bookId: string;       // 书籍 ID (主键)
  chapterId: string;    // 章节 ID
  position: number;     // 位置
  percentage: number;   // 进度百分比
  updatedAt: number;    // 更新时间
}
```

#### ReaderSettings

```typescript
interface ReaderSettings {
  fontSize: number;     // 字号档位 1-5
  theme: 'light' | 'dark' | 'green';  // 主题
  fontFamily: string;   // 字体
  lineHeight: number;   // 行高
  margin: number;       // 边距
}
```

## 服务接口

### FormatParserService

格式解析服务，将各种格式的电子书解析为统一的 ParsedBook 结构。

```typescript
interface FormatParserService {
  parse(file: File): Promise<ParsedBook>;
  supportsFormat(format: string): boolean;
}
```

**支持格式**: `txt`, `md`, `epub`, `pdf`, `mobi`, `docx`

### StorageService

存储管理服务，封装 IndexedDB 的 CRUD 操作。

```typescript
interface StorageService {
  // 书籍操作
  saveBook(book: BookRecord): Promise<void>;
  getBook(id: string): Promise<BookRecord | undefined>;
  getAllBooks(): Promise<BookRecord[]>;
  deleteBook(id: string): Promise<void>;

  // 解析内容操作
  saveParsedBook(bookId: string, parsed: ParsedBook): Promise<void>;
  getParsedBook(bookId: string): Promise<ParsedBook | undefined>;

  // 书签操作
  addBookmark(bookmark: Omit<BookmarkRecord, 'id'>): Promise<BookmarkRecord>;
  getBookmarks(bookId: string): Promise<BookmarkRecord[]>;
  deleteBookmark(id: string): Promise<void>;

  // 笔记操作
  addNote(note: Omit<NoteRecord, 'id'>): Promise<NoteRecord>;
  getNotes(bookId: string): Promise<NoteRecord[]>;
  updateNote(id: string, updates: Partial<NoteRecord>): Promise<void>;
  deleteNote(id: string): Promise<void>;

  // 进度操作
  saveProgress(progress: ProgressRecord): Promise<void>;
  getProgress(bookId: string): Promise<ProgressRecord | undefined>;

  // 设置操作
  saveSettings(settings: ReaderSettings): Promise<void>;
  getSettings(): Promise<ReaderSettings | undefined>;
}
```

## 路由接口

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | LibraryView | 书库页面 |
| `/book/:id` | ReaderView | 阅读页面 |
| `/settings` | SettingsView | 设置页面 |

## 组件接口

### BookCard Props

```typescript
interface BookCardProps {
  book: BookRecord;
  progress?: ProgressRecord;
}
```

### BookCard Events

```typescript
interface BookCardEmits {
  (e: 'click', bookId: string): void;
  (e: 'delete', bookId: string): void;
}
```

### ReaderCore Props

```typescript
interface ReaderCoreProps {
  book: ParsedBook;
  settings: ReaderSettings;
}
```

### ReaderCore Events

```typescript
interface ReaderCoreEmits {
  (e: 'page-change', position: number): void;
  (e: 'text-select', selection: SelectionInfo): void;
}
```
