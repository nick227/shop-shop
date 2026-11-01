import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VendorStore } from '@shared/hooks/hooks/vendor'
import { VendorActiveStoreProvider } from './VendorActiveStoreContext'
import { StoreIdentityMenu } from './StoreIdentityMenu'
import { VendorHomeRedirect } from './VendorHomeRedirect'

vi.mock('@shared/hooks/hooks/vendor', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shared/hooks/hooks/vendor')>()),
  usePendingOrderCounts: () => ({ data: { catering: 2 } }),
}))

const capabilityState = vi.hoisted(() => ({ canCreateStore: true }))
vi.mock('@features/account/useAccountCapabilities', () => ({ useAccountCapabilities: () => ({ capabilities: { canAccessVendorPortal: true, canCreateStore: capabilityState.canCreateStore } }) }))

vi.mock('sonner', () => ({ toast: vi.fn() }))

function store(id: string, name: string, overrides: Partial<VendorStore> = {}): VendorStore {
  return {
    id,
    name,
    isPublished: true,
    status: 'ACTIVE',
    addressCity: 'Oakland',
    addressState: 'CA',
    permissions: ['FULL_ACCESS'],
    isOwner: true,
    ...overrides,
  } as unknown as VendorStore
}

const tamales = store('tamales', "Rosa's Tamales")
const catering = store('catering', "Rosa's Catering", { isPublished: false })

function Where() {
  const location = useLocation()
  return <output aria-label="location">{location.pathname + location.search}</output>
}

function renderAt(path: string, stores: readonly VendorStore[], element = <StoreIdentityMenu />) {
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <VendorActiveStoreProvider stores={stores}>
            {element}
            <Where />
          </VendorActiveStoreProvider>
        ),
      },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
}

beforeEach(() => {
  localStorage.clear()
  capabilityState.canCreateStore = true
})

describe('StoreIdentityMenu', () => {
  it('does not offer store creation to invited team members', async () => {
    capabilityState.canCreateStore = false
    const user = userEvent.setup()
    renderAt('/vendor/tamales/orders', [store('tamales', "Rosa's Tamales", { isOwner: false, permissions: ['FULL_ACCESS'] })])
    await user.click(screen.getByRole('button', { name: /Rosa's Tamales/ }))
    expect(screen.queryByRole('menuitem', { name: /Add.*store/ })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'View storefront' })).toBeInTheDocument()
  })

  it('shows one store as an identity, with no picker', async () => {
    const user = userEvent.setup()
    renderAt('/vendor/tamales/orders', [tamales])

    await user.click(screen.getByRole('button', { name: /Rosa's Tamales, Open/ }))

    expect(screen.getByRole('menuitem', { name: 'Store settings' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Add another store' })).toBeInTheDocument()
    expect(screen.queryByText('Your stores')).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /All stores/ })).not.toBeInTheDocument()
  })

  it('switches stores and keeps the section you were in', async () => {
    const user = userEvent.setup()
    renderAt('/vendor/tamales/menu/items/item-9', [tamales, catering])

    await user.click(screen.getByRole('button', { name: /Switch store/ }))
    expect(screen.getByRole('menuitem', { name: /Rosa's Catering.*2 new/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'All stores' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Add a store' })).toBeInTheDocument()

    await user.click(screen.getByRole('menuitem', { name: /Rosa's Catering/ }))

    expect(screen.getByLabelText('location')).toHaveTextContent(/^\/vendor\/catering\/menu$/)
    expect(screen.getByRole('button', { name: /Rosa's Catering, Draft/ })).toBeInTheDocument()
  })

  it('keeps tab pages such as Bundles when switching', async () => {
    const user = userEvent.setup()
    renderAt('/vendor/tamales/menu/bundles', [tamales, catering])
    await user.click(screen.getByRole('button', { name: /Switch store/ }))
    await user.click(screen.getByRole('menuitem', { name: /Rosa's Catering/ }))
    expect(screen.getByLabelText('location')).toHaveTextContent(/^\/vendor\/catering\/menu\/bundles$/)
  })

  it('lands on Overview when the other store does not allow the current section', async () => {
    const user = userEvent.setup()
    const menuOnly = store('catering', "Rosa's Catering", { isOwner: false, permissions: ['VIEW_ITEMS'] })
    renderAt('/vendor/tamales/team', [tamales, menuOnly])

    await user.click(screen.getByRole('button', { name: /Switch store/ }))
    await user.click(screen.getByRole('menuitem', { name: /Rosa's Catering/ }))

    expect(screen.getByLabelText('location')).toHaveTextContent(/^\/vendor\/catering$/)
  })

  it('hides settings from members who are not the owner', async () => {
    const user = userEvent.setup()
    renderAt('/vendor/tamales', [store('tamales', "Rosa's Tamales", { isOwner: false, permissions: ['FULL_ACCESS'] })])
    await user.click(screen.getByRole('button', { name: /Rosa's Tamales/ }))
    expect(screen.queryByRole('menuitem', { name: 'Store settings' })).not.toBeInTheDocument()
  })
})

describe('VendorHomeRedirect', () => {
  it('opens the store you last worked in', () => {
    localStorage.setItem('vendor:lastStoreId', 'catering')
    renderAt('/vendor', [tamales, catering], <VendorHomeRedirect />)
    expect(screen.getByLabelText('location')).toHaveTextContent(/^\/vendor\/catering$/)
  })

  it('sends someone without a store to create one', () => {
    renderAt('/vendor', [], <VendorHomeRedirect />)
    expect(screen.getByLabelText('location')).toHaveTextContent('/vendor/new')
  })
})
