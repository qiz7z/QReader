<template>
  <div class="pdf-reader">
    <div v-if="loading" class="loading">正在加载 PDF...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div class="pdf-pages-wrapper">
        <div class="pdf-pages" :style="pagesStyle">
          <div v-for="pageNum in totalPages" :key="pageNum" class="pdf-page-wrapper">
            <canvas :ref="(el) => setCanvasRef(pageNum, el)" class="pdf-page"></canvas>
            <!-- 文本层（用于文本选择和高亮） -->
            <div 
              :ref="(el) => setTextLayerRef(pageNum, el)"
              class="text-layer"
              :class="{ 'text-layer-hidden': annotationMode }"
              :data-page="pageNum"
              @mouseup="handleTextSelect"
            ></div>
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
import { ref, computed, watch } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import type { PdfAnnotation, Point } from '@/utils/annotationStorage'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

const BASE_RENDER_SCALE = 3.0

const props = defineProps<{
  rawFile: ArrayBuffer | null
  scale: number
  annotationMode?: boolean
  annotations?: PdfAnnotation[]
  penColor?: string
  penWidth?: number
  eraserMode?: string // '' | 'lasso' | 'line'
}>()

const emit = defineEmits<{
  (e: 'annotations-change', annotations: PdfAnnotation[]): void
  (e: 'erase-annotation', annotationId: string): void
  (e: 'text-highlight', highlight: {id: string, page: number, text: string, color: string, rects: {x: number, y: number, w: number, h: number}[]}): void
}>()

const loading = ref(true)
const error = ref('')
const totalPages = ref(0)
const canvasRefs = new Map<number, HTMLCanvasElement>()
const annotationCanvasRefs = new Map<number, HTMLCanvasElement>()
const textLayerRefs = new Map<number, HTMLDivElement>()
const renderTasks = new Map<number, any>()
let pdfDoc: any = null

// 标注相关
const isDrawing = ref(false)
const currentPoints = ref<Point[]>([])
const currentPageNum = ref<number>(0)

// PDF 高亮相关
const pdfHighlights = ref<{id: string, page: number, text: string, color: string, rects: {x: number, y: number, w: number, h: number}[]}[]>([])

const isErasing = ref(false)
const eraserPoints = ref<Point[]>([])
const erasedIds = ref<Set<string>>(new Set())
const eraserPageNum = ref(0)

const zoomRatio = computed(() => props.scale / BASE_RENDER_SCALE)

const pagesStyle = computed(() => ({
  zoom: `${zoomRatio.value}`,
}))

function setCanvasRef(pageNum: number, el: any) {
  if (!el) return
  canvasRefs.set(pageNum, el)
  if (pdfDoc) renderPage(pageNum)
}

function setTextLayerRef(pageNum: number, el: any) {
  if (!el) return
  textLayerRefs.set(pageNum, el)
  if (pdfDoc) renderTextLayer(pageNum)
}

function setAnnotationCanvasRef(pageNum: number, el: any) {
  if (!el) return
  annotationCanvasRefs.set(pageNum, el)
  
  // 设置标注画布大小（与 PDF 画布相同）
  const pdfCanvas = canvasRefs.get(pageNum)
  if (pdfCanvas) {
    el.width = pdfCanvas.width
    el.height = pdfCanvas.height
    el.style.width = pdfCanvas.style.width
    el.style.height = pdfCanvas.style.height
  }
  
  // 渲染已保存的标注
  if (pdfDoc && props.annotations?.length) {
    renderAnnotations(pageNum)
  }
}

/**
 * 渲染文本层（用于文本选择和高亮）
 */
async function renderTextLayer(pageNum: number) {
  const textLayerDiv = textLayerRefs.get(pageNum)
  if (!textLayerDiv || !pdfDoc) return
  
  try {
    const page = await pdfDoc.getPage(pageNum)
    const viewport = page.getViewport({ scale: BASE_RENDER_SCALE })
    
    // 设置文本层大小与 canvas 一致
    textLayerDiv.style.width = `${viewport.width}px`
    textLayerDiv.style.height = `${viewport.height}px`
    
    // 获取文本内容
    const textContent = await page.getTextContent()
    
    // 使用 pdfjs-dist 的 TextLayer
    const { TextLayer } = await import('pdfjs-dist')
    
    const textLayer = new TextLayer({
      textContentSource: textContent,
      container: textLayerDiv,
      viewport,
    })
    
    // 等待渲染完成
    await textLayer.render()
    console.log('[PdfReader] TextLayer rendered for page', pageNum, 'textDivs:', textLayer.textDivs?.length)
  } catch (e: any) {
    console.warn('TextLayer render error:', e)
  }
}

/**
 * 处理文本选择（高亮）
 */
function handleTextSelect(event: MouseEvent) {
  console.log('[PdfReader] handleTextSelect called')
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) {
    console.log('[PdfReader] No selection or collapsed')
    return
  }
  
  const text = selection.toString().trim()
  if (!text) {
    console.log('[PdfReader] No text selected')
    return
  }
  
  console.log('[PdfReader] Selected text:', text)
  
  const target = event.currentTarget as HTMLDivElement
  const pageNum = parseInt(target.dataset.page || '0')
  
  // 获取选中文本的位置信息
  const range = selection.getRangeAt(0)
  const rects = range.getClientRects()
  
  // 转换为 canvas 内部坐标
  const textLayerDiv = textLayerRefs.get(pageNum)
  if (!textLayerDiv) {
    console.log('[PdfReader] No textLayerDiv for page', pageNum)
    return
  }
  
  const layerRect = textLayerDiv.getBoundingClientRect()
  const canvas = canvasRefs.get(pageNum)
  if (!canvas) {
    console.log('[PdfReader] No canvas for page', pageNum)
    return
  }
  
  const scaleX = canvas.width / canvas.getBoundingClientRect().width
  const scaleY = canvas.height / canvas.getBoundingClientRect().height
  
  const highlightRects = Array.from(rects).map(rect => ({
    x: (rect.left - layerRect.left) * scaleX,
    y: (rect.top - layerRect.top) * scaleY,
    w: rect.width * scaleX,
    h: rect.height * scaleY
  }))
  
  // 创建高亮
  const highlight = {
    id: crypto.randomUUID(),
    page: pageNum,
    text,
    color: props.penColor || '#ffeb3b',
    rects: highlightRects
  }
  
  pdfHighlights.value.push(highlight)
  
  // 渲染高亮
  renderPdfHighlights(pageNum)
  
  // 通知父组件
  emit('text-highlight', highlight)
  
  // 清除选择
  selection.removeAllRanges()
}

/**
 * 渲染 PDF 文本高亮
 */
function renderPdfHighlights(pageNum: number) {
  const annotationCanvas = annotationCanvasRefs.get(pageNum)
  if (!annotationCanvas) return
  
  const ctx = annotationCanvas.getContext('2d')!
  
  // 只清除高亮区域，保留画笔标注
  const pageHighlights = pdfHighlights.value.filter(h => h.page === pageNum)
  
  // 重绘所有标注
  renderAnnotations(pageNum)
  
  // 渲染高亮
  pageHighlights.forEach(highlight => {
    ctx.fillStyle = highlight.color
    ctx.globalAlpha = 0.3
    highlight.rects.forEach(rect => {
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
    })
    ctx.globalAlpha = 1.0
  })
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
    const dpr = Number(window.devicePixelRatio || 1)
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
    
    // PDF 渲染完成后重绘标注并同步标注画布大小
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
    
    // 渲染文本层
    if (textLayerRefs.has(pageNum)) {
      renderTextLayer(pageNum)
    }
  } catch (e: any) {
    if (e?.name !== 'RenderingCancelledException') {
      console.warn('Render error:', e.message)
    }
  }
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
  
  if (annotation.opacity !== undefined) {
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
  const rect = canvas.getBoundingClientRect()
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
  const point = getCanvasPoint(canvas, event)
  
  if (props.eraserMode === 'lasso') {
    isErasing.value = true
    eraserPageNum.value = pageNum
    eraserPoints.value = [point]
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
  currentPoints.value = [point]
}

function handleAnnotationMove(event: MouseEvent) {
  if (!props.annotationMode) return
  const canvas = event.currentTarget as HTMLCanvasElement
  const pageNum = parseInt(canvas.dataset.page || '0')
  const point = getCanvasPoint(canvas, event)
  
  if (props.eraserMode === 'lasso' && isErasing.value) {
    eraserPoints.value.push(point)
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    const pageAnnots = (props.annotations || []).filter(a => a.page === eraserPageNum.value)
    pageAnnots.forEach(a => renderAnnotation(ctx, a))
    
    if (eraserPoints.value.length > 1) {
      ctx.beginPath()
      ctx.fillStyle = 'rgba(255, 100, 100, 0.15)'
      ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)'
      ctx.lineWidth = 2
      ctx.setLineDash([8, 4])
      
      ctx.moveTo(eraserPoints.value[0].x, eraserPoints.value[0].y)
      for (let i = 1; i < eraserPoints.value.length; i++) {
        ctx.lineTo(eraserPoints.value[i].x, eraserPoints.value[i].y)
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
  
  currentPoints.value.push(point)
  
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  const pageAnnots = (props.annotations || []).filter(a => a.page === currentPageNum.value)
  pageAnnots.forEach(a => renderAnnotation(ctx, a))
  
  ctx.beginPath()
  ctx.strokeStyle = props.penColor || '#ff0000'
  ctx.lineWidth = props.penWidth || 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  
  const pts = currentPoints.value
  if (pts.length > 0) {
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y)
    }
    ctx.stroke()
  }
}

function handleAnnotationUp(_event: MouseEvent) {
  if (!props.annotationMode) return
  
  if (props.eraserMode === 'lasso' && isErasing.value) {
    isErasing.value = false
    const polygon = [...eraserPoints.value]
    eraserPoints.value = []
    
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
    erasedIds.value = new Set()
    renderAnnotations(eraserPageNum.value)
    return
  }
  
  if (!isDrawing.value) return
  
  isDrawing.value = false
  
  if (currentPoints.value.length > 1) {
    emit('annotations-change', [{
      id: '',
      page: currentPageNum.value,
      type: 'pen',
      color: props.penColor || '#ff0000',
      width: props.penWidth || 2,
      points: currentPoints.value,
      createdAt: Date.now()
    }])
    
    setTimeout(() => {
      const canvas = annotationCanvasRefs.get(currentPageNum.value)
      if (canvas && pdfDoc) {
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const pageAnnots = (props.annotations || []).filter(a => a.page === currentPageNum.value)
        pageAnnots.forEach(a => renderAnnotation(ctx, a))
      }
    }, 50)
  }
  
  currentPoints.value = []
}

function handleAnnotationLeave(_event: MouseEvent) {
  if (props.eraserMode === 'lasso' && isErasing.value) {
    isErasing.value = false
    eraserPoints.value = []
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
    currentPoints.value = []
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
watch(() => props.annotations, (newAnnots) => {
  if (!newAnnots || newAnnots.length === 0) return
  // 标注数据变化时重绘
  for (let pageNum = 1; pageNum <= totalPages.value; pageNum++) {
    renderAnnotations(pageNum)
  }
}, { deep: true })

// 导出滚动到指定页的方法
function scrollToPage(pageNum: number) {
  console.log('[PdfReader] scrollToPage called with pageNum:', pageNum)
  
  // 使用 pdf-pages 容器而不是 pdf-pages-wrapper
  const pagesContainer = document.querySelector('.pdf-pages')
  if (!pagesContainer) {
    console.error('[PdfReader] .pdf-pages not found')
    return
  }
  
  // pageNum 是从 1 开始的 PDF 页码
  const pageWrappers = pagesContainer.querySelectorAll('.pdf-page-wrapper')
  const pageEl = pageWrappers[pageNum - 1]
  
  if (pageEl) {
    console.log('[PdfReader] Found page element, scrolling...')
    pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    console.error('[PdfReader] Page element not found for pageNum:', pageNum, 'total pages:', pageWrappers.length)
  }
}

defineExpose({
  scrollToPage
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

/* PDF 文本层 */
.text-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 15;
  overflow: hidden;
  line-height: 1;
  text-size-adjust: none;
  -webkit-text-size-adjust: none;
  color: transparent;
  cursor: text;
  border: 2px solid red;
}

.text-layer :deep(span) {
  color: black;
  background: rgba(255,255,0,0.3);
  position: absolute;
  white-space: pre;
  transform-origin: 0% 0%;
}

.text-layer :deep(span::selection) {
  background: rgba(0, 100, 200, 0.3);
  color: transparent;
}

.text-layer :deep(::selection) {
  background: rgba(0, 100, 200, 0.3);
  color: transparent;
}

.text-layer-hidden {
  pointer-events: none;
  z-index: 5;
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
