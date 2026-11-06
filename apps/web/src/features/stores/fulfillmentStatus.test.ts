import { describe, expect, it } from 'vitest'
import { deliveryRank, fulfillmentBadge, fulfillmentExplanation } from './fulfillmentStatus'

describe('fulfillment status wording', () => {
  it('labels each state for cards', () => {
    expect(fulfillmentBadge({ delivery: 'available', pickup: 'available' })).toEqual({ label: 'Delivery & pickup', tone: 'ready' })
    expect(fulfillmentBadge({ delivery: 'available', pickup: 'not_offered' })).toEqual({ label: 'Delivery', tone: 'ready' })
    expect(fulfillmentBadge({ delivery: 'not_offered', pickup: 'available' })).toEqual({ label: 'Pickup only', tone: 'limited' })
    expect(fulfillmentBadge({ delivery: 'temporarily_unavailable', pickup: 'available' })).toEqual({ label: 'Pickup · no delivery now', tone: 'limited' })
    expect(fulfillmentBadge({ delivery: 'temporarily_unavailable', pickup: 'temporarily_unavailable' })).toEqual({ label: 'Not taking orders', tone: 'closed' })
    expect(fulfillmentBadge(undefined)).toBeUndefined()
  })

  it('explains a missing option in shopper terms only', () => {
    expect(fulfillmentExplanation({ delivery: 'available', pickup: 'available' })).toBeNull()
    expect(fulfillmentExplanation({ delivery: 'not_offered', pickup: 'available' })).toMatch(/doesn’t deliver/)
    expect(fulfillmentExplanation({ delivery: 'temporarily_unavailable', pickup: 'available' })).toMatch(/still order for pickup/)
  })

  it('ranks delivering shops first and unknown status with the unavailable ones', () => {
    expect(deliveryRank({ delivery: 'available', pickup: 'available' })).toBe(0)
    expect(deliveryRank(undefined)).toBe(1)
    expect(deliveryRank({ delivery: 'not_offered', pickup: 'available' })).toBe(2)
  })
})
