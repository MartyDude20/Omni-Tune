import { useEffect } from 'react'
import { useVrStore } from '../store/useVrStore'
import { PARAMS } from '../params'
import type { Profile } from '../types/api'
import PresetsPanel from './PresetsPanel'
import VrSlider from './VrSlider'

export default function VrEditor(): JSX.Element {
  const { appId, gameName, editedProfile, officialProfile, hasOfficialProfile, loadGame, updateParam, applyPreset } = useVrStore()

  useEffect(() => {
    const unsub = window.api.onVrAppChanged((payload) => {
      const p = payload as { appId: string | null }
      loadGame(p.appId)
    })
    return unsub
  }, [])

  // Receive live param updates from desktop app
  useEffect(() => {
    return window.api.onLiveUpdate((payload) => {
      const { appId, profile } = payload as { appId: string; profile: import('../types/api').Profile }
      useVrStore.getState().receiveLiveUpdate(appId, profile)
    })
  }, [])


  if (!appId || !editedProfile || !officialProfile) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--icon)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>Launch a VR game</p>
          <p style={{ fontSize: 14, color: 'var(--icon)' }}>Profile controls will appear when a game is detected</p>
        </div>
      </div>
    )
  }

  const paramVals = {
    multiplier: editedProfile.multiplier,
    minspeed: editedProfile.minspeed,
    minrange: editedProfile.minrange,
    maxrange: editedProfile.maxrange,
    maxspeed: editedProfile.maxspeed,
    omnicoupling: editedProfile.omnicoupling,
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ position: 'relative', height: 130, flexShrink: 0, overflow: 'hidden' }}>
        <img
          src={`https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`}
          alt=""
          onError={e => (e.currentTarget as HTMLImageElement).style.display = 'none'}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,12,24,0.5), rgba(8,12,24,0.93))' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 28px 16px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{gameName}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>#{appId}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'var(--accent-b)', color: 'var(--accent-t)', border: '1px solid var(--border)' }}>
              Auto-save on
            </span>
            {!hasOfficialProfile && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                No official profile
              </span>
            )}
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'var(--border)' }} />
      </div>

      {/* Quick presets */}
      <div style={{ padding: '12px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <PresetsPanel currentParams={paramVals} onApply={applyPreset} compact />
      </div>

      {/* Sliders */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {PARAMS.map(({ key, label, min, max, step, description }) => {
            const value    = editedProfile[key as keyof Profile] as number
            const official = officialProfile[key as keyof Profile] as number
            const changed  = value !== official

            return (
              <div key={key} style={{ paddingLeft: 14, borderLeft: `2px solid ${changed ? 'var(--accent)' : 'var(--border)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: changed ? 'var(--accent-t)' : 'var(--text)' }}>{label}</span>
                      {key === 'maxspeed' && value === 0 && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'var(--input)', color: 'var(--muted)', border: '1px solid var(--border)' }}>Disabled</span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--icon)' }}>{description}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {/* Per-param reset in VR */}
                    {changed && (
                      <button
                        onClick={() => updateParam(key as keyof Profile, official)}
                        title={`Reset to ${official}`}
                        style={{ width: 30, height: 30, borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-t)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.32"/></svg>
                      </button>
                    )}
                    <span style={{ fontSize: 20, fontWeight: 700, color: changed ? 'var(--accent-t)' : 'var(--text)', minWidth: 56, textAlign: 'right' }}>
                      {value}
                    </span>
                  </div>
                </div>
                <VrSlider
                  min={min} max={max} step={step} value={value}
                  onChange={v => updateParam(key as keyof Profile, v)}
                />
                {changed && (
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Official: {official}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
