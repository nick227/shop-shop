// @ts-nocheck
import type { StoreFormData } from '@shared/types/types/form-types'
import type { StoreResponse } from '@api/types'

export function createInitialStoreFormData(): StoreFormData {
  return {
    name: '',
    slug: '',
    description: '',
    storeType: 'RESTAURANT',
    companyName: '',
    taxId: '',
    phone: '',
    email: '',
    website: '',
    isPublished: false,
    status: 'ACTIVE',
    disabledAt: null,
    disabledByUserId: null,
    disabledReason: null,
    deliveryEnabled: true,
    pickupEnabled: true,
    prepTimeMin: 0,
    deliveryDistance: '0',
    deliveryCharge: '0',
    latitude: '0',
    longitude: '0',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    addressCountry: 'US',
    commissionRate: '0'
  }
}

export function transformStoreToFormData(store: StoreResponse): StoreFormData {
  return {
    name: store.name ?? '',
    slug: store.slug ?? '',
    description: store.description ?? '',
    storeType: (store as any).storeType ?? 'RESTAURANT',
    companyName: store.companyName ?? '',
    taxId: store.taxId ?? '',
    phone: store.phone ?? '',
    email: store.email ?? '',
    website: store.website ?? '',
    isPublished: store.isPublished ?? false,
    status: (store as any).status ?? 'ACTIVE',
    disabledAt: (store as any).disabledAt ?? null,
    disabledByUserId: (store as any).disabledByUserId ?? null,
    disabledReason: (store as any).disabledReason ?? null,
    deliveryEnabled: store.deliveryEnabled ?? true,
    pickupEnabled: store.pickupEnabled ?? true,
    prepTimeMin: store.prepTimeMin ?? 0,
    deliveryDistance: store.deliveryDistance ?? '0',
    deliveryCharge: store.deliveryCharge ?? '0',
    latitude: store.latitude ?? '0',
    longitude: store.longitude ?? '0',
    addressStreet: store.addressStreet ?? '',
    addressCity: store.addressCity ?? '',
    addressState: store.addressState ?? '',
    addressZip: store.addressZip ?? '',
    addressCountry: store.addressCountry ?? 'US',
    commissionRate: store.commissionRate ?? '0'
  }
}

function cleanFormData<T extends Record<string, any>>(
  formData: T,
  stringFields: (keyof T)[],
  numberFields: (keyof T)[] = [],
  booleanFields: (keyof T)[] = []
): T {
  const cleaned = { ...formData }

  for (const field of stringFields) {
    const value = cleaned[field]
    if (typeof value === 'string') {
      cleaned[field] = value?.trim() as T[keyof T]
    }
  }

  for (const field of numberFields) {
    const value = cleaned[field]
    if (typeof value === 'string') {
      const num = Number.parseFloat(value)
      cleaned[field] = (isNaN(num) ? 0 : num) as T[keyof T]
    }
  }

  for (const field of booleanFields) {
    const value = cleaned[field]
    if (typeof value === 'string') {
      cleaned[field] = (value === 'true' || value === '1') as T[keyof T]
    }
  }

  return cleaned
}

export function cleanStoreFormData(formData: StoreFormData): StoreFormData {
  return cleanFormData(
    formData,
    ['name', 'slug', 'description', 'storeType', 'companyName', 'taxId', 'phone', 'email', 'website', 'status', 'disabledReason', 'deliveryDistance', 'deliveryCharge', 'latitude', 'longitude', 'addressStreet', 'addressCity', 'addressState', 'addressZip', 'addressCountry', 'commissionRate'],
    ['prepTimeMin'],
    ['isPublished', 'deliveryEnabled', 'pickupEnabled']
  )
}
