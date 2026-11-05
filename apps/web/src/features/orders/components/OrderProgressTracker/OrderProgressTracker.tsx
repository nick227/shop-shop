export interface OrderProgressTrackerProps {
  currentStatus: string
  isCanceled?: boolean
  deliveryType?: string
}
export function OrderProgressTracker({
  currentStatus,
  isCanceled = false,
  deliveryType = 'DELIVERY',
}: OrderProgressTrackerProps) {
  const steps =
    deliveryType === 'PICKUP'
      ? [
          ['PLACED', 'Placed'],
          ['ACCEPTED', 'Accepted'],
          ['PREPARING', 'Preparing'],
          ['READY', 'Ready'],
          ['COMPLETED', 'Collected'],
        ]
      : [
          ['PLACED', 'Placed'],
          ['ACCEPTED', 'Accepted'],
          ['PREPARING', 'Preparing'],
          ['READY', 'Ready'],
          ['OUT_FOR_DELIVERY', 'On the way'],
          ['DELIVERED', 'Delivered'],
        ]
  const current = steps.findIndex(([status]) => status === currentStatus)
  if (isCanceled)
    return <p className="rounded-lg bg-muted p-4 text-sm font-medium">Order canceled</p>
  return (
    <ol className="flex py-4" aria-label="Order progress">
      {steps.map(([status, label], index) => (
        <li
          key={status}
          aria-current={index === current ? 'step' : undefined}
          className="relative flex min-w-0 flex-1 flex-col items-center gap-2 text-center"
        >
          {index < steps.length - 1 && (
            <div
              className={`absolute left-1/2 top-4 h-px w-full ${index < current ? 'bg-primary' : 'bg-border'}`}
            />
          )}
          <span
            className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${index <= current ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            {index < current ? '✓' : index + 1}
          </span>
          <span
            className={`text-[10px] sm:text-xs ${index === current ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
          >
            {label}
          </span>
        </li>
      ))}
    </ol>
  )
}
