import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/primitives'
import { StoreHoursEditor } from '@features/auth/components/StoreHoursEditor'
import { US_STATES } from '@shared/lib/constants/usStates'
import { maskUsZipInput } from '@shared/lib/utils/fieldInputMasks'
import { cn } from '@shared/lib/cn'
import { hasCoordinate, type StoreFieldProps } from './storeFieldProps'
import { useOpenWhenFilled } from './useOpenWhenFilled'

export function StoreLocationSection({ formData, onChange }: StoreFieldProps) {
  const addressStateCode = (formData.addressState ?? '').toUpperCase()
  const showOrphanStateOption =
    Boolean(addressStateCode) && !US_STATES.some((s) => s.code === addressStateCode)
  const coordsFilled = hasCoordinate(formData.latitude) || hasCoordinate(formData.longitude)
  const coords = useOpenWhenFilled(coordsFilled)
  const [locating, setLocating] = useState(false)

  const useCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Location is not available in this browser.')
      return
    }
    setLocating(true)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 0,
        })
      })
      onChange('latitude', position.coords.latitude.toString())
      onChange('longitude', position.coords.longitude.toString())
    } catch {
      toast.error('Unable to get your location.')
    } finally {
      setLocating(false)
    }
  }

  return (
    <section id="location" className="scroll-mt-6 space-y-6">
      <h2 className="text-sm font-semibold text-foreground">Location</h2>

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

      <StoreHoursEditor
        value={formData.hoursJson}
        onChange={(hours) => onChange('hoursJson', hours)}
        deliveryEnabled={formData.deliveryEnabled}
      />

      <div className="space-y-4">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          aria-expanded={coords.open}
          onClick={() => coords.setOpen((open) => !open)}
        >
          <ChevronRight className={cn('h-4 w-4 transition-transform', coords.open && 'rotate-90')} />
          Coordinates
        </button>

        {coords.open && (
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
            <Input
              label="Latitude"
              type="number"
              value={formData.latitude}
              onChange={(e) => onChange('latitude', e.target.value)}
              placeholder="40.7128"
              step="0.00000001"
            />
            <Input
              label="Longitude"
              type="number"
              value={formData.longitude}
              onChange={(e) => onChange('longitude', e.target.value)}
              placeholder="-74.0060"
              step="0.00000001"
            />
            <div className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => void useCurrentLocation()} disabled={locating}>
                {locating ? 'Locating...' : 'Use current location'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
