import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import chokidar from 'chokidar'

const BASE        = 'C:\\ProgramData\\Virtuix\\OmniConnect\\GameProfile'
const OFFICIAL    = path.join(BASE, 'official')
const CUSTOM      = path.join(BASE, 'custom')
const DEFAULT_TXT = path.join(OFFICIAL, 'profile_default.txt')

export interface Profile {
  game: string
  multiplier: number
  minspeed: number
  minrange: number
  maxrange: number
  maxspeed: number
  omnicoupling: number
}

export interface ProfileEntry {
  appId: string
  gameName: string
  officialPath: string | null
  customPath: string | null
  profile: Profile
  officialProfile: Profile
  isCustom: boolean
}

export const PARAMS = [
  { key: 'multiplier',   label: 'Speed Multiplier', min: 0,   max: 5,   step: 0.05,
    description: 'Scales overall movement speed. Typical: 0.8–2.0' },
  { key: 'minspeed',     label: 'Min Speed',         min: 0,   max: 1,   step: 0.01,
    description: 'Minimum speed for any detected movement. Typical: 0.0–0.3' },
  { key: 'minrange',     label: 'Min Range',         min: 0,   max: 1,   step: 0.01,
    description: 'Lower bound of thumbstick input mapping. Typical: 0.0–0.4' },
  { key: 'maxrange',     label: 'Max Range',         min: 0,   max: 1.5, step: 0.01,
    description: 'Upper bound of thumbstick input mapping. Can exceed 1.0. Typical: 0.5–1.0' },
  { key: 'maxspeed',     label: 'Max Speed',         min: 0,   max: 1,   step: 0.01,
    description: '0 = no speed cap (disabled). Typical: 0.0–1.0' },
  { key: 'omnicoupling', label: 'Omni Coupling',     min: 0,   max: 1,   step: 0.05,
    description: '0 = follow head, 1 = follow torso. Default: 0.7' },
] as const

const PARAM_KEYS = PARAMS.map(p => p.key)

const DEFAULT_PROFILE_VALUES: Omit<Profile, 'game'> = {
  multiplier: 1,
  minspeed: 0,
  minrange: 0,
  maxrange: 1,
  maxspeed: 0,
  omnicoupling: 0.7,
}

export function formatGameName(raw: string): string {
  return raw
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]{2,})([A-Z][a-z])/g, '$1 $2')
    .trim()
}

export function parseProfile(line: string): Profile {
  const tokens = line.trim().split(/\s+/)
  const map: Record<string, string> = {}
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].startsWith('-')) {
      map[tokens[i].slice(1)] = tokens[i + 1]
    }
  }
  return {
    game:         map['game']         ?? '',
    multiplier:   parseFloat(map['multiplier']   ?? '') || DEFAULT_PROFILE_VALUES.multiplier,
    minspeed:     parseFloat(map['minspeed']     ?? '') || DEFAULT_PROFILE_VALUES.minspeed,
    minrange:     parseFloat(map['minrange']     ?? '') || DEFAULT_PROFILE_VALUES.minrange,
    maxrange:     parseFloat(map['maxrange']     ?? '') || DEFAULT_PROFILE_VALUES.maxrange,
    maxspeed:     parseFloat(map['maxspeed']     ?? '0'),
    omnicoupling: parseFloat(map['omnicoupling'] ?? '') || DEFAULT_PROFILE_VALUES.omnicoupling,
  }
}

export function serializeProfile(p: Profile): string {
  return [
    `-game ${p.game}`,
    `-multiplier ${p.multiplier}`,
    `-minspeed ${p.minspeed}`,
    `-minrange ${p.minrange}`,
    `-maxrange ${p.maxrange}`,
    `-maxspeed ${p.maxspeed}`,
    `-omnicoupling ${p.omnicoupling}`,
  ].join(' ')
}

export function readDefaultProfile(): Profile {
  try {
    const line = fs.readFileSync(DEFAULT_TXT, 'utf-8').trim()
    return parseProfile(line)
  } catch {
    return { game: 'default', ...DEFAULT_PROFILE_VALUES }
  }
}

function getSteamInstallPath(): string | null {
  try {
    const out = execSync(
      'reg query "HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam" /v InstallPath',
      { encoding: 'utf-8', timeout: 3000, windowsHide: true }
    )
    const m = out.match(/InstallPath\s+REG_SZ\s+(.+)/)
    return m ? m[1].trim() : null
  } catch {
    return null
  }
}

function getSteamLibraryFolders(steamPath: string): string[] {
  const vdfPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf')
  const paths = [path.join(steamPath, 'steamapps')]
  if (!fs.existsSync(vdfPath)) return paths
  const content = fs.readFileSync(vdfPath, 'utf-8')
  const re = /"path"\s+"([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    paths.push(path.join(m[1], 'steamapps'))
  }
  return paths
}

export function getSteamGameName(appId: string): string | null {
  const steamPath = getSteamInstallPath()
  if (!steamPath) return null
  for (const lib of getSteamLibraryFolders(steamPath)) {
    const acf = path.join(lib, `appmanifest_${appId}.acf`)
    if (!fs.existsSync(acf)) continue
    const m = fs.readFileSync(acf, 'utf-8').match(/"name"\s+"([^"]+)"/)
    if (m) return m[1]
  }
  return null
}

export function scanProfiles(): ProfileEntry[] {
  fs.mkdirSync(CUSTOM, { recursive: true })

  const officialFiles = fs.existsSync(OFFICIAL)
    ? fs.readdirSync(OFFICIAL).filter(f => f.match(/^profile_(\d+)\.txt$/))
    : []
  const customFiles = fs.existsSync(CUSTOM)
    ? fs.readdirSync(CUSTOM).filter(f => f.match(/^profile_(\d+)\.txt$/))
    : []

  const appIds = new Set<string>()
  const officialMap = new Map<string, string>()
  const customMap   = new Map<string, string>()

  for (const f of officialFiles) {
    const m = f.match(/^profile_(\d+)\.txt$/)!
    appIds.add(m[1])
    officialMap.set(m[1], path.join(OFFICIAL, f))
  }
  for (const f of customFiles) {
    const m = f.match(/^profile_(\d+)\.txt$/)!
    appIds.add(m[1])
    customMap.set(m[1], path.join(CUSTOM, f))
  }

  const defaults = readDefaultProfile()
  const entries: ProfileEntry[] = []

  for (const appId of appIds) {
    const officialPath = officialMap.get(appId) ?? null
    const customPath   = customMap.get(appId)   ?? null

    const activeLine = customPath  ? fs.readFileSync(customPath,   'utf-8').trim()
                     : officialPath ? fs.readFileSync(officialPath, 'utf-8').trim()
                     : ''
    const officialLine = officialPath ? fs.readFileSync(officialPath, 'utf-8').trim() : null

    const profile         = activeLine   ? parseProfile(activeLine)   : { ...defaults, game: '' }
    const officialProfile = officialLine ? parseProfile(officialLine) : { ...defaults, game: '' }

    const rawGame = profile.game || officialProfile.game
    const gameName = rawGame ? formatGameName(rawGame) : `Unknown Game (${appId})`

    entries.push({
      appId,
      gameName,
      officialPath,
      customPath,
      profile,
      officialProfile,
      isCustom: customPath !== null,
    })
  }

  return entries.sort((a, b) => a.gameName.localeCompare(b.gameName))
}

export function loadProfileForAppId(appId: string): ProfileEntry {
  const officialPath = path.join(OFFICIAL, `profile_${appId}.txt`)
  const customPath   = path.join(CUSTOM,   `profile_${appId}.txt`)

  const hasOfficial = fs.existsSync(officialPath)
  const hasCustom   = fs.existsSync(customPath)

  if (!hasOfficial && !hasCustom) {
    const steamName = getSteamGameName(appId)
    const gameName  = steamName ?? `Unknown Game (${appId})`
    const defaults  = readDefaultProfile()
    return {
      appId,
      gameName,
      officialPath: null,
      customPath:   null,
      profile:         { ...defaults, game: '' },
      officialProfile: { ...defaults, game: '' },
      isCustom: false,
    }
  }

  const activeLine   = hasCustom   ? fs.readFileSync(customPath,   'utf-8').trim()
                     : hasOfficial ? fs.readFileSync(officialPath, 'utf-8').trim()
                     : ''
  const officialLine = hasOfficial ? fs.readFileSync(officialPath, 'utf-8').trim() : null
  const defaults     = readDefaultProfile()

  const profile         = activeLine   ? parseProfile(activeLine)   : { ...defaults, game: '' }
  const officialProfile = officialLine ? parseProfile(officialLine) : { ...defaults, game: '' }

  const rawGame  = profile.game || officialProfile.game
  const gameName = rawGame ? formatGameName(rawGame) : `Unknown Game (${appId})`

  return {
    appId,
    gameName,
    officialPath: hasOfficial ? officialPath : null,
    customPath:   hasCustom   ? customPath   : null,
    profile,
    officialProfile,
    isCustom: hasCustom,
  }
}

const suppressSet = new Set<string>()

export function saveCustomProfile(appId: string, p: Profile): void {
  const dest = path.normalize(path.join(CUSTOM, `profile_${appId}.txt`))
  suppressSet.add(dest)
  fs.mkdirSync(CUSTOM, { recursive: true })
  fs.writeFileSync(dest, serializeProfile(p))
}

export function resetProfile(appId: string): void {
  const dest = path.normalize(path.join(CUSTOM, `profile_${appId}.txt`))
  if (fs.existsSync(dest)) {
    suppressSet.add(dest)
    fs.unlinkSync(dest)
  }
}

export function importProfile(filePath: string): { appId: string | null; profile: Profile } {
  const line    = fs.readFileSync(filePath, 'utf-8').trim()
  const profile = parseProfile(line)
  const m       = path.basename(filePath).match(/^profile_(\d+)\.txt$/)
  return { appId: m ? m[1] : null, profile }
}

export function exportProfile(appId: string, destPath: string): void {
  const entry = loadProfileForAppId(appId)
  fs.writeFileSync(destPath, serializeProfile(entry.profile))
}

export async function exportAllCustom(destZipPath: string): Promise<void> {
  const JSZip = (await import('jszip')).default
  const zip   = new JSZip()
  fs.mkdirSync(CUSTOM, { recursive: true })
  const files = fs.readdirSync(CUSTOM).filter(f => f.endsWith('.txt'))
  for (const f of files) {
    zip.file(f, fs.readFileSync(path.join(CUSTOM, f)))
  }
  const buf = await zip.generateAsync({ type: 'nodebuffer' })
  fs.writeFileSync(destZipPath, buf)
}

export function deleteCustomProfile(appId: string): void {
  resetProfile(appId)
}

export function watchProfiles(onChange: (appId: string) => void): void {
  fs.mkdirSync(CUSTOM, { recursive: true })
  chokidar.watch([OFFICIAL, CUSTOM], { ignoreInitial: true }).on('all', (_, filePath) => {
    const normalized = path.normalize(filePath)
    if (suppressSet.has(normalized)) { suppressSet.delete(normalized); return }
    const m = path.basename(filePath).match(/^profile_(\d+)\.txt$/)
    if (m) onChange(m[1])
  })
}

export function isOmniConnectInstalled(): boolean {
  return fs.existsSync(BASE)
}

// Re-export for use in vrOverlay.ts
export { PARAM_KEYS }
