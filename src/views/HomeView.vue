<template>
  <div class="home-view">
    <!-- 主横幅区域 -->
    <main class="hero-section">
      <div class="hero-content">
        <!-- 品牌标识 -->
        <div class="brand-section">
          <div class="logo-wrapper">
            <img src="/qreader-icon.png" alt="QReader Logo" class="app-logo" />
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
   CSS 变量系统 - 统一羊皮纸主题
   ============================================ */
.home-view {
  --color-bg: #f5e6d3;
  --color-bg-card: #faf6f0;
  --color-text-primary: #3d2b1f;
  --color-text-secondary: #5c4a3d;
  --color-text-tertiary: #8b7355;
  --color-border: #d4c4a8;
  --color-brand: linear-gradient(90deg, #b8860b 0%, #cd853f 100%);
  --color-brand-solid: #b8860b;
  --color-accent: #cd853f;
  --color-gold: #c9a84c;
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
  background: 
    linear-gradient(rgba(245, 230, 200, 0.6), rgba(240, 230, 208, 0.7)),
    linear-gradient(135deg, #f5e6d3 0%, #f0e6d0 50%, #e8d4c0 100%);
  color: var(--color-text-primary);
  position: relative;
  overflow: hidden;
  animation: pageBgDrift 20s ease-in-out infinite;
}

@keyframes pageBgDrift {
  0%, 100% { 
    background-position: 0% 50%;
  }
  50% { 
    background-position: 100% 50%;
  }
}

/* ============================================
   背景装饰 - 羊皮纸 + 动态光效
   ============================================ */
.background-decoration {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

/* 主背景 - 羊皮纸渐变 */
.bg-primary {
  position: absolute;
  inset: 0;
  background: 
    linear-gradient(rgba(245, 230, 200, 0.6), rgba(240, 230, 208, 0.7)),
    linear-gradient(135deg, #f5e6d3 0%, #f0e6d0 50%, #e8d4c0 100%);
  animation: bgDrift 15s ease-in-out infinite;
}

@keyframes bgDrift {
  0%, 100% { 
    background-position: 0% 50%;
    filter: brightness(1);
  }
  50% { 
    background-position: 100% 50%;
    filter: brightness(1.05);
  }
}

/* 浮动光斑 */
.bg-glow {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201, 168, 76, 0.15) 0%, transparent 70%);
  filter: blur(40px);
  animation: glowFloat 20s ease-in-out infinite;
}

.glow-1 {
  top: -150px;
  right: -100px;
  animation-delay: -5s;
}

.glow-2 {
  bottom: -150px;
  left: -100px;
  background: radial-gradient(circle, rgba(184, 134, 11, 0.12) 0%, transparent 70%);
  animation-delay: -10s;
}

.glow-3 {
  top: 50%;
  left: 50%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(205, 133, 63, 0.1) 0%, transparent 70%);
  animation-delay: -15s;
}

@keyframes glowFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -40px) scale(1.1); }
  66% { transform: translate(-30px, 30px) scale(0.9); }
}

/* 装饰光晕 */
.bg-ornament {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(ellipse at 20% 30%, rgba(201, 168, 76, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(184, 134, 11, 0.08) 0%, transparent 50%);
  animation: ornamentPulse 12s ease-in-out infinite;
}

@keyframes ornamentPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

/* 细微纹理 */
.bg-texture {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  pointer-events: none;
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

.app-logo {
  width: 140px;
  height: 140px;
  object-fit: contain;
  filter: drop-shadow(0 8px 24px rgba(30, 136, 229, 0.3));
  transition: all 0.3s ease;
}

.app-logo:hover {
  filter: drop-shadow(0 12px 32px rgba(30, 136, 229, 0.4));
  transform: scale(1.05);
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
  stroke: var(--color-gold);
}

.logo-lines path {
  stroke: var(--color-brand-solid);
}

.logo-ring {
  stroke: var(--color-gold);
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
  background: linear-gradient(135deg, rgba(184, 134, 11, 0.12) 0%, rgba(205, 133, 63, 0.12) 100%);
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
