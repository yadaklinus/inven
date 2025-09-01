const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Dialog methods
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Menu events
  onMenuNewSale: (callback) => ipcRenderer.on('menu-new-sale', callback),
  onMenuNewPurchase: (callback) => ipcRenderer.on('menu-new-purchase', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Platform info
  platform: process.platform,
  isElectron: true
});

// Expose environment variables that are safe to share
contextBridge.exposeInMainWorld('env', {
  NODE_ENV: process.env.NODE_ENV,
  ELECTRON_IS_DEV: process.env.ELECTRON_IS_DEV === 'true'
});