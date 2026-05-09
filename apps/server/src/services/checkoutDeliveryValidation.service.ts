import { prisma } from '@packages/db'

export interface CheckoutDeliveryValidation {
  canProceed: boolean
  reason?: string
  alternativeOptions?: ('pickup' | 'schedule' | 'contact_store')[]
}

export class CheckoutDeliveryValidationService {
  /**
   * Validate if delivery checkout can proceed
   */
  async validateDeliveryCheckout(storeId: string): Promise<CheckoutDeliveryValidation> {
    // Get store hours status
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        hoursJson: true,
        deliveryEnabled: true,
        pickupEnabled: true
      }
    })

    if (!store) {
      return {
        canProceed: false,
        reason: 'Store not found'
      }
    }

    // If delivery is disabled, only pickup available
    if (!store.deliveryEnabled) {
      return {
        canProceed: false,
        reason: 'Delivery not available for this store',
        alternativeOptions: ['pickup']
      }
    }

    // If no hours configured, block delivery
    const hours = store.hoursJson as any
    if (!hours?.storeHours) {
      return {
        canProceed: false,
        reason: 'Store hours not configured',
        alternativeOptions: ['pickup']
      }
    }

    // Check if delivery is currently available
    // This would call the hours status service
    const timezone = hours.timezone || 'America/New_York'
    const now = new Date()
    const nowInTz = new Date(now.toLocaleString("en-US", { timeZone: timezone }))
    
    const today = this.getDayOfWeek(nowInTz)
    const todayDeliveryHours = hours.deliveryHours?.[today] || hours.storeHours[today]
    
    // Check special hours for today
    const todayStr = nowInTz.toISOString().split('T')[0]
    const specialHours = hours.specialHours?.[todayStr]

    if (specialHours?.closed) {
      return {
        canProceed: false,
        reason: specialHours.reason || 'Store closed for holiday',
        alternativeOptions: ['schedule', 'pickup']
      }
    }

    // Check if within delivery hours
    const isDeliveryAvailable = this.isTimeInRange(nowInTz, todayDeliveryHours)
    
    if (!isDeliveryAvailable) {
      return {
        canProceed: false,
        reason: 'Delivery not available at this time',
        alternativeOptions: ['schedule', 'pickup']
      }
    }

    // Delivery checkout can proceed
    return {
      canProceed: true
    }
  }

  private isTimeInRange(now: Date, hours: any): boolean {
    if (!hours || hours.closed) return false

    const [openHour, openMin] = hours.open.split(':').map(Number)
    const [closeHour, closeMin] = hours.close.split(':').map(Number)

    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const openMinutes = openHour * 60 + openMin
    const closeMinutes = closeHour * 60 + closeMin

    // Handle overnight hours
    if (closeMinutes < openMinutes) {
      return nowMinutes >= openMinutes || nowMinutes < closeMinutes
    }

    return nowMinutes >= openMinutes && nowMinutes < closeMinutes
  }

  private getDayOfWeek(date: Date): string {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    return days[date.getDay()]
  }
}
