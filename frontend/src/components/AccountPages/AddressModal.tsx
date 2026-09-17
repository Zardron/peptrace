import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { loadGooglePlaces } from '../../lib/googleMaps'
import closeIcon from '../../assets/auth/close.svg'

export interface ShippingAddress {
  id: string
  nickname: string
  recipient_name: string
  organization: string | null
  line1: string
  line2: string | null
  city: string
  state: string
  postal_code: string
  country: string
  is_primary: boolean
  created_at: string
}

interface AddressModalProps {
  open: boolean
  address: ShippingAddress | null
  onClose: () => void
  onSaved: () => void
}

const AU_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']

const emptyForm = {
  nickname: '',
  recipient_name: '',
  organization: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
}

export default function AddressModal({ open, address, onClose, onSaved }: AddressModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([])
  const placesRef = useRef<typeof google.maps.places | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) {
      setForm(emptyForm)
      setError('')
      setSubmitting(false)
      setSuggestions([])
      return undefined
    }

    setForm({
      nickname: address?.nickname ?? '',
      recipient_name: address?.recipient_name ?? '',
      organization: address?.organization ?? '',
      line1: address?.line1 ?? '',
      line2: address?.line2 ?? '',
      city: address?.city ?? '',
      state: address?.state ?? '',
      postal_code: address?.postal_code ?? '',
    })

    loadGooglePlaces()
      .then((places) => {
        placesRef.current = places
      })
      .catch(() => {
        placesRef.current = null
      })

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, address, onClose])

  const setField =
    (field: keyof typeof emptyForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
    }

  const handleLine1Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setForm((current) => ({ ...current, line1: value }))

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    if (!value.trim() || !placesRef.current) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const { suggestions: results } =
          await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: value,
            includedRegionCodes: ['au'],
            includedPrimaryTypes: ['address'],
          })
        setSuggestions(results)
      } catch {
        setSuggestions([])
      }
    }, 300)
  }

  const handleSelectSuggestion = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    const prediction = suggestion.placePrediction
    setSuggestions([])
    if (!prediction) {
      return
    }
    try {
      const place = prediction.toPlace()
      await place.fetchFields({ fields: ['addressComponents'] })
      const components = place.addressComponents ?? []
      const get = (type: string) => components.find((component) => component.types.includes(type))
      const street = [get('street_number')?.longText, get('route')?.longText]
        .filter(Boolean)
        .join(' ')
      setForm((current) => ({
        ...current,
        line1: street || prediction.text.text,
        line2: get('subpremise')?.longText ?? current.line2,
        city: get('locality')?.longText ?? get('postal_town')?.longText ?? current.city,
        state: get('administrative_area_level_1')?.shortText ?? current.state,
        postal_code: get('postal_code')?.longText ?? current.postal_code,
      }))
    } catch {
      setForm((current) => ({ ...current, line1: prediction.text.text }))
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (address) {
        await apiFetch(`/account/addresses/${address.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
      } else {
        await apiFetch('/account/addresses', {
          method: 'POST',
          body: JSON.stringify(form),
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the address. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="address-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="address-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="address-modal-header">
          <h2 id="address-modal-title">{address ? 'Edit Address' : 'Add New Address'}</h2>
          <button type="button" className="auth-close-button" aria-label="Close address modal" onClick={onClose}>
            <img src={closeIcon} alt="" />
          </button>
        </div>

        <form className="address-modal-form" onSubmit={handleSubmit}>
          <label className="address-field">
            <span>Nickname</span>
            <input
              value={form.nickname}
              onChange={setField('nickname')}
              placeholder="e.g. Home, Office, Lab"
              required
              disabled={submitting}
            />
          </label>

          <div className="address-field-grid">
            <label className="address-field">
              <span>Recipient Name</span>
              <input
                value={form.recipient_name}
                onChange={setField('recipient_name')}
                autoComplete="name"
                required
                disabled={submitting}
              />
            </label>
            <label className="address-field">
              <span>Organization</span>
              <input
                value={form.organization}
                onChange={setField('organization')}
                autoComplete="organization"
                disabled={submitting}
              />
            </label>
          </div>

          <label className="address-field address-autocomplete-field">
            <span>Street Address</span>
            <input
              value={form.line1}
              onChange={handleLine1Change}
              placeholder="Start typing an Australian address…"
              autoComplete="off"
              required
              disabled={submitting}
            />
            {suggestions.length > 0 ? (
              <ul className="address-suggestions" role="listbox">
                {suggestions.map((suggestion) => {
                  const prediction = suggestion.placePrediction
                  if (!prediction) {
                    return null
                  }
                  return (
                    <li key={prediction.placeId}>
                      <button type="button" onClick={() => handleSelectSuggestion(suggestion)}>
                        <strong>{prediction.mainText?.text ?? prediction.text.text}</strong>
                        <small>{prediction.secondaryText?.text}</small>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </label>

          <label className="address-field">
            <span>Apartment / Suite / Department</span>
            <input
              value={form.line2}
              onChange={setField('line2')}
              disabled={submitting}
            />
          </label>

          <div className="address-field-grid three">
            <label className="address-field">
              <span>City</span>
              <input value={form.city} onChange={setField('city')} required disabled={submitting} />
            </label>
            <label className="address-field">
              <span>State</span>
              <select value={form.state} onChange={setField('state')} required disabled={submitting}>
                <option value="" disabled>
                  Select
                </option>
                {AU_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>
            <label className="address-field">
              <span>Postcode</span>
              <input
                value={form.postal_code}
                onChange={setField('postal_code')}
                inputMode="numeric"
                required
                disabled={submitting}
              />
            </label>
          </div>

          <label className="address-field">
            <span>Country</span>
            <input value="Australia" disabled />
          </label>

          {error ? <p className="settings-feedback error">{error}</p> : null}

          <div className="settings-actions">
            <button type="submit" className="account-pill primary" disabled={submitting}>
              {submitting ? 'Saving…' : address ? 'Save Changes' : 'Add Address'}
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
