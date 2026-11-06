import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createInitialStoreFormData } from '@shared/lib/utils/form-utilities'
import { reverseGeocode } from '@services/geocoding'
import { StoreLocationSection } from './StoreLocationSection'

vi.mock('@services/geocoding', () => ({ reverseGeocode: vi.fn() }))
vi.mock('@features/auth/components/StoreHoursEditor', () => ({ StoreHoursEditor: () => <div>Hours editor</div> }))
function Harness() {
  const [formData, setFormData] = useState(createInitialStoreFormData())
  return <StoreLocationSection formData={formData} onChange={(key, value) => setFormData(prev => ({ ...prev, [key]: value }))} />
}
const position = { coords: { latitude: 30.2672, longitude: -97.7431, accuracy: 25 } }
function locationMock(fn = vi.fn((success) => success(position))) {
  vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: fn } })
  return fn
}
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks() })

describe('store location', () => {
  it('shows coordinates first and fills coordinates and address', async () => {
    locationMock()
    vi.mocked(reverseGeocode).mockResolvedValue({ line1: '100 Congress Ave', city: 'Austin', state: 'TX', postalCode: '78701' })
    render(<Harness />)
    expect(screen.getAllByRole('heading')[0]).toHaveTextContent('Coordinates')
    expect(screen.getByLabelText('Latitude')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Use my location' }))
    await waitFor(() => expect(screen.getByLabelText('Street *')).toHaveValue('100 Congress Ave'))
    expect(screen.getByLabelText('Latitude')).toHaveValue(30.2672)
    expect(screen.getByLabelText('Longitude')).toHaveValue(-97.7431)
    expect(screen.getByLabelText('City *')).toHaveValue('Austin')
    expect(screen.getByLabelText('ZIP *')).toHaveValue('78701')
    expect(screen.getByText(/Location found/)).toBeInTheDocument()
  })
  it('retries without high accuracy after a timeout', async () => {
    const getPosition = locationMock(vi.fn().mockImplementationOnce((_success, fail) => fail({ code: 3 })).mockImplementationOnce(success => success(position)))
    vi.mocked(reverseGeocode).mockResolvedValue({ city: 'Austin' })
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Use my location' }))
    expect(await screen.findByText(/Location found/)).toBeInTheDocument()
    expect(getPosition).toHaveBeenNthCalledWith(2, expect.any(Function), expect.any(Function), expect.objectContaining({ enableHighAccuracy: false }))
  })
  it('explains denied permission without retrying', async () => {
    const getPosition = locationMock(vi.fn((_success, fail) => fail({ code: 1 })))
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Use my location' }))
    expect(await screen.findByText(/Location blocked/)).toBeInTheDocument()
    expect(getPosition).toHaveBeenCalledTimes(1)
    expect(reverseGeocode).not.toHaveBeenCalled()
  })
  it('keeps coordinates when address lookup fails', async () => {
    locationMock()
    vi.mocked(reverseGeocode).mockRejectedValue(new Error('offline'))
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Use my location' }))
    expect(await screen.findByText('Coordinates found. Enter address manually and save.')).toBeInTheDocument()
    expect(screen.getByLabelText('Latitude')).toHaveValue(30.2672)
  })
})
