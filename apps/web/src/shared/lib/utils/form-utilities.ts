// @ts-nocheck
import type { StoreFormData } from '@shared/types/types/form-types'
import type { CreateStoreInput, StoreResponse } from '@api/types'

/** Optional fields omitted from payload when empty */
const STORE_PAYLOAD_STRIP_IF_EMPTY: (keyof StoreFormData)[] = [
  'latitude',
  'longitude',
  'deliveryDistance',
  'deliveryCharge',
  'commissionRate',
  'imageUrl',
  'customDomain',
]

const SOCIAL_FIELD_MAP: Record<string, keyof StoreFormData> = {
  youtube:   'socialYoutube',
  instagram: 'socialInstagram',
  facebook:  'socialFacebook',
  tiktok:    'socialTiktok',
  twitter:   'socialTwitter',
  whatsapp:  'socialWhatsapp',
  discord:   'socialDiscord',
  snapchat:  'socialSnapchat',
}

export function storePayloadFromFormData(formData: StoreFormData): CreateStoreInput {
  const cleaned = cleanStoreFormData(formData)
  const payload = { ...cleaned } as Record<string, unknown>

  for (const key of STORE_PAYLOAD_STRIP_IF_EMPTY) {
    const v = payload[key]
    if (typeof v === 'string' && v.trim() === '') {
      delete payload[key]
    }
  }

  // Assemble socialLinksJson from flat social* fields and remove them from payload
  const socialLinks: Record<string, string> = {}
  for (const [platform, formKey] of Object.entries(SOCIAL_FIELD_MAP)) {
    const val = (payload[formKey] as string | undefined)?.trim()
    if (val) socialLinks[platform] = val
    delete payload[formKey]
  }
  if (Object.keys(socialLinks).length > 0) {
    payload.socialLinksJson = socialLinks
  }

  return payload as CreateStoreInput
}

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
    customDomain: '',
    socialYoutube: '',
    socialInstagram: '',
    socialFacebook: '',
    socialTiktok: '',
    socialTwitter: '',
    socialWhatsapp: '',
    socialDiscord: '',
    socialSnapchat: '',
    imageUrl: '',
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
    customDomain: (store as any).customDomain ?? '',
    socialYoutube:   (store as any).socialLinksJson?.youtube   ?? '',
    socialInstagram: (store as any).socialLinksJson?.instagram ?? '',
    socialFacebook:  (store as any).socialLinksJson?.facebook  ?? '',
    socialTiktok:    (store as any).socialLinksJson?.tiktok    ?? '',
    socialTwitter:   (store as any).socialLinksJson?.twitter   ?? '',
    socialWhatsapp:  (store as any).socialLinksJson?.whatsapp  ?? '',
    socialDiscord:   (store as any).socialLinksJson?.discord   ?? '',
    socialSnapchat:  (store as any).socialLinksJson?.snapchat  ?? '',
    imageUrl: (store as any).imageUrl ?? '',
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
    ['name', 'slug', 'description', 'storeType', 'companyName', 'taxId', 'phone', 'email', 'website', 'customDomain', 'socialYoutube', 'socialInstagram', 'socialFacebook', 'socialTiktok', 'socialTwitter', 'socialWhatsapp', 'socialDiscord', 'socialSnapchat', 'imageUrl', 'status', 'disabledReason', 'deliveryDistance', 'deliveryCharge', 'latitude', 'longitude', 'addressStreet', 'addressCity', 'addressState', 'addressZip', 'addressCountry', 'commissionRate'],
    ['prepTimeMin'],
    ['isPublished', 'deliveryEnabled', 'pickupEnabled']
  )
}
