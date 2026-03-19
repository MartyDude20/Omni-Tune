import { create } from 'zustand'
import type { Profile, ProfileEntry } from '../types/api'

type ParamValues = Omit<Profile, 'game'>

interface VrStore {
  appId: string | null
  gameName: string | null
  editedProfile: Profile | null
  officialProfile: Profile | null
  hasOfficialProfile: boolean

  loadGame: (appId: string | null) => Promise<void>
  updateParam: (key: keyof Profile, value: number | string) => void
  applyPreset: (params: ParamValues) => void
  receiveLiveUpdate: (appId: string, profile: Profile) => void
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleAutoSave(get: () => VrStore): void {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    const { appId, editedProfile } = get()
    if (!appId || !editedProfile) return
    window.api.saveProfile(appId, editedProfile)
  }, 500)
}

export const useVrStore = create<VrStore>((set, get) => ({
  appId: null,
  gameName: null,
  editedProfile: null,
  officialProfile: null,
  hasOfficialProfile: false,

  loadGame: async (appId) => {
    if (!appId) {
      set({ appId: null, gameName: null, editedProfile: null, officialProfile: null, hasOfficialProfile: false })
      return
    }
    const entry: ProfileEntry = await window.api.loadProfile(appId)
    set({
      appId,
      gameName: entry.gameName,
      editedProfile: { ...entry.profile },
      officialProfile: { ...entry.officialProfile },
      hasOfficialProfile: entry.officialPath !== null,
    })
  },

  updateParam: (key, value) => {
    const { editedProfile, appId } = get()
    if (!editedProfile) return
    const updated = { ...editedProfile, [key]: value }
    set({ editedProfile: updated })
    if (appId) window.api.sendLiveUpdate(appId, updated)
    scheduleAutoSave(get)
  },

  applyPreset: (params) => {
    const { editedProfile, appId } = get()
    if (!editedProfile) return
    const updated = { ...editedProfile, ...params }
    set({ editedProfile: updated })
    if (appId) window.api.sendLiveUpdate(appId, updated)
    scheduleAutoSave(get)
  },

  receiveLiveUpdate: (appId, profile) => {
    const { appId: currentAppId } = get()
    if (appId !== currentAppId) return
    set({ editedProfile: { ...profile } })
  },
}))
