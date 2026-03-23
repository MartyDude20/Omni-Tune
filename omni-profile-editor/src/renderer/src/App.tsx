import { useEffect, useState } from 'react'
import logo256 from './assets/Logo256.png'
import FirstRunWizard from './components/FirstRunWizard'
import WhatsNewModal from './components/WhatsNewModal'
import Sidebar from './components/Sidebar'
import GameList from './components/GameList'
import ProfileEditor from './components/ProfileEditor'
import VrEditor from './components/VrEditor'
import VrButton from './components/VrButton'
import { useAppStore } from './store/useAppStore'
import { THEMES } from './themes'

const isVr = new URLSearchParams(window.location.search).get('vr') === '1'

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--muted)',
  marginBottom: 16, textTransform: 'uppercase',
}
const CARD: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
}

function ToggleRow({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: (v: boolean) => void }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>{sub}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', background: checked ? 'var(--accent)' : 'var(--input)', transition: 'background 0.2s', flexShrink: 0 }}
      >
        <span style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
      </button>
    </div>
  )
}

function SettingsView(): JSX.Element {
  const { themeId, setTheme, overlayWidth, setOverlayWidth } = useAppStore()
  const [autoStart, setAutoStartLocal] = useState(false)

  useEffect(() => {
    window.api.getAutoStart().then(setAutoStartLocal).catch(() => {})
  }, [])

  async function handleAutoStart(enabled: boolean): Promise<void> {
    await window.api.setAutoStart(enabled)
    setAutoStartLocal(enabled)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      <div style={{ padding: '32px 36px 24px', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>Configure the overlay and application options</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>
        <div style={{ maxWidth: 600 }}>

          {/* Appearance */}
          <p style={SECTION_LABEL}>Appearance</p>
          <div style={{ ...CARD, padding: 24, marginBottom: 32 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Theme</p>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Choose a color theme for the interface</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {THEMES.map(t => {
                const active = themeId === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, cursor: 'pointer', border: active ? `2px solid ${t.accent}` : '2px solid transparent', background: active ? t.accentB : 'var(--input)', transition: 'all 0.15s' }}
                  >
                    <div style={{ width: 56, height: 40, borderRadius: 8, overflow: 'hidden', position: 'relative', border: `1px solid ${t.border}` }}>
                      <div style={{ position: 'absolute', inset: 0, background: t.bg }} />
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 16, background: t.surface, borderRight: `1px solid ${t.border}` }} />
                      <div style={{ position: 'absolute', bottom: 6, left: 20, right: 6, height: 4, borderRadius: 2, background: t.border }} />
                      <div style={{ position: 'absolute', bottom: 14, left: 20, right: 14, height: 4, borderRadius: 2, background: t.accent }} />
                      {active && <div style={{ position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: '50%', background: t.accent, boxShadow: `0 0 6px ${t.glow}` }} />}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? t.accent : 'var(--text2)', whiteSpace: 'nowrap' }}>{t.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* SteamVR overlay */}
          <p style={SECTION_LABEL}>SteamVR Overlay</p>
          <div style={{ ...CARD, padding: 24, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>VR Overlay</p>
                <p style={{ fontSize: 13, color: 'var(--text2)' }}>Show profile editor as a SteamVR dashboard overlay</p>
              </div>
              <VrButton />
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Overlay Width</p>
                  <p style={{ fontSize: 13, color: 'var(--text2)' }}>Width of the overlay panel in the VR world</p>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-t)', minWidth: 52, textAlign: 'right' }}>{overlayWidth.toFixed(1)} m</span>
              </div>
              <input
                type="range" min={1.0} max={4.0} step={0.1} value={overlayWidth}
                onChange={e => setOverlayWidth(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>1.0 m</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>4.0 m</span>
              </div>
            </div>
          </div>

          {/* Application */}
          <p style={SECTION_LABEL}>Application</p>
          <div style={{ ...CARD, padding: 24, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ToggleRow
              label="Start with Windows"
              sub="Launch automatically when you log in"
              checked={autoStart}
              onChange={handleAutoStart}
            />
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Keyboard Shortcuts</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {[
                  ['Ctrl + S', 'Save profile'],
                  ['Ctrl + Z', 'Undo'],
                  ['Ctrl + Y', 'Redo'],
                ].map(([key, action]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{action}</span>
                    <code style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'monospace' }}>{key}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Profile dirs */}
          <p style={SECTION_LABEL}>Profile Directories</p>
          <div style={{ ...CARD, overflow: 'hidden', marginBottom: 32 }}>
            {[
              { label: 'Official profiles', path: 'C:\\ProgramData\\Virtuix\\OmniConnect\\GameProfile\\official', note: 'Read-only — managed by Virtuix' },
              { label: 'Custom profiles',   path: 'C:\\ProgramData\\Virtuix\\OmniConnect\\GameProfile\\custom',   note: 'Your overrides — driver reads these first' },
            ].map(({ label, path, note }, i) => (
              <div key={label} style={{ padding: '18px 24px', borderBottom: i === 0 ? '1px solid var(--border)' : 'none' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'monospace', marginBottom: 4 }}>{path}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>{note}</p>
              </div>
            ))}
          </div>

          {/* About */}
          <p style={SECTION_LABEL}>About</p>
          <div style={{ ...CARD, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <img src={logo256} alt="OmniTune" style={{ width: 44, height: 44, borderRadius: 12 }} />
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>OmniTune</p>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>v1.0.1</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 16 }}>
              Fine-tune Virtuix Omni One game profiles. Changes take effect within ~2 seconds — no restart required.
            </p>
            <a
              href="https://ko-fi.com/martydudevr"
              onClick={e => { e.preventDefault(); window.api.openExternal('https://ko-fi.com/martydudevr') }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: '#FF5E5B', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 9.295-.082 11.026c0 2.521 1.75 3.821 3.533 3.821 1.854 0 5.145-.003 5.145-.003.059.014.122.021.184.021a1 1 0 0 0 .184-.021s3.291.003 5.145.003c1.783 0 3.533-1.3 3.533-3.821V12.21s.587 0 1.456-.073c2.246-.192 3.984-1.968 3.739-3.189zm-6.104 3.638c0 1.13-.795 2.083-1.731 2.083H12.21v-5.5h3.836c.936 0 1.731.953 1.731 2.083v1.334z"/></svg>
              Support on Ko-fi
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}

function DesktopApp(): JSX.Element {
  const { activeTab, save, undo, redo } = useAppStore()

  // Receive live param updates from VR overlay
  useEffect(() => {
    return window.api.onLiveUpdate((payload) => {
      const { appId, profile } = payload as { appId: string; profile: import('./types/api').Profile }
      useAppStore.getState().receiveLiveUpdate(appId, profile)
    })
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); save() }
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [save, undo, redo])

  const mainContent =
    activeTab === 'library' ? <GameList /> :
    activeTab === 'editor'  ? <ProfileEditor /> :
    <SettingsView />

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <Sidebar />
      {mainContent}
    </div>
  )
}

function App(): JSX.Element {
  const [showWizard, setShowWizard] = useState(false)
  const [wizardChecked, setWizardChecked] = useState(false)
  const [whatsNew, setWhatsNew] = useState<{ version: string; notes: string[] } | null>(null)

  useEffect(() => {
    if (isVr) { setWizardChecked(true); return }
    window.api.getFirstRun()
      .then(isFirst => { setShowWizard(isFirst); setWizardChecked(true) })
      .catch(() => setWizardChecked(true))
  }, [])

  useEffect(() => {
    if (isVr) return
    window.api.getWhatsNew().then(data => { if (data) setWhatsNew(data) }).catch(() => {})
  }, [])

  if (!wizardChecked) {
    return <div style={{ height: '100vh', background: 'var(--bg)' }} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {!isVr && (
        <div style={{ height: 40, background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0, WebkitAppRegion: 'drag' } as React.CSSProperties} />
      )}
      {isVr ? <VrEditor /> : <DesktopApp />}
      {showWizard && !isVr && (
        <FirstRunWizard onComplete={() => setShowWizard(false)} />
      )}
      {whatsNew && !isVr && (
        <WhatsNewModal
          version={whatsNew.version}
          notes={whatsNew.notes}
          onDismiss={() => { window.api.dismissWhatsNew().catch(() => {}); setWhatsNew(null) }}
        />
      )}
    </div>
  )
}

export default App
