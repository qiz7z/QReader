<template>
  <div class="pdf-reader">
    <div v-if="loading" class="loading">正在加载 PDF...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div class="pdf-pages-wrapper">
        <div class="pdf-pages" :style="pagesStyle">
          <div v-for="pageNum in totalPages" :key="pageNum" class="pdf-page-wrapper">
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
}>()

const loading = ref(true)
const error = ref('')
const totalPages = ref(0)
const canvasRefs = new Map<number, HTMLCanvasElement>()
const annotationCanvasRefs = new Map<number, HTMLCanvasElement>()
const renderTasks = new Map<number, any>()
let pdfDoc: any = null

// 标注相关
const isDrawing = ref(false)
const currentPoints = ref<Point[]>([])
const currentPageNum = ref<number>(0)

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
  const wrapper = document.querySelector('.pdf-pages-wrapper')
  if (!wrapper) return
  
  // pageNum 是从 1 开始的 PDF 页码，查找对应的 DOM 元素
  const pages = wrapper.querySelectorAll('.pdf-page')
  const pageEl = pages[pageNum - 1]
  if (pageEl) {
    pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
