/**
 * CartBar - stays at the bottom of the storefront once the shopper has something from this store.
 */
import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '@stores/cartStore'
import { formatCurrency } from '@shared/lib/utils/format'

export function CartBar({ storeId }: { readonly storeId: string }) {
  const cart = useCartStore((state) => state.cart)
  if (cart?.storeId !== storeId) return null
  const lines = Array.isArray(cart.items) ? (cart.items as { quantity?: number }[]) : []
  const count = lines.reduce((sum, line) => sum + (line.quantity ?? 0), 0)
  if (count === 0) return null

  return (
    <div className="pointer-events-none sticky bottom-4 z-30 flex justify-center px-2">
      <Link
        to="/cart"
        className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-lg transition hover:opacity-95"
      >
        <span className="relative">
          <ShoppingBag className="h-5 w-5" aria-hidden />
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1 text-xs font-bold text-foreground">
            {count}
          </span>
        </span>
        <span className="flex-1 font-semibold">View cart</span>
        <span className="font-semibold tabular-nums">{formatCurrency(Number(cart.subtotal ?? 0))}</span>
      </Link>
    </div>
  )
}
