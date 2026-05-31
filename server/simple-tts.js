import http from 'http';
import { EdgeTTS } from 'edge-tts-universal';

const PORT = 3006;

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/api/tts' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { text, voice = 'zh-CN-XiaoxiaoNeural', rate = '+0%' } = JSON.parse(body);
        
        if (!text) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing text' }));
          return;
        }

        console.log(`[TTS] Request: ${text.substring(0, 50)}...`);
        
        const tts = new EdgeTTS(text, voice, { rate });
        const result = await tts.synthesize();
        const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
        
        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length
        });
        res.end(audioBuffer);
        
        console.log(`[TTS] Success: ${audioBuffer.length} bytes`);
      } catch (error) {
        console.error('[TTS] Error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Simple TTS server running on http://localhost:${PORT}`);
});

// Keep process alive
setInterval(() => {}, 1000 * 60 * 60);