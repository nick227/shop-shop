/**
 * Home — discovery: featured hero, stats, then the shared DiscoverySection.
 * Location preference stays in URL for search filtering; no "pick location" wizard on this page.
 */
import { useQuery } from '@tanstack/react-query'
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import { useAvailableLocations, useHeroStore } from '@shared/hooks/hooks/store'
import {
  LocationUrlNotice,
  HomeFeaturedHero,
  DiscoverySection,
} from '@features/home/components'
import { PageShell } from '@shared/ui/layout/PageShell'
import { Wrench } from 'lucide-react'

function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

function usePublicSettings() {
  return useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const res = await fetch(`${getApiBase()}/api/settings/public`)
      if (!res.ok) return {}
      return res.json().then((d: { settings: Record<string, string> }) => d.settings)
    },
    staleTime: 60_000,
  })
}

export default function HomePage() {
  const { urlLocationNotice, setUrlLocationNotice } = useUrlLocation()
  const { data: directory, isLoading: directoryLoading } = useAvailableLocations()
  const { data: heroStore, isLoading: heroLoading } = useHeroStore()
  const { data: settings } = usePublicSettings()

  const maintenanceMode = settings?.['platform.maintenance_mode'] === 'true'
  const maintenanceMessage =
    settings?.['platform.maintenance_message'] ||
    'We are performing scheduled maintenance. Please check back soon.'

  const marketplaceTotal = directory?.total ?? 0

  return (
    <PageShell
      className="bg-background"
      containerClassName="max-w-5xl"
      contentClassName="space-y-10 py-6 md:py-12"
    >
      {maintenanceMode && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
          <Wrench className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{maintenanceMessage}</span>
        </div>
      )}

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
