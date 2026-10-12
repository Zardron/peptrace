import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import closeIcon from '../../assets/auth/close.svg'

export interface ManagedVendor {
  id: string
  name: string
  slug: string
}

export interface VendorProduct {
  id: string
  vendorId: string
  peptideId: string | null
  peptideStatus?: 'listed' | 'pending_approval'
  name: string
  peptideName: string | null
  amountMg: number | null
  priceUsd: number | null
  productUrl: string | null
  description: string | null
  inStock: boolean
}

interface ProductModalProps {
  open: boolean
  product: VendorProduct | null
  vendors: ManagedVendor[]
  onClose: () => void
  onSaved: () => void
}

const emptyForm = {
  vendorId: '',
  peptideId: '',
  peptideName: '',
  amountMg: '',
  priceUsd: '',
  productUrl: '',
  description: '',
  inStock: true,
}

export default function ProductModal({ open, product, vendors, onClose, onSaved }: ProductModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [catalog, setCatalog] = useState<Array<{ id: string; name: string }>>([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    apiFetch('/peptides')
      .then((data) => setCatalog(data.peptides ?? []))
      .catch(() => setCatalog([]))
  }, [open])
  useEffect(() => {
    if (!open) {
      setForm(emptyForm)
      setError('')
      setSubmitting(false)
      return undefined
    }

    setForm({
      vendorId: product?.vendorId ?? vendors[0]?.id ?? '',
      peptideId: product?.peptideId ?? '',
      peptideName: product?.peptideName ?? product?.name ?? '',
      amountMg: product?.amountMg?.toString() ?? '',
      priceUsd: product?.priceUsd?.toString() ?? '',
      productUrl: product?.productUrl ?? '',
      description: product?.description ?? '',
      inStock: product?.inStock ?? true,
    })

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, product, vendors, onClose])

  const setField =
    (field: keyof typeof emptyForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
    }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const body = {
      peptideId: form.peptideId || null,
      peptideName: form.peptideName.trim(),
      amountMg: form.amountMg.trim() || null,
      priceUsd: form.priceUsd.trim() || null,
      productUrl: form.productUrl.trim() || null,
      description: form.description.trim() || null,
      inStock: form.inStock,
    }
    try {
      if (product) {
        await apiFetch(`/account/vendor-products/${product.id}`, { method: 'PATCH', body: JSON.stringify(body) })
      } else {
        await apiFetch('/account/vendor-products', {
          method: 'POST',
          body: JSON.stringify({ ...body, vendorId: form.vendorId }),
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the product. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const typedPeptide = form.peptideName.trim()
  const needle = typedPeptide.toLowerCase()
  const matches = catalog.filter((peptide) => peptide.name.toLowerCase().includes(needle)).slice(0, 8)
  const hasExactMatch = catalog.some((peptide) => peptide.name.toLowerCase() === needle)
  const showSuggestions = suggestionsOpen && (matches.length > 0 || typedPeptide !== '')
  const pickPeptide = (name: string, id: string) => {
    setForm((current) => ({ ...current, peptideName: name, peptideId: id }))
    setSuggestionsOpen(false)
  }
  return (
    <div className="address-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="address-modal-card product-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="address-modal-header">
          <h2 id="product-modal-title">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button type="button" className="auth-close-button" aria-label="Close product modal" onClick={onClose}>
            <img src={closeIcon} alt="" />
          </button>
        </div>

        <form className="address-modal-form" onSubmit={handleSubmit}>
          {error && <p className="settings-feedback error" role="alert">{error}</p>}

          <div className="product-field-grid">
            {vendors.length > 1 && !product && (
              <label className="address-field product-field-wide">
                <span>Vendor</span>
                <select value={form.vendorId} onChange={setField('vendorId')} disabled={submitting}>
                  {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
                </select>
              </label>
            )}
            <label className="address-field address-autocomplete-field product-field-wide">
              <span>Peptide</span>
              <input
                value={form.peptideName}
                onChange={(event) => {
                  setForm((current) => ({ ...current, peptideName: event.target.value, peptideId: '' }))
                  setSuggestionsOpen(true)
                }}
                onFocus={() => setSuggestionsOpen(true)}
                onBlur={() => setSuggestionsOpen(false)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape' && showSuggestions) {
                    event.stopPropagation()
                    setSuggestionsOpen(false)
                  }
                }}
                maxLength={120}
                required
                placeholder="e.g. BPC-157"
                autoComplete="off"
                disabled={submitting}
              />
              {showSuggestions ? (
                <ul className="address-suggestions" role="listbox">
                  {matches.map((peptide) => (
                    <li key={peptide.id}>
                      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => pickPeptide(peptide.name, peptide.id)}>
                        {peptide.name}
                      </button>
                    </li>
                  ))}
                  {typedPeptide !== '' && !hasExactMatch ? (
                    <li className="product-suggestion-add">
                      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => pickPeptide(typedPeptide, '')}>
                        Add new product &ldquo;{typedPeptide}&rdquo;
                      </button>
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </label>
            <label className="address-field">
              <span>Amount (mg)</span>
              <input type="number" inputMode="decimal" min="0.01" step="0.01" value={form.amountMg} onChange={setField('amountMg')} disabled={submitting} />
            </label>
            <label className="address-field">
              <span>Price (USD)</span>
              <input type="number" inputMode="decimal" min="0" step="0.01" value={form.priceUsd} onChange={setField('priceUsd')} disabled={submitting} />
            </label>
            <label className="address-field product-field-wide">
              <span>Product link</span>
              <input type="url" placeholder="https://" maxLength={2000} value={form.productUrl} onChange={setField('productUrl')} disabled={submitting} />
            </label>
            <label className="address-field product-field-wide">
              <span>Description</span>
              <textarea rows={3} maxLength={2000} value={form.description} onChange={setField('description')} disabled={submitting} />
            </label>
            <label className="product-stock-field product-field-wide">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(event) => setForm((current) => ({ ...current, inStock: event.target.checked }))}
                disabled={submitting}
              />
              <span>In stock</span>
            </label>
          </div>

          <div className="settings-actions">
            <button type="submit" className="account-pill primary" disabled={submitting}>
              {submitting ? 'Saving…' : product ? 'Save Changes' : 'Add Product'}
            </button>
            <button type="button" className="account-pill secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
