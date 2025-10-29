import { Loader2 } from 'lucide-react'
import { cn } from '@utils/cn'

/**
 * LoadingState - Modern loading state with spinner;
 */

export interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large'
  className?: string;
}

const sizeMap = {
  small: 'h-4 w-4',
  medium: 'h-8 w-8',
  large: 'h-12 w-12'}

export function LoadingState({ 
  message = 'Loading...', 
  size = 'medium',
  className
}: LoadingStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <Loader2 className={cn(sizeMap[size], 'animate-spin text-primary mb-4')} />
      {message && (
        <p className="text-muted-foreground">{message}</p>
      )}
    </div>
  )
}

