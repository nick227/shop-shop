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
      description?: string
      phone?: string
      email?: string
      addressStreet?: string
      addressCity?: string
      addressState?: string
      addressZip?: string
      deliveryEnabled?: boolean
      pickupEnabled?: boolean
      [key: string]: unknown
    }

    const hasAddress =
      Boolean(data.addressStreet?.trim()) ||
      Boolean(data.addressCity?.trim()) ||
      Boolean(data.addressState?.trim()) ||
      Boolean(data.addressZip?.trim())
    const hasFulfillment = data.deliveryEnabled === true || data.pickupEnabled === true
    const hasContact = Boolean(data.phone?.trim()) || Boolean(data.email?.trim())
    const canActivateStore =
      Boolean(data.name?.trim()) &&
      Boolean(data.description?.trim()) &&
      hasAddress &&
      hasFulfillment &&
      hasContact
    
    return {
      ...data,
      slug: data.slug || this.generateSlug(data.name),
      ownerUserId: userId,
      status: canActivateStore ? 'ACTIVE' : 'PAUSED',
      isPublished: canActivateStore,
    }
  }
  
  /**
   * Validate store is accepting orders
   */
  canAcceptOrders(store: {
    isPublished: boolean
    deliveryEnabled: boolean
    pickupEnabled: boolean
    status?: 'ACTIVE' | 'PAUSED' | 'DISABLED'
  }): {
    valid: boolean
    reason?: string
  } {
    if (store.status === 'DISABLED') {
      return { valid: false, reason: 'Store has been disabled' }
    }

    if (store.status === 'PAUSED') {
      return { valid: false, reason: 'Store is paused' }
    }

    if (!store.isPublished) {
      return { valid: false, reason: 'Store is not published' }
    }
    
    if (!store.deliveryEnabled && !store.pickupEnabled) {
      return { valid: false, reason: 'Store is not accepting orders' }
    }
    
    return { valid: true }
  }
}
