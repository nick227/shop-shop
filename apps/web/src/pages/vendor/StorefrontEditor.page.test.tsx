import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultStorefrontConfig, type StorefrontConfig } from '@packages/shared/storefront'
import StorefrontEditorPage from './StorefrontEditor.page'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock('@layouts/VendorLayout/page', () => ({
  VendorPage: ({ children, loading, actions }: { children: React.ReactNode; loading?: boolean; actions?: React.ReactNode }) => (
    <div>
      <div>{actions}</div>
      {loading ? <p>loading</p> : children}
    </div>
  ),
}))
vi.mock('@shared/hooks/hooks/useStores', () => ({
  useStore: () => ({ data: { id: 's1', name: 'Sample Kitchen', isPublished: true } }),
}))
vi.mock('@shared/hooks/hooks/useAddToCart', () => ({ useAddToCart: () => ({ mutate: vi.fn() }) }))

const ok = (body: unknown) => ({ ok: true, json: async () => body })
const editorState = (draft: StorefrontConfig, published: StorefrontConfig | null = null) => ({
  draft,
  published,
  publishedAt: published ? '2026-11-01T00:00:00.000Z' : null,
  hasUnpublishedChanges: false,
})

let saved: StorefrontConfig = defaultStorefrontConfig()
const calls: string[] = []
const authGet = vi.fn(async (url: string) => {
  if (url.endsWith('/storefront/editor')) return ok({ data: editorState(saved) })
  if (url.includes('/storefront')) {
    return ok({
      data: {
        config: saved,
        view: 'draft',
        ordering: {
          acceptingOrders: true,
          message: null,
          pickupEnabled: true,
          deliveryEnabled: false,
          prepTimeMin: 10,
          deliveryCharge: null,
          deliveryDistanceMiles: null,
        },
        hours: null,
        popularItemIds: [],
        media: [],
        bundles: [],
      },
    })
  }
  if (url.includes('/menu-sections')) return ok({ data: [] })
  return ok({ data: [] })
})
const authPut = vi.fn(async (url: string, body: { config: StorefrontConfig }) => {
  calls.push(`PUT ${url}`)
  saved = body.config
  return ok({ data: editorState(saved) })
})
const authPost = vi.fn(async (url: string) => {
  calls.push(`POST ${url}`)
  return ok({ data: editorState(saved, saved) })
})
vi.mock('@shared/lib/auth/authFetch', () => ({
  authGet: (url: string) => authGet(url),
  authPut: (url: string, body: { config: StorefrontConfig }) => authPut(url, body),
  authPost: (url: string) => authPost(url),
  authPatch: vi.fn(),
  authDelete: vi.fn(),
}))

function renderEditor() {
  const router = createMemoryRouter([{ path: '/vendor/:storeId/storefront', element: <StorefrontEditorPage /> }], {
    initialEntries: ['/vendor/s1/storefront'],
  })
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  saved = defaultStorefrontConfig()
  calls.length = 0
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

describe('StorefrontEditorPage', () => {
  it('shows a change in the preview at once, saves it as a draft, and publishes on request', async () => {
    renderEditor()
    const tagline = await screen.findByRole('textbox', { name: 'Tagline' })
    await userEvent.type(tagline, 'Breakfast all day')

    const preview = screen.getByRole('region', { name: 'Preview' })
    expect(within(preview).getByText('Breakfast all day')).toBeInTheDocument()

    await waitFor(() => expect(calls).toContain('PUT /api/stores/s1/storefront/draft'), { timeout: 3000 })
    expect(saved.brand.tagline).toBe('Breakfast all day')
    expect(screen.getByRole('status')).toHaveTextContent('Unpublished changes')

    await userEvent.click(screen.getByRole('button', { name: 'Publish' }))
    await waitFor(() => expect(calls).toContain('POST /api/stores/s1/storefront/publish'))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Live'))
  })

  it('switches palettes and keeps the menu fixed between page sections', async () => {
    renderEditor()
    await userEvent.click(await screen.findByRole('button', { name: 'Harbor' }))
    const preview = screen.getByRole('region', { name: 'Preview' })
    expect(preview.querySelector<HTMLElement>('.sf-root')!.style.getPropertyValue('--sf-primary')).toBe('#0b4f6c')

    await userEvent.click(screen.getByRole('tab', { name: 'Layout' }))
    expect(screen.getByText('Menu — always shown')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Hide Featured products' }))
    expect(screen.getByRole('button', { name: 'Show Featured products' })).toBeInTheDocument()
  })

  it('discards unpublished changes back to the live storefront', async () => {
    renderEditor()
    await userEvent.type(await screen.findByRole('textbox', { name: 'Tagline' }), 'Draft idea')
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }))
    await waitFor(() => expect(calls).toContain('POST /api/stores/s1/storefront/discard'))
  })
})
