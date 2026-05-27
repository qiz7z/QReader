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

        <div v-show="!showTocPanel" class="sidebar-collapsed">
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
  <main class="reader-main" ref="mainRef" :class="{ 'page-mode': readerStore.readerMode === 'page' }" @click="rightPanel = ''">
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
    <div v-else-if="book" class="reader-content-wrap" :class="{ 'page-mode-wrap': readerStore.readerMode === 'page' }">
          <!-- 滚动模式：所有章节连续显示 -->
          <div
            v-if="readerStore.readerMode === 'scroll'"
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
          </div>

          <!-- 翻页模式：transform 平移翻页 -->
          <div
            v-else
            class="reader-content-page"
            ref="pageContentRef"
          >
            <div
              class="page-content-inner"
              ref="pageContentInnerRef"
              :style="{ ...contentStyle, transform: `translateY(${-currentPage * pageHeight}px)` }"
              @mouseup="handleTextSelection"
            >
              <p
                v-for="(paragraph, idx) in highlightedSentences"
                :key="idx"
                :ref="el => setSentenceRef(el as HTMLElement | null, idx)"
                :class="{ 'read-aloud-active': isReadAloudPlaying && idx === currentSentenceIndex }"
                v-html="paragraph"
              />
            </div>

            <!-- 翻页点击区域 -->
            <div class="page-turn-area left" @click="prevPageContent"></div>
            <div class="page-turn-area right" @click="nextPageContent"></div>

            <!-- 页码指示 -->
            <div class="page-indicator">
              {{ currentPage + 1 }} / {{ totalPages }}
            </div>
          </div>
        </div>
        <div v-else class="loading">加载中...</div>

        <!-- 章节导航 -->
        <div v-if="!isFullscreen && bookFormat !== 'pdf'" class="reader-nav-cr">
          <div class="nav-buttons">
            <button class="nav-btn" @click="prevPage" :disabled="currentChapter <= 0">上一章</button>
            <button class="nav-btn" @click="nextPage" :disabled="currentChapter >= (book?.content?.length || 1) - 1">下一章</button>
          </div>
          <div class="chapter-indicator" v-if="!isJumping" @click="startJump">
            {{ currentChapter + 1 }} / {{ book?.content?.length || 0 }}
          </div>
          <div v-else class="chapter-jump-input-wrapper">
            <input
              type="number"
              v-model.number="jumpInput"
              @keyup.enter="confirmJump"
              @blur="confirmJump"
              ref="jumpInputRef"
              class="chapter-input"
              min="1"
              :max="book?.content?.length || 1"
            />
          </div>
        </div>

        <!-- 悬浮全屏按钮 -->
        <button v-if="!isFullscreen" class="fullscreen-btn-float" @click="toggleFullscreen" title="全屏阅读">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path>
            <path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path>
          </svg>
        </button>

        <!-- 左下角阅读信息 -->
        <div v-if="book && bookFormat !== 'pdf'" class="reader-info-bar">
          <span class="info-time">{{ currentTime }}</span>
          <span class="info-divider">|</span>
          <span class="info-progress">{{ wordsRead }} / {{ totalWords }} 字</span>
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
      <aside class="reader-right" @click.stop>
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
                    {{ isSpeechError ? '出错' : isReadAloudPlaying ? '正在朗读...' : synth ? '准备就绪' : '不支持' }}
                  </div>
                </div>
                
                <div class="read-aloud-controls">
                  <button class="control-btn primary" @click="toggleReadAloud" :title="isReadAloudPlaying ? '暂停' : '开始朗读'" :disabled="!synth || voiceCache.length === 0">
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
                      <option v-for="voice in voiceCache" :key="voice.name" :value="voice.name">
                        {{ voice.label }}
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
                  <span class="size-label">{{ lineHeightLabels[readerStore.lineHeight - 1] }}</span>
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

    <!-- 全屏导航 -->
    <div v-if="isFullscreen && bookFormat !== 'pdf'" class="fullnav">
      <button class="nav-btn" @click="prevPage" :disabled="currentChapter <= 0">上一章</button>
      
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

      <button class="nav-btn" @click="nextPage" :disabled="currentChapter >= (book?.content?.length || 1) - 1">下一章</button>
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
const minW = 120
const maxW = 400

// 翻页模式相关状态
const currentPage = ref(0)
const totalPages = ref(1)
const pageHeight = ref(0)
const pageContentRef = ref<HTMLElement | null>(null)
const pageContentInnerRef = ref<HTMLElement | null>(null)

const rightPanel = ref('')
const shelfList = ref<Array<{ id: string; title: string; cover: ArrayBuffer | null }>>([])
const showFullToc = ref(false)
const jumpInput = ref('')
const isJumping = ref(false)
const jumpInputRef = ref<HTMLInputElement | null>(null)

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
let synth: SpeechSynthesis | null = null
let currentSentenceIndex = ref(0)
let isAutoAdvancingChapter = false // 朗读自动跳章标记
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

const lineHeightLabels = ['紧凑', '适中', '标准', '宽松', '超宽']

function getFontWeightStyle(fw: number) {
  // Windows 优化：用多层阴影堆叠模拟真实加粗效果
  if (fw === 1) return { 
    fontWeight: 300,
    textShadow: 'none',
    fontSynthesis: 'none'
  }
  if (fw === 2) return { 
    fontWeight: 400,
    textShadow: `
      -0.3px -0.3px 0 currentColor,
      0.3px -0.3px 0 currentColor,
      -0.3px 0.3px 0 currentColor,
      0.3px 0.3px 0 currentColor
    `,
    fontSynthesis: 'weight'
  }
  if (fw === 3) return { 
    fontWeight: 400,
    textShadow: `
      -0.5px -0.5px 0 currentColor,
      0.5px -0.5px 0 currentColor,
      -0.5px 0.5px 0 currentColor,
      0.5px 0.5px 0 currentColor,
      0 -0.5px 0 currentColor,
      0 0.5px 0 currentColor
    `,
    fontSynthesis: 'weight'
  }
  if (fw === 4) return { 
    fontWeight: 500,
    textShadow: `
      -0.8px -0.8px 0 currentColor,
      0.8px -0.8px 0 currentColor,
      -0.8px 0.8px 0 currentColor,
      0.8px 0.8px 0 currentColor,
      -0.8px 0 0 currentColor,
      0.8px 0 0 currentColor,
      0 -0.8px 0 currentColor,
      0 0.8px 0 currentColor
    `,
    fontSynthesis: 'weight'
  }
  return { 
    fontWeight: 700,
    textShadow: `
      -1px -1px 0 currentColor,
      1px -1px 0 currentColor,
      -1px 1px 0 currentColor,
      1px 1px 0 currentColor,
      -1px 0 0 currentColor,
      1px 0 0 currentColor,
      0 -1px 0 currentColor,
      0 1px 0 currentColor,
      -0.5px -0.5px 0 currentColor,
      0.5px -0.5px 0 currentColor,
      -0.5px 0.5px 0 currentColor,
      0.5px 0.5px 0 currentColor
    `,
    fontSynthesis: 'weight'
  }
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

// 翻页模式：重新计算每页高度和总页数
async function recalcPage() {
  if (readerStore.readerMode !== 'page') return
  await nextTick()
  const container = pageContentRef.value
  const content = pageContentInnerRef.value
  if (!container || !content) return

  pageHeight.value = container.clientHeight
  totalPages.value = Math.max(1, Math.ceil(content.scrollHeight / pageHeight.value))
  if (currentPage.value >= totalPages.value) {
    currentPage.value = Math.max(0, totalPages.value - 1)
  }
}

// 监听影响分页的配置变化
watch(
  () => [currentChapter.value, readerStore.fontSize, readerStore.lineHeight, readerStore.fontWeight, readerStore.fontFamily],
  () => {
    if (readerStore.readerMode === 'page') {
      currentPage.value = 0
      recalcPage()
    }
  }
)

// 翻页模式下的翻页逻辑
function prevPageContent() {
  if (currentPage.value > 0) {
    currentPage.value--
  } else if (currentChapter.value > 0) {
    // 如果已经是第一页，则跳到上一章的最后一页
    currentChapter.value--
    nextTick(() => {
      currentPage.value = totalPages.value - 1
    })
  }
}

function nextPageContent() {
  if (currentPage.value < totalPages.value - 1) {
    currentPage.value++
  } else if (book.value && currentChapter.value < book.value.content.length - 1) {
    // 如果已经是最后一页，则跳到下一章的第一页
    currentChapter.value++
    currentPage.value = 0
  }
}

function prevPage() {
  if (readerStore.readerMode === 'page') {
    prevPageContent()
  } else {
    if (currentChapter.value > 0) {
      pageTransition.value = 'page-back'
      currentChapter.value--
      scrollToChapterStart()
    }
  }
}

function nextPage() {
  if (readerStore.readerMode === 'page') {
    nextPageContent()
  } else {
    if (book.value && currentChapter.value < book.value.content.length - 1) {
      pageTransition.value = 'page-forward'
      currentChapter.value++
      scrollToChapterStart()
    }
  }
}

// 键盘翻页
function handleKeydown(e: KeyboardEvent) {
  if (readerStore.readerMode !== 'page') return
  if (rightPanel.value) return // 如果右侧面板打开，不处理键盘事件

  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    prevPageContent()
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
    e.preventDefault()
    nextPageContent()
  }
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
}

async function deleteHighlight(id: string) {
  await StorageService.deleteNote(id)
  highlights.value = highlights.value.filter(h => h.id !== id)
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

// 翻页模式：内容变化时重新计算页数
watch(() => [highlightedSentences.value.length, readerStore.readerMode], () => {
  if (readerStore.readerMode === 'page') {
    currentPage.value = 0
    recalcPage()
  }
}, { immediate: true })

const allHighlights = computed(() => highlights.value)

// 朗读功能 - 增强稳定性
let speechQueue: SpeechSynthesisUtterance[] = []
let isSpeechError = ref(false)
let retryCount = ref(0)
const MAX_RETRY = 3

// 语音缓存
const voiceCache = ref<Array<{ name: string; label: string }>>([])
const isVoicesLoaded = ref(false)

function initSpeechSynthesis() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[TTS] Speech Synthesis not supported')
    return
  }
  
  synth = window.speechSynthesis
  
  // 防止重复加载
  if (isVoicesLoaded.value) return
  
  const loadVoices = () => {
    // 添加延迟确保语音加载完成
    setTimeout(() => {
      try {
        const voices = synth!.getVoices()
        if (!voices || voices.length === 0) {
          // 语音未就绪，稍后重试
          if (retryCount.value < MAX_RETRY) {
            retryCount.value++
            loadVoices()
            return
          }
          console.warn('[TTS] No voices available after retries')
          return
        }
        
        retryCount.value = 0
        isVoicesLoaded.value = true
        
        // 筛选中文语音
        const zhVoices = voices.filter(v => v.lang.startsWith('zh'))
        
        voiceCache.value = (zhVoices.length > 0 ? zhVoices : voices).map(v => ({
          name: v.name,
          label: v.name.replace(/ - .*$/, '').trim() || v.name
        }))
        
        // 从缓存加载默认语音
        const saved = localStorage.getItem('reader-voice')
        if (saved && voiceCache.value.find(v => v.name === saved)) {
          selectedVoiceName.value = saved
        } else if (voiceCache.value.length > 0) {
          selectedVoiceName.value = voiceCache.value[0].name
        }
      } catch (err) {
        console.error('[TTS] Error loading voices:', err)
        if (retryCount.value < MAX_RETRY) {
          retryCount.value++
          setTimeout(loadVoices, 500 * retryCount.value)
        }
      }
    }, 100 + (retryCount.value * 100))
  }
  
  // 首次加载
  loadVoices()
  
  // 监听语音变化
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => {
      if (!isVoicesLoaded.value) {
        loadVoices()
      }
    }
  }
}

// 从指定段落开始朗读 - 增强错误处理
function readFromSentence(startIndex: number) {
  if (!synth || sentences.value.length === 0) return
  
  currentSentenceIndex.value = startIndex
  const text = sentences.value[startIndex].replace(/<[^>]*>/g, ' ').trim()
  
  if (!text) {
    if (startIndex < sentences.value.length - 1) {
      readFromSentence(startIndex + 1)
    } else {
      stopReadAloud()
    }
    return
  }
  
  // 检查语音是否可用
  if (!isVoicesLoaded.value || voiceCache.value.length === 0) {
    console.warn('[TTS] Voices not loaded yet, waiting...')
    setTimeout(() => readFromSentence(startIndex), 200)
    return
  }
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = speechRate.value
  utterance.pitch = 1.0
  utterance.volume = 1.0
  
  // 设置语音
  const voices = synth.getVoices()
  const selectedVoice = voices.find(v => v.name === selectedVoiceName.value)
  if (selectedVoice) {
    utterance.voice = selectedVoice
  }
  
  // 错误处理
  utterance.onerror = (event) => {
    console.error('[TTS] Error:', event)
    isSpeechError.value = true
    
    // 尝试恢复
    if (retryCount.value < MAX_RETRY) {
      retryCount.value++
      console.log(`[TTS] Retrying ${retryCount.value}/${MAX_RETRY}...`)
      setTimeout(() => {
        isSpeechError.value = false
        readFromSentence(startIndex)
      }, 500 * retryCount.value)
    } else {
      console.error('[TTS] Max retries reached, stopping')
      stopReadAloud()
    }
  }
  
  utterance.onstart = () => {
    isSpeechError.value = false
    retryCount.value = 0
    isReadAloudPlaying.value = true
    // scrollToSentence(startIndex) - temporarily disabled
  }
  
  utterance.onend = () => {
    if (isSpeechError.value) return
    
    if (startIndex < sentences.value.length - 1) {
      readFromSentence(startIndex + 1)
    } else if (currentChapter.value < (book.value?.content?.length || 1) - 1) {
      // 下一章
      currentChapter.value++
      // loadChapter(currentChapter.value) - temporarily disabled
      setTimeout(() => readFromSentence(0), 300)
    } else {
      stopReadAloud()
    }
  }
  
  // 停止之前的朗读
  synth.cancel()
  speechQueue.push(utterance)
  synth.speak(utterance)
}

function stopReadAloud() {
  if (synth) {
    synth.cancel()
    speechQueue = []
  }
  isReadAloudPlaying.value = false
  isSpeechError.value = false
  retryCount.value = 0
  currentSentenceIndex.value = 0
}

function toggleReadAloud() {
  if (isReadAloudPlaying.value) {
    pauseReadAloud()
  } else {
    readFromSentence(currentSentenceIndex.value)
  }
}

function pauseReadAloud() {
  if (synth && isReadAloudPlaying.value) {
    synth.pause()
    isReadAloudPlaying.value = false
  }
}

function _resumeReadAloud() {
  if (synth && !isReadAloudPlaying.value) {
    synth.resume()
    isReadAloudPlaying.value = true
  }
}

function onVoiceChange() {
  // 保存选择
  try {
    localStorage.setItem('reader-voice', selectedVoiceName.value)
  } catch {}
  
  // 如果正在朗读，重新朗读以应用新音色
  if (isReadAloudPlaying.value) {
    stopReadAloud()
    setTimeout(() => {
      readFromSentence(currentSentenceIndex.value)
    }, 100)
  }
}

function updateSettings() {
  // 保存设置
  try {
    localStorage.setItem('reader-speech-rate', String(speechRate.value))
  } catch {}
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
  jumpInput.value = String(currentChapter.value + 1)
  isJumping.value = true
  setTimeout(() => {
    jumpInputRef.value?.focus()
    jumpInputRef.value?.select()
  }, 50)
}

function confirmJump() {
  const max = book.value?.content?.length || 1
  const target = parseInt(jumpInput.value, 10)
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

onMounted(async () => {
  startClock()
  document.addEventListener('keydown', handleKeydown)
  try { const s = localStorage.getItem('reader-sidebar-width'); if (s) { const n = parseInt(s, 10); if (!Number.isNaN(n)) sidebarWidth.value = Math.max(minW, Math.min(maxW, n)) } } catch {}
  
  // 加载语音设置
  try {
    const rate = localStorage.getItem('reader-speech-rate')
    if (rate) speechRate.value = parseFloat(rate)
  } catch {}
  
  initSpeechSynthesis()
  await loadShelf()
  await loadBook(bookId.value)
  document.addEventListener('fullscreenchange', onFs)
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

onBeforeUnmount(() => { 
  if (timeTimer) clearInterval(timeTimer)
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('fullscreenchange', onFs)
  stopReadAloud()
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
.reader-main { flex: 1; overflow-y: auto; position: relative; min-width: 0; background: #fff; transition: background 0.3s, color 0.3s; }
.reader-main.page-mode { overflow: hidden; }
.reader-content-wrap { flex: 1; overflow-y: auto; }
.reader-content-wrap.page-mode-wrap {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.reader-content { max-width: 720px; margin: 0 auto; padding: 16px 20px 100px; }
.reader-content-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px 20px 100px;
  flex: 1;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}
.page-content-inner {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
  flex-shrink: 0;
}
.page-turn-area {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 30%;
  cursor: pointer;
  z-index: 10;
  transition: background 0.2s;
}
.page-turn-area.left {
  left: 0;
}
.page-turn-area.right {
  right: 0;
}
.page-turn-area:hover {
  background: rgba(24, 144, 255, 0.05);
}
.page-turn-area.left:hover {
  background: linear-gradient(to right, rgba(24, 144, 255, 0.1), transparent);
}
.page-turn-area.right:hover {
  background: linear-gradient(to left, rgba(24, 144, 255, 0.1), transparent);
}
.page-indicator {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  z-index: 30;
  pointer-events: none;
}
.reader-content :deep(img) {
  max-width: 100%; height: auto; display: block;
  margin: 1em auto; border-radius: 4px;
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
.reader-nav-cr { position: fixed; right: 76px; bottom: 20px; display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 30; }
.nav-buttons { display: flex; gap: 8px; }
.nav-btn { padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(0,0,0,0.08); background: rgba(255,255,255,0.85); backdrop-filter: blur(4px); color: #333; cursor: pointer; font-size: 13px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: all 0.2s; display: flex; align-items: center; gap: 4px; }
.nav-btn:hover:not(:disabled) { background: rgba(24,144,255,0.1); border-color: #1890ff; color: #1890ff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(24,144,255,0.15); }
.nav-btn:active:not(:disabled) { transform: translateY(0); }
.nav-btn:disabled { opacity: 0.4; cursor: not-allowed; background: rgba(240,240,240,0.5); }
.chapter-indicator { background: rgba(255,255,255,0.9); padding: 4px 14px; border-radius: 14px; font-family: 'Georgia', 'Times New Roman', serif; font-size: 14px; font-weight: 500; color: #555; box-shadow: 0 2px 6px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.04); letter-spacing: 1px; cursor: pointer; transition: all 0.2s; }
.chapter-indicator:hover { background: rgba(24,144,255,0.05); border-color: rgba(24,144,255,0.3); color: #1890ff; }

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

/* 左下角阅读信息 */
.reader-info-bar {
  position: fixed;
  bottom: 14px;
  left: 80px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 20px;
  font-size: 14px;
  color: #888;
  z-index: 50;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-weight: 500;
  letter-spacing: 0.5px;
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
  background: rgba(40,40,40,0.8);
  border-color: rgba(255,255,255,0.08);
  color: #999;
}
.theme-green .reader-info-bar {
  background: rgba(232,240,227,0.85);
  border-color: rgba(74,122,74,0.15);
  color: #5a7a5a;
}
.theme-parchment .reader-info-bar {
  background: rgba(240,226,200,0.85);
  border-color: rgba(180,160,120,0.2);
  color: #7a6a4a;
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
.tool-btn { width: 52px; height: 52px; border: none; background: rgba(0,0,0,0.06); cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; border-radius: 8px; flex-shrink: 0; }
.tool-btn svg { width: 20px; height: 20px; }
.bottom-fullscreen-btn { margin-top: auto; }
.tool-btn:hover { background: rgba(0,0,0,0.12); }
.tool-btn.active { background: rgba(24,144,255,0.15); color: #1890ff; }

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
.settings-panel { display: flex; flex-direction: column; gap: 20px; }
.setting-group { display: flex; flex-direction: column; gap: 10px; }
.group-label { font-size: 13px; color: #666; font-weight: 500; }
.size-control { display: flex; align-items: center; gap: 10px; }
.size-control button {
  width: 32px; height: 32px; border: 1px solid #ddd; border-radius: 6px;
  background: #fff; cursor: pointer; font-size: 16px; color: #333;
  display: flex; align-items: center; justify-content: center;
}
.size-control button:hover { border-color: #1890ff; color: #1890ff; }
.size-dots { flex: 1; display: flex; gap: 6px; justify-content: center; }
.dot { width: 12px; height: 12px; border-radius: 3px; background: #e8e8e8; transition: background 0.2s; }
.dot.active { background: #1890ff; }
.size-label { font-size: 12px; color: #1890ff; font-weight: 500; min-width: 32px; text-align: center; flex-shrink: 0; }
.mode-switch {
  display: flex;
  gap: 0;
  background: #f0f0f0;
  border-radius: 8px;
  padding: 3px;
  width: fit-content;
}
.mode-btn {
  padding: 6px 18px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #888;
  transition: all 0.2s;
}
.mode-btn.active {
  background: #fff;
  color: #1890ff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  font-weight: 600;
}
.mode-btn:hover:not(.active) {
  color: #555;
}
.weight-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.weight-btn {
  padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px;
  background: #fff; cursor: pointer; font-size: 12px; color: #666;
}
.weight-btn.active { background: #1890ff; color: #fff; border-color: #1890ff; }
.theme-grid { display: flex; gap: 8px; }
.theme-btn {
  flex: 1; height: 44px; border: 2px solid transparent; border-radius: 10px;
  cursor: pointer; font-size: 13px; font-weight: 500;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.theme-grid .theme-btn:first-child { background: #fff; color: #333; border-color: #e0e0e0; }
.theme-grid .theme-btn:first-child.active { border-color: #333; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.theme-grid .theme-btn:nth-child(2) { background: #2d2d2d; color: #fff; }
.theme-grid .theme-btn:nth-child(2).active { border-color: #1890ff; box-shadow: 0 2px 8px rgba(24,144,255,0.3); }
.theme-grid .theme-btn:nth-child(3) { background: #e8f0e3; color: #3a5a3a; }
.theme-grid .theme-btn:nth-child(3).active { border-color: #5a9e42; box-shadow: 0 2px 8px rgba(90,158,66,0.3); }
.theme-grid .theme-btn:nth-child(4) { background: #ede0c8; color: #3d2a00; border-color: #d4c5a9; }
.theme-grid .theme-btn:nth-child(4).active { border-color: #8b6914; box-shadow: 0 2px 8px rgba(139,105,20,0.2); }
.font-family-grid { display: flex; gap: 0; }
.font-btn {
  flex: 1; padding: 8px 2px; border: none; border-bottom: 2px solid transparent;
  background: transparent; cursor: pointer; font-size: 12px; color: #999;
  text-align: center; transition: all 0.2s;
}
.font-btn.active { color: #333; border-bottom-color: #1890ff; font-weight: 600; }
.danger-btn {
  padding: 8px 14px; border: 1px solid #ff4d4f; border-radius: 6px;
  background: #fff; cursor: pointer; font-size: 13px; color: #ff4d4f;
}
.danger-btn:hover { background: #ff4d4f; color: #fff; }

/* 朗读面板 */
.read-aloud-panel { display: flex; flex-direction: column; gap: 16px; }
.read-aloud-header { display: flex; justify-content: space-between; align-items: center; }
.read-aloud-title { font-size: 15px; font-weight: 600; color: #333; }
.read-aloud-status { font-size: 12px; color: #999; }
.read-aloud-status.playing { color: #1890ff; }
.read-aloud-controls { display: flex; gap: 8px; justify-content: center; }
.control-btn {
  width: 48px; height: 48px; border: none; border-radius: 8px;
  background: #f5f5f5; cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: #666; transition: all 0.2s;
}
.control-btn:hover { background: #e8e8e8; }
.control-btn.primary {
  width: 56px; height: 56px; background: #1890ff; color: #fff;
  box-shadow: 0 4px 12px rgba(24,144,255,0.3);
}
.control-btn.primary:hover { background: #40a9ff; transform: translateY(-1px); }
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

/* 段落高亮 */
.reader-content p.read-aloud-active {
  background: rgba(24,144,255,0.08);
  border-left: 3px solid #1890ff;
  padding-left: 12px;
  transition: all 0.3s;
}
.theme-dark .reader-content p.read-aloud-active {
  background: rgba(24,144,255,0.15);
  border-left-color: #40a9ff;
}

/* 全屏导航 */
.fullnav { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; z-index: 100; padding: 6px; background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
.fullnav .nav-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.15); color: #fff; cursor: pointer; font-size: 14px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.2s; display: flex; align-items: center; }
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
.theme-dark .size-control button { background: #3a3a3a; border-color: #555; color: #ccc; }
.theme-dark .dot { background: #555; }
.theme-dark .dot.active { background: #1890ff; }
.theme-dark .size-label { color: #40a9ff; }
.theme-dark .mode-switch { background: #2a2a2a; }
.theme-dark .mode-btn { color: #aaa; }
.theme-dark .mode-btn.active { background: #3a3a3a; color: #40a9ff; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
.theme-dark .font-btn { background: transparent; color: #888; }
.theme-dark .font-btn.active { color: #fff; border-bottom-color: #1890ff; }
.theme-dark .danger-btn { background: #3a3a3a; border-color: #ff4d4f; color: #ff4d4f; }
.theme-dark .danger-btn:hover { background: #ff4d4f; color: #fff; }
.theme-dark .nav-btn { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: #eee; }

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
.theme-green .size-control button { background: #f0f7eb; border-color: #c8dba0; }
.theme-green .font-btn { background: transparent; color: #8aaa80; }
.theme-green .font-btn.active { color: #2d4a2d; border-bottom-color: #5a9e42; }
.theme-green .dot { background: #c8dba0; }
.theme-green .dot.active { background: #5a9e42; }
.theme-green .size-label { color: #5a9e42; }
.theme-green .mode-switch { background: #d8e8d0; }
.theme-green .mode-btn { color: #6a8a6a; }
.theme-green .mode-btn.active { background: #f0f7eb; color: #5a9e42; box-shadow: 0 1px 4px rgba(90,158,66,0.1); }
.theme-green .resize-bar:hover { background: rgba(46,74,46,0.1); }
.theme-green .nav-btn { background: #fff; color: #3a5a3a; border-color: #c8e0c0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); font-weight: 600; }
.theme-green .nav-btn:hover:not(:disabled) { background: #f4f9f0; color: #1e3a1e; border-color: #a8c8a0; }
.theme-green .chapter-indicator { background: #fff; color: #3a5a3a; border-color: #c8e0c0; font-weight: 600; }
.theme-green .chapter-input { border-color: #c8e0c0; color: #1e3a1e; box-shadow: 0 2px 6px rgba(58,90,58,0.15); }
.theme-green .fullscreen-btn-float { background: #fff; color: #3a5a3a; border-color: #c8e0c0; }
.theme-green .fullscreen-btn-float:hover { background: #f4f9f0; color: #1e3a1e; }

.theme-dark .reader-main { background: #1a1a1a; color: #d0d0d0; }
.theme-green .reader-main { background: #e8f0e3; color: #3a3a3a; }
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
.theme-parchment .size-label { color: #8b6914; }
.theme-parchment .mode-switch { background: #e0d0b0; }
.theme-parchment .mode-btn { color: #7a6a4a; }
.theme-parchment .mode-btn.active { background: #f0e6d0; color: #8b6914; box-shadow: 0 1px 4px rgba(139,105,20,0.1); }
.theme-parchment .font-btn { background: transparent; color: #8a7a5a; }
.theme-parchment .font-btn.active { color: #3d2a00; border-bottom-color: #8b6914; }
.theme-parchment .close-btn { background: #d4c5a9; color: #3d2a00; }
.theme-parchment .danger-btn { border-color: #c04040; color: #c04040; }
.theme-parchment .danger-btn:hover { background: #c04040; color: #fff; }
.theme-parchment .nav-btn { background: rgba(255,255,255,0.3); color: #3d2a00; border-color: #c9b894; }
.theme-parchment .reader-main { background: #f5e6c8; color: #3d2a00; }
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

/* PDF 文本选中浮动工具栏 */
</style>