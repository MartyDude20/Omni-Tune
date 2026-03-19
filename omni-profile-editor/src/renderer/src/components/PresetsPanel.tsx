import { useState } from 'react'
import { usePresetsStore } from '../store/usePresetsStore'
import type { Profile } from '../types/api'

interface PresetsPanelProps {
  currentParams: Omit<Profile, 'game'>
  onApply: (params: Omit<Profile, 'game'>) => void
  compact?: boolean
}

export default function PresetsPanel({ currentParams, onApply, compact = false }: PresetsPanelProps): JSX.Element {
  const { presets, savePreset, deletePreset } = usePresetsStore()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')

  function handleSave(): void {
    const n = name.trim()
    if (!n) return
    savePreset(n, currentParams)
    setName('')
    setSaving(false)
  }

  const sz = compact ? { chip: '4px 10px', chipFs: 11, btn: '4px 12px', btnFs: 11 }
                     : { chip: '5px 12px', chipFs: 12, btn: '5px 14px', btnFs: 12 }

  return (
    <div>
      {presets.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {presets.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'stretch', borderRadius: 8, background: 'var(--accent-b)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <button
                onClick={() => onApply(p.params)}
                title={`Apply preset "${p.name}"`}
                style={{ padding: sz.chip, fontSize: sz.chipFs, fontWeight: 600, background: 'transparent', border: 'none', color: 'var(--accent-t)', cursor: 'pointer' }}
              >
                {p.name}
              </button>
              <button
                onClick={() => deletePreset(p.id)}
                title="Delete preset"
                style={{ padding: '4px 8px', fontSize: 14, background: 'transparent', border: 'none', borderLeft: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', lineHeight: 1 }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {saving ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            autoFocus
            placeholder="Preset name…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setSaving(false); setName('') } }}
            style={{ flex: 1, padding: '5px 10px', fontSize: 12, borderRadius: 8, background: 'var(--input)', color: 'var(--text)', border: '1px solid var(--border)', outline: 'none', minWidth: 0 }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed', background: name.trim() ? 'var(--accent)' : 'var(--border)', color: name.trim() ? '#fff' : 'var(--muted)', border: 'none', flexShrink: 0 }}
          >
            Save
          </button>
          <button
            onClick={() => { setSaving(false); setName('') }}
            style={{ padding: '5px 10px', borderRadius: 8, fontSize: 12, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', flexShrink: 0 }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setSaving(true)}
          style={{ padding: sz.btn, borderRadius: 8, fontSize: sz.btnFs, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-t)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)' }}
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>+</span>
          Save as Preset
        </button>
      )}
    </div>
  )
}
