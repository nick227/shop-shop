/**
 * StoreCard Component Family;
 * Three variants for different use cases;
 */

// Standard variant (existing, default)
export { StoreCard, type StoreCardProps } from './StoreCard'

// Compact variant (for carousels, sidebars, quick lists)
export { StoreCardCompact, type StoreCardCompactProps } from './StoreCardCompact'

// Expanded variant (for featured sections, hero areas)
export { StoreCardExpanded, type StoreCardExpandedProps } from './StoreCardExpanded'

// Convenience alias;
export { StoreCard as StoreCardStandard } from './StoreCard'

// Re-export centralized types for convenience;
export type { 
  StoreWithDistance, 
  StoreSortOption, 
  StoreClickHandler,
  ProductClickHandler,
  EntityClickHandler
} from '../../../../api/types'
