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

const section = (id: string, name: string, sortIndex: number, extra: Record<string, unknown> = {}) => ({
  id,
  name,
  description: null,
  sortIndex,
  isVisible: true,
  itemCount: 0,
  ...extra,
})

const menuItem = (id: string, title: string, sectionId?: string, storeId = 's1') => ({
  id,
  storeId,
  title,
  description: '',
  price: '5.00',
  isActive: true,
  isSoldOut: false,
  sortIndex: 0,
  sectionId: sectionId ?? null,
  optionsJson: {},
})

/** Answers the menu's three requests: sections, items and sales. */
function serve({ sections = [], items = [], sales = [] }: { sections?: unknown[]; items?: unknown[]; sales?: unknown[] }) {
  authGet.mockImplementation(async (url: string) => {
    if (String(url).includes('/menu-sections')) return ok({ data: sections })
    if (String(url).startsWith('/api/items/analytics')) return ok({ data: { items: sales } })
    return ok({ data: items })
  })
}

beforeEach(() => authGet.mockReset())

describe('StoreItemsPage', () => {
  it('asks for this store’s items only, and shows a blank menu for a new store', async () => {
    serve({})
    renderMenu()
    expect(await screen.findByText('Your menu is empty')).toBeInTheDocument()
    expect(authGet.mock.calls.some(([url]) => String(url).includes('/api/items?storeId=s1'))).toBe(true)
    expect(authGet.mock.calls.some(([url]) => String(url) === '/api/stores/s1/menu-sections')).toBe(true)
    expect(screen.queryByText(/Soups|Sides/)).not.toBeInTheDocument()
  })

  it('never shows another store’s items even if the server returns them', async () => {
    serve({ items: [menuItem('a', 'Churro'), menuItem('x', 'Fish Taco', undefined, 'other-store')] })
    renderMenu()
    expect(await screen.findByText('Churro')).toBeInTheDocument()
    expect(screen.queryByText('Fish Taco')).not.toBeInTheDocument()
  })

  it('groups by the store’s own sections in their order, with sales on each row, and filters by section', async () => {
    serve({
      sections: [section('drinks', 'Drinks', 1), section('tacos', 'Tacos', 0)],
      items: [menuItem('a', 'Horchata', 'drinks'), menuItem('b', 'Al Pastor', 'tacos'), menuItem('c', 'Mystery')],
      sales: [{ itemId: 'a', periodUnitsSold: 7, periodRevenue: 35 }],
    })
    renderMenu()
    const drinks = await screen.findByRole('region', { name: /Drinks/ })
    expect(within(drinks).getByText('Horchata')).toBeInTheDocument()
    expect(await within(drinks).findByText('7 sold')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /Not in a section/ })).toBeInTheDocument()
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings[0]).toContain('Tacos')
    expect(headings[1]).toContain('Drinks')

    await userEvent.click(screen.getByRole('radio', { name: /Tacos/ }))
    expect(screen.getByText('Al Pastor')).toBeInTheDocument()
    expect(screen.queryByText('Horchata')).not.toBeInTheDocument()
  })

  it('keeps empty and hidden sections in view so the vendor can fill them', async () => {
    serve({
      sections: [section('soon', 'Coming Soon', 0), section('staff', 'Staff Meals', 1, { isVisible: false })],
      items: [menuItem('a', 'Family meal', 'staff')],
    })
    renderMenu()
    const soon = await screen.findByRole('region', { name: /Coming Soon/ })
    expect(within(soon).getByText(/No items yet/)).toBeInTheDocument()
    const staff = screen.getByRole('region', { name: /Staff Meals/ })
    expect(within(staff).getByText('Hidden from shoppers')).toBeInTheDocument()
    expect(within(staff).getByText('Family meal')).toBeInTheDocument()
  })
})
