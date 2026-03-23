import { useEffect, useState } from 'react'
import logo from '../assets/Logo256.png'

interface CheckItem {
  label: string
  detail: string
  detailFail: string
  status: 'checking' | 'ok' | 'warn'
}

export default function FirstRunWizard({ onComplete }: { onComplete: () => void }): JSX.Element {
  const [omni, setOmni] = useState<'checking' | 'ok' | 'warn'>('checking')
  const [vr, setVr] = useState<'checking' | 'ok' | 'warn'>('checking')
  const [autoStart, setAutoStart] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    window.api.checkOmniConnect().then(ok => setOmni(ok ? 'ok' : 'warn')).catch(() => setOmni('warn'))
    window.api.checkSteamVr().then(ok => setVr(ok ? 'ok' : 'warn')).catch(() => setVr('warn'))
  }, [])

  async function handleComplete(): Promise<void> {
    setCompleting(true)
    try {
      await window.api.setAutoStart(autoStart)
      await window.api.completeFirstRun()
    } catch {}
    onComplete()
  }

  const checks: CheckItem[] = [
    {
      label: 'OmniConnect',
      detail: 'Detected — game profiles loaded',
      detailFail: 'Not found — install Virtuix OmniConnect to see your game profiles',
      status: omni,
    },
    {
      label: 'SteamVR',
      detail: 'Running — VR overlay is available',
      detailFail: 'Not running — start SteamVR to use the VR overlay',
      status: vr,
    },
  ]

  const allChecked = omni !== 'checking' && vr !== 'checking'

  function StatusIcon({ status }: { status: 'checking' | 'ok' | 'warn' }): JSX.Element {
    if (status === 'checking') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      )
    }
    if (status === 'ok') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
        </svg>
      )
    }
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 24, padding: '40px 44px', width: 480,
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <img src={logo} alt="OmniTune" style={{ width: 52, height: 52, borderRadius: 14 }} />
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Welcome to OmniTune</p>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Let's make sure everything is set up</p>
          </div>
        </div>

        {/* Checks */}
        <div style={{ background: 'var(--bg)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 28 }}>
          {checks.map((c, i) => (
            <div key={c.label} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '16px 20px',
              borderBottom: i < checks.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ marginTop: 1, flexShrink: 0 }}>
                <StatusIcon status={c.status} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{c.label}</p>
                <p style={{ fontSize: 12, color: c.status === 'warn' ? '#fbbf24' : 'var(--muted)', lineHeight: 1.5 }}>
                  {c.status === 'checking' ? 'Checking…' : c.status === 'ok' ? c.detail : c.detailFail}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Start with Windows toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', background: 'var(--bg)', borderRadius: 12,
          border: '1px solid var(--border)', marginBottom: 28,
        }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Start with Windows</p>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>Launch OmniTune automatically when you log in</p>
          </div>
          <button
            onClick={() => setAutoStart(s => !s)}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              position: 'relative', flexShrink: 0,
              background: autoStart ? 'var(--accent)' : 'var(--input)', transition: 'background 0.2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
              left: autoStart ? 23 : 3,
            }} />
          </button>
        </div>

        {/* CTA */}
        <button
          onClick={handleComplete}
          disabled={!allChecked || completing}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            fontSize: 15, fontWeight: 700, cursor: allChecked && !completing ? 'pointer' : 'not-allowed',
            background: allChecked ? 'var(--accent)' : 'var(--border)',
            color: allChecked ? '#fff' : 'var(--muted)',
            boxShadow: allChecked ? '0 4px 24px var(--glow)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {!allChecked ? 'Checking…' : completing ? 'Starting…' : 'Get Started →'}
        </button>
      </div>
    </div>
  )
}
