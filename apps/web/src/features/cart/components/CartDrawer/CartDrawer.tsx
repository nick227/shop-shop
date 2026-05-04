// @ts-nocheck
/**
 * CartDrawer - Shopping cart sidebar
 * Migrated from Drawer to BottomSheet (mobile-native)
 */
import { BottomSheet, Button, Spinner, useConfirm } from '@shared/ui/primitives'
import { CartItem } from '../CartItem'
import { useCart } from '@shared/hooks/hooks/useCart'
import { useAuth } from '@shared/hooks/hooks/useAuth'
import { formatCurrency } from '@shared/lib/format'

export interface CartDrawerProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { isAuthenticated } = useAuth()
  const { cart, isLoading, deleteCart, isDeleting } = useCart()
  const { confirm, dialog } = useConfirm()

  // Early return if not authenticated
  if (!isAuthenticated) {
    return
  }

  const handleCheckout = () => {
    // TODO: Implement checkout in Phase 5
    console.log('Proceed to checkout')
  }

  const handleClearCart = async () => {
    if (!cart) return
    
    const confirmed = await confirm({
      title: 'Clear Cart?',
      description: 'Are you sure you want to remove all items from your cart? This action cannot be undone.',
      variant: 'danger',
      confirmLabel: 'Clear Cart',
    })
    
    if (confirmed) {
      deleteCart(cart.id)
    }
  }

  return (
    <>
      {dialog}
      <BottomSheet 
        open={isOpen} 
        onOpenChange={onClose}
        title="Your Cart"
        description={cart ? '' + cart.items.length + ' items' : undefined}
      >
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-8 gap-3">
            <Spinner size="medium" />
            <p className="text-muted-foreground">Loading cart...</p>
          </div>
        )}

        {!isLoading && (!cart || cart.items.length === 0) && (
          <div className="flex flex-col items-center justify-center p-8 gap-4">
            <p className="text-muted-foreground text-center">Your cart is empty</p>
            <Button onClick={onClose}>Continue Shopping</Button>
          </div>
        )}

        {cart && (() => {
          try {
            const items = typeof cart.items === 'string' ? JSON.parse(cart.items) : cart.items
            return items.length > 0
          } catch {
            return false
          }
        })() && (
          <>
            {/* Items */}
            <div className="space-y-3 mb-6">
              {(() => {
                try {
                  const items = typeof cart.items === 'string' ? JSON.parse(cart.items) : cart.items
                  return items.map((item: { id: string; titleSnapshot?: string; price?: number; quantity?: number }) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      isUpdating={isDeleting}
                    />
                  ))
                } catch (error) {
                  console.warn('Failed to parse cart items:', error)
                  return <div>Unable to load cart items</div>
                }
              })()}
            </div>

            {/* Summary */}
            <div className="border-t pt-4 space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(Number(cart.tax) || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fees</span>
                <span>{formatCurrency(Number(cart.fees) || 0)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(Number(cart.total) || 0)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button fullWidth onClick={handleCheckout}>
                Checkout
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={handleClearCart}
                disabled={isDeleting}
              >
                Clear Cart
              </Button>
            </div>
          </>
        )}
      </BottomSheet>
    </>
  )
}

