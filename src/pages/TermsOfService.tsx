import { LegalPage } from './LegalPage'

export function TermsOfService() {
  return (
    <LegalPage title="Terms & Conditions" updated="September 1, 2026">
      <p>By using SQDLC-CAD ("the app"), you agree to these terms.</p>

      <h2>What the app is</h2>
      <p>
        SQDLC-CAD is a free, browser-based 3D modeling tool. It runs entirely client-side —
        there's no account, no server, and no cost to use it.
      </p>

      <h2>No warranty</h2>
      <p>
        The app is provided "as is," without warranty of any kind, express or implied,
        including warranties of merchantability, fitness for a particular purpose, or
        accuracy. Geometry produced or imported by the app — including boolean/CSG results and
        STEP/IGES imports — is not guaranteed to be dimensionally exact or suitable for
        manufacturing. Independently verify any model before relying on it for production,
        manufacturing, structural, or safety-critical use.
      </p>

      <h2>Your content</h2>
      <p>
        You retain all rights to the models and files you create, import, or export with the
        app. Because everything runs locally, we never receive a copy of your content in the
        first place. You are solely responsible for backing up your own work — autosave is a
        convenience to protect against an accidental refresh, not a substitute for saving your
        own copies (use Save As) or a durable backup.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Don't use the app to create, import, or export content that infringes someone else's
        intellectual property or other rights, or that violates applicable law.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, the app is provided without liability for any
        damages arising from its use — including, without limitation, data loss, lost profits,
        or damages resulting from a model, export, or import that turns out to be inaccurate.
      </p>

      <h2>Changes</h2>
      <p>
        The app and these terms may change over time. If they change, the "Last updated" date
        above will change with them. Continuing to use the app after an update means you
        accept the revised terms.
      </p>

      <p className="legal-note">
        This is a general template provided for a small, free tool with no server-side
        component — it isn't legal advice. If you're deploying this app commercially or at
        scale, have these terms and the privacy policy reviewed by a lawyer for your specific
        situation and jurisdiction.
      </p>
    </LegalPage>
  )
}
