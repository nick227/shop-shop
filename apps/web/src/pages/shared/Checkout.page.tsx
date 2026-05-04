/**
 * CheckoutPage - Order checkout and placement with payment
 */
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCart } from '@shared/hooks/hooks/useCart'
import { usePayment } from '@shared/hooks/hooks/usePayment'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import { calculateOrderPricing } from '@shared/lib/utils/pricing'
import { mapOrder } from '@api/type-mappers'
import type { OrderResponse } from '@api/types'
import { Button, Spinner } from '@shared/ui/primitives'
import { CartSummary } from '@features/cart/components/CartSummary'
import { PaymentSection } from '@features/checkout/components/PaymentSection'
import { PageContainer, PageHeader } from '@shared/ui/layout/PageLayout'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { Card, CardHeader, CardTitle, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { ActionCard } from '@shared/ui/primitives/ui/ActionCard/ActionCard'
import { ShoppingCart, ArrowLeft } from 'lucide-react'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { cart, isLoading, clearCart } = useCart()
  const { createPaymentIntentAsync, isCreatingIntent } = usePayment()
  
  const [deliveryType, setDeliveryType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP')
  const [tip, setTip] = useState('')
  const [currentStep, setCurrentStep] = useState<'details' | 'payment'>('details')
  const [paymentError, setPaymentError] = useState<string | undefined>()

  useEffect(() => {
    setPaymentError(undefined)
  }, [location.pathname])

  const createOrderMutation = useMutation({
    mutationFn: async (params: { cartId: string; deliveryType: 'PICKUP' | 'DELIVERY'; tip?: string }) => {
      // Calculate totals using pricing utilities
      const subtotal = Number.parseFloat(cart?.subtotal?.toString() || '0')
      const tipPercentage = tip ? Number.parseFloat(tip) / subtotal : 0
      const pricing = calculateOrderPricing({
        subtotal,
        tipPercentage,
        includeServiceFee: false
      })
      const tipAmount = pricing.tip
      const deliveryFee = pricing.deliveryFee
      const tax = pricing.tax
      const totalAmount = pricing.total
      
      const rawOrder = await apiClient.orders().createOrder({
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
      return mapOrder(rawOrder)
    },
    onSuccess: () => {
      clearCart()
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['carts'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

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

  const handlePayment = async (paymentMethodId?: string) => {
    if (!cart) return

    try {
      // 1. Create order first
      let orderId: string
      try {
        const orderResponse: OrderResponse = await createOrderMutation.mutateAsync({
          cartId: cart?.id,
          deliveryType,
          tip: tipAmount > 0 ? tipAmount.toFixed(2) : undefined,
        })

        orderId = orderResponse.id
      } catch (error: unknown) {
        const appError = await handleApiError(error)
        const msg = 'Order could not be created: ' + appError.message
        toast.error(msg)
        setPaymentError(msg)
        return
      }

      // 2. If test mode (no payment method), we're done
      if (!paymentMethodId) {
        toast.success('Order placed successfully!')
        navigate('/order/' + orderId + '')
        return
      }

      // 3. For real payment, create payment intent
      const paymentIntent = await createPaymentIntentAsync({
        orderId: orderId,
        paymentMethodId,
      })

      // 4. Handle payment confirmation with proper routing
      if (paymentIntent.status === 'succeeded') {
        toast.success('Order placed and paid successfully!')
        navigate('/order/' + orderId, { 
          state: { 
            paymentStatus: 'succeeded',
            showSuccessAnimation: true 
          } 
        })
      } else if (paymentIntent.status === 'requires_action') {
        toast.info('Additional payment authentication required. Check your order status for next steps.')
        navigate('/order/' + orderId, {
          state: { paymentStatus: 'requires_action' }
        })
      } else if (paymentIntent.status === 'requires_payment_method') {
        const msg =
          'Your payment could not be processed. Try again or use a different payment method.'
        toast.error(msg)
        setPaymentError(msg)
        return
      } else if (paymentIntent.status === 'canceled') {
        const msg = 'Payment was canceled. You can retry below or go back to your cart.'
        toast.error(msg)
        setPaymentError(msg)
        return
      } else {
        toast.info('Payment status: ' + paymentIntent.status + '. Check order history for details.')
        navigate('/order/' + orderId, { 
          state: { 
            paymentStatus: paymentIntent.status 
          } 
        })
      }
    } catch (error: unknown) {
      const appError = await handleApiError(error)
      const errorMessage = 'Payment failed: ' + appError.message
      toast.error(errorMessage)
      setPaymentError(errorMessage)
    }
  }

  const handleRetryPayment = () => {
    setPaymentError(undefined)
    void handlePayment()
  }

  // Early returns AFTER all hooks
  if (isLoading) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Spinner size="large" />
        <p className="text-muted-foreground">Loading checkout...</p>
      </PageContainer>
    )
  }

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return (
      <PageContainer>
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
      </PageContainer>
    )
  }

  return (
    <PageContainer>
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
                onBackToCart={handleBackToCart}
                onRetryPayment={handleRetryPayment}
                isProcessing={createOrderMutation.isPending || isCreatingIntent}
                paymentError={paymentError}
              />
              {(createOrderMutation.isPending || isCreatingIntent) && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                  <Spinner size="small" />
                  <span>Processing payment...</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
