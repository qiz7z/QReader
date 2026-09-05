import ePub from 'epubjs'
import type { ParsedBook, Chapter } from '@/types'
import { sanitizeBookHtml } from '@/utils/sanitize'

export async function parseEPUB(file: File, arrayBuffer: ArrayBuffer): Promise<ParsedBook> {
  const book = ePub(arrayBuffer)
  await book.ready

  // 1. 获取元数据
  const metadata = await book.loaded.metadata
  const title = (metadata as any).title || file.name.replace(/\.[^.]+$/, '')
  const author = (metadata as any).creator || ''

  // 2. 获取导航目录
  const nav = await book.loaded.navigation
  const toc: any[] = (nav as any).toc || []

  // 3. 清理标题：移除所有 HTML/XML 标签和空白
  const stripHtml = (html: any): string => {
    if (!html) return ''
    const str = String(html)
    const div = document.createElement('div')
    div.innerHTML = str
    return (div.textContent || div.innerText || '').trim().replace(/\s+/g, ' ')
  }

  // 4. 构建目录
  const tocEntries = toc.map((item: any, index: number) => {
    let label = item.label || ''
    let title = stripHtml(label)

    // 如果 label 为空或是 SVG 等，尝试从子项获取
    if (!title && item.subitems?.length > 0) {
      title = stripHtml(item.subitems[0]?.label || '')
    }

    // 仍然没有标题，使用默认值
    if (!title) {
      title = `第 ${index + 1} 章`
    }

    return {
      title,
      chapterId: `chapter-${index}`,
      position: index,
    }
  })

  // 5. 获取 spine（章节顺序）
  const spine = (book as any).spine
  const spineLength = spine.length

  // 6. 构建存档文件索引（用于精确查找图片路径）
  const archive = (book as any).archive
  const fileIndex = new Map<string, string>()
  const imagePaths: string[] = []
  if (archive?.zip?.files) {
    const fileNames = Object.keys(archive.zip.files)
    for (const fname of fileNames) {
      if (fname.endsWith('/')) continue
      // 按文件名（不区分大小写）建立索引
      const basename = fname.split('/').pop() || ''
      if (!fileIndex.has(basename.toLowerCase())) {
        fileIndex.set(basename.toLowerCase(), fname)
      }
      // 完整路径也索引
      if (!fileIndex.has(fname.toLowerCase())) {
        fileIndex.set(fname.toLowerCase(), fname)
      }
      if (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(fname)) {
        imagePaths.push(fname)
      }
    }
  }

  // 7. 根据文件名在存档中查找图片的实际路径
  function resolveImagePath(src: string, chapterHref: string): string {
    // 如果是 data URL，直接返回
    if (src.startsWith('data:')) return src

    let cleanSrc = src
    // 1. 先去括号开头斜杠
    if (cleanSrc.startsWith('/')) cleanSrc = cleanSrc.substring(1)

    // 2. 尝试在文件索引中按完整路径查找
    const exactMatch = fileIndex.get(cleanSrc.toLowerCase())
    if (exactMatch) return exactMatch

    // 3. 尝试按文件名查找
    const basename = cleanSrc.split('/').pop() || cleanSrc
    const nameMatch = fileIndex.get(basename.toLowerCase())
    if (nameMatch) return nameMatch

    // 4. 手动解析相对路径（处理 ../ 和 ./）
    const chapterDir = chapterHref.includes('/') ? chapterHref.substring(0, chapterHref.lastIndexOf('/')) : ''

    // 展开相对路径
    let parts: string[] = []
    if (chapterDir) parts = chapterDir.split('/')
    
    let remaining = cleanSrc
    while (remaining.startsWith('../')) {
      remaining = remaining.substring(3)
      if (parts.length > 0) parts.pop()
    }
    while (remaining.startsWith('./')) {
      remaining = remaining.substring(2)
    }
    
    const resolved = [...parts, remaining].filter(Boolean).join('/')
    const resolvedMatch = fileIndex.get(resolved.toLowerCase())
    if (resolvedMatch) return resolvedMatch

    // 5. 遍历所有图片文件，按文件名末尾匹配（兼容 urlencoded 等差异）
    const srcClean = cleanSrc.replace(/[?#].*$/, '').split('/').pop() || ''
    for (const imgPath of imagePaths) {
      if (imgPath.toLowerCase().endsWith(srcClean.toLowerCase())) {
        return imgPath
      }
    }

    // 6. 最后尝试：在根目录下
    return cleanSrc
  }

  // 7. 缓存图片 data URL
  const imageCache = new Map<string, string>()

  // 8. 解析章节内容
  const content: Chapter[] = []
  
  for (let i = 0; i < spineLength; i++) {
    const item = spine.get(i)
    const contents = await book.load(item.href)
    const serializer = new XMLSerializer()
    let html = serializer.serializeToString(contents as Node)

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const images = doc.querySelectorAll('img')

    for (const img of Array.from(images)) {
      const src = img.getAttribute('src')
      if (!src || src.startsWith('data:')) continue

      try {
        const cacheKey = src
        let dataUrl = imageCache.get(cacheKey)
        if (!dataUrl) {
          const actualPath = resolveImagePath(src, item.href || '')

          // 从存档中读取图片
          const entry = archive.zip.files[actualPath]
          if (!entry) {
            console.warn('[EPUB IMG] File not found in archive:', actualPath)
            continue
          }
          const imgData = await entry.async('arraybuffer')
          const base64 = arrayBufferToBase64(imgData)
          const mimeType = getMimeType(actualPath)
          dataUrl = `data:${mimeType};base64,${base64}`
          imageCache.set(cacheKey, dataUrl)
        }
        img.setAttribute('src', dataUrl)
      } catch (e) {
        console.error('[EPUB IMG] Failed to load image:', src, e)
      }
    }

    html = sanitizeBookHtml(doc.body.innerHTML)

    const tocEntry = tocEntries[i]
    const chapterTitle = tocEntry?.title || `第 ${i + 1} 章`

    content.push({
      id: `chapter-${i}`,
      title: chapterTitle,
      content: html,
    })
  }
  
  // 8. 提取封面
  let cover: ArrayBuffer | null = null

  async function loadCoverFromPath(path: string): Promise<ArrayBuffer | null> {
    // 使用文件索引查找实际路径
    const resolvedPath = resolveImagePath(path, '')
    if (resolvedPath && archive.zip.files[resolvedPath]) {
      try {
        const data = await archive.zip.files[resolvedPath].async('arraybuffer')
        return data
      } catch (e) {
        console.warn('[EPUB] Failed to load cover from resolved path:', resolvedPath, e)
      }
    }
    return null
  }

  // 策略1: 通过 epubjs 的 cover 属性
  const coverUrl = (book as any).cover
  if (coverUrl) {
    cover = await loadCoverFromPath(coverUrl)
  }

  // 策略2: 在 OPF 中查找 cover meta
  if (!cover) {
    try {
      const opfEntries = Object.keys(archive.zip.files).filter(f => f.endsWith('.opf'))
      for (const opfPath of opfEntries) {
        const opfData = await archive.zip.files[opfPath].async('text')
        const metaMatch = opfData.match(/<meta\s+[^>]*name\s*=\s*["']cover["'][^>]*content\s*=\s*["']([^"']+)["'][^>]*\/?>/i)
        if (metaMatch) {
          const coverId = metaMatch[1]
          const manifestMatch = opfData.match(new RegExp(`<item\\s+[^>]*id\\s*=\\s*["']${coverId}["'][^>]*href\\s*=\\s*["']([^"']+)["'][^>]*/?>`, 'i'))
          if (manifestMatch) {
            const relPath = manifestMatch[1]
            const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : ''
            const fullPath = opfDir + relPath
            cover = await loadCoverFromPath(fullPath)
            if (cover) break
          }
        }
      }
    } catch (e) {
      console.warn('[EPUB] OPF cover search failed:', e)
    }
  }

  // 策略3: 在存档中查找名为 cover 的图片
  if (!cover) {
    const coverCandidates = imagePaths.filter(p =>
      /cover|front|title/i.test(p.replace(/.*[/\\]/, ''))
    )
    for (const candidate of coverCandidates) {
      cover = await loadCoverFromPath(candidate)
      if (cover) break
    }
  }

  // 9. 清理
  await book.destroy()

  // 10. 返回结果
  return {
    id: crypto.randomUUID(),
    title,
    author,
    cover,
    content,
    toc: tocEntries,
    metadata: {
      publisher: (metadata as any).publisher || '',
      language: (metadata as any).language || '',
      description: (metadata as any).description || '',
    },
  }
}

// 工具函数：ArrayBuffer 转 Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// 工具函数：根据扩展名获取 MIME 类型
function getMimeType(href: string): string {
  const ext = href.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
  }
  return mimeTypes[ext || ''] || 'image/jpeg'
}