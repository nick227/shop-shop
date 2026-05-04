import React, { type ReactNode } from 'react'
import { type LucideIcon, Inbox } from 'lucide-react'
import { cn } from '@shared/lib/cn'

/**
 * EmptyState — Unified empty/zero-state component.
 * Supports both the legacy API (message + action object) and the
 * newer API (description + action as ReactNode) for backward compat.
 */

export interface EmptyStateProps {
  title?: string
  /** Legacy prop name — alias for description */
  message?: string
  description?: string
  /** Lucide icon component (preferred) or arbitrary ReactNode */
  icon?: LucideIcon | ReactNode
  /** ReactNode action (new) or legacy { label, onClick } object */
  action?: ReactNode | { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({
  title,
  message,
  description,
  icon: IconProp,
  action,
  className,
}: EmptyStateProps) {
  const displayText = description || message

  // Resolve icon — either a Lucide component or raw ReactNode
  const renderIcon = () => {
    if (!IconProp) return <Inbox className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
    if (React.isValidElement(IconProp)) return IconProp

    // Lucide exports are often forwardRef objects (not plain functions), so treat "object" as a component type.
    if (typeof IconProp === 'function' || typeof IconProp === 'object') {
      const Icon = IconProp as LucideIcon
      return React.createElement(Icon, { className: 'h-10 w-10 text-muted-foreground/40', strokeWidth: 1.5 })
    }

    return null
  }

  // Resolve action — either ReactNode or legacy { label, onClick }
  const renderAction = () => {
    if (!action) return null
    if (React.isValidElement(action)) return action
    if (typeof action === 'object' && 'label' in (action as any) && 'onClick' in (action as any)) {
      const legacy = action as { label: string; onClick: () => void }
      return (
        <button
          onClick={legacy.onClick}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium min-h-[44px] px-4 py-2 text-base bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
        >
          {legacy.label}
        </button>
      )
    }
    // Non-element objects are not valid React children.
    if (typeof action === 'object') return null
    return action
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl border border-dashed border-border bg-card',
      className
    )}>
      <div className="mb-4">{renderIcon()}</div>

      {title && (
        <h3 className="text-lg font-semibold tracking-tight mb-1">{title}</h3>
      )}

      {displayText && (
        <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
          {displayText}
        </p>
      )}

      {renderAction()}
    </div>
  )
}
