import { useEffect, useRef, useState } from 'react'
import './HeaderBar.css'
import logoIcon from '../../assets/logo-icon.svg'
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
          <img src={logoIcon} alt="Peptrace" className="header-logo" />
          <div className="header-brand-text">
            <span className="header-brand-name">PEPTRACE</span>
            <span className="header-brand-tagline">What's actually in the vial</span>
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
            <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.785714 3.53571H21.2143C21.6482 3.53571 22 3.18396 22 2.75V0.785714C22 0.351754 21.6482 0 21.2143 0H0.785714C0.351754 0 0 0.351754 0 0.785714V2.75C0 3.18396 0.351754 3.53571 0.785714 3.53571ZM0.785714 11.3929H21.2143C21.6482 11.3929 22 11.0411 22 10.6071V8.64286C22 8.2089 21.6482 7.85714 21.2143 7.85714H0.785714C0.351754 7.85714 0 8.2089 0 8.64286V10.6071C0 11.0411 0.351754 11.3929 0.785714 11.3929ZM0.785714 19.25H21.2143C21.6482 19.25 22 18.8982 22 18.4643V16.5C22 16.066 21.6482 15.7143 21.2143 15.7143H0.785714C0.351754 15.7143 0 16.066 0 16.5V18.4643C0 18.8982 0.351754 19.25 0.785714 19.25Z" fill="#000" />
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
