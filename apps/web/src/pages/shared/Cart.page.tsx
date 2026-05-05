import { useNavigate } from 'react-router-dom'
import { useCart } from '@shared/hooks/hooks/useCart'
import { PageShell } from '@shared/ui/layout/PageShell'
import { Button } from '@shared/ui/primitives'
import { CartSkeleton } from '@components/skeletons/CartSkeleton'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/ui/primitives'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { CartItemRow } from '@features/cart/components/CartItemRow'
import { CartSummary } from '@features/cart/components/CartSummary'
import { StateBlock } from '@shared/ui/primitives/ui/StateBlock/StateBlock'
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

  const itemCount = Array.isArray(cart?.items) ? cart.items.length : 0
  const cartErrorMessage = (error as { message?: string } | undefined)?.message ?? 'Something went wrong.'
  const status: 'loading' | 'error' | 'empty' | 'ready' = (() => {
    if (isLoading) return 'loading'
    if (error) return 'error'
    if (!cart || itemCount === 0) return 'empty'
    return 'ready'
  })()

  if (status === 'loading') {
    return (
      <PageShell className="bg-background" containerClassName="max-w-4xl" contentClassName="space-y-4 py-6">
        <section className="rounded-xl border border-border bg-card p-4">
          <CartSkeleton />
        </section>
      </PageShell>
    )
  }

  if (status === 'error') {
    return (
      <PageShell className="bg-background" containerClassName="max-w-4xl" contentClassName="space-y-4 py-6">
        <StateBlock
          title="Error loading cart"
          message={cartErrorMessage}
          actionLabel="Back to search"
          onAction={handleContinueShopping}
          className="rounded-xl border border-border bg-card p-4"
        />
      </PageShell>
    )
  }

  if (status === 'empty') {
    return (
      <PageShell className="bg-background" containerClassName="max-w-4xl" contentClassName="space-y-4 py-6">
        <section className="rounded-xl border border-border bg-card p-4">
          <StateBlock
            title="Your cart is empty"
            message="Add items from a kitchen to continue."
            actionLabel="Back to search"
            onAction={handleContinueShopping}
            className="mt-2"
          />
        </section>
      </PageShell>
    )
  }

  return (
    <PageShell className="bg-background" containerClassName="max-w-4xl" contentClassName="space-y-4 py-6">
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border p-4">
          <Button variant="ghost" size="small" onClick={handleContinueShopping}>
            <ArrowLeft className="h-4 w-4" />
            Back
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
        </header>

        <section className="p-4">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Items ({itemCount})
          </h2>
          <div className="space-y-3">
            {Array.isArray(cart?.items) && cart.items.map((item) => (
              <CartItemRow 
                key={item.id} 
                cartItem={item}
                storeId={cart?.storeId}
              />
            ))}
          </div>
        </section>

        <footer className="sticky bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur">
          {cart && <CartSummary cart={cart} onCheckout={handleCheckout} />}
        </footer>
      </div>
    </PageShell>
  )
}
