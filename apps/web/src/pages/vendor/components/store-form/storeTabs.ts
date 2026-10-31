export const STORE_TABS = [
  ['summary', 'Summary'],
  ['store', 'Store'],
  ['location', 'Location'],
  ['orders', 'Orders'],
  ['photos', 'Photos'],
  ['contact', 'Contact'],
] as const

export type StoreTab = (typeof STORE_TABS)[number][0]
