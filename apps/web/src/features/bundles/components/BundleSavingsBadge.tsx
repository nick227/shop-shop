/**
 * Bundle Savings Badge Component
 * Displays bundle savings with visual emphasis
 */
import React from 'react'
import { Badge } from '@components/ui/Badge'

interface BundleSavingsBadgeProps {
  savings: number
  savingsPercent: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning'
  className?: string
}

export function BundleSavingsBadge({
  savings,
  savingsPercent,
  label,
  size = 'md',
  variant = 'success',
  className = ''
}: BundleSavingsBadgeProps) {
  const displayLabel = label || `Save $${savings.toFixed(2)}`
  const percentText = `${savingsPercent.toFixed(1)}%`

  return (
    <div className={`bundle-savings-badge ${className}`}>
      <Badge 
        variant={variant} 
        size={size}
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
