import { supabase } from './supabase'
import { getStoredToken } from './authToken'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const token =
    getStoredToken() ??
    (await supabase.auth.getSession()).data.session?.access_token
  if (!token) {
    throw new Error('Not signed in')
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Request failed (${res.status})`)
  }
  return res.json()
}
