import { useRef, useState } from 'react'
import { LocateFixed } from 'lucide-react'
import { reverseGeocode } from '@services/geocoding'
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/primitives'
import { StoreHoursEditor } from '@features/auth/components/StoreHoursEditor'
import { US_STATES } from '@shared/lib/constants/usStates'
import { maskUsZipInput } from '@shared/lib/utils/fieldInputMasks'
import { type StoreFieldProps } from './storeFieldProps'
import { StoreSectionTitle } from './StoreSectionTitle'

export function StoreLocationSection({ formData, onChange }: StoreFieldProps) {
  const addressStateCode = (formData.addressState ?? '').toUpperCase()
  const showOrphanStateOption =
    Boolean(addressStateCode) && !US_STATES.some((s) => s.code === addressStateCode)
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  const currentForm = useRef(formData)
  currentForm.current = formData

  const useCurrentLocation = async () => {
    if (!navigator.geolocation || window.isSecureContext === false) {
      setLocationMessage('Location unavailable. Use HTTPS or enter coordinates manually.')
      return
    }
    setLocating(true)
    setLocationMessage('Locating…')
    const startingForm = currentForm.current
    const getPosition = (highAccuracy: boolean) => new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 15_000 : 10_000,
        maximumAge: highAccuracy ? 0 : 60_000,
      })
    })
    try {
      const position = await getPosition(true).catch((error: GeolocationPositionError) => {
        if (error.code === 1) throw error
        setLocationMessage('Retrying location…')
        return getPosition(false)
      })
      onChange('latitude', position.coords.latitude.toString())
      onChange('longitude', position.coords.longitude.toString())
      setLocationMessage('Finding address…')
      try {
        const address = await reverseGeocode(position.coords.latitude, position.coords.longitude)
        const fields = { addressStreet: address.line1, addressCity: address.city, addressState: address.state, addressZip: address.postalCode }
        for (const [field, value] of Object.entries(fields)) {
          const key = field as keyof typeof fields
          // Preserve edits made while location detection was pending.
          if (value && currentForm.current[key] === startingForm[key]) onChange(key, value)
        }
        const accuracy = Number.isFinite(position.coords.accuracy) ? ` (±${Math.round(position.coords.accuracy)} m)` : ''
        setLocationMessage(`Location found${accuracy}. Review address and save.`)
      } catch {
        setLocationMessage('Coordinates found. Enter address manually and save.')
      }
    } catch (error) {
      const code = (error as GeolocationPositionError).code
      setLocationMessage(code === 1 ? 'Location blocked. Allow access in browser and device settings.'
        : code === 3 ? 'Location timed out. Retry or enter coordinates manually.'
        : 'Location unavailable. Check device location settings or enter coordinates manually.')
    } finally {
      setLocating(false)
    }
  }

  return (
    <section className="space-y-10">
      <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
        <StoreSectionTitle>Coordinates</StoreSectionTitle>
        <Button type="button" variant="primary" onClick={() => void useCurrentLocation()} disabled={locating}>
          <LocateFixed className="h-4 w-4" aria-hidden="true" />
          {locating ? 'Locating…' : 'Use my location'}
        </Button>
        <p className="text-xs text-muted-foreground">Use at your store. Fills coordinates and address.</p>
        {locationMessage && <p role="status" className="text-sm text-muted-foreground">{locationMessage}</p>}
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
          <Input label="Latitude" type="number" value={formData.latitude} onChange={(e) => onChange('latitude', e.target.value)} placeholder="40.7128" step="any" min={-90} max={90} />
          <Input label="Longitude" type="number" value={formData.longitude} onChange={(e) => onChange('longitude', e.target.value)} placeholder="-74.0060" step="any" min={-180} max={180} />
        </div>
      </div>
      <div className="space-y-6">
        <StoreSectionTitle>Address</StoreSectionTitle>
      <Input
        label="Street *"
        value={formData.addressStreet}
        onChange={(e) => onChange('addressStreet', e.target.value)}
        placeholder="123 Main Street"
        required
      />

      <div className="grid gap-x-8 gap-y-6 md:grid-cols-3">
        <Input
          label="City *"
          value={formData.addressCity}
          onChange={(e) => onChange('addressCity', e.target.value)}
          placeholder="New York"
          required
        />

        <div className="w-full space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="store-address-state">
            State *
          </label>
          <Select
            value={addressStateCode}
            onValueChange={(value) => onChange('addressState', value)}
            required
          >
            <SelectTrigger id="store-address-state">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              {showOrphanStateOption && (
                <SelectItem value={addressStateCode}>{addressStateCode}</SelectItem>
              )}
              {US_STATES.map((s) => (
                <SelectItem key={s.code} value={s.code}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Input
          label="ZIP *"
          inputMode="numeric"
          autoComplete="postal-code"
          value={formData.addressZip}
          onChange={(e) => onChange('addressZip', maskUsZipInput(e.target.value))}
          placeholder="10001"
          maxLength={10}
          pattern="\d{5}(-\d{4})?"
          required
        />
      </div>
      </div>

      <div className="space-y-6">
        <StoreSectionTitle>Hours</StoreSectionTitle>
        <StoreHoursEditor
          value={formData.hoursJson}
          onChange={(hours) => onChange('hoursJson', hours)}
          deliveryEnabled={formData.deliveryEnabled}
        />
      </div>

    </section>
  )
}
