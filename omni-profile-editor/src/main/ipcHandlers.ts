import { ipcMain, dialog, BrowserWindow, shell, app } from 'electron'
import {
  scanProfiles,
  loadProfileForAppId,
  saveCustomProfile,
  resetProfile,
  deleteCustomProfile,
  importProfile,
  exportProfile,
  exportAllCustom,
  watchProfiles,
  Profile,
} from './profileManager'
import { stopVr, reconnectVr, setOverlayWidth } from './vrOverlay'

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle('profiles:scan', () => scanProfiles())

  ipcMain.handle('profiles:load', (_, appId: string) => loadProfileForAppId(appId))

  ipcMain.handle('profiles:save', (_, { appId, profile }: { appId: string; profile: Profile }) => {
    saveCustomProfile(appId, profile)
  })

  ipcMain.handle('profiles:reset', (_, { appId }: { appId: string }) => {
    resetProfile(appId)
  })

  ipcMain.handle('profiles:import', (_, { filePath }: { filePath: string }) => {
    return importProfile(filePath)
  })

  ipcMain.handle('profiles:exportOne', (_, { appId, destPath }: { appId: string; destPath: string }) => {
    exportProfile(appId, destPath)
  })

  ipcMain.handle('profiles:exportAll', (_, { destZipPath }: { destZipPath: string }) => {
    return exportAllCustom(destZipPath)
  })

  ipcMain.handle('dialog:openFile', (_, options: Electron.OpenDialogOptions) => {
    return dialog.showOpenDialog(mainWindow, { ...options, properties: ['openFile'] })
      .then(r => r.canceled ? null : r.filePaths[0])
  })

  ipcMain.handle('dialog:saveFile', (_, options: Electron.SaveDialogOptions) => {
    return dialog.showSaveDialog(mainWindow, options)
      .then(r => r.canceled ? null : r.filePath)
  })

  ipcMain.handle('profiles:delete', (_, { appId }: { appId: string }) => {
    deleteCustomProfile(appId)
  })

  ipcMain.handle('vr:reconnect', () => reconnectVr())
  ipcMain.handle('vr:stop',     () => stopVr())
  ipcMain.handle('vr:setWidth', (_, { meters }: { meters: number }) => setOverlayWidth(meters))

  ipcMain.handle('app:getAutoStart', () => app.getLoginItemSettings().openAtLogin)
  ipcMain.handle('app:setAutoStart', (_, { enabled }: { enabled: boolean }) => {
    app.setLoginItemSettings({ openAtLogin: enabled })
  })
  ipcMain.handle('app:openExternal', (_, { url }: { url: string }) => {
    shell.openExternal(url)
  })

  // Live param sync — relay to every window except the sender (zero-latency, no disk round-trip)
  ipcMain.on('profiles:liveUpdate', (event, data) => {
    BrowserWindow.getAllWindows().forEach(win => {
      if (win.webContents.id !== event.sender.id) {
        win.webContents.send('profiles:liveUpdate', data)
      }
    })
  })

  // Start chokidar watcher and push change events to all windows (desktop + VR offscreen)
  watchProfiles((appId) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('profiles:changed', { appId })
    })
  })
}
