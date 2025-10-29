/**
 * CartSummary - Cart totals and checkout button;
 * Modern implementation with Tailwind;
 */
import { Button } from '@shared/ui/primitives'
import { CreditCard } from 'lucide-react'
import { formatCurrency } from '@shared/lib/format'
import { TAX_RATE, DEFAULT_DELIVERY_FEE } from '@shared/lib/pricing'
import type { CartWithTotals } from '@api/types'

export interface CartSummaryProps {
  cart: CartWithTotals;
  onCheckout: () => void;
}

export function CartSummary({ cart, onCheckout }: CartSummaryProps) {
  const subtotal = Number.parseFloat(cart.subtotal?.toString() || '0')
  const itemCount = cart.itemCount || 0;
  // Calculate delivery fee;
  const deliveryFee = subtotal > 0 ? DEFAULT_DELIVERY_FEE : 0;
  // Calculate tax;
  const tax = subtotal * TAX_RATE;
  // Calculate total;
  const total = subtotal + deliveryFee + tax;
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Order Summary</h2>

      <div className="space-y-2">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>

        {/* Delivery Fee */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Delivery Fee</span>
          <span className="font-medium">{formatCurrency(deliveryFee)}</span>
        </div>

        {/* Tax */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Tax ({(TAX_RATE * 100).toFixed(0)}%)
          </span>
          <span className="font-medium">{formatCurrency(tax)}</span>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-2" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">Total</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <Button
        variant="primary" 
        size="large"
        fullWidth
        onClick={onCheckout}
      >
        <CreditCard className="h-4 w-4" />
        Continue to Payment
      </Button>

      {/* Terms */}
      <p className="text-xs text-center text-muted-foreground">
        By placing your order, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  )
}
