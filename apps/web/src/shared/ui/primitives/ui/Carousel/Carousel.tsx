/**
 * Carousel - Horizontal/Vertical scrollable container with three layout variants
 * Supports stores and products with search integration
 */
import type { ReactNode, UIEvent } from 'react';
import { useRef, useState, useCallback, useEffect } from 'react'
import { SCROLL_AMOUNT_MULTIPLIER, SCROLL_THRESHOLD_PX, NAV_SYMBOL, ARIA_LABEL, SCROLL_DIRECTION } from './constants'
import { styles } from '@shared/lib/tailwind-classes'

export type CarouselVariant = 'compact' | 'horizontal' | 'vertical'
export type { ScrollDirection } from './constants'

export interface CarouselProps {
  children: ReactNode
  variant?: CarouselVariant
  title?: string
  subtitle?: string
  showControls?: boolean
  itemWidth?: number
  gap?: number
  className?: string
}

const DEFAULT_VARIANT: CarouselVariant = 'horizontal'

export function Carousel({
  children,
  variant = DEFAULT_VARIANT,
  title,
  subtitle,
  showControls = true,
  className = ''
}: Readonly<CarouselProps>) {
  const scrollRef = useRef<HTMLDivElement>()
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const element = scrollRef.current
    if (!element) return

    const isVertical = variant === 'vertical'
    const scrollPos = isVertical ? element.scrollTop : element.scrollLeft
    const scrollSize = isVertical ? element.scrollHeight : element.scrollWidth
    const clientSize = isVertical ? element.clientHeight : element.clientWidth

    setCanScrollLeft(scrollPos > 0)
    setCanScrollRight(scrollPos < scrollSize - clientSize - SCROLL_THRESHOLD_PX)
  }, [variant])

  // Initialize scroll state on mount and when children change
  useEffect(() => {
    checkScroll()
  }, [checkScroll, children])

  const handleScroll = useCallback((_e: UIEvent<HTMLDivElement>) => {
    checkScroll()
  }, [checkScroll])

  const scroll = useCallback((direction: string) => {
    const element = scrollRef.current
    if (!element) return

    const scrollAmount = element.clientWidth * SCROLL_AMOUNT_MULTIPLIER
    const isVertical = variant === 'vertical'
    const isBackward = direction === SCROLL_DIRECTION.LEFT || direction === SCROLL_DIRECTION.UP

    if (isVertical) {
      const scrollTo = isBackward
        ? element.scrollTop - scrollAmount
        : element.scrollTop + scrollAmount
      
      element.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      })
    } else {
      const scrollTo = isBackward
        ? element.scrollLeft - scrollAmount
        : element.scrollLeft + scrollAmount

      element.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      })
    }
  }, [variant])

  const VARIANT_CLASSES = {
    compact: styles.compact,
    vertical: styles.vertical,
    horizontal: styles.horizontal
  } as const
  
  const variantClass = VARIANT_CLASSES[variant]
  const isVertical = variant === 'vertical'

  const scrollLeft = useCallback(() => scroll(SCROLL_DIRECTION.LEFT), [scroll])
  const scrollRight = useCallback(() => scroll(SCROLL_DIRECTION.RIGHT), [scroll])

  return (
    <div className={`${styles.carousel} ${variantClass} ${className}`}>
      {(title ?? subtitle) && (
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      )}

      <div className="w-full relative">
        {showControls && canScrollLeft && !isVertical && (
          <button
            type="button"
            className={`${styles.control} ${styles.controlLeft}`}
            onClick={scrollLeft}
            aria-label={ARIA_LABEL.SCROLL_LEFT}
          >
            {NAV_SYMBOL.LEFT}
          </button>
        )}

        <div
          ref={scrollRef as React.RefObject<HTMLDivElement>}
          className={styles.scrollContainer}
          onScroll={handleScroll}
        >
          <div className={styles.content}>
            {children}
          </div>
        </div>

        {showControls && canScrollRight && !isVertical && (
          <button
            type="button"
            className={`${styles.control} ${styles.controlRight}`}
            onClick={scrollRight}
            aria-label={ARIA_LABEL.SCROLL_RIGHT}
          >
            {NAV_SYMBOL.RIGHT}
          </button>
        )}
      </div>

      {showControls && isVertical && (
        <div className={styles.verticalControls}>
          {canScrollLeft && (
            <button
              type="button"
              className={styles.verticalControl}
              onClick={scrollLeft}
              aria-label={ARIA_LABEL.SCROLL_UP}
            >
              {NAV_SYMBOL.UP}
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              className={styles.verticalControl}
              onClick={scrollRight}
              aria-label={ARIA_LABEL.SCROLL_DOWN}
            >
              {NAV_SYMBOL.DOWN}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

