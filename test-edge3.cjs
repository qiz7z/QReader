var crypto = require('crypto')
var https = require('https')

var TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
var WIN_EPOCH = 11644473600

function generateSecMsGec() {
  var ticks = Math.floor(Date.now() / 1000) + WIN_EPOCH
  ticks = ticks - (ticks % 300)
  ticks = Math.floor(ticks * 10000000)
  var str = ticks.toFixed(0) + TRUSTED_TOKEN
  return crypto.createHash('sha256').update(str).digest('hex').toUpperCase()
}

var secMsGec = generateSecMsGec()
var connectionId = crypto.randomBytes(16).toString('hex')
var muid = crypto.randomBytes(16).toString('hex').toUpperCase()
var wsKey = crypto.randomBytes(16).toString('base64')

var params = new URLSearchParams({
  ConnectionId: connectionId,
  TrustedClientToken: TRUSTED_TOKEN,
  'Sec-MS-GEC': secMsGec,
  'Sec-MS-GEC-Version': '1-130.0.6723.69',
})

var options = {
  hostname: 'speech.platform.bing.com',
  port: 443,
  path: '/consumer/speech/synthesize/readaloud/edge/v1?' + params.toString(),
  method: 'GET',
  headers: {
    'Host': 'speech.platform.bing.com',
    'Upgrade': 'websocket',
    'Connection': 'Upgrade',
    'Sec-WebSocket-Key': wsKey,
    'Sec-WebSocket-Version': '13',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
    'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Cookie': 'muid=' + muid,
    'Sec-CH-UA': '"Not_A Brand";v="8", "Chromium";v="130", "Microsoft Edge";v="130"',
    'Sec-CH-UA-Platform': '"Windows"',
    'Sec-CH-UA-Mobile': '?0',
  }
}

var req = https.request(options, function(res) {
  console.log('Status:', res.statusCode)
  if (res.statusCode === 101) console.log('SUCCESS: WebSocket upgrade accepted!')
  var d = ''
  res.on('data', function(c) { d += c.toString() })
  res.on('end', function() { if (d) console.log('Body:', d.substring(0, 500)) })
})

req.on('error', function(e) { console.error('Error:', e.message) })
req.end()
