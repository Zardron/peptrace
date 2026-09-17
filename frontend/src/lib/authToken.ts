// Native session tokens (issued by our API, not Supabase Auth) are kept in
// localStorage so native users stay signed in across reloads. Supabase Auth
// sessions are managed by the supabase client itself.

const TOKEN_KEY = 'peptrace.auth_token'

export const getStoredToken = (): string | null => localStorage.getItem(TOKEN_KEY)

export const storeToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const clearStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

const decodePayload = (token: string): Record<string, unknown> | null => {
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

// Native tokens carry a `peptrace: 'native'` claim (see api/src/auth.ts).
export const isNativeToken = (token: string): boolean =>
  decodePayload(token)?.peptrace === 'native'
