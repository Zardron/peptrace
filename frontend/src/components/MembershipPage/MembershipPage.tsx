import './MembershipPage.css'
import checkGreen from '../../assets/membership/check-green.svg'
import checkMuted from '../../assets/membership/check-muted.svg'
import highlightCoa from '../../assets/membership/highlight-coa.png'
import highlightIntelligence from '../../assets/membership/highlight-intelligence.png'
import highlightRating from '../../assets/membership/highlight-rating.png'

const plans = [
  {
    title: 'PepTrace Free',
    tone: 'muted',
    price: '$0',
    period: '/ forever',
    description: "Basic access to PepTrace's public database of vendor names and submitted public COAs.",
    features: ['Browse listed vendors', 'View crowd-sourced ratings', 'Basic searching & filtering'],
    buttonText: 'You have a free account',
    buttonVariant: 'secondary',
  },
  {
    title: 'PepTrace Member',
    tone: 'member',
    price: '$9.99',
    period: '/ month',
    description: 'Full access to lab testing verifications, strict rating modes, and detailed vendor scorecards.',
    features: [
      'View strict rating scorecards',
      'Original lab COAs index download',
      'Community-funded testing alerts',
      'Strict/Relaxed toggle modes',
    ],
    buttonText: 'Get PepTrace Member',
    buttonVariant: 'secondaryLight',
  },
  {
    title: 'PepTrace Gold',
    tone: 'gold',
    price: '$39.99',
    period: '/ month',
    description: 'For extreme researchers. Directly funds high-frequency independent testing of new batches.',
    features: [
      'All PepTrace Member benefits',
      'Vendor intelligence reports',
      'Direct lab test voting power',
      'Early access to lab results (48h)',
    ],
    buttonText: 'Get PepTrace Gold',
    buttonVariant: 'primary',
    badge: 'TOP TIER',
  },
]

const highlights = [
  {
    icon: highlightCoa,
    title: 'Original lab COAs',
    description:
      "We pull directly from original testing laboratory systems (such as Janoshik, MZ Biolabs) to ensure documents aren't tampered with.",
  },
  {
    icon: highlightRating,
    title: 'Two strict rating modes',
    description:
      'Switch between Strict and Relaxed views. Strict mode hides unverified tests and filters out self-reported results immediately.',
  },
  {
    icon: highlightIntelligence,
    title: 'Vendor intelligence reports',
    description:
      'Get full analytics on consistency. Detect batch variation over time with custom historical scatter plots of purity and quantity.',
  },
]

const faqs = [
  {
    question: 'Why are strict modes paid?',
    answer:
      'Running deep data cross-checks on laboratory databases and maintaining clean rating algorithms takes significant technical infrastructure and manual oversight. Keeping this under a membership tier keeps PepTrace completely unbiased.',
  },
  {
    question: 'Do I need an account first?',
    answer:
      'Yes, you can register for a free account to browse basic information, and upgrade instantly when you are ready to access raw lab files and detailed quality scorecards.',
  },
  {
    question: 'What stays free?',
    answer:
      'The basic lists of vendors, basic crowdsourced rating scores, and public peptide profiles will remain free forever to support the baseline research community.',
  },
]

const footerColumns = [
  {
    title: 'Explore',
    links: [
      'Products',
      'Vendors',
      'Vendor Support',
      'Blog',
      'Partner Testing Labs',
      'Testing Methodology',
      'Corrections',
      'Company',
      'Customer Support',
    ],
  },
  {
    title: 'Testing',
    links: [
      'Submit your sample',
      'Test Retatrutide',
      'Test Tirzipatide',
      'Test Melatonin',
      'Test BPC-157',
      'Test Ipamoreline',
      'Test NAD+',
      'Test another product',
    ],
  },
  {
    title: 'Legal',
    links: [
      'Verify COA',
      'Testing Status',
      'Terms of Service',
      'Privacy Policy',
      'Refund Policy',
      'Partner Service Terms',
      'Data Deletion',
    ],
  },
]

function PricingCard({ plan }: { plan: (typeof plans)[number] }) {
  const checkIcon = plan.tone === 'muted' ? checkMuted : checkGreen

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
        <p>{plan.description}</p>
      </div>

      <span className="membership-card-rule" />

      <ul className="membership-feature-list">
        {plan.features.map((feature) => (
          <li key={feature}>
            <img src={checkIcon} alt="" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button type="button" className={`membership-card-button ${plan.buttonVariant}`}>
        {plan.buttonText}
      </button>
    </article>
  )
}

export default function MembershipPage() {
  return (
    <div className="membership-page">
      <main className="membership-main">
        <section className="membership-hero">
          <span className="membership-badge">Membership</span>
          <div className="membership-hero-copy">
            <h1>
              Subscribe to PepTrace. <span>See everything.</span>
            </h1>
            <p>
              Unlock third-party lab verification databases, community vendor metrics, and strict testing modes
              designed for rigorous peptide research.
            </p>
          </div>
        </section>

        <section className="membership-pricing" aria-label="Membership pricing">
          <div className="membership-pricing-grid">
            {plans.map((plan) => (
              <PricingCard plan={plan} key={plan.title} />
            ))}
          </div>

          <div className="membership-policy">
            <p>Cancel anytime. Subscriptions are billed monthly. No-risk satisfaction guarantee.</p>
            <div className="membership-policy-links">
              <a href="/terms">Terms of Service</a>
              <a href="/refunds">Refund Policy</a>
              <a href="/privacy">Privacy Policy</a>
              <span>
                Support:{' '}
                <strong className="membership-support-email membership-support-email-desktop">info@peptrace.co</strong>
                <strong className="membership-support-email membership-support-email-tablet">support@peptrace.com</strong>
              </span>
            </div>
          </div>
        </section>

        <section className="membership-highlights" aria-label="Membership benefits">
          {highlights.map((highlight) => (
            <article className="membership-highlight" key={highlight.title}>
              <img src={highlight.icon} alt="" className="membership-highlight-icon" />
              <h2>{highlight.title}</h2>
              <p>{highlight.description}</p>
            </article>
          ))}
        </section>

        <section className="membership-funding">
          <div className="membership-funding-copy">
            <h2>Where your subscription goes</h2>
            <p>
              PepTrace is completely independent. 100% of membership fees go toward buying random peptide vials
              directly from vendors and submitting them to independent third-party laboratories for testing. We accept
              no sponsor money from vendors.
            </p>
          </div>
          <aside className="membership-stat">
            <strong>$14k+</strong>
            <span>Spent monthly on independent validation lab tests</span>
          </aside>
        </section>

        <section className="membership-faq">
          <h2>Frequently Asked Questions</h2>
          <div className="membership-faq-grid">
            {faqs.map((faq) => (
              <article className="membership-faq-card" key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="membership-footer">
        <div className="membership-footer-grid">
          {footerColumns.map((column) => (
            <div className="membership-footer-column" key={column.title}>
              <h2>{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link}>
                    <a href={`/${link.toLowerCase().replace(/\s+/g, '-')}`}>{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <span className="membership-footer-rule" />
        <p>&copy;2026 Peptrace</p>
      </footer>
    </div>
  )
}
