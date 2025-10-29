/**
 * StoreCard - Specialized card component for stores
 * 
 * Built on top of BaseCard with store-specific logic and styling.
 * Handles store images, distance, prep time, ratings, and status badges.
 */

import React, { memo, useMemo } from 'react'
import { MapPin, Clock, Star, DollarSign, Eye } from 'lucide-react'
import { BaseCard, type BaseCardProps } from '@shared/ui/primitives/BaseCard'
import { getStoreImageUrl } from '@shared/lib/storeAccessors'
import { formatDistance, formatCurrency } from '@shared/lib/format'
import { parsePrice } from '@api/types'
import type { StoreWithDistance } from '@api/types'

// ========================================
// Store Card Props
// ========================================

export interface StoreCardProps extends Omit<BaseCardProps, 'title' | 'description' | 'image'> {
  store: StoreWithDistance
  showDistance?: boolean
  showPrepTime?: boolean
  showRating?: boolean
  showDeliveryFee?: boolean
  showStatus?: boolean
  onViewDetails?: (store: StoreWithDistance) => void
  onViewMenu?: (store: StoreWithDistance) => void
}

// ========================================
// Store Card Component
// ========================================

function StoreCardComponent({
  store,
  showDistance = true,
  showPrepTime = true,
  showRating = true,
  showDeliveryFee = true,
  showStatus = true,
  onViewDetails,
  onViewMenu,
  onClick,
  actions = [],
  badges = [],
  meta = [],
  ...props
}: StoreCardProps) {
  
  // ========================================
  // Memoized Computed Values
  // ========================================
  
  const imageUrl = useMemo(() => 
    getStoreImageUrl(store, 'standard'), 
    [store]
  )
  
  const deliveryFee = useMemo(() => {
    if (!showDeliveryFee || !store.deliveryFee) return null
    return parsePrice(store.deliveryFee)
  }, [store.deliveryFee, showDeliveryFee])
  
  const storeBadges = useMemo(() => {
    const newBadges = [...badges]
    
    if (showStatus && !store.isPublished) {
      newBadges.push({
        label: 'Draft',
        variant: 'warning' as const
      })
    }
    
    if (showStatus && !store.isActive) {
      newBadges.push({
        label: 'Inactive',
        variant: 'destructive' as const
      })
    }
    
    return newBadges
  }, [badges, showStatus, store.isPublished, store.isActive])
  
  const storeMeta = useMemo(() => {
    const newMeta = [...meta]
    
    if (showDistance && store.distance !== undefined) {
      newMeta.push({
        icon: MapPin,
        label: 'Distance',
        value: formatDistance(store.distance)
      })
    }
    
    if (showPrepTime) {
      newMeta.push({
        icon: Clock,
        label: 'Prep Time',
        value: `${store.prepTimeMin} min`
      })
    }
    
    if (showRating) {
      newMeta.push({
        icon: Star,
        label: 'Rating',
        value: '4.8',
        className: 'text-yellow-600'
      })
    }
    
    if (deliveryFee !== null) {
      newMeta.push({
        icon: DollarSign,
        label: 'Delivery',
        value: formatCurrency(deliveryFee)
      })
    }
    
    return newMeta
  }, [
    meta, 
    showDistance, 
    store.distance, 
    showPrepTime, 
    store.prepTimeMin, 
    showRating, 
    deliveryFee, 
    showDeliveryFee
  ])
  
  const storeActions = useMemo(() => {
    const newActions = [...actions]
    
    if (onViewDetails) {
      newActions.push({
        label: 'View Details',
        variant: 'outline' as const,
        icon: Eye,
        onClick: () => onViewDetails(store)
      })
    }
    
    if (onViewMenu) {
      newActions.push({
        label: 'View Menu',
        variant: 'primary' as const,
        onClick: () => onViewMenu(store)
      })
    }
    
    return newActions
  }, [actions, onViewDetails, onViewMenu, store])
  
  // ========================================
  // Render
  // ========================================
  
  return (
    <BaseCard
      title={store.name}
      description={store.description}
      image={{
        src: imageUrl,
        alt: store.name,
        aspectRatio: 'video',
        fallbackSeed: store.id
      }}
      badges={storeBadges}
      meta={storeMeta}
      actions={storeActions}
      onClick={onClick}
      {...props}
    />
  )
}

// ========================================
// Exports
// ========================================

export const StoreCard = memo(StoreCardComponent)
export type { StoreCardProps }
