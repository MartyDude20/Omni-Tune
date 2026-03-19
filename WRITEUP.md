# OmniTune — Full Project Write-Up

## What It Is

**OmniTune** is a desktop application for editing Virtuix Omni One VR treadmill game profiles. The Omni One driver reads plain-text profile files from disk to control how the treadmill translates physical walking motion into in-game movement. Before this app, tuning those profiles meant manually editing text files while not wearing the headset, guessing at values, restarting, and repeating. OmniTune eliminates that loop.

---

## The Problem It Solves

The Virtuix driver stores game profiles at:
- `C:\ProgramData\Virtuix\OmniConnect\GameProfile\official\` — read-only, managed by Virtuix
- `C:\ProgramData\Virtuix\OmniConnect\GameProfile\custom\` — user overrides, driver reads these first

Each profile is a single-line text file like:
```
-game HalfLife2 -multiplier 1.2 -minspeed 0.05 -minrange 0.1 -maxrange 0.9 -maxspeed 0 -omnicoupling 0.7
```

The six tunable parameters are:

| Parameter | Range | Purpose |
|---|---|---|
| `multiplier` | 0–5 | Overall movement speed scale |
| `minspeed` | 0–1 | Minimum speed for any detected motion |
| `minrange` | 0–1 | Lower bound of thumbstick input mapping |
| `maxrange` | 0–1.5 | Upper bound of thumbstick mapping (can exceed 1.0) |
| `maxspeed` | 0–1 | Speed cap (0 = disabled) |
| `omnicoupling` | 0–1 | 0 = follow head, 1 = follow torso |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 33 via electron-vite |
| UI | React 18 + TypeScript + Tailwind CSS v4 |
| State | Zustand |
| File watching | chokidar |
| Profile I/O | Node.js `fs` in the main process |
| ZIP export | JSZip |
| VR overlay | Custom C++ helper (`vr-helper.exe`) using OpenVR SDK |
| Build | electron-builder → `.zip` (no signing) |

---

## Architecture

### Process Model

```
┌─────────────────────────────────────────────────────┐
│  Electron Main Process                              │
│  ├── profileManager.ts  (file I/O, chokidar)        │
│  ├── vrOverlay.ts       (spawn vr-helper, IPC relay)│
│  └── ipcHandlers.ts     (ipcMain.handle registrar)  │
└───────────┬──────────────────────┬──────────────────┘
            │ IPC                  │ IPC
┌───────────▼──────┐   ┌───────────▼──────────────────┐
│ Desktop Window   │   │ Offscreen Window (?vr=1)      │
│ (main UI)        │   │ (renders VrEditor into BGRA   │
│                  │   │  frames at 15fps)              │
└──────────────────┘   └──────────────────────────────┘
                                   │ stdin/stdout binary protocol
                        ┌──────────▼──────────┐
                        │   vr-helper.exe      │
                        │   (C++, OpenVR SDK)  │
                        │   SteamVR dashboard  │
                        │   overlay            │
                        └──────────────────────┘
```

### IPC Bridge (preload → renderer)

The preload script exposes `window.api` with typed methods for every operation: `scanProfiles`, `loadProfile`, `saveProfile`, `resetProfile`, `deleteProfile`, `importProfile`, `exportOne`, `exportAll`, `openFileDialog`, `saveFileDialog`, `sendLiveUpdate`, `onLiveUpdate`, `onProfilesChanged`, `vrReconnect`, `vrStop`, `vrSetWidth`, `getAutoStart`, `setAutoStart`, `openExternal`, `onVrAppChanged`.

---

## The VR Overlay System

This is the most technically complex part of the project.

### How It Works

1. When the user enables VR mode, the Electron main process spawns a hidden offscreen `BrowserWindow` loading the same renderer but with `?vr=1` in the URL. This renders `VrEditor` instead of the desktop UI.

2. The main process also spawns `vr-helper.exe`, a native C++ process that communicates exclusively over stdin/stdout using a custom binary framing protocol.

3. Every paint event from the offscreen window (capped at 15fps) sends a BGRA pixel frame to `vr-helper.exe` via stdin. The helper does a BGRA→RGBA swap and calls `vr::VROverlay()->SetOverlayRaw(...)` to display it in the SteamVR dashboard.

4. The helper polls OpenVR events on a background thread and sends JSON-encoded mouse events back to Electron over stdout. Electron routes them into `offscreen.webContents.sendInputEvent(...)`, making the overlay fully interactive via VR controllers.

5. When a VR game launches or exits, the helper detects `VREvent_SceneApplicationChanged`, extracts the Steam AppID from the application key (`steam.app.XXXXXX`), and notifies Electron. Electron then loads that game's profile and sends it to both the desktop and VR windows so both stay in sync.

### Wire Protocol

```
[1 byte type][4 bytes payload-length LE][payload bytes]

0x01 FRAME       Electron → helper   uint32 width + uint32 height + BGRA pixels
0x02 STOP        Electron → helper   empty
0x03 STATUS      helper → Electron   JSON { "status": "ready"|"error", "error?": "..." }
0x04 EVENT       helper → Electron   JSON { "type": "mouseMove"|"mouseDown"|"mouseUp", "x": f, "y": f }
0x05 APP_CHANGED helper → Electron   JSON { "appId": "611660" } or { "appId": null }
0x06 SET_WIDTH   Electron → helper   float32 LE width in meters
```

OpenVR delivers mouse y-coordinates bottom-up; the helper flips them (`720 - y`) before sending to Electron so browser coordinates work correctly.

### Auto-reconnect

If SteamVR isn't running when the user enables VR mode, the app enters a `waiting` state and polls `tasklist` every 5 seconds for `vrserver.exe`. When SteamVR starts, it connects automatically. If SteamVR closes while the overlay is active, it returns to `waiting` and resumes polling.

---

## Desktop UI

### Navigation (Sidebar)
Three tabs: **Library**, **Editor**, **Settings**.

### Game Library (`GameList.tsx`)
- Lists all detected game profiles (official + custom combined)
- Three view modes: **List** (with Steam capsule art), **Grid** (tall library covers with fallback to header), **Icons** (square grid)
- Filter tabs: All / Custom / Official
- Search by game name or AppID
- A–Z / Z–A sort toggle
- **Favorites** section (persisted to localStorage)
- **Recently Edited** section (persisted to localStorage)
- **New Profile** modal — enter any Steam AppID; does a local Steam library lookup to resolve the game name with 400ms debounce
- Live updates via chokidar: when any profile file changes externally, the list auto-refreshes

### Profile Editor (`ProfileEditor.tsx`)
- Steam banner image at the top (from Akamai CDN), with graceful fallback if missing
- CUSTOM / NO OFFICIAL badges
- Undo / Redo (up to 20 steps, Ctrl+Z / Ctrl+Y)
- **Auto-save toggle** — debounced at 500ms; saves to disk after every slider change
- Per-parameter sliders + number inputs, with left-border accent showing changed params
- Per-parameter reset button (resets just that one value to official)
- "Official value: X" hint shown below any changed param
- **Presets panel** — built-in presets (Comfort, Standard, Sport, etc.) and a "Copy from game…" modal to clone params from another game in your library
- **Speed Curve** toggle — shows `SpeedCurveChart` visualizing the minrange→maxrange mapping
- **Notes** — per-game freeform textarea, persisted to localStorage
- Footer toolbar: Import .txt, Export .txt, Export All (.zip), Delete Custom Profile

### Live Sync
Every parameter change fires `window.api.sendLiveUpdate(appId, profile)`. The main process relays it to all other windows via `ipcMain.on('profiles:liveUpdate', ...)`. The VR offscreen window receives it and updates its display in real time — no disk write, no latency.

### Settings (`SettingsView` in App.tsx)
- **Theme picker** — visual swatches with live preview miniatures; theme applied via CSS custom properties on `<html>`
- **VR Overlay toggle** (the `VrButton` component) with status indicator (off / waiting / connecting / active / error)
- **Overlay Width** slider (1.0–4.0m) — sends `SET_WIDTH` message to vr-helper immediately
- **Start with Windows** toggle — calls `app.setLoginItemSettings`
- **Keyboard shortcuts** reference card
- **Profile Directories** info panel
- **About** section with Ko-fi link

---

## State Management (Zustand)

Three stores:

**`useAppStore`** — main desktop state:
- Profile list, selected game, edited/official profiles
- Dirty flag, auto-save, undo/redo stacks (max 20)
- VR connection status and current VR game
- Theme ID, overlay width
- Favorites, recently edited, per-game notes, filter mode

**`useVrStore`** — VR overlay state (mirrors a subset of AppStore for the offscreen window)

**`usePresetsStore`** — built-in and user presets

---

## File I/O Safety

Writes go through `saveCustomProfile` which uses `fs.writeFileSync` directly. A `suppressSet` tracks paths being written by the app so the chokidar watcher ignores self-triggered change events and doesn't create feedback loops.

---

## Known Environment Issue: `ELECTRON_RUN_AS_NODE`

This machine has `ELECTRON_RUN_AS_NODE=1` set globally in the shell environment. When set, Electron behaves as plain Node.js and `require('electron')` returns a file path string instead of the Electron API, causing `TypeError: Cannot read properties of undefined (reading 'whenReady')`.

**Fix**: A wrapper script at `scripts/run.js` does `delete process.env.ELECTRON_RUN_AS_NODE` before spawning electron-vite. All npm scripts (`dev`, `build`, `preview`) route through this wrapper.

---

## Build & Distribution

```
npm run dev     # Hot-reload dev server + Electron
npm run build   # electron-vite build + electron-builder → dist/ zip
```

`electron-builder` bundles:
- `resources/vr-helper.exe` (pre-built C++ binary)
- `resources/openvr_api.dll`
- `resources/Logo16/64/256.png`

`asar: false` is set so the driver can find the bundled resources at runtime.

The C++ helper is built separately with CMake + MSVC from `vr-helper/main.cpp` against the OpenVR SDK headers in `vr-helper/openvr/`.

---

## File Map

```
omni-profile-editor/
├── src/
│   ├── main/
│   │   ├── index.ts            Electron entry, window creation, startAutoConnect
│   │   ├── profileManager.ts   All profile file I/O, parse/serialize, chokidar watcher
│   │   ├── ipcHandlers.ts      ipcMain.handle registrations
│   │   └── vrOverlay.ts        Spawn/manage vr-helper, binary protocol, offscreen window
│   ├── preload/
│   │   └── index.ts            Exposes window.api to renderer via contextBridge
│   └── renderer/src/
│       ├── App.tsx             Root: DesktopApp | VrEditor, SettingsView, keyboard shortcuts
│       ├── params.ts           PARAMS constant with all 6 parameter definitions
│       ├── themes.ts           Theme definitions + applyTheme()
│       ├── components/
│       │   ├── Sidebar.tsx         Nav tabs + VR status
│       │   ├── GameList.tsx        Library view (list/grid/icons, search, filter, favorites)
│       │   ├── ProfileEditor.tsx   Desktop param editor
│       │   ├── VrEditor.tsx        VR overlay param editor
│       │   ├── VrButton.tsx        VR connect/disconnect toggle button
│       │   ├── VrSlider.tsx        Large-touch-target slider for VR use
│       │   ├── PresetsPanel.tsx    Built-in presets row
│       │   └── SpeedCurveChart.tsx Speed mapping visualization
│       ├── store/
│       │   ├── useAppStore.ts      Main Zustand store
│       │   ├── useVrStore.ts       VR window Zustand store
│       │   └── usePresetsStore.ts  Presets store
│       ├── lib/
│       │   ├── gameLibraryState.ts Favorites + recently edited (localStorage helpers)
│       │   └── localStorage.ts     Typed lsGet/lsSet wrappers
│       └── types/
│           └── api.d.ts            Profile, ProfileEntry type definitions
└── vr-helper/
    ├── main.cpp                C++ OpenVR overlay helper
    ├── CMakeLists.txt
    └── openvr/                 OpenVR SDK headers + lib
```
