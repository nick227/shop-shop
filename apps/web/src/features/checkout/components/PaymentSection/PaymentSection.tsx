/**
 * PaymentSection - Payment method selection and processing
 * 
 * NOTE: For production Stripe integration, install:
 * npm install @stripe/stripe-js @stripe/react-stripe-js
 */
import { useState } from 'react'
import { Button, Badge } from '@shared/ui/primitives'
import { env } from '@/env'

export interface PaymentSectionProps {
  readonly amount: number
  readonly subtotal: number
  readonly deliveryFee: number
  readonly tax: number
  readonly tip: number
  readonly onPaymentReady: (paymentMethodId?: string) => void
  readonly onBackToCart?: () => void
  /** Runs Pay flow again after a failure (parent should clear / re-run checkout). */
  readonly onRetryPayment?: () => void
  readonly isProcessing?: boolean
  readonly paymentError?: string
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
}: PaymentSectionProps) {
  const [paymentMethod, setPaymentMethod] = useState<'test' | 'stripe'>('test')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const hasStripeKey = Boolean(env.VITE_STRIPE_PUBLISHABLE_KEY)

  const handlePay = () => {
    if (!agreedToTerms) {
      return
    }
    setShowConfirm(true)
  }

  const handleConfirmPayment = () => {
    setShowConfirm(false)
    
    if (paymentMethod === 'test') {
      // Test mode - proceed without payment method
      onPaymentReady()
    } else {
      // Stripe mode - would integrate Stripe Elements here
      // For now, show message
      alert('Stripe payment integration requires @stripe/react-stripe-js library')
    }
  }

  const handleCancelConfirm = () => {
    setShowConfirm(false)
  }

  return (
    <div className="max-w-7xl mx-auto mb-10">
      <div className="">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Method</h2>
        <div className="">
          <span className="">🔒 Secure Checkout</span>
          <span className="">🛡️ 256-bit Encryption</span>
        </div>
      </div>

      <div className="">
                {/* Test Payment Method */}
        <label htmlFor="payment-method-test" className="" aria-label="Cash on Delivery payment method">
          <div className="">
            <input
              id="payment-method-test"
              type="radio"
              value="test"
              checked={paymentMethod === 'test'}
              onChange={(e) => setPaymentMethod(e.target.value as 'test')}      
              className=""
            />
            <div className="">
              <div className="" />
            </div>
          </div>
          <div className="">
            <div className="">
              <span className="">💵</span>
              <div>
                <strong className="">Cash on Delivery</strong>
                <Badge variant="warning">TEST MODE</Badge>
              </div>
            </div>
            <span className="">
              Pay with cash or card at pickup/delivery
            </span>
          </div>
        </label>

                {/* Stripe Payment Method */}
        {hasStripeKey && (
          <label htmlFor="payment-method-stripe" className="" aria-label="Credit/Debit Card payment method">
            <div className="">
              <input
                id="payment-method-stripe"
                type="radio"
                value="stripe"
                checked={paymentMethod === 'stripe'}
                onChange={(e) => setPaymentMethod(e.target.value as 'stripe')}  
                className=""
              />
              <div className="">
                <div className="" />
              </div>
            </div>
            <div className="">
              <div className="">
                <span className="">💳</span>
                <div>
                  <strong className="">Credit/Debit Card</strong>
                  <Badge variant="success">SECURE</Badge>
                </div>
              </div>
              <span className="">
                Pay securely with Stripe • Visa, Mastercard, Amex
              </span>
            </div>
          </label>
        )}

        {!hasStripeKey && (
          <div className="">
            <p className="">
              ℹ️ Online payment requires VITE_STRIPE_PUBLISHABLE_KEY in .env
            </p>
          </div>
        )}
      </div>

      {/* Stripe Elements would go here when stripe is selected */}
      {paymentMethod === 'stripe' && hasStripeKey && (
        <div className="">
          <div className="">
            <p className="">
              🔧 Stripe Elements integration ready
            </p>
            <p className="">
              Install @stripe/react-stripe-js to enable card input
            </p>
          </div>
        </div>
      )}

      {/* Terms Agreement */}
      <label className="">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
        />
        <span className="">
          I agree to the Terms of Service and Privacy Policy
        </span>
      </label>

      {/* Order Summary in Payment */}
      <div className="">
        <h3 className="text-lg font-bold mb-4">Order Total</h3>
        <div className="">
          <div className="">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="">
            <span>Delivery Fee</span>
            <span>${deliveryFee.toFixed(2)}</span>
          </div>
          <div className="">
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          {tip > 0 && (
            <div className="">
              <span>Tip</span>
              <span>${tip.toFixed(2)}</span>
            </div>
          )}
          <div className="" />
          <div className={` `}>
            <span>Total to Pay</span>
            <span className="">${amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Error Display */}
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

      {/* Payment Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
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
                <span className="">⏳</span> Processing...
              </>
            ) : paymentError ? (
              '🔄 Retry Payment'
            ) : (
              '💳 Pay $' + amount.toFixed(2) + ''
            )}
          </Button>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <button
          type="button"
          className="" 
          onClick={handleCancelConfirm}
          onKeyDown={(e) => e.key === 'Escape' && handleCancelConfirm()}
          aria-label="Close confirmation dialog"
          style={{ background: 'none', border: 'none', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          <div 
            className="" 
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <h3 id="confirm-title" className="">Confirm Payment</h3>
            <p className="">
              You are about to pay <strong>${amount.toFixed(2)}</strong> using{' '}
              {paymentMethod === 'test' ? 'cash on delivery' : 'credit card'}.
            </p>
            <div className="">
              <Button variant="ghost" onClick={handleCancelConfirm}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmPayment}>
                Confirm Payment
              </Button>
            </div>
          </div>
        </button>
      )}
    </div>
  )
}

