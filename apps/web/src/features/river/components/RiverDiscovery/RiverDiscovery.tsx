import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import { AvailableLocations, NewestStores } from '@features/stores/components'
import { HomeVendorTypes } from '@features/home/components/HomeVendorTypes'
import { HomeNewestProducts } from '@features/home/components/HomeNewestProducts'
import { HomeSellSection } from '@features/home/components/HomeSellSection'
import { geocodeCity } from '@services/geocoding'
import type { CityDirectoryEntry } from '@shared/hooks/hooks/store'
import type { LocationData } from '@shared/types'

const DEFAULT_RADIUS_MILES = 25

export function RiverDiscovery() {
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
        source: 'manual'
      }

      setLocation({
        type: 'city',
        city: entry.city,
        state: entry.state,
        zip: primaryZip,
      })

      navigate(`/search?lat=${loc.latitude}&lng=${loc.longitude}&radius=${DEFAULT_RADIUS_MILES}`)
    },
    [navigate, setLocation]
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AvailableLocations />
        <NewestStores />
        <HomeVendorTypes />
        <HomeNewestProducts />
        <HomeSellSection />
      </div>
    </div>
  )
}
