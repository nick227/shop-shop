/**
 * FeaturedStores - Display featured stores in a prominent section;
 */
import { useFeaturedStores } from '@shared/hooks/hooks/store'
import { StoreCarousel } from '../StoreCarousel'

export function FeaturedStores() {
  const { data: stores, isLoading } = useFeaturedStores(6)

  return (
    <div className="my-8">
      <StoreCarousel
        stores={stores ?? []}
        title="⭐ Featured Stores"
        isLoading={isLoading}
      />
    </div>
  )
}

