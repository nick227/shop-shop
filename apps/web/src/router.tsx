/**
 * Router Configuration - Route definitions;
 */
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import { Layout } from './layouts/MainLayout'
import { VendorLayout } from './layouts/VendorLayout'
import { CustomerLayout } from './layouts/CustomerLayout'
import { AffiliateLayout } from './layouts/AffiliateLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { ProtectedRoute, lazyRoute } from './router/utils'

// Lazy load pages for code splitting;
import { lazy } from 'react'

const LoginPage = lazy(() => import('./pages/public/Login.page'))
const SignupPage = lazy(() => import('./pages/public/Signup.page'))
// Temporarily disable lazy loading for HomePage to fix render2 error;
import HomePage from './pages/public/Home.page'
const SearchPage = lazy(() => import('./pages/search/Search.page'))
const UnifiedSearchPage = lazy(() => import('./pages/search/UnifiedSearch.page'))
const StoreDetailPage = lazy(() => import('./pages/shared/StoreDetail.page'))
const ItemDetailPage = lazy(() => import('./pages/shared/ItemDetail.page'))
const CartPage = lazy(() => import('./pages/shared/Cart.page'))
const CheckoutPage = lazy(() => import('./pages/shared/Checkout.page'))
const TermsPage = lazy(() => import('./pages/public/Terms.page'))
const PrivacyPage = lazy(() => import('./pages/public/Privacy.page'))
const RefundPolicyPage = lazy(() => import('./pages/public/RefundPolicy.page'))
const OrderHistoryPage = lazy(() => import('./pages/customer/Orders.page'))
const OrderTrackingPage = lazy(() => import('./pages/customer/OrderTracking.page'))
const RiverPage = lazy(() => import('./pages/public/River.page'))

// Affiliate pages;
const BecomeAffiliatePage = lazy(() => import('./pages/public/BecomeAffiliate.page'))
const AffiliatePendingPage = lazy(() => import('./pages/affiliate/PendingApproval.page'))
const AffiliateDashboardPage = lazy(() => import('./pages/affiliate/Dashboard.page'))
const AffiliateCommissionsPage = lazy(() => import('./pages/affiliate/Commissions.page'))
const AffiliatePayoutsPage = lazy(() => import('./pages/affiliate/Payouts.page'))
const AffiliateSettingsPage = lazy(() => import('./pages/affiliate/Settings.page'))
const ReferralRedirectPage = lazy(() => import('./pages/public/ReferralRedirect.page'))
const AffiliateStatusPage = lazy(() => import('./pages/affiliate/Status.page'))

// Admin pages;
const AdminDashboardPage = lazy(() => import('./pages/admin/Dashboard.page'))
const AdminUsersPage = lazy(() => import('./pages/admin/Users.page'))
const AdminUserDetailPage = lazy(() => import('./pages/admin/UserDetail.page'))
const AdminVendorsPage = lazy(() => import('./pages/admin/Vendors.page'))
const AdminVendorApplicationsPage = lazy(() => import('./pages/admin/VendorApplications.page'))
const AdminVendorDetailPage = lazy(() => import('./pages/admin/VendorDetail.page'))
const AdminCatalogPage = lazy(() => import('./pages/admin/Catalog.page'))
const AdminAuditLogPage = lazy(() => import('./pages/admin/AuditLog.page'))
const AdminSettingsPage = lazy(() => import('./pages/admin/Settings.page'))
const AdminAffiliatesPage = lazy(() => import('./pages/admin/Affiliates.page'))
const AdminAffiliateDetailPage = lazy(() => import('./pages/admin/AffiliateDetail.page'))
const AdminAffiliatePayoutsPage = lazy(() => import('./pages/admin/AffiliatePayouts.page'))
const AdminFinancePage = lazy(() => import('./pages/admin/Finance.page'))
const AdminReferralEventsPage = lazy(() => import('./pages/admin/ReferralEvents.page'))
const AdminOrdersPage = lazy(() => import('./pages/admin/Orders.page'))
const AdminOrderDetailPage = lazy(() => import('./pages/admin/OrderDetail.page'))
const AdminDeliveryPage = lazy(() => import('./pages/admin/DeliveryOperations.page'))
const AdminRiverComposerPage = lazy(() => import('./pages/admin/RiverComposer.page'))

// Vendor pages;
const VendorDashboardPage = lazy(() => import('./pages/vendor/Dashboard.page'))
const VendorStoreOnboardingPage = lazy(() => import('./pages/vendor/StoreOnboarding.page'))
const StoreFormPage = lazy(() => import('./pages/vendor/StoreForm.page'))
const StoreItemsPage = lazy(() => import('./pages/vendor/StoreItems.page'))
const ItemFormPage = lazy(() => import('./pages/vendor/ItemForm.page'))
const StoreBundlesPage = lazy(() => import('./pages/vendor/StoreBundles.page'))
const StoreBundleEditorPage = lazy(() => import('./pages/vendor/StoreBundleEditor.page'))
const VendorOrdersPage = lazy(() => import('./pages/vendor/Orders.page'))
const VendorTeamPage = lazy(() => import('./pages/vendor/Team.page'))
const VendorDriversPage = lazy(() => import('./pages/vendor/Drivers.page'))
const VendorAffiliatesPage = lazy(() => import('./pages/vendor/Affiliates.page'))
const StoreRiverPage = lazy(() => import('./pages/vendor/StoreRiver.page'))
import VendorTeamStoreRedirectPage from './pages/vendor/VendorTeamStoreRedirect.page'

// Customer account pages;
const CustomerDashboardPage = lazy(() => import('./pages/customer/Dashboard.page'))
const CustomerProfilePage = lazy(() => import('./pages/customer/Profile.page'))
const CustomerDeliveriesPage = lazy(() => import('./pages/customer/Deliveries.page'))
const CustomerAddressesPage = lazy(() => import('./pages/customer/Addresses.page'))

// Driver pages
const DriverDeliveriesPage = lazy(() => import('./pages/driver/Deliveries.page'))

// Error pages;
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const ErrorPage = lazy(() => import('./pages/ErrorPage'))

/** Legacy `/river/*` (misnamed) → `/menu/*` (store menu = StoreDetail). */
function LegacyRiverToMenuRedirect() {
  const { storeId } = useParams<{ storeId: string }>()
  return <Navigate to={`/menu/${storeId}`} replace />
}

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter(
  [
    {
      element: <Layout />,
      errorElement: lazyRoute(ErrorPage),
      children: [
        // Auth routes;
        {
          path: '/login',
          element: lazyRoute(LoginPage),
          handle: { title: 'Login' },
        },
        {
          path: '/signup',
          element: lazyRoute(SignupPage),
          handle: { title: 'Sign Up' },
        },
        {
          path: '/terms',
          element: lazyRoute(TermsPage),
          handle: { title: 'Terms of Service' },
        },
        {
          path: '/privacy',
          element: lazyRoute(PrivacyPage),
          handle: { title: 'Privacy Policy' },
        },
        {
          path: '/refund-policy',
          element: lazyRoute(RefundPolicyPage),
          handle: { title: 'Refund Policy' },
        },
        // Vendor application routes;
        {
          path: '/vendor/apply',
          element: <Navigate to="/vendor/store/new" replace />,
        },
        {
          path: '/vendor/application-status',
          element: <Navigate to="/vendor/dashboard" replace />,
        },
        // Public shopping routes;
        {
          path: '/',
          element: <HomePage />,
          handle: { title: 'Home' },
        },
        {
          path: '/search',
          element: lazyRoute(UnifiedSearchPage),
          handle: { title: 'Search' },
        },
        {
          path: '/kitchen/:slug',
          element: lazyRoute(StoreDetailPage),
        },
        {
          path: '/items/:itemId',
          element: lazyRoute(ItemDetailPage),
        },
        {
          path: '/cart',
          element: lazyRoute(CartPage),
          handle: { title: 'Cart' },
        },
        {
          path: '/checkout',
          element: lazyRoute(CheckoutPage),
          handle: { title: 'Checkout' },
        },
        {
          path: '/orders/:id',
          element: lazyRoute(OrderTrackingPage),
        },
        {
          path: '/orders',
          element: <ProtectedRoute>{lazyRoute(OrderHistoryPage)}</ProtectedRoute>,
          handle: { title: 'Orders' },
        },
        {
          path: '/driver/deliveries',
          element: <ProtectedRoute>{lazyRoute(DriverDeliveriesPage)}</ProtectedRoute>,
          handle: { title: 'Driver Deliveries' },
        },
        /** Authenticated store menu (same UI as `/kitchen/:slug`; `:storeId` is store id or slug token). */
        {
          path: '/menu',
          element: <ProtectedRoute>{lazyRoute(StoreDetailPage)}</ProtectedRoute>,
          handle: { title: 'Store menu' },
        },
        {
          path: '/menu/:storeId',
          element: <ProtectedRoute>{lazyRoute(StoreDetailPage)}</ProtectedRoute>,
          handle: { title: 'Store menu' },
        },
        {
          path: '/river',
          element: lazyRoute(RiverPage),
          handle: { title: 'River' },
        },
        // Become an affiliate (public, no auth required — form handles login check);
        {
          path: '/become-affiliate',
          element: lazyRoute(BecomeAffiliatePage),
          handle: { title: 'Become an Affiliate' },
        },
        // Affiliate referral redirect (public);
        {
          path: '/r/:slugOrCode',
          element: lazyRoute(ReferralRedirectPage),
        },
        // Affiliate pending route (outside layout — no sidebar needed for pending state)
        {
          path: '/affiliate/pending',
          element: <ProtectedRoute>{lazyRoute(AffiliatePendingPage)}</ProtectedRoute>,
          handle: { title: 'Affiliate Pending' },
        },
        {
          path: '/affiliate/suspended',
          element: <ProtectedRoute>{lazyRoute(AffiliateStatusPage)}</ProtectedRoute>,
          handle: { title: 'Affiliate Suspended' },
        },
        {
          path: '/affiliate/unavailable',
          element: <ProtectedRoute>{lazyRoute(AffiliateStatusPage)}</ProtectedRoute>,
          handle: { title: 'Affiliate Unavailable' },
        },
        // Affiliate portal routes (wrapped in AffiliateLayout)
        {
          path: '/affiliate',
          element: (
            <ProtectedRoute>
              <AffiliateLayout />
            </ProtectedRoute>
          ),
          children: [
            {
              index: true,
              element: <Navigate to="/affiliate/dashboard" replace />,
            },
            {
              path: 'dashboard',
              element: lazyRoute(AffiliateDashboardPage),
              handle: { title: 'Affiliate Dashboard' },
            },
            {
              path: 'commissions',
              element: lazyRoute(AffiliateCommissionsPage),
              handle: { title: 'Affiliate Commissions' },
            },
            {
              path: 'payouts',
              element: lazyRoute(AffiliatePayoutsPage),
              handle: { title: 'Affiliate Payouts' },
            },
            {
              path: 'settings',
              element: lazyRoute(AffiliateSettingsPage),
              handle: { title: 'Affiliate Settings' },
            },
          ],
        },
        // Admin portal (ADMIN role required — single ProtectedRoute at layout level)
        {
          path: '/admin',
          element: (
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          ),
          children: [
            {
              index: true,
              element: lazyRoute(AdminDashboardPage),
              handle: { title: 'Admin Dashboard' },
            },
            {
              path: 'users',
              element: lazyRoute(AdminUsersPage),
              handle: { title: 'Admin - Users' },
            },
            {
              path: 'users/:userId',
              element: lazyRoute(AdminUserDetailPage),
              handle: { title: 'Admin - User Detail' },
            },
            {
              path: 'vendors',
              element: lazyRoute(AdminVendorsPage),
              handle: { title: 'Admin - Vendors' },
            },
            {
              path: 'vendors/applications',
              element: lazyRoute(AdminVendorApplicationsPage),
              handle: { title: 'Admin - Vendor Applications' },
            },
            {
              path: 'vendors/:storeId',
              element: lazyRoute(AdminVendorDetailPage),
              handle: { title: 'Admin - Vendor Detail' },
            },
            {
              path: 'catalog',
              element: lazyRoute(AdminCatalogPage),
              handle: { title: 'Admin - Catalog' },
            },
            {
              path: 'river',
              element: lazyRoute(AdminRiverComposerPage),
              handle: { title: 'Admin - River' },
            },
            {
              path: 'audit',
              element: lazyRoute(AdminAuditLogPage),
              handle: { title: 'Admin - Audit Log' },
            },
            {
              path: 'settings',
              element: lazyRoute(AdminSettingsPage),
              handle: { title: 'Admin - Settings' },
            },
            {
              path: 'affiliates',
              element: lazyRoute(AdminAffiliatesPage),
              handle: { title: 'Admin - Affiliates' },
            },
            {
              path: 'affiliates/:affiliateId',
              element: lazyRoute(AdminAffiliateDetailPage),
              handle: { title: 'Admin - Affiliate Detail' },
            },
            {
              path: 'affiliate-payouts',
              element: lazyRoute(AdminAffiliatePayoutsPage),
              handle: { title: 'Admin - Affiliate Payouts' },
            },
            {
              path: 'finance',
              element: lazyRoute(AdminFinancePage),
              handle: { title: 'Admin - Finance' },
            },
            {
              path: 'referral-events',
              element: lazyRoute(AdminReferralEventsPage),
              handle: { title: 'Admin - Referral Events' },
            },
            {
              path: 'orders',
              element: lazyRoute(AdminOrdersPage),
              handle: { title: 'Admin - Orders' },
            },
            {
              path: 'orders/:orderId',
              element: lazyRoute(AdminOrderDetailPage),
              handle: { title: 'Admin - Order Detail' },
            },
            {
              path: 'delivery',
              element: lazyRoute(AdminDeliveryPage),
              handle: { title: 'Admin - Delivery' },
            },
          ],
        },
        // Vendor routes (wrapped in VendorLayout)
        // Open vendor model: any authenticated user can create or manage their stores.
        {
          path: '/vendor',
          element: (
            <ProtectedRoute>
              <VendorLayout />
            </ProtectedRoute>
          ),
          children: [
            {
              index: true,
              element: <Navigate to="/vendor/dashboard" replace />,
            },
            {
              path: 'dashboard',
              element: lazyRoute(VendorDashboardPage),
              handle: { title: 'Vendor Dashboard' },
            },
            {
              path: 'onboarding/store',
              element: lazyRoute(VendorStoreOnboardingPage),
              handle: { title: 'Store Onboarding' },
            },
            {
              path: 'stores/new',
              element: lazyRoute(StoreFormPage),
              handle: { title: 'New Store' },
            },
            {
              path: 'store/new',
              element: lazyRoute(StoreFormPage),
              handle: { title: 'New Store' },
            },
            {
              path: 'stores/:storeId/edit',
              element: lazyRoute(StoreFormPage),
              handle: { title: 'Edit Store' },
            },
            {
              path: 'stores/:storeId/items',
              element: lazyRoute(StoreItemsPage),
              handle: { title: 'Store Items' },
            },
            {
              path: 'stores/:storeId/river',
              element: lazyRoute(StoreRiverPage),
              handle: { title: 'River' },
            },
            {
              path: 'stores/:storeId/items/new',
              element: lazyRoute(ItemFormPage),
              handle: { title: 'New Item' },
            },
            {
              path: 'stores/:storeId/items/:itemId/edit',
              element: lazyRoute(ItemFormPage),
              handle: { title: 'Edit Item' },
            },
            {
              path: 'stores/:storeId/bundles',
              element: lazyRoute(StoreBundlesPage),
              handle: { title: 'Store Bundles' },
            },
            {
              path: 'stores/:storeId/bundles/new',
              element: lazyRoute(StoreBundleEditorPage),
              handle: { title: 'Create Bundle' },
            },
            {
              path: 'stores/:storeId/bundles/:bundleId/edit',
              element: lazyRoute(StoreBundleEditorPage),
              handle: { title: 'Edit Bundle' },
            },
            {
              path: 'orders',
              element: lazyRoute(VendorOrdersPage),
              handle: { title: 'Vendor Orders' },
            },
            {
              path: 'affiliates',
              element: lazyRoute(VendorAffiliatesPage),
              handle: { title: 'Affiliate Sales' },
            },
            {
              path: 'team',
              element: lazyRoute(VendorTeamPage),
              handle: { title: 'Team' },
            },
            {
              path: 'drivers',
              element: lazyRoute(VendorDriversPage),
              handle: { title: 'Drivers' },
            },
            {
              path: 'stores/:storeId/team',
              element: <VendorTeamStoreRedirectPage />,
              handle: { title: 'Team' },
            },
          ],
        },
        // Customer account routes (wrapped in CustomerLayout)
        {
          path: '/account',
          element: (
            <ProtectedRoute>
              <CustomerLayout />
            </ProtectedRoute>
          ),
          children: [
            {
              index: true,
              element: <Navigate to="/account/dashboard" replace />,
            },
            {
              path: 'dashboard',
              element: lazyRoute(CustomerDashboardPage),
              handle: { title: 'Dashboard' },
            },
            {
              path: 'orders',
              element: lazyRoute(OrderHistoryPage),
              handle: { title: 'Orders' },
            },
            {
              path: 'deliveries',
              element: lazyRoute(CustomerDeliveriesPage),
              handle: { title: 'Deliveries' },
            },
            {
              path: 'profile',
              element: lazyRoute(CustomerProfilePage),
              handle: { title: 'Profile' },
            },
            {
              path: 'addresses',
              element: lazyRoute(CustomerAddressesPage),
              handle: { title: 'Addresses' },
            },
          ],
        },
        {
          path: '*',
          element: lazyRoute(NotFoundPage),
          handle: { title: 'Not Found' },
        },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
)
