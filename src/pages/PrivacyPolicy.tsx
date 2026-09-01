import { LegalPage } from './LegalPage'

export function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" updated="September 1, 2026">
      <p>
        SQDLC-CAD is a browser-based 3D modeling tool with no account system and no backend
        server. This policy explains, plainly, what that means for your data.
      </p>

      <h2>The short version</h2>
      <p>
        We don't collect anything, because there's no server on our end to collect it. Your
        models, your files, and your activity in the app never leave your device.
      </p>

      <h2>What we don't collect</h2>
      <ul>
        <li>No account or sign-up, so no name, email, or password.</li>
        <li>No analytics, no tracking pixels, no advertising identifiers.</li>
        <li>No cookies set by the app itself.</li>
        <li>No copies of your models, projects, or imported/exported files.</li>
      </ul>

      <h2>What stays on your device</h2>
      <p>
        The app autosaves your current project to your browser's local storage (IndexedDB) so
        a refresh doesn't lose your work. That data is written and read entirely by your
        browser, stays on your device, and is never transmitted anywhere. Clearing your
        browser's site data for this app deletes it. Opening, saving, importing, or exporting
        a file goes through your browser's native file picker directly to your own disk —
        again, nothing passes through us.
      </p>

      <h2>If you're using a hosted copy</h2>
      <p>
        If you're using a version of this app hosted online rather than run locally, the
        hosting provider serving the page may log ordinary web server connection information
        (such as IP address and browser user agent) as a routine part of serving any web page —
        that's outside the app's control and governed by that provider's own policies.
        SQDLC-CAD itself has no server component and neither accesses nor uses that
        information.
      </p>

      <h2>Third-party code</h2>
      <p>
        The app is built on open-source libraries (React, three.js, OpenCASCADE.js, and
        others) that run locally in your browser as part of the app. None of them make network
        requests on the app's behalf.
      </p>

      <h2>Children's privacy</h2>
      <p>
        The app isn't directed at children, and since it collects nothing from anyone, it
        doesn't knowingly collect anything from children either.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If this policy changes, the "Last updated" date above will change with it. Continuing
        to use the app after an update means you accept the revised policy.
      </p>
    </LegalPage>
  )
}
