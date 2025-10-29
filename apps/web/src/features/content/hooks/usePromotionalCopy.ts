/**
 * usePromotionalCopy - Dynamic promotional content for homepage
 * Provides contextual, engaging copy based on user location and results
 */
import { useMemo } from 'react'
import type { StoreWithDistance } from '@api/types'
import { getStoreCountText } from '@shared/lib/storeHelpers'

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
 * Get hero subheadline based on time of day
 */
function getHeroSubheadline(timeOfDay: CopyContext["timeOfDay"]): string {
  if (timeOfDay === 'morning') return 'Fresh breakfast delivered fast. Start your day delicious.'
  if (timeOfDay === 'afternoon') return 'Lunch sorted. From local favorites to hidden gems, find your perfect meal.'
  if (timeOfDay === 'evening') return 'Dinner made easy. Explore cuisines from around the corner and around the world.'
  return 'Open late and ready to deliver. Because hunger doesn\'t sleep.'
}

/**
 * Get contextual promotional copy based on location and results
 */
export function usePromotionalCopy(
  locationName?: string,
  stores?: StoreWithDistance[]
): PromotionalCopy {
  return useMemo(() => {
    const storeCount = stores?.length ?? 0
    const hasStores = storeCount > 0
    const timeOfDay = getTimeOfDay()
    
    // Contextual greeting
    const greetings = {
      morning: 'Good Morning!',
      afternoon: 'Good Afternoon!',
      evening: 'Good Evening!',
      night: 'Late Night Cravings?'
    }

    // Hero section - changes based on context
    const verbText = storeCount === 1 ? 'is' : 'are'
    const headlineText = locationName
      ? `${getStoreCountText(storeCount)} ${verbText} ready to serve you ${locationName}`
      : `${getStoreCountText(storeCount)} ${verbText} waiting to serve you`
    
    const hero = hasStores
      ? {
          headline: headlineText,
          subheadline: getHeroSubheadline(timeOfDay),
          cta: 'Browse Restaurants'
        }
      : {
          headline: greetings[timeOfDay],
          subheadline: 'Discover amazing restaurants delivering to your neighborhood. Fresh food, fast delivery, unforgettable flavors.',
          cta: 'Find Restaurants Near You'
        }

    // Featured section
    const featured = {
      title: hasStores ? '⭐ Featured Restaurants' : '🌟 Explore Local Favorites',
      subtitle: hasStores
        ? 'Hand-picked gems from your area. Award-winning chefs, crowd favorites, and hidden treasures.'
        : 'Search your location to discover incredible restaurants ready to deliver straight to your door.'
    }

    // Nearby section
    const nearby = {
      title: hasStores ? '📍 Restaurants Near You' : '🗺️ Deliver to Your Door',
      subtitle: hasStores
        ? 'Sorted by distance. ' + storeCount + ' local restaurants offering delivery and pickup.'
        : 'Enter your ZIP code or use your location to see restaurants delivering to you right now.'
    }

    // Benefits section
    const benefits = {
      title: 'Why Choose Us?',
      items: [
        '🚀 Lightning-fast delivery from local restaurants',
        '⭐ Curated selection of verified, quality vendors',
        '💰 Transparent pricing with no hidden fees',
        '🔒 Secure checkout and protected transactions',
        '📱 Real-time order tracking from kitchen to door',
        '❤️ Support local businesses in your community'
      ]
    }

    // Social/community section
    const social = {
      title: '🎉 Join the Foodie Community',
      subtitle: 'Share photos, discover new dishes, and connect with fellow food lovers. Follow your favorite restaurants and never miss their latest creations.'
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

