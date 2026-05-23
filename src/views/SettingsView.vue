<template>
  <div class="settings-view">
    <header class="settings-header">
      <h1>设置</h1>
    </header>
    <main class="settings-content">
      <section class="settings-section">
        <h2>阅读设置</h2>
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
        <div class="setting-item">
          <label>默认字体粗细</label>
          <select v-model="settings.fontWeight" @change="saveSettings">
            <option v-for="weight in 7" :key="weight" :value="weight">
              {{ weight }} 档
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
      </section>
      <section class="settings-section">
        <h2>数据管理</h2>
        <div class="setting-item-vertical">
          <label>导出所有数据</label>
          <p class="setting-desc">将所有书籍、书签、笔记和进度导出为 JSON 文件</p>
          <button class="primary-btn" @click="handleExportData">
            导出数据
          </button>
        </div>
        <div class="setting-item-vertical">
          <label>导入数据</label>
          <p class="setting-desc">从 JSON 文件导入数据（将合并现有数据）</p>
          <input
            type="file"
            ref="fileInputRef"
            accept=".json,application/json"
            @change="handleImportData"
            style="display: none"
          />
          <button class="secondary-btn" @click="triggerFileInput">
            导入数据
          </button>
        </div>
        <div class="setting-item-vertical">
          <label>存储方式</label>
          <p class="setting-desc">
            {{ isOPFS ? 'OPFS (Origin Private File System) - 更可靠、更安全' : 'IndexedDB - 浏览器兼容模式' }}
          </p>
          <span class="storage-status">{{ isOPFS ? '✓ OPFS' : '✓ IndexedDB' }}</span>
        </div>
        <p class="setting-desc" style="margin-top: 20px; color: #ff4d4f;">
          ⚠️ 危险操作：清除所有数据
        </p>
        <button class="danger-btn" @click="handleClearAllData">
          清除所有数据
        </button>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { StorageService } from '@/services/StorageService'
import { DEFAULT_SETTINGS } from '@/utils/settings'
import type { ReaderSettings } from '@/types'

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
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.settings-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.settings-header h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.settings-section {
  margin-bottom: 30px;
}

.settings-section h2 {
  font-size: 18px;
  color: #555;
  margin-bottom: 15px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item-vertical {
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item-vertical label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.setting-item label {
  font-size: 14px;
  color: #666;
}

.setting-item select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 120px;
}

.setting-desc {
  font-size: 14px;
  color: #666;
  margin: 0 0 10px;
}

.danger-btn {
  padding: 10px 20px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.danger-btn:hover {
  background-color: #ff7875;
}

.primary-btn {
  padding: 10px 20px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  margin-top: 10px;
}

.primary-btn:hover {
  background-color: #40a9ff;
}

.secondary-btn {
  padding: 10px 20px;
  background-color: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  margin-top: 10px;
}

.secondary-btn:hover {
  background-color: #73d13d;
}

.storage-status {
  display: inline-block;
  padding: 4px 12px;
  background-color: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-top: 8px;
}
</style>
