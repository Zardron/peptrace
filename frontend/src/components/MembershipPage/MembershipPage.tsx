import './MembershipPage.css'
import { useCallback, useState } from 'react'
import UpgradeModal, { type UpgradePlan } from './UpgradeModal'
import { useAuth } from '../../context/AuthContext'
import { TONE_RANK, useMembership, type MembershipTone } from '../../lib/membership'
import checkGreen from '../../assets/membership/check-green.svg'
import checkMuted from '../../assets/membership/check-muted.svg'
import highlightCoa from '../../assets/membership/highlight-coa.png'
import highlightIntelligence from '../../assets/membership/highlight-intelligence.png'
import highlightRating from '../../assets/membership/highlight-rating.png'
import type { SiteContent } from '../../content/defaults'
import RichText from '../../content/RichText'
import { useSiteContent } from '../../content/useSiteContent'

const highlightIcons = [highlightCoa, highlightRating, highlightIntelligence]

const buttonVariants: Record<Plan['tone'], string> = {
  muted: 'secondary',
  member: 'secondaryLight',
  gold: 'primary',
}

type Plan = SiteContent['membership']['plans'][number]

function PricingCard({
  plan,
  isLoggedIn,
  currentTone,
  onSignUpClick,
  onSubscribe,
}: {
  plan: Plan
  isLoggedIn: boolean
  currentTone: MembershipTone
  onSignUpClick?: () => void
  onSubscribe: (plan: Plan) => void
}) {
  const checkIcon = plan.tone === 'muted' ? checkMuted : checkGreen
  const isCurrent = isLoggedIn && plan.tone === currentTone
  const isLower = isLoggedIn && TONE_RANK[plan.tone] < TONE_RANK[currentTone]
  const isFree = plan.tone === 'muted'

  let label = 'Subscribe'
  if (isCurrent) label = 'Current Plan'
  else if (isLower) label = 'Included in your plan'
  else if (isFree) label = 'Create a free account'

  const handleClick = () => {
    if (!isLoggedIn) onSignUpClick?.()
    else if (!isFree) onSubscribe(plan)
  }

  return (
    <article className="membership-pricing-card">
      <div className="membership-plan-top">
        <div className="membership-plan-title-row">
          <h2 className={`membership-plan-title ${plan.tone}`}>{plan.title}</h2>
          {plan.badge ? <span className="membership-plan-badge">{plan.badge}</span> : null}
        </div>
        <div className="membership-plan-price">
          <strong>{plan.price}</strong>
          <span>{plan.period}</span>
        </div>
        <p><RichText text={plan.description} /></p>
      </div>

      <span className="membership-card-rule" />

      <ul className="membership-feature-list">
        {plan.features.map((feature, index) => (
          <li key={`${index}-${feature}`}>
            <img src={checkIcon} alt="" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`membership-card-button ${buttonVariants[plan.tone]}`}
        disabled={isCurrent || isLower}
        onClick={handleClick}
      >
        {label}
      </button>
    </article>
  )
}

interface MembershipPageProps {
  onSignUpClick?: () => void
}

export default function MembershipPage({ onSignUpClick }: MembershipPageProps) {
  const content = useSiteContent('membership')
  const footer = useSiteContent('footer')
  const { user } = useAuth()
  const { tone, refresh } = useMembership()
  const [upgradePlan, setUpgradePlan] = useState<UpgradePlan | null>(null)
  const closeUpgrade = useCallback(() => setUpgradePlan(null), [])

  const startUpgrade = (plan: Plan) => {
    if (plan.tone === 'muted') return
    setUpgradePlan({ id: plan.tone === 'gold' ? 'gold' : 'member', title: plan.title, price: plan.price, period: plan.period })
  }

  return (
    <div className="membership-page">
      <main className="membership-main">
        <section className="membership-hero">
          <span className="membership-badge">Membership</span>
          <div className="membership-hero-copy">
            <h1>
              {content.heroTitle} <span>{content.heroHighlight}</span>
            </h1>
            <p><RichText text={content.heroBody} /></p>
          </div>
        </section>

        <section className="membership-pricing" aria-label="Membership pricing">
          <div className="membership-pricing-grid">
            {content.plans.map((plan, index) => (
              <PricingCard
                plan={plan}
                isLoggedIn={Boolean(user)}
                currentTone={tone}
                onSignUpClick={onSignUpClick}
                onSubscribe={startUpgrade}
                key={`${index}-${plan.title}`}
              />
            ))}
          </div>

          <div className="membership-policy">
            <p>{content.policyText}</p>
            <div className="membership-policy-links">
              <a href="/terms">Terms of Service</a>
              <a href="/refund">Refund Policy</a>
              <a href="/privacy">Privacy Policy</a>
              <span>
                Support:{' '}
                <a href={`mailto:${content.supportEmail}`}>
                  <strong className="membership-support-email">{content.supportEmail}</strong>
                </a>
              </span>
            </div>
          </div>
        </section>

        <section className="membership-highlights" aria-label="Membership benefits">
          {content.highlights.map((highlight, index) => (
            <article className="membership-highlight" key={`${index}-${highlight.title}`}>
              <img src={highlightIcons[index] ?? highlightCoa} alt="" className="membership-highlight-icon" />
              <h2>{highlight.title}</h2>
              <p><RichText text={highlight.description} /></p>
            </article>
          ))}
        </section>

        <section className="membership-funding">
          <div className="membership-funding-copy">
            <h2>{content.fundingTitle}</h2>
            <p><RichText text={content.fundingBody} /></p>
          </div>
          <aside className="membership-stat">
            <strong>{content.fundingStatTitle}</strong>
            <span>{content.fundingStatBody}</span>
          </aside>
        </section>

        <section className="membership-faq">
          <h2>{content.faqTitle}</h2>
          <div className="membership-faq-grid">
            {content.faqs.map((faq, index) => (
              <article className="membership-faq-card" key={`${index}-${faq.question}`}>
                <h3>{faq.question}</h3>
                <p><RichText text={faq.answer} /></p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="membership-footer">
        <div className="membership-footer-grid">
          {footer.columns.map((column, index) => (
            <div className="membership-footer-column" key={`${index}-${column.title}`}>
              <h2>{column.title}</h2>
              <ul>
                {column.links.map((link, linkIndex) => (
                  <li key={`${linkIndex}-${link.label}`}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <span className="membership-footer-rule" />
        <p>{footer.copyright}</p>
      </footer>
      <UpgradeModal plan={upgradePlan} onClose={closeUpgrade} onUpgraded={() => void refresh()} />
    </div>
  )
}
