/**
 * Home — discovery: featured hero, stats, all cities (+ZIPs), categories, new stores & items, seller CTA.
 * Location preference stays in URL for search filtering; no “pick location” wizard on this page.
 */
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import { useAvailableLocations, useHeroStore, type CityDirectoryEntry } from '@shared/hooks/hooks/store'
import { NewestStores } from '@features/stores/components'
import { AvailableLocations } from '@features/stores/components/AvailableLocations'
import {
  LocationUrlNotice,
  HomeVendorTypes,
  HomeFeaturedHero,
  HomeNewestProducts,
  HomeSellSection,
} from '@features/home/components'
import { geocodeCity } from '@services/geocoding'
import type { LocationData } from '@shared/types'
import { PageShell } from '@shared/ui/layout/PageShell'

const DEFAULT_RADIUS_MILES = 25

export default function HomePage() {
  const navigate = useNavigate()
  const { urlLocationNotice, setLocation, setUrlLocationNotice } = useUrlLocation()
  const { data: directory, isLoading: directoryLoading } = useAvailableLocations()
  const { data: heroStore, isLoading: heroLoading } = useHeroStore()

  const marketplaceTotal = directory?.total ?? 0

  const handleCitySelect = useCallback(
    async (entry: CityDirectoryEntry) => {
      const geo = await geocodeCity(entry.city, entry.state)
      if (!geo) return

      const primaryZip = entry.zips[0]?.zip

      const loc: LocationData = {
        latitude: geo.latitude,
        longitude: geo.longitude,
        radiusMiles: DEFAULT_RADIUS_MILES,
        displayName: geo.displayName,
        source: 'search',
        city: geo.city ?? entry.city,
        state: geo.state ?? entry.state,
        zip: primaryZip ?? geo.zip,
      }
      setLocation(loc)

      const q = new URLSearchParams()
      q.set('city', entry.city)
      q.set('state', entry.state)
      if (primaryZip) q.set('zip', primaryZip)
      q.set('lat', String(geo.latitude))
      q.set('lng', String(geo.longitude))
      q.set('radius', String(DEFAULT_RADIUS_MILES))
      navigate({ pathname: '/search', search: q.toString() })
    },
    [navigate, setLocation],
  )

  return (
    <PageShell
      className="bg-background"
      containerClassName="max-w-5xl"
      contentClassName="space-y-10 py-6 md:py-12"
    >
      <header className="space-y-2">
        <p className="text-label">Local food, fast</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Discover kitchens near you
        </h1>
        <p className="text-body text-secondary max-w-2xl">
          {directoryLoading ? (
            <span className="text-muted-foreground">Loading marketplace…</span>
          ) : (
            <>
              <span className="font-semibold text-foreground">{marketplaceTotal}</span>{' '}
              {marketplaceTotal === 1 ? 'kitchen is' : 'kitchens are'} live — browse by city or jump into search.
            </>
          )}
        </p>
      </header>

      <LocationUrlNotice notice={urlLocationNotice} onDismiss={() => setUrlLocationNotice(undefined)} />

      <HomeFeaturedHero store={heroStore} isLoading={heroLoading} />

      <AvailableLocations onSelectCity={(entry) => void handleCitySelect(entry)} />

      <HomeVendorTypes />

      <NewestStores />

      <HomeNewestProducts />

      <HomeSellSection />

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">Local-first</p>
          <p className="mt-1 text-sm text-muted-foreground">Neighborhood sellers you won&apos;t find on giant apps.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">Straightforward checkout</p>
          <p className="mt-1 text-sm text-muted-foreground">Cart, pay, track — without extra noise.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">Clear order status</p>
          <p className="mt-1 text-sm text-muted-foreground">Know when your order is received and ready.</p>
        </div>
      </section>
    </PageShell>
  )
}
