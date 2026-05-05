/**
 * usePromotionalCopy - Dynamic promotional content for homepage
 * Provides contextual, engaging copy based on user location and results
 */
import { useMemo } from 'react'
import type { StoreWithDistance } from '@api/types'
import { getStoreCountText } from '@shared/lib/utils/storeHelpers'

export interface PromotionalCopy {
  hero: {
    headline: string
    subheadline: string
    cta: string
  }
  featured: {
    title: string
    subtitle: string
  }
  nearby: {
    title: string
    subtitle: string
  }
  benefits: {
    title: string
    items: string[]
  }
  social: {
    title: string
    subtitle: string
  }
}

export interface CopyContext {
  locationName?: string
  storeCount?: number
  hasStores: boolean
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
}

/**
 * Get time of day for contextual messaging
 */
function getTimeOfDay(): CopyContext["timeOfDay"] {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

/**
 * Static hero line when location is set (optional contexts).
 */
function getHeroSubheadline(timeOfDay: CopyContext["timeOfDay"]): string {
  if (timeOfDay === 'morning') return 'Local vendors open now — order for pickup or delivery.'
  if (timeOfDay === 'afternoon') return 'Browse stores near you — same-day pickup and delivery.'
  if (timeOfDay === 'evening') return 'Shops and kitchens near you — transparent fees, secure checkout.'
  return 'Open late — local vendors ready when you are.'
}

/**
 * Promotional copy — stores/vendors (not restaurant-specific).
 */
export function usePromotionalCopy(
  locationName?: string,
  stores?: StoreWithDistance[]
): PromotionalCopy {
  return useMemo(() => {
    const storeCount = stores?.length ?? 0
    const hasStores = storeCount > 0
    const timeOfDay = getTimeOfDay()

    const greetings = {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      night: 'Still shopping?'
    }

    const verbText = storeCount === 1 ? 'is' : 'are'
    const headlineText = locationName
      ? `${getStoreCountText(storeCount)} ${verbText} ready near ${locationName}`
      : `${getStoreCountText(storeCount)} ${verbText} available to browse`

    const hero = hasStores
      ? {
          headline: headlineText,
          subheadline: getHeroSubheadline(timeOfDay),
          cta: 'Browse stores'
        }
      : {
          headline: greetings[timeOfDay],
          subheadline:
            'Discover local vendors delivering and offering pickup in your area.',
          cta: 'Find stores near you'
        }

    const featured = {
      title: hasStores ? '⭐ Featured stores' : '🌟 Explore local vendors',
      subtitle: hasStores
        ? 'Top picks from your search area — sorted by distance where available.'
        : 'Set your location to see stores that deliver or offer pickup.'
    }

    const nearby = {
      title: hasStores ? '📍 Stores near you' : '🗺️ Deliver or pick up',
      subtitle: hasStores
        ? `Sorted by distance. ${storeCount} vendor${storeCount === 1 ? '' : 's'} in range.`
        : 'Enter ZIP or city, or use your device location.'
    }

    const benefits = {
      title: 'Why shop here?',
      items: [
        '🚀 Fast fulfillment from local vendors',
        '⭐ Verified shops and clear menus',
        '💰 Transparent pricing — no surprise fees',
        '🔒 Secure checkout',
        '📱 Track orders from placement to pickup or delivery',
        '❤️ Support independent sellers in your community'
      ]
    }

    const social = {
      title: '🎉 Community',
      subtitle: 'Follow vendors and see updates — more social features coming soon.'
    }

    return {
      hero,
      featured,
      nearby,
      benefits,
      social
    }
  }, [locationName, stores])
}

/**
 * Get promotional badges for stores
 */
export function getStoreBadges(store: StoreWithDistance): string[] {
  const badges: string[] = []
  
  if (store.distance && store.distance < 1) {
    badges.push('📍 Under 1 mile')
  }
  
  if (store.prepTimeMin && store.prepTimeMin < 30) {
    badges.push('⚡ Quick prep')
  }
  
  // Could add more: new, trending, featured, etc.
  
  return badges
}

