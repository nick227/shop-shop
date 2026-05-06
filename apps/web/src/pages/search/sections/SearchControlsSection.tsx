import { LocationSearch } from '@features/stores/components'
import type { LocationData } from '@shared/types'

interface SearchControlsSectionProps {
  readonly location: LocationData | undefined
  readonly onLocationChange: (location: LocationData | undefined) => void
}

export function SearchControlsSection({
  location,
  onLocationChange,
}: SearchControlsSectionProps) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="px-4 py-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Near you
        </p>
        <p className="mb-3 text-sm text-muted-foreground">
          {location
            ? 'Optional: refine using your device location (URL params still drive city/ZIP filters).'
            : 'Optional: use your device location — or rely on the city/ZIP you opened from the home page.'}
        </p>
        <LocationSearch onLocationChange={onLocationChange} />
      </div>
    </section>
  )
}
