import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Not signed in')
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Request failed (${res.status})`)
  }
  return res.json()
}
