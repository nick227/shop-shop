/**
 * CheckoutPage - Order checkout and placement with payment
 */
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useCart } from '@shared/hooks/hooks/useCart'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import { calculateOrderPricing } from '@shared/lib/utils/pricing'
type CreateCheckoutSessionResponse = Awaited<ReturnType<typeof apiClient.checkout.createSession>>
type CompleteCheckoutResponse = Awaited<ReturnType<typeof apiClient.checkout.complete>>
import { Button, Spinner } from '@shared/ui/primitives'
import { TipPrompt } from '@features/checkout/components/TipPrompt'
import { DeliveryModeSelector, type DeliveryMode } from '@features/checkout/components/DeliveryModeSelector'
import { CartSummary } from '@features/cart/components/CartSummary/CartSummary'
import {
  PaymentSection,
  type CheckoutPaymentPayload,
} from '@features/checkout/components/PaymentSection/PaymentSection'
import { OrderDetailsCard } from '@features/orders/components/OrderDetailsCard'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { PageShell } from '@shared/ui/layout/PageShell'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { Card, CardHeader, CardTitle, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { ActionCard } from '@shared/ui/primitives/ui/ActionCard/ActionCard'
import { ShoppingCart, ArrowLeft } from 'lucide-react'
import {
  clearPendingOrderForCheckout,
  getPendingOrderForCart,
  setPendingOrderForCart,
} from '@shared/lib/checkoutPendingOrder'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { cart, isLoading, clearCart } = useCart()
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false)
  
  const [deliveryType, setDeliveryType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP')
  const [deliveryMode, setDeliveryMode] = useState<'PICKUP' | 'STORE_MANAGED_DELIVERY' | 'PLATFORM_DRIVER' | 'THIRD_PARTY_PROVIDER'>('PICKUP')
  const [tip, setTip] = useState('')
  const [currentStep, setCurrentStep] = useState<'details' | 'payment'>('details')
  const [paymentError, setPaymentError] = useState<string | undefined>()

  useEffect(() => {
    setPaymentError(undefined)
  }, [location.pathname])

  const finalizeSuccessfulCheckout = useCallback(() => {
    clearPendingOrderForCheckout()
    clearCart()
    queryClient.invalidateQueries({ queryKey: ['cart'] })
    queryClient.invalidateQueries({ queryKey: ['carts'] })
    queryClient.invalidateQueries({ queryKey: ['orders'] })
  }, [clearCart, queryClient])

  // Memoized handlers to prevent recreation on every render
  const handleContinueToPayment = useCallback(() => {
    setCurrentStep('payment')
  }, [])

  const handleBackToDetails = useCallback(() => {
    setCurrentStep('details')
    setPaymentError(undefined) // Clear error when going back
  }, [])

  const handleBackToCart = useCallback(() => {
    setPaymentError(undefined)
    navigate('/cart')
  }, [navigate])

  // Memoized calculations using pricing utilities
  const calculations = useMemo(() => {
    const subtotal = Number.parseFloat(cart?.subtotal?.toString() || '0')
    const tipPercentage = tip && subtotal > 0 ? Number.parseFloat(tip) / subtotal : 0
    const pricing = calculateOrderPricing({
      subtotal,
      tipPercentage,
      includeServiceFee: false
    })
    
    return { 
      subtotal, 
      deliveryFee: pricing.deliveryFee, 
      tax: pricing.tax, 
      tipAmount: pricing.tip, 
      totalAmount: pricing.total 
    }
  }, [cart?.subtotal, tip])
  
  const { subtotal, deliveryFee, tax, tipAmount, totalAmount } = calculations

  const enableCod = import.meta.env.VITE_ENABLE_COD_PAYMENTS === 'true'
  const lastPaymentPayloadRef = useRef<CheckoutPaymentPayload | null>(null)

  const createCheckoutSession = useCallback(
    async (payload: CheckoutPaymentPayload): Promise<CreateCheckoutSessionResponse> => {
      if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
        throw new Error('Cart is empty')
      }
      const token = payload.rail === 'COD' ? 'cod' : payload.paymentMethodId
      return apiClient.checkout.createSession({
        items: cart.items.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
        })),
        deliveryType,
        deliveryMode,
        paymentMethod: {
          type: payload.rail === 'COD' ? 'DIGITAL_WALLET' : 'CREDIT_CARD',
          token,
        },
        ...(tipAmount > 0 ? { tipAmount } : {}),
      })
    },
    [cart, deliveryType, deliveryMode, tipAmount],
  )

  const completeCheckoutSession = useCallback(
    async (sessionId: string, payload: CheckoutPaymentPayload): Promise<CompleteCheckoutResponse> => {
      const token = payload.rail === 'COD' ? 'cod' : payload.paymentMethodId
      const affiliateReferralCode = localStorage.getItem('affiliateReferralCode') || undefined
      return apiClient.checkout.complete({
        sessionId,
        paymentMethod: {
          type: payload.rail === 'COD' ? 'DIGITAL_WALLET' : 'CREDIT_CARD',
          token,
        },
        paymentRail: payload.rail,
        ...(tipAmount > 0 ? { tipAmount } : {}),
        ...(affiliateReferralCode ? { affiliateReferralCode } : {}),
      })
    },
    [tipAmount],
  )

  const handlePayment = async (payload: CheckoutPaymentPayload) => {
    if (!cart) return

    try {
      setIsSubmittingCheckout(true)
      lastPaymentPayloadRef.current = payload
      let sessionId = getPendingOrderForCart(cart.id)

      if (!sessionId) {
        const session = await createCheckoutSession(payload)
        sessionId = session.sessionId
        setPendingOrderForCart(cart.id, sessionId)
      }

      if (!sessionId) {
        throw new Error('Checkout session could not be created')
      }

      const completion = await completeCheckoutSession(sessionId, payload)
      const orderId = completion.order.id
      toast.success('Order placed successfully!')
      finalizeSuccessfulCheckout()
      if (completion.referralCodeApplied) {
        localStorage.removeItem('affiliateReferralCode')
        localStorage.removeItem('affiliateReferralId')
      }
      navigate('/orders/' + orderId)
    } catch (error: unknown) {
      const appError = await handleApiError(error)
      const errorMessage =
        appError.code === 'PAYMENT_UNAVAILABLE'
          ? appError.message
          : 'Payment failed: ' + appError.message
      toast.error(errorMessage)
      setPaymentError(errorMessage)
    } finally {
      setIsSubmittingCheckout(false)
    }
  }

  const handleRetryPayment = () => {
    setPaymentError(undefined)
    const last = lastPaymentPayloadRef.current
    if (last) {
      void handlePayment(last)
    }
  }

  // Early returns AFTER all hooks
  if (isLoading) {
    return (
      <PageShell className="bg-background" containerClassName="max-w-7xl" contentClassName="py-6 md:py-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-4">
          <Spinner size="large" />
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </PageShell>
    )
  }

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return (
      <PageShell className="bg-background" containerClassName="max-w-7xl" contentClassName="py-6 md:py-6">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Add items to your cart before checking out."
          action={
            <Button variant="primary" onClick={() => navigate('/')}>
              Browse Restaurants
            </Button>
          }
        />
      </PageShell>
    )
  }

  return (
    <PageShell className="bg-background" containerClassName="max-w-7xl" contentClassName="py-6 md:py-6">
      <PageHeader
        title="Checkout"
        backButton={
          <Button
          variant="ghost"
          size="small"
          onClick={
            currentStep === 'payment'
              ? handleBackToDetails
              : () => {
                  setPaymentError(undefined)
                  navigate('/cart')
                }
          }
          className="-ml-2 mb-2 text-muted-foreground"
        >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {currentStep === 'payment' ? 'Back to Details' : 'Back to Cart'}
          </Button>
        }
        actions={
          <div className="flex items-center gap-4 text-sm font-medium pt-2 sm:pt-0">
            <div className={currentStep === 'details' ? 'text-primary' : 'text-muted-foreground'}>
              1. Order Details
            </div>
            <div className="text-muted-foreground/50">→</div>
            <div className={currentStep === 'payment' ? 'text-primary' : 'text-muted-foreground'}>
              2. Payment
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {currentStep === 'details' && (
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Delivery Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ActionCard
                  checked={deliveryType === 'PICKUP'}
                  onClick={() => setDeliveryType('PICKUP')}
                >
                  <input
                    type="radio"
                    value="PICKUP"
                    checked={deliveryType === 'PICKUP'}
                    readOnly
                    className="mt-1"
                  />
                  <div className="flex flex-col">
                    <strong className="text-foreground">Pickup</strong>
                    <span className="text-muted-foreground text-sm">Pick up your order at the Store</span>
                  </div>
                </ActionCard>

                <ActionCard
                  checked={deliveryType === 'DELIVERY'}
                  onClick={() => setDeliveryType('DELIVERY')}
                  disabled
                >
                  <input
                    type="radio"
                    value="DELIVERY"
                    checked={deliveryType === 'DELIVERY'}
                    readOnly
                    className="mt-1"
                  />
                  <div className="flex flex-col">
                    <strong className="text-foreground">Delivery</strong>
                    <span className="text-muted-foreground text-sm">Coming soon - Address management required</span>
                  </div>
                </ActionCard>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Add a Tip (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  variant={tip === '2.00' ? 'primary' : 'outline'}
                  onClick={() => setTip('2.00')}
                  size="small"
                >
                  $2
                </Button>
                <Button
                  variant={tip === '3.00' ? 'primary' : 'outline'}
                  onClick={() => setTip('3.00')}
                  size="small"
                >
                  $3
                </Button>
                <Button
                  variant={tip === '5.00' ? 'primary' : 'outline'}
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
                  className="flex-1 min-w-[100px] min-h-[36px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  min="0"
                  step="0.01"
                />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="lg:col-span-1 space-y-6 sticky top-[env(safe-area-inset-top)] pt-4">
          {currentStep === 'details' ? (
            <>
              {cart && <CartSummary cart={cart} onCheckout={handleContinueToPayment} />}
              <p className="text-sm text-muted-foreground text-center">
                Review your order, then proceed to payment
              </p>
              {/* Multi-Store Warning */}
              {cart && cart.items.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-800">⚠️</span>
                    <span className="text-sm font-medium text-yellow-800">
                      Each store fulfills its own order separately. You may receive multiple deliveries.
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <PaymentSection
                amount={totalAmount}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                tax={tax}
                tip={tipAmount}
                onPaymentReady={(p) => void handlePayment(p)}
                onBackToCart={handleBackToCart}
                onRetryPayment={handleRetryPayment}
                isProcessing={isSubmittingCheckout}
                paymentError={paymentError}
                enableCod={enableCod}
              />
              {isSubmittingCheckout && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                  <Spinner size="small" />
                  <span>Processing payment...</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageShell>
  )
}
