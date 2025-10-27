/**
 * Bundle Feature Exports
 * High-performance bundle management system with optimized components and hooks
 */

// Core Components
export { BundleList } from './components/BundleList'
export { BundleFormModal } from './components/BundleFormModal'
export { BundleItemSelector } from './components/BundleItemSelector'
export { BundlePricing } from './components/BundlePricing'
export { BundleSavingsBadge } from './components/BundleSavingsBadge'

// Integration Components
export { ItemBundleControls } from './components/ItemBundleControls'
export { EnhancedItemCard } from './components/EnhancedItemCard'

// Customer Components
export { BundleCard, BundleGrid, BundleCarousel } from './components/customer'

// Optimized Hooks
export { useBundleManagement } from './hooks/useBundleManagement'
export { useBundlePricing } from './hooks/useBundlePricing'

// Pages
export { VendorBundlesPage } from './pages/VendorBundlesPage'

// Types & Utilities
export type { 
  BundleFormData, 
  BundleManagementOptions, 
  BundleDisplayData,
  formDataToCreateInput,
  formDataToUpdateInput,
  bundleToFormData
} from './types/bundle.types'
export type { BundlePricingResult, BundlePricingOptions } from './hooks/useBundlePricing'
