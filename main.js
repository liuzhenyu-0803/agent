const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const Store = require('electron-store')

const isDev = process.env.NODE_ENV !== 'production'

// 初始化 electron store
const store = new Store()

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true, // 自动隐藏菜单栏
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    // 设置窗口图标
    icon: path.join(__dirname, 'public/icon.png'),
    // 设置背景色，避免加载时的白闪
    backgroundColor: '#f3f4f6'
  })

  // 在开发环境中加载 Vite 开发服务器
  if (isDev) {
    win.loadURL('http://localhost:5173')
    // 只在用户手动打开时显示开发者工具
    // win.webContents.openDevTools()
  } else {
    win.loadFile('dist/index.html')
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC 通信处理
ipcMain.handle('store:get', (event, key) => {
  return store.get(key)
})

ipcMain.handle('store:set', (event, key, value) => {
  store.set(key, value)
  return true
})

ipcMain.handle('store:delete', (event, key) => {
  store.delete(key)
  return true
})
