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
import { readPrefs, writePrefs } from './prefs'
import { isOmniConnectInstalled } from './profileManager'
import { checkSteamVr } from './vrOverlay'

const WHATS_NEW: Record<string, string[]> = {
  '1.0.2': [
    'Fixed: Only one instance of OmniTune can run at a time',
    'Fixed: Version number now reflects the actual build',
    'Added: Error toasts for save, reset, delete, import, and export failures',
  ],
  '1.0.1': [
    'Fixed: Switching games now prompts if you have unsaved changes',
    'Fixed: Parameter number inputs are clamped to valid ranges',
    'Fixed: Auto-save no longer saves the wrong game when switching quickly',
    'Fixed: Reset button asks for confirmation before wiping changes',
    'Fixed: Tray and window icons now load correctly in installed builds',
    'Fixed: VR on/off preference is remembered across app restarts',
    'Fixed: PowerShell windows no longer flash when checking Steam or SteamVR',
    'Added: Drag-and-drop .txt import onto the profile editor',
    'Added: First-run setup wizard',
    'Added: NSIS installer with desktop shortcut and uninstaller',
    'Added: Helpful message when OmniConnect is not installed',
    'Added: Overlay correctly loads the running game when started mid-session',
  ],
}

let registered = false

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  if (registered) return
  registered = true

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

  ipcMain.handle('app:getVersion', () => app.getVersion())
  ipcMain.handle('app:getFirstRun', () => readPrefs().firstRun)
  ipcMain.handle('app:completeFirstRun', () => writePrefs({ firstRun: false }))
  ipcMain.handle('app:checkOmniConnect', () => isOmniConnectInstalled())
  ipcMain.handle('app:checkSteamVr', () => new Promise<boolean>(resolve => checkSteamVr(resolve)))

  ipcMain.handle('app:getWhatsNew', () => {
    const prefs = readPrefs()
    const current = app.getVersion()
    if (prefs.lastSeenVersion === current) return null
    const notes = WHATS_NEW[current] ?? null
    return notes ? { version: current, notes } : null
  })

  ipcMain.handle('app:dismissWhatsNew', () => {
    writePrefs({ lastSeenVersion: app.getVersion() })
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
