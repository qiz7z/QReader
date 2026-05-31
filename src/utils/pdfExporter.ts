/**
 * PDF 导出工具
 * 使用 pdf-lib 将标注绘制到 PDF 上并导出
 * 
 * 坐标转换说明：
 * - 标注坐标是基于 Canvas 内部像素的（已乘以 DPR）
 * - Canvas 尺寸 = PDF viewport × BASE_RENDER_SCALE × DPR
 * - 导出时需要：标注坐标 ÷ BASE_RENDER_SCALE ÷ DPR = PDF 原生坐标
 * - 但由于 DPR 是运行时动态值，我们改用 Canvas 宽高比来还原 PDF 尺寸
 */

import { PDFDocument, rgb } from 'pdf-lib'
import type { PdfAnnotation } from './annotationStorage'

/**
 * 将标注导出到 PDF 文件
 * @param pdfBytes 原始 PDF 文件的二进制数据
 * @param annotations 标注列表
 * @returns 导出后的 PDF 二进制数据
 */
export async function exportPdfWithAnnotations(
  pdfBytes: ArrayBuffer,
  annotations: PdfAnnotation[],
  pageHeights: number[] // 每页标注 Canvas 的实际高度（像素），用于坐标转换
): Promise<Uint8Array> {
  // 加载原始 PDF
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const pages = pdfDoc.getPages()
  
  // 按页分组标注
  const annotationsByPage = new Map<number, PdfAnnotation[]>()
  for (const annot of annotations) {
    const pageAnnots = annotationsByPage.get(annot.page) || []
    pageAnnots.push(annot)
    annotationsByPage.set(annot.page, pageAnnots)
  }
  
  // 在每一页上绘制标注
  for (const [pageNum, pageAnnots] of annotationsByPage.entries()) {
    const pageIndex = pageNum - 1 // PDF-lib 使用 0-based 索引
    if (pageIndex < 0 || pageIndex >= pages.length) continue
    
    const page = pages[pageIndex]
    const { height: pdfHeight } = page.getSize()
    
    // 获取该页 Canvas 的实际高度（已包含 BASE_RENDER_SCALE 和 DPR）
    const canvasHeight = pageHeights[pageIndex] || 0
    if (canvasHeight === 0) continue
    
    // 计算缩放比例：PDF 高度 / Canvas 高度
    const scaleToPdf = pdfHeight / canvasHeight
    
    for (const annot of pageAnnots) {
      if (!annot.points || annot.points.length === 0) continue
      
      // 转换坐标：Canvas 坐标 -> PDF 坐标
      // Y 轴翻转：Canvas 原点在左上，PDF 原点在左下
      const pdfPoints = annot.points.map(p => ({
        x: p.x * scaleToPdf,
        y: pdfHeight - (p.y * scaleToPdf)
      }))
      
      // 解析颜色
      const color = hexToRgb(annot.color)
      
      // 根据标注类型绘制
      if (annot.type === 'pen' || annot.type === 'highlighter') {
        // 绘制路径
        if (pdfPoints.length >= 2) {
          // 线宽也需要缩放
          const pdfLineWidth = annot.width * scaleToPdf
          
          // 荧光笔使用存储的 opacity 或默认 0.3，画笔默认为 1.0
          const opacity = annot.type === 'highlighter' 
            ? (annot.opacity !== undefined ? annot.opacity : 0.3) 
            : 1.0
          
          for (let i = 0; i < pdfPoints.length - 1; i++) {
            page.drawLine({
              start: pdfPoints[i],
              end: pdfPoints[i + 1],
              color: rgb(color.r, color.g, color.b),
              thickness: pdfLineWidth,
              opacity
            })
          }
        }
      }
    }
  }
  
  // 保存并返回 PDF
  return await pdfDoc.save()
}

/**
 * hex 颜色转 RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 }
}
