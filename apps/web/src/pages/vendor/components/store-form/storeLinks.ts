import type { StoreFormData } from '@api/types'

export const STORE_LINKS = [
  { field: 'customDomain', label: 'Custom domain', placeholder: 'https://mybakery.com' },
  { field: 'socialYoutube', label: 'YouTube', placeholder: '@YourChannel' },
  { field: 'socialInstagram', label: 'Instagram', placeholder: '@yourhandle' },
  { field: 'socialFacebook', label: 'Facebook', placeholder: 'YourPageName' },
  { field: 'socialTiktok', label: 'TikTok', placeholder: '@yourhandle' },
  { field: 'socialTwitter', label: 'X', placeholder: '@yourhandle' },
  { field: 'socialSnapchat', label: 'Snapchat', placeholder: '@yourhandle' },
  { field: 'socialWhatsapp', label: 'WhatsApp', placeholder: '+15551234567' },
  { field: 'socialDiscord', label: 'Discord', placeholder: 'https://discord.gg/invite' },
] as const satisfies ReadonlyArray<{
  field: keyof StoreFormData
  label: string
  placeholder: string
}>

export type StoreLinkField = (typeof STORE_LINKS)[number]['field']
