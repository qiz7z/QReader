<template>
  <div class="app-layout" :class="themeClass">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useReaderStore } from '@/stores/reader'

const readerStore = useReaderStore()
const themeClass = computed(() => `theme-${readerStore.theme}`)
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background-color: #0c1527;
  transition: background-color 0.3s, color 0.3s;
}
</style>
