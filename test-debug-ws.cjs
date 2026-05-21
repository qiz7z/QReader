var crypto = require('crypto')
var WebSocket = require('ws')

var TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
var WIN_EPOCH = 11644473600

function secMsGec() {
  var t = Math.floor(Date.now() / 1000) + WIN_EPOCH
  t -= t % 300
  t = Math.floor(t * 10000000)
  return crypto.createHash('sha256').update(t.toFixed(0) + TOKEN).digest('hex').toUpperCase()
}

var gec = secMsGec()
var cid = crypto.randomUUID().replace(/-/g, '')
var url = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?' +
  'TrustedClientToken=' + TOKEN + '&ConnectionId=' + cid +
  '&Sec-MS-GEC=' + gec + '&Sec-MS-GEC-Version=1-143.0.3650.75'

console.log('URL:', url.substring(0, 120) + '...')
console.log('GEC:', gec)
console.log('CID:', cid)

var ws = new WebSocket(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
    'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
    'Accept-Encoding': 'gzip, deflate, br',
  }
})

ws.on('open', function() {
  console.log('CONNECTED!')
  var now = new Date().toString()
  var cfg = JSON.stringify({ context: { synthesis: { audio: { metadataoptions: { sentenceBoundaryEnabled: false, wordBoundaryEnabled: true }, outputFormat: 'audio-24khz-48kbitrate-mono-mp3' } } } })
  ws.send('X-RequestId:' + cid + '\r\nContent-Type:application/json; charset=utf-8\r\nX-Timestamp:' + now + '\r\nPath:speech.config\r\n\r\n' + cfg)
  ws.send('X-RequestId:' + cid + '\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:' + now + '\r\nPath:ssml\r\n\r\n<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN"><voice name="zh-CN-XiaoxiaoNeural"><prosody pitch="+0Hz" rate="+0%" volume="+0%">你好世界</prosody></voice></speak>')
})

ws.on('message', function(data) {
  var b = new Uint8Array(data)
  var sep = -1
  for (var i = 0; i < b.length - 3; i++) { if (b[i]==13&&b[i+1]==10&&b[i+2]==13&&b[i+3]==10) { sep=i; break } }
  if (sep >= 0) {
    var h = Buffer.from(b.slice(0, sep)).toString()
    var p = (h.match(/Path:([^\r\n]+)/) || [])[1] || ''
    console.log('MSG Path:', p)
  }
})

ws.on('error', function(e) { console.error('ERROR:', e.message) })
ws.on('close', function(c) { console.log('CLOSED:', c) })

setTimeout(function() { console.log('TIMEOUT'); process.exit(1) }, 15000)
