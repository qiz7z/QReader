var https = require('https')

var req = https.get({
  hostname: 'speech.platform.bing.com',
  path: '/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json'
  }
}, function(res) {
  console.log('Voices list status:', res.statusCode)
  var d = ''
  res.on('data', function(c) { d += c })
  res.on('end', function() { console.log('Length:', d.length) })
})
req.on('error', function(e) { console.log('Error:', e.message) })
req.end()
