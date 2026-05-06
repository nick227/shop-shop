import type { DeliveryProviderAdapter, DeliveryQuoteInput, DeliveryQuoteResult, CreateDeliveryInput, CreateDeliveryResult, CancelDeliveryInput, CancelDeliveryResult, MapWebhookEventInput, MapWebhookEventResult } from '../delivery-provider-adapter.js'

export const inHouseDeliveryAdapter: DeliveryProviderAdapter = {
  provider: 'IN_HOUSE',

  async quoteDelivery(_input: DeliveryQuoteInput): Promise<DeliveryQuoteResult> {
    return {
      feeCents: 0,
      currency: 'USD',
      providerPayload: { mode: 'in_house' },
    }
  },

  async createDelivery(_input: CreateDeliveryInput): Promise<CreateDeliveryResult> {
    return {
      providerStatus: 'created',
      providerPayload: { mode: 'in_house' },
    }
  },

  async cancelDelivery(_input: CancelDeliveryInput): Promise<CancelDeliveryResult> {
    return {
      providerStatus: 'canceled',
      providerPayload: { mode: 'in_house' },
    }
  },

  async mapWebhookEvent(input: MapWebhookEventInput): Promise<MapWebhookEventResult> {
    return {
      providerStatus: `unhandled:${input.eventType}`,
      providerPayload: input.payload,
    }
  },
}

