/**
 * Enhanced Checkout Flow - Professional Ecommerce Checkout
 * 
 * Addresses critical ecommerce UX issues:
 * - Poor checkout conversion rates
 * - Missing guest checkout option
 * - No progress indicators
 * - Poor mobile checkout experience
 * - Missing trust indicators and security
 */

import React, { memo, useCallback, useState, useMemo } from 'react'
import { CreditCard, Shield, Truck, Clock, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge, Progress } from '@shared/ui/primitives'
import { MicroInteraction, RippleEffect, PulseAnimation } from '@shared/ui/primitives/Enhancements/MicroInteractions'
import { VisualCue, ContentPriority } from '@shared/ui/primitives/Enhancements/VisualHierarchy'
import { cn } from '@shared/lib/cn'
import { formatCurrency } from '@shared/lib/format'

// ========================================
// Types & Interfaces
// ========================================

export interface EnhancedCheckoutFlowProps {
  cart: {
    id: string
    items: Array<{
      id: string
      title: string
      price: number
      quantity: number
      image: string
    }>
    subtotal: number
    tax: number
    shipping: number
    total: number
  }
  onComplete: (orderData: OrderData) => void
  onCancel: () => void
  isProcessing?: boolean
  className?: string
}

export interface OrderData {
  customerInfo: {
    email: string
    firstName: string
    lastName: string
    phone?: string
  }
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  billingAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  paymentMethod: {
    type: 'card' | 'paypal' | 'apple_pay' | 'google_pay'
    cardNumber?: string
    expiryDate?: string
    cvv?: string
    nameOnCard?: string
  }
  deliveryMethod: {
    type: 'standard' | 'express' | 'overnight'
    cost: number
    estimatedDays: number
  }
  orderNotes?: string
  marketingOptIn?: boolean
}

// ========================================
// Checkout Steps Configuration
// ========================================

const CHECKOUT_STEPS = [
  { id: 'shipping', title: 'Shipping', icon: Truck },
  { id: 'payment', title: 'Payment', icon: CreditCard },
  { id: 'review', title: 'Review', icon: CheckCircle },
] as const

type CheckoutStep = typeof CHECKOUT_STEPS[number]['id']

// ========================================
// Enhanced Checkout Flow Component
// ========================================

export const EnhancedCheckoutFlow = memo<EnhancedCheckoutFlowProps>(({
  cart,
  onComplete,
  onCancel,
  isProcessing = false,
  className
}) => {
  // ========================================
  // State Management
  // ========================================
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping')
  const [isGuestCheckout, setIsGuestCheckout] = useState(false)
  const [formData, setFormData] = useState<Partial<OrderData>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isValidating, setIsValidating] = useState(false)

  // ========================================
  // Step Navigation
  // ========================================
  
  const currentStepIndex = CHECKOUT_STEPS.findIndex(step => step.id === currentStep)
  const progress = ((currentStepIndex + 1) / CHECKOUT_STEPS.length) * 100

  const goToNextStep = useCallback(() => {
    if (currentStepIndex < CHECKOUT_STEPS.length - 1) {
      setCurrentStep(CHECKOUT_STEPS[currentStepIndex + 1].id)
    }
  }, [currentStepIndex])

  const goToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStep(CHECKOUT_STEPS[currentStepIndex - 1].id)
    }
  }, [currentStepIndex])

  // ========================================
  // Form Validation
  // ========================================
  
  const validateStep = useCallback(async (step: CheckoutStep): Promise<boolean> => {
    setIsValidating(true)
    const newErrors: Record<string, string> = {}

    try {
      switch (step) {
        case 'shipping':
          if (!formData.customerInfo?.email) {
            newErrors.email = 'Email is required'
          } else if (!/\S+@\S+\.\S+/.test(formData.customerInfo.email)) {
            newErrors.email = 'Please enter a valid email'
          }
          if (!formData.customerInfo?.firstName) {
            newErrors.firstName = 'First name is required'
          }
          if (!formData.customerInfo?.lastName) {
            newErrors.lastName = 'Last name is required'
          }
          if (!formData.shippingAddress?.street) {
            newErrors.street = 'Street address is required'
          }
          if (!formData.shippingAddress?.city) {
            newErrors.city = 'City is required'
          }
          if (!formData.shippingAddress?.state) {
            newErrors.state = 'State is required'
          }
          if (!formData.shippingAddress?.zipCode) {
            newErrors.zipCode = 'ZIP code is required'
          }
          break

        case 'payment':
          if (!formData.paymentMethod?.type) {
            newErrors.paymentMethod = 'Please select a payment method'
          }
          if (formData.paymentMethod?.type === 'card') {
            if (!formData.paymentMethod.cardNumber) {
              newErrors.cardNumber = 'Card number is required'
            }
            if (!formData.paymentMethod.expiryDate) {
              newErrors.expiryDate = 'Expiry date is required'
            }
            if (!formData.paymentMethod.cvv) {
              newErrors.cvv = 'CVV is required'
            }
            if (!formData.paymentMethod.nameOnCard) {
              newErrors.nameOnCard = 'Name on card is required'
            }
          }
          break

        case 'review':
          // Review step is always valid
          break
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    } finally {
      setIsValidating(false)
    }
  }, [formData])

  // ========================================
  // Event Handlers
  // ========================================
  
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }, [errors])

  const handleNextStep = useCallback(async () => {
    const isValid = await validateStep(currentStep)
    if (isValid) {
      goToNextStep()
    }
  }, [currentStep, validateStep, goToNextStep])

  const handleCompleteOrder = useCallback(async () => {
    const isValid = await validateStep('review')
    if (isValid && formData.customerInfo && formData.shippingAddress && formData.paymentMethod) {
      onComplete(formData as OrderData)
    }
  }, [validateStep, formData, onComplete])

  // ========================================
  // Render Helpers
  // ========================================
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 'shipping':
        return (
          <ShippingStep
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
            isGuestCheckout={isGuestCheckout}
            onToggleGuestCheckout={setIsGuestCheckout}
          />
        )
      case 'payment':
        return (
          <PaymentStep
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
          />
        )
      case 'review':
        return (
          <ReviewStep
            cart={cart}
            formData={formData}
            onComplete={handleCompleteOrder}
            isProcessing={isProcessing}
          />
        )
      default:
        return null
    }
  }

  // ========================================
  // Render
  // ========================================
  
  return (
    <div className={cn('enhanced-checkout-flow', className)}>
      {/* Progress Header */}
      <div className="checkout-progress mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Secure checkout</span>
          </div>
        </div>
        
        <Progress value={progress} className="mb-4" />
        
        <div className="flex justify-between">
          {CHECKOUT_STEPS.map((step, index) => {
            const StepIcon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStepIndex > index
            
            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-2 text-sm font-medium transition-colors',
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                  isActive ? 'border-blue-600 bg-blue-50' : 
                  isCompleted ? 'border-green-600 bg-green-50' : 
                  'border-gray-300 bg-white'
                )}>
                  <StepIcon className={cn(
                    'w-4 h-4',
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  )} />
                </div>
                <span className="hidden sm:block">{step.title}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="checkout-content">
        {renderStepContent()}
      </div>

      {/* Navigation Footer */}
      <div className="checkout-navigation flex justify-between items-center pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={currentStepIndex > 0 ? goToPreviousStep : onCancel}
          disabled={isProcessing}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentStepIndex > 0 ? 'Back' : 'Cancel'}
        </Button>

        {currentStep !== 'review' ? (
          <Button
            onClick={handleNextStep}
            disabled={isValidating || isProcessing}
            className="flex items-center gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleCompleteOrder}
            disabled={isValidating || isProcessing}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Complete Order
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
})

EnhancedCheckoutFlow.displayName = 'EnhancedCheckoutFlow'

// ========================================
// Step Components
// ========================================

interface ShippingStepProps {
  formData: Partial<OrderData>
  errors: Record<string, string>
  onInputChange: (field: string, value: any) => void
  isGuestCheckout: boolean
  onToggleGuestCheckout: (value: boolean) => void
}

const ShippingStep = memo<ShippingStepProps>(({
  formData,
  errors,
  onInputChange,
  isGuestCheckout,
  onToggleGuestCheckout
}) => {
  return (
    <div className="space-y-6">
      {/* Guest Checkout Toggle */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Guest Checkout</h3>
              <p className="text-sm text-gray-600">Checkout without creating an account</p>
            </div>
            <Button
              variant={isGuestCheckout ? "default" : "outline"}
              onClick={() => onToggleGuestCheckout(!isGuestCheckout)}
            >
              {isGuestCheckout ? 'Enabled' : 'Enable'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Shipping Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Email Address *"
                type="email"
                value={formData.customerInfo?.email || ''}
                onChange={(e) => onInputChange('customerInfo', {
                  ...formData.customerInfo,
                  email: e.target.value
                })}
                error={errors.email}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Input
                label="Phone Number"
                type="tel"
                value={formData.customerInfo?.phone || ''}
                onChange={(e) => onInputChange('customerInfo', {
                  ...formData.customerInfo,
                  phone: e.target.value
                })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              value={formData.customerInfo?.firstName || ''}
              onChange={(e) => onInputChange('customerInfo', {
                ...formData.customerInfo,
                firstName: e.target.value
              })}
              error={errors.firstName}
              placeholder="John"
            />
            <Input
              label="Last Name *"
              value={formData.customerInfo?.lastName || ''}
              onChange={(e) => onInputChange('customerInfo', {
                ...formData.customerInfo,
                lastName: e.target.value
              })}
              error={errors.lastName}
              placeholder="Doe"
            />
          </div>

          <Input
            label="Street Address *"
            value={formData.shippingAddress?.street || ''}
            onChange={(e) => onInputChange('shippingAddress', {
              ...formData.shippingAddress,
              street: e.target.value
            })}
            error={errors.street}
            placeholder="123 Main Street"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City *"
              value={formData.shippingAddress?.city || ''}
              onChange={(e) => onInputChange('shippingAddress', {
                ...formData.shippingAddress,
                city: e.target.value
              })}
              error={errors.city}
              placeholder="New York"
            />
            <Input
              label="State *"
              value={formData.shippingAddress?.state || ''}
              onChange={(e) => onInputChange('shippingAddress', {
                ...formData.shippingAddress,
                state: e.target.value
              })}
              error={errors.state}
              placeholder="NY"
            />
            <Input
              label="ZIP Code *"
              value={formData.shippingAddress?.zipCode || ''}
              onChange={(e) => onInputChange('shippingAddress', {
                ...formData.shippingAddress,
                zipCode: e.target.value
              })}
              error={errors.zipCode}
              placeholder="10001"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

ShippingStep.displayName = 'ShippingStep'

interface PaymentStepProps {
  formData: Partial<OrderData>
  errors: Record<string, string>
  onInputChange: (field: string, value: any) => void
}

const PaymentStep = memo<PaymentStepProps>(({
  formData,
  errors,
  onInputChange
}) => {
  const paymentMethods = [
    { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
    { id: 'paypal', label: 'PayPal', icon: Shield },
    { id: 'apple_pay', label: 'Apple Pay', icon: CreditCard },
    { id: 'google_pay', label: 'Google Pay', icon: CreditCard },
  ]

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => {
              const MethodIcon = method.icon
              return (
                <Button
                  key={method.id}
                  variant={formData.paymentMethod?.type === method.id ? "default" : "outline"}
                  onClick={() => onInputChange('paymentMethod', {
                    ...formData.paymentMethod,
                    type: method.id as any
                  })}
                  className="h-16 flex items-center gap-3 justify-start"
                >
                  <MethodIcon className="w-5 h-5" />
                  {method.label}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Card Details (if card selected) */}
      {formData.paymentMethod?.type === 'card' && (
        <Card>
          <CardHeader>
            <CardTitle>Card Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Card Number *"
              value={formData.paymentMethod.cardNumber || ''}
              onChange={(e) => onInputChange('paymentMethod', {
                ...formData.paymentMethod,
                cardNumber: e.target.value
              })}
              error={errors.cardNumber}
              placeholder="1234 5678 9012 3456"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Expiry Date *"
                value={formData.paymentMethod.expiryDate || ''}
                onChange={(e) => onInputChange('paymentMethod', {
                  ...formData.paymentMethod,
                  expiryDate: e.target.value
                })}
                error={errors.expiryDate}
                placeholder="MM/YY"
              />
              <Input
                label="CVV *"
                value={formData.paymentMethod.cvv || ''}
                onChange={(e) => onInputChange('paymentMethod', {
                  ...formData.paymentMethod,
                  cvv: e.target.value
                })}
                error={errors.cvv}
                placeholder="123"
              />
            </div>
            
            <Input
              label="Name on Card *"
              value={formData.paymentMethod.nameOnCard || ''}
              onChange={(e) => onInputChange('paymentMethod', {
                ...formData.paymentMethod,
                nameOnCard: e.target.value
              })}
              error={errors.nameOnCard}
              placeholder="John Doe"
            />
          </CardContent>
        </Card>
      )}

      {/* Security Badges */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>SSL Encrypted</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>PCI Compliant</span>
        </div>
      </div>
    </div>
  )
})

PaymentStep.displayName = 'PaymentStep'

interface ReviewStepProps {
  cart: EnhancedCheckoutFlowProps['cart']
  formData: Partial<OrderData>
  onComplete: () => void
  isProcessing: boolean
}

const ReviewStep = memo<ReviewStepProps>(({
  cart,
  formData,
  onComplete,
  isProcessing
}) => {
  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
            
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(cart.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatCurrency(cart.shipping)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(cart.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Information Review */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium">
              {formData.customerInfo?.firstName} {formData.customerInfo?.lastName}
            </p>
            <p>{formData.customerInfo?.email}</p>
            <p>
              {formData.shippingAddress?.street}<br />
              {formData.shippingAddress?.city}, {formData.shippingAddress?.state} {formData.shippingAddress?.zipCode}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information Review */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium">
              {formData.paymentMethod?.type?.toUpperCase()} ending in ****
            </p>
            {formData.paymentMethod?.nameOnCard && (
              <p>{formData.paymentMethod.nameOnCard}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

ReviewStep.displayName = 'ReviewStep'
