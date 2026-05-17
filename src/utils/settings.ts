import type { ReaderSettings } from '@/types'

export const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 3,
  theme: 'light',
  fontFamily: 'sans-serif',
  lineHeight: 1.6,
  margin: 20,
  fontWeight: 4,
}

export function getFontStyle(fontSize: number): string {
  const sizeMap: Record<number, string> = {
    1: '12px',
    2: '14px',
    3: '16px',
    4: '18px',
    5: '20px',
  }
  return sizeMap[fontSize] || '16px'
}

export function getThemeStyles(theme: 'light' | 'dark' | 'green' | 'parchment'): { bg: string; color: string } {
  const styles = {
    light: { bg: '#ffffff', color: '#333333' },
    dark: { bg: '#1a1a1a', color: '#e0e0e0' },
    green: { bg: '#e8f5e9', color: '#2e4a2e' },
    parchment: { bg: '#f5e6c8', color: '#3d2a00' },
  }
  return styles[theme] || styles.light
}
