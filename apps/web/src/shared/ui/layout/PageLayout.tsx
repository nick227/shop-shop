import { ReactNode } from 'react'
import { cn } from '@shared/lib/cn'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("min-h-screen bg-background text-foreground px-4 py-5 pb-24", className)}>
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-5">
        {children}
      </div>
    </div>
  )
}

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  backButton?: ReactNode
  breadcrumbs?: Breadcrumb[]
  className?: string
}

export function PageHeader({ title, description, actions, backButton, breadcrumbs, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col justify-start items-start gap-3 w-full", className)}>
      {breadcrumbs && (
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto no-scrollbar py-0.5">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-1.5 shrink-0">
              {index > 0 && <span className="text-muted-foreground/40">/</span>}
              {crumb.href ? (
                <a 
                  href={crumb.href} 
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}
      <div className={cn("flex flex-col sm:flex-row justify-between items-start gap-3 w-full")}>
        <div className="flex-1 flex flex-col items-start gap-1">
          {backButton}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

interface SectionHeaderProps {
  title: string
  action?: ReactNode
  className?: string
}

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex justify-between items-center", className)}>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {action}
    </div>
  )
}
