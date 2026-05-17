# 需求实施计划

- [x] 1. 初始化 Vue 3 + TypeScript 项目
   - 使用 Vite 创建 Vue 3 + TypeScript 项目
   - 安装依赖：vue-router, pinia, dexie, element-plus
   - 安装格式解析库：epub.js, pdfjs-dist, mammoth, marked
   - 配置 vite.config.ts 和基础项目结构

- [x] 2. 搭建项目目录结构和路由
   - 创建目录：src/views, src/components, src/services, src/types, src/stores, src/utils
   - 配置 Vue Router：路由 / (书库), /book/:id (阅读), /settings (设置)
   - 创建基础布局组件：AppLayout, LibraryView, ReaderView, SettingsView

- [x] 3. 定义类型和数据库层
   - 在 src/types/ 中定义所有 TypeScript 接口：ParsedBook, Chapter, TOCEntry, BookRecord, BookmarkRecord, NoteRecord, ProgressRecord, ReaderSettings
   - 使用 Dexie 创建 IndexedDB 数据库实例，定义版本和表结构
   - 封装 StorageService：books、parsedBooks、bookmarks、notes、progress 的 CRUD 方法

- [x] 4. 实现格式解析服务
   - 创建 FormatParserService 统一入口，根据文件扩展名分发到对应解析器
   - 实现 TXT 解析器：读取文本，按段落分割，生成章节结构
   - 实现 Markdown 解析器：使用 marked 渲染为 HTML
   - 实现 EPUB 解析器：使用 epub.js 解析并提取内容、目录、元数据
   - 实现 PDF 解析器：使用 pdf.js 提取文本内容
   - 实现 DOCX 解析器：使用 mammoth.js 转换为 HTML
   - 实现 MOBI 解析器：基础解析逻辑
   - 统一输出 ParsedBook 结构

- [x] 5. 实现书库管理功能
   - 实现 UploadButton 组件：文件选择、拖拽上传、格式校验
   - 实现 BookCard 组件：展示封面、标题、作者、文件大小、最后阅读时间
   - 实现 BookGrid/BookList 组件：书库列表/网格展示
   - 实现文件导入流程：上传 -> 解析 -> 存储 -> 刷新书库
   - 实现书籍删除功能：级联删除书签、笔记、进度记录

- [x] 6. 实现阅读页面核心功能
   - 实现 ReaderCore 组件：根据格式选择渲染器，渲染电子书内容
   - 实现 Pagination 组件：上一页/下一页翻页逻辑
   - 实现阅读进度计算和显示（百分比/页码）
   - 实现窗口大小变化时的内容重排

- [x] 7. 实现阅读设置功能
   - 实现字体大小调节：至少 5 档字号切换
   - 实现主题切换：白天、夜间、护眼 3 种主题
   - 实现设置持久化：保存到 IndexedDB settings 表
   - 实现阅读进度自动保存和恢复

- [x] 8. 实现书签管理功能
   - 实现添加书签：在当前阅读位置创建书签
   - 实现书签侧边栏：展示该书的所有书签列表
   - 实现书签点击跳转：跳转到书签标记的位置
   - 实现书签删除功能

- [x] 9. 实现笔记与高亮功能
   - 实现文本选择交互：选中文本后弹出操作菜单
   - 实现添加笔记：弹出输入框，保存批注到 IndexedDB
   - 实现高亮标记：以醒目颜色标记选中文本
   - 实现笔记侧边栏：展示该书的所有笔记列表
   - 实现笔记点击跳转和编辑/删除功能

- [x] 10. 实现状态管理
   - 使用 Pinia 创建 readerStore：管理当前章节、位置、字体、主题等状态
   - 使用 Pinia 创建 libraryStore：管理书库列表和搜索状态
   - 实现状态与 IndexedDB 的同步

- [x] 11. 完善 UI 和交互细节
   - 添加空书库引导页
   - 添加加载状态和错误提示
   - 优化响应式布局和移动端适配
   - 添加搜索框组件支持书库搜索
