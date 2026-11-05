export const STORE_TABS = [
  ['store', 'Store'],
  ['location', 'Location'],
  ['orders', 'Fulfillment'],
  ['contact', 'Contact'],
] as const

export type StoreTab = (typeof STORE_TABS)[number][0]
