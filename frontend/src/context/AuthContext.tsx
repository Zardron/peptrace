import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { apiFetch, setApiCsrfToken } from '../lib/api'

interface UserProfile {
  full_name: string | null
  organization: string | null
  role: string | null
  phone: string | null
  bio: string | null
  avatar_url: string | null
}

interface User {
  id: string
  email: string
  name: string
  memberSince?: string
  profile?: UserProfile | null
}

interface LoginResult {
  isNewAccount: boolean
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (csrfToken?: string) => Promise<LoginResult | null>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    void apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined)
    void supabase.auth.signOut({ scope: 'local' })
    localStorage.removeItem('peptrace.auth_token')
    setApiCsrfToken(null)
    setUser(null)
    setIsLoading(false)
  }, [])

  const login = useCallback(
    async (csrfToken?: string): Promise<LoginResult | null> => {
      if (csrfToken) setApiCsrfToken(csrfToken)
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',
        })
        if (!res.ok) {
          throw new Error('Invalid token')
        }
        const data = await res.json()
        setApiCsrfToken(data.csrfToken)
        setUser(data)
        return { isNewAccount: Boolean(data.isNewAccount) }
      } catch {
        setApiCsrfToken(null)
        setUser(null)
        return null
      }
    },
    []
  )

  useEffect(() => {
    let cancelled = false
    localStorage.removeItem('peptrace.auth_token')
    const restore = async () => {
      if (await login()) return
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || cancelled) return
      const exchange = await fetch(`${API_BASE}/auth/exchange`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!exchange.ok || cancelled) return
      const payload = await exchange.json()
      setApiCsrfToken(payload.csrfToken)
      await supabase.auth.signOut({ scope: 'local' })
      if (!cancelled) await login(payload.csrfToken)
    }
    void restore().finally(() => {
      if (!cancelled) setIsLoading(false)
    })
    return () => { cancelled = true }
  }, [login])

  const refresh = useCallback(async () => {
    await login()
  }, [login])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
