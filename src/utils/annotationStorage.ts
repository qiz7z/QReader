/**
 * PDF 标注数据存储工具
 * 使用 LocalStorage 存储标注数据
 */

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

const STORAGE_KEY_PREFIX = 'qreader_pdf_annotations_'

/**
 * 生成简单 UUID
 */
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 计算文件唯一标识 (简单 hash)
 */
function computeFileHash(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer)
  let hash = 0
  const len = Math.min(bytes.length, 1024 * 1024) // 只取前 1MB 计算
  
  for (let i = 0; i < len; i++) {
    hash = ((hash << 5) - hash) + bytes[i]
    hash = hash & hash
  }
  
  return Math.abs(hash).toString(36)
}

/**
 * 保存标注数据
 */
export function saveAnnotations(fileId: string, fileName: string, annotations: PdfAnnotation[]): void {
  const key = `${STORAGE_KEY_PREFIX}${fileId}`
  const data: AnnotationData = {
    fileId,
    fileName,
    annotations,
    lastModified: Date.now()
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('[AnnotationStorage] Save failed:', error)
    // LocalStorage 容量超限，删除最旧的标注
    if (annotations.length > 100) {
      const recent = annotations.slice(-100)
      localStorage.setItem(key, JSON.stringify({ ...data, annotations: recent }))
    }
  }
}

/**
 * 加载标注数据
 */
export function loadAnnotations(fileId: string): PdfAnnotation[] {
  const key = `${STORAGE_KEY_PREFIX}${fileId}`
  
  try {
    const data = localStorage.getItem(key)
    if (!data) return []
    
    const parsed: AnnotationData = JSON.parse(data)
    return parsed.annotations || []
  } catch (error) {
    console.error('[AnnotationStorage] Load failed:', error)
    return []
  }
}

/**
 * 清除标注数据
 */
export function clearAnnotations(fileId: string): void {
  const key = `${STORAGE_KEY_PREFIX}${fileId}`
  localStorage.removeItem(key)
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
 * 清除所有标注
 */
export function clearAllAnnotations(fileId: string): void {
  saveAnnotations(fileId, '', [])
}

/**
 * 从 PDF 文件计算 ID
 */
export function getFileIdFromPdf(rawFile: ArrayBuffer): string {
  return computeFileHash(rawFile)
}

