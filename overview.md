# 阅读器选项卡按钮打磨 — 已完成

## 状态
**已完成**（`npm run build` 通过，开发服 http://localhost:5173/ 可访问）

## 做了什么
按 **Calm Reading OS** 打磨阅读器底部选项卡与设置/侧栏相关控件，去掉粗糙方块按钮与 Ant 蓝硬选中。

## 主要改动

### `src/views/ReaderView.vue`
- **底部胶囊栏**：圆形 `.bot-btn`、楷体 `.bot-han`、选中底部墨点 `::after`、TTS 琥珀呼吸
- **无障碍**：`role="toolbar"`、`aria-label` / `aria-pressed`、`focus-visible`
- **主题**：light / moonlit dark / green / parchment 底栏与按钮态
- **设置芯片**：`.mode-btn` 分段药丸、`.theme-btn` 预览色块、`.font-btn` / `.weight-btn` 纸感圆角

### `src/components/ReaderSidebar.vue`
- **tab 行**：纸感分栏、44px 触达、选中浮起卡片
- **weight / theme**：QR Token 药丸，去掉硬填充蓝

## 如何验收
打开任意书籍 → 看底部 **歸 / 錄 / 筆 / 簽 / 讀 / 書 / 設 / 全**  
切换主题、点开设置、试朗读播放态。
