import { prisma } from '../client.js'

// ========================================
// Store Activation Service
// Business logic for store visibility requirements
// ========================================

export interface StoreActivationRequirements {
  hasRequiredFields: boolean
  hasMedia: boolean
  hasActiveProducts: boolean
  isNotDisabled: boolean
  canAppearInMarketplace: boolean
}

export const checkStoreActivationRequirements = async (storeId: string): Promise<StoreActivationRequirements> => {
  // Get store with basic info
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      name: true,
      description: true,
      addressStreet: true,
      addressCity: true,
      addressState: true,
      addressZip: true,
      deliveryEnabled: true,
      pickupEnabled: true,
      phone: true,
      status: true,
      disabledAt: true,
    },
  })

  if (!store) {
    throw new Error('Store not found')
  }

  // Check required fields
  const hasRequiredFields = !!(
    store.name &&
    store.description &&
    (store.addressStreet || (store.addressCity && store.addressState && store.addressZip)) &&
    (store.deliveryEnabled || store.pickupEnabled) &&
    store.phone
  )

  // Check media requirements
  const mediaCount = await prisma.mediaAsset.count({
    where: { storeId }
  })
  const hasMedia = mediaCount >= 1

  const activeItemsCount = await prisma.item.count({
    where: { storeId, isActive: true, isSoldOut: false },
  })

  // A store with no active items can still qualify via active bundles
  let hasActiveBundles = false
  if (activeItemsCount === 0) {
    const activeBundles = await prisma.bundle.findMany({
      where: { storeId, isActive: true },
      include: {
        items: { include: { item: { select: { isActive: true, isSoldOut: true } } } },
      },
    })
    hasActiveBundles = activeBundles.some(
      (b) =>
        b.items.length > 0 &&
        b.items.every((bi) => bi.item.isActive && !bi.item.isSoldOut),
    )
  }

  const hasActiveProducts = activeItemsCount >= 1 || hasActiveBundles

  // Check if not disabled
  const isNotDisabled = !store.disabledAt && store.status === 'ACTIVE'

  // Overall marketplace visibility
  const canAppearInMarketplace = hasRequiredFields && hasMedia && hasActiveProducts && isNotDisabled

  return {
    hasRequiredFields,
    hasMedia,
    hasActiveProducts,
    isNotDisabled,
    canAppearInMarketplace,
  }
}

export interface ProductActivationRequirements {
  hasRequiredFields: boolean
  hasMedia: boolean
  isActive: boolean
  parentStorePublic: boolean
  canAppearPublicly: boolean
}

export const checkProductActivationRequirements = async (productId: string): Promise<ProductActivationRequirements> => {
  // Get product with store info
  const product = await prisma.item.findUnique({
    where: { id: productId },
    include: {
      store: {
        select: {
          id: true,
        }
      }
    }
  })

  if (!product) {
    throw new Error('Product not found')
  }

  // Check required fields
  const hasRequiredFields = !!(
    product.title &&
    product.description &&
    product.price &&
    product.price.gt(0)
  )

  // Check media requirements
  const mediaCount = await prisma.mediaAsset.count({
    where: { itemId: productId, kind: 'IMAGE' }
  })
  const hasMedia = mediaCount >= 1

  // Check if product is active
  const isActive = product.isActive

  // Check if parent store is public
  const storeActivation = await checkStoreActivationRequirements(product.storeId)
  const parentStorePublic = storeActivation.canAppearInMarketplace

  // Overall public visibility
  const canAppearPublicly = hasRequiredFields && hasMedia && isActive && parentStorePublic

  return {
    hasRequiredFields,
    hasMedia,
    isActive,
    parentStorePublic,
    canAppearPublicly,
  }
}

// ============================================================================
// Bundle Activation
// ============================================================================

export interface BundleActivationRequirements {
  hasRequiredFields: boolean
  hasMedia: boolean
  hasActiveItems: boolean
  isActive: boolean
  parentStorePublic: boolean
  canAppearPublicly: boolean
}

export const checkBundleActivationRequirements = async (
  bundleId: string,
): Promise<BundleActivationRequirements> => {
  const bundle = await prisma.bundle.findUnique({
    where: { id: bundleId },
    include: {
      items: {
        include: { item: { select: { isActive: true, isSoldOut: true, storeId: true } } },
      },
    },
  })

  if (!bundle) throw new Error('Bundle not found')

  const hasRequiredFields = !!(bundle.name)
  const mediaCount = await prisma.mediaAsset.count({ where: { bundleId, kind: 'IMAGE' } })
  const hasMedia = mediaCount >= 1
  
  // Production safety rules: bundle must have at least 2 items, all from same store, all active
  const hasMinimumItems = bundle.items.length >= 2
  const allItemsFromSameStore = bundle.items.every((bi) => bi.item.storeId === bundle.storeId)
  const hasActiveItems =
    hasMinimumItems &&
    allItemsFromSameStore &&
    bundle.items.every((bi) => bi.item.isActive && !bi.item.isSoldOut)
    
  const { isActive } = bundle
  const { canAppearInMarketplace: parentStorePublic } = await checkStoreActivationRequirements(
    bundle.storeId,
  )
  const canAppearPublicly = hasRequiredFields && hasMedia && hasActiveItems && isActive && parentStorePublic

  return { hasRequiredFields, hasMedia, hasActiveItems, isActive, parentStorePublic, canAppearPublicly }
}
