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
        <p class="setting-desc">清除所有书籍、书签、笔记和阅读进度</p>
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

const saveSettings = async () => {
  await StorageService.saveSettings(settings.value)
}

const handleClearAllData = async () => {
  if (confirm('确定要清除所有数据吗？此操作不可撤销。')) {
    await StorageService.deleteAllData()
    settings.value = { ...DEFAULT_SETTINGS }
    alert('所有数据已清除')
    window.location.reload()
  }
}

onMounted(async () => {
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
</style>
