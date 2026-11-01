import { render, screen } from '@testing-library/react'
import { Outlet, RouterProvider, createMemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VendorStore } from '@shared/hooks/hooks/vendor'
import { storeIdFromPath, vendorPaths, withStore } from '@shared/lib/utils/navigation/vendorPaths'
import { VendorActiveStoreProvider } from './VendorActiveStoreContext'
import { LegacyScopedRedirect, LegacyStorePathRedirect, RequireAccess, StoreRoute, legacyStorePath } from './StoreRoute'
import { canAccess } from './storeAccess'

vi.mock('sonner', () => ({ toast: vi.fn() }))

function store(id: string, overrides: Partial<VendorStore> = {}): VendorStore {
  return { id, name: id, isPublished: true, status: 'ACTIVE', permissions: ['FULL_ACCESS'], isOwner: true, ...overrides } as unknown as VendorStore
}

function Where() {
  const location = useLocation()
  return <output aria-label="location">{location.pathname + location.search}</output>
}

function renderRoutes(path: string, stores: readonly VendorStore[]) {
  const router = createMemoryRouter(
    [
      {
        path: '/vendor',
        element: (
          <VendorActiveStoreProvider stores={stores}>
            <Outlet />
            <Where />
          </VendorActiveStoreProvider>
        ),
        children: [
          { path: 'orders', element: <LegacyScopedRedirect section="orders" /> },
          { path: 'stores/:storeId/*', element: <LegacyStorePathRedirect /> },
          {
            path: ':storeId',
            element: <StoreRoute />,
            children: [
              { index: true, element: <p>Overview page</p> },
              { path: 'orders', element: <RequireAccess need="VIEW_ORDERS" label="Orders"><p>Orders page</p></RequireAccess> },
              { path: 'settings', element: <RequireAccess need="owner" label="Settings"><p>Settings page</p></RequireAccess> },
              { path: 'menu/items/:itemId', element: <p>Item page</p> },
            ],
          },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
}

beforeEach(() => localStorage.clear())

describe('vendor paths', () => {
  it('reads the store id only from store pages', () => {
    expect(storeIdFromPath('/vendor/abc/menu')).toBe('abc')
    expect(storeIdFromPath('/vendor/stores')).toBe('')
    expect(storeIdFromPath('/vendor/new')).toBe('')
    expect(withStore('/vendor/abc/menu/bundles', 'xyz')).toBe('/vendor/xyz/menu/bundles')
  })

  it('maps every old store URL to its new place', () => {
    expect(legacyStorePath('s', 'edit')).toBe(vendorPaths.settings('s'))
    expect(legacyStorePath('s', 'items')).toBe('/vendor/s/menu')
    expect(legacyStorePath('s', 'items/new')).toBe('/vendor/s/menu/items/new')
    expect(legacyStorePath('s', 'items/i1/edit')).toBe('/vendor/s/menu/items/i1')
    expect(legacyStorePath('s', 'bundles')).toBe('/vendor/s/menu/bundles')
    expect(legacyStorePath('s', 'bundles/new')).toBe('/vendor/s/menu/bundles/new')
    expect(legacyStorePath('s', 'bundles/b1/edit')).toBe('/vendor/s/menu/bundles/b1')
    expect(legacyStorePath('s', 'river')).toBe('/vendor/s/river')
    expect(legacyStorePath('s', 'team')).toBe('/vendor/s/team')
  })
})

describe('canAccess', () => {
  it('gives owners everything and members only what they hold', () => {
    expect(canAccess(store('a'), 'owner')).toBe(true)
    const manager = store('a', { isOwner: false, permissions: ['FULL_ACCESS'] })
    expect(canAccess(manager, 'VIEW_ORDERS')).toBe(true)
    expect(canAccess(manager, 'owner')).toBe(false)
    const editor = store('a', { isOwner: false, permissions: ['VIEW_ITEMS', 'MANAGE_ITEMS'] })
    expect(canAccess(editor, 'MANAGE_ITEMS')).toBe(true)
    expect(canAccess(editor, 'VIEW_ORDERS')).toBe(false)
  })
})

describe('store routes', () => {
  it('redirects old query-string URLs and keeps other params', () => {
    renderRoutes('/vendor/orders?storeId=b&status=PLACED', [store('a'), store('b')])
    expect(screen.getByText('Orders page')).toBeInTheDocument()
    expect(screen.getByLabelText('location')).toHaveTextContent('/vendor/b/orders?status=PLACED')
  })

  it('redirects old store paths', () => {
    renderRoutes('/vendor/stores/a/items/i1/edit?storeId=a', [store('a')])
    expect(screen.getByText('Item page')).toBeInTheDocument()
    expect(screen.getByLabelText('location')).toHaveTextContent(/^\/vendor\/a\/menu\/items\/i1$/)
  })

  it('refuses a store you do not belong to instead of showing another one', () => {
    renderRoutes('/vendor/someone-else/orders', [store('a')])
    expect(screen.getByRole('heading', { name: /don’t have access to this store/ })).toBeInTheDocument()
    expect(screen.queryByText('Orders page')).not.toBeInTheDocument()
  })

  it('sends members without permission to Overview', () => {
    renderRoutes('/vendor/a/settings', [store('a', { isOwner: false, permissions: ['FULL_ACCESS'] })])
    expect(screen.getByText('Overview page')).toBeInTheDocument()
    expect(screen.getByLabelText('location')).toHaveTextContent(/^\/vendor\/a$/)
  })
})
