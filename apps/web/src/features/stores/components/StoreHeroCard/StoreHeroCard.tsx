/**
 * StoreHeroCard - Full-screen hero card for store discovery
 * Single-focus UX: Bold, immersive design
 */
import { Button, Image } from '@ui'
import { parseStore } from '@api/types'
import { formatDistance } from '@utils/format'
import type { StoreWithDistance, StoreClickHandler } from '@api/types'
import styles from './StoreHeroCard.module.css'

export interface StoreHeroCardProps {
  store: StoreWithDistance
  onViewMenu?: StoreClickHandler
}

export function StoreHeroCard({ store, onViewMenu }: StoreHeroCardProps) {
  const typedStore = parseStore(store)
  
  // @ts-expect-error - imageUrl will be added to Store type when backend supports it
  const imageUrl = store.imageUrl
  
  const handleViewMenu = () => {
    onViewMenu?.(store)
  }

  return (
    <div className={styles['card']}>
      {/* Hero image section */}
      <div className={styles['heroImage']}>
        <Image
          src={imageUrl || '/placeholder-store-hero-' + store.id + '.jpg'}
          alt={'' + store.name + ' hero image'}
          fallbackSeed={'hero-' + store.id + ''}
          containerClassName={styles['heroImageContainer']}
        />
        
        {/* Status badge */}
        {!store.isPublished && (
          <div className={styles['badge']}>Draft</div>
        )}
      </div>

      {/* Content section */}
      <div className={styles['content']}>
        <h2 className={styles['name']}>{store.name}</h2>
        
        {store.description && (
          <p className={styles['description']}>{store.description}</p>
        )}
        
        {/* Meta info */}
        <div className={styles['meta']}>
          {store.distance !== undefined && (
            <div className={styles['metaItem']}>
              <span className={styles['metaIcon']}>📍</span>
              <span className={styles['metaText']}>
                {formatDistance(store.distance)} away
              </span>
            </div>
          )}
          
          <div className={styles['metaItem']}>
            <span className={styles['metaIcon']}>⭐</span>
            <span className={styles['metaText']}>4.8</span>
          </div>
          
          <div className={styles['metaItem']}>
            <span className={styles['metaIcon']}>🕐</span>
            <span className={styles['metaText']}>{store.prepTimeMin} min</span>
          </div>
          
          {typedStore.fees?.["deliveryFee"] ? (
            <div className={styles['metaItem']}>
              <span className={styles['metaIcon']}>💰</span>
              <span className={styles['metaText']}>
                ${(typedStore.fees["deliveryFee"] as number).toFixed(2)} delivery
              </span>
            </div>
          ) : null}
        </div>

        {/* Primary action */}
        <Button 
          fullWidth 
          size="large" 
          onClick={handleViewMenu}
          className={styles['cta']}
        >
          View Menu →
        </Button>
      </div>
    </div>
  )
}


