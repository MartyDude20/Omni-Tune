# Changelog

## v1.0.1

### Bug Fixes
- Switching games now prompts if you have unsaved changes
- Parameter number inputs are clamped to valid ranges
- Auto-save no longer saves the wrong game when switching quickly
- Reset button asks for confirmation before wiping changes
- Tray and window icons now load correctly in installed builds
- VR on/off preference is remembered across app restarts
- PowerShell windows no longer flash when checking Steam or SteamVR
- Profile file watcher no longer triggers spurious refreshes on self-writes

### New
- Drag-and-drop `.txt` import onto the profile editor
- First-run setup wizard checks OmniConnect and SteamVR on first launch
- NSIS installer with desktop shortcut, Start Menu entry, and uninstaller
- Portable `.zip` build still available alongside the installer
- Helpful message when OmniConnect is not installed
- VR overlay correctly loads the running game when started mid-session

---

## v1.0.0 — Initial Release

### Game Library
- Browse all Virtuix Omni One game profiles in list, grid, or icon view
- Filter by All / Custom / Official
- Search by game name or Steam AppID
- Sort A–Z or Z–A
- Steam artwork pulled automatically (capsule, library cover, header — with graceful fallback)
- Favorites — star any game to pin it to the top of the list
- Recently Edited section tracks your last-touched profiles
- Live refresh — library updates automatically when profile files change on disk

### Profile Editor
- Sliders and number inputs for all 6 tunable parameters: Speed Multiplier, Min Speed, Min Range, Max Range, Max Speed, Omni Coupling
- Changed parameters highlighted with a colored accent border
- Per-parameter reset button to restore individual values to the Virtuix default
- "Official value: X" hint shown below any modified parameter
- Undo / Redo up to 20 steps (`Ctrl+Z` / `Ctrl+Y`)
- Auto-save toggle — debounced saves on every slider change, no manual Save needed
- Manual Save (`Ctrl+S`) and full Reset
- Speed Curve chart — visualizes how your Min Range / Max Range settings map walking speed to thumbstick input
- Per-game Notes field persisted locally
- Presets panel — save the current parameters as a named preset, apply or delete presets at any time
- Copy from game — clone parameter values from any other game in your library

### Profile Management
- Create custom profiles for any game by Steam AppID (resolves game name from local Steam library)
- Import a `.txt` profile file
- Export a single profile as `.txt`
- Export all custom profiles as a `.zip` archive
- Delete custom profile to revert to the official Virtuix default

### SteamVR Overlay
- Full profile editor available as a SteamVR dashboard overlay — tune while wearing the headset
- Controller input support (point and click on sliders)
- Auto-detects the currently running game and loads its profile automatically
- Auto-reconnect — waits for SteamVR to start if it isn't running; reconnects if SteamVR restarts
- Adjustable overlay width (1.0–4.0 m)
- Live sync — changes in the desktop editor update the VR overlay instantly (and vice versa), no disk write needed

### Application
- Multiple color themes with live preview
- Start with Windows option
- Keyboard shortcuts: `Ctrl+S` save, `Ctrl+Z` undo, `Ctrl+Y` redo
- Changes take effect in-game within ~2 seconds — no game or driver restart required
