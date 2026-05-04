// @ts-nocheck
/**
 * StoreHeroCard - Full-screen hero card for store discovery
 * Single-focus UX: Bold, immersive design
 */
import { Button, Image } from '@shared/ui/primitives'
import { parseStore } from '@api/types/helpers'
import { formatDistance } from '@shared/lib/format'
import type { StoreWithDistance, StoreClickHandler } from '@api/types'
import styles from './StoreHeroCard.module.css'

export interface StoreHeroCardProps {
  readonly store: StoreWithDistance
  readonly onViewMenu?: StoreClickHandler
}

export function StoreHeroCard({ store, onViewMenu }: StoreHeroCardProps) {
  const typedStore = parseStore(store)
  
  const imageUrl = (store as { imageUrl?: string }).imageUrl
  
  const handleViewMenu = () => {
    onViewMenu?.(store)
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      {/* Hero image section */}
      <div className="">
	        <Image
	          src={imageUrl ?? '/placeholder-store-hero-' + store.id + '.jpg'}
	          alt={'' + store.name + ' hero image'}
	          fallbackSeed={'hero-' + store.id + ''}
	          containerClassName="w-full rounded-lg"
	          aspectRatio="16/9"
	        />
        
        {/* Status badge */}
        {!store.isPublished && (
          <div className="">Draft</div>
        )}
      </div>

      {/* Content section */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <h2 className="">{store.name}</h2>
        
        {store.description && (
          <p className="">{store.description}</p>
        )}
        
        {/* Meta info */}
        <div className="">
          {store.distance !== undefined && (
            <div className="">
              <span className="">📍</span>
              <span className="">
                {formatDistance(store.distance)} away
              </span>
            </div>
          )}
          
          <div className="">
            <span className="">⭐</span>
            <span className="">4.8</span>
          </div>
          
          <div className="">
            <span className="">🕐</span>
            <span className="">{store.prepTimeMin} min</span>
          </div>
          
          {typedStore.deliveryFee ? (
            <div className="">
              <span className="">💰</span>
              <span className="">
                ${typedStore.deliveryFee.toFixed(2)} delivery
              </span>
            </div>
          ) : undefined}
        </div>

        {/* Primary action */}
        <Button 
          fullWidth 
          size="large" 
          onClick={handleViewMenu}
          className=""
        >
          View Menu →
        </Button>
      </div>
    </div>
  )
}

