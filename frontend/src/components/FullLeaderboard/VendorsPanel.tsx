import { useMemo, useState } from 'react'
import searchIcon from '../../assets/vendors/search.svg'
import chevronDown from '../../assets/vendors/chevron-down.svg'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faFileLines } from '@fortawesome/free-solid-svg-icons'

interface Vendor {
  rank: number
  name: string
  slug: string
  initials: string
  isVerified: boolean
  pricePerMg: number | null
  customerRating: number
  purityRating: number | null
  nCount: number
}

interface VendorsPanelProps {
  vendors: Vendor[]
}

const INITIALS_BG: Record<string, string> = {
  PP: '#e8f5f1',
  IP: '#f0e8f5',
  ZL: '#f5f0e8',
  BL: '#e8ecf5',
  PC: '#e8f5f1',
  SX: '#e8e8f5',
  NC: '#f5f5e8',
  GT: '#f5e8f0',
}

const INITIALS_COLOR: Record<string, string> = {
  PP: '#106e56',
  IP: '#6b21a8',
  ZL: '#9a3412',
  BL: '#1e3a8a',
  PC: '#106e56',
  SX: '#1e40af',
  NC: '#854d0e',
  GT: '#9d174d',
}

export default function VendorsPanel({ vendors }: VendorsPanelProps) {
  const [query, setQuery] = useState('')
  const [ratingSort, setRatingSort] = useState('Rating Sort')
  const [ratingFilter, setRatingFilter] = useState('Rating')
  const [priceFilter, setPriceFilter] = useState('Price')
  const [starsFilter, setStarsFilter] = useState('Customer')
  const [nFilter, setNFilter] = useState('N')

  const search = query.trim().toLowerCase()

  const rows = useMemo(() => {
    let result = vendors.filter((v) =>
      !search || v.name.toLowerCase().includes(search),
    )
    if (ratingSort === 'Rating: High to Low') {
      result = [...result].sort((a, b) => b.customerRating - a.customerRating)
    } else if (ratingSort === 'Rating: Low to High') {
      result = [...result].sort((a, b) => a.customerRating - b.customerRating)
    } else if (ratingSort === 'Price: Low to High') {
      result = [...result].sort((a, b) => (a.pricePerMg ?? Number.MAX_VALUE) - (b.pricePerMg ?? Number.MAX_VALUE))
    } else if (ratingSort === 'Price: High to Low') {
      result = [...result].sort((a, b) => (b.pricePerMg ?? -1) - (a.pricePerMg ?? -1))
    }
    return result
  }, [vendors, search, ratingSort])

  return (
    <div className="fl-vendors-panel">
      <div className="fl-vendors-header">
        <div className="fl-vendors-title-area">
          <h2 className="fl-vendors-title">Vendors</h2>
          <p className="fl-vendors-subtitle">Filter and compare verified suppliers</p>
        </div>
      </div>

      <div className="fl-vendors-toolbar">
        <div className="fl-vendors-search">
          <img src={searchIcon} alt="" className="fl-vendors-search-icon" />
          <input
            type="text"
            className="fl-vendors-search-input"
            placeholder="Search vendor..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="fl-vendors-filters">
          <FilterDropdown value={ratingSort} options={['Rating Sort', 'Rating: High to Low', 'Rating: Low to High', 'Price: Low to High', 'Price: High to Low']} onChange={setRatingSort} />
          <FilterDropdown value={ratingFilter} options={['Rating', '90%+', '80%+', '70%+']} onChange={setRatingFilter} />
          <FilterDropdown value={priceFilter} options={['Price', '< $1', '$1 – $2', '> $2']} onChange={setPriceFilter} />
          <FilterDropdown value={starsFilter} options={['Customer', '5★', '4★+']} onChange={setStarsFilter} />
          <FilterDropdown value={nFilter} options={['N', 'N > 5', 'N > 10']} onChange={setNFilter} />
        </div>
      </div>

      <div className="fl-vendors-table-wrap">
        <div className="fl-vendors-table">
          <div className="fl-vendors-table-header">
            <span className="col-rank">#</span>
            <span className="col-vendor">Vendor</span>
            <span className="col-price">$/mg</span>
            <span className="col-rating">Customer Rating</span>
            <span className="col-purity">Purity Rating</span>
            <span className="col-n">N</span>
          </div>
          {rows.map((row) => (
            <div key={row.slug} className="fl-vendors-table-row">
              <span className="col-rank">{row.rank}</span>
              <span className="col-vendor">
                <span
                  className="fl-vendor-initials"
                  style={{
                    background: INITIALS_BG[row.initials] || '#f3f4f6',
                    color: INITIALS_COLOR[row.initials] || '#374151',
                  }}
                >
                  {row.initials}
                </span>
                <span className="fl-vendor-info">
                  <span className="fl-vendor-name">{row.name}</span>
                  {row.isVerified && <span className="fl-vendor-verified">Verified Supplier</span>}
                  <a href={`/vendors/${row.slug}`} className="fl-vendor-report">
                    <FontAwesomeIcon icon={faFileLines} className="fl-report-icon" />
                    Get report
                  </a>
                </span>
              </span>
              <span className="col-price">{row.pricePerMg == null ? '—' : `$${row.pricePerMg.toFixed(2)}`}</span>
              <span className="col-rating">
                <FontAwesomeIcon icon={faStar} className="fl-star-icon" />
                {row.customerRating}%
              </span>
              <span className="col-purity">{row.purityRating == null ? '—' : `${row.purityRating}%`}</span>
              <span className="col-n">{row.nCount}</span>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="fl-vendors-empty">No vendors match your filters.</div>
          )}
        </div>
      </div>
    </div>
  )
}

interface FilterDropdownProps {
  value: string
  options: string[]
  onChange: (value: string) => void
}

function FilterDropdown({ value, options, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="fl-filter-dropdown">
      <button
        type="button"
        className="fl-filter-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{value}</span>
        <img src={chevronDown} alt="" className={`fl-filter-chevron${open ? ' open' : ''}`} />
      </button>
      {open && (
        <div className="fl-filter-menu" role="listbox">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={opt === value}
              className={`fl-filter-option${opt === value ? ' active' : ''}`}
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
