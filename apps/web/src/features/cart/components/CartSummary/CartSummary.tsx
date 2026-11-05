/**
 * CartSummary - what the order costs, as checkout will charge it.
 *
 * Every number comes from the checkout quote (the server's pricing code), never from the cart. Before
 * the shopper picks pickup or delivery, only the subtotal is final; the rest is added at checkout.
 */
import { Link } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import { Button, Spinner } from '@shared/ui/primitives'
import { formatCurrency } from '@shared/lib/format'
import type { CartWithTotals } from '@api/types'
import { useCheckoutQuote, type CheckoutQuote } from '@features/checkout/hooks/useCheckoutQuote'

export interface CartSummaryProps {
  cart: CartWithTotals
  onCheckout: () => void
  /** Known at checkout; without it the summary shows the subtotal and says the rest comes later. */
  deliveryType?: 'PICKUP' | 'DELIVERY'
  tipAmount?: number
  /** The quote, when the parent already has it. */
  quote?: ReturnType<typeof useCheckoutQuote>
}

function Row({ label, value, strong = false }: { readonly label: string; readonly value: string; readonly strong?: boolean }) {
  return (
    <div className={strong ? 'flex items-center justify-between border-t border-border pt-2 text-base font-bold' : 'flex items-center justify-between text-sm'}>
      <span className={strong ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
      <span className={strong ? 'text-foreground' : 'font-medium'}>{value}</span>
    </div>
  )
}

function Breakdown({ quote, itemCount, full }: { readonly quote: CheckoutQuote; readonly itemCount: number; readonly full: boolean }) {
  const items = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
  if (!full) {
    return (
      <>
        <Row label={`Subtotal (${items})`} value={formatCurrency(quote.subtotal)} />
        <p className="text-xs text-muted-foreground">Delivery, tax and fees are added at checkout.</p>
      </>
    )
  }
  return (
    <>
      <Row label={`Subtotal (${items})`} value={formatCurrency(quote.subtotal)} />
      {quote.deliveryType === 'DELIVERY' ? <Row label="Delivery" value={formatCurrency(quote.deliveryFee)} /> : null}
      <Row label="Tax" value={formatCurrency(quote.tax)} />
      {quote.serviceFee > 0 ? <Row label="Service fee" value={formatCurrency(quote.serviceFee)} /> : null}
      {quote.tip > 0 ? <Row label="Tip" value={formatCurrency(quote.tip)} /> : null}
      <Row label="Total" value={formatCurrency(quote.total)} strong />
    </>
  )
}

export function CartSummary({ cart, onCheckout, deliveryType, tipAmount, quote: given }: CartSummaryProps) {
  const own = useCheckoutQuote(cart, { deliveryType: deliveryType ?? 'PICKUP', tipAmount })
  const quote = given ?? own
  const itemCount = cart.itemCount || 0

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Order summary</h2>

      <div className="space-y-2" aria-live="polite">
        {quote.data ? <Breakdown quote={quote.data} itemCount={itemCount} full={deliveryType !== undefined} /> : null}
        {!quote.data && !quote.error ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner size="small" />
            Checking prices…
          </div>
        ) : null}
        {quote.error ? (
          <p role="alert" className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
            {quote.error.message}
          </p>
        ) : null}
      </div>

      <Button variant="primary" size="large" fullWidth onClick={onCheckout} disabled={!quote.data || !!quote.error} className="shadow-sm">
        <CreditCard className="h-4 w-4" />
        Continue to Payment
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By placing your order, you agree to our{' '}
        <Link to="/terms" className="text-primary underline underline-offset-2">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="text-primary underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}
