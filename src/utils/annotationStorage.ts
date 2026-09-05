/**
 * PDF 标注数据存储工具
 *
 * 存储策略（v1.2.4+）：
 *   主存储: OPFS（pdf-annotations/{fileId}.json）— 纳入"导出数据"备份体系
 *   迁移:   首次加载时自动从旧版 localStorage 迁移到 OPFS
 *   API:    保持同步签名 — 内部用内存缓存，写入内存后异步落盘
 *
 * 旧版 localStorage 仅作为迁移来源，不再作为主存储。
 */

import { opfs } from '@/services/opfs'

export interface Point {
  x: number
  y: number
}

export interface PdfAnnotation {
  id: string
  page: number
  type: 'pen' | 'highlight' | 'underline' | 'highlighter'
  color: string
  width: number
  points?: Point[]
  opacity?: number
  createdAt: number
}

export interface AnnotationData {
  fileId: string
  fileName: string
  annotations: PdfAnnotation[]
  lastModified: number
}

const LEGACY_PREFIX = 'qreader_pdf_annotations_'
// fileId -> annotations 内存缓存（同步读的来源）
const memoryCache = new Map<string, PdfAnnotation[]>()
// fileId -> fileName（落盘时需要）
const fileNameCache = new Map<string, string>()
// 已执行过迁移的 fileId（本次会话内）
const migratedIds = new Set<string>()

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`
}

function computeFileHash(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer)
  let hash = 0
  const len = Math.min(bytes.length, 1024 * 1024)

  for (let i = 0; i < len; i++) {
    hash = ((hash << 5) - hash) + bytes[i]
    hash = hash & hash
  }

  return Math.abs(hash).toString(36)
}

/** 从旧版 localStorage 读取（仅迁移用） */
function readLegacy(fileId: string): PdfAnnotation[] {
  try {
    const raw = localStorage.getItem(`${LEGACY_PREFIX}${fileId}`)
    if (!raw) return []
    const parsed: AnnotationData = JSON.parse(raw)
    return parsed.annotations || []
  } catch {
    return []
  }
}

/** 初始化某个 fileId：OPFS 优先，localStorage 兜底迁移 */
async function ensureLoaded(fileId: string): Promise<PdfAnnotation[]> {
  if (memoryCache.has(fileId)) return memoryCache.get(fileId)!
  if (migratedIds.has(fileId)) return []

  migratedIds.add(fileId)

  // 1. 尝试 OPFS
  try {
    const data = await opfs.readJSON<AnnotationData>(['pdf-annotations'], `${fileId}.json`)
    if (data && Array.isArray(data.annotations)) {
      memoryCache.set(fileId, data.annotations)
      fileNameCache.set(fileId, data.fileName || '')
      return data.annotations
    }
  } catch (e) {
    console.warn('[AnnotationStorage] OPFS read failed, falling back:', e)
  }

  // 2. 旧版 localStorage 数据迁移
  const legacy = readLegacy(fileId)
  if (legacy.length > 0) {
    memoryCache.set(fileId, legacy)
    // 异步写入 OPFS，成功后清除旧 localStorage 条目
    void persist(fileId, legacy).then(ok => {
      if (ok) {
        try { localStorage.removeItem(`${LEGACY_PREFIX}${fileId}`) } catch {}
      }
    })
    return legacy
  }

  memoryCache.set(fileId, [])
  return []
}

/** 异步落盘到 OPFS */
async function persist(fileId: string, annotations: PdfAnnotation[]): Promise<boolean> {
  try {
    await opfs.initialize()
    const data: AnnotationData = {
      fileId,
      fileName: fileNameCache.get(fileId) || '',
      annotations,
      lastModified: Date.now()
    }
    await opfs.writeJSON(['pdf-annotations'], `${fileId}.json`, data)
    return true
  } catch (e) {
    console.error('[AnnotationStorage] OPFS write failed:', e)
    return false
  }
}

/**
 * 保存标注数据（同步更新内存 + 异步落盘）
 */
export function saveAnnotations(fileId: string, fileName: string, annotations: PdfAnnotation[]): void {
  if (fileName) fileNameCache.set(fileId, fileName)
  memoryCache.set(fileId, annotations)
  void persist(fileId, annotations)
}

/**
 * 加载标注数据（同步接口：内存缓存命中立即返回；未命中返回空并在后台装载）
 * 注意：首次访问返回 []，OPFS 数据装载后需再调一次。loadBook 流程中
 * currentFileId 计算后即调用本函数，随后 pdfAnnotations 赋值发生在 await 之后，
 * 因此用 ensureLoaded 版本保证时序。
 */
export function loadAnnotations(fileId: string): PdfAnnotation[] {
  if (memoryCache.has(fileId)) return memoryCache.get(fileId)!
  void ensureLoaded(fileId)
  return []
}

/** 异步版本：确保 OPFS/localStorage 数据已装载后再返回 */
export async function loadAnnotationsAsync(fileId: string): Promise<PdfAnnotation[]> {
  return await ensureLoaded(fileId)
}

/**
 * 清除标注数据
 */
export function clearAnnotations(fileId: string): void {
  memoryCache.set(fileId, [])
  void persist(fileId, [])
}

/**
 * 添加单个标注
 */
export function addAnnotation(
  fileId: string,
  fileName: string,
  annotation: Omit<PdfAnnotation, 'id' | 'createdAt'>
): PdfAnnotation {
  const annotations = loadAnnotations(fileId)

  const newAnnotation: PdfAnnotation = {
    ...annotation,
    id: generateId(),
    createdAt: Date.now()
  }

  annotations.push(newAnnotation)
  saveAnnotations(fileId, fileName, annotations)

  return newAnnotation
}

/**
 * 删除标注
 */
export function deleteAnnotation(fileId: string, annotationId: string): void {
  const annotations = loadAnnotations(fileId)
  const filtered = annotations.filter(a => a.id !== annotationId)

  if (filtered.length !== annotations.length) {
    saveAnnotations(fileId, '', filtered)
  }
}

/**
 * 从 PDF 文件计算 ID
 */
export function getFileIdFromPdf(rawFile: ArrayBuffer): string {
  return computeFileHash(rawFile)
}
