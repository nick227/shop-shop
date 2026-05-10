/**
 * Full-width editorial hero spotlight for the featured marketplace kitchen.
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { getStoreImageUrl } from '@shared/lib/utils/storeAccessors'
import { usePublicMediaList } from '@shared/hooks/hooks/vendor/usePublicMediaList'
import type { StoreWithDistance } from '@api/types'

interface HomeFeaturedHeroProps {
  readonly store: StoreWithDistance | null | undefined
  readonly isLoading: boolean
}

function HomeFeaturedHeroComponent({ store, isLoading }: HomeFeaturedHeroProps) {
  if (isLoading) {
    return <div className="relative aspect-[3/2] min-h-[260px] w-full overflow-hidden rounded-2xl border border-border bg-muted animate-pulse sm:aspect-[16/7]" />
  }

  if (!store) {
    return (
      <div className="relative flex aspect-[3/2] w-full items-center justify-center rounded-2xl border border-border bg-muted/60 sm:aspect-[16/7]">
        <p className="text-sm text-muted-foreground">Kitchens will appear here once stores go live.</p>
      </div>
    )
  }

  const { data: heroMedia } = usePublicMediaList({ storeId: store.id })
  const primaryHeroImage = heroMedia?.find((m) => m.kind === 'IMAGE' || !m.kind)?.url

  const img = primaryHeroImage ?? getStoreImageUrl(store, 'hero')
  const href = getStoreRoute({ id: store.id, name: store.name })

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border shadow-lg">
      <div className="relative aspect-[3/2] min-h-[260px] w-full sm:aspect-[16/7]">
        <img
          src={img}
          alt={store.name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        {/* Rich dark overlay — readable over any photo in any theme */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          {/* Featured pill */}
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            <Flame className="h-3 w-3" />
            Featured kitchen
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {store.name}
              </h2>
              {store.description && (
                <p className="mt-1.5 line-clamp-2 max-w-xl text-sm text-white/70">
                  {store.description}
                </p>
              )}
            </div>
            <Link
              to={href}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-md bg-white px-5 text-base font-semibold text-black transition-colors hover:bg-white/90"
            >
              View menu
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export const HomeFeaturedHero = React.memo(HomeFeaturedHeroComponent)
