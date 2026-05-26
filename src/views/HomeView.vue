<template>
  <div class="home-view">
    <!-- 魔法粒子背景 -->
    <div class="magic-particles">
      <div class="particle" v-for="i in 30" :key="i" :style="particleStyle(i)"></div>
    </div>

    <!-- 主横幅区域 -->
    <main class="hero-section">
      <div class="hero-content">
        <!-- 品牌标识 -->
        <div class="brand-section">
          <div class="brand-identity">
            <div class="logo-wrapper">
              <img src="/qreader-icon-transparent.png" alt="QReader Logo" class="logo-image" />
            </div>
            <h1 class="brand-title">
              <span class="brand-title-text">QReader</span>
              <div class="brand-title-glow"></div>
            </h1>
          </div>
          <p class="subtitle">
            <span class="subtitle-cn">魔法藏书阁</span>
            <span class="subtitle-separator">·</span>
            <span class="subtitle-en">Magic Library</span>
          </p>
        </div>

        <!-- 特性展示 -->
        <div class="features-grid" role="list">
          <div class="feature-card" role="listitem">
            <div class="feature-icon-wrapper">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 22V12M12 12L4 7M12 12l8-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <h3 class="feature-title">多格式支持</h3>
            <p class="feature-desc">TXT、EPUB、PDF、MOBI、DOCX、Markdown</p>
          </div>

          <div class="feature-card" role="listitem">
            <div class="feature-icon-wrapper">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
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
              <span class="button-text">进入藏书阁</span>
              <svg class="button-icon-right" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="button-loading" aria-hidden="true"></span>
          </button>
          <p class="cta-hint">
            <svg class="hint-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0-.33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0 .33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" 
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
            <span>魔法阅读体验</span>
          </p>
        </footer>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const enterLibrary = () => {
  router.push('/library')
}

// 魔法粒子随机样式生成
function particleStyle(_index: number) {
  const delay = Math.random() * 5
  const duration = 3 + Math.random() * 4
  const left = Math.random() * 100
  const size = 2 + Math.random() * 4
  const top = Math.random() * 100
  return {
    '--delay': `${delay}s`,
    '--duration': `${duration}s`,
    '--left': `${left}%`,
    '--top': `${top}%`,
    '--size': `${size}px`,
  }
}
</script>

<style scoped>
/* ============================================
   魔法粒子背景
   ============================================ */
@keyframes float {
  0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
}

@keyframes glow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

.magic-particles {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.particle {
  position: absolute;
  left: var(--left);
  top: var(--top);
  width: var(--size);
  height: var(--size);
  background: radial-gradient(circle, rgba(191, 149, 63, 0.6) 0%, transparent 70%);
  border-radius: 50%;
  animation: float var(--duration) ease-in infinite;
  animation-delay: var(--delay);
  box-shadow: 0 0 10px rgba(191, 149, 63, 0.4);
}

/* ============================================
   CSS 变量系统 - 魔法学院主题
   ============================================ */
.home-view {
  --color-bg: #1a1f2e;
  --color-bg-card: #2d3548;
  --color-text-primary: #e8e4d0;
  --color-text-secondary: #b8a888;
  --color-text-tertiary: #8b7355;
  --color-border: #c9a84c;
  --color-brand: linear-gradient(135deg, #c9a84c 0%, #bf953f 50%, #aa771c 100%);
  --color-brand-solid: #c9a84c;
  --color-accent: #1890ff;
  --color-gold: #c9a84c;
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(191, 149, 63, 0.1);
  --shadow-hover: 0 4px 16px rgba(191, 149, 63, 0.2), 0 0 0 1px rgba(191, 149, 63, 0.2);
  --shadow-button: 0 4px 16px rgba(191, 149, 63, 0.3);
  --shadow-button-hover: 0 6px 24px rgba(191, 149, 63, 0.4);
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
    linear-gradient(180deg, #0f141f 0%, #1a1f2e 50%, #252030 100%);
  color: var(--color-text-primary);
  position: relative;
  overflow: hidden;
}

.home-view::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image:
    radial-gradient(ellipse at 30% 20%, rgba(191, 149, 63, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(24, 144, 255, 0.06) 0%, transparent 50%);
  animation: bgGlow 15s ease-in-out infinite;
}

@keyframes bgGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
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
  margin-bottom: 40px;
}

.brand-identity {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 16px;
}

.logo-wrapper {
  flex-shrink: 0;
  animation: logoFloat 4s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.logo-image {
  width: 90px;
  height: 90px;
  filter: drop-shadow(0 0 16px rgba(191, 149, 63, 0.4));
  transition: filter 0.3s ease;
}

.logo-wrapper:hover .logo-image {
  filter: drop-shadow(0 0 24px rgba(191, 149, 63, 0.6));
}

.brand-title {
  font-size: 56px;
  font-weight: 700;
  font-family: 'Times New Roman', Times, serif;
  letter-spacing: 8px;
  line-height: 1;
  position: relative;
  display: inline-block;
}

.brand-title-text {
  /* 金属质感渐变 */
  background: linear-gradient(
    135deg,
    #f4e59c 0%,
    #c9a84c 15%,
    #f4e59c 25%,
    #bf953f 35%,
    #f4e59c 45%,
    #aa771c 55%,
    #f4e59c 65%,
    #bf953f 75%,
    #f4e59c 85%,
    #aa771c 100%
  );
  background-size: 300% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 1px rgba(170, 119, 28, 0.8);
  animation: metalShimmer 4s ease-in-out infinite;
  /* 立体阴影 */
  filter: 
    drop-shadow(0 2px 0px rgba(150, 100, 50, 0.5))
    drop-shadow(0 4px 4px rgba(0, 0, 0, 0.4))
    drop-shadow(0 0 15px rgba(191, 149, 63, 0.5));
  position: relative;
  z-index: 2;
}

@keyframes metalShimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* 装饰花纹 - 左上角 */
.brand-title::before {
  content: '✦';
  position: absolute;
  top: -20px;
  left: -30px;
  font-size: 24px;
  color: #c9a84c;
  text-shadow: 0 0 10px rgba(191, 149, 63, 0.8);
  animation: starFloat 3s ease-in-out infinite;
}

/* 装饰花纹 - 右下角 */
.brand-title::after {
  content: '✦';
  position: absolute;
  bottom: -20px;
  right: -30px;
  font-size: 24px;
  color: #c9a84c;
  text-shadow: 0 0 10px rgba(191, 149, 63, 0.8);
  animation: starFloat 3s ease-in-out infinite reverse;
}

@keyframes starFloat {
  0%, 100% { 
    transform: scale(1) rotate(0deg);
    opacity: 0.8;
  }
  50% { 
    transform: scale(1.2) rotate(180deg);
    opacity: 1;
  }
}

.brand-title-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  filter: blur(15px);
  opacity: 0.5;
  background: radial-gradient(
    ellipse at center,
    rgba(244, 229, 156, 0.5) 0%,
    rgba(191, 149, 63, 0.3) 50%,
    transparent 70%
  );
  animation: glowPulse 3s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.15); opacity: 0.7; }
}

/* ============================================
   副标题区域
   ============================================ */
.subtitle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 0;
  font-size: 16px;
  font-weight: 400;
  color: var(--color-text-secondary);
  letter-spacing: 3px;
  font-family: 'Times New Roman', Times, serif;
}

.subtitle-cn {
  display: inline-block;
}

.subtitle-separator {
  color: var(--color-gold);
  opacity: 0.6;
}

.subtitle-en {
  font-style: italic;
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
  border: 1px solid rgba(191, 149, 63, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-brand);
  opacity: 0;
  transition: opacity 0.3s;
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
  border-color: rgba(191, 149, 63, 0.3);
}

.feature-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(191, 149, 63, 0.15) 0%, rgba(170, 119, 28, 0.15) 100%);
  color: var(--color-gold);
  box-shadow: 0 0 20px rgba(191, 149, 63, 0.2);
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
  font-family: 'Times New Roman', Times, serif;
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
  border: 1px solid rgba(191, 149, 63, 0.3);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(191, 149, 63, 0.2) 0%, rgba(170, 119, 28, 0.2) 100%);
  color: var(--color-gold);
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-button);
  letter-spacing: 4px;
  font-family: 'Times New Roman', Times, serif;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-button-hover);
  background: linear-gradient(135deg, rgba(191, 149, 63, 0.3) 0%, rgba(170, 119, 28, 0.3) 100%);
  border-color: rgba(191, 149, 63, 0.5);
}

.cta-button:active {
  transform: translateY(0);
}

.cta-button:focus {
  outline: 3px solid rgba(191, 149, 63, 0.3);
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
    rgba(191, 149, 63, 0.3),
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
  font-family: 'Times New Roman', Times, serif;
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
  background: linear-gradient(90deg, transparent, var(--color-gold), transparent);
  box-shadow: 0 0 8px rgba(191, 149, 63, 0.3);
}

.line-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-gold);
  position: relative;
  box-shadow: 0 0 10px rgba(191, 149, 63, 0.6);
  animation: dotGlow 3s ease-in-out infinite;
}

@keyframes dotGlow {
  0%, 100% { box-shadow: 0 0 10px rgba(191, 149, 63, 0.6); }
  50% { box-shadow: 0 0 16px rgba(191, 149, 63, 1); }
}

.line-dot::before,
.line-dot::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-gold);
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
  font-family: 'Times New Roman', Times, serif;
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
  .bg-mountains,
  .bg-moon,
  .cloud,
  .bird,
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
