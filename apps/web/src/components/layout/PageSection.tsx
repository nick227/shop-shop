import React from 'react'
import { cn } from '@shared/lib/cn'

export interface PageSectionProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

export const PageSection: React.FC<PageSectionProps> = ({ title, subtitle, children, className }) => (
  <section className={cn('space-y-4', className)}>
    {(title || subtitle) && (
      <div>
        {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    )}
    {children}
  </section>
)

export default PageSection
