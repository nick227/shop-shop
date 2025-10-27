/**
 * Bundle Savings Badge Component
 * Displays bundle savings with visual emphasis
 */
import React from 'react'
import { Badge } from '../../../components/ui/Badge'

interface BundleSavingsBadgeProps {
  readonly savings: number
  readonly savingsPercent: number
  readonly label?: string
  readonly size?: 'sm' | 'md' | 'lg'
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
    <div className={`bundle-savings-badge ${className}`}>
      <Badge 
        variant={variant} 
        className="bundle-savings-badge__badge"
      >
        <span className="bundle-savings-badge__text">
          {displayLabel}
        </span>
        <span className="bundle-savings-badge__percent">
          ({percentText})
        </span>
      </Badge>
    </div>
  )
}

// Bundle Savings Badge Styles
export const bundleSavingsBadgeStyles = `
.bundle-savings-badge {
  display: inline-flex;
}

.bundle-savings-badge__badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
  animation: pulse 2s infinite;
}

.bundle-savings-badge__text {
  font-weight: 700;
}

.bundle-savings-badge__percent {
  font-size: 0.875em;
  opacity: 0.9;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
`
