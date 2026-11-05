import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DiscoveryPage } from './DiscoveryPage'
import { placeZip } from '../shell/placeMemory'

const mockState = vi.hoisted(() => ({
  hasLocation: false,
  signedIn: false,
}))

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
        distance: mockState.hasLocation ? 0.6 : undefined,
      },
      {
        id: 'store-2',
        name: 'Taco Heaven',
        storeType: 'RESTAURANT',
        description: 'Austin tacos',
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

vi.mock('../neighborhood/useDirectory', () => ({
  useDirectory: () => ({
    data: [
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
      },
    ],
    isLoading: false,
  }),
}))

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
    expect(container.querySelector('.featured-lead-card')).not.toBeInTheDocument()
    expect(screen.getAllByText('Bouldin Market').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Taco Heaven').length).toBeGreaterThan(0)

    expect(screen.getByRole('region', { name: 'Categories' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Food' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Grocery' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Arts' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Outdoors' })).toBeInTheDocument()

    expect(screen.getByRole('region', { name: 'Infinite Discovery Feed' })).toBeInTheDocument()
    expect(screen.getByText('Morning Jo’s')).toBeInTheDocument()
    expect(screen.getByText('Barton Springs Pool')).toBeInTheDocument()
    expect(container.querySelector('.feed-product-card')).toBeInTheDocument()
    expect(container.querySelector('.place-card.is-business')).toBeInTheDocument()
    expect(container.querySelector('.place-card.is-attraction')).toBeInTheDocument()

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
    expect(screen.getByRole('button', { name: /change zip/i })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Nearby Neighborhoods' })).toBeInTheDocument()
    expect(screen.getByText('Your usual South Austin picks.')).toBeInTheDocument()
    expect(screen.getAllByText('Ordered before').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Saved').length).toBeGreaterThan(0)
  })
})
