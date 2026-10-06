import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './HeaderBar.css'
import promoArrow from '../../assets/arrow-right.svg'
import logoSvg from '../../assets/logo.svg'
import profileIcon from '../../assets/account/profile-icon.png'

interface HeaderBarProps {
  onSignUpClick?: () => void
  activeRoute?: string
}

export default function HeaderBar({ onSignUpClick, activeRoute }: HeaderBarProps) {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const avatarUrl = user?.profile?.avatar_url ?? null

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
      <a href="/" role="menuitem" onClick={() => { setAccountOpen(false); logout(); }}>Sign out</a>
    </div>
  )

  return (
    <header className={`header-bar ${user ? 'account-mode' : ''}`} ref={headerRef}>
      <a href="/testing" className="header-promo-banner">
        <span>Get your free peptide safety test</span>
        <img src={promoArrow} alt="" />
      </a>

      <div className="header-top">
        <a href="/" className="header-brand">
          <img src={logoSvg} alt="Peptrace" className="header-logo" />
        </a>

        <div className="header-navigation desktop-only">
          <nav className="header-nav">
            <a href="/methodology" className={`nav-link ${activeRoute === '/methodology' ? 'active' : ''}`}>methodology</a>
            <a href="/products" className={`nav-link ${activeRoute === '/products' ? 'active' : ''}`}>products</a>
            <a href="/membership" className={`nav-link ${activeRoute === '/membership' ? 'active' : ''}`}>membership</a>
          </nav>
        </div>

        <div className="header-actions non-mobile">
          {!user && (
            <>
              <span className="header-divider" />
              <a href="/vendors" className="pill-button outline">vendors</a>
            </>
          )}
          {user ? (
            <div className="account-menu-wrap">
              <button
                type="button"
                className="pill-button solid account-button"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((open) => !open)}
              >
                <span>my account</span>
                <img src={avatarUrl ?? profileIcon} alt="" className={avatarUrl ? 'header-avatar-photo' : undefined} />
              </button>
              {accountOpen ? accountMenu : null}
            </div>
          ) : (
            <button type="button" className="pill-button solid" onClick={handleSignUpClick}>sign up</button>
          )}
        </div>

        {user ? (
          <div className="account-menu-wrap compact-account-wrap mobile-only">
            <button
              type="button"
              className="account-avatar-button"
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((open) => !open)}
            >
              <img src={avatarUrl ?? profileIcon} alt="" className={avatarUrl ? 'header-avatar-photo' : undefined} />
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
      </div>

      <nav className={`header-nav-row ${mobileOpen ? 'open' : ''}`}>
        <a href="/vendors" className={`nav-pill ${activeRoute === '/vendors' ? 'active' : ''}`}>vendors</a>
        <a href="/methodology" className={`nav-link ${activeRoute === '/methodology' ? 'active' : ''}`}>methodology</a>
        <a href="/products" className={`nav-link ${activeRoute === '/products' ? 'active' : ''}`}>products</a>
        <a href="/membership" className={`nav-link ${activeRoute === '/membership' ? 'active' : ''}`}>membership</a>
      </nav>
    </header>
  )
}
