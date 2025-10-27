/**
 * PendingBadge - Animated badge showing pending item count;
 * Used in vendor and customer layouts;
 * Migrated to Tailwind (removed CSS module)
 */

import { cn } from '@utils/cn'

export interface PendingBadgeProps {
  count: number;
  label?: string;
  onClick?: () => void;
  className?: string;
}

export function PendingBadge({
  count,
  label = 'Pending',
  onClick,
  className}: PendingBadgeProps) {
  if (count <= 0) return undefined;
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700',
        onClick && 'tap-scale cursor-pointer hover:bg-red-100 transition-colors',
        className
      )}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <span className="text-sm leading-none">🔴</span>
      <span className="text-sm font-medium">
        {count} {label}
      </span>
    </Component>
  )
}

