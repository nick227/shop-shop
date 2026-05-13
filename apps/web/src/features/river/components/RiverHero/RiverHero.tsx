import React from 'react'
import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { getStoreImageUrl } from '@shared/lib/utils/storeAccessors'
import { cn } from '@shared/lib/cn'

/** Minimal store shape for hero image + link (covers featured `StoreWithDistance` and browse `StoreSearchResult`). */
export type RiverHeroStore = {
  readonly id: string
  readonly name: string
  readonly imageUrl?: string
  readonly mediaAssets?: readonly { readonly url: string; readonly kind: string }[]
}

interface RiverHeroProps {
  readonly store: RiverHeroStore | null | undefined
  readonly isLoading: boolean
  /** When true, sits inside a parent card: no outer radius/border (parent clips corners). */
  readonly embedded?: boolean
  /** Fires on pointer down before navigation (e.g. to stop carousel auto-advance). */
  readonly onInteraction?: () => void
}

export function RiverHero({ store, isLoading, embedded = false, onInteraction }: RiverHeroProps) {
  const frame = cn(
    'relative aspect-[3/2] min-h-[260px] w-full overflow-hidden sm:aspect-[16/7]',
    embedded ? 'rounded-none border-0 border-b border-gray-100' : 'rounded-2xl border border-border',
  )

  if (isLoading) {
    return (
      <div
        className={cn(frame, 'bg-muted animate-pulse')}
        aria-busy="true"
        aria-label="Loading featured kitchen"
      />
    )
  }

  if (!store) {
    return (
      <div className={cn(frame, 'flex items-center justify-center bg-muted/60')}>
        <p className="text-sm text-muted-foreground">Featured stores will appear here.</p>
      </div>
    )
  }

  return (
    <Link
      to={getStoreRoute({ id: store.id, name: store.name })}
      className="block group"
      onPointerDownCapture={() => onInteraction?.()}
    >
      <div className={frame}>
        <img
          src={getStoreImageUrl(store)}
          alt={store.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent">
          <div className="absolute inset-0 flex items-end justify-start p-4 sm:p-6">
            <div className="flex items-center gap-2 text-white">
              <Flame className="h-4 w-4 shrink-0" aria-hidden />
              <div className="min-w-0">
                <h3 className="text-lg font-bold leading-tight">{store.name}</h3>
                <p className="text-sm opacity-90">Featured Kitchen</p>
                <p className="text-xs opacity-75">Click to explore menu →</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
