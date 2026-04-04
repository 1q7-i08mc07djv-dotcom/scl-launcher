const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow = null;
let backendProcess = null;

const isDev = !app.isPackaged;

// In dev:   __dirname = frontend/electron/
// In prod:  __dirname = win-unpacked/resources/app/
const distDir = path.join(__dirname);

// ─── 后端路径：Node.js 服务器 ───────────────────────
// Dev:   ../server/index.js (项目根目录的 server/)
// Prod:  同目录下的 server/index.js
function getServerPath() {
  if (isDev) {
    return path.join(__dirname, '..', '..', 'server', 'index.js');
  }
  return path.join(distDir, 'server', 'index.js');
}

function getNodePath() {
  // 开发环境直接用系统 node
  if (isDev) return 'node';
  // 打包环境：Electron 自带 node，但需要找系统 node 来运行后端
  // 先尝试常见路径
  const candidates = [
    'node',
    'C:/Program Files/nodejs/node.exe',
    path.join(process.env.ProgramFiles || 'C:/Program Files', 'nodejs', 'node.exe')
  ];
  for (const c of candidates) {
    if (c === 'node') return c; // 直接用 PATH 中的
    if (fs.existsSync(c)) return c;
  }
  return 'node'; // fallback
}

function startBackend() {
  if (backendProcess) return;
  const serverPath = getServerPath();
  const nodePath = getNodePath();

  if (!fs.existsSync(serverPath)) {
    console.error('[SCL] 后端文件未找到:', serverPath);
    return;
  }

  console.log('[SCL] 启动后端:', nodePath, serverPath);

  try {
    backendProcess = spawn(nodePath, [serverPath], {
      cwd: path.dirname(serverPath),
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    backendProcess.stdout.on('data', d => process.stdout.write('[Backend] ' + d));
    backendProcess.stderr.on('data', d => process.stderr.write('[Backend] ' + d));

    backendProcess.on('exit', (code) => {
      console.log('[SCL] 后端进程退出, code:', code);
      backendProcess = null;
    });

    backendProcess.unref();
    console.log('[SCL] 后端已启动, pid:', backendProcess.pid);
  } catch (e) {
    console.error('[SCL] 后端启动失败:', e.message);
  }

  // 30秒后重置引用，允许重启
  setTimeout(() => { backendProcess = null; }, 30000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#1A1A1A',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(distDir, 'preload.js'),
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(distDir, 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.close());
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false);
ipcMain.handle('start-backend', () => { startBackend(); return { success: true }; });

ipcMain.handle('open-folder', async (_, folderPath) => {
  const exeDir = path.dirname(app.getPath('exe'));
  const mcPath = isDev
    ? path.join(process.env.APPDATA || '', '.minecraft')
    : path.join(exeDir, '..', '..', 'AppData', 'Roaming', '.minecraft');
  try {
    await shell.openPath(folderPath || mcPath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('open-log', async () => {
  const exeDir = path.dirname(app.getPath('exe'));
  const sclPath = isDev
    ? path.join(process.env.USERPROFILE || '', '.SCL')
    : path.join(exeDir, '..', '..', 'AppData', 'Roaming', '.SCL');
  try {
    await shell.openPath(sclPath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Microsoft OAuth stubs
ipcMain.handle('microsoft-auth-start', async () => {
  return {
    success: false,
    error: '请先在 Azure Portal 注册应用并配置 CLIENT_ID',
    instructions: [
      '1. 访问 https://portal.azure.com → Azure Active Directory → 应用注册',
      '2. 新建注册：名称=SCL-Launcher，重定向URI=https://login.microsoftonline.com/common/oauth2/nativeclient',
      '3. 复制"应用程序(客户端)ID"',
      '4. 在"API 权限"中添加 "Xbox Sign-in API (Microsoft) → user_impersonation"',
      '5. 在"证书和密码"中添加桌面平台原生应用',
      '6. 将 CLIENT_ID 配置到本软件的设置中'
    ]
  };
});

ipcMain.handle('microsoft-auth-callback', async (_, code) => {
  return { success: false, error: '请完成 Azure 应用注册后配置 CLIENT_ID' };
});
