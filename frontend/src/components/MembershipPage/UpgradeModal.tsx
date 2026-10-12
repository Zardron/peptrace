import { useEffect, useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { apiFetch } from '../../lib/api'
import closeIcon from '../../assets/auth/close.svg'
import './UpgradeModal.css'

export interface UpgradePlan {
  id: 'member' | 'gold'
  title: string
  price: string
  period: string
}

interface UpgradeModalProps {
  plan: UpgradePlan | null
  onClose: () => void
  onUpgraded: () => void
}

interface PaymentSession {
  clientSecret: string
  subscriptionId: string
  publishableKey: string
}

function CheckoutForm({
  plan,
  subscriptionId,
  onDone,
}: {
  plan: UpgradePlan
  subscriptionId: string
  onDone: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setError('')
    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: { return_url: `${window.location.origin}/membership` },
    })
    if (result.error) {
      setError(result.error.message ?? 'The payment could not be completed.')
      setSubmitting(false)
      return
    }
    try {
      await apiFetch('/account/billing/confirm', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId }),
      })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not confirm the payment.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="upgrade-form">
      <PaymentElement />
      {error && <p className="upgrade-error" role="alert">{error}</p>}
      <button type="submit" className="upgrade-pay-button" disabled={!stripe || submitting}>
        {submitting ? 'Processing…' : `Pay ${plan.price} and upgrade`}
      </button>
      <p className="upgrade-fineprint">Billed monthly. Cancel anytime. Payments are processed securely by Stripe.</p>
    </form>
  )
}

export default function UpgradeModal({ plan, onClose, onUpgraded }: UpgradeModalProps) {
  const [session, setSession] = useState<PaymentSession | null>(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!plan) return undefined
    let cancelled = false
    setSession(null)
    setError('')
    setDone(false)
    apiFetch('/account/billing/subscribe', { method: 'POST', body: JSON.stringify({ plan: plan.id }) })
      .then((data) => { if (!cancelled) setSession(data) })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not start the payment.') })

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      cancelled = true
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [plan, onClose])

  const stripePromise = useMemo(
    () => (session ? loadStripe(session.publishableKey) : null),
    [session],
  )

  if (!plan) return null

  return (
    <div className="upgrade-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="upgrade-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="upgrade-header">
          <h2 id="upgrade-title">{done ? 'You are all set' : `Upgrade to ${plan.title}`}</h2>
          <button type="button" className="auth-close-button" aria-label="Close upgrade modal" onClick={onClose}>
            <img src={closeIcon} alt="" />
          </button>
        </div>

        {done ? (
          <div className="upgrade-success">
            <p>Your {plan.title} plan is active. Thanks for supporting independent testing.</p>
            <button type="button" className="upgrade-pay-button" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="upgrade-summary">
              <span>{plan.title}</span>
              <strong>{plan.price}<small>{plan.period}</small></strong>
            </div>
            {error && <p className="upgrade-error" role="alert">{error}</p>}
            {!session && !error && <p className="upgrade-loading">Preparing secure checkout…</p>}
            {session && stripePromise && (
              <Elements
                stripe={stripePromise}
                options={{ clientSecret: session.clientSecret, appearance: { theme: 'stripe' } }}
              >
                <CheckoutForm
                  plan={plan}
                  subscriptionId={session.subscriptionId}
                  onDone={() => {
                    setDone(true)
                    onUpgraded()
                  }}
                />
              </Elements>
            )}
          </>
        )}
      </section>
    </div>
  )
}
