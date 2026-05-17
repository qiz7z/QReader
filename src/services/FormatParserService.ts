import type { ParsedBook } from '@/types'
import { parseTXT } from './parsers/txtParser'
import { parseMarkdown } from './parsers/markdownParser'
import { parseEPUB } from './parsers/epubParser'
import { parsePDF } from './parsers/pdfParser'
import { parseDOCX } from './parsers/docxParser'
import { parseMOBI } from './parsers/mobiParser'

const SUPPORTED_FORMATS = ['txt', 'md', 'epub', 'pdf', 'mobi', 'docx']

export class FormatParserService {
  static async parse(file: File): Promise<ParsedBook> {
    const format = this.getFormat(file.name)

    if (!this.supportsFormat(format)) {
      throw new Error(`不支持的文件格式: ${format}。支持的格式: ${SUPPORTED_FORMATS.join(', ')}`)
    }

    const arrayBuffer = await file.arrayBuffer()

    switch (format) {
      case 'txt':
        return parseTXT(file, arrayBuffer)
      case 'md':
        return parseMarkdown(file, arrayBuffer)
      case 'epub':
        return await parseEPUB(file, arrayBuffer)
      case 'pdf':
        return await parsePDF(file, arrayBuffer)
      case 'docx':
        return await parseDOCX(file, arrayBuffer)
      case 'mobi':
        return parseMOBI(file, arrayBuffer)
      default:
        throw new Error(`无法解析格式: ${format}`)
    }
  }

  static supportsFormat(format: string): boolean {
    return SUPPORTED_FORMATS.includes(format.toLowerCase())
  }

  static getFormat(filename: string): string {
    const parts = filename.split('.')
    if (parts.length < 2) return ''
    return parts.pop()!.toLowerCase()
  }
}
