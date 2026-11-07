/**
 * One wrapper for every region of the page.
 * Live pages render the children. The editor adds an outline, Edit, and Hide.
 * A region whose children render nothing takes no space.
 */
import { createContext, useContext, type ReactNode } from 'react'
import type { StorefrontSection } from '@packages/shared/storefront'
import type { StorefrontPartKey } from './storefrontProps'

const PART_LABELS: Record<StorefrontPartKey, string> = {
  header: 'brand',
  ordering: 'ordering details',
  announcements: 'announcements',
  bundles: 'bundles',
  featured: 'featured products',
  categories: 'category tiles',
  menu: 'menu layout',
  about: 'business information',
  gallery: 'photos',
  updates: 'updates',
}

interface EditorChrome {
  readonly onEdit?: (key: StorefrontPartKey) => void
  readonly highlight: StorefrontPartKey | null
  readonly onToggle?: (key: Exclude<StorefrontSection, 'menu'>, visible: boolean) => void
}

const EditorChromeContext = createContext<EditorChrome>({ highlight: null })

export function EditorChromeProvider({ value, children }: { readonly value: EditorChrome; readonly children: ReactNode }) {
  return <EditorChromeContext.Provider value={value}>{children}</EditorChromeContext.Provider>
}

function useEditorChrome(): EditorChrome {
  return useContext(EditorChromeContext)
}

export function StorefrontPart({ part, onHide, children }: {
  readonly part: StorefrontPartKey
  readonly onHide?: () => void
  readonly children: ReactNode
}) {
  const { onEdit, highlight } = useEditorChrome()
  if (!onEdit) {
    return (
      <div data-storefront-section={part} className="empty:hidden">
        {children}
      </div>
    )
  }
  return (
    <div
      data-storefront-section={part}
      data-highlighted={highlight === part || undefined}
      className="sf-part group/part relative rounded-2xl has-[>div:empty]:hidden"
    >
      <div>{children}</div>
      <div className="sf-part-edit absolute right-2 top-2 z-30 flex gap-1">
        {onHide ? (
          <button
            type="button"
            onClick={onHide}
            className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground shadow-md ring-1 ring-border"
          >
            Hide
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onEdit(part)}
          className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background shadow-md"
        >
          Edit {PART_LABELS[part]}
        </button>
      </div>
    </div>
  )
}

/** A block the config can hide. Shoppers see nothing. The editor gets a bar to bring it back. */
export function StorefrontOptional({ part, visible, children }: {
  readonly part: Exclude<StorefrontSection, 'menu'>
  readonly visible: boolean
  readonly children: ReactNode
}) {
  const { onToggle } = useEditorChrome()
  if (visible) {
    return (
      <StorefrontPart part={part} onHide={onToggle ? () => onToggle(part, false) : undefined}>
        {children}
      </StorefrontPart>
    )
  }
  if (!onToggle) return null
  const label = PART_LABELS[part]
  return (
    <div
      data-storefront-section={part}
      className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-4 py-2 text-sm text-muted-foreground"
    >
      <span>
        <span className="font-medium text-foreground">{label[0].toUpperCase() + label.slice(1)}</span> · hidden from shoppers
      </span>
      <button type="button" onClick={() => onToggle(part, true)} className="text-sm font-semibold text-primary hover:underline">
        Show
      </button>
    </div>
  )
}
