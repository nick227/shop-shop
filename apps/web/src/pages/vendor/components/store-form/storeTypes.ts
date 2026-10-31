import type { StoreFormData } from '@api/types'

export const STORE_TYPES: ReadonlyArray<{ value: StoreFormData['storeType']; label: string }> = [
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'CONVENIENCE', label: 'Convenience store' },
  { value: 'GROCERY', label: 'Grocery store' },
  { value: 'HOME_KITCHEN', label: 'Home kitchen' },
  { value: 'BAKERY', label: 'Bakery' },
  { value: 'RETAIL', label: 'Retail store' },
  { value: 'OTHER', label: 'Other' },
]

export function storeTypeLabel(value: StoreFormData['storeType']): string {
  return STORE_TYPES.find((type) => type.value === value)?.label ?? 'Store'
}
