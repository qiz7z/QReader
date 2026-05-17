import type { ParsedBook, Chapter, TOCEntry } from '@/types'

function detectEncoding(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const len = Math.min(bytes.length, 4096)

  let utf8Score = 0
  let gbkScore = 0

  for (let i = 0; i < len; i++) {
    const b = bytes[i]

    if (b < 0x80) {
      continue
    }

    if (b >= 0xc2 && b <= 0xdf && i + 1 < len && (bytes[i + 1] & 0xc0) === 0x80) {
      utf8Score += 2
      i++
    } else if (b >= 0xe0 && b <= 0xef && i + 2 < len && (bytes[i + 1] & 0xc0) === 0x80 && (bytes[i + 2] & 0xc0) === 0x80) {
      utf8Score += 3
      i += 2
    } else if (b >= 0x81 && b <= 0xfe && i + 1 < len && ((bytes[i + 1] >= 0x40 && bytes[i + 1] <= 0x7e) || (bytes[i + 1] >= 0x80 && bytes[i + 1] <= 0xfe))) {
      gbkScore += 2
      i++
    } else if (b >= 0xa1 && b <= 0xfe && i + 1 < len && bytes[i + 1] >= 0xa1 && bytes[i + 1] <= 0xfe) {
      gbkScore += 2
      i++
    } else {
      utf8Score = Math.max(0, utf8Score - 1)
      gbkScore = Math.max(0, gbkScore - 1)
    }
  }

  return gbkScore > utf8Score ? 'gbk' : 'utf-8'
}

export function parseTXT(file: File, arrayBuffer: ArrayBuffer): ParsedBook {
  const encoding = detectEncoding(arrayBuffer)
  const text = new TextDecoder(encoding).decode(arrayBuffer)

  const lines = text.split(/\r?\n/)
  const content: Chapter[] = []
  const toc: TOCEntry[] = []
  let currentLines: string[] = []

  function flushChapter() {
    if (currentLines.length === 0) return
    const html = currentLines
      .filter((l) => l.trim())
      .map((l) => `<p>${escapeHtml(l.trim())}</p>`)
      .join('')
    if (html) {
      content.push({
        id: `chapter-${content.length}`,
        title: currentLines[0]?.trim().slice(0, 30) || `第 ${content.length + 1} 节`,
        content: html,
      })
      toc.push({
        title: content[content.length - 1].title,
        chapterId: content[content.length - 1].id,
        position: content.length - 1,
      })
    }
    currentLines = []
  }

  const chapterMarkers = /^(第[一二三四五六七八九十\d]+[章节卷篇回幕)|^([一二三四五六七八九十\d]+[、.．\s])|^(\d+[、.．\s])/
  const isChapterHeading = (line: string) => chapterMarkers.test(line.trim())

  for (const line of lines) {
    if (isChapterHeading(line) && currentLines.length > 0) {
      flushChapter()
    }
    currentLines.push(line)
  }

  flushChapter()

  if (content.length === 0) {
    const html = text
      .split(/\n\s*\n/)
      .filter((p) => p.trim())
      .map((p) => `<p>${escapeHtml(p.trim().replace(/\n/g, '<br>'))}</p>`)
      .join('')
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

  return {
    id: crypto.randomUUID(),
    title: file.name.replace(/\.[^.]+$/, ''),
    author: '',
    cover: null,
    content,
    toc,
    metadata: { encoding },
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
