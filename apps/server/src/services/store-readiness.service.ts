import { prisma } from '@packages/db'
import { checkStoreActivationRequirements } from '@packages/db/services'

type StoreReadinessCheck = {
  key: string
  label: string
  passed: boolean
  required: boolean
  message?: string
  details?: Record<string, unknown>
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function readMinimumOrder(feesJson: unknown): number | null {
  if (!feesJson || typeof feesJson !== 'object' || Array.isArray(feesJson)) return null
  const record = feesJson as Record<string, unknown>
  const minimumOrder = Number(record.minimumOrder ?? record.minimumOrderAmount ?? record.minOrder)
  return Number.isFinite(minimumOrder) && minimumOrder >= 0 ? minimumOrder : null
}

export async function getStoreReadiness(storeId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      name: true,
      description: true,
      phone: true,
      email: true,
      addressStreet: true,
      addressCity: true,
      addressState: true,
      addressZip: true,
      latitude: true,
      longitude: true,
      geocodedAt: true,
      geocodeSource: true,
      pickupEnabled: true,
      deliveryEnabled: true,
      deliveryDistance: true,
      deliveryCharge: true,
      feesJson: true,
    },
  })

  if (!store) return null

  const [activeProducts, activeDeliveryZones, mediaCount, activationRequirements] = await Promise.all([
    prisma.item.count({ where: { storeId, isActive: true, isSoldOut: false } }),
    prisma.deliveryZone.count({ where: { storeId, isActive: true } }),
    prisma.mediaAsset.count({ where: { storeId } }),
    checkStoreActivationRequirements(storeId),
  ])

  const minimumOrder = readMinimumOrder(store.feesJson)
  const hasIdentity = hasText(store.name) && hasText(store.description) && (hasText(store.phone) || hasText(store.email))
  const hasAddress = hasText(store.addressStreet) && hasText(store.addressCity) && hasText(store.addressState) && hasText(store.addressZip)
  const hasCoordinates = store.latitude !== null && store.longitude !== null && store.geocodedAt !== null
  const hasDeliveryCoverage = !store.deliveryEnabled || store.deliveryDistance !== null || activeDeliveryZones > 0
  const hasDeliveryDefaults = !store.deliveryEnabled || (store.deliveryCharge !== null && minimumOrder !== null)
  const hasFulfillment = (store.pickupEnabled || store.deliveryEnabled) && hasDeliveryCoverage && hasDeliveryDefaults
  const hasProducts = activeProducts > 0

  const checks: StoreReadinessCheck[] = [
    { key: 'identity', label: 'Store identity', passed: hasIdentity, required: true, message: hasIdentity ? undefined : 'Add a name, description, and phone or email.' },
    { key: 'address', label: 'Structured address', passed: hasAddress, required: true, message: hasAddress ? undefined : 'Add street, city, state, and ZIP.' },
    { key: 'geocoding', label: 'Geocoding', passed: hasCoordinates, required: true, message: hasCoordinates ? undefined : 'Run address geocoding before publishing.', details: { geocodeSource: store.geocodeSource } },
    { key: 'fulfillment', label: 'Fulfillment', passed: hasFulfillment, required: true, message: hasFulfillment ? undefined : 'Enable pickup or delivery. Delivery also needs a radius or active zone, delivery fee, and minimum order.', details: { pickupEnabled: store.pickupEnabled, deliveryEnabled: store.deliveryEnabled, deliveryDistance: store.deliveryDistance, deliveryCharge: store.deliveryCharge, minimumOrder, activeDeliveryZones } },
    { key: 'products', label: 'Products/menu', passed: hasProducts, required: true, message: hasProducts ? undefined : 'Add at least one active product.', details: { activeProducts } },
    { key: 'deliveryZones', label: 'Delivery zones', passed: !store.deliveryEnabled || store.deliveryDistance !== null || activeDeliveryZones > 0, required: Boolean(store.deliveryEnabled), message: !store.deliveryEnabled || store.deliveryDistance !== null || activeDeliveryZones > 0 ? undefined : 'Add a delivery radius or at least one active delivery zone.', details: { activeDeliveryZones } },
    { key: 'activationRequirements', label: 'Marketplace activation', passed: activationRequirements.canAppearInMarketplace, required: true, message: activationRequirements.canAppearInMarketplace ? undefined : 'Backend marketplace visibility requirements are not complete.', details: { ...activationRequirements, mediaCount } },
  ]

  return {
    canPublish: checks.every(check => !check.required || check.passed),
    checks,
    counts: { activeProducts, activeDeliveryZones, mediaCount },
    activationRequirements,
  }
}
