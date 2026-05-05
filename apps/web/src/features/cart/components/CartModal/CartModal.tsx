/**
 * CartModal - Unified cart modal with enhanced UX
 * Works for both authenticated and guest users
 * Replaces floating CartWidget with header-integrated experience
 */
import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@stores/cartStore'
import { Button, BottomSheet, Spinner } from '@shared/ui/primitives'
import { ShoppingCart, Trash2, Plus, Minus, X } from 'lucide-react'
import { CartItemRow } from '../CartItemRow'
import { CartSummary } from '../CartSummary'
import { formatCurrency } from '@shared/lib/format'
import { cn } from '@shared/lib/cn'

export interface CartModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

export function CartModal({ isOpen, onClose }: CartModalProps) {
  const navigate = useNavigate()
  const cart = useCartStore((state) => state.cart)
  const { addItem, decrementItem, removeItem, clearCart } = useCartStore()
  const [isUpdating, setIsUpdating] = useState(false)

  // Calculate cart metrics
  const cartMetrics = useMemo(() => {
    if (!cart?.items) return { itemCount: 0, subtotal: 0, total: 0 }
    
    try {
      const items = typeof cart.items === 'string' ? JSON.parse(cart.items) : cart.items
      const itemCount = items.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 0), 0)
      return {
        itemCount,
        subtotal: cart.subtotal || 0,
        total: cart.total || 0
      }
    } catch {
      return { itemCount: 0, subtotal: 0, total: 0 }
    }
  }, [cart])

  // Cart items with safe parsing
  const cartItems = useMemo(() => {
    if (!cart?.items) return []
    
    try {
      return typeof cart.items === 'string' ? JSON.parse(cart.items) : cart.items
    } catch {
      return []
    }
  }, [cart])

  // Handlers
  const handleCheckout = useCallback(() => {
    onClose()
    navigate('/checkout')
  }, [navigate, onClose])

  const handleIncrementItem = useCallback(async (item: any) => {
    if (!cart) return
    
    setIsUpdating(true)
    try {
      addItem({
        storeId: cart.storeId,
        itemId: item.itemId,
        quantity: 1,
        item: item.currentItem || item.item
      })
    } finally {
      setIsUpdating(false)
    }
  }, [cart, addItem])

  const handleDecrementItem = useCallback(async (item: any) => {
    if (!cart) return
    
    setIsUpdating(true)
    try {
      decrementItem(item.itemId, 1)
    } finally {
      setIsUpdating(false)
    }
  }, [cart, decrementItem])

  const handleRemoveItem = useCallback(async (item: any) => {
    if (!cart) return
    
    setIsUpdating(true)
    try {
      removeItem(item.itemId)
    } finally {
      setIsUpdating(false)
    }
  }, [cart, removeItem])

  const handleClearCart = useCallback(async () => {
    if (!cart) return
    
    setIsUpdating(true)
    try {
      clearCart()
    } finally {
      setIsUpdating(false)
    }
  }, [cart, clearCart])

  const handleContinueShopping = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <BottomSheet
      open={isOpen}
      onOpenChange={onClose}
      title="Shopping Cart"
      description={cartMetrics.itemCount > 0 
        ? `${cartMetrics.itemCount} item${cartMetrics.itemCount !== 1 ? 's' : ''} • ${formatCurrency(cartMetrics.total)}`
        : "Your cart is empty"
      }
    >
      <div className="flex flex-col h-full">
        {/* Empty State */}
        {cartMetrics.itemCount === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Add items to get started</p>
            <Button onClick={handleContinueShopping}>
              Continue Shopping
            </Button>
          </div>
        )}

        {/* Cart Content */}
        {cartMetrics.itemCount > 0 && (
          <>
            {/* Clear Cart Button */}
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                size="small"
                onClick={handleClearCart}
                disabled={isUpdating}
                isLoading={isUpdating}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear Cart
              </Button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-6">
              {cartItems.map((item: any) => (
                <CartItemEnhanced
                  key={item.id}
                  item={item}
                  onIncrement={() => handleIncrementItem(item)}
                  onDecrement={() => handleDecrementItem(item)}
                  onRemove={() => handleRemoveItem(item)}
                  isUpdating={isUpdating}
                />
              ))}
            </div>

            {/* Summary and Actions */}
            <div className="border-t pt-4 space-y-4">
              {/* Price Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(cartMetrics.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatCurrency((cart?.total || 0) - (cart?.subtotal || 0))}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(cartMetrics.total)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  fullWidth
                  onClick={handleCheckout}
                  disabled={isUpdating}
                  className="bg-primary hover:bg-primary/90"
                >
                  Proceed to Checkout
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={handleContinueShopping}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  )
}

/**
 * Enhanced Cart Item with quantity controls
 */
function CartItemEnhanced({ 
  item, 
  onIncrement, 
  onDecrement, 
  onRemove, 
  isUpdating 
}: {
  item: any
  onIncrement: () => void
  onDecrement: () => void
  onRemove: () => void
  isUpdating: boolean
}) {
  const itemTitle = item.titleSnapshot || item.item?.title || 'Item'
  const itemPrice = item.unitPrice || item.price || 0
  const quantity = item.quantity || 1
  const lineTotal = itemPrice * quantity

  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      {/* Item Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{itemTitle}</h4>
          <p className="text-sm text-gray-500">{formatCurrency(itemPrice)} each</p>
        </div>
        
        <Button
          variant="ghost"
          size="small"
          onClick={onRemove}
          disabled={isUpdating}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="small"
            onClick={onDecrement}
            disabled={isUpdating || quantity <= 1}
            className="h-8 w-8 p-0"
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          <span className="w-8 text-center font-medium">{quantity}</span>
          
          <Button
            variant="outline"
            size="small"
            onClick={onIncrement}
            disabled={isUpdating}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="text-right">
          <div className="font-medium text-gray-900">{formatCurrency(lineTotal)}</div>
        </div>
      </div>
    </div>
  )
}
