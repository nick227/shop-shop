/**
 * Home — discovery: featured hero, stats, then the shared DiscoverySection.
 * Location preference stays in URL for search filtering; no "pick location" wizard on this page.
 */
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import { useAvailableLocations, useHeroStore } from '@shared/hooks/hooks/store'
import {
  LocationUrlNotice,
  HomeFeaturedHero,
  DiscoverySection,
} from '@features/home/components'
import { PageShell } from '@shared/ui/layout/PageShell'

export default function HomePage() {
  const { urlLocationNotice, setUrlLocationNotice } = useUrlLocation()
  const { data: directory, isLoading: directoryLoading } = useAvailableLocations()
  const { data: heroStore, isLoading: heroLoading } = useHeroStore()

  const marketplaceTotal = directory?.total ?? 0

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

      <DiscoverySection />
    </PageShell>
  )
}
