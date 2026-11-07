import { StrictMode } from 'react'
import { saveVisit, readVisit } from '@features/discovery-navigation/context'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

function crumbs() {
  return within(screen.getByRole('navigation', { name: 'Discovery breadcrumb' })).getAllByRole('listitem').map((item) => item.textContent)
}

function Probe() {
  const location = useLocation()
  return <output data-testid="probe">{location.pathname + location.search}</output>
}
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DiscoveryPage } from './DiscoveryPage'
import { placeZip } from '../shell/placeMemory'

const mockState = vi.hoisted(() => ({
  hasLocation: false,
  signedIn: false,
}))

vi.mock('../neighborhood/recentViews', () => ({ useRecentViews: () => [], recordRecent: vi.fn() }))

vi.mock('./NeighborhoodMap', () => ({
  NeighborhoodMap: () => <div data-testid="neighborhood-map" />,
}))

vi.mock('../neighborhood/useNeighborhoodData', () => ({
  useNeighborhoodData: () => ({
    location: mockState.hasLocation
      ? {
          city: 'Austin',
          state: 'TX',
          zip: '78704',
          latitude: 30.245,
          longitude: -97.768,
        }
      : undefined,
    notice: undefined,
    waitingForZip: false,
    stores: [
      {
        id: 'store-1',
        name: 'Bouldin Market',
        storeType: 'GROCERY',
        description: 'Fresh local produce',
        imageUrl: 'https://cdn.example.test/bouldin.jpg',
        distance: mockState.hasLocation ? 0.6 : undefined,
      },
      {
        id: 'store-2',
        name: 'Taco Heaven',
        storeType: 'RESTAURANT',
        description: 'Austin tacos',
        imageUrl: 'https://cdn.example.test/taco-heaven.jpg',
        distance: mockState.hasLocation ? 0.4 : undefined,
      },
    ],
    products: [
      {
        id: 'item-1',
        title: 'Steak Burrito',
        price: '9.99',
        storeId: 'store-2',
        isActive: true,
        imageUrl: 'https://cdn.example.test/burrito.jpg',
      },
    ],
    stories: [
      {
        id: 'story-1',
        storeId: 'store-2',
        caption: 'Morning tortillas on the comal\nFresh masa pressed daily in South Austin.',
        mediaType: 'IMAGE',
        url: '',
      },
    ],
    neighborhoods: [
      {
        id: 'n-1',
        name: 'Zilker',
        slug: 'austin-tx-zilker',
        headline: 'Park and food trailers',
        about: null,
        coverUrl: null,
      },
      {
        id: 'n-2',
        name: 'South Congress',
        slug: 'austin-tx-south-congress',
        headline: 'Shops, music, and cafes',
        about: null,
        coverUrl: null,
      },
    ],
    storesLoading: false,
    productsLoading: false,
  }),
}))

vi.mock('../neighborhood/useDirectory', () => {
  const rows = () => [
      {
        id: 'dir-1',
        slug: 'morning-jos',
        name: 'Morning Jo’s',
        category: 'COFFEE',
        categoryLabel: 'Coffee',
        addressStreet: '1300 S Congress Ave',
        distance: mockState.hasLocation ? 0.3 : null,
        website: null,
        latitude: 30.25,
        longitude: -97.75,
        attribution: null,
        coverUrl: 'https://cdn.example.test/morning-jos.jpg',
      },
      {
        id: 'dir-2',
        slug: 'barton-springs-pool',
        name: 'Barton Springs Pool',
        category: 'PARK',
        categoryLabel: 'Park',
        addressStreet: '2131 William Barton Dr',
        distance: mockState.hasLocation ? 0.8 : null,
        website: null,
        latitude: 30.26,
        longitude: -97.77,
        attribution: null,
        coverUrl: 'https://cdn.example.test/barton-springs.jpg',
      },
    ]
  return {
    useDirectory: () => ({ data: rows(), isLoading: false }),
    directoryQuery: (latitude?: number, longitude?: number, options?: { q?: string; group?: string }) => ({
      queryKey: ['directory', latitude ?? 'all', longitude ?? 'all', options?.q ?? '', options?.group ?? ''],
      queryFn: async () => rows(),
    }),
  }
})

vi.mock('../neighborhood/useSignedInHome', () => ({
  useSignedInHome: () =>
    mockState.signedIn
      ? {
          enabled: true,
          orders: [
            {
              id: 'order-1',
              storeId: 'store-2',
              items: [{ itemId: 'item-1', titleSnapshot: 'Steak Burrito', quantity: 2 }],
            },
          ],
          addresses: [{ postalCode: '78704', isDefault: true, latitude: 30.245, longitude: -97.768 }],
          favorites: {
            items: [{ id: 'item-1', title: 'Steak Burrito', price: 9.99, storeId: 'store-2' }],
            stores: [{ id: 'store-1', name: 'Bouldin Market' }],
          },
          usual: 'Your usual South Austin picks.',
        }
      : {
          enabled: false,
          orders: [],
          addresses: [],
          favorites: { items: [], stores: [] },
          usual: undefined,
        },
}))

describe('DiscoveryPage 7-surface composition', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    mockState.hasLocation = false
    mockState.signedIn = false
  })

  it('restores the selected detail panel under Strict Mode and remembers closing it', async () => {
    saveVisit('/explore?category=food', { y: 0, selected: 'store:store-2' })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <StrictMode><QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/explore?category=food']}><DiscoveryPage /></MemoryRouter>
      </QueryClientProvider></StrictMode>,
    )
    expect(await screen.findByRole('complementary', { name: 'Taco Heaven' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View store' }).getAttribute('href')).toContain('from=')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Close', exact: true }))
    expect(screen.queryByRole('complementary', { name: 'Taco Heaven' })).toBeNull()
    expect(readVisit('/explore?category=food')?.selected).toBeUndefined()
  })

  it('introduces features, categories, neighborhoods, and vendors when no ZIP is set (signed out)', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/river']}>
          <Routes>
            <Route path="/river" element={<DiscoveryPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Surface 1: one location heading and one ZIP switcher
    const heroRegion = screen.getByRole('region', { name: 'Shops near you' })
    expect(heroRegion).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /find shops/i })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /delivery zip/i })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Set location' }))
    expect(screen.getByRole('textbox', { name: /delivery zip/i })).toBeInTheDocument()
    expect(screen.queryByText('Around your neighborhood')).not.toBeInTheDocument()

    const neighborhoodsRegion = screen.getByRole('region', { name: 'Austin neighborhoods' })
    expect(neighborhoodsRegion).toBeInTheDocument()
    expect(screen.getByText('Zilker')).toBeInTheDocument()
    expect(screen.getByText('South Congress')).toBeInTheDocument()
    expect(container.querySelectorAll('.place-card.is-neighborhood.is-quiet').length).toBeGreaterThanOrEqual(2)
    expect(container.querySelector('.place-card.is-neighborhood img')).not.toBeInTheDocument()

    expect(screen.queryByRole('region', { name: 'For You' })).not.toBeInTheDocument()

    expect(screen.getByRole('region', { name: 'Shops on Shop-Shop' })).toBeInTheDocument()
    expect(container.querySelector('.featured-lead-card.has-photo')).toBeInTheDocument()
    expect(container.querySelector('.featured-lead-media')).toBeInTheDocument()
    expect(screen.getAllByText('Bouldin Market').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Taco Heaven').length).toBeGreaterThan(0)

    expect(screen.getByRole('region', { name: 'Categories' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Food' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Grocery' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Arts' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Outdoors' }).length).toBeGreaterThan(0)

    expect(screen.getByRole('region', { name: 'Infinite Discovery Feed' })).toBeInTheDocument()
    expect(screen.getByText('Morning Jo’s')).toBeInTheDocument()
    expect(screen.getByText('Barton Springs Pool')).toBeInTheDocument()
    expect(container.querySelector('.feed-product-card')).toBeInTheDocument()
    expect(container.querySelector('.place-card.is-business')).toBeInTheDocument()
    expect(container.querySelector('.feed-place-cell .place-card')).toBeInTheDocument()

    const saveButtons = screen.getAllByRole('button', { name: /save steak burrito to collection/i })
    await user.click(saveButtons[0]!)
    expect(screen.getByRole('region', { name: 'For You' })).toBeInTheDocument()
    expect(screen.getAllByText('Saved').length).toBeGreaterThan(0)

    await user.type(screen.getByRole('textbox', { name: /delivery zip/i }), '78704')
    await user.click(screen.getByRole('button', { name: 'Go' }))
    expect(placeZip('')).toBe('78704')
  })

  it('renders localized neighborhood intro and personalized shelves when ZIP is set and signed in', () => {
    mockState.hasLocation = true
    mockState.signedIn = true
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/river?zip=78704&radius=10']}>
          <Routes>
            <Route path="/river" element={<DiscoveryPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByRole('heading', { name: 'Shops near Austin, TX' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change location' })).toBeInTheDocument()
    expect(crumbs()).toEqual(['Austin', '78704'])
    expect(screen.getByRole('region', { name: 'Nearby Neighborhoods' })).toBeInTheDocument()
    expect(screen.getByText('Your usual South Austin picks.')).toBeInTheDocument()
    expect(screen.getAllByText('Ordered before').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Saved').length).toBeGreaterThan(0)
  })

  it('turns hero tags into filters whose counts match the results they open', async () => {
    mockState.hasLocation = true
    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/explore?zip=78704&radius=10']}>
          <Routes>
            <Route path="/explore" element={<><DiscoveryPage /><Probe /></>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    const tags = await screen.findByRole('list', { name: 'Discover here' })
    const food = await screen.findByRole('link', { name: 'Food, 1 place' })
    expect(food.getAttribute('href')).toContain('category=food')
    expect(food.getAttribute('href')).toContain('zip=78704')
    expect(screen.getByRole('link', { name: 'Outdoors, 1 place' })).toBeInTheDocument()
    // No results for these filters here, so they are not offered.
    expect(tags.textContent).not.toContain('Shops')
    expect(tags.textContent).not.toContain('Arts')

    const heroClass = container.querySelector('.discover-hero')?.className
    await user.click(food)
    expect(container.querySelector('.discover-hero')?.className).toBe(heroClass)
    expect(screen.getByTestId('probe').textContent).toBe('/explore?radius=10&zip=78704&category=food')
    expect(screen.getByRole('heading', { name: 'Shops near Austin, TX' })).toBeInTheDocument()
    expect(container.querySelector('.discover-hero.is-results')).not.toBeInTheDocument()
    expect(screen.getByText('1 place · Food')).toBeInTheDocument()
    const active = screen.getByRole('link', { name: 'Food, 1 place, clear filter' })
    expect(active).toHaveAttribute('aria-current', 'true')
    expect(active.getAttribute('href')).not.toContain('category=')
    // The toolbar and the breadcrumb show the same filter as the hero tag.
    expect(within(screen.getByRole('toolbar', { name: 'Category' })).getByRole('button', { name: 'Food', pressed: true })).toBeInTheDocument()
    expect(crumbs()).toEqual(['Austin', '78704', 'Food'])

    await user.click(screen.getByRole('link', { name: 'Coffee, 1 place' }))
    expect(screen.getByTestId('probe').textContent).toContain('q=coffee')
    expect(screen.getByRole('link', { name: 'Coffee, 1 place, clear filter' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('link', { name: 'Food, 1 place' })).not.toHaveAttribute('aria-current')
    expect(within(screen.getByRole('toolbar', { name: 'Category' })).getByRole('button', { name: 'Food', pressed: true })).toBeInTheDocument()
    expect(crumbs()).toEqual(['Austin', '78704', 'Food', '“coffee”'])

    // Clearing the search from the breadcrumb keeps the category, and the hero tag follows.
    await user.click(screen.getByRole('link', { name: 'Clear search “coffee”' }))
    expect(screen.getByRole('link', { name: 'Food, 1 place, clear filter' })).toHaveAttribute('aria-current', 'true')
    // The toolbar's category toggle clears it, and the hero tag follows again.
    await user.click(within(screen.getByRole('toolbar', { name: 'Category' })).getByRole('button', { name: 'Food', pressed: true }))
    expect(screen.getByRole('link', { name: 'Food, 1 place' })).not.toHaveAttribute('aria-current')
    expect(container.querySelector('.discover-hero')?.className).toBe(heroClass)
  })
})
