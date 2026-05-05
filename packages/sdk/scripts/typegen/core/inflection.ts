/**
 * Centralized inflection utilities
 * 
 * Handles singularization, pluralization, and naming conventions
 * for resource types and API methods.
 */

// Override map for irregular plurals/singulars
// Can be extended per-resource in config if needed
const IRREGULAR_OVERRIDES = new Map([
  // Singular -> Plural
  ['Address', 'Addresses'],
  ['Bundle', 'Bundles'],
  ['Cart', 'Carts'],
  ['Item', 'Items'],
  ['Order', 'Orders'],
  ['Promotion', 'Promotions'],
  ['Store', 'Stores'],
  ['User', 'Users'],
  ['Media', 'Media'],
  ['Comment', 'Comments'],
  ['Post', 'Posts'],
  ['Tip', 'Tips'],
  ['Affiliate', 'Affiliates'],
  ['Commission', 'Commissions'],
  ['Payout', 'Payouts'],
  ['DeliveryZone', 'DeliveryZones'],
  ['VendorVerification', 'VendorVerifications'],
  ['TeamMember', 'TeamMembers'],
  ['Invitation', 'Invitations'],
  ['FavoriteStore', 'FavoriteStores'],
  ['FavoriteItem', 'FavoriteItems'],
  ['BundleItem', 'BundleItems'],
  ['BundlePricing', 'BundlePricings'],
])

// Reverse map for plural -> singular
const PLURAL_TO_SINGULAR = new Map(
  Array.from(IRREGULAR_OVERRIDES.entries()).map(([singular, plural]) => [plural, singular])
)

/**
 * Generic singularization helper with override support
 */
export function singularize(plural: string, override?: string): string {
  // Use override if provided
  if (override) {
    return override
  }
  
  // Check override map first
  if (PLURAL_TO_SINGULAR.has(plural)) {
    return PLURAL_TO_SINGULAR.get(plural)!
  }
  
  // Handle common patterns
  if (plural.endsWith('ies')) {
    return plural.slice(0, -3) + 'y'
  }
  
  if (plural.endsWith('es') && plural.length > 3) {
    // Check if it's a valid plural (ends with -es)
    const withoutEs = plural.slice(0, -2)
    if (withoutEs.endsWith('s') || withoutEs.endsWith('sh') || withoutEs.endsWith('ch') || withoutEs.endsWith('x') || withoutEs.endsWith('z')) {
      return withoutEs
    }
  }
  
  // Simple case: remove trailing 's'
  if (plural.endsWith('s') && plural.length > 1) {
    return plural.slice(0, -1)
  }
  
  return plural
}

/**
 * Convert plural resource name to singular
 */
export function toSingular(plural: string): string {
  return singularize(plural)
}

/**
 * Convert singular resource name to plural
 */
export function toPlural(singular: string): string {
  // Check override map first
  if (IRREGULAR_OVERRIDES.has(singular)) {
    return IRREGULAR_OVERRIDES.get(singular)!
  }
  
  // Handle common patterns
  if (singular.endsWith('y') && !singular.endsWith('ay') && !singular.endsWith('ey') && !singular.endsWith('oy') && !singular.endsWith('uy')) {
    return singular.slice(0, -1) + 'ies'
  }
  
  if (singular.endsWith('s') || singular.endsWith('sh') || singular.endsWith('ch') || singular.endsWith('x') || singular.endsWith('z')) {
    return singular + 'es'
  }
  
  // Simple case: add 's'
  return singular + 's'
}

/**
 * Convert resource name to response type name
 */
export function toResponseTypeName(resourceName: string): string {
  const singular = toSingular(resourceName)
  return `${singular}Response`
}

/**
 * Convert resource name to mapper function name
 */
export function toMapperFunctionName(resourceName: string): string {
  return `map${resourceName}`
}

/**
 * Convert resource name to API class name
 */
export function toApiClassName(resourceName: string): string {
  const singular = toSingular(resourceName)
  return `${singular}Api`
}

/**
 * Convert resource name to SDK type name
 */
export function toSdkTypeName(resourceName: string): string {
  const plural = toPlural(resourceName)
  return `List${plural}200ResponseDataInner`
}

/**
 * Convert resource name to SDK list method name
 */
export function toSdkListMethodName(resourceName: string): string {
  const plural = toPlural(resourceName)
  return `list${plural}`
}

/**
 * Convert resource name to SDK get method name
 */
export function toSdkGetMethodName(resourceName: string): string {
  const singular = toSingular(resourceName)
  return `get${singular}`
}

/**
 * Convert resource name to SDK create method name
 */
export function toSdkCreateMethodName(resourceName: string): string {
  const singular = toSingular(resourceName)
  return `create${singular}`
}

/**
 * Convert resource name to SDK update method name
 */
export function toSdkUpdateMethodName(resourceName: string): string {
  const singular = toSingular(resourceName)
  return `update${singular}`
}

/**
 * Convert resource name to SDK delete method name
 */
export function toSdkDeleteMethodName(resourceName: string): string {
  const singular = toSingular(resourceName)
  return `delete${singular}`
}
