import { marked } from 'marked'
import type { ParsedBook, Chapter, TOCEntry } from '@/types'

export function parseMarkdown(file: File, arrayBuffer: ArrayBuffer): ParsedBook {
  const text = new TextDecoder('utf-8').decode(arrayBuffer)
  const tokens = marked.lexer(text)

  const chapters: Chapter[] = []
  const toc: TOCEntry[] = []
  let currentChapter: Chapter | null = null
  let position = 0

  for (const token of tokens) {
    if (token.type === 'heading' && (token as any).depth <= 2) {
      if (currentChapter) {
        chapters.push(currentChapter)
      }
      currentChapter = {
        id: `chapter-${position}`,
        title: token.text,
        content: '',
      }
      toc.push({
        title: token.text,
        chapterId: `chapter-${position}`,
        position,
      })
      position++
    } else {
      if (!currentChapter) {
        currentChapter = {
          id: 'chapter-0',
          title: '前言',
          content: '',
        }
        toc.push({
          title: '前言',
          chapterId: 'chapter-0',
          position: 0,
        })
        position = 1
      }
      currentChapter.content += marked.parser([token])
    }
  }

  if (currentChapter) {
    chapters.push(currentChapter)
  }

  if (chapters.length === 0) {
    chapters.push({
      id: 'chapter-0',
      title: file.name.replace(/\.[^.]+$/, ''),
      content: marked.parse(text) as string,
    })
    toc.push({
      title: chapters[0].title,
      chapterId: 'chapter-0',
      position: 0,
    })
  }

  return {
    id: crypto.randomUUID(),
    title: file.name.replace(/\.[^.]+$/, ''),
    author: '',
    cover: null,
    content: chapters,
    toc,
    metadata: {},
  }
}
