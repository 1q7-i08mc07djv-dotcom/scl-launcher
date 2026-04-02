const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let backendProcess = null;

const isDev = !app.isPackaged;

// In dev:   __dirname = frontend/electron/
// In prod:  __dirname = app.asar/dist/ (or win-unpacked/dist/)
const distDir = path.join(__dirname);

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
    // In packaged app, index.html is in the same dir as main.cjs
    mainWindow.loadFile(path.join(distDir, 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Find start-backend.bat
// Dev: frontend/start-backend.bat
// Packaged: next to the exe (win-unpacked/start-backend.bat)
function getBackendBatPath() {
  if (isDev) {
    return path.join(__dirname, '..', 'start-backend.bat');
  }
  // Packaged: beside the exe
  return path.join(path.dirname(app.getPath('exe')), 'start-backend.bat');
}

function startBackend() {
  if (backendProcess) return;
  const batPath = getBackendBatPath();
  console.log('[SCL] Starting backend from:', batPath);

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
    : path.join(path.dirname(app.getPath('exe')), '..', '..', 'AppData', 'Roaming', '.minecraft');
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
    : path.join(path.dirname(app.getPath('exe')), '..', '..', 'AppData', 'Roaming', '.SCL');
  try {
    await shell.openPath(sclPath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});
