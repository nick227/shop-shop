import { AlertCircle } from 'lucide-react'
import { Button } from '../Button'
import { cn } from '@shared/lib/cn'

/**
 * ErrorState - Modern error state with Tailwind;
 */

export interface ErrorStateProps {
  title?: string;
  message: string;
  error?: Error;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ 
  title = 'Something went wrong', 
  message, 
  error,
  onRetry, 
  className
}: ErrorStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      
      <p className="text-muted-foreground mb-2 max-w-sm">
        {message}
      </p>

      {error && (
        <p className="text-sm text-destructive/80 mb-6 font-mono max-w-md">
          {error.message}
        </p>
      )}
      
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  )
}

