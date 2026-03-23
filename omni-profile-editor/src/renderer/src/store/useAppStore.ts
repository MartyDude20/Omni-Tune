import { create } from 'zustand'
import type { Profile, ProfileEntry } from '../types/api'
import { THEMES, applyTheme } from '../themes'
import { getFavorites, toggleFavorite, getRecentlyEdited, pushRecentlyEdited } from '../lib/gameLibraryState'
import { lsGet, lsSet } from '../lib/localStorage'

type VrStatus = 'off' | 'connecting' | 'active' | 'error' | 'unavailable' | 'waiting'
export type NavTab = 'library' | 'editor' | 'settings'
export type FilterMode = 'all' | 'custom' | 'official'

type ParamValues = Omit<Profile, 'game'>

// Apply saved theme immediately on module load (before first render)
const _savedId = localStorage.getItem('themeId') ?? 'midnight'
applyTheme(THEMES.find(t => t.id === _savedId) ?? THEMES[0])

const MAX_HISTORY = 20

function getParams(p: Profile): ParamValues {
  return { multiplier: p.multiplier, minspeed: p.minspeed, minrange: p.minrange, maxrange: p.maxrange, maxspeed: p.maxspeed, omnicoupling: p.omnicoupling }
}

function pushHist(history: ParamValues[], state: ParamValues): ParamValues[] {
  return [...history, state].slice(-MAX_HISTORY)
}

interface AppStore {
  profiles: ProfileEntry[]
  selectedAppId: string | null
  editedProfile: Profile | null
  officialProfile: Profile | null
  isDirty: boolean
  autoSave: boolean
  activeTab: NavTab
  vrStatus: VrStatus
  vrError: string | null
  vrCurrentAppId: string | null
  vrCurrentGameName: string | null
  themeId: string
  overlayWidth: number

  // Undo/redo
  history: ParamValues[]
  future: ParamValues[]

  // Library state (persisted to localStorage)
  favorites: Set<string>
  recentlyEdited: string[]
  notes: Record<string, string>
  filterMode: FilterMode

  setProfiles:         (p: ProfileEntry[]) => void
  selectGame:          (appId: string) => Promise<void>
  setActiveTab:        (tab: NavTab) => void
  updateParam:         (key: keyof Profile, value: number | string) => void
  applyPreset:         (params: ParamValues) => void
  save:                () => Promise<void>
  reset:               () => Promise<void>
  deleteCustomProfile: () => Promise<void>
  undo:                () => void
  redo:                () => void
  setVrStatus:         (status: string, error?: string) => void
  setVrApp:            (appId: string | null, gameName: string | null) => void
  toggleAutoSave:      () => void
  setTheme:            (id: string) => void
  setOverlayWidth:     (meters: number) => void
  toggleFav:           (appId: string) => void
  setNote:             (appId: string, note: string) => void
  setFilterMode:       (mode: FilterMode) => void
  receiveLiveUpdate:   (appId: string, profile: Profile) => void
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

export const useAppStore = create<AppStore>((set, get) => ({
  profiles: [],
  selectedAppId: null,
  editedProfile: null,
  officialProfile: null,
  isDirty: false,
  autoSave: false,
  activeTab: 'library',
  vrStatus: 'off',
  vrError: null,
  vrCurrentAppId: null,
  vrCurrentGameName: null,
  themeId: _savedId,
  overlayWidth: lsGet<number>('overlayWidth', 2.5),

  history: [],
  future: [],

  favorites: getFavorites(),
  recentlyEdited: getRecentlyEdited(),
  notes: lsGet<Record<string, string>>('profileNotes', {}),
  filterMode: 'all',

  setProfiles: (profiles) => set({ profiles }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectGame: async (appId) => {
    const { isDirty, selectedAppId } = get()
    if (isDirty && selectedAppId && selectedAppId !== appId) {
      if (!window.confirm('You have unsaved changes. Discard them?')) return
    }
    const entry = await window.api.loadProfile(appId)
    const next = pushRecentlyEdited(appId)
    set({
      selectedAppId: appId,
      editedProfile: { ...entry.profile },
      officialProfile: { ...entry.officialProfile },
      isDirty: false,
      activeTab: 'editor',
      history: [],
      future: [],
      recentlyEdited: next,
    })
  },

  updateParam: (key, value) => {
    const { editedProfile, autoSave, history, selectedAppId } = get()
    if (!editedProfile) return
    const updated = { ...editedProfile, [key]: value }
    set({
      editedProfile: updated,
      isDirty: true,
      history: pushHist(history, getParams(editedProfile)),
      future: [],
    })
    if (selectedAppId) window.api.sendLiveUpdate(selectedAppId, updated)
    if (autoSave && selectedAppId) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer)
      const capturedId = selectedAppId
      const capturedProfile = updated
      autoSaveTimer = setTimeout(async () => {
        if (get().selectedAppId !== capturedId) return
        await window.api.saveProfile(capturedId, capturedProfile)
        if (get().selectedAppId === capturedId) set({ isDirty: false })
      }, 500)
    }
  },

  applyPreset: (params) => {
    const { editedProfile, autoSave, history, selectedAppId } = get()
    if (!editedProfile) return
    const updated = { ...editedProfile, ...params }
    set({
      editedProfile: updated,
      isDirty: true,
      history: pushHist(history, getParams(editedProfile)),
      future: [],
    })
    if (selectedAppId) window.api.sendLiveUpdate(selectedAppId, updated)
    if (autoSave && selectedAppId) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer)
      const capturedId = selectedAppId
      const capturedProfile = updated
      autoSaveTimer = setTimeout(async () => {
        if (get().selectedAppId !== capturedId) return
        await window.api.saveProfile(capturedId, capturedProfile)
        if (get().selectedAppId === capturedId) set({ isDirty: false })
      }, 500)
    }
  },

  undo: () => {
    const { history, future, editedProfile } = get()
    if (!history.length || !editedProfile) return
    const prev = history[history.length - 1]
    set({
      editedProfile: { ...editedProfile, ...prev },
      isDirty: true,
      history: history.slice(0, -1),
      future: [...future, getParams(editedProfile)],
    })
  },

  redo: () => {
    const { history, future, editedProfile } = get()
    if (!future.length || !editedProfile) return
    const next = future[future.length - 1]
    set({
      editedProfile: { ...editedProfile, ...next },
      isDirty: true,
      future: future.slice(0, -1),
      history: [...history, getParams(editedProfile)],
    })
  },

  save: async () => {
    const { selectedAppId, editedProfile } = get()
    if (!selectedAppId || !editedProfile) return
    await window.api.saveProfile(selectedAppId, editedProfile)
    set({ isDirty: false })
  },

  reset: async () => {
    const { selectedAppId } = get()
    if (!selectedAppId) return
    await window.api.resetProfile(selectedAppId)
    const entry = await window.api.loadProfile(selectedAppId)
    set({
      editedProfile: { ...entry.profile },
      officialProfile: { ...entry.officialProfile },
      isDirty: false,
      history: [],
      future: [],
    })
  },

  deleteCustomProfile: async () => {
    const { selectedAppId } = get()
    if (!selectedAppId) return
    await window.api.deleteProfile(selectedAppId)
    const profiles = await window.api.scanProfiles()
    set({
      profiles,
      selectedAppId: null,
      editedProfile: null,
      officialProfile: null,
      isDirty: false,
      history: [],
      future: [],
      activeTab: 'library',
    })
  },

  setVrStatus: (status, error) => {
    const statusMap: Record<string, VrStatus> = { ready: 'active', error: 'error', off: 'off', waiting: 'waiting' }
    set({ vrStatus: statusMap[status] ?? 'error', vrError: error ?? null })
  },

  setVrApp: (appId, gameName) => set({ vrCurrentAppId: appId, vrCurrentGameName: gameName }),
  toggleAutoSave: () => set((s) => ({ autoSave: !s.autoSave })),

  setTheme: (id) => {
    const theme = THEMES.find(t => t.id === id) ?? THEMES[0]
    applyTheme(theme)
    localStorage.setItem('themeId', id)
    set({ themeId: id })
  },

  setOverlayWidth: (meters) => {
    lsSet('overlayWidth', meters)
    set({ overlayWidth: meters })
    if (get().vrStatus === 'active') window.api.vrSetWidth(meters)
  },

  toggleFav: (appId) => {
    set({ favorites: toggleFavorite(appId) })
  },

  setNote: (appId, note) => {
    const notes = { ...get().notes, [appId]: note }
    lsSet('profileNotes', notes)
    set({ notes })
  },

  setFilterMode: (mode) => set({ filterMode: mode }),

  receiveLiveUpdate: (appId, profile) => {
    const { selectedAppId } = get()
    if (appId !== selectedAppId) return
    set({ editedProfile: { ...profile } })
  },
}))
