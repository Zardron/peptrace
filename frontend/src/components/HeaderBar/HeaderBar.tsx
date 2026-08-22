import './HeaderBar.css';

export interface NavLink {
  label: string;
  href: string;
}

export interface HeaderBarProps {
  navLinks?: NavLink[];
}

const defaultNavLinks: NavLink[] = [
  { label: 'about', href: '/about' },
  { label: 'news', href: '/news' },
  { label: 'membership', href: '/membership' },
];

export function HeaderBar({ navLinks = defaultNavLinks }: HeaderBarProps) {
  return (
    <header className="header-bar">
      <div className="header-bar__logo-group">
        <a href="/" className="header-bar__logo" aria-label="Peptrace home">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="14" cy="14" r="12" stroke="var(--accent)" strokeWidth="2.5" />
            <circle cx="14" cy="14" r="5" fill="var(--accent)" />
          </svg>
          <span className="header-bar__wordmark">PEPTRACE</span>
        </a>
        <span className="header-bar__tagline">What's actually in the vial</span>
      </div>
      <nav className="header-bar__nav" aria-label="Primary">
        <ul className="header-bar__links">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
        <div className="header-bar__divider" aria-hidden="true" />
        <button type="button" className="pill-button">sign up</button>
      </nav>
    </header>
  );
}
