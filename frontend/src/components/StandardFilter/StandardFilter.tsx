import { useEffect, useRef, useState } from 'react'
import './StandardFilter.css'

// Mirrors the Standards table on the methodology page (/methodology).
// Leaderboard/vendor rows only carry purity, so filtering is by each
// standard's purity threshold; the badges carry the rest of the criteria.
export const STANDARD_OPTIONS = [
  { id: 'purity-focus', label: 'Purity focus', badges: ['purity 99.5%+', 'dose ±20%'], minPurity: 99.5 },
  { id: 'peptrace-standard', label: 'Peptrace Standard', badges: ['purity 99.5%+', 'dose ±20%', 'label 0.5+'], minPurity: 99.5 },
  { id: 'purity-strict', label: 'Purity focus strict', badges: ['purity 99.8%+', 'dose ±15%', 'Members'], minPurity: 99.8 },
  { id: 'super-strict', label: 'Peptrace Super strict', badges: ['purity 99.8%+', 'dose ±15%', 'label 1.0+', 'Members'], minPurity: 99.8 },
  { id: 'accuracy-focus', label: 'Accuracy focus', badges: ['purity 98%+', 'dose ±20%', 'label 0.5+', 'Members'], minPurity: 98 },
  { id: 'all', label: 'All vendors', badges: [] as string[], minPurity: 0 },
] as const

export type StandardId = (typeof STANDARD_OPTIONS)[number]['id']

export const getStandard = (id: StandardId) =>
  STANDARD_OPTIONS.find((option) => option.id === id) ?? STANDARD_OPTIONS[0]

interface StandardFilterProps {
  value: StandardId
  onChange: (id: StandardId) => void
}

export default function StandardFilter({ value, onChange }: StandardFilterProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

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

  const selected = getStandard(value)

  return (
    <div className="filter-dropdown" ref={filterRef}>
      <button
        type="button"
        className="filter-left filter-trigger"
        aria-haspopup="listbox"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="filter-label">{selected.label}</span>
        {selected.badges.map((badge) => (
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
        <div className="filter-menu" role="listbox" aria-label="Standard filter">
          {STANDARD_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={option.id === value}
              className={`filter-menu-option${option.id === value ? ' active' : ''}`}
              onClick={() => {
                onChange(option.id)
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
  )
}
