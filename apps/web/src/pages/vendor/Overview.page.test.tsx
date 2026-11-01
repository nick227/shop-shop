import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { VendorStore } from '@shared/hooks/hooks/vendor'
import { VendorActiveStoreProvider } from '@layouts/VendorLayout/VendorActiveStoreContext'
import VendorOverviewPage from './Overview.page'

const mutate = vi.fn()
const setOrdering = vi.fn()
const now = new Date().toISOString()

vi.mock('@shared/hooks/hooks/vendor', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shared/hooks/hooks/vendor')>()),
  useVendorOrders: () => ({
    data: [
      { id: 'aaaaaa1', status: 'PLACED', total: 14, createdAt: now, items: [{ quantity: 3 }], user: { name: 'Maya L.' } },
      { id: 'bbbbbb2', status: 'PREPARING', total: 6, createdAt: now, items: [{ quantity: 1 }], user: { name: 'Sam R.' } },
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUpdateOrderStatus: () => ({ mutate, isPending: false }),
  useStoreOrdering: () => ({ mutate: setOrdering, isPending: false }),
  useVendorTeamRequest: () => async () => ({
    canPublish: false,
    checks: [
      { key: 'identity', label: 'Store identity', passed: true, required: true },
      { key: 'products', label: 'Products/menu', passed: false, required: true, message: 'Add at least one active product.' },
      { key: 'deliveryZones', label: 'Delivery zones', passed: true, required: false },
    ],
  }),
}))

function store(overrides: Partial<VendorStore> = {}): VendorStore {
  return { id: 's1', name: 'Northside Bakery', isPublished: true, status: 'ACTIVE', permissions: ['FULL_ACCESS'], isOwner: true, ...overrides } as unknown as VendorStore
}

function renderOverview(value: VendorStore) {
  const router = createMemoryRouter(
    [
      {
        path: '/vendor/:storeId',
        element: (
          <VendorActiveStoreProvider stores={[value]}>
            <VendorOverviewPage />
          </VendorActiveStoreProvider>
        ),
      },
    ],
    { initialEntries: ['/vendor/s1'] },
  )
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('Overview', () => {
  it('puts incoming orders first for an open store, with accept in place', async () => {
    const user = userEvent.setup()
    renderOverview(store())

    expect(screen.getByRole('heading', { name: 'Incoming · 1' })).toBeInTheDocument()
    expect(screen.getByText(/Maya L\. · 3 items/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'In progress' })).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.queryByText('Finish setting up')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Accept' }))
    expect(mutate).toHaveBeenCalledWith({ orderId: 'aaaaaa1', status: 'ACCEPTED' })
  })

  it('shows setup steps for a store that is not published', async () => {
    renderOverview(store({ isPublished: false }))

    expect(screen.getByRole('heading', { name: 'Finish setting up' })).toBeInTheDocument()
    expect(await screen.findByText('At least one menu item')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /At least one menu item/ })).toHaveAttribute('href', '/vendor/s1/menu/items/new')
    expect(screen.getByText('1 of 3 done')).toBeInTheDocument()
    expect(screen.queryByText('Delivery area')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Incoming/ })).not.toBeInTheDocument()
  })

  it('treats an admin suspension as something the merchant cannot lift', () => {
    renderOverview(store({ status: 'PAUSED', acceptingOrders: true }))
    expect(screen.getByText('Northside Bakery is suspended')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Resume orders' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pause new orders' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'In progress' })).toBeInTheDocument()
  })

  it('shows the merchant pause with its reason and resumes it', async () => {
    const user = userEvent.setup()
    renderOverview(store({ acceptingOrders: false, ordersPausedReason: 'Sold out for today' }))
    expect(screen.getByText('New orders are paused')).toBeInTheDocument()
    expect(screen.getByText(/Reason: Sold out for today/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Resume orders' }))
    expect(setOrdering).toHaveBeenCalledWith({ acceptingOrders: true })
  })

  it('pauses new orders with an optional reason', async () => {
    const user = userEvent.setup()
    renderOverview(store())
    await user.click(screen.getByRole('button', { name: 'Pause new orders' }))
    await user.type(screen.getByLabelText(/Reason/), 'Kitchen closed early')
    await user.click(screen.getByRole('button', { name: 'Pause new orders' }))
    expect(setOrdering).toHaveBeenCalledWith(
      { acceptingOrders: false, reason: 'Kitchen closed early' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('shows members without order access no order data', () => {
    renderOverview(store({ isOwner: false, permissions: ['VIEW_ITEMS'] }))
    expect(screen.queryByRole('heading', { name: /Incoming/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Open Orders' })).not.toBeInTheDocument()
  })
})
