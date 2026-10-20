import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import './StandardFilter.css'
import UpgradeModal, { type UpgradePlan } from '../MembershipPage/UpgradeModal'
import { TONE_RANK, useMembership, type MembershipTone } from '../../lib/membership'
import { useSiteContent } from '../../content/useSiteContent'

// Mirrors the Standards table on the methodology page (/methodology).
// Leaderboard/vendor rows only carry purity, so filtering is by each
// standard's purity threshold; the badges carry the rest of the criteria.
// oxlint-disable-next-line react/only-export-components
export const STANDARD_OPTIONS = [
  { id: 'purity-focus', label: 'Purity focus', badges: ['purity 99.5%+', 'dose ±20%'], minPurity: 99.5 },
  { id: 'peptrace-standard', label: 'Peptrace Standard', badges: ['purity 99.5%+', 'dose ±20%', 'label 0.5+'], minPurity: 99.5 },
  { id: 'purity-strict', label: 'Purity focus strict', badges: ['purity 99.8%+', 'dose ±15%', 'Members'], minPurity: 99.8 },
  { id: 'super-strict', label: 'Peptrace Super strict', badges: ['purity 99.8%+', 'dose ±15%', 'label 1.0+', 'Members'], minPurity: 99.8 },
  { id: 'accuracy-focus', label: 'Accuracy focus', badges: ['purity 98%+', 'dose ±20%', 'label 0.5+', 'Members'], minPurity: 98 },
  { id: 'all', label: 'All vendors', badges: [] as string[], minPurity: 0 },
] as const

export type StandardId = (typeof STANDARD_OPTIONS)[number]['id']

// oxlint-disable-next-line react/only-export-components
export const getStandard = (id: StandardId) =>
  STANDARD_OPTIONS.find((option) => option.id === id) ?? STANDARD_OPTIONS[0]

interface StandardFilterProps {
  value: StandardId
  onChange: (id: StandardId) => void
  allLabel?: string
}

export default function StandardFilter({ value, onChange, allLabel }: StandardFilterProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [upsellOpen, setUpsellOpen] = useState(false)
  const [checkoutPlan, setCheckoutPlan] = useState<UpgradePlan | null>(null)
  const [pendingStandard, setPendingStandard] = useState<StandardId | null>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const { tone, loading: membershipLoading, refresh } = useMembership()
  const membership = useSiteContent('membership')
  const hasPaidMembership = TONE_RANK[tone] >= TONE_RANK.member
  const upgradePlans = membership.plans.filter((plan) =>
    plan.tone !== 'muted' && TONE_RANK[plan.tone as MembershipTone] > TONE_RANK[tone],
  )

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
  const selectedLabel = selected.id === 'all' && allLabel ? allLabel : selected.label
  const selectedMembersOnly = (selected.badges as readonly string[]).includes('Members')
  const selectedLocked = selectedMembersOnly && !membershipLoading && !hasPaidMembership

  return (
    <div className="filter-dropdown" ref={filterRef}>
      <button
        type="button"
        className="filter-left filter-trigger"
        aria-haspopup="listbox"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className={`filter-trigger-content${selectedLocked ? ' filter-member-locked' : ''}`}>
          <span className="filter-label">{selectedLabel}</span>
          {selected.badges.filter((badge) => badge !== 'Members').map((badge) => (
            <span key={badge} className="filter-badge">{badge}</span>
          ))}
        </span>
        {selectedMembersOnly ? (
          <span className="filter-badge filter-badge-members">
            {selectedLocked ? <FontAwesomeIcon aria-hidden="true" className="filter-badge-lock" icon={faLock} /> : null}
            Members
          </span>
        ) : null}
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
            (() => {
              const membersOnly = (option.badges as readonly string[]).includes('Members')
              const locked = membersOnly && !membershipLoading && !hasPaidMembership
              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={option.id === value}
                  className={`filter-menu-option${option.id === value ? ' active' : ''}`}
                  onClick={() => {
                    const membersOnly = (option.badges as readonly string[]).includes('Members')
                    if (membersOnly && membershipLoading) return
                    if (membersOnly && !hasPaidMembership) {
                      setPendingStandard(option.id)
                      setUpsellOpen(true)
                      setMenuOpen(false)
                      return
                    }
                    onChange(option.id)
                    setMenuOpen(false)
                  }}
                >
                  <span className={`filter-menu-option-content${locked ? ' filter-member-locked' : ''}`}>
                    <span className="filter-menu-option-label">
                      {option.id === 'all' && allLabel ? allLabel : option.label}
                    </span>
                    {option.badges.filter((badge) => badge !== 'Members').map((badge) => (
                      <span key={badge} className="filter-badge">{badge}</span>
                    ))}
                  </span>
                  {membersOnly ? (
                    <span className="filter-badge filter-badge-members">
                      {locked ? <FontAwesomeIcon aria-hidden="true" className="filter-badge-lock" icon={faLock} /> : null}
                      Members
                    </span>
                  ) : null}
                </button>
              )
            })()
          ))}
        </div>
      ) : null}
      {upsellOpen ? (
        <div className="standard-upsell-backdrop" role="presentation" onMouseDown={() => {
          setUpsellOpen(false)
          setPendingStandard(null)
        }}>
          <section
            className="standard-upsell-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="standard-upsell-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="standard-upsell-close"
              aria-label="Close upgrade options"
              onClick={() => {
                setUpsellOpen(false)
                setPendingStandard(null)
              }}
            >
              ×
            </button>
            <span className="standard-upsell-eyebrow">MEMBERSHIP</span>
            <h2 id="standard-upsell-title">Unlock member-only methodologies</h2>
            <p className="standard-upsell-description">
              Upgrade your PepTrace plan to use {getStandard(pendingStandard ?? value).label} and access deeper testing insights.
            </p>
            <div className="standard-upsell-plans">
              {upgradePlans.map((plan) => (
                <article className={`standard-upsell-plan ${plan.tone}`} key={plan.tone}>
                  <h3>{plan.title}</h3>
                  <p className="standard-upsell-price">{plan.price}<span>{plan.period}</span></p>
                  <p className="standard-upsell-plan-description">{plan.description}</p>
                  <ul>
                    {plan.features.slice(0, 3).map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setCheckoutPlan({
                      id: plan.tone === 'gold' ? 'gold' : 'member',
                      title: plan.title,
                      price: plan.price,
                      period: plan.period,
                    })}
                  >
                    Upgrade to {plan.tone === 'gold' ? 'Gold' : 'Member'}
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
      <UpgradeModal
        plan={checkoutPlan}
        onClose={() => setCheckoutPlan(null)}
        onUpgraded={() => {
          void refresh()
          if (pendingStandard) onChange(pendingStandard)
          setPendingStandard(null)
          setUpsellOpen(false)
        }}
      />
    </div>
  )
}
