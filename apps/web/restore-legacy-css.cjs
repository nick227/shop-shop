/**
 * Restore Legacy CSS Modules (Stub Version)
 * Creates minimal CSS modules for components still using them
 * This allows gradual migration without breaking the app
 */

const fs = require('fs')
const path = require('path')

const stubCss = `/* Legacy CSS Module Stub - Migrated to Tailwind */
/* This file provides backward compatibility */
/* Please update the component to use Tailwind classes */

.container { @apply p-4; }
.header { @apply mb-4; }
.title { @apply text-2xl font-bold; }
.content { @apply space-y-4; }
.button { @apply px-4 py-2 rounded; }
.input { @apply px-3 py-2 border rounded; }
.card { @apply p-4 border rounded-lg; }
.grid { @apply grid gap-4; }
.list { @apply space-y-2; }
.item { @apply p-2; }
.row { @apply flex items-center gap-2; }
.icon { @apply w-5 h-5; }
.badge { @apply px-2 py-1 text-xs rounded; }
.image { @apply w-full h-auto; }
.label { @apply text-sm font-medium; }
.value { @apply text-base; }
.footer { @apply mt-4; }
.actions { @apply flex gap-2; }
.drawer { @apply p-4; }
.modal { @apply fixed inset-0; }
.overlay { @apply fixed inset-0 bg-black bg-opacity-50; }
.loading { @apply flex items-center justify-center p-8; }
.error { @apply text-red-600; }
.empty { @apply text-gray-500 text-center; }
`

// List of CSS modules to create stubs for
const cssModulesToCreate = [
  // UI Components
  'src/components/ui/Alert/Alert.module.css',
  'src/components/ui/Badge/Badge.module.css',
  'src/components/ui/Button/Button.module.css',
  'src/components/ui/Card/Card.module.css',
  'src/components/ui/Carousel/Carousel.module.css',
  'src/components/ui/DataState/DataState.module.css',
  'src/components/ui/Drawer/Drawer.module.css',
  'src/components/ui/EmptyState/EmptyState.module.css',
  'src/components/ui/ErrorState/ErrorState.module.css',
  'src/components/ui/Form/Form.module.css',
  'src/components/ui/FormField/FormField.module.css',
  'src/components/ui/Image/Image.module.css',
  'src/components/ui/Input/Input.module.css',
  'src/components/ui/LoadingState/LoadingState.module.css',
  'src/components/ui/Modal/Modal.module.css',
  'src/components/ui/Pagination/Pagination.module.css',
  'src/components/ui/PendingBadge/PendingBadge.module.css',
  'src/components/ui/SearchInput/SearchInput.module.css',
  'src/components/ui/SectionHeader/SectionHeader.module.css',
  'src/components/ui/SkeletonCard/SkeletonCard.module.css',
  'src/components/ui/Spinner/Spinner.module.css',
  'src/components/ui/StatCard/StatCard.module.css',
  'src/components/ui/Toast/Toast.module.css',
  'src/components/ui/Toast/ToastContainer.module.css',
  
  // Feature Components
  'src/features/auth/LoginForm/LoginForm.module.css',
  'src/features/auth/SignupForm/SignupForm.module.css',
  'src/features/cart/components/CartDrawer/CartDrawer.module.css',
  'src/features/cart/components/CartItem/CartItem.module.css',
  'src/features/checkout/components/AddressCard/AddressCard.module.css',
  'src/features/checkout/components/PaymentSection/PaymentSection.module.css',
  'src/features/checkout/components/TipPrompt/TipPrompt.module.css',
  'src/features/items/components/ItemCard/ItemCard.module.css',
  'src/features/items/components/ItemCarouselCompact/ItemCarouselCompact.module.css',
  'src/features/stores/components/LocationSearch/LocationSearch.module.css',
  'src/features/stores/components/StoreCard/StoreCard.module.css',
  'src/features/stores/components/StoreCard/StoreCardCompact.module.css',
  'src/features/stores/components/StoreCard/StoreCardExpanded.module.css',
  'src/features/stores/components/StoreGrid/StoreGrid.module.css',
  'src/features/stores/components/StoreHeader/StoreHeader.module.css',
  'src/features/stores/components/StoreHeroCard/StoreHeroCard.module.css',
  'src/features/stores/components/StoreList/StoreList.module.css',
  'src/features/stores/components/StoreMap/StoreMap.module.css',
  
  // Pages
  'src/pages/CheckoutPage/CheckoutPage.module.css',
  'src/pages/ItemDetailPage/ItemDetailPage.module.css',
  'src/pages/OrderHistoryPage/OrderHistoryPage.module.css',
  'src/pages/StoreDetailPage/StoreDetailPage.module.css',
]

let createdCount = 0

console.log('🔧 Restoring legacy CSS modules (stubs)...\n')

cssModulesToCreate.forEach(file => {
  const filePath = path.join(__dirname, file)
  const dir = path.dirname(filePath)
  
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    // Only create if file doesn't exist
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, stubCss, 'utf8')
      console.log(`✅ Created stub: ${file}`)
      createdCount++
    } else {
      console.log(`⏭️  Already exists: ${file}`)
    }
  } catch (error) {
    console.error(`❌ Error creating ${file}:`, error.message)
  }
})

console.log(`\n📊 Summary:`)
console.log(`   Created: ${createdCount}`)
console.log(`   Total: ${cssModulesToCreate.length}`)
console.log(`\n✨ Legacy CSS stubs restored!`)
console.log(`\n⚠️  Note: These are minimal stubs using Tailwind @apply.`)
console.log(`   Components should be migrated to use Tailwind classes directly.`)

