import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  name: string
}

interface LoginResult {
  isNewAccount: boolean
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (token: string) => Promise<LoginResult | null>
  logout: () => void
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        void login(session.access_token)
      } else {
        setIsLoading(false)
      }
    })
  }, [login])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
