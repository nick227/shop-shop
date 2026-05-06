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
 * Mock/sandbox-shaped adapter for DoorDash Drive-like dispatch.
 * Does not call external APIs; returns stable fake IDs/URLs for dev/testing.
 */
export const doordashDriveMockAdapter: DeliveryProviderAdapter = {
  provider: 'DOORDASH_DRIVE',

  async quoteDelivery(_input: DeliveryQuoteInput): Promise<DeliveryQuoteResult> {
    return {
      feeCents: 599,
      currency: 'USD',
      etaMinutes: 35,
      providerPayload: {
        sandbox: true,
        quote: { fee_cents: 599, eta_minutes: 35 },
      },
    }
  },

  async createDelivery(input: CreateDeliveryInput): Promise<CreateDeliveryResult> {
    const externalId = `dd_drive_sandbox_${input.deliveryJobId.slice(0, 8)}`
    return {
      providerExternalId: externalId,
      trackingUrl: `https://sandbox.doordash.example/drive/track/${externalId}`,
      providerStatus: 'created',
      providerPayload: {
        sandbox: true,
        delivery_id: externalId,
        tracking_url: `https://sandbox.doordash.example/drive/track/${externalId}`,
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

