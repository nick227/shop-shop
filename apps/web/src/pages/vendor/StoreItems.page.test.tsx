import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StoreItemsPage from './StoreItems.page'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@layouts/VendorLayout/page', () => ({
  VendorPage: ({ children, loading }: { children: React.ReactNode; loading?: boolean }) =>
    loading ? <p>loading</p> : <div>{children}</div>,
}))
vi.mock('./components/CsvImportButton', () => ({ CsvImportButton: () => null }))
vi.mock('./components/MenuTabs', () => ({ MenuTabs: () => null }))
vi.mock('@api/client', () => ({
  apiClient: {
    stores: () => ({ getStoreById: async () => ({ id: 's1', name: 'Cha Cha Money' }) }),
    items: () => ({ deleteItem: vi.fn(), updateItem: vi.fn() }),
  },
}))

const authGet = vi.fn()
vi.mock('@shared/lib/auth/authFetch', () => ({ authGet: (...args: unknown[]) => authGet(...args) }))

const ok = (body: unknown) => ({ ok: true, json: async () => body })

function renderMenu() {
  const router = createMemoryRouter([{ path: '/vendor/:storeId/menu', element: <StoreItemsPage /> }], {
    initialEntries: ['/vendor/s1/menu'],
  })
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

const menuItem = (id: string, title: string, category?: string, storeId = 's1') => ({
  id,
  storeId,
  title,
  description: '',
  price: '5.00',
  isActive: true,
  isSoldOut: false,
  sortIndex: 0,
  optionsJson: category ? { category } : {},
})

beforeEach(() => authGet.mockReset())

describe('StoreItemsPage', () => {
  it('asks for this store’s items only, and shows a blank menu for a new store', async () => {
    authGet.mockResolvedValue(ok({ data: [] }))
    renderMenu()
    expect(await screen.findByText('Your menu is empty')).toBeInTheDocument()
    expect(authGet.mock.calls[0][0]).toContain('/api/items?storeId=s1')
    expect(screen.queryByText(/Soups|Sides/)).not.toBeInTheDocument()
  })

  it('never shows another store’s items even if the server returns them', async () => {
    authGet.mockImplementation(async (url: string) =>
      String(url).startsWith('/api/items/analytics')
        ? ok({ data: { items: [] } })
        : ok({ data: [menuItem('a', 'Churro', 'Dessert'), menuItem('x', 'Fish Taco', 'Tacos', 'other-store')] }),
    )
    renderMenu()
    expect(await screen.findByText('Churro')).toBeInTheDocument()
    expect(screen.queryByText('Fish Taco')).not.toBeInTheDocument()
  })

  it('groups by the store’s own categories with sales on each row, and filters by category', async () => {
    authGet.mockImplementation(async (url: string) =>
      String(url).startsWith('/api/items/analytics')
        ? ok({ data: { items: [{ itemId: 'a', periodUnitsSold: 7, periodRevenue: 35 }] } })
        : ok({ data: [menuItem('a', 'Horchata', 'Drinks'), menuItem('b', 'Al Pastor', 'Tacos'), menuItem('c', 'Mystery')] }),
    )
    renderMenu()
    const drinks = await screen.findByRole('region', { name: /Drinks/ })
    expect(within(drinks).getByText('Horchata')).toBeInTheDocument()
    expect(await within(drinks).findByText('7 sold')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /Uncategorized/ })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('radio', { name: /Tacos/ }))
    expect(screen.getByText('Al Pastor')).toBeInTheDocument()
    expect(screen.queryByText('Horchata')).not.toBeInTheDocument()
  })
})
