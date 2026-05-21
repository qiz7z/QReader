const { app, BrowserWindow, session, ipcMain } = require('electron')
const path = require('path')
const http = require('http')
const fs = require('fs')
const crypto = require('crypto')
const WebSocket = require('ws')

// ======== 文件存储（替代 IndexedDB 存 Blob） ========
const DATA_DIR = path.join(app.getPath('userData'), 'books')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

// 通过文件路径复制（避免 IPC 传大文件二进制数据）
ipcMain.handle('file:save-from-path', function(event, bookId, srcPath) {
  try {
    ensureDataDir()
    var fp = path.join(DATA_DIR, bookId + '.dat')
    fs.copyFileSync(srcPath, fp)
    return { success: true, path: fp }
  } catch (err) {
    return { success: false, error: (err && err.message) ? err.message : String(err) }
  }
})

ipcMain.handle('file:load', function(event, bookId) {
  try {
    var fp = path.join(DATA_DIR, bookId + '.dat')
    if (!fs.existsSync(fp)) return null
    var buf = fs.readFileSync(fp)
    // 使用 Uint8Array 再取 buffer，避免 Node.js Buffer 的共享 ArrayBuffer 问题
    var u8 = new Uint8Array(buf)
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
  } catch (err) {
    console.error('[FileLoad]', err)
    return null
  }
})

ipcMain.handle('file:delete', function(event, bookId) {
  try {
    var fp = path.join(DATA_DIR, bookId + '.dat')
    if (fs.existsSync(fp)) fs.unlinkSync(fp)
  } catch (err) {
    console.error('[FileDelete]', err)
  }
})

// 清除 IndexedDB 物理文件（解决 Chrome UnknownError 无法打开数据库）
ipcMain.handle('db:reset', function() {
  return new Promise(function(resolve) {
    try {
      var indexedDBPath = path.join(app.getPath('userData'), 'IndexedDB')
      if (fs.existsSync(indexedDBPath)) {
        var backup = indexedDBPath + '.old.' + Date.now()
        try { fs.renameSync(indexedDBPath, backup) } catch(e1) {
          try { fs.rmSync(indexedDBPath, { recursive: true, force: true }) } catch(e2) {
            resolve(false); return
          }
        }
      }
      resolve(true)
    } catch(e) { resolve(false) }
  })
})

// JSON 文件持久化存储（替代 IndexedDB）
var STORE_FILE = path.join(app.getPath('userData'), 'qreader-data.json')
function atomicWrite(filePath, content) {
  var tmp = filePath + '.tmp'
  fs.writeFileSync(tmp, content, 'utf-8')
  fs.renameSync(tmp, filePath)
}

ipcMain.handle('store:load', function() {
  try {
    if (fs.existsSync(STORE_FILE)) return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'))
  } catch(e) { console.warn('[Store] Load error:', e.message) }
  return {}
})

ipcMain.handle('store:save', function(event, payload) {
  try {
    // 渲染进程传过来的是 JSON 字符串（避免 IPC DataCloneError）
    var jsonStr = typeof payload === 'string' ? payload : JSON.stringify(payload)
    atomicWrite(STORE_FILE, jsonStr)
  } catch(e) { console.warn('[Store] Save error:', e.message) }
})

let mainWindow
let httpServer = null

const EDGE_TTS_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const EDGE_TTS_WIN_EPOCH = 11644473600
const EDGE_TTS_CHROMIUM_FULL_VERSION = '143.0.3650.75'
const EDGE_TTS_CHROMIUM_MAJOR_VERSION = '143'
const EDGE_TTS_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/' + EDGE_TTS_CHROMIUM_MAJOR_VERSION + '.0.0.0 Safari/537.36 Edg/' + EDGE_TTS_CHROMIUM_MAJOR_VERSION + '.0.0.0'
const EDGE_TTS_SEC_MS_GEC_VERSION = '1-' + EDGE_TTS_CHROMIUM_FULL_VERSION
const EDGE_TTS_SEC_CH_UA = '" Not;A Brand";v="99", "Microsoft Edge";v="' + EDGE_TTS_CHROMIUM_MAJOR_VERSION + '", "Chromium";v="' + EDGE_TTS_CHROMIUM_MAJOR_VERSION + '"'
const EDGE_TTS_SEC_CH_UA_PLATFORM = '"Windows"'

function secMsGec() {
  var t = Math.floor(Date.now() / 1000) + EDGE_TTS_WIN_EPOCH
  t -= t % 300
  t = Math.floor(t * 10000000)
  return crypto.createHash('sha256').update(t.toFixed(0) + EDGE_TTS_TOKEN).digest('hex').toUpperCase()
}

function synthesizeEdgeTts(text, voiceName, rate) {
  return new Promise(function(resolve, reject) {
    try {
      var gec = secMsGec()
      var cid = crypto.randomUUID().replace(/-/g, '')
      var wsUrl = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?' +
        'TrustedClientToken=' + EDGE_TTS_TOKEN + '&ConnectionId=' + cid +
        '&Sec-MS-GEC=' + gec + '&Sec-MS-GEC-Version=' + EDGE_TTS_SEC_MS_GEC_VERSION

      var ws = new WebSocket(wsUrl, {
        perMessageDeflate: false,
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
          'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
          'User-Agent': EDGE_TTS_USER_AGENT,
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-WebSocket-Version': '13',
          'sec-ch-ua': EDGE_TTS_SEC_CH_UA,
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': EDGE_TTS_SEC_CH_UA_PLATFORM,
        }
      })

      var chunks = [], done = false
      var timeout = setTimeout(function() {
        if (!done) {
          done = true
          try { ws.close() } catch (_) {}
          reject(new Error('response timeout'))
        }
      }, 45000)

      function header(path, body) {
        var now = new Date().toString()
        var ct = path === 'ssml' ? 'application/ssml+xml' : 'application/json; charset=utf-8'
        return 'X-RequestId:' + cid + '\r\nContent-Type:' + ct + '\r\nX-Timestamp:' + now + '\r\nPath:' + path + '\r\n\r\n' + body
      }

      function stripPrefix(b) {
        return (b.length >= 2 && b[0] === 0) ? b.slice(2) : b
      }

      ws.on('open', function() {
        var cfg = JSON.stringify({ context: { synthesis: { audio: { metadataoptions: { sentenceBoundaryEnabled: false, wordBoundaryEnabled: true }, outputFormat: 'audio-24khz-48kbitrate-mono-mp3' } } } })
        ws.send(header('speech.config', cfg))
        var pct = Math.round((rate - 1) * 100)
        var rstr = (pct >= 0 ? '+' + pct : pct) + '%'
        var esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
        var ssml = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN"><voice name="' + voiceName + '"><prosody pitch="+0Hz" rate="' + rstr + '" volume="+0%">' + esc + '</prosody></voice></speak>'
        ws.send(header('ssml', ssml))
      })

      ws.on('message', function(data) {
        var msg = stripPrefix(new Uint8Array(data))

        // Try \r\n\r\n separator for JSON protocol messages
        var sep = -1
        for (var i = 0; i < msg.length - 3; i++) {
          if (msg[i] === 13 && msg[i+1] === 10 && msg[i+2] === 13 && msg[i+3] === 10) { sep = i; break }
        }

        if (sep >= 0) {
          var h = new TextDecoder().decode(msg.slice(0, sep))
          var p = (h.match(/Path:([^\r\n]+)/) || [])[1] || ''
          if (p === 'turn.end') {
            if (done) return
            done = true
            clearTimeout(timeout)
            ws.close()
            if (chunks.length === 0) { reject(new Error('empty')); return }
            var total = 0
            for (var j = 0; j < chunks.length; j++) total += chunks[j].length
            var merge = new Uint8Array(total), off = 0
            for (var k = 0; k < chunks.length; k++) { merge.set(chunks[k], off); off += chunks[k].length }
            resolve(merge.buffer.slice(merge.byteOffset, merge.byteOffset + merge.byteLength))
          }
          return
        }

        // Audio messages: find Path:audio\r\n, everything after is raw MP3
        var marker = [80, 97, 116, 104, 58, 97, 117, 100, 105, 111, 13, 10] // "Path:audio\r\n"
        var found = -1
        for (var i = 0; i <= msg.length - marker.length; i++) {
          var match = true
          for (var j = 0; j < marker.length; j++) {
            if (msg[i+j] !== marker[j]) { match = false; break }
          }
          if (match) { found = i; break }
        }
        if (found >= 0) {
          chunks.push(msg.slice(found + marker.length))
        }
      })

      ws.on('error', function(err) {
        if (!done) { done = true; clearTimeout(timeout); reject(new Error('ws error: ' + (err.message || err))) }
      })

      ws.on('close', function(code, reason) {
        if (done) return
        done = true
        clearTimeout(timeout)
        if (chunks.length > 0) {
          var total = 0
          for (var j = 0; j < chunks.length; j++) total += chunks[j].length
          var merge = new Uint8Array(total), off = 0
          for (var k = 0; k < chunks.length; k++) { merge.set(chunks[k], off); off += chunks[k].length }
          resolve(merge.buffer.slice(merge.byteOffset, merge.byteOffset + merge.byteLength))
        } else {
          var reasonStr2 = reason ? ' ' + reason.toString() : ''
          reject(new Error('closed ' + code + reasonStr2))
        }
      })
    } catch (e) {
      reject(new Error(e.message))
    }
  })
}

// ======== 窗口 ========

function createWindow() {
  var iconPath = path.join(__dirname, '..', 'app-icon.ico')
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, '..', '..', 'app-icon.ico')
  }
  mainWindow = new BrowserWindow({
    width: 1280, height: 820, minWidth: 800, minHeight: 600,
    title: 'QReader',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, webSecurity: false }
  })

  // 智能检测 dist 路径：开发模式（electron/../dist）和打包模式（app/dist）
  var distPath = path.join(__dirname, 'dist')
  if (!fs.existsSync(distPath)) {
    distPath = path.join(__dirname, '..', 'dist')
  }

  function serveFile(req, res) {
    var fp = req.url === '/' ? '/index.html' : req.url.split('?')[0].split('#')[0]
    try { fp = decodeURIComponent(fp) } catch(e) {}
    fp = fp.replace(/\.\./g, '').replace(/\/+/g, '/')
    fs.readFile(path.join(distPath, fp), function(err, data) {
      if (err) { res.writeHead(404); res.end('Not Found'); return }
      var ext = path.extname(fp).toLowerCase()
      var t = { '.html':'text/html;charset=utf-8','.css':'text/css','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.ttf':'font/ttf','.mp3':'audio/mpeg' }
      res.writeHead(200, { 'Content-Type': t[ext]||'application/octet-stream', 'Cache-Control':'no-cache', 'Access-Control-Allow-Origin':'*' })
      res.end(data)
    })
  }

  httpServer = http.createServer(serveFile)

  // 固定端口避免 IndexedDB 因随机端口导致数据丢失
  var STATIC_PORT = 18792
  httpServer.listen(STATIC_PORT, '127.0.0.1', function() {
    startApp(httpServer)
  })
  httpServer.on('error', function(err) {
    if (err.code === 'EADDRINUSE') {
      console.warn('Port ' + STATIC_PORT + ' in use, using random port')
      httpServer = http.createServer(serveFile)
      httpServer.listen(0, '127.0.0.1', function() { startApp(httpServer) })
    } else {
      console.error('Server error:', err)
    }
  })
}

function startApp(server) {
  var port = server.address().port
  console.log('Server http://127.0.0.1:' + port)
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadURL('http://127.0.0.1:' + port)
  }
}

ipcMain.handle('edge-tts:synthesize', function(event, text, voiceName, rate) {
  console.log('[EdgeTTS]', voiceName, 'len:', text.length)
  return synthesizeEdgeTts(text, voiceName, rate)
})

app.whenReady().then(function() {
  session.defaultSession.webRequest.onHeadersReceived(function(details, callback) {
    callback({ responseHeaders: Object.assign({}, details.responseHeaders, { 'Content-Security-Policy': ["default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src *; font-src * data:; img-src * blob: data:; media-src * blob: data:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; worker-src * blob: data:"] }) })
  })
  createWindow()
})

app.on('window-all-closed', function() {
  if (httpServer) { httpServer.close(); httpServer = null }
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function() { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
