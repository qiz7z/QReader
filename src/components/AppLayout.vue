<template>
  <div class="app-layout" :class="themeClass">
    <nav class="app-nav" :class="{ 'nav-hidden': isFullscreen }">
      <router-link to="/" class="nav-link">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        首页
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
  height: 50px;
  align-items: center;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-icon {
  width: 18px;
  height: 18px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.nav-link:hover {
  background: rgba(0,0,0,0.04);
  color: #333;
}

.nav-link:hover .nav-icon {
  opacity: 1;
}

.nav-link.router-link-active {
  background: rgba(24,144,255,0.08);
  color: #1890ff;
}

.nav-link.router-link-active .nav-icon {
  stroke: #1890ff;
  opacity: 1;
}

/* 夜间主题 */
.theme-dark.app-layout {
  background-color: #1a1a1a;
  color: #e0e0e0;
}
.theme-dark .app-nav {
  background: rgba(26,26,26,0.9);
  border-bottom-color: rgba(255,255,255,0.06);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.theme-dark .nav-link {
  color: #e0e0e0;
}
.theme-dark .nav-link:hover {
  background: rgba(255,255,255,0.06);
  color: #fff;
}
.theme-dark .nav-link.router-link-active {
  background: rgba(24,144,255,0.15);
  color: #40a9ff;
}
.theme-dark .nav-link.router-link-active .nav-icon {
  stroke: #40a9ff;
}

/* 护眼主题 */
.theme-green.app-layout {
  background-color: #e8f0e3;
  color: #3a5a3a;
}
.theme-green .app-nav {
  background: rgba(232,240,227,0.9);
  border-bottom-color: #d4e8c8;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.theme-green .nav-link {
  color: #3a5a3a;
}
.theme-green .nav-link:hover {
  background: rgba(90,158,66,0.1);
  color: #2d4a1e;
}
.theme-green .nav-link.router-link-active {
  background: rgba(90,158,66,0.15);
  color: #5a9e42;
}
.theme-green .nav-link.router-link-active .nav-icon {
  stroke: #5a9e42;
}

/* 羊皮卷主题 */
.theme-parchment.app-layout {
  background-color: #f5e6c8;
  color: #3d2a00;
}
.theme-parchment .app-nav {
  background: rgba(245,230,200,0.9);
  border-bottom-color: rgba(201,168,76,0.3);
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
.theme-parchment .nav-link {
  color: #7a6a4a;
}
.theme-parchment .nav-link:hover {
  background: rgba(139,105,20,0.08);
  color: #3d2a00;
}
.theme-parchment .nav-link.router-link-active {
  background: rgba(139,105,20,0.12);
  color: #8b6914;
}
.theme-parchment .nav-link.router-link-active .nav-icon {
  stroke: #8b6914;
}
</style>
