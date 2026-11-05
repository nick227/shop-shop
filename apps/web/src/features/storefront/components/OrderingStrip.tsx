/**
 * OrderingStrip - three separate facts, never blended:
 * - whether the store is open now, from its posted hours (information only; no claim without hours);
 * - whether it is taking orders, the same check checkout runs;
 * - how it fulfills: pickup with its preparation time, and delivery, whose time and fee checkout works out.
 */
import { useMemo, useState } from 'react'
import { Bike, ChevronDown, Clock, ShoppingBag } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import type { StorefrontHours, StorefrontOrdering } from '../api'
import { formatClock, hoursStatus } from '../hoursLabel'
import { DELIVERY_AT_CHECKOUT } from '@features/checkout/fulfillment'

export { formatClock } from '../hoursLabel'

const DAYS = [
  ['MON', 'Monday'],
  ['TUE', 'Tuesday'],
  ['WED', 'Wednesday'],
  ['THU', 'Thursday'],
  ['FRI', 'Friday'],
  ['SAT', 'Saturday'],
  ['SUN', 'Sunday'],
] as const

export function OrderingStrip({ ordering, hours }: {
  readonly ordering: StorefrontOrdering
  readonly hours: StorefrontHours | null
}) {
  const [showWeek, setShowWeek] = useState(false)
  const open = useMemo(() => hoursStatus(hours?.week, hours?.timezone ?? null), [hours])

  return (
    <section aria-label="Ordering" className="border-y border-border py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span
            className={cn('h-2.5 w-2.5 rounded-full', ordering.acceptingOrders ? 'bg-emerald-500' : 'bg-muted-foreground')}
            aria-hidden
          />
          {ordering.acceptingOrders ? 'Taking orders' : 'Not taking orders right now'}
        </p>

        {open ? (
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            aria-expanded={showWeek}
            aria-controls="sf-week-hours"
            onClick={() => setShowWeek((shown) => !shown)}
          >
            <Clock className="h-4 w-4" aria-hidden />
            <span className={cn(open.isOpen && 'font-medium text-foreground')}>{open.label}</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', showWeek && 'rotate-180')} aria-hidden />
          </button>
        ) : null}

        <Fulfillment ordering={ordering} />
      </div>

      {ordering.message && !ordering.acceptingOrders ? (
        <p className="mt-3 text-sm text-muted-foreground">{ordering.message}</p>
      ) : null}

      {showWeek && hours?.week ? <WeeklyHours id="sf-week-hours" week={hours.week} /> : null}
    </section>
  )
}

export function WeeklyHours({ week, className, id }: {
  readonly week: NonNullable<StorefrontHours['week']>
  readonly className?: string
  readonly id?: string
}) {
  return (
    <dl id={id} className={cn('mt-3 grid max-w-sm grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm', className)}>
      {DAYS.map(([key, label]) => {
        const day = week[key]
        return (
          <div key={key} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="tabular-nums">
              {!day || day.closed ? 'Closed' : `${formatClock(day.open)} – ${formatClock(day.close)}`}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

function Fulfillment({ ordering }: { readonly ordering: StorefrontOrdering }) {
  const prep = ordering.prepTimeMin > 0 ? ordering.prepTimeMin : null
  return (
    <>
      {ordering.pickupEnabled ? (
        <p className="flex items-center gap-2 text-sm">
          <ShoppingBag className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span>
            <span className="font-medium">Pickup</span>
            {prep ? <span className="text-muted-foreground"> · ready in about {prep} min</span> : null}
          </span>
        </p>
      ) : null}
      {/* Offered only when the store delivers and checkout can take a delivery order. */}
      {ordering.deliveryEnabled && DELIVERY_AT_CHECKOUT ? (
        <p className="flex items-center gap-2 text-sm">
          <Bike className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span>
            <span className="font-medium">Delivery</span>
            {/* Courier time and fee depend on the address; checkout works them out. */}
            <span className="text-muted-foreground"> · time and fee at checkout</span>
          </span>
        </p>
      ) : null}
    </>
  )
}
