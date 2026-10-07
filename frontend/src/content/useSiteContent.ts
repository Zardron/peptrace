import { useEffect, useSyncExternalStore } from 'react'
import { defaultSiteContent, type SiteContent, type SiteContentKey } from './defaults'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

// One request per page load, shared by every component. Until it resolves, or
// if the API is unreachable, pages render the bundled defaults.
let overrides: Partial<Record<SiteContentKey, Record<string, unknown>>> = {}
let request: Promise<void> | null = null
const listeners = new Set<() => void>()

const loadSiteContent = () => {
  request ??= fetch(`${API_BASE}/content`)
    .then((res) => {
      if (!res.ok) throw new Error('Request failed')
      return res.json()
    })
    .then((data) => {
      overrides = data?.items && typeof data.items === 'object' ? data.items : {}
      listeners.forEach((listener) => listener())
    })
    .catch(() => {
      request = null
    })
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const cache = new Map<SiteContentKey, { source: unknown; value: unknown }>()

const snapshot = <K extends SiteContentKey>(key: K): SiteContent[K] => {
  const source = overrides[key]
  const cached = cache.get(key)
  if (cached && cached.source === source) return cached.value as SiteContent[K]
  const value = source ? { ...defaultSiteContent[key], ...source } : defaultSiteContent[key]
  cache.set(key, { source, value })
  return value as SiteContent[K]
}

export function useSiteContent<K extends SiteContentKey>(key: K): SiteContent[K] {
  useEffect(loadSiteContent, [])
  return useSyncExternalStore(subscribe, () => snapshot(key), () => defaultSiteContent[key])
}
