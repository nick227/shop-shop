/**
 * PageHeader - Reusable page header for vendor pages;
 */
import type { ReactNode } from 'react'
import { Button } from '@ui'
import { styles } from '@utils/tailwind-classes'

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  backLink?: {
    label: string;
    onClick: () => void;
  }
  actions?: ReactNode;
}

export function PageHeader({ 
  title, 
  subtitle, 
  breadcrumbs,
  backLink, 
  actions
}: PageHeaderProps) {
  return (
    <div className={styles.header}>
      {breadcrumbs && (
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-foreground">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}
      <div className={styles.headerContent}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      <div className={styles.headerActions}>
        {backLink && (
          <Button variant="ghost" onClick={backLink.onClick}>
            ← {backLink.label}
          </Button>
        )}
        {actions}
      </div>
    </div>
  )
}

