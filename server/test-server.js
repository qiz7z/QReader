import express from 'express';

const app = express();
const PORT = 3003;

app.get('/', (req, res) => {
  res.json({ message: 'Hello from test server' });
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});

// 保持进程运行
process.on('SIGINT', () => {
  console.log('Shutting down...');
  process.exit(0);
});