import { useEffect, useState } from 'react'
import { useAppStore, type NavTab } from '../store/useAppStore'

const NAV: { id: NavTab; label: string; icon: JSX.Element }[] = [
  {
    id: 'library',
    label: 'Game Library',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'editor',
    label: 'Profile Editor',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
]

function ActiveGamePanel(): JSX.Element {
  const { vrCurrentAppId, vrCurrentGameName, vrStatus } = useAppStore()
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: '20px 20px 16px' }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase' }}>
        Active Game
      </p>

      {vrCurrentAppId && vrStatus === 'active' ? (
        <>
          <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 12, border: '1px solid var(--border)' }}>
            {!imgFailed ? (
              <img
                src={`https://cdn.akamai.steamstatic.com/steam/apps/${vrCurrentAppId}/header.jpg`}
                alt=""
                onError={() => setImgFailed(true)}
                style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{ height: 100, background: 'var(--input)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--icon)', fontSize: 18, fontWeight: 700 }}>
                {vrCurrentGameName?.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6, lineHeight: 1.3 }}>{vrCurrentGameName}</p>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 4, background: 'var(--accent-b)', color: 'var(--accent-t)', border: '1px solid var(--border)' }}>
            OFFICIAL
          </span>
        </>
      ) : (
        <div style={{ height: 70, borderRadius: 10, border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--icon)' }}>No active game</p>
        </div>
      )}
    </div>
  )
}

export default function Sidebar(): JSX.Element {
  const { activeTab, setActiveTab } = useAppStore()
  const [version, setVersion] = useState('')
  useEffect(() => { window.api.getVersion().then(setVersion).catch(() => {}) }, [])

  useEffect(() => {
    const us = window.api.onVrStatus((p) => {
      const { status, error } = p as { status: string; error?: string }
      useAppStore.getState().setVrStatus(status, error)
    })
    const ua = window.api.onVrAppChanged((p) => {
      const { appId, gameName } = p as { appId: string | null; gameName: string | null }
      useAppStore.getState().setVrApp(appId, gameName)
    })
    return () => { us(); ua() }
  }, [])

  return (
    <div style={{ width: 260, minWidth: 260, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Logo */}
      <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent-b))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px var(--glow)', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <polygon points="12,3 20,9 17,19 7,19 4,9"/>
              <polygon points="12,8 17,12 15,18 9,18 7,12" fill="rgba(0,0,0,0.35)"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>Omni Profile</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Editor</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {NAV.map(({ id, label, icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 16px', borderRadius: 10, marginBottom: 4,
                background:  active ? 'var(--accent-b)' : 'transparent',
                color:       active ? 'var(--accent-t)' : 'var(--text2)',
                border:      'none',
                borderLeft:  `3px solid ${active ? 'var(--accent)' : 'transparent'}`,
                fontWeight:  active ? 600 : 400,
                fontSize:    14, cursor: 'pointer',
                transition:  'all 0.15s',
                textAlign:   'left',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--input)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span style={{ opacity: active ? 1 : 0.55, flexShrink: 0 }}>{icon}</span>
              {label}
            </button>
          )
        })}
      </nav>

      {/* Active game */}
      <ActiveGamePanel />

      {/* Version */}
      <div style={{ padding: '10px 20px 14px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 11, color: 'var(--icon)' }}>{version ? `v${version}` : ''}</p>
      </div>
    </div>
  )
}
