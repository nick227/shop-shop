/**
 * CheckoutPage - Order checkout and placement with payment
 */
import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCart } from '@shared/hooks/useCart'
import { usePayment } from '@shared/hooks/usePayment'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import { TAX_RATE, DEFAULT_DELIVERY_FEE } from '@shared/lib/pricing'
import { Button, Spinner } from '@shared/ui/primitives'
import { CartSummary } from '@features/cart/components/CartSummary'
import { PaymentSection } from '@features/checkout/components/PaymentSection'
import { styles } from '@shared/lib/tailwind-classes'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { cart, isLoading } = useCart()
  const { createPaymentIntentAsync, isCreatingIntent } = usePayment()
  
  const [deliveryType, setDeliveryType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP')
  const [tip, setTip] = useState('')
  const [currentStep, setCurrentStep] = useState<'details' | 'payment'>('details')

  const createOrderMutation = useMutation({
    mutationFn: async (params: { cartId: string; deliveryType: 'PICKUP' | 'DELIVERY'; tip?: string }) => {
      // Calculate totals from cart
      const subtotal = Number.parseFloat(cart?.subtotal?.toString() || '0')
      const deliveryFee = subtotal > 0 ? DEFAULT_DELIVERY_FEE : 0
      const tax = subtotal * TAX_RATE
      const tipAmount = tip ? Number.parseFloat(tip) : 0
      const totalAmount = subtotal + deliveryFee + tax + tipAmount
      
      return await apiClient.orders().createOrder({
        createOrderRequest: {
          userId: '', // Will be set by backend from auth
          storeId: cart?.storeId || '',
          cartId: params.cartId,
          status: 'PENDING',
          deliveryType: params.deliveryType,
          paymentStatus: 'PENDING',
          subtotal: subtotal.toFixed(2),
          fees: deliveryFee.toFixed(2),
          tax: tax.toFixed(2),
          tip: tipAmount.toFixed(2),
          total: totalAmount.toFixed(2),
          serviceFeePercent: '2.9',
          serviceFeeAmount: (totalAmount * 0.029).toFixed(2),
          netToVendor: (totalAmount * 0.971).toFixed(2),
        }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError?.message)
    },
  })

  // Memoized handlers to prevent recreation on every render
  const handleContinueToPayment = useCallback(() => {
    setCurrentStep('payment')
  }, [])

  const handleBackToDetails = useCallback(() => {
    setCurrentStep('details')
  }, [])

  // Memoized calculations to prevent recalculation on every render
  // MOVED BEFORE EARLY RETURNS - Hooks must be called unconditionally
  const calculations = useMemo(() => {
    const subtotal = Number.parseFloat(cart?.subtotal?.toString() || '0')
    const deliveryFee = subtotal > 0 ? DEFAULT_DELIVERY_FEE : 0
    const tax = subtotal * TAX_RATE
    const tipAmount = tip ? Number.parseFloat(tip) : 0
    const totalAmount = subtotal + deliveryFee + tax + tipAmount
    
    return { subtotal, deliveryFee, tax, tipAmount, totalAmount }
  }, [cart?.subtotal, tip])
  
  const { subtotal, deliveryFee, tax, tipAmount, totalAmount } = calculations

  const handlePayment = async (paymentMethodId?: string) => {
    if (!cart) return

    try {
      // 1. Create order first
      const orderResponse = await createOrderMutation.mutateAsync({
        cartId: cart?.id,
        deliveryType,
        tip: tipAmount > 0 ? tipAmount.toFixed(2) : undefined,
      })
      
      // Extract order ID from response
      const order = { id: (orderResponse as any)?.id || (orderResponse as any)?.data?.id || 'unknown' }

      // 2. If test mode (no payment method), we're done
      if (!paymentMethodId) {
        toast.success('Order placed successfully!')
        navigate('/orders')
        return
      }

      // 3. For real payment, create payment intent
      const paymentIntent = await createPaymentIntentAsync({
        orderId: order.id,
        paymentMethodId,
      })

      // 4. Handle payment confirmation
      if (paymentIntent.status === 'succeeded') {
        toast.success('Order placed and paid successfully!')
        navigate('/orders')
      } else if (paymentIntent.status === 'requires_action') {
        toast.info('Please complete payment authentication')
        // Would redirect to Stripe authentication here
      } else {
        toast.info('Payment ' + paymentIntent.status + ' - check order history')
        navigate('/orders')
      }
    } catch (error: any) {
      const appError = await handleApiError(error)
      toast.error('Payment failed: ' + appError.message + '')
      // Stay on checkout page to allow retry
    }
  }

  // Early returns AFTER all hooks
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="large" />
        <p>Loading checkout...</p>
      </div>
    )
  }

  if (cart?.items?.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h2>Your cart is empty</h2>
          <p>Add items to your cart before checking out.</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Browse Restaurants
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Checkout</h1>
          <div className={styles.steps}>
            <div className={currentStep === 'details' ? styles.stepActive : styles.stepInactive}>
              1. Order Details
            </div>
            <div className={styles.stepDivider}>→</div>
            <div className={currentStep === 'payment' ? styles.stepActive : styles.stepInactive}>
              2. Payment
            </div>
          </div>
        </div>
        <Button variant="ghost" onClick={currentStep === 'payment' ? handleBackToDetails : () => navigate('/cart')}>
          ← {currentStep === 'payment' ? 'Back to Details' : 'Back to Cart'}
        </Button>
      </div>

      <div className={styles.content}>
        {currentStep === 'details' && (
          <div className={styles.formSection}>
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Delivery Method</h2>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  value="PICKUP"
                  checked={deliveryType === 'PICKUP'}
                  onChange={(e) => setDeliveryType(e.target.value as 'PICKUP')}
                />
                <div className={styles.radioLabel}>
                  <strong>Pickup</strong>
                  <span>Pick up your order at the Store</span>
                </div>
              </label>

              <label className={styles.radioOption}>
                <input
                  type="radio"
                  value="DELIVERY"
                  checked={deliveryType === 'DELIVERY'}
                  onChange={(e) => setDeliveryType(e.target.value as 'DELIVERY')}
                  disabled
                />
                <div className={styles.radioLabel}>
                  <strong>Delivery</strong>
                  <span>Coming soon - Address management required</span>
                </div>
              </label>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Add a Tip (Optional)</h2>
            <div className={styles.tipOptions}>
              <Button
                variant={tip === '2.00' ? 'primary' : 'ghost'}
                onClick={() => setTip('2.00')}
                size="small"
              >
                $2
              </Button>
              <Button
                variant={tip === '3.00' ? 'primary' : 'ghost'}
                onClick={() => setTip('3.00')}
                size="small"
              >
                $3
              </Button>
              <Button
                variant={tip === '5.00' ? 'primary' : 'ghost'}
                onClick={() => setTip('5.00')}
                size="small"
              >
                $5
              </Button>
              <input
                type="number"
                placeholder="Custom"
                value={tip}
                onChange={(e) => setTip(e.target?.value)}
                className={styles.customTip}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          </div>
        )}

        <div className={styles.summarySection}>
        {currentStep === 'details' ? (
          <>
            {cart && <CartSummary cart={cart} onCheckout={handleContinueToPayment} />}
            <p className={styles.hint}>
              Review your order, then proceed to payment
            </p>
          </>
        ) : (
          <>
            <PaymentSection
              amount={totalAmount}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              tax={tax}
              tip={tipAmount}
              onPaymentReady={handlePayment}
              isProcessing={createOrderMutation.isPending || isCreatingIntent}
            />
            {(createOrderMutation.isPending || isCreatingIntent) && (
              <div className={styles.submitting}>
                <Spinner size="small" />
                <span>Processing payment...</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </div>
  )
}
