<template>
  <aside class="reader-sidebar" :class="`sidebar-${position}`">
    <div class="sidebar-header">
      <h3>{{ tabs.find(t => t.key === activeTab)?.label || '目录' }}</h3>
      <button class="close-btn" @click="$emit('close')">&times;</button>
    </div>
    <div class="sidebar-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <svg class="tab-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" v-html="tab.icon"></svg>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>
    <div class="sidebar-content">
      <section v-if="activeTab === 'toc'">
         <ul v-if="toc.length > 0" class="toc-list">
           <li
             v-for="(item, idx) in toc"
             :key="item.chapterId"
             class="toc-item"
             :class="{ active: activeIndex === idx }"
             @click="$emit('toc-click', item)"
           >
             <span class="toc-title">{{ item.title || `第 ${idx + 1} 章` }}</span>
           </li>
         </ul>
         <p v-else class="empty-text">暂无目录</p>
        <p v-else class="empty-text">暂无目录</p>
      </section>

      <section v-if="activeTab === 'bookmark'">
         <ul v-if="bookmarks.length > 0" class="bookmark-list">
           <li v-for="bookmark in bookmarks" :key="bookmark.id" class="bookmark-item" @click="$emit('bookmark-click', bookmark)">
             <span class="bookmark-title">{{ bookmark.title || '书签' }}</span>
             <button class="bookmark-delete" @click.stop="$emit('bookmark-delete', bookmark)">删除</button>
           </li>
         </ul>
        <p v-else class="empty-text">暂无书签</p>
      </section>

      <section v-if="activeTab === 'note'">
         <ul v-if="notes.length > 0" class="note-list">
           <li v-for="note in notes" :key="note.id" class="note-item" @click="$emit('note-click', note)">
             <p class="note-text" :style="{ borderLeftColor: note.highlightColor || '#ddd' }">{{ note.selectedText }}</p>
             <p class="note-content">{{ note.note }}</p>
             <button class="note-delete" @click.stop="$emit('note-delete', note)">删除</button>
           </li>
         </ul>
        <p v-else class="empty-text">暂无笔记</p>
      </section>

      <section v-if="activeTab === 'settings'">
        <div class="setting-group">
          <label class="setting-label">字体大小</label>
          <div class="setting-control">
            <button class="adjust-btn" @click="$emit('update:fontSize', Math.max(1, fontSize - 1))">-</button>
            <span class="adjust-value">{{ fontSize }}档</span>
            <button class="adjust-btn" @click="$emit('update:fontSize', Math.min(5, fontSize + 1))">+</button>
          </div>
        </div>
        <div class="setting-group">
          <label class="setting-label">字体粗细</label>
          <div class="weight-options">
            <button
              v-for="w in weightOptions"
              :key="w.value"
              class="weight-btn"
              :class="{ active: fontWeight === w.value }"
              @click="$emit('update:fontWeight', w.value)"
            >
              {{ w.label }}
            </button>
          </div>
        </div>
        <div class="setting-group">
          <label class="setting-label">主题</label>
          <div class="theme-options">
            <button
              v-for="t in themeOptions"
              :key="t.value"
              class="theme-btn"
              :class="{ active: theme === t.value }"
              @click="$emit('update:theme', t.value)"
            >
              {{ t.label }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { BookmarkRecord, NoteRecord, TOCEntry } from '@/types'

  const props = defineProps<{
    position: 'left' | 'right'
    bookId: string
    bookmarks: BookmarkRecord[]
    notes: NoteRecord[]
    toc: TOCEntry[]
    defaultTab?: string
    fontSize: number
    fontWeight: number
    theme: 'light' | 'dark' | 'green' | 'parchment'
    currentChapter?: number
  }>()

  const activeIndex = ref(0)
  watch(() => props.currentChapter, (val) => {
    if (typeof val === 'number' && val >= 0) activeIndex.value = val
  }, { immediate: true })

defineEmits<{
  (e: 'bookmark-click', bookmark: BookmarkRecord): void
  (e: 'bookmark-delete', bookmark: BookmarkRecord): void
  (e: 'note-click', note: NoteRecord): void
  (e: 'note-delete', note: NoteRecord): void
  (e: 'toc-click', item: TOCEntry): void
  (e: 'close'): void
  (e: 'update:fontSize', value: number): void
  (e: 'update:fontWeight', value: number): void
  (e: 'update:theme', value: 'light' | 'dark' | 'green' | 'parchment'): void
}>()

const tabs = [
  { key: 'toc', label: '目录', icon: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>' },
  { key: 'bookmark', label: '书签', icon: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>' },
  { key: 'note', label: '笔记', icon: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>' },
  { key: 'settings', label: '设置', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>' },
]

const activeTab = ref(props.defaultTab || 'toc')

watch(() => props.defaultTab, (val) => {
  if (val) activeTab.value = val
})

const weightOptions = [
  { label: '细-', value: 1 },
  { label: '细', value: 2 },
  { label: '细+', value: 3 },
  { label: '默认', value: 4 },
  { label: '粗-', value: 5 },
  { label: '粗', value: 6 },
  { label: '粗+', value: 7 },
]

const themeOptions = [
  { label: '白天', value: 'light' as const },
  { label: '夜间', value: 'dark' as const },
  { label: '护眼', value: 'green' as const },
  { label: '羊皮卷', value: 'parchment' as const },
]
</script>

<style scoped>
.reader-sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 320px;
  background-color: white;
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: transform 0.3s ease;
}

.sidebar-left {
  left: 0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.sidebar-right {
  right: 0;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.sidebar-header-mini {
  display: flex;
  justify-content: flex-end;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.sidebar-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--qr-border, rgba(143, 105, 62, 0.16));
  background: color-mix(in srgb, var(--qr-surface-muted, #f3eadc) 70%, transparent);
}

.tab-btn {
  flex: 1;
  min-height: 44px;
  padding: 8px 6px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--qr-text-muted, #98a2b3);
  transition:
    color var(--qr-transition-fast, 160ms cubic-bezier(0.22, 1, 0.36, 1)),
    background var(--qr-transition-fast, 160ms cubic-bezier(0.22, 1, 0.36, 1)),
    border-color var(--qr-transition-fast, 160ms cubic-bezier(0.22, 1, 0.36, 1)),
    box-shadow var(--qr-transition-fast, 160ms cubic-bezier(0.22, 1, 0.36, 1)),
    transform 140ms cubic-bezier(0.22, 1, 0.36, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  -webkit-tap-highlight-color: transparent;
}

.tab-btn .tab-icon {
  color: inherit;
  transition: color var(--qr-transition-fast, 160ms cubic-bezier(0.22, 1, 0.36, 1));
}

.tab-btn .tab-label {
  line-height: 1;
  font-family: "Kaiti SC", "STKaiti", "KaiTi", "Songti SC", serif;
}

.tab-btn:focus { outline: none; }
.tab-btn:focus-visible {
  box-shadow: var(--qr-focus, 0 0 0 3px rgba(59, 130, 246, 0.22));
}

.tab-btn.active {
  color: color-mix(in srgb, var(--qr-text-primary, #1f2937) 72%, var(--qr-accent, #b7791f) 28%);
  background: var(--qr-surface-solid, #fffaf2);
  border-color: var(--qr-border-strong, rgba(143, 105, 62, 0.28));
  box-shadow: 0 1px 0 rgba(255,255,255,0.65) inset, 0 2px 8px rgba(92, 64, 35, 0.08);
}

.tab-btn:hover:not(.active) {
  background: color-mix(in srgb, var(--qr-surface-solid, #fff) 55%, transparent);
  color: var(--qr-text-secondary, #667085);
}

.tab-btn:active {
  transform: scale(0.97);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 6px 8px;
}

.toc-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: inherit;
}

.toc-item:hover {
  background: rgba(0, 0, 0, 0.06);
}

/* 当前章节：背景更深、左侧竖条、加粗 */
.toc-item.active {
  background: rgba(0, 0, 0, 0.10);
  border-left: 4px solid #1890ff;
  font-weight: 600;
  padding-left: 10px;
}

.toc-item .toc-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 亮色主题 */
.theme-light .toc-item:hover {
  background: rgba(0, 0, 0, 0.05);
}
.theme-light .toc-item.active {
  background: rgba(24, 144, 255, 0.08);
  border-left-color: #1890ff;
  color: #1890ff;
}

/* 绿色主题 */
.theme-green .toc-item:hover {
  background: rgba(46, 74, 46, 0.06);
}
.theme-green .toc-item.active {
  background: rgba(46, 74, 46, 0.12);
  border-left-color: #2e7a38;
  color: #2e7a38;
}

/* 暗色主题 */
.theme-dark .toc-item:hover {
  background: rgba(255, 255, 255, 0.05);
}
.theme-dark .toc-item.active {
  background: rgba(255, 255, 255, 0.10);
  border-left-color: #1890ff;
  color: #fff;
}

.toc-list,
.bookmark-list,
.note-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item,
.bookmark-item,
.note-item {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  font-size: 13px;
}

.toc-item:hover,
.bookmark-item:hover,
.note-item:hover {
  background-color: #f5f5f5;
}

.bookmark-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bookmark-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-delete {
  background: none;
  border: none;
  font-size: 13px;
  color: #999;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
}

.bookmark-item:hover .bookmark-delete {
  opacity: 1;
}

.bookmark-delete:hover {
  color: #ff4d4f;
}

.note-text {
  margin: 0 0 5px;
  font-size: 12px;
  color: #333;
  font-style: italic;
  padding-left: 8px;
  border-left: 3px solid #ddd;
}

.note-content {
  margin: 0 0 5px;
  font-size: 12px;
  color: #666;
}

.note-delete {
  background: none;
  border: 1px solid #ddd;
  font-size: 11px;
  color: #999;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s, border-color 0.2s;
}

.note-item:hover .note-delete {
  opacity: 1;
}

.note-delete:hover {
  color: #ff4d4f;
  border-color: #ff4d4f;
}

.empty-text {
  color: #999;
  font-size: 13px;
  text-align: center;
  padding: 20px 0;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-label {
  display: block;
  font-size: 14px;
  color: #555;
  margin-bottom: 10px;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 15px;
}

.adjust-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--qr-border, rgba(143, 105, 62, 0.16));
  border-radius: 10px;
  background: var(--qr-surface-solid, #fffaf2);
  color: var(--qr-text-secondary, #667085);
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--qr-transition-fast, 160ms cubic-bezier(0.22, 1, 0.36, 1));
}

.adjust-btn:hover {
  border-color: var(--qr-primary, #3b82f6);
  color: var(--qr-primary, #3b82f6);
  background: var(--qr-primary-soft, rgba(59, 130, 246, 0.1));
}

.adjust-value {
  min-width: 50px;
  text-align: center;
  font-size: 14px;
}

.weight-options,
.theme-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.weight-btn,
.theme-btn {
  padding: 7px 12px;
  border: 1px solid var(--qr-border, rgba(143, 105, 62, 0.16));
  border-radius: 999px;
  background: var(--qr-surface-solid, #fffaf2);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--qr-text-secondary, #667085);
  letter-spacing: 0.04em;
  transition:
    background var(--qr-transition-fast, 160ms cubic-bezier(0.22, 1, 0.36, 1)),
    border-color var(--qr-transition-fast, 160ms cubic-bezier(0.22, 1, 0.36, 1)),
    color var(--qr-transition-fast, 160ms cubic-bezier(0.22, 1, 0.36, 1)),
    box-shadow var(--qr-transition-fast, 160ms cubic-bezier(0.22, 1, 0.36, 1)),
    transform 140ms cubic-bezier(0.22, 1, 0.36, 1);
  font-family: "Kaiti SC", "STKaiti", "KaiTi", "Songti SC", serif;
}

.weight-btn:hover,
.theme-btn:hover {
  border-color: var(--qr-border-strong, rgba(143, 105, 62, 0.28));
  color: var(--qr-text-primary, #1f2937);
}

.weight-btn.active,
.theme-btn.active {
  border-color: color-mix(in srgb, var(--qr-primary, #3b82f6) 55%, transparent);
  background: var(--qr-primary-soft, rgba(59, 130, 246, 0.1));
  color: var(--qr-primary, #3b82f6);
  box-shadow: 0 1px 4px rgba(59, 130, 246, 0.12);
  font-weight: 600;
}

.weight-btn:active,
.theme-btn:active {
  transform: scale(0.97);
}

@media (max-width: 600px) {
  .reader-sidebar {
    width: 100%;
  }
}
</style>
