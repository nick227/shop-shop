/**
 * DeliveryModeSelector - Clear delivery execution mode selection
 * 
 * Replaces simple PICKUP/DELIVERY toggle with explicit mode selection:
 * - PICKUP: Customer picks up order
 * - STORE_MANAGED_DELIVERY: Store handles delivery with own drivers
 * - PLATFORM_DRIVER: Platform assigns drivers
 * - THIRD_PARTY_PROVIDER: Third-party (DoorDash/Uber) handles delivery
 */

import React from 'react'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { Badge } from '@shared/ui/primitives'

export type DeliveryMode = 'PICKUP' | 'STORE_MANAGED_DELIVERY' | 'PLATFORM_DRIVER' | 'THIRD_PARTY_PROVIDER'

export interface DeliveryModeSelectorProps {
  value: DeliveryMode
  onChange: (mode: DeliveryMode) => void
  disabled?: boolean
}

const DELIVERY_MODES: Array<{
  value: DeliveryMode
  label: string
  description: string
  icon: string
  badge?: string
  disabled?: boolean
}> = [
  {
    value: 'PICKUP',
    label: 'Pickup',
    description: "I'll pick up my order",
    icon: '🏪',
  },
  {
    value: 'STORE_MANAGED_DELIVERY',
    label: 'Store Delivery',
    description: 'Restaurant delivers with their own drivers',
    icon: '🚗',
    badge: 'RECOMMENDED',
  },
  {
    value: 'PLATFORM_DRIVER',
    label: 'Platform Driver',
    description: 'Platform assigns a delivery driver',
    icon: '🛵',
  },
  {
    value: 'THIRD_PARTY_PROVIDER',
    label: 'Third-Party Delivery',
    description: 'DoorDash, Uber, or other delivery service',
    icon: '📦',
    disabled: true, // Disabled per requirements
  },
]

export function DeliveryModeSelector({ value, onChange, disabled }: DeliveryModeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Delivery Method</h3>
        <p className="text-sm text-muted-foreground">
          Choose how you'd like to receive your order
        </p>
      </div>

      <div className="grid gap-3">
        {DELIVERY_MODES.map((mode) => (
          <Card
            key={mode.value}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              value === mode.value
                ? 'ring-2 ring-primary ring-offset-2 bg-primary/5'
                : 'hover:border-primary/50'
            } ${disabled || mode.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && !mode.disabled && onChange(mode.value)}
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
                  {mode.disabled && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Coming soon
                    </p>
                  )}
                </div>
                {value === mode.value && (
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
