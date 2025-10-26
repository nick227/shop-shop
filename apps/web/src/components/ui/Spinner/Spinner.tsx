/**
 * Spinner Component - Loading indicator;
 * Migrated to Tailwind (removed CSS module)
 */
import { Loader2 } from 'lucide-react'
import { cn } from '@utils/cn'

export interface SpinnerProps {
  size?: 'small' | 'medium' | 'large'
  className?: string;
}

const sizeClasses = {
  small: 'h-4 w-4',
  medium: 'h-8 w-8',
  large: 'h-12 w-12'}

export function Spinner({ size = 'medium', className }: SpinnerProps) {
  return (
    <div
      className={cn('inline-flex items-center justify-center', className)}
      role="status"
      aria-label="Loading"
    >
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

