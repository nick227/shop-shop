import { Inbox } from 'lucide-react'
import { Button } from '@shared/ui/primitives'
import { cn } from '@shared/lib/cn'

/**
 * EmptyState - Modern empty state with Tailwind;
 */

export interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  }
  className?: string;
}

export function EmptyState({ 
  title, 
  message, 
  icon, 
  action, 
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      {icon || <Inbox className="h-12 w-12 text-muted-foreground mb-4" />}
      
      {title && (
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
      )}
      
      <p className="text-muted-foreground mb-6 max-w-sm">
        {message}
      </p>
      
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  )
}

