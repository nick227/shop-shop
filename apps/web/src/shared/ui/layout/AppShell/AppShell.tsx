/* eslint-disable react-refresh/only-export-components -- shell + its hook belong together */
/**
 * AppShell — sidebar + top bar shell shared by signed-in workspaces.
 * The same sidebar content renders in the rail/expanded sidebar and in the phone drawer.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import './app-shell.css'

interface AppShellContextValue {
  readonly collapsed: boolean
  readonly toggleCollapsed: () => void
  readonly inDrawer: boolean
}

// eslint-disable-next-line @typescript-eslint/no-empty-function -- default for consumers outside a shell
const noop = () => {}

const AppShellContext = createContext<AppShellContextValue>({
  collapsed: false,
  toggleCollapsed: noop,
  inDrawer: false,
})

export function useAppShell(): AppShellContextValue {
  return useContext(AppShellContext)
}

function readCollapsed(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

interface AppShellProps {
  /** Sidebar content. Wrap text that hides in the rail in `.app-shell-label`. */
  readonly sidebar: ReactNode
  /** Top bar content to the right of the phone menu button. */
  readonly topBar: ReactNode
  readonly navLabel: string
  /** localStorage key that remembers a collapsed sidebar. */
  readonly storageKey: string
  readonly children: ReactNode
}

export function AppShell({ sidebar, topBar, navLabel, storageKey, children }: AppShellProps) {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(() => readCollapsed(storageKey))
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(storageKey, String(next))
      } catch {
        // Storage blocked; the choice lasts for this visit.
      }
      return next
    })
  }, [storageKey])

  const sidebarValue = useMemo(
    () => ({ collapsed, toggleCollapsed, inDrawer: false }),
    [collapsed, toggleCollapsed],
  )
  const drawerValue = useMemo(
    () => ({ collapsed: false, toggleCollapsed, inDrawer: true }),
    [toggleCollapsed],
  )

  return (
    <div className="app-shell" data-collapsed={collapsed}>
      <AppShellContext.Provider value={sidebarValue}>
        <nav className="app-shell-sidebar" aria-label={navLabel}>
          {sidebar}
        </nav>
      </AppShellContext.Provider>

      <div className="app-shell-main">
        <header className="app-shell-topbar">
          <button
            type="button"
            className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted lg:hidden"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          {topBar}
        </header>
        {children}
      </div>

      {drawerOpen ? (
        <div className="app-shell-drawer-layer">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <AppShellContext.Provider value={drawerValue}>
            <nav className="app-shell-drawer" aria-label={navLabel}>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
              {sidebar}
            </nav>
          </AppShellContext.Provider>
        </div>
      ) : null}
    </div>
  )
}
