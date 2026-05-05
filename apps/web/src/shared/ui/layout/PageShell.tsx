import type { PropsWithChildren, ReactNode } from 'react'
import { cn } from '@shared/lib/cn'

export const PAGE_SHELL_MAX_WIDTH_CLASS = 'max-w-7xl'
export const PAGE_SHELL_CONTAINER_CLASS = 'mx-auto w-full px-4 md:px-6'
export const PAGE_SHELL_CONTENT_SPACING_CLASS = 'py-5 md:py-6'

interface PageShellProps extends PropsWithChildren {
  readonly header?: ReactNode
  readonly footer?: ReactNode
  readonly className?: string
  readonly containerClassName?: string
  readonly contentClassName?: string
}

/**
 * Milestone 0 contract primitive.
 * New/updated pages should compose around this shell contract.
 */
export function PageShell({
  header,
  footer,
  className,
  containerClassName,
  contentClassName,
  children,
}: PageShellProps) {
  return (
    <div className={cn('min-h-screen bg-background text-foreground', className)}>
      {header}
      <main className={cn(PAGE_SHELL_CONTAINER_CLASS, PAGE_SHELL_MAX_WIDTH_CLASS, containerClassName)}>
        <div className={cn(PAGE_SHELL_CONTENT_SPACING_CLASS, contentClassName)}>{children}</div>
      </main>
      {footer}
    </div>
  )
}
