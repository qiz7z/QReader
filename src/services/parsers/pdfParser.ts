import * as pdfjsLib from 'pdfjs-dist'
import type { ParsedBook, Chapter, TOCEntry } from '@/types'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

export async function parsePDF(file: File, arrayBuffer: ArrayBuffer): Promise<ParsedBook> {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise

  const content: Chapter[] = []
  const toc: TOCEntry[] = []

  // 1. 提取大纲（Outline）→ 目录
  const outline = await pdf.getOutline()
  
  if (outline && outline.length > 0) {
    // 有大纲时，按大纲条目创建章节
    for (let i = 0; i < outline.length; i++) {
      const item = outline[i]
      let pageNum = 1

      // 获取大纲条目对应的页码
      if (item.dest) {
        try {
          const dest = typeof item.dest === 'string' ? await pdf.getDestination(item.dest) : await pdf.getDestination(item.dest as any)
          if (dest && dest[0]) {
            const pageIndex = await pdf.getPageIndex(dest[0])
            pageNum = pageIndex + 1
          }
        } catch (e) {
          // 跳过无法解析的条目
        }
      }

      toc.push({
        title: item.title,
        chapterId: `chapter-${i}`,
        position: pageNum, // position 存储起始页码
      })

      content.push({
        id: `chapter-${i}`,
        title: item.title,
        content: '', // PDF 不需要文本内容
      })
    }
  } else {
    // 没有大纲时，按每 10 页一章划分
    const pagesPerChapter = 10
    const totalChapters = Math.ceil(pdf.numPages / pagesPerChapter)

    for (let i = 0; i < totalChapters; i++) {
      const startPage = i * pagesPerChapter + 1
      const endPage = Math.min((i + 1) * pagesPerChapter, pdf.numPages)
      const title = `第 ${startPage}-${endPage} 页`

      toc.push({
        title,
        chapterId: `chapter-${i}`,
        position: startPage,
      })

      content.push({
        id: `chapter-${i}`,
        title,
        content: '',
      })
    }
  }

  // 确保至少有一个章节
  if (content.length === 0) {
    content.push({
      id: 'chapter-0',
      title: '正文',
      content: '',
    })
    toc.push({
      title: '正文',
      chapterId: 'chapter-0',
      position: 1,
    })
  }

  return {
    id: crypto.randomUUID(),
    title: file.name.replace(/\.[^.]+$/, ''),
    author: '',
    cover: null,
    content,
    toc,
    metadata: {},
  }
}
