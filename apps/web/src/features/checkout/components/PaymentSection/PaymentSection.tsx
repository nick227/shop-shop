/**
 * PaymentSection — COD / Stripe Payment Element checkout.
 */
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import { toast } from 'sonner'
import { Button, Badge } from '@shared/ui/primitives'
import {
  StripePaymentFields,
  type StripePaymentFieldsHandle,
} from '@features/checkout/components/StripePaymentFields'
import { getStripePromise, getStripePublishableKey } from '@features/checkout/lib/stripeClient'

export type CheckoutPaymentPayload =
  | { readonly rail: 'CARD'; readonly paymentMethodId: string }
  | { readonly rail: 'COD' }

export interface PaymentSectionProps {
  readonly amount: number
  readonly subtotal: number
  readonly deliveryFee: number
  readonly tax: number
  readonly tip: number
  /** Stripe card (pm_…) or COD when enabled. */
  readonly onPaymentReady: (payload: CheckoutPaymentPayload) => void
  readonly onBackToCart?: () => void
  /** Runs Pay flow again after a failure (parent should clear / re-run checkout). */
  readonly onRetryPayment?: () => void
  readonly isProcessing?: boolean
  readonly paymentError?: string
  /** Mirrors server ENABLE_COD_PAYMENTS — cash on pickup/delivery test flow. */
  readonly enableCod?: boolean
}

export function PaymentSection({
  amount,
  subtotal,
  deliveryFee,
  tax,
  tip,
  onPaymentReady,
  onBackToCart,
  onRetryPayment,
  isProcessing = false,
  paymentError,
  enableCod = false,
}: PaymentSectionProps) {
  const hasStripeKey = Boolean(getStripePublishableKey())
  const [paymentMethod, setPaymentMethod] = useState<'test' | 'stripe'>(() =>
    hasStripeKey ? 'stripe' : enableCod ? 'test' : 'stripe',
  )
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const stripeFieldsRef = useRef<StripePaymentFieldsHandle>(null)

  const stripePromise = getStripePromise()
  const amountCents = Math.round(amount * 100)

  const handlePay = () => {
    if (!agreedToTerms) {
      return
    }
    setShowConfirm(true)
  }

  const handleConfirmPayment = async () => {
    if (paymentMethod === 'test') {
      setShowConfirm(false)
      onPaymentReady({ rail: 'COD' })
      return
    }

    const result = await stripeFieldsRef.current?.confirmPayment()
    if (!result || result.errorMessage) {
      toast.error(result?.errorMessage ?? 'Payment verification failed')
      return
    }

    if (result.paymentMethodId) {
      setShowConfirm(false)
      onPaymentReady({ rail: 'CARD', paymentMethodId: result.paymentMethodId })
    }
  }

  const handleCancelConfirm = () => {
    setShowConfirm(false)
  }

  return (
    <div className="mx-auto mb-10 max-w-7xl space-y-5">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Payment Method</h2>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border bg-muted/30 px-2 py-1">🔒 Secure Checkout</span>
          <span className="rounded-full border border-border bg-muted/30 px-2 py-1">🛡️ 256-bit Encryption</span>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        {enableCod ? (
          <label
            htmlFor="payment-method-test"
            className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/40"
            aria-label="Cash on Delivery payment method"
          >
            <div className="flex items-center gap-3">
              <input
                id="payment-method-test"
                type="radio"
                value="test"
                checked={paymentMethod === 'test'}
                onChange={(e) => setPaymentMethod(e.target.value as 'test')}
                className="h-4 w-4 accent-primary"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">💵</span>
                <div>
                  <strong className="text-sm text-foreground">Cash on Delivery</strong>
                  <Badge variant="warning">COD</Badge>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                Pay at pickup or delivery (must be enabled by the platform).
              </span>
            </div>
          </label>
        ) : null}

        {hasStripeKey && (
          <label
            htmlFor="payment-method-stripe"
            className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/40"
            aria-label="Credit/Debit Card payment method"
          >
            <div className="flex items-center gap-3">
              <input
                id="payment-method-stripe"
                type="radio"
                value="stripe"
                checked={paymentMethod === 'stripe'}
                onChange={(e) => setPaymentMethod(e.target.value as 'stripe')}
                className="h-4 w-4 accent-primary"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">💳</span>
                <div>
                  <strong className="text-sm text-foreground">Credit/Debit Card</strong>
                  <Badge variant="success">SECURE</Badge>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                Pay securely with Stripe • Visa, Mastercard, Amex
              </span>
            </div>
          </label>
        )}

        {!hasStripeKey && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
            <p className="text-sm text-warning-foreground">
              ℹ️ Online card payment requires VITE_STRIPE_PUBLISHABLE_KEY at build time.
            </p>
          </div>
        )}
      </div>

      {paymentMethod === 'stripe' && hasStripeKey && stripePromise && (
        <Elements
          stripe={stripePromise}
          options={{
            mode: 'payment',
            amount: amountCents,
            currency: 'usd',
          }}
        >
          <StripePaymentFields ref={stripeFieldsRef} />
        </Elements>
      )}

      <label className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        <span className="text-sm text-muted-foreground">
          I agree to the{' '}
          <Link to="/terms" className="text-primary underline underline-offset-2 hover:text-primary/90">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-primary underline underline-offset-2 hover:text-primary/90">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 text-lg font-bold text-foreground">Order Total</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Delivery Fee</span>
            <span>${deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          {tip > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Tip</span>
              <span>${tip.toFixed(2)}</span>
            </div>
          )}
          <div className="my-2 h-px w-full bg-border" />
          <div className="flex items-center justify-between text-base font-semibold text-foreground">
            <span>Total to Pay</span>
            <span className="text-primary">${amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {paymentError && (
        <div
          className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm"
          role="alert"
        >
          <p className="text-destructive font-medium mb-1">Payment could not be completed</p>
          <p className="text-destructive/90 text-sm">{paymentError}</p>
          <p className="text-muted-foreground text-xs mt-2">
            You can retry below or return to your cart to change items.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {onBackToCart && (
          <Button
            variant="outline"
            size="large"
            onClick={onBackToCart}
            disabled={isProcessing}
            className="flex-1 sm:flex-none"
          >
            ← Back to Cart
          </Button>
        )}

        {paymentError && onRetryPayment ? (
          <Button
            variant="primary"
            size="large"
            onClick={onRetryPayment}
            disabled={isProcessing}
            className="flex-1"
          >
            🔄 Retry Payment
          </Button>
        ) : (
          <Button
            variant="primary"
            size="large"
            onClick={handlePay}
            disabled={!agreedToTerms || isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <span className="text-base leading-none">⏳</span> Processing...
              </>
            ) : paymentError ? (
              '🔄 Retry Payment'
            ) : (
              '💳 Pay $' + amount.toFixed(2)
            )}
          </Button>
        )}
      </div>

      {showConfirm && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={handleCancelConfirm}
          onKeyDown={(e) => e.key === 'Escape' && handleCancelConfirm()}
          aria-label="Close confirmation dialog"
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <h3 id="confirm-title" className="text-lg font-semibold tracking-tight text-foreground">
              Confirm Payment
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You are about to pay <strong>${amount.toFixed(2)}</strong> using{' '}
              {paymentMethod === 'test' ? 'cash on delivery' : 'credit card'}.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={handleCancelConfirm}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => void handleConfirmPayment()}>
                Confirm Payment
              </Button>
            </div>
          </div>
        </button>
      )}
    </div>
  )
}
