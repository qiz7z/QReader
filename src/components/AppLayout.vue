<template>
  <div class="app-layout" :class="themeClass">
    <nav class="app-nav" :class="{ 'nav-hidden': isFullscreen }">
      <router-link to="/" class="nav-link">
        <span class="nav-link-bg"></span>
        <span class="nav-link-content">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span class="nav-text">首页</span>
        </span>
      </router-link>
    </nav>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useReaderStore } from '@/stores/reader'

const readerStore = useReaderStore()
const themeClass = computed(() => `theme-${readerStore.theme}`)

const isFullscreen = ref(false)

function handleFsChange() {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFsChange)
  isFullscreen.value = !!document.fullscreenElement
})
onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFsChange)
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background-color: #f9f9f9;
  transition: background-color 0.3s, color 0.3s;
}

.app-nav {
  display: flex;
  gap: 20px;
  padding: 0 24px;
  height: 48px;
  align-items: center;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
}

/* ===== 首页按钮：精致胶囊设计 ===== */
.nav-link {
  position: relative;
  display: flex;
  align-items: center;
  text-decoration: none;
  padding: 0;
  border-radius: 999px;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-link-bg {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-link-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px 7px 14px;
  z-index: 1;
}

.nav-icon {
  width: 18px;
  height: 18px;
  color: #555;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-text {
  font-size: 13.5px;
  font-weight: 600;
  color: #444;
  letter-spacing: 0.3px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 悬停态 */
.nav-link:hover {
  transform: translateY(-1px);
}
.nav-link:hover .nav-link-bg {
  background: linear-gradient(135deg, #fff 0%, #f0f2f5 100%);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9);
  border-color: rgba(24,144,255,0.2);
}
.nav-link:hover .nav-icon {
  color: #1890ff;
}
.nav-link:hover .nav-text {
  color: #1890ff;
}

/* 激活态 */
.nav-link.router-link-active {
  transform: translateY(-1px);
}
.nav-link.router-link-active .nav-link-bg {
  background: linear-gradient(135deg, rgba(24,144,255,0.08) 0%, rgba(24,144,255,0.15) 100%);
  border-color: rgba(24,144,255,0.25);
  box-shadow: 0 2px 8px rgba(24,144,255,0.12), inset 0 1px 0 rgba(255,255,255,0.5);
}
.nav-link.router-link-active .nav-icon {
  color: #1890ff;
  stroke: #1890ff;
}
.nav-link.router-link-active .nav-text {
  color: #1890ff;
}

/* 点击态 */
.nav-link:active {
  transform: translateY(0) scale(0.98);
}
.nav-link:active .nav-link-bg {
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), inset 0 1px 2px rgba(0,0,0,0.04);
}

/* ===== 夜间主题 ===== */
.theme-dark.app-layout {
  background-color: #1a1a1a;
  color: #e0e0e0;
}
.theme-dark .app-nav {
  background: rgba(26,26,26,0.9);
  border-bottom-color: rgba(255,255,255,0.06);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.theme-dark .nav-link-bg {
  background: linear-gradient(135deg, #2a2a2a 0%, #222 100%);
  border-color: rgba(255,255,255,0.08);
  box-shadow: 0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04);
}
.theme-dark .nav-icon,
.theme-dark .nav-text {
  color: #ccc;
}
.theme-dark .nav-link:hover .nav-link-bg {
  background: linear-gradient(135deg, #333 0%, #2a2a2a 100%);
  border-color: rgba(64,169,255,0.3);
  box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
}
.theme-dark .nav-link:hover .nav-icon,
.theme-dark .nav-link:hover .nav-text {
  color: #40a9ff;
}
.theme-dark .nav-link.router-link-active .nav-link-bg {
  background: linear-gradient(135deg, rgba(24,144,255,0.15) 0%, rgba(24,144,255,0.22) 100%);
  border-color: rgba(64,169,255,0.35);
  box-shadow: 0 2px 8px rgba(24,144,255,0.15), inset 0 1px 0 rgba(255,255,255,0.04);
}
.theme-dark .nav-link.router-link-active .nav-icon,
.theme-dark .nav-link.router-link-active .nav-text {
  color: #40a9ff;
}

/* ===== 护眼主题 ===== */
.theme-green.app-layout {
  background-color: #e8f0e3;
  color: #3a5a3a;
}
.theme-green .app-nav {
  background: rgba(232,240,227,0.9);
  border-bottom-color: #d4e8c8;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.theme-green .nav-link-bg {
  background: linear-gradient(135deg, #f0f7eb 0%, #e0ebd8 100%);
  border-color: rgba(90,158,66,0.15);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6);
}
.theme-green .nav-icon,
.theme-green .nav-text {
  color: #4a7a4a;
}
.theme-green .nav-link:hover .nav-link-bg {
  background: linear-gradient(135deg, #f8fcf5 0%, #e8f0e3 100%);
  border-color: rgba(90,158,66,0.35);
  box-shadow: 0 4px 12px rgba(90,158,66,0.1), inset 0 1px 0 rgba(255,255,255,0.7);
}
.theme-green .nav-link:hover .nav-icon,
.theme-green .nav-link:hover .nav-text {
  color: #5a9e42;
}
.theme-green .nav-link.router-link-active .nav-link-bg {
  background: linear-gradient(135deg, rgba(90,158,66,0.12) 0%, rgba(90,158,66,0.2) 100%);
  border-color: rgba(90,158,66,0.4);
  box-shadow: 0 2px 8px rgba(90,158,66,0.12), inset 0 1px 0 rgba(255,255,255,0.4);
}
.theme-green .nav-link.router-link-active .nav-icon,
.theme-green .nav-link.router-link-active .nav-text {
  color: #5a9e42;
}

/* ===== 羊皮卷主题 ===== */
.theme-parchment.app-layout {
  background-color: #f5e6c8;
  color: #3d2a00;
}
.theme-parchment .app-nav {
  background: rgba(245,230,200,0.9);
  border-bottom-color: rgba(201,168,76,0.3);
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
.theme-parchment .nav-link-bg {
  background: linear-gradient(135deg, #f0e6d0 0%, #e0d0b0 100%);
  border-color: rgba(139,105,20,0.15);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5);
}
.theme-parchment .nav-icon,
.theme-parchment .nav-text {
  color: #6a5a3a;
}
.theme-parchment .nav-link:hover .nav-link-bg {
  background: linear-gradient(135deg, #f8f0e0 0%, #ece0cc 100%);
  border-color: rgba(139,105,20,0.35);
  box-shadow: 0 4px 12px rgba(139,105,20,0.08), inset 0 1px 0 rgba(255,255,255,0.6);
}
.theme-parchment .nav-link:hover .nav-icon,
.theme-parchment .nav-link:hover .nav-text {
  color: #8b6914;
}
.theme-parchment .nav-link.router-link-active .nav-link-bg {
  background: linear-gradient(135deg, rgba(139,105,20,0.1) 0%, rgba(139,105,20,0.18) 100%);
  border-color: rgba(139,105,20,0.4);
  box-shadow: 0 2px 8px rgba(139,105,20,0.1), inset 0 1px 0 rgba(255,255,255,0.4);
}
.theme-parchment .nav-link.router-link-active .nav-icon,
.theme-parchment .nav-link.router-link-active .nav-text {
  color: #8b6914;
}
</style>
