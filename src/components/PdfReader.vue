<template>
  <div class="pdf-reader">
    <div v-if="loading" class="loading">正在加载 PDF...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div ref="pagesWrapperRef" class="pdf-pages-wrapper" @scroll.passive="onScroll">
        <div ref="pagesElRef" class="pdf-pages">
          <div
            v-for="pageNum in totalPages"
            :key="pageNum"
            class="pdf-page-wrapper"
            :data-page="pageNum"
            :style="pageSlotStyle(pageNum)"
          >
            <canvas :ref="(el) => setCanvasRef(pageNum, el)" class="pdf-page"></canvas>
            <!-- 标注叠加层 -->
            <canvas
              :ref="(el) => setAnnotationCanvasRef(pageNum, el)"
              class="annotation-overlay"
              :class="{ 'annotation-eraser': eraserMode, 'annotation-hidden': !annotationMode }"
              :data-page="pageNum"
              @mousedown="handleAnnotationStart"
              @mousemove="handleAnnotationMove"
              @mouseup="handleAnnotationUp"
              @mouseleave="handleAnnotationLeave"
            ></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import type { PdfAnnotation, Point } from '@/utils/annotationStorage'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const BASE_RENDER_SCALE = 2.0
/** 视口外预渲染缓冲（页数） */
const LAZY_BUFFER = 1

const props = defineProps<{
  rawFile: ArrayBuffer | null
  scale: number
  annotationMode?: boolean
  annotations?: PdfAnnotation[]
  penColor?: string
  penWidth?: number
  eraserMode?: string // '' | 'lasso' | 'line'
  highlighterMode?: boolean // 荧光笔模式
  highlighterWidth?: number // 荧光笔宽度
}>()

const emit = defineEmits<{
  (e: 'annotations-change', annotations: PdfAnnotation[]): void
  (e: 'erase-annotation', annotationId: string): void
}>()

const loading = ref(true)
const error = ref('')
const totalPages = ref(0)
const pagesWrapperRef = ref<HTMLElement | null>(null)
const pagesElRef = ref<HTMLElement | null>(null)
const canvasRefs = new Map<number, HTMLCanvasElement>()
const annotationCanvasRefs = new Map<number, HTMLCanvasElement>()
const renderTasks = new Map<number, any>()
/** 已成功渲染过的页（缓存，滚回时跳过重渲） */
const renderedPages = new Set<number>()
/** 每页 CSS 占位高度（BASE_RENDER_SCALE 下，响应式以便模板刷新） */
const pageHeights = ref<Record<number, number>>({})
let pdfDoc: any = null
let scrollRafId = 0

// 标注相关（高频变量用非响应式，避免每点触发依赖追踪）
const isDrawing = ref(false)
let currentPoints: Point[] = []
const currentPageNum = ref<number>(0)
let cachedRect: DOMRect | null = null
let lassoSnapshot: HTMLCanvasElement | null = null

const isErasing = ref(false)
let eraserPoints: Point[] = []
const erasedIds = ref<Set<string>>(new Set())
const eraserPageNum = ref(0)

watch(() => props.scale, (s) => resizeCanvases(s))

function pageSlotStyle(pageNum: number) {
  const h = pageHeights.value[pageNum]
  return h ? { minHeight: `${h}px` } : undefined
}

function setCanvasRef(pageNum: number, el: any) {
  if (!el) {
    canvasRefs.delete(pageNum)
    return
  }
  canvasRefs.set(pageNum, el as HTMLCanvasElement)
}

function setAnnotationCanvasRef(pageNum: number, el: any) {
  if (!el) {
    annotationCanvasRefs.delete(pageNum)
    return
  }
  annotationCanvasRefs.set(pageNum, el as HTMLCanvasElement)

  const pdfCanvas = canvasRefs.get(pageNum)
  if (pdfCanvas && pdfCanvas.width) {
    el.width = pdfCanvas.width
    el.height = pdfCanvas.height
    el.style.width = pdfCanvas.style.width
    el.style.height = pdfCanvas.style.height
  }

  if (pdfDoc && renderedPages.has(pageNum) && props.annotations?.length) {
    renderAnnotations(pageNum)
  }
}

/** 根据滚动位置算出可见页区间（含缓冲） */
function getVisibleRange(): [number, number] {
  const wrapper = pagesWrapperRef.value
  const pagesEl = pagesElRef.value
  const n = totalPages.value
  if (!wrapper || !pagesEl || n === 0) return [1, Math.min(2, n || 1)]

  const wrappers = pagesEl.querySelectorAll('.pdf-page-wrapper')
  if (!wrappers.length) return [1, Math.min(2, n)]

  const wrapRect = wrapper.getBoundingClientRect()
  const pad = 80
  let first = 1
  let last = n
  let found = false

  for (let i = 0; i < wrappers.length; i++) {
    const el = wrappers[i] as HTMLElement
    const r = el.getBoundingClientRect()
    const page = i + 1
    if (r.bottom >= wrapRect.top - pad && r.top <= wrapRect.bottom + pad) {
      if (!found) {
        first = page
        found = true
      }
      last = page
    } else if (found && r.top > wrapRect.bottom + pad) {
      break
    }
  }

  if (!found) {
    const ratio = wrapper.scrollHeight > 0 ? wrapper.scrollTop / wrapper.scrollHeight : 0
    first = Math.max(1, Math.floor(ratio * n) + 1)
    last = first
  }

  return [
    Math.max(1, first - LAZY_BUFFER),
    Math.min(n, last + LAZY_BUFFER),
  ]
}

function checkVisiblePages() {
  if (!pdfDoc || loading.value) return
  const [from, to] = getVisibleRange()
  for (let p = from; p <= to; p++) {
    if (!renderedPages.has(p) && canvasRefs.has(p)) {
      void renderPage(p)
    }
  }
}

function onScroll() {
  if (scrollRafId) return
  scrollRafId = requestAnimationFrame(() => {
    scrollRafId = 0
    checkVisiblePages()
  })
}

async function ensurePageMetrics() {
  if (!pdfDoc || totalPages.value === 0) return
  // 用第 1 页量尺寸，未渲染页用同样占位（多数 PDF 页尺寸一致）
  try {
    const page = await pdfDoc.getPage(1)
    const vp = page.getViewport({ scale: BASE_RENDER_SCALE })
    const next: Record<number, number> = { ...pageHeights.value }
    for (let i = 1; i <= totalPages.value; i++) {
      if (next[i] == null) next[i] = vp.height
    }
    pageHeights.value = next
  } catch {
    /* ignore */
  }
}

async function renderPage(pageNum: number) {
  const canvas = canvasRefs.get(pageNum)
  if (!canvas || !pdfDoc) return
  if (renderedPages.has(pageNum) && canvas.width > 0) return

  if (renderTasks.has(pageNum)) {
    try { renderTasks.get(pageNum).cancel() } catch { /* ignore */ }
    renderTasks.delete(pageNum)
  }

  try {
    const page = await pdfDoc.getPage(pageNum)
    const dpr = Number(window.devicePixelRatio || 1)
    const renderViewport = page.getViewport({ scale: BASE_RENDER_SCALE })

    if (pageHeights.value[pageNum] !== renderViewport.height) {
      pageHeights.value = { ...pageHeights.value, [pageNum]: renderViewport.height }
    }

    canvas.width = Math.floor(renderViewport.width * dpr)
    canvas.height = Math.floor(renderViewport.height * dpr)
    canvas.style.width = `${renderViewport.width}px`
    canvas.style.height = `${renderViewport.height}px`

    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const task = page.render({ canvasContext: ctx, viewport: renderViewport })
    renderTasks.set(pageNum, task)
    await task.promise
    renderTasks.delete(pageNum)
    renderedPages.add(pageNum)

    const annotationCanvas = annotationCanvasRefs.get(pageNum)
    if (annotationCanvas) {
      annotationCanvas.width = canvas.width
      annotationCanvas.height = canvas.height
      annotationCanvas.style.width = canvas.style.width
      annotationCanvas.style.height = canvas.style.height
    }

    if (props.annotations?.length) {
      renderAnnotations(pageNum)
    }

    // 首次渲染后刷新缩放高度基线
    if (basePagesHeight === 0) {
      resizeCanvases(props.scale)
    }
  } catch (e: any) {
    if (e?.name !== 'RenderingCancelledException') {
      console.warn('Render error:', e?.message || e)
    }
  }
}

// 缩放：使用 CSS transform（纯 GPU 合成，不触发 layout/paint）
let basePagesHeight = 0
let resizeRafId = 0
let pendingScale = 0

function resizeCanvases(scale: number) {
  pendingScale = scale
  if (resizeRafId) return
  resizeRafId = requestAnimationFrame(() => {
    resizeRafId = 0
    const r = pendingScale / BASE_RENDER_SCALE
    const pagesEl = pagesElRef.value
    if (!pagesEl) return

    if (basePagesHeight === 0) {
      pagesEl.style.transform = ''
      pagesEl.style.height = ''
      basePagesHeight = pagesEl.offsetHeight
    }

    pagesEl.style.transform = `scale(${r})`
    pagesEl.style.transformOrigin = 'top center'

    if (basePagesHeight > 0) {
      pagesEl.style.height = `${basePagesHeight * r}px`
    }

    checkVisiblePages()
  })
}

function cancelAllRenders() {
  for (const task of renderTasks.values()) {
    try { task.cancel() } catch { /* ignore */ }
  }
  renderTasks.clear()
  if (resizeRafId) {
    cancelAnimationFrame(resizeRafId)
    resizeRafId = 0
  }
  if (scrollRafId) {
    cancelAnimationFrame(scrollRafId)
    scrollRafId = 0
  }
}

function destroyPdf() {
  cancelAllRenders()
  if (pdfDoc) {
    try { pdfDoc.destroy() } catch { /* ignore */ }
    pdfDoc = null
  }
  canvasRefs.clear()
  annotationCanvasRefs.clear()
  renderedPages.clear()
  pageHeights.value = {}
  basePagesHeight = 0
}

/**
 * 渲染单个标注（canvas 内部坐标系）
 */
function renderAnnotation(ctx: CanvasRenderingContext2D, annotation: PdfAnnotation) {
  if (!annotation.points || annotation.points.length === 0) return
  
  ctx.beginPath()
  ctx.strokeStyle = annotation.color
  ctx.lineWidth = annotation.width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  
  // 荧光笔模式：半透明效果
  if (annotation.type === 'highlighter') {
    ctx.globalAlpha = 0.3
  } else if (annotation.opacity !== undefined) {
    ctx.globalAlpha = annotation.opacity
  }
  
  const points = annotation.points
  ctx.moveTo(points[0].x, points[0].y)
  
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  
  ctx.stroke()
  ctx.globalAlpha = 1.0
}

function renderAnnotations(pageNum: number, excludeIds?: Set<string>) {
  const canvas = annotationCanvasRefs.get(pageNum)
  if (!canvas || !pdfDoc) return
  
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  let pageAnnotations = (props.annotations || []).filter(a => a.page === pageNum)
  if (excludeIds && excludeIds.size > 0) {
    pageAnnotations = pageAnnotations.filter(a => !excludeIds.has(a.id))
  }
  
  pageAnnotations.forEach(annotation => {
    renderAnnotation(ctx, annotation)
  })
}

/**
 * 获取鼠标在 Canvas 中的坐标（canvas 内部坐标系）
 */
function getCanvasPoint(canvas: HTMLCanvasElement, event: MouseEvent): Point {
  const rect = cachedRect || canvas.getBoundingClientRect()
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height)
  }
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i].y, yj = polygon[j].y
    const xi = polygon[i].x, xj = polygon[j].x
    if ((yi > point.y) !== (yj > point.y) &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function pointToSegmentDistSq(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) {
    return (p.x - a.x) * (p.x - a.x) + (p.y - a.y) * (p.y - a.y)
  }
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const px = a.x + t * dx
  const py = a.y + t * dy
  return (p.x - px) * (p.x - px) + (p.y - py) * (p.y - py)
}

function checkEraseHit(pageNum: number, point: Point) {
  const HIT_RADIUS_SQ = 30 * 30
  const pageAnnots = (props.annotations || []).filter(a => a.page === pageNum)
  for (const annot of pageAnnots) {
    if (erasedIds.value.has(annot.id)) continue
    if (!annot.points || annot.points.length === 0) continue
    const pts = annot.points

    let hit = false
    for (let i = 0; i < pts.length; i++) {
      if (i < pts.length - 1) {
        const distSq = pointToSegmentDistSq(point, pts[i], pts[i + 1])
        if (distSq < HIT_RADIUS_SQ) { hit = true; break }
      } else {
        const dx = point.x - pts[i].x
        const dy = point.y - pts[i].y
        if (dx * dx + dy * dy < HIT_RADIUS_SQ) { hit = true; break }
      }
    }

    if (hit) {
      erasedIds.value.add(annot.id)
      emit('erase-annotation', annot.id)
    }
  }
}

function handleAnnotationStart(event: MouseEvent) {
  if (!props.annotationMode) return
  const canvas = event.currentTarget as HTMLCanvasElement
  const pageNum = parseInt(canvas.dataset.page || '0')
  // 缓存 rect，避免每次 mousemove 都触发 getBoundingClientRect（强制布局）
  cachedRect = canvas.getBoundingClientRect()
  const point = getCanvasPoint(canvas, event)

  if (props.eraserMode === 'lasso') {
    isErasing.value = true
    eraserPageNum.value = pageNum
    eraserPoints = [point]
    // 快照当前标注层，lasso 预览时用 drawImage 还原，避免逐帧重绘所有标注
    lassoSnapshot = document.createElement('canvas')
    lassoSnapshot.width = canvas.width
    lassoSnapshot.height = canvas.height
    lassoSnapshot.getContext('2d')!.drawImage(canvas, 0, 0)
    return
  }

  if (props.eraserMode === 'line') {
    isErasing.value = true
    eraserPageNum.value = pageNum
    erasedIds.value = new Set()
    checkEraseHit(pageNum, point)
    return
  }

  currentPageNum.value = pageNum
  isDrawing.value = true
  currentPoints = [point]
}

function handleAnnotationMove(event: MouseEvent) {
  if (!props.annotationMode) return
  const canvas = event.currentTarget as HTMLCanvasElement
  const pageNum = parseInt(canvas.dataset.page || '0')
  const point = getCanvasPoint(canvas, event)
  
  if (props.eraserMode === 'lasso' && isErasing.value) {
    eraserPoints.push(point)
    const ctx = canvas.getContext('2d')!
    // 用快照还原标注层，O(1) drawImage 替代逐标注重绘
    if (lassoSnapshot) ctx.drawImage(lassoSnapshot, 0, 0)
    else ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (eraserPoints.length > 1) {
      ctx.beginPath()
      ctx.fillStyle = 'rgba(255, 100, 100, 0.15)'
      ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)'
      ctx.lineWidth = 2
      ctx.setLineDash([8, 4])

      ctx.moveTo(eraserPoints[0].x, eraserPoints[0].y)
      for (let i = 1; i < eraserPoints.length; i++) {
        ctx.lineTo(eraserPoints[i].x, eraserPoints[i].y)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.setLineDash([])
    }
    return
  }

  if (props.eraserMode === 'line' && isErasing.value) {
    checkEraseHit(pageNum, point)
    return
  }

  if (!isDrawing.value) return

  currentPoints.push(point)
  const ctx = canvas.getContext('2d')!

  // 增量绘制：只画上一帧到当前点的线段，不清空、不重绘已有标注
  // 已有标注在交互开始前已渲染在画布上，新增笔画直接叠加
  if (props.highlighterMode) {
    ctx.globalAlpha = 0.3
    ctx.strokeStyle = props.penColor || '#ffff00'
    ctx.lineWidth = props.highlighterWidth || 20
  } else {
    ctx.globalAlpha = 1.0
    ctx.strokeStyle = props.penColor || '#ff0000'
    ctx.lineWidth = props.penWidth || 2
  }
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const pts = currentPoints
  const n = pts.length
  if (n >= 2) {
    ctx.beginPath()
    ctx.moveTo(pts[n - 2].x, pts[n - 2].y)
    ctx.lineTo(pts[n - 1].x, pts[n - 1].y)
    ctx.stroke()
    ctx.globalAlpha = 1.0
  }
}

function handleAnnotationUp(_event: MouseEvent) {
  if (!props.annotationMode) return

  if (props.eraserMode === 'lasso' && isErasing.value) {
    isErasing.value = false
    cachedRect = null
    lassoSnapshot = null
    const polygon = [...eraserPoints]
    eraserPoints = []

    if (polygon.length > 2) {
      const toErase: string[] = []
      const pageAnnots = (props.annotations || []).filter(a => a.page === eraserPageNum.value)
      for (const annot of pageAnnots) {
        if (!annot.points || annot.points.length === 0) continue
        for (const p of annot.points) {
          if (pointInPolygon(p, polygon)) {
            toErase.push(annot.id)
            break
          }
        }
      }
      for (const id of toErase) {
        emit('erase-annotation', id)
      }
    }
    renderAnnotations(eraserPageNum.value)
    return
  }

  if (props.eraserMode === 'line' && isErasing.value) {
    isErasing.value = false
    cachedRect = null
    erasedIds.value = new Set()
    renderAnnotations(eraserPageNum.value)
    return
  }

  if (!isDrawing.value) return

  isDrawing.value = false
  cachedRect = null

  if (currentPoints.length > 1) {
    const annotationType = props.highlighterMode ? 'highlighter' : 'pen'
    const annotationWidth = props.highlighterMode ? (props.highlighterWidth || 20) : (props.penWidth || 2)

    emit('annotations-change', [{
      id: '',
      page: currentPageNum.value,
      type: annotationType,
      color: props.penColor || '#ff0000',
      width: annotationWidth,
      points: currentPoints,
      createdAt: Date.now()
    }])
    // 笔画已在绘制过程中增量渲染到画布上；最终一致状态由 annotations 深度监听统一重绘，无需 setTimeout 重画
  }

  currentPoints = []
}

function handleAnnotationLeave(_event: MouseEvent) {
  cachedRect = null
  lassoSnapshot = null
  if (props.eraserMode === 'lasso' && isErasing.value) {
    isErasing.value = false
    eraserPoints = []
    renderAnnotations(eraserPageNum.value)
    return
  }
  if (props.eraserMode === 'line' && isErasing.value) {
    isErasing.value = false
    erasedIds.value = new Set()
    renderAnnotations(eraserPageNum.value)
    return
  }
  if (isDrawing.value) {
    isDrawing.value = false
    currentPoints = []
  }
}

async function loadPDF() {
  if (!props.rawFile) return

  loading.value = true
  error.value = ''
  totalPages.value = 0
  destroyPdf()

  try {
    // 拷贝一份，避免上层 ArrayBuffer 被 transfer 后失效
    const data = props.rawFile.slice(0)
    const doc = await pdfjsLib.getDocument({ data }).promise
    pdfDoc = doc
    totalPages.value = doc.numPages
    basePagesHeight = 0
    loading.value = false

    await ensurePageMetrics()
    await nextTick()
    // 首屏只渲可见区
    checkVisiblePages()
    resizeCanvases(props.scale)
  } catch (err: any) {
    error.value = '加载失败：' + (err?.message || String(err))
    loading.value = false
  }
}

watch(() => props.rawFile, loadPDF, { immediate: true })
watch(() => props.annotations, (newAnnots) => {
  if (!newAnnots) return
  // 只重绘已缓存页，避免未渲染页空转
  for (const pageNum of renderedPages) {
    renderAnnotations(pageNum)
  }
}, { deep: true })

function scrollToPage(pageNum: number) {
  const pagesContainer = pagesElRef.value
  if (!pagesContainer) return

  const pageWrappers = pagesContainer.querySelectorAll('.pdf-page-wrapper')
  const pageEl = pageWrappers[pageNum - 1] as HTMLElement | undefined

  if (pageEl) {
    pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // 跳转后立即补渲目标页附近
    void nextTick(() => checkVisiblePages())
  }
}

onBeforeUnmount(() => {
  destroyPdf()
})

defineExpose({
  scrollToPage,
  resizeCanvases
})
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
  will-change: transform;
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

.annotation-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: 10;
  cursor: crosshair;
}

.annotation-hidden {
  pointer-events: none;
}

.annotation-eraser {
  cursor: cell;
}
</style>
