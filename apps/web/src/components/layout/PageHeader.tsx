import React from 'react'
import { cn } from '@shared/lib/cn'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  backButton?: { label: string; href?: string; onClick?: () => void }
  actions?: Array<{
    id: string
    label: string
    variant?: string
    onClick?: () => void
    href?: string
    disabled?: boolean
    loading?: boolean
  }>
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  className,
}) => (
  <div className={cn('flex items-center justify-between mb-6', className)}>
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
    {actions && actions.length > 0 && (
      <div className="flex gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>
    )}
  </div>
)

export default PageHeader
