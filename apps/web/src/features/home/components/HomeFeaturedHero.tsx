/**
 * Full-width hero spotlight for the freshest marketplace kitchen.
 */
import { Link } from 'react-router-dom'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { getStoreImageUrl } from '@shared/lib/utils/storeAccessors'
import type { StoreWithDistance } from '@api/types'

interface HomeFeaturedHeroProps {
  readonly store: StoreWithDistance | null | undefined
  readonly isLoading: boolean
}

export function HomeFeaturedHero({ store, isLoading }: HomeFeaturedHeroProps) {
  if (isLoading) {
    return (
      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-muted animate-pulse" />
    )
  }

  if (!store) {
    return (
      <div className="relative flex aspect-[21/9] w-full items-center justify-center rounded-2xl border border-border bg-muted/80">
        <p className="text-sm text-muted-foreground">Kitchens will appear here once stores go live.</p>
      </div>
    )
  }

  const img = getStoreImageUrl(store, 'hero')
  const href = getStoreRoute({ id: store.id, name: store.name })

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border shadow-lg">
      <div className="relative aspect-[21/9] min-h-[200px] w-full">
        <img src={img} alt={store.name} className="absolute inset-0 h-full w-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-3 p-5 sm:p-8 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Featured kitchen</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{store.name}</h2>
            {store.description ? (
              <p className="mt-2 line-clamp-2 max-w-xl text-sm text-muted-foreground">{store.description}</p>
            ) : null}
          </div>
          <Link
            to={href}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-md bg-primary px-5 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            View menu
          </Link>
        </div>
      </div>
    </section>
  )
}
