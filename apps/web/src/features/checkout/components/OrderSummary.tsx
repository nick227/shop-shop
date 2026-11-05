/**
 * OrderSummary - the order as checkout will charge it: items, then each charge, then the total.
 * Every number is the server's quote; nothing is calculated here.
 */
import { Spinner } from '@shared/ui/primitives'
import { formatCurrency } from '@shared/lib/utils/format'
import { cn } from '@shared/lib/cn'
import type { CheckoutQuote } from '../hooks/useCheckoutQuote'

function Row({ label, value, strong = false, muted = false }: { readonly label: string; readonly value: string; readonly strong?: boolean; readonly muted?: boolean }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3', strong ? 'text-base font-semibold' : 'text-sm', muted && 'text-muted-foreground')}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}

function Breakdown({ quote, loading }: { readonly quote: CheckoutQuote; readonly loading: boolean }) {
  return (
    <dl className={cn('space-y-1.5 border-t border-border pt-3 transition-opacity', loading && 'opacity-60')}>
      <Row label="Subtotal" value={formatCurrency(quote.subtotal)} muted />
      {quote.deliveryType === 'DELIVERY' && !quote.blocked ? <Row label="Delivery" value={formatCurrency(quote.deliveryFee)} muted /> : null}
      <Row label={quote.taxEstimated ? 'Estimated tax' : 'Tax'} value={formatCurrency(quote.tax)} muted />
      {quote.serviceFee > 0 ? <Row label="Service fee" value={formatCurrency(quote.serviceFee)} muted /> : null}
      {quote.tip > 0 ? <Row label="Tip" value={formatCurrency(quote.tip)} muted /> : null}
      <div className="border-t border-border pt-2">
        <Row label="Total" value={quote.blocked ? '—' : formatCurrency(quote.total)} strong />
      </div>
    </dl>
  )
}

function Lines({ quote }: { readonly quote: CheckoutQuote }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {quote.lines.map((line) => (
        <li key={line.itemId ?? line.bundleId ?? line.title} className="flex justify-between gap-3">
          <span className="min-w-0">
            <span className="tabular-nums text-muted-foreground">{line.quantity}×</span> {line.title}
          </span>
          <span className="tabular-nums">{formatCurrency(line.unitPrice * line.quantity)}</span>
        </li>
      ))}
    </ul>
  )
}

export function OrderSummary({ quote, loading, error, storeName, showItems = true }: {
  readonly quote: CheckoutQuote | undefined
  readonly loading: boolean
  readonly error: Error | null
  readonly storeName?: string
  readonly showItems?: boolean
}) {
  return (
    <section aria-label="Order summary" className="space-y-4" aria-busy={loading}>
      <h2 className="text-base font-semibold">{storeName ? `Your order from ${storeName}` : 'Your order'}</h2>
      {error && !quote ? (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : null}
      {!quote && !error ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner size="small" />
          Checking prices…
        </div>
      ) : null}
      {quote ? (
        <>
          {showItems ? <Lines quote={quote} /> : null}
          <Breakdown quote={quote} loading={loading} />
          {quote.taxEstimated ? <p className="text-xs text-muted-foreground">Tax is an estimate in this environment.</p> : null}
        </>
      ) : null}
    </section>
  )
}
