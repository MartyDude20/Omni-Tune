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

interface OpenFileOptions {
  filters?: { name: string; extensions: string[] }[]
  title?: string
  defaultPath?: string
}

interface SaveFileOptions {
  filters?: { name: string; extensions: string[] }[]
  title?: string
  defaultPath?: string
}

interface VrStatusPayload {
  status: 'ready' | 'error' | 'off'
  error?: string
}

interface VrAppPayload {
  appId: string | null
  gameName: string | null
}

declare global {
  interface Window {
    api: {
      scanProfiles:      ()                                          => Promise<ProfileEntry[]>
      loadProfile:       (appId: string)                            => Promise<ProfileEntry>
      saveProfile:       (appId: string, profile: Profile)          => Promise<void>
      resetProfile:      (appId: string)                            => Promise<void>
      deleteProfile:     (appId: string)                            => Promise<void>
      importProfile:     (filePath: string)                         => Promise<{ appId: string | null; profile: Profile }>
      exportOne:         (appId: string, destPath: string)          => Promise<void>
      exportAll:         (destZipPath: string)                      => Promise<void>
      onProfilesChanged: (cb: (payload: { appId: string }) => void) => () => void

      sendLiveUpdate: (appId: string, profile: Profile) => void
      onLiveUpdate:   (cb: (payload: { appId: string; profile: Profile }) => void) => () => void

      openFileDialog: (options: OpenFileOptions) => Promise<string | null>
      saveFileDialog: (options: SaveFileOptions) => Promise<string | null>

      vrReconnect:    ()                                             => Promise<void>
      vrStop:         ()                                             => Promise<void>
      vrSetWidth:     (meters: number)                              => Promise<void>
      onVrStatus:     (cb: (payload: VrStatusPayload) => void)      => () => void
      onVrAppChanged: (cb: (payload: VrAppPayload) => void)         => () => void

      getAutoStart:  ()                    => Promise<boolean>
      setAutoStart:  (enabled: boolean)   => Promise<void>
      openExternal:  (url: string)        => Promise<void>
    }
  }
}
