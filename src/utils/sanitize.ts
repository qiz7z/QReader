import DOMPurify from 'dompurify'

/**
 * 统一的 HTML 消毒入口。
 * 所有解析器（EPUB/Markdown/MOBI/DOCX）产出的 HTML 必须经过这里，
 * 才能进入 v-html / innerHTML 渲染管线。
 *
 * 策略：保留阅读所需的排版标签，剥离脚本、事件处理器、危险协议。
 */
const ALLOWED_TAGS = [
  // 基础排版
  'p', 'div', 'span', 'br', 'hr', 'wbr',
  // 标题
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // 文本样式
  'b', 'strong', 'i', 'em', 'u', 's', 'del', 'ins', 'sub', 'sup',
  'small', 'big', 'mark', 'abbr', 'cite', 'q', 'code', 'kbd', 'samp', 'var',
  'blockquote', 'pre',
  // 列表
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  // 表格
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
  'caption', 'colgroup', 'col',
  // 结构语义
  'section', 'article', 'aside', 'header', 'footer', 'nav', 'main',
  'figure', 'figcaption', 'details', 'summary', 'address', 'time',
  // 链接与媒体
  'a', 'img', 'picture', 'source', 'svg', 'path', 'g',
  'ruby', 'rt', 'rp',
]

const ALLOWED_ATTR = [
  'href', 'src', 'srcset', 'alt', 'title', 'width', 'height',
  'colspan', 'rowspan', 'start', 'type', 'dir', 'lang',
  'class', 'id', 'style',
  // EPUB 内部锚点跳转
  'epub:type', 'data-book-image',
  // SVG 必需属性
  'd', 'fill', 'stroke', 'stroke-width', 'viewBox', 'xmlns',
]

// 剥离 style 中可能危险的内容（expression/javascript/position:fixed 遮罩攻击）
DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
  if (data.attrName === 'style' && data.attrValue) {
    // 去掉 expression()、javascript: URL 与 fixed 定位
    data.attrValue = data.attrValue
      .replace(/expression\s*\(/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/position\s*:\s*fixed/gi, '')
  }
})

/**
 * 消毒电子书章节 HTML。
 * DOMPurify 默认已剥离 script/iframe/object/embed、on* 事件、javascript: 协议。
 */
export function sanitizeBookHtml(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // 禁止所有远程内嵌（iframe/embed/object 本就不在白名单，这里双保险）
    FORBID_ATTR: ['srcdoc', 'formaction'],
    RETURN_TRUSTED_TYPE: false,
  })
}

/**
 * 消毒富文本展示片段（如高亮预览）。
 * 比书籍 HTML 更严格：只允许纯文本级标签。
 */
export function sanitizeSnippet(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'mark', 'br'], ALLOWED_ATTR: ['class', 'style'] })
}
