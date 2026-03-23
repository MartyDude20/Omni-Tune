import { contextBridge, ipcRenderer } from 'electron'

type Unsubscribe = () => void

function listen(channel: string, cb: (...args: unknown[]) => void): Unsubscribe {
  const handler = (_: unknown, ...args: unknown[]) => cb(...args)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

contextBridge.exposeInMainWorld('api', {
  // profiles
  scanProfiles:      ()                                => ipcRenderer.invoke('profiles:scan'),
  loadProfile:       (appId: string)                   => ipcRenderer.invoke('profiles:load', appId),
  saveProfile:       (appId: string, profile: unknown) => ipcRenderer.invoke('profiles:save', { appId, profile }),
  resetProfile:      (appId: string)                   => ipcRenderer.invoke('profiles:reset', { appId }),
  deleteProfile:     (appId: string)                   => ipcRenderer.invoke('profiles:delete', { appId }),
  importProfile:     (filePath: string)                => ipcRenderer.invoke('profiles:import', { filePath }),
  exportOne:         (appId: string, destPath: string) => ipcRenderer.invoke('profiles:exportOne', { appId, destPath }),
  exportAll:         (destZipPath: string)             => ipcRenderer.invoke('profiles:exportAll', { destZipPath }),
  onProfilesChanged: (cb: (appId: string) => void)    => listen('profiles:changed', cb as (...a: unknown[]) => void),

  // dialogs
  openFileDialog: (options: unknown) => ipcRenderer.invoke('dialog:openFile', options),
  saveFileDialog: (options: unknown) => ipcRenderer.invoke('dialog:saveFile', options),

  // live param sync
  sendLiveUpdate: (appId: string, profile: unknown) => ipcRenderer.send('profiles:liveUpdate', { appId, profile }),
  onLiveUpdate:   (cb: (payload: unknown) => void)  => listen('profiles:liveUpdate', cb as (...a: unknown[]) => void),

  // vr
  vrReconnect:    ()                               => ipcRenderer.invoke('vr:reconnect'),
  vrStop:         ()                               => ipcRenderer.invoke('vr:stop'),
  vrSetWidth:     (meters: number)                 => ipcRenderer.invoke('vr:setWidth', { meters }),
  onVrStatus:     (cb: (payload: unknown) => void) => listen('vr:statusChanged', cb as (...a: unknown[]) => void),
  onVrAppChanged: (cb: (payload: unknown) => void) => listen('vr:appChanged',    cb as (...a: unknown[]) => void),

  // app
  getAutoStart:      ()                => ipcRenderer.invoke('app:getAutoStart'),
  setAutoStart:      (enabled: boolean) => ipcRenderer.invoke('app:setAutoStart', { enabled }),
  openExternal:      (url: string)     => ipcRenderer.invoke('app:openExternal', { url }),
  getVersion:        ()                => ipcRenderer.invoke('app:getVersion'),
  getFirstRun:       ()                => ipcRenderer.invoke('app:getFirstRun'),
  completeFirstRun:  ()                => ipcRenderer.invoke('app:completeFirstRun'),
  checkOmniConnect:  ()                => ipcRenderer.invoke('app:checkOmniConnect'),
  checkSteamVr:      ()                => ipcRenderer.invoke('app:checkSteamVr'),
  getWhatsNew:       ()  => ipcRenderer.invoke('app:getWhatsNew'),
  dismissWhatsNew:   ()  => ipcRenderer.invoke('app:dismissWhatsNew'),
})
