import type { ParsedBook } from '@/types'

export function parseMOBI(_file: File, arrayBuffer: ArrayBuffer): ParsedBook {
  const decoder = new TextDecoder('utf-8')
  const bytes = new Uint8Array(arrayBuffer)

  const header = decoder.decode(bytes.slice(0, 4))

  if (header !== 'BOOK' && header !== 'MOBI') {
    throw new Error('无效的 MOBI 文件格式')
  }

  const text = extractTextFromMOBI(arrayBuffer)
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim())

  // 输出前 HTML 转义，防止残留标签注入（XSS）
  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const content = paragraphs.map((para, index) => ({
    id: `chapter-${index}`,
    title: `第 ${index + 1} 节`,
    content: `<p>${escapeHtml(para.trim()).replace(/\n/g, '</p><p>')}</p>`,
  }))

  const toc = content.map((ch, index) => ({
    title: ch.title,
    chapterId: ch.id,
    position: index,
  }))

  if (content.length === 0) {
    content.push({
      id: 'chapter-0',
      title: '正文',
      content: '<p>无法提取文本内容</p>',
    })
    toc.push({
      title: '正文',
      chapterId: 'chapter-0',
      position: 0,
    })
  }

  return {
    id: crypto.randomUUID(),
    title: _file.name.replace(/\.[^.]+$/, ''),
    author: '',
    cover: null,
    content,
    toc,
    metadata: {},
  }
}

function extractTextFromMOBI(arrayBuffer: ArrayBuffer): string {
  const decoder = new TextDecoder('utf-8')
  const bytes = new Uint8Array(arrayBuffer)
  let text = ''

  for (let i = 0; i < bytes.length; i++) {
    // 标签检查必须先于可打印 ASCII 判断（`<` = 0x3c 在可打印区间内）
    if (bytes[i] === 0x3c && i + 6 < bytes.length) {
      const tag = decoder.decode(bytes.slice(i, i + 6)).toLowerCase()
      if (tag === '<br') {
        text += '\n'
        while (i < bytes.length && bytes[i] !== 0x3e) i++
      } else if (tag === '<p ') {
        text += '\n\n'
        while (i < bytes.length && bytes[i] !== 0x3e) i++
      } else if (tag === '</h') {
        while (i < bytes.length && bytes[i] !== 0x3e) i++
        text += '\n\n'
      } else {
        while (i < bytes.length && bytes[i] !== 0x3e) i++
      }
    } else if (bytes[i] >= 0x20 && bytes[i] < 0x7f) {
      text += String.fromCharCode(bytes[i])
    } else if (bytes[i] === 0x0a || bytes[i] === 0x0d) {
      text += '\n'
    }
  }

  return text.trim()
}
