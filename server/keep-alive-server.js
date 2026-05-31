import http from 'http';

const PORT = 3005;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Server is running');
});

server.listen(PORT, () => {
  console.log(`Keep-alive server running on http://localhost:${PORT}`);
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