/**
 * HomePage - entry page only.
 * Sets location, then transitions to /search.
 */
import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import { useLocationDisplay } from '@shared/hooks/hooks/useLocationDisplay'
import { LocationSearch } from '@features/stores/components'
import type { LocationData } from '@shared/types'
import { UrlParamError } from '@features/home/components'
import { Button } from '@shared/ui/primitives'
import { PageShell } from '@shared/ui/layout/PageShell'

const DEFAULT_RADIUS_MILES = 25

export default function HomePage() {
  const navigate = useNavigate()
  const routerLocation = useLocation()
  const { location, urlParamError, setLocation, setUrlParamError } = useUrlLocation()
  const { locationDisplayName } = useLocationDisplay(location, undefined)

  const currentRadius = Math.max(location?.radiusMiles ?? DEFAULT_RADIUS_MILES, 5)

  const goToSearch = useCallback(() => {
    navigate({
      pathname: '/search',
      search: routerLocation.search,
    })
  }, [navigate, routerLocation.search])

  const handleLocationChange = useCallback((newLocation: LocationData | undefined) => {
    setLocation(newLocation)
    if (newLocation) {
      navigate({
        pathname: '/search',
        search: routerLocation.search,
      })
    }
  }, [navigate, routerLocation.search, setLocation])

  return (
    <PageShell
      className="bg-background"
      containerClassName="max-w-4xl"
      contentClassName="space-y-6 py-6 md:py-10"
    >
      <UrlParamError error={urlParamError} onDismiss={() => setUrlParamError(undefined)} />

      {/* Hero */}
      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-label">Local food, fast</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Great food from nearby kitchens.
          </h1>
          <p className="text-body text-secondary max-w-2xl">
            Set your delivery area, then browse menus and build a cart in seconds.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border bg-card px-3 py-1">No subscription</span>
          <span className="rounded-full border border-border bg-card px-3 py-1">Pickup-first, delivery soon</span>
          <span className="rounded-full border border-border bg-card px-3 py-1">Local sellers</span>
        </div>
      </section>

      {/* Location */}
      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div id="home-location-search" className="p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Choose your area</h2>
              <p className="text-sm text-muted-foreground">
                We’ll use this to show kitchens near you.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              Radius: <span className="font-medium text-foreground">{currentRadius} mi</span>
            </span>
          </div>

          <LocationSearch onLocationChange={handleLocationChange} showHistory={true} />
        </div>

        {location ? (
          <div className="flex items-center justify-between gap-3 border-t border-border p-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Selected</p>
              <p className="truncate text-sm font-medium text-foreground">
                {locationDisplayName ?? location.displayName ?? 'Location set'}
              </p>
            </div>
            <Button variant="primary" onClick={goToSearch} className="shrink-0">
              Continue to search
            </Button>
          </div>
        ) : (
          <div className="border-t border-border p-4">
            <p className="text-xs text-muted-foreground">
              Pick a location to continue.
            </p>
          </div>
        )}
      </section>

      {/* Trust / value */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">Local-first</p>
          <p className="mt-1 text-sm text-muted-foreground">Support nearby kitchens and sellers.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">Simple checkout</p>
          <p className="mt-1 text-sm text-muted-foreground">Build a cart quickly, pay when ready.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">Clear status</p>
          <p className="mt-1 text-sm text-muted-foreground">Track orders from placed to ready.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">How it works</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          <li className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 1</p>
            <p className="mt-1 text-sm font-semibold text-foreground">Set your area</p>
            <p className="mt-1 text-sm text-muted-foreground">Choose city/ZIP and radius.</p>
          </li>
          <li className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 2</p>
            <p className="mt-1 text-sm font-semibold text-foreground">Browse kitchens</p>
            <p className="mt-1 text-sm text-muted-foreground">See what’s available nearby.</p>
          </li>
          <li className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 3</p>
            <p className="mt-1 text-sm font-semibold text-foreground">Order in minutes</p>
            <p className="mt-1 text-sm text-muted-foreground">Add items, checkout, track status.</p>
          </li>
        </ol>
      </section>
    </PageShell>
  )
}
