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
import { Header, HeroSection, UrlParamError } from '@features/home/components'
import { Button } from '@shared/ui/primitives'
import { PageComposition as PageCompositionFactory, LayoutComposition as LayoutCompositionFactory } from '@shared/ui/composition'

const DEFAULT_RADIUS_MILES = 25

export default function HomePage() {
  const navigate = useNavigate()
  const routerLocation = useLocation()
  const { location, urlParamError, setLocation, setUrlParamError, clearLocation } = useUrlLocation()
  const { locationDisplayName, citiesContextResult } = useLocationDisplay(location, undefined)

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
    <PageCompositionFactory.Marketing
      layout="top-nav"
      sections={['header', 'content']}
      responsive={true}
      accessibility={true}
      className="min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700"
      header={
        <Header
          locationDisplayName={locationDisplayName}
          currentRadius={currentRadius}
          citiesContextResult={citiesContextResult}
          onClearLocation={clearLocation}
          onNavigateToVendor={() => navigate('/vendor')}
        />
      }
    >
      <LayoutCompositionFactory.Stack
        direction="column"
        gap="md"
        responsive={true}
        className="mx-auto max-w-4xl px-4 py-6"
      >
        <UrlParamError error={urlParamError} onDismiss={() => setUrlParamError(undefined)} />

        <HeroSection
          headline="Set your location"
          subheadline="Start here, then continue to search."
          variant="compact"
        />

        <div className="rounded-2xl border border-white/25 bg-white/95 shadow-xl">
          <div id="home-location-search" className="px-4 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Where are you shopping?
            </p>
            <LocationSearch onLocationChange={handleLocationChange} showHistory={true} />
          </div>
        </div>

        {location ? (
          <div className="flex justify-center">
            <Button variant="primary" onClick={goToSearch}>
              Continue to search
            </Button>
          </div>
        ) : null}
      </LayoutCompositionFactory.Stack>
    </PageCompositionFactory.Marketing>
  )
}
