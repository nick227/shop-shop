import { forwardRef } from 'react'
import { cn } from '@shared/lib/cn'
import { useHaptics } from '@shared/hooks/useHaptics'

export interface ActionCardProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  checked?: boolean
  disabled?: boolean
}

export const ActionCard = forwardRef<HTMLLabelElement, ActionCardProps>(
  ({ className, checked, disabled, children, onClick, ...props }, ref) => {
    const haptics = useHaptics()

    return (
      <label
        ref={ref}
        onClick={(e) => {
          if (!disabled) {
            haptics.light()
            onClick?.(e)
          }
        }}
        className={cn(
          'flex items-start gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm transition-all',
          disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer hover:border-primary/50 active:scale-[0.98]',
          checked ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border',
          className
        )}
        {...props}
      >
        {children}
      </label>
    )
  }
)
ActionCard.displayName = 'ActionCard'
