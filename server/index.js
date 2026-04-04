// SCL Minecraft 启动器 — Node.js 后端主入口
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8765;

// 中间件
app.use(cors());
app.use(express.json());

// 挂载路由
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/config', require('./routes/config'));
app.use('/api/versions', require('./routes/versions'));
app.use('/api/launch', require('./routes/launch'));
app.use('/api/tools', require('./routes/tools'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SCL Backend (Node.js)', port: PORT });
});

// 启动服务器
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[SCL] 后端服务已启动: http://127.0.0.1:${PORT}`);
});
