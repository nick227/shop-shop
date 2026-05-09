import { describe, it, expect, beforeEach } from 'vitest'
import { HoursStatusService } from '../services/hoursStatus.service'

describe('HoursStatusService', () => {
  let service: HoursStatusService

  beforeEach(() => {
    service = new HoursStatusService()
  })

  describe('Wall-clock time preservation', () => {
    it('should preserve "09:00" and "22:00" as wall-clock times', async () => {
      const hours = {
        timezone: 'America/Chicago',
        storeHours: {
          MON: { open: '09:00', close: '22:00', closed: false },
          TUE: { open: '09:00', close: '22:00', closed: false }
        }
      }

      const result = await service.getStoreHoursStatus('store-1')
      
      expect(result.isStoreOpen).toBe(true)
      expect(result.isDeliveryAvailable).toBe(true)
      expect(result.timezone).toBe('America/Chicago')
      expect(result.todayHours?.store).toEqual({
        MON: { open: '09:00', close: '22:00', closed: false },
        TUE: { open: '09:00', close: '22:00', closed: false }
      })
    })

    it('should not convert wall-clock times to UTC', async () => {
      const hours = {
        timezone: 'America/Chicago',
        storeHours: {
          MON: { open: '09:00', close: '22:00', closed: false }
        }
      }

      const result = await service.getStoreHoursStatus('store-1')
      
      // Verify wall-clock times are preserved in response
      expect(result.todayHours?.store?.MON.open).toBe('09:00')
      expect(result.todayHours?.store?.MON.close).toBe('22:00')
    })
  })

  describe('Delivery availability during delivery window', () => {
    it('should return delivery available when store open and delivery hours active', async () => {
      const hours = {
        timezone: 'America/Chicago',
        storeHours: {
          MON: { open: '09:00', close: '22:00', closed: false }
        },
        deliveryHours: {
          MON: { open: '10:00', close: '21:00', closed: false }
        }
      }

      const result = await service.getStoreHoursStatus('store-1')
      
      expect(result.isStoreOpen).toBe(true)
      expect(result.isDeliveryAvailable).toBe(true)
      expect(result.statusLabel).toBe('OPEN')
    })

    it('should return pickup only when store open but delivery closed', async () => {
      const hours = {
        timezone: 'America/Chicago',
        storeHours: {
          MON: { open: '09:00', close: '22:00', closed: false }
        },
        deliveryHours: {
          MON: { open: '10:00', close: '21:00', closed: true }
        }
      }

      const result = await service.getStoreHoursStatus('store-1')
      
      expect(result.isStoreOpen).toBe(true)
      expect(result.isDeliveryAvailable).toBe(false)
      expect(result.isPickupAvailable).toBe(true)
      expect(result.statusLabel).toBe('DELIVERY_CLOSED')
      expect(result.reason).toBe('Delivery opens at 10:00 AM')
    })
  })

  describe('Closed weekdays handling', () => {
    it('should return closed when store closed on weekday', async () => {
      const hours = {
        timezone: 'America/Chicago',
        storeHours: {
          MON: { open: '09:00', close: '22:00', closed: true }
        }
      }

      const result = await service.getStoreHoursStatus('store-1')
      
      expect(result.isStoreOpen).toBe(false)
      expect(result.isDeliveryAvailable).toBe(false)
      expect(result.isPickupAvailable).toBe(false)
      expect(result.statusLabel).toBe('CLOSED')
      expect(result.reason).toBe('Opens at 9:00 AM')
    })
  })

  describe('Special hours override', () => {
    it('should return closed for holiday with special hours', async () => {
      const hours = {
        timezone: 'America/Chicago',
        storeHours: {
          MON: { open: '09:00', close: '22:00', closed: false }
        },
        specialHours: {
          '2024-12-25': { closed: true, reason: 'Christmas' }
        }
      }

      const result = await service.getStoreHoursStatus('store-1')
      
      expect(result.isStoreOpen).toBe(false)
      expect(result.isDeliveryAvailable).toBe(false)
      expect(result.isPickupAvailable).toBe(false)
      expect(result.statusLabel).toBe('CLOSED')
      expect(result.reason).toBe('Closed for holiday')
    })
  })

  describe('Overnight hours handling', () => {
    it('should handle overnight store hours (22:00 - 02:00)', async () => {
      const hours = {
        timezone: 'America/Chicago',
        storeHours: {
          MON: { open: '22:00', close: '02:00', closed: false }
        }
      }

      // Mock current time at 23:00 (should be open)
      const mockNow = new Date('2024-01-15T23:30:00.000Z')
      jest.spyOn(Date, 'prototype', 'toLocaleString')
        .mockReturnValueOnce('1/15/2024, 11:30:00 PM CST')

      const result = await service.getStoreHoursStatus('store-1')
      
      expect(result.isStoreOpen).toBe(true)
      expect(result.isDeliveryAvailable).toBe(true)
    })

    it('should handle overnight delivery hours (20:00 - 01:00)', async () => {
      const hours = {
        timezone: 'America/Chicago',
        storeHours: {
          MON: { open: '09:00', close: '22:00', closed: false }
        },
        deliveryHours: {
          MON: { open: '20:00', close: '01:00', closed: false }
        }
      }

      // Mock current time at 23:30 (should be closed for delivery)
      const mockNow = new Date('2024-01-15T23:30:00.000Z')
      jest.spyOn(Date, 'prototype', 'toLocaleString')
        .mockReturnValueOnce('1/15/2024, 11:30:00 PM CST')

      const result = await service.getStoreHoursStatus('store-1')
      
      expect(result.isStoreOpen).toBe(true)
      expect(result.isDeliveryAvailable).toBe(false)
      expect(result.reason).toBe('Delivery opens at 8:00 PM')
    })
  })

  describe('Missing hours fallback', () => {
    it('should return safe defaults when no hours configured', async () => {
      const result = await service.getStoreHoursStatus('store-1')
      
      expect(result.isStoreOpen).toBe(false)
      expect(result.isDeliveryAvailable).toBe(false)
      expect(result.isPickupAvailable).toBe(false)
      expect(result.statusLabel).toBe('CLOSED')
      expect(result.reason).toBe('Store hours not configured')
      expect(result.timezone).toBe('America/New_York') // Default timezone
    })
  })

  describe('Timezone handling', () => {
    it('should respect different timezones', async () => {
      const hours = {
        timezone: 'Europe/London',
        storeHours: {
          MON: { open: '09:00', close: '17:00', closed: false }
        }
      }

      // Mock current time in London timezone
      const mockNow = new Date('2024-01-15T14:00:00.000Z')
      jest.spyOn(Date, 'prototype', 'toLocaleString')
        .mockReturnValueOnce('1/15/2024, 2:00:00 PM GMT')

      const result = await service.getStoreHoursStatus('store-1')
      
      expect(result.isStoreOpen).toBe(true)
      expect(result.timezone).toBe('Europe/London')
    })

    it('should handle timezone different from user', async () => {
      const hours = {
        timezone: 'Asia/Tokyo',
        storeHours: {
          MON: { open: '09:00', close: '17:00', closed: false }
        }
      }

      const result = await service.getStoreHoursStatus('store-1')
      
      // Should calculate status based on store's timezone, not user's
      expect(result.timezone).toBe('Asia/Tokyo')
    })
  })

  describe('Next time calculations', () => {
    it('should calculate next opening time for tomorrow', async () => {
      const hours = {
        timezone: 'America/Chicago',
        storeHours: {
          MON: { open: '09:00', close: '17:00', closed: true }
        }
      }

      // Mock current time after hours (Monday at 20:00)
      const mockNow = new Date('2024-01-15T20:00:00.000Z')
      jest.spyOn(Date, 'prototype', 'toLocaleString')
        .mockReturnValueOnce('1/15/2024, 2:00:00 PM CST')

      const result = await service.getStoreHoursStatus('store-1')
      
      expect(result.nextStoreOpenAt).toBeDefined()
      expect(result.nextDeliveryOpenAt).toBeDefined()
      
      // Should be tomorrow at 9:00 AM CST
      const expectedNextOpen = new Date('2024-01-16T09:00:00.000-06:00')
      expect(new Date(result.nextStoreOpenAt!)).toEqual(expectedNextOpen)
    })

    it('should calculate next closing time when open', async () => {
      const hours = {
        timezone: 'America/Chicago',
        storeHours: {
          MON: { open: '09:00', close: '17:00', closed: false }
        }
      }

      // Mock current time during hours (Monday at 14:00)
      const mockNow = new Date('2024-01-15T14:00:00.000Z')
      jest.spyOn(Date, 'prototype', 'toLocaleString')
        .mockReturnValueOnce('1/15/2024, 2:00:00 PM CST')

      const result = await service.getStoreHoursStatus('store-1')
      
      expect(result.nextStoreCloseAt).toBeDefined()
      expect(result.nextDeliveryCloseAt).toBeDefined()
      
      // Should be today at 5:00 PM CST
      const expectedNextClose = new Date('2024-01-15T17:00:00.000-06:00')
      expect(new Date(result.nextStoreCloseAt!)).toEqual(expectedNextClose)
    })
  })
})
