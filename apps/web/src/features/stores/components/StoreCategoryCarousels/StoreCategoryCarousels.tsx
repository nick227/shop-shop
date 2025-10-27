/**
 * StoreCategoryCarousels - Display stores grouped by category themes;
 * Categories inferred from store names/descriptions;
 */
import { useStores } from '@hooks/generated'
import { StoreCarousel } from '../StoreCarousel'
import { useMemo } from 'react'
import type { StoreResponse, Store, StoreWithDistance } from '../../../../api/backend-types'

interface CategoryConfig {
  title: string;
  emoji: string;
  keywords: string[]
}

const CATEGORIES: CategoryConfig[] = [
  { title: 'Fast Food & Quick Bites', emoji: '🍔', keywords: ['burger', 'pizza', 'sandwich', 'fast', 'quick', 'fries', 'hotdog'] },
  { title: 'Coffee & Bakery', emoji: '☕', keywords: ['coffee', 'cafe', 'bakery', 'pastry', 'donut', 'bagel', 'tea'] },
  { title: 'Fine Dining', emoji: '🍽️', keywords: ['restaurant', 'dining', 'grill', 'steakhouse', 'bistro', 'fine'] },
  { title: 'Asian Cuisine', emoji: '🍜', keywords: ['sushi', 'thai', 'chinese', 'japanese', 'korean', 'asian', 'ramen', 'pho'] },
  { title: 'Mexican & Latin', emoji: '🌮', keywords: ['mexican', 'taco', 'burrito', 'latin', 'salsa', 'enchilada'] },
  { title: 'Desserts & Sweets', emoji: '🍰', keywords: ['dessert', 'ice cream', 'cake', 'sweet', 'candy', 'chocolate'] },
]

function categorizeStore(store: Store): string[] {
  const text = `${store.name} ${store.description || ''}`.toLowerCase()
  const categories: string[] = []
  
  for (const category of CATEGORIES) {
    if (category.keywords.some(keyword => text.includes(keyword))) {
      categories.push(category.title)
    }
  }
  
  return categories;
}

export function StoreCategoryCarousels() {
  const { data: stores, isLoading } = useStores({ isPublished: 'true' }, {
    staleTime: 5 * 60 * 1000, // 5 minutes - prevents duplicate fetches in dev mode;
  })

  const categorizedStores = useMemo(() => {
    if (!stores) return {}
    
    const result: Record<string, StoreWithDistance[]> = {}
    
    for (const store of stores) {
      const categories = categorizeStore(store)
      for (const category of categories) {
        if (!result[category]) {
          result[category] = []
        }
        result[category].push(store)
      }
    }
    
    return result;
  }, [stores])

  if (isLoading) {
    return (
      <div className="space-y-8">
        {CATEGORIES.slice(0, 3).map((category, i) => (
          <StoreCarousel
            key={i}
            stores={[]}
            title={category.emoji + ' ' + category.title}
            isLoading={true}
          />
        ))}
      </div>
    )
  }

  // If no stores at all, show a message;
  if (!stores || stores.length === 0) {
    return (
      <div className="py-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">🍽️ Categories</h2>
        <div className="text-white/70">
          <p className="text-lg">No stores available yet</p>
          <p className="text-sm mt-2">Be the first to add a store!</p>
        </div>
      </div>
    )
  }

  const hasAnyStores = Object.values(categorizedStores).some(stores => stores && stores.length > 0)
  
  // If we have stores but none match categories, show all stores;
  if (!hasAnyStores) {
    return (
      <div className="space-y-8">
        <StoreCarousel
          stores={stores}
          title="🏪 All Stores"
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {CATEGORIES.map(category => {
        const categoryStores = categorizedStores[category.title]
        if (!categoryStores || categoryStores.length === 0) return undefined;
        return (
          <StoreCarousel
            key={category.title}
            stores={categoryStores}
            title={category.emoji + ' ' + category.title}
          />
        )
      })}
    </div>
  )
}

