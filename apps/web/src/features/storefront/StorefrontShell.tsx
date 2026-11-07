/**
 * Providers, brand theme, page column, and the item sheet.
 * Children are the page order from `Storefront`.
 */
import type { ReactNode } from 'react'
import { cn } from '@shared/lib/cn'
import { StorefrontProvider } from './context'
import { EditorChromeProvider } from './parts'
import { ItemSheet } from './components/ItemSheet'
import type { StorefrontPage } from './useStorefrontPage'
import './storefront.css'

export function StorefrontShell({ page, className, children }: {
  readonly page: StorefrontPage
  readonly className?: string
  readonly children: ReactNode
}) {
  const { onEditSection, highlight = null, onToggleSection } = page.props
  return (
    <EditorChromeProvider value={{ onEdit: onEditSection, highlight, onToggle: onToggleSection }}>
      <StorefrontProvider value={page.actions}>
        <div className={cn('sf-root', page.theme.className, className)} style={page.theme.style}>
          <div className="sf-page mx-auto w-full max-w-[92rem] px-[clamp(1rem,2.4vw,2.5rem)] pb-16 pt-5">
            {children}
          </div>
          {/* Live: `?item=`. Preview: local, so the editor address stays put. */}
          <ItemSheet item={page.sheetItem} onClose={page.closeItem} />
        </div>
      </StorefrontProvider>
    </EditorChromeProvider>
  )
}
