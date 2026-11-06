import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import './navigation.css'

export interface Crumb {
  readonly key: string
  readonly label: ReactNode
  /** Omitted for the current page. */
  readonly to?: LinkProps['to']
  /** Extra control after the label, such as a clear button for a search term. */
  readonly after?: ReactNode
}

/** The one breadcrumb trail used on discovery pages and business pages. The last crumb is the current page. */
export function Breadcrumbs({ label, crumbs, className }: { readonly label: string; readonly crumbs: readonly Crumb[]; readonly className?: string }) {
  return (
    <nav aria-label={label} className={['crumbs', className].filter(Boolean).join(' ')}>
      <ol>
        {crumbs.map((crumb, index) => {
          const current = index === crumbs.length - 1
          return (
            <li key={crumb.key}>
              {crumb.to && !current ? <Link to={crumb.to}>{crumb.label}</Link> : <span aria-current={current ? 'page' : undefined}>{crumb.label}</span>}
              {crumb.after}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
