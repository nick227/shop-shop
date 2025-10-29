/**
 * Centralized Tailwind Class Mappings
 * 
 * Provides common Tailwind class combinations for components
 * that were migrated from CSS modules.
 * 
 * Benefits:
 * - DRY: Centralized style definitions
 * - Type-safe: TypeScript autocomplete
 * - Maintainable: Update in one place
 * - Modular: Organized by category and feature
 * 
 * Usage:
 * ```tsx
 * import { styles } from '@utils/tailwind-classes'
 * 
 * <div className={styles['container']}>
 *   <h1 className={styles['title']}>Title</h1>
 * </div>
 * ```
 */

import { layout } from './layout'
import { components } from './components'
import { forms } from './forms'
import { lists } from './lists'
import { states } from './states'
import { utilities } from './utilities'

// Feature-specific styles
import { carousel } from './features/carousel'
import { cart } from './features/cart'
import { checkout } from './features/checkout'
import { orders } from './features/orders'
import { river } from './features/river'
import { stores } from './features/stores'
import { admin } from './features/admin'
import { products } from './features/products'
import { search } from './features/search'

/**
 * Unified styles object combining all categories
 * Provides single import point for all Tailwind class mappings
 */
export const styles = {
  ...layout,
  ...components,
  ...forms,
  ...lists,
  ...states,
  ...utilities,
  ...carousel,
  ...cart,
  ...checkout,
  ...orders,
  ...river,
  ...stores,
  ...admin,
  ...products,
  ...search,
} as const

// Type for the styles object
export type Styles = typeof styles

// Re-export modules for granular imports if needed



export {layout} from './layout'
export {components} from './components'
export {forms} from './forms'
export {lists} from './lists'
export {states} from './states'
export {utilities} from './utilities'
export {carousel} from './features/carousel'
export {cart} from './features/cart'
export {checkout} from './features/checkout'
export {orders} from './features/orders'
export {river} from './features/river'
export {stores} from './features/stores'
export {admin} from './features/admin'
export {products} from './features/products'
export {search} from './features/search'