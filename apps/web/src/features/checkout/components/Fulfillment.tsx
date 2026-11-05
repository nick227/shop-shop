/**
 * How the shopper gets the order: a Pickup | Delivery choice (only what the store offers), the pickup
 * location or the delivery address, and, when delivery can't happen, why and what to do next.
 */
import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bike, Check, MapPin, Pencil, Plus, ShoppingBag } from 'lucide-react'
import { Button } from '@shared/ui/primitives'
import { cn } from '@shared/lib/cn'
import { formatCurrency } from '@shared/lib/utils/format'
import type { CheckoutQuote, DeliveryAddressDraft, FulfillmentType } from '../hooks/useCheckoutQuote'
import type { SavedAddress } from '../hooks/useAddresses'

export function FulfillmentChoice({ value, onChange, offersPickup, offersDelivery }: {
  readonly value: FulfillmentType
  readonly onChange: (value: FulfillmentType) => void
  readonly offersPickup: boolean
  readonly offersDelivery: boolean
}) {
  const options = [
    offersPickup ? { id: 'PICKUP' as const, label: 'Pickup', icon: ShoppingBag } : null,
    offersDelivery ? { id: 'DELIVERY' as const, label: 'Delivery', icon: Bike } : null,
  ].filter((option): option is NonNullable<typeof option> => option !== null)

  if (options.length === 1) {
    const only = options[0]
    return (
      <p className="flex items-center gap-2 text-sm font-medium">
        <only.icon className="h-4 w-4" aria-hidden />
        {only.label} only at this store
      </p>
    )
  }
  return (
    <div role="radiogroup" aria-label="How you’ll get your order" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            'flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors',
            value === option.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <option.icon className="h-4 w-4" aria-hidden />
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function PickupDetails({ storeName, address, readyInMinutes }: {
  readonly storeName: string
  readonly address: string
  readonly readyInMinutes: number | null
}) {
  return (
    <div className="flex gap-3">
      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="text-sm">
        <p className="font-semibold">{storeName}</p>
        {address ? <p className="text-muted-foreground">{address}</p> : null}
        {readyInMinutes ? <p className="text-muted-foreground">Usually ready in about {readyInMinutes} min</p> : null}
      </div>
    </div>
  )
}

const oneLine = (a: DeliveryAddressDraft) => [a.line1, a.line2, `${a.city}, ${a.state} ${a.postalCode}`].filter(Boolean).join(', ')

/** Saved addresses to pick from in one tap, or a short form for a new one. */
export function DeliveryAddress({ signedIn, saved, selectedId, draft, onSelect, onDraft, onSave, saving }: {
  readonly signedIn: boolean
  readonly saved: readonly SavedAddress[]
  readonly selectedId: string | null
  readonly draft: DeliveryAddressDraft | null
  readonly onSelect: (id: string) => void
  /** A typed address to quote against (not saved yet). */
  readonly onDraft: (draft: DeliveryAddressDraft | null) => void
  readonly onSave: (draft: DeliveryAddressDraft) => Promise<void>
  readonly saving: boolean
}) {
  const [adding, setAdding] = useState(saved.length === 0)
  useEffect(() => {
    if (saved.length === 0) setAdding(true)
  }, [saved.length])

  if (!adding && saved.length > 0) {
    return (
      <div className="space-y-2">
        <ul className="space-y-1.5" aria-label="Saved addresses">
          {saved.map((address) => {
            const selected = address.id === selectedId
            return (
              <li key={address.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(address.id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                    selected ? 'border-foreground' : 'border-border hover:border-foreground/40',
                  )}
                >
                  <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', selected ? 'border-foreground bg-foreground text-background' : 'border-border')}>
                    {selected ? <Check className="h-3 w-3" aria-hidden /> : null}
                  </span>
                  <span className="min-w-0">
                    {address.label ? <span className="block font-semibold">{address.label}</span> : null}
                    <span className="block text-muted-foreground">{oneLine(address)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <Plus className="h-4 w-4" aria-hidden />
          New address
        </button>
      </div>
    )
  }

  return (
    <AddressForm
      initial={draft}
      signedIn={signedIn}
      saving={saving}
      onCancel={saved.length > 0 ? () => setAdding(false) : undefined}
      onUse={(address) => onDraft(address)}
      onSaveAndUse={async (address) => {
        await onSave(address)
        setAdding(false)
      }}
    />
  )
}

const field =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive'

function AddressForm({ initial, signedIn, saving, onCancel, onUse, onSaveAndUse }: {
  readonly initial: DeliveryAddressDraft | null
  readonly signedIn: boolean
  readonly saving: boolean
  readonly onCancel?: () => void
  /** Quote against the address without saving it. */
  readonly onUse: (address: DeliveryAddressDraft) => void
  readonly onSaveAndUse: (address: DeliveryAddressDraft) => Promise<void>
}) {
  const id = useId()
  // Inputs live here so a failed check never clears what the shopper typed.
  const [form, setForm] = useState<DeliveryAddressDraft>(
    initial ?? { line1: '', line2: '', city: '', state: '', postalCode: '', instructions: '' },
  )
  const [save, setSave] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const set = (key: keyof DeliveryAddressDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [key]: key === 'state' ? e.target.value.toUpperCase() : e.target.value }))

  const missing =
    !form.line1.trim() || !form.city.trim() || !/^[A-Za-z]{2}$/.test(form.state.trim()) || !/^\d{5}$/.test(form.postalCode.trim())

  const submit = async () => {
    if (missing) {
      setError('Enter the street, city, two-letter state and 5-digit ZIP.')
      return
    }
    setError(null)
    const clean = {
      line1: form.line1.trim(),
      line2: form.line2?.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      postalCode: form.postalCode.trim(),
      instructions: form.instructions?.trim() || undefined,
    }
    if (!(save && signedIn)) {
      onUse(clean)
      return
    }
    try {
      await onSaveAndUse(clean)
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'The address could not be saved')
    }
  }

  return (
    <form
      className="space-y-3"
      aria-label="Delivery address"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
        <label className="sr-only" htmlFor={`${id}-line1`}>Street address</label>
        <input id={`${id}-line1`} className={field} placeholder="Street address" autoComplete="address-line1" value={form.line1} onChange={set('line1')} aria-invalid={Boolean(error) && !form.line1.trim()} />
        <label className="sr-only" htmlFor={`${id}-line2`}>Apt or unit</label>
        <input id={`${id}-line2`} className={field} placeholder="Apt, unit" autoComplete="address-line2" value={form.line2 ?? ''} onChange={set('line2')} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_6rem] gap-2">
        <label className="sr-only" htmlFor={`${id}-city`}>City</label>
        <input id={`${id}-city`} className={field} placeholder="City" autoComplete="address-level2" value={form.city} onChange={set('city')} aria-invalid={Boolean(error) && !form.city.trim()} />
        <label className="sr-only" htmlFor={`${id}-state`}>State</label>
        <input id={`${id}-state`} className={field} placeholder="TX" maxLength={2} autoComplete="address-level1" value={form.state} onChange={set('state')} aria-invalid={Boolean(error) && !/^[A-Za-z]{2}$/.test(form.state)} />
        <label className="sr-only" htmlFor={`${id}-zip`}>ZIP code</label>
        <input id={`${id}-zip`} className={field} placeholder="ZIP" inputMode="numeric" maxLength={5} autoComplete="postal-code" value={form.postalCode} onChange={set('postalCode')} aria-invalid={Boolean(error) && !/^\d{5}$/.test(form.postalCode)} />
      </div>
      <label className="sr-only" htmlFor={`${id}-notes`}>Delivery instructions</label>
      <textarea
        id={`${id}-notes`}
        className={`${field} h-auto min-h-[2.75rem] py-2.5`}
        rows={2}
        maxLength={280}
        placeholder="Delivery instructions (optional): gate code, where to leave it"
        value={form.instructions ?? ''}
        onChange={set('instructions')}
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={saving} isLoading={saving}>
          Use this address
        </Button>
        {signedIn ? (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
            Save for next time
          </label>
        ) : null}
        {onCancel ? (
          <button type="button" onClick={onCancel} className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}

/** The chosen address, with an obvious way to change it. */
export function ChosenAddress({ address, approximate, onChange }: {
  readonly address: DeliveryAddressDraft
  readonly approximate: boolean
  readonly onChange: () => void
}) {
  return (
    <div className="flex items-start gap-3">
      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
        <p className="text-muted-foreground">
          {address.city}, {address.state} {address.postalCode}
        </p>
        {address.instructions ? <p className="mt-1 text-muted-foreground">“{address.instructions}”</p> : null}
        {approximate ? <p className="mt-1 text-xs text-muted-foreground">Delivery area checked by ZIP code.</p> : null}
      </div>
      <button type="button" onClick={onChange} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        Change
      </button>
    </div>
  )
}

/** Why delivery (or pickup) can't happen, and the next useful step. */
export function Unavailable({ quote, storePath, onPickup, onChangeAddress }: {
  readonly quote: CheckoutQuote
  readonly storePath: string | null
  readonly onPickup?: () => void
  readonly onChangeAddress?: () => void
}) {
  const blocked = quote.blocked
  if (!blocked || blocked.code === 'ADDRESS_REQUIRED') return null
  const delivery = quote.fulfillment.delivery
  const shortBy = !delivery.available ? delivery.shortBy : null
  return (
    <div role="alert" className="space-y-2 rounded-lg bg-amber-500/10 p-3 text-sm">
      <p className="font-medium text-foreground">{blocked.message}</p>
      <div className="flex flex-wrap gap-3">
        {blocked.code === 'BELOW_DELIVERY_MINIMUM' && storePath ? (
          <Link to={storePath} className="font-semibold text-primary hover:underline">
            Add {shortBy ? formatCurrency(shortBy) : 'more'} from the store
          </Link>
        ) : null}
        {(blocked.code === 'OUTSIDE_DELIVERY_AREA' || blocked.code === 'ADDRESS_NOT_FOUND') && onChangeAddress ? (
          <button type="button" onClick={onChangeAddress} className="font-semibold text-primary hover:underline">
            Use a different address
          </button>
        ) : null}
        {quote.fulfillment.pickup.available && onPickup && quote.deliveryType === 'DELIVERY' ? (
          <button type="button" onClick={onPickup} className="font-semibold text-primary hover:underline">
            Switch to pickup
          </button>
        ) : null}
      </div>
    </div>
  )
}
