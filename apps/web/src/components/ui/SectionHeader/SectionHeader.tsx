/**
 * SectionHeader - Reusable section header with optional action button;
 * Used across dashboard and management pages;
 * Migrated to Tailwind (removed CSS module)
 */

import { Button } from '../Button'
import { cn } from '@utils/cn'

export interface SectionHeaderProps {
  title: string;
  icon?: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost'
  }
  className?: string;
}

export function SectionHeader({
  title,
  icon,
  subtitle,
  action,
  className}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-6', className)}>
      <div className="flex-1">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          {icon && <span className="text-3xl">{icon}</span>}
          {title}
        </h2>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && (
        <Button
          variant={action.variant || 'ghost'}
          size="small"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

