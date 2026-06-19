import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { spawn, type ChildProcess } from 'child_process'

const projectRoot = process.cwd()

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    {
      name: 'tts-proxy',
      configureServer() {
        let tts: ChildProcess | null = null
        try {
          const net = require('net')
          const tester = net.createConnection({ port: 3004 }, () => { tester.destroy() })
          tester.on('error', () => {
            try {
              tts = spawn('node', ['server/http-server.js'], {
                cwd: projectRoot,
                stdio: 'inherit',
                shell: true,
              })
              console.log('[Vite] TTS 代理服务器已自动启动 (localhost:3004)')
            } catch (e) {
              console.warn('[Vite] TTS 代理启动失败:', e)
            }
          })
        } catch {}
        return () => tts?.kill()
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
