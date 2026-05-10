/**
 * DeliveryModeSelector - Dynamic delivery mode selection based on store options
 * 
 * Fetches delivery options from store configuration and shows available methods:
 * - PICKUP: Customer picks up order (always available)
 * - IN_HOUSE: Store delivers with their own drivers
 * - DOORDASH_DRIVE: DoorDash handles delivery
 */

import React from 'react'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { Badge } from '@shared/ui/primitives'
import { useStoreDeliveryOptions, type StoreDeliveryOption } from '../../hooks/useStoreDeliveryOptions'

export type DeliveryMode = 'PICKUP' | 'IN_HOUSE' | 'DOORDASH_DRIVE'

export interface DeliveryModeSelectorProps {
  storeId: string
  value: DeliveryMode
  onChange: (mode: DeliveryMode) => void
  disabled?: boolean
}

const DELIVERY_MODE_CONFIG: Record<string, { label: string; description: string; icon: string; badge?: string }> = {
  PICKUP: {
    label: 'Pickup',
    description: "I'll pick up my order",
    icon: '🏪',
  },
  IN_HOUSE: {
    label: 'Store Delivery',
    description: 'Restaurant delivers with their own drivers',
    icon: '🚗',
    badge: 'RECOMMENDED',
  },
  DOORDASH_DRIVE: {
    label: 'DoorDash Delivery',
    description: 'Delivered by DoorDash driver',
    icon: '�',
  },
}

export function DeliveryModeSelector({ storeId, value, onChange, disabled }: DeliveryModeSelectorProps) {
  const { data, loading, error } = useStoreDeliveryOptions(storeId)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Delivery Method</h3>
          <p className="text-sm text-muted-foreground">
            Loading delivery options...
          </p>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Delivery Method</h3>
          <p className="text-sm text-red-600">
            Unable to load delivery options. Please try again.
          </p>
        </div>
      </div>
    )
  }

  // Always include PICKUP as it's always available
  const deliveryModes: Array<StoreDeliveryOption & { label: string; description: string; icon: string; badge?: string }> = [
    {
      deliveryMode: 'PICKUP',
      enabled: true,
      feeDisclosure: 'Free',
      externalInfoUrl: null,
      sortOrder: 0,
      ...DELIVERY_MODE_CONFIG.PICKUP,
    },
    ...(data?.deliveryOptions || [])
      .filter((option: StoreDeliveryOption) => option.enabled)
      .map((option: StoreDeliveryOption) => ({
        ...option,
        ...DELIVERY_MODE_CONFIG[option.deliveryMode],
      }))
  ].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Delivery Method</h3>
        <p className="text-sm text-muted-foreground">
          Choose how you'd like to receive your order
        </p>
      </div>

      <div className="grid gap-3">
        {deliveryModes.map((mode) => (
          <Card
            key={mode.deliveryMode}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              value === mode.deliveryMode
                ? 'ring-2 ring-primary ring-offset-2 bg-primary/5'
                : 'hover:border-primary/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onChange(mode.deliveryMode as DeliveryMode)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{mode.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{mode.label}</h4>
                    {mode.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {mode.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {mode.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mode.feeDisclosure}
                  </p>
                  {mode.externalInfoUrl && (
                    <a 
                      href={mode.externalInfoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Learn more about DoorDash
                    </a>
                  )}
                </div>
                {value === mode.deliveryMode && (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
