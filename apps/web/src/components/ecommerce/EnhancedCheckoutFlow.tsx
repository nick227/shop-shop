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
  paymentMethod: {
    type: 'card' | 'paypal' | 'apple_pay' | 'google_pay'
    cardNumber?: string
    expiryDate?: string
    cvv?: string
    cardholderName?: string
  }
  deliveryOption: {
    type: 'standard' | 'express' | 'pickup'
    estimatedDelivery: string
    cost: number
  }
  tip?: number
  notes?: string
}

export type CheckoutStep = 'customer' | 'shipping' | 'payment' | 'review' | 'confirmation'

// ========================================
// Enhanced Checkout Flow Component
// ========================================

const EnhancedCheckoutFlowComponent = memo<EnhancedCheckoutFlowProps>(({
  cart,
  onComplete,
  onCancel,
  isProcessing = false,
  className
}) => {
  // ========================================
  // State Management
  // ========================================
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('customer')
  const [orderData, setOrderData] = useState<OrderData>({
    customerInfo: {
      email: '',
      firstName: '',
      lastName: '',
      phone: ''
    },
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    paymentMethod: {
      type: 'card',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    },
    deliveryOption: {
      type: 'standard',
      estimatedDelivery: '3-5 business days',
      cost: 0
    },
    tip: 0,
    notes: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isValidating, setIsValidating] = useState(false)
  
  // ========================================
  // Computed Values
  // ========================================
  
  const steps = useMemo(() => [
    { id: 'customer', title: 'Customer Info', icon: CheckCircle },
    { id: 'shipping', title: 'Shipping', icon: Truck },
    { id: 'payment', title: 'Payment', icon: CreditCard },
    { id: 'review', title: 'Review', icon: Shield }
  ], [])
  
  const currentStepIndex = useMemo(() => 
    steps.findIndex(step => step.id === currentStep), 
    [steps, currentStep]
  )
  
  const progress = useMemo(() => 
    ((currentStepIndex + 1) / steps.length) * 100, 
    [currentStepIndex, steps.length]
  )
  
  const deliveryOptions = useMemo(() => [
    {
      type: 'standard' as const,
      title: 'Standard Delivery',
      description: '3-5 business days',
      cost: 0,
      icon: Truck
    },
    {
      type: 'express' as const,
      title: 'Express Delivery',
      description: '1-2 business days',
      cost: 9.99,
      icon: Clock
    },
    {
      type: 'pickup' as const,
      title: 'Store Pickup',
      description: 'Ready in 30 minutes',
      cost: 0,
      icon: CheckCircle
    }
  ], [])
  
  const paymentMethods = useMemo(() => [
    { type: 'card' as const, title: 'Credit/Debit Card', icon: CreditCard },
    { type: 'paypal' as const, title: 'PayPal', icon: CreditCard },
    { type: 'apple_pay' as const, title: 'Apple Pay', icon: CreditCard },
    { type: 'google_pay' as const, title: 'Google Pay', icon: CreditCard }
  ], [])
  
  // ========================================
  // Validation Functions
  // ========================================
  
  const validateStep = useCallback((step: CheckoutStep): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (step) {
      case 'customer':
        if (!orderData.customerInfo.email) newErrors.email = 'Email is required'
        if (!orderData.customerInfo.firstName) newErrors.firstName = 'First name is required'
        if (!orderData.customerInfo.lastName) newErrors.lastName = 'Last name is required'
        break
        
      case 'shipping':
        if (!orderData.shippingAddress.street) newErrors.street = 'Street address is required'
        if (!orderData.shippingAddress.city) newErrors.city = 'City is required'
        if (!orderData.shippingAddress.state) newErrors.state = 'State is required'
        if (!orderData.shippingAddress.zipCode) newErrors.zipCode = 'ZIP code is required'
        break
        
      case 'payment':
        if (orderData.paymentMethod.type === 'card') {
          if (!orderData.paymentMethod.cardNumber) newErrors.cardNumber = 'Card number is required'
          if (!orderData.paymentMethod.expiryDate) newErrors.expiryDate = 'Expiry date is required'
          if (!orderData.paymentMethod.cvv) newErrors.cvv = 'CVV is required'
          if (!orderData.paymentMethod.cardholderName) newErrors.cardholderName = 'Cardholder name is required'
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [orderData])
  
  // ========================================
  // Event Handlers
  // ========================================
  
  const handleNext = useCallback(() => {
    if (!validateStep(currentStep)) return
    
    const nextStepIndex = currentStepIndex + 1
    if (nextStepIndex < steps.length) {
      setCurrentStep(steps[nextStepIndex].id as CheckoutStep)
    } else {
      // Complete checkout
      onComplete(orderData)
    }
  }, [currentStep, currentStepIndex, steps, validateStep, orderData, onComplete])
  
  const handlePrevious = useCallback(() => {
    const prevStepIndex = currentStepIndex - 1
    if (prevStepIndex >= 0) {
      setCurrentStep(steps[prevStepIndex].id as CheckoutStep)
    }
  }, [currentStepIndex, steps])
  
  const handleFieldChange = useCallback((field: string, value: string) => {
    setOrderData(prev => {
      const keys = field.split('.')
      const newData = { ...prev }
      let current: any = newData
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      
      return newData
    })
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])
  
  const handleDeliveryOptionChange = useCallback((option: typeof deliveryOptions[0]) => {
    setOrderData(prev => ({
      ...prev,
      deliveryOption: {
        type: option.type,
        estimatedDelivery: option.description,
        cost: option.cost
      }
    }))
  }, [])
  
  const handlePaymentMethodChange = useCallback((method: typeof paymentMethods[0]) => {
    setOrderData(prev => ({
      ...prev,
      paymentMethod: {
        ...prev.paymentMethod,
        type: method.type
      }
    }))
  }, [])
  
  // ========================================
  // Render
  // ========================================
  
  return (
    <div className={cn('max-w-4xl mx-auto p-6', className)}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
          <Button variant="ghost" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
        </div>
        
        {/* Progress Indicator */}
        <div className="space-y-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-2 text-sm',
                  index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  index <= currentStepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  {index < currentStepIndex ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information Step */}
          {currentStep === 'customer' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={orderData.customerInfo.firstName}
                    onChange={(e) => handleFieldChange('customerInfo.firstName', e.target.value)}
                    error={errors.firstName}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={orderData.customerInfo.lastName}
                    onChange={(e) => handleFieldChange('customerInfo.lastName', e.target.value)}
                    error={errors.lastName}
                    required
                  />
                </div>
                
                <Input
                  label="Email Address"
                  type="email"
                  value={orderData.customerInfo.email}
                  onChange={(e) => handleFieldChange('customerInfo.email', e.target.value)}
                  error={errors.email}
                  required
                />
                
                <Input
                  label="Phone Number (Optional)"
                  type="tel"
                  value={orderData.customerInfo.phone}
                  onChange={(e) => handleFieldChange('customerInfo.phone', e.target.value)}
                />
              </CardContent>
            </Card>
          )}
          
          {/* Shipping Address Step */}
          {currentStep === 'shipping' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Street Address"
                  value={orderData.shippingAddress.street}
                  onChange={(e) => handleFieldChange('shippingAddress.street', e.target.value)}
                  error={errors.street}
                  required
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    value={orderData.shippingAddress.city}
                    onChange={(e) => handleFieldChange('shippingAddress.city', e.target.value)}
                    error={errors.city}
                    required
                  />
                  <Input
                    label="State"
                    value={orderData.shippingAddress.state}
                    onChange={(e) => handleFieldChange('shippingAddress.state', e.target.value)}
                    error={errors.state}
                    required
                  />
                  <Input
                    label="ZIP Code"
                    value={orderData.shippingAddress.zipCode}
                    onChange={(e) => handleFieldChange('shippingAddress.zipCode', e.target.value)}
                    error={errors.zipCode}
                    required
                  />
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Delivery Options</h3>
                  <div className="space-y-2">
                    {deliveryOptions.map((option) => (
                      <MicroInteraction key={option.type} variant="click" intensity="medium">
                        <div
                          className={cn(
                            'p-4 border rounded-lg cursor-pointer transition-all duration-200',
                            orderData.deliveryOption.type === option.type
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                          onClick={() => handleDeliveryOptionChange(option)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <option.icon className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium text-foreground">{option.title}</p>
                                <p className="text-sm text-muted-foreground">{option.description}</p>
                              </div>
                            </div>
                            <span className="font-semibold text-foreground">
                              {option.cost > 0 ? formatCurrency(option.cost) : 'Free'}
                            </span>
                          </div>
                        </div>
                      </MicroInteraction>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Payment Method Step */}
          {currentStep === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Select Payment Method</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((method) => (
                      <MicroInteraction key={method.type} variant="click" intensity="medium">
                        <div
                          className={cn(
                            'p-3 border rounded-lg cursor-pointer transition-all duration-200',
                            orderData.paymentMethod.type === method.type
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                          onClick={() => handlePaymentMethodChange(method)}
                        >
                          <div className="flex items-center gap-2">
                            <method.icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{method.title}</span>
                          </div>
                        </div>
                      </MicroInteraction>
                    ))}
                  </div>
                </div>
                
                {orderData.paymentMethod.type === 'card' && (
                  <div className="space-y-4">
                    <Input
                      label="Cardholder Name"
                      value={orderData.paymentMethod.cardholderName}
                      onChange={(e) => handleFieldChange('paymentMethod.cardholderName', e.target.value)}
                      error={errors.cardholderName}
                      required
                    />
                    
                    <Input
                      label="Card Number"
                      value={orderData.paymentMethod.cardNumber}
                      onChange={(e) => handleFieldChange('paymentMethod.cardNumber', e.target.value)}
                      error={errors.cardNumber}
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Expiry Date"
                        value={orderData.paymentMethod.expiryDate}
                        onChange={(e) => handleFieldChange('paymentMethod.expiryDate', e.target.value)}
                        error={errors.expiryDate}
                        placeholder="MM/YY"
                        required
                      />
                      <Input
                        label="CVV"
                        value={orderData.paymentMethod.cvv}
                        onChange={(e) => handleFieldChange('paymentMethod.cvv', e.target.value)}
                        error={errors.cvv}
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                )}
                
                {/* Security Badges */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    <span>SSL Encrypted</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>PCI Compliant</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Review Step */}
          {currentStep === 'review' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Review Your Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Customer Information</h3>
                    <p className="text-sm text-muted-foreground">
                      {orderData.customerInfo.firstName} {orderData.customerInfo.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{orderData.customerInfo.email}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Shipping Address</h3>
                    <p className="text-sm text-muted-foreground">
                      {orderData.shippingAddress.street}<br />
                      {orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.zipCode}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Delivery</h3>
                    <p className="text-sm text-muted-foreground">
                      {orderData.deliveryOption.type === 'standard' && 'Standard Delivery (3-5 business days)'}
                      {orderData.deliveryOption.type === 'express' && 'Express Delivery (1-2 business days)'}
                      {orderData.deliveryOption.type === 'pickup' && 'Store Pickup (Ready in 30 minutes)'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Payment Method</h3>
                    <p className="text-sm text-muted-foreground">
                      {orderData.paymentMethod.type === 'card' && 'Credit/Debit Card ending in ****'}
                      {orderData.paymentMethod.type === 'paypal' && 'PayPal'}
                      {orderData.paymentMethod.type === 'apple_pay' && 'Apple Pay'}
                      {orderData.paymentMethod.type === 'google_pay' && 'Google Pay'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Totals */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatCurrency(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-foreground">
                    {orderData.deliveryOption.cost > 0 ? formatCurrency(orderData.deliveryOption.cost) : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="text-foreground">{formatCurrency(cart.tax)}</span>
                </div>
                {orderData.tip && orderData.tip > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tip</span>
                    <span className="text-foreground">{formatCurrency(orderData.tip)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">
                    {formatCurrency(cart.total + orderData.deliveryOption.cost + (orderData.tip || 0))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Security Notice */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-800 mb-1">Secure Checkout</h3>
                  <p className="text-sm text-green-700">
                    Your payment information is encrypted and secure. We never store your card details.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={currentStepIndex > 0 ? handlePrevious : onCancel}
          disabled={isProcessing}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStepIndex > 0 ? 'Previous' : 'Cancel'}
        </Button>
        
        <MicroInteraction variant="click" intensity="strong">
          <RippleEffect color="primary" duration={600}>
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={isProcessing}
              className="min-w-[120px]"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : currentStepIndex < steps.length - 1 ? (
                <>
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  <span>Complete Order</span>
                  <CheckCircle className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </RippleEffect>
        </MicroInteraction>
      </div>
    </div>
  )
})

EnhancedCheckoutFlowComponent.displayName = 'EnhancedCheckoutFlow'

// ========================================
// Exports
// ========================================

export { EnhancedCheckoutFlowComponent as EnhancedCheckoutFlow }
export default EnhancedCheckoutFlowComponent
export type { EnhancedCheckoutFlowProps, OrderData, CheckoutStep }
