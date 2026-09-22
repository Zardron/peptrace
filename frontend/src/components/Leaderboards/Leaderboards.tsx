import { useEffect, useRef, useState } from 'react'
import './Leaderboards.css'
import LeaderboardCard from '../LeaderboardCard/LeaderboardCard'
import type { LeaderboardCardProps, LeaderboardRow } from '../LeaderboardCard/LeaderboardCard'

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

const PURITY_OPTIONS = [
  { id: 'p995', label: 'Purity Focused', badges: ['purity 99.5%+'], minPurity: 99.5 },
  { id: 'p99', label: 'Purity Focused', badges: ['purity 99.0%+'], minPurity: 99.0 },
  { id: 'all', label: 'All vendors', badges: [] as string[], minPurity: 0 },
] as const

type PurityId = (typeof PURITY_OPTIONS)[number]['id']
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
  const [purityId, setPurityId] = useState<PurityId>('p99')
  const [rankBy, setRankBy] = useState<RankBy>('rating')
  const [menuOpen, setMenuOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!menuOpen) return undefined
    const handleMouseDown = (event: MouseEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  const purity = PURITY_OPTIONS.find((option) => option.id === purityId) ?? PURITY_OPTIONS[0]

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
        <div className="filter-dropdown" ref={filterRef}>
          <button
            type="button"
            className="filter-left filter-trigger"
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="filter-label">{purity.label}</span>
            {purity.badges.map((badge) => (
              <span key={badge} className="filter-badge">{badge}</span>
            ))}
            <svg
              className={`filter-chevron${menuOpen ? ' open' : ''}`}
              width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M1 1L6 6L11 1" stroke="#7e7e7e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {menuOpen ? (
            <div className="filter-menu" role="listbox" aria-label="Purity filter">
              {PURITY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={option.id === purityId}
                  className={`filter-menu-option${option.id === purityId ? ' active' : ''}`}
                  onClick={() => {
                    setPurityId(option.id)
                    setMenuOpen(false)
                  }}
                >
                  <span className="filter-menu-option-label">{option.label}</span>
                  {option.badges.map((badge) => (
                    <span key={badge} className="filter-badge">{badge}</span>
                  ))}
                </button>
              ))}
            </div>
          ) : null}
        </div>
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
              {...toCardProps(card, purity.minPurity, rankBy)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
