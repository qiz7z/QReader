var https = require('https')

// Test voices list with uppercase Token
var req1 = https.get({
  hostname: 'speech.platform.bing.com',
  path: '/consumer/speech/synthesize/readaloud/voices/list?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4',
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, function(res) { console.log('voices/TrustedClientToken:', res.statusCode) })
req1.on('error', function(e) { console.log('err1:', e.message) })
req1.end()

// Test edge/v1 with lowercase token (just HTTP, no WS upgrade)
var req2 = https.get({
  hostname: 'speech.platform.bing.com',
  path: '/consumer/speech/synthesize/readaloud/edge/v1?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=abc123',
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, function(res) { console.log('edge/trustedclienttoken:', res.statusCode) })
req2.on('error', function(e) { console.log('err2:', e.message) })
req2.end()

// Test edge/v1 with uppercase Token (HTTP GET, no WS upgrade)
var req3 = https.get({
  hostname: 'speech.platform.bing.com',
  path: '/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=abc123',
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, function(res) { console.log('edge/TrustedClientToken:', res.statusCode) })
req3.on('error', function(e) { console.log('err3:', e.message) })
req3.end()
