import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretRight, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
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

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { login } = useAuth()
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setStep('email')
      setMode('login')
      setEmail('')
      setPassword('')
      setShowPassword(false)
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

  const handleEmailSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setError('')
    setStep('password')
  }

  const handleGoogleSignIn = async () => {
    setSubmitting(true)
    setError('')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/account` },
    })
    if (oauthError) {
      setError('Google sign-in is unavailable. Please use email instead.')
      setSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!password) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/auth/${mode}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        if (res.status === 401) {
          setError('Incorrect password. Please try again.')
        } else if (res.status === 409) {
          setError('An account with this email already exists. Sign in instead.')
          setMode('login')
        } else {
          setError(data?.error ?? 'Something went wrong. Please try again.')
        }
        return
      }
      const result = await login(data.csrfToken)
      if (!result) {
        setError('Could not finish signing you in. Please try again.')
        return
      }
      onClose()
      if (mode === 'register' || result.isNewAccount) {
        navigate('/account')
      }
    } catch {
      setError('Something went wrong. Please try again.')
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
          <button type="button" className="auth-provider-button auth-google-button" onClick={handleGoogleSignIn} disabled={submitting}>
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
            <button
              type="button"
              className="auth-back-button"
              onClick={() => setMode((current) => current === 'login' ? 'register' : 'login')}
              disabled={submitting}
            >
              {mode === 'login' ? 'New to PepTrace? Create an account' : 'Already have an account? Sign in'}
            </button>
          </form>
        ) : (
          <form className="auth-email-form" onSubmit={handlePasswordSubmit}>
            <label htmlFor="auth-password">
              {mode === 'register'
                ? `Choose a password for ${email.trim()}`
                : `Enter your password for ${email.trim()}`}
            </label>
            <div className="auth-password-field">
              <input
                id="auth-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'At least 12 characters' : 'Your password'}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
              <button
                type="button"
                className="auth-password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            {mode === 'register' ? (
              <p className="auth-hint">No account exists for this email yet — pick a password to create one.</p>
            ) : null}
            {error ? <p className="auth-error">{error}</p> : null}
            <button type="submit" className="auth-submit-button" disabled={submitting}>
              <span>{mode === 'register' ? 'Create account' : 'Sign in'}</span>
              <FontAwesomeIcon icon={faCaretRight} />
            </button>
            <button
              type="button"
              className="auth-back-button"
              onClick={() => {
                setStep('email')
                setPassword('')
                setShowPassword(false)
                setError('')
              }}
              disabled={submitting}
            >
              Use a different email
            </button>
            <button
              type="button"
              className="auth-back-button"
              onClick={() => {
                setMode((current) => current === 'login' ? 'register' : 'login')
                setPassword('')
                setError('')
              }}
              disabled={submitting}
            >
              {mode === 'login' ? 'Create an account instead' : 'Sign in instead'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
