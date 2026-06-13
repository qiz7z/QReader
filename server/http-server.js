import http from 'http';
import { EdgeTTS } from 'edge-tts-universal';

const PORT = 3004;
const REQUEST_TIMEOUT = 10000; // 10s 超时（国内直连基本不通，10s够判断了）

// 代理配置（国内访问微软 TTS 服务需要）
// 可通过环境变量 TTS_PROXY 设置，格式如: http://127.0.0.1:10809
const PROXY = process.env.TTS_PROXY || '';

function getTTSOptions(voice, rate, volume, pitch) {
  const opts = { rate, volume, pitch };
  if (PROXY) opts.proxy = PROXY;
  return opts;
}

const server = http.createServer(async (req, res) => {
  // CORS
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
    res.end(JSON.stringify({ status: 'ok', proxy: PROXY || 'none', timestamp: new Date().toISOString() }));
    return;
  }

  // TTS 批量合成（一次请求合成多句，减少连接开销）
  if (req.url === '/api/tts/batch' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });

    req.on('end', async () => {
      try {
        const { sentences, voice = 'zh-CN-XiaoxiaoNeural', rate = '+0%', volume = '+0%', pitch = '+0Hz' } = JSON.parse(body);

        if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '缺少 sentences 参数或为空数组' }));
          return;
        }

        // 拼接所有句子
        const combinedText = sentences
          .map(s => typeof s === 'string' ? s.replace(/<[^>]*>/g, ' ').trim() : '')
          .filter(s => s.length > 0)
          .join('\n');

        if (!combinedText) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '所有句子均为空' }));
          return;
        }

        console.log(`[TTS] 批量请求: ${sentences.length}句, voice=${voice}, rate=${rate}, total=${combinedText.length}字`);

        const tts = new EdgeTTS(combinedText, voice, getTTSOptions(voice, rate, volume, pitch));
        const result = await tts.synthesize();
        const audioBuffer = Buffer.from(await result.audio.arrayBuffer());

        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length,
          'Cache-Control': 'no-cache'
        });
        res.end(audioBuffer);
        console.log(`[TTS] 批量完成: ${audioBuffer.length} bytes`);
      } catch (error) {
        console.error('[TTS Batch] 错误:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'TTS 合成失败', message: error.message }));
      }
    });
    return;
  }

  // TTS 单句合成（兼容旧版本）
  if (req.url === '/api/tts' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });

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

        console.log(`[TTS] 请求: voice=${voice}, rate=${rate}, proxy=${PROXY || 'none'}, text="${cleanText.substring(0, 50)}..."`);

        const tts = new EdgeTTS(cleanText, voice, getTTSOptions(voice, rate, volume, pitch));

        // 设置合成超时
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TTS 合成超时')), REQUEST_TIMEOUT)
        );

        const result = await Promise.race([tts.synthesize(), timeout]);
        const audioBuffer = Buffer.from(await result.audio.arrayBuffer());

        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length,
          'Cache-Control': 'no-cache'
        });
        res.end(audioBuffer);
        console.log(`[TTS] 完成: ${audioBuffer.length} bytes`);
      } catch (error) {
        console.error('[TTS] 错误:', error.message);
        const statusCode = error.message === 'TTS 合成超时' ? 504 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'TTS 合成失败', message: error.message }));
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
  console.log(`[TTS Server] 代理: ${PROXY || '未设置（直连）'}`);
  console.log(`[TTS Server] 提示: 如需代理，请设置环境变量 TTS_PROXY，如 TTS_PROXY=http://127.0.0.1:10809`);
  console.log(`[TTS Server] 单句端点: POST http://localhost:${PORT}/api/tts`);
  console.log(`[TTS Server] 批量端点: POST http://localhost:${PORT}/api/tts/batch`);
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('[TTS Server] 正在关闭...');
  server.close(() => process.exit(0));
});

// 未捕获异常
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});
