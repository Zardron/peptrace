import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getStoredToken, storeToken, clearStoredToken, isNativeToken } from '../lib/authToken'

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
  login: (token: string) => Promise<LoginResult | null>
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
    clearStoredToken()
    void supabase.auth.signOut()
    setUser(null)
    setIsLoading(false)
  }, [])

  const login = useCallback(
    async (token: string): Promise<LoginResult | null> => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          throw new Error('Invalid token')
        }
        const data = await res.json()
        setUser(data)
        // Supabase sessions are persisted by the supabase client; native
        // session tokens are ours to keep.
        if (isNativeToken(token)) {
          storeToken(token)
        }
        return { isNewAccount: Boolean(data.isNewAccount) }
      } catch {
        logout()
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [logout]
  )

  useEffect(() => {
    const stored = getStoredToken()
    if (stored) {
      void login(stored)
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        void login(session.access_token)
      } else {
        setIsLoading(false)
      }
    })
  }, [login])

  const refresh = useCallback(async () => {
    const stored = getStoredToken()
    if (stored) {
      await login(stored)
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await login(session.access_token)
    }
  }, [login])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
