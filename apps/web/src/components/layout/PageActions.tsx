import React from 'react'
import { cn } from '@shared/lib/cn'

export interface PageAction {
  id: string
  label: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  onClick?: () => void
  href?: string
  disabled?: boolean
}

export interface PageActionsProps {
  actions: PageAction[]
  className?: string
}

export const PageActions: React.FC<PageActionsProps> = ({ actions, className }) => (
  <div className={cn('flex items-center gap-2', className)}>
    {actions.map((action) => (
      <button
        key={action.id}
        onClick={action.onClick}
        disabled={action.disabled}
        className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
      >
        {action.label}
      </button>
    ))}
  </div>
)

export default PageActions
