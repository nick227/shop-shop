import { Clock, Package, Truck, User } from 'lucide-react'

export interface WhatHappensNextProps {
  deliveryMode: 'PICKUP' | 'STORE_MANAGED_DELIVERY' | 'PLATFORM_DRIVER' | 'THIRD_PARTY_PROVIDER'
  className?: string
}

export function WhatHappensNext({ deliveryMode, className = '' }: WhatHappensNextProps) {
  const getWhatHappensNext = (mode: string) => {
    switch (mode) {
      case 'PICKUP':
        return {
          icon: Package,
          title: 'Pickup Order',
          description: 'The store will confirm your order and notify you when it\'s ready.',
          steps: [
            'Store confirms your order',
            'You get notified when ready',
            'Pick up your order at the store'
          ],
          color: 'green',
          gradient: 'from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          stepBg: 'bg-green-100',
          stepColor: 'text-green-700'
        }
      
      case 'STORE_MANAGED_DELIVERY':
        return {
          icon: Truck,
          title: 'Store Delivery',
          description: 'This store handles its own delivery. You\'ll receive updates as they prepare and send your order out.',
          steps: [
            'Store confirms and prepares your order',
            'Store assigns their delivery driver',
            'Driver delivers your order'
          ],
          color: 'blue',
          gradient: 'from-blue-50 to-indigo-50',
          borderColor: 'border-blue-200',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          stepBg: 'bg-blue-100',
          stepColor: 'text-blue-700'
        }
      
      case 'PLATFORM_DRIVER':
        return {
          icon: User,
          title: 'Platform Driver',
          description: 'A Shop Shop driver will be assigned after the store marks the order ready.',
          steps: [
            'Store prepares your order',
            'Shop Shop assigns a driver',
            'Driver delivers your order'
          ],
          color: 'purple',
          gradient: 'from-purple-50 to-violet-50',
          borderColor: 'border-purple-200',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600',
          stepBg: 'bg-purple-100',
          stepColor: 'text-purple-700'
        }
      
      case 'THIRD_PARTY_PROVIDER':
        return {
          icon: Package,
          title: 'Third-Party Delivery',
          description: 'A third-party delivery service will handle your order after preparation.',
          steps: [
            'Store prepares your order',
            'Third-party service picks up',
            'Delivery partner delivers your order'
          ],
          color: 'orange',
          gradient: 'from-orange-50 to-amber-50',
          borderColor: 'border-orange-200',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          stepBg: 'bg-orange-100',
          stepColor: 'text-orange-700'
        }
      
      default:
        return {
          icon: Package,
          title: 'Order Processing',
          description: 'Your order is being processed.',
          steps: [
            'Order confirmation',
            'Order preparation',
            'Order completion'
          ],
          color: 'gray',
          gradient: 'from-gray-50 to-slate-50',
          borderColor: 'border-gray-200',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          stepBg: 'bg-gray-100',
          stepColor: 'text-gray-700'
        }
    }
  }

  const config = getWhatHappensNext(deliveryMode)
  const Icon = config.icon

  return (
    <div className={`bg-gradient-to-r ${config.gradient} rounded-xl p-4 border ${config.borderColor} ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center shadow-sm`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-base">{config.title}</h4>
          <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{config.description}</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-700">What to expect:</p>
        <ol className="space-y-2">
          {config.steps.map((step, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-lg ${config.stepBg} ${config.stepColor} text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
                {index + 1}
              </div>
              <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
