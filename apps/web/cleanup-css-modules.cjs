/**
 * Cleanup script - Delete old CSS modules
 * Run: node cleanup-css-modules.cjs
 */

const fs = require('fs')
const path = require('path')

const cssModulesToDelete = [
  // Pages
  'src/pages/AuthPage.module.css',
  'src/pages/HomePageNew.module.css',
  'src/pages/HomePageNew.optimized.module.css',
  'src/pages/LoginPageNew.module.css',
  'src/pages/CartPage/CartPage.module.css',
  'src/pages/CheckoutPage/CheckoutPage.module.css',
  'src/pages/StoreDetailPage/StoreDetailPage.module.css',
  'src/pages/ItemDetailPage/ItemDetailPage.module.css',
  'src/pages/OrderHistoryPage/OrderHistoryPage.module.css',
  'src/pages/CustomerDashboardPage/CustomerDashboardPage.module.css',
  'src/pages/VendorDashboardPage/VendorDashboardPage.module.css',
  
  // Components
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
  
  // Features
  'src/features/auth/LoginForm/LoginForm.module.css',
  'src/features/auth/SignupForm/SignupForm.module.css',
  'src/features/cart/components/CartDrawer/CartDrawer.module.css',
  'src/features/cart/components/CartItem/CartItem.module.css',
  'src/features/cart/components/CartItemRow/CartItemRow.module.css',
  'src/features/cart/components/CartSummary/CartSummary.module.css',
  'src/features/cart/components/CartWidget/CartWidget.module.css',
  'src/features/items/components/ItemCard/ItemCard.module.css',
  'src/features/items/components/ItemCarouselCompact/ItemCarouselCompact.module.css',
  'src/features/stores/components/StoreCard/StoreCard.module.css',
  'src/features/stores/components/StoreCard/StoreCardCompact.module.css',
  'src/features/stores/components/StoreCard/StoreCardExpanded.module.css',
  'src/features/stores/components/StoreGrid/StoreGrid.module.css',
  'src/features/stores/components/StoreHeader/StoreHeader.module.css',
  'src/features/stores/components/StoreList/StoreList.module.css',
  'src/features/stores/components/StoreMap/StoreMap.module.css',
]

let deletedCount = 0
let notFoundCount = 0

console.log('🧹 Cleaning up CSS modules...\n')

cssModulesToDelete.forEach(file => {
  const filePath = path.join(__dirname, file)
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`✅ Deleted: ${file}`)
      deletedCount++
    } else {
      console.log(`⚠️  Not found: ${file}`)
      notFoundCount++
    }
  } catch (error) {
    console.error(`❌ Error deleting ${file}:`, error.message)
  }
})

console.log(`\n📊 Summary:`)
console.log(`   Deleted: ${deletedCount}`)
console.log(`   Not found: ${notFoundCount}`)
console.log(`   Total: ${cssModulesToDelete.length}`)
console.log(`\n✨ Cleanup complete!`)

