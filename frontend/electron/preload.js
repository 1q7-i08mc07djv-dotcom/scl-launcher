const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Backend control
  startBackend: () => ipcRenderer.invoke('start-backend'),

  // Shell
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  openLog: () => ipcRenderer.invoke('open-log'),

  // Microsoft Auth (Device Code Flow)
  microsoftAuthStart: () => ipcRenderer.invoke('microsoft-auth-start'),
  microsoftAuthCallback: (code) => ipcRenderer.invoke('microsoft-auth-callback', code),

  // App info
  getAppPath: () => __dirname,
});
