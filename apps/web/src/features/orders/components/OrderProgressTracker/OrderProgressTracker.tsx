/**
 * OrderProgressTracker - Visual progress indicator for order status
 * Extracted from OrderTrackingPage for SRP compliance
 */
// Keep timeline labels customer-friendly. Backend may emit COMPLETED; treat it as DELIVERED.
const ORDER_STATUS_STEPS = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERED'] as const

export interface OrderProgressTrackerProps {
  currentStatus: string
  /** Whether order is canceled */
  isCanceled?: boolean
}

export function OrderProgressTracker({ currentStatus, isCanceled = false }: OrderProgressTrackerProps) {
  const normalizedStatus = currentStatus === 'COMPLETED' ? 'DELIVERED' : currentStatus
  const currentStepIndex = ORDER_STATUS_STEPS.indexOf(normalizedStatus as any)
  
  if (isCanceled) {
    return (
      <div className="text-center py-8">
        <span className="text-6xl mb-3 block">❌</span>
        <p className="text-xl font-semibold text-gray-700">Order Canceled</p>
        <p className="text-sm text-gray-500 mt-2">This order has been canceled</p>
      </div>
    )
  }

  return (
    <div className="flex justify-between items-start py-6 relative">
      {ORDER_STATUS_STEPS.map((step, index) => {
        const isActive = index <= currentStepIndex
        const isCurrent = index === currentStepIndex
        
        return (
          <div key={step} className="flex flex-col items-center gap-2 flex-1 relative z-10">
            {/* Progress Dot */}
            <div 
              className={
                'w-12 h-12 rounded-full border-3 flex items-center justify-center text-base font-bold transition-all duration-300 ' +
                (isActive 
                  ? 'bg-blue-500 border-blue-500 text-white scale-110' 
                  : 'bg-gray-100 border-gray-300 text-gray-400'
                ) +
                (isCurrent ? ' ring-4 ring-blue-200 shadow-lg' : '')
              }
            >
              {isActive ? '✓' : index + 1}
            </div>
            
            {/* Step Label */}
            <div 
              className={
                'text-xs font-medium text-center transition-all duration-300 ' +
                (isActive ? 'text-gray-900' : 'text-gray-400') +
                (isCurrent ? ' font-bold' : '')
              }
            >
              {step === 'PLACED' && '🔔 Placed'}
              {step === 'ACCEPTED' && '✅ Accepted'}
              {step === 'PREPARING' && '👨‍🍳 Preparing'}
              {step === 'READY' && '🎉 Ready'}
              {step === 'DELIVERED' && '✅ Delivered'}
            </div>
            
            {/* Progress Line */}
            {index < ORDER_STATUS_STEPS.length - 1 && (
              <div 
                className={
                  'absolute top-6 left-[50%] w-full h-1 -z-10 transition-all duration-500 ' +
                  (isActive ? 'bg-blue-500' : 'bg-gray-200')
                }
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
