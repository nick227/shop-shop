import React from 'react'
import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { getStoreImageUrl } from '@shared/lib/utils/storeAccessors'
import type { StoreWithDistance } from '@api/types'

interface RiverHeroProps {
  readonly store: StoreWithDistance | null | undefined
  readonly isLoading: boolean
}

export function RiverHero({ store, isLoading }: RiverHeroProps) {
  if (isLoading) {
    return <div className="relative aspect-[3/2] min-h-[260px] w-full overflow-hidden rounded-2xl border border-border bg-muted animate-pulse sm:aspect-[16/7]" />
  }

  if (!store) {
    return (
      <div className="relative flex aspect-[3/2] w-full items-center justify-center rounded-2xl border border-border bg-muted/60 sm:aspect-[16/7]">
        <p className="text-sm text-muted-foreground">Featured stores will appear here.</p>
      </div>
    )
  }

  return (
    <Link to={getStoreRoute({ id: store.id, name: store.name })} className="block group">
      <div className="relative aspect-[3/2] min-h-[260px] w-full overflow-hidden rounded-2xl border border-border">
        <img
          src={getStoreImageUrl(store)}
          alt={store.name}
          className="object-cover w-full h-full transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent pointer-events-none">
          <div className="absolute inset-0 flex items-end justify-start p-4 sm:p-6">
            <div className="flex items-center gap-2 text-white">
              <Flame className="h-4 w-4" />
              <div>
                <h3 className="font-bold text-lg">{store.name}</h3>
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
