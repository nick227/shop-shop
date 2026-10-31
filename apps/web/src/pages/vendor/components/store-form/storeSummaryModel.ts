import type { StoreFormData } from '@api/types'
import { hasText } from './storeFieldProps'
import { STORE_LINKS } from './storeLinks'
import type { StoreTab } from './storeTabs'
import { storeTypeLabel } from './storeTypes'

export type SummaryStatus = 'needed' | 'ready' | 'optional'

export interface SummaryRow {
  readonly tab: StoreTab
  readonly label: string
  readonly status: SummaryStatus
  readonly done: number
  readonly total: number
  readonly detail: string
}

export function buildSummaryRows(formData: StoreFormData, pendingCount: number): SummaryRow[] {
  return [
    storeRow(formData),
    locationRow(formData),
    ordersRow(formData),
    photosRow(formData, pendingCount),
    contactRow(formData),
  ]
}

export function requiredProgress(rows: readonly SummaryRow[]): { ready: number; total: number; title: string } {
  const required = rows.filter((row) => row.status !== 'optional')
  const ready = required.filter((row) => row.status === 'ready').length
  const needed = required.filter((row) => row.status === 'needed').map((row) => row.label)
  return {
    ready,
    total: required.length,
    title: needed.length === 0 ? 'Ready to save' : `${joinList(needed)} still needed`,
  }
}

function storeRow(formData: StoreFormData): SummaryRow {
  const type = storeTypeLabel(formData.storeType)
  const named = hasText(formData.name)
  const described = hasText(formData.description)
  const detail = named
    ? described
      ? `${type}. ${formData.description.trim()}`
      : `${type}. No description yet.`
    : `Add a store name. Type is ${type}.`

  return {
    tab: 'store',
    label: 'Store',
    status: named ? 'ready' : 'needed',
    done: [named, hasText(formData.storeType), described].filter(Boolean).length,
    total: 3,
    detail,
  }
}

function locationRow(formData: StoreFormData): SummaryRow {
  const parts: ReadonlyArray<{ label: string; filled: boolean }> = [
    { label: 'street', filled: hasText(formData.addressStreet) },
    { label: 'city', filled: hasText(formData.addressCity) },
    { label: 'state', filled: hasText(formData.addressState) },
    { label: 'ZIP', filled: hasText(formData.addressZip) },
  ]
  const missing = parts.filter((part) => !part.filled).map((part) => part.label)
  const days = hourDays(formData.hoursJson)
  const hours = days > 0 ? `${days} of 7 days` : 'Hours not set'
  const place =
    missing.length === 0
      ? `${formData.addressStreet}, ${formData.addressCity}, ${formData.addressState} ${formData.addressZip}`
      : `Missing ${joinList(missing)}`

  return {
    tab: 'location',
    label: 'Location',
    status: missing.length === 0 ? 'ready' : 'needed',
    done: parts.length - missing.length,
    total: parts.length,
    detail: `${place}. ${hours}.`,
  }
}

function ordersRow(formData: StoreFormData): SummaryRow {
  const delivery = formData.deliveryEnabled
  const pickup = formData.pickupEnabled
  const prepSet = formData.prepTimeMin > 0
  const radiusSet = Number(formData.deliveryDistance) > 0
  const feeSet = hasText(formData.deliveryCharge)
  const checks = [delivery || pickup, prepSet, formData.isPublished]
  if (delivery) checks.push(radiusSet, feeSet)

  const modes = [delivery ? 'Delivery' : null, pickup ? 'Pickup' : null].filter((mode): mode is string => Boolean(mode))
  const facts = [
    modes.length > 0 ? modes.join(' and ') : 'No delivery or pickup',
    prepSet ? `${formData.prepTimeMin} min prep` : 'Prep time not set',
    formData.isPublished ? 'Visible to customers' : 'Hidden from customers',
  ]
  if (delivery) {
    facts.push(radiusSet ? `${formData.deliveryDistance} mi radius` : 'Radius not set')
    facts.push(feeSet ? `Fee $${formData.deliveryCharge}` : 'Fee not set')
  }

  return {
    tab: 'orders',
    label: 'Orders',
    status: modes.length > 0 ? 'ready' : 'needed',
    done: checks.filter(Boolean).length,
    total: checks.length,
    detail: facts.join(' · '),
  }
}

function photosRow(formData: StoreFormData, pendingCount: number): SummaryRow {
  const hasThumbnail = hasText(formData.imageUrl)
  const detail = hasThumbnail
    ? 'Thumbnail set'
    : pendingCount > 0
      ? `${pendingCount} ${pendingCount === 1 ? 'photo' : 'photos'} waiting to upload`
      : 'No photos yet'

  return {
    tab: 'photos',
    label: 'Photos',
    status: 'optional',
    done: hasThumbnail || pendingCount > 0 ? 1 : 0,
    total: 1,
    detail,
  }
}

function contactRow(formData: StoreFormData): SummaryRow {
  const core: ReadonlyArray<{ label: string; value: string }> = [
    { label: 'company', value: formData.companyName },
    { label: 'phone', value: formData.phone },
    { label: 'email', value: formData.email },
    { label: 'website', value: formData.website },
  ]
  const filled = core.filter((item) => hasText(item.value))
  const links = STORE_LINKS.filter((link) => hasText(formData[link.field]))
  const names = [...filled.map((item) => item.label), ...links.map((link) => link.label)]

  return {
    tab: 'contact',
    label: 'Contact',
    status: 'optional',
    done: filled.length,
    total: core.length,
    detail: names.length > 0 ? joinList(names) : 'Nothing added yet',
  }
}

function hourDays(hoursJson: unknown): number {
  if (!hoursJson || typeof hoursJson !== 'object' || !('storeHours' in hoursJson)) return 0
  const storeHours = hoursJson.storeHours
  if (!storeHours || typeof storeHours !== 'object') return 0
  return Object.keys(storeHours).length
}

function joinList(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}
