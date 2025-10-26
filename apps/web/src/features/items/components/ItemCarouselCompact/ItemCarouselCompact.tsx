/**
 * ItemCarouselCompact - Full-screen sliding product carousel
 */
import type { TouchEvent } from 'react';
import { useState, useRef, useCallback, useMemo } from 'react'
import { Image } from '@ui'
import { SWIPE_THRESHOLD_PX, NAV_SYMBOL, ARIA_LABEL } from '@ui/Carousel/constants'
import type { Item } from '@api/types'
import { formatCurrency } from '@utils/format'
import { parsePrice } from '@api/types'
import { getImageUrl } from '@utils/image'
import { styles } from '@utils/tailwind-classes'

export interface ItemCarouselCompactProps {
  items: Item[]
  storeName: string
  onClose?: () => void
}

export function ItemCarouselCompact({ items, storeName, onClose }: ItemCarouselCompactProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartX = useRef<number>(0)

  const itemsLength = items.length
  const hasItems = itemsLength > 0
  const hasMultipleItems = itemsLength > 1
  const isFirstSlide = currentIndex === 0
  const isLastSlide = currentIndex === itemsLength - 1

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, itemsLength - 1)))
  }, [itemsLength])

  const goNext = useCallback(() => {
    if (!isLastSlide) {
      setCurrentIndex(prev => prev + 1)
    }
  }, [isLastSlide])

  const goPrevious = useCallback(() => {
    if (!isFirstSlide) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [isFirstSlide])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches[0]) {
      touchStartX.current = e.touches[0].clientX
    }
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!e.changedTouches[0]) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX
    
    if (Math.abs(diff) > SWIPE_THRESHOLD_PX) {
      if (diff > 0) {
        goNext()
      } else {
        goPrevious()
      }
    }
  }, [goNext, goPrevious])

  const currentItem = useMemo(() => items[currentIndex], [items, currentIndex])
  const price = useMemo(() => parsePrice(currentItem?.price || '0'), [currentItem])
  // @ts-expect-error - imageUrl will be added to Item type when backend supports it
  const imageUrl = useMemo(() => getImageUrl(currentItem?.imageUrl, currentItem?.id || '', 'item'), [currentItem])

  if (!hasItems) return null

  return (
    <div className={styles['carousel']}>
      <div 
        className={styles['slide']}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={imageUrl}
          alt={currentItem?.title || 'Item'}
          fallbackSeed={currentItem?.id || 'unknown'}
          className={styles['image']}
        />
        
        <div className={styles['overlay']} />
        
        <div className={styles['content']}>
          <h1 className={styles['title']}>{currentItem?.title || 'Item'}</h1>
          <div className={styles['meta']}>
            <p className={styles['store']}>{storeName}</p>
            <p className={styles['price']}>{formatCurrency(price)}</p>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      {!isFirstSlide && (
        <button
          type="button"
          className={`${styles['nav']} ${styles['navPrev']}`}
          onClick={goPrevious}
          aria-label={ARIA_LABEL.PREVIOUS_ITEM}
        >
          {NAV_SYMBOL.LEFT}
        </button>
      )}
      
      {!isLastSlide && (
        <button
          type="button"
          className={`${styles['nav']} ${styles['navNext']}`}
          onClick={goNext}
          aria-label={ARIA_LABEL.NEXT_ITEM}
        >
          {NAV_SYMBOL.RIGHT}
        </button>
      )}

      {/* Dots Indicator */}
      {hasMultipleItems && (
        <div className={styles['dots']}>
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`${styles['dot']} ${index === currentIndex ? styles['dotActive'] : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={ARIA_LABEL.GO_TO_ITEM(index)}
            />
          ))}
        </div>
      )}

      {/* Close Button */}
      {onClose && (
        <button
          type="button"
          className={styles['close']}
          onClick={onClose}
          aria-label={ARIA_LABEL.CLOSE_CAROUSEL}
        >
          {NAV_SYMBOL.CLOSE}
        </button>
      )}
    </div>
  )
}

