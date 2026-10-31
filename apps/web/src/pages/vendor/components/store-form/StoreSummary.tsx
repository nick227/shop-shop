import type { StoreFieldProps } from './storeFieldProps'
import { hasText } from './storeFieldProps'
import { STORE_LINKS } from './storeLinks'
import type { StoreTab } from './storeTabs'
import { storeTypeLabel } from './storeTypes'

interface StoreSummaryProps extends StoreFieldProps {
  readonly pendingCount: number
  readonly onOpen: (tab: StoreTab) => void
}

export function StoreSummary({ formData, pendingCount, onOpen }: StoreSummaryProps) {
  const rows: ReadonlyArray<{ tab: StoreTab; label: string; value: string }> = [
    { tab: 'store', label: 'Store', value: storeLine(formData) },
    { tab: 'location', label: 'Location', value: locationLine(formData) },
    { tab: 'orders', label: 'Orders', value: ordersLine(formData) },
    { tab: 'photos', label: 'Photos', value: photosLine(formData, pendingCount) },
    { tab: 'contact', label: 'Contact', value: contactLine(formData) },
  ]

  return (
    <div className="divide-y divide-border">
      {rows.map((row) => (
        <button
          key={row.tab}
          type="button"
          onClick={() => onOpen(row.tab)}
          className="grid w-full gap-2 py-6 text-left md:grid-cols-[8rem_minmax(0,1fr)] md:gap-8"
        >
          <span className="text-sm text-muted-foreground">{row.label}</span>
          <span className="line-clamp-2 text-base text-foreground">{row.value}</span>
        </button>
      ))}
    </div>
  )
}

function storeLine(formData: StoreFieldProps['formData']): string {
  const type = storeTypeLabel(formData.storeType)
  const description = (formData.description ?? '').trim()
  return description ? `${type} · ${description}` : type
}

function locationLine(formData: StoreFieldProps['formData']): string {
  const complete =
    hasText(formData.addressStreet) &&
    hasText(formData.addressCity) &&
    hasText(formData.addressState) &&
    hasText(formData.addressZip)
  const place = complete
    ? `${formData.addressStreet}, ${formData.addressCity}, ${formData.addressState} ${formData.addressZip}`
    : 'Address needed'
  const days = hourDays(formData.hoursJson)
  return days > 0 ? `${place} · ${days} days` : place
}

function ordersLine(formData: StoreFieldProps['formData']): string {
  const modes = [
    formData.deliveryEnabled ? 'Delivery' : null,
    formData.pickupEnabled ? 'Pickup' : null,
  ].filter((mode): mode is string => Boolean(mode))
  const fulfillment = modes.length > 0 ? modes.join(' and ') : 'No fulfillment'
  const visibility = formData.isPublished ? 'Visible' : 'Hidden'
  return `${fulfillment} · ${formData.prepTimeMin || 0} min · ${visibility}`
}

function photosLine(formData: StoreFieldProps['formData'], pendingCount: number): string {
  if (hasText(formData.imageUrl)) return 'Thumbnail set'
  if (pendingCount > 0) return `${pendingCount} waiting to upload`
  return 'No photos'
}

function contactLine(formData: StoreFieldProps['formData']): string {
  const bits = [formData.companyName, formData.phone, formData.email].filter(hasText)
  const links = STORE_LINKS.filter((link) => hasText(formData[link.field])).length
  if (bits.length === 0 && links === 0) return 'No contact'
  if (links > 0) bits.push(`${links} ${links === 1 ? 'link' : 'links'}`)
  return bits.join(' · ')
}

function hourDays(hoursJson: unknown): number {
  if (!hoursJson || typeof hoursJson !== 'object' || !('storeHours' in hoursJson)) return 0
  const storeHours = hoursJson.storeHours
  if (!storeHours || typeof storeHours !== 'object') return 0
  return Object.keys(storeHours).length
}
