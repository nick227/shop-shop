import { GridView } from '@shared/lib/utils/page-builder'
import { StoreCard } from '../StoreCard'
import type { StoreWithDistance, StoreClickHandler } from '@api/backend-types'
import type { ViewConfig } from '@shared/types'
import { cn } from '@shared/lib/utils/cn'

/**
 * StoreGrid - Declarative grid view for stores;
 * Uses model-driven configuration;
 */

export interface StoreGridProps {
  readonly stores: StoreWithDistance[]
  readonly onStoreClick?: StoreClickHandler;
  readonly highlightedStoreId?: string;
  readonly className?: string;
}

export function StoreGrid({ stores, onStoreClick, highlightedStoreId, className }: StoreGridProps) {
  console.log('🔍 [StoreGrid] Rendering with stores:', stores?.length || 0)
  console.log('🔍 [StoreGrid] Stores data:', stores)
  
  // Model-driven configuration;
  const VIEW_CONFIG: ViewConfig<StoreWithDistance> = {
    layout: 'grid',
    cols: 3,
    gap: 'medium',
    itemComponent: (store) => (
      <div
        id={'store-' + store.id}
        className={cn(
          'transition-all duration-300',
          highlightedStoreId === store.id && 'ring-2 ring-primary ring-offset-2 scale-105'
        )}
      >
        <StoreCard store={store} onClick={onStoreClick} />
      </div>
    )
  }

  return (
    <div className={cn('p-4', className)}>
      <GridView items={stores} config={VIEW_CONFIG} testId="store-grid" />
    </div>
  )
}

