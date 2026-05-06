import type { DeliveryProvider } from '../generated/client/index.js'
import type { DeliveryProviderAdapter } from './delivery-provider-adapter.js'
import { doordashDriveMockAdapter, inHouseDeliveryAdapter, uberDirectMockAdapter } from './delivery-providers/index.js'

const ADAPTERS: Record<DeliveryProvider, DeliveryProviderAdapter> = {
  IN_HOUSE: inHouseDeliveryAdapter,
  DOORDASH_DRIVE: doordashDriveMockAdapter,
  UBER_DIRECT: uberDirectMockAdapter,
}

export function getDeliveryProviderAdapter(provider: DeliveryProvider): DeliveryProviderAdapter {
  return ADAPTERS[provider]
}

