const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let backendProcess = null;

const isDev = !app.isPackaged;

// In dev:   __dirname = frontend/electron/
// In prod:  __dirname = win-unpacked/resources/app/ (or app.asar/dist/)
const distDir = path.join(__dirname);

// exePath: win-unpacked/SCL Launcher.exe (in unpacked) or app.asar (in packaged)
function getExeDir() {
  return path.dirname(app.getPath('exe'));
}

// In dev:   frontend/start-backend.bat
// In prod: same dir as main.cjs (win-unpacked/resources/app/start-backend.bat)
function getBackendBatPath() {
  if (isDev) {
    return path.join(__dirname, '..', 'start-backend.bat');
  }
  // Packaged: next to main.cjs (same directory, alongside jar and bat)
  return path.join(distDir, 'start-backend.bat');
}

// In dev:   backend/build/libs/scl-backend-1.0.0.jar
// In prod: same dir as main.cjs
function getBackendJarPath() {
  if (isDev) {
    return path.join(__dirname, '..', '..', 'backend', 'build', 'libs', 'scl-backend-1.0.0.jar');
  }
  return path.join(distDir, 'scl-backend-1.0.0.jar');
}

function startBackend() {
  if (backendProcess) return;
  const batPath = getBackendBatPath();
  const jarPath = getBackendJarPath();
  console.log('[SCL] Starting backend bat:', batPath);
  console.log('[SCL] Backend jar:', jarPath);

  // Write bat dynamically so jar path is always correct
  try {
    const batContent = `@echo off\ncd /d "%~dp0"\necho [SCL] Starting backend...\nstart "" javaw -jar "${jarPath}"\n`;
    const fs = require('fs');
    fs.writeFileSync(batPath, batContent);
  } catch (e) {
    console.error('[SCL] Failed to write bat:', e.message);
  }

  try {
    backendProcess = spawn('cmd.exe', ['/c', 'start', '/min', '', '"' + batPath + '"'], {
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    });
    backendProcess.unref();
  } catch (e) {
    console.error('[SCL] Failed to start backend:', e.message);
  }

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
  createWindow();
  startBackend();
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
  const mcPath = isDev
    ? path.join(process.env.APPDATA || '', '.minecraft')
    : path.join(getExeDir(), '..', '..', 'AppData', 'Roaming', '.minecraft');
  try {
    await shell.openPath(folderPath || mcPath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('open-log', async () => {
  const sclPath = isDev
    ? path.join(process.env.USERPROFILE || '', '.SCL')
    : path.join(getExeDir(), '..', '..', 'AppData', 'Roaming', '.SCL');
  try {
    await shell.openPath(sclPath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Microsoft OAuth Device Code Flow stubs
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
