export default function WhatsNewModal({ version, notes, onDismiss }: {
  version: string
  notes: string[]
  onDismiss: () => void
}): JSX.Element {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, padding: '32px 36px', width: 460, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-t)', textTransform: 'uppercase', marginBottom: 8 }}>
            Updated to v{version}
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>What's New</h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notes.map((note, i) => {
              const isFixed = note.startsWith('Fixed:')
              const isAdded = note.startsWith('Added:')
              const tag = isFixed ? 'Fixed' : isAdded ? 'New' : null
              const text = tag ? note.slice(tag.length + 1).trim() : note
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {tag && (
                    <span style={{
                      flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 7px',
                      borderRadius: 4, marginTop: 2,
                      ...(isAdded
                        ? { background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }
                        : { background: 'var(--accent-b)', color: 'var(--accent-t)', border: '1px solid var(--border)' }),
                    }}>
                      {tag.toUpperCase()}
                    </span>
                  )}
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{text}</p>
                </div>
              )
            })}
          </div>
        </div>

        <button
          onClick={onDismiss}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            background: 'var(--accent)', color: '#fff',
            boxShadow: '0 4px 20px var(--glow)',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
