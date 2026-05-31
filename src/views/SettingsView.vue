<template>
  <div class="settings-view">
    <header class="settings-header">
      <div class="header-left">
        <button class="back-btn" @click="router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1>设置</h1>
      </div>
    </header>
    <main class="settings-content">
      <!-- 阅读设置卡片 -->
      <section class="settings-card">
        <div class="card-header">
          <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          <h2>阅读设置</h2>
        </div>
        <div class="card-body">
          <div class="setting-item">
            <label>默认字体大小</label>
            <select v-model="settings.fontSize" @change="saveSettings">
              <option v-for="size in 5" :key="size" :value="size">
                {{ size }} 档
              </option>
            </select>
          </div>
          <div class="setting-item">
            <label>默认字体粗细</label>
            <select v-model="settings.fontWeight" @change="saveSettings">
              <option v-for="weight in 7" :key="weight" :value="weight">
                {{ weight }} 档
              </option>
            </select>
          </div>
        </div>
      </section>

      <!-- 数据管理卡片 -->
      <section class="settings-card">
        <div class="card-header">
          <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
          <h2>数据管理</h2>
        </div>
        <div class="card-body">
          <div class="setting-item-vertical">
            <div class="setting-info">
              <label>导出所有数据</label>
              <p class="setting-desc">将所有书籍、书签、笔记和进度导出为 JSON 文件</p>
            </div>
            <button class="btn btn-primary" @click="handleExportData">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              导出数据
            </button>
          </div>
          <div class="setting-item-vertical">
            <div class="setting-info">
              <label>导入数据</label>
              <p class="setting-desc">从 JSON 文件导入数据（将合并现有数据）</p>
            </div>
            <input
              type="file"
              ref="fileInputRef"
              accept=".json,application/json"
              @change="handleImportData"
              style="display: none"
            />
            <button class="btn btn-secondary" @click="triggerFileInput">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              导入数据
            </button>
          </div>
          <div class="setting-item-vertical">
            <div class="setting-info">
              <label>存储方式</label>
              <p class="setting-desc">
                {{ isOPFS ? 'OPFS - 更可靠、更安全的本地存储方案' : 'IndexedDB - 浏览器兼容模式' }}
              </p>
            </div>
            <span class="storage-badge" :class="isOPFS ? 'badge-opfs' : 'badge-idb'">
              <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {{ isOPFS ? 'OPFS' : 'IndexedDB' }}
            </span>
          </div>
        </div>
      </section>

      <!-- 危险操作卡片 -->
      <section class="settings-card card-danger">
        <div class="card-header">
          <svg class="card-icon icon-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <h2 class="h2-danger">危险操作</h2>
        </div>
        <div class="card-body">
          <div class="setting-item-vertical">
            <div class="setting-info">
              <label>清除所有数据</label>
              <p class="setting-desc danger-text">此操作将删除所有书籍、书签、笔记和进度数据，且不可撤销</p>
            </div>
            <button class="btn btn-danger" @click="handleClearAllData">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              清除所有数据
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { StorageService } from '@/services/StorageService'
import { DEFAULT_SETTINGS } from '@/utils/settings'
import type { ReaderSettings } from '@/types'

const router = useRouter()
const settings = ref<ReaderSettings>({ ...DEFAULT_SETTINGS })
const isOPFS = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const saveSettings = async () => {
  await StorageService.saveSettings(settings.value)
}

const handleExportData = async () => {
  try {
    const blob = await StorageService.getAllDataExport()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ebook-reader-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    alert('数据导出成功！')
  } catch (error) {
    console.error('Export failed:', error)
    alert('导出失败：' + (error as Error).message)
  }
}

const handleImportData = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    await StorageService.importAllData(text)
    alert('数据导入成功！请刷新页面。')
    window.location.reload()
  } catch (error) {
    console.error('Import failed:', error)
    alert('导入失败：' + (error as Error).message)
  }
  target.value = ''
}

const handleClearAllData = async () => {
  if (confirm('确定要清除所有数据吗？此操作不可撤销。')) {
    await StorageService.clearAllData()
    settings.value = { ...DEFAULT_SETTINGS }
    alert('所有数据已清除')
    window.location.reload()
  }
}

onMounted(async () => {
  isOPFS.value = StorageService.isOPFS()
  const saved = await StorageService.getSettings()
  if (saved) {
    settings.value = { ...DEFAULT_SETTINGS, ...saved }
  }
})
</script>

<style scoped>
.settings-view {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 20px;
  min-height: 100vh;
  background: #f5f5f5;
}

/* 头部 */
.settings-header {
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: white;
  color: #333;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f0f0f0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.settings-header h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #1a1a1a;
}

/* 卡片 */
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s;
}

.settings-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 24px 0;
}

.card-icon {
  width: 20px;
  height: 20px;
  color: #1890ff;
  flex-shrink: 0;
}

.icon-danger {
  color: #ff4d4f;
}

.card-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.h2-danger {
  color: #ff4d4f;
}

.card-body {
  padding: 16px 24px 20px;
}

.card-danger {
  border: 1px solid rgba(255, 77, 79, 0.15);
}

/* 设置项 */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-item label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.setting-item select {
  padding: 8px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 120px;
  background: #fafafa;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
  font-family: "Kaiti SC", "STKaiti", "KaiTi", "AR PL UKai CN", serif;
}

.setting-item select:hover {
  border-color: #1890ff;
}

.setting-item select:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.setting-item-vertical {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item-vertical:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-info {
  flex: 1;
}

.setting-info label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 13px;
  color: #999;
  margin: 0;
  line-height: 1.4;
}

.danger-text {
  color: #ff7875;
}

/* 按钮 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: "Kaiti SC", "STKaiti", "KaiTi", "AR PL UKai CN", serif;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn:active {
  transform: scale(0.97);
}

.btn-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.btn-primary {
  background: #1890ff;
  color: white;
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.3);
}

.btn-primary:hover {
  background: #40a9ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
  transform: translateY(-1px);
}

.btn-secondary {
  background: #52c41a;
  color: white;
  box-shadow: 0 2px 6px rgba(82, 196, 26, 0.3);
}

.btn-secondary:hover {
  background: #73d13d;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.4);
  transform: translateY(-1px);
}

.btn-danger {
  background: #fff;
  color: #ff4d4f;
  border: 1px solid #ff4d4f;
}

.btn-danger:hover {
  background: #ff4d4f;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
  transform: translateY(-1px);
}

/* 存储状态徽章 */
.storage-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
}

.badge-icon {
  width: 14px;
  height: 14px;
}

.badge-opfs {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.badge-idb {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}
</style>
