/**
 * PageHeader - Reusable page header for vendor pages;
 */
import type { ReactNode } from 'react'
import { Button } from '@ui'
import { styles } from '@utils/tailwind-classes'

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: {
    label: string;
    onClick: () => void;
  }
  actions?: ReactNode;
}

export function PageHeader({ 
  title, 
  subtitle, 
  backLink, 
  actions
}: PageHeaderProps) {
  return (
    <div className={styles['header']}>
      <div className={styles['headerContent']}>
        <h1 className={styles['title']}>{title}</h1>
        {subtitle && <p className={styles['subtitle']}>{subtitle}</p>}
      </div>
      <div className={styles['headerActions']}>
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

