const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('winCtl', {
  minimize: () => ipcRenderer.send('win:minimize'),
  maximize: () => ipcRenderer.send('win:maximize'),
  close: () => ipcRenderer.send('win:close'),
});
