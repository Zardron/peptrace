import { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (token: string) => void
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
    localStorage.removeItem('peptrace_token')
    setUser(null)
    setIsLoading(false)
  }, [])

  const login = useCallback(
    async (token: string) => {
      localStorage.setItem('peptrace_token', token)
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          throw new Error('Invalid token')
        }
        const data = await res.json()
        setUser(data)
      } catch {
        logout()
      } finally {
        setIsLoading(false)
      }
    },
    [logout]
  )

  useEffect(() => {
    const token = localStorage.getItem('peptrace_token')
    if (token) {
      login(token)
    } else {
      setIsLoading(false)
    }
  }, [login])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
