import { defineStore } from 'pinia'

const LINE_HEIGHTS = [1.2, 1.4, 1.6, 1.8, 2.0]

export const useReaderStore = defineStore('reader', {
  state: () => ({
    fontSize: 3,
    theme: 'light' as 'light' | 'dark' | 'green' | 'parchment',
    fontWeight: 2,
    fontFamily: 0,
    lineHeight: 3, // index into LINE_HEIGHTS (1‑based, stored as 1‑5)
    readerMode: 'scroll' as 'scroll' | 'page',
  }),
  actions: {
    setFontSize(v: number) {
      this.fontSize = v
      try { localStorage.setItem('reader-fontSize', String(v)) } catch {}
    },
    setFontWeight(v: number) {
      this.fontWeight = v
      try { localStorage.setItem('reader-fontWeight', String(v)) } catch {}
    },
    setTheme(v: 'light' | 'dark' | 'green' | 'parchment') {
      this.theme = v
      try { localStorage.setItem('reader-theme', v) } catch {}
    },
    setFontFamily(v: number) {
      this.fontFamily = v
      try { localStorage.setItem('reader-fontFamily', String(v)) } catch {}
    },
    setLineHeight(v: number) {
      this.lineHeight = v
      try { localStorage.setItem('reader-lineHeight', String(v)) } catch {}
    },
    getLineHeight(): number {
      const idx = Math.max(0, Math.min(LINE_HEIGHTS.length - 1, (this.lineHeight || 3) - 1))
      return LINE_HEIGHTS[idx]
    },
    setReaderMode(v: 'scroll' | 'page') {
      this.readerMode = v
      try { localStorage.setItem('reader-readerMode', v) } catch {}
    },
    initFromStorage() {
      try {
        const fs = localStorage.getItem('reader-fontSize')
        if (fs) { const n = parseInt(fs, 10); if (!Number.isNaN(n)) this.fontSize = Math.max(1, Math.min(5, n)) }
      } catch {}
      try {
        const fw = localStorage.getItem('reader-fontWeight')
        if (fw) { const n = parseInt(fw, 10); if (!Number.isNaN(n)) this.fontWeight = Math.max(1, Math.min(3, n)) }
      } catch {}
      try {
        const t = localStorage.getItem('reader-theme')
        if (t === 'light' || t === 'dark' || t === 'green' || t === 'parchment') this.theme = t
      } catch {}
      try {
        const ff = localStorage.getItem('reader-fontFamily')
        if (ff) {
          const n = parseInt(ff, 10)
          if (!Number.isNaN(n)) this.fontFamily = n
        }
      } catch {}
      try {
        const lh = localStorage.getItem('reader-lineHeight')
        if (lh) { const n = parseInt(lh, 10); if (!Number.isNaN(n)) this.lineHeight = Math.max(1, Math.min(5, n)) }
      } catch {}
      try {
        const rm = localStorage.getItem('reader-readerMode')
        if (rm === 'scroll' || rm === 'page') this.readerMode = rm
      } catch {}
    }
  }
})
