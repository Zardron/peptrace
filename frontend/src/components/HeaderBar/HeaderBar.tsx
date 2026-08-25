import { useState } from 'react'
import './HeaderBar.css'
import logoSvg from '../../assets/logo.svg'

interface HeaderBarProps {
  onSignUpClick?: () => void
}

export default function HeaderBar({ onSignUpClick }: HeaderBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignUpClick = () => {
    setMobileOpen(false)
    onSignUpClick?.()
  }

  return (
    <header className="header-bar">
      <div className="header-top">
        <a href="/" className="header-brand">
          <img src={logoSvg} alt="Peptrace" className="header-logo" />
        </a>

        <nav className="header-nav desktop-only">
          <a href="/about" className="nav-link">about</a>
          <a href="/news" className="nav-link">news</a>
          <a href="/membership" className="nav-link">membership</a>
        </nav>

        <div className="header-actions desktop-only">
          <span className="header-divider" />
          <a href="/vendors" className="pill-button outline">vendors</a>
          <button type="button" className="pill-button solid" onClick={handleSignUpClick}>sign up</button>
        </div>

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

        <button type="button" className="pill-button solid tablet-only" onClick={handleSignUpClick}>sign up</button>
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
