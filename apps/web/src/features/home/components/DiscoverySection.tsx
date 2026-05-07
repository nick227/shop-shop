/**
 * DiscoverySection — reusable browse/discover block for search and store pages.
 * Bundles: Browse by city, Vendor categories, New kitchens, New menus, Seller CTA, Info cards.
 */
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import { AvailableLocations, NewestStores } from '@features/stores/components'
import { HomeVendorTypes } from './HomeVendorTypes'
import { HomeNewestProducts } from './HomeNewestProducts'
import { HomeSellSection } from './HomeSellSection'
import { geocodeCity } from '@services/geocoding'
import type { CityDirectoryEntry } from '@shared/hooks/hooks/store'
import type { LocationData } from '@shared/types'

const DEFAULT_RADIUS_MILES = 25

export function DiscoverySection() {
  const navigate = useNavigate()
  const { setLocation } = useUrlLocation()

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

      const params = new URLSearchParams()
      params.set('city', entry.city)
      params.set('state', entry.state)
      if (primaryZip) params.set('zip', primaryZip)
      params.set('lat', String(geo.latitude))
      params.set('lng', String(geo.longitude))
      params.set('radius', String(DEFAULT_RADIUS_MILES))
      navigate({ pathname: '/search', search: params.toString() })
    },
    [navigate, setLocation],
  )

  return (
    <>
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
    </>
  )
}
