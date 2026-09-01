import { useEffect, useRef, useState } from 'react'
import './HeaderBar.css'
import logoSvg from '../../assets/logo.svg'
import profileIcon from '../../assets/account/profile-icon.png'

interface HeaderBarProps {
  onSignUpClick?: () => void
  accountMode?: boolean
}

export default function HeaderBar({ onSignUpClick, accountMode = false }: HeaderBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!accountOpen) {
      return undefined
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setAccountOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [accountOpen])

  const handleSignUpClick = () => {
    setMobileOpen(false)
    onSignUpClick?.()
  }

  const accountMenu = (
    <div className="account-dropdown" role="menu">
      <a href="/dashboard" role="menuitem" onClick={() => setAccountOpen(false)}>Dashboard</a>
      <a href="/dashboard#shipments" role="menuitem" onClick={() => setAccountOpen(false)}>My Shipments</a>
      <span className="account-dropdown-divider" />
      <a href="/" role="menuitem" onClick={() => setAccountOpen(false)}>Sign out</a>
    </div>
  )

  return (
    <header className={`header-bar ${accountMode ? 'account-mode' : ''}`} ref={headerRef}>
      <div className="header-top">
        <a href="/" className="header-brand">
          <img src={logoSvg} alt="Peptrace" className="header-logo" />
          <div className="header-brand-text">
            <span className="header-brand-title">PEPTRACE</span>
            <span className="header-brand-tagline">What&apos;s actually in the vial</span>
          </div>
        </a>

        <div className="header-navigation desktop-only">
          <nav className="header-nav">
            <a href="/about" className="nav-link">about</a>
            <a href="/news" className="nav-link">news</a>
            <a href="/membership" className="nav-link">membership</a>
          </nav>
          <span className="header-divider" />
          {accountMode ? (
            <div className="account-menu-wrap">
              <button
                type="button"
                className="pill-button solid account-button"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((open) => !open)}
              >
                <span>my account</span>
                <img src={profileIcon} alt="" />
              </button>
              {accountOpen ? accountMenu : null}
            </div>
          ) : (
            <button type="button" className="pill-button solid" onClick={handleSignUpClick}>sign up</button>
          )}
        </div>

        {accountMode ? (
          <div className="account-menu-wrap compact-account-wrap">
            <button
              type="button"
              className="account-avatar-button"
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((open) => !open)}
            >
              <img src={profileIcon} alt="" />
            </button>
            {accountOpen ? accountMenu : null}
          </div>
        ) : (
          <button
            type="button"
            className="menu-toggle mobile-only"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect y="0.5" width="22" height="2.5" rx="1.25" fill="#000" />
              <rect y="7.75" width="22" height="2.5" rx="1.25" fill="#000" />
              <rect y="15" width="22" height="2.5" rx="1.25" fill="#000" />
            </svg>
          </button>
        )}

        {!accountMode ? (
          <button type="button" className="pill-button solid tablet-only" onClick={handleSignUpClick}>sign up</button>
        ) : null}
      </div>

      <nav className={`header-nav-row ${mobileOpen ? 'open' : ''}`}>
        <a href="/rankings" className="nav-pill">rankings</a>
        <a href="/about" className="nav-link">about</a>
        <a href="/news" className="nav-link">news</a>
        <a href="/membership" className="nav-link">membership</a>
      </nav>
    </header>
  )
}
