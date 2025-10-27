/**
 * Slugify utilities for SEO-friendly URLs
 * Converts store names and item titles to URL-safe slugs
 */

/**
 * Convert a string to a URL-safe slug
 * Examples:
 *   "Joe's Pizza & Pasta" → "joes-pizza-pasta"
 *   "Taco Bell #123" → "taco-bell-123"
 *   "Café São Paulo" → "cafe-sao-paulo"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replaceAll(/\s+/g, '-')
    // Remove accents/diacritics
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    // Remove apostrophes
    .replaceAll('\'', '')
    // Remove special characters except hyphens
    .replaceAll(/[^\w-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replaceAll(/--+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

/**
 * Create a store slug from store name
 * Returns clean slug without ID
 * Format: store-name
 */
export function createStoreSlug(storeName: string, _storeId?: string): string {
  return slugify(storeName)
}

/**
 * Create an item slug from item title
 * Returns clean slug without ID
 * Format: item-name
 */
export function createItemSlug(itemTitle: string, _itemId?: string): string {
  return slugify(itemTitle)
}

/**
 * Extract ID from a slug
 * Example: "joes-pizza-abc123" → "abc123" (if it ends with 6 chars)
 */
export function extractIdFromSlug(slug: string): string | undefined {
  const parts = slug.split('-')
  const lastPart = parts[parts.length - 1]
  
  // Check if last part looks like an ID (6+ alphanumeric chars)
  if (lastPart && lastPart.length >= 6 && /^[\da-z]+$/i.test(lastPart)) {
    return lastPart
  }
  
  return undefined
}

/**
 * Parse store slug to get potential ID
 * Returns the slug as-is if no ID pattern found
 */
export function parseStoreSlug(slug: string): { slug: string; id: string | undefined } {
  const id = extractIdFromSlug(slug)
  return { slug, id }
}

/**
 * Parse item slug to get potential ID
 * Returns the slug as-is if no ID pattern found
 */
export function parseItemSlug(slug: string): { slug: string; id: string | undefined } {
  const id = extractIdFromSlug(slug)
  return { slug, id }
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  // Slug should be lowercase, alphanumeric with hyphens
  return /^[\da-z]+(-[\da-z]+)*$/.test(slug)
}

