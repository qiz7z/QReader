<template>
  <div class="pdf-reader">
    <div v-if="loading" class="loading">正在加载 PDF...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div class="pdf-pages-wrapper">
        <div class="pdf-pages" :style="pagesStyle">
          <div v-for="pageNum in totalPages" :key="pageNum" class="pdf-page-wrapper">
            <canvas :ref="(el) => setCanvasRef(pageNum, el)" class="pdf-page"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

const BASE_RENDER_SCALE = 3.0

const props = defineProps<{
  rawFile: ArrayBuffer | null
  scale: number
}>()

const loading = ref(true)
const error = ref('')
const totalPages = ref(0)
const canvasRefs = new Map<number, HTMLCanvasElement>()
const renderTasks = new Map<number, any>()
let pdfDoc: any = null

const zoomRatio = computed(() => props.scale / BASE_RENDER_SCALE)

const pagesStyle = computed(() => ({
  zoom: `${zoomRatio.value}`,
}))

function setCanvasRef(pageNum: number, el: any) {
  if (!el) return
  canvasRefs.set(pageNum, el)
  if (pdfDoc) renderPage(pageNum)
}

async function renderPage(pageNum: number) {
  const canvas = canvasRefs.get(pageNum)
  if (!canvas || !pdfDoc) return

  if (renderTasks.has(pageNum)) {
    try { renderTasks.get(pageNum).cancel() } catch {}
    renderTasks.delete(pageNum)
  }

  try {
    const page = await pdfDoc.getPage(pageNum)
    const dpr = window.devicePixelRatio || 1
    const viewport = page.getViewport({ scale: BASE_RENDER_SCALE })

    canvas.width = Math.floor(viewport.width * dpr)
    canvas.height = Math.floor(viewport.height * dpr)
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`

    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const task = page.render({ canvasContext: ctx, viewport })
    renderTasks.set(pageNum, task)
    await task.promise
    renderTasks.delete(pageNum)
  } catch (e: any) {
    if (e?.name !== 'RenderingCancelledException') {
      console.warn('Render error:', e.message)
    }
  }
}

async function loadPDF() {
  if (!props.rawFile) return

  loading.value = true
  error.value = ''
  totalPages.value = 0
  canvasRefs.clear()
  renderTasks.clear()
  if (pdfDoc) try { pdfDoc.destroy() } catch {}
  pdfDoc = null

  try {
    const doc = await pdfjsLib.getDocument({ data: props.rawFile }).promise
    pdfDoc = doc
    totalPages.value = doc.numPages
    loading.value = false
  } catch (err: any) {
    error.value = '加载失败：' + err.message
    loading.value = false
  }
}

watch(() => props.rawFile, loadPDF, { immediate: true })
</script>

<style scoped>
.pdf-reader {
  width: 100%;
  height: 100%;
  position: relative;
}

.loading, .error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #8b5a2b;
}

.error {
  color: #c62828;
}

.pdf-pages-wrapper {
  padding: 20px;
  background: #f5f5f5;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden auto;
}

.pdf-pages-wrapper::-webkit-scrollbar {
  width: 6px;
}
.pdf-pages-wrapper::-webkit-scrollbar-track {
  background: transparent;
}
.pdf-pages-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.15);
  border-radius: 3px;
}

.pdf-pages {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 40px 20px;
}

.pdf-page-wrapper {
  position: relative;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.12);
  background: white;
  border-radius: 4px;
  flex-shrink: 0;
}

.pdf-page {
  display: block;
}
</style>
