import type { ReactNode } from 'react'
import { SiteHeader, SiteFooter } from './SiteChrome'

interface LegalPageProps {
  title: string
  updated: string
  children: ReactNode
}

/** Shared shell for the Privacy Policy and Terms & Conditions pages. */
export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="legal-content">
        <a className="back-link" href="#/">
          ← Back to home
        </a>
        <h1>{title}</h1>
        <p className="legal-updated">Last updated: {updated}</p>
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
