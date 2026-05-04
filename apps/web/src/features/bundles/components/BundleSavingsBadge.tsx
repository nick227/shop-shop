/**
 * Bundle Savings Badge Component
 * Displays bundle savings with visual emphasis
 */
import { Badge } from '@shared/ui/primitives'
import { cn } from '@shared/lib/cn'

interface BundleSavingsBadgeProps {
  readonly savings: number
  readonly savingsPercent: number
  readonly label?: string
  readonly variant?: 'default' | 'success' | 'warning'
  readonly className?: string
}

export function BundleSavingsBadge({
  savings,
  savingsPercent,
  label,
  variant = 'success',
  className = ''
}: BundleSavingsBadgeProps) {
  const displayLabel = label ?? `Save $${savings.toFixed(2)}`
  const percentText = `${savingsPercent.toFixed(1)}%`

  return (
    <div className={cn("inline-flex", className)}>
      <Badge 
        variant={variant} 
        className="flex items-center gap-1 px-2.5 py-1 font-bold animate-pulse-subtle bg-success/15 text-success border-success/30"
      >
        <span>
          {displayLabel}
        </span>
        <span className="text-[0.85em] opacity-80 font-medium">
          ({percentText})
        </span>
      </Badge>
    </div>
  )
}

