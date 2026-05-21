var crypto = require('crypto')
var WebSocket = require('ws')

var TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
var WIN_EPOCH = 11644473600

function generateSecMsGec() {
  var ticks = Math.floor(Date.now() / 1000) + WIN_EPOCH
  ticks = ticks - (ticks % 300)
  ticks = Math.floor(ticks * 10000000)
  var str = ticks.toFixed(0) + TRUSTED_TOKEN
  return crypto.createHash('sha256').update(str).digest('hex').toUpperCase()
}

var connectionId = crypto.randomBytes(16).toString('hex')
var mucId = crypto.randomBytes(16).toString('hex').toUpperCase()
var secMsGec = generateSecMsGec()

console.log('Sec-MS-GEC:', secMsGec)
console.log('ConnectionId:', connectionId)

var params = new URLSearchParams({
  ConnectionId: connectionId,
  TrustedClientToken: TRUSTED_TOKEN,
  'Sec-MS-GEC': secMsGec,
  'Sec-MS-GEC-Version': '1-130.0.6723.69',
})

var url = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?' + params.toString()
console.log('URL:', url.substring(0, 100) + '...')

var ws = new WebSocket(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
    'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Cookie': 'muid=' + mucId,
  }
})

ws.on('open', function() {
  console.log('SUCCESS: WebSocket connected!')
  var date = new Date().toString()
  ws.send('X-Timestamp:' + date + '\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n' +
    JSON.stringify({ context: { synthesis: { audio: { metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'true' }, outputFormat: 'audio-24khz-48kbitrate-mono-mp3' } } } }))
  ws.send('X-RequestId:' + connectionId + '\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:' + date + '\r\nPath:ssml\r\n\r\n' +
    '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN"><voice name="zh-CN-XiaoxiaoNeural"><prosody pitch="+0Hz" rate="+0%" volume="+0%">你好世界</prosody></voice></speak>')
})

ws.on('message', function(data) {
  var bytes = new Uint8Array(data)
  var sep = -1
  for (var i = 0; i < bytes.length - 3; i++) {
    if (bytes[i] === 13 && bytes[i+1] === 10 && bytes[i+2] === 13 && bytes[i+3] === 10) { sep = i; break }
  }
  if (sep >= 0) {
    var hdr = Buffer.from(bytes.slice(0, sep)).toString('utf-8')
    console.log('Header:', hdr)
    var pathMatch = hdr.match(/Path:([^\r\n]+)/)
    if (pathMatch) console.log('Path:', pathMatch[1].trim())
  }
})

ws.on('error', function(err) {
  console.error('ERROR:', err.message)
  process.exit(1)
})

ws.on('close', function(code) {
  console.log('Closed with code:', code)
  process.exit(code !== 1000 ? 1 : 0)
})

setTimeout(function() { console.log('TIMEOUT'); process.exit(1) }, 15000)
