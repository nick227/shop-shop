/**
 * PaymentSection - Payment method selection and processing
 * 
 * NOTE: For production Stripe integration, install:
 * npm install @stripe/stripe-js @stripe/react-stripe-js
 */
import { useState } from 'react'
import { Button, Badge } from '@shared/ui/primitives'
import { env } from '@/env'
import styles from './PaymentSection.module.css'

export interface PaymentSectionProps {
  readonly amount: number
  readonly subtotal: number
  readonly deliveryFee: number
  readonly tax: number
  readonly tip: number
  readonly onPaymentReady: (paymentMethodId?: string) => void
  readonly isProcessing?: boolean
}

export function PaymentSection({ amount, subtotal, deliveryFee, tax, tip, onPaymentReady, isProcessing = false }: PaymentSectionProps) {
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
    <div className={styles.section}>
      <div className={styles.headerSection}>
        <h2 className={styles.title}>Payment Method</h2>
        <div className={styles.securityBadges}>
          <span className={styles.securityBadge}>🔒 Secure Checkout</span>
          <span className={styles.securityBadge}>🛡️ 256-bit Encryption</span>
        </div>
      </div>

      <div className={styles.methods}>
                {/* Test Payment Method */}
        <label htmlFor="payment-method-test" className={styles.methodOption} aria-label="Cash on Delivery payment method">
          <div className={styles.radioContainer}>
            <input
              id="payment-method-test"
              type="radio"
              value="test"
              checked={paymentMethod === 'test'}
              onChange={(e) => setPaymentMethod(e.target.value as 'test')}      
              className={styles.radioInput}
            />
            <div className={styles.radioCustom}>
              <div className={styles.radioInner} />
            </div>
          </div>
          <div className={styles.methodContent}>
            <div className={styles.methodHeader}>
              <span className={styles.methodIcon}>💵</span>
              <div>
                <strong className={styles.methodName}>Cash on Delivery</strong>
                <Badge variant="warning">TEST MODE</Badge>
              </div>
            </div>
            <span className={styles.methodDesc}>
              Pay with cash or card at pickup/delivery
            </span>
          </div>
        </label>

                {/* Stripe Payment Method */}
        {hasStripeKey && (
          <label htmlFor="payment-method-stripe" className={styles.methodOption} aria-label="Credit/Debit Card payment method">
            <div className={styles.radioContainer}>
              <input
                id="payment-method-stripe"
                type="radio"
                value="stripe"
                checked={paymentMethod === 'stripe'}
                onChange={(e) => setPaymentMethod(e.target.value as 'stripe')}  
                className={styles.radioInput}
              />
              <div className={styles.radioCustom}>
                <div className={styles.radioInner} />
              </div>
            </div>
            <div className={styles.methodContent}>
              <div className={styles.methodHeader}>
                <span className={styles.methodIcon}>💳</span>
                <div>
                  <strong className={styles.methodName}>Credit/Debit Card</strong>
                  <Badge variant="success">SECURE</Badge>
                </div>
              </div>
              <span className={styles.methodDesc}>
                Pay securely with Stripe • Visa, Mastercard, Amex
              </span>
            </div>
          </label>
        )}

        {!hasStripeKey && (
          <div className={styles.infoBox}>
            <p className={styles.infoText}>
              ℹ️ Online payment requires VITE_STRIPE_PUBLISHABLE_KEY in .env
            </p>
          </div>
        )}
      </div>

      {/* Stripe Elements would go here when stripe is selected */}
      {paymentMethod === 'stripe' && hasStripeKey && (
        <div className={styles.stripeContainer}>
          <div className={styles.placeholderCard}>
            <p className={styles.placeholderText}>
              🔧 Stripe Elements integration ready
            </p>
            <p className={styles.placeholderSubtext}>
              Install @stripe/react-stripe-js to enable card input
            </p>
          </div>
        </div>
      )}

      {/* Terms Agreement */}
      <label className={styles.termsCheckbox}>
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
        />
        <span className={styles.termsText}>
          I agree to the Terms of Service and Privacy Policy
        </span>
      </label>

      {/* Order Summary in Payment */}
      <div className={styles.orderSummary}>
        <h3 className={styles.summaryTitle}>Order Total</h3>
        <div className={styles.summaryRows}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Delivery Fee</span>
            <span>${deliveryFee.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          {tip > 0 && (
            <div className={styles.summaryRow}>
              <span>Tip</span>
              <span>${tip.toFixed(2)}</span>
            </div>
          )}
          <div className={styles.summaryDivider} />
          <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
            <span>Total to Pay</span>
            <span className={styles.totalAmount}>${amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <Button
        variant="primary"
        size="large"
        onClick={handlePay}
        disabled={!agreedToTerms || isProcessing}
        className={styles.payButton}
      >
        {isProcessing ? (
          <>
            <span className={styles.spinner}>⏳</span> Processing...
          </>
        ) : (
          '💳 Pay $' + amount.toFixed(2) + ''
        )}
      </Button>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <button
          type="button"
          className={styles.confirmOverlay} 
          onClick={handleCancelConfirm}
          onKeyDown={(e) => e.key === 'Escape' && handleCancelConfirm()}
          aria-label="Close confirmation dialog"
          style={{ background: 'none', border: 'none', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          <div 
            className={styles.confirmDialog} 
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <h3 id="confirm-title" className={styles.confirmTitle}>Confirm Payment</h3>
            <p className={styles.confirmText}>
              You are about to pay <strong>${amount.toFixed(2)}</strong> using{' '}
              {paymentMethod === 'test' ? 'cash on delivery' : 'credit card'}.
            </p>
            <div className={styles.confirmActions}>
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

