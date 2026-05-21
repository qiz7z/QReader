var https=require('https');
var ssml='<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN"><voice name="zh-CN-XiaoxiaoNeural"><prosody pitch="+0Hz" rate="+0%" volume="+0%">你好世界</prosody></voice></speak>';
var req=https.request({
  hostname:'speech.platform.bing.com',
  path:'/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4',
  method:'POST',
  headers:{
    'Content-Type':'application/ssml+xml',
    'Content-Length':Buffer.byteLength(ssml),
    'Origin':'https://www.bing.com',
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/130.0.0.0',
  },
  timeout:15000
},function(r){
  console.log('Status:',r.statusCode,'Type:',r.headers['content-type']);
  var chunks=[]; r.on('data',c=>chunks.push(c));
  r.on('end',()=>{
    var t=Buffer.concat(chunks); console.log('Size:',t.length,'First:',t.slice(0,20).toString('hex'));
  });
});
req.on('error',e=>console.log('Error:',e.message));
req.write(ssml); req.end();
