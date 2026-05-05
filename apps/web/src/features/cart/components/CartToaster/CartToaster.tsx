/**
 * CartToaster - Rich cart notifications with item details and actions
 * Extends Sonner with cart-specific toast templates
 */
import React from 'react'
import { toast } from 'sonner'
import { Check, ShoppingCart, X, Undo, Trash2 } from 'lucide-react'
import { formatCurrency } from '@shared/lib/format'
import { Button } from '@shared/ui/primitives'
import { cn } from '@shared/lib/cn'
import type { ItemResponse } from '@api/types'

export interface CartToastOptions {
  item?: ItemResponse | Partial<ItemResponse>
  quantity?: number
  cartTotal?: number
  cartItemCount?: number
  showUndo?: boolean
  onUndo?: () => void
  duration?: number
}

export interface CartToastData {
  type: 'item-added' | 'item-removed' | 'cart-cleared' | 'cart-updated'
  options: CartToastOptions
}

/**
 * Cart-specific toast templates with rich content
 */
export function showCartToast(type: CartToastData['type'], options: CartToastOptions = {}) {
  const {
    item,
    quantity = 1,
    cartTotal,
    cartItemCount,
    showUndo = false,
    onUndo,
    duration = 4000
  } = options

  switch (type) {
    case 'item-added':
      return toast.custom(
        (id) => (
          <CartItemAddedToast
            item={item}
            quantity={quantity}
            cartTotal={cartTotal}
            cartItemCount={cartItemCount}
            onClose={() => toast.dismiss(id)}
            onUndo={showUndo ? onUndo : undefined}
          />
        ),
        { duration }
      )

    case 'item-removed':
      return toast.custom(
        (id) => (
          <CartItemRemovedToast
            item={item}
            quantity={quantity}
            cartTotal={cartTotal}
            cartItemCount={cartItemCount}
            onClose={() => toast.dismiss(id)}
            onUndo={showUndo ? onUndo : undefined}
          />
        ),
        { duration }
      )

    case 'cart-cleared':
      return toast.custom(
        (id) => (
          <CartClearedToast
            onClose={() => toast.dismiss(id)}
            onUndo={showUndo ? onUndo : undefined}
          />
        ),
        { duration }
      )

    case 'cart-updated':
      return toast.custom(
        (id) => (
          <CartUpdatedToast
            cartTotal={cartTotal}
            cartItemCount={cartItemCount}
            onClose={() => toast.dismiss(id)}
          />
        ),
        { duration: 3000 }
      )

    default:
      return toast.success('Cart updated')
  }
}

/**
 * Item Added Toast Template
 */
function CartItemAddedToast({ 
  item, 
  quantity = 1,
  cartTotal,
  cartItemCount,
  onClose,
  onUndo
}: {
  item?: ItemResponse | Partial<ItemResponse>
  quantity?: number
  cartTotal?: number
  cartItemCount?: number
  onClose: () => void
  onUndo?: () => void
}) {
  const itemTitle = item?.title || 'Item'
  const itemPrice = item?.price ? formatCurrency(Number(item.price)) : ''
  const totalPrice = item?.price && quantity ? formatCurrency(Number(item.price) * quantity) : ''

  return (
    <div className="group relative w-full max-w-sm rounded-lg border border-green-200 bg-green-50 p-4 shadow-lg transition-all hover:shadow-xl">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute right-2 top-2 rounded-full p-1 text-green-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-green-200"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Content */}
      <div className="flex items-start gap-3">
        {/* Success Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
          <Check className="h-5 w-5" />
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-green-900">
            {quantity > 1 ? `${quantity}x ${itemTitle}` : itemTitle}
          </div>
          
          {itemPrice && (
            <div className="text-sm text-green-700">
              {totalPrice && quantity > 1 ? (
                <>
                  {itemPrice} each → {totalPrice}
                </>
              ) : (
                itemPrice
              )}
            </div>
          )}

          {/* Cart Summary */}
          {(cartTotal !== undefined || cartItemCount !== undefined) && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <ShoppingCart className="h-3 w-3" />
              <span>
                {cartItemCount !== undefined && `${cartItemCount} item${cartItemCount !== 1 ? 's' : ''}`}
                {cartTotal !== undefined && ` • ${formatCurrency(cartTotal)}`}
              </span>
            </div>
          )}

          {/* Undo Action */}
          {onUndo && (
            <Button
              variant="ghost"
              size="small"
              onClick={onUndo}
              className="mt-2 h-8 px-2 text-green-700 hover:bg-green-200 hover:text-green-900"
            >
              <Undo className="mr-1 h-3 w-3" />
              Undo
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Item Removed Toast Template
 */
function CartItemRemovedToast({ 
  item, 
  quantity = 1,
  cartTotal,
  cartItemCount,
  onClose,
  onUndo
}: {
  item?: ItemResponse | Partial<ItemResponse>
  quantity?: number
  cartTotal?: number
  cartItemCount?: number
  onClose: () => void
  onUndo?: () => void
}) {
  const itemTitle = item?.title || 'Item'

  return (
    <div className="group relative w-full max-w-sm rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-lg transition-all hover:shadow-xl">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute right-2 top-2 rounded-full p-1 text-orange-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-orange-200"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Content */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white">
          <X className="h-5 w-5" />
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-orange-900">
            {quantity > 1 ? `${quantity}x ${itemTitle} removed` : `${itemTitle} removed`}
          </div>

          {/* Cart Summary */}
          {(cartTotal !== undefined || cartItemCount !== undefined) && (
            <div className="mt-2 flex items-center gap-2 text-sm text-orange-600">
              <ShoppingCart className="h-3 w-3" />
              <span>
                {cartItemCount !== undefined && `${cartItemCount} item${cartItemCount !== 1 ? 's' : ''}`}
                {cartTotal !== undefined && ` • ${formatCurrency(cartTotal)}`}
              </span>
            </div>
          )}

          {/* Undo Action */}
          {onUndo && (
            <Button
              variant="ghost"
              size="small"
              onClick={onUndo}
              className="mt-2 h-8 px-2 text-orange-700 hover:bg-orange-200 hover:text-orange-900"
            >
              <Undo className="mr-1 h-3 w-3" />
              Undo
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Cart Cleared Toast Template
 */
function CartClearedToast({
  onClose,
  onUndo
}: {
  onClose: () => void
  onUndo?: () => void
}) {
  return (
    <div className="group relative w-full max-w-sm rounded-lg border border-red-200 bg-red-50 p-4 shadow-lg transition-all hover:shadow-xl">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute right-2 top-2 rounded-full p-1 text-red-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-200"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Content */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
          <Trash2 className="h-5 w-5" />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-red-900">Cart cleared</div>
          <div className="text-sm text-red-700">All items have been removed</div>

          {/* Undo Action */}
          {onUndo && (
            <Button
              variant="ghost"
              size="small"
              onClick={onUndo}
              className="mt-2 h-8 px-2 text-red-700 hover:bg-red-200 hover:text-red-900"
            >
              <Undo className="mr-1 h-3 w-3" />
              Undo
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Cart Updated Toast Template
 */
function CartUpdatedToast({
  cartTotal,
  cartItemCount,
  onClose
}: {
  cartTotal?: number
  cartItemCount?: number
  onClose: () => void
}) {
  return (
    <div className="group relative w-full max-w-sm rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-lg transition-all hover:shadow-xl">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute right-2 top-2 rounded-full p-1 text-blue-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-blue-200"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Content */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <ShoppingCart className="h-5 w-5" />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-blue-900">Cart updated</div>
          
          {/* Cart Summary */}
          {(cartTotal !== undefined || cartItemCount !== undefined) && (
            <div className="mt-1 text-sm text-blue-700">
              {cartItemCount !== undefined && (
                <span>{cartItemCount} item{cartItemCount !== 1 ? 's' : ''}</span>
              )}
              {cartTotal !== undefined && (
                <span> • {formatCurrency(cartTotal)}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook for easy cart toast usage
 */
export function useCartToaster() {
  return {
    showItemAdded: (options: CartToastOptions) => showCartToast('item-added', options),
    showItemRemoved: (options: CartToastOptions) => showCartToast('item-removed', options),
    showCartCleared: (options: CartToastOptions) => showCartToast('cart-cleared', options),
    showCartUpdated: (options: CartToastOptions) => showCartToast('cart-updated', options),
  }
}
