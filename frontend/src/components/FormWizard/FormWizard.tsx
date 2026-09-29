import { useState, useCallback, useEffect } from 'react'
import './FormWizard.css'
import FormProgressSideBar from './FormProgressSideBar'
import FormNavNextBack from './FormNavNextBack'
import AuthModal from '../AuthModal/AuthModal'
import FileUploadField from './FileUploadField'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import checkmarkIcon from '../../assets/icons/231_4156.svg'
import calendarIcon from '../../assets/icons/292_5946.svg'
import lyophilizedImage from '../../assets/formfactor-images/lyophilized.png'
import reconstitutedImage from '../../assets/formfactor-images/reconstituted.png'
import sprayImage from '../../assets/formfactor-images/spray.png'
import capsuleImage from '../../assets/formfactor-images/capsule.png'
import otherImage from '../../assets/formfactor-images/other.png'
import dropdownIcon from '../../assets/icons/293_5968.svg'
import plusIcon from '../../assets/icons/319_840.svg'
import warningIcon from '../../assets/icons/1434_2321.svg'
import { getRequestedPeptideId } from './peptideSlug'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

interface Peptide {
  id: string
  name: string
  testing_price: number | string | null
}

const peptidePrice = (peptide: Peptide): number => Number(peptide.testing_price ?? 0)

const priceLabel = (peptide: Peptide): string => {
  const price = peptidePrice(peptide)
  return price === 0 ? 'FREE' : `$${price.toFixed(2)}`
}

const STORAGE_KEY = 'peptrace.form_wizard'

interface SampleData {
  peptideId: string | null
  lab: string
  addons: string[]
  vendor: string | null
  formFactor: string | null
  batchId: string
  batchProofFile: string | null
  quantityMg: string
  vendorProvidedCOA: boolean | null
  coaWhen: string
  coaOtherText: string
  coaMatch: boolean | null
  coaUrl: string
  coaFile: string | null
  proofFile: string | null
  orderId: string
  orderDate: string
  numVials: string
  pricePerVial: string
  priceCurrency: string
}

const emptySample = (): SampleData => ({
  peptideId: null,
  lab: '',
  addons: [],
  vendor: null,
  formFactor: null,
  batchId: '',
  batchProofFile: null,
  quantityMg: '',
  vendorProvidedCOA: null,
  coaWhen: '',
  coaOtherText: '',
  coaMatch: null,
  coaUrl: '',
  coaFile: null,
  proofFile: null,
  orderId: '',
  orderDate: '',
  numVials: '',
  pricePerVial: '',
  priceCurrency: 'USD',
})

interface SavedWizardState {
  currentStep?: number
  activeSample?: number
  samples?: SampleData[]
  termsAccepted?: boolean[]
  newsletterOptIn?: boolean
  // Legacy flat fields from before multi-sample support.
  selectedPeptideId?: string | null
  selectedLab?: string
  selectedAddons?: string[]
  selectedVendor?: string | null
  formFactor?: string | null
  batchId?: string
  batchProofFile?: string | null
  quantityMg?: string
  vendorProvidedCOA?: boolean | null
  coaWhen?: string
  coaOtherText?: string
  coaMatch?: boolean | null
  coaUrl?: string
  coaFile?: string | null
  proofFile?: string | null
  orderId?: string
  orderDate?: string
  numVials?: string
  pricePerVial?: string
  priceCurrency?: string
}

const loadSavedState = (): SavedWizardState => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as SavedWizardState
    if (!Array.isArray(parsed.samples) || parsed.samples.length === 0) {
      parsed.samples = [
        {
          ...emptySample(),
          peptideId: parsed.selectedPeptideId ?? null,
          lab: parsed.selectedLab ?? '',
          addons: parsed.selectedAddons ?? [],
          vendor: parsed.selectedVendor ?? null,
          formFactor: parsed.formFactor ?? null,
          batchId: parsed.batchId ?? '',
          batchProofFile: parsed.batchProofFile ?? null,
          quantityMg: parsed.quantityMg ?? '',
          vendorProvidedCOA: parsed.vendorProvidedCOA ?? null,
          coaWhen: parsed.coaWhen ?? '',
          coaOtherText: parsed.coaOtherText ?? '',
          coaMatch: parsed.coaMatch ?? null,
          coaUrl: parsed.coaUrl ?? '',
          coaFile: parsed.coaFile ?? null,
          proofFile: parsed.proofFile ?? null,
          orderId: parsed.orderId ?? '',
          orderDate: parsed.orderDate ?? '',
          numVials: parsed.numVials ?? '',
          pricePerVial: parsed.pricePerVial ?? '',
          priceCurrency: parsed.priceCurrency ?? 'USD',
        },
      ]
    }
    return parsed
  } catch {
    return {}
  }
}

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
  { label: 'Lyophilized Powder', value: 'lyophilized', image: lyophilizedImage },
  { label: 'Reconstituted Peptide', value: 'reconstituted', image: reconstitutedImage },
  { label: 'Spray or Liquid', value: 'spray', image: sprayImage },
  { label: 'Capsule or Pill', value: 'capsule', image: capsuleImage },
  { label: 'Other', value: 'other', image: otherImage },
]

const testAddons = [
  {
    id: 'different-lab',
    title: 'Choose a different lab',
    price: 49.99,
    body: 'Select an alternative certified lab for your test.',
    options: ['ABC Labs', 'XYZ Labs', 'Global Lab'],
  },
  {
    id: 'endotoxin',
    title: 'Endotoxin',
    price: 49.0,
    body: 'Perform an test for endotoxin contamination. No need to send an extra vial.',
  },
  {
    id: 'heavy-metals',
    title: 'Heavy metals (Pb, Cd, As, Hg)',
    price: 120.0,
    body: 'Perform an additional test for the following heavy metals: arsenic, lead, cadmium and mercury. No need to send an extra vial.',
  },
  {
    id: 'solvents',
    title: 'Solvents',
    price: 120.0,
    body: 'Perform an additional test for residual solvents contamination. No need to send an extra vial.',
  },
]

export default function FormWizard({ initialStep = 1, onStepChange, onComplete }: FormWizardProps) {
  const { user } = useAuth()
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [savedState] = useState(loadSavedState)
  const [currentStep, setCurrentStep] = useState(() =>
    Math.max(1, Math.min(7, savedState.currentStep ?? initialStep)),
  )

  // Samples: each entry holds every per-sample field gathered in steps 1-6.
  const [samples, setSamples] = useState<SampleData[]>(
    () => savedState.samples ?? [emptySample()],
  )
  const [activeSample, setActiveSample] = useState(() =>
    Math.max(0, Math.min((savedState.samples?.length ?? 1) - 1, savedState.activeSample ?? 0)),
  )
  const sample = samples[activeSample] ?? samples[0]
  const updateSample = useCallback(
    (patch: Partial<SampleData>) => {
      setSamples((prev) => prev.map((s, i) => (i === activeSample ? { ...s, ...patch } : s)))
    },
    [activeSample],
  )

  // Step 1 state
  const [peptides, setPeptides] = useState<Peptide[]>([])
  const [peptidesLoading, setPeptidesLoading] = useState(true)
  const [productSearch, setProductSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE}/peptides`)
      .then((res) => {
        if (!res.ok) throw new Error('Request failed')
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        const list = (data.peptides ?? []) as Peptide[]
        const requestedPeptideId = getRequestedPeptideId(list, typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('slug') : null)
        const firstFree = list.find((p) => peptidePrice(p) === 0) ?? list[0]

        setPeptides(list)
        setPeptidesLoading(false)

        const selectedId = requestedPeptideId ?? firstFree?.id ?? null
        if (selectedId) {
          setSamples((prev) =>
            prev.map((s, index) => {
              if (requestedPeptideId) {
                return index === activeSample ? { ...s, peptideId: requestedPeptideId } : s
              }
              return s.peptideId ? s : { ...s, peptideId: selectedId }
            }),
          )
        }
      })
      .catch(() => {
        if (cancelled) return
        setPeptidesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Step 3 state
  const [vendorSearch, setVendorSearch] = useState('')

  // Step 7 state
  const [warningDismissed, setWarningDismissed] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState<boolean[]>(savedState.termsAccepted ?? [false, false, false])
  const [newsletterOptIn, setNewsletterOptIn] = useState(savedState.newsletterOptIn ?? false)

  // Payment + submission state
  const [showPayment, setShowPayment] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Persist form progress so a refresh doesn't lose it.
  useEffect(() => {
    const state: SavedWizardState = {
      currentStep,
      activeSample,
      samples,
      termsAccepted,
      newsletterOptIn,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [currentStep, activeSample, samples, termsAccepted, newsletterOptIn])

  const goToStep = useCallback(
    (step: number) => {
      const s = Math.max(1, Math.min(7, step))
      setCurrentStep(s)
      onStepChange?.(s)
    },
    [onStepChange],
  )

  const goNext = useCallback(() => {
    // Registration requires an account; gate the first step transition.
    if (currentStep === 1 && !user) {
      setShowAuthGate(true)
      return
    }
    if (currentStep < 7) {
      goToStep(currentStep + 1)
    } else {
      setShowPayment(true)
    }
  }, [currentStep, user, goToStep])

  // After a successful login, close the gate and continue to the next step.
  useEffect(() => {
    if (user && showAuthGate) {
      setAuthModalOpen(false)
      setShowAuthGate(false)
      goToStep(2)
    }
  }, [user, showAuthGate, goToStep])

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      goToStep(currentStep - 1)
    }
  }, [currentStep, goToStep])

  const filteredProducts = peptides
    .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    .sort((a, b) => peptidePrice(a) - peptidePrice(b) || a.name.localeCompare(b.name))

  // Quick-pick chips are the free-testing peptides.
  const freePeptides = peptides.filter((p) => peptidePrice(p) === 0)

  const selectedPeptide = peptides.find((p) => p.id === sample.peptideId) ?? null

  const samplePrice = (s: SampleData): number => {
    const peptide = peptides.find((p) => p.id === s.peptideId)
    const addons = testAddons
      .filter((addon) => s.addons.includes(addon.id))
      .reduce((sum, addon) => sum + addon.price, 0)
    return (peptide ? peptidePrice(peptide) : 0) + addons
  }
  const totalPrice = samples.reduce((sum, s) => sum + samplePrice(s), 0)
  const currentPriceLabel = totalPrice === 0 ? 'FREE' : `$${totalPrice.toFixed(2)}`

  const sampleLabel = (s: SampleData, index: number): string =>
    peptides.find((p) => p.id === s.peptideId)?.name ?? `Sample ${index + 1}`

  const filteredVendors = vendorList.filter((v) =>
    v.toLowerCase().includes(vendorSearch.toLowerCase()),
  )

  const toggleAddon = (id: string) => {
    updateSample({
      addons: sample.addons.includes(id)
        ? sample.addons.filter((a) => a !== id)
        : [...sample.addons, id],
    })
  }

  // Save the current sample as-is and start a fresh one from step 1.
  const addSample = () => {
    const firstFree = peptides.find((p) => peptidePrice(p) === 0) ?? peptides[0]
    const next = emptySample()
    if (firstFree) next.peptideId = firstFree.id
    setSamples((prev) => [...prev, next])
    setActiveSample(samples.length)
    goToStep(1)
  }

  // Remove a sample; the wizard always keeps at least one (blank) sample.
  const deleteSample = (index: number) => {
    const remaining = samples.filter((_, i) => i !== index)
    const next = remaining.length > 0 ? remaining : [emptySample()]
    setSamples(next)
    if (index < activeSample) {
      setActiveSample(activeSample - 1)
    } else if (index === activeSample && activeSample >= next.length) {
      setActiveSample(next.length - 1)
    }
  }

  // Dummy payment is "approved" on click; submit every sample as a shipment.
  const submitShipment = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      await apiFetch('/shipments', {
        method: 'POST',
        body: JSON.stringify({
          newsletterOptIn,
          samples: samples.map((s) => ({
            peptideId: s.peptideId,
            vendor: s.vendor,
            formFactor: s.formFactor,
            batchId: s.batchId,
            batchProofFile: s.batchProofFile,
            quantityMg: s.quantityMg,
            lab: s.lab,
            addons: s.addons,
            vendorProvidedCOA: s.vendorProvidedCOA,
            coaWhen: s.coaWhen,
            coaOtherText: s.coaOtherText,
            coaMatch: s.coaMatch,
            coaUrl: s.coaUrl,
            coaFile: s.coaFile,
            proofFile: s.proofFile,
            orderId: s.orderId,
            orderDate: s.orderDate,
            numVials: s.numVials,
            pricePerVial: s.pricePerVial,
            priceCurrency: s.priceCurrency,
            samplePrice: samplePrice(s),
          })),
        }),
      })
      localStorage.removeItem(STORAGE_KEY)
      onComplete?.()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Could not register the shipment. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
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
            <span className="fw-price-value">{currentPriceLabel}</span>
          </span>
        </div>
      </div>

      <div className="fw-layout">
        <FormProgressSideBar
          steps={steps}
          currentStep={currentStep}
          onStepClick={goToStep}
          price={currentPriceLabel}
          samples={samples.map((s, i) => {
            const price = samplePrice(s)
            return {
              label: sampleLabel(s, i),
              price: price === 0 ? 'FREE' : `$${price.toFixed(2)}`,
            }
          })}
          activeSample={activeSample}
          onSampleClick={setActiveSample}
          onSampleDelete={deleteSample}
        />

        <div className="fw-content">
          {showPayment ? (
            <div className="fw-payment-screen">
              <div className="fw-section-title">
                <span>Payment</span>
              </div>
              <p className="fw-payment-note">
                This is a test payment processor — no card details are needed and no charge will
                be made. A real payment provider will be integrated here later.
              </p>
              <div className="fw-payment-form">
                <div className="fw-field">
                  <span className="fw-field-label">Card number</span>
                  <input
                    type="text"
                    className="fw-input"
                    placeholder="4242 4242 4242 4242"
                    readOnly
                  />
                </div>
                <div className="fw-payment-form-row">
                  <div className="fw-field">
                    <span className="fw-field-label">Expiry</span>
                    <input type="text" className="fw-input" placeholder="12 / 34" readOnly />
                  </div>
                  <div className="fw-field">
                    <span className="fw-field-label">CVC</span>
                    <input type="text" className="fw-input" placeholder="123" readOnly />
                  </div>
                </div>
              </div>
              {submitError && <span className="fw-upload-error">{submitError}</span>}
              <div className="fw-payment-screen-actions">
                <button
                  type="button"
                  className="fw-btn-back"
                  onClick={() => setShowPayment(false)}
                  disabled={submitting}
                >
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  className="fw-btn-next"
                  onClick={() => void submitShipment()}
                  disabled={submitting}
                >
                  <span>
                    {submitting
                      ? 'Processing…'
                      : totalPrice === 0
                        ? 'Complete Registration'
                        : `Pay $${totalPrice.toFixed(2)} USD`}
                  </span>
                </button>
              </div>
            </div>
          ) : showAuthGate ? (
            <div className="fw-auth-gate">
              <span className="fw-auth-gate-title">Login required</span>
              <p className="fw-auth-gate-body">
                You need to be logged in to register a sample for testing. Log in or create an
                account to continue — your progress so far is saved.
              </p>
              <button
                type="button"
                className="fw-auth-gate-button"
                onClick={() => setAuthModalOpen(true)}
              >
                Log in to continue
              </button>
            </div>
          ) : (
            <>
          {currentStep === 1 && (
            <>
              <div className="fw-section-title">
                <span>What product are you sending us?</span>
              </div>

              <div className="fw-chips">
                {freePeptides.map((peptide) => (
                  <button
                    key={peptide.id}
                    type="button"
                    className={`fw-chip ${sample.peptideId === peptide.id ? 'selected' : ''}`}
                    onClick={() => updateSample({ peptideId: peptide.id })}
                  >
                    {peptide.name}
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
                {peptidesLoading ? (
                  <div className="fw-list-row">
                    <span className="fw-list-row-name">Loading products…</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="fw-list-row">
                    <span className="fw-list-row-name">No products found.</span>
                  </div>
                ) : (
                  filteredProducts.map((product, i) => (
                    <div
                      key={product.id}
                      className={`fw-list-row ${sample.peptideId === product.id ? 'selected' : ''} ${i % 2 === 1 ? 'alt' : ''}`}
                      onClick={() => updateSample({ peptideId: product.id })}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="fw-list-row-name">{product.name}</span>
                      <span className="fw-list-row-value">{priceLabel(product)}</span>
                    </div>
                  ))
                )}
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
                    const isSelected = sample.addons.includes(addon.id)
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
                          <span className="fw-test-card-price">${addon.price.toFixed(2)}</span>
                        </div>
                        <p className="fw-test-card-body">{addon.body}</p>
                        {addon.options && (
                          <select
                            className="fw-test-card-select"
                            value={sample.lab}
                            onChange={(e) => {
                              e.stopPropagation()
                              updateSample({ lab: e.target.value })
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
                    className={`fw-list-row ${sample.vendor === vendor ? 'selected' : ''} ${i % 2 === 1 ? 'alt' : ''}`}
                    onClick={() => updateSample({ vendor })}
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
                      className={`fw-form-factor ${sample.formFactor === opt.value ? 'selected' : ''}`}
                      onClick={() => updateSample({ formFactor: opt.value })}
                    >
                      {sample.formFactor === opt.value && (
                        <img
                          src={checkmarkIcon}
                          alt=""
                          className="fw-form-factor-check"
                          width={20}
                          height={20}
                        />
                      )}
                      <img src={opt.image} alt="" className="fw-form-factor-image" />
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
                  value={sample.batchId}
                  onChange={(e) => updateSample({ batchId: e.target.value })}
                />
              </div>

              <div className="fw-field">
                <span className="fw-field-label">Batch Identifier Proof</span>
                <span className="fw-field-hint">
                  Please upload a picture of your batch identifier packaging.
                </span>
                <FileUploadField
                  uploadType="batch-id-proof"
                  value={sample.batchProofFile}
                  onChange={(url) => updateSample({ batchProofFile: url })}
                />
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
                    value={sample.quantityMg}
                    onChange={(e) => updateSample({ quantityMg: e.target.value })}
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
                      checked={sample.vendorProvidedCOA === true}
                      onChange={() => updateSample({ vendorProvidedCOA: true })}
                    />
                    Yes
                  </label>
                  <label className="fw-radio-row">
                    <input
                      type="radio"
                      name="vendor-coa"
                      checked={sample.vendorProvidedCOA === false}
                      onChange={() => updateSample({ vendorProvidedCOA: false })}
                    />
                    No
                  </label>
                </div>
              </div>

              {sample.vendorProvidedCOA === true && (
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
                              checked={sample.coaWhen === opt}
                              onChange={() => updateSample({ coaWhen: opt })}
                            />
                            {opt}
                          </label>
                        ),
                      )}
                    </div>
                    {sample.coaWhen === 'Another way' && (
                      <input
                        type="text"
                        className="fw-input"
                        placeholder="How did you receive the COA?"
                        value={sample.coaOtherText}
                        onChange={(e) => updateSample({ coaOtherText: e.target.value })}
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
                          checked={sample.coaMatch === true}
                          onChange={() => updateSample({ coaMatch: true })}
                        />
                        Yes
                      </label>
                      <label className="fw-radio-row">
                        <input
                          type="radio"
                          name="coa-match"
                          checked={sample.coaMatch === false}
                          onChange={() => updateSample({ coaMatch: false })}
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
                  value={sample.coaUrl}
                  onChange={(e) => updateSample({ coaUrl: e.target.value })}
                />
                <FileUploadField
                  uploadType="coa"
                  value={sample.coaFile}
                  onChange={(url) => updateSample({ coaFile: url })}
                />
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
                <FileUploadField
                  uploadType="purchase-proof"
                  value={sample.proofFile}
                  onChange={(url) => updateSample({ proofFile: url })}
                />
              </div>

              <div className="fw-field">
                <span className="fw-field-label">Order Details</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <input
                      type="text"
                      className="fw-input"
                      placeholder="Order ID"
                      value={sample.orderId}
                      onChange={(e) => updateSample({ orderId: e.target.value })}
                    />
                  </div>
                  <div style={{ flex: '1 1 200px', position: 'relative' }}>
                    <input
                      type="text"
                      className="fw-input"
                      placeholder="Order Date"
                      value={sample.orderDate}
                      onChange={(e) => updateSample({ orderDate: e.target.value })}
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
                  value={sample.numVials}
                  onChange={(e) => updateSample({ numVials: e.target.value })}
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
                    value={sample.pricePerVial}
                    onChange={(e) => updateSample({ pricePerVial: e.target.value })}
                    style={{ maxWidth: 120 }}
                  />
                  <div style={{ position: 'relative' }}>
                    <select
                      className="fw-input"
                      value={sample.priceCurrency}
                      onChange={(e) => updateSample({ priceCurrency: e.target.value })}
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

              <div className="fw-chips">
                {samples.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`fw-chip ${i === activeSample ? 'selected' : ''}`}
                    onClick={() => setActiveSample(i)}
                  >
                    {sampleLabel(s, i)}
                  </button>
                ))}
              </div>

              <div className="fw-ship-summary">
                {[
                  { label: 'Product', value: selectedPeptide?.name ?? '-' },
                  { label: 'Vendor', value: sample.vendor ?? '-' },
                  { label: 'Form Factor', value: sample.formFactor ?? '-' },
                  { label: 'Batch ID', value: sample.batchId || '-' },
                  { label: 'COA', value: sample.coaFile || sample.coaUrl ? 'Provided' : 'Not provided' },
                  { label: 'Proof of Purchase', value: sample.proofFile ? 'Provided' : 'Not provided' },
                  { label: 'Purchase Details', value: sample.orderId ? `Order ${sample.orderId}` : '-' },
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
                onClick={addSample}
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
                  <span className="fw-payment-total">
                    {totalPrice === 0 ? 'FREE' : `$${totalPrice.toFixed(2)} USD`}
                  </span>
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
            onDeleteSample={samples.length > 1 ? () => deleteSample(activeSample) : undefined}
          />
            </>
          )}
        </div>
      </div>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
}
