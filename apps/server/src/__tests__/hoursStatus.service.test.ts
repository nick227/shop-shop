import { describe, it, expect, vi, afterEach } from 'vitest'
import { prisma } from '@packages/db'
import { HoursStatusService } from '../services/hoursStatus.service.js'

describe('HoursStatusService', () => {
  const service = new HoursStatusService()

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('throws when store is missing', async () => {
    vi.spyOn(prisma.store, 'findUnique').mockResolvedValue(null)
    await expect(service.getStoreHoursStatus('missing-id')).rejects.toThrow('Store not found')
  })

  it('returns closed when hours are not configured', async () => {
    vi.spyOn(prisma.store, 'findUnique').mockResolvedValue({ hoursJson: null } as never)
    const result = await service.getStoreHoursStatus('store-1')
    expect(result.statusLabel).toBe('CLOSED')
    expect(result.reason).toBe('Store hours not configured')
    expect(result.timezone).toBe('America/New_York')
  })

  it('returns OPEN when Monday noon Chicago is inside store hours', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T18:00:00.000Z'))
    vi.spyOn(prisma.store, 'findUnique').mockResolvedValue({
      hoursJson: {
        timezone: 'America/Chicago',
        storeHours: {
          MON: { open: '09:00', close: '22:00', closed: false },
        },
      },
    } as never)
    const result = await service.getStoreHoursStatus('store-1')
    expect(result.isStoreOpen).toBe(true)
    expect(result.isDeliveryAvailable).toBe(true)
    expect(result.statusLabel).toBe('OPEN')
    expect(result.timezone).toBe('America/Chicago')
  })

  it('returns DELIVERY_CLOSED when store is open but delivery is closed for the day', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T18:00:00.000Z'))
    vi.spyOn(prisma.store, 'findUnique').mockResolvedValue({
      hoursJson: {
        timezone: 'America/Chicago',
        storeHours: {
          MON: { open: '09:00', close: '22:00', closed: false },
        },
        deliveryHours: {
          MON: { open: '10:00', close: '21:00', closed: true },
        },
      },
    } as never)
    const result = await service.getStoreHoursStatus('store-1')
    expect(result.isStoreOpen).toBe(true)
    expect(result.isDeliveryAvailable).toBe(false)
    expect(result.statusLabel).toBe('DELIVERY_CLOSED')
    expect(result.reason).toMatch(/Delivery opens at/)
  })
})
