import { lsGet, lsSet } from './localStorage'

export function getFavorites(): Set<string> {
  return new Set(lsGet<string[]>('favorites', []))
}

export function toggleFavorite(appId: string): Set<string> {
  const list = lsGet<string[]>('favorites', [])
  const next = list.includes(appId) ? list.filter(id => id !== appId) : [...list, appId]
  lsSet('favorites', next)
  return new Set(next)
}

export function getRecentlyEdited(): string[] {
  return lsGet<string[]>('recentlyEdited', [])
}

export function pushRecentlyEdited(appId: string): string[] {
  const curr = lsGet<string[]>('recentlyEdited', [])
  const next = [appId, ...curr.filter(id => id !== appId)].slice(0, 5)
  lsSet('recentlyEdited', next)
  return next
}
