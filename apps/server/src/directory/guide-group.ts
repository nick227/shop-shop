export type GuideGroup = 'featured' | 'food' | 'shopping' | 'arts' | 'parks'

const FOOD = new Set(['RESTAURANT', 'COFFEE', 'BAKERY'])
const SHOPPING = new Set(['RETAIL', 'GROCERY', 'CONVENIENCE'])
const PARKS = new Set(['Park', 'Library'])

export function guideGroup(category: string, categoryLabel: string): GuideGroup | null {
  if (PARKS.has(categoryLabel)) return 'parks'
  if (FOOD.has(category) || categoryLabel === 'Bar' || categoryLabel === 'Pub' || categoryLabel === 'Ice cream') return 'food'
  if (SHOPPING.has(category)) return 'shopping'
  if (category === 'ENTERTAINMENT' || category === 'ATTRACTION') return 'arts'
  return null
}

export const GUIDE_TITLES: Record<GuideGroup, string> = {
  featured: 'Featured in this area',
  food: 'Food & Drink',
  shopping: 'Shopping',
  arts: 'Arts & Entertainment',
  parks: 'Parks & Outdoors',
}
