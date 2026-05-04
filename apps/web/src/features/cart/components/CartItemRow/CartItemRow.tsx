/**
 * CartItemRow - Individual cart item with actions
 * Modern implementation with Tailwind
 */
import { Badge } from '@shared/ui/primitives'
import { Button } from '@shared/ui/primitives'
import { Plus, Minus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@shared/lib/format'
import { parsePrice } from '@api/types'
import type { CartItemData } from '@api/types'
import { useAddToCart } from '@shared/hooks/hooks/useAddToCart'
import { useRemoveFromCart, useDecrementCartItem } from '@shared/hooks/hooks/useRemoveFromCart'
import { toast } from 'sonner'

export interface CartItemRowProps {
  cartItem: CartItemData
  storeId: string
}

export function CartItemRow({ cartItem, storeId }: CartItemRowProps) {
  const unitPrice = parsePrice(cartItem.unitPrice)
  const itemTotal = unitPrice * cartItem.quantity
  
  const addToCart = useAddToCart()
  const decrementCartItem = useDecrementCartItem()
  const removeFromCart = useRemoveFromCart()
  
  // @ts-expect-error - imageUrl will be added to CartItemData type when backend supports it
  const imageUrl = cartItem.imageUrl

  const handleIncrement = () => {
    addToCart.mutate(
      {
        storeId,
        itemId: cartItem.itemId,
        quantity: 1,
        title: cartItem.titleSnapshot,
        unitPrice: cartItem.unitPrice,
        item: cartItem.currentItem,
      },
      {
        onSuccess: () => toast.success('Added one more'),
        onError: () => toast.error('Failed to add item'),
      }
    )
  }

  const handleDecrement = () => {
    if (cartItem.quantity <= 1) {
      // Remove item if quantity would go to 0
      removeFromCart.mutate({
        cartId: cartItem.cartId,
        itemId: cartItem.itemId
      })
    } else {
      // Decrement quantity
      decrementCartItem.mutate({
        cartId: cartItem.cartId,
        itemId: cartItem.itemId,
        decrementBy: 1
      })
    }
  }

  const handleRemove = () => {
    removeFromCart.mutate({
      cartId: cartItem.cartId,
      itemId: cartItem.itemId
    })
  }

  const isUnavailable = cartItem.currentItem && (
    !cartItem.currentItem.isActive || 
    cartItem.currentItem.isSoldOut
  )

  return (
    <div className="flex gap-3 p-3 rounded-lg border border-border bg-card">
      {/* Image */}
      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
        <img
          src={imageUrl || 'https://via.placeholder.com/80?text=' + encodeURIComponent(cartItem.titleSnapshot || 'Item') + ''}
          alt={cartItem.titleSnapshot}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{cartItem.titleSnapshot}</h3>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(unitPrice)} × {cartItem.quantity}
        </p>
        {cartItem.notes && (
          <p className="text-xs text-muted-foreground mt-1">Note: {cartItem.notes}</p>
        )}
        {isUnavailable && (
          <Badge variant="destructive" className="mt-1">No longer available</Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDecrement}
            disabled={isUnavailable || decrementCartItem.isPending}
            title="Remove one"
            className="h-6 w-6"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[2rem] text-center">Qty: {cartItem.quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleIncrement}
            disabled={isUnavailable || addToCart.isPending}
            title="Add one more"
            className="h-6 w-6"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={removeFromCart.isPending}
            title="Remove item"
            className="h-6 w-6 text-red-500 hover:text-red-600"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        <span className="font-semibold">{formatCurrency(itemTotal)}</span>
      </div>
    </div>
  )
}
