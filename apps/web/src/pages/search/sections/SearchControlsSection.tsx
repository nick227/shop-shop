import { LocationSearch } from '@features/stores/components'
import type { LocationData } from '@shared/types'

interface SearchControlsSectionProps {
  readonly location: LocationData | undefined
  readonly radiusMiles: number
  readonly onLocationChange: (location: LocationData | undefined) => void
}

export function SearchControlsSection({
  location,
  radiusMiles,
  onLocationChange,
}: SearchControlsSectionProps) {
  return (
    <section className="rounded-2xl border border-white/25 bg-white/95 shadow-xl">
      <div className="px-4 py-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Search kitchens near you
        </p>
        <p className="mb-3 text-sm text-gray-600">
          {location ? `Current radius: ${radiusMiles} miles` : 'Set your location to start searching.'}
        </p>
        <LocationSearch onLocationChange={onLocationChange} showHistory={true} />
      </div>
    </section>
  )
}
