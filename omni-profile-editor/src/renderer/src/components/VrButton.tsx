import { useAppStore } from '../store/useAppStore'

export default function VrButton(): JSX.Element {
  const { vrStatus, vrError, vrCurrentGameName } = useAppStore()

  async function handleStop(): Promise<void> {
    await window.api.vrStop()
  }

  async function handleReconnect(): Promise<void> {
    useAppStore.getState().setVrStatus('connecting')
    await window.api.vrReconnect()
  }

  if (vrStatus === 'active') {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleStop}
          className="px-3 py-1 text-xs rounded-lg transition-all"
          style={{ background: 'var(--accent-b)', color: 'var(--accent-t)', border: '1px solid var(--accent)', boxShadow: '0 0 10px var(--glow)' }}
        >
          ● In SteamVR — Stop
        </button>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {vrCurrentGameName ?? 'No game running'}
        </span>
      </div>
    )
  }

  if (vrStatus === 'waiting' || vrStatus === 'connecting') {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleStop}
          className="px-3 py-1 text-xs rounded-lg transition-all"
          style={{ background: 'var(--input)', color: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          {vrStatus === 'connecting' ? 'Connecting…' : '● Waiting for SteamVR'}
        </button>
        <button
          onClick={handleStop}
          className="text-xs"
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }}
        >
          Cancel
        </button>
      </div>
    )
  }

  if (vrStatus === 'off') {
    return (
      <button
        onClick={handleReconnect}
        className="px-3 py-1 text-xs rounded-lg transition-all"
        style={{ background: 'var(--surface)', color: 'var(--text2)', border: '1px solid var(--border)' }}
      >
        Reconnect to SteamVR
      </button>
    )
  }

  // error / unavailable
  return (
    <button
      onClick={handleReconnect}
      className="px-3 py-1 text-xs rounded-lg transition-all"
      style={{ background: '#2d0a0a', color: '#f87171', border: '1px solid #7f1d1d' }}
      title={vrError ?? undefined}
    >
      ⚠ Error — retry
    </button>
  )
}
