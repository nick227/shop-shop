import type {
  DeliveryQuoteInput,
  DeliveryQuoteResult,
  CreateDeliveryInput,
  CreateDeliveryResult,
  CancelDeliveryInput,
  CancelDeliveryResult,
} from '@packages/db'

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
  details?: any
}

export class DoorDashService {
  private baseUrl: string
  private developerId: string
  private keyId: string
  private signingSecret: string
  private environment: 'sandbox' | 'production'

  constructor() {
    this.baseUrl = process.env.DOORDASH_ENV === 'production' 
      ? 'https://api.doordash.com/drive/v2'
      : 'https://openapi.doordash.com/drive/v2'
    
    this.developerId = process.env.DOORDASH_DEVELOPER_ID!
    this.keyId = process.env.DOORDASH_KEY_ID!
    this.signingSecret = process.env.DOORDASH_SIGNING_SECRET!
    this.environment = (process.env.DOORDASH_ENV as 'sandbox' | 'production') || 'sandbox'
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.keyId}`
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
        ...options
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
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
        lng: input.dropoffLongitude
      },
      order_value: await this.getOrderValue(input.orderId),
      contact_info: {
        pickup_phone: await this.getStorePhone(input.storeId),
        dropoff_phone: await this.getCustomerPhone(input.orderId)
      },
      tip_cents: 0
    }

    const quote = await this.makeRequest<any>('/quotes', {
      method: 'POST',
      body: JSON.stringify(doorDashInput)
    })

    return {
      feeCents: quote.fee_cents || 0,
      currency: quote.currency || 'USD',
      etaMinutes: quote.estimated_time_minutes,
      providerPayload: {
        provider: 'DOORDASH_DRIVE',
        quote,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      }
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
        lng: input.dropoffLongitude
      },
      order_value: await this.getOrderValue(input.orderId),
      contact_info: {
        pickup_phone: await this.getStorePhone(input.storeId),
        dropoff_phone: await this.getCustomerPhone(input.orderId)
      },
      tip_cents: 0
    }

    const delivery = await this.makeRequest<DoorDashDelivery>('/deliveries', {
      method: 'POST',
      body: JSON.stringify(doorDashInput)
    })

    return {
      providerExternalId: delivery.external_delivery_id,
      trackingUrl: delivery.tracking_url,
      providerStatus: delivery.status,
      providerPayload: {
        provider: 'DOORDASH_DRIVE',
        delivery,
        createdAt: new Date().toISOString()
      }
    }
  }

  async cancelDelivery(input: CancelDeliveryInput): Promise<CancelDeliveryResult> {
    await this.makeRequest<any>(`/deliveries/${input.providerExternalId}/cancel`, {
      method: 'POST'
    })

    return {
      providerStatus: 'canceled',
      providerPayload: {
        provider: 'DOORDASH_DRIVE',
        canceled: true,
        canceledAt: new Date().toISOString()
      }
    }
  }

  async getDeliveryStatus(externalId: string): Promise<any> {
    return await this.makeRequest<any>(`/deliveries/${externalId}`)
  }

  // Helper methods - these would need to be implemented based on your data model
  private async getPickupAddress(storeId: string): Promise<any> {
    // TODO: Implement based on your store data model
    throw new Error('getPickupAddress not implemented')
  }

  private async getDropoffStreet(orderId: string): Promise<string> {
    // TODO: Implement based on your order data model
    throw new Error('getDropoffStreet not implemented')
  }

  private async getDropoffCity(orderId: string): Promise<string> {
    // TODO: Implement based on your order data model
    throw new Error('getDropoffCity not implemented')
  }

  private async getDropoffState(orderId: string): Promise<string> {
    // TODO: Implement based on your order data model
    throw new Error('getDropoffState not implemented')
  }

  private async getDropoffZip(orderId: string): Promise<string> {
    // TODO: Implement based on your order data model
    throw new Error('getDropoffZip not implemented')
  }

  private async getOrderValue(orderId: string): Promise<number> {
    // TODO: Implement based on your order data model
    throw new Error('getOrderValue not implemented')
  }

  private async getStorePhone(storeId: string): Promise<string> {
    // TODO: Implement based on your store data model
    throw new Error('getStorePhone not implemented')
  }

  private async getCustomerPhone(orderId: string): Promise<string> {
    // TODO: Implement based on your order data model
    throw new Error('getCustomerPhone not implemented')
  }
}
