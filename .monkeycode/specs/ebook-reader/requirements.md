# Requirements Document

## Introduction

本功能定义一个基于 Web 的电子书阅读器，采用纯前端单机版方案，所有数据存储在浏览器 IndexedDB 中，无需后端服务。支持多种文本格式的上传、管理和阅读。核心能力包括多格式解析、阅读界面、书签管理、笔记标注和阅读进度保存。后续通过 Electron 打包为桌面应用（.exe）。

## Glossary

- **电子书**: 用户导入到系统中的文本文件，包括 TXT、PDF、EPUB、MOBI、DOCX、Markdown 等格式
- **阅读器**: 在浏览器中渲染电子书内容并提供阅读交互的 Web 应用
- **书签**: 用户标记的特定页或段落，用于快速跳转
- **笔记**: 用户针对电子书内容添加的批注或高亮标记
- **阅读进度**: 用户当前在电子书中的位置信息
- **IndexedDB**: 浏览器内置的客户端数据库，用于本地持久化存储电子书内容和用户数据

## Requirements

### Requirement 1: 多格式电子书上传与解析

**User Story:** AS 读者, I WANT 上传各种格式的电子书文件, SO THAT 可以在浏览器中阅读不同类型的内容

#### Acceptance Criteria

1. WHEN 用户选择文件上传, THE 阅读器 SHALL 支持 TXT、PDF、EPUB、MOBI、DOCX、Markdown 格式
2. WHEN 用户上传文件, THE 阅读器 SHALL 验证文件格式并在解析失败时显示错误提示
3. THE 阅读器 SHALL 将解析后的内容转换为统一的内部渲染格式
4. WHEN 用户在同一设备上连续上传多个文件, THE 阅读器 SHALL 将所有电子书保存到本地书库

### Requirement 2: 电子书书库管理

**User Story:** AS 读者, I WANT 查看和管理我已上传的所有电子书, SO THAT 可以快速找到想读的书

#### Acceptance Criteria

1. WHILE 用户处于书库页面, THE 阅读器 SHALL 以列表或网格形式展示所有已导入的电子书
2. THE 阅读器 SHALL 显示每本书的标题、封面（如有）、文件大小和最后阅读时间
3. WHEN 用户点击某本书, THE 阅读器 SHALL 打开该书的阅读界面并跳转到上次阅读位置
4. WHEN 用户删除某本书, THE 阅读器 SHALL 清除该书的所有数据（包括书签和笔记）

### Requirement 3: 阅读界面与排版渲染

**User Story:** AS 读者, I WANT 在舒适的环境中阅读电子书, SO THAT 获得良好的阅读体验

#### Acceptance Criteria

1. WHILE 用户正在阅读, THE 阅读器 SHALL 支持翻页（上一页/下一页）操作
2. THE 阅读器 SHALL 提供字体大小调节功能，支持至少 5 档字号切换
3. THE 阅读器 SHALL 提供至少 3 种阅读主题（白天、夜间、护眼）
4. WHILE 用户处于阅读界面, THE 阅读器 SHALL 显示当前阅读进度（百分比或页码）
5. WHEN 用户调整浏览器窗口大小, THE 阅读器 SHALL 自动重排内容以适应新的窗口尺寸

### Requirement 4: 书签管理

**User Story:** AS 读者, I WANT 在任意位置添加书签, SO THAT 可以快速跳转到感兴趣的内容

#### Acceptance Criteria

1. WHEN 用户点击"添加书签"按钮, THE 阅读器 SHALL 在当前阅读位置创建书签
2. WHILE 用户处于阅读界面, THE 阅读器 SHALL 在侧边栏展示该书的所有书签列表
3. WHEN 用户点击某个书签, THE 阅读器 SHALL 跳转到该书签标记的位置
4. WHEN 用户删除某个书签, THE 阅读器 SHALL 移除该书签并更新书签列表

### Requirement 5: 笔记与高亮标注

**User Story:** AS 读者, I WANT 选中文本内容并添加笔记或高亮, SO THAT 可以记录和回顾重要内容

#### Acceptance Criteria

1. WHEN 用户选中文本并选择"添加笔记", THE 阅读器 SHALL 弹出笔记输入框供用户填写批注
2. WHEN 用户选中文本并选择"高亮", THE 阅读器 SHALL 以醒目颜色标记选中文本
3. WHILE 用户处于阅读界面, THE 阅读器 SHALL 在侧边栏展示该书的所有笔记列表
4. WHEN 用户点击某条笔记, THE 阅读器 SHALL 跳转到该笔记对应的文本位置
5. WHEN 用户编辑或删除某条笔记, THE 阅读器 SHALL 同步更新高亮标记状态

### Requirement 6: 阅读进度保存

**User Story:** AS 读者, I WANT 阅读器自动保存我的阅读进度, SO THAT 下次打开同一本书时可以从上次继续阅读

#### Acceptance Criteria

1. WHEN 用户关闭阅读页面, THE 阅读器 SHALL 自动保存当前阅读位置到 IndexedDB
2. WHEN 用户重新打开已读过的电子书, THE 阅读器 SHALL 跳转到上次保存的阅读位置
3. THE 阅读器 SHALL 为每本书独立保存阅读进度
4. WHEN 用户手动跳转到任意位置, THE 阅读器 SHALL 更新该书的阅读进度记录

## Architecture Decisions

- **存储方案**: 纯前端方案，使用浏览器 IndexedDB 存储所有数据（电子书文件、书签、笔记、阅读进度）
- **用户系统**: 无用户注册/登录功能，数据完全本地化
- **桌面端方案**: 后续使用 Electron 将 Web 应用打包为 .exe 文件，复用相同代码库
