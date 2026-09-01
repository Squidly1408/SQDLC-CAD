import { Logo } from '../ui/Logo'
import { SiteHeader, SiteFooter } from './SiteChrome'

const FEATURES: { icon: string; title: string; body: string }[] = [
  {
    icon: '◼',
    title: 'Primitives & booleans',
    body: 'Box, sphere, cylinder, cone, torus, wedge. Mark any shape a Hole and Group to union or subtract it, Tinkercad-style.',
  },
  {
    icon: '⌖',
    title: 'Precision dragging',
    body: 'Move a shape by feel, then lock to an axis and type an exact distance to place it precisely.',
  },
  {
    icon: '▦',
    title: 'Snapping',
    body: 'Shapes snap to nearby edges and centers, and to the grid, while you drag — toggle it on or off anytime.',
  },
  {
    icon: '⟲',
    title: 'Linear & circular arrays',
    body: 'Duplicate a shape along a line or around a center point in a couple of clicks.',
  },
  {
    icon: '⇲',
    title: 'Import & export',
    body: 'Bring in .stl, .obj, .3mf, .step/.stp, or .iges/.igs. Export your scene as .stl or .obj.',
  },
  {
    icon: '📱',
    title: 'Built for touch',
    body: 'A drawer-based layout, pinch-to-zoom orbiting, and larger touch targets make it just as usable on a phone or tablet.',
  },
  {
    icon: '↺',
    title: 'Undo, redo, autosave',
    body: 'Full undo history plus autosave to your browser as you work — a refresh never loses your model.',
  },
  {
    icon: '🔒',
    title: 'Private by design',
    body: 'No account, no server, no tracking. Everything renders, computes, and saves entirely on your own device.',
  },
]

export function LandingPage() {
  return (
    <div className="page-shell">
      <SiteHeader />

      <main>
        <section className="hero">
          <div className="hero-logo">
            <Logo size={56} />
          </div>
          <h1>Free, browser-based 3D modeling.</h1>
          <p className="hero-sub">
            No sign-up. No server. No install. Everything runs and saves entirely on your own
            device — desktop, tablet, or phone.
          </p>
          <a className="cta-button" href="#/app">
            Launch App →
          </a>
        </section>

        <section className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon" aria-hidden="true">
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </section>

        <section className="hero hero-secondary">
          <p className="hero-sub">No install. No sign-up. Just open it and start modeling.</p>
          <a className="cta-button" href="#/app">
            Launch App →
          </a>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
