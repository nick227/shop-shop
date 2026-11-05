import { useState } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StoreFormData } from '@api/types'
import { createInitialStoreFormData } from '@shared/lib/utils/form-utilities'
import { DeliveryAreaEditor } from './DeliveryAreaEditor'
import type { DeliveryAreaMapProps } from './DeliveryAreaMap'

// Leaflet doesn't run in jsdom; the stand-in reports what the map would show and lets a test click it.
vi.mock('./DeliveryAreaMap', () => ({
  default: (props: DeliveryAreaMapProps) => (
    <div>
      <output aria-label="map state">
        {JSON.stringify({ radius: props.radiusMiles, zones: props.zones.map((z) => `${z.label}`), draft: props.draft?.ring.length ?? null, pin: props.pin?.ok ?? null })}
      </output>
      {props.draft?.drawing ? (
        <button type="button" onClick={() => props.onDraftChange([...props.draft!.ring, [30.3 + props.draft!.ring.length * 0.01, -97.73 + (props.draft!.ring.length % 2) * 0.01]])}>
          map click
        </button>
      ) : null}
    </div>
  ),
}))

const api = vi.hoisted(() => ({ zones: [] as Record<string, unknown>[], calls: [] as [string, string, unknown][] }))
const respond = (status: number, body: unknown) => Promise.resolve(new Response(status === 204 ? null : JSON.stringify(body), { status }))
vi.mock('@shared/lib/auth/authFetch', () => ({
  authGet: (url: string) => (api.calls.push(['GET', url, null]), respond(200, { zones: api.zones })),
  authPost: (url: string, body: Record<string, unknown>) => {
    api.calls.push(['POST', url, body])
    if (url.endsWith('/delivery-preview')) {
      return respond(200, { destination: { lat: 30.31, lng: -97.72, approximate: true }, eligibility: { available: true, fee: 0, minimum: null, distanceMiles: 1.2, zoneName: 'Hyde Park' } })
    }
    const zone = { id: `z${api.zones.length + 1}`, isActive: true, priority: 0, ...body, baseFee: String(body.baseFee), minOrder: body.minOrder === null ? null : String(body.minOrder) }
    api.zones.push(zone)
    return respond(201, { zone })
  },
  authPatch: (url: string, body: Record<string, unknown>) => {
    api.calls.push(['PATCH', url, body])
    const zone = api.zones.find((z) => url.endsWith(`/${z.id}`))!
    Object.assign(zone, body)
    return respond(200, { zone })
  },
  authDelete: (url: string) => {
    api.calls.push(['DELETE', url, null])
    api.zones = api.zones.filter((z) => !url.endsWith(`/${z.id}`))
    return respond(204, null)
  },
}))
vi.mock('@/features/checkout/hooks/useAddresses', () => ({ useAddressSuggestions: () => ({ data: [] }) }))

const base: StoreFormData = {
  ...createInitialStoreFormData(),
  deliveryEnabled: true,
  deliveryDistance: '2',
  deliveryCharge: '2.99',
  deliveryMinimum: '',
  latitude: '30.31',
  longitude: '-97.72',
  addressCity: 'Austin',
  addressState: 'TX',
}

function Harness({ storeId = 'store-1' }: { storeId?: string }) {
  const [formData, setFormData] = useState(base)
  return <DeliveryAreaEditor storeId={storeId} formData={formData} onChange={(field, value) => setFormData((f) => ({ ...f, [field]: value }))} />
}
const renderEditor = (storeId?: string) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Harness storeId={storeId} />
    </QueryClientProvider>,
  )
const mapState = async () => JSON.parse((await screen.findByLabelText('map state')).textContent ?? '{}')

describe('DeliveryAreaEditor', () => {
  beforeEach(() => {
    api.zones = []
    api.calls = []
  })

  it('shows the radius on the map and says who gets delivery', async () => {
    const user = userEvent.setup()
    renderEditor()
    expect((await mapState()).radius).toBe(2)
    expect(screen.getByText('Shoppers within 2 miles get delivery for $2.99.')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Delivers within (miles)'))
    await user.type(screen.getByLabelText('Delivers within (miles)'), '3.5')
    expect((await mapState()).radius).toBe(3.5)
    await user.clear(screen.getByLabelText('Delivers within (miles)'))
    expect(screen.getByRole('alert')).toHaveTextContent('Set a distance')
  })

  it('draws an area, validates it, and saves free delivery with no minimum', async () => {
    const user = userEvent.setup()
    renderEditor()
    await user.click(await screen.findByRole('radio', { name: /Areas you draw/ }))
    expect(screen.getByText('Click the map to place the first corner.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Finish outline' })).toBeDisabled()
    for (let i = 0; i < 4; i += 1) await user.click(screen.getByRole('button', { name: 'map click' }))
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByText(/3 corners/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Finish outline' }))

    const form = screen.getByRole('group', { name: 'New delivery area' })
    await user.clear(within(form).getByLabelText('Area name'))
    await user.click(within(form).getByRole('button', { name: 'Save area' }))
    expect(within(form).getByRole('alert')).toHaveTextContent('Name the area')

    await user.type(within(form).getByLabelText('Area name'), 'Hyde Park')
    await user.clear(within(form).getByLabelText('Delivery fee ($)'))
    await user.type(within(form).getByLabelText('Delivery fee ($)'), '0')
    await user.click(within(form).getByRole('button', { name: 'Save area' }))

    await waitFor(() => expect(screen.getByRole('list', { name: 'Delivery areas' })).toHaveTextContent('Hyde Park'))
    const [, , body] = api.calls.find(([method]) => method === 'POST')!
    expect(body).toMatchObject({ storeId: 'store-1', name: 'Hyde Park', baseFee: 0, minOrder: null, polygonJson: { type: 'Polygon' } })
    expect((body as { polygonJson: { coordinates: number[][][] } }).polygonJson.coordinates[0]).toHaveLength(4)
    expect(screen.getByText('Free delivery · no minimum')).toBeInTheDocument()
    expect(screen.getByText('One area gets delivery. Addresses outside it see pickup only.')).toBeInTheDocument()
    expect((await mapState()).radius).toBeNull()
  })

  it('turns areas off when switching back to distance, after confirming', async () => {
    api.zones = [{ id: 'z1', name: 'Downtown', isActive: true, priority: 0, baseFee: '4', minOrder: '30', polygonJson: { type: 'Polygon', coordinates: [[[-97.74, 30.26], [-97.73, 30.26], [-97.73, 30.27], [-97.74, 30.26]]] } }]
    const user = userEvent.setup()
    renderEditor()
    expect(await screen.findByText('$4.00 delivery · $30.00 minimum')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /Distance from store/ }))
    await user.click(await screen.findByRole('button', { name: 'Use distance' }))
    await waitFor(() => expect(api.calls).toContainEqual(['PATCH', '/api/delivery-zones/z1', { isActive: false }]))
    expect(await screen.findByLabelText('Delivers within (miles)')).toBeInTheDocument()
  })

  it('checks an address with the checkout rules and says when the position is approximate', async () => {
    const user = userEvent.setup()
    renderEditor()
    const check = await screen.findByRole('group', { name: 'Check an address' })
    expect(within(check).getByRole('button', { name: 'Check' })).toBeDisabled()
    await user.type(within(check).getByLabelText('Street address'), '4500 Duval St')
    await user.type(within(check).getByLabelText('ZIP'), '78751')
    await user.click(within(check).getByRole('button', { name: 'Check' }))
    expect(await within(check).findByText(/Delivers here/)).toBeInTheDocument()
    expect(check).toHaveTextContent('Free delivery (Hyde Park) · 1.2 mi from the store.')
    expect(check).toHaveTextContent('ZIP code’s center')
    expect((await mapState()).pin).toBe(true)
  })

  it('asks a new store to save before drawing areas', async () => {
    renderEditor('')
    expect(screen.getByRole('radio', { name: /Areas you draw/ })).toBeDisabled()
    expect(screen.queryByRole('group', { name: 'Check an address' })).not.toBeInTheDocument()
  })
})
