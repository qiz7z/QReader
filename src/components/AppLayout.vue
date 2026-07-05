<template>
  <div class="app-layout" :class="themeClass">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useReaderStore } from '@/stores/reader'

const readerStore = useReaderStore()
const themeClass = computed(() => `theme-${readerStore.theme}`)

// Synchronize theme class to <body> and <html>
// Global CSS selectors (.theme-dark body, .theme-dark body::before, etc.) target these elements
function syncThemeClass(theme: string) {
  const body = document.body
  const root = document.documentElement
  const cleanClass = (el: HTMLElement) => {
    const classes = Array.from(el.classList)
    classes.forEach(c => {
      if (c.startsWith('theme-')) el.classList.remove(c)
    })
  }
  cleanClass(body)
  cleanClass(root)
  body.classList.add(`theme-${theme}`)
  root.classList.add(`theme-${theme}`)
}

// React to theme changes from store
watch(() => readerStore.theme, syncThemeClass, { immediate: true })

// Apply on mount
onMounted(() => {
  syncThemeClass(readerStore.theme)
})

// Cleanup when component unmounts
onBeforeUnmount(() => {
  const body = document.body
  const root = document.documentElement
  const classes = Array.from(body.classList)
  body.classList.remove(...classes.filter(c => c.startsWith('theme-')))
  const rootClasses = Array.from(root.classList)
  root.classList.remove(...rootClasses.filter(c => c.startsWith('theme-')))
})
</script>

<style scoped>
.app-layout {
  height: 100%;
  max-height: 100%;
  min-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  transition: background-color 0.3s, color 0.3s;
}
</style>
