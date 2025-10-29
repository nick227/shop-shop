/**
 * Card Components - Unified card system
 * 
 * Exports all specialized card components built on top of BaseCard.
 * Provides consistent interfaces and styling across all card types.
 */

// Base card component
export { BaseCard } from '@ui/BaseCard'
export type { 
  BaseCardProps, 
  CardMetaItem, 
  CardAction, 
  CardBadge, 
  CardImage, 
  CardVariant 
} from '@ui/BaseCard'

// Specialized card components
export { StoreCard } from './StoreCard'
export type { StoreCardProps } from './StoreCard'

export { OrderCard } from './OrderCard'
export type { OrderCardProps } from './OrderCard'

export { ItemCard } from './ItemCard'
export type { ItemCardProps } from './ItemCard'

// Re-export for convenience
export { 
  StoreCard as StoreCardComponent,
  OrderCard as OrderCardComponent,
  ItemCard as ItemCardComponent
}
