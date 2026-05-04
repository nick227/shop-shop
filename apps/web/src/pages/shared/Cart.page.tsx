// @ts-nocheck
import { useNavigate } from 'react-router-dom'
import { useCart } from '@shared/hooks/hooks/useCart'
import { MobileShell } from '@shared/ui/layout/MobileShell'
import { Button } from '@shared/ui/primitives'
import { SkeletonList } from '@shared/ui/primitives'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/ui/primitives'
import { ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react'
import { CartItemRow } from '@features/cart/components/CartItemRow'
import { CartSummary } from '@features/cart/components/CartSummary'
import { toast } from 'sonner'

/**
 * CartPage - Modern shopping cart with dialog confirmations
 */

export default function CartPage() {
  const navigate = useNavigate()
  const { cart, isLoading, error, deleteCart, isDeleting } = useCart()

  const handleContinueShopping = () => navigate('/')
  
  const handleClearCart = () => {
    if (!cart) return
    deleteCart(cart?.id, {
      onSuccess: () => toast.success('Cart cleared'),
      onError: () => toast.error('Failed to clear cart'),
    })
  }

  const handleCheckout = () => navigate('/checkout')

  // Loading
  if (isLoading) {
    return (
      <MobileShell title="Cart" showHeader showBottomNav>
        <div className="p-4">
          <SkeletonList count={3} />
        </div>
      </MobileShell>
    )
  }

  // Error
  if (error) {
    return (
      <MobileShell title="Cart" showHeader showBottomNav>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <h2 className="text-2xl font-bold mb-2">Error Loading Cart</h2>
          <p className="text-destructive mb-6">{error.message}</p>
          <Button variant="primary" onClick={handleContinueShopping}>
            <ArrowLeft className="h-4 w-4" />
            Back to Shopping
          </Button>
        </div>
      </MobileShell>
    )
  }

  const isEmpty = !cart || !Array.isArray(cart.items) || cart.items.length === 0

  // Empty State
  if (isEmpty) {
    return (
      <MobileShell title="Cart" showHeader showBottomNav>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add items from your favorite stores to get started!
          </p>
          <Button variant="primary" size="large" onClick={handleContinueShopping}>
            Browse Restaurants
          </Button>
        </div>
      </MobileShell>
    )
  }

  // Success - Cart with Items
  return (
    <MobileShell title="Shopping Cart" showHeader showBottomNav>
      <div className="flex flex-col">
        {/* Header Actions */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Button variant="ghost" size="small" onClick={handleContinueShopping}>
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="small" disabled={isDeleting}>
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clear Cart?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove all items from your cart? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button variant="danger" onClick={handleClearCart} isLoading={isDeleting}>
                  Clear Cart
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Items Section */}
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">
            Items ({Array.isArray(cart?.items) ? cart.items.length : 0})
          </h2>
          <div className="space-y-3">
            {Array.isArray(cart?.items) && cart.items.map((item: any) => (
              <CartItemRow 
                key={item.id} 
                cartItem={item}
                storeId={cart?.storeId}
              />
            ))}
          </div>
        </div>

        {/* Summary Section */}
        <div className="p-4 border-t border-border bg-muted/30">
          {cart && <CartSummary cart={cart} onCheckout={handleCheckout} />}
        </div>
      </div>
    </MobileShell>
  )
}
