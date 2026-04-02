const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let backendProcess = null;

const isDev = !app.isPackaged;

// Resolve the correct path whether in dev or packaged
const projectRoot = isDev
  ? path.join(__dirname, '..')
  : path.join(path.dirname(app.getPath('exe')), 'resources');

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
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in dev mode
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start the backend when app is ready
function startBackend() {
  if (backendProcess) return;

  const batPath = path.join(projectRoot, 'start-backend.bat');
  console.log('[SCL] Starting backend:', batPath);

  backendProcess = spawn('cmd.exe', ['/c', 'start', '/min', '', '"' + batPath + '"'], {
    detached: true,
    stdio: 'ignore',
    cwd: projectRoot,
    windowsHide: false,
  });

  backendProcess.unref();

  // Give it time to start
  setTimeout(() => {
    backendProcess = null; // allow re-check
  }, 30000);
}

// App events
app.whenReady().then(() => {
  createWindow();
  startBackend();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers

// Window controls
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

// Start backend
ipcMain.handle('start-backend', () => {
  startBackend();
  return { success: true };
});

// Open folder in explorer
ipcMain.handle('open-folder', async (_, folderPath) => {
  try {
    // folderPath is passed from renderer but we resolve it here
    const minecraftPath = app.isPackaged
      ? path.join(path.dirname(app.getPath('exe')), '..', '..', 'AppData', 'Roaming', '.minecraft')
      : path.join(process.env.APPDATA || '', '.minecraft');

    await shell.openPath(folderPath || minecraftPath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Open log file
ipcMain.handle('open-log', async () => {
  try {
    const sclPath = app.isPackaged
      ? path.join(path.dirname(app.getPath('exe')), '..', '..', 'AppData', 'Roaming', '.SCL')
      : path.join(process.env.USERPROFILE || '', '.SCL');
    await shell.openPath(sclPath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Auto-start backend when renderer requests it
ipcMain.handle('check-backend', async () => {
  // Just acknowledge - the actual check is done from renderer via fetch
  return { success: true };
});
