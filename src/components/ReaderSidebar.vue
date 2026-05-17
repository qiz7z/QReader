<template>
  <aside class="reader-sidebar" :class="`sidebar-${position}`">
    <div class="sidebar-header">
      <h3>目录</h3>
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
        {{ tab.label }}
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
  { key: 'toc', label: '目录' },
  { key: 'bookmark', label: '书签' },
  { key: 'note', label: '笔记' },
  { key: 'settings', label: '设置' },
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
  border-bottom: 1px solid #eee;
  background-color: #fafafa;
}

.tab-btn {
  flex: 1;
  padding: 10px 8px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;
}

.tab-btn.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
}

.tab-btn:hover:not(.active) {
  background-color: #f0f0f0;
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
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.adjust-btn:hover {
  background-color: #f0f0f0;
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
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}

.weight-btn.active,
.theme-btn.active {
  border-color: #1890ff;
  background-color: #1890ff;
  color: white;
}

@media (max-width: 600px) {
  .reader-sidebar {
    width: 100%;
  }
}
</style>
