<template>
  <div class="home-view">
    <!-- 主横幅区域 -->
    <main class="hero-section">
      <div class="hero-content">
        <!-- 品牌标识 -->
        <div class="brand-section">
          <div class="logo-wrapper">
            <div class="logo-book">
              <svg class="logo-svg" viewBox="0 0 120 120" fill="none" aria-labelledby="logoTitle logoDesc">
                <title id="logoTitle">QReader Logo</title>
                <desc id="logoDesc">一本打开的书，象征阅读与知识</desc>
                <!-- 左书页 -->
                <path d="M48 28 C42 28, 36 34, 36 42 L36 66 C36 74, 42 80, 48 80" 
                      class="logo-left" stroke-width="3" stroke-linecap="round" fill="none"/>
                <!-- 右书页 -->
                <path d="M72 28 C78 28, 84 34, 84 42 L84 66 C84 74, 78 80, 72 80" 
                      class="logo-right" stroke-width="3" stroke-linecap="round" fill="none"/>
                <!-- 中缝 -->
                <line x1="60" y1="28" x2="60" y2="80" class="logo-center" stroke-width="2.5" stroke-dasharray="4 3"/>
                <!-- 书页线条 -->
                <g class="logo-lines" opacity="0.6">
                  <path d="M39 38 L81 38" stroke-width="2" stroke-linecap="round"/>
                  <path d="M39 48 L81 48" stroke-width="2" stroke-linecap="round"/>
                  <path d="M39 58 L81 58" stroke-width="2" stroke-linecap="round"/>
                  <path d="M39 68 L81 68" stroke-width="2" stroke-linecap="round"/>
                </g>
                <!-- 装饰圆环 -->
                <ellipse cx="60" cy="54" rx="38" ry="36" class="logo-ring" stroke-width="1.5" fill="none"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- 主标题区 -->
        <div class="title-section">
          <h1 class="main-title">
            <span class="title-primary">QReader</span>
          </h1>
          <p class="subtitle">
            <span class="subtitle-cn">融合传统书卷气</span>
            <span class="subtitle-separator">·</span>
            <span class="subtitle-cn">现代科技感</span>
          </p>
        </div>

        <!-- 特性展示 -->
        <div class="features-grid" role="list">
          <div class="feature-card" role="listitem">
            <div class="feature-icon-wrapper">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M7 7h10v10H7z" fill="currentColor" opacity="0.3"/>
                <path d="M7 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <h3 class="feature-title">多格式支持</h3>
            <p class="feature-desc">TXT、EPUB、PDF、MOBI、DOCX、Markdown</p>
          </div>

          <div class="feature-card" role="listitem">
            <div class="feature-icon-wrapper">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
                <path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <h3 class="feature-title">完全离线</h3>
            <p class="feature-desc">数据本地存储，保护隐私安全</p>
          </div>

          <div class="feature-card" role="listitem">
            <div class="feature-icon-wrapper">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3L14 9L20 9L15 14L17 20L12 16L7 20L9 14L4 9L10 9L12 3Z" 
                      stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="feature-title">书签笔记</h3>
            <p class="feature-desc">标注、高亮、进度管理</p>
          </div>
        </div>

        <!-- 主操作按钮 -->
        <div class="cta-section">
          <button 
            class="cta-button" 
            @click="enterLibrary"
            type="button"
            aria-label="进入我的书架"
          >
            <span class="button-inner">
              <svg class="button-icon-left" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 4h16v16H4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 4v16M12 4v16M16 4v16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span class="button-text">进入我的书架</span>
              <svg class="button-icon-right" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="button-loading" aria-hidden="true"></span>
          </button>
          <p class="cta-hint">
            <svg class="hint-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0-.33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0 .33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" 
                    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            支持本地电子书导入，无需联网
          </p>
        </div>

        <!-- 装饰分割线 -->
        <div class="decorative-line" aria-hidden="true">
          <div class="line-segment"></div>
          <div class="line-dot"></div>
          <div class="line-segment"></div>
        </div>

        <!-- Footer -->
        <footer class="page-footer">
          <p class="footer-text">
            <span>© 2025 QReader</span>
            <span class="footer-bullet">•</span>
            <span>为阅读而生</span>
          </p>
        </footer>
      </div>
    </main>

    <!-- 装饰背景 -->
    <div class="background-decoration" aria-hidden="true">
      <div class="bg-gradient"></div>
      <div class="bg-grid"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const enterLibrary = () => {
  router.push('/library')
}
</script>

<style scoped>
/* ============================================
   CSS 变量系统 - 支持四种主题
   ============================================ */
.home-view {
  /* 默认亮色主题 */
  --color-bg: #fafafa;
  --color-bg-card: #ffffff;
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #595959;
  --color-text-tertiary: #8c8c8c;
  --color-border: #e8e8e8;
  --color-brand: linear-gradient(90deg, #2563eb 0%, #7c3aed 100%);
  --color-brand-solid: #2563eb;
  --color-accent: #7c3aed;
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.06);
  --shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.08);
  --shadow-button: 0 2px 8px rgba(37, 99, 235, 0.2);
  --shadow-button-hover: 0 4px 16px rgba(37, 99, 235, 0.3);
}

/* 暗色主题 */
.home-view.theme-dark {
  --color-bg: #0a0a0a;
  --color-bg-card: #1a1a1a;
  --color-text-primary: #fafafa;
  --color-text-secondary: #d4d4d4;
  --color-text-tertiary: #a0a0a0;
  --color-border: #2a2a2a;
  --color-brand: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
  --color-brand-solid: #3b82f6;
  --color-accent: #8b5cf6;
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.4);
  --shadow-button: 0 2px 8px rgba(59, 130, 246, 0.3);
  --shadow-button-hover: 0 4px 16px rgba(59, 130, 246, 0.4);
}

/* 护眼绿主题 */
.home-view.theme-green {
  --color-bg: #f6ffed;
  --color-bg-card: #ffffff;
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #52533d;
  --color-text-tertiary: #87994a;
  --color-border: #d9f7be;
  --color-brand: linear-gradient(90deg, #52c41a 0%, #389e0d 100%);
  --color-brand-solid: #52c41a;
  --color-accent: #389e0d;
  --shadow-card: 0 1px 3px rgba(82, 196, 26, 0.08), 0 4px 12px rgba(82, 196, 26, 0.1);
  --shadow-hover: 0 4px 12px rgba(82, 196, 26, 0.12), 0 8px 24px rgba(82, 196, 26, 0.12);
  --shadow-button: 0 2px 8px rgba(82, 196, 26, 0.2);
  --shadow-button-hover: 0 4px 16px rgba(82, 196, 26, 0.3);
}

/* 羊皮纸主题 */
.home-view.theme-parchment {
  --color-bg: #f5e6d3;
  --color-bg-card: #faf6f0;
  --color-text-primary: #3d2b1f;
  --color-text-secondary: #5c4a3d;
  --color-text-tertiary: #8b7355;
  --color-border: #d4c4a8;
  --color-brand: linear-gradient(90deg, #b8860b 0%, #cd853f 100%);
  --color-brand-solid: #b8860b;
  --color-accent: #cd853f;
  --shadow-card: 0 1px 3px rgba(184, 134, 11, 0.08), 0 4px 12px rgba(184, 134, 11, 0.1);
  --shadow-hover: 0 4px 12px rgba(184, 134, 11, 0.12), 0 8px 24px rgba(184, 134, 11, 0.12);
  --shadow-button: 0 2px 8px rgba(184, 134, 11, 0.2);
  --shadow-button-hover: 0 4px 16px rgba(184, 134, 11, 0.3);
}

/* ============================================
   基础布局
   ============================================ */
.home-view {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 24px;
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  position: relative;
  overflow: hidden;
  transition: background-color 0.3s ease;
}

/* ============================================
   背景装饰 - 使用 CSS Grid 图案，性能更优
   ============================================ */
.background-decoration {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  top: -50%;
  right: -20%;
  width: 800px;
  height: 800px;
  background: radial-gradient(circle at center, rgba(37, 99, 235, 0.08) 0%, transparent 70%);
  animation: gradientFloat 20s ease-in-out infinite;
}

@keyframes gradientFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-30px, -30px) scale(1.05); }
  66% { transform: translate(20px, 20px) scale(0.95); }
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-size: 60px 60px;
  background-image: 
    linear-gradient(to right, rgba(37, 99, 235, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(37, 99, 235, 0.03) 1px, transparent 1px);
  opacity: 0.4;
}

/* ============================================
   主内容区
   ============================================ */
.hero-section {
  position: relative;
  z-index: 1;
  max-width: 900px;
  width: 100%;
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* ============================================
   品牌标识
   ============================================ */
.brand-section {
  margin-bottom: 32px;
}

.logo-wrapper {
  display: inline-block;
  animation: logoFloat 4s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.logo-book {
  width: 120px;
  height: 120px;
}

.logo-svg {
  width: 100%;
  height: 100%;
}

.logo-left,
.logo-right {
  stroke: url(#logoGradient);
}

.logo-center {
  stroke: var(--color-accent);
}

.logo-lines path {
  stroke: var(--color-brand-solid);
}

.logo-ring {
  stroke: var(--color-accent);
  opacity: 0.3;
}

/* ============================================
   标题区域
   ============================================ */
.title-section {
  margin-bottom: 40px;
}

.main-title {
  margin: 0 0 16px;
  font-size: 64px;
  font-weight: 700;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', sans-serif;
  letter-spacing: -1.5px;
  line-height: 1.1;
}

.title-primary {
  background: var(--color-brand);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 0;
  font-size: 18px;
  font-weight: 400;
  color: var(--color-text-secondary);
  letter-spacing: 2px;
}

.subtitle-cn {
  display: inline-block;
}

.subtitle-separator {
  color: var(--color-text-tertiary);
  opacity: 0.5;
}

/* ============================================
   特性网格 - Bento Grid 布局
   ============================================ */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 48px;
  width: 100%;
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px;
  background: var(--color-bg-card);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}

.feature-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
  color: var(--color-brand-solid);
}

.feature-icon {
  width: 28px;
  height: 28px;
}

.feature-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 1px;
}

.feature-desc {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-tertiary);
  line-height: 1.5;
}

/* ============================================
   CTA 按钮区域
   ============================================ */
.cta-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 48px;
}

.cta-button {
  position: relative;
  padding: 18px 48px;
  border: none;
  border-radius: 12px;
  background: var(--color-brand);
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-button);
  letter-spacing: 3px;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-button-hover);
  filter: brightness(1.1);
}

.cta-button:active {
  transform: translateY(0);
}

.cta-button:focus {
  outline: 3px solid rgba(37, 99, 235, 0.3);
  outline-offset: 2px;
}

.button-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.button-icon-left,
.button-icon-right {
  width: 24px;
  height: 24px;
  opacity: 0.9;
}

.button-icon-right {
  transition: transform 0.3s ease;
}

.cta-button:hover .button-icon-right {
  transform: translateX(4px);
}

.button-loading {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.cta-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  color: var(--color-text-tertiary);
}

.hint-icon {
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

/* ============================================
   装饰分割线
   ============================================ */
.decorative-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
}

.line-segment {
  width: 80px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-border), transparent);
}

.line-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-brand-solid);
  position: relative;
}

.line-dot::before,
.line-dot::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-accent);
  opacity: 0.5;
}

.line-dot::before {
  top: -6px;
}

.line-dot::after {
  bottom: -6px;
}

/* ============================================
   Footer
   ============================================ */
.page-footer {
  margin-top: 16px;
}

.footer-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0;
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.footer-bullet {
  opacity: 0.5;
}

/* ============================================
   响应式设计
   遵循移动优先原则
   ============================================ */
@media (max-width: 768px) {
  .home-view {
    padding: 32px 20px;
  }

  .main-title {
    font-size: 42px;
    letter-spacing: -0.5px;
  }

  .subtitle {
    font-size: 15px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .feature-card {
    padding: 20px 16px;
  }

  .cta-button {
    padding: 16px 36px;
    font-size: 16px;
    letter-spacing: 2px;
  }

  .line-segment {
    width: 60px;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 36px;
  }

  .subtitle {
    font-size: 14px;
    gap: 12px;
  }

  .feature-icon-wrapper {
    width: 48px;
    height: 48px;
  }

  .feature-icon {
    width: 24px;
    height: 24px;
  }

  .feature-title {
    font-size: 15px;
  }

  .feature-desc {
    font-size: 12px;
  }

  .cta-button {
    padding: 14px 28px;
    font-size: 15px;
    letter-spacing: 1.5px;
  }

  .button-inner {
    gap: 8px;
  }

  .button-icon-left,
  .button-icon-right {
    width: 20px;
    height: 20px;
  }
}

/* ============================================
   动画性能优化
   ============================================ */
@media (prefers-reduced-motion: reduce) {
  .logo-wrapper,
  .bg-gradient,
  .feature-card:hover,
  .cta-button:hover,
  .button-icon-right,
  .button-loading {
    animation: none;
    transition: none;
  }
}

/* ============================================
   打印样式
   ============================================ */
@media print {
  .background-decoration,
  .cta-button,
  .cta-hint {
    display: none;
  }
}
</style>
