/**
 * Single fallback discovery strip — global picks when API returns arbitrary stores.
 * Shown only when the page needs filler (see Home visibility rules).
 */
import { StoreCarousel } from '../StoreCarousel'
import { useFeaturedStores } from '@shared/hooks/hooks/store'

export interface PopularStoresRowProps {
  readonly enabled: boolean
  readonly title?: string
}

export function PopularStoresRow({ enabled, title = 'Popular stores' }: PopularStoresRowProps) {
  const { data: stores, isLoading } = useFeaturedStores(6, { enabled })
  if (!enabled) {
    return null
  }
  return (
    <div className="mt-3 opacity-95">
      <StoreCarousel
        stores={(stores ?? []).slice(0, 6)}
        title={title}
        isLoading={isLoading}
        variant="fallback"
      />
    </div>
  )
}
