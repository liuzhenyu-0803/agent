const { contextBridge, ipcRenderer } = require('electron')

console.log('Preload script starting...')

// 暴露 store API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key)
  }
})

console.log('Preload script finished')
