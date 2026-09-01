import { useEffect, useState } from 'react'
import App from './App'
import { LandingPage } from './pages/LandingPage'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { TermsOfService } from './pages/TermsOfService'
import './pages/pages.css'

// Hash-based routing (no router dependency, and no server-side rewrite rules to configure —
// works identically whether this is opened via a static host, a subpath deploy, or a plain
// `vite preview`). '#/app' is the actual editor; everything else is the marketing/legal shell.
function routeFromHash(): string {
  return window.location.hash.replace(/^#\/?/, '')
}

export function Router() {
  const [route, setRoute] = useState(routeFromHash)

  useEffect(() => {
    const onHashChange = () => {
      setRoute(routeFromHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  switch (route) {
    case 'app':
      return <App />
    case 'privacy':
      return <PrivacyPolicy />
    case 'terms':
      return <TermsOfService />
    default:
      return <LandingPage />
  }
}
