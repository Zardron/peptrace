import { useEffect, useState } from 'react'
import './Leaderboards.css'
import LeaderboardCard from '../LeaderboardCard/LeaderboardCard'
import type { LeaderboardCardProps, LeaderboardRow } from '../LeaderboardCard/LeaderboardCard'
import StandardFilter, { getStandard, type StandardId } from '../StandardFilter/StandardFilter'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

interface LeaderboardRowData {
  vendorName: string
  pricePerMg: number | null
  rating: number | null
  purityPercent: number | null
}

interface LeaderboardCardData {
  peptideId: string
  productName: string
  slug: string
  testCount: number
  vendorCount: number
  lastUpdated: string | null
  rows: LeaderboardRowData[]
}

type RankBy = 'rating' | 'cost'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const formatDate = (iso: string | null): string => {
  const datePart = iso?.split('T')[0]
  if (!datePart) return '—'
  const [year, month, day] = datePart.split('-').map(Number)
  if (!year || !month || !day) return '—'
  return `${day} ${MONTHS[month - 1]} ${year}`
}

const toCardProps = (
  card: LeaderboardCardData,
  minPurity: number,
  rankBy: RankBy,
): LeaderboardCardProps => {
  const rows: LeaderboardRow[] = card.rows
    .filter((row) => (row.purityPercent ?? 0) >= minPurity)
    .sort((a, b) =>
      rankBy === 'rating'
        ? (b.rating ?? 0) - (a.rating ?? 0)
        : (a.pricePerMg ?? Number.MAX_VALUE) - (b.pricePerMg ?? Number.MAX_VALUE),
    )
    .slice(0, 8)
    .map((row, index) => ({
      rank: index + 1,
      vendorName: row.vendorName,
      pricePerMg: row.pricePerMg == null ? '—' : `$${Number(row.pricePerMg).toFixed(2)}`,
      rating: row.rating == null ? '—' : `${Math.round(row.rating * 100)}%`,
    }))
  return {
    productName: card.productName,
    testCount: `${card.testCount.toLocaleString('en-US')} tests`,
    vendorCount: `${card.vendorCount} Vendors`,
    lastUpdated: formatDate(card.lastUpdated),
    ctaText: `Submit your ${card.productName} for free testing`,
    rows,
    totalVendors: `${card.vendorCount} Vendors`,
    leaderboardHref: `/product/${card.slug}/leaderboard`,
  }
}

// StrictMode double-mounts components in dev and the home page can remount on
// navigation; share one in-flight request (and its resolved result) across
// mounts so only one call hits the API. Failures reset so a remount retries.
let leaderboardsPromise: Promise<LeaderboardCardData[]> | null = null

const fetchLeaderboards = (): Promise<LeaderboardCardData[]> => {
  leaderboardsPromise ??= fetch(`${API_BASE}/leaderboards`)
    .then((res) => {
      if (!res.ok) throw new Error('Request failed')
      return res.json()
    })
    .then((data) => (data.cards ?? []) as LeaderboardCardData[])
    .catch((err) => {
      leaderboardsPromise = null
      throw err
    })
  return leaderboardsPromise
}

export default function Leaderboards() {
  const [cards, setCards] = useState<LeaderboardCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [standardId, setStandardId] = useState<StandardId>('purity-focus')
  const [rankBy, setRankBy] = useState<RankBy>('rating')

  useEffect(() => {
    let cancelled = false
    fetchLeaderboards()
      .then((list) => {
        if (cancelled) return
        setCards(list)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('Could not load leaderboards. Please try again later.')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const standard = getStandard(standardId)

  return (
    <section className="leaderboards">
      <div className="leaderboards-header">
        <h2 className="section-title">Leaderboards</h2>
        <div className="section-tabs">
          <button type="button" className="tab active">all peptides</button>
          <a href="/vendors" className="tab">all vendors</a>
        </div>
      </div>

      <div className="filter-bar">
        <StandardFilter value={standardId} onChange={setStandardId} />
        <div className="filter-right">
          <span className="filter-label">Rank by</span>
          <div className="toggle">
            <button
              type="button"
              className={`toggle-option${rankBy === 'rating' ? ' active' : ''}`}
              onClick={() => setRankBy('rating')}
            >
              rating
            </button>
            <button
              type="button"
              className={`toggle-option${rankBy === 'cost' ? ' active' : ''}`}
              onClick={() => setRankBy('cost')}
            >
              $ / mg
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="leaderboards-status">Loading leaderboards…</p>
      ) : error ? (
        <p className="leaderboards-status">{error}</p>
      ) : cards.length === 0 ? (
        <p className="leaderboards-status">No leaderboard data yet.</p>
      ) : (
        <div className="boards-grid">
          {cards.map((card) => (
            <LeaderboardCard
              key={card.peptideId}
              {...toCardProps(card, standard.minPurity, rankBy)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
