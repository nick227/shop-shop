import { useState, useEffect, useCallback } from 'react'
import { Bell, X, CheckCircle, Truck, Package, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@shared/ui/primitives'

export interface DeliveryNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  orderId: string
  storeName: string
  action?: {
    label: string
    onClick: () => void
  }
  autoClose?: boolean
  duration?: number
}

export interface DeliveryNotificationsProps {
  notifications: DeliveryNotification[]
  onDismiss: (id: string) => void
  onClearAll: () => void
  maxVisible?: number
}

export function DeliveryNotifications({
  notifications,
  onDismiss,
  onClearAll,
  maxVisible = 3
}: DeliveryNotificationsProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<DeliveryNotification[]>([])

  // Filter and limit visible notifications
  useEffect(() => {
    const sorted = notifications
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, maxVisible)
    setVisibleNotifications(sorted)
  }, [notifications, maxVisible])

  // Auto-dismiss notifications
  useEffect(() => {
    const timers = visibleNotifications.map(notification => {
      if (notification.autoClose !== false) {
        const duration = notification.duration || 5000
        return setTimeout(() => {
          onDismiss(notification.id)
        }, duration)
      }
      return null
    }).filter(Boolean) as NodeJS.Timeout[]

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [visibleNotifications, onDismiss])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle
      case 'warning': return AlertTriangle
      case 'error': return AlertTriangle
      case 'info': return Bell
      default: return Bell
    }
  }

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {/* Clear All Button */}
      {notifications.length > maxVisible && (
        <div className="flex justify-end">
          <Button
            onClick={onClearAll}
            variant="outline"
            size="small"
            className="text-xs"
          >
            Clear All ({notifications.length})
          </Button>
        </div>
      )}

      {/* Notification Stack */}
      <div className="space-y-2">
        {visibleNotifications.map((notification, index) => {
          const Icon = getNotificationIcon(notification.type)
          const styles = getNotificationStyles(notification.type)

          return (
            <div
              key={notification.id}
              className={`
                ${styles}
                border rounded-lg shadow-lg p-4 transition-all duration-300
                transform translate-x-0 opacity-100
                hover:shadow-xl
                ${index === 0 ? 'animate-pulse' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">
                        {notification.title}
                      </h4>
                      <p className="text-xs mt-1 opacity-90">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs opacity-75">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                        <span className="text-xs opacity-75">
                          • {notification.storeName}
                        </span>
                      </div>
                      
                      {notification.action && (
                        <Button
                          onClick={notification.action.onClick}
                          size="small"
                          className="mt-2 text-xs"
                          variant="outline"
                        >
                          {notification.action.label}
                        </Button>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => onDismiss(notification.id)}
                      variant="ghost"
                      size="small"
                      className="flex-shrink-0 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Hook for managing delivery notifications
export function useDeliveryNotifications() {
  const [notifications, setNotifications] = useState<DeliveryNotification[]>([])

  const addNotification = useCallback((notification: Omit<DeliveryNotification, 'id' | 'timestamp'>) => {
    const newNotification: DeliveryNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Also trigger browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.orderId
      })
    }
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications
  }
}

// Predefined notification templates
export const DeliveryNotificationTemplates = {
  orderPlaced: (orderId: string, storeName: string) => ({
    type: 'info' as const,
    title: 'Order Placed',
    message: `Your order from ${storeName} has been received`,
    orderId,
    storeName,
    autoClose: true,
    duration: 3000
  }),

  orderAccepted: (orderId: string, storeName: string) => ({
    type: 'success' as const,
    title: 'Order Accepted',
    message: `${storeName} has confirmed your order`,
    orderId,
    storeName,
    autoClose: true,
    duration: 3000
  }),

  orderPreparing: (orderId: string, storeName: string) => ({
    type: 'info' as const,
    title: 'Preparing Your Order',
    message: `${storeName} is preparing your order`,
    orderId,
    storeName,
    autoClose: true,
    duration: 4000
  }),

  orderReady: (orderId: string, storeName: string) => ({
    type: 'success' as const,
    title: 'Order Ready',
    message: `Your order from ${storeName} is ready for pickup`,
    orderId,
    storeName,
    autoClose: false,
    duration: 6000
  }),

  driverAssigned: (orderId: string, storeName: string, driverName?: string) => ({
    type: 'info' as const,
    title: 'Driver Assigned',
    message: `${driverName ? `${driverName} is` : 'A driver is'} delivering your order from ${storeName}`,
    orderId,
    storeName,
    autoClose: true,
    duration: 4000
  }),

  outForDelivery: (orderId: string, storeName: string) => ({
    type: 'success' as const,
    title: 'Out for Delivery',
    message: `Your order from ${storeName} is on the way`,
    orderId,
    storeName,
    autoClose: false,
    duration: 5000
  }),

  orderDelivered: (orderId: string, storeName: string) => ({
    type: 'success' as const,
    title: 'Order Delivered',
    message: `Your order from ${storeName} has been delivered`,
    orderId,
    storeName,
    autoClose: false,
    duration: 8000
  }),

  orderDelayed: (orderId: string, storeName: string, reason?: string) => ({
    type: 'warning' as const,
    title: 'Order Delayed',
    message: `Your order from ${storeName} is delayed${reason ? `: ${reason}` : ''}`,
    orderId,
    storeName,
    autoClose: false,
    duration: 6000
  })
}
