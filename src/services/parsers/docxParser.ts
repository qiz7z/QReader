import mammoth from 'mammoth'
import type { ParsedBook, Chapter, TOCEntry } from '@/types'

export async function parseDOCX(file: File, arrayBuffer: ArrayBuffer): Promise<ParsedBook> {
  const result = await mammoth.convertToHtml({ arrayBuffer })
  const html = result.value

  const headingRegex = /<h([1-2])[^>]*>(.*?)<\/h\1>/gi
  const headings = html.match(headingRegex) || []

  const content: Chapter[] = []
  const toc: TOCEntry[] = []

  if (headings.length > 0) {
    let lastIndex = 0
    headings.forEach((heading, index) => {
      const headingMatch = heading.match(/<h[1-2][^>]*>(.*?)<\/h[1-2]>/i)
      const title = headingMatch ? headingMatch[1].replace(/<[^>]+>/g, '') : `第 ${index + 1} 节`
      const startIndex = html.indexOf(heading, lastIndex)
      const sectionHtml = html.substring(lastIndex, startIndex)

      if (sectionHtml.trim()) {
        content.push({
          id: `chapter-${index}`,
          title,
          content: sectionHtml,
        })
        toc.push({
          title,
          chapterId: `chapter-${index}`,
          position: index,
        })
      }

      lastIndex = startIndex + heading.length
    })

    const remainingHtml = html.substring(lastIndex)
    if (remainingHtml.trim()) {
      content.push({
        id: `chapter-${content.length}`,
        title: '附录',
        content: remainingHtml,
      })
    }
  } else {
    content.push({
      id: 'chapter-0',
      title: file.name.replace(/\.[^.]+$/, ''),
      content: html,
    })
    toc.push({
      title: content[0].title,
      chapterId: 'chapter-0',
      position: 0,
    })
  }

  if (content.length === 0) {
    content.push({
      id: 'chapter-0',
      title: '正文',
      content: '<p>无法提取内容</p>',
    })
    toc.push({
      title: '正文',
      chapterId: 'chapter-0',
      position: 0,
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
