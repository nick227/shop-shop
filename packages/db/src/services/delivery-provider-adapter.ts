import type { DeliveryProvider, OrderStatus } from '../generated/client/index.js'

export type DeliveryQuoteInput = Readonly<{
  orderId: string
  storeId: string
  dropoffLatitude: number
  dropoffLongitude: number
}>

export type DeliveryQuoteResult = Readonly<{
  feeCents: number
  currency: 'USD'
  etaMinutes?: number
  providerPayload?: unknown
}>

export type CreateDeliveryInput = Readonly<{
  deliveryJobId: string
  orderId: string
  storeId: string
  dropoffLatitude: number
  dropoffLongitude: number
  dropoffAddressSnapshot?: unknown
}>

export type CreateDeliveryResult = Readonly<{
  providerExternalId?: string
  trackingUrl?: string
  providerStatus: string
  providerPayload?: unknown
}>

export type CancelDeliveryInput = Readonly<{
  deliveryJobId: string
  providerExternalId?: string | null
}>

export type CancelDeliveryResult = Readonly<{
  providerStatus: string
  providerPayload?: unknown
}>

export type MapWebhookEventInput = Readonly<{
  provider: DeliveryProvider
  eventType: string
  payload: unknown
}>

export type MapWebhookEventResult = Readonly<{
  providerStatus: string
  mappedOrderStatus?: OrderStatus
  providerPayload?: unknown
  note?: string
}>

export interface DeliveryProviderAdapter {
  readonly provider: DeliveryProvider
  quoteDelivery(input: DeliveryQuoteInput): Promise<DeliveryQuoteResult>
  createDelivery(input: CreateDeliveryInput): Promise<CreateDeliveryResult>
  cancelDelivery(input: CancelDeliveryInput): Promise<CancelDeliveryResult>
  mapWebhookEvent(input: MapWebhookEventInput): Promise<MapWebhookEventResult>
}

