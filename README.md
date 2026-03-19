# OmniTune

A desktop app for editing Virtuix Omni One VR treadmill game profiles — with a live SteamVR overlay so you can tune while you walk.

## What It Does

The Virtuix driver reads plain-text profile files to control how walking motion maps to in-game movement. Before this, tuning meant editing text files blind, restarting, and guessing. OmniTune gives you sliders, live preview, and a SteamVR dashboard overlay.

## Features

- **Profile editor** — sliders + number inputs for all 6 parameters with undo/redo, auto-save, and per-parameter reset
- **Game library** — list/grid/icon views, search, favorites, recently edited, Steam artwork
- **Presets** — built-in comfort/sport/etc. presets plus clone-from-game
- **SteamVR overlay** — edit profiles from inside VR via controller input; auto-reconnects if SteamVR isn't running
- **Live sync** — changes propagate to the VR overlay in real time, no disk write needed
- **Import/export** — single `.txt` or bulk `.zip`
- **Themes** — multiple color themes with live preview

## Tech Stack

| Layer | Tech |
|---|---|
| Shell | Electron 33 (electron-vite) |
| UI | React 18 + TypeScript + Tailwind CSS v4 |
| State | Zustand |
| File watching | chokidar |
| VR overlay | C++ helper (`vr-helper.exe`) via OpenVR SDK |

## Getting Started

```bash
cd omni-profile-editor
npm install
npm run dev       # hot-reload dev
npm run build     # → dist/ zip
```

> **Note:** If your environment has `ELECTRON_RUN_AS_NODE=1` set globally, the npm scripts handle this automatically via `scripts/run.js`.

## VR Overlay

The C++ helper must be built separately with CMake + MSVC before VR mode works:

```bash
cd omni-profile-editor/vr-helper
cmake -B build
cmake --build build --config Release
# copy build/Release/vr-helper.exe → omni-profile-editor/resources/
```

## Profile File Format

Profiles live at `C:\ProgramData\Virtuix\OmniConnect\GameProfile\`. Custom overrides go in the `custom\` subdirectory and take priority over `official\`.

```
-game HalfLife2 -multiplier 1.2 -minspeed 0.05 -minrange 0.1 -maxrange 0.9 -maxspeed 0 -omnicoupling 0.7
```

| Parameter | Range | Description |
|---|---|---|
| `multiplier` | 0–5 | Overall speed scale |
| `minspeed` | 0–1 | Minimum speed for any motion |
| `minrange` | 0–1 | Lower thumbstick input bound |
| `maxrange` | 0–1.5 | Upper thumbstick input bound |
| `maxspeed` | 0–1 | Speed cap (0 = disabled) |
| `omnicoupling` | 0–1 | 0 = head-relative, 1 = torso-relative |
