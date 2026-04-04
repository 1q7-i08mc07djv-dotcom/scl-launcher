// 游戏启动 API — 启动/关闭/状态
const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const store = require('../store');

let currentGameProcess = null;

// ─── 查找 Java ─────────────────────────────────────
function findJava() {
  const candidates = [];

  if (process.platform === 'win32') {
    candidates.push(
      'C:/Program Files/Java/jdk-21/bin/java.exe',
      'C:/Program Files/Java/jdk-17/bin/java.exe',
      'C:/Program Files (x86)/Java/jre/bin/java.exe'
    );
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home/bin/java',
      '/usr/local/opt/openjdk@21/bin/java'
    );
  } else {
    candidates.push(
      '/usr/lib/jvm/java-21/bin/java',
      '/usr/lib/jvm/java-17/bin/java',
      '/usr/bin/java'
    );
  }

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  // 尝试从 PATH 中找
  try {
    const { execSync } = require('child_process');
    const cmd = process.platform === 'win32' ? 'where java' : 'which java';
    const result = execSync(cmd, { encoding: 'utf-8' }).trim().split('\n')[0];
    if (result && fs.existsSync(result)) return result;
  } catch (ignored) {}

  return null;
}

// ─── 构建 ClassPath ────────────────────────────────
function buildClassPath(versionDir, minecraftDir) {
  const cp = [];

  // 版本 jar
  const versionId = path.basename(versionDir);
  const versionJar = path.join(versionDir, versionId + '.jar');
  if (fs.existsSync(versionJar)) cp.push(versionJar);

  // 扫描 libraries
  const libsDir = path.join(minecraftDir, 'libraries');
  if (fs.existsSync(libsDir)) {
    scanDir(libsDir, cp);
  }

  return cp.join(process.platform === 'win32' ? ';' : ':');
}

function scanDir(dir, list) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(full, list);
      } else if (entry.name.endsWith('.jar')) {
        list.push(full);
      }
    }
  } catch (ignored) {}
}

// ─── 启动游戏 ─────────────────────────────────────
router.post('/', (req, res) => {
  const { account, version } = req.body;
  if (!account || !version) {
    return res.json({ success: false, error: '账户和版本不能为空' });
  }

  const config = store.loadConfig();
  const minecraftDir = store.getMinecraftDir();

  // 检查版本是否已下载
  const downloaded = store.loadDownloadedVersions();
  if (!downloaded.find(v => v.id === version.id)) {
    return res.json({ success: false, error: '版本未下载: ' + version.name });
  }

  // 查找 Java
  let javaPath = config.javaPath;
  if (!javaPath || config.autoJava) {
    javaPath = findJava();
    if (!javaPath) {
      return res.json({ success: false, error: '未找到 Java，请安装 JDK 21 或在设置中配置 Java 路径' });
    }
  }

  // 版本目录
  const versionDir = path.join(minecraftDir, 'versions', version.id);
  if (!fs.existsSync(versionDir)) {
    return res.json({ success: false, error: '游戏版本目录不存在: ' + versionDir });
  }

  // 构建命令
  const cmd = [javaPath];

  // 内存
  let memory = config.memory;
  if (!memory.endsWith('M') && !memory.endsWith('G')) memory += 'G';
  cmd.push('-Xmx' + memory);

  // JVM 参数
  if (config.jvmArgs) {
    cmd.push(...config.jvmArgs.split(/\s+/).filter(Boolean));
  }

  // 游戏参数
  cmd.push(
    '-Djava.library.path=' + path.join(versionDir, 'natives'),
    '-cp', buildClassPath(versionDir, minecraftDir),
    'net.minecraft.client.main.Main',
    '--username', account.username,
    '--version', version.version || version.minecraftVersion,
    '--gameDir', minecraftDir,
    '--assetsDir', path.join(minecraftDir, 'assets'),
    '--assetIndex', version.minecraftVersion
  );

  // 认证参数
  if (account.type === 'offline') {
    cmd.push(
      '--uuid', account.uuid || store.generateOfflineUUID(account.username),
      '--accessToken', '0',
      '--clientId', 'SCL-Offline',
      '--xuid', '0'
    );
  } else if (account.token) {
    cmd.push(
      '--uuid', account.uuid || '00000000-0000-0000-0000-000000000000',
      '--accessToken', account.token
    );
  }

  cmd.push('--width', '854', '--height', '480');

  try {
    // 写入启动脚本供调试
    const dataDir = store.getDataDir();
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'LatestLaunch.bat'), cmd.join(' '), 'utf-8');

    // 启动进程
    currentGameProcess = spawn(cmd[0], cmd.slice(1), {
      cwd: minecraftDir,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    currentGameProcess.unref();

    // 后台读取 stderr
    currentGameProcess.stderr.on('data', d => {
      process.stderr.write('[Minecraft] ' + d);
    });

    currentGameProcess.on('exit', () => {
      currentGameProcess = null;
    });

    res.json({
      success: true,
      pid: currentGameProcess.pid,
      message: '游戏已启动: ' + version.name
    });
  } catch (e) {
    res.json({ success: false, error: '启动失败: ' + e.message });
  }
});

// ─── 关闭游戏 ──────────────────────────────────────
router.post('/kill', (req, res) => {
  if (currentGameProcess && !currentGameProcess.killed) {
    currentGameProcess.kill('SIGTERM');
    res.json({ success: true, message: '游戏已关闭' });
  } else {
    // 尝试按进程名杀
    try {
      const { execSync } = require('child_process');
      if (process.platform === 'win32') {
        execSync('taskkill /F /IM javaw.exe', { stdio: 'ignore' });
      } else {
        execSync("pkill -f 'Minecraft'", { stdio: 'ignore' });
      }
      res.json({ success: true, message: '已尝试关闭游戏进程' });
    } catch (e) {
      res.json({ success: false, error: '未找到运行中的游戏进程' });
    }
  }
});

// ─── 游戏状态 ──────────────────────────────────────
router.get('/status', (req, res) => {
  res.json({ running: !!(currentGameProcess && !currentGameProcess.killed) });
});

module.exports = router;
