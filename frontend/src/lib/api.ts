const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
let csrfToken: string | null = null

export const setApiCsrfToken = (token: string | null | undefined) => {
  csrfToken = token || null
}

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const method = (options.method ?? 'GET').toUpperCase()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrfToken
        ? { 'X-CSRF-Token': csrfToken }
        : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Request failed (${res.status})`)
  }
  if (res.status === 204) return null
  return res.json()
}
