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
    },
  })

  if (!store) return null

  const [activeProducts, activeDeliveryZones, mediaCount, activationRequirements] = await Promise.all([
    prisma.item.count({ where: { storeId, isActive: true, isSoldOut: false } }),
    prisma.deliveryZone.count({ where: { storeId, isActive: true } }),
    prisma.mediaAsset.count({ where: { storeId } }),
    checkStoreActivationRequirements(storeId),
  ])

  const hasIdentity = hasText(store.name) && hasText(store.description) && (hasText(store.phone) || hasText(store.email))
  const hasAddress = hasText(store.addressStreet) && hasText(store.addressCity) && hasText(store.addressState) && hasText(store.addressZip)
  const hasCoordinates = store.latitude !== null && store.longitude !== null && store.geocodedAt !== null
  const hasDeliveryCoverage = !store.deliveryEnabled || store.deliveryDistance !== null || activeDeliveryZones > 0
  const hasDeliveryDefaults = !store.deliveryEnabled || store.deliveryCharge !== null
  const hasFulfillment = (store.pickupEnabled || store.deliveryEnabled) && hasDeliveryCoverage && hasDeliveryDefaults
  const hasProducts = activeProducts > 0

  const checks: StoreReadinessCheck[] = [
    { key: 'identity', label: 'Store identity', passed: hasIdentity, required: true, message: hasIdentity ? undefined : 'Add a name, description, and phone or email.' },
    { key: 'address', label: 'Structured address', passed: hasAddress, required: true, message: hasAddress ? undefined : 'Add street, city, state, and ZIP.' },
    { key: 'geocoding', label: 'Geocoding', passed: hasCoordinates, required: true, message: hasCoordinates ? undefined : 'Save coordinates in Location.', details: { geocodeSource: store.geocodeSource } },
    { key: 'fulfillment', label: 'Fulfillment', passed: hasFulfillment, required: true, message: hasFulfillment ? undefined : 'Enable pickup or delivery. Delivery also needs a radius or active zone and a delivery fee.', details: { pickupEnabled: store.pickupEnabled, deliveryEnabled: store.deliveryEnabled, deliveryDistance: store.deliveryDistance, deliveryCharge: store.deliveryCharge, activeDeliveryZones } },
    { key: 'products', label: 'Products/menu', passed: hasProducts, required: true, message: hasProducts ? undefined : 'Add at least one active product.', details: { activeProducts } },
    { key: 'deliveryZones', label: 'Delivery zones', passed: !store.deliveryEnabled || store.deliveryDistance !== null || activeDeliveryZones > 0, required: Boolean(store.deliveryEnabled), message: !store.deliveryEnabled || store.deliveryDistance !== null || activeDeliveryZones > 0 ? undefined : 'Add a delivery radius or at least one active delivery zone.', details: { activeDeliveryZones } },
    { key: 'activationRequirements', label: 'Marketplace activation', passed: activationRequirements.canAppearInMarketplace, required: true, message: activationRequirements.canAppearInMarketplace ? undefined : 'Backend marketplace visibility requirements are not complete.', details: { ...activationRequirements, mediaCount } },
  ]

  // Keep the vendor checklist aligned with the checks used to reject publishing.
  const missingRequirements: string[] = []
  for (const [value, label] of [
    [store.name, 'store name'], [store.description, 'description'], [store.phone, 'phone number'],
    [store.addressStreet, 'street address'], [store.addressCity, 'city'],
    [store.addressState, 'state'], [store.addressZip, 'ZIP code'],
  ]) {
    if (!hasText(value)) missingRequirements.push(label as string)
  }
  if (!hasCoordinates) missingRequirements.push('coordinates (Location)')
  if (!store.pickupEnabled && !store.deliveryEnabled) missingRequirements.push('pickup or delivery')
  if (!hasDeliveryCoverage) missingRequirements.push('delivery radius or active delivery zone')
  if (store.deliveryEnabled && store.deliveryCharge === null) missingRequirements.push('delivery fee')
  if (!hasProducts) missingRequirements.push('at least one active menu item that is not sold out')
  if (!activationRequirements.hasMedia) missingRequirements.push('store photo or media')
  if (!activationRequirements.isNotDisabled) missingRequirements.push('active store status (contact support)')

  return {
    missingRequirements,
    canPublish: checks.every(check => !check.required || check.passed),
    checks,
    counts: { activeProducts, activeDeliveryZones, mediaCount },
    activationRequirements,
  }
}
