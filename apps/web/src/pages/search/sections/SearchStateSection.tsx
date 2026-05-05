import { StateBlock } from '@shared/ui/primitives/ui/StateBlock/StateBlock'
import type { SearchStatus } from '@shared/hooks/hooks/useSearchOrchestration'
import type { LocationData } from '@shared/types'
import type { StoreWithDistance } from '@api/types'

interface SearchStateSectionProps {
  readonly status: SearchStatus
  readonly isLoading: boolean
  readonly error: Error | undefined
  readonly location: LocationData | undefined
  readonly stores: StoreWithDistance[] | undefined
  readonly areaLabel: string | undefined
  readonly radiusMiles: number
  readonly onRetry: () => void
  readonly onExpandToMiles: (miles: number) => void
  readonly onPickNearbyCity: () => void
  readonly onQuickCity: (city: string, state: string) => void
}

export function SearchStateSection({
  status,
  isLoading,
  error,
  location,
  stores,
  areaLabel,
  radiusMiles,
  onRetry,
  onExpandToMiles,
  onPickNearbyCity,
  onQuickCity,
}: SearchStateSectionProps) {
  if (status === 'no-location') {
    return (
      <StateBlock
        title="Choose a location"
        message="Set your location to see kitchens near you."
      />
    )
  }

  if (status === 'loading') {
    return (
      <StateBlock
        title="Loading kitchens"
        message={`Finding kitchens${areaLabel ? ` near ${areaLabel}` : ''}...`}
      />
    )
  }

  if (status === 'error') {
    return (
      <StateBlock
        title="Search failed"
        message={error?.message ?? 'Unable to load kitchens right now.'}
        actionLabel="Retry"
        onAction={onRetry}
      />
    )
  }

  if (status === 'no-results') {
    return (
      <StateBlock
        title="No kitchens found"
        message={`No kitchens found${areaLabel ? ` in ${areaLabel}` : ''} within ${radiusMiles} miles.`}
        actionLabel="Expand search radius"
        onAction={() => onExpandToMiles(radiusMiles + 10)}
      />
    )
  }

  if (status === 'results' && (!stores || stores.length === 0)) {
    return (
      <StateBlock
        title="No kitchens found"
        message="Try changing your location to see more results."
      />
    )
  }

  return null
}
