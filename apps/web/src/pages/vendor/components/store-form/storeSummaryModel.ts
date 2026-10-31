import type { StoreFormData } from '@api/types'
import { hasText } from './storeFieldProps'
import { STORE_LINKS } from './storeLinks'
import type { StoreTab } from './storeTabs'
import { storeTypeLabel } from './storeTypes'

export interface SummaryRow {
  readonly tab: StoreTab
  readonly label: string
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

function storeRow(formData: StoreFormData): SummaryRow {
  const description = (formData.description ?? '').trim()
  return {
    tab: 'store',
    label: 'Store',
    detail: [storeTypeLabel(formData.storeType), description].filter(hasText).join(' · '),
  }
}

function locationRow(formData: StoreFormData): SummaryRow {
  const filled = [formData.addressStreet, formData.addressCity, formData.addressState, formData.addressZip].filter(hasText)
  const place =
    filled.length === 4
      ? `${formData.addressStreet}, ${formData.addressCity}, ${formData.addressState} ${formData.addressZip}`
      : filled.join(', ')
  const days = hourDays(formData.hoursJson)
  return {
    tab: 'location',
    label: 'Location',
    detail: [place, days > 0 ? `${days} days` : ''].filter(hasText).join(' · '),
  }
}

function ordersRow(formData: StoreFormData): SummaryRow {
  const facts = [
    formData.deliveryEnabled ? 'Delivery' : '',
    formData.pickupEnabled ? 'Pickup' : '',
    formData.prepTimeMin > 0 ? `${formData.prepTimeMin} min` : '',
    formData.deliveryEnabled && Number(formData.deliveryDistance) > 0 ? `${formData.deliveryDistance} mi` : '',
    formData.deliveryEnabled && hasText(formData.deliveryCharge) ? `$${formData.deliveryCharge}` : '',
    formData.isPublished ? 'Visible' : '',
  ].filter(hasText)

  return { tab: 'orders', label: 'Orders', detail: facts.join(' · ') }
}

function photosRow(formData: StoreFormData, pendingCount: number): SummaryRow {
  const detail = hasText(formData.imageUrl)
    ? 'Thumbnail'
    : pendingCount > 0
      ? `${pendingCount} ${pendingCount === 1 ? 'photo' : 'photos'}`
      : ''

  return { tab: 'photos', label: 'Photos', detail }
}

function contactRow(formData: StoreFormData): SummaryRow {
  const names = [
    hasText(formData.companyName) ? 'Company' : '',
    hasText(formData.phone) ? 'Phone' : '',
    hasText(formData.email) ? 'Email' : '',
    hasText(formData.website) ? 'Website' : '',
    ...STORE_LINKS.filter((link) => hasText(formData[link.field])).map((link) => link.label),
  ].filter(hasText)

  return { tab: 'contact', label: 'Contact', detail: names.join(', ') }
}

function hourDays(hoursJson: unknown): number {
  if (!hoursJson || typeof hoursJson !== 'object' || !('storeHours' in hoursJson)) return 0
  const storeHours = hoursJson.storeHours
  if (!storeHours || typeof storeHours !== 'object') return 0
  return Object.keys(storeHours).length
}
