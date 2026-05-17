# 电子书阅读器文档

本文档涵盖电子书阅读器项目的架构设计、接口定义和开发指南。适用于项目贡献者、开发者和架构师。

**快速链接**: [架构](./ARCHITECTURE.md) | [接口](./INTERFACES.md) | [开发者指南](./DEVELOPER_GUIDE.md)

---

## 核心文档

### [架构](./ARCHITECTURE.md)

系统设计、技术栈、组件结构和数据流程。了解系统如何运作的起点。

### [接口](./INTERFACES.md)

类型定义、服务接口、路由和组件接口。开发新功能时的参考。

### [开发者指南](./DEVELOPER_GUIDE.md)

环境搭建、开发工作流、编码规范和常见任务。贡献者必读。

---

## 模块

| 模块 | 描述 |
|------|------|
| `src/views/` | 页面组件（书库、阅读器、设置） |
| `src/components/` | 可复用 UI 组件 |
| `src/services/` | 业务逻辑服务（解析、存储） |
| `src/stores/` | Pinia 状态管理 |
| `src/types/` | TypeScript 类型定义 |
| `src/utils/` | 工具函数 |

---

## 入门指南

### 项目新人？

按此路径学习：
1. **[架构](./ARCHITECTURE.md)** - 了解全局
2. **[接口](./INTERFACES.md)** - 学习类型定义
3. **[开发者指南](./DEVELOPER_GUIDE.md)** - 搭建环境

### 首次贡献？

1. **[开发者指南](./DEVELOPER_GUIDE.md)** - 搭建和工作流
2. **[常见任务](./DEVELOPER_GUIDE.md#常见任务)** - 分步指南

---

## 快速参考

### 命令

```bash
npm run dev        # 启动开发服务器
npm run build      # 生产构建
npm run preview    # 预览生产构建
npm run typecheck  # 类型检查
```

### 重要文件

| 文件 | 目的 |
|------|------|
| `src/main.ts` | 应用入口 |
| `vite.config.ts` | Vite 配置 |
| `package.json` | 依赖和脚本 |
| `.monkeycode/specs/ebook-reader/` | 功能规格文档 |
