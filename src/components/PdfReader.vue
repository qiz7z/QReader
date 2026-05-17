<template>
  <div class="pdf-reader">
    <div v-if="loading" class="loading">正在加载 PDF...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="pdf-pages">
      <div v-if="annotSaveStatus" class="annot-save-status">{{ annotSaveStatus }}</div>
      <div v-for="pageNum in totalPages" :key="pageNum" class="pdf-page-wrapper">
        <canvas :ref="(el) => setCanvasRef(pageNum, el)" class="pdf-page"></canvas>
        <canvas
          :ref="(el) => setAnnotRef(pageNum, el)"
          class="pdf-annot-layer"
          :class="['pdf-annot-layer', { 'annot-active': annotationMode, 'annot-eraser': annotationTool.startsWith('eraser-') }]"
          @mousedown.prevent="onAnnotDown(pageNum, $event)"
          @mousemove.prevent="onAnnotMove($event)"
          @mouseup.prevent="onAnnotUp"
          @mouseleave.prevent="onAnnotUp"
        ></canvas>
        <div
          v-if="annotationTextInput.page === pageNum"
          class="pdf-annot-text-input"
          :style="{ left: annotationTextInput.x + 'px', top: annotationTextInput.y + 'px' }"
        >
          <textarea ref="textInputRef" v-model="annotationTextInput.text" class="annot-textarea" rows="2" @keydown.enter.prevent="confirmTextAnnotation" @blur="confirmTextAnnotation"></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import { StorageService } from '@/services/StorageService'
import type { PdfAnnotation } from '@/types'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

const props = defineProps<{
  rawFile: ArrayBuffer | null
  theme: 'light' | 'dark' | 'green' | 'parchment'
  scale: number
  annotationMode: boolean
  annotationTool: string
  annotColor: string
  annotWidth: number
  currentPage?: number // 当前页码（从 0 开始）
}>()

const loading = ref(true)
const error = ref('')
const totalPages = ref(0)
const canvasRefs = new Map<number, HTMLCanvasElement>()
const annotRefs = new Map<number, HTMLCanvasElement>()
const renderedPages = new Set<number>()
const renderingPages = new Set<number>()
let pdfDoc: any = null

const allAnnotations = ref<PdfAnnotation[]>([])
const isDrawing = ref(false)
const drawingPage = ref(0)
const currentPoints = ref<Array<{ x: number; y: number }>>([])
const annotationTextInput = ref({ page: 0, x: 0, y: 0, text: '' })
const textInputRef = ref<HTMLTextAreaElement | null>(null)
const annotSaveStatus = ref('')

function setCanvasRef(pageNum: number, el: any) {
  if (el instanceof HTMLCanvasElement) {
    canvasRefs.set(pageNum, el)
    if (pdfDoc) renderPage(pageNum)
  } else {
    canvasRefs.delete(pageNum)
    renderedPages.delete(pageNum)
    renderingPages.delete(pageNum)
  }
}

function setAnnotRef(pageNum: number, el: any) {
  if (el instanceof HTMLCanvasElement) {
    annotRefs.set(pageNum, el)
  } else {
    annotRefs.delete(pageNum)
  }
}

function matchAnnotCanvasSize(pageNum: number) {
  const pdfCanvas = canvasRefs.get(pageNum)
  const annotCanvas = annotRefs.get(pageNum)
  if (!pdfCanvas || !annotCanvas) return
  const dpr = window.devicePixelRatio || 1
  const w = Math.round(pdfCanvas.offsetWidth)
  const h = Math.round(pdfCanvas.offsetHeight)
  annotCanvas.width = w * dpr
  annotCanvas.height = h * dpr
  annotCanvas.style.width = w + 'px'
  annotCanvas.style.height = h + 'px'
}

function getAnnotPos(e: MouseEvent, pageNum: number): { x: number; y: number } {
  const annotCanvas = annotRefs.get(pageNum)
  if (!annotCanvas) return { x: 0, y: 0 }
  const rect = annotCanvas.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left),
    y: (e.clientY - rect.top),
  }
}

function drawAllAnnotations(ctx: CanvasRenderingContext2D, pageNum: number) {
  const pageAnnots = allAnnotations.value.filter(a => a.pageNum === pageNum)
  for (const a of pageAnnots) {
    const sf = props.scale / (a.scale || props.scale)
    ctx.beginPath()
    ctx.strokeStyle = a.color
    ctx.fillStyle = a.color
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (a.rects && a.rects.length > 0) {
      ctx.globalAlpha = 0.35
      for (const r of a.rects) {
        ctx.fillRect(r.x * sf, r.y * sf, r.width * sf, r.height * sf)
      }
      ctx.globalAlpha = 1
      continue
    }

    if (a.type === 'text' && a.text) {
      const fs = (a.fontSize || 16) * sf
      ctx.font = `${fs}px sans-serif`
      ctx.fillText(a.text, a.points[0].x * sf, a.points[0].y * sf)
      continue
    }
    ctx.lineWidth = a.width * sf
    ctx.globalAlpha = a.type === 'highlight' ? 0.35 : a.opacity
    if (a.points.length < 1) continue
    ctx.moveTo(a.points[0].x * sf, a.points[0].y * sf)
    for (let i = 1; i < a.points.length; i++) {
      ctx.lineTo(a.points[i].x * sf, a.points[i].y * sf)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
  }
}

function renderPageAnnotations(pageNum: number) {
  const annotCanvas = annotRefs.get(pageNum)
  if (!annotCanvas) return
  const ctx = annotCanvas.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, annotCanvas.width, annotCanvas.height)
  ctx.scale(dpr, dpr)
  drawAllAnnotations(ctx, pageNum)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

function renderAllAnnotations() {
  const pages = new Set(allAnnotations.value.map(a => a.pageNum))
  for (const p of pages) {
    matchAnnotCanvasSize(p)
    renderPageAnnotations(p)
  }
}

async function loadAnnotations() {
  const bookId = getBookId()
  if (!bookId) return
  try {
    allAnnotations.value = await StorageService.getAllAnnotations(bookId)
    if (renderedPages.size > 0) renderAllAnnotations()
  } catch (err) {
    console.warn('Failed to load annotations:', err)
  }
}

function getBookId(): string | null {
  const m = window.location.pathname.match(/\/book\/(.+)/)
  return m ? m[1] : null
}

async function eraseNearestLine(pageNum: number) {
  if (currentPoints.value.length === 0) return
  const pos = currentPoints.value[currentPoints.value.length - 1]
  const pageAnnots = allAnnotations.value.filter(a => a.pageNum === pageNum)
  let nearest: PdfAnnotation | null = null
  let minDist = 15 / props.scale

  for (const a of pageAnnots) {
    const sf = props.scale / (a.scale || props.scale)

    if (a.rects && a.rects.length > 0) {
      for (const r of a.rects) {
        const rx = r.x * sf, ry = r.y * sf, rw = r.width * sf, rh = r.height * sf
        if (pos.x >= rx && pos.x <= rx + rw && pos.y >= ry && pos.y <= ry + rh) {
          nearest = a
          break
        }
      }
      if (nearest) break
      continue
    }

    for (const p of a.points) {
      const dx = p.x * sf - pos.x
      const dy = p.y * sf - pos.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < minDist) {
        minDist = d
        nearest = a
      }
    }
  }

  if (!nearest) return
  allAnnotations.value = allAnnotations.value.filter(a => a !== nearest)
  if (nearest.id) await StorageService.deleteAnnotation(nearest.id)
  renderPageAnnotations(pageNum)
  annotSaveStatus.value = '线条已擦除'
  setTimeout(() => { annotSaveStatus.value = '' }, 1500)
}

function onAnnotDown(pageNum: number, e: MouseEvent) {
  if (props.annotationTool === 'text') {
    const pos = getAnnotPos(e, pageNum)
    annotationTextInput.value = { page: pageNum, x: pos.x, y: pos.y, text: '' }
    nextTick(() => textInputRef.value?.focus())
    return
  }
  if (props.annotationTool === 'eraser-line') {
    isDrawing.value = true
    drawingPage.value = pageNum
    currentPoints.value = [getAnnotPos(e, pageNum)]
    eraseNearestLine(pageNum)
    renderPageAnnotations(pageNum)
    return
  }
  isDrawing.value = true
  drawingPage.value = pageNum
  currentPoints.value = [getAnnotPos(e, pageNum)]
}

function onAnnotMove(e: MouseEvent) {
  if (!isDrawing.value || !drawingPage.value) return
  const pos = getAnnotPos(e, drawingPage.value)
  currentPoints.value.push(pos)

  const annotCanvas = annotRefs.get(drawingPage.value)
  if (!annotCanvas) return
  const ctx = annotCanvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, annotCanvas.width, annotCanvas.height)
  ctx.scale(dpr, dpr)

  if (props.annotationTool === 'eraser-line') {
    eraseNearestLine(drawingPage.value)
    drawAllAnnotations(ctx, drawingPage.value)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    return
  }

  drawAllAnnotations(ctx, drawingPage.value)

  const pts = currentPoints.value
  ctx.beginPath()
  ctx.strokeStyle = props.annotColor
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = props.annotationTool === 'highlight' ? 18 : props.annotWidth
  ctx.globalAlpha = props.annotationTool === 'highlight' ? 0.35 : 1
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y)
  }
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

async function onAnnotUp() {
  if (!isDrawing.value || !drawingPage.value) {
    isDrawing.value = false
    drawingPage.value = 0
    currentPoints.value = []
    return
  }

  const pageNum = drawingPage.value

  if (props.annotationTool === 'eraser-line') {
    isDrawing.value = false
    drawingPage.value = 0
    currentPoints.value = []
    return
  }

  if (currentPoints.value.length < 2) {
    isDrawing.value = false
    drawingPage.value = 0
    currentPoints.value = []
    return
  }

  const a: Omit<PdfAnnotation, 'id'> = {
    bookId: '',
    pageNum,
    type: props.annotationTool as 'pen' | 'highlight' | 'text',
    color: props.annotColor,
    opacity: props.annotationTool === 'highlight' ? 0.35 : 1,
    width: props.annotationTool === 'highlight' ? 18 : props.annotWidth,
    points: currentPoints.value.map(p => ({ x: p.x, y: p.y })),
    scale: props.scale,
    createdAt: Date.now(),
  }
  const bookId = getBookId()
  if (!bookId) {
    isDrawing.value = false
    drawingPage.value = 0
    currentPoints.value = []
    return
  }
  a.bookId = bookId
  annotSaveStatus.value = '保存中...'
  try {
    const saved = await StorageService.addAnnotation(a)
    allAnnotations.value.push(saved)
    annotSaveStatus.value = '已保存'
    setTimeout(() => { annotSaveStatus.value = '' }, 1500)
  } catch (err: any) {
    console.warn('Failed to save annotation:', err)
    annotSaveStatus.value = '保存失败: ' + (err.message || err)
    setTimeout(() => { annotSaveStatus.value = '' }, 5000)
  }
  isDrawing.value = false
  drawingPage.value = 0
  currentPoints.value = []
  renderPageAnnotations(pageNum)
}

async function confirmTextAnnotation() {
  const input = annotationTextInput.value
  if (!input.text.trim() || !input.page) {
    annotationTextInput.value = { page: 0, x: 0, y: 0, text: '' }
    return
  }
  const a = {
    bookId: '',
    pageNum: input.page,
    type: 'text' as const,
    color: props.annotColor,
    opacity: 1,
    width: 0,
    points: [{ x: input.x, y: input.y }],
    text: input.text.trim(),
    fontSize: 16,
    scale: props.scale,
    createdAt: Date.now(),
  }
  try {
    const bookId = getBookId()
    if (!bookId) return
    a.bookId = bookId
    const saved = await StorageService.addAnnotation(a)
    allAnnotations.value.push(saved)
    renderPageAnnotations(input.page)
  } catch (err) {
    console.warn('Failed to save text annotation:', err)
  }
  annotationTextInput.value = { page: 0, x: 0, y: 0, text: '' }
}

async function undoLastAnnotation(pageNum: number) {
  const pageAnnots = allAnnotations.value.filter(a => a.pageNum === pageNum)
  if (pageAnnots.length === 0) return
  const last = pageAnnots[pageAnnots.length - 1]
  if (last.id) await StorageService.deleteAnnotation(last.id)
  allAnnotations.value = allAnnotations.value.filter(a => a !== last)
  renderPageAnnotations(pageNum)
}

async function undoLastGlobal() {
  if (allAnnotations.value.length === 0) return
  const last = allAnnotations.value[allAnnotations.value.length - 1]
  if (last.id) await StorageService.deleteAnnotation(last.id)
  allAnnotations.value = allAnnotations.value.filter(a => a !== last)
  renderPageAnnotations(last.pageNum)
}

async function clearPageAnnotations(pageNum: number) {
  const pageAnnots = allAnnotations.value.filter(a => a.pageNum === pageNum)
  for (const a of pageAnnots) {
    if (a.id) await StorageService.deleteAnnotation(a.id)
  }
  allAnnotations.value = allAnnotations.value.filter(a => a.pageNum !== pageNum)
  renderPageAnnotations(pageNum)
}

async function clearAllAnnotations() {
  for (const a of allAnnotations.value) {
    if (a.id) await StorageService.deleteAnnotation(a.id)
  }
  const rendered = new Set(allAnnotations.value.map(a => a.pageNum))
  allAnnotations.value = []
  for (const p of rendered) renderPageAnnotations(p)
}

function getPageAnnotations(pageNum: number): PdfAnnotation[] {
  return allAnnotations.value.filter(a => a.pageNum === pageNum)
}

async function loadPdf() {
  if (!props.rawFile) return
  loading.value = true
  error.value = ''
  renderedPages.clear()
  renderingPages.clear()
  allAnnotations.value = []
  try {
    const data = props.rawFile.slice(0)
    const pdfOptions: any = {
      data,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    }
    pdfDoc = await pdfjsLib.getDocument(pdfOptions).promise
    totalPages.value = pdfDoc.numPages
    await renderAllPages()
    await loadAnnotations()
  } catch (e: any) {
    error.value = 'PDF 加载失败：' + (e.message || '未知错误')
  } finally {
    loading.value = false
  }
}

async function renderPage(pageNum: number) {
  if (renderedPages.has(pageNum) || renderingPages.has(pageNum)) return
  const canvas = canvasRefs.get(pageNum)
  if (!canvas || !pdfDoc) return
  renderingPages.add(pageNum)
  try {
    const page = await pdfDoc.getPage(pageNum)
    const visualScale = props.scale
    const dpr = window.devicePixelRatio || 1
    const scale = visualScale * dpr
    const viewport = page.getViewport({ scale })
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    canvas.style.display = 'block'
    canvas.style.width = `${Math.round(viewport.width / dpr)}px`
    canvas.style.height = `${Math.round(viewport.height / dpr)}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    const renderTask = page.render({ canvasContext: ctx, viewport })
    await renderTask.promise
    renderedPages.add(pageNum)
    matchAnnotCanvasSize(pageNum)
    renderPageAnnotations(pageNum)
  } catch (e) {
    console.warn(`Failed to render page ${pageNum}:`, e)
  } finally {
    renderingPages.delete(pageNum)
  }
}

async function renderAllPages() {
  const promises: Promise<void>[] = []
  for (let i = 1; i <= totalPages.value; i++) {
    promises.push(renderPage(i))
  }
  // 同时渲染前几页，后续依次
  for (let i = 0; i < promises.length; i++) {
    await promises[i]
  }
}

watch(() => props.rawFile, loadPdf, { immediate: true })

watch(() => props.scale, () => {
  if (pdfDoc) {
    renderedPages.clear()
    renderingPages.clear()
    renderAllPages()
  }
})

// 监听 currentPage 变化，滚动到指定页面
watch(() => props.currentPage, (newPage) => {
  if (newPage !== undefined && newPage >= 0) {
    scrollToPage(newPage + 1) // 转为从 1 开始的页码
  }
})

function scrollToPage(pageNum: number) {
  const wrapper = document.querySelector(`.pdf-page-wrapper:nth-child(${pageNum})`) as HTMLElement
  if (wrapper) {
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

defineExpose({ loadAnnotations, undoLastAnnotation, undoLastGlobal, clearPageAnnotations, clearAllAnnotations, getPageAnnotations, scrollToPage })

watch(() => props.annotationMode, (v) => {
  if (v) {
    // 打开标注模式时直接使用内存中的数据重绘，不从 Dexie 重载
    nextTick(() => renderAllAnnotations())
  }
})

watch(() => props.annotColor, () => {
  if (props.annotationMode && renderedPages.size > 0) {
    renderAllAnnotations()
  }
})
</script>

<style scoped>
.pdf-reader {
  min-height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.pdf-pages {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
}
.pdf-page-wrapper {
  position: relative;
}
.pdf-page {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  background: white;
}
.pdf-annot-layer {
  position: absolute; top: 0; left: 0;
  pointer-events: none;
}
.pdf-annot-layer.annot-active {
  pointer-events: auto;
  cursor: crosshair;
}
.pdf-annot-layer.annot-eraser {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Crect x='4' y='4' width='16' height='16' rx='2' fill='%23fff' stroke='%23000' stroke-width='1.5'/%3E%3C/svg%3E") 12 12, crosshair;
}
.pdf-annot-text-input {
  position: absolute; z-index: 10;
}
.annot-textarea {
  border: 1px dashed #1890ff; border-radius: 4px;
  background: rgba(255,255,255,0.9);
  padding: 4px 8px; font-size: 16px; outline: none;
  min-width: 100px; resize: both; font-family: sans-serif;
}
.annot-save-status {
  position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.7); color: #fff; padding: 4px 16px;
  border-radius: 4px; font-size: 13px; z-index: 100;
  pointer-events: none;
}
</style>
