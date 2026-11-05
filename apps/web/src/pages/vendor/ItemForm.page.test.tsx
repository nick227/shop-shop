import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ItemFormPage from './ItemForm.page'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@api/client', () => ({
  apiClient: {
    stores: () => ({ getStoreById: async () => ({ id: 's1', name: 'Sample Kitchen' }) }),
    items: () => ({ getItemById: vi.fn(), createItem: vi.fn(), updateItem: vi.fn() }),
  },
}))
vi.mock('@shared/hooks/hooks/vendor/usePublicMediaList', () => ({ usePublicMediaList: () => ({ data: [] }) }))
vi.mock('@features/auth/ProductMediaGrid', () => ({ ProductMediaGrid: () => null, uploadItemPhoto: vi.fn() }))
vi.mock('@shared/lib/auth/authFetch', () => ({
  authGet: async () => ({
    ok: true,
    json: async () => ({
      data: [
        { id: 'breakfast', name: 'Breakfast', description: null, sortIndex: 0, isVisible: true, itemCount: 2 },
        { id: 'staff', name: 'Staff Meals', description: null, sortIndex: 1, isVisible: false, itemCount: 1 },
      ],
    }),
  }),
  authPost: vi.fn(),
  authPatch: vi.fn(),
  authPut: vi.fn(),
  authDelete: vi.fn(),
}))

describe('ItemFormPage', () => {
  it('offers the store’s sections and starts in the section it was opened from', async () => {
    const router = createMemoryRouter([{ path: '/vendor/:storeId/menu/items/new', element: <ItemFormPage /> }], {
      initialEntries: ['/vendor/s1/menu/items/new?section=staff'],
    })
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )
    const picker = await screen.findByRole('combobox', { name: 'Menu section' })
    expect(await screen.findByRole('option', { name: 'Staff Meals (hidden)' })).toBeInTheDocument()
    expect(picker).toHaveValue('staff')
  })
})
