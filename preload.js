// 引入 Electron 的上下文桥接和进程间渲染器模块
const { contextBridge, ipcRenderer } = require('electron')

// 打印进程信息
console.log('当前进程类型:', process.type)
console.log('是否为渲染进程:', process.type === 'renderer')
console.log('是否为主进程:', process.type === 'browser')

// 控制台日志，帮助调试预加载脚本的执行
console.log('Preload script starting...')

// 使用 contextBridge 安全地将 API 暴露给渲染进程
// 这是连接主进程和渲染进程的关键机制
contextBridge.exposeInMainWorld('electronAPI', {
  // 存储相关的 API，提供对 electron-store 的安全访问
  store: {
    // 获取存储数据的方法
    // 通过 'store:get' 通道调用主进程的存储获取方法
    get: (key) => ipcRenderer.invoke('store:get', key),
    
    // 设置存储数据的方法
    // 通过 'store:set' 通道调用主进程的存储设置方法
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    
    // 删除存储数据的方法
    // 通过 'store:delete' 通道调用主进程的存储删除方法
    delete: (key) => ipcRenderer.invoke('store:delete', key)
  }
  
  // 可以在这里添加更多的 API 方法，例如：
  // dialog: {
  //   showOpenDialog: () => ipcRenderer.invoke('dialog:open')
  // }
})

// 控制台日志，标记预加载脚本执行完成
console.log('Preload script finished')
