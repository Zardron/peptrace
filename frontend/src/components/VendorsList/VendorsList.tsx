import { useEffect, useRef, useState } from 'react'
import './VendorsList.css'
import searchIcon from '../../assets/vendors/search.svg'
import chevronDown from '../../assets/vendors/chevron-down.svg'

interface Vendor {
  id: string
  name: string
  score: number | null
  cost_per_mg: number | null
  location: string | null
  tests_count: number | null
  products_count: number | null
  latest_tested_at: string | null
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const PURITY_OPTIONS = [
  { id: 'p995', label: 'Purity focus', badge: 'purity 99.5%+', minScore: 85 },
  { id: 'p99', label: 'Purity focus', badge: 'purity 99.0%+', minScore: 70 },
  { id: 'all', label: 'All vendors', badge: null, minScore: 0 },
] as const

type PurityId = (typeof PURITY_OPTIONS)[number]['id']
type RankBy = 'rating' | 'cost'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const formatLatest = (iso: string | null): string => {
  if (!iso) return '—'
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return '—'
  return `${day} ${MONTHS[month - 1]} ${year}`
}

const formatCost = (cost: number | null): string =>
  cost == null ? '—' : `$${Number(cost).toFixed(2)}/mg`

export default function VendorsList() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [purityId, setPurityId] = useState<PurityId>('p99')
  const [menuOpen, setMenuOpen] = useState(false)
  const [rankBy, setRankBy] = useState<RankBy>('rating')
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE}/vendors`)
      .then((res) => {
        if (!res.ok) throw new Error('Request failed')
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setVendors(data.vendors ?? [])
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('Could not load vendors. Please try again later.')
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
  const search = query.trim().toLowerCase()
  const rows = vendors
    .filter((vendor) => (vendor.score ?? 0) >= purity.minScore)
    .filter(
      (vendor) =>
        !search ||
        vendor.name.toLowerCase().includes(search) ||
        (vendor.location ?? '').toLowerCase().includes(search),
    )
    .sort((a, b) =>
      rankBy === 'rating'
        ? (b.score ?? 0) - (a.score ?? 0)
        : (a.cost_per_mg ?? Number.MAX_VALUE) - (b.cost_per_mg ?? Number.MAX_VALUE),
    )

  return (
    <div className="vendors-list">
      <div className="vendors-list-inner">
        <div className="vendors-title-area">
          <h1 className="vendors-title">Vendors</h1>
          <p className="vendors-subtitle">
            {rows.length} of {vendors.length} vendors · total score by Purity focus
          </p>
        </div>

        <div className="vendors-toolbar">
          <div className="vendors-toolbar-left">
            <div className="vendors-search">
              <img src={searchIcon} alt="" className="vendors-search-icon" />
              <input
                type="text"
                className="vendors-search-input"
                placeholder="Search vendor or location"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
          <a href="/methodology" className="vendors-methodology">
            methodology →
          </a>
        </div>

        <div className="vendors-filter-bar">
          <div className="vendors-filter" ref={filterRef}>
            <button
              type="button"
              className="vendors-filter-trigger"
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="vendors-filter-label">{purity.label}</span>
              {purity.badge ? <span className="vendors-filter-badge">{purity.badge}</span> : null}
              <img
                src={chevronDown}
                alt=""
                className={`vendors-filter-chevron${menuOpen ? ' open' : ''}`}
              />
            </button>
            {menuOpen ? (
              <div className="vendors-filter-menu" role="listbox" aria-label="Purity focus">
                {PURITY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={option.id === purityId}
                    className={`vendors-filter-option${option.id === purityId ? ' active' : ''}`}
                    onClick={() => {
                      setPurityId(option.id)
                      setMenuOpen(false)
                    }}
                  >
                    <span className="vendors-filter-option-label">{option.label}</span>
                    {option.badge ? (
                      <span className="vendors-filter-badge">{option.badge}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="vendors-rank">
            <span className="vendors-rank-label">Rank by</span>
            <div className="vendors-rank-toggle">
              <button
                type="button"
                className={`vendors-rank-option${rankBy === 'rating' ? ' active' : ''}`}
                onClick={() => setRankBy('rating')}
              >
                rating
              </button>
              <button
                type="button"
                className={`vendors-rank-option${rankBy === 'cost' ? ' active' : ''}`}
                onClick={() => setRankBy('cost')}
              >
                $ / mg
              </button>
            </div>
          </div>
        </div>

        <div className="vendors-table-wrap">
          <div className="vendors-table">
            <div className="vendors-table-header">
              <span className="col-num">#</span>
              <span className="col-vendor">VENDOR</span>
              <span className="col-score">SCORE</span>
              <span className="col-cost">COST</span>
              <span className="col-tests">TESTS</span>
              <span className="col-products">PRODUCTS</span>
              <span className="col-latest">LATEST</span>
              <span className="col-location">LOCATION</span>
            </div>
            {loading ? (
              <div className="vendors-table-status">Loading vendors…</div>
            ) : error ? (
              <div className="vendors-table-status">{error}</div>
            ) : rows.length === 0 ? (
              <div className="vendors-table-status">No vendors match your filters.</div>
            ) : (
              rows.map((row, index) => (
                <a key={row.id} href={`/vendors/${row.id}`} className="vendors-table-row">
                  <span className="col-num">{index + 1}</span>
                  <span className="col-vendor">
                    <span className="vendor-avatar" />
                    <span className="vendor-name">{row.name}</span>
                  </span>
                  <span className="col-score">
                    <span className="score-badge">{row.score ?? '—'}%</span>
                  </span>
                  <span className="col-cost">{formatCost(row.cost_per_mg)}</span>
                  <span className="col-tests">{row.tests_count ?? '—'}</span>
                  <span className="col-products">{row.products_count ?? '—'}</span>
                  <span className="col-latest">{formatLatest(row.latest_tested_at)}</span>
                  <span className="col-location">{row.location ?? '—'}</span>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
