import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ItemResponse } from '@api/types'
import { defaultStorefrontConfig, type StorefrontConfig } from '@packages/shared/storefront'
import type { MenuSection } from '@shared/lib/menu/menuSections'
import type { StoreHeaderStore } from '@features/stores/components/StoreHeader/storeHeaderTypes'
import { Storefront } from './Storefront'
import type { StorefrontData } from './api'
import { sectionLayout } from './components/StorefrontMenu'
import { hexToHslTriple } from './theme'

const mutate = vi.fn()
vi.mock('@shared/hooks/hooks/useAddToCart', () => ({ useAddToCart: () => ({ mutate, isPending: false }) }))
vi.mock('@shared/hooks/hooks/useAddBundleToCart', () => ({ useAddBundleToCart: () => ({ mutate: vi.fn(), isPending: false }) }))
const toastInfo = vi.fn()
vi.mock('sonner', () => ({ toast: { info: (...a: unknown[]) => toastInfo(...a), success: vi.fn(), error: vi.fn() } }))

const store = {
  id: 's1',
  name: 'Sample Kitchen',
  phone: '512-555-0100',
  addressStreet: '1 Main St',
  addressCity: 'Austin',
  addressState: 'TX',
  description: 'Breakfast all day.',
} as unknown as StoreHeaderStore

const item = (id: string, title: string, sectionId: string | null, extra: Partial<ItemResponse> = {}) =>
  ({
    id,
    storeId: 's1',
    title,
    description: '',
    price: '8.50',
    isActive: true,
    isSoldOut: false,
    sortIndex: 0,
    sectionId,
    mediaAssets: [{ url: `https://img.test/${id}.jpg`, kind: 'IMAGE' }],
    ...extra,
  }) as unknown as ItemResponse

const section = (id: string, name: string, sortIndex: number, isVisible = true): MenuSection => ({
  id,
  name,
  description: null,
  sortIndex,
  isVisible,
  itemCount: 1,
})

const items = [
  item('b1', 'Breakfast Sandwich', 'breakfast'),
  item('b2', 'Breakfast Burrito', 'breakfast', { description: 'eggs, potato' }),
  item('d1', 'Horchata', 'drinks', { mediaAssets: [] }),
  item('x1', 'Family Meal', 'staff'),
]
const sections = [section('breakfast', 'Breakfast', 0), section('drinks', 'Drinks', 1), section('staff', 'Staff', 2, false)]

const data = (overrides: Partial<StorefrontData> = {}): StorefrontData => ({
  config: defaultStorefrontConfig(),
  view: 'published',
  ordering: {
    acceptingOrders: true,
    message: null,
    pickupEnabled: true,
    deliveryEnabled: true,
    prepTimeMin: 15,
    deliveryCharge: 3,
    deliveryDistanceMiles: 5,
  },
  hours: null,
  popularItemIds: ['b2'],
  media: [],
  bundles: [],
  ...overrides,
})

function renderStorefront(props: { config?: StorefrontConfig; data?: StorefrontData; mode?: 'live' | 'preview' } = {}) {
  return render(
    <MemoryRouter>
      <Storefront
        store={store}
        data={props.data ?? data()}
        config={props.config}
        items={items}
        sections={sections}
        bundles={[]}
        mode={props.mode ?? 'live'}
        stickyTop={0}
      />
    </MemoryRouter>,
  )
}

const sectionOrder = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-storefront-section]')].map((el) => el.getAttribute('data-storefront-section'))

beforeEach(() => {
  mutate.mockReset()
  toastInfo.mockReset()
})

describe('Storefront', () => {
  it('leads with the business, its contact actions and how to order', () => {
    renderStorefront()
    expect(screen.getByRole('heading', { level: 1, name: 'Sample Kitchen' })).toBeInTheDocument()
    const contact = screen.getByRole('group', { name: 'Contact Sample Kitchen' })
    expect(within(contact).getByRole('link', { name: /Call/ })).toHaveAttribute('href', 'tel:512-555-0100')
    expect(within(contact).getByRole('link', { name: /Directions/ })).toBeInTheDocument()
    const ordering = screen.getByRole('region', { name: 'Ordering' })
    expect(ordering).toHaveTextContent('Taking orders')
    expect(ordering).toHaveTextContent('Pickup · ready in about 15 min')
    // Delivery is offered without inventing a time; the fee comes from checkout.
    expect(ordering).toHaveTextContent('Delivery · fee shown at checkout')
    expect(ordering).not.toHaveTextContent(/\d+–\d+ min/)
    // No posted hours, so no claim about being open.
    expect(ordering).not.toHaveTextContent(/Open now|Closed now/)
  })

  it('shows open or closed from posted hours, separately from taking orders', () => {
    const week = Object.fromEntries(['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => [d, { open: '00:00', close: '00:00' }]))
    renderStorefront({
      data: data({
        hours: { isOpenNow: true, today: null, timezone: 'UTC', week },
        ordering: { ...data().ordering, acceptingOrders: false, message: null },
      }),
    })
    const ordering = screen.getByRole('region', { name: 'Ordering' })
    expect(ordering).toHaveTextContent('Open now')
    expect(ordering).toHaveTextContent('Not taking orders right now')
  })

  it('says plainly when checkout would refuse an order', () => {
    renderStorefront({
      data: data({ ordering: { ...data().ordering, acceptingOrders: false, message: 'Back at 5pm' } }),
    })
    const ordering = screen.getByRole('region', { name: 'Ordering' })
    expect(ordering).toHaveTextContent('Not taking orders right now')
    expect(ordering).toHaveTextContent('Back at 5pm')
  })

  it('shows the vendor’s visible sections in order and never a hidden section’s items', () => {
    renderStorefront()
    const nav = screen.getByRole('navigation', { name: 'Menu sections' })
    expect(within(nav).getAllByRole('link').map((a) => a.textContent)).toEqual(['Breakfast', 'Drinks'])
    expect(screen.queryByText('Family Meal')).not.toBeInTheDocument()
  })

  it('arranges optional sections as configured, always keeping business content after the menu', () => {
    const base = defaultStorefrontConfig()
    const config: StorefrontConfig = {
      ...base,
      sections: {
        beforeMenu: [
          { key: 'featured', visible: true },
          { key: 'categories', visible: false },
          { key: 'mosaic', visible: true },
          { key: 'announcements', visible: true },
          { key: 'bundles', visible: true },
        ],
        afterMenu: [
          { key: 'about', visible: true },
          { key: 'gallery', visible: false },
          { key: 'updates', visible: true },
        ],
      },
    }
    const { container } = renderStorefront({ config })
    expect(sectionOrder(container)).toEqual(['header', 'ordering', 'featured', 'mosaic', 'announcements', 'bundles', 'menu', 'about', 'updates'])
    expect(screen.queryByRole('heading', { name: 'Menu', level: 2 })).not.toBeInTheDocument()
  })

  it('features pinned items first, then popular ones, and never excluded ones', () => {
    const base = defaultStorefrontConfig()
    renderStorefront({
      config: { ...base, featured: { ...base.featured, itemIds: ['d1'], excludedItemIds: ['b1'] } },
    })
    // Pinned and popular pictured items lead the mosaic carousel; the Featured row doesn't repeat them.
    const carousel = screen.getByRole('region', { name: 'Featured products' })
    expect(carousel).toHaveTextContent('Breakfast Burrito')
    expect(carousel).not.toHaveTextContent('Breakfast Sandwich')
    const featured = screen.getByRole('region', { name: 'Featured' })
    const names = within(featured).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(names).toEqual(['Horchata'])
  })

  it('opens an item in a sheet and adds the chosen quantity', async () => {
    renderStorefront()
    const menu = screen.getByRole('region', { name: 'Breakfast' })
    await userEvent.click(within(menu).getByRole('button', { name: /Breakfast Burrito, \$8\.50/ }))
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByText('eggs, potato')).toBeInTheDocument()
    await userEvent.click(within(sheet).getByRole('button', { name: 'One more' }))
    await userEvent.click(within(sheet).getByRole('button', { name: /Add 2 to cart · \$17\.00/ }))
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ itemId: 'b2', quantity: 2 }))
  })

  it('adds with one tap from the menu, and adds nothing in the vendor preview', async () => {
    renderStorefront()
    const menu = screen.getByRole('region', { name: 'Drinks' })
    await userEvent.click(within(menu).getByRole('button', { name: 'Add Horchata to cart' }))
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ itemId: 'd1', quantity: 1 }))
  })

  it('in the preview, explains instead of adding to the cart', async () => {
    renderStorefront({ mode: 'preview' })
    const menu = screen.getByRole('region', { name: 'Drinks' })
    await userEvent.click(within(menu).getByRole('button', { name: 'Add Horchata to cart' }))
    expect(mutate).not.toHaveBeenCalled()
    expect(toastInfo).toHaveBeenCalled()
  })

  it('searches the whole menu', async () => {
    renderStorefront()
    await userEvent.type(screen.getByRole('searchbox', { name: /Sample Kitchen/ }), 'potato')
    expect(screen.getByRole('status')).toHaveTextContent('1 item matches')
    expect(screen.queryByRole('region', { name: 'Drinks' })).not.toBeInTheDocument()
  })

  it('wears the vendor’s colors', () => {
    const base = defaultStorefrontConfig()
    const { container } = renderStorefront({ config: { ...base, brand: { ...base.brand, paletteId: 'harbor', primary: '#0b4f6c' } } })
    const root = container.querySelector<HTMLElement>('.sf-root')!
    expect(root.style.getPropertyValue('--sf-primary')).toBe('#0b4f6c')
    expect(root.style.getPropertyValue('--primary')).toBe(hexToHslTriple('#0b4f6c'))
  })
})

describe('Storefront in the editor', () => {
  it('offers an Edit button on each part and outlines the one being edited', async () => {
    const onEdit = vi.fn()
    const { container } = render(
      <MemoryRouter>
        <Storefront store={store} data={data()} items={items} sections={sections} bundles={[]} mode="preview" stickyTop={0} onEditSection={onEdit} highlight="menu" />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Edit brand' }))
    expect(onEdit).toHaveBeenCalledWith('header')
    expect(container.querySelector('[data-storefront-section="menu"]')).toHaveAttribute('data-highlighted', 'true')
  })

  it('offers no editing on the live page', () => {
    renderStorefront()
    expect(screen.queryByRole('button', { name: /^Edit / })).not.toBeInTheDocument()
  })
})

describe('Storefront for big catalogs', () => {
  const many = Array.from({ length: 8 }, (_, d) => section(`d${d}`, `Dept ${d}`, d))
  const stock = many.flatMap((dept, d) =>
    Array.from({ length: 20 }, (_, k) => item(`${dept.id}-${k}`, `Dept ${d} thing ${k}`, dept.id, { mediaAssets: [] })),
  )
  const renderBig = () =>
    render(
      <MemoryRouter>
        <Storefront store={store} data={data({ popularItemIds: [] })} items={stock} sections={many} bundles={[]} mode="live" stickyTop={0} />
      </MemoryRouter>,
    )

  it('shows long sections in part with a Show all, and lists every section in a directory', async () => {
    renderBig()
    const first = screen.getByRole('region', { name: /^Dept 0/ })
    expect(within(first).getAllByRole('article')).toHaveLength(9)
    await userEvent.click(within(first).getByRole('button', { name: 'Show all 20 in Dept 0' }))
    expect(within(first).getAllByRole('article')).toHaveLength(20)

    await userEvent.click(screen.getByRole('button', { name: 'All' }))
    const directory = await screen.findByRole('dialog')
    expect(within(directory).getAllByRole('button').filter((b) => /^Dept/.test(b.textContent ?? ''))).toHaveLength(8)
  })

  it('finds any item by search, even one beyond a section’s first rows', async () => {
    renderBig()
    await userEvent.type(screen.getByRole('searchbox'), 'thing 19')
    expect(screen.getByRole('status')).toHaveTextContent('8 items match')
    expect(screen.getByText('Dept 7 thing 19')).toBeInTheDocument()
    // While searching, results replace the merchandising above the menu.
    expect(document.querySelector('[data-storefront-section="mosaic"]')).toBeNull()
  })
})

describe('sectionLayout', () => {
  const pictured = (id: string) => item(id, id, null)
  const plain = (id: string) => item(id, id, null, { mediaAssets: [] })

  it('gives a pictured pair large cards, a short pictured section a grid, and long or text-heavy ones rows', () => {
    expect(sectionLayout([pictured('a'), pictured('b')], 'auto')).toBe('feature')
    expect(sectionLayout(['a', 'b', 'c', 'd'].map(pictured), 'auto')).toBe('grid')
    expect(sectionLayout([pictured('a'), plain('b'), plain('c')], 'auto')).toBe('list')
    expect(sectionLayout(Array.from({ length: 20 }, (_, i) => pictured(`i${i}`)), 'auto')).toBe('list')
  })

  it('follows the vendor’s fixed choice', () => {
    expect(sectionLayout([plain('a')], 'grid')).toBe('grid')
    expect(sectionLayout([pictured('a')], 'list')).toBe('list')
  })
})

describe('hexToHslTriple', () => {
  it('writes colors the way the app’s tokens expect', () => {
    expect(hexToHslTriple('#ffffff')).toBe('0 0% 100%')
    expect(hexToHslTriple('#ff0000')).toBe('0 100% 50%')
  })
})
