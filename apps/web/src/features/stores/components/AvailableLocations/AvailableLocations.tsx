/**
 * All cities with kitchens — cards show ZIP codes tied to each city from live store data.
 */
import { useAvailableLocations, type CityDirectoryEntry } from '@shared/hooks/hooks/store'

interface AvailableLocationsProps {
  readonly onSelectCity?: (entry: CityDirectoryEntry) => void
}

export function AvailableLocations({ onSelectCity }: AvailableLocationsProps) {
  const { data, isLoading } = useAvailableLocations()

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">Loading areas…</p>
      </section>
    )
  }

  if (!data || data.cities.length === 0) {
    return null
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Browse by city</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Every marketplace kitchen mapped by city. ZIPs listed are the ones stores actually use in that area.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.cities.map((entry) => (
          <li key={`${entry.city}-${entry.state}`}>
            <button
              type="button"
              onClick={() => onSelectCity?.(entry)}
              className="flex h-full w-full flex-col rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <span className="font-semibold text-foreground">
                {entry.city}, {entry.state}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                {entry.count} {entry.count === 1 ? 'kitchen' : 'kitchens'}
              </span>
              {entry.zips.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1">
                  {entry.zips.map((z) => (
                    <span
                      key={z.zip}
                      className="rounded-md border border-border bg-card px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                    >
                      {z.zip}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="mt-2 text-xs text-muted-foreground">No ZIP on file yet</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
