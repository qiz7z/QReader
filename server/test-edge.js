import { EdgeTTS } from 'edge-tts-universal';

async function test() {
  try {
    console.log('测试 EdgeTTS...');
    const tts = new EdgeTTS('你好，这是一个测试。', 'zh-CN-XiaoxiaoNeural', {
      rate: '+0%',
      volume: '+0%',
      pitch: '+0Hz'
    });
    console.log('TTS 实例创建成功');
    const result = await tts.synthesize();
    console.log('合成完成');
    const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
    console.log(`音频大小: ${audioBuffer.length} bytes`);
    console.log('测试成功');
  } catch (error) {
    console.error('测试失败:', error);
    console.error('错误详情:', error.message);
    if (error.stack) {
      console.error('堆栈:', error.stack);
    }
  }
}

test();