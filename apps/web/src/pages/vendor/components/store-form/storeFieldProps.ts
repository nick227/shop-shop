import type { StoreFormData } from '@api/types'

export interface StoreFieldProps {
  readonly formData: StoreFormData
  readonly onChange: <K extends keyof StoreFormData>(field: K, value: StoreFormData[K]) => void
}

export function hasText(val: unknown): boolean {
  return typeof val === 'string' && val.trim().length > 0
}

/** Initial form data stores unset coordinates as "0". */
export function hasCoordinate(val: unknown): boolean {
  if (!hasText(val)) return false
  const n = Number(val)
  return Number.isFinite(n) && n !== 0
}
