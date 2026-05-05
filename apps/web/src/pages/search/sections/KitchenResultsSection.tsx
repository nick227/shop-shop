import { SearchResults } from '@features/home/components/SearchResults'
import type { LocationData } from '@shared/types'
import type { StoreWithDistance } from '@api/types'

interface KitchenResultsSectionProps {
  readonly location: LocationData
  readonly stores: StoreWithDistance[]
  readonly areaLabel: string | undefined
  readonly onStoreClick: (store: StoreWithDistance) => void
}

export function KitchenResultsSection({
  location,
  stores,
  areaLabel,
  onStoreClick,
}: KitchenResultsSectionProps) {
  return (
    <section aria-labelledby="search-results-heading" className="rounded-2xl border border-white/25 bg-white/95 p-4 shadow-xl">
      <h2 id="search-results-heading" className="sr-only">
        Search results
      </h2>
      <SearchResults
        error={undefined}
        location={location}
        stores={stores}
        userLocation={location}
        onStoreClick={onStoreClick}
        areaLabel={areaLabel}
      />
    </section>
  )
}
