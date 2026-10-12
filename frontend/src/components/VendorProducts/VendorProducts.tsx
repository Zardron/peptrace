import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import AuthModal from '../AuthModal/AuthModal'
import '../VendorSignupForm/VendorSignupForm.css'
import './VendorProducts.css'

interface ManagedVendor {
  id: string
  name: string
  slug: string
}

interface VendorProduct {
  id: string
  vendorId: string
  peptideId: string | null
  name: string
  peptideName: string | null
  amountMg: number | null
  priceUsd: number | null
  productUrl: string | null
  description: string | null
  inStock: boolean
}

interface ProductForm {
  peptideName: string
  amountMg: string
  priceUsd: string
  productUrl: string
  description: string
  inStock: boolean
}

const emptyForm: ProductForm = {
  peptideName: '',
  amountMg: '',
  priceUsd: '',
  productUrl: '',
  description: '',
  inStock: true,
}

const toForm = (product: VendorProduct): ProductForm => ({
  peptideName: product.peptideName ?? product.name,
  amountMg: product.amountMg?.toString() ?? '',
  priceUsd: product.priceUsd?.toString() ?? '',
  productUrl: product.productUrl ?? '',
  description: product.description ?? '',
  inStock: product.inStock,
})

const toBody = (form: ProductForm) => ({
  peptideName: form.peptideName.trim(),
  amountMg: form.amountMg.trim() || null,
  priceUsd: form.priceUsd.trim() || null,
  productUrl: form.productUrl.trim() || null,
  description: form.description.trim() || null,
  inStock: form.inStock,
})

export default function VendorProducts() {
  const { user, isLoading } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [vendors, setVendors] = useState<ManagedVendor[]>([])
  const [products, setProducts] = useState<VendorProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoadError('')
    try {
      const data = await apiFetch('/account/vendor-products')
      setVendors(data.vendors)
      setProducts(data.products)
      setVendorId((current) => current || data.vendors[0]?.id || '')
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load your products.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) void load()
  }, [user, load])

  if (isLoading) return null

  if (!user) {
    return (
      <section className="vendor-signup-form">
        <div className="vendor-signup-card">
          <div className="vendor-title-block">
            <h2 className="vendor-title">Log in to continue</h2>
            <p className="vendor-subtitle">Log in or sign up to manage your vendor products.</p>
          </div>
          <button type="button" className="vendor-cta" onClick={() => setAuthModalOpen(true)}>
            Log in or sign up
          </button>
        </div>
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </section>
    )
  }

  if (loading) return null

  if (vendors.length === 0) {
    return (
      <section className="vendor-signup-form">
        <div className="vendor-signup-card">
          <div className="vendor-title-block">
            <h2 className="vendor-title">Vendor account required</h2>
            <p className="vendor-subtitle">
              {loadError || 'Your account is not linked to an approved vendor yet. Apply to register your business and we will review it.'}
            </p>
          </div>
          <a className="vendor-cta vendor-products-link" href="/vendor-signup">Apply as a vendor</a>
        </div>
      </section>
    )
  }

  const selectedVendor = vendors.find((vendor) => vendor.id === vendorId) ?? vendors[0]!
  const visibleProducts = products.filter((product) => product.vendorId === selectedVendor.id)
  const set = <Key extends keyof ProductForm>(key: Key, value: ProductForm[Key]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const reset = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormError('')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      if (editingId) {
        await apiFetch(`/account/vendor-products/${editingId}`, { method: 'PATCH', body: JSON.stringify(toBody(form)) })
      } else {
        await apiFetch('/account/vendor-products', {
          method: 'POST',
          body: JSON.stringify({ ...toBody(form), vendorId: selectedVendor.id }),
        })
      }
      reset()
      await load()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save the product.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product: VendorProduct) => {
    if (!window.confirm(`Remove ${product.name}?`)) return
    try {
      await apiFetch(`/account/vendor-products/${product.id}`, { method: 'DELETE' })
      if (editingId === product.id) reset()
      await load()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not remove the product.')
    }
  }

  return (
    <section className="vendor-signup-form">
      <div className="vendor-signup-card vendor-products-card">
        <div className="vendor-title-block">
          <h2 className="vendor-title">Your products</h2>
          <p className="vendor-subtitle">List the products {selectedVendor.name} sells on Peptrace.</p>
        </div>

        {vendors.length > 1 && (
          <div className="vendor-field">
            <label className="vendor-label" htmlFor="vendor-products-vendor">Vendor</label>
            <select
              id="vendor-products-vendor"
              className="vendor-input"
              value={selectedVendor.id}
              onChange={(event) => { setVendorId(event.target.value); reset() }}
            >
              {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
            </select>
          </div>
        )}

        {visibleProducts.length > 0 ? (
          <ul className="vendor-products-list">
            {visibleProducts.map((product) => (
              <li key={product.id} className="vendor-products-item">
                <div>
                  <strong>{product.name}</strong>
                  <span>
                    {[
                      product.peptideName,
                      product.amountMg === null ? null : `${product.amountMg} mg`,
                      product.priceUsd === null ? null : `$${product.priceUsd.toFixed(2)}`,
                      product.inStock ? 'In stock' : 'Out of stock',
                    ].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <div className="vendor-products-actions">
                  <button type="button" className="vendor-link" onClick={() => { setEditingId(product.id); setForm(toForm(product)); setFormError('') }}>Edit</button>
                  <button type="button" className="vendor-link" onClick={() => void handleDelete(product)}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="vendor-helper">No products listed yet.</p>
        )}

        <form onSubmit={handleSubmit} className="vendor-form">
          <h3 className="vendor-products-heading">{editingId ? 'Edit product' : 'Add a product'}</h3>
          {formError && <p className="vendor-form-message error" role="alert">{formError}</p>}

          <div className="vendor-field">
            <label className="vendor-label" htmlFor="product-peptide">Peptide <span className="vendor-required">*</span></label>
            <input id="product-peptide" className="vendor-input" maxLength={120} required placeholder="e.g. BPC-157" value={form.peptideName} onChange={(e) => set('peptideName', e.target.value)} />
          </div>
          <div className="vendor-field">
            <label className="vendor-label" htmlFor="product-amount">Amount (mg)</label>
            <input id="product-amount" className="vendor-input" type="number" inputMode="decimal" min="0.01" step="0.01" value={form.amountMg} onChange={(e) => set('amountMg', e.target.value)} />
          </div>
          <div className="vendor-field">
            <label className="vendor-label" htmlFor="product-price">Price (USD)</label>
            <input id="product-price" className="vendor-input" type="number" inputMode="decimal" min="0" step="0.01" value={form.priceUsd} onChange={(e) => set('priceUsd', e.target.value)} />
          </div>
          <div className="vendor-field">
            <label className="vendor-label" htmlFor="product-url">Product link</label>
            <input id="product-url" className="vendor-input" type="url" placeholder="https://" maxLength={2000} value={form.productUrl} onChange={(e) => set('productUrl', e.target.value)} />
          </div>
          <div className="vendor-field">
            <label className="vendor-label" htmlFor="product-description">Description</label>
            <textarea id="product-description" className="vendor-input vendor-products-textarea" maxLength={2000} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="vendor-checkbox-row">
            <label className="vendor-checkbox">
              <input type="checkbox" checked={form.inStock} onChange={(e) => set('inStock', e.target.checked)} />
              <span className="vendor-checkbox-box">
                {form.inStock && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M8.99986 1.00007L3.50001 6.50008L1.00007 4.00007" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </span>
              <span className="vendor-checkbox-label">In stock</span>
            </label>
          </div>

          <button type="submit" className="vendor-cta" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Save product' : 'Add product'}
          </button>
          {editingId && (
            <button type="button" className="vendor-link" onClick={reset}>Cancel editing</button>
          )}
        </form>
      </div>
    </section>
  )
}
