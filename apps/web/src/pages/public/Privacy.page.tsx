import { LegalShell } from './legal/LegalShell'

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy">
      <p>
        <strong className="text-foreground">Draft placeholder.</strong> Replace with a privacy policy appropriate for your jurisdictions and
        data practices.
      </p>
      <p>
        We collect account and order information needed to operate the marketplace, process payments through our payment provider, and
        communicate about orders you place.
      </p>
    </LegalShell>
  )
}
