import { create } from 'zustand'
import { lsGet, lsSet } from '../lib/localStorage'
import type { Profile } from '../types/api'

export interface Preset {
  id: string
  name: string
  params: Omit<Profile, 'game'>
}

interface PresetsStore {
  presets: Preset[]
  savePreset: (name: string, params: Omit<Profile, 'game'>) => void
  deletePreset: (id: string) => void
}

export const usePresetsStore = create<PresetsStore>((set, get) => ({
  presets: lsGet<Preset[]>('paramPresets', []),

  savePreset: (name, params) => {
    const preset: Preset = { id: Date.now().toString(), name, params }
    const presets = [...get().presets, preset]
    lsSet('paramPresets', presets)
    set({ presets })
  },

  deletePreset: (id) => {
    const presets = get().presets.filter(p => p.id !== id)
    lsSet('paramPresets', presets)
    set({ presets })
  },
}))
