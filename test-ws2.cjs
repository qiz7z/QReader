const WebSocket = require('ws')
const crypto = require('crypto')

var connectionId = crypto.randomUUID().replace(/-/g, '')
var url = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=' + connectionId

console.log('Testing with ConnectionId:', connectionId)
console.log('URL:', url.substring(0, 120))

var ws = new WebSocket(url, undefined, {
  headers: {
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache',
    'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="130", "Microsoft Edge";v="130"',
    'sec-ch-ua-platform': '"Windows"',
    'sec-ch-ua-mobile': '?0'
  }
})

ws.on('open', function() {
  console.log('SUCCESS! Connected to Edge TTS')
  ws.close()
  process.exit(0)
})
ws.on('error', function(e) {
  console.log('FAILED:', e.message)
  process.exit(1)
})
setTimeout(function() { console.log('TIMEOUT'); ws.close(); process.exit(1); }, 10000)
