const { app, BrowserWindow } = require('electron')
const path = require('path')
const http = require('http')
const fs = require('fs')

// ==================== 日志 ====================
const logFile = path.join(app.getPath('userData'), 'debug.log')
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  try { fs.appendFileSync(logFile, line) } catch (e) {}
  console.log(msg)
}

let mainWindow = null
let ttsServer = null
let staticServer = null
const TTS_PORT = 3004
const STATIC_PORT = 9527

// ==================== 静态文件服务器（提供 dist 目录） ====================

function getDistPath() {
  // 打包后: resources/app.asar/dist/ -> 需要从 asar 中提取
  // 开发时: 项目根目录/dist/
  const packed = path.join(__dirname, '..', 'dist')
  const dev = path.join(process.cwd(), 'dist')
  if (fs.existsSync(packed)) return packed
  return dev
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
}

function startStaticServer() {
  const distPath = getDistPath()
  log(`[Static] dist 目录: ${distPath}`)

  staticServer = http.createServer((req, res) => {
    let urlPath
    try {
      urlPath = decodeURIComponent(req.url.split('?')[0])
    } catch (e) {
      // 畸形 % 序列：decodeURIComponent 会抛异常，直接拒绝
      res.writeHead(400)
      res.end('Bad Request')
      return
    }
    if (urlPath === '/') urlPath = '/index.html'

    const filePath = path.normalize(path.join(distPath, urlPath))

    // 安全检查：防止路径穿越（比较时带上分隔符，避免 dist-backup 等兄弟目录绕过前缀检查）
    if (!filePath.startsWith(distPath + path.sep) && filePath !== distPath) {
      res.writeHead(403)
      res.end('Forbidden')
      return
    }

    // 检查文件是否存在（支持 asar 内读取）
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // SPA fallback: 对非文件请求返回 index.html
        const indexPath = path.join(distPath, 'index.html')
        fs.readFile(indexPath, (err2, data) => {
          if (err2) {
            res.writeHead(404)
            res.end('Not Found')
            return
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(data)
        })
        return
      }

      const ext = path.extname(filePath).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'

      fs.readFile(filePath, (err3, data) => {
        if (err3) {
          res.writeHead(500)
          res.end('Internal Server Error')
          return
        }
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache'
        })
        res.end(data)
      })
    })
  })

  // 仅监听本机回环地址，避免局域网访问
  staticServer.listen(STATIC_PORT, '127.0.0.1', () => {
    log(`[Static] 文件服务器运行在 http://localhost:${STATIC_PORT}`)
  })

  staticServer.on('error', (err) => {
    log(`[Static] 启动失败: ${err.message}`)
  })
}

function stopStaticServer() {
  if (staticServer) {
    try { staticServer.close() } catch (e) {}
    staticServer = null
  }
}

// ==================== TTS 服务器 ====================

// 代理配置（国内访问微软 TTS 服务需要）
// 优先级：环境变量 TTS_PROXY > Windows 系统代理 > 无代理
function detectSystemProxy() {
  try {
    const { execSync } = require('child_process')
    // 读取 Windows 系统代理设置
    const output = execSync('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable', { encoding: 'utf8' })
    const enabled = /0x1/i.test(output)
    if (!enabled) return ''
    const serverOutput = execSync('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer', { encoding: 'utf8' })
    const match = serverOutput.match(/REG_SZ\s+(.+)/)
    if (match) {
      let proxy = match[1].trim()
      // 处理 "ip:port" 格式，补全为 http://
      if (proxy && !proxy.startsWith('http')) {
        proxy = 'http://' + proxy
      }
      log(`[TTS] 检测到系统代理: ${proxy}`)
      return proxy
    }
  } catch (e) {
    log(`[TTS] 检测系统代理失败: ${e.message}`)
  }
  return ''
}

const TTS_PROXY = process.env.TTS_PROXY || detectSystemProxy()

function startTTSServer() {
  let EdgeTTS
  try {
    EdgeTTS = require('edge-tts-universal').EdgeTTS
    log('[TTS] edge-tts-universal 加载成功')
  } catch (err) {
    log(`[TTS] edge-tts-universal 加载失败: ${err.message}`)
    return
  }

  const REQUEST_TIMEOUT = 15000  // 15s 超时（之前 60s 太长）

  ttsServer = http.createServer(async (req, res) => {
    const startTime = Date.now()
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }

    if (req.url === '/api/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok', proxy: TTS_PROXY || 'none' }))
      return
    }

    // 批量合成端点
    if (req.url === '/api/tts/batch' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => { body += chunk.toString() })
      req.on('end', async () => {
        try {
          const { sentences, voice = 'zh-CN-XiaoxiaoNeural', rate = '+0%', volume = '+0%', pitch = '+0Hz' } = JSON.parse(body)
          if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: '缺少 sentences 参数' }))
            return
          }
          const combinedText = sentences
            .map(s => typeof s === 'string' ? s.replace(/<[^>]*>/g, ' ').trim() : '')
            .filter(s => s.length > 0)
            .join('\n')
          if (!combinedText) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: '所有句子均为空' }))
            return
          }
          log(`[TTS] 批量: ${sentences.length}句, voice=${voice}, ${combinedText.length}字`)
          const ttsOpts = { rate, volume, pitch }
          if (TTS_PROXY) ttsOpts.proxy = TTS_PROXY
          const tts = new EdgeTTS(combinedText, voice, ttsOpts)
          const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('TTS timeout')), REQUEST_TIMEOUT))
          const result = await Promise.race([tts.synthesize(), timeout])
          const audioBuffer = Buffer.from(await result.audio.arrayBuffer())
          res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': audioBuffer.length })
          res.end(audioBuffer)
          log(`[TTS] 批量完成: ${audioBuffer.length}bytes, ${Date.now() - startTime}ms`)
        } catch (error) {
          log(`[TTS Batch] 错误: ${error.message}`)
          const statusCode = error.message === 'TTS timeout' ? 504 : 500
          res.writeHead(statusCode, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'TTS 合成失败', message: error.message }))
        }
      })
      return
    }

    if (req.url === '/api/tts' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => { body += chunk.toString() })
      req.on('end', async () => {
        try {
          const { text, voice = 'zh-CN-XiaoxiaoNeural', rate = '+0%', volume = '+0%', pitch = '+0Hz' } = JSON.parse(body)
          if (!text || typeof text !== 'string') {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: '缺少 text 参数' }))
            return
          }
          const cleanText = text.replace(/<[^>]*>/g, ' ').trim()
          if (!cleanText) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: '文本为空' }))
            return
          }
          const ttsOpts = { rate, volume, pitch }
          if (TTS_PROXY) ttsOpts.proxy = TTS_PROXY
          const tts = new EdgeTTS(cleanText, voice, ttsOpts)
          const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('TTS timeout')), REQUEST_TIMEOUT))
          const result = await Promise.race([tts.synthesize(), timeout])
          const audioBuffer = Buffer.from(await result.audio.arrayBuffer())
          res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': audioBuffer.length })
          res.end(audioBuffer)
        } catch (error) {
          log(`[TTS] 错误: ${error.message}`)
          const statusCode = error.message === 'TTS timeout' ? 504 : 500
          res.writeHead(statusCode, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'TTS 合成失败', message: error.message }))
        }
      })
      return
    }

    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  })

  // 仅监听本机回环地址，避免局域网访问
  ttsServer.listen(TTS_PORT, '127.0.0.1', () => {
    log(`[TTS Server] 运行在 http://localhost:${TTS_PORT}`)
    log(`[TTS Server] 代理: ${TTS_PROXY || '未设置（直连）'}`)
  })

  ttsServer.on('error', (err) => {
    if (err.code !== 'EADDRINUSE') {
      log(`[TTS Server] 启动失败: ${err.message}`)
    }
  })
}

function stopTTSServer() {
  if (ttsServer) { try { ttsServer.close() } catch (e) {} ttsServer = null }
}

// ==================== Electron 窗口 ====================

let splashWindow = null

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 320,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  })

  const splashPath = path.join(__dirname, 'splash.html')
  splashWindow.loadFile(splashPath)
  splashWindow.on('closed', () => { splashWindow = null })
}

function createWindow() {
  // 图标路径：extraResources 确保图标文件始终可访问
  const finalIcon = path.join(process.resourcesPath, 'icon.png')

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'QReader - 电子书阅读器',
    icon: finalIcon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false
  })

  // 通过 HTTP 服务器加载，避免 file:// + crossorigin 问题
  const url = `http://localhost:${STATIC_PORT}/`
  log(`[Electron] 加载: ${url}`)
  mainWindow.loadURL(url)

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    log(`[Electron] 页面加载失败: ${errorCode} ${errorDescription} ${validatedURL}`)
  })

  mainWindow.once('ready-to-show', () => {
    // 关闭启动画面，显示主窗口
    if (splashWindow) {
      splashWindow.close()
      splashWindow = null
    }
    mainWindow.show()
    mainWindow.maximize()
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// ==================== 应用生命周期 ====================

app.whenReady().then(() => {
  // 先显示启动画面
  createSplashWindow()
  // 启动服务
  startStaticServer()
  startTTSServer()
  // 创建主窗口（后台加载，不显示）
  createWindow()
})

app.on('window-all-closed', () => {
  stopTTSServer()
  stopStaticServer()
  app.quit()
})

app.on('before-quit', () => {
  stopTTSServer()
  stopStaticServer()
})

process.on('uncaughtException', (err) => {
  log(`[Electron] Uncaught Exception: ${err.message}`)
})

process.on('unhandledRejection', (reason) => {
  log(`[Electron] Unhandled Rejection: ${reason}`)
})
