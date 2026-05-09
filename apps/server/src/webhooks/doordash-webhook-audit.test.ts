import { describe, it, expect } from 'vitest'
import { extractProcessedDoorDashEventIds, mergeDoorDashWebhookAudit } from './doordash-webhook-audit.js'

describe('doordash-webhook-audit', () => {
  it('extractProcessedDoorDashEventIds reads nested ids', () => {
    const ids = extractProcessedDoorDashEventIds({
      doorDashWebhook: { processedEventIds: ['a', 'b'] },
    })
    expect([...ids]).toEqual(['a', 'b'])
  })

  it('mergeDoorDashWebhookAudit appends event id and raw payload', () => {
    const merged = mergeDoorDashWebhookAudit(
      { provider: 'x', doorDashWebhook: { processedEventIds: ['old'] } },
      'evt-new',
      { foo: 'bar' },
    )
    expect(merged.doorDashWebhook).toMatchObject({
      processedEventIds: ['old', 'evt-new'],
      lastRawEvent: { foo: 'bar' },
    })
    expect(typeof (merged.doorDashWebhook as { lastProcessedAt?: string }).lastProcessedAt).toBe('string')
  })
})
