import http from 'http';
import { EdgeTTS } from 'edge-tts-universal';

const PORT = 3004;

const server = http.createServer(async (req, res) => {
  // 处理 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 健康检查
  if (req.url === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // TTS 端点
  if (req.url === '/api/tts' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { text, voice = 'zh-CN-XiaoxiaoNeural', rate = '+0%', volume = '+0%', pitch = '+0Hz' } = JSON.parse(body);

        if (!text || typeof text !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '缺少 text 参数' }));
          return;
        }

        const cleanText = text.replace(/<[^>]*>/g, ' ').trim();
        if (!cleanText) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '文本内容为空' }));
          return;
        }

        console.log(`[TTS] 请求: voice=${voice}, rate=${rate}, text="${cleanText.substring(0, 50)}..."`);

        const tts = new EdgeTTS(cleanText, voice, {
          rate,
          volume,
          pitch
        });

        const result = await tts.synthesize();
        const audioBuffer = Buffer.from(await result.audio.arrayBuffer());

        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length,
          'Cache-Control': 'no-cache'
        });

        res.end(audioBuffer);
        console.log(`[TTS] 完成: ${audioBuffer.length} bytes`);
      } catch (error) {
        console.error('[TTS] 错误:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'TTS 合成失败',
          message: error.message 
        }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`[TTS Server] 运行在 http://localhost:${PORT}`);
  console.log(`[TTS Server] TTS 端点: POST http://localhost:${PORT}/api/tts`);
});

// 保持进程运行
process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.close(() => {
    process.exit(0);
  });
});

// 防止进程退出
setInterval(() => {}, 1000 * 60 * 60);

// 未捕获异常处理
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]', reason);
});