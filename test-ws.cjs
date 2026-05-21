const WebSocket = require('ws')
const crypto = require('crypto')
const fs = require('fs')

const TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const WIN_EPOCH = 11644473600
const SEC_MS_GEC_VERSION = '1-143.0.3650.75'
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0'

function secMsGec() {
  var t = Math.floor(Date.now() / 1000) + WIN_EPOCH
  t -= t % 300; t = Math.floor(t * 10000000)
  return crypto.createHash('sha256').update(t.toFixed(0) + TOKEN).digest('hex').toUpperCase()
}

var gec = secMsGec()
var cid = crypto.randomUUID().replace(/-/g, '')
var wsUrl = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?' +
  'TrustedClientToken=' + TOKEN + '&ConnectionId=' + cid +
  '&Sec-MS-GEC=' + gec + '&Sec-MS-GEC-Version=' + SEC_MS_GEC_VERSION

var ws = new WebSocket(wsUrl, {
  perMessageDeflate: false,
  headers: {
    'Pragma': 'no-cache', 'Cache-Control': 'no-cache',
    'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
    'User-Agent': USER_AGENT,
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.9',
    'sec-ch-ua': '" Not;A Brand";v="99", "Microsoft Edge";v="143", "Chromium";v="143"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
  }
})

function header(path, body) {
  var now = new Date().toString()
  var ct = path === 'ssml' ? 'application/ssml+xml' : 'application/json; charset=utf-8'
  return 'X-RequestId:' + cid + '\r\nContent-Type:' + ct + '\r\nX-Timestamp:' + now + '\r\nPath:' + path + '\r\n\r\n' + body
}

function stripPrefix(b) {
  return (b.length >= 2 && b[0] === 0) ? b.slice(2) : b
}

var chunks = []

ws.on('open', function() {
  console.log('OPEN')
  var cfg = JSON.stringify({ context: { synthesis: { audio: { metadataoptions: { sentenceBoundaryEnabled: false, wordBoundaryEnabled: true }, outputFormat: 'audio-24khz-48kbitrate-mono-mp3' } } } })
  ws.send(header('speech.config', cfg))
  var esc = '你好世界，这是一个测试'.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  var ssml = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN"><voice name="zh-CN-XiaoxiaoNeural"><prosody pitch="+0Hz" rate="+0%" volume="+0%">' + esc + '</prosody></voice></speak>'
  ws.send(header('ssml', ssml))
})

ws.on('message', function(data) {
  var b = new Uint8Array(data)
  var msg = stripPrefix(b)

  // Try \r\n\r\n separator for JSON messages
  var sep2 = -1
  for (var i = 0; i < msg.length - 3; i++) {
    if (msg[i] === 13 && msg[i+1] === 10 && msg[i+2] === 13 && msg[i+3] === 10) { sep2 = i; break }
  }

  if (sep2 >= 0) {
    var h = new TextDecoder().decode(msg.slice(0, sep2))
    var p = (h.match(/Path:([^\r\n]+)/) || [])[1] || ''
    var payload = msg.slice(sep2 + 4)
    console.log('MSG path=' + p + ' body=' + payload.length)
    return
  }

  // Audio messages: find Path:audio\r\n and everything after is raw MP3
  var pathAudio = 'Path:audio\r\n'
  var paBytes = new TextEncoder().encode(pathAudio)
  var found = -1
  for (var i = 0; i < msg.length - paBytes.length; i++) {
    var match = true
    for (var j = 0; j < paBytes.length; j++) {
      if (msg[i+j] !== paBytes[j]) { match = false; break }
    }
    if (match) { found = i; break }
  }

  if (found >= 0) {
    var audioData = msg.slice(found + paBytes.length)
    chunks.push(audioData)
    console.log('AUDIO chunk=' + chunks.length + ' audio=' + audioData.length)
    return
  }

  console.log('UNKNOWN len=' + msg.length + ' start=' + new TextDecoder().decode(msg.slice(0, 40)))
})

ws.on('error', function(err) { console.log('ERROR', err.message) })
ws.on('close', function(code, reason) {
  console.log('CLOSE', code, reason ? reason.toString() : '')
  if (chunks.length > 0) {
    var total = 0; chunks.forEach(function(c){ total += c.length })
    var merge = new Uint8Array(total); var off = 0
    chunks.forEach(function(c){ merge.set(c, off); off += c.length })
    fs.writeFileSync('test-output.mp3', Buffer.from(merge))
    console.log('Saved test-output.mp3 (' + total + ' bytes, ' + chunks.length + ' chunks)')
  }
  process.exit(0)
})
setTimeout(function() { console.log('TIMEOUT chunks=' + chunks.length); process.exit(1) }, 15000)
