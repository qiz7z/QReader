<template>
  <div class="reader-view" :class="themeClass">
    <!-- 顶部工具栏 -->
    <header class="reader-toolbar">
      <div class="toolbar-left">
        <button class="home-btn" @click="goHome" title="返回首页">
          <svg class="home-icon" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 22V12h6v10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="library-btn" @click="goToLibrary" title="返回书架">
          <svg class="library-icon" viewBox="0 0 24 24" fill="none">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </button>
      </div>
      <span class="toolbar-title">{{ book?.title || '加载中...' }}</span>
    </header>

    <div class="reader-body" ref="bodyRef" :style="{ paddingLeft: (showTocPanel ? sidebarWidth : 60) + 'px' }">
      <!-- 左侧目录 -->
      <aside class="reader-sidebar" :class="{ collapsed: !showTocPanel }" :style="{ width: (showTocPanel ? sidebarWidth : 60) + 'px' }">
        <div v-show="showTocPanel" class="sidebar-expanded">
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
              <span class="toc-icon">#</span>
              <span class="toc-title">{{ ch.title || `第 ${idx + 1} 章` }}</span>
            </div>
            <div v-else class="empty-text">暂无目录</div>
          </div>
        </div>

        <div v-show="!showTocPanel" class="sidebar-collapsed hover-visible">
          <div class="toc-icon-btn" data-title="目录" @click="showTocPanel = true">
            <svg class="collapsed-icon-svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            <span class="badge-dot"></span>
          </div>
        </div>
      </aside>

      <!-- 拖拽条 -->
      <div v-if="showTocPanel" class="resize-bar" @mousedown="startResize"></div>

  <!-- 主阅读区 -->
  <main class="reader-main" :class="{ 'page-mode': readerStore.readerMode === 'page' && pageModeAvailable }" ref="mainRef" @click="rightPanel = ''">
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
        <button class="zoom-btn" @click="adjustZoom(-0.25)">−</button>
        <input type="range" class="zoom-slider" min="0.5" max="2.7" step="0.05" v-model.number="pdfScale" />
        <button class="zoom-btn" @click="adjustZoom(0.25)">+</button>
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
          :class="{ 'read-aloud-active': isReadAloudPlaying && idx === currentSentenceIndex }"
          v-html="paragraph"
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
              <p v-html="item.html" :class="{ 'read-aloud-active': isReadAloudPlaying && item.idx === currentSentenceIndex }"/>
            </template>
          </div>
          <div class="page-col-right">
            <template v-for="(item, i) in currentPageData?.right || []" :key="'r'+pageNum+'-'+i">
              <p v-html="item.html" :class="{ 'read-aloud-active': isReadAloudPlaying && item.idx === currentSentenceIndex }"/>
            </template>
          </div>
        </div>
        <div class="page-nav-left-group">
          <button class="chapter-nav-btn" @click.stop="prevChapter" :disabled="currentChapter <= 0" title="上一章" aria-label="上一章">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="11 17 6 12 11 7"></polyline>
              <polyline points="18 17 13 12 18 7"></polyline>
            </svg>
          </button>
          <div class="page-nav-wrapper" @click.stop="pagePrev">
            <button class="page-nav-side page-nav-left" :disabled="pageNum <= 1" title="上一页" aria-label="上一页">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
        <div class="page-nav-right-group">
          <div class="page-nav-wrapper" @click.stop="pageNext">
            <button class="page-nav-side page-nav-right" :disabled="pageNum >= totalPageNum" title="下一页" aria-label="下一页">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
          <button class="chapter-nav-btn" @click.stop="nextChapter" :disabled="currentChapter >= (book?.content?.length || 1) - 1" title="下一章" aria-label="下一章">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="13 17 18 12 13 7"></polyline>
              <polyline points="6 17 11 12 6 7"></polyline>
            </svg>
          </button>
        </div>
        <div v-if="!isFullscreen" class="page-indicator-bar">
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

        <!-- 悬浮全屏按钮 -->
        <button v-if="!isFullscreen" class="fullscreen-btn-float" @click="toggleFullscreen" title="全屏阅读">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path>
            <path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path>
          </svg>
        </button>

        <!-- 底部阅读信息（滚动模式） -->
        <div v-if="book && bookFormat !== 'pdf' && readerStore.readerMode !== 'page'" class="reader-info-bar">
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
          <button v-for="c in hlColors" :key="c" class="hl-color-btn" :class="{ active: hlSelectedColor === c }" :style="{ background: c }" @click="hlSelectedColor = c; console.log('hlColor clicked:', c)"></button>
        </div>
        <div class="hl-actions">
          <button class="hl-btn hl-btn-note" @click="hlShowNoteInput = !hlShowNoteInput">{{ hlShowNoteInput ? '取消' : '笔记' }}</button>
          <button class="hl-btn hl-btn-save" @click="saveHighlight">保存</button>
        </div>
        <div v-if="hlShowNoteInput" class="hl-note-input-wrap">
          <textarea v-model="hlNoteInput" class="hl-note-input" placeholder="添加笔记..." rows="2"></textarea>
        </div>
      </div>

      <!-- 右侧工具栏 -->
      <aside class="reader-right" :class="{ 'hover-visible': !rightPanel }" @mouseenter="showRightTools = true" @mouseleave="showRightTools = false" @click.stop>
        <div class="right-tools">
          <button class="tool-btn" @click.stop="toggleRight('readAloud')" :class="{ active: rightPanel === 'readAloud' }" title="朗读">
            <svg v-if="isReadAloudPlaying" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              <line x1="9" y1="9" x2="9" y2="15"></line>
              <line x1="15" y1="9" x2="15" y2="15"></line>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          </button>
          <button class="tool-btn" @click.stop="toggleRight('shelf')" :class="{ active: rightPanel === 'shelf' }" title="书架">📚</button>
          <button class="tool-btn" @click.stop="toggleRight('settings')" :class="{ active: rightPanel === 'settings' }" title="设置">⚙</button>
          <button class="tool-btn" @click.stop="toggleRight('annotations')" :class="{ active: rightPanel === 'annotations' }" title="划线笔记">✎</button>
          <button class="tool-btn" @click.stop="toggleRight('bookmarks')" :class="{ active: rightPanel === 'bookmarks' }" title="书签">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
        </div>

        <transition name="panel-slide">
          <div v-if="rightPanel" class="right-panel" :class="rightPanel">
                <div class="right-panel-hd">
              <span>{{ rightPanel === 'shelf' ? '书架' : rightPanel === 'readAloud' ? '朗读' : rightPanel === 'annotations' ? '划线笔记' : rightPanel === 'bookmarks' ? '书签' : '阅读设置' }}</span>
              <button class="close-btn" @click="rightPanel = ''">✕</button>
            </div>
            <div class="right-panel-bd">
              <!-- 朗读面板 -->
              <div v-if="rightPanel === 'readAloud'" class="read-aloud-panel">
                <div class="read-aloud-header">
                  <div class="read-aloud-title">朗读</div>
                  <div class="read-aloud-status" :class="{ playing: isReadAloudPlaying, error: isSpeechError }">
                    {{ isSpeechError ? '出错' : isReadAloudPlaying ? '正在朗读...' : isVoicesLoaded ? '准备就绪' : '加载中...' }}
                  </div>
                </div>
                
                <div class="read-aloud-controls">
                  <button class="control-btn primary" @click="toggleReadAloud" :title="isReadAloudPlaying ? '暂停' : '开始朗读'" :disabled="voiceCache.length === 0">
                    <svg v-if="isReadAloudPlaying" viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </button>
                </div>

                <div class="read-aloud-settings">
                  <div class="setting-row voice-row">
                    <label>音色</label>
                    <select v-model="selectedVoiceName" @change="onVoiceChange" :disabled="voiceCache.length === 0">
                      <option v-for="voice in voiceCache" :key="voice.id" :value="voice.id">
                        {{ voice.name }} · {{ voice.style }}
                      </option>
                    </select>
                  </div>
                  <div class="setting-row">
                    <label>语速</label>
                    <input type="range" min="0.5" max="1.5" step="0.1" v-model="speechRate" @change="updateSettings" />
                    <span class="setting-value">{{ speechRate }}x</span>
                  </div>
                </div>
              </div>

              <!-- 书架 -->
              <div v-if="rightPanel === 'shelf'" class="shelf-panel">
                <div v-if="shelfList.length" class="shelf-grid">
                  <div v-for="b in shelfList" :key="b.id" class="shelf-card" @click="openBook(b.id)">
                    <div class="shelf-cover-img">
                      <img :src="coverUrl(b.id, b.cover, b.title)" alt="" />
                    </div>
                    <div class="shelf-info">
                      <div class="shelf-name">{{ b.title }}</div>
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
                <div class="setting-group">
                  <label class="group-label">字体大小</label>
                  <div class="size-control">
                    <button @click="readerStore.setFontSize(Math.max(1, readerStore.fontSize - 1))">−</button>
                    <div class="size-dots">
                      <span v-for="i in 5" :key="i" class="dot" :class="{ active: i <= readerStore.fontSize }"></span>
                    </div>
                    <button @click="readerStore.setFontSize(Math.min(5, readerStore.fontSize + 1))">+</button>
                  </div>
                </div>
              <div class="setting-group">
                <label class="group-label">字体粗细</label>
                <div class="size-control">
                  <button @click="readerStore.setFontWeight(Math.max(1, readerStore.fontWeight - 1))">−</button>
                  <div class="size-dots">
                    <span v-for="i in 5" :key="i" class="dot" :class="{ active: i <= readerStore.fontWeight }"></span>
                  </div>
                  <button @click="readerStore.setFontWeight(Math.min(5, readerStore.fontWeight + 1))">+</button>
                </div>
              </div>
              <div class="setting-group">
                <label class="group-label">行间距</label>
                <div class="size-control">
                  <button @click="readerStore.setLineHeight(Math.max(1, readerStore.lineHeight - 1))">−</button>
                  <div class="size-dots">
                    <span v-for="i in 5" :key="i" class="dot" :class="{ active: i <= readerStore.lineHeight }"></span>
                  </div>
                  <button @click="readerStore.setLineHeight(Math.min(5, readerStore.lineHeight + 1))">+</button>
                </div>
              </div>
              <div class="setting-group">
                <label class="group-label">阅读方式</label>
                <div class="mode-switch">
                  <button
                    class="mode-btn"
                    :class="{ active: readerStore.readerMode === 'scroll' }"
                    @click="readerStore.setReaderMode('scroll')"
                  >滚动</button>
                  <button
                    class="mode-btn"
                    :class="{ active: readerStore.readerMode === 'page' }"
                    @click="readerStore.setReaderMode('page')"
                    v-if="pageModeAvailable"
                  >翻页</button>
                </div>
              </div>
              <div class="setting-group">
                <label class="group-label">阅读主题</label>
                  <div class="theme-grid">
                    <button v-for="t in themes" :key="t.v" class="theme-btn" :class="{ active: readerStore.theme === t.v }" @click="readerStore.setTheme(t.v)">{{ t.l }}</button>
                  </div>
                </div>
                <div class="setting-group">
                  <label class="group-label">字体风格</label>
                  <div class="font-family-grid">
                    <button v-for="f in fonts" :key="f.v" class="font-btn" :class="{ active: readerStore.fontFamily === f.v }" @click="readerStore.setFontFamily(f.v)" :style="{ fontFamily: f.css }">{{ f.l }}</button>
                  </div>
                </div>
                <div class="setting-group data-management">
                  <label class="group-label">数据管理</label>
                  <button class="danger-btn" @click="handleClearAllData">清除所有数据</button>
                </div>
              </div>

              <!-- 划线笔记 -->
              <div v-if="rightPanel === 'annotations'" class="annotations-panel">
                <div v-if="allHighlights.length" class="annotations-list">
                  <div v-for="hl in allHighlights" :key="hl.id" class="annotation-item">
                    <div class="annotation-hd">
                      <span class="annotation-color" :style="{ background: hl.highlightColor }"></span>
                      <span class="annotation-chapter">{{ getChapterTitle(hl.chapterId) || '未知章节' }}</span>
                      <button class="annotation-del" @click="deleteHighlight(hl.id)">✕</button>
                    </div>
                    <div class="annotation-text">{{ hl.selectedText }}</div>
                    <div v-if="hl.note" class="annotation-note">{{ hl.note }}</div>
                  </div>
                </div>
                <div v-else class="empty-placeholder">
                  <p>暂无划线笔记</p>
                  <p class="empty-hint">选中正文内容即可添加划线</p>
                </div>
              </div>

              <!-- 书签 -->
              <div v-if="rightPanel === 'bookmarks'" class="bookmarks-panel">
                <div class="bookmarks-actions">
                  <button class="bm-add-btn" @click="addBookmark">＋ 添加书签</button>
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
                    <button class="bookmark-del" @click.stop="deleteBookmark(bm.id)">✕</button>
                  </div>
                </div>
                <div v-else class="empty-placeholder">
                  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                  <p>暂无书签</p>
                  <p class="empty-hint">点击上方按钮添加书签</p>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </aside>
    </div>

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
            <span class="toc-icon">#</span>{{ ch.title || `第 ${idx + 1} 章` }}
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

const goHome = () => {
  router.push('/')
}

const goToLibrary = () => {
  router.push('/library')
}

const bookId = computed(() => route.params.id as string)

const book = ref<ParsedBook | null>(null)
const rawFile = ref<ArrayBuffer | null>(null)
const bookFormat = ref('')
const currentChapter = ref(0)
const pageTransition = ref('page-forward')
const isFullscreen = ref(false)
const pageModeAvailable = computed(() => bookFormat.value && bookFormat.value !== 'pdf')
const pdfScale = ref(2.0)

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
    chapterId: book.value.content?.[currentChapter.value]?.id || String(currentChapter.value),
    position: 0,
    percentage: book.value.content.length > 0 ? (currentChapter.value / book.value.content.length) * 100 : 0,
    updatedAt: Date.now(),
    readingTime: totalReadingTime,
  })
  lastSavedTime = sessionReadingTime.value
}
function stopReadingTimeTracker() {
  if (readingTimeTimer) {
    clearInterval(readingTimeTimer)
    readingTimeTimer = undefined
  }
  // 离开时保存最终时长
  if (sessionReadingTime.value > 0 && sessionReadingTime.value > lastSavedTime && bookId.value) {
    saveReadingTime()
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
  pdfScale.value = Math.max(0.5, Math.min(2.7, +(pdfScale.value + delta).toFixed(2)))
}
const pdfReaderRef = ref<InstanceType<typeof PdfReader> | null>(null)
const mainRef = ref<HTMLElement | null>(null)
const bodyRef = ref<HTMLElement | null>(null)

const showTocPanel = ref(false)
const sidebarWidth = ref(200)
const showRightTools = ref(false)

// 翻页模式
const pageNum = ref(1)
const totalPageNum = ref(1)
const pages = ref<Array<{ left: Array<{ html: string, idx: number }>, right: Array<{ html: string, idx: number }> }>>([])

const currentPageData = computed(() => {
  if (pages.value.length === 0) return null
  return pages.value[Math.min(pageNum.value, pages.value.length) - 1]
})

function recalcPages() {
  const vp = document.querySelector('.page-viewport') as HTMLElement
  if (!vp) return

  const cs = window.getComputedStyle(vp)
  const colWidth = (vp.clientWidth - 168) / 2
  const pageHeight = vp.clientHeight - 40
  if (pageHeight <= 0 || colWidth <= 0) return

  const margin = parseFloat(cs.fontSize) * 0.8

  const measurer = document.createElement('div')
  measurer.style.cssText = `position:absolute;visibility:hidden;width:${colWidth}px;font-family:${cs.fontFamily};font-size:${cs.fontSize};line-height:${cs.lineHeight};padding:0;`
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
  let i = 0

  while (i < flattedParagraphs.length) {
    let leftH = 0
    const left: Array<{ html: string, idx: number }> = []
    while (i < flattedParagraphs.length) {
      const h = flattedHeights[i] + margin
      if (left.length > 0 && leftH + h > pageHeight) break
      left.push(flattedParagraphs[i])
      leftH += h
      i++
    }

    let rightH = 0
    const right: Array<{ html: string, idx: number }> = []
    while (i < flattedParagraphs.length) {
      const h = flattedHeights[i] + margin
      if (right.length > 0 && rightH + h > pageHeight) break
      right.push(flattedParagraphs[i])
      rightH += h
      i++
    }

    newPages.push({ left, right })
  }

  pages.value = newPages
  totalPageNum.value = newPages.length
  if (pageNum.value > newPages.length) pageNum.value = newPages.length
}

function pagePrev() {
  if (pageNum.value > 1) {
    pageNum.value--
  }
}

function pageNext() {
  if (pageNum.value < totalPageNum.value) {
    pageNum.value++
  }
}

function prevChapter() {
  if (currentChapter.value > 0) {
    pageTransition.value = 'page-back'
    currentChapter.value--
    pageNum.value = 1
    scrollToChapterStart()
    nextTick(() => recalcPages())
  }
}

function nextChapter() {
  if (book.value && currentChapter.value < book.value.content.length - 1) {
    pageTransition.value = 'page-forward'
    currentChapter.value++
    pageNum.value = 1
    scrollToChapterStart()
    nextTick(() => recalcPages())
  }
}

function handlePageKeydown(e: KeyboardEvent) {
  if (readerStore.readerMode !== 'page' || !pageModeAvailable.value) return
  if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
  console.log('[keydown]', e.key, 'mode:', readerStore.readerMode, 'pageModeAvailable:', pageModeAvailable.value)
  if (e.key === 'ArrowLeft') { e.preventDefault(); pagePrev() }
  else if (e.key === 'ArrowRight') { e.preventDefault(); pageNext() }
}
const minW = 120
const maxW = 400

const rightPanel = ref('')
const shelfList = ref<Array<{ id: string; title: string; cover: ArrayBuffer | null }>>([])
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
let currentSentenceIndex = ref(0)
let isAutoAdvancingChapter = false // 朗读自动跳章标记

// TTS 代理服务器配置（用于非 Edge 浏览器）
let isProxyAvailable = ref<boolean | null>(null)
const themes = [
  { l: '白天', v: 'light' as const },
  { l: '夜间', v: 'dark' as const },
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
    shelfList.value = all.map(b => ({ id: b.id, title: b.title, cover: b.cover }))
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

  console.log('[saveHighlight] hlSelectedColor:', hlSelectedColor.value)
  
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
  if (readerStore.readerMode === 'page') nextTick(() => recalcPages())
}

async function deleteHighlight(id: string) {
  await StorageService.deleteNote(id)
  highlights.value = highlights.value.filter(h => h.id !== id)
  if (readerStore.readerMode === 'page') nextTick(() => recalcPages())
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

// =============================================================================
// =============================================================================
// 朗读功能 — 双引擎 TTS（SpeechSynthesis 主力 + Edge TTS 增强）
// =============================================================================
// 设计原则：
//   1. SpeechSynthesis API 浏览器内置，零依赖、永远可用，做主引擎
//   2. Edge TTS 代理后台静默检测，可用时自动切换到高质量音色
//   3. 引擎切换对用户透明，不弹错误提示，不要求手动启动服务

// ---- 状态 ----
let isSpeechError = ref(false)
let retryCount = ref(0)
const MAX_RETRY = 2

// 音色列表（合并系统语音和 Edge 增强语音）
const voiceCache = ref<Array<{ id: string; name: string; gender: string; style: string; engine: 'system' | 'edge' }>>([])
const isVoicesLoaded = ref(false)

// 当前使用的引擎
let activeEngine: 'synth' | 'edge' = 'synth'
let ttsAbort: AbortController | null = null

// ---- Edge TTS 配置 ----
const TTS_PROXY_URL = 'http://localhost:3004/api/tts'
let proxyCheckTimer: number | null = null

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

// ---- 代理检测 ----
async function checkProxyAvailability(): Promise<boolean> {
  try {
    const resp = await fetch(TTS_PROXY_URL.replace('/api/tts', '/api/health'), {
      signal: AbortSignal.timeout(1500)
    })
    return resp.ok
  } catch { return false }
}

function startProxyHealthCheck() {
  stopProxyHealthCheck()
  proxyCheckTimer = window.setInterval(async () => {
    const available = await checkProxyAvailability()
    if (isProxyAvailable.value !== available) {
      isProxyAvailable.value = available
      // 代理恢复时，后台更新音色列表
      if (available) await loadAllVoices()
    }
  }, 60000) // 每分钟检查一次
}

function stopProxyHealthCheck() {
  if (proxyCheckTimer !== null) {
    clearInterval(proxyCheckTimer)
    proxyCheckTimer = null
  }
}

// ---- 音色加载：合并系统语音 + Edge 增强 ----
async function loadAllVoices() {
  // Edge TTS 音色
  voiceCache.value = EDGE_VOICES.map(v => ({ ...v, engine: 'edge' as const, id: 'edge:' + v.id }))

  // 检测代理
  isProxyAvailable.value = await checkProxyAvailability()

  // 恢复偏好或选默认
  const saved = localStorage.getItem('reader-voice')
  if (saved && voiceCache.value.some(v => v.id === saved)) {
    selectedVoiceName.value = saved
  } else {
    selectedVoiceName.value = voiceCache.value[0]?.id || ''
  }

  isVoicesLoaded.value = true
}

// ---- 判断当前语音属于哪个引擎 ----
// ---- SpeechSynthesis 引擎 ----
let ttsState: 'idle' | 'playing' | 'paused' = 'idle'
let ttsGeneration = 0  // 每 start/stop 递增，用于打断幽灵链

function speakWithSynth(text: string, voiceURI: string, rate: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ttsAbort?.signal.aborted) { reject(new Error('abort')); return }

    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = rate
    utter.volume = 1.0

    // 匹配语音
    const rawId = voiceURI.replace('system:', '')
    const voice = speechSynthesis.getVoices().find(v => v.voiceURI === rawId)
      || speechSynthesis.getVoices().find(v => v.lang.startsWith('zh') || v.lang.startsWith('cmn'))
    if (voice) utter.voice = voice

    utter.onstart = () => {
      isSpeechError.value = false
      isReadAloudPlaying.value = true
      ttsState = 'playing'
    }
    utter.onend = () => { resolve() }
    utter.onerror = (e) => {
      if (e.error === 'canceled' || e.error === 'interrupted') {
        reject(new Error('canceled'))  // 中断=reject，打断幽灵链
      } else {
        reject(new Error(e.error || 'speech error'))
      }
    }
    speechSynthesis.speak(utter)
  })
}

// ---- Edge TTS 引擎（简化版：复用现有能力） ----

let prefetchedAudio: { index: number; blob: Blob; url: string } | null = null
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
function clearPrefetched() {
  if (prefetchedAudio) { URL.revokeObjectURL(prefetchedAudio.url); prefetchedAudio = null }
}

function getRateStr(): string {
  const pct = Math.round((speechRate.value - 1) * 100)
  return (pct >= 0 ? '+' : '') + pct + '%'
}

async function synthesizeViaEdge(text: string, voice: string): Promise<Blob> {
  // 先走代理
  try {
    const resp = await fetch(TTS_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, rate: getRateStr(), volume: '+0%', pitch: '+0Hz' }),
      signal: ttsAbort?.signal
    })
    if (resp.ok) {
      const ab = await resp.arrayBuffer()
      return new Blob([ab], { type: 'audio/mpeg' })
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw err
  }
  // 降级浏览器端
  const { EdgeTTSBrowser } = await import('edge-tts-universal/browser')
  const tts = new EdgeTTSBrowser(text, voice, { rate: getRateStr(), volume: '+0%', pitch: '+0Hz' })
  const result = await tts.synthesize()
  return result.audio
}

async function prefetchEdge(index: number) {
  if (ttsAbort?.signal.aborted) return
  if (index >= sentences.value.length) return
  const text = sentences.value[index].replace(/<[^>]*>/g, ' ').trim()
  if (!text) return
  try {
    const voice = selectedVoiceName.value.replace('edge:', '')
    const blob = await synthesizeViaEdge(text, voice)
    if (!ttsAbort?.signal.aborted && blob) {
      prefetchedAudio = { index, blob, url: URL.createObjectURL(blob) }
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') console.warn('[Edge] 预取失败:', err.message)
  }
}

async function playEdgeSentence(index: number) {
  const gen = ttsGeneration
  if (ttsAbort?.signal.aborted) return
  if (index >= sentences.value.length) { tryNextChapter(); return }

  const text = sentences.value[index].replace(/<[^>]*>/g, ' ').trim()
  if (!text) { advanceToNext(index); return }

  releaseCurrentAudio()

  let url: string
  if (prefetchedAudio?.index === index) {
    url = prefetchedAudio.url
    prefetchedAudio = null
  } else {
    try {
      const voice = selectedVoiceName.value.replace('edge:', '')
      const blob = await synthesizeViaEdge(text, voice)
      if (gen !== ttsGeneration) return
      url = URL.createObjectURL(blob)
    } catch (err: any) {
      if (err.name === 'AbortError') return
      if (gen !== ttsGeneration) return
      // Edge TTS 失败 → 降级到 SpeechSynthesis
      console.warn('[TTS] Edge失败，降级 SpeechSynthesis')
      showTtsToast('Edge TTS 不可用，已切换系统语音', 3000)
      activeEngine = 'synth'
      playSynthSentence(index)
      return
    }
  }

  const audio = new Audio(url)
  currentAudio = audio

  audio.onplay = () => {
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
    // Edge 失败 → SpeechSynthesis
    console.warn('[TTS] Audio播放失败，降级 SpeechSynthesis')
    showTtsToast('Edge TTS 不可用，已切换系统语音', 3000)
    activeEngine = 'synth'
    playSynthSentence(index)
  }

  audio.play().catch(() => {
    if (gen !== ttsGeneration) return
    URL.revokeObjectURL(url)
    currentAudio = null
    activeEngine = 'synth'
    playSynthSentence(index)
  })
}

// ---- SpeechSynthesis 逐句播放 ----
async function playSynthSentence(index: number) {
  const gen = ttsGeneration  // 捕获当前 generation
  if (ttsAbort?.signal.aborted) return
  if (index >= sentences.value.length) { tryNextChapter(); return }

  const text = sentences.value[index].replace(/<[^>]*>/g, ' ')
  if (!text.trim()) { advanceToNextSynth(index); return }

  currentSentenceIndex.value = index
  scrollToSentence(index)

  try {
    await speakWithSynth(text, selectedVoiceName.value.replace('system:', ''), speechRate.value)
    // 检查 generation 是否变化（stopReadAloud 后旧链必须停下）
    if (gen !== ttsGeneration) return
    advanceToNextSynth(index)
  } catch (err: any) {
    if (err.message === 'abort' || err.message === 'canceled') return
    console.error('[Synth] 播放失败:', err.message)
    handleSynthError(index)
  }
}

function advanceToNextSynth(currentIdx: number) {
  if (currentIdx < sentences.value.length - 1) {
    playSynthSentence(currentIdx + 1)
  } else {
    tryNextChapter()
  }
}

function handleSynthError(index: number) {
  isSpeechError.value = true
  retryCount.value++
  if (retryCount.value <= MAX_RETRY) {
    setTimeout(() => { isSpeechError.value = false; playSynthSentence(index) }, 1000)
  } else {
    showTtsToast('朗读失败，请重试')
    stopReadAloud()
  }
}

// ---- 统一推进 ----
function advanceToNext(currentIdx: number) {
  if (currentIdx < sentences.value.length - 1) {
    const next = currentIdx + 1
    if (activeEngine === 'edge') {
      prefetchEdge(next + 1)
      playEdgeSentence(next)
    } else {
      playSynthSentence(next)
    }
  } else {
    tryNextChapter()
  }
}

// ---- 自动跳章 ----
function tryNextChapter() {
  // 防止幽灵链在 setTimeout 触发前完成了当前句，导致重复跳章
  if (isAutoAdvancingChapter) return
  if (currentChapter.value < (book.value?.content?.length || 1) - 1) {
    isAutoAdvancingChapter = true
    currentChapter.value++
    setTimeout(() => {
      isAutoAdvancingChapter = false
      const engine = activeEngine // 保持当前引擎
      stopReadAloud()
      activeEngine = engine
      startReadAloud(0)
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
  speechSynthesis.cancel()
  releaseCurrentAudio()
  clearPrefetched()
  isReadAloudPlaying.value = false
  isSpeechError.value = false
  retryCount.value = 0
  ttsState = 'idle'
}

async function startReadAloud(startIndex: number, skipVoiceLoad = false) {
  stopReadAloud()

  if (!skipVoiceLoad) {
    await loadAllVoices()
    if (voiceCache.value.length === 0) {
      showTtsToast('未找到可用语音')
      return
    }
    if (!isProxyAvailable.value) {
      showTtsToast('Edge TTS 代理未启动，将使用系统语音')
    }
  }

  ttsAbort = new AbortController()
  startProxyHealthCheck()

  activeEngine = 'edge'
  showTtsToast('开始朗读', 1500)

  playEdgeSentence(startIndex)
  prefetchEdge(startIndex + 1)
}

function pauseReadAloud() {
  ttsState = 'paused'
  isReadAloudPlaying.value = false
  // 彻底取消当前语音，不依赖不可靠的 speechSynthesis.pause()
  if (activeEngine === 'synth') {
    speechSynthesis.cancel()
  } else if (currentAudio && !currentAudio.paused) {
    currentAudio.pause()
  }
}

function resumeReadAloud() {
  const idx = currentSentenceIndex.value
  if (activeEngine === 'edge' && currentAudio && currentAudio.paused) {
    currentAudio.play().catch(() => {
      activeEngine = 'synth'
      playSynthSentence(idx)
    })
  } else {
    // 均重新开始当前句（最可靠的恢复方式）
    if (activeEngine === 'edge') {
      playEdgeSentence(idx)
    } else {
      playSynthSentence(idx)
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

// 音色切换
function onVoiceChange() {
  try { localStorage.setItem('reader-voice', selectedVoiceName.value) } catch {}
  if (ttsState !== 'idle') {
    const idx = currentSentenceIndex.value
    stopReadAloud()
    startReadAloud(idx, true) // 跳过 loadAllVoices，直接用当前列表+新音色
  }
}

// 语速调整
function updateSettings() {
  try { localStorage.setItem('reader-speech-rate', String(speechRate.value)) } catch {}
  if (ttsState !== 'idle') {
    const idx = currentSentenceIndex.value
    stopReadAloud()
    startReadAloud(idx, true)
  }
}

// 滚动到高亮句子
function scrollToSentence(index: number) {
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
  console.log('[ReaderView] onTocClick idx:', idx, 'bookFormat:', bookFormat.value)
  console.log('[ReaderView] book.value?.toc:', book.value?.toc)
  currentChapter.value = idx
  if (bookFormat.value === 'pdf' && book.value?.toc?.[idx]) {
    // PDF: 从 toc 中读取起始页码
    const tocEntry = book.value.toc[idx]
    console.log('[ReaderView] PDF toc entry:', tocEntry)
    const pageNum = tocEntry.position
    console.log('[ReaderView] PDF toc click, pageNum:', pageNum)
    nextTick(() => {
      console.log('[ReaderView] pdfReaderRef:', pdfReaderRef.value)
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
    nextTick(() => { setTimeout(recalcPages, 50) })
  }
})

watch(() => bookFormat.value, (fmt) => {
  if (fmt && !pageModeAvailable.value && readerStore.readerMode === 'page') {
    readerStore.setReaderMode('scroll')
  }
  if (fmt && pageModeAvailable.value && readerStore.readerMode === 'page') {
    nextTick(() => { setTimeout(recalcPages, 50) })
  }
})

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  nextTick(() => {
    if (readerStore.readerMode === 'page' && pageModeAvailable.value) setTimeout(recalcPages, 100)
  })
  resizeObserver = new ResizeObserver(() => {
    if (readerStore.readerMode === 'page' && pageModeAvailable.value) recalcPages()
  })
  const vp = document.querySelector('.page-viewport') as HTMLElement
  if (vp) resizeObserver.observe(vp)
})

onBeforeUnmount(() => { 
  resizeObserver?.disconnect()
  if (timeTimer) clearInterval(timeTimer)
  if (readingTimeTimer) clearInterval(readingTimeTimer)
  if (fullNavTimer) clearTimeout(fullNavTimer)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('fullscreenchange', onFs)
  document.removeEventListener('keydown', handlePageKeydown)
  stopReadAloud()
  stopReadingTimeTracker()
})
</script>

<style scoped>
.reader-view {
  height: 100vh; display: flex; flex-direction: column; overflow: hidden;
}
.reader-toolbar {
  height: 44px; padding: 0 16px; background: rgba(255,255,255,0.85); backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,0,0,0.06); display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-size: 15px; font-weight: 500; z-index: 20; color: #333; gap: 16px; position: relative;
}
.theme-dark .reader-toolbar { background: rgba(26,26,26,0.85); border-color: rgba(255,255,255,0.06); color: #e0e0e0; }

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
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  backdrop-filter: blur(8px);
  width: 38px;
  height: 38px;
}

.home-icon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  transition: all 0.25s;
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
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  backdrop-filter: blur(8px);
  width: 38px;
  height: 38px;
}

.library-icon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  transition: all 0.25s;
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
.reader-body { flex: 1; display: flex; overflow: hidden; position: relative; transition: padding-left 0.15s; }

/* 左侧目录 */
.reader-sidebar {
  background: #fff; border-right: 1px solid #eee;
  display: flex; flex-direction: column; flex-shrink: 0;
  position: absolute;
  left: 0; top: 0; bottom: 0;
  z-index: 2;
  transition: width 0.15s; will-change: width;
}
.reader-sidebar.collapsed { border-right: none; }
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
.toc-item .toc-icon { font-size: 13px; color: #999; flex-shrink: 0; }
.toc-item.active { background: rgba(24,144,255,0.1); border-left: 3px solid #1890ff; font-weight: 600; }

/* 收起状态：居中醒目 */
.sidebar-collapsed {
  flex: 1; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start;
  user-select: none; padding: 15vh 6px 12px; text-align: center;
}
.sidebar-collapsed.hover-visible {
  opacity: 0.1;
  background: transparent;
  transition: opacity 0.3s ease;
}
.sidebar-collapsed.hover-visible .toc-icon-btn {
  background: transparent;
  box-shadow: none;
  border-color: transparent;
}
.sidebar-collapsed.hover-visible:hover {
  opacity: 1;
}
.theme-dark .sidebar-collapsed.hover-visible:hover { background: #1a1a1a; }
.theme-green .sidebar-collapsed.hover-visible:hover { background: #e8f0e3; }
.theme-parchment .sidebar-collapsed.hover-visible:hover { background: #f5e6c8; }
.sidebar-collapsed.hover-visible:hover .toc-icon-btn {
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  border-color: rgba(0,0,0,0.04);
}
.theme-dark .sidebar-collapsed.hover-visible:hover .toc-icon-btn { background: #444; }
.theme-green .sidebar-collapsed.hover-visible:hover .toc-icon-btn { background: #c8dba0; }
.theme-parchment .sidebar-collapsed.hover-visible:hover .toc-icon-btn { background: #d4c5a9; }
.toc-icon-btn {
  width: 46px; height: 46px;
  background: #fff;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  transition: all 0.25s ease;
  margin-bottom: 10px;
  position: relative;
  border: 1px solid rgba(0,0,0,0.04);
}
.badge-dot {
  position: absolute; top: 4px; right: 4px;
  width: 8px; height: 8px;
  background: #1890ff;
  border-radius: 50%;
  border: 2px solid #fff;
  opacity: 0;
  transform: scale(0);
  transition: all 0.2s;
}
.toc-icon-btn:hover::after {
  content: attr(data-title);
  position: absolute; left: 56px; top: 50%; transform: translateY(-50%);
  white-space: nowrap; padding: 4px 10px; border-radius: 4px;
  background: rgba(0,0,0,0.75); color: #fff; font-size: 13px;
  pointer-events: none; z-index: 10;
}
.toc-icon-btn:hover {
  background: #1890ff;
  box-shadow: 0 6px 16px rgba(24,144,255,0.25);
  transform: translateY(-3px) scale(1.05);
  border-color: #1890ff;
}
.toc-icon-btn:hover .badge-dot { opacity: 0; transform: scale(0); }
.toc-icon-btn .collapsed-icon-svg { color: #666; transition: color 0.2s; }
.toc-icon-btn:hover .collapsed-icon-svg { color: #fff; }

/* 拖拽条 */
.resize-bar { width: 6px; cursor: col-resize; background: transparent; flex-shrink: 0; }
.resize-bar:hover { background: rgba(0,0,0,0.06); }

/* 主阅读区 */
.reader-main { flex: 1; overflow-y: auto; position: relative; min-width: 0; background: #fff; transition: background 0.3s, color 0.3s; border-left: 1px solid #eee; }
.reader-content-wrap { flex: 1; overflow-y: auto; }
.reader-content-wrap.page-mode { overflow: hidden; display: flex; flex-direction: column; }
.reader-main.page-mode { overflow: hidden !important; display: flex; flex-direction: column; }
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
  padding: 20px 64px 20px 64px;
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
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 20px;
  font-size: 13px;
  color: #999;
  background: rgba(0,0,0,0.05);
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
}
.indicator-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chapter-nav-btn {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px 10px;
  cursor: pointer;
  color: #666;
  font-size: 13px;
  transition: all 0.2s;
}
.chapter-nav-btn:hover:not(:disabled) { border-color: #1890ff; color: #1890ff; }
.chapter-nav-btn:disabled { opacity: 0.3; cursor: default; }
.page-nav-btn {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px 10px;
  cursor: pointer;
  color: #666;
  font-size: 13px;
  transition: all 0.2s;
}
.page-nav-btn:hover:not(:disabled) { border-color: #1890ff; color: #1890ff; }
.page-nav-btn:disabled { opacity: 0.3; cursor: default; }
.page-nav-wrapper {
  width: 60px;
  height: 100%;
  z-index: 9;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.page-nav-wrapper:active { z-index: 11; }
.page-nav-left-group {
  position: absolute; left: 0; top: 0; bottom: 0;
  display: flex; align-items: center; gap: 4px;
  padding-left: 8px; z-index: 9;
  pointer-events: none;
}
.page-nav-left-group::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 80px; pointer-events: auto;
}
.page-nav-right-group {
  position: absolute; right: 0; top: 0; bottom: 0;
  display: flex; align-items: center; gap: 4px;
  padding-right: 8px; z-index: 9;
  pointer-events: none;
}
.page-nav-right-group::before {
  content: ''; position: absolute; right: 0; top: 0; bottom: 0;
  width: 80px; pointer-events: auto;
}
.page-nav-wrapper .page-nav-side {
  background: transparent;
  border: 1.5px solid rgba(0,0,0,0.12);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}
.page-nav-left-group:hover .page-nav-side,
.page-nav-right-group:hover .page-nav-side {
  opacity: 1;
}
.page-nav-wrapper:hover .page-nav-side {
  color: #1890ff;
  transform: scale(1.15);
}
.page-nav-wrapper:active .page-nav-side {
  transform: scale(0.9);
}
.page-nav-side:disabled {
  opacity: 0.35 !important;
  cursor: not-allowed;
  pointer-events: none;
}
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
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
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
.chapter-nav-btn {
  width: 36px; height: 36px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.9); backdrop-filter: blur(4px);
  color: #666; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0; pointer-events: none;
}
.page-nav-left-group:hover .chapter-nav-btn,
.page-nav-right-group:hover .chapter-nav-btn { opacity: 1; pointer-events: auto; }
.page-nav-left-group:hover .page-nav-wrapper,
.page-nav-right-group:hover .page-nav-wrapper { pointer-events: auto; }
.page-nav-left-group:hover .page-nav-side,
.page-nav-right-group:hover .page-nav-side { pointer-events: auto; }
.chapter-nav-btn:hover:not(:disabled) {
  border-color: #1890ff; color: #1890ff;
  background: rgba(24,144,255,0.08);
  box-shadow: 0 4px 12px rgba(24,144,255,0.15);
  transform: scale(1.1);
}
.chapter-nav-btn:active:not(:disabled) { transform: scale(0.95); background: rgba(24,144,255,0.12); }
.chapter-nav-btn:disabled { opacity: 0.35 !important; cursor: not-allowed; pointer-events: none !important; }

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
  background: transparent;
  border: none;
  color: #999;
}
.theme-dark .info-right .chapter-input {
  background: transparent;
  border-color: rgba(255,255,255,0.2);
  color: #ddd;
}
.theme-dark .info-right .chapter-indicator {
  color: #999;
}
.theme-dark .info-right .chapter-indicator:hover {
  color: #1890ff;
}
.theme-dark .reader-chapter-bar {
  background: rgba(40,40,40,0.8);
  border-color: rgba(255,255,255,0.08);
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
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 24px;
  padding: 6px;
  box-shadow: 0 3px 16px rgba(0,0,0,0.12);
  z-index: 100;
  pointer-events: auto;
}

/* PDF 标注工具栏 */
.pdf-annotation-toolbar {
  display: flex; align-items: center; gap: 3px;
  padding: 3px 5px;
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
  width: 1px; height: 28px; background: rgba(0,0,0,0.1);
}

/* PDF 缩放控件 */
.pdf-zoom-controls {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 6px;
}
.zoom-btn {
  width: 32px; height: 32px; border: none;
  background: rgba(0,0,0,0.06); border-radius: 50%;
  cursor: pointer; font-size: 18px; color: #555;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0;
}
.zoom-btn:hover { background: rgba(24,144,255,0.15); color: #1890ff; }
.zoom-slider {
  width: 80px; height: 4px; cursor: pointer;
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
  font-size: 12px; font-weight: 500; color: #555;
  min-width: 38px; text-align: center;
  font-variant-numeric: tabular-nums; flex-shrink: 0;
  margin-left: 4px;
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
  width: 1px; height: 18px; background: rgba(0,0,0,0.1); margin: 0 3px;
}
.annotation-colors {
  display: flex; gap: 3px; align-items: center; margin: 0 3px;
}
.annotation-color-btn {
  width: 16px; height: 16px; border-radius: 50%; border: 2px solid transparent;
  cursor: pointer; transition: all 0.15s; padding: 0; flex-shrink: 0;
}
.annotation-color-btn:hover { transform: scale(1.15); }
.annotation-color-btn.active { border-color: #333; box-shadow: 0 0 0 1px #fff, 0 0 0 2px #333; }
.tool-btn {
  min-width: 20px;
}
.tool-btn.active {
  background: rgba(24,144,255,0.2);
  color: #1890ff;
}
.highlighter-btn {
  position: relative;
}
.highlighter-btn.active {
  background: rgba(255, 255, 0, 0.25);
  color: #b8860b;
}
.highlighter-colors {
  margin-left: 3px;
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
  display: flex; align-items: center; gap: 4px; margin: 0 3px;
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
  min-width: 32px; text-align: center; font-variant-numeric: tabular-nums;
}
.theme-dark .fullscreen-btn-float {
  background: rgba(45,45,45,0.85);
  border-color: rgba(255,255,255,0.1);
  color: #e0e0e0;
}
.theme-dark .zoom-btn { background: rgba(255,255,255,0.1); color: #ccc; }
.theme-dark .zoom-btn:hover { background: rgba(24,144,255,0.2); color: #1890ff; }
.theme-dark .zoom-slider { background: transparent; accent-color: #1890ff; }
.theme-dark .zoom-slider::-webkit-slider-runnable-track { background: rgba(255,255,255,0.15); }
.theme-dark .zoom-slider::-webkit-slider-thumb { background: #1890ff; border-color: #444; }
.theme-dark .zoom-slider::-moz-range-track { background: rgba(255,255,255,0.15); }
.theme-dark .zoom-label { color: #ccc; }
.fullscreen-btn { padding: 6px; display: flex; align-items: center; justify-content: center; }
.fullscreen-btn:hover { background: rgba(24,144,255,0.1); border-color: #1890ff; }

/* 右侧区域：固定宽度定位容器 */
.reader-right {
  position: relative;
  width: 64px;
  height: 100%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border-left: 1px solid #eee;
}
.reader-right.hover-visible {
  opacity: 0.1;
  transition: opacity 0.3s ease;
  background: transparent;
  border-left: none;
}
.reader-right.hover-visible:hover {
  opacity: 1;
}
.right-tools { 
  display: flex; 
  flex-direction: column; 
  gap: 6px; 
  align-items: center; 
  padding-top: 15vh; 
  width: 100%;
  height: 100%;
}
.tool-divider { width: 24px; height: 1px; background: rgba(0,0,0,0.1); margin: 4px 0; }
.theme-dark .tool-divider { background: rgba(255,255,255,0.1); }
.tool-icon { width: 20px; height: 20px; }
.tool-btn { width: 52px; height: 52px; border: none; background: rgba(0,0,0,0.06); cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; border-radius: 10px; flex-shrink: 0; color: #666; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); position: relative; }
.tool-btn svg { width: 20px; height: 20px; transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.tool-btn::after { content: ''; position: absolute; inset: 0; border-radius: 10px; background: radial-gradient(circle at center, rgba(24,144,255,0.15) 0%, transparent 70%); opacity: 0; transition: opacity 0.3s; pointer-events: none; }
.tool-btn:hover { background: rgba(0,0,0,0.1); color: #333; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.tool-btn:hover svg { transform: scale(1.1); }
.tool-btn:hover::after { opacity: 1; }
.tool-btn:active { transform: translateY(0) scale(0.95); box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.tool-btn.active { background: rgba(24,144,255,0.15); color: #1890ff; box-shadow: 0 2px 8px rgba(24,144,255,0.2); }
.tool-btn.active:hover { background: rgba(24,144,255,0.22); box-shadow: 0 4px 16px rgba(24,144,255,0.3); }
.bottom-fullscreen-btn { margin-top: auto; }

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

/* 右侧面板：绝对定位浮动在按钮左侧，垂直居中 */
.right-panel {
  position: absolute;
  right: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%);
  width: 300px;
  max-width: 70vw;
  max-height: 85vh;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 30;
}
.right-panel-hd {
  padding: 14px 18px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;
  flex-shrink: 0;
}
.close-btn {
  width: 24px; height: 24px;
  border: none; background: #f5f5f5; border-radius: 4px;
  cursor: pointer; font-size: 12px; color: #666;
  display: flex; align-items: center; justify-content: center;
}
.close-btn:hover { background: #eee; }
.right-panel-bd { flex: 1; overflow-y: auto; padding: 16px; min-height: 0; }

/* 过渡动画 */
.panel-slide-enter-active, .panel-slide-leave-active { transition: opacity 0.2s, transform 0.2s; }
.panel-slide-enter-from, .panel-slide-leave-to { opacity: 0; transform: translateY(-50%) translateX(8px); }


/* 书架面板 */
.shelf-panel { min-height: 120px; }
.shelf-grid { display: flex; flex-direction: column; gap: 8px; }
.shelf-card {
  display: flex; flex-direction: row; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 8px; border: 1px solid #f0f0f0;
  cursor: pointer; transition: all 0.15s; background: #fafafa;
}
.shelf-card:hover { border-color: #1890ff; background: #f5f9ff; transform: translateX(2px); box-shadow: 0 2px 8px rgba(24,144,255,0.08); }
.shelf-cover {
  width: 36px; height: 36px; border-radius: 6px; background: linear-gradient(135deg, #1890ff, #36cfc9);
  display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; font-weight: 600; flex-shrink: 0;
}
.shelf-cover-img {
  width: 36px; height: 50px; border-radius: 6px; overflow: hidden; flex-shrink: 0;
  background: #f0f0f0;
}
.shelf-cover-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.shelf-info { text-align: left; width: 100%; overflow: hidden; }
.shelf-name { font-size: 13px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 设置面板 */
.settings-panel { display: flex; flex-direction: column; gap: 24px; }
.setting-group { display: flex; flex-direction: column; gap: 12px; }
.group-label {
  font-size: 12px; color: #999; font-weight: 500;
  text-transform: uppercase; letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.setting-group { margin-bottom: 24px; }
.setting-group:last-child { margin-bottom: 0; }

/* +/- 控制按钮 */
.size-control { display: flex; align-items: center; gap: 16px; }
.size-control button {
  width: 40px; height: 40px; border: 1.5px solid #e8e8e8; border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%); cursor: pointer;
  font-size: 20px; font-weight: 400; color: #666;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.size-control button:hover {
  border-color: #1890ff; color: #1890ff;
  background: linear-gradient(180deg, #f0f7ff 0%, #e6f4ff 100%);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}
.size-control button:active {
  transform: scale(0.95);
  box-shadow: 0 1px 2px rgba(24, 144, 255, 0.2);
}
.size-dots { flex: 1; display: flex; gap: 10px; justify-content: center; }
.dot {
  width: 16px; height: 16px; border-radius: 5px; background: #e8e8e8;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.dot.active {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.35);
  transform: scale(1.1);
}

/* 阅读方式切换 */
.mode-switch {
  display: flex;
  gap: 0;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 4px;
  width: fit-content;
}
.mode-btn {
  padding: 10px 28px;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #999;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: "Kaiti SC", "STKaiti", "KaiTi", "AR PL UKai CN", serif;
}
.mode-btn.active {
  background: #fff;
  color: #1890ff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  font-weight: 600;
}
.mode-btn:hover:not(.active) {
  color: #666;
  background: rgba(255,255,255,0.6);
}

/* 主题切换 */
.theme-grid { display: flex; gap: 12px; }
.theme-btn {
  flex: 1; height: 36px; border: 2px solid transparent; border-radius: 8px;
  cursor: pointer; font-size: 13px; font-weight: 500;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: "Kaiti SC", "STKaiti", "KaiTi", "AR PL UKai CN", serif;
}
.theme-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 4px 14px rgba(0,0,0,0.12);
}
.theme-btn:active {
  transform: translateY(0) scale(0.97);
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.theme-grid .theme-btn:first-child { background: #fff; color: #333; border-color: #e8e8e8; }
.theme-grid .theme-btn:first-child.active { border-color: #333; box-shadow: 0 2px 10px rgba(0,0,0,0.12); }
.theme-grid .theme-btn:nth-child(2) { background: #2d2d2d; color: #fff; border-color: #444; }
.theme-grid .theme-btn:nth-child(2).active { border-color: #1890ff; box-shadow: 0 2px 10px rgba(24,144,255,0.35); }
.theme-grid .theme-btn:nth-child(3) { background: #e8f0e3; color: #3a5a3a; border-color: #c8dba0; }
.theme-grid .theme-btn:nth-child(3).active { border-color: #5a9e42; box-shadow: 0 2px 10px rgba(90,158,66,0.3); }
.theme-grid .theme-btn:nth-child(4) { background: #ede0c8; color: #3d2a00; border-color: #d4c5a9; }
.theme-grid .theme-btn:nth-child(4).active { border-color: #8b6914; box-shadow: 0 2px 10px rgba(139,105,20,0.25); }

/* 字体风格 */
.font-family-grid {
  display: flex; flex-wrap: wrap; gap: 8px;
  background: transparent;
  border-radius: 0;
  padding: 0;
}
.font-btn {
  flex: 0 0 auto; padding: 5px 12px; border: 1.5px solid #e8e8e8; border-radius: 8px;
  background: #fff; cursor: pointer; font-size: 13px; color: #666;
  text-align: center; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}
.font-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
  background: #f0f7ff;
}
.font-btn.active {
  border-color: #1890ff;
  background: #e6f7ff;
  color: #1890ff; font-weight: 600;
  box-shadow: 0 1px 4px rgba(24,144,255,0.15);
}

/* 危险按钮 */
.danger-btn {
  width: 100%;
  padding: 12px 16px; border: 1.5px solid #ffccc7; border-radius: 12px;
  background: #fff2f0; cursor: pointer; font-size: 13px; color: #ff4d4f;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: "Kaiti SC", "STKaiti", "KaiTi", "AR PL UKai CN", serif;
}
.danger-btn:hover {
  background: #ff4d4f; color: #fff; border-color: #ff4d4f;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.35);
  transform: translateY(-1px);
}
.danger-btn:active {
  transform: scale(0.98);
}

/* 朗读面板 */
.read-aloud-panel { display: flex; flex-direction: column; gap: 16px; }
.read-aloud-header { display: flex; justify-content: space-between; align-items: center; }
.read-aloud-title { font-size: 15px; font-weight: 600; color: #333; }
.read-aloud-status { font-size: 12px; color: #999; }
.read-aloud-status.playing { color: #1890ff; }
.read-aloud-controls { display: flex; gap: 8px; justify-content: center; }
.control-btn {
  width: 48px; height: 48px; border: none; border-radius: 10px;
  background: #f5f5f5; cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: #666; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); position: relative;
}
.control-btn:hover { background: #e8e8e8; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.control-btn:active { transform: translateY(0) scale(0.95); box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.control-btn.primary {
  width: 56px; height: 56px; background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%); color: #fff;
  box-shadow: 0 4px 16px rgba(24,144,255,0.35); border-radius: 14px;
}
.control-btn.primary:hover { background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%); transform: translateY(-3px); box-shadow: 0 6px 20px rgba(24,144,255,0.45); }
.control-btn.primary:active { transform: translateY(0) scale(0.96); box-shadow: 0 2px 8px rgba(24,144,255,0.3); }
.read-aloud-settings { display: flex; flex-direction: column; gap: 12px; padding-top: 8px; border-top: 1px solid #f0f0f0; }
.setting-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.setting-row.voice-row { flex-direction: column; gap: 8px; align-items: center; }
.setting-row label { font-size: 13px; color: #666; flex-shrink: 0; }
.setting-row select {
  padding: 8px 10px; border: 1px solid #d0d0d0; border-radius: 8px;
  background: #f8f8f8; font-size: 13px; font-weight: 500; color: #333; outline: none;
  cursor: pointer; appearance: auto; max-width: 160px;
}
.setting-row select:hover { border-color: #1890ff; background: #f0f7ff; }
.setting-row input[type="range"] {
  flex: 1; height: 4px; appearance: none; background: #e8e8e8; border-radius: 2px; outline: none;
}
.setting-row input[type="range"]::-webkit-slider-thumb {
  appearance: none; width: 16px; height: 16px; background: #1890ff; border-radius: 50%;
  cursor: pointer; transition: transform 0.15s;
}
.setting-row input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.15); }
.setting-value { font-size: 12px; color: #1890ff; font-weight: 500; width: 36px; text-align: right; }

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
  background: linear-gradient(180deg, rgba(60,60,60,0.8) 0%, rgba(40,40,40,0.8) 100%);
  border-color: rgba(255,255,255,0.15);
  color: #aaa;
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
.full-toc-item .toc-icon { font-size: 13px; color: #999; flex-shrink: 0; }
.full-toc-item.active { background: rgba(24,144,255,0.1); border-left: 3px solid #1890ff; font-weight: 600; }

/* 主题适配 */
.theme-dark { background: #1a1a1a; color: #e0e0e0; }
.theme-dark .reader-sidebar { background: #1a1a1a; border-color: #333; color: #e0e0e0; }
.theme-dark .sidebar-header { border-color: #333; color: #e0e0e0; }
.theme-dark .toc-icon-btn { background: #2a2a2a; border-color: #444; color: #ccc; }
.theme-dark .toc-icon-btn:hover { background: #444; color: #1890ff; }
.theme-dark .toc-item { color: #ccc; }
.theme-dark .toc-item:hover { background: rgba(255,255,255,0.05); }
.theme-dark .toc-item.active { background: rgba(24,144,255,0.15); border-left-color: #1890ff; color: #e0e0e0; }
.theme-dark .toc-icon { color: #777; }
.theme-dark .collapse-btn { color: #888; }
.theme-dark .collapse-btn:hover { background: rgba(24,144,255,0.2); color: #1890ff; }
.theme-dark .hl-toolbar { background: #2d2d2d; border-color: #444; }
.theme-dark .hl-toolbar::after { border-top-color: #2d2d2d; }
.theme-dark .hl-btn { background: #3a3a3a; border-color: #555; color: #ccc; }
.theme-dark .hl-btn:hover { background: #444; }
.theme-dark .hl-btn-save { background: #1890ff; color: #fff; border-color: #1890ff; }
.theme-dark .hl-btn-save:hover { background: #40a9ff; }
.theme-dark .hl-note-input { background: #3a3a3a; border-color: #555; color: #ccc; }
.theme-dark .hl-note-input:focus { border-color: #1890ff; }
.theme-dark .home-btn, .theme-dark .library-btn {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
  color: #ccc;
}
.theme-dark .home-btn:hover, .theme-dark .library-btn:hover {
  background: rgba(255,255,255,0.18);
  border-color: rgba(255,255,255,0.3);
  color: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.theme-dark .tool-btn {
  background: rgba(255,255,255,0.08);
  color: #aaa;
  border: none;
}
.theme-dark .tool-btn:hover {
  background: rgba(255,255,255,0.15);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.theme-dark .tool-btn:active {
  transform: translateY(0) scale(0.95);
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}
.theme-dark .tool-btn.active {
  background: rgba(24,144,255,0.2);
  color: #1890ff;
}
.theme-dark .annotation-item { background: #2a2a2a; border-color: #444; }
.theme-dark .annotation-text { color: #ccc; }
.theme-dark .annotation-note { color: #999; background: rgba(255,255,255,0.05); }
.theme-dark .annotation-chapter { color: #777; }
.theme-dark .bookmark-item { background: #2a2a2a; border-color: #444; }
.theme-dark .bookmark-item:hover { background: rgba(24,144,255,0.08); border-color: rgba(24,144,255,0.25); }
.theme-dark .bookmark-title { color: #ccc; }
.theme-dark .bm-add-btn { border-color: #555; color: #999; }
.theme-dark .bm-add-btn:hover { border-color: #1890ff; color: #1890ff; background: rgba(24,144,255,0.1); }
.theme-dark .right-panel, .theme-dark .full-toc { background: #1a1a1a; border-color: #333; }
.theme-dark .right-panel-hd { border-color: #333; color: #e0e0e0; }
.theme-dark .reader-right { background: #1a1a1a; border-color: #333; }
.theme-dark .close-btn { background: #444; color: #ccc; }
.theme-dark .shelf-card { background: #383838; border-color: #444; }
.theme-dark .shelf-name { color: #e0e0e0; }
.theme-dark .weight-btn { background: #3a3a3a; border-color: #555; color: #ccc; }
.theme-dark .weight-btn.active { background: #1890ff; color: #fff; border-color: #1890ff; }
.theme-dark .theme-grid .theme-btn:first-child { background: #555; color: #ccc; border-color: #666; }
.theme-dark .theme-grid .theme-btn:first-child.active { border-color: #1890ff; }
.theme-dark .theme-grid .theme-btn:nth-child(2) { background: #1a1a1a; color: #ddd; }
.theme-dark .theme-grid .theme-btn:nth-child(2).active { border-color: #1890ff; }
.theme-dark .theme-grid .theme-btn:nth-child(3) { background: #3a4a3a; color: #b8d8b0; }
.theme-dark .theme-grid .theme-btn:nth-child(3).active { border-color: #5a9e42; }
.theme-dark .size-control button {
  background: linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%);
  border-color: #555; color: #ccc;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.theme-dark .size-control button:hover {
  background: linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 100%);
  border-color: #1890ff; color: #40a9ff;
  box-shadow: 0 2px 8px rgba(24,144,255,0.25);
}
.theme-dark .dot { background: #555; }
.theme-dark .dot.active {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  box-shadow: 0 2px 6px rgba(24,144,255,0.4);
}
.theme-dark .mode-switch { background: #2a2a2a; }
.theme-dark .mode-btn { color: #888; }
.theme-dark .mode-btn:hover:not(.active) { background: rgba(255,255,255,0.05); color: #aaa; }
.theme-dark .mode-btn.active {
  background: #3a3a3a; color: #40a9ff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.theme-dark .font-family-grid { background: transparent; }
.theme-dark .font-btn { color: #777; background: #3a3a3a; border-color: #555; }
.theme-dark .font-btn:hover { color: #aaa; border-color: #40a9ff; background: #444; }
.theme-dark .font-btn.active {
  background: #3a3a3a; color: #40a9ff; border-color: #40a9ff;
  box-shadow: 0 1px 4px rgba(64,169,255,0.2);
}
.theme-dark .chapter-nav-btn {
  background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.15); color: #999;
}
.theme-dark .chapter-nav-btn:hover:not(:disabled) {
  border-color: #40a9ff; color: #40a9ff; background: rgba(64,169,255,0.15);
  box-shadow: 0 4px 12px rgba(64,169,255,0.3);
}
.theme-dark .chapter-nav-btn:active:not(:disabled) { background: rgba(64,169,255,0.2); }
.theme-dark .info-chapter-btn {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.15);
  color: #888;
}
.theme-dark .info-chapter-btn:hover:not(:disabled) {
  background: rgba(64,169,255,0.15);
  border-color: #40a9ff;
  color: #40a9ff;
}
.theme-dark .page-nav-side {
  background: transparent; border-color: rgba(255,255,255,0.2); color: #999;
}
.theme-dark .page-nav-wrapper:hover .page-nav-side {
  color: #40a9ff;
}
.theme-dark .page-nav-wrapper:active .page-nav-side { color: #40a9ff; }
.theme-dark .danger-btn {
  background: rgba(255,77,79,0.1); border-color: rgba(255,77,79,0.3);
  color: #ff7875;
}
.theme-dark .danger-btn:hover {
  background: #ff4d4f; color: #fff; border-color: #ff4d4f;
  box-shadow: 0 4px 12px rgba(255,77,79,0.4);
}
.theme-dark .nav-btn { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: #eee; font-family: "Kaiti SC", "STKaiti", "KaiTi", "AR PL UKai CN", serif; }

.theme-green { background: #e8f0e3; color: #3a5a3a; }
.theme-green .reader-toolbar { background: #e8f0e3; border-color: #d4e8c8; }
.theme-green .reader-sidebar { background: #e8f0e3; border-color: #d4e8c8; }
.theme-green .sidebar-header { border-color: #d4e8c8; }
.theme-green .toc-icon-btn { background: #f0f7eb; border-color: #c8dba0; color: #4a7a4a; }
.theme-green .toc-icon-btn:hover { background: #d8e8d0; color: #5a9e42; }
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
.theme-green .reader-right { background: #e8f0e3; border-color: #d4e8c8; }
.theme-green .right-panel, .theme-green .full-toc { background: #e8f0e3; border-color: #d4e8c8; }
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
.theme-green .chapter-nav-btn {
  background: rgba(232,240,227,0.9); border-color: #c8dba0; color: #5a7a4a;
}
.theme-green .chapter-nav-btn:hover:not(:disabled) {
  border-color: #5a9e42; color: #3a7a2a; background: rgba(90,158,66,0.12);
  box-shadow: 0 4px 12px rgba(90,158,66,0.25);
}
.theme-green .chapter-nav-btn:active:not(:disabled) { background: rgba(90,158,66,0.18); }
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
.theme-green .page-nav-side {
  background: transparent; border-color: #c8dba0; color: #5a7a4a;
}
.theme-green .page-nav-wrapper:hover .page-nav-side {
  color: #3a7a2a;
}
.theme-green .page-nav-wrapper:active .page-nav-side { color: #3a7a2a; }
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
.theme-green .chapter-indicator { background: #fff; color: #3a5a3a; border-color: #c8e0c0; font-weight: 600; }
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
.theme-parchment .toc-icon-btn { background: #f0e6d0; border-color: #d0bea0; color: #5a4a2a; }
.theme-parchment .toc-icon-btn:hover { background: #e0d0b0; color: #8b6914; }
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
.theme-parchment .reader-right { background: #f5e6c8; border-color: #d4c5a9; }
.theme-parchment .right-panel, .theme-parchment .full-toc { background: #f5e6c8; border-color: #d4c5a9; }
.theme-parchment .right-panel-hd { border-color: #d4c5a9; }
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
.theme-parchment .chapter-nav-btn {
  background: rgba(237,224,200,0.9); border-color: #d4c5a9; color: #7a6a4a;
}
.theme-parchment .chapter-nav-btn:hover:not(:disabled) {
  border-color: #8b6914; color: #3d2a00; background: rgba(139,105,20,0.1);
  box-shadow: 0 4px 12px rgba(139,105,20,0.2);
}
.theme-parchment .chapter-nav-btn:active:not(:disabled) { background: rgba(139,105,20,0.15); }
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
.theme-parchment .page-nav-side {
  background: transparent; border-color: #d4c5a9; color: #7a6a4a;
}
.theme-parchment .page-nav-wrapper:hover .page-nav-side {
  color: #3d2a00;
}
.theme-parchment .page-nav-wrapper:active .page-nav-side { color: #3d2a00; }
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
.theme-dark .chapter-indicator { background: rgba(40,40,40,0.9); color: #ccc; border-color: rgba(255,255,255,0.1); }
.theme-parchment .chapter-indicator { background: rgba(255,255,255,0.5); color: #3d2a00; border-color: #c9b894; }
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