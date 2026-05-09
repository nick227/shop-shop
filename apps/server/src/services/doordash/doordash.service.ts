import type {
  DeliveryQuoteInput,
  DeliveryQuoteResult,
  CreateDeliveryInput,
  CreateDeliveryResult,
  CancelDeliveryInput,
  CancelDeliveryResult,
} from '@packages/db'
import { prisma } from '@packages/db'

export interface DoorDashQuoteInput {
  external_delivery_id: string
  pickup_address: {
    street_address: string
    subpremise?: string
    city: string
    state: string
    zip_code: string
    country: string
    lat: number
    lng: number
  }
  dropoff_address: {
    street_address: string
    subpremise?: string
    city: string
    state: string
    zip_code: string
    country: string
    lat: number
    lng: number
  }
  order_value: number
  contact_info: {
    pickup_phone: string
    dropoff_phone?: string
  }
  tip_cents?: number
}

export interface DoorDashDelivery {
  external_delivery_id: string
  tracking_url: string
  status: string
  fee_cents: number
  currency: string
  estimated_time_minutes?: number
  pickup_time?: string
  dropoff_time?: string
  dasher?: {
    name: string
    phone?: string
    vehicle?: string
    location?: {
      lat: number
      lng: number
      updated_at?: string
    }
  }
}

export interface DoorDashError {
  error: string
  details?: unknown
}

function readAddressSnapshot(raw: unknown): {
  line1: string
  city: string
  state: string
  postalCode: string
} {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { line1: '', city: '', state: '', postalCode: '' }
  }
  const o = raw as Record<string, unknown>
  const str = (key: string): string => (typeof o[key] === 'string' ? o[key] : '')
  return {
    line1: str('line1'),
    city: str('city'),
    state: str('state'),
    postalCode: str('postalCode'),
  }
}

export class DoorDashService {
  private baseUrl: string
  private keyId: string

  constructor() {
    this.baseUrl =
      process.env.DOORDASH_ENV === 'production'
        ? 'https://api.doordash.com/drive/v2'
        : 'https://openapi.doordash.com/drive/v2'

    this.keyId = process.env.DOORDASH_KEY_ID!
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.keyId}`,
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
        ...options,
      })

      if (!response.ok) {
        const errorBody: unknown = await response.json().catch(() => ({}))
        throw new Error(`DoorDash API error: ${response.status} - ${JSON.stringify(errorBody)}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`DoorDash service error: ${error}`)
    }
  }

  async createQuote(input: DeliveryQuoteInput): Promise<DeliveryQuoteResult> {
    const doorDashInput: DoorDashQuoteInput = {
      external_delivery_id: input.orderId,
      pickup_address: await this.getPickupAddress(input.storeId),
      dropoff_address: {
        street_address: await this.getDropoffStreet(input.orderId),
        city: await this.getDropoffCity(input.orderId),
        state: await this.getDropoffState(input.orderId),
        zip_code: await this.getDropoffZip(input.orderId),
        country: 'US',
        lat: input.dropoffLatitude,
        lng: input.dropoffLongitude,
      },
      order_value: await this.getOrderValue(input.orderId),
      contact_info: {
        pickup_phone: await this.getStorePhone(input.storeId),
        dropoff_phone: await this.getCustomerPhone(input.orderId),
      },
      tip_cents: 0,
    }

    const quoteRaw = await this.makeRequest<unknown>('/quotes', {
      method: 'POST',
      body: JSON.stringify(doorDashInput),
    })
    const quoteObj =
      quoteRaw !== null && typeof quoteRaw === 'object' && !Array.isArray(quoteRaw)
        ? (quoteRaw as Record<string, unknown>)
        : {}
    const feeRaw = quoteObj.fee_cents
    const feeCents = typeof feeRaw === 'number' ? feeRaw : 0
    const etaRaw = quoteObj.estimated_time_minutes
    const etaMinutes = typeof etaRaw === 'number' ? etaRaw : undefined

    return {
      feeCents,
      currency: 'USD',
      etaMinutes,
      providerPayload: {
        provider: 'DOORDASH_DRIVE',
        quote: quoteRaw,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    }
  }

  async createDelivery(input: CreateDeliveryInput): Promise<CreateDeliveryResult> {
    const doorDashInput: DoorDashQuoteInput = {
      external_delivery_id: input.deliveryJobId,
      pickup_address: await this.getPickupAddress(input.storeId),
      dropoff_address: {
        street_address: await this.getDropoffStreet(input.orderId),
        city: await this.getDropoffCity(input.orderId),
        state: await this.getDropoffState(input.orderId),
        zip_code: await this.getDropoffZip(input.orderId),
        country: 'US',
        lat: input.dropoffLatitude,
        lng: input.dropoffLongitude,
      },
      order_value: await this.getOrderValue(input.orderId),
      contact_info: {
        pickup_phone: await this.getStorePhone(input.storeId),
        dropoff_phone: await this.getCustomerPhone(input.orderId),
      },
      tip_cents: 0,
    }

    const delivery = await this.makeRequest<DoorDashDelivery>('/deliveries', {
      method: 'POST',
      body: JSON.stringify(doorDashInput),
    })

    return {
      providerExternalId: delivery.external_delivery_id,
      trackingUrl: delivery.tracking_url,
      providerStatus: delivery.status,
      providerPayload: {
        provider: 'DOORDASH_DRIVE',
        delivery,
        createdAt: new Date().toISOString(),
      },
    }
  }

  async cancelDelivery(input: CancelDeliveryInput): Promise<CancelDeliveryResult> {
    const ext = input.providerExternalId
    if (!ext) {
      throw new Error('providerExternalId required to cancel DoorDash delivery')
    }
    await this.makeRequest<unknown>(`/deliveries/${ext}/cancel`, {
      method: 'POST',
    })

    return {
      providerStatus: 'canceled',
      providerPayload: {
        provider: 'DOORDASH_DRIVE',
        canceled: true,
        canceledAt: new Date().toISOString(),
      },
    }
  }

  async getDeliveryStatus(externalId: string): Promise<unknown> {
    return await this.makeRequest<unknown>(`/deliveries/${externalId}`)
  }

  private async getPickupAddress(storeId: string): Promise<DoorDashQuoteInput['pickup_address']> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        addressStreet: true,
        addressCity: true,
        addressState: true,
        addressZip: true,
        addressCountry: true,
        latitude: true,
        longitude: true,
      },
    })

    if (!store) {
      throw new Error(`Store not found: ${storeId}`)
    }

    return {
      street_address: store.addressStreet ?? '',
      city: store.addressCity ?? '',
      state: store.addressState ?? '',
      zip_code: store.addressZip ?? '',
      country: store.addressCountry ?? 'US',
      lat: store.latitude != null ? Number(store.latitude) : 0,
      lng: store.longitude != null ? Number(store.longitude) : 0,
    }
  }

  private async readOrderAddressSnapshot(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { addressSnapshot: true },
    })
    if (!order?.addressSnapshot) {
      throw new Error(`Order address not found: ${orderId}`)
    }
    return readAddressSnapshot(order.addressSnapshot)
  }

  private async getDropoffStreet(orderId: string): Promise<string> {
    const s = await this.readOrderAddressSnapshot(orderId)
    return s.line1
  }

  private async getDropoffCity(orderId: string): Promise<string> {
    const s = await this.readOrderAddressSnapshot(orderId)
    return s.city
  }

  private async getDropoffState(orderId: string): Promise<string> {
    const s = await this.readOrderAddressSnapshot(orderId)
    return s.state
  }

  private async getDropoffZip(orderId: string): Promise<string> {
    const s = await this.readOrderAddressSnapshot(orderId)
    return s.postalCode
  }

  private async getOrderValue(orderId: string): Promise<number> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { total: true },
    })

    if (!order) {
      throw new Error(`Order not found: ${orderId}`)
    }

    return Math.round(Number(order.total) * 100)
  }

  private async getStorePhone(storeId: string): Promise<string> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { phone: true },
    })

    if (!store?.phone) {
      throw new Error(`Store phone not found: ${storeId}`)
    }

    return store.phone
  }

  private async getCustomerPhone(orderId: string): Promise<string> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        user: {
          select: { phone: true },
        },
      },
    })

    if (!order?.user?.phone) {
      throw new Error(`Customer phone not found for order: ${orderId}`)
    }

    return order.user.phone
  }
}
