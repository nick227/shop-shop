import type {
  CancelDeliveryInput,
  CancelDeliveryResult,
  CreateDeliveryInput,
  CreateDeliveryResult,
  DeliveryProviderAdapter,
  DeliveryQuoteInput,
  DeliveryQuoteResult,
  MapWebhookEventInput,
  MapWebhookEventResult,
} from '../delivery-provider-adapter.js'

/**
 * Mock/sandbox-shaped adapter for Uber Direct-like dispatch.
 * Does not call external APIs; returns stable fake IDs/URLs for dev/testing.
 */
export const uberDirectMockAdapter: DeliveryProviderAdapter = {
  provider: 'UBER_DIRECT',

  async quoteDelivery(_input: DeliveryQuoteInput): Promise<DeliveryQuoteResult> {
    return {
      feeCents: 699,
      currency: 'USD',
      etaMinutes: 30,
      providerPayload: {
        sandbox: true,
        quote: { fee_cents: 699, eta_minutes: 30 },
      },
    }
  },

  async createDelivery(input: CreateDeliveryInput): Promise<CreateDeliveryResult> {
    const externalId = `uber_direct_sandbox_${input.deliveryJobId.slice(0, 8)}`
    return {
      providerExternalId: externalId,
      trackingUrl: `https://sandbox.uber.example/direct/track/${externalId}`,
      providerStatus: 'created',
      providerPayload: {
        sandbox: true,
        delivery_id: externalId,
        tracking_url: `https://sandbox.uber.example/direct/track/${externalId}`,
      },
    }
  },

  async cancelDelivery(input: CancelDeliveryInput): Promise<CancelDeliveryResult> {
    return {
      providerStatus: 'canceled',
      providerPayload: {
        sandbox: true,
        delivery_id: input.providerExternalId ?? null,
        canceled: true,
      },
    }
  },

  async mapWebhookEvent(input: MapWebhookEventInput): Promise<MapWebhookEventResult> {
    const type = input.eventType.toLowerCase()
    if (type === 'picked_up') {
      return { providerStatus: 'picked_up', mappedOrderStatus: 'OUT_FOR_DELIVERY', providerPayload: input.payload }
    }
    if (type === 'delivered') {
      return { providerStatus: 'delivered', mappedOrderStatus: 'DELIVERED', providerPayload: input.payload }
    }
    if (type === 'canceled' || type === 'failed') {
      return { providerStatus: type, providerPayload: input.payload }
    }
    return { providerStatus: `unhandled:${input.eventType}`, providerPayload: input.payload }
  },
}

