import { useState } from 'react'
import './VendorSignupForm.css'
import chevronLeftIcon from '../../assets/icons/vendorsignup/chevron-left.svg'
import lockIcon from '../../assets/icons/vendorsignup/lock.svg'

interface VendorSignupFormProps {
  onBack?: () => void
}

export default function VendorSignupForm({ onBack }: VendorSignupFormProps) {
  const [email, setEmail] = useState('')
  const [distributesPeptides, setDistributesPeptides] = useState<boolean | null>(true)
  const [currentSituation, setCurrentSituation] = useState<string>('new')
  const [vendorName, setVendorName] = useState('')
  const [batchIdentifiers, setBatchIdentifiers] = useState<string>('some')
  const [premiumOptIn, setPremiumOptIn] = useState(true)
  const [termsAccepted, setTermsAccepted] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <section className="vendor-signup-form">
      <div className="vendor-signup-card">
        <button type="button" className="vendor-back-button" onClick={onBack}>
          <img src={chevronLeftIcon} alt="" className="vendor-back-icon" />
          <span>Vendor Support</span>
        </button>

        <div className="vendor-title-block">
          <h2 className="vendor-title">Vendor Registration</h2>
          <p className="vendor-subtitle desktop-only">
            Register your business with Peptrace and build customer trust.
          </p>
          <p className="vendor-subtitle mobile-only">
            Register with Peptrace to build client trust.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="vendor-form">
          <div className="vendor-field">
            <label className="vendor-label" htmlFor="vendor-email">
              Email Address <span className="vendor-required">*</span>
            </label>
            <input
              id="vendor-email"
              type="email"
              className="vendor-input"
              placeholder="devontrae@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="vendor-field">
            <span className="vendor-label desktop-only">
              Do you distribute peptides commercially?{' '}
              <span className="vendor-required">*</span>
            </span>
            <span className="vendor-label mobile-only">
              Do you distribute commercially?{' '}
              <span className="vendor-required">*</span>
            </span>
            <div className="vendor-chip-group">
              <button
                type="button"
                className={`vendor-chip ${distributesPeptides === true ? 'selected' : ''}`}
                onClick={() => setDistributesPeptides(true)}
              >
                Yes
              </button>
              <button
                type="button"
                className={`vendor-chip ${distributesPeptides === false ? 'selected' : ''}`}
                onClick={() => setDistributesPeptides(false)}
              >
                No
              </button>
            </div>
          </div>

          <fieldset className="vendor-field">
            <legend className="vendor-label">
              Current Situation <span className="vendor-required">*</span>
            </legend>
            <div className="vendor-pill-group vendor-pill-group--situation">
              {[
                { value: 'new', label: 'New vendor, not selling yet' },
                { value: 'selling-unlisted', desktopLabel: 'Selling, but not listed by Peptrace', mobileLabel: 'Selling, but not listed' },
                { value: 'selling-listed', desktopLabel: 'Selling, already listed by Peptrace', mobileLabel: 'Selling, already listed' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`vendor-pill ${currentSituation === option.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="current-situation"
                    value={option.value}
                    checked={currentSituation === option.value}
                    onChange={(e) => setCurrentSituation(e.target.value)}
                  />
                  <span className="desktop-only">{option.label || option.desktopLabel}</span>
                  <span className="mobile-only">{option.mobileLabel || option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="vendor-field">
            <label className="vendor-label" htmlFor="vendor-name">
              Vendor Name <span className="vendor-required">*</span>
            </label>
            <input
              id="vendor-name"
              type="text"
              className="vendor-input"
              placeholder="Your business name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
            <p className="vendor-helper desktop-only">
              How your business will be identified on the Finnrick web site
            </p>
            <p className="vendor-helper mobile-only">
              Identified on the Finnrick website
            </p>
          </div>

          <fieldset className="vendor-field">
            <legend className="vendor-label desktop-only">
              Are your products distributed with batch identifiers?
            </legend>
            <legend className="vendor-label mobile-only">
              Batch identifiers?
            </legend>
            <div className="vendor-pill-group vendor-pill-group--batch">
              {[
                { value: 'all', desktopLabel: 'Yes, all products', mobileLabel: 'Yes, all' },
                { value: 'some', desktopLabel: 'Yes, some products', mobileLabel: 'Some' },
                { value: 'no', label: 'No' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`vendor-pill ${batchIdentifiers === option.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="batch-identifiers"
                    value={option.value}
                    checked={batchIdentifiers === option.value}
                    onChange={(e) => setBatchIdentifiers(e.target.value)}
                  />
                  <span className="desktop-only">{option.label || option.desktopLabel}</span>
                  <span className="mobile-only">{option.mobileLabel || option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="vendor-premium-panel">
            <div className="vendor-premium-row">
              <span className="vendor-premium-text">
                Upgrade to Premium for 10% off on Launch with Peptrace
              </span>
              <div className="vendor-premium-price">
                <span className="vendor-price-badge">$279/month</span>
              </div>
            </div>
          </div>

          <div className="vendor-checkbox-row">
            <label className="vendor-checkbox">
              <input
                type="checkbox"
                checked={premiumOptIn}
                onChange={(e) => setPremiumOptIn(e.target.checked)}
              />
              <span className="vendor-checkbox-box">
                {premiumOptIn && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M8.99986 1.00007L3.50001 6.50008L1.00007 4.00007"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </span>
              <span className="vendor-checkbox-label">
                Yes, start my Premium subscription
              </span>
            </label>
          </div>

          <div className="vendor-checkbox-row">
            <label className="vendor-checkbox">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <span className="vendor-checkbox-box">
                {termsAccepted && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M8.99986 1.00007L3.50001 6.50008L1.00007 4.00007"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </span>
              <span className="vendor-checkbox-label desktop-only">
                I confirm I am authorized to represent this vendor and agree to the{' '}
                <a href="#" className="vendor-link">Partner Service Terms</a>{' '}
                <span className="vendor-required">*</span>
              </span>
              <span className="vendor-checkbox-label mobile-only">
                Agree to the{' '}
                <a href="#" className="vendor-link">Partner Service Terms</a>{' '}
                <span className="vendor-required">*</span>
              </span>
            </label>
          </div>

          <button type="submit" className="vendor-cta">
            <span className="desktop-only">Continue to Payment — $279/mo</span>
            <span className="mobile-only">Continue — $279/mo</span>
          </button>

          <div className="vendor-security">
            <img src={lockIcon} alt="" className="vendor-lock-icon" />
            <span>Payments handled securely with Stripe.</span>
          </div>
        </form>
      </div>
    </section>
  )
}
