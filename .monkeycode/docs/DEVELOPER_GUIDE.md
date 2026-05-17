# 开发者指南

## 项目目的

电子书阅读器是一个纯前端单机版 Web 应用，用于在浏览器中阅读多种格式的电子书。它在用户本地设备上运行，所有数据存储在浏览器 IndexedDB 中，无需后端服务。

**核心职责**:
- 多格式电子书导入与解析（TXT、PDF、EPUB、MOBI、DOCX、Markdown）
- 提供舒适的阅读界面（翻页、字体调节、主题切换）
- 书签管理和笔记标注功能
- 阅读进度自动保存和恢复

**相关系统**:
- 后续桌面应用 - 使用 Electron 打包为 .exe，复用 Web 代码

## 环境搭建

### 前置条件

- Node.js >= 18.x
- npm >= 9.x

### 安装

```bash
# 克隆仓库
git clone [repo-url]
cd ebook-reader

# 安装依赖
npm install
```

### 运行

```bash
# 开发服务器
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview

# 类型检查
npm run typecheck
```

## 开发工作流

### 代码质量工具

| 工具 | 命令 | 目的 |
|------|------|------|
| TypeScript | `npm run typecheck` | 类型检查 |
| Vite Build | `npm run build` | 构建验证 |

### 分支策略

- `main` - 生产就绪代码
- `feature/*` - 新功能开发
- `fix/*` - Bug 修复

### 编码规范

### 文件组织
- 每个文件一个组件/类
- 文件以其默认导出命名
- 相关文件放在同一目录

### 命名

| 类型 | 约定 | 示例 |
|------|------|------|
| 文件 | kebab-case | `format-parser-service.ts` |
| 组件 | PascalCase | `BookCard.vue` |
| 函数/变量 | camelCase | `parseBook()` |
| 常量 | SCREAMING_SNAKE | `SUPPORTED_FORMATS` |
| 类型/接口 | PascalCase | `ParsedBook` |

### 错误处理

```typescript
// 推荐：特定错误信息
throw new Error('不支持的文件格式：' + format);

// 避免：模糊错误
throw new Error('出错了');
```

### 测试
- 测试文件: `[name].test.ts` 放在 `__tests__/` 目录或与源码同目录
- describe 块: 匹配类/函数名
- 测试名: "should [预期行为] when [条件]"

## 常见任务

### 添加新格式解析器

**需修改的文件**:
1. `src/services/parsers/[format]Parser.ts` - 解析器实现
2. `src/services/FormatParserService.ts` - 注册新解析器
3. `src/types/index.ts` - 如有新类型则添加

**步骤**:
1. 创建解析器文件，实现 `parse(file: File): Promise<ParsedBook>` 接口
2. 在 FormatParserService 的格式分发逻辑中添加新格式
3. 在 SUPPORTED_FORMATS 常量中添加扩展名
4. 测试解析功能

### 添加新页面

**需修改的文件**:
1. `src/views/[PageName]View.vue` - 页面组件
2. `src/router/index.ts` - 添加路由

**步骤**:
1. 创建视图组件文件
2. 在 router 中配置路由
3. 如有需要，添加对应的 store

### 添加新组件

**需修改的文件**:
1. `src/components/[ComponentName].vue` - 组件实现

**步骤**:
1. 创建单文件组件
2. 定义 props 和 emits
3. 从父组件导入使用

### 修复 Bug

**流程**:
1. 复现 bug
2. 在代码中定位根因
3. 用最小改动修复
4. 验证修复效果
5. 检查是否有类似问题

## 架构注意事项

- 所有业务逻辑放在 `services/` 目录
- 类型定义统一放在 `types/` 目录
- 状态管理使用 Pinia，放在 `stores/` 目录
- 组件按功能组织，可复用组件放 `components/`，页面放 `views/`
- 数据库操作统一通过 StorageService，禁止组件直接操作 IndexedDB
