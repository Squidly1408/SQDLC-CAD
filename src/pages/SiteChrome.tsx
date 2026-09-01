import { Logo } from '../ui/Logo'

/** Shared header used by the landing page and the legal pages. */
export function SiteHeader() {
  return (
    <header className="site-header">
      <a href="#/" className="site-brand">
        <Logo size={24} />
        <span>SQDLC-CAD</span>
      </a>
      <nav className="site-nav">
        <a href="#/app" className="site-nav-cta">
          Launch App
        </a>
      </nav>
    </header>
  )
}

/** Shared footer used by the landing page and the legal pages. */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>© {new Date().getFullYear()} SQDLC-CAD</span>
      <div className="site-footer-links">
        <a href="#/privacy">Privacy Policy</a>
        <a href="#/terms">Terms &amp; Conditions</a>
      </div>
    </footer>
  )
}
