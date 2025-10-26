// ========================================
// Store Domain Service
// Business operations for stores
// ========================================

export class StoreDomain {
  /**
   * Generate URL-safe slug from store name
   */
  generateSlug(name: string, suffix?: string): string {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50)
    
    return suffix ? `${baseSlug}-${suffix}` : baseSlug
  }
  
  /**
   * Prepare store data for creation
   */
  prepareForCreation(input: unknown, userId: string): Record<string, unknown> {
    const data = input as {
      name: string
      slug?: string
      [key: string]: unknown
    }
    
    return {
      ...data,
      slug: data.slug || this.generateSlug(data.name),
      ownerUserId: userId,
    }
  }
  
  /**
   * Validate store is accepting orders
   */
  canAcceptOrders(store: { isPublished: boolean; deliveryEnabled: boolean; pickupEnabled: boolean }): {
    valid: boolean
    reason?: string
  } {
    if (!store.isPublished) {
      return { valid: false, reason: 'Store is not published' }
    }
    
    if (!store.deliveryEnabled && !store.pickupEnabled) {
      return { valid: false, reason: 'Store is not accepting orders' }
    }
    
    return { valid: true }
  }
}

