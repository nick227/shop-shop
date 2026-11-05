/** "Would this address get delivery?" against the saved settings, with checkout's own rules. */
import { useEffect, useState } from 'react'
import { Button, Input } from '@shared/ui/primitives'
import { StreetInput } from '@/features/checkout/components/Fulfillment'
import { money, onEnter } from './deliveryCopy'
import { useDeliveryPreview, type DeliveryPreview } from './useDeliveryZones'

function Answer({ result }: { result: DeliveryPreview }) {
  const { eligibility } = result
  if (!eligibility.available) {
    return (
      <p className="text-sm">
        <span className="font-medium text-destructive">No delivery.</span> {eligibility.message}
      </p>
    )
  }
  const parts = [
    eligibility.fee === 0 ? 'Free delivery' : `${money(eligibility.fee)} delivery`,
    eligibility.minimum ? `, ${money(eligibility.minimum)} minimum` : '',
    eligibility.zoneName ? ` (${eligibility.zoneName})` : '',
    eligibility.distanceMiles === null ? '' : ` · ${eligibility.distanceMiles} mi from the store`,
  ]
  return (
    <p className="text-sm">
      <span className="font-medium text-emerald-700 dark:text-emerald-400">Delivers here.</span> {parts.join('')}.
    </p>
  )
}

export function AddressCheck({ storeId, city, state, onResult }: {
  readonly storeId: string
  readonly city: string
  readonly state: string
  readonly onResult: (preview: DeliveryPreview | null) => void
}) {
  const [address, setAddress] = useState({ line1: '', city: city ?? '', state: state ?? '', postalCode: '' })
  // Settings can arrive after the first render; start from the store's own city and state.
  useEffect(() => {
    setAddress((a) => ({ ...a, city: a.city || city || '', state: a.state || state || '' }))
  }, [city, state])
  const preview = useDeliveryPreview(storeId)
  const ready = Boolean(address.line1.trim() && address.city.trim() && address.state.trim() && /^\d{5}/.test(address.postalCode.trim()))
  const check = async () => {
    try {
      onResult(await preview.mutateAsync({ ...address, state: address.state.trim().toUpperCase() }))
    } catch {
      onResult(null)
    }
  }
  const run = () => {
    if (ready) void check()
  }
  const enter = onEnter(run)
  const result = preview.data

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/20 p-4" role="group" aria-label="Check an address">
      <div>
        <p className="text-sm font-medium">Check an address</p>
        <p className="text-xs text-muted-foreground">See what a shopper there gets, using your saved settings.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-[2fr_1fr_4rem_6rem_auto] sm:items-end">
        <div className="space-y-1.5">
          <label htmlFor="delivery-check-street" className="text-sm font-medium">
            Street address
          </label>
          <StreetInput
            id="delivery-check-street"
            value={address.line1}
            invalid={false}
            onType={(line1) => setAddress((a) => ({ ...a, line1 }))}
            onPick={(picked) => setAddress(picked)}
          />
        </div>
        <Input label="City" value={address.city} onKeyDown={enter} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} />
        <Input label="State" value={address.state} maxLength={2} onKeyDown={enter} onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))} />
        <Input
          label="ZIP"
          inputMode="numeric"
          value={address.postalCode}
          maxLength={10}
          onKeyDown={enter}
          onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))}
        />
        <Button type="button" variant="outline" disabled={!ready || preview.isPending} onClick={run}>
          {preview.isPending ? 'Checking…' : 'Check'}
        </Button>
      </div>
      <div aria-live="polite">
        {preview.isError ? <p className="text-sm text-destructive">{preview.error.message}</p> : null}
        {result ? <Answer result={result} /> : null}
        {result?.destination?.approximate ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Placed at the ZIP code’s center because exact address lookup isn’t set up, so an address near the edge may get a different answer.
          </p>
        ) : null}
      </div>
    </div>
  )
}
