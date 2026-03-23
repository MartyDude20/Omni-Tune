import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useToastStore } from '../store/useToastStore'
import { PARAMS } from '../params'
import type { Profile } from '../types/api'
import PresetsPanel from './PresetsPanel'
import SpeedCurveChart from './SpeedCurveChart'

export default function ProfileEditor(): JSX.Element {
  const {
    profiles, selectedAppId, editedProfile, officialProfile,
    isDirty, autoSave, history, future,
    updateParam, applyPreset, save, reset, deleteCustomProfile,
    undo, redo, toggleAutoSave, notes, setNote,
  } = useAppStore()

  const { addToast } = useToastStore()
  const [importModal, setImportModal] = useState(false)
  const [pendingImport, setPendingImport] = useState<{ profile: Profile } | null>(null)
  const [importAppId, setImportAppId] = useState('')
  const [copyModal, setCopyModal] = useState(false)
  const [copySearch, setCopySearch] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [showCurve, setShowCurve] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  if (!selectedAppId || !editedProfile || !officialProfile) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--icon)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </div>
        <p style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 500 }}>Select a game from the library to edit</p>
      </div>
    )
  }

  const entry = profiles.find(p => p.appId === selectedAppId)
  const gameName = entry?.gameName ?? selectedAppId
  const isCustom = entry?.isCustom ?? false
  const hasOfficial = entry?.officialPath !== null
  const note = notes[selectedAppId] ?? ''
  const paramVals = { multiplier: editedProfile.multiplier, minspeed: editedProfile.minspeed, minrange: editedProfile.minrange, maxrange: editedProfile.maxrange, maxspeed: editedProfile.maxspeed, omnicoupling: editedProfile.omnicoupling }

  async function handleImport(): Promise<void> {
    try {
      const filePath = await window.api.openFileDialog({ filters: [{ name: 'Profile', extensions: ['txt'] }] })
      if (!filePath) return
      const result = await window.api.importProfile(filePath)
      for (const k of Object.keys(result.profile) as (keyof Profile)[]) {
        if (k !== 'game') updateParam(k, result.profile[k] as number)
      }
    } catch {
      addToast('Failed to import profile.')
    }
  }
  async function handleImportConfirm(): Promise<void> {
    const appId = importAppId.trim()
    if (!appId || !pendingImport) return
    try {
      await window.api.saveProfile(appId, pendingImport.profile)
      setPendingImport(null); setImportAppId(''); setImportModal(false)
    } catch {
      addToast('Failed to save imported profile.')
    }
  }
  async function handleExport(): Promise<void> {
    if (!selectedAppId) return
    try {
      const p = await window.api.saveFileDialog({ filters: [{ name: 'Profile', extensions: ['txt'] }], defaultPath: `profile_${selectedAppId}.txt` })
      if (p) await window.api.exportOne(selectedAppId, p)
    } catch {
      addToast('Failed to export profile.')
    }
  }
  async function handleExportAll(): Promise<void> {
    try {
      const p = await window.api.saveFileDialog({ filters: [{ name: 'ZIP Archive', extensions: ['zip'] }], defaultPath: 'omni-custom-profiles.zip' })
      if (p) await window.api.exportAll(p)
    } catch {
      addToast('Failed to export profiles.')
    }
  }
  async function handleDrop(e: React.DragEvent<HTMLDivElement>): Promise<void> {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file || !file.name.endsWith('.txt')) return
    const filePath = (file as File & { path: string }).path
    if (!filePath) return
    try {
      const result = await window.api.importProfile(filePath)
      for (const k of Object.keys(result.profile) as (keyof Profile)[]) {
        if (k !== 'game') updateParam(k, result.profile[k] as number)
      }
    } catch {
      addToast('Failed to import dropped file.')
    }
  }
  async function handleDelete(): Promise<void> {
    if (!isCustom) return
    if (!window.confirm(`Delete custom profile for "${gameName}"? The official profile (if any) will be used instead.`)) return
    try {
      await deleteCustomProfile()
    } catch {
      addToast('Failed to delete profile.')
    }
  }

  const copyFiltered = profiles.filter(p => p.appId !== selectedAppId && (p.gameName.toLowerCase().includes(copySearch.toLowerCase()) || p.appId.includes(copySearch)))

  const ghostBtn: React.CSSProperties = { padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: 'var(--surface)', color: 'var(--text2)', border: '1px solid var(--border)' }

  return (
    <div
      style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)', position: 'relative' }}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: 'rgba(var(--accent-rgb, 99,102,241), 0.12)',
          border: '2px dashed var(--accent)',
          borderRadius: 12, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent-t)' }}>Drop .txt to import</p>
        </div>
      )}

      {/* Game banner */}
      <div style={{ position: 'relative', height: 180, flexShrink: 0, overflow: 'hidden' }}>
        <img src={`https://cdn.akamai.steamstatic.com/steam/apps/${selectedAppId}/header.jpg`} alt=""
          onError={e => (e.currentTarget as HTMLImageElement).style.display = 'none'}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,12,24,0.5) 0%, rgba(8,12,24,0.92) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,12,24,0.9) 0%, rgba(8,12,24,0.3) 100%)' }} />

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 36px 24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 10, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{gameName}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>AppID {selectedAppId}</span>
              {isCustom && <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 4, background: '#0d2510', color: '#4ade80', border: '1px solid #1a3a20' }}>CUSTOM</span>}
              {!hasOfficial && <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 4, background: 'var(--accent-b)', color: 'var(--accent-t)', border: '1px solid var(--border)' }}>NO OFFICIAL</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Undo/Redo */}
            <button onClick={undo} disabled={!history.length} title="Undo (Ctrl+Z)"
              style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: history.length ? 'var(--text2)' : 'var(--icon)', cursor: history.length ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: history.length ? 1 : 0.4 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.32"/></svg>
            </button>
            <button onClick={redo} disabled={!future.length} title="Redo (Ctrl+Y)"
              style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: future.length ? 'var(--text2)' : 'var(--icon)', cursor: future.length ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: future.length ? 1 : 0.4 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-3.32"/></svg>
            </button>
            <button onClick={toggleAutoSave}
              style={{ padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: `1px solid ${autoSave ? 'var(--accent)' : 'var(--border)'}`, background: autoSave ? 'var(--accent-b)' : 'var(--surface)', color: autoSave ? 'var(--accent-t)' : 'var(--text2)' }}>
              {autoSave ? '● Auto-save' : 'Auto-save'}
            </button>
            <button onClick={() => { if (window.confirm('Reset all parameters to the official values? This cannot be undone.')) reset().catch(() => addToast('Failed to reset profile.')) }}
              style={{ padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--icon)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)' }}>
              Reset
            </button>
            <button onClick={() => save().catch(() => addToast('Failed to save profile.'))} disabled={!isDirty}
              style={{ padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: isDirty ? 'pointer' : 'not-allowed', border: 'none', background: isDirty ? 'var(--accent)' : 'var(--border)', color: isDirty ? '#fff' : 'var(--muted)', boxShadow: isDirty ? '0 4px 20px var(--glow)' : 'none', transition: 'all 0.15s' }}>
              Save
            </button>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'var(--border)' }} />
      </div>

      {!hasOfficial && (
        <div style={{ padding: '10px 36px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text2)' }}>
          No official profile — saving creates a custom one using default values.
        </div>
      )}

      {/* Params */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 36px' }}>
        <div style={{ maxWidth: 720 }}>

          {/* Presets + Copy row */}
          <div style={{ marginBottom: 24, padding: '16px 20px', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Presets</p>
              <button onClick={() => setCopyModal(true)}
                style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-t)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy from game…
              </button>
            </div>
            <PresetsPanel currentParams={paramVals} onApply={applyPreset} />
          </div>

          {/* Speed curve + Notes toggles */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <button onClick={() => setShowCurve(s => !s)}
              style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, background: showCurve ? 'var(--accent-b)' : 'var(--surface)', border: `1px solid ${showCurve ? 'var(--accent)' : 'var(--border)'}`, color: showCurve ? 'var(--accent-t)' : 'var(--text2)', cursor: 'pointer' }}>
              Speed Curve
            </button>
            <button onClick={() => setShowNotes(s => !s)}
              style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, background: showNotes ? 'var(--accent-b)' : 'var(--surface)', border: `1px solid ${showNotes ? 'var(--accent)' : 'var(--border)'}`, color: showNotes ? 'var(--accent-t)' : 'var(--text2)', cursor: 'pointer' }}>
              Notes {note ? '●' : ''}
            </button>
          </div>

          {showCurve && (
            <div style={{ marginBottom: 20, padding: '16px 20px', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)' }}>
              <SpeedCurveChart profile={paramVals} />
            </div>
          )}

          {showNotes && (
            <div style={{ marginBottom: 20 }}>
              <textarea
                value={note}
                onChange={e => setNote(selectedAppId, e.target.value)}
                placeholder="Add notes for this game's profile…"
                rows={3}
                style={{ width: '100%', padding: '12px 16px', fontSize: 13, borderRadius: 12, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          )}

          {/* Param rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {PARAMS.map(({ key, label, min, max, step, description }) => {
              const value    = editedProfile[key as keyof Profile] as number
              const official = officialProfile[key as keyof Profile] as number
              const changed  = value !== official

              return (
                <div key={key} style={{ paddingLeft: 16, borderLeft: `2px solid ${changed ? 'var(--accent)' : 'var(--border)'}`, transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: changed ? 'var(--accent-t)' : 'var(--text)' }}>{label}</span>
                        {key === 'maxspeed' && value === 0 && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'var(--input)', color: 'var(--muted)', border: '1px solid var(--border)' }}>Disabled</span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--muted)' }}>{description}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 20 }}>
                      {/* Per-param reset */}
                      {changed && (
                        <button
                          onClick={() => updateParam(key as keyof Profile, official)}
                          title={`Reset to official (${official})`}
                          style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-t)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.32"/></svg>
                        </button>
                      )}
                      <input
                        type="number" value={value} min={min} max={max} step={step}
                        onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) updateParam(key as keyof Profile, Math.min(max, Math.max(min, v))) }}
                        style={{ width: 80, padding: '7px 10px', fontSize: 14, fontWeight: 600, textAlign: 'right', borderRadius: 8, background: 'var(--surface)', color: changed ? 'var(--accent-t)' : 'var(--text)', border: `1px solid ${changed ? 'var(--accent)' : 'var(--border)'}`, outline: 'none' }}
                      />
                    </div>
                  </div>

                  <input type="range" min={min} max={max} step={step} value={value}
                    onChange={e => updateParam(key as keyof Profile, parseFloat(e.target.value))}
                    style={{ width: '100%' }} />

                  {changed && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Official value: {official}</p>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 36px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={handleImport} style={ghostBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-t)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)' }}>Import .txt</button>
        <button onClick={handleExport} style={ghostBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-t)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)' }}>Export .txt</button>
        <button onClick={handleExportAll} style={ghostBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-t)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)' }}>Export All (.zip)</button>
        {isCustom && (
          <button onClick={handleDelete}
            style={{ ...ghostBtn, marginLeft: 'auto', color: '#f87171', borderColor: '#3a1010' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1a0a0a'; (e.currentTarget as HTMLElement).style.color = '#fca5a5' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLElement).style.color = '#f87171' }}>
            Delete Custom Profile
          </button>
        )}
      </div>

      {/* Import AppID modal */}
      {importModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, width: 380, boxShadow: '0 8px 60px var(--glow)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Enter Steam AppID</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>Which game should this profile be saved for?</p>
            <input autoFocus type="text" placeholder="e.g. 611660" value={importAppId}
              onChange={e => setImportAppId(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleImportConfirm() }}
              style={{ width: '100%', padding: '12px 16px', fontSize: 14, borderRadius: 10, background: 'var(--input)', color: 'var(--text)', border: '1px solid var(--border)', outline: 'none', marginBottom: 24 }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setImportModal(false); setPendingImport(null); setImportAppId('') }} style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--input)', border: 'none', color: 'var(--text2)', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleImportConfirm} disabled={!importAppId.trim()} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: importAppId.trim() ? 'pointer' : 'not-allowed', background: importAppId.trim() ? 'var(--accent)' : 'var(--border)', color: importAppId.trim() ? '#fff' : 'var(--muted)' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Copy from game modal */}
      {copyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, width: 420, maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 60px var(--glow)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Copy Params From Game</h2>
            <input autoFocus type="text" placeholder="Search games…" value={copySearch} onChange={e => setCopySearch(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', fontSize: 14, borderRadius: 10, background: 'var(--input)', color: 'var(--text)', border: '1px solid var(--border)', outline: 'none', marginBottom: 12 }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            <div style={{ flex: 1, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
              {copyFiltered.slice(0, 50).map(p => (
                <button key={p.appId} onClick={() => { applyPreset({ multiplier: p.profile.multiplier, minspeed: p.profile.minspeed, minrange: p.profile.minrange, maxrange: p.profile.maxrange, maxspeed: p.profile.maxspeed, omnicoupling: p.profile.omnicoupling }); setCopyModal(false); setCopySearch('') }}
                  style={{ display: 'block', width: '100%', padding: '12px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontSize: 14 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--input)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <span style={{ fontWeight: 600 }}>{p.gameName}</span>
                  <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--muted)' }}>#{p.appId}</span>
                </button>
              ))}
              {copyFiltered.length === 0 && <p style={{ padding: '20px 16px', fontSize: 13, color: 'var(--muted)' }}>No games found</p>}
            </div>
            <button onClick={() => { setCopyModal(false); setCopySearch('') }} style={{ marginTop: 16, padding: '10px', borderRadius: 10, background: 'var(--input)', border: 'none', color: 'var(--text2)', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
