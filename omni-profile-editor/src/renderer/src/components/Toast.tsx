import { useToastStore } from '../store/useToastStore'

export default function Toast(): JSX.Element {
  const { toasts, removeToast } = useToastStore()

  if (!toasts.length) return <></>

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', borderRadius: 10, minWidth: 280, maxWidth: 420,
          background: t.type === 'error' ? '#2d0a0a' : '#0d2510',
          border: `1px solid ${t.type === 'error' ? '#7f1d1d' : '#1a3a20'}`,
          color: t.type === 'error' ? '#f87171' : '#4ade80',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          pointerEvents: 'all',
        }}>
          <span style={{ fontSize: 15, flexShrink: 0 }}>{t.type === 'error' ? '⚠' : '✓'}</span>
          <span style={{ fontSize: 13, flex: 1, lineHeight: 1.4 }}>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0 }}
          >×</button>
        </div>
      ))}
    </div>
  )
}
