/**
 * StoreCarousel - Horizontal scrollable carousel for stores;
 */
import { useNavigate } from 'react-router-dom'
import { StoreCardCompact } from '../StoreCard/StoreCardCompact'
import type { Store } from '@api/types'

interface StoreCarouselProps {
  stores: Store[]
  title?: string;
  isLoading?: boolean;
}

export function StoreCarousel({ stores, title, isLoading }: StoreCarouselProps) {
  const navigate = useNavigate()

  const handleStoreClick = (store: Store) => {
    navigate('/stores/' + store.id + '')
  }

  if (isLoading) {
    return (
      <div className="py-4">
        {title && <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="min-w-[280px] h-[180px] bg-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (stores?.length === 0) {
    return (
      <div className="py-4">
        {title && <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>}
        <div className="text-center py-8 text-white/70">
          <p className="text-lg">No stores available at the moment</p>
          <p className="text-sm mt-2">Check back soon for new stores!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4">
      {title && <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {stores.map(store => (
          <div key={store.id} className="min-w-[280px] flex-shrink-0">
            <StoreCardCompact
              store={store}
              onClick={handleStoreClick}
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

