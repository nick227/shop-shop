import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DiscoveryPage } from './DiscoveryPage'
import { placeZip } from '../shell/placeMemory'

vi.mock('./NeighborhoodMap', () => ({
  NeighborhoodMap: () => <div data-testid="neighborhood-map" />,
}))

vi.mock('../neighborhood/useNeighborhoodData', () => ({
  useNeighborhoodData: () => ({
    location: undefined,
    notice: undefined,
    waitingForZip: false,
    stores: [
      {
        id: 'store-1',
        name: 'Bouldin Market',
        storeType: 'GROCERY',
        description: 'Fresh local produce',
      },
      {
        id: 'store-2',
        name: 'Taco Heaven',
        storeType: 'RESTAURANT',
        description: 'Austin tacos',
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
    stories: [],
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
        distance: null,
        website: null,
        latitude: 30.25,
        longitude: -97.75,
        attribution: null,
      },
    ],
    isLoading: false,
  }),
}))

vi.mock('../neighborhood/useSignedInHome', () => ({
  useSignedInHome: () => ({
    enabled: false,
    orders: [],
    addresses: [],
    favorites: { items: [], stores: [] },
    usual: undefined,
  }),
}))

describe('DiscoveryPage without ZIP code', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('introduces features, categories, neighborhoods, and vendors when no ZIP is set', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/river']}>
          <Routes>
            <Route path="/river" element={<DiscoveryPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Hero & features
    expect(screen.getByRole('heading', { name: /find shops/i })).toBeInTheDocument()
    expect(screen.getByText('Around your neighborhood')).toBeInTheDocument()
    expect(screen.getAllByText('Explore the map').length).toBeGreaterThan(0)
    expect(screen.getByText('Fresh nearby')).toBeInTheDocument()
    expect(screen.getByText('Order from local vendors')).toBeInTheDocument()

    // Categories
    expect(screen.getByRole('region', { name: 'Categories' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Food' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Grocery' })).toBeInTheDocument()

    // Neighborhoods
    expect(screen.getByRole('region', { name: 'Austin neighborhoods' })).toBeInTheDocument()
    expect(screen.getByText('Zilker')).toBeInTheDocument()
    expect(screen.getByText('South Congress')).toBeInTheDocument()

    // Vendors (Shops on Shop-Shop + Directory)
    expect(screen.getByRole('region', { name: 'Shops on Shop-Shop' })).toBeInTheDocument()
    expect(screen.getAllByText('Bouldin Market').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Taco Heaven').length).toBeGreaterThan(0)
    expect(screen.getByText('Morning Jo’s')).toBeInTheDocument()

    // Clicking a quick ZIP chip persists the ZIP in localStorage
    await user.click(screen.getByRole('button', { name: /south austin · 78704/i }))
    expect(placeZip('')).toBe('78704')
  })
})
