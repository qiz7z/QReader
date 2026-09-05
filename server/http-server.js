import http from 'http';
import { execSync } from 'child_process';
import { EdgeTTS } from 'edge-tts-universal';

const PORT = 3004;
const REQUEST_TIMEOUT = 15000; // 15s 超时
const MAX_BODY_SIZE = 1024 * 1024; // 请求体上限 1MB，防止恶意大包耗尽内存

// 代理配置：环境变量 TTS_PROXY > Windows 系统代理 > 无代理
function detectSystemProxy() {
  try {
    const output = execSync('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable', { encoding: 'utf8' });
    const enabled = /0x1/i.test(output);
    if (!enabled) return '';
    const serverOutput = execSync('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer', { encoding: 'utf8' });
    const match = serverOutput.match(/REG_SZ\s+(.+)/);
    if (match) {
      let proxy = match[1].trim();
      if (proxy && !proxy.startsWith('http')) proxy = 'http://' + proxy;
      console.log(`[TTS] 检测到系统代理: ${proxy}`);
      return proxy;
    }
  } catch (e) {
    // 非 Windows 或注册表不可用
  }
  return '';
}

const PROXY = process.env.TTS_PROXY || detectSystemProxy() || '';

function getTTSOptions(voice, rate, volume, pitch) {
  const opts = { rate, volume, pitch };
  // 仅当用户显式设置 TTS_PROXY 环境变量时才使用代理
  const envProxy = process.env.TTS_PROXY;
  if (envProxy) {
    opts.proxy = envProxy;
    console.log('[TTS] 使用代理:', envProxy);
  } else {
    console.log('[TTS] 直连（未设置 TTS_PROXY 环境变量）');
  }
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
    let oversized = false;
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > MAX_BODY_SIZE) { oversized = true; req.destroy(); }
    });

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
    let oversized = false;
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > MAX_BODY_SIZE) { oversized = true; req.destroy(); }
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

        // 带重试的合成（微软 Edge TTS 服务间歇性返回空音频）
        const MAX_RETRIES = 2;
        let audioBuffer = null;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          const tts = new EdgeTTS(cleanText, voice, getTTSOptions(voice, rate, volume, pitch));
          const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TTS 合成超时')), REQUEST_TIMEOUT)
          );
          try {
            const result = await Promise.race([tts.synthesize(), timeout]);
            audioBuffer = Buffer.from(await result.audio.arrayBuffer());
            if (audioBuffer.length > 0) break;
            console.log(`[TTS] 第${attempt}次: 收到空音频，重试...`);
          } catch (err) {
            console.log(`[TTS] 第${attempt}次失败: ${err.message}${attempt < MAX_RETRIES ? '，重试...' : ''}`);
            if (attempt === MAX_RETRIES) throw err;
            await new Promise(r => setTimeout(r, 1000));
          }
        }

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

// 仅监听本机回环地址，避免局域网内其他设备访问 TTS 服务
server.listen(PORT, '127.0.0.1', () => {
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
