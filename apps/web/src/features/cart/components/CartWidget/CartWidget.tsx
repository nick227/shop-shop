/**
 * CartWidget - Persistent cart icon with item count
 * Modern implementation with BottomSheet
 */
import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '@hooks/useCart'
import { useAuth } from '@hooks/useAuth'
import { Button } from '@ui'
import { BottomSheet } from '@ui/BottomSheet'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { CartItemRow } from '../CartItemRow'
import { CartSummary } from '../CartSummary'
import { toast } from 'sonner'
import { cn } from '@utils/cn'

export function CartWidget() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { cart, deleteCart, isDeleting, isLoading } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  // Early return if not authenticated to prevent unnecessary API calls
  if (!isAuthenticated) {
    return null
  }

  // Direct computation - optimized for performance
  const itemCount = cart?.items?.length ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0

  // Handlers
  const handleCheckout = useCallback(() => {
    setIsOpen(false)
    navigate('/checkout')
  }, [navigate])

  const handleClearCart = useCallback(() => {
    if (!cart) return
    deleteCart(cart.id, {
      onSuccess: () => {
        toast.success('Cart cleared')
        setIsOpen(false)
      },
      onError: () => toast.error('Failed to clear cart'),
    })
  }, [cart, deleteCart])

  const handleToggleDrawer = useCallback(() => {
    if (itemCount > 0) setIsOpen(true)
  }, [itemCount])

  // Early return for performance
  if (isLoading || itemCount === 0) {
    return null
  }

  return (
    <>
      {/* Floating Cart Button */}
      <button
        className={cn(
          'fixed bottom-20 right-4 z-40',
          'w-14 h-14 rounded-full',
          'bg-primary text-primary-foreground',
          'shadow-lg hover:shadow-xl',
          'flex items-center justify-center',
          'tap-scale transition-all',
          'md:bottom-6'
        )}
        onClick={handleToggleDrawer}
        aria-label={'Cart with ' + itemCount + ' items'}
      >
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      {/* Cart Bottom Sheet */}
      {cart && (
        <BottomSheet
          open={isOpen}
          onOpenChange={setIsOpen}
          title="Shopping Cart"
          description={`${cart.items.length} item${cart.items.length !== 1 ? 's' : ''} in your cart`}
        >
          <div className="space-y-4">
            {/* Clear Button */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="small"
                onClick={handleClearCart}
                disabled={isDeleting}
                isLoading={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                Clear Cart
              </Button>
            </div>

            {/* Cart Items */}
            <div className="space-y-3">
              {cart.items.map((item) => (
                <CartItemRow
                  key={item.id}
                  cartItem={{
          ...item,
          itemTitle: String(item.titleSnapshot || 'Item'),
          lineTotal: String((((item as any).price || 0) * (item.quantity || 1)).toString()),
          createdAt: new Date().toISOString()
        }}
                  storeId={cart.storeId}
                />
              ))}
            </div>

            {/* Summary */}
            <div className="pt-4 border-t border-border">
              <CartSummary cart={{
                ...cart,
                taxAmount: String(cart.tax || 0),
                totalAmount: String(cart.total || 0)
              }} onCheckout={handleCheckout} />
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  )
}
