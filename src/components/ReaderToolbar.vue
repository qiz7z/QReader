<template>
  <div class="reader-toolbar">
    <div class="toolbar-left">
      <button class="toolbar-btn" @click="$emit('toggleSettings')">
        目录
      </button>
    </div>
    <div class="toolbar-center">
      <span class="toolbar-title">{{ title }}</span>
    </div>
    <div class="toolbar-right">
      <button class="toolbar-btn" @click="$emit('addBookmark')">
        添加书签
      </button>
      <button class="toolbar-btn" @click="$emit('toggleBookmarks')">
        我的书签
      </button>
      <button class="toolbar-btn" @click="$emit('toggleNotes')">
        笔记
      </button>
      <button class="toolbar-btn" @click="$emit('toggleFullscreen')">
        {{ isFullscreen ? '退出全屏' : '全屏' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  isFullscreen: boolean
}>()

defineEmits<{
  (e: 'addBookmark'): void
  (e: 'toggleSettings'): void
  (e: 'toggleBookmarks'): void
  (e: 'toggleNotes'): void
  (e: 'toggleFullscreen'): void
}>()
</script>

<style scoped>
.reader-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.toolbar-center {
  flex: 1;
  text-align: center;
}

.toolbar-title {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-btn {
  padding: 6px 12px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.toolbar-btn:hover {
  background-color: #f0f0f0;
}
</style>
