<template>
  <div class="reader-view" :class="themeClass">
    <div class="reader-body" ref="bodyRef">
      <!-- 左侧目录（仅展开时显示，作为叠加层） -->
      <aside class="reader-sidebar" v-show="!uiHidden && showTocPanel" :style="{ width: sidebarWidth + 'px' }">
        <div class="sidebar-expanded">
          <div class="sidebar-header">
            <h3>目录</h3>
            <button @click="showTocPanel = false" title="收起" class="collapse-btn side-btn">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          </div>
          <div class="sidebar-content" :style="{ ...getFontWeightStyle(readerStore.fontWeight), fontFamily: fonts[readerStore.fontFamily]?.css || fonts[0].css }">
            <div v-if="book?.content?.length" v-for="(ch, idx) in book.content" :key="ch.id || idx" class="toc-item" :class="{ active: currentChapter === idx }" @click="onTocClick(idx)">
              <svg class="toc-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="7" x2="18" y2="7"></line>
                <line x1="7" y1="14" x2="18" y2="14"></line>
                <line x1="7" y1="20" x2="12" y2="20"></line>
              </svg>
              <span class="toc-title">{{ ch.title || `第 ${idx + 1} 章` }}</span>
            </div>
            <div v-else class="empty-text">暂无目录</div>
          </div>
        </div>
      </aside>

      <!-- 拖拽条 -->
      <div v-if="showTocPanel" class="resize-bar" @mousedown="startResize"></div>

  <!-- 主阅读区 -->
  <main class="reader-main" :class="{ 'page-mode': readerStore.readerMode === 'page' && pageModeAvailable }" ref="mainRef" @click="handleMainClick">
    <PdfReader
      ref="pdfReaderRef"
      v-if="book && bookFormat === 'pdf'"
      :raw-file="rawFile"
      :theme="readerStore.theme"
      :scale="pdfScale"
      :current-page="currentChapter"
      :annotation-mode="annotationMode"
      :annotations="pdfAnnotations"
      :pen-color="penColor"
      :pen-width="penWidth"
      :eraser-mode="eraserMode"
      :highlighter-mode="highlighterMode"
      :highlighter-width="highlighterWidth"
      @annotations-change="handlePdfAnnotationsChange"
      @erase-annotation="handleEraseAnnotation"
    />
    <div v-if="book && bookFormat === 'pdf'" class="pdf-controls-bar">
      <div class="pdf-annotation-toolbar" :class="{ 'annotation-active': annotationMode }">
        <button class="annotation-toggle-btn" :class="{ active: annotationMode }" @click.stop="toggleAnnotationMode" title="标注模式">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
            <path d="M2 2l7.586 7.586"></path>
            <circle cx="11" cy="11" r="2"></circle>
          </svg>
        </button>
        
        <template v-if="annotationMode">
          <!-- 画笔工具 + 颜色 -->
          <div class="annotation-divider"></div>
          <button class="annotation-action-btn tool-btn" :class="{ active: !eraserMode && !highlighterMode }" @click.stop="eraserMode = ''; highlighterMode = false" title="画笔">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
          </button>
          <div class="annotation-colors" v-if="!eraserMode && !highlighterMode">
            <button 
              v-for="color in penColors" 
              :key="color"
              class="annotation-color-btn"
              :class="{ active: penColor === color }"
              :style="{ background: color }"
              @click.stop="penColor = color"
            ></button>
          </div>
          
          <!-- 荧光笔工具 + 颜色 -->
          <div class="annotation-divider"></div>
          <button class="annotation-action-btn tool-btn highlighter-btn" :class="{ active: highlighterMode }" @click.stop="highlighterMode = !highlighterMode; eraserMode = ''" title="荧光笔">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21l1.5-5.5L17 3l4 4L8.5 19.5z"/>
              <path d="M3 21l2-2"/>
              <path d="M14.5 6.5l3 3" opacity="0.5"/>
            </svg>
          </button>
          <div class="annotation-colors highlighter-colors" v-if="highlighterMode">
            <button 
              v-for="color in highlighterColors" 
              :key="color"
              class="annotation-color-btn highlighter-color-btn"
              :class="{ active: penColor === color }"
              :style="{ background: color }"
              @click.stop="penColor = color"
            ></button>
          </div>
          
          <!-- 线宽调节 -->
          <div class="annotation-divider"></div>
          <div class="annotation-width">
            <button class="width-btn" @click.stop="adjustPenWidth(-0.5)">−</button>
            <span class="width-value">{{ highlighterMode ? highlighterWidth.toFixed(0) + 'px' : penWidth.toFixed(1) + 'mm' }}</span>
            <button class="width-btn" @click.stop="adjustPenWidth(0.5)">+</button>
          </div>
          
          <!-- 橡皮擦工具 -->
          <div class="annotation-divider"></div>
          <button class="annotation-action-btn" :class="{ active: eraserMode === 'line' }" @click.stop="eraserMode = eraserMode === 'line' ? '' : 'line'; highlighterMode = false" title="线条擦除">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 20H8.5l-5-5a2 2 0 0 1 0-2.83l9-9a2 2 0 0 1 2.83 0l4.5 4.5"/>
              <path d="M11.5 14.5L16 10"/>
              <path d="M3 17l3 2.5"/>
            </svg>
          </button>
          <button class="annotation-action-btn" :class="{ active: eraserMode === 'lasso' }" @click.stop="eraserMode = eraserMode === 'lasso' ? '' : 'lasso'; highlighterMode = false" title="圈套擦除">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3a9 9 0 1 1-7 15"/>
              <path d="M5 18a2 2 0 0 1 2-2"/>
              <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
            </svg>
          </button>
          
          <!-- 清除全部 -->
          <div class="annotation-divider"></div>
          <button class="annotation-action-btn danger-btn" @click.stop="clearAllAnnotations" title="清除全部">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <path d="M19 6v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
              <line x1="10" y1="10" x2="10" y2="17"/>
              <line x1="14" y1="10" x2="14" y2="17"/>
            </svg>
          </button>
        </template>
      </div>
      
      <div class="annotation-zoom-divider"></div>
      
      <div class="pdf-zoom-controls">
        <button class="zoom-btn" @click="adjustZoom(0.25)">+</button>
        <div class="zoom-slider-wrap">
          <input type="range" class="zoom-slider" min="0.5" max="2.7" step="0.05" :value="pdfScale" @input="onZoomInput" />
        </div>
        <button class="zoom-btn" @click="adjustZoom(-0.25)">−</button>
        <span class="zoom-label">{{ Math.round(pdfScale * 100) }}%</span>
      </div>
    </div>
    <div v-else-if="book" class="reader-content-wrap" :class="{ 'page-mode': readerStore.readerMode === 'page' && pageModeAvailable }">
      <!-- 滚动模式 -->
      <div
        v-if="readerStore.readerMode === 'scroll' || !pageModeAvailable"
        class="reader-content"
        :style="contentStyle"
        @mouseup="handleTextSelection"
      >
        <p
          v-for="(paragraph, idx) in highlightedSentences"
          :key="idx"
          :ref="el => setSentenceRef(el as HTMLElement | null, idx)"
          :class="{ 'read-aloud-active': isReadAloudPlaying && idx === currentSentenceIndex, 'clickable-during-tts': isTtsActive }"
          v-html="paragraph"
          @click="onParagraphClick(idx, $event)"
        />
        <!-- 章节末尾翻章按钮 -->
        <div v-if="book && bookFormat !== 'pdf'" class="chapter-end-nav">
          <button class="chapter-end-btn" @click="prevChapter" :disabled="currentChapter <= 0">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>上一章</span>
          </button>
          <span class="chapter-end-divider"></span>
          <button class="chapter-end-btn" @click="nextChapter" :disabled="currentChapter >= (book?.content?.length || 1) - 1">
            <span>下一章</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <!-- 翻页模式 -->
      <div v-else-if="readerStore.readerMode === 'page' && pageModeAvailable" class="reader-page-mode">
        <div class="page-viewport" :style="contentStyle" @mouseup="handleTextSelection">
          <div class="page-col-left">
            <template v-for="(item, i) in currentPageData?.left || []" :key="'l'+pageNum+'-'+i">
              <p v-html="item.html" :class="{ 'read-aloud-active': isReadAloudPlaying && item.idx === currentSentenceIndex, 'clickable-during-tts': isTtsActive }" @click="onParagraphClick(item.idx, $event)"/>
            </template>
          </div>
          <div class="page-col-right">
            <template v-for="(item, i) in currentPageData?.right || []" :key="'r'+pageNum+'-'+i">
              <p v-html="item.html" :class="{ 'read-aloud-active': isReadAloudPlaying && item.idx === currentSentenceIndex, 'clickable-during-tts': isTtsActive }" @click="onParagraphClick(item.idx, $event)"/>
            </template>
          </div>
        </div>
        <div class="page-nav-left-group">
          <button class="nav-circle nav-chapter" @click.stop="prevChapter" :disabled="currentChapter <= 0" title="上一章" aria-label="上一章">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="11 17 6 12 11 7"></polyline>
              <polyline points="18 17 13 12 18 7"></polyline>
            </svg>
          </button>
          <button class="nav-circle nav-page" @click.stop="pagePrev" :disabled="pageNum <= 1 && currentChapter <= 0" title="上一页" aria-label="上一页">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </div>
        <div class="page-nav-right-group">
          <button class="nav-circle nav-page" @click.stop="pageNext" :disabled="pageNum >= totalPageNum && currentChapter >= (book?.content?.length || 1) - 1" title="下一页" aria-label="下一页">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          <button class="nav-circle nav-chapter" @click.stop="nextChapter" :disabled="currentChapter >= (book?.content?.length || 1) - 1" title="下一章" aria-label="下一章">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="13 17 18 12 13 7"></polyline>
              <polyline points="6 17 11 12 6 7"></polyline>
            </svg>
          </button>
        </div>
        <div v-if="!isFullscreen" class="page-indicator-bar" :class="{ hidden: uiHidden }">
          <div class="indicator-left">
            <span class="info-time">{{ currentTime }}</span>
            <span class="info-divider">|</span>
            <span class="info-progress">{{ wordsRead }} / {{ totalWords }} 字</span>
          </div>
          <div class="indicator-center">
            <span class="page-indicator-text">{{ pageNum }} / {{ totalPageNum }}</span>
            <span class="chapter-indicator" v-if="!isJumping" @click.stop="startJump">
              {{ currentChapter + 1 }} / {{ book?.content?.length || 0 }}
            </span>
            <div v-else class="chapter-jump-input-wrapper">
              <input
                type="number"
                v-model.number="jumpInput"
                @keyup.enter="confirmJump"
                @blur="confirmJump"
                ref="jumpInputRef1"
                class="chapter-input"
                min="1"
                :max="book?.content?.length || 1"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-else class="loading">加载中...</div>
    </div>

        <!-- 翻页模式右下角翻章按钮已移除，章节跳转统一在底部功能栏 -->

        <!-- 底部阅读信息（滚动模式） -->
        <div v-if="book && bookFormat !== 'pdf' && readerStore.readerMode !== 'page'" class="reader-info-bar" :class="{ hidden: uiHidden }">
          <div class="info-left">
            <span class="info-time">{{ currentTime }}</span>
            <span class="info-divider">|</span>
            <span class="info-progress">{{ wordsRead }} / {{ totalWords }} 字</span>
          </div>
          <div class="info-right">
            <span class="chapter-indicator" v-if="!isJumping" @click.stop="startJump">
              {{ currentChapter + 1 }} / {{ book?.content?.length || 0 }}
            </span>
            <div v-else class="chapter-jump-input-wrapper">
              <input
                type="number"
                v-model.number="jumpInput"
                @keyup.enter="confirmJump"
                @blur="confirmJump"
                ref="jumpInputRef2"
                class="chapter-input"
                min="1"
                :max="book?.content?.length || 1"
              />
            </div>
          </div>
        </div>
      </main>

      <!-- 划线笔记浮动工具栏 -->
      <div v-if="showHlToolbar" class="hl-toolbar" :style="{ left: hlToolbarPos.x + 'px', top: hlToolbarPos.y + 'px' }">
        <div class="hl-colors">
          <button v-for="c in hlColors" :key="c" class="hl-color-btn" :class="{ active: hlSelectedColor === c }" :style="{ background: c }" @click="hlSelectedColor = c"></button>
        </div>
        <div class="hl-actions">
          <button class="hl-btn hl-btn-note" @click="hlShowNoteInput = !hlShowNoteInput">{{ hlShowNoteInput ? '取消' : '笔记' }}</button>
          <button class="hl-btn hl-btn-save" @click="saveHighlight">保存</button>
        </div>
        <div v-if="hlShowNoteInput" class="hl-note-input-wrap">
          <textarea v-model="hlNoteInput" class="hl-note-input" placeholder="添加笔记..." rows="2"></textarea>
        </div>
      </div>
    </div>

    <!-- 底部控制栏 -->
    <div class="bottom-bar" :class="{ hidden: uiHidden }" @click.stop>
        <button class="bot-btn" @click="router.push('/')" title="返回首页">
          <span class="bot-han">歸</span>
        </button>
        <div class="bot-divider"></div>
        <button class="bot-btn" @click="showTocPanel=!showTocPanel" :class="{ active: showTocPanel }" title="目录">
          <span class="bot-han">錄</span>
        </button>
        <button class="bot-btn" @click="toggleRight('annotations')" :class="{ active: rightPanel === 'annotations' }" title="划线笔记">
          <span class="bot-han">筆</span>
        </button>
        <button class="bot-btn" @click="toggleRight('bookmarks')" :class="{ active: rightPanel === 'bookmarks' }" title="书签">
          <span class="bot-han">簽</span>
        </button>
        <button class="bot-btn" @click="toggleRight('readAloud')" :class="{ active: rightPanel === 'readAloud', 'tts-playing': isReadAloudPlaying, 'tts-paused': isTtsActive && !isReadAloudPlaying }" title="朗读">
          <span v-if="!isReadAloudPlaying && !(isTtsActive && !isReadAloudPlaying)" class="bot-han">讀</span>
          <span v-else-if="isTtsActive && !isReadAloudPlaying" class="bot-han bot-han-sm">暫停</span>
          <span v-else class="bot-han">讀</span>
        </button>
        <button class="bot-btn" @click="toggleRight('shelf')" :class="{ active: rightPanel === 'shelf' }" title="书架">
          <span class="bot-han">書</span>
        </button>
        <button class="bot-btn" @click="toggleRight('settings')" :class="{ active: rightPanel === 'settings' }" title="设置">
          <span class="bot-han">設</span>
        </button>
        <div class="bot-divider"></div>
        <button class="bot-btn" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏阅读'">
          <span class="bot-han">全</span>
        </button>
      </div>

      <!-- 底部弹出面板 -->
      <transition name="panel-slide-up">
        <div v-if="rightPanel" class="bottom-panel" :class="rightPanel" @click.stop>
          <div class="bottom-panel-hd">
            <span>{{ rightPanel === 'shelf' ? '书架' : rightPanel === 'readAloud' ? '朗读' : rightPanel === 'annotations' ? '划线笔记' : rightPanel === 'bookmarks' ? '书签' : '阅读设置' }}</span>
            <div class="panel-hd-actions">
              <button v-if="rightPanel === 'shelf'" class="shelf-goto-btn" @click="rightPanel=''; goToLibrary()" title="返回书架页面">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>全部</span>
              </button>
              <button class="close-btn" @click="rightPanel = ''">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>
          <div class="bottom-panel-bd">
            <!-- 朗读面板 -->
            <div v-if="rightPanel === 'readAloud'" class="read-aloud-panel">
              <!-- 播放主控卡：渐变背景 + 动态状态指示 -->
              <div class="panel-card ra-hero-card" :class="{ 'is-playing': isReadAloudPlaying, 'is-error': isSpeechError }">
                <div class="ra-hero-top">
                  <div class="ra-status-pill">
                    <span class="ra-status-dot"></span>
                    <span class="ra-status-text">{{ isSpeechError ? '出错' : isReadAloudPlaying ? '正在朗读' : isVoicesLoaded ? '准备就绪' : '加载中' }}</span>
                  </div>
                </div>
                <div class="ra-hero-play">
                  <button class="ra-play-btn" @click="toggleReadAloud" :title="isReadAloudPlaying ? '暂停' : '开始朗读'" :disabled="voiceCache.length === 0">
                    <svg v-if="isReadAloudPlaying" viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1.2"></rect>
                      <rect x="14" y="4" width="4" height="16" rx="1.2"></rect>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
                      <path d="M7 4.5a1 1 0 0 1 1.55-.83l11 7.5a1 1 0 0 1 0 1.66l-11 7.5A1 1 0 0 1 7 19.5v-15z"></path>
                    </svg>
                  </button>
                  <div v-if="isReadAloudPlaying" class="ra-wave" aria-hidden="true">
                    <span></span><span></span><span></span><span></span><span></span>
                  </div>
                </div>
                <div class="ra-hero-hint">{{ isReadAloudPlaying ? '点击当前段落停止 · 点其他段落跳转' : '点击播放，开始聆听' }}</div>
              </div>

              <!-- 音色选择卡：胶囊按钮网格 -->
              <div class="panel-card">
                <div class="card-label">音色</div>
                <div class="ra-voice-grid">
                  <button
                    v-for="voice in voiceCache" :key="voice.id"
                    class="ra-voice-chip"
                    :class="{ active: selectedVoiceName === voice.id }"
                    @click="selectedVoiceName = voice.id; onVoiceChange()"
                  >
                    <span class="ra-voice-avatar" :class="voice.gender === '男' ? 'm' : 'f'">{{ voice.name.charAt(0) }}</span>
                    <span class="ra-voice-info">
                      <span class="ra-voice-name">{{ voice.name }}</span>
                      <span class="ra-voice-style">{{ voice.style }}</span>
                    </span>
                  </button>
                </div>
              </div>

              <!-- 语速卡 -->
              <div class="panel-card">
                <div class="card-label">语速</div>
                <div class="setting-row ra-rate-row">
                  <input type="range" min="0.5" max="1.5" step="0.1" v-model="speechRate" @change="updateSettings" />
                  <span class="setting-value">{{ speechRate.toFixed(1) }}x</span>
                </div>
              </div>
            </div>

            <!-- 书架 -->
            <div v-if="rightPanel === 'shelf'" class="shelf-panel">
              <div v-if="shelfList.length" class="shelf-grid">
                <div v-for="b in shelfList" :key="b.id" class="shelf-card" @click="openBook(b.id)">
                  <div class="shelf-cover-img">
                    <img :src="coverUrl(b.id, b.cover, b.title)" alt="" />
                    <span class="shelf-format-tag">{{ b.format.toUpperCase() }}</span>
                    <div v-if="b.progress && b.progress.percentage > 0" class="shelf-progress-track">
                      <div class="shelf-progress-fill" :style="{ width: b.progress.percentage + '%' }"></div>
                    </div>
                  </div>
                  <div class="shelf-info">
                    <div class="shelf-name">{{ b.title }}</div>
                    <div class="shelf-author" v-if="b.author">{{ b.author }}</div>
                    <div class="shelf-meta">
                      <span v-if="b.progress && b.progress.percentage > 0" class="shelf-pct">{{ Math.round(b.progress.percentage) }}%</span>
                      <span v-if="b.progress?.readingTime" class="shelf-time">{{ formatShelfTime(b.progress.readingTime) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-placeholder">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                <p>暂无书籍</p>
              </div>
          </div>

            <!-- 设置 -->
            <div v-if="rightPanel === 'settings'" class="settings-panel">
              <div class="settings-grid">
                <div class="panel-card">
                  <div class="card-label">显示</div>
                  <div class="setting-group">
                    <label class="group-label">字体大小 <span class="group-value">{{ readerStore.fontSize }}</span></label>
                    <div class="size-control">
                      <button @click="readerStore.setFontSize(Math.max(1, readerStore.fontSize - 1))">−</button>
                      <div class="size-dots"><span v-for="i in 5" :key="i" class="dot" :class="{ active: i <= readerStore.fontSize }"></span></div>
                      <button @click="readerStore.setFontSize(Math.min(5, readerStore.fontSize + 1))">+</button>
                    </div>
                  </div>
                  <div class="setting-group">
                    <label class="group-label">字体粗细 <span class="group-value">{{ readerStore.fontWeight }}</span></label>
                    <div class="size-control">
                      <button @click="readerStore.setFontWeight(Math.max(1, readerStore.fontWeight - 1))">−</button>
                      <div class="size-dots"><span v-for="i in 5" :key="i" class="dot" :class="{ active: i <= readerStore.fontWeight }"></span></div>
                      <button @click="readerStore.setFontWeight(Math.min(5, readerStore.fontWeight + 1))">+</button>
                    </div>
                  </div>
                  <div class="setting-group">
                    <label class="group-label">行间距 <span class="group-value">{{ readerStore.lineHeight }}</span></label>
                    <div class="size-control">
                      <button @click="readerStore.setLineHeight(Math.max(1, readerStore.lineHeight - 1))">−</button>
                      <div class="size-dots"><span v-for="i in 5" :key="i" class="dot" :class="{ active: i <= readerStore.lineHeight }"></span></div>
                      <button @click="readerStore.setLineHeight(Math.min(5, readerStore.lineHeight + 1))">+</button>
                    </div>
                  </div>
                </div>
                <div class="panel-card">
                  <div class="card-label">排版</div>
                  <div class="setting-group">
                    <label class="group-label">阅读方式</label>
                    <div class="mode-switch">
                      <button class="mode-btn" :class="{ active: readerStore.readerMode === 'scroll' }" @click="readerStore.setReaderMode('scroll')">滚动</button>
                      <button class="mode-btn" :class="{ active: readerStore.readerMode === 'page' }" @click="readerStore.setReaderMode('page')" v-if="pageModeAvailable">翻页</button>
                    </div>
                  </div>
                  <div class="setting-group">
                    <label class="group-label">字体风格</label>
                    <div class="font-family-grid">
                      <button v-for="f in fonts" :key="f.v" class="font-btn" :class="{ active: readerStore.fontFamily === f.v }" @click="readerStore.setFontFamily(f.v)" :style="{ fontFamily: f.css }">{{ f.l }}</button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="panel-card">
                <div class="card-label">外观</div>
                <div class="setting-group">
                  <label class="group-label">阅读主题</label>
                  <div class="theme-grid">
                    <button v-for="t in themes" :key="t.v" class="theme-btn" :class="{ active: readerStore.theme === t.v }" @click="readerStore.setTheme(t.v)">{{ t.l }}</button>
                  </div>
                </div>
              </div>
              <div class="panel-card card-danger">
                <div class="card-label">数据</div>
                <div class="setting-group data-management">
                  <button class="danger-btn" @click="handleClearAllData">清除所有数据</button>
                </div>
              </div>
            </div>

            <!-- 划线笔记 -->
            <div v-if="rightPanel === 'annotations'" class="annotations-panel">
              <div v-if="allHighlights.length" class="annotations-filter">
                <select v-model="annotationFilterChapter" class="annotation-filter-select">
                  <option value="">全部章节 ({{ allHighlights.length }})</option>
                  <option v-for="ch in annotationChapters" :key="ch.id" :value="ch.id">{{ ch.title }} ({{ ch.count }})</option>
                </select>
              </div>
              <div v-if="filteredHighlights.length" class="annotations-list">
                <div v-for="hl in filteredHighlights" :key="hl.id" class="annotation-item">
                  <div class="annotation-hd">
                    <span class="annotation-color" :style="{ background: hl.highlightColor }"></span>
                    <span class="annotation-chapter">{{ getChapterTitle(hl.chapterId) || '未知章节' }}</span>
                    <button class="annotation-del" @click="deleteHighlight(hl.id)">
                      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                  <div class="annotation-text">{{ hl.selectedText }}</div>
                  <div v-if="hl.note" class="annotation-note">{{ hl.note }}</div>
                </div>
              </div>
              <div v-else-if="allHighlights.length && !filteredHighlights.length" class="empty-placeholder">
                <p>当前章节无笔记</p>
              </div>
              <div v-else class="empty-placeholder">
                <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                <p>暂无划线笔记</p>
                <p class="empty-hint">选中正文内容即可添加划线</p>
              </div>
            </div>

            <!-- 书签 -->
            <div v-if="rightPanel === 'bookmarks'" class="bookmarks-panel">
              <div class="bookmarks-actions">
                <button class="bm-add-btn" @click="addBookmark">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  添加书签
                </button>
              </div>
              <div v-if="bookmarks.length" class="bookmarks-list">
                <div v-for="bm in bookmarks" :key="bm.id" class="bookmark-item" @click="goToBookmark(bm)">
                  <div class="bookmark-icon">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <div class="bookmark-info">
                    <div class="bookmark-title">{{ bm.title }}</div>
                  </div>
                  <button class="bookmark-del" @click.stop="deleteBookmark(bm.id)">
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>
              <div v-else class="empty-placeholder">
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                <p>暂无书签</p>
                <p class="empty-hint">点击上方按钮添加书签</p>
              </div>
            </div>
          </div>
        </div>
      </transition>

    <!-- 全屏导航 - 鼠标靠近底部时显示 -->
    <div v-if="isFullscreen && bookFormat !== 'pdf'" class="fullnav" :class="{ visible: showFullNav }">
      <button class="nav-btn" @click="prevChapter" :disabled="currentChapter <= 0" title="上一章" aria-label="上一章">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="11 17 6 12 11 7"></polyline>
          <polyline points="18 17 13 12 18 7"></polyline>
        </svg>
      </button>

      <div class="full-chapter-wrapper">
        <div class="chapter-indicator full-screen" v-if="!isJumping" @click="startJump">
          {{ currentChapter + 1 }} / {{ book?.content?.length || 0 }}
        </div>
        <div v-else class="chapter-jump-input-wrapper full-screen">
          <input
            type="number"
            v-model.number="jumpInput"
            @keyup.enter="confirmJump"
            @blur="confirmJump"
            class="chapter-input full-screen"
            min="1"
            :max="book?.content?.length || 1"
          />
        </div>
      </div>

      <button class="nav-btn" @click="nextChapter" :disabled="currentChapter >= (book?.content?.length || 1) - 1" title="下一章" aria-label="下一章">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="13 17 18 12 13 7"></polyline>
          <polyline points="6 17 11 12 6 7"></polyline>
        </svg>
      </button>
    </div>

    <div v-if="isFullscreen && showFullToc && book" class="full-toc-overlay" @click="showFullToc = false">
      <div class="full-toc" @click.stop>
        <div class="full-toc-hd"><span>目录</span><button @click="showFullToc = false">关闭</button></div>
        <div class="full-toc-bd" :style="{ ...getFontWeightStyle(readerStore.fontWeight), fontFamily: fonts[readerStore.fontFamily]?.css || fonts[0].css }">
          <div v-for="(ch, idx) in book.content" :key="ch.id || idx" class="full-toc-item" :class="{ active: currentChapter === idx }" @click="currentChapter = idx; showFullToc = false">
            <svg class="toc-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="7" x2="18" y2="7"></line>
              <line x1="7" y1="14" x2="18" y2="14"></line>
              <line x1="7" y1="20" x2="12" y2="20"></line>
            </svg>{{ ch.title || `第 ${idx + 1} 章` }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { StorageService } from '@/services/StorageService'
import { useReaderStore } from '@/stores/reader'
import PdfReader from '@/components/PdfReader.vue'
import type { NoteRecord, BookmarkRecord, ParsedBook } from '@/types'
import {
  getFileIdFromPdf,
  loadAnnotations,
  addAnnotation,
  deleteAnnotation,
  clearAnnotations,
  type PdfAnnotation
} from '@/utils/annotationStorage'

const route = useRoute()
const router = useRouter()
const readerStore = useReaderStore()

const goToLibrary = () => {
  router.push('/library')
}

const bookId = computed(() => route.params.id as string)

const book = ref<ParsedBook | null>(null)
const rawFile = ref<ArrayBuffer | null>(null)
const bookFormat = ref('')
const currentChapter = ref(0)
const isFullscreen = ref(false)
const pageModeAvailable = computed(() => bookFormat.value && bookFormat.value !== 'pdf')
const pdfScale = ref(2.0)
let zoomRafId = 0

function onZoomInput(e: Event) {
  const val = Math.max(0.5, Math.min(2.7, +(e.target as HTMLInputElement).value))
  pdfScale.value = val
  // 直接调用 PdfReader 的 resizeCanvases，绕过 Vue 异步调度
  if (zoomRafId) cancelAnimationFrame(zoomRafId)
  zoomRafId = requestAnimationFrame(() => {
    pdfReaderRef.value?.resizeCanvases(val)
  })
}

// 实时时钟
const currentTime = ref('')
let timeTimer: number | undefined
function startClock() {
  const pad = (n: number) => String(n).padStart(2, '0')
  function update() {
    const d = new Date()
    currentTime.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
  update()
  timeTimer = window.setInterval(update, 1000)
}

// 阅读时长追踪（秒）
let readingTimeTimer: number | undefined
const sessionReadingTime = ref(0)
let lastSavedTime = 0 // 已保存的时长
async function startReadingTimeTracker() {
  if (readingTimeTimer) clearInterval(readingTimeTimer)
  sessionReadingTime.value = 0
  lastSavedTime = 0
  readingTimeTimer = window.setInterval(async () => {
    sessionReadingTime.value++
    // 每 30 秒保存一次进度
    if (sessionReadingTime.value % 30 === 0 && bookId.value) {
      await saveReadingTime()
    }
  }, 1000)
}
async function saveReadingTime() {
  if (!bookId.value || !book.value || sessionReadingTime.value <= lastSavedTime) return
  const timeToSave = sessionReadingTime.value - lastSavedTime
  const currentProgress = await StorageService.getProgress(bookId.value)
  const totalReadingTime = (currentProgress?.readingTime || 0) + timeToSave
  await StorageService.saveProgress({
    bookId: bookId.value,
    chapterId: currentProgress?.chapterId || book.value.content?.[currentChapter.value]?.id || String(currentChapter.value),
    position: currentProgress?.position ?? 0,
    percentage: currentProgress?.percentage ?? 0,
    updatedAt: Date.now(),
    readingTime: totalReadingTime,
  })
  lastSavedTime = sessionReadingTime.value
}
async function stopReadingTimeTracker() {
  if (readingTimeTimer) {
    clearInterval(readingTimeTimer)
    readingTimeTimer = undefined
  }
  // 离开时保存最终时长
  if (sessionReadingTime.value > 0 && sessionReadingTime.value > lastSavedTime && bookId.value) {
    await saveReadingTime()
  }
  sessionReadingTime.value = 0
}

// 阅读字数统计
const totalWords = computed(() => {
  if (!book.value?.content?.length) return 0
  let count = 0
  for (const ch of book.value.content) {
    const text = (ch.content || '').replace(/<[^>]*>/g, '')
    count += text.length
  }
  return count
})

const wordsRead = computed(() => {
  if (!book.value?.content?.length) return 0
  let count = 0
  for (let i = 0; i < currentChapter.value; i++) {
    const text = (book.value.content[i]?.content || '').replace(/<[^>]*>/g, '')
    count += text.length
  }
  // 当前章节按一半估算（因为没有精确的 scroll 百分比跟踪）
  if (book.value.content[currentChapter.value]) {
    const text = (book.value.content[currentChapter.value]?.content || '').replace(/<[^>]*>/g, '')
    count += Math.round(text.length * 0.5)
  }
  return count
})

// PDF 标注相关
const annotationMode = ref(false)
const eraserMode = ref('') // '' | 'lasso' | 'line'
const highlighterMode = ref(false) // 荧光笔模式
const pdfAnnotations = ref<PdfAnnotation[]>([])
const penColors = ['#ff0000', '#00aa00', '#0066ff', '#ffaa00', '#9933ff', '#000000']
const highlighterColors = ['#ffff00', '#00ff00', '#ff69b4', '#87ceeb'] // 荧光笔颜色
const penColor = ref(penColors[0])
const penWidth = ref(2.0)
const highlighterWidth = ref(20) // 荧光笔宽度
const currentFileId = ref('')

function adjustZoom(delta: number) {
  const val = Math.max(0.5, Math.min(2.7, +(pdfScale.value + delta).toFixed(2)))
  pdfScale.value = val
}
const pdfReaderRef = ref<InstanceType<typeof PdfReader> | null>(null)
const mainRef = ref<HTMLElement | null>(null)
const bodyRef = ref<HTMLElement | null>(null)

const showTocPanel = ref(false)
const sidebarWidth = ref(200)
const uiHidden = ref(false)  // 全屏沉浸模式：隐藏所有 UI

// 翻页模式
const pageNum = ref(1)
const totalPageNum = ref(1)
const pages = ref<Array<{ left: Array<{ html: string, idx: number }>, right: Array<{ html: string, idx: number }> }>>([])
// 句子索引 -> 所在页码（1-based）。recalcPages 时同步生成，供 TTS/跳转 O(1) 查页
const sentenceToPage = new Map<number, number>()
// recalcPages 的版本号，防止异步重试与新一轮重算冲突
let recalcVersion = 0
let recalcRetries = 0

const currentPageData = computed(() => {
  if (pages.value.length === 0) return null
  return pages.value[Math.min(pageNum.value, pages.value.length) - 1]
})

// 记录某段索引所在页（一个段可能跨多页，记录其出现的所有页）
function indexPage(idx: number, pageNo: number) {
  // 只记录该 idx 第一次出现的页（首段从上一页延续时，归到起始页）
  if (!sentenceToPage.has(idx)) sentenceToPage.set(idx, pageNo)
}

function recalcPages() {
  const vp = document.querySelector('.page-viewport') as HTMLElement
  if (!vp) {
    // viewport 尚未挂载（模式切换/全屏切换瞬间），延迟重试一次，最多重试 5 次防止栈溢出
    if (recalcRetries < 5) {
      recalcRetries++
      const v = ++recalcVersion
      nextTick(() => { if (v === recalcVersion) recalcPages() })
    }
    return
  }
  recalcRetries = 0

  const cs = window.getComputedStyle(vp)
  // 列宽按真实列容器计算，与渲染一致（P5：测量一致性）
  const leftCol = vp.querySelector('.page-col-left') as HTMLElement
  const realColWidth = leftCol?.clientWidth || (vp.clientWidth - 168) / 2
  const pageHeight = vp.clientHeight - 104
  if (pageHeight <= 0 || realColWidth <= 0) return

  const margin = parseFloat(cs.fontSize) * 0.8

  const measurer = document.createElement('div')
  measurer.style.cssText = `position:absolute;visibility:hidden;width:${realColWidth}px;font-family:${cs.fontFamily};font-size:${cs.fontSize};line-height:${cs.lineHeight};padding:0;`
  document.body.appendChild(measurer)
  const p = document.createElement('p')
  p.style.margin = '0 0 0.8em 0'
  measurer.appendChild(p)

  function splitOversized(html: string): string[] {
    if (!html) return ['']
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    const fullText = tmp.textContent || ''
    if (!fullText) return [html]
    const chunks: string[] = []
    let remainingHtml = html
    let remainingText = fullText
    while (remainingText.length > 0) {
      let lo = 1, hi = remainingText.length
      p.textContent = remainingText
      if (p.offsetHeight <= pageHeight) {
        chunks.push(remainingHtml)
        break
      }
      while (lo < hi) {
        const mid = (lo + hi + 1) >>> 1
        p.textContent = remainingText.substring(0, mid)
        if (p.offsetHeight <= pageHeight) lo = mid
        else hi = mid - 1
      }
      const cut = Math.max(
        remainingText.lastIndexOf('\n', lo),
        remainingText.lastIndexOf('。', lo),
        remainingText.lastIndexOf('！', lo),
        remainingText.lastIndexOf('？', lo),
        remainingText.lastIndexOf('.', lo),
        remainingText.lastIndexOf(' ', lo)
      )
      const splitAt = cut > lo * 0.4 ? cut + 1 : lo
      let htmlChars = 0, textChars = 0, inTag = false
      for (let i = 0; i < remainingHtml.length && textChars < splitAt; i++) {
        const c = remainingHtml[i]
        htmlChars++
        if (c === '<') inTag = true
        else if (c === '>') inTag = false
        else if (!inTag) textChars++
      }
      const safeEnd = remainingHtml.lastIndexOf('>', htmlChars)
      const finalCut = safeEnd > htmlChars * 0.6 ? safeEnd + 1 : htmlChars
      chunks.push(remainingHtml.substring(0, finalCut))
      remainingHtml = remainingHtml.substring(finalCut)
      const nextTmp = document.createElement('div')
      nextTmp.innerHTML = remainingHtml
      remainingText = nextTmp.textContent || ''
    }
    return chunks
  }

  const flattedParagraphs: Array<{ html: string, idx: number }> = []
  const flattedHeights: number[] = []

  highlightedSentences.value.forEach((para, idx) => {
    p.innerHTML = para
    const h = p.offsetHeight
    if (h <= pageHeight) {
      flattedParagraphs.push({ html: para, idx })
      flattedHeights.push(h)
    } else {
      const chunks = splitOversized(para)
      for (const chunk of chunks) {
        p.textContent = chunk
        flattedParagraphs.push({ html: chunk, idx })
        flattedHeights.push(p.offsetHeight)
      }
    }
  })

  document.body.removeChild(measurer)

  const newPages: Array<{ left: Array<{ html: string, idx: number }>, right: Array<{ html: string, idx: number }> }> = []
  sentenceToPage.clear()
  let i = 0

  while (i < flattedParagraphs.length) {
    const pageNo = newPages.length + 1
    let leftH = 0
    const left: Array<{ html: string, idx: number }> = []
    while (i < flattedParagraphs.length) {
      const h = flattedHeights[i] + margin
      if (left.length > 0 && leftH + h > pageHeight) break
      left.push(flattedParagraphs[i])
      indexPage(flattedParagraphs[i].idx, pageNo)
      leftH += h
      i++
    }

    let rightH = 0
    const right: Array<{ html: string, idx: number }> = []
    while (i < flattedParagraphs.length) {
      const h = flattedHeights[i] + margin
      if (right.length > 0 && rightH + h > pageHeight) break
      right.push(flattedParagraphs[i])
      indexPage(flattedParagraphs[i].idx, pageNo)
      rightH += h
      i++
    }

    newPages.push({ left, right })
  }

  pages.value = newPages
  totalPageNum.value = newPages.length
  if (pageNum.value > newPages.length) pageNum.value = Math.max(1, newPages.length)
}

function pagePrev() {
  if (pageNum.value > 1) {
    pageNum.value--
  } else if (currentChapter.value > 0) {
    // 跳到上一章的最后一页
    currentChapter.value--
    // 章节渲染完成后重算分页，再定位到尾页；用 version 守卫防止中途被打断
    const v = ++recalcVersion
    nextTick(() => {
      if (v !== recalcVersion) return
      recalcPages()
      pageNum.value = totalPageNum.value
    })
  }
}

function pageNext() {
  if (pageNum.value < totalPageNum.value) {
    pageNum.value++
  } else if (book.value && currentChapter.value < book.value.content.length - 1) {
    // 跳到下一章的第一页
    currentChapter.value++
    pageNum.value = 1
    scrollToChapterStart()
    const v = ++recalcVersion
    nextTick(() => { if (v === recalcVersion) recalcPages() })
  }
}

function prevChapter() {
  if (currentChapter.value > 0) {
    currentChapter.value--
    pageNum.value = 1
    scrollToChapterStart()
    const v = ++recalcVersion
    nextTick(() => { if (v === recalcVersion) recalcPages() })
  }
}

function nextChapter() {
  if (book.value && currentChapter.value < book.value.content.length - 1) {
    currentChapter.value++
    pageNum.value = 1
    scrollToChapterStart()
    const v = ++recalcVersion
    nextTick(() => { if (v === recalcVersion) recalcPages() })
  }
}

function handlePageKeydown(e: KeyboardEvent) {
  if (readerStore.readerMode !== 'page' || !pageModeAvailable.value) return
  if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
  // 朗读中禁用键盘翻页，避免与 TTS 自动翻页冲突
  if (isReadAloudPlaying.value) return
  if (e.key === 'ArrowLeft') { e.preventDefault(); pagePrev() }
  else if (e.key === 'ArrowRight') { e.preventDefault(); pageNext() }
}
const minW = 120
const maxW = 400

const rightPanel = ref('')
const shelfList = ref<Array<{ id: string; title: string; cover: ArrayBuffer | null; format: string; author: string; progress?: { percentage: number; updatedAt: number; readingTime?: number } }>>([])
const showFullToc = ref(false)
const showFullNav = ref(false) // 全屏导航显示状态
let fullNavTimer: ReturnType<typeof setTimeout> | null = null
const jumpInput = ref(1)
const isJumping = ref(false)
const jumpInputRef1 = ref<HTMLInputElement | null>(null) // 底部功能栏
const jumpInputRef2 = ref<HTMLInputElement | null>(null) // 右侧章节导航

// 划线笔记
const highlights = ref<NoteRecord[]>([])
const showHlToolbar = ref(false)
const hlToolbarPos = ref({ x: 0, y: 0 })
const hlSelectedText = ref('')
const hlColors = ['#ffeb3b', '#4caf50', '#42a5f5', '#ef5350', '#ab47bc']
const hlSelectedColor = ref(hlColors[0])
const hlNoteInput = ref('')
const hlShowNoteInput = ref(false)

// 书签
const bookmarks = ref<BookmarkRecord[]>([])

// 朗读功能
const isReadAloudPlaying = ref(false)
const speechRate = ref(1)
const selectedVoiceName = ref('')
const currentSentenceIndex = ref(0)
let isAutoAdvancingChapter = false // 朗读自动跳章标记

// TTS 是否处于活跃状态（播放中或暂停中）
const isTtsActive = computed(() => ttsState === 'playing' || ttsState === 'paused')

// TTS 代理服务器配置（用于非 Edge 浏览器）
const isProxyAvailable = ref<boolean | null>(null)
const themes = [
  { l: '白天', v: 'light' as const },
  { l: '星空', v: 'dark' as const },
  { l: '护眼', v: 'green' as const },
  { l: '羊皮卷', v: 'parchment' as const },
]
const fonts = [
  { l: '默认', v: 0, css: 'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif' },
  { l: '宋体', v: 1, css: '"Songti SC", "SimSun", "STSong", Georgia, serif' },
  { l: '楷体', v: 2, css: '"Kaiti SC", "STKaiti", "KaiTi", "AR PL UKai CN", serif' },
  { l: '黑体', v: 3, css: '"HeiTi SC", "SimHei", sans-serif' },
  { l: '等宽', v: 4, css: 'Menlo, Monaco, Consolas, "Courier New", monospace' },
  { l: '仿宋', v: 5, css: '"FangSong", "STFangsong", "AR PL FangSong", serif' },
  { l: '魏碑', v: 6, css: '"STWeiti", "WeiBei", "AR PL UKai CN", serif' },
  { l: '行楷', v: 7, css: '"STXingkai", "XingKai", "AR PL UKai CN", serif' },
  { l: '隶书', v: 8, css: '"SimLi", "LiSu", "STLiti", serif' },
  { l: '幼圆', v: 9, css: '"STYouyuan", "YouYuan", serif' },
  { l: '琥珀', v: 10, css: '"STHupo", "HuPo", serif' },
  { l: '新宋', v: 11, css: '"NSongTi", "Songti SC", "SimSun", serif' },
]

const themeClass = computed(() => `theme-${readerStore.theme}`)
const currentContent = computed(() => (book.value?.content?.[currentChapter.value]?.content || ''))

// 将内容按段落分割
const sentences = computed(() => {
  const content = currentContent.value
  if (!content) return []

  // 按块级 HTML 标签（<p><div><h1-6><blockquote> 等）分割
  // 保留完整标签结构，不再按标点拆分（避免破坏 HTML 标签内的代码）
  // 这能让 EPUB 中的内部链接 <a>、图片等元素被完整保留
  const blockRegex = /<(p|div|h[1-6]|blockquote|li|section|article)\b[^>]*>[\s\S]*?<\/(?:p|div|h[1-6]|blockquote|li|section|article)>/gi
  const matches = content.match(blockRegex)
  if (matches && matches.length > 0) {
    return matches
  }

  // 如果没有块级标签，按 <br> 或换行分割
  return content.split(/\n\s*\n|<br\s*\/?>/gi).filter(s => s.trim().length > 0)
})

const sentenceRefs = ref<HTMLElement[]>([])
function setSentenceRef(el: HTMLElement | Element | null, idx: number) {
  if (el && el instanceof HTMLElement) {
    sentenceRefs.value[idx] = el
  }
}

function getFontWeightStyle(fw: number) {
  // 5 档字体粗细：font-weight 真实递进 + -webkit-text-stroke 辅助加粗
  // 避免使用 text-shadow 堆叠，消除边缘重影和模糊
  const map: Record<number, { fontWeight: number; textShadow: string; webkitTextStroke: string; fontSynthesis: string }> = {
    1: { fontWeight: 400, textShadow: 'none', webkitTextStroke: '0px', fontSynthesis: 'none' },
    2: { fontWeight: 500, textShadow: 'none', webkitTextStroke: '0.2px', fontSynthesis: 'none' },
    3: { fontWeight: 600, textShadow: 'none', webkitTextStroke: '0.3px', fontSynthesis: 'none' },
    4: { fontWeight: 700, textShadow: 'none', webkitTextStroke: '0.5px', fontSynthesis: 'none' },
    5: { fontWeight: 800, textShadow: 'none', webkitTextStroke: '0.7px', fontSynthesis: 'none' },
  }
  return map[fw] || map[3]
}

const contentStyle = computed(() => ({
  fontSize: `${14 + readerStore.fontSize * 2}px`,
  fontFamily: fonts[readerStore.fontFamily]?.css || fonts[0].css,
  lineHeight: readerStore.getLineHeight(),
  ...getFontWeightStyle(readerStore.fontWeight),
}))

async function loadBook(id: string) {
  book.value = null
  currentChapter.value = 0
  
  const rec = await StorageService.getBook(id)
  if (rec) { bookFormat.value = rec.format; rawFile.value = rec.rawFile }
  const loaded = await StorageService.getParsedBook(id)
  if (loaded) book.value = loaded
  
  // 加载上次阅读进度 - 从 chapterId 转换为 chapterIndex
  const progress = await StorageService.getProgress(id)
  if (progress && progress.chapterId && book.value?.content) {
    const idx = book.value.content.findIndex(ch => ch.id === progress.chapterId)
    if (idx >= 0) {
      currentChapter.value = idx
    }
  }
  
  // 加载 PDF 标注
  if (rec?.rawFile) {
    currentFileId.value = getFileIdFromPdf(rec.rawFile)
    pdfAnnotations.value = loadAnnotations(currentFileId.value)
  }
  
  await loadHighlights()
  await loadBookmarks()
}

// 监听路由参数变化，支持在书架中切换书籍
watch(bookId, (newId) => { if (newId) loadBook(newId) })

let resizing = false
function startResize() {
  if (!showTocPanel.value) return
  resizing = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  function move(ev: MouseEvent) {
    if (!resizing) return
    const w = ev.clientX
    if (w >= minW && w <= maxW) sidebarWidth.value = w
  }
  function up() {
    if (!resizing) return
    resizing = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    try { localStorage.setItem('reader-sidebar-width', String(sidebarWidth.value)) } catch {}
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
}

function scrollToChapterStart() {
  if (mainRef.value) mainRef.value.scrollTop = 0
}

async function loadShelf() {
  try {
    const all = await StorageService.getAllBooks()
    const items = await Promise.all(all.map(async b => {
      const progress = await StorageService.getProgress(b.id)
      return {
        id: b.id, title: b.title, cover: b.cover,
        format: b.format, author: b.author || '',
        progress: progress ? { percentage: progress.percentage, updatedAt: progress.updatedAt, readingTime: progress.readingTime } : undefined
      }
    }))
    // 按最近阅读时间排序，未读的排后面
    shelfList.value = items.sort((a, b) => (b.progress?.updatedAt || 0) - (a.progress?.updatedAt || 0))
  } catch {
    shelfList.value = []
  }
}
async function openBook(id: string) {
  if (id === bookId.value) return
  rightPanel.value = ''
  await loadBook(id)
  router.push(`/book/${id}`)
}
function toggleRight(p: 'shelf' | 'settings' | 'readAloud' | 'annotations' | 'bookmarks') {
  rightPanel.value = rightPanel.value === p ? '' : p
}

// 点击主阅读区：切换 UI 显示/隐藏
function handleMainClick(e: Event) {
  // 点击交互元素时不触发
  const target = e.target as HTMLElement
  if (target.closest('a, button, input, select, textarea, .hl-toolbar, .nav-circle, .bottom-bar, .reader-sidebar, .right-panel, .annotation-action-btn')) return
  
  if (rightPanel.value) {
    rightPanel.value = ''
  } else {
    uiHidden.value = !uiHidden.value
  }
}

// 划线笔记
async function loadHighlights() {
  if (!bookId.value || !book.value) return
  const allNotes = await StorageService.getNotes(bookId.value)
  const chId = book.value.content?.[currentChapter.value]?.id
  highlights.value = allNotes.filter(n => n.chapterId === chId)
}

function handleTextSelection() {
  const sel = window.getSelection()
  if (!sel || !sel.toString().trim() || sel.isCollapsed) {
    showHlToolbar.value = false
    return
  }
  const text = sel.toString().trim()
  if (text.length > 500) return

  const range = sel.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  const bodyRect = bodyRef.value?.getBoundingClientRect()
  if (!bodyRect) return

  hlToolbarPos.value = {
    x: rect.left - bodyRect.left + rect.width / 2,
    y: rect.top - bodyRect.top - 8,
  }
  hlSelectedText.value = text
  // 保留用户上次选择的颜色，不重置为默认黄色
  hlNoteInput.value = ''
  hlShowNoteInput.value = false
  showHlToolbar.value = true
}


async function saveHighlight() {
  if (!hlSelectedText.value || !bookId.value || !book.value) return
  const chapter = book.value.content?.[currentChapter.value]
  if (!chapter) return

  const note = await StorageService.addNote({
    bookId: bookId.value,
    chapterId: chapter.id || '',
    position: currentChapter.value,
    selectedText: hlSelectedText.value,
    note: hlNoteInput.value,
    highlightColor: hlSelectedColor.value,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })

  highlights.value.push(note)
  showHlToolbar.value = false
  window.getSelection()?.removeAllRanges()
  if (readerStore.readerMode === 'page') { const v = ++recalcVersion; nextTick(() => { if (v === recalcVersion) recalcPages() }) }
}

async function deleteHighlight(id: string) {
  await StorageService.deleteNote(id)
  highlights.value = highlights.value.filter(h => h.id !== id)
  if (readerStore.readerMode === 'page') { const v = ++recalcVersion; nextTick(() => { if (v === recalcVersion) recalcPages() }) }
}

function getChapterTitle(chapterId: string) {
  return book.value?.content?.find(c => c.id === chapterId)?.title || ''
}

// 书签
async function loadBookmarks() {
  if (!bookId.value) return
  bookmarks.value = await StorageService.getBookmarks(bookId.value)
}

async function addBookmark() {
  if (!bookId.value || !book.value) return
  const chapter = book.value.content?.[currentChapter.value]
  if (!chapter) return
  const exists = bookmarks.value.some(b => b.chapterId === (chapter.id || '') && b.position === currentChapter.value)
  if (exists) return
  const bm = await StorageService.addBookmark({
    bookId: bookId.value,
    chapterId: chapter.id || '',
    position: currentChapter.value,
    title: chapter.title || `第 ${currentChapter.value + 1} 章`,
    createdAt: Date.now(),
  })
  bookmarks.value.push(bm)
}

async function deleteBookmark(id: string) {
  await StorageService.deleteBookmark(id)
  bookmarks.value = bookmarks.value.filter(b => b.id !== id)
}

function goToBookmark(bm: BookmarkRecord) {
  const idx = book.value?.content?.findIndex(c => c.id === bm.chapterId) ?? -1
  if (idx >= 0) {
    currentChapter.value = idx
    scrollToChapterStart()
  }
}

// 高亮渲染：在段落文本中搜索并包裹高亮标记
const highlightedSentences = computed(() => {
  const hls = highlights.value
  if (!hls.length) return sentences.value
  return sentences.value.map(html => {
    let result = html
    for (const hl of hls) {
      const escaped = hl.selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      result = result.replace(
        new RegExp(escaped, 'g'),
        m => `<mark class="hl" style="--hl-color:${hl.highlightColor}; background-color: ${hl.highlightColor}">${m}</mark>`
      )
    }
    return result
  })
})

const allHighlights = computed(() => highlights.value)

// 笔记章节筛选
const annotationFilterChapter = ref('')
const annotationChapters = computed(() => {
  const map = new Map<string, { id: string; title: string; count: number }>()
  for (const hl of allHighlights.value) {
    const existing = map.get(hl.chapterId)
    if (existing) { existing.count++ } else {
      map.set(hl.chapterId, { id: hl.chapterId, title: getChapterTitle(hl.chapterId) || '未知章节', count: 1 })
    }
  }
  return Array.from(map.values())
})
const filteredHighlights = computed(() => {
  if (!annotationFilterChapter.value) return allHighlights.value
  return allHighlights.value.filter(h => h.chapterId === annotationFilterChapter.value)
})

// =============================================================================
// =============================================================================
// 朗读功能 — Edge TTS（通过本地代理服务器）
// =============================================================================
// 设计原则：
//   1. 通过本地代理服务器 (localhost:3004) 调用 Edge TTS
//   2. Vite 启动时自动启动代理服务器
//   3. 移动端使用 Web Speech API

// ---- Platform detection ----
// 移动端（Android / iOS / Capacitor）使用 Web Speech API
const isMobilePlatform = computed(() => {
  if (typeof navigator === 'undefined') return true
  const ua = navigator.userAgent.toLowerCase()
  return /android|iphone|ipad|ipod/.test(ua) || /capacitor/.test(ua)
})
const ttsEngine = computed(() => isMobilePlatform.value ? 'speech' : 'edge')

// ---- Web Speech API (Mobile) 状态 ----

// ---- 状态 ----
const isSpeechError = ref(false)
const voiceCache = ref<Array<{ id: string; name: string; gender: string; style: string }>>([])
const isVoicesLoaded = ref(false)
let ttsAbort: AbortController | null = null

// ---- Edge TTS 配置 ----
const TTS_PROXY_URL = 'http://localhost:3004/api/tts'
let proxyCheckTimer: number | null = null

// ---- Edge TTS 缓冲池参数 ----
const TTS_FETCH_TIMEOUT = 15000      // 单句合成 fetch 超时 15s（首次冷启动可能较慢）
const TTS_PREFETCH_AHEAD = 3         // 向前预取的句数（滑动窗口大小）
const TTS_RETRY_BEFORE_SKIP = 1      // 单句合成失败重试次数，仍失败则跳到下一句
// 已合成音频缓存：index -> { blob, url }
// 用滑动窗口预取多句，保证播放当前句时后面几句已就绪，避免卡顿
const audioCache = new Map<number, { blob: Blob; url: string }>()
// 正在合成中的句子 index（避免对同一句重复发起请求）
const pendingSet = new Set<number>()

// Edge 增强音色（仅代理可用时展示）
const EDGE_VOICES = [
  { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓', gender: '女', style: '温暖' },
  { id: 'zh-CN-XiaoyiNeural', name: '晓依', gender: '女', style: '活泼' },
  { id: 'zh-CN-YunjianNeural', name: '云健', gender: '男', style: '激情' },
  { id: 'zh-CN-YunxiNeural', name: '云希', gender: '男', style: '阳光' },
  { id: 'zh-CN-YunxiaNeural', name: '云夏', gender: '男', style: '可爱' },
  { id: 'zh-CN-YunyangNeural', name: '云扬', gender: '男', style: '专业' },
]

// ---- Toast 提示 ----
let ttsToastTimer: number | null = null
function showTtsToast(msg: string, duration = 3000) {
  const existing = document.getElementById('tts-toast')
  if (existing) existing.remove()
  if (ttsToastTimer) { clearTimeout(ttsToastTimer); ttsToastTimer = null }
  const el = document.createElement('div')
  el.id = 'tts-toast'
  el.textContent = msg
  Object.assign(el.style, {
    position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
    padding: '8px 20px', borderRadius: '20px', fontSize: '13px', color: '#fff',
    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: '9999',
    transition: 'opacity 0.3s', opacity: '1', pointerEvents: 'none'
  })
  document.body.appendChild(el)
  ttsToastTimer = window.setTimeout(() => {
    el.style.opacity = '0'
    setTimeout(() => el.remove(), 300)
  }, duration)
}

// ---- 健康检查（仅用于本地代理回退检测） ----
async function quickHealthCheck(): Promise<boolean> {
  try {
    const healthUrl = TTS_PROXY_URL.replace('/api/tts', '/api/health')
    const resp = await fetch(healthUrl, { signal: AbortSignal.timeout(2000) })
    return resp.ok
  } catch { return false }
}

function startProxyHealthCheck() {
  stopProxyHealthCheck()
  // 启动时立即检测一次
  quickHealthCheck().then(available => {
    isProxyAvailable.value = available
  })
  
  proxyCheckTimer = window.setInterval(async () => {
    const available = await quickHealthCheck()
    if (isProxyAvailable.value !== available) {
      isProxyAvailable.value = available
      if (available) {
        showTtsToast('TTS 代理已就绪', 2000)
      } else {
        showTtsToast('TTS 代理不可用', 3000)
      }
    }
  }, 30000)
}

function stopProxyHealthCheck() {
  if (proxyCheckTimer !== null) {
    clearInterval(proxyCheckTimer)
    proxyCheckTimer = null
  }
}

// ---- 音色加载 ----
async function loadAllVoices() {
  if (ttsEngine.value === 'speech') {
    await loadSpeechVoices()
  } else {
    // 桌面端：始终展示 Edge 音色
    const voices = EDGE_VOICES.map(v => ({ ...v, id: 'edge:' + v.id }))
    voiceCache.value = voices

    // 恢复偏好或选默认
    const saved = localStorage.getItem('reader-voice')
    if (saved && voices.some(v => v.id === saved)) {
      selectedVoiceName.value = saved
    } else {
      selectedVoiceName.value = voices[0]?.id || ''
    }

    isVoicesLoaded.value = true
  }
}

async function loadSpeechVoices() {
  try {
    const allVoices = await new Promise<SpeechSynthesisVoice[]>((resolve) => {
      const v = window.speechSynthesis.getVoices()
      if (v.length > 0) { resolve(v); return }
      window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices())
      setTimeout(() => resolve(window.speechSynthesis.getVoices() || []), 3000)
    })

    // 优先展示中文语音
    const zhVoices = allVoices.filter(v => v.lang.startsWith('zh'))
    const displayVoices = zhVoices.length > 0 ? zhVoices : allVoices

    voiceCache.value = displayVoices.map(v => ({
      id: 'speech:' + v.name,
      name: v.name.replace(/^Google\s*/i, '').replace(/^Microsoft\s*/i, ''),
      gender: '',
      style: v.lang
    }))

    if (voiceCache.value.length === 0) {
      voiceCache.value = [{ id: 'speech:default', name: '默认语音', gender: '', style: '' }]
    }

    const saved = localStorage.getItem('reader-voice')
    if (saved && voiceCache.value.some(v => v.id === saved)) {
      selectedVoiceName.value = saved
    } else {
      selectedVoiceName.value = voiceCache.value[0]?.id || ''
    }
  } catch (e) {
    console.warn('[TTS][Speech] 加载语音失败:', e)
    voiceCache.value = [{ id: 'speech:default', name: '默认语音', gender: '', style: '' }]
  }
  isVoicesLoaded.value = true
}

// ---- 判断当前语音属于哪个引擎 ----
// ---- Edge TTS 引擎 ----
let ttsState: 'idle' | 'playing' | 'paused' = 'idle'
let ttsGeneration = 0  // 每 start/stop 递增，用于打断幽灵链

// ---- Edge TTS 引擎 ----

let currentAudio: HTMLAudioElement | null = null

function releaseCurrentAudio() {
  if (currentAudio) {
    currentAudio.onplay = null
    currentAudio.onended = null
    currentAudio.onerror = null
    currentAudio.pause()
    if (currentAudio.src?.startsWith('blob:')) URL.revokeObjectURL(currentAudio.src)
    currentAudio.src = ''
    currentAudio = null
  }
}
// 清空整个音频缓存（停止/换音色/换语速时调用）
function clearAudioCache() {
  for (const item of audioCache.values()) URL.revokeObjectURL(item.url)
  audioCache.clear()
  pendingSet.clear()
}
// 丢弃已离开播放窗口的旧缓存，控制内存占用
function trimAudioCache(keepFrom: number) {
  for (const idx of Array.from(audioCache.keys())) {
    if (idx < keepFrom) {
      URL.revokeObjectURL(audioCache.get(idx)!.url)
      audioCache.delete(idx)
    }
  }
}

function getRateStr(): string {
  const pct = Math.round((speechRate.value - 1) * 100)
  return (pct >= 0 ? '+' : '') + pct + '%'
}

// ---- Edge TTS 合成（通过本地代理服务器） ----
// 带独立的超时控制（8s），超时即视为失败，避免干等后端 15s
async function synthesizeViaEdge(text: string, voice: string): Promise<Blob> {
  const timeoutCtrl = new AbortController()
  const timer = setTimeout(() => timeoutCtrl.abort(), TTS_FETCH_TIMEOUT)
  // 任一信号触发都终止请求：全局 ttsAbort（停止朗读）或本句超时
  const onGlobalAbort = () => timeoutCtrl.abort()
  ttsAbort?.signal.addEventListener('abort', onGlobalAbort)
  try {
    const resp = await fetch(TTS_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, rate: getRateStr(), volume: '+0%', pitch: '+0Hz' }),
      signal: timeoutCtrl.signal
    })
    if (!resp.ok) {
      const errBody = await resp.text().catch(() => '')
      throw new Error(`TTS 代理返回 ${resp.status}: ${errBody}`)
    }
    const ab = await resp.arrayBuffer()
    return new Blob([ab], { type: 'audio/mpeg' })
  } catch (err: any) {
    // 区分"超时"和"被全局 abort（停止朗读）"
    if (ttsAbort?.signal.aborted) {
      const e = new Error('aborted')
      e.name = 'AbortError'
      throw e
    }
    if (timeoutCtrl.signal.aborted) throw new Error('TTS 合成超时')
    throw err
  } finally {
    clearTimeout(timer)
    ttsAbort?.signal.removeEventListener('abort', onGlobalAbort)
  }
}

// 合成并写入缓存；若已在合成中则不重复发请求，复用进行中的 Promise
async function prefetchEdge(index: number) {
  if (ttsAbort?.signal.aborted) return
  if (index >= sentences.value.length) return
  const text = sentences.value[index].replace(/<[^>]*>/g, ' ').trim()
  if (!text) return
  if (audioCache.has(index) || pendingSet.has(index)) return

  pendingSet.add(index)
  const gen = ttsGeneration
  try {
    const voice = selectedVoiceName.value.replace('edge:', '')
    const blob = await synthesizeViaEdge(text, voice)
    // 期间若已停止或切换，丢弃结果
    if (gen !== ttsGeneration || ttsAbort?.signal.aborted) return
    if (blob && !audioCache.has(index)) {
      audioCache.set(index, { blob, url: URL.createObjectURL(blob) })
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') console.warn(`[Edge] 预取第${index}句失败:`, err.message)
  } finally {
    pendingSet.delete(index)
  }
}

// 维护滑动窗口：保证 [currentIndex, currentIndex + TTS_PREFETCH_AHEAD] 内的句子都在预取
function ensurePrefetchWindow(currentIndex: number) {
  if (ttsAbort?.signal.aborted) return
  for (let i = currentIndex; i <= currentIndex + TTS_PREFETCH_AHEAD; i++) {
    if (i < sentences.value.length && !audioCache.has(i) && !pendingSet.has(i)) {
      prefetchEdge(i)
    }
  }
}

// 单句重试计数（per-index），用于"重试1次后跳过"
const retryMap = new Map<number, number>()

async function playEdgeSentence(index: number) {
  const gen = ttsGeneration
  if (ttsAbort?.signal.aborted) return
  if (index >= sentences.value.length) { tryNextChapter(); return }

  const text = sentences.value[index].replace(/<[^>]*>/g, ' ').trim()
  if (!text) { advanceToNext(index); return }

  releaseCurrentAudio()

  // 优先用缓存命中；否则现场合成
  let url: string
  const cached = audioCache.get(index)
  if (cached) {
    url = cached.url
    audioCache.delete(index) // 用完移出缓存，由后续 onended 释放 URL
  } else {
    try {
      const voice = selectedVoiceName.value.replace('edge:', '')
      const blob = await synthesizeViaEdge(text, voice)
      if (gen !== ttsGeneration) return
      url = URL.createObjectURL(blob)
    } catch (err: any) {
      if (err.name === 'AbortError') return
      if (gen !== ttsGeneration) return
      console.warn(`[TTS] 第${index}句合成失败:`, err.message)
      handleEdgeError(index)
      return
    }
  }

  if (gen !== ttsGeneration) {
    URL.revokeObjectURL(url)
    return
  }

  // 播放当前句的同时，提前预取窗口内后续句子
  ensurePrefetchWindow(index + 1)
  trimAudioCache(index)

  const audio = new Audio(url)
  currentAudio = audio

  audio.onplay = () => {
    if (gen !== ttsGeneration) return
    isReadAloudPlaying.value = true
    ttsState = 'playing'
    currentSentenceIndex.value = index
    scrollToSentence(index)
  }
  audio.onended = () => { URL.revokeObjectURL(url); currentAudio = null; advanceToNext(index) }
  audio.onerror = () => {
    if (gen !== ttsGeneration) return
    URL.revokeObjectURL(url)
    currentAudio = null
    console.warn(`[TTS] 第${index}句音频播放失败`)
    handleEdgeError(index)
  }

  audio.play().catch(() => {
    if (gen !== ttsGeneration) return
    URL.revokeObjectURL(url)
    currentAudio = null
    handleEdgeError(index)
  })
}

// ---- Edge TTS 错误处理：重试 TTS_RETRY_BEFORE_SKIP 次后跳到下一句 ----
// 关键改动：不再原地无限重试某一句导致整篇卡死，而是放弃问题句、保证流式体验
function handleEdgeError(index: number) {
  isSpeechError.value = true
  const tries = (retryMap.get(index) || 0) + 1
  retryMap.set(index, tries)

  if (tries <= TTS_RETRY_BEFORE_SKIP) {
    const delay = Math.min(500 * Math.pow(2, tries - 1), 2000)
    showTtsToast(`朗读异常，${delay/1000}s 后重试...`, 2000)
    setTimeout(() => { isSpeechError.value = false; playEdgeSentence(index) }, delay)
  } else {
    // 重试已达上限：跳过该句，继续朗读下一句
    retryMap.delete(index)
    showTtsToast(`第${index + 1}句朗读失败，已跳过`, 2500)
    isSpeechError.value = false
    advanceToNext(index)
  }
}

// ---- Web Speech API (Mobile) 引擎 ----
function stopSpeechSynthesis() {
  window.speechSynthesis?.cancel()
}


async function playSpeechSentence(index: number) {
  const gen = ttsGeneration
  if (gen !== ttsGeneration) return
  if (index >= sentences.value.length) { tryNextChapter(); return }

  const text = sentences.value[index].replace(/<[^>]*>/g, ' ').trim()
  if (!text) { advanceToNext(index); return }

  // 取消正在播放的语音
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = speechRate.value

  // 选择语音
  const voiceId = selectedVoiceName.value
  if (voiceId && voiceId.startsWith('speech:')) {
    const voiceName = voiceId.replace('speech:', '')
    if (voiceName !== 'default') {
      const voices = window.speechSynthesis.getVoices()
      const matched = voices.find(v => v.name === voiceName)
      if (matched) utterance.voice = matched
    }
  } else {
    // 自动选择中文语音
    const voices = window.speechSynthesis.getVoices()
    const zhVoice = voices.find(v => v.lang.startsWith('zh'))
    if (zhVoice) utterance.voice = zhVoice
  }

  utterance.onstart = () => {
    if (gen !== ttsGeneration) return
    isReadAloudPlaying.value = true
    ttsState = 'playing'
    currentSentenceIndex.value = index
    scrollToSentence(index)
  }

  utterance.onend = () => {
    if (gen !== ttsGeneration) return
    advanceToNext(index)
  }

  utterance.onerror = (e) => {
    if (gen !== ttsGeneration) return
    console.warn('[TTS][Speech] 播放出错:', e.error)
    handleSpeechError(index)
  }

  window.speechSynthesis.speak(utterance)
}

// ---- SpeechSynthesis 错误处理（per-index，与 Edge 引擎一致） ----
function handleSpeechError(index: number) {
  isSpeechError.value = true
  const tries = (retryMap.get(index) || 0) + 1
  retryMap.set(index, tries)

  if (tries <= TTS_RETRY_BEFORE_SKIP) {
    const delay = Math.min(500 * Math.pow(2, tries - 1), 2000)
    showTtsToast(`朗读异常，${delay/1000}s 后重试...`, 2000)
    setTimeout(() => { isSpeechError.value = false; playSpeechSentence(index) }, delay)
  } else {
    retryMap.delete(index)
    showTtsToast(`第${index + 1}句朗读失败，已跳过`, 2500)
    isSpeechError.value = false
    advanceToNext(index)
  }
}

// ---- 统一推进 ----
function advanceToNext(currentIdx: number) {
  if (currentIdx < sentences.value.length - 1) {
    const next = currentIdx + 1
    if (ttsEngine.value === 'edge') {
      // 播放下一句；滑动窗口预取已在 playEdgeSentence 内部维护
      playEdgeSentence(next)
    } else {
      playSpeechSentence(next)
    }
  } else {
    tryNextChapter()
  }
}

// ---- 自动跳章 ----
let nextChapterTimer: number | null = null
function tryNextChapter() {
  if (isAutoAdvancingChapter) return
  if (currentChapter.value < (book.value?.content?.length || 1) - 1) {
    isAutoAdvancingChapter = true
    currentChapter.value++
    if (nextChapterTimer) clearTimeout(nextChapterTimer)
    nextChapterTimer = window.setTimeout(() => {
      nextChapterTimer = null
      isAutoAdvancingChapter = false
      stopReadAloud()
      startReadAloud(0, true) // skipVoiceLoad
    }, 300)
  } else {
    stopReadAloud()
  }
}

// ---- 生命周期 ----
function stopReadAloud() {
  ttsGeneration++
  ttsAbort?.abort()
  ttsAbort = null
  releaseCurrentAudio()
  clearAudioCache()
  retryMap.clear()
  stopProxyHealthCheck()
  stopSpeechSynthesis()
  isReadAloudPlaying.value = false
  isSpeechError.value = false
  ttsState = 'idle'
}

async function startReadAloud(startIndex: number, skipVoiceLoad = false) {
  stopReadAloud()

  if (!skipVoiceLoad) {
    await loadAllVoices()
    if (voiceCache.value.length === 0) {
      showTtsToast('未找到可用音色')
      return
    }
  }

  if (ttsEngine.value === 'edge') {
    // 代理不可用时提示用户，但仍尝试播放（可能是代理刚启动，延迟检测）
    if (!isProxyAvailable.value) {
      showTtsToast('TTS 代理未连接，朗读可能异常', 3000)
    }
    ttsAbort = new AbortController()
    startProxyHealthCheck()
    showTtsToast('开始朗读', 1500)
    // 播放第一句的同时启动滑动窗口预取后续几句
    playEdgeSentence(startIndex)
  } else {
    showTtsToast('开始朗读', 1500)
    playSpeechSentence(startIndex)
  }
}

function pauseReadAloud() {
  ttsState = 'paused'
  isReadAloudPlaying.value = false
  if (ttsEngine.value === 'edge') {
    if (currentAudio && !currentAudio.paused) currentAudio.pause()
  } else {
    window.speechSynthesis?.pause()
  }
}

function resumeReadAloud() {
  const idx = currentSentenceIndex.value
  if (ttsEngine.value === 'edge') {
    if (currentAudio && currentAudio.paused) {
      currentAudio.play().catch(() => { playEdgeSentence(idx) })
    } else {
      playEdgeSentence(idx)
    }
  } else {
    window.speechSynthesis?.resume()
    // 如果 resume 不生效（部分浏览器），重新播放
    if (!window.speechSynthesis?.speaking) {
      playSpeechSentence(idx)
    }
  }
}

function toggleReadAloud() {
  if (ttsState === 'playing') {
    pauseReadAloud()
  } else if (ttsState === 'paused') {
    resumeReadAloud()
  } else {
    startReadAloud(currentSentenceIndex.value)
  }
}

// 点击段落：仅在朗读激活时生效（暂停/跳转/恢复），空闲时不响应
function onParagraphClick(idx: number, e: MouseEvent) {
  if (ttsState === 'idle') return  // 未在朗读时不响应，事件正常冒泡

  // 朗读激活时阻止冒泡，防止 handleMainClick 关闭面板
  e.stopPropagation()

  // 正在朗读且点击的是当前段落：停止朗读（用户不想继续了）
  if (ttsState === 'playing' && currentSentenceIndex.value === idx) {
    stopReadAloud()
    return
  }

  // 暂停状态且点击的是当前段落：恢复
  if (ttsState === 'paused' && currentSentenceIndex.value === idx) {
    resumeReadAloud()
    return
  }

  // 朗读中/暂停中点击不同段落：跳转到该段继续朗读
  ttsGeneration++
  ttsAbort?.abort()
  ttsAbort = null
  releaseCurrentAudio()
  retryMap.clear()
  trimAudioCache(idx)

  currentSentenceIndex.value = idx
  scrollToSentence(idx)
  if (ttsEngine.value === 'edge') {
    ttsAbort = new AbortController()
    ttsState = 'playing'
    isReadAloudPlaying.value = true
    playEdgeSentence(idx)
  } else {
    stopSpeechSynthesis()
    ttsState = 'playing'
    isReadAloudPlaying.value = true
    playSpeechSentence(idx)
  }
}

// 音色切换
function onVoiceChange() {
  try { localStorage.setItem('reader-voice', selectedVoiceName.value) } catch {}
  if (ttsState !== 'idle') {
    const idx = currentSentenceIndex.value
    stopReadAloud()
    startReadAloud(idx, true) // 跳过 loadAllVoices，直接用当前列表+新音色
  }
}

// 测试当前音色
// 语速调整
function updateSettings() {
  try { localStorage.setItem('reader-speech-rate', String(speechRate.value)) } catch {}
  if (ttsState !== 'idle') {
    const idx = currentSentenceIndex.value
    stopReadAloud()
    startReadAloud(idx, true)
  }
}

// 滚动到高亮句子（滚动模式），或在翻页模式下自动翻到包含该句的页
function scrollToSentence(index: number) {
  // 翻页模式：根据 recalcPages 生成的映射，自动翻到目标句所在页
  if (readerStore.readerMode === 'page' && pageModeAvailable.value) {
    const targetPage = sentenceToPage.get(index)
    if (targetPage && targetPage !== pageNum.value) {
      pageNum.value = targetPage
    }
    return
  }

  // 滚动模式：DOM 滚动追踪
  const el = sentenceRefs.value[index]
  const container = mainRef.value
  if (!el || !container) return

  const containerRect = container.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()

  const topGap = elRect.top - containerRect.top
  const bottomGap = elRect.bottom - containerRect.bottom

  if (topGap < 80 || bottomGap > -80) {
    const scrollTarget = container.scrollTop + (elRect.top - containerRect.top) - containerRect.height / 3
    container.scrollTo({ top: scrollTarget, behavior: 'smooth' })
  }
}

// 生成文件名封面（已移除，使用公共函数）

// 书架阅读时长格式化（秒 → "Xh Xm" / "Xm"）
function formatShelfTime(seconds: number): string {
  if (!seconds || seconds < 60) return '<1m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${m > 0 ? m + 'm' : ''}`
  return `${m}m`
}

// 将 ArrayBuffer 封面转为 blob URL，无封面时动态生成文件名封面
const coverUrlCache = new Map<string, string>()
function coverUrl(bookId: string, data: ArrayBuffer | null, title: string): string {
  let url = coverUrlCache.get(bookId)
  if (!url) {
    let blob: Blob
    if (data) {
      blob = new Blob([data])
    } else {
      const canvas = document.createElement('canvas')
      const w = 300, h = 420
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      
      let hash = 0
      for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash)
      }
      const h1 = Math.abs(hash) % 360
      const h2 = (h1 + 40) % 360
      
      const gradient = ctx.createLinearGradient(0, 0, w, h)
      gradient.addColorStop(0, `hsl(${h1}, 60%, 45%)`)
      gradient.addColorStop(1, `hsl(${h2}, 50%, 35%)`)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)
      
      ctx.globalAlpha = 0.08
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(w * 0.8, h * 0.2, 120, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(w * 0.15, h * 0.85, 80, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      const maxChars = 12
      const displayTitle = title.length > maxChars ? title.slice(0, maxChars) + '...' : title
      
      let fontSize = 28
      ctx.font = `bold ${fontSize}px sans-serif`
      while (ctx.measureText(displayTitle).width > w - 40 && fontSize > 16) {
        fontSize -= 2
        ctx.font = `bold ${fontSize}px sans-serif`
      }
      
      const chars = displayTitle.split('')
      const lines: string[] = []
      let line = ''
      for (const ch of chars) {
        const test = line + ch
        if (ctx.measureText(test).width > w - 40) {
          lines.push(line)
          line = ch
        } else {
          line = test
        }
      }
      if (line) lines.push(line)
      
      const lineHeight = fontSize * 1.4
      const startY = h / 2 - (lines.length - 1) * lineHeight / 2
      
      ctx.shadowColor = 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = 6
      ctx.shadowOffsetY = 2
      
      lines.forEach((l, i) => {
        ctx.fillText(l, w / 2, startY + i * lineHeight)
      })
      
      blob = canvasToBlob(canvas)
    }
    url = URL.createObjectURL(blob)
    coverUrlCache.set(bookId, url)
  }
  return url
}

function canvasToBlob(canvas: HTMLCanvasElement): Blob {
  const dataUrl = canvas.toDataURL('image/png')
  const base64 = dataUrl.split(',')[1]
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new Blob([bytes], { type: 'image/png' })
}

function startJump() {
  jumpInput.value = currentChapter.value + 1
  isJumping.value = true
  setTimeout(() => {
    // 尝试聚焦当前可见的输入框
    jumpInputRef1.value?.focus() || jumpInputRef2.value?.focus()
    jumpInputRef1.value?.select() || jumpInputRef2.value?.select()
  }, 50)
}

function confirmJump() {
  const max = book.value?.content?.length || 1
  const target = Number(jumpInput.value)
  if (!isNaN(target) && target >= 1 && target <= max) {
    currentChapter.value = target - 1
    scrollToChapterStart()
  }
  isJumping.value = false
}

// 数据管理
async function handleClearAllData() {
  if (confirm('确定要清除所有数据吗？此操作不可撤销。')) {
    await StorageService.deleteAllData()
    alert('所有数据已清除')
    window.location.reload()
  }
}

// PDF 标注管理
function toggleAnnotationMode() {
  annotationMode.value = !annotationMode.value
}

function adjustPenWidth(delta: number) {
  if (highlighterMode.value) {
    highlighterWidth.value = Math.max(10, Math.min(40, highlighterWidth.value + delta))
  } else {
    penWidth.value = Math.max(0.5, Math.min(10, penWidth.value + delta))
  }
}

function handlePdfAnnotationsChange(newAnnotations: PdfAnnotation[]) {
  if (!currentFileId.value || !book.value) return
  
  // 合并新标注
  newAnnotations.forEach(newAnnot => {
    const fullAnnot = addAnnotation(
      currentFileId.value,
      book.value!.title,
      {
        page: newAnnot.page,
        type: newAnnot.type,
        color: newAnnot.color,
        width: newAnnot.width,
        points: newAnnot.points
      }
    )
    pdfAnnotations.value.push(fullAnnot)
  })
  
  // 触发响应式更新
  pdfAnnotations.value = [...pdfAnnotations.value]
}

function handleEraseAnnotation(annotationId: string) {
  if (!currentFileId.value) return
  
  deleteAnnotation(currentFileId.value, annotationId)
  pdfAnnotations.value = pdfAnnotations.value.filter(a => a.id !== annotationId)
}

function clearAllAnnotations() {
  if (!currentFileId.value || !confirm('确定要清除当前 PDF 的所有标注吗？')) return
  
  clearAnnotations(currentFileId.value)
  pdfAnnotations.value = []
}

function toggleFullscreen() {
  if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(() => {}) ; isFullscreen.value = true }
  else { document.exitFullscreen(); isFullscreen.value = false }
}
function onFs() { isFullscreen.value = !!document.fullscreenElement }

// 全屏模式下，鼠标靠近底部显示导航栏
function handleMouseMove(e: MouseEvent) {
  if (!isFullscreen.value) return
  const threshold = 100 // 距离底部 100px 内显示
  const nearBottom = e.clientY > window.innerHeight - threshold
  if (nearBottom) {
    showFullNav.value = true
    if (fullNavTimer) { clearTimeout(fullNavTimer); fullNavTimer = null }
  } else {
    if (!fullNavTimer) {
      fullNavTimer = setTimeout(() => { showFullNav.value = false }, 800)
    }
  }
}

onMounted(async () => {
  startClock()
  startReadingTimeTracker()
  document.addEventListener('mousemove', handleMouseMove)
  try { const s = localStorage.getItem('reader-sidebar-width'); if (s) { const n = parseInt(s, 10); if (!Number.isNaN(n)) sidebarWidth.value = Math.max(minW, Math.min(maxW, n)) } } catch {}
  
  // 加载语音设置
  try {
    const rate = localStorage.getItem('reader-speech-rate')
    if (rate) speechRate.value = parseFloat(rate)
  } catch {}
  
  loadAllVoices()
  await loadShelf()
  await loadBook(bookId.value)
  document.addEventListener('fullscreenchange', onFs)
  document.addEventListener('keydown', handlePageKeydown)
})

// 章节变化时重置段落索引并加载划线
watch(currentChapter, async () => {
  currentSentenceIndex.value = 0
  sentenceRefs.value = []
  
  // 保存阅读进度
  if (bookId.value && book.value) {
    const chapter = book.value.content[currentChapter.value]
    await StorageService.saveProgress({
      bookId: bookId.value,
      chapterId: chapter?.id || String(currentChapter.value),
      position: 0,
      percentage: book.value.content.length > 0 
        ? (currentChapter.value / book.value.content.length) * 100 
        : 0,
      updatedAt: Date.now()
    })
  }
  
  // 自动跳章时不停止朗读（由 utterance.onend 继续下一章）
  if (!isAutoAdvancingChapter && isReadAloudPlaying.value) {
    stopReadAloud()
  }
  loadHighlights()
})

// 目录点击处理
function onTocClick(idx: number) {
  currentChapter.value = idx
  if (bookFormat.value === 'pdf' && book.value?.toc?.[idx]) {
    // PDF: 从 toc 中读取起始页码
    const tocEntry = book.value.toc[idx]
    const pageNum = tocEntry.position
    nextTick(() => {
      setTimeout(() => {
        pdfReaderRef.value?.scrollToPage?.(pageNum)
      }, 100)
    })
  } else {
    // EPUB/TXT: 滚动到章节开头
    scrollToChapterStart()
  }
}

watch([() => readerStore.readerMode, () => readerStore.fontSize, () => currentChapter.value], () => {
  if (readerStore.readerMode === 'page' && pageModeAvailable.value) {
    const v = ++recalcVersion
    nextTick(() => {
      if (v !== recalcVersion) return
      recalcPages()
      // 模式切换后，根据当前朗读句/阅读位置定位页码
      if (currentSentenceIndex.value > 0 && sentenceToPage.has(currentSentenceIndex.value)) {
        pageNum.value = sentenceToPage.get(currentSentenceIndex.value)!
      }
    })
  }
})

watch(() => bookFormat.value, (fmt) => {
  if (fmt && !pageModeAvailable.value && readerStore.readerMode === 'page') {
    readerStore.setReaderMode('scroll')
  }
  if (fmt && pageModeAvailable.value && readerStore.readerMode === 'page') {
    const v = ++recalcVersion
    nextTick(() => { if (v === recalcVersion) recalcPages() })
  }
})

let resizeObserver: ResizeObserver | null = null
let recalcDebounceTimer: number | undefined
onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    if (readerStore.readerMode === 'page' && pageModeAvailable.value) {
      if (recalcDebounceTimer) clearTimeout(recalcDebounceTimer)
      recalcDebounceTimer = window.setTimeout(recalcPages, 100)
    }
  })
  const vp = document.querySelector('.page-viewport') as HTMLElement
  if (vp) resizeObserver.observe(vp)
  // 初始进入翻页模式时重算分页
  if (readerStore.readerMode === 'page' && pageModeAvailable.value) {
    const v = ++recalcVersion
    nextTick(() => { if (v === recalcVersion) recalcPages() })
  }
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (timeTimer) clearInterval(timeTimer)
  if (readingTimeTimer) clearInterval(readingTimeTimer)
  if (fullNavTimer) clearTimeout(fullNavTimer)
  if (nextChapterTimer) { clearTimeout(nextChapterTimer); nextChapterTimer = null }
  if (ttsToastTimer) { clearTimeout(ttsToastTimer); ttsToastTimer = null }
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('fullscreenchange', onFs)
  document.removeEventListener('keydown', handlePageKeydown)
  stopReadAloud()
  stopReadingTimeTracker()
  // 释放封面 blob URL，防止内存泄漏
  for (const url of coverUrlCache.values()) {
    URL.revokeObjectURL(url)
  }
  coverUrlCache.clear()
})
</script>

<style scoped>
.reader-view {
  height: 100vh; display: flex; flex-direction: column; overflow: hidden;
}

.reader-toolbar {
  height: 44px; padding: 0 16px; background: rgba(255,255,255,0.85); backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,0,0,0.06); display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  white-space: nowrap; font-size: 15px; font-weight: 500; z-index: 20; color: #333; gap: 16px; position: relative;
}
.theme-dark .reader-toolbar { background: rgba(10,14,32,0.85); border-color: rgba(100,150,255,0.1); color: #c8daf8; }

.toolbar-title {
  font-family: "Times New Roman", Times, KaiTi, STKaiti, "楷体", serif;
  font-size: 18px;
  font-weight: 700;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  position: absolute;
  left: 16px;
}

/* 首页按钮 */
.home-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: 1.5px solid rgba(120, 170, 230, 0.5);
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(220, 235, 255, 0.7) 0%, rgba(200, 220, 245, 0.5) 100%);
  color: #4a7fc7;
  cursor: pointer;
  transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.18s ease,
              background 0.18s ease,
              border-color 0.18s ease,
              color 0.18s ease;
  flex-shrink: 0;
  white-space: nowrap;
  will-change: transform;
  width: 38px;
  height: 38px;
}

.home-icon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  transition: transform 0.18s ease;
}

.home-btn:hover {
  background: linear-gradient(135deg, rgba(240, 248, 255, 0.8) 0%, rgba(220, 235, 255, 0.6) 100%);
  border-color: rgba(120, 170, 230, 0.7);
  color: #3a6faf;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(100, 150, 220, 0.15);
}

.home-btn:hover .home-icon {
  transform: scale(1.05);
}

.home-btn:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 2px 6px rgba(100, 150, 220, 0.1);
}

/* 书架按钮 */
.library-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: 1.5px solid rgba(120, 170, 230, 0.5);
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(220, 235, 255, 0.7) 0%, rgba(200, 220, 245, 0.5) 100%);
  color: #4a7fc7;
  cursor: pointer;
  transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.18s ease,
              background 0.18s ease,
              border-color 0.18s ease,
              color 0.18s ease;
  flex-shrink: 0;
  white-space: nowrap;
  will-change: transform;
  width: 38px;
  height: 38px;
}

.library-icon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  transition: transform 0.18s ease;
}

.library-btn:hover {
  background: linear-gradient(135deg, rgba(240, 248, 255, 0.8) 0%, rgba(220, 235, 255, 0.6) 100%);
  border-color: rgba(120, 170, 230, 0.7);
  color: #3a6faf;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(100, 150, 220, 0.15);
}

.library-btn:hover .library-icon {
  transform: scale(1.05);
}

.library-btn:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 2px 6px rgba(100, 150, 220, 0.1);
}

/* 布局容器 */
.reader-body { flex: 1; display: flex; overflow: hidden; position: relative; }

/* 左侧目录（仅展开时显示，作为覆盖层） */
.reader-sidebar {
  background: #fff; border-right: 1px solid #eee;
  display: flex; flex-direction: column; flex-shrink: 0;
  position: absolute;
  left: 0; top: 0; bottom: 0;
  z-index: 30;
  box-shadow: 4px 0 16px rgba(0,0,0,0.08);
}
.sidebar-expanded { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.sidebar-header { padding: 8px 10px 8px 4px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 8px; font-size: 14px; flex-shrink: 0; }
.collapse-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  border: none; border-radius: 6px;
  background: transparent;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
}
.collapse-btn:hover { background: rgba(24,144,255,0.1); color: #1890ff; transform: translateX(-2px); }

.side-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; margin: 0 0 0 auto; padding: 0;
  border: none; border-radius: 0; background: transparent;
  color: #888; cursor: pointer; transition: all 0.2s;
}
.side-btn:hover { background: rgba(24,144,255,0.1); color: #1890ff; }
.sidebar-content { flex: 1; overflow-y: auto; padding: 4px 0; }
.toc-item { display: flex; align-items: center; gap: 6px; padding: 8px 10px; cursor: pointer; font-size: 15px; }
.toc-item .toc-icon { width: 14px; height: 14px; color: #999; flex-shrink: 0; display: block; margin-top: 1px; }
.toc-item.active { background: rgba(24,144,255,0.1); border-left: 3px solid #1890ff; font-weight: 600; }
.toc-item.active .toc-icon { color: #1890ff; }

/* 拖拽条 */
.resize-bar { width: 6px; cursor: col-resize; background: transparent; flex-shrink: 0; }
.resize-bar:hover { background: rgba(0,0,0,0.06); }

/* 主阅读区 */
.reader-main { flex: 1; overflow-y: auto; position: relative; min-width: 0; background: #fff; transition: background 0.3s, color 0.3s; border-left: 1px solid #eee; }
.reader-content-wrap { flex: 1; overflow-y: auto; background: #fff; transition: background 0.3s, color 0.3s; }
.reader-content-wrap.page-mode { overflow: hidden; display: flex; flex-direction: column; }
.reader-main.page-mode { overflow: hidden !important; display: flex; flex-direction: column; }

/* Scroll container bg matches reader-main — prevents white bleed-through on overscroll */
.theme-dark .reader-content-wrap { background: #1a1a1a; }
.theme-green .reader-content-wrap { background: #e8f0e3; }
.theme-parchment .reader-content-wrap { background: #f5e6c8; }
.reader-page-mode {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
.page-viewport {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  padding: 24px 64px 80px 64px;
  box-sizing: border-box;
  overflow: hidden;
  align-items: start;
  align-content: center;
  justify-items: stretch;
}
.page-col-left,
.page-col-right {
  min-width: 0;
  overflow: hidden;
}
.page-col-left p,
.page-col-right p {
  margin: 0 0 0.8em 0;
}
.page-viewport p {
  margin: 0 0 0.8em 0;
  break-inside: avoid;
  page-break-inside: avoid;
}
.page-indicator-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  flex-shrink: 0;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 20px;
  font-size: 13px;
  color: #666;
  background: rgba(255, 255, 255, 0.6);
  border: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  z-index: 5;
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.2s 0.05s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.page-indicator-bar.hidden {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.15s ease, transform 0.18s ease-in;
  pointer-events: none;
}
.indicator-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-variant-numeric: tabular-nums;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-weight: 500;
  letter-spacing: 0.5px;
}
.indicator-center {
  display: flex;
  align-items: center;
  gap: 12px;
}
.page-indicator-text {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 1px;
  color: #555;
}
.theme-dark .page-indicator-bar {
  color: #c8daf8;
  background: rgba(14, 26, 50, 0.82);
  backdrop-filter: blur(16px) saturate(1.6);
  -webkit-backdrop-filter: blur(16px) saturate(1.6);
  border-top: 1px solid rgba(100, 140, 200, 0.18);
}
.theme-dark .page-indicator-text {
  color: #c8daf8;
}
.theme-green .page-indicator-bar {
  color: #5a7a5a;
  background: rgba(232, 240, 227, 0.82);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  border-top: 1px solid rgba(74, 122, 74, 0.15);
}
.theme-green .page-indicator-text {
  color: #3a5a3a;
}
.theme-parchment .page-indicator-bar {
  color: #8a7a5a;
  background: rgba(245, 230, 200, 0.82);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  border-top: 1px solid rgba(139, 105, 20, 0.15);
}
.theme-parchment .page-indicator-text {
  color: #3d2a00;
}

.indicator-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
/* —— 翻页模式：两侧圆形玻璃导航按钮 —— */
.nav-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  /* 用略不透明的渐变模拟磨砂玻璃，去掉 backdrop-filter 以避免点击时重模糊造成的卡顿 */
  background: linear-gradient(145deg, rgba(255,255,255,0.96) 0%, rgba(236,240,246,0.92) 100%);
  border: 2px solid rgba(0,0,0,0.12);
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.55;
  pointer-events: auto;
  will-change: transform;
  transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.18s ease,
              background-color 0.18s ease,
              border-color 0.18s ease,
              opacity 0.18s ease,
              color 0.18s ease;
  z-index: 10;
  box-shadow: 0 12px 32px rgba(60,60,60,0.22),
              0 4px 12px rgba(100,100,100,0.15),
              0 1px 3px rgba(140,140,140,0.10),
              0 0 0 1px rgba(255,255,255,0.5) inset;
}
.nav-circle:hover:not(:disabled) {
  opacity: 1;
  transform: translateY(-2px) scale(1.08);
  border-color: rgba(24,144,255,0.4);
  color: #1890ff;
  background: rgba(255,255,255,0.95);
  box-shadow: 0 12px 30px rgba(24,144,255,0.18),
              0 0 0 1px rgba(24,144,255,0.15) inset;
}
.nav-circle:active:not(:disabled) { transform: scale(0.92); }
.nav-circle:disabled { opacity: 0.15; cursor: default; pointer-events: none; }

.page-nav-left-group,
.page-nav-right-group {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 9;
  pointer-events: none;
}
.page-nav-left-group { left: 32px; }
.page-nav-right-group { right: 32px; }
.page-nav-left-group > *,
.page-nav-right-group > * { pointer-events: auto; }
.reader-content { max-width: 720px; margin: 0 auto; padding: 16px 20px 100px; }
.reader-content :deep(img) {
  max-width: 100%; height: auto; display: block;
  margin: 1em auto; border-radius: 4px;
}
.chapter-end-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin: 48px 0 32px;
  padding: 20px 0;
  border-top: 1px solid rgba(0,0,0,0.06);
}
.chapter-end-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.15);
  background: linear-gradient(180deg, #fff 0%, #f0f0f0 100%);
  cursor: pointer;
  color: #555;
  font-size: 14px;
  font-family: "Kaiti SC", "STKaiti", "KaiTi", serif;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 3px 0 rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08);
}
.chapter-end-btn:hover:not(:disabled) {
  border-color: #1890ff;
  color: #1890ff;
  background: linear-gradient(180deg, #fff 0%, #e6f4ff 100%);
  box-shadow: 0 3px 0 rgba(24,144,255,0.3), 0 4px 12px rgba(24,144,255,0.15);
}
.chapter-end-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08);
}
.chapter-end-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}
.chapter-end-divider {
  width: 1px;
  height: 20px;
  background: rgba(0,0,0,0.1);
}
.loading { text-align: center; padding: 40px; color: #999; }

/* 翻页过渡动画 */
.page-forward-enter-active,
.page-forward-leave-active,
.page-back-enter-active,
.page-back-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-forward-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.page-forward-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}
.page-back-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}
.page-back-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

/* 右下角章节按钮 */
.reader-nav-cr { position: fixed; right: 76px; bottom: 50px; display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 30; }
.nav-buttons { display: flex; gap: 8px; }
.nav-btn { padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(0,0,0,0.08); background: rgba(255,255,255,0.85); backdrop-filter: blur(4px); color: #333; cursor: pointer; font-size: 13px; font-family: "Kaiti SC", "STKaiti", "KaiTi", "AR PL UKai CN", serif; box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: all 0.2s; display: flex; align-items: center; gap: 4px; }
.nav-btn:hover:not(:disabled) { background: rgba(24,144,255,0.1); border-color: #1890ff; color: #1890ff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(24,144,255,0.15); }
.nav-btn:active:not(:disabled) { transform: translateY(0); }
.nav-btn:disabled { opacity: 0.4; cursor: not-allowed; background: rgba(240,240,240,0.5); }
.chapter-indicator { background: rgba(255,255,255,0.9); padding: 4px 14px; border-radius: 14px; font-family: 'Georgia', 'Times New Roman', serif; font-size: 14px; font-weight: 500; color: #555; box-shadow: 0 2px 6px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.04); letter-spacing: 1px; cursor: pointer; transition: all 0.2s; }
.chapter-indicator:hover { background: rgba(24,144,255,0.05); border-color: rgba(24,144,255,0.3); color: #1890ff; }

/* 滚动模式底部栏翻章小按钮 */
.info-chapter-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
  background: rgba(255,255,255,0.6);
  cursor: pointer;
  color: #888;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1),
              background 0.15s ease,
              border-color 0.15s ease,
              color 0.15s ease;
  flex-shrink: 0;
  white-space: nowrap;
}
.info-chapter-btn:hover:not(:disabled) {
  background: rgba(24,144,255,0.1);
  border-color: #1890ff;
  color: #1890ff;
}
.info-chapter-btn:active:not(:disabled) {
  transform: scale(0.9);
  background: rgba(24,144,255,0.15);
}
.info-chapter-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}
/* 孤儿 chapter-nav-btn 旧定义已删除 — 统一由 line 2625 主样式控制 */

.chapter-jump-input-wrapper { position: relative; width: 80px; }
.chapter-input { width: 100%; background: #fff; border: 1px solid #1890ff; border-radius: 14px; padding: 4px 8px; font-size: 14px; font-family: 'Georgia', serif; color: #333; text-align: center; outline: none; box-shadow: 0 2px 6px rgba(24,144,255,0.2); }
.chapter-input::-webkit-inner-spin-button, .chapter-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

.fullscreen-btn-float {
  position: fixed;
  bottom: 12px;
  right: 6px;
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  transition: all 0.2s;
  color: #555;
}
.fullscreen-btn-float:hover {
  background: rgba(24,144,255,0.1);
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-1px);
}

/* 底部阅读信息 */
.reader-info-bar {
  position: fixed;
  bottom: 14px;
  left: 80px;
  right: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: transparent;
  border: none;
  border-radius: 0;
  font-size: 14px;
  color: #888;
  z-index: 50;
  font-variant-numeric: tabular-nums;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-weight: 500;
  letter-spacing: 0.5px;
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.25s 0.05s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.reader-info-bar.hidden {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.15s ease, transform 0.18s ease-in;
  pointer-events: none;
}
.info-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.info-right {
  display: flex;
  align-items: center;
}
.reader-chapter-bar {
  position: fixed;
  bottom: 22px;
  right: 70px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 20px;
  z-index: 50;
}
.info-chapter {
  background: none;
  border: none;
  padding: 0;
  box-shadow: none;
  cursor: pointer;
}
.info-chapter:hover {
  color: #1890ff;
  transform: none;
  box-shadow: none;
}
.info-chapter-input {
  width: 60px;
}
.info-right .chapter-indicator {
  background: none;
  border: none;
  padding: 0;
  box-shadow: none;
  font-size: 14px;
  color: inherit;
}
.info-right .chapter-indicator:hover {
  color: #1890ff;
  transform: none;
  box-shadow: none;
}
.info-right .chapter-jump-input-wrapper {
  width: 60px;
}
.info-right .chapter-input {
  border-color: rgba(0,0,0,0.15);
  box-shadow: none;
  background: transparent;
}
.info-time {
  font-weight: 500;
}
.info-divider {
  opacity: 0.4;
}
.info-progress {
  opacity: 0.85;
}

.theme-dark .reader-info-bar {
  background: rgba(8,12,30,0.4);
  border: 1px solid rgba(60,100,200,0.08);
  backdrop-filter: blur(12px) saturate(1.3);
  color: #8ea4c4;
}
.theme-dark .info-right .chapter-input {
  background: rgba(8,12,30,0.4);
  border-color: rgba(60,100,200,0.15);
  color: #c8daf8;
}
.theme-dark .info-right .chapter-indicator {
  color: #8ea4c4; background: rgba(10,15,40,0.8); border-color: rgba(60,100,200,0.1);
}
.theme-dark .info-right .chapter-indicator:hover {
  color: #93c5fd; background: rgba(10,15,40,0.9); border-color: rgba(80,120,220,0.2);
}
.theme-dark .reader-chapter-bar {
  background: rgba(8,12,30,0.8);
  border-color: rgba(60,100,200,0.08);
  color: #8ea4c4;
}
.theme-green .reader-info-bar {
  background: transparent;
  border: none;
  color: #5a7a5a;
}
.theme-green .reader-chapter-bar {
  background: rgba(232,240,227,0.85);
  border-color: rgba(74,122,74,0.15);
}
.theme-green .info-right .chapter-input {
  background: transparent;
  border-color: #c8e0c0;
}
.theme-green .info-right .chapter-indicator {
  color: #5a7a5a;
}
.theme-green .info-right .chapter-indicator:hover {
  color: #3a5a3a;
}
.theme-parchment .reader-info-bar {
  background: transparent;
  border: none;
  color: #7a6a4a;
}
.theme-parchment .reader-chapter-bar {
  background: rgba(240,226,200,0.85);
  border-color: rgba(180,160,120,0.2);
}
.theme-parchment .info-right .chapter-input {
  background: transparent;
  border-color: #c9b894;
}
.theme-parchment .info-right .chapter-indicator {
  color: #7a6a4a;
}
.theme-parchment .info-right .chapter-indicator:hover {
  color: #5a4a2a;
}

/* PDF 控件条 - 集成标注和缩放 */
.pdf-controls-bar {
  position: fixed;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 20px;
  padding: 8px 6px;
  box-shadow: 0 3px 16px rgba(0,0,0,0.12);
  z-index: 100;
  pointer-events: auto;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

/* PDF 标注工具栏 */
.pdf-annotation-toolbar {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 4px 3px;
  border-radius: 14px;
  transition: background 0.2s;
}
.pdf-annotation-toolbar.annotation-active {
  background: rgba(24,144,255,0.08);
}
.pdf-annotation-toolbar .annotation-action-btn {
  width: 22px; height: 22px; border: none;
  background: transparent; border-radius: 4px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0; padding: 0;
}

/* 标注和缩放之间的分隔线 */
.annotation-zoom-divider {
  width: 70%; height: 1px; background: rgba(0,0,0,0.1);
}

/* PDF 缩放控件 */
.pdf-zoom-controls {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 4px 0;
}
.zoom-btn {
  width: 32px; height: 32px; border: none;
  background: rgba(0,0,0,0.06); border-radius: 50%;
  cursor: pointer; font-size: 18px; color: #555;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0;
}
.zoom-btn:hover { background: rgba(24,144,255,0.15); color: #1890ff; }
.zoom-slider-wrap {
  position: relative;
  width: 22px; height: 80px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.zoom-slider {
  position: absolute;
  width: 80px; height: 4px;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%) rotate(-90deg);
  cursor: pointer;
  accent-color: #1890ff;
  -webkit-appearance: none; appearance: none;
  background: transparent; border-radius: 2px; outline: none;
  border: none;
}

.zoom-slider:focus {
  outline: none;
  border: none;
}

.zoom-slider::-webkit-slider-runnable-track {
  width: 100%; height: 4px;
  background: rgba(0,0,0,0.12); border-radius: 2px; border: none;
}

.zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 16px; height: 16px; border-radius: 50%;
  margin-top: -6px;
  background: #1890ff; border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  cursor: pointer; transition: all 0.15s;
}

.zoom-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.zoom-slider::-webkit-slider-thumb:focus {
  outline: none;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2), 0 0 0 2px rgba(24,144,255,0.3);
}

.zoom-slider::-moz-range-track {
  width: 100%; height: 4px;
  background: rgba(0,0,0,0.12); border: none; border-radius: 2px;
}

.zoom-slider::-moz-range-thumb {
  width: 16px; height: 16px; border-radius: 50%;
  background: #1890ff; border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  cursor: pointer;
}

.zoom-slider::-moz-range-thumb:focus {
  outline: none;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2), 0 0 0 2px rgba(24,144,255,0.3);
}

.zoom-label {
  font-size: 11px; font-weight: 500; color: #555;
  text-align: center;
  font-variant-numeric: tabular-nums; flex-shrink: 0;
}
.annotation-toggle-btn {
  width: 26px; height: 26px; border: none;
  background: rgba(0,0,0,0.06); border-radius: 50%;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0; padding: 0;
}
.annotation-toggle-btn:hover, .annotation-action-btn:hover {
  background: rgba(24,144,255,0.15); color: #1890ff;
}
.annotation-toggle-btn.active,
.annotation-action-btn.active {
  background: rgba(24,144,255,0.2); color: #1890ff;
}
.annotation-divider {
  width: 70%; height: 1px; background: rgba(0,0,0,0.1); margin: 3px 0;
}
.annotation-colors {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; align-items: center; justify-items: center; margin: 2px 0;
}
.annotation-color-btn {
  width: 16px; height: 16px; border-radius: 50%; border: 2px solid transparent;
  cursor: pointer; transition: all 0.15s; padding: 0; flex-shrink: 0;
}
.annotation-color-btn:hover { transform: scale(1.15); }
.annotation-color-btn.active { border-color: #333; box-shadow: 0 0 0 1px #fff, 0 0 0 2px #333; }

/* ===== 底部控制栏 ===== */
.bottom-bar {
  position: fixed;
  bottom: 12px;
  left: 50%;
  right: auto;
  width: min(94vw, 720px);
  min-height: 72px;
  background: rgba(255, 252, 246, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(180, 160, 120, 0.25);
  border-radius: 999px;
  box-shadow: 0 4px 20px rgba(180, 160, 120, 0.08), 0 1px 3px rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  z-index: 200;
  padding: 10px 18px;
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  transition: opacity 0.25s ease, transform 0.3s var(--qr-ease);
  pointer-events: auto;
}
.bottom-bar.hidden {
  opacity: 0;
  transform: translateX(-50%) translateY(calc(100% + 30px));
  transition: opacity 0.15s ease, transform 0.2s ease-in;
  pointer-events: none;
}
/* 底部栏滑入滑出 */
/* 底部栏繁体字按钮 */
.bot-han {
  font-family: "Kaiti SC", "STKaiti", "KaiTi", "AR PL UKai CN", serif;
  font-size: 20px;
  font-weight: 500;
  line-height: 1;
  color: var(--qr-text-primary, #333);
  letter-spacing: 0.06em;
  transition: color var(--qr-transition-fast), letter-spacing var(--qr-transition-fast);
}
.bot-han-sm {
  font-size: 14px;
  letter-spacing: 0.1em;
  color: #b8860b;
}
/* 繁体字按钮：半透明暖白底 + 细边框 */
.bot-btn {
  width: 56px;
  min-width: 56px;
  height: 50px;
  border: 1px solid rgba(180, 160, 120, 0.2);
  background: rgba(255, 252, 246, 0.75);
  border-radius: 14px;
  position: relative;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  white-space: nowrap;
  color: var(--qr-text-secondary);
  transition: all var(--qr-transition-fast);
  box-shadow: 0 1px 3px rgba(180, 160, 120, 0.06);
}
.bot-btn:hover {
  background: rgba(255, 252, 246, 0.95);
  border-color: rgba(180, 160, 120, 0.4);
  box-shadow: 0 2px 8px rgba(180, 160, 120, 0.1);
  transform: translateY(-1px);
}
.bot-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(180, 160, 120, 0.05);
}
/* 选中态：暖纸底 + 深褐边 + 字色加深 */
.bot-btn.active { background: rgba(255, 252, 246, 0.85); border-color: rgba(180, 160, 120, 0.5); box-shadow: 0 1px 3px rgba(180, 160, 120, 0.08); }
.bot-btn.active .bot-han { color: #6b5d4f; }
/* 播放中：讀 字变朱砂红 + 字距微放 */
.bot-btn.tts-playing { color: inherit; background: rgba(255, 250, 235, 0.9); border-color: rgba(184, 134, 11, 0.35); box-shadow: 0 0 8px rgba(184, 134, 11, 0.1); }
.bot-btn.tts-playing .bot-han { color: #b8860b; letter-spacing: 0.16em; }
/* 暂停态：讀 → 暂停字变小 + 琥珀边框 */
.bot-btn.tts-paused { color: inherit; background: rgba(255, 252, 240, 0.9); border-color: rgba(217, 165, 60, 0.3); }
.bot-btn.tts-paused .bot-han { color: #b8860b; }
.bot-divider {
  width: 1px;
  height: 28px;
  background: rgba(0,0,0,0.08);
  flex-shrink: 0;
  white-space: nowrap;
}
.highlighter-btn.active {
  background: rgba(255, 255, 0, 0.25);
  color: #b8860b;
}
.highlighter-colors {
  margin: 0;
}
.highlighter-color-btn {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0,0,0,0.2);
}
.highlighter-color-btn.active {
  border-color: #333;
  box-shadow: 0 0 0 2px #fff, 0 0 0 3px #333;
}
.danger-btn:hover {
  background: rgba(255, 77, 79, 0.15);
  color: #ff4d4f;
}
.annotation-width {
  display: flex; flex-direction: column; align-items: center; gap: 3px; margin: 2px 0;
}
.width-btn {
  width: 20px; height: 20px; border: none; border-radius: 4px;
  background: rgba(0,0,0,0.06); cursor: pointer; font-size: 14px; color: #555;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; padding: 0;
}
.width-btn:hover { background: rgba(24,144,255,0.15); color: #1890ff; }
.width-value {
  font-size: 10px; font-weight: 500; color: #555;
  text-align: center; font-variant-numeric: tabular-nums;
}
.theme-dark .fullscreen-btn-float {
  background: rgba(20,28,50,0.85);
  border-color: rgba(60,100,200,0.2);
  color: #c8daf8;
}
.theme-dark .zoom-btn { background: rgba(255,255,255,0.1); color: #c8daf8; }
.theme-dark .zoom-btn:hover { background: rgba(24,144,255,0.2); color: #1890ff; }
.theme-dark .zoom-slider { background: transparent; accent-color: #1890ff; }
.theme-dark .zoom-slider::-webkit-slider-runnable-track { background: rgba(255,255,255,0.15); }
.theme-dark .zoom-slider::-webkit-slider-thumb { background: #1890ff; border-color: rgba(60,100,200,0.3); }
.theme-dark .zoom-slider::-moz-range-track { background: rgba(255,255,255,0.15); }
.theme-dark .zoom-label { color: #c8daf8; }
.fullscreen-btn { padding: 6px; display: flex; align-items: center; justify-content: center; }
.fullscreen-btn:hover { background: rgba(24,144,255,0.1); border-color: #1890ff; }


/* 划线笔记浮动工具栏 */
.hl-toolbar {
  position: absolute; z-index: 50;
  transform: translateX(-50%) translateY(-100%);
  background: #fff; border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
  padding: 8px 10px;
  display: flex; flex-direction: column; gap: 6px;
  pointer-events: auto;
}
.hl-toolbar::after {
  content: ''; position: absolute; bottom: -6px; left: 50%;
  transform: translateX(-50%);
  width: 0; height: 0;
  border-left: 6px solid transparent; border-right: 6px solid transparent;
  border-top: 6px solid #fff;
}
.hl-colors { display: flex; gap: 6px; justify-content: center; }
.hl-color-btn {
  width: 24px; height: 24px; border-radius: 50%; border: 2px solid transparent;
  cursor: pointer; transition: all 0.15s; padding: 0;
}
.hl-color-btn:hover { transform: scale(1.15); }
.hl-color-btn.active { border-color: #333; box-shadow: 0 0 0 2px #fff, 0 0 0 3px #333; }
.hl-actions { display: flex; gap: 6px; justify-content: center; }
.hl-btn {
  padding: 3px 12px; border: 1px solid #ddd; border-radius: 6px;
  background: #fff; cursor: pointer; font-size: 12px; color: #555;
  transition: all 0.15s;
}
.hl-btn:hover { background: #f5f5f5; }
.hl-btn-save { background: #1890ff; color: #fff; border-color: #1890ff; }
.hl-btn-save:hover { background: #40a9ff; }
.hl-note-input-wrap { padding: 2px 0; }
.hl-note-input {
  width: 180px; border: 1px solid #ddd; border-radius: 6px; padding: 4px 8px;
  font-size: 12px; resize: none; outline: none; font-family: inherit;
}
.hl-note-input:focus { border-color: #1890ff; }

/* 正文中的高亮标记 */
.reader-content mark.hl {
  position: relative; cursor: pointer;
  background: transparent;
  border-bottom: 2px solid var(--hl-color);
}
.reader-content mark.hl::before {
  content: ''; position: absolute; inset: 0;
  background: var(--hl-color);
  opacity: 0.25; border-radius: 2px;
  pointer-events: none;
  z-index: -1;
}

/* 划线笔记面板 */
.annotations-panel { min-height: 100px; }
.annotations-filter { margin-bottom: 8px; }
.annotation-filter-select {
  width: 100%; height: 32px; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 0 10px; font-size: 12px; color: #475569; background: rgba(255,255,255,0.8);
  cursor: pointer; outline: none; font-family: inherit;
  transition: border-color 0.2s;
}
.annotation-filter-select:hover { border-color: #3b82f6; }
.annotation-filter-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
.annotations-list { display: flex; flex-direction: column; gap: 10px; }
.annotation-item {
  padding: 10px 12px; border-radius: 8px; border: 1px solid #f0f0f0;
  background: #fafafa;
}
.annotation-hd {
  display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
}
.annotation-color {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}
.annotation-chapter { font-size: 11px; color: #999; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.annotation-del {
  width: 18px; height: 18px; border: none; background: rgba(0,0,0,0.05);
  border-radius: 4px; cursor: pointer; font-size: 10px; color: #999;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.annotation-del:hover { background: #ff4d4f; color: #fff; }
.annotation-text {
  font-size: 14px; color: #333; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.annotation-note {
  margin-top: 6px; font-size: 12px; color: #888;
  padding: 4px 8px; background: rgba(0,0,0,0.03); border-radius: 4px;
}
.empty-hint { font-size: 12px; color: #aaa; margin-top: 4px; }

/* 书签面板 */
.bookmarks-panel { min-height: 100px; }
.bookmarks-actions { margin-bottom: 12px; }
.bm-add-btn {
  width: 100%; padding: 8px; border: 1px dashed #ccc;
  border-radius: 8px; background: transparent; cursor: pointer;
  font-size: 13px; color: #666; transition: all 0.15s;
}
.bm-add-btn:hover { border-color: #1890ff; color: #1890ff; background: rgba(24,144,255,0.06); }
.bookmarks-list { display: flex; flex-direction: column; gap: 6px; }
.bookmark-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 8px; border: 1px solid #f0f0f0;
  background: #fafafa; cursor: pointer; transition: all 0.15s;
}
.bookmark-item:hover { background: rgba(24,144,255,0.06); border-color: rgba(24,144,255,0.2); }
.bookmark-icon { color: #1890ff; flex-shrink: 0; display: flex; }
.bookmark-info { flex: 1; min-width: 0; }
.bookmark-title { font-size: 14px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bookmark-del {
  width: 18px; height: 18px; border: none; background: rgba(0,0,0,0.05);
  border-radius: 4px; cursor: pointer; font-size: 10px; color: #999;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.bookmark-del:hover { background: #ff4d4f; color: #fff; }

/* ===== 右侧面板 ===== */
/* ===== 底部弹出面板 ===== */
.bottom-panel {
  position: fixed;
  bottom: 92px;
  left: 50%;
  transform: translateX(-50%);
  width: min(92vw, 390px);
  max-height: min(48vh, 460px);
  background: rgba(255, 252, 246, 0.88);
  backdrop-filter: blur(24px) saturate(1.1);
  -webkit-backdrop-filter: blur(24px) saturate(1.1);
  border-radius: var(--qr-radius-xl);
  border: 1px solid var(--qr-border);
  box-shadow: var(--qr-shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 110;
}
.bottom-panel-hd {
  padding: 14px 16px;
  border-bottom: 1px solid var(--qr-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 700;
  color: var(--qr-text-primary);
  flex-shrink: 0;
  white-space: nowrap;
}
.close-btn {
  width: 32px; height: 32px;
  border: none;
  background: rgba(31,41,55,0.05);
  border-radius: 999px;
  cursor: pointer;
  color: var(--qr-text-secondary);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.close-btn:hover { background: rgba(31,41,55,0.09); color: var(--qr-text-primary); }
.close-btn:active { transform: scale(0.92); }
.bottom-panel-bd { flex: 1; overflow-y: auto; padding: 12px; min-height: 0; }

/* 过渡动画 */
.panel-slide-up-enter-active, .panel-slide-up-leave-active { transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s cubic-bezier(0.4,0,0.2,1); }
.panel-slide-up-enter-from, .panel-slide-up-leave-to { transform: translateX(-50%) translateY(100%); opacity: 0; }

/* ===== 紧凑面板卡片 ===== */
.panel-card {
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid var(--qr-border);
  border-radius: var(--qr-radius-md);
  padding: 13px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.panel-card + .panel-card { margin-top: 10px; }
.card-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--qr-text-secondary);
  text-transform: none;
  letter-spacing: 0.3px;
  margin-bottom: -2px;
}
.panel-card.card-danger { border-color: rgba(239,68,68,0.15); }

/* ===== 朗读面板 - 水平紧凑布局 ===== */
.read-aloud-panel { display: flex; flex-direction: column; gap: 8px; }

/* 播放主控卡 — 现代净白风，去伪饰 */
.ra-hero-card {
  padding: 16px 14px 14px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(59, 130, 246, 0.08);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  position: relative;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.ra-hero-card.is-playing {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(59, 130, 246, 0.18);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.06);
}
.ra-hero-card.is-error {
  background: rgba(255, 252, 250, 0.78);
  border-color: rgba(239, 68, 68, 0.12);
}

.ra-hero-top { display: flex; justify-content: center; margin-bottom: 12px; position: relative; }
.ra-status-pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 999px;
  background: rgba(100, 116, 139, 0.06);
  font-size: 11px; color: #64748b; font-weight: 500;
  letter-spacing: 0.02em;
}
.is-playing .ra-status-pill {
  background: rgba(59, 130, 246, 0.08);
  color: #2563eb;
}
.is-error .ra-status-pill { color: #ef4444; background: rgba(239, 68, 68, 0.06); }
.ra-status-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; flex-shrink: 0;
}
.is-playing .ra-status-dot {
  background: #3b82f6; box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
  animation: ra-pulse 1.6s ease-out infinite;
}
.is-error .ra-status-dot { background: #ef4444; }

/* 播放按钮 — 克制扁平蓝 + 微阴影 */
.ra-hero-play { display: flex; align-items: center; justify-content: center; gap: 0; position: relative; }
.ra-play-btn {
  width: 48px; height: 48px; border-radius: 50%; border: none;
  background: #3b82f6;
  color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease;
}
.ra-play-btn:hover { transform: scale(1.06); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.32); }
.ra-play-btn:active { transform: scale(0.96); box-shadow: 0 1px 4px rgba(59, 130, 246, 0.2); }
.ra-play-btn:disabled { background: #cbd5e1; box-shadow: none; cursor: not-allowed; }

.is-playing .ra-play-btn {
  background: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
  animation: ra-btn-pulse 2.5s ease-in-out infinite;
}
.is-playing .ra-play-btn:hover {
  background: #1d4ed8;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
}

.is-error .ra-play-btn {
  background: #ef4444;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
}

/* 声波条 — 极弱化，避免与按钮竞争 */
.ra-wave { display: flex; align-items: flex-end; gap: 2px; height: 18px; opacity: 0.6; margin-left: 12px; }
.ra-wave span {
  display: block; width: 2px; border-radius: 1px;
  background: rgba(59, 130, 246, 0.6);
  animation: ra-wave-bar 1.2s ease-in-out infinite;
}
.ra-wave span:nth-child(1) { height: 35%; animation-delay: 0s; }
.ra-wave span:nth-child(2) { height: 65%; animation-delay: 0.12s; }
.ra-wave span:nth-child(3) { height: 90%; animation-delay: 0.24s; }
.ra-wave span:nth-child(4) { height: 55%; animation-delay: 0.36s; }
.ra-wave span:nth-child(5) { height: 30%; animation-delay: 0.48s; }

.ra-hero-hint { text-align: center; margin-top: 8px; font-size: 11px; color: #94a3b8; letter-spacing: 0.02em; }

/* 音色胶囊按钮网格 */
.ra-voice-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px;
}
@media (max-width: 380px) {
  .ra-voice-grid { grid-template-columns: 1fr; }
}
.ra-voice-chip {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 9px; border-radius: 10px;
  border: 1.5px solid #e8edf3; background: rgba(255,255,255,0.7);
  cursor: pointer; transition: all 0.2s; text-align: left;
  font-family: inherit;
}
.ra-voice-chip:hover { border-color: #93c5fd; background: rgba(59,130,246,0.05); transform: translateY(-1px); }
.ra-voice-chip.active {
  border-color: #3b82f6;
  background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.06));
  box-shadow: 0 3px 10px rgba(59,130,246,0.15);
}
.ra-voice-avatar {
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600; color: #fff;
}
.ra-voice-avatar.f { background: linear-gradient(135deg, #f472b6, #ec4899); }
.ra-voice-avatar.m { background: linear-gradient(135deg, #38bdf8, #0ea5e9); }
.ra-voice-info { display: flex; flex-direction: column; min-width: 0; line-height: 1.3; }
.ra-voice-name { font-size: 12px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ra-voice-chip.active .ra-voice-name { color: #2563eb; }
.ra-voice-style { font-size: 10px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 语速行 */
.ra-rate-row { display: flex; align-items: center; gap: 10px; margin-top: 6px; padding: 0 2px; }
.ra-rate-row input[type="range"] { flex: 1; height: 4px; -webkit-appearance: none; background: #e2e8f0; border-radius: 2px; outline: none; }
.ra-rate-row input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  box-shadow: 0 2px 6px rgba(59,130,246,0.4); cursor: pointer; transition: transform 0.15s;
}
.ra-rate-row input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.2); }
.ra-rate-row .setting-value { min-width: 36px; text-align: center; font-size: 13px; font-weight: 600; color: #3b82f6; font-variant-numeric: tabular-nums; }

/* ===== 书架面板 ===== */
.shelf-panel { min-height: 120px; }
/* 头部 "返回书架" 按钮 */
.shelf-goto-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 6px;
  background: rgba(255,255,255,0.6);
  color: #64748b;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s;
  line-height: 1;
}
.shelf-goto-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: rgba(59,130,246,0.06);
}
.panel-hd-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.shelf-grid { display: flex; flex-direction: column; gap: 6px; }
.shelf-card {
  display: flex; flex-direction: row; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.04);
  cursor: pointer; transition: all 0.2s; background: rgba(255,255,255,0.6);
}
.shelf-card:hover { border-color: #3b82f6; background: rgba(59,130,246,0.06); transform: translateX(2px); box-shadow: 0 2px 8px rgba(59,130,246,0.1); }
.shelf-cover-img {
  width: 40px; height: 54px; border-radius: 5px; overflow: hidden; flex-shrink: 0; position: relative;
  background: #f0f0f0; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.shelf-cover-img img { width: 100%; height: 100%; object-fit: cover; }
.shelf-format-tag {
  position: absolute; top: 2px; left: 2px;
  font-size: 8px; font-weight: 700; color: #fff; letter-spacing: 0.3px;
  background: rgba(0,0,0,0.5); border-radius: 3px; padding: 1px 3px;
  backdrop-filter: blur(4px); line-height: 1.2;
}
.shelf-progress-track {
  position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
  background: rgba(0,0,0,0.15);
}
.shelf-progress-fill {
  height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 0 2px 0 0; transition: width 0.3s;
}
.shelf-info { text-align: left; width: 100%; overflow: hidden; display: flex; flex-direction: column; gap: 2px; }
.shelf-name { font-size: 13px; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; line-height: 1.3; }
.shelf-author { font-size: 11px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.2; }
.shelf-meta { display: flex; gap: 8px; align-items: center; }
.shelf-pct { font-size: 11px; font-weight: 600; color: #3b82f6; }
.shelf-time { font-size: 10px; color: #94a3b8; }

/* ===== 设置面板 - 紧凑网格 ===== */
.settings-panel { display: flex; flex-direction: column; gap: 0; }
.setting-group { display: flex; flex-direction: column; gap: 6px; }
.setting-group + .setting-group { margin-top: 8px; }
.setting-group:last-child { margin-bottom: 0; }
.group-label {
  font-size: 11px; color: #64748b; font-weight: 500;
  letter-spacing: 0.3px;
}
.group-value {
  display: inline-block; min-width: 16px; text-align: center;
  font-size: 11px; font-weight: 700; color: #3b82f6;
  background: rgba(59,130,246,0.08); border-radius: 4px;
  padding: 0 4px; margin-left: 4px; font-variant-numeric: tabular-nums;
}

/* 紧凑 +/- 控制按钮 */
.size-control { display: flex; align-items: center; gap: 8px; }
.size-control button {
  width: 30px; height: 30px; border: 1.5px solid #e2e8f0; border-radius: 8px;
  background: rgba(255,255,255,0.8); cursor: pointer;
  font-size: 15px; font-weight: 400; color: #64748b;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}
.size-control button:hover {
  border-color: #3b82f6; color: #3b82f6;
  background: rgba(59,130,246,0.06);
  box-shadow: 0 2px 8px rgba(59,130,246,0.15);
}
.size-control button:active { transform: scale(0.94); }
.size-dots { flex: 1; display: flex; gap: 6px; justify-content: center; }
.dot {
  width: 10px; height: 10px; border-radius: 3px; background: #e2e8f0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.dot.active {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  box-shadow: 0 2px 6px rgba(59,130,246,0.35);
  transform: scale(1.1);
}

/* 设置两列布局 */
.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.settings-grid .panel-card { margin-top: 0; }

/* 阅读方式切换 */
.mode-switch {
  display: flex;
  gap: 0;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 2px;
  width: fit-content;
}
.mode-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 7px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: "Kaiti SC", "STKaiti", "KaiTi", "AR PL UKai CN", serif;
}
.mode-btn.active {
  background: #fff;
  color: #3b82f6;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  font-weight: 600;
}
.mode-btn:hover:not(.active) { color: #64748b; }

/* 主题切换 */
.theme-grid { display: flex; gap: 8px; }
.theme-btn {
  flex: 1; height: 34px; border: 2px solid transparent; border-radius: 8px;
  cursor: pointer; font-size: 12px; font-weight: 500;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: "Kaiti SC", "STKaiti", "KaiTi", "AR PL UKai CN", serif;
}
.theme-btn:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,0.1); }
.theme-btn:active { transform: translateY(0) scale(0.97); }
.theme-grid .theme-btn:first-child { background: #fff; color: #333; border-color: #e8e8e8; }
.theme-grid .theme-btn:first-child.active { border-color: #333; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.theme-grid .theme-btn:nth-child(2) { background: #2d2d2d; color: #fff; border-color: #444; }
.theme-grid .theme-btn:nth-child(2).active { border-color: #3b82f6; box-shadow: 0 2px 10px rgba(59,130,246,0.35); }
.theme-grid .theme-btn:nth-child(3) { background: #e8f0e3; color: #3a5a3a; border-color: #c8dba0; }
.theme-grid .theme-btn:nth-child(3).active { border-color: #5a9e42; box-shadow: 0 2px 10px rgba(90,158,66,0.3); }
.theme-grid .theme-btn:nth-child(4) { background: #ede0c8; color: #3d2a00; border-color: #d4c5a9; }
.theme-grid .theme-btn:nth-child(4).active { border-color: #8b6914; box-shadow: 0 2px 10px rgba(139,105,20,0.25); }

/* 字体风格 */
.font-family-grid {
  display: flex; flex-wrap: wrap; gap: 6px;
}
.font-btn {
  flex: 0 0 auto; padding: 5px 10px; border: 1.5px solid #e2e8f0; border-radius: 8px;
  background: rgba(255,255,255,0.6); cursor: pointer; font-size: 12px; color: #64748b;
  text-align: center; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}
.font-btn:hover { border-color: #3b82f6; color: #3b82f6; background: rgba(59,130,246,0.06); }
.font-btn.active {
  border-color: #3b82f6; background: rgba(59,130,246,0.1);
  color: #3b82f6; font-weight: 600;
  box-shadow: 0 1px 4px rgba(59,130,246,0.12);
}

/* 危险按钮 */
.danger-btn {
  width: 100%;
  padding: 10px 14px; border: 1.5px solid #fecaca; border-radius: 10px;
  background: rgba(254,242,242,0.8); cursor: pointer; font-size: 13px; color: #ef4444;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: "Kaiti SC", "STKaiti", "KaiTi", "AR PL UKai CN", serif;
}
.danger-btn:hover {
  background: #ef4444; color: #fff; border-color: #ef4444;
  box-shadow: 0 4px 12px rgba(239,68,68,0.3);
  transform: translateY(-1px);
}
.danger-btn:active { transform: scale(0.98); }

/* 段落高亮 - 朗读追踪 */
.reader-content p.read-aloud-active,
.reader-page-mode p.read-aloud-active {
  background: rgba(24,144,255,0.12);
  border-left: 3px solid #1890ff;
  padding-left: 12px;
  border-radius: 0 4px 4px 0;
  transition: all 0.3s ease;
  box-shadow: inset 0 0 0 1px rgba(24,144,255,0.06);
}

/* 朗读期间段落可点击提示 */
.reader-content p.clickable-during-tts,
.reader-page-mode p.clickable-during-tts {
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.reader-content p.clickable-during-tts:hover:not(.read-aloud-active),
.reader-page-mode p.clickable-during-tts:hover:not(.read-aloud-active) {
  background: rgba(24,144,255,0.06);
  border-left: 2px solid rgba(24,144,255,0.4);
  padding-left: 13px;
}
.theme-dark .reader-content p.read-aloud-active,
.theme-dark .reader-page-mode p.read-aloud-active {
  background: rgba(24,144,255,0.2);
  border-left-color: #40a9ff;
  box-shadow: inset 0 0 0 1px rgba(64,169,255,0.1);
}
.theme-dark .chapter-end-nav {
  border-top-color: rgba(255,255,255,0.08);
}
.theme-dark .chapter-end-btn {
  background: linear-gradient(180deg, rgba(20,28,50,0.8) 0%, rgba(8,12,28,0.8) 100%);
  border-color: rgba(60,100,200,0.2);
  color: #8ea4c4;
  box-shadow: 0 3px 0 rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.2);
}
.theme-dark .chapter-end-btn:hover:not(:disabled) {
  border-color: #40a9ff;
  color: #40a9ff;
  background: linear-gradient(180deg, rgba(64,169,255,0.15) 0%, rgba(64,169,255,0.08) 100%);
  box-shadow: 0 3px 0 rgba(64,169,255,0.4), 0 4px 12px rgba(64,169,255,0.2);
}
.theme-dark .chapter-end-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2);
}
.theme-dark .chapter-end-divider {
  background: rgba(255,255,255,0.1);
}

/* 全屏导航 - 底部悬浮，鼠标靠近底部时显示 */
.fullnav { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; z-index: 100; padding: 6px; background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.3); opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
.fullnav.visible { opacity: 1; pointer-events: auto; }
.fullnav .nav-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.15); color: #fff; cursor: pointer; font-size: 14px; font-weight: 500; font-family: "Kaiti SC", "STKaiti", "KaiTi", "AR PL UKai CN", serif; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.2s; display: flex; align-items: center; }
.fullnav .nav-btn:hover:not(:disabled) { background: rgba(255,255,255,0.35); transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.4); border-color: #fff; }
.fullnav .nav-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.full-chapter-wrapper { display: flex; align-items: center; min-width: 60px; justify-content: center; }
.chapter-indicator.full-screen {
  background: transparent;
  border: none;
  box-shadow: none;
  color: #fff;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 15px;
  font-weight: 600;
  padding: 4px 10px;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 6px;
  letter-spacing: 0.5px;
}
.chapter-indicator.full-screen:hover { background: rgba(255,255,255,0.15); }

.chapter-jump-input-wrapper.full-screen { width: 70px; }
.chapter-input.full-screen {
  width: 100%;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 6px;
  padding: 4px 6px;
  font-size: 14px;
  font-family: 'Georgia', serif;
  color: #fff;
  text-align: center;
  outline: none;
}
.chapter-input.full-screen::placeholder { color: rgba(255,255,255,0.5); }

/* 全屏目录按钮 */
.toc-float { position: fixed; left: 12px; top: 50%; transform: translateY(-50%); z-index: 110; padding: 6px 10px; border-radius: 6px; border: none; background: rgba(0,0,0,0.4); color: #fff; cursor: pointer; font-size: 12px; }

/* 全屏目录浮层 */
.full-toc-overlay { position: fixed; inset: 0; z-index: 120; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; padding: 20px; }
.full-toc { width: 100%; max-width: 360px; max-height: 70vh; background: #fff; border-radius: 10px; display: flex; flex-direction: column; overflow: hidden; }
.full-toc-hd { padding: 10px 14px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; font-size: 14px; flex-shrink: 0; }
.full-toc-bd { flex: 1; overflow-y: auto; padding: 6px 0; }
.full-toc-item { display: flex; align-items: center; gap: 6px; padding: 8px 12px; cursor: pointer; font-size: 15px; }
.full-toc-item .toc-icon { width: 14px; height: 14px; color: #999; flex-shrink: 0; display: block; margin-top: 1px; }
.full-toc-item.active { background: rgba(24,144,255,0.1); border-left: 3px solid #1890ff; font-weight: 600; }
.full-toc-item.active .toc-icon { color: #1890ff; }

/* 主题适配 - 月光风格（透明背景，让 body 星空透过） */
.theme-dark {
  background: transparent;
  color: #c8daf8;
  position: relative;
}
.theme-dark .reader-sidebar { background: rgba(8, 12, 28, 0.78); border-color: rgba(60,100,200,0.15); color: #c8daf8; }
.theme-dark .sidebar-header { border-color: rgba(60,100,200,0.15); color: #c8daf8; }
.theme-dark .toc-item { color: #c8daf8; }
.theme-dark .toc-item:hover { background: rgba(124, 179, 245, 0.08); }
.theme-dark .toc-item.active { background: rgba(24,144,255,0.15); border-left-color: #1890ff; color: #c8daf8; }
.theme-dark .toc-icon { color: #8ea4c4; }
.theme-dark .collapse-btn { color: #8ea4c4; }
.theme-dark .collapse-btn:hover { background: rgba(24,144,255,0.2); color: #1890ff; }
.theme-dark .hl-toolbar { background: rgba(20,28,50,0.7); border-color: rgba(60,100,200,0.2); }
.theme-dark .hl-toolbar::after { border-top-color: rgba(20,28,50,0.7); }
.theme-dark .hl-btn { background: rgba(60,100,200,0.1); border-color: rgba(60,100,200,0.25); color: #c8daf8; }
.theme-dark .hl-btn:hover { background: rgba(60,100,200,0.2); }
.theme-dark .hl-btn-save { background: #1890ff; color: #fff; border-color: #1890ff; }
.theme-dark .hl-btn-save:hover { background: #40a9ff; }
.theme-dark .hl-note-input { background: rgba(60,100,200,0.1); border-color: rgba(60,100,200,0.2); color: #c8daf8; }
.theme-dark .hl-note-input:focus { border-color: #1890ff; }
.theme-dark .home-btn, .theme-dark .library-btn {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
  color: #c8daf8;
}
.theme-dark .home-btn:hover, .theme-dark .library-btn:hover {
  background: rgba(255,255,255,0.18);
  border-color: rgba(255,255,255,0.3);
  color: #c8daf8;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.theme-dark .tool-btn {
  background: transparent;
  color: #94a3b8;
}
.theme-dark .tool-btn:hover {
  background: rgba(255,255,255,0.08);
  color: #e2e8f0;
}
.theme-dark .tool-btn:active {
  transform: translateY(0) scale(0.96);
}
.theme-dark .tool-btn.active {
  background: rgba(59,130,246,0.15);
  color: #60a5fa;
}
.theme-dark .bot-btn {
  background: rgba(10, 14, 35, 0.55);
  border-color: rgba(100, 150, 255, 0.18);
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  color: #8ea4c4;
}
.theme-dark .bot-han { color: #c8daf8; }
.theme-dark .bot-btn:hover {
  background: rgba(15, 20, 50, 0.7);
  border-color: rgba(100, 150, 255, 0.3);
  box-shadow: 0 2px 8px rgba(100,150,255,0.15);
  color: #e8d8c0;
}
.theme-dark .bot-btn:hover .bot-han { color: #e8d8c0; }
.theme-dark .bot-btn.active { background: rgba(15, 20, 50, 0.6); border-color: rgba(100, 150, 255, 0.35); color: #c8daf8; }
.theme-dark .bot-btn.active .bot-han { color: #c8daf8; }
.theme-dark .bot-btn.tts-playing { color: #d4a040; }
.theme-dark .bot-btn.tts-playing .bot-han { color: #d4a040; letter-spacing: 0.16em; }
.theme-dark .bot-btn.tts-paused { color: #d4a040; }
.theme-dark .bot-btn.tts-paused .bot-han { color: #d4a040; }
.theme-dark .tool-btn.active::before { background: #60a5fa; }
.theme-dark .annotation-item { background: rgba(20,28,50,0.7); border-color: rgba(60,100,200,0.15); }
.theme-dark .annotation-text { color: #c8daf8; }
.theme-dark .annotation-note { color: #8ea4c4; background: rgba(255,255,255,0.05); }
.theme-dark .annotation-chapter { color: #8ea4c4; }
.theme-dark .shelf-name { color: #e2e8f0; }
.theme-dark .shelf-author { color: #64748b; }
.theme-dark .shelf-pct { color: #60a5fa; }
.theme-dark .shelf-time { color: #64748b; }
.theme-dark .shelf-format-tag { background: rgba(0,0,0,0.6); }
.theme-dark .shelf-progress-track { background: rgba(255,255,255,0.15); }
.theme-dark .annotation-filter-select { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); color: #e2e8f0; }
.theme-dark .annotation-filter-select:hover { border-color: #60a5fa; }
.theme-dark .group-value { color: #60a5fa; background: rgba(96,165,250,0.12); }
.theme-dark .bookmark-item { background: rgba(10,15,40,0.7); border-color: rgba(60,100,200,0.1); }
.theme-dark .bookmark-item:hover { background: rgba(60,100,200,0.08); border-color: rgba(80,120,220,0.2); }
.theme-dark .bookmark-title { color: #c8daf8; }
.theme-dark .bm-add-btn { border-color: rgba(60,100,200,0.15); color: #8ea4c4; }
.theme-dark .bm-add-btn:hover { border-color: #7ca3f5; color: #7ca3f5; background: rgba(124,163,245,0.1); }
.theme-dark .bottom-panel, .theme-dark .full-toc { background: rgba(8,12,28,0.4); border-color: rgba(60,100,200,0.08); backdrop-filter: blur(28px) saturate(1.4); }
.theme-dark .bottom-panel-hd { border-color: rgba(60,100,200,0.06); color: #c8daf8; }
.theme-dark .bottom-bar { background: rgba(8,12,28,0.25); border-color: rgba(60,100,200,0.06); backdrop-filter: blur(28px) saturate(1.5); box-shadow: 0 4px 24px rgba(0,0,0,0.2); }
.theme-dark .close-btn { background: rgba(60,100,200,0.06); color: #8ea4c4; }
.theme-dark .close-btn:hover { background: rgba(60,100,200,0.12); color: #c8daf8; }
.theme-dark .panel-card { background: rgba(60,100,200,0.04); border-color: rgba(60,100,200,0.08); }
/* 朗读面板 - 暗色适配 */
.theme-dark .settings-panel {
  background: rgba(255, 255, 255, 0.03);
  color: var(--qr-text-primary);
}
.theme-dark .setting-group {
  border-color: rgba(255, 255, 255, 0.04);
}
.theme-dark .group-label {
  color: #94a3b8;
}
.theme-dark .mode-switch {
  background: rgba(255, 255, 255, 0.06);
}
.theme-dark .mode-btn {
  color: #94a3b8;
}
.theme-dark .mode-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #60a5fa;
}
.theme-dark .size-control button {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #94a3b8;
}
.theme-dark .size-control button:hover {
  border-color: #60a5fa;
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.08);
}
.theme-dark .size-dots .dot {
  background: rgba(255, 255, 255, 0.12);
}
.theme-dark .size-dots .dot.active {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  box-shadow: 0 2px 6px rgba(96, 165, 250, 0.4);
}
.theme-dark .font-btn {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: #94a3b8;
}
.theme-dark .font-btn:hover {
  border-color: #60a5fa;
  color: #60a5fa;
}
.theme-dark .font-btn.active {
  border-color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
  color: #60a5fa;
}
.theme-dark .danger-btn {
  border-color: rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.08);
  color: #f87171;
}
.theme-dark .danger-btn:hover {
  background: #dc2626;
  color: #fff;
}

/* 朗读面板 - 星空适配（现代暗色） */
.theme-dark .ra-hero-card {
  background: rgba(10, 14, 30, 0.66);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-color: rgba(80, 130, 220, 0.12);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
}
.theme-dark .ra-hero-card.is-playing {
  background: rgba(10, 14, 30, 0.78);
  border-color: rgba(80, 130, 220, 0.22);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
}
.theme-dark .ra-hero-card.is-error {
  background: rgba(30, 12, 14, 0.7);
  border-color: rgba(239, 68, 68, 0.14);
}
.theme-dark .ra-status-pill {
  background: rgba(60, 100, 200, 0.06);
  color: #8ea4c4;
}
.theme-dark .is-playing .ra-status-pill {
  color: #7ca3f5;
  background: rgba(59, 130, 246, 0.08);
}
.theme-dark .ra-hero-hint { color: #5e7294; }
.theme-dark .ra-voice-chip {
  background: rgba(60, 100, 200, 0.04);
  border-color: rgba(60, 100, 200, 0.08);
}
.theme-dark .ra-voice-chip:hover {
  background: rgba(80, 130, 230, 0.08);
  border-color: rgba(80, 130, 230, 0.2);
}
.theme-dark .ra-voice-chip.active {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(80, 130, 230, 0.28);
}
.theme-dark .ra-voice-name { color: #c8daf8; }
.theme-dark .ra-voice-style { color: #5e7294; }
.theme-dark .ra-voice-chip.active .ra-voice-name { color: #93c5fd; }
.theme-dark .ra-rate-row input[type="range"] { background: rgba(60, 100, 200, 0.1); }
.theme-dark .ra-rate-row input[type="range"]::-webkit-slider-thumb { background: #4a80e0; }
.theme-dark .ra-rate-row .setting-value { color: #93c5fd; }
.theme-dark .is-playing .ra-play-btn {
  background: #3b6cc8;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}
.theme-dark .is-error .ra-play-btn {
  background: #dc2626;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}
.theme-dark .shelf-card { background: rgba(60,100,200,0.06); border-color: rgba(60,100,200,0.08); }
.theme-dark .shelf-card:hover { background: rgba(80,130,230,0.1); border-color: rgba(80,130,230,0.25); }
.theme-dark .shelf-name { color: #c8daf8; }
.theme-dark .weight-btn { background: rgba(20,28,50,0.7); border-color: rgba(60,100,200,0.1); color: #8ea4c4; }
.theme-dark .weight-btn.active { background: #3b6cc8; color: #fff; border-color: #4a80e0; }
.theme-dark .theme-grid .theme-btn:first-child { background: rgba(60,100,200,0.15); color: #c8daf8; border-color: rgba(60,100,200,0.25); }
.theme-dark .theme-grid .theme-btn:first-child.active { border-color: #3b6cc8; }
.theme-dark .theme-grid .theme-btn:nth-child(2) { background: linear-gradient(180deg, #0a0f20 0%, #050810 100%); color: #8ea4c4; }
.theme-dark .theme-grid .theme-btn:nth-child(2).active { border-color: #3b6cc8; }
.theme-dark .theme-grid .theme-btn:nth-child(3) { background: #3a4a3a; color: #b8d8b0; }
.theme-dark .theme-grid .theme-btn:nth-child(3).active { border-color: #5a9e42; }
.theme-dark .size-control button {
  background: linear-gradient(180deg, rgba(20,28,50,0.7) 0%, rgba(8,12,28,0.7) 100%);
  border-color: rgba(60,100,200,0.2); color: #c8daf8;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.theme-dark .size-control button:hover {
  background: linear-gradient(180deg, rgba(60,100,200,0.2) 0%, rgba(20,28,50,0.7) 100%);
  border-color: #1890ff; color: #40a9ff;
  box-shadow: 0 2px 8px rgba(24,144,255,0.25);
}
.theme-dark .dot { background: rgba(60,100,200,0.2); }
.theme-dark .dot.active {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  box-shadow: 0 2px 6px rgba(24,144,255,0.4);
}
.theme-dark .mode-switch { background: rgba(20,28,50,0.5); }
.theme-dark .mode-btn { color: #8ea4c4; }
.theme-dark .mode-btn:hover:not(.active) { background: rgba(255,255,255,0.05); color: #c8daf8; }
.theme-dark .mode-btn.active {
  background: rgba(60,100,200,0.15); color: #40a9ff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.theme-dark .font-family-grid { background: transparent; }
.theme-dark .font-btn { color: #8ea4c4; background: rgba(20,28,50,0.5); border-color: rgba(60,100,200,0.15); }
.theme-dark .font-btn:hover { color: #c8daf8; border-color: #40a9ff; background: rgba(60,100,200,0.15); }
.theme-dark .font-btn.active {
  background: rgba(60,100,200,0.15); color: #40a9ff; border-color: #40a9ff;
  box-shadow: 0 1px 4px rgba(64,169,255,0.2);
}
.theme-dark .nav-circle {
  background: rgba(10,15,40,0.65);
  border-color: rgba(80,120,220,0.15);
  color: #8ea4c4;
  box-shadow: 0 8px 22px rgba(0,0,0,0.45),
              0 2px 6px rgba(0,0,0,0.25),
              0 0 0 1px rgba(80,120,220,0.08) inset;
}
.theme-dark .nav-circle:hover:not(:disabled) {
  border-color: rgba(64,169,255,0.5);
  color: #93c5fd;
  background: rgba(15,25,55,0.88);
  box-shadow: 0 14px 34px rgba(64,169,255,0.3),
              0 0 0 1px rgba(64,169,255,0.2) inset;
}
.theme-dark .nav-circle:active:not(:disabled) { background: rgba(64,169,255,0.18); }
.theme-dark .info-chapter-btn {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.15);
  color: #8ea4c4;
}
.theme-dark .info-chapter-btn:hover:not(:disabled) {
  background: rgba(64,169,255,0.15);
  border-color: #40a9ff;
  color: #40a9ff;
}
.theme-dark .danger-btn {
  background: rgba(255,77,79,0.1); border-color: rgba(255,77,79,0.3);
  color: #ff7875;
}
.theme-dark .danger-btn:hover {
  background: #ff4d4f; color: #fff; border-color: #ff4d4f;
  box-shadow: 0 4px 12px rgba(255,77,79,0.4);
}
.theme-dark .nav-btn { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: #c8daf8; font-family: "Kaiti SC", "STKaiti", "KaiTi", "AR PL UKai CN", serif; }

/* 护眼模式 — 树影光斑（透明底，让 body 光斑透过） */
.theme-green { background: transparent; color: #3a5a3a; }
.theme-green .reader-toolbar { background: rgba(232,240,227,0.82); border-color: #d4e8c8; }
.theme-green .reader-sidebar { background: rgba(232,240,227,0.82); border-color: #d4e8c8; }
.theme-green .sidebar-header { border-color: #d4e8c8; }
.theme-green .toc-item { color: #3a5a3a; }
.theme-green .toc-item:hover { background: rgba(46,74,46,0.08); }
.theme-green .toc-item.active { background: rgba(90,158,66,0.12); border-left-color: #5a9e42; color: #1e3a1e; }
.theme-green .toc-icon { color: #8aaa80; }
.theme-green .collapse-btn { color: #7aa86a; }
.theme-green .collapse-btn:hover { background: rgba(90,158,66,0.12); color: #5a9e42; }
.theme-green .hl-toolbar { background: #e8f0e3; border-color: #d4e8c8; }
.theme-green .hl-toolbar::after { border-top-color: #e8f0e3; }
.theme-green .hl-btn { background: #f0f7eb; border-color: #c8dba0; color: #3a5a3a; }
.theme-green .hl-btn:hover { background: #d8e8d0; }
.theme-green .hl-btn-save { background: #5a9e42; color: #fff; border-color: #5a9e42; }
.theme-green .hl-btn-save:hover { background: #6db85a; }
.theme-green .hl-note-input { background: #f0f7eb; border-color: #c8dba0; color: #3a5a3a; }
.theme-green .hl-note-input:focus { border-color: #5a9e42; }
.theme-green .annotation-item { background: #f0f7eb; border-color: #d4e8c8; }
.theme-green .annotation-text { color: #3a5a3a; }
.theme-green .annotation-note { color: #6a8a6a; background: rgba(46,74,46,0.06); }
.theme-green .annotation-chapter { color: #8aaa80; }
.theme-green .bookmark-item { background: #f0f7eb; border-color: #d4e8c8; }
.theme-green .bookmark-item:hover { background: rgba(90,158,66,0.08); border-color: rgba(90,158,66,0.2); }
.theme-green .bookmark-title { color: #3a5a3a; }
.theme-green .bm-add-btn { border-color: #c8dba0; color: #7aa86a; }
.theme-green .bm-add-btn:hover { border-color: #5a9e42; color: #5a9e42; background: rgba(90,158,66,0.06); }
.theme-green .bottom-bar { background: rgba(232,240,227,0.12); border-color: rgba(180,210,160,0.5); backdrop-filter: blur(28px) saturate(1.8); box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
.theme-green .bottom-panel, .theme-green .full-toc { background: rgba(232,240,227,0.45); border-color: #d4e8c8; backdrop-filter: blur(16px); }
.theme-green .shelf-card { background: #f0f7eb; border-color: #d4e8c8; }
.theme-green .weight-btn { background: #f0f7eb; border-color: #c8dba0; }
.theme-green .weight-btn.active { background: #5a9e42; color: #fff; border-color: #5a9e42; }
.theme-green .theme-grid .theme-btn:first-child { background: #f0f7eb; color: #3a5a3a; border-color: #c8dba0; }
.theme-green .theme-grid .theme-btn:first-child.active { border-color: #3a5a3a; }
.theme-green .theme-grid .theme-btn:nth-child(2) { background: #3a4a3a; color: #e0f0e0; }
.theme-green .theme-grid .theme-btn:nth-child(2).active { border-color: #5a9e42; }
.theme-green .theme-grid .theme-btn:nth-child(3) { background: #d8e8d0; color: #2d4a2d; }
.theme-green .theme-grid .theme-btn:nth-child(3).active { border-color: #5a9e42; }
.theme-green .size-control button {
  background: linear-gradient(180deg, #f0f7eb 0%, #e8f0e3 100%);
  border-color: #c8dba0; color: #5a7a4a;
  box-shadow: 0 1px 2px rgba(90,158,66,0.1);
}
.theme-green .size-control button:hover {
  background: linear-gradient(180deg, #e8f5e0 0%, #d8e8d0 100%);
  border-color: #5a9e42; color: #3a7a2a;
  box-shadow: 0 2px 8px rgba(90,158,66,0.2);
}
.theme-green .font-family-grid { background: transparent; }
.theme-green .font-btn { color: #8aaa80; background: #e8f0e3; border-color: #c8dba0; }
.theme-green .font-btn:hover { color: #5a9e42; border-color: #5a9e42; background: #e8f0e3; }
.theme-green .font-btn.active {
  background: #e8f0e3; color: #2d4a2d; border-color: #5a9e42;
  box-shadow: 0 1px 4px rgba(90,158,66,0.15);
}
.theme-green .dot { background: #c8dba0; }
.theme-green .dot.active {
  background: linear-gradient(135deg, #5a9e42 0%, #73d13d 100%);
  box-shadow: 0 2px 6px rgba(90,158,66,0.35);
}
.theme-green .mode-switch { background: #d8e8d0; }
.theme-green .mode-btn { color: #8aaa80; }
.theme-green .mode-btn:hover:not(.active) { background: rgba(255,255,255,0.5); color: #6a8a5a; }
.theme-green .mode-btn.active {
  background: #f0f7eb; color: #5a9e42;
  box-shadow: 0 2px 8px rgba(90,158,66,0.15);
}
.theme-green .nav-circle {
  background: rgba(232,240,227,0.82);
  border-color: rgba(90,158,66,0.18);
  color: #5a7a4a;
  box-shadow: 0 8px 22px rgba(58,90,58,0.15),
              0 2px 6px rgba(58,90,58,0.08),
              0 0 0 1px rgba(255,255,255,0.4) inset;
}
.theme-green .nav-circle:hover:not(:disabled) {
  border-color: rgba(90,158,66,0.5);
  color: #3a7a2a;
  background: rgba(220,240,210,0.95);
  box-shadow: 0 14px 34px rgba(90,158,66,0.28),
              0 0 0 1px rgba(90,158,66,0.15) inset;
}
.theme-green .nav-circle:active:not(:disabled) { background: rgba(90,158,66,0.18); }
.theme-green .info-chapter-btn {
  background: rgba(90,158,66,0.1);
  border-color: rgba(200,219,160,0.6);
  color: #5a7a4a;
}
.theme-green .info-chapter-btn:hover:not(:disabled) {
  background: rgba(90,158,66,0.2);
  border-color: #5a9e42;
  color: #3a7a2a;
}
.theme-green .danger-btn {
  background: rgba(255,77,79,0.08); border-color: rgba(255,77,79,0.25);
  color: #c04040;
}
.theme-green .danger-btn:hover {
  background: #ff4d4f; color: #fff; border-color: #ff4d4f;
  box-shadow: 0 4px 12px rgba(255,77,79,0.3);
}
.theme-green .resize-bar:hover { background: rgba(46,74,46,0.1); }
.theme-green .nav-btn { background: #fff; color: #3a5a3a; border-color: #c8e0c0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); font-weight: 600; font-family: "Kaiti SC", "STKaiti", "KaiTi", "AR PL UKai CN", serif; }
.theme-green .nav-btn:hover:not(:disabled) { background: #f4f9f0; color: #1e3a1e; border-color: #a8c8a0; }
.theme-green .chapter-indicator { background: rgba(232,240,227,0.9); color: #3a5a3a; border-color: rgba(74,122,74,0.2); font-weight: 600; }
.theme-green .chapter-input { border-color: #c8e0c0; color: #1e3a1e; box-shadow: 0 2px 6px rgba(58,90,58,0.15); }
.theme-green .fullscreen-btn-float { background: #fff; color: #3a5a3a; border-color: #c8e0c0; }
.theme-green .fullscreen-btn-float:hover { background: #f4f9f0; color: #1e3a1e; }

.theme-dark .reader-main { background: #1a1a1a; color: #d0d0d0; border-color: #333; }
.theme-green .reader-main { background: #e8f0e3; color: #3a3a3a; border-color: #d4e8c8; }
.theme-green .zoom-btn { background: rgba(46,74,46,0.08); color: #3a5a3a; }
.theme-green .zoom-btn:hover { background: rgba(90,158,66,0.12); color: #5a9e42; }
.theme-green .zoom-slider { background: transparent; accent-color: #5a9e42; }
.theme-green .zoom-slider::-webkit-slider-runnable-track { background: rgba(46,74,46,0.15); }
.theme-green .zoom-slider::-webkit-slider-thumb { background: #5a9e42; border-color: #e8f0e3; }
.theme-green .zoom-slider::-moz-range-track { background: rgba(46,74,46,0.15); }
.theme-green .zoom-label { color: #3a5a3a; }

.theme-parchment { background: #f5e6c8; color: #3d2a00; }
.theme-parchment .reader-toolbar { background: rgba(245,230,200,0.9); border-color: #d4c5a9; }
.theme-parchment .reader-sidebar { background: #f5e6c8; border-color: #d4c5a9; }
.theme-parchment .sidebar-header { border-color: #d4c5a9; }
.theme-parchment .toc-item { color: #3d2a00; }
.theme-parchment .toc-item:hover { background: rgba(139,105,20,0.08); }
.theme-parchment .toc-item.active { background: rgba(139,105,20,0.12); border-left-color: #8b6914; color: #2a1a00; }
.theme-parchment .toc-icon { color: #8a7a5a; }
.theme-parchment .collapse-btn { color: #8a7a5a; }
.theme-parchment .collapse-btn:hover { background: rgba(139,105,20,0.12); color: #8b6914; }
.theme-parchment .hl-toolbar { background: #f5e6c8; border-color: #d4c5a9; }
.theme-parchment .hl-toolbar::after { border-top-color: #f5e6c8; }
.theme-parchment .hl-btn { background: #f0e6d0; border-color: #c9b894; color: #3d2a00; }
.theme-parchment .hl-btn:hover { background: #e0d0b0; }
.theme-parchment .hl-btn-save { background: #8b6914; color: #fff; border-color: #8b6914; }
.theme-parchment .hl-btn-save:hover { background: #a88520; }
.theme-parchment .hl-note-input { background: #f0e6d0; border-color: #c9b894; color: #3d2a00; }
.theme-parchment .hl-note-input:focus { border-color: #8b6914; }
.theme-parchment .annotation-item { background: #f0e6d0; border-color: #d4c5a9; }
.theme-parchment .annotation-text { color: #3d2a00; }
.theme-parchment .annotation-note { color: #7a6a4a; background: rgba(61,42,0,0.06); }
.theme-parchment .annotation-chapter { color: #8a7a5a; }
.theme-parchment .bookmark-item { background: #f0e6d0; border-color: #d4c5a9; }
.theme-parchment .bookmark-item:hover { background: rgba(139,105,20,0.08); border-color: rgba(139,105,20,0.2); }
.theme-parchment .bookmark-title { color: #3d2a00; }
.theme-parchment .bm-add-btn { border-color: #c9b894; color: #7a6a4a; }
.theme-parchment .bm-add-btn:hover { border-color: #8b6914; color: #8b6914; background: rgba(139,105,20,0.06); }
.theme-parchment .bottom-bar { background: rgba(245,230,200,0.12); border-color: rgba(200,180,150,0.5); backdrop-filter: blur(28px) saturate(1.8); box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
.theme-parchment .bottom-panel, .theme-parchment .full-toc { background: rgba(245,230,200,0.45); border-color: #d4c5a9; backdrop-filter: blur(16px); }
.theme-parchment .bottom-panel-hd { border-color: #d4c5a9; }
.theme-parchment .shelf-card { background: #f0e6d0; border-color: #d4c5a9; }
.theme-parchment .shelf-name { color: #3d2a00; }
.theme-parchment .weight-btn { background: #f0e6d0; border-color: #c9b894; color: #3d2a00; }
.theme-parchment .weight-btn.active { background: #8b6914; color: #fff; border-color: #8b6914; }
.theme-parchment .theme-grid .theme-btn:nth-child(1) { background: #f0e6d0; color: #3d2a00; border-color: #c9b894; }
.theme-parchment .theme-grid .theme-btn:nth-child(1).active { border-color: #3d2a00; }
.theme-parchment .theme-grid .theme-btn:nth-child(2) { background: #3d3d3d; color: #e8dcc8; }
.theme-parchment .theme-grid .theme-btn:nth-child(2).active { border-color: #8b6914; }
.theme-parchment .theme-grid .theme-btn:nth-child(3) { background: #d4c8a0; color: #3a4a2a; }
.theme-parchment .theme-grid .theme-btn:nth-child(3).active { border-color: #5a9e42; }
.theme-parchment .theme-grid .theme-btn:nth-child(4) { background: #dcc8a8; color: #2a1a00; }
.theme-parchment .theme-grid .theme-btn:nth-child(4).active { border-color: #8b6914; }
.theme-parchment .size-control button { background: #f0e6d0; border-color: #c9b894; color: #3d2a00; }
.theme-parchment .dot { background: #c9b894; }
.theme-parchment .dot.active { background: #8b6914; }
.theme-parchment .mode-switch { background: #e0d0b0; }
.theme-parchment .mode-btn { color: #7a6a4a; }
.theme-parchment .mode-btn.active { background: #f0e6d0; color: #8b6914; box-shadow: 0 1px 4px rgba(139,105,20,0.1); }
.theme-parchment .font-btn { background: #ede0c8; color: #8a7a5a; border-color: #d4c5a9; }
.theme-parchment .font-btn:hover { border-color: #8b6914; color: #3d2a00; }
.theme-parchment .font-btn.active { background: #ede0c8; color: #3d2a00; border-color: #8b6914; }
.theme-parchment .nav-circle {
  background: rgba(237,224,200,0.82);
  border-color: rgba(139,105,20,0.18);
  color: #7a6a4a;
  box-shadow: 0 8px 22px rgba(139,105,20,0.12),
              0 2px 6px rgba(139,105,20,0.08),
              0 0 0 1px rgba(255,255,255,0.4) inset;
}
.theme-parchment .nav-circle:hover:not(:disabled) {
  border-color: rgba(139,105,20,0.5);
  color: #3d2a00;
  background: rgba(235,218,185,0.95);
  box-shadow: 0 14px 34px rgba(139,105,20,0.28),
              0 0 0 1px rgba(139,105,20,0.15) inset;
}
.theme-parchment .nav-circle:active:not(:disabled) { background: rgba(139,105,20,0.15); }
.theme-parchment .info-chapter-btn {
  background: rgba(139,105,20,0.08);
  border-color: rgba(212,197,169,0.6);
  color: #7a6a4a;
}
.theme-parchment .info-chapter-btn:hover:not(:disabled) {
  background: rgba(139,105,20,0.15);
  border-color: #8b6914;
  color: #3d2a00;
}
.theme-parchment .close-btn { background: #d4c5a9; color: #3d2a00; }
.theme-parchment .danger-btn { border-color: #c04040; color: #c04040; }
.theme-parchment .danger-btn:hover { background: #c04040; color: #fff; }
.theme-parchment .nav-btn { background: rgba(255,255,255,0.3); color: #3d2a00; border-color: #c9b894; font-family: "Kaiti SC", "STKaiti", "KaiTi", "AR PL UKai CN", serif; }
.theme-parchment .reader-main { background: #f5e6c8; color: #3d2a00; border-color: #d4c5a9; }
.theme-parchment .pdf-zoom-controls { background: #fff; border-color: #ddd; }
.theme-parchment .zoom-btn { background: rgba(0,0,0,0.06); color: #555; }
.theme-parchment .zoom-btn:hover { background: rgba(24,144,255,0.15); color: #1890ff; }
.theme-parchment .zoom-slider { background: transparent; accent-color: #1890ff; }
.theme-parchment .zoom-slider::-webkit-slider-runnable-track { background: rgba(0,0,0,0.12); }
.theme-parchment .zoom-slider::-webkit-slider-thumb { background: #1890ff; border-color: #fff; }
.theme-parchment .zoom-slider::-moz-range-track { background: rgba(0,0,0,0.12); }
.theme-parchment .zoom-label { color: #555; }
.theme-parchment .annotation-zoom-divider { background: rgba(0,0,0,0.1); }
.theme-parchment .annotation-divider { background: rgba(0,0,0,0.1); }
.theme-parchment .reader-content p.read-aloud-active,
.theme-parchment .reader-page-mode p.read-aloud-active {
  background: rgba(139,105,20,0.12);
  border-left-color: #8b6914;
  box-shadow: inset 0 0 0 1px rgba(139,105,20,0.06);
}
.theme-green .turn-hint { color: rgba(58, 90, 58, 0.2); }
.theme-green .reader-content p.read-aloud-active,
.theme-green .reader-page-mode p.read-aloud-active {
  background: rgba(90,158,66,0.12);
  border-left-color: #5a9e42;
  box-shadow: inset 0 0 0 1px rgba(90,158,66,0.06);
}
.theme-green .chapter-end-nav {
  border-top-color: rgba(90,158,66,0.15);
}
.theme-green .chapter-end-btn {
  background: linear-gradient(180deg, rgba(232,240,227,0.9) 0%, rgba(200,219,160,0.6) 100%);
  border-color: rgba(200,219,160,0.8);
  color: #5a7a4a;
  box-shadow: 0 3px 0 rgba(90,122,90,0.2), 0 2px 6px rgba(90,122,90,0.1);
}
.theme-green .chapter-end-btn:hover:not(:disabled) {
  border-color: #5a9e42;
  color: #3a7a2a;
  background: linear-gradient(180deg, rgba(232,240,227,1) 0%, rgba(90,158,66,0.12) 100%);
  box-shadow: 0 3px 0 rgba(90,158,66,0.4), 0 4px 12px rgba(90,158,66,0.2);
}
.theme-green .chapter-end-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 rgba(90,122,90,0.2), 0 1px 3px rgba(90,122,90,0.1);
}
.theme-green .chapter-end-divider {
  background: rgba(90,158,66,0.2);
}
.theme-dark .chapter-indicator { background: rgba(14,26,50,0.85); color: #c8daf8; border-color: rgba(60,100,200,0.2); }
.theme-dark .chapter-indicator:hover { background: rgba(20,32,60,0.9); border-color: rgba(80,120,220,0.3); color: #93c5fd; }
.theme-dark .page-indicator-bar .indicator-left { color: #8ea4c4; }
.theme-dark .page-indicator-bar .indicator-left span { color: inherit; }
.theme-dark .chapter-input { background: rgba(14,26,50,0.82); border-color: rgba(60,100,200,0.25); color: #c8daf8; box-shadow: 0 2px 6px rgba(24,144,255,0.1); }
.theme-parchment .chapter-indicator { background: rgba(245,230,200,0.9); color: #3d2a00; border-color: rgba(139,105,20,0.2); }
.theme-parchment .chapter-indicator:hover { background: rgba(235,215,180,0.95); border-color: rgba(139,105,20,0.4); color: #2a1a00; }
.theme-green .chapter-indicator { background: rgba(232,240,227,0.9); color: #3a5a3a; border-color: rgba(74,122,74,0.2); }
.theme-green .chapter-indicator:hover { background: rgba(220,235,210,0.95); border-color: rgba(90,158,66,0.4); color: #1e3a1e; }
.theme-parchment .chapter-end-nav {
  border-top-color: rgba(180,160,120,0.2);
}
.theme-parchment .chapter-end-btn {
  background: linear-gradient(180deg, rgba(250,240,220,0.9) 0%, rgba(240,226,200,0.6) 100%);
  border-color: rgba(212,197,169,0.8);
  color: #7a6a4a;
  box-shadow: 0 3px 0 rgba(120,100,70,0.2), 0 2px 6px rgba(120,100,70,0.1);
}
.theme-parchment .chapter-end-btn:hover:not(:disabled) {
  border-color: #8b6914;
  color: #3d2a00;
  background: linear-gradient(180deg, rgba(250,240,220,1) 0%, rgba(139,105,20,0.1) 100%);
  box-shadow: 0 3px 0 rgba(139,105,20,0.4), 0 4px 12px rgba(139,105,20,0.2);
}
.theme-parchment .chapter-end-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 rgba(120,100,70,0.2), 0 1px 3px rgba(120,100,70,0.1);
}
.theme-parchment .chapter-end-divider {
  background: rgba(139,105,20,0.2);
}
/* PDF 文本选中浮动工具栏 */
</style>