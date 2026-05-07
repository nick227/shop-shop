import type { PrismaClient, TagCategory, TagTarget } from '../generated/client/index.js'

interface TagDef {
  slug: string
  label: string
  category: TagCategory
  target: TagTarget
  sortOrder?: number
  description?: string
}

const CANONICAL_TAGS: TagDef[] = [
  // ── DIETARY ─────────────────────────────────────────────────────────────────
  { slug: 'vegan',       label: 'Vegan',        category: 'DIETARY', target: 'BOTH', sortOrder: 0 },
  { slug: 'vegetarian',  label: 'Vegetarian',   category: 'DIETARY', target: 'BOTH', sortOrder: 1 },
  { slug: 'halal',       label: 'Halal',        category: 'DIETARY', target: 'BOTH', sortOrder: 2 },
  { slug: 'kosher',      label: 'Kosher',       category: 'DIETARY', target: 'BOTH', sortOrder: 3 },
  { slug: 'high-protein',label: 'High Protein', category: 'DIETARY', target: 'BOTH', sortOrder: 4 },
  { slug: 'low-carb',    label: 'Low Carb',     category: 'DIETARY', target: 'BOTH', sortOrder: 5 },

  // ── FREE FROM ────────────────────────────────────────────────────────────────
  { slug: 'gluten-free',   label: 'Gluten-Free',   category: 'FREE_FROM', target: 'BOTH', sortOrder: 0 },
  { slug: 'dairy-free',    label: 'Dairy-Free',    category: 'FREE_FROM', target: 'BOTH', sortOrder: 1 },
  { slug: 'nut-free',      label: 'Nut-Free',      category: 'FREE_FROM', target: 'BOTH', sortOrder: 2 },
  { slug: 'soy-free',      label: 'Soy-Free',      category: 'FREE_FROM', target: 'BOTH', sortOrder: 3 },
  { slug: 'egg-free',      label: 'Egg-Free',      category: 'FREE_FROM', target: 'BOTH', sortOrder: 4 },
  { slug: 'shellfish-free',label: 'Shellfish-Free',category: 'FREE_FROM', target: 'BOTH', sortOrder: 5 },

  // ── CONTAINS ALLERGEN ────────────────────────────────────────────────────────
  // Positive statements: "this item contains X"
  { slug: 'contains-gluten',    label: 'Contains Gluten',    category: 'CONTAINS_ALLERGEN', target: 'ITEM', sortOrder: 0 },
  { slug: 'contains-dairy',     label: 'Contains Dairy',     category: 'CONTAINS_ALLERGEN', target: 'ITEM', sortOrder: 1 },
  { slug: 'contains-nuts',      label: 'Contains Nuts',      category: 'CONTAINS_ALLERGEN', target: 'ITEM', sortOrder: 2 },
  { slug: 'contains-soy',       label: 'Contains Soy',       category: 'CONTAINS_ALLERGEN', target: 'ITEM', sortOrder: 3 },
  { slug: 'contains-eggs',      label: 'Contains Eggs',      category: 'CONTAINS_ALLERGEN', target: 'ITEM', sortOrder: 4 },
  { slug: 'contains-shellfish', label: 'Contains Shellfish', category: 'CONTAINS_ALLERGEN', target: 'ITEM', sortOrder: 5 },

  // ── CUISINE ──────────────────────────────────────────────────────────────────
  { slug: 'american',       label: 'American',        category: 'CUISINE', target: 'STORE', sortOrder: 0 },
  { slug: 'mexican',        label: 'Mexican',         category: 'CUISINE', target: 'STORE', sortOrder: 1 },
  { slug: 'italian',        label: 'Italian',         category: 'CUISINE', target: 'STORE', sortOrder: 2 },
  { slug: 'japanese',       label: 'Japanese',        category: 'CUISINE', target: 'STORE', sortOrder: 3 },
  { slug: 'thai',           label: 'Thai',            category: 'CUISINE', target: 'STORE', sortOrder: 4 },
  { slug: 'chinese',        label: 'Chinese',         category: 'CUISINE', target: 'STORE', sortOrder: 5 },
  { slug: 'korean',         label: 'Korean',          category: 'CUISINE', target: 'STORE', sortOrder: 6 },
  { slug: 'mediterranean',  label: 'Mediterranean',   category: 'CUISINE', target: 'STORE', sortOrder: 7 },
  { slug: 'bbq',            label: 'BBQ',             category: 'CUISINE', target: 'STORE', sortOrder: 8 },
  { slug: 'bakery-style',   label: 'Bakery',          category: 'CUISINE', target: 'STORE', sortOrder: 9 },
  { slug: 'cafe-style',     label: 'Café',            category: 'CUISINE', target: 'STORE', sortOrder: 10 },
  { slug: 'latin',          label: 'Latin',           category: 'CUISINE', target: 'STORE', sortOrder: 11 },
  { slug: 'indian',         label: 'Indian',          category: 'CUISINE', target: 'STORE', sortOrder: 12 },
  { slug: 'middle-eastern', label: 'Middle Eastern',  category: 'CUISINE', target: 'STORE', sortOrder: 13 },
  { slug: 'southern',       label: 'Southern',        category: 'CUISINE', target: 'STORE', sortOrder: 14 },

  // ── FEATURE ──────────────────────────────────────────────────────────────────
  { slug: 'catering',        label: 'Catering',         category: 'FEATURE', target: 'STORE', sortOrder: 0 },
  { slug: 'custom-orders',   label: 'Custom Orders',    category: 'FEATURE', target: 'STORE', sortOrder: 1 },
  { slug: 'bulk-orders',     label: 'Bulk Orders',      category: 'FEATURE', target: 'STORE', sortOrder: 2 },
  { slug: 'subscription',    label: 'Subscription',     category: 'FEATURE', target: 'STORE', sortOrder: 3 },
  { slug: 'pre-order',       label: 'Pre-Order',        category: 'FEATURE', target: 'STORE', sortOrder: 4 },
  { slug: 'same-day',        label: 'Same-Day',         category: 'FEATURE', target: 'STORE', sortOrder: 5 },
  { slug: 'giftable',        label: 'Giftable',         category: 'FEATURE', target: 'BOTH',  sortOrder: 6 },
  { slug: 'family-size',     label: 'Family Size',      category: 'FEATURE', target: 'BOTH',  sortOrder: 7 },
  { slug: 'corporate-orders',label: 'Corporate Orders', category: 'FEATURE', target: 'STORE', sortOrder: 8 },
  { slug: 'locally-owned',   label: 'Locally Owned',    category: 'FEATURE', target: 'STORE', sortOrder: 9 },

  // ── MEAL TIME ────────────────────────────────────────────────────────────────
  { slug: 'breakfast',  label: 'Breakfast', category: 'MEAL_TIME', target: 'BOTH', sortOrder: 0 },
  { slug: 'brunch',     label: 'Brunch',    category: 'MEAL_TIME', target: 'BOTH', sortOrder: 1 },
  { slug: 'lunch',      label: 'Lunch',     category: 'MEAL_TIME', target: 'BOTH', sortOrder: 2 },
  { slug: 'dinner',     label: 'Dinner',    category: 'MEAL_TIME', target: 'BOTH', sortOrder: 3 },
  { slug: 'snack',      label: 'Snack',     category: 'MEAL_TIME', target: 'BOTH', sortOrder: 4 },
  { slug: 'dessert-time',label: 'Dessert',  category: 'MEAL_TIME', target: 'BOTH', sortOrder: 5 },
  { slug: 'late-night', label: 'Late Night',category: 'MEAL_TIME', target: 'BOTH', sortOrder: 6 },

  // ── ITEM TYPE ────────────────────────────────────────────────────────────────
  { slug: 'entree',      label: 'Entrée',       category: 'ITEM_TYPE', target: 'ITEM', sortOrder: 0 },
  { slug: 'side',        label: 'Side',         category: 'ITEM_TYPE', target: 'ITEM', sortOrder: 1 },
  { slug: 'drink',       label: 'Drink',        category: 'ITEM_TYPE', target: 'ITEM', sortOrder: 2 },
  { slug: 'dessert',     label: 'Dessert',      category: 'ITEM_TYPE', target: 'ITEM', sortOrder: 3 },
  { slug: 'pastry',      label: 'Pastry',       category: 'ITEM_TYPE', target: 'ITEM', sortOrder: 4 },
  { slug: 'cake',        label: 'Cake',         category: 'ITEM_TYPE', target: 'ITEM', sortOrder: 5 },
  { slug: 'bread',       label: 'Bread',        category: 'ITEM_TYPE', target: 'ITEM', sortOrder: 6 },
  { slug: 'sandwich',    label: 'Sandwich',     category: 'ITEM_TYPE', target: 'ITEM', sortOrder: 7 },
  { slug: 'salad',       label: 'Salad',        category: 'ITEM_TYPE', target: 'ITEM', sortOrder: 8 },
  { slug: 'tray',        label: 'Tray',         category: 'ITEM_TYPE', target: 'ITEM', sortOrder: 9 },
  { slug: 'bundle-item', label: 'Bundle',       category: 'ITEM_TYPE', target: 'ITEM', sortOrder: 10 },
  { slug: 'box',         label: 'Box',          category: 'ITEM_TYPE', target: 'ITEM', sortOrder: 11 },
  { slug: 'family-meal', label: 'Family Meal',  category: 'ITEM_TYPE', target: 'ITEM', sortOrder: 12 },

  // ── OCCASION ────────────────────────────────────────────────────────────────
  { slug: 'birthday',     label: 'Birthday',      category: 'OCCASION', target: 'BOTH', sortOrder: 0 },
  { slug: 'date-night',   label: 'Date Night',    category: 'OCCASION', target: 'BOTH', sortOrder: 1 },
  { slug: 'office-lunch', label: 'Office Lunch',  category: 'OCCASION', target: 'BOTH', sortOrder: 2 },
  { slug: 'care-package', label: 'Care Package',  category: 'OCCASION', target: 'BOTH', sortOrder: 3 },
  { slug: 'game-day',     label: 'Game Day',      category: 'OCCASION', target: 'BOTH', sortOrder: 4 },
  { slug: 'dinner-party', label: 'Dinner Party',  category: 'OCCASION', target: 'BOTH', sortOrder: 5 },
  { slug: 'host-gift',    label: 'Host Gift',     category: 'OCCASION', target: 'BOTH', sortOrder: 6 },
  { slug: 'holiday',      label: 'Holiday',       category: 'OCCASION', target: 'BOTH', sortOrder: 7 },
  { slug: 'thank-you',    label: 'Thank You',     category: 'OCCASION', target: 'BOTH', sortOrder: 8 },
  { slug: 'weekly-meals', label: 'Weekly Meals',  category: 'OCCASION', target: 'BOTH', sortOrder: 9 },
]

export async function seedCanonicalTags(prisma: PrismaClient): Promise<void> {
  console.log(`  Upserting ${CANONICAL_TAGS.length} canonical tags...`)

  for (const tag of CANONICAL_TAGS) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      create: {
        slug: tag.slug,
        label: tag.label,
        category: tag.category,
        target: tag.target,
        sortOrder: tag.sortOrder ?? 0,
        description: tag.description,
        isPublic: true,
      },
      update: {
        label: tag.label,
        category: tag.category,
        target: tag.target,
        sortOrder: tag.sortOrder ?? 0,
      },
    })
  }

  console.log(`  ✅ ${CANONICAL_TAGS.length} tags seeded`)
}

// Run standalone: node --import tsx src/scripts/seed-tags.ts
if (process.argv[1]?.endsWith('seed-tags.ts') || process.argv[1]?.endsWith('seed-tags.js')) {
  const { PrismaClient: PC } = await import('../generated/client/index.js')
  const prisma = new PC()
  try {
    await seedCanonicalTags(prisma)
  } finally {
    await prisma.$disconnect()
  }
}
