import express from 'express';
import cors from 'cors';
import { EdgeTTS } from 'edge-tts-universal';

const app = express();
const PORT = process.env.PORT || 3002;

// 中间件
app.use(cors());
app.use(express.json());

// TTS 端点
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'zh-CN-XiaoxiaoNeural', rate = '+0%', volume = '+0%', pitch = '+0Hz' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: '缺少 text 参数' });
    }

    // 清理文本，移除 HTML 标签
    const cleanText = text.replace(/<[^>]*>/g, ' ').trim();
    if (!cleanText) {
      return res.status(400).json({ error: '文本内容为空' });
    }

    console.log(`[TTS] 请求: voice=${voice}, rate=${rate}, text="${cleanText.substring(0, 50)}..."`);

    // 创建 TTS 实例
    const tts = new EdgeTTS(cleanText, voice, {
      rate,
      volume,
      pitch
    });

    // 合成音频
    const result = await tts.synthesize();

    // 转换为 Buffer
    const audioBuffer = Buffer.from(await result.audio.arrayBuffer());

    // 设置响应头
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache'
    });

    // 发送音频数据
    res.send(audioBuffer);

    console.log(`[TTS] 完成: ${audioBuffer.length} bytes`);
  } catch (error) {
    console.error('[TTS] 错误:', error);
    res.status(500).json({ 
      error: 'TTS 合成失败',
      message: error.message 
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`[TTS Server] 运行在 http://localhost:${PORT}`);
  console.log(`[TTS Server] TTS 端点: POST http://localhost:${PORT}/api/tts`);
});