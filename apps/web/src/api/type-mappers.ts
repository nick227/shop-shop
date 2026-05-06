import type {
  ListOrders200ResponseDataInner,
} from '../../../../packages/sdk/generated/sdk/models'

import type {
  OrderResponse,
} from './backend-types'

interface SDKWithId {
  id?: string
  createdAt?: string
  updatedAt?: string
}

function hasSdkId(data: unknown): data is { id?: string } {
  return typeof data === 'object' && data !== null && 'id' in data
}

function hasIdField(data: unknown): data is SDKWithId {
  return typeof data === 'object' && data !== null && 'id' in data
}

function hasTimestampFields(data: unknown): data is SDKWithId {
  return typeof data === 'object' && data !== null && 'createdAt' in data && 'updatedAt' in data
}

function extractId(data: unknown, fallback = ''): string {
  if (hasIdField(data) && typeof data.id === 'string') {
    return data.id
  }
  if (typeof data === 'object' && data !== null) {
    const dataStr = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < dataStr.length; i++) {
      const char = dataStr.codePointAt(i) ?? 0
      hash = ((hash << 5) - hash) + char
    }
    return `generated-${Math.abs(hash)}`
  }
  return fallback
}

function extractTimestamps(data: unknown): { createdAt: string; updatedAt: string } {
  const now = new Date().toISOString()
  if (hasTimestampFields(data)) {
    return {
      createdAt: typeof data.createdAt === 'string' ? data.createdAt : now,
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : now
    }
  }
  return { createdAt: now, updatedAt: now }
}

function extractString(data: unknown, field: string, fallback = ''): string {
  if (typeof data === 'object' && data !== null && field in data) {
    const value = (data as Record<string, unknown>)[field]
    if (typeof value === 'string') return value
  }
  return fallback
}

export function mapOrder(sdk: ListOrders200ResponseDataInner): OrderResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, `order-${hasSdkId(sdk) ? sdk.id ?? 'unknown' : 'unknown'}`)

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    stripePaymentIntentId: extractString(sdk, 'stripePaymentIntentId') || undefined,
    stripeChargeId: extractString(sdk, 'stripeChargeId') || undefined,
    status: extractString(sdk, 'status') || 'PENDING',
    deliveryType: extractString(sdk, 'deliveryType') || 'DELIVERY',
    paymentStatus: extractString(sdk, 'paymentStatus') || 'PENDING',
    addressSnapshot: sdk.addressSnapshot ?? undefined,
  } as OrderResponse
}
