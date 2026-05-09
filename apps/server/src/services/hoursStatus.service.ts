import { prisma } from '@packages/db'
// Using local types for now - will integrate with main types later
interface DayHours {
  open: string
  close: string
  closed?: boolean
}

interface HoursJson {
  timezone?: string
  storeHours?: Record<string, DayHours>
  deliveryHours?: Record<string, DayHours>
  specialHours?: Record<string, { closed: boolean; reason?: string }>
}

export interface HoursStatusResponse {
  isStoreOpen: boolean
  isDeliveryAvailable: boolean
  isPickupAvailable: boolean
  reason?: string
  statusLabel: 'OPEN' | 'CLOSED' | 'PICKUP_ONLY' | 'DELIVERY_CLOSED'
  nextStoreOpenAt?: string
  nextStoreCloseAt?: string
  nextDeliveryOpenAt?: string
  nextDeliveryCloseAt?: string
  timezone: string
  todayHours?: {
    store?: { open: string; close: string; closed: boolean }
    delivery?: { open: string; close: string; closed: boolean }
  }
}

const DAY_ORDER = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const
const DAY_MAP = {
  0: 'SUN',
  1: 'MON', 
  2: 'TUE',
  3: 'WED',
  4: 'THU',
  5: 'FRI',
  6: 'SAT'
} as const

export class HoursStatusService {
  constructor() {}

  /**
   * Get current hours status for a store
   */
  async getStoreHoursStatus(storeId: string): Promise<HoursStatusResponse> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        hoursJson: true
      }
    })

    if (!store) {
      throw new Error('Store not found')
    }

    const hours = store.hoursJson as HoursJson | null
    const timezone = (hours as any)?.timezone || 'America/New_York'

    return this.calculateHoursStatus(hours, timezone)
  }

  /**
   * Calculate hours status based on store hours and timezone
   */
  private calculateHoursStatus(hours: HoursJson | null, timezone: string): HoursStatusResponse {
    const now = new Date()
    const nowInTz = new Date(now.toLocaleString("en-US", { timeZone: timezone }))
    
    // Default to closed if no hours set
    if (!hours?.storeHours) {
      return {
        isStoreOpen: false,
        isDeliveryAvailable: false,
        isPickupAvailable: false,
        statusLabel: 'CLOSED',
        reason: 'Store hours not configured',
        timezone,
        todayHours: undefined
      }
    }

    const today = this.getDayOfWeek(nowInTz)
    const todayStoreHours = hours.storeHours[today]
    const todayDeliveryHours = hours.deliveryHours?.[today] || todayStoreHours

    // Check special hours for today
    const todayStr = nowInTz.toISOString().split('T')[0]
    const specialHours = hours.specialHours?.[todayStr]

    if (specialHours?.closed) {
      return {
        isStoreOpen: false,
        isDeliveryAvailable: false,
        isPickupAvailable: false,
        statusLabel: 'CLOSED',
        reason: specialHours.reason || 'Closed for holiday',
        timezone,
        todayHours: {
          store: todayStoreHours,
          delivery: todayDeliveryHours
        }
      }
    }

    // Check if store is open
    const isStoreOpen = this.isTimeInRange(nowInTz, todayStoreHours)
    
    // Check if delivery is available
    const isDeliveryAvailable = isStoreOpen && 
      this.isTimeInRange(nowInTz, todayDeliveryHours)

    // Calculate next opening/closing times
    const { nextOpen, nextClose } = this.calculateNextTimes(
      nowInTz, 
      hours.storeHours, 
      hours.deliveryHours,
      today
    )

    const response: HoursStatusResponse = {
      isStoreOpen,
      isDeliveryAvailable,
      isPickupAvailable: isStoreOpen, // Pickup available when store is open
      statusLabel: this.getStatusLabel(isStoreOpen, isDeliveryAvailable),
      timezone,
      todayHours: {
        store: todayStoreHours,
        delivery: todayDeliveryHours
      }
    }

    // Add reason if closed
    if (!isStoreOpen && todayStoreHours) {
      response.reason = `Opens at ${this.formatTime(todayStoreHours.open)}`
    } else if (isStoreOpen && !isDeliveryAvailable) {
      response.reason = `Delivery opens at ${this.formatTime(todayDeliveryHours?.open || todayStoreHours.open)}`
    }

    // Add next times
    if (nextOpen) {
      response.nextStoreOpenAt = nextOpen.toISOString()
      response.nextDeliveryOpenAt = nextOpen.toISOString()
    }
    if (nextClose) {
      response.nextStoreCloseAt = nextClose.toISOString()
      response.nextDeliveryCloseAt = nextClose.toISOString()
    }

    return response
  }

  private getStatusLabel(isStoreOpen: boolean, isDeliveryAvailable: boolean): HoursStatusResponse['statusLabel'] {
    if (!isStoreOpen) return 'CLOSED'
    if (isStoreOpen && !isDeliveryAvailable) return 'DELIVERY_CLOSED'
    return 'OPEN'
  }

  /**
   * Check if current time is within operating hours
   */
  private isTimeInRange(now: Date, hours: DayHours | undefined): boolean {
    if (!hours || hours.closed) return false

    const [openHour, openMin] = hours.open.split(':').map(Number)
    const [closeHour, closeMin] = hours.close.split(':').map(Number)

    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const openMinutes = openHour * 60 + openMin
    const closeMinutes = closeHour * 60 + closeMin

    // Handle overnight hours (e.g., 22:00 - 02:00)
    if (closeMinutes < openMinutes) {
      return nowMinutes >= openMinutes || nowMinutes < closeMinutes
    }

    return nowMinutes >= openMinutes && nowMinutes < closeMinutes
  }

  /**
   * Get day of week string
   */
  private getDayOfWeek(date: Date): string {
    return DAY_MAP[date.getDay() as keyof typeof DAY_MAP]
  }

  /**
   * Calculate next opening and closing times
   */
  private calculateNextTimes(
    now: Date,
    storeHours: Record<string, DayHours>,
    deliveryHours: Record<string, DayHours> | undefined,
    today: string
  ): { nextOpen?: Date, nextClose?: Date } {
    const tomorrow = this.getNextDay(today)
    const todayDeliveryHours = deliveryHours?.[today] || storeHours[today]
    const tomorrowDeliveryHours = deliveryHours?.[tomorrow] || storeHours[tomorrow]

    const result: { nextOpen?: Date, nextClose?: Date } = {}

    // If currently open, when does it close?
    if (this.isTimeInRange(now, todayDeliveryHours)) {
      const [closeHour, closeMin] = todayDeliveryHours.close.split(':').map(Number)
      const closeDate = new Date(now)
      closeDate.setHours(closeHour, closeMin, 0, 0)
      
      // If closing time has passed today, it's tomorrow
      if (closeDate < now) {
        closeDate.setDate(closeDate.getDate() + 1)
      }
      
      result.nextClose = closeDate
    }
    
    // When does it next open?
    if (!this.isTimeInRange(now, todayDeliveryHours)) {
      const [openHour, openMin] = todayDeliveryHours.open.split(':').map(Number)
      const openDate = new Date(now)
      openDate.setHours(openHour, openMin, 0, 0)
      
      // If opening time has passed today, it's tomorrow
      if (openDate < now) {
        openDate.setDate(openDate.getDate() + 1)
      }
      
      result.nextOpen = openDate
    }

    return result
  }

  /**
   * Get next day of week
   */
  private getNextDay(currentDay: string): string {
    const currentIndex = DAY_ORDER.indexOf(currentDay as any)
    const nextIndex = (currentIndex + 1) % 7
    return DAY_ORDER[nextIndex]
  }

  /**
   * Format time for display
   */
  private formatTime(time: string): string {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
    return `${displayHour}:${minutes} ${ampm}`
  }
}
