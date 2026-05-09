import { describe, it, expect } from 'vitest'
import {
  doorDashEventToAdapterType,
  normalizeDoorDashWebhookPayload,
} from './doordash-webhook-payload.js'

describe('normalizeDoorDashWebhookPayload', () => {
  it('normalizes event_name + external_delivery_id', () => {
    const n = normalizeDoorDashWebhookPayload({
      event_name: 'DASHER_PICKED_UP',
      external_delivery_id: 'ext-1',
      event_id: 'e1',
    })
    expect(n).toEqual({
      externalDeliveryId: 'ext-1',
      eventName: 'DASHER_PICKED_UP',
      eventId: 'e1',
      raw: {
        event_name: 'DASHER_PICKED_UP',
        external_delivery_id: 'ext-1',
        event_id: 'e1',
      },
    })
  })

  it('normalizes event_type + delivery_external_id', () => {
    const n = normalizeDoorDashWebhookPayload({
      event_type: 'DELIVERY_CANCELLED',
      delivery_external_id: 'ext-2',
    })
    expect(n?.externalDeliveryId).toBe('ext-2')
    expect(n?.eventName).toBe('DELIVERY_CANCELLED')
  })
})

describe('doorDashEventToAdapterType', () => {
  it('maps DASHER_DROPPED_OFF to delivered', () => {
    expect(doorDashEventToAdapterType('DASHER_DROPPED_OFF')).toBe('delivered')
  })

  it('maps DELIVERY_CANCELLED to canceled', () => {
    expect(doorDashEventToAdapterType('DELIVERY_CANCELLED')).toBe('canceled')
  })
})
