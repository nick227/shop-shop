/**
 * ItemCard - Specialized card component for items/products
 * 
 * Built on top of BaseCard with item-specific logic and styling.
 * Handles item images, pricing, availability, and cart actions.
 */

import React, { memo, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Eye, Heart } from 'lucide-react'
import { BaseCard, type BaseCardProps } from '@ui/BaseCard'
import { useAddToCart } from '@hooks/useAddToCart'
import { getItemRouteSimple } from '@utils/navigation/routes'
import { formatCurrency } from '@utils/format'
import { parsePrice } from '@api/types'
import type { ItemResponse } from '@api/types'

// ========================================
// Item Card Props
// ========================================

export interface ItemCardProps extends Omit<BaseCardProps, 'title' | 'description' | 'image'> {
  item: ItemResponse
  store?: { id: string; name: string }
  showPrice?: boolean
  showAvailability?: boolean
  showAddToCart?: boolean
  showViewDetails?: boolean
  showWishlist?: boolean
  onViewDetails?: (item: ItemResponse) => void
  onAddToWishlist?: (item: ItemResponse) => void
}

// ========================================
// Item Card Component
// ========================================

function ItemCardComponent({
  item,
  store,
  showPrice = true,
  showAvailability = true,
  showAddToCart = true,
  showViewDetails = true,
  showWishlist = false,
  onViewDetails,
  onAddToWishlist,
  onClick,
  actions = [],
  badges = [],
  meta = [],
  ...props
}: ItemCardProps) {
  
  const addToCart = useAddToCart()
  
  // ========================================
  // Memoized Computed Values
  // ========================================
  
  const price = useMemo(() => 
    parsePrice(item.price), 
    [item.price]
  )
  
  const imageUrl = useMemo(() => 
    (item as any).imageUrl || `/placeholder-item-${item.id}.jpg`, 
    [item]
  )
  
  const itemRoute = useMemo(() => 
    getItemRouteSimple({ id: item.id, title: item.title }), 
    [item.id, item.title]
  )
  
  const isAvailable = useMemo(() => 
    item.isActive && !item.isSoldOut, 
    [item.isActive, item.isSoldOut]
  )
  
  const itemBadges = useMemo(() => {
    const newBadges = [...badges]
    
    if (showAvailability) {
      if (item.isSoldOut) {
        newBadges.push({
          label: 'Sold Out',
          variant: 'destructive' as const
        })
      } else if (!item.isActive) {
        newBadges.push({
          label: 'Inactive',
          variant: 'warning' as const
        })
      }
    }
    
    return newBadges
  }, [badges, showAvailability, item.isSoldOut, item.isActive])
  
  const itemMeta = useMemo(() => {
    const newMeta = [...meta]
    
    if (showPrice) {
      newMeta.push({
        label: 'Price',
        value: formatCurrency(price),
        className: 'font-semibold text-primary text-lg'
      })
    }
    
    if (store) {
      newMeta.push({
        label: 'Store',
        value: store.name
      })
    }
    
    return newMeta
  }, [meta, showPrice, price, store])
  
  const itemActions = useMemo(() => {
    const newActions = [...actions]
    
    if (showViewDetails) {
      newActions.push({
        label: 'View Details',
        variant: 'outline' as const,
        icon: Eye,
        onClick: () => onViewDetails?.(item)
      })
    }
    
    if (showAddToCart && isAvailable) {
      newActions.push({
        label: addToCart.isPending ? 'Adding...' : 'Add to Cart',
        variant: 'primary' as const,
        icon: ShoppingCart,
        onClick: () => addToCart.mutate({
          storeId: item.storeId,
          itemId: item.id,
          quantity: 1
        }),
        loading: addToCart.isPending,
        disabled: !isAvailable
      })
    }
    
    if (showWishlist) {
      newActions.push({
        label: 'Add to Wishlist',
        variant: 'ghost' as const,
        icon: Heart,
        onClick: () => onAddToWishlist?.(item)
      })
    }
    
    return newActions
  }, [
    actions, 
    showViewDetails, 
    onViewDetails, 
    item, 
    showAddToCart, 
    isAvailable, 
    addToCart, 
    showWishlist, 
    onAddToWishlist
  ])
  
  // ========================================
  // Event Handlers
  // ========================================
  
  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAvailable || addToCart.isPending) return
    
    addToCart.mutate({
      storeId: item.storeId,
      itemId: item.id,
      quantity: 1
    })
  }, [isAvailable, addToCart, item.storeId, item.id])
  
  // ========================================
  // Render
  // ========================================
  
  return (
    <BaseCard
      title={item.title}
      description={item.description}
      image={{
        src: imageUrl,
        alt: item.title,
        aspectRatio: 'square',
        fallbackSeed: item.id
      }}
      badges={itemBadges}
      meta={itemMeta}
      actions={itemActions}
      onClick={onClick}
      disabled={!isAvailable}
      {...props}
    />
  )
}

// ========================================
// Exports
// ========================================

export const ItemCard = memo(ItemCardComponent)
export type { ItemCardProps }
