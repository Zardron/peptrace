import { useState, useCallback } from 'react'
import './FormWizard.css'
import FormProgressSideBar from './FormProgressSideBar'
import FormNavNextBack from './FormNavNextBack'
import checkmarkIcon from '../../assets/icons/231_4156.svg'
import uploadIcon from '../../assets/icons/281_5401.svg'
import calendarIcon from '../../assets/icons/292_5946.svg'
import dropdownIcon from '../../assets/icons/293_5968.svg'
import plusIcon from '../../assets/icons/319_840.svg'
import warningIcon from '../../assets/icons/1434_2321.svg'

interface FormWizardProps {
  initialStep?: number
  onStepChange?: (step: number) => void
  onComplete?: () => void
}

const steps = [
  { label: 'Choose Product', key: 'choose-product' },
  { label: 'Testing Options', key: 'testing-options' },
  { label: 'Vendors', key: 'vendors' },
  { label: 'Batch Info', key: 'batch-info' },
  { label: 'COA', key: 'coa' },
  { label: 'Proof', key: 'proof' },
  { label: 'Ship', key: 'ship' },
]

const productCards = ['Tirzepatide', 'Semaglutide', 'Retatrutide']

const paidProducts = [
  { name: 'Tirzepatide', price: 'FREE' },
  { name: 'Oxytocin', price: '$238' },
  { name: 'Oxytocin', price: '$238' },
  { name: 'Oxytocin', price: '$238' },
  { name: 'Oxytocin', price: '$238' },
  { name: 'Oxytocin', price: '$238' },
  { name: 'Oxytocin', price: '$238' },
  { name: 'Oxytocin', price: '$238' },
]

const vendorList = [
  'Peptide Sciences',
  'ZLC Peptides',
  'SRV Labs',
  'BNZ Peptides',
  'Super Peptides',
  'PeptiCo',
  'Dosagenetics',
]

const formFactorOptions = [
  { label: 'Lyophilized Powder', value: 'lyophilized' },
  { label: 'Reconstituted Peptide', value: 'reconstituted' },
  { label: 'Spray or Liquid', value: 'spray' },
  { label: 'Same as I bought', value: 'same' },
  { label: 'Other', value: 'other' },
]

const testAddons = [
  {
    id: 'different-lab',
    title: 'Choose a different lab',
    price: '$49.99',
    body: 'Select an alternative certified lab for your test.',
    options: ['ABC Labs', 'XYZ Labs', 'Global Lab'],
  },
  {
    id: 'endotoxin',
    title: 'Endotoxin',
    price: '$49.00',
    body: 'Perform an test for endotoxin contamination. No need to send an extra vial.',
  },
  {
    id: 'heavy-metals',
    title: 'Heavy metals (Pb, Cd, As, Hg)',
    price: '$120.00',
    body: 'Perform an additional test for the following heavy metals: arsenic, lead, cadmium and mercury. No need to send an extra vial.',
  },
  {
    id: 'solvents',
    title: 'Solvents',
    price: '$120.00',
    body: 'Perform an additional test for residual solvents contamination. No need to send an extra vial.',
  },
]

export default function FormWizard({ initialStep = 1, onStepChange, onComplete }: FormWizardProps) {
  const [currentStep, setCurrentStep] = useState(Math.max(1, Math.min(7, initialStep)))

  // Step 1 state
  const [selectedChip, setSelectedChip] = useState(0)
  const [productSearch, setProductSearch] = useState('')
  const [selectedProductRow, setSelectedProductRow] = useState<number | null>(0)

  // Step 2 state
  const [selectedLab, setSelectedLab] = useState('')
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())

  // Step 3 state
  const [vendorSearch, setVendorSearch] = useState('')
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)

  // Step 4 state
  const [formFactor, setFormFactor] = useState<string | null>(null)
  const [batchId, setBatchId] = useState('')
  const [batchProofFile, setBatchProofFile] = useState<string | null>(null)
  const [quantityMg, setQuantityMg] = useState('')

  // Step 5 state
  const [vendorProvidedCOA, setVendorProvidedCOA] = useState<boolean | null>(null)
  const [coaWhen, setCoaWhen] = useState('')
  const [coaOtherText, setCoaOtherText] = useState('')
  const [coaMatch, setCoaMatch] = useState<boolean | null>(null)
  const [coaUrl, setCoaUrl] = useState('')
  const [coaFile, setCoaFile] = useState<string | null>(null)

  // Step 6 state
  const [proofFile, setProofFile] = useState<string | null>(null)
  const [orderId, setOrderId] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [numVials, setNumVials] = useState('')
  const [pricePerVial, setPricePerVial] = useState('')
  const [priceCurrency, setPriceCurrency] = useState('USD')

  // Step 7 state
  const [warningDismissed, setWarningDismissed] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState([false, false, false])
  const [newsletterOptIn, setNewsletterOptIn] = useState(false)

  const goToStep = useCallback(
    (step: number) => {
      const s = Math.max(1, Math.min(7, step))
      setCurrentStep(s)
      onStepChange?.(s)
    },
    [onStepChange],
  )

  const goNext = useCallback(() => {
    if (currentStep < 7) {
      goToStep(currentStep + 1)
    } else {
      onComplete?.()
    }
  }, [currentStep, goToStep, onComplete])

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      goToStep(currentStep - 1)
    }
  }, [currentStep, goToStep])

  const filteredProducts = paidProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()),
  )

  const filteredVendors = vendorList.filter((v) =>
    v.toLowerCase().includes(vendorSearch.toLowerCase()),
  )

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleFileUpload = (_setter: (f: string | null) => void) => {
    // Stub: in real integration this would open a file picker
  }

  return (
    <div className="form-wizard">
      <div className="fw-mobile-header">
        <span className="fw-step-label">
          Step {currentStep} of {steps.length}
        </span>
        <div className="fw-progress-bars">
          {steps.map((_, i) => (
            <div key={i} className={`fw-progress-bar ${i < currentStep ? 'active' : ''}`} />
          ))}
        </div>
        <div className="fw-step-title-row">
          <span className="fw-step-name">{steps[currentStep - 1].label}</span>
          <span className="fw-step-price">
            <span className="fw-price-label">Price:</span>
            <span className="fw-price-value">FREE</span>
          </span>
        </div>
      </div>

      <div className="fw-layout">
        <FormProgressSideBar
          steps={steps}
          currentStep={currentStep}
          onStepClick={goToStep}
        />

        <div className="fw-content">
          {currentStep === 1 && (
            <>
              <div className="fw-section-title">
                <span>What product are you sending us?</span>
              </div>

              <div className="fw-chips">
                {productCards.map((name, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`fw-chip ${selectedChip === i ? 'selected' : ''}`}
                    onClick={() => setSelectedChip(i)}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <div className="fw-search-wrap">
                <input
                  type="text"
                  className="fw-search-input"
                  placeholder="Search products"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              <div className="fw-list">
                {filteredProducts.map((product, i) => (
                  <div
                    key={i}
                    className={`fw-list-row ${selectedProductRow === i ? 'selected' : ''} ${i % 2 === 1 ? 'alt' : ''}`}
                    onClick={() => setSelectedProductRow(i)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="fw-list-row-name">{product.name}</span>
                    <span className="fw-list-row-value">{product.price}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="fw-section-title">
                <span>Testing Options</span>
              </div>

              <div className="fw-field">
                <span className="fw-field-label">Free Testing Includes:</span>
                <ul className="fw-field-hint" style={{ margin: 0, paddingLeft: 16 }}>
                  <li>HPLC (High Performance Liquid Chromatography)</li>
                  <li>Identity</li>
                  <li>Purity</li>
                  <li>Quantity</li>
                </ul>
              </div>

              <div className="fw-field">
                <span className="fw-field-label">Add-ons</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {testAddons.map((addon) => {
                    const isSelected = selectedAddons.has(addon.id)
                    return (
                      <div
                        key={addon.id}
                        className={`fw-test-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleAddon(addon.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="fw-test-card-header">
                          {isSelected && (
                            <img
                              src={checkmarkIcon}
                              alt=""
                              className="fw-test-card-check"
                              width={12}
                              height={12}
                            />
                          )}
                          <span className="fw-test-card-title">{addon.title}</span>
                          <span className="fw-test-card-price">{addon.price}</span>
                        </div>
                        <p className="fw-test-card-body">{addon.body}</p>
                        {addon.options && (
                          <select
                            className="fw-test-card-select"
                            value={selectedLab}
                            onChange={(e) => {
                              e.stopPropagation()
                              setSelectedLab(e.target.value)
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Select lab</option>
                            {addon.options.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="fw-section-title">
                <span>Who&apos;s your vendor?</span>
              </div>

              <div className="fw-search-wrap">
                <input
                  type="text"
                  className="fw-search-input"
                  placeholder="Search vendor"
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="fw-btn-add-sample"
                onClick={() => {
                  /* stub */
                }}
              >
                + Add new vendor
              </button>

              <div className="fw-list">
                {filteredVendors.map((vendor, i) => (
                  <div
                    key={i}
                    className={`fw-list-row ${selectedVendor === vendor ? 'selected' : ''} ${i % 2 === 1 ? 'alt' : ''}`}
                    onClick={() => setSelectedVendor(vendor)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="fw-list-row-name">{vendor}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {currentStep === 4 && (
            <>
              <div className="fw-section-title">
                <span>Batch information</span>
              </div>

              <div className="fw-field">
                <span className="fw-field-label">Form Factor</span>
                <span className="fw-field-hint">
                  Please choose the option that best fits the label or box of your product.
                </span>
                <div className="fw-form-factors">
                  {formFactorOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`fw-form-factor ${formFactor === opt.value ? 'selected' : ''}`}
                      onClick={() => setFormFactor(opt.value)}
                    >
                      {formFactor === opt.value && (
                        <img
                          src={checkmarkIcon}
                          alt=""
                          className="fw-form-factor-check"
                          width={20}
                          height={20}
                        />
                      )}
                      <span className="fw-form-factor-label">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="fw-field">
                <span className="fw-field-label">Batch Identifier</span>
                <span className="fw-field-hint">
                  This number includes a Lot Number and/or Batch Number that is on the product.
                </span>
                <input
                  type="text"
                  className="fw-input"
                  placeholder="Lot number, Mfg date, etc."
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                />
              </div>

              <div className="fw-field">
                <span className="fw-field-label">Batch Identifier Proof</span>
                <span className="fw-field-hint">
                  Please upload a picture of your batch identifier packaging.
                </span>
                <div
                  className="fw-upload"
                  onClick={() => handleFileUpload(setBatchProofFile)}
                  role="button"
                  tabIndex={0}
                >
                  <img src={uploadIcon} alt="" className="fw-upload-icon" />
                  <span className="fw-upload-text">
                    {batchProofFile ? 'File selected' : 'Click or drag a file here to upload'}
                  </span>
                </div>
              </div>

              <div className="fw-field">
                <span className="fw-field-label">Quantity</span>
                <span className="fw-field-hint">
                  Please enter the total quantity (in mg) of the product in the vial or box.
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    className="fw-input"
                    placeholder="100"
                    value={quantityMg}
                    onChange={(e) => setQuantityMg(e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500 }}>mg</span>
                </div>
              </div>
            </>
          )}

          {currentStep === 5 && (
            <>
              <div className="fw-section-title">
                <span>Certificate of Analysis (COA)</span>
              </div>

              <div className="fw-field">
                <span className="fw-field-label">Did your vendor provide a COA?</span>
                <div className="fw-radio-group">
                  <label className="fw-radio-row">
                    <input
                      type="radio"
                      name="vendor-coa"
                      checked={vendorProvidedCOA === true}
                      onChange={() => setVendorProvidedCOA(true)}
                    />
                    Yes
                  </label>
                  <label className="fw-radio-row">
                    <input
                      type="radio"
                      name="vendor-coa"
                      checked={vendorProvidedCOA === false}
                      onChange={() => setVendorProvidedCOA(false)}
                    />
                    No
                  </label>
                </div>
              </div>

              {vendorProvidedCOA === true && (
                <>
                  <div className="fw-field">
                    <span className="fw-field-label">When did the vendor provide the COA?</span>
                    <div className="fw-radio-group">
                      {['During purchase', "Vendor's Website", 'With the shipment', 'QR code on the sample', 'Another way'].map(
                        (opt) => (
                          <label key={opt} className="fw-radio-row">
                            <input
                              type="radio"
                              name="coa-when"
                              checked={coaWhen === opt}
                              onChange={() => setCoaWhen(opt)}
                            />
                            {opt}
                          </label>
                        ),
                      )}
                    </div>
                    {coaWhen === 'Another way' && (
                      <input
                        type="text"
                        className="fw-input"
                        placeholder="How did you receive the COA?"
                        value={coaOtherText}
                        onChange={(e) => setCoaOtherText(e.target.value)}
                      />
                    )}
                  </div>

                  <div className="fw-field">
                    <span className="fw-field-label">
                      Does the COA provided match your sample&apos;s Batch ID?
                    </span>
                    <div className="fw-radio-group">
                      <label className="fw-radio-row">
                        <input
                          type="radio"
                          name="coa-match"
                          checked={coaMatch === true}
                          onChange={() => setCoaMatch(true)}
                        />
                        Yes
                      </label>
                      <label className="fw-radio-row">
                        <input
                          type="radio"
                          name="coa-match"
                          checked={coaMatch === false}
                          onChange={() => setCoaMatch(false)}
                        />
                        No
                      </label>
                    </div>
                  </div>
                </>
              )}

              <div className="fw-field">
                <span className="fw-field-label">Upload COA</span>
                <span className="fw-field-hint">
                  Provide the COA URL, or upload a photo of the document.
                </span>
                <input
                  type="text"
                  className="fw-input"
                  placeholder="URL to COA: https://..."
                  value={coaUrl}
                  onChange={(e) => setCoaUrl(e.target.value)}
                />
                <div
                  className="fw-upload"
                  onClick={() => handleFileUpload(setCoaFile)}
                  role="button"
                  tabIndex={0}
                >
                  <img src={uploadIcon} alt="" className="fw-upload-icon" />
                  <span className="fw-upload-text">
                    {coaFile ? 'File selected' : 'Click or drag a file here to upload'}
                  </span>
                </div>
              </div>
            </>
          )}

          {currentStep === 6 && (
            <>
              <div className="fw-section-title">
                <span>Proof of Purchase</span>
              </div>

              <div className="fw-field">
                <span className="fw-field-hint">
                  Providing your proof of purchase assists us in protecting the integrity of our test
                  attributions. This is not a requirement, but it does help in the event of vendor
                  claims of misattribution.
                </span>
                <div
                  className="fw-upload"
                  onClick={() => handleFileUpload(setProofFile)}
                  role="button"
                  tabIndex={0}
                >
                  <img src={uploadIcon} alt="" className="fw-upload-icon" />
                  <span className="fw-upload-text">
                    {proofFile ? 'File selected' : 'Click or drag a file here to upload'}
                  </span>
                </div>
              </div>

              <div className="fw-field">
                <span className="fw-field-label">Order Details</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <input
                      type="text"
                      className="fw-input"
                      placeholder="Order ID"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: '1 1 200px', position: 'relative' }}>
                    <input
                      type="text"
                      className="fw-input"
                      placeholder="Order Date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                    />
                    <img
                      src={calendarIcon}
                      alt=""
                      width={22}
                      height={25}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="fw-field">
                <span className="fw-field-label">Number of vials</span>
                <input
                  type="text"
                  className="fw-input"
                  placeholder="1"
                  value={numVials}
                  onChange={(e) => setNumVials(e.target.value)}
                  style={{ maxWidth: 120 }}
                />
              </div>

              <div className="fw-field">
                <span className="fw-field-label">Price per vial</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    className="fw-input"
                    placeholder="$49.99"
                    value={pricePerVial}
                    onChange={(e) => setPricePerVial(e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                  <div style={{ position: 'relative' }}>
                    <select
                      className="fw-input"
                      value={priceCurrency}
                      onChange={(e) => setPriceCurrency(e.target.value)}
                      style={{ paddingRight: 28 }}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                    <img
                      src={dropdownIcon}
                      alt=""
                      width={11}
                      height={6}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 7 && (
            <>
              <div className="fw-section-title">
                <span>Confirm your shipment</span>
              </div>

              <div className="fw-ship-summary">
                {[
                  { label: 'Product', value: productCards[selectedChip] ?? '-' },
                  { label: 'Vendor', value: selectedVendor ?? '-' },
                  { label: 'Form Factor', value: formFactor ?? '-' },
                  { label: 'Batch ID', value: batchId || '-' },
                  { label: 'COA', value: coaFile || coaUrl ? 'Provided' : 'Not provided' },
                  { label: 'Proof of Purchase', value: proofFile ? 'Provided' : 'Not provided' },
                  { label: 'Purchase Details', value: orderId ? `Order ${orderId}` : '-' },
                  { label: 'Satisfaction', value: '-' },
                ].map((row) => (
                  <div key={row.label} className="fw-ship-row">
                    <span className="fw-ship-row-label">{row.label}</span>
                    <span className="fw-ship-row-value">{row.value}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="fw-btn-add-sample"
                onClick={() => {
                  /* stub */
                }}
              >
                <img src={plusIcon} alt="" width={12} height={12} />
                Add Sample
              </button>

              <div className="fw-field">
                <span className="fw-field-label">Check for endotoxin?</span>
                <span className="fw-field-hint">
                  Endotoxin testing is an additional $49. If you would like to add this to your
                  sample, please check the box below.
                </span>
              </div>

              <div className="fw-payment-card">
                <div className="fw-payment-row">
                  <span>Lab Choice</span>
                  <span>Private</span>
                </div>
                <div className="fw-payment-row">
                  <span>Total</span>
                  <span className="fw-payment-total">$0.00 USD</span>
                </div>
              </div>

              <div className="fw-turnaround">16 to 36 days</div>

              {!warningDismissed && (
                <div className="fw-warning-banner">
                  <img src={warningIcon} alt="" className="fw-warning-icon" />
                  <span className="fw-warning-text">
                    Some test options are not compatible and cannot be ordered at the same time.
                    We removed conflicting options from your cart.
                  </span>
                  <button
                    type="button"
                    className="fw-warning-dismiss"
                    onClick={() => setWarningDismissed(true)}
                    aria-label="Dismiss warning"
                  >
                    &times;
                  </button>
                </div>
              )}

              <div className="fw-terms-box">
                {[
                  'I understand turnaround times are not guaranteed and delivery dates are not grounds for a refund.',
                  'I have read and agree to the terms of service and refund policy and acknowledge.',
                  'I do not distribute peptides commercially.',
                ].map((text, i) => (
                  <label key={i} className="fw-checkbox-row">
                    <input
                      type="checkbox"
                      checked={termsAccepted[i]}
                      onChange={() => {
                        const next = [...termsAccepted]
                        next[i] = !next[i]
                        setTermsAccepted(next)
                      }}
                    />
                    {text}
                  </label>
                ))}
                <label className="fw-checkbox-row">
                  <input
                    type="checkbox"
                    checked={newsletterOptIn}
                    onChange={() => setNewsletterOptIn((v) => !v)}
                  />
                  Sign me up for the PeptiTrace newsletter
                </label>
              </div>

              <div className="fw-footer-links">
                <a href="/terms">Terms of Service</a>
                <a href="/privacy">Privacy Policy</a>
                <a href="/support">Support</a>
              </div>
            </>
          )}

          <FormNavNextBack
            onBack={currentStep > 1 ? goBack : undefined}
            onNext={goNext}
            nextLabel={currentStep === 7 ? 'Register Shipment' : 'Next'}
            showSkip={currentStep === 6}
            onSkip={currentStep === 6 ? goNext : undefined}
          />
        </div>
      </div>
    </div>
  )
}
