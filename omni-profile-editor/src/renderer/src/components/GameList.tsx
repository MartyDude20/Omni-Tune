import { useEffect, useRef, useState } from 'react'
import { useAppStore, type FilterMode } from '../store/useAppStore'
import type { ProfileEntry } from '../types/api'

type ViewMode = 'list' | 'grid' | 'icons'

// ─── Card components ────────────────────────────────────────────────────────

function StarBtn({ appId }: { appId: string }): JSX.Element {
  const { favorites, toggleFav } = useAppStore()
  const isFav = favorites.has(appId)
  return (
    <button
      onClick={e => { e.stopPropagation(); toggleFav(appId) }}
      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: isFav ? '#f59e0b' : 'var(--icon)', lineHeight: 1, flexShrink: 0 }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </button>
  )
}

function ListCard({ entry, onClick }: { entry: ProfileEntry; onClick: () => void }): JSX.Element {
  const [imgFailed, setImgFailed] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 20, width: '100%', padding: '14px 20px', textAlign: 'left', cursor: 'pointer', background: hovered ? 'var(--surface)' : 'transparent', border: 'none', borderBottom: '1px solid var(--surface)', transition: 'background 0.15s' }}
    >
      <div style={{ width: 110, height: 62, flexShrink: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {!imgFailed ? (
          <img src={`https://cdn.akamai.steamstatic.com/steam/apps/${entry.appId}/capsule_231x87.jpg`} alt="" onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--input), var(--surface))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--icon)', fontSize: 14, fontWeight: 700 }}>
            {entry.gameName.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.gameName}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 4, ...(entry.isCustom ? { background: '#0d2510', color: '#4ade80', border: '1px solid #1a3a20' } : { background: 'var(--accent-b)', color: 'var(--accent-t)', border: '1px solid var(--border)' }) }}>
            {entry.isCustom ? 'CUSTOM' : 'OFFICIAL'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>#{entry.appId}</span>
        </div>
      </div>
      <StarBtn appId={entry.appId} />
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={hovered ? 'var(--accent)' : 'var(--icon)'} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, transition: 'stroke 0.15s' }}>
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  )
}

function GridCard({ entry, onClick }: { entry: ProfileEntry; onClick: () => void }): JSX.Element {
  const [imgSrc, setImgSrc] = useState(`https://cdn.akamai.steamstatic.com/steam/apps/${entry.appId}/library_600x900.jpg`)
  const [imgFailed, setImgFailed] = useState(false)
  const [hovered, setHovered] = useState(false)

  function handleError(): void {
    if (imgSrc.includes('library_600x900')) {
      setImgSrc(`https://cdn.akamai.steamstatic.com/steam/apps/${entry.appId}/header.jpg`)
    } else {
      setImgFailed(true)
    }
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', cursor: 'pointer', border: 'none', padding: 0, borderRadius: 10, overflow: 'hidden', background: 'var(--surface)', outline: hovered ? '2px solid var(--accent)' : '2px solid transparent', transition: 'outline-color 0.15s, transform 0.15s', transform: hovered ? 'scale(1.03)' : 'scale(1)', aspectRatio: imgSrc.includes('library_600x900') && !imgFailed ? '2/3' : '460/215' }}
    >
      {!imgFailed ? (
        <img src={imgSrc} alt="" onError={handleError} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', minHeight: 120, background: 'linear-gradient(135deg, var(--input), var(--surface))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--icon)', fontSize: 22, fontWeight: 700 }}>
          {entry.gameName.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)', padding: '28px 10px 10px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, textAlign: 'left', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {entry.gameName}
        </p>
      </div>
      {entry.isCustom && (
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 6px', borderRadius: 4, background: '#0d2510', color: '#4ade80', border: '1px solid #1a3a20' }}>CUSTOM</span>
        </div>
      )}
      <div style={{ position: 'absolute', top: 6, left: 6 }}>
        <StarBtn appId={entry.appId} />
      </div>
    </button>
  )
}

function IconCard({ entry, onClick }: { entry: ProfileEntry; onClick: () => void }): JSX.Element {
  const [imgFailed, setImgFailed] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`${entry.gameName} (#${entry.appId})`}
      style={{ position: 'relative', cursor: 'pointer', border: 'none', padding: 0, borderRadius: 10, overflow: 'hidden', background: 'var(--surface)', outline: hovered ? '2px solid var(--accent)' : '2px solid var(--border)', transition: 'outline-color 0.15s, transform 0.15s', transform: hovered ? 'scale(1.05)' : 'scale(1)', width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {!imgFailed ? (
        <img src={`https://cdn.akamai.steamstatic.com/steam/apps/${entry.appId}/capsule_231x87.jpg`} alt={entry.gameName} onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--input), var(--surface))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--icon)', fontSize: 18, fontWeight: 700 }}>
          {entry.gameName.slice(0, 2).toUpperCase()}
        </div>
      )}
      {entry.isCustom && (
        <div style={{ position: 'absolute', bottom: 3, right: 3, width: 8, height: 8, borderRadius: '50%', background: '#4ade80', border: '1px solid #0d2510' }} title="Custom profile" />
      )}
    </button>
  )
}

// ─── Section heading ─────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }): JSX.Element {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase', padding: '16px 20px 8px' }}>
      {label}
    </p>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GameList(): JSX.Element {
  const { profiles, setProfiles, selectGame, favorites, recentlyEdited, filterMode, setFilterMode } = useAppStore()
  const [search, setSearch] = useState('')
  const [sortAsc, setSortAsc] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [newModal, setNewModal] = useState(false)
  const [newAppId, setNewAppId] = useState('')
  const [newLookingUp, setNewLookingUp] = useState(false)
  const [newGameName, setNewGameName] = useState('')
  const newInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { window.api.scanProfiles().then(setProfiles).catch(() => {}) }, [])
  useEffect(() => {
    const unsub = window.api.onProfilesChanged(async () => {
      window.api.scanProfiles().then(setProfiles).catch(() => {})
    })
    return unsub
  }, [])
  useEffect(() => { if (newModal) { newInputRef.current?.focus(); setNewGameName('') } }, [newModal])

  // Lookup Steam name when AppID changes
  useEffect(() => {
    if (!newAppId.trim() || !/^\d+$/.test(newAppId.trim())) { setNewGameName(''); return }
    setNewLookingUp(true)
    const t = setTimeout(async () => {
      try {
        const entry = await window.api.loadProfile(newAppId.trim())
        setNewGameName(entry.gameName !== `Unknown Game (${newAppId.trim()})` ? entry.gameName : '')
      } catch {
        setNewGameName('')
      } finally {
        setNewLookingUp(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [newAppId])

  const allFiltered = profiles
    .filter(p => {
      if (filterMode === 'custom' && !p.isCustom) return false
      if (filterMode === 'official' && p.isCustom) return false
      const q = search.toLowerCase()
      return p.gameName.toLowerCase().includes(q) || p.profile.game.toLowerCase().includes(q) || p.appId.includes(q)
    })
    .sort((a, b) => sortAsc ? a.gameName.localeCompare(b.gameName) : b.gameName.localeCompare(a.gameName))

  const favEntries = filterMode === 'all' && !search
    ? allFiltered.filter(p => favorites.has(p.appId))
    : []
  const recentEntries = filterMode === 'all' && !search
    ? recentlyEdited.map(id => profiles.find(p => p.appId === id)).filter(Boolean) as ProfileEntry[]
    : []
  const mainEntries = filterMode === 'all' && !search
    ? allFiltered.filter(p => !favorites.has(p.appId))
    : allFiltered

  async function handleCreate(): Promise<void> {
    const appId = newAppId.trim()
    if (!appId) return
    await window.api.saveProfile(appId, { game: '', multiplier: 1, minspeed: 0, minrange: 0, maxrange: 1, maxspeed: 0, omnicoupling: 0.7 })
    setProfiles(await window.api.scanProfiles())
    setNewAppId(''); setNewModal(false)
    selectGame(appId)
  }

  const iconBtn: React.CSSProperties = { width: 36, height: 36, borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const iconBtnActive: React.CSSProperties = { ...iconBtn, color: 'var(--accent)', background: 'var(--accent-b)' }

  const filterBtns: { mode: FilterMode; label: string }[] = [
    { mode: 'all', label: 'All' },
    { mode: 'custom', label: 'Custom' },
    { mode: 'official', label: 'Official' },
  ]

  function renderCards(entries: ProfileEntry[], gridCols: string): JSX.Element {
    if (viewMode === 'list') {
      return <>{entries.map(e => <ListCard key={e.appId} entry={e} onClick={() => selectGame(e.appId)} />)}</>
    }
    if (viewMode === 'icons') {
      return (
        <div style={{ padding: '8px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 8 }}>
          {entries.map(e => <IconCard key={e.appId} entry={e} onClick={() => selectGame(e.appId)} />)}
        </div>
      )
    }
    return (
      <div style={{ padding: '8px 20px', display: 'grid', gridTemplateColumns: gridCols, gap: 12 }}>
        {entries.map(e => <GridCard key={e.appId} entry={e} onClick={() => selectGame(e.appId)} />)}
      </div>
    )
  }

  const isEmpty = allFiltered.length === 0

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ padding: '32px 36px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, marginBottom: 6 }}>Game Library</h1>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>{profiles.length} games</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => window.api.scanProfiles().then(setProfiles)} style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Refresh"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-t)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.32"/></svg>
            </button>
            <button onClick={() => setNewModal(true)} style={{ height: 40, padding: '0 20px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 20px var(--glow)', display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-h)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent)'}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Profile
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {filterBtns.map(({ mode, label }) => (
            <button key={mode} onClick={() => setFilterMode(mode)}
              style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: filterMode === mode ? 'var(--accent)' : 'var(--surface)', color: filterMode === mode ? '#fff' : 'var(--text2)', transition: 'all 0.15s' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Search + sort + view toggle */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search games..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 16px 10px 44px', fontSize: 14, borderRadius: 10, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <button onClick={() => setSortAsc(s => !s)}
            style={{ padding: '0 16px', height: 42, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-t)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)' }}>
            {sortAsc ? 'A → Z' : 'Z → A'}
          </button>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
            <button onClick={() => setViewMode('list')} title="List view" style={viewMode === 'list' ? iconBtnActive : iconBtn}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="3" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
            </button>
            <button onClick={() => setViewMode('grid')} title="Grid view" style={viewMode === 'grid' ? iconBtnActive : iconBtn}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </button>
            <button onClick={() => setViewMode('icons')} title="Icon view" style={viewMode === 'icons' ? iconBtnActive : iconBtn}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="4" height="4" rx="1"/><rect x="10" y="2" width="4" height="4" rx="1"/><rect x="18" y="2" width="4" height="4" rx="1"/><rect x="2" y="10" width="4" height="4" rx="1"/><rect x="10" y="10" width="4" height="4" rx="1"/><rect x="18" y="10" width="4" height="4" rx="1"/><rect x="2" y="18" width="4" height="4" rx="1"/><rect x="10" y="18" width="4" height="4" rx="1"/><rect x="18" y="18" width="4" height="4" rx="1"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isEmpty && profiles.length === 0 && !search && filterMode === 'all' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: '0 40px', textAlign: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 21V9"/></svg>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>No game profiles found</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
              Make sure the Virtuix OmniConnect software is installed.<br />
              Profiles are read from:<br />
              <code style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'monospace' }}>C:\ProgramData\Virtuix\OmniConnect\GameProfile</code>
            </p>
          </div>
        )}
        {isEmpty && (profiles.length > 0 || search || filterMode !== 'all') && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>No games found</p>
          </div>
        )}

        {!isEmpty && (
          <>
            {/* Favorites section */}
            {favEntries.length > 0 && (
              <>
                <SectionLabel label="Favorites" />
                {renderCards(favEntries, 'repeat(auto-fill, minmax(150px, 1fr))')}
              </>
            )}

            {/* Recently edited section */}
            {recentEntries.length > 0 && (
              <>
                <SectionLabel label="Recently Edited" />
                {renderCards(recentEntries, 'repeat(auto-fill, minmax(150px, 1fr))')}
              </>
            )}

            {/* Main list */}
            {(favEntries.length > 0 || recentEntries.length > 0) && mainEntries.length > 0 && (
              <SectionLabel label="All Games" />
            )}
            {renderCards(mainEntries, 'repeat(auto-fill, minmax(150px, 1fr))')}
          </>
        )}

        <div style={{ height: 24 }} />
      </div>

      {/* New Profile modal */}
      {newModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, width: 380, boxShadow: '0 8px 60px var(--glow)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>New Profile</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>Enter the Steam AppID for the game.</p>
            <input ref={newInputRef} type="text" placeholder="e.g. 611660" value={newAppId}
              onChange={e => setNewAppId(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
              style={{ width: '100%', padding: '12px 16px', fontSize: 14, borderRadius: 10, background: 'var(--input)', color: 'var(--text)', border: '1px solid var(--border)', outline: 'none', marginBottom: 10 }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            {newAppId.trim() && (
              <p style={{ fontSize: 12, color: newLookingUp ? 'var(--muted)' : newGameName ? 'var(--accent-t)' : 'var(--muted)', marginBottom: 20 }}>
                {newLookingUp ? 'Looking up…' : newGameName ? `Found: ${newGameName}` : 'Game name not found locally'}
              </p>
            )}
            {!newAppId.trim() && <div style={{ marginBottom: 20 }} />}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setNewModal(false); setNewAppId('') }} style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--input)', border: 'none', color: 'var(--text2)', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreate} disabled={!newAppId.trim()}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: newAppId.trim() ? 'pointer' : 'not-allowed', background: newAppId.trim() ? 'var(--accent)' : 'var(--border)', color: newAppId.trim() ? '#fff' : 'var(--muted)', boxShadow: newAppId.trim() ? '0 4px 16px var(--glow)' : 'none' }}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
