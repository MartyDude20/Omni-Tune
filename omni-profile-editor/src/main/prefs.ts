import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

interface Prefs {
  vrEnabled: boolean
  firstRun: boolean
  lastSeenVersion: string
}

const DEFAULT: Prefs = { vrEnabled: false, firstRun: true, lastSeenVersion: '' }

function prefsPath(): string {
  return path.join(app.getPath('userData'), 'prefs.json')
}

export function readPrefs(): Prefs {
  try {
    return { ...DEFAULT, ...(JSON.parse(fs.readFileSync(prefsPath(), 'utf-8')) as Partial<Prefs>) }
  } catch {
    return { ...DEFAULT }
  }
}

export function writePrefs(updates: Partial<Prefs>): void {
  try {
    fs.writeFileSync(prefsPath(), JSON.stringify({ ...readPrefs(), ...updates }))
  } catch {}
}
