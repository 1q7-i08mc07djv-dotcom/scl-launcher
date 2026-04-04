// 工具 API — 打开文件夹、日志、清理缓存、关于信息
const express = require('express');
const router = express.Router();
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const store = require('../store');

// 数据目录
router.get('/data-dir', (req, res) => {
  res.json({ path: store.getDataDir() });
});

// MC 目录
router.get('/minecraft-dir', (req, res) => {
  res.json({ path: store.getMinecraftDir() });
});

// 打开文件夹
router.post('/open-folder', (req, res) => {
  const targetPath = req.body.path || store.getMinecraftDir();
  try {
    if (process.platform === 'win32') {
      exec('explorer "' + targetPath + '"');
    } else if (process.platform === 'darwin') {
      exec('open "' + targetPath + '"');
    } else {
      exec('xdg-open "' + targetPath + '"');
    }
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// 打开日志
router.post('/open-log', (req, res) => {
  try {
    const logFile = path.join(store.getDataDir(), 'LatestLaunch.bat');
    if (process.platform === 'win32') {
      exec('notepad "' + logFile + '"');
    } else {
      exec('xdg-open "' + logFile + '"');
    }
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// 清理缓存
router.post('/clean-cache', (req, res) => {
  try {
    const mcDir = store.getMinecraftDir();
    let cleaned = 0;

    const cleanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isFile()) {
          fs.unlinkSync(full);
          cleaned++;
        }
      }
    };

    cleanDir(path.join(mcDir, 'logs'));
    cleanDir(path.join(mcDir, 'crash-reports'));

    res.json({ success: true, cleaned, message: '已清理 ' + cleaned + ' 个文件' });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// 关闭游戏（与 launch/kill 重复，兼容旧前端）
router.post('/kill-game', (req, res) => {
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM javaw.exe', { stdio: 'ignore' });
    } else {
      execSync("pkill -f 'Minecraft'", { stdio: 'ignore' });
    }
    res.json({ success: true, message: '已尝试关闭游戏进程' });
  } catch (e) {
    res.json({ success: false, error: '未找到运行中的游戏进程' });
  }
});

// 内存优化（Node.js 无需 JVM 优化，兼容旧前端调用）
router.post('/memory-opt', (req, res) => {
  res.json({ success: true, message: 'Node.js 后端无需 JVM 内存优化' });
});

// 关于信息
router.get('/about', (req, res) => {
  res.json({
    name: 'SCL Backend',
    version: '1.0.0',
    description: 'SCL Minecraft Launcher Backend Service (Node.js)'
  });
});

module.exports = router;
