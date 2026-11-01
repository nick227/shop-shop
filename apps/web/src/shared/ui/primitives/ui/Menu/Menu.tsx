/* eslint-disable react-refresh/only-export-components -- menu parts share one context */
/**
 * Menu — button-triggered dropdown with arrow-key navigation.
 * The panel renders in a portal so it isn't clipped by a collapsed sidebar.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { cn } from '@shared/lib/cn'

// eslint-disable-next-line @typescript-eslint/no-empty-function -- items outside a menu close nothing
const MenuCloseContext = createContext<() => void>(() => {})

interface TriggerProps {
  readonly ref: React.RefObject<HTMLButtonElement>
  readonly 'aria-haspopup': 'menu'
  readonly 'aria-expanded': boolean
  readonly 'aria-controls': string
  readonly onClick: () => void
}

interface MenuProps {
  readonly trigger: (props: TriggerProps) => ReactNode
  readonly align?: 'start' | 'end'
  readonly label: string
  readonly className?: string
  readonly children: ReactNode
}

const ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])'

export function Menu({ trigger, align = 'start', label, className, children }: MenuProps) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const id = useId()

  const close = useCallback((restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }, [])

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setStyle(
      align === 'end'
        ? { top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) }
        : { top: rect.bottom + 6, left: Math.max(8, rect.left) },
    )
    panelRef.current?.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus()
  }, [open, align])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      close(false)
    }
    const onResize = () => close(false)
    document.addEventListener('mousedown', onPointer)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      window.removeEventListener('resize', onResize)
    }
  }, [open, close])

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = [...(panelRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? [])]
    const index = items.indexOf(document.activeElement as HTMLElement)
    const focusAt = (next: number) => {
      event.preventDefault()
      items[(next + items.length) % items.length]?.focus()
    }
    switch (event.key) {
      case 'Escape': {
        event.preventDefault()
        close()
        break
      }
      case 'ArrowDown': {
        focusAt(index + 1)
        break
      }
      case 'ArrowUp': {
        focusAt(index - 1)
        break
      }
      case 'Home': {
        focusAt(0)
        break
      }
      case 'End': {
        focusAt(-1)
        break
      }
      case 'Tab': {
        close(false)
        break
      }
      default:
    }
  }

  return (
    <>
      {trigger({
        ref: triggerRef,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': id,
        onClick: () => setOpen((prev) => !prev),
      })}
      {open
        ? createPortal(
            <MenuCloseContext.Provider value={() => close(false)}>
              <div
                ref={panelRef}
                id={id}
                role="menu"
                tabIndex={-1}
                aria-label={label}
                onKeyDown={onKeyDown}
                style={style}
                className={cn(
                  'fixed z-[60] w-72 max-w-[calc(100vw-16px)] overflow-hidden rounded-xl border border-border bg-popover py-1 text-sm text-popover-foreground shadow-lg',
                  className,
                )}
              >
                {children}
              </div>
            </MenuCloseContext.Provider>,
            document.body,
          )
        : null}
    </>
  )
}

const ITEM_CLASS =
  'flex min-h-10 w-full items-center gap-3 px-4 py-2 text-left outline-none hover:bg-muted focus-visible:bg-muted'

interface MenuItemProps {
  readonly to?: string
  readonly href?: string
  readonly onSelect?: () => void
  readonly icon?: ReactNode
  readonly end?: ReactNode
  readonly className?: string
  readonly children: ReactNode
}

export function MenuItem({ to, href, onSelect, icon, end, className, children }: MenuItemProps) {
  const close = useContext(MenuCloseContext)
  const content = (
    <>
      {icon ? <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground">{icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {end ? <span className="flex shrink-0 items-center gap-2 text-muted-foreground">{end}</span> : null}
    </>
  )
  const handle = () => {
    close()
    onSelect?.()
  }

  if (to) {
    return (
      <Link role="menuitem" tabIndex={-1} to={to} onClick={handle} className={cn(ITEM_CLASS, className)}>
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a role="menuitem" tabIndex={-1} href={href} target="_blank" rel="noopener noreferrer" onClick={handle} className={cn(ITEM_CLASS, className)}>
        {content}
      </a>
    )
  }
  return (
    <button role="menuitem" tabIndex={-1} type="button" onClick={handle} className={cn(ITEM_CLASS, className)}>
      {content}
    </button>
  )
}

export function MenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-border" />
}

export function MenuLabel({ children }: { readonly children: ReactNode }) {
  return <div className="px-4 pb-1 pt-2 text-xs font-medium text-muted-foreground">{children}</div>
}
