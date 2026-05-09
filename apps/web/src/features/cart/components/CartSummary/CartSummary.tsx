/**
 * CartSummary - Cart totals and checkout button;
 * Modern implementation with Tailwind;
 */
import { Link } from 'react-router-dom'
import { Button } from '@shared/ui/primitives'
import { CreditCard } from 'lucide-react'
import { formatCurrency } from '@shared/lib/format'
import { calculateOrderPricing, getPricingBreakdown } from '@shared/lib/utils/pricing'
import type { PricingLineItem } from '@shared/lib/utils/pricing'
import type { CartWithTotals } from '@api/types'

export interface CartSummaryProps {
  cart: CartWithTotals;
  onCheckout: () => void;
}

export function CartSummary({ cart, onCheckout }: CartSummaryProps) {
  const subtotal = Number.parseFloat(cart.subtotal?.toString() || '0')
  const itemCount = cart.itemCount || 0;
  
  // Use pricing utilities for all calculations
  const pricing = calculateOrderPricing({
    subtotal,
    tipPercentage: 0, // Cart summary doesn't include tip
    includeServiceFee: false
  })
  
  const breakdown = getPricingBreakdown(pricing)
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Order Summary</h2>

      <div className="space-y-2 rounded-lg bg-muted/30 p-3">
        {/* Render pricing breakdown */}
        {breakdown.map((item: PricingLineItem, index: number) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className={item.isTotal ? 'text-lg font-bold text-foreground' : (item.isSubtotal ? 'text-muted-foreground' : 'text-muted-foreground')}>
              {item.label}
              {item.isSubtotal && ` (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}
            </span>
            <span className={item.isTotal ? 'text-lg font-bold text-primary' : 'font-medium'}>
              {formatCurrency(item.amount)}
            </span>
          </div>
        ))}
      </div>

      {/* Checkout Button */}
      <Button
        variant="primary" 
        size="large"
        fullWidth
        onClick={onCheckout}
        className="shadow-sm"
      >
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
