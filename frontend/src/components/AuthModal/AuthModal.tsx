import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretRight } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import { navigate } from '../../lib/navigation'
import { supabase } from '../../lib/supabase'
import './AuthModal.css'
import closeIcon from '../../assets/auth/close.svg'
import googleIcon from '../../assets/auth/google.png'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { login } = useAuth()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setStep('email')
      setEmail('')
      setCode('')
      setError('')
      setSubmitting(false)
      return undefined
    }

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
  }, [onClose, open])

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError('')
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: true },
      })
      if (otpError) {
        throw otpError
      }
      setStep('code')
    } catch {
      setError('Could not send the sign-in code. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCodeSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError('')
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: trimmed,
        type: 'email',
      })
      if (verifyError || !data.session) {
        throw verifyError ?? new Error('No session')
      }
      const result = await login(data.session.access_token)
      onClose()
      if (result?.isNewAccount) {
        navigate('/account')
      }
    } catch {
      setError('That code did not work. Check the code and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="auth-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="auth-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="auth-modal-header">
          <span className="auth-modal-badge">peptrace</span>
          <button type="button" className="auth-close-button" aria-label="Close signup modal" onClick={onClose}>
            <img src={closeIcon} alt="" />
          </button>
        </div>

        <div className="auth-title-block">
          <h2 id="auth-modal-title">Login or Sign Up to Access</h2>
          <p>Track batches, review independent lab analytics, and see real peer testing scores.</p>
        </div>

        <div className="auth-social-section" aria-label="Social sign in options">
          <button type="button" className="auth-provider-button auth-google-button">
            <img src={googleIcon} alt="" />
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="auth-divider" aria-hidden="true">
          <span />
          <strong>or</strong>
          <span />
        </div>

        {step === 'email' ? (
          <form className="auth-email-form" onSubmit={handleEmailSubmit}>
            <label htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
            {error ? <p className="auth-error">{error}</p> : null}
            <button type="submit" className="auth-submit-button" disabled={submitting}>
              <span>Continue</span>
              <FontAwesomeIcon icon={faCaretRight} />
            </button>
          </form>
        ) : (
          <form className="auth-email-form" onSubmit={handleCodeSubmit}>
            <label htmlFor="auth-code">Enter the 6-digit code sent to {email.trim()}</label>
            <input
              id="auth-code"
              name="code"
              type="text"
              inputMode="numeric"
              placeholder="123456"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={submitting}
            />
            {error ? <p className="auth-error">{error}</p> : null}
            <button type="submit" className="auth-submit-button" disabled={submitting}>
              <span>Verify &amp; sign in</span>
              <FontAwesomeIcon icon={faCaretRight} />
            </button>
            <button
              type="button"
              className="auth-back-button"
              onClick={() => {
                setStep('email')
                setCode('')
                setError('')
              }}
              disabled={submitting}
            >
              Use a different email
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
