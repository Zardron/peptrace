import { useEffect } from 'react'
import './AuthModal.css'
import closeIcon from '../../assets/auth/close.svg'
import facebookIcon from '../../assets/auth/facebook.png'
import googleIcon from '../../assets/auth/google.png'
import playIcon from '../../assets/auth/play.svg'
import tiktokIcon from '../../assets/auth/tiktok.png'
import xLogoIcon from '../../assets/auth/x-logo.svg'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  useEffect(() => {
    if (!open) {
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
          <span className="auth-modal-badge">PEPTRACE</span>
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

          <div className="auth-social-row">
            <button type="button" className="auth-icon-button" aria-label="Continue with Facebook">
              <img src={facebookIcon} alt="" />
            </button>
            <button type="button" className="auth-icon-button" aria-label="Continue with TikTok">
              <img src={tiktokIcon} alt="" />
            </button>
            <button type="button" className="auth-icon-button" aria-label="Continue with X">
              <img src={xLogoIcon} alt="" />
            </button>
          </div>
        </div>

        <div className="auth-divider" aria-hidden="true">
          <span />
          <strong>or</strong>
          <span />
        </div>

        <form className="auth-email-form" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="auth-email">Email address</label>
          <input
            id="auth-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
          <button type="submit" className="auth-submit-button">
            <span>Continue</span>
            <img src={playIcon} alt="" />
          </button>
        </form>
      </section>
    </div>
  )
}
