import { useEffect, useState } from 'react'
import './VendorsList.css'
import searchIcon from '../../assets/vendors/search.svg'
import StandardFilter, { getStandard, type StandardId } from '../StandardFilter/StandardFilter'

interface Vendor {
  id: string
  name: string
  score: number | null
  cost_per_mg: number | null
  location: string | null
  tests_count: number | null
  products_count: number | null
  latest_tested_at: string | null
  ratingsByStandard?: Partial<Record<StandardId, {
    rating: number | null
    testCount: number
    productsCount: number
    latestTestedAt: string | null
  }>>
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

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
  const [standardId, setStandardId] = useState<StandardId>('purity-focus')
  const [rankBy, setRankBy] = useState<RankBy>('rating')

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

  const standard = getStandard(standardId)
  const search = query.trim().toLowerCase()
  const rows = vendors
    .map((vendor) => ({
      ...vendor,
      methodology: vendor.ratingsByStandard?.[standardId] ?? null,
    }))
    .filter((vendor) => standardId === 'all' || vendor.methodology?.rating != null)
    .filter(
      (vendor) =>
        !search ||
        vendor.name.toLowerCase().includes(search) ||
        (vendor.location ?? '').toLowerCase().includes(search),
    )
    .sort((a, b) =>
      rankBy === 'rating'
        ? (b.methodology?.rating ?? b.score ?? 0) - (a.methodology?.rating ?? a.score ?? 0)
        : (a.cost_per_mg ?? Number.MAX_VALUE) - (b.cost_per_mg ?? Number.MAX_VALUE),
    )

  return (
    <div className="vendors-list">
      <div className="vendors-list-inner">
        <div className="vendors-title-area">
          <h1 className="vendors-title">Vendors</h1>
          <p className="vendors-subtitle">
            {rows.length} of {vendors.length} vendors · {standard.label} rating
          </p>
          <a href="/vendor-signup" className="vendors-register-link">Are you a vendor? Register your business →</a>
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
          <StandardFilter value={standardId} onChange={setStandardId} allLabel="All vendors" />

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
                    <span className="score-badge">{row.methodology?.rating ?? (standardId === 'all' ? row.score : null) ?? '—'}%</span>
                  </span>
                  <span className="col-cost">{formatCost(row.cost_per_mg)}</span>
                    <span className="col-tests">{row.methodology?.testCount ?? (standardId === 'all' ? row.tests_count : null) ?? '—'}</span>
                    <span className="col-products">{row.methodology?.productsCount ?? (standardId === 'all' ? row.products_count : null) ?? '—'}</span>
                    <span className="col-latest">{formatLatest(row.methodology?.latestTestedAt ?? (standardId === 'all' ? row.latest_tested_at : null) ?? null)}</span>
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
