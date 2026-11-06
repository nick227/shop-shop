import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ store: vi.fn(), items: vi.fn(), zones: vi.fn(), media: vi.fn(), activation: vi.fn() }))
vi.mock('@packages/db', () => ({ prisma: {
  store: { findUnique: mocks.store }, item: { count: mocks.items },
  deliveryZone: { count: mocks.zones }, mediaAsset: { count: mocks.media },
} }))
vi.mock('@packages/db/services', () => ({ checkStoreActivationRequirements: mocks.activation }))
import { getStoreReadiness } from './store-readiness.service'

beforeEach(() => {
  mocks.store.mockResolvedValue({ name: 'Bakery', description: 'Bread', phone: '555', email: '', addressStreet: '1 Main', addressCity: 'Austin', addressState: 'TX', addressZip: '78701', latitude: 30, longitude: -97, geocodedAt: new Date(), pickupEnabled: true, deliveryEnabled: false, deliveryDistance: null, deliveryCharge: null })
  mocks.items.mockResolvedValue(1)
  mocks.zones.mockResolvedValue(0)
  mocks.media.mockResolvedValue(1)
  mocks.activation.mockResolvedValue({ hasRequiredFields: true, hasMedia: true, hasActiveProducts: true, isNotDisabled: true, canAppearInMarketplace: true })
})
describe('store readiness checklist', () => {
  it('allows delivery with no minimum order', async () => {
    const store = await mocks.store()
    mocks.store.mockResolvedValue({ ...store, deliveryEnabled: true, deliveryDistance: 5, deliveryCharge: 0 })
    expect(await getStoreReadiness('s')).toMatchObject({ canPublish: true, missingRequirements: [] })
  })
  it('has no missing requirements for a publishable store', async () => {
    expect(await getStoreReadiness('s')).toMatchObject({ canPublish: true, missingRequirements: [] })
  })
  it('explains empty menus and missing media', async () => {
    mocks.items.mockResolvedValue(0)
    mocks.activation.mockResolvedValue({ hasRequiredFields: true, hasMedia: false, hasActiveProducts: false, isNotDisabled: true, canAppearInMarketplace: false })
    expect(await getStoreReadiness('s')).toMatchObject({ canPublish: false, missingRequirements: ['at least one active menu item that is not sold out', 'store photo or media'] })
  })
  it('identifies phone and delivery defaults even with an email and pickup', async () => {
    const store = await mocks.store()
    mocks.store.mockResolvedValue({ ...store, phone: '', email: 'shop@example.com', deliveryEnabled: true })
    mocks.activation.mockResolvedValue({ hasRequiredFields: false, hasMedia: true, hasActiveProducts: true, isNotDisabled: true, canAppearInMarketplace: false })
    expect(await getStoreReadiness('s')).toMatchObject({ canPublish: false, missingRequirements: ['phone number', 'delivery radius or active delivery zone', 'delivery fee'] })
  })
})
