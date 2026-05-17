# 电子书阅读器架构文档

## 概述

电子书阅读器是一个基于 Web 的单机版电子书阅读应用，支持 TXT、PDF、EPUB、MOBI、DOCX、Markdown 等多种格式的电子书导入、管理和阅读。所有数据存储在浏览器 IndexedDB 中，无需后端服务。系统采用 Vue 3 + TypeScript 技术栈，后续可通过 Electron 打包为桌面应用。

## 技术栈

**语言与运行时**
- TypeScript 5.x
- JavaScript ES2020+

**框架**
- Vue 3 (组合式 API)
- Vite 8.x (构建工具)
- Vue Router 4.x (路由)
- Pinia 2.x (状态管理)

**UI 组件**
- Element Plus (UI 组件库)

**数据存储**
- Dexie.js (IndexedDB 封装)
- IndexedDB (浏览器本地数据库)

**格式解析库**
- epub.js (EPUB 解析)
- pdfjs-dist (PDF 解析)
- mammoth (DOCX 转 HTML)
- marked (Markdown 转 HTML)

## 项目结构

```
ebook-reader/
├── .monkeycode/              # 项目规格和文档
│   ├── docs/                 # 项目文档
│   └── specs/                # 功能规格
├── public/                   # 静态资源
├── src/
│   ├── assets/               # 静态资源（图片、样式）
│   ├── components/           # 可复用组件
│   ├── services/             # 业务逻辑服务
│   ├── stores/               # Pinia 状态管理
│   ├── types/                # TypeScript 类型定义
│   ├── utils/                # 工具函数
│   ├── views/                # 页面组件
│   ├── App.vue               # 根组件
│   ├── main.ts               # 应用入口
│   └── style.css             # 全局样式
├── index.html                # HTML 入口
├── package.json              # 依赖和脚本
├── vite.config.ts            # Vite 配置
└── tsconfig.json             # TypeScript 配置
```

**入口点**
- `src/main.ts` - 应用启动，注册 Vue、Router、Pinia
- `src/App.vue` - 根组件，包含路由视图
- `vite.config.ts` - Vite 构建配置

## 子系统

### 路由层
**目的**: 管理应用页面导航
**位置**: `src/main.ts` (路由配置)
**关键文件**: 待创建 `router/index.ts`
**依赖**: Vue Router
**被依赖**: 所有页面组件

### 书库管理
**目的**: 电子书的上传、解析、存储和展示
**位置**: `src/views/LibraryView.vue`, `src/services/`
**关键文件**: 待创建 `services/StorageService.ts`, `services/FormatParserService.ts`
**依赖**: Dexie, 格式解析库
**被依赖**: 阅读页面

### 阅读渲染
**目的**: 渲染电子书内容并提供阅读交互
**位置**: `src/views/ReaderView.vue`, `src/components/`
**关键文件**: 待创建 `components/ReaderCore.vue`
**依赖**: 格式解析服务, 存储服务
**被依赖**: 用户交互

### 数据存储
**目的**: 本地持久化存储所有数据
**位置**: `src/services/StorageService.ts`
**关键文件**: 待创建 `services/db.ts` (Dexie 实例)
**依赖**: Dexie.js
**被依赖**: 所有服务层

## 系统架构

```mermaid
flowchart TB
    subgraph "用户界面层"
        A[LibraryView 书库页面]
        B[ReaderView 阅读页面]
        C[SettingsView 设置页面]
    end

    subgraph "组件层"
        D[BookCard]
        E[UploadButton]
        F[ReaderCore]
        G[Pagination]
        H[ReaderToolbar]
        I[ReaderSidebar]
    end

    subgraph "服务层"
        J[FormatParserService 格式解析]
        K[StorageService 存储管理]
        L[ReaderStateService 阅读状态]
    end

    subgraph "状态管理"
        M[libraryStore]
        N[readerStore]
    end

    subgraph "数据层"
        O[(IndexedDB)]
    end

    A --> D
    A --> E
    B --> F
    B --> G
    B --> H
    B --> I
    D --> M
    E --> J
    E --> K
    F --> J
    F --> K
    F --> L
    H --> L
    I --> L
    J --> O
    K --> O
    L --> O
    M --> K
    N --> K
    N --> L