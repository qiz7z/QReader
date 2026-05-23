<template>
  <div class="home-view" :class="`theme-${theme}`">
    <!-- 背景光效 -->
    <div class="ambient-glow">
      <div class="glow-circle glow-1"></div>
      <div class="glow-circle glow-2"></div>
      <div class="glow-circle glow-3"></div>
    </div>

    <!-- 装饰性书页 -->
    <div class="floating-books">
      <div class="floating-book book-1">
        <div class="book-page"></div>
      </div>
      <div class="floating-book book-2">
        <div class="book-page"></div>
      </div>
      <div class="floating-book book-3">
        <div class="book-page"></div>
      </div>
    </div>

    <!-- 主容器 -->
    <div class="home-container">
      <!-- 品牌标识 -->
      <header class="home-header">
        <div class="logo-container">
          <svg class="logo-icon" viewBox="0 0 80 80" fill="none">
            <!-- 书本左侧 -->
            <path d="M32 18 C28 18, 24 22, 24 28 L24 44 C24 50, 28 54, 32 54" 
                  stroke="var(--brand-primary)" 
                  stroke-width="3" 
                  stroke-linecap="round"
                  fill="none"/>
            <!-- 书本右侧 -->
            <path d="M48 18 C52 18, 56 22, 56 28 L56 44 C56 50, 52 54, 48 54" 
                  stroke="var(--brand-secondary)" 
                  stroke-width="3" 
                  stroke-linecap="round"
                  fill="none"/>
            <!-- 中心装订线 -->
            <line x1="40" y1="18" x2="40" y2="54" 
                  stroke="var(--brand-accent)" 
                  stroke-width="2" 
                  stroke-dasharray="3 2"/>
            <!-- 书页线条 -->
            <path d="M27 26 L53 26" stroke="var(--brand-primary)" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
            <path d="M27 32 L53 32" stroke="var(--brand-primary)" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
            <path d="M27 38 L53 38" stroke="var(--brand-primary)" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
            <path d="M27 44 L53 44" stroke="var(--brand-primary)" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
            <!-- 科技光环 -->
            <circle cx="40" cy="36" r="26" 
                    stroke="var(--brand-gradient)" 
                    stroke-width="1.5" 
                    fill="none"
                    opacity="0.3"/>
          </svg>
        </div>
      </header>

      <!-- 主标语区域 -->
      <main class="home-content">
        <div class="hero-section">
          <!-- 主标题 -->
          <h1 class="hero-title">
            <span class="title-cn">QReader</span>
            <span class="title-en">Quantum Reader</span>
          </h1>
          
          <!-- 副标题 -->
          <p class="hero-subtitle">
            <span class="subtitle-line1">融合传统书卷气</span>
            <span class="subtitle-line2">与未来科技感的</span>
            <span class="subtitle-line3 highlight">沉浸式阅读空间</span>
          </p>

          <!-- 分隔线 -->
          <div class="hero-divider">
            <span class="divider-line"></span>
            <span class="divider-dot">◆</span>
            <span class="divider-line"></span>
          </div>

          <!-- 特性展示 -->
          <div class="feature-list">
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>多格式支持</span>
            </div>
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>完全离线</span>
            </div>
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3 6 6 .9-4.5 4.3 1.1 6.1L12 17l-5.6 2.3 1.1-6.1L3 8.9l6-.9 3-6z" 
                      stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>书签笔记</span>
            </div>
          </div>

          <!-- 主按钮 -->
          <div class="cta-section">
            <button class="cta-button" @click="enterLibrary">
              <span class="button-text">
                <svg class="button-icon-left" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4v16h16V4H4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 4v16M12 4v16M16 4v16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M4 4l8 8 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                进入我的书架
                <svg class="button-icon-right" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </button>
            <p class="cta-hint">支持 TXT、EPUB、PDF、MOBI、DOCX、Markdown</p>
          </div>
        </div>

        <!-- 装饰分隔 -->
        <div class="bottom-ornament">
          <svg width="200" height="6" viewBox="0 0 200 6" fill="none">
            <line x1="0" y1="3" x2="70" y2="3" stroke="var(--border-light)" stroke-width="1"/>
            <circle cx="100" cy="3" r="2.5" fill="var(--brand-primary)"/>
            <circle cx="100" cy="3" r="1.5" fill="var(--bg-primary)"/>
            <line x1="130" y1="3" x2="200" y2="3" stroke="var(--border-light)" stroke-width="1"/>
          </svg>
        </div>
      </main>

      <!-- Footer -->
      <footer class="home-footer">
        <p class="footer-text">
          <span>© 2025 QReader</span>
          <span class="footer-dot">•</span>
          <span>为阅读而生</span>
        </p>
      </footer>
    </div>

    <!-- 入场动画 -->
    <div class="entry-animation" :class="{ 'animate-out': animationComplete }">
      <div class="animation-content">
        <svg class="animation-logo" viewBox="0 0 80 80" fill="none">
          <path d="M32 18 C28 18, 24 22, 24 28 L24 44 C24 50, 28 54, 32 54" 
                stroke="#1890ff" stroke-width="3" stroke-linecap="round" fill="none"/>
          <path d="M48 18 C52 18, 56 22, 56 28 L56 44 C56 50, 52 54, 48 54" 
                stroke="#722ed1" stroke-width="3" stroke-linecap="round" fill="none"/>
          <line x1="40" y1="18" x2="40" y2="54" stroke="#096dd9" stroke-width="2" stroke-dasharray="3 2"/>
        </svg>
        <p class="animation-text">Reading the Future</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useReaderStore } from '@/stores/reader'

const router = useRouter()
const readerStore = useReaderStore()
const animationComplete = ref(false)
const theme = computed(() => readerStore.theme)

const enterLibrary = () => {
  router.push('/library')
}

onMounted(() => {
  // 入场动画持续时间后移除
  setTimeout(() => {
    animationComplete.value = true
  }, 1800)
})
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* CSS 变量 */
.theme-light {
  --bg-primary: #fafafa;
  --text-primary: #262626;
  --text-secondary: #595959;
  --text-tertiary: #8c8c8c;
  --border-light: #d9d9d9;
  --brand-primary: #1890ff;
  --brand-secondary: #722ed1;
  --brand-accent: #096dd9;
  --brand-gradient: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
  --button-bg: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  --button-hover: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
  --glow-color: rgba(24, 144, 255, 0.08);
}

.theme-dark {
  --bg-primary: #141414;
  --text-primary: #fafafa;
  --text-secondary: #bfbfbf;
  --text-tertiary: #8c8c8c;
  --border-light: #434343;
  --brand-primary: #40a9ff;
  --brand-secondary: #9254de;
  --brand-accent: #177ddc;
  --brand-gradient: linear-gradient(135deg, #40a9ff 0%, #9254de 100%);
  --button-bg: linear-gradient(135deg, #177ddc 0%, #096dd9 100%);
  --button-hover: linear-gradient(135deg, #40a9ff 0%, #177ddc 100%);
  --glow-color: rgba(64, 169, 255, 0.12);
}

.theme-green {
  --bg-primary: #f6ffed;
  --text-primary: #262626;
  --text-secondary: #595959;
  --text-tertiary: #8c8c8c;
  --border-light: #d9d9d9;
  --brand-primary: #52c41a;
  --brand-secondary: #389e0d;
  --brand-accent: #73d13d;
  --brand-gradient: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  --button-bg: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  --button-hover: linear-gradient(135deg, #73d13d 0%, #52c41a 100%);
  --glow-color: rgba(82, 196, 26, 0.08);
}

.theme-parchment {
  --bg-primary: #f5e6d3;
  --text-primary: #3d2b1f;
  --text-secondary: #5c4a3d;
  --text-tertiary: #8b7355;
  --border-light: #d4c4a8;
  --brand-primary: #b8860b;
  --brand-secondary: #cd853f;
  --brand-accent: #daa520;
  --brand-gradient: linear-gradient(135deg, #b8860b 0%, #cd853f 100%);
  --button-bg: linear-gradient(135deg, #b8860b 0%, #cd853f 100%);
  --button-hover: linear-gradient(135deg, #daa520 0%, #b8860b 100%);
  --glow-color: rgba(184, 134, 11, 0.1);
}

/* 背景光效 */
.ambient-glow {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.glow-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s ease-in-out infinite;
}

.glow-1 {
  width: 400px;
  height: 400px;
  background: var(--glow-color);
  top: -200px;
  right: -100px;
  animation-delay: -5s;
}

.glow-2 {
  width: 300px;
  height: 300px;
  background: rgba(114, 46, 209, 0.06);
  bottom: -150px;
  left: -100px;
  animation-delay: -10s;
}

.glow-3 {
  width: 250px;
  height: 250px;
  background: rgba(24, 144, 255, 0.05);
  top: 50%;
  left: 50%;
  animation-delay: -15s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

/* 漂浮书页 */
.floating-books {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.floating-book {
  position: absolute;
  opacity: 0.06;
}

.book-page {
  width: 80px;
  height: 100px;
  background: linear-gradient(135deg, var(--brand-primary) 0%, transparent 100%);
  border-radius: 4px;
  transform: rotate(45deg);
}

.book-1 {
  top: 15%;
  left: 10%;
  animation: floatBook 18s ease-in-out infinite;
}

.book-2 {
  top: 60%;
  right: 15%;
  animation: floatBook 22s ease-in-out infinite;
  animation-delay: -8s;
}

.book-3 {
  bottom: 20%;
  left: 20%;
  animation: floatBook 20s ease-in-out infinite;
  animation-delay: -12s;
}

@keyframes floatBook {
  0%, 100% { transform: translateY(0) rotate(45deg); }
  50% { transform: translateY(-20px) rotate(50deg); }
}

/* 主容器 */
.home-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

/* 品牌标识 */
.home-header {
  text-align: center;
  padding: 20px 0 40px;
}

.logo-container {
  display: inline-block;
  animation: logoFloat 4s ease-in-out infinite;
}

.logo-icon {
  width: 80px;
  height: 80px;
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* 主内容区 */
.home-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.hero-section {
  text-align: center;
  animation: fadeInUp 1s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-title {
  margin: 0 0 32px;
}

.title-cn {
  display: block;
  font-size: 80px;
  font-weight: 200;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', '思源宋体', serif;
  background: var(--brand-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 8px;
  line-height: 1.1;
}

.title-en {
  display: block;
  font-size: 14px;
  font-weight: 400;
  font-family: 'Inter', 'SF Pro Display', -apple-system, sans-serif;
  color: var(--text-tertiary);
  letter-spacing: 6px;
  margin-top: 16px;
  text-transform: uppercase;
}

/* 副标题 */
.hero-subtitle {
  display: block;
  margin: 0 0 40px;
  line-height: 2.2;
}

.subtitle-line1,
.subtitle-line2 {
  display: block;
  font-size: 22px;
  font-weight: 300;
  color: var(--text-primary);
  letter-spacing: 1.5px;
}

.subtitle-line3 {
  display: block;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 1.5px;
}

@supports (-webkit-background-clip: text) {
  .subtitle-line3.highlight {
    background: var(--brand-gradient);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

/* 分隔线 */
.hero-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 48px 0;
  opacity: 0.6;
}

.divider-line {
  display: inline-block;
  width: 60px;
  height: 1px;
  background: var(--border-light);
}

.divider-dot {
  display: inline-block;
  margin: 0 16px;
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 特性列表 */
.feature-list {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  margin-bottom: 64px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.feature-icon {
  width: 48px;
  height: 48px;
  color: var(--brand-primary);
}

.feature-item span {
  font-size: 14px;
  font-weight: 400;
  color: var(--text-tertiary);
  letter-spacing: 3px;
}

/* CTA 区域 */
.cta-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.cta-button {
  padding: 0;
  border: none;
  border-radius: 48px;
  background: var(--button-bg);
  color: #fff;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 24px rgba(24, 144, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.cta-button:hover {
  background: var(--button-hover);
  transform: translateY(-3px);
  box-shadow: 0 8px 32px rgba(24, 144, 255, 0.4);
}

.cta-button:active {
  transform: translateY(-1px);
}

.cta-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.cta-button:hover::before {
  width: 400px;
  height: 400px;
}

.button-text {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 40px;
  font-size: 18px;
  font-weight: 500;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', '思源宋体', serif;
  letter-spacing: 6px;
  position: relative;
  z-index: 1;
}

.button-icon-left {
  width: 24px;
  height: 24px;
  opacity: 0.8;
}

.button-icon-right {
  width: 20px;
  height: 20px;
  opacity: 0.7;
}

.cta-hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-tertiary);
  letter-spacing: 2px;
}

/* 底部装饰 */
.bottom-ornament {
  margin-top: 60px;
  padding-top: 20px;
  opacity: 0.6;
}

/* Footer */
.home-footer {
  padding: 24px 0;
  text-align: center;
}

.footer-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
  letter-spacing: 1px;
}

.footer-dot {
  opacity: 0.5;
}

/* 入场动画 */
.entry-animation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  transition-delay: 0.6s;
}

.entry-animation.animate-out {
  opacity: 0;
  transform: scale(1.1);
  pointer-events: none;
}

.animation-content {
  text-align: center;
  animation: breathe 2s ease-in-out infinite;
}

.animation-logo {
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
}

.animation-text {
  font-size: 18px;
  font-weight: 300;
  color: var(--text-primary);
  letter-spacing: 4px;
  opacity: 0.7;
}

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.03); opacity: 1; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .title-cn {
    font-size: 56px;
    letter-spacing: 4px;
  }

  .subtitle-line1,
  .subtitle-line2,
  .subtitle-line3 {
    font-size: 18px;
  }

  .feature-list {
    gap: 24px;
  }

  .feature-icon {
    width: 40px;
    height: 40px;
  }

  .feature-item span {
    font-size: 12px;
    letter-spacing: 2px;
  }

  .button-text {
    padding: 16px 32px;
    font-size: 16px;
    letter-spacing: 4px;
    gap: 10px;
  }

  .button-icon-left {
    width: 20px;
    height: 20px;
  }

  .button-icon-right {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 480px) {
  .title-cn {
    font-size: 42px;
  }

  .subtitle-line1,
  .subtitle-line2,
  .subtitle-line3 {
    font-size: 16px;
  }

  .feature-list {
    flex-direction: column;
    gap: 20px;
  }

  .button-text {
    padding: 14px 28px;
    font-size: 15px;
    letter-spacing: 3px;
  }
}
</style>
