/**
 * Stripe Connect onboarding card — vendors never enter API keys (platform-owned Stripe account).
 * Surfaces four practical states so owners understand why card checkout may still be blocked.
 */
import { Button } from '@shared/ui/primitives'
import { useStripeConnect, useStripeConnectStatus } from '@shared/hooks/hooks/usePayments'

export interface VendorStripeConnectSectionProps {
  readonly storeId: string
}

type VendorStripePhase =
  | 'not_connected'
  | 'onboarding_incomplete'
  | 'charges_disabled'
  | 'ready_cards'

function resolvePhase(status: {
  connected?: boolean
  onboarded?: boolean
  chargesEnabled?: boolean
}): VendorStripePhase {
  if (!status.connected) return 'not_connected'
  if (!status.onboarded) return 'onboarding_incomplete'
  if (!status.chargesEnabled) return 'charges_disabled'
  return 'ready_cards'
}

export function VendorStripeConnectSection({ storeId }: VendorStripeConnectSectionProps) {
  const connectMutation = useStripeConnect()
  const { data: status, refetch, isFetching } = useStripeConnectStatus(storeId)

  const handleConnect = async () => {
    const res = await connectMutation.mutateAsync(storeId)
    if (res?.onboardingUrl) {
      window.location.href = res.onboardingUrl
    }
  }

  const phase = status ? resolvePhase(status) : 'not_connected'

  const due =
    (status?.requirements?.currentlyDue?.length ?? 0) > 0 ||
    (status?.requirements?.eventuallyDue?.length ?? 0) > 0

  const headline =
    phase === 'not_connected'
      ? 'Not connected — customers cannot pay by card online yet'
      : phase === 'onboarding_incomplete'
        ? 'Onboarding incomplete — finish Stripe to enable card payments'
        : phase === 'charges_disabled'
          ? 'Connected — card charges not enabled yet (check Stripe requirements)'
          : 'Ready — online card payments enabled'

  const detail =
    phase === 'not_connected'
      ? 'Click Connect Stripe to create your Express account and add payout details.'
      : phase === 'onboarding_incomplete'
        ? 'Stripe still needs information before charges can go live. Use “Finish Stripe onboarding” or open the Stripe dashboard.'
        : phase === 'charges_disabled'
          ? 'Your account is linked, but Stripe has not enabled charges yet. Complete any outstanding requirements or check the Stripe dashboard for restrictions.'
          : 'Customers can check out with a card; payments route to your connected account minus the platform fee.'

  const requirements = [
    status?.requirements?.currentlyDue?.length
      ? `Stripe needs: ${status.requirements.currentlyDue.join(', ')}`
      : '',
    status?.requirements?.eventuallyDue?.length
      ? `Upcoming: ${status.requirements.eventuallyDue.join(', ')}`
      : '',
    status?.requirements && 'disabledReason' in status.requirements && status.requirements.disabledReason
      ? `Reason: ${String(status.requirements.disabledReason)}`
      : '',
  ].filter(Boolean)

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Card payments</h3>
      <p className="text-sm text-foreground">{headline}</p>
      <p className="text-sm text-muted-foreground">{detail}</p>

      {status?.connected ? (
        <p className="text-sm text-muted-foreground">
          Onboarding {status.onboarded ? 'submitted' : 'not submitted'}
          {' · '}
          Charges {status.chargesEnabled ? 'enabled' : 'not enabled'}
          {' · '}
          Payouts {status.payoutsEnabled ? 'enabled' : 'not enabled'}
        </p>
      ) : null}

      {due && requirements.length > 0 ? (
        <p className="text-sm text-foreground">{requirements.join('. ')}.</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {phase !== 'ready_cards' ? (
          <Button type="button" variant="primary" size="small" onClick={() => void handleConnect()} disabled={connectMutation.isPending}>
            {status?.connected ? 'Finish Stripe onboarding' : 'Connect Stripe'}
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="small" onClick={() => void refetch()} disabled={isFetching}>
          Refresh status
        </Button>
        {status?.dashboardUrl ? (
          <a
            href={status.dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground hover:bg-accent"
          >
            Stripe dashboard
          </a>
        ) : null}
      </div>
    </section>
  )
}
