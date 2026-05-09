import { Clock, Package, AlertCircle } from 'lucide-react'

interface StoreHoursBadgeProps {
  isStoreOpen: boolean
  isDeliveryAvailable: boolean
  reason?: string
  nextDeliveryOpenAt?: string
  nextDeliveryCloseAt?: string
  timezone: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StoreHoursBadge({
  isStoreOpen,
  isDeliveryAvailable,
  reason,
  nextDeliveryOpenAt,
  nextDeliveryCloseAt,
  timezone,
  size = 'md',
  className = ''
}: StoreHoursBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  const getStatusInfo = () => {
    if (!isStoreOpen) {
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertCircle,
        text: 'Closed',
        subtext: reason || 'Opens tomorrow'
      }
    }

    if (isStoreOpen && !isDeliveryAvailable) {
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        text: 'Pickup only',
        subtext: reason || 'Delivery unavailable'
      }
    }

    if (isStoreOpen && isDeliveryAvailable) {
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: Package,
        text: 'Open',
        subtext: 'Delivery available'
      }
    }

    return {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: AlertCircle,
      text: 'Unknown',
      subtext: 'Status unavailable'
    }
  }

  const statusInfo = getStatusInfo()
  const Icon = statusInfo.icon

  const formatNextTime = (dateString?: string) => {
    if (!dateString) return null
    
    try {
      const date = new Date(dateString)
      const now = new Date()
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      
      // Convert to user's timezone for display
      const localTime = new Date(date.toLocaleString("en-US", { timeZone: userTimezone }))
      
      // If it's tomorrow
      if (localTime.toDateString() !== now.toDateString()) {
        return `Opens tomorrow at ${localTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })}`
      }
      
      return `Opens at ${localTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`
    } catch {
      return null
    }
  }

  const nextOpenTime = formatNextTime(nextDeliveryOpenAt)

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border ${sizeClasses[size]} ${statusInfo.color} ${className}`}>
      <Icon className="w-4 h-4" />
      <div className="flex flex-col">
        <span className="font-medium">{statusInfo.text}</span>
        {statusInfo.subtext && (
          <span className="text-xs opacity-75">{statusInfo.subtext}</span>
        )}
        {nextOpenTime && (
          <span className="text-xs opacity-75 mt-1">{nextOpenTime}</span>
        )}
      </div>
    </div>
  )
}
