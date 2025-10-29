/**
 * StatCard - Reusable stat display component;
 * Used across vendor and customer dashboards;
 * Migrated to Tailwind (removed CSS module)
 */

import { Card } from '../Card'
import { cn } from '@utils/cn'

export interface StatCardProps {
  icon?: string;
  value: string | number;
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  className?: string;
  onClick?: () => void;
}

const variantClasses = {
  default: 'border-border',
  primary: 'border-primary bg-primary/5',
  success: 'border-green-500 bg-green-50',
  warning: 'border-yellow-500 bg-yellow-50',
  error: 'border-red-500 bg-red-50'
}

export function StatCard({
  icon,
  value,
  label,
  variant = 'default',
  className,
  onClick}: StatCardProps) {
  return (
    <Card
      className={cn(
        'p-6 text-center tap-scale transition-all',
        variantClasses[variant],
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      {icon && <div className="text-4xl mb-2">{icon}</div>}
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground font-medium">{label}</div>
    </Card>
  )
}

