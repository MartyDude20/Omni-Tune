import { app, BrowserWindow, shell, Tray, Menu, nativeImage, dialog } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipcHandlers'
import { startAutoConnect } from './vrOverlay'
import { autoUpdater } from 'electron-updater'

let tray: Tray | null = null

function createTray(win: BrowserWindow): void {
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, 'Logo16.png')
    : join(app.getAppPath(), 'resources', 'Logo16.png')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon)
  tray.setToolTip('OmniTune')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show', click: () => { win.show(); win.focus() } },
    { type: 'separator' },
    { label: 'Quit', click: () => { tray?.destroy(); tray = null; app.exit(0) } },
  ]))
  tray.on('double-click', () => { win.show(); win.focus() })
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 750,
    show: false,
    icon: app.isPackaged
      ? join(process.resourcesPath, 'Logo256.png')
      : join(app.getAppPath(), 'resources', 'Logo256.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#080c18',
      symbolColor: '#e4ebff',
      height: 40,
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  // Minimize to tray on close
  win.on('close', (e) => {
    if (tray) {
      e.preventDefault()
      win.hide()
    }
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  registerIpcHandlers(win)
  createTray(win)
  win.webContents.on('did-finish-load', () => startAutoConnect(win))
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  if (app.isPackaged) {
    autoUpdater.checkForUpdates().catch(() => {})
    autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'A new version of OmniTune has been downloaded.',
        detail: 'Restart now to install the update.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
      }).then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall()
      }).catch(() => {})
    })
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  tray?.destroy()
  tray = null
})
