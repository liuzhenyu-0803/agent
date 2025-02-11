// 引入 Electron 核心模块和依赖
// app: 控制应用程序生命周期
// BrowserWindow: 创建和管理应用程序窗口
// ipcMain: 主进程间通信
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const Store = require('electron-store')

// 检查当前是否为开发环境
const isDev = process.env.NODE_ENV !== 'production'

// 初始化 electron-store，用于持久化存储应用程序数据
const store = new Store({
  // 可以自定义存储配置
  name: 'ai-chat-agent-config',  // 自定义存储文件名
  fileExtension: 'json',         // 文件扩展名
  // 可以指定自定义存储路径
  // cwd: app.getPath('userData')  // 使用 Electron 的用户数据目录
})

// 日志记录存储路径和初始配置
console.log('数据存储路径:', store.path)
console.log('初始存储内容:', store.store)  // 打印初始存储的全部内容

/**
 * 创建应用程序主窗口
 * 配置窗口大小、样式和加载方式
 */
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,                  // 默认窗口宽度
    height: 800,                  // 默认窗口高度
    minWidth: 800,                // 最小宽度限制
    minHeight: 600,               // 最小高度限制
    autoHideMenuBar: true,        // 自动隐藏菜单栏，提供更干净的界面
    webPreferences: {
      nodeIntegration: true,      // 允许在渲染进程中使用 Node.js API
      contextIsolation: true,     // 启用上下文隔离，提高安全性
      preload: path.join(__dirname, 'preload.js')  // 预加载脚本路径
    },
    icon: path.join(__dirname, 'public/icon.png'),  // 设置应用程序图标
    backgroundColor: '#f3f4f6'    // 设置背景色，避免加载时的白色闪烁
  })

  // 根据运行环境加载不同的内容
  if (isDev) {
    // 开发环境：加载本地 Vite 开发服务器
    win.loadURL('http://localhost:5173')
    // 开发者工具（注释掉，仅在需要时手动打开）
    // win.webContents.openDevTools()
  } else {
    // 生产环境：加载打包后的静态文件
    win.loadFile('dist/index.html')
  }
}

// Electron 应用程序生命周期管理
// 当 Electron 初始化完成后创建主窗口
app.whenReady().then(() => {
  createWindow()

  // macOS 特殊处理：点击 Dock 图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 当所有窗口关闭时的处理
app.on('window-all-closed', () => {
  // 非 macOS 平台直接退出应用
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 进程间通信（IPC）处理
// 提供与 electron-store 交互的方法

// 获取存储数据
ipcMain.handle('store:get', (event, key) => {
  return store.get(key)
})

// 设置存储数据
ipcMain.handle('store:set', (event, key, value) => {
  store.set(key, value)
  return true
})

// 删除存储数据
ipcMain.handle('store:delete', (event, key) => {
  store.delete(key)
  return true
})
