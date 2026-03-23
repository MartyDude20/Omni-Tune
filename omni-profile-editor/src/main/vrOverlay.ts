import { app, BrowserWindow } from 'electron'
import { spawn, exec, ChildProcess } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { loadProfileForAppId } from './profileManager'
import { readPrefs, writePrefs } from './prefs'

const resourcesDir = app.isPackaged
  ? process.resourcesPath
  : path.join(app.getAppPath(), 'resources')
const helperExe = path.join(resourcesDir, 'vr-helper.exe')

const offscreenUrl = app.isPackaged
  ? `file://${path.join(__dirname, '../renderer/index.html')}?vr=1`
  : 'http://localhost:5173/?vr=1'

let helperProcess: ChildProcess | null = null
let offscreenWindow: BrowserWindow | null = null
let retryTimer: NodeJS.Timeout | null = null
let userStopped = false
let savedMainWindow: BrowserWindow | null = null

// ── SteamVR detection ──────────────────────────────────────────────────────
export function checkSteamVr(cb: (running: boolean) => void): void {
  exec('tasklist /FI "IMAGENAME eq vrserver.exe" /FO CSV /NH', { timeout: 2000, windowsHide: true }, (err, stdout) => {
    cb(!err && stdout.toLowerCase().includes('vrserver.exe'))
  })
}

function scheduleRetry(): void {
  if (retryTimer || !savedMainWindow) return
  retryTimer = setInterval(() => {
    if (helperProcess || userStopped || !savedMainWindow) return
    checkSteamVr((running) => {
      if (running && !helperProcess && !userStopped && savedMainWindow) {
        clearInterval(retryTimer!)
        retryTimer = null
        startVr(savedMainWindow)
      }
    })
  }, 5000)
}

// ── Public API ─────────────────────────────────────────────────────────────

export function startAutoConnect(mainWindow: BrowserWindow): void {
  savedMainWindow = mainWindow
  userStopped = false

  if (!fs.existsSync(helperExe)) {
    mainWindow.webContents.send('vr:statusChanged', {
      status: 'error',
      error: 'vr-helper.exe not found — build the C++ helper first.',
    })
    return
  }

  if (!readPrefs().vrEnabled) {
    mainWindow.webContents.send('vr:statusChanged', { status: 'off' })
    return
  }

  checkSteamVr((running) => {
    if (running) {
      startVr(mainWindow)
    } else {
      mainWindow.webContents.send('vr:statusChanged', { status: 'waiting' })
      scheduleRetry()
    }
  })
}

export function reconnectVr(): void {
  if (!savedMainWindow) return
  userStopped = false
  writePrefs({ vrEnabled: true })
  if (retryTimer) { clearInterval(retryTimer); retryTimer = null }
  if (helperProcess) return  // already running
  checkSteamVr((running) => {
    if (!savedMainWindow) return
    if (running) {
      startVr(savedMainWindow)
    } else {
      savedMainWindow.webContents.send('vr:statusChanged', { status: 'waiting' })
      scheduleRetry()
    }
  })
}

export function startVr(mainWindow: BrowserWindow): void {
  if (helperProcess) return

  const offscreen = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    webPreferences: {
      offscreen: true,
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  offscreen.loadURL(offscreenUrl)
  offscreen.webContents.setFrameRate(15)
  offscreenWindow = offscreen

  offscreen.webContents.on('dom-ready', () => {
    offscreen.webContents.focus()
  })

  const helper = spawn(helperExe, [resourcesDir], { stdio: ['pipe', 'pipe', 'inherit'] })
  helperProcess = helper

  let framePending = false
  offscreen.webContents.on('paint', (_, __, image) => {
    if (framePending || !helper.stdin.writable) return
    framePending = true
    const { width, height } = image.getSize()
    const pixels = image.getBitmap()
    const header = Buffer.alloc(13)
    header[0] = 0x01
    header.writeUInt32LE(8 + pixels.length, 1)
    header.writeUInt32LE(width, 5)
    header.writeUInt32LE(height, 9)
    const ok = helper.stdin.write(header) && helper.stdin.write(pixels)
    if (ok) {
      framePending = false
    } else {
      helper.stdin.once('drain', () => { framePending = false })
    }
  })

  let buf = Buffer.alloc(0)
  helper.stdout!.on('data', (chunk: Buffer) => {
    buf = Buffer.concat([buf, chunk])
    while (buf.length >= 5) {
      const payloadLen = buf.readUInt32LE(1)
      if (buf.length < 5 + payloadLen) break
      const type    = buf[0]
      const payload = buf.slice(5, 5 + payloadLen)
      buf = buf.slice(5 + payloadLen)
      handleHelperMessage(type, payload, mainWindow, offscreen)
    }
  })

  helper.on('exit', (code) => {
    helperProcess = null
    offscreenWindow = null
    offscreen.destroy()

    if (userStopped) {
      // Manual stop — stay off, don't auto-reconnect
      mainWindow.webContents.send('vr:statusChanged', { status: 'off' })
      userStopped = false
    } else {
      // SteamVR closed or crashed — go to waiting and resume polling
      mainWindow.webContents.send('vr:statusChanged', {
        status: 'waiting',
        error: code !== 0 ? `vr-helper exited with code ${code}` : undefined,
      })
      scheduleRetry()
    }
  })
}

export function stopVr(): void {
  userStopped = true
  writePrefs({ vrEnabled: false })
  if (retryTimer) { clearInterval(retryTimer); retryTimer = null }
  if (!helperProcess) {
    savedMainWindow?.webContents.send('vr:statusChanged', { status: 'off' })
    return
  }
  const stop = Buffer.alloc(5)
  stop[0] = 0x02
  stop.writeUInt32LE(0, 1)
  if (helperProcess.stdin?.writable) {
    helperProcess.stdin.write(stop)
  }
}

export function setOverlayWidth(meters: number): void {
  if (!helperProcess?.stdin?.writable) return
  const payload = Buffer.alloc(4)
  payload.writeFloatLE(meters, 0)
  const header = Buffer.alloc(5)
  header[0] = 0x06
  header.writeUInt32LE(4, 1)
  helperProcess.stdin.write(header)
  helperProcess.stdin.write(payload)
}

// ── Message handler ────────────────────────────────────────────────────────
function handleHelperMessage(
  type: number,
  payload: Buffer,
  mainWindow: BrowserWindow,
  offscreen: BrowserWindow,
): void {
  if (type === 0x03) {
    const { status, error } = JSON.parse(payload.toString('utf-8'))
    mainWindow.webContents.send('vr:statusChanged', { status, error })
  }

  if (type === 0x04) {
    const { type: evType, x, y } = JSON.parse(payload.toString('utf-8')) as { type: string; x: number; y: number }
    const px = Math.round(x)
    const py = Math.round(y)
    const isClick = evType === 'mouseDown' || evType === 'mouseUp'
    offscreen.webContents.sendInputEvent({
      type: evType as Electron.MouseInputEvent['type'],
      x: px,
      y: py,
      modifiers: [],
      ...(isClick ? { button: 'left' as const, clickCount: 1 } : {}),
    } as Electron.MouseInputEvent)
  }

  if (type === 0x05) {
    const { appId } = JSON.parse(payload.toString('utf-8')) as { appId: string | null }
    if (appId) {
      const entry = loadProfileForAppId(appId)
      mainWindow.webContents.send('vr:appChanged', { appId, gameName: entry.gameName })
      offscreen.webContents.send('vr:appChanged', { appId, gameName: entry.gameName })
    } else {
      mainWindow.webContents.send('vr:appChanged', { appId: null, gameName: null })
      offscreen.webContents.send('vr:appChanged', { appId: null, gameName: null })
    }
  }
}
