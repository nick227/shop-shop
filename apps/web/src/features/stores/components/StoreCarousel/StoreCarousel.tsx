/**
 * StoreCarousel — horizontal strip; `fallback` variant stays visually secondary.
 */
import { useNavigate } from 'react-router-dom'
import { StoreCardCompact } from '../StoreCard/StoreCardCompact'
import type { StoreResponse, StoreWithDistance } from '@api/types'
import { cn } from '@shared/lib/cn'

export interface StoreCarouselProps {
  readonly stores: StoreWithDistance[]
  readonly title?: string
  readonly isLoading?: boolean
  readonly variant?: 'default' | 'fallback'
}

export function StoreCarousel({ stores, title, isLoading, variant = 'default' }: StoreCarouselProps) {
  const navigate = useNavigate()
  const fallback = variant === 'fallback'

  const handleStoreClick = (store: StoreResponse) => {
    navigate(`/stores/${store.id}`)
  }

  if (isLoading) {
    return (
      <div className={cn('py-4', fallback && 'py-2')}>
        {title && (
          <h2
            className={cn(
              'mb-2 font-semibold text-white',
              fallback ? 'text-xs uppercase tracking-wide text-white/55' : 'mb-4 text-2xl font-bold'
            )}
          >
            {title}
          </h2>
        )}
        <div className={cn('flex overflow-x-auto pb-2', fallback ? 'gap-2' : 'gap-4 pb-4')}>
          {Array.from({ length: fallback ? 3 : 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'animate-pulse rounded-lg',
                fallback ? 'h-[72px] min-w-[200px] bg-white/10' : 'h-[180px] min-w-[280px] bg-white/10'
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  if (stores?.length === 0) {
    return (
      <div className={cn('py-4', fallback && 'py-2')}>
        {title && (
          <h2 className={cn('mb-2 font-semibold text-white', fallback ? 'text-xs text-white/55' : 'mb-4 text-2xl')}>
            {title}
          </h2>
        )}
        <div className="py-4 text-center text-sm text-white/60">
          <p>No stores to show here yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'py-4',
        fallback && 'rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3'
      )}
    >
      {title && (
        <h2
          className={cn(
            'font-semibold text-white',
            fallback ? 'mb-2 text-xs uppercase tracking-wide text-white/55' : 'mb-4 text-2xl font-bold'
          )}
        >
          {title}
        </h2>
      )}
      <div className={cn('flex overflow-x-auto scrollbar-hide', fallback ? 'gap-2 pb-1' : 'gap-4 pb-4')}>
        {stores.map((store) => (
          <div
            key={store.id}
            className={cn('flex-shrink-0', fallback ? 'min-w-[200px] max-w-[220px]' : 'min-w-[280px]')}
          >
            <StoreCardCompact
              store={store}
              onClick={handleStoreClick}
              variant={fallback ? 'fallback' : 'default'}
            />
          </div>
        ))}
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

