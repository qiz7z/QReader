const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  edgeTtsSynthesize: (text, voiceName, rate) => ipcRenderer.invoke('edge-tts:synthesize', text, voiceName, rate),
  fileSaveFromPath: (bookId, srcPath) => ipcRenderer.invoke('file:save-from-path', bookId, srcPath),
  fileLoad: (bookId) => ipcRenderer.invoke('file:load', bookId),
  fileDelete: (bookId) => ipcRenderer.invoke('file:delete', bookId),
  dbReset: () => ipcRenderer.invoke('db:reset'),
  storeLoad: () => ipcRenderer.invoke('store:load'),
  storeSave: (json) => ipcRenderer.invoke('store:save', json),
  getFilePath: (file) => webUtils ? webUtils.getPathForFile(file) : null,
})
