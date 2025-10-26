// Resource definitions registry
export * from './user.resource.js'
export * from './promotion.resource.js'
export * from './store.resource.js'
export * from './item.resource.js'
export * from './order.resource.js'
export * from './cart.resource.js'
export * from './address.resource.js'
// export * from './river.resource.js' // DISABLED: Using custom routes
export * from './media.resource.js'
export * from './bundle.resource.js'

import { userResource } from './user.resource.js'
import { promotionResource } from './promotion.resource.js'
import { storeResource } from './store.resource.js'
import { itemResource } from './item.resource.js'
import { orderResource } from './order.resource.js'
import { cartResource } from './cart.resource.js'
import { addressResource } from './address.resource.js'
// import { riverResource } from './river.resource.js' // DISABLED: Using custom routes
import { mediaResource } from './media.resource.js'
import { bundleResource } from './bundle.resource.js'

// Central registry of all resources
// Add new resources here to auto-generate CRUD routes and OpenAPI schemas
export const ALL_RESOURCES = [
  userResource,
  promotionResource,
  storeResource,
  itemResource,
  orderResource, // Now included - has customHooks for complex business logic
  cartResource,
  addressResource,
  // riverResource, // Social feed (posts, comments, likes) - DISABLED: Using custom routes
  // mediaResource, // Media assets - handled by custom routes due to multipart uploads
  bundleResource, // Bundle management with pricing logic
] as const

export type ResourceName = typeof ALL_RESOURCES[number]['name']

