import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import './VendorSignupForm.css'
import chevronLeftIcon from '../../assets/icons/vendorsignup/chevron-left.svg'
import sparklesIcon from '../../assets/icons/vendorsignup/sparkles.svg'
import chevronDownIcon from '../../assets/icons/vendorsignup/chevron-down.svg'
import lockIcon from '../../assets/icons/vendorsignup/lock.svg'

interface VendorSignupFormProps {
  onBack?: () => void
}

export default function VendorSignupForm({ onBack }: VendorSignupFormProps) {
  const { user } = useAuth()
  const [distributesPeptides, setDistributesPeptides] = useState<boolean | null>(null)
  const [currentSituation, setCurrentSituation] = useState<string>('')
  const [vendorName, setVendorName] = useState('')
  const [batchIdentifiers, setBatchIdentifiers] = useState<string>('')
  const [premiumOptIn, setPremiumOptIn] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState('')
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmissionError('')
    setApplicationSubmitted(false)
    if (!user) {
      setSubmissionError('Log in before submitting a vendor application.')
      return
    }
    if (distributesPeptides === null || !currentSituation || !vendorName.trim() || !termsAccepted) {
      setSubmissionError('Complete the required fields and accept the Partner Service Terms.')
      return
    }

    setSubmitting(true)
    try {
      await apiFetch('/account/vendor-signup-applications', {
        method: 'POST',
        body: JSON.stringify({
          distributesPeptides,
          currentSituation,
          vendorName,
          batchIdentifiers: batchIdentifiers || null,
          premiumOptIn,
          termsAccepted,
        }),
      })
      setApplicationSubmitted(true)
      setDistributesPeptides(null)
      setCurrentSituation('')
      setVendorName('')
      setBatchIdentifiers('')
      setPremiumOptIn(false)
      setTermsAccepted(false)
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Could not submit your application.')
    } finally {
      setSubmitting(false)
    }
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
          <p className="vendor-subtitle">
            Register your business with Peptrace and build customer trust.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="vendor-form">
          {submissionError && <p className="vendor-form-message error" role="alert">{submissionError}</p>}
          {applicationSubmitted && (
            <p className="vendor-form-message success" role="status">
              Application submitted. We will review it and update its status in your account.
            </p>
          )}

          <div className="vendor-field">
            <label className="vendor-label" htmlFor="vendor-email">
              Email Address <span className="vendor-required">*</span>
            </label>
            <input
              id="vendor-email"
              type="email"
              className="vendor-input"
              value={user?.email ?? ''}
              readOnly
            />
          </div>

          <div className="vendor-field">
            <span className="vendor-label">
              Do you distribute peptides commercially?{' '}
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
                { value: 'selling-unlisted', label: 'Selling, but not listed by Peptrace' },
                { value: 'selling-listed', label: 'Selling, already listed by Peptrace' },
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
                  <span>{option.label}</span>
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
            <p className="vendor-helper">
              How your business will be identified on the Finnrick web site
            </p>
          </div>

          <fieldset className="vendor-field">
            <legend className="vendor-label">
              Are your products distributed with batch identifiers?
            </legend>
            <div className="vendor-pill-group vendor-pill-group--batch">
              {[
                { value: 'all', label: 'Yes, all products' },
                { value: 'some', label: 'Yes, some products' },
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
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="vendor-premium-panel">
            <div className="vendor-premium-row">
              <img src={sparklesIcon} alt="" className="vendor-premium-icon" />
              <span className="vendor-premium-text">
                Upgrade to Premium for 10% off on Launch with Peptrace
              </span>
              <div className="vendor-premium-price">
                <span className="vendor-price-badge">$279/month</span>
                <img src={chevronDownIcon} alt="" className="vendor-chevron-icon" />
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
              <span className="vendor-checkbox-label">
                I confirm I am authorized to represent this vendor and agree to the{' '}
                <a href="#" className="vendor-link">Partner Service Terms</a>{' '}
                <span className="vendor-required">*</span>
              </span>
            </label>
          </div>

          <button type="submit" className="vendor-cta" disabled={submitting}>
            {submitting ? 'Submitting application...' : 'Submit application'}
          </button>

          <div className="vendor-security">
            <img src={lockIcon} alt="" className="vendor-lock-icon" />
            <span>Your application is submitted securely. No payment is collected now.</span>
          </div>
        </form>
      </div>
    </section>
  )
}
