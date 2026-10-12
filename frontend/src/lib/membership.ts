import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from './api'

export type MembershipTone = 'muted' | 'member' | 'gold'

export const TONE_RANK: Record<MembershipTone, number> = { muted: 0, member: 1, gold: 2 }

const PLAN_TONE: Record<string, MembershipTone> = { free: 'muted', member: 'member', gold: 'gold' }

// The signed-in user's real plan, defaulting to free until the account loads.
export function useMembership() {
  const { user } = useAuth()
  const [tone, setTone] = useState<MembershipTone>('muted')
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setTone('muted')
      return
    }
    setLoading(true)
    try {
      const data = await apiFetch('/account/billing')
      setTone(PLAN_TONE[data.plan] ?? 'muted')
    } catch {
      setTone('muted')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { tone, loading, refresh }
}
