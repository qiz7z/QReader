var https = require('https')
var crypto = require('crypto')

var key = crypto.randomBytes(16).toString('base64')
var options = {
  hostname: 'speech.platform.bing.com',
  path: '/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=9cb8b75552d942898452284b6d120e2f',
  method: 'GET',
  headers: {
    'Host': 'speech.platform.bing.com',
    'Upgrade': 'websocket',
    'Connection': 'Upgrade',
    'Sec-WebSocket-Key': key,
    'Sec-WebSocket-Version': '13',
    'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache',
    'Accept-Language': 'en-US,en;q=0.9'
  }
}

var req = https.request(options, function(res) {
  console.log('Status:', res.statusCode)
  console.log('Headers:', JSON.stringify(res.headers, null, 2))
  var d = ''
  res.on('data', function(c) { d += c })
  res.on('end', function() { console.log('Body:', d.slice(0, 500)) })
})
req.on('error', function(e) { console.log('Error:', e.message) })
req.end()
