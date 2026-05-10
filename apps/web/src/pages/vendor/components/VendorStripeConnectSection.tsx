/**
 * Stripe Connect onboarding card — vendors never enter API keys (platform-owned Stripe account).
 * Surfaces four practical states so owners understand why card checkout may still be blocked.
 */
import { Button, Badge } from '@shared/ui/primitives'
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

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">Online payments (Stripe)</h3>
        {phase === 'ready_cards' ? (
          <Badge variant="success">Cards enabled</Badge>
        ) : phase === 'charges_disabled' ? (
          <Badge variant="warning">Charges pending</Badge>
        ) : phase === 'onboarding_incomplete' ? (
          <Badge variant="warning">Onboarding</Badge>
        ) : (
          <Badge variant="warning">Not connected</Badge>
        )}
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
        <p className="font-medium text-foreground">{headline}</p>
        <p className="mt-1 text-muted-foreground">{detail}</p>
      </div>

      <p className="text-sm text-muted-foreground">
        Shop-Shop uses platform-managed Stripe Connect — you never paste secret or publishable keys here. Card checkout
        requires a connected account with <strong className="text-foreground">charges enabled</strong>.
      </p>

      {status?.connected ? (
        <dl className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <div>
            <dt className="font-medium text-foreground">Onboarding submitted</dt>
            <dd>{status.onboarded ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Card charges</dt>
            <dd>{status.chargesEnabled ? 'Enabled' : 'Not enabled'}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Payouts</dt>
            <dd>{status.payoutsEnabled ? 'Enabled' : 'Not enabled'}</dd>
          </div>
        </dl>
      ) : null}

      {due && status?.requirements ? (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
          <p className="font-medium text-foreground">Stripe requirements</p>
          {status.requirements.currentlyDue?.length ? (
            <p>Currently due: {status.requirements.currentlyDue.join(', ')}</p>
          ) : null}
          {status.requirements.eventuallyDue?.length ? (
            <p>Upcoming: {status.requirements.eventuallyDue.join(', ')}</p>
          ) : null}
          {'disabledReason' in status.requirements && status.requirements.disabledReason ? (
            <p>Reason: {String(status.requirements.disabledReason)}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {phase !== 'ready_cards' ? (
          <Button type="button" variant="primary" onClick={() => void handleConnect()} disabled={connectMutation.isPending}>
            {status?.connected ? 'Finish Stripe onboarding' : 'Connect Stripe'}
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
          Refresh status
        </Button>
        {status?.dashboardUrl ? (
          <a
            href={status.dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            Stripe dashboard
          </a>
        ) : null}
      </div>
    </div>
  )
}
