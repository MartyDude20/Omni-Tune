# OmniTune — User Guide

OmniTune lets you tune how your Virtuix Omni One treadmill feels in each game. Changes take effect within ~2 seconds — no game restart required.

---

## First Launch

When you open OmniTune, you'll land on the **Game Library**. This lists every game that has a profile installed by the Virtuix driver.

- **OFFICIAL** profiles are managed by Virtuix and are read-only. You can view them but can't save changes directly.
- **CUSTOM** profiles are your personal overrides. The driver always reads your custom profile first if one exists.

If your library is empty, make sure the Virtuix OmniConnect software is installed and has run at least once.

---

## Editing a Game's Profile

1. Click any game in the library to open it in the **Editor** tab.
2. Adjust the sliders. Any parameter that differs from the official value gets a colored left border so you can see what you've changed.
3. Hit **Save** (or `Ctrl+S`) to write the profile to disk. The driver picks it up automatically — no restart needed.

### The parameters

| Parameter | What it does |
|---|---|
| **Speed Multiplier** | Overall speed scale. 1.0 is the driver's default; go higher to feel faster, lower if the game feels too fast. |
| **Min Speed** | The slowest speed the treadmill will register. Raise this if slow walking feels too sluggish or unresponsive. |
| **Min Range** | The lower end of the thumbstick input range. Affects how walking maps to the stick at low speeds. |
| **Max Range** | The upper end of the thumbstick input range. Can go above 1.0 to push the stick past its normal maximum. |
| **Max Speed** | A hard speed cap. Set to 0 to disable (no cap). |
| **Omni Coupling** | How movement direction is determined. 0 = follows where your head looks. 1 = follows where your body is pointing. Most games work best around 0.7. |

### Tips

- **Auto-save** (toggle in the toolbar) saves automatically as you move sliders — useful for live tuning while in-game.
- **Undo / Redo** (`Ctrl+Z` / `Ctrl+Y`) steps back through up to 20 changes.
- The small reset button next to a changed parameter restores just that one value to the Virtuix default.
- **Reset** (top right) restores all parameters to the official values at once.
- The **Speed Curve** button shows a chart of how your minrange/maxrange settings map movement speed to thumbstick input.
- **Notes** lets you jot down anything useful for that game (e.g. "feels best at 1.4x for sprint sections").

---

## Creating a Profile for a New Game

If a game doesn't appear in your library, Virtuix hasn't shipped a default profile for it yet. You can create one manually:

1. Click **+ New Profile** in the top right of the library.
2. Enter the game's **Steam AppID**. You can find this in the URL on the game's Steam store page (e.g. `store.steampowered.com/app/611660/` → AppID is `611660`).
3. OmniTune will look up the game name from your local Steam library and confirm it.
4. Click **Create**. The game is added with neutral default values — tune from there.

---

## Presets

The **Presets** row at the top of the editor lets you save and reuse your own parameter combinations:

1. Dial in a set of parameters you like.
2. Click **+ Save as Preset** and give it a name.
3. The preset appears as a chip — click it any time to apply those values, or × to delete it.

Use **Copy from game…** to pull the exact parameter values from any other game in your library. Useful when a new game feels similar to one you've already dialed in.

---

## VR Overlay (Optional)

If you want to tune profiles while wearing the headset:

1. Go to the **Settings** tab.
2. Under *SteamVR Overlay*, click the toggle to enable it.
3. If SteamVR is already running, the overlay appears immediately in your SteamVR dashboard. If not, OmniTune waits and connects automatically when SteamVR starts.
4. Open the SteamVR dashboard while in-game. You'll see the OmniTune editor as an overlay panel.
5. Use your VR controllers to adjust sliders directly. Changes sync to the desktop window in real time.

The overlay automatically loads the profile for whatever game is currently running in SteamVR.

**Overlay Width** in Settings controls how large the panel appears in VR (1.0–4.0 meters).

To stop the overlay, click **● In SteamVR — Stop** or close OmniTune.

---

## Import / Export

At the bottom of the editor:

- **Import .txt** — load a profile file shared by someone else (or exported from another install). The values are applied to the game currently open in the editor. You can also drag and drop a `.txt` file directly onto the editor.
- **Export .txt** — save the current game's profile as a plain-text file you can share or back up.
- **Export All (.zip)** — zip up all your custom profiles at once.

---

## Other Settings

| Setting | What it does |
|---|---|
| **Theme** | Changes the color scheme. Picks up immediately with a live preview. |
| **Start with Windows** | Launches OmniTune automatically when you log in. |

---

## Deleting a Custom Profile

If you've created a custom profile and want to go back to Virtuix's defaults, open that game in the editor and click **Delete Custom Profile** at the bottom. The game will go back to using the official profile (or disappear from the library if there isn't one).
