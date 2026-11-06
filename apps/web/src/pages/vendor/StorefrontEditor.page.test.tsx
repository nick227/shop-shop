import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultStorefrontConfig, STOREFRONT_SECTIONS, type StorefrontConfig } from '@packages/shared/storefront'
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
let readinessBody: { canPublish: boolean; missingRequirements: string[] } = { canPublish: true, missingRequirements: [] }
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
  authFetch: async () => ok(readinessBody),
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
  readinessBody = { canPublish: true, missingRequirements: [] }
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

describe('StorefrontEditorPage', () => {
  it('says why Publish is disabled when the store is not ready', async () => {
    readinessBody = { canPublish: false, missingRequirements: ['store photo or media', 'coordinates (Location)'] }
    renderEditor()
    expect(await screen.findByText("Can't publish yet. Still needed: store photo or media; coordinates (Location).")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled()
  })

  it('shows a change in the preview at once, saves it as a draft, and publishes on request', async () => {
    renderEditor()
    await userEvent.click(await screen.findByRole('button', { name: /Brand & colors/ }))
    const tagline = await screen.findByRole('textbox', { name: 'Tagline' })
    await userEvent.type(tagline, 'Breakfast all day')

    const preview = screen.getByRole('region', { name: 'Preview' })
    expect(within(preview).getByText('Breakfast all day')).toBeInTheDocument()

    await waitFor(() => expect(calls).toContain('PUT /api/stores/s1/storefront/draft'), { timeout: 3000 })
    expect(saved.brand.tagline).toBe('Breakfast all day')
    expect(screen.getByText('Unpublished changes')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Publish' }))
    await waitFor(() => expect(calls).toContain('POST /api/stores/s1/storefront/publish'))
    await waitFor(() => expect(screen.getByText('Live')).toBeInTheDocument())
  })

  it('opens a part’s settings from the preview and goes back to the outline', async () => {
    renderEditor()
    const preview = await screen.findByRole('region', { name: 'Preview' })
    await userEvent.click(within(preview).getByRole('button', { name: 'Edit brand' }))
    expect(screen.getByRole('heading', { name: 'Brand & colors' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Back to all parts' }))
    expect(screen.getByRole('navigation', { name: 'Storefront parts' })).toBeInTheDocument()
  })

  it('shows the preview in STOREFRONT_SECTIONS order', async () => {
    renderEditor()
    await userEvent.click(await screen.findByRole('button', { name: /Brand & colors/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Harbor' }))
    const preview = screen.getByRole('region', { name: 'Preview' })
    expect(preview.querySelector<HTMLElement>('.sf-root')!.style.getPropertyValue('--sf-primary')).toBe('#0b4f6c')
    await userEvent.click(screen.getByRole('button', { name: 'Back to all parts' }))

    const outline = screen.getByRole('navigation', { name: 'Storefront parts' })
    const order = () =>
      [...preview.querySelectorAll('[data-storefront-section]')].map((el) => el.getAttribute('data-storefront-section'))
    expect(order()).toEqual(['header', 'ordering', ...STOREFRONT_SECTIONS])
    expect(within(outline).queryByRole('button', { name: 'Hide Menu' })).not.toBeInTheDocument()
    expect(within(outline).queryByRole('button', { name: /Move / })).not.toBeInTheDocument()

    await userEvent.click(within(outline).getByRole('button', { name: 'Hide Featured products' }))
    expect(within(outline).getByRole('button', { name: 'Show Featured products' })).toBeInTheDocument()
    expect(within(preview).getByText(/hidden from/)).toBeInTheDocument()
  })

  it('discards unpublished changes back to the live storefront', async () => {
    renderEditor()
    await userEvent.click(await screen.findByRole('button', { name: /Brand & colors/ }))
    await userEvent.type(await screen.findByRole('textbox', { name: 'Tagline' }), 'Draft idea')
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }))
    await waitFor(() => expect(calls).toContain('POST /api/stores/s1/storefront/discard'))
  })
})
